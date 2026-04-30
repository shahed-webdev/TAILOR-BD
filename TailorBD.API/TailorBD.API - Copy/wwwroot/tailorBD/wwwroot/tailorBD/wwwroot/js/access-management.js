// Access Management - TailorBD Admin Panel
// Admin → Sub-Admin পেজ অ্যাক্সেস নিয়ন্ত্রণ
// DB: Link_Pages + Link_Users (LinkID based)
(function () {
    'use strict';

    var currentSubAdmin = null;  // { registrationId, name, username }
    var allModules = [];         // [{ModuleName, ModuleKey, Pages:[{LinkID,PageTitle,PageURL,...}]}]
    var enabledLinkIds = [];     // LinkID[] currently checked

    // ── Init ────────────────────────────────────────────────────────────────
    $(document).ready(function () {
        ensurePagesExist(); // Ensure all sidebar pages exist in Link_Pages first
        loadSubAdmins();
        loadAllModules();

        $('#subAdminSelect').on('change', function () {
            var regId = $(this).val();
            if (regId) {
                var $opt = $(this).find('option:selected');
                currentSubAdmin = {
                    registrationId: parseInt(regId, 10),
                    name:     $opt.data('name'),
                    username: $opt.data('username')
                };
                $('#selectedName').text(currentSubAdmin.name);
                $('#selectedUsername').text(currentSubAdmin.username);
                $('#subAdminInfo').show();
                loadSubAdminPermissions(regId);
            } else {
                currentSubAdmin = null;
                enabledLinkIds = [];
                $('#subAdminInfo').hide();
                clearPermissionsView();
            }
        });

        $('#searchPages').on('keyup', function () {
            filterPages($(this).val().toLowerCase());
        });
    });

    // ── Ensure all sidebar pages exist in Link_Pages ─────────────────────
    function ensurePagesExist() {
        var institutionId  = sessionStorage.getItem('institutionId');
        var registrationId = sessionStorage.getItem('registrationId');
        if (!institutionId || !registrationId) return;

        $.ajax({
            url: '/api/access/ensure-pages/' + institutionId + '/' + registrationId,
            method: 'POST',
            success: function (res) {
                if (res.success && (res.pagesInserted > 0 || res.linkUsersInserted > 0)) {
                    console.log('Pages synced:', res.message);
                    // Reload modules since new pages may have been added
                    loadAllModules();
                }
            },
            error: function () {
                console.warn('Could not ensure sidebar pages exist');
            }
        });
    }

    // ── Sub-Admin list লোড করুন ─────────────────────────────────────────
    function loadSubAdmins() {
        var institutionId  = sessionStorage.getItem('institutionId');
        var registrationId = sessionStorage.getItem('registrationId');

        if (!institutionId) {
            showAlert('error', 'Session expired. Please login again.');
            return;
        }

        $.get('/api/access/sub-admins?institutionId=' + institutionId + '&registrationId=' + registrationId,
            function (res) {
                if (!res.success || !res.data || !res.data.length) {
                    showAlert('info', 'কোনো সাব-অ্যাডমিন নেই। প্রথমে সাব-অ্যাডমিন তৈরি করুন।');
                    return;
                }

                var $sel = $('#subAdminSelect').empty()
                    .append('<option value="">-- Select Sub Admin --</option>');

                $.each(res.data, function (_, sa) {
                    var regId = sa.registrationID || sa.RegistrationID;
                    var name  = sa.name     || sa.Name     || '';
                    var uname = sa.userName || sa.UserName || '';
                    $sel.append(
                        $('<option></option>')
                            .val(regId)
                            .attr('data-name', name)
                            .attr('data-username', uname)
                            .text((name || uname) + (name && uname ? ' (' + uname + ')' : ''))
                    );
                });

                // ── Auto-select if subAdminId is in querystring ──
                var urlParams = new URLSearchParams(window.location.search);
                var preSelectId = urlParams.get('subAdminId');
                if (preSelectId) {
                    $sel.val(preSelectId);
                    if ($sel.val()) {
                        $sel.trigger('change');
                    }
                }
            })
            .fail(function (xhr) {
                showAlert('error', 'সাব-অ্যাডমিন লোড ব্যর্থ হয়েছে (' + xhr.status + ')');
            });
    }

    // ── Admin-এর নিজস্ব accessible পেজগুলো লোড (সেগুলোই Sub-Admin কে দেওয়া যাবে) ─
    function loadAllModules() {
        var institutionId  = sessionStorage.getItem('institutionId');
        var registrationId = sessionStorage.getItem('registrationId');

        $.get('/api/access/modules/' + institutionId + '/' + registrationId, function (res) {
            if (res.success && res.data && res.data.length) {
                allModules = res.data;
            } else {
                showAlert('warning', 'কোনো পেইজ পাওয়া যায়নি। Admin-এর নিজেরアクセス নেই।');
            }
        }).fail(function () {
            allModules = [];
            showAlert('error', 'পেইজ লিস্ট লোড ব্যর্থ হয়েছে');
        });
    }

    // ── Sub-Admin-এর বর্তমান permission লোড ─────────────────────────────
    function loadSubAdminPermissions(subRegId) {
        var institutionId = sessionStorage.getItem('institutionId');

        $.get('/api/access/permissions/' + institutionId + '/' + subRegId, function (res) {
            enabledLinkIds = [];
            if (res.success && res.data && res.data.length) {
                $.each(res.data, function (_, p) {
                    var lid = p.linkID || p.LinkID;
                    if (lid) enabledLinkIds.push(parseInt(lid, 10));
                });
            }
            renderPermissionsTree();
            updateAccessCount();
        }).fail(function () {
            enabledLinkIds = [];
            renderPermissionsTree();
            updateAccessCount();
        });
    }

    // ── Permissions tree render ───────────────────────────────────────────
    function renderPermissionsTree() {
        if (!allModules.length) {
            $('#permissionsTree').html(
                '<div class="text-center py-4 text-muted">' +
                '<i class="fas fa-spinner fa-spin fa-2x"></i>' +
                '<p class="mt-2">পেইজ লোড হচ্ছে...</p></div>'
            );
            setTimeout(function () {
                if (!allModules.length) loadAllModules();
                else renderPermissionsTree();
            }, 900);
            return;
        }

        var html = '';
        $.each(allModules, function (_, mod) {
            var mKey  = (mod.moduleKey || mod.ModuleKey || '').toLowerCase().replace(/\s+/g, '-') || 'mod' +_;
            var mName = mod.moduleName || mod.ModuleName || 'Other';
            var pages = mod.pages || mod.Pages || [];

            var selCnt = 0;
            $.each(pages, function (_, p) {
                var lid = parseInt(p.linkID || p.LinkID, 10);
                if (enabledLinkIds.indexOf(lid) !== -1) selCnt++;
            });
            var total     = pages.length;
            var allChk    = total > 0 && selCnt === total;
            var icon      = MODULE_ICONS[mKey] || MODULE_ICONS[(mKey.split('-')[0])] || 'fa-folder-open';

            html += '<div class="module-card" data-module="' + escAttr(mKey) + '">' +
                '<div class="module-header" onclick="AdminAccess.toggleModule(this)">' +
                    '<div>' +
                        '<i class="fas ' + icon + ' me-2"></i>' +
                        '<h5 class="d-inline">' + escHtml(mName) + '</h5>' +
                        '<span class="badge bg-light text-dark ms-2">' + selCnt + '/' + total + '</span>' +
                    '</div>' +
                    '<div class="module-actions" onclick="event.stopPropagation();">' +
                        '<div class="form-check form-switch">' +
                            '<input class="form-check-input module-switch" type="checkbox"' +
                                (allChk ? ' checked' : '') +
                                ' data-group="' + escAttr(mKey) + '"' +
                                ' onchange="AdminAccess.toggleGroup(\'' + escAttr(mKey) + '\',this.checked)">' +
                        '</div>' +
                        '<i class="fas fa-chevron-down"></i>' +
                    '</div>' +
                '</div>' +
                '<div class="module-body">';

            $.each(pages, function (_, page) {
                var lid     = parseInt(page.linkID || page.LinkID, 10);
                var title   = page.pageTitle  || page.PageTitle  || 'Unknown';
                var url     = page.pageURL    || page.PageURL    || '';
                var checked = enabledLinkIds.indexOf(lid) !== -1;

                html += '<div class="page-item ' + (checked ? 'selected' : '') + '" data-link-id="' + lid + '">' +
                    '<div class="page-info">' +
                        '<div class="page-icon"><i class="fas fa-file-alt"></i></div>' +
                        '<div>' +
                            '<strong>' + escHtml(title) + '</strong>' +
                            '<br><small class="text-muted">' + escHtml(url) + '</small>' +
                        '</div>' +
                    '</div>' +
                    '<div class="form-check form-switch">' +
                        '<input class="form-check-input permission-switch page-switch" type="checkbox"' +
                            (checked ? ' checked' : '') +
                            ' data-link-id="' + lid + '"' +
                            ' data-group="' + escAttr(mKey) + '"' +
                            ' onchange="AdminAccess.togglePage(' + lid + ',\'' + escAttr(mKey) + '\',this.checked)">' +
                    '</div>' +
                '</div>';
            });

            html += '</div></div>';
        });

        $('#permissionsTree').html(html || '<div class="text-center py-4 text-muted">কোনো পেইজ পাওয়া যায়নি</div>');
    }

    // Module icons mapping
    var MODULE_ICONS = {
        'basic':      'fa-cog',
        'order':      'fa-shopping-cart',
        'customer':   'fa-users',
        'fabric':     'fa-store',
        'accounts':   'fa-calculator',
        'account':    'fa-calculator',
        'reports':    'fa-chart-line',
        'report':     'fa-chart-line',
        'message':    'fa-sms',
        'delivery':   'fa-truck',
        'other':      'fa-folder-open'
    };

    // ── Public API ─────────────────────────────────────────────────────────
    window.AdminAccess = {};

    AdminAccess.togglePage = function (lid, groupKey, checked) {
        lid = parseInt(lid, 10);
        var idx = enabledLinkIds.indexOf(lid);
        if (checked && idx === -1) enabledLinkIds.push(lid);
        if (!checked && idx !== -1) enabledLinkIds.splice(idx, 1);
        $('.page-item[data-link-id="' + lid + '"]').toggleClass('selected', checked);
        updateGroupBadge(groupKey);
        updateAccessCount();
    };

    AdminAccess.toggleGroup = function (groupKey, checked) {
        $('.page-switch[data-group="' + groupKey + '"]').each(function () {
            var lid = parseInt($(this).data('link-id'), 10);
            $(this).prop('checked', checked);
            $('.page-item[data-link-id="' + lid + '"]').toggleClass('selected', checked);
            var idx = enabledLinkIds.indexOf(lid);
            if (checked && idx === -1) enabledLinkIds.push(lid);
            if (!checked && idx !== -1) enabledLinkIds.splice(idx, 1);
        });
        updateGroupBadge(groupKey);
        updateAccessCount();
    };

    AdminAccess.toggleModule = function (headerEl) {
        var $h = $(headerEl);
        $h.next('.module-body').toggleClass('show');
        $h.find('.fa-chevron-down, .fa-chevron-up').toggleClass('fa-chevron-down fa-chevron-up');
    };

    function updateGroupBadge(groupKey) {
        var $c   = $('.module-card[data-module="' + groupKey + '"]');
        var tot  = $c.find('.page-switch').length;
        var sel  = $c.find('.page-switch:checked').length;
        $c.find('.module-header .badge').text(sel + '/' + tot);
        $c.find('.module-switch').prop('checked', sel === tot && tot > 0);
    }

    function updateAccessCount() {
        $('#totalAccessCount').text(enabledLinkIds.length);
    }

    // ── Quick templates ────────────────────────────────────────────────────
    window.applyTemplate = function (tpl) {
        if (!currentSubAdmin) { showAlert('warning', 'প্রথমে একটি সাব-অ্যাডমিন নির্বাচন করুন'); return; }

        var allIds = [];
        $.each(allModules, function (_, mod) {
            $.each(mod.pages || mod.Pages || [], function (_, p) {
                allIds.push(parseInt(p.linkID || p.LinkID, 10));
            });
        });

        var tplModules = {
            full:       null,           // null = সব
            manager:    ['order', 'customer', 'delivery'],
            accountant: ['accounts', 'account', 'reports', 'report'],
            viewer:     ['reports', 'report']
        };

        if (tpl === 'full' || tplModules[tpl] === null) {
            enabledLinkIds = allIds.slice();
        } else {
            enabledLinkIds = [];
            var allowed = tplModules[tpl] || [];
            $.each(allModules, function (_, mod) {
                var key = (mod.moduleKey || mod.ModuleKey || '').toLowerCase();
                if (allowed.indexOf(key) !== -1) {
                    $.each(mod.pages || mod.Pages || [], function (_, p) {
                        enabledLinkIds.push(parseInt(p.linkID || p.LinkID, 10));
                    });
                }
            });
        }

        renderPermissionsTree();
        updateAccessCount();
        showAlert('success', 'টেমপ্লেট প্রয়োগ হয়েছে');
    };

    window.selectAllPages = function () {
        if (!currentSubAdmin) { showAlert('warning', 'প্রথমে একটি সাব-অ্যাডমিন নির্বাচন করুন'); return; }
        enabledLinkIds = [];
        $.each(allModules, function (_, mod) {
            $.each(mod.pages || mod.Pages || [], function (_, p) {
                enabledLinkIds.push(parseInt(p.linkID || p.LinkID, 10));
            });
        });
        renderPermissionsTree();
        updateAccessCount();
    };

    window.deselectAllPages = function () {
        if (!currentSubAdmin) { showAlert('warning', 'প্রথমে একটি সাব-অ্যাডমিন নির্বাচন করুন'); return; }
        enabledLinkIds = [];
        renderPermissionsTree();
        updateAccessCount();
    };

    // ── Save permissions ───────────────────────────────────────────────────
    window.savePermissions = function () {
        if (!currentSubAdmin) { showAlert('warning', 'প্রথমে একটি সাব-অ্যাডমিন নির্বাচন করুন'); return; }

        var institutionId = parseInt(sessionStorage.getItem('institutionId') || '0', 10);
        var payload = {
            institutionID:  institutionId,
            registrationID: currentSubAdmin.registrationId,
            userName:       currentSubAdmin.username,
            linkIDs:        enabledLinkIds
        };

        var $btn = $('[onclick="savePermissions()"]');
        var orig = $btn.html();
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span>সংরক্ষণ হচ্ছে...');

        $.ajax({
            url: '/api/access/permissions',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function (res) {
                $btn.prop('disabled', false).html(orig);
                if (res.success) {
                    showAlert('success', 'পেইজ অ্যাক্সেস সফলভাবে সংরক্ষিত হয়েছে (' + enabledLinkIds.length + ' টি)');
                } else {
                    showAlert('error', res.message || 'সংরক্ষণ ব্যর্থ হয়েছে');
                }
            },
            error: function (xhr) {
                $btn.prop('disabled', false).html(orig);
                showAlert('error', (xhr.responseJSON && xhr.responseJSON.message) || 'সংরক্ষণ ব্যর্থ হয়েছে');
            }
        });
    };

    // ── Search ────────────────────────────────────────────────────────────
    function filterPages(term) {
        if (!term) { $('.page-item, .module-card').show(); return; }
        $('.page-item').each(function () {
            var match = $(this).text().toLowerCase().indexOf(term) !== -1;
            $(this).toggle(match);
            if (match) { $(this).closest('.module-card').show(); $(this).closest('.module-body').addClass('show'); }
        });
        $('.module-card').each(function () {
            if (!$(this).find('.page-item:visible').length) $(this).hide();
        });
    }

    function clearPermissionsView() {
        $('#permissionsTree').html(
            '<div class="text-center py-5 text-muted">' +
            '<i class="fas fa-user-lock fa-3x mb-3 d-block"></i>' +
            '<p>অনুমতি পরিচালনা করতে একটি সাব-অ্যাডমিন নির্বাচন করুন</p>' +
            '</div>'
        );
    }

    // ── Alert ─────────────────────────────────────────────────────────────
    function showAlert(type, msg) {
        var cls  = {success:'alert-success', error:'alert-danger', warning:'alert-warning', info:'alert-info'}[type] || 'alert-info';
        var icon = {success:'check-circle', error:'exclamation-circle', warning:'exclamation-triangle', info:'info-circle'}[type] || 'info-circle';
        var $a = $('<div class="alert ' + cls + ' alert-dismissible fade show" role="alert"><i class="fas fa-' + icon + ' me-2"></i>' + msg + '<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>');
        $('#alertContainer').html($a);
        setTimeout(function () { $a.fadeOut(400, function () { $(this).remove(); }); }, 5000);
    }

    function escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
    function escAttr(s) { return String(s||'').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

})();
