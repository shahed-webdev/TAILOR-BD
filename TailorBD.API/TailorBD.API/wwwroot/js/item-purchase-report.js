// item-purchase-report.js
(function () {
    'use strict';

    let institutionId;
    let currentLang = 'bn';

    const T = {
        en: {
            totalPurchaseAmt:  'Total Purchase Amount',
            totalPaid:         'Total Paid',
            totalDue:          'Total Due',
            totalDiscount:     'Total Discount',
            totalQty:          'Total Quantity',
            totalOrders:       'Total Orders',
            totalSuppliers:    'Total Suppliers',
            netPurchase:       'Net Purchase (After Return)',
            noData:            'No data available',
            allTime:           'All time report',
            to:                'to',
            returnValue:       'Total Return Value',
            returnQty:         'Total Return Qty',
            valueRatio:        'Value Ratio',
            qtyRatio:          'Qty Ratio',
            returnFrom:        'Returns from',
            orders:            'orders',
            purchase:          'purchase',
        },
        bn: {
            totalPurchaseAmt:  'মোট ক্রয়ের পরিমান',
            totalPaid:         'মোট পরিশোধিত',
            totalDue:          'মোট বাকি',
            totalDiscount:     'মোট ছাড়',
            totalQty:          'মোট পরিমান (ক্রয়)',
            totalOrders:       'মোট ক্রয়',
            totalSuppliers:    'সাপ্লায়ার সংখ্যা',
            netPurchase:       'নেট ক্রয় (ফেরত বাদে)',
            noData:            'কোনো ডেটা নেই',
            allTime:           'সকল সময়ের রিপোর্ট',
            to:                'থেকে',
            returnValue:       'মোট ফেরতের মূল্য',
            returnQty:         'মোট ফেরতের পরিমান',
            valueRatio:        'মূল্যের অনুপাত',
            qtyRatio:          'পরিমানের অনুপাত',
            returnFrom:        'মোট',
            orders:            'টি ক্রয় থেকে ফেরত',
            purchase:          'ক্রয়',
        }
    };

    function t(key) { return (T[currentLang] || T['bn'])[key] || key; }

    $(document).ready(function () {
        institutionId = parseInt(sessionStorage.getItem('institutionId') || '0');
        if (!institutionId) return;

        // sync with app-components language key
        currentLang = localStorage.getItem('preferredLanguage') || 'bn';

        // listen for jQuery language change event from app-components.js
        $(document).on('languageChanged', function (e, lang) {
            currentLang = lang || 'bn';
            if (window._lastReportData) {
                const d = window._lastReportData;
                renderKPI(d.summary, d.returnSummary);
                renderReturnSummary(d.returnSummary, d.summary);
            }
        });

        setThisMonth();
        loadReport();
    });

    // ─── Date Helpers ──────────────────────────────────────────────────────────
    window.setThisMonth = function () {
        const now   = new Date();
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        $('#fFrom').val(first.toISOString().split('T')[0]);
        $('#fTo').val(now.toISOString().split('T')[0]);
        loadReport();
    };

    window.clearDates = function () {
        $('#fFrom').val('');
        $('#fTo').val('');
        loadReport();
    };

    // ─── Load Report ───────────────────────────────────────────────────────────
    window.loadReport = function () {
        const from = $('#fFrom').val();
        const to   = $('#fTo').val();
        currentLang = localStorage.getItem('preferredLanguage') || 'bn';

        if (from || to) {
            $('#dateRangeLabel').text((from || '—') + '  ' + t('to') + '  ' + (to || '—'));
        } else {
            $('#dateRangeLabel').text(t('allTime'));
        }

        $('#spinWrap').show();
        $('#reportContent').hide();

        const url = `/api/ItemPurchase/report?institutionId=${institutionId}` +
                    (from ? `&dateFrom=${from}` : '') +
                    (to   ? `&dateTo=${to}`     : '');

        $.get(url, function (res) {
            if (!res.success) { $('#spinWrap').hide(); return; }
            window._lastReportData = res;
            renderKPI(res.summary, res.returnSummary);
            renderBarChart(res.monthlyTrend);
            renderReturnSummary(res.returnSummary, res.summary);
            renderTopItems(res.topItems);
            renderTopSuppliers(res.topSuppliers);
            renderReturnItems(res.returnItems);
            $('#spinWrap').hide();
            $('#reportContent').show();
        }).fail(function () { $('#spinWrap').hide(); });
    };

    // ─── KPI Cards ─────────────────────────────────────────────────────────────
    function renderKPI(s, r) {
        const netAmount = parseFloat(s.TotalAmount) - parseFloat(r.TotalReturnPrice || 0);
        const kpis = [
            { val: fmt(s.TotalAmount),      pre: '৳', key: 'totalPurchaseAmt', cls: 'blue',   icon: 'fa-shopping-cart',      card: '' },
            { val: fmt(s.TotalPaid),        pre: '৳', key: 'totalPaid',        cls: 'green',  icon: 'fa-check-circle',       card: 'green' },
            { val: fmt(s.TotalDue),         pre: '৳', key: 'totalDue',         cls: 'red',    icon: 'fa-exclamation-circle', card: 'red' },
            { val: fmt(s.TotalDiscount),    pre: '৳', key: 'totalDiscount',    cls: 'orange', icon: 'fa-tag',                card: 'orange' },
            { val: fmtQty(s.TotalQuantity), pre: '',  key: 'totalQty',         cls: 'teal',   icon: 'fa-layer-group',        card: 'teal' },
            { val: s.TotalPurchases,        pre: '',  key: 'totalOrders',      cls: 'blue',   icon: 'fa-receipt',            card: '' },
            { val: s.TotalSuppliers,        pre: '',  key: 'totalSuppliers',   cls: 'purple', icon: 'fa-truck',              card: 'purple' },
            { val: fmt(netAmount),          pre: '৳', key: 'netPurchase',      cls: 'teal',   icon: 'fa-balance-scale',      card: 'teal' },
        ];

        const $g = $('#kpiGrid').empty();
        kpis.forEach(function (k) {
            $g.append(`
            <div class="kpi-card ${k.card}">
                <i class="fas ${k.icon} kpi-icon"></i>
                <div class="kpi-val ${k.cls}">${k.pre}${k.val}</div>
                <div class="kpi-lbl">${t(k.key)}</div>
            </div>`);
        });
    }

    // ─── Bar Chart ─────────────────────────────────────────────────────────────
    function renderBarChart(data) {
        const $wrap = $('#barChartWrap');
        $wrap.empty();

        if (!data || !data.length) {
            $wrap.html(`<div style="text-align:center;color:#bbb;padding:40px 0;font-size:13px;">
                <i class="fas fa-chart-bar fa-2x mb-2" style="display:block;"></i>${t('noData')}</div>`);
            return;
        }

        // Fill missing months with 0
        const filled = fillMissingMonths(data);
        const maxAmt = Math.max.apply(null, filled.map(function (d) { return d.Amount; }));

        // SVG-style table chart — clear, readable
        let html = '<div class="trend-chart">';

        // Y-axis labels + bars
        html += '<div class="trend-grid">';
        filled.forEach(function (d) {
            const pct    = maxAmt > 0 ? Math.max((d.Amount / maxAmt) * 100, d.Amount > 0 ? 3 : 0) : 0;
            const monLbl = formatMonth(d.Month);
            const amtLbl = fmtShort(d.Amount);
            const color  = d.Amount > 0 ? '#6c7ae0' : '#e8eaf6';
            html += `
            <div class="trend-col" title="৳${fmt(d.Amount)} — ${d.Orders} ${t('purchase')}">
                <div class="trend-amt">${d.Amount > 0 ? amtLbl : ''}</div>
                <div class="trend-bar-wrap">
                    <div class="trend-bar" style="height:${pct}%;background:${color};"></div>
                </div>
                <div class="trend-mon">${monLbl}</div>
                <div class="trend-orders">${d.Orders > 0 ? d.Orders : ''}</div>
            </div>`;
        });
        html += '</div></div>';
        $wrap.html(html);
    }

    // Fill all 12 months even if no data
    function fillMissingMonths(data) {
        const map = {};
        data.forEach(function (d) { map[d.Month] = d; });

        const result = [];
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
            const d    = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key  = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
            result.push(map[key] || { Month: key, Orders: 0, Amount: 0 });
        }
        return result;
    }

    function formatMonth(ym) {
        if (!ym) return '';
        const parts = ym.split('-');
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const m = parseInt(parts[1]) - 1;
        return months[m] + "<br><small style='color:#aaa;'>" + parts[0].substring(2) + '</small>';
    }

    // ─── Return Summary ────────────────────────────────────────────────────────
    function renderReturnSummary(r, s) {
        const retPct = parseFloat(s.TotalAmount) > 0
            ? ((parseFloat(r.TotalReturnPrice || 0) / parseFloat(s.TotalAmount)) * 100).toFixed(1)
            : 0;
        const qtyPct = parseFloat(s.TotalQuantity) > 0
            ? ((parseFloat(r.TotalReturnQty || 0) / parseFloat(s.TotalQuantity)) * 100).toFixed(1)
            : 0;

        $('#returnSummaryBox').html(`
            <div class="row g-2 mb-3">
                <div class="col-6">
                    <div style="background:#fff5f5;border-radius:8px;padding:12px;text-align:center;">
                        <div style="font-size:18px;font-weight:800;color:#e74c3c;">৳${fmt(r.TotalReturnPrice || 0)}</div>
                        <div style="font-size:11px;color:#888;">${t('returnValue')}</div>
                    </div>
                </div>
                <div class="col-6">
                    <div style="background:#fff5f5;border-radius:8px;padding:12px;text-align:center;">
                        <div style="font-size:18px;font-weight:800;color:#e74c3c;">${fmtQty(r.TotalReturnQty || 0)}</div>
                        <div style="font-size:11px;color:#888;">${t('returnQty')}</div>
                    </div>
                </div>
            </div>
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-1" style="font-size:12px;">
                    <span>${t('valueRatio')}</span>
                    <strong style="color:#e74c3c;">${retPct}%</strong>
                </div>
                <div class="prog-wrap"><div class="prog-bar" style="width:${Math.min(retPct,100)}%;background:#e74c3c;"></div></div>
            </div>
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-1" style="font-size:12px;">
                    <span>${t('qtyRatio')}</span>
                    <strong style="color:#fd7e14;">${qtyPct}%</strong>
                </div>
                <div class="prog-wrap"><div class="prog-bar" style="width:${Math.min(qtyPct,100)}%;background:#fd7e14;"></div></div>
            </div>
            <div style="font-size:12px;color:#888;">
                <i class="fas fa-shopping-basket me-1" style="color:#e74c3c;"></i>
                ${t('returnFrom')} ${r.TotalReturnOrders || 0} ${t('orders')}
            </div>`);
    }

    // ─── Top Items ─────────────────────────────────────────────────────────────
    function renderTopItems(items) {
        const $b = $('#topItemsBody').empty();
        if (!items || !items.length) {
            $b.append(`<tr><td colspan="7" style="text-align:center;color:#bbb;padding:20px;">${t('noData')}</td></tr>`);
            return;
        }
        const maxQty = Math.max.apply(null, items.map(function (x) { return parseFloat(x.TotalQty); }));
        items.forEach(function (item, i) {
            const rankCls  = i === 0 ? 'g1' : i === 1 ? 'g2' : i === 2 ? 'g3' : '';
            const pct      = maxQty > 0 ? (parseFloat(item.TotalQty) / maxQty * 100).toFixed(0) : 0;
            const stockVal = parseFloat(item.CurrentStock);
            const stockCls = stockVal <= 0 ? 'color:#dc3545;font-weight:700;'
                           : stockVal < 10  ? 'color:#fd7e14;font-weight:700;'
                           : 'color:#28a745;font-weight:700;';
            $b.append(`
            <tr>
                <td><span class="rank-badge ${rankCls}">${i + 1}</span></td>
                <td style="font-weight:700;color:#fd7e14;">${esc(item.ItemCode)}</td>
                <td style="text-align:left;">
                    ${esc(item.ItemName)}
                    <div class="prog-wrap mt-1"><div class="prog-bar" style="width:${pct}%;background:#fd7e14;"></div></div>
                </td>
                <td><strong>${fmtQty(item.TotalQty)}</strong> <small style="color:#aaa;">${esc(item.UnitName || '')}</small></td>
                <td>৳${fmt(item.AvgUnitPrice)}</td>
                <td style="font-weight:700;">৳${fmt(item.TotalPrice)}</td>
                <td style="${stockCls}">${fmtQty(item.CurrentStock)}</td>
            </tr>`);
        });
    }

    // ─── Top Suppliers ─────────────────────────────────────────────────────────
    function renderTopSuppliers(suppliers) {
        const $b = $('#topSuppliersBody').empty();
        if (!suppliers || !suppliers.length) {
            $b.append(`<tr><td colspan="5" style="text-align:center;color:#bbb;padding:20px;">${t('noData')}</td></tr>`);
            return;
        }
        const maxAmt = Math.max.apply(null, suppliers.map(function (x) { return parseFloat(x.TotalAmount); }));
        suppliers.forEach(function (s, i) {
            const rankCls = i === 0 ? 'g1' : i === 1 ? 'g2' : i === 2 ? 'g3' : '';
            const pct     = maxAmt > 0 ? (parseFloat(s.TotalAmount) / maxAmt * 100).toFixed(0) : 0;
            $b.append(`
            <tr>
                <td><span class="rank-badge ${rankCls}">${i + 1}</span></td>
                <td style="text-align:left;">
                    <div style="font-weight:700;">${esc(s.SupplierName)}</div>
                    <div style="font-size:11px;color:#888;">${esc(s.SupplierPhone || '')}</div>
                    <div class="prog-wrap mt-1"><div class="prog-bar" style="width:${pct}%;background:#20c997;"></div></div>
                </td>
                <td><strong>${s.TotalOrders}</strong></td>
                <td style="font-weight:700;">৳${fmt(s.TotalAmount)}</td>
                <td style="font-weight:700;color:${parseFloat(s.TotalDue) > 0 ? '#dc3545' : '#28a745'};">
                    ৳${fmt(s.TotalDue)}
                </td>
            </tr>`);
        });
    }

    // ─── Return Items ──────────────────────────────────────────────────────────
    function renderReturnItems(items) {
        if (!items || !items.length) { $('#returnItemsSec').hide(); return; }
        $('#returnItemsSec').show();
        const maxQty = Math.max.apply(null, items.map(function (x) { return parseFloat(x.TotalReturnQty); }));
        let html = '<div class="row g-2">';
        items.forEach(function (item) {
            const pct = maxQty > 0 ? (parseFloat(item.TotalReturnQty) / maxQty * 100).toFixed(0) : 0;
            html += `
            <div class="col-md-6">
                <div style="background:#fff5f5;border-radius:8px;padding:10px 14px;">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <div>
                            <span style="font-weight:700;color:#e74c3c;">${esc(item.ItemCode)}</span>
                            <span class="ms-2" style="font-size:12px;color:#666;">${esc(item.ItemName)}</span>
                        </div>
                        <strong style="color:#e74c3c;">${fmtQty(item.TotalReturnQty)} ${esc(item.UnitName || '')}</strong>
                    </div>
                    <div class="prog-wrap"><div class="prog-bar" style="width:${pct}%;background:#e74c3c;"></div></div>
                </div>
            </div>`;
        });
        html += '</div>';
        $('#returnItemsBody').html(html);
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────
    function fmt(n)     { return parseFloat(n || 0).toLocaleString('en-BD', { minimumFractionDigits:2, maximumFractionDigits:2 }); }
    function fmtQty(n)  { return parseFloat(n || 0).toLocaleString('en-BD', { minimumFractionDigits:2, maximumFractionDigits:2 }); }
    function fmtShort(n){ const v = parseFloat(n||0); return v>=100000?(v/100000).toFixed(1)+'L':v>=1000?(v/1000).toFixed(1)+'K':v.toFixed(0); }
    function esc(s)     { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
})();
