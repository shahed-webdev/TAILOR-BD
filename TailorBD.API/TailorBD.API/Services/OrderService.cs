using Dapper;
using TailorBD.API.Data;
using TailorBD.API.Models;

namespace TailorBD.API.Services
{
    public interface IOrderService
    {
        Task<IEnumerable<OrderDto>> GetAllOrdersAsync(int institutionId);
        Task<OrderDto?> GetOrderByIdAsync(Guid orderId, int institutionId);
        Task<IEnumerable<OrderDto>> GetOrdersByCustomerIdAsync(int customerId, int institutionId);
        Task<IEnumerable<OrderDto>> GetOrdersByDateRangeAsync(int institutionId, DateTime startDate, DateTime endDate);
        Task<Guid> CreateOrderAsync(Order order);
        Task<bool> UpdateOrderAsync(Order order);
        Task<bool> DeleteOrderAsync(Guid orderId, int institutionId);
    }

    public class OrderService : IOrderService
    {
        private readonly TailorBdContext _context;

        public OrderService(TailorBdContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<OrderDto>> GetAllOrdersAsync(int institutionId)
        {
            using var connection = _context.CreateConnection();
            var sql = @"SELECT o.OrderID, o.CustomerID, c.CustomerName, c.Phone as CustomerPhone,
                       o.OrderDate, o.DeliveryDate, o.TotalAmount, o.PaidAmount, o.DueAmount, o.DeliveryStatus
                       FROM [Order] o
                       INNER JOIN Customer c ON o.CustomerID = c.CustomerID
                       WHERE o.InstitutionID = @InstitutionID
                       ORDER BY o.OrderDate DESC";
            
            return await connection.QueryAsync<OrderDto>(sql, new { InstitutionID = institutionId });
        }

        public async Task<OrderDto?> GetOrderByIdAsync(Guid orderId, int institutionId)
        {
            using var connection = _context.CreateConnection();
            var sql = @"SELECT o.OrderID, o.CustomerID, c.CustomerName, c.Phone as CustomerPhone,
                       o.OrderDate, o.DeliveryDate, o.TotalAmount, o.PaidAmount, o.DueAmount, o.DeliveryStatus
                       FROM [Order] o
                       INNER JOIN Customer c ON o.CustomerID = c.CustomerID
                       WHERE o.OrderID = @OrderID AND o.InstitutionID = @InstitutionID";
            
            return await connection.QueryFirstOrDefaultAsync<OrderDto>(sql, 
                new { OrderID = orderId, InstitutionID = institutionId });
        }

        public async Task<IEnumerable<OrderDto>> GetOrdersByCustomerIdAsync(int customerId, int institutionId)
        {
            using var connection = _context.CreateConnection();
            var sql = @"SELECT o.OrderID, o.CustomerID, c.CustomerName, c.Phone as CustomerPhone,
                       o.OrderDate, o.DeliveryDate, o.TotalAmount, o.PaidAmount, o.DueAmount, o.DeliveryStatus
                       FROM [Order] o
                       INNER JOIN Customer c ON o.CustomerID = c.CustomerID
                       WHERE o.CustomerID = @CustomerID AND o.InstitutionID = @InstitutionID
                       ORDER BY o.OrderDate DESC";
            
            return await connection.QueryAsync<OrderDto>(sql, 
                new { CustomerID = customerId, InstitutionID = institutionId });
        }

        public async Task<IEnumerable<OrderDto>> GetOrdersByDateRangeAsync(int institutionId, DateTime startDate, DateTime endDate)
        {
            using var connection = _context.CreateConnection();
            var sql = @"SELECT o.OrderID, o.CustomerID, c.CustomerName, c.Phone as CustomerPhone,
                       o.OrderDate, o.DeliveryDate, o.TotalAmount, o.PaidAmount, o.DueAmount, o.DeliveryStatus
                       FROM [Order] o
                       INNER JOIN Customer c ON o.CustomerID = c.CustomerID
                       WHERE o.InstitutionID = @InstitutionID 
                       AND o.OrderDate >= @StartDate AND o.OrderDate <= @EndDate
                       ORDER BY o.OrderDate DESC";
            
            return await connection.QueryAsync<OrderDto>(sql, 
                new { InstitutionID = institutionId, StartDate = startDate, EndDate = endDate });
        }

        public async Task<Guid> CreateOrderAsync(Order order)
        {
            using var connection = _context.CreateConnection();
            var orderId = Guid.NewGuid();
            
            var sql = @"INSERT INTO [Order] (OrderID, InstitutionID, RegistrationID, CustomerID, 
                       OrderDate, DeliveryDate, TotalAmount, PaidAmount, DueAmount, OrderDetails, DeliveryStatus)
                       VALUES (@OrderID, @InstitutionID, @RegistrationID, @CustomerID, 
                       @OrderDate, @DeliveryDate, @TotalAmount, @PaidAmount, @DueAmount, @OrderDetails, @DeliveryStatus)";
            
            order.OrderID = orderId;
            order.OrderDate = DateTime.Now;
            order.DueAmount = order.TotalAmount - order.PaidAmount;
            order.DeliveryStatus = "Pending";
            
            await connection.ExecuteAsync(sql, order);
            return orderId;
        }

        public async Task<bool> UpdateOrderAsync(Order order)
        {
            using var connection = _context.CreateConnection();
            var sql = @"UPDATE [Order] 
                       SET DeliveryDate = @DeliveryDate, TotalAmount = @TotalAmount, 
                       PaidAmount = @PaidAmount, DueAmount = @DueAmount, 
                       OrderDetails = @OrderDetails, DeliveryStatus = @DeliveryStatus
                       WHERE OrderID = @OrderID AND InstitutionID = @InstitutionID";
            
            order.DueAmount = order.TotalAmount - order.PaidAmount;
            var affectedRows = await connection.ExecuteAsync(sql, order);
            return affectedRows > 0;
        }

        public async Task<bool> DeleteOrderAsync(Guid orderId, int institutionId)
        {
            using var connection = _context.CreateConnection();
            var sql = "DELETE FROM [Order] WHERE OrderID = @OrderID AND InstitutionID = @InstitutionID";
            
            var affectedRows = await connection.ExecuteAsync(sql, new { OrderID = orderId, InstitutionID = institutionId });
            return affectedRows > 0;
        }
    }
}
