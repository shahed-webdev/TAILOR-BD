// Delivery Day Page - Shows pending orders by delivery date
(function () {
    'use strict';

    let institutionId = null;
    let currentPage = 1;
    const pageSize = 25;
    let allOrders = [];

    $(document).ready(function () {
        institutionId = parseInt(sessionStorage.getItem('institutionId'));
        var registrationId = parseInt(sessionStorage.getItem('registrationId'));

        if (!institutionId || !registrationId) {
            alert('Session expired. Please login again.');
            window.location.href = '/login.html';
            return;
        }

        // Default: today's date
        var today = new Date().toISOString().split('T')[0];
        $('#startDate').val(today);
        $('#endDate').val(today);

        // Enter key
        $('#startDate, #endDate').on('keyup', function (e) {
            if (e.keyCode === 13) searchOrders();
        });

        loadOrders();
    });

    window.searchOrders = function () {
        currentPage = 1;
        loadOrders();
    };

    function loadOrders() {
        var container = $('#ordersTableContainer');
        container.html('<div class="loading"><i class="fas fa-spinner fa-spin me-2"></i> লোড হচ্ছে...</div>');
        $('#paginationContainer').html('');

        var startDate = $('#startDate').val();
        var endDate = $('#endDate').val();

        var url = '/api/delivery/ready-orders?institutionId=' + institutionId +
            '&page=' + currentPage + '&pageSize=' + pageSize;

        if (startDate) url += '&startDate=' + startDate;
        if (endDate) url += '&endDate=' + endDate;

        $.ajax({
            url: url,
            method: 'GET',
            success: function (response) {
                if (response.success && response.data && response.data.orders) {
                    allOrders = response.data.orders;
                    updateStats(allOrders);
                    renderTable(allOrders);
                } else {
                    container.html('<div class="empty-message"><i class="fas fa-inbox fa-2x mb-2 d-block"></i>কোন অর্ডার পাওয়া যায়নি</div>');
                    updateStats([]);
                }
            },
            error: function () {
                container.html('<div class="error-message"><i class="fas fa-exclamation-triangle me-2"></i>অর্ডার লোড করতে সমস্যা হয়েছে</div>');
                updateStats([]);
            }
        });
    }

    function updateStats(orders) {
        var today = new Date().toISOString().split('T')[0];
        var todayCount = 0, overdueCount = 0;

        orders.forEach(function (o) {
            if (o.deliveryDate) {
                var dd = new Date(o.deliveryDate).toISOString().split('T')[0];
                if (dd === today) todayCount++;
                else if (dd < today) overdueCount++;
            }
        });

        $('#totalOrders').text(orders.length);
        $('#todayOrders').text(todayCount);
        $('#overdueOrders').text(overdueCount);
    }

    function renderTable(orders) {
        var container = $('#ordersTableContainer');

        if (!orders || orders.length === 0) {
            container.html('<div class="empty-message"><i class="fas fa-inbox fa-2x mb-2 d-block"></i>কোন অর্ডার পাওয়া যায়নি</div>');
            return;
        }

        var today = new Date().toISOString().split('T')[0];

        var html = '<table><thead><tr>' +
            '<th>অর্ডার নং</th>' +
            '<th>নাম</th>' +
            '<th>মোবাইল</th>' +
            '<th>পোশাকের বিবরণ</th>' +
            '<th>ডেলিভারী তারিখ</th>' +
            '<th>মোট টাকা</th>' +
            '<th>পরিশোধ</th>' +
            '<th>বাকি</th>' +
            '<th>স্ট্যাটাস</th>' +
            '</tr></thead><tbody>';

        orders.forEach(function (order) {
            var deliveryDate = order.deliveryDate ? formatDate(order.deliveryDate) : '-';
            var dd = order.deliveryDate ? new Date(order.deliveryDate).toISOString().split('T')[0] : '';
            var rowClass = '';
            var badge = '';

            if (dd === today) {
                rowClass = 'row-today';
                badge = '<span class="badge-today">আজকে</span>';
            } else if (dd && dd < today) {
                rowClass = 'row-overdue';
                badge = '<span class="badge-overdue">অতিক্রান্ত</span>';
            }

            html += '<tr class="' + rowClass + '">' +
                '<td class="center order-no">' + order.orderSerialNumber + '</td>' +
                '<td><span class="customer-name">' + esc(order.customerName) + '</span></td>' +
                '<td>' + esc(order.phone || '-') + '</td>' +
                '<td>' + esc(order.dressDetails || '-') + '</td>' +
                '<td class="center">' + deliveryDate + ' ' + badge + '</td>' +
                '<td class="number">' + (order.orderAmount || 0).toFixed(2) + '</td>' +
                '<td class="number">' + (order.paidAmount || 0).toFixed(2) + '</td>' +
                '<td class="number" style="color:#dc3545;font-weight:600;">' + (order.dueAmount || 0).toFixed(2) + '</td>' +
                '<td class="center">' + (order.workStatus === 'PartlyCompleted' ? '<span style="color:#856404;">আংশিক</span>' : '<span style="color:#155724;">সম্পূর্ণ</span>') + '</td>' +
                '</tr>';
        });

        html += '</tbody></table>';
        container.html(html);

        if (window.updateLanguage) window.updateLanguage();
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
