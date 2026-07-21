// Money Receipt - TailorBD
(function() {
    'use strict';

    // print-settings থেকে ফিরে এলে reload flag set করো
    window._mrNeedsReload = false;

    // Global variables
    let orderData = null;
    let printSettings = null;
    let measurementPageSize = 1;
    let measurementPageIndex = 0;

    // URL Parameters
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');

    $(document).ready(function() {
        console.log('Money Receipt Page Loaded');
        console.log('Order ID:', orderId);

        // Validate order ID
        if (!orderId) {
            showAlert('error', 'অর্ডার ID পাওয়া যায়নি');
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 2000);
            return;
        }

        // Check session
        const institutionId = sessionStorage.getItem('institutionId');
        const registrationId = sessionStorage.getItem('registrationId');

        if (!institutionId || !registrationId) {
            showAlert('error', 'Session expired. Please login again.');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
            return;
        }

        // Load print settings first, then load receipt data to avoid race condition
        loadPrintSettings();
        loadMoneyReceiptData();

        // Auto-switch to measurement tab if tab=measurement is in URL
        const tabParam = urlParams.get('tab');
        if (tabParam === 'measurement') {
            // Wait for Bootstrap to initialize, then switch tab
            setTimeout(function() {
                const measurementTabEl = document.querySelector('button[data-bs-target="#measurementTab"]');
                if (measurementTabEl) {
                    const tab = new bootstrap.Tab(measurementTabEl);
                    tab.show();
                    $('#measurementTabTools').show();
                    scheduleMeasurementLayoutFit();
                }
            }, 500);
        }

        // Setup print size selector
        $('#printSizeSelect').on('change', function() {
            const size = window.TailorBD && window.TailorBD.printSizePref
                ? window.TailorBD.printSizePref.save($(this).val())
                : $(this).val();
            $('body').attr('data-print-size', size);
            applyPrintSizeToScreen(size);
            if (orderData && orderData.measurements) {
                displayMeasurements();
            }
        });

        // Measurement paging controls
        $('#measurementPageSize').on('change', function() {
            const value = $(this).val();
            measurementPageSize = value === 'all' ? 'all' : parseInt(value, 10);
            measurementPageIndex = 0;
            displayMeasurements();
        });

        $('#measurementPrevBtn').on('click', function() {
            if (measurementPageIndex > 0) {
                measurementPageIndex--;
                displayMeasurements();
            }
        });

        $('#measurementNextBtn').on('click', function() {
            const totalPages = getMeasurementTotalPages();
            if (measurementPageIndex < totalPages - 1) {
                measurementPageIndex++;
                displayMeasurements();
            }
        });

        // Hide Border checkbox functionality
        $('#hideBorderCheckbox').on('change', function() {
            applyMeasurementBorderState($(this).is(':checked'));
        });

        // Restore user's saved print size (default 4 inch)
        const savedPrintSize = window.TailorBD && window.TailorBD.printSizePref
            ? window.TailorBD.printSizePref.applyToSelect($('#printSizeSelect'))
            : '4';
        $('body').attr('data-print-size', savedPrintSize);
        applyPrintSizeToScreen(savedPrintSize);

        $('button[data-bs-target="#measurementTab"]').on('shown.bs.tab', function () {
            $('#measurementTabTools').show();
            scheduleMeasurementLayoutFit();
        });

        $('button[data-bs-target="#receiptTab"]').on('shown.bs.tab', function () {
            $('#measurementTabTools').hide();
        });
        
        // Update language content after components are loaded
        setTimeout(function() {
            if (window.updateLanguage) {
                window.updateLanguage();
            }
        }, 500);
        
        // Listen for language change events to re-render measurements
        $(document).on('click', '#langToggle', function() {
            // Wait for language to be updated
            setTimeout(function() {
                if (orderData && orderData.measurements) {
                    displayMeasurements();
                }
            }, 100);
        });
    });

    function getMeasurementTotalPages() {
        if (!orderData || !orderData.measurements || measurementPageSize === 'all') {
            return 1;
        }
        return Math.ceil(orderData.measurements.length / measurementPageSize);
    }

    function getVisibleMeasurements() {
        const measurements = orderData?.measurements || [];
        if (measurementPageSize === 'all') {
            return measurements;
        }
        const start = measurementPageIndex * measurementPageSize;
        return measurements.slice(start, start + measurementPageSize);
    }

    function updateMeasurementControls() {
        const measurements = orderData?.measurements || [];
        const $controls = $('#measurementControls');
        const $pageSize = $('#measurementPageSize');
        const $pager = $('#measurementPager');
        const $pageInfo = $('#measurementPageInfo');

        if (measurements.length <= 1) {
            $controls.hide();
            measurementPageSize = 'all';
            measurementPageIndex = 0;
            return;
        }

        $controls.show();

        // Build page size options
        $pageSize.empty();
        const currentLang = window.currentLang || 'bn';
        const allText = currentLang === 'en' ? 'Print all measurements' : 'সব মাপ একসাথে প্রিন্ট করুন';
        $pageSize.append(`<option value="all">${allText}</option>`);

        for (let i = 1; i <= measurements.length; i++) {
            const optionText = currentLang === 'en'
                ? `Print ${i} at a time`
                : `${i} টি করে মাপ প্রিন্ট করুন`;
            $pageSize.append(`<option value="${i}">${optionText}</option>`);
        }

        $pageSize.val(measurementPageSize === 'all' ? 'all' : String(measurementPageSize));

        const totalPages = getMeasurementTotalPages();
        if (measurementPageSize === 'all' || totalPages <= 1) {
            $pager.hide();
        } else {
            $pager.show();
            const pageText = currentLang === 'en'
                ? `Page ${measurementPageIndex + 1} of ${totalPages}`
                : `পৃষ্ঠা ${measurementPageIndex + 1} / ${totalPages}`;
            $pageInfo.text(pageText);
        }

        $('#measurementPrevBtn').prop('disabled', measurementPageIndex === 0);
        $('#measurementNextBtn').prop('disabled', measurementPageIndex >= totalPages - 1);
    }

    $(document).on('click', '#printSettingsBtn', function() {
        $('#printSettingsModal').modal('show');
    });

    $(document).on('click', '#savePrintSettingsBtn', function() {
        // Save print settings to session and apply
        const topSpace = parseInt($('#topSpaceInput').val(), 10) || 0;
        const fontSize = parseInt($('#fontSizeInput').val(), 10) || 14;

        // Save to session
        const institutionId = sessionStorage.getItem('institutionId');
        $.ajax({
            url: `/api/institution/${institutionId}/print-settings`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({
                moneyReceipt: {
                    topSpace: topSpace,
                    fontSize: fontSize
                }
            }),
            success: function(response) {
                if (response.success) {
                    printSettings.moneyReceipt.topSpace = topSpace;
                    printSettings.moneyReceipt.fontSize = fontSize;

                    // Close modal
                    $('#printSettingsModal').modal('hide');

                    // Reapply print settings
                    applyPrintSettings();

                    showAlert('success', 'Print settings updated successfully');
                } else {
                    showAlert('error', response.message || 'Failed to update print settings');
                }
            },
            error: function(xhr) {
                console.error('Error updating print settings:', xhr);
                showAlert('error', 'Failed to update print settings');
            }
        });
    });

    // Helper Functions
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const currentLang = window.currentLang || 'bn';
        
        if (currentLang === 'en') {
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
        } else {
            const months = ['জানুয়ারী', 'ফেব্রুয়ারী', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
            return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
        }
    }

    function formatShortDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        return `${day}-${month}-${year}`;
    }

    function formatNumber(num) {
        const n = parseFloat(num);
        const formatted = Number.isInteger(n) ? n : parseFloat(n.toFixed(2));
        return formatted.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function showAlert(type, message) {
        const $container = $('#alertContainer');
        const alertClass = type === 'error' ? 'alert-danger' : 'alert-success';
        
        const alertHtml = `
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        $container.html(alertHtml);
        
        setTimeout(() => {
            $container.find('.alert').fadeOut(() => {
                $container.empty();
            });
        }, 5000);
    }

    function goBack() {
        window.history.back();
    }

    function getSelectedPrintSize() {
        const selected = $('#printSizeSelect').val();
        return selected || $('body').attr('data-print-size') || '4';
    }

    function getPdfTargetElement(activeTab) {
        if (activeTab === 'receiptTab') {
            return document.querySelector('.receipt-container');
        }

        return document.querySelector('.measurements-main-container') || document.querySelector('.measurement-container');
    }

    const PDF_A4_WIDTH_MM = 210;
    const PDF_A4_HEIGHT_MM = 297;
    const PDF_MARGIN_MM = 10;

    function waitForFonts() {
        if (document.fonts && document.fonts.ready) {
            return document.fonts.ready.catch(function () { return undefined; });
        }
        return Promise.resolve();
    }

    function captureForPdf(element) {
        document.body.classList.add('pdf-export-mode');

        return waitForFonts().then(function () {
            return new Promise(function (resolve) {
                requestAnimationFrame(function () {
                    requestAnimationFrame(resolve);
                });
            });
        }).then(function () {
            const width = Math.max(element.scrollWidth, element.offsetWidth, 1);
            const height = Math.max(element.scrollHeight, element.offsetHeight, 1);

            return html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
                backgroundColor: '#ffffff',
                width: width,
                height: height,
                scrollX: 0,
                scrollY: 0,
                onclone: function (clonedDoc) {
                    clonedDoc.body.classList.add('pdf-export-mode');
                    const sidebar = clonedDoc.getElementById('app-sidebar');
                    if (sidebar) sidebar.style.display = 'none';
                    const navbar = clonedDoc.getElementById('app-navbar');
                    if (navbar) navbar.style.display = 'none';
                    const main = clonedDoc.querySelector('.main-content');
                    if (main) main.style.marginLeft = '0';
                    clonedDoc.querySelectorAll('.no-print').forEach(function (el) {
                        el.style.display = 'none';
                    });
                    clonedDoc.querySelectorAll('.receipt-container, .measurements-main-container, .measurement-container, .measurement-item-container').forEach(function (el) {
                        el.style.overflow = 'visible';
                        el.style.background = '#ffffff';
                    });
                    clonedDoc.querySelectorAll('#receiptInstitutionName, .receipt-header .institution-name').forEach(function (el) {
                        el.style.background = 'none';
                        el.style.backgroundImage = 'none';
                        el.style.webkitBackgroundClip = 'border-box';
                        el.style.backgroundClip = 'border-box';
                        el.style.webkitTextFillColor = '#000';
                        el.style.color = '#000';
                    });
                }
            });
        }).finally(function () {
            document.body.classList.remove('pdf-export-mode');
        });
    }

    function addCanvasToA4Pdf(pdf, canvas, contentWidthMm) {
        const margin = PDF_MARGIN_MM;
        const pageUsableHeight = PDF_A4_HEIGHT_MM - (margin * 2);
        const xOffset = (PDF_A4_WIDTH_MM - contentWidthMm) / 2;
        const imgWidth = contentWidthMm;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const imgData = canvas.toDataURL('image/png');

        if (imgHeight <= pageUsableHeight) {
            pdf.addImage(imgData, 'PNG', xOffset, margin, imgWidth, imgHeight);
            return;
        }

        let rendered = 0;
        let pageIndex = 0;
        while (rendered < imgHeight) {
            if (pageIndex > 0) pdf.addPage();
            pdf.addImage(imgData, 'PNG', xOffset, margin - rendered, imgWidth, imgHeight);
            rendered += pageUsableHeight;
            pageIndex++;
        }
    }

    function createPdfFromElement(element, filename) {
        const sizeInInches = parseFloat(getSelectedPrintSize()) || 4;
        const contentWidthMm = sizeInInches * 25.4;

        return captureForPdf(element).then(function (canvas) {
            if (!canvas || canvas.width < 2 || canvas.height < 2) {
                throw new Error('Empty canvas');
            }
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            addCanvasToA4Pdf(pdf, canvas, contentWidthMm);
            return { pdf, filename };
        });
    }

    // Apply print size to screen for preview
    function applyPrintSizeToScreen(size = '4') {
        // Convert inch to pixels (96 DPI standard)
        const inchToPixel = {
            '3': 288,    // 3 inch = 288px
            '3.5': 336,  // 3.5 inch = 336px
            '4': 384,    // 4 inch = 384px
            '4.5': 432,  // 4.5 inch = 432px
            '5': 480,    // 5 inch = 480px
            '5.5': 528,  // 5.5 inch = 528px
            '6': 576,    // 6 inch = 576px
            '6.5': 624   // 6.5 inch = 624px
        };
        
        const widthInPixels = inchToPixel[size] || 384; // Default to 4 inch
        const widthInInches = parseFloat(size) || 4;
        document.documentElement.style.setProperty('--print-width', widthInInches + 'in');
        
        // Apply width to receipt container
        $('.receipt-container').css({
            'max-width': widthInPixels + 'px',
            'width': '100%'
        });
        
        // Apply width to measurements container
        $('.measurements-main-container').css({
            'max-width': widthInPixels + 'px',
            'width': '100%'
        });

        fitMeasurementTablesToPaper();
        autoFitReceiptTextBlocks();
        
        console.log('Applied print size:', size, 'inch =', widthInPixels, 'pixels');
    }

    function autoFitReceiptTextBlocks() {
        autoFitInstitutionContact();
        autoFitReceiptDescriptionCells();
    }

    function fitTextBlockToLines(el, options) {
        const baseSize = options.baseSize;
        const minSize = options.minSize;
        const maxLines = options.maxLines;
        const text = (el.textContent || '').trim();

        if (!text || text === '-') {
            el.style.removeProperty('--contact-fit-size');
            el.style.fontSize = '';
            return;
        }

        el.style.wordBreak = 'normal';
        el.style.overflowWrap = 'break-word';
        el.style.hyphens = 'none';
        el.style.whiteSpace = 'normal';
        el.style.lineHeight = '1.15';

        let size = baseSize;
        const len = text.length;
        const scale = options.lengthScale || [
            [12, 1],
            [22, 0.94],
            [35, 0.86],
            [50, 0.76],
            [Infinity, 0.66]
        ];

        for (let i = 0; i < scale.length; i++) {
            if (len <= scale[i][0]) {
                size = baseSize * scale[i][1];
                break;
            }
        }

        size = Math.max(minSize, size);
        el.style.setProperty('--contact-fit-size', size + 'px');
        el.style.fontSize = size + 'px';

        let guard = 0;
        while (guard++ < 24 && size > minSize) {
            const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || size * 1.15;
            const lines = Math.max(1, Math.round(el.getBoundingClientRect().height / lineHeight));
            if (lines <= maxLines) break;
            size -= 0.5;
            el.style.setProperty('--contact-fit-size', size + 'px');
            el.style.fontSize = size + 'px';
        }
    }

    // Auto-scale shop address/contact: short text stays larger, long text fits in 2 lines
    function autoFitInstitutionContact() {
        const contactEl = document.querySelector('.institution-contact.receipt-contact-fit');
        if (!contactEl || getComputedStyle(contactEl).display === 'none') return;

        const printFs = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--print-font-size')) || 12;
        const baseSize = Math.max(printFs, 10);
        const minSize = Math.max(5, baseSize * 0.5);

        fitTextBlockToLines(contactEl, {
            baseSize: baseSize,
            minSize: minSize,
            maxLines: 2,
            lengthScale: [
                [25, 1],
                [45, 0.92],
                [65, 0.82],
                [90, 0.72],
                [Infinity, 0.62]
            ]
        });
    }

    // Auto-scale description column: short text stays larger, long text shrinks to fit
    function autoFitReceiptDescriptionCells() {
        const baseSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--print-font-size')) || 9;
        const minSize = Math.max(5, baseSize * 0.55);

        document.querySelectorAll('#orderItemsBody .receipt-desc-cell').forEach(function(cell) {
            fitTextBlockToLines(cell, {
                baseSize: baseSize,
                minSize: minSize,
                maxLines: 3,
                lengthScale: [
                    [10, 1],
                    [18, 0.94],
                    [28, 0.86],
                    [40, 0.76],
                    [Infinity, 0.66]
                ]
            });
        });
    }

    function getMeasurementSettingFontSize() {
        const settingFs = printSettings && printSettings.measurement && printSettings.measurement.fontSize;
        if (settingFs && settingFs > 0) return settingFs;
        const cssVar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--measurement-font-size'));
        return cssVar > 0 ? cssVar : 12;
    }

    function getStyleSettingFontSize() {
        const settingFs = printSettings && printSettings.measurement && printSettings.measurement.styleFontSize;
        if (settingFs && settingFs > 0) return settingFs;
        const cssVar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--style-font-size'));
        if (cssVar > 0) return cssVar;
        return getMeasurementSettingFontSize();
    }

    function scheduleMeasurementLayoutFit() {
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                applyPrintSizeToScreen(getSelectedPrintSize());
            });
        });
    }

    function getMeasurementTargetWidth() {
        const borderReserve = 4;
        const containerPadding = 8;
        return getPrintWidthPixels() - containerPadding - borderReserve;
    }

    function getMeasurementLabelFontSize(valueFontPx) {
        const vf = valueFontPx > 0 ? valueFontPx : 12;
        return Math.max(9, Math.round(vf * 0.85));
    }

    function applyMeasurementBorderState(hide) {
        if (hide) {
            $('.measurement-group-inner').css('border', 'none');
            $('.measurement-group-inner td:not(.measurement-separator)').css('border', 'none');
            $('.measurement-grid-container').addClass('hide-borders');
            $('.measurement-grid-container table').css('border', 'none');
            $('.measurement-grid-container table td').css('border', 'none');
        } else {
            $('.measurement-group-inner').css('border', '1px solid #666');
            $('.measurement-group-inner td:not(.measurement-separator)').css('border', '');
            $('.measurement-grid-container').removeClass('hide-borders');
            $('.measurement-grid-container table').css('border', '1px solid #666');
            $('.measurement-grid-container table td').css('border', '1px solid #666');
        }
    }

    function buildMeasurementGroupBox(validMeasurements, mSettings, fontSize, labelFont) {
        const $box = $('<div class="measurement-group-box"></div>');
        const $innerTable = $('<table class="measurement-group-inner"></table>');
        const $innerTbody = $('<tbody></tbody>');

        validMeasurements.forEach(function (m, idx) {
            if (mSettings.printMeasurementName) {
                const $typeRow = $('<tr></tr>');
                $typeRow.append(`<td class="measurement-type-cell">${m.type}</td>`);
                $innerTbody.append($typeRow);
            }

            const $valRow = $('<tr></tr>');
            $valRow.append(`<td class="measurement-value-cell">${formatMeasurementValueHtml(m.value)}</td>`);
            $innerTbody.append($valRow);

            if (idx < validMeasurements.length - 1) {
                const $sepRow = $('<tr></tr>');
                $sepRow.append('<td class="measurement-separator"></td>');
                $innerTbody.append($sepRow);
            }
        });

        $innerTable.append($innerTbody);
        $box.append($innerTable);
        return $box;
    }

    function applyMeasurementCellStyles($container, valueFontPx) {
        const labelFontPx = getMeasurementLabelFontSize(valueFontPx);
        const vPad = Math.max(2, Math.round(valueFontPx * 0.18));
        const hPad = Math.max(2, Math.round(valueFontPx * 0.12));

        document.documentElement.style.setProperty('--measurement-font-size', valueFontPx + 'px');
        document.documentElement.style.setProperty('--measurement-label-font-size', labelFontPx + 'px');

        $container.find('.measurement-type-cell').css({
            fontSize: labelFontPx + 'px',
            color: '#000',
            padding: vPad + 'px ' + hPad + 'px',
            lineHeight: '1.25',
            overflow: 'visible',
            whiteSpace: 'nowrap',
            wordBreak: 'normal',
            overflowWrap: 'normal'
        });
        $container.find('.measurement-value-cell').css({
            fontSize: valueFontPx + 'px',
            color: '#000',
            padding: (vPad + 1) + 'px ' + hPad + 'px',
            lineHeight: '1.25',
            overflow: 'visible',
            whiteSpace: 'nowrap',
            wordBreak: 'normal',
            overflowWrap: 'normal'
        });
    }

    function applyFirstRowStretch($row) {
        const $boxes = $row.find('.measurement-group-box');
        if (!$boxes.length) return;

        $row.css({ justifyContent: 'flex-start', columnGap: '0', width: '100%' });

        $boxes.each(function () {
            const naturalW = Math.ceil(this.getBoundingClientRect().width);
            this.style.setProperty('flex', '1 0 ' + naturalW + 'px', 'important');
            this.style.setProperty('min-width', naturalW + 'px', 'important');
            this.style.setProperty('max-width', 'none', 'important');
            this.style.setProperty('box-sizing', 'border-box', 'important');
        });

        $boxes.find('.measurement-group-inner').each(function () {
            this.style.setProperty('width', '100%', 'important');
            this.style.setProperty('table-layout', 'auto', 'important');
        });
    }

    function layoutMeasurementFlexRows($wrap, targetWidth, valueFontPx) {
        const $flex = $wrap.find('.measurement-groups-flex').first();
        if (!$flex.length) return;

        const boxEls = [];
        $flex.find('.measurement-group-box').each(function () {
            boxEls.push(this);
        });
        if (!boxEls.length) return;

        // Measure natural widths
        const $measureRow = $('<div class="measurement-groups-row measurement-measure-row"></div>').css({
            display: 'flex',
            flexWrap: 'nowrap',
            position: 'absolute',
            visibility: 'hidden',
            left: '-9999px',
            top: 0,
            pointerEvents: 'none'
        });
        boxEls.forEach(function (el) { $measureRow.append(el); });
        $flex.append($measureRow);

        const rows = [];
        let currentRow = [];
        let currentWidth = 0;

        boxEls.forEach(function (el) {
            const w = Math.ceil(el.getBoundingClientRect().width);
            if (currentRow.length > 0 && currentWidth + w > targetWidth) {
                rows.push(currentRow);
                currentRow = [];
                currentWidth = 0;
            }
            currentRow.push(el);
            currentWidth += w;
        });
        if (currentRow.length) rows.push(currentRow);

        $measureRow.remove();
        $flex.empty().css({
            display: 'block',
            width: '100%',
            maxWidth: '100%'
        });

        rows.forEach(function (rowEls, rowIndex) {
            const isFirstRow = rowIndex === 0;
            const $row = $('<div class="measurement-groups-row"></div>').css({
                display: 'flex',
                width: '100%',
                maxWidth: '100%',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                boxSizing: 'border-box',
                marginBottom: '2px',
                columnGap: isFirstRow ? '0' : '2px'
            });
            rowEls.forEach(function (el) { $row.append(el); });
            $flex.append($row);

            if (!isFirstRow) {
                $row.find('.measurement-group-box').css({ flex: '0 0 auto' });
            }
        });
    }

    function fitMeasurementTablesToPaper() {
        const targetWidth = getMeasurementTargetWidth();
        const settingFont = getMeasurementSettingFontSize();

        $('.measurement-table-fit').each(function () {
            const $wrap = $(this);
            $wrap.css({
                height: 'auto',
                width: '100%',
                maxWidth: targetWidth + 'px',
                marginLeft: 'auto',
                marginRight: 'auto',
                padding: 0,
                overflow: 'visible',
                boxSizing: 'border-box'
            });

            $wrap.find('.measurement-group-box').css({
                flex: '0 0 auto',
                maxWidth: '100%',
                padding: '0 1px 2px',
                boxSizing: 'border-box'
            });

            $wrap.find('.measurement-group-inner').css({
                width: 'auto',
                tableLayout: 'auto',
                borderCollapse: 'collapse'
            });

            applyMeasurementCellStyles($wrap, settingFont);
            layoutMeasurementFlexRows($wrap, targetWidth, settingFont);
            applyMeasurementCellStyles($wrap, settingFont);
            const $firstRow = $wrap.find('.measurement-groups-row').first();
            if ($firstRow.length) {
                applyFirstRowStretch($firstRow);
            }
        });
    }

    function getPrintWidthPixels() {
        const inchToPixel = {
            '3': 288,
            '3.5': 336,
            '4': 384,
            '4.5': 432,
            '5': 480,
            '5.5': 528,
            '6': 576,
            '6.5': 624
        };
        const size = getSelectedPrintSize();
        return inchToPixel[size] || 384;
    }
    
    // Track whether count was already incremented for this page load
    let measurementPrintCountIncremented = false;

    // Increment measurement print count
    async function incrementMeasurementPrintCount() {
        if (measurementPrintCountIncremented) {
            console.log('incrementMeasurementPrintCount: already incremented, skipping');
            return;
        }
        measurementPrintCountIncremented = true;

        const institutionId = sessionStorage.getItem('institutionId');
        const token = window.TokenHelper ? window.TokenHelper.get() : (localStorage.getItem('tailorbd_jwt') || '');

        console.log('incrementMeasurementPrintCount called:', { orderId, institutionId, hasToken: !!token });

        if (!orderId || !institutionId) {
            console.error('incrementMeasurementPrintCount: missing orderId or institutionId', { orderId, institutionId });
            measurementPrintCountIncremented = false;
            return;
        }

        const apiUrl = `/api/orders/${orderId}/increment-measurement-print?institutionId=${institutionId}`;
        console.log('Calling API:', apiUrl);

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: token ? { 'Authorization': 'Bearer ' + token } : {}
            });

            console.log('API response status:', response.status);
            const result = await response.json();
            console.log('API response body:', result);

            if (result.success) {
                console.log('Measurement print count incremented successfully for orderId:', orderId);
            } else {
                console.warn('Failed to increment measurement print count:', result.message);
                measurementPrintCountIncremented = false;
            }
        } catch (error) {
            console.error('Error incrementing measurement print count:', error);
            measurementPrintCountIncremented = false;
        }
    }
    
    // Override window.print to also increment count if measurement tab is active
    const originalPrint = window.print;
    window.print = function() {
        const activeTab = $('.tab-pane.active').attr('id');
        if (activeTab === 'measurementTab') {
            incrementMeasurementPrintCount();
            applyPrintSizeToScreen(getSelectedPrintSize());
        }
        originalPrint.call(window);
    };

    window.addEventListener('beforeprint', function() {
        applyPrintSizeToScreen(getSelectedPrintSize());
    });

    // Load print settings
    function loadPrintSettings() {
        const institutionId = sessionStorage.getItem('institutionId');

        $.ajax({
            url: `/api/institution/${institutionId}/print-settings`,
            method: 'GET',
            cache: false,
            success: function(response) {
                if (response.success && response.data) {
                    printSettings = response.data;
                    console.log('Print settings loaded:', printSettings);
                    applyPrintSettings();
                    // Re-apply if data already rendered (race condition fix)
                    if (orderData && orderData.header) {
                        displayMoneyReceipt();
                    }
                    if (orderData && orderData.measurements) {
                        displayMeasurements();
                    }
                }
            },
            error: function(xhr) {
                console.error('Error loading print settings:', xhr);
            }
        });
    }

    // Apply print settings to the page
    function applyPrintSettings() {
        if (!printSettings) {
            console.warn('No print settings available');
            return;
        }

        const mrSettings = printSettings.moneyReceipt;
        console.log('Applying print settings - showShopName:', mrSettings.showShopName);

        // Set CSS variables for print
        document.documentElement.style.setProperty('--print-top-space', mrSettings.topSpace + 'px');
        document.documentElement.style.setProperty('--print-font-size', mrSettings.fontSize + 'px');

        // Hide institution name, subtitle, and contact if setting is false
        if (mrSettings.showShopName === false) {
            console.log('Hiding shop name by settings');
            $('.receipt-header').addClass('hide-shop-name');
            $('.institution-name').hide();
            $('.institution-subtitle').hide();
            $('.institution-contact').hide();
        } else {
            console.log('Showing shop name by settings');
            $('.receipt-header').removeClass('hide-shop-name');
            // Note: Individual elements visibility will be controlled by displayMoneyReceipt based on data availability
        }

        // Update powered by info
        if (mrSettings.poweredByInfo) {
            $('.receipt-footer p').text(mrSettings.poweredByInfo);
        }
        
        // Apply top space from settings
        if (mrSettings.topSpace !== undefined && mrSettings.topSpace !== null) {
            $('.receipt-header').css('margin-top', mrSettings.topSpace + 'px');
        }
        
        // Apply measurement settings
        if (printSettings.measurement) {
            const mSettings = printSettings.measurement;
            
            // Set measurement top space CSS variable
            if (mSettings.topSpace !== undefined && mSettings.topSpace !== null) {
                document.documentElement.style.setProperty('--measurement-top-space', mSettings.topSpace + 'px');
                console.log('Set measurement top space:', mSettings.topSpace + 'px');
            }
            const mFont = (mSettings.fontSize && mSettings.fontSize > 0) ? mSettings.fontSize : 12;
            const sFont = (mSettings.styleFontSize && mSettings.styleFontSize > 0) ? mSettings.styleFontSize : mFont;
            const labelFont = getMeasurementLabelFontSize(mFont);
            document.documentElement.style.setProperty('--measurement-font-size', mFont + 'px');
            document.documentElement.style.setProperty('--measurement-label-font-size', labelFont + 'px');
            document.documentElement.style.setProperty('--style-font-size', sFont + 'px');
        }

        setTimeout(autoFitReceiptTextBlocks, 0);

        if (orderData && orderData.header) {
            displayPaymentSummary();
        }
    }

    // Load money receipt data
    function loadMoneyReceiptData() {
        const institutionId = sessionStorage.getItem('institutionId');

        console.log('Loading money receipt for OrderId:', orderId, 'InstitutionId:', institutionId);

        // Show loading indicator
        $('#orderItemsBody').html('<tr><td colspan="5" class="text-center">লোড হচ্ছে...</td></tr>');
        $('#measurementContainer').html('<p class="text-center">লোড হচ্ছে...</p>');

        $.ajax({
            url: `/api/orders/money-receipt-details?orderId=${orderId}&institutionId=${institutionId}`,
            method: 'GET',
            cache: false,
            success: function(response) {
                console.log('API Response received:', response);
                
                if (response.success && response.data) {
                    orderData = response.data;
                    console.log('OrderData assigned:', orderData);
                    
                    displayMoneyReceipt();
                    displayMeasurements();
                } else {
                    const errorMsg = response.message || 'Failed to load money receipt details';
                    showAlert('error', errorMsg);
                    console.error('Invalid response:', response);
                    $('#orderItemsBody').html('<tr><td colspan="5" class="text-center text-danger">ডাটা লোড করতে ব্যর্থ</td></tr>');
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX Error:', error);
                showAlert('error', 'Failed to load money receipt details');
                $('#orderItemsBody').html('<tr><td colspan="5" class="text-center text-danger">ডাটা লোড করতে ব্যর্থ</td></tr>');
            }
        });
    }

    function displayMoneyReceipt() {
        console.log('displayMoneyReceipt called');
        
        if (!orderData || !orderData.header) {
            console.error('No orderData or header found');
            showAlert('error', 'অর্ডার ডাটা পাওয়া যাচ্ছে না');
            return;
        }

        const header = orderData.header;

        // Extra diagnostics
        try {
            console.log('Header keys:', Object.keys(header || {}));
            console.log('Header JSON:', JSON.stringify(header));
        } catch {
            // ignore
        }

        const normalizeText = (v) => {
            if (v === null || v === undefined) return '';
            const s = v.toString();
            const t = s.trim();
            if (!t) return '';
            if (t === '...') return '';
            if (t.toLowerCase() === 'null' || t.toLowerCase() === 'undefined') return '';
            return s;
        };

        // Display institution info
        const sessionInstitutionName = normalizeText(sessionStorage.getItem('institutionName'));
        const apiInstitutionName = normalizeText(header.institutionName ?? header.InstitutionName);
        const resolvedInstitutionName = apiInstitutionName || sessionInstitutionName || 'TailorBD';

        const apiDialogTitle = normalizeText(header.dialogTitle ?? header.DialogTitle);
        const resolvedDialogTitle = apiDialogTitle || '';

        console.log('Resolved InstitutionName:', resolvedInstitutionName);
        console.log('Resolved DialogTitle:', resolvedDialogTitle);

        $('#receiptInstitutionName').text(resolvedInstitutionName);
        $('#dialogTitle').text(resolvedDialogTitle);

        // Log to verify text was set
        console.log('Text set to institutionName element:', $('#receiptInstitutionName').text());
        console.log('Element HTML:', $('#receiptInstitutionName').html());
        
        // Check if print settings exist and if showShopName is enabled
        console.log('Print settings:', printSettings);
        const showShopName = printSettings && printSettings.moneyReceipt && printSettings.moneyReceipt.showShopName !== false;
        console.log('showShopName setting:', showShopName);

        const hasInstitutionName = normalizeText(resolvedInstitutionName).length > 0;
        console.log('hasInstitutionName:', hasInstitutionName);

        if (hasInstitutionName && showShopName) {
            $('.receipt-header').removeClass('hide-shop-name');
            $('#receiptInstitutionName').attr('style', 'display: block !important; color: #000 !important; visibility: visible !important; opacity: 1 !important;');

            if (normalizeText(resolvedDialogTitle)) {
                $('.institution-subtitle').attr('style', 'display: block !important; color: #666 !important;');
            } else {
                $('.institution-subtitle').attr('style', 'display: none !important;');
            }

            $('.institution-contact').attr('style', 'display: block !important; color: #444 !important;');
        } else {
            $('.receipt-header').addClass('hide-shop-name');
            $('#receiptInstitutionName').attr('style', 'display: none !important;');
            $('.institution-subtitle').attr('style', 'display: none !important;');
            $('.institution-contact').attr('style', 'display: none !important;');
        }

        const instPhone = normalizeText(header.institutionPhone ?? header.InstitutionPhone);
        const instAddress = normalizeText(header.institutionAddress ?? header.InstitutionAddress);

        $('#institutionPhone').text('');
        $('#institutionAddress').text('');
        $('#institutionSeparator').hide();

        if (instPhone && instAddress) {
            if (instAddress.includes(instPhone)) {
                $('#institutionAddress').text(instAddress);
            } else {
                $('#institutionPhone').text(instPhone);
                $('#institutionAddress').text(instAddress);
                $('#institutionSeparator').show();
            }
        } else if (instPhone) {
            $('#institutionPhone').text(instPhone);
        } else if (instAddress) {
            $('#institutionAddress').text(instAddress);
        }

        // Display customer info
        $('#orderSerialNumber').text(header.orderSerialNumber || '-');
        $('#customerName').text(header.customerName || 'N/A');
        $('#customerPhone').text(header.phone || 'N/A');
        $('#customerAddress').text(header.address || 'No address');
        
        // Display dates
        $('#orderDate').text(formatShortDate(header.orderDate));
        $('#deliveryDate').text(formatShortDate(header.deliveryDate));

        // Generate barcode only if setting is enabled
        if (printSettings && printSettings.moneyReceipt && printSettings.moneyReceipt.showReceiptBarcode !== false) {
            if (header.orderSerialNumber) {
                $('.barcode-section').show();
                try {
                    JsBarcode("#barcodeReceipt", header.orderSerialNumber.toString(), {
                        format: "CODE128",
                        width: 3,
                        height: 25,
                        displayValue: true,
                        fontSize: 10,
                        margin: 1
                    });
                    console.log('Barcode generated');
                } catch (error) {
                    console.error('Error generating barcode:', error);
                }
            }
        } else {
            $('.barcode-section').hide();
            console.log('Barcode hidden by setting');
        }

        // Display order items
        displayOrderItems();

        // Display payment summary
        displayPaymentSummary();

        // Served By
        const showServedBy = printSettings && printSettings.moneyReceipt && printSettings.moneyReceipt.showServedBy;
        const servedByName = sessionStorage.getItem('name') || sessionStorage.getItem('username') || '';
        const servedByPhone = sessionStorage.getItem('phone') || '';
        if (showServedBy && servedByName) {
            const displayText = servedByPhone ? `${servedByName}(${servedByPhone})` : servedByName;
            $('#servedByName').text(displayText);
            $('#servedBySection').show();
        } else {
            $('#servedBySection').hide();
        }

        // Re-apply font size to screen view after content is rendered
        if (printSettings && printSettings.moneyReceipt && printSettings.moneyReceipt.fontSize) {
            const fs = printSettings.moneyReceipt.fontSize + 'px';
            document.documentElement.style.setProperty('--print-font-size', fs);
        }

        setTimeout(autoFitReceiptTextBlocks, 0);

        console.log('Money receipt display completed');
    }

    function displayOrderItems() {
        const $tbody = $('#orderItemsBody');
        $tbody.empty();

        const items = orderData.orderItems || [];

        if (items.length === 0) {
            $tbody.html('<tr><td colspan="5" class="text-center text-muted">কোনো অর্ডার আইটেম পাওয়া যায়নি</td></tr>');
            return;
        }

        items.forEach(item => {
            const dressInfo = `${item.dressName} (${item.dressQuantity})`;
            const unitPrice = item.unitPrice || 0;
            const quantity = item.unit || 1;
            const amount = item.amount || 0;
            const details = item.details || '-';

            $tbody.append(`
                <tr>
                    <td><strong>${dressInfo}</strong></td>
                    <td class="receipt-desc-cell">${escapeHtml(details)}</td>
                    <td class="text-center">${quantity}</td>
                    <td class="text-end">৳${formatNumber(unitPrice)}</td>
                    <td class="text-end"><strong>৳${formatNumber(amount)}</strong></td>
                </tr>
            `);
        });

        setTimeout(autoFitReceiptTextBlocks, 0);
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function formatMeasurementValueHtml(val) {
        if (val == null || val === '') return '';
        if (window.MeasurementFractionBar && MeasurementFractionBar.formatFractionHtml) {
            return MeasurementFractionBar.formatFractionHtml(val);
        }
        return escapeHtml(String(val)).replace(/[½¼¾⅛]/g, function (ch) {
            return '<span class="meas-fraction-char">' + ch + '</span>';
        });
    }

    function displayPaymentSummary() {
        const header = orderData.header;
        const total = header.orderAmount || 0;
        const discount = header.discount || 0;
        const paid = header.paidAmount || 0;
        const due = header.dueAmount || 0;
        const previousDue = orderData.previousDue || 0;

        $('#totalAmount').text('৳' + formatNumber(total));
        $('#paidAmount').text('৳' + formatNumber(paid));
        $('#dueAmount').text('৳' + formatNumber(due));

        // Show discount row if there's a discount
        if (discount > 0) {
            $('#discountAmount').text('৳' + formatNumber(discount));
            $('#discountRow').show();
        }

        // Show previous due only when enabled in print settings and amount > 0
        const showPreviousDueSetting = printSettings
            && printSettings.moneyReceipt
            && printSettings.moneyReceipt.showPreviousDue !== false;

        if (previousDue > 0 && showPreviousDueSetting) {
            $('#previousDueAmount').text('৳' + formatNumber(previousDue));
            $('#previousDueRow').show();
            const totalDue = due + previousDue;
            $('#totalDueAmount').text('৳' + formatNumber(totalDue));
            $('#totalDueRow').show();
        } else {
            $('#previousDueRow').hide();
            $('#totalDueRow').hide();
        }
    }

    // Display measurements
    function getServedByDisplayHtml() {
        const name = sessionStorage.getItem('name') || sessionStorage.getItem('username') || '';
        if (!name) return '';
        const phone = sessionStorage.getItem('phone') || '';
        const userPart = phone
            ? `${escapeHtml(name)}(${escapeHtml(phone)})`
            : escapeHtml(name);
        return `Serve by : ${userPart}`;
    }

    function appendMeasurementServedByLine($container, mSettings) {
        if (!mSettings || !mSettings.printServedBy) return;
        const html = getServedByDisplayHtml();
        if (!html) return;
        $container.append(`<div class="measurement-served-by-section">${html}</div>`);
    }

    function displayMeasurements() {
        if (!printSettings || !printSettings.measurement) {
            console.warn('No print settings found, using defaults');
            printSettings = { 
                measurement: {
                    printShopName: false,
                    printMasterCopy: true,
                    printWorkmanCopy: false,
                    printShopCopy: false,
                    printCustomerName: false,
                    printCustomerAddress: false,
                    printMeasurementName: false,
                    printStyleCategory: false,
                    printBarcode: false,
                    printServedBy: false,
                    topSpace: 0,
                    fontSize: 12,
                    styleFontSize: 14
                }
            };
        }

        const $container = $('#measurementContainer');
        $container.empty();

        const measurements = orderData.measurements || [];

        if (measurements.length === 0) {
            const currentLang = window.currentLang || 'bn';
            const noDataText = currentLang === 'en' ? 'No measurements found' : 'কোনো মাপ পাওয়া যায়নি';
            $container.html(`<p class="text-center text-muted">${noDataText}</p>`);
            updateMeasurementControls();
            return;
        }

        updateMeasurementControls();
        const visibleMeasurements = getVisibleMeasurements();

        const mSettings = printSettings.measurement;
        const header = orderData.header;
        const currentLang = window.currentLang || 'bn';

        // Translate copy titles based on current language
        const copyTitles = {
            master: currentLang === 'en' ? '.......................... Copy' : '.......................... কপি',
            workman: currentLang === 'en' ? 'Workman Copy' : 'কারিগর কপি',
            shop: currentLang === 'en' ? 'Shop Copy' : 'দোকান কপি',
            default: currentLang === 'en' ? 'Measurement' : 'মাপ'
        };

        // Translate labels
        const labels = {
            orderNo: currentLang === 'en' ? 'Order No:' : 'অর্ডার নং:',
            order: currentLang === 'en' ? 'Order:' : 'তাং:',
            delivery: currentLang === 'en' ? 'Del:' : 'ডেলি:'
        };

        // Create measurement copies based on settings
        const copies = [];
        if (mSettings.printMasterCopy) {
            copies.push({ title: copyTitles.master, class: 'master-copy' });
        }
        if (mSettings.printWorkmanCopy) {
            copies.push({ title: copyTitles.workman, class: 'workman-copy' });
        }
        if (mSettings.printShopCopy) {
            copies.push({ title: copyTitles.shop, class: 'shop-copy' });
        }

        // If no copies selected, show at least one default copy
        if (copies.length === 0) {
            copies.push({ title: copyTitles.default, class: 'default-copy' });
        }

        console.log('Creating measurement copies:', copies);

        // Main container for all copies
        const $mainContainer = $('<div class="measurements-main-container"></div>');

        visibleMeasurements.forEach((item, itemIndex) => {
            // Container for this item's all copies + measurements
            const $itemContainer = $('<div class="measurement-item-container"></div>');

            // PART 1: Show all copy headers first
            copies.forEach((copy, copyIndex) => {
                const $copy = $('<div class="measurement-copy"></div>');
                $copy.addClass(copy.class);

                // Header with institution name (if enabled)
                if (mSettings.printShopName) {
                    $copy.append(`
                        <div class="measurement-header">
                            <h3>${header.institutionName || 'TailorBD'}</h3>
                        </div>
                    `);
                }

                // Copy title
                $copy.append(`<div class="copy-title">${copy.title}</div>`);

                // Measurement info table (Always show for each copy)
                $copy.append(`
                    <table class="measurement-info-table">
                        <tr>
                            <td>
                                <strong class="measurement-dress-name">${item.dressName}</strong><br>
                                <input type="text" class="dress-quantity-input" value="${item.dressQuantity} P." style="text-align: center; border: 1px solid #000; color: #000; font-weight: 800; width: 95%; font-size: 14px;" />
                            </td>
                            <td class="measurement-order-cell">
                                <span class="measurement-info-label">${labels.orderNo}</span><br>
                                <strong class="measurement-order-no">${header.orderSerialNumber} (${item.orderListSerialNumber || item.orderListSN || item.orderList_SN || ''})</strong>
                            </td>
                            <td class="measurement-date-cell">
                                <span class="measurement-info-label">${labels.order} ${formatShortDate(header.orderDate)}</span><br>
                                <span class="measurement-info-label">${labels.delivery} ${formatShortDate(header.deliveryDate)}</span>
                            </td>
                        </tr>
                    </table>
                `);

                // Add barcode if setting is enabled AND this is a shop copy
                if (mSettings.printBarcode && header.orderSerialNumber && copy.class === 'shop-copy') {
                    const barcodeId = `barcodeMeasurement_${itemIndex}_${copyIndex}`;
                    $copy.append(`
                        <div class="measurement-barcode-section">
                            <svg id="${barcodeId}"></svg>
                        </div>
                    `);
                    
                    // Generate barcode after appending to DOM
                    setTimeout(() => {
                        try {
                            JsBarcode(`#${barcodeId}`, header.orderSerialNumber.toString(), {
                                format: "CODE128",
                                width: 2,
                                height: 20,
                                displayValue: true,
                                fontSize: 10,
                                margin: 1
                            });
                            console.log('Barcode generated for shop copy only:', barcodeId);
                        } catch (error) {
                            console.error('Error generating barcode for measurement:', error);
                        }
                    }, 100);
                }

                $itemContainer.append($copy);
            });

            // PART 2: After all copy headers, show measurements and styles ONCE at the end
            const $detailsSection = $('<div class="measurement-details-section"></div>');

            // Customer name AND phone (if enabled separately)
            appendMeasurementServedByLine($detailsSection, mSettings);

            if (mSettings.printCustomerName) {
                let customerLine = `<strong>${header.customerName}</strong>`;
                const showPhone = mSettings.printCustomerPhone !== false;
                if (showPhone && header.phone) {
                    customerLine += `, ${header.phone}`;
                }
                if (mSettings.printCustomerAddress && header.address) {
                    customerLine += `, ${header.address}`;
                }
                let customerHtml = `<div class="customer-name-section">${customerLine}</div>`;
                $detailsSection.append(customerHtml);
            } else if (mSettings.printCustomerPhone !== false && header.phone) {
                // শুধু phone দেখানো (নাম ছাড়া)
                let customerHtml = `<div class="customer-name-section">${header.phone}</div>`;
                $detailsSection.append(customerHtml);
            }

            // Group measurements by groupID
            if (item.measurements && item.measurements.length > 0) {
                const groupMap = new Map();
                const groupOrder = [];

                item.measurements.forEach(m => {
                    const groupId = m.groupID || m.measurementTypeID;
                    if (!groupMap.has(groupId)) {
                        groupMap.set(groupId, []);
                        groupOrder.push(groupId);
                    }
                    groupMap.get(groupId).push(m);
                });

                const fontSize = (mSettings.fontSize && mSettings.fontSize > 0) ? mSettings.fontSize : 12;
                const labelFont = getMeasurementLabelFontSize(fontSize);
                const $flex = $('<div class="measurement-groups-flex"></div>');

                const validGroups = [];
                groupOrder.forEach(groupId => {
                    const group = groupMap.get(groupId);
                    if (group && group.length > 0) {
                        const validMeasurements = group.filter(m => m.value && m.value.trim() !== '');
                        if (validMeasurements.length > 0) {
                            validGroups.push({ groupId, validMeasurements });
                        }
                    }
                });

                validGroups.forEach(function ({ validMeasurements }) {
                    $flex.append(buildMeasurementGroupBox(validMeasurements, mSettings, fontSize, labelFont));
                });

                const $fitWrap = $('<div class="measurement-table-fit"></div>');
                $fitWrap.append($flex);
                $detailsSection.append($fitWrap);
            }

            // Styles
            console.log('Styles data for item:', item.dressName, item.styles);
            if (item.styles && item.styles.length > 0) {
                // Group styles by category (preserving order)
                const catMap = new Map();
                const catOrder = [];
                item.styles.forEach(s => {
                    const cat = s.categoryName || '';
                    if (!catMap.has(cat)) {
                        catMap.set(cat, []);
                        catOrder.push(cat);
                    }
                    catMap.get(cat).push(s);
                });

                // Build style text grouped by category (same format as old project)
                const catParts = catOrder.map(cat => {
                    const styleItems = catMap.get(cat).map(s => {
                        let part = s.name;
                        if (s.measurement && s.measurement.trim()) {
                            part += ` = ${s.measurement}`;
                        }
                        return part;
                    }).join(', ');

                    if (mSettings.printStyleCategory && cat) {
                        return `${cat}(${styleItems})`;
                    }
                    return `(${styleItems})`;
                });

                let stylesText = catParts.join(' ');

                console.log('Generated styles text:', stylesText);

                if (stylesText) {
                    $detailsSection.append(`
                        <div class="styles-section">
                            ${stylesText}
                        </div>
                    `);
                }
            } else {
                console.log('No styles found for this item');
            }

            // Details
            if (item.orderDetails) {
                $detailsSection.append(`
                    <div class="details-section">
                        ${item.orderDetails}
                    </div>
                `);
            }

            $itemContainer.append($detailsSection);
            $mainContainer.append($itemContainer);
        });

        $container.append($mainContainer);

        const mFont = (mSettings.fontSize && mSettings.fontSize > 0) ? mSettings.fontSize : 12;
        const sFont = (mSettings.styleFontSize && mSettings.styleFontSize > 0) ? mSettings.styleFontSize : mFont;
        const labelFont = getMeasurementLabelFontSize(mFont);
        document.documentElement.style.setProperty('--measurement-font-size', mFont + 'px');
        document.documentElement.style.setProperty('--measurement-label-font-size', labelFont + 'px');
        document.documentElement.style.setProperty('--style-font-size', sFont + 'px');
        $('.measurement-table-fit').each(function () {
            applyMeasurementCellStyles($(this), mFont);
        });
        $('.measurement-details-section').css('font-size', mFont + 'px');
        $('.styles-section, .details-section').css('font-size', sFont + 'px');
        console.log('Applied measurement fontSize:', mFont + 'px', 'style fontSize:', sFont + 'px');

        // Re-apply border hide state after render
        if ($('#hideBorderCheckbox').is(':checked')) {
            applyMeasurementBorderState(true);
        }

        scheduleMeasurementLayoutFit();

        console.log('Measurements displayed successfully');
    }

    // Make goBack globally accessible
    window.goBack = goBack;
    
    // Download as PDF
    window.downloadPDF = function() {
        if (!orderData || !orderData.header) {
            showAlert('error', 'অর্ডার ডাটা লোড হয়নি');
            return;
        }

        $('#loadingSpinner').show();

        const header = orderData.header;
        const activeTab = $('.tab-pane.active').attr('id');
        const element = getPdfTargetElement(activeTab);
        const filename = activeTab === 'receiptTab'
            ? `Money_Receipt_${header.orderSerialNumber}.pdf`
            : `Measurement_${header.orderSerialNumber}.pdf`;

        if (!element) {
            $('#loadingSpinner').hide();
            showAlert('error', 'Content not found');
            return;
        }

        createPdfFromElement(element, filename)
            .then(({ pdf, filename: outputName }) => {
                pdf.save(outputName);
                $('#loadingSpinner').hide();
                showAlert('success', 'A4 পিডিএফ সফলভাবে ডাউনলোড হয়েছে');
            })
            .catch(error => {
                console.error('Error generating PDF:', error);
                $('#loadingSpinner').hide();
                showAlert('error', 'পিডিএফ তৈরি করতে ব্যর্থ হয়েছে');
            });
    };

    // Share as PDF
    window.shareAsPDF = function() {
        if (!orderData || !orderData.header) {
            showAlert('error', 'অর্ডার ডাটা লোড হয়নি');
            return;
        }

        $('#loadingSpinner').show();

        const header = orderData.header;
        const activeTab = $('.tab-pane.active').attr('id');
        const element = getPdfTargetElement(activeTab);
        const filename = activeTab === 'receiptTab'
            ? `Money_Receipt_${header.orderSerialNumber}.pdf`
            : `Measurement_${header.orderSerialNumber}.pdf`;

        if (!element) {
            $('#loadingSpinner').hide();
            showAlert('error', 'Content not found');
            return;
        }

        createPdfFromElement(element, filename)
            .then(({ pdf, filename: outputName }) => {
                const pdfBlob = pdf.output('blob');

                if (navigator.share && navigator.canShare) {
                    const file = new File([pdfBlob], outputName, { type: 'application/pdf' });

                    if (navigator.canShare({ files: [file] })) {
                        navigator.share({
                            title: header.institutionName || 'TailorBD',
                            text: `অর্ডার নং: ${header.orderSerialNumber}`,
                            files: [file]
                        }).then(() => {
                            $('#loadingSpinner').hide();
                            showAlert('success', 'পিডিএফ শেয়ার সফল হয়েছে');
                        }).catch((error) => {
                            console.log('Share cancelled or failed:', error);
                            $('#loadingSpinner').hide();
                            pdf.save(outputName);
                            showAlert('info', 'শেয়ার বাতিল করা হয়েছে। পিডিএফ ডাউনলোড করা হয়েছে।');
                        });
                    } else {
                        $('#loadingSpinner').hide();
                        pdf.save(outputName);
                        showAlert('warning', 'আপনার ব্রাউজার ফাইল শেয়ার সাপোর্ট করে না। পিডিএফ ডাউনলোড করা হয়েছে।');
                    }
                } else {
                    $('#loadingSpinner').hide();
                    pdf.save(outputName);
                    showShareOptions(header, outputName);
                }
            })
            .catch(error => {
                console.error('Error generating PDF:', error);
                $('#loadingSpinner').hide();
                showAlert('error', 'পিডিএফ তৈরি করতে ব্যর্থ হয়েছে');
            });
    };
    
    // Show share options for browsers without Web Share API
    function showShareOptions(header, filename) {
        const currentLang = window.currentLang || 'bn';
        let message = '';
        
        if (currentLang === 'en') {
            message = `The PDF has been downloaded. You can now share "${filename}" via:\n\n`;
            message += `• WhatsApp: Send to ${header.phone}\n`;
            message += `• Email: Attach the downloaded PDF\n`;
            message += `• Other apps: Use your phone's share feature`;
        } else {
            message = `পিডিএফ ডাউনলোড হয়েছে। এখন আপনি "${filename}" শেয়ার করতে পারেন:\n\n`;
            message += `• হোয়াটসঅ্যাপ: ${header.phone} এ পাঠান\n`;
            message += `• ইমেইল: ডাউনলোড করা পিডিএফ সংযুক্ত করুন\n`;
            message += `• অন্যান্য অ্যাপ: আপনার ফোনের শেয়ার ফিচার ব্যবহার করুন`;
        }
        
        showAlert('info', message);
    }
})();
