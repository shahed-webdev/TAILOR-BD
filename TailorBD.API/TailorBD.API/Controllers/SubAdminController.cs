using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Data.SqlClient;
using TailorBD.API.Data;
using Dapper;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SubAdminController : ControllerBase
    {
        private readonly TailorBdContext _context;

        // All available pages in the Authority panel
        private static readonly List<PageDefinition> ALL_PAGES = new()
        {
            new("profile",              "My Profile",            "fa-user-circle",       "Main"),
            new("package",              "Create Package",        "fa-box-open",          "Basic"),
            new("signup",               "SignUp Institution",    "fa-building",          "Basic"),
            new("invoice",              "Create Invoice",        "fa-file-invoice",      "Basic"),
            new("collect-payment",      "Collect Payment",       "fa-hand-holding-usd",  "Basic"),
            new("institution-details",  "Institution Details",   "fa-list-alt",          "Institution Details"),
            new("users",                "Approve/Unlock User",   "fa-user-check",        "User Management"),
            new("roles",                "Role Management",       "fa-shield-alt",        "User Management"),
            new("sub-authority",        "Create Sub Authority",  "fa-user-plus",         "Sub Authority"),
            new("marketing",            "Marketing Reports",     "fa-chart-line",        "Marketing"),
        };

        public SubAdminController(TailorBdContext context)
        {
            _context = context;
        }

        // ── Ensure SubAuthorityPageAccess table exists ────────────────────────
        private void EnsureTable(IDbConnection connection)
        {
            connection.Execute(@"
                IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'SubAuthorityPageAccess')
                CREATE TABLE SubAuthorityPageAccess (
                    ID               INT IDENTITY(1,1) PRIMARY KEY,
                    AuthorityRegID   INT NOT NULL,
                    SubRegID         INT NOT NULL,
                    PageKey          NVARCHAR(100) NOT NULL,
                    IsAccess         BIT NOT NULL DEFAULT 0,
                    CONSTRAINT UQ_SubPageAccess UNIQUE (AuthorityRegID, SubRegID, PageKey)
                )");
        }

        // ── Ensure IsLocked column exists ─────────────────────────────────────
        private bool EnsureIsLocked(IDbConnection connection)
        {
            var exists = connection.ExecuteScalar<int>(@"
                SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME='Registration' AND COLUMN_NAME='IsLocked'") > 0;
            return exists;
        }

        // ════════════════════════════════════════════════
        // GET: api/subadmin/by-authority/{authorityRegId}
        // ════════════════════════════════════════════════
        [HttpGet("by-authority/{authorityRegId}")]
        public IActionResult GetSubAdminsByAuthority(int authorityRegId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var hasLock = EnsureIsLocked(connection);

                var query = hasLock
                    ? @"SELECT RegistrationID, InstitutionID, UserName, Name, Designation,
                               Email, Validation, Category, CreateDate, IsLocked
                        FROM Registration
                        WHERE Category = 'Sub-Authority' AND InstitutionID = @AuthorityRegID
                        ORDER BY CreateDate DESC"
                    : @"SELECT RegistrationID, InstitutionID, UserName, Name, Designation,
                               Email, Validation, Category, CreateDate,
                               CAST(0 AS BIT) AS IsLocked
                        FROM Registration
                        WHERE Category = 'Sub-Authority' AND InstitutionID = @AuthorityRegID
                        ORDER BY CreateDate DESC";

                var list = connection.Query(query, new { AuthorityRegID = authorityRegId });
                return Ok(new { success = true, data = list });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // ═══════════════════════════════════════════════=
        // POST: api/subadmin/authority  — Create Sub Authority
        // ════════════════════════════════════════════════
        [HttpPost("authority")]
        public IActionResult CreateSubAdminByAuthority([FromBody] SubAdminAuthorityCreateModel model)
        {
            try
            {
                using var connection = _context.CreateConnection();
                connection.Open();
                var hasLock = EnsureIsLocked(connection);
                using var tx = connection.BeginTransaction();
                try
                {
                    var regQuery = hasLock
                        ? @"INSERT INTO Registration(InstitutionID, UserName, Validation, Category, CreateDate, Name, Designation, Email, IsLocked)
                            VALUES(@InstitutionID, @UserName, 'Invalid', 'Sub-Authority', GETDATE(), @Name, @Designation, @Email, 0);
                            SELECT CAST(SCOPE_IDENTITY() AS INT)"
                        : @"INSERT INTO Registration(InstitutionID, UserName, Validation, Category, CreateDate, Name, Designation, Email)
                            VALUES(@InstitutionID, @UserName, 'Invalid', 'Sub-Authority', GETDATE(), @Name, @Designation, @Email);
                            SELECT CAST(SCOPE_IDENTITY() AS INT)";

                    var newRegId = connection.ExecuteScalar<int>(regQuery, new
                    {
                        InstitutionID = model.AuthorityRegistrationID,
                        model.UserName,
                        model.Name,
                        model.Designation,
                        model.Email
                    }, tx);

                    connection.Execute(@"
                        INSERT INTO LIU(InstitutionID, RegistrationID, UserName, Category, Password, PasswordAnswer)
                        VALUES(@InstitutionID, @RegistrationID, @UserName, 'Sub-Authority', @Password, @PasswordAnswer)",
                        new
                        {
                            InstitutionID = model.AuthorityRegistrationID,
                            RegistrationID = newRegId,
                            model.UserName,
                            model.Password,
                            PasswordAnswer = model.SecurityAnswer
                        }, tx);

                    tx.Commit();
                    return Ok(new { success = true, message = "Sub Authority সফলভাবে তৈরি হয়েছে", data = new { registrationId = newRegId } });
                }
                catch { tx.Rollback(); throw; }
            }
            catch (SqlException ex) when (ex.Number == 2627 || ex.Number == 2601)
            {
                return BadRequest(new { success = false, message = "এই ইউজারনাম ইতিমধ্যেই ব্যবহৃত হয়েছে। অন্য ইউজারনাম চেষ্টা করুন।" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // ════════════════════════════════════════════════
        // PUT: api/subadmin/{id}/approval
        // ════════════════════════════════════════════════
        [HttpPut("{id}/approval")]
        public IActionResult ToggleApproval(int id, [FromBody] ApprovalStatusModel model)
        {
            try
            {
                using var connection = _context.CreateConnection();
                connection.Execute(
                    "UPDATE Registration SET Validation=@Validation WHERE RegistrationID=@ID AND Category='Sub-Authority'",
                    new { Validation = model.Validation, ID = id });
                return Ok(new { success = true, message = model.Validation == "Valid" ? "অ্যাপ্রুভ করা হয়েছে" : "আনঅ্যাপ্রুভ করা হয়েছে" });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ════════════════════════════════════════════════
        // PUT: api/subadmin/{id}/lock
        // ════════════════════════════════════════════════
        [HttpPut("{id}/lock")]
        public IActionResult ToggleLock(int id, [FromBody] LockStatusModel model)
        {
            try
            {
                using var connection = _context.CreateConnection();
                if (!EnsureIsLocked(connection))
                    return BadRequest(new { success = false, message = "IsLocked কলাম নেই। migrate endpoint কল করুন।" });

                connection.Execute(
                    "UPDATE Registration SET IsLocked=@IsLocked WHERE RegistrationID=@ID AND Category='Sub-Authority'",
                    new { model.IsLocked, ID = id });
                return Ok(new { success = true, message = model.IsLocked ? "লক করা হয়েছে" : "আনলক করা হয়েছে" });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ════════════════════════════════════════════════
        // DELETE: api/subadmin/{id}?authorityRegId=X
        // ════════════════════════════════════════════════
        [HttpDelete("{id}")]
        public IActionResult DeleteSubAdmin(int id, [FromQuery] int authorityRegId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                connection.Open();
                EnsureTable(connection);
                using var tx = connection.BeginTransaction();
                try
                {
                    connection.Execute("DELETE FROM SubAuthorityPageAccess WHERE SubRegID=@ID", new { ID = id }, tx);
                    connection.Execute("DELETE FROM LIU WHERE RegistrationID=@ID AND InstitutionID=@Auth", new { ID = id, Auth = authorityRegId }, tx);
                    connection.Execute("DELETE FROM Registration WHERE RegistrationID=@ID AND InstitutionID=@Auth AND Category='Sub-Authority'", new { ID = id, Auth = authorityRegId }, tx);
                    tx.Commit();
                    return Ok(new { success = true, message = "Sub Authority মুছে ফেলা হয়েছে" });
                }
                catch { tx.Rollback(); throw; }
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ════════════════════════════════════════════════
        // GET: api/subadmin/pages
        // Returns all available HTML pages
        // ════════════════════════════════════════════════
        [HttpGet("pages")]
        public IActionResult GetAllPages()
        {
            var grouped = ALL_PAGES
                .GroupBy(p => p.Group)
                .Select(g => new {
                    groupName = g.Key,
                    pages = g.Select(p => new { p.Key, p.Label, p.Icon }).ToList()
                }).ToList();
            return Ok(new { success = true, data = grouped });
        }

        // ════════════════════════════════════════════════
        // GET: api/subadmin/page-access/{subRegId}
        // Returns page keys that are enabled for this sub-authority
        // ════════════════════════════════════════════════
        [HttpGet("page-access/{subRegId}")]
        public IActionResult GetPageAccess(int subRegId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                EnsureTable(connection);
                var keys = connection.Query<string>(
                    "SELECT PageKey FROM SubAuthorityPageAccess WHERE SubRegID=@SubRegID AND IsAccess=1",
                    new { SubRegID = subRegId }).ToList();
                return Ok(new { success = true, data = keys });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ════════════════════════════════════════════════
        // POST: api/subadmin/page-access/{subRegId}
        // Save page access (replace all)
        // ════════════════════════════════════════════════
        [HttpPost("page-access/{subRegId}")]
        public IActionResult SavePageAccess(int subRegId, [FromBody] PageAccessSaveModel model)
        {
            try
            {
                using var connection = _context.CreateConnection();
                connection.Open();
                EnsureTable(connection);
                using var tx = connection.BeginTransaction();
                try
                {
                    // Delete existing
                    connection.Execute(
                        "DELETE FROM SubAuthorityPageAccess WHERE AuthorityRegID=@Auth AND SubRegID=@Sub",
                        new { Auth = model.AuthorityRegistrationID, Sub = subRegId }, tx);

                    // Insert all pages with access flag
                    foreach (var page in ALL_PAGES)
                    {
                        var hasAccess = model.PageKeys != null && model.PageKeys.Contains(page.Key);
                        connection.Execute(@"
                            INSERT INTO SubAuthorityPageAccess(AuthorityRegID, SubRegID, PageKey, IsAccess)
                            VALUES(@Auth, @Sub, @PageKey, @IsAccess)",
                            new { Auth = model.AuthorityRegistrationID, Sub = subRegId, PageKey = page.Key, IsAccess = hasAccess }, tx);
                    }

                    tx.Commit();
                    var count = model.PageKeys?.Length ?? 0;
                    return Ok(new { success = true, message = "পেইজ এক্সেস সেভ হয়েছে", totalAccess = count });
                }
                catch { tx.Rollback(); throw; }
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ════════════════════════════════════════════════
        // PUT: api/subadmin/migrate-add-islockedcolumn
        // ════════════════════════════════════════════════
        [HttpPut("migrate-add-islockedcolumn")]
        public IActionResult MigrateAddIsLockedColumn()
        {
            try
            {
                using var connection = _context.CreateConnection();
                if (EnsureIsLocked(connection))
                    return Ok(new { success = true, message = "IsLocked column already exists." });
                connection.Execute("ALTER TABLE Registration ADD IsLocked BIT NOT NULL DEFAULT 0");
                return Ok(new { success = true, message = "IsLocked column added successfully." });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ════════════════════════════════════════════════
        // GET: api/subadmin/my-pages/{subRegId}
        // Returns full page objects that sub-authority has access to
        // ════════════════════════════════════════════════
        [HttpGet("my-pages/{subRegId}")]
        public IActionResult GetMyPages(int subRegId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                EnsureTable(connection);

                var enabledKeys = connection.Query<string>(
                    "SELECT PageKey FROM SubAuthorityPageAccess WHERE SubRegID=@SubRegID AND IsAccess=1",
                    new { SubRegID = subRegId }).ToList();

                var pages = ALL_PAGES
                    .Where(p => enabledKeys.Contains(p.Key))
                    .Select(p => new { p.Key, p.Label, p.Icon, p.Group })
                    .ToList();

                return Ok(new { success = true, data = pages });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ════════════════════════════════════════════════
        // PUT: api/subadmin/migrate-fix-category
        // Fix existing Sub-Authority records that were saved as 'Sub-Admin'
        // ════════════════════════════════════════════════
        [HttpPut("migrate-fix-category")]
        public IActionResult MigrateFixCategory()
        {
            try
            {
                using var connection = _context.CreateConnection();

                // Find records: Category='Sub-Admin' AND InstitutionID matches an Authority RegistrationID
                var regCount = connection.Execute(@"
                    UPDATE r SET r.Category = 'Sub-Authority'
                    FROM Registration r
                    WHERE r.Category = 'Sub-Admin'
                      AND EXISTS (
                          SELECT 1 FROM Registration a
                          WHERE a.RegistrationID = r.InstitutionID
                            AND a.Category = 'Authority'
                      )");

                var liuCount = connection.Execute(@"
                    UPDATE l SET l.Category = 'Sub-Authority'
                    FROM LIU l
                    WHERE l.Category = 'Sub-Admin'
                      AND EXISTS (
                          SELECT 1 FROM Registration a
                          WHERE a.RegistrationID = l.InstitutionID
                            AND a.Category = 'Authority'
                      )");

                return Ok(new { success = true, message = $"Registration: {regCount} rows, LIU: {liuCount} rows updated." });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ════════════════════════════════════════════════
        // GET: api/subadmin/{institutionId}  — Get Sub-Admins by InstitutionID
        // ════════════════════════════════════════════════
        [HttpGet("{institutionId:int}")]
        public IActionResult GetSubAdminsByInstitution(int institutionId, [FromQuery] int registrationId = 0)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var hasLock = EnsureIsLocked(connection);

                // Determine whether to exclude caller (only if they are a true Admin)
                string? callerCategory = null;
                if (registrationId > 0)
                {
                    callerCategory = connection.ExecuteScalar<string>(
                        "SELECT Category FROM Registration WHERE RegistrationID = @RegistrationID",
                        new { RegistrationID = registrationId });
                }
                var excludeSelf = (callerCategory == "Admin" || callerCategory == "Full-Admin") && registrationId > 0;

                var baseSelect = hasLock
                    ? "SELECT RegistrationID, InstitutionID, UserName, Name, Designation, Email, Validation, Category, CreateDate, IsLocked"
                    : "SELECT RegistrationID, InstitutionID, UserName, Name, Designation, Email, Validation, Category, CreateDate, CAST(0 AS BIT) AS IsLocked";

                var whereClause = excludeSelf
                    ? "WHERE Category = 'Sub-Admin' AND InstitutionID = @InstitutionID AND RegistrationID <> @RegistrationID"
                    : "WHERE Category = 'Sub-Admin' AND InstitutionID = @InstitutionID";

                var query = $"{baseSelect} FROM Registration {whereClause} ORDER BY CreateDate DESC";

                var list = connection.Query(query, new { InstitutionID = institutionId, RegistrationID = registrationId });
                return Ok(new { success = true, data = list });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // ════════════════════════════════════════════════
        // POST: api/subadmin  — Create Sub-Admin (for Admin users)
        // ════════════════════════════════════════════════
        [HttpPost]
        public IActionResult CreateSubAdmin([FromBody] SubAdminCreateModel model)
        {
            try
            {
                using var connection = _context.CreateConnection();
                connection.Open();
                var hasLock = EnsureIsLocked(connection);
                using var tx = connection.BeginTransaction();
                try
                {
                    var regQuery = hasLock
                        ? @"INSERT INTO Registration(InstitutionID, UserName, Validation, Category, CreateDate, Name, Designation, Email, IsLocked)
                            VALUES(@InstitutionID, @UserName, 'Valid', 'Sub-Admin', GETDATE(), @Name, @Designation, @Email, 0);
                            SELECT CAST(SCOPE_IDENTITY() AS INT)"
                        : @"INSERT INTO Registration(InstitutionID, UserName, Validation, Category, CreateDate, Name, Designation, Email)
                            VALUES(@InstitutionID, @UserName, 'Valid', 'Sub-Admin', GETDATE(), @Name, @Designation, @Email);
                            SELECT CAST(SCOPE_IDENTITY() AS INT)";

                    var newRegId = connection.ExecuteScalar<int>(regQuery, new
                    {
                        model.InstitutionID,
                        model.UserName,
                        model.Name,
                        model.Designation,
                        model.Email
                    }, tx);

                    connection.Execute(@"
                        INSERT INTO LIU(InstitutionID, RegistrationID, UserName, Category, Password, PasswordAnswer)
                        VALUES(@InstitutionID, @RegistrationID, @UserName, 'Sub-Admin', @Password, @PasswordAnswer)",
                        new
                        {
                            model.InstitutionID,
                            RegistrationID = newRegId,
                            model.UserName,
                            model.Password,
                            PasswordAnswer = model.SecurityAnswer
                        }, tx);

                    tx.Commit();
                    return Ok(new { success = true, message = "সাব-অ্যাডমিন সফলভাবে তৈরি হয়েছে", data = new { registrationId = newRegId } });
                }
                catch { tx.Rollback(); throw; }
            }
            catch (SqlException ex) when (ex.Number == 2627 || ex.Number == 2601)
            {
                return BadRequest(new { success = false, message = "এই ইউজারনাম ইতিমধ্যেই ব্যবহৃত হয়েছে। অন্য ইউজারনাম চেষ্টা করুন।" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }

    // ── Models ────────────────────────────────────────────────────────────────
    record PageDefinition(string Key, string Label, string Icon, string Group);

    public class SubAdminAuthorityCreateModel
    {
        public int AuthorityRegistrationID { get; set; }
        public string Name { get; set; }
        public string Designation { get; set; }
        public string UserName { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string SecurityAnswer { get; set; }
    }

    public class LockStatusModel
    {
        public bool IsLocked { get; set; }
    }

    public class ApprovalStatusModel
    {
        public string Validation { get; set; }
    }

    public class PageAccessSaveModel
    {
        public int AuthorityRegistrationID { get; set; }
        public string[] PageKeys { get; set; }
    }

    // Keep old models for backward compatibility
    public class SubAdminCreateModel
    {
        public int InstitutionID { get; set; }
        public string Name { get; set; }
        public string Designation { get; set; }
        public string UserName { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string SecurityAnswer { get; set; }
    }

    public class AccessUpdateModel
    {
        public int[] LinkIDs { get; set; }
    }

    public class AuthorityAccessUpdateModel
    {
        public int[] LinkIDs { get; set; }
        public int AuthorityRegistrationID { get; set; }
    }
}
