/* cutting-issue.js — optional Cutting Issue workflow */
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
        noneFound: { bn: 'কোনো মাস্টার পাওয়া যায়নি', en: 'No master found' },
        selectMaster: { bn: 'মাস্টার সিলেক্ট করুন', en: 'Select a master' },
        issued: { bn: 'কাটিং ইস্যু হয়েছে', en: 'Cutting issued' },
        completed: { bn: 'কাটিং সম্পন্ন', en: 'Cutting completed' },
        saved: { bn: 'সংরক্ষিত', en: 'Saved' },
        deleted: { bn: 'মুছে ফেলা হয়েছে', en: 'Deleted' },
        confirmDel: { bn: 'মুছে ফেলবেন?', en: 'Delete?' },
        fillName: { bn: 'নাম দিন', en: 'Enter name' },
        assigned: { bn: 'এসাইন', en: 'Assigned' },
        done: { bn: 'সম্পন্ন', en: 'Completed' },
        active: { bn: 'সক্রিয়', en: 'Active' },
        inactive: { bn: 'নিষ্ক্রিয়', en: 'Inactive' },
        markDone: { bn: 'কাটিং সম্পন্ন', en: 'Mark cut done' },
        reassign: { bn: 'রিঅ্যাসাইন', en: 'Reassign' },
        reassigned: { bn: 'নতুন মাস্টারকে এসাইন হয়েছে', en: 'Reassigned' },
        allPersons: { bn: 'সব মাস্টার', en: 'All masters' },
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
        noPendingForOrder: { bn: 'এই অর্ডার নম্বরে কাটিং ইস্যু বাকি কোনো পোশাক নেই', en: 'No dress of this order number is waiting for cutting issue' },
        orderExistsHint: { bn: 'অর্ডারটি আছে, তবে এর সব পোশাক কাটিং ইস্যু হয়ে গেছে বা কাজ শেষ', en: 'The order exists, but all its dresses are already cutting-issued or finished' },
        orderNotFoundHint: { bn: 'এই নম্বরে কোনো অর্ডার পাওয়া যায়নি', en: 'No order with this number' }
    };

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
            title = lang === 'en' ? 'Cutting Report' : 'কাটিং রিপোর্ট';
            var $opt = $('#reportPersonFilter option:selected');
            who = ($opt.val() ? $opt.text() : (lang === 'en' ? 'All masters' : 'সব মাস্টার'));
            from = $('#reportDateFrom').val() || '';
            to = $('#reportDateTo').val() || '';
        } else if (tab === 'assigned') {
            title = lang === 'en' ? 'Cutting Assignment List' : 'কাটিং এসাইন তালিকা';
            var $m = $('#issueMasterFilter option:selected');
            who = ($m.val() ? $m.text() : (lang === 'en' ? 'All masters' : 'সব মাস্টার'));
            var orderNoF = ($('#issueOrderSearch').val() || '').trim();
            if (orderNoF) who += (lang === 'en' ? ' — Order #' : ' — অর্ডার #') + orderNoF;
            from = $('#issueDateFrom').val() || '';
            to = $('#issueDateTo').val() || '';
        } else if (tab === 'masters') {
            title = lang === 'en' ? 'Cutting Masters' : 'কাটিং মাস্টার';
            who = lang === 'en' ? 'All' : 'সব';
        } else {
            title = lang === 'en' ? 'Cutting Issue' : 'কাটিং ইস্যু';
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
        if (name === 'masters') loadMasters();
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
        $.get('/api/Cutting/eligible', { institutionId, search, page: eligiblePage, pageSize: PAGE_SIZE }).done(function (res) {
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
        $.get('/api/Cutting/masters', { institutionId, activeOnly: true }).done(function (res) {
            const $s = $('#issueMasterId').empty();
            if (!res.success || !res.data.length) {
                $s.append('<option value="">' + t('selectMaster') + '</option>');
            } else {
                res.data.forEach(function (m) {
                    $s.append('<option value="' + m.CuttingMasterID + '">' + esc(m.Name) + (m.Phone ? ' (' + esc(m.Phone) + ')' : '') + '</option>');
                });
            }
            if (window.WorkerSelect) WorkerSelect.refresh('#issueMasterId');
            openModal('issueModal');
        });
    };

    window.submitIssue = function () {
        const orderListId = parseInt($('#issueOrderListId').val() || '0');
        const masterId = parseInt($('#issueMasterId').val() || '0');
        if (!masterId) { alert(t('selectMaster')); return; }
        $.ajax({
            url: '/api/Cutting/issue',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                institutionID: institutionId,
                registrationID: registrationId,
                orderListID: orderListId,
                cuttingMasterID: masterId,
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


    window.loadIssues = function () {
        function fillMasterFilter(done) {
            const $f = $('#issueMasterFilter');
            if (!$f.length) { if (done) done(); return; }
            if ($f.data('loaded')) { if (done) done(); return; }
            $.get('/api/Cutting/masters', { institutionId, activeOnly: false }).done(function (res) {
                const cur = $f.val() || '';
                $f.empty().append('<option value="">সব মাস্টার / All</option>');
                (res.data || []).forEach(function (m) {
                    $f.append('<option value="' + m.CuttingMasterID + '">' + esc(m.Name) + '</option>');
                });
                $f.data('loaded', true);
                if (cur) $f.val(cur);
                if (window.WorkerSelect) WorkerSelect.refresh($f[0]);
                if (done) done();
            }).fail(function () { if (done) done(); });
        }
        fillMasterFilter(function () {
            const status = $('#issueStatusFilter').val() || '';
            const masterId = $('#issueMasterFilter').val() || '';
            const dateFrom = $('#issueDateFrom').val() || '';
            const dateTo = $('#issueDateTo').val() || '';
            const orderNo = ($('#issueOrderSearch').val() || '').trim();
            const params = { institutionId, status, page: issuesPage, pageSize: PAGE_SIZE };
            if (masterId) params.cuttingMasterId = masterId;
            if (orderNo) params.orderNo = orderNo;
            if (dateFrom) params.dateFrom = dateFrom;
            if (dateTo) params.dateTo = dateTo;
            $.get('/api/Cutting/issues', params).done(function (res) {
                issuesTotal = res.total || 0;
                if (res.page) issuesPage = res.page;
                renderPager('issuesPager', issuesPage, issuesTotal, PAGE_SIZE);
                const $b = $('#issuesBody').empty();
                if (!res.success || !res.data.length) {
                    $b.append('<tr><td colspan="9" class="no-data">' + t('noData') + '</td></tr>');
                    return;
                }
                res.data.forEach(function (r) {
                    const badge = r.Status === 'Completed'
                        ? '<span class="badge-done">' + t('done') + '</span>'
                        : '<span class="badge-asg">' + t('assigned') + '</span>';
                    const act = r.Status === 'Assigned'
                        ? ('<button class="btn-edit me-1 no-print" onclick="openReassignModal(' + r.CuttingIssueID + ',' + r.CuttingMasterID + ',\'' + esc(r.DressName).replace(/'/g, '') + '\',\'' + esc(r.MasterName).replace(/'/g, '') + '\',\'' + esc(r.OrderSerialNumber) + '\')">' + t('reassign') + '</button>' +
                           '<button class="btn-suc no-print" onclick="completeIssue(' + r.CuttingIssueID + ')">' + t('markDone') + '</button>')
                        : '-';
                    const assignDate = fmtDate(r.AssignedDate);
                    $b.append(
                        '<tr>' +
                        '<td class="col-order">#' + esc(r.OrderSerialNumber) + '</td>' +
                    '<td>' + esc(r.CustomerName) + '</td>' +
                        '<td>' + esc(r.DressName) + '</td>' +
                        '<td>' + esc(r.MasterName) + '</td>' +
                        '<td class="col-qty">' + esc(r.Quantity) + '</td>' +
                        '<td>' + esc(assignDate) + '</td>' +
                        '<td style="max-width:160px;white-space:normal;font-size:12px;">' + esc(r.Notes || '-') + '</td>' + '<td>' + badge + '</td>' +
                        '<td>' + act + '</td>' +
                        '</tr>'
                    );
                });
            });
        });
    };


    window.completeIssue = function (id) {
        $.ajax({
            url: '/api/Cutting/complete',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ cuttingIssueID: id, institutionID: institutionId })
        }).done(function (res) {
            if (!res.success) { alert(res.message || t('err')); return; }
            alert(t('completed'));
            loadIssues();
        }).fail(function (xhr) {
            alert((xhr.responseJSON && xhr.responseJSON.message) || t('err'));
        });
    };

    // full list is loaded once; the search box (list-search.js) filters it client-side and
    // stays applied when the list is reloaded after add / edit / delete / pay / Excel import
    let masterData = [];
    window.loadMasters = function () {
        $.get('/api/Cutting/masters', { institutionId }).done(function (res) {
            $('#issueMasterFilter').data('loaded', false); // list changed: reload the Assigned-tab filter
            masterData = (res && res.success && res.data) ? res.data : [];
            renderMasters();
        });
    };

    function renderMasters() {
        const $b = $('#mastersBody').empty();
        if (!masterData.length) {
            $b.append('<tr><td colspan="5" class="no-data">' + t('noData') + '</td></tr>');
            return;
        }
        const q = $('#masterSearch').val() || '';
        const rows = window.ListSearch ? masterData.filter(function (m) { return ListSearch.matches(q, m.Name, m.Phone); }) : masterData;
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
                '<a class="btn-suc me-1" style="text-decoration:none;display:inline-block;" title="' + esc(t('payPageTip')) + '" href="/worker-payments.html?tab=pay&type=CuttingMaster&workerId=' + m.CuttingMasterID + '"><i class="fas fa-money-bill-wave"></i> ' + t('pay') + '</a>' +
                '<button class="btn-edit me-1" onclick="openMasterModal(' + m.CuttingMasterID + ',\'' + esc(m.Name).replace(/'/g, '') + '\',\'' + esc(m.Phone || '').replace(/'/g, '') + '\',' + (m.IsActive ? 1 : 0) + ')"><i class="fas fa-pen"></i></button>' +
                '<button class="btn-dng" onclick="deleteMaster(' + m.CuttingMasterID + ')"><i class="fas fa-trash"></i></button>' +
                '</td></tr>'
            );
        });
    }
    $(function () {
        if (window.ListSearch) ListSearch.attach({ input: '#masterSearch', clear: '#masterSearchClear', onChange: renderMasters });
    });

    // Bulk add from Excel/CSV (worker-bulk-import.js)
    window.openMasterBulkModal = function () {
        if (!window.WorkerBulkImport) { alert(t('err')); return; }
        WorkerBulkImport.open({ kind: 'master', institutionId: institutionId, registrationId: registrationId, onDone: loadMasters });
    };

    window.openMasterModal = function (id, name, phone, active) {
        $('#masterId').val(id || 0);
        $('#masterName').val(name || '');
        $('#masterPhone').val(phone || '');
        $('#masterActive').prop('checked', active !== 0);
        $('#masterActiveWrap').toggle(!!id);
        openModal('masterModal');
    };

    window.submitMaster = function () {
        const id = parseInt($('#masterId').val() || '0');
        const name = ($('#masterName').val() || '').trim();
        if (!name) { alert(t('fillName')); return; }
        const phone = $('#masterPhone').val() || null;
        if (id) {
            $.ajax({
                url: '/api/Cutting/masters',
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({
                    cuttingMasterID: id,
                    institutionID: institutionId,
                    name, phone,
                    isActive: $('#masterActive').is(':checked')
                })
            }).done(function (res) {
                if (!res.success) { alert(res.message || t('err')); return; }
                closeModal('masterModal');
                alert(t('saved'));
                loadMasters();
            });
        } else {
            $.ajax({
                url: '/api/Cutting/masters',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    institutionID: institutionId,
                    registrationID: registrationId,
                    name, phone
                })
            }).done(function (res) {
                if (!res.success) { alert(res.message || t('err')); return; }
                closeModal('masterModal');
                alert(t('saved'));
                loadMasters();
            });
        }
    };

    window.deleteMaster = function (id) {
        if (!confirm(t('confirmDel'))) return;
        $.ajax({
            url: '/api/Cutting/masters?cuttingMasterId=' + id + '&institutionId=' + institutionId,
            method: 'DELETE'
        }).done(function () {
            alert(t('deleted'));
            loadMasters();
        });
    };


    window.loadReport = function () {
        function fillPersonFilter(list, selected) {
            const $f = $('#reportPersonFilter');
            if (!$f.length) return;
            const cur = selected != null ? String(selected) : ($f.val() || '');
            $f.empty().append('<option value="">' + t('allPersons') + '</option>');
            (list || []).forEach(function (row) {
                $f.append('<option value="' + row.CuttingMasterID + '">' + esc(row.MasterName) + '</option>');
            });
            if (cur) $f.val(cur);
            if (window.WorkerSelect) WorkerSelect.refresh($f[0]);
        }
        const masterId = $('#reportPersonFilter').val() || '';
        const dateFrom = $('#reportDateFrom').val() || '';
        const dateTo = $('#reportDateTo').val() || '';
        const params = { institutionId };
        if (masterId) params.cuttingMasterId = masterId;
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;
        $.get('/api/Cutting/report', params).done(function (res) {
            if (!masterId) fillPersonFilter(res.data || [], '');
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
                        '<td>' + esc(row.MasterName) + '</td>' +
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



    window.openReassignModal = function (issueId, currentMasterId, dressName, masterName, orderSn) {
        $('#reassignIssueId').val(issueId);
        $('#reassignNotes').val('');
        $('#reassignInfo').text('#' + orderSn + ' — ' + dressName + ' (' + masterName + ')');
        $.get('/api/Cutting/masters', { institutionId, activeOnly: true }).done(function (res) {
            const $s = $('#reassignMasterId').empty();
            (res.data || []).forEach(function (m) {
                if (m.CuttingMasterID === currentMasterId) return;
                $s.append('<option value="' + m.CuttingMasterID + '">' + esc(m.Name) + (m.Phone ? ' (' + esc(m.Phone) + ')' : '') + '</option>');
            });
            if (!$s.children().length) {
                $s.append('<option value="">' + t('selectMaster') + '</option>');
            }
            if (window.WorkerSelect) WorkerSelect.refresh('#reassignMasterId');
            openModal('reassignModal');
        });
    };

    window.submitReassign = function () {
        const id = parseInt($('#reassignIssueId').val() || '0');
        const masterId = parseInt($('#reassignMasterId').val() || '0');
        if (!masterId) { alert(t('selectMaster')); return; }
        $.ajax({
            url: '/api/Cutting/reassign',
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({
                cuttingIssueID: id,
                institutionID: institutionId,
                cuttingMasterID: masterId,
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