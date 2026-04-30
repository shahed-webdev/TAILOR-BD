// Global variables
let orderData = {
    orderId: null,
    customerId: null,
    customerName: '',
    customerPhone: '',
    customerNumber: '',
    customerAddress: '',
    clothForId: null,
    orderNumber: '',
    discount: 0,
    paidAmount: 0,
    previousPaid: 0
};

let orderItems = []; // Array of dress items with measurements, styles, payments
let allDresses = [];
let currentEditingIndex = null;
let deletedOrderListIds = [];
let deletedOrderPaymentIds = [];

// API Configuration
const API_BASE_URL = '/api/orders';
let institutionId = null;
let registrationId = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Get session data from sessionStorage
    institutionId = sessionStorage.getItem('institutionId');
    registrationId = sessionStorage.getItem('registrationId');
    const username = sessionStorage.getItem('username');

    console.log('Session data:', { institutionId, registrationId, username });

    if (!institutionId || !registrationId || !username) {
        alert('অনুগ্রহ করে প্রথমে লগইন করুন');
        window.location.href = '/login.html';
        return;
    }

    // Get OrderID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('OrderID') || urlParams.get('orderId');

    if (!orderId) {
        alert('অর্ডার আইডি পাওয়া যায়নি');
        window.location.href = '/order-list.html';
        return;
    }

    orderData.orderId = parseInt(orderId);
    
    // Clear previous data on page load to avoid stale data
    orderItems = [];
    deletedOrderListIds = [];
    deletedOrderPaymentIds = [];
    currentEditingIndex = null;
    
    loadOrderDetails();
});

