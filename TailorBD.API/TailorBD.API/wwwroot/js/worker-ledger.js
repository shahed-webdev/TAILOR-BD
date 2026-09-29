/* worker-ledger.js — "কাজের হিসাব ও টোকেন" tab of worker-payments.html
 * Which completed dress earned how much for each cutting master / artisan (কারিগর),
 * which of it is paid (payments allocated FIFO on the server) and a printable payment token.
 * API: GET /api/WorkerLedger/workers, GET /api/WorkerLedger/ledger (login + shop from token).
 */
(function () {
    'use strict';

    var TOKEN_BN_DIGITS = true;   // token in Bengali mode prints ০-৯ (screen keeps 0-9 like the rest of the app)
    var TK = '৳\u00a0';           // taka sign + non-breaking space: "৳ 400" (never split over two lines)

    var LANG = {
        master: ['কাটিং মাস্টার', 'Cutting master'],
        artisan: ['কারিগর', 'Artisan'],
        allWorkers: ['সব কর্মী / All workers', 'সব কর্মী / All workers'],
        earned: ['মোট আয়', 'Total earned'],
        paid: ['মোট পরিশোধ', 'Total paid'],
        payable: ['মোট পাওনা', 'Payable balance'],
        name: ['নাম', 'Name'], phone: ['ফোন', 'Phone'], work: ['কাজ (পিস)', 'Work (pcs)'],
        status: ['স্ট্যাটাস', 'Status'], action: ['অ্যাকশন', 'Action'],
        date: ['তারিখ', 'Date'], order: ['অর্ডার', 'Order'], customer: ['কাস্টমার', 'Customer'],
        dress: ['ড্রেস', 'Dress'], qty: ['পরিমাণ', 'Qty'], ofPcs: ['জমা পিস / এসাইন করা মোট পিস (বাকি পিস এখনো সেলাই চলছে)', 'pieces submitted / pieces assigned (the rest is still being sewn)'], rate: ['রেট', 'Rate'], amount: ['আয়', 'Earned'],
        alloc: ['পরিশোধ', 'Paid'], due: ['বাকি', 'Due'],
        st_paid: ['পরিশোধিত', 'Paid'], st_partial: ['আংশিক', 'Partial'], st_unpaid: ['বাকি', 'Unpaid'], st_none: ['-', '-'],
        details: ['হিসাব', 'Ledger'], token: ['টোকেন', 'Token'], printToken: ['পেমেন্ট টোকেন প্রিন্ট', 'Print payment token'],
        noData: ['কোনো ডাটা নেই', 'No data'], err: ['সমস্যা হয়েছে', 'Something went wrong'],
        opening: ['পূর্বের জের (আগের হিসাব)', 'Opening balance (earlier)'],
        stAll: ['সব', 'All'],
        inFilter: ['ফিল্টারে', 'In this filter'], items: ['টি', ' items'],
        noteOpening: ['ব্যালেন্সে ৳\u00a0{0} আছে যার আলাদা কাজের হিসাব নেই (আগের/পুরনো হিসাব) — "পূর্বের জের" লাইন হিসেবে দেখানো হয়েছে, যাতে মোট পাওনা ব্যালেন্সের সমান থাকে।',
                      'Balance includes ৳\u00a0{0} without matching work records (earlier data) — shown as an "Opening balance" line so the payable equals the balance.'],
        noteAdj: ['ব্যালেন্স কাজের হিসাবের চেয়ে ৳\u00a0{0} কম (হাতে সমন্বয়) — এটি পরিশোধ হিসেবে ধরা হয়েছে।',
                  'Balance is ৳\u00a0{0} lower than the work records (manual adjustment) — counted as paid.'],
        noteUncredited: ['{0}টি পুরনো সম্পন্ন কাজে আয়ের রেকর্ড নেই (খরচ ফিচার চালুর আগে), তাই তালিকায় নেই।',
                         '{0} older completed item(s) have no earning record (before dress costs were used) and are not listed.'],
        noteAdvance: ['অগ্রিম পরিশোধ: ৳\u00a0{0}', 'Advance paid: ৳\u00a0{0}'],
        zeroPayable: ['এই কর্মীর কোনো পাওনা নেই। তবুও টোকেন প্রিন্ট করবেন?', 'Nothing is payable to this worker. Print a token anyway?'],
        // token
        tkTitle: ['পেমেন্ট টোকেন', 'PAYMENT TOKEN'], tkRef: ['টোকেন নং', 'Token #'], tkPrinted: ['প্রিন্ট', 'Printed'],
        tkType: ['ধরন', 'Type'], tkWork: ['বাকি কাজ', 'Unpaid work'], tkPcs: ['টি', ' pcs'],
        tkEarned: ['মোট আয়', 'Total earned'], tkPaid: ['এ পর্যন্ত পরিশোধ', 'Paid so far'], tkPayable: ['মোট পাওনা', 'TOTAL PAYABLE'],
        tkGiven: ['প্রদত্ত টাকা', 'Amount paid'], tkDate: ['তারিখ', 'Date'],
        tkSignMaster: ['মাস্টারের স্বাক্ষর', "Master's signature"], tkSignArtisan: ['কারিগরের স্বাক্ষর', "Artisan's signature"],
        tkSignCashier: ['ক্যাশিয়ারের স্বাক্ষর', "Cashier's signature"],
        tkNote: ['কম্পিউটারে OTP দিয়ে পেমেন্ট এন্ট্রি করতে হবে', 'Payment must be entered in the computer with OTP'],
        tkNothing: ['বাকি কাজ নেই', 'No unpaid work'], tkItems: ['বাকি কাজের তালিকা', 'Unpaid work items'],
        tkSizeAuto: ['মাপ প্রিন্টের সাইজ', 'Same as measurement print'],
        // advance (paid more than earned) + other payments (অন্যান্য পাওনা)
        advance: ['অগ্রিম', 'Advance'],
        advanceCard: ['অগ্রিম (বেশি পরিশোধ)', 'Advance (paid ahead)'],
        tkAdvance: ['অগ্রিম (আগাম পরিশোধ)', 'ADVANCE (paid ahead)'],
        xt_ExtraDesign: ['এক্সট্রা ডিজাইন', 'Extra design'], xt_Alter: ['অলটার', 'Alteration'], xt_Other: ['অন্যান্য', 'Other'],
        extraTag: ['অন্যান্য পাওনা', 'Other payment']
    };

    var st = { type: 'Artisan', page: 1, pageSize: 50, optionsFor: null, busy: false };

    function lang() { var l = window.currentLang || localStorage.getItem('preferredLanguage') || 'bn'; return l === 'en' ? 'en' : 'bn'; }
    function t(k) { var v = LANG[k]; return v ? v[lang() === 'en' ? 1 : 0] : k; }
    function fmtS(k) { var s = t(k), a = arguments; return s.replace(/\{(\d)\}/g, function (m, i) { return a[+i + 1]; }); }
    function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
    function num(v) { v = Number(v || 0); return isFinite(v) ? v : 0; }
    function amount2(v) { return num(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    function money(v) { return TK + amount2(v); }
    function moneyShort(v) { v = num(v); var whole = Math.abs(v - Math.round(v)) < 0.005; return TK + v.toLocaleString('en-US', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }); }
    function bnDigits(s) { return String(s).replace(/[0-9]/g, function (d) { return '০১২৩৪৫৬৭৮৯'.charAt(+d); }); }
    function tkNum(s) { return (lang() === 'bn' && TOKEN_BN_DIGITS) ? bnDigits(s) : String(s); }
    function fmtDate(v) {
        if (!v) return '-';
        var m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (!m) return String(v);
        var mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m[2] - 1];
        return m[3] + '-' + mon + '-' + m[1];
    }
    function stBadge(s) { return '<span class="st-badge st-' + esc(s) + '">' + esc(t('st_' + s)) + '</span>'; }
    function typeName(type) { return type === 'Artisan' ? t('artisan') : t('master'); }
    function extraTypeName(x) { return t('xt_' + (x === 'ExtraDesign' || x === 'Alter' ? x : 'Other')); }
    /** payable cell: negative balance = advance (অগ্রিম), shown as a positive amount with the label */
    function payableHtml(v) {
        v = num(v);
        return v < -0.005 ? '<span style="color:#1565c0;">' + esc(t('advance')) + ' ' + money(-v) + '</span>' : money(v);
    }
    function instId() { return parseInt(sessionStorage.getItem('institutionId') || '0', 10); }
    function errText(xhr) { return (xhr && xhr.responseJSON && xhr.responseJSON.message) || t('err'); }

    // ── worker dropdown (searchable, worker-select.js) ─────────────────────
    function loadWorkerOptions(selectId, done) {
        var $w = $('#lgWorker');
        if (st.optionsFor === st.type) { if (selectId != null) setWorker(selectId); if (done) done(); return; }
        $.get('/api/WorkerLedger/workers', { institutionId: instId(), workerType: st.type, pageSize: 500 }).done(function (res) {
            $w.empty().append('<option value="">' + esc(t('allWorkers')) + '</option>');
            (res.data || []).forEach(function (w) {
                $w.append('<option value="' + w.workerId + '">' + esc(w.name) + (w.phone ? ' (' + esc(w.phone) + ')' : '') + '</option>');
            });
            st.optionsFor = st.type;
            if (selectId != null) $w.val(String(selectId));
            if (window.WorkerSelect) WorkerSelect.refresh($w[0]);
            if (done) done();
        }).fail(function () { if (done) done(); });
    }
    function setWorker(id) {
        if (window.WorkerSelect) WorkerSelect.setValue('#lgWorker', id); else $('#lgWorker').val(String(id));
    }

    // ── main load ───────────────────────────────────────────────────────────
    function load(p) {
        if (p) st.page = p;
        if (!instId()) return;
        var workerId = $('#lgWorker').val() || '';
        var status = statusFilter();
        $('.lg-date').toggle(!!workerId);
        $('#lgActions').toggle(!!workerId);
        $('#lgBody').html('<tr><td colspan="10" class="no-data"><i class="fas fa-spinner fa-spin"></i></td></tr>');
        if (!workerId) {
            $.get('/api/WorkerLedger/workers', { institutionId: instId(), workerType: st.type, status: status, page: st.page, pageSize: st.pageSize })
                .done(renderList).fail(function (x) { renderError(x); });
        } else {
            var q = { institutionId: instId(), workerType: st.type, workerId: workerId, status: status, page: st.page, pageSize: st.pageSize };
            if ($('#lgFrom').val()) q.dateFrom = $('#lgFrom').val();
            if ($('#lgTo').val()) q.dateTo = $('#lgTo').val();
            $.get('/api/WorkerLedger/ledger', q).done(renderLedger).fail(function (x) { renderError(x); });
        }
    }
    // ── status multi-select ─────────────────────────────────────────────────
    var ST_ALL = ['paid', 'partial', 'unpaid'];
    function statusChecked() { return $('#lgStatusMenu input:checked').map(function () { return this.value; }).get(); }
    /** API value: '' (= all) when none or all three are ticked, else e.g. 'partial,unpaid'. */
    function statusFilter() {
        var v = statusChecked();
        return (v.length === 0 || v.length === ST_ALL.length) ? '' : v.join(',');
    }
    function statusSummary() {
        var v = statusChecked();
        $('#lgStatusSum').text((v.length === 0 || v.length === ST_ALL.length) ? t('stAll') : v.map(function (s) { return t('st_' + s); }).join(', '));
    }
    function setStatusOpen(open) {
        $('#lgStatusDd').toggleClass('open', open);
        $('#lgStatusBtn').attr('aria-expanded', open ? 'true' : 'false');
    }
    function bindStatus() {
        statusSummary();
        $('#lgStatusBtn').on('click', function (e) { e.stopPropagation(); setStatusOpen(!$('#lgStatusDd').hasClass('open')); });
        $('#lgStatusMenu').on('click', function (e) { e.stopPropagation(); })
            .on('change', 'input', function () { statusSummary(); load(1); });
        $('#lgStatusAll').on('click', function () { $('#lgStatusMenu input').prop('checked', false); statusSummary(); setStatusOpen(false); load(1); });
        $(document).on('click', function () { setStatusOpen(false); })
            .on('keydown', function (e) { if (e.key === 'Escape') setStatusOpen(false); });
    }

    function renderError(xhr) {
        $('#lgCards').empty(); $('#lgNote').hide();
        $('#lgBody').html('<tr><td colspan="10" class="no-data">' + esc(errText(xhr)) + '</td></tr>');
    }

    function cards(earned, paid, payable, extra) {
        $('#lgCards').html(
            '<div class="sum-card"><div class="lbl">' + t('earned') + '</div><div class="val">' + money(earned) + '</div></div>' +
            '<div class="sum-card" style="border-top-color:#28a745;"><div class="lbl">' + t('paid') + '</div><div class="val" style="color:#1e7e34;">' + money(paid) + '</div></div>' +
            (num(payable) < -0.005
                ? '<div class="sum-card" style="border-top-color:#1565c0;"><div class="lbl">' + t('advanceCard') + '</div><div class="val" style="color:#1565c0;">' + money(-num(payable)) + '</div>' + (extra || '') + '</div>'
                : '<div class="sum-card" style="border-top-color:#e74c3c;"><div class="lbl">' + t('payable') + '</div><div class="val" style="color:#c0392b;">' + money(payable) + '</div>' + (extra || '') + '</div>'));
    }

    function renderList(res) {
        if (!res || !res.success) { renderError(); return; }
        cards(res.totals.earned, res.totals.paid, res.totals.payable);
        $('#lgNote').hide();
        $('#lgHead').html('<tr><th>' + t('name') + '</th><th>' + t('phone') + '</th><th>' + t('work') + '</th><th>' + t('earned') +
            '</th><th>' + t('paid') + '</th><th>' + t('payable') + '</th><th>' + t('status') + '</th><th class="no-print">' + t('action') + '</th></tr>');
        var $b = $('#lgBody').empty();
        if (!res.data.length) { $b.append('<tr><td colspan="8" class="no-data">' + t('noData') + '</td></tr>'); }
        res.data.forEach(function (w) {
            $b.append('<tr>' +
                '<td style="font-weight:600;">' + esc(w.name) + (w.isActive ? '' : ' <small class="text-muted">(inactive)</small>') + '</td>' +
                '<td>' + esc(w.phone || '-') + '</td>' +
                '<td>' + num(w.qty) + '</td>' +
                '<td>' + money(w.earned) + '</td>' +
                '<td>' + money(w.paid) + '</td>' +
                '<td><strong>' + payableHtml(w.payable) + '</strong></td>' +
                '<td>' + stBadge(w.status) + '</td>' +
                '<td class="no-print" style="white-space:nowrap;">' +
                '<button class="btn-edit me-1" onclick="WorkerLedger.open(' + w.workerId + ')"><i class="fas fa-list"></i> ' + t('details') + '</button>' +
                '<button class="btn-tok" onclick="WorkerLedger.printToken(\'' + st.type + '\',' + w.workerId + ')"><i class="fas fa-receipt"></i> ' + t('token') + '</button>' +
                '</td></tr>');
        });
        pager(res.total);
    }

    function renderLedger(res) {
        if (!res || !res.success) { renderError(); return; }
        var s = res.summary, r = res.range;
        var extra = '<div style="font-size:11px;color:#777;margin-top:2px;">' + esc(res.worker.name) + '</div>';
        cards(s.earned, num(s.paid) + num(s.adjustment), s.payable, extra);
        var notes = [];
        if (num(s.opening) > 0.005) notes.push(fmtS('noteOpening', amount2(s.opening)));
        if (num(s.adjustment) > 0.005) notes.push(fmtS('noteAdj', amount2(s.adjustment)));
        if (num(s.advance) > 0.005) notes.push(fmtS('noteAdvance', amount2(s.advance)));
        if (num(s.uncredited) > 0) notes.push(fmtS('noteUncredited', s.uncredited));
        $('#lgNote').html(notes.map(esc).join('<br>')).toggle(notes.length > 0);
        $('#lgHead').html('<tr><th>' + t('date') + '</th><th>' + t('order') + '</th><th>' + t('customer') + '</th><th>' + t('dress') + '</th><th>' + t('qty') +
            '</th><th>' + t('rate') + '</th><th>' + t('amount') + '</th><th>' + t('alloc') + '</th><th>' + t('due') + '</th><th>' + t('status') + '</th></tr>');
        var $b = $('#lgBody').empty();
        if (!res.data || !res.data.length) { $b.append('<tr><td colspan="10" class="no-data">' + t('noData') + '</td></tr>'); }
        (res.data || []).forEach(function (x) {
            var isOpen = x.kind === 'opening', isExtra = x.kind === 'extra';
            var dressCell = isOpen ? '<em>' + t('opening') + '</em>'
                : isExtra ? '<span class="st-badge" style="background:#e8f0fe;color:#1a56b0;" title="' + esc(t('extraTag')) + '">' + esc(extraTypeName(x.extraType)) + '</span>' +
                            (x.dress ? ' ' + esc(x.dress) : '') + (x.note ? ' <small class="text-muted">' + esc(x.note) + '</small>' : '')
                : esc(x.dress || '-');
            $b.append('<tr' + (isOpen ? ' style="background:#fffaf0;"' : isExtra ? ' style="background:#f5f8ff;"' : '') + '>' +
                '<td>' + (isOpen ? '-' : esc(fmtDate(x.date))) + '</td>' +
                '<td>' + (x.orderNo ? '#' + esc(x.orderNo) : '-') + '</td>' +
                '<td>' + esc(x.customer || '-') + '</td>' +
                '<td>' + dressCell + '</td>' +
                '<td>' + (isOpen || isExtra ? '-' : num(x.qty) + (x.ofQty > x.qty ? '<span class="lg-of" title="' + esc(t('ofPcs')) + '">/' + num(x.ofQty) + '</span>' : '')) + '</td>' +
                '<td>' + (isOpen || isExtra ? '-' : money(x.rate)) + '</td>' +
                '<td>' + money(x.amount) + '</td>' +
                '<td>' + money(x.paid) + '</td>' +
                '<td><strong>' + money(x.due) + '</strong></td>' +
                '<td>' + stBadge(x.status) + '</td></tr>');
        });
        if (res.data && res.data.length) {
            $b.append('<tr style="background:#f8f9ff;font-weight:700;"><td colspan="4" style="text-align:right;">' + t('inFilter') + ' (' + r.count + t('items') + ')</td>' +
                '<td>' + num(r.qty) + '</td><td></td><td>' + money(r.earned) + '</td><td>' + money(r.paid) + '</td><td>' + money(r.due) + '</td><td></td></tr>');
        }
        pager(res.total);
    }

    function pager(total) {
        var pages = Math.max(1, Math.ceil((total || 0) / st.pageSize));
        var $p = $('#lgPager').empty();
        if (pages <= 1) return;
        $p.append('<button class="btn-pri me-1" ' + (st.page <= 1 ? 'disabled' : '') + ' onclick="WorkerLedger.load(' + (st.page - 1) + ')">Prev</button>');
        $p.append('<span style="font-size:13px;">' + st.page + ' / ' + pages + '</span>');
        $p.append('<button class="btn-pri ms-1" ' + (st.page >= pages ? 'disabled' : '') + ' onclick="WorkerLedger.load(' + (st.page + 1) + ')">Next</button>');
    }

    // ── token ───────────────────────────────────────────────────────────────
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function tokenRef(type, id, d) {
        return (type === 'Artisan' ? 'K' : 'M') + id + '-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + pad(d.getHours()) + pad(d.getMinutes());
    }
    var MON_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var MON_BN = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
    function tkMonth(i) { return (lang() === 'bn' && TOKEN_BN_DIGITS ? MON_BN : MON_EN)[i]; }
    function tkDate(v) {           // 'yyyy-MM-dd ...' -> dd-Mon-yyyy with token digits / month names
        var m = v && String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
        return m ? tkNum(m[3] + '-' + tkMonth(+m[2] - 1) + '-' + m[1]) : '-';
    }
    function printedAt(d) {
        var mon = tkMonth(d.getMonth());
        var h = d.getHours(), ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
        return pad(d.getDate()) + '-' + mon + '-' + d.getFullYear() + ' ' + pad(h) + ':' + pad(d.getMinutes()) + ' ' + ap;
    }
    function printedShort(d) {     // narrow paper: dd-MM-yy hh:mm AM
        var h = d.getHours(), ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
        return pad(d.getDate()) + '-' + pad(d.getMonth() + 1) + '-' + String(d.getFullYear()).slice(2) + ' ' + pad(h) + ':' + pad(d.getMinutes()) + ' ' + ap;
    }
    function shopInfo() {
        return {
            name: $('#printInsName').text().trim() || sessionStorage.getItem('institutionName') || '',
            address: $('#printInsAddress').text().trim(),
            phone: $('#printInsPhone').text().replace(/^\s*Phone:\s*/i, '').trim()
        };
    }

    /** Build the token HTML (exposed for tests). */
    function buildToken(res, opts) {
        opts = opts || {};
        var now = opts.now || new Date();
        var shop = opts.shop || shopInfo();
        var s = res.summary, w = res.worker, type = res.workerType;
        var parts = (res.dueByDress || []).map(function (g) {
            return esc(g.dress) + ' ' + tkNum(g.qty) + t('tkPcs') + ' ' + tkNum(moneyShort(g.due));
        });
        (res.dueExtras || []).forEach(function (g) {      // other payments (অন্যান্য পাওনা) still due
            parts.push(esc(extraTypeName(g.type)) + (g.items > 1 ? ' (' + tkNum(g.items) + ')' : '') + ' ' + tkNum(moneyShort(g.due)));
        });
        if (num(res.openingDue) > 0.005) parts.push(esc(t('opening')) + ' ' + tkNum(moneyShort(res.openingDue)));
        var workLine = parts.length ? parts.join(', ') : esc(t('tkNothing'));
        var paidSoFar = num(s.paid) + num(s.adjustment);
        var html =
            '<div class="tk' + (opts.detail ? ' tk-wide' : '') + '">' +
            '<div class="tk-shop">' + esc(shop.name) + '</div>' +
            (shop.address ? '<div class="tk-sub">' + esc(shop.address) + '</div>' : '') +
            (shop.phone ? '<div class="tk-sub">' + t('phone') + ': ' + esc(tkNum(shop.phone)) + '</div>' : '') +
            '<div class="tk-title">' + t('tkTitle') + '</div>' +
            '<div class="tk-row tk-fit"><span>' + t('tkRef') + ': <b>' + esc(tkNum(tokenRef(type, w.workerId, now))) + '</b></span>' +
            '<span data-short="' + esc(t('tkPrinted') + ': ' + tkNum(printedShort(now))) + '">' + t('tkPrinted') + ': ' + esc(tkNum(printedAt(now))) + '</span></div>' +
            '<div class="tk-hr"></div>' +
            '<div class="tk-row tk-fit tk-who"><span class="tk-name" title="' + esc(w.name) + '">' + esc(w.name) + '</span>' +
            '<span>' + t('tkType') + ': ' + esc(typeName(type)) + '</span>' + (w.phone ? '<span>' + esc(tkNum(w.phone)) + '</span>' : '') + '</div>' +
            '<div class="tk-hr"></div>' +
            '<div class="tk-work"><b>' + t('tkWork') + ':</b> ' + workLine + '</div>' +
            '<div class="tk-hr"></div>' +
            '<table class="tk-amt">' +
            '<tr><td>' + t('tkEarned') + '</td><td>' + esc(tkNum(moneyShort(s.earned))) + '</td></tr>' +
            '<tr><td>' + t('tkPaid') + '</td><td>' + esc(tkNum(moneyShort(paidSoFar))) + '</td></tr>' +
            (num(s.payable) < -0.005
                ? '<tr class="tk-payable"><td>' + t('tkAdvance') + '</td><td>' + esc(tkNum(moneyShort(-num(s.payable)))) + '</td></tr>'
                : '<tr class="tk-payable"><td>' + t('tkPayable') + '</td><td>' + esc(tkNum(moneyShort(s.payable))) + '</td></tr>') +
            '</table>' +
            '<div class="tk-hr"></div>' +
            '<div class="tk-blanks tk-fit"><div class="tk-blank"><span>' + t('tkGiven') + ':</span><span class="tk-line"></span></div>' +
            '<div class="tk-blank"><span>' + t('tkDate') + ':</span><span class="tk-line"></span></div></div>' +
            '<div class="tk-sign"><div>' + (type === 'Artisan' ? t('tkSignArtisan') : t('tkSignMaster')) + '</div><div>' + t('tkSignCashier') + '</div></div>' +
            '<div class="tk-note">* ' + t('tkNote') + '</div>';
        if (opts.detail && res.dueItems && res.dueItems.length) {
            html += '<div class="tk-items"><div style="font-weight:700;margin:8px 0 3px;">' + t('tkItems') + '</div><table>' +
                '<tr><th>' + t('date') + '</th><th>' + t('order') + '</th><th>' + t('dress') + '</th><th>' + t('qty') + '</th><th>' + t('amount') + '</th><th>' + t('alloc') + '</th><th>' + t('due') + '</th></tr>';
            res.dueItems.forEach(function (x) {
                var isOpen = x.kind === 'opening', isExtra = x.kind === 'extra';
                html += '<tr><td>' + (isOpen ? '-' : esc(tkDate(x.date))) + '</td><td>' + (x.orderNo ? '#' + esc(tkNum(x.orderNo)) : '-') + '</td>' +
                    '<td>' + (isOpen ? esc(t('opening')) : isExtra ? esc(extraTypeName(x.extraType) + (x.dress ? ' - ' + x.dress : '')) : esc(x.dress || '-')) + '</td>' +
                    '<td>' + (isOpen || isExtra ? '-' : esc(tkNum(x.qty) + (x.ofQty > x.qty ? '/' + tkNum(x.ofQty) : ''))) + '</td>' +
                    '<td>' + esc(tkNum(moneyShort(x.amount))) + '</td><td>' + esc(tkNum(moneyShort(x.paid))) + '</td><td>' + esc(tkNum(moneyShort(x.due))) + '</td></tr>';
            });
            html += '</table></div>';
        }
        return html + '</div>';
    }

    // ── token paper size ─────────────────────────────────────────────────────
    // Default = the measurement-print size ("প্রিন্ট সাইজ" on money-receipt.html), read through the same
    // TailorBD.printSizePref (app-components.js: localStorage 'tailorbd_printSize_<registrationId>', default 4 inch).
    // The token selector can override it per shop with 58mm / 80mm / A5 / A4.
    var TK_SIZES = ['auto', '58mm', '80mm', 'A5', 'A4'];
    function tokenSizeKey() { return 'tailorbd_tokenSize_' + instId(); }
    function tokenSizeChoice() { var v = null; try { v = localStorage.getItem(tokenSizeKey()); } catch (e) { } return TK_SIZES.indexOf(v) >= 0 ? v : 'auto'; }
    function measurementPrintSize() {
        var p = window.TailorBD && window.TailorBD.printSizePref;
        if (p && typeof p.get === 'function') return p.get();
        // fallback with the same key / default as printSizePref, in case app-components.js is not loaded
        var valid = ['3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5'];
        var reg = sessionStorage.getItem('registrationId') || localStorage.getItem('session_registrationId') || '';
        var key = reg ? 'tailorbd_printSize_' + reg : 'tailorbd_printSize_inst_' + (sessionStorage.getItem('institutionId') || localStorage.getItem('session_institutionId') || '');
        var v = ''; try { v = String(localStorage.getItem(key) || '').trim(); } catch (e) { }
        return valid.indexOf(v) >= 0 ? v : '4';
    }
    /** { w, h?, margin, sheet, label } in mm. Item list (detail) with the default size prints on A4, as the checkbox says. */
    function tokenPaper(detail, choice) {
        var c = choice || tokenSizeChoice();
        if (c === 'auto' && detail) c = 'A4';
        if (c === 'A4') return { sheet: true, w: 210, h: 297, margin: 10, label: 'A4' };
        if (c === 'A5') return { sheet: true, w: 148, h: 210, margin: 8, label: 'A5' };
        if (c === '58mm' || c === '80mm') return { w: parseInt(c, 10), margin: 0, label: c };
        var inch = measurementPrintSize();
        return { w: Math.round(parseFloat(inch) * 254) / 10, margin: 0, label: inch + ' inch', inch: inch };
    }
    function tokenScale(paper) {
        if (paper.sheet) return paper.label === 'A4' ? 1.45 : 1.2;
        return Math.min(1.2, Math.max(0.82, (paper.w - 5) / 75));
    }
    // keep a one-row line on one row: shrink its font until it fits (min 60%), wrap only as a last resort.
    // The name / type / phone row never wraps: font down to 80%, then a long name is cut with "…".
    function fitRows(root) {
        $(root).find('.tk-fit').each(function () {
            var el = this, who = el.classList.contains('tk-who');
            el.style.fontSize = ''; el.classList.remove('tk-wrap'); el.classList.add('tk-fitting');
            var fs0 = parseFloat(window.getComputedStyle(el).fontSize) || 12, fs = fs0, min = fs0 * (who ? 0.8 : 0.6);
            var over = function () { return el.scrollWidth > el.clientWidth + 1; };
            while (over() && fs > fs0 * 0.85) { fs -= 0.25; el.style.fontSize = fs + 'px'; }
            if (over()) {           // still too wide: use the short form (e.g. printed date) before shrinking further
                $(el).find('[data-short]').each(function () { this.textContent = this.getAttribute('data-short'); });
                fs = fs0; el.style.fontSize = '';
            }
            while (over() && fs > min) { fs -= 0.25; el.style.fontSize = fs + 'px'; }
            el.classList.remove('tk-fitting');
            if (!who && el.scrollWidth > el.clientWidth + 1) el.classList.add('tk-wrap');
        });
    }
    /** Lay the token out for the paper (content width, font scale, one-row fits) and return the content height in mm.
     *  Like money-receipt's measurement print only the CONTENT width is fixed (max-width = size, centred, from the top);
     *  the paper and orientation stay the browser's choice. A5 / A4: full page width (max = page - margins). */
    function layoutToken(paper) {
        var area = document.getElementById('tokenPrintArea');
        var contentW = paper.sheet ? paper.w - 2 * paper.margin : paper.w;
        area.style.width = '100%';
        area.style.maxWidth = contentW + 'mm';
        area.style.padding = paper.sheet ? '0' : '6px 4px';      // = .measurements-main-container padding
        area.style.boxSizing = 'border-box';
        var tk = area.querySelector('.tk');
        if (tk) tk.style.fontSize = (10.5 * tokenScale(paper)).toFixed(2) + 'pt';
        area.classList.add('tk-measure');
        fitRows(area);
        var hMm = area.getBoundingClientRect().height * 25.4 / 96;
        area.classList.remove('tk-measure');
        return hMm;
    }
    // no page SIZE on purpose (Chrome would hide Portrait/Landscape and scale/centre the page); margins only,
    // like money-receipt.css (@page margin 0 for the measurement sizes).
    function setTokenPageCss(paper) {
        var css = '@page { margin: ' + (paper.sheet ? paper.margin + 'mm' : '0') + '; }';
        var el = document.getElementById('tkPageCss');
        if (!el) { el = document.createElement('style'); el.id = 'tkPageCss'; document.head.appendChild(el); }
        el.textContent = '@media print { html, body { height:auto !important; min-height:0 !important; } } ' + css;
    }
    function clearTokenPageCss() { var el = document.getElementById('tkPageCss'); if (el) el.parentNode.removeChild(el); }
    function refreshSizeSelect() {
        var $s = $('#lgTokenSize');
        if (!$s.length) return;
        $s.find('option[value="auto"]').text(t('tkSizeAuto') + ' (' + measurementPrintSize() + ' inch)');
        $s.val(tokenSizeChoice());
    }

    function printToken(type, workerId) {
        type = type || st.type;
        if (!workerId) return;
        var detail = $('#lgTokenDetail').is(':checked');
        $.get('/api/WorkerLedger/ledger', { institutionId: instId(), workerType: type, workerId: workerId, pageSize: 1, includeDue: detail })
            .done(function (res) {
                if (!res || !res.success) { alert(t('err')); return; }
                if (num(res.summary.payable) <= 0.005 && !confirm(t('zeroPayable'))) return;
                var paper = tokenPaper(detail);
                $('#tokenPrintArea').html(buildToken(res, { detail: detail }));
                layoutToken(paper);
                setTokenPageCss(paper);
                $('body').addClass('printing-token');
                var done = function () { $('body').removeClass('printing-token'); clearTokenPageCss(); window.removeEventListener('afterprint', done); };
                window.addEventListener('afterprint', done);
                window.print();
                setTimeout(done, 1500);
            }).fail(function (x) { alert(errText(x)); });
    }

    // ── tabs & wiring ───────────────────────────────────────────────────────
    function switchTab(name, selectId) {
        $('.wp-tab-btn').removeClass('active');
        $('.wp-tab-btn[data-tab="' + name + '"]').addClass('active');
        $('.wp-pane').hide();
        $('#tab-' + name).show();
        $('#btnPrintHistory').toggle(name === 'history');
        if (name === 'ledger') loadWorkerOptions(selectId == null ? null : selectId, function () { load(1); });
        if (name === 'pay' && window.WorkerPay) WorkerPay.activate(selectId);   // worker-pay.js
    }
    function setType(type) {
        st.type = type === 'CuttingMaster' ? 'CuttingMaster' : 'Artisan';   // artisan first / default
        $('#lgTypeSeg button').removeClass('active');
        $('#lgTypeSeg button[data-type="' + st.type + '"]').addClass('active');
    }

    window.WorkerLedger = {
        load: load,
        open: function (workerId) { setWorker(workerId); st.page = 1; load(1); },
        printToken: printToken,
        buildToken: buildToken,
        tokenRef: tokenRef,
        tokenPaper: tokenPaper,
        layoutToken: layoutToken,
        setTokenPageCss: setTokenPageCss,
        measurementPrintSize: measurementPrintSize,
        statusFilter: statusFilter,
        extraTypeName: extraTypeName,
        payableHtml: payableHtml,
        /** open the ledger tab for one worker (used by the pay tab) */
        show: function (type, workerId) { setType(type); st.optionsFor = null; switchTab('ledger', workerId); },
        setType: function (type) { setType(type); st.optionsFor = null; $('#lgWorker').val(''); loadWorkerOptions(null, function () { load(1); }); }
    };
    window.switchWpTab = switchTab;

    function ready() {
        $('#lgTypeSeg').on('click', 'button', function () { WorkerLedger.setType($(this).data('type')); });
        $('#lgWorker').on('change', function () { load(1); });
        $('#lgFrom, #lgTo').on('change', function () { load(1); });
        bindStatus();
        refreshSizeSelect();
        $('#lgTokenSize').on('change', function () { try { localStorage.setItem(tokenSizeKey(), $(this).val()); } catch (e) { } })
            .on('focus mousedown', refreshSizeSelect);   // measurement size may have been changed in another tab
        var q = new URLSearchParams(location.search);
        if (q.get('tab') === 'ledger') {
            setType(q.get('type') || 'Artisan');
            switchTab('ledger', q.get('workerId') || null);
        }
    }
    $(document).ready(function () {
        if (!instId()) $(document).on('app-session-ready', ready); else ready();
    });
    $(document).on('languageChanged', function () {
        refreshSizeSelect();
        statusSummary();
        if ($('#tab-ledger').is(':visible')) { st.optionsFor = null; loadWorkerOptions($('#lgWorker').val() || null, function () { load(st.page); }); }
    });
})();
