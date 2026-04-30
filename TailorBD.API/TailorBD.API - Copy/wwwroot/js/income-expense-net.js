// income-expense-net.js
(function () {
    'use strict';

    let institutionId = 0;
    let currentLang = 'bn';
    let lastResponse = null;
    let institutionInfo = null; // cache institution info for print header

    const T = {
        en: {
            totalIncome    : 'Total Income',
            totalExpenses  : 'Total Expenses',
            netBalance     : 'Net Balance',
            netLoss        : 'Net Loss',
            incomeBycat    : 'Income by Category',
            expenseBycat   : 'Expense by Category',
            noData         : 'No data available',
            allTime        : 'All time report',
            to             : 'to',
            print          : 'Print',
            category       : 'Category',
            amount         : 'Amount',
            total          : 'Total',
            loadReport     : 'Load Report',
            today          : 'Today',
            dateFrom       : 'Date From',
            dateTo         : 'Date To',
        },
        bn: {
            totalIncome    : 'মোট আয়',
            totalExpenses  : 'মোট ব্যয়',
            netBalance     : 'নেট ব্যালেন্স',
            netLoss        : 'নেট ক্ষতি',
            incomeBycat    : 'ক্যাটাগরি অনুযায়ী আয়',
            expenseBycat   : 'ক্যাটাগরি অনুযায়ী ব্যয়',
            noData         : 'কোনো তথ্য নেই',
            allTime        : 'সকল সময়ের রিপোর্ট',
            to             : 'থেকে',
            print          : 'প্রিন্ট',
            category       : 'ক্যাটাগরি',
            amount         : 'পরিমান',
            total          : 'মোট',
            loadReport     : 'রিপোর্ট দেখুন',
            today          : 'আজ',
            dateFrom       : 'তারিখ থেকে',
            dateTo         : 'তারিখ পর্যন্ত',
        }
    };

    function t(key) { return (T[currentLang] || T.bn)[key] || key; }

    // ─── Init ───────────────────────────────────────────────────────────────────
    $(document).ready(function () {
        currentLang   = localStorage.getItem('preferredLanguage') || 'bn';
        institutionId = parseInt(sessionStorage.getItem('institutionId') || '0');

        // Register language change listener always (regardless of institutionId)
        $(document).on('languageChanged', function (e, lang) {
            currentLang = lang || 'bn';
            if (lastResponse) {
                renderCards(lastResponse.data);
                renderIncomeCat(lastResponse.incomeByCategory  || []);
                renderExpenseCat(lastResponse.expenseByCategory || []);
            }
            // update print header date label language
            var from = $('#nFrom').val(), to = $('#nTo').val();
            if (from || to) {
                var dateText = (from || '—') + '  ' + t('to') + '  ' + (to || '—');
                $('#nDateLabel').text(dateText);
                $('#printDateRange').text(dateText);
            } else {
                $('#nDateLabel').text(t('allTime'));
                $('#printDateRange').text(t('allTime'));
            }
        });

        if (!institutionId) {
            $(document).on('app-session-ready', function () {
                institutionId = parseInt(sessionStorage.getItem('institutionId') || '0');
                if (institutionId) {
                    loadInstitutionInfo();
                    setToday();
                }
            });
            return;
        }

        loadInstitutionInfo();
        setToday();
    });

    // ─── Date Helpers ──────────────────────────────────────────────────────────
    window.netSetToday = function () {
        var today = new Date().toISOString().split('T')[0];
        $('#nFrom').val(today);
        $('#nTo').val(today);
        loadNet();
    };

    function setToday() {
        var today = new Date().toISOString().split('T')[0];
        $('#nFrom').val(today);
        $('#nTo').val(today);
        loadNet();
    }

    window.loadNet = function () {
        institutionId = parseInt(sessionStorage.getItem('institutionId') || institutionId || '0');
        if (!institutionId) return;

        currentLang = localStorage.getItem('preferredLanguage') || 'bn';

        var from = $('#nFrom').val();
        var to   = $('#nTo').val();

        // date label
        if (from || to) {
            var dateText = (from || '—') + '  ' + t('to') + '  ' + (to || '—');
            $('#nDateLabel').text(dateText);
            $('#printDateRange').text(dateText);
        } else {
            $('#nDateLabel').text(t('allTime'));
            $('#printDateRange').text(t('allTime'));
        }

        $('#nSpinner').show();
        $('#nContent').hide();

        var qs = '?institutionId=' + institutionId +
                 (from ? '&dateFrom=' + from : '') +
                 (to   ? '&dateTo='   + to   : '');

        $.get('/api/IncomeExpenseReport/net-summary' + qs)
            .done(function (res) {
                if (!res.success) { showErr(); return; }
                lastResponse = res; // cache response
                renderCards(res.data);
                renderIncomeCat(res.incomeByCategory  || []);
                renderExpenseCat(res.expenseByCategory || []);
                $('#nSpinner').hide();
                $('#nContent').show();
            })
            .fail(showErr);
    };

    function showErr() {
        $('#nSpinner').html('<div style="color:#dc3545;text-align:center;padding:40px;"><i class="fas fa-exclamation-circle fa-2x mb-2" style="display:block;"></i>' + t('noData') + '</div>');
    }

    // ─── Top 3 Cards ───────────────────────────────────────────────────────────
    function renderCards(d) {
        var inc = parseFloat(d.totalIncome   || 0);
        var exp = parseFloat(d.totalExpenses || 0);
        var net = parseFloat(d.netBalance    || 0);
        var isPos = net >= 0;

        $('#cardIncome').html(
            '<div class="net-card-lbl">' + t('totalIncome') + '</div>' +
            '<div class="net-card-val income">৳' + fmt(inc) + '</div>');

        $('#cardExpense').html(
            '<div class="net-card-lbl">' + t('totalExpenses') + '</div>' +
            '<div class="net-card-val expense">৳' + fmt(exp) + '</div>');

        $('#cardNet').html(
            '<div class="net-card-lbl">' + t('netBalance') + (isPos ? '' : ' (' + t('netLoss') + ')') + '</div>' +
            '<div class="net-card-val ' + (isPos ? 'profit' : 'loss') + '">৳' + fmt(Math.abs(net)) + '</div>');
        $('#cardNet').attr('class', 'net-card net-card--' + (isPos ? 'profit' : 'loss'));
    }

    // ─── Category Tables ───────────────────────────────────────────────────────
    function renderIncomeCat(data) {
        var $tb = $('#incomeCatBody').empty();
        var total = 0;
        if (!data.length) {
            $tb.append('<tr><td colspan="2" style="text-align:center;color:#bbb;">' + t('noData') + '</td></tr>');
        } else {
            data.forEach(function (r) {
                var amt = parseFloat(r.Amount || 0);
                total += amt;
                var name = r.CategoryName === 'Tailoring'
                    ? (currentLang === 'bn' ? 'সেলাই আয়' : 'Tailoring Income')
                    : (r.CategoryName === 'ItemSell' || r.CategoryName === 'Fabrics_Selling')
                    ? (currentLang === 'bn' ? 'আইটেম বিক্রয়' : 'Item Sale')
                    : esc(r.CategoryName || '-');
                $tb.append(
                    '<tr>' +
                    '<td>' + name + '</td>' +
                    '<td class="amt-cell green">৳' + fmt(amt) + '</td>' +
                    '</tr>');
            });
        }
        $('#incomeCatFoot').html(
            '<td><strong>' + t('total') + '</strong></td>' +
            '<td class="amt-cell green"><strong>৳' + fmt(total) + '</strong></td>');
    }

    function renderExpenseCat(data) {
        var $tb = $('#expenseCatBody').empty();
        var total = 0;
        if (!data.length) {
            $tb.append('<tr><td colspan="2" style="text-align:center;color:#bbb;">' + t('noData') + '</td></tr>');
        } else {
            data.forEach(function (r) {
                var amt = parseFloat(r.Amount || 0);
                total += amt;
                $tb.append(
                    '<tr>' +
                    '<td>' + esc(r.CategoryName || '-') + '</td>' +
                    '<td class="amt-cell red">৳' + fmt(amt) + '</td>' +
                    '</tr>');
            });
        }
        $('#expenseCatFoot').html(
            '<td><strong>' + t('total') + '</strong></td>' +
            '<td class="amt-cell red"><strong>৳' + fmt(total) + '</strong></td>');
    }

    // ─── Load Institution Info for Print Header ────────────────────────────────
    function loadInstitutionInfo() {
        if (institutionInfo) { renderPrintHeader(); return; }
        $.get('/api/institution/' + institutionId)
            .done(function (res) {
                if (res.success && res.data) {
                    institutionInfo = res.data;
                    renderPrintHeader();
                }
            });
    }

    function renderPrintHeader() {
        if (!institutionInfo) return;
        $('#printInsName').text(institutionInfo.institutionName || '');
        $('#printInsPhone').text(institutionInfo.phone ? ('📞 ' + institutionInfo.phone) : '');
        $('#printInsAddress').text(institutionInfo.address ? ('📍 ' + institutionInfo.address) : '');
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────
    function fmt(n) {
        return parseFloat(n || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    function esc(s) {
        return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
})();
