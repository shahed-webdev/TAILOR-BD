/* worker-payments.js */
(function () {
    'use strict';
    let institutionId = 0, registrationId = 0, page = 1, pageSize = 50, total = 0;

    function getLang() {
        var lang = window.currentLang || localStorage.getItem('preferredLanguage') || 'bn';
        window.currentLang = (lang === 'en') ? 'en' : 'bn';
        return window.currentLang;
    }
    function t(bn, en) { return getLang() === 'en' ? en : bn; }
    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function fmtDate(v) {
        if (v == null || v === '' || v === '-') return '-';
        var s = String(v).trim();
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        function build(day, monthNum, year) {
            var dd = ('0' + parseInt(day, 10)).slice(-2);
            var mon = months[parseInt(monthNum, 10) - 1] || '???';
            var yyyy = String(year);
            if (yyyy.length === 2) yyyy = ((parseInt(yyyy, 10) > 50) ? '19' : '20') + yyyy;
            return dd + '-' + mon + '-' + yyyy;
        }
        var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (m) return build(m[3], m[2], m[1]);
        m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
        if (m) return build(m[1], m[2], m[3]);
        var d = new Date(s);
        if (!isNaN(d.getTime())) return build(d.getDate(), d.getMonth() + 1, d.getFullYear());
        return s;
    }

    function loadInstitution() {
        if (!institutionId) return;
        $.get('/api/institution/' + institutionId).done(function (res) {
            var d = res.data || res.Data || res;
            $('#printInsName').text(d.InstitutionName || d.institutionName || sessionStorage.getItem('institutionName') || '');
            $('#printInsAddress').text(d.Address || d.address || sessionStorage.getItem('institutionAddress') || '');
            var ph = d.Phone || d.phone || sessionStorage.getItem('institutionPhone') || '';
            $('#printInsPhone').text(ph ? ('Phone: ' + ph) : '');
        });
    }

    window.onTypeChange = function () {
        loadWorkers();
    };

    function loadWorkers(done) {
        var type = $('#fType').val() || '';
        var $w = $('#fWorker').empty().append('<option value="">All / সব</option>');
        if (window.WorkerSelect) WorkerSelect.refresh($w[0]);
        if (!type || !institutionId) { if (done) done(); return; }
        var url = type === 'Artisan'
            ? '/api/Factory/artisans'
            : '/api/Cutting/masters';
        $.get(url, { institutionId: institutionId, activeOnly: false }).done(function (res) {
            (res.data || []).forEach(function (m) {
                var id = m.ArtisanID || m.CuttingMasterID;
                $w.append('<option value="' + id + '">' + esc(m.Name) + '</option>');
            });
            if (window.WorkerSelect) WorkerSelect.refresh($w[0]);
            if (done) done();
        }).fail(function () { if (done) done(); });
    }

    window.loadPayments = function (p) {
        if (p) page = p;
        if (!institutionId) return;
        var params = {
            institutionId: institutionId,
            page: page,
            pageSize: pageSize
        };
        var wt = $('#fType').val();
        if (wt) params.workerType = wt;
        var wid = parseInt($('#fWorker').val() || '0');
        if (wid) params.workerId = wid;
        if ($('#fFrom').val()) params.dateFrom = $('#fFrom').val();
        if ($('#fTo').val()) params.dateTo = $('#fTo').val();
        var s = ($('#fSearch').val() || '').trim();
        if (s) params.search = s;

        $('#payBody').html('<tr><td colspan="7" class="no-data"><i class="fas fa-spinner fa-spin"></i></td></tr>');
        $.get('/api/Cutting/worker-payments', params).done(function (res) {
            total = res.total || 0;
            $('#totalAmt').text(Number(res.totalAmount || 0).toFixed(2));
            $('#totalRows').text('(' + total + ' ' + t('রেকর্ড', 'rows') + ')');
            var $b = $('#payBody').empty();
            if (!res.success || !res.data || !res.data.length) {
                $b.append('<tr><td colspan="7" class="no-data">' + t('কোনো ডাটা নেই', 'No data') + '</td></tr>');
                renderPager();
                return;
            }
            res.data.forEach(function (r) {
                var typeLabel = r.WorkerType === 'Artisan' ? t('কারিগর', 'Artisan') : t('মাস্টার', 'Master');
                $b.append(
                    '<tr>' +
                    '<td>' + esc(fmtDate(r.PaymentDate)) + '</td>' +
                    '<td>' + typeLabel + '</td>' +
                    '<td style="font-weight:600;">' + esc(r.WorkerName || '-') + '</td>' +
                    '<td>' + esc(r.WorkerPhone || '-') + '</td>' +
                    '<td><strong>' + Number(r.Amount || 0).toFixed(2) + '</strong></td>' +
                    '<td>' + esc(r.Notes || '-') + '</td>' +
                    '<td>' + esc(r.OtpCode || '-') + '</td>' +
                    '</tr>'
                );
            });
            renderPager();
            updatePrintMeta();
        }).fail(function () {
            $('#payBody').html('<tr><td colspan="7" class="no-data">' + t('সমস্যা হয়েছে', 'Error') + '</td></tr>');
        });
    };

    function renderPager() {
        var pages = Math.max(1, Math.ceil(total / pageSize));
        var $p = $('#pager').empty();
        if (pages <= 1) return;
        $p.append('<button class="btn-pri me-1" ' + (page <= 1 ? 'disabled' : '') + ' onclick="loadPayments(' + (page - 1) + ')">Prev</button>');
        $p.append('<span style="font-size:13px;">' + page + ' / ' + pages + '</span>');
        $p.append('<button class="btn-pri ms-1" ' + (page >= pages ? 'disabled' : '') + ' onclick="loadPayments(' + (page + 1) + ')">Next</button>');
    }

    function updatePrintMeta() {
        var lang = getLang();
        var type = $('#fType').val();
        var who = $('#fWorker option:selected').text() || (lang === 'en' ? 'All' : 'সব');
        var typeL = !type ? (lang === 'en' ? 'All workers' : 'সব কর্মী')
            : (type === 'Artisan' ? (lang === 'en' ? 'Artisans' : 'কারিগর') : (lang === 'en' ? 'Masters' : 'মাস্টার'));
        $('#printHeadline').text((lang === 'en' ? 'Worker Payment History' : 'কর্মী পেমেন্ট ইতিহাস') + ' — ' + typeL + ' / ' + who);
        var a = $('#fFrom').val(), b = $('#fTo').val();
        if (a || b) {
            var fa = a ? fmtDate(a) : '-', fb = b ? fmtDate(b) : '-';
            if (a && b && fa === fb) $('#printDateLine').text((lang === 'en' ? 'Date: ' : 'তারিখ: ') + fa);
            else $('#printDateLine').text((lang === 'en' ? 'Date: ' : 'তারিখ: ') + fa + (lang === 'en' ? ' to ' : ' হতে ') + fb);
        } else {
            $('#printDateLine').text(lang === 'en' ? 'All Time' : 'অলটাইম');
        }
    }

    window.printReport = function () {
        updatePrintMeta();
        window.print();
    };

    function ready() {
        getLang();
        institutionId = parseInt(sessionStorage.getItem('institutionId') || '0');
        registrationId = parseInt(sessionStorage.getItem('registrationId') || '0');
        // preselect from query ?type=Artisan&workerId=1
        var q = new URLSearchParams(location.search);
        if (q.get('type')) $('#fType').val(q.get('type'));
        loadInstitution();
        if (q.get('workerId')) {
            loadWorkers(function () {
                if (window.WorkerSelect) WorkerSelect.setValue('#fWorker', q.get('workerId'));
                else $('#fWorker').val(q.get('workerId'));
                loadPayments(1);
            });
        } else {
            loadWorkers();
            loadPayments(1);
        }
    }

    $(document).ready(function () {
        if (!parseInt(sessionStorage.getItem('institutionId') || '0')) {
            $(document).on('app-session-ready', ready);
        } else ready();
    });
    $(document).on('languageChanged', function () { loadPayments(page); });
})();