// Utility Functions
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function showAlert(message, type = 'danger') {
    const alertSection = document.getElementById('alertSection');
    alertSection.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

// Load Full Order Details with OrderList items
async function loadOrderDetails() {
    showLoading();
    try {
        // Use the by-order-id endpoint to get order by OrderID directly
        console.log('🔍 Fetching order using by-order-id API for OrderID:', orderData.orderId);
        
        const orderUrl = `/api/orders/by-order-id/${orderData.orderId}?institutionId=${institutionId}`;
        console.log('🔍 Order URL:', orderUrl);
        
        const response = await fetch(orderUrl);
        
        if (!response.ok) {
            console.error('❌ API returned error:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error details:', errorText);
            alert('অর্ডার লোড করতে ব্যর্থ হয়েছে। Status: ' + response.status);
            window.location.href = '/order-list.html';
            return;
        }
        
        const result = await response.json();

        console.log('Order response:', result);

        if (result.success && result.data) {
            const data = result.data;
            
            // Set basic order data - FIXED: Properly calculate previousPaid
            orderData.orderId = data.orderID;
            orderData.customerId = data.customerID;
            orderData.customerName = data.customerName;
            orderData.customerPhone = data.phone;
            orderData.clothForId = data.clothForID;
            orderData.orderNumber = data.orderSerialNumber;
            orderData.discount = parseFloat(data.discount) || 0;
            orderData.paidAmount = parseFloat(data.paidAmount) || 0;
            // FIXED: Calculate previousPaid correctly
            orderData.previousPaid = orderData.paidAmount + orderData.discount;

            console.log('💰 Order financial data:', {
                paidAmount: orderData.paidAmount,
                discount: orderData.discount,
                previousPaid: orderData.previousPaid
            });

            // Update UI
            document.getElementById('orderNumber').textContent = data.orderSerialNumber;
            document.getElementById('customerName').textContent = data.customerName;
            document.getElementById('customerPhone').textContent = data.phone || 'N/A';

            // FIXED: Update header displays immediately
            updatePreviousPaid();

            // Enable delete button only if no payment made
            const btnDelete = document.getElementById('btnDeleteOrder');
            if (orderData.paidAmount > 0) {
                btnDelete.disabled = true;
                btnDelete.title = 'পেমেন্ট থাকলে ডিলিট করা হবে না';
            }

            // Now load the full order list with dress details
            await loadOrderListItems();
            
            // Load dresses for adding new ones
            await loadDresses();
        } else {
            console.error('Failed to load order:', result);
            alert('অর্ডার লোড করতে ব্যর্থ হয়েছে');
            window.location.href = '/order-list.html';
        }
    } catch (error) {
        console.error('Error loading order:', error);
        alert('অর্ডার লোড করতে সমস্যা হয়েছে: ' + error.message);
        window.location.href = '/order-list.html';
    } finally {
        hideLoading();
    }
}

// Load Order List Items - use existing .NET 8 API endpoints
async function loadOrderListItems() {
    try {
        console.log('🔍 Loading order list items for orderId:', orderData.orderId);
        
        // Call API to get OrderList items directly
        const response = await fetch(`${API_BASE_URL}/${orderData.orderId}/items?institutionId=${institutionId}`);
        
        if (!response.ok) {
            console.error('❌ API returned error:', response.status);
            // Fallback: render empty and let user add dresses manually
            console.log('⚠️ No existing order items, user can add new dresses');
            return;
        }
        
        const result = await response.json();
        console.log('📦 Order list items API response:', result);

        if (result.success && result.data && result.data.length > 0) {
            console.log(`✅ Found ${result.data.length} order list items`);
            
            // Process each OrderList item
            for (const orderListItem of result.data) {
                console.log(`📋 Processing OrderList item:`, {
                    orderListId: orderListItem.orderListID,
                    dressId: orderListItem.dressID,
                    dressName: orderListItem.dress_Name,
                    quantity: orderListItem.dressQuantity
                });
                
                // FIXED: Load measurements and styles for this OrderList item
                let measurements = [];
                let styles = [];
                
                try {
                    // Get measurements and styles from dress-details API
                    const detailsResponse = await fetch(`/api/measurements/dress-details?dressId=${orderListItem.dressID}&customerId=${orderData.customerId}&institutionId=${institutionId}&orderListId=${orderListItem.orderListID}`);
                    
                    if (detailsResponse.ok) {
                        const detailsResult = await detailsResponse.json();
                        console.log(`  📦 Dress details for OrderListID ${orderListItem.orderListID}:`, detailsResult);
                        
                        if (detailsResult.success && detailsResult.data) {
                            measurements = detailsResult.data.measurements || [];
                            styles = detailsResult.data.styles || [];
                            
                            console.log(`  📏 Loaded ${measurements.length} measurement groups`);
                            console.log(`  🎨 Loaded ${styles.length} style groups`);
                        }
                    }
                } catch (detailsError) {
                    console.error('⚠️ Error loading measurements/styles:', detailsError);
                }
                
                // Get payments for this OrderList item
                let payments = [];
                try {
                    const paymentsResponse = await fetch(`${API_BASE_URL}/${orderData.orderId}/order-list/${orderListItem.orderListID}/payments?institutionId=${institutionId}`);
                    console.log(`  📡 Fetching payments from: ${API_BASE_URL}/${orderData.orderId}/order-list/${orderListItem.orderListID}/payments?institutionId=${institutionId}`);
                    
                    if (paymentsResponse.ok) {
                        const paymentsResult = await paymentsResponse.json();
                        console.log(`  📦 Payments API Result:`, paymentsResult);
                        
                        if (paymentsResult.success && paymentsResult.data) {
                            console.log(`  📦 Raw payment data:`, paymentsResult.data);
                            payments = paymentsResult.data.map((p, pIdx) => {
                                console.log(`    Payment ${pIdx}:`, {
                                    orderPaymentID: p.orderPaymentID,
                                    details: p.details,
                                    unit: p.unit,
                                    unitPrice: p.unitPrice,
                                    amount: p.amount
                                });
                                
                                return {
                                    OrderPaymentId: p.orderPaymentID,
                                    For: p.details || '',
                                    Quantity: parseFloat(p.unit) || 1,
                                    UnitPrice: parseFloat(p.unitPrice) || 0,
                                    Amount: parseFloat(p.amount) || 0
                                };
                            });
                            console.log(`  ✅ Mapped ${payments.length} payments:`, payments);
                        } else {
                            console.warn(`  ⚠️ Payments API returned unsuccessful or no data`);
                        }
                    } else {
                        console.warn(`  ⚠️ Payments API returned status: ${paymentsResponse.status}`);
                    }
                } catch (paymentError) {
                    console.error('⚠️ Error loading payments:', paymentError);
                }
                
                console.log(`  💰 Found ${payments.length} payments, total: ৳${payments.reduce((sum, p) => sum + p.Amount, 0)}`);
                
                // Add to orderItems array
                orderItems.push({
                    dress: {
                        dressId: orderListItem.dressID,
                        dressName: orderListItem.dress_Name
                    },
                    orderListId: orderListItem.orderListID,
                    orderDetails: orderListItem.details || '',
                    quantity: orderListItem.dressQuantity,
                    measurements: measurements,
                    styles: styles,
                    payments: payments
                });
            }

            console.log('✅ Total order items loaded:', orderItems.length);
            
            // Render items
            if (orderItems.length > 0) {
                console.log('🎨 Rendering order items...');
                renderOrderItems();
            }
        } else {
            console.log('⚠️ No order items found in response, user can add new dresses');
        }
    } catch (error) {
        console.error('💥 Error loading order list items:', error);
        console.log('⚠️ Will allow user to add dresses manually');
    }
}

// Load Dresses
async function loadDresses() {
    try {
        console.log('🔍 Loading dresses for clothForId:', orderData.clothForId);
        
        const response = await fetch(`/api/dress/list?institutionId=${institutionId}&clothForId=${orderData.clothForId}`);
        const result = await response.json();

        console.log('👗 Dresses API response:', result);

        if (result.success && result.data) {
            allDresses = result.data;
            
            console.log(`✅ Loaded ${allDresses.length} dresses`);
            
            // Match dress IDs to existing order items by name
            let matchedCount = 0;
            orderItems.forEach(item => {
                if (item.dress.dressId === 0 && item.dress.dressName) {
                    const dressNameLower = item.dress.dressName.toLowerCase().trim();
                    console.log(`  🔎 Trying to match: "${dressNameLower}"`);
                    
                    const matchedDress = allDresses.find(d => {
                        const dressListName = (d.Dress_Name || d.dress_Name || '').toLowerCase().trim();
                        const isMatch = dressListName === dressNameLower;
                        if (isMatch) {
                            console.log(`    ✅ MATCHED with: "${d.Dress_Name || d.dress_Name}" (ID: ${d.DressID || d.dressID})`);
                        }
                        return isMatch;
                    });
                    
                    if (matchedDress) {
                        item.dress.dressId = matchedDress.DressID || matchedDress.dressID;
                        matchedCount++;
                        console.log(`✅ Matched dress: ${item.dress.dressName} -> ID: ${matchedDress.DressID || matchedDress.dressID}`);
                    } else {
                        console.warn(`⚠️ NO MATCH FOUND for: ${item.dress.dressName}`);
                        console.log('  Available dresses:', allDresses.map(d => d.Dress_Name || d.dress_Name).join(', '));
                    }
                }
            });
            
            console.log(`✅ Matched ${matchedCount} of ${orderItems.length} dresses`);
            
            // Populate dropdown
            const dressSelect = document.getElementById('dressSelect');
            
            if (!dressSelect) {
                console.error('❌ ERROR: dressSelect element not found!');
                return;
            }
            
            console.log('✅ Found dressSelect element');
            
            dressSelect.innerHTML = '<option value="">[ পোশাক নির্বাচন করুন ]</option>';
            
            allDresses.forEach(dress => {
                const option = document.createElement('option');
                option.value = dress.DressID || dress.dressID;
                option.textContent = dress.Dress_Name || dress.dress_Name;
                if (dress.IsMeasurementAvailable || dress.isMeasurementAvailable) {
                    option.classList.add('text-success');
                }
                dressSelect.appendChild(option);
            });

            console.log('✅ Dropdown populated with', allDresses.length, 'options');
            console.log('   Dropdown HTML:', dressSelect.innerHTML.substring(0, 200));
            
            dressSelect.disabled = false;
            console.log('✅ Dropdown enabled, disabled =', dressSelect.disabled);
            
            const btnAddDress = document.getElementById('btnAddDress');
            if (btnAddDress) {
                btnAddDress.disabled = false;
                console.log('✅ Add button enabled');
            } else {
                console.error('❌ btnAddDress not found');
            }
            
            // Re-render items with updated dress IDs
            if (orderItems.length > 0) {
                console.log('🔄 Re-rendering items with matched dress IDs...');
                renderOrderItems();
            }
        } else {
            console.error('❌ Failed to load dresses:', result);
        }
    } catch (error) {
        console.error('💥 Error loading dresses:', error);
    }
}

// Add Dress to List
async function addDressToList() {
    const dressSelect = document.getElementById('dressSelect');
    const dressId = parseInt(dressSelect.value);

    if (!dressId) {
        alert('অনুগ্রহ করে একটি পোশাক নির্বাচন করুন');
        return;
    }

    // Check if already added
    if (orderItems.some(item => item.dress.dressId === dressId)) {
        alert('এই পোশাকটি ইতিমধ্যে যুক্ত করা হয়েছে');
        return;
    }

    showLoading();
    try {
        // Get dress details
        const dress = allDresses.find(d => (d.DressID || d.dressID) === dressId);
        
        // FIXED: Load measurements and styles for the customer
        const response = await fetch(`/api/measurements/dress-details?dressId=${dressId}&customerId=${orderData.customerId}&institutionId=${institutionId}`);
        const result = await response.json();

        console.log('🎨 Dress details loaded for new dress:', result);

        if (result.success && result.data) {
            const dressData = result.data;
            
            // FIXED: Properly load measurements and styles
            orderItems.push({
                dress: {
                    dressId: dress.DressID || dress.dressID,
                    dressName: dress.Dress_Name || dress.dress_Name
                },
                orderListId: null, // New item, no orderListId yet
                orderDetails: dressData.orderDetails || '',
                quantity: 1,
                measurements: dressData.measurements || [],
                styles: dressData.styles || [],
                payments: []
            });

            console.log('✅ Added dress with measurements:', dressData.measurements?.length || 0);
            console.log('✅ Added dress with styles:', dressData.styles?.length || 0);

            renderOrderItems();
            dressSelect.value = '';
        } else {
            // If no customer-specific data, add with empty arrays
            orderItems.push({
                dress: {
                    dressId: dress.DressID || dress.dressID,
                    dressName: dress.Dress_Name || dress.dress_Name
                },
                orderListId: null,
                orderDetails: '',
                quantity: 1,
                measurements: [],
                styles: [],
                payments: []
            });
            
            renderOrderItems();
            dressSelect.value = '';
            
            console.log('⚠️ No measurements/styles found, added dress with empty arrays');
        }
    } catch (error) {
        console.error('Error adding dress:', error);
        alert('পোশাক যুক্ত করতে সমস্যা হয়েছে');
    } finally {
        hideLoading();
    }
}

// Render Order Items
function renderOrderItems() {
    const container = document.getElementById('orderItemsContainer');
    
    if (!container) {
        console.error('❌ orderItemsContainer element not found!');
        return;
    }
    
    if (orderItems.length === 0) {
        const lang = window.currentLang || 'bn';
        const emptyText = lang === 'en' ? 'No dresses added' : 'কোন পোশাক যুক্ত করা হয়নি';
        const helpText = lang === 'en' ? 'Add dresses from "Add New Dress" section above' : 'উপরের "নতুন পোশাক যুক্ত করুন" থেকে পোশাক যুক্ত করুন';
        
        container.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="fas fa-box-open fa-3x mb-3"></i>
                <p>${emptyText}</p>
                <p class="small">${helpText}</p>
            </div>
        `;
        
        const summarySection = document.getElementById('summarySection');
        if (summarySection) {
            summarySection.style.display = 'none';
        }
        return;
    }

    container.innerHTML = '';
    orderItems.forEach((item, index) => {
        const dressDiv = document.createElement('div');
        dressDiv.className = 'dress-item mb-3';
        
        // Calculate dress total from payments
        let dressTotal = 0;
        if (item.payments && item.payments.length > 0) {
            dressTotal = item.payments.reduce((sum, p) => sum + (p.Amount || (p.Quantity * p.UnitPrice)), 0);
        }
        
        const lang = window.currentLang || 'bn';
        const quantityLabel = lang === 'en' ? 'Quantity' : 'পরিমাণ';
        const detailsLabel = lang === 'en' ? 'Details' : 'বিস্তারিত';
        const detailsPlaceholder = lang === 'en' ? 'Dress details...' : 'পোশাক সম্পর্কে বিস্তারিত...';
        const editMeasurementBtn = lang === 'en' ? 'Edit Measurement' : 'মাপ সম্পাদনা';
        const editStyleBtn = lang === 'en' ? 'Edit Style' : 'স্টাইল সম্পাদনা';
        const editPaymentBtn = lang === 'en' ? 'Edit Payment' : 'পেমেন্ট সম্পাদনা';
        const deleteBtn = lang === 'en' ? 'Delete' : 'মুছুন';
        const totalLabel = lang === 'en' ? 'Total:' : 'মোট:';
        const quantityText = lang === 'en' ? 'Quantity:' : 'পরিমাণ:';
        const paymentListLabel = lang === 'en' ? 'Payment List:' : 'পেমেন্ট তালিকা:';
        
        dressDiv.innerHTML = `
            <div class="card">
                <div class="card-header bg-light">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-0">
                                <span class="badge bg-primary me-2">${index + 1}</span>
                                ${item.dress.dressName}
                            </h6>
                        </div>
                        <div>
                            ${dressTotal > 0 ? `<span class="badge bg-success me-2">${totalLabel} ৳${dressTotal.toFixed(2)}</span>` : ''}
                            <span class="badge bg-info">${quantityText} ${item.quantity}</span>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row g-2">
                        <!-- Quantity Edit -->
                        <div class="col-md-3">
                            <label class="form-label small">${quantityLabel}</label>
                            <input type="number" class="form-control" min="1" value="${item.quantity}" 
                                   onchange="updateQuantity(${index}, this.value)">
                        </div>
                        
                        <!-- Details Edit -->
                        <div class="col-md-9">
                            <label class="form-label small">${detailsLabel}</label>
                            <input type="text" class="form-control" value="${item.orderDetails || ''}" 
                                   placeholder="${detailsPlaceholder}"
                                   onchange="updateDetails(${index}, this.value)">
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="mt-3 d-flex gap-2">
                        <button class="btn btn-outline-primary btn-sm" onclick="openMeasurementModal(${index})">
                            <i class="fas fa-ruler me-1"></i>${editMeasurementBtn}
                        </button>
                        <button class="btn btn-outline-success btn-sm" onclick="openStyleModal(${index})">
                            <i class="fas fa-paint-brush me-1"></i>${editStyleBtn}
                        </button>
                        <button class="btn btn-outline-info btn-sm" onclick="openPaymentModal(${index})">
                            <i class="fas fa-money-bill me-1"></i>${editPaymentBtn}
                            ${item.payments && item.payments.length > 0 ? `<span class="badge bg-info ms-1">${item.payments.length}</span>` : ''}
                        </button>
                        <button class="btn btn-outline-danger btn-sm ms-auto" onclick="deleteOrderItem(${index})">
                            <i class="fas fa-trash me-1"></i>${deleteBtn}
                        </button>
                    </div>
                    
                    <!-- Payment List -->
                    ${item.payments && item.payments.length > 0 ? `
                        <div class="mt-3">
                            <small class="text-muted fw-bold">${paymentListLabel}</small>
                            <ul class="list-group list-group-flush mt-2">
                                ${item.payments.map(p => `
                                    <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                                        <span>${p.For}</span>
                                        <span>
                                            <span class="badge bg-secondary">${p.Quantity} × ৳${p.UnitPrice}</span>
                                            <span class="badge bg-success ms-1">৳${(p.Quantity * p.UnitPrice).toFixed(2)}</span>
                                        </span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        container.appendChild(dressDiv);
    });
    
    const summarySection = document.getElementById('summarySection');
    if (summarySection) {
        summarySection.style.display = 'block';
    }
    updatePreviousPaid();
}

// Update Quantity
function updateQuantity(index, newQuantity) {
    const quantity = parseInt(newQuantity);
    if (quantity > 0) {
        orderItems[index].quantity = quantity;
        console.log('✏️ Updated quantity:', orderItems[index].dress.dressName, '=', quantity);
        renderOrderItems(); // Re-render to update payments if quantity changed
    }
}

// Update Details
function updateDetails(index, newDetails) {
    orderItems[index].orderDetails = newDetails;
    console.log('✏️ Updated details:', orderItems[index].dress.dressName, '=', newDetails);
}

// Update Previous Paid Display
function updatePreviousPaid() {
    const prevPaidHeaderEl = document.getElementById('previousPaidHeader');
    const prevPaidEl = document.getElementById('previousPaid');
    const discountHeaderEl = document.getElementById('discountHeader');
    
    // FIXED: Always update with current values
    if (prevPaidHeaderEl) {
        prevPaidHeaderEl.textContent = `৳${orderData.paidAmount.toFixed(2)}`;
        console.log('✅ Updated previousPaidHeader:', orderData.paidAmount);
    }
    
    if (prevPaidEl) {
        prevPaidEl.textContent = `৳${orderData.previousPaid.toFixed(2)}`;
        console.log('✅ Updated previousPaid:', orderData.previousPaid);
    }
    
    if (discountHeaderEl) {
        discountHeaderEl.textContent = `৳${orderData.discount.toFixed(2)}`;
        console.log('✅ Updated discountHeader:', orderData.discount);
    }
}

// Open Payment Modal
function openPaymentModal(index) {
    console.log('💰 Opening payment modal for dress index:', index);
    
    currentEditingIndex = index;
    const item = orderItems[index];
    
    console.log('📦 Dress item:', {
        dressName: item.dress.dressName,
        paymentsCount: item.payments?.length || 0
    });
    
    // FIXED: Add null check before setting textContent
    const modalTitle = document.getElementById('modalPaymentDressName');
    if (modalTitle) {
        modalTitle.textContent = item.dress.dressName + ' - পেমেন্ট';
    }
    
    // Reset form
    document.getElementById('addPaymentForm').reset();
    document.getElementById('paymentQuantity').value = item.quantity; // Default to dress quantity
    
    // Render payments list
    renderPaymentsList();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('paymentModal'));
    modal.show();
}

