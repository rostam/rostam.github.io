var reference_mvp = function () {
    reference_text= "M. A. Rostami, H. M. Bücker : An educational module illustrating " +
        "how sparse matrix-vector multiplication on parallel processors connects to graph partitioning.";
    reference_url= "10.1007/978-3-319-27308-2_12";
};

var global_mvp = function () {
    graph_format="simple";
    colors = range(0,22);
    chart_yaxis1_text = "Deviation bound";
    chart_yaxis2_text = "Communication volume";
    chart_group1_text = 'Communication volume';
    //chart_group2_text = 'Communication volume';
    chart_group5_text = 'Deviation bound';
    start_matrix = "nestedDissection3.mtx";
    animation = false;
    post_processing_name = "";
    selected_color = 0;
    $('input:radio').click(function() {selected_color = this.value;});
};

var matrix_vector_product = function() {
    color_row_notriangle(current, selected_color);
    color_vertex(current, selected_color);
    if(get_colored_vertices().length == currentg.vertices.length) {
        console.log(deviationBound(currentg));
        console.log(communicationVolume(currentg));
        gather_round_data(deviationBound(currentg), communicationVolume(currentg), 0, 0, 0);
        round_completed();
    }
};

var post_processing_mvp = function () {

};
