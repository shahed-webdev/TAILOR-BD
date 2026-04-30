// update-order.js — TailorBD.API Update Order Page

'use strict';

/* ───────────────────────────────────────────────
   State
─────────────────────────────────────────────── */
let uo = {
    orderId: null,
    orderNumber: null,
    customer: { id: 0, clothForId: 1, name: '', phone: '', paidAmount: 0, discount: 0 },
    dresses: [],       // { orderListId, dressId, dressName, quantity, details, measurements, styles, payments }
    deletedOrderPaymentIds: [],
    deletedOrderListIds: [],
    paymentMethods: [],
    discountLimit: 0,
    activeIndex: null,
    searchTimer: null
};

/* ───────────────────────────────────────────────
   Init
─────────────────────────────────────────────── */
$(function () {
    async function initPage() {
        const params = new URLSearchParams(window.location.search);
        const orderId = params.get('OrderID') || params.get('orderId');
        if (!orderId) {
            showAlert(window.currentLang === 'en' ? 'No Order ID provided!' : 'অর্ডার আইডি পাওয়া যাচ্ছে না!', 'danger');
            return;
        }
        uo.orderId = +orderId;

        showPageLoading(true);
        await Promise.all([loadPaymentMethods(), loadDiscountLimit()]);
        await loadOrderDetails(uo.orderId);
        showPageLoading(false);

        if (window.updateLanguage) window.updateLanguage();
    }

    function waitForSession(callback, tries) {
        tries = tries || 0;
        if (sessionStorage.getItem('institutionId')) {
            callback();
        } else if (tries < 50) {
            setTimeout(function () { waitForSession(callback, tries + 1); }, 100);
        } else {
            console.error('update-order: institutionId not found in sessionStorage after 5s');
        }
    }

    waitForSession(function () { initPage(); });

    $('#fabricCodeModal').on('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); searchFabricModal(); }
    });
});

/* ───────────────────────────────────────────────
   API helpers
─────────────────────────────────────────────── */
function institutionId() { return sessionStorage.getItem('institutionId'); }
function registrationId() { return sessionStorage.getItem('registrationId'); }

async function apiFetch(url, opts = {}) {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        ...opts
    });
    return res.json();
}

function showPageLoading(show) {
    $('#pageLoadingOverlay').toggle(show);
    $('#addDressSection, #dressListSection, #orderSummarySection').toggle(!show);
}

