// TailorBD - Dress Add Page JavaScript

let dressData = [];

// Global variables
let selectedClothForId = 0;
let editingDressId = null;

// Show Alert Message
function showAlert(message, type = 'success') {
    const alertDiv = $(`
        <div class="alert alert-${type === 'success' ? 'success' : 'error'}" role="alert">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            ${message}
        </div>
    `);
    
    $('#alertContainer').html(alertDiv);
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        alertDiv.fadeOut(400, function() {
            $(this).remove();
        });
    }, 3000);
}

// Check Authentication
$(document).ready(function() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const institutionId = sessionStorage.getItem('institutionId');
    const registrationId = sessionStorage.getItem('registrationId');
    const username = sessionStorage.getItem('username');

    console.log('Dress Add - Session Check:', {
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

    console.log('Authentication successful, loading data');

    // Load data
    loadClothForList();
    loadDresses();
});

// Load Cloth For List (কার পোষাক)
function loadClothForList() {
    $.ajax({
        url: '/api/dress/cloth-for-list',
        method: 'GET',
        success: function(response) {
            if (response.success && response.data) {
                const $select = $('#clothFor');
                $select.empty().append('<option value="">নির্বাচন করুন</option>');
                
                response.data.forEach(item => {
                    $select.append(`<option value="${item.Cloth_For_ID}">${item.Cloth_For}</option>`);
                });
            }
        },
        error: function(xhr) {
            console.error('Failed to load cloth for list:', xhr);
        }
    });
}

// Load Dresses
function loadDresses() {
    const institutionId = sessionStorage.getItem('institutionId');
    
    $.ajax({
        url: '/api/dress/' + institutionId,
        method: 'GET',
        success: function(response) {
            if (response.success && response.data) {
                dressData = response.data;
                populateTable(response.data);
                
                // Show update serials button if there are dresses
                if (response.data.length > 0) {
                    $('#updateSerialsBtn').show();
                }
            }
        },
        error: function(xhr) {
            console.error('Failed to load dresses:', xhr);
            showAlert('ডাটা লোড করতে ব্যর্থ হয়েছে', 'error');
        }
    });
}

// Populate Table
function populateTable(dresses) {
    const $tbody = $('#dressTableBody');
    $tbody.empty();

    if (dresses.length === 0) {
        $tbody.append(`
            <tr>
                <td colspan="7" class="text-center py-4">
                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <p class="lang-content" data-en="No dresses found. Add your first dress!" data-bn="কোন পোষাক পাওয়া যায়নি। আপনার প্রথম পোষাক যুক্ত করুন!">No dresses found</p>
                </td>
            </tr>
        `);
        return;
    }

    dresses.forEach(dress => {
        // Check if image exists
        const hasImage = dress.Image && dress.Image.length > 0;
        const imageUrl = hasImage ? `/api/dress/${dress.DressID}/image` : '';
        
        // Create image HTML with proper fallback
        const imageHtml = hasImage 
            ? `<img src="${imageUrl}" alt="${dress.Dress_Name}" class="dress-thumbnail" 
                 onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';">
               <div class="dress-thumbnail-placeholder" style="display:none;">
                   <i class="fas fa-tshirt"></i>
               </div>`
            : `<div class="dress-thumbnail-placeholder">
                   <i class="fas fa-tshirt"></i>
               </div>`;

        const row = `
            <tr class="dress-table-row" data-dress-id="${dress.DressID}">
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editDress(${dress.DressID})" title="এডিট করুন">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
                <td>
                    <a href="javascript:void(0)" onclick="showPriceModal(${dress.DressID}, '${dress.Dress_Name}')" class="dress-name-link">
                        ${dress.Dress_Name}
                    </a>
                </td>
                        <td class="text-center">${Number(dress.CuttingCost||0).toFixed(2)}</td>
                        <td class="text-center">${Number(dress.SewingCost||0).toFixed(2)}</td>
                <td>
                    ${imageHtml}
                </td>
                <td>
                    <a href="/dress-style-add.html?dressid=${dress.DressID}" 
                       class="btn btn-sm btn-warning" title="স্টাইল যুক্ত করুন ">
                        <i class="fas fa-palette"></i>
                    </a>
                </td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="showMeasurementModal(${dress.DressID}, '${dress.Dress_Name}', ${dress.Cloth_For_ID})" title="মাপ যুক্ত করুন">
                        <i class="fas fa-ruler"></i>
                    </button>
                </td>
                <td>
                    <input type="number" class="form-control form-control-sm dress-serial" 
                           value="${dress.DressSerial || ''}" 
                           data-dress-id="${dress.DressID}" 
                           min="1" 
                           style="width: 80px;">
                </td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteDress(${dress.DressID}, '${dress.Dress_Name}')" title="ডিলিট করুন">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        $tbody.append(row);
    });

    // Update language
    if (window.updateLanguage) {
        window.updateLanguage();
    }
}

// Add Dress
function addDress() {
    const institutionId = sessionStorage.getItem('institutionId');
    const registrationId = sessionStorage.getItem('registrationId');

    // Validate
    const dressName = $('#dressName').val().trim();
    const clothFor = $('#clothFor').val();

    if (!dressName || !clothFor) {
        showAlert('সব তথ্য পূরণ করুন', 'error');
        return;
    }

    // Prepare data
    const data = {
        Dress_Name: dressName,
                CuttingCost: parseFloat($('#addCuttingCost').val()) || 0,
                SewingCost: parseFloat($('#addSewingCost').val()) || 0,
        Cloth_For_ID: parseInt(clothFor),
        RegistrationID: parseInt(registrationId),
        InstitutionID: parseInt(institutionId),
        DressSerial: $('#dressSerial').val() ? parseInt($('#dressSerial').val()) : null
    };

    // Show loading
    const $btn = $('button[onclick="addDress()"]');
    const originalHtml = $btn.html();
    $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span>যুক্ত হচ্ছে...');

    $.ajax({
        url: '/api/dress',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(response) {
            if (response.success) {
                const dressId = response.data.dressId;

                // Upload image if selected
                const imageFile = $('#dressImage')[0].files[0];
                if (imageFile) {
                    uploadDressImage(dressId, imageFile, function() {
                        showAlert('পোষাক সফলভাবে যুক্ত হয়েছে', 'success');
                        $('#addDressModal').modal('hide');
                        $('#addDressForm')[0].reset();
                        loadDresses();
                    });
                } else {
                    showAlert('পোষাক সফলভাবে যুক্ত হয়েছে', 'success');
                    $('#addDressModal').modal('hide');
                    $('#addDressForm')[0].reset();
                    loadDresses();
                }
            } else {
                showAlert(response.message || 'যুক্ত করতে ব্যর্থ হয়েছে', 'error');
            }
        },
        error: function(xhr) {
            console.error('Add dress failed:', xhr);
            showAlert('একটি ত্রুটি ঘটেছে', 'error');
        },
        complete: function() {
            $btn.prop('disabled', false).html(originalHtml);
        }
    });
}

// Upload Dress Image
function uploadDressImage(dressId, file, callback) {
    const formData = new FormData();
    formData.append('image', file);

    $.ajax({
        url: '/api/dress/' + dressId + '/image',
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(response) {
            if (callback) callback();
        },
        error: function(xhr) {
            console.error('Image upload failed:', xhr);
        }
    });
}

// Edit Dress
function editDress(dressId) {
    const dress = dressData.find(d => d.DressID === dressId);
    if (!dress) return;

    $('#editDressId').val(dressId);
    $('#editDressName').val(dress.Dress_Name);
                $('#editCuttingCost').val(dress.CuttingCost != null ? dress.CuttingCost : 0);
                $('#editSewingCost').val(dress.SewingCost != null ? dress.SewingCost : 0);

    // Show current image
    if (dress.Image && dress.Image.length > 0) {
        $('#editDressImagePreview').attr('src', '/api/dress/' + dressId + '/image').show();
    } else {
        $('#editDressImagePreview').hide();
    }

    $('#editDressModal').modal('show');
}

// Update Dress
function updateDress() {
    const dressId = $('#editDressId').val();
    const institutionId = sessionStorage.getItem('institutionId');

    const data = {
        Dress_Name: $('#editDressName').val().trim(),
                CuttingCost: parseFloat($('#editCuttingCost').val()) || 0,
                SewingCost: parseFloat($('#editSewingCost').val()) || 0,
        InstitutionID: parseInt(institutionId)
    };

    if (!data.Dress_Name) {
        showAlert('পোষাকের নাম লিখুন', 'error');
        return;
    }

    // Show loading
    const $btn = $('button[onclick="updateDress()"]');
    const originalHtml = $btn.html();
    $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span>আপডেট হচ্ছে...');

    $.ajax({
        url: '/api/dress/' + dressId,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(response) {
            if (response.success) {
                // Upload new image if selected
                const imageFile = $('#editDressImage')[0].files[0];
                if (imageFile) {
                    uploadDressImage(dressId, imageFile, function() {
                        showAlert('পোষাক সফলভাবে আপডেট হয়েছে', 'success');
                        $('#editDressModal').modal('hide');
                        loadDresses();
                    });
                } else {
                    showAlert('পোষাক সফলভাবে আপডেট হয়েছে', 'success');
                    $('#editDressModal').modal('hide');
                    loadDresses();
                }
            } else {
                showAlert(response.message || 'আপডেট করতে ব্যর্থ হয়েছে', 'error');
            }
        },
        error: function(xhr) {
            console.error('Update failed:', xhr);
            showAlert('একটি ত্রুটি ঘটেছে', 'error');
        },
        complete: function() {
            $btn.prop('disabled', false).html(originalHtml);
        }
    });
}

// Delete Dress
function deleteDress(dressId, dressName) {
    const message = window.currentLang === 'en' 
        ? `Are you sure you want to delete "${dressName}"?`
        : `আপনি কি "${dressName}" ডিলিট করতে চান?`;

    if (!confirm(message)) return;

    const institutionId = sessionStorage.getItem('institutionId');

    $.ajax({
        url: '/api/dress/' + dressId + '/' + institutionId,
        method: 'DELETE',
        success: function(response) {
            if (response.success) {
                showAlert('পোষাক সফলভাবে ডিলিট হয়েছে', 'success');
                loadDresses();
            } else {
                showAlert(response.message || 'ডিলিট করতে ব্যর্থ হয়েছে', 'error');
            }
        },
        error: function(xhr) {
            const response = xhr.responseJSON;
            if (response && response.message) {
                showAlert(response.message, 'error');
            } else {
                showAlert('একটি ত্রুটি ঘটেছে', 'error');
            }
        }
    });
}

// Update Serials
$('#updateSerialsBtn').on('click', function() {
    const institutionId = sessionStorage.getItem('institutionId');
    const serials = [];

    $('.dress-serial').each(function() {
        const $input = $(this);
        const dressId = $input.data('dress-id');
        const serial = $input.val();

        if (serial && serial.trim() !== '') {
            serials.push({
                DressID: dressId,
                DressSerial: parseInt(serial),
                InstitutionID: parseInt(institutionId)
            });
        }
    });

    if (serials.length === 0) {
        showAlert('কোন সিরিয়াল নম্বর দেওয়া হয়নি', 'error');
        return;
    }

    // Show loading
    const $btn = $(this);
    const originalHtml = $btn.html();
    $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span>আপডেট হচ্ছে...');

    $.ajax({
        url: '/api/dress/update-serials',
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(serials),
        success: function(response) {
            if (response.success) {
                showAlert('সিরিয়াল সফলভাবে আপডেট হয়েছে', 'success');
                loadDresses();
            } else {
                showAlert(response.message || 'আপডেট করতে ব্যর্থ হয়েছে', 'error');
            }
        },
        error: function(xhr) {
            console.error('Update serials failed:', xhr);
            showAlert('একটি ত্রুটি ঘটেছে', 'error');
        },
        complete: function() {
            $btn.prop('disabled', false).html(originalHtml);
        }
    });
});

// Show Price Modal
let currentDressId = null;
let currentDressName = '';

window.showPriceModal = function(dressId, dressName) {
    currentDressId = dressId;
    currentDressName = dressName;
    
    $('#priceDressName').text(dressName);
    $('#priceForm')[0].reset();
    
    loadDressPrices(dressId);
    
    const modal = new bootstrap.Modal(document.getElementById('priceModal'));
    modal.show();
};

// Load Dress Prices
function loadDressPrices(dressId) {
    const institutionId = sessionStorage.getItem('institutionId');
    
    $.ajax({
        url: `/api/dressprice/dress/${dressId}?institutionId=${institutionId}`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                populatePriceTable(response.data);
            }
        },
        error: function(xhr) {
            console.error('Failed to load prices:', xhr);
            showAlert('দাম লোড করতে ব্যর্থ', 'error');
        }
    });
}

// Populate Price Table
function populatePriceTable(prices) {
    const $tbody = $('#priceTableBody');
    $tbody.empty();
    
    if (prices.length === 0) {
        $tbody.append(`
            <tr>
                <td colspan="4" class="text-center py-3 text-muted">
                    <i class="fas fa-inbox fa-2x mb-2"></i>
                    <p>কোন চার্জ যুক্ত করা হয়নি</p>
                </td>
            </tr>
        `);
        return;
    }
    
    prices.forEach(price => {
        const row = `
            <tr>
                <td>${price.PriceFor}</td>
                <td>৳${price.Price}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editPrice(${price.DressPriceId}, '${price.PriceFor}', ${price.Price})" title="এডিট">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deletePrice(${price.DressPriceId}, '${price.PriceFor}')" title="ডিলিট">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        $tbody.append(row);
    });
}

// Add/Update Price
$('#priceForm').on('submit', function(e) {
    e.preventDefault();
    
    const priceFor = $('#priceFor').val().trim();
    const price = parseFloat($('#price').val());
    const priceId = $('#priceId').val();
    
    if (!priceFor || !price) {
        showAlert('সব ফিল্ড পূরণ করুন', 'error');
        return;
    }
    
    const institutionId = sessionStorage.getItem('institutionId');
    const registrationId = sessionStorage.getItem('registrationId');
    
    const data = {
        registrationId: parseInt(registrationId),
        institutionId: parseInt(institutionId),
        dressId: currentDressId,
        priceFor: priceFor,
        price: price
    };
    
    const isEdit = priceId !== '';
    const url = isEdit ? `/api/dressprice/${priceId}` : '/api/dressprice';
    const method = isEdit ? 'PUT' : 'POST';
    
    console.log('Saving price:', { url, method, data });
    
    $.ajax({
        url: url,
        method: method,
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(response) {
            console.log('Save price response:', response);
            
            if (response.success) {
                // Show success message in modal
                const modalAlertDiv = $(`
                    <div class="alert alert-success mb-3" role="alert">
                        <i class="fas fa-check-circle me-2"></i>
                        ${response.message}
                    </div>
                `);
                
                $('#priceForm').before(modalAlertDiv);
                
                // Auto hide after 3 seconds
                setTimeout(() => {
                    modalAlertDiv.fadeOut(400, function() {
                        $(this).remove();
                    });
                }, 3000);
                
                // Reset form
                $('#priceForm')[0].reset();
                $('#priceId').val('');
                $('#priceSubmitBtn').html('<i class="fas fa-plus me-1"></i> যুক্ত করুন');
                
                // Reload prices
                loadDressPrices(currentDressId);
            }
        },
        error: function(xhr) {
            console.error('Failed to save price:', xhr);
            console.error('Response:', xhr.responseText);
            
            const modalAlertDiv = $(`
                <div class="alert alert-danger mb-3" role="alert">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    সংরক্ষণ বৈর্থ হয়েছে
                </div>
            `);
            
            $('#priceForm').before(modalAlertDiv);
            
            setTimeout(() => {
                modalAlertDiv.fadeOut(400, function() {
                    $(this).remove();
                });
            }, 3000);
        }
    });
});

// Edit Price
window.editPrice = function(priceId, priceFor, price) {
    $('#priceId').val(priceId);
    $('#priceFor').val(priceFor);
    $('#price').val(price);
    $('#priceSubmitBtn').html('<i class="fas fa-save me-1"></i> আপডেট করুন');
    
    // Scroll to form
    $('#priceForm')[0].scrollIntoView({ behavior: 'smooth' });
};

// Delete Price
window.deletePrice = function(priceId, priceFor) {
    if (!confirm(`আপনি কি "${priceFor}" চার্জটি ডিলিট করতে চান?`)) {
        return;
    }
    
    const institutionId = sessionStorage.getItem('institutionId');
    
    console.log('Deleting price:', priceId);
    
    $.ajax({
        url: `/api/dressprice/${priceId}?institutionId=${institutionId}`,
        method: 'DELETE',
        success: function(response) {
            console.log('Delete price response:', response);
            
            if (response.success) {
                // Show success message in modal
                const modalAlertDiv = $(`
                    <div class="alert alert-success mb-3" role="alert">
                        <i class="fas fa-check-circle me-2"></i>
                        ${response.message}
                    </div>
                `);
                
                $('.modal-body').prepend(modalAlertDiv);
                
                // Auto hide after 3 seconds
                setTimeout(() => {
                    modalAlertDiv.fadeOut(400, function() {
                        $(this).remove();
                    });
                }, 3000);
                
                // Reload prices
                loadDressPrices(currentDressId);
            }
        },
        error: function(xhr) {
            console.error('Failed to delete price:', xhr);
            console.error('Response:', xhr.responseText);
            
            const modalAlertDiv = $(`
                <div class="alert alert-danger mb-3" role="alert">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    ডিলিট ব্যর্থ হয়েছে
                </div>
            `);
            
            $('.modal-body').prepend(modalAlertDiv);
            
            setTimeout(() => {
                modalAlertDiv.fadeOut(400, function() {
                    $(this).remove();
                });
            }, 3000);
        }
    });
};

// ============================================
// MEASUREMENT MODAL FUNCTIONS
// ============================================

let currentMeasurementDressId = null;
let currentMeasurementDressName = '';
let currentMeasurementClothForId = null;

// Show Measurement Modal
window.showMeasurementModal = function(dressId, dressName, clothForId) {
    currentMeasurementDressId = dressId;
    currentMeasurementDressName = dressName;
    currentMeasurementClothForId = clothForId;
    
    $('#measurementDressName').text(dressName);
    $('#measurementGroupForm')[0].reset();
    $('#measurementModalAlert').empty();
    
    loadMeasurementGroups(dressId, clothForId);
    loadUnlinkedTypes();

    const modal = new bootstrap.Modal(document.getElementById('measurementModal'));
    modal.show();
};

// Load Measurement Groups
function loadMeasurementGroups(dressId, clothForId) {
    const institutionId = sessionStorage.getItem('institutionId');

    $('#measurementGroupsList').html(`
        <div class="text-center py-4">
            <span class="spinner-border text-primary"></span>
            <p class="mt-2 text-muted">লোড হচ্ছে...</p>
        </div>
    `);

    $.ajax({
        url: `/api/measurement/dress/${dressId}?institutionId=${institutionId}&clothForId=${clothForId}`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                displayMeasurementGroups(response.data);
                loadUnlinkedTypes();
            }
        },
        error: function(xhr) {
            $('#measurementGroupsList').html(`
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    মাপ লোড করতে ব্যর্থ হয়েছে。
                </div>
            `);
        }
    });
}

