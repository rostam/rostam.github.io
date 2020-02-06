var ratio,margin,width,height;
var loadedMatrix;
var fillinSize = 1;

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

var cy;
var def_links = [];

var cose = {
    name: 'cose'
};

var cose_bilkent = {
    name: 'cose-bilkent'
};

function init(matrix) {
    stop = false;
    loadedMatrix=matrix;
    init_mouse_event();
    var text = matrix;
    var splitted = text.split('\n');
    var cnt = 0;
    for(var i=0;i<splitted.length;i++) {
        if(splitted[i].indexOf("%") == -1) {
            cnt = i;
            break;
        }
    }
    var header = splitted[0];
    var sizes = splitted[cnt].split(' ');
    var n = parseInt(sizes[0]);
    var n2 = sizes[1];
    var m = parseInt(sizes[2]);
    var edges = [];
    var i;
    var unique_nodes = {};
    for (i = 0; i < m; i++) {
        var tmp = splitted[i + cnt].split(' ');
        edges.push({"src": parseInt(tmp[0]) - 1, "tgt": parseInt(tmp[1]) - 1});
        if(header.indexOf("symmetric")!==-1)
          edges.push({"src": parseInt(tmp[1]) - 1, "tgt": parseInt(tmp[0]) - 1});

        unique_nodes[parseInt(tmp[1]) - 1] = 1;
        unique_nodes[parseInt(tmp[0]) - 1] = 1;
    }

    var nodes = [];
    var links = [];
    var cnt = 0;
    Object.keys(unique_nodes).forEach(function (un) {
        nodes.push({
            data : {id : cnt+"", label:cnt+1},
            group : "nodes"
        });
        cnt++;
    });

    edges.forEach(function (e) {
        if(e["src"] != e["tgt"]) {
            links.push({
                data: {id: e["src"] + "" + e["tgt"], source: e["src"], target: e["tgt"]},
                group: "edges"
            });
        }
    });
    def_links = links;

    var random = {
        name: 'random',
        fit: false, // whether to fit to viewport
        padding: 30, // fit padding
        boundingBox: {x1: 0, y1: 0, w: 5000, h: 5000}, // constrain layout bounds; { x1, y1, x2, y2 }
        // or { x1, y1, w, h }
        animate: false, // whether to transition the node positions
        animationDuration: 0, // duration of animation in ms if enabled
        animationEasing: undefined, // easing of animation if enabled
        ready: undefined, // callback on layoutready
        stop: undefined // callback on layoutstop
    };


    cy = cytoscape({
        container: document.getElementById('canvas'),
        style: [
            {
                selector: 'node',
                style: {
                    'background-color': 'white',
                    'width' : '120px',
                    'height' : '120px',
                    'content' : 'data(label)',
                    'text-valign': 'center',
                    'font-size' : '55px',
                    'color' : 'black',
                    'border-width' : 3
                }
            },

            {
                selector: ':parent',
                style: {
                    'background-opacity': 0.1,
                    'background-color'  : 'gray'
                }
            },

            {
                selector: 'edge',
                style: {
                    'width': 3,
                    'line-color': 'black'
                }
            }
        ],
        ready: function () {
            window.cy = this;
            cy.elements().remove();
            cy.add(nodes);
            cy.add(links);
            if(nodes.length  < 50) {
                cy.layout(cose_bilkent).run();
            }else {
                cy.layout(cose).run();
                cy.layout(cose).run();
                cy.layout(cose).run();
            }

            var vlen = cy.nodes().length;
            n = vlen;
            var arr = [];
            for (i = 0; i < vlen; i++) arr.push(i + "");
            ratio = (450 / vlen);
            margin = 25;
            width = 450;
            height = 450;
            order = [];

            for (var i = 0; i < vlen; i++) {
                if (eval("graph_format") == "bipartite") {
                    if (i >= vlen / 2) break;
                } else {
                    order.push(i);
                }
            }
            //addClickEvent(g);
            drawMatrix(n, arr);
            drawNonzerosCy(arr);
            cy.on('tap', 'node', function (evt) {
                //console.log(evt.target.id());
                //selectedNode = node;
                clicked(evt.target.id());
                return;
                // order = [201, 213, 150, 225,  41,  52, 147, 126, 102, 125, 176,  86, 173, 236,  18, 103, 104,  29];
                // order.forEach(function (t) {
                //    clicked(t);
                // });
            });
        }
    });

    // return;

    // d3.select("#svg_graph").selectAll("*").remove();
    // d3.select("#svg_graph").append("g").attr("id", "edges");
    // d3.select("#svg_graph").append("g").attr("id", "vertices");
    //
    // if(eval("graph_format") == "bipartite") {
    //     var g = bipgraph(edges, n, m);
    //     drawBipGraph(g);
    // } else if(eval("graph_format") == "cig") {
    //     var g = cigraph(edges,n,m);
    //     drawGraph(g);
    // } else {
    //     var g = graph(edges, n, m);
    //     drawGraph(g);
    // }
    // order = [];
    // for(var i = 0;i < g.vertices.length;i++) {
    //     if(eval("graph_format") == "bipartite") {
    //         if(i>=g.vertices.length/2) break;
    //     } else {
    //         order.push(i);
    //     }
    // }
    //addClickEvent(g);
    // currentg = g;
}