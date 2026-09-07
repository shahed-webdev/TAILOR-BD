// Incomplete Works JavaScript
let selectedOrders = new Map();
let currentInstitutionId = null;
let currentRegistrationId = null;
let orderListItemsCache = {};

// Constants
const API_BASE_URL = '/api/delivery';
const PAGE_SIZE = 100;

// State
let currentPage = 1;
let totalCount = 0;
let totalPages = 0;
let currentFilters = {};
let currentLanguage = localStorage.getItem('language') || 'bn';
let allLoadedOrders = [];
let cachedIncompleteOrders = [];
let institutionInfoCache = null;

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
        setupLegendFilters();

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
            await renderFromCache();
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

function getSearchCriteria() {
    const searchType = document.querySelector('input[name="searchType"]:checked')?.value || 'number';
    if (searchType === 'date') {
        return {
            phone: '',
            customerName: '',
            orderNo: '',
            address: '',
            startDate: document.getElementById('startDate')?.value || '',
            endDate: document.getElementById('endDate')?.value || ''
        };
    }
    return {
        phone: document.getElementById('mobileNo')?.value.trim() || '',
        customerName: document.getElementById('customerName')?.value.trim() || '',
        orderNo: document.getElementById('orderNo')?.value.trim() || '',
        address: document.getElementById('address')?.value.trim() || '',
        startDate: '',
        endDate: ''
    };
}

function orderDeliveryDateKey(order) {
    if (!order.deliveryDate) return '';
    return String(order.deliveryDate).split('T')[0];
}

function orderMatchesSearch(order, criteria) {
    if (criteria.phone && String(order.phone || '').indexOf(criteria.phone) === -1) return false;
    if (criteria.customerName && String(order.customerName || '').toLowerCase().indexOf(criteria.customerName.toLowerCase()) === -1) return false;
    if (criteria.address && String(order.address || '').toLowerCase().indexOf(criteria.address.toLowerCase()) === -1) return false;
    if (criteria.orderNo) {
        const nums = criteria.orderNo.split(',').map(n => n.trim()).filter(Boolean);
        if (!nums.some(n => String(order.orderSerialNumber) === n)) return false;
    }
    const day = orderDeliveryDateKey(order);
    if (criteria.startDate && (!day || day < criteria.startDate)) return false;
    if (criteria.endDate && (!day || day > criteria.endDate)) return false;
    return true;
}

function rememberSearchTerms(criteria) {
    if (criteria.phone) addToSearchHistory('mobileNo', criteria.phone);
    if (criteria.customerName) addToSearchHistory('customerName', criteria.customerName);
    if (criteria.address) addToSearchHistory('address', criteria.address);
    if (criteria.orderNo) {
        criteria.orderNo.split(',').map(n => n.trim()).filter(Boolean).forEach(num => addToSearchHistory('orderNo', num));
    }
}

function itemsFromDressItems(order) {
    return (order.dressItems || []).map((item, index) => ({
        orderListId: item.orderListId || 0,
        orderListSN: item.orderListSN || (index + 1),
        dressName: item.dressName,
        dressQuantity: item.dressQuantity ?? item.total ?? 0,
        pendingWork: item.pendingWork ?? item.remainingWork ?? 0,
        remainingWork: item.remainingWork ?? item.pendingWork ?? 0
    })).filter(item => (item.remainingWork ?? item.pendingWork ?? 0) > 0);
}

async function ensureOrderListCache(orders) {
    const missing = orders.filter(order => !orderListItemsCache[order.orderId]);
    missing.forEach(order => {
        const fromApi = itemsFromDressItems(order);
        if (fromApi.length && fromApi.every(item => item.orderListId)) {
            orderListItemsCache[order.orderId] = fromApi;
        }
    });
    const stillMissing = orders.filter(order => !orderListItemsCache[order.orderId]);
    if (!stillMissing.length) return;
    await Promise.all(stillMissing.map(async order => {
        orderListItemsCache[order.orderId] = await getIncompleteOrderList(order.orderId);
    }));
}

