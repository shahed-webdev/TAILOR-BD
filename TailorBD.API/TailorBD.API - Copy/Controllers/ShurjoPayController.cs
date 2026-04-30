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

                // ── Update ShurjoPay_Order ────────────────────────────────────
                var newStatus = verify.Success ? "Paid" : (verify.PaymentStatus == "Pending" ? "Pending" : "Failed");
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

                if (!verify.Success)
                {
                    var failMsg = newStatus == "Pending"
                        ? "পেমেন্ট প্রক্রিয়াধীন রয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।"
                        : "পেমেন্ট সম্পন্ন হয়নি। আবার চেষ্টা করুন অথবা যোগাযোগ করুন।";
                    return Ok(new { success = false, paymentStatus = newStatus, message = failMsg });
                }

                // ── Mark invoices as Paid ─────────────────────────────────────
                int    institutionId = (int)order.InstitutionID;
                string invoiceIdsStr = (string)(order.InvoiceIds ?? "");
                var    invoiceIdList = invoiceIdsStr
                    .Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => int.TryParse(s.Trim(), out int v) ? v : 0)
                    .Where(v => v > 0)
                    .ToList();

                using var tx = con.BeginTransaction();
                try
                {
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
                                 'ShurjoPay', @TxId)",
                            new
                            {
                                InvoiceID     = invoiceId,
                                InstitutionID = institutionId,
                                RegistrationID = regId,
                                Amount        = dueAmt,
                                TxId          = verify.SpTxnId
                            }, tx);
                    }

                    tx.Commit();
                }
                catch
                {
                    tx.Rollback();
                    throw;
                }

                _logger.LogInformation("[ShurjoPay] Invoices marked Paid: {ids} for Institution {instId}",
                    invoiceIdsStr, institutionId);

                return Ok(new
                {
                    success       = true,
                    paymentStatus = "Paid",
                    transactionId = verify.SpTxnId,
                    amount        = verify.Amount,
                    message       = "পেমেন্ট সফল হয়েছে।"
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
}
