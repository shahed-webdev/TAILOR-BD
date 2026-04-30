// item-sell-report.js
(function () {
    'use strict';

    let institutionId;
    let currentLang = 'bn';

    const T = {
        en: {
            totalSalesAmt:  'Total Sales Amount',
            totalPaid:      'Total Paid',
            totalDue:       'Total Due',
            totalDiscount:  'Total Discount',
            totalQty:       'Total Quantity',
            totalSales:     'Total Sales',
            totalCustomers: 'Total Customers',
            netSales:       'Net Sales (After Return)',
            noData:         'No data available',
            allTime:        'All time report',
            to:             'to',
            returnValue:    'Total Return Value',
            returnQty:      'Total Return Qty',
            valueRatio:     'Value Ratio',
            qtyRatio:       'Qty Ratio',
            returnFrom:     'Returns from',
            orders:         'orders',
            sale:           'sale',
        },
        bn: {
            totalSalesAmt:  'মোট বিক্রয়ের পরিমান',
            totalPaid:      'মোট পরিশোধিত',
            totalDue:       'মোট বাকি',
            totalDiscount:  'মোট ছাড়',
            totalQty:       'মোট পরিমান (বিক্রয়)',
            totalSales:     'মোট বিক্রয়',
            totalCustomers: 'কাস্টমার সংখ্যা',
            netSales:       'নেট বিক্রয় (ফেরত বাদে)',
            noData:         'কোনো ডেটা নেই',
            allTime:        'সকল সময়ের রিপোর্ট',
            to:             'থেকে',
            returnValue:    'মোট ফেরতের মূল্য',
            returnQty:      'মোট ফেরতের পরিমান',
            valueRatio:     'মূল্যের অনুপাত',
            qtyRatio:       'পরিমানের অনুপাত',
            returnFrom:     'মোট',
            orders:         'টি বিক্রয় থেকে ফেরত',
            sale:           'বিক্রয়',
        }
    };

    function t(key) { return (T[currentLang] || T['bn'])[key] || key; }

    $(document).ready(function () {
        institutionId = parseInt(sessionStorage.getItem('institutionId') || '0');
        if (!institutionId) {
            setTimeout(function () {
                institutionId = parseInt(sessionStorage.getItem('institutionId') || '0');
                if (institutionId) { setThisMonth(); loadReport(); }
            }, 1500);
            return;
        }

        currentLang = localStorage.getItem('preferredLanguage') || 'bn';

        $(document).on('languageChanged', function (e, lang) {
            currentLang = lang || 'bn';
            if (window._lastSellReportData) {
                var d = window._lastSellReportData;
                renderKPI(d.summary, d.returnSummary);
                renderReturnSummary(d.returnSummary, d.summary);
            }
        });

        setThisMonth();
        loadReport();
    });

    // ─── Date Helpers ──────────────────────────────────────────────────────────
    window.setThisMonth = function () {
        var now   = new Date();
        var first = new Date(now.getFullYear(), now.getMonth(), 1);
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
        institutionId = parseInt(sessionStorage.getItem('institutionId') || institutionId || '0');
        if (!institutionId) return;

        var from = $('#fFrom').val();
        var to   = $('#fTo').val();
        currentLang = localStorage.getItem('preferredLanguage') || 'bn';

        if (from || to) {
            $('#dateRangeLabel').text((from || '—') + '  ' + t('to') + '  ' + (to || '—'));
        } else {
            $('#dateRangeLabel').text(t('allTime'));
        }

        $('#spinWrap').show();
        $('#reportContent').hide();

        var url = '/api/ItemSell/report?institutionId=' + institutionId +
                  (from ? '&dateFrom=' + from : '') +
                  (to   ? '&dateTo='   + to   : '');

        $.get(url, function (res) {
            if (!res.success) { $('#spinWrap').hide(); return; }
            window._lastSellReportData = res;
            renderKPI(res.summary, res.returnSummary);
            renderBarChart(res.monthlyTrend);
            renderReturnSummary(res.returnSummary, res.summary);
            renderTopItems(res.topItems);
            renderTopCustomers(res.topCustomers);
            renderReturnItems(res.returnItems);
            $('#spinWrap').hide();
            $('#reportContent').show();
        }).fail(function () { $('#spinWrap').hide(); });
    };

    // ─── KPI Cards ─────────────────────────────────────────────────────────────
    function renderKPI(s, r) {
        var netAmount = parseFloat(s.TotalAmount) - parseFloat(r.TotalReturnPrice || 0);
        var kpis = [
            { val: fmt(s.TotalAmount),      pre: '৳', key: 'totalSalesAmt',  cls: 'blue',   icon: 'fa-shopping-bag',       card: '' },
            { val: fmt(s.TotalPaid),        pre: '৳', key: 'totalPaid',      cls: 'green',  icon: 'fa-check-circle',       card: 'green' },
            { val: fmt(s.TotalDue),         pre: '৳', key: 'totalDue',       cls: 'red',    icon: 'fa-exclamation-circle', card: 'red' },
            { val: fmt(s.TotalDiscount),    pre: '৳', key: 'totalDiscount',  cls: 'orange', icon: 'fa-tag',                card: 'orange' },
            { val: fmtQ(s.TotalQuantity),   pre: '',  key: 'totalQty',       cls: 'teal',   icon: 'fa-layer-group',        card: 'teal' },
            { val: s.TotalSales,            pre: '',  key: 'totalSales',     cls: 'blue',   icon: 'fa-receipt',            card: '' },
            { val: s.TotalCustomers,        pre: '',  key: 'totalCustomers', cls: 'purple', icon: 'fa-users',              card: 'purple' },
            { val: fmt(netAmount),          pre: '৳', key: 'netSales',       cls: 'teal',   icon: 'fa-balance-scale',      card: 'teal' },
        ];

        var $g = $('#kpiGrid').empty();
        kpis.forEach(function (k) {
            $g.append(
                '<div class="kpi-card ' + k.card + '">' +
                '<i class="fas ' + k.icon + ' kpi-icon"></i>' +
                '<div class="kpi-val ' + k.cls + '">' + k.pre + k.val + '</div>' +
                '<div class="kpi-lbl">' + t(k.key) + '</div>' +
                '</div>');
        });
    }

    // ─── Bar Chart ─────────────────────────────────────────────────────────────
    function renderBarChart(data) {
        var $wrap = $('#barChartWrap').empty();

        if (!data || !data.length) {
            $wrap.html('<div style="text-align:center;color:#bbb;padding:40px 0;font-size:13px;"><i class="fas fa-chart-bar fa-2x mb-2" style="display:block;"></i>' + t('noData') + '</div>');
            return;
        }

        var filled = fillMissingMonths(data);
        var maxAmt = Math.max.apply(null, filled.map(function (d) { return d.Amount; }));

        var html = '<div class="trend-chart"><div class="trend-grid">';
        filled.forEach(function (d) {
            var pct    = maxAmt > 0 ? Math.max((d.Amount / maxAmt) * 100, d.Amount > 0 ? 3 : 0) : 0;
            var monLbl = formatMonth(d.Month);
            var amtLbl = fmtShort(d.Amount);
            var color  = d.Amount > 0 ? '#28a745' : '#e8f8ee';
            html += '<div class="trend-col" title="৳' + fmt(d.Amount) + ' — ' + d.Orders + ' ' + t('sale') + '">' +
                    '<div class="trend-amt">' + (d.Amount > 0 ? amtLbl : '') + '</div>' +
                    '<div class="trend-bar-wrap"><div class="trend-bar" style="height:' + pct + '%;background:' + color + ';"></div></div>' +
                    '<div class="trend-mon">' + monLbl + '</div>' +
                    '<div class="trend-orders">' + (d.Orders > 0 ? d.Orders : '') + '</div>' +
                    '</div>';
        });
        html += '</div></div>';
        $wrap.html(html);
    }

    function fillMissingMonths(data) {
        var map = {};
        data.forEach(function (d) { map[d.Month] = d; });
        var result = [];
        var now = new Date();
        for (var i = 11; i >= 0; i--) {
            var d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
            var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
            result.push(map[key] || { Month: key, Orders: 0, Amount: 0 });
        }
        return result;
    }

    function formatMonth(ym) {
        if (!ym) return '';
        var parts  = ym.split('-');
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        var m = parseInt(parts[1]) - 1;
        return months[m] + "<br><small style='color:#aaa;'>" + parts[0].substring(2) + '</small>';
    }

    // ─── Return Summary ────────────────────────────────────────────────────────
    function renderReturnSummary(r, s) {
        var retPct = parseFloat(s.TotalAmount) > 0
            ? ((parseFloat(r.TotalReturnPrice || 0) / parseFloat(s.TotalAmount)) * 100).toFixed(1) : 0;
        var qtyPct = parseFloat(s.TotalQuantity) > 0
            ? ((parseFloat(r.TotalReturnQty || 0) / parseFloat(s.TotalQuantity)) * 100).toFixed(1) : 0;

        $('#returnSummaryBox').html(
            '<div class="row g-2 mb-3">' +
            '<div class="col-6"><div style="background:#fff5f5;border-radius:8px;padding:12px;text-align:center;">' +
            '<div style="font-size:18px;font-weight:800;color:#e74c3c;">৳' + fmt(r.TotalReturnPrice || 0) + '</div>' +
            '<div style="font-size:11px;color:#888;">' + t('returnValue') + '</div></div></div>' +
            '<div class="col-6"><div style="background:#fff5f5;border-radius:8px;padding:12px;text-align:center;">' +
            '<div style="font-size:18px;font-weight:800;color:#e74c3c;">' + fmtQ(r.TotalReturnQty || 0) + '</div>' +
            '<div style="font-size:11px;color:#888;">' + t('returnQty') + '</div></div></div>' +
            '</div>' +
            '<div class="mb-3"><div class="d-flex justify-content-between mb-1" style="font-size:12px;"><span>' + t('valueRatio') + '</span><strong style="color:#e74c3c;">' + retPct + '%</strong></div>' +
            '<div class="prog-wrap"><div class="prog-bar" style="width:' + Math.min(retPct, 100) + '%;background:#e74c3c;"></div></div></div>' +
            '<div class="mb-3"><div class="d-flex justify-content-between mb-1" style="font-size:12px;"><span>' + t('qtyRatio') + '</span><strong style="color:#fd7e14;">' + qtyPct + '%</strong></div>' +
            '<div class="prog-wrap"><div class="prog-bar" style="width:' + Math.min(qtyPct, 100) + '%;background:#fd7e14;"></div></div></div>' +
            '<div style="font-size:12px;color:#888;"><i class="fas fa-shopping-bag me-1" style="color:#e74c3c;"></i>' +
            t('returnFrom') + ' ' + (r.TotalReturnOrders || 0) + ' ' + t('orders') + '</div>');
    }

    // ─── Top Items ─────────────────────────────────────────────────────────────
    function renderTopItems(items) {
        var $b = $('#topItemsBody').empty();
        if (!items || !items.length) {
            $b.append('<tr><td colspan="7" style="text-align:center;color:#bbb;padding:20px;">' + t('noData') + '</td></tr>');
            return;
        }
        var maxQty = Math.max.apply(null, items.map(function (x) { return parseFloat(x.TotalQty); }));
        items.forEach(function (item, i) {
            var rankCls  = i === 0 ? 'g1' : i === 1 ? 'g2' : i === 2 ? 'g3' : '';
            var pct      = maxQty > 0 ? (parseFloat(item.TotalQty) / maxQty * 100).toFixed(0) : 0;
            var stock    = parseFloat(item.CurrentStock);
            var stockCls = stock <= 0 ? 'color:#dc3545;font-weight:700;'
                         : stock < 10 ? 'color:#fd7e14;font-weight:700;'
                         : 'color:#28a745;font-weight:700;';
            $b.append(
                '<tr>' +
                '<td><span class="rank-badge ' + rankCls + '">' + (i + 1) + '</span></td>' +
                '<td style="font-weight:700;color:#fd7e14;">' + esc(item.ItemCode) + '</td>' +
                '<td style="text-align:left;">' + esc(item.ItemName) +
                '<div class="prog-wrap mt-1"><div class="prog-bar" style="width:' + pct + '%;background:#fd7e14;"></div></div></td>' +
                '<td><strong>' + fmtQ(item.TotalQty) + '</strong> <small style="color:#aaa;">' + esc(item.UnitName || '') + '</small></td>' +
                '<td>৳' + fmt(item.AvgUnitPrice) + '</td>' +
                '<td style="font-weight:700;">৳' + fmt(item.TotalPrice) + '</td>' +
                '<td style="' + stockCls + '">' + fmtQ(item.CurrentStock) + '</td>' +
                '</tr>');
        });
    }

    // ─── Top Customers ─────────────────────────────────────────────────────────
    function renderTopCustomers(customers) {
        var $b = $('#topCustomersBody').empty();
        if (!customers || !customers.length) {
            $b.append('<tr><td colspan="5" style="text-align:center;color:#bbb;padding:20px;">' + t('noData') + '</td></tr>');
            return;
        }
        var maxAmt = Math.max.apply(null, customers.map(function (x) { return parseFloat(x.TotalAmount); }));
        customers.forEach(function (c, i) {
            var rankCls = i === 0 ? 'g1' : i === 1 ? 'g2' : i === 2 ? 'g3' : '';
            var pct     = maxAmt > 0 ? (parseFloat(c.TotalAmount) / maxAmt * 100).toFixed(0) : 0;
            $b.append(
                '<tr>' +
                '<td><span class="rank-badge ' + rankCls + '">' + (i + 1) + '</span></td>' +
                '<td style="text-align:left;"><div style="font-weight:700;">' + esc(c.CustomerName) + '</div>' +
                '<div style="font-size:11px;color:#888;">' + esc(c.Phone || '') + '</div>' +
                '<div class="prog-wrap mt-1"><div class="prog-bar" style="width:' + pct + '%;background:#9b59b6;"></div></div></td>' +
                '<td><strong>' + c.TotalOrders + '</strong></td>' +
                '<td style="font-weight:700;">৳' + fmt(c.TotalAmount) + '</td>' +
                '<td style="font-weight:700;color:' + (parseFloat(c.TotalDue) > 0 ? '#dc3545' : '#28a745') + ';">৳' + fmt(c.TotalDue) + '</td>' +
                '</tr>');
        });
    }

    // ─── Return Items ──────────────────────────────────────────────────────────
    function renderReturnItems(items) {
        if (!items || !items.length) { $('#returnItemsSec').hide(); return; }
        $('#returnItemsSec').show();
        var maxQty = Math.max.apply(null, items.map(function (x) { return parseFloat(x.TotalReturnQty); }));
        var html = '<div class="row g-2">';
        items.forEach(function (item) {
            var pct = maxQty > 0 ? (parseFloat(item.TotalReturnQty) / maxQty * 100).toFixed(0) : 0;
            html += '<div class="col-md-6">' +
                    '<div style="background:#fff5f5;border-radius:8px;padding:10px 14px;">' +
                    '<div class="d-flex justify-content-between align-items-center mb-1">' +
                    '<div><span style="font-weight:700;color:#e74c3c;">' + esc(item.ItemCode) + '</span>' +
                    '<span class="ms-2" style="font-size:12px;color:#666;">' + esc(item.ItemName) + '</span></div>' +
                    '<strong style="color:#e74c3c;">' + fmtQ(item.TotalReturnQty) + ' ' + esc(item.UnitName || '') + '</strong></div>' +
                    '<div class="prog-wrap"><div class="prog-bar" style="width:' + pct + '%;background:#e74c3c;"></div></div>' +
                    '</div></div>';
        });
        html += '</div>';
        $('#returnItemsBody').html(html);
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────
    function fmt(n)      { return parseFloat(n || 0).toLocaleString('en-BD', { minimumFractionDigits:2, maximumFractionDigits:2 }); }
    function fmtQ(n)     { return parseFloat(n || 0).toLocaleString('en-BD', { minimumFractionDigits:2, maximumFractionDigits:2 }); }
    function fmtShort(n) { var v = parseFloat(n||0); return v>=100000?(v/100000).toFixed(1)+'L':v>=1000?(v/1000).toFixed(1)+'K':v.toFixed(0); }
    function esc(s)      { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
})();
দ