/**
 * bipartite.test.js — row / column compression and bidirectional compression
 * on the bipartite graph of a matrix (star bicolouring).
 *
 * Vertex layout produced by bipgraph(): 0..n-1 are rows, n..2n-1 are columns.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { createEnvironment, installGraph, loadModule, click, run, runPlain } = require('./harness');
const mm = require('./matrix-market');

const E = (...pairs) => pairs.map(([src, tgt]) => ({ src, tgt }));

function setupBipartite(matrixName, moduleName, globalsFn) {
    const env = createEnvironment();
    loadModule(env, moduleName, globalsFn);

    const shipped = mm.readAsShipped(mm.load(matrixName));
    const strict = mm.readStrict(mm.load(matrixName));
    installGraph(env, shipped.edges, strict.rows, 'bipartite');
    run(env, 'colors = range(0, 22)');

    return { env, n: strict.rows, strict };
}

/* ------------------------------------------------------------- structure */

test('bipgraph() places rows at 0..n-1 and columns at n..2n-1', () => {
    const env = createEnvironment();
    //  [ 1 0 ]
    //  [ 1 1 ]
    installGraph(env, E([0, 0], [1, 0], [1, 1]), 2, 'bipartite');
    const g = runPlain(env, 'currentg');

    assert.equal(g.vertices.length, 4);
    assert.deepEqual(g.vertices[0].edges, [2], 'row 0 touches column 0 (index 2)');
    assert.deepEqual(g.vertices[1].edges.sort((a, b) => a - b), [2, 3],
        'row 1 touches columns 0 and 1');
    assert.deepEqual(g.vertices[2].edges.sort((a, b) => a - b), [0, 1],
        'column 0 is touched by both rows');
});

test('bipgraph() is genuinely bipartite: no edge stays on one side', () => {
    const shipped = mm.readAsShipped(mm.load('arrow-shaped2.mtx'));
    const strict = mm.readStrict(mm.load('arrow-shaped2.mtx'));

    const env = createEnvironment();
    installGraph(env, shipped.edges, strict.rows, 'bipartite');
    const g = runPlain(env, 'currentg');
    const n = strict.rows;

    for (let v = 0; v < g.vertices.length; v++) {
        const vIsRow = v < n;
        for (const u of g.vertices[v].edges) {
            assert.notEqual(u < n, vIsRow,
                `edge ${v}-${u} must cross between the row and column sides`);
        }
    }
});

test('bipgraph() supports a rectangular matrix, sizing each side independently', () => {
    const env = createEnvironment();
    // A 2x3 matrix: rows 0..1, columns 0..2 at vertex indices 2..4.
    // It used to allocate 2n vertices from the row count alone and throw as
    // soon as a column index passed n.
    installGraph(env, E([0, 0], [0, 2], [1, 1]), 2, 'bipartite', 3);
    const g = runPlain(env, 'currentg');

    assert.equal(g.vertices.length, 5, '2 rows + 3 columns');
    assert.equal(g.numRows, 2);
    assert.equal(g.numCols, 3);

    assert.deepEqual(g.vertices[0].edges.sort((a, b) => a - b), [2, 4],
        'row 0 touches columns 0 and 2, at indices 2 and 4');
    assert.deepEqual(g.vertices[1].edges, [3], 'row 1 touches column 1');
    assert.deepEqual(g.vertices[4].edges, [0], 'column 2 is reachable from row 0');

    // first_column_vertex() is what the modules use instead of length / 2.
    assert.equal(run(env, 'first_column_vertex()'), 2);
});

test('the modules split rows from columns by numRows, not by half the vertex count', () => {
    const env = createEnvironment();
    loadModule(env, 'column_compression_bip', 'global_ccb');
    installGraph(env, E([0, 0], [0, 2], [1, 1]), 2, 'bipartite', 3);
    run(env, 'colors = range(0, 22)');

    // Vertices 2,3,4 are the columns. On a 5-vertex graph, length/2 would have
    // been 2.5, so row 2 (index 2) and the split point disagree.
    for (let v = 0; v < 5; v++) click(env, 'column_compression_bip', v);
    const g = runPlain(env, 'currentg');

    assert.ok(g.vertices.slice(0, 2).every(v => v.color === -1), 'rows stay uncoloured');
    assert.ok(g.vertices.slice(2).every(v => v.color >= 0), 'all three columns are coloured');
});

