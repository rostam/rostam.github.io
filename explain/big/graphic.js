rVertex = 20;

function drawVertex(g, x, y, id) {
    d3.select("#back" + id).remove();
    d3.select("#ver" + id).remove();
    d3.select("#txt" + id).remove();

    d3.select("#vertices").append("circle")
        .attr("cx", x).attr("cy", y).attr("r", rVertex).attr("id", "back" + id)
        .style("stroke", "black").style("stroke-width", 2).style("fill", "white")
        .style("z-index", "99")
        .style("cursor", "pointer");

    d3.select("#vertices").append("circle")
        .attr("cx", x).attr("cy", y).attr("r", rVertex).attr("id", "ver" + id)
        .style("stroke", "black").style("stroke-width", 2).style("fill", "white")
        .style("z-index", "99")
        .style("cursor", "pointer").on("click", function () {
        clicked(g, id);
    });

    d3.select("#vertices").append("text")
        .attr("x", (id + 1) < 10 ? x - 6 : x - 12).attr("y", y + 6).attr("font-family", "sans-serif")
        .attr("font-size", "22px").style("cursor", "pointer").attr("id", "txt" + id)
        .style("z-index", "99")
        .style("fill", "black").text(id + 1).on("click", function () {
        clicked(g, id);
    });
}

function drawVertexBip(g, x, y, id,n) {
    d3.select("#back" + id).remove();
    d3.select("#ver" + id).remove();
    d3.select("#txt" + id).remove();

    d3.select("#vertices").append("circle")
        .attr("cx", x).attr("cy", y).attr("r", rVertex).attr("id", "back" + id)
        .style("stroke", "black").style("stroke-width", 2).style("fill", "white")
        .style("z-index", "99")
        .style("cursor", "pointer");

    d3.select("#vertices").append("circle")
        .attr("cx", x).attr("cy", y).attr("r", rVertex).attr("id", "ver" + id)
        .style("stroke", "black").style("stroke-width", 2).style("fill", "white")
        .style("z-index", "99")
        .style("cursor", "pointer").on("click", function () {
        clicked(g, id);
    });

    var orig_id = id < n/2 ? id : id - (n/2);
    d3.select("#vertices").append("text")
        .attr("x", (orig_id + 1) < 10 ? x - 14 : x - 12).attr("y", y + 6).attr("font-family", "sans-serif")
        .attr("font-size", "22px").style("cursor", "pointer").attr("id", "txt" + id)
        .style("z-index", "99").style("fill", "black")
        .text(id < n/2 ? "r"+(orig_id+1) : "c"+(orig_id+1)).on("click", function () {
        clicked(g, id);
    });
}

function drawNVertices(g, n) {
    d3.selectAll("circle").remove();
    var retX = g.vertexPositions.x;
    var retY = g.vertexPositions.y;
    for (var i = 0; i < n; i++) {
        drawVertex(g, retX[i], retY[i], i);
    }
}

function drawNVerticesBip(g, n) {
    d3.selectAll("circle").remove();
    var retX = g.vertexPositions.x;
    var retY = g.vertexPositions.y;
    for (var i = 0; i < n; i++) {
        drawVertexBip(g, retX[i], retY[i], i,n);
    }
}

function draw_edge(src, tgt) {
    var x1 = d3.select("#ver" + src).attr('cx');
    var y1 = d3.select("#ver" + src).attr('cy');
    var x2 = d3.select("#ver" + tgt).attr('cx');
    var y2 = d3.select("#ver" + tgt).attr('cy');
    d3.select("#edge" + src + "-" + tgt).remove();
    d3.select("#edges").append("line").attr("id", "edge" + src + "-" + tgt)
        .style("stroke", "black").style("stroke-width", 2).style("fill", "black")
        .attr("x1", x1).attr("y1", y1)
        .attr("x2", x2).attr("y2", y2);
}

function remove_edge(src, tgt) {
    d3.select("#edge" + src + "-" + tgt).remove();
}

