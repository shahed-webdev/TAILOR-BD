(function () {
    'use strict';

    let profile = {};
    let allShops = [];
    let filters = { payment: '', status: '' };
    let allPackages = [];

    // ── Init ──────────────────────────────────────────────────────────────────
    $(document).ready(function () {
        if (!TailorAuth.guard('Authority')) return;

        loadProfile();
        loadShops();

        // Delegated click for package button (safe: data-* avoids quote issues)
        $(document).on('click', '.pkg-btn', function () {
            const $btn = $(this);
            openPackageModal(
                parseInt($btn.data('id')),
                $btn.data('name'),
                parseInt($btn.data('pkg')) || 0,
                parseFloat($btn.data('renew')) || 0
            );
        });
    });

    // ── Profile (sidebar name/avatar only) ───────────────────────────────────
    function loadProfile() {
        const username = sessionStorage.getItem('username');
        if (!username) return;
        $.get('/api/profile/by-username/' + encodeURIComponent(username), function (res) {
            if (!res.success || !res.data) return;
            profile = res.data;
            const avatarUrl = (res.data.image && res.data.image.length > 0)
                ? '/api/profile/' + res.data.registrationID + '/image'
                : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(res.data.name || 'A') + '&background=6366f1&color=fff&size=100&bold=true';
            $('#sidebarAvatar').attr('src', avatarUrl);
            $('#sidebarName').text(res.data.name || 'Authority');
        });
    }

    // ── Shop List ─────────────────────────────────────────────────────────────
    window.loadShops = function () {
        $('#refreshIcon').addClass('fa-spin');
        $('#shopTableBody').html('<tr><td colspan="10" class="text-center py-4 text-muted"><div class="spinner-border spinner-border-sm me-2"></div>লোড হচ্ছে...</td></tr>');

        $.get('/api/institution/authority/list', function (res) {
            $('#refreshIcon').removeClass('fa-spin');
            if (!res.success) { toast('শপ লোড ব্যর্থ', 'error'); return; }
            allShops = res.data || [];
            try {
                applyFilters();
            } catch (e) {
                console.error('renderTable error:', e);
                toast('টেবিল রেন্ডার ত্রুটি: ' + e.message, 'error');
            }
        }).fail(function (xhr) {
            $('#refreshIcon').removeClass('fa-spin');
            toast('শপ লোড ব্যর্থ: ' + (xhr.status || 'সংযোগ ব্যর্থ'), 'error');
            $('#shopTableBody').html('<tr><td colspan="10" class="text-center text-danger py-3">লোড ব্যর্থ হয়েছে</td></tr>');
        });
    };

    window.setFilter = function (type, value, btn) {
        filters[type] = value;
        $(btn).closest('.btn-group').find('.filter-btn').removeClass('active');
        $(btn).addClass('active');
        applyFilters();
    };

    window.applyFilters = function () {
        const search  = ($('#searchInput').val() || '').toLowerCase().trim();
        const payment = filters.payment;
        const status  = filters.status;

        const filtered = allShops.filter(function (s) {
            const matchSearch = !search ||
                (s.institutionName || '').toLowerCase().includes(search) ||
                (s.phone || '').toLowerCase().includes(search) ||
                (s.userName || '').toLowerCase().includes(search);
            const matchPayment = !payment || s.latestInvoiceStatus === payment;
            const matchStatus  = !status  || s.validation === status;
            return matchSearch && matchPayment && matchStatus;
        });

        renderTable(filtered);
        updateSummary(filtered);
        $('#shopCount').text(filtered.length);
    };

    function renderTable(shops) {
        const $body = $('#shopTableBody').empty();

        if (!shops.length) {
            $body.html('<tr><td colspan="10" class="text-center py-4 text-muted"><i class="fas fa-store-slash me-2"></i>কোনো শপ পাওয়া যায়নি</td></tr>');
            return;
        }

        shops.forEach(function (s, i) {
            const isActive  = s.validation === 'Valid';
            const isPaid    = s.latestInvoiceStatus === 'Paid';
            const isExpired = s.expireDate && new Date(s.expireDate) < new Date();

            const statusBadge = isActive
                ? '<span class="badge" style="background:#dcfce7;color:#16a34a;font-size:.75rem;">Active</span>'
                : '<span class="badge" style="background:#fef3c7;color:#d97706;font-size:.75rem;">Deactive</span>';

            const payBadge = isPaid
                ? '<span class="badge" style="background:#dcfce7;color:#16a34a;font-size:.75rem;">Paid</span>'
                : '<span class="badge" style="background:#fee2e2;color:#dc2626;font-size:.75rem;">Due</span>';

            const expireText = s.expireDate
                ? '<span style="color:' + (isExpired ? '#dc2626' : '#475569') + ';white-space:nowrap;">' + fmtDate(s.expireDate) + (isExpired ? ' <i class="fas fa-exclamation-triangle" style="color:#dc2626;"></i>' : '') + '</span>'
                : '—';

            const dueText = s.totalDue > 0
                ? '<span style="color:#dc2626;font-weight:600;">৳' + fmt(s.totalDue) + '</span>'
                : '<span style="color:#16a34a;">৳0</span>';

            const toggleLabel = isActive ? 'Deactivate' : 'Activate';
            const toggleCls   = isActive ? 'btn-outline-warning' : 'btn-outline-success';

            $body.append(
                '<tr>' +
                '<td style="color:#94a3b8;">' + (i + 1) + '</td>' +
                '<td>' +
                    '<div style="font-weight:600;color:#1e293b;">' + esc(s.institutionName) + '</div>' +
                    '<div style="font-size:.75rem;color:#94a3b8;">' + esc(s.address || '') + '</div>' +
                '</td>' +
                '<td><code style="font-size:.8rem;">' + esc(s.userName) + '</code></td>' +
                '<td style="font-size:.82rem;">' + esc(s.phone) + '</td>' +
                '<td><span class="badge bg-light text-dark border" style="font-size:.75rem;">' + esc(s.packageName || '—') + '</span></td>' +
                '<td style="font-size:.8rem;">' + expireText + '</td>' +
                '<td>' + dueText + '</td>' +
                '<td>' + payBadge + '</td>' +
                '<td>' + statusBadge + '</td>' +
                '<td>' +
                    '<div class="d-flex gap-1">' +
                        '<a href="/authority-invoice.html?institutionId=' + s.institutionId + '"' +
                           ' class="btn btn-xs btn-outline-primary" style="padding:3px 8px;font-size:.75rem;" title="Invoice">' +
                            '<i class="fas fa-file-invoice"></i>' +
                        '</a>' +
                        '<button class="btn btn-xs btn-outline-info pkg-btn" style="padding:3px 8px;font-size:.75rem;"' +
                                ' data-id="' + s.institutionId + '"' +
                                ' data-name="' + esc(s.institutionName) + '"' +
                                ' data-pkg="' + (s.packageId || 0) + '"' +
                                ' data-renew="' + (s.renewAmount || 0) + '"' +
                                ' title="প্যাকেজ/বিল পরিবর্তন">' +
                            '<i class="fas fa-box-open"></i>' +
                        '</button>' +
                        '<button class="btn btn-xs ' + toggleCls + '" style="padding:3px 8px;font-size:.75rem;"' +
                                ' onclick="toggleStatus(' + s.institutionId + ', this)" title="' + toggleLabel + '">' +
                            '<i class="fas fa-toggle-' + (isActive ? 'on' : 'off') + '"></i>' +
                        '</button>' +
                    '</div>' +
                '</td>' +
                '</tr>'
            );
        });
    }

    function updateSummary(shops) {
        const active   = shops.filter(function (s) { return s.validation === 'Valid'; }).length;
        const deactive = shops.filter(function (s) { return s.validation !== 'Valid'; }).length;
        const paid     = shops.filter(function (s) { return s.latestInvoiceStatus === 'Paid'; }).length;
        const due      = shops.filter(function (s) { return s.latestInvoiceStatus !== 'Paid'; }).length;
        $('#summTotal').text(shops.length);
        $('#summActive').text(active);
        $('#summDeactive').text(deactive);
        $('#summPaid').text(paid);
        $('#summDue').text(due);
    }

    // ── Package Change ────────────────────────────────────────────────────────
    function loadPackagesIfNeeded() {
        if (allPackages.length > 0) return Promise.resolve();
        return $.getJSON('/api/institution/authority/packages').then(function (res) {
            allPackages = (res.success && res.data) ? res.data : [];
        }).catch(function () { allPackages = []; });
    }

    window.openPackageModal = function (institutionId, institutionName, currentPackageId, currentRenewAmount) {
        $('#pkgInstitutionId').val(institutionId);
        $('#pkgInstitutionName').text(institutionName);
        $('#pkgRenewAmount').val(currentRenewAmount || 0);
        loadPackagesIfNeeded().then(function () {
            const $sel = $('#pkgSelect').empty();
            if (allPackages.length === 0) {
                $sel.append('<option value="">কোনো প্যাকেজ পাওয়া যায়নি</option>');
            } else {
                allPackages.forEach(function (p) {
                    const selected = p.packageId === currentPackageId ? ' selected' : '';
                    $sel.append('<option value="' + p.packageId + '" data-interval="' + p.interval + '"' + selected + '>' + esc(p.packageName) + ' (' + p.interval + ' মাস)</option>');
                });
            }
            new bootstrap.Modal(document.getElementById('packageModal')).show();
        });
    };

    window.onPackageSelectChange = function () {
        const val = parseFloat($('#pkgRenewAmount').val());
        if (!val || val === 0) {
            $('#pkgRenewAmount').val('');
        }
    };

    window.submitPackageChange = function () {
        const institutionId = parseInt($('#pkgInstitutionId').val());
        const packageId     = parseInt($('#pkgSelect').val());
        const renewAmount   = parseFloat($('#pkgRenewAmount').val());
        if (!packageId) { toast('প্যাকেজ নির্বাচন করুন', 'error'); return; }
        if (!renewAmount || renewAmount <= 0) { toast('বিল অ্যামাউন্ট দিন', 'error'); $('#pkgRenewAmount').focus(); return; }
        const $btn = $('#packageModal .btn-info').prop('disabled', true);
        $.ajax({
            url: '/api/institution/authority/' + institutionId + '/change-package',
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ packageId: packageId, renewAmount: renewAmount }),
            success: function (res) {
                $btn.prop('disabled', false);
                if (res.success) {
                    bootstrap.Modal.getInstance(document.getElementById('packageModal')).hide();
                    const shop = allShops.find(function (s) { return s.institutionId === institutionId; });
                    if (shop) {
                        shop.packageName = res.packageName;
                        shop.packageId   = packageId;
                        shop.renewAmount = renewAmount;
                        if (res.newExpireDate) shop.expireDate = res.newExpireDate;
                    }
                    applyFilters();
                    toast(res.message || 'প্যাকেজ পরিবর্তন সফল', 'success');
                } else {
                    toast(res.message || 'ব্যর্থ হয়েছে', 'error');
                }
            },
            error: function () { $btn.prop('disabled', false); toast('সার্ভার ত্রুটি', 'error'); }
        });
    };

    window.toggleStatus = function (institutionId, btn) {
        $(btn).prop('disabled', true);
        $.ajax({
            url: '/api/institution/authority/' + institutionId + '/toggle-status',
            method: 'PUT',
            success: function (res) {
                if (res.success) {
                    const shop = allShops.find(function (s) { return s.institutionId === institutionId; });
                    if (shop) shop.validation = res.validation;
                    applyFilters();
                    toast(res.validation === 'Valid' ? 'শপ সক্রিয় করা হয়েছে' : 'শপ নিষ্ক্রিয় করা হয়েছে', 'success');
                } else {
                    $(btn).prop('disabled', false);
                    toast('ব্যর্থ হয়েছে', 'error');
                }
            },
            error: function () { $(btn).prop('disabled', false); toast('সার্ভার ত্রুটি', 'error'); }
        });
    };

    // ── Edit Profile ──────────────────────────────────────────────────────────
    window.showEditForm = function () {
        $('#editName').val(profile.name || '');
        $('#editFatherName').val(profile.fatherName || '');
        $('#editDesignation').val(profile.designation || '');
        $('#editGender').val(profile.gender || '');
        $('#editPhone').val(profile.phone || '');
        $('#editEmail').val(profile.email || '');
        $('#editCity').val(profile.city || '');
        $('#editPostalCode').val(profile.postalCode || '');
        $('#editAddress').val(profile.address || '');
        $('#editCard').show('fast');
        $('html,body').animate({ scrollTop: $('#editCard').offset().top - 80 }, 300);
    };
    window.cancelEdit = function () { $('#editCard').hide(); };

    window.saveProfile = function () {
        const name  = $('#editName').val().trim();
        const phone = $('#editPhone').val().trim();
        if (!name || !phone) { toast('Name and mobile are required', 'error'); return; }
        const regId = profile.registrationID;
        const data  = {
            name: name, phone: phone,
            fatherName:  $('#editFatherName').val().trim(),
            designation: $('#editDesignation').val().trim(),
            gender:      $('#editGender').val(),
            email:       $('#editEmail').val().trim(),
            city:        $('#editCity').val().trim(),
            postalCode:  $('#editPostalCode').val().trim(),
            address:     $('#editAddress').val().trim(),
            institutionID: 0
        };
        $.ajax({
            url: '/api/profile/' + regId, method: 'PUT',
            contentType: 'application/json', data: JSON.stringify(data),
            success: function (res) {
                if (!res.success) { toast(res.message || 'Update failed', 'error'); return; }
                const file = $('#editImage')[0].files[0];
                if (file) {
                    const fd = new FormData();
                    fd.append('image', file);
                    $.ajax({
                        url: '/api/profile/' + regId + '/image', method: 'POST',
                        data: fd, processData: false, contentType: false,
                        complete: function () { Object.assign(profile, data); cancelEdit(); toast('Profile updated', 'success'); loadProfile(); }
                    });
                } else {
                    Object.assign(profile, data); cancelEdit(); toast('Profile updated', 'success'); loadProfile();
                }
            },
            error: function () { toast('Server error', 'error'); }
        });
    };

    // ── Change Password ───────────────────────────────────────────────────────
    window.togglePwdSection = function () {
        const $s = $('#pwdSection');
        $s.is(':visible') ? $s.hide('fast') : $s.show('fast');
    };

    window.changePassword = function () {
        const cur  = $('#currentPwd').val();
        const newp = $('#newPwd').val();
        const conf = $('#confirmPwd').val();
        const $err = $('#pwdError').hide();
        if (!cur || !newp || !conf) { $err.text('All fields required').show(); return; }
        if (newp.length < 6)        { $err.text('Min 6 characters').show(); return; }
        if (newp !== conf)          { $err.text('Passwords do not match').show(); return; }
        const $btn = $('#pwdBtn').prop('disabled', true);
        $.ajax({
            url: '/api/auth/change-password', method: 'POST', contentType: 'application/json',
            data: JSON.stringify({ username: sessionStorage.getItem('username'), currentPassword: cur, newPassword: newp }),
            success: function (res) {
                $btn.prop('disabled', false);
                if (res.success) {
                    $('#currentPwd,#newPwd,#confirmPwd').val('');
                    toast('Password changed', 'success');
                    setTimeout(function () { $('#pwdSection').hide('fast'); }, 1500);
                } else {
                    $err.text(res.message || 'Failed').show();
                }
            },
            error: function (xhr) {
                $btn.prop('disabled', false);
                $err.text((xhr.responseJSON && xhr.responseJSON.message) || 'Server error').show();
            }
        });
    };

    window.togglePwd = function (id, btn) {
        const $f = $('#' + id);
        $f.attr('type', $f.attr('type') === 'password' ? 'text' : 'password');
        $(btn).find('i').toggleClass('fa-eye fa-eye-slash');
    };

    // ── Logout ────────────────────────────────────────────────────────────────
    window.confirmLogout = function () { new bootstrap.Modal(document.getElementById('logoutModal')).show(); };
    window.doLogout = function () { TailorAuth.logout(); };

    // ── Sidebar mobile ────────────────────────────────────────────────────────
    window.openSidebar  = function () { $('#authSidebar, #sidebarOverlay').addClass('open'); };
    window.closeSidebar = function () { $('#authSidebar, #sidebarOverlay').removeClass('open'); };

    // ── Helpers ───────────────────────────────────────────────────────────────
    function fmt(n) {
        return parseFloat(n || 0).toLocaleString('en-BD', { maximumFractionDigits: 0 });
    }
    function fmtDate(d) {
        if (!d) return '—';
        const dt = new Date(d);
        return dt.toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    function esc(s) {
        return String(s || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/`/g, '&#96;')
            .replace(/\n/g, ' ')
            .replace(/\r/g, '');
    }
    function toast(msg, type) {
        const $t = $('<div class="toast-item ' + (type || 'info') + '">' + msg + '</div>');
        $('#toastWrap').append($t);
        setTimeout(function () { $t.fadeOut(300, function () { $t.remove(); }); }, 3000);
    }

})();
