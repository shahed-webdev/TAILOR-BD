using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RoleController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<RoleController> _logger;

        public RoleController(IConfiguration configuration, ILogger<RoleController> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        private SqlConnection CreateConnection() =>
            new SqlConnection(_configuration.GetConnectionString("TailorBDConnectionString"));

        private async Task<Guid> GetAppIdAsync(SqlConnection con)
        {
            using var cmd = new SqlCommand("SELECT TOP 1 ApplicationId FROM aspnet_Applications", con);
            var result = await cmd.ExecuteScalarAsync();
            if (result == null || result == DBNull.Value)
                throw new Exception("No ASP.NET application found in database.");
            return (Guid)result;
        }

        // ══════════════════════════════════════════════════════════════════
        //  ROLES  — Create / Read / Delete
        // ══════════════════════════════════════════════════════════════════

        /// <summary>GET all roles with user count</summary>
        [HttpGet]
        public async Task<ActionResult> GetRoles()
        {
            try
            {
                using var con = CreateConnection();
                await con.OpenAsync();

                // Count users from aspnet_UsersInRoles PLUS Registration users per category
                var sql = @"
                    SELECT r.RoleId, r.RoleName,
                           COUNT(ur.UserId) AS UserCount
                    FROM aspnet_Roles r
                    LEFT JOIN aspnet_UsersInRoles ur ON r.RoleId = ur.RoleId
                    GROUP BY r.RoleId, r.RoleName
                    ORDER BY r.RoleName";

                using var cmd = new SqlCommand(sql, con);
                var roles = new List<dynamic>();
                using (var rdr = await cmd.ExecuteReaderAsync())
                {
                    while (await rdr.ReadAsync())
                    {
                        roles.Add(new
                        {
                            roleId    = rdr["RoleId"].ToString(),
                            roleName  = rdr["RoleName"]?.ToString() ?? "",
                            userCount = Convert.ToInt32(rdr["UserCount"])
                        });
                    }
                }

                // For each role that matches a Registration.Category, add those users too
                var regCountSql = @"
                    SELECT Category, COUNT(*) AS Cnt
                    FROM Registration
                    WHERE Category IN ('Admin','Sub-Admin','Authority','Sub-Authority')
                    GROUP BY Category";

                using var regCmd = new SqlCommand(regCountSql, con);
                var regCounts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
                using (var rdr2 = await regCmd.ExecuteReaderAsync())
                {
                    while (await rdr2.ReadAsync())
                    {
                        regCounts[rdr2["Category"].ToString()!] = Convert.ToInt32(rdr2["Cnt"]);
                    }
                }

                var list = roles.Select(r =>
                {
                    var extraCount = regCounts.TryGetValue(r.roleName, out int rc) ? rc : 0;
                    return new
                    {
                        roleId    = (string)r.roleId,
                        roleName  = (string)r.roleName,
                        userCount = (int)r.userCount + extraCount
                    };
                }).ToList<object>();

                return Ok(new { success = true, data = list });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting roles");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>POST create new role</summary>
        [HttpPost]
        public async Task<ActionResult> CreateRole([FromBody] RoleNameRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.RoleName))
                return BadRequest(new { success = false, message = "Role name is required." });

            var roleName = req.RoleName.Trim();

            try
            {
                using var con = CreateConnection();
                await con.OpenAsync();
                var appId = await GetAppIdAsync(con);

                // Check duplicate
                using var chk = new SqlCommand(
                    "SELECT COUNT(*) FROM aspnet_Roles WHERE LoweredRoleName=@r AND ApplicationId=@a", con);
                chk.Parameters.AddWithValue("@r", roleName.ToLower());
                chk.Parameters.AddWithValue("@a", appId);
                var exists = (int)(await chk.ExecuteScalarAsync())!;
                if (exists > 0)
                    return Conflict(new { success = false, message = $"Role '{roleName}' already exists." });

                using var ins = new SqlCommand(
                    @"INSERT INTO aspnet_Roles (ApplicationId, RoleId, RoleName, LoweredRoleName, Description)
                      VALUES (@a, @id, @rn, @lr, '')", con);
                ins.Parameters.AddWithValue("@a",  appId);
                ins.Parameters.AddWithValue("@id", Guid.NewGuid());
                ins.Parameters.AddWithValue("@rn", roleName);
                ins.Parameters.AddWithValue("@lr", roleName.ToLower());
                await ins.ExecuteNonQueryAsync();

                return Ok(new { success = true, message = $"Role '{roleName}' created successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating role");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>DELETE role by name (only if no users assigned)</summary>
        [HttpDelete("{roleName}")]
        public async Task<ActionResult> DeleteRole(string roleName)
        {
            try
            {
                using var con = CreateConnection();
                await con.OpenAsync();
                var appId = await GetAppIdAsync(con);

                // Check if any user is assigned
                using var chk = new SqlCommand(@"
                    SELECT COUNT(*) FROM aspnet_UsersInRoles ur
                    INNER JOIN aspnet_Roles r ON ur.RoleId = r.RoleId
                    WHERE r.LoweredRoleName = @r AND r.ApplicationId = @a", con);
                chk.Parameters.AddWithValue("@r", roleName.ToLower());
                chk.Parameters.AddWithValue("@a", appId);
                var count = (int)(await chk.ExecuteScalarAsync())!;
                if (count > 0)
                    return BadRequest(new { success = false, message = $"Cannot delete '{roleName}' — {count} user(s) are assigned to this role. Remove users first." });

                using var del = new SqlCommand(
                    "DELETE FROM aspnet_Roles WHERE LoweredRoleName=@r AND ApplicationId=@a", con);
                del.Parameters.AddWithValue("@r", roleName.ToLower());
                del.Parameters.AddWithValue("@a", appId);
                var rows = await del.ExecuteNonQueryAsync();
                if (rows == 0)
                    return NotFound(new { success = false, message = "Role not found." });

                return Ok(new { success = true, message = $"Role '{roleName}' deleted." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting role");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ══════════════════════════════════════════════════════════════════
        //  USERS IN ROLE
        // ══════════════════════════════════════════════════════════════════

        /// <summary>GET all users with their roles (for authority panel)</summary>
        [HttpGet("users")]
        public async Task<ActionResult> GetUsersWithRoles([FromQuery] string? search = null)
        {
            try
            {
                using var con = CreateConnection();
                await con.OpenAsync();

                // Users from aspnet_Users (Admin, Sub-Admin, Authority)
                var sql = @"
                    SELECT
                        u.UserName,
                        ISNULL(r.Name, '')   AS FullName,
                        ISNULL(r.Phone, '')  AS Phone,
                        ISNULL(l.Category,'') AS Category,
                        ISNULL(i.InstitutionName,'') AS InstitutionName,
                        STRING_AGG(ro.RoleName, ', ') AS Roles
                    FROM aspnet_Users u
                    LEFT JOIN LIU l              ON u.UserName = l.UserName
                    LEFT JOIN Registration r     ON l.RegistrationID = r.RegistrationID
                    LEFT JOIN Institution i      ON l.InstitutionID  = i.InstitutionID
                    LEFT JOIN aspnet_UsersInRoles ur ON u.UserId = ur.UserId
                    LEFT JOIN aspnet_Roles ro    ON ur.RoleId = ro.RoleId
                    WHERE 1=1";

                if (!string.IsNullOrWhiteSpace(search))
                    sql += " AND (u.UserName LIKE @search OR i.InstitutionName LIKE @search)";

                sql += " GROUP BY u.UserName, r.Name, r.Phone, l.Category, i.InstitutionName ORDER BY i.InstitutionName, u.UserName";

                using var cmd = new SqlCommand(sql, con);
                if (!string.IsNullOrWhiteSpace(search))
                    cmd.Parameters.AddWithValue("@search", "%" + search + "%");

                var list = new List<object>();
                using (var rdr = await cmd.ExecuteReaderAsync())
                {
                    while (await rdr.ReadAsync())
                    {
                        list.Add(new
                        {
                            userName        = rdr["UserName"]?.ToString() ?? "",
                            fullName        = rdr["FullName"]?.ToString() ?? "",
                            phone           = rdr["Phone"]?.ToString() ?? "",
                            category        = rdr["Category"]?.ToString() ?? "",
                            institutionName = rdr["InstitutionName"]?.ToString() ?? "",
                            roles           = rdr["Roles"] == DBNull.Value ? "" : rdr["Roles"]?.ToString() ?? ""
                        });
                    }
                }

                // Also include LIU-only users (Sub-Authority) not in aspnet_Users
                var liuSql = @"
                    SELECT
                        l.UserName,
                        ISNULL(r.Name,'')  AS FullName,
                        ISNULL(r.Phone,'') AS Phone,
                        l.Category,
                        ISNULL(i.InstitutionName,'') AS InstitutionName
                    FROM LIU l
                    LEFT JOIN Registration r ON l.RegistrationID = r.RegistrationID
                    LEFT JOIN Institution i  ON l.InstitutionID  = i.InstitutionID
                    WHERE l.Category = 'Sub-Authority'
                      AND NOT EXISTS (SELECT 1 FROM aspnet_Users u WHERE u.UserName = l.UserName)";

                if (!string.IsNullOrWhiteSpace(search))
                    liuSql += " AND (l.UserName LIKE @search2 OR i.InstitutionName LIKE @search2)";

                using var liuCmd = new SqlCommand(liuSql, con);
                if (!string.IsNullOrWhiteSpace(search))
                    liuCmd.Parameters.AddWithValue("@search2", "%" + search + "%");

                using (var rdr2 = await liuCmd.ExecuteReaderAsync())
                {
                    while (await rdr2.ReadAsync())
                    {
                        list.Add(new
                        {
                            userName        = rdr2["UserName"]?.ToString() ?? "",
                            fullName        = rdr2["FullName"]?.ToString() ?? "",
                            phone           = rdr2["Phone"]?.ToString() ?? "",
                            category        = rdr2["Category"]?.ToString() ?? "",
                            institutionName = rdr2["InstitutionName"]?.ToString() ?? "",
                            roles           = "Sub-Authority"
                        });
                    }
                }

                return Ok(new { success = true, data = list });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users with roles");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>GET roles for a specific user</summary>
        [HttpGet("users/{userName}/roles")]
        public async Task<ActionResult> GetRolesForUser(string userName)
        {
            try
            {
                using var con = CreateConnection();
                await con.OpenAsync();

                // All roles with a flag indicating if user is in them
                var sql = @"
                    SELECT r.RoleName,
                           CASE WHEN ur.UserId IS NOT NULL THEN 1 ELSE 0 END AS IsInRole
                    FROM aspnet_Roles r
                    LEFT JOIN aspnet_UsersInRoles ur
                        ON r.RoleId = ur.RoleId
                       AND ur.UserId = (SELECT UserId FROM aspnet_Users WHERE UserName = @u)
                    ORDER BY r.RoleName";

                using var cmd = new SqlCommand(sql, con);
                cmd.Parameters.AddWithValue("@u", userName);
                var list = new List<object>();
                using var rdr = await cmd.ExecuteReaderAsync();
                while (await rdr.ReadAsync())
                {
                    list.Add(new
                    {
                        roleName  = rdr["RoleName"]?.ToString() ?? "",
                        isInRole  = Convert.ToInt32(rdr["IsInRole"]) == 1
                    });
                }
                return Ok(new { success = true, data = list });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting roles for user");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>POST assign role to user</summary>
        [HttpPost("users/{userName}/assign")]
        public async Task<ActionResult> AssignRole(string userName, [FromBody] RoleNameRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.RoleName))
                return BadRequest(new { success = false, message = "Role name is required." });

            try
            {
                using var con = CreateConnection();
                await con.OpenAsync();
                var appId = await GetAppIdAsync(con);

                // Verify user exists
                using var uChk = new SqlCommand("SELECT UserId FROM aspnet_Users WHERE UserName=@u", con);
                uChk.Parameters.AddWithValue("@u", userName);
                var userId = await uChk.ExecuteScalarAsync();
                if (userId == null || userId == DBNull.Value)
                    return NotFound(new { success = false, message = $"User '{userName}' not found." });

                // Get role id
                using var rChk = new SqlCommand(
                    "SELECT RoleId FROM aspnet_Roles WHERE LoweredRoleName=@r AND ApplicationId=@a", con);
                rChk.Parameters.AddWithValue("@r", req.RoleName.ToLower().Trim());
                rChk.Parameters.AddWithValue("@a", appId);
                var roleId = await rChk.ExecuteScalarAsync();
                if (roleId == null || roleId == DBNull.Value)
                    return NotFound(new { success = false, message = $"Role '{req.RoleName}' not found." });

                // Check not already assigned
                using var dupChk = new SqlCommand(
                    "SELECT COUNT(*) FROM aspnet_UsersInRoles WHERE UserId=@u AND RoleId=@r", con);
                dupChk.Parameters.AddWithValue("@u", (Guid)userId);
                dupChk.Parameters.AddWithValue("@r", (Guid)roleId);
                var dup = (int)(await dupChk.ExecuteScalarAsync())!;
                if (dup > 0)
                    return Conflict(new { success = false, message = $"User '{userName}' is already in role '{req.RoleName}'." });

                using var ins = new SqlCommand(
                    "INSERT INTO aspnet_UsersInRoles (UserId, RoleId) VALUES (@u, @r)", con);
                ins.Parameters.AddWithValue("@u", (Guid)userId);
                ins.Parameters.AddWithValue("@r", (Guid)roleId);
                await ins.ExecuteNonQueryAsync();

                return Ok(new { success = true, message = $"User '{userName}' added to role '{req.RoleName}'." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error assigning role");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>DELETE remove user from role</summary>
        [HttpDelete("users/{userName}/roles/{roleName}")]
        public async Task<ActionResult> RemoveUserFromRole(string userName, string roleName)
        {
            try
            {
                using var con = CreateConnection();
                await con.OpenAsync();
                var appId = await GetAppIdAsync(con);

                using var del = new SqlCommand(@"
                    DELETE FROM aspnet_UsersInRoles
                    WHERE UserId = (SELECT UserId FROM aspnet_Users WHERE UserName = @u)
                      AND RoleId = (SELECT RoleId FROM aspnet_Roles WHERE LoweredRoleName = @r AND ApplicationId = @a)", con);
                del.Parameters.AddWithValue("@u", userName);
                del.Parameters.AddWithValue("@r", roleName.ToLower());
                del.Parameters.AddWithValue("@a", appId);
                var rows = await del.ExecuteNonQueryAsync();
                if (rows == 0)
                    return NotFound(new { success = false, message = "User/role combination not found." });

                return Ok(new { success = true, message = $"User '{userName}' removed from role '{roleName}'." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing user from role");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>GET users belonging to a specific role</summary>
        [HttpGet("{roleName}/users")]
        public async Task<ActionResult> GetUsersInRole(string roleName)
        {
            try
            {
                using var con = CreateConnection();
                await con.OpenAsync();
                var appId = await GetAppIdAsync(con);

                var sql = @"
                    SELECT u.UserName,
                           ISNULL(r.Name,  '')  AS FullName,
                           ISNULL(r.Phone, '')  AS Phone,
                           l.Category,
                           ISNULL(i.InstitutionName,'') AS InstitutionName
                    FROM aspnet_UsersInRoles ur
                    INNER JOIN aspnet_Roles ro  ON ur.RoleId = ro.RoleId
                    INNER JOIN aspnet_Users u   ON ur.UserId = u.UserId
                    LEFT  JOIN LIU l            ON u.UserName = l.UserName
                    LEFT  JOIN Registration r   ON l.RegistrationID = r.RegistrationID
                    LEFT  JOIN Institution i    ON l.InstitutionID  = i.InstitutionID
                    WHERE ro.LoweredRoleName = @rn AND ro.ApplicationId = @a
                    ORDER BY u.UserName";

                using var cmd = new SqlCommand(sql, con);
                cmd.Parameters.AddWithValue("@rn", roleName.ToLower());
                cmd.Parameters.AddWithValue("@a",  appId);

                var list = new List<object>();
                using var rdr = await cmd.ExecuteReaderAsync();
                while (await rdr.ReadAsync())
                {
                    list.Add(new
                    {
                        userName        = rdr["UserName"]?.ToString() ?? "",
                        fullName        = rdr["FullName"]?.ToString() ?? "",
                        phone           = rdr["Phone"]?.ToString() ?? "",
                        category        = rdr["Category"]?.ToString() ?? "",
                        institutionName = rdr["InstitutionName"]?.ToString() ?? ""
                    });
                }
                return Ok(new { success = true, data = list });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users in role");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }

    public class RoleNameRequest
    {
        public string RoleName { get; set; } = "";
    }
}
