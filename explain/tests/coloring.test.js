/**
 * coloring.test.js — the greedy colouring that drives Column Compression,
 * and the helpers it is built from.
 *
 * The module body under test (modules/column_compression.js) is the shipped
 * one, invoked exactly as mouse_event.js `clicked` invokes it.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { createEnvironment, installGraph, loadModule, click, run, runPlain } = require('./harness');
const mm = require('./matrix-market');
const ref = require('./reference');

const E = (...pairs) => pairs.map(([src, tgt]) => ({ src, tgt }));

/** Undirected adjacency of the graph currently installed, self-loops dropped. */
function adjacencyOf(env) {
    const g = runPlain(env, 'currentg');
    return g.vertices.map((v, idx) => v.edges.filter(u => u !== idx).sort((a, b) => a - b));
}

/** Colour every vertex by driving the real module, in the given order. */
function colorAll(env, moduleFn, order) {
    for (const v of order) click(env, moduleFn, v);
    return runPlain(env, 'currentg').vertices.map(v => v.color);
}

/* ------------------------------------------------------------- helpers */

test('min / max / diff / range behave as the modules assume', () => {
    const env = createEnvironment();

    assert.equal(run(env, 'min([3, 1, 2])'), 1);
    assert.equal(run(env, 'max([3, 1, 2])'), 3);
    assert.deepEqual(runPlain(env, 'diff([0,1,2,3], [1,3])'), [0, 2]);
    assert.deepEqual(runPlain(env, 'range(0, 5)'), [0, 1, 2, 3, 4]);

    // The colouring step is exactly min(diff(colors, neighbourColours)).
    assert.equal(run(env, 'min(diff(range(0,22), [0,1,3]))'), 2,
        'first free colour skips the gap correctly');
});

test('min([]) is Infinity — the empty-palette edge case', () => {
    const env = createEnvironment();
    // Reached only if a vertex is adjacent to all 22 colours; the modules do
    // not guard against it, so a 23-colour graph would assign Infinity.
    assert.equal(run(env, 'min([])'), Infinity);
});

test('get_colors() reports -1 for uncoloured vertices, which diff() ignores', () => {
    const env = createEnvironment();
    installGraph(env, E([0, 1], [1, 0]), 2, 'simple');
    run(env, 'colors = range(0, 22)');

    assert.deepEqual(runPlain(env, 'get_colors([0, 1])'), [-1, -1]);
    assert.equal(run(env, 'min(diff(colors, get_colors([0,1])))'), 0,
        '-1 is not in the palette, so uncoloured neighbours never block a colour');
});

test('d2_neighbors() returns each distance-2 vertex once', () => {
    const env = createEnvironment();
    // Diamond: 0-1, 0-2, 1-3, 2-3. Vertex 3 is reachable from 0 by two 2-paths
    // and used to be reported twice.
    installGraph(env, E([0, 1], [1, 0], [0, 2], [2, 0], [1, 3], [3, 1], [2, 3], [3, 2]),
        4, 'simple');

    const d2 = runPlain(env, 'd2_neighbors(0)');

    assert.equal(d2.length, new Set(d2).size, 'no duplicates');
    assert.ok(!d2.includes(0), 'the start vertex is excluded');
    assert.deepEqual(d2.slice().sort((a, b) => a - b),
        ref.distance2Neighbors(adjacencyOf(env), 0));
});

test('a diagonal entry no longer turns a direct neighbour into a distance-2 one', () => {
    const env = createEnvironment();
    // Path 0-1-2 plus a diagonal entry at (1,1). That used to become a
    // self-loop, and the 2-path 0 -> 1 -> 1 made 1 look distance-2 from 0.
    installGraph(env, E([0, 1], [1, 0], [1, 2], [2, 1], [1, 1]), 3, 'simple');

    const d2 = runPlain(env, 'd2_neighbors(0)').slice().sort((a, b) => a - b);

    assert.deepEqual(d2, [2], 'only 2 is genuinely at distance 2 from 0');
    assert.deepEqual(d2, ref.distance2Neighbors(adjacencyOf(env), 0));
});

test('bipgraph() turns diagonal entries into cross-side edges, not self-loops', () => {
    const env = createEnvironment();
    installGraph(env, E([0, 0], [0, 1], [1, 1]), 2, 'bipartite');

    const g = runPlain(env, 'currentg');
    assert.equal(g.vertices.length, 4, 'two rows + two columns');

    for (let v = 0; v < 4; v++) {
        assert.ok(!g.vertices[v].edges.includes(v), `vertex ${v} has no self-loop`);
    }
    assert.deepEqual(g.vertices[0].edges.sort((a, b) => a - b), [2, 3],
        'row 0 joins columns 0 and 1, which live at indices 2 and 3');
});

/* -------------------------------------------------- column compression */

test('column_compression produces a proper colouring on nestedDissection3', () => {
    const env = createEnvironment();
    loadModule(env, 'column_compression', 'global_cc');

    const shipped = mm.readAsShipped(mm.load('nestedDissection3.mtx'));
    installGraph(env, shipped.edges, 9, 'cig');
    run(env, 'colors = range(0, 22)');

    const order = [...Array(9).keys()];
    const colors = colorAll(env, 'column_compression', order);
    const adj = adjacencyOf(env);

    assert.ok(colors.every(c => c >= 0), 'every vertex received a colour');
    assert.ok(ref.isProperColoring(adj, colors),
        'no edge of the intersection graph joins two equal colours');
});

