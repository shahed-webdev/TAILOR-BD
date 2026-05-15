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
            navHtml += '<div class="nav-section-title">' + t(section.title) + '</div>';
            visibleItems.forEach(function (item) {
                var isActive = item.key && item.key === pageKey ? ' active' : '';
                navHtml +=
                    '<a class="nav-item' + isActive + '" href="' + item.href + '">' +
                    '<i class="fas ' + item.icon + '"></i> ' + t(item.label) +
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

    // ── Language switcher ─────────────────────────────────────────────────────
    var LANG = localStorage.getItem('tailorbd_lang') || 'bn';

    var TRANSLATIONS = {
        bn: {
            // Sidebar section titles
            'Main': 'মেইন', 'Basic': 'বেসিক', 'Institution Details': 'প্রতিষ্ঠান তথ্য',
            'User Management': 'ইউজার ব্যবস্থাপনা', 'Sub Authority': 'সাব অথোরিটি',
            'Marketing': 'মার্কেটিং', 'Developer': 'ডেভেলপার',
            // Nav items
            'My Profile': 'আমার প্রোফাইল', 'Create Package': 'প্যাকেজ তৈরি',
            'SignUp Institution': 'প্রতিষ্ঠান নিবন্ধন', 'Create Invoice': 'ইনভয়েস তৈরি',
            'Collect Payment': 'পেমেন্ট গ্রহণ', 'Payment Report': 'পেমেন্ট রিপোর্ট',
            'Institution Details': 'প্রতিষ্ঠান বিস্তারিত',
            'Approve/Unlock User': 'ইউজার অনুমোদন', 'Role Management': 'রোল ব্যবস্থাপনা',
            'Create Sub Authority': 'সাব অথোরিটি তৈরি',
            'Marketing Reports': 'মার্কেটিং রিপোর্ট',
            'API Docs (Swagger)': 'API ডকস', 'Copy Shop Data': 'শপ ডাটা কপি',
            'Dashboard': 'ড্যাশবোর্ড', 'Logout': 'লগআউট',
            // Navbar titles
            'Authority Dashboard': 'অথোরিটি ড্যাশবোর্ড',
            'Sub Authority Dashboard': 'সাব অথোরিটি ড্যাশবোর্ড',
            'প্যাকেজ ম্যানেজমেন্ট': 'প্যাকেজ ম্যানেজমেন্ট',
            'নতুন ইনস্টিটিউশন নিবন্ধন': 'নতুন ইনস্টিটিউশন নিবন্ধন',
            'Invoice Management': 'ইনভয়েস ম্যানেজমেন্ট',
            'Approve / Unlock User': 'ইউজার অনুমোদন / আনলক',
            'Role Management': 'রোল ব্যবস্থাপনা',
            'Sub Authority ম্যানেজমেন্ট': 'সাব অথোরিটি ম্যানেজমেন্ট',
            'Marketing Reports': 'মার্কেটিং রিপোর্ট',
            'Copy Shop Data': 'শপ ডাটা কপি',
            'Back': 'ফিরে যান', 'Edit Profile': 'প্রোফাইল সম্পাদনা',
            'Change Password': 'পাসওয়ার্ড পরিবর্তন',
            'Authority Panel': 'অথোরিটি প্যানেল',
            'Authority': 'অথোরিটি', 'Sub Authority': 'সাব অথোরিটি',
            'আপনি কি লগআউট করতে চান?': 'আপনি কি লগআউট করতে চান?',
            'বাতিল': 'বাতিল'
        },
        en: {
            // Sidebar section titles
            'মেইন': 'Main', 'বেসিক': 'Basic', 'প্রতিষ্ঠান তথ্য': 'Institution Details',
            'ইউজার ব্যবস্থাপনা': 'User Management', 'সাব অথোরিটি': 'Sub Authority',
            'মার্কেটিং': 'Marketing', 'ডেভেলপার': 'Developer',
            // Nav items
            'আমার প্রোফাইল': 'My Profile', 'প্যাকেজ তৈরি': 'Create Package',
            'প্রতিষ্ঠান নিবন্ধন': 'SignUp Institution', 'ইনভয়েস তৈরি': 'Create Invoice',
            'পেমেন্ট গ্রহণ': 'Collect Payment', 'পেমেন্ট রিপোর্ট': 'Payment Report',
            'প্রতিষ্ঠান বিস্তারিত': 'Institution Details',
            'ইউজার অনুমোদন': 'Approve/Unlock User', 'রোল ব্যবস্থাপনা': 'Role Management',
            'সাব অথোরিটি তৈরি': 'Create Sub Authority',
            'মার্কেটিং রিপোর্ট': 'Marketing Reports',
            'API ডকস': 'API Docs (Swagger)', 'শপ ডাটা কপি': 'Copy Shop Data',
            'ড্যাশবোর্ড': 'Dashboard', 'লগআউট': 'Logout',
            // authority-profile page content
            'স্বাগতম': 'Welcome', 'রিফ্রেশ': 'Refresh',
            'নাম, মোবাইল, ছবি পরিবর্তন': 'Change name, mobile, photo',
            'পাসওয়ার্ড পরিবর্তন করুন': 'Change your password',
            'সব প্রতিষ্ঠানের তালিকা': 'List of all institutions',
            'এই মাস': 'This Month',
            'নতুন প্রতিষ্ঠান যুক্ত': 'New Institutions Added',
            'মাসিক আয় (৳)': 'Monthly Income (৳)',
            'বকেয়া Invoice সংখ্যা': 'Due Invoice Count',
            'প্রতিষ্ঠান পরিসংখ্যান': 'Institution Statistics',
            'সক্রিয় প্রতিষ্ঠান': 'Active Institutions',
            'নিষ্ক্রিয় প্রতিষ্ঠান': 'Inactive Institutions',
            'মোট প্রতিষ্ঠান': 'Total Institutions',
            'মোট আয় (৳)': 'Total Income (৳)',
            'মোট বকেয়া (৳)': 'Total Due (৳)',
            'মেয়াদ শেষ': 'Expired',
            'শীঘ্রই মেয়াদ শেষ': 'Expiring Soon',
            'দ্রুত নেভিগেশন': 'Quick Navigation',
            'নতুন যোগ করুন': 'Add New',
            'নতুন প্রতিষ্ঠান নিবন্ধন করুন': 'Register New Institution',
            'Invoice তৈরি করুন': 'Create Invoice',
            'বিল তৈরি ও ব্যবস্থাপনা': 'Bill creation & management',
            'পেমেন্ট গ্রহণ করুন': 'Receive Payment',
            'ব্যবহারকারী অনুমোদন করুন': 'Approve Users',
            'প্রতিষ্ঠান তালিকা': 'Institution List',
            'সব নির্বাচন': 'Select All',
            'Invoice তালিকা': 'Invoice List',
            'সব প্রতিষ্ঠান দেখুন': 'View All Institutions',
            'মার্কেটিং কার্যক্রম': 'Marketing Activities',
            'প্রতিষ্ঠান': 'Institution',
            'দ্রুত নির্বাচন': 'Quik Select',
            'প্যাকেজ তালিকা':'Package List',
            'প্যাকেজ': 'Package',
            'এই মাসে সংগৃহীত':'Collected Runing Month',
            'নতুন প্যাকেজ যোগ করুন':'Add New Package',

            // authority-package, signup, invoice, collect-payment, report pages
            'সব': 'All',
            'কার্যক্রম': 'Action',
            'মোট': 'Total',
            'নাম': 'Name',
            'ফোন': 'Phone',
            'মোট:': 'Total:',
            'রিসেট': 'Reset',
            'তারিখ': 'Date',
            'বিবরণ': 'Description',
            'ইমেইল': 'Email',
            'ডিলিট': 'Delete',
            'মূল্য': 'Price',
            'মেয়াদ': 'Expiry',
            'গত মাস': 'Last Month',
            'এই বছর': 'This Year',
            'পরিমাণ': 'Amount',
            'মাধ্যম': 'Method',
            'মোবাইল': 'Mobile',
            'জমা দিন': 'Submit',
            'সংগ্রাহক': 'Collector',
            'ফিরে যান': 'Go Back',
            'ছাড় (৳)': 'Discount (৳)',
            'পরিশোধিত': 'Paid',
            'শেষ ৭ দিন': 'Last 7 Days',
            'শেষ ৩০ দিন': 'Last 30 Days',
            'শেষ হচ্ছে': 'Expiring',
            'দোকান নাম': 'Shop Name',
            'সব Status': 'All Status',
            'সব মেয়াদ': 'All Expiry',
            'ইউজার নাম': 'Username',
            'মোট পরিমাণ': 'Total Amount',
            'তারিখ থেকে': 'From Date',
            'মেয়াদ দিন': 'Enter interval',
            'তথ্য দেখুন': 'View Data',
            'বকেয়া (৳)': 'Due (৳)',
            'বাতিল করুন': 'Cancel',
            'পায়না (৳)': 'Payable (৳)',
            'মোট বকেয়া': 'Total Due',
            'বকেয়া আছে': 'Has Due',
            'কোনো লগ নেই': 'No logs',
            'অটো-জেনারেট': 'Auto-Generate',
            'নাম অনুসারে': 'By Name',
            'মোট Invoice': 'Total Invoice',
            'স্টাফসংখ্যা': 'Staff Count',
            'পেমেন্ট করুন': 'Make Payment',
            'Invoice তৈরি': 'Create Invoice',
            'নতুন Invoice': 'New Invoice',
            'প্যাকেজ ও SMS': 'Package & SMS',
            'Invoice বিবরণ': 'Invoice Details',
            'প্যাকেজের নাম': 'Package Name',
            'কম বকেয়া আগে': 'Lowest Due First',
            'তারিখ পর্যন্ত': 'To Date',
            'বকেয়া আছে এমন': 'Has Due',
            'পূর্ববর্তী ধাপ': 'Previous Step',
            'মেয়াদ শেষ আগে': 'Expiry First',
            'পেমেন্ট সংগ্রহ': 'Collect Payment',
            'বকেয়া Invoice': 'Due Invoice',
            'Invoice তালিকা': 'Invoice List',
            'পেমেন্ট মাধ্যম': 'Payment Method',
            'এখনই চালু করুন': 'Run Now',
            'পেমেন্ট সংখ্যা': 'Payment Count',
            'নির্বাচিত Renew': 'Selected Renew',
            'বেশি বকেয়া আগে': 'Highest Due First',
            'পেমেন্ট রিপোর্ট': 'Payment Report',
            'পরবর্তী অটো-রান': 'Next Auto-Run',
            'পেমেন্ট জমা দিন': 'Submit Payment',
            'অ্যাকাউন্ট তথ্য': 'Account Info',
            'বিবরণ (Details)': 'Details',
            'আরেকটি যোগ করুন': 'Add Another',
            'মোট পায়না হবে:': 'Total payable:',
            'প্যাকেজ যোগ করুন': 'Add Package',
            'নিরাপত্তা প্রশ্ন': 'Security Question',
            'মেয়াদ শেষ হওয়া': 'Expired',
            'নিরাপত্তার উত্তর': 'Security Answer',
            '৭ দিনে মেয়াদ শেষ': 'Expiring in 7 days',
            'প্যাকেজ তৈরি করুন': 'Create Package',
            'বকেয়া প্রতিষ্ঠান': 'Institutions with Due',
            'প্রতিষ্ঠানের তথ্য': 'Institution Info',
            'পূর্ণ পায়না পূরণ': 'Fill Full Amount',
            'প্রতিষ্ঠান প্রদান': 'Institutions Paid',
            'প্যাকেজের নাম দিন': 'Enter package name',
            'কোনো line item নেই': 'No line items',
            'ডিলিট নিশ্চিত করুন': 'Confirm Delete',
            'নির্বাচিত প্রতিষ্ঠান': 'Selected Institution',
            'এই মাসে সংগ্রহীত (৳)': 'Collected This Month (৳)',
            'নিবন্ধন সফল হয়েছে!': 'Registration Successful!',
            'পেমেন্ট সংগ্রহ করুন': 'Collect Payment',
            'পরিশোধিত প্রতিষ্ঠান': 'Paid Institutions',
            'নিবন্ধন সম্পন্ন করুন': 'Complete Registration',
            'প্রতিদিন রাত ১২:০০ টায়': 'Every day at 12:00 AM',
            'সংগ্রহীত পেমেন্ট রিপোর্ট': 'Collected Payment Report',
            'বিনামূল্যে SMS ব্যালেন্স': 'Free SMS Balance',
            'নির্বাচিত সময়ে সংগ্রহীত (৳)': 'Collected in Period (৳)',
            'এই প্যাকেজটি ডিলিট হয়ে যাবে': 'This package will be deleted',
            'নতুন প্রতিষ্ঠান রেজিস্ট্রেশন করুন': 'Register New Institution',
            'নতুন প্রতিষ্ঠানটি সফলভাবে যোগ করা হয়েছে': 'New institution added successfully',
            'বামে প্রতিষ্ঠান নির্বাচন করুন অথবা নিচে ID দিন': 'Select institution from left or enter ID below',
            'প্রতিষ্ঠানসমূহের বকেয়া দেখুন এবং সহজে পেমেন্ট সংগ্রহ করুন': 'View dues and easily collect payments',
            'নতুন প্যাকেজ যোগ করুন এবং বিদ্যমান প্যাকেজগুলো পরিচালনা করুন': 'Add new packages and manage existing ones',
            'নতুন দোকান যোগ করুন এবং তাদের প্যাকেজ/সাবস্ক্রিপশন সেটআপ করুন': 'Add new shops and set up their packages/subscriptions',
            'সব প্রতিষ্ঠানের ইনভয়েস দেখুন ও তৈরি করুন, প্যাকেজ-রিনিউ ও পেমেন্ট ব্যবস্থাপনা করুন': 'View and create invoices, manage package renewals and payments'
        }
    };

    function t(key) {
        var dict = TRANSLATIONS[LANG];
        return (dict && dict[key]) ? dict[key] : key;
    }

    function applyLang(lang) {
        LANG = lang;
        window.AuthLang = lang;
        localStorage.setItem('tailorbd_lang', lang);
        document.documentElement.lang = lang;
        var btn = document.getElementById('langSwitchBtn');
        if (btn) {
            btn.innerHTML = lang === 'bn'
                ? '<i class="fas fa-globe me-1"></i>EN'
                : '<i class="fas fa-globe me-1"></i>\u09ac\u09be\u0982\u09b2\u09be';
        }
        document.querySelectorAll('[data-lang-key]').forEach(function (el) {
            var key = el.getAttribute('data-lang-key');
            el.textContent = t(key);
        });
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
            '<button id="langSwitchBtn" class="btn-navbar btn-navbar-outline" onclick="AuthLayout.switchLang()" title="Switch Language" style="font-size:.78rem;font-weight:700;min-width:64px;">' +
            (LANG === 'bn' ? '<i class="fas fa-globe me-1"></i>EN' : '<i class="fas fa-globe me-1"></i>\u09ac\u09be\u0982\u09b2\u09be') +
            '</button>' +
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
            '<p class="text-muted small mb-0">' + (LANG === 'bn' ? '\u0986\u09aa\u09a8\u09bf \u0995\u09bf \u09b2\u0997\u0986\u0989\u099f \u0995\u09b0\u09a4\u09c7 \u099a\u09be\u09a8?' : 'Are you sure you want to logout?') + '</p>' +
            '</div>' +
            '<div class="modal-footer border-0 pt-0 pb-4 px-4 gap-2 justify-content-center">' +
            '<button class="btn btn-light border px-4 rounded-pill" data-bs-dismiss="modal">' + (LANG === 'bn' ? '\u09ac\u09be\u09a4\u09bf\u09b2' : 'Cancel') + '</button>' +
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
        },
        switchLang: function () {
            var newLang = LANG === 'bn' ? 'en' : 'bn';
            localStorage.setItem('tailorbd_lang', newLang);
            window.location.reload();
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
    window.AuthLang = LANG;
    window.applyLang = applyLang;   // expose so dynamic renders can call it
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            initLayout();
            applyLang(LANG);
        });
    } else {
        initLayout();
        applyLang(LANG);
    }

})();
