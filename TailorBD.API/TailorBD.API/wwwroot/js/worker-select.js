/* worker-select.js — searchable master / artisan (কারিগর) dropdowns.
 * Wraps Tom Select (served locally from /lib/tom-select, no CDN).
 *
 *   WorkerSelect.refresh('#issueMasterId')   // call after the <select>'s options were (re)filled
 *   WorkerSelect.setValue('#fWorker', '12')  // set value on the select and the search box
 *
 * The original <select> stays in the page (hidden) and keeps its value, id and
 * onchange handler, so existing code that reads $('#id').val() keeps working.
 * The dropdown list is attached to <body> so it is not clipped by the
 * overflow:hidden cards / .modal-box and shows above .modal-overlay (z-index 2000).
 * Search is a plain case-insensitive "contains" on NFC-normalised text, so
 * Bengali names, English names and phone numbers (Bengali or ASCII digits) work.
 */
(function () {
    'use strict';

    function lang() {
        var l = window.currentLang || localStorage.getItem('preferredLanguage') || 'bn';
        return l === 'en' ? 'en' : 'bn';
    }

    function norm(s) {
        s = String(s == null ? '' : s);
        if (s.normalize) s = s.normalize('NFC');
        // Bengali digits -> ASCII so "০১৭" finds "017"
        s = s.replace(/[\u09E6-\u09EF]/g, function (d) { return String(d.charCodeAt(0) - 0x09E6); });
        return s.toLowerCase().replace(/\s+/g, ' ').trim();
    }

    function toEl(x) {
        if (!x) return null;
        if (typeof x === 'string') return document.querySelector(x);
        if (x.jquery) return x[0] || null;
        return x;
    }

    function injectCss() {
        if (document.getElementById('worker-select-css')) return;
        var css =
            '.ts-wrapper.f-input{padding:0!important;border:none!important;background:transparent!important;min-height:0;}' +
            '.ts-wrapper.single .ts-control{border:1px solid #ddd;border-radius:7px;padding:7px 28px 7px 12px;font-size:13px;min-height:36px;box-shadow:none;background-color:#fff;}' +
            '.ts-wrapper.single.focus .ts-control{border-color:#6c7ae0;box-shadow:0 0 0 2px rgba(108,122,224,.15);}' +
            '.ts-wrapper.single .ts-control input{font-size:13px;}' +
            // while typing, hide the current choice so the control stays one line
            '.ts-wrapper.single.ws-typing .ts-control .item{display:none;}' +
            'body > .ts-dropdown{z-index:2600;font-size:13px;border-radius:7px;}' +
            '.ts-dropdown .option{padding:6px 12px;}' +
            '.ts-dropdown .active{background:#eef0fc;color:#333;}' +
            '@media print{.ts-dropdown{display:none!important;}}';
        var st = document.createElement('style');
        st.id = 'worker-select-css';
        st.appendChild(document.createTextNode(css));
        document.head.appendChild(st);
    }

    function settings() {
        return {
            allowEmptyOption: true,      // keep "সব মাস্টার / All" and similar
            dropdownParent: 'body',
            maxOptions: null,            // list everyone
            create: false,
            highlight: false,
            sortField: [{ field: '$score' }, { field: '$order' }],
            searchField: ['text'],
            // "contains" match; every typed word must appear in the option text
            score: function (search) {
                var words = norm(search).split(' ').filter(Boolean);
                return function (item) {
                    if (!words.length) return 1;
                    var text = item.__norm || (item.__norm = norm(item.text));
                    for (var i = 0; i < words.length; i++) {
                        if (text.indexOf(words[i]) === -1) return 0;
                    }
                    return text.indexOf(words[0]) === 0 ? 2 : 1; // starts-with first
                };
            },
            onType: function (str) { this.wrapper.classList.toggle('ws-typing', !!str); },
            onItemAdd: function () { this.wrapper.classList.remove('ws-typing'); },
            onBlur: function () { this.wrapper.classList.remove('ws-typing'); },
            onDropdownClose: function () { if (!this.control_input.value) this.wrapper.classList.remove('ws-typing'); },
            render: {
                no_results: function () {
                    return '<div class="no-results">' + (lang() === 'en' ? 'No match found' : 'কিছু পাওয়া যায়নি') + '</div>';
                }
            }
        };
    }

    /** (Re)build the searchable box from the current <option>s of the select. */
    function refresh(x) {
        var el = toEl(x);
        if (!el || el.tagName !== 'SELECT') return null;
        if (typeof window.TomSelect !== 'function') return null; // library missing: plain select still works
        injectCss();
        var val = el.value;
        if (el.tomselect) {
            // destroy() puts back the options the select had when it was first wrapped,
            // so keep the freshly loaded options and restore them afterwards.
            var html = el.innerHTML;
            el.tomselect.destroy();
            el.innerHTML = html;
        }
        el.value = val;
        if (el.selectedIndex < 0 && el.options.length) el.selectedIndex = 0;
        try {
            return new window.TomSelect(el, settings());
        } catch (e) {
            if (window.console) console.warn('WorkerSelect: falling back to plain select', e);
            return null;
        }
    }

    function setValue(x, value) {
        var el = toEl(x);
        if (!el) return;
        el.value = value == null ? '' : String(value);
        if (el.tomselect) el.tomselect.setValue(el.value, true); // silent: no change event
    }

    function destroy(x) {
        var el = toEl(x);
        if (el && el.tomselect) {
            var html = el.innerHTML, val = el.value;
            el.tomselect.destroy();
            el.innerHTML = html;
            el.value = val;
        }
    }

    window.WorkerSelect = { refresh: refresh, setValue: setValue, destroy: destroy, _norm: norm };
})();
