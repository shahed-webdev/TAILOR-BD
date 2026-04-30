using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace TailorBD.API.Services
{
    public interface IJwtTokenService
    {
        string GenerateToken(int registrationId, int institutionId, string username, string category, string name);
        ClaimsPrincipal? ValidateToken(string token);
    }

    public class JwtTokenService : IJwtTokenService
    {
        private readonly IConfiguration _configuration;
        private readonly string _key;
        private readonly string _issuer;
        private readonly string _audience;
        private readonly int _expiryHours;

        public JwtTokenService(IConfiguration configuration)
        {
            _configuration = configuration;
            _key       = _configuration["Jwt:Key"]      ?? throw new InvalidOperationException("JWT Key not configured.");
            _issuer    = _configuration["Jwt:Issuer"]   ?? "TailorBD.API";
            _audience  = _configuration["Jwt:Audience"] ?? "TailorBD.Client";
            _expiryHours = int.TryParse(_configuration["Jwt:ExpiryHours"], out var h) ? h : 8;
        }

        public string GenerateToken(int registrationId, int institutionId, string username, string category, string name)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, registrationId.ToString()),
                new Claim("institutionId",            institutionId.ToString()),
                new Claim(ClaimTypes.Name,            username),
                new Claim(ClaimTypes.Role,            category),
                new Claim("displayName",              name),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Iat,
                    DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(),
                    ClaimValueTypes.Integer64)
            };

            var keyBytes  = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_key));
            var creds     = new SigningCredentials(keyBytes, SecurityAlgorithms.HmacSha256);
            var expiry    = DateTime.UtcNow.AddHours(_expiryHours);

            var token = new JwtSecurityToken(
                issuer:             _issuer,
                audience:           _audience,
                claims:             claims,
                notBefore:          DateTime.UtcNow,
                expires:            expiry,
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public ClaimsPrincipal? ValidateToken(string token)
        {
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var keyBytes = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_key));

                var parameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey         = keyBytes,
                    ValidateIssuer           = true,
                    ValidIssuer              = _issuer,
                    ValidateAudience         = true,
                    ValidAudience            = _audience,
                    ValidateLifetime         = true,
                    ClockSkew                = TimeSpan.Zero
                };

                return handler.ValidateToken(token, parameters, out _);
            }
            catch
            {
                return null;
            }
        }
    }
}
