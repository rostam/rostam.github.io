var reference_bc = function () {
    reference_text= "H. M. Bücker, M. A. Rostami : Interactively exploring the connection " +
        "between bidirectional compression and star bicoloring. ICCS 2015.";
    reference_url= "10.1016/j.procs.2015.05.456";
};

var global_bc = function () {
graph_format="bipartite";
colors = range(0, 22);
chart_yaxis1_text = "Number of colors";
chart_group5_text = 'Number of colors';
start_matrix = "arrow-shaped2.mtx";
animation = false;
post_processing_name = "";
};

var bidirectional_compression = function() {
    var numRows = first_column_vertex();

    // Rows are drawn with colour c, columns with dcolors.length - c - 1, so
    // that the two sides occupy opposite ends of the palette and are easy to
    // tell apart. That mirroring is a DISPLAY device: the colouring decisions
    // below all happen in the unmirrored "logical" space. Reading the stored
    // value directly, as this module used to, meant a column saw its
    // neighbours' mirrored colours, excluded the wrong entries from the
    // palette, and handed every column the same colour.
    var mirror = function (c) { return dcolors.length - c - 1; };
    var logical = function (v) {
        var c = get_vertex_color(v);
        if (c == -1) return -1;
        return (v < numRows) ? c : mirror(c);
    };

    var col_ns = d2_neighbors(current).map(logical);

    neighbors(current).forEach(function (nc) {
        neighbors(nc).forEach(function (nnc) {
            if (nnc != current) {
                if (logical(nnc) != 0 && logical(nc) == 0) {
                    col_ns.push(logical(nnc));
                }
            }
        });
    });

    var new_col = min(diff(colors, col_ns));
    if (current < numRows) {
        color_row(current, new_col);
        color_vertex(current, new_col);
    } else {
        var shown = mirror(new_col);
        if (shown < 0) shown = 0;
        color_column(current - numRows, shown);
        color_vertex(current, shown);
    }

    // Count what is still uncoloured. This used to be
    //     if (cnt > numOfVertices() / 2) end = 0;
    // which declared the round finished as soon as HALF the vertices were
    // coloured -- so colouring the rows ended the module with every column
    // still uncoloured, i.e. half a bicolouring.
    var end = 1;
    var cnt = 0;
    Object.keys(currentg.vertices).forEach(function (c) {
      if(get_vertex_color(c) == -1) {
          cnt = cnt + 1;
      }
    });
    if (cnt > 0) end = 0;

    // A star bicoloring requires that every path on four vertices uses at
    // least three colours. This check was written but never enabled -- the
    // decision line was commented out, and was missing its operator.
    if(end == 1) {
        Object.keys(currentg.vertices).forEach(function (c) {
            if (end == 0) return;
            neighbors(c).forEach(function (nc) {
                if (end == 0) return;
                neighbors(nc).forEach(function (nnc) {
                    if (end == 0 || nnc == c) return;
                    neighbors(nnc).forEach(function (nnnc) {
                        if (end == 0 || nnnc == nc) return;
                        var usedcolors = {};
                        usedcolors[get_vertex_color(c)] = c;
                        usedcolors[get_vertex_color(nc)] = nc;
                        usedcolors[get_vertex_color(nnc)] = nnc;
                        usedcolors[get_vertex_color(nnnc)] = nnnc;
                        if (Object.keys(usedcolors).length < 3) end = 0;
                    });
                });
            });
        });
    }

    if(end == 1) {
        // Record the round before announcing it: mouse_event.js renders the
        // label as `rounds.length + " completed!"`, so announcing first made
        // the very first round read "0 completed!".
        gather_round_data(number_of_colors_used(), 0, 0, 0, 0);
        round_completed();
    }
};

var post_processing_bc = function () {

};
