using System.Data;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TailorBD.API.Data;
using TailorBD.API.Helpers;

namespace TailorBD.API.Controllers
{
    /// <summary>
    /// Work ledger of cutting masters / artisans (কারিগর): which completed dress earned how much,
    /// how much of it is covered by payments, and the payable balance for the payment token.
    ///
    /// Sources (no schema change):
    ///  - earnings  = CuttingIssue / FactoryIssue rows with Status 'Completed' and EarnedAmount
    ///                (EarnedAmount is stored at completion, so later dress-cost edits do not change it);
    ///                a factory assignment with some pieces submitted (still 'Assigned') is included
    ///                with the pieces done so far (EarnedAmount accumulates per submission);
    ///  - payments  = WorkerPayment rows (OTP payment), which are against the total balance, not items;
    ///  - payable   = the worker's Balance column (+EarnedAmount on completion, -Amount on payment).
    /// Payments are allocated to earnings FIFO (oldest completion first) at read time.
    /// If Balance differs from (earned - paid) — e.g. items completed before earnings were recorded,
    /// or a manual balance edit — the difference is shown as an "opening / unmatched" line so the
    /// totals always equal Balance.
    /// Other payments (অন্যান্য পাওনা: extra design / alteration / other, table WorkerExtraEarning,
    /// Database\WorkerExtraEarning\01_create_WorkerExtraEarning.sql) are earnings too: they add to Balance
    /// when saved and are matched FIFO together with the work items (kind "extra"), so they show on the
    /// ledger and the payment token until paid. Only a fully unpaid entry can be edited / deleted.
    /// Payments may exceed the balance (advance, Balance &lt; 0): the excess stays in the FIFO pool and
    /// covers later earnings automatically (summary.advance).
    /// Login required; shop from the token (ShopScoped), like Cutting/Factory.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    [ShopScoped]
    [ShopPage("/worker-payments.html")] // Shop Page Access: 403 when the Authority switched this page off for the shop
    public class WorkerLedgerController : ControllerBase
    {
        private readonly TailorBdContext _context;
        public WorkerLedgerController(TailorBdContext context) { _context = context; }

        private sealed class Kind
        {
            public string Type = "", Table = "", Id = "", IssueTable = "", IssueId = "";
        }

        // whitelist: the only table/column names that ever reach the SQL text
        private static Kind? GetKind(string? workerType) => (workerType ?? "").Trim() switch
        {
            "CuttingMaster" => new Kind { Type = "CuttingMaster", Table = "CuttingMaster", Id = "CuttingMasterID", IssueTable = "CuttingIssue", IssueId = "CuttingIssueID" },
            "Artisan"       => new Kind { Type = "Artisan",       Table = "Artisan",       Id = "ArtisanID",       IssueTable = "FactoryIssue", IssueId = "FactoryIssueID" },
            _ => null
        };

        private const decimal Cent = 0.005m;

        // earned rows: completed, or partly submitted (factory pieces; EarnedAmount > 0 while still Assigned)
        private const string EarnedFilter = "(I.Status = N'Completed' OR ISNULL(I.EarnedAmount, 0) > 0)";
        // pieces the earnings are for (factory: pieces submitted; cutting: the whole issue)
        private static string DoneQty(Kind k, IDbConnection con, IDbTransaction? tx = null) =>
            k.IssueTable == "FactoryIssue" ? FactoryPieces.DoneExpr(FactoryPieces.HasCompletedQuantity(con, tx), "I") : "I.Quantity";

