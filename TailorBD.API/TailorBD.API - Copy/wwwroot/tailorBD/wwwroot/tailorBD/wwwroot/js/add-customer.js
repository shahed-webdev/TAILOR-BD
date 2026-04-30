// Add Customer Page
(function () {
    'use strict';

    let institutionId, registrationId;
    let phoneCheckTimer = null;
    let duplicateExists = false;

    $(document).ready(function () {
        institutionId = parseInt(sessionStorage.getItem('institutionId'));
        registrationId = parseInt(sessionStorage.getItem('registrationId'));

        if (!institutionId || !registrationId) {
            window.location.href = '/login.html';
            return;
        }

        loadClothForList();
        loadNextCustomerNo();

        // Phone check on input
        $('#mobileNo').on('input', function () {
            clearTimeout(phoneCheckTimer);
            const phone = $(this).val().trim();
            if (phone.length >= 6) {
                phoneCheckTimer = setTimeout(function () { checkMobile(phone); }, 500);
            } else {
                $('#phoneCheckMsg').text('').removeClass('exists ok');
            }
        });

        // Name+Mobile duplicate check
        $('#customerName, #mobileNo').on('blur', function () {
            checkDuplicate();
        });
    });

    function loadNextCustomerNo() {
        $.get(`/api/customer-page/next-customer-number?institutionId=${institutionId}`, function (r) {
            if (r.success) $('#customerNo').text(r.data);
        });
    }

    function loadClothForList() {
        $.get('/api/customer-page/cloth-for-list', function (r) {
            if (!r.success || !r.data.length) return;
            let html = '';
            r.data.forEach(function (item, i) {
                const checked = i === 0 ? 'checked' : '';
                html += `<div class="gender-option">
                    <input type="radio" name="gender" id="g_${item.clothForId}" value="${item.clothForId}" ${checked}>
                    <label for="g_${item.clothForId}">${escapeHtml(item.clothFor)}</label>
                </div>`;
            });
            $('#genderOptions').html(html);
        });
    }

    function checkMobile(phone) {
        $.get(`/api/customer-page/check-mobile?institutionId=${institutionId}&phone=${encodeURIComponent(phone)}`, function (r) {
            if (r.success && r.exists) {
                const genderVal = $('input[name="gender"]:checked').val() || '1';
                $('#phoneCheckMsg')
                    .html(`নাম্বারটি ইতিমধ্যে নিবন্ধিত। <a href="/customer-details.html?customerId=${r.customerId}&clothForId=${r.clothForId}">বিস্তারিত দেখুন &raquo;</a>`)
                    .removeClass('ok').addClass('exists');
            } else {
                $('#phoneCheckMsg').text('').removeClass('exists ok');
            }
        });
    }

    function checkDuplicate() {
        const name = $('#customerName').val().trim();
        const phone = $('#mobileNo').val().trim();
        if (!name || !phone) return;

        $.get(`/api/customer-page/check-name-mobile?institutionId=${institutionId}&name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}`, function (r) {
            if (r.success && r.exists) {
                duplicateExists = true;
                $('#duplicateMsg').html(`<i class="fas fa-exclamation-triangle me-1"></i> ${escapeHtml(name)} মোবাইল: ${escapeHtml(phone)} পূর্বে নিবন্ধিত, পুনরায় নিবন্ধন করা যাবে না`).show();
                $('#btnNext').prop('disabled', true);
            } else {
                duplicateExists = false;
                $('#duplicateMsg').hide();
                $('#btnNext').prop('disabled', false);
            }
        });
    }

    window.submitCustomer = function () {
        const name = $('#customerName').val().trim();
        const phone = $('#mobileNo').val().trim();
        const address = $('#address').val().trim();
        const clothForId = parseInt($('input[name="gender"]:checked').val()) || 1;

        let valid = true;
        if (!name) { $('#nameError').show(); $('#customerName').addClass('error'); valid = false; }
        else { $('#nameError').hide(); $('#customerName').removeClass('error'); }
        if (!phone) { $('#mobileError').show(); $('#mobileNo').addClass('error'); valid = false; }
        else { $('#mobileError').hide(); $('#mobileNo').removeClass('error'); }
        if (!valid || duplicateExists) return;

        const $btn = $('#btnNext');
        $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> ...');

        $.ajax({
            url: '/api/customer-page/add-customer',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ institutionId, registrationId, clothForId, customerName: name, phone, address }),
            success: function (r) {
                if (r.success) {
                    window.location.href = `/customer-details.html?customerId=${r.data.customerId}&clothForId=${r.data.clothForId}`;
                } else {
                    $('#duplicateMsg').html(`<i class="fas fa-exclamation-triangle me-1"></i> ${escapeHtml(r.message)}`).show();
                    $btn.prop('disabled', false).html('<i class="fas fa-arrow-right"></i> পরবর্তী ধাপ');
                }
            },
            error: function () {
                alert('সমস্যা হয়েছে। আবার চেষ্টা করুন।');
                $btn.prop('disabled', false).html('<i class="fas fa-arrow-right"></i> পরবর্তী ধাপ');
            }
        });
    };

    function escapeHtml(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
})();
