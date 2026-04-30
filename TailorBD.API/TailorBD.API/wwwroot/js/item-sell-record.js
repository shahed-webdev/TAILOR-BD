// item-sell-record.js
(function () {
    'use strict';

    let institutionId;
    let currentPage  = 1;
    let totalPages   = 1;
    let openDetailId = null;
    let searchTimer  = null;

    window.currentPage = currentPage;

    // ─── Debounced Search ─────────────────────────────────────────────────────
    window.debouncedSearch = function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () { loadRecords(1); }, 400);
    };

    $(document).ready(function () {
        // Wait for session
        $(document).one('app-session-ready institution-loaded institutionLoaded', function () {
            institutionId = parseInt(sessionStorage.getItem('institutionId') || '0');
            if (!institutionId) { alert('সেশন পাওয়া যায়নি। পুনরায় লগিন করুন।'); return; }
            loadRecords(1);
        });
        // Fallback
        setTimeout(function () {
            if (!institutionId) {
                institutionId = parseInt(sessionStorage.getItem('institutionId')
                    || localStorage.getItem('session_institutionId') || '0');
                if (institutionId) loadRecords(1);
            }
        }, 2000);
    });

    // ─── Load Records ─────────────────────────────────────────────────────────
    window.loadRecords = function (page) {
        currentPage        = page;
        window.currentPage = page;

        const params = new URLSearchParams({
            institutionId: institutionId,
            page:          page,
            pageSize:      20,
            dateFrom:      $('#fDateFrom').val() || '',
            dateTo:        $('#fDateTo').val()   || '',
            customer:      $('#fCustomer').val().trim(),
            sellingSN:     $('#fSellingSN').val().trim()
        });

        $('#loadingWrap').show();
        $('#tableWrap, #emptyWrap, #pagWrap').hide();

        $.get('/api/ItemSell/records?' + params.toString(), function (res) {
            $('#loadingWrap').hide();
            if (!res.success) { alert('ডেটা লোড করতে সমস্যা হয়েছে।'); return; }

            totalPages = res.totalPages || 1;

            // Summary
            $('#sTotalRecords').text(res.totalCount);
            $('#sTotalAmount').text('৳ ' + fmt(res.summary.TotalAmount || res.summary.totalAmount));
            $('#sTotalPaid').text('৳ '   + fmt(res.summary.TotalPaid   || res.summary.totalPaid));
            $('#sTotalDue').text('৳ '    + fmt(res.summary.TotalDue    || res.summary.totalDue));

            if (!res.data || !res.data.length) {
                $('#emptyWrap').show();
                return;
            }

            const $body  = $('#recordsBody').empty();
            const offset = (page - 1) * 20;

            res.data.forEach(function (r, i) {
                const hasDue = parseFloat(r.SellingDueAmount) > 0;
                const sn     = r.SellingSN || r.sellingSN || '';
                const id     = r.SellingId || r.sellingId;
                $body.append(`
                <tr id="row-${id}">
                    <td>${offset + i + 1}</td>
                    <td>
                        <a href="/item-sell-invoice.html?id=${id}" class="sn-badge" target="_blank"
                           title="রশিদ দেখুন">${esc(sn)}</a>
                    </td>
                    <td>${esc(r.SellingDate || r.sellingDate || '')}</td>
                    <td>
                        ${r.CustomerName
                            ? `<span style="font-weight:600;">${esc(r.CustomerName)}</span>
                               ${r.CustomerPhone ? `<br><span class="cust-phone">📞 ${esc(r.CustomerPhone)}</span>` : ''}`
                            : '<span style="color:#ccc;">—</span>'}
                    </td>
                    <td class="price">৳ ${fmt(r.SellingTotalPrice || r.sellingTotalPrice)}</td>
                    <td>${(r.SellingDiscountAmount > 0)
                            ? `<span style="color:#e67e22;">৳ ${fmt(r.SellingDiscountAmount)}</span>`
                            : '—'}</td>
                    <td class="price paid-green">৳ ${fmt(r.SellingPaidAmount || r.sellingPaidAmount)}</td>
                    <td class="price ${hasDue ? 'due-red' : ''}">
                        ${hasDue ? '৳ ' + fmt(r.SellingDueAmount) : '—'}
                    </td>
                    <td>
                        <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;">
                        <button class="detail-btn" onclick="toggleDetail(${id}, this)">
                            <i class="fas fa-chevron-down"></i> দেখুন
                        </button>
                        <a href="/item-sell-return.html?sn=${sn}" class="detail-btn"
                           style="background:#fff3f3;color:#dc3545;text-decoration:none;" title="ফেরত">
                            <i class="fas fa-undo-alt"></i> ফেরত
                        </a>
                        </div>
                    </td>
                </tr>
                <tr class="detail-row" id="detail-${id}" style="display:none;">
                    <td colspan="9">
                        <div class="detail-inner" id="detail-inner-${id}">
                            <div class="spin" style="margin:10px auto;display:block;"></div>
                        </div>
                    </td>
                </tr>`);
            });

            $('#tableWrap').show();

            // Pagination
            if (totalPages > 1) {
                $('#pagInfo').text('পৃষ্ঠা ' + page + ' / ' + totalPages);
                $('#btnPrev').prop('disabled', page <= 1);
                $('#btnNext').prop('disabled', page >= totalPages);
                $('#pagWrap').show();
            }

        }).fail(function () {
            $('#loadingWrap').hide();
            $('#emptyWrap').show();
        });
    };

    // ─── Toggle Detail Row ─────────────────────────────────────────────────────
    window.toggleDetail = function (id, btn) {
        const $detailRow   = $('#detail-' + id);
        const $detailInner = $('#detail-inner-' + id);
        const isOpen       = $detailRow.is(':visible');

        if (openDetailId && openDetailId !== id) {
            $('#detail-' + openDetailId).hide();
        }

        if (isOpen) {
            $detailRow.hide();
            $(btn).html('<i class="fas fa-chevron-down"></i> দেখুন');
            openDetailId = null;
            return;
        }

        $detailRow.show();
        $(btn).html('<i class="fas fa-chevron-up"></i> বন্ধ করুন');
        openDetailId = id;
        $detailInner.html('<div class="spin" style="margin:10px auto;display:block;"></div>');

        $.get('/api/ItemSell/record-detail?sellingId=' + id, function (res) {
            if (!res.success || !res.data.length) {
                $detailInner.html('<p style="color:#aaa;font-size:13px;padding:8px;">কোনো আইটেম পাওয়া যায়নি</p>');
                return;
            }
            let html = `<table class="detail-tbl">
                <thead><tr>
                    <th>#</th>
                    <th>আইটেম কোড</th>
                    <th>আইটেমের নাম</th>
                    <th>ইউনিট</th>
                    <th>পরিমান</th>
                    <th>ইউনিট মূল্য</th>
                    <th>মোট মূল্য</th>
                </tr></thead><tbody>`;
            res.data.forEach(function (d, i) {
                html += `<tr>
                    <td>${i + 1}</td>
                    <td style="font-weight:700;color:#6c7ae0;">${esc(d.ItemCode)}</td>
                    <td>${esc(d.ItemName)}</td>
                    <td>${esc(d.UnitName || '')}</td>
                    <td>${parseFloat(d.Quantity || 0).toFixed(2)}</td>
                    <td>৳ ${fmt(d.UnitPrice)}</td>
                    <td style="font-weight:700;">৳ ${fmt(d.TotalPrice)}</td>
                </tr>`;
            });
            html += '</tbody></table>';
            $detailInner.html(html);
        }).fail(function () {
            $detailInner.html('<p style="color:#dc3545;font-size:13px;padding:8px;">লোড করতে সমস্যা হয়েছে</p>');
        });
    };

    // ─── Reset Filter ──────────────────────────────────────────────────────────
    window.resetFilter = function () {
        $('#fDateFrom, #fDateTo, #fCustomer, #fSellingSN').val('');
        loadRecords(1);
    };

    // ─── Helpers ──────────────────────────────────────────────────────────────
    function fmt(val) { return parseFloat(val || 0).toFixed(2); }
    function esc(str) {
        return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
                                .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
})();
