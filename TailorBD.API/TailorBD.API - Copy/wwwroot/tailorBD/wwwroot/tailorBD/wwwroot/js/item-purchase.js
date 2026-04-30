// item-purchase.js
(function () {
    'use strict';

    let institutionId, registrationId;
    let cart = [];          // { itemID, itemCode, itemName, sellingUP, buyingUnitPrice, qty, totalPrice, isNew, meta }
    let supplierModal;
    let oldSupplierList = [];
    let searchTimer;
    let currentMode = 'new';

    // ─── Init ─────────────────────────────────────────────────────────────────
    $(document).ready(function () {
        institutionId  = parseInt(sessionStorage.getItem('institutionId')  || '0');
        registrationId = parseInt(sessionStorage.getItem('registrationId') || '0');

        if (!institutionId) { showToast('সেশন পাওয়া যায়নি। পুনরায় লগিন করুন।', 'error'); return; }

        supplierModal = new bootstrap.Modal(document.getElementById('supplierModal'));

        // Set today as default buying date
        const today = new Date().toISOString().split('T')[0];
        $('#buyingDate').val(today);

        loadDropdowns();
        loadAccounts();
        loadSuppliers();

        // Close autocomplete on outside click
        $(document).on('click', function (e) {
            if (!$(e.target).closest('.autocomplete-wrap').length) {
                $('#oldItemList').hide();
                $('#oldSupplierList').hide();
            }
        });
    });

    // ─── Mode Switch ──────────────────────────────────────────────────────────
    window.setMode = function (mode) {
        currentMode = mode;
        if (mode === 'new') {
            $('#newItemPanel').show(); $('#oldItemPanel').hide();
            $('#tabNew').addClass('active'); $('#tabOld').removeClass('active');
        } else {
            $('#newItemPanel').hide(); $('#oldItemPanel').show();
            $('#tabNew').removeClass('active'); $('#tabOld').addClass('active');
        }
    };

    // ─── Dropdowns ────────────────────────────────────────────────────────────
    function loadDropdowns() {
        $.ajax({
            url: `/api/ItemPurchase/units?institutionId=${institutionId}`,
            method: 'GET',
            success: function (res) {
                if (res.success && res.data.length) {
                    res.data.forEach(function (u) {
                        $('#newUnitDDL').append(`<option value="${u.ItemMeasurementUnitID}">${esc(u.UnitName)}</option>`);
                    });
                }
            },
            error: function (xhr) { console.error('Unit load error:', xhr.status, xhr.responseText); }
        });

        $.ajax({
            url: `/api/ItemPurchase/categories?institutionId=${institutionId}`,
            method: 'GET',
            success: function (res) {
                if (res.success && res.data.length) {
                    res.data.forEach(function (c) {
                        $('#newCategoryDDL').append(`<option value="${c.ItemCategoryID}">${esc(c.CategoryName)}</option>`);
                    });
                }
            },
            error: function (xhr) { console.error('Category load error:', xhr.status, xhr.responseText); }
        });

        $.ajax({
            url: `/api/ItemPurchase/brands?institutionId=${institutionId}`,
            method: 'GET',
            success: function (res) {
                if (res.success && res.data.length) {
                    res.data.forEach(function (b) {
                        $('#newBrandDDL').append(`<option value="${b.ItemBrandID}">${esc(b.BrandName)}</option>`);
                    });
                }
            },
            error: function (xhr) { console.error('Brand load error:', xhr.status, xhr.responseText); }
        });
    }

    function loadAccounts() {
        $.get(`/api/ItemPurchase/accounts?institutionId=${institutionId}`, function (res) {
            if (!res.success) return;
            res.data.forEach(function (a) {
                const opt = `<option value="${a.AccountID}" ${a.IsDefault ? 'selected' : ''}>
                    ${esc(a.AccountName)} (৳${parseFloat(a.AccountBalance).toFixed(2)})
                </option>`;
                $('#accountDDL').append(opt);
            });
        });
    }

    function loadSuppliers() {
        $.get(`/api/ItemPurchase/suppliers?institutionId=${institutionId}`, function (res) {
            if (!res.success) return;
            oldSupplierList = res.data;
        });
    }

    // ─── Supplier Info ─────────────────────────────────────────────────────────
    window.showSupplierInfo = function (s) {
        const $badge = $('#supplierInfoBadge');
        if (s) {
            $badge.html(`
                <strong>${esc(s.SupplierName)}</strong>
                ${s.SupplierCompanyName ? `<br><small>🏢 ${esc(s.SupplierCompanyName)}</small>` : ''}
                ${s.SupplierPhone ? `<br><small>📞 ${esc(s.SupplierPhone)}</small>` : ''}
                <br><small>পূর্বের বাকি: <span class="price">৳ ${parseFloat(s.SupplierDue || 0).toFixed(2)}</span></small>
            `).show();
        } else {
            $badge.hide();
        }
    };

    // ─── Supplier Searchable Autocomplete ──────────────────────────────────────
    window.searchSupplier = function (val) {
        $('#oldSupplierDDL').val('0');
        $('#supplierInfoBadge').hide();
        const $list = $('#oldSupplierList').empty();

        const q = val.trim().toLowerCase();
        if (!q) { $list.hide(); return; }

        const filtered = oldSupplierList.filter(function (s) {
            return s.SupplierName.toLowerCase().includes(q) ||
                   (s.SupplierPhone || '').toLowerCase().includes(q) ||
                   (s.SupplierCompanyName || '').toLowerCase().includes(q);
        });

        if (!filtered.length) { $list.hide(); return; }

        filtered.forEach(function (s) {
            $(`<div class="autocomplete-item">
                <span style="font-weight:700;color:#6c7ae0;">${esc(s.SupplierName)}</span>
                ${s.SupplierCompanyName ? `<span class="ms-2" style="font-size:11px;color:#888;">🏢 ${esc(s.SupplierCompanyName)}</span>` : ''}
                ${s.SupplierPhone ? `<br><small style="color:#555;">📞 ${esc(s.SupplierPhone)}</small>` : ''}
                <br><small style="color:#dc3545;">বাকি: ৳${parseFloat(s.SupplierDue || 0).toFixed(2)}</small>
            </div>`)
            .on('click', function () { selectSupplier(s); })
            .appendTo($list);
        });
        $list.show();
    };

    function selectSupplier(s) {
        $('#oldSupplierSearch').val(s.SupplierName + (s.SupplierPhone ? ' — ' + s.SupplierPhone : ''));
        $('#oldSupplierDDL').val(s.SupplierID);
        $('#oldSupplierList').hide();
        showSupplierInfo(s);
    }

    // modal খুললে supplier search clear করো
    document.getElementById('supplierModal').addEventListener('show.bs.modal', function () {
        $('#oldSupplierSearch').val('');
        $('#oldSupplierDDL').val('0');
        $('#oldSupplierList').hide();
        $('#supplierInfoBadge').hide();
        $('#oldSupplierPaid, #newSupplierPaid').val('');
        $('#oldSupplierDueMsg, #newSupplierDueMsg').html('');
    });

    // supplier autocomplete বাইরে click করলে বন্ধ
    $(document).on('click', function (e) {
        if (!$(e.target).closest('#oldSupplierTab .autocomplete-wrap').length)
            $('#oldSupplierList').hide();
    });

    // ─── Autocomplete Old Item ─────────────────────────────────────────────────
    let lastScannedItem = null;

    window.searchOldItem = function (val) {
        clearTimeout(searchTimer);
        lastScannedItem = null;
        $('#oldItemID').val('');
        $('#oldItemBadge').hide();
        if (!val.trim()) { $('#oldItemList').hide(); return; }

        searchTimer = setTimeout(function () {
            $.get(`/api/ItemPurchase/search-item?institutionId=${institutionId}&prefix=${encodeURIComponent(val)}`, function (res) {
                const $list = $('#oldItemList').empty();
                if (!res.success || !res.data.length) { $list.hide(); return; }

                // Exact code match চেক (বারকোড স্ক্যানার)
                const exact = res.data.find(function (x) {
                    return x.ItemCode.toLowerCase() === val.trim().toLowerCase();
                });
                if (exact) {
                    lastScannedItem = exact;
                    selectOldItem(exact);
                    $list.hide();
                    return;
                }

                res.data.forEach(function (item) {
                    $(`<div class="autocomplete-item">
                        <span class="item-code">${esc(item.ItemCode)}</span>
                        <span class="item-stock">স্টক: ${parseFloat(item.StockQuantity).toFixed(2)} ${esc(item.UnitName)}</span>
                        <br><span>${esc(item.ItemName)}</span>
                        <span class="item-price ms-2">বিক্রয়: ৳${parseFloat(item.SellingUnitPrice).toFixed(2)}</span>
                    </div>`)
                    .on('click', function () { selectOldItem(item); })
                    .appendTo($list);
                });
                $list.show();
            });
        }, 300);
    };

    // ─── Enter key: বারকোড স্ক্যানার auto-add ────────────────────────────────
    $(document).on('keydown', '#oldItemSearch', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();

        const val = $(this).val().trim();
        if (!val) return;

        // item ইতিমধ্যে select হয়ে থাকলে সরাসরি add
        const itemId = parseInt($('#oldItemID').val()) || 0;
        if (itemId > 0) {
            autoAddScannedItem();
            return;
        }

        // timer বাতিল করে এখনই search করো
        clearTimeout(searchTimer);
        $.get(`/api/ItemPurchase/search-item?institutionId=${institutionId}&prefix=${encodeURIComponent(val)}`, function (res) {
            if (!res.success || !res.data.length) {
                $('#oldErrMsg').text(t('আইটেম পাওয়া যায়নি', 'Item not found'));
                return;
            }
            const exact = res.data.find(function (x) {
                return x.ItemCode.toLowerCase() === val.toLowerCase();
            });
            const item = exact || (res.data.length === 1 ? res.data[0] : null);
            if (item) {
                selectOldItem(item);
                // selectOldItem এ hidden field set হওয়ার পর add করো
                autoAddScannedItem();
            } else {
                const $list = $('#oldItemList').empty();
                res.data.forEach(function (itm) {
                    $(`<div class="autocomplete-item">
                        <span class="item-code">${esc(itm.ItemCode)}</span>
                        <span class="item-stock">স্টক: ${parseFloat(itm.StockQuantity).toFixed(2)} ${esc(itm.UnitName)}</span>
                        <br><span>${esc(itm.ItemName)}</span>
                        <span class="item-price ms-2">বিক্রয়: ৳${parseFloat(itm.SellingUnitPrice).toFixed(2)}</span>
                    </div>`)
                    .on('click', function () { selectOldItem(itm); })
                    .appendTo($list);
                });
                $list.show();
            }
        });
    });

    // auto-add: qty/total খালি থাকলে qty=1, total=sellingPrice
    function autoAddScannedItem() {
        const itemId = parseInt($('#oldItemID').val()) || 0;
        if (!itemId) return;

        if (cart.find(function (x) { return x.itemID === itemId; })) {
            showToast(t('এই আইটেম ইতিমধ্যে কার্টে আছে', 'Item already in cart'), 'error');
            return;
        }

        let qty     = parseFloat($('#oldQty').val()) || 0;
        let total   = parseFloat($('#oldTotalPrice').val()) || 0;
        const sellingUP = parseFloat($('#oldItemSellingUP').val()) || 0;

        if (qty <= 0) qty = 1;
        if (total <= 0) total = sellingUP * qty;

        const searchText = $('#oldItemSearch').val();
        const parts      = searchText.split(' — ');
        const newSP      = parseFloat($('#oldNewSellingPrice').val()) || sellingUP;

        cart.push({
            itemID: itemId,
            itemCode: parts[0] || '',
            itemName: parts[1] || '',
            sellingUP: newSP,
            buyingUnitPrice: parseFloat($('#oldUnitBuyPrice').val()) || (qty > 0 ? total / qty : 0),
            qty, totalPrice: total,
            isNew: false, meta: {}
        });

        $('#oldItemSearch').val('');
        $('#oldItemID, #oldItemSellingUP').val('');
        $('#oldQty, #oldTotalPrice, #oldUnitBuyPrice, #oldNewSellingPrice').val('');
        $('#oldItemBadge').hide();
        $('#oldErrMsg').text('');
        lastScannedItem = null;

        renderCart();
        calcSummary();
        showToast(t('আইটেম কার্টে যোগ হয়েছে ✓', 'Item added to cart ✓'), 'success');
        $('#oldItemSearch').focus();
    }

    function selectOldItem(item) {
        $('#oldItemSearch').val(item.ItemCode + ' — ' + item.ItemName);
        $('#oldItemList').hide();
        $('#oldItemID').val(item.ItemID);
        $('#oldItemSellingUP').val(item.SellingUnitPrice);
        $('#oldItemBadge').html(`
            <strong>${esc(item.ItemName)}</strong>
            <span class="ms-2">স্টক: <span class="stock">${parseFloat(item.StockQuantity).toFixed(2)} ${esc(item.UnitName)}</span></span>
            <span class="ms-2">বিক্রয় মূল্য: <span class="price">৳${parseFloat(item.SellingUnitPrice).toFixed(2)}</span></span>
        `).show();
        $('#oldQty').focus();
    }

    // ─── Calc helpers ─────────────────────────────────────────────────────────
    // NEW panel: qty বা total পরিবর্তন করলে unit price হিসাব
    window.calcNewUnit = function () {
        const qty = parseFloat($('#newQty').val()) || 0;
        const tot = parseFloat($('#newTotalPrice').val()) || 0;
        if (qty > 0 && tot > 0) $('#newUnitBuyPrice').val((tot / qty).toFixed(2));
        else $('#newUnitBuyPrice').val('');
    };
    // qty field change
    window.calcNewTotal = function () {
        const qty  = parseFloat($('#newQty').val()) || 0;
        const unit = parseFloat($('#newUnitBuyPrice').val()) || 0;
        const tot  = parseFloat($('#newTotalPrice').val()) || 0;
        if (qty > 0 && unit > 0) {
            $('#newTotalPrice').val((qty * unit).toFixed(2));
        } else if (qty > 0 && tot > 0) {
            $('#newUnitBuyPrice').val((tot / qty).toFixed(2));
        }
    };
    // unit price field change → calc total
    window.calcNewTotalFromUnit = function () {
        const qty  = parseFloat($('#newQty').val()) || 0;
        const unit = parseFloat($('#newUnitBuyPrice').val()) || 0;
        if (qty > 0 && unit > 0) $('#newTotalPrice').val((qty * unit).toFixed(2));
    };

    // OLD panel
    window.calcOldUnit = function () {
        const qty = parseFloat($('#oldQty').val()) || 0;
        const tot = parseFloat($('#oldTotalPrice').val()) || 0;
        if (qty > 0 && tot > 0) $('#oldUnitBuyPrice').val((tot / qty).toFixed(2));
        else $('#oldUnitBuyPrice').val('');
    };
    window.calcOldTotal = function () {
        const qty  = parseFloat($('#oldQty').val()) || 0;
        const unit = parseFloat($('#oldUnitBuyPrice').val()) || 0;
        const tot  = parseFloat($('#oldTotalPrice').val()) || 0;
        if (qty > 0 && unit > 0) {
            $('#oldTotalPrice').val((qty * unit).toFixed(2));
        } else if (qty > 0 && tot > 0) {
            $('#oldUnitBuyPrice').val((tot / qty).toFixed(2));
        }
    };
    window.calcOldTotalFromUnit = function () {
        const qty  = parseFloat($('#oldQty').val()) || 0;
        const unit = parseFloat($('#oldUnitBuyPrice').val()) || 0;
        if (qty > 0 && unit > 0) $('#oldTotalPrice').val((qty * unit).toFixed(2));
    };

    // ─── i18n helper ──────────────────────────────────────────────────────────
    function t(bn, en) {
        return (window.currentLang === 'en') ? en : bn;
    }

    // ─── New Item Code Duplicate Check ────────────────────────────────────────
    let codeCheckTimer;
    window.checkNewItemCode = function () {
        const code = $('#newItemCode').val().trim();
        const $hint = $('#newCodeHint');
        clearTimeout(codeCheckTimer);
        $hint.text('').removeClass('text-danger text-success text-warning');
        if (!code) return;

        if (cart.find(x => x.itemCode.toLowerCase() === code.toLowerCase())) {
            $hint.text(t('⚠ এই কোড ইতিমধ্যে কার্টে আছে', '⚠ This code is already in the cart')).addClass('text-warning');
            return;
        }

        codeCheckTimer = setTimeout(function () {
            $hint.text(t('যাচাই করছে...', 'Checking...')).css('color', '#aaa');
            $.get(`/api/ItemPurchase/check-code?institutionId=${institutionId}&code=${encodeURIComponent(code)}`, function (res) {
                if (res.exists) {
                    $hint.text(t('⚠ এই কোডের আইটেম ইতিমধ্যে ডেটাবেসে আছে — পুরাতন ট্যাবে গিয়ে ক্রয় করুন',
                                 '⚠ This item code already exists — use the Existing Item tab'))
                         .removeClass('text-success text-warning').addClass('text-danger');
                } else {
                    $hint.text(t('✓ কোডটি পাওয়া যাচ্ছেনা, নতুন আইটেম তৈরি হবে', '✓ Code not found, a new item will be created'))
                         .removeClass('text-danger text-warning').addClass('text-success');
                }
            });
        }, 500);
    };


    // ─── Add to Cart ──────────────────────────────────────────────────────────
    window.addToCart = function (mode) {
        $('#newErrMsg, #oldErrMsg').text('');

        if (mode === 'new') {
            const code    = $('#newItemCode').val().trim();
            const name    = $('#newItemName').val().trim();
            const unitId  = parseInt($('#newUnitDDL').val());
            const sp      = parseFloat($('#newSellingPrice').val()) || 0;
            const qty     = parseFloat($('#newQty').val()) || 0;
            const total   = parseFloat($('#newTotalPrice').val()) || 0;

            if (!code)   { $('#newErrMsg').text(t('কোড দিন','Enter code')); return; }
            if (!name)   { $('#newErrMsg').text(t('নাম দিন','Enter name')); return; }
            if (!unitId) { $('#newErrMsg').text(t('ইউনিট নির্বাচন করুন','Select unit')); return; }
            if (sp <= 0) { $('#newErrMsg').text(t('বিক্রয় মূল্য দিন','Enter selling price')); return; }
            if (qty <= 0)   { $('#newErrMsg').text(t('পরিমান দিন','Enter quantity')); return; }
            if (total <= 0) { $('#newErrMsg').text(t('মোট মূল্য দিন','Enter total price')); return; }

            if (cart.find(x => x.itemCode.toLowerCase() === code.toLowerCase())) {
                $('#newErrMsg').text(t('このコードはすでにカートに入っています','This code is already in cart')); return;
            }
            if ($('#newCodeHint').hasClass('text-danger')) {
                $('#newErrMsg').text(t('このコードのアイテムはすでに存在します。古いタブを使用してください',
                                      'This item code already exists. Use the Existing Item tab')); return;
            }

            cart.push({
                itemID: 0, itemCode: code, itemName: name,
                sellingUP: sp,
                buyingUnitPrice: parseFloat($('#newUnitBuyPrice').val()) || (total / qty),
                qty, totalPrice: total, isNew: true,
                meta: {
                    unitId, brandId: parseInt($('#newBrandDDL').val()) || 0,
                    categoryId: parseInt($('#newCategoryDDL').val()) || 0
                }
            });

            // Clear new form
            $('#newItemCode, #newItemName').val('');
            $('#newQty, #newTotalPrice, #newUnitBuyPrice, #newSellingPrice').val('');
            $('#newUnitDDL').val('0'); $('#newCategoryDDL').val('0'); $('#newBrandDDL').val('0');

        } else {
            const itemId = parseInt($('#oldItemID').val()) || 0;
            if (!itemId) { $('#oldErrMsg').text(t('আইটেম নির্বাচন করুন','Select an item')); return; }

            const qty   = parseFloat($('#oldQty').val()) || 0;
            const total = parseFloat($('#oldTotalPrice').val()) || 0;
            if (qty <= 0)   { $('#oldErrMsg').text(t('পরিমান দিন','Enter quantity')); return; }
            if (total <= 0) { $('#oldErrMsg').text(t('মোট মূল্য দিন','Enter total price')); return; }

            if (cart.find(x => x.itemID === itemId)) {
                $('#oldErrMsg').text(t('このアイテムはすでにカートに入っています','This item is already in cart')); return;
            }

            const searchText = $('#oldItemSearch').val();
            const parts = searchText.split(' — ');
            const sellingUP = parseFloat($('#oldNewSellingPrice').val()) || parseFloat($('#oldItemSellingUP').val()) || 0;

            cart.push({
                itemID: itemId,
                itemCode: parts[0] || '',
                itemName: parts[1] || '',
                sellingUP,
                buyingUnitPrice: parseFloat($('#oldUnitBuyPrice').val()) || (total / qty),
                qty, totalPrice: total, isNew: false, meta: {}
            });

            // Clear old form
            $('#oldItemSearch').val(''); $('#oldItemID, #oldItemSellingUP').val('');
            $('#oldQty, #oldTotalPrice, #oldUnitBuyPrice, #oldNewSellingPrice').val('');
            $('#oldItemBadge').hide();
        }

        renderCart();
        calcSummary();
    };

    // ─── Render Cart ──────────────────────────────────────────────────────────
    function renderCart() {
        const $body = $('#cartBody');
        $body.empty();
        $('#cartCount').text(cart.length);

        if (!cart.length) {
            $body.html(`<tr><td colspan="7" class="cart-empty">
                <i class="fas fa-cart-plus me-2" style="color:#ddd;"></i>
                ${t('কোনো আইটেম যোগ হয়নি','No items added')}
            </td></tr>`);
            return;
        }

        cart.forEach(function (item, i) {
            const newBadge = item.isNew
                ? `<span class="badge bg-success ms-1" style="font-size:10px;">${t('নতুন','New')}</span>`
                : '';
            $body.append(`
            <tr>
                <td>${i + 1}</td>
                <td>
                    <span class="item-code-cell">${esc(item.itemCode)}</span>
                    ${newBadge}
                    <br><small style="color:#888">${esc(item.itemName)}</small>
                </td>
                <td>৳ ${parseFloat(item.sellingUP).toFixed(2)}</td>
                <td>
                    <input type="number" class="cart-input" value="${item.qty}" min="0.01" step="0.01"
                        onchange="updateCartQty(${i}, this.value)">
                </td>
                <td>
                    <input type="number" class="cart-input" value="${parseFloat(item.buyingUnitPrice.toFixed(2))}" min="0" step="0.01"
                        onchange="updateCartUnitPrice(${i}, this.value)">
                </td>
                <td>
                    <input type="number" class="cart-input" value="${item.totalPrice}" min="0.01" step="0.01"
                        onchange="updateCartTotal(${i}, this.value)">
                </td>
                <td>
                    <button class="btn-remove" onclick="removeFromCart(${i})">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            </tr>`);
        });
    }

    window.updateCartQty = function (i, val) {
        const qty = parseFloat(val) || 0;
        if (qty <= 0) return;
        cart[i].qty = qty;
        cart[i].totalPrice = parseFloat((cart[i].buyingUnitPrice * qty).toFixed(2));
        renderCart(); calcSummary();
    };

    window.updateCartUnitPrice = function (i, val) {
        const unitPrice = parseFloat(val) || 0;
        if (unitPrice < 0) return;
        cart[i].buyingUnitPrice = unitPrice;
        cart[i].totalPrice = parseFloat((unitPrice * cart[i].qty).toFixed(2));
        renderCart(); calcSummary();
    };

    window.updateCartTotal = function (i, val) {
        const tot = parseFloat(val) || 0;
        if (tot <= 0) return;
        cart[i].totalPrice = tot;
        cart[i].buyingUnitPrice = cart[i].qty > 0 ? tot / cart[i].qty : 0;
        renderCart(); calcSummary();
    };

    window.removeFromCart = function (i) {
        cart.splice(i, 1);
        renderCart(); calcSummary();
    };

    window.toggleUpdatePrice = function (i, checked) {
        const $cb = $(`#cbUpdatePrice${i}`);
        const item = cart[i];
        if (checked) {
            // Enable editing
            $cb.closest('tr').find('.cart-input').prop('disabled', false);
            $cb.closest('tr').find('.price').css('opacity', 0.5);
        } else {
            // Disable editing
            $cb.closest('tr').find('.cart-input').prop('disabled', true);
            $cb.closest('tr').find('.price').css('opacity', 1);
            // Restore original buying unit price
            item.buyingUnitPrice = item.totalPrice / item.qty;
            $(`#unitPriceCell${i}`).text(`৳ ${item.buyingUnitPrice.toFixed(2)}`);
        }
    };

    // ─── Summary ──────────────────────────────────────────────────────────────
    function getGrandTotal() {
        return cart.reduce((s, x) => s + x.totalPrice, 0);
    }

    window.calcSummary = function () {
        const grand    = getGrandTotal();
        const discount = parseFloat($('#discountAmt').val()) || 0;
        const net      = Math.max(grand - discount, 0);
        const paid     = parseFloat($('#paidAmount').val()) || 0;

        $('#sumGrandTotal').text(grand.toFixed(2));
        $('#discountPct').val(grand > 0 ? ((discount / grand) * 100).toFixed(2) : 0);
        $('#sumNetTotal').text(net.toFixed(2));
        $('#sumDue').text(Math.max(net - paid, 0).toFixed(2));

        // update supplier modal totals
        $('#sOldNetTotal, #sNewNetTotal').text(net.toFixed(2));
    };

    window.calcSummaryByPct = function () {
        const grand = getGrandTotal();
        const pct   = parseFloat($('#discountPct').val()) || 0;
        const disc  = (grand * pct / 100);
        $('#discountAmt').val(disc.toFixed(2));
        calcSummary();
    };

    window.calcDue = function () {
        const net  = parseFloat($('#sumNetTotal').text()) || 0;
        const paid = parseFloat($('#paidAmount').val()) || 0;
        $('#sumDue').text(Math.max(net - paid, 0).toFixed(2));
    };

    window.calcSupplierDue = function (mode) {
        const net  = parseFloat($('#sumNetTotal').text()) || 0;
        const paid = parseFloat(mode === 'old' ? $('#oldSupplierPaid').val() : $('#newSupplierPaid').val()) || 0;
        const due  = Math.max(net - paid, 0).toFixed(2);
        const msg  = paid > net
            ? `<span class="text-danger">পেমেন্ট মোট (৳${net.toFixed(2)}) এর বেশি হতে পারবে না</span>`
            : `বাকি থাকছে: ৳ ${due}`;
        if (mode === 'old') $('#oldSupplierDueMsg').html(msg);
        else $('#newSupplierDueMsg').html(msg);
    };

    // ─── Submit ───────────────────────────────────────────────────────────────
    function buildPayload(supplierID, paidAmount) {
        return {
            institutionID: institutionId,
            registrationID: registrationId,
            supplierID: supplierID || 0,
            accountID: parseInt($('#accountDDL').val()) || 0,
            billNo: $('#billNo').val().trim(),
            buyingDate: $('#buyingDate').val(),
            paidAmount: paidAmount,
            discountAmount: parseFloat($('#discountAmt').val()) || 0,
            updateBuyingPrice: $('#updateBuyingPriceChk').is(':checked'),
            items: cart.map(function (x) {
                return {
                    itemID: x.itemID,
                    itemCode: x.itemCode,
                    itemName: x.itemName,
                    unitID: x.meta.unitId || 0,
                    brandID: x.meta.brandId || 0,
                    categoryID: x.meta.categoryId || 0,
                    sellingUnitPrice: x.sellingUP,
                    buyingUnitPrice: x.buyingUnitPrice,
                    quantity: x.qty,
                    totalPrice: x.totalPrice
                };
            })
        };
    }

    function doSubmit(payload, $btn, alertSelector) {
        if (!cart.length) { showAlert(alertSelector, t('কমপক্ষে একটি আইটেম কার্টে যোগ করুন', 'Add at least one item to cart'), 'error'); return; }
        if (!payload.buyingDate) { showAlert(alertSelector, t('ক্রয়ের তারিখ দিন', 'Enter purchase date'), 'error'); return; }

        $btn.prop('disabled', true).html('<span class="spinner-sm"></span> ' + t('অপেক্ষা করুন...', 'Please wait...'));
        $(alertSelector).hide();

        $.ajax({
            url: '/api/ItemPurchase/submit', method: 'POST', contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function (res) {
                if (res.success) {
                    supplierModal.hide();
                    showToast(res.message, 'success');
                    cart = [];
                    renderCart(); calcSummary();
                    $('#discountAmt').val(0); $('#discountPct').val(0); $('#paidAmount').val(0);
                    $('#billNo').val('');
                } else {
                    showAlert(alertSelector, res.message, 'error');
                }
            },
            error: function (xhr) { showAlert(alertSelector, xhr.responseJSON?.message || t('সমস্যা হয়েছে', 'Something went wrong'), 'error'); },
            complete: function () {
                $btn.prop('disabled', false).html('<i class="fas fa-check-circle"></i> ' + t('ক্রয় সম্পন্ন করুন', 'Complete Purchase'));
            }
        });
    }

    window.submitWithoutSupplier = function () {
        if (!cart.length) { showAlert('#submitAlert', t('কমপক্ষে একটি আইটেম কার্টে যোগ করুন', 'Add at least one item to cart'), 'error'); return; }

        const net  = parseFloat($('#sumNetTotal').text()) || 0;
        const paid = parseFloat($('#paidAmount').val()) || 0;

        if (paid < net) {
            // বাকি আছে — সাপ্লায়ার পপআপ দেখাও
            $('#sOldNetTotal, #sNewNetTotal').text(net.toFixed(2));
            supplierModal.show();
        } else {
            // পুরো টাকা পরিশোধিত — সরাসরি submit
            doSubmit(buildPayload(0, paid), $('#summaryPanel .btn-primary-c').first(), '#submitAlert');
        }
    };

    window.openSupplierModal = function () {
        if (!cart.length) { showToast(t('কমপক্ষে একটি আইটেম কার্টে যোগ করুন', 'Add at least one item to cart'), 'error'); return; }
        const net = parseFloat($('#sumNetTotal').text()) || 0;
        $('#sOldNetTotal, #sNewNetTotal').text(net.toFixed(2));
        supplierModal.show();
    };

    window.submitWithSupplier = function (mode) {
        if (mode === 'old') {
            const supId = parseInt($('#oldSupplierDDL').val()) || 0;
            if (!supId) { showAlert('#oldSupAlert', t('সাপ্লায়ার নির্বাচন করুন','Select a supplier'), 'error'); return; }
            const paid = parseFloat($('#oldSupplierPaid').val()) || 0;
            doSubmit(buildPayload(supId, paid), $('#oldSupplierTab .btn-primary-c'), '#oldSupAlert');
        } else {
            const name = $('#nsName').val().trim();
            if (!name) { showAlert('#newSupAlert', t('সাপ্লায়ারের নাম দিন','Enter supplier name'), 'error'); return; }

            // First add supplier, then submit
            $.ajax({
                url: '/api/ItemPurchase/add-supplier', method: 'POST', contentType: 'application/json',
                data: JSON.stringify({
                    institutionID: institutionId, registrationID: registrationId,
                    supplierName: name,
                    supplierPhone: $('#nsPhone').val().trim(),
                    supplierAddress: $('#nsAddress').val().trim(),
                    supplierCompanyName: $('#nsCompany').val().trim()
                }),
                success: function (res) {
                    if (!res.success) { showAlert('#newSupAlert', res.message, 'error'); return; }
                    // Add new supplier to dropdown for future
                    $('#oldSupplierDDL').append(`<option value="${res.data.SupplierID}">${esc(res.data.SupplierName)}</option>`);
                    oldSupplierList.push({ SupplierID: res.data.SupplierID, SupplierName: res.data.SupplierName });

                    const paid = parseFloat($('#newSupplierPaid').val()) || 0;
                    doSubmit(buildPayload(res.data.SupplierID, paid), $('#newSupplierTab .btn.primary-c'), '#newSupAlert');
                },
                error: function (xhr) { showAlert('#newSupAlert', xhr.responseJSON?.message || 'সমস্যা হয়েছে', 'error'); }
            });
        }
    };

    // ─── Helpers ──────────────────────────────────────────────────────────────
    function showToast(msg, type) {
        const $t = $('#pageToast');
        $t.removeClass('success error').addClass(type)
          .html(`<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${esc(msg)}`)
          .css('display', 'flex');
        setTimeout(function () { $t.fadeOut(400); }, 4000);
    }

    function showAlert(selector, msg, type) {
        $(selector).removeClass('success error').addClass(type).text(msg).show();
    }

    function esc(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
})();
