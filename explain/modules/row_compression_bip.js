var reference_rcb = function () {
    reference_text= "H. M. Bücker, M. A. Rostami : Interactively exploring the connection " +
        "between bidirectional compression and star bicoloring. ICCS 2015.";
    reference_url= "10.1016/j.procs.2015.05.456";
};

var global_rcb = function () {
graph_format="bipartite";
colors = range(0,22);
chart_yaxis1_text = "Number of colors";
chart_group5_text = 'Number of colors';
start_matrix = "arrow-shaped2.mtx";
animation = false;
post_processing_name = "";
};

var row_compression_bip = function() {
    var numRows = first_column_vertex();
    if (current < numRows) {
        var ns = d2_neighbors(current);
        var col_ns = get_colors(ns);
        var new_col = min(diff(colors, col_ns));
        color_row(current, new_col);
        color_vertex(current, new_col);
        // This module previously had no completion test at all, so the chart
        // stayed empty and the round counter never advanced no matter how many
        // rows were coloured.
        var test_end = get_colored_vertices().length == numRows;
        if (test_end) {
            gather_round_data(number_of_colors_used(), 0, 0, 0, 0);
            round_completed();
        }
    }
};

var post_processing_rcb = function () {

};
