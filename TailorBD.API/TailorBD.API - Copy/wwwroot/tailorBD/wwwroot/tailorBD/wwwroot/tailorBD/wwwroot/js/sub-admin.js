// Sub Admin Management - TailorBD
(function() {
    'use strict';

    let subAdminsData = [];

    // Initialize when DOM is ready
    $(document).ready(function() {
        loadSubAdmins();

        // Form submit handler
        $('#addSubAdminForm').on('submit', function(e) {
            e.preventDefault();
        });

        // Search functionality
        $('#searchInput').on('keyup', function() {
            const searchTerm = $(this).val().toLowerCase();
            filterTable(searchTerm);
        });
    });

    // Load sub admins
    function loadSubAdmins() {
        const institutionId  = sessionStorage.getItem('institutionId');
        const registrationId = sessionStorage.getItem('registrationId');

        console.log('Loading sub admins for institution:', institutionId);

        $.ajax({
            url: `/api/subadmin/${institutionId}?registrationId=${registrationId || 0}`,
            method: 'GET',
            success: function(response) {
                console.log('Sub admins response:', response);

                if (response.success && response.data && response.data.length) {
                    subAdminsData = response.data;
                    displaySubAdmins(response.data);
                } else {
                    subAdminsData = [];
                    $('#subAdminsTableBody').html(`
                        <tr>
                            <td colspan="8" class="text-center py-4 text-muted">
                                <i class="fas fa-inbox fa-3x mb-3 d-block"></i>
                                <span class="lang-content" data-en="No sub admins added yet" data-bn="এখনো কোন সাব-অ্যাডমিন যুক্ত করা হয়নি">এখনো কোন সাব-অ্যাডমিন যুক্ত করা হয়নি</span>
                            </td>
                        </tr>
                    `);
                }
            },
            error: function(xhr) {
                console.error('Error loading sub admins:', xhr);
                console.error('Response:', xhr.responseText);
                $('#subAdminsTableBody').html(`
                    <tr>
                        <td colspan="8" class="text-center py-4 text-danger">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            সাব-অ্যাডমিন লোড করতে সমস্যা হয়েছে
                        </td>
                    </tr>
                `);
            }
        });
    }

    // Display sub admins in table
    function displaySubAdmins(subAdmins) {
        console.log('Displaying sub admins:', subAdmins);
        
        if (!subAdmins || subAdmins.length === 0) {
            $('#subAdminsTableBody').html(`
                <tr>
                    <td colspan="8" class="text-center py-4 text-muted">
                        <i class="fas fa-inbox fa-3x mb-3 d-block"></i>
                        <span class="lang-content" data-en="No sub admins added yet" data-bn="এখনো কোন সাব-অ্যাডমিন যুক্ত করা হয়নি">এখনো কোন সাব-অ্যাডমিন যুক্ত করা হয়নি</span>
                    </td>
                </tr>
            `);
            return;
        }

        let html = '';
        subAdmins.forEach(admin => {
            const registrationId = admin.RegistrationID || admin.registrationID;
            const name = admin.Name || admin.name || 'N/A';
            const designation = admin.Designation || admin.designation || 'N/A';
            const username = admin.UserName || admin.userName;
            const email = admin.Email || admin.email || 'N/A';
            const validation = admin.Validation || admin.validation;
            const isLocked = admin.IsLocked || admin.isLocked || false;
            
            const validationBadge = validation === 'Valid' 
                ? '<span class="badge bg-success"><i class="fas fa-check me-1"></i>Approved</span>' 
                : '<span class="badge bg-warning"><i class="fas fa-clock me-1"></i>Pending</span>';
            
            const lockStatus = isLocked 
                ? '<span class="badge bg-danger"><i class="fas fa-lock me-1"></i>Locked</span>' 
                : '<span class="badge bg-success"><i class="fas fa-lock-open me-1"></i>Active</span>';
            
            html += `
                <tr data-registration-id="${registrationId}">
                    <td>${escapeHtml(name)}</td>
                    <td>${escapeHtml(designation)}</td>
                    <td><strong>${escapeHtml(username)}</strong></td>
                    <td>${escapeHtml(email)}</td>
                    <td>${lockStatus}</td>
                    <td>
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" 
                                   ${isLocked ? '' : 'checked'} 
                                   onchange="toggleLock(${registrationId}, this.checked)"
                                   title="${isLocked ? 'Unlock' : 'Lock'}">
                        </div>
                    </td>
                    <td>
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" 
                                   ${validation === 'Valid' ? 'checked' : ''} 
                                   onchange="toggleApproval(${registrationId}, this.checked)"
                                   title="${validation === 'Valid' ? 'Unapprove' : 'Approve'}">
                        </div>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-sm btn-outline-primary" onclick="viewSubAdmin(${registrationId})" title="View">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-info" onclick="editPermissions(${registrationId})" title="Edit Permissions">
                                <i class="fas fa-user-shield"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteSubAdmin(${registrationId}, '${escapeHtml(name)}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        $('#subAdminsTableBody').html(html);
        
        // Update language after adding content
        if (window.updateLanguage) {
            window.updateLanguage();
        }
    }

    // Create sub admin
    window.createSubAdmin = function() {
        // Validate form
        const form = document.getElementById('addSubAdminForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Get form data
        const name = $('#subAdminName').val().trim();
        const designation = $('#subAdminDesignation').val().trim();
        const username = $('#subAdminUsername').val().trim();
        const email = $('#subAdminEmail').val().trim();
        const password = $('#subAdminPassword').val();
        const confirmPassword = $('#subAdminConfirmPassword').val();
        const securityQuestion = $('#securityQuestion').val();
        const securityAnswer = $('#securityAnswer').val().trim();

        // Validate passwords match
        if (password !== confirmPassword) {
            showAlert('error', 'পাসওয়ার্ড মিলছে না।');
            return;
        }

        const institutionId = sessionStorage.getItem('institutionId');
        const registrationId = sessionStorage.getItem('registrationId');

        const data = {
            institutionID: parseInt(institutionId),
            createdByRegistrationID: parseInt(registrationId),
            name: name,
            designation: designation,
            userName: username,
            email: email,
            password: password,
            securityQuestion: securityQuestion,
            securityAnswer: securityAnswer
        };

        console.log('Creating sub admin:', data);

        // Show loading
        const $btn = $('#addSubAdminModal button[onclick="createSubAdmin()"]');
        const originalHtml = $btn.html();
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span>তৈরি হচ্ছে...');

        $.ajax({
            url: '/api/subadmin',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(response) {
                console.log('Create sub admin response:', response);
                
                if (response.success) {
                    showAlert('success', 'সাব-অ্যাডমিন সফলভাবে তৈরি হয়েছে।');
                    $('#addSubAdminForm')[0].reset();
                    bootstrap.Modal.getInstance(document.getElementById('addSubAdminModal')).hide();
                    loadSubAdmins();
                } else {
                    showAlert('error', response.message || 'সাব-অ্যাডমিন তৈরি করতে সমস্যা হয়েছে।');
                }
            },
            error: function(xhr) {
                console.error('Error creating sub admin:', xhr);
                console.error('Response:', xhr.responseText);
                
                const response = xhr.responseJSON;
                if (response && response.message) {
                    showAlert('error', response.message);
                } else {
                    showAlert('error', 'সাব-অ্যাডমিন তৈরি করতে সমস্যা হয়েছে।');
                }
            },
            complete: function() {
                $btn.prop('disabled', false).html(originalHtml);
            }
        });
    };

    // Toggle lock status
    window.toggleLock = function(registrationId, isUnlocked) {
        const institutionId = sessionStorage.getItem('institutionId');
        const isLocked = !isUnlocked;

        console.log('Toggle lock:', registrationId, 'isLocked:', isLocked);

        $.ajax({
            url: `/api/subadmin/${registrationId}/lock`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({
                institutionID: parseInt(institutionId),
                isLocked: isLocked
            }),
            success: function(response) {
                if (response.success) {
                    showAlert('success', isLocked ? 'সাব-অ্যাডমিন লক করা হয়েছে।' : 'সাব-অ্যাডমিন আনলক করা হয়েছে।');
                    loadSubAdmins();
                } else {
                    showAlert('error', response.message || 'স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে।');
                    loadSubAdmins(); // Reload to reset the switch
                }
            },
            error: function(xhr) {
                console.error('Error toggling lock:', xhr);
                showAlert('error', 'স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে।');
                loadSubAdmins(); // Reload to reset the switch
            }
        });
    };

    // Toggle approval status
    window.toggleApproval = function(registrationId, isApproved) {
        const institutionId = sessionStorage.getItem('institutionId');
        const validation = isApproved ? 'Valid' : 'Invalid';

        console.log('Toggle approval:', registrationId, 'validation:', validation);

        $.ajax({
            url: `/api/subadmin/${registrationId}/approval`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({
                institutionID: parseInt(institutionId),
                validation: validation
            }),
            success: function(response) {
                if (response.success) {
                    showAlert('success', isApproved ? 'সাব-অ্যাডমিন এপ্রুভ করা হয়েছে।' : 'সাব-অ্যাডমিন আনএপ্রুভ করা হয়েছে।');
                    loadSubAdmins();
                } else {
                    showAlert('error', response.message || 'স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে।');
                    loadSubAdmins(); // Reload to reset the switch
                }
            },
            error: function(xhr) {
                console.error('Error toggling approval:', xhr);
                showAlert('error', 'স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে।');
                loadSubAdmins(); // Reload to reset the switch
            }
        });
    };

    // View sub admin details
    window.viewSubAdmin = function(registrationId) {
        const admin = subAdminsData.find(a => (a.RegistrationID || a.registrationID) === registrationId);
        if (!admin) return;

        const name = admin.Name || admin.name || 'N/A';
        const designation = admin.Designation || admin.designation || 'N/A';
        const username = admin.UserName || admin.userName;
        const email = admin.Email || admin.email || 'N/A';
        const createDate = admin.CreateDate || admin.createDate;

        alert(`Name: ${name}\nDesignation: ${designation}\nUsername: ${username}\nEmail: ${email}\nCreated: ${createDate || 'N/A'}`);
    };

    // Edit permissions
    window.editPermissions = function(registrationId) {
        // TODO: Implement permissions management
        showAlert('info', 'Permissions management coming soon!');
    };

    // Delete sub admin
    window.deleteSubAdmin = function(registrationId, name) {
        const confirmMsg = window.currentLang === 'en' 
            ? `Are you sure you want to delete sub admin "${name}"?`
            : `আপনি কি নিশ্চিত "${name}" সাব-অ্যাডমিন ডিলিট করতে চান?`;

        if (!confirm(confirmMsg)) {
            return;
        }

        const institutionId = sessionStorage.getItem('institutionId');

        console.log('Deleting sub admin:', registrationId);

        $.ajax({
            url: `/api/subadmin/${registrationId}?institutionId=${institutionId}`,
            method: 'DELETE',
            success: function(response) {
                console.log('Delete sub admin response:', response);
                
                if (response.success) {
                    showAlert('success', 'সাব-অ্যাডমিন সফলভাবে ডিলিট হয়েছে।');
                    loadSubAdmins();
                } else {
                    showAlert('error', response.message || 'সাব-অ্যাডমিন ডিলিট করতে সমস্যা হয়েছে।');
                }
            },
            error: function(xhr) {
                console.error('Error deleting sub admin:', xhr);
                console.error('Response:', xhr.responseText);
                
                const response = xhr.responseJSON;
                if (response && response.message) {
                    showAlert('error', response.message);
                } else {
                    showAlert('error', 'সাব-অ্যাডমিন डিলিট করতে সমস্যা হয়েছে।');
                }
            }
        });
    };

    // Filter table
    function filterTable(searchTerm) {
        if (!searchTerm) {
            displaySubAdmins(subAdminsData);
            return;
        }

        const filtered = subAdminsData.filter(admin => {
            const name = (admin.Name || admin.name || '').toLowerCase();
            const designation = (admin.Designation || admin.designation || '').toLowerCase();
            const username = (admin.UserName || admin.userName || '').toLowerCase();
            const email = (admin.Email || admin.email || '').toLowerCase();

            return name.includes(searchTerm) || 
                   designation.includes(searchTerm) || 
                   username.includes(searchTerm) || 
                   email.includes(searchTerm);
        });

        displaySubAdmins(filtered);
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
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.toString().replace(/[&<>"']/g, m => map[m]);
    }

})();