function draw_edge_color(src, tgt, color) {
    var x1 = d3.select("#ver" + src).attr('cx');
    var y1 = d3.select("#ver" + src).attr('cy');
    var x2 = d3.select("#ver" + tgt).attr('cx');
    var y2 = d3.select("#ver" + tgt).attr('cy');
    d3.select("#edge" + src + "-" + tgt).remove();

    d3.select("#edges").append("line").attr("id", "edge" + src + "-" + tgt)
        .style("stroke", color).style("stroke-width", 2).style("fill", color)
        .attr("x1", x1).attr("y1", y1)
        .attr("x2", x2).attr("y2", y2);
}

function drawGraph(g, ord, norepaint) {
    if (norepaint == undefined) {
        d3.select("#vertices").selectAll("*").remove();
        d3.select("#edges").selectAll("*").remove();
    }
    var n = g.vertices.length;
    var w = 500, h = 500;
    g.vertexPositions = circular(50, 50, w, h, n);
    drawNVertices(g, n);
    for (var i = 0; i < g.vertices.length; i += 1) {
        for (var j = 0; j < g.vertices[i].edges.length; j++) {
            if(i!=g.vertices[i].edges[j]) {
                draw_edge(i, g.vertices[i].edges[j]);
            }
        }
    }
}

function drawBipGraph(g, ord, norepaint) {
    if (norepaint == undefined) {
        d3.select("#vertices").selectAll("*").remove();
        d3.select("#edges").selectAll("*").remove();
    }
    var n = g.vertices.length;
    var w = 500, h = 500;
    g.vertexPositions = horiz_line(w/4, 30, h, g.vertices.length/2);
    var pos2 = horiz_line((w/4)*3, 30, h, g.vertices.length/2);
    pos2.x.forEach(function (xx) {
        g.vertexPositions.x.push(xx);
    });
    pos2.y.forEach(function (yy) {
        g.vertexPositions.y.push(yy);
    });
    drawNVerticesBip(g, n);
    for (var i = 0; i < g.vertices.length; i += 1) {
        for (var j = 0; j < g.vertices[i].edges.length; j++) {
            draw_edge(i, g.vertices[i].edges[j]);
        }
    }
}

function drawGraphHierarchichal(comps) {
    var n = g.vertices.length;
    var w = 500, h = 500;
    var i;

    var ratio = 500 / ver_sep.length;
    for (i = 0; i < ver_sep.length; i++) {
        drawVertex(g, rVertex + ratio / (ver_sep.length) + i * ratio, 380 + (i%2)*60, ver_sep[i]);
    }

    var subgraph_sizes = first_subgraph.length + second_subgraph.length;
    var first_size = (500 / subgraph_sizes) * first_subgraph.length + 10;
    var second_size = (500 / subgraph_sizes) * second_subgraph.length + 10;
    var first_pos = circular(50, 50, first_size, first_size, first_subgraph.length);
    var second_pos = circular(50, 50, second_size, second_size, second_subgraph.length);

    for (i = 0; i < first_subgraph.length; i++) {
        drawVertex(g, first_pos.x[i], first_pos.y[i], first_subgraph[i]);
    }

    for (var i = 0; i < first_subgraph.length; i += 1) {
        for (var j = 0; j < g.vertices[first_subgraph[i]].edges.length; j++) {
            draw_edge(first_subgraph[i], g.vertices[first_subgraph[i]].edges[j]);
        }
    }

    for (i = 0; i < second_subgraph.length; i++) {
        drawVertex(g, first_size + second_pos.x[i], second_pos.y[i], second_subgraph[i]);
    }

    for (var i = 0; i < second_subgraph.length; i += 1) {
        for (var j = 0; j < g.vertices[second_subgraph[i]].edges.length; j++) {
            draw_edge(second_subgraph[i], g.vertices[second_subgraph[i]].edges[j]);
        }
    }

    for (var i = 0; i < ver_sep.length; i += 1) {
        for (var j = 0; j < g.vertices[ver_sep[i]].edges.length; j++) {
            draw_edge(ver_sep[i], g.vertices[ver_sep[i]].edges[j]);
        }
    }
}

function horiz_line(xOffset, yOffset, h, n) {
    var retX = [];
    var retY = [];
    for (var i = 0; i < n; i++) {
        retX.push(xOffset);
        retY.push(yOffset+(h/n - 7)*i);
    }
    return {"x": retX, "y": retY};
}

