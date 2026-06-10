using Microsoft.AspNetCore.Http;
using System.Data.SqlClient;
using Dapper;
using TailorBD.API.Data;
using Microsoft.Extensions.Caching.Memory;

namespace TailorBD.API.Middleware
{
    public class PageAccessMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly TailorBdContext _context;
        private readonly IMemoryCache _cache;

        // All paths that should bypass access checks entirely
        private static readonly HashSet<string> _exactBypass = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "/",
            "/index.html",
            "/index",
            "/login.html",
            "/login",
            "/access-denied.html",
            "/access-denied",
            "/dashboard.html",
            "/dashboard",
            "/sub-admin-dashboard.html",
            "/sub-admin-dashboard",
            "/authority-profile.html",
            "/authority-profile",
            "/authority-package.html",
            "/authority-package",
        };

        private static readonly string[] _prefixBypass = new[]
        {
            "/api/",
            "/css/",
            "/js/",
            "/images/",
            "/components/",
            "/lib/",
            "/fonts/",
            "/swagger",
        };

        // Static file extensions — never need auth checks
        private static readonly HashSet<string> _staticExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            ".css", ".js", ".map", ".ico", ".png", ".jpg", ".jpeg",
            ".gif", ".svg", ".woff", ".woff2", ".ttf", ".eot",
            ".webp", ".avif", ".json", ".xml", ".txt",
        };

        // Order-list row actions — inherit access from order entry pages (legacy behaviour)
        private static readonly HashSet<string> _orderWorkflowPages = new(StringComparer.OrdinalIgnoreCase)
        {
            "update-order.html",
            "add-more-dress.html",
            "order-edit.html",
            "money-receipt.html",
            "finish-order.html",
            "dress-measurements.html"
        };

        // Customer-list row actions — inherit access from customer pages (legacy behaviour)
        private static readonly HashSet<string> _customerWorkflowPages = new(StringComparer.OrdinalIgnoreCase)
        {
            "customer-details.html",
            "customer-measurement-print.html",
            "dress-measurements.html"
        };

        public PageAccessMiddleware(RequestDelegate next, TailorBdContext context, IMemoryCache cache)
        {
            _next = next;
            _context = context;
            _cache = cache;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var path = context.Request.Path.Value ?? "/";

            // Fast-path 1: known exact public paths
            if (_exactBypass.Contains(path))
            {
                await _next(context);
                return;
            }

            // Fast-path 2: known public path prefixes
            foreach (var prefix in _prefixBypass)
            {
                if (path.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                {
                    await _next(context);
                    return;
                }
            }

            // Fast-path 3: any static file extension — never needs auth
            var ext = Path.GetExtension(path);
            if (!string.IsNullOrEmpty(ext) && _staticExtensions.Contains(ext))
            {
                await _next(context);
                return;
            }

            // Only .html pages (or bare paths) reach here
            var username     = context.Session.GetString("username");
            var registrationId = context.Session.GetString("registrationId");
            var institutionId  = context.Session.GetString("institutionId");
            var userCategory   = context.Session.GetString("category");

            if (string.IsNullOrEmpty(username))
            {
                context.Response.Redirect("/login.html");
                return;
            }

            // Admin and Authority have full access — no DB query needed
            if (userCategory == "Admin" || userCategory == "Authority")
            {
                await _next(context);
                return;
            }

            // Check Sub-Admin access with caching
            if (userCategory == "Sub-Admin")
            {
                var normalizedPath = path.TrimStart('/').ToLower();
                var cacheKey = $"page_access_{registrationId}_{institutionId}_{normalizedPath}";

                if (!_cache.TryGetValue(cacheKey, out bool hasAccess))
                {
                    hasAccess = await CheckPageAccess(
                        int.Parse(institutionId!),
                        int.Parse(registrationId!),
                        normalizedPath
                    );
                    _cache.Set(cacheKey, hasAccess, TimeSpan.FromMinutes(5));
                }

                if (!hasAccess)
                {
                    context.Response.Redirect("/access-denied.html");
                    return;
                }
            }

            await _next(context);
        }

        private async Task<bool> CheckPageAccess(int institutionId, int registrationId, string pagePath)
        {
            try
            {
                using var connection = _context.CreateConnection();

                var query = @"
                    SELECT COUNT(*)
                    FROM Link_Users LU
                    INNER JOIN Link_Pages LP ON LU.LinkID = LP.LinkID
                    WHERE LU.InstitutionID = @InstitutionID 
                    AND LU.RegistrationID = @RegistrationID
                    AND (
                        LOWER(LP.PageURL) LIKE '%' + @PagePath + '%'
                        OR LOWER(LP.Location) LIKE '%' + @PagePath + '%'
                        OR @PagePath LIKE '%' + LOWER(LP.PageURL) + '%'
                        OR LOWER(LP.PageURL) LIKE '%' + @PageKey + '%'
                    )";

                var pageKey = pagePath
                    .Replace(".html", "", StringComparison.OrdinalIgnoreCase)
                    .Replace("-", "")
                    .Replace("_", "");

                var count = await connection.ExecuteScalarAsync<int>(query, new {
                    InstitutionID = institutionId,
                    RegistrationID = registrationId,
                    PagePath = pagePath,
                    PageKey = pageKey
                });

                if (count > 0) return true;

                if (_orderWorkflowPages.Contains(pagePath))
                {
                    return await HasOrderEntryAccess(connection, institutionId, registrationId);
                }

                if (_customerWorkflowPages.Contains(pagePath))
                {
                    return await HasCustomerEntryAccess(connection, institutionId, registrationId);
                }

                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error checking page access: {ex.Message}");
                return false;
            }
        }

        private static async Task<bool> HasOrderEntryAccess(System.Data.IDbConnection connection, int institutionId, int registrationId)
        {
            const string orderEntryQuery = @"
                SELECT COUNT(*)
                FROM Link_Users LU
                INNER JOIN Link_Pages LP ON LU.LinkID = LP.LinkID
                WHERE LU.InstitutionID = @InstitutionID
                  AND LU.RegistrationID = @RegistrationID
                  AND (
                      LOWER(LP.PageURL) LIKE '%ordrlist%'
                      OR LOWER(LP.PageURL) LIKE '%order_list%'
                      OR LOWER(LP.PageURL) LIKE '%new_order%'
                      OR LOWER(LP.PageURL) LIKE '%quick_order%'
                      OR LOWER(LP.PageURL) LIKE '%moneyreceipt%'
                      OR LOWER(LP.PageURL) LIKE '%/order.aspx%'
                  )";

            var count = await connection.ExecuteScalarAsync<int>(orderEntryQuery, new {
                InstitutionID = institutionId,
                RegistrationID = registrationId
            });

            return count > 0;
        }

        private static async Task<bool> HasCustomerEntryAccess(System.Data.IDbConnection connection, int institutionId, int registrationId)
        {
            const string customerEntryQuery = @"
                SELECT COUNT(*)
                FROM Link_Users LU
                INNER JOIN Link_Pages LP ON LU.LinkID = LP.LinkID
                WHERE LU.InstitutionID = @InstitutionID
                  AND LU.RegistrationID = @RegistrationID
                  AND (
                      LOWER(LP.PageURL) LIKE '%customerlist%'
                      OR LOWER(LP.PageURL) LIKE '%customer_list%'
                      OR LOWER(LP.PageURL) LIKE '%add_customer%'
                      OR LOWER(LP.PageURL) LIKE '%addcustomermesurement%'
                  )";

            var count = await connection.ExecuteScalarAsync<int>(customerEntryQuery, new {
                InstitutionID = institutionId,
                RegistrationID = registrationId
            });

            return count > 0;
        }
    }
}
