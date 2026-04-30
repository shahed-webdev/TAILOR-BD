using Microsoft.AspNetCore.Mvc;
using Dapper;
using TailorBD.API.Data;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ItemController : ControllerBase
    {
        private readonly TailorBdContext _context;
        public ItemController(TailorBdContext context) => _context = context;

        // GET: api/Item?institutionId=1&search=
        [HttpGet]
        public IActionResult GetAll([FromQuery] int institutionId, [FromQuery] string? search = null)
        {
            try
            {
                using var con = _context.CreateConnection();
                var sql = @"
                    SELECT f.FabricID AS ItemID, f.Fabric_SN AS ItemSN, f.FabricCode AS ItemCode,
                           f.FabricsName AS ItemName, f.FabricsColor AS ItemColor, f.FabricsStyle AS ItemStyle,
                           f.FabricDetails AS ItemDetails, f.SellingUnitPrice, f.CurrentBuyingUnitPrice,
                           f.StockFabricQuantity AS StockQuantity, f.FabricStockStatus AS StockStatus,
                           f.InputDate,
                           u.FabricMesurementUnitID AS MeasurementUnitID, u.UnitName,
                           b.FabricsBrandID AS BrandID, b.FabricsBrandName AS BrandName,
                           c.FabricsCategoryID AS CategoryID, c.FabricsCategoryName AS CategoryName
                    FROM Fabrics f
                    LEFT JOIN Fabrics_Mesurement_Unit u ON f.FabricMesurementUnitID = u.FabricMesurementUnitID
                    LEFT JOIN Fabrics_Brand b ON f.FabricsBrandID = b.FabricsBrandID
                    LEFT JOIN Fabrics_Category c ON f.FabricsCategoryID = c.FabricsCategoryID
                    WHERE f.InstitutionID = @InstitutionID";

                if (!string.IsNullOrWhiteSpace(search))
                    sql += " AND (f.FabricCode LIKE @Search + '%' OR f.FabricsName LIKE '%' + @Search + '%')";

                sql += " ORDER BY f.FabricID DESC";

                var items = con.Query<dynamic>(sql, new { InstitutionID = institutionId, Search = search });
                return Ok(new { success = true, data = items });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // GET: api/Item/{id}
        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            try
            {
                using var con = _context.CreateConnection();
                var sql = @"
                    SELECT f.FabricID AS ItemID, f.Fabric_SN AS ItemSN, f.FabricCode AS ItemCode,
                           f.FabricsName AS ItemName, f.FabricsColor AS ItemColor, f.FabricsStyle AS ItemStyle,
                           f.FabricDetails AS ItemDetails, f.SellingUnitPrice, f.CurrentBuyingUnitPrice,
                           f.StockFabricQuantity AS StockQuantity,
                           u.FabricMesurementUnitID AS MeasurementUnitID, u.UnitName,
                           b.FabricsBrandID AS BrandID, b.FabricsBrandName AS BrandName,
                           c.FabricsCategoryID AS CategoryID, c.FabricsCategoryName AS CategoryName
                    FROM Fabrics f
                    LEFT JOIN Fabrics_Mesurement_Unit u ON f.FabricMesurementUnitID = u.FabricMesurementUnitID
                    LEFT JOIN Fabrics_Brand b ON f.FabricsBrandID = b.FabricsBrandID
                    LEFT JOIN Fabrics_Category c ON f.FabricsCategoryID = c.FabricsCategoryID
                    WHERE f.FabricID = @Id";
                var item = con.QueryFirstOrDefault<dynamic>(sql, new { Id = id });
                if (item == null) return NotFound(new { success = false, message = "আইটেম পাওয়া যায়নি" });
                return Ok(new { success = true, data = item });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // POST: api/Item
        [HttpPost]
        public IActionResult Add([FromBody] ItemDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.ItemName))
                return BadRequest(new { success = false, message = "আইটেমের নাম দিন" });
            if (string.IsNullOrWhiteSpace(dto.ItemCode))
                return BadRequest(new { success = false, message = "আইটেম কোড দিন" });
            if (dto.MeasurementUnitID <= 0)
                return BadRequest(new { success = false, message = "মেজারমেন্ট ইউনিট নির্বাচন করুন" });
            if (dto.SellingUnitPrice <= 0)
                return BadRequest(new { success = false, message = "বিক্রয় মূল্য দিন" });

            try
            {
                using var con = _context.CreateConnection();

                var exists = con.ExecuteScalar<int>(
                    "SELECT COUNT(1) FROM Fabrics WHERE FabricCode = @ItemCode AND InstitutionID = @InstitutionID",
                    new { dto.ItemCode, dto.InstitutionID });
                if (exists > 0)
                    return BadRequest(new { success = false, message = $"'{dto.ItemCode}' কোডটি ইতিমধ্যে যুক্ত আছে" });

                var id = con.QuerySingle<int>(@"
                    INSERT INTO Fabrics
                        (InstitutionID, RegistrationID, FabricMesurementUnitID, FabricsBrandID, FabricsCategoryID,
                         Fabric_SN, FabricCode, FabricsName, FabricsColor, FabricsStyle, FabricDetails, SellingUnitPrice)
                    VALUES
                        (@InstitutionID, @RegistrationID, @MeasurementUnitID, NULLIF(@BrandID,0), NULLIF(@CategoryID,0),
                         dbo.Fabric_SerialNumber(@InstitutionID), @ItemCode, @ItemName,
                         @ItemColor, @ItemStyle, @ItemDetails, @SellingUnitPrice);
                    SELECT CAST(SCOPE_IDENTITY() AS INT)",
                    new
                    {
                        dto.InstitutionID, dto.RegistrationID, dto.MeasurementUnitID,
                        dto.BrandID, dto.CategoryID, dto.ItemCode, dto.ItemName,
                        dto.ItemColor, dto.ItemStyle, dto.ItemDetails, dto.SellingUnitPrice
                    });

                return Ok(new { success = true, message = "আইটেম সফলভাবে যুক্ত হয়েছে", data = new { ItemID = id } });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // PUT: api/Item/{id}
        [HttpPut("{id}")]
        public IActionResult Update(int id, [FromBody] ItemUpdateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.ItemName))
                return BadRequest(new { success = false, message = "আইটেমের নাম দিন" });
            try
            {
                using var con = _context.CreateConnection();
                con.Execute(@"
                    UPDATE Fabrics SET
                        FabricsName       = @ItemName,
                        FabricsColor      = @ItemColor,
                        FabricsStyle      = @ItemStyle,
                        FabricDetails     = @ItemDetails,
                        SellingUnitPrice  = @SellingUnitPrice,
                        CurrentBuyingUnitPrice = ISNULL(NULLIF(@CurrentBuyingUnitPrice,0), CurrentBuyingUnitPrice),
                        Stock_Adjustment  = Stock_Adjustment + @StockAdjustment
                    WHERE FabricID = @Id",
                    new
                    {
                        dto.ItemName, dto.ItemColor, dto.ItemStyle, dto.ItemDetails,
                        dto.SellingUnitPrice, dto.CurrentBuyingUnitPrice,
                        StockAdjustment = dto.StockAdjustment ?? 0,
                        Id = id
                    });
                return Ok(new { success = true, message = "আইটেম সফলভাবে আপডেট হয়েছে" });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // DELETE: api/Item/{id}
        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            try
            {
                using var con = _context.CreateConnection();
                var inUse = con.ExecuteScalar<int>(
                    "SELECT COUNT(1) FROM Fabrics_Buying_List WHERE FabricID = @Id", new { Id = id });
                if (inUse > 0)
                    return BadRequest(new { success = false, message = "এই আইটেমের ক্রয় রেকর্ড আছে, মুছা সম্ভব নয়" });

                con.Execute("DELETE FROM Fabrics WHERE FabricID = @Id", new { Id = id });
                return Ok(new { success = true, message = "আইটেম সফলভাবে মুছা হয়েছে" });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }
    }

    public class ItemDto
    {
        public int InstitutionID { get; set; }
        public int RegistrationID { get; set; }
        public int MeasurementUnitID { get; set; }
        public int BrandID { get; set; }
        public int CategoryID { get; set; }
        public string ItemCode { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public string? ItemColor { get; set; }
        public string? ItemStyle { get; set; }
        public string? ItemDetails { get; set; }
        public double SellingUnitPrice { get; set; }
    }

    public class ItemUpdateDto
    {
        public string ItemName { get; set; } = string.Empty;
        public string? ItemColor { get; set; }
        public string? ItemStyle { get; set; }
        public string? ItemDetails { get; set; }
        public double SellingUnitPrice { get; set; }
        public double CurrentBuyingUnitPrice { get; set; }
        public double? StockAdjustment { get; set; }
    }
}
