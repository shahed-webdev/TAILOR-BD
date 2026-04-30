// Account Management - TailorBD
(function() {
    'use strict';

    let accounts = [];
    let currentAccountId = null;
    let transactionModal, editAccountModal;

    $(document).ready(function() {
        // Check authentication
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        if (!isLoggedIn) {
            window.location.href = '/login.html';
            return;
        }

        // Initialize modals
        transactionModal = new bootstrap.Modal(document.getElementById('transactionModal'));
        editAccountModal = new bootstrap.Modal(document.getElementById('editAccountModal'));

        // Set today's date as default
        document.getElementById('transactionDate').valueAsDate = new Date();

        // Load accounts
        loadAccounts();
    });

    function loadAccounts() {
        const institutionId = sessionStorage.getItem('institutionId');

        $.ajax({
            url: `/api/account/${institutionId}`,
            method: 'GET',
            success: function(response) {
                if (response.success && response.data) {
                    accounts = response.data;
                    displayAccounts();
                    calculateSummary();
                } else {
                    showEmptyState();
                }
            },
            error: function(xhr) {
                console.error('Error loading accounts:', xhr);
                showAlert('error', 'Failed to load accounts');
                showEmptyState();
            }
        });
    }

    function displayAccounts() {
        const $list = $('#accountsList');
        $list.empty();

        if (accounts.length === 0) {
            showEmptyState();
            return;
        }

        accounts.forEach(account => {
            const balance = parseFloat(account.AccountBalance || account.accountBalance || 0);
            const totalIn = parseFloat(account.Total_IN || account.total_IN || 0);
            const totalOut = parseFloat(account.Total_OUT || account.total_OUT || 0);
            const totalIncome = parseFloat(account.Total_Income || account.total_Income || 0);
            const totalExpense = parseFloat(account.Total_Expense || account.total_Expense || 0);
            const isDefault = account.Default_Status || account.default_Status || false;
            const accountId = account.AccountID || account.accountID;
            const accountName = account.AccountName || account.accountName;

            const balanceClass = balance >= 0 ? 'positive' : 'negative';
            const defaultClass = isDefault ? 'default' : '';

            const card = `
                <div class="col-lg-6">
                    <div class="account-card ${defaultClass}">
                        <div class="account-header">
                            <h4 class="account-name">
                                ${accountName}
                                ${isDefault ? '<span class="default-badge ms-2"><i class="fas fa-star me-1"></i>Default</span>' : ''}
                            </h4>
                        </div>

                        <div class="account-balance ${balanceClass}">
                            ৳${formatNumber(balance)}
                        </div>

                        <div class="account-stats">
                            <div class="stat-item">
                                <div class="stat-label">
                                    <span class="lang-content" data-en="Deposit" data-bn="জমা">জমা</span>
                                </div>
                                <div class="stat-value income">৳${formatNumber(totalIn)}</div>
                            </div>

                            <div class="stat-item">
                                <div class="stat-label">
                                    <span class="lang-content" data-en="Withdraw" data-bn="উত্তোলন">উত্তোলন</span>
                                </div>
                                <div class="stat-value expense">৳${formatNumber(totalOut)}</div>
                            </div>

                            <div class="stat-item">
                                <div class="stat-label">
                                    <span class="lang-content" data-en="Income" data-bn="আয়">আয়</span>
                                </div>
                                <div class="stat-value income">৳${formatNumber(totalIncome)}</div>
                            </div>

                            <div class="stat-item">
                                <div class="stat-label">
                                    <span class="lang-content" data-en="Expense" data-bn="খরচ">খরচ</span>
                                </div>
                                <div class="stat-value expense">৳${formatNumber(totalExpense)}</div>
                            </div>
                        </div>

                        <div class="account-actions">
                            <button class="btn-account-action btn-deposit" onclick="openTransactionModal(${accountId}, 'deposit', '${accountName}')">
                                <i class="fas fa-arrow-down me-1"></i>
                                <span class="lang-content" data-en="Deposit" data-bn="জমা">জমা</span>
                            </button>
                            <button class="btn-account-action btn-withdraw" onclick="openTransactionModal(${accountId}, 'withdraw', '${accountName}')">
                                <i class="fas fa-arrow-up me-1"></i>
                                <span class="lang-content" data-en="Withdraw" data-bn="উত্তোলন">উত্তোলন</span>
                            </button>
                            <button class="btn-account-action btn-edit" onclick="openEditModal(${accountId})">
                                <i class="fas fa-edit me-1"></i>
                                <span class="lang-content" data-en="Edit" data-bn="সম্পাদনা">সম্পাদনা</span>
                            </button>
                            <button class="btn-account-action btn-delete" onclick="deleteAccount(${accountId}, '${accountName}')">
                                <i class="fas fa-trash me-1"></i>
                                <span class="lang-content" data-en="Delete" data-bn="মুছুন">মুছুন</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            $list.append(card);
        });

        // Update language
        if (window.updateLanguage) {
            window.updateLanguage();
        }
    }

    function showEmptyState() {
        $('#accountsList').html(`
            <div class="col-12">
                <div class="text-center py-5">
                    <i class="fas fa-wallet fa-3x text-muted mb-3"></i>
                    <h4 class="text-muted lang-content" data-en="No Accounts Yet" data-bn="এখনো কোনো অ্যাকাউন্ট নেই">এখনো কোনো অ্যাকাউন্ট নেই</h4>
                    <p class="text-muted lang-content" data-en="Add your first account to get started" data-bn="শুরু করতে আপনার প্রথম অ্যাকাউন্ট যুক্ত করুন">শুরু করতে আপনার প্রথম অ্যাকাউন্ট যুক্ত করুন</p>
                </div>
            </div>
        `);
    }

    function calculateSummary() {
        let totalBalance = 0;
        let totalDeposit = 0;
        let totalWithdraw = 0;

        accounts.forEach(account => {
            totalBalance += parseFloat(account.AccountBalance || account.accountBalance || 0);
            totalDeposit += parseFloat(account.Total_IN || account.total_IN || 0);
            totalWithdraw += parseFloat(account.Total_OUT || account.total_OUT || 0);
        });

        $('#totalBalance').text('৳' + formatNumber(totalBalance));
        $('#totalDeposit').text('৳' + formatNumber(totalDeposit));
        $('#totalWithdraw').text('৳' + formatNumber(totalWithdraw));
        $('#totalAccounts').text(accounts.length);
    }

    // Add Account
    window.addAccount = function(event) {
        event.preventDefault();

        const accountName = $('#accountName').val().trim();
        if (!accountName) {
            showAlert('warning', 'Please enter account name');
            return;
        }

        const institutionId = sessionStorage.getItem('institutionId');
        const registrationId = sessionStorage.getItem('registrationId');

        const data = {
            accountName: accountName,
            institutionID: parseInt(institutionId),
            registrationID: parseInt(registrationId)
        };

        $.ajax({
            url: '/api/account',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(response) {
                if (response.success) {
                    showAlert('success', 'Account added successfully!');
                    $('#accountName').val('');
                    loadAccounts();
                } else {
                    showAlert('error', response.message || 'Failed to add account');
                }
            },
            error: function(xhr) {
                console.error('Error adding account:', xhr);
                const response = xhr.responseJSON;
                showAlert('error', response && response.message ? response.message : 'Failed to add account');
            }
        });
    };

    // Open Transaction Modal
    window.openTransactionModal = function(accountId, type, accountName) {
        currentAccountId = accountId;
        
        $('#transactionAccountId').val(accountId);
        $('#transactionType').val(type);
        $('#transactionAmount').val('');
        $('#transactionNote').val('');
        document.getElementById('transactionDate').valueAsDate = new Date();

        const title = type === 'deposit' ? 
            '<i class="fas fa-arrow-down text-success me-2"></i>Deposit to ' + accountName :
            '<i class="fas fa-arrow-up text-danger me-2"></i>Withdraw from ' + accountName;

        $('#transactionModalTitle').html(title);
        transactionModal.show();
    };

    // Submit Transaction
    window.submitTransaction = function(event) {
        event.preventDefault();

        const accountId = $('#transactionAccountId').val();
        const type = $('#transactionType').val();
        const amount = parseFloat($('#transactionAmount').val());
        const note = $('#transactionNote').val();
        const date = $('#transactionDate').val();

        if (!amount || amount <= 0) {
            showAlert('warning', 'Please enter valid amount');
            return;
        }

        const institutionId = sessionStorage.getItem('institutionId');
        const registrationId = sessionStorage.getItem('registrationId');

        const data = {
            accountID: parseInt(accountId),
            institutionID: parseInt(institutionId),
            registrationID: parseInt(registrationId),
            amount: amount,
            type: type, // 'deposit' or 'withdraw'
            note: note,
            date: date
        };

        $.ajax({
            url: '/api/account/transaction',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(response) {
                if (response.success) {
                    showAlert('success', `${type === 'deposit' ? 'Deposit' : 'Withdrawal'} successful!`);
                    transactionModal.hide();
                    loadAccounts();
                } else {
                    showAlert('error', response.message || 'Transaction failed');
                }
            },
            error: function(xhr) {
                console.error('Transaction error:', xhr);
                showAlert('error', 'Transaction failed');
            }
        });
    };

    // Open Edit Modal
    window.openEditModal = function(accountId) {
        const account = accounts.find(a => (a.AccountID || a.accountID) === accountId);
        if (!account) return;

        $('#editAccountId').val(accountId);
        $('#editAccountName').val(account.AccountName || account.accountName);
        $('#editDefaultStatus').prop('checked', account.Default_Status || account.default_Status || false);

        editAccountModal.show();
    };

    // Update Account
    window.updateAccount = function(event) {
        event.preventDefault();

        const accountId = $('#editAccountId').val();
        const accountName = $('#editAccountName').val().trim();
        const defaultStatus = $('#editDefaultStatus').is(':checked');

        if (!accountName) {
            showAlert('warning', 'Please enter account name');
            return;
        }

        const data = {
            accountID: parseInt(accountId),
            accountName: accountName,
            defaultStatus: defaultStatus
        };

        $.ajax({
            url: '/api/account',
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(response) {
                if (response.success) {
                    showAlert('success', 'Account updated successfully!');
                    editAccountModal.hide();
                    loadAccounts();
                } else {
                    showAlert('error', response.message || 'Failed to update account');
                }
            },
            error: function(xhr) {
                console.error('Error updating account:', xhr);
                showAlert('error', 'Failed to update account');
            }
        });
    };

    // Delete Account
    window.deleteAccount = function(accountId, accountName) {
        if (!confirm(`আপনি কি "${accountName}" অ্যাকাউন্ট মুছে ফেলতে চান?\n\nনোট: যদি এই অ্যাকাউন্টে কোনো লেনদেন থাকে তবে মুছতে পারবেন না!`)) {
            return;
        }

        $.ajax({
            url: `/api/account/${accountId}`,
            method: 'DELETE',
            success: function(response) {
                if (response.success) {
                    showAlert('success', 'Account deleted successfully!');
                    loadAccounts();
                } else {
                    showAlert('error', response.message || 'Cannot delete account with transactions');
                }
            },
            error: function(xhr) {
                console.error('Error deleting account:', xhr);
                const response = xhr.responseJSON;
                showAlert('error', response && response.message ? response.message : 'Cannot delete account with transactions');
            }
        });
    };

    // Helper Functions
    function formatNumber(num) {
        return parseFloat(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function showAlert(type, message) {
        const alertClass = type === 'success' ? 'alert-success' : 
                          type === 'error' ? 'alert-danger' : 
                          type === 'warning' ? 'alert-warning' : 'alert-info';
        
        const icon = type === 'success' ? 'check-circle' : 
                    type === 'error' ? 'exclamation-circle' : 
                    type === 'warning' ? 'exclamation-triangle' : 'info-circle';

        const alert = $(`
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                <i class="fas fa-${icon} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);

        $('#alertContainer').html(alert);
        
        setTimeout(() => {
            alert.fadeOut(500, function() {
                $(this).remove();
            });
        }, 5000);
    }

})();
