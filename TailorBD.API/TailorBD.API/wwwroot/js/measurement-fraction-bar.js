// Fraction shortcut bar — click to insert ½ ¼ ¾ into measurement inputs
(function (global) {
    'use strict';

    var activeInput = null;
    var ns = '.measurementFractionBar';

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
            global.jQuery(input).trigger('input');
        }
    }

    function init(options) {
        options = options || {};
        var barSelector = options.barSelector || '#measurementFractionBar';
        var inputSelector = options.inputSelector || '.measurement-input, .meas-input, .style-meas-input';
        var $ = global.jQuery;
        if (!$) return;

        $(document).off('focusin' + ns, inputSelector).on('focusin' + ns, inputSelector, function () {
            activeInput = this;
            $(barSelector).removeClass('is-highlight');
        });

        $(barSelector).off('click' + ns).on('click' + ns, '.fraction-btn', function () {
            var ch = $(this).data('char');
            if (!ch) return;

            if (!activeInput || !document.body.contains(activeInput)) {
                var $first = $(inputSelector).filter(':visible').first();
                if ($first.length) {
                    activeInput = $first[0];
                    activeInput.focus();
                } else {
                    $(barSelector).addClass('is-highlight');
                    return;
                }
            }

            insertTextAtCursor(activeInput, ch);
        });
    }

    global.MeasurementFractionBar = { init: init };
})(window);
