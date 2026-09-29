/* list-search.js — as-you-type search for the cutting-master / artisan lists (client-side).
 * ListSearch.matches(term, name, phone): case-insensitive substring on name or phone;
 *   Bengali digits ০-৯ = 0-9; phone digits compared ignoring spaces, dashes, brackets and a +880/880/00880 prefix.
 * ListSearch.attach({ input, clear, onChange, delay }): debounced input, × clear button, Esc clears.
 */
(function () {
    'use strict';
    var BN = '০১২৩৪৫৬৭৮৯';
    function ascii(s) { return String(s == null ? '' : s).replace(/[০-৯]/g, function (d) { return String(BN.indexOf(d)); }); }
    function normText(s) {
        s = ascii(s);
        try { s = s.normalize('NFC'); } catch (e) { }
        return s.toLowerCase().replace(/\s+/g, ' ').trim();
    }
    function normPhone(s) {
        var d = ascii(s).replace(/\D/g, '');
        if (d.indexOf('00880') === 0) d = d.slice(2);
        if (d.indexOf('880') === 0) d = d.slice(2);     // 8801711… -> 01711…
        return d;
    }
    function matches(term, name, phone) {
        var q = normText(term);
        if (!q) return true;
        if (normText(name).indexOf(q) >= 0 || normText(phone).indexOf(q) >= 0) return true;
        if (!/^[0-9\s\-+().]+$/.test(q)) return false;
        var qd = normPhone(q);
        return qd.length > 0 && normPhone(phone).indexOf(qd) >= 0;
    }
    function attach(o) {
        var $in = $(o.input), $clr = $(o.clear), timer = null, delay = o.delay == null ? 200 : o.delay;
        if (!$in.length) return null;
        function sync() { $clr.toggle(!!$in.val()); }
        function fire() { clearTimeout(timer); timer = null; sync(); if (o.onChange) o.onChange($in.val() || ''); }
        $in.on('input', function () { sync(); clearTimeout(timer); timer = setTimeout(fire, delay); });
        $in.on('keydown', function (e) {
            if (e.key === 'Escape' && $in.val()) { e.preventDefault(); $in.val(''); fire(); }
            else if (e.key === 'Enter') { e.preventDefault(); fire(); }
        });
        $clr.on('click', function () { $in.val(''); fire(); $in.trigger('focus'); });
        sync();
        return { value: function () { return $in.val() || ''; }, run: fire };
    }
    if (!document.getElementById('list-search-css')) {
        var css = '.ls-wrap{position:relative;display:inline-block}' +
            '.ls-wrap .ls-icon{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#aaa;font-size:12px;pointer-events:none}' +
            '.ls-wrap .ls-input{width:230px;padding-left:30px;padding-right:28px}' +
            '.ls-wrap .ls-clear{position:absolute;right:4px;top:50%;transform:translateY(-50%);border:none;background:none;font-size:18px;line-height:1;color:#999;cursor:pointer;padding:0 6px}' +
            '.ls-wrap .ls-clear:hover{color:#e74c3c}' +
            '@media (max-width:576px){.ls-wrap,.ls-wrap .ls-input{width:100%}}' +
            '@media print{.ls-wrap{display:none!important}}';
        var st = document.createElement('style'); st.id = 'list-search-css'; st.textContent = css;
        (document.head || document.documentElement).appendChild(st);
    }
    window.ListSearch = { matches: matches, attach: attach, normPhone: normPhone, normText: normText };
})();
