using TailorBD.API.Helpers;
using TailorBD.API.Services;

namespace TailorBD.API.Middleware
{
    /// <summary>
    /// Direct-URL block for shop pages the Authority switched off (Shop Page Access).
    /// Runs before the static-file middleware (HTML pages are static files), after the clean-URL
    /// rewrite (/cutting-issue -> /cutting-issue.html). The shop comes from the server session set
    /// at login (same session PageAccessMiddleware uses). Blocked page -> redirect to /access-denied.html.
    /// Without a session (e.g. after a server restart) the page's own script (app-components.js) and
    /// the API ([ShopPage] -> 403) still refuse it.
    /// </summary>
    public class ShopPageBlockMiddleware
    {
        private readonly RequestDelegate _next;

        public ShopPageBlockMiddleware(RequestDelegate next) => _next = next;

        public async Task InvokeAsync(HttpContext context, ShopPageAccessService access)
        {
            var path = context.Request.Path.Value ?? "";
            if ((HttpMethods.IsGet(context.Request.Method) || HttpMethods.IsHead(context.Request.Method))
                && path.EndsWith(".html", StringComparison.OrdinalIgnoreCase)
                && ShopPageCatalog.IsControlled(path))
            {
                string? category = null, institution = null;
                try
                {
                    category = context.Session.GetString("category");
                    institution = context.Session.GetString("institutionId");
                }
                catch (InvalidOperationException) { /* session not available */ }

                if (category != "Authority" && category != "Sub-Authority"
                    && int.TryParse(institution, out var institutionId) && institutionId > 0)
                {
                    var blocked = await access.GetEffectiveBlockedAsync(institutionId);
                    if (blocked.Contains(ShopPageCatalog.Normalize(path)))
                    {
                        context.Response.Headers["Cache-Control"] = "no-store";
                        context.Response.Redirect("/access-denied.html");
                        return;
                    }
                }
            }
            await _next(context);
        }
    }
}
