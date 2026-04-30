// TailorBD - Tailor Shop Info Page JavaScript

let institutionData = null;

// Check Authentication
$(document).ready(function() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const institutionId = sessionStorage.getItem('institutionId');
    const registrationId = sessionStorage.getItem('registrationId');
    const username = sessionStorage.getItem('username');

    console.log('Tailor Info - Session Check:', {
        isLoggedIn: isLoggedIn,
        institutionId: institutionId,
        registrationId: registrationId,
        username: username
    });

    if (!isLoggedIn || !institutionId) {
        console.error('Authentication failed, redirecting to login');
        window.location.href = '/login.html';
        return;
    }

    console.log('Authentication successful, loading shop info');

    // Load shop info
    loadShopInfo();

    // Initialize event listeners
    initializePageEventListeners();
});

// Initialize Page-Specific Event Listeners
function initializePageEventListeners() {
    // Logo Upload
    $('#logoInput').on('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            uploadLogo(file);
        }
    });
}

// Load Shop Information
function loadShopInfo() {
    const institutionId = sessionStorage.getItem('institutionId');
    
    showAlert('Loading shop information...', 'info');
    
    $.ajax({
        url: '/api/institution/' + institutionId,
        method: 'GET',
        success: function(response) {
            if (response.success && response.data) {
                institutionData = response.data;
                populateForm(response.data);
                hideAlert();
            } else {
                showAlert('Failed to load shop information', 'error');
            }
        },
        error: function(xhr) {
            console.error('Failed to load shop info:', xhr.responseText);
            showAlert('Error loading shop information. Please try again.', 'error');
        }
    });
}

// Populate Form with Data
function populateForm(data) {
    // Basic Information
    $('#institutionName').val(data.institutionName || '');
    $('#dialogTitle').val(data.dialog_Title || '');
    $('#established').val(data.established || '');
    $('#staff').val(data.staff || '');
    
    // Contact Information
    $('#phone').val(data.phone || '');
    $('#email').val(data.email || '');
    $('#website').val(data.website || '');
    
    // Address Information
    $('#address').val(data.address || '');
    $('#city').val(data.city || '');
    $('#state').val(data.state || '');
    $('#localArea').val(data.localArea || '');
    $('#postalCode').val(data.postalCode || '');
    
    // Update Header
    $('#shopNameDisplay').text(data.institutionName || 'Your Tailor Shop');
    $('#shopPhoneDisplay').text(data.phone || '---');
    $('#shopEmailDisplay').text(data.email || '---');
    $('#shopAddressDisplay').text(data.address || '---');
    
    // Load Logo
    if (data.institutionLogo && data.institutionLogo.length > 0) {
        $('#shopLogo').attr('src', '/api/institution/' + data.institutionID + '/logo');
    } else {
        $('#shopLogo').attr('src', 'https://ui-avatars.com/api/?name=' + encodeURIComponent(data.institutionName || 'Shop') + '&background=667eea&color=fff&size=150');
    }
}

// Save Shop Information
function saveShopInfo() {
    const institutionId = sessionStorage.getItem('institutionId');
    
    console.log('Saving shop info for institution:', institutionId);
    
    // Validate required fields
    const institutionName = $('#institutionName').val().trim();
    const phone = $('#phone').val().trim();
    const address = $('#address').val().trim();
    
    if (!institutionName || !phone || !address) {
        const message = window.currentLang === 'en' ? 'Please fill all required fields' : 'দয়া করে সব প্রয়োজনীয় ফিল্ড পূরণ করুন';
        console.error('Validation failed:', { institutionName, phone, address });
        showAlert(message, 'error');
        return;
    }
    
    // Prepare data
    const data = {
        institutionName: institutionName,
        dialog_Title: $('#dialogTitle').val().trim(),
        established: $('#established').val().trim(),
        staff: $('#staff').val().trim(),
        phone: phone,
        email: $('#email').val().trim(),
        website: $('#website').val().trim(),
        address: address,
        city: $('#city').val().trim(),
        state: $('#state').val().trim(),
        localArea: $('#localArea').val().trim(),
        postalCode: $('#postalCode').val().trim()
    };
    
    console.log('Data to save:', data);
    
    // Show loading state
    const $btn = $('#saveBtn');
    const originalHtml = $btn.html();
    $btn.prop('disabled', true).html('<span class="spinner-border me-2"></span>' + (window.currentLang === 'en' ? 'Saving...' : 'সংরক্ষণ হচ্ছে...'));
    
    $.ajax({
        url: '/api/institution/' + institutionId,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(response) {
            console.log('Save response:', response);
            if (response.success) {
                showAlert(
                    window.currentLang === 'en' ? 'Shop information updated successfully!' : 'প্রতিষ্ঠানের তথ্য সফলভাবে আপডেট হয়েছে!',
                    'success'
                );
                
                // Update header display
                $('#shopNameDisplay').text(data.institutionName);
                $('#shopPhoneDisplay').text(data.phone);
                $('#shopEmailDisplay').text(data.email);
                $('#shopAddressDisplay').text(data.address);
                
                // Reload after 2 seconds
                setTimeout(() => {
                    loadShopInfo();
                }, 2000);
            } else {
                console.error('Update failed:', response);
                showAlert(
                    window.currentLang === 'en' ? 'Failed to update: ' + response.message : 'আপডেট ব্যর্থ: ' + response.message,
                    'error'
                );
            }
        },
        error: function(xhr) {
            console.error('Update error:', xhr);
            console.error('Response text:', xhr.responseText);
            console.error('Status:', xhr.status);
            showAlert(
                window.currentLang === 'en' ? 'An error occurred while updating' : 'আপডেট করার সময় একটি ত্রুটি ঘটেছে',
                'error'
            );
        },
        complete: function() {
            $btn.prop('disabled', false).html(originalHtml);
        }
    });
}

