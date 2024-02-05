var reference_bc = function () {
    reference_text= "H. M. Bücker, M. A. Rostami : Interactively exploring the connection " +
        "between bidirectional compression and star bicoloring. ICCS 2015.";
    reference_url= "10.1016/j.procs.2015.05.456";
};

var global_bc = function () {
graph_format="bipartite";
colors = range(0,22);
chart_yaxis1_text = "Number of colors";
chart_group5_text = 'Number of colors';
start_matrix = "arrow-shaped2.mtx";
animation = false;
post_processing_name = "";
};

var bidirectional_compression = function() {
    var ns = neighbors(current);
    var ns2 = d2_neighbors(current);
    var col_ns = get_colors(ns);
    var col_ns2 = get_colors(ns2);
    var max_col_ns = max(col_ns);
    var ns = d2_neighbors(current);
    var col_ns = get_colors(ns);
    var ns_current = neighbors(current);
    ns_current.forEach(function (nc) {
        var n_n_c = neighbors(nc);
        n_n_c.forEach(function (nnc) {
            if (nnc != current) {
                if (get_vertex_color(nnc) != 0) {
                    if (get_vertex_color(nc) == 0) {
                        col_ns.push(get_vertex_color(nnc));
                    }
                }
            }
        });
    });
    var new_col = min(diff(colors, col_ns));
    if (current < currentg.vertices.length / 2) {
        color_row(current, new_col);
        color_vertex(current, new_col);
    }
    if (current >= currentg.vertices.length / 2) {
        color_column(current - currentg.vertices.length / 2, dcolors.length - new_col - 1);
        color_vertex(current, dcolors.length - new_col - 1);
    }
    var end = 1;
    var cnt = 0;
    Object.keys(currentg.vertices).forEach(function (c) {
      if(get_vertex_color(c) == -1) {
          cnt = cnt + 1;
      }
    });
    if(cnt > numOfVertices()/2) end = 0;
    if(end == 1) {
        Object.keys(currentg.vertices).forEach(function (c) {
            if (end == 0) return;
            neighbors(c).forEach(function (nc) {
                neighbors(nc).forEach(function (nnc) {
                    if (nnc != c) {
                        if (get_vertex_color(nnc) != -1) {
                            if (get_vertex_color(nc) == -1 && get_vertex_color(c) == -1) {
                                end = 0;
                                return;
                            }
                        }
                    }
                });
            });
        });
    }
    if(end == 1) {
        Object.keys(currentg.vertices).forEach(function (c) {
            if (end == 0) return;
            neighbors(c).forEach(function (nc) {
                neighbors(nc).forEach(function (nnc) {
                    if (nnc != c) {
                        neighbors(nnc).forEach(function (nnnc) {
                            if (nnnc != nc) {
                                var usedcolors = {};
                                usedcolors[get_vertex_color(c)] = c;
                                usedcolors[get_vertex_color(nc)] = nc;
                                usedcolors[get_vertex_color(nnc)] = nnc;
                                usedcolors[get_vertex_color(nnnc)] = nnnc;
                                //if(Object.keys(usedcolors).length  3) {end = 1;}
                                //else end = 0;
                            }
                        });
                    }
                });
            });
        });
    }
    if(end == 1) {
        round_completed();
        gather_round_data(numOfVertices() - cnt, 0, 0, 0, 0);
    }
};

var post_processing_bc = function () {

};