/* ---------------------------------------------------- column compression */

test('column_compression_bip only colours column-side vertices', () => {
    const { env, n } = setupBipartite('arrow-shaped2.mtx', 'column_compression_bip', 'global_ccb');

    for (let v = 0; v < 2 * n; v++) click(env, 'column_compression_bip', v);

    const g = runPlain(env, 'currentg');
    for (let v = 0; v < n; v++) {
        assert.equal(g.vertices[v].color, -1, `row vertex ${v} is left uncoloured`);
    }
    for (let v = n; v < 2 * n; v++) {
        assert.ok(g.vertices[v].color >= 0, `column vertex ${v} received a colour`);
    }
});

test('column_compression_bip gives distinct colours to columns sharing a row', () => {
    const { env, n, strict } = setupBipartite(
        'arrow-shaped2.mtx', 'column_compression_bip', 'global_ccb');

    for (let v = n; v < 2 * n; v++) click(env, 'column_compression_bip', v);
    const g = runPlain(env, 'currentg');

    // Two columns that share a row must be compressed into different groups.
    const colsOfRow = new Map();
    for (const { row, col } of strict.entries) {
        if (!colsOfRow.has(row)) colsOfRow.set(row, []);
        colsOfRow.get(row).push(col);
    }

    for (const [row, cols] of colsOfRow) {
        for (let a = 0; a < cols.length; a++) {
            for (let b = a + 1; b < cols.length; b++) {
                assert.notEqual(
                    g.vertices[n + cols[a]].color,
                    g.vertices[n + cols[b]].color,
                    `columns ${cols[a]} and ${cols[b]} both hit row ${row}, so they cannot share a colour`
                );
            }
        }
    }
});

test('column_compression_bip ignores clicks on the row side', () => {
    const { env, n } = setupBipartite('arrow-shaped2.mtx', 'column_compression_bip', 'global_ccb');

    click(env, 'column_compression_bip', 0);
    const g = runPlain(env, 'currentg');

    assert.equal(g.vertices[0].color, -1, 'clicking a row is a no-op for this module');
    assert.equal(run(env, '__events.rounds.length'), 0);
    assert.ok(n > 0);
});

/* ------------------------------------------------------- row compression */

test('row_compression_bip colours rows so that rows sharing a column differ', () => {
    const { env, n, strict } = setupBipartite(
        'arrow-shaped2.mtx', 'row_compression_bip', 'global_rcb');

    for (let v = 0; v < n; v++) click(env, 'row_compression_bip', v);
    const g = runPlain(env, 'currentg');

    const rowsOfCol = new Map();
    for (const { row, col } of strict.entries) {
        if (!rowsOfCol.has(col)) rowsOfCol.set(col, []);
        rowsOfCol.get(col).push(row);
    }

    for (const [col, rows] of rowsOfCol) {
        for (let a = 0; a < rows.length; a++) {
            for (let b = a + 1; b < rows.length; b++) {
                assert.notEqual(
                    g.vertices[rows[a]].color, g.vertices[rows[b]].color,
                    `rows ${rows[a]} and ${rows[b]} both hit column ${col}`
                );
            }
        }
    }
});

test('row_compression_bip completes its round and records a colour count', () => {
    const { env, n } = setupBipartite('arrow-shaped2.mtx', 'row_compression_bip', 'global_rcb');

    for (let v = 0; v < n - 1; v++) {
        click(env, 'row_compression_bip', v);
        assert.equal(run(env, '__events.roundsCompleted'), 0,
            `round not complete after ${v + 1} of ${n} rows`);
    }
    click(env, 'row_compression_bip', n - 1);

    // This module used to have no completion test at all: the chart stayed
    // empty and the round counter never advanced however many rows you
    // coloured.
    assert.equal(run(env, '__events.roundsCompleted'), 1, 'the round completes');

    const rounds = runPlain(env, '__events.rounds');
    assert.equal(rounds.length, 1);
    assert.equal(rounds[0][0], run(env, 'number_of_colors_used()'),
        'and it reports the number of colours actually used');

    const colored = runPlain(env, 'currentg').vertices
        .slice(0, n).filter(v => v.color !== -1).length;
    assert.equal(colored, n, 'every row is coloured');
});

