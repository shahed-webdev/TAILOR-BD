using Microsoft.AspNetCore.Mvc;
using TailorBD.API.Data;
using Dapper;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ExpenseController : ControllerBase
    {
        private readonly TailorBdContext _context;

        public ExpenseController(TailorBdContext context)
        {
            _context = context;
        }

        // GET: api/Expense/categories?institutionId=1
        [HttpGet("categories")]
        public IActionResult GetCategories(int institutionId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var sql = @"SELECT ExpanseCategoryID, CategoryName
                            FROM Expanse_Category
                            WHERE InstitutionID = @InstitutionID
                            ORDER BY CategoryName";
                var data = connection.Query(sql, new { InstitutionID = institutionId });
                return Ok(new { success = true, data });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // POST: api/Expense/categories
        [HttpPost("categories")]
        public IActionResult AddCategory([FromBody] ExpenseCategoryModel model)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var check = @"SELECT COUNT(*) FROM Expanse_Category
                              WHERE InstitutionID = @InstitutionID AND CategoryName = @CategoryName";
                var exists = connection.ExecuteScalar<int>(check, new
                {
                    model.InstitutionID,
                    model.CategoryName
                });
                if (exists > 0)
                    return Ok(new { success = false, message = $"'{model.CategoryName}' ইতিমধ্যেই আছে" });

                var insert = @"INSERT INTO Expanse_Category (RegistrationID, InstitutionID, CategoryName)
                               VALUES (@RegistrationID, @InstitutionID, @CategoryName)";
                connection.Execute(insert, new
                {
                    model.RegistrationID,
                    model.InstitutionID,
                    model.CategoryName
                });
                return Ok(new { success = true, message = "খরচের ধরণ যুক্ত হয়েছে" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // PUT: api/Expense/categories
        [HttpPut("categories")]
        public IActionResult UpdateCategory([FromBody] ExpenseCategoryUpdateModel model)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var sql = "UPDATE Expanse_Category SET CategoryName = @CategoryName WHERE ExpanseCategoryID = @ExpanseCategoryID";
                connection.Execute(sql, new { model.CategoryName, model.ExpanseCategoryID });
                return Ok(new { success = true, message = "আপডেট সফল হয়েছে" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // DELETE: api/Expense/categories/5?institutionId=1
        [HttpDelete("categories/{categoryId}")]
        public IActionResult DeleteCategory(int categoryId, int institutionId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var inUse = connection.ExecuteScalar<int>(
                    "SELECT COUNT(*) FROM Expanse WHERE InstitutionID = @InstitutionID AND ExpanseCategoryID = @CategoryID",
                    new { InstitutionID = institutionId, CategoryID = categoryId });
                if (inUse > 0)
                    return Ok(new { success = false, message = "এই ধরণটি ব্যবহার হয়েছে, মুছা যাবে না" });

                connection.Execute("DELETE FROM Expanse_Category WHERE ExpanseCategoryID = @CategoryID",
                    new { CategoryID = categoryId });
                return Ok(new { success = true, message = "ডিলিট সফল হয়েছে" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET: api/Expense/accounts?institutionId=1
        [HttpGet("accounts")]
        public IActionResult GetAccounts(int institutionId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var sql = @"SELECT AccountID,
                                   AccountName,
                                   AccountBalance,
                                   Default_Status
                            FROM Account
                            WHERE InstitutionID = @InstitutionID AND AccountBalance <> 0
                            ORDER BY Default_Status DESC, AccountName";
                var data = connection.Query(sql, new { InstitutionID = institutionId });
                return Ok(new { success = true, data });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET: api/Expense/records?institutionId=1&page=1&pageSize=30&categoryId=0&dateFrom=&dateTo=
        [HttpGet("records")]
        public IActionResult GetRecords(int institutionId, int page = 1, int pageSize = 30,
            int categoryId = 0, string? dateFrom = null, string? dateTo = null)
        {
            try
            {
                using var connection = _context.CreateConnection();

                var where = @"WHERE e.InstitutionID = @InstitutionID
                              AND (@CategoryID = 0 OR e.ExpanseCategoryID = @CategoryID)
                              AND (@DateFrom IS NULL OR e.ExpanseDate >= @DateFrom)
                              AND (@DateTo IS NULL OR e.ExpanseDate <= @DateTo)";

                var countSql = $@"SELECT COUNT(*) FROM Expanse e {where}";
                var totalCount = connection.ExecuteScalar<int>(countSql, new
                {
                    InstitutionID = institutionId,
                    CategoryID = categoryId,
                    DateFrom = string.IsNullOrEmpty(dateFrom) ? (DateTime?)null : DateTime.Parse(dateFrom),
                    DateTo = string.IsNullOrEmpty(dateTo) ? (DateTime?)null : DateTime.Parse(dateTo)
                });

                var summarySql = $@"SELECT ISNULL(SUM(e.ExpanseAmount), 0) AS TotalAmount,
                                           COUNT(*) AS TotalCount
                                    FROM Expanse e {where}";
                var summary = connection.QueryFirstOrDefault(summarySql, new
                {
                    InstitutionID = institutionId,
                    CategoryID = categoryId,
                    DateFrom = string.IsNullOrEmpty(dateFrom) ? (DateTime?)null : DateTime.Parse(dateFrom),
                    DateTo = string.IsNullOrEmpty(dateTo) ? (DateTime?)null : DateTime.Parse(dateTo)
                });

                var offset = (page - 1) * pageSize;
                var dataSql = $@"SELECT e.ExpanseID,
                                        ec.CategoryName,
                                        e.ExpanseFor,
                                        e.ExpanseAmount,
                                        CONVERT(VARCHAR(10), e.ExpanseDate, 23) AS ExpanseDate,
                                        ISNULL(a.AccountName, 'অ্যাকাউন্ট ছাড়া') AS AccountName
                                 FROM Expanse e
                                 INNER JOIN Expanse_Category ec ON e.ExpanseCategoryID = ec.ExpanseCategoryID
                                 LEFT JOIN Account a ON e.AccountID = a.AccountID
                                 {where}
                                 ORDER BY e.ExpanseID DESC
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

        // GET: api/Expense/summary?institutionId=1
        [HttpGet("summary")]
        public IActionResult GetSummary(int institutionId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var sql = @"
                    SELECT
                        ISNULL(SUM(ExpanseAmount), 0)                                       AS TotalAmount,
                        COUNT(*)                                                              AS TotalRecords,
                        ISNULL(SUM(CASE WHEN MONTH(ExpanseDate) = MONTH(GETDATE())
                                        AND YEAR(ExpanseDate)  = YEAR(GETDATE())
                                        THEN ExpanseAmount ELSE 0 END), 0)                  AS ThisMonthAmount,
                        COUNT(DISTINCT ExpanseCategoryID)                                     AS TotalCategories
                    FROM Expanse
                    WHERE InstitutionID = @InstitutionID";

                var s = connection.QueryFirstOrDefault(sql, new { InstitutionID = institutionId });

                var topCatSql = @"
                    SELECT TOP 5 ec.CategoryName,
                                 ISNULL(SUM(e.ExpanseAmount), 0) AS TotalAmount,
                                 COUNT(*) AS RecordCount
                    FROM Expanse e
                    INNER JOIN Expanse_Category ec ON e.ExpanseCategoryID = ec.ExpanseCategoryID
                    WHERE e.InstitutionID = @InstitutionID
                    GROUP BY ec.CategoryName
                    ORDER BY TotalAmount DESC";

                var topCategories = connection.Query(topCatSql, new { InstitutionID = institutionId });

                return Ok(new { success = true, summary = s, topCategories });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // POST: api/Expense/add
        [HttpPost("add")]
        public IActionResult AddExpense([FromBody] ExpenseAddModel model)
        {
            try
            {
                using var connection = _context.CreateConnection();
                connection.Open();
                using var transaction = connection.BeginTransaction();
                try
                {
                    // Check account balance when an account is selected
                    if (model.AccountID.HasValue && model.AccountID.Value > 0)
                    {
                        var balance = connection.ExecuteScalar<decimal?>(
                            "SELECT AccountBalance FROM Account WHERE InstitutionID = @InstitutionID AND AccountID = @AccountID",
                            new { model.InstitutionID, model.AccountID }, transaction);

                        if (balance.HasValue && model.ExpanseAmount > balance.Value)
                        {
                            transaction.Rollback();
                            return Ok(new { success = false, message = $"অ্যাকাউন্টের ব্যালেন্স কম। বর্তমান ব্যালেন্স: ৳{balance.Value:N2}" });
                        }
                    }

                    var insertSql = @"
                        INSERT INTO Expanse (RegistrationID, InstitutionID, ExpanseCategoryID,
                                             ExpanseAmount, ExpanseFor, AccountID, ExpanseDate)
                        VALUES (@RegistrationID, @InstitutionID, @ExpanseCategoryID,
                                @ExpanseAmount, @ExpanseFor, @AccountID, @ExpanseDate)";
                    DateTime parsedDate = DateTime.TryParse(model.ExpanseDate, out var d) ? d : DateTime.Today;

                    connection.Execute(insertSql, new
                    {
                        model.RegistrationID,
                        model.InstitutionID,
                        model.ExpanseCategoryID,
                        model.ExpanseAmount,
                        ExpanseFor  = model.ExpanseFor ?? "",
                        AccountID   = model.AccountID.HasValue && model.AccountID.Value > 0 ? model.AccountID : null,
                        ExpanseDate = parsedDate
                    }, transaction);

                    // Deduct from account balance if account selected
                    if (model.AccountID.HasValue && model.AccountID.Value > 0)
                    {
                        connection.Execute(
                            "UPDATE Account SET Total_OUT = Total_OUT + @Amount WHERE AccountID = @AccountID",
                            new { Amount = model.ExpanseAmount, model.AccountID }, transaction);
                    }

                    transaction.Commit();
                    return Ok(new { success = true, message = "খরচ সুসম্পন্ন হয়েছে" });
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

        // PUT: api/Expense/update
        [HttpPut("update")]
        public IActionResult UpdateExpense([FromBody] ExpenseUpdateModel model)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var sql = @"UPDATE Expanse SET ExpanseAmount = @ExpanseAmount, ExpanseFor = @ExpanseFor
                            WHERE ExpanseID = @ExpanseID AND InstitutionID = @InstitutionID";
                var rows = connection.Execute(sql, new
                {
                    model.ExpanseAmount,
                    model.ExpanseFor,
                    model.ExpanseID,
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

        // DELETE: api/Expense/5?institutionId=1
        [HttpDelete("{expenseId}")]
        public IActionResult DeleteExpense(int expenseId, int institutionId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                connection.Open();
                using var transaction = connection.BeginTransaction();
                try
                {
                    // Get expense info before deleting (to restore account balance)
                    var exp = connection.QueryFirstOrDefault(
                        "SELECT ExpanseAmount, AccountID FROM Expanse WHERE ExpanseID = @ExpanseID AND InstitutionID = @InstitutionID",
                        new { ExpanseID = expenseId, InstitutionID = institutionId }, transaction);

                    if (exp == null) return Ok(new { success = false, message = "রেকর্ড পাওয়া যায়নি" });

                    connection.Execute("DELETE FROM Expanse WHERE ExpanseID = @ExpanseID",
                        new { ExpanseID = expenseId }, transaction);

                    // Restore account balance
                    if (exp.AccountID != null)
                    {
                        connection.Execute(
                            "UPDATE Account SET Total_OUT = Total_OUT - @Amount WHERE AccountID = @AccountID",
                            new { Amount = (decimal)exp.ExpanseAmount, AccountID = (int)exp.AccountID }, transaction);
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
    public class ExpenseCategoryModel
    {
        public int InstitutionID { get; set; }
        public int RegistrationID { get; set; }
        public string CategoryName { get; set; } = "";
    }

    public class ExpenseCategoryUpdateModel
    {
        public int ExpanseCategoryID { get; set; }
        public string CategoryName { get; set; } = "";
    }

    public class ExpenseAddModel
    {
        public int InstitutionID { get; set; }
        public int RegistrationID { get; set; }
        public int ExpanseCategoryID { get; set; }
        public decimal ExpanseAmount { get; set; }
        public string? ExpanseFor { get; set; }
        public int? AccountID { get; set; }
        public string? ExpanseDate { get; set; }
    }

    public class ExpenseUpdateModel
    {
        public int ExpanseID { get; set; }
        public int InstitutionID { get; set; }
        public decimal ExpanseAmount { get; set; }
        public string? ExpanseFor { get; set; }
    }
}