// Display Measurement Groups
function displayMeasurementGroups(groups) {
    const $container = $('#measurementGroupsList');
    $container.empty();
    $('#noGroupsPlaceholder').toggle(groups.length === 0);
    
    if (groups.length === 0) {
        return;
    }
    
    groups.forEach(group => {
        const $groupCard = $(`
            <div class="meas-group-card" data-group-id="${group.MeasurementTypeID}">
                <div class="group-header">
                    <div class="group-header-left">
                        <i class="fas fa-layer-group text-primary"></i>
                        <strong class="group-name">${group.MeasurementType}</strong>
                        <span class="serial-badge">
                            সির: <span class="group-serial-display">${group.Ascending || '—'}</span>
                        </span>
                    </div>
                    <div class="group-header-right">
                        <button class="group-btn-edit"
                                title="এডিট করুন"
                                onclick="openEditGroupModal(${group.MeasurementTypeID}, '${group.MeasurementType.replace(/'/g,"\\'")}', ${group.Ascending || 0})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="group-btn-add"
                                title="এই গ্রুপে মাপ যুক্ত করুন"
                                onclick="toggleAddTypeForm(${group.MeasurementTypeID}, '${group.MeasurementType.replace(/'/g,"\\'")}')">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="group-btn-delete"
                                title="গ্রুপ মুছুন"
                                onclick="deleteMeasurementGroup(${group.MeasurementTypeID}, '${group.MeasurementType.replace(/'/g,"\\'")}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>

                <!-- Inline Add Type Form -->
                <div class="meas-add-type-form" id="add-type-form-${group.MeasurementTypeID}">
                    <div class="meas-existing-row">
                        <div class="meas-field-grow">
                            <label class="form-label-sm">বিদ্যমান মাপ / মূল ক্যাটাগরি</label>
                            <select class="form-select" id="existingTypeSelect-${group.MeasurementTypeID}">
                                <option value="">-- লোড হচ্ছে... --</option>
                            </select>
                        </div>
                        <div class="meas-field-btn">
                            <button type="button" class="btn btn-primary"
                                    onclick="assignExistingTypeFromDropdown(${group.MeasurementTypeID})">
                                <i class="fas fa-link"></i> <span class="d-none d-sm-inline">যুক্ত</span>
                            </button>
                        </div>
                    </div>
                    <div class="meas-divider-or"><span>অথবা নতুন যুক্ত করুন</span></div>
                    <form onsubmit="submitMeasurementType(event, ${group.MeasurementTypeID})">
                        <div class="meas-input-row">
                            <div class="meas-field-grow">
                                <label class="form-label-sm">মাপের নাম</label>
                                <input type="text" class="form-control"
                                       id="typeName-${group.MeasurementTypeID}"
                                       placeholder="যেমন: গলা, হাতা..." required>
                            </div>
                            <div class="meas-field-sm">
                                <label class="form-label-sm">সিরিয়াল</label>
                                <input type="number" class="form-control"
                                       id="typeSerial-${group.MeasurementTypeID}"
                                       placeholder="১" min="1">
                            </div>
                            <div class="meas-field-btn">
                                <button type="submit" class="btn btn-success">
                                    <i class="fas fa-plus"></i> <span class="d-none d-sm-inline">যুক্ত</span>
                                </button>
                            </div>
                            <div class="meas-field-btn">
                                <button type="button" class="btn btn-secondary"
                                        onclick="$('#add-type-form-${group.MeasurementTypeID}').slideUp(150)">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                <div class="meas-types-body">
                    <div class="meas-types-grid" id="types-${group.MeasurementTypeID}">
                        <div class="text-center py-2">
                            <span class="spinner-border spinner-border-sm text-primary"></span>
                        </div>
                    </div>
                </div>
            </div>
        `);
        
        $container.append($groupCard);
        loadMeasurementTypes(group.MeasurementTypeID);
    });
}