/* ───────────────────────────────────────────────
   Load Order Details from API
─────────────────────────────────────────────── */
async function loadOrderDetails(orderId) {
    // 1. Load order header
    const orderRes = await apiFetch(`/api/Orders/by-order-id/${orderId}?institutionId=${institutionId()}`).catch(() => null);
    if (!orderRes?.success || !orderRes?.data) {
        showAlert(window.currentLang === 'en' ? 'Order not found!' : 'অর্ডার পাওয়া যায়নি!', 'danger');
        return;
    }

    const o = orderRes.data;
    uo.orderNumber = o.orderSerialNumber;
    uo.customer = {
        id: o.customerID,
        clothForId: o.clothForID || 1,
        name: o.customerName,
        phone: o.phone,
        paidAmount: o.paidAmount || 0,
        discount: o.discount || 0
    };

    $('#orderNumber').text(uo.orderNumber);
    $('#orderNumberDisplay').show();
    $('#selectedCustomerName').text(uo.customer.name);
    $('#selectedCustomerPhone').text(uo.customer.phone);
    $('#customerInfoBar').show();

    // Show delete button only if no payment
    if (uo.customer.paidAmount === 0) {
        $('#deleteOrderBtn').show();
    }

    // 2. Load dress list
    const itemsRes = await apiFetch(`/api/Orders/${orderId}/items?institutionId=${institutionId()}`).catch(() => null);
    const items = itemsRes?.data || [];

    // 3. For each dress, load measurements + styles + payments
    uo.dresses = [];
    for (const item of items) {
        const olId = item.orderListID;
        const dressId = item.dressID || item.dressId;

        // Get measurements and styles from dress template + saved values
        const msData = await getMeasurementsStyles(dressId);

        // Get existing payments for this order list item
        const pmtRes = await apiFetch(`/api/Orders/${orderId}/order-list/${olId}/payments?institutionId=${institutionId()}`).catch(() => null);
        const existingPayments = (pmtRes?.data || []).map(p => ({
            orderPaymentId: p.orderPaymentID,
            for: p.details,
            For: p.details,
            unitPrice: p.unitPrice,
            quantity: p.unit,
            amount: p.amount,
            fabricId: p.fabricID || null
        }));

        // Load saved measurements for this order list
        const measRes = await apiFetch(`/api/Orders/${orderId}/order-list/${olId}/measurements?institutionId=${institutionId()}`).catch(() => null);
        const savedMeasurements = measRes?.data || null;

        // Merge saved measurements into msData groups
        let mergedMeasurements = msData?.measurementGroups || msData?.MeasurementGroups || [];
        if (savedMeasurements) {
            mergedMeasurements = mergeSavedMeasurements(mergedMeasurements, savedMeasurements);
        }

        // Load saved styles for this order list
        const styleRes = await apiFetch(`/api/Orders/${orderId}/order-list/${olId}/styles?institutionId=${institutionId()}`).catch(() => null);
        const savedStyles = styleRes?.data || null;

        let mergedStyles = msData?.styleGroups || msData?.StyleGroups || [];
        if (savedStyles) {
            mergedStyles = mergeSavedStyles(mergedStyles, savedStyles);
        }

        uo.dresses.push({
            orderListId: olId,
            dressId,
            dressName: item.dress_Name || item.dressName || '',
            quantity: item.dressQuantity || 1,
            details: item.details || '',
            measurements: mergedMeasurements,
            styles: mergedStyles,
            payments: existingPayments
        });
    }

    // 4. Load dress dropdown for current customer/gender
    await loadDresses();

    // 5. Render all
    renderAll();
}

/* Merge saved measurement values into template groups */
function mergeSavedMeasurements(groups, savedList) {
    if (!savedList || !savedList.length) return groups;
    const map = {};
    savedList.forEach(s => { map[s.measurementTypeID || s.MeasurementTypeID] = s.measurement || s.Measurement || ''; });
    return groups.map(g => {
        const measurements = (g.Measurements || g.measurements || []).map(m => {
            const tid = m.MeasurementTypeID || m.measurementTypeID;
            if (map[tid] !== undefined) {
                return Object.assign({}, m, { Measurement: map[tid], measurement: map[tid] });
            }
            return m;
        });
        return Object.assign({}, g, { Measurements: measurements, measurements });
    });
}

/* Merge saved style checks into template groups */
function mergeSavedStyles(groups, savedList) {
    if (!savedList || !savedList.length) return groups;
    const map = {};
    savedList.forEach(s => { map[s.dressStyleId || s.DressStyleId || s.Dress_StyleID] = s.dressStyleMeasurement || s.DressStyleMeasurement || ''; });
    return groups.map(g => {
        const styles = (g.Styles || g.styles || []).map(s => {
            const sid = s.DressStyleId || s.dressStyleId;
            if (map[sid] !== undefined) {
                return Object.assign({}, s, {
                    IsCheck: true, isCheck: true,
                    DressStyleMesurement: map[sid],
                    dressStyleMesurement: map[sid]
                });
            }
            return s;
        });
        return Object.assign({}, g, { Styles: styles, styles });
    });
}

