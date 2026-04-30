(function () {
    'use strict';

    // ── State ─────────────────────────────────────────────────────────────────
    let allGroups   = [];   // [{institutionId, institutionName, insPhone, validation, users:[]}]
    let filterKey   = '';   // '' | 'locked' | 'unapproved'
    let pwdVisible  = false;

    // ── Init ──────────────────────────────────────────────────────────────────
    $(document).ready(function () {
        if (!TailorAuth.guard('Authority')) return;
        TailorAuth.guardSubPage('users');
        loadSidebarProfile();
        loadUsers();
    });

    // ── Sidebar ───────────────────────────────────────────────────────────────
    function loadSidebarProfile() {
        const username = sessionStorage.getItem('username');
        if (!username) return;
        $.get('/api/profile/by-username/' + encodeURIComponent(username), function (res) {
            if (!res.success || !res.data) return;
            const d = res.data;
            const avatarUrl = (d.image && d.image.length > 0)
                ? '/api/profile/' + d.registrationID + '/image'
                : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(d.name || 'A') + '&background=6366f1&color=fff&size=100&bold=true';
            $('#sidebarAvatar').attr('src', avatarUrl);
            $('#sidebarName').text(d.name || 'Authority');
        });
    }

    // ── Load ──────────────────────────────────────────────────────────────────
    window.loadUsers = function () {
        $('#refreshIcon').addClass('fa-spin');
        $('#userListWrap').html(
            '<div class="section-card text-center py-5"><div class="spinner-border text-primary me-2"></div> লোড হচ্ছে...</div>'
        );

        $.get('/api/institution/authority/users', function (res) {
            $('#refreshIcon').removeClass('fa-spin');
            if (!res.success) { toast('ডেটা লোড ব্যর্থ', 'error'); return; }
            allGroups = res.data || [];
            updateStats();
            applyFilters();
        }).fail(function () {
            $('#refreshIcon').removeClass('fa-spin');
            toast('সার্ভার সংযোগ ব্যর্থ', 'error');
        });
    };

    // ── Stats ─────────────────────────────────────────────────────────────────
    function updateStats() {
        let totalUsers = 0, locked = 0, unapproved = 0, approved = 0;
        allGroups.forEach(function (g) {
            (g.users || []).forEach(function (u) {
                totalUsers++;
                if (u.isLockedOut)  locked++;
                if (!u.isApproved)  unapproved++;
                if (u.isApproved)   approved++;
            });
        });
        $('#statIns').text(allGroups.length);
        $('#statUsers').text(totalUsers);
        $('#statLocked').text(locked);
        $('#statUnapproved').text(unapproved);
        $('#statApproved').text(approved);
    }

    // ── Filters ───────────────────────────────────────────────────────────────
    window.setFilter = function (key, btn) {
        filterKey = key;
        $('.f-btn').removeClass('active');
        $(btn).addClass('active');
        applyFilters();
    };

    window.applyFilters = function () {
        const search = ($('#searchInput').val() || '').toLowerCase().trim();

        let filtered = allGroups.map(function (g) {
            let users = (g.users || []).filter(function (u) {
                const matchSearch = !search ||
                    g.institutionName.toLowerCase().includes(search) ||
                    u.userName.toLowerCase().includes(search) ||
                    g.insPhone.toLowerCase().includes(search);
                const matchFilter =
                    filterKey === 'locked'     ? u.isLockedOut :
                    filterKey === 'unapproved' ? !u.isApproved : true;
                return matchSearch && matchFilter;
            });
            return { ...g, users };
        }).filter(function (g) { return g.users.length > 0; });

        $('#resultInfo').html('<strong>' + filtered.length + '</strong> প্রতিষ্ঠান পাওয়া গেছে');
        renderList(filtered);
    };

    // ── Render ────────────────────────────────────────────────────────────────
    function renderList(groups) {
        var $wrap = $('#userListWrap').empty();

        if (!groups.length) {
            $wrap.html(
                '<div class="section-card text-center py-5" style="color:#94a3b8;">' +
                '<i class="fas fa-users-slash d-block mb-3" style="font-size:2.5rem;opacity:.35;"></i>' +
                '<h5>কোনো ইউজার পাওয়া যায়নি</h5>' +
                '</div>'
            );
            return;
        }

        groups.forEach(function (g) {
            var statusBadge = g.validation === 'Valid'
                ? '<span class="ins-badge-valid">Active</span>'
                : '<span class="ins-badge-invalid">Inactive</span>';

            var $block = $('<div class="ins-block"></div>');

            // header
            var $hdr = $(
                '<div class="ins-block-header">' +
                    '<div style="width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:.95rem;flex-shrink:0;">' +
                        esc(g.institutionName.charAt(0).toUpperCase()) +
                    '</div>' +
                    '<div style="flex:1;min-width:0;">' +
                        '<div style="font-size:.92rem;font-weight:700;color:#1e293b;">' + esc(g.institutionName) + '</div>' +
                        '<div style="font-size:.75rem;color:#94a3b8;"><i class="fas fa-phone me-1"></i>' + esc(g.insPhone || '—') + '</div>' +
                    '</div>' +
                    '<div class="d-flex align-items:center gap-2 ms-auto">' +
                        statusBadge +
                        '<span style="font-size:.75rem;color:#94a3b8;" class="ms-2">' + g.users.length + ' ইউজার</span>' +
                        '<i class="fas fa-chevron-down collapse-icon ms-2" style="color:#94a3b8;font-size:.8rem;"></i>' +
                    '</div>' +
                '</div>'
            );

            $hdr.on('click', function () {
                $(this).toggleClass('collapsed');
                $body.slideToggle(200);
            });

            // body
            var $body = $('<div class="ins-block-body"></div>');
            g.users.forEach(function (u) {
                $body.append(buildUserRow(u));
            });

            $block.append($hdr).append($body);
            $wrap.append($block);
        });
    }

    function buildUserRow(u) {
        var isAdmin  = (u.category || '').toLowerCase() === 'admin';
        var avatarCls= isAdmin ? 'avatar-admin' : 'avatar-subadmin';
        var catLabel = isAdmin ? 'Admin' : 'Sub-Admin';
        var initial  = (u.name || u.userName || '?').charAt(0).toUpperCase();

        // Status badges
        var badges = '';
        if (u.isLockedOut)  badges += '<span class="badge-locked"><i class="fas fa-lock me-1"></i>লক</span> ';
        if (!u.isApproved)  badges += '<span class="badge-unapproved"><i class="fas fa-ban me-1"></i>অনুমোদনহীন</span> ';
        if (u.isApproved && !u.isLockedOut) badges += '<span class="badge-approved"><i class="fas fa-check me-1"></i>অনুমোদিত</span> ';

        if (u.failedAttempts > 0) {
            badges += '<span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:20px;font-size:.68rem;font-weight:700;">' +
                '<i class="fas fa-exclamation-triangle me-1"></i>' + u.failedAttempts + ' বার ভুল পাসওয়ার্ড</span> ';
        }

        // Credential display
        var pwdHtml =
            '<div class="user-cred me-1">' +
                '<div class="cred-lbl">পাসওয়ার্ড</div>' +
                '<span class="pwd-hidden" data-pwd="' + esc(u.password || '') + '" id="pwd-' + u.liuId + '">••••••••</span>' +
                ' <button class="btn-act btn-eye py-0 px-1" style="padding:1px 5px;font-size:.7rem;" onclick="togglePwd(' + u.liuId + ')" title="দেখুন">' +
                    '<i class="fas fa-eye"></i>' +
                '</button>' +
            '</div>';

        // Action buttons
        var actions = '';
        if (u.isLockedOut) {
            actions += '<button class="btn-act btn-unlock" onclick="doUnlock(\'' + esc(u.userName) + '\')" title="আনলক করুন">' +
                '<i class="fas fa-lock-open"></i> আনলক</button>';
        }
        if (!u.isApproved) {
            actions += '<button class="btn-act btn-approve" onclick="doToggleApprove(\'' + esc(u.userName) + '\',true)" title="অনুমোদন করুন">' +
                '<i class="fas fa-user-check"></i> অনুমোদন</button>';
        } else {
            actions += '<button class="btn-act btn-unapprove" onclick="doToggleApprove(\'' + esc(u.userName) + '\',false)" title="অনুমোদন বাতিল">' +
                '<i class="fas fa-user-times"></i></button>';
        }
        actions += '<button class="btn-act btn-pwd" onclick="openPwdModal(\'' + esc(u.userName) + '\')" title="পাসওয়ার্ড পরিবর্তন">' +
            '<i class="fas fa-key"></i> পাসওয়ার্ড</button>';

        return $(
            '<div class="user-row" id="urow-' + u.liuId + '">' +
                '<div class="user-avatar ' + avatarCls + '">' + esc(initial) + '</div>' +
                '<div class="user-info">' +
                    '<div class="user-name">' + esc(u.userName) + (u.name ? ' <span style="color:#94a3b8;font-weight:400;font-size:.78rem;">(' + esc(u.name) + ')</span>' : '') + '</div>' +
                    '<div class="user-cat">' + catLabel +
                        (u.userPhone ? ' &bull; ' + esc(u.userPhone) : '') +
                        (u.email     ? ' &bull; ' + esc(u.email) : '') +
                    '</div>' +
                '</div>' +
                '<div class="user-cred">' +
                    '<div class="cred-lbl">ইউজার নাম</div>' +
                    '<span style="font-weight:700;color:#1e293b;">' + esc(u.userName) + '</span>' +
                '</div>' +
                pwdHtml +
                '<div style="display:flex;flex-direction:column;gap:3px;font-size:.72rem;color:#64748b;min-width:60px;">' + badges + '</div>' +
                '<div class="user-actions">' + actions + '</div>' +
            '</div>'
        );
    }

    // ── Toggle password visibility ────────────────────────────────────────────
    window.togglePwd = function (liuId) {
        var $span = $('#pwd-' + liuId);
        if ($span.hasClass('pwd-hidden')) {
            $span.removeClass('pwd-hidden').addClass('pwd-visible').text($span.data('pwd') || '(নেই)');
            $span.next('button').find('i').removeClass('fa-eye').addClass('fa-eye-slash');
        } else {
            $span.removeClass('pwd-visible').addClass('pwd-hidden').text('••••••••');
            $span.next('button').find('i').removeClass('fa-eye-slash').addClass('fa-eye');
        }
    };

    // ── Unlock ────────────────────────────────────────────────────────────────
    window.doUnlock = function (userName) {
        if (!confirm('"' + userName + '" কে আনলক করবেন?')) return;
        $.post('/api/institution/authority/users/' + encodeURIComponent(userName) + '/unlock',
            function (res) {
                if (res.success) {
                    toast(res.message, 'success');
                    loadUsers();
                } else {
                    toast(res.message || 'ব্যর্থ হয়েছে', 'error');
                }
            }
        ).fail(function (xhr) {
            toast(parseError(xhr) || 'সার্ভার ত্রুটি', 'error');
        });
    };

    // ── Toggle Approve ────────────────────────────────────────────────────────
    window.doToggleApprove = function (userName, willApprove) {
        var msg = willApprove
            ? '"' + userName + '" কে অনুমোদন করবেন?'
            : '"' + userName + '" এর অনুমোদন বাতিল করবেন?';
        if (!confirm(msg)) return;
        $.post('/api/institution/authority/users/' + encodeURIComponent(userName) + '/toggle-approve',
            function (res) {
                if (res.success) {
                    toast(res.message, 'success');
                    loadUsers();
                } else {
                    toast(res.message || 'ব্যর্থ হয়েছে', 'error');
                }
            }
        ).fail(function (xhr) {
            toast(parseError(xhr) || 'সার্ভার ত্রুটি', 'error');
        });
    };

    // ── Password reset modal ──────────────────────────────────────────────────
    window.openPwdModal = function (userName) {
        $('#pwdUserName').val(userName);
        $('#pwdUserDisplay').text(userName);
        $('#newPwdInput').val('').attr('type', 'password');
        $('#pwdEyeIcon').removeClass('fa-eye-slash').addClass('fa-eye');
        pwdVisible = false;
        new bootstrap.Modal(document.getElementById('pwdModal')).show();
    };

    window.togglePwdVis = function () {
        pwdVisible = !pwdVisible;
        $('#newPwdInput').attr('type', pwdVisible ? 'text' : 'password');
        $('#pwdEyeIcon').toggleClass('fa-eye', !pwdVisible).toggleClass('fa-eye-slash', pwdVisible);
    };

    window.submitResetPwd = function () {
        var userName = $('#pwdUserName').val();
        var newPwd   = $('#newPwdInput').val().trim();
        if (!newPwd || newPwd.length < 6) {
            toast('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে', 'error'); return;
        }
        $.ajax({
            url: '/api/institution/authority/users/' + encodeURIComponent(userName) + '/reset-password',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ newPassword: newPwd }),
            success: function (res) {
                if (res.success) {
                    bootstrap.Modal.getInstance(document.getElementById('pwdModal')).hide();
                    toast(res.message, 'success');
                    loadUsers();
                } else {
                    toast(res.message || 'ব্যর্থ হয়েছে', 'error');
                }
            },
            error: function (xhr) {
                toast(parseError(xhr) || 'সার্ভার ত্রুটি', 'error');
            }
        });
    };

    // ── Logout ────────────────────────────────────────────────────────────────
    window.confirmLogout = function () {
        new bootstrap.Modal(document.getElementById('logoutModal')).show();
    };
    window.doLogout = function () {
        TailorAuth.logout();
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    function esc(s) {
        return String(s || '')
            .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    }

    function parseError(xhr) {
        try { return JSON.parse(xhr.responseText).message; } catch { return null; }
    }

    function toast(msg, type) {
        type = type || 'info';
        var $t = $('<div class="toast-item ' + type + '">' + esc(msg) + '</div>');
        $('#toastWrap').append($t);
        setTimeout(function () { $t.fadeOut(400, function () { $t.remove(); }); }, 3500);
    }

}());
