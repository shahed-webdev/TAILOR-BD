using Dapper;
using Microsoft.AspNetCore.Mvc;
using TailorBD.API.Data;
using TailorBD.API.Services;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ShurjoPayController : ControllerBase
    {
        private readonly TailorBdContext         _context;
        private readonly IShurjoPayService       _shurjoPay;
        private readonly IInvoiceBillingService  _billing;
        private readonly ILogger<ShurjoPayController> _logger;

        public ShurjoPayController(
            TailorBdContext context,
            IShurjoPayService shurjoPay,
            IInvoiceBillingService billing,
            ILogger<ShurjoPayController> logger)
        {
            _context   = context;
            _shurjoPay = shurjoPay;
            _billing   = billing;
            _logger    = logger;
        }

        // ── POST /api/shurjopay/initiate ──────────────────────────────────────────
        /// <summary>
        /// Initiates an online payment for one or more due invoices.
        /// Body: { institutionId, invoiceIds: [1,2,3], customerName, customerPhone, customerEmail?, customerAddress? }
        /// </summary>
        [HttpPost("initiate")]
        public async Task<ActionResult> InitiatePayment([FromBody] SpInitiateRequest req)
        {
            if (req.InstitutionId <= 0)
                return BadRequest(new { success = false, message = "institutionId আবশ্যক।" });
            if (req.InvoiceIds == null || req.InvoiceIds.Count == 0)
                return BadRequest(new { success = false, message = "অন্তত একটি invoice নির্বাচন করুন।" });
            if (string.IsNullOrWhiteSpace(req.CustomerName))
                return BadRequest(new { success = false, message = "customerName আবশ্যক।" });
            if (string.IsNullOrWhiteSpace(req.CustomerPhone))
                return BadRequest(new { success = false, message = "customerPhone আবশ্যক।" });

            try
            {
                using var con = _context.CreateConnection();
                con.Open();

                // ── Load & validate due invoices ──────────────────────────────
                var ids         = string.Join(",", req.InvoiceIds.Select(id => (int)id));
                var invoiceRows = await con.QueryAsync($@"
                    SELECT
                        inv.InvoiceID,
                        CAST(
                            ISNULL(NULLIF(inv.TotalAmount,0),
                                (SELECT ISNULL(SUM(Amount),0) FROM Invoice_Line WHERE InvoiceID=inv.InvoiceID))
                            - ISNULL(inv.PaidAmount,0)
                            - ISNULL(inv.Discount,0)
                        AS FLOAT) AS DueAmount
                    FROM Invoice inv
                    WHERE inv.InvoiceID IN ({ids})
                      AND inv.InstitutionID = @instId
                      AND inv.PaymentStatus <> 'Paid'",
                    new { instId = req.InstitutionId });

                var invoiceList = invoiceRows.ToList();
                if (invoiceList.Count == 0)
                    return BadRequest(new { success = false, message = "কোনো বকেয়া ইনভয়েস পাওয়া যায়নি।" });

                double totalAmount = invoiceList.Sum(r => (double)(r.DueAmount ?? 0.0));
                if (totalAmount <= 0)
                    return BadRequest(new { success = false, message = "মোট বকেয়া পরিমাণ শূন্য।" });

                var mergedIds = string.Join(",", invoiceList.Select(r => (int)r.InvoiceID));

                // ── Call ShurjoPay ────────────────────────────────────────────
                var result = await _shurjoPay.InitiatePaymentAsync(
                    req.InstitutionId,
                    mergedIds,
                    totalAmount,
                    req.CustomerName,
                    req.CustomerEmail  ?? "",
                    req.CustomerPhone,
                    req.CustomerAddress ?? "Bangladesh");

                if (!result.Success)
                    return StatusCode(502, new { success = false, message = result.Message });

                // ── Save order to DB ──────────────────────────────────────────
                await con.ExecuteAsync(@"
                    INSERT INTO ShurjoPay_Order
                        (MerchantOrderId, SpOrderId, InstitutionID, InvoiceIds, TotalAmount, Status, CreatedAt)
                    VALUES
                        (@MerchantOrderId, @SpOrderId, @InstitutionID, @InvoiceIds, @TotalAmount, 'Pending', GETDATE())",
                    new
                    {
                        MerchantOrderId = result.OrderId,
                        SpOrderId       = result.OrderId,
                        InstitutionID   = req.InstitutionId,
                        InvoiceIds      = mergedIds,
                        TotalAmount     = totalAmount
                    });

                _logger.LogInformation("[ShurjoPay] Payment initiated: InstitutionID={id}, Amount={amt}, OrderId={oid}",
                    req.InstitutionId, totalAmount, result.OrderId);

                return Ok(new
                {
                    success     = true,
                    checkoutUrl = result.CheckoutUrl,
                    orderId     = result.OrderId,
                    totalAmount
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[ShurjoPay] InitiatePayment error");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── POST /api/shurjopay/initiate-sms-recharge ────────────────────────────
        /// <summary>
        /// Initiates an instant ShurjoPay payment for SMS recharge.
        /// Body: { institutionId, rechargeSms, perSmsPrice }
        /// On payment success the verify endpoint will add SMS balance.
        /// </summary>
        [HttpPost("initiate-sms-recharge")]
        public async Task<ActionResult> InitiateSmsRecharge([FromBody] SpSmsRechargeRequest req)
        {
            if (req.InstitutionId <= 0)
                return BadRequest(new { success = false, message = "institutionId আবশ্যক।" });
            if (req.RechargeSms < 1)
                return BadRequest(new { success = false, message = "SMS পরিমাণ সঠিক নয়।" });
            if (req.PerSmsPrice <= 0)
                return BadRequest(new { success = false, message = "প্রতি SMS মূল্য সঠিক নয়।" });

            try
            {
                using var con = _context.CreateConnection();
                con.Open();

                // Load institution info for customer details
                var inst = await con.QueryFirstOrDefaultAsync(@"
                    SELECT InstitutionName, Phone, Email, Address
                    FROM Institution WHERE InstitutionID = @id",
                    new { id = req.InstitutionId });

                if (inst == null)
                    return NotFound(new { success = false, message = "প্রতিষ্ঠান পাওয়া যায়নি।" });

                string customerName  = (string)(inst.InstitutionName ?? "TailorBD User");
                string customerPhone = (string)(inst.Phone           ?? "01000000000");
                string customerEmail = (string)(inst.Email           ?? "");
                string customerAddr  = (string)(inst.Address         ?? "Bangladesh");

                double totalAmount = req.RechargeSms * req.PerSmsPrice;

                var result = await _shurjoPay.InitiatePaymentAsync(
                    req.InstitutionId,
                    $"SMS:{req.RechargeSms}",
                    totalAmount,
                    customerName,
                    customerEmail,
                    customerPhone,
                    customerAddr);

                if (!result.Success)
                    return StatusCode(502, new { success = false, message = result.Message });

                await con.ExecuteAsync(@"
                    INSERT INTO ShurjoPay_Order
                        (MerchantOrderId, SpOrderId, InstitutionID, InvoiceIds, TotalAmount, Status, CreatedAt)
                    VALUES
                        (@MerchantOrderId, @SpOrderId, @InstitutionID, @InvoiceIds, @TotalAmount, 'Pending', GETDATE())",
                    new
                    {
                        MerchantOrderId = result.OrderId,
                        SpOrderId       = result.OrderId,
                        InstitutionID   = req.InstitutionId,
                        InvoiceIds      = $"SMS_RECHARGE:{req.RechargeSms}:{req.PerSmsPrice}",
                        TotalAmount     = totalAmount
                    });

                _logger.LogInformation("[ShurjoPay] SMS recharge initiated: InstitutionID={id}, SMS={sms}, Amount={amt}, OrderId={oid}",
                    req.InstitutionId, req.RechargeSms, totalAmount, result.OrderId);

                return Ok(new
                {
                    success     = true,
                    checkoutUrl = result.CheckoutUrl,
                    orderId     = result.OrderId,
                    totalAmount,
                    rechargeSms = req.RechargeSms
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[ShurjoPay] InitiateSmsRecharge error");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── POST /api/shurjopay/verify ────────────────────────────────────────────
        /// <summary>
        /// Verifies payment after redirect from ShurjoPay gateway.
        /// Body: { orderId: "TBDINV-..." }
        /// On success — marks invoices as Paid and inserts payment records.
        /// </summary>
        [HttpPost("verify")]
        public async Task<ActionResult> VerifyPayment([FromBody] SpVerifyRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.OrderId))
                return BadRequest(new { success = false, message = "orderId আবশ্যক।" });

            try
            {
                using var con = _context.CreateConnection();
                con.Open();

                // ── Load order from DB ────────────────────────────────────────
                var order = await con.QueryFirstOrDefaultAsync(@"
                    SELECT Id, MerchantOrderId, SpOrderId, InstitutionID, InvoiceIds,
                           TotalAmount, Status
                    FROM ShurjoPay_Order
                    WHERE MerchantOrderId = @orderId OR SpOrderId = @orderId",
                    new { orderId = req.OrderId });

                if (order == null)
                    return NotFound(new { success = false, message = "Order পাওয়া যায়নি।" });

                string currentStatus = (string)(order.Status ?? "Pending");
                if (currentStatus == "Paid")
                    return Ok(new { success = true, alreadyPaid = true, message = "পেমেন্ট ইতিমধ্যে নিশ্চিত হয়েছে।" });

                // ── Verify with ShurjoPay API ──────────────────────────────────
                var spOrderId = (string)(order.SpOrderId ?? order.MerchantOrderId ?? "");
                var verify = await _shurjoPay.VerifyPaymentAsync(spOrderId);

                _logger.LogInformation("[ShurjoPay] Verify result: OrderId={oid}, Status={st}, Amount={amt}",
                    req.OrderId, verify.PaymentStatus, verify.Amount);

                // ── Update ShurjoPay_Order status for non-success first ──────
                var newStatus = verify.Success ? "Paid"
                    : (verify.PaymentStatus is "Pending" or "pending" ? "Pending" : "Failed");

                if (!verify.Success)
                {
                    await con.ExecuteAsync(@"
                        UPDATE ShurjoPay_Order
                        SET Status        = @Status,
                            TransactionId = @TxId,
                            SpResponse    = @RawJson,
                            UpdatedAt     = GETDATE()
                        WHERE Id = @Id",
                        new
                        {
                            Status  = newStatus,
                            TxId    = verify.SpTxnId,
                            RawJson = verify.RawJson,
                            Id      = (int)order.Id
                        });
                }

                if (!verify.Success)
                {
                    var failMsg = newStatus == "Pending"
                        ? "পেমেন্ট প্রক্রিয়াধীন রয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।"
                        : "পেমেন্ট সম্পন্ন হয়নি। আবার চেষ্টা করুন অথবা যোগাযোগ করুন।";
                    return Ok(new { success = false, paymentStatus = newStatus, message = failMsg });
                }

                // ── Mark invoices as Paid / Apply SMS recharge ───────────────
                int    institutionId = (int)order.InstitutionID;
                string invoiceIdsStr = (string)(order.InvoiceIds ?? "");

                using var tx = con.BeginTransaction();
                try
                {
                    // Mark order as Paid FIRST (inside transaction) to prevent duplicate processing
                    int updated = await con.ExecuteAsync(@"
                        UPDATE ShurjoPay_Order
                        SET Status        = 'Paid',
                            TransactionId = @TxId,
                            SpResponse    = @RawJson,
                            UpdatedAt     = GETDATE()
                        WHERE Id = @Id AND Status <> 'Paid'",
                        new
                        {
                            TxId    = verify.SpTxnId,
                            RawJson = verify.RawJson,
                            Id      = (int)order.Id
                        }, tx);

                    // If 0 rows updated → already processed by a previous duplicate call
                    if (updated == 0)
                    {
                        tx.Rollback();
                        _logger.LogWarning("[ShurjoPay] Duplicate verify call ignored for OrderId={oid}", req.OrderId);
                        bool isSmsRechargeDup = invoiceIdsStr.StartsWith("SMS_RECHARGE:", StringComparison.OrdinalIgnoreCase);
                        int  dupSms = 0;
                        if (isSmsRechargeDup) { var pp = invoiceIdsStr.Split(':'); int.TryParse(pp.Length > 1 ? pp[1] : "0", out dupSms); }
                        return Ok(new { success = true, alreadyPaid = true, paymentStatus = "Paid",
                            transactionId = verify.SpTxnId, isSmsRecharge = isSmsRechargeDup, rechargedSms = dupSms,
                            message = isSmsRechargeDup ? $"{dupSms} পিস SMS আপনার ব্যালেন্সে যোগ হয়েছে।" : "পেমেন্ট ইতিমধ্যে নিশ্চিত হয়েছে।" });
                    }

                    // Check if this is an SMS recharge order
                    if (invoiceIdsStr.StartsWith("SMS_RECHARGE:", StringComparison.OrdinalIgnoreCase))
                    {
                        // Format: SMS_RECHARGE:{qty}:{perPrice}
                        var parts       = invoiceIdsStr.Split(':');
                        int rechargeSms = parts.Length > 1 && int.TryParse(parts[1], out int q) ? q : 0;
                        double perPrice = parts.Length > 2 && double.TryParse(parts[2], System.Globalization.NumberStyles.Any,
                            System.Globalization.CultureInfo.InvariantCulture, out double p) ? p : 0;
                        double totalAmt = rechargeSms * perPrice;

                        if (rechargeSms > 0)
                        {
                            // 1) Add SMS balance
                            await con.ExecuteAsync(@"
                                UPDATE SMS SET SMS_Balance = SMS_Balance + @qty WHERE InstitutionID = @instId",
                                new { qty = rechargeSms, instId = institutionId }, tx);

                            // 2) Record the recharge
                            await con.ExecuteAsync(@"
                                INSERT INTO SMS_Recharge_Record (InstitutionID, RechargeSMS, PerSMS_Price, Date)
                                VALUES (@InstitutionID, @RechargeSMS, @PerSMS_Price, GETDATE())",
                                new
                                {
                                    InstitutionID = institutionId,
                                    RechargeSMS   = rechargeSms,
                                    PerSMS_Price  = perPrice
                                }, tx);

                            // 3) Create Invoice for billing record
                            string invoiceFor = $"SMS Recharge | {rechargeSms} pcs @ ৳{perPrice}";
                            var invoiceId = await con.ExecuteScalarAsync<int>(@"
                                INSERT INTO Invoice
                                    (InstitutionID, IssuDate, EndDate, Invoice_For, TotalAmount, PaidAmount, Discount,
                                     PaymentStatus, CreateDate)
                                VALUES
                                    (@InstID, GETDATE(), GETDATE(), @InvoiceFor, @Total, @Total, 0,
                                     'Paid', GETDATE());
                                SELECT CAST(SCOPE_IDENTITY() AS INT);",
                                new { InstID = institutionId, InvoiceFor = invoiceFor, Total = totalAmt }, tx);

                            // 4) Create Invoice_Line
                            await con.ExecuteAsync(@"
                                INSERT INTO Invoice_Line
                                    (InvoiceID, InstitutionID, Details, Amount)
                                VALUES
                                    (@InvID, @InstID, @Desc, @Amount)",
                                new
                                {
                                    InvID  = invoiceId,
                                    InstID = institutionId,
                                    Desc   = $"SMS Recharge | {rechargeSms} pcs @ ৳{perPrice}",
                                    Amount = totalAmt
                                }, tx);

                            // 5) Create Invoice_Payment_Record
                            await con.ExecuteAsync(@"
                                INSERT INTO Invoice_Payment_Record
                                    (InvoiceID, InstitutionID, RegistrationID, Amount, PaidDate,
                                     Collected_By, Payment_Method)
                                VALUES
                                    (@InvID, @InstID, NULL, @Amount, GETDATE(),
                                     'IT Genius', 'Online Payment')",
                                new
                                {
                                    InvID  = invoiceId,
                                    InstID = institutionId,
                                    Amount = totalAmt
                                }, tx);

                            _logger.LogInformation("[ShurjoPay] SMS Recharge applied: InstitutionID={id}, SMS={sms}, InvoiceID={inv}, TxId={tx}",
                                institutionId, rechargeSms, invoiceId, verify.SpTxnId);
                        }
                    }
                    else
                    {
                        // Regular invoice payment
                        var invoiceIdList = invoiceIdsStr
                            .Split(',', StringSplitOptions.RemoveEmptyEntries)
                            .Select(s => int.TryParse(s.Trim(), out int v) ? v : 0)
                            .Where(v => v > 0)
                            .ToList();

                        foreach (var invoiceId in invoiceIdList)
                        {
                            var invRow = await con.QueryFirstOrDefaultAsync(@"
                                SELECT inv.InvoiceID, inv.RegistrationID,
                                       ISNULL(NULLIF(inv.TotalAmount,0),
                                           (SELECT ISNULL(SUM(Amount),0) FROM Invoice_Line WHERE InvoiceID=inv.InvoiceID)
                                       ) AS TotalAmount,
                                       ISNULL(inv.Discount,0) AS Discount
                                FROM Invoice inv WHERE inv.InvoiceID = @id",
                                new { id = invoiceId }, tx);

                            if (invRow == null) continue;

                            double total    = invRow.TotalAmount == null ? 0.0 : Convert.ToDouble(invRow.TotalAmount);
                            double discount = invRow.Discount    == null ? 0.0 : Convert.ToDouble(invRow.Discount);
                            double dueAmt   = Math.Max(0, total - discount);
                            int    regId    = invRow.RegistrationID == null ? 0 : (int)invRow.RegistrationID;

                            await con.ExecuteAsync(@"
                                UPDATE Invoice
                                SET PaidAmount    = @PaidAmount,
                                    PaymentStatus = 'Paid'
                                WHERE InvoiceID   = @id",
                                new { PaidAmount = dueAmt, id = invoiceId }, tx);

                            await con.ExecuteAsync(@"
                                INSERT INTO Invoice_Payment_Record
                                    (InvoiceID, InstitutionID, RegistrationID, Amount, PaidDate,
                                     Collected_By, Payment_Method)
                                VALUES
                                    (@InvoiceID, @InstitutionID, @RegistrationID, @Amount, GETDATE(),
                                     'IT Genius', 'Online Payment')",
                                new
                                {
                                    InvoiceID      = invoiceId,
                                    InstitutionID  = institutionId,
                                    RegistrationID = regId,
                                    Amount         = dueAmt
                                }, tx);
                        }
                    }

                    tx.Commit();
                }
                catch
                {
                    tx.Rollback();
                    throw;
                }

                _logger.LogInformation("[ShurjoPay] Invoices marked Paid / SMS recharged: {ids} for Institution {instId}",
                    invoiceIdsStr, institutionId);

                // Determine if this was an SMS recharge for the response
                bool isSmsRecharge = invoiceIdsStr.StartsWith("SMS_RECHARGE:", StringComparison.OrdinalIgnoreCase);
                int  rechargedSms  = 0;
                if (isSmsRecharge)
                {
                    var p = invoiceIdsStr.Split(':');
                    int.TryParse(p.Length > 1 ? p[1] : "0", out rechargedSms);
                }

                return Ok(new
                {
                    success       = true,
                    paymentStatus = "Paid",
                    transactionId = verify.SpTxnId,
                    amount        = verify.Amount,
                    isSmsRecharge,
                    rechargedSms,
                    message       = isSmsRecharge
                        ? $"{rechargedSms} পিস SMS আপনার ব্যালেন্সে যোগ হয়েছে।"
                        : "পেমেন্ট সফল হয়েছে।"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[ShurjoPay] VerifyPayment error for orderId={oid}", req.OrderId);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── GET /api/shurjopay/status/{orderId} ───────────────────────────────────
        /// <summary>Returns the current status of a ShurjoPay order from local DB.</summary>
        [HttpGet("status/{orderId}")]
        public async Task<ActionResult> GetOrderStatus(string orderId)
        {
            try
            {
                using var con = _context.CreateConnection();
                con.Open();
                var order = await con.QueryFirstOrDefaultAsync(@"
                    SELECT MerchantOrderId, SpOrderId, InstitutionID, InvoiceIds,
                           TotalAmount, Status, TransactionId, CreatedAt, UpdatedAt
                    FROM ShurjoPay_Order
                    WHERE MerchantOrderId = @orderId OR SpOrderId = @orderId",
                    new { orderId });

                if (order == null)
                    return NotFound(new { success = false, message = "Order পাওয়া যায়নি।" });

                return Ok(new
                {
                    success         = true,
                    merchantOrderId = (string)(order.MerchantOrderId ?? ""),
                    spOrderId       = (string)(order.SpOrderId       ?? ""),
                    status          = (string)(order.Status          ?? ""),
                    totalAmount     = order.TotalAmount == null ? 0.0 : Convert.ToDouble(order.TotalAmount),
                    transactionId   = (string)(order.TransactionId   ?? ""),
                    createdAt       = order.CreatedAt == null ? (DateTime?)null : (DateTime)order.CreatedAt,
                    updatedAt       = order.UpdatedAt == null ? (DateTime?)null : (DateTime)order.UpdatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[ShurjoPay] GetOrderStatus error");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }

    // ── Request Models ────────────────────────────────────────────────────────────
    public class SpInitiateRequest
    {
        public int          InstitutionId   { get; set; }
        public List<int>    InvoiceIds      { get; set; } = new();
        public string       CustomerName    { get; set; } = "";
        public string       CustomerPhone   { get; set; } = "";
        public string?      CustomerEmail   { get; set; }
        public string?      CustomerAddress { get; set; }
    }

    public class SpVerifyRequest
    {
        public string OrderId { get; set; } = "";
    }

    public class SpSmsRechargeRequest
    {
        public int    InstitutionId { get; set; }
        public int    RechargeSms   { get; set; }
        public double PerSmsPrice   { get; set; }
    }
}
