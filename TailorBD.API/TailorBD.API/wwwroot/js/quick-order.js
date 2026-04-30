// quick-order.js  — TailorBD.API quick order page — v4.2.0

'use strict';

/* ───────────────────────────────────────────────
   State
─────────────────────────────────────────────── */
let qo = {
orderNumber: null,
customer: { id: 0, clothForId: 1, name: '', phone: '', photo: '' },
    dresses: [],       // { dressId, dressName, quantity, details, measurements, styles, payments }
    paymentMethods: [],
    discountLimit: 0,
    activeIndex: null, // which dress we are editing payment/measurement/style for
    searchTimer: null
};

const STORE_KEY = 'qo-data';

function saveStore() {
    localStorage.setItem(STORE_KEY, JSON.stringify(qo));
}
function loadStore() {
    try {
        const d = localStorage.getItem(STORE_KEY);
        if (d) qo = Object.assign(qo, JSON.parse(d));
    } catch (_) {}
}

/* ───────────────────────────────────────────────
   Init
─────────────────────────────────────────────── */
$(function () {
    loadStore();

    async function initPage() {
        await Promise.all([loadDresses(), loadPaymentMethods(), loadDiscountLimit()]);
        renderAll();
        if (window.updateLanguage) window.updateLanguage();
    }

    // Poll until institutionId is available in sessionStorage (set by app-components.js)
    function waitForSession(callback, tries) {
        tries = tries || 0;
        if (sessionStorage.getItem('institutionId')) {
            callback();
        } else if (tries < 50) {
            setTimeout(function () { waitForSession(callback, tries + 1); }, 100);
        } else {
            console.error('quick-order: institutionId not found in sessionStorage after 5s');
        }
    }

    waitForSession(function () { initPage(); });

    // Fabric code — press Enter to search
    $('#fabricCodeModal').on('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); searchFabricModal(); }
    });

    // Delivery date minimum = today
    const today = new Date().toISOString().split('T')[0];
    $('#deliveryDate').attr('min', today).val(today);

    if (qo.orderNumber) showOrderNumber(qo.orderNumber);
    if (qo.customer.id) showCustomerBar();

    // customer modal open হলে বর্তমান customer তথ্য prefill করুন
    document.getElementById('customerModal').addEventListener('show.bs.modal', function () {
        // ছবি field ও preview reset
        $('#customerPhoto').val('');
        $('#customerPhotoPreview').html('<i class="fas fa-user text-secondary" style="font-size:1.6rem"></i>');

        if (qo.customer.id) {
            $('#customerPhone').val(qo.customer.phone);
            $('#customerName').val(qo.customer.name);
            $('#setCustomerBtn').show();
            $('#addCustomerBtn').hide();
        } else {
            $('#customerPhone').val('');
            $('#customerName').val('');
            $('#customerAddress').val('');
            $('#setCustomerBtn').hide();
            $('#addCustomerBtn').show();
        }
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
    try { return await res.json(); } catch (_) { return null; }
}

/* ───────────────────────────────────────────────
   Load helpers
─────────────────────────────────────────────── */
async function loadDresses() {
    const { clothForId = 0 } = qo.customer;
    const customerId = qo.customer.id || 0;
    const url = `/api/Dresses?institutionId=${institutionId()}&clothForId=${clothForId || ''}&customerId=${customerId}`;
    const res = await apiFetch(url).catch(() => null);
    // ApiResponse returns { isSuccess, data, message }
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
}

async function loadPaymentMethods() {
    const url = `/api/Account/${institutionId()}`;
    const res = await apiFetch(url).catch(() => null);
    // Returns { success, data: [{ AccountID, AccountName, Default_Status, ... }] }
    const accounts = res?.data || [];
    qo.paymentMethods = accounts;
    const lang = window.currentLang === 'en' ? 'en' : 'bn';
    const placeholder = lang === 'en' ? '[ Select ]' : '[ নির্বাচন করুন ]';
    $('#paymentMethodSelect').html(`<option value="">${placeholder}</option>` +
        qo.paymentMethods.map(m => {
            const id = m.AccountID || m.accountID || m.accountId;
            const name = m.AccountName || m.accountName;
            const isDefault = m.Default_Status || m.default_Status || m.IsDefault || m.isDefault || false;
            return `<option value="${id}" ${isDefault ? 'selected' : ''}>${name}</option>`;
        }).join(''));
}

async function loadDiscountLimit() {
    const url = `/api/Orders/discount-limit?institutionId=${institutionId()}`;
    const res = await apiFetch(url).catch(() => null);
    qo.discountLimit = res?.data ?? 0;
}

async function getMeasurementsStyles(dressId) {
    const customerId = qo.customer.id || 0;
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
   Order Number
─────────────────────────────────────────────── */
window.getOrderNumber = async function () {
    const btn = $('#getOrderNumberBtn');
    btn.prop('disabled', true);
    const url = `/api/Orders/next-number?institutionId=${institutionId()}`;
    const res = await apiFetch(url).catch(() => null);
    const num = res?.data;
    if (num) {
        qo.orderNumber = num;
        saveStore();
        showOrderNumber(num);
        btn.html('<i class="fas fa-check me-1"></i>' + (window.currentLang === 'en' ? 'Order #' + num : '#' + num + ' নম্বর সেট'));
    }
    btn.prop('disabled', false);
};

function showOrderNumber(num) {
    $('#orderNumber').text(num);
    $('#orderNumberDisplay').show();
}

/* ───────────────────────────────────────────────
   Customer Search
─────────────────────────────────────────────── */
let customerList = [];

window.searchCustomer = function () {
clearTimeout(qo.searchTimer);

// field খালি হলে customer state reset করুন
const phoneNow = $('#customerPhone').val().trim();
const nameNow  = $('#customerName').val().trim();
if (!phoneNow && !nameNow && qo.customer.id) {
    qo.customer = { id: 0, clothForId: 1, name: '', phone: '' };
    saveStore();
    $('#customerInfoBar').hide();
    $('#setCustomerBtn').hide();
    $('#addCustomerBtn').show();
}

qo.searchTimer = setTimeout(async () => {
    const phone = $('#customerPhone').val().trim();
    const name  = $('#customerName').val().trim();

    // যে field এ typing হচ্ছে সেটা detect করি
    const activeId = $(document.activeElement).attr('id');
    const isPhone = activeId === 'customerPhone';
    const isName  = activeId === 'customerName';

    const query = isPhone ? phone : (isName ? name : '');
    if (!query) { $('#phoneDropdown,#nameDropdown').hide(); return; }

        const q = encodeURIComponent(query);
        const type = isPhone ? 'phone' : 'name';
        const url = `/api/Customers/suggest?q=${q}&type=${type}&institutionId=${institutionId()}`;
        const res = await apiFetch(url).catch(() => null);
        customerList = res?.data || [];

        const html = customerList.map((c, i) => {
            const cName = c.customerName || c.CustomerName || '';
            const cPhone = c.phone || c.Phone || '';
            return `<div class="dropdown-item" onmousedown="selectCustomer(${i})">${cName} — ${cPhone}</div>`;
        }).join('');

        const $phone = $('#phoneDropdown'), $name = $('#nameDropdown');
        if (isPhone) { $phone.html(html).toggle(!!html); $name.hide(); }
        else         { $name.html(html).toggle(!!html);  $phone.hide(); }
    }, 400);
};

// dropdown এর বাইরে click করলে hide হবে
$(document).on('click', function (e) {
    if (!$(e.target).closest('.autocomplete-wrapper').length) {
        $('#phoneDropdown,#nameDropdown').hide();
    }
});

window.selectCustomer = function (idx) {
    const c = customerList[idx];
    const cName = c.customerName || c.CustomerName || '';
    const cPhone = c.phone || c.Phone || '';
    const cAddr = c.address || c.Address || '';
    const cClothFor = c.cloth_For_ID || c.Cloth_For_ID || 1;
    const cId = c.customerID || c.CustomerID;

    $('#customerPhone').val(cPhone);
    $('#customerName').val(cName);
    $('#customerAddress').val(cAddr);
    $('#customerGender').val(cClothFor);
    $('#phoneDropdown,#nameDropdown').hide();

    const cPhoto = `/api/Customers/${cId}/photo?institutionId=${institutionId()}`;
    qo.customer = { id: cId, clothForId: cClothFor, name: cName, phone: cPhone, photo: cPhoto };
    saveStore();
    showCustomerBar();

    $('#setCustomerBtn').show();
    $('#addCustomerBtn').hide();

    // auto-close dropdown এ select করার পর নাম field এ focus দিন
    $('#customerName').focus();
};

function showCustomerBar() {
    $('#selectedCustomerName').text(qo.customer.name);
    $('#selectedCustomerPhone').text(qo.customer.phone);
    // ছবি দেখানো
    const $wrap = $('#customerAvatarWrap');
    const photoUrl = qo.customer.photo;
    if (photoUrl) {
        $wrap.html(`<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" onerror="this.parentElement.innerHTML='<i class=\'fas fa-user\'></i>'">`);
    } else {
        $wrap.html('<i class="fas fa-user" id="customerAvatarIcon"></i>');
    }
    $('#customerInfoBar').show();
}

window.setCustomer = async function () {
closeCustomerModal();

    // Reload dresses for gender
    await loadDresses();

    // Reload dress measurements for each dress
    for (let i = 0; i < qo.dresses.length; i++) {
        const d = qo.dresses[i];
        const data = await getMeasurementsStyles(d.dressId);
        if (data) {
            qo.dresses[i].details      = data.orderDetails || data.OrderDetails || '';
            qo.dresses[i].measurements = data.measurementGroups || data.MeasurementGroups || [];
            qo.dresses[i].styles       = data.styleGroups       || data.StyleGroups       || [];
        }
    }
    saveStore();
    renderAll();
};

window.previewCustomerPhoto = function (input) {
    const $preview = $('#customerPhotoPreview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            $preview.html(`<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover">`);
        };
        reader.readAsDataURL(input.files[0]);
    } else {
        $preview.html('<i class="fas fa-user text-secondary" style="font-size:1.6rem"></i>');
    }
};

window.addNewCustomer = async function () {
    const phone   = $('#customerPhone').val().trim();
    const name    = $('#customerName').val().trim();
    const address = $('#customerAddress').val().trim();
    const gender  = $('#customerGender').val();

    if (!phone || !name) {
        showAlert(window.currentLang === 'en' ? 'Phone and name required' : 'ফোন ও নাম আবশ্যক', 'warning');
        return;
    }

    const $btn = $('#addCustomerBtn').prop('disabled', true)
        .html(`<span class="spinner-border spinner-border-sm me-1"></span>${window.currentLang === 'en' ? 'Adding...' : 'যুক্ত হচ্ছে...'}`);

    const res = await apiFetch(`/api/Customers`, {
        method: 'POST',
        body: JSON.stringify({
            CustomerName: name,
            Phone: phone,
            Address: address,
            Cloth_For_ID: +gender,
            InstitutionID: +institutionId(),
            RegistrationID: +registrationId(),
            Date: new Date().toISOString()
        })
    }).catch(() => null);

    $btn.prop('disabled', false).html(
        `<i class="fas fa-user-plus me-1"></i>${window.currentLang === 'en' ? 'Add Customer' : 'কাস্টমার যুক্ত করুন'}`);

    // success field from ApiResponse (can be "success" or "isSuccess" depending on serialization)
    if (res?.success || res?.isSuccess) {
        const newCustomerId = res.data;
        const photoUrl = `/api/Customers/${newCustomerId}/photo?institutionId=${institutionId()}`;
        qo.customer = { id: newCustomerId, clothForId: +gender, name, phone, photo: photoUrl };
        saveStore();

        // modal আগে বন্ধ করুন
        closeCustomerModal();

        // customer bar দেখান
        showCustomerBar();

        // সফল বার্তা দেখান
        showAlert(window.currentLang === 'en' ? `✅ Customer "${name}" added!` : `✅ "${name}" কাস্টমার যুক্ত হয়েছে!`, 'success');

        // ছবি থাকলে background এ upload করুন
        const photoFile = $('#customerPhoto')[0].files[0];
        if (photoFile) {
            const fd = new FormData();
            fd.append('photo', photoFile);
            fetch(`/api/Customers/${newCustomerId}/photo?institutionId=${institutionId()}`, {
                method: 'POST',
                body: fd
            }).catch(() => null);
        }

        // পোশাক লিস্ট reload করুন
        loadDresses();
    } else {
        showAlert(res?.message || (window.currentLang === 'en' ? 'Failed to add customer' : 'কাস্টমার যুক্ত করা যায়নি'), 'danger');
    }
};

/* ───────────────────────────────────────────────
   Dress List
─────────────────────────────────────────────── */
window.addDressToList = async function () {
    const sel = $('#dressSelect');
    const dressId = +sel.val();
    if (!dressId) return;
    const dressName = sel.find(':selected').data('name') || sel.find(':selected').text();

    if (qo.dresses.some(d => d.dressId === dressId)) {
        showAlert(window.currentLang === 'en' ? 'Dress already added' : 'পোশাকটি ইতিমধ্যে যুক্ত', 'warning');
        return;
    }

    try {
        const data = await getMeasurementsStyles(dressId);
        qo.dresses.push({
            dressId,
            dressName,
            quantity: 1,
            details: data?.orderDetails || data?.OrderDetails || '',
            measurements: data?.measurementGroups || data?.MeasurementGroups || [],
            styles:       data?.styleGroups       || data?.StyleGroups       || [],
            payments: []
        });
        saveStore();
        renderAll();
    } catch (err) {
        console.error('addDressToList error:', err);
        showAlert(window.currentLang === 'en' ? 'Failed to add dress. Please try again.' : 'পোশাক যুক্ত করা যায়নি। আবার চেষ্টা করুন।', 'danger');
    }
};

window.removeDress = function (idx) {
    const lang = window.currentLang === 'en';
    if (!confirm(lang ? 'Remove this dress?' : 'এই পোশাকটি বাদ দিবেন?')) return;
    qo.dresses.splice(idx, 1);
    saveStore();
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

    qo.dresses.forEach((d, i) => {
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
                           onchange="qo.dresses[${i}].details=this.value; saveStore();">
                </td>
                <td class="align-middle">
                    <button class="btn-remove-dress" onclick="removeDress(${i})" title="${lang ? 'Remove' : 'বাদ দিন'}">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            </tr>`);
    });

    $('#dressListSection').toggle(qo.dresses.length > 0);
    $('#orderSummarySection').toggle(qo.dresses.length > 0);
}

// Sync payment quantities when dress quantity changes (like old system)
window.onQuantityChange = function (idx, val) {
    const newQty = +val;
    if (newQty < 1) return;
    const d = qo.dresses[idx];
    d.quantity = newQty;

    // Update non-fabric payment quantities to match dress quantity (old behavior)
    (d.payments || []).forEach(p => {
        if (!p.fabricId && !p.FabricID) {
            p.quantity = newQty;
        }
    });

    saveStore();
    renderPaymentLists();
    updateGrandTotal();
};

function renderPaymentLists() {
    const $cont = $('#paymentListsContainer').empty();
    const lang = window.currentLang === 'en';

    qo.dresses.forEach((d, i) => {
        if (!d.payments || !d.payments.length) return;

        const count = d.payments.length;

        let rows = d.payments.map((p, pi) => {
            const isFabric = !!(p.stockQty || p.StockFabricQuantity);
            const stockQty = p.stockQty || p.StockFabricQuantity || 0;
            return `
            <tr>
                <td>
                    <span class="payment-for-label">${p.for || p.For}</span>
                    ${isFabric ? `<div class="stock-info"><i class="fas fa-boxes me-1"></i>${lang ? 'Remaining Stock:' : 'অবশিষ্ট স্টক:'} ${stockQty - p.quantity}</div>` : ''}
                </td>
                <td class="text-center" style="width:100px">
                    <input type="number" class="form-control payment-unit-input" value="${p.quantity}" min="1"
                           ${isFabric ? `max="${stockQty}"` : ''} step="0.01"
                           oninput="qo.dresses[${i}].payments[${pi}].quantity=+this.value; saveStore(); updateGrandTotal(); this.closest('tr').querySelector('.line-total').textContent='৳'+(+this.value * qo.dresses[${i}].payments[${pi}].unitPrice).toFixed(2);">
                </td>
                <td class="text-end" style="width:150px">
                    <input type="number" class="form-control payment-price-input" value="${p.unitPrice}" min="0" step="0.01"
                           oninput="qo.dresses[${i}].payments[${pi}].unitPrice=+this.value; saveStore(); updateGrandTotal(); this.closest('tr').querySelector('.line-total').textContent='৳'+(qo.dresses[${i}].payments[${pi}].quantity * +this.value).toFixed(2);">
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
    qo.activeIndex = idx;
    const d = qo.dresses[idx];
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
    const d = qo.dresses[idx];
    (d.measurements || []).forEach(group => {
        (group.Measurements || group.measurements || []).forEach(m => {
            if ((m.MeasurementTypeID || m.measurementTypeID) == typeId) {
                m.Measurement = m.measurement = val;
            }
        });
    });
    saveStore();
};

/* ───────────────────────────────────────────────
   Style Modal
─────────────────────────────────────────────── */
window.openStyle = function (idx) {
    qo.activeIndex = idx;
    const d = qo.dresses[idx];
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
    const s = qo.dresses[dressIdx].styles[groupIdx];
    const arr = s.Styles || s.styles;
    if (field === 'check') {
        arr[styleIdx].IsCheck = arr[styleIdx].isCheck = val;
        const sid = arr[styleIdx].DressStyleId || arr[styleIdx].dressStyleId;
        $(`#styleVal_${sid}`).prop('disabled', !val).val(val ? (arr[styleIdx].DressStyleMesurement || arr[styleIdx].dressStyleMesurement || '') : '');
        if (!val) arr[styleIdx].DressStyleMesurement = arr[styleIdx].dressStyleMesurement = '';
    } else {
        arr[styleIdx].DressStyleMesurement = arr[styleIdx].dressStyleMesurement = val;
    }
    saveStore();
};

/* ───────────────────────────────────────────────
   Payment Modal
─────────────────────────────────────────────── */
window.openPayment = async function (idx) {
    qo.activeIndex = idx;
    const d = qo.dresses[idx];

    // Load saved prices
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
    const idx = qo.activeIndex;
    if (idx === null) return;
    const forTxt = $('#pmtFor').val().trim();
    const amount = +$('#pmtAmount').val();
    if (!forTxt || !amount) return;

    const d = qo.dresses[idx];
    if (d.payments.some(p => (p.for || p.For || '').toLowerCase() === forTxt.toLowerCase())) {
        showAlert(window.currentLang === 'en' ? `${forTxt} already added` : `${forTxt} ইতিমধ্যে যুক্ত`, 'warning');
        return;
    }

    // Use dress quantity as payment quantity (like old system)
    d.payments.push({ for: forTxt, unitPrice: amount, quantity: d.quantity });
    saveStore();
    renderPaymentLists();
    updateGrandTotal();
    $('#pmtFor').val('');
    $('#pmtAmount').val('');
    showAlert(window.currentLang === 'en' ? `${forTxt} added` : `${forTxt} যুক্ত হয়েছে`, 'success');
};

window.removePaymentItem = function (dressIdx, pmtIdx) {
    qo.dresses[dressIdx].payments.splice(pmtIdx, 1);
    saveStore();
    renderPaymentLists();
    updateGrandTotal();
};

/* Fabric search inside payment modal */
window.searchFabricModal = async function () {
    const code = $('#fabricCodeModal').val().trim();
    if (!code) return;
    const lang = window.currentLang === 'en';
    const res = await apiFetch(`/api/ItemStock/by-code?code=${encodeURIComponent(code)}&institutionId=${institutionId()}`).catch(() => null);

    if (res?.success && res?.data) {
        const it = res.data;
        const fabricCode  = it.fabricCode  || it.FabricCode;
        const fabricName  = it.fabricName  || it.FabricName;
        const unitPrice   = it.sellingUnitPrice || it.SellingUnitPrice || 0;
        const stockQty    = it.stockQty    || it.StockQty    || it.stockFabricQuantity || it.StockFabricQuantity || 0;
        const fabricId    = it.fabricID    || it.FabricID    || it.fabricId;

        // Auto-add when found (barcode scan behavior)
        addFabricPayment(fabricCode, fabricName, unitPrice, stockQty, fabricId);
    } else {
        const msg = res?.message || (lang ? 'Item not found' : 'আইটেম পাওয়া যাচ্ছে না');
        $('#fabricResultModal').html(`<div class="alert alert-danger py-2"><i class="fas fa-times-circle me-1"></i>${msg}</div>`);
    }
};

window.addFabricPayment = function (code, name, price, stockQty, fabricId) {
    const idx = qo.activeIndex;
    if (idx === null) return;

    if (stockQty < 1) {
        showAlert(window.currentLang === 'en' ? 'Fabric not in stock' : 'কাপড় স্টকে নেই', 'warning');
        return;
    }

    const label = `Fabric Code: ${code}`;
    const d = qo.dresses[idx];

    if (d.payments.some(p => (p.for || p.For || '').toLowerCase() === label.toLowerCase())) {
        showAlert(window.currentLang === 'en' ? 'Already added' : 'ইতিমধ্যেই যুক্ত', 'warning');
        return;
    }

    // Fabric quantity is always 1 (like old system)
    d.payments.push({ for: label, unitPrice: price, quantity: 1, stockQty, fabricId, FabricID: fabricId });
    saveStore();
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
    qo.dresses.forEach(d => {
        (d.payments || []).forEach(p => { total += p.quantity * p.unitPrice; });
    });
    $('#grandTotal').text(total.toFixed(2));

    // Enforce discount limit
    const discountMax = qo.discountLimit > 0 ? (qo.discountLimit / 100) * total : total;
    $('#discountAmount').attr('max', discountMax.toFixed(2));

    updateDueAmount();
}

window.updateDueAmount = function () {
    const total    = parseFloat($('#grandTotal').text()) || 0;
    const discount = parseFloat($('#discountAmount').val()) || 0;
    const paid     = parseFloat($('#paidAmount').val()) || 0;
    const due      = total - discount - paid;
    $('#dueAmount').text(Math.max(0, due).toFixed(2));
};

/* ───────────────────────────────────────────────
   Submit Order
─────────────────────────────────────────────── */
window.submitOrder = async function () {
    if (!qo.customer.id) {
        bootstrap.Modal.getOrCreateInstance(document.getElementById('customerModal')).show();
        showAlert(window.currentLang === 'en' ? 'Please add a customer first' : 'প্রথমে কাস্টমার যুক্ত করুন', 'warning');
        return;
    }
    if (!qo.dresses.length) {
        showAlert(window.currentLang === 'en' ? 'Please add at least one dress' : 'অন্তত একটি পোশাক যুক্ত করুন', 'warning');
        return;
    }

    const deliveryDate = $('#deliveryDate').val();
    if (!deliveryDate) {
        showAlert(window.currentLang === 'en' ? 'Please set delivery date' : 'ডেলিভারির তারিখ দিন', 'warning');
        return;
    }

    const total    = parseFloat($('#grandTotal').text()) || 0;
    const discount = parseFloat($('#discountAmount').val()) || 0;
    const paid     = parseFloat($('#paidAmount').val()) || 0;
    const accountId = +$('#paymentMethodSelect').val() || 0;

    // If no account selected, try to use default
    let finalAccountId = accountId;
    if (!finalAccountId) {
        const defaultAcc = qo.paymentMethods.find(m => m.Default_Status || m.default_Status || m.IsDefault || m.isDefault);
        if (defaultAcc) finalAccountId = defaultAcc.AccountID || defaultAcc.accountID || defaultAcc.accountId || 0;
    }

    // Build OrderList — match format expected by old system / API
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

    const OrderList = qo.dresses.map(d => ({
        DressId: d.dressId,
        DressQuantity: d.quantity,
        Details: d.details || '',
        ListMeasurement: flatMeasurements(d.measurements),
        ListStyle: flatStyles(d.styles),
        ListPayment: JSON.stringify((d.payments || []).map(p => ({
            For: p.for || p.For,
            Unit_Price: p.unitPrice,
            Quantity: p.quantity,
            FabricID: p.fabricId || p.FabricID || null
        })))
    }));

    const model = {
        OrderSn: qo.orderNumber ? String(qo.orderNumber) : '',
        ClothForId: qo.customer.clothForId,
        CustomerId: qo.customer.id,
        InstitutionId: +institutionId(),
        RegistrationId: +registrationId(),
        OrderAmount: total,
        Discount: discount,
        PaidAmount: paid,
        AccountId: finalAccountId,
        DeliveryDate: deliveryDate,
        OrderList
    };

    const btn = $('#submitOrderBtn').prop('disabled', true)
        .html(`<span class="spinner-border spinner-border-sm me-2"></span>${window.currentLang === 'en' ? 'Submitting...' : 'সাবমিট হচ্ছে...'}`);

    const res = await apiFetch('/api/Orders/quick-order', {
        method: 'POST',
        body: JSON.stringify(model)
    }).catch(() => null);

    if (res?.success || res?.data) {
        localStorage.removeItem(STORE_KEY);
        const orderId = res.data?.orderId || res.data;
        location.href = `/money-receipt.html?orderId=${orderId}`;
    } else {
        showAlert(res?.message || (window.currentLang === 'en' ? 'Failed to submit order' : 'অর্ডার সাবমিট করা যায়নি'), 'danger');
        btn.prop('disabled', false).html(
            `<i class="fas fa-check-circle me-2"></i>${window.currentLang === 'en' ? 'Submit Order' : 'অর্ডার সাবমিট করুন'}`);
    }
};

/* ───────────────────────────────────────────────
   Helpers
─────────────────────────────────────────────── */
function closeCustomerModal() {
    const modalEl = document.getElementById('customerModal');
    // Always forcefully remove modal DOM state first (works regardless of Bootstrap instance)
    $(modalEl).removeClass('show').attr('aria-hidden', 'true').removeAttr('aria-modal').css('display', 'none');
    $('body').removeClass('modal-open').css('padding-right', '');
    $('.modal-backdrop').remove();
    // Also dispose Bootstrap instance so it can be re-initialized fresh next time
    const inst = bootstrap.Modal.getInstance(modalEl);
    if (inst) inst.dispose();
}

function showAlert(msg, type = 'info') {
    const $a = $(`<div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${msg}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`);
    $('#alertContainer').prepend($a);
    setTimeout(() => $a.alert('close'), 3500);
}
