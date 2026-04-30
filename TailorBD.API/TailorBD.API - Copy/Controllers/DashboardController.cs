using Microsoft.AspNetCore.Mvc;
using TailorBD.API.Data;
using Dapper;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly TailorBdContext _context;

        public DashboardController(TailorBdContext context) => _context = context;

        /// <summary>
        /// Get dashboard summary stats cards
        /// GET api/Dashboard/stats?institutionId=1
        /// </summary>
        [HttpGet("stats")]
        public IActionResult GetStats(int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();

                var sql = @"
                    SELECT
                        (SELECT COUNT(*) FROM Customer
                         WHERE InstitutionID = @InstitutionID)                          AS totalCustomers,

                        (SELECT COUNT(*) FROM [Order]
                         WHERE InstitutionID = @InstitutionID)                          AS totalOrders,

                        (SELECT COUNT(*) FROM [Order]
                         WHERE InstitutionID = @InstitutionID
                           AND DeliveryStatus IN (N'Pending', N'PartlyDelivered'))      AS pendingOrders,

                        (SELECT ISNULL(SUM(DueAmount), 0) FROM [Order]
                         WHERE InstitutionID = @InstitutionID
                           AND PaymentStatus = N'Due')                                  AS totalDue,

                        (SELECT ISNULL(SUM(Amount), 0) FROM Payment_Record
                         WHERE InstitutionID = @InstitutionID
                           AND MONTH(OrderPaid_Date) = MONTH(GETDATE())
                           AND YEAR(OrderPaid_Date)  = YEAR(GETDATE()))                 AS monthlyRevenue,

                        (SELECT COUNT(*) FROM Customer
                         WHERE InstitutionID = @InstitutionID
                           AND MONTH(Date) = MONTH(DATEADD(MONTH, -1, GETDATE()))
                           AND YEAR(Date)  = YEAR(DATEADD(MONTH, -1, GETDATE())))      AS lastMonthCustomers,

                        (SELECT COUNT(*) FROM [Order]
                         WHERE InstitutionID = @InstitutionID
                           AND MONTH(OrderDate) = MONTH(DATEADD(MONTH, -1, GETDATE()))
                           AND YEAR(OrderDate)  = YEAR(DATEADD(MONTH, -1, GETDATE()))) AS lastMonthOrders,

                        (SELECT ISNULL(SUM(Amount), 0) FROM Payment_Record
                         WHERE InstitutionID = @InstitutionID
                           AND MONTH(OrderPaid_Date) = MONTH(DATEADD(MONTH, -1, GETDATE()))
                           AND YEAR(OrderPaid_Date)  = YEAR(DATEADD(MONTH, -1, GETDATE()))) AS lastMonthRevenue";

                var data = con.QueryFirstOrDefault(sql, new { InstitutionID = institutionId });
                return Ok(new { success = true, data });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get monthly chart data (last 6 months)
        /// GET api/Dashboard/chart?institutionId=1
        /// </summary>
        [HttpGet("chart")]
        public IActionResult GetChartData(int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();

                var ordersSql = @"
                    SELECT
                        MONTH(OrderDate) AS Month,
                        YEAR(OrderDate)  AS Year,
                        COUNT(*)         AS OrderCount
                    FROM [Order]
                    WHERE InstitutionID = @InstitutionID
                      AND OrderDate >= DATEADD(MONTH, -5, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
                    GROUP BY YEAR(OrderDate), MONTH(OrderDate)
                    ORDER BY Year, Month";

                var revenueSql = @"
                    SELECT
                        MONTH(OrderPaid_Date) AS Month,
                        YEAR(OrderPaid_Date)  AS Year,
                        ISNULL(SUM(Amount), 0) AS Revenue
                    FROM Payment_Record
                    WHERE InstitutionID = @InstitutionID
                      AND OrderPaid_Date >= DATEADD(MONTH, -5, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
                    GROUP BY YEAR(OrderPaid_Date), MONTH(OrderPaid_Date)
                    ORDER BY Year, Month";

                var ordersData = con.Query(ordersSql, new { InstitutionID = institutionId }).ToList();
                var revenueData = con.Query(revenueSql, new { InstitutionID = institutionId }).ToList();

                // Build last 6 months labels
                var months = new List<object>();
                for (int i = 5; i >= 0; i--)
                {
                    var date = DateTime.Now.AddMonths(-i);
                    var ordRow = ordersData.FirstOrDefault(r => (int)r.Month == date.Month && (int)r.Year == date.Year);
                    var revRow = revenueData.FirstOrDefault(r => (int)r.Month == date.Month && (int)r.Year == date.Year);

                    months.Add(new
                    {
                        label = date.ToString("MMM"),
                        month = date.Month,
                        year = date.Year,
                        orderCount = ordRow != null ? (int)ordRow.OrderCount : 0,
                        revenue = revRow != null ? (double)revRow.Revenue : 0.0
                    });
                }

                return Ok(new { success = true, data = months });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get recent orders (last 10)
        /// GET api/Dashboard/recent-orders?institutionId=1
        /// </summary>
        [HttpGet("recent-orders")]
        public IActionResult GetRecentOrders(int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();

                var sql = @"
                    SELECT TOP 10
                        o.OrderSerialNumber  AS orderSerialNumber,
                        c.CustomerName       AS customerName,
                        CONVERT(varchar(10), o.OrderDate, 23) AS orderDate,
                        o.OrderAmount        AS orderAmount,
                        o.DeliveryStatus     AS deliveryStatus,
                        o.PaymentStatus      AS paymentStatus,
                        o.WorkStatus         AS workStatus
                    FROM [Order] o
                    INNER JOIN Customer c ON o.CustomerID = c.CustomerID
                    WHERE o.InstitutionID = @InstitutionID
                    ORDER BY o.OrderDate DESC, o.OrderSerialNumber DESC";

                var data = con.Query(sql, new { InstitutionID = institutionId });
                return Ok(new { success = true, data });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get today's summary stats
        /// GET api/Dashboard/today-stats?institutionId=1
        /// </summary>
        [HttpGet("today-stats")]
        public IActionResult GetTodayStats(int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();

                var sql = @"
                    SELECT
                        -- আজ মোট অর্ডার
                        (SELECT COUNT(*) FROM [Order]
                         WHERE InstitutionID = @InstitutionID
                           AND CAST(OrderDate AS DATE) = CAST(GETDATE() AS DATE))          AS todayOrders,

                        -- আজ মোট ডেলিভারি (Update_DeliveryDate বা Order_Delivery_Date যেটায় আজকের record আছে)
                        (SELECT COUNT(DISTINCT o.OrderID)
                         FROM [Order] o
                         WHERE o.InstitutionID = @InstitutionID
                           AND o.DeliveryStatus = N'Delivered'
                           AND (
                               CAST(o.Update_DeliveryDate AS DATE) = CAST(GETDATE() AS DATE)
                               OR EXISTS (
                                   SELECT 1 FROM Order_Delivery_Date odd
                                   WHERE odd.OrderID = o.OrderID
                                     AND CAST(odd.DeliveryInsertDate AS DATE) = CAST(GETDATE() AS DATE)
                               )
                           ))                                                                  AS todayDeliveries,

                        -- আজ মোট আয় (Payment_Record থেকে)
                        (SELECT ISNULL(SUM(Amount), 0) FROM Payment_Record
                         WHERE InstitutionID = @InstitutionID
                           AND CAST(OrderPaid_Date AS DATE) = CAST(GETDATE() AS DATE))     AS todayIncome,

                        -- আজ মোট ব্যয় (Expanse টেবিল)
                        (SELECT ISNULL(SUM(ExpanseAmount), 0) FROM Expanse
                         WHERE InstitutionID = @InstitutionID
                           AND CAST(ExpanseDate AS DATE) = CAST(GETDATE() AS DATE))        AS todayExpense,

                        -- আজ মোট ডিউ (আজ নতুন অর্ডারের DueAmount)
                        (SELECT ISNULL(SUM(DueAmount), 0) FROM [Order]
                         WHERE InstitutionID = @InstitutionID
                           AND PaymentStatus = N'Due'
                           AND CAST(OrderDate AS DATE) = CAST(GETDATE() AS DATE))          AS todayDue,

                        -- আজ মোট আইটেম সেল (Fabrics_Selling)
                        (SELECT ISNULL(SUM(SellingPaidAmount), 0) FROM Fabrics_Selling
                         WHERE InstitutionID = @InstitutionID
                           AND CAST(SellingDate AS DATE) = CAST(GETDATE() AS DATE))        AS todayItemSale,

                        -- আজ মোট সেল ডিউ (Fabrics_Selling)
                        (SELECT ISNULL(SUM(SellingDueAmount), 0) FROM Fabrics_Selling
                         WHERE InstitutionID = @InstitutionID
                           AND CAST(SellingDate AS DATE) = CAST(GETDATE() AS DATE))        AS todayItemSaleDue";

                var data = con.QueryFirstOrDefault(sql, new { InstitutionID = institutionId });
                return Ok(new { success = true, data });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}
