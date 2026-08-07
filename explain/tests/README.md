# EXPLAIN tests

Tests for the algorithms behind the EXPLAIN modules — graph construction,
greedy colouring, symbolic Cholesky, star bicolouring and vertex separators.

No dependencies and no build step. The only requirement is Node 18 or newer,
for the built-in test runner.

```bash
cd explain/tests
node --test '*.test.js'      # or: npm test
```

79 tests, all passing.

## How the shipped code is tested

The modules are entangled with d3 and the DOM, so `harness.js` builds a `vm`
context holding a chainable no-op `d3`, a minimal `document`, and then loads
the **real** `graph.js`, `bipgraph.js`, `distinguished_color.js` and
`graphic.js`.

Module bodies are invoked the way `mouse_event.js` does it — rebuilt with
`eval` inside a function whose vertex parameter is named `i`, and guarded by
the same "already clicked" and "round completed" checks.

Three functions are replaced, because the shipped versions read their answer
back out of the SVG rather than from the graph:

| Replaced | Why |
|---|---|
| `get_colored_vertices()` | reads circle fills from `#svg_graph` |
| `is_clique()` | reads `<line>` elements from `#svg_graph` |
| `specify_fillins()` | reads edge colours from `#edges` |

Everything else under test — `graph`, `cigraph`, `bipgraph`, `bfs`,
`allVSeen`, `removeVertex`, `make_clique`, `remove_vertex`, `neighbors`,
`d2_neighbors`, `get_colors`, `min`/`max`/`diff`/`range`, `deviationBound`,
`communicationVolume`, and every `modules/*.js` body — is the code that runs
in the browser, unmodified.

`reference.js` holds independent implementations written from the textbook
definitions, so that "the module agrees with the reference" means something.

## Files

| File | Covers |
|---|---|
| `graph.test.js` | graph/CIG construction, BFS, partitioning, clique tests |
| `coloring.test.js` | greedy colouring, Column Compression, the palette |
| `cholesky.test.js` | vertex elimination, fill-in, `make_clique` |
| `bipartite.test.js` | row/column/bidirectional compression, `bipgraph` |
| `nested-dissection.test.js` | vertex separators, orderings, scoping |
| `matrix-market.test.js` | the `.mtx` reader in `file_handle.js` |
| `duplication.test.js` | `modules/` vs `big/modules/` drift |

## Verified behaviour

Checked against independent implementations, on the shipped matrices:

- **Column Compression** produces a proper colouring of the column
  intersection graph and matches a reference first-fit colouring vertex for
  vertex, under every ordering tried. Its reported colour count is correct.
- **Cholesky Factorization** produces exactly the fill edges a reference
  symbolic factorization produces, across several orderings, and demonstrates
  that ordering changes the fill count.
- **Row / Column Compression (bipartite)** give distinct colours to any two
  rows sharing a column, and any two columns sharing a row, and each completes
  its round.
- **Bidirectional Compression** colours both sides, keeps the two sides'
  colours disjoint, gives distinct colours to columns sharing a row, and
  produces a colouring in which *every path on four vertices uses at least
  three colours* — verified independently of the module's own check.
- **Nested Dissection** builds genuine vertex separators and emits a
  permutation putting the separator last.
- All 20 shipped matrices parse to well-formed indices and agree with a strict
  Matrix Market reader.

## Fixes applied

Every item below was found by this suite and is now fixed; the tests assert
the corrected behaviour and will fail if it regresses.

### Live bugs

1. **Bidirectional Compression stopped halfway.** The termination test was
   `if (cnt > numOfVertices() / 2) end = 0;`, where `cnt` counts uncoloured
   vertices across *both* sides — so on a 6×6 matrix, colouring the six rows
   left `cnt = 6`, not `> 6`, and the module finished with every column
   uncoloured. Now `if (cnt > 0) end = 0;`.

2. **Colour mirroring corrupted the column colouring.** Columns are drawn with
   `dcolors.length - c - 1` so the two sides sit at opposite ends of the
   palette. The module read those *display* values back as if they were
   logical ones, excluded the wrong entries from the palette, and handed every
   column the same colour. Colour selection now happens in an explicit logical
   space, mirrored only for display. (Found after fixing 1, which is what made
   the column branch reachable at all.)

3. **The star-bicolouring validity check was dead code.** The block that walks
   every 4-path built `usedcolors` and discarded it — the decision was
   commented out, and the commented line was missing its operator. It now runs
   as `if (Object.keys(usedcolors).length < 3) end = 0;`. Cost measured at
   ~11 ms on the largest shipped matrix.

