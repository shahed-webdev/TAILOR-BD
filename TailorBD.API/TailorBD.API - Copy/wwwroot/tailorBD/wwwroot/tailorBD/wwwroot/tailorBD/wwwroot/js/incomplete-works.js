// Incomplete Works JavaScript
let selectedOrders = new Map();
let currentInstitutionId = null;
let currentRegistrationId = null;

// Constants
const API_BASE_URL = '/api/delivery';
const ITEMS_PER_PAGE = 25;

// State
let currentPage = 1;
let totalCount = 0;
let currentFilters = {};
let currentLanguage = localStorage.getItem('language') || 'bn';

// Autocomplete Search History
const SEARCH_HISTORY_KEY = 'incompleteWorkSearchHistory';
const MAX_HISTORY_ITEMS = 10;

// Load search history from localStorage
function loadSearchHistory() {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : {
        mobileNo: [],
        customerName: [],
        orderNo: [],
        address: []
    };
}

// Save search history to localStorage
function saveSearchHistory(history) {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
}

// Add search term to history
function addToSearchHistory(field, value) {
    if (!value || value.trim() === '') return;
    
    console.log(`Adding to history - Field: ${field}, Value: ${value}`);
    
    const history = loadSearchHistory();
    const trimmedValue = value.trim();
    
    // Remove if already exists
    history[field] = history[field].filter(item => item !== trimmedValue);
    
    // Add to beginning
    history[field].unshift(trimmedValue);
    
    // Keep only MAX_HISTORY_ITEMS
    if (history[field].length > MAX_HISTORY_ITEMS) {
        history[field] = history[field].slice(0, MAX_HISTORY_ITEMS);
    }
    
    saveSearchHistory(history);
    updateAutocompleteList(field, history[field]);
    
    console.log(`Updated history for ${field}:`, history[field]);
}

// Real-time autocomplete from API
async function setupRealtimeAutocomplete() {
    console.log('Setting up realtime autocomplete...');
    
    // Mobile Number autocomplete
    $('#mobileNo').on('input', debounce(async function() {
        const value = $(this).val();
        if (value.length >= 3) {
            await fetchSuggestions('phone', value, 'mobileNoList');
        }
    }, 300));
    
    // Customer Name autocomplete
    $('#customerName').on('input', debounce(async function() {
        const value = $(this).val();
        if (value.length >= 2) {
            await fetchSuggestions('customerName', value, 'customerNameList');
        }
    }, 300));
    
    // Order Number autocomplete
    $('#orderNo').on('input', debounce(async function() {
        const value = $(this).val().trim();
        if (value.length >= 1) {
            await fetchSuggestions('orderNo', value, 'orderNoList');
        }
    }, 300));

    // Show order number suggestions on focus
    $('#orderNo').on('focus', async function() {
        const value = $(this).val().trim();
        if (value.length >= 1) {
            await fetchSuggestions('orderNo', value, 'orderNoList');
        }
    });
    
    // Address autocomplete
    $('#address').on('input', debounce(async function() {
        const value = $(this).val();
        if (value.length >= 2) {
            await fetchSuggestions('address', value, 'addressList');
        }
    }, 300));
    
    console.log('Realtime autocomplete setup complete');
}

