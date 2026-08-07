/* ==========================================================================
   index.js — navigation + publication browser
   Vanilla, no dependencies. Reads the `pubs` array from papers.js.
   ========================================================================== */

(function () {
    'use strict';

    /* ---------------------------------------------------------------- nav */

    var toggle = document.querySelector('.site-nav__toggle');
    var navList = document.getElementById('nav-list');

    if (toggle && navList) {
        toggle.addEventListener('click', function () {
            var open = navList.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', String(open));
        });

        // Collapse after tapping a link on mobile, otherwise the menu covers
        // the section the user just jumped to.
        navList.addEventListener('click', function (e) {
            if (e.target.closest('a')) {
                navList.classList.remove('is-open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Highlight the section currently in view.
    var sectionLinks = Array.prototype.slice.call(
        document.querySelectorAll('.site-nav__link[href^="#"]')
    );

    if (sectionLinks.length && 'IntersectionObserver' in window) {
        var targets = sectionLinks
            .map(function (a) { return document.querySelector(a.getAttribute('href')); })
            .filter(Boolean);

        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                sectionLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
                var active = sectionLinks.filter(function (a) {
                    return a.getAttribute('href') === '#' + entry.target.id;
                })[0];
                if (active) active.setAttribute('aria-current', 'page');
            });
        }, { rootMargin: '-20% 0px -70% 0px' });

        targets.forEach(function (t) { spy.observe(t); });
    }

    /* ------------------------------------------------------- publications */

    var listEl = document.getElementById('publications-list');
    if (!listEl || typeof pubs === 'undefined') return;

    var filtersEl = document.getElementById('pub-filters');
    var statusEl = document.getElementById('pub-status');
    var searchEl = document.getElementById('pub-search');

    var CATEGORIES = {
        GTA: 'Graph Theory and its Applications',
        DAV: 'Data Analysis and Visualization',
        CSC: 'Combinatorial Scientific Computing',
        EDU: 'Educational Themes',
        PAC: 'Parallel Computing'
    };

    // 'ALL' is the reset the old filter never had — once a category was
    // clicked there was no way back to the full list without a reload.
    var activeCat = 'ALL';
    var query = '';

    var records = pubs.map(function (pub) {
        var cats = String(pub.keywords || '')
            .split(',')
            .map(function (k) { return k.trim(); })
            .filter(Boolean);

        return {
            data: pub,
            cats: cats,
            haystack: [pub.title, pub.authors, pub.proceedings, pub.year]
                .join(' ')
                .toLowerCase(),
            node: null
        };
    });

    // Newest first, and stable for equal years.
    records.sort(function (a, b) { return (b.data.year || 0) - (a.data.year || 0); });

    function catTag(cat) {
        var span = document.createElement('span');
        span.className = 'cat-tag cat-' + cat;
        span.textContent = cat;
        // Colour is never the only carrier of meaning.
        span.title = CATEGORIES[cat] || cat;
        span.setAttribute('aria-label', CATEGORIES[cat] || cat);
        return span;
    }

    function buildRow(rec) {
        var pub = rec.data;

        var li = document.createElement('li');
        li.className = 'pub';

        // A stable year column, rather than <ol reversed> numbering that
        // renumbered every entry as soon as a filter was applied.
        var year = document.createElement('div');
        year.className = 'pub__year';
        year.textContent = pub.year || '';
        li.appendChild(year);

        var body = document.createElement('div');

        var title = document.createElement('p');
        title.className = 'pub__title';
        title.textContent = pub.title || '';
        body.appendChild(title);

        var authors = document.createElement('p');
        authors.className = 'pub__authors';
        authors.textContent = pub.authors || '';
        body.appendChild(authors);

        var venue = document.createElement('p');
        venue.className = 'pub__venue';
        venue.textContent = pub.proceedings || '';
        body.appendChild(venue);

        var meta = document.createElement('div');
        meta.className = 'pub__meta';
        rec.cats.forEach(function (c) { meta.appendChild(catTag(c)); });

        if (pub.doi) {
            var link = document.createElement('a');
            link.className = 'pub__doi';
            link.href = pub.doi;
            link.rel = 'noopener';
            link.textContent = 'DOI ↗';
            // Distinguishable out of context for screen-reader link lists.
            link.setAttribute('aria-label', 'DOI for ' + (pub.title || 'this publication'));
            meta.appendChild(link);
        }

        body.appendChild(meta);
        li.appendChild(body);
        return li;
    }

    records.forEach(function (rec) {
        rec.node = buildRow(rec);
        listEl.appendChild(rec.node);
    });

    /* ------------------------------------------------------------ filters */

    function countFor(cat) {
        if (cat === 'ALL') return records.length;
        return records.filter(function (r) { return r.cats.indexOf(cat) !== -1; }).length;
    }

    function makeChip(cat, label) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chip';
        btn.dataset.cat = cat;
        btn.setAttribute('aria-pressed', String(cat === activeCat));

        var key = document.createElement('span');
        key.className = 'chip__key cat-' + cat;
        key.textContent = cat === 'ALL' ? 'ALL' : cat;
        btn.appendChild(key);

        btn.appendChild(document.createTextNode(label));

        var count = document.createElement('span');
        count.className = 'chip__count';
        count.textContent = countFor(cat);
        btn.appendChild(count);

        btn.addEventListener('click', function () {
            // Clicking the active chip clears it, so the filter is never a
            // one-way door.
            activeCat = (activeCat === cat) ? 'ALL' : cat;
            syncChips();
            apply();
        });

        return btn;
    }

    var chips = [];

    if (filtersEl) {
        chips.push(makeChip('ALL', 'All'));
        Object.keys(CATEGORIES).forEach(function (cat) {
            chips.push(makeChip(cat, CATEGORIES[cat]));
        });
        chips.forEach(function (c) { filtersEl.appendChild(c); });
    }

    function syncChips() {
        chips.forEach(function (c) {
            c.setAttribute('aria-pressed', String(c.dataset.cat === activeCat));
        });
    }

    function apply() {
        var shown = 0;

        records.forEach(function (rec) {
            var catOk = activeCat === 'ALL' || rec.cats.indexOf(activeCat) !== -1;
            var textOk = !query || rec.haystack.indexOf(query) !== -1;
            var visible = catOk && textOk;

            rec.node.hidden = !visible;
            if (visible) shown++;
        });

        if (!statusEl) return;

        if (shown === records.length) {
            statusEl.textContent = 'Showing all ' + records.length + ' publications.';
        } else if (shown === 0) {
            statusEl.textContent = 'No publications match. Try clearing the search or the topic filter.';
        } else {
            var bits = [];
            if (activeCat !== 'ALL') bits.push(CATEGORIES[activeCat]);
            if (query) bits.push('“' + query + '”');
            statusEl.textContent =
                'Showing ' + shown + ' of ' + records.length +
                ' publications' + (bits.length ? ' — ' + bits.join(', ') : '') + '.';
        }
    }

    if (searchEl) {
        searchEl.addEventListener('input', function () {
            query = searchEl.value.trim().toLowerCase();
            apply();
        });
    }

    apply();
}());
