/* income-due-expense.js */
(function () {
    'use strict';

    let institutionId   = 0;
    let activeTab       = 'income';
    let incomeLoaded    = false;
    let dueLoaded       = false;
    let expenseLoaded   = false;
    let institutionInfo = null;
    const PAGE_SIZE     = 30;

    const fmt  = v => '৳' + parseFloat(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtN = v => parseFloat(v || 0).toLocaleString('en-US');

    const PAY_STATUS = {
        Advance:  { cls: 'badge-adv',  label: 'অগ্রিম' },
        Delivery: { cls: 'badge-del',  label: 'ডেলিভারি' },
        Paid:     { cls: 'badge-paid', label: 'সম্পূর্ণ' }
    };

    const DEL_STATUS = {
        Delivered:       { cls: 'badge-paid',       label: 'ডেলিভারড' },
        Pending:         { cls: 'badge-due-status',  label: 'পেন্ডিং' },
        PartlyDelivered: { cls: 'badge-adv',         label: 'আংশিক' }
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
        loadCategories();
        setToday();
    }

    // ─── Institution info ─────────────────────────────────────────────────────
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

    // ─── Expense categories ────────────────────────────────────────────────────
    function loadCategories() {
        $.get('/api/IncomeDueExpense/expense-categories', { institutionId }).done(function (res) {
            if (!res.success) return;
            const $sel = $('#categorySelect');
            res.data.forEach(function (c) {
                $sel.append('<option value="' + c.CategoryID + '">' + c.CategoryName + '</option>');
            });
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
              m   = String(now.getMonth() + 1).padStart(2, '0'),
              last = new Date(y, now.getMonth() + 1, 0).getDate();
        $('#dateFrom').val(y + '-' + m + '-01');
        $('#dateTo').val(y + '-' + m + '-' + String(last).padStart(2, '0'));
        loadAll();
    };
    window.clearDates = function () {
        $('#dateFrom').val(''); $('#dateTo').val('');
        loadAll();
    };

    function getParams() {
        const dateFrom = $('#dateFrom').val() || null;
        const dateTo   = $('#dateTo').val()   || null;
        const p = { institutionId };
        if (dateFrom) p.dateFrom = dateFrom;
        if (dateTo)   p.dateTo   = dateTo;
        return p;
    }

    function updateDateLabel() {
        const f = $('#dateFrom').val(), t = $('#dateTo').val();
        const dl = (f && t) ? (f === t ? f : f + ' — ' + t)
                            : (f ? f + ' থেকে' : t ? t + ' পর্যন্ত' : 'সব সময়');
        $('#dateLabel').text(dl);
        $('#printDateRange').text(dl);
    }

    // ─── Load All ─────────────────────────────────────────────────────────────
    window.loadAll = function () {
        incomeLoaded = dueLoaded = expenseLoaded = false;
        updateDateLabel();
        loadSummary();
        loadActiveTab();
    };

    function loadActiveTab() {
        if (activeTab === 'income')  loadIncome(1);
        if (activeTab === 'due')     loadDue(1);
        if (activeTab === 'expense') loadExpense(1);
    }

    // ─── Tab Switch ───────────────────────────────────────────────────────────
    window.switchTab = function (tab) {
        activeTab = tab;
        $('.tab-btn').removeClass('active');
        $('#tab-' + tab).addClass('active');
        $('.tab-pane').hide();
        $('#pane-' + tab).show();

        if (tab === 'income'  && !incomeLoaded)  loadIncome(1);
        if (tab === 'due'     && !dueLoaded)     loadDue(1);
        if (tab === 'expense' && !expenseLoaded) loadExpense(1);
    };

    // ─── Summary ──────────────────────────────────────────────────────────────
    function loadSummary() {
        $.get('/api/IncomeDueExpense/summary', getParams()).done(function (res) {
            if (!res.success || !res.data) return;
            const d = res.data;
            const net = parseFloat(d.TotalIncome || 0) - parseFloat(d.TotalExpense || 0);
            $('#sTotalIncome').text(fmt(d.TotalIncome));
            $('#sTotalDue').text(fmt(d.TotalDue));
            $('#sDueCount').text((d.DueOrderCount || 0) + ' টি অর্ডার বাকি');
            $('#sTotalExpense').text(fmt(d.TotalExpense));
            $('#sNet').text(fmt(net)).css('color', net >= 0 ? '#17a2b8' : '#dc3545');
        });
    }

    // ─── Income ───────────────────────────────────────────────────────────────
    window.loadIncome = function (page) {
        $('#incomeSpinner').show(); $('#incomeContent').hide();
        $.get('/api/IncomeDueExpense/income', Object.assign({}, getParams(), { page: page || 1, pageSize: PAGE_SIZE }))
            .done(function (res) {
                $('#incomeSpinner').hide(); $('#incomeContent').show();
                incomeLoaded = true;
                const $body = $('#incomeBody').empty();
                if (!res.success || !res.data || !res.data.length) {
                    $body.append('<tr><td colspan="13" class="text-center py-4 text-muted">কোন রেকর্ড নেই</td></tr>');
                    $('#incomeCount').text(''); $('#incomePager').empty(); return;
                }
                $('#incomeCount').text('মোট: ' + res.total + ' টি পেমেন্ট');
                const off = (res.page - 1) * res.pageSize;
                res.data.forEach(function (r) {
                    const st = PAY_STATUS[r.PayStatus] || { cls: 'badge-adv', label: r.PayStatus || '—' };
                    const due = parseFloat(r.DueAmount || 0);
                    $body.append('<tr>' +
                        '<td><b>' + r.OrderSerialNumber + '</b></td>' +
                        '<td>(' + (r.CustomerNumber||'') + ') ' + (r.CustomerName||'—') + '</td>' +
                        '<td>' + (r.Phone||'—') + '</td>' +
                        '<td>' + (r.OrderDate||'—') + '</td>' +
                        '<td>' + (r.DeliveryDate||'—') + '</td>' +
                        '<td>' + fmt(r.OrderAmount) + '</td>' +
                        '<td class="text-sm-muted">' + fmt(r.PrePaid) + '</td>' +
                        '<td class="amt-green">' + fmt(r.Amount) + '</td>' +
                        '<td class="text-sm-muted">' + fmt(r.Discount) + '</td>' +
                        '<td class="' + (due > 0 ? 'amt-red' : '') + '">' + fmt(due) + '</td>' +
                        '<td style="white-space:nowrap;">' + (r.PaidDate||'—') + '</td>' +
                        '<td><span class="' + st.cls + '">' + st.label + '</span></td>' +
                        '<td class="text-sm-muted">' + (r.Account||'—') + '</td>' +
                        '</tr>');
                });
                renderPager('incomePager', res.page, res.totalPages, window.loadIncome);
            });
    };

    // ─── Due ──────────────────────────────────────────────────────────────────
    window.loadDue = function (page) {
        $('#dueSpinner').show(); $('#dueContent').hide();
        $.get('/api/IncomeDueExpense/due', Object.assign({}, getParams(), { page: page || 1, pageSize: PAGE_SIZE }))
            .done(function (res) {
                $('#dueSpinner').hide(); $('#dueContent').show();
                dueLoaded = true;
                const $body = $('#dueBody').empty();
                if (!res.success || !res.data || !res.data.length) {
                    $body.append('<tr><td colspan="11" class="text-center py-4 text-muted">কোন বাকি নেই 🎉</td></tr>');
                    $('#dueCount').text(''); $('#duePager').empty(); return;
                }
                $('#dueCount').text('মোট: ' + res.total + ' টি অর্ডার বাকি');
                res.data.forEach(function (r) {
                    const st = DEL_STATUS[r.DeliveryStatus] || { cls: 'badge-due-status', label: r.DeliveryStatus || '—' };
                    $body.append('<tr>' +
                        '<td><b>' + r.OrderSerialNumber + '</b></td>' +
                        '<td>(' + (r.CustomerNumber||'') + ') ' + (r.CustomerName||'—') + '</td>' +
                        '<td>' + (r.Phone||'—') + '</td>' +
                        '<td style="max-width:160px;font-size:11px;">' + (r.Details||'—') + '</td>' +
                        '<td>' + (r.OrderDate||'—') + '</td>' +
                        '<td>' + (r.DeliveryDate||'—') + '</td>' +
                        '<td>' + fmt(r.OrderAmount) + '</td>' +
                        '<td class="amt-green">' + fmt(r.PaidAmount) + '</td>' +
                        '<td class="text-sm-muted">' + fmt(r.Discount) + '</td>' +
                        '<td class="amt-red">' + fmt(r.DueAmount) + '</td>' +
                        '<td><span class="' + st.cls + '">' + st.label + '</span></td>' +
                        '</tr>');
                });
                renderPager('duePager', res.page, res.totalPages, window.loadDue);
            });
    };

    // ─── Expense ──────────────────────────────────────────────────────────────
    window.loadExpense = function (page) {
        $('#expenseSpinner').show(); $('#expenseContent').hide(); $('#catChips').empty();
        const catId = $('#categorySelect').val() || null;
        const params = Object.assign({}, getParams(), { page: page || 1, pageSize: PAGE_SIZE });
        if (catId) params.categoryId = catId;

        $.get('/api/IncomeDueExpense/expense', params).done(function (res) {
            $('#expenseSpinner').hide(); $('#expenseContent').show();
            expenseLoaded = true;
            const $body = $('#expenseBody').empty();

            // category chips
            if (res.categoryTotals && res.categoryTotals.length) {
                res.categoryTotals.forEach(function (c) {
                    $('#catChips').append(
                        '<div class="cat-chip">' + c.CategoryName +
                        '<span>' + fmt(c.Total) + '</span></div>');
                });
            }

            if (!res.success || !res.data || !res.data.length) {
                $body.append('<tr><td colspan="5" class="text-center py-4 text-muted">কোন রেকর্ড নেই</td></tr>');
                $('#expenseCount').text(''); $('#expensePager').empty(); return;
            }
            $('#expenseCount').text('মোট: ' + res.total + ' টি খরচ');
            res.data.forEach(function (r) {
                $body.append('<tr>' +
                    '<td><span class="badge-adv">' + (r.CategoryName||'—') + '</span></td>' +
                    '<td>' + (r.ExpenseFor||'—') + '</td>' +
                    '<td class="amt-orange">' + fmt(r.Amount) + '</td>' +
                    '<td>' + (r.ExpenseDate||'—') + '</td>' +
                    '<td class="text-sm-muted">' + (r.Account||'—') + '</td>' +
                    '</tr>');
            });
            renderPager('expensePager', res.page, res.totalPages, window.loadExpense);
        });
    };

    // ─── Pager ────────────────────────────────────────────────────────────────
    function renderPager(wrapperId, page, totalPages, loadFn) {
        const $w = $('#' + wrapperId).empty();
        if (totalPages <= 1) return;
        const $p = $('<div class="pager">');
        const btn = function (label, pg, disabled, active) {
            return $('<button>').html(label).prop('disabled', !!disabled)
                .addClass(active ? 'active' : '')
                .on('click', function () { loadFn(pg); });
        };
        $p.append(btn('&laquo;', 1,          page <= 1));
        $p.append(btn('&lsaquo;', page - 1,  page <= 1));
        const start = Math.max(1, page - 2), end = Math.min(totalPages, start + 4);
        for (let i = start; i <= end; i++) $p.append(btn(i, i, false, i === page));
        $p.append(btn('&rsaquo;', page + 1,  page >= totalPages));
        $p.append(btn('&raquo;', totalPages, page >= totalPages));
        $p.append('<span class="pager-info">পেজ ' + page + ' / ' + totalPages + '</span>');
        $w.append($p);
    }

}());
