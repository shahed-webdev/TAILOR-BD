using Dapper;
using TailorBD.API.Data;
using TailorBD.API.Models;

namespace TailorBD.API.Services
{
    public interface IDressService
    {
        Task<IEnumerable<DressDto>> GetAllDressesAsync(int institutionId, int? clothForId = null, int customerId = 0);
        Task<DressDto?> GetDressByIdAsync(int dressId, int institutionId);
        Task<int> CreateDressAsync(Dress dress);
        Task<bool> UpdateDressAsync(Dress dress);
        Task<bool> DeleteDressAsync(int dressId, int institutionId);
    }

    public class DressService : IDressService
    {
        private readonly TailorBdContext _context;

        public DressService(TailorBdContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<DressDto>> GetAllDressesAsync(int institutionId, int? clothForId = null, int customerId = 0)
        {
            using var connection = _context.CreateConnection();
            var sql = @"
                SELECT 
                    d.DressID, 
                    d.Dress_Name as DressName, 
                    d.Cloth_For_ID as ClothForID,
                    d.DressSerial,
                    CAST(CASE 
                        WHEN @CustomerId > 0 AND EXISTS (
                            SELECT 1 FROM Customer_Measurement cm
                            INNER JOIN Measurement_Type mt ON cm.MeasurementTypeID = mt.MeasurementTypeID
                            WHERE mt.DressID = d.DressID AND cm.CustomerID = @CustomerId
                        ) THEN 1 ELSE 0 
                    END AS BIT) AS IsMeasurementAvailable
                FROM Dress d
                WHERE d.InstitutionID = @InstitutionID 
                AND (@ClothForId IS NULL OR d.Cloth_For_ID = @ClothForId)
                ORDER BY ISNULL(d.DressSerial, 99999), d.Dress_Name";
            
            return await connection.QueryAsync<DressDto>(sql, new { InstitutionID = institutionId, ClothForId = clothForId, CustomerId = customerId });
        }

        public async Task<DressDto?> GetDressByIdAsync(int dressId, int institutionId)
        {
            using var connection = _context.CreateConnection();
            var sql = @"
                SELECT 
                    DressID, 
                    Dress_Name as DressName, 
                    Cloth_For_ID as ClothForID
                FROM Dress 
                WHERE DressID = @DressID AND InstitutionID = @InstitutionID";
            
            return await connection.QueryFirstOrDefaultAsync<DressDto>(sql, 
                new { DressID = dressId, InstitutionID = institutionId });
        }

        public async Task<int> CreateDressAsync(Dress dress)
        {
            using var connection = _context.CreateConnection();
            var sql = @"INSERT INTO Dress (InstitutionID, RegistrationID, DressName, Price)
                       VALUES (@InstitutionID, @RegistrationID, @DressName, @Price);
                       SELECT CAST(SCOPE_IDENTITY() as int)";
            
            return await connection.QuerySingleAsync<int>(sql, dress);
        }

        public async Task<bool> UpdateDressAsync(Dress dress)
        {
            using var connection = _context.CreateConnection();
            var sql = @"UPDATE Dress 
                       SET DressName = @DressName, Price = @Price
                       WHERE DressID = @DressID AND InstitutionID = @InstitutionID";
            
            var affectedRows = await connection.ExecuteAsync(sql, dress);
            return affectedRows > 0;
        }

        public async Task<bool> DeleteDressAsync(int dressId, int institutionId)
        {
            using var connection = _context.CreateConnection();
            var sql = "DELETE FROM Dress WHERE DressID = @DressID AND InstitutionID = @InstitutionID";
            
            var affectedRows = await connection.ExecuteAsync(sql, new { DressID = dressId, InstitutionID = institutionId });
            return affectedRows > 0;
        }
    }
}