function circular(xOffset, yOffset, w, h, n) {
    var retX = [];
    var retY = [];
    w = w / 2;
    h = h / 2;
    w -= xOffset;
    h -= yOffset;
    for (var i = 0; i < n; i++) {
        var deg = 2 * Math.PI / n * i;
        var x = Math.sin(deg);
        var y = Math.cos(deg);
        x *= w;
        y *= h;
        x += w;
        y += h;
        x += xOffset;
        y += yOffset;
        retX.push(x);
        retY.push(y);
    }
    return {"x": retX, "y": retY};
}

function drawSubMat(i1, i2, j1, j2, color) {
    d3.select("#svg_matrix").append("rect").style("fill", color)
        //.style("stroke", "black").style("stroke-width", 2)
        .attr("x", (ratio / 2) + margin + i1 * ratio - ratio / 2)
        .attr("y", (ratio / 2) + margin + j1 * ratio - ratio / 2)
        .attr("width", (i2 - i1)*ratio).attr("height", (j2 - j1)*ratio);
    // for (var cnt1 = i1; cnt1 <= i2; cnt1++) {
    //     for (var cnt2 = j1; cnt2 <= j2; cnt2++) {
    //         d3.select("#cell" + cnt1 + "-" + cnt2).style("fill", color);
    //     }
    // }
}

function drawMatrix(n, arr) {
    d3.select("#svg_matrix").selectAll("*").remove();
    d3.select("#svg_matrix").append("rect").style("fill", "white")
        .style("stroke", "black").style("stroke-width", 2)
        .attr("x", margin).attr("y", margin)
        .attr("width", width).attr("height", height);
    for (var i = 0; i < n; i+=20) {
        d3.select("#svg_matrix").append("line")
            .style("stroke", "black").style("stroke-width", 1).style("fill", "black")
            .attr("x1", (ratio / 2) + margin + i * ratio).attr("y1", margin - 5)
            .attr("x2", (ratio / 2) + margin + i * ratio).attr("y2", margin + 5);

        d3.select("#svg_matrix").append("line")
            .style("stroke", "black").style("stroke-width", 1).style("fill", "black")
            .attr("y1", (ratio / 2) + margin + i * ratio).attr("x1", margin - 5)
            .attr("y2", (ratio / 2) + margin + i * ratio).attr("x2", margin + 5);

        d3.select("#svg_matrix").append("text")
            .style("font-size", "13px")
            .attr("x", (ratio / 2) + margin + i * ratio - 5).attr("y", margin - 12)
            .text((parseInt(arr[i]) + 1) + "");

        d3.select("#svg_matrix").append("text")
            .style("font-size", "13px")
            .attr("x", margin - 25).attr("y", (ratio / 2) + margin + i * ratio + 4)
            .text((parseInt(arr[i]) + 1) + "");
    }
    return;

    for (i = 0; i < n; i++) {
        for (var j = 0; j < n; j++) {
            d3.select("#svg_matrix").append("rect")
                .attr("id", "cell" + i + "-" + j)
                .attr("class", "cell")
                .attr("x", (ratio / 2) + margin + i * ratio - ratio / 2)
                .attr("y", (ratio / 2) + margin + j * ratio - ratio / 2)
                .attr("width", ratio)
                .attr("height", ratio)
                .attr("fill", "none");

            var x1 = (ratio / 2) + margin + i * ratio - ratio / 2;
            var y1 = (ratio / 2) + margin + j * ratio - ratio / 2;
            var x2 = (ratio / 2) + margin + i * ratio + ratio / 2;
            var y2 = (ratio / 2) + margin + j * ratio;
            var x3 = (ratio / 2) + margin + i * ratio - ratio / 2;
            var y3 = (ratio / 2) + margin + j * ratio + ratio / 2;
            // d3.select("#svg_matrix").append("polygon").attr("id","triangle"+ i + "-" + j)
            //     .style("stroke","block")
            //     .attr("points", x1 +","+ y1+ " " + x2+ ","+y2+" " +x3+"," +y3).style("fill","none");

            d3.select("#svg_matrix").append("line")
                .style("stroke", "none").style("stroke-width", 3).style("fill", "none")
                .attr("id", "rightnnz" + i + "-" + j)
                .attr("class", "nnz")
                .attr("x1", (ratio / 2) + margin + i * ratio - fillinSize)
                .attr("y1", (ratio / 2) + margin + j * ratio - fillinSize)
                .attr("x2", (ratio / 2) + margin + i * ratio + fillinSize)
                .attr("y2", (ratio / 2) + margin + j * ratio + fillinSize);

            d3.select("#svg_matrix").append("line")
                .style("stroke", "none").style("stroke-width", 3).style("fill", "none")
                .attr("id", "leftnnz" + i + "-" + j)
                .attr("class", "nnz")
                .attr("x1", (ratio / 2) + margin + i * ratio + fillinSize)
                .attr("y1", (ratio / 2) + margin + j * ratio - fillinSize)
                .attr("x2", (ratio / 2) + margin + i * ratio - fillinSize)
                .attr("y2", (ratio / 2) + margin + j * ratio + fillinSize);
        }
    }

}