async function renderFromCache() {
    const criteria = getSearchCriteria();
    const searched = cachedIncompleteOrders.filter(order => orderMatchesSearch(order, criteria));
    allLoadedOrders = searched;
    totalCount = searched.length;
    totalPages = totalCount > 0 ? Math.ceil(totalCount / PAGE_SIZE) : 0;
    if (currentPage > totalPages) currentPage = Math.max(1, totalPages);
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageOrders = searched.slice(start, start + PAGE_SIZE);
    await renderOrdersTable(pageOrders);
    applyLegendFilters();
}

// Search orders
async function searchOrders(page, forceReload) {
    if (typeof page === 'number') {
        currentPage = page;
    } else {
        currentPage = 1;
    }

    rememberSearchTerms(getSearchCriteria());

    if (cachedIncompleteOrders.length && !forceReload) {
        await renderFromCache();
        return;
    }

    const ordersTableContainer = document.getElementById('ordersTableContainer');
    ordersTableContainer.innerHTML = '<div class="loading">লোড হচ্ছে...</div>';

    try {
        const queryParams = `institutionId=${currentInstitutionId}&page=1&pageSize=2000`;
        const response = await fetch(`/api/Delivery/incomplete-works?${queryParams}`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Failed to load orders');
        }

        cachedIncompleteOrders = result.data.orders || [];
        if (cachedIncompleteOrders.length && cachedIncompleteOrders[0].institutionName && !institutionInfoCache) {
            institutionInfoCache = { institutionName: cachedIncompleteOrders[0].institutionName };
        }

        await renderFromCache();

    } catch (error) {
        console.error('Error loading orders:', error);
        ordersTableContainer.innerHTML = `
            <div class="error-message">
                অর্ডার লোড করতে সমস্যা হয়েছে: ${error.message}
            </div>
        `;
    }
}

function renderPaginationHtml() {
    const lang = window.currentLang || 'bn';
    const from = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const to = Math.min(currentPage * PAGE_SIZE, totalCount);
    const info = lang === 'en'
        ? `Showing ${from}-${to} of ${totalCount}`
        : `মোট ${totalCount} টির মধ্যে ${from}-${to}`;

    if (totalPages <= 1) {
        return `<div class="iw-pagination-bar"><span class="iw-page-info">${info}</span></div>`;
    }

    return `
        <div class="iw-pagination-bar">
            <nav aria-label="Page navigation">
                <ul class="pagination pagination-sm mb-0 flex-wrap">
                    <li class="page-item${currentPage === 1 ? ' disabled' : ''}">
                        <a class="page-link" href="#" onclick="goToIncompletePage(${currentPage - 1}); return false;">${lang === 'en' ? '« Prev' : '« আগে'}</a>
                    </li>
                    <li class="page-item active"><span class="page-link">${currentPage} / ${totalPages}</span></li>
                    <li class="page-item${currentPage === totalPages ? ' disabled' : ''}">
                        <a class="page-link" href="#" onclick="goToIncompletePage(${currentPage + 1}); return false;">${lang === 'en' ? 'Next »' : 'পরের »'}</a>
                    </li>
                </ul>
            </nav>
            <span class="iw-page-info">${info}</span>
        </div>`;
}

