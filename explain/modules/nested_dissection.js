var reference_nd = function () {
    reference_text= "H. M. Bücker, M. A. Rostami : Interactively exploring " +
        "the connection between nested dissection orderings for parallel Cholesky factorization " +
        "and vertex separators. IPDPS 2014.";
    reference_url= "10.1109/IPDPSW.2014.125";
};

var global_nd = function () {
    selected = [];
    firstSubMatrixClicked = false;
    secondSubMatrixClicked = false;
    subMatrix = false;
    partitions = {};
    selectedArchive = [];
    seenArchive = [];
    notSeenArchive = [];
    orderArchive = [];
    gArchive = undefined;
    parts = [];
    orange_alpha = "rgba(255,165,0,0.5)";
    blue_alpha = "rgba(0,0,255,0.5)";
    red_alpha = "rgba(255,0,0,0.5)";
    green_alpha = "rgba(0,255,0,0.5)";
    magenta_alpha = "rgba(255,0,255,0.5)";
    stop = false;
    graph_format="simple";
    chart_yaxis1_text = "Subgraph sizes";
    chart_yaxis2_text = "Vertex separator";
    chart_group1_text = 'Vertices in first subgraph';
    chart_group2_text = 'Vertices in second subgraph';
    chart_group3_text = 'Vertices in third subgraph';
    chart_group4_text = 'Vertices in fourth subgraph';
    chart_group5_text = 'Vertex separator';
    start_matrix = 'nestedDissection4.mtx';
    animation = false;
    post_processing_name = "Show edges";
};
var nested_dissection = function() {
    if(currentg.vertices.length< 10) {
        alert("This module works only on graph with the number of vertices bigger than 10.");
        return;
    }
    var g=currentg;
    if (gArchive == undefined) gArchive = jQuery.extend(true, {}, g);
    if (stop) return;
    var n = numOfVertices(g);
    if (selected.indexOf(i) == -1) {
        selected.push(i);
    } else return;

    if (subMatrix == true) {
        if (selected.length == selectedArchive.length + 1) {
            drawSubMat(0, seenArchive.length - 1, 0, seenArchive.length - 1, "white");
            drawSubMat(seenArchive.length, seenArchive.length + notSeenArchive.length - 1,
                seenArchive.length, seenArchive.length + notSeenArchive.length - 1, "white");

            draw_rect(margin,margin,seenArchive.length * ratio,seenArchive.length * ratio);
            draw_rect(margin + seenArchive.length * ratio, margin + seenArchive.length * ratio,
                notSeenArchive.length * ratio,notSeenArchive.length * ratio);
        }

        partitions.order = [];
        var ns1 = [], ns2 = [];
        var tmp = [];
        for (i = 0; i < partitions.seen.length; i++) {
            if (selected.indexOf(partitions.seen[i]) == -1) {
                partitions.order.push(partitions.seen[i]);
                ns1.push(partitions.seen[i]);
            } else {
                tmp.push(partitions.seen[i]);
            }
        }

        partitions.order = partitions.order.concat(tmp);
        var tmp2 = [];
        for (i = 0; i < partitions.notSeen.length; i++) {
            if (selected.indexOf(partitions.notSeen[i]) == -1) {
                partitions.order.push(partitions.notSeen[i]);
                ns2.push(partitions.notSeen[i]);
            } else {
                tmp2.push(partitions.notSeen[i]);
            }

        }
        partitions.order = partitions.order.concat(tmp2);
        partitions.order = partitions.order.concat(selectedArchive);

        g = removeVertices(g, selected);

        drawGraphHierarchichal(g, selectedArchive, seenArchive, notSeenArchive);
        //drawGraph(g, orderArchive);
        colorVertices(seenArchive, blue_alpha);
        colorVertices(notSeenArchive, red_alpha);
        colorVertices(selected, orange_alpha);

        g = bfs(g, ns1[0]);
        parts = allVSeen(g, selected);
        var first_seen = parts.seen;

        g = bfs(g, ns2[0]);
        parts = allVSeen(g, selected);
        var second_seen = parts.seen;

        var notSeen1 = [], notSeen2 = [];
        ns1.forEach(function (n) {
            if (first_seen.indexOf(n) == -1 &&
                tmp.indexOf(n) == -1) notSeen1.push(n);
        });
        ns2.forEach(function (n) {
            if (second_seen.indexOf(n) == -1 &&
                tmp2.indexOf(n) == -1) notSeen2.push(n);
        });
        partitions.order = first_seen.concat(notSeen1).concat(tmp)
            .concat(second_seen).concat(notSeen2).concat(tmp2).concat(selectedArchive);

        updateMatrix(n, partitions.order);

        if (tmp.length >= 1) {
            drawSubMat(partitions.seen.length - tmp.length,
                partitions.seen.length - tmp.length,
                0, partitions.seen.length - 1, orange_alpha);

            drawSubMat(0, partitions.seen.length - 1,
                partitions.seen.length - tmp.length,
                partitions.seen.length - tmp.length, orange_alpha);
        }
        if (tmp2.length >= 1) {
            drawSubMat(partitions.seen.length + partitions.notSeen.length - tmp2.length,
                partitions.seen.length + partitions.notSeen.length - tmp2.length,
                partitions.seen.length, partitions.seen.length + partitions.notSeen.length - 1, orange_alpha);
            drawSubMat(
                partitions.seen.length,
                partitions.seen.length + partitions.notSeen.length - 1,
                partitions.seen.length + partitions.notSeen.length - tmp2.length,
                partitions.seen.length + partitions.notSeen.length - tmp2.length, orange_alpha);
        }

        // drawGraph(g, orderArchive);
        drawGraphHierarchichal(g, selectedArchive, seenArchive, notSeenArchive);
        colorVertices(selected, orange_alpha);
        if (first_seen.length != ns1.length && second_seen.length != ns2.length) {
            gather_round_data(selected.length, first_seen.length, notSeen1.length,
                second_seen.length, notSeen2.length);
            round_completed();
            subMatrix = false;
            stop = true;
            drawGraphHierarchichal(g, selectedArchive, seenArchive, notSeenArchive);
            colorVertices(selected, orange_alpha);
        }

        if (first_seen.length != ns1.length) {
            colorVertices(first_seen, blue_alpha);
            colorVertices(notSeen1, red_alpha);

            drawSubMat(0, first_seen.length - 1, 0, first_seen.length - 1, blue_alpha)
            drawSubMat(first_seen.length, first_seen.length + notSeen1.length - 1,
                first_seen.length, first_seen.length + notSeen1.length - 1, red_alpha);
        }

        if (second_seen.length != ns2.length) {
            colorVertices(second_seen, green_alpha);
            colorVertices(notSeen2, magenta_alpha);

            var offset = first_seen.concat(notSeen1).concat(tmp).length;
            drawSubMat(offset, offset + second_seen.length - 1, offset, offset + second_seen.length - 1, green_alpha);
            drawSubMat(offset + second_seen.length,
                offset + second_seen.length + ns2.length - second_seen.length - 1,
                offset + second_seen.length,
                offset + second_seen.length + ns2.length - second_seen.length - 1, magenta_alpha);
        }

        drawNonzeros(g, partitions.order);
        return;
    }

    var nonSelected;
    for (var t = 0; t < n; t++) {
        if (selected.indexOf(t) == -1) {
            nonSelected = t;
            break;
        }
    }
    g = removeVertices(g, selected);
    drawGraph(g);
    g = bfs(g, nonSelected);
    partitions = allVSeen(g, selected);
    colorVertices(selected, orange_alpha);
    updateMatrix(n, partitions.order);
    drawSubMat(n - selected.length, n - selected.length, 0, n - 1, orange_alpha);
    drawSubMat(0, n - 1, n - selected.length, n - selected.length, orange_alpha);
    drawNonzeros(g, partitions.order);
    if (partitions.notSeen.length >= 2 &&
        partitions.seen.length >= 2 &&
        firstSubMatrixClicked == false &&
        secondSubMatrixClicked == false) {
        drawGraphHierarchichal(g, selected, partitions.seen, partitions.notSeen);
        colorVertices(partitions.seen, blue_alpha);
        colorVertices(partitions.notSeen, red_alpha);
        colorVertices(selected, orange_alpha);
        drawSubMat(0, partitions.seen.length - 1, 0, partitions.seen.length - 1, blue_alpha);
        drawSubMat(partitions.seen.length, partitions.seen.length + partitions.notSeen.length - 1,
            partitions.seen.length, partitions.seen.length + partitions.notSeen.length - 1, red_alpha);

        subMatrix = true;
        selectedArchive = selected.slice();
        seenArchive = partitions.seen.slice();
        notSeenArchive = partitions.notSeen.slice();
        orderArchive = partitions.order.slice();
        gather_round_data(selected.length, partitions.seen.length, partitions.notSeen.length, 0, 0);
        // document.getElementById("show_edge").disabled  = false;
    }
};

var post_processing_nd = function () {
    if(document.getElementById("show_edge").value.indexOf("Show") == -1) {
        for (var i = 0; i < gArchive.vertices.length; i += 1) {
            for (var j = 0; j < gArchive.vertices[i].edges.length; j++) {
                if(currentg.vertices[i].edges.indexOf(gArchive.vertices[i].edges[j]) == -1) {
                    remove_edge(i, gArchive.vertices[i].edges[j]);
                }
            }
        }
        document.getElementById("show_edge").value="Show Edges";
    } else {
        for (var i = 0; i < gArchive.vertices.length; i += 1) {
            for (var j = 0; j < gArchive.vertices[i].edges.length; j++) {
                if(currentg.vertices[i].edges.indexOf(gArchive.vertices[i].edges[j]) == -1) {
                    draw_edge(i, gArchive.vertices[i].edges[j]);
                }
            }
        }
        document.getElementById("show_edge").value="Hide Edges";
    }
};
