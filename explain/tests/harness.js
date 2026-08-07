/**
 * harness.js — runs the real EXPLAIN algorithm code outside a browser.
 *
 * The shipped modules are entangled with d3 and the DOM, so this builds a
 * vm context containing:
 *
 *   - a chainable no-op `d3` stub, plus minimal `document` / `$` / localStorage
 *   - the REAL graph.js, bipgraph.js, distinguished_color.js and graphic.js
 *   - in-memory replacements for the handful of graphic.js functions that
 *     read their answer back out of the SVG rather than from the graph
 *
 * Anything listed in `STUBBED` below is NOT the shipped implementation; every
 * other function under test is exactly the code that runs in the browser.
 * Keeping that boundary explicit is the point — a test that passes against a
 * reimplementation of the thing it is testing is worthless.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const EXPLAIN_DIR = path.join(__dirname, '..');

/** graphic.js functions replaced because they query the DOM for state. */
const STUBBED = [
    'get_colored_vertices',  // reads circle fills out of #svg_graph
    'is_clique',             // reads <line> elements out of #svg_graph
    'specify_fillins'        // reads edge colours out of #edges
];

/* ------------------------------------------------------------------ d3 stub */

function chainable() {
    const node = new Proxy(function () {}, {
        get(target, prop) {
            if (prop === 'each') return () => node;
            if (prop === Symbol.toPrimitive) return () => '';
            // d3 v3 exposes selections as array-likes; is_clique reads sel[0][0].
            if (prop === '0') return [null];
            if (prop === 'length') return 0;
            return () => node;
        },
        apply() { return node; }
    });
    return node;
}

function makeD3() {
    const d3 = {
        select: chainable,
        selectAll: chainable,
        range(start, end) {
            const out = [];
            for (let v = start; v < end; v++) out.push(v);
            return out;
        },
        rgb(colorString) {
            const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(String(colorString));
            return m
                ? { r: +m[1], g: +m[2], b: +m[3] }
                : { r: 0, g: 0, b: 0 };
        }
    };
    return d3;
}

/* -------------------------------------------------------------- DOM/jq stub */

function makeDocument() {
    const element = () => ({
        value: '', innerHTML: '', disabled: false,
        options: [{ value: '' }], selectedIndex: 0,
        appendChild() {}, remove() {}
    });
    return {
        title: '',
        getElementById: element,
        createElement: element,
        getElementsByTagName: () => []
    };
}

function deepClone(value) {
    if (Array.isArray(value)) return value.map(deepClone);
    if (value && typeof value === 'object') {
        const out = {};
        for (const k of Object.keys(value)) out[k] = deepClone(value[k]);
        return out;
    }
    return value;
}

function makeJQuery() {
    const jq = () => ({ click() {}, append() {} });
    // nested_dissection.js relies on jQuery.extend(true, {}, g) for a deep copy.
    jq.extend = function (deep, target, source) {
        if (deep !== true) return Object.assign(deep, target, source);
        return Object.assign(target, deepClone(source));
    };
    return jq;
}

/* ------------------------------------------------------------ context build */

function loadScript(context, relativePath) {
    const file = path.join(EXPLAIN_DIR, relativePath);
    const code = fs.readFileSync(file, 'utf8');
    vm.runInContext(code, context, { filename: relativePath });
}

/**
 * Build a fresh EXPLAIN environment.
 * @param {object} [options]
 * @param {string} [options.dir] '' for the standard modules, 'big/' for the
 *        big-graph variants.
 * @returns {object} the vm context, with `__events` recording side effects.
 */
function createEnvironment(options = {}) {
    const dir = options.dir || '';

    const events = {
        rounds: [],          // gather_round_data(...) calls
        roundsCompleted: 0,  // round_completed() calls
        fillEdges: [],       // edges make_clique drew as fill-in
        alerts: []
    };

    const sandbox = {
        console,
        d3: makeD3(),
        document: makeDocument(),
        localStorage: { getItem: () => '', setItem() {}, clear() {} },
        alert: (msg) => events.alerts.push(String(msg)),
        __events: events
    };
    sandbox.window = sandbox;
    sandbox.$ = sandbox.jQuery = makeJQuery();

    const context = vm.createContext(sandbox);

    // Globals the shipped code expects to already exist.
    vm.runInContext(`
        var currentg, current, order = [], colors = [], selected_color = 0;
        var prev_vers = [], clickedSoFar = [], stopAnim = false;
        var ratio = 1, margin = 0, width = 450, height = 450, fillinSize = 8;
        var graph_format = 'simple', animation = false, post_processing_name = '';
        var reference_text = '', reference_url = '';
        var chart_yaxis1_text, chart_yaxis2_text;
        var chart_group1_text, chart_group2_text, chart_group3_text,
            chart_group4_text, chart_group5_text;
        var start_matrix = '', all_fillins = [];
        function chartFromRounds() {}
    `, context);

    // ---- the real implementations -----------------------------------------
    loadScript(context, 'distinguished_color.js');
    loadScript(context, dir + 'graph.js');
    loadScript(context, dir + 'bipgraph.js');
    loadScript(context, dir + 'graphic.js');

    // ---- in-memory replacements for the DOM-reading functions --------------
    vm.runInContext(`
        // Mirrors the DOM version, which returns ids as STRINGS.
        function get_colored_vertices() {
            var out = [];
            for (var v = 0; v < currentg.vertices.length; v++) {
                if (!__eliminated[v] && currentg.vertices[v].color !== -1) out.push(String(v));
            }
            return out;
        }

        function is_clique() {
            var live = [];
            for (var v = 0; v < currentg.vertices.length; v++) {
                if (!__eliminated[v]) live.push(v);
            }
            for (var a = 0; a < live.length; a++) {
                for (var b = a + 1; b < live.length; b++) {
                    if (currentg.vertices[live[a]].edges.indexOf(live[b]) === -1 &&
                        currentg.vertices[live[b]].edges.indexOf(live[a]) === -1) return false;
                }
            }
            return true;
        }

        // The DOM version harvests fill-in from red edges in #edges; here
        // make_clique reports them directly through draw_edge_color.
        function specify_fillins() {
            var out = __events.fillEdges.slice(__fillinCursor);
            __fillinCursor = __events.fillEdges.length;
            return out;
        }

        var __eliminated = {};
        var __fillinCursor = 0;

        // Wrap, don't replace: the shipped remove_vertex/make_clique still do
        // all of the graph mutation.
        var __remove_vertex = remove_vertex;
        remove_vertex = function (id) { __eliminated[id] = true; __remove_vertex(id); };

        draw_edge_color = function (src, tgt, color) {
            __events.fillEdges.push({ src: String(src), tgt: String(tgt) });
        };

        function gather_round_data(a, b, c, d, e) { __events.rounds.push([a, b, c, d, e]); }
        function round_completed() { __events.roundsCompleted++; __roundClosed = true; }
        var __roundClosed = false;

        // Pure drawing — irrelevant to the algorithms.
        function drawGraph() {} function drawBipGraph() {}
        function drawGraphHierarchichal() {} function drawMatrix() {}
        function updateMatrix() {} function drawNonzeros() {}
        function drawSubMat() {} function draw_rect() {}
        function colorVertices() {} function colorEdge() {}
        function show_fillins() {} function draw_edge() {} function remove_edge() {}
        function setVertexPosition() {} function init_mouse_event() {}
    `, context);

    return context;
}

