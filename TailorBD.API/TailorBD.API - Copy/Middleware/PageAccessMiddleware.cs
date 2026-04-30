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
                    )";

                var count = await connection.ExecuteScalarAsync<int>(query, new {
                    InstitutionID = institutionId,
                    RegistrationID = registrationId,
                    PagePath = pagePath
                });

                return count > 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error checking page access: {ex.Message}");
                return false;
            }
        }
    }
}
