/**
 * Created by rostam on 05.10.16.
 */
order = [];
document.title="EXPLAIN - " + localStorage.getItem("name");
document.getElementById("newname").value=localStorage.getItem("name");
document.getElementById("Title").innerHTML = localStorage.getItem("name");
var tmp = localStorage.getItem("func");

//tmp = tmp.substring(tmp.indexOf("\n")+1);
//tmp = tmp.substring(0,tmp.length-2);
myCodeMirror = CodeMirror(document.getElementById("code"), {
    value: tmp,
    mode:  "javascript",
    lineNumbers : true,
    extraKeys: {"Ctrl-Space": "autocomplete"}
});
var tmp = localStorage.getItem("global");
tmp = tmp.substring(tmp.indexOf("\n")+1);
tmp = tmp.substring(0,tmp.length-2);
myCodeMirrorGlobal = CodeMirror(document.getElementById("global"), {
    value: tmp,
    mode:  "javascript",
    lineNumbers : true,
    extraKeys: {"Ctrl-Space": "autocomplete"}
});
myCodeMirror.setSize(500,250);
myCodeMirrorGlobal.setSize(500,75);
tmp = localStorage.getItem("reference");
tmp = tmp.substring(tmp.indexOf("\n")+1);
tmp = tmp.substring(0,tmp.length-2);
eval(tmp);
document.getElementById("next_round").disabled = false;
start_test();
function start_test() {
    eval(myCodeMirrorGlobal.getValue());
    var ppname = eval("post_processing_name").toString();
    if(ppname.length !== 0) {
        document.getElementById("show_edge").disabled = false;
        d3.select("#show_edge").attr("value", ppname);
    }
    fill_matrix_selection();
    if(!eval("animation")) d3.select("#save").style("visibility","hidden");
    d3.select("#ref")
        .attr("href","http://doi.org/"+reference_url)
        .html(reference_text);
    var e = document.getElementById("selectMat");
    var strUser = e.options[e.selectedIndex].value;
    getText("matrices/" + strUser);
}

function stop_anim() {
    stopAnim = true;
}

function given_order() {
    eval("finished=false;");
    eval(myCodeMirrorGlobal.getValue());
    lines = myCodeMirror.getValue().split("\n");
    lines = lines.splice(1,lines.length-2);
    ord = eval("order");
    cnt_line = 0;
    cnt_ord = 0;
    stopAnim=false;
    window.requestAnimationFrame(eval_line);
}
lines = [];
ord = [];
cnt_ord = 0;
start=0;
stopAnim = false;
function eval_line(timestamp) {
    if(stopAnim) return;
    var progress = timestamp - start;
    var sel = document.getElementById('speed');
    var selected = sel.options[sel.selectedIndex].value;
    var speed = 100;
    if(selected == "veryslow") speed = 550;
    if(selected == "slow") speed = 250;
    if(selected == "normal") speed = 100;
    if(selected == "fast") speed = 50;
    if(progress > speed) {
        if(cnt_line == lines.length) {
            myCodeMirror.removeLineClass(cnt_line, "background", "highlight");
            cnt_line=0;cnt_ord++;
        }
        if(cnt_ord == ord.length) return;
        current = ord[cnt_ord];
        var line = lines[cnt_line];
        if (cnt_line !== 0) myCodeMirror.removeLineClass(cnt_line, "background", "highlight");
        myCodeMirror.addLineClass(cnt_line + 1, "background", "highlight");
        if (line.indexOf("var ") !== -1) line = line.substr(line.indexOf("var ") + 3);
        if (line.indexOf("return;") !== -1) line = line.replace("return;", "finished=true;");
        eval(line);
        //if(eval("finished") == true) return;
        cnt_line++;
        start = timestamp;
    }
    window.requestAnimationFrame(eval_line);
}

function toggle_column_code_vis() {
    if(d3.select('#code_column').style('visibility') == "visible") {
        d3.select('#code_column').style('visibility','hidden');
        d3.select('#edit_code').attr('value' , "Edit Algorithm!");
    } else {
        d3.select('#edit_code').attr('value' , "Finish Editing!");
        d3.select('#code_column').style('visibility','visible');
    }
}

function color_verteices(i,color,func) {
    var col = get_color(color);
    var col_alpha = add_alpha_to_color(d3.rgb(col));
    d3.select("#back" + i).style("fill","white");
    d3.select("#ver" + i).transition().delay(750).style("fill",col_alpha);
    currentg.vertices[i].color = color;
}

function selectOrder() {
    var sel = document.getElementById('myselect');
    var selected = sel.options[sel.selectedIndex].value;
    var vec = [];
    if (selected == "nat") {
        for (var i = 0; i < currentg.vertices.length; i++) {
            vec.push({
                'key': i,
                'value': currentg.vertices[i].edges.length
            });
        }
        vec.sort(function(a, b) {
            return b.value - a.value;
        });
        vec.forEach(function (v) {order.push(v['key']);});
    }
}
