// Delivery Cut Dress Page - Shows delivered orders with dress details
// Equivalent to legacy Delivered_Works.aspx (ডেলিভারীকৃত পোশাক)
(function () {
    'use strict';

    let institutionId = null;
    let currentPage = 1;
    const pageSize = 25;
    let totalCount = 0;

    $(document).ready(function () {
        institutionId = parseInt(sessionStorage.getItem('institutionId'));
        var registrationId = parseInt(sessionStorage.getItem('registrationId'));

        if (!institutionId || !registrationId) {
            alert('Session expired. Please login again.');
            window.location.href = '/login.html';
            return;
        }

        // Default dates
        var today = new Date();
        var last30 = new Date(today);
        last30.setDate(today.getDate() - 30);
        $('#endDate').val(today.toISOString().split('T')[0]);
        $('#startDate').val(last30.toISOString().split('T')[0]);

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
            currentPage = 1;
            loadOrders(1);
        });

        // Clear fields on focus (like legacy)
        $('#orderNo').on('focus', function () { $('#mobileNo, #customerName, #address').val(''); });
        $('#mobileNo').on('focus', function () { $('#orderNo, #customerName, #address').val(''); });
        $('#customerName').on('focus', function () { $('#orderNo, #mobileNo').val(''); });
        $('#address').on('focus', function () { $('#orderNo, #mobileNo').val(''); });

        // Enter key
        $('#mobileNo, #customerName, #orderNo, #address').on('keyup', function (e) {
            if (e.keyCode === 13) searchOrders();
        });

        loadOrders(1);
    });

    window.searchOrders = function () {
        currentPage = 1;
        loadOrders(1);
    };

    window.changePage = function (page) {
        currentPage = page;
        loadOrders(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.printOrder = function (orderId) {
        window.location.href = '/money-receipt.html?orderId=' + orderId;
    };

    function loadOrders(page) {
        var container = $('#ordersTableContainer');
        container.html('<div class="loading"><i class="fas fa-spinner fa-spin me-2"></i> লোড হচ্ছে...</div>');
        $('#paginationContainer').html('');

        var mode = $('input[name="searchMode"]:checked').val();
        var url = '/api/delivery/delivered-orders?institutionId=' + institutionId + '&page=' + page + '&pageSize=' + pageSize;

        if (mode === 'orderNo') {
            var phone = $('#mobileNo').val().trim();
            var custName = $('#customerName').val().trim();
            var orderNoRaw = $('#orderNo').val().trim();
            var addr = $('#address').val().trim();
            if (phone) url += '&phone=' + encodeURIComponent(phone);
            if (custName) url += '&customerName=' + encodeURIComponent(custName);
            if (addr) url += '&address=' + encodeURIComponent(addr);
            if (orderNoRaw) {
                var normalized = orderNoRaw.replace(/\n/g, ',').replace(/\s+/g, '');
                url += '&orderSerialNumbers=' + encodeURIComponent(normalized);
            }
        } else {
            var startDate = $('#startDate').val();
            var endDate = $('#endDate').val();
            if (startDate) url += '&startDate=' + startDate;
            if (endDate) url += '&endDate=' + endDate;
        }

        $.ajax({
            url: url,
            method: 'GET',
            success: function (response) {
                if (response.success && response.data) {
                    totalCount = response.data.totalCount || 0;
                    updateStats(response.data.stats);
                    renderTable(response.data.orders);
                    renderPagination(page);
                } else {
                    container.html('<div class="empty-message"><i class="fas fa-inbox fa-2x mb-2 d-block"></i>কোন ডেলিভারিকৃত পোশাক পাওয়া যায়নি</div>');
                    updateStats(null);
                }
            },
            error: function () {
                container.html('<div class="error-message"><i class="fas fa-exclamation-triangle me-2"></i>লোড করতে সমস্যা হয়েছে</div>');
                updateStats(null);
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

    function renderTable(orders) {
        var container = $('#ordersTableContainer');

        if (!orders || orders.length === 0) {
            container.html('<div class="empty-message"><i class="fas fa-inbox fa-2x mb-2 d-block"></i>কোন ডেলিভারিকৃত পোশাক পাওয়া যায়নি</div>');
            return;
        }

        var html = '<table><thead><tr>' +
            '<th style="width:36px;"></th>' +
            '<th>অর্ডার নং</th>' +
            '<th>নাম</th>' +
            '<th>মোবাইল</th>' +
            '<th>ঠিকানা</th>' +
            '<th>পোষাকের বিবরণ</th>' +
            '<th>অর্ডারের তারিখ</th>' +
            '<th>ডেলিভারী তারিখ</th>' +
            '<th>ডেলিভারী</th>' +
            '<th>বাকি টাকা</th>' +
            '<th>বিস্তারিত</th>' +
            '</tr></thead><tbody>';

        orders.forEach(function (order) {
            var orderDate = formatDate(order.orderDate);
            var deliveryDate = order.deliveryDate ? formatDate(order.deliveryDate) : '-';
            var deliveredOn = order.deliveryInsertDate ? formatDate(order.deliveryInsertDate) : '-';
            var dueClass = (order.dueAmount > 0) ? 'due-amount' : 'due-zero';
            var customerNo = order.customerNumber ? '(' + order.customerNumber + ') ' : '';

            html += '<tr>' +
                '<td class="center"><button class="btn-print" title="Print" onclick="printOrder(' + order.orderId + ')"><i class="fas fa-print"></i></button></td>' +
                '<td class="center order-no">' + order.orderSerialNumber + '</td>' +
                '<td><span class="customer-number">' + esc(customerNo) + '</span><span class="customer-name">' + esc(order.customerName) + '</span></td>' +
                '<td>' + esc(order.phone || '-') + '</td>' +
                '<td>' + esc(order.address || '-') + '</td>' +
                '<td>' + esc(order.dressDetails || '-') + '</td>' +
                '<td class="center">' + orderDate + '</td>' +
                '<td class="center">' + deliveryDate + '</td>' +
                '<td class="center">' + deliveredOn + '</td>' +
                '<td class="number ' + dueClass + '">' + (order.dueAmount || 0).toFixed(2) + '</td>' +
                '<td>' + esc(order.orderDetails || '') + '</td>' +
                '</tr>';
        });

        html += '</tbody></table>';
        container.html(html);

        if (window.updateLanguage) window.updateLanguage();
    }

    function renderPagination(page) {
        var container = $('#paginationContainer');
        var totalPages = Math.ceil(totalCount / pageSize);
        if (totalPages <= 1) { container.html(''); return; }

        var html = '';
        html += '<button ' + (page === 1 ? 'disabled' : '') + ' onclick="changePage(1)">প্রথম</button>';
        html += '<button ' + (page === 1 ? 'disabled' : '') + ' onclick="changePage(' + (page - 1) + ')"><i class="fas fa-chevron-left"></i></button>';

        var start = Math.max(1, page - 2);
        var end = Math.min(totalPages, page + 2);
        if (start > 1) html += '<span>...</span>';
        for (var i = start; i <= end; i++) {
            html += '<button class="' + (i === page ? 'active' : '') + '" onclick="changePage(' + i + ')">' + i + '</button>';
        }
        if (end < totalPages) html += '<span>...</span>';

        html += '<button ' + (page === totalPages ? 'disabled' : '') + ' onclick="changePage(' + (page + 1) + ')"><i class="fas fa-chevron-right"></i></button>';
        html += '<button ' + (page === totalPages ? 'disabled' : '') + ' onclick="changePage(' + totalPages + ')">শেষ</button>';

        container.html(html);
    }

    function formatDate(dateStr) {
        if (!dateStr) return '-';
        var d = new Date(dateStr);
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
    }

    function esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

})();
