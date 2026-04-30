// TailorBD - Shared Components Loader
// This file loads sidebar and navbar dynamically on all pages

(function() {
    'use strict';

    // ─── Restore session immediately on script load (before DOM ready) ───
    // sessionStorage is tab-specific; copy from localStorage when a new tab opens
    if (!sessionStorage.getItem('username') && localStorage.getItem('session_isLoggedIn') === 'true') {
        sessionStorage.setItem('username',        localStorage.getItem('session_username')       || '');
        sessionStorage.setItem('registrationId',  localStorage.getItem('session_registrationId') || '');
        sessionStorage.setItem('institutionId',   localStorage.getItem('session_institutionId')  || '');
        sessionStorage.setItem('institutionName', localStorage.getItem('session_institutionName')|| '');
        sessionStorage.setItem('category',        localStorage.getItem('session_category')       || '');
        sessionStorage.setItem('isLoggedIn', 'true');
        console.log('Session restored from localStorage for new tab');
    }
    // ─────────────────────────────────────────────────────────────────────

    // Configuration
    const config = {
        sidebarPath: '/components/sidebar.html',
        navbarPath: '/components/navbar.html',
        modalsPath: '/components/modals.html'
    };

    // Load component from HTML file
    async function loadComponent(path, targetSelector) {
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`Failed to load ${path}`);
            const html = await response.text();
            $(targetSelector).html(html);
            console.log(`Loaded component: ${path}`);
            return true;
        } catch (error) {
            console.error(`Error loading component ${path}:`, error);
            return false;
        }
    }

    // ── Due Access Block — সব পেজে চেক করা হবে ──────────────────────────
    // login / invoice পেজে চেক করা হবে না
    var SKIP_DUE_CHECK_PAGES = ['/login.html', '/access-denied.html', '/due-invoice.html', '/paid-invoice.html'];

    function showDueBlockOverlay(d) {
        var fmt = function (n) {
            return (n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
        };

        var CONTACT_HTML =
            '<div style="margin-top:14px;border-radius:12px;overflow:hidden;border:1.5px solid #e0d7f7;">' +
            '<div style="background:linear-gradient(135deg,#6c7ae0,#5a68c9);padding:10px 14px;color:#fff;font-size:.82rem;font-weight:700;display:flex;align-items:center;gap:6px;">' +
            '<i class="fas fa-headset"></i> ১০:০০ AM – ৫:০০ PM সাপোর্ট পাওয়া যাবে' +
            '</div>' +
            '<div style="display:flex;flex-wrap:wrap;gap:0;">' +
            '<div style="flex:1;min-width:110px;padding:12px 8px;text-align:center;border-right:1px solid #e5e7eb;">' +
            '<i class="fas fa-phone-alt" style="color:#6c7ae0;font-size:1.1rem;margin-bottom:4px;display:block;"></i>' +
            '<div style="font-size:.68rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">Office Phone</div>' +
            '<div style="font-size:.9rem;font-weight:800;color:#111;margin:3px 0 8px;">09638669966</div>' +
            '<a href="tel:09638669966" style="display:inline-block;padding:4px 10px;background:#fff;border:1.5px solid #6c7ae0;border-radius:20px;font-size:.7rem;font-weight:700;color:#6c7ae0;text-decoration:none;">' +
            '<i class="fas fa-phone me-1"></i>Call Now</a>' +
            '</div>' +
            '<div style="flex:1;min-width:110px;padding:12px 8px;text-align:center;border-right:1px solid #e5e7eb;">' +
            '<i class="fas fa-mobile-alt" style="color:#6c7ae0;font-size:1.1rem;margin-bottom:4px;display:block;"></i>' +
            '<div style="font-size:.68rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">Mobile Support</div>' +
            '<div style="font-size:.9rem;font-weight:800;color:#111;margin:3px 0 8px;">01739144141</div>' +
            '<a href="tel:01739144141" style="display:inline-block;padding:4px 10px;background:#fff;border:1.5px solid #6c7ae0;border-radius:20px;font-size:.7rem;font-weight:700;color:#6c7ae0;text-decoration:none;">' +
            '<i class="fas fa-phone me-1"></i>Call Mobile</a>' +
            '</div>' +
            '<div style="flex:1;min-width:110px;padding:12px 8px;text-align:center;">' +
            '<i class="fab fa-whatsapp" style="color:#25d366;font-size:1.2rem;margin-bottom:4px;display:block;"></i>' +
            '<div style="font-size:.68rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">WhatsApp</div>' +
            '<div style="font-size:.9rem;font-weight:800;color:#111;margin:3px 0 8px;">01739144141</div>' +
            '<a href="https://wa.me/8801739144141" target="_blank" style="display:inline-block;padding:4px 10px;background:#25d366;border:none;border-radius:20px;font-size:.7rem;font-weight:700;color:#fff;text-decoration:none;">' +
            '<i class="fab fa-whatsapp me-1"></i>Chat Now</a>' +
            '</div>' +
            '</div></div>';

        var html =
            '<div id="globalDueBlockOverlay" style="' +
            'position:fixed;top:0;left:0;right:0;bottom:0;z-index:999999;' +
            'background:rgba(0,0,0,0.88);' +
            'display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto;">' +
            '<div style="background:#fff;border-radius:16px;max-width:500px;width:100%;' +
            'box-shadow:0 20px 60px rgba(0,0,0,0.5);overflow:hidden;margin:auto;">' +

            // Header
            '<div style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:16px 22px;color:#fff;' +
            'display:flex;align-items:center;gap:10px;">' +
            '<i class="fas fa-exclamation-triangle" style="font-size:1.2rem;"></i>' +
            '<span style="font-size:1rem;font-weight:700;">⚠ বকেয়া বিজ্ঞপ্তি — অ্যাক্সেস বন্ধ</span>' +
            '</div>' +

            // Body
            '<div style="padding:22px 24px;text-align:center;">' +
            '<i class="fas fa-ban" style="font-size:3rem;color:#dc2626;margin-bottom:12px;display:block;"></i>' +
            '<p style="font-size:.93rem;color:#334155;margin-bottom:14px;line-height:1.6;">' +
            'আপনার প্রতিষ্ঠানের <strong style="color:#dc2626;font-size:1.1rem;">' + (d.dueCount || 0) + '</strong> টি বকেয়া ইনভয়েস রয়েছে।</p>' +

            '<div style="background:linear-gradient(135deg,#fef2f2,#fee2e2);border:1px solid #fecaca;border-radius:12px;padding:14px;margin-bottom:14px;">' +
            '<div style="font-size:.8rem;color:#64748b;margin-bottom:4px;">মোট বকেয়া পরিমাণ:</div>' +
            '<div style="font-size:1.7rem;font-weight:800;color:#dc2626;">৳' + fmt(d.totalDueAmount) + ' টাকা</div>' +
            '</div>' +

            '<div style="background:#fef2f2;border:2px solid #dc2626;border-radius:12px;padding:16px;margin-bottom:4px;">' +
            '<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:8px;">' +
            '<i class="fas fa-lock" style="color:#dc2626;font-size:1.2rem;"></i>' +
            '<span style="font-size:.95rem;font-weight:700;color:#dc2626;">সফটওয়্যার অ্যাক্সেস বন্ধ</span></div>' +
            '<p style="font-size:.86rem;color:#334155;margin:0;line-height:1.7;">' +
            'বকেয়া পরিশোধ না হওয়া পর্যন্ত সফটওয়্যারের <strong style="color:#dc2626;">সকল পেজ লক</strong> থাকবে।<br>' +
            'নিচের নম্বরে যোগাযোগ করে বিল পরিশোধ করুন।</p>' +
            '</div>' +

            CONTACT_HTML +

            '</div>' + // Body end

            // Footer — ইনভয়েস দেখুন বাটন
            '<div style="background:#f9fafb;padding:14px 20px;text-align:center;">' +
            '<a href="/due-invoice.html" style="display:inline-flex;align-items:center;gap:8px;' +
            'background:#6366f1;color:#fff;border:none;border-radius:8px;' +
            'padding:10px 22px;font-size:.95rem;font-weight:600;text-decoration:none;">' +
            '<i class="fas fa-file-invoice"></i> ইনভয়েস দেখুন' +
            '</a>' +
            '</div>' +

            '</div>' + // Card end
            '</div>'; // Overlay end

        $('body').append(html);

        // Overlay এর বাইরে click করলে কিছু হবে না — overlay সরানো যাবে না
        $('#globalDueBlockOverlay').on('click', function (e) {
            e.stopPropagation();
        });
    }
    // ─────────────────────────────────────────────────────────────────────

    // ── Due Notice JS — সব পেজে dynamically load করি ────────────────
    function loadDueNotice() {
        var currentPage = ('/' + window.location.pathname.replace(/^\//, '')).toLowerCase().replace(/\/+$/, '');
        var skipPages = ['/login.html', '/access-denied.html'];
        if (skipPages.indexOf(currentPage) !== -1) return;
        if (typeof window._dueNoticeLoaded !== 'undefined') return;
        window._dueNoticeLoaded = true;

        // dashboard এ already include আছে কিনা দেখি
        if ($('script[src*="due-notice"]').length) return;

        var s = document.createElement('script');
        s.src = '/js/due-notice.js';
        document.body.appendChild(s);
    }

    // Initialize all components
    async function initializeComponents() {
        console.log('Initializing shared components...' );

        // ── Due Access Block চেক — সব পেজে, component load এর আগে ──
        var isBlocked = false;
        await new Promise(function (resolve) {
            var currentPage = ('/' + window.location.pathname.replace(/^\//, '')).toLowerCase().replace(/\/+$/, '');
            if (SKIP_DUE_CHECK_PAGES.indexOf(currentPage) !== -1) {
                resolve();
                return;
            }
            var institutionId = sessionStorage.getItem('institutionId');
            if (!institutionId) { resolve(); return; }

            $.ajax({
                url: '/api/invoice/due-status/' + institutionId,
                method: 'GET',
                success: function (r) {
                    if (r.success && r.data && r.data.accessBlocked) {
                        isBlocked = true;
                        showDueBlockOverlay(r.data);
                    }
                    resolve(); // blocked হলেও components লোড করব (পেছনে)
                },
                error: function () { resolve(); }
            });
        });

        // Load sidebar
        if ($('#app-sidebar').length) {
            await loadComponent(config.sidebarPath, '#app-sidebar');
        }

        // Load navbar
        if ($('#app-navbar').length) {
            await loadComponent(config.navbarPath, '#app-navbar');
        }

        // Load модals
        if ($('#app-modals').length) {
            await loadComponent(config.modalsPath, '#app-modals');
        }

        // Initialize after all components loaded
        initializeEventHandlers();
        loadUserProfile();
        initializeLanguage();
        setActiveMenu();
        applyAccessControl();
        setupDashboardBackBtn(); // ✅ Dashboard back button
    }

    // ── Dashboard Back Button setup ───────────────────────────────────────
    function setupDashboardBackBtn() {
        const category    = sessionStorage.getItem('category');
        const currentPage = window.location.pathname.toLowerCase();

        // Determine which dashboard this role belongs to
        const dashboardUrls = {
            'Admin':      '/dashboard.html',
            'Full-Admin': '/dashboard.html',
            'Sub-Admin':  '/sub-admin-dashboard.html'
        };
        const dashboardUrl = dashboardUrls[category] || '/dashboard.html';

        // Don't show back btn on the dashboard page itself or on login
        const hiddenPages = [
            '/dashboard.html',
            '/sub-admin-dashboard.html',
            '/login.html'
        ];

        const $btn = $('#dashboardBackBtn');
        if (!$btn.length) return;

        if (hiddenPages.includes(currentPage)) {
            $btn.hide();
        } else {
            $btn.attr('href', dashboardUrl).show();
        }
    }

    // Initialize event handlers
    function initializeEventHandlers() {
        // Profile Dropdown Toggle
        $(document).on('click', '#profileDropdownToggle', function(e) {
            e.stopPropagation();
            e.preventDefault();
            $(this).toggleClass('active');
            $('#profileDropdownMenu').toggleClass('show');
        });

        // Close profile dropdown when clicking outside
        $(document).on('click', function(e) {
            if (!$(e.target).closest('.profile-dropdown').length) {
                $('#profileDropdownToggle').removeClass('active');
                $('#profileDropdownMenu').removeClass('show');
            }
        });

        // Modal triggers
        $(document).on('click', '[data-bs-toggle="modal"]', function(e) {
            e.preventDefault();
            const targetModal = $(this).attr('data-bs-target');
            const modal = new bootstrap.Modal(document.querySelector(targetModal));
            modal.show();
        });

        // Clean up modal backdrop
        $(document).on('hidden.bs.modal', '.modal', function () {
            $('.modal-backdrop').remove();
            $('body').removeClass('modal-open');
            $('body').css('overflow', '');
            $('body').css('padding-right', '');
        });

        // Menu Toggle
        $(document).on('click', '#menuToggle', function() {
            if (window.innerWidth <= 768) {
                $('#sidebar').toggleClass('show');
                $('#sidebarOverlay').toggleClass('show');
            } else {
                $('#sidebar').toggleClass('collapsed');
                $('#mainContent').toggleClass('full-width');
            }
        });

        // Close sidebar when clicking overlay
        $(document).on('click', '#sidebarOverlay', function() {
            $('#sidebar').removeClass('show');
            $('#sidebarOverlay').removeClass('show');
        });

        // Submenu Toggle
        $(document).on('click', '.menu-toggle', function(e) {
            e.preventDefault();
            e.stopPropagation(); // prevent bubbling to parent menu-toggle
            const $this = $(this);
            const $parent = $this.parent();
            const $submenu = $parent.children('.submenu');

            const isNested = $parent.closest('.submenu').length > 0;

            if (isNested) {
                // Nested submenu: only toggle this one, keep parent open
                $submenu.toggleClass('show');
                $this.toggleClass('active');
            } else {
                // Top-level: close other top-level submenus, keep nested state
                $('.sidebar-menu > li > a.menu-toggle').not($this).each(function() {
                    $(this).removeClass('active');
                    $(this).parent().children('.submenu').removeClass('show');
                });

                $submenu.toggleClass('show');
                $this.toggleClass('active');
            }
        });

        // Submenu Links - prevent event bubbling to parent menu-toggle
        $(document).on('click', '.submenu a', function(e) {
            e.stopPropagation(); // Prevent event from bubbling up to parent menu-toggle
        });

        // Language Toggle
        $(document).on('click', '#langToggle', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Language toggle clicked');
            if (typeof window.toggleLanguage === 'function') {
                window.toggleLanguage();
            } else {
                console.error('toggleLanguage function not found');
            }
        });

        // Logout
        $(document).on('click', '[onclick="logout()"]', function(e) {
            e.preventDefault();
            window.logout();
        });
    }

    // Load User Profile
    function loadUserProfile() {
        const username = sessionStorage.getItem('username');
        const institutionId = sessionStorage.getItem('institutionId');
        const registrationId = sessionStorage.getItem('registrationId');

        if (!username) {
            console.log('No user logged in');
            return;
        }

        // Set basic user info
        $('#username, #sidebarUsername').text(username.toUpperCase());
        $('#userAvatar').text(username.charAt(0).toUpperCase());

        // Load institution info
        if (institutionId) {
            loadInstitutionInfo(institutionId);
        }

        // Load profile data if IDs available
        if (registrationId) {
            $.ajax({
                url: '/api/profile/by-username/' + encodeURIComponent(username),
                method: 'GET',
                success: function(response, status, xhr) {
                    if (response.success && response.data) {
                        const profile = response.data;
                        
                        // Store profile data globally for modal
                        window.currentProfile = profile;
                        
                        // Populate update info modal with current data
                        if (profile.name) $('#fullName').val(profile.name);
                        if (profile.designation) $('#profileDesignation').val(profile.designation);
                        if (profile.email) $('#profileEmail').val(profile.email);
                        if (profile.phone) $('#profilePhone').val(profile.phone);
                        if (profile.address) $('#profileAddress').val(profile.address);
                        
                        // Update profile image
                        if (profile.image && profile.image.length > 0) {
                            const imageUrl = '/api/profile/' + profile.registrationID + '/image';
                            $('#sidebarProfileImage, #modalProfileImage').attr('src', imageUrl);
                        } else if (profile.name) {
                            const avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profile.name) + '&background=667eea&color=fff&size=120&bold=true';
                            $('#sidebarProfileImage, #modalProfileImage').attr('src', avatarUrl);
                        }

                        // Update display name
                        if (profile.name) {
                            $('#sidebarUsername').text(profile.name.toUpperCase());
                            $('#username').text(profile.name);
                            $('#userAvatar').text(profile.name.charAt(0).toUpperCase());
                        }
                    }
                },
                error: function(xhr) {
                    console.error('Failed to load profile:', xhr);
                }
            });
        }
    }

    // Load Institution Info
    function loadInstitutionInfo(institutionId) {
        $.ajax({
            url: '/api/institution/' + institutionId,
            method: 'GET',
            success: function(response) {
                if (response.success && response.data) {
                    const institution = response.data;
                    
                    // Show institution info and hide page title
                    $('#institutionInfo').show();
                    $('#pageTitle').hide();
                    
                    // Update institution name
                    if (institution.institutionName) {
                        $('#institutionName').text(institution.institutionName);
                    }
                    
                    // Update institution logo
                    const logoUrl = '/api/institution/' + institutionId + '/logo';
                    $('#institutionLogo').attr('src', logoUrl).on('error', function() {
                        // If logo fails to load, hide the image
                        $(this).hide();
                    });
                    
                    console.log('Institution info loaded successfully');

                    // Mark session as ready so late subscribers can check the flag
                    window.appSessionReady = true;

                    // Notify pages that session + institution info is ready
                    $(document).trigger('app-session-ready');
                }
            },
            error: function(xhr) {
                console.error('Failed to load institution info:', xhr);
                // If institution info fails, keep showing page title
                $('#institutionInfo').hide();
                $('#pageTitle').show();
            }
        });
    }

    // Restore sessionStorage from localStorage if empty (new tab scenario)
    function restoreSessionFromLocalStorage() {
        if (!sessionStorage.getItem('username') && localStorage.getItem('session_isLoggedIn') === 'true') {
            sessionStorage.setItem('username', localStorage.getItem('session_username') || '');
            sessionStorage.setItem('registrationId', localStorage.getItem('session_registrationId') || '');
            sessionStorage.setItem('institutionId', localStorage.getItem('session_institutionId') || '');
            sessionStorage.setItem('institutionName', localStorage.getItem('session_institutionName') || '');
            sessionStorage.setItem('category', localStorage.getItem('session_category') || '');
            sessionStorage.setItem('isLoggedIn', 'true');
            console.log('Session restored from localStorage for new tab');
        }
    }

    // Initialize Language
    function initializeLanguage() {
        const savedLang = localStorage.getItem('preferredLanguage') || 'bn';
        window.currentLang = savedLang;
        window.updateLanguage();
    }

    // Set Active Menu based on current page
    function setActiveMenu() {
        const currentPath = window.location.pathname;
        
        // Find all menu links
        $('.sidebar-menu a').each(function() {
            const $link = $(this);
            const href = $link.attr('href');
            
            // Check if this link matches current page
            if (href && href !== '#' && currentPath.includes(href)) {
                $link.addClass('active');
                
                // Expand all ancestor submenus
                $link.parents('.submenu').each(function() {
                    $(this).addClass('show');
                    $(this).prev('.menu-toggle').addClass('active');
                });
                
                console.log('Active menu set for:', href);
            }
        });
    }

    // Apply Access Control - Hide menu items based on permissions
    function applyAccessControl() {
        const category = sessionStorage.getItem('category');
        
        // If Admin/Full-Admin or Authority, show everything
        if (category === 'Admin' || category === 'Full-Admin' || category === 'Authority') {
            console.log('Admin/Authority user - full access granted');
            $('#userRoleBadge').hide();
            $('#dashboardLink').attr('href', '/dashboard.html');
            return;
        }

        // If Sub-Admin, check permissions
        if (category === 'Sub-Admin') {
            console.log('Sub-Admin user - checking permissions...');
            $('#userRoleBadge').show();
            // Sub-Admin dashboard
            $('#dashboardLink').attr('href', '/sub-admin-dashboard.html');
            checkSubAdminAccess();
        } else {
            console.log('Unknown category:', category);
            $('#userRoleBadge').hide();
            $('#dashboardLink').attr('href', '/dashboard.html');
        }
    }

    // Check sub admin access permissions
    function checkSubAdminAccess() {
        const institutionId  = sessionStorage.getItem('institutionId');
        const registrationId = sessionStorage.getItem('registrationId');

        if (!institutionId || !registrationId) {
            console.error('Missing institution or registration ID');
            return;
        }

        // Invoice pages are always accessible (no permission needed)
        const alwaysAllowedPages = [
            '/sub-admin-dashboard.html',
            '/sub-admin-profile.html',
            '/due-invoice.html',
            '/paid-invoice.html'
        ];

        $.ajax({
            url: `/api/access/permissions/${institutionId}/${registrationId}`,
            method: 'GET',
            success: function(response) {

                // ── Build allowed URL set (always lowercase, with leading /) ──
                const allowedHrefs = new Set();
                alwaysAllowedPages.forEach(p => allowedHrefs.add(p));

                if (response.success && response.data && response.data.length) {
                    console.log('Raw permissions from API:', response.data.length, response.data);

                    response.data.forEach(p => {
                        // Support both camelCase and PascalCase from Dapper dynamic
                        const raw = (p.PageURL ?? p.pageURL ?? p.pageUrl ?? '').trim();
                        if (!raw) return;

                        // NormalizeUrl already ran on server; just normalise casing & slash
                        let url = (raw.startsWith('/') ? raw : '/' + raw).toLowerCase();
                        // Remove trailing slash if any (but keep .html)
                        url = url.replace(/\/+$/, '');
                        allowedHrefs.add(url);
                    });

                    console.log('Allowed URLs:', [...allowedHrefs]);
                } else {
                    console.warn('No permissions returned — only dashboard and invoice allowed');
                }

                // ── 1. Show all sidebar items first, then hide disallowed ones ──
                $('.sidebar-menu li').show();

                let hiddenCount = 0;
                let matchedCount = 0;
                $('.sidebar-menu a[href]').each(function() {
                    const href = $(this).attr('href');
                    if (!href || href === '#' || href.startsWith('javascript:')) return;

                    let normHref = ('/' + href.replace(/^\//, '')).toLowerCase().replace(/\/+$/, '');
                    const hasAccess = allowedHrefs.has(normHref);

                    if (hasAccess) {
                        matchedCount++;
                    } else {
                        $(this).closest('li').hide();
                        hiddenCount++;
                        console.log('Sidebar link hidden (no permission):', normHref);
                    }
                });

                // Hide parent menu groups if ALL children are hidden
                // Process deepest level first, then bubble up
                $('.sidebar-menu .submenu').get().reverse().forEach(function(submenu) {
                    const $submenu = $(submenu);
                    const $visibleItems = $submenu.find('> li:visible');
                    if ($visibleItems.length === 0) {
                        $submenu.closest('li.menu-item-has-children').hide();
                    }
                });

                console.log(`Sidebar: ${matchedCount} links matched, ${hiddenCount} links hidden`);

                // ── 2. Page-level guard ──────────────────────────────────────
                const currentPage = ('/' + window.location.pathname.replace(/^\//, '')).toLowerCase().replace(/\/+$/, '');

                const skipGuard = [
                    '/sub-admin-dashboard.html',
                    '/login.html',
                    '/sub-admin-profile.html',
                    '/access-denied.html',
                    '/due-invoice.html',
                    '/paid-invoice.html'
                ];

                if (!skipGuard.includes(currentPage)) {
                    if (!allowedHrefs.has(currentPage)) {
                        console.warn('Access denied for:', currentPage, '→ /access-denied.html');
                        window.location.replace('/access-denied.html');
                    }
                }
            },
            error: function(xhr) {
                console.error('Error loading permissions:', xhr);
                const currentPage = window.location.pathname.toLowerCase();
                if (currentPage !== '/sub-admin-dashboard.html' && currentPage !== '/login.html') {
                    window.location.replace('/sub-admin-dashboard.html');
                }
            }
        });
    }

    // Global Language Update Function
    window.updateLanguage = function() {
        const lang = window.currentLang === 'en' ? 'en' : 'bn';
        document.documentElement.setAttribute('lang', lang);

        // Update all elements with lang-content class
        $('[data-en], [data-bn]').each(function() {
            const enText = $(this).attr('data-en');
            const bnText = $(this).attr('data-bn');
            const nextText = lang === 'en' ? enText : bnText;

            if (typeof nextText !== 'undefined') {
                try {
                    const $el = $(this);
                    if ($el.children().length === 0) {
                        $el.text(nextText);
                    } else {
                        const textNode = $el.contents().filter(function() {
                            return this.nodeType === 3;
                        }).first();
                        if (textNode.length) {
                            textNode.replaceWith(document.createTextNode(nextText));
                        } else {
                            $el.prepend(document.createTextNode(nextText));
                        }
                    }
                } catch (e) {
                    // silently ignore
                }
            }
        });

        // Update placeholders
        $('[data-en-placeholder], [data-bn-placeholder]').each(function() {
            const enText = $(this).attr('data-en-placeholder');
            const bnText = $(this).attr('data-bn-placeholder');
            const nextText = lang === 'en' ? enText : bnText;

            if (typeof nextText !== 'undefined') {
                $(this).attr('placeholder', nextText);
            }
        });
        
        // Update language toggle button text
        const langBtn = $('#langToggle .lang-content');
        if (lang === 'en') {
            langBtn.text('বাংলা');
        } else {
            langBtn.text('English');
        }
        
        console.log('Language updated to:', lang);
        
        // Update dropdown options if function exists (for new-order page)
        if (typeof window.updateNewOrderLanguage === 'function') {
            window.updateNewOrderLanguage();
        }
        
        // Update order-edit page if renderOrderItems exists
        if (typeof window.renderOrderItems === 'function') {
            window.renderOrderItems();
        }
        
        // Update dress details language in delivery pages
        if (typeof window.updateDressDetailsLanguage === 'function') {
            window.updateDressDetailsLanguage();
        }
        
        // NOTE: Do NOT trigger 'languageChanged' here — causes infinite loop
        // Pages that need post-render updates should use window.onLanguageUpdated instead
    };

    // Global Language Toggle Function  
    window.toggleLanguage = function() {
        window.currentLang = window.currentLang === 'en' ? 'bn' : 'en';
        localStorage.setItem('preferredLanguage', window.currentLang);
        window.updateLanguage();
        
        // Trigger custom event AFTER updateLanguage completes (not inside it)
        $(document).trigger('languageChanged', [window.currentLang]);
    };

    // Global Logout Function
    window.logout = function() {
        // Show Bootstrap modal instead of browser confirm
        const logoutModal = new bootstrap.Modal(document.getElementById('logoutConfirmModal'));
        logoutModal.show();
    };

    // Confirm logout function
    window.confirmLogout = function() {
        // Clear session
        sessionStorage.clear();
        
        // Clear localStorage session data
        localStorage.removeItem('session_username');
        localStorage.removeItem('session_registrationId');
        localStorage.removeItem('session_institutionId');
        localStorage.removeItem('session_institutionName');
        localStorage.removeItem('session_category');
        localStorage.removeItem('session_isLoggedIn');
        
        // Redirect to login
        window.location.href = '/login.html';
    };

    // Global Update Profile Function
    window.updateProfile = function() {
        const registrationId = sessionStorage.getItem('registrationId');
        const institutionId = sessionStorage.getItem('institutionId');
        
        if (!registrationId) {
            alert('Registration ID not found');
            return;
        }

        const name = $('#fullName').val().trim();
        const designation = $('#profileDesignation').val().trim();
        const email = $('#profileEmail').val().trim();
        const phone = $('#profilePhone').val().trim();
        const address = $('#profileAddress').val().trim();
        const imageFile = $('#profileImageInput')[0].files[0];

        if (!name || !email || !phone) {
            alert(window.currentLang === 'en' ? 'Please fill all required fields' : 'দয়া করে সম্পূর্ণ সমস্ত প্রয়োজনীয় ক্ষেত্র পূরণ করুন');
            return;
        }

        // Show loading on button
        const $btn = $('.modal-footer button.btn-primary');
        const originalHtml = $btn.html();
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span>Updating...');

        // Prepare data
        const data = {
            name: name,
            designation: designation,
            email: email,
            phone: phone,
            address: address,
            institutionID: parseInt(institutionId)
        };

        // Update profile info
        $.ajax({
            url: '/api/profile/' + registrationId,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(response) {
                if (response.success) {
                    // Upload image if selected
                    if (imageFile) {
                        const formData = new FormData();
                        formData.append('image', imageFile);

                        $.ajax({
                            url: '/api/profile/' + registrationId + '/image',
                            method: 'POST',
                            data: formData,
                            processData: false,
                            contentType: false,
                            success: function() {
                                showSuccess();
                            },
                            error: function() {
                                showSuccess(); // Still show success for profile update
                            }
                        });
                    } else {
                        showSuccess();
                    }
                } else {
                    alert(response.message || 'Update failed');
                    $btn.prop('disabled', false).html(originalHtml);
                }
            },
            error: function(xhr) {
                console.error('Error updating profile:', xhr);
                alert('Failed to update profile');
                $btn.prop('disabled', false).html(originalHtml);
            }
        });

        function showSuccess() {
            alert(window.currentLang === 'en' ? 'Profile updated successfully!' : 'প্রোফাইল সফলভাবে আপডেট হয়েছে!');
            $btn.prop('disabled', false).html(originalHtml);
            bootstrap.Modal.getInstance(document.getElementById('updateInfoModal')).hide();
            loadUserProfile(); // Reload profile
        }
    };

    // Global Change Password Function
    window.changePassword = function() {
        const username = sessionStorage.getItem('username');
        const currentPassword = $('#currentPassword').val();
        const newPassword = $('#newPassword').val();
        const confirmPassword = $('#confirmPassword').val();

        // Validate
        $('#passwordError, #passwordSuccess').hide();

        if (!currentPassword || !newPassword || !confirmPassword) {
            $('#passwordError').text('All fields are required').show();
            return;
        }

        if (newPassword.length < 6) {
            $('#passwordError').text('Password must be at least 6 characters').show();
            return;
        }

        if (newPassword !== confirmPassword) {
            $('#passwordError').text('Passwords do not match').show();
            return;
        }

        // Show loading
        const $btn = $('#changePasswordModal .modal-footer button.btn-primary');
        const originalHtml = $btn.html();
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span>Changing...');

        $.ajax({
            url: '/api/auth/change-password',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                username: username,
                currentPassword: currentPassword,
                newPassword: newPassword
            }),
            success: function(response) {
                if (response.success) {
                    $('#passwordSuccess').text('Password changed successfully!').show();
                    $('#changePasswordForm')[0].reset();
                    setTimeout(() => {
                        bootstrap.Modal.getInstance(document.getElementById('changePasswordModal')).hide();
                        $('#passwordSuccess').hide();
                    }, 2000);
                } else {
                    $('#passwordError').text(response.message || 'Failed to change password').show();
                }
                $btn.prop('disabled', false).html(originalHtml);
            },
            error: function(xhr) {
                console.error('Error changing password:', xhr);
                const response = xhr.responseJSON;
                $('#passwordError').text(response && response.message ? response.message : 'Failed to change password').show();
                $btn.prop('disabled', false).html(originalHtml);
            }
        });
    };

    // Global Toggle Password Field Function
    window.togglePasswordField = function(fieldId) {
        const field = $('#' + fieldId);
        const icon = field.next().find('i');
        
        if (field.attr('type') === 'password') {
            field.attr('type', 'text');
            icon.removeClass('fa-eye').addClass('fa-eye-slash');
        } else {
            field.attr('type', 'password');
            icon.removeClass('fa-eye-slash').addClass('fa-eye');
        }
    };

    // Auto-initialize when DOM is ready
    $(document).ready(function() {
        initializeComponents();
        loadDueNotice();
    });

    // Export for external use
    window.AppComponents = {
        reload: initializeComponents,
        loadProfile: loadUserProfile,
        updateLanguage: window.updateLanguage,
        applyAccessControl: applyAccessControl // ✅ Export access control
    };

})();
