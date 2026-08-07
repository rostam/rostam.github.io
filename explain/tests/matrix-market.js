/**
 * matrix-market.js — Matrix Market reading for the tests.
 *
 * Two readers on purpose:
 *
 *   readAsShipped()  reproduces exactly what file_handle.js `init()` does, so
 *                    tests can assert on the parser the site actually uses
 *                    (including its limitations).
 *   readStrict()     a correct reader used to build expected values.
 *
 * Where the two disagree, that disagreement is a finding, not a test bug.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const MATRIX_DIR = path.join(__dirname, '..', 'matrices');

/**
 * Reproduces file_handle.js `init()`: skips '%' comment lines and blanks,
 * splits on any run of whitespace, drops out-of-range entries, and mirrors
 * off-diagonal entries when the header says "symmetric".
 *
 * Returns `n2` (column count) as well, which `init()` now passes to bipgraph.
 */
function readAsShipped(text) {
    const lines = text.split(/\r?\n/);
    const header = lines[0] || '';
    const body = lines
        .map(l => l.trim())
        .filter(l => l.length > 0 && l.charAt(0) !== '%');

    if (body.length === 0) return { n: NaN, n2: NaN, m: 0, edges: [], symmetric: false };

    const sizes = body[0].split(/\s+/);
    const n = parseInt(sizes[0], 10);
    const n2 = sizes.length > 1 ? parseInt(sizes[1], 10) : n;
    let m = sizes.length > 2 ? parseInt(sizes[2], 10) : body.length - 1;
    if (!(m >= 0) || m > body.length - 1) m = body.length - 1;

    const symmetric = header.indexOf('symmetric') !== -1;
    const edges = [];

    for (let i = 0; i < m; i++) {
        const tmp = body[i + 1].split(/\s+/);
        const r = parseInt(tmp[0], 10) - 1;
        const c = parseInt(tmp[1], 10) - 1;
        if (!(r >= 0 && r < n && c >= 0 && c < n2)) continue;
        edges.push({ src: r, tgt: c });
        if (symmetric && r !== c) edges.push({ src: c, tgt: r });
    }
    return { n, n2, m, edges, symmetric };
}

/** A correct reader: skips every `%` comment line and tolerates any whitespace. */
function readStrict(text) {
    const lines = text.split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l.length > 0);

    const header = lines[0];
    const body = lines.filter(l => !l.startsWith('%'));
    const [rows, cols, nnz] = body[0].split(/\s+/).map(Number);

    const entries = [];
    for (let i = 1; i <= nnz; i++) {
        const parts = body[i].split(/\s+/);
        entries.push({ row: Number(parts[0]) - 1, col: Number(parts[1]) - 1 });
    }

    return {
        rows, cols, nnz, entries,
        symmetric: /symmetric/.test(header),
        /** Full (both-triangles) pattern as a Set of "r,c" keys. */
        pattern() {
            const set = new Set();
            for (const e of entries) {
                set.add(e.row + ',' + e.col);
                if (this.symmetric) set.add(e.col + ',' + e.row);
            }
            return set;
        },
        /** Undirected adjacency, self-loops (diagonal entries) excluded. */
        adjacency() {
            const adj = Array.from({ length: rows }, () => new Set());
            for (const e of entries) {
                if (e.row === e.col) continue;
                adj[e.row].add(e.col);
                if (this.symmetric) adj[e.col].add(e.row);
            }
            return adj.map(s => [...s].sort((a, b) => a - b));
        }
    };
}

function load(name) {
    return fs.readFileSync(path.join(MATRIX_DIR, name), 'utf8');
}

function listMatrices() {
    return fs.readdirSync(MATRIX_DIR).filter(f => f.endsWith('.mtx')).sort();
}

module.exports = { MATRIX_DIR, load, listMatrices, readAsShipped, readStrict };
