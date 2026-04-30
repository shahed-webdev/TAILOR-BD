using Microsoft.AspNetCore.Mvc;
using TailorBD.API.Data;
using Dapper;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountLogController : ControllerBase
    {
        private readonly TailorBdContext _context;
        public AccountLogController(TailorBdContext context) => _context = context;

        // GET api/AccountLog/summary?institutionId=1&accountId=2&dateFrom=&dateTo=
        [HttpGet("summary")]
        public IActionResult GetSummary(int institutionId, int? accountId = null,
            string? dateFrom = null, string? dateTo = null)
        {
            try
            {
                using var con = _context.CreateConnection();
                var p = new
                {
                    InstitutionID = institutionId,
                    AccountID     = accountId,
                    DateFrom      = string.IsNullOrEmpty(dateFrom) ? (DateTime?)null : DateTime.Parse(dateFrom),
                    DateTo        = string.IsNullOrEmpty(dateTo)   ? (DateTime?)null : DateTime.Parse(dateTo)
                };

                var sql = @"
                    SELECT
                        ISNULL(SUM(CASE WHEN Add_Subtraction='Add'         THEN Amount ELSE 0 END),0) AS CashIn,
                        ISNULL(SUM(CASE WHEN Add_Subtraction='Subtraction' THEN Amount ELSE 0 END),0) AS CashOut,
                        ISNULL(SUM(CASE WHEN Add_Subtraction='Add'         THEN Amount ELSE 0 END),0)
                       -ISNULL(SUM(CASE WHEN Add_Subtraction='Subtraction' THEN Amount ELSE 0 END),0) AS Net,
                        (SELECT TOP 1 Balance_Before FROM Account_Log al2
                         WHERE al2.InstitutionID=@InstitutionID
                           AND (@AccountID IS NULL OR al2.AccountID=@AccountID)
                           AND (@DateFrom  IS NULL OR al2.Insert_Date >= @DateFrom)
                         ORDER BY al2.Insert_Date ASC, CONVERT(varchar(8), al2.Insert_Time, 108) ASC)  AS OpeningBalance,
                        (SELECT TOP 1 Balance_After FROM Account_Log al3
                         WHERE al3.InstitutionID=@InstitutionID
                           AND (@AccountID IS NULL OR al3.AccountID=@AccountID)
                           AND (@DateTo    IS NULL OR al3.Insert_Date <= @DateTo)
                         ORDER BY al3.Insert_Date DESC, CONVERT(varchar(8), al3.Insert_Time, 108) DESC) AS ClosingBalance
                    FROM Account_Log
                    WHERE InstitutionID=@InstitutionID
                      AND (@AccountID IS NULL OR AccountID=@AccountID)
                      AND (@DateFrom  IS NULL OR Insert_Date >= @DateFrom)
                      AND (@DateTo    IS NULL OR Insert_Date <= @DateTo)";

                var summary = con.QueryFirstOrDefault(sql, p);
                return Ok(new { success = true, data = summary });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET api/AccountLog/logs?institutionId=1&accountId=2&dateFrom=&dateTo=&page=1&pageSize=50
        [HttpGet("logs")]
        public IActionResult GetLogs(int institutionId, int? accountId = null,
            string? dateFrom = null, string? dateTo = null, int page = 1, int pageSize = 50)
        {
            try
            {
                using var con = _context.CreateConnection();
                var p = new
                {
                    InstitutionID = institutionId,
                    AccountID     = accountId,
                    DateFrom      = string.IsNullOrEmpty(dateFrom) ? (DateTime?)null : DateTime.Parse(dateFrom),
                    DateTo        = string.IsNullOrEmpty(dateTo)   ? (DateTime?)null : DateTime.Parse(dateTo),
                    Offset        = (page - 1) * pageSize,
                    PageSize      = pageSize
                };

                var totalSql = @"
                    SELECT COUNT(*) FROM Account_Log
                    WHERE InstitutionID=@InstitutionID
                      AND (@AccountID IS NULL OR AccountID=@AccountID)
                      AND (@DateFrom  IS NULL OR Insert_Date >= @DateFrom)
                      AND (@DateTo    IS NULL OR Insert_Date <= @DateTo)";

                var total = con.ExecuteScalar<int>(totalSql, p);

                var logsSql = @"
                    SELECT
                        al.Log_SN,
                        al.Add_Subtraction,
                        al.Category,
                        al.Situation,
                        al.Amount,
                        al.Balance_Before,
                        al.Balance_After,
                        al.Details,
                        CONVERT(varchar(10), al.Insert_Date, 23) AS InsertDate,
                        CONVERT(varchar(8),  al.Insert_Time, 108) AS InsertTime,
                        r.UserName,
                        a.AccountName
                    FROM Account_Log al
                    LEFT JOIN Registration r ON al.RegistrationID = r.RegistrationID
                    LEFT JOIN Account      a ON al.AccountID      = a.AccountID
                    WHERE al.InstitutionID=@InstitutionID
                      AND (@AccountID IS NULL OR al.AccountID=@AccountID)
                      AND (@DateFrom  IS NULL OR al.Insert_Date >= @DateFrom)
                      AND (@DateTo    IS NULL OR al.Insert_Date <= @DateTo)
                    ORDER BY al.Insert_Date DESC, CONVERT(varchar(8), al.Insert_Time, 108) DESC
                    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

                var logs = con.Query(logsSql, p);

                return Ok(new
                {
                    success = true,
                    total,
                    page,
                    pageSize,
                    totalPages = (int)Math.Ceiling((double)total / pageSize),
                    data = logs
                });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET api/AccountLog/accounts?institutionId=1
        [HttpGet("accounts")]
        public IActionResult GetAccounts(int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var sql = @"
                    SELECT AccountID, AccountName, AccountBalance
                    FROM Account
                    WHERE InstitutionID=@InstitutionID
                    ORDER BY Default_Status DESC, AccountName";
                var data = con.Query(sql, new { InstitutionID = institutionId });
                return Ok(new { success = true, data });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }
    }
}