function updateMatrix(n, arr) {
    d3.select("#svg_matrix").selectAll("text").remove();
    d3.select("#svg_matrix").selectAll(".nnz").remove();
    d3.select("#svg_matrix").selectAll(".cell").remove();
    for (var i = 0; i < n; i++) {
        d3.select("#svg_matrix").append("text")
            .style("font", "Arial")
            .style("font-size", "13px")
            .attr("x", (ratio / 2) + margin + i * ratio - 5).attr("y", margin - 12)
            .text((parseInt(arr[i]) + 1) + "");

        d3.select("#svg_matrix").append("text")
            .style("font", "Arial")
            .style("font-size", "13px")
            .attr("x", margin - 25).attr("y", (ratio / 2) + margin + i * ratio + 4)
            .text((parseInt(arr[i]) + 1) + "");
    }
}

function drawNonzeros(g, arr) {
    d3.selectAll(".nnz").style("stroke", "none").style("fill", "none");
    for (var i = 0; i < g.init_edges.length; i++) {
        var str1 = "#rightnnz" + arr.indexOf(g.init_edges[i].src) + "-" + arr.indexOf(g.init_edges[i].tgt);
        var str2 = "#leftnnz" + arr.indexOf(g.init_edges[i].src) + "-" + arr.indexOf(g.init_edges[i].tgt);
        d3.select(str1).style("stroke", "black").style("fill", "black");
        d3.select(str2).style("stroke", "black").style("fill", "black");
    }
}

