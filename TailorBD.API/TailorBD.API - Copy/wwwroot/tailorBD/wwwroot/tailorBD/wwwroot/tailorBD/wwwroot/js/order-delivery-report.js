/* order-delivery-report.js */
(function () {
    'use strict';

    let institutionId = 0;
    let currentPage   = 1;
    const PAGE_SIZE   = 50;
    let institutionInfo = null;

    const fmt  = v => '৳' + parseFloat(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtN = v => parseFloat(v || 0).toLocaleString('en-US');

    const STATUS_LABEL = {
        Delivered:        { cls: 'badge-d',   bn: 'ডেলিভারড' },
        Pending:          { cls: 'badge-p',   bn: 'পেন্ডিং'  },
        PartlyDelivered:  { cls: 'badge-prt', bn: 'আংশিক'    }
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

    // ─── Institution info ─────────────────────────────────────────────────────
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

    // ─── Date helpers ─────────────────────────────────────────────────────────
    window.setToday = function () {
        const d = new Date().toISOString().slice(0, 10);
        $('#dateFrom').val(d); $('#dateTo').val(d);
        loadReport();
    };
    window.setThisMonth = function () {
        const now = new Date();
        const y = now.getFullYear(), m = String(now.getMonth() + 1).padStart(2, '0');
        const last = new Date(y, now.getMonth() + 1, 0).getDate();
        $('#dateFrom').val(y + '-' + m + '-01');
        $('#dateTo').val(y + '-' + m + '-' + last);
        loadReport();
    };
    window.clearFilter = function () {
        $('#dateFrom').val(''); $('#dateTo').val('');
        loadReport();
    };

    // ─── Load Report ──────────────────────────────────────────────────────────
    window.loadReport = function (page) {
        currentPage = page || 1;
        const dateFrom = $('#dateFrom').val() || null;
        const dateTo   = $('#dateTo').val()   || null;

        const dl = (dateFrom && dateTo)
            ? (dateFrom === dateTo ? dateFrom : dateFrom + ' — ' + dateTo)
            : (dateFrom ? dateFrom + ' থেকে' : dateTo ? dateTo + ' পর্যন্ত' : 'সব সময়');
        $('#dateLabel').text(dl);
        $('#printDateRange').text(dl);

        $('#spinner').show(); $('#content').hide();

        const params = { institutionId };
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo)   params.dateTo   = dateTo;

        $.when(
            $.get('/api/OrderDeliveryReport/summary',        params),
            $.get('/api/OrderDeliveryReport/dress-breakdown', Object.assign({}, params, { type: 'order' })),
            $.get('/api/OrderDeliveryReport/dress-breakdown', Object.assign({}, params, { type: 'delivery' })),
            $.get('/api/OrderDeliveryReport/orders',          Object.assign({}, params, { page: currentPage, pageSize: PAGE_SIZE }))
        ).done(function (sR, odR, ddR, orR) {
            renderSummary(sR[0]);
            renderDressGrid('#orderDressGrid',    odR[0], false);
            renderDressGrid('#deliveryDressGrid', ddR[0], true);
            renderOrders(orR[0]);
            $('#spinner').hide(); $('#content').show();
        }).fail(function () {
            $('#spinner').hide(); $('#content').show();
        });
    };

    // ─── Summary ──────────────────────────────────────────────────────────────
    function renderSummary(res) {
        if (!res.success) return;
        const o = res.order   || {}, c = res.customer || {},
              d = res.delivery|| {}, pn = res.pending  || {};

        $('#sTotalOrders').text(fmtN(o.TotalOrders));
        $('#sDeliveredPending').text(
            '✅ ' + (o.DeliveredOrders || 0) + '  ⏳ ' + (o.PendingOrders || 0));

        $('#sTotalDresses').text(fmtN(o.TotalDresses));
        $('#sTotalAmount').text(fmt(o.TotalAmount));
        $('#sDiscount').text('ছাড়: ' + fmt(o.TotalDiscount));
        $('#sTotalPaid').text(fmt(o.TotalPaid));
        $('#sTotalDue').text(fmt(o.TotalDue));

        $('#sTotalDelivered').text(fmtN(d.TotalDelivered) + ' টি');
        $('#sDeliveryPayment').text('ডেলিভারি পেমেন্ট: ' + fmt(d.DeliveryPayment));

        $('#sNewCustomers').text(fmtN(c.NewCustomers));
        $('#sOldCustomers').text(fmtN(c.OldCustomers));
    }

    // ─── Dress Grid ───────────────────────────────────────────────────────────
    function renderDressGrid(selector, res, isDelivery) {
        const $g = $(selector).empty();
        if (!res.success || !res.data || !res.data.length) {
            $g.html('<span class="text-muted" style="font-size:13px;">কোন তথ্য নেই</span>');
            return;
        }
        res.data.forEach(function (r) {
            $g.append(
                '<div class="dress-chip' + (isDelivery ? ' delivery-chip' : '') + '">' +
                '<div class="d-name">' + r.DressName + '</div>' +
                '<div class="d-qty">'  + fmtN(r.Quantity) + '</div>' +
                '</div>'
            );
        });
    }

    // ─── Orders Table ─────────────────────────────────────────────────────────
    function renderOrders(res) {
        const $body = $('#orderBody').empty();
        if (!res.success || !res.data || !res.data.length) {
            $body.append('<tr><td colspan="10" class="text-center py-4 text-muted">কোন অর্ডার নেই</td></tr>');
            $('#orderCount').text('');
            $('#pagerWrap').empty();
            return;
        }

        $('#orderCount').text('পেজ ' + res.page + ' / ' + res.totalPages + ' (' + res.total + ' টি অর্ডার)');

        const offset = (res.page - 1) * res.pageSize;
        res.data.forEach(function (r, i) {
            const st = STATUS_LABEL[r.DeliveryStatus] || { cls: 'badge-p', bn: r.DeliveryStatus };
            const due = parseFloat(r.DueAmount || 0);

            $body.append('<tr>' +
                '<td><b>' + r.OrderSerialNumber + '</b></td>' +
                '<td>' + (r.CustomerName || '—') + '</td>' +
                '<td style="white-space:nowrap;">' + (r.Phone || '—') + '</td>' +
                '<td style="max-width:180px;font-size:11px;">' + (r.Details || '—') + '</td>' +
                '<td style="white-space:nowrap;">' + (r.OrderDate || '—') + '</td>' +
                '<td style="white-space:nowrap;">' + (r.ActualDeliveryDate || r.DeliveryDate || '—') + '</td>' +
                '<td style="white-space:nowrap;">' + fmt(r.OrderAmount) + '</td>' +
                '<td class="paid-amt">' + fmt(r.PaidAmount) + '</td>' +
                '<td class="' + (due > 0 ? 'due-amt' : '') + '">' + fmt(due) + '</td>' +
                '<td><span class="' + st.cls + '">' + st.bn + '</span></td>' +
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
            return $('<button>').html(label).prop('disabled', !!disabled)
                .addClass(active ? 'active' : '')
                .on('click', function () { window.loadReport(pg); });
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
