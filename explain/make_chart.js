chart_yaxis1_text = '';
chart_yaxis2_text = '';
chart_group1_text = "";
chart_group2_text = "";
chart_group3_text = "";
chart_group4_text = "";
chart_group5_text = "";

/** "1st", "2nd", ... for any round number. */
function ordinal(n) {
    var s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function make_chart(a, b, c, d, e, options) {
    options = options || {};
    var arr = [];
    var all = [].concat(a, b, c, d, e).filter(function (v) {
        return typeof v === "number" && isFinite(v);
    });
    var max_vals = (all.length ? Math.max.apply(null, all) : 0) + 4;

    if(chart_group1_text!=="") {
        arr.push({
            name: chart_group1_text,
            type: 'column',
            yAxis: 1,
            data: b,
            color: blue_alpha
        });
    }
    if(chart_group2_text!=="") {
        arr.push({
            name: chart_group2_text,
                type: 'column',
            yAxis: 1,
            data: c,
            color: red_alpha
        });
    }
    if(chart_group3_text!=="") {
        arr.push({
            name: chart_group3_text,
                type: 'column',
            yAxis: 1,
            data: d,
            color: green_alpha
        });
    }
    if(chart_group4_text!=="") {
        arr.push({
            name: chart_group4_text,
                type: 'column',
            yAxis: 1,
            data: e,
            color: magenta_alpha
        });
    }
    if(chart_group5_text!=="") {
        arr.push({
            name: chart_group5_text,
                type: 'spline',
            yAxis: 0,
            data: a,
            color: orange_alpha
        });
    }

    // A line at the best score so far, so every later round is drawn against
    // the target rather than floating on its own.
    //
    // Highcharts 4.2.4 never builds the label object for a plot line here, so
    // the line would render unexplained. The caption goes in the subtitle
    // instead, which always renders and sits directly above the plot.
    var plotLines = [];
    var bestCaption = '';
    if (options.best !== null && options.best !== undefined && isFinite(options.best)) {
        plotLines.push({
            value: options.best,
            color: '#0e5f6e',
            dashStyle: 'ShortDash',
            width: 2,
            zIndex: 5
        });
        bestCaption = 'dashed line \u2014 best so far: ' + options.best
            + (options.label ? ' ' + options.label : '')
            + (options.bestRound ? ' (round ' + options.bestRound + ')' : '');
    }

    $(function () {
        $('#container').highcharts({
            chart: {
                zoomType: 'xy'
            },
            title: {
                text: 'Scores in previous rounds'
            },
            subtitle: {
                text: bestCaption,
                style: { color: '#0e5f6e', fontWeight: 'bold' }
            },
            xAxis: {
                categories: options.categories || [],
                crosshair: true,
                title: {
                    text: 'Round'
                }
            },
            yAxis: [{ // Primary yAxis
                 title: {
                    text: chart_yaxis2_text,
                    style: {
                        color: orange_alpha
                    }
                },
                min : 0,
                max: max_vals,
                opposite: true,
                plotLines: plotLines

            }, { // Secondary yAxis
                gridLineWidth: 0,
                title: {text: chart_yaxis1_text},
                min:0,
                max:max_vals
            }],
            tooltip: {
                shared: true
            },
            legend: {
                layout: 'horizontal',
                align: 'center',
                verticalAlign: 'bottom',
                // Was disabled, which left the columns and the spline
                // unidentifiable — you could see the numbers move but not
                // what any of them measured.
                enabled: arr.length > 1
            },
            series: arr
        });
    });
}

/**
 * Build the chart from every round played.
 *
 * This used to loop `cnt < 4` against four hard-coded category labels, so a
 * fifth round silently vanished from the chart — in a tool whose whole loop is
 * "try another ordering and compare".
 */
function chartFromRounds(rounds) {
    var count = Math.max(rounds.length, 1);
    var arr = [[], [], [], [], []];
    var categories = [];

    for (var cnt = 0; cnt < count; cnt++) {
        categories.push(ordinal(cnt + 1));
        for (var cnt2 = 0; cnt2 < 5; cnt2++) {
            arr[cnt2].push(cnt < rounds.length ? rounds[cnt][cnt2] : 0);
        }
    }

    make_chart(arr[0], arr[1], arr[2], arr[3], arr[4], {
        categories: categories,
        best: typeof best_score === "undefined" ? null : best_score,
        bestRound: typeof best_round === "undefined" ? null : best_round,
        label: typeof score_label === "undefined" ? "" : score_label
    });
}
