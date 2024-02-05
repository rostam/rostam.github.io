chart_yaxis1_text = '';
chart_yaxis2_text = '';
chart_group1_text = "";
chart_group2_text = "";
chart_group3_text = "";
chart_group4_text = "";
chart_group5_text = "";
function make_chart(a, b, c, d, e) {
    var arr = [];
    var max_vals = max(a,max(b,max(c,max(d,max(e))))) + 4;
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

    $(function () {
        $('#container').highcharts({
            chart: {
                zoomType: 'xy'
            },
            title: {
                text: 'Scores in previous rounds'
            },
            subtitle: {
                text: ''
            },
            xAxis: {
                categories: [
                    '1st',
                    '2nd',
                    '3rd',
                    '4th'
                ],
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
                opposite: true

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
                layout: 'vertical',
                align: 'center',
                x: 30,
                verticalAlign: 'top',
                y: 30,
                floating: true,
                backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
                enabled:false
            },
            series: arr
        });
    });
}

function chartFromRounds(rounds) {
    var arr = [[], [], [], [], []];
    for (var cnt = 0; cnt < 4; cnt++) {
        for (var cnt2 = 0; cnt2 < 5; cnt2++) {
            if (cnt < rounds.length) {
                arr[cnt2].push(rounds[cnt][cnt2]);
            } else {
                arr[cnt2].push(0);
            }
        }
    }
    make_chart(arr[0], arr[1], arr[2], arr[3], arr[4]);
}