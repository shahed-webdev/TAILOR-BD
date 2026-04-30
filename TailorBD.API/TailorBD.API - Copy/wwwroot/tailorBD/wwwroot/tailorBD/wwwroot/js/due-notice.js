// TailorBD - Due Invoice Popup Notice
//
// Logic:
//   সার্ভিস চার্জ বিল:
//     বিল তৈরি হওয়ার পর থেকে 7 দিন = হালকা ওয়ার্নিং + কাউন্টডাউন (ক্লোজ করা যায়)
//     7 দিন পার হলে = সফটওয়্যার একসেস সম্পূর্ণ বন্ধ (ক্লোজ করা যায় না)
//   SMS রিচার্জ বিল:
//     বিল তৈরি হওয়ার পর থেকে 7 দিন = হালকা ওয়ার্নিং (ক্লোজ করা যায়)
//     7 দিন পার হলে = SMS একসেস বন্ধ (ক্লোজ করা যায় না)
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
        // সব link ক্লিক বন্ধ
        $(document).on('click.accessLocked', 'a, button', function (e) {
            var id = $(this).attr('id') || '';
            // শুধু due notice এর বাটনগুলো allow করব
            if (id === 'dueNoticeInvoiceBtn' || id === 'smsDueInvoiceBtn' ||
                id === 'smsDueRechargeBtn'   || id.indexOf('dueNotice') === 0 ||
                id.indexOf('smsDue') === 0) {
                return true;
            }
            e.preventDefault();
            e.stopImmediatePropagation();
            return false;
        });

        // Sidebar links ও navbar কে visually dim করা
        $('body').css('pointer-events', 'none');
        $('#dueNoticeOverlay, #smsDueNoticeOverlay').css('pointer-events', 'all');
    }

    function initDueNotice() {
        if (_initialized) return;
        var institutionId = sessionStorage.getItem('institutionId');
        if (!institutionId) return;
        _initialized = true;

        $.ajax({
            url: '/api/invoice/due-status/' + institutionId,
            method: 'GET',
            success: function (r) {
                if (!r.success || !r.data) return;
                var d = r.data;

                // ── 1) সার্ভিস চার্জ due check ──
                if (d.showPopup) {
                    showDuePopup(d, institutionId);
                    return;
                }

                // ── 2) SMS রিচার্জ due check ──
                if (d.smsShowPopup) {
                    showSmsDuePopup(d, institutionId);
                }
            },
            error: function (xhr, status, err) {
                console.error('[DueNotice] API error:', status, err);
                _initialized = false;
            }
        });
    }

    function fmt(n) {
        return (n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
    }

    // ══════════════════════════════════════════════════════════════
    // সার্ভিস চার্জ Due Popup
    // ══════════════════════════════════════════════════════════════
    function showDuePopup(d, institutionId) {
        $('#dueNoticeOverlay').remove();

        var isBlocked = d.accessBlocked;
        var closeable = d.closeable;
        var graceRemaining = d.graceDaysRemaining;

        // Access blocked হলে সব navigation বন্ধ
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
                'বকেয়া পরিশোধ না হওয়া পর্যন্ত সফটওয়্যারের <strong style="color:#dc2626;">সকল পেজ লক</strong> থাকবে।<br>' +
                'নিচের নম্বরে যোগাযোগ করে বিল পরিশোধ করুন।</p>';
            html += '</div>';

            // Contact card
            html += CONTACT_HTML;

        } else {
            html += '<div style="margin-bottom:14px;">' +
                '<i class="fas fa-clock" style="font-size:3.2rem;color:#f59e0b;"></i></div>';
            html += '<p style="font-size:.95rem;color:#334155;margin-bottom:14px;line-height:1.6;">' +
                'আপনার প্রতিষ্ঠানের <strong style="color:#f59e0b;font-size:1.15rem;">' + d.dueCount + '</strong> টি বকেয়া ইনভয়েস রয়েছে।</p>';

            html += '<div style="background:linear-gradient(135deg,#fef2f2,#fee2e2);' +
                'border:1px solid #fecaca;border-radius:12px;padding:14px;margin-bottom:14px;">';
            html += '<div style="font-size:.82rem;color:#64748b;margin-bottom:4px;">মোট বকেয়া পরিমাণ:</div>';
            html += '<div style="font-size:1.8rem;font-weight:800;color:#dc2626;">৳' + fmt(d.totalDueAmount) + ' টাকা</div>';
            html += '</div>';

            html += '<div style="background:#fef2f2;border:2px solid #f59e0b;border-radius:12px;padding:18px;margin-bottom:4px;">';
            html += '<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:10px;">' +
                '<i class="fas fa-hourglass-half" style="color:#f59e0b;font-size:1.3rem;"></i>' +
                '<span style="font-size:1rem;font-weight:700;color:#f59e0b;">বিল পরিশোধের সময়সীমা রয়েছে</span></div>';
            html += '<p style="font-size:.88rem;color:#334155;margin:0;line-height:1.7;">' +
                'সময়সীমা শেষ হতে আর <span style="color:#dc2626;font-weight:700;">' + graceRemaining + ' দিন</span> বাকি।<br>' +
                '<span style="color:#dc2626;font-weight:600;">সময়সীমা পার হলে সকল অ্যাক্সেস বন্ধ হবে।</span></p>';
            html += '</div>';
        }

        html += '</div>'; // Body

        // ── Footer ──
        html += '<div style="background:#f9fafb;padding:14px 20px;text-align:center;">';

        if (!isBlocked) {
            html += '<div style="display:inline-block;background:linear-gradient(135deg,#fef3c7,#fde68a);' +
                'border:1.5px solid #f59e0b;border-radius:8px;padding:6px 14px;margin-bottom:12px;' +
                'font-size:.8rem;color:#92400e;font-weight:600;">' +
                '<i class="fas fa-exclamation-circle" style="color:#dc2626;margin-right:5px;"></i>' +
                'সময়সীমা শেষ হলে <span style="color:#dc2626;font-weight:700;text-decoration:underline;">সকল অ্যাক্সেস বন্ধ</span> হবে!' +
                '</div>';
        }

        html += '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">';
        html += '<button id="dueNoticeInvoiceBtn" style="' +
            'background:#6366f1;color:#fff;border:none;border-radius:8px;' +
            'padding:10px 20px;font-size:.95rem;font-weight:600;cursor:pointer;' +
            'display:flex;align-items:center;gap:6px;">' +
            '<i class="fas fa-file-invoice"></i> ইনভয়েস দেখুন' +
            '</button>';
        if (closeable) {
            html += '<button id="dueNoticeCloseFooterBtn" style="' +
                'background:#e5e7eb;color:#374151;border:none;border-radius:8px;' +
                'padding:10px 20px;font-size:.95rem;font-weight:600;cursor:pointer;' +
                'display:flex;align-items:center;gap:6px;">' +
                '<i class="fas fa-times"></i> বন্ধ করুন' +
                '</button>';
        }
        html += '</div></div>';

        $('body').append(html);

        // ── Events ──
        if (closeable) {
            $('#dueNoticeCloseBtn').off().on('click', function () {
                $('#dueNoticeOverlay').fadeOut(300, function () { $(this).remove(); });
            });
            $('#dueNoticeCloseFooterBtn').off().on('click', function () {
                $('#dueNoticeOverlay').fadeOut(300, function () { $(this).remove(); });
            });
        }

        $('#dueNoticeInvoiceBtn').off().on('click', function () {
            $('#dueNoticeOverlay').fadeOut(200, function () { $(this).remove(); });
            window.location.href = 'due-invoice.html';
        });

        // Overlay ক্লিকে বন্ধ হবে না যদি blocked
        if (!isBlocked) {
            $('#dueNoticeOverlay').on('click', function (e) {
                if ($(e.target).is('#dueNoticeOverlay')) {
                    $('#dueNoticeOverlay').fadeOut(300, function () { $(this).remove(); });
                }
            });
        }
    }

    // ══════════════════════════════════════════════════════════════
    // SMS রিচার্জ Due Popup
    // ══════════════════════════════════════════════════════════════
    function showSmsDuePopup(d, institutionId) {
        $('#smsDueNoticeOverlay').remove();

        var isBlocked = d.smsAccessBlocked;
        var closeable = d.smsCloseable;

        var headerBg = isBlocked
            ? 'linear-gradient(135deg,#7c3aed,#5b21b6)'
            : 'linear-gradient(135deg,#2563eb,#1d4ed8)';

        var html = '';
        html += '<div id="smsDueNoticeOverlay" style="' +
            'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;' +
            'pointer-events:all;' +
            'background:rgba(0,0,0,' + (isBlocked ? '0.85' : '0.5') + ');' +
            'display:flex;align-items:center;justify-content:center;padding:20px;' +
            'overflow-y:auto;">';

        html += '<div id="smsDueNoticeCard" style="' +
            'background:#fff;border-radius:16px;max-width:480px;width:100%;' +
            'box-shadow:0 20px 60px rgba(0,0,0,0.3);overflow:hidden;margin:auto;">';

        // ── Header ──
        html += '<div style="background:' + headerBg + ';padding:16px 22px;color:#fff;' +
            'display:flex;align-items:center;justify-content:space-between;">';
        html += '<div style="display:flex;align-items:center;gap:10px;">' +
            '<i class="fas fa-sms" style="font-size:1.3rem;"></i>' +
            '<span style="font-size:1rem;font-weight:700;">📱 SMS রিচার্জ বকেয়া</span></div>';
        if (closeable) {
            html += '<button id="smsDueCloseBtn" style="' +
                'background:rgba(255,255,255,0.2);border:none;color:#fff;' +
                'width:32px;height:32px;border-radius:50%;cursor:pointer;' +
                'font-size:1.1rem;display:flex;align-items:center;justify-content:center;">&times;</button>';
        }
        html += '</div>';

        // ── Body ──
        html += '<div style="padding:20px 22px;text-align:center;">';

        if (isBlocked) {
            html += '<div style="margin-bottom:14px;">' +
                '<i class="fas fa-ban" style="font-size:3rem;color:#7c3aed;"></i></div>';
            html += '<p style="font-size:.9rem;color:#334155;margin-bottom:12px;line-height:1.6;">' +
                '<strong style="color:#7c3aed;font-size:1.1rem;">' + d.smsDueCount + '</strong> টি অপরিশোধিত SMS রিচার্জ ইনভয়েস রয়েছে।</p>';
            html += '<div style="background:linear-gradient(135deg,#f3e8ff,#ede9fe);' +
                'border:1px solid #c4b5fd;border-radius:12px;padding:12px;margin-bottom:12px;">';
            html += '<div style="font-size:.8rem;color:#64748b;margin-bottom:4px;">মোট বকেয়া:</div>';
            html += '<div style="font-size:1.6rem;font-weight:800;color:#7c3aed;">৳' + fmt(d.smsTotalDueAmount) + ' টাকা</div>';
            html += '</div>';
            html += '<div style="background:#f5f3ff;border:2px solid #7c3aed;border-radius:10px;padding:14px;margin-bottom:4px;">';
            html += '<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:8px;">' +
                '<i class="fas fa-lock" style="color:#7c3aed;font-size:1.1rem;"></i>' +
                '<span style="font-size:.93rem;font-weight:700;color:#7c3aed;">SMS পরিষেবা বন্ধ</span></div>';
            html += '<p style="font-size:.85rem;color:#334155;margin:0;line-height:1.7;">' +
                'বকেয়া পরিশোধ না করায় <strong style="color:#7c3aed;">SMS পাঠানো বন্ধ</strong>।<br>' +
                'বিল পরিশোধ করলে সাথে সাথে SMS চালু হবে।</p>';
            html += '</div>';

            // Contact card
            html += CONTACT_HTML;

        } else {
            html += '<div style="margin-bottom:14px;">' +
                '<i class="fas fa-mobile-alt" style="font-size:3rem;color:#2563eb;"></i></div>';
            html += '<p style="font-size:.9rem;color:#334155;margin-bottom:12px;line-height:1.6;">' +
                '<strong style="color:#2563eb;font-size:1.1rem;">' + d.smsDueCount + '</strong> টি অপরিশোধিত SMS রিচার্জ ইনভয়েস রয়েছে।</p>';
            html += '<div style="background:linear-gradient(135deg,#eff6ff,#dbeafe);' +
                'border:1px solid #93c5fd;border-radius:12px;padding:12px;margin-bottom:12px;">';
            html += '<div style="font-size:.8rem;color:#64748b;margin-bottom:4px;">মোট বকেয়া:</div>';
            html += '<div style="font-size:1.6rem;font-weight:800;color:#2563eb;">৳' + fmt(d.smsTotalDueAmount) + ' টাকা</div>';
            html += '</div>';
            html += '<div style="background:#eff6ff;border:2px solid #2563eb;border-radius:10px;padding:14px;margin-bottom:4px;">';
            html += '<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:8px;">' +
                '<i class="fas fa-hourglass-half" style="color:#2563eb;font-size:1.1rem;"></i>' +
                '<span style="font-size:.93rem;font-weight:700;color:#2563eb;">SMS বিল পরিশোধ করুন</span></div>';
            html += '<p style="font-size:.85rem;color:#334155;margin:0;line-height:1.7;">' +
                'দ্রুত SMS রিচার্জের বিল পরিশোধ করুন।<br>' +
                '<span style="color:#dc2626;font-weight:600;">৭ দিনের মধ্যে না করলে SMS পরিষেবা বন্ধ হবে।</span></p>';
            html += '</div>';
        }

        html += '</div>'; // Body

        // ── Footer ──
        html += '<div style="background:#f9fafb;padding:12px 16px;text-align:center;">';
        html += '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">';
        html += '<button id="smsDueInvoiceBtn" style="' +
            'background:' + (isBlocked ? '#7c3aed' : '#2563eb') + ';color:#fff;border:none;border-radius:8px;' +
            'padding:9px 16px;font-size:.9rem;font-weight:600;cursor:pointer;' +
            'display:flex;align-items:center;gap:6px;">' +
            '<i class="fas fa-file-invoice"></i> ইনভয়েস দেখুন' +
            '</button>';
        if (!isBlocked) {
            html += '<button id="smsDueRechargeBtn" style="' +
                'background:#10b981;color:#fff;border:none;border-radius:8px;' +
                'padding:9px 16px;font-size:.9rem;font-weight:600;cursor:pointer;' +
                'display:flex;align-items:center;gap:6px;">' +
                '<i class="fas fa-mobile-alt"></i> আরো রিচার্জ' +
                '</button>';
        }
        if (closeable) {
            html += '<button id="smsDueCloseFooterBtn" style="' +
                'background:#e5e7eb;color:#374151;border:none;border-radius:8px;' +
                'padding:9px 16px;font-size:.9rem;font-weight:600;cursor:pointer;' +
                'display:flex;align-items:center;gap:6px;">' +
                '<i class="fas fa-times"></i> বন্ধ করুন' +
                '</button>';
        }
        html += '</div></div>';

        $('body').append(html);

        // ── Events ──
        if (closeable) {
            $('#smsDueCloseBtn').off().on('click', function () {
                $('#smsDueNoticeOverlay').fadeOut(300, function () { $(this).remove(); });
            });
            $('#smsDueCloseFooterBtn').off().on('click', function () {
                $('#smsDueNoticeOverlay').fadeOut(300, function () { $(this).remove(); });
            });
        }

        $('#smsDueInvoiceBtn').off().on('click', function () {
            $('#smsDueNoticeOverlay').fadeOut(200, function () { $(this).remove(); });
            window.location.href = 'due-invoice.html';
        });

        if (!isBlocked) {
            $('#smsDueRechargeBtn').off().on('click', function () {
                $('#smsDueNoticeOverlay').fadeOut(200, function () { $(this).remove(); });
                window.location.href = 'sms-recharge.html';
            });
        }
    }

    // Initialize
    $(document).ready(function () {
        initDueNotice();
    });

})();
