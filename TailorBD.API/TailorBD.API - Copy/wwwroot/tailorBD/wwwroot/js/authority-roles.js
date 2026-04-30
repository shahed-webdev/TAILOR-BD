(function () {
    'use strict';

    // ── State ─────────────────────────────────────────────────────────────────
    let allRoles        = [];   // [{roleId, roleName, userCount}]
    let allUsers        = [];   // [{userName, fullName, category, institutionName, roles}]
    let selectedUser    = null; // userName string
    let selectedRole    = null; // roleName string
    let pendingDelete   = null; // roleName to delete
    let originalRoles   = [];   // roles the selected user had before editing (for diff)

    // ── Init ──────────────────────────────────────────────────────────────────
    $(document).ready(function () {
        if (!TailorAuth.guard('Authority')) return;
        TailorAuth.guardSubPage('roles');
        loadSidebarProfile();
        refreshAll();
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

    // ── Tab switching ─────────────────────────────────────────────────────────
    window.switchTab = function (tab) {
        $('.tab-btn').removeClass('active');
        $('.tab-panel').removeClass('active');
        $('#tab-btn-' + tab).addClass('active');
        $('#panel-' + tab).addClass('active');

        if (tab === 'assign' && allUsers.length === 0) loadUsers();
        if (tab === 'byrole') renderByRoleSelector();
    };

    // ── Refresh all ───────────────────────────────────────────────────────────
    window.refreshAll = function () {
        $('#refreshIcon').addClass('fa-spin');
        $.when(loadRoles(), loadUsers()).always(function () {
            $('#refreshIcon').removeClass('fa-spin');
        });
    };

    // ── Load Roles ────────────────────────────────────────────────────────────
    function loadRoles() {
        var def = $.Deferred();
        $.get('/api/role', function (res) {
            if (res.success) {
                allRoles = res.data || [];
                renderRoleList();
                updateStats();
            }
            def.resolve();
        }).fail(function () {
            toast('রোল লোড ব্যর্থ', 'error');
            def.resolve();
        });
        return def.promise();
    }

    // ── Load Users ────────────────────────────────────────────────────────────
    function loadUsers() {
        var def = $.Deferred();
        $.get('/api/role/users', function (res) {
            if (res.success) {
                allUsers = res.data || [];
                renderAssignUserList(allUsers);
                populateUserDatalist();
                updateStats();
            }
            def.resolve();
        }).fail(function () {
            toast('ইউজার লোড ব্যর্থ', 'error');
            def.resolve();
        });
        return def.promise();
    }

    // ── Stats ─────────────────────────────────────────────────────────────────
    function updateStats() {
        $('#statRoles').text(allRoles.length);
        $('#statUsers').text(allUsers.length);
        var assigned   = allUsers.filter(function (u) { return u.roles && u.roles.length > 0; }).length;
        var unassigned = allUsers.length - assigned;
        $('#statAssigned').text(assigned);
        $('#statUnassigned').text(unassigned);
        $('#tb-roles').text(allRoles.length);
    }

    // ════════════════════════════════════════════════════════
    //  TAB 1 — Create / Delete Role
    // ════════════════════════════════════════════════════════

    function renderRoleList() {
        var $wrap = $('#roleListWrap').empty();
        $('#roleCountBadge').text(allRoles.length);

        if (!allRoles.length) {
            $wrap.html(
                '<div class="empty-state"><i class="fas fa-shield-alt"></i><p>কোনো রোল নেই। উপরের ফর্ম থেকে নতুন রোল তৈরি করুন।</p></div>'
            );
            return;
        }

        var $list = $('<div class="role-list"></div>');
        allRoles.forEach(function (r) {
            var $pill = $(
                '<div class="role-pill" title="' + esc(r.roleName) + '">' +
                    '<i class="fas fa-shield-alt" style="color:#6366f1;font-size:.8rem;"></i>' +
                    '<span>' + esc(r.roleName) + '</span>' +
                    '<span class="rp-count">' + r.userCount + ' ইউজার</span>' +
                    '<button class="rp-del" title="মুছুন" onclick="askDeleteRole(\'' + esc(r.roleName) + '\')">' +
                        '<i class="fas fa-times"></i>' +
                    '</button>' +
                '</div>'
            );
            $list.append($pill);
        });
        $wrap.append($list);
    }

    window.createRole = function () {
        var name = $('#newRoleName').val().trim();
        if (!name) { toast('রোলের নাম লিখুন', 'error'); return; }

        $('#btnCreateRole').prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-2"></i>তৈরি হচ্ছে...');
        $.ajax({
            url: '/api/role',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ roleName: name }),
            success: function (res) {
                if (res.success) {
                    toast(res.message, 'success');
                    $('#newRoleName').val('');
                    loadRoles().then(function () {
                        renderByRoleSelector();
                        if (selectedUser) loadUserRoleChecks(selectedUser);
                    });
                } else {
                    toast(res.message, 'error');
                }
            },
            error: function (xhr) { toast(parseError(xhr) || 'সার্ভার ত্রুটি', 'error'); }
        }).always(function () {
            $('#btnCreateRole').prop('disabled', false).html('<i class="fas fa-plus me-2"></i>রোল তৈরি করুন');
        });
    };

    window.askDeleteRole = function (roleName) {
        pendingDelete = roleName;
        $('#deleteRoleName').text(roleName);
        new bootstrap.Modal(document.getElementById('deleteRoleModal')).show();
    };

    window.confirmDeleteRole = function () {
        if (!pendingDelete) return;
        var roleName = pendingDelete;
        bootstrap.Modal.getInstance(document.getElementById('deleteRoleModal')).hide();

        $.ajax({
            url: '/api/role/' + encodeURIComponent(roleName),
            method: 'DELETE',
            success: function (res) {
                if (res.success) {
                    toast(res.message, 'success');
                    pendingDelete = null;
                    loadRoles().then(function () {
                        renderByRoleSelector();
                        if (selectedUser) loadUserRoleChecks(selectedUser);
                        // If the deleted role was selected in tab3, clear
                        if (selectedRole === roleName) {
                            selectedRole = null;
                            $('#byRoleTitle').text('রোল নির্বাচন করুন');
                            $('#byRoleUserCount').hide();
                            $('#addUserToRoleWrap').hide();
                            $('#byRoleUserList').html(
                                '<div class="empty-state"><i class="fas fa-hand-point-left"></i><p style="font-size:.88rem;">বামে থেকে একটি রোল নির্বাচন করুন</p></div>'
                            );
                        }
                    });
                } else {
                    toast(res.message, 'error');
                }
            },
            error: function (xhr) { toast(parseError(xhr) || 'সার্ভার ত্রুটি', 'error'); }
        });
    };

    // ════════════════════════════════════════════════════════
    //  TAB 2 — Assign roles by user
    // ════════════════════════════════════════════════════════

    function renderAssignUserList(users) {
        var $wrap = $('#assignUserList').empty();

        if (!users.length) {
            $wrap.html('<div class="empty-state" style="padding:20px;"><i class="fas fa-users-slash"></i><p>কোনো ইউজার পাওয়া যায়নি</p></div>');
            return;
        }

        // Group by institution
        var groups = {};
        users.forEach(function (u) {
            var key = u.institutionName || '(অন্যান্য)';
            if (!groups[key]) groups[key] = [];
            groups[key].push(u);
        });

        Object.keys(groups).sort().forEach(function (insName) {
            var $insHdr = $(
                '<div style="font-size:.72rem;font-weight:700;color:#94a3b8;text-transform:uppercase;' +
                'letter-spacing:.5px;padding:8px 6px 4px;margin-top:4px;">' +
                    '<i class="fas fa-building me-1"></i>' + esc(insName) +
                '</div>'
            );
            $wrap.append($insHdr);

            groups[insName].forEach(function (u) {
                var isAdmin   = (u.category || '').toLowerCase() === 'admin';
                var avatarCls = isAdmin ? 'avatar-admin' : 'avatar-subadmin';
                var initial   = (u.userName || '?').charAt(0).toUpperCase();
                var rolesHtml = u.roles
                    ? u.roles.split(', ').filter(Boolean).map(function (r) {
                        return '<span class="badge-role">' + esc(r) + '</span>';
                    }).join('')
                    : '<span class="badge-empty">কোনো রোল নেই</span>';

                var $row = $(
                    '<div class="d-flex align-items-center gap-2 p-2 rounded-3 mb-1 user-select-row" ' +
                    'style="cursor:pointer;border:1.5px solid transparent;" data-username="' + esc(u.userName) + '">' +
                        '<div class="u-avatar ' + avatarCls + '" style="width:30px;height:30px;font-size:.75rem;border-radius:8px;">' + esc(initial) + '</div>' +
                        '<div style="flex:1;min-width:0;">' +
                            '<div style="font-size:.82rem;font-weight:700;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(u.userName) + '</div>' +
                            '<div style="font-size:.7rem;margin-top:1px;">' + rolesHtml + '</div>' +
                        '</div>' +
                    '</div>'
                );

                $row.on('click', function () {
                    $('.user-select-row').css({ background:'', borderColor:'transparent' });
                    $(this).css({ background:'#eef2ff', borderColor:'#c7d2fe' });
                    selectUserForAssign(u.userName);
                });

                $wrap.append($row);
            });
        });
    }

    window.filterUserList = function () {
        var q = ($('#userSearchInput').val() || '').toLowerCase().trim();
        var filtered = !q ? allUsers : allUsers.filter(function (u) {
            return u.userName.toLowerCase().includes(q) ||
                   (u.institutionName || '').toLowerCase().includes(q) ||
                   (u.fullName || '').toLowerCase().includes(q);
        });
        renderAssignUserList(filtered);
    };

    function selectUserForAssign(userName) {
        selectedUser = userName;
        var u = allUsers.find(function (x) { return x.userName === userName; });
        var label = userName + (u && u.fullName ? ' (' + u.fullName + ')' : '');
        $('#selectedUserTitle').text(label);
        $('#assignActions').show();
        $('#assignStatusMsg').hide();
        loadUserRoleChecks(userName);
    }

    function loadUserRoleChecks(userName) {
        $('#roleCheckWrap').html(
            '<div class="text-center py-4 text-muted"><div class="spinner-border spinner-border-sm me-2"></div></div>'
        );
        $.get('/api/role/users/' + encodeURIComponent(userName) + '/roles', function (res) {
            if (!res.success) { toast('রোল লোড ব্যর্থ', 'error'); return; }
            var roles = res.data || [];
            originalRoles = roles.filter(function (r) { return r.isInRole; }).map(function (r) { return r.roleName; });

            if (!roles.length) {
                $('#roleCheckWrap').html('<div class="empty-state" style="padding:20px;"><i class="fas fa-shield-alt"></i><p>কোনো রোল তৈরি করা হয়নি</p></div>');
                return;
            }

            var $list = $('<div class="role-check-list"></div>');
            roles.forEach(function (r) {
                var chkId = 'chk-' + r.roleName.replace(/\s+/g, '_');
                var $item = $(
                    '<label class="role-check-item' + (r.isInRole ? ' checked' : '') + '" for="' + chkId + '">' +
                        '<input type="checkbox" id="' + chkId + '" value="' + esc(r.roleName) + '"' +
                            (r.isInRole ? ' checked' : '') + '>' +
                        '<i class="fas fa-shield-alt" style="color:#6366f1;font-size:.75rem;"></i>' +
                        '<span style="font-size:.84rem;font-weight:600;">' + esc(r.roleName) + '</span>' +
                    '</label>'
                );
                $item.find('input').on('change', function () {
                    $item.toggleClass('checked', this.checked);
                });
                $list.append($item);
            });
            $('#roleCheckWrap').empty().append($list);
        }).fail(function () { toast('সার্ভার ত্রুটি', 'error'); });
    }

    window.saveUserRoles = function () {
        if (!selectedUser) return;

        var newRoles = [];
        $('#roleCheckWrap input[type=checkbox]').each(function () {
            if (this.checked) newRoles.push(this.value);
        });

        var toAdd    = newRoles.filter(function (r) { return !originalRoles.includes(r); });
        var toRemove = originalRoles.filter(function (r) { return !newRoles.includes(r); });

        if (!toAdd.length && !toRemove.length) {
            toast('কোনো পরিবর্তন নেই', 'info'); return;
        }

        var promises = [];

        toAdd.forEach(function (r) {
            promises.push(
                $.ajax({
                    url: '/api/role/users/' + encodeURIComponent(selectedUser) + '/assign',
                    method: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({ roleName: r })
                })
            );
        });

        toRemove.forEach(function (r) {
            promises.push(
                $.ajax({
                    url: '/api/role/users/' + encodeURIComponent(selectedUser) + '/roles/' + encodeURIComponent(r),
                    method: 'DELETE'
                })
            );
        });

        $.when.apply($, promises)
            .done(function () {
                toast('রোল সফলভাবে আপডেট হয়েছে', 'success');
                $('#assignStatusMsg').text('✓ সেভ হয়েছে').show();
                setTimeout(function () { $('#assignStatusMsg').fadeOut(); }, 3000);
                // Refresh
                loadUsers().then(function () {
                    loadUserRoleChecks(selectedUser);
                    // Also refresh tab 3 if role selected
                    if (selectedRole) loadUsersInRole(selectedRole);
                });
            })
            .fail(function () {
                toast('কিছু পরিবর্তন ব্যর্থ হয়েছে', 'error');
            });
    };

    // ════════════════════════════════════════════════════════
    //  TAB 3 — Users by Role
    // ════════════════════════════════════════════════════════

    function renderByRoleSelector() {
        var $wrap = $('#byRoleSelector').empty();

        if (!allRoles.length) {
            $wrap.html('<div class="empty-state" style="padding:16px;"><i class="fas fa-shield-alt"></i><p style="font-size:.82rem;">কোনো রোল নেই</p></div>');
            return;
        }

        allRoles.forEach(function (r) {
            var isActive = selectedRole === r.roleName;
            var $btn = $(
                '<button class="btn btn-sm w-100 text-start mb-2 rounded-3' + (isActive ? ' btn-primary' : ' btn-light border') + '" ' +
                'style="padding:9px 12px;font-size:.84rem;font-weight:600;">' +
                    '<i class="fas fa-shield-alt me-2" style="' + (isActive ? 'color:#fff' : 'color:#6366f1') + ';font-size:.75rem;"></i>' +
                    esc(r.roleName) +
                    '<span class="badge float-end ' + (isActive ? 'bg-white text-primary' : 'bg-secondary') + ' rounded-pill ms-1" ' +
                    'style="font-size:.68rem;">' + r.userCount + '</span>' +
                '</button>'
            );
            $btn.on('click', function () {
                selectedRole = r.roleName;
                renderByRoleSelector();
                loadUsersInRole(r.roleName);
            });
            $wrap.append($btn);
        });
    }

    function loadUsersInRole(roleName) {
        $('#byRoleTitle').text(roleName + ' — ইউজারসমূহ');
        $('#byRoleUserCount').show().text('লোড হচ্ছে...');
        $('#addUserToRoleWrap').show();
        $('#byRoleUserList').html(
            '<div class="text-center py-4 text-muted"><div class="spinner-border spinner-border-sm me-2"></div></div>'
        );

        $.get('/api/role/' + encodeURIComponent(roleName) + '/users', function (res) {
            if (!res.success) { toast('ডেটা লোড ব্যর্থ', 'error'); return; }
            var users = res.data || [];
            $('#byRoleUserCount').text(users.length + ' ইউজার');
            renderByRoleUserList(roleName, users);
        }).fail(function () { toast('সার্ভার ত্রুটি', 'error'); });
    }

    function renderByRoleUserList(roleName, users) {
        var $wrap = $('#byRoleUserList').empty();
        $('#tb-byrole').text(users.length);

        if (!users.length) {
            $wrap.html(
                '<div class="empty-state"><i class="fas fa-user-slash"></i><p style="font-size:.88rem;">এই রোলে কোনো ইউজার নেই</p></div>'
            );
            return;
        }

        var $table = $(
            '<table class="user-table">' +
                '<thead><tr>' +
                    '<th style="width:38px;">#</th>' +
                    '<th>ইউজার</th>' +
                    '<th>প্রতিষ্ঠান</th>' +
                    '<th>ক্যাটাগরি</th>' +
                    '<th style="width:80px;">অ্যাকশন</th>' +
                '</tr></thead>' +
                '<tbody id="byRoleTbody"></tbody>' +
            '</table>'
        );

        var $tbody = $table.find('#byRoleTbody');
        users.forEach(function (u, i) {
            var isAdmin   = (u.category || '').toLowerCase() === 'admin';
            var avatarCls = isAdmin ? 'avatar-admin' : 'avatar-subadmin';
            var catBadge  = isAdmin
                ? '<span class="badge-role badge-admin">Admin</span>'
                : '<span class="badge-role badge-subadmin">Sub-Admin</span>';
            var initial   = (u.userName || '?').charAt(0).toUpperCase();

            var $tr = $(
                '<tr>' +
                    '<td style="color:#94a3b8;font-size:.78rem;">' + (i + 1) + '</td>' +
                    '<td>' +
                        '<div class="d-flex align-items-center gap-2">' +
                            '<div class="u-avatar ' + avatarCls + '">' + esc(initial) + '</div>' +
                            '<div>' +
                                '<div style="font-weight:700;color:#1e293b;">' + esc(u.userName) + '</div>' +
                                (u.fullName ? '<div style="font-size:.73rem;color:#94a3b8;">' + esc(u.fullName) + '</div>' : '') +
                            '</div>' +
                        '</div>' +
                    '</td>' +
                    '<td style="color:#475569;">' + esc(u.institutionName || '—') + '</td>' +
                    '<td>' + catBadge + '</td>' +
                    '<td>' +
                        '<button class="btn btn-sm btn-light border" style="border-radius:8px;font-size:.75rem;color:#dc2626;" ' +
                        'onclick="removeFromRole(\'' + esc(u.userName) + '\',\'' + esc(roleName) + '\')" title="রোল থেকে সরান">' +
                            '<i class="fas fa-user-minus"></i>' +
                        '</button>' +
                    '</td>' +
                '</tr>'
            );
            $tbody.append($tr);
        });

        $wrap.append($table);
    }

    window.addUserToRole = function () {
        if (!selectedRole) return;
        var userName = $('#addUserInput').val().trim();
        if (!userName) { toast('ইউজারনেম লিখুন', 'error'); return; }

        $.ajax({
            url: '/api/role/users/' + encodeURIComponent(userName) + '/assign',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ roleName: selectedRole }),
            success: function (res) {
                if (res.success) {
                    toast(res.message, 'success');
                    $('#addUserInput').val('');
                    loadUsers().then(function () {
                        loadUsersInRole(selectedRole);
                        loadRoles().then(function () { renderByRoleSelector(); });
                    });
                } else {
                    toast(res.message, 'error');
                }
            },
            error: function (xhr) { toast(parseError(xhr) || 'সার্ভার ত্রুটি', 'error'); }
        });
    };

    window.removeFromRole = function (userName, roleName) {
        if (!confirm('"' + userName + '" কে "' + roleName + '" রোল থেকে সরাবেন?')) return;

        $.ajax({
            url: '/api/role/users/' + encodeURIComponent(userName) + '/roles/' + encodeURIComponent(roleName),
            method: 'DELETE',
            success: function (res) {
                if (res.success) {
                    toast(res.message, 'success');
                    loadUsers().then(function () {
                        loadUsersInRole(roleName);
                        loadRoles().then(function () { renderByRoleSelector(); });
                    });
                } else {
                    toast(res.message, 'error');
                }
            },
            error: function (xhr) { toast(parseError(xhr) || 'সার্ভার ত্রুটি', 'error'); }
        });
    };

    // ── Datalist for user autocomplete ───────────────────────────────────────
    function populateUserDatalist() {
        var $dl = $('#userDatalist').empty();
        allUsers.forEach(function (u) {
            $dl.append('<option value="' + esc(u.userName) + '">');
        });
    }

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