        // ── All workers of a type with total earned / paid / payable ─────────
        [HttpGet("workers")]
        public IActionResult GetWorkers(int institutionId, string? workerType, string? search = null, string? status = null, int page = 1, int pageSize = 100)
        {
            try
            {
                var k = GetKind(workerType);
                if (k == null) return BadRequest(new { success = false, message = "workerType must be CuttingMaster or Artisan" });
                if (page < 1) page = 1;
                if (pageSize <= 0 || pageSize > 500) pageSize = 100;

                using var con = _context.CreateConnection();
                string doneQty = DoneQty(k, con);
                bool hasExtra = WorkerExtras.HasTable(con);
                string extraCol = hasExtra ? "ISNULL(X.Extra, 0)" : "CAST(0 AS DECIMAL(18,2))";
                string extraApply = hasExtra ? $@"
                    OUTER APPLY (
                        SELECT SUM(X.Amount) AS Extra
                        FROM WorkerExtraEarning X
                        WHERE X.InstitutionID = W.InstitutionID AND X.WorkerType = @Type AND X.WorkerID = W.{k.Id}) X" : "";
                var rows = con.Query<WorkerAgg>($@"
                    SELECT W.{k.Id} AS WorkerID, W.Name, W.Phone, W.IsActive, ISNULL(W.Balance, 0) AS Balance,
                           ISNULL(E.Earned, 0) AS Earned, ISNULL(E.Items, 0) AS Items, ISNULL(E.Qty, 0) AS Qty,
                           ISNULL(E.Uncredited, 0) AS Uncredited, {extraCol} AS Extra,
                           ISNULL(P.Paid, 0) AS Paid, P.LastPaid
                    FROM {k.Table} W
                    OUTER APPLY (
                        SELECT SUM(I.EarnedAmount) AS Earned,
                               SUM(CASE WHEN I.EarnedAmount IS NOT NULL THEN 1 ELSE 0 END) AS Items,
                               SUM(CASE WHEN I.EarnedAmount IS NOT NULL THEN {doneQty} ELSE 0 END) AS Qty,
                               SUM(CASE WHEN I.EarnedAmount IS NULL THEN 1 ELSE 0 END) AS Uncredited
                        FROM {k.IssueTable} I
                        WHERE I.InstitutionID = W.InstitutionID AND I.{k.Id} = W.{k.Id} AND {EarnedFilter}) E
                    OUTER APPLY (
                        SELECT SUM(WP.Amount) AS Paid, MAX(WP.PaymentDate) AS LastPaid
                        FROM WorkerPayment WP
                        WHERE WP.InstitutionID = W.InstitutionID AND WP.WorkerType = @Type AND WP.WorkerID = W.{k.Id}) P{extraApply}
                    WHERE W.InstitutionID = @InstitutionID
                      AND (@Search IS NULL OR W.Name LIKE @Search OR W.Phone LIKE @Search)
                    ORDER BY W.Name",
                    new
                    {
                        InstitutionID = institutionId,
                        Type = k.Type,
                        Search = string.IsNullOrWhiteSpace(search) ? null : "%" + search.Trim() + "%"
                    }).ToList();

                var list = rows.Select(r =>
                {
                    decimal diff = r.Balance - (r.Earned + r.Extra - r.Paid); // opening (+) / unmatched reduction (-)
                    decimal earned = r.Earned + r.Extra + Math.Max(diff, 0);
                    decimal paid = r.Paid + Math.Max(-diff, 0);
                    string st = r.Balance > Cent ? (paid > Cent ? "partial" : "unpaid")
                              : (earned > Cent ? "paid" : "none");
                    return new
                    {
                        workerId = r.WorkerID, name = r.Name, phone = r.Phone, isActive = r.IsActive,
                        items = r.Items, qty = r.Qty, earned, extra = r.Extra, paid, payable = r.Balance,
                        advance = Math.Max(-r.Balance, 0),                     // paid in advance (Balance < 0)
                        opening = Math.Max(diff, 0), adjustment = Math.Max(-diff, 0), uncredited = r.Uncredited,
                        lastPaid = r.LastPaid?.ToString("yyyy-MM-dd HH:mm"), status = st
                    };
                }).ToList();

                var filtered = list.Where(x => MatchStatus(x.status, status)).ToList();
                var pageRows = filtered.Skip((page - 1) * pageSize).Take(pageSize).ToList();
                return Ok(new
                {
                    success = true,
                    workerType = k.Type,
                    total = filtered.Count,
                    page, pageSize,
                    totals = new
                    {
                        earned = filtered.Sum(x => x.earned),
                        paid = filtered.Sum(x => x.paid),
                        payable = filtered.Sum(x => x.payable)
                    },
                    data = pageRows
                });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ── One worker: earnings with FIFO-allocated payments ─────────────────
        [HttpGet("ledger")]
        public IActionResult GetLedger(int institutionId, string? workerType, int workerId, string? dateFrom = null, string? dateTo = null,
                                       string? status = null, int page = 1, int pageSize = 100, bool includeDue = false)
        {
            try
            {
                var k = GetKind(workerType);
                if (k == null) return BadRequest(new { success = false, message = "workerType must be CuttingMaster or Artisan" });
                if (page < 1) page = 1;
                if (pageSize <= 0 || pageSize > 500) pageSize = 100;
                DateTime? from = string.IsNullOrWhiteSpace(dateFrom) ? null : DateTime.Parse(dateFrom).Date;
                DateTime? toExcl = string.IsNullOrWhiteSpace(dateTo) ? null : DateTime.Parse(dateTo).Date.AddDays(1);

                using var con = _context.CreateConnection();
                var data = LoadLedger(con, k, institutionId, workerId);
                var w = data.Worker;
                if (w == null) return NotFound(new { success = false, message = "Worker not found" });
                var items = data.Items;
                var pay = data.Pay;
                int uncredited = data.Uncredited;

                var led = Allocate(w.Balance, items, pay.Paid);

                var shown = led.Rows.Where(r =>
                        (from == null || (r.Date != null && r.Date >= from)) &&
                        (toExcl == null || (r.Date != null && r.Date < toExcl)) &&
                        MatchStatus(r.Status, status))
                    .ToList();

                var dueRows = led.Rows.Where(r => r.Status == "unpaid" || r.Status == "partial").ToList();
                var dueByDress = dueRows.Where(r => r.Kind == "work")
                    .GroupBy(r => r.Dress ?? "-")
                    .Select(g => new { dress = g.Key, qty = g.Sum(x => x.Qty), items = g.Count(), due = g.Sum(x => x.Due) })
                    .OrderByDescending(x => x.due).ToList();
                decimal openingDue = dueRows.Where(r => r.Kind == "opening").Sum(r => r.Due);
                var dueExtras = dueRows.Where(r => r.Kind == "extra")
                    .GroupBy(r => r.ExtraType ?? "Other")
                    .Select(g => new { type = g.Key, items = g.Count(), due = g.Sum(x => x.Due) })
                    .OrderByDescending(x => x.due).ToList();

                return Ok(new
                {
                    success = true,
                    workerType = k.Type,
                    worker = new { workerId = w.WorkerID, name = w.Name, phone = w.Phone, isActive = w.IsActive },
                    summary = new
                    {
                        earned = led.Earned,              // work earnings + opening line
                        workEarned = items.Where(i => i.Kind != "extra").Sum(i => i.Amount ?? 0),
                        extraEarned = items.Where(i => i.Kind == "extra").Sum(i => i.Amount ?? 0),   // other payments (অন্যান্য পাওনা)
                        paid = pay.Paid,
                        adjustment = led.Adjustment,      // unmatched reduction of Balance (shown as paid/adjusted)
                        opening = led.Opening,
                        payable = w.Balance,              // == earned - paid - adjustment
                        advance = led.Advance,            // payments beyond all earnings (Balance < 0)
                        payments = pay.Payments,
                        lastPaid = pay.LastPaid?.ToString("yyyy-MM-dd HH:mm"),
                        uncredited
                    },
                    range = new
                    {
                        count = shown.Count,
                        qty = shown.Sum(r => r.Qty),
                        earned = shown.Sum(r => r.Amount),
                        paid = shown.Sum(r => r.Paid),
                        due = shown.Sum(r => r.Due)
                    },
                    total = shown.Count,
                    page, pageSize,
                    data = shown.Skip((page - 1) * pageSize).Take(pageSize).Select(ToDto),
                    dueByDress,
                    dueExtras,
                    openingDue,
                    extrasAvailable = data.ExtrasAvailable,
                    dueItems = includeDue ? dueRows.Take(500).Select(ToDto) : null
                });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ── shared loader: worker + earned items (work + other payments) + payment total ─────
        internal sealed class LedgerData
        {
            public WorkerRow? Worker;
            public List<ItemRow> Items = new();
            public PayAgg Pay = new();
            public int Uncredited;
            public bool ExtrasAvailable;
        }

        /// <summary>Loads everything Allocate needs for one worker (shop-scoped). With a transaction and
        /// lockWorker the worker row is read WITH (UPDLOCK) so a concurrent balance change waits.</summary>
        private static LedgerData LoadLedger(IDbConnection con, Kind k, int institutionId, int workerId, IDbTransaction? tx = null, bool lockWorker = false)
        {
            string doneQty = DoneQty(k, con, tx);
            bool hasExtra = WorkerExtras.HasTable(con, tx);
            string hint = lockWorker ? " WITH (UPDLOCK, ROWLOCK)" : "";
            using var multi = con.QueryMultiple($@"
                SELECT W.{k.Id} AS WorkerID, W.Name, W.Phone, W.IsActive, ISNULL(W.Balance, 0) AS Balance, W.CreatedDate
                FROM {k.Table} W{hint}
                WHERE W.{k.Id} = @WorkerID AND W.InstitutionID = @InstitutionID;

                SELECT I.{k.IssueId} AS ItemID, ISNULL(I.CompletedDate, I.AssignedDate) AS WorkDate,
                       O.OrderSerialNumber AS OrderNo, C.CustomerName, D.Dress_Name AS DressName,
                       {doneQty} AS Quantity, I.Quantity AS OfQuantity, I.EarnedAmount AS Amount
                FROM {k.IssueTable} I
                INNER JOIN {k.Table} W ON W.{k.Id} = I.{k.Id} AND W.InstitutionID = I.InstitutionID
                LEFT JOIN [Order] O ON O.OrderID = I.OrderID AND O.InstitutionID = I.InstitutionID
                LEFT JOIN Customer C ON C.CustomerID = O.CustomerID
                LEFT JOIN OrderList OL ON OL.OrderListID = I.OrderListID
                LEFT JOIN Dress D ON D.DressID = OL.DressID
                WHERE I.InstitutionID = @InstitutionID AND I.{k.Id} = @WorkerID
                  AND {EarnedFilter} AND I.EarnedAmount IS NOT NULL
                ORDER BY ISNULL(I.CompletedDate, I.AssignedDate), I.{k.IssueId};

                SELECT ISNULL(SUM(Amount), 0) AS Paid, COUNT(1) AS Payments, MAX(PaymentDate) AS LastPaid
                FROM WorkerPayment
                WHERE InstitutionID = @InstitutionID AND WorkerType = @Type AND WorkerID = @WorkerID;

                SELECT COUNT(1) FROM {k.IssueTable}
                WHERE InstitutionID = @InstitutionID AND {k.Id} = @WorkerID AND Status = N'Completed' AND EarnedAmount IS NULL;
                {(hasExtra ? @"
                SELECT X.WorkerExtraEarningID AS ItemID, X.EarningDate AS WorkDate,
                       O.OrderSerialNumber AS OrderNo, C.CustomerName, X.DressRef AS DressName,
                       0 AS Quantity, 0 AS OfQuantity, X.Amount, N'extra' AS Kind, X.EarningType AS ExtraType, X.Notes AS Note
                FROM WorkerExtraEarning X
                LEFT JOIN [Order] O ON O.OrderID = X.OrderID AND O.InstitutionID = X.InstitutionID
                LEFT JOIN Customer C ON C.CustomerID = O.CustomerID
                WHERE X.InstitutionID = @InstitutionID AND X.WorkerType = @Type AND X.WorkerID = @WorkerID;" : "")}",
                new { InstitutionID = institutionId, WorkerID = workerId, Type = k.Type }, tx);

            var d = new LedgerData { ExtrasAvailable = hasExtra };
            d.Worker = multi.ReadFirstOrDefault<WorkerRow>();
            var work = multi.Read<ItemRow>().ToList();
            d.Pay = multi.ReadFirst<PayAgg>();
            d.Uncredited = multi.ReadFirst<int>();
            if (hasExtra)
            {
                var extras = multi.Read<ItemRow>().ToList();
                // one FIFO timeline: oldest first; on the same moment work before other payments
                d.Items = work.Concat(extras)
                    .OrderBy(i => i.WorkDate ?? DateTime.MinValue)
                    .ThenBy(i => i.Kind == "extra" ? 1 : 0)
                    .ThenBy(i => i.ItemID)
                    .ToList();
            }
            else d.Items = work;
            return d;
        }

        // ── Other payments (অন্যান্য পাওনা): list / add / edit / delete ─────────────────
        private static readonly string[] ExtraTypes = { "ExtraDesign", "Alter", "Other" };
        private const string NoExtraTable = "অন্যান্য পাওনার টেবিল এখনো তৈরি হয়নি (01_create_WorkerExtraEarning.sql রান করুন) / Other-payment table missing: run 01_create_WorkerExtraEarning.sql";

        /// <summary>A worker's other payments with FIFO status (paid / partial / unpaid) + balance summary.</summary>
        [HttpGet("extras")]
        public IActionResult GetExtras(int institutionId, string? workerType, int workerId)
        {
            try
            {
                var k = GetKind(workerType);
                if (k == null) return BadRequest(new { success = false, message = "workerType must be CuttingMaster or Artisan" });
                using var con = _context.CreateConnection();
                var data = LoadLedger(con, k, institutionId, workerId);
                if (data.Worker == null) return NotFound(new { success = false, message = "Worker not found" });
                var led = Allocate(data.Worker.Balance, data.Items, data.Pay.Paid);
                var extras = led.Rows.Where(r => r.Kind == "extra")
                    .OrderByDescending(r => r.Date).ThenByDescending(r => r.ItemId)
                    .Select(r => new
                    {
                        id = r.ItemId, type = r.ExtraType, date = r.Date?.ToString("yyyy-MM-dd HH:mm"),
                        orderNo = r.OrderNo, customer = r.Customer, dressRef = r.Dress, note = r.Note,
                        amount = r.Amount, paid = r.Paid, due = r.Due, status = r.Status,
                        canEdit = r.Paid <= Cent
                    }).ToList();
                return Ok(new
                {
                    success = true,
                    available = data.ExtrasAvailable,
                    workerType = k.Type,
                    worker = new { workerId = data.Worker.WorkerID, name = data.Worker.Name, phone = data.Worker.Phone, isActive = data.Worker.IsActive },
                    summary = new
                    {
                        earned = led.Earned,
                        paid = data.Pay.Paid + led.Adjustment,
                        payable = data.Worker.Balance,
                        advance = Math.Max(-data.Worker.Balance, 0),
                        extraDue = extras.Sum(x => x.due),
                        lastPaid = data.Pay.LastPaid?.ToString("yyyy-MM-dd HH:mm")
                    },
                    data = extras
                });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpPost("extras")]
        public IActionResult AddExtra([FromBody] WorkerExtraModel m)
        {
            try
            {
                var k = GetKind(m?.WorkerType);
                if (m == null || k == null) return BadRequest(new { success = false, message = "workerType must be CuttingMaster or Artisan" });
                var err = ValidateExtra(m, out var type, out var date);
                if (err != null) return BadRequest(new { success = false, message = err });

                using var con = _context.CreateConnection();
                con.Open();
                if (!WorkerExtras.HasTable(con)) return BadRequest(new { success = false, message = NoExtraTable });
                using var tx = con.BeginTransaction();
                var bal = con.QueryFirstOrDefault<decimal?>(
                    $"SELECT ISNULL(Balance, 0) FROM {k.Table} WITH (UPDLOCK, ROWLOCK) WHERE {k.Id} = @Id AND InstitutionID = @InstitutionID",
                    new { Id = m.WorkerID, m.InstitutionID }, tx);
                if (bal == null) return NotFound(new { success = false, message = "কর্মী পাওয়া যায়নি / Worker not found" });
                int? orderId = ResolveOrder(con, tx, m.InstitutionID, m.OrderNo, out var orderErr);
                if (orderErr != null) return BadRequest(new { success = false, message = orderErr });

                int id = con.ExecuteScalar<int>(@"
                    INSERT INTO WorkerExtraEarning
                        (InstitutionID, RegistrationID, WorkerType, WorkerID, EarningType, Amount, EarningDate, OrderID, DressRef, Notes)
                    VALUES (@InstitutionID, @RegistrationID, @Type, @WorkerID, @EarningType, @Amount, @Date, @OrderID, @DressRef, @Notes);
                    SELECT CAST(SCOPE_IDENTITY() AS INT);",
                    new
                    {
                        m.InstitutionID, m.RegistrationID, Type = k.Type, m.WorkerID, EarningType = type, m.Amount, Date = date,
                        OrderID = orderId, DressRef = Clip(m.DressRef, 200), Notes = Clip(m.Notes, 500)
                    }, tx);
                con.Execute($"UPDATE {k.Table} SET Balance = ISNULL(Balance, 0) + @Amount WHERE {k.Id} = @Id AND InstitutionID = @InstitutionID",
                    new { m.Amount, Id = m.WorkerID, m.InstitutionID }, tx);
                tx.Commit();
                return Ok(new { success = true, id, newBalance = bal.Value + m.Amount });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpPut("extras")]
        public IActionResult UpdateExtra([FromBody] WorkerExtraModel m)
        {
            try
            {
                if (m == null || m.WorkerExtraEarningID <= 0) return BadRequest(new { success = false, message = "Invalid request" });
                var err = ValidateExtra(m, out var type, out var date);
                if (err != null) return BadRequest(new { success = false, message = err });

                using var con = _context.CreateConnection();
                con.Open();
                if (!WorkerExtras.HasTable(con)) return BadRequest(new { success = false, message = NoExtraTable });
                using var tx = con.BeginTransaction();
                var cur = LockUnpaidExtra(con, tx, m.InstitutionID, m.WorkerExtraEarningID, out var k, out var lockErr);
                if (cur == null || k == null) return BadRequest(new { success = false, message = lockErr });
                int? orderId = ResolveOrder(con, tx, m.InstitutionID, m.OrderNo, out var orderErr);
                if (orderErr != null) return BadRequest(new { success = false, message = orderErr });

                con.Execute(@"
                    UPDATE WorkerExtraEarning
                    SET EarningType = @EarningType, Amount = @Amount, EarningDate = @Date, OrderID = @OrderID,
                        DressRef = @DressRef, Notes = @Notes, UpdatedDate = GETDATE(), UpdatedBy = @RegistrationID
                    WHERE WorkerExtraEarningID = @Id AND InstitutionID = @InstitutionID",
                    new
                    {
                        EarningType = type, m.Amount, Date = date, OrderID = orderId, DressRef = Clip(m.DressRef, 200), Notes = Clip(m.Notes, 500),
                        m.RegistrationID, Id = m.WorkerExtraEarningID, m.InstitutionID
                    }, tx);
                decimal delta = m.Amount - cur.Amount;
                if (delta != 0)
                    con.Execute($"UPDATE {k.Table} SET Balance = ISNULL(Balance, 0) + @Delta WHERE {k.Id} = @Id AND InstitutionID = @InstitutionID",
                        new { Delta = delta, Id = cur.WorkerID, m.InstitutionID }, tx);
                tx.Commit();
                return Ok(new { success = true });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpDelete("extras")]
        public IActionResult DeleteExtra(int id, int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                con.Open();
                if (!WorkerExtras.HasTable(con)) return BadRequest(new { success = false, message = NoExtraTable });
                using var tx = con.BeginTransaction();
                var cur = LockUnpaidExtra(con, tx, institutionId, id, out var k, out var lockErr);
                if (cur == null || k == null) return BadRequest(new { success = false, message = lockErr });
                con.Execute("DELETE FROM WorkerExtraEarning WHERE WorkerExtraEarningID = @Id AND InstitutionID = @InstitutionID",
                    new { Id = id, InstitutionID = institutionId }, tx);
                con.Execute($"UPDATE {k.Table} SET Balance = ISNULL(Balance, 0) - @Amount WHERE {k.Id} = @Id AND InstitutionID = @InstitutionID",
                    new { cur.Amount, Id = cur.WorkerID, InstitutionID = institutionId }, tx);
                tx.Commit();
                return Ok(new { success = true });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        private sealed class ExtraRow
        {
            public int WorkerExtraEarningID { get; set; }
            public string WorkerType { get; set; } = "";
            public int WorkerID { get; set; }
            public decimal Amount { get; set; }
        }

        /// <summary>Loads the entry of this shop, locks the worker row and checks with the FIFO ledger
        /// that nothing has been paid against it yet (only an unpaid entry may change).</summary>
        private static ExtraRow? LockUnpaidExtra(IDbConnection con, IDbTransaction tx, int institutionId, int id, out Kind? k, out string? error)
        {
            k = null; error = null;
            var cur = con.QueryFirstOrDefault<ExtraRow>(@"
                SELECT WorkerExtraEarningID, WorkerType, WorkerID, Amount
                FROM WorkerExtraEarning WITH (UPDLOCK, ROWLOCK)
                WHERE WorkerExtraEarningID = @Id AND InstitutionID = @InstitutionID",
                new { Id = id, InstitutionID = institutionId }, tx);
            if (cur == null) { error = "এন্ট্রি পাওয়া যায়নি / Entry not found"; return null; }
            k = GetKind(cur.WorkerType);
            if (k == null) { error = "Invalid worker type"; return null; }
            var data = LoadLedger(con, k, institutionId, cur.WorkerID, tx, lockWorker: true);
            if (data.Worker == null) { error = "কর্মী পাওয়া যায়নি / Worker not found"; return null; }
            var led = Allocate(data.Worker.Balance, data.Items, data.Pay.Paid);
            var row = led.Rows.FirstOrDefault(r => r.Kind == "extra" && r.ItemId == id);
            if (row != null && row.Paid > Cent)
            {
                error = "এই পাওনার বিপরীতে পেমেন্ট হয়ে গেছে (" + (row.Status == "paid" ? "পরিশোধিত" : "আংশিক") +
                        ") — এডিট/ডিলিট করা যাবে না / Already (partly) paid: cannot edit or delete";
                return null;
            }
            return cur;
        }

        private static string? ValidateExtra(WorkerExtraModel m, out string type, out DateTime date)
        {
            type = ExtraTypes.FirstOrDefault(x => string.Equals(x, (m.EarningType ?? "").Trim(), StringComparison.OrdinalIgnoreCase)) ?? "";
            date = DateTime.Now;
            if (m.InstitutionID <= 0) return "Institution required";
            if (type == "") return "ধরন বাছাই করুন (এক্সট্রা ডিজাইন / অলটার / অন্যান্য) / Choose a type";
            if (m.Amount <= 0) return "পরিমাণ ০ এর বেশি দিন / Amount must be greater than 0";
            if (m.Amount > 10_000_000m) return "পরিমাণ অনেক বেশি / Amount too large";
            if (decimal.Round(m.Amount, 2) != m.Amount) return "পরিমাণে সর্বোচ্চ ২ দশমিক / At most 2 decimals";
            if (!string.IsNullOrWhiteSpace(m.EarningDate))
            {
                if (!DateTime.TryParse(m.EarningDate, out var d)) return "তারিখ সঠিক নয় / Invalid date";
                if (d.Date > DateTime.Today.AddDays(1)) return "ভবিষ্যতের তারিখ দেওয়া যাবে না / Date is in the future";
                // keep the time of day so entries of the same day stay in entry order (FIFO)
                date = d.Date == DateTime.Today ? DateTime.Now : d.Date.AddHours(12);
            }
            return null;
        }

        /// <summary>Optional order reference: the order no. (OrderSerialNumber) of THIS shop.</summary>
        private static int? ResolveOrder(IDbConnection con, IDbTransaction tx, int institutionId, int? orderNo, out string? error)
        {
            error = null;
            if (orderNo == null || orderNo <= 0) return null;
            var id = con.QueryFirstOrDefault<int?>(
                "SELECT TOP 1 OrderID FROM [Order] WHERE InstitutionID = @InstitutionID AND OrderSerialNumber = @No ORDER BY OrderID DESC",
                new { InstitutionID = institutionId, No = orderNo }, tx);
            if (id == null) error = "অর্ডার নং " + orderNo + " পাওয়া যায়নি / Order not found";
            return id;
        }

        private static string? Clip(string? s, int max)
        {
            if (string.IsNullOrWhiteSpace(s)) return null;
            s = s.Trim();
            return s.Length > max ? s.Substring(0, max) : s;
        }

        private static object ToDto(LedgerRow r) => new
        {
            itemId = r.ItemId, kind = r.Kind,
            date = r.Date?.ToString("yyyy-MM-dd HH:mm"),
            orderNo = r.OrderNo, customer = r.Customer, dress = r.Dress,
            qty = r.Qty, ofQty = r.OfQty, rate = r.Rate, amount = r.Amount, paid = r.Paid, due = r.Due, status = r.Status,
            extraType = r.ExtraType, note = r.Note
        };

        /// <summary>status filter: "" / "all" = everything; one value ("paid", "partial", "unpaid", "none", "due")
        /// or a comma-separated list of them (e.g. "partial,unpaid") = any of those.</summary>
        private static bool MatchStatus(string rowStatus, string? filter)
        {
            var parts = (filter ?? "").ToLowerInvariant()
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (parts.Length == 0 || parts.Contains("all")) return true;
            foreach (var f in parts)
            {
                if (f == "due" ? (rowStatus == "unpaid" || rowStatus == "partial") : rowStatus == f) return true;
            }
            return false;
        }

        /// <summary>FIFO: payments (plus any unmatched reduction) cover the oldest earnings first.</summary>
        internal static LedgerResult Allocate(decimal balance, List<ItemRow> items, decimal paid)
        {
            decimal workEarned = items.Sum(i => i.Amount ?? 0);
            decimal diff = balance - (workEarned - paid);
            var res = new LedgerResult { Opening = Math.Max(diff, 0), Adjustment = Math.Max(-diff, 0) };
            var rows = new List<LedgerRow>();
            if (res.Opening > Cent)
                rows.Add(new LedgerRow { Kind = "opening", Amount = res.Opening, Qty = 0 });
            foreach (var i in items)
            {
                decimal amt = i.Amount ?? 0;
                rows.Add(new LedgerRow
                {
                    Kind = i.Kind == "extra" ? "extra" : "work", ItemId = i.ItemID, Date = i.WorkDate, OrderNo = i.OrderNo, Customer = i.CustomerName,
                    Dress = i.DressName, Qty = i.Quantity, OfQty = i.OfQuantity ?? i.Quantity, Amount = amt,
                    Rate = i.Quantity > 0 ? Math.Round(amt / i.Quantity, 2) : amt,
                    ExtraType = i.ExtraType, Note = i.Note
                });
            }
            decimal pool = paid + res.Adjustment;
            foreach (var r in rows)
            {
                decimal a = Math.Min(r.Amount, Math.Max(pool, 0));
                pool -= a;
                r.Paid = a;
                r.Due = r.Amount - a;
                r.Status = r.Amount <= Cent ? "none" : (r.Due <= Cent ? "paid" : (a > Cent ? "partial" : "unpaid"));
            }
            res.Rows = rows;
            res.Earned = workEarned + res.Opening;
            res.Advance = Math.Max(pool, 0);
            return res;
        }

        internal sealed class LedgerResult
        {
            public List<LedgerRow> Rows = new();
            public decimal Earned, Opening, Adjustment, Advance;
        }
        internal sealed class LedgerRow
        {
            public int? ItemId; public string Kind = "work"; public DateTime? Date; public int? OrderNo;
            public string? Customer, Dress; public int Qty, OfQty; public decimal Rate, Amount, Paid, Due;
            public string Status = "unpaid";
            public string? ExtraType, Note;   // kind "extra" (other payment)
        }
        public sealed class ItemRow
        {
            public int ItemID { get; set; }
            public DateTime? WorkDate { get; set; }
            public int? OrderNo { get; set; }
            public string? CustomerName { get; set; }
            public string? DressName { get; set; }
            public int Quantity { get; set; }       // pieces earned for
            public int? OfQuantity { get; set; }    // pieces of the assignment (more than Quantity while partly submitted)
            public decimal? Amount { get; set; }
            public string? Kind { get; set; }        // null = work item, "extra" = other payment (WorkerExtraEarning)
            public string? ExtraType { get; set; }   // ExtraDesign | Alter | Other
            public string? Note { get; set; }
        }
        public sealed class WorkerRow
        {
            public int WorkerID { get; set; }
            public string Name { get; set; } = "";
            public string? Phone { get; set; }
            public bool IsActive { get; set; }
            public decimal Balance { get; set; }
            public DateTime? CreatedDate { get; set; }
        }
        public sealed class PayAgg
        {
            public decimal Paid { get; set; }
            public int Payments { get; set; }
            public DateTime? LastPaid { get; set; }
        }
        public sealed class WorkerAgg
        {
            public int WorkerID { get; set; }
            public string Name { get; set; } = "";
            public string? Phone { get; set; }
            public bool IsActive { get; set; }
            public decimal Balance { get; set; }
            public decimal Earned { get; set; }
            public int Items { get; set; }
            public int Qty { get; set; }
            public int Uncredited { get; set; }
            public decimal Extra { get; set; }
            public decimal Paid { get; set; }
            public DateTime? LastPaid { get; set; }
        }
    }
    /// <summary>
    /// Other payments need the table WorkerExtraEarning (Database\WorkerExtraEarning\01_create_WorkerExtraEarning.sql).
    /// Until the script has run the ledger works without them (same pattern as FactoryPieces): while the table is
    /// missing the cheap OBJECT_ID check runs on every call (no restart needed); once found it is re-checked every 30 s.
    /// </summary>
    public static class WorkerExtras
    {
        private static volatile bool _has;
        private static long _checkedAtTicks;

        public static bool HasTable(IDbConnection con, IDbTransaction? tx = null)
        {
            var now = DateTime.UtcNow.Ticks;
            if (_has && now - Interlocked.Read(ref _checkedAtTicks) < TimeSpan.TicksPerSecond * 30)
                return true;
            _has = con.ExecuteScalar<int?>("SELECT OBJECT_ID(N'dbo.WorkerExtraEarning', N'U')", transaction: tx) != null;
            Interlocked.Exchange(ref _checkedAtTicks, now);
            return _has;
        }
    }

    public class WorkerExtraModel
    {
        public int InstitutionID { get; set; }            // from the token (ShopScoped)
        public int RegistrationID { get; set; }           // from the token (ShopScoped)
        public int WorkerExtraEarningID { get; set; }     // PUT only
        public string? WorkerType { get; set; }           // POST: Artisan | CuttingMaster (PUT keeps the entry's worker)
        public int WorkerID { get; set; }                 // POST only
        public string? EarningType { get; set; }          // ExtraDesign | Alter | Other
        public decimal Amount { get; set; }
        public string? EarningDate { get; set; }          // yyyy-MM-dd, empty = now
        public int? OrderNo { get; set; }                 // optional: order no. (OrderSerialNumber) of this shop
        public string? DressRef { get; set; }             // optional dress / item reference
        public string? Notes { get; set; }
    }
}
