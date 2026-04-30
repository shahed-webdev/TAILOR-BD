// Delivered Orders Page - JavaScript
(function () {
    'use strict';

    let institutionId = null;
    let registrationId = null;
    let currentPage = 1;
    const pageSize = 25;
    let totalCount = 0;
    let dueSortOrder = null; // null = no sort, 'asc', 'desc'

    // Language strings
    const lang = {
        bn: {
            loading: 'লোড হচ্ছে...',
            empty: 'কোন ডেলিভারিকৃত অর্ডার পাওয়া যায়নি',
            error: 'অর্ডার লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।',
            summaryOrders: ' টি অর্ডার ডেলিভারি হয়েছে',
            summaryDue: ' (মোট বাকি: ',
            summaryTaka: ' টাকা)',
            colOrderNo: 'অর্ডার নং',
            colName: 'নাম',
            colMobile: 'মোবাইল',
            colAddress: 'ঠিকানা',
            colDressDetails: 'পোষাকের বিবরণ',
            colOrderDate: 'অর্ডারের তারিখ',
            colDeliveryDate: 'ডেলিভারী তারিখ',
            colDelivered: 'ডেলিভারী',
            colDue: 'বাকি টাকা',
            colDetails: 'বিস্তারিত',
            btnFirst: 'প্রথম',
            btnLast: 'শেষ',
        },
        en: {
            loading: 'Loading...',
            empty: 'No delivered orders found',
            error: 'Error loading orders. Please try again.',
            summaryOrders: ' orders delivered',
            summaryDue: ' (Total due: ',
            summaryTaka: ' BDT)',
            colOrderNo: 'Order No.',
            colName: 'Name',
            colMobile: 'Mobile',
            colAddress: 'Address',
            colDressDetails: 'Dress Details',
            colOrderDate: 'Order Date',
            colDeliveryDate: 'Delivery Date',
            colDelivered: 'Delivered',
            colDue: 'Due Amount',
            colDetails: 'Details',
            btnFirst: 'First',
            btnLast: 'Last',
        }
    };

    function t(key) {
        const l = (window.currentLang === 'en') ? 'en' : 'bn';
        return lang[l][key] || lang['bn'][key];
    }

    // Initialize page
    $(document).ready(function () {
        institutionId = parseInt(sessionStorage.getItem('institutionId'));
        registrationId = parseInt(sessionStorage.getItem('registrationId'));

        if (!institutionId || !registrationId) {
            alert('Session expired. Please login again.');
            window.location.href = '/login.html';
            return;
        }

        // Set default dates (last 30 days) for date mode
        const today = new Date();
        const last30Days = new Date(today);
        last30Days.setDate(today.getDate() - 30);
        $('#endDate').val(today.toISOString().split('T')[0]);
        $('#startDate').val(last30Days.toISOString().split('T')[0]);

        // Radio button toggle
        $('input[name="searchMode"]').on('change', function () {
            if (this.value === 'orderNo') {
                $('#searchByOrderNo').show();
                $('#searchByDate').hide();
                $('#startDate').val('');
                $('#endDate').val('');
            } else if (this.value === 'date') {
                $('#searchByOrderNo').hide();
                $('#searchByDate').show();
                $('#mobileNo').val('');
                $('#customerName').val('');
                $('#orderNo').val('');
                $('#address').val('');
            } else if (this.value === 'dueOnly') {
                $('#searchByOrderNo').hide();
                $('#searchByDate').hide();
                $('#mobileNo').val('');
                $('#customerName').val('');
                $('#orderNo').val('');
                $('#address').val('');
                $('#startDate').val('');
                $('#endDate').val('');
            }
            currentPage = 1;
            loadDeliveredOrders(1);
        });

        // Clear related fields on focus (like old ASPX)
        $('#orderNo').on('focus', function () {
            $('#mobileNo').val('');
            $('#customerName').val('');
            $('#address').val('');
        });
        $('#mobileNo').on('focus', function () {
            $('#orderNo').val('');
            $('#customerName').val('');
            $('#address').val('');
        });
        $('#customerName').on('focus', function () {
            $('#orderNo').val('');
            $('#mobileNo').val('');
        });
        $('#address').on('focus', function () {
            $('#orderNo').val('');
            $('#mobileNo').val('');
        });

        // Enter key triggers search
        $('#mobileNo, #customerName').on('keyup', function (e) {
            if (e.keyCode === 13) {
                hideAllSuggestions();
                searchOrders();
            }
        });

        // Autocomplete for Mobile Number
        setupAutocomplete('#mobileNo', '#mobileNoSuggestions', 'phone');

        // Autocomplete for Customer Name
        setupAutocomplete('#customerName', '#customerNameSuggestions', 'customerName');

        // Hide suggestions when clicking outside
        $(document).on('click', function (e) {
            if (!$(e.target).closest('.autocomplete-wrapper').length) {
                hideAllSuggestions();
            }
        });

        // Re-render table when language changes
        $(document).on('languageChanged', function () {
            if (window._deliveredOrdersData) {
                renderOrdersTable(window._deliveredOrdersData.orders);
                renderSummary(window._deliveredOrdersData.stats);
                renderPagination(currentPage);
            }
        });

        loadDeliveredOrders(1);
    });

    window.searchOrders = function () {
        currentPage = 1;
        loadDeliveredOrders(1);
    };

    // Sort by due amount
    window.sortByDue = function () {
        if (dueSortOrder === null || dueSortOrder === 'desc') {
            dueSortOrder = 'asc';
        } else {
            dueSortOrder = 'desc';
        }

        if (window._deliveredOrdersData && window._deliveredOrdersData.orders) {
            const sorted = [...window._deliveredOrdersData.orders].sort(function (a, b) {
                return dueSortOrder === 'asc'
                    ? (a.dueAmount || 0) - (b.dueAmount || 0)
                    : (b.dueAmount || 0) - (a.dueAmount || 0);
            });
            renderOrdersTable(sorted);
        }
    };

    function loadDeliveredOrders(page) {
        const container = $('#ordersTableContainer');
        container.html(`<div class="loading"><span>${t('loading')}</span></div>`);
        $('#paginationContainer').html('');
        $('#summaryText').text('');

        const mode = $('input[name="searchMode"]:checked').val();
        const phone = $('#mobileNo').val().trim();
        const custName = $('#customerName').val().trim();
        const orderNoRaw = $('#orderNo').val().trim();
        const addr = $('#address').val().trim();
        const startDate = $('#startDate').val();
        const endDate = $('#endDate').val();

        let url = `/api/delivery/delivered-orders?institutionId=${institutionId}&page=${page}&pageSize=${pageSize}`;

        if (mode === 'orderNo') {
            if (phone) url += `&phone=${encodeURIComponent(phone)}`;
            if (custName) url += `&customerName=${encodeURIComponent(custName)}`;
            if (addr) url += `&address=${encodeURIComponent(addr)}`;
            if (orderNoRaw) {
                const normalized = orderNoRaw.replace(/\n/g, ',').replace(/\s+/g, '');
                url += `&orderSerialNumbers=${encodeURIComponent(normalized)}`;
            }
        } else if (mode === 'date') {
            if (startDate) url += `&startDate=${startDate}`;
            if (endDate) url += `&endDate=${endDate}`;
        } else if (mode === 'dueOnly') {
            url += `&dueOnly=true`;
        }

        $.ajax({
            url: url,
            method: 'GET',
            success: function (response) {
                if (response.success && response.data) {
                    totalCount = response.data.totalCount || 0;
                    window._deliveredOrdersData = response.data;
                    dueSortOrder = null; // reset sort on new load
                    updateStats(response.data.stats);
                    renderSummary(response.data.stats);
                    renderOrdersTable(response.data.orders);
                    renderPagination(page);
                } else {
                    container.html(`<div class="empty-message">${t('empty')}</div>`);
                    updateStats(null);
                    if (window.updateLanguage) window.updateLanguage();
                }
            },
            error: function (xhr) {
                console.error('Error loading orders:', xhr);
                container.html(`<div class="error-message">${t('error')}</div>`);
                if (window.updateLanguage) window.updateLanguage();
            }
        });
    }

    function updateStats(stats) {
        if (stats) {
            $('#totalDelivered').text(stats.totalOrders || 0);
            $('#totalDue').text('৳' + (stats.totalDue || 0).toFixed(2));
        } else {
            $('#totalDelivered').text('0');
            $('#totalDue').text('৳0.00');
        }
    }

    function renderSummary(stats) {
        if (!stats) { $('#summaryText').text(''); return; }
        const count = stats.totalOrders || 0;
        const due = (stats.totalDue || 0).toFixed(2);
        const text = count + t('summaryOrders') + t('summaryDue') + due + t('summaryTaka');
        $('#summaryText').text(text);
    }

    function renderOrdersTable(orders) {
        const container = $('#ordersTableContainer');

        if (!orders || orders.length === 0) {
            container.html(`<div class="empty-message">${t('empty')}</div>`);
            if (window.updateLanguage) window.updateLanguage();
            return;
        }

        // Due column sort icon
        const sortIcon = dueSortOrder === 'asc'
            ? ' <i class="fas fa-sort-up" style="font-size:11px;"></i>'
            : dueSortOrder === 'desc'
                ? ' <i class="fas fa-sort-down" style="font-size:11px;"></i>'
                : ' <i class="fas fa-sort" style="font-size:11px;opacity:0.5;"></i>';

        let html = `
            <table>
                <thead>
                    <tr>
                        <th style="width:36px;"></th>
                        <th data-en="${lang.en.colOrderNo}" data-bn="${lang.bn.colOrderNo}">${t('colOrderNo')}</th>
                        <th data-en="${lang.en.colName}" data-bn="${lang.bn.colName}">${t('colName')}</th>
                        <th data-en="${lang.en.colMobile}" data-bn="${lang.bn.colMobile}">${t('colMobile')}</th>
                        <th data-en="${lang.en.colAddress}" data-bn="${lang.bn.colAddress}">${t('colAddress')}</th>
                        <th data-en="${lang.en.colDressDetails}" data-bn="${lang.bn.colDressDetails}">${t('colDressDetails')}</th>
                        <th data-en="${lang.en.colOrderDate}" data-bn="${lang.bn.colOrderDate}">${t('colOrderDate')}</th>
                        <th data-en="${lang.en.colDeliveryDate}" data-bn="${lang.bn.colDeliveryDate}">${t('colDeliveryDate')}</th>
                        <th data-en="${lang.en.colDelivered}" data-bn="${lang.bn.colDelivered}">${t('colDelivered')}</th>
                        <th style="cursor:pointer;user-select:none;" onclick="sortByDue()"
                            data-en="${lang.en.colDue}" data-bn="${lang.bn.colDue}">
                            ${t('colDue')}${sortIcon}
                        </th>
                        <th data-en="${lang.en.colDetails}" data-bn="${lang.bn.colDetails}">${t('colDetails')}</th>
                    </tr>
                </thead>
                <tbody>
        `;

        orders.forEach(function (order) {
            const orderDate = formatDate(order.orderDate);
            const deliveryDate = order.deliveryDate ? formatDate(order.deliveryDate) : '-';
            const deliveredOn = order.deliveryInsertDate ? formatDate(order.deliveryInsertDate) : '-';
            const dueClass = (order.dueAmount > 0) ? 'due-amount' : 'due-zero';
            const customerNo = order.customerNumber ? `(${order.customerNumber}) ` : '';

            html += `
                <tr>
                    <td class="center">
                        <button class="btn-print" title="Print" onclick="printOrder(${order.orderId})">
                            <i class="fas fa-print"></i>
                        </button>
                    </td>
                    <td class="center order-no">${order.orderSerialNumber}</td>
                    <td>
                        <span class="customer-number">${escapeHtml(customerNo)}</span>
                        <span class="customer-name">${escapeHtml(order.customerName)}</span>
                    </td>
                    <td>${escapeHtml(order.phone || '-')}</td>
                    <td>${escapeHtml(order.address || '-')}</td>
                    <td>${escapeHtml(order.dressDetails || '-')}</td>
                    <td class="center">${orderDate}</td>
                    <td class="center">${deliveryDate}</td>
                    <td class="center">${deliveredOn}</td>
                    <td class="number ${dueClass}">${(order.dueAmount || 0).toFixed(2)}</td>
                    <td>${escapeHtml(order.orderDetails || '')}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.html(html);

        if (window.updateLanguage) window.updateLanguage();
    }

    function renderPagination(page) {
        const container = $('#paginationContainer');
        const totalPages = Math.ceil(totalCount / pageSize);

        if (totalPages <= 1) { container.html(''); return; }

        let html = '';
        html += `<button ${page === 1 ? 'disabled' : ''} onclick="changePage(1)" data-en="First" data-bn="প্রথম">${t('btnFirst')}</button>`;
        html += `<button ${page === 1 ? 'disabled' : ''} onclick="changePage(${page - 1})"><i class="fas fa-chevron-left"></i></button>`;

        let start = Math.max(1, page - 2);
        let end = Math.min(totalPages, page + 2);
        if (start > 1) html += '<span>...</span>';
        for (let i = start; i <= end; i++) {
            html += `<button class="${i === page ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        }
        if (end < totalPages) html += '<span>...</span>';

        html += `<button ${page === totalPages ? 'disabled' : ''} onclick="changePage(${page + 1})"><i class="fas fa-chevron-right"></i></button>`;
        html += `<button ${page === totalPages ? 'disabled' : ''} onclick="changePage(${totalPages})" data-en="Last" data-bn="শেষ">${t('btnLast')}</button>`;

        container.html(html);
        if (window.updateLanguage) window.updateLanguage();
    }

    window.changePage = function (page) {
        currentPage = page;
        loadDeliveredOrders(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.printOrder = function (orderId) {
        window.location.href = `/money-receipt.html?orderId=${orderId}`;
    };

    function formatDate(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // Autocomplete setup
    let autocompleteTimers = {};

    function setupAutocomplete(inputSelector, listSelector, field) {
        $(inputSelector).on('input', function () {
            const term = $(this).val().trim();
            const $list = $(listSelector);

            clearTimeout(autocompleteTimers[field]);

            if (term.length < 1) {
                $list.hide();
                return;
            }

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

                            // Click on suggestion
                            $list.find('div').on('click', function () {
                                $(inputSelector).val($(this).data('value'));
                                $list.hide();
                                searchOrders();
                            });

                            // Keyboard navigation
                            $(inputSelector).off('keydown.autocomplete').on('keydown.autocomplete', function (e) {
                                const $items = $list.find('div');
                                const $active = $list.find('div.active');
                                if (e.keyCode === 40) { // Down
                                    e.preventDefault();
                                    if (!$active.length) $items.first().addClass('active');
                                    else { $active.removeClass('active').next().addClass('active'); }
                                } else if (e.keyCode === 38) { // Up
                                    e.preventDefault();
                                    if ($active.length) { $active.removeClass('active').prev().addClass('active'); }
                                } else if (e.keyCode === 13) { // Enter
                                    if ($active.length) {
                                        $(inputSelector).val($active.data('value'));
                                        $list.hide();
                                        searchOrders();
                                        e.stopPropagation();
                                    }
                                } else if (e.keyCode === 27) { // Escape
                                    $list.hide();
                                }
                            });
                        } else {
                            $list.hide();
                        }
                    },
                    error: function () {
                        $list.hide();
                    }
                });
            }, 300);
        });
    }

    function hideAllSuggestions() {
        $('#mobileNoSuggestions, #customerNameSuggestions').hide();
    }

})();
