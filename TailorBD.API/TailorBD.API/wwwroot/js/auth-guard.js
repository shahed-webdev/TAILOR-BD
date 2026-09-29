/* auth-guard.js v1.2.0 — for pages whose APIs require the login token (JWT)
 * (cutting-issue, factory-issue, worker-payments, the delivery pages, the order
 *  pages (order-list, order-edit, update-order, quick-order, add-more-dress,
 *  dress-measurements, finish-order, money-receipt, order-measurements),
 *  print/invoice pages and all authority-*.html pages).
 *  - Token missing/expired      -> tell the user and go to /login.
 *  - Any API answers 401        -> same (jQuery calls and fetch() calls).
 *  - fetch() and jQuery calls to this site's /api/ get the token added if the page did
 *    not set an Authorization header itself (pages without app-components.js, e.g. the
 *    authority pages, had no token on their jQuery calls before v1.2.0).
 *  - Token belongs to another shop than this tab's session (someone logged in
 *    to a different shop in another tab) -> reload this tab with the latest login.
 * Load it after jQuery (and after app-components.js where the page has it); without
 * app-components.js the token is read from localStorage 'tailorbd_jwt' (set by login).
 */
(function () {
    'use strict';
    if (window.__tbdAuthGuard) return;
    window.__tbdAuthGuard = true;

    var leaving = false;

    function isEn() {
        return (window.currentLang || localStorage.getItem('preferredLanguage') || 'bn') === 'en';
    }

    function getToken() {
        if (window.TokenHelper && typeof TokenHelper.get === 'function') return TokenHelper.get() || '';
        return localStorage.getItem('tailorbd_jwt') || '';
    }

    // JWT payload is base64url; returns null if it cannot be read.
    function payload(token) {
        try {
            var p = token.split('.')[1];
            if (!p) return null;
            p = p.replace(/-/g, '+').replace(/_/g, '/');
            while (p.length % 4) p += '=';
            return JSON.parse(atob(p));
        } catch (e) {
            return null;
        }
    }

    // true for this site's /api/... URLs (relative or absolute)
    function isSameSiteApi(url) {
        try {
            var u = new URL(String(url), window.location.href);
            return u.origin === window.location.origin && /^\/api\//i.test(u.pathname);
        } catch (e) {
            return false;
        }
    }

    function hasAuthHeader(headers) {
        if (!headers) return false;
        for (var k in headers) {
            if (Object.prototype.hasOwnProperty.call(headers, k) && String(k).toLowerCase() === 'authorization') return true;
        }
        return false;
    }

    function goLogin() {
        if (leaving) return;
        leaving = true;
        alert(isEn()
            ? 'Your login has expired. Please log in again.'
            : 'আপনার লগইনের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে আবার লগইন করুন।');
        // The page's own error alerts for the failed calls are pointless now.
        window.alert = function () {};
        window.location.replace('/login');
    }

    function check() {
        var token = getToken();
        if (!token) { goLogin(); return; }
        var p = payload(token);
        if (!p) return; // unreadable: let the server decide
        if (p.exp && p.exp * 1000 < Date.now()) { goLogin(); return; }

        var tokenShop = String(p.institutionId || '');
        var tabShop = String(sessionStorage.getItem('institutionId') || '');
        if (tokenShop && tabShop && tokenShop !== tabShop) {
            var latest = localStorage.getItem('session_institutionId');
            if (latest === tokenShop) {
                leaving = true;
                alert(isEn()
                    ? 'Another shop account was logged in on this browser. This page will reload with that login.'
                    : 'এই ব্রাউজারে অন্য একটি শপের অ্যাকাউন্টে লগইন করা হয়েছে। পেজটি সেই লগইন দিয়ে রিলোড হবে।');
                ['username', 'name', 'phone', 'category', 'registrationId', 'institutionId', 'institutionName'].forEach(function (k) {
                    var v = localStorage.getItem('session_' + k);
                    if (v !== null) sessionStorage.setItem(k, v);
                });
                window.alert = function () {};
                window.location.reload();
            } else {
                goLogin();
            }
        }
    }

    if (window.jQuery) {
        // Registered before any page call, so it runs before the page's own .fail() alerts.
        jQuery.ajaxPrefilter(function (options, original, jqXHR) {
            // Token for this site's /api/ calls. A header the page sets itself
            // (headers: {...} or beforeSend, e.g. app-components.js) still wins.
            if (isSameSiteApi(options.url) && !hasAuthHeader(options.headers)) {
                var token = getToken();
                if (token) jqXHR.setRequestHeader('Authorization', 'Bearer ' + token);
            }
            jqXHR.fail(function (xhr) {
                if (xhr && xhr.status === 401) goLogin();
            });
        });
    }

    // fetch() does not go through $.ajaxSetup, so add the token here for same-site
    // /api/ calls that have no Authorization header, and treat 401 like the jQuery calls.
    if (typeof window.fetch === 'function' && !window.fetch.__tbdAuthGuard) {
        var originalFetch = window.fetch;
        var guardedFetch = function (input, init) {
            var isApi = isSameSiteApi((typeof input === 'string') ? input : ((input && input.url) || String(input)));
            if (isApi) {
                var token = getToken();
                if (token) {
                    var isRequest = typeof Request !== 'undefined' && input instanceof Request;
                    var headers = new Headers((init && init.headers) || (isRequest ? input.headers : undefined));
                    if (!headers.has('Authorization')) {
                        headers.set('Authorization', 'Bearer ' + token);
                        init = Object.assign({}, init || {}, { headers: headers });
                    }
                }
            }
            var result = originalFetch.call(window, input, init);
            if (isApi) {
                result.then(function (r) { if (r && r.status === 401) goLogin(); }, function () {});
            }
            return result;
        };
        guardedFetch.__tbdAuthGuard = true;
        window.fetch = guardedFetch;
    }

    check();

    window.TailorAuthGuard = { check: check, payload: payload };
})();
