/* artisan-assign.js — which কারিগর (factory artisan) each order line is assigned to.
 *  - ArtisanAssign.load(orderIds): one batched call per page (GET /api/Factory/order-artisans,
 *    login + shop from the token), cached for 60 s; never throws (no data = nothing shown).
 *  - orderHtml / lineHtml: screen labels ("শার্ট: করিম, প্যান্ট: রহিম", or one name if the same
 *    artisan has everything; open lines without an issue = "অনির্ধারিত").
 *  - orderText / lineText: plain names for prints (unassigned lines are left out).
 *  - Print toggle "কারিগরের নাম প্রিন্ট": default OFF, remembered per shop in
 *    localStorage['tailorbd_printArtisan_<InstitutionID>'] and shared by every page/print that uses it.
 *    <html> gets class "print-artisan-on" while enabled; elements with class "aa-print" are hidden
 *    in print unless it is on.
 */
(function () {
    'use strict';
    var TTL = 60000, CHUNK = 400;
    var cache = {};      // orderId -> { t, lines[] }
    var byLine = {};     // orderListId -> line
    var unavailable = false;
    var inflight = {};   // orderId -> pending Promise<bool> (page code may ask twice at once)

    function lang() { return (window.currentLang || localStorage.getItem('preferredLanguage') || 'bn') === 'en' ? 'en' : 'bn'; }
    function tr(bn, en) { return lang() === 'en' ? en : bn; }
    function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
    function token() {
        try { if (window.TokenHelper && TokenHelper.get) { var t = TokenHelper.get(); if (t) return t; } } catch (e) { }
        return localStorage.getItem('tailorbd_jwt') || '';
    }
    function instId() {
        return parseInt(sessionStorage.getItem('institutionId') || localStorage.getItem('session_institutionId') || '0', 10) || 0;
    }

    function load(orderIds, opts) {
        opts = opts || {};
        var now = Date.now();
        var ids = [], waits = [];
        (orderIds || []).forEach(function (x) {
            var n = parseInt(x, 10);
            if (!(n > 0) || ids.indexOf(n) >= 0) return;
            if (inflight[n]) { if (waits.indexOf(inflight[n]) < 0) waits.push(inflight[n]); return; }
            if (opts.force || !cache[n] || now - cache[n].t > TTL) ids.push(n);
        });
        if (unavailable || !token()) return Promise.resolve(false);
        if (!ids.length) return waits.length ? Promise.all(waits).then(function (r) { return r.some(Boolean); }) : Promise.resolve(false);
        var chunks = [];
        for (var i = 0; i < ids.length; i += CHUNK) chunks.push(ids.slice(i, i + CHUNK));
        var all = Promise.all(chunks.map(function (part) {
            var url = '/api/Factory/order-artisans?institutionId=' + instId() + '&orderIds=' + part.join(',');
            return fetch(url, { headers: { 'Authorization': 'Bearer ' + token() }, cache: 'no-store' })
                .then(function (r) {
                    if (r.status === 401 || r.status === 403 || r.status === 404) { unavailable = r.status !== 401 ? true : unavailable; return null; }
                    return r.ok ? r.json() : null;
                })
                .then(function (res) {
                    if (!res || !res.success) return false;
                    var t = Date.now();
                    part.forEach(function (id) { cache[id] = { t: t, lines: [] }; });
                    (res.data || []).forEach(function (l) {
                        var line = {
                            orderId: l.orderId, orderListId: l.orderListId, sn: l.sn, dressName: l.dressName || '',
                            qty: l.qty, done: !!l.done, artisanId: l.artisanId || null, artisanName: l.artisanName || '', status: l.status || '',
                            lineDone: l.lineDone == null ? !!l.done : !!l.lineDone,
                            fiQty: l.fiQty || 0, fiDone: l.fiDone || 0
                        };
                        if (!cache[line.orderId]) cache[line.orderId] = { t: t, lines: [] };
                        cache[line.orderId].lines.push(line);
                        byLine[line.orderListId] = line;
                    });
                    return true;
                })
                .catch(function () { return false; });
        })).then(function (r) { return r.some(Boolean); });
        ids.forEach(function (id) { inflight[id] = all; });
        all.then(function () { ids.forEach(function (id) { if (inflight[id] === all) delete inflight[id]; }); });
        return waits.length ? Promise.all([all].concat(waits)).then(function (r) { return r.some(Boolean); }) : all;
    }

    function noneHtml() { return '<span class="aa-none">' + tr('অনির্ধারিত', 'Not assigned') + '</span>'; }
    function nameHtml(l) {
        var st = l.status === 'Completed' ? tr('সেলাই সম্পন্ন', 'Sewing done') : tr('সেলাই চলছে', 'Sewing in progress');
        return '<span class="aa-name" title="' + esc(st) + '">' + esc(l.artisanName) + (l.status === 'Completed' ? ' ✓' : '') + '</span>';
    }
    function lineHtml(orderListId) {
        var l = byLine[orderListId];
        if (!l) return '';
        if (l.artisanName) return '<i class="fas fa-user-cog aa-ico"></i>' + nameHtml(l);
        return l.done ? '' : noneHtml();
    }
    function lineText(orderListId) { var l = byLine[orderListId]; return l && l.artisanName ? l.artisanName : ''; }
    // factory assignment with some (not all) pieces submitted
    function isPartial(l) { return !!l && l.status === 'Assigned' && l.fiDone > 0 && l.fiDone < l.fiQty; }
    // same label as lineHtml, as plain text (for [data-aa-mode="attr"] placeholders);
    // partly submitted assignments add the pieces, e.g. "করিম (১/২)"
    function lineLabel(orderListId) {
        var l = byLine[orderListId];
        if (!l) return '';
        if (l.artisanName) return l.artisanName + (l.status === 'Completed' ? ' ✓' : (isPartial(l) ? ' (' + digits(l.fiDone) + '/' + digits(l.fiQty) + ')' : ''));
        return l.done ? '' : tr('অনির্ধারিত', 'Not assigned');
    }

    // dress lines of an order done / pending: done = nothing left to sew (work complete); a line with
    // some pieces still open counts as pending
    function progress(orderId) {
        var c = cache[orderId];
        if (!c || !c.lines.length) return null;
        var done = c.lines.filter(function (l) { return l.lineDone; }).length;
        return { total: c.lines.length, done: done, pending: c.lines.length - done };
    }
    function digits(n) {
        var s = String(n);
        return lang() === 'en' ? s : s.replace(/[0-9]/g, function (d) { return '০১২৩৪৫৬৭৮৯'.charAt(+d); });
    }
    function progressText(orderId) {
        var p = progress(orderId);
        if (!p || !p.done) return '';
        if (!p.pending) return tr('সব পোশাক সম্পন্ন (' + digits(p.total) + ' টি)', 'All ' + p.total + ' dresses done');
        return tr(digits(p.done) + ' টি সম্পন্ন, ' + digits(p.pending) + ' টি বাকি', p.done + ' done, ' + p.pending + ' pending');
    }

    // groups: [{ dress, names[], open }] for the order (or only the given line ids)
    function groups(orderId, lineIds) {
        var c = cache[orderId];
        if (!c) return null;
        var lines = c.lines.filter(function (l) { return !lineIds || lineIds.indexOf(l.orderListId) >= 0; });
        var out = [], idx = {};
        lines.forEach(function (l) {
            var key = l.dressName || '-';
            if (!idx.hasOwnProperty(key)) { idx[key] = out.length; out.push({ dress: key, names: [], lines: [], open: false }); }
            var g = out[idx[key]];
            if (l.artisanName) { if (g.names.indexOf(l.artisanName) < 0) g.names.push(l.artisanName); g.lines.push(l); }
            else if (!l.done) g.open = true;
        });
        return out;
    }
    function orderHtml(orderId, lineIds) {
        var gs = groups(orderId, lineIds);
        if (!gs || !gs.length) return '';
        var all = [], anyOpen = false;
        gs.forEach(function (g) { g.names.forEach(function (n) { if (all.indexOf(n) < 0) all.push(n); }); anyOpen = anyOpen || g.open; });
        if (!all.length) return anyOpen ? noneHtml() : '';
        var allLines = [].concat.apply([], gs.map(function (g) { return g.lines; }));
        if (all.length === 1 && !anyOpen) {
            var done = allLines.every(function (l) { return l.status === 'Completed'; });
            return '<i class="fas fa-user-cog aa-ico"></i>' + nameHtml({ artisanName: all[0], status: done ? 'Completed' : 'Assigned' });
        }
        return '<i class="fas fa-user-cog aa-ico"></i>' + gs.filter(function (g) { return g.names.length || g.open; }).map(function (g) {
            return '<span class="aa-grp">' + esc(g.dress) + ': ' + (g.names.length ? '<span class="aa-name">' + esc(g.names.join('/')) + '</span>' : '') +
                (g.open ? (g.names.length ? ' + ' : '') + noneHtml() : '') + '</span>';
        }).join(', ');
    }
    function orderText(orderId, lineIds) {
        var gs = groups(orderId, lineIds);
        if (!gs) return '';
        var named = gs.filter(function (g) { return g.names.length; });
        if (!named.length) return '';
        var all = [];
        named.forEach(function (g) { g.names.forEach(function (n) { if (all.indexOf(n) < 0) all.push(n); }); });
        var anyOpen = gs.some(function (g) { return g.open; });
        if (all.length === 1 && !anyOpen && named.length === gs.length) return all[0];
        return named.map(function (g) { return g.dress + ': ' + g.names.join('/'); }).join(', ');
    }
    // fill every [data-aa-ol] (line) / [data-aa-order] (order) placeholder inside root
    // [data-aa-mode="attr"]: label is drawn by CSS from data-aa-text, so the element's textContent stays
    // empty (incomplete-works reads the dress cell's textContent for the completion SMS text).
    // [data-aa-progress]: "২ টি সম্পন্ন, ১ টি বাকি" for the order (also drawn from data-aa-text).
    function fill(root) {
        root = root || document;
        root.querySelectorAll('[data-aa-ol]').forEach(function (el) {
            var id = parseInt(el.getAttribute('data-aa-ol'), 10);
            if (el.getAttribute('data-aa-mode') === 'attr') {
                var l = byLine[id], txt = lineLabel(id);
                el.innerHTML = '';
                el.setAttribute('data-aa-text', txt);
                el.classList.toggle('aa-attr-none', !!txt && !(l && l.artisanName));
                el.title = l && l.artisanName ? (l.status === 'Completed' ? tr('সেলাই সম্পন্ন', 'Sewing done')
                    : isPartial(l) ? tr('সেলাই চলছে — ' + digits(l.fiDone) + '/' + digits(l.fiQty) + ' পিস জমা', 'Sewing in progress — ' + l.fiDone + '/' + l.fiQty + ' pcs submitted')
                    : tr('সেলাই চলছে', 'Sewing in progress')) : '';
            } else {
                el.innerHTML = lineHtml(id);
            }
        });
        root.querySelectorAll('[data-aa-order]').forEach(function (el) { el.innerHTML = orderHtml(parseInt(el.getAttribute('data-aa-order'), 10)); });
        root.querySelectorAll('[data-aa-progress]').forEach(function (el) {
            var id = parseInt(el.getAttribute('data-aa-progress'), 10), p = progress(id);
            el.innerHTML = '';
            el.setAttribute('data-aa-text', progressText(id));
            el.classList.toggle('aa-progress-all', !!(p && p.done && !p.pending));
        });
    }

    // ── print toggle ─────────────────────────────────────────────────────────
    function printKey() { return 'tailorbd_printArtisan_' + instId(); }
    function printOn() { try { return localStorage.getItem(printKey()) === '1'; } catch (e) { return false; } }
    function applyClass() { document.documentElement.classList.toggle('print-artisan-on', printOn()); }
    var listeners = [];
    function setPrintOn(v) {
        try { localStorage.setItem(printKey(), v ? '1' : '0'); } catch (e) { }
        applyClass();
        document.querySelectorAll('input.aa-print-toggle-cb').forEach(function (cb) { cb.checked = !!v; });
        listeners.forEach(function (fn) { try { fn(!!v); } catch (e) { } });
    }
    function bindToggle(el, onChange) {
        el = typeof el === 'string' ? document.querySelector(el) : el;
        if (onChange) listeners.push(onChange);
        if (!el) return;
        el.classList.add('aa-print-toggle-cb');
        el.checked = printOn();
        el.addEventListener('change', function () { setPrintOn(el.checked); });
    }
    window.addEventListener('storage', function (e) {
        if (e.key === printKey()) { applyClass(); var on = printOn(); document.querySelectorAll('input.aa-print-toggle-cb').forEach(function (cb) { cb.checked = on; }); listeners.forEach(function (fn) { try { fn(on); } catch (x) { } }); }
    });

    if (!document.getElementById('artisan-assign-css')) {
        var st = document.createElement('style');
        st.id = 'artisan-assign-css';
        st.textContent =
            '.aa-line{display:block;font-size:11px;line-height:1.25;color:#5a4fcf;margin-top:1px;white-space:normal;word-break:break-word}' +
            '.aa-line:empty{display:none}.aa-ico{font-size:9px;margin-right:3px;opacity:.7}' +
            '.aa-line[data-aa-mode="attr"]{display:none}.aa-line[data-aa-mode="attr"]:not([data-aa-text=""])[data-aa-text]{display:block;font-weight:600}' +
            '.aa-line[data-aa-mode="attr"]::after{content:attr(data-aa-text)}.aa-line.aa-attr-none{color:#9aa0a6;font-style:italic;font-weight:400}' +
            '.aa-progress{display:none}.aa-progress:not([data-aa-text=""])[data-aa-text]{display:block;font-size:11px;font-weight:700;color:#b26a00;margin-top:3px;white-space:normal}' +
            '.aa-progress::after{content:attr(data-aa-text)}.aa-progress.aa-progress-all{color:#1e7e34}' +
            '.aa-none{color:#9aa0a6;font-style:italic;font-weight:400}.aa-name{font-weight:600}' +
            '.aa-print-toggle{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:#555;cursor:pointer;margin:0;white-space:nowrap}' +
            '.aa-print-toggle input{margin:0;cursor:pointer}' +
            '.print-artisan-line{display:block;width:100%;box-sizing:border-box;text-align:center!important;background:none!important;color:#000;font-size:.85em;font-weight:700;margin-top:2px}' +
            '@media print{html:not(.print-artisan-on) .aa-print{display:none!important}.aa-print-toggle{display:none!important}.aa-ico{display:none}}';
        (document.head || document.documentElement).appendChild(st);
    }
    applyClass();

    window.ArtisanAssign = {
        load: load, fill: fill, lineHtml: lineHtml, lineText: lineText, orderHtml: orderHtml, orderText: orderText,
        progress: progress, progressText: progressText,
        printOn: printOn, setPrintOn: setPrintOn, bindToggle: bindToggle, label: function () { return tr('কারিগর', 'Artisan'); },
        _reset: function () { cache = {}; byLine = {}; inflight = {}; unavailable = false; }
    };
})();