window.test=[];
function drawNonzerosCy(arr) {
    d3.selectAll(".nnz").remove();
    d3.selectAll(".cell").remove();
    var edges = def_links;
    console.log(arr);
    window.test = arr;
    for (var i = 0; i < edges.length; i++) {
        var src = arr.indexOf(edges[i].data.source+"");
        var tgt = arr.indexOf(edges[i].data.target+"");
        // console.log(src + " " + tgt + " " + edges[i].data.source+ " " + edges[i].data.target);
        // var str1 = "#rightnnz" + arr.indexOf(src) + "-" + arr.indexOf(tgt);
        // var str2 = "#leftnnz" + arr.indexOf(src) + "-" + arr.indexOf(tgt);
        // var str3 = "#rightnnz" + arr.indexOf(tgt) + "-" + arr.indexOf(src);
        // var str4 = "#leftnnz" + arr.indexOf(tgt) + "-" + arr.indexOf(src);
        // d3.select(str1).style("stroke", "black").style("fill", "black");
        // d3.select(str2).style("stroke", "black").style("fill", "black");
        // d3.select(str3).style("stroke", "black").style("fill", "black");
        // d3.select(str4).style("stroke", "black").style("fill", "black");

        d3.select("#svg_matrix").append("rect")
            // .attr("id", "cell" + i + "-" + j)
            .attr("class", "cell")
            .attr("x", (ratio / 2) + margin + src * ratio - ratio / 2)
            .attr("y", (ratio / 2) + margin + tgt * ratio - ratio / 2)
            .attr("width", ratio)
            .attr("height", ratio)
            .attr("fill", "none");

        var x1 = (ratio / 2) + margin + src * ratio - ratio / 2;
        var y1 = (ratio / 2) + margin + tgt * ratio - ratio / 2;
        var x2 = (ratio / 2) + margin + src * ratio + ratio / 2;
        var y2 = (ratio / 2) + margin + tgt * ratio;
        var x3 = (ratio / 2) + margin + src * ratio - ratio / 2;
        var y3 = (ratio / 2) + margin + tgt * ratio + ratio / 2;
        // d3.select("#svg_matrix").append("polygon").attr("id","triangle"+ src + "-" + tgt)
        //     .style("stroke","block")
        //     .attr("points", x1 +","+ y1+ " " + x2+ ","+y2+" " +x3+"," +y3).style("fill","none");

        d3.select("#svg_matrix").append("line")
            .style("stroke", "black").style("stroke-width", 3).style("fill", "black")
            // .attr("id", "rightnnz" + i + "-" + j)
            .attr("class", "nnz")
            .attr("x1", (ratio / 2) + margin + src * ratio - fillinSize)
            .attr("y1", (ratio / 2) + margin + tgt * ratio - fillinSize)
            .attr("x2", (ratio / 2) + margin + src * ratio + fillinSize)
            .attr("y2", (ratio / 2) + margin + tgt * ratio + fillinSize);

        d3.select("#svg_matrix").append("line")
            .style("stroke", "black").style("stroke-width", 3).style("fill", "black")
            // .attr("id", "leftnnz" + i + "-" + j)
            .attr("class", "nnz")
            .attr("x1", (ratio / 2) + margin + src * ratio + fillinSize)
            .attr("y1", (ratio / 2) + margin + tgt * ratio - fillinSize)
            .attr("x2", (ratio / 2) + margin + src * ratio - fillinSize)
            .attr("y2", (ratio / 2) + margin + tgt * ratio + fillinSize);
    }

    var nodes = cy.nodes();
    for (var i = 0; i < nodes.length; i++) {
        var src = nodes[i].data('id');
        var tgt = nodes[i].data('id');
        d3.select("#svg_matrix").append("line")
            .style("stroke", "black").style("stroke-width", 3).style("fill", "black")
        // .attr("id", "rightnnz" + i + "-" + j)
            .attr("class", "nnz")
            .attr("x1", (ratio / 2) + margin + src * ratio - fillinSize)
            .attr("y1", (ratio / 2) + margin + tgt * ratio - fillinSize)
            .attr("x2", (ratio / 2) + margin + src * ratio + fillinSize)
            .attr("y2", (ratio / 2) + margin + tgt * ratio + fillinSize);

        d3.select("#svg_matrix").append("line")
            .style("stroke", "black").style("stroke-width", 3).style("fill", "black")
        // .attr("id", "leftnnz" + i + "-" + j)
            .attr("class", "nnz")
            .attr("x1", (ratio / 2) + margin + src * ratio + fillinSize)
            .attr("y1", (ratio / 2) + margin + tgt * ratio - fillinSize)
            .attr("x2", (ratio / 2) + margin + src * ratio - fillinSize)
            .attr("y2", (ratio / 2) + margin + tgt * ratio + fillinSize);

        // var str1 = "#rightnnz" + arr.indexOf(src) + "-" + arr.indexOf(tgt);
        // var str2 = "#leftnnz" + arr.indexOf(src) + "-" + arr.indexOf(tgt);
        // d3.select(str1).style("stroke", "black").style("fill", "black");
        // d3.select(str2).style("stroke", "black").style("fill", "black");
    }
}

function colorVertex(selected, color) {
    cy.$('#'+selected).style("background-color",color);
}

function colorVertices(selected, color) {
    for (var j = 0; j < selected.length; j++) {
        colorVertex(selected[j],color);
    }
}

function colorEdge(gArchived, selected, color, ord) {
    var n = gArchived.vertices.length;
    var w = 500, h = 500;
    gArchived.vertexPositions = circular(50, 50, w, h, n);
    for (var i = 0; i < selected.length; i++) {
        for (var j = 0; j < gArchived.vertices[selected[i]].edges.length; j++) {
            var src = {
                x: gArchived.vertexPositions.x[ord.indexOf(selected[i])],
                y: gArchived.vertexPositions.y[ord.indexOf(selected[i])]
            };
            var tgt = {
                x: gArchived.vertexPositions.x[ord.indexOf(gArchived.vertices[selected[i]].edges[j])],
                y: gArchived.vertexPositions.y[ord.indexOf(gArchived.vertices[selected[i]].edges[j])]
            };
            drawEdgeColor(src, tgt, color);
        }
    }
}

