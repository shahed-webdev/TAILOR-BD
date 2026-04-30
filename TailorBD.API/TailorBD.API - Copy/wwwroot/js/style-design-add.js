// Style Design Add - TailorBD
(function() {
    'use strict';

    let currentDressId = null;
    let currentCategoryId = null;
    let currentCategoryName = '';
    let designsData = [];

    // Initialize when DOM is ready
    $(document).ready(function() {
        // Get parameters from URL
        const urlParams = new URLSearchParams(window.location.search);
        currentDressId = urlParams.get('dressid');
        currentCategoryId = urlParams.get('categoryid');

        console.log('Style Design Add - Initializing:', {
            dressId: currentDressId,
            categoryId: currentCategoryId
        });

        if (!currentDressId || !currentCategoryId) {
            showAlert('error', 'প্রয়োজনীয় তথ্য পাওয়া যায়নি।');
            setTimeout(() => {
                window.location.href = '/dress-add.html';
            }, 2000);
            return;
        }

        // Set back button URL
        $('#backButton').attr('href', `/dress-style-add.html?dressid=${currentDressId}`);

        // Load category info and designs
        loadCategoryInfo();
        loadDesigns();

        // Form submit handler
        $('#addDesignForm').on('submit', function(e) {
            e.preventDefault();
            addDesign();
        });

        // Update serials button handler
        $('#updateSerialsBtn').on('click', updateSerials);
    });

    // Load category information
    function loadCategoryInfo() {
        const institutionId = sessionStorage.getItem('institutionId');
        
        console.log('Loading category info:', currentCategoryId);
        
        $.ajax({
            url: `/api/dress/style-category/${currentCategoryId}?institutionId=${institutionId}`,
            method: 'GET',
            success: function(response) {
                console.log('Category info response:', response);
                
                if (response.success && response.data) {
                    const category = response.data;
                    currentCategoryName = category.Dress_Style_Category_Name || category.dress_Style_Category_Name;
                    $('#categoryName').text(currentCategoryName);
                } else {
                    $('#categoryName').text('ক্যাটাগরি');
                }
            },
            error: function(xhr) {
                console.error('Error loading category info:', xhr);
                $('#categoryName').text('ক্যাটাগরি');
            }
        });
    }

    // Load designs
    function loadDesigns() {
        const institutionId = sessionStorage.getItem('institutionId');
        
        console.log('Loading designs for category:', currentCategoryId);
        
        $.ajax({
            url: `/api/dress/style-designs/${currentCategoryId}?institutionId=${institutionId}`,
            method: 'GET',
            success: function(response) {
                console.log('Designs response:', response);
                
                if (response.success && response.data) {
                    designsData = response.data;
                    displayDesigns(response.data);
                } else {
                    $('#designsTableBody').html(`
                        <tr>
                            <td colspan="5" class="text-center py-4 text-muted">
                                <i class="fas fa-inbox fa-3x mb-3 d-block"></i>
                                <span class="lang-content" data-en="No designs found" data-bn="কোন ডিজাইন পাওয়া যায়নি">কোন ডিজাইন পাওয়া যাচ্ছে</span>
                            </td>
                        </tr>
                    `);
                }
            },
            error: function(xhr) {
                console.error('Error loading designs:', xhr);
                console.error('Response:', xhr.responseText);
                
                $('#designsTableBody').html(`
                    <tr>
                        <td colspan="5" class="text-center py-4 text-danger">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            <span class="lang-content" data-en="Error loading designs" data-bn="ডিজাইন লোড করতে সমস্যা হয়েছে">ডিজাইন লোড করতে সমস্যা হয়েছে</span>
                        </td>
                    </tr>
                `);
            }
        });
    }

    // Display designs in table
    function displayDesigns(designs) {
        if (!designs || designs.length === 0) {
            $('#designsTableBody').html(`
                <tr>
                    <td colspan="5" class="text-center py-4 text-muted">
                        <i class="fas fa-inbox fa-2x mb-2 d-block opacity-50"></i>
                        এখনো কোনো ডিজাইন যুক্ত করা হয়নি
                    </td>
                </tr>
            `);
            $('#updateSerialsBtn').hide();
            return;
        }

        let html = '';
        designs.forEach(design => {
            const designId   = design.Dress_StyleID || design.dress_StyleID;
            const designName = design.Dress_Style_Name || design.dress_Style_Name;
            const serial     = design.StyleSerial || design.styleSerial || '';
            const hasImage   = design.Dress_Style_Image && design.Dress_Style_Image.length > 0;

            const imgHtml = hasImage
                ? `<img src="/api/dress/style-design/${designId}/image"
                        alt="${escapeHtml(designName)}"
                        class="design-thumb"
                        onerror="this.style.display='none'">`
                : `<div class="design-thumb-placeholder"><i class="fas fa-image"></i></div>`;

            html += `
                <tr data-design-id="${designId}">
                    <td>
                        <button class="btn btn-outline-primary btn-action"
                                onclick="editDesign(${designId}, '${escapeHtml(designName)}')"
                                title="এডিট">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                    <td class="fw-medium">${escapeHtml(designName)}</td>
                    <td>${imgHtml}</td>
                    <td>
                        <input type="number" class="form-control serial-input"
                               value="${serial}"
                               data-design-id="${designId}"
                               min="1" placeholder="—">
                    </td>
                    <td>
                        <button class="btn btn-outline-danger btn-action"
                                onclick="deleteDesign(${designId}, '${escapeHtml(designName)}')"
                                title="ডিলিট">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        $('#designsTableBody').html(html);
        $('#updateSerialsBtn').show();

        if (window.updateLanguage) window.updateLanguage();
    }

    // Add new design
    function addDesign() {
        const designName = $('#designName').val().trim();
        const designSerial = $('#designSerial').val();
        const imageFile = $('#designImage')[0].files[0];

        if (!designName) {
            showAlert('warning', 'ডিজাইনের নাম দিন।');
            return;
        }

        const institutionId = sessionStorage.getItem('institutionId');
        const registrationId = sessionStorage.getItem('registrationId');

        const data = {
            dressStyleCategoryID: parseInt(currentCategoryId),
            registrationID: parseInt(registrationId),
            institutionID: parseInt(institutionId),
            dressID: parseInt(currentDressId),
            dressStyleName: designName,
            styleSerial: designSerial ? parseInt(designSerial) : null
        };

        console.log('Adding design:', data);

        // Show loading
        const $btn = $('#addDesignForm button[type="submit"]');
        const originalHtml = $btn.html();
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span>যুক্ত হচ্ছে...');

        $.ajax({
            url: '/api/dress/style-design',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(response) {
                console.log('Add design response:', response);
                
                if (response.success) {
                    const designId = response.data.designId;

                    // Upload image if selected
                    if (imageFile) {
                        uploadDesignImage(designId, imageFile, function() {
                            showAlert('success', 'ডিজাইন সফলভাবে যুক্ত হয়েছে।');
                            $('#addDesignForm')[0].reset();
                            loadDesigns();
                            $btn.prop('disabled', false).html(originalHtml);
                        });
                    } else {
                        showAlert('success', 'ডিজাইন সফলভাবে যুক্ত হয়েছে।');
                        $('#addDesignForm')[0].reset();
                        loadDesigns();
                        $btn.prop('disabled', false).html(originalHtml);
                    }
                } else {
                    showAlert('error', response.message || 'ডিজাইন যুক্ত করতে সমস্যা হয়েছে।');
                    $btn.prop('disabled', false).html(originalHtml);
                }
            },
            error: function(xhr) {
                console.error('Error adding design:', xhr);
                console.error('Response:', xhr.responseText);
                showAlert('error', 'ডিজাইন যুক্ত করতে সমস্যা হয়েছে।');
                $btn.prop('disabled', false).html(originalHtml);
            }
        });
    }

    // Upload design image
    function uploadDesignImage(designId, file, callback) {
        const formData = new FormData();
        formData.append('image', file);

        $.ajax({
            url: `/api/dress/style-design/${designId}/image`,
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                console.log('Image upload response:', response);
                if (callback) callback();
            },
            error: function(xhr) {
                console.error('Image upload failed:', xhr);
                if (callback) callback();
            }
        });
    }

    // Edit design
    window.editDesign = function(designId, designName) {
        const design = designsData.find(d => (d.Dress_StyleID || d.dress_StyleID) === designId);
        if (!design) return;

        $('#editDesignId').val(designId);
        $('#editDesignName').val(designName);

        // Show current image
        const hasImage = design.Dress_Style_Image && design.Dress_Style_Image.length > 0;
        if (hasImage) {
            $('#editDesignImagePreview').attr('src', `/api/dress/style-design/${designId}/image`).show();
        } else {
            $('#editDesignImagePreview').hide();
        }

        const modal = new bootstrap.Modal(document.getElementById('editDesignModal'));
        modal.show();
    };

    // Update design
    window.updateDesign = function() {
        const designId = $('#editDesignId').val();
        const designName = $('#editDesignName').val().trim();
        const imageFile = $('#editDesignImage')[0].files[0];

        if (!designName) {
            showAlert('warning', 'ডিজাইনের নাম দিন।');
            return;
        }

        const institutionId = sessionStorage.getItem('institutionId');

        const data = {
            dressStyleName: designName,
            institutionID: parseInt(institutionId)
        };

        console.log('Updating design:', designId, data);

        // Show loading
        const $btn = $('#editDesignModal button[onclick="updateDesign()"]');
        const originalHtml = $btn.html();
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span>আপডেট হচ্ছে...');

        $.ajax({
            url: `/api/dress/style-design/${designId}`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(response) {
                console.log('Update design response:', response);
                
                if (response.success) {
                    // Upload new image if selected
                    if (imageFile) {
                        uploadDesignImage(designId, imageFile, function() {
                            showAlert('success', 'ডিজাইন সফলভাবে আপডেট হয়েছে।');
                            bootstrap.Modal.getInstance(document.getElementById('editDesignModal')).hide();
                            loadDesigns();
                            $btn.prop('disabled', false).html(originalHtml);
                        });
                    } else {
                        showAlert('success', 'ডিজাইন সফলভাবে আপডেট হয়েছে।');
                        bootstrap.Modal.getInstance(document.getElementById('editDesignModal')).hide();
                        loadDesigns();
                        $btn.prop('disabled', false).html(originalHtml);
                    }
                } else {
                    showAlert('error', response.message || 'ডিজাইন আপডেট করতে সমস্যা হয়েছে।');
                    $btn.prop('disabled', false).html(originalHtml);
                }
            },
            error: function(xhr) {
                console.error('Error updating design:', xhr);
                console.error('Response:', xhr.responseText);
                showAlert('error', 'ডিজাইন আপডেট করতে সমস্যা হয়েছে।');
                $btn.prop('disabled', false).html(originalHtml);
            }
        });
    };

    // Delete design
    window.deleteDesign = function(designId, designName) {
        const confirmMsg = window.currentLang === 'en' 
            ? `Are you sure you want to delete "${designName}"?`
            : `আপনি কি নিশ্চিত "${designName}" ডিলিট করতে চান?`;

        if (!confirm(confirmMsg)) {
            return;
        }

        const institutionId = sessionStorage.getItem('institutionId');

        console.log('Deleting design:', designId);

        $.ajax({
            url: `/api/dress/style-design/${designId}?institutionId=${institutionId}`,
            method: 'DELETE',
            success: function(response) {
                console.log('Delete design response:', response);
                
                if (response.success) {
                    showAlert('success', 'ডিজাইন সফলভাবে ডিলিট হয়েছে।');
                    loadDesigns();
                } else {
                    showAlert('error', response.message || 'ডিজাইন ডিলিট করতে সমস্যা হয়েছে।');
                }
            },
            error: function(xhr) {
                console.error('Error deleting design:', xhr);
                console.error('Response:', xhr.responseText);
                
                const response = xhr.responseJSON;
                if (response && response.message) {
                    showAlert('error', response.message);
                } else {
                    showAlert('error', 'ডিজাইন ডিলিট করতে সমস্যা হয়েছে।');
                }
            }
        });
    };

    // Update serials
    function updateSerials() {
        const updates = [];
        $('.serial-input').each(function() {
            const designId = $(this).data('design-id');
            const serial = $(this).val();
            updates.push({
                designId: designId,
                serial: serial ? parseInt(serial) : null
            });
        });

        if (updates.length === 0) {
            return;
        }

        const institutionId = sessionStorage.getItem('institutionId');

        const data = {
            institutionId: parseInt(institutionId),
            updates: updates
        };

        console.log('Updating serials:', data);

        $.ajax({
            url: '/api/dress/style-design/update-serials',
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(response) {
                console.log('Update serials response:', response);
                
                if (response.success) {
                    showAlert('success', 'সিরিয়াল সফলভাবে আপডেট হয়েছে।');
                    loadDesigns();
                } else {
                    showAlert('error', response.message || 'সিরিয়াল আপডেট করতে সমস্যা হয়েছে।');
                }
            },
            error: function(xhr) {
                console.error('Error updating serials:', xhr);
                console.error('Response:', xhr.responseText);
                showAlert('error', 'সিরিয়াল আপডেট করতে সমস্যা হয়েছে।');
            }
        });
    }

    // Show alert message
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
        
        setTimeout(() => {
            alert.fadeOut(500, function() {
                $(this).remove();
            });
        }, 5000);
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

})();
