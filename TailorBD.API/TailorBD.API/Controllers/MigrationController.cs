using Microsoft.AspNetCore.Mvc;
using TailorBD.API.Data;
using Dapper;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MigrationController : ControllerBase
    {
        private readonly TailorBdContext _context;

        // Complete mapping of old .aspx to new .html paths
        private static readonly Dictionary<string, string> URLMappings = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            // Basic Setting
            { "AccessAdmin/TailorInfo.aspx", "/tailor-info.html" },
            { "~/AccessAdmin/TailorInfo.aspx", "/tailor-info.html" },
            { "AccessAdmin/Dress/DressAdd.aspx", "/dress-add.html" },
            { "~/AccessAdmin/Dress/DressAdd.aspx", "/dress-add.html" },
            { "AccessAdmin/Dress/Dress_Add.aspx", "/dress-add.html" },
            { "~/AccessAdmin/Dress/Dress_Add.aspx", "/dress-add.html" },
            { "AccessAdmin/Dress/Mesurement_Printing_Settings.aspx", "/measurement-settings.html" },
            { "~/AccessAdmin/Dress/Mesurement_Printing_Settings.aspx", "/measurement-settings.html" },
            { "AccessAdmin/Sub_Admin/Sub_Admin_Form.aspx", "/sub-admin.html" },
            { "~/AccessAdmin/Sub_Admin/Sub_Admin_Form.aspx", "/sub-admin.html" },
            { "AccessAdmin/Sub_Admin/SignUp_Sub_Admin.aspx", "/sub-admin.html" },
            { "~/AccessAdmin/Sub_Admin/SignUp_Sub_Admin.aspx", "/sub-admin.html" },
            { "AccessAdmin/Sub_Admin/Access_Manage.aspx", "/access-management.html" },
            { "~/AccessAdmin/Sub_Admin/Access_Manage.aspx", "/access-management.html" },
            { "AccessAdmin/Acount/Add_Account.aspx", "/add-account.html" },
            { "~/AccessAdmin/Acount/Add_Account.aspx", "/add-account.html" },
            
            // Order
            { "AccessAdmin/Order/Order.aspx", "/new-order.html" },
            { "~/AccessAdmin/Order/Order.aspx", "/new-order.html" },
            { "AccessAdmin/Order/Order_List.aspx", "/order-list.html" },
            { "~/AccessAdmin/Order/Order_List.aspx", "/order-list.html" },
            { "AccessAdmin/Order/OrdList.aspx", "/order-list.html" },
            { "~/AccessAdmin/Order/OrdList.aspx", "/order-list.html" },
            { "AccessAdmin/Order/OrderByDress.aspx", "/order-by-dress.html" },
            { "~/AccessAdmin/Order/OrderByDress.aspx", "/order-by-dress.html" },
            { "AccessAdmin/Order/OrderByCutting.aspx", "/order-by-cutting.html" },
            { "~/AccessAdmin/Order/OrderByCutting.aspx", "/order-by-cutting.html" },
            { "AccessAdmin/Order/FastDelivery.aspx", "/fast-delivery.html" },
            { "~/AccessAdmin/Order/FastDelivery.aspx", "/fast-delivery.html" },
            
            // Customer
            { "AccessAdmin/Customer/CustomerList.aspx", "/customer-list.html" },
            { "~/AccessAdmin/Customer/CustomerList.aspx", "/customer-list.html" },
            { "AccessAdmin/Customer/MeasurementList.aspx", "/measurement-list.html" },
            { "~/AccessAdmin/Customer/MeasurementList.aspx", "/measurement-list.html" },
            
            // Fabric
            { "AccessAdmin/Fabrics/FabricPurchase.aspx", "/fabric-purchase.html" },
            { "~/AccessAdmin/Fabrics/FabricPurchase.aspx", "/fabric-purchase.html" },
            { "AccessAdmin/Fabrics/FabricSales.aspx", "/fabric-sales.html" },
            { "~/AccessAdmin/Fabrics/FabricSales.aspx", "/fabric-sales.html" },
            
            // Accounts
            { "AccessAdmin/Acount/Income_Expense.aspx", "/income-expense.html" },
            { "~/AccessAdmin/Acount/Income_Expense.aspx", "/income-expense.html" },
            { "AccessAdmin/Acount/Expense_Catagory.aspx", "/expense-category.html" },
            { "~/AccessAdmin/Acount/Expense_Catagory.aspx", "/expense-category.html" },
            { "AccessAdmin/Acount/Extra_Income.aspx", "/extra-income.html" },
            { "~/AccessAdmin/Acount/Extra_Income.aspx", "/extra-income.html" },
            { "AccessAdmin/Acount/Accounting_Report.aspx", "/accounting-report.html" },
            { "~/AccessAdmin/Acount/Accounting_Report.aspx", "/accounting-report.html" },
            
            // Reports
            { "AccessAdmin/Report/Report_By_Date.aspx", "/report-by-date.html" },
            { "~/AccessAdmin/Report/Report_By_Date.aspx", "/report-by-date.html" },
            { "AccessAdmin/Report/DueReport.aspx", "/due-balance.html" },
            { "~/AccessAdmin/Report/DueReport.aspx", "/due-balance.html" },
            { "AccessAdmin/Report/DeliveryDateReport.aspx", "/delivery-date-report.html" },
            { "~/AccessAdmin/Report/DeliveryDateReport.aspx", "/delivery-date-report.html" },
            
            // Messages/SMS
            { "AccessAdmin/Messages/Compose.aspx", "/compose-sms.html" },
            { "~/AccessAdmin/Messages/Compose.aspx", "/compose-sms.html" },
            { "AccessAdmin/Messages/Send.aspx", "/send-sms.html" },
            { "~/AccessAdmin/Messages/Send.aspx", "/send-sms.html" },
            { "AccessAdmin/Messages/History.aspx", "/sms-history.html" },
            { "~/AccessAdmin/Messages/History.aspx", "/sms-history.html" },
            { "AccessAdmin/Messages/Recharge.aspx", "/sms-recharge.html" },
            { "~/AccessAdmin/Messages/Recharge.aspx", "/sms-recharge.html" },
            { "AccessAdmin/Messages/Settings.aspx", "/sms-settings.html" },
            { "~/AccessAdmin/Messages/Settings.aspx", "/sms-settings.html" },
        };

        public MigrationController(TailorBdContext context)
        {
            _context = context;
        }

        // GET: api/Migration/update-page-urls
        [HttpGet("update-page-urls")]
        public IActionResult UpdatePageUrls()
        {
            try
            {
                using var connection = _context.CreateConnection();
                connection.Open();
                using var transaction = connection.BeginTransaction();

                try
                {
                    var updates = new List<string>();
                    int totalUpdated = 0;

                    // Get all pages that need updating
                    var pagesQuery = "SELECT LinkID, PageURL, Location FROM Link_Pages WHERE PageURL LIKE '%.aspx%' OR Location LIKE '%.aspx%'";
                    var pages = connection.Query<dynamic>(pagesQuery, transaction: transaction).ToList();

                    foreach (var page in pages)
                    {
                        string linkId = page.LinkID.ToString();
                        string oldPageUrl = page.PageURL?.ToString() ?? "";
                        string oldLocation = page.Location?.ToString() ?? "";
                        
                        string newPageUrl = ConvertUrl(oldPageUrl);
                        string newLocation = ConvertUrl(oldLocation);

                        if (newPageUrl != oldPageUrl || newLocation != oldLocation)
                        {
                            var updateQuery = @"
                                UPDATE Link_Pages 
                                SET PageURL = @NewPageUrl, 
                                    Location = @NewLocation
                                WHERE LinkID = @LinkID";

                            connection.Execute(updateQuery, new {
                                NewPageUrl = newPageUrl,
                                NewLocation = newLocation,
                                LinkID = linkId
                            }, transaction);

                            totalUpdated++;
                            updates.Add($"LinkID {linkId}: '{oldPageUrl}' → '{newPageUrl}'");
                        }
                    }

                    transaction.Commit();

                    return Ok(new {
                        success = true,
                        message = $"Successfully updated {totalUpdated} pages",
                        totalPagesChecked = pages.Count,
                        totalPagesUpdated = totalUpdated,
                        updates = updates
                    });
                }
                catch (Exception)
                {
                    transaction.Rollback();
                    throw;
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new {
                    success = false,
                    message = ex.Message
                });
            }
        }

        // GET: api/Migration/preview-changes
        [HttpGet("preview-changes")]
        public IActionResult PreviewChanges()
        {
            try
            {
                using var connection = _context.CreateConnection();
                
                var pagesQuery = "SELECT LinkID, PageURL, Location, PageTitle FROM Link_Pages WHERE PageURL LIKE '%.aspx%' OR Location LIKE '%.aspx%'";
                var pages = connection.Query<dynamic>(pagesQuery).ToList();

                var preview = pages.Select(page => new {
                    linkId = page.LinkID,
                    pageTitle = page.PageTitle,
                    oldPageUrl = page.PageURL?.ToString() ?? "",
                    newPageUrl = ConvertUrl(page.PageURL?.ToString() ?? ""),
                    oldLocation = page.Location?.ToString() ?? "",
                    newLocation = ConvertUrl(page.Location?.ToString() ?? ""),
                    willChange = ConvertUrl(page.PageURL?.ToString() ?? "") != (page.PageURL?.ToString() ?? "") ||
                                ConvertUrl(page.Location?.ToString() ?? "") != (page.Location?.ToString() ?? "")
                }).ToList();

                return Ok(new {
                    success = true,
                    totalPages = preview.Count,
                    pagesToUpdate = preview.Count(p => p.willChange),
                    preview = preview
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new {
                    success = false,
                    message = ex.Message
                });
            }
        }

        private string ConvertUrl(string oldUrl)
        {
            if (string.IsNullOrEmpty(oldUrl))
                return oldUrl;

            // Clean up the URL
            string cleanUrl = oldUrl.Trim().Replace("\\", "/");

            // Check exact matches first
            foreach (var mapping in URLMappings)
            {
                if (cleanUrl.Contains(mapping.Key, StringComparison.OrdinalIgnoreCase))
                {
                    return mapping.Value;
                }
            }

            // If no exact match, try to convert filename
            if (cleanUrl.EndsWith(".aspx", StringComparison.OrdinalIgnoreCase))
            {
                var fileName = Path.GetFileNameWithoutExtension(cleanUrl);
                var modernFileName = ConvertToKebabCase(fileName) + ".html";
                return "/" + modernFileName;
            }

            return oldUrl; // Return original if can't convert
        }

        private string ConvertToKebabCase(string input)
        {
            if (string.IsNullOrEmpty(input))
                return "page";

            input = input.Replace("_", "-");
            var result = string.Concat(
                input.Select((c, i) => 
                    i > 0 && char.IsUpper(c) ? "-" + char.ToLower(c).ToString() : char.ToLower(c).ToString()
                )
            );

            return result.Trim('-');
        }

        // GET: api/Migration/create-shurjopay-table
        [HttpGet("create-shurjopay-table")]
        public IActionResult CreateShurjoPayTable()
        {
            try
            {
                using var connection = _context.CreateConnection();

                var sql = @"
                    IF NOT EXISTS (
                        SELECT 1 FROM INFORMATION_SCHEMA.TABLES
                        WHERE TABLE_NAME = 'ShurjoPay_Order'
                    )
                    BEGIN
                        CREATE TABLE ShurjoPay_Order (
                            Id              INT           IDENTITY(1,1) PRIMARY KEY,
                            MerchantOrderId NVARCHAR(100) NOT NULL UNIQUE,
                            SpOrderId       NVARCHAR(200) NULL,
                            InstitutionID   INT           NOT NULL,
                            InvoiceIds      NVARCHAR(500) NOT NULL,
                            TotalAmount     FLOAT         NOT NULL,
                            Status          NVARCHAR(50)  NOT NULL DEFAULT 'Pending',
                            PaymentMethod   NVARCHAR(100) NULL,
                            TransactionId   NVARCHAR(200) NULL,
                            SpResponse      NVARCHAR(MAX) NULL,
                            CreatedAt       DATETIME      NOT NULL DEFAULT GETDATE(),
                            UpdatedAt       DATETIME      NULL
                        );
                        SELECT 1 AS Created;
                    END
                    ELSE
                        SELECT 0 AS Created;";

                var created = connection.ExecuteScalar<int>(sql);

                return Ok(new
                {
                    success = true,
                    message = created == 1
                        ? "ShurjoPay_Order টেবিল সফলভাবে তৈরি হয়েছে"
                        : "ShurjoPay_Order টেবিল আগে থেকেই আছে"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET: api/Migration/create-sms-template-table
        [HttpGet("create-sms-template-table")]
        public IActionResult CreateSmsTemplateTable()
        {
            try
            {
                using var connection = _context.CreateConnection();

                var sql = @"
                    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES 
                                   WHERE TABLE_NAME = 'SMS_Template')
                    BEGIN
                        CREATE TABLE SMS_Template (
                            SMS_TemplateID  INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
                            InstitutionID   INT           NOT NULL,
                            RegistrationID  INT           NOT NULL,
                            TemplateName    NVARCHAR(200) NOT NULL,
                            TemplateText    NVARCHAR(MAX) NOT NULL,
                            TemplateFor     NVARCHAR(100) NOT NULL DEFAULT 'CompletedWork',
                            Created_Date    DATETIME      NOT NULL DEFAULT GETDATE()
                        )
                        SELECT 1 AS Created
                    END
                    ELSE
                    BEGIN
                        SELECT 0 AS Created
                    END";

                var created = connection.ExecuteScalar<int>(sql);

                return Ok(new
                {
                    success = true,
                    message = created == 1
                        ? "SMS_Template টেবিল সফলভাবে তৈরি হয়েছে"
                        : "SMS_Template টেবিল আগে থেকেই আছে"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // POST: api/Migration/copy-shop-data
        [HttpPost("copy-shop-data")]
        public IActionResult CopyShopData([FromBody] CopyShopDataDto dto)
        {
            try
            {
                if (dto.SourceInstitutionId <= 0 || dto.TargetInstitutionId <= 0 || dto.TargetRegistrationId <= 0)
                    return BadRequest(new { success = false, message = "সকল ফিল্ড আবশ্যক" });

                if (dto.SourceInstitutionId == dto.TargetInstitutionId)
                    return BadRequest(new { success = false, message = "সোর্স ও টার্গেট ইনস্টিটিউশন একই হতে পারবে না" });

                using var connection = _context.CreateConnection();
                connection.Open();

                // Validate source institution exists
                var sourceExists = connection.ExecuteScalar<int>(
                    "SELECT COUNT(1) FROM Institution WHERE InstitutionID = @Id",
                    new { Id = dto.SourceInstitutionId });
                if (sourceExists == 0)
                    return BadRequest(new { success = false, message = "সোর্স ইনস্টিটিউশন পাওয়া যায়নি" });

                // Validate target institution exists
                var targetExists = connection.ExecuteScalar<int>(
                    "SELECT COUNT(1) FROM Institution WHERE InstitutionID = @Id",
                    new { Id = dto.TargetInstitutionId });
                if (targetExists == 0)
                    return BadRequest(new { success = false, message = "টার্গেট ইনস্টিটিউশন পাওয়া যায়নি" });

                // Check if target already has dresses
                var targetDressCount = connection.ExecuteScalar<int>(
                    "SELECT COUNT(1) FROM Dress WHERE InstitutionID = @Id",
                    new { Id = dto.TargetInstitutionId });
                if (targetDressCount > 0 && !dto.Force)
                    return BadRequest(new { success = false, message = "টার্গেট ইনস্টিটিউশনে ইতিমধ্যে " + targetDressCount + " টি ড্রেস আছে। Force চেক করুন।", hasExistingData = true });

                using var transaction = connection.BeginTransaction();
                try
                {
                    int dressCount = 0, measurementCount = 0, categoryCount = 0, styleCount = 0;

                    // Get all dresses from source
                    var sourceDresses = connection.Query<dynamic>(
                        "SELECT DressID, Dress_Name, Cloth_For_ID, Description, Image, DressSerial FROM Dress WHERE InstitutionID = @Id",
                        new { Id = dto.SourceInstitutionId }, transaction).ToList();

                    foreach (var dress in sourceDresses)
                    {
                        int oldDressId = Convert.ToInt32(dress.DressID);
                        int clothForId = Convert.ToInt32(dress.Cloth_For_ID);
                        byte[]? dressImage = dress.Image as byte[];
                        string? dressDesc = dress.Description == null ? null : Convert.ToString(dress.Description);
                        int? dressSerial = dress.DressSerial == null ? null : (int?)Convert.ToInt32(dress.DressSerial);

                        // Insert new dress via DynamicParameters to handle varbinary correctly
                        var dressParams = new DynamicParameters();
                        dressParams.Add("Dress_Name", Convert.ToString(dress.Dress_Name));
                        dressParams.Add("Cloth_For_ID", clothForId);
                        dressParams.Add("RegId", dto.TargetRegistrationId);
                        dressParams.Add("InstId", dto.TargetInstitutionId);
                        dressParams.Add("Description", dressDesc);
                        dressParams.Add("Image", dressImage, System.Data.DbType.Binary);
                        dressParams.Add("DressSerial", dressSerial);

                        var newDressId = connection.ExecuteScalar<int>(@"
                            INSERT INTO Dress(Dress_Name, Cloth_For_ID, RegistrationID, InstitutionID, Description, Image, DressSerial)
                            VALUES (@Dress_Name, @Cloth_For_ID, @RegId, @InstId, @Description, @Image, @DressSerial);
                            SELECT CAST(SCOPE_IDENTITY() AS INT);", dressParams, transaction);
                        dressCount++;

                        // ── Copy Measurement_Type with group mapping ──
                        var sourceMeasurements = connection.Query<dynamic>(@"
                            SELECT MeasurementTypeID, MeasurementType, Ascending, Measurement_Group_SerialNo,
                                   Measurement_GroupID, Cloth_For_ID
                            FROM Measurement_Type
                            WHERE InstitutionID = @InstId AND DressID = @DressId
                            ORDER BY Measurement_GroupID, Measurement_Group_SerialNo",
                            new { InstId = dto.SourceInstitutionId, DressId = oldDressId }, transaction).ToList();

                        var groupMap = new Dictionary<int, int>();

                        foreach (var m in sourceMeasurements)
                        {
                            int oldGroupId = Convert.ToInt32(m.Measurement_GroupID);

                            var mParams = new DynamicParameters();
                            mParams.Add("ClothForId", Convert.ToInt32(m.Cloth_For_ID));
                            mParams.Add("InstId", dto.TargetInstitutionId);
                            mParams.Add("MeasurementType", Convert.ToString(m.MeasurementType));
                            mParams.Add("DressId", newDressId);
                            mParams.Add("Ascending", m.Ascending == null ? null : Convert.ToString(m.Ascending));
                            mParams.Add("RegId", dto.TargetRegistrationId);
                            mParams.Add("GroupSerial", m.Measurement_Group_SerialNo == null ? null : (int?)Convert.ToInt32(m.Measurement_Group_SerialNo));

                            var newMeasurementId = connection.ExecuteScalar<int>(@"
                                INSERT INTO Measurement_Type(Cloth_For_ID, InstitutionID, MeasurementType, Date, DressID, Ascending, RegistrationID, Measurement_Group_SerialNo, Measurement_GroupID)
                                VALUES (@ClothForId, @InstId, @MeasurementType, GETDATE(), @DressId, @Ascending, @RegId, @GroupSerial, 0);
                                SELECT CAST(SCOPE_IDENTITY() AS INT);", mParams, transaction);

                            if (!groupMap.ContainsKey(oldGroupId))
                            {
                                groupMap[oldGroupId] = newMeasurementId;
                            }

                            connection.Execute(@"
                                UPDATE Measurement_Type SET Measurement_GroupID = @GroupId WHERE MeasurementTypeID = @Id",
                                new { GroupId = groupMap[oldGroupId], Id = newMeasurementId }, transaction);

                            measurementCount++;
                        }

                        // ── Copy Dress_Style_Category and Dress_Style ──
                        var sourceCategories = connection.Query<dynamic>(@"
                            SELECT Dress_Style_CategoryID, Dress_Style_Category_Name, CategorySerial
                            FROM Dress_Style_Category
                            WHERE InstitutionID = @InstId AND DressID = @DressId",
                            new { InstId = dto.SourceInstitutionId, DressId = oldDressId }, transaction).ToList();

                        foreach (var cat in sourceCategories)
                        {
                            int oldCatId = Convert.ToInt32(cat.Dress_Style_CategoryID);

                            var catParams = new DynamicParameters();
                            catParams.Add("Name", Convert.ToString(cat.Dress_Style_Category_Name));
                            catParams.Add("Serial", cat.CategorySerial == null ? null : (int?)Convert.ToInt32(cat.CategorySerial));
                            catParams.Add("RegId", dto.TargetRegistrationId);
                            catParams.Add("InstId", dto.TargetInstitutionId);
                            catParams.Add("DressId", newDressId);

                            var newCatId = connection.ExecuteScalar<int>(@"
                                INSERT INTO Dress_Style_Category(Dress_Style_Category_Name, CategorySerial, RegistrationID, InstitutionID, DressID)
                                VALUES (@Name, @Serial, @RegId, @InstId, @DressId);
                                SELECT CAST(SCOPE_IDENTITY() AS INT);", catParams, transaction);
                            categoryCount++;

                            // Copy styles for this category
                            var sourceStyles = connection.Query<dynamic>(@"
                                SELECT Dress_StyleID, Dress_Style_Name, Dress_Style_Image, StyleSerial
                                FROM Dress_Style
                                WHERE Dress_Style_CategoryID = @CatId",
                                new { CatId = oldCatId }, transaction).ToList();

                            foreach (var style in sourceStyles)
                            {
                                byte[]? styleImage = style.Dress_Style_Image as byte[];

                                var styleParams = new DynamicParameters();
                                styleParams.Add("CatId", newCatId);
                                styleParams.Add("Name", Convert.ToString(style.Dress_Style_Name));
                                styleParams.Add("Image", styleImage, System.Data.DbType.Binary);
                                styleParams.Add("Serial", style.StyleSerial == null ? null : (int?)Convert.ToInt32(style.StyleSerial));
                                styleParams.Add("RegId", dto.TargetRegistrationId);
                                styleParams.Add("InstId", dto.TargetInstitutionId);
                                styleParams.Add("DressId", newDressId);

                                connection.Execute(@"
                                    INSERT INTO Dress_Style(Dress_Style_CategoryID, Dress_Style_Name, Dress_Style_Image, StyleSerial, RegistrationID, InstitutionID, DressID)
                                    VALUES (@CatId, @Name, @Image, @Serial, @RegId, @InstId, @DressId)", styleParams, transaction);
                                styleCount++;
                            }
                        }
                    }

                    transaction.Commit();

                    return Ok(new
                    {
                        success = true,
                        message = "ডেটা সফলভাবে কপি হয়েছে",
                        stats = new
                        {
                            dresses = dressCount,
                            measurements = measurementCount,
                            styleCategories = categoryCount,
                            styles = styleCount
                        }
                    });
                }
                catch
                {
                    transaction.Rollback();
                    throw;
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET: api/Migration/institution-info/{id}
        [HttpGet("institution-info/{id}")]
        public IActionResult GetInstitutionInfo(int id)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var info = connection.QueryFirstOrDefault<dynamic>(@"
                    SELECT i.InstitutionID, i.InstitutionName, CAST(i.Phone AS NVARCHAR(50)) AS Phone,
                           (SELECT COUNT(1) FROM Dress WHERE InstitutionID = i.InstitutionID) AS DressCount,
                           (SELECT COUNT(1) FROM Measurement_Type WHERE InstitutionID = i.InstitutionID) AS MeasurementCount,
                           r.Name AS AdminName
                    FROM Institution i
                    LEFT JOIN Registration r ON i.InstitutionID = r.InstitutionID AND r.Category = 'Admin'
                    WHERE i.InstitutionID = @Id",
                    new { Id = id });

                if (info == null)
                    return Ok(new { success = false, message = "ইনস্টিটিউশন পাওয়া যায়নি" });

                return Ok(new { success = true, data = info });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET: api/Migration/institutions-list
        [HttpGet("institutions-list")]
        public IActionResult GetInstitutionsList()
        {
            try
            {
                using var connection = _context.CreateConnection();
                var list = connection.Query<dynamic>(@"
                    SELECT i.InstitutionID, i.InstitutionName, CAST(i.Phone AS NVARCHAR(50)) AS Phone,
                           (SELECT COUNT(1) FROM Dress WHERE InstitutionID = i.InstitutionID) AS DressCount,
                           (SELECT COUNT(1) FROM Measurement_Type WHERE InstitutionID = i.InstitutionID) AS MeasurementCount,
                           (SELECT TOP 1 RegistrationID FROM Registration WHERE InstitutionID = i.InstitutionID AND Category = 'Admin') AS AdminRegistrationId,
                           (SELECT TOP 1 Name FROM Registration WHERE InstitutionID = i.InstitutionID AND Category = 'Admin') AS AdminName
                    FROM Institution i
                    ORDER BY i.InstitutionID DESC").ToList();

                return Ok(new { success = true, data = list });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }

    public class CopyShopDataDto
    {
        public int SourceInstitutionId { get; set; }
        public int TargetInstitutionId { get; set; }
        public int TargetRegistrationId { get; set; }
        public bool Force { get; set; }
    }
}
