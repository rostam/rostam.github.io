/**
 * Created by rostam on 10/6/16.
 *
 * The palette must be at least as long as the colour range the modules use
 * (`colors = range(0, 22)`). It previously held 14 entries, so colour 14 and
 * beyond resolved to `undefined` and rendered black, and the colour mirroring
 * in bidirectional compression (`dcolors.length - c - 1`) went negative.
 */
var dcolors = [];
dcolors.push("rgb(0,0,255)");    //blue
dcolors.push("rgb(0,255,0)");    //green
dcolors.push("rgb(255,165,0)");  //orange
dcolors.push("rgb(255,0,255)");  //magenta
dcolors.push("rgb(255,0,0)");    //red
dcolors.push("rgb(255,255,0)");  //yellow
dcolors.push("rgb(154,205,50)"); //yellow green
dcolors.push("rgb(255,99,71)");  //tomato
dcolors.push("rgb(0,255,255)");  //aqua
dcolors.push("rgb(95,158,160)"); //cadet blue
dcolors.push("rgb(255,105,180)");//hot pink
dcolors.push("rgb(199,21,133)"); //violet red
dcolors.push("rgb(128,0,128)");  //purple
dcolors.push("rgb(178,34,34)");  //fire brick
dcolors.push("rgb(0,128,128)");  //teal
dcolors.push("rgb(128,128,0)");  //olive
dcolors.push("rgb(0,0,128)");    //navy
dcolors.push("rgb(128,0,0)");    //maroon
dcolors.push("rgb(70,130,180)"); //steel blue
dcolors.push("rgb(255,140,0)");  //dark orange
dcolors.push("rgb(60,179,113)"); //medium sea green
dcolors.push("rgb(112,128,144)");//slate gray

/**
 * Colour for index i. Wraps rather than returning undefined, so a graph that
 * needs more colours than the palette holds still renders something visible.
 */
function get_color(i) {
    if (typeof i !== "number" || i < 0) return "rgb(255,255,255)";
    return dcolors[i % dcolors.length];
}
