var reference_cf = function () {
    reference_text= "M. Lülfesmann, S. R. Leßenich, H. M. Bücker : " +
        "Interactively exploring elimination orderings in symbolic sparse Cholesky factorization." +
        "ICCS 2010.";
    reference_url= "10.1016/j.procs.2010.04.095";
};

var global_cf = function () {
    graph_format="simple";
    all_fillins = [];
    chart_yaxis1_text = "Number of fill-in";
    chart_group5_text = 'Number of fill-in';
    start_matrix = "cholesky.mtx";
    animation = true;
    post_processing_name = "Show fill-ins";
};

var cholesky_factorization = function() {
    var ns = neighbors(current);
    remove_vertex(current);
    make_clique(ns);
    all_fillins=all_fillins.concat(specify_fillins(ns,order));
    updateMatrix(currentg.vertices.length,order);
    drawNonzeros(currentg,order);
    var isCl = is_clique(currentg);
    if(isCl) gather_round_data(all_fillins.length, 0, 0, 0, 0);
    if(isCl) round_completed();
};

var post_processing_cf = function () {
    // drawGraph(currentg);
    show_fillins(order,all_fillins);
};