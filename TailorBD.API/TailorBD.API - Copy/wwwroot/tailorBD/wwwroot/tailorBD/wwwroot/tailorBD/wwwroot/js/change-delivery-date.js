// Change Delivery Date Page - JavaScript
(function () {
    'use strict';

    let institutionId = null;
    let registrationId = null;
    let autocompleteTimers = {};

    const lang = {
        bn: {
            loading: 'লোড হচ্ছে...',
            empty: 'কোন অর্ডার পাওয়া যায়নি',
            error: 'অর্ডার লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।',
            colOrderNo: 'অর্ডার নং',
            colName: 'নাম',
            colMobile: 'মোবাইল',
            colOrderDate: 'অর্ডারের তারিখ',
            colDeliveryDate: 'ডেলিভারী তারিখ',
            colDressDetails: 'পোষাক - মোট - অসম্পূর্ণ',
            colAmount: 'মোট টাকা',
            colSms: 'SMS',
            selectAll: 'সব',
            noOrderSelected: 'কোন অর্ডার নির্বাচন করা হয়নি',
            dateRequired: 'নতুন তারিখ দিন',
            successMsg: 'ডেলিভারির তারিখ সফলভাবে পরিবর্তন হয়েছে',
            errorMsg: 'তারিখ পরিবর্তন করতে সমস্যা হয়েছে',
        },
        en: {
            loading: 'Loading...',
            empty: 'No orders found',
            error: 'Error loading orders. Please try again.',
            colOrderNo: 'Order No.',
            colName: 'Name',
            colMobile: 'Mobile',
            colOrderDate: 'Order Date',
            colDeliveryDate: 'Delivery Date',
            colDressDetails: 'Dress - Total - Pending',
            colAmount: 'Total Amount',
            colSms: 'SMS',
            selectAll: 'All',
            noOrderSelected: 'No order selected',
            dateRequired: 'Please enter new date',
            successMsg: 'Delivery date changed successfully',
            errorMsg: 'Failed to change delivery date',
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

        // Default dates
        const today = new Date();
        const last30 = new Date(today);
        last30.setDate(today.getDate() - 30);
        $('#endDate').val(today.toISOString().split('T')[0]);
        $('#startDate').val(last30.toISOString().split('T')[0]);
        $('#newDeliveryDate').val(today.toISOString().split('T')[0]);

        // Radio toggle
        $('input[name="searchMode"]').on('change', function () {
            if (this.value === 'orderNo') {
                $('#searchByOrderNo').show();
                $('#searchByDate').hide();
            } else {
                $('#searchByOrderNo').hide();
                $('#searchByDate').show();
                $('#mobileNo, #customerName, #orderNo, #address').val('');
            }
        });

        // Clear related fields
        $('#orderNo').on('focus', function () { $('#mobileNo, #customerName, #address').val(''); });
        $('#mobileNo').on('focus', function () { $('#orderNo, #customerName, #address').val(''); });
        $('#customerName').on('focus', function () { $('#orderNo, #mobileNo').val(''); });
        $('#address').on('focus', function () { $('#orderNo, #mobileNo').val(''); });

        // Enter key
        $('#mobileNo, #customerName, #orderNo, #address').on('keyup', function (e) {
            if (e.keyCode === 13) { hideAllSuggestions(); searchOrders(); }
        });

        // Autocomplete
        setupAutocomplete('#mobileNo', '#mobileNoSuggestions', 'phone');
        setupAutocomplete('#customerName', '#customerNameSuggestions', 'customerName');

        // Outside click hides suggestions
        $(document).on('click', function (e) {
            if (!$(e.target).closest('.autocomplete-wrapper').length) hideAllSuggestions();
        });

        // Language change
        $(document).on('languageChanged', function () {
            if (window._changeDeliveryData) renderTable(window._changeDeliveryData);
        });

        loadOrders();
    });

    window.searchOrders = function () { loadOrders(); };

    function loadOrders() {
        const container = $('#ordersTableContainer');
        container.html(`<div class="loading">${t('loading')}</div>`);
        $('#changeDatePanel').hide();
        $('#summaryText').text('');

        const mode = $('input[name="searchMode"]:checked').val();
        const phone = $('#mobileNo').val().trim();
        const custName = $('#customerName').val().trim();
        const orderNoRaw = $('#orderNo').val().trim();
        const addr = $('#address').val().trim();
        const startDate = $('#startDate').val();
        const endDate = $('#endDate').val();

        let url = `/api/delivery/incomplete-works?institutionId=${institutionId}&page=1&pageSize=200`;

        if (mode === 'orderNo') {
            if (phone) url += `&phone=${encodeURIComponent(phone)}`;
            if (custName) url += `&customerName=${encodeURIComponent(custName)}`;
            if (addr) url += `&address=${encodeURIComponent(addr)}`;
            if (orderNoRaw) url += `&orderSerialNumbers=${encodeURIComponent(orderNoRaw)}`;
        } else {
            if (startDate) url += `&startDate=${startDate}`;
            if (endDate) url += `&endDate=${endDate}`;
        }

        $.ajax({
            url: url,
            method: 'GET',
            success: function (response) {
                if (response.success && response.data && response.data.orders && response.data.orders.length > 0) {
                    window._changeDeliveryData = response.data.orders;
                    $('#summaryText').text(response.data.totalCount + (window.currentLang === 'en' ? ' orders found' : ' টি অর্ডার পাওয়া গেছে'));
                    renderTable(response.data.orders);
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
            <table id="ordersTable">
                <thead>
                    <tr>
                        <th style="width:36px;">
                            <input type="checkbox" id="selectAll" title="${t('selectAll')}">
                        </th>
                        <th>${t('colOrderNo')}</th>
                        <th>${t('colName')}</th>
                        <th>${t('colMobile')}</th>
                        <th>${t('colOrderDate')}</th>
                        <th>${t('colDeliveryDate')}</th>
                        <th>${t('colDressDetails')}</th>
                        <th>${t('colAmount')}</th>
                        <th>${t('colSms')}</th>
                    </tr>
                </thead>
                <tbody>
        `;

        orders.forEach(function (order) {
            const today = new Date(); today.setHours(0,0,0,0);
            let rowClass = '';
            if (order.deliveryDate) {
                const dd = new Date(order.deliveryDate); dd.setHours(0,0,0,0);
                if (dd.getTime() === today.getTime()) rowClass = 'today-row';
                else if (dd < today) rowClass = 'overdue-row';
            }

            const orderDate = formatDate(order.orderDate);
            const deliveryDate = order.deliveryDate ? formatDate(order.deliveryDate) : '-';
            const custNo = order.customerNumber ? `(${order.customerNumber}) ` : '';

            // Dress details inner table
            let dressHtml = `<table class="dress-table"><thead><tr>
                <th>${window.currentLang === 'en' ? 'Dress' : 'পোষাক'}</th>
                <th>${window.currentLang === 'en' ? 'Total' : 'মোট'}</th>
                <th>${window.currentLang === 'en' ? 'Pending' : 'অসম্পূর্ণ'}</th>
            </tr></thead><tbody>`;

            if (order.dressItems && order.dressItems.length > 0) {
                order.dressItems.forEach(function (d) {
                    dressHtml += `<tr>
                        <td style="text-align:left;">${escapeHtml(d.dressName)}</td>
                        <td>${d.total}</td>
                        <td>${d.pendingWork}</td>
                    </tr>`;
                });
            } else {
                dressHtml += `<tr><td colspan="3">-</td></tr>`;
            }
            dressHtml += '</tbody></table>';

            html += `
                <tr class="${rowClass}" data-order-id="${order.orderId}" data-institution-id="${institutionId}">
                    <td><input type="checkbox" class="order-checkbox" data-order-id="${order.orderId}"
                               data-phone="${escapeHtml(order.phone || '')}"
                               data-customer-name="${escapeHtml(order.customerName || '')}"
                               data-institution-name="${escapeHtml(order.institutionName || '')}"
                               data-masking="${escapeHtml(order.masking || '')}"></td>
                    <td class="order-no">${order.orderSerialNumber}</td>
                    <td class="customer-name">
                        <span class="customer-number">${escapeHtml(custNo)}</span>${escapeHtml(order.customerName)}
                    </td>
                    <td>${escapeHtml(order.phone || '-')}</td>
                    <td>${orderDate}</td>
                    <td>${deliveryDate}</td>
                    <td style="min-width:160px;">${dressHtml}</td>
                    <td>${(order.orderAmount || 0).toFixed(2)}</td>
                    <td><input type="checkbox" class="sms-checkbox" data-order-id="${order.orderId}"></td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.html(html);

        // Select All — also auto-check/uncheck SMS
        $(document).off('change', '#selectAll').on('change', '#selectAll', function () {
            $('.order-checkbox').prop('checked', this.checked);
            // Auto sync SMS checkboxes
            $('.sms-checkbox').prop('checked', this.checked);
            updateChangeDatePanel();
        });

        // Order checkbox — auto-check SMS when order is checked
        $(document).off('change', '.order-checkbox').on('change', '.order-checkbox', function () {
            const orderId = $(this).data('order-id');
            const isChecked = $(this).is(':checked');

            // Auto sync SMS checkbox for this row
            $(`.sms-checkbox[data-order-id="${orderId}"]`).prop('checked', isChecked);

            const total = $('.order-checkbox').length;
            const checked = $('.order-checkbox:checked').length;
            $('#selectAll').prop('indeterminate', checked > 0 && checked < total);
            $('#selectAll').prop('checked', checked === total);
            updateChangeDatePanel();
        });

        if (window.updateLanguage) window.updateLanguage();
    }

    function updateChangeDatePanel() {
        const count = $('.order-checkbox:checked').length;
        if (count > 0) {
            $('#changeDatePanel').show();
        } else {
            $('#changeDatePanel').hide();
        }
    }

    window.changeDeliveryDate = function () {
        const selectedOrders = [];
        $('.order-checkbox:checked').each(function () {
            selectedOrders.push({
                orderId: parseInt($(this).data('order-id')),
                sendSms: $(`.sms-checkbox[data-order-id="${$(this).data('order-id')}"]`).is(':checked'),
                phone: $(this).data('phone'),
                customerName: $(this).data('customer-name'),
                institutionName: $(this).data('institution-name'),
                masking: $(this).data('masking')
            });
        });

        if (selectedOrders.length === 0) {
            showMsg('error', t('noOrderSelected'));
            return;
        }

        const newDate = $('#newDeliveryDate').val();
        if (!newDate) {
            showMsg('error', t('dateRequired'));
            return;
        }

        $.ajax({
            url: '/api/delivery/change-delivery-date',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                institutionId: institutionId,
                registrationId: registrationId,
                newDeliveryDate: newDate,
                orders: selectedOrders
            }),
            success: function (response) {
                if (response.success) {
                    showMsg('success', t('successMsg'));
                    setTimeout(function () { loadOrders(); }, 1500);
                } else {
                    showMsg('error', response.message || t('errorMsg'));
                }
            },
            error: function () {
                showMsg('error', t('errorMsg'));
            }
        });
    };

    function showMsg(type, msg) {
        const $el = $('#changeMsg');
        $el.removeClass('alert-success-msg alert-error-msg')
           .addClass(type === 'success' ? 'alert-success-msg' : 'alert-error-msg')
           .text(msg).show();
        if (type === 'success') setTimeout(function () { $el.hide(); }, 3000);
    }

    // Autocomplete setup
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
                                searchOrders();
                            });
                            $(inputSelector).off('keydown.ac').on('keydown.ac', function (e) {
                                const $items = $list.find('div');
                                const $active = $list.find('div.active');
                                if (e.keyCode === 40) { e.preventDefault(); if (!$active.length) $items.first().addClass('active'); else $active.removeClass('active').next().addClass('active'); }
                                else if (e.keyCode === 38) { e.preventDefault(); if ($active.length) $active.removeClass('active').prev().addClass('active'); }
                                else if (e.keyCode === 13 && $active.length) { $(inputSelector).val($active.data('value')); $list.hide(); searchOrders(); e.stopPropagation(); }
                                else if (e.keyCode === 27) { $list.hide(); }
                            });
                        } else { $list.hide(); }
                    },
                    error: function () { $list.hide(); }
                });
            }, 300);
        });
    }

    function hideAllSuggestions() {
        $('#mobileNoSuggestions, #customerNameSuggestions').hide();
    }

    function formatDate(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

})();