test('row_compression_bip advertises a chart axis, like every other module', () => {
    const { env } = setupBipartite('arrow-shaped2.mtx', 'row_compression_bip', 'global_rcb');
    assert.equal(run(env, 'chart_yaxis1_text'), 'Number of colors');
    assert.equal(run(env, 'chart_group5_text'), 'Number of colors');
});

/* --------------------------------------------- bidirectional compression */

test('bidirectional_compression colours BOTH sides before completing', () => {
    const { env, n } = setupBipartite(
        'arrow-shaped2.mtx', 'bidirectional_compression', 'global_bc');

    const accepted = [];
    for (let v = 0; v < 2 * n; v++) {
        accepted.push(click(env, 'bidirectional_compression', v));
    }
    const g = runPlain(env, 'currentg');
    const rowColors = g.vertices.slice(0, n).map(v => v.color);
    const colColors = g.vertices.slice(n).map(v => v.color);

    // The termination test used to be `if (cnt > numOfVertices() / 2) end = 0;`
    // where cnt counts uncoloured vertices across BOTH sides. With 6 rows and
    // 6 columns, colouring the rows left cnt = 6, which is not > 6, so the
    // module declared itself finished having done half a bicolouring.
    assert.ok(rowColors.every(c => c !== -1), 'every row is coloured');
    assert.ok(colColors.every(c => c !== -1), 'every column is coloured too');
    assert.deepEqual(accepted, Array(2 * n).fill(true),
        'no click is refused before the work is done');

    assert.equal(run(env, '__events.roundsCompleted'), 1, 'exactly one completion');
});

test('bidirectional_compression keeps row and column colours apart', () => {
    const { env, n } = setupBipartite(
        'arrow-shaped2.mtx', 'bidirectional_compression', 'global_bc');

    for (let v = 0; v < 2 * n; v++) click(env, 'bidirectional_compression', v);
    const g = runPlain(env, 'currentg');

    const rowColors = new Set(g.vertices.slice(0, n).map(v => v.color));
    const colColors = new Set(g.vertices.slice(n).map(v => v.color));
    const dlen = run(env, 'dcolors.length');

    // Columns are mirrored to dcolors.length - c - 1, i.e. the far end of the
    // palette, so the two sides cannot collide while the total stays small.
    assert.ok([...colColors].every(c => c >= 0 && c < dlen),
        'mirrored column colours stay inside the palette');
    assert.equal([...rowColors].filter(c => colColors.has(c)).length, 0,
        'no colour is used on both sides');
});

test('bidirectional_compression gives distinct colours to columns sharing a row', () => {
    const { env, n, strict } = setupBipartite(
        'arrow-shaped2.mtx', 'bidirectional_compression', 'global_bc');

    for (let v = 0; v < 2 * n; v++) click(env, 'bidirectional_compression', v);
    const g = runPlain(env, 'currentg');

    // The column side is drawn with a mirrored colour (dcolors.length - c - 1)
    // so the two sides sit at opposite ends of the palette. The module used to
    // read those mirrored values back as if they were logical ones, excluded
    // the wrong entries from the palette, and handed EVERY column colour 21.
    const colsOfRow = new Map();
    for (const { row, col } of strict.entries) {
        if (!colsOfRow.has(row)) colsOfRow.set(row, []);
        colsOfRow.get(row).push(col);
    }

    let checked = 0;
    for (const [row, cols] of colsOfRow) {
        for (let a = 0; a < cols.length; a++) {
            for (let b = a + 1; b < cols.length; b++) {
                checked++;
                assert.notEqual(
                    g.vertices[n + cols[a]].color, g.vertices[n + cols[b]].color,
                    `columns ${cols[a]} and ${cols[b]} both hit row ${row}`);
            }
        }
    }
    assert.ok(checked > 0, 'the matrix actually has rows with several nonzeros');

    const distinctColumnColours = new Set(g.vertices.slice(n).map(v => v.color));
    assert.ok(distinctColumnColours.size > 1,
        'the columns do not all collapse onto one colour');
});

