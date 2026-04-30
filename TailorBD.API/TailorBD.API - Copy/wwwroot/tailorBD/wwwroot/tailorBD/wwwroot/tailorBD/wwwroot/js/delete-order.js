// Delete Order Page - JavaScript
(function () {
    'use strict';

    let institutionId = null;
    let registrationId = null;
    let currentPage = 1;
    let totalPages = 1;
    const pageSize = 30;
    let autocompleteTimers = {};

    const lang = {
        bn: {
            loading: 'লোড হচ্ছে...',
            empty: 'কোন অর্ডার পাওয়া যায়নি',
            error: 'অর্ডার লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।',
            colOrderNo: 'অর্ডার নং',
            colName: 'কাস্টমারের নাম',
            colMobile: 'মোবাইল',
            colDress: 'পোষাকের বিবরণ',
            colOrderDate: 'অর্ডার',
            colDeliveryDate: 'ডেলিভারী',
            colAmount: 'মোট টাকা',
            colDiscount: 'ছাড়',
            colPaid: 'পেইড',
            colDue: 'বাকি',
            colStatus: 'ডেলিভারির অবস্থা',
            selectAll: 'সব',
            selectHint: 'অর্ডার ডিলেট করার জন্য তালিকা থেকে অর্ডার নির্বাচন করুন',
            selectedCount: 'টি অর্ডার নির্বাচিত হয়েছে',
            confirmMsg: 'আপনার নির্বাচিত অর্ডার সমূহ ডিলেট করলে, অর্ডার সমূহের সকল তথ্যাদি পুনরায় পাওয়া সম্ভব নয়। আপনি কি অর্ডার স্থায়ীভাবে ডিলেট করতে চান?',
            successMsg: 'অর্ডার সফলভাবে ডিলেট হয়েছে!',
            errorMsg: 'দুঃখিত! অর্ডার ডিলেট করা সম্ভব হচ্ছে না। অনুগ্রহ করে আবার চেষ্টা করুন।',
            ordersFound: 'টি অর্ডার পাওয়া গেছে',
            statusPending: 'Pending',
            statusPartly: 'Partly Delivered',
            statusDelivered: 'Delivered',
        },
        en: {
            loading: 'Loading...',
            empty: 'No orders found',
            error: 'Error loading orders. Please try again.',
            colOrderNo: 'Order No.',
            colName: 'Customer Name',
            colMobile: 'Mobile',
            colDress: 'Dress Details',
            colOrderDate: 'Order Date',
            colDeliveryDate: 'Delivery Date',
            colAmount: 'Total',
            colDiscount: 'Discount',
            colPaid: 'Paid',
            colDue: 'Due',
            colStatus: 'Delivery Status',
            selectAll: 'All',
            selectHint: 'Select orders from the list to delete',
            selectedCount: 'orders selected',
            confirmMsg: 'Selected orders and all related data will be permanently deleted. This cannot be undone. Are you sure?',
            successMsg: 'Orders deleted successfully!',
            errorMsg: 'Failed to delete orders. Please try again.',
            ordersFound: 'orders found',
            statusPending: 'Pending',
            statusPartly: 'Partly Delivered',
            statusDelivered: 'Delivered',
        }
    };

    function t(key) {
        const l = (window.currentLang === 'en') ? 'en' : 'bn';
        return lang[l][key] || lang['bn'][key];
    }

    $(document).ready(function () {
        institutionId = parseInt(sessionStorage.getItem('institutionId'));
        registrationId = parseInt(sessionStorage.getItem('registrationId'));

        if (!institutionId || !registrationId) {
            alert('Session expired. Please login again.');
            window.location.href = '/login.html';
            return;
        }

        // Enter key triggers search
        $('#searchOrderNo, #searchCustomerName, #searchMobileNo').on('keyup', function (e) {
            if (e.keyCode === 13) { hideAllSuggestions(); searchDeleteOrders(); }
        });

        // Clear other fields logic (like old project)
        $('#searchOrderNo').on('focus', function () {
            $('#searchCustomerName, #searchMobileNo').val('');
            hideAllSuggestions();
        });
        $('#searchMobileNo').on('focus', function () {
            $('#searchOrderNo, #searchCustomerName').val('');
            hideAllSuggestions();
        });
        $('#searchCustomerName').on('focus', function () {
            $('#searchOrderNo, #searchMobileNo').val('');
            hideAllSuggestions();
        });

        // Autocomplete setup
        setupAutocomplete('#searchOrderNo', '#orderNoSuggestions', 'orderno');
        setupAutocomplete('#searchCustomerName', '#customerNameSuggestions', 'customerName');
        setupAutocomplete('#searchMobileNo', '#mobileNoSuggestions', 'phone');

        // Outside click hides suggestions
        $(document).on('click', function (e) {
            if (!$(e.target).closest('.autocomplete-wrapper').length) hideAllSuggestions();
        });

        // Language change
        $(document).on('languageChanged', function () {
            if (window._deleteOrderData) renderTable(window._deleteOrderData);
        });

        loadOrders();
    });

    window.searchDeleteOrders = function () {
        currentPage = 1;
        loadOrders();
    };

    function resetDeleteBtn() {
        const label = (window.currentLang === 'en') ? 'Delete' : 'ডিলেট করুন';
        $('#btnDelete').prop('disabled', true).html('<i class="fas fa-trash-alt"></i> ' + label);
    }

    function loadOrders() {
        const container = $('#ordersTableContainer');
        container.html(`<div class="loading">${t('loading')}</div>`);
        $('#deletePanel').hide();
        $('#summaryText').text('');
        $('#paginationWrap').empty();
        resetDeleteBtn();

        const orderNo = $('#searchOrderNo').val().trim();
        const custName = $('#searchCustomerName').val().trim();
        const phone = $('#searchMobileNo').val().trim();

        let url = `/api/delivery/orders-for-delete?institutionId=${institutionId}&page=${currentPage}&pageSize=${pageSize}`;
        if (orderNo) url += `&orderSerialNumber=${encodeURIComponent(orderNo)}`;
        if (custName) url += `&customerName=${encodeURIComponent(custName)}`;
        if (phone) url += `&phone=${encodeURIComponent(phone)}`;

        $.ajax({
            url: url,
            method: 'GET',
            success: function (response) {
                if (response.success && response.data) {
                    const data = response.data;
                    totalPages = data.totalPages || 1;

                    if (data.orders && data.orders.length > 0) {
                        window._deleteOrderData = data.orders;
                        $('#summaryText').text(data.totalCount + ' ' + t('ordersFound'));
                        renderTable(data.orders);
                        renderPagination(data.currentPage, data.totalPages, data.totalCount);
                    } else {
                        container.html(`<div class="empty-message">${t('empty')}</div>`);
                    }
                } else {
                    container.html(`<div class="empty-message">${t('empty')}</div>`);
                }
            },
            error: function () {
                container.html(`<div class="error-message">${t('error')}</div>`);
            }
        });
    }

    function renderTable(orders) {
        const container = $('#ordersTableContainer');

        if (!orders || orders.length === 0) {
            container.html(`<div class="empty-message">${t('empty')}</div>`);
            return;
        }

        let html = `
            <table id="deleteOrdersTable">
                <thead>
                    <tr>
                        <th style="width:36px;">
                            <input type="checkbox" id="selectAll" title="${t('selectAll')}">
                        </th>
                        <th>${t('colOrderNo')}</th>
                        <th>${t('colName')}</th>
                        <th>${t('colMobile')}</th>
                        <th>${t('colDress')}</th>
                        <th>${t('colOrderDate')}</th>
                        <th>${t('colDeliveryDate')}</th>
                        <th>${t('colAmount')}</th>
                        <th>${t('colDiscount')}</th>
                        <th>${t('colPaid')}</th>
                        <th>${t('colDue')}</th>
                        <th>${t('colStatus')}</th>
                    </tr>
                </thead>
                <tbody>
        `;

        orders.forEach(function (order) {
            let rowClass = '';
            let statusBadge = '';

            const status = (order.deliveryStatus || '').toLowerCase();
            if (status === 'delivered') {
                rowClass = 'status-delivered';
                statusBadge = `<span class="status-badge badge-delivered">${t('statusDelivered')}</span>`;
            } else if (status === 'partlydelivered') {
                rowClass = 'status-partly';
                statusBadge = `<span class="status-badge badge-partly">${t('statusPartly')}</span>`;
            } else {
                rowClass = 'status-pending';
                statusBadge = `<span class="status-badge badge-pending">${t('statusPending')}</span>`;
            }

            const orderDate = formatDate(order.orderDate);
            const deliveryDate = order.deliveryDate ? formatDate(order.deliveryDate) : '-';
            const custNo = order.customerNumber ? `(${order.customerNumber}) ` : '';

            html += `
                <tr class="${rowClass}" data-order-id="${order.orderId}">
                    <td><input type="checkbox" class="del-checkbox" data-order-id="${order.orderId}"></td>
                    <td class="order-no">${order.orderSerialNumber}</td>
                    <td class="customer-name">
                        <span class="customer-number">${escapeHtml(custNo)}</span>${escapeHtml(order.customerName)}
                    </td>
                    <td>${escapeHtml(order.phone || '-')}</td>
                    <td style="text-align:left; min-width:160px;">${escapeHtml(order.details || '-')}</td>
                    <td>${orderDate}</td>
                    <td>${deliveryDate}</td>
                    <td>${(order.orderAmount || 0).toFixed(2)}</td>
                    <td>${(order.discount || 0).toFixed(2)}</td>
                    <td>${(order.paidAmount || 0).toFixed(2)}</td>
                    <td>${(order.dueAmount || 0).toFixed(2)}</td>
                    <td>${statusBadge}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.html(html);

        // Show delete panel after render
        $('#deletePanel').show();
        updateDeletePanel();

        // Select All
        $(document).off('change', '#selectAll').on('change', '#selectAll', function () {
            $('.del-checkbox').prop('checked', this.checked);
            updateDeletePanel();
        });

        $(document).off('change', '.del-checkbox').on('change', '.del-checkbox', function () {
            const total = $('.del-checkbox').length;
            const checked = $('.del-checkbox:checked').length;
            $('#selectAll').prop('indeterminate', checked > 0 && checked < total);
            $('#selectAll').prop('checked', checked === total);
            updateDeletePanel();
        });

        if (window.updateLanguage) window.updateLanguage();
    }

    function updateDeletePanel() {
        const count = $('.del-checkbox:checked').length;
        const $btn = $('#btnDelete');
        const $info = $('#deleteInfo');

        if (count > 0) {
            $btn.prop('disabled', false);
            $info.html(`<strong>${count}</strong> ${t('selectedCount')}`);
        } else {
            $btn.prop('disabled', true);
            $info.text(t('selectHint'));
        }
    }

    window.confirmDelete = function () {
        const count = $('.del-checkbox:checked').length;
        if (count === 0) return;

        const lang = (window.currentLang === 'en') ? 'en' : 'bn';
        $('#confirmMsg').text(t('confirmMsg'));
        $('#confirmModal').addClass('show');
    };

    window.closeConfirmModal = function () {
        $('#confirmModal').removeClass('show');
    };

    window.executeDelete = function () {
        $('#confirmModal').removeClass('show');

        const selectedIds = [];
        $('.del-checkbox:checked').each(function () {
            selectedIds.push(parseInt($(this).data('order-id')));
        });

        if (selectedIds.length === 0) return;

        const $btn = $('#btnDelete');
        $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> ...');

        $.ajax({
            url: '/api/delivery/delete-orders',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                institutionId: institutionId,
                registrationId: registrationId,
                orderIds: selectedIds
            }),
            success: function (response) {
                if (response.success) {
                    showMsg('success', t('successMsg'));
                    resetDeleteBtn();
                    setTimeout(function () { loadOrders(); }, 1500);
                } else {
                    showMsg('error', response.message || t('errorMsg'));
                    $btn.prop('disabled', false).html('<i class="fas fa-trash-alt"></i> ' + (window.currentLang === 'en' ? 'Delete' : 'ডিলেট করুন'));
                }
            },
            error: function () {
                showMsg('error', t('errorMsg'));
                $btn.prop('disabled', false).html('<i class="fas fa-trash-alt"></i> ' + (window.currentLang === 'en' ? 'Delete' : 'ডিলেট করুন'));
            }
        });
    };

    function showMsg(type, msg) {
        const $el = $('#deleteMsg');
        $el.removeClass('alert-success-msg alert-error-msg')
           .addClass(type === 'success' ? 'alert-success-msg' : 'alert-error-msg')
           .text(msg).show();
        if (type === 'success') setTimeout(function () { $el.hide(); }, 3000);
    }

    function renderPagination(current, total, totalCount) {
        if (total <= 1) {
            $('#paginationWrap').empty();
            return;
        }

        let html = '';
        html += `<button class="page-btn" ${current === 1 ? 'disabled' : ''} onclick="goToPage(${current - 1})">&laquo;</button>`;

        const start = Math.max(1, current - 2);
        const end = Math.min(total, current + 2);

        if (start > 1) { html += `<button class="page-btn" onclick="goToPage(1)">1</button>`; if (start > 2) html += `<span style="padding:5px 6px;">...</span>`; }
        for (let i = start; i <= end; i++) {
            html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
        }
        if (end < total) { if (end < total - 1) html += `<span style="padding:5px 6px;">...</span>`; html += `<button class="page-btn" onclick="goToPage(${total})">${total}</button>`; }

        html += `<button class="page-btn" ${current === total ? 'disabled' : ''} onclick="goToPage(${current + 1})">&raquo;</button>`;
        $('#paginationWrap').html(html);
    }

    window.goToPage = function (page) {
        if (page < 1 || page > totalPages) return;
        currentPage = page;
        loadOrders();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    function formatDate(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }

    function hideAllSuggestions() {
        $('#orderNoSuggestions, #customerNameSuggestions, #mobileNoSuggestions').hide();
    }

    function setupAutocomplete(inputSelector, listSelector, field) {
        $(inputSelector).on('input', function () {
            const term = $(this).val().trim();
            const $list = $(listSelector);
            clearTimeout(autocompleteTimers[field]);
            if (term.length < 1) { $list.hide(); return; }

            autocompleteTimers[field] = setTimeout(function () {
                $.ajax({
                    url: `/api/delivery/search-suggestions?field=${field}&term=${encodeURIComponent(term)}&institutionId=${institutionId}`,
                    method: 'GET',
                    success: function (response) {
                        if (response.success && response.data && response.data.length > 0) {
                            let html = '';
                            response.data.forEach(function (item) {
                                html += `<div data-value="${escapeHtml(item)}">${escapeHtml(item)}</div>`;
                            });
                            $list.html(html).show();
                            $list.find('div').on('click', function () {
                                $(inputSelector).val($(this).data('value'));
                                $list.hide();
                                searchDeleteOrders();
                            });
                            $(inputSelector).off('keydown.ac').on('keydown.ac', function (e) {
                                const $items = $list.find('div');
                                const $active = $list.find('div.active');
                                if (e.keyCode === 40) {
                                    e.preventDefault();
                                    if (!$active.length) $items.first().addClass('active');
                                    else $active.removeClass('active').next().addClass('active');
                                } else if (e.keyCode === 38) {
                                    e.preventDefault();
                                    if ($active.length) $active.removeClass('active').prev().addClass('active');
                                } else if (e.keyCode === 13 && $active.length) {
                                    $(inputSelector).val($active.data('value'));
                                    $list.hide();
                                    searchDeleteOrders();
                                    e.stopPropagation();
                                } else if (e.keyCode === 27) {
                                    $list.hide();
                                }
                            });
                        } else { $list.hide(); }
                    },
                    error: function () { $list.hide(); }
                });
            }, 300);
        });
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

})();
