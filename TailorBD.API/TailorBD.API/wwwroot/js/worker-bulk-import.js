/* worker-bulk-import.js — add cutting masters / artisans (কারিগর) in bulk from Excel or CSV.
   The file is read in the browser with SheetJS (/lib/sheetjs, loaded only when needed);
   the server (POST .../bulk) trims, normalises phones, skips duplicates and inserts. */
(function () {
    'use strict';

    var SHEETJS_SRC = '/lib/sheetjs/xlsx.full.min.js?v=0.20.3';
    var MAX_ROWS = 1000;
    var MAX_BYTES = 2 * 1024 * 1024;

    var KINDS = {
        master: {
            url: '/api/Cutting/masters/bulk',
            title: { bn: 'এক্সেল দিয়ে কাটিং মাস্টার যুক্ত করুন', en: 'Add Cutting Masters from Excel' },
            file: 'cutting-masters-template.xlsx',
            example: ['রহিম মিয়া', '01712345678']
        },
        artisan: {
            url: '/api/Factory/artisans/bulk',
            title: { bn: 'এক্সেল দিয়ে কারিগর যুক্ত করুন', en: 'Add Artisans from Excel' },
            file: 'artisans-template.xlsx',
            example: ['করিম শেখ', '01812345678']
        }
    };

    var L = {
        help: { bn: 'প্রথম সারিতে হেডার থাকবে: নাম, ফোন (Name, Phone)। নাম আবশ্যক, ফোন ঐচ্ছিক। সর্বোচ্চ ' + MAX_ROWS + 'টি সারি। .xlsx, .xls বা .csv ফাইল।',
                en: 'First row = headers: Name, Phone (নাম, ফোন). Name is required, phone optional. Max ' + MAX_ROWS + ' rows. .xlsx, .xls or .csv file.' },
        template: { bn: 'নমুনা ফাইল ডাউনলোড', en: 'Download sample file' },
        chooseFile: { bn: 'ফাইল নির্বাচন করুন', en: 'Choose file' },
        upload: { bn: 'আপলোড করুন', en: 'Upload' },
        uploading: { bn: 'আপলোড হচ্ছে...', en: 'Uploading...' },
        loadingLib: { bn: 'লোড হচ্ছে...', en: 'Loading...' },
        noFile: { bn: 'একটি ফাইল নির্বাচন করুন', en: 'Please choose a file' },
        badType: { bn: 'শুধু .xlsx, .xls বা .csv ফাইল দিন', en: 'Only .xlsx, .xls or .csv files' },
        tooBig: { bn: 'ফাইল ২ MB এর বেশি', en: 'File is larger than 2 MB' },
        readErr: { bn: 'ফাইল পড়া যায়নি। সঠিক এক্সেল/CSV ফাইল দিন।', en: 'Could not read the file. Please use a valid Excel/CSV file.' },
        noHeader: { bn: 'হেডার সারি পাওয়া যায়নি। প্রথম সারিতে "নাম" ও "ফোন" (বা Name, Phone) লিখুন।', en: 'Header row not found. Put "Name" and "Phone" (or নাম, ফোন) in the first row.' },
        noRows: { bn: 'ফাইলে কোনো ডেটা সারি নেই', en: 'The file has no data rows' },
        tooMany: { bn: 'সর্বোচ্চ ' + MAX_ROWS + 'টি সারি একবারে আপলোড করা যায়', en: 'At most ' + MAX_ROWS + ' rows per upload' },
        libErr: { bn: 'এক্সেল লাইব্রেরি লোড হয়নি। ইন্টারনেট/পেজ রিফ্রেশ করে আবার চেষ্টা করুন।', en: 'Excel library failed to load. Refresh the page and try again.' },
        err: { bn: 'সমস্যা হয়েছে', en: 'Something went wrong' },
        added: { bn: 'যুক্ত হয়েছে', en: 'Added' },
        skipped: { bn: 'বাদ পড়েছে', en: 'Skipped' },
        blank: { bn: 'খালি সারি উপেক্ষা করা হয়েছে', en: 'Blank rows ignored' },
        persons: { bn: 'জন', en: '' },
        rowsWord: { bn: 'টি সারি', en: 'row(s)' },
        colRow: { bn: 'সারি', en: 'Row' },
        colName: { bn: 'নাম', en: 'Name' },
        colPhone: { bn: 'ফোন', en: 'Phone' },
        colReason: { bn: 'কারণ', en: 'Reason' },
        EMPTY_NAME: { bn: 'নাম খালি', en: 'Name is empty' },
        NAME_TOO_LONG: { bn: 'নাম ১৫০ অক্ষরের বেশি', en: 'Name is longer than 150 characters' },
        INVALID_PHONE: { bn: 'ফোন নম্বর সঠিক নয় (১১ সংখ্যার মোবাইল নম্বর দিন)', en: 'Invalid phone (use an 11-digit mobile number)' },
        SCI_PHONE: { bn: 'ফোন নম্বর 1.71E+09 ধরনের ফরম্যাটে আছে; সেলটি Text করে পুরো নম্বর লিখুন', en: 'Phone is in scientific format (e.g. 1.71E+09); format the cell as Text and type the full number' },
        DUP_EXISTING: { bn: 'এই ফোন নম্বরে আগে থেকেই আছে', en: 'Already exists with this phone' },
        DUP_NAME: { bn: 'ফোন নেই, আর এই নামে আগে থেকেই আছে', en: 'No phone, and this name already exists' },
        DUP_IN_FILE: { bn: 'একই ফোন নম্বর ফাইলের আগের সারিতে আছে', en: 'Same phone already in an earlier row of the file' },
        noteSheet: { bn: 'নির্দেশনা', en: 'Instructions' }
    };

    // header aliases (compared after lower-casing and removing spaces, *, :, ., _, -)
    var NAME_HEADERS = ['নাম', 'name', 'fullname', 'workername', 'mastername', 'artisanname', 'মাস্টারেরনাম', 'কারিগরেরনাম', 'মাস্টার', 'কাটিংমাস্টার', 'কারিগর'];
    var PHONE_HEADERS = ['ফোন', 'মোবাইল', 'phone', 'mobile', 'phoneno', 'phonenumber', 'mobileno', 'mobilenumber', 'ফোননম্বর', 'মোবাইলনম্বর', 'ফোননং', 'মোবাইলনং', 'contact', 'contactno', 'cell'];

    var current = null;      // { kind, institutionId, registrationId, onDone }
    var lastResult = null;
    var libPromise = null;

    function lang() {
        var l = window.currentLang || localStorage.getItem('preferredLanguage') || 'bn';
        return l === 'en' ? 'en' : 'bn';
    }
    function tr(k) { return (L[k] && L[k][lang()]) || k; }
    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function span(k) {
        return '<span class="lang-content" data-en="' + esc(L[k].en) + '" data-bn="' + esc(L[k].bn) + '">' + esc(tr(k)) + '</span>';
    }

    function loadLib() {
        if (window.XLSX) return Promise.resolve(window.XLSX);
        if (libPromise) return libPromise;
        libPromise = new Promise(function (resolve, reject) {
            var s = document.createElement('script');
            s.src = SHEETJS_SRC;
            s.onload = function () { window.XLSX ? resolve(window.XLSX) : reject(new Error('XLSX missing')); };
            s.onerror = function () { libPromise = null; reject(new Error('load failed')); };
            document.head.appendChild(s);
        });
        return libPromise;
    }

    function ensureModal() {
        if (document.getElementById('bulkImportModal')) return;
        var html =
            '<div class="modal-overlay" id="bulkImportModal">' +
            '  <div class="modal-box" style="width:min(600px,94vw);">' +
            '    <div class="modal-hdr">' +
            '      <h6 class="mb-0" id="bulkImportTitle"></h6>' +
            '      <button type="button" onclick="closeModal(\'bulkImportModal\')">&times;</button>' +
            '    </div>' +
            '    <div class="modal-body-p">' +
            '      <p style="font-size:12px;color:#555;margin-bottom:10px;">' + span('help') + '</p>' +
            '      <div class="mb-3"><a href="#" id="bulkTplLink" style="font-size:13px;font-weight:600;color:#28a745;text-decoration:none;">' +
            '        <i class="fas fa-file-excel me-1"></i>' + span('template') + '</a></div>' +
            '      <div class="mb-3">' +
            '        <label class="fw-bold" style="font-size:12px;">' + span('chooseFile') + ' *</label>' +
            '        <input type="file" id="bulkFile" class="f-input" accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv">' +
            '      </div>' +
            '      <button type="button" class="btn-suc w-100" id="bulkUploadBtn"><i class="fas fa-upload me-1"></i><span id="bulkUploadLbl"></span></button>' +
            '      <div id="bulkResult" class="mt-3"></div>' +
            '    </div>' +
            '  </div>' +
            '</div>';
        $('body').append(html);
        $('#bulkTplLink').on('click', function (e) { e.preventDefault(); downloadTemplate(); });
        $('#bulkUploadBtn').on('click', upload);
        $(document).on('languageChanged', function () {
            if (!current) return;
            $('#bulkImportTitle').text(KINDS[current.kind].title[lang()]);
            setBusy(false);
            if (lastResult) renderResult(lastResult);
        });
    }

    function setBusy(busy, key) {
        $('#bulkUploadBtn').prop('disabled', !!busy);
        $('#bulkUploadLbl').text(tr(busy ? (key || 'uploading') : 'upload'));
    }
    function showError(msg) {
        lastResult = null;
        $('#bulkResult').html('<div class="alert alert-danger py-2 mb-0" style="font-size:13px;">' + esc(msg) + '</div>');
    }

    function downloadTemplate() {
        var k = KINDS[current.kind];
        loadLib().then(function (XLSX) {
            var aoa = [['নাম', 'ফোন'], [k.example[0], k.example[1]]];
            for (var i = 0; i < 200; i++) aoa.push(['', '']);
            var ws = XLSX.utils.aoa_to_sheet(aoa);
            // phone column as Text so Excel keeps the leading 0
            for (var r = 1; r <= 201; r++) {
                var ref = XLSX.utils.encode_cell({ r: r, c: 1 });
                if (ws[ref]) { ws[ref].t = 's'; ws[ref].z = '@'; }
            }
            ws['!cols'] = [{ wch: 30 }, { wch: 18 }];
            var notes = XLSX.utils.aoa_to_sheet([
                ['নির্দেশনা / Instructions'],
                ['১. প্রথম শিটের প্রথম সারির হেডার (নাম, ফোন) পরিবর্তন করবেন না। ইংরেজিতে Name, Phone লিখলেও চলবে।'],
                ['২. নাম আবশ্যক; ফোন ঐচ্ছিক। ২ নম্বর সারির উদাহরণটি মুছে আপনার তথ্য লিখুন।'],
                ['৩. ফোন ১১ সংখ্যার মোবাইল নম্বর (যেমন 01712345678)। শুরুর 0 বাদ পড়লেও সমস্যা নেই।'],
                ['৪. একই ফোন নম্বর আগে থেকে থাকলে বা ফাইলে দুইবার থাকলে সেই সারি বাদ যাবে। ফোন না থাকলে একই নাম দুইবার যুক্ত হবে না।'],
                ['৫. একবারে সর্বোচ্চ ' + MAX_ROWS + 'টি সারি।'],
                [''],
                ['1. Keep the header row (Name, Phone) of the first sheet. Bengali headers (নাম, ফোন) also work.'],
                ['2. Name is required; phone is optional. Replace the example in row 2 with your data.'],
                ['3. Phone: 11-digit mobile number (e.g. 01712345678). A missing leading 0 is fixed automatically.'],
                ['4. Rows whose phone already exists, or appears twice in the file, are skipped. Without a phone, the same name is not added twice.'],
                ['5. At most ' + MAX_ROWS + ' rows per upload.']
            ]);
            notes['!cols'] = [{ wch: 100 }];
            var wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, current.kind === 'master' ? 'Masters' : 'Artisans');
            XLSX.utils.book_append_sheet(wb, notes, 'Instructions');
            XLSX.writeFile(wb, k.file);
        }).catch(function () { showError(tr('libErr')); });
    }

    function normHeader(v) {
        return String(v == null ? '' : v).toLowerCase().replace(/[\s*:._\-()]/g, '');
    }

    function cellText(v) {
        if (v == null) return '';
        if (typeof v === 'number') {
            // Excel stores phones typed without quotes as numbers (1712345678): keep every digit
            return Number.isInteger(v) && Math.abs(v) < 1e21 ? v.toFixed(0) : String(v);
        }
        if (v instanceof Date) return '';
        return String(v).trim();
    }

    // -> { rows: [{rowNumber,name,phone}], blank: n } or { error: key }
    function extractRows(XLSX, wb) {
        var ws = wb.Sheets[wb.SheetNames[0]];
        if (!ws || !ws['!ref']) return { error: 'noRows' };
        var startRow = XLSX.utils.decode_range(ws['!ref']).s.r;   // 0-based sheet row of aoa[0]
        var aoa = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '', blankrows: true });

        var headerIdx = -1, nameCol = -1, phoneCol = -1;
        for (var i = 0; i < Math.min(aoa.length, 10) && headerIdx < 0; i++) {
            var row = aoa[i] || [];
            for (var c = 0; c < row.length; c++) {
                var h = normHeader(row[c]);
                if (nameCol < 0 && NAME_HEADERS.indexOf(h) >= 0) nameCol = c;
                else if (phoneCol < 0 && PHONE_HEADERS.indexOf(h) >= 0) phoneCol = c;
            }
            if (nameCol >= 0) headerIdx = i; else phoneCol = -1;
        }
        if (headerIdx < 0) return { error: 'noHeader' };

        var rows = [], blank = 0;
        for (var j = headerIdx + 1; j < aoa.length; j++) {
            var r = aoa[j] || [];
            var name = cellText(r[nameCol]);
            var phone = phoneCol >= 0 ? cellText(r[phoneCol]) : '';
            if (!name && !phone) { blank++; continue; }
            rows.push({ rowNumber: startRow + j + 1, name: name, phone: phone });
        }
        if (!rows.length) return { error: 'noRows' };
        if (rows.length > MAX_ROWS) return { error: 'tooMany' };
        return { rows: rows, blank: blank };
    }

    function readWorkbook(XLSX, file) {
        var isCsv = /\.csv$/i.test(file.name);
        return new Promise(function (resolve, reject) {
            var fr = new FileReader();
            fr.onerror = function () { reject(fr.error); };
            fr.onload = function () {
                try {
                    // CSV: read as UTF-8 text and keep values as text (no 0171.. -> 171.. conversion)
                    resolve(isCsv ? XLSX.read(fr.result, { type: 'string', raw: true })
                                  : XLSX.read(new Uint8Array(fr.result), { type: 'array' }));
                } catch (e) { reject(e); }
            };
            if (isCsv) fr.readAsText(file, 'UTF-8'); else fr.readAsArrayBuffer(file);
        });
    }

    function upload() {
        var file = ($('#bulkFile')[0].files || [])[0];
        if (!file) { showError(tr('noFile')); return; }
        if (!/\.(xlsx|xls|csv)$/i.test(file.name)) { showError(tr('badType')); return; }
        if (file.size > MAX_BYTES) { showError(tr('tooBig')); return; }

        var cfg = current;
        setBusy(true, 'loadingLib');
        $('#bulkResult').empty();
        loadLib().then(function (XLSX) {
            return readWorkbook(XLSX, file).then(function (wb) {
                var ex = extractRows(XLSX, wb);
                if (ex.error) { setBusy(false); showError(tr(ex.error)); return; }
                setBusy(true, 'uploading');
                $.ajax({
                    url: KINDS[cfg.kind].url,
                    method: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({ institutionID: cfg.institutionId, registrationID: cfg.registrationId, rows: ex.rows })
                }).done(function (res) {
                    setBusy(false);
                    if (!res || !res.success) { showError((res && res.message) || tr('err')); return; }
                    renderResult(res);
                    $('#bulkFile').val('');
                    if (typeof cfg.onDone === 'function' && res.added > 0) cfg.onDone();
                }).fail(function (xhr) {
                    setBusy(false);
                    showError((xhr.responseJSON && xhr.responseJSON.message) || tr('err'));
                });
            }, function () { setBusy(false); showError(tr('readErr')); });
        }, function () { setBusy(false); showError(tr('libErr')); });
    }

    function reasonText(s) {
        var txt = tr(s.reason);
        if ((s.reason === 'DUP_EXISTING' || s.reason === 'DUP_NAME') && s.detail) txt += ' (' + s.detail + ')';
        if (s.reason === 'DUP_IN_FILE' && s.detail) txt += ' (' + tr('colRow') + ' ' + s.detail + ')';
        return txt;
    }

    function renderResult(res) {
        lastResult = res;
        var skipped = res.skipped || [];
        var h = '<div class="alert ' + (res.added > 0 ? 'alert-success' : 'alert-warning') + ' py-2 mb-2" style="font-size:13px;">' +
            '<i class="fas fa-check-circle me-1"></i><strong>' + esc(tr('added')) + ': ' + res.added + ' ' + esc(tr('persons')) + '</strong>' +
            ' &nbsp;|&nbsp; ' + esc(tr('skipped')) + ': ' + skipped.length + ' ' + esc(tr('rowsWord')) +
            (res.blankRows ? ' &nbsp;|&nbsp; ' + esc(tr('blank')) + ': ' + res.blankRows : '') +
            '</div>';
        if (skipped.length) {
            h += '<div style="max-height:240px;overflow:auto;border:1px solid #eee;border-radius:7px;">' +
                '<table class="data-table" style="font-size:12px;margin:0;"><thead><tr>' +
                '<th>' + esc(tr('colRow')) + '</th><th>' + esc(tr('colName')) + '</th><th>' + esc(tr('colPhone')) + '</th><th>' + esc(tr('colReason')) + '</th>' +
                '</tr></thead><tbody>';
            skipped.forEach(function (s) {
                h += '<tr><td>' + esc(s.rowNumber) + '</td><td>' + esc(s.name || '-') + '</td><td>' + esc(s.phone || '-') + '</td>' +
                    '<td style="color:#c0392b;">' + esc(reasonText(s)) + '</td></tr>';
            });
            h += '</tbody></table></div>';
        }
        $('#bulkResult').html(h);
    }

    // cfg: { kind: 'master' | 'artisan', institutionId, registrationId, onDone }
    function open(cfg) {
        if (!cfg || !KINDS[cfg.kind]) return;
        ensureModal();
        current = cfg;
        lastResult = null;
        $('#bulkImportTitle').text(KINDS[cfg.kind].title[lang()]);
        $('#bulkFile').val('');
        $('#bulkResult').empty();
        setBusy(false);
        $('#bulkImportModal .lang-content').each(function () {
            var v = $(this).attr(lang() === 'en' ? 'data-en' : 'data-bn');
            if (v != null) $(this).text(v);
        });
        $('#bulkImportModal').addClass('show');
        loadLib().catch(function () { /* reported when used */ });
    }

    window.WorkerBulkImport = { open: open, _extractRows: extractRows, _downloadTemplate: downloadTemplate };
})();
