var reference_rcb = function () {
    reference_text= "H. M. Bücker, M. A. Rostami : Interactively exploring the connection " +
        "between bidirectional compression and star bicoloring. ICCS 2015.";
    reference_url= "10.1016/j.procs.2015.05.456";
};

var global_rcb = function () {
graph_format="bipartite";
colors = range(0,22);
start_matrix = "arrow-shaped2.mtx";
animation = false;
post_processing_name = "";
};

var row_compression_bip = function() {
if(current < currentg.vertices.length/2) {
    var ns = d2_neighbors(current);
    var col_ns = get_colors(ns);
    var new_col = min(diff(colors, col_ns));
    color_row(current, new_col);
    color_vertex(current, new_col);
}
};

var post_processing_rcb = function () {

};