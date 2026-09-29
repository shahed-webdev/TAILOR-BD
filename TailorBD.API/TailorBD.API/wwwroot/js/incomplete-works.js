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
        setupSearchEnterKey();

        // Load initial data
        await searchOrders();

        // Setup select all checkbox
        setupSelectAllCheckbox();
        setupSmsHeaderCheckbox();
        
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

function setupSearchEnterKey() {
    ['mobileNo', 'orderNo', 'customerName', 'address', 'startDate', 'endDate'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchOrders();
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

function localTodayStr() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${dayNum}`;
}

function orderDeliveryDateKey(order) {
    if (!order.deliveryDate) return '';
    const raw = String(order.deliveryDate);
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) {
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const dayNum = String(parsed.getDate()).padStart(2, '0');
        return `${parsed.getFullYear()}-${m}-${dayNum}`;
    }
    return raw.split('T')[0].split(' ')[0];
}

function normalizeOrderFlags(order) {
    const day = orderDeliveryDateKey(order);
    const today = localTodayStr();
    order.isToday = !!(day && day === today);
    order.isOverdue = !!(day && day < today);
    order.isRecent = !order.isToday && !order.isOverdue;
    return order;
}

function getOrderRowClass(order) {
    if (order.isToday) return 'today';
    if (order.isOverdue) return 'overdue';
    if (order.isPartlyCompleted) return 'partly-completed';
    return 'recent';
}

function parseOrderNumbers(orderNo) {
    return String(orderNo || '')
        .split(/[,،\s]+/)
        .map(n => n.trim())
        .filter(Boolean)
        .map(n => String(parseInt(n, 10)))
        .filter(n => n !== 'NaN');
}

function orderMatchesSearch(order, criteria) {
    if (criteria.phone && String(order.phone || '').indexOf(criteria.phone) === -1) return false;
    if (criteria.customerName && String(order.customerName || '').toLowerCase().indexOf(criteria.customerName.toLowerCase()) === -1) return false;
    if (criteria.address && String(order.address || '').toLowerCase().indexOf(criteria.address.toLowerCase()) === -1) return false;
    if (criteria.orderNo) {
        const nums = parseOrderNumbers(criteria.orderNo);
        const serial = String(parseInt(order.orderSerialNumber, 10));
        if (!nums.length || nums.indexOf(serial) === -1) return false;
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
        parseOrderNumbers(criteria.orderNo).forEach(num => addToSearchHistory('orderNo', num));
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

function getVisibleCachedOrders() {
    const criteria = getSearchCriteria();
    const skipLegend = !!(criteria.orderNo || criteria.phone);
    const filters = skipLegend ? [] : getActiveLegendFilters();
    return cachedIncompleteOrders
        .filter(order => orderMatchesSearch(order, criteria))
        .filter(order => orderMatchesLegendFilter(order, filters));
}

async function renderFromCache() {
    const criteria = getSearchCriteria();
    const skipLegend = !!(criteria.orderNo || criteria.phone);
    const filters = skipLegend ? [] : getActiveLegendFilters();

    document.querySelectorAll('.legend-filter').forEach(item => {
        const cb = item.querySelector('.legend-filter-cb');
        item.classList.toggle('is-active', !!(cb && cb.checked));
    });

    const searchMatched = cachedIncompleteOrders.filter(order => orderMatchesSearch(order, criteria));
    const visible = skipLegend ? searchMatched : searchMatched.filter(order => orderMatchesLegendFilter(order, filters));

    allLoadedOrders = visible;
    totalCount = visible.length;
    totalPages = totalCount > 0 ? Math.ceil(totalCount / PAGE_SIZE) : 0;
    if (currentPage > totalPages) currentPage = Math.max(1, totalPages);
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageOrders = visible.slice(start, start + PAGE_SIZE);
    await renderOrdersTable(pageOrders);
    updateTotalCountText(visible.length, searchMatched.length);

    const emptyEl = document.getElementById('iwFilterEmpty');
    if (emptyEl) emptyEl.style.display = 'none';
}

function mergeOrdersIntoCache(orders) {
    (orders || []).map(normalizeOrderFlags).forEach(order => {
        const index = cachedIncompleteOrders.findIndex(existing => existing.orderId === order.orderId);
        if (index === -1) cachedIncompleteOrders.push(order);
        else cachedIncompleteOrders[index] = order;
    });
    if (cachedIncompleteOrders.length && cachedIncompleteOrders[0].institutionName && !institutionInfoCache) {
        institutionInfoCache = { institutionName: cachedIncompleteOrders[0].institutionName };
    }
}

async function fetchIncompleteFromApi(extraParams) {
    let queryParams = `institutionId=${currentInstitutionId}&page=1&pageSize=5000`;
    Object.keys(extraParams || {}).forEach(key => {
        const value = extraParams[key];
        if (value !== undefined && value !== null && value !== '' && value !== false) {
            queryParams += `&${key}=${encodeURIComponent(value)}`;
        }
    });
    const response = await fetch(`/api/Delivery/incomplete-works?${queryParams}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Failed to load orders');
    return result.data.orders || [];
}

async function refreshIncompleteCacheSilent() {
    try {
        const today = localTodayStr();
        const [mainOrders, upcomingOrders] = await Promise.all([
            fetchIncompleteFromApi({}),
            fetchIncompleteFromApi({ startDate: today, endDate: '3760-01-01', upcomingOnly: true })
        ]);
        const next = [];
        (mainOrders || []).concat(upcomingOrders || []).map(normalizeOrderFlags).forEach(order => {
            if (!next.some(o => o.orderId === order.orderId)) next.push(order);
        });
        cachedIncompleteOrders = next;
        const criteria = getSearchCriteria();
        if (!criteria.orderNo && !criteria.phone && !criteria.customerName) {
            await renderFromCache();
        }
    } catch (error) {
        console.warn('Background refresh failed', error);
    }
}

async function loadIncompleteCache() {
    const today = localTodayStr();
    const [mainOrders, upcomingOrders] = await Promise.all([
        fetchIncompleteFromApi({}),
        fetchIncompleteFromApi({ startDate: today, endDate: '3760-01-01', upcomingOnly: true })
    ]);
    cachedIncompleteOrders = [];
    mergeOrdersIntoCache(mainOrders);
    mergeOrdersIntoCache(upcomingOrders);
}

async function fetchAndMergeSearch(criteria) {
    const ordersTableContainer = document.getElementById('ordersTableContainer');
    const serials = parseOrderNumbers(criteria.orderNo);
    const extra = {
        phone: criteria.phone || '',
        customerName: criteria.customerName || '',
        orderSerialNumbers: serials.join(','),
        address: criteria.address || '',
        startDate: criteria.startDate || '',
        endDate: criteria.endDate || '',
        upcomingOnly: !!criteria.upcomingOnly
    };

    const localHits = cachedIncompleteOrders.filter(order => orderMatchesSearch(order, criteria));
    if (localHits.length) {
        await renderFromCache();
    } else {
        ordersTableContainer.innerHTML = '<div class="loading">লোড হচ্ছে...</div>';
    }

    try {
        const orders = await fetchIncompleteFromApi(extra);
        mergeOrdersIntoCache(orders);
        await renderFromCache();
    } catch (error) {
        console.error('Error searching orders:', error);
        await renderFromCache();
    }
}

async function ensureUpcomingOrdersLoaded() {
    const ordersTableContainer = document.getElementById('ordersTableContainer');
    if (ordersTableContainer) {
        ordersTableContainer.innerHTML = '<div class="loading">লোড হচ্ছে...</div>';
    }
    const upcoming = await fetchIncompleteFromApi({
        startDate: localTodayStr(),
        endDate: '3760-01-01',
        upcomingOnly: true
    });
    mergeOrdersIntoCache(upcoming);
}

// Search orders
async function searchOrders(page, forceReload) {
    if (typeof page === 'number') {
        currentPage = page;
    } else {
        currentPage = 1;
    }

    const criteria = getSearchCriteria();
    rememberSearchTerms(criteria);
    const ordersTableContainer = document.getElementById('ordersTableContainer');
    const hasDateSearch = !!(criteria.startDate || criteria.endDate);
    const hasLookup = !!(criteria.orderNo || criteria.phone || criteria.customerName || criteria.address);

    if (hasDateSearch || hasLookup) {
        await fetchAndMergeSearch(criteria);
        return;
    }

    if (!cachedIncompleteOrders.length || forceReload) {
        ordersTableContainer.innerHTML = '<div class="loading">লোড হচ্ছে...</div>';
        try {
            await loadIncompleteCache();
        } catch (error) {
            console.error('Error loading orders:', error);
            ordersTableContainer.innerHTML = `
                <div class="error-message">
                    অর্ডার লোড করতে সমস্যা হয়েছে: ${error.message}
                </div>
            `;
            return;
        }
    }

    await renderFromCache();
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
                    <th class="col-sms-head"><label class="sms-all-wrap" title="${lang === 'en' ? 'SMS for all selected orders' : 'সিলেক্ট করা সব অর্ডারে SMS'}"><span>SMS</span><input type="checkbox" id="smsAll"></label></th>
                    <th>${lang === 'en' ? 'Pr.' : 'প্রি.'}</th>
                </tr>
            </thead>
            <tbody>
    `;

    for (const order of orders) {
        // Use cached order list items
        const orderListItems = orderListItemsCache[order.orderId] || [];

        // Determine row class
        const rowClass = getOrderRowClass(order);
        const customerLabel = `(${order.customerNumber}) ${order.customerName}`;

        tableHTML += `
            <tr class="${rowClass}" data-order-id="${order.orderId}"
                data-is-today="${order.isToday ? '1' : '0'}"
                data-is-overdue="${order.isOverdue ? '1' : '0'}"
                data-is-partly="${order.isPartlyCompleted ? '1' : '0'}"
                data-is-recent="${order.isRecent ? '1' : '0'}">
                <td><input type="checkbox" class="order-checkbox" data-order-id="${order.orderId}"></td>
                <td class="col-order-no-cell">
                    <a href="order-measurements.html?orderId=${order.orderId}&institutionId=${currentInstitutionId}" class="view-measurement-link" target="_blank" title="${lang === 'en' ? 'View measurement' : 'মাপ দেখুন'}">
                        ${order.orderSerialNumber}
                    </a>
                </td>
                <td class="col-name-cell"><span class="cell-name" title="${escapeHtml(customerLabel)}">${escapeHtml(customerLabel)}</span></td>
                <td class="col-phone-cell">${escapeHtml(order.phone || '-')}</td>
                <td>${renderOrderListTable(orderListItems, order.orderId)}<div class="aa-progress" data-aa-progress="${order.orderId}"></div></td>
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
    updateSmsHeaderState();

    fillAssignedArtisans(orders);
}

// Assigned কারিগর per dress line (one batched call for the page; artisan-assign.js)
function fillAssignedArtisans(orders) {
    if (!window.ArtisanAssign) return;
    ArtisanAssign.fill(document);   // cached values right away
    ArtisanAssign.load((orders || []).map(order => order.orderId)).then(loaded => {
        if (loaded) ArtisanAssign.fill(document);
    });
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
        const rowClass = getOrderRowClass(order);
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
                <span class="ic-dress">${escapeHtml(item.dressName)}<span class="aa-line" data-aa-mode="attr" data-aa-ol="${item.orderListId}"></span></span>
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
            data-is-partly="${order.isPartlyCompleted ? '1' : '0'}"
            data-is-recent="${order.isRecent ? '1' : '0'}">
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
                <div class="aa-progress" data-aa-progress="${order.orderId}"></div>
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

    // Card = phone copy of the table row. completeWork() reads the table row, so every card change is
    // passed to the table row (whose handlers tick dress lines + SMS) and the result copied back.
    container.querySelectorAll('.order-checkbox').forEach(cb => {
        cb.addEventListener('change', function() {
            const orderId = this.dataset.orderId;
            const tableCheckbox = document.querySelector(`#ordersTableContainer .order-checkbox[data-order-id="${orderId}"]`);
            if (tableCheckbox) {
                if (tableCheckbox.checked !== this.checked) {
                    tableCheckbox.checked = this.checked;
                    tableCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
                } else {
                    syncCardFromTable(orderId);
                }
            } else {
                // no table row (should not happen): handle the card on its own
                const card = this.closest('.iw-card');
                if (card) {
                    card.querySelectorAll('.order-list-item-checkbox').forEach(x => { x.checked = this.checked; });
                    card.classList.toggle('selected', this.checked);
                }
                setOrderSms(orderId, this.checked);
                updateSmsHeaderState();
            }
            updateCompleteButton();
        });
    });
    container.querySelectorAll('.order-list-item-checkbox').forEach(cb => {
        cb.addEventListener('change', function() {
            const orderId = this.dataset.orderId;
            const tableItem = document.querySelector(`#ordersTableContainer .order-list-item-checkbox[data-order-id="${orderId}"][data-order-list-id="${this.dataset.orderListId}"]`);
            if (!tableItem) return;
            tableItem.checked = this.checked;
            tableItem.dispatchEvent(new Event('change', { bubbles: true }));
        });
    });
    // quantity / store / note typed on the card go to the table row too
    container.addEventListener('input', function(e) {
        const el = e.target;
        if (!el || !el.matches || !el.matches('.pending-input, .store-input, .details-input')) return;
        const cls = el.classList.contains('pending-input') ? 'pending-input' : (el.classList.contains('store-input') ? 'store-input' : 'details-input');
        let sel = `#ordersTableContainer .${cls}[data-order-id="${el.dataset.orderId}"]`;
        if (cls === 'pending-input') sel += `[data-order-list-id="${el.dataset.orderListId}"]`;
        const target = document.querySelector(sel);
        if (target) target.value = el.value;
    });
}

// copy the table row's selection (order, dress lines, SMS) onto its phone card
function syncCardFromTable(orderId) {
    const row = document.querySelector(`#ordersTableContainer tr[data-order-id="${orderId}"]`);
    const card = document.querySelector(`#iwCardsContainer .iw-card[data-order-id="${orderId}"]`);
    if (!row || !card) return;
    const on = !!row.querySelector('.order-checkbox')?.checked;
    const cardChk = card.querySelector('.order-checkbox');
    if (cardChk) cardChk.checked = on;
    card.classList.toggle('selected', on);
    card.querySelectorAll('.order-list-item-checkbox').forEach(x => {
        const t = row.querySelector(`.order-list-item-checkbox[data-order-list-id="${x.dataset.orderListId}"]`);
        if (t) x.checked = t.checked;
    });
    const sms = row.querySelector('.sms-checkbox');
    const cardSms = card.querySelector('.sms-checkbox');
    if (sms && cardSms) cardSms.checked = sms.checked;
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
                <td><span class="cell-clip" title="${escapeHtml(item.dressName)}">${escapeHtml(clipCell(item.dressName, 10))}</span><span class="aa-line" data-aa-mode="attr" data-aa-ol="${item.orderListId}"></span></td>
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

// ── SMS header checkbox (desktop table) ──────────────────────────────────
// tick  = SMS on for every selected (ticked) order of the current page
// untick = SMS off for every order row of the current page
// state: checked = all selected rows have SMS, indeterminate = some, unchecked = none / nothing selected
function setOrderSms(orderId, on) {
    // table row checkbox is what completeWork() reads; the mobile card copy is kept in step
    document.querySelectorAll(`.sms-checkbox[data-order-id="${orderId}"]`).forEach(cb => { cb.checked = on; });
}
function updateSmsHeaderState() {
    const head = document.getElementById('smsAll');
    if (!head) return;
    const rows = Array.from(document.querySelectorAll('#ordersTableContainer tr[data-order-id]'))
        .filter(tr => tr.querySelector('.order-checkbox')?.checked);
    const withSms = rows.filter(tr => tr.querySelector('.sms-checkbox')?.checked).length;
    head.checked = rows.length > 0 && withSms === rows.length;
    head.indeterminate = withSms > 0 && withSms < rows.length;
}
function setupSmsHeaderCheckbox() {
    // bound once on document: the table (and its header) is re-rendered on every page / search
    document.addEventListener('change', function (e) {
        const t = e.target;
        if (!t || !t.matches) return;
        if (t.id === 'smsAll') {
            const rows = Array.from(document.querySelectorAll('#ordersTableContainer tr[data-order-id]'));
            if (t.checked) {
                rows.forEach(tr => { if (tr.querySelector('.order-checkbox')?.checked) setOrderSms(tr.dataset.orderId, true); });
            } else {
                rows.forEach(tr => setOrderSms(tr.dataset.orderId, false));
            }
            updateSmsHeaderState();
            return;
        }
        if (t.matches('.sms-checkbox')) {
            setOrderSms(t.dataset.orderId, t.checked);   // keep table/card copies equal
            updateSmsHeaderState();
            return;
        }
        if (t.matches('.order-checkbox, .order-list-item-checkbox')) updateSmsHeaderState();
    });
}

// Setup select all checkbox
function setupSelectAllCheckbox() {
    document.addEventListener('change', function(e) {
        if (e.target.id === 'selectAll') {
            // table rows only — their handlers copy the result onto the phone cards
            const orderCheckboxes = document.querySelectorAll('#ordersTableContainer .order-checkbox');
            orderCheckboxes.forEach(checkbox => {
                checkbox.checked = e.target.checked;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            });
        }
    });
}

// Setup order checkboxes
function setupOrderCheckboxes() {
    const orderCheckboxes = document.querySelectorAll('#ordersTableContainer .order-checkbox');
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

            syncCardFromTable(orderId);
            updateCompleteButton();
        });
    });
}

