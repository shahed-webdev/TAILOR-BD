/* factory-issue.js — optional Factory Issue workflow */
(function () {
    'use strict';

        /** Display dates as 21-Sep-2026 */
    function fmtDate(v) {
        if (v == null || v === '' || v === '-') return '-';
        var s = String(v).trim();
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        function build(day, monthNum, year) {
            var dd = ('0' + parseInt(day, 10)).slice(-2);
            var mon = months[parseInt(monthNum, 10) - 1] || '???';
            var yyyy = String(year);
            if (yyyy.length === 2) {
                var n = parseInt(yyyy, 10);
                yyyy = (n > 50 ? '19' : '20') + yyyy;
            }
            return dd + '-' + mon + '-' + yyyy;
        }
        // already 21-Sep-2026
        var m = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/);
        if (m) {
            var mi = months.indexOf(m[2].charAt(0).toUpperCase() + m[2].slice(1).toLowerCase());
            if (mi >= 0) return build(m[1], mi + 1, m[3]);
        }
        // dd/mm/yy or dd/mm/yyyy
        m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
        if (m) return build(m[1], m[2], m[3]);
        // ISO / yyyy-mm-dd / datetime
        m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (m) return build(m[3], m[2], m[1]);
        var d = new Date(s);
        if (!isNaN(d.getTime())) {
            return build(d.getDate(), d.getMonth() + 1, d.getFullYear());
        }
        return s;
    }




    let institutionId = 0;
    let registrationId = 0;

    const LANG = {
        noData: { bn: 'কোনো ডেটা নেই', en: 'No data' },
        noneFound: { bn: 'কোনো কারিগর পাওয়া যায়নি', en: 'No artisan found' },
        selectArtisan: { bn: 'কারিগর সিলেক্ট করুন', en: 'Select an artisan' },
        issued: { bn: 'কারখানা ইস্যু হয়েছে', en: 'Factory issued' },
        completed: { bn: 'সেলাই সম্পন্ন', en: 'Sewing completed' },
        saved: { bn: 'সংরক্ষিত', en: 'Saved' },
        deleted: { bn: 'মুছে ফেলা হয়েছে', en: 'Deleted' },
        confirmDel: { bn: 'মুছে ফেলবেন?', en: 'Delete?' },
        fillName: { bn: 'নাম দিন', en: 'Enter name' },
        assigned: { bn: 'এসাইন', en: 'Assigned' },
        done: { bn: 'সম্পন্ন', en: 'Completed' },
        active: { bn: 'সক্রিয়', en: 'Active' },
        inactive: { bn: 'নিষ্ক্রিয়', en: 'Inactive' },
        markDone: { bn: 'সেলাই সম্পন্ন', en: 'Mark sewing done' },
        reassign: { bn: 'রিঅ্যাসাইন', en: 'Reassign' },
        reassigned: { bn: 'নতুন কারিগরকে এসাইন হয়েছে', en: 'Reassigned' },
        allPersons: { bn: 'সব কারিগর', en: 'All artisans' },
        assign: { bn: 'এসাইন', en: 'Assign' },
        err: { bn: 'সমস্যা হয়েছে', en: 'Something went wrong' },

        balance: { bn: 'ব্যালেন্স', en: 'Balance' },
        pay: { bn: 'পেমেন্ট', en: 'Pay' },
        paid: { bn: 'পেমেন্ট সম্পন্ন', en: 'Payment saved' },
        enterAmount: { bn: 'পরিমাণ দিন', en: 'Enter amount' },
        advance: { bn: 'অগ্রিম', en: 'Advance' },
        payPageTip: { bn: 'পেমেন্ট / অন্যান্য পাওনা / টোকেন: কর্মী পেমেন্ট পেইজে', en: 'Pay / other payments / token: Worker Payments page' },
        otpSent: { bn: 'OTP পাঠানো হয়েছে', en: 'OTP sent' },
        otpRequired: { bn: 'OTP দিন', en: 'Enter OTP' },
        orderNoOnly: { bn: 'শুধু অর্ডার নম্বর লিখুন', en: 'Enter an order number only' },
        noPendingForOrder: { bn: 'এই অর্ডার নম্বরে কারখানা ইস্যু বাকি কোনো পোশাক নেই', en: 'No dress of this order number is waiting for factory issue' },
        orderExistsHint: { bn: 'অর্ডারটি আছে, তবে এর কোনো পোশাক এখন কারখানা ইস্যুর অপেক্ষায় নেই (কাটিং বাকি, অথবা ইস্যু হয়ে গেছে)', en: 'The order exists, but none of its dresses is waiting for factory issue (cutting not done yet, or already issued)' },
        orderNotFoundHint: { bn: 'এই নম্বরে কোনো অর্ডার পাওয়া যায়নি', en: 'No order with this number' },
        bulkDone: { bn: 'বাছাইকৃত সেলাই সম্পন্ন', en: 'Mark selected sewing done' },
        selectAllOpen: { bn: 'এই পাতার সব এসাইন লাইন বাছাই', en: 'Select all assigned lines on this page' },
        confirmBulk: { bn: '⚠ সব বাকি পিস একসাথে জমা হবে!\n{n} টি এসাইনমেন্ট — মোট {p} পিস:', en: '⚠ ALL remaining pieces will be submitted!\n{n} assignment(s) — {p} piece(s) in total:' },
        bulkRow: { bn: '• #{o} {d} ({a}) — {p} পিস', en: '• #{o} {d} ({a}) — {p} pc(s)' },
        bulkMore: { bn: '… আরও {n} টি', en: '… {n} more' },
        bulkHint: { bn: 'কিছু পিস (আংশিক) জমা দিতে "বাতিল / Cancel" চাপুন, তারপর সারির সবুজ "{b}" বাটন ব্যবহার করুন।\n\nসব পিস জমা দেবেন?', en: 'To submit only some pieces, press Cancel and use the row\'s green "{b}" button.\n\nSubmit all pieces?' },
        bulkResult: { bn: '{n} টি এসাইনমেন্টের {p} পিস সেলাই সম্পন্ন হয়েছে', en: '{p} piece(s) of {n} assignment(s) marked sewing done' },
        confirmOne: { bn: '#{o} {d}: {p} পিসের সেলাই সম্পন্ন করবেন?', en: '#{o} {d}: mark {p} piece(s) sewing done?' },
        piecesSaved: { bn: '{n} পিস জমা হয়েছে ({c}/{q}) — বাকি {r} পিস এসাইন থাকবে', en: '{n} piece(s) submitted ({c}/{q}) — {r} piece(s) stay assigned' },
        piecesDone: { bn: '{c}/{q} জমা', en: '{c}/{q} submitted' },
        pieceInfo: { bn: '#{o} — {d} ({a}) · মোট {q} পিস, জমা {c}, বাকি {r}', en: '#{o} — {d} ({a}) · {q} pcs, submitted {c}, open {r}' },
        pieceMax: { bn: '১ – {r} পিস', en: '1 – {r} pcs' },
        pieceInvalid: { bn: '১ থেকে {r} এর মধ্যে পিস সংখ্যা দিন', en: 'Enter 1 to {r} pieces' },
        reassignBlocked: { bn: 'কিছু পিস জমা হয়ে গেছে — পুনঃএসাইন করা যাবে না', en: 'Some pieces are submitted — cannot reassign' },
        bulkSkipped: { bn: '{n} টি বাদ (আগেই সম্পন্ন / পাওয়া যায়নি)', en: '{n} skipped (already done / not found)' },
        orderAutoDone: { bn: 'অর্ডার সম্পূর্ণ হয়েছে (সব পোশাক শেষ): {list} — এখন ডেলিভারি তালিকায়; SMS পাঠানো হয়নি, ডেলিভারি তালিকা থেকে পাঠান', en: 'Order(s) completed (all dresses done): {list} — now in the delivery list; no SMS sent, send it from the delivery list' },
        orderProgress: { bn: '{d}/{t} সম্পন্ন', en: '{d}/{t} done' },
        orderProgressTitle: { bn: 'এই অর্ডারের {t} টি পোশাকের {d} টি সম্পন্ন', en: '{d} of {t} dress lines of this order done' },
        orderComplete: { bn: 'অর্ডার সম্পূর্ণ', en: 'Order complete' }
    };
    function fmt(key, vals) {
        var s = t(key);
        Object.keys(vals || {}).forEach(function (k) { s = s.split('{' + k + '}').join(vals[k]); });
        return s;
    }
    function num(n) {
        var s = String(n);
        return getLang() === 'en' ? s : s.replace(/[0-9]/g, function (d) { return '০১২৩৪৫৬৭৮৯'.charAt(+d); });
    }

    function getLang() {
        var lang = window.currentLang || localStorage.getItem('preferredLanguage') || 'bn';
        if (lang !== 'en' && lang !== 'bn') lang = 'bn';
        window.currentLang = lang;
        return lang;
    }

    function t(key) {
        const lang = getLang() === 'en' ? 'en' : 'bn';
        return (LANG[key] && LANG[key][lang]) || key;
    }

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    let institutionInfo = null;

    function loadInstitutionInfo() {
        if (!institutionId) return;
        if (institutionInfo) { fillPrintInstitution(); return; }
        $.get('/api/institution/' + institutionId).done(function (res) {
            var data = (res && (res.data || res.Data)) ? (res.data || res.Data) : null;
            if (!data) return;
            institutionInfo = data;
            fillPrintInstitution();
        }).fail(function () {
            // fallback from session
            institutionInfo = {
                institutionName: sessionStorage.getItem('institutionName') || '',
                address: sessionStorage.getItem('institutionAddress') || '',
                phone: sessionStorage.getItem('institutionPhone') || ''
            };
            fillPrintInstitution();
        });
    }


    function fillPrintInstitution() {
        var name = '', address = '', phone = '';
        if (institutionInfo) {
            name = institutionInfo.institutionName || institutionInfo.InstitutionName || '';
            address = institutionInfo.address || institutionInfo.Address || '';
            phone = institutionInfo.phone || institutionInfo.Phone || '';
        }
        if (!name) name = sessionStorage.getItem('institutionName') || '';
        try {
            if (!name && $('#navInstitutionName').length) name = $('#navInstitutionName').text().trim();
        } catch (e) {}
        if (!address) address = sessionStorage.getItem('institutionAddress') || '';
        if (!phone) phone = sessionStorage.getItem('institutionPhone') || '';
        $('#printInsName').text(name);
        $('#printInsAddress').text(address || '');
        $('#printInsPhone').text(phone ? ('Phone: ' + phone) : '');
        var $logo = $('#printInsLogo');
        if (institutionId) {
            $logo.attr('src', '/api/institution/' + institutionId + '/logo?t=' + Date.now())
                .css('display', 'inline-block')
                .off('error').on('error', function () { $(this).hide(); });
        }
    }

    function buildPrintHeadline() {
        var lang = getLang();
        var tab = $('.tab-btn.active').data('tab') || 'issue';
        var who = '';
        var from = '', to = '';
        var title = '';

        if (tab === 'report') {
            title = lang === 'en' ? 'Factory / Sewing Report' : 'কারখানা / সেলাই রিপোর্ট';
            var $opt = $('#reportPersonFilter option:selected');
            who = ($opt.val() ? $opt.text() : (lang === 'en' ? 'All artisans' : 'সব কারিগর'));
            from = $('#reportDateFrom').val() || '';
            to = $('#reportDateTo').val() || '';
        } else if (tab === 'assigned') {
            title = lang === 'en' ? 'Factory Assignment List' : 'কারখানা এসাইন তালিকা';
            var $m = $('#issueArtisanFilter option:selected');
            who = ($m.val() ? $m.text() : (lang === 'en' ? 'All artisans' : 'সব কারিগর'));
            var orderNoF = ($('#issueOrderSearch').val() || '').trim();
            if (orderNoF) who += (lang === 'en' ? ' — Order #' : ' — অর্ডার #') + orderNoF;
            from = $('#issueDateFrom').val() || '';
            to = $('#issueDateTo').val() || '';
        } else if (tab === 'masters') {
            title = lang === 'en' ? 'Artisans' : 'কারিগর';
            who = lang === 'en' ? 'All' : 'সব';
        } else {
            title = lang === 'en' ? 'Factory Issue' : 'কারখানা ইস্যু';
            who = lang === 'en' ? 'Eligible dresses' : 'এলিজিবল ড্রেস';
        }

        var dateLine;
        if (from || to) {
            var a = from ? fmtDate(from) : '';
            var b = to ? fmtDate(to) : '';
            if (a && b && a === b) {
                dateLine = lang === 'en' ? ('Date: ' + a) : ('তারিখ: ' + a);
            } else if (a && b) {
                dateLine = lang === 'en'
                    ? ('Date: ' + a + ' to ' + b)
                    : ('তারিখ: ' + a + ' হতে ' + b);
            } else {
                var one = a || b;
                dateLine = lang === 'en' ? ('Date: ' + one) : ('তারিখ: ' + one);
            }
        } else {
            dateLine = lang === 'en' ? 'All Time' : 'অলটাইম';
        }

        $('#printHeadline').text(title + ' — ' + who);
        $('#printDateLine').text(dateLine);
    }

    window.printPage = function () {
        fillPrintInstitution();
        buildPrintHeadline();
        $('.tab-pane').removeClass('print-active-tab');
        var tab = $('.tab-btn.active').data('tab') || 'issue';
        var $pane = $('#tab-' + tab);
        if (!$pane.length) {
            $pane = $('.tab-pane').filter(function () { return $(this).css('display') !== 'none'; }).first();
        }
        $pane.addClass('print-active-tab');
        window.print();
        setTimeout(function () { $('.tab-pane').removeClass('print-active-tab'); }, 800);
    };


    
    const PAGE_SIZE = 50;
    let eligiblePage = 1;
    let eligibleTotal = 0;
    let issuesPage = 1;
    let issuesTotal = 0;

    function renderPager(prefix, page, total, pageSize) {
        const pages = Math.max(1, Math.ceil((total || 0) / pageSize));
        const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
        const to = Math.min(page * pageSize, total || 0);
        const lang = window.currentLang === 'en' ? 'en' : 'bn';
        const info = lang === 'en'
            ? (from + '-' + to + ' of ' + total + ' (page ' + page + '/' + pages + ')')
            : (from + '-' + to + ' / ' + total + ' (পৃষ্ঠা ' + page + '/' + pages + ')');
        $('#' + prefix + 'Info').text(info);
        $('#' + prefix + 'Prev').prop('disabled', page <= 1);
        $('#' + prefix + 'Next').prop('disabled', page >= pages);
    }

    window.eligiblePrevPage = function () {
        if (eligiblePage > 1) { eligiblePage--; loadEligible(true); }
    };

    window.eligibleNextPage = function () {
        const pages = Math.max(1, Math.ceil(eligibleTotal / PAGE_SIZE));
        if (eligiblePage < pages) { eligiblePage++; loadEligible(true); }
    };
    window.loadIssuesReset = function () { issuesPage = 1; loadIssues(); };
    window.onIssueOrderKey = function (e) {
        if (e && (e.key === 'Enter' || e.keyCode === 13)) { e.preventDefault(); loadIssuesReset(); }
    };
    window.onIssueOrderInput = function () {
        // cleared (typed away or the (x) of the search box): show the full list again
        if (!($('#issueOrderSearch').val() || '').trim()) loadIssuesReset();
    };
    window.issuesPrevPage = function () {
        if (issuesPage > 1) { issuesPage--; loadIssues(); }
    };
    window.issuesNextPage = function () {
        const pages = Math.max(1, Math.ceil(issuesTotal / PAGE_SIZE));
        if (issuesPage < pages) { issuesPage++; loadIssues(); }
    };

    window.openModal = id => $('#' + id).addClass('show');
    window.closeModal = id => $('#' + id).removeClass('show');
    $(document).on('click', '.modal-overlay', function (e) {
        if ($(e.target).hasClass('modal-overlay')) $(this).removeClass('show');
    });

    window.switchTab = function (name) {
        $('.tab-btn').removeClass('active');
        $('.tab-btn[data-tab="' + name + '"]').addClass('active');
        $('.tab-pane').hide();
        $('#tab-' + name).show();
        if (name === 'issue') loadEligible(false);
        if (name === 'assigned') loadIssues();
        if (name === 'artisans') loadArtisans();
        if (name === 'report') loadReport();
    };

    function ready() {
        getLang();
        institutionId = parseInt(sessionStorage.getItem('institutionId') || '0');
        registrationId = parseInt(sessionStorage.getItem('registrationId') || '0');
        if (!institutionId) {
            $(document).on('app-session-ready', function () {
                institutionId = parseInt(sessionStorage.getItem('institutionId') || '0');
                registrationId = parseInt(sessionStorage.getItem('registrationId') || '0');
                if (institutionId) { loadInstitutionInfo(); loadEligible(true); }
            });
            return;
        }
        loadInstitutionInfo();
        loadEligible(true);
    }

    $(document).ready(ready);
    $(document).on('languageChanged', function () {
        getLang();
        var active = $('.tab-btn.active').data('tab') || 'issue';
        if (active === 'issue') loadEligible(true);
        else if (active === 'assigned') loadIssues();
        else if (active === 'masters' && typeof loadMasters === 'function') loadMasters();
        else if (active === 'artisans' && typeof loadArtisans === 'function') loadArtisans();
        else if (active === 'report') loadReport();
    });



    let _eligibleTimer = null;
    window.loadEligible = function (force) {
        if (!force) eligiblePage = eligiblePage || 1;
        $('#eligibleBody').html('<tr><td colspan="6" class="no-data"><i class="fas fa-spinner fa-spin"></i></td></tr>');
        const search = ($('#eligibleSearch').val() || '').trim();
        $.get('/api/Factory/eligible', { institutionId, search, page: eligiblePage, pageSize: PAGE_SIZE }).done(function (res) {
            eligibleTotal = res.total || 0;
            if (res.page) eligiblePage = res.page;
            renderPager('eligiblePager', eligiblePage, eligibleTotal, PAGE_SIZE);
            const $b = $('#eligibleBody').empty();
            if (!res.success || !res.data || !res.data.length) {
                let msg = t('noData');
                if (res.mode === 'invalid') msg = '<i class="fas fa-info-circle"></i> ' + t('orderNoOnly');
                else if (res.mode === 'order') msg = t('noPendingForOrder') + (res.orderExists === true ? '<br><small class="text-muted">' + t('orderExistsHint') + '</small>'
                    : res.orderExists === false ? '<br><small class="text-muted">' + t('orderNotFoundHint') + '</small>' : '');
                $b.append('<tr><td colspan="6" class="no-data eligible-msg">' + msg + '</td></tr>');
                return;
            }
            res.data.forEach(function (r) {
                $b.append(
                    '<tr>' +
                    '<td><strong>#' + esc(r.OrderSerialNumber) + '</strong></td>' +
                    '<td>' + esc(r.CustomerName) + '<br><small class="text-muted">' + esc(r.CustomerPhone || '') + '</small></td>' +
                    '<td>' + esc(r.DressName) + (r.OrderList_SN ? ' <small>(#' + esc(r.OrderList_SN) + ')</small>' : '') + '</td>' +
                    '<td class="col-qty">' + esc(r.Quantity) + '</td>' +
                    '<td>' + esc(fmtDate(r.DeliveryDate)) + '</td>' +
                    '<td><button class="btn-pri" onclick="openIssueModal(' + r.OrderListID + ',\'' + esc(r.DressName).replace(/'/g, '') + '\',' + r.Quantity + ',' + r.OrderSerialNumber + ')">' + t('assign') + '</button></td>' +
                    '</tr>'
                );
            });
        }).fail(function () {
            $('#eligibleBody').html('<tr><td colspan="6" class="no-data">' + t('err') + '</td></tr>');
        });
    };

    window.queueEligibleSearch = function () {
        clearTimeout(_eligibleTimer);
        _eligibleTimer = setTimeout(function () { eligiblePage = 1; loadEligible(true); }, 350);
    };
    // search button / Enter: search now from page 1 (the order-number search covers the whole list, not the loaded page)
    window.searchEligible = function () {
        clearTimeout(_eligibleTimer);
        eligiblePage = 1;
        loadEligible(true);
    };
    window.onEligibleKey = function (e) {
        if (e && (e.key === 'Enter' || e.keyCode === 13)) { e.preventDefault(); searchEligible(); }
    };



    window.openIssueModal = function (orderListId, dressName, qty, orderSn) {
        $('#issueOrderListId').val(orderListId);
        $('#issueNotes').val('');
        $('#issueDressInfo').text('#' + orderSn + ' — ' + dressName + ' × ' + qty);
        $.get('/api/Factory/artisans', { institutionId, activeOnly: true }).done(function (res) {
            const $s = $('#issueArtisanId').empty();
            if (!res.success || !res.data.length) {
                $s.append('<option value="">' + t('selectArtisan') + '</option>');
            } else {
                res.data.forEach(function (m) {
                    $s.append('<option value="' + m.ArtisanID + '">' + esc(m.Name) + (m.Phone ? ' (' + esc(m.Phone) + ')' : '') + '</option>');
                });
            }
            if (window.WorkerSelect) WorkerSelect.refresh('#issueArtisanId');
            openModal('issueModal');
        });
    };

    window.submitIssue = function () {
        const orderListId = parseInt($('#issueOrderListId').val() || '0');
        const artisanId = parseInt($('#issueArtisanId').val() || '0');
        if (!artisanId) { alert(t('selectArtisan')); return; }
        $.ajax({
            url: '/api/Factory/issue',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                institutionID: institutionId,
                registrationID: registrationId,
                orderListID: orderListId,
                artisanID: artisanId,
                quantity: 0,
                notes: $('#issueNotes').val() || null
            })
        }).done(function (res) {
            if (!res.success) { alert(res.message || t('err')); return; }
            closeModal('issueModal');
            alert(t('issued'));
            loadEligible(true);
        }).fail(function (xhr) {
            alert((xhr.responseJSON && xhr.responseJSON.message) || t('err'));
        });
    };


    // after: optional callback once the list has been re-rendered (used to show result alerts on a fresh list)
    window.loadIssues = function (after) {
        function fillArtisanFilter(done) {
            const $f = $('#issueArtisanFilter');
            if (!$f.length) { if (done) done(); return; }
            if ($f.data('loaded')) { if (done) done(); return; }
            $.get('/api/Factory/artisans', { institutionId, activeOnly: false }).done(function (res) {
                const cur = $f.val() || '';
                $f.empty().append('<option value="">সব কারিগর / All</option>');
                (res.data || []).forEach(function (m) {
                    $f.append('<option value="' + m.ArtisanID + '">' + esc(m.Name) + '</option>');
                });
                $f.data('loaded', true);
                if (cur) $f.val(cur);
                if (window.WorkerSelect) WorkerSelect.refresh($f[0]);
                if (done) done();
            }).fail(function () { if (done) done(); });
        }
        fillArtisanFilter(function () {
            const status = $('#issueStatusFilter').val() || '';
            const artisanId = $('#issueArtisanFilter').val() || '';
            const dateFrom = $('#issueDateFrom').val() || '';
            const dateTo = $('#issueDateTo').val() || '';
            const orderNo = ($('#issueOrderSearch').val() || '').trim();
            const params = { institutionId, status, page: issuesPage, pageSize: PAGE_SIZE };
            if (artisanId) params.artisanId = artisanId;
            if (orderNo) params.orderNo = orderNo;
            if (dateFrom) params.dateFrom = dateFrom;
            if (dateTo) params.dateTo = dateTo;
            $.get('/api/Factory/issues', params).done(function (res) {
                issuesTotal = res.total || 0;
                if (res.page) issuesPage = res.page;
                renderPager('issuesPager', issuesPage, issuesTotal, PAGE_SIZE);
                const $b = $('#issuesBody').empty();
                selectedIssues = {};
                issueRows = {};
                partialSupported = !!res.partialSupported;
                updateBulkBar();
                if (!res.success || !res.data.length) {
                    $b.append('<tr><td colspan="10" class="no-data">' + t('noData') + '</td></tr>');
                    return;
                }
                res.data.forEach(function (r) {
                    issueRows[r.FactoryIssueID] = r;
                    const doneQ = r.CompletedQuantity || 0;
                    const partial = r.Status === 'Assigned' && doneQ > 0;
                    const badge = r.Status === 'Completed'
                        ? '<span class="badge-done">' + t('done') + '</span>'
                        : '<span class="badge-asg">' + t('assigned') + '</span>';
                    const act = r.Status === 'Assigned'
                        ? ((partial
                            ? '<button class="btn-edit me-1 no-print" disabled title="' + esc(t('reassignBlocked')) + '">' + t('reassign') + '</button>'
                            : '<button class="btn-edit me-1 no-print" onclick="openReassignModal(' + r.FactoryIssueID + ',' + r.ArtisanID + ',\'' + esc(r.DressName).replace(/'/g, '') + '\',\'' + esc(r.ArtisanName).replace(/'/g, '') + '\',\'' + esc(r.OrderSerialNumber) + '\')">' + t('reassign') + '</button>') +
                           '<button class="btn-suc no-print issue-done-btn" data-id="' + r.FactoryIssueID + '" onclick="completeIssue(' + r.FactoryIssueID + ')">' + t('markDone') + '</button>')
                        : '-';
                    const assignDate = fmtDate(r.AssignedDate);
                    const chk = r.Status === 'Assigned'
                        ? '<input type="checkbox" class="issue-chk" data-id="' + r.FactoryIssueID + '" onchange="onIssueCheck(this)" aria-label="select">'
                        : '';
                    let prog = '';
                    if (r.OrderWorkStatus === 'Completed') {
                        prog = '<div class="ord-prog ord-prog-full">✓ ' + t('orderComplete') + '</div>';
                    } else if (r.OrderLines > 0) {
                        const v = { d: num(r.OrderLinesDone || 0), t: num(r.OrderLines) };
                        prog = '<div class="ord-prog" title="' + esc(fmt('orderProgressTitle', v)) + '">' + esc(fmt('orderProgress', v)) + '</div>';
                    }
                    $b.append(
                        '<tr>' +
                        '<td class="col-chk no-print">' + chk + '</td>' +
                        '<td class="col-order">#' + esc(r.OrderSerialNumber) + prog + '</td>' +
                    '<td>' + esc(r.CustomerName) + '</td>' +
                        '<td>' + esc(r.DressName) + '</td>' +
                        '<td>' + esc(r.ArtisanName) + '</td>' +
                        '<td class="col-qty">' + esc(r.Quantity) +
                            (partial ? '<div class="pc-prog">' + esc(fmt('piecesDone', { c: num(doneQ), q: num(r.Quantity) })) + '</div>' : '') + '</td>' +
                        '<td>' + esc(assignDate) + '</td>' +
                        '<td style="max-width:160px;white-space:normal;font-size:12px;">' + esc(r.Notes || '-') + '</td>' + '<td>' + badge + '</td>' +
                        '<td>' + act + '</td>' +
                        '</tr>'
                    );
                });
                updateBulkBar();   // enable "select all" now that the rows exist
            }).always(function () { if (typeof after === 'function') after(); });
        });
    };


    // ── bulk "sewing done" (only Assigned rows have a checkbox) ──
    let selectedIssues = {};
    let issueRows = {};          // FactoryIssueID -> row of the last load
    let partialSupported = false; // server has FactoryIssue.CompletedQuantity (piece-wise submit)
    function selectedIds() { return Object.keys(selectedIssues).map(Number); }
    function openPieces(id) { const r = issueRows[id]; return r ? Math.max(0, (r.Quantity || 0) - (r.CompletedQuantity || 0)) : 0; }
    function parseNum(v) {
        const s = String(v == null ? '' : v).trim().replace(/[০-৯]/g, function (c) { return String(c.charCodeAt(0) - 0x09E6); });
        return /^\d+$/.test(s) ? parseInt(s, 10) : NaN;
    }
    function updateBulkBar() {
        const n = selectedIds().length;
        $('#bulkDoneBtn').prop('disabled', n === 0).find('.bulk-lbl').text(t('bulkDone') + ' (' + num(n) + ')');
        const $all = $('#issuesSelectAll'), boxes = $('#issuesBody .issue-chk');
        $all.prop('disabled', boxes.length === 0).attr('title', t('selectAllOpen'))
            .prop('checked', boxes.length > 0 && boxes.filter(':checked').length === boxes.length)
            .prop('indeterminate', n > 0 && boxes.filter(':checked').length < boxes.length);
    }
    window.onIssueCheck = function (el) {
        const id = parseInt(el.getAttribute('data-id'), 10);
        if (el.checked) selectedIssues[id] = true; else delete selectedIssues[id];
        updateBulkBar();
    };
    window.onIssuesSelectAll = function (el) {
        const on = el.checked;   // read once: updateBulkBar() re-sets the header box while looping
        $('#issuesBody .issue-chk').each(function () { this.checked = on; window.onIssueCheck(this); });
    };
    function orderDoneMsg(list) {
        return list && list.length ? '\n' + fmt('orderAutoDone', { list: list.map(function (o) { return '#' + o.orderSerialNumber; }).join(', ') }) : '';
    }
    window.bulkCompleteIssues = function () {
        const ids = selectedIds();
        if (!ids.length) return;
        // exactly one row selected: same as its green button (asks how many pieces when more than one is open)
        if (ids.length === 1) { window.completeIssue(ids[0]); return; }
        const pcs = ids.reduce(function (a, id) { return a + openPieces(id); }, 0);
        const MAXL = 10;
        const rows = ids.slice(0, MAXL).map(function (id) {
            const r = issueRows[id] || {};
            return fmt('bulkRow', { o: r.OrderSerialNumber || id, d: r.DressName || '', a: r.ArtisanName || '', p: num(openPieces(id)) });
        });
        if (ids.length > MAXL) rows.push(fmt('bulkMore', { n: num(ids.length - MAXL) }));
        if (!confirm(fmt('confirmBulk', { n: num(ids.length), p: num(pcs) }) + '\n' + rows.join('\n') + '\n\n' + fmt('bulkHint', { b: t('markDone') }))) return;
        const $btn = $('#bulkDoneBtn').prop('disabled', true);
        $.ajax({
            url: '/api/Factory/complete-bulk',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ institutionID: institutionId, factoryIssueIDs: ids })
        }).done(function (res) {
            if (!res.success) { alert(res.message || t('err')); $btn.prop('disabled', false); return; }
            let msg = fmt('bulkResult', { n: num(res.completed || 0), p: num(res.pieces || 0) });
            if (res.skipped && res.skipped.length) msg += '\n' + fmt('bulkSkipped', { n: num(res.skipped.length) });
            msg += orderDoneMsg(res.ordersCompleted);
            // refresh first (clears the ticks, done rows leave the এসাইন state), then show the result
            selectedIssues = {};
            $('#issuesBody .issue-chk').prop('checked', false);
            updateBulkBar();
            loadIssues(function () { alert(msg); });
        }).fail(function (xhr) {
            alert((xhr.responseJSON && xhr.responseJSON.message) || t('err'));
            $btn.prop('disabled', false);
        });
    };

    // "সেলাই সম্পন্ন": more than one open piece -> ask how many (piece modal); one piece -> confirm
    window.completeIssue = function (id) {
        const r = issueRows[id];
        if (!r) return;
        const open = openPieces(id), doneQ = r.CompletedQuantity || 0;
        if (open <= 0) return;
        if (open > 1 && partialSupported) {
            $('#pieceIssueId').val(id);
            $('#pieceInfo').text(fmt('pieceInfo', { o: r.OrderSerialNumber, d: r.DressName, a: r.ArtisanName, q: num(r.Quantity), c: num(doneQ), r: num(open) }));
            $('#pieceQty').val(num(open)).attr('data-max', open);
            $('#pieceMaxHint').text(fmt('pieceMax', { r: num(open) }));
            $('#pieceSubmitBtn').prop('disabled', false);
            openModal('pieceModal');
            setTimeout(function () { $('#pieceQty').trigger('focus').trigger('select'); }, 50);
            return;
        }
        if (!confirm(fmt('confirmOne', { o: r.OrderSerialNumber, d: r.DressName, p: num(open) }))) return;
        submitPieces(id, open, doneQ);
    };
    window.pieceStep = function (d) {
        const max = parseInt($('#pieceQty').attr('data-max'), 10) || 1;
        let v = parseNum($('#pieceQty').val());
        if (isNaN(v)) v = max;
        $('#pieceQty').val(num(Math.min(max, Math.max(1, v + d))));
    };
    window.submitPieceModal = function () {
        const id = parseInt($('#pieceIssueId').val() || '0', 10);
        const max = parseInt($('#pieceQty').attr('data-max'), 10) || 1;
        const n = parseNum($('#pieceQty').val());
        if (!(n >= 1 && n <= max)) { alert(fmt('pieceInvalid', { r: num(max) })); return; }
        const r = issueRows[id];
        $('#pieceSubmitBtn').prop('disabled', true);
        submitPieces(id, n, r ? (r.CompletedQuantity || 0) : 0, function () { closeModal('pieceModal'); });
    };
    // expectedCompleted: a double click / stale page gets 409 from the server instead of a second credit
    function submitPieces(id, n, expected, onDone) {
        const $btn = $('.issue-done-btn[data-id="' + id + '"]').prop('disabled', true);
        $.ajax({
            url: '/api/Factory/complete',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ factoryIssueID: id, institutionID: institutionId, quantity: n, expectedCompleted: expected })
        }).done(function (res) {
            if (onDone) onDone();
            if (!res.success) { const m0 = res.message || t('err'); loadIssues(function () { alert(m0); }); return; }
            const orderMsg = orderDoneMsg(res.orderCompleted ? [{ orderSerialNumber: res.orderSerialNumber }] : []);
            const msg = res.assignmentCompleted === false
                ? fmt('piecesSaved', { n: num(res.pieces), c: num(res.completedQuantity), q: num(res.quantity), r: num(res.quantity - res.completedQuantity) }) + orderMsg
                : t('completed') + orderMsg;
            // refresh first (ticks cleared, new piece count / status shown), then the result alert
            loadIssues(function () { alert(msg); });
        }).fail(function (xhr) {
            if (onDone) onDone();
            const m1 = (xhr.responseJSON && xhr.responseJSON.message) || t('err');
            $btn.prop('disabled', false);
            loadIssues(function () { alert(m1); });
        });
    }

    // full list is loaded once; the search box (list-search.js) filters it client-side and
    // stays applied when the list is reloaded after add / edit / delete / pay / Excel import
    let artisanData = [];
    window.loadArtisans = function () {
        $.get('/api/Factory/artisans', { institutionId }).done(function (res) {
            $('#issueArtisanFilter').data('loaded', false); // list changed: reload the Assigned-tab filter
            artisanData = (res && res.success && res.data) ? res.data : [];
            renderArtisans();
        });
    };

    function renderArtisans() {
        const $b = $('#artisansBody').empty();
        if (!artisanData.length) {
            $b.append('<tr><td colspan="5" class="no-data">' + t('noData') + '</td></tr>');
            return;
        }
        const q = $('#artisanSearch').val() || '';
        const rows = window.ListSearch ? artisanData.filter(function (m) { return ListSearch.matches(q, m.Name, m.Phone); }) : artisanData;
        if (!rows.length) {
            $b.append('<tr><td colspan="5" class="no-data">' + t('noneFound') + '</td></tr>');
            return;
        }
        rows.forEach(function (m) {
            const st = m.IsActive ? t('active') : t('inactive');
            const bal = Number(m.Balance || 0);
            $b.append(
                '<tr>' +
                '<td style="font-weight:600;">' + esc(m.Name) + '</td>' +
                '<td>' + esc(m.Phone || '-') + '</td>' +
                '<td><strong>' + (bal < 0 ? '<span style="color:#1565c0;">' + t('advance') + ' ' + (-bal).toFixed(2) + '</span>' : bal.toFixed(2)) + '</strong></td>' +
                '<td>' + st + '</td>' +
                '<td>' +
                '<a class="btn-suc me-1" style="text-decoration:none;display:inline-block;" title="' + esc(t('payPageTip')) + '" href="/worker-payments.html?tab=pay&type=Artisan&workerId=' + m.ArtisanID + '"><i class="fas fa-money-bill-wave"></i> ' + t('pay') + '</a>' +
                '<button class="btn-edit me-1" onclick="openArtisanModal(' + m.ArtisanID + ',\'' + esc(m.Name).replace(/'/g, '') + '\',\'' + esc(m.Phone || '').replace(/'/g, '') + '\',' + (m.IsActive ? 1 : 0) + ')"><i class="fas fa-pen"></i></button>' +
                '<button class="btn-dng" onclick="deleteArtisan(' + m.ArtisanID + ')"><i class="fas fa-trash"></i></button>' +
                '</td></tr>'
            );
        });
    }
    $(function () {
        if (window.ListSearch) ListSearch.attach({ input: '#artisanSearch', clear: '#artisanSearchClear', onChange: renderArtisans });
    });

    // Bulk add from Excel/CSV (worker-bulk-import.js)
    window.openArtisanBulkModal = function () {
        if (!window.WorkerBulkImport) { alert(t('err')); return; }
        WorkerBulkImport.open({ kind: 'artisan', institutionId: institutionId, registrationId: registrationId, onDone: loadArtisans });
    };

    window.openArtisanModal = function (id, name, phone, active) {
        $('#artisanId').val(id || 0);
        $('#artisanName').val(name || '');
        $('#artisanPhone').val(phone || '');
        $('#artisanActive').prop('checked', active !== 0);
        $('#artisanActiveWrap').toggle(!!id);
        openModal('artisanModal');
    };

    window.submitArtisan = function () {
        const id = parseInt($('#artisanId').val() || '0');
        const name = ($('#artisanName').val() || '').trim();
        if (!name) { alert(t('fillName')); return; }
        const phone = $('#artisanPhone').val() || null;
        if (id) {
            $.ajax({
                url: '/api/Factory/artisans',
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({
                    artisanID: id,
                    institutionID: institutionId,
                    name, phone,
                    isActive: $('#artisanActive').is(':checked')
                })
            }).done(function (res) {
                if (!res.success) { alert(res.message || t('err')); return; }
                closeModal('artisanModal');
                alert(t('saved'));
                loadArtisans();
            });
        } else {
            $.ajax({
                url: '/api/Factory/artisans',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    institutionID: institutionId,
                    registrationID: registrationId,
                    name, phone
                })
            }).done(function (res) {
                if (!res.success) { alert(res.message || t('err')); return; }
                closeModal('artisanModal');
                alert(t('saved'));
                loadArtisans();
            });
        }
    };

    window.deleteArtisan = function (id) {
        if (!confirm(t('confirmDel'))) return;
        $.ajax({
            url: '/api/Factory/artisans?artisanId=' + id + '&institutionId=' + institutionId,
            method: 'DELETE'
        }).done(function () {
            alert(t('deleted'));
            loadArtisans();
        });
    };


    window.loadReport = function () {
        function fillPersonFilter(list, selected) {
            const $f = $('#reportPersonFilter');
            if (!$f.length) return;
            const cur = selected != null ? String(selected) : ($f.val() || '');
            $f.empty().append('<option value="">' + t('allPersons') + '</option>');
            (list || []).forEach(function (row) {
                $f.append('<option value="' + row.ArtisanID + '">' + esc(row.ArtisanName) + '</option>');
            });
            if (cur) $f.val(cur);
            if (window.WorkerSelect) WorkerSelect.refresh($f[0]);
        }
        const artisanId = $('#reportPersonFilter').val() || '';
        const dateFrom = $('#reportDateFrom').val() || '';
        const dateTo = $('#reportDateTo').val() || '';
        const params = { institutionId };
        if (artisanId) params.artisanId = artisanId;
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;
        $.get('/api/Factory/report', params).done(function (res) {
            if (!artisanId) fillPersonFilter(res.data || [], '');
            const $b = $('#reportBody').empty();
            let a = 0, c = 0, r = 0;
            const rows = res.data || [];
            if (!res.success || !rows.length) {
                $b.append('<tr><td colspan="5" class="no-data">' + t('noData') + '</td></tr>');
            } else {
                rows.forEach(function (row) {
                    a += row.AssignedQty || 0;
                    c += row.CompletedQty || 0;
                    r += row.RemainingQty || 0;
                    $b.append(
                        '<tr>' +
                        '<td>' + esc(row.ArtisanName) + '</td>' +
                        '<td>' + esc(row.AssignedQty) + '</td>' +
                        '<td>' + esc(row.CompletedQty) + '</td>' +
                        '<td><strong>' + esc(row.RemainingQty) + '</strong></td>' +
                        '</tr>'
                    );
                });
            }
            $('#reportSummary').html(
                '<div class="s-card"><div class="s-lbl">' + t('assigned') + '</div><div class="s-val">' + a + '</div></div>' +
                '<div class="s-card" style="border-top-color:#28a745;"><div class="s-lbl">' + t('done') + '</div><div class="s-val">' + c + '</div></div>' +
                '<div class="s-card" style="border-top-color:#fd7e14;"><div class="s-lbl">' + (window.currentLang === 'en' ? 'Remaining' : 'বাকি') + '</div><div class="s-val">' + r + '</div></div>'
            );
            const $d = $('#dressReportBody').empty();
            const dresses = res.dresses || [];
            if (!dresses.length) {
                $d.append('<tr><td colspan="4" class="no-data">' + t('noData') + '</td></tr>');
            } else {
                dresses.forEach(function (row) {
                    $d.append(
                        '<tr>' +
                        '<td>' + esc(row.DressName) + '</td>' +
                        '<td>' + esc(row.AssignedQty) + '</td>' +
                        '<td>' + esc(row.CompletedQty) + '</td>' +
                        '<td><strong>' + esc(row.RemainingQty) + '</strong></td>' +
                        '</tr>'
                    );
                });
            }
        });
    };



    window.openReassignModal = function (issueId, currentArtisanId, dressName, artisanName, orderSn) {
        $('#reassignIssueId').val(issueId);
        $('#reassignNotes').val('');
        $('#reassignInfo').text('#' + orderSn + ' — ' + dressName + ' (' + artisanName + ')');
        $.get('/api/Factory/artisans', { institutionId, activeOnly: true }).done(function (res) {
            const $s = $('#reassignArtisanId').empty();
            (res.data || []).forEach(function (m) {
                if (m.ArtisanID === currentArtisanId) return;
                $s.append('<option value="' + m.ArtisanID + '">' + esc(m.Name) + (m.Phone ? ' (' + esc(m.Phone) + ')' : '') + '</option>');
            });
            if (!$s.children().length) {
                $s.append('<option value="">' + t('selectArtisan') + '</option>');
            }
            if (window.WorkerSelect) WorkerSelect.refresh('#reassignArtisanId');
            openModal('reassignModal');
        });
    };

    window.submitReassign = function () {
        const id = parseInt($('#reassignIssueId').val() || '0');
        const artisanId = parseInt($('#reassignArtisanId').val() || '0');
        if (!artisanId) { alert(t('selectArtisan')); return; }
        $.ajax({
            url: '/api/Factory/reassign',
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({
                factoryIssueID: id,
                institutionID: institutionId,
                artisanID: artisanId,
                notes: $('#reassignNotes').val() || null
            })
        }).done(function (res) {
            if (!res.success) { alert(res.message || t('err')); return; }
            closeModal('reassignModal');
            alert(t('reassigned'));
            loadIssues();
        }).fail(function (xhr) {
            alert((xhr.responseJSON && xhr.responseJSON.message) || t('err'));
        });
    };


    // Pay (OTP) / other payments / token moved to worker-payments.html (tab "কারিগর পেমেন্ট"); the list links there.

})();