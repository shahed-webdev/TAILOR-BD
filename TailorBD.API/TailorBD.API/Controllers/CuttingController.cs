using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TailorBD.API.Data;
using TailorBD.API.Helpers;
using TailorBD.API.Services;
using Dapper;

namespace TailorBD.API.Controllers
{
    // Login required; InstitutionID / RegistrationID always come from the caller's token
    // (ShopScoped overwrites any value sent in the query string or body), so a shop can
    // only read or change its own masters, cutting issues and worker payments.
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    [ShopScoped]
    [ShopPage("/cutting-issue.html")] // Shop Page Access: 403 when the Authority switched this page off for the shop
    public class CuttingController : ControllerBase
    {
        private readonly TailorBdContext _context;
        private readonly INovocomSmsService _smsService;
        public CuttingController(TailorBdContext context, INovocomSmsService smsService)
        {
            _context = context;
            _smsService = smsService;
        }

        // ── Masters ──────────────────────────────────────────────────────────
        [ShopPage("/cutting-issue.html", "/factory-issue.html", "/worker-payments.html")] // worker list / pay: used by all three pages
        [HttpGet("masters")]
        public IActionResult GetMasters(int institutionId, bool activeOnly = false)
        {
            try
            {
                using var con = _context.CreateConnection();
                var sql = @"
                    SELECT CuttingMasterID, Name, Phone, IsActive,
                           ISNULL(Balance,0) AS Balance,
                           CONVERT(varchar(10), CreatedDate, 23) AS CreatedDate
                    FROM CuttingMaster
                    WHERE InstitutionID=@InstitutionID
                      AND (@ActiveOnly=0 OR IsActive=1)
                    ORDER BY Name";
                var data = con.Query(sql, new { InstitutionID = institutionId, ActiveOnly = activeOnly ? 1 : 0 });
                return Ok(new { success = true, data });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [ShopPage("/cutting-issue.html", "/factory-issue.html", "/worker-payments.html")] // worker list / pay: used by all three pages
        [HttpPost("masters")]
        public IActionResult AddMaster([FromBody] CuttingMasterModel m)
        {
            try
            {
                if (m.InstitutionID <= 0 || string.IsNullOrWhiteSpace(m.Name))
                    return BadRequest(new { success = false, message = "Name and institution required" });
                using var con = _context.CreateConnection();
                var id = con.ExecuteScalar<int>(@"
                    INSERT INTO CuttingMaster (InstitutionID, RegistrationID, Name, Phone, IsActive)
                    VALUES (@InstitutionID, @RegistrationID, @Name, @Phone, 1);
                    SELECT CAST(SCOPE_IDENTITY() AS INT);",
                    new { m.InstitutionID, m.RegistrationID, Name = m.Name.Trim(), Phone = m.Phone });
                return Ok(new { success = true, cuttingMasterId = id });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // Bulk add of cutting masters from an Excel/CSV upload (rows parsed in the browser).
        // Same insert as the one-by-one POST; see Services/WorkerBulkImport.cs.
        [ShopPage("/cutting-issue.html", "/factory-issue.html", "/worker-payments.html")] // worker list / pay: used by all three pages
        [HttpPost("masters/bulk")]
        [RequestSizeLimit(2_000_000)]
        public IActionResult AddMastersBulk([FromBody] WorkerBulkRequest m)
        {
            try
            {
                if (m == null || m.InstitutionID <= 0)
                    return BadRequest(new { success = false, message = "Institution required" });
                if (m.Rows == null || m.Rows.Count == 0)
                    return BadRequest(new { success = false, message = "No rows" });
                if (m.Rows.Count > WorkerBulkImport.MaxRows)
                    return BadRequest(new { success = false, message = $"At most {WorkerBulkImport.MaxRows} rows per upload" });
                using var con = _context.CreateConnection();
                return Ok(WorkerBulkImport.Import(con, WorkerTable.CuttingMaster, m, _smsService.NormalizePhone));
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [ShopPage("/cutting-issue.html", "/factory-issue.html", "/worker-payments.html")] // worker list / pay: used by all three pages
        [HttpPut("masters")]
        public IActionResult UpdateMaster([FromBody] CuttingMasterUpdateModel m)
        {
            try
            {
                using var con = _context.CreateConnection();
                var n = con.Execute(@"
                    UPDATE CuttingMaster
                    SET Name=@Name, Phone=@Phone, IsActive=@IsActive
                    WHERE CuttingMasterID=@CuttingMasterID AND InstitutionID=@InstitutionID",
                    new { m.CuttingMasterID, m.InstitutionID, Name = m.Name.Trim(), m.Phone, m.IsActive });
                if (n == 0) return NotFound(new { success = false, message = "কাটিং মাস্টার পাওয়া যায়নি / Cutting master not found" });
                return Ok(new { success = true });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [ShopPage("/cutting-issue.html", "/factory-issue.html", "/worker-payments.html")] // worker list / pay: used by all three pages
        [HttpDelete("masters")]
        public IActionResult DeleteMaster(int cuttingMasterId, int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var inUse = con.ExecuteScalar<int>(
                    "SELECT COUNT(1) FROM CuttingIssue WHERE CuttingMasterID=@Id AND InstitutionID=@InstitutionID",
                    new { Id = cuttingMasterId, InstitutionID = institutionId });
                if (inUse > 0)
                {
                    con.Execute("UPDATE CuttingMaster SET IsActive=0 WHERE CuttingMasterID=@Id AND InstitutionID=@InstitutionID",
                        new { Id = cuttingMasterId, InstitutionID = institutionId });
                    return Ok(new { success = true, deactivated = true });
                }
                var n = con.Execute("DELETE FROM CuttingMaster WHERE CuttingMasterID=@Id AND InstitutionID=@InstitutionID",
                    new { Id = cuttingMasterId, InstitutionID = institutionId });
                if (n == 0) return NotFound(new { success = false, message = "কাটিং মাস্টার পাওয়া যায়নি / Cutting master not found" });
                return Ok(new { success = true });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }


/// <summary>All worker payments with filters (CuttingMaster / Artisan).</summary>
        [ShopPage("/worker-payments.html")]
        [HttpGet("worker-payments")]
        public IActionResult GetWorkerPayments(
            int institutionId,
            string? workerType = null,
            int? workerId = null,
            string? dateFrom = null,
            string? dateTo = null,
            string? search = null,
            int page = 1,
            int pageSize = 50)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize <= 0 || pageSize > 200) pageSize = 50;
                using var con = _context.CreateConnection();
                var p = new
                {
                    InstitutionID = institutionId,
                    WorkerType = string.IsNullOrWhiteSpace(workerType) ? null : workerType.Trim(),
                    WorkerId = workerId,
                    DateFrom = string.IsNullOrWhiteSpace(dateFrom) ? (DateTime?)null : DateTime.Parse(dateFrom),
                    DateTo = string.IsNullOrWhiteSpace(dateTo) ? (DateTime?)null : DateTime.Parse(dateTo),
                    Search = string.IsNullOrWhiteSpace(search) ? null : "%" + search.Trim() + "%",
                    Skip = (page - 1) * pageSize,
                    Take = pageSize
                };
                var total = con.ExecuteScalar<int>(@"
                    SELECT COUNT(1)
                    FROM WorkerPayment WP
                    LEFT JOIN CuttingMaster CM ON WP.WorkerType=N'CuttingMaster' AND WP.WorkerID=CM.CuttingMasterID AND CM.InstitutionID=WP.InstitutionID
                    LEFT JOIN Artisan A ON WP.WorkerType=N'Artisan' AND WP.WorkerID=A.ArtisanID AND A.InstitutionID=WP.InstitutionID
                    WHERE WP.InstitutionID=@InstitutionID
                      AND (@WorkerType IS NULL OR WP.WorkerType=@WorkerType)
                      AND (@WorkerId IS NULL OR WP.WorkerID=@WorkerId)
                      AND (@DateFrom IS NULL OR WP.PaymentDate >= @DateFrom)
                      AND (@DateTo IS NULL OR WP.PaymentDate < DATEADD(day, 1, @DateTo))
                      AND (@Search IS NULL OR ISNULL(CM.Name,A.Name) LIKE @Search OR ISNULL(WP.Notes,'') LIKE @Search OR ISNULL(WP.OtpCode,'') LIKE @Search)", p);
                var data = con.Query(@"
                    SELECT WP.WorkerPaymentID, WP.WorkerType, WP.WorkerID, WP.Amount, WP.Notes, WP.OtpCode,
                           CONVERT(varchar(16), WP.PaymentDate, 120) AS PaymentDate,
                           CASE WHEN WP.WorkerType=N'CuttingMaster' THEN CM.Name ELSE A.Name END AS WorkerName,
                           CASE WHEN WP.WorkerType=N'CuttingMaster' THEN CM.Phone ELSE A.Phone END AS WorkerPhone
                    FROM WorkerPayment WP
                    LEFT JOIN CuttingMaster CM ON WP.WorkerType=N'CuttingMaster' AND WP.WorkerID=CM.CuttingMasterID AND CM.InstitutionID=WP.InstitutionID
                    LEFT JOIN Artisan A ON WP.WorkerType=N'Artisan' AND WP.WorkerID=A.ArtisanID AND A.InstitutionID=WP.InstitutionID
                    WHERE WP.InstitutionID=@InstitutionID
                      AND (@WorkerType IS NULL OR WP.WorkerType=@WorkerType)
                      AND (@WorkerId IS NULL OR WP.WorkerID=@WorkerId)
                      AND (@DateFrom IS NULL OR WP.PaymentDate >= @DateFrom)
                      AND (@DateTo IS NULL OR WP.PaymentDate < DATEADD(day, 1, @DateTo))
                      AND (@Search IS NULL OR ISNULL(CM.Name,A.Name) LIKE @Search OR ISNULL(WP.Notes,'') LIKE @Search OR ISNULL(WP.OtpCode,'') LIKE @Search)
                    ORDER BY WP.PaymentDate DESC, WP.WorkerPaymentID DESC
                    OFFSET @Skip ROWS FETCH NEXT @Take ROWS ONLY", p);
                var sumAmt = con.ExecuteScalar<decimal>(@"
                    SELECT ISNULL(SUM(WP.Amount),0)
                    FROM WorkerPayment WP
                    LEFT JOIN CuttingMaster CM ON WP.WorkerType=N'CuttingMaster' AND WP.WorkerID=CM.CuttingMasterID AND CM.InstitutionID=WP.InstitutionID
                    LEFT JOIN Artisan A ON WP.WorkerType=N'Artisan' AND WP.WorkerID=A.ArtisanID AND A.InstitutionID=WP.InstitutionID
                    WHERE WP.InstitutionID=@InstitutionID
                      AND (@WorkerType IS NULL OR WP.WorkerType=@WorkerType)
                      AND (@WorkerId IS NULL OR WP.WorkerID=@WorkerId)
                      AND (@DateFrom IS NULL OR WP.PaymentDate >= @DateFrom)
                      AND (@DateTo IS NULL OR WP.PaymentDate < DATEADD(day, 1, @DateTo))
                      AND (@Search IS NULL OR ISNULL(CM.Name,A.Name) LIKE @Search OR ISNULL(WP.Notes,'') LIKE @Search OR ISNULL(WP.OtpCode,'') LIKE @Search)", p);
                return Ok(new { success = true, data, total, page, pageSize, totalAmount = sumAmt });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ── Master balance & payments ────────────────────────────────────────
        [ShopPage("/cutting-issue.html", "/factory-issue.html", "/worker-payments.html")] // worker list / pay: used by all three pages
        [HttpGet("masters/{id}/balance")]
        public IActionResult GetMasterBalance(int id, int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var bal = con.QueryFirstOrDefault<decimal?>(
                    @"SELECT ISNULL(Balance,0) FROM CuttingMaster
                      WHERE CuttingMasterID=@Id AND InstitutionID=@InstitutionID",
                    new { Id = id, InstitutionID = institutionId });
                if (bal == null)
                    return NotFound(new { success = false, message = "Cutting master not found" });
                return Ok(new { success = true, balance = bal.Value });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [ShopPage("/cutting-issue.html", "/factory-issue.html", "/worker-payments.html")] // worker list / pay: used by all three pages
        [HttpGet("masters/{id}/payments")]
        public IActionResult GetMasterPayments(int id, int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var exists = con.ExecuteScalar<int>(
                    "SELECT COUNT(1) FROM CuttingMaster WHERE CuttingMasterID=@Id AND InstitutionID=@InstitutionID",
                    new { Id = id, InstitutionID = institutionId });
                if (exists == 0)
                    return NotFound(new { success = false, message = "Cutting master not found" });

                var data = con.Query(@"
                    SELECT WorkerPaymentID, Amount,
                           CONVERT(varchar(16), PaymentDate, 120) AS PaymentDate,
                           Notes, RegistrationID, OtpCode
                    FROM WorkerPayment
                    WHERE InstitutionID=@InstitutionID
                      AND WorkerType=N'CuttingMaster'
                      AND WorkerID=@Id
                    ORDER BY PaymentDate DESC, WorkerPaymentID DESC",
                    new { InstitutionID = institutionId, Id = id });
                return Ok(new { success = true, data });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [ShopPage("/cutting-issue.html", "/factory-issue.html", "/worker-payments.html")] // worker list / pay: used by all three pages
        [HttpPost("masters/send-otp")]
        public async Task<IActionResult> SendMasterPayOtp([FromBody] WorkerPayOtpRequest m)
        {
            try
            {
                if (m.InstitutionID <= 0 || m.WorkerID <= 0 || m.Amount <= 0)
                    return BadRequest(new { success = false, message = "Invalid request" });

                using var con = _context.CreateConnection();
                var worker = con.QueryFirstOrDefault(@"
                    SELECT CuttingMasterID AS WorkerKey, Name, Phone, ISNULL(Balance,0) AS Balance
                    FROM CuttingMaster
                    WHERE CuttingMasterID=@Id AND InstitutionID=@InstitutionID",
                    new { Id = m.WorkerID, InstitutionID = m.InstitutionID });
                if (worker == null)
                    return BadRequest(new { success = false, message = "Cutting master not found" });
                // Amount may exceed the balance: the excess is an advance (Balance < 0), offset by later earnings.

                string phone = (worker.Phone ?? "").ToString().Trim();
                if (string.IsNullOrWhiteSpace(phone) || !_smsService.IsValidBdNumber(phone))
                    return BadRequest(new { success = false, message = "Valid mobile required on worker profile" });

                var smsInfo = con.QueryFirstOrDefault(
                    "SELECT SMS_Balance, Masking FROM SMS WHERE InstitutionID=@IID",
                    new { IID = m.InstitutionID });
                if (smsInfo == null)
                    return BadRequest(new { success = false, message = "SMS settings not found" });
                string masking = (string?)(smsInfo.Masking) ?? "";
                string otp = new Random().Next(100000, 999999).ToString();
                string msg = "TailorBD Payment OTP: " + otp + ". Amount: " + m.Amount.ToString("0.00") + ". Valid 5 min.";
                int smsCount = _smsService.CalculateSmsCount(msg);
                if ((int)smsInfo.SMS_Balance < smsCount)
                    return BadRequest(new { success = false, message = "Insufficient SMS balance" });

                var result = await _smsService.SendAsync(phone, msg, masking);
                if (!result.Success)
                    return BadRequest(new { success = false, message = result.ErrorMessage ?? result.Response ?? "OTP SMS failed" });

                con.Execute(@"DELETE FROM WorkerPaymentOtp
                    WHERE InstitutionID=@InstitutionID AND WorkerType=N'CuttingMaster' AND WorkerID=@WorkerID",
                    new { m.InstitutionID, m.WorkerID });
                con.Execute(@"INSERT INTO WorkerPaymentOtp
                    (InstitutionID, WorkerType, WorkerID, OtpCode, Amount, Phone, ExpiresAt)
                    VALUES (@InstitutionID, N'CuttingMaster', @WorkerID, @Otp, @Amount, @Phone, DATEADD(minute, 5, GETDATE()))",
                    new { m.InstitutionID, m.WorkerID, Otp = otp, m.Amount, Phone = phone });
                con.Execute(@"UPDATE SMS SET SMS_Balance = SMS_Balance - @Cnt
                    WHERE InstitutionID=@IID AND SMS_Balance >= @Cnt",
                    new { IID = m.InstitutionID, Cnt = smsCount });

                var masked = phone.Length >= 4 ? ("****" + phone.Substring(phone.Length - 4)) : "****";
                return Ok(new { success = true, message = "OTP sent", phoneMasked = masked, expiresInMinutes = 5 });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [ShopPage("/cutting-issue.html", "/factory-issue.html", "/worker-payments.html")] // worker list / pay: used by all three pages
        [HttpPost("masters/pay")]
        public IActionResult PayMaster([FromBody] WorkerPayModel m)
        {
            try
            {
                if (m.InstitutionID <= 0 || m.WorkerID <= 0 || m.Amount <= 0)
                    return BadRequest(new { success = false, message = "Invalid payment request" });
                if (string.IsNullOrWhiteSpace(m.Otp))
                    return BadRequest(new { success = false, message = "OTP required" });

                using var con = _context.CreateConnection();
                con.Open();
                using var tx = con.BeginTransaction();

                var otpRow = con.QueryFirstOrDefault(@"
                    SELECT TOP 1 WorkerPaymentOtpID, OtpCode, Amount
                    FROM WorkerPaymentOtp
                    WHERE InstitutionID=@InstitutionID AND WorkerType=N'CuttingMaster'
                      AND WorkerID=@WorkerID AND ExpiresAt >= GETDATE()
                    ORDER BY WorkerPaymentOtpID DESC",
                    new { m.InstitutionID, m.WorkerID }, tx);
                if (otpRow == null)
                    return BadRequest(new { success = false, message = "OTP expired or not sent" });
                if (!string.Equals((string)otpRow.OtpCode, m.Otp.Trim(), StringComparison.Ordinal))
                    return BadRequest(new { success = false, message = "Invalid OTP" });
                if (Math.Abs((decimal)otpRow.Amount - m.Amount) > 0.009m)
                    return BadRequest(new { success = false, message = "Amount mismatch with OTP request" });

                var balance = con.QueryFirstOrDefault<decimal?>(
                    @"SELECT ISNULL(Balance,0) FROM CuttingMaster
                      WHERE CuttingMasterID=@Id AND InstitutionID=@InstitutionID",
                    new { Id = m.WorkerID, InstitutionID = m.InstitutionID }, tx);
                if (balance == null)
                    return BadRequest(new { success = false, message = "Cutting master not found" });
                // no balance cap: paying more than the balance = advance (অগ্রিম), Balance goes negative

                string otpUsed = m.Otp.Trim();
                con.Execute(@"
                    UPDATE CuttingMaster SET Balance = ISNULL(Balance,0) - @Amount
                    WHERE CuttingMasterID=@WorkerID AND InstitutionID=@InstitutionID",
                    new { m.Amount, m.WorkerID, m.InstitutionID }, tx);

                con.Execute(@"
                    INSERT INTO WorkerPayment
                        (InstitutionID, RegistrationID, WorkerType, WorkerID, Amount, Notes, OtpCode)
                    VALUES
                        (@InstitutionID, @RegistrationID, N'CuttingMaster', @WorkerID, @Amount, @Notes, @OtpCode)",
                    new { m.InstitutionID, m.RegistrationID, m.WorkerID, m.Amount, Notes = m.Notes, OtpCode = otpUsed }, tx);

                con.Execute(@"DELETE FROM WorkerPaymentOtp
                    WHERE InstitutionID=@InstitutionID AND WorkerType=N'CuttingMaster' AND WorkerID=@WorkerID",
                    new { m.InstitutionID, m.WorkerID }, tx);

                tx.Commit();
                decimal newBalance = balance.Value - m.Amount;
                return Ok(new { success = true, newBalance, advance = Math.Max(-newBalance, 0), otp = otpUsed });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ── Eligible order lines (no cutting issue yet; incomplete work) ─────

        [HttpGet("eligible")]
        public IActionResult GetEligible(int institutionId, string? search = null, int page = 1, int pageSize = 50)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize <= 0 || pageSize > 100) pageSize = 50;
                // exact order number (whole data set, all its pending dresses) or name text; see OrderSearch.ParsePending
                var ps = OrderSearch.ParsePending(search);
                if (ps.Invalid)
                    return Ok(new { success = true, data = Array.Empty<object>(), total = 0, page = 1, pageSize, mode = ps.Mode });
                using var con = _context.CreateConnection();
                var total = con.ExecuteScalar<int>(@"
                    SELECT COUNT(1)
                    FROM [Order] O WITH (NOLOCK)
                    INNER JOIN OrderList OL WITH (NOLOCK)
                        ON OL.OrderID = O.OrderID AND OL.InstitutionID = O.InstitutionID
                    INNER JOIN Customer C WITH (NOLOCK) ON O.CustomerID = C.CustomerID
                    INNER JOIN Dress D WITH (NOLOCK) ON OL.DressID = D.DressID
                    LEFT JOIN CuttingIssue CI WITH (NOLOCK)
                        ON CI.OrderListID = OL.OrderListID AND CI.InstitutionID = OL.InstitutionID
                    WHERE O.InstitutionID = @InstitutionID
                      AND O.WorkStatus IN (N'incomplete', N'PartlyCompleted')
                      AND (OL.DressQuantity - ISNULL(OL.WorkCompleteQuantity, 0)) > 0
                      AND CI.CuttingIssueID IS NULL
                      AND (@OrderSn IS NULL OR O.OrderSerialNumber = @OrderSn)
                      AND (@NameLike IS NULL OR C.CustomerName LIKE @NameLike OR D.Dress_Name LIKE @NameLike)",
                    new { InstitutionID = institutionId, ps.OrderSn, ps.NameLike });
                if (ps.OrderSn != null) { page = 1; pageSize = Math.Min(Math.Max(pageSize, total), 500); }   // one order: every line on one page

                var data = con.Query(@"
                    SELECT
                        O.OrderID,
                        O.OrderSerialNumber,
                        CONVERT(varchar(10), O.OrderDate, 23) AS OrderDate,
                        CONVERT(varchar(10), O.DeliveryDate, 23) AS DeliveryDate,
                        C.CustomerName,
                        C.Phone AS CustomerPhone,
                        OL.OrderListID,
                        OL.OrderList_SN,
                        D.Dress_Name AS DressName,
                        OL.DressQuantity AS Quantity,
                        ISNULL(OL.WorkCompleteQuantity, 0) AS WorkCompleteQuantity
                    FROM [Order] O WITH (NOLOCK)
                    INNER JOIN OrderList OL WITH (NOLOCK)
                        ON OL.OrderID = O.OrderID AND OL.InstitutionID = O.InstitutionID
                    INNER JOIN Customer C WITH (NOLOCK) ON O.CustomerID = C.CustomerID
                    INNER JOIN Dress D WITH (NOLOCK) ON OL.DressID = D.DressID
                    LEFT JOIN CuttingIssue CI WITH (NOLOCK)
                        ON CI.OrderListID = OL.OrderListID AND CI.InstitutionID = OL.InstitutionID
                    WHERE O.InstitutionID = @InstitutionID
                      AND O.WorkStatus IN (N'incomplete', N'PartlyCompleted')
                      AND (OL.DressQuantity - ISNULL(OL.WorkCompleteQuantity, 0)) > 0
                      AND CI.CuttingIssueID IS NULL
                      AND (@OrderSn IS NULL OR O.OrderSerialNumber = @OrderSn)
                      AND (@NameLike IS NULL OR C.CustomerName LIKE @NameLike OR D.Dress_Name LIKE @NameLike)
                    ORDER BY O.OrderID DESC, OL.OrderList_SN
                    OFFSET @Skip ROWS FETCH NEXT @Take ROWS ONLY",
                    new
                    {
                        InstitutionID = institutionId,
                        ps.OrderSn,
                        ps.NameLike,
                        Skip = (page - 1) * pageSize,
                        Take = pageSize
                    });
                // nothing pending for that order number: tell the page whether the order exists at all (already cutting-issued / work done)
                bool? orderExists = ps.OrderSn != null && total == 0
                    ? con.ExecuteScalar<int>("SELECT COUNT(1) FROM [Order] WITH (NOLOCK) WHERE InstitutionID = @InstitutionID AND OrderSerialNumber = @OrderSn",
                                             new { InstitutionID = institutionId, ps.OrderSn }) > 0
                    : null;
                return Ok(new { success = true, data, total, page, pageSize, mode = ps.Mode, orderExists });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }



        // ── Issue (assign) ───────────────────────────────────────────────────
        [HttpPost("issue")]
        public IActionResult Issue([FromBody] CuttingIssueCreateModel m)
        {
            try
            {
                if (m.InstitutionID <= 0 || m.OrderListID <= 0 || m.CuttingMasterID <= 0)
                    return BadRequest(new { success = false, message = "Invalid request" });

                using var con = _context.CreateConnection();

                var masterOk = con.ExecuteScalar<int>(
                    "SELECT COUNT(1) FROM CuttingMaster WHERE CuttingMasterID=@Id AND InstitutionID=@InstitutionID AND IsActive=1",
                    new { Id = m.CuttingMasterID, InstitutionID = m.InstitutionID });
                if (masterOk == 0)
                    return BadRequest(new { success = false, message = "Cutting master not found or inactive" });

                var line = con.QueryFirstOrDefault(@"
                    SELECT OL.OrderID, OL.OrderListID, OL.DressQuantity,
                           ISNULL(OL.WorkCompleteQuantity,0) AS WorkCompleteQuantity
                    FROM OrderList OL
                    INNER JOIN [Order] O ON OL.OrderID=O.OrderID
                    WHERE OL.OrderListID=@OrderListID AND OL.InstitutionID=@InstitutionID
                      AND O.WorkStatus IN (N'incomplete', N'PartlyCompleted')",
                    new { m.OrderListID, m.InstitutionID });
                if (line == null)
                    return BadRequest(new { success = false, message = "Order dress line not found or already completed" });

                int remaining = (int)line.DressQuantity - (int)line.WorkCompleteQuantity;
                if (remaining <= 0)
                    return BadRequest(new { success = false, message = "No remaining quantity" });

                var exists = con.ExecuteScalar<int>(
                    "SELECT COUNT(1) FROM CuttingIssue WHERE InstitutionID=@InstitutionID AND OrderListID=@OrderListID",
                    new { m.InstitutionID, m.OrderListID });
                if (exists > 0)
                    return BadRequest(new { success = false, message = "Already cutting-issued" });

                int qty = m.Quantity > 0 ? Math.Min(m.Quantity, remaining) : remaining;
                var id = con.ExecuteScalar<int>(@"
                    INSERT INTO CuttingIssue
                        (InstitutionID, RegistrationID, OrderID, OrderListID, CuttingMasterID, Quantity, Status, Notes)
                    VALUES
                        (@InstitutionID, @RegistrationID, @OrderID, @OrderListID, @CuttingMasterID, @Quantity, N'Assigned', @Notes);
                    SELECT CAST(SCOPE_IDENTITY() AS INT);",
                    new
                    {
                        m.InstitutionID,
                        m.RegistrationID,
                        OrderID = (int)line.OrderID,
                        m.OrderListID,
                        m.CuttingMasterID,
                        Quantity = qty,
                        Notes = m.Notes
                    });
                return Ok(new { success = true, cuttingIssueId = id });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpPost("complete")]
        public IActionResult Complete([FromBody] CuttingCompleteModel m)
        {
            try
            {
                using var con = _context.CreateConnection();
                con.Open();
                using var tx = con.BeginTransaction();

                var issue = con.QueryFirstOrDefault(@"
                    SELECT CI.CuttingIssueID, CI.CuttingMasterID, CI.Quantity,
                           ISNULL(D.CuttingCost, 0) AS UnitCost
                    FROM CuttingIssue CI
                    INNER JOIN OrderList OL
                        ON CI.OrderListID = OL.OrderListID AND CI.InstitutionID = OL.InstitutionID
                    INNER JOIN Dress D ON OL.DressID = D.DressID
                    WHERE CI.CuttingIssueID=@CuttingIssueID
                      AND CI.InstitutionID=@InstitutionID
                      AND CI.Status=N'Assigned'",
                    new { m.CuttingIssueID, m.InstitutionID }, tx);

                if (issue == null)
                    return BadRequest(new { success = false, message = "Issue not found or already completed" });

                decimal earned = (decimal)issue.UnitCost * (int)issue.Quantity;

                var n = con.Execute(@"
                    UPDATE CuttingIssue
                    SET Status=N'Completed', CompletedDate=GETDATE(), EarnedAmount=@EarnedAmount
                    WHERE CuttingIssueID=@CuttingIssueID AND InstitutionID=@InstitutionID AND Status=N'Assigned'",
                    new { m.CuttingIssueID, m.InstitutionID, EarnedAmount = earned }, tx);
                if (n == 0)
                {
                    tx.Rollback();
                    return BadRequest(new { success = false, message = "Issue not found or already completed" });
                }

                con.Execute(@"
                    UPDATE CuttingMaster
                    SET Balance = ISNULL(Balance, 0) + @Earned
                    WHERE CuttingMasterID=@MasterId AND InstitutionID=@InstitutionID",
                    new { Earned = earned, MasterId = (int)issue.CuttingMasterID, InstitutionID = m.InstitutionID }, tx);

                tx.Commit();
                return Ok(new { success = true, earnedAmount = earned });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpPut("reassign")]
        public IActionResult Reassign([FromBody] CuttingReassignModel m)
        {
            try
            {
                if (m.InstitutionID <= 0 || m.CuttingIssueID <= 0 || m.CuttingMasterID <= 0)
                    return BadRequest(new { success = false, message = "Invalid request" });

                using var con = _context.CreateConnection();
                var masterOk = con.ExecuteScalar<int>(
                    "SELECT COUNT(1) FROM CuttingMaster WHERE CuttingMasterID=@Id AND InstitutionID=@InstitutionID AND IsActive=1",
                    new { Id = m.CuttingMasterID, InstitutionID = m.InstitutionID });
                if (masterOk == 0)
                    return BadRequest(new { success = false, message = "Cutting master not found or inactive" });

                var n = con.Execute(@"
                    UPDATE CuttingIssue
                    SET CuttingMasterID=@CuttingMasterID,
                        Notes = CASE WHEN @Notes IS NULL OR @Notes='' THEN Notes ELSE @Notes END
                    WHERE CuttingIssueID=@CuttingIssueID AND InstitutionID=@InstitutionID AND Status=N'Assigned'",
                    new { m.CuttingIssueID, m.InstitutionID, m.CuttingMasterID, Notes = m.Notes });
                if (n == 0)
                    return BadRequest(new { success = false, message = "Only assigned (not completed) issues can be reassigned" });
                return Ok(new { success = true });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpGet("issues")]
        public IActionResult GetIssues(int institutionId, string? status = null, int? cuttingMasterId = null, string? dateFrom = null, string? dateTo = null, int page = 1, int pageSize = 50, string? orderNo = null)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize <= 0 || pageSize > 100) pageSize = 50;
                using var con = _context.CreateConnection();
                var p = new
                {
                    InstitutionID = institutionId,
                    Status = status,
                    MasterId = cuttingMasterId,
                    OrderSn = OrderSearch.ParseSerial(orderNo),
                    DateFrom = string.IsNullOrWhiteSpace(dateFrom) ? (DateTime?)null : DateTime.Parse(dateFrom),
                    DateTo = string.IsNullOrWhiteSpace(dateTo) ? (DateTime?)null : DateTime.Parse(dateTo),
                    Skip = (page - 1) * pageSize,
                    Take = pageSize
                };
                var total = con.ExecuteScalar<int>(@"
                    SELECT COUNT(1)
                    FROM CuttingIssue CI
                    WHERE CI.InstitutionID=@InstitutionID
                      AND (@Status IS NULL OR @Status='' OR CI.Status=@Status)
                      AND (@MasterId IS NULL OR CI.CuttingMasterID=@MasterId)
                      AND (@OrderSn IS NULL OR EXISTS (SELECT 1 FROM [Order] O2 WHERE O2.OrderID = CI.OrderID AND O2.OrderSerialNumber = @OrderSn))
                      AND (@DateFrom IS NULL OR CI.AssignedDate >= @DateFrom)
                      AND (@DateTo IS NULL OR CI.AssignedDate < DATEADD(day, 1, @DateTo))", p);
                var data = con.Query(@"
                    SELECT
                        CI.CuttingIssueID, CI.OrderID, CI.OrderListID, CI.CuttingMasterID,
                        CI.Quantity, CI.Status, CI.Notes,
                        CONVERT(varchar(16), CI.AssignedDate, 120) AS AssignedDate,
                        CONVERT(varchar(16), CI.CompletedDate, 120) AS CompletedDate,
                        CM.Name AS MasterName,
                        O.OrderSerialNumber,
                        C.CustomerName, C.Phone AS CustomerPhone,
                        D.Dress_Name AS DressName,
                        OL.OrderList_SN
                    FROM CuttingIssue CI
                    INNER JOIN CuttingMaster CM ON CI.CuttingMasterID = CM.CuttingMasterID
                    INNER JOIN [Order] O ON CI.OrderID = O.OrderID
                    INNER JOIN Customer C ON O.CustomerID = C.CustomerID
                    INNER JOIN OrderList OL ON CI.OrderListID = OL.OrderListID
                    INNER JOIN Dress D ON OL.DressID = D.DressID
                    WHERE CI.InstitutionID=@InstitutionID
                      AND (@Status IS NULL OR @Status='' OR CI.Status=@Status)
                      AND (@MasterId IS NULL OR CI.CuttingMasterID=@MasterId)
                      AND (@OrderSn IS NULL OR O.OrderSerialNumber = @OrderSn)
                      AND (@DateFrom IS NULL OR CI.AssignedDate >= @DateFrom)
                      AND (@DateTo IS NULL OR CI.AssignedDate < DATEADD(day, 1, @DateTo))
                    ORDER BY CI.AssignedDate DESC
                    OFFSET @Skip ROWS FETCH NEXT @Take ROWS ONLY", p);
                return Ok(new { success = true, data, total, page, pageSize });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpGet("report")]
        public IActionResult GetReport(int institutionId, int? cuttingMasterId = null, string? dateFrom = null, string? dateTo = null)
        {
            try
            {
                using var con = _context.CreateConnection();
                var data = con.Query(@"
                    SELECT
                        CM.CuttingMasterID,
                        CM.Name AS MasterName,
                        CM.Phone,
                        CM.IsActive,
                        ISNULL(SUM(CI.Quantity), 0) AS AssignedQty,
                        ISNULL(SUM(CASE WHEN CI.Status=N'Completed' THEN CI.Quantity ELSE 0 END), 0) AS CompletedQty,
                        ISNULL(SUM(CASE WHEN CI.Status=N'Assigned' THEN CI.Quantity ELSE 0 END), 0) AS RemainingQty,
                        COUNT(CI.CuttingIssueID) AS IssueCount
                    FROM CuttingMaster CM
                    LEFT JOIN CuttingIssue CI
                        ON CI.CuttingMasterID = CM.CuttingMasterID AND CI.InstitutionID = CM.InstitutionID
                       AND (@DateFrom IS NULL OR CI.AssignedDate >= @DateFrom)
                       AND (@DateTo IS NULL OR CI.AssignedDate < DATEADD(day, 1, @DateTo))
                    WHERE CM.InstitutionID=@InstitutionID
                      AND (@MasterId IS NULL OR CM.CuttingMasterID=@MasterId)
                    GROUP BY CM.CuttingMasterID, CM.Name, CM.Phone, CM.IsActive
                    ORDER BY CM.Name",
                    new {
                        InstitutionID = institutionId,
                        MasterId = cuttingMasterId,
                        DateFrom = string.IsNullOrWhiteSpace(dateFrom) ? (DateTime?)null : DateTime.Parse(dateFrom),
                        DateTo = string.IsNullOrWhiteSpace(dateTo) ? (DateTime?)null : DateTime.Parse(dateTo)
                    });

                var dresses = con.Query(@"
                    SELECT
                        D.Dress_Name AS DressName,
                        ISNULL(SUM(CI.Quantity), 0) AS AssignedQty,
                        ISNULL(SUM(CASE WHEN CI.Status=N'Completed' THEN CI.Quantity ELSE 0 END), 0) AS CompletedQty,
                        ISNULL(SUM(CASE WHEN CI.Status=N'Assigned' THEN CI.Quantity ELSE 0 END), 0) AS RemainingQty
                    FROM CuttingIssue CI
                    INNER JOIN OrderList OL ON CI.OrderListID = OL.OrderListID
                    INNER JOIN Dress D ON OL.DressID = D.DressID
                    WHERE CI.InstitutionID=@InstitutionID
                      AND (@MasterId IS NULL OR CI.CuttingMasterID=@MasterId)
                      AND (@DateFrom IS NULL OR CI.AssignedDate >= @DateFrom)
                      AND (@DateTo IS NULL OR CI.AssignedDate < DATEADD(day, 1, @DateTo))
                    GROUP BY D.Dress_Name
                    ORDER BY D.Dress_Name",
                    new {
                        InstitutionID = institutionId,
                        MasterId = cuttingMasterId,
                        DateFrom = string.IsNullOrWhiteSpace(dateFrom) ? (DateTime?)null : DateTime.Parse(dateFrom),
                        DateTo = string.IsNullOrWhiteSpace(dateTo) ? (DateTime?)null : DateTime.Parse(dateTo)
                    });

                return Ok(new { success = true, data, dresses });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }
    }

    public class CuttingMasterModel
    {
        public int InstitutionID { get; set; }
        public int RegistrationID { get; set; }
        public string Name { get; set; } = "";
        public string? Phone { get; set; }
    }

    public class CuttingMasterUpdateModel
    {
        public int CuttingMasterID { get; set; }
        public int InstitutionID { get; set; }
        public string Name { get; set; } = "";
        public string? Phone { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class CuttingIssueCreateModel
    {
        public int InstitutionID { get; set; }
        public int RegistrationID { get; set; }
        public int OrderListID { get; set; }
        public int CuttingMasterID { get; set; }
        public int Quantity { get; set; }
        public string? Notes { get; set; }
    }

    public class CuttingCompleteModel
    {
        public int CuttingIssueID { get; set; }
        public int InstitutionID { get; set; }
    }

    public class CuttingReassignModel
    {
        public int CuttingIssueID { get; set; }
        public int InstitutionID { get; set; }
        public int CuttingMasterID { get; set; }
        public string? Notes { get; set; }
    }

    public class WorkerPayModel
    {
        public int InstitutionID { get; set; }
        public int RegistrationID { get; set; }
        public int WorkerID { get; set; }
        public decimal Amount { get; set; }
        public string? Notes { get; set; }
        public string? Otp { get; set; }
    }

    public class WorkerPayOtpRequest
    {
        public int InstitutionID { get; set; }
        public int WorkerID { get; set; }
        public decimal Amount { get; set; }
    }
}
