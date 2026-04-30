using Dapper;
using Microsoft.Data.SqlClient;
using TailorBD.API.Models;

namespace TailorBD.API.Services
{
    public interface IProfileService
    {
        Task<ProfileDto?> GetProfileByUsernameAsync(string username);
        Task<ProfileDto?> GetProfileByIdAsync(int registrationId);
        Task<bool> UpdateProfileAsync(int registrationId, UpdateProfileRequest request);
        Task<bool> UpdateProfileImageAsync(int registrationId, byte[] imageData);
    }

    public class ProfileService : IProfileService
    {
        private readonly string _connectionString;

        public ProfileService(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("TailorBDConnectionString")
                ?? throw new ArgumentNullException(nameof(_connectionString));
        }

        public async Task<ProfileDto?> GetProfileByUsernameAsync(string username)
        {
            using var connection = new SqlConnection(_connectionString);
            
            var sql = @"
                SELECT TOP 1 
                    [RegistrationID],
                    [InstitutionID],
                    [UserName],
                    [Validation],
                    [Category],
                    [CreateDate],
                    [Name],
                    [FatherName],
                    [Gender],
                    [Designation],
                    [DateofBirth],
                    [NationalID],
                    [Address],
                    [City],
                    [PostalCode],
                    [Phone],
                    [Email],
                    [Image]
                FROM [Registration]
                WHERE [UserName] = @Username";

            return await connection.QueryFirstOrDefaultAsync<ProfileDto>(sql, new { Username = username });
        }

        public async Task<ProfileDto?> GetProfileByIdAsync(int registrationId)
        {
            using var connection = new SqlConnection(_connectionString);
            
            var sql = @"
                SELECT TOP 1 
                    [RegistrationID],
                    [InstitutionID],
                    [UserName],
                    [Validation],
                    [Category],
                    [CreateDate],
                    [Name],
                    [FatherName],
                    [Gender],
                    [Designation],
                    [DateofBirth],
                    [NationalID],
                    [Address],
                    [City],
                    [PostalCode],
                    [Phone],
                    [Email],
                    [Image]
                FROM [Registration]
                WHERE [RegistrationID] = @RegistrationId";

            return await connection.QueryFirstOrDefaultAsync<ProfileDto>(sql, new { RegistrationId = registrationId });
        }

        public async Task<bool> UpdateProfileAsync(int registrationId, UpdateProfileRequest request)
        {
            using var connection = new SqlConnection(_connectionString);
            
            var sql = @"
                UPDATE [Registration]
                SET 
                    [Name] = @Name,
                    [FatherName] = @FatherName,
                    [Gender] = @Gender,
                    [Designation] = @Designation,
                    [DateofBirth] = @DateofBirth,
                    [NationalID] = @NationalID,
                    [Address] = @Address,
                    [City] = @City,
                    [PostalCode] = @PostalCode,
                    [Phone] = @Phone,
                    [Email] = @Email
                WHERE [RegistrationID] = @RegistrationId";

            var parameters = new
            {
                RegistrationId = registrationId,
                request.Name,
                request.FatherName,
                request.Gender,
                request.Designation,
                request.DateofBirth,
                request.NationalID,
                request.Address,
                request.City,
                request.PostalCode,
                request.Phone,
                request.Email
            };

            var rowsAffected = await connection.ExecuteAsync(sql, parameters);
            return rowsAffected > 0;
        }

        public async Task<bool> UpdateProfileImageAsync(int registrationId, byte[] imageData)
        {
            using var connection = new SqlConnection(_connectionString);
            
            var sql = @"
                UPDATE [Registration]
                SET [Image] = @Image
                WHERE [RegistrationID] = @RegistrationId";

            var rowsAffected = await connection.ExecuteAsync(sql, new { RegistrationId = registrationId, Image = imageData });
            return rowsAffected > 0;
        }
    }
}