test('bidirectional_compression records the round before announcing it', () => {
    const { env, n } = setupBipartite(
        'arrow-shaped2.mtx', 'bidirectional_compression', 'global_bc');

    for (let v = 0; v < 2 * n; v++) click(env, 'bidirectional_compression', v);

    // mouse_event.js renders the label as `rounds.length + " completed!"`, so
    // calling round_completed() first made the very first round read
    // "0 completed!".
    const rounds = runPlain(env, '__events.rounds');
    assert.equal(rounds.length, 1);
    assert.equal(rounds[0][0], run(env, 'number_of_colors_used()'),
        'the recorded metric is the number of colours used');
    assert.ok(rounds[0][0] > 0, 'and it is not zero');
});

test('the star-bicolouring check is live: every 4-path uses at least three colours', () => {
    const { env, n } = setupBipartite(
        'arrow-shaped2.mtx', 'bidirectional_compression', 'global_bc');

    for (let v = 0; v < 2 * n; v++) click(env, 'bidirectional_compression', v);
    assert.equal(run(env, '__events.roundsCompleted'), 1,
        'the module accepted the colouring as a valid star bicolouring');

    // Verify that claim independently rather than trusting the module.
    const g = runPlain(env, 'currentg');
    const color = g.vertices.map(v => v.color);
    let checked = 0;

    for (let a = 0; a < g.vertices.length; a++) {
        for (const b of g.vertices[a].edges) {
            for (const c of g.vertices[b].edges) {
                if (c === a) continue;
                for (const d of g.vertices[c].edges) {
                    if (d === b) continue;
                    checked++;
                    assert.ok(new Set([color[a], color[b], color[c], color[d]]).size >= 3,
                        `path ${a}-${b}-${c}-${d} uses fewer than three colours`);
                }
            }
        }
    }
    assert.ok(checked > 0, 'the graph actually contains 4-paths to check');
});

test('the star-bicolouring check is no longer dead code', () => {
    // The decision line used to be commented out, and the commented version
    // was missing its operator: `Object.keys(usedcolors).length  3`.
    const fs = require('node:fs');
    const path = require('node:path');
    const src = fs.readFileSync(
        path.join(__dirname, '..', 'modules', 'bidirectional_compression.js'), 'utf8');

    assert.match(src, /if \(Object\.keys\(usedcolors\)\.length < 3\) end = 0;/,
        'the check now runs');
    assert.doesNotMatch(src, /\/\/if\(Object\.keys\(usedcolors\)/,
        'and the commented-out version is gone');
});

test('bidirectional_compression colours every vertex on every shipped matrix', () => {
    // Guards two things at once: the termination fix (it used to stop at half)
    // and the cost of the star-bicolouring check, which is a quadruple-nested
    // loop over neighbourhoods and only runs once everything is coloured.
    for (const name of mm.listMatrices()) {
        const strict = mm.readStrict(mm.load(name));
        const shipped = mm.readAsShipped(mm.load(name));

        const env = createEnvironment();
        loadModule(env, 'bidirectional_compression', 'global_bc');
        installGraph(env, shipped.edges, strict.rows, 'bipartite', strict.cols);
        run(env, 'colors = range(0, 22)');

        const started = Date.now();
        for (let v = 0; v < strict.rows + strict.cols; v++) {
            click(env, 'bidirectional_compression', v);
        }
        const elapsed = Date.now() - started;

        const g = runPlain(env, 'currentg');
        assert.equal(g.vertices.filter(v => v.color === -1).length, 0,
            `${name}: every row and column is coloured`);
        assert.equal(run(env, '__events.roundsCompleted'), 1,
            `${name}: the round completes exactly once`);
        assert.ok(elapsed < 2000,
            `${name}: finished in ${elapsed}ms — the validity check is not a hot spot`);
    }
});
