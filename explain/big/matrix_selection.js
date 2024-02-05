/**
 * Created by rostam on 19.10.16.
 */
var mats = ["arrow-shaped.mtx","arrow-shaped2.mtx","diag-row.mtx",
    "diag-row2.mtx","diag-column.mtx","cholesky.mtx",
    "nestedDissection1.mtx","nestedDissection2.mtx","nestedDissection3.mtx","nestedDissection4.mtx"];
function fill_matrix_selection() {
    mats.forEach(function (mat_name) {
        if (eval("start_matrix") == mat_name)
            d3.select('#selectMat').append("option")
                .attr("value", mat_name).html(mat_name)
                .property("selected", true);
        else
            d3.select('#selectMat').append("option")
                .attr("value", mat_name).html(mat_name);
    });
}