// Toggle inline add-type form
window.toggleAddTypeForm = function(groupId) {
    const $form = $(`#add-type-form-${groupId}`);
    // Close others
    $('.meas-add-type-form').not($form).slideUp(150);
    $form.slideToggle(150, function() {
        if ($(this).is(':visible')) {
            loadAssignableTypes(groupId);
            $(`#typeName-${groupId}`).focus();
        }
    });
};

function loadAssignableTypes(groupId) {
    const institutionId = sessionStorage.getItem('institutionId');
    const $select = $(`#existingTypeSelect-${groupId}`);

    if (!$select.length || !currentMeasurementDressId) return;

    $select.html('<option value="">-- লোড হচ্ছে... --</option>');

    $.ajax({
        url: `/api/measurement/group/${groupId}/assignable?dressId=${currentMeasurementDressId}&institutionId=${institutionId}`,
        method: 'GET',
        success: function(response) {
            populateAssignableDropdown(groupId, response.success ? response.data : []);
        },
        error: function() {
            populateAssignableDropdown(groupId, []);
        }
    });
}

function populateAssignableDropdown(groupId, types) {
    const $select = $(`#existingTypeSelect-${groupId}`);
    if (!$select.length) return;

    let html = '<option value="">-- বিদ্যমান মাপ নির্বাচন করুন --</option>';
    if (!types || types.length === 0) {
        html += '<option value="" disabled>কোনো বিদ্যমান মাপ নেই</option>';
    } else {
        types.forEach(function(t) {
            const id = t.measurementTypeID || t.MeasurementTypeID;
            const name = t.measurementType || t.MeasurementType;
            html += `<option value="${id}">${name}</option>`;
        });
    }
    $select.html(html);
}

