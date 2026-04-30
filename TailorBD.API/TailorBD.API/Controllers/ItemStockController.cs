using Microsoft.AspNetCore.Mvc;
using Dapper;
using TailorBD.API.Data;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ItemStockController : ControllerBase
    {
        private readonly TailorBdContext _context;
        public ItemStockController(TailorBdContext context) => _context = context;

        // GET: api/ItemStock/summary?institutionId=
        [HttpGet("summary")]
        public IActionResult GetSummary([FromQuery] int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var summary = con.QuerySingle<dynamic>(@"
                    SELECT
                        COUNT(*)                                                                AS TotalItems,
                        SUM(CASE WHEN StockFabricQuantity > 10  THEN 1 ELSE 0 END)            AS InStock,
                        SUM(CASE WHEN StockFabricQuantity > 0
                                  AND StockFabricQuantity <= 10 THEN 1 ELSE 0 END)            AS LowStock,
                        SUM(CASE WHEN StockFabricQuantity <= 0  THEN 1 ELSE 0 END)            AS OutOfStock,
                        ROUND(SUM(ISNULL(StockFabricQuantity,0)
                              * ISNULL(CurrentBuyingUnitPrice,0)), 2)                         AS StockBuyingValue,
                        ROUND(SUM(ISNULL(StockFabricQuantity,0)
                              * ISNULL(SellingUnitPrice,0)), 2)                               AS StockSellingValue,
                        ISNULL(SUM(TotalBuyingQuantity),0)                                    AS TotalBought,
                        ISNULL(SUM(TotalSellingQuantity),0)                                   AS TotalSold,
                        ISNULL(SUM(TotalDamageQuantity),0)                                    AS TotalDamage,
                        ISNULL(SUM(SupplierTotalReturnQuantity),0)                            AS TotalSupplierReturn,
                        ISNULL(SUM(CustomerTotalReturnQuantity),0)                            AS TotalCustomerReturn
                    FROM Fabrics
                    WHERE InstitutionID = @InstitutionID",
                    new { InstitutionID = institutionId });

                return Ok(new { success = true, data = summary });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET: api/ItemStock/list?institutionId=&page=1&pageSize=20&search=&category=&brand=&status=&sortBy=stock
        [HttpGet("list")]
        public IActionResult GetList(
            [FromQuery] int    institutionId,
            [FromQuery] int    page     = 1,
            [FromQuery] int    pageSize = 20,
            [FromQuery] string? search   = null,
            [FromQuery] string? category = null,
            [FromQuery] string? brand    = null,
            [FromQuery] string? status   = null,   // "in" | "low" | "out"
            [FromQuery] string  sortBy   = "stock") // stock | name | code | buying | selling
        {
            try
            {
                using var con = _context.CreateConnection();
                var offset = (page - 1) * pageSize;

                var where = "WHERE f.InstitutionID = @InstitutionID";
                if (!string.IsNullOrWhiteSpace(search))
                    where += " AND (f.FabricCode LIKE '%'+@Search+'%' OR f.FabricsName LIKE '%'+@Search+'%')";
                if (!string.IsNullOrWhiteSpace(category))
                    where += " AND c.FabricsCategoryName = @Category";
                if (!string.IsNullOrWhiteSpace(brand))
                    where += " AND b.FabricsBrandName = @Brand";
                if (status == "in")
                    where += " AND f.StockFabricQuantity > 10";
                else if (status == "low")
                    where += " AND f.StockFabricQuantity > 0 AND f.StockFabricQuantity <= 10";
                else if (status == "out")
                    where += " AND f.StockFabricQuantity <= 0";

                var orderClause = sortBy switch
                {
                    "name"    => "f.FabricsName ASC",
                    "code"    => "f.FabricCode ASC",
                    "buying"  => "f.CurrentBuyingUnitPrice DESC",
                    "selling" => "f.SellingUnitPrice DESC",
                    "sold"    => "f.TotalSellingQuantity DESC",
                    _         => "f.StockFabricQuantity DESC"
                };

                var sql = $@"
                    SELECT
                        f.FabricID, f.Fabric_SN AS FabricSN,
                        f.FabricCode, f.FabricsName AS FabricName,
                        ISNULL(u.UnitName,'')              AS UnitName,
                        ISNULL(b.FabricsBrandName,'')      AS BrandName,
                        ISNULL(c.FabricsCategoryName,'')   AS CategoryName,
                        f.SellingUnitPrice,
                        f.CurrentBuyingUnitPrice,
                        ISNULL(f.StockFabricQuantity,0)    AS StockQty,
                        ISNULL(f.TotalBuyingQuantity,0)    AS TotalBought,
                        ISNULL(f.TotalSellingQuantity,0)   AS TotalSold,
                        ISNULL(f.TotalDamageQuantity,0)    AS TotalDamage,
                        ISNULL(f.SupplierTotalReturnQuantity,0)           AS SupplierReturn,
                        ISNULL(f.CustomerReturnQuantity_Add_To_Stock,0)   AS CustomerReturn,
                        ROUND(ISNULL(f.StockFabricQuantity,0)
                              * ISNULL(f.CurrentBuyingUnitPrice,0), 2)    AS StockBuyingValue,
                        ROUND(ISNULL(f.StockFabricQuantity,0)
                              * ISNULL(f.SellingUnitPrice,0), 2)          AS StockSellingValue,
                        CASE
                            WHEN f.StockFabricQuantity <= 0  THEN 'out'
                            WHEN f.StockFabricQuantity <= 10 THEN 'low'
                            ELSE 'in'
                        END AS StockStatus
                    FROM Fabrics f
                    LEFT JOIN Fabrics_Mesurement_Unit u ON f.FabricMesurementUnitID = u.FabricMesurementUnitID
                    LEFT JOIN Fabrics_Brand           b ON f.FabricsBrandID         = b.FabricsBrandID
                    LEFT JOIN Fabrics_Category        c ON f.FabricsCategoryID      = c.FabricsCategoryID
                    {where}
                    ORDER BY {orderClause}
                    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

                var countSql = $@"
                    SELECT COUNT(*) FROM Fabrics f
                    LEFT JOIN Fabrics_Brand    b ON f.FabricsBrandID   = b.FabricsBrandID
                    LEFT JOIN Fabrics_Category c ON f.FabricsCategoryID = c.FabricsCategoryID
                    {where}";

                var param = new
                {
                    InstitutionID = institutionId,
                    Offset = offset, PageSize = pageSize,
                    Search = search, Category = category, Brand = brand
                };

                var rows  = con.Query<dynamic>(sql, param);
                var total = con.ExecuteScalar<int>(countSql, param);

                return Ok(new
                {
                    success    = true,
                    data       = rows,
                    totalCount = total,
                    totalPages = (int)Math.Ceiling((double)total / pageSize)
                });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET: api/ItemStock/filters?institutionId=
        [HttpGet("filters")]
        public IActionResult GetFilters([FromQuery] int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var categories = con.Query<dynamic>(
                    "SELECT DISTINCT FabricsCategoryName AS Name FROM Fabrics_Category WHERE InstitutionID=@InstitutionID ORDER BY FabricsCategoryName",
                    new { InstitutionID = institutionId });
                var brands = con.Query<dynamic>(
                    "SELECT DISTINCT FabricsBrandName AS Name FROM Fabrics_Brand WHERE InstitutionID=@InstitutionID ORDER BY FabricsBrandName",
                    new { InstitutionID = institutionId });
                return Ok(new { success = true, categories, brands });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET: api/ItemStock/by-code?code=ABC&institutionId=
        [HttpGet("by-code")]
        public IActionResult GetByCode([FromQuery] string code, [FromQuery] int institutionId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(code))
                    return BadRequest(new { success = false, message = "Code is required" });

                using var con = _context.CreateConnection();
                var item = con.QueryFirstOrDefault<dynamic>(@"
                    SELECT TOP 1
                        f.FabricID,
                        f.FabricCode,
                        f.FabricsName                  AS FabricName,
                        f.SellingUnitPrice,
                        ISNULL(f.StockFabricQuantity,0) AS StockQty,
                        ISNULL(u.UnitName,'')           AS UnitName
                    FROM Fabrics f
                    LEFT JOIN Fabrics_Mesurement_Unit u ON f.FabricMesurementUnitID = u.FabricMesurementUnitID
                    WHERE f.InstitutionID = @InstitutionID
                      AND (
                            f.FabricCode = @Code
                         OR f.FabricCode LIKE @CodeLike
                         OR f.FabricsName LIKE @CodeLike
                      )
                    ORDER BY
                        CASE WHEN f.FabricCode = @Code     THEN 0
                             WHEN f.FabricCode LIKE @CodeLike THEN 1
                             ELSE 2 END",
                    new { InstitutionID = institutionId, Code = code.Trim(), CodeLike = "%" + code.Trim() + "%" });

                if (item == null)
                    return Ok(new { success = false, message = "Item not found" });

                if (item.StockQty <= 0)
                    return Ok(new { success = false, message = "Out of stock", data = item });

                return Ok(new { success = true, data = item });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }
    }
}
