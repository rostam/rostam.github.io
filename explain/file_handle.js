var ratio,margin,width,height;
var loadedMatrix;
var fillinSize = 8;

function openFile(event) {
    var input = event.target;
    var reader = new FileReader();
    reader.onload = function () {
        init(reader.result);
    };
    reader.readAsText(input.files[0]);
}

function selectMatrix() {
    var s = document.getElementById('selectMat');
    getText("matrices/"+s.options[s.selectedIndex].value);
}

function getText(url){
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 ) {
            init(xmlhttp.responseText);
        }
    };
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}

function init(matrix) {
    stop = false;
    loadedMatrix=matrix;
    init_mouse_event();

    // Matrix Market allows any number of '%' comment lines after the banner,
    // and any run of whitespace as a separator. The previous version read the
    // dimensions from line 1 and split on a single space, so a second comment
    // line produced NaN and "2  3  1" produced a column index of -1.
    var lines = matrix.split(/\r?\n/);
    var header = lines[0] || "";
    var body = [];
    for (var li = 0; li < lines.length; li++) {
        var line = lines[li].trim();
        if (line.length === 0 || line.charAt(0) === '%') continue;
        body.push(line);
    }
    if (body.length === 0) {
        alert("This file contains no Matrix Market entries.");
        return;
    }

    var sizes = body[0].split(/\s+/);
    var n = parseInt(sizes[0], 10);
    var n2 = sizes.length > 1 ? parseInt(sizes[1], 10) : n;
    var m = sizes.length > 2 ? parseInt(sizes[2], 10) : body.length - 1;
    if (!(n > 0) || !(n2 > 0)) {
        alert("Could not read the matrix dimensions from this file.");
        return;
    }
    if (!(m >= 0) || m > body.length - 1) m = body.length - 1;

    var edges = [];
    var i;
    for (i = 0; i < m; i++) {
        var tmp = body[i + 1].split(/\s+/);
        var r = parseInt(tmp[0], 10) - 1;
        var c = parseInt(tmp[1], 10) - 1;
        if (!(r >= 0 && r < n && c >= 0 && c < n2)) continue;   // skip malformed rows
        edges.push({"src": r, "tgt": c});
        if(header.indexOf("symmetric")!==-1 && r !== c)
          edges.push({"src": c, "tgt": r});
    }

    d3.select("#svg_graph").selectAll("*").remove();
    d3.select("#svg_graph").append("g").attr("id", "edges");
    d3.select("#svg_graph").append("g").attr("id", "vertices");

    if(eval("graph_format") == "bipartite") {
        var g = bipgraph(edges, n, m, n2);
        drawBipGraph(g);
    } else if(eval("graph_format") == "cig") {
        var g = cigraph(edges, n2, m);   // one vertex per column
        drawGraph(g);
    } else {
        var g = graph(edges, n, m);
        drawGraph(g);
    }
    // The bipartite branch used to `break` without ever pushing, leaving the
    // order empty; the row vertices are the ones a user steps through.
    order = [];
    var limit = (eval("graph_format") == "bipartite") ? g.numRows : g.vertices.length;
    for(var i = 0;i < limit;i++) order.push(i);
    //addClickEvent(g);
    var arr = [];
    for(i=0;i<n;i++) arr.push(i);
    ratio = (450 / n);
    margin = 25;
    width=450;
    height=450;
    drawMatrix(n,arr);
    drawNonzeros(g,arr);
    currentg = g;
}