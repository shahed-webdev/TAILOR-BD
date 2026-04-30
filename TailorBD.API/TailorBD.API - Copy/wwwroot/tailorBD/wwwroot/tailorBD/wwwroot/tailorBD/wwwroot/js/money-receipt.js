// Money Receipt - TailorBD
(function() {
    'use strict';

    // Global variables
    let orderData = null;
    let printSettings = null;
    let measurementPageSize = 'all';
    let measurementPageIndex = 0;

    // URL Parameters
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');

    $(document).ready(function() {
        console.log('Money Receipt Page Loaded');
        console.log('Order ID:', orderId);

        // Validate order ID
        if (!orderId) {
            showAlert('error', 'অর্ডার ID পাওয়া যায়নি');
            setTimeout(() => {
                window.location.href = '/dashboard.html';
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

        // Load data
        loadPrintSettings();
        loadMoneyReceiptData();

        // Setup print size selector
        $('#printSizeSelect').on('change', function() {
            const size = $(this).val();
            $('body').attr('data-print-size', size);
            
            // Apply width to receipt container for on-screen preview
            applyPrintSizeToScreen(size);
        });

        // Measurement paging controls
        $('#measurementPageSize').on('change', function() {
            const value = $(this).val();
            measurementPageSize = value === 'all' ? 'all' : parseInt(value, 10);
            measurementPageIndex = 0;
            displayMeasurements();
        });

        $('#measurementPrevBtn').on('click', function() {
            if (measurementPageIndex > 0) {
                measurementPageIndex--;
                displayMeasurements();
            }
        });

        $('#measurementNextBtn').on('click', function() {
            const totalPages = getMeasurementTotalPages();
            if (measurementPageIndex < totalPages - 1) {
                measurementPageIndex++;
                displayMeasurements();
            }
        });

        // Hide Border checkbox functionality
        $('#hideBorderCheckbox').on('change', function() {
            if ($(this).is(':checked')) {
                // Add hide-borders class to new structure
                $('.measurement-grid-container').addClass('hide-borders');
                // Hide borders for new structure with inline styles
                $('.measurement-grid-container table').css('border', 'none');
                $('.measurement-grid-container table td').css('border', 'none');
                // Also hide borders for old structure (backward compatibility)
                $('.measurement-grid .measurement-item table').css('border', 'none');
                $('.measurement-grid .measurement-item table td').css('border', 'none');
            } else {
                // Remove hide-borders class from new structure
                $('.measurement-grid-container').removeClass('hide-borders');
                // Show borders for new structure with inline styles
                $('.measurement-grid-container table').css('border', '1px solid #666');
                $('.measurement-grid-container table td').css('border', '1px solid #666');
                // Also show borders for old structure (backward compatibility)
                $('.measurement-grid .measurement-item table').css('border', '1px solid #666');
                $('.measurement-grid .measurement-item table td').css('border', '1px solid #666');
            }
        });

        // Set default print size
        const defaultSize = '4';
        $('body').attr('data-print-size', defaultSize);
        applyPrintSizeToScreen(defaultSize);
        
        // Update language content after components are loaded
        setTimeout(function() {
            if (window.updateLanguage) {
                window.updateLanguage();
            }
        }, 500);
        
        // Listen for language change events to re-render measurements
        $(document).on('click', '#langToggle', function() {
            // Wait for language to be updated
            setTimeout(function() {
                if (orderData && orderData.measurements) {
                    displayMeasurements();
                }
            }, 100);
        });
    });

    function getMeasurementTotalPages() {
        if (!orderData || !orderData.measurements || measurementPageSize === 'all') {
            return 1;
        }
        return Math.ceil(orderData.measurements.length / measurementPageSize);
    }

    function getVisibleMeasurements() {
        const measurements = orderData?.measurements || [];
        if (measurementPageSize === 'all') {
            return measurements;
        }
        const start = measurementPageIndex * measurementPageSize;
        return measurements.slice(start, start + measurementPageSize);
    }

    function updateMeasurementControls() {
        const measurements = orderData?.measurements || [];
        const $controls = $('#measurementControls');
        const $pageSize = $('#measurementPageSize');
        const $pager = $('#measurementPager');
        const $pageInfo = $('#measurementPageInfo');

        if (measurements.length <= 1) {
            $controls.hide();
            measurementPageSize = 'all';
            measurementPageIndex = 0;
            return;
        }

        $controls.show();

        // Build page size options
        $pageSize.empty();
        const currentLang = window.currentLang || 'bn';
        const allText = currentLang === 'en' ? 'Print all measurements' : 'সব মাপ একসাথে প্রিন্ট করুন';
        $pageSize.append(`<option value="all">${allText}</option>`);

        for (let i = 1; i <= measurements.length; i++) {
            const optionText = currentLang === 'en'
                ? `Print ${i} at a time`
                : `${i} টি করে মাপ প্রিন্ট করুন`;
            $pageSize.append(`<option value="${i}">${optionText}</option>`);
        }

        // Default to 1 per page (legacy behavior)
        if (measurementPageSize === 'all') {
            measurementPageSize = 1;
        }

        $pageSize.val(measurementPageSize.toString());

        const totalPages = getMeasurementTotalPages();
        if (measurementPageSize === 'all' || totalPages <= 1) {
            $pager.hide();
        } else {
            $pager.show();
            const pageText = currentLang === 'en'
                ? `Page ${measurementPageIndex + 1} of ${totalPages}`
                : `পৃষ্ঠা ${measurementPageIndex + 1} / ${totalPages}`;
            $pageInfo.text(pageText);
        }

        $('#measurementPrevBtn').prop('disabled', measurementPageIndex === 0);
        $('#measurementNextBtn').prop('disabled', measurementPageIndex >= totalPages - 1);
    }

    $(document).on('click', '#printSettingsBtn', function() {
        $('#printSettingsModal').modal('show');
    });

    $(document).on('click', '#savePrintSettingsBtn', function() {
        // Save print settings to session and apply
        const topSpace = parseInt($('#topSpaceInput').val(), 10) || 0;
        const fontSize = parseInt($('#fontSizeInput').val(), 10) || 14;

        // Save to session
        const institutionId = sessionStorage.getItem('institutionId');
        $.ajax({
            url: `/api/institution/${institutionId}/print-settings`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({
                moneyReceipt: {
                    topSpace: topSpace,
                    fontSize: fontSize
                }
            }),
            success: function(response) {
                if (response.success) {
                    printSettings.moneyReceipt.topSpace = topSpace;
                    printSettings.moneyReceipt.fontSize = fontSize;

                    // Close modal
                    $('#printSettingsModal').modal('hide');

                    // Reapply print settings
                    applyPrintSettings();

                    showAlert('success', 'Print settings updated successfully');
                } else {
                    showAlert('error', response.message || 'Failed to update print settings');
                }
            },
            error: function(xhr) {
                console.error('Error updating print settings:', xhr);
                showAlert('error', 'Failed to update print settings');
            }
        });
    });

    // Helper Functions
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const currentLang = window.currentLang || 'bn';
        
        if (currentLang === 'en') {
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
        } else {
            const months = ['জানুয়ারী', 'ফেব্রুয়ারী', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
            return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
        }
    }

    function formatShortDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        return `${day}-${month}-${year}`;
    }

    function formatNumber(num) {
        return parseFloat(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function showAlert(type, message) {
        const $container = $('#alertContainer');
        const alertClass = type === 'error' ? 'alert-danger' : 'alert-success';
        
        const alertHtml = `
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        $container.html(alertHtml);
        
        setTimeout(() => {
            $container.find('.alert').fadeOut(() => {
                $container.empty();
            });
        }, 5000);
    }

    function goBack() {
        window.history.back();
    }

    function getSelectedPrintSize() {
        const selected = $('#printSizeSelect').val();
        return selected || $('body').attr('data-print-size') || '4';
    }

    function getPdfTargetElement(activeTab) {
        if (activeTab === 'receiptTab') {
            return document.querySelector('.receipt-container');
        }

        return document.querySelector('.measurements-main-container') || document.querySelector('.measurement-container');
    }

    function createPdfFromElement(element, filename) {
        const sizeInInches = parseFloat(getSelectedPrintSize()) || 4;
        const widthMm = sizeInInches * 25.4;

        return html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        }).then(canvas => {
            const { jsPDF } = window.jspdf;
            const heightMm = (canvas.height * widthMm) / canvas.width;
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: [widthMm, heightMm]
            });

            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 0, 0, widthMm, heightMm);

            return {
                pdf,
                filename
            };
        });
    }

    function goBack() {
        window.history.back();
    }

    // Apply print size to screen for preview
    function applyPrintSizeToScreen(size = '4') {
        // Convert inch to pixels (96 DPI standard)
        const inchToPixel = {
            '3': 288,    // 3 inch = 288px
            '3.5': 336,  // 3.5 inch = 336px
            '4': 384,    // 4 inch = 384px
            '4.5': 432,  // 4.5 inch = 432px
            '5': 480     // 5 inch = 480px
        };
        
        const widthInPixels = inchToPixel[size] || 384; // Default to 4 inch
        
        // Apply width to receipt container
        $('.receipt-container').css({
            'max-width': widthInPixels + 'px',
            'width': '100%'
        });
        
        // Apply width to measurements container
        $('.measurements-main-container').css({
            'max-width': widthInPixels + 'px',
            'width': '100%'
        });
        
        console.log('Applied print size:', size, 'inch =', widthInPixels, 'pixels');
    }
    
    // Increment measurement print count
    async function incrementMeasurementPrintCount() {
        const institutionId = sessionStorage.getItem('institutionId');
        
        try {
            const response = await fetch(`/api/orders/${orderId}/increment-measurement-print?institutionId=${institutionId}`, {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('Measurement print count incremented successfully');
            } else {
                console.warn('Failed to increment measurement print count:', result.message);
            }
        } catch (error) {
            console.error('Error incrementing measurement print count:', error);
        }
    }
    
    // Override window.print to increment count when printing measurement
    const originalPrint = window.print;
    window.print = function() {
        // Check if measurement tab is active
        const activeTab = $('.tab-pane.active').attr('id');
        
        if (activeTab === 'measurementTab') {
            // Increment measurement print count
            incrementMeasurementPrintCount();
        }
        
        // Call original print function
        originalPrint.call(window);
    };

    // Load print settings
    function loadPrintSettings() {
        const institutionId = sessionStorage.getItem('institutionId');

        $.ajax({
            url: `/api/institution/${institutionId}/print-settings`,
            method: 'GET',
            success: function(response) {
                if (response.success && response.data) {
                    printSettings = response.data;
                    console.log('Print settings loaded:', printSettings);
                    applyPrintSettings();
                }
            },
            error: function(xhr) {
                console.error('Error loading print settings:', xhr);
            }
        });
    }

    // Apply print settings to the page
    function applyPrintSettings() {
        if (!printSettings) {
            console.warn('No print settings available');
            return;
        }

        const mrSettings = printSettings.moneyReceipt;
        console.log('Applying print settings - showShopName:', mrSettings.showShopName);

        // Set CSS variables for print
        document.documentElement.style.setProperty('--print-top-space', mrSettings.topSpace + 'px');
        document.documentElement.style.setProperty('--print-font-size', mrSettings.fontSize + 'px');

        // Hide institution name, subtitle, and contact if setting is false
        if (mrSettings.showShopName === false) {
            console.log('Hiding shop name by settings');
            $('.receipt-header').addClass('hide-shop-name');
            $('.institution-name').hide();
            $('.institution-subtitle').hide();
            $('.institution-contact').hide();
        } else {
            console.log('Showing shop name by settings');
            $('.receipt-header').removeClass('hide-shop-name');
            // Note: Individual elements visibility will be controlled by displayMoneyReceipt based on data availability
        }

        // Update powered by info
        if (mrSettings.poweredByInfo) {
            $('.receipt-footer p').text(mrSettings.poweredByInfo);
        }
        
        // Apply top space from settings
        if (mrSettings.topSpace !== undefined && mrSettings.topSpace !== null) {
            $('.receipt-header').css('margin-top', mrSettings.topSpace + 'px');
        }
        
        // Apply measurement settings
        if (printSettings.measurement) {
            const mSettings = printSettings.measurement;
            
            // Set measurement top space CSS variable
            if (mSettings.topSpace !== undefined && mSettings.topSpace !== null) {
                document.documentElement.style.setProperty('--measurement-top-space', mSettings.topSpace + 'px');
                console.log('Set measurement top space:', mSettings.topSpace + 'px');
            }
        }
    }

    // Load money receipt data
    function loadMoneyReceiptData() {
        const institutionId = sessionStorage.getItem('institutionId');

        console.log('Loading money receipt for OrderId:', orderId, 'InstitutionId:', institutionId);

        // Show loading indicator
        $('#orderItemsBody').html('<tr><td colspan="5" class="text-center">লোড হচ্ছে...</td></tr>');
        $('#measurementContainer').html('<p class="text-center">লোড হচ্ছে...</p>');

        $.ajax({
            url: `/api/orders/money-receipt-details?orderId=${orderId}&institutionId=${institutionId}`,
            method: 'GET',
            success: function(response) {
                console.log('API Response received:', response);
                
                if (response.success && response.data) {
                    orderData = response.data;
                    console.log('OrderData assigned:', orderData);
                    
                    displayMoneyReceipt();
                    displayMeasurements();
                } else {
                    const errorMsg = response.message || 'Failed to load money receipt details';
                    showAlert('error', errorMsg);
                    console.error('Invalid response:', response);
                    $('#orderItemsBody').html('<tr><td colspan="5" class="text-center text-danger">ডাটা লোড করতে ব্যর্থ</td></tr>');
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX Error:', error);
                showAlert('error', 'Failed to load money receipt details');
                $('#orderItemsBody').html('<tr><td colspan="5" class="text-center text-danger">ডাটা লোড করতে ব্যর্থ</td></tr>');
            }
        });
    }

    function displayMoneyReceipt() {
        console.log('displayMoneyReceipt called');
        
        if (!orderData || !orderData.header) {
            console.error('No orderData or header found');
            showAlert('error', 'অর্ডার ডাটা পাওয়া যাচ্ছে না');
            return;
        }

        const header = orderData.header;

        // Extra diagnostics
        try {
            console.log('Header keys:', Object.keys(header || {}));
            console.log('Header JSON:', JSON.stringify(header));
        } catch {
            // ignore
        }

        const normalizeText = (v) => {
            if (v === null || v === undefined) return '';
            const s = v.toString();
            const t = s.trim();
            if (!t) return '';
            if (t === '...') return '';
            if (t.toLowerCase() === 'null' || t.toLowerCase() === 'undefined') return '';
            return s;
        };

        // Display institution info
        const sessionInstitutionName = normalizeText(sessionStorage.getItem('institutionName'));
        const apiInstitutionName = normalizeText(header.institutionName ?? header.InstitutionName);
        const resolvedInstitutionName = apiInstitutionName || sessionInstitutionName || 'TailorBD';

        const apiDialogTitle = normalizeText(header.dialogTitle ?? header.DialogTitle);
        const resolvedDialogTitle = apiDialogTitle || '';

        console.log('Resolved InstitutionName:', resolvedInstitutionName);
        console.log('Resolved DialogTitle:', resolvedDialogTitle);

        $('#receiptInstitutionName').text(resolvedInstitutionName);
        $('#dialogTitle').text(resolvedDialogTitle);

        // Log to verify text was set
        console.log('Text set to institutionName element:', $('#receiptInstitutionName').text());
        console.log('Element HTML:', $('#receiptInstitutionName').html());
        
        // Check if print settings exist and if showShopName is enabled
        console.log('Print settings:', printSettings);
        const showShopName = printSettings && printSettings.moneyReceipt && printSettings.moneyReceipt.showShopName !== false;
        console.log('showShopName setting:', showShopName);

        const hasInstitutionName = normalizeText(resolvedInstitutionName).length > 0;
        console.log('hasInstitutionName:', hasInstitutionName);

        if (hasInstitutionName && showShopName) {
            $('.receipt-header').removeClass('hide-shop-name');
            $('#receiptInstitutionName').attr('style', 'display: block !important; color: #000 !important; visibility: visible !important; opacity: 1 !important;');

            if (normalizeText(resolvedDialogTitle)) {
                $('.institution-subtitle').attr('style', 'display: block !important; color: #666 !important;');
            } else {
                $('.institution-subtitle').attr('style', 'display: none !important;');
            }

            $('.institution-contact').attr('style', 'display: block !important; color: #444 !important;');
        } else {
            $('.receipt-header').addClass('hide-shop-name');
            $('#receiptInstitutionName').attr('style', 'display: none !important;');
            $('.institution-subtitle').attr('style', 'display: none !important;');
            $('.institution-contact').attr('style', 'display: none !important;');
        }

        if (header.institutionPhone) {
            $('#institutionPhone').text(header.institutionPhone);
        }
        
        if (header.institutionAddress) {
            $('#institutionAddress').text(header.institutionAddress);
            $('#institutionSeparator').show();
        }

        // Display customer info
        $('#orderSerialNumber').text(header.orderSerialNumber || '-');
        $('#customerName').text(header.customerName || 'N/A');
        $('#customerPhone').text(header.phone || 'N/A');
        $('#customerAddress').text(header.address || 'No address');
        
        // Display dates
        $('#orderDate').text(formatShortDate(header.orderDate));
        $('#deliveryDate').text(header.updateDeliveryDate 
            ? formatShortDate(header.updateDeliveryDate) 
            : formatShortDate(header.deliveryDate));

        // Generate barcode only if setting is enabled
        if (printSettings && printSettings.moneyReceipt && printSettings.moneyReceipt.showReceiptBarcode !== false) {
            if (header.orderSerialNumber) {
                $('.barcode-section').show();
                try {
                    JsBarcode("#barcodeReceipt", header.orderSerialNumber.toString(), {
                        format: "CODE128",
                        width: 3,
                        height: 25,
                        displayValue: true,
                        fontSize: 10,
                        margin: 1
                    });
                    console.log('Barcode generated');
                } catch (error) {
                    console.error('Error generating barcode:', error);
                }
            }
        } else {
            $('.barcode-section').hide();
            console.log('Barcode hidden by setting');
        }

        // Display order items
        displayOrderItems();

        // Display payment summary
        displayPaymentSummary();
        
        console.log('Money receipt display completed');
    }

    function displayOrderItems() {
        const $tbody = $('#orderItemsBody');
        $tbody.empty();

        const items = orderData.orderItems || [];

        if (items.length === 0) {
            $tbody.html('<tr><td colspan="5" class="text-center text-muted">কোনো অর্ডার আইটেম পাওয়া যায়নি</td></tr>');
            return;
        }

        items.forEach(item => {
            const dressInfo = `${item.dressName} (${item.dressQuantity})`;
            const unitPrice = item.unitPrice || 0;
            const quantity = item.unit || 1;
            const amount = item.amount || 0;

            $tbody.append(`
                <tr>
                    <td><strong>${dressInfo}</strong></td>
                    <td>${item.details || '-'}</td>
                    <td class="text-center">${quantity}</td>
                    <td class="text-end">৳${formatNumber(unitPrice)}</td>
                    <td class="text-end"><strong>৳${formatNumber(amount)}</strong></td>
                </tr>
            `);
        });
    }

    function displayPaymentSummary() {
        const header = orderData.header;
        const total = header.orderAmount || 0;
        const discount = header.discount || 0;
        const paid = header.paidAmount || 0;
        const due = header.dueAmount || 0;

        $('#totalAmount').text('৳' + formatNumber(total));
        $('#paidAmount').text(formatNumber(paid));
        $('#dueAmount').text('৳' + formatNumber(due));

        // Show discount row if there's a discount
        if (discount > 0) {
            $('#discountAmount').text(formatNumber(discount));
            $('#discountRow').show();
        }
    }

    // Display measurements
    function displayMeasurements() {
        if (!printSettings || !printSettings.measurement) {
            console.warn('No print settings found, using defaults');
            printSettings = { 
                measurement: {
                    printShopName: false,
                    printMasterCopy: true,
                    printWorkmanCopy: false,
                    printShopCopy: false,
                    printCustomerName: false,
                    printCustomerAddress: false,
                    printMeasurementName: false,
                    printStyleCategory: false,
                    printBarcode: false,
                    topSpace: 0,
                    fontSize: 14
                }
            };
        }

        const $container = $('#measurementContainer');
        $container.empty();

        const measurements = orderData.measurements || [];

        if (measurements.length === 0) {
            const currentLang = window.currentLang || 'bn';
            const noDataText = currentLang === 'en' ? 'No measurements found' : 'কোনো মাপ পাওয়া যায়নি';
            $container.html(`<p class="text-center text-muted">${noDataText}</p>`);
            updateMeasurementControls();
            return;
        }

        updateMeasurementControls();
        const visibleMeasurements = getVisibleMeasurements();

        const mSettings = printSettings.measurement;
        const header = orderData.header;
        const currentLang = window.currentLang || 'bn';

        // Translate copy titles based on current language
        const copyTitles = {
            master: currentLang === 'en' ? '.......................... Copy' : '.......................... কপি',
            workman: currentLang === 'en' ? 'Workman Copy' : 'কারিগর কপি',
            shop: currentLang === 'en' ? 'Shop Copy' : 'দোকান কপি',
            default: currentLang === 'en' ? 'Measurement' : 'মাপ'
        };

        // Translate labels
        const labels = {
            orderNo: currentLang === 'en' ? 'Order No:' : 'অর্ডার নং:',
            order: currentLang === 'en' ? 'Order:' : 'অর্ডা:',
            delivery: currentLang === 'en' ? 'Delivery:' : 'ডেলি:',
            style: currentLang === 'en' ? 'Style:' : 'স্টাইল:'
        };

        // Create measurement copies based on settings
        const copies = [];
        if (mSettings.printMasterCopy) {
            copies.push({ title: copyTitles.master, class: 'master-copy' });
        }
        if (mSettings.printWorkmanCopy) {
            copies.push({ title: copyTitles.workman, class: 'workman-copy' });
        }
        if (mSettings.printShopCopy) {
            copies.push({ title: copyTitles.shop, class: 'shop-copy' });
        }

        // If no copies selected, show at least one default copy
        if (copies.length === 0) {
            copies.push({ title: copyTitles.default, class: 'default-copy' });
        }

        console.log('Creating measurement copies:', copies);

        // Main container for all copies
        const $mainContainer = $('<div class="measurements-main-container"></div>');

        visibleMeasurements.forEach((item, itemIndex) => {
            // Container for this item's all copies + measurements
            const $itemContainer = $('<div class="measurement-item-container"></div>');

            // PART 1: Show all copy headers first
            copies.forEach((copy, copyIndex) => {
                const $copy = $('<div class="measurement-copy"></div>');
                $copy.addClass(copy.class);

                // Header with institution name (if enabled)
                if (mSettings.printShopName) {
                    $copy.append(`
                        <div class="measurement-header">
                            <h3>${header.institutionName || 'TailorBD'}</h3>
                        </div>
                    `);
                }

                // Copy title
                $copy.append(`<div class="copy-title">${copy.title}</div>`);

                // Measurement info table (Always show for each copy)
                $copy.append(`
                    <table class="measurement-info-table">
                        <tr>
                            <td>
                                <strong>${item.dressName}</strong><br>
                                <input type="text" class="dress-quantity-input" value="${item.dressQuantity} P." style="text-align: center; border: 1px solid #666; font-weight: bold; width: 95%; font-size: 14px;" />
                            </td>
                            <td>${labels.orderNo}<br><strong>${header.orderSerialNumber} (${item.orderListSerialNumber || item.orderListSN || item.orderList_SN || ''})</strong></td>
                            <td>${labels.order} ${formatShortDate(header.orderDate)}<br>
                                ${labels.delivery} ${formatShortDate(header.deliveryDate)}</td>
                        </tr>
                    </table>
                `);

                // Add barcode if setting is enabled AND this is a shop copy
                if (mSettings.printBarcode && header.orderSerialNumber && copy.class === 'shop-copy') {
                    const barcodeId = `barcodeMeasurement_${itemIndex}_${copyIndex}`;
                    $copy.append(`
                        <div class="measurement-barcode-section">
                            <svg id="${barcodeId}"></svg>
                        </div>
                    `);
                    
                    // Generate barcode after appending to DOM
                    setTimeout(() => {
                        try {
                            JsBarcode(`#${barcodeId}`, header.orderSerialNumber.toString(), {
                                format: "CODE128",
                                width: 2,
                                height: 20,
                                displayValue: true,
                                fontSize: 10,
                                margin: 1
                            });
                            console.log('Barcode generated for shop copy only:', barcodeId);
                        } catch (error) {
                            console.error('Error generating barcode for measurement:', error);
                        }
                    }, 100);
                }

                $itemContainer.append($copy);
            });

            // PART 2: After all copy headers, show measurements and styles ONCE at the end
            const $detailsSection = $('<div class="measurement-details-section"></div>');

            // Customer name AND phone (if enabled) - both show/hide together
            if (mSettings.printCustomerName) {
                // Show name and phone in ONE line
                const customerInfo = header.phone 
                    ? `${header.customerName}, ${header.phone}` 
                    : header.customerName;
                
                $detailsSection.append(`
                    <div class="customer-name-section">
                        ${customerInfo}
                    </div>
                `);
            }

            // Group measurements by groupID
            if (item.measurements && item.measurements.length > 0) {
                // Group measurements by groupID while preserving order
                const groupMap = new Map();
                const groupOrder = [];
                
                item.measurements.forEach(m => {
                    const groupId = m.groupID || m.measurementTypeID;
                    if (!groupMap.has(groupId)) {
                        groupMap.set(groupId, []);
                        groupOrder.push(groupId);
                    }
                    groupMap.get(groupId).push(m);
                });

                // Build separate tables for each group (like old ASPX nested DataList)
                const $measurementGrid = $('<div class="measurement-grid-container"></div>');
                
                groupOrder.forEach(groupId => {
                    const group = groupMap.get(groupId);
                    
                    // Create a table for this group - only if it has measurements
                    if (group && group.length > 0) {
                        const $groupTable = $('<table></table>');
                        const $tbody = $('<tbody></tbody>');
                        
                        // Add each measurement in the group as a row
                        group.forEach(m => {
                            // Only add rows with actual measurement values
                            if (m.value && m.value.trim() !== '') {
                                const $row = $('<tr></tr>');
                                const $cell = $('<td></td>');
                                
                                if (mSettings.printMeasurementName) {
                                    $cell.append(`<div style="font-size: ${(mSettings.fontSize || 14) - 2}px;">${m.type}</div>`);
                                    $cell.append('<hr style="margin: 2px 0; border: none; border-top: 1px solid #000;">');
                                }
                                
                                $cell.append(`<div style="font-weight: bold; font-size: ${mSettings.fontSize || 14}px;">${m.value}</div>`);
                                $row.append($cell);
                                $tbody.append($row);
                            }
                        });
                        
                        // Only append table if it has rows
                        if ($tbody.children().length > 0) {
                            $groupTable.append($tbody);
                            $measurementGrid.append($groupTable);
                        }
                    }
                });

                $detailsSection.append($measurementGrid);
            }

            // Styles
            console.log('Styles data for item:', item.dressName, item.styles);
            if (item.styles && item.styles.length > 0) {
                let stylesText = item.styles.map(s => {
                    if (mSettings.printStyleCategory && s.measurement) {
                        return `${s.name} = ${s.measurement}`;
                    }
                    return s.measurement ? `${s.measurement}` : s.name;
                }).join(', ');

                console.log('Generated styles text:', stylesText);
                
                if (stylesText) {
                    $detailsSection.append(`
                        <div class="styles-section">
                            ${labels.style} ${stylesText}
                        </div>
                    `);
                }
            } else {
                console.log('No styles found for this item');
            }

            // Details
            if (item.orderDetails) {
                $detailsSection.append(`
                    <div class="details-section">
                        ${item.orderDetails}
                    </div>
                `);
            }

            $itemContainer.append($detailsSection);
            $mainContainer.append($itemContainer);
        });

        $container.append($mainContainer);

        // Apply measurement print settings (fontSize only, topSpace comes from CSS variable)
        if (mSettings.fontSize) {
            // Apply to measurement table
            $('.measurement-table').css('font-size', mSettings.fontSize + 'px');
            
            // Apply to styles and details sections
            $('.styles-section').css('font-size', mSettings.fontSize + 'px');
            $('.details-section').css('font-size', mSettings.fontSize + 'px');
            
            console.log('Applied fontSize:', mSettings.fontSize + 'px');
        }
        
        console.log('Measurements displayed successfully');
    }

    // Make goBack globally accessible
    window.goBack = goBack;
    
    // Download as PDF
    window.downloadPDF = function() {
        if (!orderData || !orderData.header) {
            showAlert('error', 'অর্ডার ডাটা লোড হয়নি');
            return;
        }

        $('#loadingSpinner').show();

        const header = orderData.header;
        const activeTab = $('.tab-pane.active').attr('id');
        const element = getPdfTargetElement(activeTab);
        const filename = activeTab === 'receiptTab'
            ? `Money_Receipt_${header.orderSerialNumber}.pdf`
            : `Measurement_${header.orderSerialNumber}.pdf`;

        if (!element) {
            $('#loadingSpinner').hide();
            showAlert('error', 'Content not found');
            return;
        }

        createPdfFromElement(element, filename)
            .then(({ pdf, filename: outputName }) => {
                pdf.save(outputName);
                $('#loadingSpinner').hide();
                showAlert('success', 'পিডিএফ সফলভাবে ডাউনলোড হয়েছে');
            })
            .catch(error => {
                console.error('Error generating PDF:', error);
                $('#loadingSpinner').hide();
                showAlert('error', 'পিডিএফ তৈরি করতে ব্যর্থ হয়েছে');
            });
    };

    // Share as PDF
    window.shareAsPDF = function() {
        if (!orderData || !orderData.header) {
            showAlert('error', 'অর্ডার ডাটা লোড হয়নি');
            return;
        }

        $('#loadingSpinner').show();

        const header = orderData.header;
        const activeTab = $('.tab-pane.active').attr('id');
        const element = getPdfTargetElement(activeTab);
        const filename = activeTab === 'receiptTab'
            ? `Money_Receipt_${header.orderSerialNumber}.pdf`
            : `Measurement_${header.orderSerialNumber}.pdf`;

        if (!element) {
            $('#loadingSpinner').hide();
            showAlert('error', 'Content not found');
            return;
        }

        createPdfFromElement(element, filename)
            .then(({ pdf, filename: outputName }) => {
                const pdfBlob = pdf.output('blob');

                if (navigator.share && navigator.canShare) {
                    const file = new File([pdfBlob], outputName, { type: 'application/pdf' });

                    if (navigator.canShare({ files: [file] })) {
                        navigator.share({
                            title: header.institutionName || 'TailorBD',
                            text: `অর্ডার নং: ${header.orderSerialNumber}`,
                            files: [file]
                        }).then(() => {
                            $('#loadingSpinner').hide();
                            showAlert('success', 'পিডিএফ শেয়ার সফল হয়েছে');
                        }).catch((error) => {
                            console.log('Share cancelled or failed:', error);
                            $('#loadingSpinner').hide();
                            pdf.save(outputName);
                            showAlert('info', 'শেয়ার বাতিল করা হয়েছে। পিডিএফ ডাউনলোড করা হয়েছে।');
                        });
                    } else {
                        $('#loadingSpinner').hide();
                        pdf.save(outputName);
                        showAlert('warning', 'আপনার ব্রাউজার ফাইল শেয়ার সাপোর্ট করে না। পিডিএফ ডাউনলোড করা হয়েছে।');
                    }
                } else {
                    $('#loadingSpinner').hide();
                    pdf.save(outputName);
                    showShareOptions(header, outputName);
                }
            })
            .catch(error => {
                console.error('Error generating PDF:', error);
                $('#loadingSpinner').hide();
                showAlert('error', 'পিডিএফ তৈরি করতে ব্যর্থ হয়েছে');
            });
    };
    
    // Show share options for browsers without Web Share API
    function showShareOptions(header, filename) {
        const currentLang = window.currentLang || 'bn';
        let message = '';
        
        if (currentLang === 'en') {
            message = `The PDF has been downloaded. You can now share "${filename}" via:\n\n`;
            message += `• WhatsApp: Send to ${header.phone}\n`;
            message += `• Email: Attach the downloaded PDF\n`;
            message += `• Other apps: Use your phone's share feature`;
        } else {
            message = `পিডিএফ ডাউনলোড হয়েছে। এখন আপনি "${filename}" শেয়ার করতে পারেন:\n\n`;
            message += `• হোয়াটসঅ্যাপ: ${header.phone} এ পাঠান\n`;
            message += `• ইমেইল: ডাউনলোড করা পিডিএফ সংযুক্ত করুন\n`;
            message += `• অন্যান্য অ্যাপ: আপনার ফোনের শেয়ার ফিচার ব্যবহার করুন`;
        }
        
        showAlert('info', message);
    }
})();
