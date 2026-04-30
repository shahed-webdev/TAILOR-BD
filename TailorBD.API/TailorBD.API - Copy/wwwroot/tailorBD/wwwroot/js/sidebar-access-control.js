// Sidebar Access Control for Sub-Admins
(function() {
    'use strict';

    // Check user permissions and hide/show menu items
    function applyAccessControl() {
        const category = sessionStorage.getItem('category');
        
        // If Admin or Authority, show everything
        if (category === 'Admin' || category === 'Authority') {
            console.log('Admin user - full access');
            return;
        }

        // If Sub-Admin, check permissions
        if (category === 'Sub-Admin') {
            console.log('Sub-Admin user - checking permissions');
            checkSubAdminAccess();
        }
    }

    // Check sub admin access permissions
    function checkSubAdminAccess() {
        const institutionId = sessionStorage.getItem('institutionId');
        const registrationId = sessionStorage.getItem('registrationId');

        if (!institutionId || !registrationId) {
            console.error('Missing institution or registration ID');
            return;
        }

        $.ajax({
            url: `/api/access/permissions/${institutionId}/${registrationId}`,
            method: 'GET',
            success: function(response) {
                if (response.success && response.data) {
                    const permissions = response.data;
                    console.log('User permissions:', permissions);
                    
                    // Get list of allowed page URLs
                    const allowedUrls = permissions.map(p => {
                        const url = (p.PageURL || p.pageURL || '').toLowerCase();
                        const location = (p.Location || p.location || '').toLowerCase();
                        return { url, location };
                    });

                    console.log('Allowed URLs:', allowedUrls);

                    // Hide menu items that user doesn't have access to
                    $('.sidebar-menu a[href]').each(function() {
                        const href = $(this).attr('href');
                        
                        // Skip non-page links
                        if (!href || href === '#' || href.startsWith('javascript:')) {
                            return;
                        }

                        const normalizedHref = href.toLowerCase().replace(/^\//, '');
                        
                        // Check if user has access
                        const hasAccess = allowedUrls.some(p => {
                            return normalizedHref.includes(p.url) || 
                                   normalizedHref.includes(p.location) ||
                                   p.url.includes(normalizedHref) ||
                                   p.location.includes(normalizedHref);
                        });

                        if (!hasAccess) {
                            // Hide the menu item
                            $(this).parent('li').hide();
                            console.log('Hiding menu:', href);
                        }
                    });

                    // Hide empty submenus
                    $('.submenu').each(function() {
                        if ($(this).find('li:visible').length === 0) {
                            $(this).closest('.menu-item-has-children').hide();
                        }
                    });
                } else {
                    console.warn('No permissions found - hiding all menus except dashboard');
                    // Hide everything except dashboard
                    $('.sidebar-menu li').not(':has(a[href="/dashboard.html"])').hide();
                }
            },
            error: function(xhr) {
                console.error('Error loading permissions:', xhr);
                // On error, show alert but don't hide menus (safer for UX)
                console.warn('Failed to load permissions - allowing all access as fallback');
            }
        });
    }

    // Initialize on sidebar load
    function initAccessControl() {
        // Wait for sidebar to load
        const checkSidebar = setInterval(() => {
            if ($('.sidebar-menu').length) {
                clearInterval(checkSidebar);
                applyAccessControl();
            }
        }, 100);

        // Timeout after 5 seconds
        setTimeout(() => {
            clearInterval(checkSidebar);
        }, 5000);
    }

    // Run when document is ready
    $(document).ready(function() {
        // Wait a bit for components to load
        setTimeout(initAccessControl, 500);
    });

    // Also export for manual trigger
    window.applyAccessControl = applyAccessControl;

})();
