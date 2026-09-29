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
    // only read or change its own artisans and factory issues.
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    [ShopScoped]
    [ShopPage("/factory-issue.html")] // Shop Page Access: 403 when the Authority switched this page off for the shop
    public class FactoryController : ControllerBase
    {
        private readonly TailorBdContext _context;
        private readonly INovocomSmsService _smsService;
        public FactoryController(TailorBdContext context, INovocomSmsService smsService)
        {
            _context = context;
            _smsService = smsService;
        }

        // ── Artisans (করিগর) ─────────────────────────────────────────────────
        [ShopPage("/cutting-issue.html", "/factory-issue.html", "/worker-payments.html")] // worker list / pay: used by all three pages
        [HttpGet("artisans")]
        public IActionResult GetArtisans(int institutionId, bool activeOnly = false)
        {
            try
            {
                using var con = _context.CreateConnection();
                var data = con.Query(@"
                    SELECT ArtisanID, Name, Phone, IsActive,
                           ISNULL(Balance,0) AS Balance,
                           CONVERT(varchar(10), CreatedDate, 23) AS CreatedDate
                    FROM Artisan
                    WHERE InstitutionID=@InstitutionID
                      AND (@ActiveOnly=0 OR IsActive=1)
                    ORDER BY Name",
                    new { InstitutionID = institutionId, ActiveOnly = activeOnly ? 1 : 0 });
                return Ok(new { success = true, data });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [ShopPage("/cutting-issue.html", "/factory-issue.html", "/worker-payments.html")] // worker list / pay: used by all three pages
        [HttpPost("artisans")]
        public IActionResult AddArtisan([FromBody] ArtisanModel m)
        {
            try
            {
                if (m.InstitutionID <= 0 || string.IsNullOrWhiteSpace(m.Name))
                    return BadRequest(new { success = false, message = "Name and institution required" });
                using var con = _context.CreateConnection();
                var id = con.ExecuteScalar<int>(@"
                    INSERT INTO Artisan (InstitutionID, RegistrationID, Name, Phone, IsActive)
                    VALUES (@InstitutionID, @RegistrationID, @Name, @Phone, 1);
                    SELECT CAST(SCOPE_IDENTITY() AS INT);",
                    new { m.InstitutionID, m.RegistrationID, Name = m.Name.Trim(), Phone = m.Phone });
                return Ok(new { success = true, artisanId = id });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // Bulk add of artisans from an Excel/CSV upload (rows parsed in the browser).
        // Same insert as the one-by-one POST; see Services/WorkerBulkImport.cs.
        [ShopPage("/cutting-issue.html", "/factory-issue.html", "/worker-payments.html")] // worker list / pay: used by all three pages
        [HttpPost("artisans/bulk")]
        [RequestSizeLimit(2_000_000)]
        public IActionResult AddArtisansBulk([FromBody] WorkerBulkRequest m)
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
                return Ok(WorkerBulkImport.Import(con, WorkerTable.Artisan, m, _smsService.NormalizePhone));
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [ShopPage("/cutting-issue.html", "/factory-issue.html", "/worker-payments.html")] // worker list / pay: used by all three pages
        [HttpPut("artisans")]
        public IActionResult UpdateArtisan([FromBody] ArtisanUpdateModel m)
        {
            try
            {
                using var con = _context.CreateConnection();
                var n = con.Execute(@"
                    UPDATE Artisan SET Name=@Name, Phone=@Phone, IsActive=@IsActive
                    WHERE ArtisanID=@ArtisanID AND InstitutionID=@InstitutionID",
                    new { m.ArtisanID, m.InstitutionID, Name = m.Name.Trim(), m.Phone, m.IsActive });
                if (n == 0) return NotFound(new { success = false, message = "কারিগর পাওয়া যায়নি / Artisan not found" });
                return Ok(new { success = true });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [ShopPage("/cutting-issue.html", "/factory-issue.html", "/worker-payments.html")] // worker list / pay: used by all three pages
        [HttpDelete("artisans")]
        public IActionResult DeleteArtisan(int artisanId, int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var inUse = con.ExecuteScalar<int>(
                    "SELECT COUNT(1) FROM FactoryIssue WHERE ArtisanID=@Id AND InstitutionID=@InstitutionID",
                    new { Id = artisanId, InstitutionID = institutionId });
                if (inUse > 0)
                {
                    con.Execute("UPDATE Artisan SET IsActive=0 WHERE ArtisanID=@Id AND InstitutionID=@InstitutionID",
                        new { Id = artisanId, InstitutionID = institutionId });
                    return Ok(new { success = true, deactivated = true });
                }
                var n = con.Execute("DELETE FROM Artisan WHERE ArtisanID=@Id AND InstitutionID=@InstitutionID",
                    new { Id = artisanId, InstitutionID = institutionId });
                if (n == 0) return NotFound(new { success = false, message = "কারিগর পাওয়া যায়নি / Artisan not found" });
                return Ok(new { success = true });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }


        // ── Artisan balance & payments ───────────────────────────────────────
        [ShopPage("/cutting-issue.html", "/factory-issue.html", "/worker-payments.html")] // worker list / pay: used by all three pages
        [HttpGet("artisans/{id}/balance")]
        public IActionResult GetArtisanBalance(int id, int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var bal = con.QueryFirstOrDefault<decimal?>(
                    @"SELECT ISNULL(Balance,0) FROM Artisan
                      WHERE ArtisanID=@Id AND InstitutionID=@InstitutionID",
                    new { Id = id, InstitutionID = institutionId });
                if (bal == null)
                    return NotFound(new { success = false, message = "Artisan not found" });
                return Ok(new { success = true, balance = bal.Value });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [ShopPage("/cutting-issue.html", "/factory-issue.html", "/worker-payments.html")] // worker list / pay: used by all three pages
        [HttpGet("artisans/{id}/payments")]
        public IActionResult GetArtisanPayments(int id, int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var exists = con.ExecuteScalar<int>(
                    "SELECT COUNT(1) FROM Artisan WHERE ArtisanID=@Id AND InstitutionID=@InstitutionID",
                    new { Id = id, InstitutionID = institutionId });
                if (exists == 0)
                    return NotFound(new { success = false, message = "Artisan not found" });

                var data = con.Query(@"
                    SELECT WorkerPaymentID, Amount,
                           CONVERT(varchar(16), PaymentDate, 120) AS PaymentDate,
                           Notes, RegistrationID, OtpCode
                    FROM WorkerPayment
                    WHERE InstitutionID=@InstitutionID
                      AND WorkerType=N'Artisan'
                      AND WorkerID=@Id
                    ORDER BY PaymentDate DESC, WorkerPaymentID DESC",
                    new { InstitutionID = institutionId, Id = id });
                return Ok(new { success = true, data });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [ShopPage("/cutting-issue.html", "/factory-issue.html", "/worker-payments.html")] // worker list / pay: used by all three pages
        [HttpPost("artisans/send-otp")]
        public async Task<IActionResult> SendArtisanPayOtp([FromBody] WorkerPayOtpRequest m)
        {
            try
            {
                if (m.InstitutionID <= 0 || m.WorkerID <= 0 || m.Amount <= 0)
                    return BadRequest(new { success = false, message = "Invalid request" });

                using var con = _context.CreateConnection();
                var worker = con.QueryFirstOrDefault(@"
                    SELECT ArtisanID AS WorkerKey, Name, Phone, ISNULL(Balance,0) AS Balance
                    FROM Artisan
                    WHERE ArtisanID=@Id AND InstitutionID=@InstitutionID",
                    new { Id = m.WorkerID, InstitutionID = m.InstitutionID });
                if (worker == null)
                    return BadRequest(new { success = false, message = "Artisan not found" });
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
                    WHERE InstitutionID=@InstitutionID AND WorkerType=N'Artisan' AND WorkerID=@WorkerID",
                    new { m.InstitutionID, m.WorkerID });
                con.Execute(@"INSERT INTO WorkerPaymentOtp
                    (InstitutionID, WorkerType, WorkerID, OtpCode, Amount, Phone, ExpiresAt)
                    VALUES (@InstitutionID, N'Artisan', @WorkerID, @Otp, @Amount, @Phone, DATEADD(minute, 5, GETDATE()))",
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
        [HttpPost("artisans/pay")]
        public IActionResult PayArtisan([FromBody] WorkerPayModel m)
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
                    WHERE InstitutionID=@InstitutionID AND WorkerType=N'Artisan'
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
                    @"SELECT ISNULL(Balance,0) FROM Artisan
                      WHERE ArtisanID=@Id AND InstitutionID=@InstitutionID",
                    new { Id = m.WorkerID, InstitutionID = m.InstitutionID }, tx);
                if (balance == null)
                    return BadRequest(new { success = false, message = "Artisan not found" });
                // no balance cap: paying more than the balance = advance (অগ্রিম), Balance goes negative

                string otpUsed = m.Otp.Trim();
                con.Execute(@"
                    UPDATE Artisan SET Balance = ISNULL(Balance,0) - @Amount
                    WHERE ArtisanID=@WorkerID AND InstitutionID=@InstitutionID",
                    new { m.Amount, m.WorkerID, m.InstitutionID }, tx);

                con.Execute(@"
                    INSERT INTO WorkerPayment
                        (InstitutionID, RegistrationID, WorkerType, WorkerID, Amount, Notes, OtpCode)
                    VALUES
                        (@InstitutionID, @RegistrationID, N'Artisan', @WorkerID, @Amount, @Notes, @OtpCode)",
                    new { m.InstitutionID, m.RegistrationID, m.WorkerID, m.Amount, Notes = m.Notes, OtpCode = otpUsed }, tx);

                con.Execute(@"DELETE FROM WorkerPaymentOtp
                    WHERE InstitutionID=@InstitutionID AND WorkerType=N'Artisan' AND WorkerID=@WorkerID",
                    new { m.InstitutionID, m.WorkerID }, tx);

                tx.Commit();
                decimal newBalance = balance.Value - m.Amount;
                return Ok(new { success = true, newBalance, advance = Math.Max(-newBalance, 0), otp = otpUsed });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        /// <summary>
        /// Dress lines whose cutting is completed and not yet factory-issued.
        /// Shops that skip cutting never appear here — they go straight to Complete Order Work.
        /// </summary>

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
                    FROM CuttingIssue CI WITH (NOLOCK)
                    INNER JOIN OrderList OL WITH (NOLOCK)
                        ON CI.OrderListID = OL.OrderListID AND CI.InstitutionID = OL.InstitutionID
                    INNER JOIN [Order] O WITH (NOLOCK) ON CI.OrderID = O.OrderID
                    INNER JOIN Customer C WITH (NOLOCK) ON O.CustomerID = C.CustomerID
                    INNER JOIN Dress D WITH (NOLOCK) ON OL.DressID = D.DressID
                    LEFT JOIN FactoryIssue FI WITH (NOLOCK)
                        ON FI.OrderListID = CI.OrderListID AND FI.InstitutionID = CI.InstitutionID
                    WHERE CI.InstitutionID = @InstitutionID
                      AND CI.Status = N'Completed'
                      AND FI.FactoryIssueID IS NULL
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
                        CI.Quantity,
                        CI.CuttingIssueID,
                        CM.Name AS CuttingMasterName,
                        CONVERT(varchar(16), CI.CompletedDate, 120) AS CuttingCompletedDate
                    FROM CuttingIssue CI WITH (NOLOCK)
                    INNER JOIN OrderList OL WITH (NOLOCK)
                        ON CI.OrderListID = OL.OrderListID AND CI.InstitutionID = OL.InstitutionID
                    INNER JOIN [Order] O WITH (NOLOCK) ON CI.OrderID = O.OrderID
                    INNER JOIN Customer C WITH (NOLOCK) ON O.CustomerID = C.CustomerID
                    INNER JOIN Dress D WITH (NOLOCK) ON OL.DressID = D.DressID
                    INNER JOIN CuttingMaster CM WITH (NOLOCK) ON CI.CuttingMasterID = CM.CuttingMasterID
                    LEFT JOIN FactoryIssue FI WITH (NOLOCK)
                        ON FI.OrderListID = CI.OrderListID AND FI.InstitutionID = CI.InstitutionID
                    WHERE CI.InstitutionID = @InstitutionID
                      AND CI.Status = N'Completed'
                      AND FI.FactoryIssueID IS NULL
                      AND (@OrderSn IS NULL OR O.OrderSerialNumber = @OrderSn)
                      AND (@NameLike IS NULL OR C.CustomerName LIKE @NameLike OR D.Dress_Name LIKE @NameLike)
                    ORDER BY CI.CompletedDate DESC, CI.CuttingIssueID DESC
                    OFFSET @Skip ROWS FETCH NEXT @Take ROWS ONLY",
                    new
                    {
                        InstitutionID = institutionId,
                        ps.OrderSn,
                        ps.NameLike,
                        Skip = (page - 1) * pageSize,
                        Take = pageSize
                    });
                // nothing pending for that order number: tell the page whether the order exists at all (cutting not done yet / already factory-issued)
                bool? orderExists = ps.OrderSn != null && total == 0
                    ? con.ExecuteScalar<int>("SELECT COUNT(1) FROM [Order] WITH (NOLOCK) WHERE InstitutionID = @InstitutionID AND OrderSerialNumber = @OrderSn",
                                             new { InstitutionID = institutionId, ps.OrderSn }) > 0
                    : null;
                return Ok(new { success = true, data, total, page, pageSize, mode = ps.Mode, orderExists });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }



        [HttpPost("issue")]
        public IActionResult Issue([FromBody] FactoryIssueCreateModel m)
        {
            try
            {
                if (m.InstitutionID <= 0 || m.OrderListID <= 0 || m.ArtisanID <= 0)
                    return BadRequest(new { success = false, message = "Invalid request" });

                using var con = _context.CreateConnection();

                var artisanOk = con.ExecuteScalar<int>(
                    "SELECT COUNT(1) FROM Artisan WHERE ArtisanID=@Id AND InstitutionID=@InstitutionID AND IsActive=1",
                    new { Id = m.ArtisanID, InstitutionID = m.InstitutionID });
                if (artisanOk == 0)
                    return BadRequest(new { success = false, message = "Artisan not found or inactive" });

                var cut = con.QueryFirstOrDefault(@"
                    SELECT CuttingIssueID, OrderID, OrderListID, Quantity
                    FROM CuttingIssue
                    WHERE InstitutionID=@InstitutionID AND OrderListID=@OrderListID AND Status=N'Completed'",
                    new { m.InstitutionID, m.OrderListID });
                if (cut == null)
                    return BadRequest(new { success = false, message = "Cutting must be completed first (or skip both steps and use Complete Order Work)" });

                var exists = con.ExecuteScalar<int>(
                    "SELECT COUNT(1) FROM FactoryIssue WHERE InstitutionID=@InstitutionID AND OrderListID=@OrderListID",
                    new { m.InstitutionID, m.OrderListID });
                if (exists > 0)
                    return BadRequest(new { success = false, message = "Already factory-issued" });

                int qty = m.Quantity > 0 ? Math.Min(m.Quantity, (int)cut.Quantity) : (int)cut.Quantity;
                var id = con.ExecuteScalar<int>(@"
                    INSERT INTO FactoryIssue
                        (InstitutionID, RegistrationID, OrderID, OrderListID, ArtisanID, Quantity, Status, Notes)
                    VALUES
                        (@InstitutionID, @RegistrationID, @OrderID, @OrderListID, @ArtisanID, @Quantity, N'Assigned', @Notes);
                    SELECT CAST(SCOPE_IDENTITY() AS INT);",
                    new
                    {
                        m.InstitutionID,
                        m.RegistrationID,
                        OrderID = (int)cut.OrderID,
                        m.OrderListID,
                        m.ArtisanID,
                        Quantity = qty,
                        Notes = m.Notes
                    });
                return Ok(new { success = true, factoryIssueId = id });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        /// <summary>
        /// "সেলাই সম্পন্ন" for one assignment. Quantity = pieces submitted now (empty = all open pieces);
        /// ExpectedCompleted = pieces done the page showed (a repeated / stale submit gets 409 instead of
        /// being credited twice). Partial pieces need FactoryIssue.CompletedQuantity (02_add_column.sql).
        /// </summary>
        [HttpPost("complete")]
        public IActionResult Complete([FromBody] FactoryCompleteModel m)
        {
            try
            {
                var r = CompleteIssues(m.InstitutionID, m.RegistrationID,
                    new[] { new PieceRequest { Id = m.FactoryIssueID, Pieces = m.Quantity > 0 ? m.Quantity : null, Expected = m.ExpectedCompleted } });
                var it = r.Items.FirstOrDefault();
                if (it == null)
                {
                    var sk = r.SkipList.FirstOrDefault();
                    var reason = sk?.Reason ?? "not found";
                    if (reason == "changed")
                        return Conflict(new { success = false, reason, message = "এই এসাইনমেন্ট ইতিমধ্যে আপডেট হয়েছে — পাতা রিফ্রেশ করে আবার দেখুন (already updated, reload)" });
                    if (reason == "invalid quantity")
                        return BadRequest(new { success = false, reason, open = sk?.Open, message = $"১ থেকে {sk?.Open} পিসের মধ্যে দিন (enter 1–{sk?.Open} pieces)" });
                    if (reason == "partial not available")
                        return BadRequest(new { success = false, reason, message = "আংশিক পিস জমার জন্য আগে ডাটাবেস আপডেট (PartialPiece\\02_add_column.sql) চালাতে হবে (partial pieces need the database update)" });
                    return BadRequest(new { success = false, reason, message = "Issue not found or already completed" });
                }
                var o = r.Orders.FirstOrDefault();
                return Ok(new
                {
                    success = true,
                    earnedAmount = r.TotalEarned,
                    pieces = it.Pieces,
                    completedQuantity = it.CompletedQuantity,
                    quantity = it.Quantity,
                    assignmentCompleted = it.AssignmentCompleted,
                    workCompleteAdded = it.WorkComplete,
                    orderCompleted = o != null && o.CompletedNow,
                    orderSerialNumber = o?.OrderSerialNumber,
                    orderWorkStatus = o?.WorkStatus,
                    linesDone = o?.Done,
                    linesTotal = o?.Total
                });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        /// <summary>
        /// Mark several factory assignments "sewing complete" at once: ALL open pieces of each selected
        /// assignment (same per-assignment effect as /complete). One transaction; assignments that are
        /// no longer open are skipped and reported, never credited twice.
        /// </summary>
        [HttpPost("complete-bulk")]
        public IActionResult CompleteBulk([FromBody] FactoryBulkCompleteModel m)
        {
            try
            {
                var ids = (m.FactoryIssueIDs ?? new List<int>()).Where(i => i > 0).Distinct().ToList();
                if (ids.Count == 0)
                    return BadRequest(new { success = false, message = "No line selected" });
                if (ids.Count > 200)
                    return BadRequest(new { success = false, message = "At most 200 lines at once" });
                var r = CompleteIssues(m.InstitutionID, m.RegistrationID, ids.Select(i => new PieceRequest { Id = i }));
                return Ok(new
                {
                    success = true,
                    completed = r.Items.Count,
                    completedIds = r.Items.Select(x => x.FactoryIssueId),
                    pieces = r.Items.Sum(x => x.Pieces),
                    skipped = r.SkipList.Select(s => new { factoryIssueId = s.Id, reason = s.Reason }),
                    earnedAmount = r.TotalEarned,
                    ordersCompleted = r.Orders.Where(o => o.CompletedNow).Select(o => new { orderId = o.OrderId, orderSerialNumber = o.OrderSerialNumber }),
                    orders = r.Orders.Select(o => new { orderId = o.OrderId, orderSerialNumber = o.OrderSerialNumber, linesDone = o.Done, linesTotal = o.Total, workStatus = o.WorkStatus, orderCompleted = o.CompletedNow })
                });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        private sealed class PieceRequest
        {
            public int Id { get; set; }
            public int? Pieces { get; set; }      // null = all open pieces
            public int? Expected { get; set; }    // pieces done as seen by the caller (null = no check)
        }
        private sealed class Skip { public int Id; public string Reason = ""; public int? Open; }
        private sealed class DoneItem
        {
            public int FactoryIssueId, Pieces, CompletedQuantity, Quantity, WorkComplete;
            public bool AssignmentCompleted;
            public decimal Earned;
        }
        private sealed class CompleteResult
        {
            public List<DoneItem> Items { get; } = new();
            public List<Skip> SkipList { get; } = new();
            public decimal TotalEarned { get; set; }
            public List<FactoryOrderCompletion.Progress> Orders { get; } = new();
        }
        private sealed class IssueRef { public int FactoryIssueID { get; set; } public int OrderID { get; set; } }
        private sealed class IssueRow
        {
            public int FactoryIssueID { get; set; }
            public int OrderID { get; set; }
            public int OrderListID { get; set; }
            public int ArtisanID { get; set; }
            public int Quantity { get; set; }
            public int Done { get; set; }
            public string Status { get; set; } = "";
            public decimal UnitCost { get; set; }
        }

        private CompleteResult CompleteIssues(int institutionId, int registrationId, IEnumerable<PieceRequest> requests)
        {
            if (institutionId <= 0 || registrationId <= 0)
                throw new InvalidOperationException("Invalid institution or registration");
            var reqs = requests.Where(q => q.Id > 0).GroupBy(q => q.Id).Select(g => g.First()).OrderBy(q => q.Id).ToList();
            var res = new CompleteResult();
            using var con = _context.CreateConnection();
            con.Open();
            using var tx = con.BeginTransaction();
            try
            {
                bool pieces = FactoryPieces.HasCompletedQuantity(con, tx);
                var ids = reqs.Select(q => q.Id).ToList();
                var refs = con.Query<IssueRef>(
                    "SELECT FactoryIssueID, OrderID FROM FactoryIssue WHERE InstitutionID=@InstitutionID AND FactoryIssueID IN @Ids",
                    new { InstitutionID = institutionId, Ids = ids }, tx).ToList();
                // order row locks first (see FactoryOrderCompletion.LockOrders)
                var before = FactoryOrderCompletion.LockOrders(con, tx, institutionId, refs.Select(x => x.OrderID));

                var touched = new List<int>();
                var orderUpdated = new HashSet<int>();
                foreach (var q in reqs)
                {
                    // UPDLOCK: a reassign of this row waits until this transaction is done
                    var issue = con.QueryFirstOrDefault<IssueRow>($@"
                        SELECT FI.FactoryIssueID, FI.OrderID, FI.OrderListID, FI.ArtisanID, FI.Quantity,
                               {(pieces ? "FI.CompletedQuantity" : "0")} AS Done, FI.Status,
                               CAST(ISNULL(D.SewingCost, 0) AS decimal(18, 2)) AS UnitCost
                        FROM FactoryIssue FI WITH (UPDLOCK, ROWLOCK)
                        INNER JOIN OrderList OL
                            ON FI.OrderListID = OL.OrderListID AND FI.InstitutionID = OL.InstitutionID
                        INNER JOIN Dress D ON OL.DressID = D.DressID
                        WHERE FI.FactoryIssueID=@FactoryIssueID
                          AND FI.InstitutionID=@InstitutionID",
                        new { FactoryIssueID = q.Id, InstitutionID = institutionId }, tx);
                    if (issue == null) { res.SkipList.Add(new Skip { Id = q.Id, Reason = "not found" }); continue; }
                    int open = issue.Quantity - issue.Done;
                    if (issue.Status != "Assigned" || open <= 0) { res.SkipList.Add(new Skip { Id = q.Id, Reason = "already completed" }); continue; }
                    if (q.Expected.HasValue && q.Expected.Value != issue.Done) { res.SkipList.Add(new Skip { Id = q.Id, Reason = "changed" }); continue; }
                    int n = q.Pieces ?? open;
                    if (n < 1 || n > open) { res.SkipList.Add(new Skip { Id = q.Id, Reason = "invalid quantity", Open = open }); continue; }
                    if (!pieces && n < open) { res.SkipList.Add(new Skip { Id = q.Id, Reason = "partial not available", Open = open }); continue; }

                    decimal earned = issue.UnitCost * n;
                    int updated = pieces
                        ? con.Execute(@"
                            UPDATE FactoryIssue
                            SET CompletedQuantity = CompletedQuantity + @N,
                                EarnedAmount = ISNULL(EarnedAmount, 0) + @Earned,
                                Status = CASE WHEN CompletedQuantity + @N >= Quantity THEN N'Completed' ELSE N'Assigned' END,
                                CompletedDate = GETDATE()
                            WHERE FactoryIssueID=@FactoryIssueID AND InstitutionID=@InstitutionID
                              AND Status=N'Assigned' AND CompletedQuantity=@Done",
                            new { N = n, Earned = earned, FactoryIssueID = q.Id, InstitutionID = institutionId, issue.Done }, tx)
                        : con.Execute(@"
                            UPDATE FactoryIssue
                            SET Status=N'Completed', CompletedDate=GETDATE(), EarnedAmount=@Earned
                            WHERE FactoryIssueID=@FactoryIssueID AND InstitutionID=@InstitutionID AND Status=N'Assigned'",
                            new { Earned = earned, FactoryIssueID = q.Id, InstitutionID = institutionId }, tx);
                    if (updated == 0) { res.SkipList.Add(new Skip { Id = q.Id, Reason = "already completed" }); continue; }

                    con.Execute(@"
                        UPDATE Artisan
                        SET Balance = ISNULL(Balance, 0) + @Earned
                        WHERE ArtisanID=@ArtisanId AND InstitutionID=@InstitutionID",
                        new { Earned = earned, ArtisanId = issue.ArtisanID, InstitutionID = institutionId }, tx);

                    int wc = FactoryOrderCompletion.RecordPieces(con, tx, institutionId, registrationId, issue.OrderID, issue.OrderListID, n, orderUpdated);

                    res.Items.Add(new DoneItem
                    {
                        FactoryIssueId = q.Id, Pieces = n, CompletedQuantity = issue.Done + n, Quantity = issue.Quantity,
                        AssignmentCompleted = issue.Done + n >= issue.Quantity, Earned = earned, WorkComplete = wc
                    });
                    res.TotalEarned += earned;
                    touched.Add(issue.OrderID);
                }

                foreach (var orderId in touched.Distinct().OrderBy(x => x))
                    res.Orders.Add(FactoryOrderCompletion.GetProgress(con, tx, institutionId, orderId, before.GetValueOrDefault(orderId, "")));

                tx.Commit();
            }
            catch
            {
                tx.Rollback();
                throw;
            }
            return res;
        }

        [HttpPut("reassign")]
        public IActionResult Reassign([FromBody] FactoryReassignModel m)
        {
            try
            {
                if (m.InstitutionID <= 0 || m.FactoryIssueID <= 0 || m.ArtisanID <= 0)
                    return BadRequest(new { success = false, message = "Invalid request" });

                using var con = _context.CreateConnection();
                var artisanOk = con.ExecuteScalar<int>(
                    "SELECT COUNT(1) FROM Artisan WHERE ArtisanID=@Id AND InstitutionID=@InstitutionID AND IsActive=1",
                    new { Id = m.ArtisanID, InstitutionID = m.InstitutionID });
                if (artisanOk == 0)
                    return BadRequest(new { success = false, message = "Artisan not found or inactive" });

                // once pieces are submitted the earnings belong to the current artisan: no reassign
                bool pieces = FactoryPieces.HasCompletedQuantity(con);
                var n = con.Execute($@"
                    UPDATE FactoryIssue
                    SET ArtisanID=@ArtisanID,
                        Notes = CASE WHEN @Notes IS NULL OR @Notes='' THEN Notes ELSE @Notes END
                    WHERE FactoryIssueID=@FactoryIssueID AND InstitutionID=@InstitutionID AND Status=N'Assigned'
                      {(pieces ? "AND CompletedQuantity = 0" : "")}",
                    new { m.FactoryIssueID, m.InstitutionID, m.ArtisanID, Notes = m.Notes });
                if (n == 0)
                {
                    if (pieces && con.ExecuteScalar<int>(
                            "SELECT COUNT(1) FROM FactoryIssue WHERE FactoryIssueID=@FactoryIssueID AND InstitutionID=@InstitutionID AND Status=N'Assigned' AND CompletedQuantity > 0",
                            new { m.FactoryIssueID, m.InstitutionID }) > 0)
                        return BadRequest(new { success = false, reason = "pieces submitted", message = "কিছু পিস জমা হয়ে গেছে — এখন পুনঃএসাইন করা যাবে না (some pieces already submitted, cannot reassign)" });
                    return BadRequest(new { success = false, message = "Only assigned (not completed) issues can be reassigned" });
                }
                return Ok(new { success = true });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpGet("issues")]
        public IActionResult GetIssues(int institutionId, string? status = null, int? artisanId = null, string? dateFrom = null, string? dateTo = null, int page = 1, int pageSize = 50, string? orderNo = null)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize <= 0 || pageSize > 100) pageSize = 50;
                using var con = _context.CreateConnection();
                bool pieces = FactoryPieces.HasCompletedQuantity(con);
                var p = new
                {
                    InstitutionID = institutionId,
                    Status = status,
                    ArtisanId = artisanId,
                    OrderSn = OrderSearch.ParseSerial(orderNo),
                    DateFrom = string.IsNullOrWhiteSpace(dateFrom) ? (DateTime?)null : DateTime.Parse(dateFrom),
                    DateTo = string.IsNullOrWhiteSpace(dateTo) ? (DateTime?)null : DateTime.Parse(dateTo),
                    Skip = (page - 1) * pageSize,
                    Take = pageSize
                };
                var total = con.ExecuteScalar<int>(@"
                    SELECT COUNT(1)
                    FROM FactoryIssue FI
                    WHERE FI.InstitutionID=@InstitutionID
                      AND (@Status IS NULL OR @Status='' OR FI.Status=@Status)
                      AND (@ArtisanId IS NULL OR FI.ArtisanID=@ArtisanId)
                      AND (@OrderSn IS NULL OR EXISTS (SELECT 1 FROM [Order] O2 WHERE O2.OrderID = FI.OrderID AND O2.OrderSerialNumber = @OrderSn))
                      AND (@DateFrom IS NULL OR FI.AssignedDate >= @DateFrom)
                      AND (@DateTo IS NULL OR FI.AssignedDate < DATEADD(day, 1, @DateTo))", p);
                var data = con.Query($@"
                    SELECT
                        FI.FactoryIssueID, FI.OrderID, FI.OrderListID, FI.ArtisanID,
                        FI.Quantity, FI.Status, FI.Notes,
                        {FactoryPieces.DoneExpr(pieces, "FI")} AS CompletedQuantity,
                        CONVERT(varchar(16), FI.AssignedDate, 120) AS AssignedDate,
                        CONVERT(varchar(16), FI.CompletedDate, 120) AS CompletedDate,
                        A.Name AS ArtisanName,
                        O.OrderSerialNumber,
                        C.CustomerName, C.Phone AS CustomerPhone,
                        D.Dress_Name AS DressName,
                        OL.OrderList_SN,
                        O.WorkStatus AS OrderWorkStatus,
                        -- dress lines of the order / lines with nothing left to sew (work complete)
                        (SELECT COUNT(1) FROM OrderList X WHERE X.OrderID = FI.OrderID AND X.InstitutionID = FI.InstitutionID) AS OrderLines,
                        (SELECT COUNT(1) FROM OrderList X WHERE X.OrderID = FI.OrderID AND X.InstitutionID = FI.InstitutionID
                                AND ISNULL(X.DressQuantity, 0) - ISNULL(X.WorkCompleteQuantity, 0) <= 0) AS OrderLinesDone
                    FROM FactoryIssue FI
                    INNER JOIN Artisan A ON FI.ArtisanID = A.ArtisanID
                    INNER JOIN [Order] O ON FI.OrderID = O.OrderID
                    INNER JOIN Customer C ON O.CustomerID = C.CustomerID
                    INNER JOIN OrderList OL ON FI.OrderListID = OL.OrderListID
                    INNER JOIN Dress D ON OL.DressID = D.DressID
                    WHERE FI.InstitutionID=@InstitutionID
                      AND (@Status IS NULL OR @Status='' OR FI.Status=@Status)
                      AND (@ArtisanId IS NULL OR FI.ArtisanID=@ArtisanId)
                      AND (@OrderSn IS NULL OR O.OrderSerialNumber = @OrderSn)
                      AND (@DateFrom IS NULL OR FI.AssignedDate >= @DateFrom)
                      AND (@DateTo IS NULL OR FI.AssignedDate < DATEADD(day, 1, @DateTo))
                    ORDER BY FI.AssignedDate DESC
                    OFFSET @Skip ROWS FETCH NEXT @Take ROWS ONLY", p);
                return Ok(new { success = true, data, total, page, pageSize, partialSupported = pieces });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ── Assigned artisan (কারিগর) per order line, for order lists and prints ──
        // One query for all orders shown on a page (max 1000 ids). The current assignee is
        // FactoryIssue.ArtisanID (reassign updates that row; one issue per order line).
        // "done" = line fully completed (e.g. finished without a factory issue).
        [ShopPage] // artisan names on order list / incomplete works / money receipt: not tied to Factory Issue
        [HttpGet("order-artisans")]
        public IActionResult GetOrderArtisans(int institutionId, string? orderIds = null)
        {
            try
            {
                var ids = (orderIds ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .Select(x => int.TryParse(x, out var n) ? n : 0)
                    .Where(n => n > 0).Distinct().Take(1000).ToList();
                if (ids.Count == 0) return Ok(new { success = true, data = Array.Empty<object>() });

                using var con = _context.CreateConnection();
                bool pieces = FactoryPieces.HasCompletedQuantity(con);
                var data = con.Query($@"
                    SELECT OL.OrderID AS orderId, OL.OrderListID AS orderListId, OL.OrderList_SN AS sn,
                           D.Dress_Name AS dressName, OL.DressQuantity AS qty,
                           CAST(CASE WHEN ISNULL(OL.DressQuantity, 0) > 0
                                      AND ISNULL(OL.WorkCompleteQuantity, 0) >= OL.DressQuantity THEN 1 ELSE 0 END AS bit) AS done,
                           FI.ArtisanID AS artisanId, A.Name AS artisanName, FI.Status AS status,
                           FI.Quantity AS fiQty, FI.Done AS fiDone,
                           -- line done for the order's progress: nothing left to sew (pieces are recorded as work-complete)
                           CAST(CASE WHEN ISNULL(OL.DressQuantity, 0) - ISNULL(OL.WorkCompleteQuantity, 0) <= 0
                                     THEN 1 ELSE 0 END AS bit) AS lineDone
                    FROM OrderList OL
                    LEFT JOIN Dress D ON D.DressID = OL.DressID
                    OUTER APPLY (SELECT TOP 1 F.ArtisanID, F.Status, F.Quantity, {FactoryPieces.DoneExpr(pieces, "F")} AS Done
                                 FROM FactoryIssue F
                                 WHERE F.InstitutionID = @InstitutionID AND F.OrderListID = OL.OrderListID
                                 ORDER BY F.FactoryIssueID DESC) FI
                    LEFT JOIN Artisan A ON A.ArtisanID = FI.ArtisanID AND A.InstitutionID = @InstitutionID
                    WHERE OL.InstitutionID = @InstitutionID AND OL.OrderID IN @Ids
                    ORDER BY OL.OrderID, OL.OrderList_SN, OL.OrderListID",
                    new { InstitutionID = institutionId, Ids = ids });
                return Ok(new { success = true, data });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpGet("report")]
        public IActionResult GetReport(int institutionId, int? artisanId = null, string? dateFrom = null, string? dateTo = null)
        {
            try
            {
                using var con = _context.CreateConnection();
                string done = FactoryPieces.DoneExpr(FactoryPieces.HasCompletedQuantity(con), "FI");   // pieces submitted
                var data = con.Query($@"
                    SELECT
                        A.ArtisanID,
                        A.Name AS ArtisanName,
                        A.Phone,
                        A.IsActive,
                        ISNULL(SUM(FI.Quantity), 0) AS AssignedQty,
                        ISNULL(SUM({done}), 0) AS CompletedQty,
                        ISNULL(SUM(CASE WHEN FI.Status=N'Assigned' THEN FI.Quantity - {done} ELSE 0 END), 0) AS RemainingQty,
                        COUNT(FI.FactoryIssueID) AS IssueCount
                    FROM Artisan A
                    LEFT JOIN FactoryIssue FI
                        ON FI.ArtisanID = A.ArtisanID AND FI.InstitutionID = A.InstitutionID
                       AND (@DateFrom IS NULL OR FI.AssignedDate >= @DateFrom)
                       AND (@DateTo IS NULL OR FI.AssignedDate < DATEADD(day, 1, @DateTo))
                    WHERE A.InstitutionID=@InstitutionID
                      AND (@ArtisanId IS NULL OR A.ArtisanID=@ArtisanId)
                    GROUP BY A.ArtisanID, A.Name, A.Phone, A.IsActive
                    ORDER BY A.Name",
                    new {
                        InstitutionID = institutionId,
                        ArtisanId = artisanId,
                        DateFrom = string.IsNullOrWhiteSpace(dateFrom) ? (DateTime?)null : DateTime.Parse(dateFrom),
                        DateTo = string.IsNullOrWhiteSpace(dateTo) ? (DateTime?)null : DateTime.Parse(dateTo)
                    });

                var dresses = con.Query($@"
                    SELECT
                        D.Dress_Name AS DressName,
                        ISNULL(SUM(FI.Quantity), 0) AS AssignedQty,
                        ISNULL(SUM({done}), 0) AS CompletedQty,
                        ISNULL(SUM(CASE WHEN FI.Status=N'Assigned' THEN FI.Quantity - {done} ELSE 0 END), 0) AS RemainingQty
                    FROM FactoryIssue FI
                    INNER JOIN OrderList OL ON FI.OrderListID = OL.OrderListID
                    INNER JOIN Dress D ON OL.DressID = D.DressID
                    WHERE FI.InstitutionID=@InstitutionID
                      AND (@ArtisanId IS NULL OR FI.ArtisanID=@ArtisanId)
                      AND (@DateFrom IS NULL OR FI.AssignedDate >= @DateFrom)
                      AND (@DateTo IS NULL OR FI.AssignedDate < DATEADD(day, 1, @DateTo))
                    GROUP BY D.Dress_Name
                    ORDER BY D.Dress_Name",
                    new {
                        InstitutionID = institutionId,
                        ArtisanId = artisanId,
                        DateFrom = string.IsNullOrWhiteSpace(dateFrom) ? (DateTime?)null : DateTime.Parse(dateFrom),
                        DateTo = string.IsNullOrWhiteSpace(dateTo) ? (DateTime?)null : DateTime.Parse(dateTo)
                    });

                return Ok(new { success = true, data, dresses });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }
    }

    public class ArtisanModel
    {
        public int InstitutionID { get; set; }
        public int RegistrationID { get; set; }
        public string Name { get; set; } = "";
        public string? Phone { get; set; }
    }

    public class ArtisanUpdateModel
    {
        public int ArtisanID { get; set; }
        public int InstitutionID { get; set; }
        public string Name { get; set; } = "";
        public string? Phone { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class FactoryIssueCreateModel
    {
        public int InstitutionID { get; set; }
        public int RegistrationID { get; set; }
        public int OrderListID { get; set; }
        public int ArtisanID { get; set; }
        public int Quantity { get; set; }
        public string? Notes { get; set; }
    }

    public class FactoryCompleteModel
    {
        public int FactoryIssueID { get; set; }
        public int InstitutionID { get; set; }
        public int RegistrationID { get; set; }   // set from the token (ShopScoped); recorded on the work-complete rows
        public int? Quantity { get; set; }         // pieces submitted now; empty / 0 = all open pieces
        public int? ExpectedCompleted { get; set; } // pieces done as shown on the page (stale / repeated submit -> 409)
    }

    public class FactoryBulkCompleteModel
    {
        public int InstitutionID { get; set; }
        public int RegistrationID { get; set; }
        public List<int>? FactoryIssueIDs { get; set; }
    }

    public class FactoryReassignModel
    {
        public int FactoryIssueID { get; set; }
        public int InstitutionID { get; set; }
        public int ArtisanID { get; set; }
        public string? Notes { get; set; }
    }
}
