// Order List Page JavaScript
function orderListData() {
    return {
        searchType: 'number',
        isLoading: false,
        orders: [],
        totalCount: 0,
        currentPage: 1,
        pageSize: 100,
        totalPages: 0,
        currentLang: window.currentLang || 'bn',
        filters: {
            phone: '',
            orderSerialNumber: '',
            customerName: '',
            address: '',
            startDate: '',
            endDate: ''
        },

        async init() {
            console.log('Order List: Initializing...');
            
            // Check authentication
            const isLoggedIn = sessionStorage.getItem('isLoggedIn');
            const institutionId = sessionStorage.getItem('institutionId');
            
            console.log('Auth Check:', { isLoggedIn, institutionId });
            
            if (!isLoggedIn || isLoggedIn !== 'true') {
                console.log('Not logged in, redirecting to login');
                window.location.href = 'login.html';
                return;
            }

            if (!institutionId) {
                console.log('No institution ID, redirecting to login');
                window.location.href = 'login.html';
                return;
            }

            console.log('Auth check passed, loading orders');

            // Listen for language changes and update reactive currentLang
            const self = this;
            $(document).on('languageChanged', function(e, lang) {
                self.currentLang = lang;
            });
            
            // Load initial orders (pending orders)
            await this.searchOrders();
            
            // Initialize autocomplete after DOM is ready
            this.$nextTick(() => {
                setTimeout(() => {
                    this.initializeAutocomplete();
                }, 100);
            });
        },

        initializeAutocomplete() {
            const institutionId = sessionStorage.getItem('institutionId');
            const self = this; // Store reference to Alpine.js component
            
            // Check if jQuery UI autocomplete is available
            if (typeof $.fn.autocomplete !== 'function') {
                console.warn('jQuery UI autocomplete not available');
                return;
            }
            
            // Phone autocomplete
            const phoneInput = $('#phoneInput');
            if (phoneInput.length) {
                phoneInput.autocomplete({
                    source: async function(request, response) {
                        try {
                            const result = await fetch(`/api/orders/autocomplete?institutionId=${institutionId}&field=phone&term=${encodeURIComponent(request.term)}`);
                            const data = await result.json();
                            response(data.success ? data.data : []);
                        } catch (error) {
                            console.error('Phone autocomplete error:', error);
                            response([]);
                        }
                    },
                    minLength: 2,
                    select: function(event, ui) {
                        // Update Alpine.js model
                        self.filters.phone = ui.item.value;
                        return false; // Prevent default behavior
                    }
                });
            }

            // Order number autocomplete
            const orderNumberInput = $('#orderNumberInput');
            if (orderNumberInput.length) {
                console.log('Initializing order number autocomplete');
                orderNumberInput.autocomplete({
                    source: async function(request, response) {
                        console.log('Order number autocomplete triggered with term:', request.term);
                        try {
                            const url = `/api/orders/autocomplete?institutionId=${institutionId}&field=ordernumber&term=${encodeURIComponent(request.term)}`;
                            console.log('Fetching:', url);
                            const result = await fetch(url);
                            console.log('Response status:', result.status);
                            const data = await result.json();
                            console.log('Order number suggestions:', data);
                            response(data.success ? data.data : []);
                        } catch (error) {
                            console.error('Order number autocomplete error:', error);
                            response([]);
                        }
                    },
                    minLength: 1,
                    select: function(event, ui) {
                        console.log('Order number selected:', ui.item.value);
                        // Update Alpine.js model
                        self.filters.orderSerialNumber = ui.item.value;
                        return false;
                    },
                    response: function(event, ui) {
                        console.log('Autocomplete response received:', ui.content);
                    },
                    open: function() {
                        console.log('Autocomplete menu opened');
                    },
                    close: function() {
                        console.log('Autocomplete menu closed');
                    }
                });
                
                // Force autocomplete to show on input
                orderNumberInput.on('input', function() {
                    console.log('Input event fired, current value:', $(this).val());
                    $(this).autocomplete('search', $(this).val());
                });
            } else {
                console.warn('Order number input not found');
            }

            // Customer name autocomplete
            const customerNameInput = $('#customerNameInput');
            if (customerNameInput.length) {
                customerNameInput.autocomplete({
                    source: async function(request, response) {
                        try {
                            const result = await fetch(`/api/orders/autocomplete?institutionId=${institutionId}&field=customername&term=${encodeURIComponent(request.term)}`);
                            const data = await result.json();
                            response(data.success ? data.data : []);
                        } catch (error) {
                            console.error('Customer name autocomplete error:', error);
                            response([]);
                        }
                    },
                    minLength: 2,
                    select: function(event, ui) {
                        // Update Alpine.js model
                        self.filters.customerName = ui.item.value;
                        return false;
                    }
                });
            }

            // Address autocomplete
            const addressInput = $('#addressInput');
            if (addressInput.length) {
                addressInput.autocomplete({
                    source: async function(request, response) {
                        try {
                            const result = await fetch(`/api/orders/autocomplete?institutionId=${institutionId}&field=address&term=${encodeURIComponent(request.term)}`);
                            const data = await result.json();
                            response(data.success ? data.data : []);
                        } catch (error) {
                            console.error('Address autocomplete error:', error);
                            response([]);
                        }
                    },
                    minLength: 2,
                    select: function(event, ui) {
                        // Update Alpine.js model
                        self.filters.address = ui.item.value;
                        return false;
                    }
                });
            }
            
            console.log('Autocomplete initialized successfully');
        },

        onSearchTypeChange() {
            console.log('Search type changed to:', this.searchType);
            // Clear filters when switching search type
            this.filters = {
                phone: '',
                orderSerialNumber: '',
                customerName: '',
                address: '',
                startDate: '',
                endDate: ''
            };
            this.currentPage = 1;
        },

        clearOtherFields(currentField) {
            // Clear other fields when typing in one field
            if (currentField !== 'phone') this.filters.phone = '';
            if (currentField !== 'orderNo') this.filters.orderSerialNumber = '';
            if (currentField !== 'name') this.filters.customerName = '';
            if (currentField !== 'address') this.filters.address = '';
        },

        async searchOrders() {
            this.isLoading = true;
            console.log('Searching orders...');

            try {
                // Get institution ID from sessionStorage
                const institutionId = sessionStorage.getItem('institutionId');
                console.log('Institution ID:', institutionId);
                
                if (!institutionId) {
                    console.error('No institution ID found');
                    window.location.href = 'login.html';
                    return;
                }

                // Build query parameters
                const params = new URLSearchParams({
                    institutionId: institutionId,
                    page: this.currentPage,
                    pageSize: this.pageSize
                });

                // Add filters based on search type
                if (this.searchType === 'number') {
                    if (this.filters.phone) params.append('phone', this.filters.phone);
                    if (this.filters.orderSerialNumber) params.append('orderSerialNumber', this.filters.orderSerialNumber);
                    if (this.filters.customerName) params.append('customerName', this.filters.customerName);
                    if (this.filters.address) params.append('address', this.filters.address);
                } else {
                    if (this.filters.startDate) params.append('startDate', this.filters.startDate);
                    if (this.filters.endDate) params.append('endDate', this.filters.endDate);
                }

                const url = `/api/orders/search?${params.toString()}`;
                console.log('Fetching:', url);

                const response = await fetch(url);
                console.log('Response status:', response.status);
                console.log('Response OK:', response.ok);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('API Error Response:', errorText);
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }

                const result = await response.json();
                console.log('API Result:', result);

                if (result.success) {
                    const today = new Date();
                    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

                    this.orders = result.data.orders.map(order => {
                        const orderDateStr = order.orderDate ? order.orderDate.substring(0, 10) : '';
                        order.isToday = orderDateStr === todayStr;
                        return order;
                    });
                    this.totalCount = result.data.totalCount;
                    this.totalPages = result.data.totalPages;
                    console.log(`Loaded ${this.orders.length} orders (Total: ${this.totalCount}, Pages: ${this.totalPages})`);
                    console.log('Current Page:', this.currentPage, 'Total Pages:', this.totalPages);
                    
                    // Debug: Log first order to check orderId
                    if (this.orders.length > 0) {
                        console.log('First order:', this.orders[0]);
                        console.log('First order ID:', this.orders[0].orderId);
                    }
                } else {
                    console.error('Failed to load orders:', result.message);
                    this.showNotification('অর্ডার লোড করতে ব্যর্থ হয়েছে: ' + (result.message || 'Unknown error'), 'error');
                }
            } catch (error) {
                console.error('Error loading orders:', error);
                console.error('Error stack:', error.stack);
                this.showNotification('অর্ডার লোড করতে সমস্যা হয়েছে: ' + error.message, 'error');
            } finally {
                this.isLoading = false;
            }
        },

        async changePage(newPage) {
            if (newPage < 1 || newPage > this.totalPages) return;
            
            this.currentPage = newPage;
            await this.searchOrders();
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },

        formatDate(dateString) {
            if (!dateString) return '';
            
            const date = new Date(dateString);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const day = date.getDate();
            const month = months[date.getMonth()];
            const year = date.getFullYear();
            
            return `${day} ${month} ${year}`;
        },

        showNotification(message, type = 'info') {
            // Show toast notification instead of alert (alert can block browsers)
            const existing = document.getElementById('order-list-toast');
            if (existing) existing.remove();

            const color = type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#6c7ae0';
            const toast = document.createElement('div');
            toast.id = 'order-list-toast';
            toast.style.cssText = `position:fixed;top:70px;right:20px;z-index:9999;background:${color};color:#fff;
                padding:10px 18px;border-radius:6px;font-size:13px;max-width:320px;box-shadow:0 4px 12px rgba(0,0,0,0.2);`;
            toast.textContent = message;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 5000);
        }
    };
}
