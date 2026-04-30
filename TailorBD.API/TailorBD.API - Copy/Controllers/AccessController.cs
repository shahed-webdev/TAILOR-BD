using Microsoft.AspNetCore.Mvc;
using System.Data.SqlClient;
using TailorBD.API.Data;
using Dapper;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccessController : ControllerBase
    {
        private readonly TailorBdContext _context;

        public AccessController(TailorBdContext context)
        {
            _context = context;
        }

        // ── ASPX → HTML URL mapping table ────────────────────────────────────
        private static readonly Dictionary<string, string> AspxToHtml = new(StringComparer.OrdinalIgnoreCase)
        {
            // Order
            ["~/AccessAdmin/Order/New_Order.aspx"]              = "/new-order.html",
            ["~/AccessAdmin/Order/Order_List.aspx"]             = "/order-list.html",
            ["~/AccessAdmin/Order/Incomplete_Works.aspx"]       = "/incomplete-works.html",
            ["~/AccessAdmin/Order/Change_Delivery_Date.aspx"]   = "/change-delivery-date.html",
            ["~/AccessAdmin/Order/Delete_Order.aspx"]           = "/delete-order.html",
            ["~/AccessAdmin/Order/Quick_Order.aspx"]            = "/quick-order.html",
            ["~/AccessAdmin/quick-order/Order.aspx"]            = "/quick-order.html",
            // Delivery
            ["~/AccessAdmin/Delivery/Delivery_Give.aspx"]       = "/delivery-give.html",
            ["~/AccessAdmin/Delivery/Delivered_Orders.aspx"]    = "/delivered-orders.html",
            ["~/AccessAdmin/Delivery/Delivery_Day.aspx"]        = "/delivery-day.html",
            ["~/AccessAdmin/Delivery/Delivery_Cut_Dress.aspx"]  = "/delivery-cut-dress.html",
            // Customer
            ["~/AccessAdmin/Customer/Add_Customer.aspx"]        = "/add-customer.html",
            ["~/AccessAdmin/Customer/CustomerList.aspx"]        = "/customer-list.html",
            ["~/AccessAdmin/Customer/Customer_List.aspx"]       = "/customer-list.html",
            // Basic / Dress / Sub-Admin
            ["~/AccessAdmin/Dress/Dress_Add.aspx"]              = "/dress-add.html",
            ["~/AccessAdmin/Basic/Tailor_Info.aspx"]            = "/tailor-info.html",
            ["~/AccessAdmin/Basic/Sub_Admin.aspx"]              = "/sub-admin.html",
            ["~/AccessAdmin/Basic/Access_Management.aspx"]      = "/access-management.html",
            ["~/AccessAdmin/Basic/Map_Print_Setting.aspx"]      = "/map-print-setting.html",
            ["~/AccessAdmin/Sub_Admin/SignUp_Sub_Admin.aspx"]   = "/sub-admin.html",
            ["~/AccessAdmin/Sub_Admin/Access_Manage.aspx"]      = "/access-management.html",
            // Accounts
            ["~/AccessAdmin/Accounts/Add_Account.aspx"]         = "/account-management.html",
            ["~/AccessAdmin/Accounts/Account.aspx"]             = "/account-management.html",
            ["~/AccessAdmin/Accounts/Deposit_Withdraw.aspx"]    = "/account-management.html",
            ["~/AccessAdmin/Accounts/Income.aspx"]              = "/income-due-expense.html",
            ["~/AccessAdmin/Accounts/Expanse.aspx"]             = "/add-expense.html",
            ["~/AccessAdmin/Accounts/Add_Expanse.aspx"]         = "/add-expense.html",
            ["~/AccessAdmin/Accounts/Others_Income.aspx"]       = "/add-other-income.html",
            ["~/AccessAdmin/Accounts/Employee.aspx"]            = "/employee.html",
            ["~/AccessAdmin/Employee/Add_Employee.aspx"]        = "/employee.html",
            // Reports (both folder names: Report and Reports, and Accounts subfolder)
            ["~/AccessAdmin/Report/Income_Expanse_Report.aspx"]            = "/income-expense-report.html",
            ["~/AccessAdmin/Reports/Income_Expanse_Report.aspx"]           = "/income-expense-report.html",
            ["~/AccessAdmin/Accounts/Income_And_Expense_Report.aspx"]      = "/income-expense-report.html",
            ["~/AccessAdmin/Accounts/Accounts_Report.aspx"]                = "/income-expense-report.html",
            ["~/AccessAdmin/Report/Income_Expanse_Net.aspx"]               = "/income-expense-net.html",
            ["~/AccessAdmin/Reports/Income_Expanse_Net.aspx"]              = "/income-expense-net.html",
            ["~/AccessAdmin/Accounts/Accounts_Analysis.aspx"]              = "/income-expense-net.html",
            ["~/AccessAdmin/Report/Account_Log.aspx"]                      = "/account-log.html",
            ["~/AccessAdmin/Reports/Account_Log.aspx"]                     = "/account-log.html",
            ["~/AccessAdmin/Report/Order_Delivery_Report.aspx"]            = "/order-delivery-report.html",
            ["~/AccessAdmin/Reports/Order_Delivery_Report.aspx"]           = "/order-delivery-report.html",
            ["~/AccessAdmin/Reports/Order_And_Delivery_Report_By_Date.aspx"] = "/order-delivery-report.html",
            ["~/AccessAdmin/Reports/Order_Report.aspx"]                    = "/order-delivery-report.html",
            ["~/AccessAdmin/Report/Transaction_Log.aspx"]                  = "/transaction-log.html",
            ["~/AccessAdmin/Reports/Transaction_Log.aspx"]                 = "/transaction-log.html",
            // Item management — actual ASPX file names from the project
            ["~/AccessAdmin/Fabrics/Add_Mesurement_Unit.aspx"]             = "/item-measurement-unit.html",
            ["~/AccessAdmin/Fabrics/Measurement_Unit.aspx"]                = "/item-measurement-unit.html",
            ["~/AccessAdmin/Fabrics/Add_Fabrics_Brand.aspx"]               = "/item-brand.html",
            ["~/AccessAdmin/Fabrics/Brand.aspx"]                           = "/item-brand.html",
            ["~/AccessAdmin/Fabrics/Add_Fabrics_Category.aspx"]            = "/item-category.html",
            ["~/AccessAdmin/Fabrics/Category.aspx"]                        = "/item-category.html",
            ["~/AccessAdmin/Fabrics/Add_Fabrics.aspx"]                     = "/item-add.html",
            ["~/AccessAdmin/Fabrics/Item_Add.aspx"]                        = "/item-add.html",
            // Item Purchase (Buying)
            ["~/AccessAdmin/Fabrics/Buying/Fabric_Buying.aspx"]            = "/item-purchase.html",
            ["~/AccessAdmin/Fabrics/Purchase/Purchase.aspx"]               = "/item-purchase.html",
            ["~/AccessAdmin/Fabrics/Buying/Buying_Records.aspx"]           = "/item-purchase-record.html",
            ["~/AccessAdmin/Fabrics/Purchase/Purchase_Record.aspx"]        = "/item-purchase-record.html",
            ["~/AccessAdmin/Fabrics/Buying/Return.aspx"]                   = "/item-purchase-return.html",
            ["~/AccessAdmin/Fabrics/Purchase/Purchase_Return.aspx"]        = "/item-purchase-return.html",
            ["~/AccessAdmin/Fabrics/Buying/Buying_Report.aspx"]            = "/item-purchase-report.html",
            ["~/AccessAdmin/Fabrics/Purchase/Purchase_Report.aspx"]        = "/item-purchase-report.html",
            // Item Sales (Selling)
            ["~/AccessAdmin/Fabrics/Fabrics_Stocks.aspx"]                  = "/item-stock-report.html",
            ["~/AccessAdmin/Fabrics/Sell/Stock_Report.aspx"]               = "/item-stock-report.html",
            ["~/AccessAdmin/Fabrics/Sell/Fabrics_Selling.aspx"]            = "/item-sell.html",
            ["~/AccessAdmin/Fabrics/Sell/Sell.aspx"]                       = "/item-sell.html",
            ["~/AccessAdmin/Fabrics/Sell/Selling_Records.aspx"]            = "/item-sell-record.html",
            ["~/AccessAdmin/Fabrics/Sell/Sell_Record.aspx"]                = "/item-sell-record.html",
            ["~/AccessAdmin/Fabrics/Sell/Selling_Return.aspx"]             = "/item-sell-return.html",
            ["~/AccessAdmin/Fabrics/Sell/Sell_Return.aspx"]                = "/item-sell-return.html",
            ["~/AccessAdmin/Fabrics/Sell/Selling_Report.aspx"]             = "/item-sell-report.html",
            ["~/AccessAdmin/Fabrics/Sell/Sell_Report.aspx"]                = "/item-sell-report.html",
            // Item Supplier & Damage
            ["~/AccessAdmin/Fabrics/Supplier/Add_Supplier.aspx"]           = "/item-supplier-add.html",
            ["~/AccessAdmin/Fabrics/Supplier.aspx"]                        = "/item-supplier-add.html",
            ["~/AccessAdmin/Fabrics/Damage/Damage_Fabrics.aspx"]           = "/item-damage-add.html",
            ["~/AccessAdmin/Fabrics/Damage/Damage_Add.aspx"]               = "/item-damage-add.html",
            // SMS / Message — actual ASPX file names
            ["~/AccessAdmin/SMS/Send_SMS.aspx"]                = "/sms.html",
            ["~/AccessAdmin/SMS/SMS_Send.aspx"]                = "/sms.html",
            ["~/AccessAdmin/SMS/Sent_Records.aspx"]            = "/sms-history.html",
            ["~/AccessAdmin/SMS/SMS_History.aspx"]             = "/sms-history.html",
            ["~/AccessAdmin/SMS/Others_SMS.aspx"]              = "/contact-list.html",
            ["~/AccessAdmin/SMS/Contact_List.aspx"]            = "/contact-list.html",
            ["~/AccessAdmin/SMS/SMS_Settings.aspx"]            = "/sms-settings.html",
        };

        /// <summary>
        /// Converts a legacy ~/... .aspx URL to the modern .html URL.
        /// Falls back to pattern-based conversion for unmapped URLs.
        /// </summary>
        private static string NormalizeUrl(string rawUrl)
        {
            if (string.IsNullOrWhiteSpace(rawUrl)) return rawUrl ?? string.Empty;
            var key = rawUrl.Trim();

            // 1. Exact match
            if (AspxToHtml.TryGetValue(key, out var html)) return html;

            // 2. Already an .html URL — return as-is
            if (key.EndsWith(".html", StringComparison.OrdinalIgnoreCase)) return key;

            // 3. Pattern-based fallback for any ASPX path not in the table
            //    ~/AccessAdmin/Folder/Page_Name.aspx  →  /page-name.html
            if (key.StartsWith("~/", StringComparison.OrdinalIgnoreCase) &&
                key.EndsWith(".aspx", StringComparison.OrdinalIgnoreCase))
            {
                var fileName = System.IO.Path.GetFileNameWithoutExtension(key); // e.g. "Add_Account"
                var kebab = fileName.Replace('_', '-').ToLowerInvariant();      // e.g. "add-account"
                return "/" + kebab + ".html";
            }

            return key;
        }

        // ── All sidebar HTML page URLs (canonical list) ─────────────────────
        private static readonly Dictionary<string, (string Title, string Category)> AllSidebarPages = new(StringComparer.OrdinalIgnoreCase)
        {
            // Order
            ["/quick-order.html"]            = ("Quick Order",              "Order"),
            ["/new-order.html"]              = ("New Order",               "Order"),
            ["/order-list.html"]             = ("Order List",              "Order"),
            ["/incomplete-works.html"]       = ("Complete Order Works",    "Order"),
            ["/change-delivery-date.html"]   = ("Change Delivery Date",   "Order"),
            ["/delete-order.html"]           = ("Permanently Delete Order","Order"),
            // Delivery
            ["/delivery-give.html"]          = ("Delivery Give",           "Delivery"),
            ["/delivered-orders.html"]       = ("Delivered Orders",        "Delivery"),
            ["/delivery-day.html"]           = ("Delivery Day",            "Delivery"),
            ["/delivery-cut-dress.html"]     = ("Delivery Cut Dress",      "Delivery"),
            // Customer
            ["/add-customer.html"]           = ("Add New Customer",        "Customer"),
            ["/customer-list.html"]          = ("Customer List",           "Customer"),
            // Basic Setting
            ["/tailor-info.html"]            = ("Tailor Shop Info",        "Basic"),
            ["/dress-add.html"]              = ("Add Dress & Measurement", "Basic"),
            ["/map-print-setting.html"]      = ("Map Print Setting",       "Basic"),
            ["/sub-admin.html"]              = ("SignUp Sub Admin",        "Basic"),
            ["/access-management.html"]      = ("Sub Admin Page Access",   "Basic"),
            // Item Management - Basic Setting
            ["/item-measurement-unit.html"]  = ("Measurement Unit",        "Fabric"),
            ["/item-brand.html"]             = ("Add Brand",               "Fabric"),
            ["/item-category.html"]          = ("Category",                "Fabric"),
            ["/item-add.html"]               = ("Add Item",                "Fabric"),
            // Item Management - Purchase
            ["/item-purchase.html"]          = ("Purchase Item",           "Fabric"),
            ["/item-purchase-record.html"]   = ("Purchase Records",        "Fabric"),
            ["/item-purchase-return.html"]   = ("Purchase Return",         "Fabric"),
            ["/item-purchase-report.html"]   = ("Purchase Report",         "Fabric"),
            // Item Management - Sales
            ["/item-stock-report.html"]      = ("Stock Report",            "Fabric"),
            ["/item-sell.html"]              = ("Sell Item",               "Fabric"),
            ["/item-sell-record.html"]       = ("Sell Records",            "Fabric"),
            ["/item-sell-return.html"]       = ("Sell Return",             "Fabric"),
            ["/item-sell-report.html"]       = ("Sell Report",             "Fabric"),
            // Item Management - Others
            ["/item-supplier-add.html"]      = ("Supplier",                "Fabric"),
            ["/item-damage-add.html"]        = ("Damage",                  "Fabric"),
            // Accounts - Reports
            ["/order-delivery-report.html"]  = ("Order & Delivery Report", "Report"),
            ["/income-expense-report.html"]  = ("Income & Expense Report", "Report"),
            ["/income-expense-net.html"]     = ("Income Expense Net",      "Report"),
            ["/account-log.html"]            = ("Account Log",             "Report"),
            ["/income-due-expense.html"]     = ("Income, Due & Expense",   "Report"),
            ["/transaction-log.html"]        = ("Transaction Log",         "Report"),
            // Accounts
            ["/add-expense.html"]            = ("Add Expense",             "Accounts"),
            ["/add-other-income.html"]       = ("Add Other Income",        "Accounts"),
            ["/account-management.html"]     = ("Account Management",      "Accounts"),
            ["/employee.html"]               = ("Employee Accounts",       "Accounts"),
            // Message / SMS
            ["/sms.html"]                    = ("Send SMS",                "Message"),
            ["/sms-history.html"]            = ("SMS History",             "Message"),
            ["/contact-list.html"]           = ("Phone Contact List",      "Message"),
            ["/sms-settings.html"]           = ("SMS Settings",            "Message"),
        };

        // Reverse lookup: HTML URL → ASPX URL(s) that map to it
        private static readonly Dictionary<string, string> HtmlToAspx;

        static AccessController()
        {
            HtmlToAspx = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (var kv in AspxToHtml)
            {
                // Keep only the first aspx mapping for each html url
                if (!HtmlToAspx.ContainsKey(kv.Value))
                    HtmlToAspx[kv.Value] = kv.Key;
            }
        }

        // GET: api/Access/modules/{institutionId}/{registrationId}
        [HttpGet("modules/{institutionId}/{registrationId}")]
        public IActionResult GetModulesAndPages(int institutionId, int registrationId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                
                // Get ALL available pages from Link_Pages (not filtered by admin's Link_Users)
                // so that admin can assign any page to sub-admin
                var query = @"
                    SELECT DISTINCT 
                        LP.LinkID, 
                        LP.PageTitle, 
                        LP.PageURL, 
                        LP.Location,
                        ISNULL(LC.Category, 'Other') as ModuleName,
                        ISNULL(LSC.SubCategory, '') as SubCategory,
                        ISNULL(LC.Ascending, 999) as ModuleOrder,
                        ISNULL(LSC.Ascending, 999) as SubOrder
                    FROM Link_Pages LP
                    LEFT JOIN Link_Category LC ON LP.LinkCategoryID = LC.LinkCategoryID
                    LEFT JOIN Link_SubCategory LSC ON LP.SubCategoryID = LSC.SubCategoryID
                    ORDER BY ModuleOrder, SubOrder, LP.PageTitle";

                var pages = connection.Query(query).ToList();

                // Normalize URLs and deduplicate by normalized HTML URL
                // Multiple ASPX entries can map to the same HTML page (e.g. CustomerList.aspx and Customer_List.aspx both → /customer-list.html)
                var seenUrls = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                var uniquePages = new List<dynamic>();
                foreach (var p in pages)
                {
                    string normalizedUrl = NormalizeUrl((string)p.PageURL);
                    if (string.IsNullOrEmpty(normalizedUrl) || seenUrls.Contains(normalizedUrl))
                        continue;
                    seenUrls.Add(normalizedUrl);
                    uniquePages.Add(p);
                }

                // Group by module
                var modules = uniquePages
                    .GroupBy(p => (string)p.ModuleName)
                    .Select(g => new {
                        ModuleName = g.Key,
                        ModuleKey = g.Key.ToLower().Replace(" ", ""),
                        Pages = g.Select(p => new {
                            LinkID      = (int)p.LinkID,
                            PageTitle   = (string)p.PageTitle,
                            PageURL     = NormalizeUrl((string)p.PageURL),
                            Location    = (string)p.Location,
                            SubCategory = (string)p.SubCategory
                        }).ToList()
                    })
                    .ToList();

                return Ok(new { success = true, data = modules });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET: api/Access/permissions/{institutionId}/{registrationId}
        [HttpGet("permissions/{institutionId}/{registrationId}")]
        public IActionResult GetPermissions(int institutionId, int registrationId)
        {
            try
            {
                using var connection = _context.CreateConnection();

                // First get the username for this registrationId
                var usernameQuery = "SELECT UserName FROM Registration WHERE RegistrationID = @RegistrationID";
                var username = connection.ExecuteScalar<string>(usernameQuery, new { RegistrationID = registrationId });

                // Query by both RegistrationID AND UserName to cover all save patterns
                var query = @"
                    SELECT DISTINCT
                        LU.LinkID,
                        LU.UserName,
                        LP.PageURL,
                        LP.PageTitle,
                        LP.Location
                    FROM Link_Users LU
                    INNER JOIN Link_Pages LP ON LU.LinkID = LP.LinkID
                    WHERE LU.InstitutionID = @InstitutionID
                      AND (LU.RegistrationID = @RegistrationID
                           OR (@UserName IS NOT NULL AND LU.UserName = @UserName))";

                var raw = connection.Query(query, new {
                    InstitutionID = institutionId,
                    RegistrationID = registrationId,
                    UserName = username
                }).ToList();

                // Map legacy .aspx URLs → modern .html URLs and deduplicate
                var seenUrls = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                var permissions = new List<object>();
                foreach (var p in raw)
                {
                    string normalizedUrl = NormalizeUrl((string)p.PageURL);
                    if (string.IsNullOrEmpty(normalizedUrl) || seenUrls.Contains(normalizedUrl))
                        continue;
                    seenUrls.Add(normalizedUrl);
                    permissions.Add(new {
                        LinkID    = (int)p.LinkID,
                        UserName  = (string)p.UserName,
                        PageURL   = normalizedUrl,
                        PageTitle = (string)p.PageTitle,
                        Location  = (string)p.Location
                    });
                }

                Console.WriteLine($"Found {permissions.Count} permissions for Institution: {institutionId}, Registration: {registrationId}, Username: {username}");

                return Ok(new {
                    success = true,
                    data = permissions,
                    count = permissions.Count
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetPermissions: {ex.Message}");
                return BadRequest(new {
                    success = false,
                    message = ex.Message,
                    data = new List<object>()
                });
            }
        }

        // POST: api/Access/permissions
        [HttpPost("permissions")]
        public IActionResult SavePermissions([FromBody] PermissionUpdateModel model)
        {
            try
            {
                using var connection = _context.CreateConnection();
                connection.Open();
                using var transaction = connection.BeginTransaction();

                try
                {
                    // First, delete all existing permissions for this sub admin
                    var deleteQuery = @"
                        DELETE FROM Link_Users 
                        WHERE InstitutionID = @InstitutionID 
                        AND RegistrationID = @RegistrationID";

                    connection.Execute(deleteQuery, new {
                        InstitutionID = model.InstitutionID,
                        RegistrationID = model.RegistrationID
                    }, transaction);

                    // Build a mapping: for each selected LinkID, find ALL LinkIDs that resolve to the same HTML URL
                    // This ensures legacy ASPX pages also get access when the modern HTML page is granted
                    var allPages = connection.Query("SELECT LinkID, PageURL FROM Link_Pages", transaction: transaction).ToList();
                    var urlToLinkIds = new Dictionary<string, List<int>>(StringComparer.OrdinalIgnoreCase);
                    foreach (var p in allPages)
                    {
                        string normalizedUrl = NormalizeUrl((string)p.PageURL);
                        if (string.IsNullOrEmpty(normalizedUrl)) continue;
                        if (!urlToLinkIds.ContainsKey(normalizedUrl))
                            urlToLinkIds[normalizedUrl] = new List<int>();
                        urlToLinkIds[normalizedUrl].Add((int)p.LinkID);
                    }

                    // Expand selected LinkIDs to include all aliases
                    var expandedLinkIds = new HashSet<int>();
                    if (model.LinkIDs != null)
                    {
                        // Map each selected LinkID to its normalized URL, then get all LinkIDs for that URL
                        var linkIdToUrl = new Dictionary<int, string>();
                        foreach (var p in allPages)
                        {
                            linkIdToUrl[(int)p.LinkID] = NormalizeUrl((string)p.PageURL);
                        }

                        foreach (var linkId in model.LinkIDs)
                        {
                            if (linkIdToUrl.TryGetValue(linkId, out var url) && urlToLinkIds.TryGetValue(url, out var allIds))
                            {
                                foreach (var id in allIds)
                                    expandedLinkIds.Add(id);
                            }
                            else
                            {
                                expandedLinkIds.Add(linkId);
                            }
                        }
                    }

                    // Insert expanded permissions
                    foreach (var linkId in expandedLinkIds)
                    {
                        var insertQuery = @"
                            INSERT INTO Link_Users (InstitutionID, RegistrationID, LinkID, UserName)
                            VALUES (@InstitutionID, @RegistrationID, @LinkID, @UserName)";

                        connection.Execute(insertQuery, new {
                            InstitutionID = model.InstitutionID,
                            RegistrationID = model.RegistrationID,
                            LinkID = linkId,
                            UserName = model.UserName
                        }, transaction);
                    }

                    transaction.Commit();

                    return Ok(new { 
                        success = true, 
                        message = "Permissions updated successfully",
                        data = new { 
                            totalPermissions = expandedLinkIds.Count,
                            uniquePages = model.LinkIDs?.Length ?? 0
                        }
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
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET: api/Access/check/{institutionId}/{registrationId}/{linkId}
        [HttpGet("check/{institutionId}/{registrationId}/{linkId}")]
        public IActionResult CheckAccess(int institutionId, int registrationId, int linkId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                
                var query = @"
                    SELECT COUNT(*) 
                    FROM Link_Users
                    WHERE InstitutionID = @InstitutionID 
                    AND RegistrationID = @RegistrationID
                    AND LinkID = @LinkID";

                var hasAccess = connection.ExecuteScalar<int>(query, new { 
                    InstitutionID = institutionId, 
                    RegistrationID = registrationId,
                    LinkID = linkId
                }) > 0;

                return Ok(new { success = true, hasAccess = hasAccess });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET: api/Access/debug/{institutionId}/{registrationId}
        [HttpGet("debug/{institutionId}/{registrationId}")]
        public IActionResult DebugPermissions(int institutionId, int registrationId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                
                // Check if user exists
                var userQuery = "SELECT * FROM Registration WHERE RegistrationID = @RegistrationID";
                var user = connection.QueryFirstOrDefault(userQuery, new { RegistrationID = registrationId });

                // Check Link_Users entries
                var linkUsersQuery = "SELECT * FROM Link_Users WHERE InstitutionID = @InstitutionID AND RegistrationID = @RegistrationID";
                var linkUsers = connection.Query(linkUsersQuery, new { 
                    InstitutionID = institutionId, 
                    RegistrationID = registrationId 
                }).ToList();

                // Get all Link_Pages
                var pagesQuery = "SELECT TOP 10 * FROM Link_Pages";
                var pages = connection.Query(pagesQuery).ToList();

                return Ok(new { 
                    success = true,
                    debug = new {
                        institutionId = institutionId,
                        registrationId = registrationId,
                        userExists = user != null,
                        userData = user,
                        linkUsersCount = linkUsers.Count,
                        linkUsersData = linkUsers,
                        samplePages = pages
                    }
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

        // GET: api/access/sub-admins?institutionId=X&registrationId=Y
        // Returns Sub-Admin list for this shop (Admin's sub-admins)
        [HttpGet("sub-admins")]
        public IActionResult GetSubAdmins([FromQuery] int institutionId, [FromQuery] int registrationId)
        {
            try
            {
                using var connection = _context.CreateConnection();

                // Determine the logged-in user's category
                // If the admin is stored as Sub-Admin (legacy), don't exclude them from the list
                // Only exclude if the current user is actually Category='Admin' or 'Full-Admin'
                var categoryQuery = "SELECT Category FROM Registration WHERE RegistrationID = @RegistrationID";
                var currentCategory = connection.ExecuteScalar<string>(categoryQuery, new { RegistrationID = registrationId }) ?? "";

                // If current user is a true Admin/Full-Admin, exclude themselves from sub-admin list
                // If current user is Sub-Admin acting as admin (legacy), show ALL sub-admins of that institution
                var shouldExcludeSelf = (currentCategory == "Admin" || currentCategory == "Full-Admin") && registrationId > 0;

                var query = shouldExcludeSelf
                    ? @"SELECT RegistrationID, InstitutionID, UserName, Name, Designation,
                               Email, Validation, Category, CreateDate
                        FROM Registration
                        WHERE Category = 'Sub-Admin'
                          AND InstitutionID = @InstitutionID
                          AND RegistrationID <> @RegistrationID
                        ORDER BY CreateDate DESC"
                    : @"SELECT RegistrationID, InstitutionID, UserName, Name, Designation,
                               Email, Validation, Category, CreateDate
                        FROM Registration
                        WHERE Category = 'Sub-Admin'
                          AND InstitutionID = @InstitutionID
                        ORDER BY CreateDate DESC";

                var list = connection.Query(query, new
                {
                    InstitutionID  = institutionId,
                    RegistrationID = registrationId
                }).ToList();

                return Ok(new { success = true, data = list });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET: api/access/debug-registrations
        // DEBUG ONLY: list all registrations to find valid institutionId/registrationId pairs
        [HttpGet("debug-registrations")]
        public IActionResult DebugRegistrations()
        {
            try
            {
                using var connection = _context.CreateConnection();
                var query = @"
                    SELECT TOP 50 RegistrationID, InstitutionID, UserName, Category, Validation, CreateDate
                    FROM Registration
                    ORDER BY CreateDate DESC";
                var list = connection.Query(query).ToList();
                return Ok(new { success = true, data = list });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET: api/access/ensure-pages/{institutionId}/{registrationId}
        // Ensures all sidebar pages exist in Link_Pages and admin has them in Link_Users.
        // This fixes the issue where sub-admin can't see some sidebar links because
        // those pages were missing from Link_Pages or admin's Link_Users.
        [HttpPost("ensure-pages/{institutionId}/{registrationId}")]
        public IActionResult EnsureSidebarPages(int institutionId, int registrationId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                connection.Open();

                // Get username for the admin
                var username = connection.ExecuteScalar<string>(
                    "SELECT UserName FROM Registration WHERE RegistrationID = @RegistrationID",
                    new { RegistrationID = registrationId });

                // Get all existing Link_Pages URLs (normalized)
                var existingPages = connection.Query<dynamic>("SELECT LinkID, PageURL, PageTitle FROM Link_Pages").ToList();
                var existingUrlToLinkId = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
                foreach (var p in existingPages)
                {
                    string rawUrl = p.PageURL as string ?? "";
                    string normalizedUrl = NormalizeUrl(rawUrl);
                    if (!string.IsNullOrEmpty(normalizedUrl) && !existingUrlToLinkId.ContainsKey(normalizedUrl))
                    {
                        existingUrlToLinkId[normalizedUrl] = (int)p.LinkID;
                    }
                }

                // Get existing Link_Users for this admin
                var existingLinkUsers = connection.Query<int>(
                    "SELECT LinkID FROM Link_Users WHERE InstitutionID = @InstitutionID AND RegistrationID = @RegistrationID",
                    new { InstitutionID = institutionId, RegistrationID = registrationId }).ToHashSet();

                int pagesInserted = 0;
                int linkUsersInserted = 0;

                using var tx = connection.BeginTransaction();
                try
                {
                    // Get or create Link_Category IDs for each category
                    var categoryIds = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
                    var existingCategories = connection.Query<dynamic>(
                        "SELECT LinkCategoryID, Category FROM Link_Category", transaction: tx);
                    foreach (var c in existingCategories)
                    {
                        categoryIds[(string)c.Category] = (int)c.LinkCategoryID;
                    }

                    foreach (var kv in AllSidebarPages)
                    {
                        string htmlUrl = kv.Key;
                        string title = kv.Value.Title;
                        string category = kv.Value.Category;

                        // Check if this page already exists in Link_Pages (by normalized URL)
                        if (existingUrlToLinkId.ContainsKey(htmlUrl))
                        {
                            // Page exists - make sure admin has it in Link_Users
                            int linkId = existingUrlToLinkId[htmlUrl];
                            if (!existingLinkUsers.Contains(linkId))
                            {
                                connection.Execute(
                                    @"INSERT INTO Link_Users (InstitutionID, RegistrationID, LinkID, UserName)
                                      VALUES (@InstitutionID, @RegistrationID, @LinkID, @UserName)",
                                    new { InstitutionID = institutionId, RegistrationID = registrationId, LinkID = linkId, UserName = username },
                                    tx);
                                existingLinkUsers.Add(linkId);
                                linkUsersInserted++;
                            }
                            continue;
                        }

                        // Page doesn't exist in Link_Pages - insert it
                        // Use the ASPX URL if we have a reverse mapping, otherwise use the HTML URL
                        string pageUrl = HtmlToAspx.TryGetValue(htmlUrl, out var aspxUrl) ? aspxUrl : htmlUrl;

                        // Get or create category
                        int? categoryId = null;
                        if (categoryIds.TryGetValue(category, out int catId))
                        {
                            categoryId = catId;
                        }

                        // Determine Location from ASPX URL
                        string location = "";
                        if (!string.IsNullOrEmpty(aspxUrl))
                        {
                            // ~/AccessAdmin/Order/New_Order.aspx → AccessAdmin/Order
                            var parts = aspxUrl.Replace("~/", "").Split('/');
                            if (parts.Length >= 2)
                                location = string.Join("/", parts.Take(parts.Length - 1));
                        }

                        var newLinkId = connection.ExecuteScalar<int>(
                            @"INSERT INTO Link_Pages (PageTitle, PageURL, Location, LinkCategoryID)
                              VALUES (@PageTitle, @PageURL, @Location, @LinkCategoryID);
                              SELECT CAST(SCOPE_IDENTITY() AS INT)",
                            new { PageTitle = title, PageURL = pageUrl, Location = location, LinkCategoryID = categoryId },
                            tx);

                        pagesInserted++;

                        // Also add to admin's Link_Users
                        connection.Execute(
                            @"INSERT INTO Link_Users (InstitutionID, RegistrationID, LinkID, UserName)
                              VALUES (@InstitutionID, @RegistrationID, @LinkID, @UserName)",
                            new { InstitutionID = institutionId, RegistrationID = registrationId, LinkID = newLinkId, UserName = username },
                            tx);
                        linkUsersInserted++;
                    }

                    tx.Commit();
                    return Ok(new
                    {
                        success = true,
                        message = $"Pages inserted: {pagesInserted}, Admin access added: {linkUsersInserted}",
                        pagesInserted,
                        linkUsersInserted
                    });
                }
                catch
                {
                    tx.Rollback();
                    throw;
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET: api/access/missing-pages/{institutionId}/{registrationId}
        // Diagnostic: shows which sidebar pages are missing from Link_Pages or admin's Link_Users
        [HttpGet("missing-pages/{institutionId}/{registrationId}")]
        public IActionResult GetMissingPages(int institutionId, int registrationId)
        {
            try
            {
                using var connection = _context.CreateConnection();

                // Get all existing Link_Pages URLs (normalized)
                var existingPages = connection.Query<dynamic>("SELECT LinkID, PageURL, PageTitle FROM Link_Pages").ToList();
                var existingNormUrls = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                foreach (var p in existingPages)
                {
                    string normalizedUrl = NormalizeUrl(p.PageURL as string ?? "");
                    if (!string.IsNullOrEmpty(normalizedUrl))
                        existingNormUrls.Add(normalizedUrl);
                }

                // Get admin's Link_Users (normalized)
                var adminPermissions = connection.Query<dynamic>(
                    @"SELECT LP.PageURL FROM Link_Users LU
                      INNER JOIN Link_PAGES LP ON LU.LinkID = LP.LinkID
                      WHERE LU.InstitutionID = @InstitutionID AND LU.RegistrationID = @RegistrationID",
                    new { InstitutionID = institutionId, RegistrationID = registrationId }).ToList();
                var adminNormUrls = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                foreach (var p in adminPermissions)
                {
                    string normalizedUrl = NormalizeUrl(p.PageURL as string ?? "");
                    if (!string.IsNullOrEmpty(normalizedUrl))
                        adminNormUrls.Add(normalizedUrl);
                }

                var missingFromLinkPages = new List<object>();
                var missingFromAdminAccess = new List<object>();

                foreach (var kv in AllSidebarPages)
                {
                    if (!existingNormUrls.Contains(kv.Key))
                    {
                        missingFromLinkPages.Add(new { url = kv.Key, title = kv.Value.Title, category = kv.Value.Category });
                    }
                    else if (!adminNormUrls.Contains(kv.Key))
                    {
                        missingFromAdminAccess.Add(new { url = kv.Key, title = kv.Value.Title, category = kv.Value.Category });
                    }
                }

                return Ok(new
                {
                    success = true,
                    totalSidebarPages = AllSidebarPages.Count,
                    totalLinkPages = existingPages.Count,
                    totalAdminAccess = adminPermissions.Count,
                    missingFromLinkPages,
                    missingFromAdminAccess,
                    message = missingFromLinkPages.Count == 0 && missingFromAdminAccess.Count == 0
                        ? "All sidebar pages are properly configured!"
                        : $"{missingFromLinkPages.Count} pages missing from Link_Pages, {missingFromAdminAccess.Count} missing from admin's access. Call POST ensure-pages to fix."
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }

    // Models
    public class PermissionUpdateModel
    {
        public int InstitutionID { get; set; }
        public int RegistrationID { get; set; }
        public string UserName { get; set; }
        public int[] LinkIDs { get; set; }
    }
}
