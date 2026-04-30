/* sms.js */
(function () {
    'use strict';

    let institutionId  = 0;
    let registrationId = 0;
    let custPage       = 1;
    let custTotalPages = 1;
    let lastPhone      = null;
    let lastCustNo     = null;
    const CUST_PAGE    = 500;

    // ── SMS count calc ─────────────────────────────────────────────────────────
    function calcSms(text) {
        if (!text) return { len: 0, smsCount: 1 };
        const isUnicode = /[^\u0000-\u00FF]/.test(text);
        const perSms = isUnicode ? 70 : 160;
        const len = text.length;
        return { len, smsCount: Math.max(1, Math.ceil(len / perSms)) };
    }

    // ── Init ───────────────────────────────────────────────────────────────────
    $(document).ready(function () {
        institutionId  = parseInt(sessionStorage.getItem('institutionId')  || '0');
        registrationId = parseInt(sessionStorage.getItem('registrationId') || '0');
        if (!institutionId) {
            $(document).on('app-session-ready', function () {
                institutionId  = parseInt(sessionStorage.getItem('institutionId')  || '0');
                registrationId = parseInt(sessionStorage.getItem('registrationId') || '0');
                if (institutionId) init();
            });
            return;
        }
        init();
    });

    function init() {
        loadSmsInfo();
        loadCustomers(1, null, null);
    }

    // ── SMS balance ────────────────────────────────────────────────────────────
    function loadSmsInfo() {
        $.get('/api/Sms/info', { institutionId }).done(function (res) {
            if (res.success)
                $('#smsBalanceChip').html('<i class="fas fa-envelope me-1"></i>' + res.smsBalance + ' SMS');
            else
                $('#smsBalanceChip').text('N/A');
        }).fail(function () { $('#smsBalanceChip').text('Error'); });
    }

    // ── Customer list ──────────────────────────────────────────────────────────
    function loadCustomers(page, phone, custNo) {
        custPage  = page;
        lastPhone = phone;
        lastCustNo = custNo;

        $('#custSpinner').show(); $('#custTableWrap').hide();
        $('#custPagerTop,#custPagerBottom').empty();

        const p = { institutionId, page, pageSize: CUST_PAGE };
        if (phone)  p.phone = phone;
        if (custNo) p.customerNumber = custNo;

        $.get('/api/Sms/customers', p).done(function (res) {
            $('#custSpinner').hide();
            $('#custTableWrap').show();
            $('#searchSpinner').hide();

            custTotalPages = res.totalPages || 1;

            $('#custTotalCount').text(res.total || 0);

            const $b = $('#custBody').empty();
            if (!res.success || !res.data.length) {
                $b.append('<tr><td colspan="5" class="no-data"><i class="fas fa-users-slash me-2"></i>কোনো কাস্টমার পাওয়া যায়নি</td></tr>');
                updateSelBadge(); return;
            }

            res.data.forEach(function (c) {
                $b.append(
                    '<tr>' +
                    '<td style="text-align:center;"><input type="checkbox" class="cust-chk" data-id="' + c.CustomerID + '" data-phone="' + (c.Phone || '') + '" onchange="onCheckChange()"></td>' +
                    '<td class="cust-num">' + (c.CustomerNumber || '') + '</td>' +
                    '<td class="cust-name">' + (c.CustomerName || '') + '</td>' +
                    '<td>' + (c.Phone || '<span style="color:#ccc;">—</span>') + '</td>' +
                    '<td style="font-size:11px;color:#999;">' + (c.Address || '—') + '</td>' +
                    '</tr>'
                );
            });

            $('#chkAll').prop('checked', false).prop('indeterminate', false);
            updateSelBadge();
            renderPager(res.page, res.totalPages);
        }).fail(function () {
            $('#custSpinner').hide(); $('#custTableWrap').show();
        });
    }

    window.searchCustomers = function () {
        const phone  = $('#searchPhone').val().trim() || null;
        const custNo = $('#searchCustNo').val().trim() || null;
        loadCustomers(1, phone, custNo);
    };

    window.clearSearch = function () {
        $('#searchPhone,#searchCustNo').val('');
        loadCustomers(1, null, null);
    };

    // ── Search input handlers ──────────────────────────────────────────────────
    let searchTimer = null;

    // Enter key → instant search
    $(document).on('keydown', '#searchPhone,#searchCustNo', function (e) {
        if (e.key === 'Enter') {
            clearTimeout(searchTimer);
            searchCustomers();
        }
    });

    // Mobile number → debounce auto-search (500ms)
    $(document).on('input', '#searchPhone', function () {
        $('#searchCustNo').val('');
        const val = $(this).val().trim();
        clearTimeout(searchTimer);
        $('#searchSpinner').show();
        if (val.length === 0) {
            $('#searchSpinner').hide();
            loadCustomers(1, null, null);
            return;
        }
        if (val.length < 4) { $('#searchSpinner').hide(); return; }
        searchTimer = setTimeout(function () {
            loadCustomers(1, val, null);
        }, 500);
    });

    // Customer No → debounce auto-search (400ms)
    $(document).on('input', '#searchCustNo', function () {
        $('#searchPhone').val('');
        const val = $(this).val().trim();
        clearTimeout(searchTimer);
        if (val.length === 0) {
            loadCustomers(1, null, null);
            return;
        }
        searchTimer = setTimeout(function () {
            loadCustomers(1, null, val);
        }, 400);
    });


    // ── Compose bar toggle ─────────────────────────────────────────────────────
    let composeOpen = false;
    window.toggleCompose = function () {
        composeOpen = !composeOpen;
        if (composeOpen) {
            $('#composeExpanded').slideDown(180);
            $('#composeArrow').addClass('open');
            setTimeout(() => $('#smsText').focus(), 200);
        } else {
            $('#composeExpanded').slideUp(180);
            $('#composeArrow').removeClass('open');
        }
    };

    // auto-open compose when first customer selected
    function autoOpenCompose() {
        if (!composeOpen && $('.cust-chk:checked').length === 1) {
            toggleCompose();
        }
    }

    // ── Select helpers ─────────────────────────────────────────────────────────
    window.toggleAll = function (chk) {
        $('.cust-chk').prop('checked', chk.checked);
        $('.cust-table tbody tr').toggleClass('row-checked', chk.checked);
        updateSelBadge();
        updateCounter();
    };

    window.deselectAll = function () {
        $('.cust-chk').prop('checked', false);
        $('.cust-table tbody tr').removeClass('row-checked');
        $('#chkAll').prop('checked', false).prop('indeterminate', false);
        updateSelBadge();
        updateCounter();
    };

    window.onCheckChange = function () {
        const total   = $('.cust-chk').length;
        const checked = $('.cust-chk:checked').length;
        $('#chkAll').prop('indeterminate', checked > 0 && checked < total);
        $('#chkAll').prop('checked', checked === total && total > 0);
        $(event.target).closest('tr').toggleClass('row-checked', event.target.checked);
        updateSelBadge();
        updateCounter();
        autoOpenCompose();
    };

    function updateSelBadge() {
        const cnt = $('.cust-chk:checked').length;
        const $b  = $('#selBadge');
        const label = (window.currentLang === 'en' ? 'Selected: ' : 'নির্বাচিত: ') + cnt;
        if (cnt > 0) {
            $b.removeClass('sel-zero').addClass('sel-badge').text(label);
            $('#composeSelInfo').text(label).css('color','#e65100');
        } else {
            $b.removeClass('sel-badge').addClass('sel-zero')
              .text(window.currentLang === 'en' ? 'Selected: 0' : 'নির্বাচিত: 0');
            $('#composeSelInfo').text(window.currentLang === 'en' ? 'Selected: 0' : 'নির্বাচিত: 0').css('color','#aaa');
        }
    }

    // ── SMS counter ────────────────────────────────────────────────────────────
    window.updateCounter = function () {
        const { len, smsCount } = calcSms($('#smsText').val());
        const selCnt = $('.cust-chk:checked').length;
        const total  = selCnt * smsCount;
        $('#cLen').text(len);
        $('#cSms').text(smsCount);
        $('#cTotal').text(total);
        // update collapsed header info
        if (len > 0 && selCnt > 0) {
            $('#composeSmsInfo').text('→ ' + total + ' SMS পাঠাবে');
        } else {
            $('#composeSmsInfo').text('');
        }
    };

    // ── Send SMS ───────────────────────────────────────────────────────────────
    window.sendSms = function () {
        const message = $('#smsText').val().trim();
        if (!message) { showErr('বার্তা লিখুন'); return; }

        const phones = [], custIds = [];
        $('.cust-chk:checked').each(function () {
            const ph = $(this).data('phone');
            if (ph) { phones.push(String(ph)); custIds.push(parseInt($(this).data('id'))); }
        });

        if (!phones.length) { showErr('কমপক্ষে একজন কাস্টমার নির্বাচন করুন'); return; }
        hideErr();

        const { smsCount } = calcSms(message);
        const totalSms = phones.length * smsCount;
        const confirmMsg = phones.length + ' জন কাস্টমারকে মোট ' + totalSms + ' টি SMS পাঠাবেন?';
        if (!confirm(confirmMsg)) return;

        $('#sendBtn').prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-2"></i> পাঠানো হচ্ছে...');

        $.ajax({
            url: '/api/Sms/send',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ institutionId, registrationId, message, phoneNumbers: phones, customerIds: custIds })
        }).done(function (res) {
            if (res.success) {
                showToast(res.message, 'success');
                $('#smsText').val('');
                updateCounter();
                loadSmsInfo();
                deselectAll();
                // collapse compose bar after send
                if (composeOpen) toggleCompose();
            } else {
                showErr(res.message);
            }
        })
    };

    // ────────────────────────────────────────────────────────────────────────────
})();