window.goToIncompletePage = function(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderFromCache();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Render orders table
async function renderOrdersTable(orders) {
    const ordersTableContainer = document.getElementById('ordersTableContainer');
    const lang = window.currentLang || 'bn';

    if (!orders || orders.length === 0) {
        const emptyMsg = lang === 'en' ? 'No orders found' : 'কোন অর্ডার পাওয়া যায়নি';
        ordersTableContainer.innerHTML = renderPaginationHtml() + `<div class="empty-message">${emptyMsg}</div>`;
        const cardsEl = document.getElementById('iwCardsContainer');
        if (cardsEl) cardsEl.innerHTML = '';
        return;
    }

    await ensureOrderListCache(orders);

    const paginationHtml = renderPaginationHtml();

    let tableHTML = paginationHtml + `
        <table class="iw-table">
            <colgroup>
                <col class="col-chk">
                <col class="col-order-no">
                <col class="col-name">
                <col class="col-phone">
                <col style="width:22%">
                <col class="col-date">
                <col class="col-date">
                <col style="width:5%">
                <col style="width:7%">
                <col style="width:7%">
                <col class="col-sms">
                <col class="col-print">
            </colgroup>
            <thead>
                <tr>
                    <th><input type="checkbox" id="selectAll" class="order-list-checkbox"></th>
                    <th class="col-order-no-head">${lang === 'en' ? 'No.' : 'নং'}</th>
                    <th>${lang === 'en' ? 'Name' : 'নাম'}</th>
                    <th class="col-phone-head">${lang === 'en' ? 'Phone' : 'মোবা.'}</th>
                    <th>${lang === 'en' ? 'Order List' : 'অর্ডার লিস্ট'}</th>
                    <th class="col-date-head">${lang === 'en' ? 'Order' : 'অর্ডার'}</th>
                    <th class="col-date-head">${lang === 'en' ? 'Del.' : 'ডেলি.'}</th>
                    <th>${lang === 'en' ? 'Total' : 'মোট'}</th>
                    <th>${lang === 'en' ? 'Store' : 'রাখা'}</th>
                    <th>${lang === 'en' ? 'Note' : 'নোট'}</th>
                    <th>SMS</th>
                    <th>${lang === 'en' ? 'Pr.' : 'প্রি.'}</th>
                </tr>
            </thead>
            <tbody>
    `;

    for (const order of orders) {
        // Use cached order list items
        const orderListItems = orderListItemsCache[order.orderId] || [];

        // Determine row class
        let rowClass = '';
        if (order.isToday) rowClass = 'today';
        else if (order.isOverdue) rowClass = 'overdue';
        else if (order.isPartlyCompleted) rowClass = 'partly-completed';

        const customerLabel = `(${order.customerNumber}) ${order.customerName}`;

        tableHTML += `
            <tr class="${rowClass}" data-order-id="${order.orderId}"
                data-is-today="${order.isToday ? '1' : '0'}"
                data-is-overdue="${order.isOverdue ? '1' : '0'}"
                data-is-partly="${order.isPartlyCompleted ? '1' : '0'}">
                <td><input type="checkbox" class="order-checkbox" data-order-id="${order.orderId}"></td>
                <td class="col-order-no-cell">
                    <a href="order-measurements.html?orderId=${order.orderId}&institutionId=${currentInstitutionId}" class="view-measurement-link" target="_blank" title="${lang === 'en' ? 'View measurement' : 'মাপ দেখুন'}">
                        ${order.orderSerialNumber}
                    </a>
                </td>
                <td class="col-name-cell"><span class="cell-name" title="${escapeHtml(customerLabel)}">${escapeHtml(customerLabel)}</span></td>
                <td class="col-phone-cell">${escapeHtml(order.phone || '-')}</td>
                <td>${renderOrderListTable(orderListItems, order.orderId)}</td>
                <td class="col-date-cell">${formatDate(order.orderDate)}</td>
                <td class="col-date-cell">${order.deliveryDate ? formatDate(order.deliveryDate) : '-'}</td>
                <td><strong>${Math.round(order.orderAmount)}</strong></td>
                <td>
                    <input type="text" class="store-input" data-order-id="${order.orderId}" 
                           placeholder="${lang === 'en' ? 'Store' : 'রাখা'}"
                           value="${escapeHtml(order.storeDetails || '')}">
                </td>
                <td>
                    <input type="text" class="details-input" data-order-id="${order.orderId}" 
                           placeholder="${lang === 'en' ? 'Note' : 'নোট'}"
                           value="${escapeHtml(order.details || '')}">
                </td>
                <td><input type="checkbox" class="sms-checkbox" data-order-id="${order.orderId}"></td>
                <td>
                    <i class="fas fa-print print-icon" onclick="window.open('order-measurements.html?orderId=${order.orderId}&institutionId=${currentInstitutionId}', '_blank')" title="${lang === 'en' ? 'Print' : 'প্রিন্ট'}"></i>
                </td>
            </tr>
        `;
    }

    tableHTML += `
            </tbody>
        </table>
    ` + paginationHtml;

    ordersTableContainer.innerHTML = tableHTML;

    // Render mobile cards
    renderMobileCards(orders);

    // Setup event listeners
    setupOrderCheckboxes();
    setupOrderListCheckboxes();
}

// Render mobile card layout
function renderMobileCards(orders) {
    const container = document.getElementById('iwCardsContainer');
    if (!container) return;
    const lang = window.currentLang || 'bn';

    if (!orders || orders.length === 0) {
        container.innerHTML = '';
        return;
    }

    let html = `<div class="iw-mobile-select-bar">
        <input type="checkbox" id="selectAllMobile">
        <span>${lang === 'en' ? 'Select All' : 'সব নির্বাচন করুন'}</span>
    </div>`;

    orders.forEach(order => {
        let rowClass = '';
        if (order.isToday) rowClass = 'today';
        else if (order.isOverdue) rowClass = 'overdue';
        else if (order.isPartlyCompleted) rowClass = 'partly-completed';

        const customerLabel = `(${order.customerNumber}) ${order.customerName}`;
        const orderDate    = order.orderDate    ? formatDate(order.orderDate)    : '-';
        const deliveryDate = order.deliveryDate ? formatDate(order.deliveryDate) : '-';

        // Items rows (use already-loaded data from orderListItemsCache)
        const items = orderListItemsCache[order.orderId] || [];
        let itemsHtml = '';
        items.forEach(item => {
            const remaining = item.remainingWork ?? item.pendingWork ?? 0;
            itemsHtml += `
            <div class="ic-item-row">
                <input type="checkbox" class="order-list-item-checkbox"
                    data-order-id="${order.orderId}"
                    data-order-list-id="${item.orderListId}">
                <span class="ic-dress">${escapeHtml(item.dressName)}</span>
                <span class="ic-qty">${lang === 'en' ? 'Tot:' : 'মো:'} ${item.dressQuantity}</span>
                <input type="number" class="pending-input"
                    data-order-id="${order.orderId}"
                    data-order-list-id="${item.orderListId}"
                    data-max="${remaining}"
                    value="${remaining}" min="0" max="${remaining}">
            </div>`;
        });

        html += `
        <div class="iw-card ${rowClass}" data-order-id="${order.orderId}"
            data-is-today="${order.isToday ? '1' : '0'}"
            data-is-overdue="${order.isOverdue ? '1' : '0'}"
            data-is-partly="${order.isPartlyCompleted ? '1' : '0'}">
            <div class="ic-top">
                <input type="checkbox" class="order-checkbox ic-chk" data-order-id="${order.orderId}">
                <a href="order-measurements.html?orderId=${order.orderId}&institutionId=${currentInstitutionId}"
                   class="ic-serial" target="_blank">#${order.orderSerialNumber}</a>
                <span class="ic-name" title="${escapeHtml(customerLabel)}">${escapeHtml(customerLabel)}</span>
            </div>
            <div class="ic-info">
                <span><span class="lbl">${lang === 'en' ? 'Phone: ' : 'মোবা: '}</span>${escapeHtml(order.phone || '-')}</span>
                <span><span class="lbl">${lang === 'en' ? 'Order: ' : 'অর্ডার: '}</span>${orderDate}</span>
                <span><span class="lbl">${lang === 'en' ? 'Del: ' : 'ডেলি: '}</span><strong>${deliveryDate}</strong></span>
            </div>
            ${items.length > 0 ? `
            <div class="ic-items">
                <div class="ic-items-title"><i class="fas fa-tshirt me-1"></i>${lang === 'en' ? 'Order Items' : 'পোশাকের তালিকা'}</div>
                ${itemsHtml}
            </div>` : ''}
            <div class="ic-inputs">
                <input type="text" class="store-input" data-order-id="${order.orderId}"
                    placeholder="${lang === 'en' ? 'Store' : 'রাখা'}"
                    value="${escapeHtml(order.storeDetails || '')}">
                <input type="text" class="details-input" data-order-id="${order.orderId}"
                    placeholder="${lang === 'en' ? 'Note' : 'নোট'}"
                    value="${escapeHtml(order.details || '')}">
            </div>
            <div class="ic-footer">
                <div class="ic-footer-left">
                    <span class="ic-total">${lang === 'en' ? 'Total: ' : 'মোট: '}${Math.round(order.orderAmount)}</span>
                    <span class="ic-sms-wrap">
                        <input type="checkbox" class="sms-checkbox" data-order-id="${order.orderId}">
                        <span>SMS</span>
                    </span>
                </div>
                <div class="ic-footer-right">
                    <i class="fas fa-print ic-print-btn"
                       onclick="window.open('order-measurements.html?orderId=${order.orderId}&institutionId=${currentInstitutionId}','_blank')"
                       title="${lang === 'en' ? 'Print' : 'প্রিন্ট'}"></i>
                </div>
            </div>
        </div>`;
    });

    container.innerHTML = html + renderPaginationHtml();

    // Select all mobile
    const selectAllMobile = document.getElementById('selectAllMobile');
    if (selectAllMobile) {
        selectAllMobile.addEventListener('change', function() {
            container.querySelectorAll('.order-checkbox').forEach(cb => {
                cb.checked = this.checked;
                cb.dispatchEvent(new Event('change', { bubbles: true }));
            });
        });
    }

    // Sync card checkboxes with table checkboxes
    container.querySelectorAll('.order-checkbox').forEach(cb => {
        cb.addEventListener('change', function() {
            const orderId = this.dataset.orderId;
            const tableCheckbox = document.querySelector(`#ordersTableContainer .order-checkbox[data-order-id="${orderId}"]`);
            if (tableCheckbox) tableCheckbox.checked = this.checked;
            // update card selected style
            const card = this.closest('.iw-card');
            if (card) card.classList.toggle('selected', this.checked);
            updateCompleteButton();
        });
    });
}

// Render order list table
function renderOrderListTable(orderListItems, orderId) {
    const lang = window.currentLang || 'bn';
    
    if (!orderListItems || orderListItems.length === 0) {
        return `<span>${lang === 'en' ? 'No items' : 'কোন পণ্য নেই'}</span>`;
    }

    let html = `
        <table class="order-list-nested">
            <colgroup>
                <col style="width:22%">
                <col style="width:38%">
                <col style="width:18%">
                <col style="width:22%">
            </colgroup>
            <thead>
                <tr>
                    <th>${lang === 'en' ? 'Li.' : 'লি.'}</th>
                    <th>${lang === 'en' ? 'Dress' : 'পোষাক'}</th>
                    <th>${lang === 'en' ? 'Tot.' : 'মো.'}</th>
                    <th>${lang === 'en' ? 'Inc.' : 'অসম্পূ.'}</th>
                </tr>
            </thead>
            <tbody>
    `;

    orderListItems.forEach(item => {
        const remaining = item.remainingWork ?? item.pendingWork ?? 0;
        html += `
            <tr>
                <td>
                    <input type="checkbox" class="order-list-item-checkbox" 
                           data-order-id="${orderId}"
                           data-order-list-id="${item.orderListId}">
                    ${item.orderListSN}
                </td>
                <td><span class="cell-clip" title="${escapeHtml(item.dressName)}">${escapeHtml(clipCell(item.dressName, 10))}</span></td>
                <td>${item.dressQuantity}</td>
                <td>
                    <input type="number" class="pending-input" 
                           data-order-id="${orderId}"
                           data-order-list-id="${item.orderListId}"
                           data-max="${remaining}"
                           value="${remaining}" 
                           min="0" 
                           max="${remaining}">
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
                alert(`সর্বোচ্চ ${max} টি সম্পূর্ণ করা যাবে`);
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
                    input.value = max;
                    alert(`সর্বোচ্চ ${max} টি সম্পূর্ণ করা যাবে`);
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
            cachedIncompleteOrders = [];
            orderListItemsCache = {};
            await searchOrders(1, true);
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

function getActiveLegendFilters() {
    return Array.from(document.querySelectorAll('.legend-filter-cb:checked')).map(cb => cb.value);
}

function orderMatchesLegendFilter(orderOrEl, filters) {
    if (!filters || filters.length === 0) return true;
    const isToday = orderOrEl.isToday === true || orderOrEl.dataset?.isToday === '1';
    const isOverdue = orderOrEl.isOverdue === true || orderOrEl.dataset?.isOverdue === '1';
    const isPartly = orderOrEl.isPartlyCompleted === true || orderOrEl.dataset?.isPartly === '1';
    return filters.some(f =>
        (f === 'today' && isToday) ||
        (f === 'overdue' && isOverdue) ||
        (f === 'partly' && isPartly)
    );
}

function updateTotalCountText(visibleCount) {
    const totalCountEl = document.getElementById('totalCount');
    if (!totalCountEl) return;
    const lang = window.currentLang || 'bn';
    const filters = getActiveLegendFilters();
    if (filters.length === 0) {
        totalCountEl.innerHTML = lang === 'en'
            ? `Total: <strong>${totalCount}</strong> incomplete orders`
            : `সর্বমোট: <strong>${totalCount}</strong> টি অর্ডারের কাজ অসম্পূর্ণ অবস্থায় আছে`;
        return;
    }
    totalCountEl.innerHTML = lang === 'en'
        ? `Showing: <strong>${visibleCount}</strong> of ${totalCount} incomplete orders`
        : `দেখানো হচ্ছে: <strong>${visibleCount}</strong> টি (মোট ${totalCount} টি অসম্পূর্ণ অর্ডার)`;
}

function applyLegendFilters() {
    const filters = getActiveLegendFilters();
    document.querySelectorAll('.legend-filter').forEach(item => {
        const cb = item.querySelector('.legend-filter-cb');
        item.classList.toggle('is-active', !!(cb && cb.checked));
    });

    const visibleCount = allLoadedOrders.filter(order => orderMatchesLegendFilter(order, filters)).length;
    document.querySelectorAll('#ordersTableContainer tbody tr[data-order-id]').forEach(row => {
        row.style.display = orderMatchesLegendFilter(row, filters) ? '' : 'none';
    });
    document.querySelectorAll('#iwCardsContainer .iw-card[data-order-id]').forEach(card => {
        card.style.display = orderMatchesLegendFilter(card, filters) ? '' : 'none';
    });

    updateTotalCountText(visibleCount);

    const lang = window.currentLang || 'bn';
    let emptyEl = document.getElementById('iwFilterEmpty');
    if (!emptyEl) {
        emptyEl = document.createElement('div');
        emptyEl.id = 'iwFilterEmpty';
        emptyEl.className = 'empty-message no-print';
        const tableWrap = document.querySelector('.table-wrapper');
        if (tableWrap) tableWrap.appendChild(emptyEl);
    }
    const noMatch = filters.length > 0 && visibleCount === 0 && allLoadedOrders.length > 0;
    emptyEl.style.display = noMatch ? '' : 'none';
    emptyEl.textContent = lang === 'en'
        ? 'No orders match the selected filters'
        : 'নির্বাচিত ফিল্টারে কোন অর্ডার পাওয়া যায়নি';
}

function setupLegendFilters() {
    document.querySelectorAll('.legend-filter-cb').forEach(cb => {
        cb.addEventListener('change', applyLegendFilters);
    });
}

function getFilteredOrders(sourceOrders) {
    const filters = getActiveLegendFilters();
    const criteria = getSearchCriteria();
    const list = sourceOrders || cachedIncompleteOrders || allLoadedOrders || [];
    return list
        .filter(order => orderMatchesSearch(order, criteria))
        .filter(order => orderMatchesLegendFilter(order, filters));
}

function getOrderDressItems(order) {
    if (orderListItemsCache[order.orderId] && orderListItemsCache[order.orderId].length) {
        return orderListItemsCache[order.orderId].map(item => ({
            dressName: item.dressName,
            total: item.dressQuantity,
            pendingWork: item.remainingWork ?? item.pendingWork ?? 0
        }));
    }
    return (order.dressItems || []).map(item => ({
        dressName: item.dressName,
        total: item.total ?? item.dressQuantity ?? 0,
        pendingWork: item.pendingWork ?? item.remainingWork ?? 0
    }));
}

function buildIncompletePrintQuery() {
    const searchType = document.querySelector('input[name="searchType"]:checked')?.value;
    let queryParams = `institutionId=${currentInstitutionId}&page=1&pageSize=${Math.max(totalCount || PAGE_SIZE, PAGE_SIZE)}`;

    if (searchType === 'number') {
        const phone = document.getElementById('mobileNo').value.trim();
        const customerName = document.getElementById('customerName').value.trim();
        const orderNo = document.getElementById('orderNo').value.trim();
        const address = document.getElementById('address').value.trim();
        if (phone) queryParams += `&phone=${encodeURIComponent(phone)}`;
        if (customerName) queryParams += `&customerName=${encodeURIComponent(customerName)}`;
        if (orderNo) queryParams += `&orderSerialNumbers=${encodeURIComponent(orderNo)}`;
        if (address) queryParams += `&address=${encodeURIComponent(address)}`;
    } else if (searchType === 'date') {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        if (startDate) queryParams += `&startDate=${startDate}`;
        if (endDate) queryParams += `&endDate=${endDate}`;
    }
    return queryParams;
}

async function fetchAllOrdersForPrint() {
    if (cachedIncompleteOrders.length) return cachedIncompleteOrders;
    if (allLoadedOrders.length) return allLoadedOrders;
    const response = await fetch(`/api/Delivery/incomplete-works?${buildIncompletePrintQuery()}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Failed to load orders');
    return result.data.orders || [];
}

function getLegendFilterLabels(lang) {
    const labels = [];
    if (document.getElementById('filterToday')?.checked) labels.push(lang === 'en' ? "Today's delivery" : 'আজকের ডেলিভারি');
    if (document.getElementById('filterOverdue')?.checked) labels.push(lang === 'en' ? 'Overdue' : 'তারিখ অতিক্রান্ত');
    if (document.getElementById('filterPartly')?.checked) labels.push(lang === 'en' ? 'Partly done' : 'আংশিক সম্পন্ন');
    return labels;
}

function renderPrintList(orders) {
    const lang = window.currentLang || 'bn';
    const printArea = document.getElementById('iwPrintArea');
    if (!printArea) return;

    const titleEl = document.getElementById('printRepTitle');
    const metaEl = document.getElementById('printRepMeta');
    const filterLabels = getLegendFilterLabels(lang);
    if (titleEl) {
        titleEl.textContent = lang === 'en' ? 'Incomplete Orders List' : 'অসম্পূর্ণ অর্ডারের তালিকা';
    }
    if (metaEl) {
        const now = new Date();
        const printedOn = formatDate(now.toISOString());
        const filterText = filterLabels.length
            ? (lang === 'en' ? `Filter: ${filterLabels.join(', ')}` : `ফিল্টার: ${filterLabels.join(', ')}`)
            : (lang === 'en' ? 'All incomplete orders' : 'সকল অসম্পূর্ণ অর্ডার');
        metaEl.textContent = lang === 'en'
            ? `${filterText} | Total: ${orders.length} | Printed: ${printedOn}`
            : `${filterText} | মোট: ${orders.length} টি | প্রিন্ট: ${printedOn}`;
    }

    let rows = '';
    orders.forEach((order, index) => {
        let rowClass = '';
        if (order.isToday) rowClass = 'today';
        else if (order.isOverdue) rowClass = 'overdue';
        else if (order.isPartlyCompleted) rowClass = 'partly-completed';

        const items = getOrderDressItems(order);
        const itemsHtml = items.length
            ? `<ul class="iw-print-items">${items.map(item =>
                `<li>${escapeHtml(item.dressName)} — ${lang === 'en' ? 'Tot' : 'মো'}: ${item.total}, ${lang === 'en' ? 'Inc' : 'অসম্পূ'}: ${item.pendingWork}</li>`
              ).join('')}</ul>`
            : '-';

        rows += `
            <tr class="${rowClass}">
                <td class="num">${index + 1}</td>
                <td class="num">${order.orderSerialNumber}</td>
                <td>${escapeHtml(`(${order.customerNumber}) ${order.customerName}`)}</td>
                <td>${escapeHtml(order.phone || '-')}</td>
                <td>${itemsHtml}</td>
                <td class="num">${formatDate(order.orderDate)}</td>
                <td class="num">${order.deliveryDate ? formatDate(order.deliveryDate) : '-'}</td>
            </tr>`;
    });

    printArea.innerHTML = `
        <table class="iw-print-table">
            <thead>
                <tr>
                    <th>${lang === 'en' ? 'SL' : 'ক্রম'}</th>
                    <th>${lang === 'en' ? 'No.' : 'নং'}</th>
                    <th>${lang === 'en' ? 'Name' : 'নাম'}</th>
                    <th>${lang === 'en' ? 'Phone' : 'মোবাইল'}</th>
                    <th>${lang === 'en' ? 'Order List' : 'অর্ডার লিস্ট'}</th>
                    <th>${lang === 'en' ? 'Order' : 'অর্ডার'}</th>
                    <th>${lang === 'en' ? 'Delivery' : 'ডেলিভারি'}</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
}

async function loadInstitutionInfoForPrint() {
    if (institutionInfoCache && institutionInfoCache.phone) return institutionInfoCache;
    try {
        const response = await fetch(`/api/institution/${currentInstitutionId}`);
        const result = await response.json();
        if (result && (result.data || result.institutionName)) {
            institutionInfoCache = result.data || result;
        }
    } catch (error) {
        console.warn('Could not load institution info for print', error);
    }
    return institutionInfoCache;
}

function fillPrintHeader() {
    const info = institutionInfoCache || {};
    const nameEl = document.getElementById('printInsName');
    const phoneEl = document.getElementById('printInsPhone');
    const addressEl = document.getElementById('printInsAddress');
    if (nameEl) nameEl.textContent = info.institutionName || '';
    if (phoneEl) phoneEl.textContent = info.phone ? info.phone : '';
    if (addressEl) addressEl.textContent = info.address ? info.address : '';
}

async function printIncompleteList() {
    const lang = window.currentLang || 'bn';
    const btn = document.querySelector('.btn-print-list');
    const originalHtml = btn ? btn.innerHTML : '';
    try {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>${lang === 'en' ? 'Preparing...' : 'প্রস্তুত হচ্ছে...'}</span>`;
        }
        await loadInstitutionInfoForPrint();
        fillPrintHeader();
        const orders = getFilteredOrders(await fetchAllOrdersForPrint());
        if (!orders.length) {
            alert(lang === 'en' ? 'No orders to print' : 'প্রিন্ট করার মতো কোন অর্ডার নেই');
            return;
        }
        renderPrintList(orders);
        window.print();
    } catch (error) {
        console.error('Error printing list:', error);
        alert(lang === 'en' ? 'Could not prepare print list' : 'তালিকা প্রিন্ট করতে সমস্যা হয়েছে');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
        }
    }
}

window.printIncompleteList = printIncompleteList;

// Format date helper - Compact version
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear().toString().substr(-2);
    return `${day}/${month}/${year}`;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function clipCell(text, maxLen) {
    if (!text || text === '-') return '-';
    const s = String(text);
    return s.length <= maxLen ? s : s.substring(0, maxLen) + '…';
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