4. **The round counter was off by one.** `round_completed()` ran before
   `gather_round_data()`, and the label is `rounds.length + " completed!"`, so
   the first round announced itself as "0 completed!". Order swapped.

5. **`row_compression_bip` never completed a round.** It had no completion
   test and no chart labels, so the chart stayed empty and the counter never
   advanced. Both added.

6. **`make_clique` added a self-loop to every vertex it touched.** The nested
   `forEach` had no `if (u !== v)` guard, so it pushed `v` into its own edge
   list and drew a degenerate red edge — which `specify_fillins` then counted
   as fill-in. Guard added.

7. **The fill-in metric was mislabelled.** It counts matrix *entries* — both
   `(i,j)` and `(j,i)` — so it reads double a textbook fill-*edge* count. The
   number matches the two red circles on screen, so the axis is now labelled
   "Fill-in entries" rather than "Number of fill-in".

8. **`cigraph()` built the row intersection graph.** It grouped by `src`
   (= row) while the module colours columns. Identical for the structurally
   symmetric matrices that ship, wrong for anything else. Now groups by
   column.

### Latent bugs

9. **`isClique()` returned false for every graph.** It passed
   `Object.keys(G.vertices)` — strings — to `isEdge`, which searches a list of
   numbers with the strict `indexOf`. Now `.map(Number)`.

10. **`nested_dissection` read a bare `i`.** It worked only because
    `mouse_event.js` invokes the module from inside `function clicked(g, i)`;
    renaming that parameter threw `ReferenceError`. Now uses `current`, like
    every sibling module. The test drives it with three different caller
    parameter names.

11. **`bipgraph()` threw on a rectangular matrix.** It sized both sides from
    the row count. It now takes the column count, records `numRows`/`numCols`,
    and the modules split the two sides with `first_column_vertex()` instead
    of `vertices.length / 2`.

12. **The `.mtx` reader was brittle.** It assumed exactly one comment line
    (Matrix Market allows any number) and split on a single space, so
    `"2  3  1"` produced a column index of `-1`. It now skips all `%` lines,
    splits on any whitespace, and drops malformed or out-of-range entries
    instead of building a broken graph.

13. **The palette ran out before the algorithm did.** `colors = range(0, 22)`
    against 14 defined colours, so colour 14+ rendered as `undefined` — and
    the bidirectional mirroring reached `-1`, which is the sentinel for
    "uncoloured". The palette now holds 22 distinct colours and `get_color`
    wraps instead of returning `undefined`.

14. **`deviationBound()` returned `NaN` for five or more parts.** It tallied
    into a hard-coded `[0,0,0,0]`; a fifth part incremented a hole and `max`
    propagated the `NaN`. It now tallies dynamically and skips uncoloured
    vertices.

15. **`numOfVertices(g)` ignored its argument.** Now uses it, falling back to
    `currentg`.

16. **Diagonal entries became self-loops.** Every shipped `.mtx` has a full
    diagonal, and `graph()` turned each one into a self-loop, making a vertex
    its own neighbour — which is what let `d2_neighbors` mistake direct
    neighbours for distance-2 ones. `graph()` now skips the diagonal;
    `init_edges` still carries the full pattern so the matrix view is
    unchanged. `d2_neighbors` also deduplicates now.

17. **`big/modules/matrix_vector_product.js` held the wrong algorithm** — a
    stale copy of column compression with column-compression chart labels and
    no `start_matrix`. It was unreachable (the menu wires only "Nested
    Dissection Big"), and the `big/` tree has no `color_row_notriangle`,
    `deviationBound` or `communicationVolume` for the real module to call, so
    **the file was deleted** rather than replaced with code that would throw.
    `duplication.test.js` asserts it stays gone and that the missing functions
    would have to be added first.

All fixes were applied to both `modules/` and `big/modules/`, and to both
`graph.js`/`graphic.js` trees, which differ (the big variant uses Cytoscape).
`duplication.test.js` checks each fix is present in both copies.

## Not covered

The drawing layer (`graphic.js` rendering, `make_chart.js`) and the in-page
CodeMirror editor path (`load_module.js` `eval_line`) are untested.
`eval_line` strips `var ` and rewrites `return;`, then evaluates the module
body one line at a time in a different scope from `clicked` — the animation
path is a likely home for further scope bugs of the kind in item 10.
