var reference_cc = function () {
    reference_text= "H. M. Bücker, M. A. Rostami, M. Lülfesmann : " +
        "An interactive educational module illustrating sparse matrix compression via graph coloring. ICL 2013 ";
    reference_url= "10.1109/ICL.2013.6644591";
};

var global_cc = function () {
    graph_format="cig";
    colors = range(0,22);
    chart_yaxis1_text = "Number of colors";
    chart_group5_text = 'Number of colors';
    start_matrix = "nestedDissection3.mtx";
    animation = true;
    post_processing_name = "";
};

var column_compression = function() {
    var ns = neighbors(current);
    var col_ns = get_colors(ns);
    var new_col = min(diff(colors, col_ns));
    color_column(current, new_col);
    color_vertex(current, new_col);
    var test_end = get_colored_vertices().length == currentg.vertices.length;
    if (test_end) gather_round_data(min(diff(colors, get_colors(get_colored_vertices()))), 0, 0, 0, 0);
    if (test_end) round_completed();
};

var post_processing_cc = function () {

};