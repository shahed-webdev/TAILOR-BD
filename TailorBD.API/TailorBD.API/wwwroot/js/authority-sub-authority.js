(function () {
    'use strict';

    // ── State ─────────────────────────────────────────────────────────────────
    var allSubAdmins   = [];
    var filteredList   = [];
    var registrationId = 0;
    var pendingDelete  = null;
    var accessTarget   = null;   // { registrationId, userName }
    var allPages       = [];     // [{ groupName, pages:[{ key, label, icon }] }]

    // ── Init ──────────────────────────────────────────────────────────────────
    $(document).ready(function () {
        if (!TailorAuth.guard('Authority')) return;
        registrationId = parseInt(TailorAuth.get('registrationId') || '0', 10);
        if (!registrationId) {
            toast('লগইন তথ্য পাওয়া যায়নি। দয়া করে পুনরায় লগইন করুন।', 'error');
            return;
        }
        // Pre-load page definitions once
        $.get('/api/subadmin/pages', function (res) {
            if (res.success) allPages = res.data || [];
        });
        refreshAll();
    });

    // ── Refresh ───────────────────────────────────────────────────────────────
    window.refreshAll = function () {
        $('#refreshIcon').addClass('fa-spin');
        loadSubAdmins().always(function () {
            $('#refreshIcon').removeClass('fa-spin');
        });
    };

    // ── Tab switching ─────────────────────────────────────────────────────────
    window.switchTab = function (tab) {
        $('.tab-btn').removeClass('active');
        $('.tab-panel').removeClass('active');
        $('#tab-btn-' + tab).addClass('active');
        $('#panel-' + tab).addClass('active');
    };

    // ════════════════════════════════════════════════════════
    //  LIST
    // ════════════════════════════════════════════════════════
    function loadSubAdmins() {
        var def = $.Deferred();
        $.get('/api/subadmin/by-authority/' + registrationId, function (res) {
            if (res.success) {
                allSubAdmins = res.data || [];
                filteredList = allSubAdmins.slice();
                renderStats();
                renderList(filteredList);
            } else {
                toast('ডেটা লোড ব্যর্থ: ' + res.message, 'error');
            }
            def.resolve();
        }).fail(function (xhr) {
            toast('সার্ভার ত্রুটি: ' + parseError(xhr), 'error');
            def.resolve();
        });
        return def.promise();
    }

    function renderStats() {
        var total    = allSubAdmins.length;
        var approved = allSubAdmins.filter(function (u) { return u.Validation === 'Valid'; }).length;
        var pending  = allSubAdmins.filter(function (u) { return u.Validation !== 'Valid'; }).length;
        var locked   = allSubAdmins.filter(function (u) { return u.IsLocked; }).length;
        $('#statTotal').text(total);
        $('#statApproved').text(approved);
        $('#statPending').text(pending);
        $('#statLocked').text(locked);
        $('#tb-list').text(total);
        $('#listCountBadge').text(total);
    }

    function renderList(list = []) {
        var $wrap = $('#listWrap').empty();
        if (!list.length) {
            $wrap.html(
                '<div class="empty-state"><i class="fas fa-user-plus"></i>' +
                '<p>কোনো Sub Authority নেই। <strong>নতুন তৈরি করুন</strong> ট্যাবে যান।</p></div>'
            );
            return;
        }

        var rows = list.map(function (u, i) {
            var name  = u.Name || u.UserName || '—';
            var desig = u.Designation || '—';
            var initial = name.charAt(0).toUpperCase();
            var date    = u.CreateDate ? new Date(u.CreateDate).toLocaleDateString('bn-BD') : '—';
            var validBadge = u.Validation === 'Valid'
                ? '<span class="badge-valid"><i class="fas fa-check me-1"></i>অ্যাপ্রুভড</span>'
                : '<span class="badge-invalid"><i class="fas fa-clock me-1"></i>পেন্ডিং</span>';
            var lockBadge = u.IsLocked
                ? '<span class="badge-locked ms-1"><i class="fas fa-lock me-1"></i>লকড</span>'
                : '';

            return '<tr>' +
                '<td style="color:#94a3b8;font-size:.78rem;">' + (i + 1) + '</td>' +
                '<td>' +
                    '<div class="d-flex align-items-center gap-2">' +
                        '<div class="u-avatar">' + esc(initial) + '</div>' +
                        '<div>' +
                            '<div style="font-weight:700;color:#1e293b;">' + esc(u.UserName || '—') + '</div>' +
                            '<div style="font-size:.73rem;color:#94a3b8;">' + esc(name) + '</div>' +
                        '</div>' +
                    '</div>' +
                '</td>' +
                '<td style="color:#475569;">' + esc(desig) + '</td>' +
                '<td>' + validBadge + lockBadge + '</td>' +
                '<td style="color:#64748b;font-size:.78rem;">' + date + '</td>' +
                '<td>' +
                    '<div class="d-flex flex-wrap gap-1">' +
                        '<button class="btn-act btn-act-access" onclick="openAccessDrawer(' + u.RegistrationID + ',\'' + esc(u.UserName || '') + '\')">' +
                            '<i class="fas fa-key"></i> এক্সেস' +
                        '</button>' +
                        (u.Validation === 'Valid'
                            ? '<button class="btn-act btn-act-lock" onclick="toggleApproval(' + u.RegistrationID + ',\'Invalid\')"><i class="fas fa-ban"></i></button>'
                            : '<button class="btn-act btn-act-approve" onclick="toggleApproval(' + u.RegistrationID + ',\'Valid\')"><i class="fas fa-check"></i></button>'
                        ) +
                        '<button class="btn-act btn-act-lock" onclick="toggleLock(' + u.RegistrationID + ',' + (u.IsLocked ? 'false' : 'true') + ')">' +
                            '<i class="fas fa-' + (u.IsLocked ? 'lock-open' : 'lock') + '"></i>' +
                        '</button>' +
                        '<button class="btn-act btn-act-delete" onclick="askDelete(' + u.RegistrationID + ',\'' + esc(u.UserName || '') + '\')"><i class="fas fa-trash-alt"></i></button>' +
                    '</div>' +
                '</td>' +
            '</tr>';
        }).join('');

        $wrap.html(
            '<div class="table-responsive">' +
                '<table class="sa-table"><thead><tr>' +
                    '<th>#</th><th>ইউজার</th><th>পদবী</th><th>স্ট্যাটাস</th><th>তারিখ</th><th>অ্যাকশন</th>' +
                '</tr></thead><tbody>' + rows + '</tbody></table>' +
            '</div>'
        );
    }

    window.filterList = function () {
        var q = ($('#listSearch').val() || '').toLowerCase().trim();
        filteredList = !q ? allSubAdmins.slice() : allSubAdmins.filter(function (u) {
            return (u.UserName    || '').toLowerCase().includes(q) ||
                   (u.Name        || '').toLowerCase().includes(q) ||
                   (u.Designation || '').toLowerCase().includes(q);
        });
        renderList(filteredList);
    };

    // ── Approval ──────────────────────────────────────────────────────────────
    window.toggleApproval = function (regId, validation) {
        $.ajax({
            url: '/api/subadmin/' + regId + '/approval', method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ validation: validation }),
            success: function (res) {
                if (res.success) { toast(res.message, 'success'); refreshAll(); }
                else toast(res.message, 'error');
            },
            error: function (xhr) { toast(parseError(xhr) || 'সার্ভার ত্রুটি', 'error'); }
        });
    };

    // ── Lock ──────────────────────────────────────────────────────────────────
    window.toggleLock = function (regId, isLocked) {
        $.ajax({
            url: '/api/subadmin/' + regId + '/lock', method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ isLocked: isLocked }),
            success: function (res) {
                if (res.success) { toast(res.message, 'success'); refreshAll(); }
                else toast(res.message, 'error');
            },
            error: function (xhr) { toast(parseError(xhr) || 'সার্ভার ত্রুটি', 'error'); }
        });
    };

    // ── Delete ────────────────────────────────────────────────────────────────
    window.askDelete = function (regId, userName) {
        pendingDelete = { id: regId, userName: userName };
        $('#deleteUserName').text(userName);
        new bootstrap.Modal(document.getElementById('deleteModal')).show();
    };

    window.confirmDelete = function () {
        if (!pendingDelete) return;
        bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
        $.ajax({
            url: '/api/subadmin/' + pendingDelete.id + '?authorityRegId=' + registrationId,
            method: 'DELETE',
            success: function (res) {
                if (res.success) { toast(res.message, 'success'); pendingDelete = null; refreshAll(); }
                else toast(res.message, 'error');
            },
            error: function (xhr) { toast(parseError(xhr) || 'সার্ভার ত্রুটি', 'error'); }
        });
    };

    // ════════════════════════════════════════════════════════
    //  ACCESS DRAWER — uses new SubAuthorityPageAccess table
    // ════════════════════════════════════════════════════════
    window.openAccessDrawer = function (regId, userName) {
        accessTarget = { registrationId: regId, userName: userName };
        $('#drawerTitle').text(esc(userName) + ' — পেইজ এক্সেস নির্ধারণ');
        $('#accessSaveStatus').hide();
        $('#drawerBody').html(
            '<div class="text-center py-5 text-muted">' +
            '<div class="spinner-border spinner-border-sm me-2"></div> লোড হচ্ছে...</div>'
        );
        $('#drawerBackdrop').show();
        $('#accessDrawer').addClass('open');
        $('body').css('overflow', 'hidden');

        function loadDrawer(pages) {
            $.get('/api/subadmin/page-access/' + regId, function (aRes) {
                renderAccessDrawer(pages, aRes.data || []);
            }).fail(function () {
                $('#drawerBody').html(
                    '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>লোড করতে সমস্যা হয়েছে।</p></div>'
                );
            });
        }

        if (allPages.length) {
            loadDrawer(allPages);
        } else {
            $.get('/api/subadmin/pages', function (pRes) {
                if (pRes.success) {
                    allPages = pRes.data || [];
                    loadDrawer(allPages);
                } else {
                    $('#drawerBody').html(
                        '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>পেইজ তালিকা লোড করতে সমস্যা হয়েছে।</p></div>'
                    );
                }
            }).fail(function () {
                $('#drawerBody').html(
                    '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>লোড করতে সমস্যা হয়েছে।</p></div>'
                );
            });
        }
    };

    window.closeAccessDrawer = function () {
        $('#accessDrawer').removeClass('open');
        $('#drawerBackdrop').hide();
        $('body').css('overflow', '');
        accessTarget = null;
    };

    function renderAccessDrawer(groups, enabledKeys) {
        var $body = $('#drawerBody').empty();

        if (!groups.length) {
            $body.html('<div class="empty-state"><i class="fas fa-unlink"></i><p>কোনো পেইজ পাওয়া যায়নি।</p></div>');
            return;
        }

        // Top bar
        var totalPages = groups.reduce(function (s, g) { return s + g.pages.length; }, 0);
        $body.append(
            '<div class="d-flex align-items-center gap-3 mb-3 p-2 bg-white rounded-3 border">' +
                '<span style="font-size:.82rem;font-weight:700;color:#475569;">' +
                    '<i class="fas fa-layer-group me-1 text-indigo"></i>মোট পেইজ: <strong>' + totalPages + '</strong>' +
                '</span>' +
                '<button class="ms-auto btn-act btn-act-access" style="font-size:.75rem;" onclick="selectAllPages(true)">সব নির্বাচন</button>' +
                '<button class="btn-act btn-act-delete" style="font-size:.75rem;" onclick="selectAllPages(false)">সব বাতিল</button>' +
                '<span id="selectedCountBadge" style="font-size:.78rem;font-weight:700;color:#6366f1;background:#ede9fe;padding:3px 10px;border-radius:20px;">0 নির্বাচিত</span>' +
            '</div>'
        );

        groups.forEach(function (group) {
            var pages       = group.pages || [];
            var checkedCount = pages.filter(function (p) { return enabledKeys.indexOf(p.key) !== -1; }).length;
            var allChecked   = checkedCount === pages.length && pages.length > 0;

            var $block  = $('<div class="module-block"></div>');
            var $header = $(
                '<div class="module-header' + (allChecked ? ' all-checked' : '') + '">' +
                    '<i class="fas fa-folder me-2" style="color:#6366f1;font-size:.8rem;"></i>' +
                    '<span>' + esc(group.groupName) + '</span>' +
                    '<span class="mod-count">' + checkedCount + ' / ' + pages.length + '</span>' +
                    '<button class="mod-select-all ms-2" onclick="toggleGroupAll(this)">সব</button>' +
                    '<i class="fas fa-chevron-down mod-toggle"></i>' +
                '</div>'
            );
            var $pages = $('<div class="module-pages"></div>');
            var $grid  = $('<div class="page-check-grid"></div>');

            pages.forEach(function (p) {
                var isChecked = enabledKeys.indexOf(p.key) !== -1;
                var chkId = 'chk-page-' + p.key;
                var $item = $(
                    '<label class="page-check-item' + (isChecked ? ' checked' : '') + '" for="' + chkId + '">' +
                        '<input type="checkbox" id="' + chkId + '" value="' + esc(p.key) + '"' + (isChecked ? ' checked' : '') + '>' +
                        '<div>' +
                            '<span class="page-label"><i class="fas ' + esc(p.icon) + ' me-1" style="font-size:.75rem;color:#6366f1;"></i>' + esc(p.label) + '</span>' +
                        '</div>' +
                    '</label>'
                );
                $item.find('input').on('change', function () {
                    $item.toggleClass('checked', this.checked);
                    updateGroupHeader($header, pages);
                    updateSelectedCount();
                });
                $grid.append($item);
            });

            $pages.append($grid);
            $block.append($header).append($pages);

            $header.on('click', function (e) {
                if ($(e.target).closest('button').length) return;
                $pages.toggleClass('open');
                $header.toggleClass('open');
            });

            if (checkedCount > 0) { $pages.addClass('open'); $header.addClass('open'); }
            $body.append($block);
        });

        updateSelectedCount();
    }

    function updateGroupHeader($header, pages) {
        var $block  = $header.closest('.module-block');
        var checked = $block.find('input[type=checkbox]:checked').length;
        $header.find('.mod-count').text(checked + ' / ' + pages.length);
        $header.toggleClass('all-checked', checked === pages.length && pages.length > 0);
    }

    window.toggleGroupAll = function (btn) {
        var $block  = $(btn).closest('.module-block');
        var $inputs = $block.find('input[type=checkbox]');
        var allChk  = $inputs.filter(':checked').length === $inputs.length;
        $inputs.each(function () {
            this.checked = !allChk;
            $(this).closest('.page-check-item').toggleClass('checked', this.checked);
        });
        var $header = $block.find('.module-header');
        $header.toggleClass('all-checked', !allChk);
        $header.find('.mod-count').text((!allChk ? $inputs.length : 0) + ' / ' + $inputs.length);
        updateSelectedCount();
    };

    window.selectAllPages = function (select) {
        $('#drawerBody input[type=checkbox]').each(function () {
            this.checked = select;
            $(this).closest('.page-check-item').toggleClass('checked', select);
        });
        $('#drawerBody .module-block').each(function () {
            var $inputs = $(this).find('input[type=checkbox]');
            var count   = select ? $inputs.length : 0;
            $(this).find('.mod-count').text(count + ' / ' + $inputs.length);
            $(this).find('.module-header').toggleClass('all-checked', select);
        });
        updateSelectedCount();
    };

    function updateSelectedCount() {
        var count = $('#drawerBody input[type=checkbox]:checked').length;
        $('#selectedCountBadge').text(count + ' নির্বাচিত');
    }

    window.saveAccess = function () {
        if (!accessTarget) return;
        var keys = [];
        $('#drawerBody input[type=checkbox]:checked').each(function () {
            keys.push(this.value);
        });

        $('#btnSaveAccess').prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-2"></i>সেভ হচ্ছে...');
        $.ajax({
            url: '/api/subadmin/page-access/' + accessTarget.registrationId,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ pageKeys: keys, authorityRegistrationID: registrationId }),
            success: function (res) {
                if (res.success) {
                    toast(res.message + ' (' + (res.totalAccess || 0) + ' পেইজ)', 'success');
                    $('#accessSaveStatus').text('✓ ' + (res.totalAccess || 0) + ' পেইজ সেভ হয়েছে').show();
                    setTimeout(function () { $('#accessSaveStatus').fadeOut(); }, 4000);
                } else {
                    toast(res.message, 'error');
                }
            },
            error: function (xhr) { toast(parseError(xhr) || 'সার্ভার ত্রুটি', 'error'); }
        }).always(function () {
            $('#btnSaveAccess').prop('disabled', false).html('<i class="fas fa-save me-2"></i>এক্সেস সেভ করুন');
        });
    };

    // ════════════════════════════════════════════════════════
    //  CREATE
    // ════════════════════════════════════════════════════════
    window.createSubAuthority = function () {
        var name     = $('#f-name').val().trim();
        var desig    = $('#f-designation').val().trim();
        var username = $('#f-username').val().trim();
        var email    = $('#f-email').val().trim();
        var pwd      = $('#f-password').val();
        var cpwd     = $('#f-confirm-password').val();
        var secAns   = $('#f-security-answer').val().trim();

        if (!name)        { toast('পূর্ণ নাম লিখুন', 'error');         return; }
        if (!desig)       { toast('পদবী লিখুন', 'error');               return; }
        if (!username)    { toast('ইউজারনেম লিখুন', 'error');           return; }
        if (!pwd)         { toast('পাসওয়ার্ড লিখুন', 'error');          return; }
        if (pwd !== cpwd) { toast('পাসওয়ার্ড মিলছে না', 'error');       return; }
        if (!secAns)      { toast('নিরাপত্তা উত্তর লিখুন', 'error');    return; }

        $('#btnCreate').prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-2"></i>তৈরি হচ্ছে...');

        $.ajax({
            url: '/api/subadmin/authority', method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                authorityRegistrationID: registrationId,
                name: name, designation: desig,
                userName: username, email: email,
                password: pwd, securityAnswer: secAns
            }),
            success: function (res) {
                if (res.success) {
                    toast(res.message, 'success');
                    resetCreateForm();
                    refreshAll();
                    switchTab('list');
                    var newRegId = res.data && res.data.registrationId;
                    if (newRegId) {
                        setTimeout(function () {
                            toast('এখন পেইজ এক্সেস নির্ধারণ করুন', 'info');
                            openAccessDrawer(newRegId, username);
                        }, 800);
                    }
                } else {
                    toast(res.message, 'error');
                }
            },
            error: function (xhr) { toast(parseError(xhr) || 'সার্ভার ত্রুটি', 'error'); }
        }).always(function () {
            $('#btnCreate').prop('disabled', false).html('<i class="fas fa-save me-2"></i>Sub Authority তৈরি করুন');
        });
    };

    window.resetCreateForm = function () {
        $('#f-name,#f-designation,#f-username,#f-email,#f-password,#f-confirm-password,#f-security-answer').val('');
    };

    window.togglePwd = function (id) {
        var $inp = $('#' + id);
        $inp.attr('type', $inp.attr('type') === 'password' ? 'text' : 'password');
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    function esc(s) {
        return String(s || '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function parseError(xhr) {
        try { return JSON.parse(xhr.responseText).message; } catch (e) { return null; }
    }

    function toast(msg, type) {
        type = type || 'info';
        var $t = $('<div class="toast-item ' + type + '">' + esc(msg) + '</div>');
        $('#toastWrap').append($t);
        setTimeout(function () { $t.fadeOut(400, function () { $t.remove(); }); }, 3800);
    }

}());
