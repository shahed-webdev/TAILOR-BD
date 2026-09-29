/* worker-pay.js — "কারিগর পেমেন্ট" tab of worker-payments.html
 * Pay a worker (artisan / cutting master) with OTP — amount may exceed the balance (advance / অগ্রিম),
 * add / edit / delete other payments (অন্যান্য পাওনা: extra design, alteration, other), print the payment token,
 * open the work ledger / payment history. Moved here from factory-issue.html / cutting-issue.html.
 * API (login + shop from the token):
 *   GET  /api/WorkerLedger/workers, GET/POST/PUT/DELETE /api/WorkerLedger/extras
 *   POST /api/Factory/artisans/send-otp|pay, POST /api/Cutting/masters/send-otp|pay
 */
(function () {
    'use strict';

    var TK = '৳\u00a0';
    var LANG = {
        pick: ['— কর্মী বাছাই করুন —', '— Choose a worker —'],
        name: ['নাম', 'Name'], phone: ['ফোন', 'Phone'], earned: ['মোট আয়', 'Total earned'], paid: ['মোট পরিশোধ', 'Total paid'],
        payable: ['মোট পাওনা', 'Payable balance'], advance: ['অগ্রিম', 'Advance'], advanceCard: ['অগ্রিম (বেশি পরিশোধ)', 'Advance (paid ahead)'],
        action: ['অ্যাকশন', 'Action'], open: ['খুলুন', 'Open'], pay: ['পেমেন্ট', 'Pay'],
        date: ['তারিখ', 'Date'], type: ['ধরন', 'Type'], order: ['অর্ডার', 'Order'], ref: ['ড্রেস / রেফারেন্স', 'Dress / reference'],
        note: ['নোট', 'Note'], amount: ['পরিমাণ', 'Amount'], alloc: ['পরিশোধ', 'Paid'], status: ['স্ট্যাটাস', 'Status'],
        st_paid: ['পরিশোধিত', 'Paid'], st_partial: ['আংশিক', 'Partial'], st_unpaid: ['বাকি', 'Unpaid'], st_none: ['-', '-'],
        noData: ['কোনো ডাটা নেই', 'No data'], noExtras: ['কোনো অন্যান্য পাওনা নেই', 'No other payments'], err: ['সমস্যা হয়েছে', 'Something went wrong'],
        locked: ['পরিশোধ হয়ে গেছে — এডিট/ডিলিট করা যাবে না', 'Already paid — cannot edit / delete'],
        noTable: ['অন্যান্য পাওনা চালু হয়নি: ডাটাবেসে 01_create_WorkerExtraEarning.sql রান করুন।', 'Other payments not enabled yet: run 01_create_WorkerExtraEarning.sql on the database.'],
        noteAdvance: ['এই কর্মীকে ৳\u00a0{0} অগ্রিম দেওয়া আছে — পরের কাজের আয় ও অন্যান্য পাওনা থেকে এটি আগে সমন্বয় হবে।', 'This worker has an advance of ৳\u00a0{0} — later earnings and other payments are set off against it first.'],
        noteExtraDue: ['বাকি অন্যান্য পাওনা: ৳\u00a0{0} — পেমেন্ট টোকেনে এটি যুক্ত থাকবে।', 'Other payments due: ৳\u00a0{0} — included on the payment token.'],
        enterAmount: ['পরিমাণ দিন (০ এর বেশি)', 'Enter an amount greater than 0'], otpRequired: ['OTP দিন', 'Enter OTP'], otpSent: ['OTP পাঠানো হয়েছে', 'OTP sent'],
        overBal: ['ব্যালেন্সের চেয়ে ৳\u00a0{0} বেশি — বাড়তি অংশ অগ্রিম হিসেবে থাকবে, পরের কাজের আয় থেকে সমন্বয় হবে।', '৳\u00a0{0} more than the balance — the excess is kept as an advance and set off against later earnings.'],
        allAdvance: ['ব্যালেন্সে কোনো পাওনা নেই — পুরো ৳\u00a0{0} অগ্রিম হিসেবে যাবে।', 'Nothing is payable — the whole ৳\u00a0{0} is an advance.'],
        confirmAdvance: ['পরিমাণ ব্যালেন্সের চেয়ে বেশি। ৳\u00a0{0} অগ্রিম হিসেবে দেওয়া হবে। নিশ্চিত?', 'Amount is more than the balance. ৳\u00a0{0} will be an advance. Continue?'],
        paidOk: ['পেমেন্ট সম্পন্ন', 'Payment saved'], paidAdv: ['পেমেন্ট সম্পন্ন। অগ্রিম: ৳\u00a0{0}', 'Payment saved. Advance: ৳\u00a0{0}'],
        saved: ['সেভ হয়েছে', 'Saved'], deleted: ['ডিলিট হয়েছে', 'Deleted'], confirmDelete: ['এই অন্যান্য পাওনাটি ডিলিট করবেন?', 'Delete this other payment?'],
        chooseType: ['ধরন বাছাই করুন', 'Choose a type'], addExtra: ['অন্যান্য পাওনা যোগ করুন', 'Add other payment'], editExtra: ['অন্যান্য পাওনা এডিট', 'Edit other payment'],
        xt_ExtraDesign: ['এক্সট্রা ডিজাইন', 'Extra design'], xt_Alter: ['অলটার', 'Alteration'], xt_Other: ['অন্যান্য', 'Other'],
        balNow: ['বর্তমান ব্যালেন্স', 'Current balance']
    };

    var st = { type: 'Artisan', workerId: null, name: '', balance: 0, list: [], optionsFor: null, available: true, payBusy: false, extraBusy: false };

    function lang() { var l = window.currentLang || localStorage.getItem('preferredLanguage') || 'bn'; return l === 'en' ? 'en' : 'bn'; }
    function t(k) { var v = LANG[k]; return v ? v[lang() === 'en' ? 1 : 0] : k; }
    function fmtS(k) { var s = t(k), a = arguments; return s.replace(/\{(\d)\}/g, function (m, i) { return a[+i + 1]; }); }
    function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
    function num(v) { v = Number(v || 0); return isFinite(v) ? v : 0; }
    function amount2(v) { return num(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    function money(v) { return TK + amount2(v); }
    function balHtml(v) { v = num(v); return v < -0.005 ? '<span style="color:#1565c0;">' + esc(t('advance')) + ' ' + money(-v) + '</span>' : money(v); }
    function balText(v) { v = num(v); return v < -0.005 ? t('advance') + ' ' + money(-v) : money(v); }
    function xtName(x) { return t('xt_' + (x === 'ExtraDesign' || x === 'Alter' ? x : 'Other')); }
    function stBadge(s) { return '<span class="st-badge st-' + esc(s) + '">' + esc(t('st_' + s)) + '</span>'; }
    function fmtDate(v) {
        var m = v && String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (!m) return v ? String(v) : '-';
        return m[3] + '-' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m[2] - 1] + '-' + m[1];
    }
    function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
    function instId() { return parseInt(sessionStorage.getItem('institutionId') || '0', 10); }
    function regId() { return parseInt(sessionStorage.getItem('registrationId') || '0', 10); }
    function errText(xhr) { return (xhr && xhr.responseJSON && xhr.responseJSON.message) || t('err'); }
    function payApi() {
        return st.type === 'Artisan'
            ? { otp: '/api/Factory/artisans/send-otp', pay: '/api/Factory/artisans/pay' }
            : { otp: '/api/Cutting/masters/send-otp', pay: '/api/Cutting/masters/pay' };
    }
    function modal(id) { return bootstrap.Modal.getOrCreateInstance(document.getElementById(id)); }

    // ── worker list / dropdown ──────────────────────────────────────────────
    function loadWorkers(selectId, done) {
        $.get('/api/WorkerLedger/workers', { institutionId: instId(), workerType: st.type, pageSize: 500 }).done(function (res) {
            st.list = (res && res.data) || [];
            st.optionsFor = st.type;
            var $w = $('#wpWorker').empty().append('<option value="">' + esc(t('pick')) + '</option>');
            st.list.forEach(function (w) {
                $w.append('<option value="' + w.workerId + '">' + esc(w.name) + (w.phone ? ' (' + esc(w.phone) + ')' : '') + '</option>');
            });
            if (selectId) $w.val(String(selectId));
            if (window.WorkerSelect) WorkerSelect.refresh($w[0]);
            if (done) done();
        }).fail(function (x) { $('#wpListBody').html('<tr><td colspan="6" class="no-data">' + esc(errText(x)) + '</td></tr>'); if (done) done(); });
    }

    function renderList() {
        var $b = $('#wpListBody').empty();
        if (!st.list.length) { $b.append('<tr><td colspan="6" class="no-data">' + t('noData') + '</td></tr>'); return; }
        st.list.forEach(function (w) {
            $b.append('<tr>' +
                '<td style="font-weight:600;">' + esc(w.name) + (w.isActive ? '' : ' <small class="text-muted">(inactive)</small>') + '</td>' +
                '<td>' + esc(w.phone || '-') + '</td>' +
                '<td>' + money(w.earned) + '</td>' +
                '<td>' + money(w.paid) + '</td>' +
                '<td><strong>' + balHtml(w.payable) + '</strong></td>' +
                '<td class="no-print" style="white-space:nowrap;"><button class="btn-edit" onclick="WorkerPay.select(' + w.workerId + ')"><i class="fas fa-folder-open"></i> ' + t('open') + '</button></td>' +
                '</tr>');
        });
    }

    function showList() {
        st.workerId = null;
        $('#wpDetail').hide(); $('#wpList').show();
        renderList();
    }

    // ── one worker: summary + other payments ───────────────────────────────
    function loadDetail() {
        if (!st.workerId) { showList(); return; }
        $('#wpList').hide(); $('#wpDetail').show();
        $('#wpExtraBody').html('<tr><td colspan="9" class="no-data"><i class="fas fa-spinner fa-spin"></i></td></tr>');
        $.get('/api/WorkerLedger/extras', { institutionId: instId(), workerType: st.type, workerId: st.workerId }).done(function (res) {
            if (!res || !res.success) { $('#wpExtraBody').html('<tr><td colspan="9" class="no-data">' + t('err') + '</td></tr>'); return; }
            var s = res.summary;
            st.name = res.worker.name; st.balance = num(s.payable); st.available = !!res.available;
            var who = '<div style="font-size:11px;color:#777;margin-top:2px;">' + esc(res.worker.name) + (res.worker.phone ? ' · ' + esc(res.worker.phone) : '') + '</div>';
            $('#wpCards').html(
                '<div class="sum-card"><div class="lbl">' + t('earned') + '</div><div class="val">' + money(s.earned) + '</div>' + who + '</div>' +
                '<div class="sum-card" style="border-top-color:#28a745;"><div class="lbl">' + t('paid') + '</div><div class="val" style="color:#1e7e34;">' + money(s.paid) + '</div></div>' +
                (st.balance < -0.005
                    ? '<div class="sum-card" style="border-top-color:#1565c0;"><div class="lbl">' + t('advanceCard') + '</div><div class="val" style="color:#1565c0;">' + money(-st.balance) + '</div></div>'
                    : '<div class="sum-card" style="border-top-color:#e74c3c;"><div class="lbl">' + t('payable') + '</div><div class="val" style="color:#c0392b;">' + money(st.balance) + '</div></div>'));
            var notes = [];
            if (!st.available) notes.push(t('noTable'));
            if (st.balance < -0.005) notes.push(fmtS('noteAdvance', amount2(-st.balance)));
            if (num(s.extraDue) > 0.005) notes.push(fmtS('noteExtraDue', amount2(s.extraDue)));
            $('#wpNote').html(notes.map(esc).join('<br>')).toggle(notes.length > 0);
            $('#wpBtnExtra').prop('disabled', !st.available);
            renderExtras(res.data || []);
        }).fail(function (x) { $('#wpExtraBody').html('<tr><td colspan="9" class="no-data">' + esc(errText(x)) + '</td></tr>'); });
    }

    function renderExtras(rows) {
        st.extras = rows;
        var $b = $('#wpExtraBody').empty();
        if (!rows.length) { $b.append('<tr><td colspan="9" class="no-data">' + t('noExtras') + '</td></tr>'); return; }
        rows.forEach(function (x, i) {
            var act = x.canEdit
                ? '<button class="btn-edit me-1" title="Edit" onclick="WorkerPay.editExtra(' + i + ')"><i class="fas fa-pen"></i></button>' +
                  '<button class="btn-edit" style="color:#c0392b;background:#fdecec;" title="Delete" onclick="WorkerPay.deleteExtra(' + x.id + ')"><i class="fas fa-trash"></i></button>'
                : '<i class="fas fa-lock text-muted" title="' + esc(t('locked')) + '"></i>';
            $b.append('<tr>' +
                '<td>' + esc(fmtDate(x.date)) + '</td>' +
                '<td><span class="st-badge" style="background:#e8f0fe;color:#1a56b0;">' + esc(xtName(x.type)) + '</span></td>' +
                '<td>' + (x.orderNo ? '#' + esc(x.orderNo) + (x.customer ? ' <small class="text-muted">' + esc(x.customer) + '</small>' : '') : '-') + '</td>' +
                '<td>' + esc(x.dressRef || '-') + '</td>' +
                '<td>' + esc(x.note || '-') + '</td>' +
                '<td><strong>' + money(x.amount) + '</strong></td>' +
                '<td>' + money(x.paid) + '</td>' +
                '<td>' + stBadge(x.status) + '</td>' +
                '<td class="no-print" style="white-space:nowrap;">' + act + '</td></tr>');
        });
    }

    // ── pay (OTP; advance allowed) ─────────────────────────────────────────
    function openPay() {
        if (!st.workerId) return;
        $('#wpPayName').text(st.name);
        $('#wpPayBal').html(balHtml(st.balance));
        $('#wpPayAmount, #wpPayNotes, #wpPayOtp').val('');
        $('#wpPayHint, #wpPayOtpHint').text('');
        modal('wpPayModal').show();
    }
    function payHint() {
        var a = num($('#wpPayAmount').val());
        var $h = $('#wpPayHint');
        if (!(a > 0)) { $h.text(''); return; }
        if (st.balance <= 0.005) $h.text(fmtS('allAdvance', amount2(a)));
        else if (a > st.balance + 0.005) $h.text(fmtS('overBal', amount2(a - st.balance)));
        else $h.text('');
    }
    function sendOtp() {
        var amount = num($('#wpPayAmount').val());
        if (!st.workerId || !(amount > 0)) { alert(t('enterAmount')); return; }
        $('#wpPayOtpHint').text('...');
        $.ajax({ url: payApi().otp, method: 'POST', contentType: 'application/json',
                 data: JSON.stringify({ InstitutionID: instId(), WorkerID: st.workerId, Amount: amount }) })
            .done(function (res) {
                if (!res.success) { alert(res.message || t('err')); $('#wpPayOtpHint').text(''); return; }
                $('#wpPayOtpHint').text(t('otpSent') + (res.phoneMasked ? ' -> ' + res.phoneMasked : ''));
            })
            .fail(function (x) { $('#wpPayOtpHint').text(''); alert(errText(x)); });
    }
    function submitPay() {
        if (st.payBusy) return;
        var amount = num($('#wpPayAmount').val());
        var otp = ($('#wpPayOtp').val() || '').trim();
        if (!st.workerId || !(amount > 0)) { alert(t('enterAmount')); return; }
        if (!otp) { alert(t('otpRequired')); return; }
        var adv = amount - Math.max(st.balance, 0);
        if (adv > 0.005 && !confirm(fmtS('confirmAdvance', amount2(adv)))) return;
        st.payBusy = true; $('#wpPaySubmit').prop('disabled', true);
        $.ajax({ url: payApi().pay, method: 'POST', contentType: 'application/json',
                 data: JSON.stringify({ InstitutionID: instId(), RegistrationID: regId(), WorkerID: st.workerId, Amount: amount,
                                        Notes: $('#wpPayNotes').val() || null, Otp: otp }) })
            .done(function (res) {
                if (!res.success) { alert(res.message || t('err')); return; }
                modal('wpPayModal').hide();
                alert(num(res.advance) > 0.005 ? fmtS('paidAdv', amount2(res.advance)) : t('paidOk'));
                refresh();
            })
            .fail(function (x) { alert(errText(x)); })
            .always(function () { st.payBusy = false; $('#wpPaySubmit').prop('disabled', false); });
    }

    // ── other payments (অন্যান্য পাওনা) ─────────────────────────────────────
    function openExtra(row) {
        if (!st.workerId) return;
        $('#wpExtraTitle').text(row ? t('editExtra') : t('addExtra'));
        $('#wpExtraWho').text(st.name);
        $('#wpExtraId').val(row ? row.id : '');
        $('#wpExtraType').val(row ? row.type : '');
        $('#wpExtraAmount').val(row ? row.amount : '');
        $('#wpExtraDate').val(row && row.date ? String(row.date).substring(0, 10) : today()).attr('max', today());
        $('#wpExtraOrder').val(row && row.orderNo ? row.orderNo : '');
        $('#wpExtraDress').val(row ? (row.dressRef || '') : '');
        $('#wpExtraNotes').val(row ? (row.note || '') : '');
        modal('wpExtraModal').show();
    }
    function saveExtra() {
        if (st.extraBusy) return;
        var id = parseInt($('#wpExtraId').val() || '0', 10);
        var type = $('#wpExtraType').val();
        var amount = num($('#wpExtraAmount').val());
        if (!type) { alert(t('chooseType')); return; }
        if (!(amount > 0)) { alert(t('enterAmount')); return; }
        var orderNo = parseInt($('#wpExtraOrder').val() || '0', 10);
        var body = {
            InstitutionID: instId(), RegistrationID: regId(), WorkerExtraEarningID: id || 0,
            WorkerType: st.type, WorkerID: st.workerId, EarningType: type, Amount: Math.round(amount * 100) / 100,
            EarningDate: $('#wpExtraDate').val() || null, OrderNo: orderNo > 0 ? orderNo : null,
            DressRef: $('#wpExtraDress').val() || null, Notes: $('#wpExtraNotes').val() || null
        };
        st.extraBusy = true; $('#wpExtraSave').prop('disabled', true);
        $.ajax({ url: '/api/WorkerLedger/extras', method: id ? 'PUT' : 'POST', contentType: 'application/json', data: JSON.stringify(body) })
            .done(function (res) {
                if (!res.success) { alert(res.message || t('err')); return; }
                modal('wpExtraModal').hide();
                refresh();
            })
            .fail(function (x) { alert(errText(x)); })
            .always(function () { st.extraBusy = false; $('#wpExtraSave').prop('disabled', false); });
    }
    function deleteExtra(id) {
        if (!id || !confirm(t('confirmDelete'))) return;
        $.ajax({ url: '/api/WorkerLedger/extras?id=' + encodeURIComponent(id) + '&institutionId=' + instId(), method: 'DELETE' })
            .done(function (res) { if (!res.success) { alert(res.message || t('err')); return; } refresh(); })
            .fail(function (x) { alert(errText(x)); });
    }

    function refresh() {
        // list balances change too (pay / other payment)
        loadWorkers(st.workerId, function () { if (st.workerId) loadDetail(); else showList(); });
    }

    function setType(type) {
        st.type = type === 'CuttingMaster' ? 'CuttingMaster' : 'Artisan';
        $('#wpTypeSeg button').removeClass('active');
        $('#wpTypeSeg button[data-type="' + st.type + '"]').addClass('active');
    }
    function select(id) {
        st.workerId = id ? parseInt(id, 10) : null;
        if (window.WorkerSelect) WorkerSelect.setValue('#wpWorker', st.workerId || ''); else $('#wpWorker').val(st.workerId ? String(st.workerId) : '');
        loadDetail();
    }
    function activate(selectId) {
        loadWorkers(selectId, function () {
            if (selectId) select(selectId); else if (st.workerId) loadDetail(); else showList();
        });
    }

    window.WorkerPay = {
        activate: activate,
        select: select,
        setType: function (type) { setType(type); st.workerId = null; activate(null); },
        editExtra: function (i) { openExtra(st.extras[i]); },
        deleteExtra: deleteExtra
    };

    function ready() {
        $('#wpTypeSeg').on('click', 'button', function () { WorkerPay.setType($(this).data('type')); });
        $('#wpWorker').on('change', function () { var v = $(this).val(); if (String(v || '') !== String(st.workerId || '')) select(v); });
        $('#wpBackList').on('click', function () { select(null); });
        $('#wpBtnPay').on('click', openPay);
        $('#wpBtnExtra').on('click', function () { openExtra(null); });
        $('#wpBtnToken').on('click', function () { if (st.workerId && window.WorkerLedger) WorkerLedger.printToken(st.type, st.workerId); });
        $('#wpBtnLedger').on('click', function () { if (st.workerId && window.WorkerLedger) WorkerLedger.show(st.type, st.workerId); });
        $('#wpBtnHistory').on('click', function () { if (st.workerId) location.href = '/worker-payments.html?type=' + encodeURIComponent(st.type) + '&workerId=' + st.workerId; });
        $('#wpPayAmount').on('input', payHint);
        $('#wpPayOtpBtn').on('click', sendOtp);
        $('#wpPaySubmit').on('click', submitPay);
        $('#wpExtraSave').on('click', saveExtra);

        // default tab: "কারিগর পেমেন্ট" unless the URL asks for another tab (legacy ?type=&workerId= = payment history)
        var q = new URLSearchParams(location.search), tab = q.get('tab');
        if (tab === 'pay' || (!tab && !q.get('workerId'))) {
            setType(q.get('type') || 'Artisan');
            window.switchWpTab('pay', tab === 'pay' ? (q.get('workerId') || null) : null);
        }
    }
    $(document).ready(function () {
        if (!instId()) $(document).on('app-session-ready', ready); else ready();
    });
    $(document).on('languageChanged', function () {
        if (!$('#tab-pay').is(':visible')) return;
        activate(st.workerId);
    });
})();
