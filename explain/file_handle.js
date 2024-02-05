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
    var text = matrix;
    var splitted = text.split('\n');
    var header = splitted[0];
    var sizes = splitted[1].split(' ');
    var n = parseInt(sizes[0]);
    var n2 = sizes[1];
    var m = parseInt(sizes[2]);
    var edges = [];
    var i;
    for (i = 0; i < m; i++) {
        var tmp = splitted[i + 2].split(' ');
        edges.push({"src": parseInt(tmp[0] - 1), "tgt": parseInt(tmp[1] - 1)});
        if(header.indexOf("symmetric")!==-1)
          edges.push({"src": parseInt(tmp[1] - 1), "tgt": parseInt(tmp[0] - 1)});
    }

    d3.select("#svg_graph").selectAll("*").remove();
    d3.select("#svg_graph").append("g").attr("id", "edges");
    d3.select("#svg_graph").append("g").attr("id", "vertices");

    if(eval("graph_format") == "bipartite") {
        var g = bipgraph(edges, n, m);
        drawBipGraph(g);
    } else if(eval("graph_format") == "cig") {
        var g = cigraph(edges,n,m);
        drawGraph(g);
    } else {
        var g = graph(edges, n, m);
        drawGraph(g);
    }
    order = [];
    for(var i = 0;i < g.vertices.length;i++) {
        if(eval("graph_format") == "bipartite") {
            if(i>=g.vertices.length/2) break;
        } else {
            order.push(i);
        }
    }
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