window.assignExistingTypeFromDropdown = function(groupId) {
    const typeId = parseInt($(`#existingTypeSelect-${groupId}`).val(), 10);
    if (!typeId) {
        showMeasurementModalAlert('একটি বিদ্যমান মাপ নির্বাচন করুন', 'error');
        return;
    }
    assignTypeToGroup(typeId, groupId);
};

// Load Measurement Types for a Group
function loadMeasurementTypes(groupId) {
    $.ajax({
        url: `/api/measurement/group/${groupId}/types`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                displayMeasurementTypes(groupId, response.data);
            }
        },
        error: function() {
            $(`#types-${groupId}`).html(`<div class="alert alert-warning py-1 mb-0 small">মাপ লোড করতে ব্যর্থ</div>`);
        }
    });
}

// Display Measurement Types
function displayMeasurementTypes(groupId, types) {
    const $container = $(`#types-${groupId}`);
    $container.empty();
    
    if (types.length === 0) {
        $container.html(`
            <p class="meas-empty-msg mb-0">
                <i class="fas fa-info-circle me-1"></i>
                এই গ্রুপে কোনো মাপ নেই — উপরের <b>+</b> বাটন দিয়ে যুক্ত করুন。
            </p>
        `);
        return;
    }
    
    types.forEach(type => {
        const $chip = $(`
            <div class="meas-type-chip">
                <span class="chip-icon"><i class="fas fa-minus"></i></span>
                <span>${type.MeasurementType}</span>
                ${type.SerialNo ? `<span class="chip-serial">${type.SerialNo}</span>` : ''}
                <span class="chip-actions">
                    <button class="chip-btn chip-btn-edit" title="এডিট"
                            onclick="openEditTypeModal(${type.MeasurementTypeID}, '${type.MeasurementType.replace(/'/g,"\\'")}', ${groupId}, ${type.SerialNo || 0})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="chip-btn chip-btn-remove" title="গ্রুপ থেকে বাদ (মূল ক্যাটাগরি)"
                            onclick="deleteMeasurementType(${type.MeasurementTypeID}, '${type.MeasurementType.replace(/'/g,"\\'")}', ${groupId})">
                        <i class="fas fa-trash"></i>
                    </button>
                </span>
            </div>
        `);
        $container.append($chip);
    });
}