function drawEdgeColor(src, tgt, color) {
    d3.select("#svg_graph").append("line").attr("id", "edge" + src + "-" + tgt)
        .style("stroke", color).style("stroke-width", 2).style("fill", color)
        .style("stroke-dasharray", ("3, 3"))
        .attr("x1", src.x).attr("y1", src.y)
        .attr("x2", tgt.x).attr("y2", tgt.y);
}

function color_vertex(i,color) {
    var col = get_color(color);
    var col_alpha = add_alpha_to_color(d3.rgb(col));
    d3.select("#back" + i).style("fill","white");
    d3.select("#ver" + i).style("fill",col_alpha);
    currentg.vertices[i].color = color;
}

function get_vertex_color(i) {
    return currentg.vertices[i].color;
}

var colored_cols = [];

function color_column(i,color) {
    var col = get_color(color);
    drawSubMat(i,i,0,currentg.vertices.length,add_alpha_to_color(d3.rgb(col)));
    colored_cols.push(i);
}

function color_row(i,color) {
    var col = get_color(color);
    //drawSubMat(0,currentg.vertices.length,i,i,add_alpha_to_color(d3.rgb(col)));
    for (var cnt1 = 0; cnt1 <= currentg.vertices.length; cnt1++) {
        for (var cnt2 = i; cnt2 <= i; cnt2++) {
            if(colored_cols.indexOf(cnt1) == -1) {
                d3.select("#cell" + cnt1 + "-" + cnt2).style("fill", add_alpha_to_color(d3.rgb(col)));
            } 
                d3.select("#triangle" + cnt1 + "-" + cnt2).style("fill", add_alpha_to_color(d3.rgb(col)));
        }
    }
}

function neighbors(i) {
    return currentg.vertices[i].edges;
}

function d2_neighbors(i) {
    var ret = [];
    currentg.vertices[i].edges.forEach(function (n1) {
        currentg.vertices[n1].edges.forEach(function (n2) {
            if(n2 != i) ret.push(n2);
        });
    });
    return ret;
}

function add_alpha_to_color(rgb_color) {
    return "rgba("+rgb_color['r']+","+rgb_color['g']+","+rgb_color['b']+",0.5)";
}

function max(arr) {
    return Math.max(...arr);
}

function min(arr) {
    return Math.min(...arr);
}

function diff(A,B) {
    return A.filter(function (x) {
        return B.indexOf(x) < 0
    });
}

function range(start,end) {
    return d3.range(start,end);
}

function get_colors(vers) {
    var ret = [];
    vers.forEach(function (v) {
        var c = get_vertex_color(v);
        //if(c!=-1) {
        ret.push(c);
        //}
    });
    return ret;
}

function remove_vertex(id) {
    remove_vertex_from(currentg,id);
}

function remove_vertex_from(G,id) {
    // removeVertex(currentg,current);
    d3.select("#edges").selectAll("line")
        .style("stroke","black").style("fill","black");
    d3.select("#back" + id).remove();
    d3.select("#ver" + id).remove();
    d3.select("#txt" + id).remove();

    for (var i = 0; i < G.vertices.length; i += 1) {
        if (G.vertices[i].edges.indexOf(id) != -1) {
            G.vertices[i].edges.splice(G.vertices[i].edges.indexOf(id), 1);
            d3.select("#edge" + i + "-" + id).remove();
            d3.select("#edge" + id + "-" + i).remove();
        }
    }
    G.vertices[id].edges = [];
}

function make_clique(vers) {
    var ret = [];
    vers.forEach(function (v) {
        vers.forEach(function (u) {
            if (currentg.vertices[v].edges.indexOf(u) == -1) {
                currentg.vertices[v].edges.push(u);
                draw_edge_color(v, u, "red");
            }
        });
    });
    return ret;
}

