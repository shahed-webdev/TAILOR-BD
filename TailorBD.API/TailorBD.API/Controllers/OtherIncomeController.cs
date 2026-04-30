using Microsoft.AspNetCore.Mvc;
using TailorBD.API.Data;
using Dapper;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OtherIncomeController : ControllerBase
    {
        private readonly TailorBdContext _context;

        public OtherIncomeController(TailorBdContext context)
        {
            _context = context;
        }

        // GET: api/OtherIncome/categories?institutionId=1
        [HttpGet("categories")]
        public IActionResult GetCategories(int institutionId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var sql = @"SELECT Extra_IncomeCategoryID, Extra_Income_CategoryName AS CategoryName
                            FROM Extra_IncomeCategory
                            WHERE InstitutionID = @InstitutionID
                            ORDER BY Extra_Income_CategoryName";
                var data = connection.Query(sql, new { InstitutionID = institutionId });
                return Ok(new { success = true, data });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // POST: api/OtherIncome/categories
        [HttpPost("categories")]
        public IActionResult AddCategory([FromBody] OtherIncomeCategoryModel model)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var check = @"SELECT COUNT(*) FROM Extra_IncomeCategory
                              WHERE InstitutionID = @InstitutionID AND Extra_Income_CategoryName = @CategoryName";
                var exists = connection.ExecuteScalar<int>(check, new
                {
                    model.InstitutionID,
                    CategoryName = model.CategoryName
                });
                if (exists > 0)
                    return Ok(new { success = false, message = $"'{model.CategoryName}' ইতিমধ্যে আছে" });

                var insert = @"INSERT INTO Extra_IncomeCategory (RegistrationID, InstitutionID, Extra_Income_CategoryName)
                               VALUES (@RegistrationID, @InstitutionID, @CategoryName)";
                connection.Execute(insert, new
                {
                    model.RegistrationID,
                    model.InstitutionID,
                    CategoryName = model.CategoryName
                });
                return Ok(new { success = true, message = "আয়ের ধরণ যুক্ত হয়েছে" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // PUT: api/OtherIncome/categories
        [HttpPut("categories")]
        public IActionResult UpdateCategory([FromBody] OtherIncomeCategoryUpdateModel model)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var sql = "UPDATE Extra_IncomeCategory SET Extra_Income_CategoryName = @CategoryName WHERE Extra_IncomeCategoryID = @CategoryID";
                connection.Execute(sql, new { model.CategoryName, CategoryID = model.Extra_IncomeCategoryID });
                return Ok(new { success = true, message = "আপডেট সফল হয়েছে" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // DELETE: api/OtherIncome/categories/5?institutionId=1
        [HttpDelete("categories/{categoryId}")]
        public IActionResult DeleteCategory(int categoryId, int institutionId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var inUse = connection.ExecuteScalar<int>(
                    "SELECT COUNT(*) FROM Extra_Income WHERE InstitutionID = @InstitutionID AND Extra_IncomeCategoryID = @CategoryID",
                    new { InstitutionID = institutionId, CategoryID = categoryId });
                if (inUse > 0)
                    return Ok(new { success = false, message = "এই ধরণটি ব্যবহার হয়েছে, মুছা যাবে না" });

                connection.Execute("DELETE FROM Extra_IncomeCategory WHERE Extra_IncomeCategoryID = @CategoryID",
                    new { CategoryID = categoryId });
                return Ok(new { success = true, message = "ডিলিট সফল হয়েছে" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET: api/OtherIncome/accounts?institutionId=1
        [HttpGet("accounts")]
        public IActionResult GetAccounts(int institutionId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var sql = @"SELECT AccountID, AccountName, AccountBalance, Default_Status
                            FROM Account
                            WHERE InstitutionID = @InstitutionID AND AccountBalance >= 0
                            ORDER BY Default_Status DESC, AccountName";
                var data = connection.Query(sql, new { InstitutionID = institutionId });
                return Ok(new { success = true, data });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET: api/OtherIncome/records?institutionId=1&page=1&pageSize=30&categoryId=0&dateFrom=&dateTo=
        [HttpGet("records")]
        public IActionResult GetRecords(int institutionId, int page = 1, int pageSize = 30,
            int categoryId = 0, string? dateFrom = null, string? dateTo = null)
        {
            try
            {
                using var connection = _context.CreateConnection();

                var where = @"WHERE ei.InstitutionID = @InstitutionID
                              AND (@CategoryID = 0 OR ei.Extra_IncomeCategoryID = @CategoryID)
                              AND (@DateFrom IS NULL OR ei.Extra_IncomeDate >= @DateFrom)
                              AND (@DateTo IS NULL OR ei.Extra_IncomeDate <= @DateTo)";

                var countSql = $"SELECT COUNT(*) FROM Extra_Income ei {where}";
                var totalCount = connection.ExecuteScalar<int>(countSql, new
                {
                    InstitutionID = institutionId,
                    CategoryID = categoryId,
                    DateFrom = string.IsNullOrEmpty(dateFrom) ? (DateTime?)null : DateTime.Parse(dateFrom),
                    DateTo = string.IsNullOrEmpty(dateTo) ? (DateTime?)null : DateTime.Parse(dateTo)
                });

                var summarySql = $@"SELECT ISNULL(SUM(ei.Extra_IncomeAmount), 0) AS TotalAmount,
                                           COUNT(*) AS TotalCount
                                    FROM Extra_Income ei {where}";
                var summary = connection.QueryFirstOrDefault(summarySql, new
                {
                    InstitutionID = institutionId,
                    CategoryID = categoryId,
                    DateFrom = string.IsNullOrEmpty(dateFrom) ? (DateTime?)null : DateTime.Parse(dateFrom),
                    DateTo = string.IsNullOrEmpty(dateTo) ? (DateTime?)null : DateTime.Parse(dateTo)
                });

                var offset = (page - 1) * pageSize;
                var dataSql = $@"SELECT ei.Extra_IncomeID,
                                        ec.Extra_Income_CategoryName AS CategoryName,
                                        ei.Extra_IncomeFor,
                                        ei.Extra_IncomeAmount,
                                        CONVERT(VARCHAR(10), ei.Extra_IncomeDate, 23) AS IncomeDate,
                                        ISNULL(a.AccountName, 'অ্যাকাউন্ট ছাড়া') AS AccountName
                                 FROM Extra_Income ei
                                 INNER JOIN Extra_IncomeCategory ec ON ei.Extra_IncomeCategoryID = ec.Extra_IncomeCategoryID
                                 LEFT JOIN Account a ON ei.AccountID = a.AccountID
                                 {where}
                                 ORDER BY ei.Extra_IncomeID DESC
                                 OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

                var data = connection.Query(dataSql, new
                {
                    InstitutionID = institutionId,
                    CategoryID = categoryId,
                    DateFrom = string.IsNullOrEmpty(dateFrom) ? (DateTime?)null : DateTime.Parse(dateFrom),
                    DateTo = string.IsNullOrEmpty(dateTo) ? (DateTime?)null : DateTime.Parse(dateTo),
                    Offset = offset,
                    PageSize = pageSize
                });

                return Ok(new
                {
                    success = true,
                    data,
                    totalCount,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize),
                    summary
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET: api/OtherIncome/summary?institutionId=1
        [HttpGet("summary")]
        public IActionResult GetSummary(int institutionId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var sql = @"
                    SELECT
                        ISNULL(SUM(Extra_IncomeAmount), 0)                                            AS TotalAmount,
                        COUNT(*)                                                                        AS TotalRecords,
                        ISNULL(SUM(CASE WHEN MONTH(Extra_IncomeDate) = MONTH(GETDATE())
                                        AND YEAR(Extra_IncomeDate)  = YEAR(GETDATE())
                                        THEN Extra_IncomeAmount ELSE 0 END), 0)                        AS ThisMonthAmount,
                        COUNT(DISTINCT Extra_IncomeCategoryID)                                          AS TotalCategories
                    FROM Extra_Income
                    WHERE InstitutionID = @InstitutionID";
                var s = connection.QueryFirstOrDefault(sql, new { InstitutionID = institutionId });

                var topCatSql = @"
                    SELECT TOP 5 ec.Extra_Income_CategoryName AS CategoryName,
                                 ISNULL(SUM(ei.Extra_IncomeAmount), 0) AS TotalAmount,
                                 COUNT(*) AS RecordCount
                    FROM Extra_Income ei
                    INNER JOIN Extra_IncomeCategory ec ON ei.Extra_IncomeCategoryID = ec.Extra_IncomeCategoryID
                    WHERE ei.InstitutionID = @InstitutionID
                    GROUP BY ec.Extra_Income_CategoryName
                    ORDER BY TotalAmount DESC";
                var topCategories = connection.Query(topCatSql, new { InstitutionID = institutionId });

                return Ok(new { success = true, summary = s, topCategories });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // POST: api/OtherIncome/add
        [HttpPost("add")]
        public IActionResult AddIncome([FromBody] OtherIncomeAddModel model)
        {
            try
            {
                using var connection = _context.CreateConnection();
                connection.Open();
                using var transaction = connection.BeginTransaction();
                try
                {
                    DateTime parsedDate = DateTime.TryParse(model.IncomeDate, out var d) ? d : DateTime.Today;

                    var insertSql = @"
                        INSERT INTO Extra_Income (RegistrationID, InstitutionID, Extra_IncomeCategoryID,
                                                  Extra_IncomeAmount, Extra_IncomeFor, AccountID, Extra_IncomeDate)
                        VALUES (@RegistrationID, @InstitutionID, @Extra_IncomeCategoryID,
                                @Extra_IncomeAmount, @Extra_IncomeFor, @AccountID, @Extra_IncomeDate)";

                    connection.Execute(insertSql, new
                    {
                        model.RegistrationID,
                        model.InstitutionID,
                        model.Extra_IncomeCategoryID,
                        model.Extra_IncomeAmount,
                        Extra_IncomeFor = model.Extra_IncomeFor ?? "",
                        AccountID = model.AccountID.HasValue && model.AccountID.Value > 0 ? model.AccountID : null,
                        Extra_IncomeDate = parsedDate
                    }, transaction);

                    // Add to account balance if account selected
                    if (model.AccountID.HasValue && model.AccountID.Value > 0)
                    {
                        connection.Execute(
                            "UPDATE Account SET Total_IN = Total_IN + @Amount WHERE AccountID = @AccountID",
                            new { Amount = model.Extra_IncomeAmount, model.AccountID }, transaction);
                    }

                    transaction.Commit();
                    return Ok(new { success = true, message = "আয় সফলভাবে যুক্ত হয়েছে" });
                }
                catch
                {
                    transaction.Rollback();
                    throw;
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // PUT: api/OtherIncome/update
        [HttpPut("update")]
        public IActionResult UpdateIncome([FromBody] OtherIncomeUpdateModel model)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var sql = @"UPDATE Extra_Income
                            SET Extra_IncomeAmount = @Extra_IncomeAmount, Extra_IncomeFor = @Extra_IncomeFor
                            WHERE Extra_IncomeID = @Extra_IncomeID AND InstitutionID = @InstitutionID";
                var rows = connection.Execute(sql, new
                {
                    model.Extra_IncomeAmount,
                    model.Extra_IncomeFor,
                    model.Extra_IncomeID,
                    model.InstitutionID
                });
                if (rows == 0) return Ok(new { success = false, message = "রেকর্ড পাওয়া যায়নি" });
                return Ok(new { success = true, message = "আপডেট সফল হয়েছে" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // DELETE: api/OtherIncome/5?institutionId=1
        [HttpDelete("{incomeId}")]
        public IActionResult DeleteIncome(int incomeId, int institutionId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                connection.Open();
                using var transaction = connection.BeginTransaction();
                try
                {
                    var inc = connection.QueryFirstOrDefault(
                        "SELECT Extra_IncomeAmount, AccountID FROM Extra_Income WHERE Extra_IncomeID = @IncomeID AND InstitutionID = @InstitutionID",
                        new { IncomeID = incomeId, InstitutionID = institutionId }, transaction);

                    if (inc == null) return Ok(new { success = false, message = "রেকর্ড পাওয়া যায়নি" });

                    connection.Execute("DELETE FROM Extra_Income WHERE Extra_IncomeID = @IncomeID",
                        new { IncomeID = incomeId }, transaction);

                    // Restore account balance
                    if (inc.AccountID != null)
                    {
                        connection.Execute(
                            "UPDATE Account SET Total_IN = Total_IN - @Amount WHERE AccountID = @AccountID",
                            new { Amount = (decimal)inc.Extra_IncomeAmount, AccountID = (int)inc.AccountID }, transaction);
                    }

                    transaction.Commit();
                    return Ok(new { success = true, message = "ডিলিট সফল হয়েছে" });
                }
                catch
                {
                    transaction.Rollback();
                    throw;
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }

    // ── Models ──────────────────────────────────────────────────────────────────
    public class OtherIncomeCategoryModel
    {
        public int InstitutionID { get; set; }
        public int RegistrationID { get; set; }
        public string CategoryName { get; set; } = "";
    }

    public class OtherIncomeCategoryUpdateModel
    {
        public int Extra_IncomeCategoryID { get; set; }
        public string CategoryName { get; set; } = "";
    }

    public class OtherIncomeAddModel
    {
        public int InstitutionID { get; set; }
        public int RegistrationID { get; set; }
        public int Extra_IncomeCategoryID { get; set; }
        public decimal Extra_IncomeAmount { get; set; }
        public string? Extra_IncomeFor { get; set; }
        public int? AccountID { get; set; }
        public string? IncomeDate { get; set; }
    }

    public class OtherIncomeUpdateModel
    {
        public int Extra_IncomeID { get; set; }
        public int InstitutionID { get; set; }
        public decimal Extra_IncomeAmount { get; set; }
        public string? Extra_IncomeFor { get; set; }
    }
}
