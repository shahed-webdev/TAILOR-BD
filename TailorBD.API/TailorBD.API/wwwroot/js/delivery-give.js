// Delivery Give Page - JavaScript
(function() {
    'use strict';

    let institutionId = null;
    let registrationId = null;

    // Initialize page
    $(document).ready(function() {
        institutionId = parseInt(sessionStorage.getItem('institutionId'));
        registrationId = parseInt(sessionStorage.getItem('registrationId'));

        if (!institutionId || !registrationId) {
            alert('Session expired. Please login again.');
            window.location.href = '/login.html';
            return;
        }

        setupEventHandlers();
        setupAutocomplete();
        loadReadyOrders();
    });

    function setupEventHandlers() {
        $('input[name="searchType"]').on('change', function() {
            const searchType = $(this).val();
            if (searchType === 'number') {
                $('.search-by-number').addClass('active');
                $('.search-by-date').removeClass('active');
            } else {
                $('.search-by-number').removeClass('active');
                $('.search-by-date').addClass('active');
            }
        });

        $('#mobileNo, #orderNo').on('keypress', function(e) {
            if (e.which === 13) { e.preventDefault(); searchOrders(); }
        });

        $('#startDate, #endDate').on('keypress', function(e) {
            if (e.which === 13) { e.preventDefault(); searchOrders(); }
        });
    }

    function setupAutocomplete() {
        $('#mobileNo').autocomplete({
            source: function(request, response) {
                fetchSuggestions('phone', request.term, function(suggestions) { response(suggestions); });
            },
            minLength: 3,
            select: function(event, ui) { $(this).val(ui.item.value); return false; }
        });

        $('#orderNo').autocomplete({
            source: function(request, response) {
                fetchSuggestions('orderno', request.term, function(suggestions) { response(suggestions); });
            },
            minLength: 1,
            select: function(event, ui) { $(this).val(ui.item.value); return false; }
        });
    }

    function fetchSuggestions(field, term, callback) {
        $.ajax({
            url: `/api/delivery/search-suggestions?field=${field}&term=${encodeURIComponent(term)}&institutionId=${institutionId}`,
            method: 'GET',
            success: function(response) {
                callback(response.success && response.data ? response.data : []);
            },
            error: function() { callback([]); }
        });
    }

    window.searchOrders = function() {
        const searchType = $('input[name="searchType"]:checked').val();
        if (searchType === 'number') {
            loadReadyOrders($('#mobileNo').val().trim(), $('#orderNo').val().trim());
        } else {
            const startDate = $('#startDate').val();
            const endDate   = $('#endDate').val();
            if (!startDate || !endDate) {
                alert(window.currentLang === 'en' ? 'Please select both dates' : 'দয়া করে উভয় তারিখ নির্বাচন করুন');
                return;
            }
            loadReadyOrders(null, null, startDate, endDate);
        }
    };

    function loadReadyOrders(phone = '', orderNo = '', startDate = null, endDate = null) {
        const container = $('#ordersTableContainer');
        container.html('<div class="loading"><span class="lang-content" data-en="Loading..." data-bn="লোড হচ্ছে...">লোড হচ্ছে...</span></div>');
        $('#smsSendPanel').hide();

        let url = `/api/delivery/ready-orders?institutionId=${institutionId}`;
        if (phone)     url += `&phone=${encodeURIComponent(phone)}`;
        if (orderNo)   url += `&orderSerialNumbers=${encodeURIComponent(orderNo)}`;
        if (startDate) url += `&startDate=${startDate}`;
        if (endDate)   url += `&endDate=${endDate}`;

        $.ajax({
            url: url,
            method: 'GET',
            success: function(response) {
                if (response.success && response.data && response.data.orders.length > 0) {
                    renderOrdersTable(response.data.orders);
                } else {
                    container.html('<div class="empty-message">No orders found</div>');
                }
            },
            error: function(xhr) {
                console.error('Error loading orders:', xhr);
                container.html('<div class="error-message">Error loading orders. Please try again.</div>');
            }
        });
    }

    function renderOrdersTable(orders) {
        const container = $('#ordersTableContainer');

        if (!orders || orders.length === 0) {
            container.html('<div class="empty-message"><span class="lang-content" data-en="No ready-to-deliver orders found" data-bn="ডেলিভেরির জন্য প্রস্তুত কোন অর্ডার পাওয়া যায়নি">ডেলিভেরির জন্য প্রস্তুত কোন অর্ডার পাওয়া যায়নি</span></div>');
            return;
        }

        let html = `
            <table>
                <thead>
                    <tr>
                        <th style="width:40px; text-align:center;">
                            <input type="checkbox" id="selectAllOrders" title="Select All">
                        </th>
                        <th style="text-align:center;"><span class="lang-content" data-en="Order No." data-bn="অর্ডার নং">অর্ডার নং</span></th>
                        <th style="text-align:center;"><span class="lang-content" data-en="Customer Name" data-bn="কাস্টমারের নাম">কাস্টমারের নাম</span></th>
                        <th style="text-align:center;"><span class="lang-content" data-en="Phone" data-bn="মোবাইল">মোবাইল</span></th>
                        <th style="text-align:center;"><span class="lang-content" data-en="Address" data-bn="ঠিকানা">ঠিকানা</span></th>
                        <th style="min-width:200px; text-align:center;"><span class="lang-content" data-en="Dress Details" data-bn="অর্ডার লিস্ট - পোশাক - পরিমাণ">অর্ডার লিস্ট - পোশাক - পরিমাণ</span></th>
                        <th style="text-align:center;"><span class="lang-content" data-en="Order Date" data-bn="অর্ডার তারিখ">অর্ডার তারিখ</span></th>
                        <th style="text-align:center;"><span class="lang-content" data-en="Delivery Date" data-bn="ডেলিভারি তারিখ">ডেলিভারি তারিখ</span></th>
                        <th style="text-align:center;"><span class="lang-content" data-en="Total" data-bn="মোট টাকা">মোট টাকা</span></th>
                        <th style="text-align:center;"><span class="lang-content" data-en="Paid" data-bn="নগদ পেইড">নগদ পেইড</span></th>
                        <th style="text-align:center;"><span class="lang-content" data-en="Due" data-bn="বাকি">বাকি</span></th>
                        <th style="text-align:center;"><span class="lang-content" data-en="Store" data-bn="যেখানে রেখেছিলেন">যেখানে রেখেছিলেন</span></th>
                        <th style="min-width:150px; text-align:center;"><span class="lang-content" data-en="Special Details" data-bn="বিশেষ বিবরণ">বিশেষ বিবরণ</span></th>
                        <th style="text-align:center;"><span class="lang-content" data-en="Status" data-bn="স্ট্যাটাস">স্ট্যাটাস</span></th>
                        <th style="text-align:center;"><span class="lang-content" data-en="SMS" data-bn="SMS">SMS</span></th>
                        <th style="text-align:center;"><span class="lang-content" data-en="Details" data-bn="বিস্তারিত">বিস্তারিত</span></th>
                        <th style="text-align:center;"><span class="lang-content" data-en="Action" data-bn="ডেলিভারী">ডেলিভারী</span></th>
                    </tr>
                </thead>
                <tbody>
        `;

        orders.forEach(order => {
            const orderDate    = new Date(order.orderDate).toLocaleDateString('en-GB');
            const deliveryDate = order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-GB') : '-';
            const isFullyCompleted = order.workStatus === 'completed';
            const statusClass = isFullyCompleted ? 'status-ready' : 'status-partial';
            const statusText  = isFullyCompleted
                ? '<span class="lang-content" data-en="Ready" data-bn="প্রস্তুত">প্রস্তুত</span>'
                : '<span class="lang-content" data-en="Partial Ready" data-bn="আংশিক প্রস্তুত">আংশিক প্রস্তুত</span>';

            html += `
                <tr>
                    <td style="text-align:center;">
                        <input type="checkbox" class="order-checkbox" data-order-id="${order.orderId}">
                    </td>
                    <td style="text-align:center;"><strong>${order.orderSerialNumber}</strong></td>
                    <td style="text-align:center;">${order.customerName}</td>
                    <td style="text-align:center;">${order.phone || '-'}</td>
                    <td style="text-align:center;">${order.address || '-'}</td>
                    <td style="text-align:center; white-space:pre-wrap; font-size:12px;">${order.dressDetails || '-'}</td>
                    <td style="text-align:center; white-space:nowrap;">${orderDate}</td>
                    <td style="text-align:center; white-space:nowrap;">${deliveryDate}</td>
                    <td style="text-align:center;">${order.orderAmount.toFixed(2)}</td>
                    <td style="text-align:center;">${order.paidAmount.toFixed(2)}</td>
                    <td style="text-align:center;"><strong>${order.dueAmount.toFixed(2)}</strong></td>
                    <td style="text-align:center;">${order.storeDetails || '-'}</td>
                    <td style="text-align:center; white-space:pre-wrap; font-size:12px;">${order.details || '-'}</td>
                    <td style="text-align:center;"><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td style="text-align:center;">
                        <input type="checkbox" class="sms-checkbox"
                            data-order-id="${order.orderId}"
                            data-order-serial="${order.orderSerialNumber}"
                            data-phone="${escapeHtml(order.phone || '')}"
                            data-institution-name="${escapeHtml(order.institutionName || '')}"
                            data-masking="${escapeHtml(order.masking || '')}"
                            data-sms-balance="${order.smsBalance || 0}">
                    </td>
                    <td style="text-align:center;">
                        <button onclick="viewOrderDetails(${order.orderId})" class="btn-details-icon" title="বিস্তারিত দেখুন">
                            <i class="fas fa-eye" style="font-size:18px; color:#007bff;"></i>
                        </button>
                    </td>
                    <td style="text-align:center;">
                        <a href="/finish-order.html?orderId=${order.orderId}&delivery=true" class="btn-deliver-link" title="Deliver">
                            <i class="fas fa-check-circle" style="font-size:24px; color:#28a745;"></i>
                        </a>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.html(html);

        // Select All — sync SMS checkboxes too
        $('#selectAllOrders').on('change', function() {
            $('.order-checkbox').prop('checked', $(this).prop('checked'));
            $('.sms-checkbox').prop('checked', $(this).prop('checked'));
            updateSmsSendPanel();
        });

        // Order checkbox — auto-check SMS for same row
        $(document).off('change.readyOrders', '.order-checkbox').on('change.readyOrders', '.order-checkbox', function() {
            const orderId = $(this).data('order-id');
            $(`.sms-checkbox[data-order-id="${orderId}"]`).prop('checked', $(this).is(':checked'));
            const total   = $('.order-checkbox').length;
            const checked = $('.order-checkbox:checked').length;
            $('#selectAllOrders').prop('indeterminate', checked > 0 && checked < total);
            $('#selectAllOrders').prop('checked', checked === total);
            updateSmsSendPanel();
        });

        // SMS checkbox change — update panel
        $(document).off('change.smsCheck', '.sms-checkbox').on('change.smsCheck', '.sms-checkbox', function() {
            updateSmsSendPanel();
        });

        if (window.updateLanguage) window.updateLanguage();
        updateSmsSendPanel();
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function updateSmsSendPanel() {
        const smsChecked = $('.sms-checkbox:checked').length;
        if (smsChecked > 0) {
            $('#smsSendPanel').show();
            $('#smsSendCount').text(smsChecked);
        } else {
            $('#smsSendPanel').hide();
        }
    }

    // Send SMS for checked SMS checkboxes
    window.sendReadySms = function() {
        const orders = [];
        $('.sms-checkbox:checked').each(function() {
            orders.push({
                orderId:         parseInt($(this).data('order-id')),
                orderSerialNumber: parseInt($(this).data('order-serial')),
                phone:           $(this).data('phone'),
                institutionName: $(this).data('institution-name'),
                masking:         $(this).data('masking')
            });
        });

        if (orders.length === 0) {
            alert(window.currentLang === 'en' ? 'Please select at least one order for SMS' : 'SMS পাঠাতে অন্তত একটি অর্ডার নির্বাচন করুন');
            return;
        }

        const btnEl = document.getElementById('smsSendBtn');
        if (btnEl) { btnEl.disabled = true; btnEl.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> পাঠানো হচ্ছে...'; }

        $.ajax({
            url: '/api/delivery/send-ready-sms',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ institutionId, registrationId, orders }),
            success: function(response) {
                if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = '<i class="fas fa-sms me-1"></i> SMS পাঠান (<span id="smsSendCount">' + orders.length + '</span>)'; }
                if (response.success) {
                    showSmsMsg('success', response.message || 'SMS সফলভাবে পাঠানো হয়েছে!');
                    // Uncheck SMS checkboxes after success
                    $('.sms-checkbox:checked').prop('checked', false);
                    updateSmsSendPanel();
                } else {
                    showSmsMsg('error', response.message || 'SMS পাঠাতে সমস্যা হয়েছে');
                }
            },
            error: function() {
                if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = '<i class="fas fa-sms me-1"></i> SMS পাঠান (<span id="smsSendCount">' + orders.length + '</span>)'; }
                showSmsMsg('error', 'SMS পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
            }
        });
    };

    function showSmsMsg(type, msg) {
        const $el = $('#smsStatusMsg');
        $el.removeClass('sms-msg-success sms-msg-error')
           .addClass(type === 'success' ? 'sms-msg-success' : 'sms-msg-error')
           .text(msg).show();
        if (type === 'success') setTimeout(function() { $el.hide(); }, 4000);
    }

    window.deliverOrder = function(orderId) {
        if (confirm(window.currentLang === 'en' ? 'Are you sure you want to deliver this order?' : 'আপনারা কি নিশ্চিত এই অর্ডারটি ডেলিভার করতে চান?')) {
            $.ajax({
                url: '/api/delivery/deliver-order',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ orderId, institutionId, registrationId }),
                success: function(response) {
                    if (response.success) {
                        alert(window.currentLang === 'en' ? 'Order delivered successfully!' : 'অর্ডার সফলভাবে ডেলিভার করা হয়েছে!');
                        loadReadyOrders();
                    } else {
                        alert(response.message || 'Failed to deliver order');
                    }
                },
                error: function() { alert('Error delivering order. Please try again.'); }
            });
        }
    };

    window.viewOrderDetails = function(orderId) {
        $('#orderDetailsModalBody').html('<div class="text-center p-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>');
        $('#orderDetailsModal').modal('show');

        $.ajax({
            url: `/api/orders/money-receipt-details?orderId=${orderId}&institutionId=${institutionId}`,
            method: 'GET',
            success: function(response) {
                if (response.success && response.data) {
                    const data = response.data;
                    // money-receipt-details returns header + measurements; adapt to expected shape
                    renderOrderDetailsModal({
                        customer:     data.header,
                        measurements: data.measurements || []
                    });
                } else {
                    $('#orderDetailsModalBody').html('<div class="alert alert-danger">অর্ডার বিস্তারিত লোড করতে ব্যর্থ হয়েছে</div>');
                }
            },
            error: function() {
                $('#orderDetailsModalBody').html('<div class="alert alert-danger">অর্ডার বিস্তারিত লোড করতে ব্যর্থ হয়েছে</div>');
            }
        });
    };

    function renderOrderDetailsModal(data) {
        const customer     = data.customer;
        const measurements = data.measurements || [];

        let html = `
            <div class="customer-info-simple mb-4">
                <div class="row">
                    <div class="col-md-8">
                        <h5><i class="fas fa-user me-2"></i>${customer.customerName}</h5>
                        <p class="mb-1"><i class="fas fa-phone me-2"></i>${customer.phone || 'N/A'}</p>
                        <p class="mb-0"><i class="fas fa-map-marker-alt me-2"></i>${customer.address || 'N/A'}</p>
                    </div>
                    <div class="col-md-4 text-end">
                        <div class="mb-2"><strong>অর্ডার নং:</strong> <span class="badge bg-primary fs-6">${customer.orderSerialNumber}</span></div>
                        <div><strong>কাস্টমার নং:</strong> ${customer.customerNumber || 'N/A'}</div>
                    </div>
                </div>
            </div>
        `;

        if (measurements.length > 0) {
            measurements.forEach((item) => {
                html += `
                    <div class="order-item-simple mb-4">
                        <div class="item-title">
                            <i class="fas fa-tshirt me-2"></i>
                            <strong>${item.dressName}</strong> <span class="text-muted">(${item.dressQuantity} টি)</span>
                        </div>
                `;

                if (item.measurements && item.measurements.length > 0) {
                    html += '<div class="measurements-simple">';
                    const groupedMeasurements = {};
                    item.measurements.forEach(m => {
                        const groupKey = m.groupID || 0;
                        if (!groupedMeasurements[groupKey]) groupedMeasurements[groupKey] = [];
                        groupedMeasurements[groupKey].push(m);
                    });
                    html += '<div class="measurement-groups-container">';
                    Object.keys(groupedMeasurements).forEach(groupKey => {
                        html += '<div class="measurement-group-column">';
                        groupedMeasurements[groupKey].forEach(m => {
                            html += `
                                <div class="measurement-card-compact">
                                    <span class="measurement-label-compact">${m.type}</span>
                                    <span class="measurement-value-compact">${m.value}</span>
                                </div>`;
                        });
                        html += '</div>';
                    });
                    html += '</div></div>';
                }

                if (item.styles && item.styles.length > 0) {
                    html += '<div class="styles-simple mt-3"><div class="section-label"><i class="fas fa-palette me-2"></i>স্টাইল:</div><div class="badges-row">';
                    item.styles.forEach(s => {
                        const text = s.measurement && s.measurement !== '' ? `${s.name}: ${s.measurement}` : s.name;
                        html += `<span class="badge bg-info text-dark me-2 mb-2">${text}</span>`;
                    });
                    html += '</div></div>';
                }

                if (item.orderDetails) {
                    html += `
                        <div class="order-details-bottom mt-3">
                            <div class="alert alert-info mb-0">
                                <i class="fas fa-info-circle me-2"></i><strong>বিস্তারিত:</strong> ${item.orderDetails}
                            </div>
                        </div>`;
                }

                html += '</div>';
            });
        } else {
            html += '<div class="alert alert-info">কোনো বিস্তারিত তথ্য পাওয়া যায়নি</div>';
        }

        $('#orderDetailsModalBody').html(html);
    }

})();
