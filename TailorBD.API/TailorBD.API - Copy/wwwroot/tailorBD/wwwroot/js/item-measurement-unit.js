// item-measurement-unit.js
(function () {
    'use strict';

    let institutionId, registrationId, deleteTargetId, deleteModal;

    $(document).ready(function () {
        institutionId  = parseInt(sessionStorage.getItem('institutionId')  || '0');
        registrationId = parseInt(sessionStorage.getItem('registrationId') || '0');
        if (!institutionId) { showAlert('সেশন পাওয়া যায়নি। পুনরায় লগইন করুন।', 'error'); return; }

        deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
        loadData();
        $('#btnConfirmDelete').on('click', function () { if (deleteTargetId) confirmDelete(deleteTargetId); });
    });

    function loadData() {
        $.ajax({
            url: `/api/ItemMeasurementUnit?institutionId=${institutionId}`,
            method: 'GET',
            success: function (res) { res.success ? renderTable(res.data) : showEmptyRow(); },
            error: function () { showEmptyRow(); }
        });
    }

    function renderTable(rows) {
        const $body = $('#tableBody');
        $body.empty();
        $('#rowCount').text(rows.length);
        if (!rows.length) { showEmptyRow(); return; }
        const lang = window.currentLang === 'en' ? 'en' : 'bn';
        rows.forEach(function (row, i) {
            $body.append(`
            <tr id="row-${row.ItemMeasurementUnitID}">
                <td class="serial-no">${i + 1}</td>
                <td id="name-cell-${row.ItemMeasurementUnitID}"><span>${escHtml(row.UnitName)}</span></td>
                <td>
                    <div class="action-btns" id="action-${row.ItemMeasurementUnitID}">
                        <button class="btn-edit" onclick="startEdit(${row.ItemMeasurementUnitID},'${escHtml(row.UnitName)}')">
                            <i class="fas fa-pen"></i> ${lang === 'en' ? 'Edit' : 'এডিট'}
                        </button>
                        <button class="btn-delete" onclick="askDelete(${row.ItemMeasurementUnitID},'${escHtml(row.UnitName)}')">
                            <i class="fas fa-trash"></i> ${lang === 'en' ? 'Delete' : 'মুছুন'}
                        </button>
                    </div>
                </td>
            </tr>`);
        });
    }

    function showEmptyRow() {
        const lang = window.currentLang === 'en' ? 'en' : 'bn';
        $('#tableBody').html(`<tr class="empty-row"><td colspan="3"><i class="fas fa-inbox me-2" style="color:#ccc"></i>${lang === 'en' ? 'No units added yet' : 'কোনো ইউনিট যুক্ত হয়নি'}</td></tr>`);
        $('#rowCount').text(0);
    }

    window.addUnit = function () {
        const val = $('#unitNameInput').val().trim();
        $('#unitNameInput').removeClass('is-invalid'); $('#unitNameError').text('');
        if (!val) {
            $('#unitNameInput').addClass('is-invalid');
            $('#unitNameError').text(window.currentLang === 'en' ? 'Please enter unit name' : 'ইউনিটের নাম দিন');
            $('#unitNameInput').focus(); return;
        }
        const $btn = $('#btnAdd');
        $btn.prop('disabled', true).html('<span class="spinner-sm"></span>');
        $.ajax({
            url: '/api/ItemMeasurementUnit', method: 'POST', contentType: 'application/json',
            data: JSON.stringify({ unitName: val, institutionID: institutionId, registrationID: registrationId }),
            success: function (res) {
                if (res.success) { $('#unitNameInput').val(''); showAlert(res.message, 'success'); loadData(); }
                else showAlert(res.message, 'error');
            },
            error: function (xhr) { showAlert(xhr.responseJSON?.message || 'সমস্যা হয়েছে', 'error'); },
            complete: function () {
                const lang = window.currentLang === 'en' ? 'en' : 'bn';
                $btn.prop('disabled', false).html(`<i class="fas fa-plus"></i> <span>${lang === 'en' ? 'Add' : 'যুক্ত করুন'}</span>`);
            }
        });
    };

    window.startEdit = function (id, current) {
        $(`#name-cell-${id}`).html(`<input class="edit-input" id="ei-${id}" value="${escHtml(current)}" autocomplete="off">`);
        $(`#ei-${id}`).focus().on('keydown', function (e) { if (e.key === 'Enter') saveEdit(id); if (e.key === 'Escape') loadData(); });
        const lang = window.currentLang === 'en' ? 'en' : 'bn';
        $(`#action-${id}`).html(`
            <button class="btn-save" onclick="saveEdit(${id})"><i class="fas fa-check"></i> ${lang === 'en' ? 'Save' : 'সেভ'}</button>
            <button class="btn-cancel" onclick="reloadData()"><i class="fas fa-times"></i> ${lang === 'en' ? 'Cancel' : 'বাতিল'}</button>`);
    };

    window.saveEdit = function (id) {
        const val = $(`#ei-${id}`).val().trim();
        if (!val) { $(`#ei-${id}`).focus(); return; }
        $.ajax({
            url: `/api/ItemMeasurementUnit/${id}`, method: 'PUT', contentType: 'application/json',
            data: JSON.stringify({ unitName: val, institutionID: institutionId, registrationID: registrationId }),
            success: function (res) { if (res.success) { showAlert(res.message, 'success'); loadData(); } else showAlert(res.message, 'error'); },
            error: function (xhr) { showAlert(xhr.responseJSON?.message || 'সমস্যা হয়েছে', 'error'); }
        });
    };

    window.askDelete = function (id, name) {
        deleteTargetId = id; $('#deleteItemName').text(name); deleteModal.show();
    };

    function confirmDelete(id) {
        $.ajax({
            url: `/api/ItemMeasurementUnit/${id}`, method: 'DELETE',
            success: function (res) { deleteModal.hide(); if (res.success) { showAlert(res.message, 'success'); loadData(); } else showAlert(res.message, 'error'); },
            error: function (xhr) { deleteModal.hide(); showAlert(xhr.responseJSON?.message || 'মুছতে সমস্যা হয়েছে', 'error'); }
        });
    }

    window.reloadData = function () { loadData(); };

    function showAlert(msg, type) {
        const $a = $('#alertMsg');
        $a.removeClass('success error').addClass(type).text(msg).show();
        setTimeout(function () { $a.fadeOut(400); }, 3500);
    }

    function escHtml(str) {
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    }
})();
