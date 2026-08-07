/**
 * Generate a simple Graph
 * @param edges adjacency list structure of graph
 * @param n number of vertices
 * @param m number of edges
 * @returns the simple graph: {{vertices: Array}}
 */
function graph(edges,n,m) {
    var G = {vertices : []};
    var i;
    for(i=0;i<n;i++)  G.vertices.push({edges:[], color:-1});

    for (i = 0; i < edges.length; i++) {
        // Diagonal entries would become self-loops; these algorithms work on
        // simple graphs. init_edges keeps the full pattern for drawing.
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
 * Column intersection graph: one vertex per COLUMN, two columns adjacent when
 * some row has a nonzero in both. Edges carry src = row, tgt = column, so the
 * grouping key is tgt. This used to group by src, which builds the ROW
 * intersection graph -- the same thing only for a symmetric pattern.
 *
 * @param n number of columns
 */
function cigraph(edges,n,m) {
    var G = {vertices : []};
    var i,j;

    for(i=0;i<n;i++)  G.vertices.push({edges:[], color:-1});

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

function components() {
    return cy.elements().components();
}

function removeVertices(vs) {
    for (var kk = 0; kk < vs.length; kk++)
        cy.remove("node[weight > 50]");
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

function allVSeen(selected) {
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

function numOfVertices() {
    //return currentg.vertices.length;
    return cy.nodes().length;
}

function isClique(G) {
    // Object.keys yields strings and the edge lists hold numbers; without the
    // conversion indexOf never matches and every graph reports false.
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