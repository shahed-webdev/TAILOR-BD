// item-sell.js
(function () {
    'use strict';

    let institutionId, registrationId;
    let currentLang = 'bn';

    // State
    const state = {
        cart:     [],       // [{ fabricId, fabricCode, fabricName, unitName, stock, qty, unitPrice }]
        customer: null,     // { customerId, customerName, phone }
        accounts: []
    };

    // ─── Init ───────────────────────────────────────────────────────────────────
    $(document).ready(function () {
        institutionId  = parseInt(sessionStorage.getItem('institutionId')  || '0');
        registrationId = parseInt(sessionStorage.getItem('registrationId') || '0');
        if (!institutionId) return;

        currentLang = localStorage.getItem('preferredLanguage') || 'bn';

        $(document).on('languageChanged', function (e, lang) {
            currentLang = lang || 'bn';
        });

        loadAccounts();
        restoreCart();
        bindSearch();
    });

    // ─── Accounts ───────────────────────────────────────────────────────────────
    function loadAccounts() {
        $.get(`/api/ItemSell/accounts?institutionId=${institutionId}`, function (res) {
            if (!res.success) return;
            state.accounts = res.data || [];
            const $s = $('#fAccount').empty();
            $s.append('<option value="">[ SELECT ]</option>');
            res.data.forEach(function (a) {
                $s.append(`<option value="${a.AccountId}" ${a.IsDefault ? 'selected' : ''}>${esc(a.AccountName)}</option>`);
            });
        });
    }

    // ─── Search / Autocomplete ───────────────────────────────────────────────────
    function bindSearch() {
        const $inp  = $('#searchInput');
        const $drop = $('#acDropdown');
        let _timer, _acItems = [], _acIdx = -1;

        $inp.on('input', function () {
            const q = $(this).val().trim();
            clearTimeout(_timer);
            if (!q) { $drop.hide(); return; }
            _timer = setTimeout(function () {
                $.get(`/api/ItemSell/search?institutionId=${institutionId}&prefix=${encodeURIComponent(q)}`, function (res) {
                    if (!res.success || !res.data) { $drop.hide(); return; }
                    _acItems = res.data;
                    _acIdx   = -1;
                    renderAC(_acItems);
                });
            }, 280);
        });

        $inp.on('keydown', function (e) {
            const $items = $drop.find('.ac-item');
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                _acIdx = Math.min(_acIdx + 1, $items.length - 1);
                $items.removeClass('active').eq(_acIdx).addClass('active');
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                _acIdx = Math.max(_acIdx - 1, 0);
                $items.removeClass('active').eq(_acIdx).addClass('active');
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (_acIdx >= 0 && _acItems[_acIdx]) {
                    addToCart(_acItems[_acIdx]);
                    $inp.val('');
                    $drop.hide();
                } else {
                    // fetch by exact code
                    const code = $inp.val().trim();
                    if (!code) return;
                    $.get(`/api/ItemSell/by-code?institutionId=${institutionId}&code=${encodeURIComponent(code)}`, function (res) {
                        if (res.success) {
                            addToCart(res.data);
                            $inp.val('');
                            $drop.hide();
                        } else {
                            toast(currentLang === 'en' ? 'Item not found' : 'আইটেম পাওয়া যায়নি', 'error');
                        }
                    });
                }
            } else if (e.key === 'Escape') {
                $drop.hide();
            }
        });

        $(document).on('click', function (e) {
            if (!$(e.target).closest('.search-box').length) $drop.hide();
        });
    }

    function renderAC(items) {
        const $drop = $('#acDropdown');
        if (!items.length) { $drop.hide(); return; }
        $drop.empty();
        items.forEach(function (item, i) {
            const qty   = parseFloat(item.StockFabricQuantity) || 0;
            const stCls = qty <= 0 ? 'out' : qty <= 10 ? 'low' : '';
            const stLbl = `${fmtQ(qty)} ${esc(item.UnitName||'')}`;
            const $row  = $(`
            <div class="ac-item" data-idx="${i}">
                <span class="ac-code">${esc(item.FabricCode)}</span>
                <div class="ac-name">
                    <div>${esc(item.FabricsName)}</div>
                    <small style="color:#aaa;">${esc(item.CategoryName||'')} ${item.BrandName?'· '+esc(item.BrandName):''}</small>
                </div>
                <div>
                    <div style="text-align:right;font-size:12px;font-weight:700;color:#6c7ae0;">৳${fmt(item.SellingUnitPrice)}</div>
                    <div class="ac-stock ${stCls}"><i class="fas fa-box me-1"></i>${stLbl}</div>
                </div>
            </div>`);
            $row.on('click', function () {
                addToCart(item);
                $('#searchInput').val('');
                $('#acDropdown').hide();
            });
            $drop.append($row);
        });
        $drop.show();
    }

    // ─── Cart ────────────────────────────────────────────────────────────────────
    function addToCart(item) {
        const id = item.FabricId || item.fabricId;
        if (state.cart.some(c => c.fabricId === id)) {
            toast(esc(item.FabricCode) + (currentLang === 'en' ? ' already added' : ' আগে থেকে আছে'), 'info');
            return;
        }
        const qty = parseFloat(item.StockFabricQuantity) || 0;
        if (qty <= 0) {
            toast(esc(item.FabricCode) + (currentLang === 'en' ? ' — Out of stock' : ' — স্টক নেই'), 'error');
            return;
        }
        state.cart.push({
            fabricId:   id,
            fabricCode: item.FabricCode,
            fabricName: item.FabricsName,
            unitName:   item.UnitName || '',
            stock:      qty,
            qty:        1,
            unitPrice:  parseFloat(item.SellingUnitPrice) || 0
        });
        saveCart();
        renderCart();
        toast(esc(item.FabricCode) + (currentLang === 'en' ? ' added' : ' যুক্ত হয়েছে'), 'success');
    }

    window.removeFromCart = function (fabricId) {
        state.cart = state.cart.filter(c => c.fabricId !== fabricId);
        saveCart();
        renderCart();
    };

    window.onQtyChange = function (fabricId, val) {
        const item = state.cart.find(c => c.fabricId === fabricId);
        if (!item) return;
        // Only update summary during typing, never re-render DOM
        const q = parseFloat(val) || 0;
        if (q > 0) {
            item.qty = Math.min(q, item.stock);
            saveCart();
        }
        updateSummary();
    };

    window.onQtyBlur = function (fabricId, el) {
        const item = state.cart.find(c => c.fabricId === fabricId);
        if (!item) return;
        let q = parseFloat(el.value) || 0;
        if (q > item.stock) { q = item.stock; el.value = q; }
        if (q < 0.01)       { q = 0.01;       el.value = q; }
        item.qty = q;
        saveCart();
        // Update only the hint text and line total — no full re-render
        const $td   = $(el).closest('td');
        const $row  = $(el).closest('tr');
        const remaining = item.stock - q;
        $td.find('.stock-hint')
           .text((currentLang==='en'?'Remaining: ':'বাকি: ') + fmtQ(Math.max(remaining, 0)))
           .css('color', remaining < 0 ? '#dc3545' : '#aaa');
        $(el).toggleClass('err', q > item.stock);
        $row.find('.line-total').text('৳' + fmt(q * item.unitPrice));
        updateSummary();
    };

    window.onPriceChange = function (fabricId, val) {
        const item = state.cart.find(c => c.fabricId === fabricId);
        if (!item) return;
        item.unitPrice = parseFloat(val) || 0;
        saveCart();
        updateSummary();
    };

    window.onPriceBlur = function (fabricId, el) {
        const item = state.cart.find(c => c.fabricId === fabricId);
        if (!item) return;
        const p = parseFloat(el.value) || 0;
        item.unitPrice = p;
        el.value = p;
        saveCart();
        $(el).closest('tr').find('.line-total').text('৳' + fmt(item.qty * p));
        updateSummary();
    };

    function renderCart() {
        const $rows = $('#cartRows').empty();
        $('#cartCount').text(state.cart.length);

        if (!state.cart.length) {
            $('#emptyCart').show();
            $('#cartTable').hide();
            $('#submitBtn').prop('disabled', true);
            updateSummary();
            return;
        }

        $('#emptyCart').hide();
        $('#cartTable').show();

        state.cart.forEach(function (item, i) {
            const lineTotal = item.qty * item.unitPrice;
            const remaining = item.stock - item.qty;
            const isOver    = item.qty > item.stock;
            $rows.append(`
            <tr>
                <td style="color:#aaa;">${i + 1}</td>
                <td class="td-left">
                    <div style="font-weight:700;color:#fd7e14;">${esc(item.fabricCode)}</div>
                    <div style="font-size:12px;color:#555;">${esc(item.fabricName)}</div>
                </td>
                <td>
                    <span style="font-size:12.5px;font-weight:700;color:${item.stock<=10?'#fd7e14':'#28a745'};">${fmtQ(item.stock)}</span>
                    <div style="font-size:11px;color:#aaa;">${esc(item.unitName)}</div>
                </td>
                <td>
                    <input class="qty-input ${isOver?'err':''}" type="number" value="${item.qty}"
                        min="0.01" max="${item.stock}" step="0.01"
                        oninput="onQtyChange(${item.fabricId},this.value)"
                        onblur="onQtyBlur(${item.fabricId},this)">
                    <div class="stock-hint" style="color:${remaining<0?'#dc3545':'#aaa'};">
                        ${currentLang==='en'?'Remaining:':'বাকি:'} ${fmtQ(Math.max(remaining,0))}
                    </div>
                </td>
                <td>
                    <input class="price-input" type="number" value="${item.unitPrice}"
                        min="0" step="0.01"
                        oninput="onPriceChange(${item.fabricId},this.value)"
                        onblur="onPriceBlur(${item.fabricId},this)">
                </td>
                <td class="line-total">৳${fmt(lineTotal)}</td>
                <td>
                    <button class="rem-btn" onclick="removeFromCart(${item.fabricId})">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            </tr>`);
        });

        $('#submitBtn').prop('disabled', state.cart.length === 0);
        updateSummary();
    }

    window.updateSummary = function () {
        const subtotal = state.cart.reduce((s, c) => s + c.qty * c.unitPrice, 0);
        const discount = Math.max(parseFloat($('#fDiscount').val()) || 0, 0);
        const afterDisc = Math.max(subtotal - discount, 0);
        const paid      = Math.max(parseFloat($('#fPaid').val()) || 0, 0);
        const due       = Math.max(afterDisc - paid, 0);

        $('#sSubtotal').text('৳' + fmt(subtotal));
        $('#sAfterDisc').text('৳' + fmt(afterDisc));
        $('#sDue').text('৳' + fmt(due));
        $('#sDue').closest('.sum-row').css('color', due > 0 ? '#dc3545' : '#28a745');
    };

    // ─── Customer ────────────────────────────────────────────────────────────────
    let _custTimer;

    window.openCustModal = function () {
        $('#cPhone,#cName,#cAddress').val('');
        $('#cGender').val('1');
        $('#custResults').empty().hide();
        document.getElementById('custModal').classList.add('show');
        setTimeout(() => document.getElementById('cPhone').focus(), 150);
    };

    window.closeCustModal = function () {
        document.getElementById('custModal').classList.remove('show');
    };

    window.searchCustomer = function () {
        clearTimeout(_custTimer);
        const q = ($('#cPhone').val() + ' ' + $('#cName').val()).trim();
        if (q.length < 2) { $('#custResults').hide(); return; }
        _custTimer = setTimeout(function () {
            $.get(`/api/ItemSell/search-customer?institutionId=${institutionId}&prefix=${encodeURIComponent(q)}`, function (res) {
                const $r = $('#custResults').empty();
                if (!res.success || !res.data || !res.data.length) { $r.hide(); return; }
                res.data.forEach(function (c) {
                    $r.append(`<div class="cust-row" onclick="selectCustomer(${c.CustomerID},'${esc(c.CustomerName)}','${esc(c.Phone)}')">
                        <strong>${esc(c.CustomerName)}</strong> — <span style="color:#888;">${esc(c.Phone)}</span>
                        ${c.Address ? `<small style="color:#aaa;"> · ${esc(c.Address)}</small>` : ''}
                    </div>`);
                });
                $r.show();
            });
        }, 350);
    };

    window.selectCustomer = function (id, name, phone) {
        state.customer = { customerId: id, customerName: name, phone };
        renderCustStrip();
        closeCustModal();
    };

    window.saveCustomer = function () {
        const phone = $('#cPhone').val().trim();
        const name  = $('#cName').val().trim();
        if (!phone || !name) {
            toast(currentLang === 'en' ? 'Phone and name required' : 'ফোন ও নাম প্রয়োজন', 'error');
            return;
        }
        $('#saveCustBtn').prop('disabled', true);
        $.ajax({
            url: '/api/ItemSell/add-customer',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                institutionId, registrationId,
                customerName: name,
                phone,
                address:     $('#cAddress').val().trim(),
                description: '',
                clothForId:  parseInt($('#cGender').val())
            }),
            success: function (res) {
                $('#saveCustBtn').prop('disabled', false);
                if (res.success) {
                    state.customer = { customerId: res.customerId, customerName: name, phone };
                    renderCustStrip();
                    closeCustModal();
                    toast(currentLang === 'en' ? 'Customer saved' : 'কাস্টমার সেভ হয়েছে', 'success');
                } else {
                    toast(res.message || 'Error', 'error');
                }
            },
            error: function () { $('#saveCustBtn').prop('disabled', false); toast('Error', 'error'); }
        });
    };

    function renderCustStrip() {
        if (!state.customer) { $('#custStrip').hide(); return; }
        $('#custStrip').html(`
        <div class="cust-strip">
            <div>
                <div class="cname"><i class="fas fa-user me-2"></i>${esc(state.customer.customerName)}</div>
                <div class="cphone">${esc(state.customer.phone)}</div>
            </div>
            <button style="background:none;border:none;color:#dc3545;cursor:pointer;" onclick="clearCustomer()">
                <i class="fas fa-times"></i>
            </button>
        </div>`).show();
    }

    window.clearCustomer = function () {
        state.customer = null;
        $('#custStrip').hide();
    };

    // ─── Submit ──────────────────────────────────────────────────────────────────
    window.submitSale = function () {
        if (!state.cart.length) {
            toast(currentLang === 'en' ? 'Cart is empty' : 'তালিকা খালি', 'error');
            return;
        }

        const subtotal   = state.cart.reduce((s, c) => s + c.qty * c.unitPrice, 0);
        const discount   = parseFloat($('#fDiscount').val()) || 0;
        const paid       = parseFloat($('#fPaid').val()) || 0;
        const due        = (subtotal - discount) - paid;
        const accountId  = parseInt($('#fAccount').val()) || 0;

        if (due > 0 && !state.customer) {
            toast(currentLang === 'en' ? 'Please add customer for due amount' : 'বাকি থাকলে কাস্টমার প্রয়োজন', 'error');
            openCustModal();
            return;
        }

        const $btn = $('#submitBtn');
        $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-2"></i>' + (currentLang==='en'?'Processing...':'সেভ হচ্ছে...'));

        $.ajax({
            url: '/api/ItemSell/submit',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                institutionId, registrationId,
                accountId,
                customerId:     state.customer ? state.customer.customerId : 0,
                paidAmount:     paid,
                discountAmount: discount,
                items: state.cart.map(c => ({
                    fabricId:   c.fabricId,
                    quantity:   c.qty,
                    unitPrice:  c.unitPrice
                }))
            }),
            success: function (res) {
                $btn.prop('disabled', false).html('<i class="fas fa-check-circle me-2"></i>' + (currentLang==='en'?'Complete Sale':'বিক্রি সম্পন্ন করুন'));
                if (res.success) {
                    clearCart();
                    location.href = '/item-sell-invoice.html?id=' + res.sellingId;
                } else {
                    toast(res.message || 'Error', 'error');
                }
            },
            error: function () {
                $btn.prop('disabled', false).html('<i class="fas fa-check-circle me-2"></i>' + (currentLang==='en'?'Complete Sale':'বিক্রি সম্পন্ন করুন'));
                toast('Server error', 'error');
            }
        });
    };

    // ─── Invoice ─────────────────────────────────────────────────────────────────
    function loadInvoice(sellingId) {
        $.get(`/api/ItemSell/invoice?sellingId=${sellingId}`, function (res) {
            if (!res.success) return;
            const h  = res.header;
            const dt = new Date(h.SellingDate).toLocaleDateString('en-BD', { day:'2-digit', month:'short', year:'numeric' });
            let itemRows = '';
            (res.items || []).forEach(function (item, i) {
                itemRows += `<tr>
                    <td>${i+1}</td>
                    <td style="text-align:left;">${esc(item.FabricCode)} – ${esc(item.FabricsName)}</td>
                    <td>${fmtQ(item.SellingQuantity)} ${esc(item.UnitName||'')}</td>
                    <td>৳${fmt(item.SellingUnitPrice)}</td>
                    <td>৳${fmt(item.SellingPrice)}</td>
                </tr>`;
            });

            $('#invContent').html(`
            <div style="text-align:center;margin-bottom:12px;">
                <div class="inv-logo">${esc(h.InstitutionName)}</div>
                <div style="font-size:12px;color:#888;">${currentLang==='en'?'Sale Receipt':'বিক্রয় রশিদ'} #${h.SellingSN} · ${dt}</div>
                ${h.CustomerName ? `<div style="margin-top:6px;font-size:13px;font-weight:600;">${esc(h.CustomerName)} · ${esc(h.Phone)}</div>` : ''}
            </div>
            <table class="inv-table">
                <thead>
                    <tr>
                        <th>#</th><th>${currentLang==='en'?'Item':'আইটেম'}</th>
                        <th>${currentLang==='en'?'Qty':'পরিমান'}</th>
                        <th>${currentLang==='en'?'Rate':'দর'}</th>
                        <th>${currentLang==='en'?'Total':'মোট'}</th>
                    </tr>
                </thead>
                <tbody>${itemRows}</tbody>
            </table>
            <div style="border-top:2px solid #e0e3f7;padding-top:10px;text-align:right;">
                <div style="font-size:13px;margin-bottom:4px;">${currentLang==='en'?'Total':'মোট'}: <strong>৳${fmt(h.SellingTotalPrice)}</strong></div>
                ${h.SellingDiscountAmount > 0 ? `<div style="font-size:13px;color:#fd7e14;margin-bottom:4px;">${currentLang==='en'?'Discount':'ছাড়'}: ৳${fmt(h.SellingDiscountAmount)}</div>` : ''}
                <div style="font-size:13px;margin-bottom:4px;color:#28a745;">${currentLang==='en'?'Paid':'পরিশোধ'}: <strong>৳${fmt(h.SellingPaidAmount)}</strong></div>
                <div style="font-size:15px;font-weight:800;color:${h.SellingDueAmount>0?'#dc3545':'#28a745'};">${currentLang==='en'?'Due':'বাকি'}: ৳${fmt(h.SellingDueAmount)}</div>
            </div>`);

            document.getElementById('invModal').classList.add('show');
        });
    }

    // ─── Reset ───────────────────────────────────────────────────────────────────
    window.resetAll = function () {
        location.href = '/item-sell.html';
    };

    function clearCart() {
        state.cart     = [];
        state.customer = null;
        $('#fDiscount').val('0');
        $('#fPaid').val('0');
        localStorage.removeItem('item-sell-cart');
        renderCustStrip();
        renderCart();
    }

    // ─── Persist cart ────────────────────────────────────────────────────────────
    function saveCart() {
        localStorage.setItem('item-sell-cart', JSON.stringify({ cart: state.cart, customer: state.customer }));
    }

    function restoreCart() {
        try {
            const d = JSON.parse(localStorage.getItem('item-sell-cart') || '{}');
            state.cart     = d.cart     || [];
            state.customer = d.customer || null;
        } catch (_) {}
        renderCustStrip();
        renderCart();
    }

    // ─── Toast ───────────────────────────────────────────────────────────────────
    window.toast = function (msg, type) {
        const $t = $(`<div class="toast-item ${type||'info'}">${msg}</div>`);
        $('#toastWrap').append($t);
        setTimeout(function () { $t.fadeOut(300, function () { $t.remove(); }); }, 2800);
    };

    // ─── Helpers ─────────────────────────────────────────────────────────────────
    function fmt(n)  { return parseFloat(n||0).toLocaleString('en-BD',{minimumFractionDigits:2,maximumFractionDigits:2}); }
    function fmtQ(n) { const v=parseFloat(n||0); return v%1===0?v.toFixed(0):v.toFixed(2); }
    function esc(s)  { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
})();
