using Microsoft.AspNetCore.Mvc;
using TailorBD.API.Data;
using Dapper;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class IncomeDueExpenseController : ControllerBase
    {
        private readonly TailorBdContext _context;
        public IncomeDueExpenseController(TailorBdContext context) => _context = context;

        // ── Summary totals for all 3 tabs ────────────────────────────────────
        // GET api/IncomeDueExpense/summary?institutionId=1&dateFrom=&dateTo=
        [HttpGet("summary")]
        public IActionResult GetSummary(int institutionId, string? dateFrom = null, string? dateTo = null)
        {
            try
            {
                using var con = _context.CreateConnection();
                var p = new
                {
                    InstitutionID = institutionId,
                    DateFrom = string.IsNullOrEmpty(dateFrom) ? (DateTime?)null : DateTime.Parse(dateFrom),
                    DateTo   = string.IsNullOrEmpty(dateTo)   ? (DateTime?)null : DateTime.Parse(dateTo)
                };

                var sql = @"
                    SELECT
                        (SELECT ISNULL(SUM(Amount),0) FROM Payment_Record
                         WHERE InstitutionID=@InstitutionID
                           AND (@DateFrom IS NULL OR OrderPaid_Date >= @DateFrom)
                           AND (@DateTo   IS NULL OR OrderPaid_Date <= @DateTo))  AS TotalIncome,

                        (SELECT ISNULL(SUM(DueAmount),0) FROM [Order]
                         WHERE InstitutionID=@InstitutionID
                           AND PaymentStatus='Due'
                           AND (@DateFrom IS NULL OR OrderDate >= @DateFrom)
                           AND (@DateTo   IS NULL OR OrderDate <= @DateTo))       AS TotalDue,

                        (SELECT COUNT(*) FROM [Order]
                         WHERE InstitutionID=@InstitutionID
                           AND PaymentStatus='Due'
                           AND (@DateFrom IS NULL OR OrderDate >= @DateFrom)
                           AND (@DateTo   IS NULL OR OrderDate <= @DateTo))       AS DueOrderCount,

                        (SELECT ISNULL(SUM(ExpanseAmount),0) FROM Expanse
                         WHERE InstitutionID=@InstitutionID
                           AND (@DateFrom IS NULL OR ExpanseDate >= @DateFrom)
                           AND (@DateTo   IS NULL OR ExpanseDate <= @DateTo))     AS TotalExpense";

                var data = con.QueryFirstOrDefault(sql, p);
                return Ok(new { success = true, data });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ── Income (Payment Records) ──────────────────────────────────────────
        // GET api/IncomeDueExpense/income?institutionId=1&dateFrom=&dateTo=&page=1&pageSize=30
        [HttpGet("income")]
        public IActionResult GetIncome(int institutionId, string? dateFrom = null, string? dateTo = null,
            int page = 1, int pageSize = 30)
        {
            try
            {
                using var con = _context.CreateConnection();
                var p = new
                {
                    InstitutionID = institutionId,
                    DateFrom = string.IsNullOrEmpty(dateFrom) ? (DateTime?)null : DateTime.Parse(dateFrom),
                    DateTo   = string.IsNullOrEmpty(dateTo)   ? (DateTime?)null : DateTime.Parse(dateTo),
                    Offset   = (page - 1) * pageSize,
                    PageSize = pageSize
                };

                var totalSql = @"
                    SELECT COUNT(*) FROM Payment_Record pr
                    INNER JOIN [Order] o ON pr.OrderID = o.OrderID
                    WHERE pr.InstitutionID=@InstitutionID
                      AND (@DateFrom IS NULL OR pr.OrderPaid_Date >= @DateFrom)
                      AND (@DateTo   IS NULL OR pr.OrderPaid_Date <= @DateTo)";

                var total = con.ExecuteScalar<int>(totalSql, p);

                var sql = @"
                    SELECT
                        o.OrderSerialNumber,
                        c.CustomerNumber,
                        c.CustomerName,
                        c.Phone,
                        CONVERT(varchar(10), o.OrderDate,    23) AS OrderDate,
                        CONVERT(varchar(10), o.DeliveryDate, 23) AS DeliveryDate,
                        o.OrderAmount,
                        (o.PaidAmount - pr.Amount)               AS PrePaid,
                        pr.Amount,
                        o.Discount,
                        o.DueAmount,
                        STUFF((SELECT '; ' + d.Dress_Name + ' ' + CAST(ol.DressQuantity AS NVARCHAR)
                               FROM OrderList ol INNER JOIN Dress d ON ol.DressID=d.DressID
                               WHERE ol.OrderID=o.OrderID FOR XML PATH('')), 1,1,'') AS Details,
                        CONVERT(varchar(10), pr.OrderPaid_Date, 23) AS PaidDate,
                        pr.Payment_TimeStatus                    AS PayStatus,
                        ISNULL(a.AccountName, 'Without Account') AS Account
                    FROM Payment_Record pr
                    INNER JOIN [Order]   o  ON pr.OrderID    = o.OrderID
                    INNER JOIN Customer  c  ON o.CustomerID  = c.CustomerID
                    LEFT  JOIN Account   a  ON pr.AccountID  = a.AccountID
                    WHERE pr.InstitutionID=@InstitutionID
                      AND (@DateFrom IS NULL OR pr.OrderPaid_Date >= @DateFrom)
                      AND (@DateTo   IS NULL OR pr.OrderPaid_Date <= @DateTo)
                    ORDER BY pr.OrderPaid_Date DESC, o.OrderSerialNumber
                    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

                var data = con.Query(sql, p);
                return Ok(new { success = true, total, page, pageSize,
                    totalPages = (int)Math.Ceiling((double)total / pageSize), data });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ── Due Orders ────────────────────────────────────────────────────────
        // GET api/IncomeDueExpense/due?institutionId=1&dateFrom=&dateTo=&page=1&pageSize=30
        [HttpGet("due")]
        public IActionResult GetDue(int institutionId, string? dateFrom = null, string? dateTo = null,
            int page = 1, int pageSize = 30)
        {
            try
            {
                using var con = _context.CreateConnection();
                var p = new
                {
                    InstitutionID = institutionId,
                    DateFrom = string.IsNullOrEmpty(dateFrom) ? (DateTime?)null : DateTime.Parse(dateFrom),
                    DateTo   = string.IsNullOrEmpty(dateTo)   ? (DateTime?)null : DateTime.Parse(dateTo),
                    Offset   = (page - 1) * pageSize,
                    PageSize = pageSize
                };

                var totalSql = @"
                    SELECT COUNT(*) FROM [Order]
                    WHERE InstitutionID=@InstitutionID AND PaymentStatus='Due'
                      AND (@DateFrom IS NULL OR OrderDate >= @DateFrom)
                      AND (@DateTo   IS NULL OR OrderDate <= @DateTo)";

                var total = con.ExecuteScalar<int>(totalSql, p);

                var sql = @"
                    SELECT
                        o.OrderSerialNumber,
                        c.CustomerNumber,
                        c.CustomerName,
                        c.Phone,
                        CONVERT(varchar(10), o.OrderDate,    23) AS OrderDate,
                        CONVERT(varchar(10), o.DeliveryDate, 23) AS DeliveryDate,
                        o.OrderAmount,
                        o.PaidAmount,
                        o.Discount,
                        o.DueAmount,
                        o.DeliveryStatus,
                        STUFF((SELECT '; ' + d.Dress_Name + ' ' + CAST(ol.DressQuantity AS NVARCHAR)
                               FROM OrderList ol INNER JOIN Dress d ON ol.DressID=d.DressID
                               WHERE ol.OrderID=o.OrderID FOR XML PATH('')), 1,1,'') AS Details
                    FROM [Order] o
                    INNER JOIN Customer c ON o.CustomerID=c.CustomerID
                    WHERE o.InstitutionID=@InstitutionID AND o.PaymentStatus='Due'
                      AND (@DateFrom IS NULL OR o.OrderDate >= @DateFrom)
                      AND (@DateTo   IS NULL OR o.OrderDate <= @DateTo)
                    ORDER BY o.DueAmount DESC, o.OrderDate DESC
                    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

                var data = con.Query(sql, p);
                return Ok(new { success = true, total, page, pageSize,
                    totalPages = (int)Math.Ceiling((double)total / pageSize), data });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ── Expense ───────────────────────────────────────────────────────────
        // GET api/IncomeDueExpense/expense?institutionId=1&dateFrom=&dateTo=&categoryId=0&page=1&pageSize=30
        [HttpGet("expense")]
        public IActionResult GetExpense(int institutionId, int? categoryId = null,
            string? dateFrom = null, string? dateTo = null, int page = 1, int pageSize = 30)
        {
            try
            {
                using var con = _context.CreateConnection();
                var p = new
                {
                    InstitutionID = institutionId,
                    CategoryID   = categoryId,
                    DateFrom = string.IsNullOrEmpty(dateFrom) ? (DateTime?)null : DateTime.Parse(dateFrom),
                    DateTo   = string.IsNullOrEmpty(dateTo)   ? (DateTime?)null : DateTime.Parse(dateTo),
                    Offset   = (page - 1) * pageSize,
                    PageSize = pageSize
                };

                var totalSql = @"
                    SELECT COUNT(*) FROM Expanse
                    WHERE InstitutionID=@InstitutionID
                      AND (@CategoryID IS NULL OR ExpanseCategoryID=@CategoryID)
                      AND (@DateFrom   IS NULL OR ExpanseDate >= @DateFrom)
                      AND (@DateTo     IS NULL OR ExpanseDate <= @DateTo)";

                var total = con.ExecuteScalar<int>(totalSql, p);

                var sql = @"
                    SELECT
                        ec.CategoryName,
                        e.ExpanseFor                             AS ExpenseFor,
                        e.ExpanseAmount                          AS Amount,
                        CONVERT(varchar(10), e.ExpanseDate, 23) AS ExpenseDate,
                        ISNULL(a.AccountName, 'Without Account') AS Account
                    FROM Expanse e
                    INNER JOIN Expanse_Category ec ON e.ExpanseCategoryID=ec.ExpanseCategoryID
                    LEFT  JOIN Account          a  ON e.AccountID=a.AccountID
                    WHERE e.InstitutionID=@InstitutionID
                      AND (@CategoryID IS NULL OR e.ExpanseCategoryID=@CategoryID)
                      AND (@DateFrom   IS NULL OR e.ExpanseDate >= @DateFrom)
                      AND (@DateTo     IS NULL OR e.ExpanseDate <= @DateTo)
                    ORDER BY e.ExpanseDate DESC
                    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

                var data = con.Query(sql, p);

                // category-wise total for this filter
                var catTotalSql = @"
                    SELECT ec.CategoryName, ISNULL(SUM(e.ExpanseAmount),0) AS Total
                    FROM Expanse e
                    INNER JOIN Expanse_Category ec ON e.ExpanseCategoryID=ec.ExpanseCategoryID
                    WHERE e.InstitutionID=@InstitutionID
                      AND (@CategoryID IS NULL OR e.ExpanseCategoryID=@CategoryID)
                      AND (@DateFrom   IS NULL OR e.ExpanseDate >= @DateFrom)
                      AND (@DateTo     IS NULL OR e.ExpanseDate <= @DateTo)
                    GROUP BY ec.CategoryName ORDER BY Total DESC";

                var categoryTotals = con.Query(catTotalSql, p);

                return Ok(new { success = true, total, page, pageSize,
                    totalPages = (int)Math.Ceiling((double)total / pageSize),
                    data, categoryTotals });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ── Expense Categories dropdown ───────────────────────────────────────
        // GET api/IncomeDueExpense/expense-categories?institutionId=1
        [HttpGet("expense-categories")]
        public IActionResult GetExpenseCategories(int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var data = con.Query(@"
                    SELECT ExpanseCategoryID AS CategoryID, CategoryName
                    FROM Expanse_Category
                    WHERE InstitutionID=@InstitutionID
                    ORDER BY CategoryName",
                    new { InstitutionID = institutionId });
                return Ok(new { success = true, data });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }
    }
}
