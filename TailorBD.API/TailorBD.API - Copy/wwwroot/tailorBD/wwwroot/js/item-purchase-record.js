// item-purchase-record.js
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
        searchTimer = setTimeout(function () {
            loadRecords(1);
        }, 400);
    };

    $(document).ready(function () {
        institutionId = parseInt(sessionStorage.getItem('institutionId') || '0');
        if (!institutionId) { alert('সেশন পাওয়া যায়নি। পুনরায় লগিন করুন।'); return; }
        loadRecords(1);
    });

    // ─── Load Records ─────────────────────────────────────────────────────────
    window.loadRecords = function (page) {
        currentPage        = page;
        window.currentPage = page;

        const params = new URLSearchParams({
            institutionId: institutionId,
            page:          page,
            pageSize:      100,
            dateFrom:      $('#fDateFrom').val() || '',
            dateTo:        $('#fDateTo').val()   || '',
            supplier:      $('#fSupplier').val().trim(),
            billNo:        $('#fBillNo').val().trim()
        });

        $('#loadingWrap').show();
        $('#tableWrap, #emptyWrap, #pagWrap').hide();

        $.get(`/api/ItemPurchase/records?${params.toString()}`, function (res) {
            $('#loadingWrap').hide();
            if (!res.success) { alert('ডেটা লোড করতে সমস্যা হয়েছে।'); return; }

            totalPages = res.totalPages || 1;

            // Summary
            $('#sTotalRecords').text(res.totalCount);
            $('#sTotalAmount').text('৳ ' + fmt(res.summary.totalAmount));
            $('#sTotalPaid').text('৳ '   + fmt(res.summary.totalPaid));
            $('#sTotalDue').text('৳ '    + fmt(res.summary.totalDue));

            if (!res.data || !res.data.length) {
                $('#emptyWrap').show();
                return;
            }

            const $body = $('#recordsBody').empty();
            const offset = (page - 1) * 20;

            res.data.forEach(function (r, i) {
                const hasDue = parseFloat(r.BuyingDueAmount) > 0;
                $body.append(`
                <tr id="row-${r.PurchaseID}">
                    <td>${offset + i + 1}</td>
                    <td class="sn-badge">${esc(r.PurchaseSN || '')}</td>
                    <td>${esc(r.BuyingDate || '')}</td>
                    <td>${esc(r.BillNo) || '<span style="color:#ccc;">—</span>'}</td>
                    <td>
                        <span style="font-weight:600;">${esc(r.SupplierName)}</span>
                        ${r.SupplierPhone ? `<br><span class="supplier-name">📞 ${esc(r.SupplierPhone)}</span>` : ''}
                    </td>
                    <td class="price">৳ ${fmt(r.BuyingTotalPrice)}</td>
                    <td>${r.BuyingDiscountAmount > 0 ? `<span style="color:#e67e22;">৳ ${fmt(r.BuyingDiscountAmount)}</span>` : '—'}</td>
                    <td class="price paid-green">৳ ${fmt(r.BuyingPaidAmount)}</td>
                    <td class="price ${hasDue ? 'due-red' : ''}">
                        ${hasDue ? '৳ ' + fmt(r.BuyingDueAmount) : '—'}
                    </td>
                    <td>
                        <button class="detail-btn" onclick="toggleDetail(${r.PurchaseID}, this)">
                            <i class="fas fa-chevron-down"></i> দেখুন
                        </button>
                    </td>
                </tr>
                <tr class="detail-row" id="detail-${r.PurchaseID}" style="display:none;">
                    <td colspan="10">
                        <div class="detail-inner" id="detail-inner-${r.PurchaseID}">
                            <div class="spin" style="margin:10px auto;"></div>
                        </div>
                    </td>
                </tr>`);
            });

            $('#tableWrap').show();

            // Pagination
            if (totalPages > 1) {
                $('#pagInfo').text(`পৃষ্ঠা ${page} / ${totalPages}`);
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
        const $detailRow   = $(`#detail-${id}`);
        const $detailInner = $(`#detail-inner-${id}`);
        const isOpen       = $detailRow.is(':visible');

        // আগে যেটা খোলা ছিল সেটা বন্ধ করো
        if (openDetailId && openDetailId !== id) {
            $(`#detail-${openDetailId}`).hide();
            $(`#detail-btn-${openDetailId}`).html('<i class="fas fa-chevron-down"></i> দেখুন');
        }

        if (isOpen) {
            $detailRow.hide();
            $(btn).html('<i class="fas fa-chevron-down"></i> দেখুন');
            openDetailId = null;
            return;
        }

        // খুলো এবং data load করো
        $detailRow.show();
        $(btn).html('<i class="fas fa-chevron-up"></i> বন্ধ করুন');
        openDetailId = id;
        $detailInner.html('<div class="spin" style="margin:10px auto;display:block;"></div>');

        $.get(`/api/ItemPurchase/record-detail?purchaseId=${id}`, function (res) {
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
                    <td>${parseFloat(d.Quantity).toFixed(2)}</td>
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
        $('#fDateFrom, #fDateTo, #fSupplier, #fBillNo').val('');
        loadRecords(1);
    };

    // ─── Helpers ──────────────────────────────────────────────────────────────
    function fmt(val) {
        return parseFloat(val || 0).toFixed(2);
    }

    function esc(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
})();
