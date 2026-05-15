// Customer Details Page
(function () {
    'use strict';

    let institutionId, registrationId, customerId, clothForId;
    let dueOrdersData = [];
    let accountsData = [];

    $(document).ready(function () {
        institutionId = parseInt(sessionStorage.getItem('institutionId'));
        registrationId = parseInt(sessionStorage.getItem('registrationId'));

        const params = new URLSearchParams(window.location.search);
        customerId = parseInt(params.get('customerId'));
        clothForId = parseInt(params.get('clothForId')) || 1;

        if (!institutionId || !registrationId || !customerId) {
            window.location.href = '/add-customer.html';
            return;
        }

        loadCustomerProfile();
        loadDresses();
        loadAccounts();
        loadDueOrders();
        loadPaymentRecords();
        loadCustomerOrders('Pending', '#pendingOrdersContainer');
        loadCustomerOrders('Delivered', '#deliveredOrdersContainer');

        // Re-apply language when toggled (for dynamically rendered tables)
        // Listen to languageChanged (fired by toggleLanguage, NOT by updateLanguage — no infinite loop)
        $(document).on('languageChanged', function () {
            // updateLanguage() already ran in toggleLanguage() before this event fired
            // Nothing extra needed here — data-en/data-bn elements are already updated
        });

        // Tab switching handled by inline script in HTML

        // Dress change
        $(document).on('change', '#dressSelect', function () {
            const dressId = parseInt($(this).val());
            if (dressId > 0) loadMeasurements(dressId);
            else $('#measurementArea').html('<div class="empty-msg">পোষাক নির্বাচন করুন</div>');
        });

        // Style checkbox highlight
        $(document).on('change', '.style-checkbox', function () {
            $(this).closest('.style-item').toggleClass('checked', this.checked);
        });
    });

    function loadCustomerProfile() {
        $.get(`/api/customer-page/customer-details?customerId=${customerId}&institutionId=${institutionId}`, function (r) {
            if (!r.success) return;
            const c = r.data;
            const initials = (c.customerName || 'C').charAt(0).toUpperCase();
            const photoUrl = `/api/Customers/${customerId}/photo?institutionId=${institutionId}&_t=${Date.now()}`;
            const html = `
                <div class="profile-avatar-wrap" onclick="openPhotoModal()" title="ছবি বদলাতে ক্লিক করুন">
                    <img id="profilePhoto" class="profile-photo" src="${photoUrl}"
                        onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
                        alt="ছবি">
                    <div class="profile-avatar" style="display:none;">${escapeHtml(initials)}</div>
                    <div class="profile-photo-change"><i class="fas fa-camera"></i></div>
                </div>
                <div class="profile-info">
                    <ul>
                        <li><strong>(${escapeHtml(c.customerNumber)}) ${escapeHtml(c.customerName)}</strong></li>
                        <li><i class="fas fa-phone me-1" style="color:#6c7ae0;"></i> ${escapeHtml(c.phone || '-')}</li>
                        <li><i class="fas fa-map-marker-alt me-1" style="color:#6c7ae0;"></i> ${escapeHtml(c.address || '-')}</li>
                    </ul>
                </div>`;
            $('#profileSection').html(html);
        });
    }

    function loadDresses() {
        $.get(`/api/customer-page/dresses-by-gender?institutionId=${institutionId}&clothForId=${clothForId}&customerId=${customerId}`, function (r) {
            if (!r.success || !r.data.length) return;
            let html = `<option value="0">মাপ যুক্ত করার জন্য পোষাক নির্বাচন করুন</option>`;
            r.data.forEach(function (d) {
                const cls = d.hasMeasurement ? ' class="has-measurement"' : '';
                const mark = d.hasMeasurement ? ' ✔' : '';
                html += `<option value="${d.dressId}"${cls}>${escapeHtml(d.dressName)}${mark}</option>`;
            });
            $('#dressSelect').html(html);
        });
    }

    function loadMeasurements(dressId) {
        $('#measurementArea').html('<div class="loading">লোড হচ্ছে...</div>');
        $.get(`/api/customer-page/measurement-types?institutionId=${institutionId}&dressId=${dressId}&customerId=${customerId}`, function (r) {
            if (!r.success) { $('#measurementArea').html('<div class="empty-msg">লোড করতে সমস্যা হয়েছে</div>'); return; }
            const d = r.data;
            if (!d.groups || d.groups.length === 0) {
                $('#measurementArea').html('<div class="empty-msg">এই পোষাকের জন্য কোনো মাপের টেমপ্লেট যুক্ত করা হয়নি। <a href="#">মাপ যুক্ত করুন</a></div>');
                return;
            }

            let html = `<div class="measurement-section" id="measureGroups">`;
            d.groups.forEach(function (g) {
                html += `<div class="measurement-group">`;
                if (g.types.length > 0) {
                    g.types.forEach(function (mt) {
                        html += `<div class="measurement-item">
                            <label>${escapeHtml(mt.measurementType)}</label>
                            <input type="text" class="meas-input" data-type-id="${mt.measurementTypeId}" value="${escapeHtml(mt.measurement)}" placeholder="-">
                        </div>`;
                    });
                }
                html += `</div>`;
            });
            html += `</div>`;

            // Style section
            loadStyles(dressId, html, d.cdDetails);
        });
    }

    function loadStyles(dressId, measHtml, cdDetails) {
        $.get(`/api/customer-page/dress-styles?institutionId=${institutionId}&dressId=${dressId}&customerId=${customerId}`, function (r) {
            let styleHtml = '';
            if (r.success && r.data.length > 0) {
                styleHtml = `<div class="style-section"><h6 style="color:#555;font-weight:700;margin-bottom:12px;">পছন্দের স্টাইলগুলো বেছে নিন</h6>`;
                r.data.forEach(function (cat) {
                    styleHtml += `<div class="style-category"><h6>${escapeHtml(cat.categoryName)}</h6><div class="style-items">`;
                    cat.styles.forEach(function (s) {
                        const chk = s.isChecked ? 'checked' : '';
                        const cls = s.isChecked ? 'style-item checked' : 'style-item';
                        styleHtml += `<div class="${cls}" data-style-id="${s.styleId}">
                            <label>
                                <input type="checkbox" class="style-checkbox" ${chk}> ${escapeHtml(s.styleName)}
                            </label>
                            <div class="style-measure">
                                <input type="text" class="style-meas-input" value="${escapeHtml(s.styleMeasurement)}" placeholder="মাপ (ঐচ্ছিক)">
                            </div>
                        </div>`;
                    });
                    styleHtml += `</div></div>`;
                });
                styleHtml += `</div>`;
            }

            const detailsHtml = `
                <div class="details-box">
                    <label>পোষাক সম্পর্কে বিস্তারিত বিবরণ</label>
                    <textarea id="cdDetails" placeholder="বিস্তারিত...">${escapeHtml(cdDetails)}</textarea>
                </div>`;

            const btnHtml = `
                <div>
                    <button class="btn-save" onclick="saveMeasurements(${dressId})">
                        <i class="fas fa-save"></i> মাপ যুক্ত/পরিবর্তন করুন
                    </button>
                </div>`;

            $('#measurementArea').html(measHtml + styleHtml + detailsHtml + btnHtml);
        });
    }

    window.saveMeasurements = function (dressId) {
        const measurements = [];
        $('.meas-input').each(function () {
            measurements.push({ measurementTypeId: parseInt($(this).data('type-id')), measurement: $(this).val().trim() });
        });

        const styles = [];
        $('.style-item').each(function () {
            const styleId = parseInt($(this).data('style-id'));
            const isChecked = $(this).find('.style-checkbox').is(':checked');
            const styleMeasurement = $(this).find('.style-meas-input').val().trim();
            styles.push({ styleId, isChecked, styleMeasurement });
        });

        const cdDetails = $('#cdDetails').val().trim();
        const $btn = $('.btn-save');
        $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> ...');

        $.ajax({
            url: '/api/customer-page/save-measurements',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ institutionId, registrationId, customerId, dressId, cdDetails, measurements, styles }),
            success: function (r) {
                showMsg('#measureSaveMsg', r.success ? 'success' : 'error', r.message || 'সমস্যা হয়েছে');
                $btn.prop('disabled', false).html('<i class="fas fa-save"></i> মাপ যুক্ত/পরিবর্তন করুন');
            },
            error: function () {
                showMsg('#measureSaveMsg', 'error', 'সমস্যা হয়েছে। আবার চেষ্টা করুন।');
                $btn.prop('disabled', false).html('<i class="fas fa-save"></i> মাপ যুক্ত/পরিবর্তন করুন');
            }
        });
    };

    function loadDueOrders() {
        $('#dueTableContainer').html('<div class="loading">লোড হচ্ছে...</div>');
        $.get(`/api/customer-page/due-orders?customerId=${customerId}&institutionId=${institutionId}`, function (r) {
            if (!r.success || !r.data.length) {
                $('#dueTableContainer').html('<div class="empty-msg">কোনো বকি অর্ডার নেই</div>');
                $('#accountRow').addClass('collect-panel-hidden');
                return;
            }
            dueOrdersData = r.data;
            renderDueTable(r.data);
        });
    }

    function renderDueTable(orders) {
        let totalAmt = 0, totalPaid = 0, totalDue = 0;
        let rows = '';
        orders.forEach(function (o) {
            totalAmt += o.orderAmount;
            totalPaid += o.paidAmount;
            totalDue += o.dueAmount;
            rows += `<tr data-order-id="${o.orderId}" data-delivery-status="${o.deliveryStatus}" data-due="${o.dueAmount}">
                <td><input type="checkbox" class="order-row-chk" style="width:16px;height:16px;cursor:pointer;accent-color:#6c7ae0;"></td>
                <td><strong>${o.orderSerialNumber}</strong></td>
                <td>${formatDate(o.orderDate)}</td>
                <td>${o.deliveryDate ? formatDate(o.deliveryDate) : '-'}</td>
                <td style="text-align:left;">${escapeHtml(o.details || '-')}</td>
                <td>${o.orderAmount.toFixed(2)}</td>
                <td>${o.paidAmount.toFixed(2)}</td>
                <td class="due-paid-col">${o.dueAmount.toFixed(2)} /-</td>
                <td>${o.discount.toFixed(2)} /-</td>
                <td><input type="number" class="row-collect-input due-input" min="0" max="${o.dueAmount.toFixed(2)}" step="0.01" placeholder="0" value="" style="display:none;"></td>
                <td><span class="badge ${o.deliveryStatus === 'Delivered' ? 'bg-success' : 'bg-warning text-dark'}">${o.deliveryStatus}</span></td>
            </tr>`;
        });

        const html = `<table>
            <thead><tr>
                <th style="width:36px;"><input type="checkbox" id="checkAllOrders" style="width:16px;height:16px;cursor:pointer;accent-color:#fff;" title="সব সিলেক্ট করুন"></th>
                <th data-en="Order No" data-bn="অর্ডার নং">অর্ডার নং</th>
                <th data-en="Order" data-bn="অর্ডার">অর্ডার</th>
                <th data-en="Delivery" data-bn="ডেলিভারী">ডেলিভারী</th>
                <th data-en="Dress Details" data-bn="পোষাকের বিবরণ">পোষাকের বিবরণ</th>
                <th data-en="Total" data-bn="মোট টাকা">মোট টাকা</th>
                <th data-en="Paid" data-bn="পেইড">পেইড</th>
                <th data-en="Due" data-bn="বাকি">বাকি</th>
                <th data-en="Discount" data-bn="ডিসকাউন্ট">ডিসকাউন্ট</th>
                <th data-en="Collecting" data-bn="কত নিচ্ছেন?">কত নিচ্ছেন?</th>
                <th data-en="Status" data-bn="অবস্থা">অবস্থা</th>
            </tr></thead>
            <tbody>${rows}</tbody>
            <tfoot><tr>
                <td></td>
                <td colspan="4" style="text-align:right;padding-right:8px;font-weight:700;" data-en="Total:" data-bn="মোট:">মোট:</td>
                <td>${totalAmt.toFixed(2)}</td>
                <td>${totalPaid.toFixed(2)}</td>
                <td class="due-paid-col">${totalDue.toFixed(2)} /-</td>
                <td></td><td></td><td></td>
            </tr></tfoot>
        </table>`;
        $('#dueTableContainer').html(html);

        // Check-all toggle
        $(document).off('change.checkall').on('change.checkall', '#checkAllOrders', function () {
            const checked = $(this).is(':checked');
            $('#dueTableContainer tbody .order-row-chk').each(function () {
                $(this).prop('checked', checked).trigger('change');
            });
        });

        // Per-row checkbox: show/hide collect input and auto-fill due amount
        $(document).off('change.rowchk').on('change.rowchk', '.order-row-chk', function () {
            const $tr = $(this).closest('tr');
            const $input = $tr.find('.row-collect-input');
            if ($(this).is(':checked')) {
                const due = parseFloat($tr.data('due')) || 0;
                $input.val(due.toFixed(2)).show();
            } else {
                $input.val('').hide();
            }
            updateCollectPanelFromRows();
        });

        // Per-row collect input change → update panel total
        $(document).off('input.rowcollect').on('input.rowcollect', '.row-collect-input', function () {
            const $tr = $(this).closest('tr');
            const due = parseFloat($tr.data('due')) || 0;
            let val = parseFloat($(this).val()) || 0;
            if (val > due) { $(this).val(due.toFixed(2)); val = due; }
            if (val < 0) { $(this).val(0); }
            updateCollectPanelFromRows();
        });

        // Update total due display
        $('#totalDueDisplay').text(totalDue.toFixed(2) + ' /-');
        $('#collectAmountInput').attr('max', totalDue).val('');
        $('#collectDiscountInput').val('');
        $('#accountRow').removeClass('collect-panel-hidden');
        renderAccountSelect();

        // Apply current language after everything is shown
        if (typeof window.updateLanguage === 'function') window.updateLanguage();
    }

    function updateCollectPanelFromRows() {
        let total = 0;
        $('#dueTableContainer tbody tr').each(function () {
            const $chk = $(this).find('.order-row-chk');
            if ($chk.is(':checked')) {
                total += parseFloat($(this).find('.row-collect-input').val()) || 0;
            }
        });
        // Sync to the main collect input
        $('#collectAmountInput').val(total > 0 ? total.toFixed(2) : '');
    }

    window.collectDue = function () {
        const discountVal = $('#collectDiscountInput').val().trim();
        const discountInput = parseFloat(discountVal) || 0;
        const accountId = parseInt($('#accountSelect').val()) || null;

        // Collect from checked rows using per-row amounts
        const payments = [];
        let anyChecked = false;
        let remainingDiscount = discountInput;

        $('#dueTableContainer tbody tr').each(function () {
            const $chk = $(this).find('.order-row-chk');
            if (!$chk.is(':checked')) return;
            anyChecked = true;

            const orderId = parseInt($(this).data('order-id'));
            const deliveryStatus = $(this).data('delivery-status');
            const due = parseFloat($(this).data('due')) || 0;
            const collectVal = parseFloat($(this).find('.row-collect-input').val()) || 0;

            const applyDiscount = Math.min(remainingDiscount, due - collectVal);
            remainingDiscount = parseFloat((remainingDiscount - applyDiscount).toFixed(2));

            if (collectVal > 0 || applyDiscount > 0) {
                payments.push({
                    orderId,
                    paidAmount: collectVal,
                    discountAmount: applyDiscount,
                    deliveryStatus,
                    accountId
                });
            }
        });

        if (!anyChecked) {
            showMsg('#dueMsg', 'error', 'অন্তত একটি অর্ডার চেকবক্সে টিক দিন');
            return;
        }

        if (!payments.length) {
            showMsg('#dueMsg', 'error', 'নির্বাচিত অর্ডারে কোনো পেমেন্ট দেওয়া হয়নি');
            return;
        }

        const $btn = $('.btn-collect');
        $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> ...');

        $.ajax({
            url: '/api/customer-page/collect-due',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ institutionId, registrationId, customerId, payments }),
            success: function (r) {
                if (r.success) {
                    showMsg('#dueMsg', 'success', r.message);
                    $('#collectAmountInput').val('');
                    $('#collectDiscountInput').val('');
                    setTimeout(function () { loadDueOrders(); loadPaymentRecords(); }, 800);
                } else {
                    showMsg('#dueMsg', 'error', r.message);
                }
                $btn.prop('disabled', false).html('<i class="fas fa-hand-holding-usd"></i> <span data-en="Collect Due" data-bn="বাকি টাকা সংগ্রহ করুন">বাকি টাকা সংগ্রহ করুন</span>');
            },
            error: function () {
                showMsg('#dueMsg', 'error', 'সমস্যা হয়েছে। আবার চেষ্টা করুন।');
                $btn.prop('disabled', false).html('<i class="fas fa-hand-holding-usd"></i> <span data-en="Collect Due" data-bn="বাকি টাকা সংগ্রহ করুন">বাকি টাকা সংগ্রহ করুন</span>');
            }
        });
    };

    function loadPaymentRecords() {
        $('#payRecordsContainer').html('<div class="loading">লোড হচ্ছে...</div>');
        $.get(`/api/customer-page/payment-records?customerId=${customerId}&institutionId=${institutionId}`, function (r) {
            if (!r.success || !r.data.length) {
                $('#payRecordsContainer').html('<div class="empty-msg">কোনো রেকর্ড নেই</div>');
                return;
            }
            let rows = '';
            r.data.forEach(function (p) {
                rows += `<tr>
                    <td><strong>${p.orderSerialNumber}</strong></td>
                    <td>${p.amount.toFixed(2)}</td>
                    <td>${escapeHtml(p.account)}</td>
                    <td>${escapeHtml(p.paymentStatus)}</td>
                    <td>${p.paidDate ? formatDate(p.paidDate) : '-'}</td>
                </tr>`;
            });
            $('#payRecordsContainer').html(`<table>
                <thead><tr>
                    <th data-en="Order No" data-bn="অর্ডার নং">অর্ডার নং</th>
                    <th data-en="Amount" data-bn="পরিমাণ">পরিমাণ</th>
                    <th data-en="Account" data-bn="অ্যাকাউন্ট">অ্যাকাউন্ট</th>
                    <th data-en="Payment Status" data-bn="পেইড স্ট্যাটাস">পেইড স্ট্যাটাস</th>
                    <th data-en="Date" data-bn="তারিখ">তারিখ</th>
                </tr></thead>
                <tbody>${rows}</tbody>
            </table>`);
            if (typeof window.updateLanguage === 'function') window.updateLanguage();
        });
    }

    function loadAccounts() {
        $.get(`/api/customer-page/accounts?institutionId=${institutionId}`, function (r) {
            if (r.success) {
                accountsData = r.data;
                renderAccountSelect();
            }
        });
    }

    function renderAccountSelect() {
        let html = '<option value="">Without Account</option>';
        accountsData.forEach(function (a) {
            const selected = a.isDefault ? ' selected' : '';
            html += `<option value="${a.accountId}"${selected}>${escapeHtml(a.accountName)}</option>`;
        });
        $('#accountSelect').html(html);
    }

    function loadCustomerOrders(status, container) {
        $(container).html('<div class="loading">লোড হচ্ছে...</div>');
        $.get(`/api/customer-page/customer-orders?customerId=${customerId}&institutionId=${institutionId}&status=${status}`, function (r) {
            if (!r.success || !r.data.length) {
                $(container).html('<div class="empty-msg">কোনো অর্ডার নেই</div>');
                return;
            }
            let rows = '';
            r.data.forEach(function (o) {
                rows += `<tr>
                    <td><strong>${o.orderSerialNumber}</strong></td>
                    <td>${formatDate(o.orderDate)}</td>
                    <td>${o.deliveryDate ? formatDate(o.deliveryDate) : '-'}</td>
                    <td style="text-align:left;">${escapeHtml(o.details || '-')}</td>
                    <td>${o.orderAmount.toFixed(2)}</td>
                    <td>${o.discount.toFixed(2)}</td>
                    <td>${o.paidAmount.toFixed(2)}</td>
                    <td>${o.dueAmount.toFixed(2)}</td>
                    <td><span class="badge ${o.deliveryStatus === 'Delivered' ? 'bg-success' : 'bg-warning text-dark'}">${o.deliveryStatus}</span></td>
                </tr>`;
            });
            $(container).html(`<table>
                <thead><tr>
                    <th data-en="Order No" data-bn="অর্ডার নং">অর্ডার নং</th>
                    <th data-en="Order" data-bn="অর্ডার">অর্ডার</th>
                    <th data-en="Delivery" data-bn="ডেলিভারী">ডেলিভারী</th>
                    <th data-en="Dress Details" data-bn="পোষাকের বিবরণ">পোষাকের বিবরণ</th>
                    <th data-en="Total" data-bn="মোট টাকা">মোট টাকা</th>
                    <th data-en="Discount" data-bn="ছাড়">ছাড়</th>
                    <th data-en="Paid" data-bn="পেইড">পেইড</th>
                    <th data-en="Due" data-bn="বাকি">বাকি</th>
                    <th data-en="Status" data-bn="অবস্থা">অবস্থা</th>
                </tr></thead>
                <tbody>${rows}</tbody>
            </table>`);
            if (typeof window.updateLanguage === 'function') window.updateLanguage();
        });
    }

    // ── Photo modal ───────────────────────────────────────────────
    var photoFile = null;

    window.openPhotoModal = function () {
        photoFile = null;
        $('#photoFileInput').val('');
        $('#photoPreviewImg').hide().attr('src', '');
        $('#photoPlaceholder').show();
        $('#btnSavePhoto').prop('disabled', false).html('<i class="fas fa-save me-1"></i>সেভ করুন');

        // Load existing photo into modal preview
        var img = new Image();
        img.onload = function () {
            $('#photoPlaceholder').hide();
            $('#photoPreviewImg').attr('src', img.src).show();
        };
        img.src = '/api/Customers/' + customerId + '/photo?institutionId=' + institutionId + '&_t=' + Date.now();

        $('#photoModal').addClass('show');
    };

    window.closePhotoModal = function () {
        photoFile = null;
        $('#photoModal').removeClass('show');
    };

    $(document).on('change', '#photoFileInput', function () {
        var file = this.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            alert('ছবির সাইজ ২ MB এর বেশি হওয়া যাবে না');
            $(this).val('');
            return;
        }
        photoFile = file;
        var reader = new FileReader();
        reader.onload = function (e) {
            $('#photoPlaceholder').hide();
            $('#photoPreviewImg').attr('src', e.target.result).show();
        };
        reader.readAsDataURL(file);
    });

    window.saveCustomerPhoto = function () {
        if (!photoFile) { alert('অনুগ্রহ করে একটি ছবি বেছে নিন'); return; }

        var savedFile = photoFile;
        var formData = new FormData();
        formData.append('photo', savedFile);

        $('#btnSavePhoto').prop('disabled', true).text('সেভ হচ্ছে...');

        $.ajax({
            url: '/api/Customers/' + customerId + '/photo?institutionId=' + institutionId,
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (r) {
                if (r.success) {
                    closePhotoModal();
                    // Update profile photo immediately using the selected file's data URL
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        var dataUrl = e.target.result;
                        var $photo = $('#profilePhoto');
                        if ($photo.length) {
                            $photo[0].onerror = null;
                            $photo.attr('src', dataUrl).show();
                            $photo.next('.profile-avatar').hide();
                        } else {
                            // avatar was showing (no previous photo), swap to img
                            var $wrap = $('.profile-avatar-wrap');
                            $wrap.find('.profile-avatar').hide();
                            $wrap.prepend(`<img id="profilePhoto" class="profile-photo" src="${dataUrl}" alt="ছবি">`);
                        }
                    };
                    reader.readAsDataURL(savedFile);
                } else {
                    alert(r.message || 'ছবি সেভ করতে সমস্যা হয়েছে');
                    $('#btnSavePhoto').prop('disabled', false).html('<i class="fas fa-save me-1"></i>সেভ করুন');
                }
            },
            error: function () {
                alert('সমস্যা হয়েছে। আবার চেষ্টা করুন।');
                $('#btnSavePhoto').prop('disabled', false).html('<i class="fas fa-save me-1"></i>সেভ করুন');
            }
        });
    };
    // ─────────────────────────────────────────────────────────────

    function showMsg(selector, type, msg) {
        const $el = $(selector);
        $el.removeClass('alert-success alert-error')
            .addClass(type === 'success' ? 'alert-success' : 'alert-error')
            .text(msg).show();
        if (type === 'success') setTimeout(function () { $el.hide(); }, 3000);
    }

    function formatDate(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }

    function escapeHtml(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
})();
