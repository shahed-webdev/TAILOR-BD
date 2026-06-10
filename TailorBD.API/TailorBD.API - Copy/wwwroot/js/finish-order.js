// Finish Order - TailorBD
(function() {
    'use strict';

    // Global variables
    let orderData = null;
    let customerData = null;
    let orderDetails = [];
    let accounts = [];
    let discountLimit = 0;
    let discountLimitPercent = 0;
    let previousDiscount = 0;
    let previousPaid = 0;

    // URL Parameters
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');

    $(document).ready(function() {
        // Validate order ID
        if (!orderId) {
            showAlert('error', 'Invalid order ID');
            setTimeout(() => {
                window.location.href = '/new-order.html';
            }, 2000);
            return;
        }

        // Check session
        const institutionId = sessionStorage.getItem('institutionId');
        const registrationId = sessionStorage.getItem('registrationId');

        if (!institutionId || !registrationId) {
            showAlert('error', 'Session expired. Please login again.');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
            return;
        }

        // Initialize datepicker
        $('#deliveryDate').datepicker({
            dateFormat: 'dd-mm-yy',
            changeMonth: true,
            changeYear: true
        });

        // Load data
        loadOrderData();
        loadAccounts();

        // Setup event listeners
        setupEventListeners();

        // Prevent back button
        preventBackNavigation();
    });

    function setupEventListeners() {
        // Calculate due amount on discount/paid amount change
        $('#discountAmount, #paidAmount').on('input', calculateDueAmount);
        
        // Listen for language change events
        $(document).on('click', '#langToggle', function() {
            // Wait for language to be updated
            setTimeout(function() {
                if (orderData) {
                    calculateDueAmount();
                }
            }, 100);
        });
    }

    // Load order data
    function loadOrderData() {
        const institutionId = sessionStorage.getItem('institutionId');

        console.log('Loading order data for OrderId:', orderId, 'InstitutionId:', institutionId);

        $.ajax({
            url: `/api/orders/finish-order-details?orderId=${orderId}&institutionId=${institutionId}`,
            method: 'GET',
            success: function(response) {
                console.log('Order data loaded:', response);
                
                if (response.success && response.data) {
                    orderData = response.data;
                    displayOrderData();
                } else {
                    showAlert('error', 'Failed to load order details');
                    console.error('Invalid response:', response);
                }
            },
            error: function(xhr, status, error) {
                console.error('Error loading order:', {
                    status: xhr.status,
                    statusText: xhr.statusText,
                    responseText: xhr.responseText,
                    error: error
                });
                
                let errorMessage = 'Failed to load order details';
                
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.message) {
                        errorMessage = response.message;
                    }
                } catch (e) {
                    // If not JSON, use status text
                    if (xhr.statusText) {
                        errorMessage += ': ' + xhr.statusText;
                    }
                }
                
                showAlert('error', errorMessage);
            }
        });
    }

    function displayOrderData() {
        console.log('displayOrderData called with orderData:', orderData);
        
        // Display customer info
        displayCustomerInfo();

        // Display order details
        displayOrderDetails();

        // Set discount limit
        discountLimit = orderData.discountLimitAmount || 0;
        discountLimitPercent = orderData.discountLimitPercent || 0;
        
        if (discountLimit > 0) {
            $('#discountLimitText').text(`সর্বোচ্চ ডিসকাউন্ট: ${discountLimitPercent}% (৳${formatNumber(discountLimit)})`);
        }

        // Store previous payments in global variables
        previousDiscount = orderData.customer && orderData.customer.discount ? parseFloat(orderData.customer.discount) : 0;
        previousPaid = orderData.customer && orderData.customer.paidAmount ? parseFloat(orderData.customer.paidAmount) : 0;
        
        // Display previous payment info in labels if exists
        if (previousDiscount > 0) {
            $('#previousDiscountAmount').text('৳' + formatNumber(previousDiscount));
            $('#previousDiscountLabel').show();
        }
        
        if (previousPaid > 0) {
            $('#previousPaidAmount').text('৳' + formatNumber(previousPaid));
            $('#previousPaidLabel').show();
        }

        // Set existing delivery date if available
        console.log('Checking delivery date...');
        console.log('orderData.customer:', orderData.customer);
        console.log('Full orderData:', JSON.stringify(orderData, null, 2));
        
        // Try different property names for delivery date
        const deliveryDateValue = orderData.customer.deliveryDate 
            || orderData.customer.DeliveryDate 
            || orderData.customer.updateDeliveryDate
            || orderData.customer.Update_DeliveryDate
            || orderData.deliveryDate 
            || orderData.DeliveryDate
            || (orderData.customer && orderData.customer.delivery_date)
            || (orderData.customer && orderData.customer.Delivery_Date);
        
        if (deliveryDateValue) {
            console.log('Found deliveryDate:', deliveryDateValue);
            const deliveryDate = deliveryDateValue.split('T')[0]; // Get date part only (YYYY-MM-DD)
            console.log('Setting delivery date to:', deliveryDate);
            // Parse yyyy-MM-dd and set as Date object so datepicker handles any format correctly
            const parts = deliveryDate.split('-');
            const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            $('#deliveryDate').datepicker('setDate', dateObj);
        } else {
            console.log('No delivery date found in orderData');
            console.log('Tried properties: deliveryDate, DeliveryDate, delivery_date, Delivery_Date');
        }

        // Reset new payment fields to 0
        $('#discountAmount').val(0);
        $('#paidAmount').val(0);

        // Calculate initial due amount
        calculateDueAmount();
    }

    function displayCustomerInfo() {
        const customer = orderData.customer;
        
        $('#customerNameDisplay').text(customer.customerName || 'N/A');
        $('#orderNumberDisplay').text(customer.orderSerialNumber || '-');
        $('#customerNumberDisplay').text(customer.customerNumber || 'N/A');
        $('#customerPhoneDisplay').text(customer.phone || 'N/A');
        $('#customerAddressDisplay').text(customer.address || 'No address');

        // Display avatar initials
        const initials = (customer.customerName || 'NA')
            .split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
        $('#customerAvatarLarge').text(initials);

        $('#customerInfoCard').show();
    }

    function displayOrderDetails() {
        const $tbody = $('#orderDetailsBody');
        $tbody.empty();

        const items = orderData.orderItems || [];
        let total = 0;

        if (items.length === 0) {
            $tbody.html('<tr><td colspan="5" class="text-center text-muted">কোনো অর্ডার আইটেম পাওয়া যায়নি</td></tr>');
            return;
        }

        items.forEach(item => {
            const dressInfo = `(${item.dressQuantity}) ${item.dressName}`;
            const itemTotal = item.amount || 0;
            total += itemTotal;

            $tbody.append(`
                <tr>
                    <td><strong>${dressInfo}</strong></td>
                    <td>${item.details || '-'}</td>
                    <td>${item.unit || '-'}</td>
                    <td>৳${formatNumber(item.unitPrice || 0)}</td>
                    <td class="text-end">৳${formatNumber(itemTotal)}</td>
                </tr>
            `);
        });

        $('#orderTotalAmount').text('৳' + formatNumber(total));
        orderData.totalAmount = total;
    }

    // Load accounts
    function loadAccounts() {
        const institutionId = sessionStorage.getItem('institutionId');

        $.ajax({
            url: `/api/account/${institutionId}`,
            method: 'GET',
            success: function(response) {
                if (response.success && response.data) {
                    accounts = response.data;
                    displayAccounts();
                }
            },
            error: function(xhr) {
                console.error('Error loading accounts:', xhr);
            }
        });
    }

    function displayAccounts() {
        if (accounts.length === 0) {
            return;
        }

        $('#accountSection').show();

        const $select = $('#accountSelect');
        accounts.forEach(account => {
            const accountId = account.accountID || account.AccountID;
            const accountName = account.accountName || account.AccountName;
            const isDefault = account.default_Status || account.Default_Status;
            
            $select.append(`<option value="${accountId}" ${isDefault ? 'selected' : ''}>${accountName}</option>`);
        });
    }

    // Calculate due amount
    function calculateDueAmount() {
        const total = orderData.totalAmount || 0;
        
        // Get new payments from input fields
        const newDiscount = parseFloat($('#discountAmount').val()) || 0;
        const newPaid = parseFloat($('#paidAmount').val()) || 0;
        
        // Calculate current due (after previous payments)
        const currentDue = total - (previousDiscount + previousPaid);
        
        const currentLang = window.currentLang || 'bn';
        
        // Validate new discount - should not exceed current due
        if (newDiscount > currentDue) {
            $('#discountAmount').addClass('is-invalid');
            const errorMsg = currentLang === 'en' 
                ? `Current due ৳${formatNumber(currentDue)}. Maximum discount allowed ৳${formatNumber(currentDue)}`
                : `বর্তমান বাকি ৳${formatNumber(currentDue)} টাকা। আপনি ডিসকাউন্ট দিতে পারবেন সর্বোচ্চ ৳${formatNumber(currentDue)} টাকা`;
            $('#errorMessage').text(errorMsg);
            $('#submitButton').prop('disabled', true);
            return;
        }
        
        // Validate new discount against limit (if set)
        if (discountLimit > 0 && newDiscount > discountLimit) {
            $('#discountAmount').addClass('is-invalid');
            const errorMsg = currentLang === 'en'
                ? `Maximum discount limit: ${discountLimitPercent}% (৳${formatNumber(discountLimit)})`
                : `সর্বোচ্চ ডিসকাউন্ট লিমিট: ${discountLimitPercent}% (৳${formatNumber(discountLimit)})`;
            $('#errorMessage').text(errorMsg);
            $('#submitButton').prop('disabled', true);
            return;
        } else {
            $('#discountAmount').removeClass('is-invalid').addClass('is-valid');
        }
        
        // Calculate remaining due after new discount
        const remainingAfterDiscount = currentDue - newDiscount;
        
        // Validate new paid amount - should not exceed remaining due
        if (newPaid > remainingAfterDiscount) {
            $('#paidAmount').addClass('is-invalid');
            const errorMsg = currentLang === 'en'
                ? `After discount, remaining ৳${formatNumber(remainingAfterDiscount)}. Maximum payment allowed ৳${formatNumber(remainingAfterDiscount)}`
                : `ডিসকাউন্ট পরে বাকি ৳${formatNumber(remainingAfterDiscount)} টাকা। আপনি সর্বোচ্চ ৳${formatNumber(remainingAfterDiscount)} টাকা দিতে পারবেন`;
            $('#errorMessage').text(errorMsg);
            $('#submitButton').prop('disabled', true);
            return;
        } else {
            $('#paidAmount').removeClass('is-invalid').addClass('is-valid');
            $('#errorMessage').text('');
            $('#submitButton').prop('disabled', false);
        }

        // Calculate final due
        const finalDue = total - (previousDiscount + previousPaid + newDiscount + newPaid);
        const dueMsg = currentLang === 'en'
            ? `Remaining due ৳${formatNumber(finalDue)}`
            : `বাকি থাকছে ৳${formatNumber(finalDue)} টাকা`;
        $('#dueAmountLabel').text(dueMsg);
    }

    // Submit order
    window.submitOrder = function() {
        const deliveryDateRaw = $('#deliveryDate').val();
        // Convert from dd-mm-yyyy to yyyy-MM-dd for API
        let deliveryDate = deliveryDateRaw;
        if (deliveryDateRaw && deliveryDateRaw.includes('-')) {
            const parts = deliveryDateRaw.split('-');
            if (parts.length === 3 && parts[0].length === 2) {
                deliveryDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }
        
        // Get new payments from input fields (only send new amounts, not total)
        const newDiscount = parseFloat($('#discountAmount').val()) || 0;
        const newPaid = parseFloat($('#paidAmount').val()) || 0;
        
        const accountId = parseInt($('#accountSelect').val()) || null;

        // Validate delivery date
        if (!deliveryDate) {
            $('#deliveryDate').addClass('is-invalid');
            showAlert('warning', 'দয়া করে ডেলিভারি তারিখ নির্বাচন করুন');
            return;
        } else {
            $('#deliveryDate').removeClass('is-invalid');
        }

        // Validate paid amount requires account (only for new payment)
        if (newPaid > 0 && !accountId && accounts.length > 0) {
            $('#accountSelect').addClass('is-invalid');
            showAlert('warning', 'দয়া করে অ্যাকাউন্ট নির্বাচন করুন');
            return;
        } else {
            $('#accountSelect').removeClass('is-invalid');
        }

        // Prepare data - send only new amounts (NOT total)
        const isDelivery = urlParams.get('delivery') === 'true';
        const data = {
            orderId: parseInt(orderId),
            institutionId: parseInt(sessionStorage.getItem('institutionId')),
            registrationId: parseInt(sessionStorage.getItem('registrationId')),
            deliveryDate: deliveryDate,
            discount: newDiscount,  // Only new discount
            paidAmount: newPaid,    // Only new paid amount
            accountId: accountId,
            isDelivery: isDelivery
        };

        console.log('Submitting order with NEW payments only:', data);
        console.log('Previous discount:', previousDiscount);
        console.log('Previous paid:', previousPaid);
        console.log('New discount:', newDiscount);
        console.log('New paid:', newPaid);

        // Show loading
        $('#submitButton').prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-2"></i>অপেক্ষা করুন...');

        $.ajax({
            url: '/api/orders/finish-order',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(response) {
                if (response.success) {
                    showAlert('success', 'অর্ডার সফলভাবে সম্পন্ন হয়েছে!');
                    
                    setTimeout(() => {
                        window.location.href = `/money-receipt.html?orderId=${orderId}`;
                    }, 1500);
                } else {
                    showAlert('error', response.message || 'অর্ডার সম্পন্ন করতে ব্যর্থ হয়েছে');
                    $('#submitButton').prop('disabled', false).html('<i class="fas fa-check-circle me-2"></i>অর্ডার সম্পন্ন করুন');
                }
            },
            error: function(xhr) {
                console.error('Error submitting order:', xhr);
                let errorMsg = 'অর্ডার সম্পন্ন করতে ব্যর্থ হয়েছে';
                
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                
                showAlert('error', errorMsg);
                $('#submitButton').prop('disabled', false).html('<i class="fas fa-check-circle me-2"></i>অর্ডার সম্পন্ন করুন');
            }
        });
    };

    // Add more dress
    window.addMoreDress = function() {
        if (!orderData || !orderData.customer) {
            showAlert('error', 'অর্ডার ডেটা লোড হয়নি');
            return;
        }

        const customerId = orderData.customer.customerId;
        const clothForId = orderData.customer.clothForId;
        
        // Navigate to add-more-dress page with orderId
        window.location.href = `/add-more-dress.html?orderId=${orderId}&customerId=${customerId}&clothForId=${clothForId}`;
    };

    // Prevent back navigation
    function preventBackNavigation() {
        window.history.pushState(null, '', window.location.href);
        window.onpopstate = function() {
            window.history.pushState(null, '', window.location.href);
        };
    }

    // Helper functions
    function formatNumber(num) {
        return parseFloat(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function showAlert(type, message) {
        const alertClass = type === 'success' ? 'alert-success' : 
                          type === 'error' ? 'alert-danger' : 
                          type === 'warning' ? 'alert-warning' : 'alert-info';
        
        const icon = type === 'success' ? 'check-circle' : 
                    type === 'error' ? 'exclamation-circle' : 
                    type === 'warning' ? 'exclamation-triangle' : 'info-circle';

        const alert = $(`
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                <i class="fas fa-${icon} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);

        $('#alertContainer').html(alert);
        
        // Scroll to top
        $('html, body').animate({ scrollTop: 0 }, 300);
        
        setTimeout(() => {
            alert.fadeOut(500, function() {
                $(this).remove();
            });
        }, 5000);
    }

})();
