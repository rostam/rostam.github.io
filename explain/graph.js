/**
 * Generate a simple Graph
 * @param edges adjacency list structure of graph
 * @param n number of vertices
 * @param m number of edges
 * @returns the simple graph: {{vertices: Array}}
 */
/**
 * Diagonal entries of a matrix would otherwise become self-loops, which make
 * a vertex its own neighbour. Every algorithm here works on simple graphs
 * (elimination graphs, intersection graphs), so the diagonal is dropped from
 * the adjacency. init_edges keeps the full pattern for drawing the matrix.
 */
function graph(edges,n,m) {
    var G = {vertices : []};
    var i;
    for(i=0;i<n;i++)  G.vertices.push({edges:[], color:-1});

    for (i = 0; i < edges.length; i++) {
        if(edges[i].src === edges[i].tgt) continue;

        if(G.vertices[edges[i].src].edges.indexOf(edges[i].tgt) === -1)
            G.vertices[edges[i].src].edges.push(edges[i].tgt);

        if(G.vertices[edges[i].tgt].edges.indexOf(edges[i].src) === -1)
            G.vertices[edges[i].tgt].edges.push(edges[i].src);
    }
    G.init_edges = edges;
    G.numRows = n;
    G.numCols = n;
    return G;
}

/**
 * Column intersection graph: one vertex per COLUMN, with two columns adjacent
 * when some row has a nonzero in both. Edges carry src = row, tgt = column
 * (see file_handle.js), so the grouping key is tgt.
 *
 * This used to group by src, which builds the ROW intersection graph. The two
 * coincide for a structurally symmetric matrix — which every shipped matrix
 * is — but not otherwise, and the module colours columns.
 *
 * @param n number of columns
 */
function cigraph(edges,n,m) {
    var G = {vertices : []};
    var i,j;

    for(i=0;i<n;i++)  G.vertices.push({edges:[], color:-1});

    // Bucket the columns touched by each row, then clique each bucket.
    var columnsOfRow = {};
    for (i = 0; i < edges.length; i++) {
        var row = edges[i].src, col = edges[i].tgt;
        if (col < 0 || col >= n) continue;
        if (columnsOfRow[row] === undefined) columnsOfRow[row] = [];
        if (columnsOfRow[row].indexOf(col) === -1) columnsOfRow[row].push(col);
    }

    Object.keys(columnsOfRow).forEach(function (row) {
        var cols = columnsOfRow[row];
        for (i = 0; i < cols.length; i++) {
            for (j = i + 1; j < cols.length; j++) {
                if(G.vertices[cols[i]].edges.indexOf(cols[j]) == -1)
                    G.vertices[cols[i]].edges.push(cols[j]);
                if(G.vertices[cols[j]].edges.indexOf(cols[i]) == -1)
                    G.vertices[cols[j]].edges.push(cols[i]);
            }
        }
    });

    G.init_edges = edges;
    G.numRows = n;
    G.numCols = n;
    return G;
}

function removeVertices(g,vs) {
    for (var kk = 0; kk < vs.length; kk++)
        g = removeVertex(g, vs[kk]);
    return g;
}

function removeVertex(G, v) {
    for (var i = 0; i < G.vertices.length; i += 1) {
        if(G.vertices[i].edges.indexOf(v)!=-1) {
            G.vertices[i].edges.splice(G.vertices[i].edges.indexOf(v), 1);
        }
    }
    G.vertices[v].edges = [];
    return G;
}

function bfs(G, s) {
    var i, Q = [],
        u, v;

    for (i = 0; i < G.vertices.length; i += 1) {
        G.vertices[i].color = 'white';
        G.vertices[i].distance = Number.POSITIVE_INFINITY;
        G.vertices[i].parent = null;
    }

    G.vertices[s].color = 'grey';
    G.vertices[s].distance = 0;
    G.vertices[s].parent = null;

    Q.push(s);

    while (Q.length > 0) {
        u = Q.splice(0, 1)[0];
        for (i = 0; i < G.vertices[u].edges.length; i += 1) {
            v = G.vertices[u].edges[i];
            if (G.vertices[v].color === 'white') {
                G.vertices[v].color = 'grey';
                G.vertices[v].distance = G.vertices[u].distance + 1;
                G.vertices[v].parent = u;
                Q.push(v);
            }
        }
        G.vertices[u].color = 'black';
    }
    return G;
}

function allVSeen(G,selected) {
    var partitions = {};
    partitions.notSeen = [];
    partitions.seen = [];
    var i;
    for(i=0;i<G.vertices.length;i++) {
        if(G.vertices[i].distance == Number.POSITIVE_INFINITY) {
            if(selected.indexOf(i)==-1) {
                partitions.notSeen.push(i);
            }
        } else {
            partitions.seen.push(i);
        }
    }
    partitions.order = [];
    partitions.order = partitions.order.concat(partitions.seen).concat(partitions.notSeen).concat(selected);
    return partitions;
}

function numOfVertices(g) {
    return (g || currentg).vertices.length;
}

function isClique(G) {
    // Object.keys yields strings; the edge lists hold numbers, and indexOf is
    // strict, so without the conversion no edge is ever found and every graph
    // reports false.
    var tmp = Object.keys(G.vertices).map(Number);
    for(var u=0;u<tmp.length;u++) {
        for(var v=0;v<tmp.length;v++) {
            if(u!=v) {
                if (!isEdge(G, tmp[u], tmp[v]) && !isEdge(G, tmp[v], tmp[u])) {
                    return false;
                }
            }
        }
    }
    return true;
}

function isEdge(G, u, v) {
    return G.vertices[u].edges.indexOf(v) != -1;

}

// G should be colored.
// The tally used to be a fixed [0,0,0,0]; a fifth part incremented a hole
// (undefined++ === NaN) and max() propagated the NaN through the result.
function deviationBound(G) {
        var counts = {};
        var i;
        for (i = 0; i < G.vertices.length; i += 1) {
                var c = G.vertices[i].color;
                if (c === -1 || c === undefined) continue;
                counts[c] = (counts[c] || 0) + 1;
        }
        var sizes = Object.keys(counts).map(function (c) { return counts[c]; });
        if (sizes.length === 0) return 0;
        return (sizes.length * max(sizes) / G.vertices.length) - 1;
}

function communicationVolume(G) {
        commVolume = 0;
        G.init_edges.forEach(function(e){
                        if(G.vertices[e.src].color != G.vertices[e.tgt].color) commVolume++;
        });
        return commVolume;
}