// Submit new measurement type (inline form)
window.submitMeasurementType = function(e, groupId) {
    e.preventDefault();
    
    const typeName = $(`#typeName-${groupId}`).val().trim();
    const serial   = parseInt($(`#typeSerial-${groupId}`).val()) || null;
    
    if (!typeName) return;
    
    const institutionId  = sessionStorage.getItem('institutionId');
    const registrationId = sessionStorage.getItem('registrationId');
    
    const data = {
        clothForId:         currentMeasurementClothForId,
        institutionId:      parseInt(institutionId),
        registrationId:     parseInt(registrationId),
        dressId:            currentMeasurementDressId,
        measurementGroupId: groupId,
        measurementType:    typeName,
        serialNo:           serial
    };
    
    $.ajax({
        url: '/api/measurement/type',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(response) {
            if (response.success) {
                $(`#typeName-${groupId}`).val('');
                $(`#typeSerial-${groupId}`).val('');
                loadMeasurementTypes(groupId);
                showMeasurementModalAlert('মাপ সফলভাবে যুক্ত হয়েছে', 'success');
            }
        },
        error: function() {
            showMeasurementModalAlert('মাপ যুক্ত করতে ব্যর্থ হয়েছে', 'error');
        }
    });
};

// Add Measurement Group (form submit)
$('#measurementGroupForm').on('submit', function(e) {
    e.preventDefault();
    
    const groupName = $('#measurementGroupName').val().trim();
    const serial    = parseInt($('#measurementGroupSerial').val()) || null;
    
    if (!groupName) return;
    
    const institutionId  = sessionStorage.getItem('institutionId');
    const registrationId = sessionStorage.getItem('registrationId');
    
    const data = {
        clothForId:      currentMeasurementClothForId,
        institutionId:   parseInt(institutionId),
        registrationId:  parseInt(registrationId),
        dressId:         currentMeasurementDressId,
        measurementType: groupName,
        ascending:       serial
    };
    
    $.ajax({
        url: '/api/measurement/group',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(response) {
            if (response.success) {
                $('#measurementGroupForm')[0].reset();
                showMeasurementModalAlert('গ্রুপ সফলভাবে যুক্ত হয়েছে', 'success');
                loadMeasurementGroups(currentMeasurementDressId, currentMeasurementClothForId);
            }
        },
        error: function() {
            showMeasurementModalAlert('গ্রুপ যুক্ত করতে ব্যর্থ হয়েছে', 'error');
        }
    });
});

