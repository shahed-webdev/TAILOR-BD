/* account-log.js */
(function () {
    'use strict';

    let institutionId = 0;
    let currentPage   = 1;
    const PAGE_SIZE   = 50;
    let currentLang   = 'bn';
    let institutionInfo = null;

        const translations = {
        en: { in:'In', out:'Out', noData:'No records found.', all:'All Accounts', loading:'Loading...', page:'Page' },
        bn: { in:'ইন',  out:'আউট', noData:'কোন রেকর্ড নেই।', all:'সব একাউন্ট', loading:'লোড হচ্ছে...', page:'পেজ' }
    };
    const t = (k) => (translations[currentLang] || translations.bn)[k] || k;

    const fmt = v => '৳' + parseFloat(v || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    // ─── Init ─────────────────────────────────────────────────────────────────
    $(document).ready(function () {
        currentLang = localStorage.getItem('preferredLanguage') || 'bn';

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
        loadAccounts();
        setToday();
    }

    // ─── Institution info (for print header) ─────────────────────────────────
    function loadInstitutionInfo() {
        if (institutionInfo) { renderPrintHeader(); return; }
        $.get('/api/institution/' + institutionId).done(function (res) {
            if (res.success && res.data) {
                institutionInfo = res.data;
                renderPrintHeader();
            }
        });
    }

    function renderPrintHeader() {
        if (!institutionInfo) return;
        $('#printInsName').text(institutionInfo.institutionName || '');
        $('#printInsPhone').text(institutionInfo.phone    ? '📞 ' + institutionInfo.phone    : '');
        $('#printInsAddress').text(institutionInfo.address ? '📍 ' + institutionInfo.address : '');
    }

    // ─── Accounts dropdown ────────────────────────────────────────────────────
    function loadAccounts() {
        $.get('/api/AccountLog/accounts', { institutionId })
            .done(function (res) {
                if (!res.success) return;
                const $sel = $('#accountSelect');
                $sel.find('option:not(:first)').remove();
                res.data.forEach(function (a) {
                    $sel.append('<option value="' + a.AccountID + '">' + a.AccountName +
                        ' (' + fmt(a.AccountBalance) + ')</option>');
                });
            });
    }

    // ─── Date helpers ─────────────────────────────────────────────────────────
    window.setToday = function () {
        const today = new Date().toISOString().slice(0, 10);
        $('#dateFrom').val(today);
        $('#dateTo').val(today);
        loadLog();
    };

    window.clearFilter = function () {
        $('#dateFrom').val('');
        $('#dateTo').val('');
        $('#accountSelect').val('');
        loadLog();
    };

    // ─── Load Log ─────────────────────────────────────────────────────────────
    window.loadLog = function (page) {
        currentPage = page || 1;
        const accountId = $('#accountSelect').val() || null;
        const dateFrom  = $('#dateFrom').val() || null;
        const dateTo    = $('#dateTo').val()   || null;

        // date label
        const dl = (dateFrom && dateTo)
            ? (dateFrom === dateTo ? dateFrom : dateFrom + ' — ' + dateTo)
            : (dateFrom ? dateFrom + ' থেকে' : dateTo ? dateTo + ' পর্যন্ত' : 'সব সময়');
        $('#dateLabel').text(dl);
        $('#printDateRange').text(dl);

        $('#spinner').show();
        $('#content').hide();

        const params = { institutionId };
        if (accountId) params.accountId = accountId;
        if (dateFrom)  params.dateFrom  = dateFrom;
        if (dateTo)    params.dateTo    = dateTo;

        // summary + logs in parallel
        $.when(
            $.get('/api/AccountLog/summary', params),
            $.get('/api/AccountLog/logs', Object.assign({}, params, { page: currentPage, pageSize: PAGE_SIZE }))
        ).done(function (sRes, lRes) {
            renderSummary(sRes[0]);
            renderLogs(lRes[0]);
            $('#spinner').hide();
            $('#content').show();
        }).fail(function () {
            $('#spinner').hide();
            $('#content').show();
        });
    };

    // ─── Render Summary ───────────────────────────────────────────────────────
    function renderSummary(res) {
        if (!res.success || !res.data) return;
        const d = res.data;
        const opening = parseFloat(d.OpeningBalance || 0);
        const cashIn  = parseFloat(d.CashIn  || 0);
        const cashOut = parseFloat(d.CashOut || 0);
        const net     = cashIn - cashOut;
        const closing = opening + net;

        $('#sOpeningBalance').text(fmt(opening));
        $('#sCashIn').text(fmt(cashIn));
        $('#sCashOut').text(fmt(cashOut));

        $('#sNet').text(fmt(net))
            .removeClass('net-pos net-neg')
            .addClass(net >= 0 ? 'net-pos' : 'net-neg');

        $('#sBalance').text(fmt(closing));
    }

    // ─── Render Logs ──────────────────────────────────────────────────────────
    function renderLogs(res) {
        const $body = $('#logBody').empty();
        if (!res.success || !res.data || !res.data.length) {
            $body.append('<tr><td colspan="9" class="text-center py-4 text-muted">' + t('noData') + '</td></tr>');
            $('#totalCount').text('');
            $('#pagerWrap').empty();
            return;
        }

        $('#totalCount').text(t('page') + ' ' + res.page + ' / ' + res.totalPages +
            ' (' + res.total + ' টি রেকর্ড)');

        const offset = (res.page - 1) * res.pageSize;
        res.data.forEach(function (r, i) {
            const isIn  = r.Add_Subtraction === 'Add';
            const badge = isIn
                ? '<span class="badge-in">'  + t('in')  + '</span>'
                : '<span class="badge-out">' + t('out') + '</span>';
            const amtCls = isIn ? 'amt-in' : 'amt-out';
            const amtPfx = isIn ? '+' : '−';
            const cat    = r.Category    || '—';
            const detail = [r.Situation, r.Details].filter(Boolean).join(' · ') || '—';
            const acName = r.AccountName || '—';
            const usr    = r.UserName    || '—';
            const dt     = r.InsertDate + ' <span class="text-muted-sm">' + (r.InsertTime || '') + '</span>';

            $body.append('<tr>' +
                '<td class="text-muted-sm">' + (offset + i + 1) + '</td>' +
                '<td>' + badge + '</td>' +
                '<td>' + cat   + '</td>' +
                '<td style="max-width:200px;">' + detail + '</td>' +
                '<td>' + acName + '</td>' +
                '<td class="' + amtCls + '">' + amtPfx + fmt(r.Amount) + '</td>' +
                '<td style="font-size:12px;">' + fmt(r.Balance_After) + '</td>' +
                '<td style="white-space:nowrap;">' + dt + '</td>' +
                '<td class="text-muted-sm">' + usr + '</td>' +
                '</tr>');
        });

        renderPager(res.page, res.totalPages);
    }

    // ─── Pager ────────────────────────────────────────────────────────────────
    function renderPager(page, totalPages) {
        const $w = $('#pagerWrap').empty();
        if (totalPages <= 1) return;

        const $p = $('<div class="pager">');

        const btn = function (label, pg, disabled, active) {
            return $('<button>')
                .html(label)
                .prop('disabled', !!disabled)
                .addClass(active ? 'active' : '')
                .on('click', function () { window.loadLog(pg); });
        };

        $p.append(btn('&laquo;', 1,         page <= 1));
        $p.append(btn('&lsaquo;', page - 1, page <= 1));

        const start = Math.max(1, page - 2), end = Math.min(totalPages, start + 4);
        for (let i = start; i <= end; i++) {
            $p.append(btn(i, i, false, i === page));
        }

        $p.append(btn('&rsaquo;', page + 1, page >= totalPages));
        $p.append(btn('&raquo;', totalPages, page >= totalPages));
        $p.append('<span class="pager-info">' + t('page') + ' ' + page + ' / ' + totalPages + '</span>');

        $w.append($p);
    }

    // ─── Language change ──────────────────────────────────────────────────────
    $(document).on('languageChanged', function (e, lang) {
        currentLang = lang || 'bn';
    });

}());
