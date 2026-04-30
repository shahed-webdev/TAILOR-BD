// Customer List Page
(function () {
    'use strict';

    let institutionId, registrationId;
    let currentPage = 1;
    let totalPages = 1;
    const pageSize = 100;
    let deleteTargetId = null;
    let editRowId = null;

    $(document).ready(function () {
        institutionId = parseInt(sessionStorage.getItem('institutionId'));
        registrationId = parseInt(sessionStorage.getItem('registrationId'));

        if (!institutionId || !registrationId) {
            window.location.href = '/login.html';
            return;
        }

        // Clear other fields on focus
        $('#searchCustomerNo').on('focus', function () { $('#searchName, #searchMobile').val(''); });
        $('#searchMobile').on('focus', function () { $('#searchCustomerNo, #searchName').val(''); });
        $('#searchName').on('focus', function () { $('#searchCustomerNo, #searchMobile').val(''); });

        // Enter key
        $('#searchCustomerNo, #searchName, #searchMobile').on('keyup', function (e) {
            if (e.keyCode === 13) searchCustomers();
        });

        loadCustomers();
    });

    window.searchCustomers = function () {
        currentPage = 1;
        loadCustomers();
    };

    function loadCustomers() {
        $('#customerTableContainer').html('<div class="loading"><i class="fas fa-spinner fa-spin me-2"></i>লোড হচ্ছে...</div>');
        $('#summaryText').text('');
        $('#totalDueText').hide();
        $('#paginationWrap').empty();

        const custNo = $('#searchCustomerNo').val().trim();
        const name   = $('#searchName').val().trim();
        const mobile = $('#searchMobile').val().trim();

        let url = `/api/customer-page/customer-list?institutionId=${institutionId}&page=${currentPage}&pageSize=${pageSize}`;
        if (custNo)  url += `&customerNo=${encodeURIComponent(custNo)}`;
        if (name)    url += `&customerName=${encodeURIComponent(name)}`;
        if (mobile)  url += `&phone=${encodeURIComponent(mobile)}`;

        $.ajax({
            url: url,
            method: 'GET',
            success: function (r) {
                if (r.success && r.data) {
                    const d = r.data;
                    totalPages = d.totalPages || 1;

                    $('#summaryText').text('সর্বমোট : ' + d.totalCount + ' জন কাস্টমার');

                    if (d.totalDue > 0) {
                        $('#totalDueText').text('মোট বাকি: ৳' + formatNumber(d.totalDue)).show();
                    }

                    if (d.customers && d.customers.length > 0) {
                        renderTable(d.customers);
                        renderPagination(d.currentPage, d.totalPages);
                    } else {
                        $('#customerTableContainer').html('<div class="empty-msg">কোনো কাস্টমার পাওয়া যায়নি</div>');
                    }
                } else {
                    $('#customerTableContainer').html('<div class="empty-msg">কোনো রেকর্ড নেই</div>');
                }
            },
            error: function () {
                $('#customerTableContainer').html('<div class="empty-msg" style="color:#dc3545;">লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।</div>');
            }
        });
    }

    function renderTable(customers) {
        let rows = '';
        customers.forEach(function (c) {
            const dueHtml = c.customerDue > 0
                ? `<span class="due-badge">${formatNumber(c.customerDue)}</span>`
                : `<span class="due-zero">0</span>`;

            rows += `<tr id="row_${c.customerId}" data-customer-id="${c.customerId}" data-cloth-for="${c.clothForId}">
                <td>
                    <a class="btn-details" href="/customer-details.html?customerId=${c.customerId}&clothForId=${c.clothForId}">
                        <i class="fas fa-eye"></i> বিস্তারিত
                    </a>
                </td>
                <td>
                    <a class="btn-order" href="/dress-measurements.html?customerId=${c.customerId}&clothForId=${c.clothForId}">
                        <i class="fas fa-plus"></i> অর্ডার
                    </a>
                </td>
                <td class="view-cell">${c.customerNumber}</td>
                <td class="customer-name-td view-cell">
                    <span class="customer-number">(${c.customerNumber})</span>${escapeHtml(c.customerName)}
                </td>
                <td class="view-cell">${escapeHtml(c.phone || '-')}</td>
                <td class="view-cell">${escapeHtml(c.address || '-')}</td>
                <td class="view-cell">${escapeHtml(c.description || '-')}</td>
                <td>${dueHtml}</td>
                <td>${c.date ? formatDate(c.date) : '-'}</td>
                <td>
                    <button class="btn-edit" onclick="startEdit(${c.customerId})" title="ইডিট করুন"><i class="fas fa-edit"></i></button>
                </td>
                <td>
                    <button class="btn-delete" onclick="openDeleteModal(${c.customerId})" title="ডিলেট করুন"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
            <tr id="editrow_${c.customerId}" style="display:none; background:#f0f7ff;">
                <td colspan="2"></td>
                <td></td>
                <td><input class="edit-input" id="edit_name_${c.customerId}" value="${escapeAttr(c.customerName)}" placeholder="নাম"></td>
                <td><input class="edit-input" id="edit_phone_${c.customerId}" value="${escapeAttr(c.phone)}" placeholder="মোবাইল"></td>
                <td><input class="edit-input" id="edit_address_${c.customerId}" value="${escapeAttr(c.address)}" placeholder="ঠিকানা"></td>
                <td><input class="edit-input" id="edit_desc_${c.customerId}" value="${escapeAttr(c.description)}" placeholder="বিবরণ"></td>
                <td></td>
                <td></td>
                <td>
                    <button class="btn-save-row" onclick="saveEdit(${c.customerId})"><i class="fas fa-check"></i></button>
                </td>
                <td>
                    <button class="btn-cancel-row" onclick="cancelEdit(${c.customerId})"><i class="fas fa-times"></i></button>
                </td>
            </tr>`;
        });

        $('#customerTableContainer').html(`
            <table>
                <thead>
                    <tr>
                        <th style="width:80px;" data-en="Details" data-bn="বিস্তারিত">বিস্তারিত</th>
                        <th style="width:80px;" data-en="Order" data-bn="অর্ডার দিন">অর্ডার দিন</th>
                        <th data-en="No." data-bn="কাস্টমার নং">কাস্টমার নং</th>
                        <th data-en="Name" data-bn="নাম">নাম</th>
                        <th data-en="Mobile" data-bn="মোবাইল">মোবাইল</th>
                        <th data-en="Address" data-bn="ঠিকানা">ঠিকানা</th>
                        <th data-en="Description" data-bn="বিবরণ">বিবরণ</th>
                        <th data-en="Due" data-bn="বাকি টাকা">বাকি টাকা</th>
                        <th data-en="Reg. Date" data-bn="নিবন্ধনের তারিখ">নিবন্ধনের তারিখ</th>
                        <th style="width:50px;"></th>
                        <th style="width:50px;"></th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>`);

        if (window.updateLanguage) window.updateLanguage();
    }

    window.startEdit = function (customerId) {
        if (editRowId && editRowId !== customerId) cancelEdit(editRowId);
        editRowId = customerId;
        $(`#row_${customerId} .view-cell`).hide();
        $(`#row_${customerId} .btn-edit`).hide();
        $(`#editrow_${customerId}`).show();
    };

    window.cancelEdit = function (customerId) {
        editRowId = null;
        $(`#row_${customerId} .view-cell`).show();
        $(`#row_${customerId} .btn-edit`).show();
        $(`#editrow_${customerId}`).hide();
    };

    window.saveEdit = function (customerId) {
        const name    = $(`#edit_name_${customerId}`).val().trim();
        const phone   = $(`#edit_phone_${customerId}`).val().trim();
        const address = $(`#edit_address_${customerId}`).val().trim();
        const desc    = $(`#edit_desc_${customerId}`).val().trim();

        if (!name) { alert('নাম দিন'); return; }

        $.ajax({
            url: '/api/customer-page/update-customer',
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ customerId, institutionId, customerName: name, phone, address, description: desc }),
            success: function (r) {
                if (r.success) {
                    cancelEdit(customerId);
                    loadCustomers();
                } else {
                    alert(r.message || 'আপডেট করতে সমস্যা হয়েছে');
                }
            },
            error: function () { alert('সমস্যা হয়েছে। আবার চেষ্টা করুন।'); }
        });
    };

    window.openDeleteModal = function (customerId) {
        deleteTargetId = customerId;
        $('#deleteModal').addClass('show');
    };

    window.closeDeleteModal = function () {
        deleteTargetId = null;
        $('#deleteModal').removeClass('show');
    };

    window.confirmDeleteCustomer = function () {
        if (!deleteTargetId) return;
        $('#deleteModal').removeClass('show');

        $.ajax({
            url: `/api/customer-page/delete-customer/${deleteTargetId}?institutionId=${institutionId}`,
            method: 'DELETE',
            success: function (r) {
                if (r.success) {
                    loadCustomers();
                } else {
                    alert(r.message || 'ডিলেট করতে সমস্যা হয়েছে');
                }
                deleteTargetId = null;
            },
            error: function (xhr) {
                const msg = xhr.responseJSON ? xhr.responseJSON.message : 'সমস্যা হয়েছে। আবার চেষ্টা করুন।';
                alert(msg);
                deleteTargetId = null;
            }
        });
    };

    function renderPagination(current, total) {
        if (total <= 1) { $('#paginationWrap').empty(); return; }

        let html = `<button class="page-btn" ${current === 1 ? 'disabled' : ''} onclick="goToPage(${current - 1})">&laquo;</button>`;
        const start = Math.max(1, current - 2);
        const end   = Math.min(total, current + 2);
        if (start > 1) { html += `<button class="page-btn" onclick="goToPage(1)">1</button>`; if (start > 2) html += `<span style="padding:4px 6px;">...</span>`; }
        for (let i = start; i <= end; i++) {
            html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
        }
        if (end < total) { if (end < total - 1) html += `<span style="padding:4px 6px;">...</span>`; html += `<button class="page-btn" onclick="goToPage(${total})">${total}</button>`; }
        html += `<button class="page-btn" ${current === total ? 'disabled' : ''} onclick="goToPage(${current + 1})">&raquo;</button>`;
        $('#paginationWrap').html(html);
    }

    window.goToPage = function (page) {
        if (page < 1 || page > totalPages) return;
        currentPage = page;
        loadCustomers();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    function formatDate(dateStr) {
        const d = new Date(dateStr);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }

    function formatNumber(n) {
        return Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }

    function escapeHtml(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function escapeAttr(str) {
        return String(str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
})();
