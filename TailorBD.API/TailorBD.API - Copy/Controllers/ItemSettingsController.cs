using Microsoft.AspNetCore.Mvc;
using Dapper;
using TailorBD.API.Data;

namespace TailorBD.API.Controllers
{
    // ─── Measurement Unit ─────────────────────────────────────────────────────
    [Route("api/[controller]")]
    [ApiController]
    public class ItemMeasurementUnitController : ControllerBase
    {
        private readonly TailorBdContext _context;
        public ItemMeasurementUnitController(TailorBdContext context) => _context = context;

        [HttpGet]
        public IActionResult GetAll([FromQuery] int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var rows = con.Query<dynamic>(
                    @"SELECT FabricMesurementUnitID AS ItemMeasurementUnitID, UnitName
                      FROM Fabrics_Mesurement_Unit
                      WHERE InstitutionID = @InstitutionID
                      ORDER BY FabricMesurementUnitID DESC",
                    new { InstitutionID = institutionId });
                return Ok(new { success = true, data = rows });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpPost]
        public IActionResult Add([FromBody] ItemMeasurementUnitDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.UnitName))
                return BadRequest(new { success = false, message = "ইউনিটের নাম দিন" });
            try
            {
                using var con = _context.CreateConnection();
                var exists = con.ExecuteScalar<int>(
                    "SELECT COUNT(1) FROM Fabrics_Mesurement_Unit WHERE UnitName=@UnitName AND InstitutionID=@InstitutionID",
                    new { dto.UnitName, dto.InstitutionID });
                if (exists > 0)
                    return BadRequest(new { success = false, message = $"'{dto.UnitName}' ইতিমধ্যে যুক্ত আছে" });

                var id = con.QuerySingle<int>(
                    @"INSERT INTO Fabrics_Mesurement_Unit (InstitutionID, RegistrationID, UnitName)
                      VALUES (@InstitutionID, @RegistrationID, @UnitName);
                      SELECT CAST(SCOPE_IDENTITY() AS INT)",
                    new { dto.InstitutionID, dto.RegistrationID, dto.UnitName });
                return Ok(new { success = true, message = "ইউনিট সফলভাবে যুক্ত হয়েছে", data = new { ItemMeasurementUnitID = id, dto.UnitName } });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpPut("{id}")]
        public IActionResult Update(int id, [FromBody] ItemMeasurementUnitDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.UnitName))
                return BadRequest(new { success = false, message = "ইউনিটের নাম দিন" });
            try
            {
                using var con = _context.CreateConnection();
                var exists = con.ExecuteScalar<int>(
                    "SELECT COUNT(1) FROM Fabrics_Mesurement_Unit WHERE UnitName=@UnitName AND InstitutionID=@InstitutionID AND FabricMesurementUnitID!=@Id",
                    new { dto.UnitName, dto.InstitutionID, Id = id });
                if (exists > 0)
                    return BadRequest(new { success = false, message = $"'{dto.UnitName}' ইতিমধ্যে যুক্ত আছে" });

                con.Execute("UPDATE Fabrics_Mesurement_Unit SET UnitName=@UnitName WHERE FabricMesurementUnitID=@Id",
                    new { dto.UnitName, Id = id });
                return Ok(new { success = true, message = "ইউনিট সফলভাবে আপডেট হয়েছে" });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            try
            {
                using var con = _context.CreateConnection();
                con.Execute("DELETE FROM Fabrics_Mesurement_Unit WHERE FabricMesurementUnitID=@Id", new { Id = id });
                return Ok(new { success = true, message = "ইউনিট সফলভাবে মুছা হয়েছে" });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }
    }

    public class ItemMeasurementUnitDto
    {
        public int InstitutionID { get; set; }
        public int RegistrationID { get; set; }
        public string UnitName { get; set; } = string.Empty;
    }


    // ─── Brand ────────────────────────────────────────────────────────────────
    [Route("api/[controller]")]
    [ApiController]
    public class ItemBrandController : ControllerBase
    {
        private readonly TailorBdContext _context;
        public ItemBrandController(TailorBdContext context) => _context = context;

        [HttpGet]
        public IActionResult GetAll([FromQuery] int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var rows = con.Query<dynamic>(
                    @"SELECT FabricsBrandID AS ItemBrandID, FabricsBrandName AS BrandName
                      FROM Fabrics_Brand
                      WHERE InstitutionID = @InstitutionID
                      ORDER BY FabricsBrandID DESC",
                    new { InstitutionID = institutionId });
                return Ok(new { success = true, data = rows });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpPost]
        public IActionResult Add([FromBody] ItemBrandDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.BrandName))
                return BadRequest(new { success = false, message = "ব্র্যান্ডের নাম দিন" });
            try
            {
                using var con = _context.CreateConnection();
                var exists = con.ExecuteScalar<int>(
                    "SELECT COUNT(1) FROM Fabrics_Brand WHERE FabricsBrandName=@BrandName AND InstitutionID=@InstitutionID",
                    new { dto.BrandName, dto.InstitutionID });
                if (exists > 0)
                    return BadRequest(new { success = false, message = $"'{dto.BrandName}' ইতিমধ্যে যুক্ত আছে" });

                var id = con.QuerySingle<int>(
                    @"INSERT INTO Fabrics_Brand (InstitutionID, RegistrationID, FabricsBrandName)
                      VALUES (@InstitutionID, @RegistrationID, @BrandName);
                      SELECT CAST(SCOPE_IDENTITY() AS INT)",
                    new { dto.InstitutionID, dto.RegistrationID, dto.BrandName });
                return Ok(new { success = true, message = "ব্র্যান্ড সফলভাবে যুক্ত হয়েছে", data = new { ItemBrandID = id, dto.BrandName } });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpPut("{id}")]
        public IActionResult Update(int id, [FromBody] ItemBrandDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.BrandName))
                return BadRequest(new { success = false, message = "ব্র্যান্ডের নাম দিন" });
            try
            {
                using var con = _context.CreateConnection();
                var exists = con.ExecuteScalar<int>(
                    "SELECT COUNT(1) FROM Fabrics_Brand WHERE FabricsBrandName=@BrandName AND InstitutionID=@InstitutionID AND FabricsBrandID!=@Id",
                    new { dto.BrandName, dto.InstitutionID, Id = id });
                if (exists > 0)
                    return BadRequest(new { success = false, message = $"'{dto.BrandName}' ইতিমধ্যে যুক্ত আছে" });

                con.Execute("UPDATE Fabrics_Brand SET FabricsBrandName=@BrandName WHERE FabricsBrandID=@Id",
                    new { dto.BrandName, Id = id });
                return Ok(new { success = true, message = "ব্র্যান্ড সফলভাবে আপডেট হয়েছে" });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            try
            {
                using var con = _context.CreateConnection();
                con.Execute("DELETE FROM Fabrics_Brand WHERE FabricsBrandID=@Id", new { Id = id });
                return Ok(new { success = true, message = "ব্র্যান্ড সফলভাবে মুছা হয়েছে" });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }
    }

    public class ItemBrandDto
    {
        public int InstitutionID { get; set; }
        public int RegistrationID { get; set; }
        public string BrandName { get; set; } = string.Empty;
    }


    // ─── Category ─────────────────────────────────────────────────────────────
    [Route("api/[controller]")]
    [ApiController]
    public class ItemCategoryController : ControllerBase
    {
        private readonly TailorBdContext _context;
        public ItemCategoryController(TailorBdContext context) => _context = context;

        [HttpGet]
        public IActionResult GetAll([FromQuery] int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var rows = con.Query<dynamic>(
                    @"SELECT FabricsCategoryID AS ItemCategoryID, FabricsCategoryName AS CategoryName
                      FROM Fabrics_Category
                      WHERE InstitutionID = @InstitutionID
                      ORDER BY FabricsCategoryID DESC",
                    new { InstitutionID = institutionId });
                return Ok(new { success = true, data = rows });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpPost]
        public IActionResult Add([FromBody] ItemCategoryDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.CategoryName))
                return BadRequest(new { success = false, message = "ক্যাটাগরির নাম দিন" });
            try
            {
                using var con = _context.CreateConnection();
                var exists = con.ExecuteScalar<int>(
                    "SELECT COUNT(1) FROM Fabrics_Category WHERE FabricsCategoryName=@CategoryName AND InstitutionID=@InstitutionID",
                    new { dto.CategoryName, dto.InstitutionID });
                if (exists > 0)
                    return BadRequest(new { success = false, message = $"'{dto.CategoryName}' ইতিমধ্যে যুক্ত আছে" });

                var id = con.QuerySingle<int>(
                    @"INSERT INTO Fabrics_Category (InstitutionID, RegistrationID, FabricsCategoryName)
                      VALUES (@InstitutionID, @RegistrationID, @CategoryName);
                      SELECT CAST(SCOPE_IDENTITY() AS INT)",
                    new { dto.InstitutionID, dto.RegistrationID, dto.CategoryName });
                return Ok(new { success = true, message = "ক্যাটাগরি সফলভাবে যুক্ত হয়েছে", data = new { ItemCategoryID = id, dto.CategoryName } });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpPut("{id}")]
        public IActionResult Update(int id, [FromBody] ItemCategoryDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.CategoryName))
                return BadRequest(new { success = false, message = "ক্যাটাগরির নাম দিন" });
            try
            {
                using var con = _context.CreateConnection();
                var exists = con.ExecuteScalar<int>(
                    "SELECT COUNT(1) FROM Fabrics_Category WHERE FabricsCategoryName=@CategoryName AND InstitutionID=@InstitutionID AND FabricsCategoryID!=@Id",
                    new { dto.CategoryName, dto.InstitutionID, Id = id });
                if (exists > 0)
                    return BadRequest(new { success = false, message = $"'{dto.CategoryName}' ইতিমধ্যে যুক্ত আছে" });

                con.Execute("UPDATE Fabrics_Category SET FabricsCategoryName=@CategoryName WHERE FabricsCategoryID=@Id",
                    new { dto.CategoryName, Id = id });
                return Ok(new { success = true, message = "ক্যাটাগরি সফলভাবে আপডেট হয়েছে" });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            try
            {
                using var con = _context.CreateConnection();
                con.Execute("DELETE FROM Fabrics_Category WHERE FabricsCategoryID=@Id", new { Id = id });
                return Ok(new { success = true, message = "ক্যাটাগরি সফলভাবে মুছা হয়েছে" });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }
    }

    public class ItemCategoryDto
    {
        public int InstitutionID { get; set; }
        public int RegistrationID { get; set; }
        public string CategoryName { get; set; } = string.Empty;
    }
}
