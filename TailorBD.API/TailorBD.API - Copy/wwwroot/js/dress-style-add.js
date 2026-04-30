// Dress Style Category Add - TailorBD
(function() {
    'use strict';

    let currentDressId = null;

    // Initialize when DOM is ready
    $(document).ready(function() {
        // Get dress ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        currentDressId = urlParams.get('dressid');

        console.log('Dress Style Add - Initializing with dressId:', currentDressId);

        if (!currentDressId) {
            showAlert('error', 'পোষাক আইডি পাওয়া যায়নি। পোষাক তালিকায় ফিরে যান।');
            setTimeout(() => {
                window.location.href = '/dress-add.html';
            }, 2000);
            return;
        }

        // Load dress info and categories
        loadDressInfo();
        loadCategories();

        // Form submit handler
        $('#addCategoryForm').on('submit', function(e) {
            e.preventDefault();
            addCategory();
        });

        // Update serials button handler
        $('#updateSerialsBtn').on('click', updateSerials);
    });

    // Load dress information
    function loadDressInfo() {
        $.ajax({
            url: `/api/dress/single/${currentDressId}`,
            method: 'GET',
            success: function(response) {
                if (response.success && response.data) {
                    const dress = response.data;
                    const name = dress.Dress_Name || dress.dress_Name || 'পোষাক';
                    $('#dressNameHeader').text(`"${name}" এর স্টাইল ক্যাটাগরি`);
                    
                    // Check if image exists
                    if (dress.Image && dress.Image.length > 0) {
                        $('#dressImage').attr('src', `/api/dress/${currentDressId}/image`).on('error', function() {
                            $(this).attr('src', '/images/default-dress.png');
                        });
                    } else {
                        $('#dressImage').attr('src', '/images/default-dress.png');
                    }
                    
                    $('#dressInfoCard').show();
                } else {
                    console.error('No dress data found');
                    showAlert('error', 'পোষাক তথ্য পাওয়া যায়নি।');
                }
            },
            error: function(xhr) {
                console.error('Error loading dress info:', xhr);
                console.error('Response:', xhr.responseText);
                showAlert('error', 'পোষাক তথ্য লোড করতে সমস্যা হয়েছে।');
            }
        });
    }

    // Load style categories
    function loadCategories() {
        const institutionId = sessionStorage.getItem('institutionId');
        
        console.log('Loading categories for dress:', currentDressId, 'institution:', institutionId);
        
        $.ajax({
            url: `/api/dress/${currentDressId}/style-categories?institutionId=${institutionId}`,
            method: 'GET',
            success: function(response) {
                console.log('Categories response:', response);
                
                if (response.success && response.data) {
                    displayCategories(response.data);
                } else {
                    console.log('No categories found or invalid response');
                    $('#categoriesTableBody').html(`
                        <tr>
                            <td colspan="5" class="text-center py-4 text-muted">
                                <i class="fas fa-inbox fa-3x mb-3 d-block"></i>
                                <span class="lang-content" data-en="No categories found" data-bn="কোন ক্যাটাগরি পাওয়া যায়নি">কোন ক্যাটাগরি পাওয়া যায়নি</span>
                            </td>
                        </tr>
                    `);
                }
            },
            error: function(xhr) {
                console.error('Error loading categories:', xhr);
                console.error('Status:', xhr.status);
                console.error('Response:', xhr.responseText);
                
                $('#categoriesTableBody').html(`
                    <tr>
                        <td colspan="5" class="text-center py-4 text-danger">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            <span class="lang-content" data-en="Error loading categories" data-bn="ক্যাটাগরি লোড করতে সমস্যা হয়েছে">ক্যাটাগরি লোড করতে সমস্যা হয়েছে</span>
                            <br>
                            <small>${xhr.status}: ${xhr.statusText}</small>
                        </td>
                    </tr>
                `);
            }
        });
    }

    // Display categories in table
    function displayCategories(categories) {
        if (!categories || categories.length === 0) {
            $('#categoriesTableBody').html(`
                <tr>
                    <td colspan="5" class="text-center py-4 text-muted">
                        <i class="fas fa-inbox fa-2x mb-2 d-block opacity-50"></i>
                        এখনো কোনো ক্যাটাগরি যুক্ত করা হয়নি
                    </td>
                </tr>
            `);
            $('#updateSerialsBtn').hide();
            return;
        }

        let html = '';
        categories.forEach(category => {
            const categoryId   = category.Dress_Style_CategoryID || category.dress_Style_CategoryID;
            const categoryName = category.Dress_Style_Category_Name || category.dress_Style_Category_Name;
            const serial       = category.CategorySerial || category.categorySerial || '';

            html += `
                <tr data-category-id="${categoryId}">
                    <td>
                        <button class="btn btn-outline-primary btn-action"
                                onclick="editCategory(${categoryId}, '${escapeHtml(categoryName)}')"
                                title="এডিট">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                    <td class="fw-medium">${escapeHtml(categoryName)}</td>
                    <td>
                        <a href="/style-design-add.html?dressid=${currentDressId}&categoryid=${categoryId}"
                           class="btn-add-design">
                            <i class="fas fa-plus-circle me-1"></i>ডিজাইন যুক্ত করুন
                        </a>
                    </td>
                    <td>
                        <input type="number" class="form-control serial-input"
                               value="${serial}"
                               data-category-id="${categoryId}"
                               min="1" placeholder="—">
                    </td>
                    <td>
                        <button class="btn btn-outline-danger btn-action"
                                onclick="deleteCategory(${categoryId}, '${escapeHtml(categoryName)}')"
                                title="ডিলিট">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        $('#categoriesTableBody').html(html);
        $('#updateSerialsBtn').show();

        if (window.updateLanguage) window.updateLanguage();
    }

    // Add new category
    function addCategory() {
        const categoryName = $('#categoryName').val().trim();
        const categorySerial = $('#categorySerial').val();

        if (!categoryName) {
            showAlert('warning', 'ক্যাটাগরির নাম দিন।');
            return;
        }

        const institutionId = sessionStorage.getItem('institutionId');
        const registrationId = sessionStorage.getItem('registrationId');

        const data = {
            dressID: parseInt(currentDressId),
            dressStyleCategoryName: categoryName,
            categorySerial: categorySerial ? parseInt(categorySerial) : null,
            institutionID: parseInt(institutionId),
            registrationID: parseInt(registrationId)
        };

        console.log('Adding category:', data);

        $.ajax({
            url: '/api/dress/style-category',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(response) {
                console.log('Add category response:', response);
                
                if (response.success) {
                    showAlert('success', 'ক্যাটাগরি সফলভাবে যুক্ত হয়েছে।');
                    $('#addCategoryForm')[0].reset();
                    loadCategories();
                } else {
                    showAlert('error', response.message || 'ক্যাটাগরি যুক্ত করতে সমস্যা হয়েছে।');
                }
            },
            error: function(xhr) {
                console.error('Error adding category:', xhr);
                console.error('Response:', xhr.responseText);
                showAlert('error', 'ক্যাটাগরি যুক্ত করতে সমস্যা হয়েছে।');
            }
        });
    }

    // Edit category
    window.editCategory = function(categoryId, categoryName) {
        $('#editCategoryId').val(categoryId);
        $('#editCategoryName').val(categoryName);
        
        const modal = new bootstrap.Modal(document.getElementById('editCategoryModal'));
        modal.show();
    };

    // Update category
    window.updateCategory = function() {
        const categoryId = $('#editCategoryId').val();
        const categoryName = $('#editCategoryName').val().trim();

        if (!categoryName) {
            showAlert('warning', 'ক্যাটাগরির নাম দিন।');
            return;
        }

        const institutionId = sessionStorage.getItem('institutionId');

        const data = {
            dressStyleCategoryName: categoryName,
            institutionID: parseInt(institutionId)
        };

        console.log('Updating category:', categoryId, data);

        $.ajax({
            url: `/api/dress/style-category/${categoryId}`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(response) {
                console.log('Update category response:', response);
                
                if (response.success) {
                    showAlert('success', 'ক্যাটাগরি সফলভাবে আপডেট হয়েছে।');
                    bootstrap.Modal.getInstance(document.getElementById('editCategoryModal')).hide();
                    loadCategories();
                } else {
                    showAlert('error', response.message || 'ক্যাটাগরি আপডেট করতে সমস্যা হয়েছে।');
                }
            },
            error: function(xhr) {
                console.error('Error updating category:', xhr);
                console.error('Response:', xhr.responseText);
                showAlert('error', 'ক্যাটাগরি আপডেট করতে সমস্যা হয়েছে।');
            }
        });
    };

    // Delete category
    window.deleteCategory = function(categoryId, categoryName) {
        const confirmMsg = window.currentLang === 'en' 
            ? `Are you sure you want to delete "${categoryName}"?`
            : `আপনি কি নিশ্চিত "${categoryName}" ডিলিট করতে চান?`;

        if (!confirm(confirmMsg)) {
            return;
        }

        const institutionId = sessionStorage.getItem('institutionId');

        console.log('Deleting category:', categoryId);

        $.ajax({
            url: `/api/dress/style-category/${categoryId}?institutionId=${institutionId}`,
            method: 'DELETE',
            success: function(response) {
                console.log('Delete category response:', response);
                
                if (response.success) {
                    showAlert('success', 'ক্যাটাগরি সফলভাবে ডিলিট হয়েছে।');
                    loadCategories();
                } else {
                    showAlert('error', response.message || 'ক্যাটাগরি ডিলিট করতে সমস্যা হয়েছে।');
                }
            },
            error: function(xhr) {
                console.error('Error deleting category:', xhr);
                console.error('Response:', xhr.responseText);
                
                const response = xhr.responseJSON;
                if (response && response.message) {
                    showAlert('error', response.message);
                } else {
                    showAlert('error', 'ক্যাটাগরি ডিলিট করতে সমস্যা হয়েছে।');
                }
            }
        });
    };

    // Update serials
    function updateSerials() {
        const updates = [];
        $('.serial-input').each(function() {
            const categoryId = $(this).data('category-id');
            const serial = $(this).val();
            updates.push({
                categoryId: categoryId,
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
            url: '/api/dress/style-category/update-serials',
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(response) {
                console.log('Update serials response:', response);
                
                if (response.success) {
                    showAlert('success', 'সিরিয়াল সফলভাবে আপডেট হয়েছে।');
                    loadCategories();
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