/* ───────────────────────────────────────────────
   Load helpers
─────────────────────────────────────────────── */
async function loadDresses() {
    const { clothForId = 0 } = uo.customer;
    const customerId = uo.customer.id || 0;
    const url = `/api/Dresses?institutionId=${institutionId()}&clothForId=${clothForId || ''}&customerId=${customerId}`;
    const res = await apiFetch(url).catch(() => null);
    const list = res?.data || [];
    const lang = window.currentLang === 'en' ? 'en' : 'bn';
    const placeholder = lang === 'en' ? '[ Select Dress ]' : '[ পোশাক নির্বাচন করুন ]';

    $('#dressSelect').html(`<option value="">${placeholder}</option>` +
        list.map(d => {
            const id = d.dressId || d.DressId || d.dressID || d.DressID;
            const name = d.dressName || d.DressName || d.dress_Name;
            const hasMeasurement = d.isMeasurementAvailable || d.IsMeasurementAvailable;
            const cls = hasMeasurement ? ' class="dress-has-measurement"' : '';
            return `<option value="${id}" data-name="${name}"${cls}>${hasMeasurement ? '📏 ' : ''}${name}</option>`;
        }).join(''));

    $('#addDressSection').show();
}

async function loadPaymentMethods() {
    const url = `/api/Account/${institutionId()}`;
    const res = await apiFetch(url).catch(() => null);
    const accounts = res?.data || [];
    uo.paymentMethods = accounts;
}

async function loadDiscountLimit() {
    const url = `/api/Orders/discount-limit?institutionId=${institutionId()}`;
    const res = await apiFetch(url).catch(() => null);
    uo.discountLimit = res?.data ?? 0;
}

async function getMeasurementsStyles(dressId) {
    const customerId = uo.customer.id || 0;
    const url = `/api/Dresses/${dressId}/measurements-styles?institutionId=${institutionId()}&customerId=${customerId}`;
    try {
        const res = await fetch(url, {
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        });
        if (!res.ok) return null;
        const json = await res.json();
        return json?.data || null;
    } catch (err) {
        console.error('getMeasurementsStyles error:', err);
        return null;
    }
}

/* ───────────────────────────────────────────────
   Dress List
─────────────────────────────────────────────── */
window.addDressToList = async function () {
    const sel = $('#dressSelect');
    const dressId = +sel.val();
    if (!dressId) return;
    const dressName = sel.find(':selected').data('name') || sel.find(':selected').text();

    if (uo.dresses.some(d => d.dressId === dressId)) {
        showAlert(window.currentLang === 'en' ? 'Dress already added' : 'পোশাকটি ইতিমধ্যে যুক্ত', 'warning');
        return;
    }

    try {
        const data = await getMeasurementsStyles(dressId);
        uo.dresses.push({
            orderListId: null, // new dress — no existing orderListId
            dressId,
            dressName,
            quantity: 1,
            details: data?.orderDetails || data?.OrderDetails || '',
            measurements: data?.measurementGroups || data?.MeasurementGroups || [],
            styles: data?.styleGroups || data?.StyleGroups || [],
            payments: []
        });
        renderAll();
    } catch (err) {
        console.error('addDressToList error:', err);
        showAlert(window.currentLang === 'en' ? 'Failed to add dress. Please try again.' : 'পোশাক যুক্ত করা যায়নি। আবার চেষ্টা করুন।', 'danger');
    }
};

window.removeDress = function (idx) {
    const lang = window.currentLang === 'en';
    if (!confirm(lang ? 'Remove this dress?' : 'এই পোশাকটি বাদ দিবেন?')) return;

    const olId = uo.dresses[idx].orderListId;
    if (olId) {
        uo.deletedOrderListIds.push(olId);
    }
    uo.dresses.splice(idx, 1);
    renderAll();
};

/* ───────────────────────────────────────────────
   Render
─────────────────────────────────────────────── */
function renderAll() {
    renderDressList();
    renderPaymentLists();
    updateGrandTotal();
    if (window.updateLanguage) window.updateLanguage();
}

