using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Dapper;
using TailorBD.API.Data;
using TailorBD.API.Helpers;
using TailorBD.API.Models;
using TailorBD.API.Services;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly TailorBdContext _context;
        private readonly IJwtTokenService _jwt;

        public AuthController(TailorBdContext context, IJwtTokenService jwt)
        {
            _context = context;
            _jwt     = jwt;
        }

        // POST: api/Auth/login
        [HttpPost("login")]
        [EnableRateLimiting("login")]
        public IActionResult Login([FromBody] LoginRequest model)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, message = "অনুগ্রহ করে সঠিক তথ্য দিন", errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });

            try
            {
                using var connection = _context.CreateConnection();

                // ── Step 1: LIU table (Admin / Sub-Admin) ──────────────────
                const string liuQuery = @"
                    SELECT
                        l.LIUID,
                        l.RegistrationID,
                        l.InstitutionID,
                        l.UserName,
                        l.Password,
                        l.Category,
                        r.Name,
                        r.Validation,
                        i.InstitutionName
                    FROM LIU l
                    INNER JOIN Registration r ON l.RegistrationID = r.RegistrationID
                    LEFT JOIN Institution i ON l.InstitutionID = i.InstitutionID
                    WHERE l.UserName = @Username";

                var user = connection.QueryFirstOrDefault<LiuUserData>(liuQuery, new { Username = model.Username });

                if (user != null)
                {
                    if (user.Validation == "Invalid")
                        return Ok(new { success = false, message = "আপনার অ্যাকাউন্ট এখনো অনুমোদিত হয়নি। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।" });

                    // BCrypt hash or legacy plain-text
                    bool passwordValid = PasswordHelper.IsPlainText(user.Password)
                        ? user.Password == model.Password
                        : PasswordHelper.VerifyPassword(model.Password, user.Password);

                    if (!passwordValid)
                        return Ok(new { success = false, message = "ভুল ইউজারনেম বা পাসওয়ার্ড" });

                    // ── On-the-fly migration: plain → BCrypt ──
                    if (PasswordHelper.IsPlainText(user.Password))
                    {
                        var hashed = PasswordHelper.HashPassword(model.Password);
                        connection.Execute(
                            "UPDATE LIU SET Password = @Hash WHERE LIUID = @Id",
                            new { Hash = hashed, Id = user.LIUID });
                    }

                    // Session (backward compat — kept for PageAccessMiddleware)
                    HttpContext.Session.SetString("username",       user.UserName);
                    HttpContext.Session.SetString("registrationId", user.RegistrationID.ToString());
                    HttpContext.Session.SetString("institutionId",  user.InstitutionID.ToString());
                    HttpContext.Session.SetString("category",       user.Category ?? "User");
                    HttpContext.Session.SetString("name",           user.Name ?? user.UserName);

                    var token = _jwt.GenerateToken(
                        user.RegistrationID, user.InstitutionID,
                        user.UserName, user.Category ?? "User",
                        user.Name ?? user.UserName);

                    return Ok(new
                    {
                        success = true,
                        message = "লগইন সফল!",
                        token,
                        data = new
                        {
                            username       = user.UserName,
                            registrationId = user.RegistrationID,
                            institutionId  = user.InstitutionID,
                            institutionName= user.InstitutionName ?? "",
                            name           = user.Name ?? user.UserName,
                            category       = user.Category ?? "User"
                        }
                    });
                }

                // ── Step 2: Authority (aspnet_Membership SHA1) ─────────────
                const string authorityQuery = @"
                    SELECT
                        r.RegistrationID,
                        0 AS InstitutionID,
                        r.UserName,
                        r.Validation,
                        r.Name,
                        r.Category,
                        m.Password,
                        m.PasswordFormat,
                        m.PasswordSalt,
                        '' AS InstitutionName
                    FROM Registration r
                    INNER JOIN aspnet_Users u ON r.UserName = u.UserName
                    INNER JOIN aspnet_Membership m ON u.UserId = m.UserId
                    WHERE r.UserName = @Username AND r.Category = 'Authority'";

                var authority = connection.QueryFirstOrDefault<AuthorityData>(authorityQuery, new { Username = model.Username });

                if (authority == null)
                    return Ok(new { success = false, message = "ভুল ইউজারনেম বা পাসওয়ার্ড" });

                bool authPasswordValid = VerifyMembershipPassword(
                    model.Password, authority.Password, authority.PasswordSalt, authority.PasswordFormat);

                if (!authPasswordValid)
                    return Ok(new { success = false, message = "ভুল ইউজারনেম বা পাসওয়ার্ড" });

                HttpContext.Session.SetString("username",       authority.UserName);
                HttpContext.Session.SetString("registrationId", authority.RegistrationID.ToString());
                HttpContext.Session.SetString("institutionId",  "0");
                HttpContext.Session.SetString("category",       "Authority");
                HttpContext.Session.SetString("name",           authority.Name ?? authority.UserName);

                var authToken = _jwt.GenerateToken(
                    authority.RegistrationID, 0,
                    authority.UserName, "Authority",
                    authority.Name ?? authority.UserName);

                return Ok(new
                {
                    success = true,
                    message = "লগইন সফল!",
                    token   = authToken,
                    data    = new
                    {
                        username       = authority.UserName,
                        registrationId = authority.RegistrationID,
                        institutionId  = 0,
                        institutionName= "",
                        name           = authority.Name ?? authority.UserName,
                        category       = "Authority"
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "সার্ভারে সমস্যা হয়েছে, পরে চেষ্টা করুন" });
            }
        }

        // POST: api/Auth/logout
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            HttpContext.Session.Clear();
            return Ok(new { success = true, message = "Logged out successfully" });
        }

        // GET: api/Auth/check-session
        [HttpGet("check-session")]
        public IActionResult CheckSession()
        {
            var username = HttpContext.Session.GetString("username");
            if (string.IsNullOrEmpty(username))
                return Ok(new { success = false, message = "No active session" });

            return Ok(new
            {
                success = true,
                data = new
                {
                    username       = username,
                    registrationId = HttpContext.Session.GetString("registrationId"),
                    institutionId  = HttpContext.Session.GetString("institutionId"),
                    category       = HttpContext.Session.GetString("category"),
                    name           = HttpContext.Session.GetString("name")
                }
            });
        }

        // POST: api/Auth/change-password
        [HttpPost("change-password")]
        [Authorize]
        public IActionResult ChangePassword([FromBody] ChangePasswordRequest model)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, message = "অনুগ্রহ করে সঠিক তথ্য দিন" });

            try
            {
                using var connection = _context.CreateConnection();

                // Parameterized query — শুধু username ও hash নিয়ে কাজ
                var user = connection.QueryFirstOrDefault<LiuUserData>(
                    "SELECT LIUID, Password FROM LIU WHERE UserName = @Username",
                    new { Username = model.Username });

                if (user == null)
                    return Ok(new { success = false, message = "ইউজার পাওয়া যায়নি" });

                // BCrypt বা legacy plain-text দুটোই handle করি
                bool currentValid = PasswordHelper.IsPlainText(user.Password)
                    ? user.Password == model.CurrentPassword
                    : PasswordHelper.VerifyPassword(model.CurrentPassword, user.Password);

                if (!currentValid)
                    return Ok(new { success = false, message = "বর্তমান পাসওয়ার্ড সঠিক নয়" });

                var newHash = PasswordHelper.HashPassword(model.NewPassword);

                connection.Execute(
                    "UPDATE LIU SET Password = @Hash WHERE LIUID = @Id",
                    new { Hash = newHash, Id = user.LIUID });

                return Ok(new { success = true, message = "পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!" });
            }
            catch (Exception)
            {
                return StatusCode(500, new { success = false, message = "সার্ভারে সমস্যা হয়েছে" });
            }
        }

        // ── ASP.NET Membership SHA1 verify (Authority accounts) ──────────
        private static bool VerifyMembershipPassword(string input, string stored, string salt, int format)
        {
            try
            {
                if (format == 0) return input == stored;           // Clear

                if (format == 1)                                   // Hashed (SHA1)
                {
                    byte[] saltBytes  = Convert.FromBase64String(salt);
                    byte[] inputBytes = System.Text.Encoding.Unicode.GetBytes(input);
                    byte[] combined   = new byte[saltBytes.Length + inputBytes.Length];
                    Buffer.BlockCopy(saltBytes, 0, combined, 0, saltBytes.Length);
                    Buffer.BlockCopy(inputBytes, 0, combined, saltBytes.Length, inputBytes.Length);

                    using var sha1 = System.Security.Cryptography.SHA1.Create();
                    return Convert.ToBase64String(sha1.ComputeHash(combined)) == stored;
                }

                return false; // Encrypted — not supported
            }
            catch { return false; }
        }
    }

    // ── Data models (controller-internal) ────────────────────────────────
    public class LiuUserData
    {
        public int    LIUID          { get; set; }
        public int    RegistrationID { get; set; }
        public int    InstitutionID  { get; set; }
        public string UserName       { get; set; } = string.Empty;
        public string Password       { get; set; } = string.Empty;
        public string? Category      { get; set; }
        public string? Name          { get; set; }
        public string? Validation    { get; set; }
        public string? InstitutionName { get; set; }
    }

    public class AuthorityData
    {
        public int    RegistrationID  { get; set; }
        public int    InstitutionID   { get; set; }
        public string UserName        { get; set; } = string.Empty;
        public string? Validation     { get; set; }
        public string? Name           { get; set; }
        public string? Category       { get; set; }
        public string Password        { get; set; } = string.Empty;
        public string PasswordSalt    { get; set; } = string.Empty;
        public int    PasswordFormat  { get; set; }
        public string? InstitutionName { get; set; }
    }
}
