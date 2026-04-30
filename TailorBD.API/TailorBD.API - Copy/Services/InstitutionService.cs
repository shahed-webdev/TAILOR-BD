using Dapper;
using Microsoft.Data.SqlClient;
using TailorBD.API.Models;

namespace TailorBD.API.Services
{
    public interface IInstitutionService
    {
        Task<InstitutionDto?> GetInstitutionByIdAsync(int institutionId);
        Task<bool> UpdateInstitutionAsync(int institutionId, UpdateInstitutionRequest request);
        Task<bool> UpdateInstitutionLogoAsync(int institutionId, byte[] logoData);
    }

    public class InstitutionService : IInstitutionService
    {
        private readonly string _connectionString;

        public InstitutionService(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("TailorBDConnectionString")
                ?? throw new ArgumentNullException(nameof(_connectionString));
        }

        public async Task<InstitutionDto?> GetInstitutionByIdAsync(int institutionId)
        {
            using var connection = new SqlConnection(_connectionString);
            
            var sql = @"
                SELECT 
                    [InstitutionID],
                    [InstitutionName],
                    [Dialog_Title],
                    [PackageID],
                    [Established],
                    [Staff],
                    [Address],
                    [City],
                    [State],
                    [LocalArea],
                    [PostalCode],
                    [Phone],
                    [Email],
                    [Website],
                    [UserName],
                    [Validation],
                    [Signing_Money],
                    [Renew_Amount],
                    [Expire_Date],
                    [InstitutionLogo],
                    [Date],
                    [TotalOrder],
                    [TotalCustomer]
                FROM [Institution]
                WHERE [InstitutionID] = @InstitutionId";

            return await connection.QueryFirstOrDefaultAsync<InstitutionDto>(sql, new { InstitutionId = institutionId });
        }

        public async Task<bool> UpdateInstitutionAsync(int institutionId, UpdateInstitutionRequest request)
        {
            using var connection = new SqlConnection(_connectionString);
            
            var sql = @"
                UPDATE [Institution]
                SET 
                    [InstitutionName] = @InstitutionName,
                    [Dialog_Title] = @Dialog_Title,
                    [Established] = @Established,
                    [Staff] = @Staff,
                    [Address] = @Address,
                    [City] = @City,
                    [State] = @State,
                    [LocalArea] = @LocalArea,
                    [PostalCode] = @PostalCode,
                    [Phone] = @Phone,
                    [Email] = @Email,
                    [Website] = @Website
                WHERE [InstitutionID] = @InstitutionId";

            var parameters = new
            {
                InstitutionId = institutionId,
                request.InstitutionName,
                request.Dialog_Title,
                request.Established,
                request.Staff,
                request.Address,
                request.City,
                request.State,
                request.LocalArea,
                request.PostalCode,
                request.Phone,
                request.Email,
                request.Website
            };

            var rowsAffected = await connection.ExecuteAsync(sql, parameters);
            return rowsAffected > 0;
        }

        public async Task<bool> UpdateInstitutionLogoAsync(int institutionId, byte[] logoData)
        {
            using var connection = new SqlConnection(_connectionString);
            
            var sql = @"
                UPDATE [Institution]
                SET [InstitutionLogo] = @InstitutionLogo
                WHERE [InstitutionID] = @InstitutionId";

            var rowsAffected = await connection.ExecuteAsync(sql, new { InstitutionId = institutionId, InstitutionLogo = logoData });
            return rowsAffected > 0;
        }
    }
}
