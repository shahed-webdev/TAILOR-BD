// Sidebar JavaScript
(function() {
    'use strict';

    // Wait for DOM to be ready
    $(document).ready(function() {
        initializeSidebar();
    });

    function initializeSidebar() {
        // Mobile toggle
        $('#sidebarToggle').on('click', function() {
            $('#sidebar').toggleClass('active');
            $('#sidebarOverlay').toggleClass('active');
        });

        // Close sidebar when clicking overlay
        $('#sidebarOverlay').on('click', function() {
            $('#sidebar').removeClass('active');
            $(this).removeClass('active');
        });

        // Profile dropdown toggle
        $('#profileDropdownToggle').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $('#profileDropdownMenu').toggleClass('show');
        });

        // Close dropdown when clicking outside
        $(document).on('click', function(e) {
            if (!$(e.target).closest('.profile-dropdown').length) {
                $('#profileDropdownMenu').removeClass('show');
            }
        });

        // Submenu toggle
        $('.menu-toggle').on('click', function(e) {
            e.preventDefault();
            const $parent = $(this).parent();
            
            // Close other open menus
            $('.menu-item-has-children').not($parent).removeClass('open');
            
            // Toggle current menu
            $parent.toggleClass('open');
        });

        // Load user info
        loadUserInfo();

        // Set active menu item based on current page
        setActiveMenuItem();
    }

    function loadUserInfo() {
        const userName = sessionStorage.getItem('userName') || 'Admin User';
        const userRole = sessionStorage.getItem('userRole');
        const userImage = sessionStorage.getItem('userImage');

        // Update username
        $('#sidebarUsername').text(userName.toUpperCase());

        // Update profile image if available
        if (userImage) {
            $('#sidebarProfileImage').attr('src', userImage);
        }

        // Show role badge if user is sub-admin
        if (userRole && userRole.toLowerCase() === 'subadmin') {
            $('#userRoleBadge').show();
        }
    }

    function setActiveMenuItem() {
        const currentPath = window.location.pathname;
        
        // Remove active class from all menu items
        $('.sidebar-menu li').removeClass('active');
        
        // Add active class to current page menu item
        $('.sidebar-menu a').each(function() {
            const href = $(this).attr('href');
            if (href && currentPath.includes(href)) {
                $(this).parent().addClass('active');
                
                // If it's a submenu item, open the parent menu
                if ($(this).closest('.submenu').length) {
                    $(this).closest('.menu-item-has-children').addClass('open');
                }
            }
        });
    }

    // Logout function
    window.logout = function() {
        if (confirm('আপনি কি লগআউট করতে চান?')) {
            // Clear session storage
            sessionStorage.clear();
            
            // Redirect to login page
            window.location.href = '/login.html';
        }
    };

})();
