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

/* --------------------------------------------------------------------------
   Vertex orderings.

   These are the standard greedy-colouring orderings. They exist so a student
   can score a known heuristic and then try to beat it by hand — the "Change
   Order" menu offered them but only ever computed one, and appended to the
   existing order instead of replacing it.

   Each takes a graph and an optional `domain` (the subset of vertex ids that
   may be ordered — for a bipartite graph only one side is clickable) and
   returns a permutation of that domain.
   -------------------------------------------------------------------------- */

function orderDomainOf(G, domain) {
    if (domain && domain.length) return domain.slice();
    var all = [];
    for (var v = 0; v < G.vertices.length; v++) all.push(v);
    return all;
}

/** Degree of v counting only neighbours inside `domain`. */
function degreeWithin(G, v, inDomain) {
    var d = 0;
    G.vertices[v].edges.forEach(function (u) { if (inDomain[u]) d++; });
    return d;
}

/** Natural ordering: 0, 1, 2, ... */
function naturalOrder(G, domain) {
    return orderDomainOf(G, domain).sort(function (a, b) { return a - b; });
}

/** Largest-First: highest degree first. */
function largestFirstOrder(G, domain) {
    var dom = orderDomainOf(G, domain);
    var inDomain = {};
    dom.forEach(function (v) { inDomain[v] = true; });

    return dom.sort(function (a, b) {
        var da = degreeWithin(G, a, inDomain), db = degreeWithin(G, b, inDomain);
        return db - da || a - b;
    });
}

/**
 * Smallest-Last: repeatedly strip the currently lowest-degree vertex, then
 * reverse the removal sequence. Gives a good bound on the number of colours.
 */
function smallestLastOrder(G, domain) {
    var dom = orderDomainOf(G, domain);
    var inDomain = {}, live = {}, deg = {};
    dom.forEach(function (v) { inDomain[v] = true; live[v] = true; });
    dom.forEach(function (v) { deg[v] = degreeWithin(G, v, inDomain); });

    var removalOrder = [];
    for (var step = 0; step < dom.length; step++) {
        var pick = -1;
        dom.forEach(function (v) {
            if (!live[v]) return;
            if (pick === -1 || deg[v] < deg[pick] || (deg[v] === deg[pick] && v < pick)) pick = v;
        });
        live[pick] = false;
        removalOrder.push(pick);
        G.vertices[pick].edges.forEach(function (u) {
            if (live[u] && inDomain[u]) deg[u]--;
        });
    }
    return removalOrder.reverse();
}

/**
 * Incidence-Degree: repeatedly take the vertex with the most already-ordered
 * neighbours, breaking ties on total degree.
 */
function incidenceDegreeOrder(G, domain) {
    var dom = orderDomainOf(G, domain);
    var inDomain = {}, pending = {}, incidence = {};
    dom.forEach(function (v) { inDomain[v] = true; pending[v] = true; incidence[v] = 0; });

    var out = [];
    for (var step = 0; step < dom.length; step++) {
        var pick = -1;
        dom.forEach(function (v) {
            if (!pending[v]) return;
            if (pick === -1) { pick = v; return; }
            if (incidence[v] > incidence[pick]) { pick = v; return; }
            if (incidence[v] === incidence[pick]) {
                var dv = degreeWithin(G, v, inDomain), dp = degreeWithin(G, pick, inDomain);
                if (dv > dp || (dv === dp && v < pick)) pick = v;
            }
        });
        pending[pick] = false;
        out.push(pick);
        G.vertices[pick].edges.forEach(function (u) {
            if (pending[u] && inDomain[u]) incidence[u]++;
        });
    }
    return out;
}

/** Look up an ordering by the key used in the "Change Order" menu. */
function orderingByName(name, G, domain) {
    switch (name) {
        case 'lfo': return largestFirstOrder(G, domain);
        case 'slo': return smallestLastOrder(G, domain);
        case 'ido': return incidenceDegreeOrder(G, domain);
        case 'nat':
        default:    return naturalOrder(G, domain);
    }
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