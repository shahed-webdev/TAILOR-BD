/* transaction-log.js */
(function () {
    'use strict';

    let institutionId   = 0;
    let institutionInfo = null;
    const PAGE_SIZE     = 50;

    // active category filter per section
    const activeCat = { inNormal: null, inAdj: null, outNormal: null, outAdj: null };

    const fmt = v => '৳' + parseFloat(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // section config
    const SECTIONS = {
        inNormal:  { type: 'in',  inExType: 'In',  amtCls: 'amt-in',  chipCls: 'in-chip'   },
        inAdj:     { type: 'in',  inExType: 'Ex',  amtCls: 'amt-adj', chipCls: 'adj-chip'  },
        outNormal: { type: 'out', inExType: 'Ex',  amtCls: 'amt-out', chipCls: 'out-chip'  },
        outAdj:    { type: 'out', inExType: 'In',  amtCls: 'amt-adj', chipCls: 'padj-chip' }
    };

    // ─── Init ─────────────────────────────────────────────────────────────────
    $(document).ready(function () {
        institutionId = parseInt(sessionStorage.getItem('institutionId') || '0');
        if (!institutionId) {
            $(document).on('app-session-ready', function () {
                institutionId = parseInt(sessionStorage.getItem('institutionId') || '0');
                if (institutionId) { init(); }
            });
            return;
        }
        init();
    });

    function init() {
        loadInstitutionInfo();
        setToday();
    }

    function loadInstitutionInfo() {
        $.get('/api/institution/' + institutionId).done(function (res) {
            if (res.success && res.data) {
                institutionInfo = res.data;
                $('#printInsName').text(institutionInfo.institutionName || '');
                $('#printInsPhone').text(institutionInfo.phone    ? '📞 ' + institutionInfo.phone    : '');
                $('#printInsAddress').text(institutionInfo.address ? '📍 ' + institutionInfo.address : '');
            }
        });
    }

    // ─── Date helpers ─────────────────────────────────────────────────────────
    window.setToday = function () {
        const d = new Date().toISOString().slice(0, 10);
        $('#dateFrom').val(d); $('#dateTo').val(d);
        loadAll();
    };
    window.setMonth = function () {
        const now = new Date(), y = now.getFullYear(),
              m = String(now.getMonth() + 1).padStart(2, '0'),
              last = new Date(y, now.getMonth() + 1, 0).getDate();
        $('#dateFrom').val(y + '-' + m + '-01');
        $('#dateTo').val(y + '-' + m + '-' + String(last).padStart(2, '0'));
        loadAll();
    };
    window.clearDates = function () {
        $('#dateFrom').val(''); $('#dateTo').val('');
        loadAll();
    };

    function getDateParams() {
        const f = $('#dateFrom').val(), t = $('#dateTo').val();
        const p = { institutionId };
        if (f) p.dateFrom = f;
        if (t) p.dateTo   = t;
        return p;
    }

    // ─── Load All ─────────────────────────────────────────────────────────────
    window.loadAll = function () {
        const f = $('#dateFrom').val(), t = $('#dateTo').val();
        const dl = (f && t) ? (f === t ? f : f + ' — ' + t)
                            : (f ? f + ' থেকে' : t ? t + ' পর্যন্ত' : 'সব সময়');
        $('#dateLabel').text(dl);
        $('#printDateRange').text(dl);

        // reset filters
        Object.keys(activeCat).forEach(function (k) { activeCat[k] = null; });

        $('#mainSpinner').show(); $('#content').hide();

        $.get('/api/TransactionLog/summary', getDateParams()).done(function (res) {
            $('#mainSpinner').hide(); $('#content').show();
            if (!res.success) return;
            const t = res.totals || {};

            // Summary cards
            $('#sTotalIn').text(fmt(t.TotalIn));
            $('#sNormalIn').text('সাধারণ: ' + fmt(t.NormalIn) + ' | অ্যাডজাস্ট: ' + fmt(t.AdjIn));
            $('#sTotalOut').text(fmt(t.TotalOut));
            $('#sNormalOut').text('সাধারণ: ' + fmt(t.NormalOut) + ' | অ্যাডজাস্ট: ' + fmt(t.AdjOut));
            const net = parseFloat(t.Net || 0);
            $('#sNet').text(fmt(net)).css('color', net >= 0 ? '#17a2b8' : '#dc3545');
            $('#sAdjIn').text(fmt(t.AdjIn));
            $('#sAdjOut').text(fmt(t.AdjOut));

            // Section totals
            $('#totalInNormal').text(fmt(t.NormalIn));
            $('#totalInAdj').text(fmt(t.AdjIn));
            $('#totalOutNormal').text(fmt(t.NormalOut));
            $('#totalOutAdj').text(fmt(t.AdjOut));

            // Build category chips
            buildChips('catsInNormal',  res.inCategories    || [], 'inNormal',  'in-chip');
            buildChips('catsInAdj',     res.inAdjCategories || [], 'inAdj',     'adj-chip');
            buildChips('catsOutNormal', res.outCategories   || [], 'outNormal', 'out-chip');
            buildChips('catsOutAdj',    res.outAdjCategories|| [], 'outAdj',    'padj-chip');

            // Load rows for visible sections
            loadSection('inNormal', 1);
            loadSection('outNormal', 1);
        }).fail(function () {
            $('#mainSpinner').hide(); $('#content').show();
        });
    };

    // ─── Build category chips ─────────────────────────────────────────────────
    function buildChips(barId, categories, secKey, chipCls) {
        const $bar = $('#' + barId).empty();
        if (!categories.length) { $bar.hide(); return; }
        $bar.show();

        // "All" chip
        $bar.append(
            $('<span class="cat-chip ' + chipCls + ' active" data-cat="">সব</span>')
                .on('click', function () { chipClick($(this), barId, secKey, null); })
        );

        categories.forEach(function (c) {
            $bar.append(
                $('<span class="cat-chip ' + chipCls + '" data-cat="' + c.Category + '">' +
                  c.Category + ' <b>' + fmt(c.Total) + '</b></span>')
                    .on('click', function () { chipClick($(this), barId, secKey, c.Category); })
            );
        });
    }

    function chipClick($chip, barId, secKey, cat) {
        $('#' + barId + ' .cat-chip').removeClass('active');
        $chip.addClass('active');
        activeCat[secKey] = cat;
        loadSection(secKey, 1);
    }

    // ─── Toggle section collapse ──────────────────────────────────────────────
    window.toggleSection = function (secKey) {
        const $body = $('#body' + cap(secKey));
        const $head = $body.prev('.sec-head');
        if ($body.is(':visible')) {
            $body.slideUp(150);
            $head.addClass('collapsed');
        } else {
            $body.slideDown(150);
            $head.removeClass('collapsed');
            // lazy load if not yet loaded
            if (!$('#rows' + cap(secKey)).data('loaded')) {
                loadSection(secKey, 1);
            }
        }
    };

    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    // ─── Load section rows ────────────────────────────────────────────────────
    function loadSection(secKey, page) {
        const cfg  = SECTIONS[secKey];
        const $spin  = $('#spin'  + cap(secKey));
        const $table = $('#table' + cap(secKey));
        const $rows  = $('#rows'  + cap(secKey));
        const $pager = $('#pager' + cap(secKey));

        $spin.show(); $table.hide();

        const params = Object.assign({}, getDateParams(), {
            type: cfg.type, inExType: cfg.inExType,
            page: page, pageSize: PAGE_SIZE
        });
        if (activeCat[secKey]) params.category = activeCat[secKey];

        $.get('/api/TransactionLog/logs', params).done(function (res) {
            $spin.hide(); $table.show();
            $rows.data('loaded', true).empty();

            if (!res.success || !res.data || !res.data.length) {
                $rows.append('<tr><td colspan="8" class="text-center py-3 text-muted">কোন রেকর্ড নেই</td></tr>');
                $pager.empty(); return;
            }

            res.data.forEach(function (r) {
                $rows.append('<tr>' +
                    '<td class="t-muted">' + r.Log_SN + '</td>' +
                    '<td><span style="font-size:11px;background:#f0f1fc;color:#6c7ae0;border-radius:4px;padding:2px 6px;">'
                        + (r.Category || '—') + '</span></td>' +
                    '<td>' + (r.Situation || '—') + '</td>' +
                    '<td class="' + cfg.amtCls + '">' + fmt(r.Amount) + '</td>' +
                    '<td style="max-width:180px;font-size:11px;">' + (r.Details || '—') + '</td>' +
                    '<td class="t-muted">' + (r.AccountName || '—') + '</td>' +
                    '<td style="white-space:nowrap;">' + (r.InsertDate || '') +
                        ' <span class="t-muted">' + (r.InsertTime || '') + '</span></td>' +
                    '<td class="t-muted">' + (r.UserName || '—') + '</td>' +
                    '</tr>');
            });

            renderPager($pager, res.page, res.totalPages, function (pg) { loadSection(secKey, pg); });
        }).fail(function () {
            $spin.hide(); $table.show();
        });
    }

    // ─── Pager ────────────────────────────────────────────────────────────────
    function renderPager($wrap, page, totalPages, fn) {
        $wrap.empty();
        if (totalPages <= 1) return;
        const $p = $('<div class="d-flex gap-1 align-items-center flex-wrap">');
        const btn = function (label, pg, disabled, active) {
            return $('<button>').html(label).prop('disabled', !!disabled)
                .addClass(active ? 'active' : '')
                .on('click', function () { fn(pg); });
        };
        $p.append(btn('&laquo;', 1,          page <= 1));
        $p.append(btn('&lsaquo;', page - 1,  page <= 1));
        const start = Math.max(1, page - 2), end = Math.min(totalPages, start + 4);
        for (let i = start; i <= end; i++) $p.append(btn(i, i, false, i === page));
        $p.append(btn('&rsaquo;', page + 1,  page >= totalPages));
        $p.append(btn('&raquo;', totalPages, page >= totalPages));
        $p.append('<span class="pager-info">পেজ ' + page + ' / ' + totalPages + '</span>');
        $wrap.append($p);
    }

}());
