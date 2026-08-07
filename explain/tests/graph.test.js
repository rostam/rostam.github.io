/**
 * graph.test.js — the graph constructors and traversals in graph.js.
 * These run the shipped code unmodified.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { createEnvironment, run, runPlain, plain } = require('./harness');
const mm = require('./matrix-market');
const ref = require('./reference');

const env = createEnvironment();

/** Convenience: build edges from 0-based [src, tgt] pairs. */
const E = (...pairs) => pairs.map(([src, tgt]) => ({ src, tgt }));

test('graph() builds a symmetric adjacency structure', () => {
    env.__edges = E([0, 1], [1, 2]);
    const g = runPlain(env, 'graph(__edges, 3, __edges.length)');

    assert.deepEqual(g.vertices[0].edges, [1]);
    assert.deepEqual(g.vertices[1].edges.sort(), [0, 2]);
    assert.deepEqual(g.vertices[2].edges, [1]);
});

test('graph() de-duplicates repeated edges', () => {
    env.__edges = E([0, 1], [0, 1], [1, 0]);
    const g = runPlain(env, 'graph(__edges, 2, __edges.length)');

    assert.deepEqual(g.vertices[0].edges, [1]);
    assert.deepEqual(g.vertices[1].edges, [0]);
});

test('graph() drops diagonal entries instead of making self-loops', () => {
    // Every shipped .mtx has an explicit diagonal. These algorithms all work
    // on simple graphs, and a self-loop made a vertex its own neighbour —
    // which is what let d2_neighbors() mistake direct neighbours for
    // distance-2 ones.
    env.__edges = E([0, 0], [0, 1]);
    const g = runPlain(env, 'graph(__edges, 2, __edges.length)');

    assert.ok(!g.vertices[0].edges.includes(0),
        'the diagonal entry (0,0) does not reach the adjacency list');
    assert.deepEqual(g.vertices[0].edges, [1], 'the off-diagonal entry survives');
});

test('graph() from a shipped matrix matches the reference adjacency exactly', () => {
    const parsed = mm.readStrict(mm.load('cholesky.mtx'));
    const shipped = mm.readAsShipped(mm.load('cholesky.mtx'));

    env.__edges = shipped.edges;
    const g = runPlain(env, 'graph(__edges, 6, __edges.length)');

    const selfLooped = g.vertices
        .map((v, idx) => (v.edges.includes(idx) ? idx : null))
        .filter(x => x !== null);
    assert.deepEqual(selfLooped, [],
        'cholesky.mtx has a full diagonal, and none of it reaches the adjacency');

    const expected = parsed.adjacency();
    for (let v = 0; v < 6; v++) {
        assert.deepEqual(g.vertices[v].edges.slice().sort((a, b) => a - b), expected[v],
            `vertex ${v} matches the reference adjacency`);
    }

    // init_edges still carries the full pattern, so the matrix view is intact.
    assert.equal(g.init_edges.length, shipped.edges.length);
});

test('cigraph() on a symmetric matrix agrees with the reference CIG', () => {
    const parsed = mm.readStrict(mm.load('nestedDissection3.mtx'));
    const shipped = mm.readAsShipped(mm.load('nestedDissection3.mtx'));

    env.__edges = shipped.edges;
    const g = runPlain(env, 'cigraph(__edges, 9, __edges.length)');

    const expected = ref.columnIntersectionGraph(
        [...parsed.pattern()].map(k => {
            const [row, col] = k.split(',').map(Number);
            return { row, col };
        }),
        9
    );

    for (let v = 0; v < 9; v++) {
        assert.deepEqual(
            g.vertices[v].edges.slice().sort((a, b) => a - b),
            expected[v],
            `column ${v} has the right CIG neighbours`
        );
    }
});

test('cigraph() indexes COLUMNS, so it is right on a nonsymmetric pattern too', () => {
    //       col 0 1 2
    // row 0 [  1 1 0 ]   columns 0 and 1 share row 0
    // row 1 [  0 0 1 ]   column 2 shares no row with either
    // row 2 [  0 0 0 ]
    //
    // This used to group by src (= row), building the ROW intersection graph.
    // The two coincide for a structurally symmetric pattern — which every
    // shipped matrix is — but not here, and the module colours columns.
    env.__edges = E([0, 0], [0, 1], [1, 2]);
    const g = runPlain(env, 'cigraph(__edges, 3, __edges.length)');

    const columnCig = ref.columnIntersectionGraph(
        [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 2 }], 3
    );

    for (let v = 0; v < 3; v++) {
        assert.deepEqual(g.vertices[v].edges.slice().sort((a, b) => a - b), columnCig[v],
            `column ${v} matches the reference column intersection graph`);
    }
    assert.deepEqual(g.vertices[0].edges, [1], 'columns 0 and 1 share row 0');
    assert.deepEqual(g.vertices[2].edges, [], 'column 2 shares no row with any other');
});

