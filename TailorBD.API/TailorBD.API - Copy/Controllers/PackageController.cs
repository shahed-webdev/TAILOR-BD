using Dapper;
using Microsoft.AspNetCore.Mvc;
using TailorBD.API.Data;
using TailorBD.API.Models;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PackageController : ControllerBase
    {
        private readonly TailorBdContext _context;
        private readonly ILogger<PackageController> _logger;

        public PackageController(TailorBdContext context, ILogger<PackageController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/package
        [HttpGet]
        public async Task<ActionResult<ApiResponse<IEnumerable<PackageDto>>>> GetAll()
        {
            try
            {
                using var connection = _context.CreateConnection();
                var packages = await connection.QueryAsync<PackageDto>(
                    "SELECT PackageID, PackageName, Details, Interval FROM Package ORDER BY PackageID DESC");
                return Ok(ApiResponse<IEnumerable<PackageDto>>.SuccessResponse(packages));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching packages");
                return StatusCode(500, ApiResponse<IEnumerable<PackageDto>>.ErrorResponse(ex.Message));
            }
        }

        // POST: api/package
        [HttpPost]
        public async Task<ActionResult<ApiResponse<int>>> Create([FromBody] PackageCreateRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.PackageName))
                    return BadRequest(ApiResponse<int>.ErrorResponse("Package name is required"));

                using var connection = _context.CreateConnection();
                var id = await connection.ExecuteScalarAsync<int>(
                    @"INSERT INTO Package (PackageName, Details, Interval)
                      VALUES (@PackageName, @Details, @Interval);
                      SELECT CAST(SCOPE_IDENTITY() AS INT);",
                    new { request.PackageName, request.Details, request.Interval });

                return Ok(ApiResponse<int>.SuccessResponse(id, "Package created successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating package");
                return StatusCode(500, ApiResponse<int>.ErrorResponse(ex.Message));
            }
        }

        // PUT: api/package/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<bool>>> Update(int id, [FromBody] PackageCreateRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.PackageName))
                    return BadRequest(ApiResponse<bool>.ErrorResponse("Package name is required"));

                using var connection = _context.CreateConnection();
                var rows = await connection.ExecuteAsync(
                    @"UPDATE Package SET PackageName = @PackageName, Details = @Details, Interval = @Interval
                      WHERE PackageID = @PackageID",
                    new { request.PackageName, request.Details, request.Interval, PackageID = id });

                if (rows == 0)
                    return NotFound(ApiResponse<bool>.ErrorResponse("Package not found"));

                return Ok(ApiResponse<bool>.SuccessResponse(true, "Package updated successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating package");
                return StatusCode(500, ApiResponse<bool>.ErrorResponse(ex.Message));
            }
        }

        // DELETE: api/package/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
        {
            try
            {
                using var connection = _context.CreateConnection();

                // Prevent deletion if any institution references this package
                var inUse = await connection.ExecuteScalarAsync<int>(
                    "SELECT COUNT(*) FROM Institution WHERE PackageID = @PackageID", new { PackageID = id });

                if (inUse > 0)
                    return BadRequest(ApiResponse<bool>.ErrorResponse(
                        $"Cannot delete: {inUse} institution(s) are using this package"));

                var rows = await connection.ExecuteAsync(
                    "DELETE FROM Package WHERE PackageID = @PackageID", new { PackageID = id });

                if (rows == 0)
                    return NotFound(ApiResponse<bool>.ErrorResponse("Package not found"));

                return Ok(ApiResponse<bool>.SuccessResponse(true, "Package deleted successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting package");
                return StatusCode(500, ApiResponse<bool>.ErrorResponse(ex.Message));
            }
        }
    }

    public class PackageDto
    {
        public int PackageID { get; set; }
        public string PackageName { get; set; } = "";
        public string? Details { get; set; }
        public string? Interval { get; set; }
    }

    public class PackageCreateRequest
    {
        public string PackageName { get; set; } = "";
        public string? Details { get; set; }
        public string? Interval { get; set; }
    }
}