// Setup order list checkboxes
function setupOrderListCheckboxes() {
    const orderListCheckboxes = document.querySelectorAll('#ordersTableContainer .order-list-item-checkbox');
    orderListCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const orderId = parseInt(this.dataset.orderId);
            const orderRow = document.querySelector(`#ordersTableContainer tr[data-order-id="${orderId}"]`);
            if (!orderRow) return;
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

            syncCardFromTable(orderId);
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
    const anyChecked = document.querySelectorAll('#ordersTableContainer .order-checkbox:checked').length > 0;
    document.getElementById('btnComplete').disabled = !anyChecked;
}

// Complete work
async function completeWork() {
    // table rows only (the phone card is a copy of the same order — counting it would send the order twice)
    const checkedOrders = document.querySelectorAll('#ordersTableContainer .order-checkbox:checked');

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
            const doneIds = orders.map(o => o.orderId);
            cachedIncompleteOrders = cachedIncompleteOrders.filter(o => doneIds.indexOf(o.orderId) === -1);
            doneIds.forEach(id => { delete orderListItemsCache[id]; });
            const orderNoEl = document.getElementById('orderNo');
            const mobileEl = document.getElementById('mobileNo');
            if (orderNoEl) orderNoEl.value = '';
            if (mobileEl) mobileEl.value = '';
            const nameEl = document.getElementById('customerName');
            const addrEl = document.getElementById('address');
            if (nameEl) nameEl.value = '';
            if (addrEl) addrEl.value = '';
            currentPage = 1;
            await renderFromCache();
            refreshIncompleteCacheSilent();
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
    const isRecent = orderOrEl.isRecent === true || orderOrEl.dataset?.isRecent === '1' || (!isToday && !isOverdue);
    return filters.some(f =>
        (f === 'today' && isToday) ||
        (f === 'overdue' && isOverdue) ||
        (f === 'partly' && isPartly) ||
        (f === 'recent' && isRecent)
    );
}