function renderDressList() {
    const $body = $('#dressListBody').empty();
    const lang = window.currentLang === 'en';

    uo.dresses.forEach((d, i) => {
        $body.append(`
            <tr>
                <td class="align-middle">
                    <div class="dress-number-badge">${i + 1}</div>
                </td>
                <td class="align-middle">
                    <div class="dress-name-text">${d.dressName}</div>
                    <div class="d-flex flex-wrap gap-1 mt-1">
                        <button class="btn-measurement" onclick="openMeasurement(${i})">
                            <i class="fas fa-ruler-combined me-1"></i>
                            <span data-en="Measurement" data-bn="মাপ">${lang ? 'Measurement' : 'মাপ'}</span>
                        </button>
                        <button class="btn-style" onclick="openStyle(${i})">
                            <i class="fas fa-magic me-1"></i>
                            <span data-en="Style" data-bn="স্টাইল">${lang ? 'Style' : 'স্টাইল'}</span>
                        </button>
                        <button class="btn-payment-open" onclick="openPayment(${i})">
                            <i class="fas fa-money-bill-wave me-1"></i>
                            <span data-en="Payment" data-bn="পেমেন্ট">${lang ? 'Payment' : 'পেমেন্ট'}</span>
                        </button>
                    </div>
                </td>
                <td class="align-middle text-center">
                    <input type="number" class="form-control qty-input" value="${d.quantity}" min="1"
                           onchange="onQuantityChange(${i}, this.value)">
                </td>
                <td class="align-middle">
                    <input type="text" class="form-control details-input" value="${d.details}"
                           data-en-placeholder="dress details" data-bn-placeholder="পোশাকের বিবরণ"
                           placeholder="${lang ? 'dress details' : 'পোশাকের বিবরণ'}"
                           onchange="uo.dresses[${i}].details=this.value;">
                </td>
                <td class="align-middle">
                    <button class="btn-remove-dress" onclick="removeDress(${i})" title="${lang ? 'Remove' : 'বাদ দিন'}">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            </tr>`);
    });

    $('#dressListSection').toggle(uo.dresses.length > 0);
    $('#orderSummarySection').toggle(uo.dresses.length > 0);
}

window.onQuantityChange = function (idx, val) {
    const newQty = +val;
    if (newQty < 1) return;
    const d = uo.dresses[idx];
    d.quantity = newQty;

    (d.payments || []).forEach(p => {
        if (!p.fabricId && !p.FabricID && !p.orderPaymentId) {
            p.quantity = newQty;
        }
    });

    renderPaymentLists();
    updateGrandTotal();
};

