using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using TailorBD.API.BackgroundServices;
using TailorBD.API.Data;
using TailorBD.API.Middleware;
using TailorBD.API.Services;

var builder = WebApplication.CreateBuilder(args);

// ── Controllers ──────────────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

// ── Session ───────────────────────────────────────────────────────────────
builder.Services.AddDistributedMemoryCache();
builder.Services.AddMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromHours(8);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
    options.Cookie.Name = ".TailorBD.Session";
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
});

// ── JWT Authentication ────────────────────────────────────────────────────
var jwtKey     = builder.Configuration["Jwt:Key"]      ?? throw new InvalidOperationException("Jwt:Key not configured");
var jwtIssuer  = builder.Configuration["Jwt:Issuer"]   ?? "TailorBD.API";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "TailorBD.Client";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer           = true,
        ValidIssuer              = jwtIssuer,
        ValidateAudience         = true,
        ValidAudience            = jwtAudience,
        ValidateLifetime         = true,
        ClockSkew                = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// ── CORS — restrict to configured domains ────────────────────────────────
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5000", "https://localhost:5001" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("RestrictedCors", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// ── Rate Limiting — শুধু login endpoint এ, global limiter নেই ───────────
var loginLimit  = builder.Configuration.GetValue("RateLimit:LoginPermitLimit",  5);
var loginWindow = builder.Configuration.GetValue("RateLimit:LoginWindowSeconds", 60);

builder.Services.AddRateLimiter(limiter =>
{
    // Login endpoint: max 5 requests / 60 sec per IP
    limiter.AddFixedWindowLimiter("login", opt =>
    {
        opt.PermitLimit          = loginLimit;
        opt.Window               = TimeSpan.FromSeconds(loginWindow);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit           = 0;
    });

    limiter.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.HttpContext.Response.WriteAsJsonAsync(
            new { success = false, message = "অনেক বেশি request। কিছুক্ষণ পরে আবার চেষ্টা করুন।" }, token);
    };
});

// ── Swagger with JWT Bearer support ──────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title       = "TailorBD API",
        Version     = "v1",
        Description = "API for TailorBD Management System",
        Contact     = new OpenApiContact { Name = "TailorBD Support", Email = "support@tailorbd.com" }
    });

    // JWT authorization in Swagger UI
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name         = "Authorization",
        Type         = SecuritySchemeType.Http,
        Scheme       = "bearer",
        BearerFormat = "JWT",
        In           = ParameterLocation.Header,
        Description  = "JWT token লিখুন। Example: Bearer eyJhbGci..."
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// ── Application Services ──────────────────────────────────────────────────
builder.Services.AddSingleton<TailorBdContext>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IDressService, DressService>();
builder.Services.AddScoped<IProfileService, ProfileService>();
builder.Services.AddScoped<IInstitutionService, InstitutionService>();
builder.Services.AddScoped<IInvoiceBillingService, InvoiceBillingService>();

// ── ShurjoPay Online Payment ──────────────────────────────────────────────
var spOpt = builder.Configuration.GetSection("ShurjoPay").Get<ShurjoPayOptions>()
    ?? new ShurjoPayOptions();
builder.Services.AddSingleton(spOpt);
builder.Services.AddHttpClient("ShurjoPay", c =>
{
    c.BaseAddress = new Uri(spOpt.BaseUrl.TrimEnd('/'));
    c.DefaultRequestHeaders.Add("Accept", "application/json");
    c.Timeout = TimeSpan.FromSeconds(30);
});
builder.Services.AddScoped<IShurjoPayService, ShurjoPayService>();

builder.Services.AddHostedService<InvoiceAutoGenerateService>();

// ═════════════════════════════════════════════════════════════════════════
var app = builder.Build();
// ═════════════════════════════════════════════════════════════════════════

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "TailorBD API v1");
        c.RoutePrefix = "swagger";
    });
}
else
{
    app.UseHttpsRedirection();
}

// ── Rate Limiting (before CORS/Auth) ─────────────────────────────────────
app.UseRateLimiter();

// ── CORS ──────────────────────────────────────────────────────────────────
app.UseCors("RestrictedCors");

// ── URL Masking — /dashboard → /dashboard.html (hide .html extension) ────
app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value ?? "/";

    // শুধুমাত্র root-level clean URLs (কোনো extension নেই, API নয়)
    if (!path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase) &&
        !path.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase) &&
        !Path.HasExtension(path) &&
        path != "/")
    {
        var htmlPath = path.TrimEnd('/') + ".html";
        var fileProvider = app.Environment.WebRootFileProvider;
        var fileInfo = fileProvider.GetFileInfo(htmlPath);

        if (fileInfo.Exists)
        {
            context.Request.Path = htmlPath;
        }
    }

    await next();
});

// ── Static files ──────────────────────────────────────────────────────────
var defaultFilesOptions = new DefaultFilesOptions();
defaultFilesOptions.DefaultFileNames.Clear();
defaultFilesOptions.DefaultFileNames.Add("index.html");
app.UseDefaultFiles(defaultFilesOptions);

if (app.Environment.IsDevelopment())
{
    app.UseStaticFiles(new StaticFileOptions
    {
        OnPrepareResponse = ctx =>
        {
            ctx.Context.Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
            ctx.Context.Response.Headers["Pragma"]  = "no-cache";
            ctx.Context.Response.Headers["Expires"] = "0";
        }
    });
}
else
{
    app.UseStaticFiles();
}

// ── Session → Authentication → Authorization ──────────────────────────────
app.UseSession();
app.UseAuthentication();
app.UseAuthorization();

// ── Page access check (HTML pages only) ──────────────────────────────────
app.UseMiddleware<PageAccessMiddleware>();

app.MapControllers();

app.Run();