// Upload Logo
function uploadLogo(file) {
    const institutionId = sessionStorage.getItem('institutionId');
    
    // Validate file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        showAlert(
            window.currentLang === 'en' ? 'Only JPEG, PNG, and GIF images are allowed' : 'শুধুমাত্র JPEG, PNG এবং GIF ছবি অনুমোদিত',
            'error'
        );
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showAlert(
            window.currentLang === 'en' ? 'Image size must be less than 5MB' : 'ছবির আকার ৫MB এর কম হতে হবে',
            'error'
        );
        return;
    }
    
    // Preview image
    const reader = new FileReader();
    reader.onload = function(e) {
        $('#shopLogo').attr('src', e.target.result);
    };
    reader.readAsDataURL(file);
    
    // Upload to server
    const formData = new FormData();
    formData.append('logo', file);
    
    showAlert('Uploading logo...', 'info');
    
    $.ajax({
        url: '/api/institution/' + institutionId + '/logo',
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(response) {
            if (response.success) {
                showAlert(
                    window.currentLang === 'en' ? 'Logo updated successfully!' : 'লোগো সফলভাবে আপডেট হয়েছে!',
                    'success'
                );
                
                // Update logo with cache buster
                const imageUrl = '/api/institution/' + institutionId + '/logo?t=' + new Date().getTime();
                $('#shopLogo').attr('src', imageUrl);
            } else {
                showAlert(
                    window.currentLang === 'en' ? 'Failed to upload logo: ' + response.message : 'লোগো আপলোড ব্যর্থ: ' + response.message,
                    'error'
                );
            }
        },
        error: function(xhr) {
            console.error('Upload failed:', xhr.responseText);
            showAlert(
                window.currentLang === 'en' ? 'An error occurred while uploading logo' : 'লোগো আপলোড করার সময় একটি ত্রুটি ঘটেছে',
                'error'
            );
        }
    });
}

// Show Alert
function showAlert(message, type) {
    console.log('showAlert called:', { message, type });
    
    const alertTypes = {
        success: { icon: 'check-circle', class: 'alert-success' },
        error: { icon: 'exclamation-circle', class: 'alert-error' },
        info: { icon: 'info-circle', class: 'alert-info' }
    };
    
    const alert = alertTypes[type] || alertTypes.info;
    
    const alertHtml = `
        <div class="alert ${alert.class}" style="display: flex;">
            <i class="fas fa-${alert.icon}"></i>
            <span>${message}</span>
        </div>
    `;
    
    const $container = $('#alertContainer');
    console.log('Alert container found:', $container.length);
    console.log('Alert HTML:', alertHtml);
    
    $container.html(alertHtml).show();
    
    // Scroll to top to show alert
    $('html, body').animate({ scrollTop: 0 }, 300);
    
    console.log('Alert displayed');
    
    // Auto hide after 5 seconds for success/info
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            console.log('Auto-hiding alert');
            hideAlert();
        }, 5000);
    }
}

// Hide Alert
function hideAlert() {
    $('#alertContainer').fadeOut(300, function() {
        $(this).html('').show();
    });
}

// Profile and Password functions are handled by app-components.js
// No need to duplicate here
