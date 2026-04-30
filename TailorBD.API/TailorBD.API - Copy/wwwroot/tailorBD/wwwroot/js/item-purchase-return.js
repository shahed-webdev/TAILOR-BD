// item-purchase-return.js
(function () {
    'use strict';

    let institutionId, registrationId;
    let buyingItems  = [];   // current purchase এর items
    let searchTimer;

    $(document).ready(function () {
        institutionId  = parseInt(sessionStorage.getItem('institutionId')  || '0');
        registrationId = parseInt(sessionStorage.getItem('registrationId') || '0');
        if (!institutionId) { showToast('সেশন পাওয়া যায়নি। পুনরায় লগিন করুন।', 'error'); return; }

        $('#retDate').val(new Date().toISOString().split('T')[0]);
        loadReturnRecords();

        $(document).on('click', function (e) {
            if (!$(e.target).closest('.autocomplete-wrap').length)
                $('#buyingSnList').hide();
        });
    });

    // ─── Step 1: Purchase SN Search ───────────────────────────────────────────
    window.searchBuyingSN = function (val) {
        clearTimeout(searchTimer);
        $('#selectedBuyingID').val('0');
        $('#purchaseBadge').hide();
        $('#itemsSection').hide();
        buyingItems = [];
        updateSummary();

        if (!val.trim()) { $('#buyingSnList').hide(); return; }

        searchTimer = setTimeout(function () {
            $.get(`/api/ItemPurchase/return-search-buying?institutionId=${institutionId}&sn=${encodeURIComponent(val)}`, function (res) {
                const $list = $('#buyingSnList').empty();
                if (!res.success || !res.data.length) { $list.hide(); return; }

                // barcode/Enter: result 1টি হলে auto select
                if (res.data.length === 1) {
                    selectBuying(res.data[0]);
                    $list.hide();
                    return;
                }

                res.data.forEach(function (b) {
                    $(`<div class="autocomplete-item">
                        <span style="font-weight:700;color:#e74c3c;">${esc(b.PurchaseSN)}</span>
                        <span class="ms-2" style="font-size:11px;color:#888;">${esc(b.BuyingDate)}</span>
                        <br><small>সাপ্লায়ার: ${esc(b.SupplierName)}
                        ${b.BillNo ? ` | বিল: ${esc(b.BillNo)}` : ''}</small>
                    </div>`)
                    .on('click', function () { selectBuying(b); })
                    .appendTo($list);
                });
                $list.show();
            });
        }, 300);
    };

    function selectBuying(b) {
        $('#buyingSnSearch').val(b.PurchaseSN);
        $('#buyingSnList').hide();
        $('#selectedBuyingID').val(b.FabricBuyingID);
        $('#selectedSupplierID').val(b.SupplierID || '0');

        $('#purchaseBadge').html(`
            <i class="fas fa-receipt me-1" style="color:#e74c3c;"></i>
            <strong>${esc(b.PurchaseSN)}</strong>
            <span class="ms-3" style="color:#888;">${esc(b.BuyingDate)}</span>
            ${b.BillNo ? `<span class="ms-3">বিল: <strong>${esc(b.BillNo)}</strong></span>` : ''}
            <br><small>সাপ্লায়ার: <strong>${esc(b.SupplierName)}</strong></small>
        `).show();

        loadBuyingItems(b.FabricBuyingID);
    }

    // ─── Step 2: Load Purchase Items ──────────────────────────────────────────
    function loadBuyingItems(buyingId) {
        $('#itemsSection').hide();
        buyingItems = [];

        $.get(`/api/ItemPurchase/return-buying-items?buyingId=${buyingId}`, function (res) {
            if (!res.success || !res.data.length) {
                showToast('এই ক্রয়ের কোনো আইটেম পাওয়া যায়নি', 'error');
                return;
            }

            buyingItems = res.data.map(function (d) {
                const maxReturn = Math.min(
                    parseFloat(d.CurrentStock),
                    parseFloat(d.BuyingQuantity) - parseFloat(d.AlreadyReturned)
                );
                return {
                    fabricBuyingListID: d.FabricBuyingListID,
                    itemID:             d.FabricID,
                    itemCode:           d.ItemCode,
                    itemName:           d.ItemName,
                    unitName:           d.UnitName || '',
                    buyingQuantity:     parseFloat(d.BuyingQuantity),
                    buyingUnitPrice:    parseFloat(d.BuyingUnitPrice) || 0,
                    alreadyReturned:    parseFloat(d.AlreadyReturned),
                    currentStock:       parseFloat(d.CurrentStock),
                    maxReturn:          Math.max(maxReturn, 0),
                    returnQty:          0
                };
            });

            renderItemsTable();
            $('#itemsSection').show();
        });
    }

    function renderItemsTable() {
        const $body = $('#buyingItemsBody').empty();

        buyingItems.forEach(function (item, i) {
            const disabled    = item.maxReturn <= 0;
            const returnValue = (item.returnQty * item.buyingUnitPrice).toFixed(2);

            $body.append(`
            <tr>
                <td>${i + 1}</td>
                <td style="font-weight:700;color:#e74c3c;">${esc(item.itemCode)}</td>
                <td style="text-align:left;">${esc(item.itemName)}</td>
                <td>${item.buyingQuantity.toFixed(2)} ${esc(item.unitName)}</td>
                <td>${item.alreadyReturned > 0
                    ? `<span class="already-ret">${item.alreadyReturned.toFixed(2)}</span>`
                    : '—'}</td>
                <td style="${item.currentStock <= 0 ? 'color:#dc3545;' : 'color:#28a745;'} font-weight:600;">
                    ${item.currentStock.toFixed(2)} ${esc(item.unitName)}
                </td>
                <td style="font-weight:600;">৳ ${item.buyingUnitPrice.toFixed(2)}</td>
                <td>
                    <input type="number" class="ret-input" id="retQty_${i}"
                        value="0" min="0" max="${item.maxReturn}" step="0.01"
                        ${disabled ? 'disabled' : ''}
                        oninput="onRetQtyChange(${i}, this.value)">
                    <div class="max-lbl">সর্বোচ্চ: ${item.maxReturn.toFixed(2)}</div>
                </td>
                <td id="retVal_${i}" style="font-weight:700;color:#e74c3c;">
                    ${item.returnQty > 0 ? '৳ ' + returnValue : '—'}
                </td>
            </tr>`);
        });

        updateSummary();
    }

    window.onRetQtyChange = function (i, val) {
        let qty = parseFloat(val) || 0;
        if (qty > buyingItems[i].maxReturn) {
            qty = buyingItems[i].maxReturn;
            $(`#retQty_${i}`).val(qty.toFixed(2));
        }
        if (qty < 0) qty = 0;
        buyingItems[i].returnQty = qty;

        // Return value cell আপডেট
        const rv = (qty * buyingItems[i].buyingUnitPrice).toFixed(2);
        $(`#retVal_${i}`).html(qty > 0 ? `৳ ${rv}` : '—');

        updateSummary();
    };

    function updateSummary() {
        const items      = buyingItems.filter(function (x) { return x.returnQty > 0; });
        const totalQty   = items.reduce(function (s, x) { return s + x.returnQty; }, 0);
        const totalValue = items.reduce(function (s, x) { return s + (x.returnQty * x.buyingUnitPrice); }, 0);
        $('#sumItems').text(items.length);
        $('#sumQty').text(totalQty.toFixed(2));
        $('#sumValue').text(totalValue.toFixed(2));
    }

    // ─── Submit Return ─────────────────────────────────────────────────────────
    window.submitReturn = function () {
        $('#retAlert').hide();

        const buyingId = parseInt($('#selectedBuyingID').val()) || 0;
        if (!buyingId) { showAlert('#retAlert', 'প্রথমে ক্রয় নম্বর দিয়ে ক্রয় নির্বাচন করুন', 'error'); return; }

        const retItems = buyingItems.filter(function (x) { return x.returnQty > 0; });
        if (!retItems.length) { showAlert('#retAlert', 'কমপক্ষে একটি আইটেমের ফেরত পরিমান দিন', 'error'); return; }

        if (!$('#retDate').val()) { showAlert('#retAlert', 'ফেরতের তারিখ দিন', 'error'); return; }

        const $btn = $('.btn-submit');
        $btn.prop('disabled', true).html('<span class="spinner-sm"></span> অপেক্ষা করুন...');

        const payload = {
            institutionID:  institutionId,
            registrationID: registrationId,
            buyingID:       buyingId,
            supplierID:     parseInt($('#selectedSupplierID').val()) || 0,
            returnDate:     $('#retDate').val(),
            items: retItems.map(function (x) {
                return {
                    itemID:         x.itemID,
                    itemCode:       x.itemCode,
                    buyingListID:   x.fabricBuyingListID,
                    returnQuantity: x.returnQty
                };
            })
        };

        $.ajax({
            url: '/api/ItemPurchase/return', method: 'POST', contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function (res) {
                if (res.success) {
                    showToast(res.message, 'success');
                    // Reset
                    $('#buyingSnSearch').val('');
                    $('#selectedBuyingID').val('0');
                    $('#purchaseBadge').hide();
                    $('#itemsSection').hide();
                    $('#retDate').val(new Date().toISOString().split('T')[0]);
                    buyingItems = [];
                    updateSummary();
                    loadReturnRecords();
                } else {
                    showAlert('#retAlert', res.message, 'error');
                }
            },
            error: function (xhr) {
                showAlert('#retAlert', xhr.responseJSON?.message || 'সমস্যা হয়েছে', 'error');
            },
            complete: function () {
                $btn.prop('disabled', false).html('<i class="fas fa-check-circle"></i> ফেরত সম্পন্ন করুন');
            }
        });
    };

    // ─── Return History ───────────────────────────────────────────────────────
    function loadReturnRecords() {
        $('#recLoadWrap').show();
        $('#recTableWrap, #recEmpty').hide();

        $.get(`/api/ItemPurchase/return-records?institutionId=${institutionId}&pageSize=100`, function (res) {
            $('#recLoadWrap').hide();
            if (!res.success || !res.data.length) { $('#recEmpty').show(); return; }

            const $body = $('#recBody').empty();
            res.data.forEach(function (r, i) {
                $body.append(`
                <tr>
                    <td>${i + 1}</td>
                    <td>${esc(r.ReturnDate)}</td>
                    <td style="font-weight:700;color:#e74c3c;">${esc(r.PurchaseSN || '—')}</td>
                    <td style="font-weight:700;color:#e74c3c;">${esc(r.ItemCode)}</td>
                    <td style="text-align:left;">${esc(r.ItemName)}</td>
                    <td>${parseFloat(r.ReturnQuantity).toFixed(2)} ${esc(r.UnitName || '')}</td>
                    <td>${esc(r.SupplierName)}</td>
                </tr>`);
            });
            $('#recTableWrap').show();
        }).fail(function () {
            $('#recLoadWrap').hide();
            $('#recEmpty').show();
        });
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────
    function showToast(msg, type) {
        const $t = $('#pageToast');
        $t.removeClass('success error').addClass(type)
          .html(`<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${msg}`)
          .css('display', 'flex');
        setTimeout(function () { $t.fadeOut(400); }, 4000);
    }
    function showAlert(sel, msg, type) {
        $(sel).removeClass('success error').addClass(type).text(msg).show();
    }
    function esc(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // Enter বা barcode scan (Enter key) এ exact match করে auto select
    window.onSnKeyDown = function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const val = $('#buyingSnSearch').val().trim();
        if (!val) return;
        $('#buyingSnList').hide();

        $.get(`/api/ItemPurchase/return-search-buying?institutionId=${institutionId}&sn=${encodeURIComponent(val)}`, function (res) {
            if (!res.success || !res.data.length) { showToast('কোনো ক্রয় পাওয়া যায়নি', 'error'); return; }
            // exact match খোঁজো, না পেলে first item
            const exact = res.data.find(function (b) { return b.PurchaseSN == val; });
            selectBuying(exact || res.data[0]);
        });
    };
})();
