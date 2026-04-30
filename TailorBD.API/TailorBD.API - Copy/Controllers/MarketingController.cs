using Dapper;
using Microsoft.AspNetCore.Mvc;
using TailorBD.API.Data;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MarketingController : ControllerBase
    {
        private readonly TailorBdContext _context;
        private readonly ILogger<MarketingController> _logger;

        public MarketingController(TailorBdContext context, ILogger<MarketingController> logger)
        {
            _context = context;
            _logger  = logger;
        }

        // ?? GET /api/marketing/reports ????????????????????????????????????????
        [HttpGet("reports")]
        public async Task<ActionResult> GetReports(
            [FromQuery] string? possibility = null,
            [FromQuery] string? area = null)
        {
            try
            {
                using var con = _context.CreateConnection();
                var sql = @"
                    SELECT
                        Marketing_Visited_TailorID AS Id,
                        Institution_Name           AS InstitutionName,
                        ContactPerson_Name         AS ContactPersonName,
                        Phone,
                        City,
                        Area,
                        Post_Code                  AS PostCode,
                        Market_Name                AS MarketName,
                        Shop_No                    AS ShopNo,
                        Visited_By                 AS VisitedBy,
                        FeedBack                   AS Feedback,
                        Possibility,
                        Status,
                        Visiting_Date              AS VisitingDate,
                        Insert_Date                AS InsertDate,
                        Deal_Price                 AS DealPrice
                    FROM TBD.Marketing_Visited_Tailor
                    WHERE 1=1";

                var parameters = new DynamicParameters();
                if (!string.IsNullOrWhiteSpace(possibility))
                {
                    sql += " AND Possibility = @possibility";
                    parameters.Add("possibility", possibility);
                }
                if (!string.IsNullOrWhiteSpace(area))
                {
                    sql += " AND Area = @area";
                    parameters.Add("area", area);
                }
                sql += " ORDER BY Marketing_Visited_TailorID DESC";

                var rows = await con.QueryAsync(sql, parameters);
                var data = rows.Select(r => new
                {
                    id                = (int)r.Id,
                    institutionName   = (string)(r.InstitutionName ?? ""),
                    contactPersonName = (string)(r.ContactPersonName ?? ""),
                    phone             = (string)(r.Phone ?? ""),
                    city              = (string)(r.City ?? ""),
                    area              = (string)(r.Area ?? ""),
                    postCode          = (string)(r.PostCode ?? ""),
                    marketName        = (string)(r.MarketName ?? ""),
                    shopNo            = (string)(r.ShopNo ?? ""),
                    visitedBy         = (string)(r.VisitedBy ?? ""),
                    feedback          = (string)(r.Feedback ?? ""),
                    possibility       = (string)(r.Possibility ?? ""),
                    status            = (string)(r.Status ?? ""),
                    visitingDate      = r.VisitingDate == null ? (DateTime?)null : (DateTime)r.VisitingDate,
                    insertDate        = r.InsertDate  == null ? (DateTime?)null : (DateTime)r.InsertDate,
                    dealPrice         = r.DealPrice  == null ? 0.0 : Convert.ToDouble(r.DealPrice),
                }).ToList();

                return Ok(new { success = true, data });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching marketing reports");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ?? POST /api/marketing/reports ???????????????????????????????????????
        [HttpPost("reports")]
        public async Task<ActionResult> CreateReport([FromBody] MarketingReportRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.InstitutionName))
                return BadRequest(new { success = false, message = "Institution name is required." });

            try
            {
                using var con = _context.CreateConnection();
                var sql = @"
                    INSERT INTO TBD.Marketing_Visited_Tailor
                        (Institution_Name, ContactPerson_Name, City, Area, Post_Code,
                         Market_Name, Shop_No, Visited_By, Phone, FeedBack,
                         Possibility, Status, Visiting_Date, Insert_Date, Deal_Price)
                    VALUES
                        (@InstitutionName, @ContactPersonName, @City, @Area, @PostCode,
                         @MarketName, @ShopNo, @VisitedBy, @Phone, @Feedback,
                         @Possibility, 'Expected Client', @VisitingDate, GETDATE(), @DealPrice);
                    SELECT CAST(SCOPE_IDENTITY() AS INT);";

                var id = await con.ExecuteScalarAsync<int>(sql, new
                {
                    req.InstitutionName,
                    req.ContactPersonName,
                    req.City,
                    req.Area,
                    req.PostCode,
                    req.MarketName,
                    req.ShopNo,
                    req.VisitedBy,
                    req.Phone,
                    req.Feedback,
                    req.Possibility,
                    req.VisitingDate,
                    req.DealPrice
                });

                return Ok(new { success = true, message = "??????? ??? ??????", id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating marketing report");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ?? PUT /api/marketing/reports/{id} ??????????????????????????????????
        [HttpPut("reports/{id}")]
        public async Task<ActionResult> UpdateReport(int id, [FromBody] MarketingReportRequest req)
        {
            try
            {
                using var con = _context.CreateConnection();
                var rows = await con.ExecuteAsync(@"
                    UPDATE TBD.Marketing_Visited_Tailor SET
                        Institution_Name   = @InstitutionName,
                        ContactPerson_Name = @ContactPersonName,
                        City               = @City,
                        Area               = @Area,
                        Post_Code          = @PostCode,
                        Market_Name        = @MarketName,
                        Shop_No            = @ShopNo,
                        Visited_By         = @VisitedBy,
                        Phone              = @Phone,
                        FeedBack           = @Feedback,
                        Possibility        = @Possibility,
                        Visiting_Date      = @VisitingDate,
                        Deal_Price         = @DealPrice
                    WHERE Marketing_Visited_TailorID = @id",
                    new
                    {
                        req.InstitutionName, req.ContactPersonName, req.City, req.Area,
                        req.PostCode, req.MarketName, req.ShopNo, req.VisitedBy,
                        req.Phone, req.Feedback, req.Possibility, req.VisitingDate,
                        req.DealPrice, id
                    });

                if (rows == 0) return NotFound(new { success = false, message = "??????? ?????? ???????" });
                return Ok(new { success = true, message = "????? ??? ???????" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating marketing report {Id}", id);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ?? DELETE /api/marketing/reports/{id} ???????????????????????????????
        [HttpDelete("reports/{id}")]
        public async Task<ActionResult> DeleteReport(int id)
        {
            try
            {
                using var con = _context.CreateConnection();
                var rows = await con.ExecuteAsync(
                    "DELETE FROM TBD.Marketing_Visited_Tailor WHERE Marketing_Visited_TailorID = @id",
                    new { id });

                if (rows == 0) return NotFound(new { success = false, message = "??????? ?????? ???????" });
                return Ok(new { success = true, message = "???? ???? ???????" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting marketing report {Id}", id);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ?? POST /api/marketing/send-sms ?????????????????????????????????????
        [HttpPost("send-sms")]
        public async Task<ActionResult> SendSMS([FromBody] SendSmsRequest req)
        {
            if (req.Phones == null || !req.Phones.Any())
                return BadRequest(new { success = false, message = "???? ??? ????? ????????? ????" });
            if (string.IsNullOrWhiteSpace(req.Message))
                return BadRequest(new { success = false, message = "?????? ??????" });

            try
            {
                // Log communication records
                using var con = _context.CreateConnection();
                var sent = 0;
                foreach (var phone in req.Phones.Where(p => !string.IsNullOrWhiteSpace(p)))
                {
                    // Find matching marketing record
                    var mId = await con.ExecuteScalarAsync<int?>(
                        "SELECT TOP 1 Marketing_Visited_TailorID FROM TBD.Marketing_Visited_Tailor WHERE Phone = @phone",
                        new { phone });

                    if (mId.HasValue)
                    {
                        await con.ExecuteAsync(@"
                            INSERT INTO TBD.Marketing_Visited_Tailor_Communication
                                (Marketing_Visited_TailorID, Communication_By, Communication_Mathod,
                                 FollowUpDetails, Communication_Date, Insert_Date)
                            VALUES
                                (@mId, 'TailorBD SMS Panel', 'SMS', @msg, GETDATE(), GETDATE())",
                            new { mId = mId.Value, msg = req.Message });
                    }
                    sent++;
                }

                return Ok(new { success = true, message = $"{sent} ?? SMS ?????? ???????", sent });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending SMS");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }

    // ?? Request Models ????????????????????????????????????????????????????????
    public class MarketingReportRequest
    {
        public string  InstitutionName   { get; set; } = "";
        public string  ContactPersonName { get; set; } = "";
        public string  Phone             { get; set; } = "";
        public string  City              { get; set; } = "";
        public string  Area              { get; set; } = "";
        public string  PostCode          { get; set; } = "";
        public string  MarketName        { get; set; } = "";
        public string  ShopNo            { get; set; } = "";
        public string  VisitedBy         { get; set; } = "";
        public string  Feedback          { get; set; } = "";
        public string  Possibility       { get; set; } = "";
        public DateTime? VisitingDate    { get; set; }
        public double  DealPrice         { get; set; }
    }

    public class SendSmsRequest
    {
        public List<string> Phones  { get; set; } = new();
        public string       Message { get; set; } = "";
    }
}