/**
 * Install a graph built from `edges` as the module under test would see it.
 * Mirrors the dispatch in file_handle.js `init()`.
 */
function installGraph(context, edges, n, format, n2) {
    context.graph_format = format;
    context.__n2 = (n2 === undefined) ? n : n2;
    vm.runInContext(`
        (function (edges, n, format) {
            if (format === 'bipartite')   currentg = bipgraph(edges, n, edges.length, __n2);
            else if (format === 'cig')    currentg = cigraph(edges, __n2, edges.length);
            else                          currentg = graph(edges, n, edges.length);
            order = [];
            var limit = (format === 'bipartite') ? currentg.numRows : currentg.vertices.length;
            for (var v = 0; v < limit; v++) order.push(v);
            __eliminated = {};
            __fillinCursor = 0;
            clickedSoFar = [];
            __roundClosed = false;
        })(__edges, __n, __format);
    `, Object.assign(context, { __edges: edges, __n: n, __format: format }));
    return context.currentg;
}

/** Load one module file (e.g. 'column_compression') and apply its globals. */
function loadModule(context, moduleName, globalsFn) {
    loadScript(context, (context.__dir || '') + 'modules/' + moduleName + '.js');
    if (globalsFn) vm.runInContext(globalsFn + '();', context);
    return context;
}

/**
 * Invoke a module function for vertex `v`, the way mouse_event.js `clicked`
 * does. Two details matter for fidelity:
 *
 *  - `clicked` bails out once the round label says "completed", and ignores a
 *    vertex that was already clicked. Without those guards a module keeps
 *    firing after the graph is exhausted.
 *  - the module body is invoked from inside a function whose parameter is
 *    named `i`. nested_dissection.js reads a bare `i`, and only works because
 *    it resolves to that parameter. See nested-dissection.test.js.
 *
 * @param {string} [paramName] name of the caller's vertex parameter. Defaults
 *        to 'i', matching mouse_event.js. Only nested_dissection cares.
 * @returns {boolean} whether the module actually ran.
 */
function click(context, moduleFnName, v, paramName = 'i') {
    context.__v = v;
    // The module body is rebuilt with eval *inside* clicked, exactly as
    // mouse_event.js does it — that is what puts the caller's scope on the
    // module's scope chain.
    return vm.runInContext(`
        (function clicked(g, ${paramName}) {
            if (__roundClosed) return false;
            if (clickedSoFar.indexOf(${paramName}) !== -1) return false;
            clickedSoFar.push(${paramName});
            current = ${paramName};
            currentg = g;
            order.splice(order.indexOf(${paramName}), 1);
            order.unshift(${paramName});
            eval('var func = ' + ${moduleFnName}.toString());
            func();
            return true;
        })(currentg, __v);
    `, context);
}

/**
 * Rebuild a value with host-realm prototypes.
 *
 * Arrays and objects created inside the vm carry the vm's Array.prototype, so
 * assert.deepEqual (which is deepStrictEqual) rejects them as "same structure,
 * not reference-equal". Everything crossing the boundary goes through here.
 */
function plain(value) {
    if (Array.isArray(value)) {
        // Not value.map(plain): Array.prototype.map builds the result via the
        // receiver's constructor, so it would hand back another vm-realm array.
        const out = [];
        for (let idx = 0; idx < value.length; idx++) out.push(plain(value[idx]));
        return out;
    }
    if (value && typeof value === 'object') {
        const out = {};
        for (const k of Object.keys(value)) out[k] = plain(value[k]);
        return out;
    }
    return value;
}

const run = (context, code) => vm.runInContext(code, context);

module.exports = {
    EXPLAIN_DIR,
    STUBBED,
    createEnvironment,
    installGraph,
    loadModule,
    click,
    plain,
    run,
    /** run() then re-prototype the result for assert.deepEqual. */
    runPlain: (context, code) => plain(run(context, code))
};