// Open Edit Group Modal (replaces prompt)
window.openEditGroupModal = function(groupId, groupName, ascending) {
    $('#editGroupId').val(groupId);
    $('#editGroupName').val(groupName);
    $('#editGroupSerial').val(ascending || '');
    new bootstrap.Modal(document.getElementById('editGroupModal')).show();
};

// Save Edit Group
window.saveEditGroup = function() {
    const groupId   = $('#editGroupId').val();
    const groupName = $('#editGroupName').val().trim();
    const serial    = parseInt($('#editGroupSerial').val()) || null;
    
    if (!groupName) return;
    
    const institutionId  = sessionStorage.getItem('institutionId');
    const registrationId = sessionStorage.getItem('registrationId');
    
    $.ajax({
        url: `/api/measurement/group/${groupId}`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({
            institutionId:   parseInt(institutionId),
            registrationId:  parseInt(registrationId),
            clothForId:      currentMeasurementClothForId,
            dressId:         currentMeasurementDressId,
            measurementType: groupName,
            ascending:       serial
        }),
        success: function(response) {
            if (response.success) {
                bootstrap.Modal.getInstance(document.getElementById('editGroupModal')).hide();
                showMeasurementModalAlert('গ্রুপ আপডেট হয়েছে', 'success');
                loadMeasurementGroups(currentMeasurementDressId, currentMeasurementClothForId);
            }
        },
        error: function() {
            showMeasurementModalAlert('আপডেট ব্যর্থ হয়েছে', 'error');
        }
    });
};

