using Microsoft.AspNetCore.Mvc;
using Dapper;
using TailorBD.API.Data;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DressPriceController : ControllerBase
    {
        private readonly TailorBdContext _context;

        public DressPriceController(TailorBdContext context)
        {
            _context = context;
        }

        // GET: api/dressprice
        [HttpGet]
        public IActionResult GetDressPrices([FromQuery] int institutionId, [FromQuery] int dressId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                
                var query = @"
                    SELECT 
                        Dress_PriceID as DressPriceId,
                        DressID as DressId,
                        Price_For as PriceFor,
                        Price
                    FROM Dress_Price
                    WHERE DressID = @DressId
                    AND InstitutionID = @InstitutionId
                    ORDER BY Price_For";

                var prices = connection.Query<dynamic>(query, new { DressId = dressId, InstitutionId = institutionId });

                return Ok(new
                {
                    success = true,
                    data = prices
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        // GET: api/dressprice/dress/{dressId}
        [HttpGet("dress/{dressId}")]
        public IActionResult GetDressPricesByDress(int dressId, [FromQuery] int institutionId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                
                var query = @"
                    SELECT 
                        Dress_PriceID as DressPriceId,
                        DressID as DressId,
                        Price_For as PriceFor,
                        Price
                    FROM Dress_Price
                    WHERE DressID = @DressId
                    AND InstitutionID = @InstitutionId
                    ORDER BY Price_For";

                var prices = connection.Query<dynamic>(query, new { DressId = dressId, InstitutionId = institutionId });

                return Ok(new
                {
                    success = true,
                    data = prices
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        // POST: api/DressPrice
        [HttpPost]
        public IActionResult AddDressPrice([FromBody] DressPriceModel model)
        {
            try
            {
                using var connection = _context.CreateConnection();
                
                var insertQuery = @"
                    INSERT INTO Dress_Price 
                    (RegistrationID, InstitutionID, DressID, Price_For, Price)
                    VALUES 
                    (@RegistrationId, @InstitutionId, @DressId, @PriceFor, @Price);
                    SELECT CAST(SCOPE_IDENTITY() as int)";

                var id = connection.QuerySingle<int>(insertQuery, model);

                return Ok(new
                {
                    success = true,
                    message = "চার্জ সফলভাবে যুক্ত হয়েছে",
                    data = new { DressPriceId = id }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        // PUT: api/DressPrice/{id}
        [HttpPut("{id}")]
        public IActionResult UpdateDressPrice(int id, [FromBody] DressPriceModel model)
        {
            try
            {
                using var connection = _context.CreateConnection();
                
                var updateQuery = @"
                    UPDATE Dress_Price 
                    SET Price_For = @PriceFor, 
                        Price = @Price
                    WHERE Dress_PriceID = @DressPriceId
                    AND InstitutionID = @InstitutionId";

                model.DressPriceId = id;
                connection.Execute(updateQuery, model);

                return Ok(new
                {
                    success = true,
                    message = "চার্জ সফলভাবে আপডেট হয়েছে"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        // DELETE: api/DressPrice/{id}
        [HttpDelete("{id}")]
        public IActionResult DeleteDressPrice(int id, [FromQuery] int institutionId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                
                var deleteQuery = @"
                    DELETE FROM Dress_Price 
                    WHERE Dress_PriceID = @DressPriceId
                    AND InstitutionID = @InstitutionId";

                connection.Execute(deleteQuery, new { DressPriceId = id, InstitutionId = institutionId });

                return Ok(new
                {
                    success = true,
                    message = "চার্জ সফলভাবে ডিলিট হয়েছে"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }
    }

    public class DressPriceModel
    {
        public int? DressPriceId { get; set; }
        public int RegistrationId { get; set; }
        public int InstitutionId { get; set; }
        public int DressId { get; set; }
        public string PriceFor { get; set; }
        public decimal Price { get; set; }
    }
}
