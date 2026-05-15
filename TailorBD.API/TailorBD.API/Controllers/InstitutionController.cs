using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using TailorBD.API.Models;
using TailorBD.API.Services;
using System.Drawing;
using System.Drawing.Imaging;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InstitutionController : ControllerBase
    {
        private readonly IInstitutionService _institutionService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<InstitutionController> _logger;
        private readonly IMemoryCache _cache;

        public InstitutionController(
            IInstitutionService institutionService,
            IConfiguration configuration,
            ILogger<InstitutionController> logger,
            IMemoryCache cache)
        {
            _institutionService = institutionService;
            _configuration      = configuration;
            _logger             = logger;
            _cache              = cache;
        }

        /// <summary>
        /// Get institution by ID
        /// </summary>
        [HttpGet("{institutionId}")]
        public async Task<ActionResult<ApiResponse<InstitutionDto>>> GetInstitution(int institutionId)
        {
            try
            {
                var institution = await _institutionService.GetInstitutionByIdAsync(institutionId);
                
                if (institution == null)
                {
                    return NotFound(new ApiResponse<InstitutionDto>
                    {
                        Success = false,
                        Message = "Institution not found"
                    });
                }

                return Ok(new ApiResponse<InstitutionDto>
                {
                    Success = true,
                    Message = "Institution retrieved successfully",
                    Data = institution
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<InstitutionDto>
                {
                    Success = false,
                    Message = "An error occurred while retrieving institution",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        /// <summary>
        /// Get institution logo
        /// </summary>
        [HttpGet("{institutionId}/logo")]
        public async Task<IActionResult> GetInstitutionLogo(int institutionId)
        {
            try
            {
                var institution = await _institutionService.GetInstitutionByIdAsync(institutionId);
                
                if (institution?.InstitutionLogo == null || institution.InstitutionLogo.Length == 0)
                {
                    return NotFound();
                }

                return File(institution.InstitutionLogo, "image/jpeg");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Update institution information
        /// </summary>
        [HttpPut("{institutionId}")]
        public async Task<ActionResult<ApiResponse<bool>>> UpdateInstitution(int institutionId, [FromBody] UpdateInstitutionRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.InstitutionName))
                {
                    return BadRequest(new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Institution name is required"
                    });
                }

                var result = await _institutionService.UpdateInstitutionAsync(institutionId, request);
                
                if (!result)
                {
                    return NotFound(new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Institution not found or update failed"
                    });
                }

                return Ok(new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Institution updated successfully",
                    Data = true
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<bool>
                {
                    Success = false,
                    Message = "An error occurred while updating institution",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        /// <summary>
        /// Update institution logo
        /// </summary>
        [HttpPost("{institutionId}/logo")]
        public async Task<ActionResult<ApiResponse<bool>>> UpdateInstitutionLogo(int institutionId, IFormFile logo)
        {
            try
            {
                if (logo == null || logo.Length == 0)
                {
                    return BadRequest(new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "No logo file provided"
                    });
                }

                // Validate file type
                var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif" };
                if (!allowedTypes.Contains(logo.ContentType.ToLower()))
                {
                    return BadRequest(new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Only JPEG, PNG, and GIF images are allowed"
                    });
                }

                // Validate file size (max 5MB)
                if (logo.Length > 5 * 1024 * 1024)
                {
                    return BadRequest(new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Logo size must be less than 5MB"
                    });
                }

                // Resize image before saving
                using var imageStream = logo.OpenReadStream();
                using var image = Image.FromStream(imageStream);
                
                int maxWidth = 200;
                int maxHeight = 200;
                
                int newWidth = image.Width;
                int newHeight = image.Height;
                
                // Calculate new dimensions
                if (image.Width > maxWidth || image.Height > maxHeight)
                {
                    double ratioX = (double)maxWidth / image.Width;
                    double ratioY = (double)maxHeight / image.Height;
                    double ratio = Math.Min(ratioX, ratioY);
                    
                    newWidth = (int)(image.Width * ratio);
                    newHeight = (int)(image.Height * ratio);
                }
                
                // Create resized image
                using var resizedImage = new Bitmap(image, newWidth, newHeight);
                using var memoryStream = new MemoryStream();
                resizedImage.Save(memoryStream, ImageFormat.Jpeg);
                var logoData = memoryStream.ToArray();

                var result = await _institutionService.UpdateInstitutionLogoAsync(institutionId, logoData);
                
                if (!result)
                {
                    return NotFound(new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Institution not found or logo update failed"
                    });
                }

                return Ok(new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Logo updated successfully",
                    Data = true
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<bool>
                {
                    Success = false,
                    Message = "An error occurred while updating logo",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        /// <summary>
        /// Get print settings for institution
        /// </summary>
        [HttpGet("{institutionId}/print-settings")]
        public async Task<ActionResult> GetPrintSettings(int institutionId)
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new Microsoft.Data.SqlClient.SqlConnection(connectionString);
                await connection.OpenAsync();

                var query = @"
                    SELECT 
                        Print_ShopName, 
                        Print_MasterCopy, 
                        Print_WorkmanCopy, 
                        Print_ShopCopy,
                        Print_Customer_Name,
                        Print_Customer_Phone,
                        Print_Customer_Address,
                        Print_Measurement_Name, 
                        Print_S_Category,
                        Print_Barcode,
                        Print_TopSpace, 
                        Print_Font_Size,
                        M_Receipt_ShopName,
                        M_Receipt_ServedBy,
                        M_Receipt_Barcode,
                        M_Receipt_TopSpace,
                        M_Receipt_FontSize,
                        PoweredByInfo
                    FROM Institution 
                    WHERE InstitutionID = @InstitutionID";

                using var command = new Microsoft.Data.SqlClient.SqlCommand(query, connection);
                command.Parameters.AddWithValue("@InstitutionID", institutionId);

                using var reader = await command.ExecuteReaderAsync();
                
                if (await reader.ReadAsync())
                {
                    // Helper function to safely read integer values
                    int SafeGetInt32(string columnName)
                    {
                        var ordinal = reader.GetOrdinal(columnName);
                        if (reader.IsDBNull(ordinal))
                            return 0;
                        
                        var value = reader.GetValue(ordinal);
                        return Convert.ToInt32(value);
                    }

                    // Helper function to safely read boolean values (bit/int/byte)
                    bool SafeGetBoolean(string columnName)
                    {
                        var ordinal = reader.GetOrdinal(columnName);
                        if (reader.IsDBNull(ordinal))
                            return false;

                        var value = reader.GetValue(ordinal);
                        if (value is bool boolValue)
                            return boolValue;

                        return Convert.ToInt32(value) != 0;
                    }

                    bool? SafeGetNullableBoolean(string columnName)
                    {
                        var ordinal = reader.GetOrdinal(columnName);
                        if (reader.IsDBNull(ordinal))
                            return null;

                        var value = reader.GetValue(ordinal);
                        if (value is bool boolValue)
                            return boolValue;

                        return Convert.ToInt32(value) != 0;
                    }

                    var receiptShopName = SafeGetNullableBoolean("M_Receipt_ShopName");
                    var measurementShopName = SafeGetNullableBoolean("Print_ShopName");

                    var settings = new
                    {
                        measurement = new
                        {
                            printShopName = SafeGetBoolean("Print_ShopName"),
                            printMasterCopy = SafeGetBoolean("Print_MasterCopy"),
                            printWorkmanCopy = SafeGetBoolean("Print_WorkmanCopy"),
                            printShopCopy = SafeGetBoolean("Print_ShopCopy"),
                            printCustomerName = SafeGetBoolean("Print_Customer_Name"),
                            printCustomerPhone = SafeGetBoolean("Print_Customer_Phone"),
                            printCustomerAddress = SafeGetBoolean("Print_Customer_Address"),
                            printMeasurementName = SafeGetBoolean("Print_Measurement_Name"),
                            printStyleCategory = SafeGetBoolean("Print_S_Category"),
                            printBarcode = SafeGetBoolean("Print_Barcode"),
                            topSpace = SafeGetInt32("Print_TopSpace"),
                            fontSize = SafeGetInt32("Print_Font_Size")
                        },
                        moneyReceipt = new
                        {
                            showShopName = receiptShopName ?? measurementShopName ?? false,
                            showServedBy = SafeGetBoolean("M_Receipt_ServedBy"),
                            showReceiptBarcode = SafeGetBoolean("M_Receipt_Barcode"),
                            topSpace = SafeGetInt32("M_Receipt_TopSpace"),
                            fontSize = SafeGetInt32("M_Receipt_FontSize"),
                            poweredByInfo = reader.IsDBNull(reader.GetOrdinal("PoweredByInfo")) 
                                ? "" 
                                : reader.GetString(reader.GetOrdinal("PoweredByInfo"))
                        }
                    };

                    return Ok(new
                    {
                        success = true,
                        data = settings
                    });
                }

                return NotFound(new
                {
                    success = false,
                    message = "Institution not found"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting print settings");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to get print settings: " + ex.Message
                });
            }
        }

        /// <summary>
        /// Update measurement print settings
        /// </summary>
        [HttpPut("{institutionId}/measurement-print-settings")]
        public async Task<ActionResult> UpdateMeasurementPrintSettings(
            int institutionId, 
            [FromBody] MeasurementPrintSettingsModel settings)
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new Microsoft.Data.SqlClient.SqlConnection(connectionString);
                await connection.OpenAsync();

                var query = @"
                    UPDATE Institution 
                    SET 
                        Print_ShopName = @Print_ShopName,
                        Print_MasterCopy = @Print_MasterCopy,
                        Print_WorkmanCopy = @Print_WorkmanCopy,
                        Print_ShopCopy = @Print_ShopCopy,
                        Print_Customer_Name = @Print_Customer_Name,
                        Print_Customer_Phone = @Print_Customer_Phone,
                        Print_Customer_Address = @Print_Customer_Address,
                        Print_Measurement_Name = @Print_Measurement_Name,
                        Print_S_Category = @Print_S_Category,
                        Print_Barcode = @Print_Barcode,
                        Print_TopSpace = @Print_TopSpace,
                        Print_Font_Size = @Print_Font_Size
                    WHERE InstitutionID = @InstitutionID";

                using var command = new Microsoft.Data.SqlClient.SqlCommand(query, connection);
                command.Parameters.AddWithValue("@InstitutionID", institutionId);
                command.Parameters.AddWithValue("@Print_ShopName", settings.PrintShopName);
                command.Parameters.AddWithValue("@Print_MasterCopy", settings.PrintMasterCopy);
                command.Parameters.AddWithValue("@Print_WorkmanCopy", settings.PrintWorkmanCopy);
                command.Parameters.AddWithValue("@Print_ShopCopy", settings.PrintShopCopy);
                command.Parameters.AddWithValue("@Print_Customer_Name", settings.PrintCustomerName);
                command.Parameters.AddWithValue("@Print_Customer_Phone", settings.PrintCustomerPhone);
                command.Parameters.AddWithValue("@Print_Customer_Address", settings.PrintCustomerAddress);
                command.Parameters.AddWithValue("@Print_Measurement_Name", settings.PrintMeasurementName);
                command.Parameters.AddWithValue("@Print_S_Category", settings.PrintStyleCategory);
                command.Parameters.AddWithValue("@Print_Barcode", settings.PrintBarcode);
                command.Parameters.AddWithValue("@Print_TopSpace", settings.TopSpace);
                command.Parameters.AddWithValue("@Print_Font_Size", settings.FontSize);

                await command.ExecuteNonQueryAsync();

                return Ok(new
                {
                    success = true,
                    message = "মাপ প্রিন্ট সেটিং সফলভাবে সংরক্ষণ করা হয়েছে"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating measurement print settings");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to update settings: " + ex.Message
                });
            }
        }

        /// <summary>
        /// Update money receipt print settings
        /// </summary>
        [HttpPut("{institutionId}/money-receipt-print-settings")]
        public async Task<ActionResult> UpdateMoneyReceiptPrintSettings(
            int institutionId, 
            [FromBody] MoneyReceiptPrintSettingsModel settings)
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new Microsoft.Data.SqlClient.SqlConnection(connectionString);
                await connection.OpenAsync();

                var query = @"
                    UPDATE Institution 
                    SET 
                        M_Receipt_ShopName = @M_Receipt_ShopName,
                        M_Receipt_ServedBy = @M_Receipt_ServedBy,
                        M_Receipt_Barcode = @M_Receipt_Barcode,
                        M_Receipt_TopSpace = @M_Receipt_TopSpace,
                        M_Receipt_FontSize = @M_Receipt_FontSize,
                        PoweredByInfo = @PoweredByInfo
                    WHERE InstitutionID = @InstitutionID";

                using var command = new Microsoft.Data.SqlClient.SqlCommand(query, connection);
                command.Parameters.AddWithValue("@InstitutionID", institutionId);
                command.Parameters.AddWithValue("@M_Receipt_ShopName", settings.ShowShopName);
                command.Parameters.AddWithValue("@M_Receipt_ServedBy", settings.ShowServedBy);
                command.Parameters.AddWithValue("@M_Receipt_Barcode", settings.ShowReceiptBarcode);
                command.Parameters.AddWithValue("@M_Receipt_TopSpace", settings.TopSpace);
                command.Parameters.AddWithValue("@M_Receipt_FontSize", settings.FontSize);
                command.Parameters.AddWithValue("@PoweredByInfo", settings.PoweredByInfo ?? "");

                await command.ExecuteNonQueryAsync();

                return Ok(new
                {
                    success = true,
                    message = "মানি রিসিট প্রিন্ট সেটিং সফলভাবে সংরক্ষিত হয়েছে"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating money receipt print settings");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to update settings: " + ex.Message
                });
            }
        }

        /// <summary>
        /// Get dashboard summary stats for Authority
        /// </summary>
        [HttpGet("authority/dashboard")]
        public async Task<ActionResult> GetDashboard()
        {
            try
            {
                var cs = _configuration.GetConnectionString("TailorBDConnectionString");
                using var con = new Microsoft.Data.SqlClient.SqlConnection(cs);
                await con.OpenAsync();

                // ── Query 1: institution counts ───────────────────────────────
                int total = 0, active = 0, inactive = 0, newThisMonth = 0, expired = 0, expiringSoon = 0;
                using (var cmd1 = new Microsoft.Data.SqlClient.SqlCommand(@"
                    SELECT
                        COUNT(*)                                                                   AS Total,
                        SUM(CASE WHEN Validation = 'Valid'  THEN 1 ELSE 0 END)                    AS Active,
                        SUM(CASE WHEN Validation <> 'Valid' THEN 1 ELSE 0 END)                    AS Inactive,
                        SUM(CASE WHEN CAST([Date] AS DATE)
                                 BETWEEN DATEFROMPARTS(YEAR(GETDATE()),MONTH(GETDATE()),1)
                                     AND EOMONTH(GETDATE())
                                 THEN 1 ELSE 0 END)                                               AS NewThisMonth,
                        SUM(CASE WHEN Expire_Date < GETDATE() THEN 1 ELSE 0 END)                  AS Expired,
                        SUM(CASE WHEN Expire_Date BETWEEN GETDATE()
                                      AND DATEADD(DAY,15,GETDATE()) THEN 1 ELSE 0 END)            AS ExpiringSoon
                    FROM Institution", con))
                using (var r1 = await cmd1.ExecuteReaderAsync())
                {
                    if (await r1.ReadAsync())
                    {
                        total        = Convert.ToInt32(r1["Total"]);
                        active       = Convert.ToInt32(r1["Active"]);
                        inactive     = Convert.ToInt32(r1["Inactive"]);
                        newThisMonth = Convert.ToInt32(r1["NewThisMonth"]);
                        expired      = Convert.ToInt32(r1["Expired"]);
                        expiringSoon = Convert.ToInt32(r1["ExpiringSoon"]);
                    }
                }

                // ── Query 2: all-time invoice totals ──────────────────────────
                // Pre-aggregate Invoice_Line per invoice first, then join to Invoice
                double totalPaid = 0, totalDue = 0;
                using (var cmd2 = new Microsoft.Data.SqlClient.SqlCommand(@"
                    SELECT
                        ISNULL(SUM(inv.PaidAmount), 0)                                             AS TotalPaid,
                        ISNULL(SUM(
                            CASE WHEN inv.PaymentStatus <> 'Paid'
                                 THEN ISNULL(NULLIF(inv.TotalAmount, 0), ISNULL(il.LineTotal, 0))
                                      - ISNULL(inv.PaidAmount, 0)
                                 ELSE 0 END
                        ), 0)                                                                      AS TotalDue
                    FROM Invoice inv
                    LEFT JOIN (
                        SELECT InvoiceID, SUM(Amount) AS LineTotal
                        FROM Invoice_Line
                        GROUP BY InvoiceID
                    ) il ON inv.InvoiceID = il.InvoiceID", con))
                using (var r2 = await cmd2.ExecuteReaderAsync())
                {
                    if (await r2.ReadAsync())
                    {
                        totalPaid = Convert.ToDouble(r2["TotalPaid"]);
                        totalDue  = Convert.ToDouble(r2["TotalDue"]);
                    }
                }

                // ── Query 3: current-month invoice totals ─────────────────────
                double monthPaid = 0; int monthDueCount = 0;
                using (var cmd3 = new Microsoft.Data.SqlClient.SqlCommand(@"
                    SELECT
                        ISNULL(SUM(PaidAmount), 0)                                                 AS MonthPaid,
                        SUM(CASE WHEN PaymentStatus <> 'Paid' THEN 1 ELSE 0 END)                  AS MonthDueCount
                    FROM Invoice
                    WHERE CAST(CreateDate AS DATE)
                          BETWEEN DATEFROMPARTS(YEAR(GETDATE()),MONTH(GETDATE()),1)
                              AND EOMONTH(GETDATE())", con))
                using (var r3 = await cmd3.ExecuteReaderAsync())
                {
                    if (await r3.ReadAsync())
                    {
                        monthPaid     = Convert.ToDouble(r3["MonthPaid"]);
                        monthDueCount = Convert.ToInt32(r3["MonthDueCount"]);
                    }
                }

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        total, active, inactive, newThisMonth, expired, expiringSoon,
                        totalPaid, totalDue,
                        monthPaid, monthDueCount
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading dashboard stats");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get all institutions list for Authority panel with filters
        /// </summary>
        [HttpGet("authority/list")]
        public async Task<ActionResult> GetAllInstitutions(
            [FromQuery] string? paymentStatus    = null,
            [FromQuery] string? validationStatus = null,
            [FromQuery] string? search           = null)
        {
            // Search ছাড়া filter-only call গুলো 30 সেকেন্ড cache করি
            var cacheKey = $"auth_ins_list_{validationStatus ?? ""}_{paymentStatus ?? ""}";
            bool useCache = string.IsNullOrWhiteSpace(search);

            if (useCache && _cache.TryGetValue(cacheKey, out List<object>? cached))
                return Ok(new { success = true, data = cached!, total = cached!.Count });

            try
            {
                var cs = _configuration.GetConnectionString("TailorBDConnectionString");
                using var con = new Microsoft.Data.SqlClient.SqlConnection(cs);
                await con.OpenAsync();

                // ── Single-pass CTE: pre-aggregate Invoice data once ──────────
                var query = @"
                    WITH InvAgg AS (
                        SELECT
                            inv.InstitutionID,
                            -- Latest invoice status (per institution)
                            MAX(CASE WHEN rn = 1 THEN inv.PaymentStatus END) AS LatestInvoiceStatus,
                            -- Total due = sum of (totalAmount - paidAmount) for unpaid invoices
                            ISNULL(SUM(
                                CASE WHEN inv.PaymentStatus <> 'Paid'
                                     THEN ISNULL(NULLIF(inv.TotalAmount, 0), ISNULL(il.LineTotal, 0))
                                          - ISNULL(inv.PaidAmount, 0)
                                     ELSE 0 END
                            ), 0) AS TotalDue
                        FROM (
                            SELECT *,
                                   ROW_NUMBER() OVER (PARTITION BY InstitutionID ORDER BY CreateDate DESC) AS rn
                            FROM Invoice
                        ) inv
                        LEFT JOIN (
                            SELECT InvoiceID, ISNULL(SUM(Amount), 0) AS LineTotal
                            FROM Invoice_Line
                            GROUP BY InvoiceID
                        ) il ON inv.InvoiceID = il.InvoiceID
                        GROUP BY inv.InstitutionID
                    )
                    SELECT
                        i.InstitutionID,
                        i.InstitutionName,
                        i.Phone,
                        i.Email,
                        i.Address,
                        i.Validation,
                        i.Expire_Date,
                        i.Date        AS RegisterDate,
                        i.Signing_Money,
                        i.Renew_Amount,
                        i.PackageID,
                        ISNULL(l.UserName, '')            AS UserName,
                        ISNULL(p.PackageName, '')          AS PackageName,
                        ISNULL(a.LatestInvoiceStatus, 'Due') AS LatestInvoiceStatus,
                        ISNULL(a.TotalDue, 0)             AS TotalDue
                    FROM Institution i
                    LEFT JOIN LIU     l ON i.InstitutionID = l.InstitutionID AND l.Category = 'Admin'
                    LEFT JOIN Package p ON i.PackageID = p.PackageID
                    LEFT JOIN InvAgg  a ON i.InstitutionID = a.InstitutionID
                    WHERE 1=1";

                if (!string.IsNullOrEmpty(validationStatus))
                    query += " AND i.Validation = @Validation";

                if (!string.IsNullOrEmpty(paymentStatus))
                    query += " AND ISNULL(a.LatestInvoiceStatus,'Due') = @PaymentStatus";

                if (!string.IsNullOrEmpty(search))
                    query += " AND (i.InstitutionName LIKE @Search OR i.Phone LIKE @Search OR l.UserName LIKE @Search)";

                query += " ORDER BY i.InstitutionID DESC";

                using var cmd = new Microsoft.Data.SqlClient.SqlCommand(query, con);
                if (!string.IsNullOrEmpty(validationStatus))
                    cmd.Parameters.AddWithValue("@Validation",    validationStatus);
                if (!string.IsNullOrEmpty(paymentStatus))
                    cmd.Parameters.AddWithValue("@PaymentStatus", paymentStatus);
                if (!string.IsNullOrEmpty(search))
                    cmd.Parameters.AddWithValue("@Search",        "%" + search + "%");

                cmd.CommandTimeout = 30;

                var list = new List<object>();
                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    list.Add(new
                    {
                        institutionId       = reader["InstitutionID"],
                        institutionName     = reader["InstitutionName"]?.ToString()  ?? "",
                        phone               = reader["Phone"]?.ToString()            ?? "",
                        email               = reader["Email"]?.ToString()            ?? "",
                        address             = reader["Address"]?.ToString()          ?? "",
                        validation          = reader["Validation"]?.ToString()       ?? "",
                        expireDate          = reader["Expire_Date"]   == DBNull.Value ? (DateTime?)null : (DateTime)reader["Expire_Date"],
                        registerDate        = reader["RegisterDate"]  == DBNull.Value ? (DateTime?)null : (DateTime)reader["RegisterDate"],
                        signingMoney        = reader["Signing_Money"] == DBNull.Value ? 0 : Convert.ToDouble(reader["Signing_Money"]),
                        renewAmount         = reader["Renew_Amount"]  == DBNull.Value ? 0 : Convert.ToDouble(reader["Renew_Amount"]),
                        packageId           = reader["PackageID"]     == DBNull.Value ? 0 : Convert.ToInt32(reader["PackageID"]),
                        userName            = reader["UserName"]?.ToString()         ?? "",
                        packageName         = reader["PackageName"]?.ToString()      ?? "",
                        latestInvoiceStatus = reader["LatestInvoiceStatus"]?.ToString() ?? "Due",
                        totalDue            = reader["TotalDue"]      == DBNull.Value ? 0 : Convert.ToDouble(reader["TotalDue"])
                    });
                }

                if (useCache)
                    _cache.Set(cacheKey, list, TimeSpan.FromSeconds(30));

                return Ok(new { success = true, data = list, total = list.Count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting institution list");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Toggle institution validation (Active/Inactive)
        /// </summary>
        [HttpPut("authority/{institutionId}/toggle-status")]
        public async Task<ActionResult> ToggleInstitutionStatus(int institutionId)
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new Microsoft.Data.SqlClient.SqlConnection(connectionString);
                await connection.OpenAsync();

                using var cmd = new Microsoft.Data.SqlClient.SqlCommand(
                    "UPDATE Institution SET Validation = CASE WHEN Validation='Valid' THEN 'Invalid' ELSE 'Valid' END WHERE InstitutionID=@ID; SELECT Validation FROM Institution WHERE InstitutionID=@ID",
                    connection);
                cmd.Parameters.AddWithValue("@ID", institutionId);
                var newStatus = (await cmd.ExecuteScalarAsync())?.ToString();

                return Ok(new { success = true, validation = newStatus });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Sign up a new institution (Authority only)
        /// </summary>
        [HttpPost("authority/signup")]
        public async Task<ActionResult> SignUpInstitution([FromBody] SignUpInstitutionRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.UserName))
                return BadRequest(new { success = false, message = "Username is required" });
            if (string.IsNullOrWhiteSpace(req.Password))
                return BadRequest(new { success = false, message = "Password is required" });
            if (req.Password != req.ConfirmPassword)
                return BadRequest(new { success = false, message = "Passwords do not match" });
            if (string.IsNullOrWhiteSpace(req.InstitutionName))
                return BadRequest(new { success = false, message = "Institution name is required" });
            if (string.IsNullOrWhiteSpace(req.Phone))
                return BadRequest(new { success = false, message = "Phone is required" });
            if (string.IsNullOrWhiteSpace(req.Address))
                return BadRequest(new { success = false, message = "Address is required" });
            if (string.IsNullOrWhiteSpace(req.Masking))
                return BadRequest(new { success = false, message = "Masking is required" });
            if (!System.Text.RegularExpressions.Regex.IsMatch(req.Masking, @"^[A-Za-z0-9. ]{3,11}$"))
                return BadRequest(new { success = false, message = "Masking: 3-11 characters, letters/numbers/dot/space only" });

            try
            {
                var cs = _configuration.GetConnectionString("TailorBDConnectionString");
                using var con = new Microsoft.Data.SqlClient.SqlConnection(cs);
                await con.OpenAsync();

                // Check username uniqueness
                using (var chk = new Microsoft.Data.SqlClient.SqlCommand(
                "SELECT COUNT(*) FROM aspnet_Users WHERE LoweredUserName = @u", con))
                {
                    chk.Parameters.AddWithValue("@u", req.UserName.ToLower());
                    var exists = (int)await chk.ExecuteScalarAsync();
                    if (exists > 0)
                        return Conflict(new { success = false, message = "Username already exists" });
                }

                using var tx = con.BeginTransaction();
                try
                {
                    // 1. Create ASP.NET membership user (aspnet_Users + aspnet_Membership)
                    var appId = await GetOrCreateAppIdAsync(con, tx);
                    var userId = Guid.NewGuid();
                    var now = DateTime.UtcNow;
                    var saltedHash = HashPassword(req.Password);

                    await ExecuteAsync(con, tx,
                        @"INSERT INTO aspnet_Users (ApplicationId, UserId, UserName, LoweredUserName, IsAnonymous, LastActivityDate)
                          VALUES (@AppId, @UserId, @UserName, @LowerUser, 0, @Now)",
                        new Dictionary<string, object> {
                            ["@AppId"] = appId, ["@UserId"] = userId,
                            ["@UserName"] = req.UserName, ["@LowerUser"] = req.UserName.ToLower(), ["@Now"] = now });

                    await ExecuteAsync(con, tx,
                        @"INSERT INTO aspnet_Membership
                            (ApplicationId, UserId, Password, PasswordFormat, PasswordSalt,
                             Email, LoweredEmail, PasswordQuestion, PasswordAnswer,
                             IsApproved, IsLockedOut, CreateDate, LastLoginDate,
                             LastPasswordChangedDate, LastLockoutDate,
                             FailedPasswordAttemptCount, FailedPasswordAttemptWindowStart,
                             FailedPasswordAnswerAttemptCount, FailedPasswordAnswerAttemptWindowStart)
                          VALUES (@AppId, @UserId, @Pwd, 1, @Salt,
                                  @Email, @LowEmail, @Question, @Answer,
                                  0, 0, @Now, @Now, @Now, @MinDate, 0, @MinDate, 0, @MinDate)",
                        new Dictionary<string, object> {
                            ["@AppId"] = appId, ["@UserId"] = userId,
                            ["@Pwd"] = saltedHash.Hash, ["@Salt"] = saltedHash.Salt,
                            ["@Email"] = req.Email ?? "", ["@LowEmail"] = (req.Email ?? "").ToLower(),
                            ["@Question"] = req.SecurityQuestion ?? "q", ["@Answer"] = req.SecurityAnswer ?? "a",
                            ["@Now"] = now, ["@MinDate"] = new DateTime(1754, 1, 1) });

                    // Add to Admin role
                    await ExecuteAsync(con, tx,
                        @"INSERT INTO aspnet_UsersInRoles (UserId, RoleId)
                          SELECT @UserId, RoleId FROM aspnet_Roles
                          WHERE ApplicationId = @AppId AND LoweredRoleName = 'admin'",
                        new Dictionary<string, object> { ["@UserId"] = userId, ["@AppId"] = appId });

                    // 2. Insert Institution
                    var institutionId = await ExecuteScalarAsync<int>(con, tx,
                        @"INSERT INTO Institution
                            (InstitutionName, Dialog_Title, PackageID, Established, Staff,
                             Address, Phone, Email, Website, UserName, Validation,
                             Signing_Money, Renew_Amount, Expire_Date, Date)
                          VALUES
                            (@Name, @DialogTitle, @PackageID, @Established, @Staff,
                             @Address, @Phone, @Email, @Website, @UserName, 'Valid',
                             @SigningMoney, @RenewAmount,
                             (SELECT DATEADD(MONTH,(SELECT Interval FROM Package WHERE PackageID=@PackageID), GETDATE())),
                             GETDATE());
                          SELECT CAST(SCOPE_IDENTITY() AS INT);",
                        new Dictionary<string, object> {
                            ["@Name"] = req.InstitutionName, ["@DialogTitle"] = req.DialogTitle ?? "",
                            ["@PackageID"] = req.PackageID, ["@Established"] = req.Established ?? "",
                            ["@Staff"] = req.Staff ?? "", ["@Address"] = req.Address,
                            ["@Phone"] = req.Phone, ["@Email"] = req.Email ?? "",
                            ["@Website"] = req.Website ?? "", ["@UserName"] = req.UserName,
                            ["@SigningMoney"] = req.SigningMoney, ["@RenewAmount"] = req.RenewAmount });

                    // 3. Insert Registration
                    var registrationId = await ExecuteScalarAsync<int>(con, tx,
                        @"INSERT INTO Registration(InstitutionID, UserName, Validation, Category, CreateDate)
                          VALUES (@InsID, @UserName, 'Valid', 'Admin', GETDATE());
                          SELECT CAST(SCOPE_IDENTITY() AS INT);",
                        new Dictionary<string, object> {
                            ["@InsID"] = institutionId, ["@UserName"] = req.UserName });

                    // 4. Insert LIU
                    await ExecuteAsync(con, tx,
                        @"INSERT INTO LIU (RegistrationID, InstitutionID, UserName, Category, Password, PasswordAnswer)
                          VALUES (@RegID, @InsID, @UserName, 'Admin', @Password, @Answer)",
                        new Dictionary<string, object> {
                            ["@RegID"] = registrationId, ["@InsID"] = institutionId,
                            ["@UserName"] = req.UserName, ["@Password"] = req.Password,
                            ["@Answer"] = req.SecurityAnswer ?? "a" });

                    // 5. Insert Invoice
                    var invoiceId = await ExecuteScalarAsync<int>(con, tx,
                        @"INSERT INTO Invoice
                            (InstitutionID, RegistrationID, IssuDate, EndDate, Invoice_For,
                             Discount, PaymentStatus, CreateDate)
                          VALUES
                            (@InsID, @RegID, GETDATE(),
                             (SELECT DATEADD(MONTH,(SELECT Interval FROM Package WHERE PackageID=@PackageID),GETDATE())),
                             'Signing Money And Renew Amount', 0, 'Due', GETDATE());
                          SELECT CAST(SCOPE_IDENTITY() AS INT);",
                        new Dictionary<string, object> {
                            ["@InsID"] = institutionId, ["@RegID"] = registrationId,
                            ["@PackageID"] = req.PackageID });

                    // 6. Insert Invoice Lines
                    await ExecuteAsync(con, tx,
                        @"INSERT INTO Invoice_Line (InstitutionID, RegistrationID, InvoiceID, Details, Amount)
                          VALUES (@InsID, @RegID, @InvID, 'Signing Money', @Amount)",
                        new Dictionary<string, object> {
                            ["@InsID"] = institutionId, ["@RegID"] = registrationId,
                            ["@InvID"] = invoiceId, ["@Amount"] = req.SigningMoney });

                    var packageName = await ExecuteScalarAsync<string>(con, tx,
                        "SELECT PackageName FROM Package WHERE PackageID=@PackageID",
                        new Dictionary<string, object> { ["@PackageID"] = req.PackageID });

                    await ExecuteAsync(con, tx,
                        @"INSERT INTO Invoice_Line (InstitutionID, RegistrationID, InvoiceID, Details, Amount)
                          VALUES (@InsID, @RegID, @InvID, @Details, @Amount)",
                        new Dictionary<string, object> {
                            ["@InsID"] = institutionId, ["@RegID"] = registrationId,
                            ["@InvID"] = invoiceId, ["@Details"] = packageName ?? "Package",
                            ["@Amount"] = req.RenewAmount });

                    // 7. Insert SMS
                    await ExecuteAsync(con, tx,
                        @"INSERT INTO SMS (SMS_Balance, InstitutionID, Masking, Date)
                          VALUES (10, @InsID, @Masking, GETDATE())",
                        new Dictionary<string, object> {
                            ["@InsID"] = institutionId, ["@Masking"] = req.Masking });

                    tx.Commit();
                    return Ok(new { success = true, message = "Institution registered successfully!", institutionId });
                }
                catch
                {
                    tx.Rollback();
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error signing up institution");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Change institution package
        /// </summary>
        [HttpPut("authority/{institutionId}/change-package")]
        public async Task<ActionResult> ChangePackage(int institutionId, [FromBody] ChangePackageRequest req)
        {
            try
            {
                var cs = _configuration.GetConnectionString("TailorBDConnectionString");
                using var con = new Microsoft.Data.SqlClient.SqlConnection(cs);
                await con.OpenAsync();

                // Get new package info
                using var pkgCmd = new Microsoft.Data.SqlClient.SqlCommand(
                    "SELECT PackageName, Interval FROM Package WHERE PackageID = @PackageID", con);
                pkgCmd.Parameters.AddWithValue("@PackageID", req.PackageId);
                using var pkgReader = await pkgCmd.ExecuteReaderAsync();
                if (!await pkgReader.ReadAsync())
                    return NotFound(new { success = false, message = "Package not found" });

                var packageName = pkgReader["PackageName"]?.ToString() ?? "";
                var interval    = Convert.ToInt32(pkgReader["Interval"]);
                pkgReader.Close();

                // Use custom renew amount if provided, otherwise keep existing
                double renewAmount = req.RenewAmount;

                using var updateCmd = new Microsoft.Data.SqlClient.SqlCommand(
                    @"UPDATE Institution 
                      SET PackageID    = @PackageID,
                          Renew_Amount = @RenewAmount,
                          Expire_Date  = DATEADD(MONTH, @Interval, GETDATE())
                      WHERE InstitutionID = @InstitutionID;
                      SELECT Expire_Date FROM Institution WHERE InstitutionID = @InstitutionID;", con);
                updateCmd.Parameters.AddWithValue("@PackageID",     req.PackageId);
                updateCmd.Parameters.AddWithValue("@RenewAmount",   renewAmount);
                updateCmd.Parameters.AddWithValue("@Interval",      interval);
                updateCmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                var newExpire = await updateCmd.ExecuteScalarAsync();

                return Ok(new
                {
                    success     = true,
                    message     = $"প্যাকেজ \"{packageName}\" তে পরিবর্তন করা হয়েছে",
                    packageName,
                    renewAmount,
                    newExpireDate = newExpire == DBNull.Value ? (DateTime?)null : (DateTime)newExpire
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing package");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get all packages
        /// </summary>
        [HttpGet("authority/packages")]
        public async Task<ActionResult> GetPackages()
        {
            try
            {
                var cs = _configuration.GetConnectionString("TailorBDConnectionString");
                using var con = new Microsoft.Data.SqlClient.SqlConnection(cs);
                await con.OpenAsync();
                using var cmd = new Microsoft.Data.SqlClient.SqlCommand(
                    "SELECT PackageID, PackageName, Interval, Details FROM Package ORDER BY PackageID", con);
                var list = new List<object>();
                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    list.Add(new
                    {
                        packageId   = Convert.ToInt32(reader["PackageID"]),
                        packageName = reader["PackageName"]?.ToString() ?? "",
                        interval    = reader["Interval"] == DBNull.Value ? 0 : Convert.ToInt32(reader["Interval"]),
                        details     = reader["Details"]?.ToString() ?? ""
                    });
                }
                return Ok(new { success = true, data = list });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ══════════════════════════════════════════════════════════════════
        //  USER MANAGEMENT  (Approve / Unlock / Password)
        // ══════════════════════════════════════════════════════════════════

        /// <summary>
        /// Get all institutions with their Admin + Sub-Admin user list, lock/approve status
        /// </summary>
        [HttpGet("authority/users")]
        public async Task<ActionResult> GetUsersForAuthority(
            [FromQuery] string? search = null,
            [FromQuery] string? lockedFilter = null)   // "locked" | "unapproved" | ""
        {
            try
            {
                var cs = _configuration.GetConnectionString("TailorBDConnectionString");
                using var con = new Microsoft.Data.SqlClient.SqlConnection(cs);
                await con.OpenAsync();

                var sql = @"
                    SELECT
                        i.InstitutionID,
                        i.InstitutionName,
                        i.Phone              AS InsPhone,
                        i.Validation,
                        l.LIUID,
                        l.RegistrationID,
                        l.UserName,
                        l.Password,
                        l.Category,
                        ISNULL(r.Name,'')    AS Name,
                        ISNULL(r.Phone,'')   AS UserPhone,
                        ISNULL(r.Email,'')   AS Email,
                        ISNULL(m.IsApproved,  0) AS IsApproved,
                        ISNULL(m.IsLockedOut, 0) AS IsLockedOut,
                        m.LastLockoutDate,
                        m.FailedPasswordAttemptCount
                    FROM Institution i
                    INNER JOIN LIU l           ON i.InstitutionID = l.InstitutionID
                    LEFT  JOIN Registration r  ON l.RegistrationID = r.RegistrationID
                    LEFT  JOIN aspnet_Users  u ON l.UserName = u.UserName
                    LEFT  JOIN aspnet_Membership m ON u.UserId = m.UserId
                    WHERE 1=1";

                if (!string.IsNullOrWhiteSpace(search))
                    sql += " AND (i.InstitutionName LIKE @search OR l.UserName LIKE @search OR i.Phone LIKE @search)";
                if (lockedFilter == "locked")
                    sql += " AND m.IsLockedOut = 1";
                else if (lockedFilter == "unapproved")
                    sql += " AND m.IsApproved = 0";

                sql += " ORDER BY i.InstitutionID DESC, l.Category ASC";

                using var cmd = new Microsoft.Data.SqlClient.SqlCommand(sql, con);
                if (!string.IsNullOrWhiteSpace(search))
                    cmd.Parameters.AddWithValue("@search", "%" + search + "%");

                var rows = new List<object>();
                using var rdr = await cmd.ExecuteReaderAsync();
                while (await rdr.ReadAsync())
                {
                    var lastLockout = rdr["LastLockoutDate"];
                    var failedCount = rdr["FailedPasswordAttemptCount"];
                    rows.Add(new
                    {
                        institutionId    = Convert.ToInt32(rdr["InstitutionID"]),
                        institutionName  = rdr["InstitutionName"]?.ToString() ?? "",
                        insPhone         = rdr["InsPhone"]?.ToString() ?? "",
                        validation       = rdr["Validation"]?.ToString() ?? "",
                        liuId            = Convert.ToInt32(rdr["LIUID"]),
                        registrationId   = Convert.ToInt32(rdr["RegistrationID"]),
                        userName         = rdr["UserName"]?.ToString() ?? "",
                        password         = rdr["Password"]?.ToString() ?? "",
                        category         = rdr["Category"]?.ToString() ?? "",
                        name             = rdr["Name"]?.ToString() ?? "",
                        userPhone        = rdr["UserPhone"]?.ToString() ?? "",
                        email            = rdr["Email"]?.ToString() ?? "",
                        isApproved       = Convert.ToInt32(rdr["IsApproved"]) == 1,
                        isLockedOut      = Convert.ToInt32(rdr["IsLockedOut"]) == 1,
                        lastLockoutDate  = lastLockout == DBNull.Value ? null : (DateTime?)Convert.ToDateTime(lastLockout),
                        failedAttempts   = failedCount == DBNull.Value ? 0 : Convert.ToInt32(failedCount)
                    });
                }

                // Group by institution
                var grouped = rows
                    .Cast<dynamic>()
                    .GroupBy(r => (int)r.institutionId)
                    .Select(g => new
                    {
                        institutionId   = g.Key,
                        institutionName = (string)g.First().institutionName,
                        insPhone        = (string)g.First().insPhone,
                        validation      = (string)g.First().validation,
                        users           = g.ToList()
                    }).ToList();

                return Ok(new { success = true, data = grouped, total = rows.Count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users for authority");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Unlock a user account (clear lockout from aspnet_Membership)
        /// </summary>
        [HttpPost("authority/users/{userName}/unlock")]
        public async Task<ActionResult> UnlockUser(string userName)
        {
            try
            {
                var cs = _configuration.GetConnectionString("TailorBDConnectionString");
                using var con = new Microsoft.Data.SqlClient.SqlConnection(cs);
                await con.OpenAsync();

                using var cmd = new Microsoft.Data.SqlClient.SqlCommand(@"
                    UPDATE aspnet_Membership
                    SET IsLockedOut = 0,
                        FailedPasswordAttemptCount = 0,
                        FailedPasswordAttemptWindowStart = '1754-01-01',
                        LastLockoutDate = '1754-01-01'
                    WHERE UserId = (SELECT UserId FROM aspnet_Users WHERE UserName = @UserName)", con);
                cmd.Parameters.AddWithValue("@UserName", userName);
                var rows = await cmd.ExecuteNonQueryAsync();

                if (rows == 0)
                    return NotFound(new { success = false, message = "User not found in membership" });

                return Ok(new { success = true, message = $"'{userName}' আনলক করা হয়েছে" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unlocking user");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Toggle IsApproved status
        /// </summary>
        [HttpPost("authority/users/{userName}/toggle-approve")]
        public async Task<ActionResult> ToggleApprove(string userName)
        {
            try
            {
                var cs = _configuration.GetConnectionString("TailorBDConnectionString");
                using var con = new Microsoft.Data.SqlClient.SqlConnection(cs);
                await con.OpenAsync();

                using var cmd = new Microsoft.Data.SqlClient.SqlCommand(@"
                    UPDATE aspnet_Membership
                    SET IsApproved = CASE WHEN IsApproved=1 THEN 0 ELSE 1 END
                    WHERE UserId = (SELECT UserId FROM aspnet_Users WHERE UserName = @UserName);
                    SELECT IsApproved FROM aspnet_Membership
                    WHERE UserId = (SELECT UserId FROM aspnet_Users WHERE UserName = @UserName)", con);
                cmd.Parameters.AddWithValue("@UserName", userName);
                var result = await cmd.ExecuteScalarAsync();

                if (result == null || result == DBNull.Value)
                    return NotFound(new { success = false, message = "User not found in membership" });

                var isApproved = Convert.ToInt32(result) == 1;
                return Ok(new { success = true, isApproved, message = isApproved ? "অনুমোদিত হয়েছে" : "অনুমোদন বাতিল হয়েছে" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling approve");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Reset/change password for a LIU user (updates both LIU table and aspnet_Membership)
        /// </summary>
        [HttpPost("authority/users/{userName}/reset-password")]
        public async Task<ActionResult> ResetPassword(string userName, [FromBody] ResetPasswordRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.NewPassword) || req.NewPassword.Length < 6)
                return BadRequest(new { success = false, message = "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে" });

            try
            {
                var cs = _configuration.GetConnectionString("TailorBDConnectionString");
                using var con = new Microsoft.Data.SqlClient.SqlConnection(cs);
                await con.OpenAsync();
                using var tx = con.BeginTransaction();
                try
                {
                    // Update LIU table (plain text — as the system stores it)
                    using var liuCmd = new Microsoft.Data.SqlClient.SqlCommand(
                        "UPDATE LIU SET Password = @Pwd WHERE UserName = @UserName", con, tx);
                    liuCmd.Parameters.AddWithValue("@Pwd", req.NewPassword);
                    liuCmd.Parameters.AddWithValue("@UserName", userName);
                    await liuCmd.ExecuteNonQueryAsync();

                    // Update aspnet_Membership (SHA1 hash)
                    var saltedHash = HashPassword(req.NewPassword);
                    using var memCmd = new Microsoft.Data.SqlClient.SqlCommand(@"
                        UPDATE aspnet_Membership
                        SET Password = @Pwd, PasswordSalt = @Salt,
                            LastPasswordChangedDate = GETDATE(),
                            IsLockedOut = 0,
                            FailedPasswordAttemptCount = 0
                        WHERE UserId = (SELECT UserId FROM aspnet_Users WHERE UserName = @UserName)", con, tx);
                    memCmd.Parameters.AddWithValue("@Pwd", saltedHash.Hash);
                    memCmd.Parameters.AddWithValue("@Salt", saltedHash.Salt);
                    memCmd.Parameters.AddWithValue("@UserName", userName);
                    await memCmd.ExecuteNonQueryAsync();

                    tx.Commit();
                    return Ok(new { success = true, message = $"'{userName}' এর পাসওয়ার্ড পরিবর্তন সফল হয়েছে" });
                }
                catch
                {
                    tx.Rollback();
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting password");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Public endpoint — homepage customer slider এর জন্য (auth ছাড়া)
        /// Returns InstitutionName, Address and logo URL for all Valid institutions
        /// </summary>
        [HttpGet("public/customers")]
        public async Task<ActionResult> GetPublicCustomers()
        {
            try
            {
                var cs = _configuration.GetConnectionString("TailorBDConnectionString");
                using var con = new Microsoft.Data.SqlClient.SqlConnection(cs);
                await con.OpenAsync();

                using var cmd = new Microsoft.Data.SqlClient.SqlCommand(
                    @"SELECT InstitutionID, InstitutionName, 
                             ISNULL(Address,'') AS Address,
                             CASE WHEN InstitutionLogo IS NOT NULL AND DATALENGTH(InstitutionLogo) > 0 
                                  THEN 1 ELSE 0 END AS HasLogo
                      FROM Institution
                      WHERE Validation = 'Valid'
                      ORDER BY InstitutionID DESC", con);

                var list = new List<object>();
                using var rdr = await cmd.ExecuteReaderAsync();
                while (await rdr.ReadAsync())
                {
                    var id = Convert.ToInt32(rdr["InstitutionID"]);
                    var hasLogo = Convert.ToInt32(rdr["HasLogo"]) == 1;
                    list.Add(new
                    {
                        institutionId   = id,
                        institutionName = rdr["InstitutionName"]?.ToString() ?? "",
                        address         = rdr["Address"]?.ToString() ?? "",
                        logoUrl         = hasLogo
                            ? $"/api/institution/{id}/logo"
                            : $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(rdr["InstitutionName"]?.ToString() ?? "T")}&background=6c7ae0&color=fff&size=150&bold=true&rounded=true"
                    });
                }

                return Ok(new { success = true, data = list });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading public customers");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Public endpoint — homepage stats section এর জন্য (auth ছাড়া)
        /// Total shops, customers, orders, delivered, pending
        /// </summary>
        [HttpGet("public/stats")]
        public async Task<ActionResult> GetPublicStats()
        {
            try
            {
                var cs = _configuration.GetConnectionString("TailorBDConnectionString");
                using var con = new Microsoft.Data.SqlClient.SqlConnection(cs);
                await con.OpenAsync();

                // ── All shops (no filter) ──
                int totalShops = 0;
                using (var cmd = new Microsoft.Data.SqlClient.SqlCommand(
                    "SELECT COUNT(*) FROM Institution", con))
                    totalShops = (int)await cmd.ExecuteScalarAsync();

                // ── Total unique customers (across all institutions) ──
                int totalCustomers = 0;
                using (var cmd = new Microsoft.Data.SqlClient.SqlCommand(
                    "SELECT COUNT(*) FROM Customer", con))
                    totalCustomers = (int)await cmd.ExecuteScalarAsync();

                // ── Total orders, delivered, pending ──
                int totalOrders = 0, totalDelivered = 0, totalPending = 0;
                using (var cmd = new Microsoft.Data.SqlClient.SqlCommand(@"
                    SELECT
                        COUNT(*)                                                               AS TotalOrders,
                        SUM(CASE WHEN DeliveryStatus = 'Delivered' THEN 1 ELSE 0 END)         AS Delivered,
                        SUM(CASE WHEN DeliveryStatus <> 'Delivered' THEN 1 ELSE 0 END)        AS Pending
                    FROM [Order]", con))
                using (var rdr = await cmd.ExecuteReaderAsync())
                {
                    if (await rdr.ReadAsync())
                    {
                        totalOrders    = rdr["TotalOrders"] == DBNull.Value ? 0 : Convert.ToInt32(rdr["TotalOrders"]);
                        totalDelivered = rdr["Delivered"]   == DBNull.Value ? 0 : Convert.ToInt32(rdr["Delivered"]);
                        totalPending   = rdr["Pending"]     == DBNull.Value ? 0 : Convert.ToInt32(rdr["Pending"]);
                    }
                }

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        totalShops,
                        totalCustomers,
                        totalOrders,
                        totalDelivered,
                        totalPending
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading public stats");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── helpers ──────────────────────────────────────────────────────────────
        private static async Task<Guid> GetOrCreateAppIdAsync(
            Microsoft.Data.SqlClient.SqlConnection con,
            Microsoft.Data.SqlClient.SqlTransaction tx)
        {
            using var cmd = new Microsoft.Data.SqlClient.SqlCommand(
                "SELECT TOP 1 ApplicationId FROM aspnet_Applications", con, tx);
            var result = await cmd.ExecuteScalarAsync();
            if (result != null && result != DBNull.Value) return (Guid)result;
            var newId = Guid.NewGuid();
            using var ins = new Microsoft.Data.SqlClient.SqlCommand(
                "INSERT INTO aspnet_Applications(ApplicationName,LoweredApplicationName,ApplicationId,Description) VALUES('/','/','"+newId+"','')", con, tx);
            await ins.ExecuteNonQueryAsync();
            return newId;
        }

        private static async Task ExecuteAsync(
            Microsoft.Data.SqlClient.SqlConnection con,
            Microsoft.Data.SqlClient.SqlTransaction tx,
            string sql, Dictionary<string, object> p)
        {
            using var cmd = new Microsoft.Data.SqlClient.SqlCommand(sql, con, tx);
            foreach (var kv in p) cmd.Parameters.AddWithValue(kv.Key, kv.Value ?? DBNull.Value);
            await cmd.ExecuteNonQueryAsync();
        }

        private static async Task<T> ExecuteScalarAsync<T>(
            Microsoft.Data.SqlClient.SqlConnection con,
            Microsoft.Data.SqlClient.SqlTransaction tx,
            string sql, Dictionary<string, object> p)
        {
            using var cmd = new Microsoft.Data.SqlClient.SqlCommand(sql, con, tx);
            foreach (var kv in p) cmd.Parameters.AddWithValue(kv.Key, kv.Value ?? DBNull.Value);
            var result = await cmd.ExecuteScalarAsync();
            return (T)Convert.ChangeType(result!, typeof(T));
        }

        private static (string Hash, string Salt) HashPassword(string password)
        {
            var saltBytes = new byte[16];
            System.Security.Cryptography.RandomNumberGenerator.Fill(saltBytes);
            var salt = Convert.ToBase64String(saltBytes);
            var combined = System.Text.Encoding.Unicode.GetBytes(salt + password);
            var hash = System.Security.Cryptography.SHA1.HashData(combined);
            return (Convert.ToBase64String(hash), salt);
        }
    }

    // Model classes for print settings
    public class MeasurementPrintSettingsModel
    {
        public bool PrintShopName { get; set; }
        public bool PrintMasterCopy { get; set; }
        public bool PrintWorkmanCopy { get; set; }
        public bool PrintShopCopy { get; set; }
        public bool PrintCustomerName { get; set; }
        public bool PrintCustomerPhone { get; set; }
        public bool PrintCustomerAddress { get; set; }
        public bool PrintMeasurementName { get; set; }
        public bool PrintStyleCategory { get; set; }
        public bool PrintBarcode { get; set; }
        public int TopSpace { get; set; }
        public int FontSize { get; set; }
    }

    public class MoneyReceiptPrintSettingsModel
    {
        public bool ShowShopName { get; set; }
        public bool ShowServedBy { get; set; }
        public bool ShowReceiptBarcode { get; set; }
        public int TopSpace { get; set; }
        public int FontSize { get; set; }
        public string? PoweredByInfo { get; set; }
    }

    public class SignUpInstitutionRequest
    {
        public string UserName { get; set; } = "";
        public string Password { get; set; } = "";
        public string ConfirmPassword { get; set; } = "";
        public string? Email { get; set; }
        public string? SecurityQuestion { get; set; }
        public string? SecurityAnswer { get; set; }
        public string InstitutionName { get; set; } = "";
        public string? DialogTitle { get; set; }
        public string? Established { get; set; }
        public string? Staff { get; set; }
        public string Phone { get; set; } = "";
        public string? Website { get; set; }
        public string Address { get; set; } = "";
        public double SigningMoney { get; set; }
        public double RenewAmount { get; set; }
        public int PackageID { get; set; }
        public string Masking { get; set; } = "";
    }

    public class ChangePackageRequest
    {
        public int PackageId { get; set; }
        public double RenewAmount { get; set; } = 0;
    }

    public class ResetPasswordRequest
    {
        public string NewPassword { get; set; } = "";
    }
}
