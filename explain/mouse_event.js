prev_vers = [];
var gArchive = undefined;
var rounds = [];
var orange_alpha = "rgba(255,165,0,0.5)";
var blue_alpha = "rgba(0,0,255,0.5)";
var red_alpha = "rgba(255,0,0,0.5)";
var green_alpha = "rgba(0,255,0,0.5)";
var magenta_alpha = "rgba(255,0,255,0.5)";

/* --------------------------------------------------------------------------
   Scoreboard.

   Each module declares how its score should be read, in its global_* block:

     score_label      what the number means, e.g. "colours"
     score_direction  "lower" (default) or "higher" — which way is better
     live_score       optional function returning the score so far, or null

   The round counter used to be the only feedback, and it reported how many
   rounds had finished rather than how well any of them went. Nothing told a
   student whether five colours was good.
   -------------------------------------------------------------------------- */

var score_label = "score";
var score_direction = "lower";
var live_score = null;
var best_score = null;
var best_round = null;
var last_round_score = null;

function score_is_better(candidate, incumbent) {
    if (incumbent === null || incumbent === undefined) return true;
    return score_direction === "higher" ? candidate > incumbent : candidate < incumbent;
}

function format_score(value) {
    if (value === null || value === undefined || !isFinite(value)) return "—";
    return (Math.round(value * 100) / 100) + "";
}

function current_live_score() {
    if (typeof live_score !== "function") return null;
    try {
        var v = live_score();
        return (typeof v === "number" && isFinite(v)) ? v : null;
    } catch (e) {
        return null;
    }
}

function set_scoreboard_field(id, text, highlight) {
    var el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = text;
    if (highlight !== undefined) el.className = highlight ? "sb__value sb__value--best" : "sb__value";
}

function render_scoreboard(message) {
    var roundNo = rounds.length + 1;
    var finished = document.getElementById("round") &&
        document.getElementById("round").innerHTML.indexOf("completed") !== -1;

    set_scoreboard_field("sb-round", finished ? String(rounds.length) : String(roundNo));
    set_scoreboard_field("sb-selected", String(clickedSoFar.length));

    var live = finished ? last_round_score : current_live_score();
    set_scoreboard_field("sb-score", format_score(live));

    var isBest = best_score !== null && last_round_score !== null &&
        last_round_score === best_score && finished;
    set_scoreboard_field("sb-best",
        best_score === null ? "—" : format_score(best_score) + " (round " + best_round + ")",
        isBest);

    var labelEl = document.getElementById("sb-score-label");
    if (labelEl) labelEl.innerHTML = score_label;

    var msgEl = document.getElementById("sb-message");
    if (msgEl && message !== undefined) msgEl.innerHTML = message;
}

function reset_scoreboard_for_new_round() {
    var msgEl = document.getElementById("sb-message");
    if (msgEl) msgEl.innerHTML = "";
    render_scoreboard();
}

function init_mouse_event() {
    chartFromRounds(rounds);
    d3.select("#name").html(localStorage.getItem("name"));
    d3.select("#round").html("1");
    document.getElementById("orderSelect").innerHTML = "";
    clickedSoFar = [];
    prev_vers = [];
    eval(myCodeMirrorGlobal.getValue());
    reset_scoreboard_for_new_round();
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
    render_scoreboard();
}

function round_completed() {
    document.getElementById("round").innerHTML = rounds.length + " completed!";

    var summary;
    if (last_round_score === null) {
        summary = "Round finished.";
    } else if (best_round === rounds.length && rounds.length > 1) {
        summary = "New best — " + format_score(last_round_score) + " " + score_label + "!";
    } else if (rounds.length === 1) {
        summary = "First round: " + format_score(last_round_score) + " " + score_label +
            ". Try another ordering and beat it.";
    } else if (last_round_score === best_score) {
        summary = "Matched your best — " + format_score(best_score) + " " + score_label +
            " (first reached in round " + best_round + ").";
    } else {
        var gap = score_direction === "higher"
            ? best_score - last_round_score
            : last_round_score - best_score;
        summary = format_score(last_round_score) + " " + score_label +
            " — your best is still " + format_score(best_score) +
            " (round " + best_round + "), " + format_score(gap) + " better.";
    }
    render_scoreboard(summary);
}

function gather_round_data(a,b,c,d,e) {
    rounds.push([a,b,c,d,e]);
    last_round_score = (typeof a === "number" && isFinite(a)) ? a : null;
    if (last_round_score !== null && score_is_better(last_round_score, best_score)) {
        best_score = last_round_score;
        best_round = rounds.length;
    }
    chartFromRounds(rounds);
    render_scoreboard();
}
