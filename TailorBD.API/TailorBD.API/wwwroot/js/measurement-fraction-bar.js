// Fraction shortcut bar — F1=½ F2=¼ F3=¾ F4=⅛ (or tap buttons)
(function (global) {
    'use strict';

    var activeInput = null;
    var ns = '.measurementFractionBar';
    var inputSelector = '.measurement-input, .meas-input, .style-meas-input';

    var FRACTION_CHARS = /[½¼¾⅛]/g;

    function escapeHtml(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    var FRACTION_PARTS = {
        '½': ['1', '2'],
        '¼': ['1', '4'],
        '¾': ['3', '4'],
        '⅛': ['1', '8']
    };

    function buildFractionStackHtml(num, den) {
        return '<span class="meas-fraction-stack">' +
            '<span class="meas-f-stack-top">' + num + '</span>' +
            '<span class="meas-f-stack-line"></span>' +
            '<span class="meas-f-stack-bot">' + den + '</span>' +
            '</span>';
    }

    /** Render fractions as stacked digits (unicode ½ ¼ ¾ ⅛ look tiny at same font-size) */
    function formatFractionHtml(str) {
        return escapeHtml(str).replace(FRACTION_CHARS, function (ch) {
            var parts = FRACTION_PARTS[ch];
            if (parts) return buildFractionStackHtml(parts[0], parts[1]);
            return '<span class="meas-fraction-char">' + ch + '</span>';
        });
    }

    var FRACTION_BY_CODE = {
        F1: '½',
        F2: '¼',
        F3: '¾',
        F4: '⅛'
    };

    function insertTextAtCursor(input, text) {
        var start = typeof input.selectionStart === 'number' ? input.selectionStart : input.value.length;
        var end = typeof input.selectionEnd === 'number' ? input.selectionEnd : input.value.length;
        input.value = input.value.slice(0, start) + text + input.value.slice(end);
        var pos = start + text.length;
        if (typeof input.setSelectionRange === 'function') {
            input.setSelectionRange(pos, pos);
        }
        input.focus();
        if (global.jQuery) {
            global.jQuery(input).trigger('input').trigger('change');
        }
    }

    function syncMirrorStyles(input, mirror) {
        var cs = window.getComputedStyle(input);
        mirror.style.fontSize = cs.fontSize;
        mirror.style.fontWeight = cs.fontWeight;
        mirror.style.fontFamily = cs.fontFamily;
        mirror.style.letterSpacing = cs.letterSpacing;
        mirror.style.padding = cs.padding;
        mirror.style.lineHeight = cs.lineHeight;
        mirror.style.textAlign = cs.textAlign;
        mirror.style.borderWidth = cs.borderWidth;
        mirror.style.borderStyle = 'solid';
        mirror.style.borderColor = 'transparent';
        mirror.style.borderRadius = cs.borderRadius;
        mirror.style.boxSizing = cs.boxSizing;
    }

    function syncMirrorContent(input, mirror) {
        if (!mirror) return;
        var val = input.value;
        mirror.innerHTML = val ? formatFractionHtml(val) : '';
    }

    function wrapInputWithMirror($, input) {
        if (!input || input.closest('.meas-input-mirror-wrap')) return;

        var wrap = document.createElement('div');
        wrap.className = 'meas-input-mirror-wrap';
        input.parentNode.insertBefore(wrap, input);
        wrap.appendChild(input);

        var mirror = document.createElement('div');
        mirror.className = 'meas-input-mirror';
        mirror.setAttribute('aria-hidden', 'true');
        wrap.insertBefore(mirror, input);

        syncMirrorStyles(input, mirror);
        syncMirrorContent(input, mirror);

        $(input).on('input' + ns + 'Mirror change' + ns + 'Mirror', function () {
            syncMirrorContent(input, mirror);
        });
    }

    function enhanceInputs($, root) {
        $(root || document).find(inputSelector).each(function () {
            wrapInputWithMirror($, this);
        });
    }

    function observeDynamicInputs($, root) {
        var target = root && root.nodeType === 1 ? root : document.body;
        if (!target || typeof MutationObserver === 'undefined') return;

        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                mutation.addedNodes.forEach(function (node) {
                    if (node.nodeType !== 1) return;
                    if (node.matches && node.matches(inputSelector)) {
                        wrapInputWithMirror($, node);
                    }
                    enhanceInputs($, node);
                });
            });
        });

        observer.observe(target, { childList: true, subtree: true });
    }

    function resolveActiveInput($, barSelector) {
        if (activeInput && document.body.contains(activeInput) && $(activeInput).is(inputSelector)) {
            return activeInput;
        }

        var el = document.activeElement;
        if (el && $(el).is(inputSelector)) {
            activeInput = el;
            return el;
        }

        var $first = $(inputSelector).filter(':visible').first();
        if ($first.length) {
            activeInput = $first[0];
            activeInput.focus();
            return activeInput;
        }

        $(barSelector).addClass('is-highlight');
        return null;
    }

    function insertFraction($, barSelector, ch) {
        if (!ch) return;
        var input = resolveActiveInput($, barSelector);
        if (!input) return;
        insertTextAtCursor(input, ch);
        $(barSelector).removeClass('is-highlight');
    }

    function init(options) {
        options = options || {};
        var barSelector = options.barSelector || '#measurementFractionBar';
        inputSelector = options.inputSelector || '.measurement-input, .meas-input, .style-meas-input';
        var $ = global.jQuery;
        if (!$) return;

        $(document).off('focusin' + ns, inputSelector).on('focusin' + ns, inputSelector, function () {
            activeInput = this;
            $(barSelector).removeClass('is-highlight');
        });

        $(barSelector).off('click' + ns).on('click' + ns, '.fraction-btn', function () {
            insertFraction($, barSelector, $(this).data('char'));
        });

        $(document).off('keydown' + ns).on('keydown' + ns, function (e) {
            var ch = FRACTION_BY_CODE[e.code];
            if (!ch) return;

            var el = document.activeElement;
            if (!el || !$(el).is(inputSelector)) return;

            e.preventDefault();
            activeInput = el;
            insertFraction($, barSelector, ch);
        });

        enhanceInputs($, options.root || document);
        observeDynamicInputs($, options.root || document.body);
    }

    global.MeasurementFractionBar = {
        init: init,
        enhanceInputs: function (root) {
            var $ = global.jQuery;
            if (!$) return;
            enhanceInputs($, root || document);
        },
        fractions: FRACTION_BY_CODE,
        formatFractionHtml: formatFractionHtml,
        buildFractionStackHtml: buildFractionStackHtml,
        escapeHtml: escapeHtml
    };
})(window);
