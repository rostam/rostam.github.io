/**
 * orderings.test.js — the vertex orderings behind the "Change Order" menu,
 * and the scoring that makes a round comparable to the last one.
 *
 * The orderings are pure functions in graph.js, so these run the shipped code.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { createEnvironment, installGraph, loadModule, click, run, runPlain } = require('./harness');
const mm = require('./matrix-market');
const ref = require('./reference');

const E = (...pairs) => pairs.map(([src, tgt]) => ({ src, tgt }));
const undirected = pairs =>
    pairs.flatMap(([a, b]) => [{ src: a, tgt: b }, { src: b, tgt: a }]);

/** Undirected adjacency of the installed graph, self-loops dropped. */
function adjacencyOf(env) {
    const g = runPlain(env, 'currentg');
    return g.vertices.map((v, idx) => v.edges.filter(u => u !== idx).sort((a, b) => a - b));
}

/* ------------------------------------------------------- basic guarantees */

test('every ordering is a permutation of the whole vertex set', () => {
    const env = createEnvironment();
    const shipped = mm.readAsShipped(mm.load('nestedDissection4.mtx'));
    installGraph(env, shipped.edges, 22, 'simple');

    for (const name of ['nat', 'lfo', 'slo', 'ido']) {
        const order = runPlain(env, `orderingByName('${name}', currentg)`);
        assert.equal(order.length, 22, `${name}: right length`);
        assert.equal(new Set(order).size, 22, `${name}: no duplicates`);
        assert.deepEqual([...order].sort((a, b) => a - b), [...Array(22).keys()],
            `${name}: covers every vertex`);
    }
});

test('an unknown ordering name falls back to natural rather than returning nothing', () => {
    const env = createEnvironment();
    installGraph(env, E([0, 1], [1, 0], [1, 2], [2, 1]), 3, 'simple');

    assert.deepEqual(runPlain(env, `orderingByName('metis', currentg)`), [0, 1, 2]);
    assert.deepEqual(runPlain(env, `orderingByName(undefined, currentg)`), [0, 1, 2]);
});

/* -------------------------------------------------------- each heuristic */

test('natural ordering is 0..n-1', () => {
    const env = createEnvironment();
    installGraph(env, undirected([[0, 3], [1, 2]]), 4, 'simple');
    assert.deepEqual(runPlain(env, `orderingByName('nat', currentg)`), [0, 1, 2, 3]);
});

test('largest-first takes the highest degree first', () => {
    const env = createEnvironment();
    // Star with hub 2: degrees are 1,1,3,1.
    installGraph(env, undirected([[2, 0], [2, 1], [2, 3]]), 4, 'simple');

    const order = runPlain(env, `orderingByName('lfo', currentg)`);
    assert.equal(order[0], 2, 'the hub goes first');
    assert.deepEqual(order.slice(1).sort((a, b) => a - b), [0, 1, 3],
        'the leaves follow, tie-broken by index');
});

test('smallest-last is the reverse of the min-degree stripping sequence', () => {
    const env = createEnvironment();
    // Path 0-1-2-3. Stripping always takes the current minimum degree,
    // lowest index first: 0, then 1, then 2, then 3 — so reversing gives
    // 3,2,1,0. The vertex removed FIRST is coloured LAST; that is the point.
    installGraph(env, undirected([[0, 1], [1, 2], [2, 3]]), 4, 'simple');

    assert.deepEqual(runPlain(env, `orderingByName('slo', currentg)`), [3, 2, 1, 0]);
});

test('greedy colouring in smallest-last order never exceeds degeneracy + 1 colours', () => {
    // This is the guarantee SLO exists to provide, so it is worth asserting
    // directly rather than trusting the shape of the permutation.
    for (const name of ['nestedDissection4.mtx', 'nestedDissection2.mtx', 'ten.mtx']) {
        const env = createEnvironment();
        const strict = mm.readStrict(mm.load(name));
        const shipped = mm.readAsShipped(mm.load(name));
        installGraph(env, shipped.edges, strict.rows, 'simple');

        const adj = adjacencyOf(env);
        const order = runPlain(env, `orderingByName('slo', currentg)`);
        const used = ref.countColors(ref.greedyColoring(adj, order));
        const bound = ref.degeneracy(adj) + 1;

        assert.ok(used <= bound,
            `${name}: SLO used ${used} colours against a degeneracy bound of ${bound}`);
    }
});

test('incidence-degree prefers the vertex with the most already-ordered neighbours', () => {
    const env = createEnvironment();
    // Triangle 0-1-2 plus a pendant 3 hanging off 0.
    installGraph(env, undirected([[0, 1], [1, 2], [0, 2], [0, 3]]), 4, 'simple');

    const order = runPlain(env, `orderingByName('ido', currentg)`);
    assert.equal(order[0], 0, 'starts at the highest-degree vertex');
    // After 0, both 1 and 2 have incidence 1 and degree 2; 3 has incidence 1
    // but degree 1, so it must come after them.
    assert.ok(order.indexOf(3) > order.indexOf(1) && order.indexOf(3) > order.indexOf(2),
        'the pendant is deferred behind the triangle');
});

/* --------------------------------------------------------------- domain */

