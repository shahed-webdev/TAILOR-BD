/**
 * authority-layout.js
 * Shared sidebar + navbar component for all Authority Panel pages.
 * Usage: <script src="/js/authority-layout.js" data-page="profile"></script>
 *
 * data-page values:
 *   profile | package | signup | invoice | collect-payment | users | roles
 */
(function () {
    'use strict';

    // ── Navigation definition ─────────────────────────────────────────────────
    var NAV = [
        {
            title: 'Main',
            items: [
                { key: 'profile', href: '/authority-profile.html', icon: 'fa-user-circle', label: 'My Profile' }
            ]
        },
        {
            title: 'Basic',
            items: [
                { key: 'package',                   href: '/authority-package.html',                   icon: 'fa-box-open',         label: 'Create Package' },
                { key: 'signup',                    href: '/authority-signup.html',                    icon: 'fa-building',         label: 'SignUp Institution' },
                { key: 'invoice',                   href: '/authority-invoice.html',                   icon: 'fa-file-invoice',     label: 'Create Invoice' },
                { key: 'collect-payment',           href: '/authority-collect-payment.html',           icon: 'fa-hand-holding-usd', label: 'Collect Payment' },
                { key: 'collected-payment-report',  href: '/authority-collected-payment-report.html',  icon: 'fa-receipt',          label: 'Payment Report' }
            ]
        },
        {
            title: 'Institution Details',
            items: [
                { key: 'institution-details', href: '/authority-institution-details.html', icon: 'fa-list-alt', label: 'Institution Details' }
            ]
        },
        {
            title: 'User Management',
            items: [
                { key: 'users', href: '/authority-users.html', icon: 'fa-user-check',  label: 'Approve/Unlock User' },
                { key: 'roles', href: '/authority-roles.html', icon: 'fa-shield-alt',  label: 'Role Management' }
            ]
        },
        {
            title: 'Sub Authority',
            items: [
                { key: 'sub-authority', href: '/authority-sub-authority.html', icon: 'fa-user-plus', label: 'Create Sub Authority' }
            ]
        },
        {
            title: 'Marketing',
            items: [
                { key: 'marketing', href: '/authority-marketing.html', icon: 'fa-chart-line', label: 'Marketing Reports' }
            ]
        },
        {
            title: 'Developer',
            items: [
                { key: 'api-docs', href: '/swagger/index.html', icon: 'fa-code', label: 'API Docs (Swagger)' },
                { key: 'copy-shop-data', href: '/authority-copy-shop-data.html', icon: 'fa-copy', label: 'Copy Shop Data' }
            ]
        }
    ];

    // ── Page navbar titles ────────────────────────────────────────────────────
    var NAVBAR_TITLES = {
        'profile':              { icon: 'fa-tachometer-alt',  label: 'Authority Dashboard' },
        'sub-dashboard':        { icon: 'fa-tachometer-alt',  label: 'Sub Authority Dashboard' },
        'institution-details':  { icon: 'fa-list-alt',        label: 'Institution Details' },
        'package':              { icon: 'fa-box-open',         label: 'প্যাকেজ ম্যানেজমেন্ট' },
        'signup':               { icon: 'fa-building',         label: 'নতুন ইনস্টিটিউশন নিবন্ধন' },
        'invoice':              { icon: 'fa-file-invoice',     label: 'Invoice Management' },
        'collect-payment':      { icon: 'fa-hand-holding-usd', label: 'Collect Payment', color: '#10b981' },
        'collected-payment-report':    { icon: 'fa-receipt',          label: 'Payment Report',  color: '#6366f1' },
        'users':                { icon: 'fa-user-check',       label: 'Approve / Unlock User' },
        'roles':                { icon: 'fa-shield-alt',       label: 'Role Management' },
        'sub-authority':        { icon: 'fa-user-plus',        label: 'Sub Authority ম্যানেজমেন্ট' },
        'marketing':            { icon: 'fa-chart-line',       label: 'Marketing Reports' },
        'copy-shop-data':       { icon: 'fa-copy',             label: 'Copy Shop Data' }
    };

    // ── Determine current page key ────────────────────────────────────────────
    var currentScript = document.currentScript ||
        (function () {
            var scripts = document.getElementsByTagName('script');
            return scripts[scripts.length - 1];
        })();
    var pageKey = (currentScript && currentScript.getAttribute('data-page')) || '';

    // ── Build sidebar HTML ────────────────────────────────────────────────────
    function buildSidebar(filteredKeys) {
        var isSubAuthority = filteredKeys !== null; // null means Authority (show all)
        var navHtml = '';

        NAV.forEach(function (section) {
            // Sub Authority: skip sections that have no accessible items
            var visibleItems = section.items.filter(function (item) {
                if (!isSubAuthority) return true; // Authority sees everything
                if (!item.key) return false;       // hide items with no key for Sub Authority
                return filteredKeys.indexOf(item.key) !== -1;
            });
            if (visibleItems.length === 0) return; // skip empty sections

            navHtml += '<div class="nav-section">';
            navHtml += '<div class="nav-section-title">' + section.title + '</div>';
            visibleItems.forEach(function (item) {
                var isActive = item.key && item.key === pageKey ? ' active' : '';
                navHtml +=
                    '<a class="nav-item' + isActive + '" href="' + item.href + '">' +
                    '<i class="fas ' + item.icon + '"></i> ' + item.label +
                    '</a>';
            });
            navHtml += '</div>';
        });

        // Dashboard link for Sub Authority
        if (isSubAuthority) {
            navHtml =
                '<div class="nav-section">' +
                '<div class="nav-section-title">Main</div>' +
                '<a class="nav-item' + (pageKey === 'sub-dashboard' ? ' active' : '') + '" href="/authority-sub-profile.html">' +
                '<i class="fas fa-home"></i> Dashboard' +
                '</a>' +
                '</div>' +
                navHtml;
        }

        navHtml +=
            '<div class="nav-section" style="margin-top:auto;padding-bottom:16px;">' +
            '<a class="nav-item" onclick="AuthLayout.confirmLogout()" style="color:#f87171;cursor:pointer;">' +
            '<i class="fas fa-sign-out-alt"></i> Logout' +
            '</a>' +
            '</div>';

        var roleLabel = isSubAuthority ? 'Sub Authority' : 'Authority';
        var roleBadge = isSubAuthority ? '<small><i class="fas fa-user-shield me-1"></i>Sub Authority</small>' : '<small>Authority Panel</small>';

        return (
            '<div class="sidebar-overlay" id="sidebarOverlay" onclick="AuthLayout.closeSidebar()"></div>' +
            '<aside class="auth-sidebar" id="authSidebar">' +
            '<div class="sidebar-brand">' +
            '<img src="/images/logo.png" alt="TailorBD" style="height:34px;width:auto;max-width:150px;object-fit:contain;">' +
            '</div>' +
            '<div class="auth-user-strip">' +
            '<img id="sidebarAvatar" src="https://ui-avatars.com/api/?name=Authority&background=6366f1&color=fff&size=100&bold=true" alt="avatar">' +
            '<div class="user-meta">' +
            '<h4 id="sidebarName">Authority</h4>' +
            '<span><i class="fas fa-shield-alt me-1"></i>' + roleLabel + '</span>' +
            '</div>' +
            '</div>' +
            navHtml +
            '</aside>'
        );
    }

    // ── Build navbar HTML ─────────────────────────────────────────────────────
    function buildNavbar() {
        var info = NAVBAR_TITLES[pageKey] || { icon: 'fa-tachometer-alt', label: 'Authority Panel' };
        var color = info.color || '#6366f1';
        var isSubAuthority = sessionStorage.getItem('category') === 'Sub-Authority';
        var backHref = isSubAuthority ? '/authority-sub-profile.html' : '/authority-profile.html';

        var extraBtns = '';
        if (pageKey === 'profile' && !isSubAuthority) {
            extraBtns =
                '<button class="btn-navbar btn-navbar-outline" onclick="showEditForm()">' +
                '<i class="fas fa-user-edit"></i>' +
                '<span class="d-none d-sm-inline"> Edit Profile</span>' +
                '</button>' +
                '<button class="btn-navbar btn-navbar-outline" onclick="togglePwdSection()">' +
                '<i class="fas fa-key"></i>' +
                '<span class="d-none d-sm-inline"> Change Password</span>' +
                '</button>';
        } else if (pageKey === 'profile' && isSubAuthority) {
            extraBtns =
                '<a href="' + backHref + '" class="btn-navbar btn-navbar-outline">' +
                '<i class="fas fa-arrow-left"></i>' +
                '</a>';
        } else {
            extraBtns =
                '<a href="' + backHref + '" class="btn-navbar btn-navbar-outline">' +
                '<i class="fas fa-arrow-left"></i>' +
                '<span class="d-none d-sm-inline"> Back</span>' +
                '</a>';
        }

        return (
            '<nav class="auth-navbar">' +
            '<button class="navbar-toggle" id="menuToggle" onclick="AuthLayout.openSidebar()">' +
            '<i class="fas fa-bars"></i>' +
            '</button>' +
            '<span class="navbar-title" id="navbarTitle">' +
            '<i class="fas ' + info.icon + ' me-2" style="color:' + color + ';"></i>' + info.label +
            '</span>' +
            '<div class="navbar-right">' +
            extraBtns +
            '<button class="btn-navbar btn-navbar-danger" onclick="AuthLayout.confirmLogout()">' +
            '<i class="fas fa-sign-out-alt"></i>' +
            '<span class="d-none d-md-inline">Logout</span>' +
            '</button>' +
            '</div>' +
            '</nav>'
        );
    }

    // ── Logout modal HTML ─────────────────────────────────────────────────────
    function buildLogoutModal() {
        return (
            '<div class="modal fade" id="logoutModal" tabindex="-1">' +
            '<div class="modal-dialog modal-dialog-centered modal-sm">' +
            '<div class="modal-content border-0 rounded-4 shadow">' +
            '<div class="modal-body text-center p-4">' +
            '<div style="width:56px;height:56px;background:#fef2f2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;">' +
            '<i class="fas fa-sign-out-alt" style="color:#ef4444;font-size:1.3rem;"></i>' +
            '</div>' +
            '<h5 style="font-weight:700;margin-bottom:6px;">Logout?</h5>' +
            '<p class="text-muted small mb-0">আপনি কি লগআউট করতে চান?</p>' +
            '</div>' +
            '<div class="modal-footer border-0 pt-0 pb-4 px-4 gap-2 justify-content-center">' +
            '<button class="btn btn-light border px-4 rounded-pill" data-bs-dismiss="modal">বাতিল</button>' +
            '<button class="btn btn-danger px-4 rounded-pill" onclick="AuthLayout.doLogout()">Logout</button>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>'
        );
    }

    // ── Inject into DOM ───────────────────────────────────────────────────────
    function inject(filteredKeys) {
        var body = document.body;

        // 1. Sidebar + overlay
        var sidebarDiv = document.createElement('div');
        sidebarDiv.innerHTML = buildSidebar(filteredKeys);
        while (sidebarDiv.firstChild) {
            body.insertBefore(sidebarDiv.firstChild, body.firstChild);
        }

        // 2. Navbar
        var authMain = document.querySelector('.auth-main');
        if (authMain) {
            var navbarDiv = document.createElement('div');
            navbarDiv.innerHTML = buildNavbar();
            authMain.insertBefore(navbarDiv.firstChild, authMain.firstChild);
        }

        // 3. Logout modal
        if (!document.getElementById('logoutModal')) {
            var modalDiv = document.createElement('div');
            modalDiv.innerHTML = buildLogoutModal();
            body.appendChild(modalDiv.firstChild);
        }
    }

    // ── Load user info into sidebar ───────────────────────────────────────────
    function loadSidebarUser() {
        var username = sessionStorage.getItem('username');
        if (!username) return;

        fetch('/api/profile/by-username/' + encodeURIComponent(username))
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (!res.success || !res.data) return;
                var data = res.data;
                var nameEl   = document.getElementById('sidebarName');
                var avatarEl = document.getElementById('sidebarAvatar');
                if (nameEl)   nameEl.textContent = data.name || 'Authority';
                if (avatarEl) {
                    avatarEl.src = (data.image && data.image.length > 0)
                        ? '/api/profile/' + data.registrationID + '/image'
                        : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(data.name || 'A') +
                          '&background=6366f1&color=fff&size=100&bold=true';
                }
            })
            .catch(function () {});
    }

    // ── Public API ────────────────────────────────────────────────────────────
    window.AuthLayout = {
        openSidebar: function () {
            var s = document.getElementById('authSidebar');
            var o = document.getElementById('sidebarOverlay');
            if (s) s.classList.add('open');
            if (o) o.classList.add('open');
        },
        closeSidebar: function () {
            var s = document.getElementById('authSidebar');
            var o = document.getElementById('sidebarOverlay');
            if (s) s.classList.remove('open');
            if (o) o.classList.remove('open');
        },
        confirmLogout: function () {
            var modal = document.getElementById('logoutModal');
            if (modal && window.bootstrap) {
                new bootstrap.Modal(modal).show();
            }
        },
        doLogout: function () {
            if (window.TailorAuth) TailorAuth.logout();
        }
    };

    // Legacy aliases so existing onclick="confirmLogout()" / doLogout() keep working
    window.confirmLogout = window.AuthLayout.confirmLogout;
    window.doLogout      = window.AuthLayout.doLogout;
    window.openSidebar   = window.AuthLayout.openSidebar;
    window.closeSidebar  = window.AuthLayout.closeSidebar;

    // ── Determine role and build layout ──────────────────────────────────────
    function initLayout() {
        if (window.TailorAuth) TailorAuth.restore();
        var category     = sessionStorage.getItem('category');
        var registrationId = sessionStorage.getItem('registrationId');

        if (category === 'Sub-Authority' && registrationId) {
            // Fetch only assigned pages for this Sub Authority
            fetch('/api/subadmin/my-pages/' + registrationId)
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    var keys = [];
                    if (res.success && res.data && res.data.length) {
                        keys = res.data.map(function (p) { return p.key; });
                    }
                    inject(keys);
                    loadSidebarUser();
                })
                .catch(function () {
                    inject([]);
                    loadSidebarUser();
                });
        } else {
            // Authority → show full sidebar
            inject(null);
            loadSidebarUser();
        }
    }

    // ── Run ───────────────────────────────────────────────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLayout);
    } else {
        initLayout();
    }

})();
