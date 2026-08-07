/**
 * cholesky.test.js — symbolic Cholesky / vertex elimination.
 *
 * Runs the shipped modules/cholesky_factorization.js. The graph mutation
 * (remove_vertex, make_clique) is the real graphic.js code; only the fill-in
 * *reporting* is re-routed, because the shipped version reads red edges back
 * out of the SVG.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { createEnvironment, installGraph, loadModule, click, run, runPlain } = require('./harness');
const mm = require('./matrix-market');
const ref = require('./reference');

const E = (...pairs) => pairs.map(([src, tgt]) => ({ src, tgt }));

function setup(matrixName) {
    const env = createEnvironment();
    loadModule(env, 'cholesky_factorization', 'global_cf');

    const shipped = mm.readAsShipped(mm.load(matrixName));
    const strict = mm.readStrict(mm.load(matrixName));
    installGraph(env, shipped.edges, strict.rows, 'simple');
    run(env, 'all_fillins = []');

    return { env, strict, n: strict.rows };
}

/** Unordered fill pairs recorded by the module, deduplicated and normalised. */
function fillPairs(env) {
    const raw = runPlain(env, 'all_fillins');
    const set = new Set();
    for (const f of raw) {
        const a = Number(f.src), b = Number(f.tgt);
        if (a === b) continue;              // self-loops handled separately
        set.add([Math.min(a, b), Math.max(a, b)].join(','));
    }
    return [...set].sort();
}

/* ------------------------------------------------------ make_clique itself */

test('make_clique() joins every pair without creating self-loops', () => {
    const env = createEnvironment();
    installGraph(env, E([0, 1], [1, 0], [0, 2], [2, 0]), 3, 'simple');

    env.__vers = [1, 2];
    run(env, 'make_clique(__vers)');

    const g = runPlain(env, 'currentg');

    assert.ok(g.vertices[1].edges.includes(2), 'the real work: 1 and 2 are joined');
    assert.ok(g.vertices[2].edges.includes(1));

    // The nested forEach had no `if (u !== v)` guard, so the v === u pass
    // pushed a self-loop and drew a degenerate red edge — which the shipped
    // specify_fillins() then harvested as fill-in.
    assert.ok(!g.vertices[1].edges.includes(1), 'vertex 1 gains no self-loop');
    assert.ok(!g.vertices[2].edges.includes(2), 'vertex 2 gains no self-loop');

    const drawn = runPlain(env, '__events.fillEdges');
    assert.ok(!drawn.some(e => e.src === e.tgt),
        'no degenerate self-edge is drawn, so none can be miscounted as fill-in');
    assert.equal(drawn.length, 2, 'exactly the two directions of the single new edge');
});

test('make_clique() is idempotent on an already-complete set', () => {
    const env = createEnvironment();
    installGraph(env, E([0, 1], [1, 0]), 2, 'simple');

    env.__vers = [0, 1];
    run(env, 'make_clique(__vers)');
    const first = runPlain(env, 'currentg').vertices.map(v => v.edges.length);
    run(env, 'make_clique(__vers)');
    const second = runPlain(env, 'currentg').vertices.map(v => v.edges.length);

    assert.deepEqual(second, first, 'a second pass adds nothing new');
});

/* --------------------------------------------------- elimination behaviour */

test('eliminating a vertex removes it and joins its former neighbours', () => {
    const { env } = setup('cholesky.mtx');

    // cholesky.mtx off-diagonal: 0-1, 0-5, 1-2, 1-3, 2-4, 4-5
    click(env, 'cholesky_factorization', 0);
    const g = runPlain(env, 'currentg');

    assert.deepEqual(g.vertices[0].edges, [],
        'the eliminated vertex keeps no edges');
    for (let v = 1; v < 6; v++) {
        assert.ok(!g.vertices[v].edges.includes(0),
            `vertex ${v} no longer points at the eliminated vertex 0`);
    }
    assert.ok(g.vertices[1].edges.includes(5) && g.vertices[5].edges.includes(1),
        'the neighbours of 0 (namely 1 and 5) are now joined — one fill edge');
});

