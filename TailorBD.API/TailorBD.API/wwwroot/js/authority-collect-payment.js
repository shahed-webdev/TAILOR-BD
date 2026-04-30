(function () {
    'use strict';

    let allInstitutions = [];
    let dueFilter       = '';
    let statusFilter    = '';
    let currentView     = 'card';
    let currentInsId    = 0;
    let currentInvList  = [];
    let _loggedInName   = '';

    // ── Init ──────────────────────────────────────────────────────────────────
    $(document).ready(function () {
        if (!TailorAuth.guard('Authority')) return;
        TailorAuth.guardSubPage('collect-payment');
        loadSidebarProfile();
        loadData();
    });

    function loadSidebarProfile() {
        const username = sessionStorage.getItem('username');
        if (!username) return;
        $.get('/api/profile/by-username/' + encodeURIComponent(username), function (res) {
            if (!res.success || !res.data) return;
            const d = res.data;
            _loggedInName = d.name || username || 'Authority';
            const avatarUrl = (d.image && d.image.length > 0)
                ? '/api/profile/' + d.registrationID + '/image'
                : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(d.name || 'A') + '&background=6366f1&color=fff&size=100&bold=true';
            $('#sidebarAvatar').attr('src', avatarUrl);
            $('#sidebarName').text(d.name || 'Authority');
        });
    }

    // ── Load data ─────────────────────────────────────────────────────────────
    window.loadData = function () {
        $('#refreshIcon').addClass('fa-spin');
        $('#insCardGrid').html('<div class="section-card text-center py-5"><div class="spinner-border text-primary me-2"></div> লোড হচ্ছে...</div>');
        $('#insTbody').html('<tr><td colspan="9" class="text-center py-4"><div class="spinner-border spinner-border-sm me-2"></div>লোড হচ্ছে...</td></tr>');

        $.get('/api/invoice/institutions', function (res) {
            $('#refreshIcon').removeClass('fa-spin');
            if (!res.success) { toast('ডেটা লোড ব্যর্থ', 'error'); return; }
            allInstitutions = res.data || [];
            updateStats();
            applyFilters();
        }).fail(function () {
            $('#refreshIcon').removeClass('fa-spin');
            toast('সার্ভার সংযোগ ব্যর্থ', 'error');
        });
    };

    // ── Stats ─────────────────────────────────────────────────────────────────
    function updateStats() {
        var total    = allInstitutions.length;
        var dueIns   = allInstitutions.filter(function (i) { return parseFloat(i.totalDue || 0) > 0; }).length;
        var clearIns = total - dueIns;
        var totalDue = allInstitutions.reduce(function (s, i) { return s + parseFloat(i.totalDue || 0); }, 0);
        var dueInv   = allInstitutions.reduce(function (s, i) { return s + parseInt(i.totalInvoices || 0); }, 0);
        $('#statTotal').text(total);
        $('#statDueIns').text(dueIns);
        $('#statDueInv').text(dueInv);
        $('#statTotalDue').text(fmtMoney(totalDue));
        $('#statClearIns').text(clearIns);
    }

    // ── Filters ───────────────────────────────────────────────────────────────
    window.setDueFilter = function (val, btn) {
        dueFilter = val;
        $('.filter-btn').removeClass('active');
        $(btn).addClass('active');
        applyFilters();
    };
    window.setStatusFilter = function (val, btn) {
        statusFilter = val;
        $('.filter-btn2').removeClass('active');
        $(btn).addClass('active');
        applyFilters();
    };
    window.applyFilters = function () {
        var search = ($('#searchInput').val() || '').toLowerCase().trim();
        var sort   = $('#sortSelect').val();
        var filtered = allInstitutions.filter(function (ins) {
            var matchSearch = !search ||
                (ins.institutionName || '').toLowerCase().includes(search) ||
                (ins.phone || '').toLowerCase().includes(search) ||
                (ins.userName || '').toLowerCase().includes(search);
            var due = parseFloat(ins.totalDue || 0);
            var matchDue = dueFilter === 'due' ? due > 0 : dueFilter === 'clear' ? due <= 0 : true;
            var matchStatus = !statusFilter || ins.validation === statusFilter;
            return matchSearch && matchDue && matchStatus;
        });
        filtered = filtered.slice().sort(function (a, b) {
            if (sort === 'due_desc')   return parseFloat(b.totalDue || 0) - parseFloat(a.totalDue || 0);
            if (sort === 'due_asc')    return parseFloat(a.totalDue || 0) - parseFloat(b.totalDue || 0);
            if (sort === 'name_asc')   return (a.institutionName || '').localeCompare(b.institutionName || '');
            if (sort === 'expire_asc') {
                var da = a.expire_Date ? new Date(a.expire_Date) : new Date('9999-12-31');
                var db = b.expire_Date ? new Date(b.expire_Date) : new Date('9999-12-31');
                return da - db;
            }
            return 0;
        });
        $('#resultInfo').html('<i class="fas fa-list me-1"></i><strong>' + filtered.length + '</strong> টি প্রতিষ্ঠান পাওয়া গেছে');
        if (currentView === 'card') renderCards(filtered);
        else renderTable(filtered);
    };

    // ── View toggle ───────────────────────────────────────────────────────────
    window.setView = function (view) {
        currentView = view;
        if (view === 'card') {
            $('#cardView').show(); $('#tableView').hide();
            $('#btnCardView').addClass('active'); $('#btnTableView').removeClass('active');
        } else {
            $('#cardView').hide(); $('#tableView').show();
            $('#btnCardView').removeClass('active'); $('#btnTableView').addClass('active');
        }
        applyFilters();
    };

    // ── Render Cards ──────────────────────────────────────────────────────────
    function renderCards(list) {
        var $grid = $('#insCardGrid').empty();
        if (!list.length) {
            $grid.html('<div class="empty-state" style="background:#fff;border-radius:14px;padding:60px 20px;text-align:center;grid-column:1/-1;"><i class="fas fa-store-slash" style="font-size:3rem;opacity:.3;display:block;margin-bottom:14px;"></i><h5 style="color:#64748b;">কোনো প্রতিষ্ঠান পাওয়া যায়নি</h5><p style="color:#94a3b8;font-size:.85rem;">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন</p></div>');
            return;
        }
        list.forEach(function (ins) {
            var due      = parseFloat(ins.totalDue || 0);
            var hasDue   = due > 0;
            var expiry   = ins.expire_Date ? new Date(ins.expire_Date) : null;
            var now      = new Date();
            var diff     = expiry ? Math.ceil((expiry - now) / 86400000) : null;
            var expClass = '', expTag = '';
            if (expiry) {
                if (diff < 0)        { expClass = 'text-danger';  expTag = '<span class="badge-expiring ms-1">মেয়াদ শেষ</span>'; }
                else if (diff <= 15) { expClass = 'text-warning'; expTag = '<span class="badge-expiring ms-1">' + diff + 'd</span>'; }
            }
            var statusBadge = ins.validation === 'Valid' ? '<span class="badge-valid">Active</span>' : '<span class="badge-invalid">Inactive</span>';
            var initial = (ins.institutionName || '?').charAt(0).toUpperCase();
            $grid.append(
                '<div class="ins-card ' + (hasDue ? 'has-due' : 'all-clear') + '">' +
                    '<div class="ins-card-header">' +
                        '<div class="ins-avatar">' + initial + '</div>' +
                        '<div style="flex:1;min-width:0;"><div class="ins-name">' + esc(ins.institutionName) + '</div><div class="ins-user"><i class="fas fa-user me-1"></i>' + esc(ins.userName) + '</div></div>' +
                        '<div class="ms-auto">' + statusBadge + '</div>' +
                    '</div>' +
                    '<div class="ins-card-body">' +
                        '<div class="ins-meta-row"><span><i class="fas fa-phone"></i>' + esc(ins.phone || '—') + '</span><span><i class="fas fa-box-open"></i>' + esc(ins.packageName || '—') + '</span></div>' +
                        '<div class="ins-meta-row"><span class="' + expClass + '"><i class="fas fa-calendar-alt"></i>' + (expiry ? fmtDate(expiry) : '—') + expTag + '</span><span><i class="fas fa-file-invoice me-1"></i>' + (ins.totalInvoices || 0) + ' Invoice</span></div>' +
                        '<div class="d-flex align-items-baseline justify-content-between mt-2 pt-2" style="border-top:1px solid #f1f5f9;">' +
                            '<div><div style="font-size:.72rem;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-bottom:1px;">মোট বকেয়া</div>' +
                            '<div class="due-amount" style="' + (hasDue ? '' : 'color:#10b981;') + '">৳ ' + fmtMoney(due) + (hasDue ? '' : '<small>পরিষ্কার</small>') + '</div></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="ins-card-footer">' +
                        (hasDue ? '<button class="btn-sm-act btn-collect" onclick="openCollectModal(' + ins.institutionId + ',\'' + esc(ins.institutionName) + '\')"><i class="fas fa-hand-holding-usd"></i> পেমেন্ট কালেক্ট</button>' : '') +
                        '<button class="btn-sm-act btn-renew-sm" onclick="doRenew(' + ins.institutionId + ',\'' + esc(ins.institutionName) + '\')"><i class="fas fa-redo"></i> Renew</button>' +
                        '<button class="btn-sm-act btn-view-sm" onclick="viewInvoices(' + ins.institutionId + ')"><i class="fas fa-eye"></i> Invoice</button>' +
                    '</div>' +
                '</div>'
            );
        });
    }

    // ── Render Table ──────────────────────────────────────────────────────────
    function renderTable(list) {
        var $tbody = $('#insTbody').empty();
        if (!list.length) { $tbody.html('<tr><td colspan="9" class="text-center py-4 text-muted">কোনো প্রতিষ্ঠান পাওয়া যায়নি</td></tr>'); return; }
        list.forEach(function (ins, i) {
            var due      = parseFloat(ins.totalDue || 0);
            var hasDue   = due > 0;
            var expiry   = ins.expire_Date ? new Date(ins.expire_Date) : null;
            var now      = new Date();
            var diff     = expiry ? Math.ceil((expiry - now) / 86400000) : null;
            var expStr   = expiry ? fmtDate(expiry) : '—';
            var expStyle = diff !== null && diff < 0 ? 'color:#ef4444;font-weight:600;' : diff !== null && diff <= 15 ? 'color:#f97316;font-weight:600;' : '';
            var statusBadge = ins.validation === 'Valid' ? '<span class="badge-valid">Active</span>' : '<span class="badge-invalid">Inactive</span>';
            $tbody.append(
                '<tr>' +
                '<td style="color:#94a3b8;">' + (i+1) + '</td>' +
                '<td><div style="font-weight:600;color:#1e293b;">' + esc(ins.institutionName) + '</div><div style="font-size:.75rem;color:#94a3b8;">' + esc(ins.userName) + '</div></td>' +
                '<td>' + esc(ins.phone || '—') + '</td>' +
                '<td>' + esc(ins.packageName || '—') + '</td>' +
                '<td style="' + expStyle + '">' + expStr + '</td>' +
                '<td>' + (ins.totalInvoices || 0) + '</td>' +
                '<td><span style="font-weight:700;color:' + (hasDue ? '#ef4444' : '#10b981') + ';">৳ ' + fmtMoney(due) + '</span></td>' +
                '<td>' + statusBadge + '</td>' +
                '<td><div class="d-flex gap-1 flex-wrap">' +
                    (hasDue ? '<button class="btn-sm-act btn-collect" style="padding:4px 10px;" onclick="openCollectModal(' + ins.institutionId + ',\'' + esc(ins.institutionName) + '\')"><i class="fas fa-hand-holding-usd"></i></button>' : '') +
                    '<button class="btn-sm-act btn-renew-sm" style="padding:4px 10px;" onclick="doRenew(' + ins.institutionId + ',\'' + esc(ins.institutionName) + '\')"><i class="fas fa-redo"></i></button>' +
                    '<button class="btn-sm-act btn-view-sm" style="padding:4px 10px;" onclick="viewInvoices(' + ins.institutionId + ')"><i class="fas fa-eye"></i></button>' +
                '</div></td>' +
                '</tr>'
            );
        });
    }

    // ── Collect Payment Modal ─────────────────────────────────────────────────
    window.openCollectModal = function (insId, insName) {
        currentInsId   = insId;
        currentInvList = [];
        $('#collectInsName').text(insName);
        $('#modalTotalDue').text('৳ 0');
        $('#modalTotalInv').text('0');
        $('#modalPaidInv').text('0');
        $('#payFieldsPanel').hide();
        $('#submitPayBtn').prop('disabled', true);
        $('#dueInvList').html('<div class="text-center py-3"><div class="spinner-border spinner-border-sm text-success"></div> লোড হচ্ছে...</div>');
        $('#bulkCollectedBy').val(_loggedInName || sessionStorage.getItem('username') || '');
        $('#bulkDiscount').val('0');

        new bootstrap.Modal(document.getElementById('collectModal')).show();

        $.get('/api/invoice/list?institutionId=' + insId + '&pageSize=100', function (res) {
            currentInvList = res.data || [];
            renderCollectModal();
        }).fail(function () {
            $('#dueInvList').html('<div class="text-center text-danger py-3">Invoice লোড ব্যর্থ</div>');
        });
    };

    function renderCollectModal() {
        var dueInvs  = currentInvList.filter(function (inv) { return inv.paymentStatus !== 'Paid'; });
        var paidInvs = currentInvList.filter(function (inv) { return inv.paymentStatus === 'Paid'; });
        var totalDue = dueInvs.reduce(function (s, inv) {
            return s + Math.max(0,
                parseFloat(inv.totalAmount || 0)
                - parseFloat(inv.paidAmount || 0)
                - parseFloat(inv.discount  || 0)
            );
        }, 0);

        $('#modalTotalDue').text('৳ ' + fmtMoney(totalDue));
        $('#modalTotalInv').text(currentInvList.length);
        $('#modalPaidInv').text(paidInvs.length);

        var $list = $('#dueInvList').empty();
        $('#payFieldsPanel').hide();
        $('#submitPayBtn').prop('disabled', true);

        if (!dueInvs.length) {
            $list.html(
                '<div class="text-center py-4" style="color:#10b981;">' +
                '<i class="fas fa-check-circle" style="font-size:2rem;display:block;margin-bottom:8px;"></i>' +
                '<strong>সব Invoice পরিশোধিত!</strong>' +
                '<div style="font-size:.82rem;color:#64748b;margin-top:4px;">এই প্রতিষ্ঠানের কোনো বকেয়া নেই।</div>' +
                '</div>'
            );
            return;
        }

        // Select-All bar
        $list.html(
            '<div class="sel-all-bar">' +
                '<input type="checkbox" id="chkSelectAll" onchange="toggleSelectAll(this)">' +
                '<label for="chkSelectAll" style="cursor:pointer;margin:0;">সব নির্বাচন করুন</label>' +
                '<span class="ms-auto" style="font-size:.75rem;color:#94a3b8;">' + dueInvs.length + ' টি বকেয়া Invoice</span>' +
            '</div>'
        );

        // Invoice rows
        dueInvs.forEach(function (inv) {
            var remaining = Math.max(0,
                parseFloat(inv.totalAmount || 0)
                - parseFloat(inv.paidAmount || 0)
                - parseFloat(inv.discount  || 0)
            );
            var statusBadge = inv.paymentStatus === 'Partial'
                ? '<span class="badge-partial" style="font-size:.68rem;">Partial</span>'
                : '<span class="badge-due" style="font-size:.68rem;">Due</span>';

            $list.append(
                '<div class="inv-select-row" id="invRow_' + inv.invoiceID + '">' +
                    '<input type="checkbox" class="inv-chk inv-select-chk"' +
                           ' id="chk_' + inv.invoiceID + '"' +
                           ' data-inv-id="' + inv.invoiceID + '"' +
                           ' data-remaining="' + remaining + '"' +
                           ' onchange="onInvCheckChange(this)">' +
                    '<div class="inv-info">' +
                        '<div class="inv-title">Invoice #' + inv.invoiceID + ' &nbsp;' + statusBadge + '</div>' +
                        '<div class="inv-sub">' + esc(inv.invoice_For || '') + (inv.issuDate ? ' · ' + fmtDate(new Date(inv.issuDate)) : '') + '</div>' +
                        '<div class="inv-sub">মোট: ৳' + fmtMoney(parseFloat(inv.totalAmount || 0)) + ' &nbsp;|&nbsp; পেইড: <span style="color:#10b981;">৳' + fmtMoney(parseFloat(inv.paidAmount || 0)) + '</span></div>' +
                    '</div>' +
                    '<div class="inv-due-lbl">৳ ' + fmtMoney(remaining) + '</div>' +
                    '<div class="inv-amt-inp">' +
                        '<input type="number" class="form-control form-control-sm qp-amount"' +
                               ' id="amt_' + inv.invoiceID + '"' +
                               ' data-inv-id="' + inv.invoiceID + '"' +
                               ' data-remaining="' + remaining + '"' +
                               ' min="0" max="' + remaining + '" step="0.01"' +
                               ' value="' + remaining.toFixed(2) + '"' +
                               ' placeholder="৳" disabled' +
                               ' oninput="recalcPayTotal()">' +
                    '</div>' +
                '</div>'
            );
        });
    }

    // ── Checkbox selection ────────────────────────────────────────────────────
    window.onInvCheckChange = function (chk) {
        var id   = $(chk).data('inv-id');
        var $row = $('#invRow_' + id);
        var $inp = $('#amt_' + id);
        if (chk.checked) {
            $row.addClass('selected');
            $inp.prop('disabled', false).focus().select();
        } else {
            $row.removeClass('selected');
            $inp.prop('disabled', true);
        }
        var total   = $('.inv-select-chk').length;
        var checked = $('.inv-select-chk:checked').length;
        $('#chkSelectAll').prop('indeterminate', checked > 0 && checked < total);
        $('#chkSelectAll').prop('checked', checked === total && total > 0);
        updatePayPanel();
    };

    window.toggleSelectAll = function (chkAll) {
        $('.inv-select-chk').each(function () {
            this.checked = chkAll.checked;
            var id = $(this).data('inv-id');
            if (chkAll.checked) {
                $('#invRow_' + id).addClass('selected');
                $('#amt_' + id).prop('disabled', false);
            } else {
                $('#invRow_' + id).removeClass('selected');
                $('#amt_' + id).prop('disabled', true);
            }
        });
        updatePayPanel();
    };

    function updatePayPanel() {
        var checked = $('.inv-select-chk:checked').length;
        $('#selectedCount').text(checked);
        if (checked > 0) {
            $('#payFieldsPanel').show();
            $('#submitPayBtn').prop('disabled', false);
        } else {
            $('#payFieldsPanel').hide();
            $('#submitPayBtn').prop('disabled', true);
        }
        recalcPayTotal();
    }

    window.fillFullPayment = function () {
        $('.inv-select-chk:checked').each(function () {
            var id = $(this).data('inv-id');
            $('#amt_' + id).val(parseFloat($('#amt_' + id).data('remaining')).toFixed(2));
        });
        recalcPayTotal();
    };

    window.recalcPayTotal = function () {
        var total    = 0;
        var discount = parseFloat($('#bulkDiscount').val()) || 0;
        $('.inv-select-chk:checked').each(function () {
            total += parseFloat($('#amt_' + $(this).data('inv-id')).val()) || 0;
        });
        $('#quickPayTotal').text('৳ ' + fmtMoney(Math.max(0, total - discount)));
    };

    // ── Submit payment ────────────────────────────────────────────────────────
    window.submitBulkPayment = function () {
        var payments = [];
        var totalPaying = 0;

        $('.inv-select-chk:checked').each(function () {
            var id  = $(this).data('inv-id');
            var amt = parseFloat($('#amt_' + id).val()) || 0;
            totalPaying += amt;
            payments.push({ invoiceId: parseInt(id), addedAmount: amt, _share: amt });
        });

        if (!payments.length) {
            toast('কোনো Invoice নির্বাচন করা হয়নি বা পরিমাণ শূন্য', 'error');
            return;
        }

        var collectedBy   = $('#bulkCollectedBy').val().trim() || _loggedInName || sessionStorage.getItem('username') || 'Authority';
        var paymentMethod = $('#bulkPaymentMethod').val() || 'Cash';
        var totalDiscount = parseFloat($('#bulkDiscount').val()) || 0;
        var paidCount     = payments.length;

        // Distribute discount proportionally across invoices
        payments.forEach(function (p) {
            var share    = totalPaying > 0 ? (p._share / totalPaying) : (1 / payments.length);
            p.discount   = parseFloat((totalDiscount * share).toFixed(2));
            // Subtract discount from cash amount
            p.addedAmount = Math.max(0, parseFloat((p.addedAmount - p.discount).toFixed(2)));
            delete p._share;
        });

        var $btn = $('#submitPayBtn').prop('disabled', true)
            .html('<div class="spinner-border spinner-border-sm me-2"></div>সেভ হচ্ছে...');

        // Single request — one transaction, no deadlock
        $.ajax({
            url: '/api/invoice/bulk-payment',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                payments:      payments,
                collectedBy:   collectedBy,
                paymentMethod: paymentMethod
            }),
            success: function (res) {
                if (res.success) {
                    toast(paidCount + ' টি Invoice পেমেন্ট সফল হয়েছে ✅', 'success');
                    bootstrap.Modal.getInstance(document.getElementById('collectModal')).hide();
                    loadData();
                } else {
                    toast('পেমেন্ট ব্যর্থ: ' + (res.message || 'সার্ভার ত্রুটি'), 'error');
                }
            },
            error: function (xhr) {
                var msg = (xhr.responseJSON && xhr.responseJSON.message) ? xhr.responseJSON.message : 'সার্ভার ত্রুটি';
                toast('পেমেন্ট ব্যর্থ: ' + msg, 'error');
            },
            complete: function () {
                $btn.prop('disabled', false).html('<i class="fas fa-paper-plane me-2"></i>পেমেন্ট সেভ করুন');
            }
        });
    };

    // ── Renew ─────────────────────────────────────────────────────────────────
    window.doRenew = function (insId, insName) {
        if (!confirm('"' + insName + '" এর জন্য Renewal Invoice তৈরি করবেন?')) return;
        $.ajax({
            url: '/api/invoice/renew/' + insId,
            method: 'POST',
            success: function (res) {
                if (res.success) { toast('Invoice #' + res.invoiceId + ' তৈরি হয়েছে ✅', 'success'); loadData(); }
                else toast(res.message || 'ব্যর্থ হয়েছে', 'error');
            },
            error: function () { toast('সার্ভার ত্রুটি', 'error'); }
        });
    };

    window.viewInvoices = function (insId) {
        window.location.href = '/authority-invoice.html?insId=' + insId;
    };

    // ── Sidebar / Logout ──────────────────────────────────────────────────────
    window.openSidebar   = function () { $('#authSidebar, #sidebarOverlay').addClass('open'); };
    window.closeSidebar  = function () { $('#authSidebar, #sidebarOverlay').removeClass('open'); };
    window.confirmLogout = function () { new bootstrap.Modal(document.getElementById('logoutModal')).show(); };
    window.doLogout      = function () { TailorAuth.logout(); };

    // ── Helpers ───────────────────────────────────────────────────────────────
    function fmtMoney(n) {
        return parseFloat(n || 0).toLocaleString('en-BD', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
    }
    function fmtDate(d) {
        if (!d) return '—';
        var dt = (d instanceof Date) ? d : new Date(d);
        if (isNaN(dt.getTime())) return '—';
        return dt.toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    function esc(s) {
        return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    }
    function toast(msg, type) {
        var $t = $('<div class="toast-item ' + (type || 'info') + '">' + msg + '</div>');
        $('#toastWrap').append($t);
        setTimeout(function () { $t.fadeOut(300, function () { $t.remove(); }); }, 3500);
    }

})();
