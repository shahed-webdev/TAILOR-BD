(function () {
    'use strict';

    // ── State ─────────────────────────────────────────────────────────────────
    let allInstitutions = [];
    let dueFilter       = '';       // '' | 'due' | 'clear'
    let statusFilter    = '';       // '' | 'Valid' | 'Invalid'
    let currentView     = 'card';   // 'card' | 'table'

    // Collect modal state
    let currentInsId    = 0;
    let currentInvList  = [];       // all invoices for current institution

    // Single pay modal state
    let singlePayData   = null;     // { invoiceId, totalAmount, paidAmount }

    // ── Init ──────────────────────────────────────────────────────────────────
    $(document).ready(function () {
        if (!TailorAuth.guard('Authority')) return;
        TailorAuth.guardSubPage('collect-payment');
        loadSidebarProfile();
        loadData();
    });

    // ── Sidebar profile ───────────────────────────────────────────────────────
    let _loggedInName = ''; // store real name for use in payment forms

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

    // ── Load all institutions ─────────────────────────────────────────────────
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
        const total    = allInstitutions.length;
        const dueIns   = allInstitutions.filter(function (i) { return parseFloat(i.totalDue || 0) > 0; }).length;
        const clearIns = total - dueIns;
        const totalDue = allInstitutions.reduce(function (s, i) { return s + parseFloat(i.totalDue || 0); }, 0);
        const dueInv   = allInstitutions.reduce(function (s, i) { return s + (parseInt(i.totalInvoices || 0)); }, 0);

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
        const search = ($('#searchInput').val() || '').toLowerCase().trim();
        const sort   = $('#sortSelect').val();

        let filtered = allInstitutions.filter(function (ins) {
            const matchSearch = !search ||
                (ins.institutionName || '').toLowerCase().includes(search) ||
                (ins.phone || '').toLowerCase().includes(search) ||
                (ins.userName || '').toLowerCase().includes(search);

            const due = parseFloat(ins.totalDue || 0);
            const matchDue =
                dueFilter === 'due'   ? due > 0 :
                dueFilter === 'clear' ? due <= 0 : true;

            const matchStatus = !statusFilter || ins.validation === statusFilter;

            return matchSearch && matchDue && matchStatus;
        });

        // Sort
        filtered = filtered.slice().sort(function (a, b) {
            if (sort === 'due_desc')   return parseFloat(b.totalDue || 0) - parseFloat(a.totalDue || 0);
            if (sort === 'due_asc')    return parseFloat(a.totalDue || 0) - parseFloat(b.totalDue || 0);
            if (sort === 'name_asc')   return (a.institutionName || '').localeCompare(b.institutionName || '');
            if (sort === 'expire_asc') {
                const da = a.expire_Date ? new Date(a.expire_Date) : new Date('9999-12-31');
                const db = b.expire_Date ? new Date(b.expire_Date) : new Date('9999-12-31');
                return da - db;
            }
            return 0;
        });

        $('#resultInfo').html(
            '<i class="fas fa-list me-1"></i><strong>' + filtered.length + '</strong> টি প্রতিষ্ঠান পাওয়া গেছে'
        );

        if (currentView === 'card') {
            renderCards(filtered);
        } else {
            renderTable(filtered);
        }
    };

    // ── View toggle ───────────────────────────────────────────────────────────
    window.setView = function (view) {
        currentView = view;
        if (view === 'card') {
            $('#cardView').show();
            $('#tableView').hide();
            $('#btnCardView').addClass('active');
            $('#btnTableView').removeClass('active');
        } else {
            $('#cardView').hide();
            $('#tableView').show();
            $('#btnCardView').removeClass('active');
            $('#btnTableView').addClass('active');
        }
        applyFilters();
    };

    // ── Render Cards ──────────────────────────────────────────────────────────
    function renderCards(list) {
        var $grid = $('#insCardGrid').empty();

        if (!list.length) {
            $grid.html(
                '<div class="empty-state" style="background:#fff;border-radius:14px;padding:60px 20px;text-align:center;grid-column:1/-1;">' +
                '<i class="fas fa-store-slash" style="font-size:3rem;opacity:.3;display:block;margin-bottom:14px;"></i>' +
                '<h5 style="color:#64748b;">কোনো প্রতিষ্ঠান পাওয়া যায়নি</h5>' +
                '<p style="color:#94a3b8;font-size:.85rem;">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন</p>' +
                '</div>'
            );
            return;
        }

        list.forEach(function (ins) {
            var due        = parseFloat(ins.totalDue || 0);
            var hasDue     = due > 0;
            var cardCls    = hasDue ? 'has-due' : 'all-clear';
            var expiry     = ins.expire_Date ? new Date(ins.expire_Date) : null;
            var now        = new Date();
            var diff       = expiry ? Math.ceil((expiry - now) / 86400000) : null;
            var expClass   = '';
            var expTag     = '';
            if (expiry) {
                if (diff < 0)   { expClass = 'text-danger'; expTag = '<span class="badge-expiring ms-1">মেয়াদ শেষ</span>'; }
                else if (diff <= 15) { expClass = 'text-warning'; expTag = '<span class="badge-expiring ms-1">' + diff + 'd</span>'; }
            }
            var statusBadge = ins.validation === 'Valid'
                ? '<span class="badge-valid">Active</span>'
                : '<span class="badge-invalid">Inactive</span>';
            var initial = (ins.institutionName || '?').charAt(0).toUpperCase();

            var $card = $(
                '<div class="ins-card ' + cardCls + '">' +
                    '<div class="ins-card-header">' +
                        '<div class="ins-avatar">' + initial + '</div>' +
                        '<div style="flex:1;min-width:0;">' +
                            '<div class="ins-name">' + esc(ins.institutionName) + '</div>' +
                            '<div class="ins-user"><i class="fas fa-user me-1"></i>' + esc(ins.userName) + '</div>' +
                        '</div>' +
                        '<div class="ms-auto">' + statusBadge + '</div>' +
                    '</div>' +
                    '<div class="ins-card-body">' +
                        '<div class="ins-meta-row">' +
                            '<span><i class="fas fa-phone"></i>' + esc(ins.phone || '—') + '</span>' +
                            '<span><i class="fas fa-box-open"></i>' + esc(ins.packageName || '—') + '</span>' +
                        '</div>' +
                        '<div class="ins-meta-row">' +
                            '<span class="' + expClass + '"><i class="fas fa-calendar-alt"></i>' +
                                (expiry ? fmtDate(expiry) : '—') + expTag +
                            '</span>' +
                            '<span><i class="fas fa-file-invoice me-1"></i>' + (ins.totalInvoices || 0) + ' Invoice</span>' +
                        '</div>' +
                        '<div class="d-flex align-items-baseline justify-content-between mt-2 pt-2" style="border-top:1px solid #f1f5f9;">' +
                            '<div>' +
                                '<div style="font-size:.72rem;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-bottom:1px;">মোট বকেয়া</div>' +
                                '<div class="due-amount" style="' + (hasDue ? '' : 'color:#10b981;') + '">' +
                                    '৳ ' + fmtMoney(due) +
                                    (hasDue ? '' : '<small>পরিষ্কার</small>') +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="ins-card-footer">' +
                        (hasDue ?
                            '<button class="btn-sm-act btn-collect" onclick="openCollectModal(' + ins.institutionId + ',\'' + esc(ins.institutionName) + '\')">' +
                            '<i class="fas fa-hand-holding-usd"></i> পেমেন্ট কালেক্ট</button>' : '') +
                        '<button class="btn-sm-act btn-renew-sm" onclick="doRenew(' + ins.institutionId + ',\'' + esc(ins.institutionName) + '\')">' +
                        '<i class="fas fa-redo"></i> Renew</button>' +
                        '<button class="btn-sm-act btn-view-sm" onclick="viewInvoices(' + ins.institutionId + ')">' +
                        '<i class="fas fa-eye"></i> Invoice</button>' +
                    '</div>' +
                '</div>'
            );
            $grid.append($card);
        });
    }

    // ── Render Table ──────────────────────────────────────────────────────────
    function renderTable(list) {
        var $tbody = $('#insTbody').empty();
        if (!list.length) {
            $tbody.html('<tr><td colspan="9" class="text-center py-4 text-muted">কোনো প্রতিষ্ঠান পাওয়া যায়নি</td></tr>');
            return;
        }
        list.forEach(function (ins, i) {
            var due      = parseFloat(ins.totalDue || 0);
            var hasDue   = due > 0;
            var expiry   = ins.expire_Date ? new Date(ins.expire_Date) : null;
            var now      = new Date();
            var diff     = expiry ? Math.ceil((expiry - now) / 86400000) : null;
            var expStr   = expiry ? fmtDate(expiry) : '—';
            var expStyle = (diff !== null && diff < 0) ? 'color:#ef4444;font-weight:600;' : (diff !== null && diff <= 15 ? 'color:#f97316;font-weight:600;' : '');
            var statusBadge = ins.validation === 'Valid'
                ? '<span class="badge-valid">Active</span>'
                : '<span class="badge-invalid">Inactive</span>';

            $tbody.append(
                '<tr>' +
                '<td style="color:#94a3b8;">' + (i + 1) + '</td>' +
                '<td>' +
                    '<div style="font-weight:600;color:#1e293b;">' + esc(ins.institutionName) + '</div>' +
                    '<div style="font-size:.75rem;color:#94a3b8;">' + esc(ins.userName) + '</div>' +
                '</td>' +
                '<td>' + esc(ins.phone || '—') + '</td>' +
                '<td>' + esc(ins.packageName || '—') + '</td>' +
                '<td style="' + expStyle + '">' + expStr + '</td>' +
                '<td>' + (ins.totalInvoices || 0) + '</td>' +
                '<td>' +
                    '<span style="font-weight:700;color:' + (hasDue ? '#ef4444' : '#10b981') + ';">৳ ' + fmtMoney(due) + '</span>' +
                '</td>' +
                '<td>' + statusBadge + '</td>' +
                '<td>' +
                    '<div class="d-flex gap-1 flex-wrap">' +
                        (hasDue ? '<button class="btn-sm-act btn-collect" style="padding:4px 10px;" onclick="openCollectModal(' + ins.institutionId + ',\'' + esc(ins.institutionName) + '\')">' +
                        '<i class="fas fa-hand-holding-usd"></i></button>' : '') +
                        '<button class="btn-sm-act btn-renew-sm" style="padding:4px 10px;" onclick="doRenew(' + ins.institutionId + ',\'' + esc(ins.institutionName) + '\')">' +
                        '<i class="fas fa-redo"></i></button>' +
                        '<button class="btn-sm-act btn-view-sm" style="padding:4px 10px;" onclick="viewInvoices(' + ins.institutionId + ')">' +
                        '<i class="fas fa-eye"></i></button>' +
                    '</div>' +
                '</td>' +
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
        $('#quickPayAllSection').hide();
        $('#dueInvList').html('<div class="text-center py-3"><div class="spinner-border spinner-border-sm text-success"></div> লোড হচ্ছে...</div>');

        // Pre-fill collected-by with the logged-in user's real name
        $('#bulkCollectedBy').val(_loggedInName || sessionStorage.getItem('username') || '');

        new bootstrap.Modal(document.getElementById('collectModal')).show();

        // Load invoices for this institution
        $.get('/api/invoice/list?institutionId=' + insId + '&pageSize=100', function (res) {
            currentInvList = (res.data || []);
            renderCollectModal();
        }).fail(function () {
            $('#dueInvList').html('<div class="text-center text-danger py-3">Invoice লোড ব্যর্থ</div>');
        });
    };

    function renderCollectModal() {
        var dueInvs  = currentInvList.filter(function (inv) { return inv.paymentStatus !== 'Paid'; });
        var paidInvs = currentInvList.filter(function (inv) { return inv.paymentStatus === 'Paid'; });
        var totalDue = dueInvs.reduce(function (s, inv) {
            return s + Math.max(0, parseFloat(inv.totalAmount || 0) - parseFloat(inv.paidAmount || 0));
        }, 0);

        $('#modalTotalDue').text('৳ ' + fmtMoney(totalDue));
        $('#modalTotalInv').text(currentInvList.length);
        $('#modalPaidInv').text(paidInvs.length);

        var $list = $('#dueInvList').empty();

        if (!dueInvs.length) {
            $list.html(
                '<div class="text-center py-4" style="color:#10b981;">' +
                '<i class="fas fa-check-circle" style="font-size:2rem;display:block;margin-bottom:8px;"></i>' +
                '<strong>সব Invoice পরিশোধিত!</strong>' +
                '<div style="font-size:.82rem;color:#64748b;margin-top:4px;">এই প্রতিষ্ঠানের কোনো বকেয়া নেই।</div>' +
                '</div>'
            );
            $('#quickPayAllSection').hide();
            return;
        }

        // Due invoices table
        var html = '<div style="font-size:.82rem;font-weight:700;color:#64748b;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;">বকেয়া Invoice সমূহ</div>';
        dueInvs.forEach(function (inv) {
            var remaining = Math.max(0, parseFloat(inv.totalAmount || 0) - parseFloat(inv.paidAmount || 0));
            var statusBadge = inv.paymentStatus === 'Partial'
                ? '<span class="badge-partial">Partial</span>'
                : '<span class="badge-due">Due</span>';
            html +=
                '<div class="inv-row">' +
                    '<div class="inv-for">' +
                        '<div style="font-weight:600;">Invoice #' + inv.invoiceID + '</div>' +
                        '<div style="font-size:.72rem;color:#94a3b8;">' + esc(inv.invoice_For || '') + '</div>' +
                        '<div style="font-size:.72rem;color:#94a3b8;">' + (inv.issuDate ? fmtDate(new Date(inv.issuDate)) : '') + '</div>' +
                    '</div>' +
                    '<div>' +
                        '<div style="font-size:.72rem;color:#94a3b8;">মোট</div>' +
                        '<div style="font-weight:600;font-size:.82rem;">৳ ' + fmtMoney(parseFloat(inv.totalAmount || 0)) + '</div>' +
                    '</div>' +
                    '<div>' +
                        '<div style="font-size:.72rem;color:#94a3b8;">পেইড</div>' +
                        '<div style="font-weight:600;font-size:.82rem;color:#10b981;">৳ ' + fmtMoney(parseFloat(inv.paidAmount || 0)) + '</div>' +
                    '</div>' +
                    '<div class="inv-amt">' +
                        '<div style="font-size:.72rem;color:#94a3b8;">বাকি</div>' +
                        '<div>৳ ' + fmtMoney(remaining) + '</div>' +
                    '</div>' +
                    statusBadge +
                    '<button class="btn-sm-act btn-view-sm" style="padding:4px 8px;font-size:.72rem;" ' +
                        'onclick="openSinglePay(' + inv.invoiceID + ',' + (inv.totalAmount || 0) + ',' + (inv.paidAmount || 0) + ',\'' + esc(inv.invoice_For || '') + '\')">' +
                        '<i class="fas fa-money-bill-wave"></i>' +
                    '</button>' +
                '</div>';
        });
        $list.html(html);

        // Quick pay all section
        $('#quickPayAllSection').show();
        var $rows = $('#quickPayRows').empty();
        dueInvs.forEach(function (inv) {
            var remaining = Math.max(0, parseFloat(inv.totalAmount || 0) - parseFloat(inv.paidAmount || 0));
            $rows.append(
                '<div class="quick-pay-row">' +
                    '<div class="qp-for">Invoice #' + inv.invoiceID + ' — ' + esc(inv.invoice_For || '') + '</div>' +
                    '<div class="qp-due">৳ ' + fmtMoney(remaining) + '</div>' +
                    '<div class="qp-inp">' +
                        '<input type="number" class="form-control form-control-sm qp-amount" ' +
                               'data-inv-id="' + inv.invoiceID + '" ' +
                               'data-remaining="' + remaining + '" ' +
                               'min="0" max="' + remaining + '" step="0.01" ' +
                               'value="' + remaining.toFixed(2) + '" ' +
                               'placeholder="৳" oninput="recalcQuickPayTotal()">' +
                    '</div>' +
                '</div>'
            );
        });
        recalcQuickPayTotal();
    }

    window.fillFullPayment = function () {
        $('.qp-amount').each(function () {
            $(this).val(parseFloat($(this).data('remaining')).toFixed(2));
        });
        recalcQuickPayTotal();
    };

    window.recalcQuickPayTotal = function () {
        var total = 0;
        $('.qp-amount').each(function () {
            var v = parseFloat($(this).val()) || 0;
            total += v;
        });
        $('#quickPayTotal').text('৳ ' + fmtMoney(total));
    };

    window.submitBulkPayment = function () {
        var payments = [];
        $('.qp-amount').each(function () {
            var amt = parseFloat($(this).val()) || 0;
            if (amt > 0) {
                payments.push({ invoiceId: parseInt($(this).data('inv-id')), paidAmount: amt });
            }
        });
        if (!payments.length) { toast('কোনো অ্যামাউন্ট দেওয়া হয়নি', 'error'); return; }

        var collectedBy   = $('#bulkCollectedBy').val().trim() || _loggedInName || sessionStorage.getItem('username') || 'Authority';
        var paymentMethod = $('#bulkPaymentMethod').val() || 'Cash';

        var $btn = $('#submitPayBtn').prop('disabled', true)
            .html('<div class="spinner-border spinner-border-sm me-2"></div>সেভ হচ্ছে...');

        var promises = payments.map(function (p) {
            return $.ajax({
                url: '/api/invoice/' + p.invoiceId + '/payment',
                method: 'PUT',
                contentType: 'application/json',
                headers: { 'X-Username': collectedBy },
                data: JSON.stringify({ paidAmount: p.paidAmount, collectedBy: collectedBy, paymentMethod: paymentMethod })
            });
        });

        $.when.apply($, promises).always(function () {
            $btn.prop('disabled', false).html('<i class="fas fa-paper-plane me-2"></i>পেমেন্ট সেভ করুন');
            toast(payments.length + ' টি Invoice পেমেন্ট আপডেট হয়েছে ✅', 'success');
            bootstrap.Modal.getInstance(document.getElementById('collectModal')).hide();
            loadData();
        });
    };

    // ── Single Pay Modal ──────────────────────────────────────────────────────
    window.openSinglePay = function (invoiceId, totalAmount, paidAmount, invoiceFor) {
        singlePayData = { invoiceId: invoiceId, totalAmount: totalAmount, paidAmount: paidAmount };
        $('#singlePayInvId').val(invoiceId);
        $('#singlePayFor').text(invoiceFor || '—');
        $('#singlePayTotal').text('৳ ' + fmtMoney(totalAmount));
        $('#singlePayAlready').text('৳ ' + fmtMoney(paidAmount));
        var remaining = Math.max(0, totalAmount - paidAmount);
        $('#singlePayAmt').val(remaining.toFixed(2));
        // Pre-fill with logged-in user's real name
        $('#singlePayCollectedBy').val(_loggedInName || sessionStorage.getItem('username') || '');
        updateSinglePayDue();
        new bootstrap.Modal(document.getElementById('singlePayModal')).show();
    };

    window.updateSinglePayDue = function () {
        if (!singlePayData) return;
        var amt       = parseFloat($('#singlePayAmt').val()) || 0;
        var newPaid   = singlePayData.paidAmount + amt;
        var remaining = Math.max(0, singlePayData.totalAmount - newPaid);
        $('#singlePayRemain').text('৳ ' + fmtMoney(remaining));
    };

    window.submitSinglePayment = function () {
        if (!singlePayData) return;
        var addAmt  = parseFloat($('#singlePayAmt').val()) || 0;
        if (addAmt <= 0) { toast('অ্যামাউন্ট দিন', 'error'); return; }
        var newPaid = singlePayData.paidAmount + addAmt;

        var collectedBy   = ($('#singlePayCollectedBy').val() || '').trim() || _loggedInName || sessionStorage.getItem('username') || 'Authority';
        var paymentMethod = $('#singlePayMethod').val() || 'Cash';

        $.ajax({
            url: '/api/invoice/' + singlePayData.invoiceId + '/payment',
            method: 'PUT',
            contentType: 'application/json',
            headers: { 'X-Username': collectedBy },
            data: JSON.stringify({ paidAmount: newPaid, collectedBy: collectedBy, paymentMethod: paymentMethod }),
            success: function (res) {
                if (res.success) {
                    toast('পেমেন্ট আপডেট সফল ✅', 'success');
                    bootstrap.Modal.getInstance(document.getElementById('singlePayModal')).hide();
                    if (currentInsId) {
                        $.get('/api/invoice/list?institutionId=' + currentInsId + '&pageSize=100', function (r) {
                            currentInvList = r.data || [];
                            renderCollectModal();
                        });
                    }
                    loadData();
                } else {
                    toast(res.message || 'ব্যর্থ হয়েছে', 'error');
                }
            },
            error: function () { toast('সার্ভার ত্রুটি', 'error'); }
        });
    };

    // ── Renew ─────────────────────────────────────────────────────────────────
    window.doRenew = function (insId, insName) {
        if (!confirm('"' + insName + '" এর জন্য Renewal Invoice তৈরি করবেন?')) return;
        $.ajax({
            url: '/api/invoice/renew/' + insId,
            method: 'POST',
            success: function (res) {
                if (res.success) {
                    toast('Invoice #' + res.invoiceId + ' তৈরি হয়েছে ✅', 'success');
                    loadData();
                } else {
                    toast(res.message || 'ব্যর্থ হয়েছে', 'error');
                }
            },
            error: function () { toast('সার্ভার ত্রুটি', 'error'); }
        });
    };

    // ── View Invoices (redirect to invoice page) ──────────────────────────────
    window.viewInvoices = function (insId) {
        window.location.href = '/authority-invoice.html?insId=' + insId;
    };

    // ── Sidebar / Logout ──────────────────────────────────────────────────────
    window.openSidebar  = function () { $('#authSidebar, #sidebarOverlay').addClass('open'); };
    window.closeSidebar = function () { $('#authSidebar, #sidebarOverlay').removeClass('open'); };
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
        return String(s || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    function toast(msg, type) {
        var $t = $('<div class="toast-item ' + (type || 'info') + '">' + msg + '</div>');
        $('#toastWrap').append($t);
        setTimeout(function () { $t.fadeOut(300, function () { $t.remove(); }); }, 3500);
    }

})();
