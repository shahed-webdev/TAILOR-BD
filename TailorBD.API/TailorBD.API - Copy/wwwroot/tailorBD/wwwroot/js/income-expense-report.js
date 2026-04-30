// income-expense-report.js
(function () {
    'use strict';

    let institutionId = 0;
    let currentLang = 'bn';

    const T = {
        en: {
            tailoringIncome : 'Tailoring Income',
            otherIncome     : 'Other Income',
            itemSellIncome  : 'Item Sell Income',
            totalIncome     : 'Total Income',
            totalExpense    : 'Expense',
            itemPurchase    : 'Item Purchase',
            totalExpenses   : 'Total Expenses',
            netProfit       : 'Net Profit',
            netLoss         : 'Net Loss',
            totalOrders     : 'Total Orders',
            delivered       : 'Delivered',
            newOrderAmt     : 'New Order Amount',
            preDue          : 'Opening Due',
            postDue         : 'Closing Due',
            discount        : 'Discount',
            allTime         : 'All time report',
            to              : 'to',
            noData          : 'No data available',
            records         : 'records',
            netBalance      : 'Net Balance (Income − Expense)',
        },
        bn: {
            tailoringIncome : 'সেলাইয়ের আয়',
            otherIncome     : 'অন্যান্য আয়',
            itemSellIncome  : 'আইটেম বিক্রয় আয়',
            totalIncome     : 'মোট আয়',
            totalExpense    : 'খরচ',
            itemPurchase    : 'আইটেম ক্রয়',
            totalExpenses   : 'মোট ব্যয়',
            netProfit       : 'নিট লাভ',
            netLoss         : 'নিট ক্ষতি',
            totalOrders     : 'মোট অর্ডার',
            delivered       : 'ডেলিভারিকৃত',
            newOrderAmt     : 'নতুন অর্ডারের পরিমান',
            preDue          : 'পূর্বের বাকী',
            postDue         : 'সর্বশেষ বাকী',
            discount        : 'ছাড়',
            allTime         : 'সকল সময়ের রিপোর্ট',
            to              : 'থেকে',
            noData          : 'কোনো তথ্য নেই',
            records         : 'টি রেকর্ড',
            netBalance      : 'নিট ব্যালেন্স (আয় − ব্যয়)',
        }
    };

    function t(key) { return (T[currentLang] || T.bn)[key] || key; }

    // ─── Init ───────────────────────────────────────────────────────────────────
    $(document).ready(function () {
        currentLang = localStorage.getItem('preferredLanguage') || 'bn';
        institutionId = parseInt(sessionStorage.getItem('institutionId') || '0');

        if (!institutionId) {
            $(document).on('app-session-ready', function () {
                institutionId = parseInt(sessionStorage.getItem('institutionId') || '0');
                if (institutionId) { clearDates(); }
            });
            return;
        }

        $(document).on('languageChanged', function (e, lang) {
            currentLang = lang || 'bn';
        });

        clearDates();
    });

    // ─── Date Helpers ──────────────────────────────────────────────────────────
    window.setToday = function () {
        var today = new Date().toISOString().split('T')[0];
        $('#fFrom').val(today);
        $('#fTo').val(today);
        loadReport();
    };

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

    window.switchTab = function (tabId, btn) {
        $('.tab-panel').removeClass('active');
        $('.rep-tab').removeClass('active');
        $('#' + tabId).addClass('active');
        $(btn).addClass('active');
    };

    // ─── Load All Data ─────────────────────────────────────────────────────────
    window.loadReport = function () {
        institutionId = parseInt(sessionStorage.getItem('institutionId') || institutionId || '0');
        if (!institutionId) return;

        currentLang = localStorage.getItem('preferredLanguage') || 'bn';

        var from = $('#fFrom').val();
        var to   = $('#fTo').val();

        updateDateLabel(from, to);

        $('#spinWrap').show();
        $('#reportContent').hide();

        var qs = '?institutionId=' + institutionId +
                 (from ? '&dateFrom=' + from : '') +
                 (to   ? '&dateTo='   + to   : '');

        var p1 = $.get('/api/IncomeExpenseReport/summary'         + qs);
        var p2 = $.get('/api/IncomeExpenseReport/income-details'  + qs);
        var p3 = $.get('/api/IncomeExpenseReport/expense-details' + qs);
        var p4 = $.get('/api/IncomeExpenseReport/monthly-trend?institutionId=' + institutionId);
        var p5 = $.get('/api/IncomeExpenseReport/accounts'        + qs);

        $.when(p1, p2, p3, p4, p5).done(function (r1, r2, r3, r4, r5) {
            var sum   = r1[0];
            var inc   = r2[0];
            var exp   = r3[0];
            var trend = r4[0];
            var acc   = r5[0];

            if (!sum.success) { showError(); return; }

            renderNetBanner(sum.data);
            renderKPI(sum.data);
            renderSummaryTab(sum.data);
            renderTrendChart(trend.data || []);
            renderIncomeTab(inc, sum.data);
            renderExpenseTab(exp);
            renderAccountsTab(acc);

            $('#spinWrap').hide();
            $('#reportContent').show();
        }).fail(function () { showError(); });
    };

    function showError() {
        $('#spinWrap').html('<div style="color:#dc3545;"><i class="fas fa-exclamation-circle fa-2x mb-2" style="display:block;"></i>' + t('noData') + '</div>');
    }

    function updateDateLabel(from, to) {
        if (from || to) {
            $('#dateRangeLabel').text((from || '—') + '  ' + t('to') + '  ' + (to || '—'));
        } else {
            $('#dateRangeLabel').text(t('allTime'));
        }
    }

    // ─── Net Banner ────────────────────────────────────────────────────────────
    function renderNetBanner(d) {
        var net   = parseFloat(d.netBalance || 0);
        var isPos = net >= 0;
        var $b    = $('#netBanner');
        $b.removeClass('profit loss').addClass(isPos ? 'profit' : 'loss');
        $b.find('.net-icon').removeClass('fa-balance-scale fa-exclamation-triangle')
            .addClass(isPos ? 'fa-balance-scale' : 'fa-exclamation-triangle');
        $('#netLabel').text(t('netBalance'));
        $('#netValue').text('৳' + fmt(Math.abs(net)) + (isPos ? '' : ' (' + t('netLoss') + ')'));
    }

    // ─── KPI Cards ─────────────────────────────────────────────────────────────
    function renderKPI(d) {
        var kpis = [
            { val: '৳' + fmt(d.totalIncome),      key: 'totalIncome',    cls: 'green',  card: 'green',  icon: 'fa-arrow-down'    },
            { val: '৳' + fmt(d.tailoringIncome),   key: 'tailoringIncome',cls: 'blue',   card: '',       icon: 'fa-cut'           },
            { val: '৳' + fmt(d.otherIncome),       key: 'otherIncome',    cls: 'teal',   card: 'teal',   icon: 'fa-plus-circle'   },
            { val: '৳' + fmt(d.itemSellIncome),    key: 'itemSellIncome', cls: 'purple', card: 'purple', icon: 'fa-store'         },
            { val: '৳' + fmt(d.totalExpenses),     key: 'totalExpenses',  cls: 'red',    card: 'red',    icon: 'fa-arrow-up'      },
            { val: '৳' + fmt(d.totalExpense),      key: 'totalExpense',   cls: 'orange', card: 'orange', icon: 'fa-wallet'        },
            { val: '৳' + fmt(d.itemPurchasePaid),  key: 'itemPurchase',   cls: 'dark',   card: 'dark',   icon: 'fa-shopping-bag'  },
            { val: '৳' + fmt(d.postDue),           key: 'postDue',        cls: 'orange', card: 'orange', icon: 'fa-clock'         },
        ];

        var $g = $('#kpiGrid').empty();
        kpis.forEach(function (k) {
            $g.append(
                '<div class="kpi-card ' + k.card + '">' +
                '<i class="fas ' + k.icon + ' kpi-icon"></i>' +
                '<div class="kpi-val ' + k.cls + '">' + k.val + '</div>' +
                '<div class="kpi-lbl">' + t(k.key) + '</div>' +
                '</div>');
        });
    }

    // ─── Summary Tab ───────────────────────────────────────────────────────────
    function renderSummaryTab(d) {
        // Income Summary
        var incRows = [
            { lbl: t('tailoringIncome'), val: d.tailoringIncome, color: '#28a745' },
            { lbl: t('otherIncome'),     val: d.otherIncome,     color: '#20c997' },
            { lbl: t('itemSellIncome'),  val: d.itemSellIncome,  color: '#9b59b6' },
        ];
        $('#incomeSummaryBox').html(buildSummaryRows(incRows, d.totalIncome, '#28a745', t('totalIncome')));

        // Expense Summary
        var expRows = [
            { lbl: t('totalExpense'), val: d.totalExpense,     color: '#dc3545' },
            { lbl: t('itemPurchase'), val: d.itemPurchasePaid, color: '#fd7e14' },
        ];
        $('#expenseSummaryBox').html(buildSummaryRows(expRows, d.totalExpenses, '#dc3545', t('totalExpenses')));

        // Due Summary
        var dueHtml =
            summaryRow(t('preDue'),     fmt(d.preDue || 0),       '#fd7e14') +
            summaryRow(t('newOrderAmt'),fmt(d.newOrderAmount),    '#6c7ae0') +
            summaryRow(t('discount'),   fmt(d.totalDiscount),     '#9b59b6') +
            summaryRow(t('postDue'),    fmt(d.postDue),           '#dc3545', true);
        $('#dueSummaryBox').html(dueHtml);

        // Order Summary
        var ordHtml =
            summaryRow(t('totalOrders'),  d.totalOrders,     '#6c7ae0') +
            summaryRow(t('delivered'),    d.deliveredOrders, '#28a745');
        $('#orderSummaryBox').html(ordHtml);
    }

    function buildSummaryRows(rows, total, totalColor, totalLabel) {
        var html = '';
        var maxVal = Math.max.apply(null, rows.map(function (r) { return parseFloat(r.val || 0); }));
        rows.forEach(function (r) {
            var pct = maxVal > 0 ? (parseFloat(r.val || 0) / maxVal * 100).toFixed(0) : 0;
            html +=
                '<div style="margin-bottom:10px;">' +
                '<div class="d-flex justify-content-between mb-1" style="font-size:13px;">' +
                '<span style="color:#555;">' + esc(r.lbl) + '</span>' +
                '<strong style="color:' + r.color + ';">৳' + fmt(r.val) + '</strong>' +
                '</div>' +
                '<div class="prog-wrap"><div class="prog-bar" style="width:' + pct + '%;background:' + r.color + ';"></div></div>' +
                '</div>';
        });
        html +=
            '<div class="d-flex justify-content-between mt-2 pt-2" style="border-top:2px solid ' + totalColor + '22; font-size:14px;">' +
            '<strong>' + esc(totalLabel) + '</strong>' +
            '<strong style="color:' + totalColor + ';">৳' + fmt(total) + '</strong>' +
            '</div>';
        return html;
    }

    function summaryRow(lbl, val, color, bold) {
        return '<div class="d-flex justify-content-between py-1" style="border-bottom:1px solid #f2f2f2; font-size:13px;">' +
               '<span style="color:#555;">' + esc(lbl) + '</span>' +
               '<strong style="color:' + color + ';' + (bold ? 'font-size:14px;' : '') + '">৳' + val + '</strong>' +
               '</div>';
    }

    // ─── Trend Chart ───────────────────────────────────────────────────────────
    function renderTrendChart(data) {
        var $wrap = $('#trendChart').empty();
        if (!data || !data.length) {
            $wrap.html('<div style="text-align:center;color:#bbb;padding:30px 0;font-size:13px;">' + t('noData') + '</div>');
            return;
        }

        var filled = fillMissingMonths(data);
        var maxVal = Math.max.apply(null, filled.map(function (d) {
            return Math.max(parseFloat(d.TotalIncome || 0), parseFloat(d.TotalExpense || 0));
        }));

        var html = '<div class="trend-grid">';
        filled.forEach(function (d) {
            var inc = parseFloat(d.TotalIncome  || 0);
            var exp = parseFloat(d.TotalExpense || 0);
            var pI  = maxVal > 0 ? Math.max((inc / maxVal) * 100, inc > 0 ? 4 : 0) : 0;
            var pE  = maxVal > 0 ? Math.max((exp / maxVal) * 100, exp > 0 ? 4 : 0) : 0;
            var lbl = fmtMonth(d.Month);
            html +=
                '<div class="trend-col" title="আয়: ৳' + fmt(inc) + '  ব্যয়: ৳' + fmt(exp) + '">' +
                '<div class="trend-bar-wrap">' +
                '<div class="trend-bar-in"  style="height:' + pI + '%;"></div>' +
                '<div class="trend-bar-ex"  style="height:' + pE + '%;"></div>' +
                '</div>' +
                '<div class="trend-mon">' + lbl + '</div>' +
                '</div>';
        });
        html += '</div>';
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
            result.push(map[key] || { Month: key, TotalIncome: 0, TotalExpense: 0 });
        }
        return result;
    }

    function fmtMonth(ym) {
        if (!ym) return '';
        var parts  = ym.split('-');
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return months[parseInt(parts[1]) - 1] + '<br><small style="color:#aaa;">' + parts[0].substring(2) + '</small>';
    }

    // ─── Income Tab ────────────────────────────────────────────────────────────
    function renderIncomeTab(res, sumData) {
        if (!res.success) return;

        // Tailoring breakdown
        renderCatGrid('#tailoringBreakdownBox', res.tailoringBreakdown, '#28a745', 'Amount');
        // Other income breakdown
        renderCatGrid('#otherIncomeBreakdownBox', res.otherIncomeBreakdown, '#20c997', 'Amount');

        // Tailoring records
        var $tb = $('#tailoringRecordsBody').empty();
        var records = res.tailoringRecords || [];
        $('#tailoringRecordCount').text('(' + records.length + ' ' + t('records') + ')');
        var tTotal = 0;
        records.forEach(function (r) {
            tTotal += parseFloat(r.Amount || 0);
            $tb.append(
                '<tr>' +
                '<td>' + fmtDate(r.PayDate) + '</td>' +
                '<td style="font-weight:700;color:#6c7ae0;">' + esc(r.OrderNo) + '</td>' +
                '<td style="text-align:right;font-weight:600;color:#28a745;">৳' + fmt(r.Amount) + '</td>' +
                '<td><span style="font-size:11px;background:#e8f8ee;color:#28a745;padding:2px 7px;border-radius:99px;">' + esc(r.Status || '') + '</span></td>' +
                '</tr>');
        });
        $('#tailoringTotal').html('<strong style="color:#28a745;">৳' + fmt(tTotal) + '</strong>');

        // Other income records
        var $ob = $('#otherIncomeRecordsBody').empty();
        var oRecords = res.otherIncomeRecords || [];
        $('#otherIncomeRecordCount').text('(' + oRecords.length + ' ' + t('records') + ')');
        var oTotal = 0;
        oRecords.forEach(function (r) {
            oTotal += parseFloat(r.Amount || 0);
            $ob.append(
                '<tr>' +
                '<td>' + fmtDate(r.IncomeDate) + '</td>' +
                '<td><span style="font-size:11px;background:#e0f7f4;color:#20c997;padding:2px 7px;border-radius:99px;">' + esc(r.CategoryName) + '</span></td>' +
                '<td style="text-align:left;">' + esc(r.Description || '-') + '</td>' +
                '<td style="text-align:right;font-weight:600;color:#20c997;">৳' + fmt(r.Amount) + '</td>' +
                '<td style="font-size:12px;color:#888;">' + esc(r.AccountName) + '</td>' +
                '</tr>');
        });
        $('#otherIncomeTotal').html('<strong style="color:#20c997;">৳' + fmt(oTotal) + '</strong>');
    }

    // ─── Expense Tab ───────────────────────────────────────────────────────────
    function renderExpenseTab(res) {
        if (!res.success) return;

        renderCatGrid('#expenseByCategoryBox', res.expenseByCategory, '#dc3545', 'Amount');

        var $eb = $('#expenseRecordsBody').empty();
        var records = res.expenseRecords || [];
        $('#expenseRecordCount').text('(' + records.length + ' ' + t('records') + ')');
        var eTotal = 0;
        records.forEach(function (r) {
            eTotal += parseFloat(r.Amount || 0);
            $eb.append(
                '<tr>' +
                '<td>' + fmtDate(r.ExpenseDate) + '</td>' +
                '<td><span style="font-size:11px;background:#fff0f0;color:#dc3545;padding:2px 7px;border-radius:99px;">' + esc(r.CategoryName) + '</span></td>' +
                '<td style="text-align:left;">' + esc(r.Description || '-') + '</td>' +
                '<td style="text-align:right;font-weight:600;color:#dc3545;">৳' + fmt(r.Amount) + '</td>' +
                '<td style="font-size:12px;color:#888;">' + esc(r.AccountName) + '</td>' +
                '</tr>');
        });
        $('#expenseTotal').html('<strong style="color:#dc3545;">৳' + fmt(eTotal) + '</strong>');
    }

    // ─── Accounts Tab ──────────────────────────────────────────────────────────
    function renderAccountsTab(res) {
        if (!res || !res.success) return;

        var $grid = $('#accountsGrid').empty();
        var accounts = res.accounts || [];

        if (!accounts.length) {
            $grid.html('<div style="text-align:center;color:#bbb;padding:30px;">' + t('noData') + '</div>');
        } else {
            accounts.forEach(function (a) {
                var totalIn  = parseFloat(a.TotalIn  || 0);
                var totalEx  = parseFloat(a.TotalEx  || 0);
                if (totalIn === 0 && totalEx === 0) return;

                var balBefore = parseFloat(a.BalanceBefore || 0);
                var balAfter  = parseFloat(a.BalanceAfter  || parseFloat(a.AccountBalance || 0));
                var balColor  = balAfter >= 0 ? '#28a745' : '#dc3545';

                $grid.append(
                    '<div class="acc-box">' +
                    '<div class="acc-name"><i class="fas fa-university" style="color:#6c7ae0;"></i>' + esc(a.AccountName) + '</div>' +
                    '<div class="acc-row"><span class="lbl" data-en="Opening Balance" data-bn="পূর্বের ব্যালেন্স">পূর্বের ব্যালেন্স</span><span class="val">৳' + fmt(balBefore) + '</span></div>' +
                    '<div class="acc-row in-row"><span class="lbl" data-en="Total In" data-bn="মোট জমা">মোট জমা</span><span class="val">+ ৳' + fmt(totalIn) + '</span></div>' +
                    '<div class="acc-row ex-row"><span class="lbl" data-en="Total Out" data-bn="মোট বের">মোট বের</span><span class="val">- ৳' + fmt(totalEx) + '</span></div>' +
                    '<div class="acc-row bal-row"><span class="lbl" data-en="Closing Balance" data-bn="বর্তমান ব্যালেন্স">বর্তমান ব্যালেন্স</span><span class="val" style="color:' + balColor + ';">৳' + fmt(balAfter) + '</span></div>' +
                    '</div>');
            });
        }

        renderCatGrid('#allAccIncomeCatBox', res.incomeByCategory  || [], '#28a745', 'NetAmount');
        renderCatGrid('#allAccExpCatBox',    res.expenseByCategory || [], '#dc3545', 'NetAmount');
    }

    // ─── Category Grid ─────────────────────────────────────────────────────────
    function renderCatGrid(selector, data, color, amtField) {
        var $box = $(selector).empty();
        if (!data || !data.length) {
            $box.html('<div style="font-size:12px;color:#bbb;">' + t('noData') + '</div>');
            return;
        }
        var maxAmt = Math.max.apply(null, data.map(function (d) { return parseFloat(d[amtField] || 0); }));
        data.forEach(function (d) {
            var amt = parseFloat(d[amtField] || 0);
            var pct = maxAmt > 0 ? (amt / maxAmt * 100).toFixed(0) : 0;
            var catName = d.CategoryName || d.PaymentStatus || d.Category || '-';
            $box.append(
                '<div style="margin-bottom:9px;">' +
                '<div class="d-flex justify-content-between mb-1">' +
                '<span class="cat-name">' + esc(catName) + '</span>' +
                '<span class="cat-amt" style="color:' + color + ';">৳' + fmt(amt) + '</span>' +
                '</div>' +
                '<div class="prog-wrap"><div class="prog-bar" style="width:' + pct + '%;background:' + color + ';"></div></div>' +
                '</div>');
        });
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────
    function fmt(n) {
        return parseFloat(n || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function fmtDate(d) {
        if (!d) return '-';
        try {
            var dt = new Date(d);
            if (isNaN(dt.getTime())) return d;
            return dt.getDate() + ' ' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][dt.getMonth()] + ' ' + dt.getFullYear();
        } catch (e) { return String(d).substring(0, 10); }
    }

    function esc(s) {
        return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
})();
