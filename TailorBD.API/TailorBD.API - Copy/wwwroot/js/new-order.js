// New Order - TailorBD
(function() {
    'use strict';

    const PAGE_SIZE = 30;

    let customers       = [];
    let currentPage     = 1;
    let totalPages      = 1;
    let totalCount      = 0;
    let lastSearch      = { no: '', name: '', phone: '' };
    let tableRendered   = false;

    let checkPhoneTimeout  = null;
    let autocompleteTimeout = null;
    let searchAutoTimeout  = null;
    let currentFocus  = -1;   // new-customer autocomplete
    let searchFocus   = -1;   // search-field autocomplete

    // ─────────────────────────────────────────────────────────────────────────
    $(document).ready(function() {
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        if (!isLoggedIn) { window.location.href = '/login.html'; return; }

        initializeEventListeners();
        preloadCustomers();

        setTimeout(function() {
            if (window.updateLanguage) { window.updateLanguage(); updateDropdownOptions(); }
        }, 300);
    });

    // ── Pre-load customers for autocomplete ───────────────────────────────────
    function preloadCustomers() {
        const institutionId = sessionStorage.getItem('institutionId');
        $.ajax({
            url: `/api/customers?institutionId=${institutionId}&page=1&pageSize=200`,
            method: 'GET',
            success: function(response) {
                if (response.success && response.data && response.data.data)
                    customers = response.data.data;
            },
            error: function(xhr) { console.error('Preload error:', xhr); }
        });
    }

    // ── Load table page ───────────────────────────────────────────────────────
    function loadCustomerTable(page, searchNo, searchName, searchPhone) {
        page = page || 1;
        currentPage = page;

        if (searchNo    !== undefined) lastSearch.no    = searchNo    || '';
        if (searchName  !== undefined) lastSearch.name  = searchName  || '';
        if (searchPhone !== undefined) lastSearch.phone = searchPhone || '';

        const institutionId = sessionStorage.getItem('institutionId');
        let url = `/api/customers?institutionId=${institutionId}&page=${page}&pageSize=${PAGE_SIZE}`;
        if (lastSearch.no)    url += `&searchNo=${encodeURIComponent(lastSearch.no)}`;
        if (lastSearch.name)  url += `&searchName=${encodeURIComponent(lastSearch.name)}`;
        if (lastSearch.phone) url += `&searchPhone=${encodeURIComponent(lastSearch.phone)}`;

        $('#loadingSpinner').show();
        $('#customersTable').hide();
        $('#emptyState').hide();
        $('#initialState').hide();
        $('#paginationContainer').hide();

        $.ajax({
            url,
            method: 'GET',
            success: function(response) {
                $('#loadingSpinner').hide();
                if (response.success && response.data && response.data.data && response.data.data.length > 0) {
                    const paged = response.data;
                    totalPages  = paged.totalPages;
                    totalCount  = paged.totalCount;
                    currentPage = paged.page;

                    paged.data.forEach(c => {
                        const id = c.customerID || c.CustomerID;
                        if (!customers.find(x => (x.customerID || x.CustomerID) === id))
                            customers.push(c);
                    });

                    displayCustomers(paged.data);
                    renderPagination();
                } else {
                    $('#emptyState').show();
                }
            },
            error: function(xhr) {
                console.error('Error loading customers:', xhr);
                $('#loadingSpinner').hide();
                showAlert('error', 'কাস্টমার লোড করতে ব্যর্থ হয়েছে');
                $('#emptyState').show();
            }
        });
    }

    // ── Pagination ────────────────────────────────────────────────────────────
    function renderPagination() {
        if (totalPages <= 1) { $('#paginationContainer').hide(); return; }

        const $c = $('#paginationContainer').empty();
        $c.append(`<span class="pagination-info">মোট ${totalCount} জন কাস্টমার | পেইজ ${currentPage}/${totalPages}</span>`);

        const $ul = $('<ul class="pagination mb-0"></ul>');
        $ul.append(`<li class="page-item ${currentPage===1?'disabled':''}"><a class="page-link" href="javascript:void(0)" onclick="changePage(${currentPage-1})">&#8249;</a></li>`);

        const start = Math.max(1, currentPage - 2);
        const end   = Math.min(totalPages, start + 4);

        if (start > 1) {
            $ul.append(`<li class="page-item"><a class="page-link" href="javascript:void(0)" onclick="changePage(1)">1</a></li>`);
            if (start > 2) $ul.append(`<li class="page-item disabled"><span class="page-link">…</span></li>`);
        }
        for (let i = start; i <= end; i++)
            $ul.append(`<li class="page-item ${i===currentPage?'active':''}"><a class="page-link" href="javascript:void(0)" onclick="changePage(${i})">${i}</a></li>`);

        if (end < totalPages) {
            if (end < totalPages - 1) $ul.append(`<li class="page-item disabled"><span class="page-link">…</span></li>`);
            $ul.append(`<li class="page-item"><a class="page-link" href="javascript:void(0)" onclick="changePage(${totalPages})">${totalPages}</a></li>`);
        }
        $ul.append(`<li class="page-item ${currentPage===totalPages?'disabled':''}"><a class="page-link" href="javascript:void(0)" onclick="changePage(${currentPage+1})">&#8250;</a></li>`);
        $c.append($ul).show();
    }

    window.changePage = function(page) {
        if (page < 1 || page > totalPages || page === currentPage) return;
        loadCustomerTable(page, lastSearch.no, lastSearch.name, lastSearch.phone);
        document.getElementById('customersTable').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // ── Display table (DocumentFragment) ─────────────────────────────────────
    function displayCustomers(customerList) {
        const tbody    = document.getElementById('customersTableBody');
        const fragment = document.createDocumentFragment();

        customerList.forEach(customer => {
            const customerId       = customer.customerID     || customer.CustomerID;
            const customerNumber   = customer.customerNumber || customer.CustomerNumber || 'N/A';
            const customerName     = customer.customerName   || customer.CustomerName   || '';
            const phone            = customer.phone          || customer.Phone          || '';
            const address          = customer.address        || customer.Address        || '';
            const totalOrders      = customer.totalOrders    || customer.TotalOrders    || 0;
            const lastOrderDate    = customer.lastOrderDate  || customer.LastOrderDate  || customer.last_Order_Date;
            const registrationDate = customer.date           || customer.Date;
            const clothForId       = customer.cloth_For_ID   || customer.Cloth_For_ID   || 1;
            const initials         = customerName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><button class="btn btn-order" onclick="goToOrder(${customerId},${clothForId})"><i class="fas fa-plus-circle"></i> অর্ডার দিন</button></td>
                <td><span class="customer-number">${customerNumber}</span></td>
                <td><div class="customer-info"><div class="customer-avatar">${initials}</div><strong>${customerName}</strong></div></td>
                <td>${phone}</td>
                <td>${address || '-'}</td>
                <td><span class="badge-orders">${totalOrders}</span></td>
                <td class="date-display">${lastOrderDate ? formatDate(lastOrderDate) : '-'}</td>
                <td class="date-display">${formatDate(registrationDate)}</td>`;
            fragment.appendChild(tr);
        });

        tbody.innerHTML = '';
        tbody.appendChild(fragment);
        tableRendered = true;
        $('#customersTable').show();
        $('#emptyState, #initialState, #loadingSpinner').hide();
        if (window.updateLanguage) window.updateLanguage();
    }

    // ── Event listeners ───────────────────────────────────────────────────────
    function initializeEventListeners() {

        // New-customer form inputs
        $('#customerPhone').on('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
            if (this.value.length > 11) this.value = this.value.slice(0, 11);
            checkPhoneNumber();
            showPhoneAutocomplete(this.value);
        });
        $('#customerName').on('input', function() {
            if ($('#customerPhone').val().trim().length === 11) checkPhoneNumber();
            showNameAutocomplete(this.value);
        });
        $('#customerPhone').on('keydown', function(e) { handleNewCustomerKeyboard(e, '#phoneAutocompleteList'); });
        $('#customerName').on('keydown',  function(e) { handleNewCustomerKeyboard(e, '#nameAutocompleteList');  });
        $('#customerPhoto').on('change',  function(e) { previewPhoto(e.target.files[0]); });

        // Search fields — autocomplete
        $('#searchCustomerNo').on('input', function() {
            clearSearchSiblings('searchCustomerNo');
            showSearchSuggest('no', this.value.trim());
        }).on('keydown', function(e) { handleSearchKeyboard(e, '#searchNoList'); });

        $('#searchCustomerName').on('input', function() {
            clearSearchSiblings('searchCustomerName');
            showSearchSuggest('name', this.value.trim());
        }).on('keydown', function(e) { handleSearchKeyboard(e, '#searchNameList'); });

        $('#searchCustomerPhone').on('input', function() {
            clearSearchSiblings('searchCustomerPhone');
            showSearchSuggest('phone', this.value.trim());
        }).on('keydown', function(e) { handleSearchKeyboard(e, '#searchPhoneList'); });

        // Close all autocomplete on outside click
        $(document).on('click', function(e) {
            if (!$(e.target).closest('#customerName').length)       $('#nameAutocompleteList').removeClass('show').empty();
            if (!$(e.target).closest('#customerPhone').length)      $('#phoneAutocompleteList').removeClass('show').empty();
            if (!$(e.target).closest('.search-autocomplete-wrap').length) {
                $('#searchNoList, #searchNameList, #searchPhoneList').removeClass('show').empty();
            }
        });

        // Tab: load table when "পুরাতন কাস্টমার" shown
        $('button[data-bs-toggle="tab"]').on('shown.bs.tab', function(e) {
            if ($(e.target).data('bs-target') === '#existing-customer' && !tableRendered)
                loadCustomerTable(1);
        });
    }

    // ── New-customer autocomplete (name & phone) ──────────────────────────────
    function showNameAutocomplete(searchText) {
        const $list = $('#nameAutocompleteList');
        if (!searchText || searchText.length < 2) { $list.removeClass('show').empty(); return; }
        if (autocompleteTimeout) clearTimeout(autocompleteTimeout);
        autocompleteTimeout = setTimeout(() => {
            const q = searchText.toLowerCase().trim();
            const matches = customers.filter(c => (c.customerName || c.CustomerName || '').toLowerCase().includes(q)).slice(0, 10);
            if (matches.length >= 3) {
                displayNewCustomerAutocomplete($list, matches, 'name');
            } else {
                fetchNewCustomerSuggest('name', searchText, $list);
            }
        }, 300);
    }

    function showPhoneAutocomplete(searchText) {
        const $list = $('#phoneAutocompleteList');
        if (!searchText || searchText.length < 3) { $list.removeClass('show').empty(); return; }
        if (autocompleteTimeout) clearTimeout(autocompleteTimeout);
        autocompleteTimeout = setTimeout(() => {
            const matches = customers.filter(c => (c.phone || c.Phone || '').toString().includes(searchText)).slice(0, 10);
            if (matches.length >= 3) {
                displayNewCustomerAutocomplete($list, matches, 'phone');
            } else {
                fetchNewCustomerSuggest('phone', searchText, $list);
            }
        }, 300);
    }

    function fetchNewCustomerSuggest(type, q, $list) {
        const institutionId = sessionStorage.getItem('institutionId');
        $list.html('<div class="autocomplete-item text-muted"><i class="fas fa-spinner fa-spin me-1"></i> খুঁজছে...</div>').addClass('show');

        $.ajax({
            url: `/api/customers/suggest?institutionId=${institutionId}&q=${encodeURIComponent(q)}&type=${type}`,
            method: 'GET',
            success: function(response) {
                if (response.success && response.data && response.data.length > 0) {
                    response.data.forEach(c => {
                        const id = c.customerID || c.CustomerID;
                        if (!customers.find(x => (x.customerID || x.CustomerID) === id))
                            customers.push(c);
                    });
                    displayNewCustomerAutocomplete($list, response.data, type);
                } else {
                    $list.html('<div class="autocomplete-no-results">কোনো মিল পাওয়া যায়নি</div>').addClass('show');
                }
            },
            error: function() { $list.removeClass('show').empty(); }
        });
    }

    function displayNewCustomerAutocomplete($list, matches, type) {
        $list.empty(); currentFocus = -1;
        if (matches.length === 0) {
            $list.html('<div class="autocomplete-no-results">কোনো মিল পাওয়া যায়নি</div>').addClass('show');
            return;
        }
        const frag = document.createDocumentFragment();
        matches.forEach(c => {
            const name    = c.customerName || c.CustomerName || '';
            const phone   = c.phone        || c.Phone        || '';
            const address = c.address      || c.Address      || '';
            const div = document.createElement('div');
            div.className = 'autocomplete-item';
            div.innerHTML = `
                <div class="autocomplete-item-name">${name}</div>
                <div class="autocomplete-item-details">
                    <i class="fas fa-phone me-1"></i>${phone}
                    ${address ? `<span class="ms-2"><i class="fas fa-map-marker-alt me-1"></i>${address}</span>` : ''}
                </div>`;
            div.addEventListener('click', () => selectNewCustomerItem(c));
            frag.appendChild(div);
        });
        $list[0].appendChild(frag);
        $list.addClass('show');
    }

    function selectNewCustomerItem(customer) {
        const name       = customer.customerName || customer.CustomerName || '';
        const phone      = customer.phone        || customer.Phone        || '';
        const address    = customer.address      || customer.Address      || '';
        const gender     = customer.cloth_For_ID || customer.Cloth_For_ID || 1;
        const customerId = customer.customerID   || customer.CustomerID;
        const clothForId = customer.cloth_For_ID || customer.Cloth_For_ID || 1;

        $('#customerName').val(name); $('#customerPhone').val(phone);
        $('#customerAddress').val(address); $('#customerGender').val(gender);
        $('#nameAutocompleteList, #phoneAutocompleteList').removeClass('show').empty();

        $('#phoneCheckMessage').text('এই কাস্টমার ইতিমধ্যেই আছে - সরাসরি অর্ডার দিন')
            .removeClass('text-success text-warning').addClass('text-info');
        $('#duplicateMessage').html(
            `${name} - মোবাইল: ${phone} পূর্বে নিবন্ধিত। ` +
            `<a href="javascript:void(0)" onclick="goToOrder(${customerId},${clothForId})">সরাসরি অর্ডার দিন >></a>`);
        $('#duplicateWarning').show();
        $('#createCustomerBtn').prop('disabled', true);
    }

    function handleNewCustomerKeyboard(e, listSelector) {
        const $list  = $(listSelector);
        const $items = $list.find('.autocomplete-item');
        if (!$items.length) return;
        if (e.keyCode === 40) { e.preventDefault(); currentFocus = (currentFocus + 1) % $items.length; setActiveItem($items, currentFocus); }
        else if (e.keyCode === 38) { e.preventDefault(); currentFocus = (currentFocus - 1 + $items.length) % $items.length; setActiveItem($items, currentFocus); }
        else if (e.keyCode === 13) { e.preventDefault(); if (currentFocus > -1) $items.eq(currentFocus).click(); }
        else if (e.keyCode === 27) { $list.removeClass('show').empty(); currentFocus = -1; }
    }

    // ── Search-field autocomplete ─────────────────────────────────────────────
    function clearSearchSiblings(current) {
        if (current !== 'searchCustomerNo')    { $('#searchCustomerNo').val('');    $('#searchNoList').removeClass('show').empty(); }
        if (current !== 'searchCustomerName')  { $('#searchCustomerName').val('');  $('#searchNameList').removeClass('show').empty(); }
        if (current !== 'searchCustomerPhone') { $('#searchCustomerPhone').val(''); $('#searchPhoneList').removeClass('show').empty(); }
    }

    function showSearchSuggest(type, value) {
        const $list  = $({ no: '#searchNoList', name: '#searchNameList', phone: '#searchPhoneList' }[type]);
        const minLen = (type === 'phone') ? 3 : 1;
        if (!value || value.length < minLen) { $list.removeClass('show').empty(); return; }
        if (searchAutoTimeout) clearTimeout(searchAutoTimeout);

        searchAutoTimeout = setTimeout(() => {
            // First try local cache
            const q = value.toLowerCase();
            let matches = [];
            if (type === 'no') {
                matches = customers.filter(c => (c.customerNumber || c.CustomerNumber || '').toString().startsWith(value));
            } else if (type === 'name') {
                matches = customers.filter(c => (c.customerName || c.CustomerName || '').toLowerCase().includes(q));
            } else {
                matches = customers.filter(c => (c.phone || c.Phone || '').toString().includes(value));
            }

            if (matches.length >= 3) {
                // Enough local results — show immediately
                renderSearchDropdown($list, matches.slice(0, 8));
            } else {
                // Not enough — call API for full DB search
                fetchSuggestFromApi(type, value, $list);
            }
        }, 250);
    }

    function fetchSuggestFromApi(type, q, $list) {
        const institutionId = sessionStorage.getItem('institutionId');
        $list.html('<div class="autocomplete-item text-muted"><i class="fas fa-spinner fa-spin me-1"></i> খুঁজছে...</div>').addClass('show');

        $.ajax({
            url: `/api/customers/suggest?institutionId=${institutionId}&q=${encodeURIComponent(q)}&type=${type}`,
            method: 'GET',
            success: function(response) {
                if (response.success && response.data && response.data.length > 0) {
                    // merge into local cache
                    response.data.forEach(c => {
                        const id = c.customerID || c.CustomerID;
                        if (!customers.find(x => (x.customerID || x.CustomerID) === id))
                            customers.push(c);
                    });
                    renderSearchDropdown($list, response.data);
                } else {
                    $list.removeClass('show').empty();
                }
            },
            error: function() { $list.removeClass('show').empty(); }
        });
    }

    function renderSearchDropdown($list, matches) {
        $list.empty(); searchFocus = -1;
        if (!matches.length) { $list.removeClass('show'); return; }

        const frag = document.createDocumentFragment();
        matches.forEach(c => {
            const no      = c.customerNumber || c.CustomerNumber || '';
            const name    = c.customerName   || c.CustomerName   || '';
            const phone   = c.phone          || c.Phone          || '';
            const address = c.address        || c.Address        || '';
            const div = document.createElement('div');
            div.className = 'autocomplete-item';
            div.innerHTML = `
                <div class="autocomplete-item-name">
                    <span class="search-ac-no me-2">#${no}</span>${name}
                </div>
                <div class="autocomplete-item-details">
                    <i class="fas fa-phone me-1"></i>${phone}
                    ${address ? `<span class="ms-2"><i class="fas fa-map-marker-alt me-1"></i>${address}</span>` : ''}
                </div>`;
            div.addEventListener('click', () => selectSearchCustomer(c));
            frag.appendChild(div);
        });
        $list[0].appendChild(frag);
        $list.addClass('show');
    }

    function selectSearchCustomer(customer) {
        const name = customer.customerName || customer.CustomerName || '';
        $('#searchCustomerName').val(name);
        $('#searchCustomerNo').val(''); $('#searchCustomerPhone').val('');
        $('#searchNoList, #searchNameList, #searchPhoneList').removeClass('show').empty();
        searchFocus = -1;
        loadCustomerTable(1, '', name, '');
    }

    function handleSearchKeyboard(e, listSelector) {
        const $list  = $(listSelector);
        const $items = $list.find('.autocomplete-item');
        if (!$items.length) return;
        if (e.keyCode === 40) { e.preventDefault(); searchFocus = (searchFocus + 1) % $items.length; setActiveItem($items, searchFocus); }
        else if (e.keyCode === 38) { e.preventDefault(); searchFocus = (searchFocus - 1 + $items.length) % $items.length; setActiveItem($items, searchFocus); }
        else if (e.keyCode === 13) { if (searchFocus > -1) { e.preventDefault(); $items.eq(searchFocus).click(); } }
        else if (e.keyCode === 27) { $list.removeClass('show').empty(); searchFocus = -1; }
    }

    function setActiveItem($items, focus) {
        $items.removeClass('active');
        if (focus < 0 || focus >= $items.length) return;
        const $a = $items.eq(focus).addClass('active');
        const p = $a.parent(), top = $a.position().top, h = $a.outerHeight(), ph = p.height(), s = p.scrollTop();
        if (top < 0)         p.scrollTop(s + top);
        else if (top + h > ph) p.scrollTop(s + top - ph + h);
    }

    // ── Check phone (new customer) ────────────────────────────────────────────
    function checkPhoneNumber() {
        const phone = $('#customerPhone').val().trim();
        const name  = $('#customerName').val().trim();

        if (phone.length < 11) {
            $('#phoneCheckMessage').text('').removeClass('text-danger text-success text-warning');
            $('#duplicateWarning').hide();
            $('#createCustomerBtn').prop('disabled', false);
            return;
        }
        if (checkPhoneTimeout) clearTimeout(checkPhoneTimeout);

        checkPhoneTimeout = setTimeout(() => {
            const institutionId = sessionStorage.getItem('institutionId');
            $.ajax({
                url: `/api/customers/by-phone/${phone}?institutionId=${institutionId}`,
                method: 'GET',
                success: function(response) {
                    if (response.success && response.data) {
                        const c            = response.data;
                        const customerId   = c.customerID   || c.CustomerID;
                        const clothForId   = c.cloth_For_ID || c.Cloth_For_ID || 1;
                        const customerName = c.customerName || c.CustomerName || '';
                        const isSameName   = name.toLowerCase().trim().replace(/\s+/g,' ') === customerName.toLowerCase().trim().replace(/\s+/g,' ');

                        if (isSameName && name.length > 0) {
                            $('#phoneCheckMessage').text('নাম্বারটি ইতিমধ্যেই নিবন্ধিত').removeClass('text-success text-warning').addClass('text-danger');
                            $('#duplicateMessage').html(`${customerName} - মোবাইল: ${phone} পূর্বে নিবন্ধিত। <a href="javascript:void(0)" onclick="goToOrder(${customerId},${clothForId})">সরাসরি অর্ডার দিন >></a>`);
                            $('#duplicateWarning').show();
                            $('#createCustomerBtn').prop('disabled', true);
                        } else if (name.length === 0) {
                            $('#phoneCheckMessage').text('এই নম্বরে ইতিমধ্যেই কাস্টমার আছে - নাম লিখুন').removeClass('text-success text-danger').addClass('text-warning');
                            $('#duplicateWarning').hide(); $('#createCustomerBtn').prop('disabled', false);
                        } else {
                            $('#phoneCheckMessage').text('একই নম্বর ভিন্ন নাম - নতুন কাস্টমার তৈরি করতে পারবেন').removeClass('text-danger text-success').addClass('text-warning');
                            $('#duplicateWarning').hide(); $('#createCustomerBtn').prop('disabled', false);
                        }
                    } else {
                        $('#phoneCheckMessage').text('নাম্বারটি উপলব্ধ').removeClass('text-danger text-warning').addClass('text-success');
                        $('#duplicateWarning').hide(); $('#createCustomerBtn').prop('disabled', false);
                    }
                },
                error: function(xhr) {
                    if (xhr.status === 404) {
                        $('#phoneCheckMessage').text('নাম্বারটি উপলব্ধ').removeClass('text-danger text-warning').addClass('text-success');
                        $('#duplicateWarning').hide(); $('#createCustomerBtn').prop('disabled', false);
                    }
                }
            });
        }, 500);
    }

    // ── Photo preview ─────────────────────────────────────────────────────────
    function previewPhoto(file) {
        if (!file) return;
        if (!file.type.startsWith('image/')) { showAlert('error', 'শুধুমাত্র ছবি ফাইল নির্বাচন করুন'); $('#customerPhoto').val(''); return; }
        const reader = new FileReader();
        reader.onload = e => { $('#previewImage').attr('src', e.target.result); $('#photoPreview').show(); };
        reader.readAsDataURL(file);
    }
    window.removePhoto = function() { $('#customerPhoto').val(''); $('#photoPreview').hide(); $('#previewImage').attr('src',''); };

    // ── Create customer ───────────────────────────────────────────────────────
    window.createCustomer = function(event) {
        event.preventDefault();
        const gender  = $('#customerGender').val();
        const name    = $('#customerName').val().trim();
        const phone   = $('#customerPhone').val().trim();
        const address = $('#customerAddress').val().trim();

        if (!gender || !name || !phone) { showAlert('warning', 'সকল প্রয়োজনীয় তথ্য পূরণ করুন'); return; }
        if (phone.length !== 11)        { showAlert('warning', 'সঠিক মোবাইল নাম্বার দিন (১১ ডিজিট)'); return; }

        const institutionId = sessionStorage.getItem('institutionId');
        $.ajax({
            url: `/api/customers/by-phone/${phone}?institutionId=${institutionId}`, method: 'GET',
            success: function(response) {
                if (response.success && response.data) {
                    const dbName = (response.data.customerName || response.data.CustomerName || '').toLowerCase().trim().replace(/\s+/g,' ');
                    if (name.toLowerCase().trim().replace(/\s+/g,' ') === dbName) {
                        showAlert('error','এই নাম ও মোবাইল নম্বরে ইতিমধ্যেই কাস্টমার আছে। পুরাতন কাস্টমার ট্যাবে খুঁজুন।'); return;
                    }
                }
                createCustomerApi(gender, name, phone, address, institutionId);
            },
            error: function(xhr) {
                if (xhr.status === 404) createCustomerApi(gender, name, phone, address, institutionId);
                else { console.error(xhr); showAlert('error','কাস্টমার যাচাই করতে ব্যর্থ হয়েছে'); }
            }
        });
    };

    function createCustomerApi(gender, name, phone, address, institutionId) {
        $('#createCustomerBtn').prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-2"></i>অপেক্ষা করুন...');
        $.ajax({
            url: '/api/customers', method: 'POST', contentType: 'application/json',
            data: JSON.stringify({ cloth_For_ID: parseInt(gender), customerName: name, phone, address: address||'', institutionID: parseInt(institutionId), registrationID: parseInt(sessionStorage.getItem('registrationId')) }),
            success: function(response) {
                if (response.success) {
                    showAlert('success','কাস্টমার সফলভাবে যুক্ত হয়েছে!');
                    customers = []; tableRendered = false;
                    setTimeout(() => goToOrder(response.data, gender), 1000);
                } else {
                    showAlert('error', response.message || 'কাস্টমার যুক্ত করতে ব্যর্থ হয়েছে');
                    $('#createCustomerBtn').prop('disabled', false).html('<i class="fas fa-arrow-right me-2"></i>অর্ডারে যান');
                }
            },
            error: function(xhr) {
                const res = xhr.responseJSON;
                showAlert('error', res && res.message ? res.message : 'কাস্টমার যুক্ত করতে ব্যর্থ হয়েছে');
                $('#createCustomerBtn').prop('disabled', false).html('<i class="fas fa-arrow-right me-2"></i>অর্ডারে যান');
            }
        });
    }

    window.goToOrder = function(customerId, clothForId) {
        window.location.href = `/dress-measurements.html?customerId=${customerId}&clothForId=${clothForId}`;
    };

    // ── Search ────────────────────────────────────────────────────────────────
    window.searchCustomers = function(event) {
        event.preventDefault();
        const no    = $('#searchCustomerNo').val().trim();
        const name  = $('#searchCustomerName').val().trim();
        const phone = $('#searchCustomerPhone').val().trim();
        if (!no && !name && !phone) { showAlert('warning','অন্তত একটি শর্ত দিয়ে খুঁজুন'); return; }
        loadCustomerTable(1, no, name, phone);
    };

    window.clearOtherSearchFields = function(currentField) { clearSearchSiblings(currentField); };

    // ── Helpers ───────────────────────────────────────────────────────────────
    function formatDate(dateString) {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('bn-BD', { year:'numeric', month:'short', day:'numeric' });
    }

    function showAlert(type, message) {
        const map = { success:['alert-success','check-circle'], error:['alert-danger','exclamation-circle'], warning:['alert-warning','exclamation-triangle'], info:['alert-info','info-circle'] };
        const [cls, ico] = map[type] || map.info;
        const $a = $(`<div class="alert ${cls} alert-dismissible fade show" role="alert"><i class="fas fa-${ico} me-2"></i>${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`);
        $('#alertContainer').html($a);
        $('html,body').animate({ scrollTop: 0 }, 300);
        setTimeout(() => $a.fadeOut(500, function() { $(this).remove(); }), 5000);
    }

    function updateDropdownOptions() {
        const lang = window.currentLang || 'bn';
        $('#customerGender option').each(function() {
            const en = $(this).attr('data-en'), bn = $(this).attr('data-bn');
            if (en && bn) $(this).text(lang === 'en' ? en : bn);
        });
    }

    window.updateNewOrderLanguage = updateDropdownOptions;

})();
