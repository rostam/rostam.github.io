var reference_ccb = function () {
    reference_text= "H. M. Bücker, M. A. Rostami : Interactively exploring the connection " +
        "between bidirectional compression and star bicoloring. ICCS 2015.";
    reference_url= "10.1016/j.procs.2015.05.456";
};

var global_ccb = function () {
    graph_format = "bipartite";
    colors = range(0, 22);
    chart_yaxis1_text = "Number of colors";
    chart_group5_text = 'Number of colors';
    start_matrix = "arrow-shaped2.mtx";
    animation = false;
    post_processing_name = "";
};

var column_compression_bip = function() {
    if (current >= currentg.vertices.length / 2) {
        var ns = d2_neighbors(current);
        var col_ns = get_colors(ns);
        var new_col = min(diff(colors, col_ns));
        color_column(current - currentg.vertices.length / 2, new_col);
        color_vertex(current, new_col);
        var test_end = get_colored_vertices().length == currentg.vertices.length/2;
        if (test_end) gather_round_data(min(diff(colors, get_colors(get_colored_vertices()))), 0, 0, 0, 0);
        if (test_end) round_completed();
    }
};

var post_processing_ccb = function () {

};