test('bfs() reproduces breadth-first distances', () => {
    env.__edges = E([0, 1], [1, 2], [2, 3], [4, 5]);
    run(env, 'currentg = graph(__edges, 6, __edges.length)');
    const g = runPlain(env, 'bfs(currentg, 0)');

    const adj = [[1], [0, 2], [1, 3], [2], [5], [4]];
    const expected = ref.bfsDistances(adj, 0);

    for (let v = 0; v < 6; v++) {
        assert.equal(g.vertices[v].distance, expected[v], `distance to ${v}`);
    }
    assert.equal(g.vertices[4].distance, Infinity, 'disconnected vertices stay unreachable');
});

test('allVSeen() splits reached from unreached, excluding the separator', () => {
    env.__edges = E([0, 1], [3, 4]);
    run(env, 'currentg = graph(__edges, 5, __edges.length)');
    run(env, 'currentg = bfs(currentg, 0)');
    env.__selected = [2];
    const parts = runPlain(env, 'allVSeen(currentg, __selected)');

    assert.deepEqual(parts.seen.sort(), [0, 1]);
    assert.deepEqual(parts.notSeen.sort(), [3, 4]);
    assert.ok(!parts.notSeen.includes(2), 'the separator is not reported as unreached');
    assert.deepEqual(parts.order, [0, 1, 3, 4, 2],
        'order is seen ++ notSeen ++ separator — the nested dissection permutation');
});

test('removeVertex() detaches a vertex from both directions', () => {
    env.__edges = E([0, 1], [1, 2]);
    run(env, 'currentg = graph(__edges, 3, __edges.length)');
    const g = runPlain(env, 'removeVertex(currentg, 1)');

    assert.deepEqual(g.vertices[1].edges, []);
    assert.deepEqual(g.vertices[0].edges, []);
    assert.deepEqual(g.vertices[2].edges, []);
});

test('isEdge() works with numeric vertex ids', () => {
    env.__edges = E([0, 1], [1, 2], [0, 2]);
    run(env, 'currentg = graph(__edges, 3, __edges.length)');

    assert.equal(run(env, 'isEdge(currentg, 0, 1)'), true);
    assert.equal(run(env, 'isEdge(currentg, 0, 2)'), true);
});

test('isEdge() requires numeric ids — callers must not pass strings', () => {
    // Kept as documentation: isEdge searches the edge list with the strict
    // indexOf, so a string id never matches. isClique used to feed it
    // Object.keys(...) directly and therefore always returned false; it now
    // converts with .map(Number). Any new caller must do the same.
    env.__edges = E([0, 1]);
    run(env, 'currentg = graph(__edges, 2, __edges.length)');

    assert.equal(run(env, 'isEdge(currentg, 0, 1)'), true, 'numeric id: found');
    assert.equal(run(env, `isEdge(currentg, '0', '1')`), false,
        "string id: indexOf('1') misses the number 1");
});

test('isClique() recognises a complete graph and rejects an incomplete one', () => {
    // Regression guard: isClique used to hand Object.keys(G.vertices) — the
    // STRINGS "0","1","2" — to isEdge, which searches a list of NUMBERS with
    // the strict indexOf. Nothing ever matched, so every graph reported false.
    env.__edges = E([0, 1], [1, 2], [0, 2]);
    run(env, 'currentg = graph(__edges, 3, __edges.length)');
    assert.equal(run(env, 'isClique(currentg)'), true, 'a triangle is a clique');

    env.__edges = E([0, 1], [1, 2]);
    run(env, 'currentg = graph(__edges, 3, __edges.length)');
    assert.equal(run(env, 'isClique(currentg)'), false, 'a path is not');

    env.__edges = E([0, 1]);
    run(env, 'currentg = graph(__edges, 2, __edges.length)');
    assert.equal(run(env, 'isClique(currentg)'), true, 'a single edge is a clique');
});

test('communicationVolume() counts cut entries of init_edges', () => {
    env.__edges = E([0, 1], [1, 0], [1, 2], [2, 1]);
    run(env, 'currentg = graph(__edges, 3, __edges.length)');
    run(env, `
        currentg.vertices[0].color = 0;
        currentg.vertices[1].color = 0;
        currentg.vertices[2].color = 1;
    `);

    const volume = run(env, 'communicationVolume(currentg)');
    const expected = ref.communicationVolume(env.__edges, [0, 0, 1]);

    assert.equal(volume, expected);
    assert.equal(volume, 2, 'edge 1-2 is cut, and appears in both directions');
});

test('numOfVertices() honours its argument, and falls back to the global graph', () => {
    env.__edges = E([0, 1]);
    run(env, 'currentg = graph(__edges, 2, __edges.length)');
    env.__other = { vertices: [{}, {}, {}, {}, {}] };

    assert.equal(run(env, 'numOfVertices(__other)'), 5,
        'the argument wins — it used to be ignored entirely');
    assert.equal(run(env, 'numOfVertices()'), 2,
        'with no argument it still reads currentg, which is how callers use it');
});
