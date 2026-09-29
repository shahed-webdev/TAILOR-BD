using System.Data.SqlClient;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TailorBD.API.Data;
using TailorBD.API.Helpers;
using TailorBD.API.Services;

namespace TailorBD.API.Controllers
{
    /// <summary>
    /// Shop Page Access: the Authority switches off menu pages for a shop's main admin (and so for its
    /// sub-admins). Stored as a deny list in dbo.ShopPageBlock; no rows = every page allowed.
    ///  - GET  api/shop-page-access/my            shop login: pages refused for my shop (menu hiding)
    ///  - GET  api/shop-page-access/catalog       Authority: the page list grouped like the shop menu
    ///  - GET  api/shop-page-access/shops         Authority: shop search (with number of blocked pages)
    ///  - GET  api/shop-page-access/{id}          Authority: blocked pages of one shop
    ///  - PUT  api/shop-page-access/{id}          Authority: save the blocked pages of one shop
    /// Sub-Authority may use the Authority endpoints only when the Authority gave them the
    /// "shop-page-access" page (SubAuthorityPageAccess, same as the other owner-panel pages).
    /// </summary>
    [Route("api/shop-page-access")]
    [ApiController]
    public class ShopPageAccessController : ControllerBase
    {
        public const string SubAuthorityPageKey = "shop-page-access";

        private readonly TailorBdContext _context;
        private readonly ShopPageAccessService _access;

        public ShopPageAccessController(TailorBdContext context, ShopPageAccessService access)
        {
            _context = context;
            _access = access;
        }

        // ── Shop side ─────────────────────────────────────────────────────────
        [Authorize]
        [ShopScoped]
        [HttpGet("my")]
        public async Task<IActionResult> My(int institutionId)
        {
            var stored = await _access.GetBlockedAsync(institutionId);
            var blocked = ShopPageCatalog.Effective(stored).OrderBy(k => k).ToList();
            return Ok(new { success = true, institutionId, blockedPages = stored, blocked });
        }

        // ── Authority side ────────────────────────────────────────────────────
        [Authorize(Roles = ShopClaims.AuthorityRoles)]
        [HttpGet("catalog")]
        public async Task<IActionResult> Catalog()
        {
            var deny = await DenySubAuthorityWithoutAccessAsync();
            if (deny != null) return deny;
            return Ok(new
            {
                success = true,
                sections = ShopPageCatalog.Sections.Select(s => new
                {
                    s.Key, s.Bn, s.En,
                    pages = s.Pages.Select(p => new { p.Key, p.Bn, p.En })
                }),
                alwaysAllowed = ShopPageCatalog.AlwaysAllowed.OrderBy(k => k)
            });
        }

