// item-stock-report.js
(function () {
    'use strict';

    let institutionId;
    let currentLang  = 'bn';
    let currentPage  = 1;
    let totalPages   = 1;
    let totalCount   = 0;
    let pageSize     = 20;
    let currentStatus = '';
    let _summary     = null;
    let _allData     = []; // for CSV export

    window.currentPage = 1;

    const T = {
        en: {
            stockValue:     'Stock Value (Cost)',
            sellingValue:   'Stock Value (Sell)',
            totalItems:     'Total Items',
            inStock:        'In Stock',
            lowStock:       'Low Stock',
            outOfStock:     'Out of Stock',
            totalBought:    'Total Bought',
            totalSold:      'Total Sold',
            totalDamage:    'Total Damage',
            supplierReturn: 'Supplier Return',
            customerReturn: 'Customer Return',
            page:           'Page',
            of:             'of',
        },
        bn: {
            stockValue:     'স্টক মূল্য (ক্রয়)',
            sellingValue:   'স্টক মূল্য (বিক্রয়)',
            totalItems:     'মোট আইটেম',
            inStock:        'স্টকে আছে',
            lowStock:       'কম স্টক',
            outOfStock:     'স্টক শেষ',
            totalBought:    'মোট ক্রয়',
            totalSold:      'মোট বিক্রয়',
            totalDamage:    'মোট ড্যামেজ',
            supplierReturn: 'সাপ্লায়ার ফেরত',
            customerReturn: 'কাস্টমার ফেরত',
            page:           'পৃষ্ঠা',
            of:             '/',
        }
    };

    function t(key) { return (T[currentLang] || T.bn)[key] || key; }

    // ─── Init ──────────────────────────────────────────────────────────────────
    $(document).ready(function () {
        institutionId = parseInt(sessionStorage.getItem('institutionId') || '0');
        if (!institutionId) return;
        currentLang = localStorage.getItem('preferredLanguage') || 'bn';

        $(document).on('languageChanged', function (e, lang) {
            currentLang = lang || 'bn';
            if (_summary) renderKPI(_summary);
            renderTable(window._lastStockRows || []);
        });

        loadFilters();
        loadSummary();
        loadList(1);
    });

    // ─── Filters Dropdown ──────────────────────────────────────────────────────
    function loadFilters() {
        $.get(`/api/ItemStock/filters?institutionId=${institutionId}`, function (res) {
            if (!res.success) return;
            const $cat = $('#fCategory');
            const $brd = $('#fBrand');
            (res.categories || []).forEach(c => $cat.append(`<option value="${esc(c.Name)}">${esc(c.Name)}</option>`));
            (res.brands     || []).forEach(b => $brd.append(`<option value="${esc(b.Name)}">${esc(b.Name)}</option>`));
        });
    }

    // ─── Summary KPI ──────────────────────────────────────────────────────────
    function loadSummary() {
        $.get(`/api/ItemStock/summary?institutionId=${institutionId}`, function (res) {
            if (!res.success) return;
            _summary = res.data;
            renderKPI(res.data);

            // update status tab counts
            $('#cntAll').text(res.data.TotalItems || 0);
            $('#cntIn' ).text(res.data.InStock    || 0);
            $('#cntLow').text(res.data.LowStock   || 0);
            $('#cntOut').text(res.data.OutOfStock  || 0);
        });
    }

    function renderKPI(s) {
        const kpis = [
            { val:'৳'+fmt(s.StockBuyingValue),  key:'stockValue',     cls:'blue',   icon:'fa-layer-group',      card:'' },
            { val:'৳'+fmt(s.StockSellingValue), key:'sellingValue',   cls:'teal',   icon:'fa-hand-holding-usd', card:'teal' },
            { val: s.TotalItems,                key:'totalItems',     cls:'blue',   icon:'fa-boxes',            card:'' },
            { val: s.InStock,                   key:'inStock',        cls:'green',  icon:'fa-check-circle',     card:'green' },
            { val: s.LowStock,                  key:'lowStock',       cls:'orange', icon:'fa-exclamation-triangle', card:'orange' },
            { val: s.OutOfStock,                key:'outOfStock',     cls:'red',    icon:'fa-times-circle',     card:'red' },
            { val: fmtQty(s.TotalBought),       key:'totalBought',   cls:'purple', icon:'fa-shopping-cart',    card:'purple' },
            { val: fmtQty(s.TotalSold),         key:'totalSold',     cls:'teal',   icon:'fa-receipt',          card:'teal' },
            { val: fmtQty(s.TotalDamage),       key:'totalDamage',   cls:'red',    icon:'fa-trash-alt',        card:'red' },
            { val: fmtQty(s.TotalSupplierReturn), key:'supplierReturn', cls:'orange', icon:'fa-undo',          card:'orange' },
        ];

        const $g = $('#kpiGrid').empty();
        kpis.forEach(function (k) {
            $g.append(`
            <div class="kpi-card ${k.card}">
                <i class="fas ${k.icon} kpi-icon"></i>
                <div class="kpi-val ${k.cls}">${k.val}</div>
                <div class="kpi-lbl">${t(k.key)}</div>
            </div>`);
        });
    }

    // ─── Status Tab ───────────────────────────────────────────────────────────
    window.setStatus = function (el, status) {
        currentStatus = status;
        // reset all tab classes
        $('#statusTabs .s-tab').each(function () {
            $(this).removeClass('active-all active-in active-low active-out');
        });
        const cls = status === '' ? 'active-all' : status === 'in' ? 'active-in' : status === 'low' ? 'active-low' : 'active-out';
        $(el).addClass(cls);
        loadList(1);
    };

    // ─── Load List ────────────────────────────────────────────────────────────
    window.loadList = function (page) {
        currentPage = window.currentPage = page || 1;
        const search   = $('#fSearch').val().trim();
        const category = $('#fCategory').val();
        const brand    = $('#fBrand').val();
        const sortBy   = $('#fSort').val();

        const url = `/api/ItemStock/list?institutionId=${institutionId}&page=${currentPage}&pageSize=${pageSize}` +
            (search   ? `&search=${encodeURIComponent(search)}`     : '') +
            (category ? `&category=${encodeURIComponent(category)}` : '') +
            (brand    ? `&brand=${encodeURIComponent(brand)}`       : '') +
            (currentStatus ? `&status=${currentStatus}`             : '') +
            `&sortBy=${sortBy}`;

        $('#spinWrap').show();
        $('#tableWrap,#emptyWrap,#pagWrap').hide();

        $.get(url, function (res) {
            $('#spinWrap').hide();
            if (!res.success) return;

            totalCount = res.totalCount || 0;
            totalPages = res.totalPages || 1;
            window._lastStockRows = res.data || [];

            $('#resultCount').text(totalCount);

            if (!res.data || !res.data.length) {
                $('#emptyWrap').show();
                return;
            }

            renderTable(res.data);
            $('#tableWrap').show();

            // pagination
            const start = (currentPage - 1) * pageSize + 1;
            const end   = Math.min(currentPage * pageSize, totalCount);
            const info  = `${t('page')} ${currentPage} ${t('of')} ${totalPages}`;
            $('#pagInfo,#pageInfoTop').text(info);
            $('#btnPrev').prop('disabled', currentPage <= 1);
            $('#btnNext').prop('disabled', currentPage >= totalPages);
            if (totalPages > 1) $('#pagWrap').show();
        }).fail(function () { $('#spinWrap').hide(); });
    };

    function renderTable(rows) {
        const maxStock = Math.max.apply(null, rows.map(r => parseFloat(r.StockQty) || 0)) || 1;
        const $b = $('#stockBody').empty();

        rows.forEach(function (r, i) {
            const qty       = parseFloat(r.StockQty) || 0;
            const status    = r.StockStatus || (qty <= 0 ? 'out' : qty <= 10 ? 'low' : 'in');
            const qtyCls    = status === 'out' ? 'qty-out' : status === 'low' ? 'qty-low' : 'qty-in';
            const badgeHtml = status === 'out'
                ? `<span class="badge-out"><i class="fas fa-times-circle me-1"></i>${currentLang==='en'?'Out':'শেষ'}</span>`
                : status === 'low'
                ? `<span class="badge-low"><i class="fas fa-exclamation-triangle me-1"></i>${currentLang==='en'?'Low':'কম'}</span>`
                : `<span class="badge-in"><i class="fas fa-check-circle me-1"></i>${currentLang==='en'?'OK':'ভালো'}</span>`;

            const pct = maxStock > 0 ? Math.min((qty / maxStock) * 100, 100).toFixed(0) : 0;
            const barColor = status === 'out' ? '#dc3545' : status === 'low' ? '#fd7e14' : '#28a745';
            const rowNum = (currentPage - 1) * pageSize + i + 1;

            $b.append(`
            <tr>
                <td style="color:#aaa;font-size:11.5px;">${rowNum}</td>
                <td style="font-weight:700;color:#fd7e14;">${esc(r.FabricCode)}</td>
                <td class="td-left">
                    <div style="font-weight:600;font-size:13px;">${esc(r.FabricName)}</div>
                    <div style="font-size:11px;color:#aaa;">${esc(r.BrandName || '')}</div>
                </td>
                <td><span style="font-size:11.5px;color:#888;">${esc(r.CategoryName || '—')}</span></td>
                <td style="font-weight:600;">৳${fmt(r.CurrentBuyingUnitPrice)}</td>
                <td style="font-weight:600;color:#20c997;">৳${fmt(r.SellingUnitPrice)}</td>
                <td>${fmtQty(r.TotalBought)} <small style="color:#aaa;">${esc(r.UnitName||'')}</small></td>
                <td>${fmtQty(r.TotalSold)}   <small style="color:#aaa;">${esc(r.UnitName||'')}</small></td>
                <td style="color:${parseFloat(r.TotalDamage)>0?'#dc3545':'#aaa'};">${fmtQty(r.TotalDamage)}</td>
                <td style="color:${parseFloat(r.SupplierReturn)>0?'#fd7e14':'#aaa'};">${fmtQty(r.SupplierReturn)}</td>
                <td>
                    <div class="${qtyCls}" style="font-size:15px;">${fmtQty(r.StockQty)}</div>
                    <div class="mini-prog"><div class="mini-bar" style="width:${pct}%;background:${barColor};"></div></div>
                    <div style="font-size:10px;color:#aaa;text-align:center;">${esc(r.UnitName||'')}</div>
                </td>
                <td>${badgeHtml}</td>
                <td style="font-weight:700;color:#6c7ae0;">৳${fmt(r.StockBuyingValue)}</td>
            </tr>`);
        });
    }

    // ─── Reset Filters ─────────────────────────────────────────────────────────
    window.resetFilters = function () {
        $('#fSearch').val('');
        $('#fCategory').val('');
        $('#fBrand').val('');
        $('#fSort').val('stock');
        currentStatus = '';
        $('#statusTabs .s-tab').removeClass('active-all active-in active-low active-out');
        $('#statusTabs .s-tab[data-status=""]').addClass('active-all');
        loadList(1);
    };

    // ─── Debounce ──────────────────────────────────────────────────────────────
    let _timer;
    window.debouncedLoad = function () {
        clearTimeout(_timer);
        _timer = setTimeout(function () { loadList(1); }, 380);
    };

    // ─── Export CSV ───────────────────────────────────────────────────────────
    window.exportCSV = function () {
        const search   = $('#fSearch').val().trim();
        const category = $('#fCategory').val();
        const brand    = $('#fBrand').val();
        const sortBy   = $('#fSort').val();

        // fetch all for export (page=1, pageSize=9999)
        const url = `/api/ItemStock/list?institutionId=${institutionId}&page=1&pageSize=9999` +
            (search   ? `&search=${encodeURIComponent(search)}`     : '') +
            (category ? `&category=${encodeURIComponent(category)}` : '') +
            (brand    ? `&brand=${encodeURIComponent(brand)}`       : '') +
            (currentStatus ? `&status=${currentStatus}`             : '') +
            `&sortBy=${sortBy}`;

        $.get(url, function (res) {
            if (!res.success || !res.data || !res.data.length) return alert('No data to export');

            const headers = ['SN','Code','Name','Category','Brand','Unit','Buy Price','Sell Price',
                             'Total Bought','Total Sold','Damage','Supplier Return','Customer Return',
                             'Stock Qty','Status','Stock Value (Cost)','Stock Value (Sell)'];
            const rows = res.data.map((r, i) => [
                i+1, r.FabricCode, r.FabricName, r.CategoryName, r.BrandName, r.UnitName,
                r.CurrentBuyingUnitPrice, r.SellingUnitPrice,
                r.TotalBought, r.TotalSold, r.TotalDamage, r.SupplierReturn, r.CustomerReturn,
                r.StockQty, r.StockStatus.toUpperCase(), r.StockBuyingValue, r.StockSellingValue
            ]);

            let csv = headers.join(',') + '\n';
            rows.forEach(r => { csv += r.map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',') + '\n'; });

            const blob = new Blob(['\uFEFF' + csv], { type:'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `stock_report_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
        });
    };

    // ─── Helpers ───────────────────────────────────────────────────────────────
    function fmt(n)    { return parseFloat(n||0).toLocaleString('en-BD',{minimumFractionDigits:2,maximumFractionDigits:2}); }
    function fmtQty(n) { return parseFloat(n||0).toLocaleString('en-BD',{minimumFractionDigits:2,maximumFractionDigits:2}); }
    function esc(s)    { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
})();
