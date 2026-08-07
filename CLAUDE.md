# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio/academic website for Dr. Ali Rostami (Software Engineer & Postdoctoral Researcher), hosted on GitHub Pages at rostam.github.io. It is a **zero-build static site** — no package manager, no bundler, no compilation step.

## Development

To preview locally, serve the root directory with any static file server:

```bash
python3 -m http.server 8080
# or
npx serve .
```

Changes are deployed automatically when pushed to the `master` branch via GitHub Pages.

## Architecture

### Root-level site (main portfolio)

- `index.html` — Single-page portfolio. Sections: hero, skills (icon grid), languages, external profiles, projects, publications.
- `papers.js` — Data file exporting a JS array of 50+ publication objects `{ authors, title, proc, year, keywords, doi }`.
- `index.js` — Reads `papers.js` at runtime and renders publication cards into the DOM, with category filtering via keyword matching.
- `me.css` — All site styles (layout, colors, skill badges, publication cards, responsive breakpoints).

Publications are driven entirely by data: to add a paper, append an entry to `papers.js`. The renderer in `index.js` auto-categorizes by matching `keywords` against predefined category lists.

### Sub-projects

| Directory | Purpose |
|-----------|---------|
| `explain/` | Interactive educational modules for scientific computing (uses CodeMirror for in-browser code editing) |
| `visual/` | Graph visualization demos using Cytoscape.js 3.21 and jQuery |
| `precol/` | PreCol project page + auto-generated Doxygen HTML docs |
| `persian_meetup/` | Materials for a Persian-language technical meetup |
| `explain_book/` | Supplementary book/tutorial specimen files |

### External libraries (CDN or vendored)

- Bootstrap 4.0.0 (CDN) — grid and navbar
- Cytoscape.js 3.21 (`visual/cytoscape321.js`) — graph rendering
- jQuery 3.1.1 (`visual/jquery-3.1.1.min.js`) — used only in `visual/`
- CodeMirror (`explain/codemirror-compressed.js`) — code editor in EXPLAIN modules
