using Microsoft.AspNetCore.Mvc;
using TailorBD.API.Models;
using TailorBD.API.Services;
using TailorBD.API.Data;
using Dapper;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DressesController : ControllerBase
    {
        private readonly IDressService _dressService;
        private readonly ILogger<DressesController> _logger;
        private readonly TailorBdContext _context;

        public DressesController(IDressService dressService, ILogger<DressesController> logger, TailorBdContext context)
        {
            _dressService = dressService;
            _logger = logger;
            _context = context;
        }

        /// <summary>
        /// Get all dresses for an institution
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<ApiResponse<IEnumerable<DressDto>>>> GetAllDresses(
            [FromQuery] int institutionId, 
            [FromQuery] int? clothForId = null,
            [FromQuery] int customerId = 0)
        {
            try
            {
                if (institutionId <= 0)
                    return BadRequest(ApiResponse<IEnumerable<DressDto>>.ErrorResponse("Invalid institution ID"));

                var dresses = await _dressService.GetAllDressesAsync(institutionId, clothForId, customerId);
                return Ok(ApiResponse<IEnumerable<DressDto>>.SuccessResponse(dresses, "Dresses retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving dresses for institution {InstitutionId}", institutionId);
                return StatusCode(500, ApiResponse<IEnumerable<DressDto>>.ErrorResponse("An error occurred while retrieving dresses"));
            }
        }

        /// <summary>
        /// Get dress by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<DressDto>>> GetDressById(int id, [FromQuery] int institutionId)
        {
            try
            {
                if (institutionId <= 0)
                    return BadRequest(ApiResponse<DressDto>.ErrorResponse("Invalid institution ID"));

                var dress = await _dressService.GetDressByIdAsync(id, institutionId);
                
                if (dress == null)
                    return NotFound(ApiResponse<DressDto>.ErrorResponse("Dress not found"));

                return Ok(ApiResponse<DressDto>.SuccessResponse(dress, "Dress retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving dress {DressId}", id);
                return StatusCode(500, ApiResponse<DressDto>.ErrorResponse("An error occurred while retrieving dress"));
            }
        }

        /// <summary>
        /// Create a new dress
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ApiResponse<int>>> CreateDress([FromBody] Dress dress)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ApiResponse<int>.ErrorResponse("Invalid dress data"));

                var dressId = await _dressService.CreateDressAsync(dress);
                
                return CreatedAtAction(nameof(GetDressById), 
                    new { id = dressId, institutionId = dress.InstitutionID }, 
                    ApiResponse<int>.SuccessResponse(dressId, "Dress created successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating dress");
                return StatusCode(500, ApiResponse<int>.ErrorResponse("An error occurred while creating dress"));
            }
        }

        /// <summary>
        /// Update an existing dress
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<bool>>> UpdateDress(int id, [FromBody] Dress dress)
        {
            try
            {
                if (id != dress.DressID)
                    return BadRequest(ApiResponse<bool>.ErrorResponse("Dress ID mismatch"));

                if (!ModelState.IsValid)
                    return BadRequest(ApiResponse<bool>.ErrorResponse("Invalid dress data"));

                var result = await _dressService.UpdateDressAsync(dress);
                
                if (!result)
                    return NotFound(ApiResponse<bool>.ErrorResponse("Dress not found"));

                return Ok(ApiResponse<bool>.SuccessResponse(true, "Dress updated successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating dress {DressId}", id);
                return StatusCode(500, ApiResponse<bool>.ErrorResponse("An error occurred while updating dress"));
            }
        }

        /// <summary>
        /// Delete a dress
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteDress(int id, [FromQuery] int institutionId)
        {
            try
            {
                if (institutionId <= 0)
                    return BadRequest(ApiResponse<bool>.ErrorResponse("Invalid institution ID"));

                var result = await _dressService.DeleteDressAsync(id, institutionId);
                
                if (!result)
                    return NotFound(ApiResponse<bool>.ErrorResponse("Dress not found"));

                return Ok(ApiResponse<bool>.SuccessResponse(true, "Dress deleted successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting dress {DressId}", id);
                return StatusCode(500, ApiResponse<bool>.ErrorResponse("An error occurred while deleting dress"));
            }
        }

        /// <summary>
        /// GET /api/Dresses/{dressId}/measurements-styles
        /// Returns measurement groups + style groups for a dress, optionally pre-filled with customer data.
        /// </summary>
        [HttpGet("{dressId}/measurements-styles")]
        public async Task<IActionResult> GetMeasurementsStyles(int dressId, [FromQuery] int institutionId, [FromQuery] int customerId = 0)
        {
            try
            {
                using var conn = _context.CreateConnection();

                // Dress details from Customer_Dress (if customer selected)
                var orderDetails = "";
                if (customerId > 0)
                {
                    orderDetails = await conn.QueryFirstOrDefaultAsync<string>(
                        "SELECT CDDetails FROM Customer_Dress WHERE CustomerID=@C AND DressID=@D AND InstitutionID=@I",
                        new { C = customerId, D = dressId, I = institutionId }) ?? "";
                }

                // Measurement groups — include Ascending in SELECT for DISTINCT + ORDER BY
                var groupRows = await conn.QueryAsync(
                    @"SELECT DISTINCT Measurement_GroupID, ISNULL(Ascending, 99999) AS Ascending
                      FROM Measurement_Type
                      WHERE InstitutionID=@I AND DressID=@D
                      ORDER BY Ascending",
                    new { I = institutionId, D = dressId });

                var measurementGroups = new List<object>();
                foreach (var grow in groupRows)
                {
                    int gid = (int)((IDictionary<string, object>)grow)["Measurement_GroupID"];

                    var measurements = (await conn.QueryAsync(
                        @"SELECT mt.MeasurementTypeID, mt.MeasurementType, mt.Measurement_Group_SerialNo,
                                 ISNULL(cm.Measurement,'') AS Measurement
                          FROM Measurement_Type mt
                          LEFT JOIN (
                              SELECT MeasurementTypeID, Measurement FROM Customer_Measurement
                              WHERE CustomerID=@C
                          ) cm ON mt.MeasurementTypeID = cm.MeasurementTypeID
                          WHERE mt.Measurement_GroupID=@G
                          ORDER BY ISNULL(mt.Measurement_Group_SerialNo,99999)",
                        new { C = customerId, G = gid }))
                        .Select(row => (IDictionary<string, object>)row)
                        .Select(dict => new Dictionary<string, object>(dict))
                        .ToList();

                    measurementGroups.Add(new { MeasurementGroupId = gid, Measurements = measurements });
                }

                // Style groups
                var styleCategories = (await conn.QueryAsync(
                    @"SELECT DISTINCT dsc.Dress_Style_CategoryID, dsc.Dress_Style_Category_Name,
                             ISNULL(dsc.CategorySerial, 99999) AS CategorySerial
                      FROM Dress_Style ds
                      JOIN Dress_Style_Category dsc ON ds.Dress_Style_CategoryID = dsc.Dress_Style_CategoryID
                      WHERE ds.DressID=@D
                      ORDER BY CategorySerial",
                    new { D = dressId }))
                    .Select(row => (IDictionary<string, object>)row)
                    .Select(dict => new Dictionary<string, object>(dict))
                    .ToList();

                var styleGroups = new List<object>();
                foreach (var cat in styleCategories)
                {
                    int catId = (int)cat["Dress_Style_CategoryID"];
                    var styles = (await conn.QueryAsync(
                        @"SELECT ds.Dress_StyleID AS DressStyleId,
                                 ds.Dress_Style_Name AS DressStyleName,
                                 ISNULL(cds.DressStyleMesurement,'') AS DressStyleMesurement,
                                 CAST(CASE WHEN cds.Dress_StyleID IS NULL THEN 0 ELSE 1 END AS BIT) AS IsCheck
                          FROM Dress_Style ds
                          LEFT JOIN (
                              SELECT Dress_StyleID, DressStyleMesurement FROM Customer_Dress_Style
                              WHERE CustomerID=@C
                          ) cds ON ds.Dress_StyleID = cds.Dress_StyleID
                          WHERE ds.Dress_Style_CategoryID=@Cat
                          ORDER BY ISNULL(ds.StyleSerial,99999)",
                        new { C = customerId, Cat = catId }))
                        .Select(row => (IDictionary<string, object>)row)
                        .Select(dict => new Dictionary<string, object>(dict))
                        .ToList();

                    styleGroups.Add(new
                    {
                        DressStyleCategoryId = catId,
                        DressStyleCategoryName = (string)cat["Dress_Style_Category_Name"],
                        Styles = styles
                    });
                }

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        orderDetails,
                        measurementGroups,
                        styleGroups
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading measurements-styles for dress {DressId}", dressId);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// GET /api/Dresses/{dressId}/prices
        /// Returns saved price list for a dress.
        /// </summary>
        [HttpGet("{dressId}/prices")]
        public async Task<IActionResult> GetDressPrices(int dressId, [FromQuery] int institutionId)
        {
            try
            {
                using var conn = _context.CreateConnection();
                var prices = (await conn.QueryAsync(
                    @"SELECT Price_For AS PriceFor, Price
                      FROM Dress_Price
                      WHERE DressID=@D AND InstitutionID=@I
                      ORDER BY Price_For",
                    new { D = dressId, I = institutionId }))
                    .Select(row => (IDictionary<string, object>)row)
                    .Select(dict => new Dictionary<string, object>(dict))
                    .ToList();

                return Ok(new { success = true, data = prices });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading prices for dress {DressId}", dressId);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}
