using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using TailorBD.API.Services;

namespace TailorBD.API.Helpers
{
    /// <summary>
    /// Links an API controller / action to the shop menu page(s) that use it. When the Authority has
    /// switched off ALL of those pages for the caller's shop (Authority panel -> Shop Page Access),
    /// the call is refused with 403. An action-level [ShopPage(...)] replaces the controller-level one;
    /// [ShopPage] with no pages means "not tied to a page" (always allowed).
    /// Only shop logins are checked (institutionId from the token); Authority logins and anonymous
    /// calls are left to [Authorize] / [ShopScoped].
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false, Inherited = true)]
    public sealed class ShopPageAttribute : Attribute, IAsyncActionFilter
    {
        private const string CheckedKey = "ShopPage.Checked";

        public IReadOnlyList<string> Pages { get; }

        public ShopPageAttribute(params string[] pages)
        {
            Pages = pages.Select(ShopPageCatalog.Normalize).ToArray();
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext ctx, ActionExecutionDelegate next)
        {
            // Controller- and action-level attributes both run as filters: check once, with the most specific one.
            if (ctx.HttpContext.Items.ContainsKey(CheckedKey)) { await next(); return; }
            ctx.HttpContext.Items[CheckedKey] = true;

            var effective = ctx.ActionDescriptor.EndpointMetadata.OfType<ShopPageAttribute>().LastOrDefault() ?? this;
            var user = ctx.HttpContext.User;
            if (effective.Pages.Count > 0 && user?.Identity?.IsAuthenticated == true && !user.IsAuthority())
            {
                int institutionId = user.GetInstitutionId();
                if (institutionId > 0)
                {
                    var svc = ctx.HttpContext.RequestServices.GetRequiredService<ShopPageAccessService>();
                    if (await svc.AllBlockedAsync(institutionId, effective.Pages))
                    {
                        ctx.Result = new ObjectResult(new
                        {
                            success = false,
                            pageBlocked = true,
                            message = "এই পেজটি আপনার প্রতিষ্ঠানের জন্য বন্ধ করা আছে। (This page is disabled for your shop.)"
                        }) { StatusCode = StatusCodes.Status403Forbidden };
                        return;
                    }
                }
            }
            await next();
        }
    }
}
