// Dress & Measurements - TailorBD
(function() {
    'use strict';

    // Global variables
    let customerData = null;
    let currentDressId = 0;
    let measurements = [];
    let styles = [];
    let priceList = [];
    let orderCart = [];
    let savedPrices = [];
    let dressDetails = '';

    // URL Parameters
    const urlParams = new URLSearchParams(window.location.search);
    const customerId = urlParams.get('customerId');
    const clothForId = urlParams.get('clothForId');
    const orderId = urlParams.get('orderId'); // For adding to existing order

    $(document).ready(function() {
        // Debug: Check session data
        console.log('=== SESSION DEBUG INFO ===');
        console.log('institutionId (sessionStorage):', sessionStorage.getItem('institutionId'));
        console.log('registrationId (sessionStorage):', sessionStorage.getItem('registrationId'));
        console.log('isLoggedIn (sessionStorage):', sessionStorage.getItem('isLoggedIn'));
        
        // Debug: Check URL parameters
        console.log('customerId (URL):', customerId);
        console.log('clothForId (URL):', clothForId);
        
        // Check cookies
        const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
            const [key, value] = cookie.split('=');
            acc[key] = value;
            return acc;
        }, {});
        console.log('InstitutionID (cookie):', cookies['InstitutionID']);
        console.log('RegistrationID (cookie):', cookies['RegistrationID']);
        console.log('All cookies:', cookies);
        
        // Fix undefined cookies - if cookies have "undefined" string, remove them
        if (cookies['InstitutionID'] === 'undefined') {
            document.cookie = 'InstitutionID=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            console.log('Removed invalid InstitutionID cookie');
        }
        if (cookies['RegistrationID'] === 'undefined') {
            document.cookie = 'RegistrationID=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            console.log('Removed invalid RegistrationID cookie');
        }
        
        // Ensure sessionStorage has valid data
        const sessionInstitutionId = sessionStorage.getItem('institutionId');
        const sessionRegistrationId = sessionStorage.getItem('registrationId');
        
        if (!sessionInstitutionId || sessionInstitutionId === 'null' || sessionInstitutionId === 'undefined') {
            console.error('Invalid institutionId in sessionStorage');
            window.location.href = '/login.html';
            return;
        }
        
        if (!sessionRegistrationId || sessionRegistrationId === 'null' || sessionRegistrationId === 'undefined') {
            console.error('Invalid registrationId in sessionStorage');
            window.location.href = '/login.html';
            return;
        }
        
        console.log('=========================');
        
        // Validate parameters
        if (!customerId || !clothForId) {
            console.error('Invalid URL parameters - customerId:', customerId, 'clothForId:', clothForId);
            showAlert('error', 'Invalid parameters');
            setTimeout(() => {
                window.location.href = '/new-order.html';
            }, 2000);
            return;
        }

        // Check if we're adding to existing order
        if (orderId) {
            console.log('Adding to existing order:', orderId);
            loadExistingOrderDetails();
        }

        // Load data
        loadCustomerInfo();
        loadDresses();
        
        // Only load order cart if NOT adding to existing order
        if (!orderId) {
            loadOrderCart();
        }

        // Setup event listeners
        setupEventListeners();
        
        // Update language content after components are loaded
        setTimeout(function() {
            if (window.updateLanguage) {
                window.updateLanguage();
            }
            // Update dress select placeholder
            updateDressSelectPlaceholder();
        }, 500);
        
        // Listen for language change events
        $(document).on('languageChanged', function() {
            updateDressSelectPlaceholder();
            displayOrderCart(); // Re-render cart with new language
        });
    });

    function setupEventListeners() {
        // Quantity change updates price list
        $('#dressQuantity').on('input', function() {
            updatePriceQuantities();
        });

        // ── Fabric code input ─────────────────────────────────────────────────
        let fabricDebounce = null;

        $('#fabricCodeInput')
            // Barcode scanner sends Enter after code — auto-add immediately
            .on('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    clearTimeout(fabricDebounce);
                    searchFabricByCode(true); // true = auto-add
                }
            })
            // Manual typing — debounce 600ms then search & show result (don't auto-add)
            .on('input', function() {
                clearTimeout(fabricDebounce);
                const val = this.value.trim();
                setFabricInputState('idle');
                $('#fabricSearchResult').hide();

                if (!val) return;

                setFabricInputState('searching');
                fabricDebounce = setTimeout(() => {
                    searchFabricByCode(false); // false = show result, don't auto-add
                }, 600);
            });

        // Disable back button
        preventBackNavigation();
    }

    // icon states for fabric input
    window.setFabricInputState = function(state) {
        const $icon   = $('#fabricInputIcon i');
        const $status = $('#fabricInputStatus');
        const $input  = $('#fabricCodeInput');
        const lang    = window.currentLang === 'en' ? 'en' : 'bn';
        const addedText = lang === 'en' ? 'Added' : 'যুক্ত হয়েছে';

        $input.removeClass('is-valid is-invalid');
        if (state === 'searching') {
            $icon.attr('class', 'fas fa-spinner fa-spin text-primary');
            $status.html('');
        } else if (state === 'found') {
            $icon.attr('class', 'fas fa-check-circle text-success');
            $input.addClass('is-valid');
        } else if (state === 'added') {
            $icon.attr('class', 'fas fa-check-double text-success');
            $input.addClass('is-valid');
            $status.html(`<span class="fabric-added-badge"><i class="fas fa-check me-1"></i>${addedText}</span>`);
            setTimeout(() => { $status.html(''); setFabricInputState('idle'); }, 2000);
        } else if (state === 'notfound') {
            $icon.attr('class', 'fas fa-times-circle text-danger');
            $input.addClass('is-invalid');
            $status.html('');
        } else {
            $icon.attr('class', 'fas fa-barcode');
            $status.html('');
        }
    }

    // ── Fabric / Item Code search ─────────────────────────────────────────────
    window.searchFabricByCode = function(autoAdd) {
        const code = $('#fabricCodeInput').val().trim();
        if (!code) return;

        const institutionId = sessionStorage.getItem('institutionId');
        const $result = $('#fabricSearchResult');
        const lang = window.currentLang === 'en' ? 'en' : 'bn';

        const t = {
            notFound:  lang === 'en' ? 'Item not found' : 'আইটেম পাওয়া যায়নি',
            stock:     lang === 'en' ? 'Stock:' : 'স্টক:',
            addBtn:    lang === 'en' ? 'Add' : 'যুক্ত করুন',
        };

        setFabricInputState('searching');

        $.ajax({
            url: `/api/ItemStock/by-code?code=${encodeURIComponent(code)}&institutionId=${institutionId}`,
            method: 'GET',
            success: function(response) {
                if (response.success && response.data) {
                    const item       = response.data;
                    const fabricId   = item.fabricID         || item.FabricID;
                    const fabricCode = item.fabricCode       || item.FabricCode;
                    const fabricName = item.fabricName       || item.FabricName;
                    const unitPrice  = item.sellingUnitPrice || item.SellingUnitPrice || 0;
                    const stockQty   = item.stockQty         || item.StockQty         || 0;
                    const unitName   = item.unitName         || item.UnitName         || '';

                    if (autoAdd) {
                        addFabricToPrice(`${fabricCode}: ${fabricName}`, unitPrice, fabricId);
                        setFabricInputState('added');
                        $('#fabricCodeInput').val('');
                        $result.hide();
                    } else {
                        setFabricInputState('found');
                        $result.html(`
                            <div class="fabric-found-card">
                                <div class="fabric-found-info">
                                    <span class="fabric-code-badge">${fabricCode}</span>
                                    <strong>${fabricName}</strong>
                                    <span class="fabric-stock ${stockQty > 0 ? 'in-stock' : 'out-stock'}">
                                        ${t.stock} ${stockQty} ${unitName}
                                    </span>
                                </div>
                                <div class="fabric-found-price">
                                    <span class="fw-bold">৳${unitPrice} / ${unitName}</span>
                                    <button class="btn btn-sm btn-success ms-2"
                                            onclick="addFabricToPrice('${fabricCode}: ${fabricName}', ${unitPrice}, ${fabricId}); $('#fabricCodeInput').val(''); $('#fabricSearchResult').hide(); setFabricInputState('added');">
                                        <i class="fas fa-plus me-1"></i>${t.addBtn}
                                    </button>
                                </div>
                            </div>`).show();
                    }
                } else {
                    setFabricInputState('notfound');
                    $result.html(`<span class="text-danger"><i class="fas fa-times-circle me-1"></i>${t.notFound}</span>`).show();
                }
            },
            error: function(xhr) {
                setFabricInputState('notfound');
                $result.html(`<span class="text-danger"><i class="fas fa-times-circle me-1"></i>${t.notFound}</span>`).show();
            }
        });
    };

    // Add fabric to price list
    window.addFabricToPrice = function(label, unitPrice, fabricId) {
        const quantity = parseInt($('#dressQuantity').val()) || 1;

        // Check duplicate
        if (priceList.some(p => p.fabricId === fabricId)) {
            showAlert('warning', 'এই আইটেমটি ইতিমধ্যে যোগ করা হয়েছে');
            return;
        }

        priceList.push({
            for:       label,
            unitPrice: parseFloat(unitPrice),
            quantity:  quantity,
            fabricId:  fabricId
        });

        displayPriceList();

        // Clear search
        $('#fabricCodeInput').val('');
        $('#fabricSearchResult').hide();
    };

    // Load customer information
    function loadCustomerInfo() {
        const institutionId = sessionStorage.getItem('institutionId');

        $.ajax({
            url: `/api/customers/${customerId}?institutionId=${institutionId}`,
            method: 'GET',
            success: function(response) {
                if (response.success && response.data) {
                    customerData = response.data;
                    displayCustomerInfo();
                } else {
                    showAlert('error', 'Failed to load customer information');
                }
            },
            error: function(xhr) {
                console.error('Error loading customer:', xhr);
                showAlert('error', 'Failed to load customer information');
            }
        });
    }

    function displayCustomerInfo() {
        const { customerName, customerNumber, phone, address } = customerData;
        
        // Display name
        $('#customerNameDisplay').text(customerName || 'N/A');
        
        // Display avatar initials
        const initials = (customerName || 'NA')
            .split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
        $('#customerAvatarLarge').text(initials);
        
        // Display badges
        $('#customerNumberDisplay').text(customerNumber || 'N/A');
        $('#customerPhoneDisplay').text(phone || 'N/A');
        $('#customerAddressDisplay').text(address || 'No address');
        
        // Get order number from institution
        getOrderNumber();
    }

    function getOrderNumber() {
        const institutionId = sessionStorage.getItem('institutionId');

        $.ajax({
            url: `/api/institution/${institutionId}`,
            method: 'GET',
            success: function(response) {
                if (response.success && response.data) {
                    const orderNo = (response.data.totalOrder || 0) + 1;
                    $('#orderNumberDisplay').text(orderNo);
                }
            },
            error: function(xhr) {
                console.error('Error getting order number:', xhr);
            }
        });
    }

    // Load dresses
    function loadDresses() {
        const institutionId = sessionStorage.getItem('institutionId');

        $.ajax({
            url: `/api/dresses?institutionId=${institutionId}&clothForId=${clothForId}`,
            method: 'GET',
            success: function(response) {
                if (response.success && response.data) {
                    displayDresses(response.data);
                } else {
                    showAlert('error', 'Failed to load dresses');
                }
            },
            error: function(xhr) {
                console.error('Error loading dresses:', xhr);
                showAlert('error', 'Failed to load dresses');
            }
        });
    }

    function displayDresses(dresses) {
        const $select = $('#dressSelect');
        $select.find('option:not(:first)').remove();

        dresses.forEach(dress => {
            const dressId = dress.dressID || dress.DressID;
            const dressName = dress.dressName || dress.Dress_Name || dress.dress_Name;
            
            $select.append(`<option value="${dressId}">${dressName}</option>`);
        });
        
        // Check which dresses have measurements for this customer
        checkDressesWithMeasurements(dresses);
    }
    
    // Check which dresses have measurements for this customer
    function checkDressesWithMeasurements(dresses) {
        const institutionId = sessionStorage.getItem('institutionId');
        
        // Get list of dress IDs that have measurements
        $.ajax({
            url: `/api/measurement/customer-dresses-with-measurements?customerId=${customerId}&institutionId=${institutionId}`,
            method: 'GET',
            success: function(response) {
                if (response.success && response.data) {
                    const dressesWithMeasurements = response.data;
                    console.log('Dresses with measurements:', dressesWithMeasurements);
                    
                    // Mark those options with orange background
                    dressesWithMeasurements.forEach(dressId => {
                        $(`#dressSelect option[value="${dressId}"]`).addClass('has-measurement');
                    });
                }
            },
            error: function(xhr) {
                console.log('Could not check for existing measurements:', xhr);
                // Non-critical error, just log it
            }
        });
    }

    // Select dress and load measurements/styles
    window.selectDress = function() {
        const dressId = $('#dressSelect').val();
        
        if (dressId == 0) {
            $('#measurementSection').hide();
            currentDressId = 0;
            return;
        }

        currentDressId = dressId;
        loadDressMeasurementsAndStyles(dressId);
        loadSavedPrices(dressId);
        $('#measurementSection').show();
    };

    function loadDressMeasurementsAndStyles(dressId) {
        const institutionId = sessionStorage.getItem('institutionId');

        // Show loading
        $('#measurementGrid').html('<div class="loading-spinner"><div class="spinner-border text-primary"></div><p>Loading...</p></div>');
        $('#stylesContainer').html('');

        $.ajax({
            url: `/api/measurement/dress-measurements-styles?dressId=${dressId}&customerId=${customerId}&institutionId=${institutionId}`,
            method: 'GET',
            success: function(response) {
                if (response.success && response.data) {
                    measurements = response.data.measurementGroups || [];
                    styles = response.data.styleGroups || [];
                    dressDetails = response.data.orderDetails || '';
                    
                    displayMeasurements();
                    displayStyles();
                    $('#dressDetails').val(dressDetails);
                } else {
                    showAlert('error', 'Failed to load measurements and styles');
                }
            },
            error: function(xhr) {
                console.error('Error loading measurements and styles:', xhr);
                showAlert('error', 'Failed to load measurements and styles');
                $('#measurementGrid').html('<p class="text-center text-muted">Failed to load measurements</p>');
            }
        });
    }

    function displayMeasurements() {
        const $grid = $('#measurementGrid');
        $grid.empty();

        if (!measurements || measurements.length === 0) {
            $grid.html('<p class="text-center text-muted">No measurements available</p>');
            return;
        }

        measurements.forEach(group => {
            const groupMeasurements = group.measurements || group.Measurements || [];
            
            if (groupMeasurements.length === 0) return;

            const $groupDiv = $('<div class="measurement-group"></div>');

            groupMeasurements.forEach(m => {
                const measurementId = m.measurementTypeID || m.MeasurementTypeID;
                const measurementType = m.measurementType || m.MeasurementType;
                const measurement = m.measurement || m.Measurement || '';

                $groupDiv.append(`
                    <div class="measurement-item">
                        <label class="measurement-label">${measurementType}</label>
                        <input type="text" 
                               class="measurement-input" 
                               data-measurement-id="${measurementId}"
                               value="${measurement}"
                               placeholder="মাপ দিন...">
                    </div>
                `);
            });

            $grid.append($groupDiv);
        });
    }

    function displayStyles() {
        const $container = $('#stylesContainer');
        $container.empty();

        if (!styles || styles.length === 0) {
            $('#stylesCardWrapper').hide();
            return;
        }

        $('#stylesCardWrapper').show();

        styles.forEach(category => {
            const categoryId = category.dressStyleCategoryId || category.DressStyleCategoryId;
            const categoryName = category.dressStyleCategoryName || category.DressStyleCategoryName;
            const categoryStyles = category.styles || category.Styles || [];

            if (categoryStyles.length === 0) return;

            const $categoryDiv = $(`
                <div class="style-category">
                    <div class="style-category-header">${categoryName}</div>
                    <div class="style-category-body">
                        <div class="style-grid" id="styleGrid${categoryId}"></div>
                    </div>
                </div>
            `);

            const $styleGrid = $categoryDiv.find('.style-grid');

            categoryStyles.forEach(style => {
                const styleId = style.dressStyleId || style.DressStyleId;
                const styleName = style.dressStyleName || style.DressStyleName;
                const styleMeasurement = style.dressStyleMesurement || style.dressStyleMeasurement || '';
                const isCheck = style.isCheck || style.IsCheck || false;

                const $styleItem = $(`
                    <div class="style-item ${isCheck ? 'selected' : ''}" data-style-id="${styleId}">
                        <img class="style-image" src="/Handler/Style_Name.ashx?Img=${styleId}" 
                             alt="${styleName}" onerror="this.style.display='none'">
                        <div class="style-checkbox">
                            <input type="checkbox" id="style${styleId}" ${isCheck ? 'checked' : ''}>
                            <label for="style${styleId}">${styleName}</label>
                        </div>
                        <input type="text" 
                               class="style-measurement" 
                               placeholder="মাপ..."
                               value="${styleMeasurement}">
                    </div>
                `);

                // Toggle selection on click
                $styleItem.on('click', function(e) {
                    if ($(e.target).is('input')) return;
                    
                    const $checkbox = $(this).find('input[type="checkbox"]');
                    $checkbox.prop('checked', !$checkbox.prop('checked'));
                    $(this).toggleClass('selected');
                });

                $styleGrid.append($styleItem);
            });

            $container.append($categoryDiv);
        });
    }

    // Load saved prices for dress
    function loadSavedPrices(dressId) {
        const institutionId = sessionStorage.getItem('institutionId');

        $.ajax({
            url: `/api/dressprice?institutionId=${institutionId}&dressId=${dressId}`,
            method: 'GET',
            success: function(response) {
                if (response.success && response.data) {
                    savedPrices = response.data;
                    displaySavedPrices();
                }
            },
            error: function(xhr) {
                console.error('Error loading saved prices:', xhr);
            }
        });
    }

    function displaySavedPrices() {
        const $select = $('#savedPrices');
        $select.find('option:not(:first)').remove();

        savedPrices.forEach(price => {
            // Handle different possible property names (case-sensitive)
            const priceFor = price.Price_For || price.price_For || price.PriceFor || price.priceFor || 'Unknown';
            const priceValue = price.Price || price.price || 0;
            
            console.log('Price object:', price); // Debug log
            
            $select.append(`<option value="${priceValue}">${priceFor}</option>`);
        });
    }

    window.selectSavedPrice = function() {
        const $select = $('#savedPrices');
        const selectedPrice = $select.val();
        
        if (!selectedPrice) return;

        const selectedText = $select.find('option:selected').text();
        
        $('#priceFor').val(selectedText);
        $('#priceAmount').val(selectedPrice);
        
        // Auto add
        addPrice();
        
        // Reset select
        $select.val('');
    };

    // Add price to list
    window.addPrice = function() {
        const priceFor = $('#priceFor').val().trim();
        const priceAmount = parseFloat($('#priceAmount').val());
        const quantity = parseInt($('#dressQuantity').val()) || 1;

        if (!priceFor || !priceAmount || priceAmount <= 0) {
            showAlert('warning', 'দয়া করে সব তথ্য পূরণ করুন');
            return;
        }

        // Check if already exists
        const exists = priceList.some(p => p.for.toLowerCase() === priceFor.toLowerCase());
        if (exists) {
            showAlert('warning', 'এই আইটেমটি ইতিমধ্যে যোগ করা হয়েছে');
            return;
        }

        priceList.push({
            for: priceFor,
            unitPrice: priceAmount,
            quantity: quantity
        });

        displayPriceList();
        
        // Clear inputs
        $('#priceFor').val('');
        $('#priceAmount').val('');
    };

    function displayPriceList() {
        const $tbody = $('#priceListBody');
        $tbody.empty();

        if (priceList.length === 0) {
            $('#priceListSection').hide();
            return;
        }

        $('#priceListSection').show();

        let grandTotal = 0;

        priceList.forEach((item, index) => {
            const total = item.unitPrice * item.quantity;
            grandTotal += total;

            $tbody.append(`
                <tr>
                    <td>${item.for}</td>
                    <td>৳${formatNumber(item.unitPrice)}</td>
                    <td>
                        <input type="number" 
                               class="price-quantity-input" 
                               value="${item.quantity}" 
                               min="1"
                               onchange="updatePriceQuantity(${index}, this.value)">
                    </td>
                    <td>৳${formatNumber(total)}</td>
                    <td>
                        <span class="btn-delete-price" onclick="removePrice(${index})">
                            <i class="fas fa-trash"></i>
                        </span>
                    </td>
                </tr>
            `);
        });

        $('#grandTotal').text('৳' + formatNumber(grandTotal));
    }

    window.updatePriceQuantity = function(index, newQuantity) {
        priceList[index].quantity = parseInt(newQuantity) || 1;
        displayPriceList();
    };

    window.removePrice = function(index) {
        priceList.splice(index, 1);
        displayPriceList();
    };

    function updatePriceQuantities() {
        const newQuantity = parseInt($('#dressQuantity').val()) || 1;
        
        priceList.forEach(item => {
            item.quantity = newQuantity;
        });

        displayPriceList();
    };

    // Add dress to order
    window.addDressToOrder = function() {
        const quantity = parseInt($('#dressQuantity').val());
        
        if (!quantity || quantity <= 0) {
            showAlert('warning', 'দয়া করে মোট পোশাক দিন');
            return;
        }

        // Validate required session data
        const institutionId = sessionStorage.getItem('institutionId');
        const registrationId = sessionStorage.getItem('registrationId');

        if (!institutionId || !registrationId) {
            showAlert('error', 'Session expired. Please login again.');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
            return;
        }

        // Collect measurements
        const collectedMeasurements = [];
        $('.measurement-input').each(function() {
            const value = $(this).val().trim();
            if (value) {
                collectedMeasurements.push({
                    id: $(this).data('measurement-id'),
                    value: value
                });
            }
        });

        // Collect styles
        const collectedStyles = [];
        $('.style-item input[type="checkbox"]:checked').each(function() {
            const $item = $(this).closest('.style-item');
            const measurement = $item.find('.style-measurement').val().trim();
            
            collectedStyles.push({
                id: $(this).attr('id').replace('style', ''),
                value: measurement
            });
        });

        // Get details
        const details = $('#dressDetails').val().trim();

        // Prepare order data
        const orderData = {
            dressId: currentDressId,
            dressName: $('#dressSelect option:selected').text(),
            quantity: quantity,
            details: details,
            measurements: collectedMeasurements,
            styles: collectedStyles,
            payments: priceList
        };

        // Save to order cart
        saveToOrderCart(orderData);
    };

    function saveToOrderCart(orderData) {
        console.log('=== saveToOrderCart called ===');
        console.log('Order Data received:', orderData);
        console.log('Current order cart:', orderCart);
        
        // ✅ Check if this dress is already in the cart
        const existingItem = orderCart.find(item => item.dressId === orderData.dressId);
        if (existingItem) {
            showAlert('warning', 'এই পোশাকটি ইতিমধ্যে যুক্ত করা আছে। আপনি চাইলে order-edit page থেকে এটি পরিবর্তন করতে পারবেন।');
            $('button[onclick="addDressToOrder()"]').prop('disabled', false);
            return;
        }
        
        // Get from sessionStorage (primary source)
        let institutionId = sessionStorage.getItem('institutionId');
        let registrationId = sessionStorage.getItem('registrationId');
        
        console.log('Session data - institutionId:', institutionId, 'registrationId:', registrationId);
        
        // Validate and clean the values
        if (!institutionId || institutionId === 'null' || institutionId === 'undefined' || institutionId === '') {
            console.error('Invalid institutionId from sessionStorage:', institutionId);
            showAlert('error', 'Session expired. Please login again.');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
            return;
        }
        
        if (!registrationId || registrationId === 'null' || registrationId === 'undefined' || registrationId === '') {
            console.error('Invalid registrationId from sessionStorage:', registrationId);
            showAlert('error', 'Session expired. Please login again.');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
            return;
        }

        // Parse to integers to ensure they are valid numbers
        const parsedInstitutionId = parseInt(institutionId, 10);
        const parsedRegistrationId = parseInt(registrationId, 10);
        
        if (isNaN(parsedInstitutionId) || parsedInstitutionId <= 0) {
            console.error('Invalid institutionId value:', institutionId);
            showAlert('error', 'Invalid session data. Please login again.');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
            return;
        }
        
        if (isNaN(parsedRegistrationId) || parsedRegistrationId <= 0) {
            console.error('Invalid registrationId value:', registrationId);
            showAlert('error', 'Invalid session data. Please login again.');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
            return;
        }

        // Prepare payment data with proper number formatting
        const paymentData = orderData.payments.map(p => {
            const unitPrice = parseFloat(p.unitPrice);
            const quantity = parseInt(p.quantity);
            return {
                For:       String(p.for),
                Unit_Price: Number(unitPrice.toFixed(2)),
                Quantity:  quantity,
                FabricID:  p.fabricId ? parseInt(p.fabricId) : null
            };
        });

        // Prepare API data - match C# model property names exactly
        const apiData = {
            InstitutionID: parsedInstitutionId,
            RegistrationID: parsedRegistrationId,
            Cloth_For_ID: parseInt(clothForId),
            CustomerID: parseInt(customerId),
            DressID: parseInt(orderData.dressId),
            DressQuantity: parseInt(orderData.quantity),
            Details: String(orderData.details || ''),
            List_Measurement: JSON.stringify(orderData.measurements),
            List_Style: JSON.stringify(orderData.styles),
            List_Payment: JSON.stringify(paymentData)
        };

        // Add OrderID if this is adding to existing order (from URL or cart)
        if (orderId) {
            apiData.OrderID = parseInt(orderId);
            console.log('Adding to existing order from URL. OrderID:', apiData.OrderID);
        } else if (orderCart.length > 0 && orderCart[0].orderID) {
            apiData.OrderID = parseInt(orderCart[0].orderID);
            console.log('Adding to existing order from cart. OrderID:', apiData.OrderID);
        } else {
            console.log('Creating new order (no existing OrderID)');
        }

        console.log('=== SENDING ORDER DATA ===');
        console.log('Institution ID:', parsedInstitutionId);
        console.log('Registration ID:', parsedRegistrationId);
        console.log('Cloth_For_ID:', parseInt(clothForId), '(from URL param:', clothForId, ')');
        console.log('CustomerID:', parseInt(customerId), '(from URL param:', customerId, ')');
        console.log('DressID:', parseInt(orderData.dressId));
        console.log('Payment Data:', paymentData);
        console.log('API Data:', apiData);
        console.log('List_Payment String:', apiData.List_Payment);
        console.log('List_Measurement String:', apiData.List_Measurement);
        console.log('List_Style String:', apiData.List_Style);

        // Show loading
        $('button[onclick="addDressToOrder()"]').prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-2"></i>অপেক্ষা করুন...');

        $.ajax({
            url: '/api/orders/add-dress',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(apiData),
            success: function(response) {
                console.log('=== SUCCESS RESPONSE ===');
                console.log('Response:', response);
                
                if (response.success) {
                    showAlert('success', 'পোশাক সফলভাবে যুক্ত হয়েছে!');
                    
                    // Add to local cart
                    const cartItem = {
                        ...orderData,
                        orderID: response.data.orderID,
                        orderListID: response.data.orderListID,
                        totalAmount: calculateTotalAmount(orderData.payments)
                    };
                    
                    console.log('Adding item to cart:', cartItem);
                    orderCart.push(cartItem);
                    console.log('Updated order cart:', orderCart);
                    
                    displayOrderCart();
                    
                    // Reset form
                    resetDressForm();
                } else {
                    showAlert('error', response.message || 'Failed to add dress');
                }
                
                $('button[onclick="addDressToOrder()"]').prop('disabled', false).html('<i class="fas fa-check-circle me-2"></i>অর্ডার এড করুন');
            },
            error: function(xhr) {
                console.error('=== ERROR RESPONSE ===');
                console.error('Status:', xhr.status);
                console.error('Response Text:', xhr.responseText);
                console.error('Full XHR:', xhr);
                
                let errorMsg = 'Failed to add dress to order';
                
                // Try to get detailed error message
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                } else if (xhr.responseText) {
                    try {
                        const errorResponse = JSON.parse(xhr.responseText);
                        errorMsg = errorResponse.message || errorResponse.title || errorMsg;
                    } catch (e) {
                        if (xhr.status === 400) errorMsg = 'অনুরোধটি সঠিক নয়। দয়া করে আবার চেষ্টা করুন।';
                        else if (xhr.status === 500) errorMsg = 'সার্ভারে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।';
                    }
                }
                
                showAlert('error', errorMsg);
                $('button[onclick="addDressToOrder()"]').prop('disabled', false).html('<i class="fas fa-check-circle me-2"></i>অর্ডার এড করুন');
            }
        });
    }

    // Load existing order details when adding to an existing order
    function loadExistingOrderDetails() {
        console.log('Loading existing order details for orderId:', orderId);
        
        const institutionId = sessionStorage.getItem('institutionId');

        $.ajax({
            url: `/api/orders/money-receipt-details?orderId=${orderId}&institutionId=${institutionId}`,
            method: 'GET',
            success: function(response) {
                console.log('Existing order details loaded:', response);
                
                if (response && response.success && response.data) {
                    const data = response.data;
                    const header = data.header;
                    
                    // Set order number
                    $('#orderNumberDisplay').text(header.orderSerialNumber);
                    
                    // Add existing dresses to cart display
                    orderCart = [];
                    if (data.orderItems && data.orderItems.length > 0) {
                        data.orderItems.forEach(item => {
                            const dressId = item.dressID || item.DressID || null;
                            
                            orderCart.push({
                                orderID:      orderId,
                                orderListID:  item.orderListId,
                                dressId:      dressId,
                                dressName:    item.dressName,
                                quantity:     item.dressQuantity,
                                totalAmount:  item.amount
                            });
                        });
                        
                        displayOrderCart();
                        console.log('Loaded', orderCart.length, 'existing dresses into cart');
                        console.log('Cart with dressIds:', orderCart.map(i => ({ dressName: i.dressName, dressId: i.dressId })));
                    }
                }
            },
            error: function(xhr) {
                console.error('Error loading existing order:', xhr);
                showAlert('error', 'অর্ডার লোড করতে সমস্যা হয়েছে');
            }
        });
    }

    // Go to finish order
    window.goToFinishOrder = function() {
        if (orderCart.length === 0) {
            showAlert('warning', 'কোনো পোশাক যুক্ত করা হয়নি');
            return;
        }

        // Use orderId from URL if available, otherwise use from cart
        const finalOrderId = orderId || orderCart[0].orderID;
        
        // Redirect to money receipt page instead of finish-order for existing orders
        if (orderId) {
            window.location.href = `/money-receipt.html?orderId=${finalOrderId}`;
        } else {
            window.location.href = `/finish-order.html?orderId=${finalOrderId}`;
        }
    };

    // Helper function to get cookie value
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    // Calculate total amount from payments
    function calculateTotalAmount(payments) {
        if (!payments || payments.length === 0) return 0;
        
        return payments.reduce((total, payment) => {
            return total + (payment.unitPrice * payment.quantity);
        }, 0);
    }

    // Reset dress form after successful submission
    function resetDressForm() {
        $('#dressSelect').val(0);
        $('#measurementSection').hide();
        $('#stylesCardWrapper').hide();
        currentDressId = 0;
        measurements = [];
        styles = [];
        priceList = [];
        dressDetails = '';
        $('#dressDetails').val('');
        $('#dressQuantity').val(1);
        $('#priceFor').val('');
        $('#priceAmount').val('');
        $('#measurementGrid').empty();
        $('#stylesContainer').empty();
        $('#priceListBody').empty();
        $('#priceListSection').hide();
    }

    // Display order cart
    function displayOrderCart() {
        const $list = $('#orderCartList');
        $list.empty();

        console.log('Displaying order cart. Items:', orderCart.length);

        if (orderCart.length === 0) {
            $('#orderCartSection').hide();
            return;
        }

        $('#orderCartSection').show();

        // Get current language
        const lang = window.currentLang || 'bn';
        const quantityLabel = lang === 'en' ? 'Quantity:' : 'পরিমাণ:';

        orderCart.forEach((item, index) => {
            console.log(`Cart item ${index}:`, item);
            $list.append(`
                <div class="order-cart-item">
                    <div class="order-cart-item-details">
                        <div class="order-cart-item-name">${item.dressName}</div>
                        <div class="order-cart-item-info">
                            <span>${quantityLabel} ${item.quantity}</span>
                        </div>
                    </div>
                    <div class="order-cart-item-price">
                        ৳${formatNumber(item.totalAmount)}
                    </div>
                </div>
            `);
        });
    }

    // Update dress select placeholder based on language
    function updateDressSelectPlaceholder() {
        const lang = window.currentLang || 'bn';
        const $option = $('#dressSelect option[value="0"]');
        
        if ($option.length > 0) {
            const enText = $option.attr('data-en');
            const bnText = $option.attr('data-bn');
            
            if (lang === 'en' && enText) {
                $option.text(enText);
            } else if (bnText) {
                $option.text(bnText);
            }
        }
    }

    // Load order cart from storage (if creating new order)
    function loadOrderCart() {
        // For new orders, we might load from localStorage or session
        // For now, we'll just keep it empty
        console.log('Loading order cart for new order');
    }

    // Show alert message
    function showAlert(type, message) {
        const alertHtml = `
            <div class="alert alert-${type === 'error' ? 'danger' : type === 'warning' ? 'warning' : 'success'} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        
        $('#alertContainer').html(alertHtml);
        
        // Scroll to alert to make it visible
        $('html, body').animate({
            scrollTop: $('#alertContainer').offset().top - 100
        }, 500);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            $('#alertContainer .alert').fadeOut();
        }, 5000);
    }

    // Format number with comma separators
    function formatNumber(num) {
        if (!num && num !== 0) return '0.00';
        return parseFloat(num).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }

    // Prevent back navigation
    function preventBackNavigation() {
        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', function(event) {
            window.history.pushState(null, '', window.location.href);
        });
    }

})();
