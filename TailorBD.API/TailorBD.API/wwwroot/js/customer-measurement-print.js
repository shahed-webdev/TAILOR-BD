// Customer Measurement Print Page - TailorBD
(function () {
    'use strict';

    let pageData = null;          // full API response data
    let printSettings = null;
    let currentDressIndex = 0;    // used when viewing one dress at a time
    let dressFilterMode = 'all';  // 'all' | number index

    const urlParams = new URLSearchParams(window.location.search);
    const customerId = parseInt(urlParams.get('customerId')) || 0;
    let clothForId = parseInt(urlParams.get('clothForId')) || 0;

    $(document).ready(function () {
        const institutionId = parseInt(sessionStorage.getItem('institutionId'));
        const registrationId = parseInt(sessionStorage.getItem('registrationId'));

        if (!institutionId || !customerId) {
            showAlert('error', 'প্রয়োজনীয় তথ্য পাওয়া যায়নি');
            setTimeout(function () { history.back(); }, 2000);
            return;
        }

        loadPrintSettings(institutionId);
        loadData(customerId, institutionId);

        // Print size selector
        $('#printSizeSelect').on('change', function () {
            const size = window.TailorBD && window.TailorBD.printSizePref
                ? window.TailorBD.printSizePref.save($(this).val())
                : $(this).val();
            applyPrintSizeToScreen(size);
            scheduleMeasurementLayoutFit();
        });

        // Dress filter dropdown
        $('#dressFilter').on('change', function () {
            const val = $(this).val();
            if (val === 'all') {
                dressFilterMode = 'all';
                currentDressIndex = 0;
                $('#dressPager').hide();
            } else {
                dressFilterMode = 'single';
                currentDressIndex = parseInt(val);
                updateDressPager();
                $('#dressPager').show();
            }
            renderMeasurements();
        });

        // Pager buttons
        $('#prevDressBtn').on('click', function () {
            if (currentDressIndex > 0) {
                currentDressIndex--;
                $('#dressFilter').val(currentDressIndex);
                updateDressPager();
                renderMeasurements();
            }
        });
        $('#nextDressBtn').on('click', function () {
            if (pageData && currentDressIndex < pageData.measurements.length - 1) {
                currentDressIndex++;
                $('#dressFilter').val(currentDressIndex);
                updateDressPager();
                renderMeasurements();
            }
        });

        // Border toggle
        $('#hideBorderCheckbox').on('change', function () {
            applyBorderState($(this).is(':checked'));
        });

        // Restore user's saved print size (default 4 inch)
        const savedPrintSize = window.TailorBD && window.TailorBD.printSizePref
            ? window.TailorBD.printSizePref.applyToSelect($('#printSizeSelect'))
            : '4';
        applyPrintSizeToScreen(savedPrintSize);

        $('#btnGoBack').on('click', goBackToCustomerDetails);

        window.addEventListener('beforeprint', function () {
            applyPrintSizeToScreen(getSelectedPrintSize());
        });
    });

    function goBackToCustomerDetails() {
        const cId = customerId;
        const cfId = clothForId || (pageData && pageData.customer && pageData.customer.clothForId) || 1;
        window.location.href = `/customer-details.html?customerId=${cId}&clothForId=${cfId}`;
    }

    window.goBackToCustomerDetails = goBackToCustomerDetails;

    // ── Data loading ──────────────────────────────────────────────

    function loadData(cId, instId) {
        $('#cmpPrintContainer').html('<div class="text-center p-4 text-muted">লোড হচ্ছে...</div>');
        $.get(`/api/customer-page/all-measurements?customerId=${cId}&institutionId=${instId}`, function (r) {
            if (!r.success || !r.data) {
                showAlert('error', r.message || 'ডাটা লোড করতে ব্যর্থ');
                $('#cmpPrintContainer').html('<div class="no-data-msg">ডাটা পাওয়া যায়নি</div>');
                return;
            }
            pageData = r.data;

            if (!clothForId && pageData.customer && pageData.customer.clothForId) {
                clothForId = pageData.customer.clothForId;
            }

            if (!pageData.measurements || pageData.measurements.length === 0) {
                $('#cmpPrintContainer').html('<div class="no-data-msg"><i class="fas fa-ruler fa-2x mb-2"></i><br>এই কাস্টমারের কোনো সেভ করা মাপ নেই</div>');
                return;
            }

            buildDressFilterOptions();
            renderMeasurements();
        }).fail(function () {
            showAlert('error', 'ডাটা লোড করতে ব্যর্থ হয়েছে');
            $('#cmpPrintContainer').html('<div class="no-data-msg">ডাটা লোড করতে সমস্যা হয়েছে</div>');
        });
    }

    function buildDressFilterOptions() {
        if (!pageData || !pageData.measurements) return;
        let opts = '<option value="all">সব পোষাক একসাথে</option>';
        pageData.measurements.forEach(function (item, idx) {
            opts += `<option value="${idx}">${escapeHtml(item.dressName)}</option>`;
        });
        $('#dressFilter').html(opts);
    }

    // ── Print settings ────────────────────────────────────────────

    function loadPrintSettings(institutionId) {
        $.get(`/api/institution/${institutionId}/print-settings`, function (r) {
            if (r.success && r.data) {
                printSettings = r.data;
                applyPrintSettings();
            }
        });
    }

    function applyPrintSettings() {
        if (!printSettings) return;
        const mSettings = printSettings.measurement || {};
        if (mSettings.topSpace !== undefined) {
            document.documentElement.style.setProperty('--measurement-top-space', mSettings.topSpace + 'px');
        }
        const mFont = (mSettings.fontSize && mSettings.fontSize > 0) ? mSettings.fontSize : 12;
        const sFont = (mSettings.styleFontSize && mSettings.styleFontSize > 0) ? mSettings.styleFontSize : mFont;
        const labelFont = getMeasurementLabelFontSize(mFont);
        document.documentElement.style.setProperty('--measurement-font-size', mFont + 'px');
        document.documentElement.style.setProperty('--measurement-label-font-size', labelFont + 'px');
        document.documentElement.style.setProperty('--style-font-size', sFont + 'px');
        if (printSettings.moneyReceipt && printSettings.moneyReceipt.fontSize) {
            document.documentElement.style.setProperty('--print-font-size', printSettings.moneyReceipt.fontSize + 'px');
        }
        // Re-render if data already loaded
        if (pageData && pageData.measurements && pageData.measurements.length > 0) {
            renderMeasurements();
        }
    }

    // ── Pager ─────────────────────────────────────────────────────

    function updateDressPager() {
        if (!pageData) return;
        const total = pageData.measurements.length;
        $('#dressPageInfo').text(`${currentDressIndex + 1} / ${total}`);
        $('#prevDressBtn').prop('disabled', currentDressIndex === 0);
        $('#nextDressBtn').prop('disabled', currentDressIndex >= total - 1);
    }

    // ── Render measurements ───────────────────────────────────────

    function buildShopNameLine() {
        const instName = pageData.institutionName || sessionStorage.getItem('institutionName') || 'TailorBD';
        const instPhone = pageData.institutionPhone || '';
        if (instName && instPhone) return escapeHtml(instName) + '-' + escapeHtml(instPhone);
        return escapeHtml(instName);
    }

    function renderMeasurements() {
        if (!pageData || !pageData.measurements || pageData.measurements.length === 0) return;

        const mSettings = getMeasurementSettings();
        const $container = $('#cmpPrintContainer');
        $container.empty();

        const cust = pageData.customer;
        const shopLine = buildShopNameLine();

        const $mainWrap = $('<div class="measurements-main-container"></div>');

        let itemsToRender;
        if (dressFilterMode === 'all') {
            itemsToRender = pageData.measurements;
        } else {
            itemsToRender = [pageData.measurements[currentDressIndex]];
        }

        itemsToRender.forEach(function (item) {
            const $itemContainer = $('<div class="measurement-item-container cmp-slip"></div>');

            // ১. শপ নেম (উপরে কেবল দোকানের নাম)
            $itemContainer.append(`<div class="cmp-shop-name">${shopLine}</div>`);

            // ২. টেবিলে কাস্টমার আইডি ও পোষাক নেম
            const custIdLabel = cust.customerNumber ? `C.No: ${escapeHtml(cust.customerNumber)}` : '-';
            $itemContainer.append(`
                <table class="cmp-meta-table">
                    <tr>
                        <td>${custIdLabel}</td>
                        <td>${escapeHtml(item.dressName)}</td>
                    </tr>
                </table>
            `);

            // ৩. কাস্টমার নাম হাইলাইট
            $itemContainer.append(`<div class="cmp-cust-highlight">${escapeHtml(cust.customerName || '-')}</div>`);

            // ৪. ঠিকানা ছোট ফন্টে
            if (cust.address && cust.address.trim()) {
                $itemContainer.append(`<div class="cmp-cust-address">${escapeHtml(cust.address)}</div>`);
            }

            const $detailsSection = $('<div class="measurement-details-section"></div>');

            // Measurements grid (grouped by groupID)
            if (item.measurements && item.measurements.length > 0) {
                const groupMap = new Map();
                const groupOrder = [];

                item.measurements.forEach(function (m) {
                    const gId = m.groupID || m.measurementTypeID;
                    if (!groupMap.has(gId)) {
                        groupMap.set(gId, []);
                        groupOrder.push(gId);
                    }
                    groupMap.get(gId).push(m);
                });

                const validGroups = [];
                groupOrder.forEach(function (gId) {
                    const group = groupMap.get(gId);
                    const valid = group.filter(function (m) { return m.value && m.value.trim() !== ''; });
                    if (valid.length > 0) validGroups.push({ gId, valid });
                });

                const mFont = (mSettings.fontSize && mSettings.fontSize > 0) ? mSettings.fontSize : 12;
                const $flex = $('<div class="measurement-groups-flex"></div>');

                validGroups.forEach(function ({ valid }) {
                    const $box = $('<div class="measurement-group-box"></div>');
                    const $innerTable = $('<table class="measurement-group-inner"></table>');
                    const $innerTbody = $('<tbody></tbody>');

                    valid.forEach(function (m, idx) {
                        if (mSettings.printMeasurementName) {
                            const $typeRow = $('<tr></tr>');
                            $typeRow.append(`<td class="measurement-type-cell">${escapeHtml(m.type)}</td>`);
                            $innerTbody.append($typeRow);
                        }

                        const $valRow = $('<tr></tr>');
                        $valRow.append(`<td class="measurement-value-cell">${formatMeasurementValueHtml(m.value)}</td>`);
                        $innerTbody.append($valRow);

                        if (idx < valid.length - 1) {
                            const $sepRow = $('<tr></tr>');
                            $sepRow.append('<td class="measurement-separator"></td>');
                            $innerTbody.append($sepRow);
                        }
                    });

                    $innerTable.append($innerTbody);
                    $box.append($innerTable);
                    $flex.append($box);
                });

                const $fitWrap = $('<div class="measurement-table-fit"></div>');
                $fitWrap.append($flex);
                $detailsSection.append($fitWrap);
            }

            // Styles
            if (item.styles && item.styles.length > 0) {
                const catMap = new Map();
                const catOrder = [];
                item.styles.forEach(function (s) {
                    const cat = s.categoryName || '';
                    if (!catMap.has(cat)) { catMap.set(cat, []); catOrder.push(cat); }
                    catMap.get(cat).push(s);
                });

                const catParts = catOrder.map(function (cat) {
                    const parts = catMap.get(cat).map(function (s) {
                        return s.measurement && s.measurement.trim() ? `${escapeHtml(s.name)} = ${escapeHtml(s.measurement)}` : escapeHtml(s.name);
                    }).join(', ');
                    return mSettings.printStyleCategory && cat ? `${escapeHtml(cat)}(${parts})` : `(${parts})`;
                });

                const stylesText = catParts.join(' ');
                if (stylesText) {
                    $detailsSection.append(`<div class="styles-section">${stylesText}</div>`);
                }
            }

            // Details note
            if (item.details && item.details.trim()) {
                $detailsSection.append(`<div class="details-section">${escapeHtml(item.details)}</div>`);
            }

            $itemContainer.append($detailsSection);
            $mainWrap.append($itemContainer);
        });

        $container.append($mainWrap);

        const mFont = (mSettings.fontSize && mSettings.fontSize > 0) ? mSettings.fontSize : 12;
        const sFont = (mSettings.styleFontSize && mSettings.styleFontSize > 0) ? mSettings.styleFontSize : mFont;
        const labelFont = getMeasurementLabelFontSize(mFont);
        document.documentElement.style.setProperty('--measurement-font-size', mFont + 'px');
        document.documentElement.style.setProperty('--measurement-label-font-size', labelFont + 'px');
        document.documentElement.style.setProperty('--style-font-size', sFont + 'px');
        $('.styles-section, .details-section').css('font-size', sFont + 'px');

        // Apply border hide state after render
        if ($('#hideBorderCheckbox').is(':checked')) {
            applyBorderState(true);
        }

        applyPrintSizeToScreen($('#printSizeSelect').val());
        scheduleMeasurementLayoutFit();
    }

    function getMeasurementTargetWidth() {
        const map = { '3': 288, '3.5': 336, '4': 384, '4.5': 432, '5': 480, '6': 576, '6.5': 624 };
        const size = $('#printSizeSelect').val() || '4';
        const borderReserve = 4;
        const containerPadding = 8;
        return (map[size] || 384) - containerPadding - borderReserve;
    }

    function scheduleMeasurementLayoutFit() {
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                fitMeasurementTablesToPaper();
            });
        });
    }

    function getMeasurementLabelFontSize(valueFontPx) {
        const vf = valueFontPx > 0 ? valueFontPx : 12;
        return Math.max(9, Math.round(vf * 0.85));
    }

    function getMeasurementSettingFontSize() {
        const mSettings = getMeasurementSettings();
        if (mSettings.fontSize && mSettings.fontSize > 0) return mSettings.fontSize;
        const cssVar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--measurement-font-size'));
        return cssVar > 0 ? cssVar : 12;
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
            whiteSpace: 'nowrap',
            wordBreak: 'normal',
            overflowWrap: 'normal',
            overflow: 'visible'
        });
        $container.find('.measurement-value-cell').css({
            fontSize: valueFontPx + 'px',
            color: '#000',
            padding: (vPad + 1) + 'px ' + hPad + 'px',
            whiteSpace: 'nowrap',
            wordBreak: 'normal',
            overflowWrap: 'normal',
            overflow: 'visible'
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
        const settingFont = getMeasurementSettingFontSize();
        const targetWidth = getMeasurementTargetWidth();

        $('#cmpPrintContainer .measurement-table-fit').each(function () {
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
                padding: '0 0 2px',
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

    // ── Border ────────────────────────────────────────────────────

    function applyBorderState(hide) {
        if (hide) {
            $('.measurement-group-inner').css('border', 'none');
            $('.measurement-group-inner td:not(.measurement-separator)').css('border', 'none');
        } else {
            $('.measurement-group-inner').css('border', '1px solid #666');
            $('.measurement-group-inner td:not(.measurement-separator)').css('border', '');
        }
    }

    // ── Print size ────────────────────────────────────────────────

    function applyPrintSizeToScreen(size) {
        const map = { '3': 288, '3.5': 336, '4': 384, '4.5': 432, '5': 480, '6': 576, '6.5': 624 };
        const px = map[size] || 384;
        const widthInInches = parseFloat(size) || 4;
        document.documentElement.style.setProperty('--print-width', widthInInches + 'in');
        $('.measurements-main-container').css({ 'max-width': px + 'px', 'width': '100%', 'margin': '0 auto' });
        $('body').attr('data-print-size', size);
    }

    // ── PDF helpers ───────────────────────────────────────────────

    const PDF_A4_WIDTH_MM = 210;
    const PDF_A4_HEIGHT_MM = 297;
    const PDF_MARGIN_MM = 10;

    function getSelectedPrintSize() {
        return $('#printSizeSelect').val() || '4';
    }

    function getPdfCaptureElement() {
        return document.querySelector('#cmpPrintContainer .measurements-main-container')
            || document.getElementById('cmpPrintContainer');
    }

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
                    const cloneTarget = clonedDoc.querySelector('#cmpPrintContainer .measurements-main-container')
                        || clonedDoc.getElementById('cmpPrintContainer');
                    if (cloneTarget) {
                        cloneTarget.style.overflow = 'visible';
                        cloneTarget.style.background = '#ffffff';
                    }
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

    function createPdfFromElement(element) {
        const sizeInInches = parseFloat(getSelectedPrintSize()) || 4;
        const contentWidthMm = sizeInInches * 25.4;

        return captureForPdf(element).then(function (canvas) {
            if (!canvas || canvas.width < 2 || canvas.height < 2) {
                throw new Error('Empty canvas');
            }
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            addCanvasToA4Pdf(pdf, canvas, contentWidthMm);
            return pdf;
        });
    }

    window.downloadPDF = function () {
        const element = getPdfCaptureElement();
        if (!element || !element.querySelector('.measurement-item-container, .cmp-slip')) {
            showAlert('error', 'প্রিন্ট করার মতো কোনো মাপ পাওয়া যায়নি');
            return;
        }
        $('#loadingSpinner').show();
        const custName = (pageData && pageData.customer && pageData.customer.customerName) ? pageData.customer.customerName : 'Customer';
        createPdfFromElement(element)
            .then(function (pdf) {
                pdf.save(`Measurement_${custName}.pdf`);
                $('#loadingSpinner').hide();
                showAlert('success', 'A4 পিডিএফ সফলভাবে ডাউনলোড হয়েছে');
            })
            .catch(function () {
                $('#loadingSpinner').hide();
                showAlert('error', 'পিডিএফ তৈরি করতে ব্যর্থ হয়েছে');
            });
    };

    window.shareAsPDF = function () {
        const element = getPdfCaptureElement();
        if (!element || !element.querySelector('.measurement-item-container, .cmp-slip')) {
            showAlert('error', 'শেয়ার করার মতো কোনো মাপ পাওয়া যায়নি');
            return;
        }
        $('#loadingSpinner').show();
        const custName = (pageData && pageData.customer && pageData.customer.customerName) ? pageData.customer.customerName : 'Customer';
        const filename = `Measurement_${custName}.pdf`;
        createPdfFromElement(element)
            .then(function (pdf) {
                const pdfBlob = pdf.output('blob');
                if (navigator.share && navigator.canShare) {
                    const file = new File([pdfBlob], filename, { type: 'application/pdf' });
                    if (navigator.canShare({ files: [file] })) {
                        navigator.share({ title: custName, files: [file] })
                            .then(function () { $('#loadingSpinner').hide(); showAlert('success', 'পিডিএফ শেয়ার সফল হয়েছে'); })
                            .catch(function () { $('#loadingSpinner').hide(); pdf.save(filename); });
                        return;
                    }
                }
                $('#loadingSpinner').hide();
                pdf.save(filename);
                showAlert('info', 'A4 পিডিএফ ডাউনলোড করা হয়েছে');
            })
            .catch(function () {
                $('#loadingSpinner').hide();
                showAlert('error', 'পিডিএফ তৈরি করতে ব্যর্থ হয়েছে');
            });
    };

    // ── Helpers ───────────────────────────────────────────────────

    function getMeasurementSettings() {
        if (printSettings && printSettings.measurement) return printSettings.measurement;
        return {
            printShopName: false,
            printMasterCopy: true,
            printMeasurementName: false,
            printStyleCategory: false,
            fontSize: 12,
            styleFontSize: 14
        };
    }

    function showAlert(type, message) {
        const cls = type === 'error' ? 'alert-danger' : type === 'success' ? 'alert-success' : 'alert-info';
        $('#alertContainer').html(`
            <div class="alert ${cls} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>`);
        setTimeout(function () { $('#alertContainer .alert').fadeOut(); }, 5000);
    }

    function escapeHtml(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

})();
