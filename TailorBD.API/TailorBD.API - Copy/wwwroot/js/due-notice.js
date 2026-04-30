// TailorBD - Due Invoice Popup Notice
//
// Logic:
//   সার্ভিস চার্জ বিল:
//     বিল তৈরি হওয়ার পর থেকে 7 দিন = হালকা ওয়ার্নিং + কাউন্টডাউন (ক্লোজ করা যায়)
//     7 দিন পার হলে = সফটওয়্যার একসেস সম্পূর্ণ বন্ধ (ক্লোজ করা যায় না)
//   SMS রিচার্জ বিল:
//     বিল তৈরি হওয়ার পর থেকে 7 দিন = হালকা ওয়ার্নিং (ক্লোজ করা যায়)
//     7 দেশ পার হলে = SMS একসেস বন্ধ (ক্লোজ করা যায় না)
//   প্রতিবার পেজ লোডে নোটিশ দেখাবে — dismiss/localStorage নেই
//   কোনো বকেয়া না থাকলে = পপআপ নেই

(function () {
    'use strict';

    var _initialized = false;

    // ── যোগাযোগ তথ্য ──────────────────────────────────────────────
    var CONTACT_HTML =
        '<div style="margin-top:14px;border-radius:12px;overflow:hidden;' +
        'border:1.5px solid #e0d7f7;">' +
        '<div style="background:linear-gradient(135deg,#6c7ae0,#5a68c9);' +
        'padding:10px 14px;color:#fff;font-size:.82rem;font-weight:700;' +
        'display:flex;align-items:center;gap:6px;">' +
        '<i class="fas fa-headset"></i> ১০:০০ AM – ৫:০০ PM সাপোর্ট পাওয়া যাবে' +
        '</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:0;">' +

        // Office Phone
        '<div style="flex:1;min-width:120px;padding:12px 10px;text-align:center;' +
        'border-right:1px solid #e5e7eb;">' +
        '<i class="fas fa-phone-alt" style="color:#6c7ae0;font-size:1.2rem;margin-bottom:4px;display:block;"></i>' +
        '<div style="font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">Office Phone</div>' +
        '<div style="font-size:.95rem;font-weight:800;color:#111;margin:3px 0 8px;">09638669966</div>' +
        '<a href="tel:09638669966" style="display:inline-block;padding:4px 12px;' +
        'background:#fff;border:1.5px solid #6c7ae0;border-radius:20px;' +
        'font-size:.72rem;font-weight:700;color:#6c7ae0;text-decoration:none;">' +
        '<i class="fas fa-phone me-1"></i>Call Now</a>' +
        '</div>' +

        // Mobile Support
        '<div style="flex:1;min-width:120px;padding:12px 10px;text-align:center;' +
        'border-right:1px solid #e5e7eb;">' +
        '<i class="fas fa-mobile-alt" style="color:#6c7ae0;font-size:1.2rem;margin-bottom:4px;display:block;"></i>' +
        '<div style="font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">Mobile Support</div>' +
        '<div style="font-size:.95rem;font-weight:800;color:#111;margin:3px 0 8px;">01739144141</div>' +
        '<a href="tel:01739144141" style="display:inline-block;padding:4px 12px;' +
        'background:#fff;border:1.5px solid #6c7ae0;border-radius:20px;' +
        'font-size:.72rem;font-weight:700;color:#6c7ae0;text-decoration:none;">' +
        '<i class="fas fa-phone me-1"></i>Call Mobile</a>' +
        '</div>' +

        // WhatsApp
        '<div style="flex:1;min-width:120px;padding:12px 10px;text-align:center;">' +
        '<i class="fab fa-whatsapp" style="color:#25d366;font-size:1.3rem;margin-bottom:4px;display:block;"></i>' +
        '<div style="font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">WhatsApp</div>' +
        '<div style="font-size:.95rem;font-weight:800;color:#111;margin:3px 0 8px;">01739144141</div>' +
        '<a href="https://wa.me/8801739144141" target="_blank" style="display:inline-block;padding:4px 12px;' +
        'background:#25d366;border:none;border-radius:20px;' +
        'font-size:.72rem;font-weight:700;color:#fff;text-decoration:none;">' +
        '<i class="fab fa-whatsapp me-1"></i>Chat Now</a>' +
        '</div>' +

        '</div></div>';

    // ── সব navigation/link/button বন্ধ করে দেওয়া ─────────────────
    function lockAllNavigation() {
        $(document).on('click.accessLocked', 'a, button', function (e) {
            var id = $(this).attr('id') || '';
            if (id === 'dueNoticeInvoiceBtn'   || id === 'smsDueInvoiceBtn'     ||
                id === 'smsDueRechargeBtn'     || id === 'mergedDueInvoiceBtn'  ||
                id === 'dueNoticePayOnlineBtn' || id === 'smsDuePayOnlineBtn'   ||
                id === 'mergedDuePayOnlineBtn' || id === 'dnPaySubmitBtn'       ||
                id === 'dnPayModalClose'       ||
                id === 'globalDuePayOnlineBtn' || id === 'globalDuePayModalClose' ||
                id === 'gdpSubmitBtn'          || id === 'gdpName'              ||
                id === 'gdpPhone'              || id === 'gdpEmail'             ||
                id.indexOf('dueNotice') === 0  ||
                id.indexOf('smsDue') === 0     ||
                id.indexOf('mergedDue') === 0  ||
                id.indexOf('dnPay') === 0      ||
                id.indexOf('globalDue') === 0  ||
                id.indexOf('gdp') === 0) {
                return true;
            }
            e.preventDefault();
            e.stopImmediatePropagation();
            return false;
        });

        $('body').css('pointer-events', 'none');
        $('#dueNoticeOverlay, #smsDueNoticeOverlay, #mergedDueNoticeOverlay, #globalDueBlockOverlay, #globalDuePayModal').css('pointer-events', 'all');
    }

    // ── institutionId পাওয়া পর্যন্ত retry করে API call দেবে ───────
    function initDueNotice() {
        if (_initialized) return;

        var institutionId = sessionStorage.getItem('institutionId');

        if (!institutionId) {
            var retryCount = parseInt(sessionStorage.getItem('_dueNoticeRetry') || '0');
            if (retryCount >= 10) {
                sessionStorage.removeItem('_dueNoticeRetry');
                return;
            }
            sessionStorage.setItem('_dueNoticeRetry', retryCount + 1);
            setTimeout(initDueNotice, 300);
            return;
        }

        sessionStorage.removeItem('_dueNoticeRetry');
        _initialized = true;

        // app-components.js আগেই API call করে থাকলে cache থেকে নাও
        if (window._dueStatusCache) {
            processData(window._dueStatusCache, institutionId);
            return;
        }

        $.ajax({
            url: '/api/invoice/due-status/' + institutionId,
            method: 'GET',
            success: function (r) {
                if (!r.success || !r.data) return;
                processData(r.data, institutionId);
            },
            error: function (xhr, status, err) {
                console.error('[DueNotice] API error:', status, err);
                _initialized = false;
            }
        });
    }

    function processData(d, institutionId) {
        var hasServiceDue = !!d.showPopup || !!d.accessBlocked;
        var hasSmsDue    = !!d.smsShowPopup;

        if (hasServiceDue && hasSmsDue) {
            // উভয় বিল বকেয়া — একটি মার্জড পপআপে দেখাও
            // app-components.js accessBlocked overlay দেখিয়ে থাকলেও remove করে merged দেখাও
            $('#globalDueBlockOverlay').remove();
            showMergedDuePopup(d, institutionId);
        } else if (hasServiceDue) {
            // accessBlocked হলে app-components.js আগেই overlay দেখিয়েছে — এখানে skip
            if (d.accessBlocked) return;
            showDuePopup(d, institutionId);
        } else if (hasSmsDue) {
            showSmsDuePopup(d, institutionId);
        }
    }

    function fmt(n) {
        return (n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
    }

    // ── ShurjoPay inline payment modal (due-notice এর ভেতরে) ──────────────
    function openDueNoticePayModal(totalAmount) {
        $('#dueNoticePayModal').remove();
        var institutionId = sessionStorage.getItem('institutionId');
        var html =
            '<div id="dueNoticePayModal" style="position:fixed;inset:0;z-index:999999;' +
            'background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;padding:20px;">' +
            '<div style="background:#fff;border-radius:16px;max-width:420px;width:100%;overflow:hidden;' +
            'box-shadow:0 20px 60px rgba(0,0,0,.4);">' +
            '<div style="background:linear-gradient(135deg,#667eea,#5a68c9);padding:15px 20px;color:#fff;' +
            'display:flex;align-items:center;justify-content:space-between;">' +
            '<span style="font-weight:700;font-size:.98rem;"><i class="fas fa-credit-card me-2"></i>অনলাইনে বিল পরিশোধ</span>' +
            '<button id="dnPayModalClose" style="background:rgba(255,255,255,.2);border:none;color:#fff;' +
            'width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:1.1rem;">&times;</button>' +
            '</div>' +
            '<div style="padding:20px;">' +
            '<div style="background:linear-gradient(135deg,#fef2f2,#fee2e2);border-radius:10px;' +
            'padding:12px;margin-bottom:16px;text-align:center;">' +
            '<div style="font-size:.78rem;color:#64748b;">মোট বকেয়া টাকা</div>' +
            '<div style="font-size:1.7rem;font-weight:800;color:#dc2626;">৳' + fmt(totalAmount) + '</div>' +
            '</div>' +
            '<div style="margin-bottom:12px;">' +
            '<label style="font-size:.8rem;font-weight:600;color:#475569;display:block;margin-bottom:4px;">' +
            '<i class="fas fa-user me-1"></i> আপনার নাম <span style="color:#ef4444;">*</span></label>' +
            '<input id="dnPayName" type="text" placeholder="নাম লিখুন" maxlength="100" ' +
            'style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:8px 12px;font-size:.9rem;outline:none;">' +
            '</div>' +
            '<div style="margin-bottom:12px;">' +
            '<label style="font-size:.8rem;font-weight:600;color:#475569;display:block;margin-bottom:4px;">' +
            '<i class="fas fa-phone me-1"></i> মোবাইল নম্বর <span style="color:#ef4444;">*</span></label>' +
            '<input id="dnPayPhone" type="tel" placeholder="01XXXXXXXXX" maxlength="20" ' +
            'style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:8px 12px;font-size:.9rem;outline:none;">' +
            '</div>' +
            '<div style="margin-bottom:16px;">' +
            '<label style="font-size:.8rem;font-weight:600;color:#475569;display:block;margin-bottom:4px;">' +
            '<i class="fas fa-envelope me-1"></i> ইমেইল (ঐচ্ছিক)</label>' +
            '<input id="dnPayEmail" type="email" placeholder="email@example.com" maxlength="100" ' +
            'style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:8px 12px;font-size:.9rem;outline:none;">' +
            '</div>' +
            '<button id="dnPaySubmitBtn" style="width:100%;background:linear-gradient(135deg,#22c55e,#16a34a);' +
            'color:#fff;border:none;border-radius:10px;padding:12px;font-size:.95rem;font-weight:700;cursor:pointer;' +
            'display:flex;align-items:center;justify-content:center;gap:8px;">' +
            '<i class="fas fa-lock"></i> ShurjoPay দিয়ে নিরাপদ পেমেন্ট করুন</button>' +
            '<div style="text-align:center;margin-top:10px;font-size:.72rem;color:#94a3b8;">' +
            '<i class="fas fa-shield-alt me-1"></i>SSL সুরক্ষিত &middot; বিকাশ &middot; নগদ &middot; রকেট &middot; সব ব্যাংক কার্ড সাপোর্টেড</div>' +
            '</div></div></div>';

        $('body').append(html);
        $('#dnPayName').val(sessionStorage.getItem('institutionName') || '');
        $('#dnPayPhone').val((window.currentProfile && window.currentProfile.phone) || '');
        $('#dnPayEmail').val((window.currentProfile && window.currentProfile.email) || '');

        $('#dnPayModalClose').on('click', function () { $('#dueNoticePayModal').remove(); });

        $('#dnPaySubmitBtn').on('click', function () {
            var name  = $('#dnPayName').val().trim();
            var phone = $('#dnPayPhone').val().trim();
            var email = $('#dnPayEmail').val().trim();
            if (!name)  { alert('নাম দিন।');          return; }
            if (!phone) { alert('মোবাইল নম্বর দিন।'); return; }

            var $btn = $(this);
            $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-2"></i>প্রসেস হচ্ছে...');

            $.ajax({
                url: '/api/invoice/list?institutionId=' + institutionId + '&status=Due&pageSize=100',
                method: 'GET',
                success: function (r) {
                    if (!r.success || !r.data || !r.data.length) {
                        alert('বকেয়া ইনভয়েস পাওয়া যায়নি।');
                        $btn.prop('disabled', false).html('<i class="fas fa-lock me-2"></i>ShurjoPay দিয়ে নিরাপদ পেমেন্ট করুন');
                        return;
                    }
                    var ids = r.data.map(function (inv) { return inv.invoiceID; });
                    $.ajax({
                        url: '/api/shurjopay/initiate',
                        method: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify({
                            institutionId:   parseInt(institutionId),
                            invoiceIds:      ids,
                            customerName:    name,
                            customerPhone:   phone,
                            customerEmail:   email || null,
                            customerAddress: 'Bangladesh'
                        }),
                        success: function (res) {
                            if (res.success && res.checkoutUrl) {
                                window.location.href = res.checkoutUrl;
                            } else {
                                alert('পেমেন্ট শুরু করতে সমস্যা: ' + (res.message || ''));
                                $btn.prop('disabled', false).html('<i class="fas fa-lock me-2"></i>ShurjoPay দিয়ে নিরাপদ পেমেন্ট করুন');
                            }
                        },
                        error: function (xhr) {
                            var msg = (xhr.responseJSON && xhr.responseJSON.message) ? xhr.responseJSON.message : 'সার্ভার এরর। আবার চেষ্টা করুন।';
                            alert(msg);
                            $btn.prop('disabled', false).html('<i class="fas fa-lock me-2"></i>ShurjoPay দিয়ে নিরাপদ পেমেন্ট করুন');
                        }
                    });
                },
                error: function () {
                    alert('ইনভয়েস লোড করতে সমস্যা।');
                    $btn.prop('disabled', false).html('<i class="fas fa-lock me-2"></i>ShurjoPay দিয়ে নিরাপদ পেমেন্ট করুন');
                }
            });
        });
    }

    // ══════════════════════════════════════════════════════════════
    // Merged Due Popup — সার্ভিস চার্জ + SMS একসাথে
    // ══════════════════════════════════════════════════════════════
    function showMergedDuePopup(d, institutionId) {
        $('#mergedDueNoticeOverlay').remove();

        var serviceBlocked   = !!d.accessBlocked;
        var serviceCloseable = !!d.closeable;
        var smsBlocked       = !!d.smsAccessBlocked;
        var smsCloseable     = !!d.smsCloseable;
        // যদি কোনো একটি ব্লক হয় সেটির জন্য close বন্ধ, তবে
        // সামগ্রিকভাবে close বোতাম দেখানো হবে যদি উভয়ই closeable হয়
        var closeable        = serviceCloseable && smsCloseable;
        var graceRemaining   = d.graceDaysRemaining || 0;

        if (serviceBlocked) {
            lockAllNavigation();
        }

        var html = '';
        html += '<div id="mergedDueNoticeOverlay" style="' +
            'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;' +
            'pointer-events:all;' +
            'background:rgba(0,0,0,' + (serviceBlocked ? '0.88' : '0.50') + ');' +
            'display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto;">';

        html += '<div style="background:#fff;border-radius:16px;max-width:520px;width:100%;' +
            'box-shadow:0 20px 60px rgba(0,0,0,0.4);overflow:hidden;margin:auto;">';

        // ── Header ──
        html += '<div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:16px 22px;color:#fff;' +
            'display:flex;align-items:center;justify-content:space-between;">';
        html += '<div style="display:flex;align-items:center;gap:10px;">' +
            '<i class="fas fa-exclamation-triangle" style="font-size:1.3rem;"></i>' +
            '<span style="font-size:1.05rem;font-weight:700;">⚠ বকেয়া বিজ্ঞপ্তি</span></div>';
        if (closeable) {
            html += '<button id="mergedDueCloseBtn" style="' +
                'background:rgba(255,255,255,0.2);border:none;color:#fff;' +
                'width:32px;height:32px;border-radius:50%;cursor:pointer;' +
                'font-size:1.1rem;display:flex;align-items:center;justify-content:center;">&times;</button>';
        }
        html += '</div>';

        // ── Body ──
        html += '<div style="padding:20px 24px;">';

        // ── সার্ভিস চার্জ বিল section ──
        html += '<div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1.5px solid #fde68a;' +
            'border-radius:12px;padding:14px;margin-bottom:12px;">';
        html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
            '<i class="fas fa-file-invoice-dollar" style="color:#d97706;font-size:1.1rem;"></i>' +
            '<span style="font-size:.9rem;font-weight:700;color:#92400e;">মাসিক সার্ভিস চার্জ বিল</span>';
        if (serviceBlocked) {
            html += '<span style="margin-left:auto;background:#dc2626;color:#fff;font-size:.7rem;' +
                'font-weight:700;padding:2px 8px;border-radius:20px;">অ্যাক্সেস বন্ধ</span>';
        }
        html += '</div>';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">';
        html += '<div><div style="font-size:.75rem;color:#6b7280;">বকেয়া ইনভয়েস: <strong>' + (d.dueCount || 0) + 'টি</strong></div>' +
            '<div style="font-size:1.4rem;font-weight:800;color:#d97706;">৳' + fmt(d.totalDueAmount) + ' টাকা</div></div>';
        if (!serviceBlocked && graceRemaining > 0) {
            html += '<div style="text-align:right;">' +
                '<div style="font-size:.75rem;color:#6b7280;">সময় বাকি</div>' +
                '<div style="font-size:1.3rem;font-weight:800;color:#d97706;">' + graceRemaining + ' দিন</div></div>';
        }
        html += '</div>';
        if (serviceBlocked) {
            html += '<div style="margin-top:8px;font-size:.8rem;color:#dc2626;font-weight:600;">' +
                '<i class="fas fa-lock me-1"></i>বকেয়া পরিশোধ না হওয়া পর্যন্ত সফটওয়্যার লক থাকবে।</div>';
        }
        html += '</div>'; // service section end

        // ── SMS বিল section ──
        html += '<div style="background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border:1.5px solid #bae6fd;' +
            'border-radius:12px;padding:14px;margin-bottom:12px;">';
        html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
            '<i class="fas fa-sms" style="color:#0284c7;font-size:1.1rem;"></i>' +
            '<span style="font-size:.9rem;font-weight:700;color:#0369a1;">SMS রিচার্জ বিল</span>';
        if (smsBlocked) {
            html += '<span style="margin-left:auto;background:#7c3aed;color:#fff;font-size:.7rem;' +
                'font-weight:700;padding:2px 8px;border-radius:20px;">SMS বন্ধ</span>';
        }
        html += '</div>';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">';
        html += '<div><div style="font-size:.75rem;color:#6b7280;">মোট বকেয়া</div>' +
            '<div style="font-size:1.4rem;font-weight:800;color:#0284c7;">৳' + fmt(d.smsTotalDueAmount) + ' টাকা</div></div>';
        if (smsBlocked) {
            html += '<div style="font-size:.78rem;color:#7c3aed;font-weight:600;"><i class="fas fa-comment-slash me-1"></i>SMS পরিষেবা বন্ধ</div>';
        }
        html += '</div>';
        html += '</div>'; // sms section end

        // Contact card
        html += CONTACT_HTML;

        html += '</div>'; // body end

        // ── Footer ──
        html += '<div style="padding:14px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;' +
            'display:flex;gap:10px;justify-content:center;">';
        html += '<button id="mergedDueInvoiceBtn" style="' +
            'display:inline-flex;align-items:center;gap:6px;padding:10px 20px;' +
            'background:linear-gradient(135deg,#6c7ae0,#5a68c9);color:#fff;' +
            'border-radius:10px;font-size:.88rem;font-weight:700;border:none;cursor:pointer;">' +
            '<i class="fas fa-file-invoice"></i> ইনভয়েস দেখুন</button>';
        html += '<button id="mergedDuePayOnlineBtn" style="' +
            'display:inline-flex;align-items:center;gap:6px;padding:10px 20px;' +
            'background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;' +
            'border-radius:10px;font-size:.88rem;font-weight:700;border:none;cursor:pointer;">' +
            '<i class="fas fa-credit-card"></i> অনলাইনে পরিশোধ করুন</button>';
        if (closeable) {
            html += '<button id="mergedDueCloseBtnFooter" style="' +
                'padding:10px 20px;background:#e2e8f0;border:none;border-radius:10px;' +
                'font-size:.88rem;font-weight:700;color:#475569;cursor:pointer;">পরে দেখব</button>';
        }
        html += '</div>';

        html += '</div></div>'; // card + overlay end

        var _mergedTotalDue = (d.totalDueAmount || 0) + (d.smsTotalDueAmount || 0);

        $('body').append(html);

        $(document).on('click', '#mergedDueInvoiceBtn', function () {
            $('body').css('pointer-events', 'all');
            $(document).off('click.accessLocked');
            window.location.href = '/due-invoice.html';
        });

        $(document).on('click', '#mergedDuePayOnlineBtn', function () {
            openDueNoticePayModal(_mergedTotalDue);
        });

        $(document).on('click', '#mergedDueCloseBtn, #mergedDueCloseBtnFooter', function () {
            $('#mergedDueNoticeOverlay').fadeOut(200, function () { $(this).remove(); });
        });
    }

    // ══════════════════════════════════════════════════════════════
    // সার্ভিস চার্জ Due Popup
    // ══════════════════════════════════════════════════════════════
    function showDuePopup(d, institutionId) {
        $('#dueNoticeOverlay').remove();

        var isBlocked = d.accessBlocked;
        var closeable = d.closeable;
        var graceRemaining = d.graceDaysRemaining;

        if (isBlocked) {
            lockAllNavigation();
        }

        var headerBg = isBlocked
            ? 'linear-gradient(135deg,#dc2626,#991b1b)'
            : 'linear-gradient(135deg,#f59e0b,#d97706)';

        var html = '';
        html += '<div id="dueNoticeOverlay" style="' +
            'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;' +
            'pointer-events:all;' +
            'background:rgba(0,0,0,' + (isBlocked ? '0.88' : '0.45') + ');' +
            'display:flex;align-items:center;justify-content:center;padding:20px;' +
            'overflow-y:auto;">';

        html += '<div id="dueNoticeCard" style="' +
            'background:#fff;border-radius:16px;max-width:500px;width:100%;' +
            'box-shadow:0 20px 60px rgba(0,0,0,0.4);overflow:hidden;' +
            'margin:auto;">';

        // ── Header ──
        html += '<div style="background:' + headerBg + ';padding:18px 24px;color:#fff;' +
            'display:flex;align-items:center;justify-content:space-between;">';
        html += '<div style="display:flex;align-items:center;gap:10px;">' +
            '<i class="fas fa-exclamation-triangle" style="font-size:1.3rem;"></i>' +
            '<span style="font-size:1.05rem;font-weight:700;">⚠ বকেয়া বিজ্ঞপ্তি</span></div>';
        if (closeable) {
            html += '<button id="dueNoticeCloseBtn" style="' +
                'background:rgba(255,255,255,0.2);border:none;color:#fff;' +
                'width:32px;height:32px;border-radius:50%;cursor:pointer;' +
                'font-size:1.1rem;display:flex;align-items:center;justify-content:center;">&times;</button>';
        }
        html += '</div>';

        // ── Body ──
        html += '<div style="padding:22px 24px;text-align:center;">';

        if (isBlocked) {
            html += '<div style="margin-bottom:14px;">' +
                '<i class="fas fa-ban" style="font-size:3.2rem;color:#dc2626;"></i></div>';
            html += '<p style="font-size:.95rem;color:#334155;margin-bottom:14px;line-height:1.6;">' +
                'আপনার প্রতিষ্ঠানের <strong style="color:#dc2626;font-size:1.15rem;">' + d.dueCount + '</strong> টি বকেয়া ইনভয়েস রয়েছে।</p>';

            // Due amount
            html += '<div style="background:linear-gradient(135deg,#fef2f2,#fee2e2);' +
                'border:1px solid #fecaca;border-radius:12px;padding:14px;margin-bottom:14px;">';
            html += '<div style="font-size:.82rem;color:#64748b;margin-bottom:4px;">মোট বকেয়া পরিমাণ:</div>';
            html += '<div style="font-size:1.8rem;font-weight:800;color:#dc2626;">৳' + fmt(d.totalDueAmount) + ' টাকা</div>';
            html += '</div>';

            // Blocked notice
            html += '<div style="background:#fef2f2;border:2px solid #dc2626;border-radius:12px;padding:18px;margin-bottom:4px;">';
            html += '<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:10px;">' +
                '<i class="fas fa-lock" style="color:#dc2626;font-size:1.3rem;"></i>' +
                '<span style="font-size:1rem;font-weight:700;color:#dc2626;">সফটওয়্যার অ্যাক্সেস বন্ধ</span></div>';
            html += '<p style="font-size:.88rem;color:#334155;margin:0;line-height:1.7;">' +
                'বকেয়া পরিশোধ না হওয়া পর্যন্ত সফটওয়্যারটির <strong style="color:#dc2626;">সকল পেজ লক</strong> থাকবে।<br>' +
                'নিচের নম্বরে যোগাযোগ করে বিল পরিশোধ করুন।</p>';
            html += '</div>';

            // Contact card
            html += CONTACT_HTML;

        } else {
            html += '<div style="margin-bottom:14px;">' +
                '<i class="fas fa-clock" style="font-size:3.2rem;color:#f59e0b;"></i></div>';
            html += '<p style="font-size:.95rem;color:#334155;margin-bottom:14px;line-height:1.6;">' +
                'আপনার প্রতিষ্ঠানের <strong style="color:#f59e0b;font-size:1.15rem;">' + d.dueCount + '</strong> টি বকেয়া ইনভয়েস রয়েছে।</p>';

            html += '<div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);' +
                'border:1px solid #fde68a;border-radius:12px;padding:14px;margin-bottom:14px;">';
            html += '<div style="font-size:.82rem;color:#64748b;margin-bottom:4px;">মোট বকেয়া পরিমাণ:</div>';
            html += '<div style="font-size:1.8rem;font-weight:800;color:#d97706;">৳' + fmt(d.totalDueAmount) + ' টাকা</div>';
            html += '</div>';

            if (graceRemaining > 0) {
                html += '<div style="background:#fffbeb;border:2px solid #f59e0b;border-radius:12px;padding:14px;margin-bottom:14px;">';
                html += '<div style="font-size:.88rem;color:#92400e;font-weight:600;">⏰ বিল পরিশোধের সময় বাকি:</div>';
                html += '<div style="font-size:2rem;font-weight:800;color:#d97706;margin:4px 0;">' + graceRemaining + ' দিন</div>';
                html += '<div style="font-size:.8rem;color:#92400e;">সময়মতো পরিশোধ না করলে সফটওয়্যার অ্যাক্সেস বন্ধ হয়ে যাবে।</div>';
                html += '</div>';
            }

            // Contact card
            html += CONTACT_HTML;
        }

        html += '</div>'; // body end

        // ── Footer ──
        html += '<div style="padding:14px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;' +
            'display:flex;gap:10px;justify-content:center;">';
        html += '<button id="dueNoticeInvoiceBtn" style="' +
            'display:inline-flex;align-items:center;gap:6px;padding:10px 20px;' +
            'background:linear-gradient(135deg,#6c7ae0,#5a68c9);color:#fff;' +
            'border-radius:10px;font-size:.88rem;font-weight:700;border:none;cursor:pointer;">' +
            '<i class="fas fa-file-invoice"></i> ইনভয়েস দেখুন</button>';
        html += '<button id="dueNoticePayOnlineBtn" style="' +
            'display:inline-flex;align-items:center;gap:6px;padding:10px 20px;' +
            'background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;' +
            'border-radius:10px;font-size:.88rem;font-weight:700;border:none;cursor:pointer;">' +
            '<i class="fas fa-credit-card"></i> অনলাইনে পরিশোধ করুন</button>';
        if (closeable) {
            html += '<button id="dueNoticeCloseBtnFooter" style="' +
                'padding:10px 20px;background:#e2e8f0;border:none;border-radius:10px;' +
                'font-size:.88rem;font-weight:700;color:#475569;cursor:pointer;">পরে দেখব</button>';
        }
        html += '</div>';

        html += '</div></div>'; // card + overlay end

        $('body').append(html);

        // Invoice button — navigate to invoice page
        $(document).on('click', '#dueNoticeInvoiceBtn', function () {
            $('body').css('pointer-events', 'all');
            $(document).off('click.accessLocked');
            window.location.href = '/due-invoice.html';
        });

        // Online pay button
        $(document).on('click', '#dueNoticePayOnlineBtn', function () {
            openDueNoticePayModal(d.totalDueAmount || 0);
        });

        // Close button events
        $(document).on('click', '#dueNoticeCloseBtn, #dueNoticeCloseBtnFooter', function () {
            $('#dueNoticeOverlay').fadeOut(200, function () { $(this).remove(); });
        });
    }

    // ══════════════════════════════════════════════════════════════
    // SMS রিচার্জ Due Popup
    // ══════════════════════════════════════════════════════════════
    function showSmsDuePopup(d, institutionId) {
        $('#smsDueNoticeOverlay').remove();

        var isBlocked = d.smsAccessBlocked;
        var closeable = d.smsCloseable;

        if (isBlocked) {
            // শুধু SMS access বন্ধ — full lock না
        }

        var headerBg = isBlocked
            ? 'linear-gradient(135deg,#7c3aed,#5b21b6)'
            : 'linear-gradient(135deg,#0ea5e9,#0284c7)';

        var html = '';
        html += '<div id="smsDueNoticeOverlay" style="' +
            'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99998;' +
            'pointer-events:all;' +
            'background:rgba(0,0,0,' + (isBlocked ? '0.75' : '0.40') + ');' +
            'display:flex;align-items:center;justify-content:center;padding:20px;' +
            'overflow-y:auto;">';

        html += '<div style="' +
            'background:#fff;border-radius:16px;max-width:460px;width:100%;' +
            'box-shadow:0 20px 60px rgba(0,0,0,0.35);overflow:hidden;margin:auto;">';

        // Header
        html += '<div style="background:' + headerBg + ';padding:16px 22px;color:#fff;' +
            'display:flex;align-items:center;justify-content:space-between;">';
        html += '<div style="display:flex;align-items:center;gap:10px;">' +
            '<i class="fas fa-sms" style="font-size:1.3rem;"></i>' +
            '<span style="font-size:1rem;font-weight:700;">📱 SMS বকেয়া বিজ্ঞপ্তি</span></div>';
        if (closeable) {
            html += '<button id="smsDueCloseBtn" style="' +
                'background:rgba(255,255,255,0.2);border:none;color:#fff;' +
                'width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:1rem;">&times;</button>';
        }
        html += '</div>';

        // Body
        html += '<div style="padding:20px 22px;text-align:center;">';

        if (isBlocked) {
            html += '<div style="margin-bottom:12px;">' +
                '<i class="fas fa-comment-slash" style="font-size:3rem;color:#7c3aed;"></i></div>';
            html += '<p style="font-size:.93rem;color:#334155;margin-bottom:12px;line-height:1.6;">' +
                'SMS বকেয়া পরিশোধ না হওয়ায় <strong style="color:#7c3aed;">SMS পরিষেবা বন্ধ</strong> রয়েছে।</p>';
        } else {
            html += '<div style="margin-bottom:12px;">' +
                '<i class="fas fa-comment-dollar" style="font-size:3rem;color:#0ea5e9;"></i></div>';
            html += '<p style="font-size:.93rem;color:#334155;margin-bottom:12px;line-height:1.6;">' +
                'আপনার SMS রিচার্জ বিল বকেয়া রয়েছে। দ্রুত পরিশোধ করুন।</p>';
        }

        html += '<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:12px;margin-bottom:12px;">';
        html += '<div style="font-size:.8rem;color:#0369a1;margin-bottom:3px;">মোট বকেয়া:</div>';
        html += '<div style="font-size:1.6rem;font-weight:800;color:#0284c7;">৳' + fmt(d.smsTotalDueAmount) + ' টাকা</div>';
        html += '</div>';

        html += CONTACT_HTML;
        html += '</div>'; // body end

        // Footer
        html += '<div style="padding:12px 22px;background:#f8fafc;border-top:1px solid #e2e8f0;' +
            'display:flex;gap:10px;justify-content:center;">';
        html += '<button id="smsDueInvoiceBtn" style="' +
            'display:inline-flex;align-items:center;gap:6px;padding:9px 18px;' +
            'background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#fff;' +
            'border-radius:10px;font-size:.85rem;font-weight:700;border:none;cursor:pointer;">' +
            '<i class="fas fa-file-invoice"></i> ইনভয়েস দেখুন</button>';
        html += '<button id="smsDuePayOnlineBtn" style="' +
            'display:inline-flex;align-items:center;gap:6px;padding:9px 18px;' +
            'background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;' +
            'border-radius:10px;font-size:.85rem;font-weight:700;border:none;cursor:pointer;">' +
            '<i class="fas fa-credit-card"></i> অনলাইনে পরিশোধ করুন</button>';
        if (closeable) {
            html += '<button id="smsDueCloseBtnFooter" style="' +
                'padding:9px 18px;background:#e2e8f0;border:none;border-radius:10px;' +
                'font-size:.85rem;font-weight:700;color:#475569;cursor:pointer;">পরে দেখব</button>';
        }
        html += '</div>';

        html += '</div></div>'; // card + overlay end

        $('body').append(html);

        // Invoice button — navigate to invoice page
        $(document).on('click', '#smsDueInvoiceBtn', function () {
            $('body').css('pointer-events', 'all');
            $(document).off('click.accessLocked');
            window.location.href = '/due-invoice.html';
        });

        // Online pay button
        $(document).on('click', '#smsDuePayOnlineBtn', function () {
            openDueNoticePayModal(d.smsTotalDueAmount || 0);
        });

        $(document).on('click', '#smsDueCloseBtn, #smsDueCloseBtnFooter', function () {
            $('#smsDueNoticeOverlay').fadeOut(200, function () { $(this).remove(); });
        });
    }

    // ── Initialize ────────────────────────────────────────────────
    // dashboard.html এ $(document).ready() এর পরে login check শেষ হয়
    // তাই আমরা 500ms delay দিয়ে call করছি যাতে sessionStorage সেট হয়ে যায়
    $(document).ready(function () {
        setTimeout(initDueNotice, 500);
    });

    // বাইরে থেকেও call করা যাবে (dashboard.html login check শেষ হলে)
    window.TailorBD = window.TailorBD || {};
    window.TailorBD.initDueNotice = function () {
        _initialized = false;
        initDueNotice();
    };

})();
