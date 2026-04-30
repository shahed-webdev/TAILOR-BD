using Dapper;
using TailorBD.API.Data;
using TailorBD.API.Models;

namespace TailorBD.API.Services
{
    public interface ICustomerService
    {
        Task<PagedResult<CustomerDto>> GetAllCustomersAsync(int institutionId, int page, int pageSize, string? searchNo = null, string? searchName = null, string? searchPhone = null);
        Task<IEnumerable<CustomerDto>> SuggestCustomersAsync(int institutionId, string q, string type);
        Task<CustomerDto?> GetCustomerByIdAsync(int customerId, int institutionId);
        Task<CustomerDto?> GetCustomerByPhoneAsync(string phone, int institutionId);
        Task<int> CreateCustomerAsync(Customer customer);
        Task<bool> UpdateCustomerAsync(Customer customer);
        Task<bool> DeleteCustomerAsync(int customerId, int institutionId);
    }

    public class CustomerService : ICustomerService
    {
        private readonly TailorBdContext _context;

        public CustomerService(TailorBdContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<CustomerDto>> GetAllCustomersAsync(int institutionId, int page, int pageSize, string? searchNo = null, string? searchName = null, string? searchPhone = null)
        {
            using var connection = _context.CreateConnection();

            var where = new System.Text.StringBuilder("WHERE c.InstitutionID = @InstitutionID");
            if (!string.IsNullOrWhiteSpace(searchNo))    where.Append(" AND CAST(c.CustomerNumber AS NVARCHAR) LIKE @SearchNo + '%'");
            if (!string.IsNullOrWhiteSpace(searchName))  where.Append(" AND c.CustomerName LIKE '%' + @SearchName + '%'");
            if (!string.IsNullOrWhiteSpace(searchPhone)) where.Append(" AND c.Phone LIKE '%' + @SearchPhone + '%'");

            var param = new
            {
                InstitutionID = institutionId,
                SearchNo      = searchNo,
                SearchName    = searchName,
                SearchPhone   = searchPhone,
                Offset        = (page - 1) * pageSize,
                PageSize      = pageSize
            };

            var countSql = $"SELECT COUNT(*) FROM Customer c {where}";
            var totalCount = await connection.QuerySingleAsync<int>(countSql, param);

            var sql = $@"
                SELECT 
                    c.CustomerID, 
                    c.CustomerNumber, 
                    c.CustomerName, 
                    c.Phone, 
                    c.Address, 
                    c.Date,
                    c.Cloth_For_ID,
                    (SELECT COUNT(*) FROM [Order] WHERE CustomerID = c.CustomerID) AS TotalOrders,
                    (SELECT MAX(OrderDate) FROM [Order] WHERE CustomerID = c.CustomerID) AS Last_Order_Date
                FROM Customer c
                {where}
                ORDER BY c.Date DESC
                OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

            var data = await connection.QueryAsync<CustomerDto>(sql, param);

            return new PagedResult<CustomerDto>
            {
                Data       = data,
                TotalCount = totalCount,
                Page       = page,
                PageSize   = pageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            };
        }

        public async Task<IEnumerable<CustomerDto>> SuggestCustomersAsync(int institutionId, string q, string type)
        {
            using var connection = _context.CreateConnection();

            var where = type switch
            {
                "no"    => "AND CAST(c.CustomerNumber AS NVARCHAR) LIKE @Q + '%'",
                "phone" => "AND c.Phone LIKE '%' + @Q + '%'",
                _       => "AND c.CustomerName LIKE '%' + @Q + '%'"
            };

            var sql = $@"
                SELECT TOP 10
                    c.CustomerID,
                    c.CustomerNumber,
                    c.CustomerName,
                    c.Phone,
                    c.Address,
                    c.Date,
                    c.Cloth_For_ID
                FROM Customer c
                WHERE c.InstitutionID = @InstitutionID {where}
                ORDER BY c.CustomerName";

            return await connection.QueryAsync<CustomerDto>(sql, new { InstitutionID = institutionId, Q = q });
        }

        public async Task<CustomerDto?> GetCustomerByIdAsync(int customerId, int institutionId)
        {
            using var connection = _context.CreateConnection();
            var sql = @"
                SELECT 
                    c.CustomerID, 
                    c.CustomerNumber, 
                    c.CustomerName, 
                    c.Phone, 
                    c.Address, 
                    c.Date,
                    c.Cloth_For_ID,
                    (SELECT COUNT(*) FROM [Order] WHERE CustomerID = c.CustomerID) AS TotalOrders,
                    (SELECT MAX(OrderDate) FROM [Order] WHERE CustomerID = c.CustomerID) AS Last_Order_Date
                FROM Customer c
                WHERE c.CustomerID = @CustomerID AND c.InstitutionID = @InstitutionID";
            
            return await connection.QueryFirstOrDefaultAsync<CustomerDto>(sql, 
                new { CustomerID = customerId, InstitutionID = institutionId });
        }

        public async Task<CustomerDto?> GetCustomerByPhoneAsync(string phone, int institutionId)
        {
            using var connection = _context.CreateConnection();
            var sql = @"
                SELECT 
                    c.CustomerID, 
                    c.CustomerNumber, 
                    c.CustomerName, 
                    c.Phone, 
                    c.Address, 
                    c.Date,
                    c.Cloth_For_ID,
                    (SELECT COUNT(*) FROM [Order] WHERE CustomerID = c.CustomerID) AS TotalOrders,
                    (SELECT MAX(OrderDate) FROM [Order] WHERE CustomerID = c.CustomerID) AS Last_Order_Date
                FROM Customer c
                WHERE c.Phone = @Phone AND c.InstitutionID = @InstitutionID";
            
            return await connection.QueryFirstOrDefaultAsync<CustomerDto>(sql, 
                new { Phone = phone, InstitutionID = institutionId });
        }

        public async Task<int> CreateCustomerAsync(Customer customer)
        {
            using var connection = _context.CreateConnection();
            
            // Get next customer number for this institution
            var customerNumberSql = @"
                SELECT ISNULL(MAX(CASE WHEN ISNUMERIC(CustomerNumber) = 1 THEN CAST(CustomerNumber AS INT) ELSE 0 END), 0) + 1 
                FROM Customer 
                WHERE InstitutionID = @InstitutionID";
            
            var customerNumber = await connection.QuerySingleAsync<int>(customerNumberSql, 
                new { customer.InstitutionID });
            
            customer.CustomerNumber = customerNumber.ToString();
            
            var sql = @"
                INSERT INTO Customer (
                    RegistrationID, 
                    InstitutionID, 
                    Cloth_For_ID, 
                    CustomerNumber, 
                    CustomerName, 
                    Phone, 
                    Address, 
                    Date
                )
                VALUES (
                    @RegistrationID, 
                    @InstitutionID, 
                    @Cloth_For_ID, 
                    @CustomerNumber, 
                    @CustomerName, 
                    @Phone, 
                    @Address, 
                    @Date
                );
                SELECT CAST(SCOPE_IDENTITY() as int)";
            
            return await connection.QuerySingleAsync<int>(sql, customer);
        }

        public async Task<bool> UpdateCustomerAsync(Customer customer)
        {
            using var connection = _context.CreateConnection();
            var sql = @"UPDATE Customer 
                       SET CustomerName = @CustomerName, Phone = @Phone, Address = @Address
                       WHERE CustomerID = @CustomerID AND InstitutionID = @InstitutionID";
            
            var affectedRows = await connection.ExecuteAsync(sql, customer);
            return affectedRows > 0;
        }

        public async Task<bool> DeleteCustomerAsync(int customerId, int institutionId)
        {
            using var connection = _context.CreateConnection();
            var sql = "DELETE FROM Customer WHERE CustomerID = @CustomerID AND InstitutionID = @InstitutionID";
            
            var affectedRows = await connection.ExecuteAsync(sql, new { CustomerID = customerId, InstitutionID = institutionId });
            return affectedRows > 0;
        }
    }
}
