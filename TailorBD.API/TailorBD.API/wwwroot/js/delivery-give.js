// Delivery Give Page - JavaScript
(function() {
    'use strict';

    let institutionId = null;
    let registrationId = null;
    let allOrders = [];
    let currentPage = 1;
    const PAGE_SIZE = 100;

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
                    allOrders = response.data.orders;
                    currentPage = 1;
                    renderOrdersTable(allOrders, currentPage);
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

    function renderPagination(total, page) {
        const totalPages = Math.ceil(total / PAGE_SIZE);
        const lang = window.currentLang === 'en';
        const from = (page - 1) * PAGE_SIZE + 1;
        const to = Math.min(page * PAGE_SIZE, total);
        const countInfo = `<small class="text-muted ms-2">${lang ? `Showing ${from}-${to} of ${total}` : `মোট ${total} টি অর্ডার, দেখানো হচ্ছে ${from}-${to}`}</small>`;

        if (totalPages <= 1) {
            return `<div class="d-flex align-items-center py-2">${countInfo}</div>`;
        }

        let html = '<nav aria-label="Page navigation"><ul class="pagination pagination-sm mb-0 flex-wrap">';
        html += `<li class="page-item${page === 1 ? ' disabled' : ''}"><a class="page-link" href="#" onclick="goToPage(${page - 1}); return false;">${lang ? 'Prev' : '« আগের'}</a></li>`;
        for (let i = 1; i <= totalPages; i++) {
            html += `<li class="page-item${i === page ? ' active' : ''}"><a class="page-link" href="#" onclick="goToPage(${i}); return false;">${i}</a></li>`;
        }
        html += `<li class="page-item${page === totalPages ? ' disabled' : ''}"><a class="page-link" href="#" onclick="goToPage(${page + 1}); return false;">${lang ? 'Next »' : 'পরের »'}</a></li>`;
        html += `</ul></nav>`;
        return `<div class="d-flex align-items-center gap-2 py-2 flex-wrap">${html}${countInfo}</div>`;
    }

    window.goToPage = function(page) {
        const totalPages = Math.ceil(allOrders.length / PAGE_SIZE);
        if (page < 1 || page > totalPages) return;
        currentPage = page;
        renderOrdersTable(allOrders, currentPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    function renderOrdersTable(orders, page) {
        page = page || 1;
        const container = $('#ordersTableContainer');

        if (!orders || orders.length === 0) {
            container.html('<div class="empty-message"><span class="lang-content" data-en="No ready-to-deliver orders found" data-bn="ডেলিভেরির জন্য প্রস্তুত কোন অর্ডার পাওয়া যায়নি">ডেলিভেরির জন্য প্রস্তুত কোন অর্ডার পাওয়া যায়নি</span></div>');
            return;
        }

        const totalOrders = orders.length;
        const start = (page - 1) * PAGE_SIZE;
        const pageOrders = orders.slice(start, start + PAGE_SIZE);

        const paginationHtml = renderPagination(totalOrders, page);

        let html = paginationHtml + `
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

        pageOrders.forEach(order => {
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
                        <button onclick="openPartialDeliveryModal(${order.orderId}, '${order.orderSerialNumber}')" class="btn-deliver-link btn" style="padding:2px 6px;" title="ডেলিভারি দিন">
                            <i class="fas fa-check-circle" style="font-size:24px; color:#28a745;"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        html += paginationHtml;
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

    // ===================== Partial Delivery Modal =====================
    let pdCurrentOrderId = null;
    let pdOrderData = null;

    window.openPartialDeliveryModal = function(orderId, orderSerial) {
        pdCurrentOrderId = orderId;
        $('#pdOrderNo').text('(অর্ডার #' + orderSerial + ')');
        $('#partialDeliveryModalBody').html('<div class="text-center p-4"><div class="spinner-border text-success" role="status"></div></div>');
        $('#pdSubmitBtn').prop('disabled', false);
        $('#partialDeliveryModal').modal('show');

        $.ajax({
            url: `/api/delivery/order-items/${orderId}?institutionId=${institutionId}`,
            method: 'GET',
            success: function(res) {
                if (res.success) {
                    pdOrderData = res.data;
                    renderPartialDeliveryModal(res.data);
                } else {
                    $('#partialDeliveryModalBody').html('<div class="alert alert-danger">ডেটা লোড ব্যর্থ হয়েছে</div>');
                }
            },
            error: function() {
                $('#partialDeliveryModalBody').html('<div class="alert alert-danger">ডেটা লোড ব্যর্থ হয়েছে</div>');
            }
        });
    };

    function renderPartialDeliveryModal(data) {
        const today = new Date().toISOString().split('T')[0];
        const deliveryDateVal = data.deliveryDate || today;
        const dueAmount = (data.orderAmount - data.previousPaid - data.discount).toFixed(2);

        let accountOptions = '<option value="">অ্যাকাউন্ট ছাড়া</option>';
        (data.accounts || []).forEach(a => {
            accountOptions += `<option value="${a.accountId}" ${a.isDefault ? 'selected' : ''}>${a.accountName}</option>`;
        });
        const showAccount = data.accounts && data.accounts.length > 0;

        let itemsHtml = '';
        (data.items || []).forEach(item => {
            const maxDeliver = item.remainingQty;
            const defaultQty = Math.min(item.readyQty > 0 ? item.readyQty : item.remainingQty, maxDeliver);
            itemsHtml += `
            <tr>
                <td><strong>${item.dressName}</strong></td>
                <td class="text-center">${item.totalQty}</td>
                <td class="text-center text-success">${item.deliveredQty}</td>
                <td class="text-center text-warning">${item.remainingQty}</td>
                <td class="text-center">
                    ${maxDeliver > 0
                        ? `<input type="number" class="form-control form-control-sm pd-qty-input text-center"
                                data-orderlist-id="${item.orderListId}"
                                data-max="${maxDeliver}"
                                value="${defaultQty}" min="0" max="${maxDeliver}"
                                style="width:70px; display:inline-block;">`
                        : '<span class="text-muted">-</span>'
                    }
                </td>
            </tr>`;
        });

        const html = `
        <div class="table-responsive mb-3">
            <table class="table table-sm table-bordered mb-0" style="min-width:500px;">
                <thead class="table-success">
                    <tr>
                        <th>পোশাক</th>
                        <th class="text-center">মোট</th>
                        <th class="text-center">পূর্বে ডেলিভারি</th>
                        <th class="text-center">বাকি</th>
                        <th class="text-center">এখন দিন</th>
                    </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
            </table>
        </div>
        <div class="row g-2">
            <div class="col-md-4">
                <label class="form-label fw-semibold"><i class="fas fa-calendar me-1"></i>ডেলিভারি তারিখ <span class="text-danger">*</span></label>
                <input type="date" id="pdDeliveryDate" class="form-control" value="${deliveryDateVal}">
            </div>
            <div class="col-md-4">
                <label class="form-label fw-semibold"><i class="fas fa-percentage me-1"></i>ছাড় (টাকা)</label>
                <input type="number" id="pdDiscount" class="form-control" value="0" min="0" step="0.01">
            </div>
            <div class="col-md-4">
                <label class="form-label fw-semibold d-flex justify-content-between">
                    <span><i class="fas fa-money-bill me-1"></i>নগদ পরিশোধ</span>
                    <small class="text-muted">বাকি: <span id="pdDueDisplay">${dueAmount}</span></small>
                </label>
                <input type="number" id="pdPaidAmount" class="form-control" value="${dueAmount}" min="0" step="0.01">
            </div>
            ${showAccount ? `
            <div class="col-md-4">
                <label class="form-label fw-semibold"><i class="fas fa-university me-1"></i>অ্যাকাউন্ট</label>
                <select id="pdAccount" class="form-select">${accountOptions}</select>
            </div>` : '<input type="hidden" id="pdAccount" value="">'}
        </div>
        <div id="pdAlertMsg" class="mt-2" style="display:none;"></div>`;

        $('#partialDeliveryModalBody').html(html);

        // recalculate due on discount change
        $('#pdDiscount').on('input', function() {
            const due = Math.max(0, (pdOrderData.orderAmount - pdOrderData.previousPaid - pdOrderData.discount) - (parseFloat($(this).val()) || 0));
            $('#pdDueDisplay').text(due.toFixed(2));
            $('#pdPaidAmount').val(due.toFixed(2));
        });
    }

    window.submitPartialDelivery = function() {
        const deliveryDate = $('#pdDeliveryDate').val();
        if (!deliveryDate) {
            $('#pdAlertMsg').removeClass('alert-success').addClass('alert alert-warning').text('ডেলিভারি তারিখ দিন').show();
            return;
        }

        const items = [];
        let anySelected = false;
        $('.pd-qty-input').each(function() {
            const qty = parseInt($(this).val()) || 0;
            const max = parseInt($(this).data('max')) || 0;
            if (qty > max) {
                $(this).addClass('is-invalid');
                return;
            }
            $(this).removeClass('is-invalid');
            if (qty > 0) {
                anySelected = true;
                items.push({ orderListId: parseInt($(this).data('orderlist-id')), deliverQty: qty });
            }
        });

        if (!anySelected) {
            $('#pdAlertMsg').removeClass('alert-success').addClass('alert alert-warning').text('কমপক্ষে একটি পোশাক ডেলিভারির পরিমাণ দিন').show();
            return;
        }

        $('#pdAlertMsg').hide();
        $('#pdSubmitBtn').prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-1"></i>অপেক্ষা করুন...');

        const payload = {
            orderId: pdCurrentOrderId,
            institutionId: institutionId,
            registrationId: registrationId,
            deliveryDate: deliveryDate,
            discount: parseFloat($('#pdDiscount').val()) || 0,
            paidAmount: parseFloat($('#pdPaidAmount').val()) || 0,
            accountId: parseInt($('#pdAccount').val()) || null,
            items: items
        };

        $.ajax({
            url: '/api/delivery/partial-delivery',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function(res) {
                $('#pdSubmitBtn').prop('disabled', false).html('<i class="fas fa-check me-1"></i> ডেলিভারি নিশ্চিত করুন');
                if (res.success) {
                    $('#pdAlertMsg').removeClass('alert-warning alert-danger').addClass('alert alert-success').text(res.message).show();
                    setTimeout(function() {
                        $('#partialDeliveryModal').modal('hide');
                        window.location.href = `/money-receipt.html?orderId=${pdCurrentOrderId}`;
                    }, 1000);
                } else {
                    $('#pdAlertMsg').removeClass('alert-success').addClass('alert alert-danger').text(res.message || 'ব্যর্থ হয়েছে').show();
                }
            },
            error: function(xhr) {
                $('#pdSubmitBtn').prop('disabled', false).html('<i class="fas fa-check me-1"></i> ডেলিভারি নিশ্চিত করুন');
                const msg = (xhr.responseJSON && xhr.responseJSON.message) ? xhr.responseJSON.message : 'সার্ভার ত্রুটি হয়েছে';
                $('#pdAlertMsg').removeClass('alert-success').addClass('alert alert-danger').text(msg).show();
            }
        });
    };

})();
