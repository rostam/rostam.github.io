function bipgraph(edges,n,m) {
    var G = {vertices : []};
    var i;
    for(i=0;i<2*n;i++)  G.vertices.push({edges:[], color:-1});

    for (i = 0; i < edges.length; i++) {
        if(G.vertices[edges[i].src].edges.indexOf(edges[i].tgt+n) == -1)
            G.vertices[edges[i].src].edges.push(edges[i].tgt+n);
        if(G.vertices[edges[i].tgt+n].edges.indexOf(edges[i].src) == -1)
            G.vertices[edges[i].tgt+n].edges.push(edges[i].src);
    }
    G.init_edges = edges;
    return G;
}