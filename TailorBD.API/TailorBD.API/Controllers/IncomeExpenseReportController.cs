using Microsoft.AspNetCore.Mvc;
using TailorBD.API.Data;
using Dapper;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class IncomeExpenseReportController : ControllerBase
    {
        private readonly TailorBdContext _context;

        public IncomeExpenseReportController(TailorBdContext context)
        {
            _context = context;
        }

        // GET: api/IncomeExpenseReport/summary?institutionId=1&dateFrom=2024-01-01&dateTo=2024-12-31
        [HttpGet("summary")]
        public IActionResult GetSummary(int institutionId, string? dateFrom = null, string? dateTo = null)
        {
            try
            {
                using var connection = _context.CreateConnection();

                var dateParams = new
                {
                    InstitutionID = institutionId,
                    DateFrom = string.IsNullOrEmpty(dateFrom) ? (DateTime?)null : DateTime.Parse(dateFrom),
                    DateTo   = string.IsNullOrEmpty(dateTo)   ? (DateTime?)null : DateTime.Parse(dateTo)
                };

                // ── 1. Tailoring Income (payments received from orders) ────────────
                var tailoringSql = @"
                    SELECT ISNULL(SUM(Amount), 0) AS TailoringIncome
                    FROM Payment_Record
                    WHERE InstitutionID = @InstitutionID
                      AND (@DateFrom IS NULL OR OrderPaid_Date >= @DateFrom)
                      AND (@DateTo   IS NULL OR OrderPaid_Date <= @DateTo)";

                var tailoringIncome = connection.ExecuteScalar<decimal>(tailoringSql, dateParams);

                // ── 2. Other Income (Extra_Income) ───────────────────────────────
                var otherIncomeSql = @"
                    SELECT ISNULL(SUM(Extra_IncomeAmount), 0) AS OtherIncome
                    FROM Extra_Income
                    WHERE InstitutionID = @InstitutionID
                      AND (@DateFrom IS NULL OR Extra_IncomeDate >= @DateFrom)
                      AND (@DateTo   IS NULL OR Extra_IncomeDate <= @DateTo)";

                var otherIncome = connection.ExecuteScalar<decimal>(otherIncomeSql, dateParams);

                // ── 3. Expense ────────────────────────────────────────────────────
                var expenseSql = @"
                    SELECT ISNULL(SUM(ExpanseAmount), 0) AS TotalExpense
                    FROM Expanse
                    WHERE InstitutionID = @InstitutionID
                      AND (@DateFrom IS NULL OR ExpanseDate >= @DateFrom)
                      AND (@DateTo   IS NULL OR ExpanseDate <= @DateTo)";

                var totalExpense = connection.ExecuteScalar<decimal>(expenseSql, dateParams);

                // ── 4. Item Purchase (paid) ───────────────────────────────────────
                var itemPurchaseSql = @"
                    SELECT ISNULL(SUM(ip.PaidAmount), 0) AS ItemPurchasePaid
                    FROM ItemPurchase ip
                    WHERE ip.InstitutionID = @InstitutionID
                      AND (@DateFrom IS NULL OR ip.PurchaseDate >= @DateFrom)
                      AND (@DateTo   IS NULL OR ip.PurchaseDate <= @DateTo)";

                decimal itemPurchasePaid = 0;
                try { itemPurchasePaid = connection.ExecuteScalar<decimal>(itemPurchaseSql, dateParams); } catch { }

                // ── 5. Item Sell Income ───────────────────────────────────────────
                var itemSellSql = @"
                    SELECT ISNULL(SUM(isl.PaidAmount), 0) AS ItemSellPaid
                    FROM ItemSell isl
                    WHERE isl.InstitutionID = @InstitutionID
                      AND (@DateFrom IS NULL OR isl.SellDate >= @DateFrom)
                      AND (@DateTo   IS NULL OR isl.SellDate <= @DateTo)";

                decimal itemSellPaid = 0;
                try { itemSellPaid = connection.ExecuteScalar<decimal>(itemSellSql, dateParams); } catch { }

                // ── 6. Tailoring Due Summary ──────────────────────────────────────────
                var dueSql = @"
                    SELECT
                        ISNULL((SELECT SUM(OrderAmount)
                                FROM [Order]
                                WHERE InstitutionID = @InstitutionID
                                  AND (@DateFrom IS NULL OR CAST(OrderDate AS DATE) >= @DateFrom)
                                  AND (@DateTo   IS NULL OR CAST(OrderDate AS DATE) <= @DateTo)), 0) AS NewOrderAmount,
                        ISNULL((SELECT SUM(Discount)
                                FROM [Order]
                                WHERE InstitutionID = @InstitutionID
                                  AND (@DateFrom IS NULL OR CAST(OrderDate AS DATE) >= @DateFrom)
                                  AND (@DateTo   IS NULL OR CAST(OrderDate AS DATE) <= @DateTo)), 0) AS TotalDiscount,
                        ISNULL((SELECT SUM(DueAmount)
                                FROM [Order]
                                WHERE InstitutionID = @InstitutionID
                                  AND PaymentStatus = 'Due'
                                  AND (@DateFrom IS NULL OR CAST(OrderDate AS DATE) >= @DateFrom)
                                  AND (@DateTo   IS NULL OR CAST(OrderDate AS DATE) <= @DateTo)), 0) AS PostDue";

                var due = connection.QueryFirstOrDefault(dueSql, dateParams);

                // ── 6b. Opening Due (Pre Due) ─────────────────────────────────────────
                decimal preDue = 0;
                if (dateParams.DateFrom.HasValue)
                {
                    try
                    {
                        var preDueSql = @"
                            SELECT TOP 1 ISNULL(TotalDue - Change_Amount, 0)
                            FROM Order_Due_Record
                            WHERE InstitutionID = @InstitutionID
                              AND CAST(Insert_Date AS DATE) < @DateFrom
                            ORDER BY Insert_Date DESC";
                        preDue = connection.ExecuteScalar<decimal>(preDueSql, new { InstitutionID = institutionId, DateFrom = dateParams.DateFrom });
                    }
                    catch { }
                }

                // ── 7. Order count stats ──────────────────────────────────────────
                var orderCountSql = @"
                    SELECT
                        COUNT(*)                                                              AS TotalOrders,
                        COUNT(CASE WHEN DeliveryStatus = 'Delivered' THEN 1 END)             AS DeliveredOrders
                    FROM [Order]
                    WHERE InstitutionID = @InstitutionID
                      AND (@DateFrom IS NULL OR CAST(OrderDate AS DATE) >= @DateFrom)
                      AND (@DateTo   IS NULL OR CAST(OrderDate AS DATE) <= @DateTo)";

                var orderCounts = connection.QueryFirstOrDefault(orderCountSql, dateParams);

                var totalIncome  = tailoringIncome + otherIncome + itemSellPaid;
                var totalExpenses = totalExpense + itemPurchasePaid;
                var netBalance   = totalIncome - totalExpenses;

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        TailoringIncome  = tailoringIncome,
                        OtherIncome      = otherIncome,
                        ItemSellIncome   = itemSellPaid,
                        TotalIncome      = totalIncome,
                        TotalExpense     = totalExpense,
                        ItemPurchasePaid = itemPurchasePaid,
                        TotalExpenses    = totalExpenses,
                        NetBalance       = netBalance,
                        PreDue           = preDue,
                        PostDue          = due?.PostDue ?? 0,
                        NewOrderAmount   = due?.NewOrderAmount ?? 0,
                        TotalDiscount    = due?.TotalDiscount ?? 0,
                        TotalOrders      = orderCounts?.TotalOrders ?? 0,
                        DeliveredOrders  = orderCounts?.DeliveredOrders ?? 0
                    }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET: api/IncomeExpenseReport/income-details?institutionId=1&dateFrom=&dateTo=
        [HttpGet("income-details")]
        public IActionResult GetIncomeDetails(int institutionId, string? dateFrom = null, string? dateTo = null)
        {
            try
            {
                using var connection = _context.CreateConnection();

                var dateParams = new
                {
                    InstitutionID = institutionId,
                    DateFrom = string.IsNullOrEmpty(dateFrom) ? (DateTime?)null : DateTime.Parse(dateFrom),
                    DateTo   = string.IsNullOrEmpty(dateTo)   ? (DateTime?)null : DateTime.Parse(dateTo)
                };

                // Tailoring payments breakdown by status
                var tailoringBreakdownSql = @"
                    SELECT
                        Payment_TimeStatus AS PaymentStatus,
                        SUM(Amount)        AS Amount,
                        COUNT(*)           AS RecordCount
                    FROM Payment_Record
                    WHERE InstitutionID = @InstitutionID
                      AND (@DateFrom IS NULL OR OrderPaid_Date >= @DateFrom)
                      AND (@DateTo   IS NULL OR OrderPaid_Date <= @DateTo)
                    GROUP BY Payment_TimeStatus
                    ORDER BY Amount DESC";

                var tailoringBreakdown = connection.Query(tailoringBreakdownSql, dateParams);

                // Other income by category
                var otherIncomeBreakdownSql = @"
                    SELECT
                        ec.Extra_Income_CategoryName AS CategoryName,
                        ISNULL(SUM(ei.Extra_IncomeAmount), 0) AS Amount,
                        COUNT(*) AS RecordCount
                    FROM Extra_Income ei
                    INNER JOIN Extra_IncomeCategory ec ON ei.Extra_IncomeCategoryID = ec.Extra_IncomeCategoryID
                    WHERE ei.InstitutionID = @InstitutionID
                      AND (@DateFrom IS NULL OR ei.Extra_IncomeDate >= @DateFrom)
                      AND (@DateTo   IS NULL OR ei.Extra_IncomeDate <= @DateTo)
                    GROUP BY ec.Extra_Income_CategoryName
                    ORDER BY Amount DESC";

                var otherIncomeBreakdown = connection.Query(otherIncomeBreakdownSql, dateParams);

                // Tailoring records
                var tailoringRecordsSql = @"
                    SELECT TOP 100
                        pr.OrderPaid_Date                          AS PayDate,
                        o.OrderSerialNumber                        AS OrderNo,
                        pr.Amount,
                        pr.Payment_TimeStatus                      AS Status
                    FROM Payment_Record pr
                    INNER JOIN [Order] o ON pr.OrderID = o.OrderID
                    WHERE pr.InstitutionID = @InstitutionID
                      AND (@DateFrom IS NULL OR pr.OrderPaid_Date >= @DateFrom)
                      AND (@DateTo   IS NULL OR pr.OrderPaid_Date <= @DateTo)
                    ORDER BY pr.OrderPaid_Date DESC, o.OrderSerialNumber";

                var tailoringRecords = connection.Query(tailoringRecordsSql, dateParams);

                // Other income records
                var otherIncomeRecordsSql = @"
                    SELECT TOP 100
                        ei.Extra_IncomeDate  AS IncomeDate,
                        ec.Extra_Income_CategoryName AS CategoryName,
                        ei.Extra_IncomeFor   AS Description,
                        ei.Extra_IncomeAmount AS Amount,
                        ISNULL(a.AccountName, '-') AS AccountName
                    FROM Extra_Income ei
                    INNER JOIN Extra_IncomeCategory ec ON ei.Extra_IncomeCategoryID = ec.Extra_IncomeCategoryID
                    LEFT JOIN Account a ON ei.AccountID = a.AccountID
                    WHERE ei.InstitutionID = @InstitutionID
                      AND (@DateFrom IS NULL OR ei.Extra_IncomeDate >= @DateFrom)
                      AND (@DateTo   IS NULL OR ei.Extra_IncomeDate <= @DateTo)
                    ORDER BY ei.Extra_IncomeDate DESC";

                var otherIncomeRecords = connection.Query(otherIncomeRecordsSql, dateParams);

                return Ok(new
                {
                    success = true,
                    tailoringBreakdown,
                    otherIncomeBreakdown,
                    tailoringRecords,
                    otherIncomeRecords
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET: api/IncomeExpenseReport/expense-details?institutionId=1&dateFrom=&dateTo=
        [HttpGet("expense-details")]
        public IActionResult GetExpenseDetails(int institutionId, string? dateFrom = null, string? dateTo = null)
        {
            try
            {
                using var connection = _context.CreateConnection();

                var dateParams = new
                {
                    InstitutionID = institutionId,
                    DateFrom = string.IsNullOrEmpty(dateFrom) ? (DateTime?)null : DateTime.Parse(dateFrom),
                    DateTo   = string.IsNullOrEmpty(dateTo)   ? (DateTime?)null : DateTime.Parse(dateTo)
                };

                // Expense by category
                var expenseByCategorySql = @"
                    SELECT
                        ec.CategoryName,
                        ISNULL(SUM(e.ExpanseAmount), 0) AS Amount,
                        COUNT(*) AS RecordCount
                    FROM Expanse e
                    INNER JOIN Expanse_Category ec ON e.ExpanseCategoryID = ec.ExpanseCategoryID
                    WHERE e.InstitutionID = @InstitutionID
                      AND (@DateFrom IS NULL OR e.ExpanseDate >= @DateFrom)
                      AND (@DateTo   IS NULL OR e.ExpanseDate <= @DateTo)
                    GROUP BY ec.CategoryName
                    ORDER BY Amount DESC";

                var expenseByCategory = connection.Query(expenseByCategorySql, dateParams);

                // Expense records
                var expenseRecordsSql = @"
                    SELECT TOP 100
                        e.ExpanseDate                      AS ExpenseDate,
                        ec.CategoryName,
                        e.ExpanseFor                       AS Description,
                        e.ExpanseAmount                    AS Amount,
                        ISNULL(a.AccountName, '-')         AS AccountName
                    FROM Expanse e
                    INNER JOIN Expanse_Category ec ON e.ExpanseCategoryID = ec.ExpanseCategoryID
                    LEFT JOIN Account a ON e.AccountID = a.AccountID
                    WHERE e.InstitutionID = @InstitutionID
                      AND (@DateFrom IS NULL OR e.ExpanseDate >= @DateFrom)
                      AND (@DateTo   IS NULL OR e.ExpanseDate <= @DateTo)
                    ORDER BY e.ExpanseDate DESC";

                var expenseRecords = connection.Query(expenseRecordsSql, dateParams);

                return Ok(new
                {
                    success = true,
                    expenseByCategory,
                    expenseRecords
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET: api/IncomeExpenseReport/monthly-trend?institutionId=1
        [HttpGet("monthly-trend")]
        public IActionResult GetMonthlyTrend(int institutionId)
        {
            try
            {
                using var connection = _context.CreateConnection();

                var sql = @"
                    SELECT
                        FORMAT(dt, 'yyyy-MM') AS [Month],
                        ISNULL(SUM(Income), 0)  AS TotalIncome,
                        ISNULL(SUM(Expense), 0) AS TotalExpense
                    FROM (
                        SELECT OrderPaid_Date AS dt, Amount AS Income, 0 AS Expense
                        FROM Payment_Record
                        WHERE InstitutionID = @InstitutionID
                          AND OrderPaid_Date >= DATEADD(MONTH, -11, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))

                        UNION ALL

                        SELECT Extra_IncomeDate, Extra_IncomeAmount, 0
                        FROM Extra_Income
                        WHERE InstitutionID = @InstitutionID
                          AND Extra_IncomeDate >= DATEADD(MONTH, -11, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))

                        UNION ALL

                        SELECT ExpanseDate, 0, ExpanseAmount
                        FROM Expanse
                        WHERE InstitutionID = @InstitutionID
                          AND ExpanseDate >= DATEADD(MONTH, -11, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
                    ) AS Combined
                    GROUP BY FORMAT(dt, 'yyyy-MM')
                    ORDER BY [Month]";

                var data = connection.Query(sql, new { InstitutionID = institutionId });

                return Ok(new { success = true, data });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET: api/IncomeExpenseReport/accounts?institutionId=1&dateFrom=&dateTo=
        [HttpGet("accounts")]
        public IActionResult GetAccountSummary(int institutionId, string? dateFrom = null, string? dateTo = null)
        {
            try
            {
                using var connection = _context.CreateConnection();

                var accountsSql = @"
                    SELECT
                        a.AccountID,
                        a.AccountName,
                        a.AccountBalance,
                        ISNULL((SELECT SUM(Amount) FROM Account_Log
                                WHERE InstitutionID = @InstitutionID AND AccountID = a.AccountID
                                  AND In_Ex_type = 'In' AND Add_Subtraction = 'Add'
                                  AND (@DateFrom IS NULL OR Insert_Date >= @DateFrom)
                                  AND (@DateTo   IS NULL OR Insert_Date <= @DateTo)), 0)
                        -
                        ISNULL((SELECT SUM(Amount) FROM Account_Log
                                WHERE InstitutionID = @InstitutionID AND AccountID = a.AccountID
                                  AND In_Ex_type = 'In' AND Add_Subtraction = 'Subtraction'
                                  AND (@DateFrom IS NULL OR Insert_Date >= @DateFrom)
                                  AND (@DateTo   IS NULL OR Insert_Date <= @DateTo)), 0) AS TotalIn,

                        ISNULL((SELECT SUM(Amount) FROM Account_Log
                                WHERE InstitutionID = @InstitutionID AND AccountID = a.AccountID
                                  AND In_Ex_type = 'Ex' AND Add_Subtraction = 'Subtraction'
                                  AND (@DateFrom IS NULL OR Insert_Date >= @DateFrom)
                                  AND (@DateTo   IS NULL OR Insert_Date <= @DateTo)), 0)
                        -
                        ISNULL((SELECT SUM(Amount) FROM Account_Log
                                WHERE InstitutionID = @InstitutionID AND AccountID = a.AccountID
                                  AND In_Ex_type = 'Ex' AND Add_Subtraction = 'Add'
                                  AND (@DateFrom IS NULL OR Insert_Date >= @DateFrom)
                                  AND (@DateTo   IS NULL OR Insert_Date <= @DateTo)), 0) AS TotalEx,

                        (SELECT TOP 1 Balance_Before FROM Account_Log
                         WHERE InstitutionID = @InstitutionID AND AccountID = a.AccountID
                           AND (@DateFrom IS NULL OR Insert_Date >= @DateFrom)
                           AND (@DateTo   IS NULL OR Insert_Date <= @DateTo)
                         ORDER BY Insert_Date ASC, Insert_Time ASC) AS BalanceBefore,

                        (SELECT TOP 1 Balance_After FROM Account_Log
                         WHERE InstitutionID = @InstitutionID AND AccountID = a.AccountID
                           AND (@DateFrom IS NULL OR Insert_Date >= @DateFrom)
                           AND (@DateTo   IS NULL OR Insert_Date <= @DateTo)
                         ORDER BY Insert_Date DESC, Insert_Time DESC) AS BalanceAfter

                    FROM Account a
                    WHERE a.InstitutionID = @InstitutionID
                    ORDER BY a.Default_Status DESC, a.AccountName";

                var dateParams = new
                {
                    InstitutionID = institutionId,
                    DateFrom = string.IsNullOrEmpty(dateFrom) ? (DateTime?)null : DateTime.Parse(dateFrom),
                    DateTo   = string.IsNullOrEmpty(dateTo)   ? (DateTime?)null : DateTime.Parse(dateTo)
                };

                var accounts = connection.Query(accountsSql, dateParams);

                // Income breakdown by category across all accounts
                var incomeCategorySql = @"
                    SELECT
                        al.Category,
                        ISNULL(SUM(CASE WHEN al.Add_Subtraction = 'Add'         THEN al.Amount ELSE 0 END), 0)
                      - ISNULL(SUM(CASE WHEN al.Add_Subtraction = 'Subtraction' THEN al.Amount ELSE 0 END), 0) AS NetAmount
                    FROM Account_Log al
                    WHERE al.InstitutionID = @InstitutionID
                      AND al.In_Ex_type = 'In'
                      AND al.AccountID IS NOT NULL
                      AND (@DateFrom IS NULL OR al.Insert_Date >= @DateFrom)
                      AND (@DateTo   IS NULL OR al.Insert_Date <= @DateTo)
                    GROUP BY al.Category
                    HAVING (ISNULL(SUM(CASE WHEN al.Add_Subtraction='Add' THEN al.Amount ELSE 0 END),0)
                           -ISNULL(SUM(CASE WHEN al.Add_Subtraction='Subtraction' THEN al.Amount ELSE 0 END),0)) <> 0
                    ORDER BY NetAmount DESC";

                var incomeByCategory = connection.Query(incomeCategorySql, dateParams);

                // Expense breakdown by category across all accounts
                var expenseCategorySql = @"
                    SELECT
                        al.Category,
                        ISNULL(SUM(CASE WHEN al.Add_Subtraction = 'Subtraction' THEN al.Amount ELSE 0 END), 0)
                      - ISNULL(SUM(CASE WHEN al.Add_Subtraction = 'Add'         THEN al.Amount ELSE 0 END), 0) AS NetAmount
                    FROM Account_Log al
                    WHERE al.InstitutionID = @InstitutionID
                      AND al.In_Ex_type = 'Ex'
                      AND al.AccountID IS NOT NULL
                      AND (@DateFrom IS NULL OR al.Insert_Date >= @DateFrom)
                      AND (@DateTo   IS NULL OR al.Insert_Date <= @DateTo)
                    GROUP BY al.Category
                    HAVING (ISNULL(SUM(CASE WHEN al.Add_Subtraction='Subtraction' THEN al.Amount ELSE 0 END),0)
                           -ISNULL(SUM(CASE WHEN al.Add_Subtraction='Add' THEN al.Amount ELSE 0 END),0)) <> 0
                    ORDER BY NetAmount DESC";

                var expenseByCategory = connection.Query(expenseCategorySql, dateParams);

                return Ok(new
                {
                    success = true,
                    accounts,
                    incomeByCategory,
                    expenseByCategory
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET: api/IncomeExpenseReport/net-summary?institutionId=1&dateFrom=&dateTo=
        [HttpGet("net-summary")]
        public IActionResult GetNetSummary(int institutionId, string? dateFrom = null, string? dateTo = null)
        {
            try
            {
                using var connection = _context.CreateConnection();

                bool hasDate = !string.IsNullOrEmpty(dateFrom) && !string.IsNullOrEmpty(dateTo);

                string dateFilter(string col) => hasDate
                    ? $"AND {col} >= '{dateFrom}' AND {col} <= '{dateTo}'"
                    : "";

                string dateFilterAlias(string alias, string col) => hasDate
                    ? $"AND {alias}.{col} >= '{dateFrom}' AND {alias}.{col} <= '{dateTo}'"
                    : "";

                var p = new { InstitutionID = institutionId };

                // ── Total Income ──────────────────────────────────────────────────
                var tailoringIncome = connection.ExecuteScalar<decimal>($@"
                    SELECT ISNULL(SUM(Amount),0) FROM Payment_Record
                    WHERE InstitutionID=@InstitutionID {dateFilter("OrderPaid_Date")}", p);

                var otherIncome = connection.ExecuteScalar<decimal>($@"
                    SELECT ISNULL(SUM(Extra_IncomeAmount),0) FROM Extra_Income
                    WHERE InstitutionID=@InstitutionID {dateFilter("Extra_IncomeDate")}", p);

                decimal itemSellIncome = 0;
                try { itemSellIncome = connection.ExecuteScalar<decimal>($@"
                    SELECT ISNULL(SUM(SellingPaidAmount),0) FROM Fabrics_Selling
                    WHERE InstitutionID=@InstitutionID {dateFilter("SellingDate")}", p); } catch { }

                var totalExpense = connection.ExecuteScalar<decimal>($@"
                    SELECT ISNULL(SUM(ExpanseAmount),0) FROM Expanse
                    WHERE InstitutionID=@InstitutionID {dateFilter("ExpanseDate")}", p);

                decimal itemPurchasePaid = 0;
                try { itemPurchasePaid = connection.ExecuteScalar<decimal>($@"
                    SELECT ISNULL(SUM(BuyingPaidAmount),0) FROM Fabrics_Buying
                    WHERE InstitutionID=@InstitutionID {dateFilter("BuyingDate")}", p); } catch { }

                var totalIncome   = tailoringIncome + otherIncome + itemSellIncome;
                var totalExpenses = totalExpense + itemPurchasePaid;
                var netBalance    = totalIncome - totalExpenses;

                // ── Income by Category ────────────────────────────────────────────
                var incomeCatSql = $@"
                    SELECT CategoryName, Amount FROM (
                        SELECT 'Tailoring' AS CategoryName, ISNULL(SUM(Amount),0) AS Amount
                        FROM Payment_Record
                        WHERE InstitutionID=@InstitutionID {dateFilter("OrderPaid_Date")}
                        HAVING ISNULL(SUM(Amount),0)>0

                        UNION ALL

                        SELECT ec.Extra_Income_CategoryName, ISNULL(SUM(ei.Extra_IncomeAmount),0)
                        FROM Extra_Income ei
                        INNER JOIN Extra_IncomeCategory ec ON ei.Extra_IncomeCategoryID=ec.Extra_IncomeCategoryID
                        WHERE ei.InstitutionID=@InstitutionID {dateFilterAlias("ei", "Extra_IncomeDate")}
                        GROUP BY ec.Extra_Income_CategoryName
                        HAVING ISNULL(SUM(ei.Extra_IncomeAmount),0)>0

                        UNION ALL

                        SELECT 'ItemSell' AS CategoryName, ISNULL(SUM(SellingPaidAmount),0)
                        FROM Fabrics_Selling
                        WHERE InstitutionID=@InstitutionID {dateFilter("SellingDate")}
                        HAVING ISNULL(SUM(SellingPaidAmount),0)>0
                    ) AS IncomeSummary
                    ORDER BY Amount DESC";

                var incomeByCategory = connection.Query(incomeCatSql, p);

                // ── Expense by Category ───────────────────────────────────────────
                var expenseCatSql = $@"
                    SELECT ec.CategoryName, ISNULL(SUM(e.ExpanseAmount),0) AS Amount
                    FROM Expanse e
                    INNER JOIN Expanse_Category ec ON e.ExpanseCategoryID=ec.ExpanseCategoryID
                    WHERE e.InstitutionID=@InstitutionID {dateFilterAlias("e", "ExpanseDate")}
                    GROUP BY ec.CategoryName
                    HAVING ISNULL(SUM(e.ExpanseAmount),0)>0
                    ORDER BY Amount DESC";

                var expenseByCategory = connection.Query(expenseCatSql, p);

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        TotalIncome   = totalIncome,
                        TotalExpenses = totalExpenses,
                        NetBalance    = netBalance
                    },
                    incomeByCategory,
                    expenseByCategory
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }
}
