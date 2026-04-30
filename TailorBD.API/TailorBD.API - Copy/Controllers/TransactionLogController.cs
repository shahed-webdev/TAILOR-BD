using Microsoft.AspNetCore.Mvc;
using TailorBD.API.Data;
using Dapper;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TransactionLogController : ControllerBase
    {
        private readonly TailorBdContext _context;
        public TransactionLogController(TailorBdContext context) => _context = context;

        // ── Summary: CashIn, CashOut, Net + category breakdown ────────────────
        // GET api/TransactionLog/summary?institutionId=1&dateFrom=&dateTo=
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

                // Totals
                var totalSql = @"
                    SELECT
                        ISNULL(SUM(CASE WHEN Add_Subtraction='Add'         THEN Amount ELSE 0 END),0) AS TotalIn,
                        ISNULL(SUM(CASE WHEN Add_Subtraction='Subtraction' THEN Amount ELSE 0 END),0) AS TotalOut,
                        ISNULL(SUM(CASE WHEN Add_Subtraction='Add'         THEN Amount ELSE 0 END),0)
                       -ISNULL(SUM(CASE WHEN Add_Subtraction='Subtraction' THEN Amount ELSE 0 END),0) AS Net,
                        ISNULL(SUM(CASE WHEN Add_Subtraction='Add'    AND In_Ex_type='In' THEN Amount ELSE 0 END),0) AS NormalIn,
                        ISNULL(SUM(CASE WHEN Add_Subtraction='Add'    AND In_Ex_type='Ex' THEN Amount ELSE 0 END),0) AS AdjIn,
                        ISNULL(SUM(CASE WHEN Add_Subtraction='Subtraction' AND In_Ex_type='Ex' THEN Amount ELSE 0 END),0) AS NormalOut,
                        ISNULL(SUM(CASE WHEN Add_Subtraction='Subtraction' AND In_Ex_type='In' THEN Amount ELSE 0 END),0) AS AdjOut
                    FROM Account_Log
                    WHERE InstitutionID=@InstitutionID
                      AND (@DateFrom IS NULL OR Insert_Date >= @DateFrom)
                      AND (@DateTo   IS NULL OR Insert_Date <= @DateTo)";

                var totals = con.QueryFirstOrDefault(totalSql, p);

                // Cash In by category (normal)
                var inCatSql = @"
                    SELECT Category, ISNULL(SUM(Amount),0) AS Total
                    FROM Account_Log
                    WHERE InstitutionID=@InstitutionID
                      AND Add_Subtraction='Add' AND In_Ex_type='In'
                      AND (@DateFrom IS NULL OR Insert_Date >= @DateFrom)
                      AND (@DateTo   IS NULL OR Insert_Date <= @DateTo)
                    GROUP BY Category ORDER BY Total DESC";

                var inCategories = con.Query(inCatSql, p);

                // Cash In by category (adjustment/Ex)
                var inAdjCatSql = @"
                    SELECT Category, ISNULL(SUM(Amount),0) AS Total
                    FROM Account_Log
                    WHERE InstitutionID=@InstitutionID
                      AND Add_Subtraction='Add' AND In_Ex_type='Ex'
                      AND (@DateFrom IS NULL OR Insert_Date >= @DateFrom)
                      AND (@DateTo   IS NULL OR Insert_Date <= @DateTo)
                    GROUP BY Category ORDER BY Total DESC";

                var inAdjCategories = con.Query(inAdjCatSql, p);

                // Cash Out by category (normal)
                var outCatSql = @"
                    SELECT Category, ISNULL(SUM(Amount),0) AS Total
                    FROM Account_Log
                    WHERE InstitutionID=@InstitutionID
                      AND Add_Subtraction='Subtraction' AND In_Ex_type='Ex'
                      AND (@DateFrom IS NULL OR Insert_Date >= @DateFrom)
                      AND (@DateTo   IS NULL OR Insert_Date <= @DateTo)
                    GROUP BY Category ORDER BY Total DESC";

                var outCategories = con.Query(outCatSql, p);

                // Cash Out by category (adjustment/In)
                var outAdjCatSql = @"
                    SELECT Category, ISNULL(SUM(Amount),0) AS Total
                    FROM Account_Log
                    WHERE InstitutionID=@InstitutionID
                      AND Add_Subtraction='Subtraction' AND In_Ex_type='In'
                      AND (@DateFrom IS NULL OR Insert_Date >= @DateFrom)
                      AND (@DateTo   IS NULL OR Insert_Date <= @DateTo)
                    GROUP BY Category ORDER BY Total DESC";

                var outAdjCategories = con.Query(outAdjCatSql, p);

                return Ok(new
                {
                    success = true,
                    totals,
                    inCategories,
                    inAdjCategories,
                    outCategories,
                    outAdjCategories
                });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ── Transaction logs by category ──────────────────────────────────────
        // GET api/TransactionLog/logs?institutionId=1&dateFrom=&dateTo=&type=in|out&inExType=In|Ex&category=&page=1&pageSize=50
        [HttpGet("logs")]
        public IActionResult GetLogs(int institutionId, string type = "in", string inExType = "In",
            string? category = null, string? dateFrom = null, string? dateTo = null,
            int page = 1, int pageSize = 50)
        {
            try
            {
                using var con = _context.CreateConnection();
                var addSub = type == "in" ? "Add" : "Subtraction";
                var p = new
                {
                    InstitutionID = institutionId,
                    AddSub        = addSub,
                    InExType      = inExType,
                    Category      = category,
                    DateFrom = string.IsNullOrEmpty(dateFrom) ? (DateTime?)null : DateTime.Parse(dateFrom),
                    DateTo   = string.IsNullOrEmpty(dateTo)   ? (DateTime?)null : DateTime.Parse(dateTo),
                    Offset   = (page - 1) * pageSize,
                    PageSize = pageSize
                };

                var totalSql = @"
                    SELECT COUNT(*) FROM Account_Log
                    WHERE InstitutionID=@InstitutionID
                      AND Add_Subtraction=@AddSub
                      AND In_Ex_type=@InExType
                      AND (@Category IS NULL OR Category=@Category)
                      AND (@DateFrom IS NULL OR Insert_Date >= @DateFrom)
                      AND (@DateTo   IS NULL OR Insert_Date <= @DateTo)";

                var total = con.ExecuteScalar<int>(totalSql, p);

                var sql = @"
                    SELECT
                        al.Log_SN,
                        al.Category,
                        al.Situation,
                        al.Amount,
                        al.Details,
                        al.Add_Subtraction,
                        al.In_Ex_type,
                        ISNULL(a.AccountName,'Without Account') AS AccountName,
                        CONVERT(varchar(10), al.Insert_Date, 23)         AS InsertDate,
                        CONVERT(varchar(8),  al.Insert_Time, 108)        AS InsertTime,
                        r.UserName
                    FROM Account_Log al
                    LEFT JOIN Registration r ON al.RegistrationID=r.RegistrationID
                    LEFT JOIN Account      a ON al.AccountID=a.AccountID
                    WHERE al.InstitutionID=@InstitutionID
                      AND al.Add_Subtraction=@AddSub
                      AND al.In_Ex_type=@InExType
                      AND (@Category IS NULL OR al.Category=@Category)
                      AND (@DateFrom IS NULL OR al.Insert_Date >= @DateFrom)
                      AND (@DateTo   IS NULL OR al.Insert_Date <= @DateTo)
                    ORDER BY al.Insert_Date DESC, CONVERT(varchar(8), al.Insert_Time, 108) DESC
                    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

                var data = con.Query(sql, p);

                return Ok(new
                {
                    success = true,
                    total,
                    page,
                    pageSize,
                    totalPages = (int)Math.Ceiling((double)total / pageSize),
                    data
                });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }
    }
}