test('an ordering restricted to a domain permutes only that domain', () => {
    const env = createEnvironment();
    loadModule(env, 'column_compression_bip', 'global_ccb');
    const shipped = mm.readAsShipped(mm.load('arrow-shaped2.mtx'));
    installGraph(env, shipped.edges, 6, 'bipartite', 6);

    // The column-side module can only click vertices 6..11.
    const domain = runPlain(env, 'order_domain');
    assert.deepEqual(domain, [6, 7, 8, 9, 10, 11],
        'file_handle-style setup restricts the domain to the clickable side');

    for (const name of ['nat', 'lfo', 'slo', 'ido']) {
        const order = runPlain(env, `orderingByName('${name}', currentg, order_domain)`);
        assert.deepEqual([...order].sort((a, b) => a - b), domain,
            `${name}: stays inside the clickable side`);
    }
});

/* --------------------------------------- orderings drive different scores */

test('the heuristics give Column Compression something to beat', () => {
    const shipped = mm.readAsShipped(mm.load('nestedDissection4.mtx'));
    const scores = {};

    for (const name of ['nat', 'lfo', 'slo', 'ido']) {
        const env = createEnvironment();
        loadModule(env, 'column_compression', 'global_cc');
        installGraph(env, shipped.edges, 22, 'cig');
        run(env, 'colors = range(0, 22)');

        const order = runPlain(env, `orderingByName('${name}', currentg, order_domain)`);
        for (const v of order) click(env, 'column_compression', v);

        const colors = runPlain(env, 'currentg').vertices.map(v => v.color);
        assert.ok(ref.isProperColoring(adjacencyOf(env), colors),
            `${name}: still a proper colouring`);
        scores[name] = ref.countColors(colors);
    }

    for (const name of Object.keys(scores)) {
        assert.ok(scores[name] > 0, `${name} produced a colour count`);
    }
    // If every heuristic scored identically the comparison would teach
    // nothing; on this matrix at least two of them differ.
    assert.ok(new Set(Object.values(scores)).size > 1,
        `orderings should not all score the same: ${JSON.stringify(scores)}`);
});

/* --------------------------------------------------------------- scoring */

test('best-so-far tracks the lowest score and the round that set it', () => {
    const env = createEnvironment();
    run(env, "score_direction = 'lower';");

    run(env, 'gather_round_data(7, 0, 0, 0, 0);');
    assert.equal(run(env, 'best_score'), 7);
    assert.equal(run(env, 'best_round'), 1);

    run(env, 'gather_round_data(9, 0, 0, 0, 0);');
    assert.equal(run(env, 'best_score'), 7, 'a worse round does not displace the best');
    assert.equal(run(env, 'best_round'), 1);

    run(env, 'gather_round_data(5, 0, 0, 0, 0);');
    assert.equal(run(env, 'best_score'), 5, 'a better round does');
    assert.equal(run(env, 'best_round'), 3);
    assert.equal(run(env, 'last_round_score'), 5);
});

test('best-so-far respects a module that scores higher-is-better', () => {
    const env = createEnvironment();
    run(env, "score_direction = 'higher';");

    run(env, 'gather_round_data(3, 0, 0, 0, 0);');
    run(env, 'gather_round_data(8, 0, 0, 0, 0);');
    run(env, 'gather_round_data(6, 0, 0, 0, 0);');

    assert.equal(run(env, 'best_score'), 8);
    assert.equal(run(env, 'best_round'), 2);
});

test('every module declares how its score should be read', () => {
    const modules = [
        ['column_compression', 'global_cc'],
        ['cholesky_factorization', 'global_cf'],
        ['column_compression_bip', 'global_ccb'],
        ['row_compression_bip', 'global_rcb'],
        ['bidirectional_compression', 'global_bc'],
        ['matrix_vector_product', 'global_mvp'],
        ['nested_dissection', 'global_nd']
    ];

    for (const [name, globals] of modules) {
        const env = createEnvironment();
        loadModule(env, name, globals);

        const label = run(env, 'score_label');
        assert.ok(typeof label === 'string' && label.length > 0 && label !== 'score',
            `${name}: names its metric (got ${JSON.stringify(label)})`);
        assert.ok(['lower', 'higher'].includes(run(env, 'score_direction')),
            `${name}: says which direction is better`);
        assert.equal(run(env, 'typeof live_score'), 'function',
            `${name}: exposes a running score`);
    }
});

test('the live score of Column Compression rises as vertices are coloured', () => {
    const env = createEnvironment();
    loadModule(env, 'column_compression', 'global_cc');
    const shipped = mm.readAsShipped(mm.load('nestedDissection3.mtx'));
    installGraph(env, shipped.edges, 9, 'cig');
    run(env, 'colors = range(0, 22)');

    assert.equal(run(env, 'live_score()'), 0, 'nothing coloured yet');

    const seen = [];
    for (let v = 0; v < 9; v++) {
        click(env, 'column_compression', v);
        seen.push(run(env, 'live_score()'));
    }

    assert.ok(seen.every((s, i) => i === 0 || s >= seen[i - 1]),
        `the running colour count never decreases: ${seen}`);
    assert.equal(seen[seen.length - 1], run(env, '__events.rounds')[0][0],
        'and it ends on the score the round records');
});