// Open Edit Type Modal (replaces prompt)
window.openEditTypeModal = function(typeId, typeName, groupId, serialNo) {
    $('#editTypeId').val(typeId);
    $('#editTypeGroupId').val(groupId);
    $('#editTypeName').val(typeName);
    $('#editTypeSerial').val(serialNo || '');
    new bootstrap.Modal(document.getElementById('editTypeModal')).show();
};

// Save Edit Type
window.saveEditType = function() {
    const typeId    = $('#editTypeId').val();
    const groupId   = parseInt($('#editTypeGroupId').val());
    const typeName  = $('#editTypeName').val().trim();
    const serial    = parseInt($('#editTypeSerial').val()) || null;
    
    if (!typeName) return;
    
    const institutionId  = sessionStorage.getItem('institutionId');
    const registrationId = sessionStorage.getItem('registrationId');
    
    $.ajax({
        url: `/api/measurement/type/${typeId}`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({
            institutionId:      parseInt(institutionId),
            registrationId:     parseInt(registrationId),
            clothForId:         currentMeasurementClothForId,
            dressId:            currentMeasurementDressId,
            measurementGroupId: groupId,
            measurementType:    typeName,
            serialNo:           serial
        }),
        success: function(response) {
            if (response.success) {
                bootstrap.Modal.getInstance(document.getElementById('editTypeModal')).hide();
                showMeasurementModalAlert('মাপ আপডেট হয়েছে', 'success');
                loadMeasurementTypes(groupId);
            }
        },
        error: function() {
            showMeasurementModalAlert('আপডেট ব্যর্থ হয়েছে', 'error');
        }
    });
};

// Delete Measurement Group
window.deleteMeasurementGroup = function(groupId, groupName) {
    if (!confirm(`"${groupName}" গ্রুপটি মুছে ফেলবেন?`)) return;
    
    const institutionId = sessionStorage.getItem('institutionId');
    
    $.ajax({
        url: `/api/measurement/group/${groupId}?institutionId=${institutionId}`,
        method: 'DELETE',
        success: function(response) {
            if (response.success) {
                showMeasurementModalAlert('গ্রুপ মুছে ফেলা হয়েছে', 'success');
                loadMeasurementGroups(currentMeasurementDressId, currentMeasurementClothForId);
            }
        },
        error: function() {
            showMeasurementModalAlert('মুছতে ব্যর্থ হয়েছে', 'error');
        }
    });
};

// Delete Measurement Type (unlink from group → main category)
window.deleteMeasurementType = function(typeId, typeName, groupId) {
    if (!confirm(`"${typeName}" মাপটি গ্রুপ থেকে বাদ দেবেন?\n\nএটি মুছে যাবে না — মূল ক্যাটাগরি হিসেবে দেখাবে। পরে চাইলে আবার অন্য গ্রুপে যুক্ত করতে পারবেন।`)) return;

    const institutionId = sessionStorage.getItem('institutionId');

    $.ajax({
        url: `/api/measurement/type/${typeId}?institutionId=${institutionId}`,
        method: 'DELETE',
        success: function(response) {
            if (response.success) {
                showMeasurementModalAlert('মাপ মূল ক্যাটাগরি করা হয়েছে', 'success');
                loadMeasurementGroups(currentMeasurementDressId, currentMeasurementClothForId);
            }
        },
        error: function(xhr) {
            const msg = xhr.responseJSON?.message || 'মুছতে ব্যর্থ হয়েছে';
            showMeasurementModalAlert(msg, 'error');
        }
    });
};

// Permanently delete an unlinked/orphan measurement type
window.permanentDeleteUnlinkedType = function(typeId, typeName) {
    if (!confirm(`"${typeName}" মাপটি স্থায়ীভাবে ডিলিট করবেন?\n\nকাস্টমার ও অর্ডারের সংশ্লিষ্ট মাপও মুছে যাবে।`)) return;

    const institutionId = sessionStorage.getItem('institutionId');

    $.ajax({
        url: `/api/measurement/type/${typeId}/permanent?institutionId=${institutionId}`,
        method: 'DELETE',
        success: function(response) {
            if (response.success) {
                showMeasurementModalAlert('মাপ স্থায়ীভাবে ডিলিট হয়েছে', 'success');
                loadMeasurementGroups(currentMeasurementDressId, currentMeasurementClothForId);
            }
        },
        error: function(xhr) {
            const msg = xhr.responseJSON?.message || 'ডিলিট ব্যর্থ হয়েছে';
            showMeasurementModalAlert(msg, 'error');
        }
    });
};

