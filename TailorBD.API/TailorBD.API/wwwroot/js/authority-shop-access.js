(function () {
    'use strict';

    // Authority panel → Shop Page Access.
    // Stored as a DENY list: only the pages switched OFF for a shop are saved (table ShopPageBlock).
    // On screen: ticked = allowed. A shop with nothing saved has every page.

    let catalog = [];          // [{key, bn, en, pages:[{key, bn, en}]}]
    let currentShop = null;    // {institutionId, institutionName, ...}
    let savedBlocked = [];     // blocked page keys as saved on the server
    let tableReady = true;
    let searchTimer = null;

    $(document).ready(function () {
        if (!TailorAuth.guard('Authority')) return;
        TailorAuth.guardSubPage('shop-page-access');

        $('#btnShopSearch').on('click', loadShops);
        $('#shopSearch').on('input', function () {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(loadShops, 350);
        }).on('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); loadShops(); } });
        $('#restrictedOnly').on('change', loadShops);

        $('#shopList').on('click', '.shop-item', function () { openShop(parseInt($(this).data('id'), 10)); });

        $('#sections').on('change', '.pa-page input', function () {
            $(this).closest('.pa-page').toggleClass('off', !this.checked);
            syncSectionBoxes();
        });
        $('#sections').on('change', '.pa-section-head input', function () {
            const on = this.checked;
            $(this).closest('.pa-section').find('.pa-page input').each(function () {
                this.checked = on;
                $(this).closest('.pa-page').toggleClass('off', !on);
            });
            syncSectionBoxes();
        });
        $('#btnAllOn').on('click', function () { setAll(true); });
        $('#btnAllOff').on('click', function () { setAll(false); });
        $('#btnReset').on('click', function () { applyBlocked(savedBlocked); });
        $('#btnSave').on('click', save);

        loadCatalog().always(loadShops);
    });

    // ── Data ──────────────────────────────────────────────────────────────────
    function loadCatalog() {
        return $.get('/api/shop-page-access/catalog').done(function (res) {
            if (res && res.success) catalog = res.sections || [];
        }).fail(function (xhr) {
            toast(parseError(xhr) || 'পেজ তালিকা লোড ব্যর্থ', 'error');
        });
    }

    function loadShops() {
        const search = $('#shopSearch').val().trim();
        const restrictedOnly = $('#restrictedOnly').is(':checked');
        $.get('/api/shop-page-access/shops', { search: search, restrictedOnly: restrictedOnly }).done(function (res) {
            if (!res || !res.success) { $('#shopList').html(emptyMsg('লোড ব্যর্থ')); return; }
            tableReady = res.tableReady !== false;
            $('#tableWarn').toggle(!tableReady);
            renderShops(res.data || []);
        }).fail(function (xhr) {
            $('#shopList').html(emptyMsg(parseError(xhr) || 'সার্ভার সংযোগ ব্যর্থ'));
        });
    }

    function renderShops(rows) {
        if (!rows.length) { $('#shopList').html(emptyMsg('কোনো প্রতিষ্ঠান পাওয়া যায়নি')); return; }
        const html = rows.map(function (r) {
            const n = r.blockedCount || 0;
            const badge = n > 0
                ? '<span class="badge-blocked">' + n + 'টি বন্ধ</span>'
                : '<span class="badge-full">সব চালু</span>';
            const active = currentShop && currentShop.institutionId === r.institutionId ? ' active' : '';
            return '<div class="shop-item' + active + '" data-id="' + r.institutionId + '">' +
                '<div><div class="si-name">' + esc(r.institutionName || ('#' + r.institutionId)) + '</div>' +
                '<div class="si-sub">#' + r.institutionId + (r.phone ? ' · ' + esc(r.phone) : '') + (r.userName ? ' · ' + esc(r.userName) : '') + '</div></div>' +
                badge + '</div>';
        }).join('');
        $('#shopList').html(html);
    }

    function openShop(id) {
        if (!id) return;
        $('.shop-item').removeClass('active');
        $('.shop-item[data-id="' + id + '"]').addClass('active');
        $('#pageEmpty').html('<div class="spinner-border spinner-border-sm me-1"></div> লোড হচ্ছে...').show();
        $('#pageEditor').hide();
        $.get('/api/shop-page-access/' + id).done(function (res) {
            if (!res || !res.success) { toast((res && res.message) || 'লোড ব্যর্থ', 'error'); return; }
            currentShop = res.shop;
            tableReady = res.tableReady !== false;
            $('#tableWarn').toggle(!tableReady);
            savedBlocked = res.blockedPages || [];
            $('#shopTitle').text((currentShop.institutionName || '') + '  #' + currentShop.institutionId);
            renderSections();
            applyBlocked(savedBlocked);
            $('#pageEmpty').hide();
            $('#pageEditor').show();
        }).fail(function (xhr) {
            $('#pageEmpty').html(esc(parseError(xhr) || 'লোড ব্যর্থ'));
        });
    }

    function save() {
        if (!currentShop) return;
        if (!tableReady) { toast('আগে 02_create.sql চালান (ShopPageBlock টেবিল নেই)', 'error'); return; }
        const blocked = currentBlocked();
        const $btn = $('#btnSave').prop('disabled', true);
        $.ajax({
            url: '/api/shop-page-access/' + currentShop.institutionId,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ blockedPages: blocked })
        }).done(function (res) {
            if (res && res.success) {
                savedBlocked = res.blockedPages || blocked;
                toast(res.message || 'সেভ হয়েছে', 'success');
                updateSummary();
                loadShops();
            } else {
                toast((res && res.message) || 'সেভ ব্যর্থ', 'error');
            }
        }).fail(function (xhr) {
            toast(parseError(xhr) || 'সেভ ব্যর্থ', 'error');
        }).always(function () { $btn.prop('disabled', false); });
    }

    // ── UI ────────────────────────────────────────────────────────────────────
    function renderSections() {
        const html = catalog.map(function (s, i) {
            const pages = (s.pages || []).map(function (p) {
                return '<label class="pa-page"><input type="checkbox" data-key="' + esc(p.key) + '" checked> ' +
                    '<span>' + esc(p.bn) + ' <small class="text-muted">(' + esc(p.en) + ')</small></span></label>';
            }).join('');
            return '<div class="pa-section">' +
                '<div class="pa-section-head"><input type="checkbox" id="sec' + i + '" checked>' +
                '<label for="sec' + i + '">' + esc(s.bn) + '</label><span class="pa-count"></span></div>' +
                '<div class="pa-pages">' + pages + '</div></div>';
        }).join('');
        $('#sections').html(html);
    }

    function applyBlocked(blocked) {
        const set = new Set((blocked || []).map(function (k) { return String(k).toLowerCase(); }));
        $('#sections .pa-page input').each(function () {
            const on = !set.has(String($(this).data('key')).toLowerCase());
            this.checked = on;
            $(this).closest('.pa-page').toggleClass('off', !on);
        });
        syncSectionBoxes();
    }

    function setAll(on) {
        $('#sections .pa-page input').each(function () {
            this.checked = on;
            $(this).closest('.pa-page').toggleClass('off', !on);
        });
        syncSectionBoxes();
    }

    function currentBlocked() {
        return $('#sections .pa-page input').filter(function () { return !this.checked; })
            .map(function () { return String($(this).data('key')); }).get();
    }

    function syncSectionBoxes() {
        $('#sections .pa-section').each(function () {
            const $boxes = $(this).find('.pa-page input');
            const on = $boxes.filter(':checked').length;
            const head = $(this).find('.pa-section-head input')[0];
            head.checked = on === $boxes.length;
            head.indeterminate = on > 0 && on < $boxes.length;
            $(this).find('.pa-count').text(on + '/' + $boxes.length + ' চালু');
        });
        updateSummary();
    }

    function updateSummary() {
        const total = $('#sections .pa-page input').length;
        const off = currentBlocked().length;
        const dirty = off !== savedBlocked.length ||
            currentBlocked().some(function (k) { return savedBlocked.map(function (x) { return String(x).toLowerCase(); }).indexOf(k.toLowerCase()) < 0; });
        $('#pageSummary').html(
            (off === 0 ? '<span class="text-success fw-bold">সব পেজ চালু</span>' : '<span class="text-danger fw-bold">' + off + 'টি বন্ধ</span> / ' + total) +
            (dirty ? ' · <span class="text-warning fw-bold">সেভ করা হয়নি</span>' : ''));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    function emptyMsg(msg) { return '<div class="text-center text-muted py-4" style="font-size:.84rem;">' + esc(msg) + '</div>'; }

    function parseError(xhr) {
        try { return (xhr.responseJSON && xhr.responseJSON.message) || ''; } catch (e) { return ''; }
    }

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function toast(msg, type) {
        type = type || 'info';
        var $t = $('<div class="toast-item ' + type + '">' + esc(msg) + '</div>');
        $('#toastWrap').append($t);
        setTimeout(function () { $t.fadeOut(400, function () { $t.remove(); }); }, 3500);
    }
}());