test('the fill edges match a reference symbolic Cholesky, for several orderings', () => {
    const orderings = [
        [0, 1, 2, 3, 4, 5],
        [5, 4, 3, 2, 1, 0],
        [3, 0, 4, 1, 5, 2]
    ];

    for (const order of orderings) {
        const { env, strict } = setup('cholesky.mtx');

        for (const v of order) click(env, 'cholesky_factorization', v);

        const expected = ref.symbolicCholeskyFill(strict.adjacency(), order)
            .map(([a, b]) => a + ',' + b)
            .sort();

        assert.deepEqual(fillPairs(env), [...new Set(expected)].sort(),
            `ordering ${order.join(',')} produces the textbook fill set`);
    }
});

test('elimination order changes the amount of fill — the point of the module', () => {
    const strict = mm.readStrict(mm.load('cholesky.mtx'));
    const adj = strict.adjacency();

    const natural = ref.symbolicCholeskyFill(adj, [0, 1, 2, 3, 4, 5]).length;
    const reversed = ref.symbolicCholeskyFill(adj, [5, 4, 3, 2, 1, 0]).length;
    const byDegree = ref.symbolicCholeskyFill(
        adj,
        [...adj.keys()].sort((a, b) => adj[a].length - adj[b].length)
    ).length;

    assert.ok([natural, reversed, byDegree].every(v => typeof v === 'number'));
    assert.notEqual(
        new Set([natural, reversed, byDegree]).size, 1,
        'at least two orderings differ in fill count, so the lesson is demonstrable'
    );
});

test('the reported fill-in metric counts matrix ENTRIES, i.e. two per fill edge', () => {
    const { env, strict } = setup('cholesky.mtx');

    const order = [0, 1, 2, 3, 4, 5];
    for (const v of order) click(env, 'cholesky_factorization', v);

    const rounds = runPlain(env, '__events.rounds');
    assert.equal(rounds.length, 1, 'one round recorded, when the graph becomes a clique');

    const edgeCount = ref.symbolicCholeskyFill(strict.adjacency(), order).length;
    const reported = rounds[0][0];

    // Both (i,j) and (j,i) are drawn, and the chart is labelled "Number of
    // fill-in". Consistent with the symmetric matrix picture on screen, but a
    // student comparing against a textbook fill *edge* count will see double.
    assert.equal(reported % 2, 0, 'the metric is always even');
    assert.equal(reported / 2, edgeCount,
        `reported ${reported} = 2 x ${edgeCount} fill edges`);
});

test('a graph that is already a clique needs no fill and completes immediately', () => {
    const env = createEnvironment();
    loadModule(env, 'cholesky_factorization', 'global_cf');
    installGraph(env, E([0, 1], [1, 0], [1, 2], [2, 1], [0, 2], [2, 0]), 3, 'simple');
    run(env, 'all_fillins = []');

    click(env, 'cholesky_factorization', 0);

    assert.deepEqual(fillPairs(env), [], 'eliminating from a triangle creates no fill');
    assert.equal(run(env, '__events.roundsCompleted'), 1,
        'the remaining two vertices are a clique, so the round completes');
});

test('a path graph fills in completely, a star does not', () => {
    const path = [[0, 1], [1, 2], [2, 3]];
    const star = [[0, 1], [0, 2], [0, 3]];
    const undirected = pairs => pairs.flatMap(([a, b]) => [{ src: a, tgt: b }, { src: b, tgt: a }]);

    const runFill = (pairs, order) => {
        const env = createEnvironment();
        loadModule(env, 'cholesky_factorization', 'global_cf');
        installGraph(env, undirected(pairs), 4, 'simple');
        run(env, 'all_fillins = []');
        for (const v of order) click(env, 'cholesky_factorization', v);
        return fillPairs(env);
    };

    // Eliminating the middle of a path joins its two neighbours.
    assert.deepEqual(runFill(path, [1, 0, 2, 3]), ['0,2'],
        'eliminating vertex 1 of the path joins 0 and 2');

    // Eliminating a leaf of a star touches only the hub, so nothing is joined.
    assert.deepEqual(runFill(star, [1, 2, 3, 0]), [],
        'eliminating star leaves creates no fill at all');
});
