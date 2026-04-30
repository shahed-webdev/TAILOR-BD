using Microsoft.AspNetCore.Mvc;
using TailorBD.API.Data;
using Dapper;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrderDeliveryReportController : ControllerBase
    {
        private readonly TailorBdContext _context;
        public OrderDeliveryReportController(TailorBdContext context) => _context = context;

        // GET api/OrderDeliveryReport/summary?institutionId=1&dateFrom=&dateTo=
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

                // ── Order Summary ─────────────────────────────────────────────
                var orderSql = @"
                    SELECT
                        COUNT(*)                                      AS TotalOrders,
                        ISNULL(SUM(DressQuantity),0)                  AS TotalDresses,
                        ISNULL(SUM(OrderAmount),0)                    AS TotalAmount,
                        ISNULL(SUM(Discount),0)                       AS TotalDiscount,
                        ISNULL(SUM(PaidAmount),0)                     AS TotalPaid,
                        ISNULL(SUM(DueAmount),0)                      AS TotalDue,
                        COUNT(CASE WHEN DeliveryStatus='Delivered' THEN 1 END) AS DeliveredOrders,
                        COUNT(CASE WHEN DeliveryStatus='Pending'   THEN 1 END) AS PendingOrders
                    FROM (
                        SELECT o.OrderID, o.OrderAmount, o.Discount, o.PaidAmount, o.DueAmount, o.DeliveryStatus,
                               ISNULL((SELECT SUM(DressQuantity) FROM OrderList WHERE OrderID=o.OrderID),0) AS DressQuantity
                        FROM [Order] o
                        WHERE o.InstitutionID=@InstitutionID
                          AND (@DateFrom IS NULL OR o.OrderDate >= @DateFrom)
                          AND (@DateTo   IS NULL OR o.OrderDate <= @DateTo)
                    ) AS T";

                var order = con.QueryFirstOrDefault(orderSql, p);

                // ── Customer Summary ──────────────────────────────────────────
                var customerSql = @"
                    SELECT
                        (SELECT COUNT(*) FROM Customer
                         WHERE InstitutionID=@InstitutionID
                           AND CustomerID IN (
                               SELECT DISTINCT CustomerID FROM [Order]
                               WHERE InstitutionID=@InstitutionID
                                 AND (@DateFrom IS NULL OR OrderDate >= @DateFrom)
                                 AND (@DateTo   IS NULL OR OrderDate <= @DateTo))
                           AND (@DateFrom IS NULL OR CAST(Date AS DATE) >= @DateFrom)
                           AND (@DateTo   IS NULL OR CAST(Date AS DATE) <= @DateTo)) AS NewCustomers,
                        (SELECT COUNT(*) FROM Customer
                         WHERE InstitutionID=@InstitutionID
                           AND CustomerID IN (
                               SELECT DISTINCT CustomerID FROM [Order]
                               WHERE InstitutionID=@InstitutionID
                                 AND (@DateFrom IS NULL OR OrderDate >= @DateFrom)
                                 AND (@DateTo   IS NULL OR OrderDate <= @DateTo))
                           AND NOT ((@DateFrom IS NULL OR CAST(Date AS DATE) >= @DateFrom)
                                AND (@DateTo   IS NULL OR CAST(Date AS DATE) <= @DateTo))) AS OldCustomers";

                var customer = con.QueryFirstOrDefault(customerSql, p);

                // ── Delivery Summary (by delivery date) ───────────────────────
                var deliverySql = @"
                    SELECT
                        ISNULL(SUM(odd.DQuantity), 0)  AS TotalDelivered,
                        ISNULL((SELECT SUM(Amount) FROM Payment_Record
                                WHERE InstitutionID=@InstitutionID
                                  AND Payment_TimeStatus='Delivery'
                                  AND (@DateFrom IS NULL OR OrderPaid_Date >= @DateFrom)
                                  AND (@DateTo   IS NULL OR OrderPaid_Date <= @DateTo)), 0) AS DeliveryPayment
                    FROM Order_Delivery_Date odd
                    WHERE odd.InstitutionID=@InstitutionID
                      AND (@DateFrom IS NULL OR odd.DeliveryInsertDate >= @DateFrom)
                      AND (@DateTo   IS NULL OR odd.DeliveryInsertDate <= @DateTo)";

                var delivery = con.QueryFirstOrDefault(deliverySql, p);

                // ── Pending delivery (by order delivery date) ─────────────────
                var pendingSql = @"
                    SELECT
                        ISNULL(SUM(ol.Pending_Delivery),0)           AS PendingDelivery,
                        ISNULL(SUM(ol.ReadyForDeliveryQuantity),0)   AS ReadyForDelivery,
                        ISNULL(SUM(ol.Pending_Work),0)               AS PendingWork
                    FROM [Order] o
                    INNER JOIN OrderList ol ON o.OrderID = ol.OrderID
                    WHERE o.InstitutionID=@InstitutionID
                      AND (@DateFrom IS NULL OR o.DeliveryDate >= @DateFrom)
                      AND (@DateTo   IS NULL OR o.DeliveryDate <= @DateTo)";

                var pending = con.QueryFirstOrDefault(pendingSql, p);

                return Ok(new
                {
                    success = true,
                    order,
                    customer,
                    delivery,
                    pending
                });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET api/OrderDeliveryReport/dress-breakdown?institutionId=1&dateFrom=&dateTo=&type=order|delivery
        [HttpGet("dress-breakdown")]
        public IActionResult GetDressBreakdown(int institutionId, string type = "order",
            string? dateFrom = null, string? dateTo = null)
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

                string sql;
                if (type == "delivery")
                {
                    sql = @"
                        SELECT d.Dress_Name AS DressName, SUM(odd.DQuantity) AS Quantity
                        FROM Order_Delivery_Date odd
                        INNER JOIN OrderList ol ON odd.OrderListID = ol.OrderListID
                        INNER JOIN Dress d ON ol.DressID = d.DressID
                        WHERE odd.InstitutionID=@InstitutionID
                          AND (@DateFrom IS NULL OR odd.DeliveryInsertDate >= @DateFrom)
                          AND (@DateTo   IS NULL OR odd.DeliveryInsertDate <= @DateTo)
                        GROUP BY d.Dress_Name
                        ORDER BY Quantity DESC";
                }
                else
                {
                    sql = @"
                        SELECT d.Dress_Name AS DressName, SUM(ol.DressQuantity) AS Quantity
                        FROM [Order] o
                        INNER JOIN OrderList ol ON o.OrderID = ol.OrderID
                        INNER JOIN Dress d ON ol.DressID = d.DressID
                        WHERE o.InstitutionID=@InstitutionID
                          AND (@DateFrom IS NULL OR o.OrderDate >= @DateFrom)
                          AND (@DateTo   IS NULL OR o.OrderDate <= @DateTo)
                        GROUP BY d.Dress_Name
                        ORDER BY Quantity DESC";
                }

                var data = con.Query(sql, p);
                return Ok(new { success = true, data });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET api/OrderDeliveryReport/orders?institutionId=1&dateFrom=&dateTo=&page=1&pageSize=50
        [HttpGet("orders")]
        public IActionResult GetOrders(int institutionId, string? dateFrom = null, string? dateTo = null,
            int page = 1, int pageSize = 50)
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
                    WHERE InstitutionID=@InstitutionID
                      AND (@DateFrom IS NULL OR OrderDate >= @DateFrom)
                      AND (@DateTo   IS NULL OR OrderDate <= @DateTo)";

                var total = con.ExecuteScalar<int>(totalSql, p);

                var sql = @"
                    SELECT
                        o.OrderSerialNumber,
                        c.CustomerName,
                        c.Phone,
                        CONVERT(varchar(10), o.OrderDate, 23)    AS OrderDate,
                        CONVERT(varchar(10), o.DeliveryDate, 23) AS DeliveryDate,
                        CONVERT(varchar(10), o.Update_DeliveryDate, 23) AS ActualDeliveryDate,
                        STUFF((SELECT '; ' + d.Dress_Name + ' ' + CAST(ol2.DressQuantity AS NVARCHAR)
                               FROM OrderList ol2 INNER JOIN Dress d ON ol2.DressID=d.DressID
                               WHERE ol2.OrderID=o.OrderID FOR XML PATH('')), 1,1,'') AS Details,
                        o.OrderAmount,
                        o.Discount,
                        o.PaidAmount,
                        o.DueAmount,
                        o.DeliveryStatus,
                        o.WorkStatus
                    FROM [Order] o
                    INNER JOIN Customer c ON o.CustomerID=c.CustomerID
                    WHERE o.InstitutionID=@InstitutionID
                      AND (@DateFrom IS NULL OR o.OrderDate >= @DateFrom)
                      AND (@DateTo   IS NULL OR o.OrderDate <= @DateTo)
                    ORDER BY o.OrderDate DESC, o.OrderSerialNumber DESC
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
