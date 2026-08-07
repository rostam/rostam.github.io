/**
 * duplication.test.js — modules/ vs big/modules/.
 *
 * The big-graph variant of EXPLAIN is a copy of the whole module tree. Copies
 * drift, and one already has. These tests fail loudly when a fix lands in one
 * copy but not the other.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const EXPLAIN = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(EXPLAIN, p), 'utf8');

/** Files that are byte-identical today and should stay in step. */
const MIRRORED = [
    'column_compression',
    'cholesky_factorization',
    'column_compression_bip',
    'row_compression_bip',
    'bidirectional_compression'
];

for (const name of MIRRORED) {
    test(`modules/${name}.js and big/modules/${name}.js stay identical`, () => {
        assert.equal(
            read(`modules/${name}.js`),
            read(`big/modules/${name}.js`),
            `these two copies have drifted — a fix probably landed in only one of them`
        );
    });
}

test('the stale big/modules/matrix_vector_product.js is gone', () => {
    // It held a copy of the COLUMN COMPRESSION algorithm, complete with
    // column-compression chart labels and no start_matrix. It was unreachable
    // (the menu wires only "Nested Dissection Big" through
    // loadModuleBigGraphs), and the big tree has no color_row_notriangle,
    // deviationBound or communicationVolume for the real module to call — so
    // it was deleted rather than replaced with code that would throw.
    assert.ok(!fs.existsSync(path.join(EXPLAIN, 'big', 'modules', 'matrix_vector_product.js')),
        'the stale copy is not back');

    for (const fn of ['color_row_notriangle', 'deviationBound', 'communicationVolume']) {
        const present = ['big/graph.js', 'big/graphic.js']
            .some(f => read(f).includes('function ' + fn));
        assert.ok(!present,
            `${fn} is still absent from the big tree — reinstating the module needs it first`);
    }

    // The standard module is untouched and still the real algorithm.
    const standard = read('modules/matrix_vector_product.js');
    assert.match(standard, /color_row_notriangle\(current, selected_color\)/);
    assert.match(standard, /deviationBound\(currentg\)/);
    assert.match(standard, /communicationVolume\(currentg\)/);
});

test('the big menu exposes only the module that has a working big variant', () => {
    const menu = read('index.html');
    const bigCalls = [...menu.matchAll(/loadModuleBigGraphs\("([^"]+)"/g)].map(m => m[1]);

    assert.deepEqual(bigCalls, ['Nested Dissection Big'],
        'if another big module is ever linked, check big/modules/ first');
});

test('the shared graph code differs between the trees, so fixes are applied to both', () => {
    // graph.js and graphic.js are NOT identical across the trees (the big
    // variant swaps d3 rendering for Cytoscape), so every fix has to be ported
    // deliberately rather than copied. These assertions check it was.
    assert.notEqual(read('graph.js'), read('big/graph.js'),
        'graph.js genuinely differs — do not blind-copy between trees');
    assert.notEqual(read('graphic.js'), read('big/graphic.js'),
        'graphic.js genuinely differs');

    for (const file of ['graph.js', 'big/graph.js']) {
        const src = read(file);
        assert.match(src, /Object\.keys\(G\.vertices\)\.map\(Number\)/,
            `${file}: isClique converts its keys to numbers`);
        assert.match(src, /if\(edges\[i\]\.src === edges\[i\]\.tgt\) continue;/,
            `${file}: graph() drops diagonal entries`);
        assert.match(src, /columnsOfRow/,
            `${file}: cigraph() groups by column`);
    }

    for (const file of ['graphic.js', 'big/graphic.js']) {
        const src = read(file);
        assert.match(src, /if \(u === v\) return;/,
            `${file}: make_clique skips the self-pair`);
        assert.match(src, /ret\.indexOf\(n2\) === -1/,
            `${file}: d2_neighbors deduplicates`);
        assert.match(src, /function first_column_vertex\(\)/,
            `${file}: exposes first_column_vertex for the bipartite modules`);
    }

    for (const file of ['bipgraph.js', 'big/bipgraph.js', 'distinguished_color.js',
                        'big/distinguished_color.js']) {
        assert.ok(fs.existsSync(path.join(EXPLAIN, file)), `${file} exists`);
    }
    assert.equal(read('bipgraph.js'), read('big/bipgraph.js'),
        'bipgraph.js is identical in both trees');
    assert.equal(read('distinguished_color.js'), read('big/distinguished_color.js'),
        'the palette is identical in both trees');
});

test('every module referenced by the menu actually exists', () => {
    const menu = read('index.html');
    const names = [...menu.matchAll(/loadModule(?:BigGraphs)?\("([^"]+)"/g)].map(m => m[1]);

    assert.ok(names.length >= 8, 'the menu links a full set of modules');

    for (const display of names) {
        // index.html derives the file name by lower-casing and joining with _.
        const file = display.toLowerCase().split(' ').join('_') + '.js';
        const inStandard = fs.existsSync(path.join(EXPLAIN, 'modules', file));
        const inBig = fs.existsSync(path.join(EXPLAIN, 'big', 'modules', file));

        assert.ok(inStandard || inBig,
            `"${display}" maps to ${file}, which exists in neither modules/ nor big/modules/`);
    }
});