function renderPaymentLists() {
    const $cont = $('#paymentListsContainer').empty();
    const lang = window.currentLang === 'en';

    uo.dresses.forEach((d, i) => {
        if (!d.payments || !d.payments.length) return;

        const count = d.payments.length;
        let rows = d.payments.map((p, pi) => {
            const isFabric = !!(p.stockQty || p.StockFabricQuantity);
            const stockQty = p.stockQty || p.StockFabricQuantity || 0;
            const isExisting = !!p.orderPaymentId;
            return `
            <tr>
                <td>
                    <span class="payment-for-label">${p.for || p.For}</span>
                    ${isExisting ? '<span class="badge bg-info ms-1" style="font-size:0.65rem">' + (lang ? 'Saved' : 'সংরক্ষিত') + '</span>' : ''}
                    ${isFabric ? `<div class="stock-info"><i class="fas fa-boxes me-1"></i>${lang ? 'Remaining Stock:' : 'অবশিষ্ট স্টক:'} ${stockQty - p.quantity}</div>` : ''}
                </td>
                <td class="text-center" style="width:100px">
                    <input type="number" class="form-control payment-unit-input" value="${p.quantity}" min="1"
                           ${isFabric ? `max="${stockQty}"` : ''} step="0.01"
                           oninput="uo.dresses[${i}].payments[${pi}].quantity=+this.value; updateGrandTotal(); this.closest('tr').querySelector('.line-total').textContent='৳'+(+this.value * uo.dresses[${i}].payments[${pi}].unitPrice).toFixed(2);">
                </td>
                <td class="text-end" style="width:150px">
                    <input type="number" class="form-control payment-price-input" value="${p.unitPrice}" min="0" step="0.01"
                           oninput="uo.dresses[${i}].payments[${pi}].unitPrice=+this.value; updateGrandTotal(); this.closest('tr').querySelector('.line-total').textContent='৳'+(uo.dresses[${i}].payments[${pi}].quantity * +this.value).toFixed(2);">
                </td>
                <td class="text-end" style="width:120px"><span class="line-total">৳${(p.quantity * p.unitPrice).toFixed(2)}</span></td>
                <td class="text-center" style="width:50px">
                    <button class="btn-remove-payment" onclick="removePaymentItem(${i},${pi})" title="${lang ? 'Remove' : 'বাদ দিন'}">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');

        $cont.append(`
            <div class="payment-card card">
                <div class="card-header">
                    <i class="fas fa-tshirt text-success"></i>
                    <span class="dress-label">${d.dressName}</span>
                    <span class="payment-count">${count} ${lang ? 'item' + (count > 1 ? 's' : '') : 'টি'}</span>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-sm mb-0">
                            <thead>
                                <tr>
                                    <th><span data-en="Payment For" data-bn="কি বাবদ">${lang ? 'Payment For' : 'কি বাবদ'}</span></th>
                                    <th class="text-center" style="width:100px"><span data-en="Unit" data-bn="একক">${lang ? 'Unit' : 'একক'}</span></th>
                                    <th class="text-end" style="width:150px"><span data-en="Unit Price" data-bn="একক মূল্য">${lang ? 'Unit Price' : 'একক মূল্য'}</span></th>
                                    <th class="text-end" style="width:120px"><span data-en="Line Total" data-bn="মোট">${lang ? 'Line Total' : 'মোট'}</span></th>
                                    <th class="text-center" style="width:50px"></th>
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                </div>
            </div>`);
    });
}

/* ───────────────────────────────────────────────
   Measurement Modal
─────────────────────────────────────────────── */
window.openMeasurement = function (idx) {
    uo.activeIndex = idx;
    const d = uo.dresses[idx];
    $('#measurementModalTitle').text(d.dressName);
    const $body = $('#measurementModalBody').empty();

    (d.measurements || []).forEach(group => {
        const measurements = group.Measurements || group.measurements || [];
        let fields = measurements.map(m => {
            const typeId = m.MeasurementTypeID || m.measurementTypeID;
            const typeName = m.MeasurementType || m.measurementType;
            const value = m.Measurement || m.measurement || '';
            return `
            <div class="mb-2">
                <input type="text" class="form-control form-control-sm" value="${value}" placeholder="${typeName}"
                       data-id="${typeId}"
                       onchange="updateMeasurement(${idx}, '${typeId}', this.value)">
            </div>`;
        }).join('');

        $body.append(`<div class="col-sm-4 col-lg-3 mb-3"><div class="border rounded p-2 h-100" style="background:#f8f9fa">${fields}</div></div>`);
    });

    new bootstrap.Modal(document.getElementById('measurementModal')).show();
};

window.updateMeasurement = function (idx, typeId, val) {
    const d = uo.dresses[idx];
    (d.measurements || []).forEach(group => {
        (group.Measurements || group.measurements || []).forEach(m => {
            if ((m.MeasurementTypeID || m.measurementTypeID) == typeId) {
                m.Measurement = m.measurement = val;
            }
        });
    });
};

/* ───────────────────────────────────────────────
   Style Modal
─────────────────────────────────────────────── */
window.openStyle = function (idx) {
    uo.activeIndex = idx;
    const d = uo.dresses[idx];
    $('#styleModalTitle').text(d.dressName);
    const $body = $('#styleModalBody').empty();

    (d.styles || []).forEach((group, gi) => {
        const styles = group.Styles || group.styles || [];
        let items = styles.map((s, si) => {
            const isCheck = s.IsCheck || s.isCheck || false;
            const measure = s.DressStyleMesurement || s.dressStyleMesurement || '';
            const sid = s.DressStyleId || s.dressStyleId;
            return `
                <div class="d-flex align-items-center gap-2 py-1 border-bottom" style="min-height:36px">
                    <div class="form-check mb-0 flex-shrink-0">
                        <input class="form-check-input" type="checkbox" id="style_${sid}" ${isCheck ? 'checked' : ''}
                               onchange="updateStyle(${idx},${gi},${si},'check',this.checked)">
                        <label class="form-check-label small" for="style_${sid}">${s.DressStyleName || s.dressStyleName}</label>
                    </div>
                    <input type="text" class="form-control form-control-sm ms-auto" style="max-width:120px" value="${measure}" ${isCheck ? '' : 'disabled'}
                           id="styleVal_${sid}" placeholder="..."
                           onchange="updateStyle(${idx},${gi},${si},'value',this.value)">
                </div>`;
        }).join('');

        const catName = group.DressStyleCategoryName || group.dressStyleCategoryName || '';
        $body.append(`
            <div class="col-sm-6 mb-3">
                <div class="border rounded overflow-hidden">
                    <div class="px-2 py-1 fw-semibold small text-white" style="background:#6a5acd">${catName}</div>
                    <div class="px-2">${items}</div>
                </div>
            </div>`);
    });

    new bootstrap.Modal(document.getElementById('styleModal')).show();
};

window.updateStyle = function (dressIdx, groupIdx, styleIdx, field, val) {
    const s = uo.dresses[dressIdx].styles[groupIdx];
    const arr = s.Styles || s.styles;
    if (field === 'check') {
        arr[styleIdx].IsCheck = arr[styleIdx].isCheck = val;
        const sid = arr[styleIdx].DressStyleId || arr[styleIdx].dressStyleId;
        $(`#styleVal_${sid}`).prop('disabled', !val).val(val ? (arr[styleIdx].DressStyleMesurement || arr[styleIdx].dressStyleMesurement || '') : '');
        if (!val) arr[styleIdx].DressStyleMesurement = arr[styleIdx].dressStyleMesurement = '';
    } else {
        arr[styleIdx].DressStyleMesurement = arr[styleIdx].dressStyleMesurement = val;
    }
};

/* ───────────────────────────────────────────────
   Payment Modal
─────────────────────────────────────────────── */
window.openPayment = async function (idx) {
    uo.activeIndex = idx;
    const d = uo.dresses[idx];

    const url = `/api/Dresses/${d.dressId}/prices?institutionId=${institutionId()}`;
    const res = await apiFetch(url).catch(() => null);
    const prices = res?.data || [];
    const lang = window.currentLang === 'en';

    if (prices.length) {
        const placeholder = lang ? '[ Select Saved Price ]' : '[ সংরক্ষিত মূল্য নির্বাচন করুন ]';
        $('#savedPriceSelect').html(`<option value="">${placeholder}</option>` +
            prices.map(p => {
                const priceFor = p.priceFor || p.PriceFor || p.Price_For;
                const price = p.price || p.Price;
                return `<option value="${price}" data-for="${priceFor}">${priceFor} — ৳${price}</option>`;
            }).join(''));
        $('#savedPricesWrap').show();
    } else {
        $('#savedPricesWrap').hide();
    }

    $('#paymentModalTitle').html(`<i class="fas fa-money-bill me-2"></i>${d.dressName}`);
    $('#pmtFor').val('');
    $('#pmtAmount').val('');
    $('#fabricCodeModal').val('');
    $('#fabricResultModal').html('');

    new bootstrap.Modal(document.getElementById('paymentModal')).show();
};

window.applySavedPrice = function () {
    const sel = $('#savedPriceSelect');
    const val = sel.val();
    if (!val) return;
    const txt = sel.find(':selected').data('for');
    $('#pmtFor').val(txt);
    $('#pmtAmount').val(val);
    addPayment();
    sel.val('');
};

window.addPayment = function () {
    const idx = uo.activeIndex;
    if (idx === null) return;
    const forTxt = $('#pmtFor').val().trim();
    const amount = +$('#pmtAmount').val();
    if (!forTxt || !amount) return;

    const d = uo.dresses[idx];
    if (d.payments.some(p => (p.for || p.For || '').toLowerCase() === forTxt.toLowerCase())) {
        showAlert(window.currentLang === 'en' ? `${forTxt} already added` : `${forTxt} ইতিমধ্যে যুক্ত`, 'warning');
        return;
    }

    d.payments.push({ orderPaymentId: null, for: forTxt, For: forTxt, unitPrice: amount, quantity: d.quantity });
    renderPaymentLists();
    updateGrandTotal();
    $('#pmtFor').val('');
    $('#pmtAmount').val('');
    showAlert(window.currentLang === 'en' ? `${forTxt} added` : `${forTxt} যুক্ত হয়েছে`, 'success');
};

window.removePaymentItem = function (dressIdx, pmtIdx) {
    const p = uo.dresses[dressIdx].payments[pmtIdx];
    if (p.orderPaymentId) {
        uo.deletedOrderPaymentIds.push(p.orderPaymentId);
    }
    uo.dresses[dressIdx].payments.splice(pmtIdx, 1);
    renderPaymentLists();
    updateGrandTotal();
};

window.searchFabricModal = async function () {
    const code = $('#fabricCodeModal').val().trim();
    if (!code) return;
    const lang = window.currentLang === 'en';
    const res = await apiFetch(`/api/ItemStock/by-code?code=${encodeURIComponent(code)}&institutionId=${institutionId()}`).catch(() => null);

    if (res?.success && res?.data) {
        const it = res.data;
        const fabricCode = it.fabricCode || it.FabricCode;
        const fabricName = it.fabricName || it.FabricName;
        const unitPrice = it.sellingUnitPrice || it.SellingUnitPrice || 0;
        const stockQty = it.stockQty || it.StockQty || it.stockFabricQuantity || it.StockFabricQuantity || 0;
        const fabricId = it.fabricID || it.FabricID || it.fabricId;
        addFabricPayment(fabricCode, fabricName, unitPrice, stockQty, fabricId);
    } else {
        const msg = lang ? 'Item not found' : 'আইটেম পাওয়া যাচ্ছে না';
        $('#fabricResultModal').html(`<div class="alert alert-danger py-2"><i class="fas fa-times-circle me-1"></i>${msg}</div>`);
    }
};

window.addFabricPayment = function (code, name, price, stockQty, fabricId) {
    const idx = uo.activeIndex;
    if (idx === null) return;

    if (stockQty < 1) {
        showAlert(window.currentLang === 'en' ? 'Fabric not in stock' : 'কাপড় স্টকে নেই', 'warning');
        return;
    }

    const label = `Fabric Code: ${code}`;
    const d = uo.dresses[idx];

    if (d.payments.some(p => (p.for || p.For || '').toLowerCase() === label.toLowerCase())) {
        showAlert(window.currentLang === 'en' ? 'Already added' : 'ইতিমধ্যে যুক্ত', 'warning');
        return;
    }

    d.payments.push({ orderPaymentId: null, for: label, For: label, unitPrice: price, quantity: 1, stockQty, fabricId, FabricID: fabricId });
    renderPaymentLists();
    updateGrandTotal();
    $('#fabricCodeModal').val('');
    $('#fabricResultModal').html('');
    showAlert(window.currentLang === 'en' ? `${code} added` : `${code} যুক্ত হয়েছে`, 'success');
};

/* ───────────────────────────────────────────────
   Total
─────────────────────────────────────────────── */
function updateGrandTotal() {
    let total = 0;
    uo.dresses.forEach(d => {
        (d.payments || []).forEach(p => { total += p.quantity * p.unitPrice; });
    });
    $('#grandTotal').text(total.toFixed(2));

    const due = Math.max(0, total - uo.customer.paidAmount - uo.customer.discount);
    $('#dueAmount').text(due.toFixed(2));
}

/* ───────────────────────────────────────────────
   Delete Order
─────────────────────────────────────────────── */
window.deleteOrder = async function () {
    const lang = window.currentLang === 'en';
    if (!confirm(lang ? 'Are you sure you want to delete this order?' : 'আপনি কি নিশ্চিতভাবে এই অর্ডারটি মুছতে চান?')) return;

    if (uo.customer.paidAmount > 0) {
        showAlert(lang ? 'Cannot delete: order has paid amount.' : 'মুছা যাবে না: এই অর্ডারে পেমেন্ট আছে।', 'danger');
        return;
    }

    const btn = $('#deleteOrderBtn').prop('disabled', true);
    const res = await apiFetch(`/api/Orders/${uo.orderId}/delete?institutionId=${institutionId()}`, {
        method: 'DELETE'
    }).catch(() => null);

    if (res?.success) {
        showAlert(lang ? 'Order deleted!' : 'অর্ডার মুছে ফেলা হয়েছে!', 'success');
        setTimeout(() => { location.href = 'order-list.html'; }, 1200);
    } else {
        showAlert(res?.message || (lang ? 'Failed to delete order' : 'অর্ডার মুছা যায়নি'), 'danger');
        btn.prop('disabled', false);
    }
};

/* ───────────────────────────────────────────────
   Update Order
─────────────────────────────────────────────── */
window.updateOrder = async function () {
    if (!uo.dresses.length) {
        showAlert(window.currentLang === 'en' ? 'Please add at least one dress' : 'অন্তত একটি পোশাক থাকতে হবে', 'warning');
        return;
    }

    function flatMeasurements(groups) {
        const out = [];
        (groups || []).forEach(g => {
            (g.Measurements || g.measurements || []).forEach(m => {
                const v = m.Measurement || m.measurement || '';
                if (v) out.push({ id: m.MeasurementTypeID || m.measurementTypeID, value: v });
            });
        });
        return JSON.stringify(out);
    }

    function flatStyles(groups) {
        const out = [];
        (groups || []).forEach(g => {
            (g.Styles || g.styles || []).forEach(s => {
                if (s.IsCheck || s.isCheck) {
                    out.push({ id: s.DressStyleId || s.dressStyleId, value: s.DressStyleMesurement || s.dressStyleMesurement || '' });
                }
            });
        });
        return JSON.stringify(out);
    }

    const OrderList = uo.dresses.map(d => ({
        OrderListId: d.orderListId || null,
        DressId: d.dressId,
        DressQuantity: d.quantity,
        Details: d.details || '',
        ListMeasurement: flatMeasurements(d.measurements),
        ListStyle: flatStyles(d.styles),
        // Only send NEW payments (no orderPaymentId)
        ListPayment: JSON.stringify((d.payments || [])
            .filter(p => !p.orderPaymentId)
            .map(p => ({
                For: p.for || p.For,
                Unit_Price: p.unitPrice,
                Quantity: p.quantity,
                FabricID: p.fabricId || p.FabricID || null
            })))
    }));

    const model = {
        OrderId: uo.orderId,
        ClothForId: uo.customer.clothForId,
        CustomerId: uo.customer.id,
        InstitutionId: +institutionId(),
        RegistrationId: +registrationId(),
        DeletedOrderPaymentIds: uo.deletedOrderPaymentIds,
        DeletedOrderListIds: uo.deletedOrderListIds,
        OrderList
    };

    const btn = $('#updateOrderBtn').prop('disabled', true)
        .html(`<span class="spinner-border spinner-border-sm me-2"></span>${window.currentLang === 'en' ? 'Updating...' : 'আপডেট হচ্ছে...'}`);

    const res = await apiFetch(`/api/orders/${uo.orderId}/update`, {
        method: 'PUT',
        body: JSON.stringify(model)
    }).catch(() => null);

    if (res?.success) {
        showAlert(window.currentLang === 'en' ? 'Order updated successfully!' : 'অর্ডার সফলভাবে আপডেট হয়েছে!', 'success');
        setTimeout(() => { location.href = `money-receipt.html?orderId=${uo.orderId}`; }, 1200);
    } else {
        showAlert(res?.message || (window.currentLang === 'en' ? 'Failed to update order' : 'অর্ডার আপডেট করা যায়নি'), 'danger');
        btn.prop('disabled', false)
            .html(`<i class="fas fa-save me-2"></i>${window.currentLang === 'en' ? 'Update Order' : 'অর্ডার আপডেট করুন'}`);
    }
};

/* ───────────────────────────────────────────────
   Helpers
─────────────────────────────────────────────── */
function showAlert(msg, type = 'info') {
    const $a = $(`<div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${msg}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`);
    $('#alertContainer').prepend($a);
    setTimeout(() => $a.alert('close'), 3500);
}