function updateTotalCountText(visibleCount, searchTotal) {
    const totalCountEl = document.getElementById('totalCount');
    if (!totalCountEl) return;
    const lang = window.currentLang || 'bn';
    const filters = getActiveLegendFilters();
    const allTotal = typeof searchTotal === 'number' ? searchTotal : cachedIncompleteOrders.length;
    if (filters.length === 0) {
        totalCountEl.innerHTML = lang === 'en'
            ? `Total: <strong>${visibleCount}</strong> incomplete orders`
            : `সর্বমোট: <strong>${visibleCount}</strong> টি অর্ডারের কাজ অসম্পূর্ণ অবস্থায় আছে`;
        return;
    }
    totalCountEl.innerHTML = lang === 'en'
        ? `Showing: <strong>${visibleCount}</strong> of ${allTotal} incomplete orders`
        : `দেখানো হচ্ছে: <strong>${visibleCount}</strong> টি (মোট ${allTotal} টি অসম্পূর্ণ অর্ডার)`;
}

function applyLegendFilters() {
    renderFromCache();
}

function setupLegendFilters() {
    document.querySelectorAll('.legend-filter-cb').forEach(cb => {
        cb.addEventListener('change', async function() {
            currentPage = 1;
            if (this.value === 'recent' && this.checked) {
                try {
                    await ensureUpcomingOrdersLoaded();
                } catch (error) {
                    console.error('Error loading recent orders:', error);
                }
            }
            await renderFromCache();
        });
    });
}