// Render Payments List
function renderPaymentsList() {
    if (currentEditingIndex === null) return;
    
    const item = orderItems[currentEditingIndex];
    const container = document.getElementById('paymentsListContainer');
    
    console.log('💰 renderPaymentsList called for item:', item.dress.dressName);
    console.log('💰 Current payments:', item.payments);
    
    if (!item.payments || item.payments.length === 0) {
        container.innerHTML = '<p class="text-center text-muted py-3">কোন পেমেন্ট নেই</p>';
        return;
    }
    
    let total = 0;
    const paymentsHTML = item.payments.map((payment, idx) => {
        // FIXED: Use Amount if available, otherwise calculate
        const lineTotal = payment.Amount || (payment.Quantity * payment.UnitPrice);
        total += lineTotal;
        
        console.log(`  Payment ${idx}:`, {
            For: payment.For,
            Quantity: payment.Quantity,
            UnitPrice: payment.UnitPrice,
            Amount: payment.Amount,
            lineTotal: lineTotal,
            OrderPaymentId: payment.OrderPaymentId
        });
        
        return `
            <div class="payment-list-item mb-2 p-3 border rounded" data-payment-index="${idx}">
                <div class="row align-items-center">
                    <div class="col-md-4">
                        <strong>${payment.For}</strong>
                    </div>
                    <div class="col-md-2 text-center">
                        <input type="number" class="form-control form-control-sm payment-quantity-input" 
                               value="${payment.Quantity}" min="1" step="0.01"
                               data-payment-index="${idx}">
                    </div>
                    <div class="col-md-2 text-center">
                        <input type="number" class="form-control form-control-sm payment-price-input" 
                               value="${payment.UnitPrice}" min="0" step="0.01"
                               data-payment-index="${idx}">
                    </div>
                    <div class="col-md-3 text-end">
                        <span class="badge bg-success">৳${lineTotal.toFixed(2)}</span>
                    </div>
                    <div class="col-md-1 text-end">
                        <button class="btn btn-sm btn-outline-danger payment-delete-btn" data-payment-index="${idx}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = `
        <div class="mb-2 p-2 bg-light rounded">
            <div class="row fw-bold small">
                <div class="col-md-4">বিবরণ</div>
                <div class="col-md-2 text-center">পরিমাণ</div>
                <div class="col-md-2 text-center">একক মূল্য</div>
                <div class="col-md-3 text-end">মোট</div>
                <div class="col-md-1"></div>
            </div>
        </div>
        ${paymentsHTML}
        <div class="mt-3 p-3 bg-primary text-white rounded">
            <div class="row">
                <div class="col text-end">
                    <h5 class="mb-0">সর্বমোট: ৳${total.toFixed(2)}</h5>
                </div>
            </div>
        </div>
    `;
    
    console.log('✅ Total payments amount:', total);
    
    // Add event listeners using event delegation - use setTimeout to ensure DOM is ready
    setTimeout(() => {
        container.querySelectorAll('.payment-quantity-input').forEach(input => {
            input.addEventListener('change', function(e) {
                e.stopPropagation();
                const idx = parseInt(this.getAttribute('data-payment-index'));
                const newValue = parseFloat(this.value);
                console.log('💰 Quantity changed:', idx, newValue);
                if (!isNaN(newValue) && newValue > 0) {
                    updatePaymentQuantity(idx, newValue);
                }
            });
            
            // Also add input event for real-time update
            input.addEventListener('input', function(e) {
                e.stopPropagation();
            });
        });
        
        container.querySelectorAll('.payment-price-input').forEach(input => {
            input.addEventListener('change', function(e) {
                e.stopPropagation();
                const idx = parseInt(this.getAttribute('data-payment-index'));
                const newValue = parseFloat(this.value);
                console.log('💰 Price changed:', idx, newValue);
                if (!isNaN(newValue) && newValue >= 0) {
                    updatePaymentPrice(idx, newValue);
                }
            });
            
            // Also add input event for real-time update
            input.addEventListener('input', function(e) {
                e.stopPropagation();
            });
        });
        
        container.querySelectorAll('.payment-delete-btn').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                const idx = parseInt(this.getAttribute('data-payment-index'));
                console.log('🗑️ Delete clicked:', idx);
                deletePayment(idx);
            });
        });
        
        console.log('✅ Event listeners attached to', container.querySelectorAll('.payment-quantity-input').length, 'payment inputs');
    }, 100);
}

// Add Payment
function addPayment(event) {
    event.preventDefault();
    
    if (currentEditingIndex === null) return;
    
    const paymentFor = document.getElementById('paymentFor').value.trim();
    const quantity = parseFloat(document.getElementById('paymentQuantity').value);
    const unitPrice = parseFloat(document.getElementById('paymentUnitPrice').value);
    
    if (!paymentFor || quantity <= 0 || unitPrice < 0) {
        alert('অনুগ্রহ করে সকল তথ্য সঠিকভাবে পূরণ করুন');
        return;
    }
    
    const item = orderItems[currentEditingIndex];
    
    // Check if payment already exists
    if (item.payments && item.payments.some(p => p.For.toLowerCase() === paymentFor.toLowerCase())) {
        alert('এই বিবরণের পেমেন্ট ইতিমধ্যে যোগ করা হয়েছে');
        return;
    }
    
    // Add new payment
    if (!item.payments) {
        item.payments = [];
    }
    
    // FIXED: Ensure proper calculation
    const calculatedAmount = quantity * unitPrice;
    
    item.payments.push({
        OrderPaymentId: null, // New payment
        For: paymentFor,
        Quantity: quantity,
        UnitPrice: unitPrice,
        Amount: calculatedAmount
    });
    
    console.log('✅ Payment added:', paymentFor, quantity, 'x', unitPrice, '=', calculatedAmount);
    
    // Reset form and re-render
    document.getElementById('addPaymentForm').reset();
    document.getElementById('paymentQuantity').value = item.quantity;
    renderPaymentsList();
    renderOrderItems(); // Update main view
}

// Update Payment Quantity
function updatePaymentQuantity(paymentIndex, newQuantity) {
    if (currentEditingIndex === null) return;
    
    const quantity = parseFloat(newQuantity);
    if (quantity > 0) {
        const payment = orderItems[currentEditingIndex].payments[paymentIndex];
        
        // If it's an existing payment, mark the old one for deletion
        // and create a new payment entry
        if (payment.OrderPaymentId) {
            deletedOrderPaymentIds.push(payment.OrderPaymentId);
            console.log('🗑️ Marked old payment for deletion:', payment.OrderPaymentId);
            payment.OrderPaymentId = null; // Make it a "new" payment
        }
        
        payment.Quantity = quantity;
        // FIXED: Ensure proper recalculation
        payment.Amount = quantity * payment.UnitPrice;
        
        console.log('✏️ Updated payment quantity:', payment.For, '=', quantity, 'Amount:', payment.Amount);
        renderPaymentsList();
        renderOrderItems();
    }
}

// Update Payment Price
function updatePaymentPrice(paymentIndex, newPrice) {
    if (currentEditingIndex === null) return;
    
    const price = parseFloat(newPrice);
    if (price >= 0) {
        const payment = orderItems[currentEditingIndex].payments[paymentIndex];
        
        // If it's an existing payment, mark the old one for deletion
        // and create a new payment entry
        if (payment.OrderPaymentId) {
            deletedOrderPaymentIds.push(payment.OrderPaymentId);
            console.log('🗑️ Marked old payment for deletion:', payment.OrderPaymentId);
            payment.OrderPaymentId = null; // Make it a "new" payment
        }
        
        payment.UnitPrice = price;
        // FIXED: Ensure proper recalculation
        payment.Amount = payment.Quantity * price;
        
        console.log('✏️ Updated payment price:', payment.For, '=', price, 'Amount:', payment.Amount);
        renderPaymentsList();
        renderOrderItems();
    }
}

// Delete Payment
function deletePayment(paymentIndex) {
    if (currentEditingIndex === null) return;
    
    const item = orderItems[currentEditingIndex];
    const payment = item.payments[paymentIndex];
    
    if (!confirm(`"${payment.For}" পেমেন্ট মুছে ফেলবেন?`)) {
        return;
    }
    
    // If it's an existing payment, mark it for deletion
    if (payment.OrderPaymentId) {
        deletedOrderPaymentIds.push(payment.OrderPaymentId);
        console.log('🗑️ Marked payment for deletion:', payment.OrderPaymentId);
    }
    
    // Remove from array
    item.payments.splice(paymentIndex, 1);
    
    console.log('✅ Payment deleted:', payment.For);
    renderPaymentsList();
    renderOrderItems();
}

// Export renderOrderItems globally for language switcher
window.renderOrderItems = renderOrderItems;
