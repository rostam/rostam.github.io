/**
 * reference.js — independent implementations of the algorithms EXPLAIN teaches.
 *
 * These are deliberately written from the textbook definitions rather than
 * derived from the shipped code, so that comparing the two says something.
 */

'use strict';

/** Column intersection graph: columns adjacent when they share a nonzero row. */
function columnIntersectionGraph(entries, numCols) {
    const adj = Array.from({ length: numCols }, () => new Set());
    const rows = new Map();

    for (const { row, col } of entries) {
        if (!rows.has(row)) rows.set(row, []);
        rows.get(row).push(col);
    }
    for (const cols of rows.values()) {
        for (const a of cols) {
            for (const b of cols) if (a !== b) adj[a].add(b);
        }
    }
    return adj.map(s => [...s].sort((x, y) => x - y));
}

/**
 * Greedy (first-fit) colouring in the given vertex order.
 * Self-loops are ignored — a vertex cannot conflict with itself.
 */
function greedyColoring(adj, order) {
    const color = new Array(adj.length).fill(-1);
    for (const v of order) {
        const used = new Set();
        for (const u of adj[v]) if (u !== v && color[u] !== -1) used.add(color[u]);
        let c = 0;
        while (used.has(c)) c++;
        color[v] = c;
    }
    return color;
}

/** True when no edge joins two equally-coloured vertices. */
function isProperColoring(adj, color) {
    for (let v = 0; v < adj.length; v++) {
        for (const u of adj[v]) {
            if (u !== v && color[u] === color[v]) return false;
        }
    }
    return true;
}

function countColors(color) {
    return new Set(color.filter(c => c !== -1)).size;
}

/**
 * Symbolic Cholesky by vertex elimination.
 * Returns the fill EDGES (each unordered pair once) in elimination order.
 */
function symbolicCholeskyFill(adj, order) {
    const g = adj.map(s => new Set(s));
    for (let v = 0; v < g.length; v++) g[v].delete(v); // drop diagonal
    const fill = [];
    const eliminated = new Set();

    for (const v of order) {
        const live = [...g[v]].filter(u => !eliminated.has(u));
        for (let a = 0; a < live.length; a++) {
            for (let b = a + 1; b < live.length; b++) {
                const [x, y] = [live[a], live[b]];
                if (!g[x].has(y)) {
                    g[x].add(y);
                    g[y].add(x);
                    fill.push([Math.min(x, y), Math.max(x, y)]);
                }
            }
        }
        eliminated.add(v);
        for (const u of g[v]) g[u].delete(v);
        g[v].clear();
    }
    return fill;
}

/** Distance-2 neighbours of `v`, deduplicated and excluding `v` itself. */
function distance2Neighbors(adj, v) {
    const out = new Set();
    for (const u of adj[v]) {
        for (const w of adj[u]) if (w !== v) out.add(w);
    }
    return [...out].sort((a, b) => a - b);
}

/** Breadth-first distances from `s`; unreachable vertices stay Infinity. */
function bfsDistances(adj, s) {
    const dist = new Array(adj.length).fill(Infinity);
    dist[s] = 0;
    const queue = [s];
    while (queue.length) {
        const u = queue.shift();
        for (const v of adj[u]) {
            if (dist[v] === Infinity) {
                dist[v] = dist[u] + 1;
                queue.push(v);
            }
        }
    }
    return dist;
}

/**
 * Communication volume of a partition: edges whose endpoints differ in part.
 * Counts each entry of `edges` once, so a symmetric edge list counts twice —
 * matching graph.js `communicationVolume`, which iterates `init_edges`.
 */
function communicationVolume(edges, part) {
    let volume = 0;
    for (const e of edges) if (part[e.src] !== part[e.tgt]) volume++;
    return volume;
}

/** A vertex separator is valid when removing it disconnects the two parts. */
function isVertexSeparator(adj, separator, partA, partB) {
    const sep = new Set(separator);
    const inA = new Set(partA);
    const inB = new Set(partB);
    for (const a of inA) {
        if (sep.has(a)) continue;
        for (const u of adj[a]) {
            if (!sep.has(u) && inB.has(u)) return false;
        }
    }
    return true;
}

module.exports = {
    columnIntersectionGraph,
    greedyColoring,
    isProperColoring,
    countColors,
    symbolicCholeskyFill,
    distance2Neighbors,
    bfsDistances,
    communicationVolume,
    isVertexSeparator
};
