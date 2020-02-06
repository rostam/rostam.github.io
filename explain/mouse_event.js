prev_vers = [];
var gArchive = undefined;
var rounds = [];
var orange_alpha = "rgba(255,165,0,0.5)";
var blue_alpha = "rgba(0,0,255,0.5)";
var red_alpha = "rgba255,0,0,0.5)";
var green_alpha = "rgba(0,255,0,0.5)";
var magenta_alpha = "rgba(255,0,255,0.5)";

function init_mouse_event() {
    chartFromRounds(rounds);
    d3.select("#name").html(localStorage.getItem("name"));
    d3.select("#round").html("1");
    document.getElementById("orderSelect").innerHTML = "";
    clickedSoFar = [];
    prev_vers = [];
    eval(myCodeMirrorGlobal.getValue());
}

function makeInputTag(i) {
    return '<input type=button id="' + (i + 1) + '" value="' + (i + 1) + '" style="font-size: 1.2em;" ' +
        'onclick="order_select(' + i + ');">';
}

function clicked(g, i) {
    if(document.getElementById("round").innerHTML.indexOf("completed") !== -1) return;
    if(clickedSoFar.indexOf(i) !== -1) return;
    clickedSoFar.push(i);
    current = i;
    currentg = g;
    document.getElementById("orderSelect").innerHTML =
        document.getElementById("orderSelect").innerHTML +
            makeInputTag(i);
    order.splice(order.indexOf(i),1);
    order.unshift(i);
    eval("finished=false;");
    eval("var func = " + myCodeMirror.getValue());
    eval("func()");
    if(eval("finished") == true)
        round_completed();
}

function round_completed() {
 document.getElementById("round").innerHTML = rounds.length + " completed!";
}

function gather_round_data(a,b,c,d,e) {
    rounds.push([a,b,c,d,e]);
    chartFromRounds(rounds);
}