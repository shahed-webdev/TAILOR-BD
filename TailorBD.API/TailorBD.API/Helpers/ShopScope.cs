using System.Reflection;
using System.Security.Claims;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using TailorBD.API.Data;

namespace TailorBD.API.Helpers
{
    /// <summary>
    /// Reads the shop (institution) and user of the caller from the JWT that
    /// AuthController.Login issues (claims "institutionId" and NameIdentifier = RegistrationID).
    /// </summary>
    public static class ShopClaims
    {
        public const string InstitutionClaim = "institutionId";

        /// <summary>Roles (JWT role claim = login Category) of the owner panel: use in [Authorize(Roles = ...)].</summary>
        public const string AuthorityRoles = "Authority,Sub-Authority";
        /// <summary>Only the main Authority account (maintenance / debug endpoints).</summary>
        public const string AuthorityOnly = "Authority";

        /// <summary>True for Authority and Sub-Authority logins (owner panel, not a shop).</summary>
        public static bool IsAuthority(this ClaimsPrincipal? user)
            => user != null && (user.IsInRole("Authority") || user.IsInRole("Sub-Authority"));

        public static int GetInstitutionId(this ClaimsPrincipal? user)
            => ParseClaim(user, InstitutionClaim);

        public static int GetRegistrationId(this ClaimsPrincipal? user)
        {
            // The JWT handler maps "nameid" to ClaimTypes.NameIdentifier by default;
            // read the raw names as well in case inbound mapping is switched off.
            int id = ParseClaim(user, ClaimTypes.NameIdentifier);
            if (id <= 0) id = ParseClaim(user, "nameid");
            if (id <= 0) id = ParseClaim(user, "sub");
            return id;
        }

        private static int ParseClaim(ClaimsPrincipal? user, string type)
        {
            var v = user?.FindFirst(type)?.Value;
            return int.TryParse(v, out var n) ? n : 0;
        }
    }

