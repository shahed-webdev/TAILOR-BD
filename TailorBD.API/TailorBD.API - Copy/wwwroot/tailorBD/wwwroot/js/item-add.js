// item-add.js
(function () {
    'use strict';

    let institutionId, registrationId, deleteTargetId, editModal, deleteModal, addModal;

    $(document).ready(function () {
        institutionId  = parseInt(sessionStorage.getItem('institutionId')  || '0');
        registrationId = parseInt(sessionStorage.getItem('registrationId') || '0');

        if (!institutionId) {
            showAlert('সেশন পাওয়া যায়নি। পুনরায় লগইন করুন।', 'error');
            return;
        }

        addModal    = new bootstrap.Modal(document.getElementById('addItemModal'));
        editModal   = new bootstrap.Modal(document.getElementById('editModal'));
        deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));

        loadDropdowns();
        loadItems();

        $('#btnConfirmDelete').on('click', function () {
            if (deleteTargetId) confirmDelete(deleteTargetId);
        });

        // reset stock adjustment on modal close
        document.getElementById('editModal').addEventListener('hidden.bs.modal', function () {
            $('#editStockAdj').val(0);
        });
        // reset add form on modal close
        document.getElementById('addItemModal').addEventListener('hidden.bs.modal', function () {
            resetForm();
        });
    });

    // ─── Dropdowns ────────────────────────────────────────────────────────────
    function loadDropdowns() {
        $.when(
            $.get(`/api/ItemMeasurementUnit?institutionId=${institutionId}`),
            $.get(`/api/ItemCategory?institutionId=${institutionId}`),
            $.get(`/api/ItemBrand?institutionId=${institutionId}`)
        ).done(function (unitRes, catRes, brandRes) {
            if (unitRes[0].success) {
                unitRes[0].data.forEach(function (u) {
                    $('#measurementUnit').append(`<option value="${u.ItemMeasurementUnitID}">${escHtml(u.UnitName)}</option>`);
                });
            }
            if (catRes[0].success) {
                catRes[0].data.forEach(function (c) {
                    $('#category').append(`<option value="${c.ItemCategoryID}">${escHtml(c.CategoryName)}</option>`);
                });
            }
            if (brandRes[0].success) {
                brandRes[0].data.forEach(function (b) {
                    $('#brand').append(`<option value="${b.ItemBrandID}">${escHtml(b.BrandName)}</option>`);
                });
            }
        });
    }

    // ─── Load Items ───────────────────────────────────────────────────────────
    function loadItems(search) {
        let url = `/api/Item?institutionId=${institutionId}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;

        $('#tableBody').html('<tr class="empty-row"><td colspan="10"><div class="spinner-sm"></div> <span class="ms-2">লোড হচ্ছে...</span></td></tr>');

        $.ajax({
            url: url, method: 'GET',
            success: function (res) { res.success ? renderTable(res.data) : showEmptyRow(); },
            error: function () { showEmptyRow(); }
        });
    }

    function renderTable(rows) {
        const $body = $('#tableBody');
        $body.empty();
        $('#rowCount').text(rows.length);

        if (!rows.length) { showEmptyRow(); return; }

        rows.forEach(function (row, i) {
            const stockBadge = (row.StockQuantity > 0)
                ? `<span class="badge-stock in">${parseFloat(row.StockQuantity).toFixed(2)} ${escHtml(row.UnitName || '')}</span>`
                : `<span class="badge-stock out">আউট অফ স্টক</span>`;

            $body.append(`
            <tr id="row-${row.ItemID}">
                <td class="item-sn">${i + 1}</td>
                <td><span class="item-code">${escHtml(row.ItemCode)}</span><br><small style="color:#aaa">${escHtml(row.ItemSN || '')}</small></td>
                <td><strong>${escHtml(row.ItemName)}</strong>
                    ${row.ItemColor ? `<br><small style="color:#888">${escHtml(row.ItemColor)}${row.ItemStyle ? ' · ' + escHtml(row.ItemStyle) : ''}</small>` : ''}
                </td>
                <td>${escHtml(row.UnitName || '-')}</td>
                <td>${escHtml(row.CategoryName || '-')}</td>
                <td>${escHtml(row.BrandName || '-')}</td>
                <td class="price-cell">৳ ${parseFloat(row.SellingUnitPrice || 0).toFixed(2)}</td>
                <td class="price-cell">৳ ${parseFloat(row.CurrentBuyingUnitPrice || 0).toFixed(2)}</td>
                <td>${stockBadge}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-edit" onclick="openEdit(${row.ItemID})">
                            <i class="fas fa-pen"></i> এডিট
                        </button>
                        <button class="btn-delete" onclick="askDelete(${row.ItemID},'${escHtml(row.ItemName)}')">
                            <i class="fas fa-trash"></i> মুছুন
                        </button>
                    </div>
                </td>
            </tr>`);
        });
    }

    function showEmptyRow() {
        $('#tableBody').html('<tr class="empty-row"><td colspan="10"><i class="fas fa-inbox me-2" style="color:#ccc"></i>কোনো আইটেম যুক্ত হয়নি</td></tr>');
        $('#rowCount').text(0);
    }

    // ─── Search ───────────────────────────────────────────────────────────────
    let searchTimer;
    window.searchItems = function (val) {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () { loadItems(val.trim()); }, 400);
    };

    // ─── Add Item ─────────────────────────────────────────────────────────────
    window.addItem = function () {
        clearErrors();
        let valid = true;

        const itemCode     = $('#itemCode').val().trim();
        const itemName     = $('#itemName').val().trim();
        const unitId       = parseInt($('#measurementUnit').val());
        const categoryId   = parseInt($('#category').val());
        const brandId      = parseInt($('#brand').val());
        const itemColor    = $('#itemColor').val().trim();
        const itemStyle    = $('#itemStyle').val().trim();
        const sellingPrice = parseFloat($('#sellingPrice').val());
        const itemDetails  = $('#itemDetails').val().trim();

        if (!itemCode) { setError('itemCode', 'আইটেম কোড দিন'); valid = false; }
        if (!itemName) { setError('itemName', 'আইটেমের নাম দিন'); valid = false; }
        if (!unitId)   { setError('unit', 'মেজারমেন্ট ইউনিট নির্বাচন করুন'); valid = false; }
        if (!sellingPrice || sellingPrice <= 0) { setError('price', 'বিক্রয় মূল্য দিন'); valid = false; }
        if (!valid) return;

        const $btn = $('#btnSubmit');
        $btn.prop('disabled', true).html('<span class="spinner-sm"></span> অপেক্ষা করুন...');

        $.ajax({
            url: '/api/Item', method: 'POST', contentType: 'application/json',
            data: JSON.stringify({
                institutionID: institutionId, registrationID: registrationId,
                measurementUnitID: unitId, brandID: brandId, categoryID: categoryId,
                itemCode, itemName, itemColor, itemStyle, itemDetails, sellingUnitPrice: sellingPrice
            }),
            success: function (res) {
                if (res.success) {
                    addModal.hide();
                    showAlert(res.message, 'success');
                    resetForm();
                    loadItems();
                }
                else showAlert(res.message, 'error');
            },
            error: function (xhr) { showAlert(xhr.responseJSON?.message || 'সমস্যা হয়েছে', 'error'); },
            complete: function () { $btn.prop('disabled', false).html('<i class="fas fa-plus"></i> <span>যুক্ত করুন</span>'); }
        });
    };

    window.resetForm = function () {
        $('#itemCode, #itemName, #itemColor, #itemStyle, #itemDetails').val('');
        $('#sellingPrice').val('');
        $('#measurementUnit').val('0');
        $('#category').val('0');
        $('#brand').val('0');
        clearErrors();
        $('#alertMsg').hide();
    };

    window.openAddModal = function () {
        resetForm();
        addModal.show();
        setTimeout(function () { $('#itemCode').focus(); }, 400);
    };

    // ─── Edit ─────────────────────────────────────────────────────────────────
    window.openEdit = function (id) {
        $.get(`/api/Item/${id}`, function (res) {
            if (!res.success) return;
            const d = res.data;
            $('#editItemId').val(d.ItemID);
            $('#editItemName').val(d.ItemName);
            $('#editItemColor').val(d.ItemColor || '');
            $('#editItemStyle').val(d.ItemStyle || '');
            $('#editItemDetails').val(d.ItemDetails || '');
            $('#editSellingPrice').val(d.SellingUnitPrice);
            $('#editBuyingPrice').val(d.CurrentBuyingUnitPrice || 0);
            $('#editStockAdj').val(0);
            $('#editAlertMsg').hide();
            editModal.show();
        });
    };

    window.saveEdit = function () {
        const id = $('#editItemId').val();
        const itemName = $('#editItemName').val().trim();
        if (!itemName) { showEditAlert('আইটেমের নাম দিন', 'error'); return; }

        const $btn = $('#btnSaveEdit');
        $btn.prop('disabled', true);

        $.ajax({
            url: `/api/Item/${id}`, method: 'PUT', contentType: 'application/json',
            data: JSON.stringify({
                itemName,
                itemColor:    $('#editItemColor').val().trim(),
                itemStyle:    $('#editItemStyle').val().trim(),
                itemDetails:  $('#editItemDetails').val().trim(),
                sellingUnitPrice:       parseFloat($('#editSellingPrice').val()) || 0,
                currentBuyingUnitPrice: parseFloat($('#editBuyingPrice').val()) || 0,
                stockAdjustment:        parseFloat($('#editStockAdj').val()) || 0
            }),
            success: function (res) {
                if (res.success) {
                    editModal.hide();
                    showAlert(res.message, 'success');
                    loadItems($('#searchInput').val().trim());
                } else showEditAlert(res.message, 'error');
            },
            error: function (xhr) { showEditAlert(xhr.responseJSON?.message || 'সমস্যা হয়েছে', 'error'); },
            complete: function () { $btn.prop('disabled', false); }
        });
    };

    // ─── Delete ───────────────────────────────────────────────────────────────
    window.askDelete = function (id, name) {
        deleteTargetId = id;
        $('#deleteItemName').text(name);
        deleteModal.show();
    };

    function confirmDelete(id) {
        $.ajax({
            url: `/api/Item/${id}`, method: 'DELETE',
            success: function (res) {
                deleteModal.hide();
                if (res.success) { showAlert(res.message, 'success'); loadItems($('#searchInput').val().trim()); }
                else showAlert(res.message, 'error');
            },
            error: function (xhr) {
                deleteModal.hide();
                showAlert(xhr.responseJSON?.message || 'মুছতে সমস্যা হয়েছে', 'error');
            }
        });
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────
    function clearErrors() {
        $('.form-control').removeClass('is-invalid');
        $('.invalid-feedback').text('').hide();
    }

    function setError(field, msg) {
        const inputMap = { itemCode: '#itemCode', itemName: '#itemName', unit: '#measurementUnit', price: '#sellingPrice' };
        const errorMap = { itemCode: '#err-itemCode', itemName: '#err-itemName', unit: '#err-unit', price: '#err-price' };
        $(inputMap[field]).addClass('is-invalid');
        $(errorMap[field]).text(msg).show();
    }

    function showAlert(msg, type) {
        // modal এর ভেতরে থাকলে modal alert দেখাও, নইলে page toast
        const $modal = $('#addItemModal:visible, #editModal:visible');
        if ($modal.length) {
            const $a = $('#alertMsg');
            $a.removeClass('success error').addClass(type).text(msg).css('display','flex');
            return;
        }
        const $t = $('#pageToast');
        $t.removeClass('success error').addClass(type)
          .html(`<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${escHtml(msg)}`)
          .css('display', 'flex');
        setTimeout(function () { $t.fadeOut(400); }, 3500);
    }

    function showEditAlert(msg, type) {
        const $a = $('#editAlertMsg');
        $a.removeClass('success error').addClass(type).text(msg).show();
    }

    function escHtml(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
})();