// Fetch suggestions from API
async function fetchSuggestions(field, searchTerm, datalistId) {
    try {
        const response = await fetch(`/api/Delivery/search-suggestions?field=${field}&term=${encodeURIComponent(searchTerm)}&institutionId=${currentInstitutionId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
            const datalist = document.getElementById(datalistId);
            if (datalist) {
                datalist.innerHTML = '';
                result.data.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item;
                    datalist.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error fetching suggestions:', error);
    }
}

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Update autocomplete datalist
function updateAutocompleteList(field, items) {
    const datalistId = field + 'List';
    const datalist = document.getElementById(datalistId);
    
    if (!datalist) {
        console.warn(`Datalist not found: ${datalistId}`);
        return;
    }
    
    // Clear existing options
    datalist.innerHTML = '';
    
    // Add new options
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        datalist.appendChild(option);
    });
    
    console.log(`Datalist updated for ${field} with ${items.length} items`);
}

// Initialize autocomplete lists on page load
function initializeAutocomplete() {
    console.log('Initializing autocomplete...');
    const history = loadSearchHistory();
    console.log('Loaded history:', history);
    
    updateAutocompleteList('mobileNo', history.mobileNo);
    updateAutocompleteList('customerName', history.customerName);
    updateAutocompleteList('orderNo', history.orderNo);
    updateAutocompleteList('address', history.address);
    
    // Setup realtime autocomplete
    setupRealtimeAutocomplete();
    
    console.log('Autocomplete initialized successfully');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Page loaded, initializing...');
    
    // Check authentication
    const authData = getAuthData();
    if (!authData) {
        window.location.href = '/index.html';
        return;
    }

    currentInstitutionId = authData.institutionId;
    currentRegistrationId = authData.registrationId;

    // Wait for components to load (they are loaded by app-components.js)
    setTimeout(async () => {
        console.log('Components loaded, setting up...');
        
        // Setup search tabs
        setupSearchTabs();

        // Load initial data
        await searchOrders();

        // Setup select all checkbox
        setupSelectAllCheckbox();
        
        // Initialize language
        if (typeof window.updateLanguage === 'function') {
            window.updateLanguage();
        }
        
        // Listen for language change event
        $(document).on('languageChanged', async function(event, lang) {
            console.log('Language changed to:', lang);
            // Reload the table with new language
            await searchOrders();
        });

        // Initialize autocomplete after jQuery UI is loaded
        setTimeout(() => {
            console.log('Initializing autocomplete after delay...');
            
            // Check if jQuery UI autocomplete is available
            if (typeof $.fn.autocomplete === 'function') {
                console.log('jQuery UI autocomplete is available');
                initializeAutocomplete();
            } else {
                console.error('jQuery UI autocomplete is NOT available!');
            }
        }, 1000);
    }, 500);
});

// Setup search tabs functionality
function setupSearchTabs() {
    const searchTypeRadios = document.querySelectorAll('input[name="searchType"]');
    
    searchTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            // Hide all search forms
            document.querySelector('.search-by-number').classList.remove('active');
            document.querySelector('.search-by-date').classList.remove('active');
            
            // Show selected search form
            if (this.value === 'number') {
                document.querySelector('.search-by-number').classList.add('active');
            } else {
                document.querySelector('.search-by-date').classList.add('active');
            }
        });
    });
}

// Search orders
async function searchOrders() {
    const searchType = document.querySelector('input[name="searchType"]:checked').value;
    const ordersTableContainer = document.getElementById('ordersTableContainer');
    ordersTableContainer.innerHTML = '<div class="loading">লোড হচ্ছে...</div>';

    try {
        let queryParams = `institutionId=${currentInstitutionId}`;

        if (searchType === 'number') {
            const phone = document.getElementById('mobileNo').value.trim();
            const customerName = document.getElementById('customerName').value.trim();
            const orderNo = document.getElementById('orderNo').value.trim();
            const address = document.getElementById('address').value.trim();

            // Add to search history only if values are not empty
            if (phone) addToSearchHistory('mobileNo', phone);
            if (customerName) addToSearchHistory('customerName', customerName);
            if (orderNo) {
                // Split comma-separated order numbers and add each to history
                const orderNumbers = orderNo.split(',').map(n => n.trim()).filter(n => n);
                orderNumbers.forEach(num => addToSearchHistory('orderNo', num));
            }
            if (address) addToSearchHistory('address', address);

            if (phone) queryParams += `&phone=${encodeURIComponent(phone)}`;
            if (customerName) queryParams += `&customerName=${encodeURIComponent(customerName)}`;
            if (orderNo) queryParams += `&orderSerialNumbers=${encodeURIComponent(orderNo)}`;
            if (address) queryParams += `&address=${encodeURIComponent(address)}`;
        } else {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;

            if (startDate) queryParams += `&startDate=${startDate}`;
            if (endDate) queryParams += `&endDate=${endDate}`;
        }

        queryParams += '&pageSize=100'; // Load more at once

        const response = await fetch(`/api/Delivery/incomplete-works?${queryParams}`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Failed to load orders');
        }

        // Update total count
        const totalCountEl = document.getElementById('totalCount');
        const totalCount = result.data.totalCount || 0;
        const lang = window.currentLang || 'bn';
        
        if (lang === 'en') {
            totalCountEl.innerHTML = `Total: <strong>${totalCount}</strong> incomplete orders`;
        } else {
            totalCountEl.innerHTML = `সর্বমোট: <strong>${totalCount}</strong> টি অর্ডারের কাজ অসম্পূর্ণ অবস্থায় আছে`;
        }

        // Render orders table
        await renderOrdersTable(result.data.orders);

    } catch (error) {
        console.error('Error loading orders:', error);
        ordersTableContainer.innerHTML = `
            <div class="error-message">
                অর্ডার লোড করতে সমস্যা হয়েছে: ${error.message}
            </div>
        `;
    }
}

// Render orders table
async function renderOrdersTable(orders) {
    const ordersTableContainer = document.getElementById('ordersTableContainer');
    const lang = window.currentLang || 'bn';

    if (!orders || orders.length === 0) {
        const emptyMsg = lang === 'en' ? 'No orders found' : 'কোন অর্ডার পাওয়া যায়নি';
        ordersTableContainer.innerHTML = `<div class="empty-message">${emptyMsg}</div>`;
        return;
    }

    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>
                        <input type="checkbox" id="selectAll" class="order-list-checkbox">
                    </th>
                    <th>${lang === 'en' ? 'Order No.' : 'অর্ডার নং'}</th>
                    <th>${lang === 'en' ? 'Name' : 'নাম'}</th>
                    <th>${lang === 'en' ? 'Mobile' : 'মোবাইল'}</th>
                    <th>${lang === 'en' ? 'Address' : 'ঠিকানা'}</th>
                    <th>${lang === 'en' ? 'Order List' : 'অর্ডার লিস্ট'}</th>
                    <th>${lang === 'en' ? 'Order Date' : 'অর্ডারের তারিখ'}</th>
                    <th>${lang === 'en' ? 'Delivery Date' : 'ডেলিভারী তারিখ'}</th>
                    <th>${lang === 'en' ? 'Total Amount' : 'মোট টাকা'}</th>
                    <th>${lang === 'en' ? 'Where to Store' : 'কোথায় রাখবেন'}</th>
                    <th>${lang === 'en' ? 'Details' : 'বিস্তারিত'}</th>
                    <th>${lang === 'en' ? 'SMS' : 'SMS'}</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
    `;

    for (const order of orders) {
        // Get order list items
        const orderListItems = await getIncompleteOrderList(order.orderId);

        // Determine row class
        let rowClass = '';
        if (order.isToday) rowClass = 'today';
        else if (order.isOverdue) rowClass = 'overdue';
        else if (order.isPartlyCompleted) rowClass = 'partly-completed';

        tableHTML += `
            <tr class="${rowClass}" data-order-id="${order.orderId}">
                <td>
                    <input type="checkbox" class="order-checkbox" data-order-id="${order.orderId}">
                </td>
                <td>
                    <a href="order-measurements.html?orderId=${order.orderId}" class="view-measurement-link" target="_blank">
                        ${order.orderSerialNumber}
                    </a>
                </td>
                <td>(${order.customerNumber}) ${order.customerName}</td>
                <td>${order.phone}</td>
                <td>${order.address}</td>
                <td>
                    ${renderOrderListTable(orderListItems, order.orderId)}
                </td>
                <td>${formatDate(order.orderDate)}</td>
                <td>${order.deliveryDate ? formatDate(order.deliveryDate) : '-'}</td>
                <td>${order.orderAmount.toFixed(2)}</td>
                <td>
                    <input type="text" class="store-input" data-order-id="${order.orderId}" 
                           placeholder="${lang === 'en' ? 'Store location' : 'স্টোর লোকেশন'}"
                           value="${order.storeDetails || ''}">
                </td>
                <td>
                    <input type="text" class="details-input" data-order-id="${order.orderId}" 
                           placeholder="${lang === 'en' ? 'Details' : 'বিস্তারিত'}"
                           value="${order.details || ''}">
                </td>
                <td>
                    <input type="checkbox" class="sms-checkbox" data-order-id="${order.orderId}">
                </td>
                <td>
                    <i class="fas fa-print print-icon" onclick="window.open('order-measurements.html?orderId=${order.orderId}', '_blank')" title="${lang === 'en' ? 'Print' : 'প্রিন্ট করুন'}"></i>
                </td>
            </tr>
        `;
    }

    tableHTML += `
            </tbody>
        </table>
    `;

    ordersTableContainer.innerHTML = tableHTML;

    // Setup event listeners
    setupOrderCheckboxes();
    setupOrderListCheckboxes();
}

// Render order list table
function renderOrderListTable(orderListItems, orderId) {
    const lang = window.currentLang || 'bn';
    
    if (!orderListItems || orderListItems.length === 0) {
        return `<span>${lang === 'en' ? 'No items' : 'কোন পণ্য নেই'}</span>`;
    }

    let html = `
        <table class="order-list-nested">
            <thead>
                <tr>
                    <th>${lang === 'en' ? 'List No.' : 'লিস্ট নং'}</th>
                    <th>${lang === 'en' ? 'Dress' : 'পোষাক'}</th>
                    <th>${lang === 'en' ? 'Total' : 'মোট'}</th>
                    <th>${lang === 'en' ? 'Incomplete' : 'অসম্পূর্ণ'}</th>
                </tr>
            </thead>
            <tbody>
    `;

    orderListItems.forEach(item => {
        html += `
            <tr>
                <td>
                    <input type="checkbox" class="order-list-item-checkbox" 
                           data-order-id="${orderId}"
                           data-order-list-id="${item.orderListId}">
                    ${item.orderListSN}
                </td>
                <td>${item.dressName}</td>
                <td>${item.dressQuantity}</td>
                <td>
                    <input type="number" class="pending-input" 
                           data-order-id="${orderId}"
                           data-order-list-id="${item.orderListId}"
                           data-max="${item.pendingWork}"
                           value="${item.pendingWork}" 
                           min="0" 
                           max="${item.pendingWork}">
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    return html;
}

// Get incomplete order list
async function getIncompleteOrderList(orderId) {
    try {
        const response = await fetch(`/api/Delivery/incomplete-works/${orderId}/order-list?institutionId=${currentInstitutionId}`);
        const result = await response.json();

        if (result.success) {
            return result.data;
        }
        return [];
    } catch (error) {
        console.error('Error loading order list:', error);
        return [];
    }
}

// Setup select all checkbox
function setupSelectAllCheckbox() {
    document.addEventListener('change', function(e) {
        if (e.target.id === 'selectAll') {
            const orderCheckboxes = document.querySelectorAll('.order-checkbox');
            orderCheckboxes.forEach(checkbox => {
                checkbox.checked = e.target.checked;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            });
        }
    });
}

// Setup order checkboxes
function setupOrderCheckboxes() {
    const orderCheckboxes = document.querySelectorAll('.order-checkbox');
    orderCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const orderId = parseInt(this.dataset.orderId);
            const orderRow = this.closest('tr');

            if (this.checked) {
                // Check all order list items in this order
                const orderListCheckboxes = orderRow.querySelectorAll('.order-list-item-checkbox');
                orderListCheckboxes.forEach(cb => {
                    cb.checked = true;
                });
                orderRow.classList.add('selected');
                // Auto-check SMS checkbox
                const smsCheckbox = orderRow.querySelector('.sms-checkbox');
                if (smsCheckbox) smsCheckbox.checked = true;
            } else {
                // Uncheck all order list items in this order
                const orderListCheckboxes = orderRow.querySelectorAll('.order-list-item-checkbox');
                orderListCheckboxes.forEach(cb => {
                    cb.checked = false;
                });
                orderRow.classList.remove('selected');
                // Auto-uncheck SMS checkbox
                const smsCheckbox = orderRow.querySelector('.sms-checkbox');
                if (smsCheckbox) smsCheckbox.checked = false;
            }

            updateCompleteButton();
        });
    });
}

// Setup order list checkboxes
function setupOrderListCheckboxes() {
    const orderListCheckboxes = document.querySelectorAll('.order-list-item-checkbox');
    orderListCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const orderId = parseInt(this.dataset.orderId);
            const orderRow = document.querySelector(`tr[data-order-id="${orderId}"]`);
            const orderCheckbox = orderRow.querySelector('.order-checkbox');

            // Check if any order list item is checked
            const anyChecked = orderRow.querySelectorAll('.order-list-item-checkbox:checked').length > 0;

            if (anyChecked) {
                orderCheckbox.checked = true;
                orderRow.classList.add('selected');
                // Auto-check SMS checkbox
                const smsCheckbox = orderRow.querySelector('.sms-checkbox');
                if (smsCheckbox) smsCheckbox.checked = true;
            } else {
                orderCheckbox.checked = false;
                orderRow.classList.remove('selected');
                // Auto-uncheck SMS checkbox
                const smsCheckbox = orderRow.querySelector('.sms-checkbox');
                if (smsCheckbox) smsCheckbox.checked = false;
            }

            updateCompleteButton();
        });
    });

    // Setup pending input validation
    const pendingInputs = document.querySelectorAll('.pending-input');
    pendingInputs.forEach(input => {
        input.addEventListener('input', function() {
            const max = parseInt(this.dataset.max);
            const value = parseInt(this.value) || 0;

            if (value > max) {
                this.value = max;
                alert('পোষাকের পরিমান বেশী দিয়েছেন');
            }
        });
    });
}

// Update complete button state
function updateCompleteButton() {
    const anyChecked = document.querySelectorAll('.order-checkbox:checked').length > 0;
    document.getElementById('btnComplete').disabled = !anyChecked;
}

// Complete work
async function completeWork() {
    const checkedOrders = document.querySelectorAll('.order-checkbox:checked');

    if (checkedOrders.length === 0) {
        alert('আপনি কোন অর্ডার সিলেক্ট করেন নি।');
        return;
    }

    // Validate pending work inputs
    let hasError = false;
    checkedOrders.forEach(orderCheckbox => {
        const orderId = parseInt(orderCheckbox.dataset.orderId);
        const orderRow = document.querySelector(`tr[data-order-id="${orderId}"]`);
        const pendingInputs = orderRow.querySelectorAll('.pending-input');

        pendingInputs.forEach(input => {
            const checkbox = orderRow.querySelector(`.order-list-item-checkbox[data-order-list-id="${input.dataset.orderListId}"]`);
            if (checkbox && checkbox.checked) {
                const max = parseInt(input.dataset.max);
                const value = parseInt(input.value) || 0;

                if (value > max) {
                    hasError = true;
                    alert('পোষাকের পরিমান বেশী দিয়েছেন');
                }
            }
        });
    });

    if (hasError) {
        return;
    }

    // Build request model
    const orders = [];

    checkedOrders.forEach(orderCheckbox => {
        const orderId = parseInt(orderCheckbox.dataset.orderId);
        const orderRow = document.querySelector(`tr[data-order-id="${orderId}"]`);

        const storeDetails = orderRow.querySelector('.store-input').value;
        const details = orderRow.querySelector('.details-input').value;
        const sendSMS = orderRow.querySelector('.sms-checkbox').checked;

        // Get checked order list items
        const orderListItems = [];
        const dressParts = [];
        const checkedOrderListItems = orderRow.querySelectorAll('.order-list-item-checkbox:checked');

        checkedOrderListItems.forEach(checkbox => {
            const orderListId = parseInt(checkbox.dataset.orderListId);
            const pendingInput = orderRow.querySelector(`.pending-input[data-order-list-id="${orderListId}"]`);
            const completedQuantity = parseInt(pendingInput.value) || 0;
            const dressNameEl = pendingInput.closest('tr').querySelector('td:nth-child(2)');
            const dressName = dressNameEl ? dressNameEl.textContent.trim() : '';

            if (completedQuantity > 0) {
                orderListItems.push({
                    orderListId: orderListId,
                    completedQuantity: completedQuantity
                });
                if (dressName) dressParts.push(`${completedQuantity} টি ${dressName}`);
            }
        });

        if (orderListItems.length > 0) {
            orders.push({
                orderId: orderId,
                storeDetails: storeDetails,
                details: details,
                sendSMS: sendSMS,
                smsOrderListText: dressParts.join(', '),
                orderListItems: orderListItems
            });
        }
    });
    if (orders.length === 0) {
        alert('কোন পোষাক সিলেক্ট করা হয়েছে না বা পরিমাণ ০ আছে');
        return;
    }

    // Send request
    try {
        document.getElementById('btnComplete').disabled = true;
        document.getElementById('btnComplete').textContent = 'সম্পূর্ণ করা হচ্ছে...';

        const response = await fetch('/api/Delivery/complete-work', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                institutionId: currentInstitutionId,
                registrationId: currentRegistrationId,
                orders: orders
            })
        });

        const result = await response.json();

        if (result.success) {
            alert(result.message || 'অর্ডারের কাজ সফলভাবে সম্পূর্ণ হয়েছে');
            // Reload data
            await searchOrders();
        } else {
            throw new Error(result.message || 'Failed to complete work');
        }

    } catch (error) {
        console.error('Error completing work:', error);
        alert('কাজ সম্পূর্ণ করতে সমস্যা হয়েছে: ' + error.message);
    } finally {
        document.getElementById('btnComplete').disabled = false;
        document.getElementById('btnComplete').textContent = 'কাজ সম্পূর্ণ করুন';
    }
}

// Format date helper - Compact version
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear().toString().substr(-2);
    return `${day}/${month}/${year}`;
}

// Get auth data helper
function getAuthData() {
    // Try sessionStorage first (used by app-components.js)
    const username = sessionStorage.getItem('username');
    const institutionId = sessionStorage.getItem('institutionId');
    const registrationId = sessionStorage.getItem('registrationId');

    if (username && institutionId && registrationId) {
        return {
            username: username,
            institutionId: parseInt(institutionId),
            registrationId: parseInt(registrationId)
        };
    }

    // Fallback to localStorage
    const authData = localStorage.getItem('authData');
    if (!authData) return null;

    try {
        return JSON.parse(authData);
    } catch (error) {
        console.error('Error parsing auth data:', error);
        return null;
    }
}

// Test function for autocomplete - can be called from console
window.testAutocomplete = function() {
    console.log('Testing autocomplete...');
    
    // Add test data to history
    const testData = {
        mobileNo: ['01712345678', '01812345678', '01912345678'],
        customerName: ['আব্দুস সাত্তার', 'মোহাম্মদ আলী', 'রহিম উদ্দিন'],
        orderNo: ['225', '92', '93', '82', '85', '89', '84'],
        address: ['ঢাকা', 'চট্টগ্রাম', 'সিলেট']
    };
    
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(testData));
    console.log('Test data added to localStorage');
    
    // Reinitialize autocomplete
    initializeAutocomplete();
    
    console.log('Autocomplete reinitialized with test data');
    console.log('Try clicking on any search field to see suggestions');
    console.log('For order number: type 2 or 8 to see matching numbers');
};
