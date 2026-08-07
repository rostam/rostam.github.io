/**
 * Bipartite graph of a sparse matrix: one vertex per row, one per column.
 *
 * Layout: rows occupy 0 .. numRows-1, columns occupy numRows .. numRows+numCols-1.
 * `numRows` is recorded on the graph because callers previously derived the
 * split as `vertices.length / 2`, which is only right for a square matrix.
 *
 * @param edges  {src: row, tgt: column}, 0-based
 * @param n      number of rows
 * @param m      number of entries (unused; kept for call-site compatibility)
 * @param n2     number of columns; defaults to n for a square matrix
 */
function bipgraph(edges,n,m,n2) {
    var numCols = (n2 === undefined || n2 === null) ? n : n2;
    var G = {vertices : []};
    var i;
    for(i=0;i<n+numCols;i++)  G.vertices.push({edges:[], color:-1});

    for (i = 0; i < edges.length; i++) {
        var row = edges[i].src, col = edges[i].tgt + n;
        if (row < 0 || row >= n || edges[i].tgt < 0 || edges[i].tgt >= numCols) continue;

        if(G.vertices[row].edges.indexOf(col) == -1)
            G.vertices[row].edges.push(col);
        if(G.vertices[col].edges.indexOf(row) == -1)
            G.vertices[col].edges.push(row);
    }
    G.init_edges = edges;
    G.numRows = n;
    G.numCols = numCols;
    return G;
}

/** Index of the first column vertex, tolerating graphs built before numRows existed. */
function firstColumnVertex(G) {
    return G.numRows === undefined ? G.vertices.length / 2 : G.numRows;
}
