var reference_mvp = function () {
    reference_text= "M. A. Rostami, H. M. Bücker : An educational module illustrating " +
        "how sparse matrix-vector multiplication on parallel processors connects to graph partitioning.";
    reference_url= "10.1007/978-3-319-27308-2_12";
};

var global_mvp = function () {
    graph_format="simple";
    colors = range(0,22);
    chart_yaxis1_text = "Number of colors";
    chart_group5_text = 'Number of colors';
    animation = false;
    post_processing_name = "";
};

var matrix_vector_product = function() {
var ns = neighbors(current);
var col_ns = get_colors(ns);
var new_col = min(diff(colors, col_ns));
color_column(current, new_col);
color_vertex(current, new_col);
if(get_colored_vertices().length == currentg.vertices.length) {
    gather_round_data(min(diff(colors,get_colors(get_colored_vertices()))), 0, 0, 0, 0);
    round_completed();
}
};

var post_processing_mvp = function () {

};