/**
 * nested-dissection.test.js — vertex separators and the resulting ordering.
 *
 * The module is heavily interleaved with drawing calls, so these tests cover
 * the parts that decide the *result*: the separator/partition split from
 * graph.js, and the variable-scoping accident the module depends on.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { createEnvironment, installGraph, loadModule, click, run, runPlain } = require('./harness');
const mm = require('./matrix-market');
const ref = require('./reference');

const E = (...pairs) => pairs.map(([src, tgt]) => ({ src, tgt }));

function setupND(matrixName) {
    const env = createEnvironment();
    loadModule(env, 'nested_dissection', 'global_nd');

    const shipped = mm.readAsShipped(mm.load(matrixName));
    const strict = mm.readStrict(mm.load(matrixName));
    installGraph(env, shipped.edges, strict.rows, 'simple');

    return { env, strict, n: strict.rows };
}

/* ------------------------------------------------ separator / partition */

test('removing a separator splits the graph, and allVSeen reports both sides', () => {
    const env = createEnvironment();
    // 0-1-2 | 3 | 4-5-6 : vertex 3 is a separator.
    const pairs = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]];
    installGraph(env, pairs.flatMap(([a, b]) => [{ src: a, tgt: b }, { src: b, tgt: a }]),
        7, 'simple');

    env.__sep = [3];
    run(env, 'currentg = removeVertices(currentg, __sep)');
    run(env, 'currentg = bfs(currentg, 0)');
    const parts = runPlain(env, 'allVSeen(currentg, __sep)');

    assert.deepEqual(parts.seen.sort((a, b) => a - b), [0, 1, 2]);
    assert.deepEqual(parts.notSeen.sort((a, b) => a - b), [4, 5, 6]);
    assert.deepEqual(parts.order, [0, 1, 2, 4, 5, 6, 3],
        'the permutation puts the separator last, which is what makes the arrow shape');

    const adj = [[1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5]];
    assert.ok(ref.isVertexSeparator(adj, [3], parts.seen, parts.notSeen),
        'no edge of the original graph joins the two parts once 3 is removed');
});

test('a non-separator leaves the graph connected, so notSeen is empty', () => {
    const env = createEnvironment();
    const pairs = [[0, 1], [1, 2], [2, 3], [3, 0]];  // a 4-cycle
    installGraph(env, pairs.flatMap(([a, b]) => [{ src: a, tgt: b }, { src: b, tgt: a }]),
        4, 'simple');

    env.__sep = [0];
    run(env, 'currentg = removeVertices(currentg, __sep)');
    run(env, 'currentg = bfs(currentg, 1)');
    const parts = runPlain(env, 'allVSeen(currentg, __sep)');

    assert.deepEqual(parts.seen.sort((a, b) => a - b), [1, 2, 3],
        'removing one vertex of a cycle keeps the rest connected');
    assert.deepEqual(parts.notSeen, [],
        'a single vertex is not a separator of a cycle');
});

test('the ordering allVSeen produces is a permutation of every vertex, exactly once', () => {
    const { env, n } = setupND('nestedDissection4.mtx');

    env.__sep = [4];
    run(env, 'currentg = removeVertices(currentg, __sep)');
    run(env, 'currentg = bfs(currentg, 0)');
    const parts = runPlain(env, 'allVSeen(currentg, __sep)');

    assert.equal(parts.order.length, n, 'every vertex appears');
    assert.equal(new Set(parts.order).size, n, 'and none appears twice');
    assert.deepEqual([...parts.order].sort((a, b) => a - b), [...Array(n).keys()]);
});

/* ------------------------------------------------------- module guards */

test('nested_dissection refuses to run on graphs with fewer than 10 vertices', () => {
    const env = createEnvironment();
    loadModule(env, 'nested_dissection', 'global_nd');
    installGraph(env, E([0, 1], [1, 0]), 2, 'simple');

    click(env, 'nested_dissection', 0);

    assert.deepEqual(runPlain(env, '__events.alerts'), [
        'This module works only on graph with the number of vertices bigger than 10.'
    ]);
    assert.deepEqual(runPlain(env, 'selected'), [],
        'nothing is selected when the guard trips');
});

test('nested_dissection records the clicked vertex as part of the separator', () => {
    const { env } = setupND('nestedDissection4.mtx');

    click(env, 'nested_dissection', 5);

    assert.deepEqual(runPlain(env, 'selected'), [5],
        'the clicked vertex joins the separator set');
});

/* ------------------------------- the variable-scoping accident, pinned */

test('nested_dissection uses `current`, so it survives renaming the caller\'s parameter', () => {
    // It used to read a bare `i`, which resolved only because mouse_event.js
    // invokes the module body from inside `function clicked(g, i)`. Renaming
    // that parameter — an ordinary refactor — threw ReferenceError.
    const fs = require('node:fs');
    const path = require('node:path');
    const src = fs.readFileSync(
        path.join(__dirname, '..', 'modules', 'nested_dissection.js'), 'utf8');

    assert.match(src, /if \(selected\.indexOf\(current\) == -1\)/,
        'the module reads `current`, like every sibling module');
    assert.doesNotMatch(src, /selected\.indexOf\(i\)/, 'and no longer a bare `i`');

    // Same module body, same call, caller's parameter named either way.
    for (const paramName of ['i', 'v', 'vertexIndex']) {
        const { env } = setupND('nestedDissection4.mtx');
        click(env, 'nested_dissection', 5, paramName);
        assert.deepEqual(runPlain(env, 'selected'), [5],
            `works with the caller's parameter named \`${paramName}\``);
    }
});

test('the natural ordering built by file_handle.js is 0..n-1', () => {
    const { env, n } = setupND('nestedDissection4.mtx');
    assert.deepEqual(runPlain(env, 'order'), [...Array(n).keys()]);
});

/* --------------------------------------------------- BFS-driven metrics */

test('deviationBound() handles any number of parts, and ignores uncoloured vertices', () => {
    const env = createEnvironment();
    installGraph(env, E([0, 1], [1, 0], [1, 2], [2, 1]), 3, 'simple');

    run(env, `
        currentg.vertices[0].color = 0;
        currentg.vertices[1].color = 0;
        currentg.vertices[2].color = 1;
    `);
    // Two parts, largest holds 2 of 3 vertices: (2 * 2 / 3) - 1 = 1/3.
    assert.ok(Math.abs(run(env, 'deviationBound(currentg)') - (4 / 3 - 1)) < 1e-9,
        'perfectly balanced would be 0; this partition is 1/3 off');

    // The tally used to be a hard-coded [0,0,0,0]; a fifth part incremented a
    // hole, `undefined++` gave NaN, and max() propagated it through the result.
    run(env, 'currentg.vertices[2].color = 7;');
    const withHighPart = run(env, 'deviationBound(currentg)');
    assert.ok(Number.isFinite(withHighPart), 'a part index of 7 is still a number');
    assert.ok(Math.abs(withHighPart - (4 / 3 - 1)) < 1e-9,
        'and gives the same answer — only the label changed, not the partition');

    // Uncoloured vertices are skipped rather than counted as a part.
    run(env, 'currentg.vertices[2].color = -1;');
    assert.ok(Number.isFinite(run(env, 'deviationBound(currentg)')));
});
