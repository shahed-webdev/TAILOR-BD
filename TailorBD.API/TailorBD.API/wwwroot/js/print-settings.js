// Print Settings - TailorBD
(function() {
    'use strict';

    $(document).ready(function() {
        console.log('Print Settings Page Loaded');

        // Check session
        const institutionId = sessionStorage.getItem('institutionId');
        const registrationId = sessionStorage.getItem('registrationId');

        console.log('Session check:', { institutionId, registrationId });

        if (!institutionId || !registrationId) {
            showAlert('error', 'Session expired. Please login again.');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
            return;
        }

        // Load settings
        loadPrintSettings();

        // Form submissions
        $('#measurementSettingsForm').on('submit', function(e) {
            e.preventDefault();
            saveMeasurementSettings();
        });

        $('#receiptSettingsForm').on('submit', function(e) {
            e.preventDefault();
            saveReceiptSettings();
        });

        // Update language after page loads
        setTimeout(function() {
            if (window.updateLanguage) {
                window.updateLanguage();
            }
        }, 300);
    });

    // Load print settings
    function loadPrintSettings() {
        const institutionId = sessionStorage.getItem('institutionId');
        const url = `/api/institution/${institutionId}/print-settings`;

        console.log('Loading print settings from:', url);

        $('#loadingSpinner').show();

        $.ajax({
            url: url,
            method: 'GET',
            success: function(response) {
                console.log('Print settings loaded successfully:', response);
                if (response.success && response.data) {
                    populateSettings(response.data);
                } else {
                    console.warn('Invalid response structure:', response);
                    showAlert('error', 'প্রিন্ট সেটিং লোড করতে ব্যর্থ হয়েছে');
                }
            },
            error: function(xhr, status, error) {
                console.error('Error loading print settings:');
                console.error('Status:', status);
                console.error('Error:', error);
                console.error('Response:', xhr.responseText);
                console.error('Status Code:', xhr.status);
                
                let errorMessage = 'প্রিন্ট সেটিং লোড করতে ব্যর্থ হয়েছে';
                
                try {
                    const errorResponse = JSON.parse(xhr.responseText);
                    if (errorResponse.message) {
                        errorMessage += ': ' + errorResponse.message;
                    }
                } catch (e) {
                    errorMessage += ' (Status: ' + xhr.status + ')';
                }
                
                showAlert('error', errorMessage);
            },
            complete: function() {
                $('#loadingSpinner').hide();
            }
        });
    }

    // Populate form fields with loaded settings
    function populateSettings(settings) {
        console.log('Populating settings:', settings);

        // Measurement settings
        const ms = settings.measurement;
        $('#printShopName').prop('checked', ms.printShopName);
        $('#printMasterCopy').prop('checked', ms.printMasterCopy);
        $('#printWorkmanCopy').prop('checked', ms.printWorkmanCopy);
        $('#printShopCopy').prop('checked', ms.printShopCopy);
        $('#printCustomerName').prop('checked', ms.printCustomerName);
        $('#printCustomerPhone').prop('checked', ms.printCustomerPhone !== false);
        $('#printCustomerAddress').prop('checked', ms.printCustomerAddress);
        $('#printMeasurementName').prop('checked', ms.printMeasurementName);
        $('#printStyleCategory').prop('checked', ms.printStyleCategory);
        $('#printBarcode').prop('checked', ms.printBarcode || false);
        $('#measurementTopSpace').val(ms.topSpace);
        $('#measurementFontSize').val(ms.fontSize);

        // Receipt settings
        const rs = settings.moneyReceipt;
        $('#showShopName').prop('checked', rs.showShopName);
        $('#showServedBy').prop('checked', rs.showServedBy);
        $('#showReceiptBarcode').prop('checked', rs.showReceiptBarcode !== false);
        $('#receiptTopSpace').val(rs.topSpace);
        $('#receiptFontSize').val(rs.fontSize);
        $('#poweredByInfo').val(rs.poweredByInfo || '');

        console.log('Settings populated successfully');
    }

    // Save measurement settings
    function saveMeasurementSettings() {
        const institutionId = sessionStorage.getItem('institutionId');

        const settings = {
            printShopName: $('#printShopName').is(':checked'),
            printMasterCopy: $('#printMasterCopy').is(':checked'),
            printWorkmanCopy: $('#printWorkmanCopy').is(':checked'),
            printShopCopy: $('#printShopCopy').is(':checked'),
            printCustomerName: $('#printCustomerName').is(':checked'),
            printCustomerPhone: $('#printCustomerPhone').is(':checked'),
            printCustomerAddress: $('#printCustomerAddress').is(':checked'),
            printMeasurementName: $('#printMeasurementName').is(':checked'),
            printStyleCategory: $('#printStyleCategory').is(':checked'),
            printBarcode: $('#printBarcode').is(':checked'),
            topSpace: parseInt($('#measurementTopSpace').val()) || 0,
            fontSize: parseInt($('#measurementFontSize').val()) || 14
        };

        console.log('Saving measurement settings:', settings);

        // Validate
        if (settings.topSpace < 0 || settings.topSpace > 200) {
            showAlert('warning', 'উপরের স্পেস 0 থেকে 200 এর মধ্যে হতে হবে');
            return;
        }

        $('#loadingSpinner').show();

        $.ajax({
            url: `/api/institution/${institutionId}/measurement-print-settings`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(settings),
            success: function(response) {
                console.log('Measurement settings saved:', response);
                if (response.success) {
                    showAlert('success', response.message || 'মাপ প্রিন্ট সেটিং সফলভাবে সংরক্ষিত হয়েছে');
                } else {
                    showAlert('error', response.message || 'সেটিং সংরক্ষণ করতে ব্যর্থ হয়েছে');
                }
            },
            error: function(xhr) {
                console.error('Error saving measurement settings:', xhr);
                let errorMessage = 'সেটিং সংরক্ষণ করতে ব্যর্থ হয়েছে';
                
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.message) {
                        errorMessage = response.message;
                    }
                } catch (e) {
                    // Ignore
                }
                
                showAlert('error', errorMessage);
            },
            complete: function() {
                $('#loadingSpinner').hide();
            }
        });
    }

    // Save receipt settings
    function saveReceiptSettings() {
        const institutionId = sessionStorage.getItem('institutionId');

        const settings = {
            showShopName: $('#showShopName').is(':checked'),
            showServedBy: $('#showServedBy').is(':checked'),
            showReceiptBarcode: $('#showReceiptBarcode').is(':checked'),
            topSpace: parseInt($('#receiptTopSpace').val()) || 0,
            fontSize: parseInt($('#receiptFontSize').val()) || 14,
            poweredByInfo: $('#poweredByInfo').val() || ''
        };

        console.log('Saving receipt settings:', settings);

        // Validate
        if (settings.topSpace < 0 || settings.topSpace > 200) {
            showAlert('warning', 'Top Space must be between 0 and 200');
            return;
        }

        $('#loadingSpinner').show();

        $.ajax({
            url: `/api/institution/${institutionId}/money-receipt-print-settings`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(settings),
            success: function(response) {
                console.log('Receipt settings saved:', response);
                if (response.success) {
                    showAlert('success', response.message || 'মানি রিসিট প্রিন্ট সেটিং সফলভাবে সংরক্ষিত হয়েছে');
                } else {
                    showAlert('error', response.message || 'সেটিং সংরক্ষণ করতে ব্যর্থ হয়েছে');
                }
            },
            error: function(xhr) {
                console.error('Error saving receipt settings:', xhr);
                let errorMessage = 'সেটিং সংরক্ষণ করতে ব্যর্থ হয়েছে';
                
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.message) {
                        errorMessage = response.message;
                    }
                } catch (e) {
                    // Ignore
                }
                
                showAlert('error', errorMessage);
            },
            complete: function() {
                $('#loadingSpinner').hide();
            }
        });
    }

    // Show alert
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

        // Auto dismiss after 5 seconds
        setTimeout(() => {
            alert.fadeOut(300, function() {
                $(this).remove();
            });
        }, 5000);
    }
})();