        [Authorize(Roles = ShopClaims.AuthorityRoles)]
        [HttpGet("shops")]
        public async Task<IActionResult> Shops([FromQuery] string? search = null, [FromQuery] bool restrictedOnly = false)
        {
            var deny = await DenySubAuthorityWithoutAccessAsync();
            if (deny != null) return deny;

            var s = (search ?? "").Trim();
            var p = new
            {
                Like = s.Length == 0 ? null : "%" + s + "%",
                Id = int.TryParse(s, out var n) ? n : (int?)null,
            };
            const string where = @"
                WHERE (@Like IS NULL OR i.InstitutionName LIKE @Like OR i.Phone LIKE @Like OR i.UserName LIKE @Like OR i.InstitutionID = @Id)";
            try
            {
                using var con = _context.CreateConnection();
                bool tableReady = await _access.TableExistsAsync();
                string sql = tableReady
                    ? @"SELECT TOP 100 i.InstitutionID AS institutionId, i.InstitutionName AS institutionName, i.Phone AS phone,
                               i.UserName AS userName, i.Validation AS validation, ISNULL(b.Cnt, 0) AS blockedCount
                        FROM Institution i
                        LEFT JOIN (SELECT InstitutionID, COUNT(*) AS Cnt FROM dbo.ShopPageBlock GROUP BY InstitutionID) b
                               ON b.InstitutionID = i.InstitutionID" + where +
                      (restrictedOnly ? " AND b.Cnt > 0" : "") + @"
                        ORDER BY CASE WHEN ISNULL(b.Cnt, 0) > 0 THEN 0 ELSE 1 END, i.InstitutionName"
                    : @"SELECT TOP 100 i.InstitutionID AS institutionId, i.InstitutionName AS institutionName, i.Phone AS phone,
                               i.UserName AS userName, i.Validation AS validation, 0 AS blockedCount
                        FROM Institution i" + where + (restrictedOnly ? " AND 1 = 0" : "") + @"
                        ORDER BY i.InstitutionName";
                var rows = (await con.QueryAsync(sql, p)).ToList();
                return Ok(new { success = true, tableReady, data = rows });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [Authorize(Roles = ShopClaims.AuthorityRoles)]
        [HttpGet("{institutionId:int}")]
        public async Task<IActionResult> Get(int institutionId)
        {
            var deny = await DenySubAuthorityWithoutAccessAsync();
            if (deny != null) return deny;

            using var con = _context.CreateConnection();
            var shop = await con.QueryFirstOrDefaultAsync(
                "SELECT InstitutionID AS institutionId, InstitutionName AS institutionName, Phone AS phone, UserName AS userName, Validation AS validation FROM Institution WHERE InstitutionID = @I",
                new { I = institutionId });
            if (shop == null) return NotFound(new { success = false, message = "প্রতিষ্ঠান পাওয়া যায়নি" });

            bool tableReady = await _access.TableExistsAsync();
            _access.Invalidate(institutionId); // Authority always sees the saved state
            var blockedPages = tableReady ? await _access.GetBlockedAsync(institutionId) : Array.Empty<string>();
            return Ok(new { success = true, tableReady, shop, blockedPages });
        }

        [Authorize(Roles = ShopClaims.AuthorityRoles)]
        [HttpPut("{institutionId:int}")]
        public async Task<IActionResult> Save(int institutionId, [FromBody] ShopPageBlockSaveModel model)
        {
            var deny = await DenySubAuthorityWithoutAccessAsync();
            if (deny != null) return deny;

            var keys = (model?.BlockedPages ?? new List<string>())
                .Select(ShopPageCatalog.Normalize)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
            var invalid = keys.Where(k => !ShopPageCatalog.BlockableKeys.Contains(k)).ToList();
            if (invalid.Count > 0)
                return BadRequest(new { success = false, message = "এই পেজগুলো বন্ধ করা যায় না: " + string.Join(", ", invalid), invalid });

            using (var con = _context.CreateConnection())
            {
                var exists = await con.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM Institution WHERE InstitutionID = @I", new { I = institutionId });
                if (exists == 0) return NotFound(new { success = false, message = "প্রতিষ্ঠান পাওয়া যায়নি" });
            }
            if (!await _access.TableExistsAsync())
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new
                {
                    success = false,
                    message = "ডাটাবেজে ShopPageBlock টেবিল নেই। Database\\ShopPageAccess\\02_create.sql চালান। (Run 02_create.sql first.)"
                });

            await _access.SaveAsync(institutionId, keys, User.GetRegistrationId());
            return Ok(new
            {
                success = true,
                message = keys.Count == 0 ? "সব পেজ চালু করা হয়েছে" : $"{keys.Count}টি পেজ বন্ধ করা হয়েছে",
                blockedPages = keys
            });
        }

        /// <summary>Authority: always. Sub-Authority: only with the "shop-page-access" page given by the Authority.</summary>
        private async Task<IActionResult?> DenySubAuthorityWithoutAccessAsync()
        {
            if (User.IsInRole("Authority")) return null;
            try
            {
                using var con = _context.CreateConnection();
                var ok = await con.ExecuteScalarAsync<int>(
                    "SELECT COUNT(*) FROM SubAuthorityPageAccess WHERE SubRegID = @R AND PageKey = @K AND IsAccess = 1",
                    new { R = User.GetRegistrationId(), K = SubAuthorityPageKey });
                if (ok > 0) return null;
            }
            catch (SqlException) { /* table missing => no access */ }
            return StatusCode(StatusCodes.Status403Forbidden, new { success = false, message = "এই পেজের অনুমতি নেই (Sub-Authority)" });
        }
    }

    public class ShopPageBlockSaveModel
    {
        /// <summary>Menu page keys to switch OFF for the shop (e.g. "/cutting-issue.html"). Empty = all pages on.</summary>
        public List<string>? BlockedPages { get; set; }
    }
}