    /// <summary>
    /// Shop scoping for API controllers (use together with [Authorize]).
    /// Before the action runs it takes InstitutionID / RegistrationID from the
    /// logged-in user's token and overwrites whatever the client sent:
    ///  - int action parameters named "institutionId" / "registrationId";
    ///  - int properties "InstitutionID" / "RegistrationID" on body models.
    /// Queries that filter by InstitutionID therefore only ever see the caller's
    /// own shop, even if a different id is put in the query string or JSON body.
    /// A user without a shop (e.g. Authority, institutionId 0) gets 403. Authority /
    /// Sub-Authority logins also get 403 (a Sub-Authority's institutionId claim is its
    /// Authority's RegistrationID, not a shop), unless AllowAuthority = true: then they
    /// pass through unscoped (owner panel may look at any shop).
    /// Actions marked [AllowAnonymous] (e.g. images used in &lt;img&gt; tags) stay open
    /// without a token; when a token IS sent they are still scoped to its shop.
    /// Body lists (e.g. List&lt;SerialUpdate&gt;) get the shop set on every item.
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, Inherited = true)]
    public sealed class ShopScopedAttribute : Attribute, IAsyncActionFilter
    {
        public const string InstitutionItemKey = "ShopScope.InstitutionID";
        public const string RegistrationItemKey = "ShopScope.RegistrationID";

        /// <summary>Let Authority / Sub-Authority logins through without shop scoping.</summary>
        public bool AllowAuthority { get; set; }

        public async Task OnActionExecutionAsync(ActionExecutingContext ctx, ActionExecutionDelegate next)
        {
            var user = ctx.HttpContext.User;
            if (user?.Identity?.IsAuthenticated != true)
            {
                if (ctx.ActionDescriptor.EndpointMetadata.OfType<IAllowAnonymous>().Any())
                {
                    await next();
                    return;
                }
                ctx.Result = new UnauthorizedObjectResult(new { success = false, message = "Login required" });
                return;
            }

            bool isAnonymousAction = ctx.ActionDescriptor.EndpointMetadata.OfType<IAllowAnonymous>().Any();
            if (user.IsAuthority())
            {
                if (AllowAuthority || isAnonymousAction)
                {
                    await next();
                    return;
                }
                ctx.Result = new ObjectResult(new { success = false, message = "This account is not linked to a shop" }) { StatusCode = StatusCodes.Status403Forbidden };
                return;
            }

            int registrationId = user.GetRegistrationId();
            int institutionId = user.GetInstitutionId();

            // Every token issued by AuthController carries the claim. Only if some
            // older/other token lacks it, look the shop up from the user's LIU row.
            if (institutionId <= 0 && registrationId > 0 && !user.HasClaim(c => c.Type == ShopClaims.InstitutionClaim))
                institutionId = await LookupInstitutionAsync(ctx.HttpContext, registrationId);

            if (institutionId <= 0)
            {
                ctx.Result = new ObjectResult(new { success = false, message = "This account is not linked to a shop" }) { StatusCode = StatusCodes.Status403Forbidden };
                return;
            }

            ctx.HttpContext.Items[InstitutionItemKey] = institutionId;
            ctx.HttpContext.Items[RegistrationItemKey] = registrationId;

            foreach (var p in ctx.ActionDescriptor.Parameters)
            {
                if (p.ParameterType == typeof(int) || p.ParameterType == typeof(int?))
                {
                    // Set even when the client did not send it (not bound => would default to 0).
                    if (string.Equals(p.Name, "institutionId", StringComparison.OrdinalIgnoreCase))
                        ctx.ActionArguments[p.Name] = institutionId;
                    else if (string.Equals(p.Name, "registrationId", StringComparison.OrdinalIgnoreCase))
                        ctx.ActionArguments[p.Name] = registrationId;
                }
                else if (ctx.ActionArguments.TryGetValue(p.Name, out var model) && model != null
                         && p.ParameterType.IsClass && p.ParameterType != typeof(string))
                {
                    if (model is System.Collections.IEnumerable items && model is not string)
                    {
                        // e.g. [FromBody] List<DressSerialUpdateModel>: scope every item.
                        foreach (var item in items)
                        {
                            if (item == null) continue;
                            SetIntProperty(item, "InstitutionID", institutionId);
                            SetIntProperty(item, "RegistrationID", registrationId);
                        }
                    }
                    else
                    {
                        SetIntProperty(model, "InstitutionID", institutionId);
                        SetIntProperty(model, "RegistrationID", registrationId);
                    }
                }
            }

            await next();
        }

        private static void SetIntProperty(object model, string name, int value)
        {
            var prop = model.GetType().GetProperty(name, BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
            if (prop != null && prop.CanWrite && (prop.PropertyType == typeof(int) || prop.PropertyType == typeof(int?)))
                prop.SetValue(model, value);
        }

        private static async Task<int> LookupInstitutionAsync(HttpContext http, int registrationId)
        {
            try
            {
                var db = http.RequestServices.GetRequiredService<TailorBdContext>();
                using var con = db.CreateConnection();
                var ids = (await con.QueryAsync<int>(
                    "SELECT DISTINCT InstitutionID FROM LIU WHERE RegistrationID=@R AND InstitutionID > 0",
                    new { R = registrationId })).ToList();
                return ids.Count == 1 ? ids[0] : 0; // ambiguous or none => no shop
            }
            catch
            {
                return 0;
            }
        }
    }

    /// <summary>
    /// "Does this row belong to the caller's shop?" checks, run BEFORE anything is
    /// written so that ids of another shop are refused (404) with nothing changed.
    /// Table / column names are constants from the code, never user input.
    /// </summary>
    public static class ShopOwnership
    {
        /// <summary>True when every id is a row of the table with InstitutionID = institutionId
        /// (and matches extraWhere, e.g. "AND OrderID = @OrderID"). An empty list is true.</summary>
        public static async Task<bool> AllInShopAsync(System.Data.IDbConnection con, string table, string idColumn,
            IEnumerable<int>? ids, int institutionId, string extraWhere = "", object? extra = null,
            System.Data.IDbTransaction? tx = null)
        {
            var list = (ids ?? Enumerable.Empty<int>()).Distinct().ToList();
            if (list.Count == 0) return true;
            if (institutionId <= 0) return false;
            var p = new DynamicParameters();
            if (extra != null) p.AddDynamicParams(extra);
            p.Add("OwnIds", list);
            p.Add("OwnInst", institutionId);
            var found = await con.ExecuteScalarAsync<int>(
                $"SELECT COUNT(DISTINCT {idColumn}) FROM {table} WHERE {idColumn} IN @OwnIds AND InstitutionID = @OwnInst {extraWhere}",
                p, tx);
            return found == list.Count;
        }

        /// <summary>True when the id is a row of the table in the given shop.</summary>
        public static Task<bool> InShopAsync(System.Data.IDbConnection con, string table, string idColumn,
            int id, int institutionId, string extraWhere = "", object? extra = null, System.Data.IDbTransaction? tx = null)
            => AllInShopAsync(con, table, idColumn, new[] { id }, institutionId, extraWhere, extra, tx);
    }
}