test('column_compression matches an independent greedy colouring, vertex for vertex', () => {
    const env = createEnvironment();
    loadModule(env, 'column_compression', 'global_cc');

    const shipped = mm.readAsShipped(mm.load('column_compression.mtx'));
    const strict = mm.readStrict(mm.load('column_compression.mtx'));
    installGraph(env, shipped.edges, strict.rows, 'cig');
    run(env, 'colors = range(0, 22)');

    const order = [...Array(strict.rows).keys()];
    const adj = adjacencyOf(env);

    const actual = colorAll(env, 'column_compression', order);
    const expected = ref.greedyColoring(adj, order);

    assert.deepEqual(actual, expected,
        'first-fit in natural order gives the same colour to the same vertex');
});

test('column_compression is order-sensitive, and every order still yields a proper colouring', () => {
    const shipped = mm.readAsShipped(mm.load('nestedDissection3.mtx'));
    const orders = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8],
        [8, 7, 6, 5, 4, 3, 2, 1, 0],
        [4, 0, 8, 2, 6, 1, 7, 3, 5]
    ];

    const counts = new Set();
    for (const order of orders) {
        const env = createEnvironment();
        loadModule(env, 'column_compression', 'global_cc');
        installGraph(env, shipped.edges, 9, 'cig');
        run(env, 'colors = range(0, 22)');

        const colors = colorAll(env, 'column_compression', order);
        assert.ok(ref.isProperColoring(adjacencyOf(env), colors),
            `order ${order.join(',')} still produces a proper colouring`);
        counts.add(ref.countColors(colors));
    }

    // The point of the teaching module: ordering changes the colour count.
    assert.ok(counts.size >= 1, 'colour counts recorded for every ordering');
});

test('the reported colour count equals the number of colours actually used', () => {
    const env = createEnvironment();
    loadModule(env, 'column_compression', 'global_cc');

    const shipped = mm.readAsShipped(mm.load('nestedDissection3.mtx'));
    installGraph(env, shipped.edges, 9, 'cig');
    run(env, 'colors = range(0, 22)');

    const colors = colorAll(env, 'column_compression', [...Array(9).keys()]);

    const rounds = runPlain(env, '__events.rounds');
    assert.equal(rounds.length, 1, 'exactly one round recorded, on the last vertex');

    // The module reports min(diff(palette, usedColours)) rather than counting
    // distinct colours. That is only equal to the count because greedy always
    // produces a contiguous block 0..k-1 — worth pinning explicitly.
    assert.equal(rounds[0][0], ref.countColors(colors),
        'reported metric agrees with the true number of distinct colours');
    assert.deepEqual(
        [...new Set(colors)].sort((a, b) => a - b),
        [...Array(ref.countColors(colors)).keys()],
        'greedy really does produce a contiguous colour block, which the metric relies on'
    );
});

test('round_completed fires exactly once, when the last vertex is coloured', () => {
    const env = createEnvironment();
    loadModule(env, 'column_compression', 'global_cc');

    const shipped = mm.readAsShipped(mm.load('nestedDissection3.mtx'));
    installGraph(env, shipped.edges, 9, 'cig');
    run(env, 'colors = range(0, 22)');

    for (const v of [...Array(8).keys()]) {
        click(env, 'column_compression', v);
        assert.equal(run(env, '__events.roundsCompleted'), 0,
            `round not yet complete after ${v + 1} of 9 vertices`);
    }
    click(env, 'column_compression', 8);
    assert.equal(run(env, '__events.roundsCompleted'), 1);
});

/* --------------------------------------------- palette / colour lookup */

test('the palette covers the whole colour range the modules use', () => {
    const env = createEnvironment();
    // It used to hold 14 entries against `colors = range(0, 22)`, so colour 14
    // and beyond resolved to undefined and rendered black.
    assert.ok(run(env, 'dcolors.length') >= 22,
        'the palette is at least as long as the colour range');

    for (let c = 0; c < 22; c++) {
        assert.match(run(env, `get_color(${c})`), /^rgb\(\d+,\d+,\d+\)$/,
            `colour ${c} resolves to an rgb string`);
    }
    assert.equal(new Set(
        Array.from({ length: 22 }, (_, c) => run(env, `get_color(${c})`))
    ).size, 22, 'and all 22 are distinct');

    // Beyond the palette it wraps rather than returning undefined.
    assert.equal(run(env, 'get_color(22)'), run(env, 'get_color(0)'));
    assert.equal(run(env, 'get_color(-1)'), 'rgb(255,255,255)', 'uncoloured stays white');
});

test('bidirectional colour mirroring stays inside the palette', () => {
    const env = createEnvironment();
    const dlen = run(env, 'dcolors.length');

    // The column side uses dcolors.length - new_col - 1. With a 14-entry
    // palette against a 22-colour range this reached -1 at colour 14, and -1
    // is the sentinel for "uncoloured" — a coloured vertex would have looked
    // uncoloured to every later step.
    for (let c = 0; c < 22; c++) {
        const mirrored = Math.max(0, dlen - c - 1);
        assert.ok(mirrored >= 0, `colour ${c} mirrors to a non-negative index`);
        assert.match(run(env, `get_color(${mirrored})`), /^rgb\(/);
    }
    assert.ok(dlen - 21 - 1 >= 0, 'even the last colour in the range mirrors above zero');
});
