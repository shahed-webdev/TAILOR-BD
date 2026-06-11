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
        document.documentElement.style.setProperty('--measurement-font-size', mFont + 'px');
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
                const MAX_COLS = getMaxMeasurementColsPerRow(mFont);
                const $outerTable = $('<table class="measurement-groups-table"></table>');
                const $outerTbody = $('<tbody></tbody>');

                for (let rowStart = 0; rowStart < validGroups.length; rowStart += MAX_COLS) {
                    const rowGroups = validGroups.slice(rowStart, rowStart + MAX_COLS);
                    const $outerTr = $('<tr></tr>');

                    rowGroups.forEach(function ({ valid }) {
                        const $td = $('<td></td>');
                        const $innerTable = $('<table class="measurement-group-inner"></table>');
                        const $innerTbody = $('<tbody></tbody>');

                        valid.forEach(function (m, idx) {
                            if (mSettings.printMeasurementName) {
                                const $typeRow = $('<tr></tr>');
                                $typeRow.append(`<td class="measurement-type-cell">${escapeHtml(m.type)}</td>`);
                                $innerTbody.append($typeRow);
                            }

                            const $valRow = $('<tr></tr>');
                            $valRow.append(`<td class="measurement-value-cell">${escapeHtml(m.value)}</td>`);
                            $innerTbody.append($valRow);

                            if (idx < valid.length - 1) {
                                const $sepRow = $('<tr></tr>');
                                $sepRow.append('<td class="measurement-separator"></td>');
                                $innerTbody.append($sepRow);
                            }
                        });

                        $innerTable.append($innerTbody);
                        $td.append($innerTable);
                        $outerTr.append($td);
                    });

                    $outerTbody.append($outerTr);
                }

                $outerTable.append($outerTbody);
                const $fitWrap = $('<div class="measurement-table-fit"></div>');
                $fitWrap.append($outerTable);
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
        document.documentElement.style.setProperty('--measurement-font-size', mFont + 'px');
        document.documentElement.style.setProperty('--style-font-size', sFont + 'px');
        $('.measurement-type-cell, .measurement-value-cell').css({ fontSize: mFont + 'px', color: '#000' });
        $('.styles-section, .details-section').css('font-size', sFont + 'px');

        // Apply border hide state after render
        if ($('#hideBorderCheckbox').is(':checked')) {
            applyBorderState(true);
        }

        applyPrintSizeToScreen($('#printSizeSelect').val());
    }

    // ── Border ────────────────────────────────────────────────────

    function applyBorderState(hide) {
        if (hide) {
            $('.measurement-groups-table td table').css('border', 'none');
            $('.measurement-groups-table td table td:not(.measurement-separator)').css('border', 'none');
        } else {
            $('.measurement-groups-table td table').css('border', '1px solid #666');
            $('.measurement-groups-table td table td:not(.measurement-separator)').css('border', '');
        }
    }

    // ── Print size ────────────────────────────────────────────────

    function applyPrintSizeToScreen(size) {
        const map = { '3': 288, '3.5': 336, '4': 384, '4.5': 432, '5': 480 };
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

    function getMaxMeasurementColsPerRow(fontPx) {
        const fs = fontPx > 0 ? fontPx : 12;
        if (fs <= 12) return 8;
        if (fs <= 14) return 7;
        if (fs <= 18) return 6;
        return 5;
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

})();
