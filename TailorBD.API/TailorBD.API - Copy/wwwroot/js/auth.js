/**
 * auth.js  — TailorBD shared authentication utility
 *
 * Problem solved:
 *   sessionStorage is TAB-SCOPED and wiped on every full-page navigation
 *   (<a href> link clicks, F5, new tab, browser restart).
 *   Every page guard that reads sessionStorage.getItem('isLoggedIn')
 *   sees null and immediately redirects to /login.html — causing the
 *   blank white page + redirect loop symptom.
 *
 * Solution:
 *   On every page load this script runs FIRST (synchronously, before jQuery
 *   document.ready) and restores sessionStorage from the localStorage mirror
 *   that login.html already writes.  All page guards then find the data they
 *   need inside sessionStorage as normal.
 *
 * Usage — add ONE line to the <head> of every protected HTML page,
 * BEFORE any other script:
 *
 *   <script src="/js/auth.js"></script>
 */

(function () {
    'use strict';

    var SESSION_KEYS = [
        'isLoggedIn',
        'username',
        'name',
        'phone',
        'category',
        'registrationId',
        'institutionId',
        'institutionName'
    ];

    // ?? 1. Restore sessionStorage from localStorage mirror ????????????????????
    // login.html already writes session_* keys to localStorage.
    // If sessionStorage is empty (new tab / full navigation) we copy them back.
    function restoreSession() {
        if (sessionStorage.getItem('isLoggedIn')) return; // already populated

        SESSION_KEYS.forEach(function (key) {
            var mirrored = localStorage.getItem('session_' + key);
            if (mirrored !== null) {
                sessionStorage.setItem(key, mirrored);
            }
        });
    }

    // ?? 2. Guard — redirect unauthenticated users to login ???????????????????
    // Pass the required category as an optional argument, e.g.
    //   TailorAuth.guard('Authority')   — Authority AND Sub-Authority may pass
    //   TailorAuth.guard()              — any logged-in user may pass
    function guard(requiredCategory) {
        restoreSession();

        var isLoggedIn = sessionStorage.getItem('isLoggedIn');
        var category   = sessionStorage.getItem('category');

        if (!isLoggedIn || isLoggedIn !== 'true') {
            // Not logged in at all — go to login
            window.location.replace('/login.html');
            return false;
        }

        if (requiredCategory === 'Authority') {
            // Allow both Authority and Sub-Authority
            if (category !== 'Authority' && category !== 'Sub-Authority') {
                var home = category === 'Admin' || category === 'Sub-Admin'
                    ? '/dashboard.html'
                    : '/login.html';
                window.location.replace(home);
                return false;
            }
            return true;
        }

        if (requiredCategory && category !== requiredCategory) {
            // Wrong role — bounce to their own home page
            var home2 = category === 'Authority'     ? '/authority-profile.html'
                      : category === 'Sub-Authority' ? '/authority-sub-profile.html'
                      : '/dashboard.html';
            window.location.replace(home2);
            return false;
        }

        return true;
    }

    // ?? 3. Logout — clear both stores and redirect ???????????????????????????
    function logout() {
        SESSION_KEYS.forEach(function (key) {
            localStorage.removeItem('session_' + key);
        });
        sessionStorage.clear();
        window.location.replace('/login.html');
    }

    // ?? 4. Get a session value (with lazy restore) ????????????????????????????
    function get(key) {
        restoreSession();
        return sessionStorage.getItem(key);
    }

    // ?? 5. Mirror a value set by login into localStorage ?????????????????????
    function set(key, value) {
        sessionStorage.setItem(key, value);
        localStorage.setItem('session_' + key, value);
    }

    // ── 6. Sub-Authority page access guard ───────────────────────────────────
    // Call on any Authority page to block Sub-Authority from unassigned pages.
    // Usage: TailorAuth.guardSubPage('signup');
    function guardSubPage(pageKey) {
        var category       = sessionStorage.getItem('category');
        var registrationId = sessionStorage.getItem('registrationId');

        if (category !== 'Sub-Authority') return; // Authority — no restriction

        // Fetch assigned pages and verify access
        fetch('/api/subadmin/my-pages/' + registrationId)
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (!res.success) {
                    window.location.replace('/authority-sub-profile.html');
                    return;
                }
                var keys = (res.data || []).map(function (p) { return p.key; });
                if (keys.indexOf(pageKey) === -1) {
                    window.location.replace('/authority-sub-profile.html');
                }
            })
            .catch(function () {
                window.location.replace('/authority-sub-profile.html');
            });
    }

    // ?? Public API ????????????????????????????????????????????????????????????
    window.TailorAuth = {
        restore:       restoreSession,
        guard:         guard,
        guardSubPage:  guardSubPage,
        logout:        logout,
        get:           get,
        set:           set
    };

    // Run restore immediately (synchronous — no DOMContentLoaded needed)
    restoreSession();

}());
