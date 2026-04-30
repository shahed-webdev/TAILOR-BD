using Microsoft.AspNetCore.Mvc;
using TailorBD.API.Data;
using Dapper;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RedirectController : ControllerBase
    {
        private readonly TailorBdContext _context;

        // Mapping of old .aspx paths to new .html paths
        private static readonly Dictionary<string, string> PathMappings = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            // Basic Setting
            { "AccessAdmin/TailorInfo.aspx", "/tailor-info.html" },
            { "~/AccessAdmin/TailorInfo.aspx", "/tailor-info.html" },
            { "AccessAdmin/Dress/DressAdd.aspx", "/dress-add.html" },
            { "~/AccessAdmin/Dress/DressAdd.aspx", "/dress-add.html" },
            { "AccessAdmin/Sub_Admin/Sub_Admin_Form.aspx", "/sub-admin.html" },
            { "~/AccessAdmin/Sub_Admin/Sub_Admin_Form.aspx", "/sub-admin.html" },
            { "AccessAdmin/Sub_Admin/Access_Manage.aspx", "/access-management.html" },
            { "~/AccessAdmin/Sub_Admin/Access_Manage.aspx", "/access-management.html" },
            
            // Order
            { "AccessAdmin/Order/Order.aspx", "/new-order.html" },
            { "~/AccessAdmin/Order/Order.aspx", "/new-order.html" },
            { "AccessAdmin/Order/Order_List.aspx", "/order-list.html" },
            { "~/AccessAdmin/Order/Order_List.aspx", "/order-list.html" },
            
            // Customer
            { "AccessAdmin/Customer/CustomerList.aspx", "/customer-list.html" },
            { "~/AccessAdmin/Customer/CustomerList.aspx", "/customer-list.html" },
            { "AccessAdmin/Customer/MeasurementList.aspx", "/measurement-list.html" },
            { "~/AccessAdmin/Customer/MeasurementList.aspx", "/measurement-list.html" },
            
            // Reports
            { "AccessAdmin/Report/Report_By_Date.aspx", "/report-by-date.html" },
            { "~/AccessAdmin/Report/Report_By_Date.aspx", "/report-by-date.html" },
            { "AccessAdmin/Report/DueReport.aspx", "/due-balance.html" },
            { "~/AccessAdmin/Report/DueReport.aspx", "/due-balance.html" },
            
            // Accounts
            { "AccessAdmin/Acount/Income_Expense.aspx", "/income-expense.html" },
            { "~/AccessAdmin/Acount/Income_Expense.aspx", "/income-expense.html" },
            { "AccessAdmin/Accounts/Income_And_Expense_Report.aspx", "/income-expense-report.html" },
            { "~/AccessAdmin/Accounts/Income_And_Expense_Report.aspx", "/income-expense-report.html" },
            { "AccessAdmin/Accounts/Accounts_Report.aspx", "/income-expense-report.html" },
            { "~/AccessAdmin/Accounts/Accounts_Report.aspx", "/income-expense-report.html" },
            
            // Default fallback
            { "AccessAdmin/Dashboard.aspx", "/dashboard.html" },
            { "~/AccessAdmin/Dashboard.aspx", "/dashboard.html" },
        };

        public RedirectController(TailorBdContext context)
        {
            _context = context;
        }

        // GET: api/Redirect/first-accessible-page/{institutionId}/{registrationId}
        [HttpGet("first-accessible-page/{institutionId}/{registrationId}")]
        public IActionResult GetFirstAccessiblePage(int institutionId, int registrationId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                
                // Get first accessible page for this sub-admin
                var query = @"
                    SELECT TOP 1 LP.PageURL, LP.Location
                    FROM Link_Users LU
                    INNER JOIN Link_Pages LP ON LU.LinkID = LP.LinkID
                    WHERE LU.InstitutionID = @InstitutionID 
                    AND LU.RegistrationID = @RegistrationID
                    AND (LP.PageURL IS NOT NULL OR LP.Location IS NOT NULL)
                    ORDER BY LP.LinkID";

                var result = connection.QueryFirstOrDefault<dynamic>(query, new {
                    InstitutionID = institutionId,
                    RegistrationID = registrationId
                });

                if (result != null)
                {
                    string pageUrl = result.PageURL ?? result.Location;
                    
                    // Convert old .aspx path to new .html path
                    string modernUrl = ConvertToModernUrl(pageUrl);
                    
                    return Ok(new { 
                        success = true, 
                        redirectUrl = modernUrl,
                        message = "First accessible page found" 
                    });
                }
                else
                {
                    // No pages accessible - redirect to access denied
                    return Ok(new { 
                        success = true, 
                        redirectUrl = "/access-denied.html",
                        message = "No accessible pages found" 
                    });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { 
                    success = false, 
                    message = ex.Message,
                    redirectUrl = "/dashboard.html" // Default fallback
                });
            }
        }

        // Helper method to convert old .aspx URLs to new .html URLs
        private string ConvertToModernUrl(string oldUrl)
        {
            if (string.IsNullOrEmpty(oldUrl))
                return "/dashboard.html";

            // Clean up the URL
            oldUrl = oldUrl.Trim().TrimStart('~', '/');

            // Check if we have a mapping
            if (PathMappings.TryGetValue(oldUrl, out string modernUrl))
            {
                return modernUrl;
            }

            // If no mapping found, try to guess
            if (oldUrl.EndsWith(".aspx", StringComparison.OrdinalIgnoreCase))
            {
                // Extract filename and convert to lowercase-with-hyphens
                var fileName = Path.GetFileNameWithoutExtension(oldUrl);
                var modernFileName = ConvertToKebabCase(fileName) + ".html";
                return "/" + modernFileName;
            }

            // Default fallback
            return "/dashboard.html";
        }

        // Convert PascalCase or snake_case to kebab-case
        private string ConvertToKebabCase(string input)
        {
            if (string.IsNullOrEmpty(input))
                return "dashboard";

            // Replace underscores with hyphens
            input = input.Replace("_", "-");

            // Add hyphen before uppercase letters and convert to lowercase
            var result = string.Concat(
                input.Select((c, i) => 
                    i > 0 && char.IsUpper(c) ? "-" + char.ToLower(c).ToString() : char.ToLower(c).ToString()
                )
            );

            return result.Trim('-');
        }

        // GET: api/Redirect/migrate-page-urls
        [HttpGet("migrate-page-urls")]
        public IActionResult MigratePageUrls()
        {
            try
            {
                using var connection = _context.CreateConnection();
                connection.Open();
                using var transaction = connection.BeginTransaction();

                try
                {
                    var updates = new List<string>();

                    // Update each mapping
                    foreach (var mapping in PathMappings)
                    {
                        var oldUrl = mapping.Key.TrimStart('~', '/');
                        var newUrl = mapping.Value;

                        var updateQuery = @"
                            UPDATE Link_Pages 
                            SET PageURL = @NewUrl 
                            WHERE PageURL LIKE '%' + @OldUrl + '%' 
                            OR Location LIKE '%' + @OldUrl + '%'";

                        var rowsAffected = connection.Execute(updateQuery, new {
                            NewUrl = newUrl,
                            OldUrl = oldUrl
                        }, transaction);

                        if (rowsAffected > 0)
                        {
                            updates.Add($"Updated {rowsAffected} rows: {oldUrl} ? {newUrl}");
                        }
                    }

                    transaction.Commit();

                    return Ok(new {
                        success = true,
                        message = "Page URLs migrated successfully",
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
    }
}