// Measurement Modal Alert helper
function showMeasurementModalAlert(message, type) {
    const cls = type === 'success' ? 'alert-success' : 'alert-danger';
    const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
    const $alert = $(`
        <div class="alert ${cls} py-2 d-flex align-items-center gap-2" role="alert">
            <i class="fas fa-${icon}"></i> ${message}
        </div>
    `);
    const $area = $('#measurementModalAlert');
    $area.html($alert);
    setTimeout(() => $alert.fadeOut(400, function(){ $(this).remove(); }), 3000);
}

// Load & render unlinked measurement types panel
function loadUnlinkedTypes() {
    const institutionId = sessionStorage.getItem('institutionId');
    if (!currentMeasurementDressId) return;

    $.ajax({
        url: `/api/measurement/unlinked?dressId=${currentMeasurementDressId}&institutionId=${institutionId}`,
        method: 'GET',
        success: function(response) {
            renderUnlinkedPanel(response.success ? response.data : []);
        },
        error: function() {
            renderUnlinkedPanel([]);
        }
    });
}

function renderUnlinkedPanel(types) {
    let $panel = $('#unlinkedTypesPanel');
    if (!$panel.length) {
        // Insert before the groups list
        $('#measurementGroupsList').before('<div id="unlinkedTypesPanel"></div>');
        $panel = $('#unlinkedTypesPanel');
    }

    if (!types || types.length === 0) {
        $panel.empty();
        return;
    }

    // Build group options for the assign dropdown
    let groupOptions = '<option value="">-- গ্রুপ নির্বাচন করুন --</option>';
    $('#measurementGroupsList .meas-group-card[data-group-id]').each(function() {
        const gId = $(this).data('group-id');
        const gName = $(this).find('.group-name').text() || $(this).find('.group-name-display').text();
        groupOptions += `<option value="${gId}">${gName}</option>`;
    });

    let items = '';
    types.forEach(function(t) {
        const typeId = t.measurementTypeID || t.MeasurementTypeID;
        const typeName = (t.measurementType || t.MeasurementType || '').replace(/'/g, "\\'");
        const displayName = t.measurementType || t.MeasurementType || '';
        items += `
            <div class="unlinked-item" id="unlinked-${typeId}">
                <i class="fas fa-unlink text-warning"></i>
                <span class="item-name">${displayName}</span>
                <select class="form-select form-select-sm" id="assign-select-${typeId}">
                    ${groupOptions}
                </select>
                <button class="btn-assign"
                        onclick="assignTypeToGroup(${typeId})" title="গ্রুপে যুক্ত করুন">
                    <i class="fas fa-plus"></i> <span>যুক্ত</span>
                </button>
                <button class="btn-unlinked-delete"
                        onclick="permanentDeleteUnlinkedType(${typeId}, '${typeName}')" title="স্থায়ীভাবে ডিলিট">
                    <i class="fas fa-trash"></i>
                </button>
            </div>`;
    });

    $panel.html(`
        <div class="meas-unlinked-panel">
            <div class="panel-header">
                <i class="fas fa-unlink"></i>
                <span>গ্রুপ-বিহীন মাপজোখ</span>
                <span class="badge bg-warning text-dark">${types.length}</span>
            </div>
            <p class="panel-hint">গ্রুপে যুক্ত করুন অথবা স্থায়ীভাবে ডিলিট করুন</p>
            <div class="panel-body">${items}</div>
        </div>`);
}

// Assign an existing measurement type to a group
window.assignTypeToGroup = function(typeId, groupIdOptional) {
    const groupId = groupIdOptional || parseInt($(`#assign-select-${typeId}`).val(), 10);
    if (!groupId) {
        showMeasurementModalAlert('একটি গ্রুপ নির্বাচন করুন', 'error');
        return;
    }
    const institutionId = sessionStorage.getItem('institutionId');

    $.ajax({
        url: `/api/measurement/type/${typeId}/assign-group`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({ groupId: groupId, institutionId: parseInt(institutionId) }),
        success: function(response) {
            if (response.success) {
                showMeasurementModalAlert('মাপ গ্রুপে যুক্ত হয়েছে', 'success');
                loadMeasurementGroups(currentMeasurementDressId, currentMeasurementClothForId);
                $(`#add-type-form-${groupId}`).slideUp(150);
            } else {
                showMeasurementModalAlert(response.message || 'সমস্যা হয়েছে', 'error');
            }
        },
        error: function(xhr) {
            const msg = xhr.responseJSON?.message || 'সমস্যা হয়েছে';
            showMeasurementModalAlert(msg, 'error');
        }
    });
};
