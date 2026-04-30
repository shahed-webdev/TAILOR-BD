/* employee.js */
(function () {
    'use strict';

    let institutionId  = 0;
    let registrationId = 0;
    let activeEmpId    = 0;
    let activeDetTab   = 'work';
    const PAGE = 20;

    const fmt  = v => '৳' + parseFloat(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const today = () => new Date().toISOString().slice(0, 10);

    // ─── Lang helper ───────────────────────────────────────────────────────────
    const LANG = {
        noEmployee:   { bn: 'কোনো কর্মচারী নেই',    en: 'No employees found' },
        total:        { bn: 'মোট',                   en: 'Total' },
        people:       { bn: 'জন',                    en: '' },
        noRecord:     { bn: 'কোনো রেকর্ড নেই',      en: 'No records found' },
        page:         { bn: 'পেজ',                   en: 'Page' },
        deleteConfirm:{ bn: 'কে মুছে ফেলবেন?',      en: 'will be deleted. Are you sure?' },
        deleteRowConf:{ bn: 'মুছে ফেলবেন?',          en: 'Delete this record?' },
        fillAll:      { bn: 'সব তথ্য পূরণ করুন',     en: 'Please fill all fields' },
        addedEmp:     { bn: 'কর্মচারী যুক্ত হয়েছে',  en: 'Employee added successfully' },
        updatedEmp:   { bn: 'তথ্য আপডেট হয়েছে',      en: 'Information updated' },
        deletedEmp:   { bn: 'মুছে ফেলা হয়েছে',       en: 'Deleted successfully' },
        addedWork:    { bn: 'পারিশ্রমিক যুক্ত হয়েছে', en: 'Salary record added' },
        addedLoan:    { bn: 'ঋণ/খরচ যুক্ত হয়েছে',   en: 'Loan/Expense added' },
        addedReturn:  { bn: 'ঋণ ফেরত যুক্ত হয়েছে',   en: 'Loan return added' },
        updatedRecord: { bn: 'আপডেট হয়েছে',          en: 'Record updated' },
    };

    function t(key) {
        const lang = window.currentLang === 'en' ? 'en' : 'bn';
        return (LANG[key] && LANG[key][lang]) || LANG[key]['bn'] || key;
    }

    // ─── Init ──────────────────────────────────────────────────────────────────
    $(document).ready(function () {
        institutionId  = parseInt(sessionStorage.getItem('institutionId')  || '0');
        registrationId = parseInt(sessionStorage.getItem('registrationId') || '0');

        // re-render dynamic content when lang changes
        $(document).on('languageChanged', function () {
            if ($('#listView').is(':visible'))   loadEmployeeList();
            if ($('#detailView').is(':visible')) loadDetailAll();
        });

        if (!institutionId) {
            $(document).on('app-session-ready', function () {
                institutionId  = parseInt(sessionStorage.getItem('institutionId')  || '0');
                registrationId = parseInt(sessionStorage.getItem('registrationId') || '0');
                if (institutionId) { loadEmployeeList(); }
            });
            return;
        }
        loadEmployeeList();
    });

    // ─── Modal helpers ─────────────────────────────────────────────────────────
    window.openModal  = id => $('#' + id).addClass('show');
    window.closeModal = id => $('#' + id).removeClass('show');
    $(document).on('click', '.modal-overlay', function (e) {
        if ($(e.target).hasClass('modal-overlay')) $(this).removeClass('show');
    });

    // ─── Employee List ─────────────────────────────────────────────────────────
    function loadEmployeeList() {
        $('#listSpinner').show(); $('#listContent').hide();
        $.get('/api/Employee/list', { institutionId }).done(function (res) {
            $('#listSpinner').hide(); $('#listContent').show();
            const $body = $('#empTableBody').empty();
            if (!res.success || !res.data.length) {
                $body.append('<tr><td colspan="7" class="no-data">' + t('noEmployee') + '</td></tr>');
                $('#empCount').text(''); return;
            }
            const lang = window.currentLang === 'en' ? 'en' : 'bn';
            const countLabel = lang === 'en'
                ? 'Total: ' + res.data.length
                : t('total') + ': ' + res.data.length + ' ' + t('people');
            $('#empCount').text(countLabel);

            res.data.forEach(function (e) {
                const bal = parseFloat(e.Balance || 0);
                $body.append('<tr>' +
                    '<td><span class="eid-badge">' + e.EID + '</span></td>' +
                    '<td style="font-weight:600;">' + e.Name + '</td>' +
                    '<td>' + (e.Phone || '—') + '</td>' +
                    '<td>' + (e.Designation || '—') + '</td>' +
                    '<td class="text-muted" style="font-size:11px;">' + (e.JoinDate || '—') + '</td>' +
                    '<td class="' + (bal >= 0 ? 'bal-pos' : 'bal-neg') + '">' + fmt(bal) + '</td>' +
                    '<td><div class="action-btns">' +
                        '<button class="btn-edit" title="Details" onclick="openDetails(' + e.EmployeeID + ')"><i class="fas fa-eye"></i></button>' +
                        '<button class="btn-edit" title="Edit" onclick="openEditModal(' + e.EmployeeID + ',\'' + escQ(e.Name) + '\',\'' + escQ(e.Phone||'') + '\',\'' + escQ(e.Designation||'') + '\')"><i class="fas fa-pen"></i></button>' +
                        '<button class="btn-dng" title="Delete" onclick="deleteEmployee(' + e.EmployeeID + ',\'' + escQ(e.Name) + '\')"><i class="fas fa-trash"></i></button>' +
                    '</div></td>' +
                    '</tr>');
            });
        });
    }

    function escQ(s) { return (s || '').replace(/'/g, "\\'"); }

    // ─── Add Employee ──────────────────────────────────────────────────────────
    window.submitAddEmployee = function () {
        const name = $('#addName').val().trim();
        if (!name) { $('#errAddName').show(); return; }
        $('#errAddName').hide();
        $.ajax({ url: '/api/Employee/add', method: 'POST', contentType: 'application/json',
            data: JSON.stringify({ institutionId, registrationId, name, phone: $('#addPhone').val(), designation: $('#addDesig').val() })
        }).done(function (res) {
            if (res.success) {
                closeModal('addEmpModal');
                $('#addName,#addPhone,#addDesig').val('');
                loadEmployeeList();
                showToast(t('addedEmp'), 'success');
            }
        });
    };

    // ─── Edit Employee ─────────────────────────────────────────────────────────
    window.openEditModal = function (id, name, phone, desig) {
        $('#editEmpId').val(id);
        $('#editName').val(name); $('#editPhone').val(phone); $('#editDesig').val(desig);
        openModal('editEmpModal');
    };
    window.submitEditEmployee = function () {
        const name = $('#editName').val().trim();
        if (!name) return;
        $.ajax({ url: '/api/Employee/update', method: 'PUT', contentType: 'application/json',
            data: JSON.stringify({ employeeID: parseInt($('#editEmpId').val()), institutionId,
                name, phone: $('#editPhone').val(), designation: $('#editDesig').val() })
        }).done(function (res) {
            if (res.success) {
                closeModal('editEmpModal');
                loadEmployeeList();
                if (activeEmpId === parseInt($('#editEmpId').val())) {
                    $('#dName').text(name);
                    $('#dDesig').text($('#editDesig').val());
                }
                showToast(t('updatedEmp'), 'success');
            }
        });
    };

    // ─── Delete Employee ───────────────────────────────────────────────────────
    window.deleteEmployee = function (id, name) {
        const msg = window.currentLang === 'en'
            ? '"' + name + '" ' + t('deleteConfirm')
            : '"' + name + '" ' + t('deleteConfirm');
        if (!confirm(msg)) return;
        $.ajax({ url: '/api/Employee/delete?employeeId=' + id + '&institutionId=' + institutionId, method: 'DELETE' })
            .done(function (res) {
                if (res.success) { loadEmployeeList(); showToast(t('deletedEmp'), 'info'); }
            });
    };

    // ─── Show List / Detail ────────────────────────────────────────────────────
    window.openDetails = function (empId) {
        activeEmpId = empId;
        $('#listView').hide(); $('#detailView').show();
        loadEmpDetails();
        setDetMonth();
    };
    window.showList = function () {
        activeEmpId = 0;
        $('#detailView').hide(); $('#listView').show();
        loadEmployeeList();
    };

    function loadEmpDetails() {
        $.get('/api/Employee/details', { employeeId: activeEmpId, institutionId }).done(function (res) {
            if (!res.success) return;
            const e = res.data;
            $('#dEid').text('#' + e.EID);
            $('#dName').text(e.Name);
            $('#dPhone').text(e.Phone || '—');
            $('#dDesig').text(e.Designation || '—');
            $('#dJoin').text(e.JoinDate || '—');
            const bal = parseFloat(e.Balance || 0);
            $('#dBalance').text(fmt(bal));
        });
    }

    // ─── Detail Date helpers ───────────────────────────────────────────────────
    window.setDetToday = function () {
        const d = today();
        $('#detDateFrom').val(d); $('#detDateTo').val(d);
        loadDetailAll();
    };
    window.setDetMonth = function () {
        const now = new Date(), y = now.getFullYear(), m = String(now.getMonth()+1).padStart(2,'0');
        $('#detDateFrom').val(y+'-'+m+'-01');
        $('#detDateTo').val(y+'-'+m+'-'+String(new Date(y,now.getMonth()+1,0).getDate()).padStart(2,'0'));
        loadDetailAll();
    };
    window.clearDetDate = function () {
        $('#detDateFrom').val(''); $('#detDateTo').val('');
        loadDetailAll();
    };

    function getDetParams(extra) {
        const f = $('#detDateFrom').val(), t = $('#detDateTo').val();
        const p = { employeeId: activeEmpId, institutionId };
        if (f) p.dateFrom = f;
        if (t) p.dateTo   = t;
        return Object.assign(p, extra || {});
    }

    window.loadDetailAll = function () {
        loadSummary();
        loadTabData(activeDetTab, 1);
    };

    // ─── Summary ───────────────────────────────────────────────────────────────
    function loadSummary() {
        $.get('/api/Employee/summary', getDetParams()).done(function (res) {
            if (!res.success) return;
            const d = res.data;
            $('#dTotalWork').text(fmt(d.TotalWork));
            $('#dTotalLoan').text(fmt(d.TotalLoan));
            $('#dTotalReturn').text(fmt(d.TotalReturn));
        });
    }

    // ─── Tabs ──────────────────────────────────────────────────────────────────
    window.switchDetTab = function (tab) {
        activeDetTab = tab;
        $('.tab-btn').removeClass('active');
        $('#tab-' + tab).addClass('active');
        $('#pane-work, #pane-loan, #pane-return').hide();
        $('#pane-' + tab).show();
        loadTabData(tab, 1);
    };

    function loadTabData(tab, page) {
        if (tab === 'work')   loadWork(page);
        if (tab === 'loan')   loadLoan(page);
        if (tab === 'return') loadReturn(page);
    }

    // ─── Work ──────────────────────────────────────────────────────────────────
    function loadWork(page) {
        $('#workSpinner').show(); $('#workContent').hide();
        $.get('/api/Employee/work', getDetParams({ page, pageSize: PAGE })).done(function (res) {
            $('#workSpinner').hide(); $('#workContent').show();
            const $b = $('#workBody').empty();
            if (!res.data.length) {
                $b.append('<tr><td colspan="4" class="no-data">' + t('noRecord') + '</td></tr>');
                $('#workPager').empty(); return;
            }
            res.data.forEach(function (r) {
                $b.append('<tr>' +
                    '<td>' + r.WorkFor + '</td>' +
                    '<td class="amt-green">' + fmt(r.WorkAmount) + '</td>' +
                    '<td>' + r.WorkDate + '</td>' +
                    '<td><button class="btn-dng" onclick="delWork(' + r.EmployeeWorkID + ')"><i class="fas fa-trash"></i></button></td>' +
                    '</tr>');
            });
            renderPager('workPager', res.page, res.totalPages, loadWork);
        });
    }

    window.delWork = function (id) {
        if (!confirm(t('deleteRowConf'))) return;
        $.ajax({ url: '/api/Employee/work/delete?workId=' + id + '&institutionId=' + institutionId, method: 'DELETE' })
            .done(function (r) { if (r.success) { loadWork(1); loadSummary(); loadEmpDetails(); } });
    };
    window.submitWork = function () {
        const wFor = $('#wFor').val().trim(), wAmt = $('#wAmt').val(), wDate = $('#wDate').val();
        if (!wFor || !wAmt || !wDate) { alert(t('fillAll')); return; }
        $.ajax({ url: '/api/Employee/work/add', method: 'POST', contentType: 'application/json',
            data: JSON.stringify({ employeeID: activeEmpId, institutionId, registrationId, workFor: wFor, workAmount: parseFloat(wAmt), workDate: wDate })
        }).done(function (r) {
            if (r.success) {
                closeModal('workModal'); $('#wFor,#wAmt,#wDate').val('');
                loadWork(1); loadSummary(); loadEmpDetails();
                showToast(t('addedWork'), 'success');
            }
        });
    };

    // ─── Loan ──────────────────────────────────────────────────────────────────
    function loadLoan(page) {
        $('#loanSpinner').show(); $('#loanContent').hide();
        $.get('/api/Employee/loan', getDetParams({ page, pageSize: PAGE })).done(function (res) {
            $('#loanSpinner').hide(); $('#loanContent').show();
            const $b = $('#loanBody').empty();
            if (!res.data.length) {
                $b.append('<tr><td colspan="4" class="no-data">' + t('noRecord') + '</td></tr>');
                $('#loanPager').empty(); return;
            }
            res.data.forEach(function (r) {
                $b.append('<tr>' +
                    '<td>' + r.LoanFor + '</td>' +
                    '<td class="amt-red">' + fmt(r.LoanAmount) + '</td>' +
                    '<td>' + r.LoanDate + '</td>' +
                    '<td><button class="btn-dng" onclick="delLoan(' + r.EmployeeLoanID + ')"><i class="fas fa-trash"></i></button></td>' +
                    '</tr>');
            });
            renderPager('loanPager', res.page, res.totalPages, loadLoan);
        });
    }

    window.delLoan = function (id) {
        if (!confirm(t('deleteRowConf'))) return;
        $.ajax({ url: '/api/Employee/loan/delete?loanId=' + id + '&institutionId=' + institutionId, method: 'DELETE' })
            .done(function (r) { if (r.success) { loadLoan(1); loadSummary(); loadEmpDetails(); } });
    };

    window.submitLoan = function () {
        const lFor = $('#lFor').val().trim(), lAmt = $('#lAmt').val(), lDate = $('#lDate').val();
        if (!lFor || !lAmt || !lDate) { alert(t('fillAll')); return; }
        $.ajax({ url: '/api/Employee/loan/add', method: 'POST', contentType: 'application/json',
            data: JSON.stringify({ employeeID: activeEmpId, institutionId, registrationId, loanFor: lFor, loanAmount: parseFloat(lAmt), loanDate: lDate })
        }).done(function (r) {
            if (r.success) {
                closeModal('loanModal'); $('#lFor,#lAmt,#lDate').val('');
                loadLoan(1); loadSummary(); loadEmpDetails();
                showToast(t('addedLoan'), 'success');
            }
        });
    };

    // ─── Return ────────────────────────────────────────────────────────────────
    function loadReturn(page) {
        $('#returnSpinner').show(); $('#returnContent').hide();
        $.get('/api/Employee/return', getDetParams({ page, pageSize: PAGE })).done(function (res) {
            $('#returnSpinner').hide(); $('#returnContent').show();
            const $b = $('#returnBody').empty();
            if (!res.data.length) {
                $b.append('<tr><td colspan="4" class="no-data">' + t('noRecord') + '</td></tr>');
                $('#returnPager').empty(); return;
            }
            res.data.forEach(function (r) {
                $b.append('<tr>' +
                    '<td>' + r.ReturnFor + '</td>' +
                    '<td class="amt-teal">' + fmt(r.ReturnAmount) + '</td>' +
                    '<td>' + r.ReturnDate + '</td>' +
                    '<td><button class="btn-dng" onclick="delReturn(' + r.EmployeeReturnID + ')"><i class="fas fa-trash"></i></button></td>' +
                    '</tr>');
            });
            renderPager('returnPager', res.page, res.totalPages, loadReturn);
        });
    }

    window.delReturn = function (id) {
        if (!confirm(t('deleteRowConf'))) return;
        $.ajax({ url: '/api/Employee/return/delete?returnId=' + id + '&institutionId=' + institutionId, method: 'DELETE' })
            .done(function (r) { if (r.success) { loadReturn(1); loadSummary(); loadEmpDetails(); } });
    };

    window.submitReturn = function () {
        const rFor = $('#rFor').val().trim(), rAmt = $('#rAmt').val(), rDate = $('#rDate').val();
        if (!rFor || !rAmt || !rDate) { alert(t('fillAll')); return; }
        $.ajax({ url: '/api/Employee/return/add', method: 'POST', contentType: 'application/json',
            data: JSON.stringify({ employeeID: activeEmpId, institutionId, registrationId, returnFor: rFor, returnAmount: parseFloat(rAmt), returnDate: rDate })
        }).done(function (r) {
            if (r.success) {
                closeModal('returnModal'); $('#rFor,#rAmt,#rDate').val('');
                loadReturn(1); loadSummary(); loadEmpDetails();
                showToast(t('addedReturn'), 'success');
            }
        });
    };

    // ─── Pager ────────────────────────────────────────────────────────────────
    function renderPager(wrapperId, page, totalPages, fn) {
        const $w = $('#' + wrapperId).empty();
        if (totalPages <= 1) return;
        const $p = $('<div class="d-flex gap-1 flex-wrap align-items-center">');
        const btn = (label, pg, dis, active) =>
            $('<button>').html(label).prop('disabled', !!dis).addClass(active ? 'active' : '')
                .on('click', () => fn(pg));
        $p.append(btn('&laquo;', 1,          page<=1));
        $p.append(btn('&lsaquo;', page-1,    page<=1));
        const s = Math.max(1, page-2), e = Math.min(totalPages, s+4);
        for (let i = s; i <= e; i++) $p.append(btn(i, i, false, i===page));
        $p.append(btn('&rsaquo;', page+1,    page>=totalPages));
        $p.append(btn('&raquo;', totalPages, page>=totalPages));
        $p.append('<span class="pager-info">' + t('page') + ' ' + page + '/' + totalPages + '</span>');
        $w.append($p);
    }

    // ─── Toast ────────────────────────────────────────────────────────────────
    function showToast(msg, type) {
        const colors = { success:'#28a745', info:'#17a2b8', error:'#dc3545' };
        const $t = $('<div>').text(msg).css({
            position:'fixed', bottom:'24px', right:'24px', background: colors[type]||'#333',
            color:'#fff', padding:'10px 18px', borderRadius:'8px', fontSize:'13px',
            fontWeight:'600', zIndex:99999, boxShadow:'0 4px 16px rgba(0,0,0,.2)'
        }).appendTo('body');
        setTimeout(() => $t.fadeOut(300, () => $t.remove()), 2500);
    }

}());