function show_fillins(order, fillins) {
    fillins.forEach(function (fillin) {
        show_fillin(order,fillin['src'],fillin['tgt']);
    });
}

function show_fillin(order, col, row) {
    d3.select("#svg_matrix").append("circle")
        .attr("id", "fillin" + order.indexOf(parseInt(row))
            + "-" + order.indexOf(parseInt(col)))
        .attr("r", fillinSize).style("fill", "red")
        .attr("cx", (ratio / 2) + margin + order.indexOf(parseInt(row)) * ratio)
        .attr("cy", (ratio / 2) + margin + order.indexOf(parseInt(col)) * ratio)
        .style("stroke", "red").style("stroke-width", 1)
        .style("z-index", "199");
}

function specify_fillins(vers,order) {
    var fillins=[];
    vers = [];
    if(prev_vers.length != 0) {
        prev_vers.forEach(function (e) {
            d3.select("#svg_matrix").select("#fillin" + e).remove();
            d3.select("#rightnnz" + e)
                .style("stroke", "black")
                .style("fill", "black");
            d3.select("#leftnnz" + e)
                .style("stroke", "black")
                .style("fill", "black");
        });
    }
    d3.select("#edges")
        .selectAll("line")
        .each(function(c) {
        if(d3.select(this).attr("id").indexOf("edge")!=-1) {
            if(d3.select(this).style("fill")!="rgb(0, 0, 0)") {
                var tmp = d3.select(this).attr("id").substring(4).split("-");
                fillins.push({'src':tmp[0],'tgt':tmp[1]});
                // d3.select("#svg_matrix").append("circle")
                //     .attr("id", "fillin" + order.indexOf(parseInt(tmp[0]))
                //         + "-" + order.indexOf(parseInt(tmp[1])))
                //     .attr("r", fillinSize).style("fill", "red")
                //     .attr("cx", (ratio / 2) + margin + order.indexOf(parseInt(tmp[0])) * ratio)
                //     .attr("cy", (ratio / 2) + margin + order.indexOf(parseInt(tmp[1])) * ratio)
                //     .style("stroke", "red").style("stroke-width", 1)
                //     .style("z-index", "199");
                show_fillin(order,tmp[0],tmp[1]);
                vers.push(order.indexOf(parseInt(tmp[0]))
                    + "-" + order.indexOf(parseInt(tmp[1])));
            }
        }
    });
    prev_vers = vers;
    return fillins;
}

function get_colored_vertices() {
    vers = [];
    d3.select("#svg_graph")
        .selectAll("circle")
        .each(function(c) {
            if(d3.select(this).attr("id").indexOf("ver")!=-1)
                if(d3.select(this).style("fill").toString() != 'rgb(255, 255, 255)')
                  vers.push(d3.select(this).attr("id").substr(3));
        });
    return vers;
}

function is_clique(G) {
    var vers = [];
    d3.select("#svg_graph")
        .selectAll("circle")
        .each(function(c) {
            if(d3.select(this).attr("id").indexOf("ver")!=-1) {
                vers.push(d3.select(this).attr("id").substr(3));
            }
        });

    for(var u = 0;u < vers.length;u++) {
        for(var v = u+1;v < vers.length;v++) {

                if(d3.select("#edge" + vers[v] + "-" + vers[u])[0][0] == null &&
                    d3.select("#edge" + vers[u] + "-" + vers[v])[0][0] == null) {
                    return false;
                }
        }
    }
    return true;
}

function setVertexPosition(x, y, id) {
    d3.select("#back" + id)
        .attr('cx', x).attr('cy', y);

    d3.select("#ver" + id)
        .attr('cx', x).attr('cy', y);

    d3.select("#txt" + id)
        .attr('x', (id + 1) < 10 ? x - 5 : x - 10).attr('y', y+5);
}

function draw_rect(x,y,w,h) {
    d3.select("#svg_matrix").append("rect").attr("x", x).attr("y", y)
        .attr("width", w).attr("height", h)
        .style("stroke", "black").style("stroke-width", 2)
        .style("fill", "none");
}

function contains(A, a) {
    return A.indexOf(a) !== -1;
}