function getFilteredOrders(sourceOrders) {
    const criteria = getSearchCriteria();
    const skipLegend = !!(criteria.orderNo || criteria.phone);
    const filters = skipLegend ? [] : getActiveLegendFilters();
    const list = sourceOrders || cachedIncompleteOrders || allLoadedOrders || [];
    return list
        .filter(order => orderMatchesSearch(order, criteria))
        .filter(order => orderMatchesLegendFilter(order, filters));
}

function getOrderDressItems(order) {
    if (orderListItemsCache[order.orderId] && orderListItemsCache[order.orderId].length) {
        return orderListItemsCache[order.orderId].map(item => ({
            orderListId: item.orderListId || 0,
            dressName: item.dressName,
            total: item.dressQuantity,
            pendingWork: item.remainingWork ?? item.pendingWork ?? 0
        }));
    }
    return (order.dressItems || []).map(item => ({
        orderListId: item.orderListId || 0,
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
        if (orderNo) queryParams += `&orderSerialNumbers=${encodeURIComponent(parseOrderNumbers(orderNo).join(','))}`;
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
    if (document.getElementById('filterRecent')?.checked) labels.push(lang === 'en' ? 'Recent orders' : 'সাপ্রতিক অর্ডার');
    return labels;
}

// Artisan name for one dress line of the list print — same source as the on-screen grid
// (ArtisanAssign / order-artisans = the currently assigned artisan). Falls back to the
// order's assigned names when the line id is unknown.
function printArtisanFor(order, item) {
    if (!window.ArtisanAssign) return '';
    if (item.orderListId) return ArtisanAssign.lineText(item.orderListId) || '';
    return ArtisanAssign.orderText(order.orderId) || '';
}

// ── print column visibility (remembered per shop, all shown by default) ──
const IW_PRINT_COLS = ['sl', 'no', 'name', 'phone', 'items', 'order', 'delivery'];
function iwPrintColsKey() {
    const inst = currentInstitutionId || sessionStorage.getItem('institutionId') || localStorage.getItem('session_institutionId') || '0';
    return 'tailorbd_iwPrintCols_' + inst;
}
// stored as the list of HIDDEN columns, so a column added later shows by default
function iwHiddenPrintCols() {
    try {
        const v = JSON.parse(localStorage.getItem(iwPrintColsKey()) || '[]');
        const hidden = Array.isArray(v) ? v.filter(k => IW_PRINT_COLS.includes(k)) : [];
        return hidden.length >= IW_PRINT_COLS.length ? [] : hidden;   // never all hidden
    } catch (e) { return []; }
}
function iwSyncPrintColBoxes() {
    const hidden = iwHiddenPrintCols();
    document.querySelectorAll('#iwPrintCols input[data-iw-col]').forEach(cb => { cb.checked = !hidden.includes(cb.dataset.iwCol); });
}
function iwBindPrintCols() {
    const wrap = document.getElementById('iwPrintCols');
    if (!wrap) return;
    iwSyncPrintColBoxes();
    const msg = document.getElementById('iwPrintColsMsg');
    wrap.addEventListener('change', e => {
        const cb = e.target.closest('input[data-iw-col]');
        if (!cb) return;
        const boxes = Array.from(wrap.querySelectorAll('input[data-iw-col]'));
        if (!boxes.some(b => b.checked)) {
            cb.checked = true;   // at least one column must stay
            if (msg) {
                msg.textContent = (window.currentLang || 'bn') === 'en' ? 'At least one column must stay' : 'অন্তত একটি কলাম রাখতে হবে';
                clearTimeout(iwBindPrintCols._t);
                iwBindPrintCols._t = setTimeout(() => { msg.textContent = ''; }, 2500);
            }
            return;
        }
        const hidden = boxes.filter(b => !b.checked).map(b => b.dataset.iwCol);
        try { localStorage.setItem(iwPrintColsKey(), JSON.stringify(hidden)); } catch (x) { }
    });
    // menu is position:fixed (the table container scrolls/clips), placed under the summary
    const menu = wrap.querySelector('.iw-print-cols-menu');
    const place = () => {
        if (!menu || !wrap.open) return;
        const r = wrap.querySelector('summary').getBoundingClientRect();
        const w = menu.offsetWidth || 160;
        menu.style.top = (r.bottom + 4) + 'px';
        menu.style.left = Math.max(4, Math.min(r.right - w, window.innerWidth - w - 4)) + 'px';
    };
    wrap.addEventListener('toggle', place);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    // close the menu when clicking elsewhere
    document.addEventListener('click', e => { if (wrap.open && !wrap.contains(e.target)) wrap.open = false; });
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

    const printArtisan = !!(window.ArtisanAssign && ArtisanAssign.printOn());
    const hiddenCols = iwHiddenPrintCols();
    const showCol = key => !hiddenCols.includes(key);
    const cell = (key, html) => showCol(key) ? html : '';
    const artisanLabel = lang === 'en' ? 'Artisan' : 'কারিগর';
    let rows = '';
    orders.forEach((order, index) => {
        const rowClass = getOrderRowClass(order);
        const items = getOrderDressItems(order);
        const itemsHtml = items.length
            ? `<ul class="iw-print-items">${items.map(item => {
                const artisan = printArtisan ? printArtisanFor(order, item) : '';
                return `<li>${escapeHtml(item.dressName)} — ${lang === 'en' ? 'Tot' : 'মো'}: ${item.total}, ${lang === 'en' ? 'Inc' : 'অসম্পূ'}: ${item.pendingWork}` +
                    (artisan ? `, <strong>${artisanLabel}: ${escapeHtml(artisan)}</strong>` : '') + `</li>`;
              }).join('')}</ul>`
            : '-';

        rows += `
            <tr class="${rowClass}">
                ${cell('sl', `<td class="num">${index + 1}</td>`)}
                ${cell('no', `<td class="num">${order.orderSerialNumber}</td>`)}
                ${cell('name', `<td>${escapeHtml(`(${order.customerNumber}) ${order.customerName}`)}</td>`)}
                ${cell('phone', `<td>${escapeHtml(order.phone || '-')}</td>`)}
                ${cell('items', `<td>${itemsHtml}</td>`)}
                ${cell('order', `<td class="num">${formatDate(order.orderDate)}</td>`)}
                ${cell('delivery', `<td class="num">${order.deliveryDate ? formatDate(order.deliveryDate) : '-'}</td>`)}
            </tr>`;
    });

    printArea.innerHTML = `
        <table class="iw-print-table">
            <thead>
                <tr>
                    ${cell('sl', `<th>${lang === 'en' ? 'SL' : 'ক্রম'}</th>`)}
                    ${cell('no', `<th>${lang === 'en' ? 'No.' : 'নং'}</th>`)}
                    ${cell('name', `<th>${lang === 'en' ? 'Name' : 'নাম'}</th>`)}
                    ${cell('phone', `<th>${lang === 'en' ? 'Phone' : 'মোবাইল'}</th>`)}
                    ${cell('items', `<th>${lang === 'en' ? 'Order List' : 'অর্ডার লিস্ট'}</th>`)}
                    ${cell('order', `<th>${lang === 'en' ? 'Order' : 'অর্ডার'}</th>`)}
                    ${cell('delivery', `<th>${lang === 'en' ? 'Delivery' : 'ডেলিভারি'}</th>`)}
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
        iwSyncPrintColBoxes();
        await loadInstitutionInfoForPrint();
        fillPrintHeader();
        const orders = getFilteredOrders(await fetchAllOrdersForPrint());
        if (!orders.length) {
            alert(lang === 'en' ? 'No orders to print' : 'প্রিন্ট করার মতো কোন অর্ডার নেই');
            return;
        }
        if (window.ArtisanAssign) {
            const cb = document.getElementById('iwPrintArtisan');
            if (cb) cb.checked = ArtisanAssign.printOn();   // keep the tick box in sync with the saved choice
        }
        if (window.ArtisanAssign && ArtisanAssign.printOn()) {
            // make sure every dress line has its OrderListID (orders not yet shown on screen)
            try { await ensureOrderListCache(orders); } catch (e) { console.warn('order-list load for print failed', e); }
            // fresh (not 60s-cached) assignment so the print shows the currently assigned artisan
            const ok = await ArtisanAssign.load(orders.map(order => order.orderId), { force: true });
            if (!ok) console.warn('Artisan names could not be loaded for print');
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

document.addEventListener('DOMContentLoaded', function () {
    if (window.ArtisanAssign) ArtisanAssign.bindToggle('#iwPrintArtisan');
    iwBindPrintCols();
});

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
