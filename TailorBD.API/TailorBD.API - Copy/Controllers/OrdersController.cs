using Microsoft.AspNetCore.Mvc;
using TailorBD.API.Models;
using TailorBD.API.Services;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _orderService;
        private readonly ILogger<OrdersController> _logger;
        private readonly IConfiguration _configuration;

        public OrdersController(IOrderService orderService, ILogger<OrdersController> logger, IConfiguration configuration)
        {
            _orderService = orderService;
            _logger = logger;
            _configuration = configuration;
        }

        /// <summary>
        /// Get all orders for an institution
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<ApiResponse<IEnumerable<OrderDto>>>> GetAllOrders([FromQuery] int institutionId)
        {
            try
            {
                if (institutionId <= 0)
                    return BadRequest(ApiResponse<IEnumerable<OrderDto>>.ErrorResponse("Invalid institution ID"));

                var orders = await _orderService.GetAllOrdersAsync(institutionId);
                return Ok(ApiResponse<IEnumerable<OrderDto>>.SuccessResponse(orders, "Orders retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving orders for institution {InstitutionId}", institutionId);
                return StatusCode(500, ApiResponse<IEnumerable<OrderDto>>.ErrorResponse("An error occurred while retrieving orders"));
            }
        }

        /// <summary>
        /// Search orders with filters and pagination
        /// </summary>
        [HttpGet("search")]
        public async Task<ActionResult> SearchOrders(
            [FromQuery] int institutionId,
            [FromQuery] string? phone,
            [FromQuery] string? orderSerialNumber,
            [FromQuery] string? customerName,
            [FromQuery] string? address,
            [FromQuery] string? startDate,
            [FromQuery] string? endDate,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25)
        {
            try
            {
                if (institutionId <= 0)
                    return BadRequest(new { success = false, message = "Invalid institution ID" });

                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new Microsoft.Data.SqlClient.SqlConnection(connectionString);
                await connection.OpenAsync();

                var conditions = new List<string>
                {
                    "[Order].InstitutionID = @InstitutionID",
                    "[Order].DeliveryStatus IN (N'Pending', N'PartlyDelivered')",
                    "[Order].WorkStatus IN (N'incomplete', N'PartlyCompleted')"
                };

                var parameters = new List<Microsoft.Data.SqlClient.SqlParameter>
                {
                    new("@InstitutionID", institutionId)
                };

                if (!string.IsNullOrWhiteSpace(phone))
                {
                    conditions.Add("Customer.Phone LIKE @Phone + '%'");
                    parameters.Add(new("@Phone", phone));
                }

                if (!string.IsNullOrWhiteSpace(orderSerialNumber))
                {
                    conditions.Add("CAST([Order].OrderSerialNumber AS NVARCHAR(50)) LIKE @OrderSerialNumber + '%'");
                    parameters.Add(new("@OrderSerialNumber", orderSerialNumber));
                }

                if (!string.IsNullOrWhiteSpace(customerName))
                {
                    conditions.Add("ISNULL(Customer.CustomerName, '') LIKE @CustomerName + '%'");
                    parameters.Add(new("@CustomerName", customerName));
                }

                if (!string.IsNullOrWhiteSpace(address))
                {
                    conditions.Add("ISNULL(Customer.Address, '') LIKE @Address + '%'");
                    parameters.Add(new("@Address", address));
                }

                if (!string.IsNullOrWhiteSpace(startDate) || !string.IsNullOrWhiteSpace(endDate))
                {
                    conditions.Add("[Order].OrderDate BETWEEN ISNULL(@StartDate, '1-1-1760') AND ISNULL(@EndDate, '1-1-3760')");
                    parameters.Add(new("@StartDate", (object?)startDate ?? DBNull.Value));
                    parameters.Add(new("@EndDate", (object?)endDate ?? DBNull.Value));
                }

                var whereClause = string.Join(" AND ", conditions);
                var offset = (page - 1) * pageSize;

                var countQuery = $@"
                    SELECT COUNT(*) 
                    FROM [Order] 
                    INNER JOIN Customer ON [Order].CustomerID = Customer.CustomerID 
                    WHERE {whereClause}";

                var dataQuery = $@"
                    SELECT 
                        [Order].OrderID,
                        [Order].OrderSerialNumber,
                        [Order].OrderDate,
                        [Order].DeliveryDate,
                        [Order].OrderAmount,
                        [Order].PaidAmount,
                        [Order].DueAmount,
                        [Order].PaymentStatus,
                        [Order].DeliveryStatus,
                        [Order].WorkStatus,
                        Customer.CustomerNumber,
                        Customer.CustomerName,
                        Customer.Phone,
                        Customer.Address,
                        STUFF((
                            SELECT '; ' + Dress.Dress_Name + ' ' + CAST(OrderList.DressQuantity AS NVARCHAR(50)) + ' Piece '
                            FROM OrderList 
                            INNER JOIN Dress ON OrderList.DressID = Dress.DressID 
                            WHERE OrderList.OrderID = [Order].OrderID 
                            FOR XML PATH('')
                        ), 1, 1, '') AS Details
                    FROM [Order] 
                    INNER JOIN Customer ON [Order].CustomerID = Customer.CustomerID 
                    WHERE {whereClause}
                    ORDER BY [Order].OrderSerialNumber DESC
                    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

                int totalCount;
                using (var countCmd = new Microsoft.Data.SqlClient.SqlCommand(countQuery, connection))
                {
                    countCmd.Parameters.AddRange(parameters.ToArray());
                    totalCount = Convert.ToInt32(await countCmd.ExecuteScalarAsync());
                }

                var orders = new List<object>();
                using (var dataCmd = new Microsoft.Data.SqlClient.SqlCommand(dataQuery, connection))
                {
                    dataCmd.Parameters.AddRange(parameters.Select(p =>
                        new Microsoft.Data.SqlClient.SqlParameter(p.ParameterName, p.Value)).ToArray());
                    dataCmd.Parameters.Add(new("@Offset", offset));
                    dataCmd.Parameters.Add(new("@PageSize", pageSize));

                    using var reader = await dataCmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        orders.Add(new
                        {
                            orderId = reader.GetInt32(reader.GetOrdinal("OrderID")),
                            orderSerialNumber = reader.GetInt32(reader.GetOrdinal("OrderSerialNumber")),
                            orderDate = reader.GetDateTime(reader.GetOrdinal("OrderDate")),
                            deliveryDate = reader.IsDBNull(reader.GetOrdinal("DeliveryDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("DeliveryDate")),
                            orderAmount = reader.IsDBNull(reader.GetOrdinal("OrderAmount")) ? 0.0 : Convert.ToDouble(reader.GetValue(reader.GetOrdinal("OrderAmount"))),
                            paidAmount = reader.IsDBNull(reader.GetOrdinal("PaidAmount")) ? 0.0 : Convert.ToDouble(reader.GetValue(reader.GetOrdinal("PaidAmount"))),
                            dueAmount = reader.IsDBNull(reader.GetOrdinal("DueAmount")) ? 0.0 : Convert.ToDouble(reader.GetValue(reader.GetOrdinal("DueAmount"))),
                            paymentStatus = reader.IsDBNull(reader.GetOrdinal("PaymentStatus")) ? "" : reader.GetString(reader.GetOrdinal("PaymentStatus")),
                            deliveryStatus = reader.IsDBNull(reader.GetOrdinal("DeliveryStatus")) ? "" : reader.GetString(reader.GetOrdinal("DeliveryStatus")),
                            workStatus = reader.IsDBNull(reader.GetOrdinal("WorkStatus")) ? "" : reader.GetString(reader.GetOrdinal("WorkStatus")),
                            customerNumber = reader.IsDBNull(reader.GetOrdinal("CustomerNumber")) ? 0 : reader.GetInt32(reader.GetOrdinal("CustomerNumber")),
                            customerName = reader.IsDBNull(reader.GetOrdinal("CustomerName")) ? "" : reader.GetString(reader.GetOrdinal("CustomerName")),
                            phone = reader.IsDBNull(reader.GetOrdinal("Phone")) ? "" : reader.GetString(reader.GetOrdinal("Phone")),
                            address = reader.IsDBNull(reader.GetOrdinal("Address")) ? "" : reader.GetString(reader.GetOrdinal("Address")),
                            details = reader.IsDBNull(reader.GetOrdinal("Details")) ? "" : reader.GetString(reader.GetOrdinal("Details"))
                        });
                    }
                }

                var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        orders,
                        totalCount,
                        totalPages,
                        currentPage = page
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching orders for institution {InstitutionId}", institutionId);
                return StatusCode(500, new { success = false, message = "An error occurred while searching orders: " + ex.Message });
            }
        }

        /// <summary>
        /// Autocomplete suggestions for order list fields
        /// </summary>
        [HttpGet("autocomplete")]
        public async Task<ActionResult> Autocomplete(
            [FromQuery] int institutionId,
            [FromQuery] string field,
            [FromQuery] string term)
        {
            try
            {
                if (institutionId <= 0)
                    return BadRequest(new { success = false, message = "Invalid institution ID" });

                if (string.IsNullOrWhiteSpace(term) || string.IsNullOrWhiteSpace(field))
                    return Ok(new { success = true, data = Array.Empty<string>() });

                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new Microsoft.Data.SqlClient.SqlConnection(connectionString);
                await connection.OpenAsync();

                string query = field.ToLower() switch
                {
                    "phone" => "SELECT DISTINCT TOP 10 Customer.Phone AS Value FROM Customer INNER JOIN [Order] ON Customer.CustomerID = [Order].CustomerID WHERE [Order].InstitutionID = @InstitutionID AND Customer.Phone LIKE @Term + '%' ORDER BY Value",
                    "ordernumber" => "SELECT DISTINCT TOP 10 CAST([Order].OrderSerialNumber AS NVARCHAR(50)) AS Value FROM [Order] WHERE InstitutionID = @InstitutionID AND CAST(OrderSerialNumber AS NVARCHAR(50)) LIKE @Term + '%' ORDER BY Value",
                    "customername" => "SELECT DISTINCT TOP 10 Customer.CustomerName AS Value FROM Customer INNER JOIN [Order] ON Customer.CustomerID = [Order].CustomerID WHERE [Order].InstitutionID = @InstitutionID AND Customer.CustomerName LIKE @Term + '%' ORDER BY Value",
                    "address" => "SELECT DISTINCT TOP 10 Customer.Address AS Value FROM Customer INNER JOIN [Order] ON Customer.CustomerID = [Order].CustomerID WHERE [Order].InstitutionID = @InstitutionID AND Customer.Address LIKE @Term + '%' ORDER BY Value",
                    _ => null
                };

                if (query == null)
                    return BadRequest(new { success = false, message = $"Invalid field: {field}" });

                var suggestions = new List<string>();
                using var cmd = new Microsoft.Data.SqlClient.SqlCommand(query, connection);
                cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                cmd.Parameters.AddWithValue("@Term", term);

                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                    suggestions.Add(reader.GetString(0));

                return Ok(new { success = true, data = suggestions });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in autocomplete for field {Field}", field);
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        /// <summary>
        /// Get order by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<OrderDto>>> GetOrderById(Guid id, [FromQuery] int institutionId)
        {
            try
            {
                if (institutionId <= 0)
                    return BadRequest(ApiResponse<OrderDto>.ErrorResponse("Invalid institution ID"));

                var order = await _orderService.GetOrderByIdAsync(id, institutionId);

                if (order == null)
                    return NotFound(ApiResponse<OrderDto>.ErrorResponse("Order not found"));

                return Ok(ApiResponse<OrderDto>.SuccessResponse(order, "Order retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving order {OrderId}", id);
                return StatusCode(500, ApiResponse<OrderDto>.ErrorResponse("An error occurred while retrieving order"));
            }
        }

        /// <summary>
        /// Get order by integer OrderID (for edit page)
        /// </summary>
        [HttpGet("by-order-id/{orderId}")]
        public async Task<ActionResult> GetOrderByOrderId(int orderId, [FromQuery] int institutionId)
        {
            try
            {
                if (institutionId <= 0)
                    return BadRequest(new { success = false, message = "Invalid institution ID" });

                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new Microsoft.Data.SqlClient.SqlConnection(connectionString);
                await connection.OpenAsync();

                var query = @"
                    SELECT 
                        [Order].OrderID, 
                        [Order].OrderSerialNumber,
                        [Order].OrderDate,
                        [Order].OrderAmount,
                        [Order].PaidAmount,
                        [Order].Discount,
                        [Order].DueAmount,
                        Customer.CustomerID,
                        Customer.CustomerName,
                        Customer.Phone,
                        Customer.Address,
                        Customer.Cloth_For_ID AS ClothForID
                    FROM [Order]
                    INNER JOIN Customer ON [Order].CustomerID = Customer.CustomerID
                    WHERE [Order].OrderID = @OrderID AND [Order].InstitutionID = @InstitutionID";

                using var cmd = new Microsoft.Data.SqlClient.SqlCommand(query, connection);
                cmd.Parameters.AddWithValue("@OrderID", orderId);
                cmd.Parameters.AddWithValue("@InstitutionID", institutionId);

                using var reader = await cmd.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    var orderData = new
                    {
                        orderID = reader.GetInt32(reader.GetOrdinal("OrderID")),
                        orderSerialNumber = reader.GetInt32(reader.GetOrdinal("OrderSerialNumber")),
                        orderDate = reader.GetDateTime(reader.GetOrdinal("OrderDate")),
                        orderAmount = reader.IsDBNull(reader.GetOrdinal("OrderAmount")) ? 0.0 : reader.GetDouble(reader.GetOrdinal("OrderAmount")),
                        paidAmount = reader.IsDBNull(reader.GetOrdinal("PaidAmount")) ? 0.0 : reader.GetDouble(reader.GetOrdinal("PaidAmount")),
                        discount = reader.IsDBNull(reader.GetOrdinal("Discount")) ? 0.0 : reader.GetDouble(reader.GetOrdinal("Discount")),
                        dueAmount = reader.IsDBNull(reader.GetOrdinal("DueAmount")) ? 0.0 : reader.GetDouble(reader.GetOrdinal("DueAmount")),
                        customerID = reader.GetInt32(reader.GetOrdinal("CustomerID")),
                        customerName = reader.GetString(reader.GetOrdinal("CustomerName")),
                        phone = reader.IsDBNull(reader.GetOrdinal("Phone")) ? "" : reader.GetString(reader.GetOrdinal("Phone")),
                        address = reader.IsDBNull(reader.GetOrdinal("Address")) ? "" : reader.GetString(reader.GetOrdinal("Address")),
                        clothForID = reader.GetInt32(reader.GetOrdinal("ClothForID"))
                    };
                    return Ok(new { success = true, data = orderData });
                }

                return NotFound(new { success = false, message = "Order not found" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving order by OrderID {OrderId}", orderId);
                return StatusCode(500, new { success = false, message = "An error occurred while retrieving order" });
            }
        }

        /// <summary>
        /// Get order list items for an order
        /// </summary>
        [HttpGet("{orderId}/items")]
        public async Task<ActionResult> GetOrderListItems(int orderId, [FromQuery] int institutionId)
        {
            try
            {
                if (institutionId <= 0)
                    return BadRequest(new { success = false, message = "Invalid institution ID" });

                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new Microsoft.Data.SqlClient.SqlConnection(connectionString);
                await connection.OpenAsync();

                var query = @"
                    SELECT 
                        OrderList.OrderListID,
                        OrderList.DressID,
                        OrderList.DressQuantity,
                        OrderList.Details,
                        OrderList.OrderList_SN,
                        Dress.Dress_Name
                    FROM OrderList
                    INNER JOIN Dress ON OrderList.DressID = Dress.DressID
                    WHERE OrderList.OrderID = @OrderID AND OrderList.InstitutionID = @InstitutionID
                    ORDER BY OrderList.OrderList_SN";

                var orderListItems = new List<object>();
                using var cmd = new Microsoft.Data.SqlClient.SqlCommand(query, connection);
                cmd.Parameters.AddWithValue("@OrderID", orderId);
                cmd.Parameters.AddWithValue("@InstitutionID", institutionId);

                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    orderListItems.Add(new
                    {
                        orderListID = reader.GetInt32(reader.GetOrdinal("OrderListID")),
                        dressID = reader.GetInt32(reader.GetOrdinal("DressID")),
                        dress_Name = reader.GetString(reader.GetOrdinal("Dress_Name")),
                        dressQuantity = reader.GetInt32(reader.GetOrdinal("DressQuantity")),
                        details = reader.IsDBNull(reader.GetOrdinal("Details")) ? "" : reader.GetString(reader.GetOrdinal("Details")),
                        orderList_SN = reader.IsDBNull(reader.GetOrdinal("OrderList_SN")) ? 0 : reader.GetInt32(reader.GetOrdinal("OrderList_SN"))
                    });
                }

                return Ok(new { success = true, data = orderListItems });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving order list items for order {OrderId}", orderId);
                return StatusCode(500, new { success = false, message = "An error occurred while retrieving order items" });
            }
        }

        /// <summary>
        /// Get payments for an order list item
        /// </summary>
        [HttpGet("{orderId}/order-list/{orderListId}/payments")]
        public async Task<ActionResult> GetOrderListPayments(int orderId, int orderListId, [FromQuery] int institutionId)
        {
            try
            {
                if (institutionId <= 0)
                    return BadRequest(new { success = false, message = "Invalid institution ID" });

                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new Microsoft.Data.SqlClient.SqlConnection(connectionString);
                await connection.OpenAsync();

                var query = @"
                    SELECT 
                        OrderPaymentID,
                        Details,
                        Unit,
                        UnitPrice,
                        Amount,
                        FabricID
                    FROM Order_Payment
                    WHERE OrderListID = @OrderListID 
                      AND OrderID = @OrderID 
                      AND InstitutionID = @InstitutionID";

                var payments = new List<object>();
                using var cmd = new Microsoft.Data.SqlClient.SqlCommand(query, connection);
                cmd.Parameters.AddWithValue("@OrderListID", orderListId);
                cmd.Parameters.AddWithValue("@OrderID", orderId);
                cmd.Parameters.AddWithValue("@InstitutionID", institutionId);

                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    payments.Add(new
                    {
                        orderPaymentID = reader.GetInt32(reader.GetOrdinal("OrderPaymentID")),
                        details = reader.IsDBNull(reader.GetOrdinal("Details")) ? "" : reader.GetString(reader.GetOrdinal("Details")),
                        unit = reader.IsDBNull(reader.GetOrdinal("Unit")) ? 0.0 : Convert.ToDouble(reader.GetValue(reader.GetOrdinal("Unit"))),
                        unitPrice = reader.IsDBNull(reader.GetOrdinal("UnitPrice")) ? 0.0 : Convert.ToDouble(reader.GetValue(reader.GetOrdinal("UnitPrice"))),
                        amount = reader.IsDBNull(reader.GetOrdinal("Amount")) ? 0.0 : reader.GetDouble(reader.GetOrdinal("Amount")),
                        fabricID = reader.IsDBNull(reader.GetOrdinal("FabricID")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("FabricID"))
                    });
                }

                return Ok(new { success = true, data = payments });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving payments for order list item {OrderListId}", orderListId);
                return StatusCode(500, new { success = false, message = "An error occurred while retrieving payments" });
            }
        }

        /// <summary>
        /// Get money receipt details for an order
        /// </summary>
        [HttpGet("{orderId}/money-receipt")]
        public async Task<ActionResult> GetMoneyReceiptDetails(int orderId, [FromQuery] int institutionId)
        {
            try
            {
                if (institutionId <= 0)
                    return BadRequest(new { success = false, message = "Invalid institution ID" });

                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new Microsoft.Data.SqlClient.SqlConnection(connectionString);
                await connection.OpenAsync();

                var query = @"
                    SELECT 
                        ReceiptID,
                        Amount,
                        ReceiveDate,
                        PaymentMethod,
                        ChequeNo,
                        BankName,
                        BranchName,
                        Remarks
                    FROM MoneyReceipt
                    WHERE OrderID = @OrderID AND InstitutionID = @InstitutionID
                    ORDER BY ReceiveDate DESC";

                var receipts = new List<object>();
                using var cmd = new Microsoft.Data.SqlClient.SqlCommand(query, connection);
                cmd.Parameters.AddWithValue("@OrderID", orderId);
                cmd.Parameters.AddWithValue("@InstitutionID", institutionId);

                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    receipts.Add(new
                    {
                        receiptID = reader.GetInt32(reader.GetOrdinal("ReceiptID")),
                        amount = reader.GetDouble(reader.GetOrdinal("Amount")),
                        receiveDate = reader.GetDateTime(reader.GetOrdinal("ReceiveDate")),
                        paymentMethod = reader.GetString(reader.GetOrdinal("PaymentMethod")),
                        chequeNo = reader.IsDBNull(reader.GetOrdinal("ChequeNo")) ? "" : reader.GetString(reader.GetOrdinal("ChequeNo")),
                        bankName = reader.IsDBNull(reader.GetOrdinal("BankName")) ? "" : reader.GetString(reader.GetOrdinal("BankName")),
                        branchName = reader.IsDBNull(reader.GetOrdinal("BranchName")) ? "" : reader.GetString(reader.GetOrdinal("BranchName")),
                        remarks = reader.IsDBNull(reader.GetOrdinal("Remarks")) ? "" : reader.GetString(reader.GetOrdinal("Remarks"))
                    });
                }

                return Ok(new { success = true, data = receipts });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving money receipt details for order {OrderId}", orderId);
                return StatusCode(500, new { success = false, message = "An error occurred while retrieving money receipt details" });
            }
        }

        /// <summary>
        /// Get finish order details (customer info + order items + discount info)
        /// </summary>
        [HttpGet("finish-order-details")]
        public async Task<ActionResult> GetFinishOrderDetails([FromQuery] int orderId, [FromQuery] int institutionId)
        {
            try
            {
                if (institutionId <= 0)
                    return BadRequest(new { success = false, message = "Invalid institution ID" });

                if (orderId <= 0)
                    return BadRequest(new { success = false, message = "Invalid order ID" });

                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new Microsoft.Data.SqlClient.SqlConnection(connectionString);
                await connection.OpenAsync();

                // Get customer + order summary
                var orderQuery = @"
                    SELECT
                        [Order].OrderID,
                        [Order].OrderSerialNumber,
                        [Order].OrderAmount,
                        [Order].PaidAmount,
                        [Order].Discount,
                        [Order].DueAmount,
                        [Order].DeliveryDate,
                        [Order].Update_DeliveryDate,
                        Customer.CustomerID,
                        Customer.CustomerNumber,
                        Customer.CustomerName,
                        Customer.Phone,
                        Customer.Address,
                        Customer.Cloth_For_ID AS ClothForId,
                        Institution.Discount_Limit,
                        ([Order].OrderAmount * Institution.Discount_Limit / 100) AS DiscountLimitAmount
                    FROM [Order]
                    INNER JOIN Customer ON [Order].CustomerID = Customer.CustomerID
                    INNER JOIN Institution ON [Order].InstitutionID = Institution.InstitutionID
                    WHERE [Order].OrderID = @OrderID AND [Order].InstitutionID = @InstitutionID";

                object customerInfo;
                double discountLimitPercent = 0;
                double discountLimitAmount = 0;

                using (var cmd = new Microsoft.Data.SqlClient.SqlCommand(orderQuery, connection))
                {
                    cmd.Parameters.AddWithValue("@OrderID", orderId);
                    cmd.Parameters.AddWithValue("@InstitutionID", institutionId);

                    using var reader = await cmd.ExecuteReaderAsync();
                    if (!await reader.ReadAsync())
                        return NotFound(new { success = false, message = "Order not found" });

                    discountLimitPercent = reader.IsDBNull(reader.GetOrdinal("Discount_Limit")) ? 0 : Convert.ToDouble(reader.GetValue(reader.GetOrdinal("Discount_Limit")));
                    discountLimitAmount = reader.IsDBNull(reader.GetOrdinal("DiscountLimitAmount")) ? 0 : Convert.ToDouble(reader.GetValue(reader.GetOrdinal("DiscountLimitAmount")));

                    customerInfo = new
                    {
                        orderId = reader.GetInt32(reader.GetOrdinal("OrderID")),
                        orderSerialNumber = reader.GetInt32(reader.GetOrdinal("OrderSerialNumber")),
                        orderAmount = reader.IsDBNull(reader.GetOrdinal("OrderAmount")) ? 0.0 : Convert.ToDouble(reader.GetValue(reader.GetOrdinal("OrderAmount"))),
                        paidAmount = reader.IsDBNull(reader.GetOrdinal("PaidAmount")) ? 0.0 : Convert.ToDouble(reader.GetValue(reader.GetOrdinal("PaidAmount"))),
                        discount = reader.IsDBNull(reader.GetOrdinal("Discount")) ? 0.0 : Convert.ToDouble(reader.GetValue(reader.GetOrdinal("Discount"))),
                        dueAmount = reader.IsDBNull(reader.GetOrdinal("DueAmount")) ? 0.0 : Convert.ToDouble(reader.GetValue(reader.GetOrdinal("DueAmount"))),
                        deliveryDate = reader.IsDBNull(reader.GetOrdinal("DeliveryDate")) ? null : reader.GetDateTime(reader.GetOrdinal("DeliveryDate")).ToString("yyyy-MM-dd"),
                        customerId = reader.GetInt32(reader.GetOrdinal("CustomerID")),
                        customerNumber = reader.IsDBNull(reader.GetOrdinal("CustomerNumber")) ? 0 : reader.GetInt32(reader.GetOrdinal("CustomerNumber")),
                        customerName = reader.IsDBNull(reader.GetOrdinal("CustomerName")) ? "" : reader.GetString(reader.GetOrdinal("CustomerName")),
                        phone = reader.IsDBNull(reader.GetOrdinal("Phone")) ? "" : reader.GetString(reader.GetOrdinal("Phone")),
                        address = reader.IsDBNull(reader.GetOrdinal("Address")) ? "" : reader.GetString(reader.GetOrdinal("Address")),
                        clothForId = reader.GetInt32(reader.GetOrdinal("ClothForId"))
                    };
                }

                // Get order items (dress + payment details)
                var itemsQuery = @"
                    SELECT
                        Dress.Dress_Name AS dressName,
                        OrderList.DressQuantity AS dressQuantity,
                        Order_Payment.Details AS details,
                        Order_Payment.Unit AS unit,
                        Order_Payment.UnitPrice AS unitPrice,
                        Order_Payment.Amount AS amount
                    FROM OrderList
                    INNER JOIN Dress ON OrderList.DressID = Dress.DressID
                    INNER JOIN Order_Payment ON OrderList.OrderListID = Order_Payment.OrderListID
                    WHERE OrderList.OrderID = @OrderID AND OrderList.InstitutionID = @InstitutionID";

                var orderItems = new List<object>();
                using (var cmd = new Microsoft.Data.SqlClient.SqlCommand(itemsQuery, connection))
                {
                    cmd.Parameters.AddWithValue("@OrderID", orderId);
                    cmd.Parameters.AddWithValue("@InstitutionID", institutionId);

                    using var reader = await cmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        orderItems.Add(new
                        {
                            dressName = reader.IsDBNull(reader.GetOrdinal("dressName")) ? "" : reader.GetString(reader.GetOrdinal("dressName")),
                            dressQuantity = reader.IsDBNull(reader.GetOrdinal("dressQuantity")) ? 0 : reader.GetInt32(reader.GetOrdinal("dressQuantity")),
                            details = reader.IsDBNull(reader.GetOrdinal("details")) ? "" : reader.GetString(reader.GetOrdinal("details")),
                            unit = reader.IsDBNull(reader.GetOrdinal("unit")) ? 0.0 : Convert.ToDouble(reader.GetValue(reader.GetOrdinal("unit"))),
                            unitPrice = reader.IsDBNull(reader.GetOrdinal("unitPrice")) ? 0.0 : Convert.ToDouble(reader.GetValue(reader.GetOrdinal("unitPrice"))),
                            amount = reader.IsDBNull(reader.GetOrdinal("amount")) ? 0.0 : reader.GetDouble(reader.GetOrdinal("amount"))
                        });
                    }
                }

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        customer = customerInfo,
                        orderItems,
                        discountLimitPercent,
                        discountLimitAmount
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving finish order details for order {OrderId}", orderId);
                return StatusCode(500, new { success = false, message = "An error occurred: " + ex.Message });
            }
        }

        /// <summary>
        /// Get full money receipt details (header + order items + measurements + styles)
        /// </summary>
        [HttpGet("money-receipt-details")]
        public async Task<ActionResult> GetMoneyReceiptDetails2([FromQuery] int orderId, [FromQuery] int institutionId)
        {
            try
            {
                if (institutionId <= 0)
                    return BadRequest(new { success = false, message = "Invalid institution ID" });
                if (orderId <= 0)
                    return BadRequest(new { success = false, message = "Invalid order ID" });

                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new Microsoft.Data.SqlClient.SqlConnection(connectionString);
                await connection.OpenAsync();

                // 1. Header: order + customer + institution
                var headerQuery = @"
                    SELECT
                        [Order].OrderID,
                        [Order].OrderSerialNumber,
                        [Order].OrderDate,
                        [Order].OrderTime,
                        [Order].DeliveryDate,
                        [Order].Update_DeliveryDate,
                        [Order].OrderAmount,
                        [Order].PaidAmount,
                        [Order].Discount,
                        [Order].DueAmount,
                        Customer.CustomerID,
                        Customer.CustomerNumber,
                        Customer.CustomerName,
                        Customer.Phone,
                        Customer.Address,
                        Institution.InstitutionName,
                        Institution.Phone           AS InstitutionPhone,
                        Institution.Address         AS InstitutionAddress,
                        Institution.Dialog_Title    AS DialogTitle,
                        Institution.M_Receipt_ShopName,
                        Institution.M_Receipt_TopSpace,
                        Institution.M_Receipt_FontSize,
                        Institution.M_Receipt_ServedBy,
                        Institution.PoweredByInfo
                    FROM [Order]
                    INNER JOIN Customer    ON [Order].CustomerID    = Customer.CustomerID
                    INNER JOIN Institution ON [Order].InstitutionID = Institution.InstitutionID
                    WHERE [Order].OrderID = @OrderID AND [Order].InstitutionID = @InstitutionID";

                object? header = null;
                using (var cmd = new Microsoft.Data.SqlClient.SqlCommand(headerQuery, connection))
                {
                    cmd.Parameters.AddWithValue("@OrderID", orderId);
                    cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                    using var r = await cmd.ExecuteReaderAsync();
                    if (!await r.ReadAsync())
                        return NotFound(new { success = false, message = "Order not found" });

                    header = new
                    {
                        orderSerialNumber  = r.GetInt32(r.GetOrdinal("OrderSerialNumber")),
                        orderDate          = r.GetDateTime(r.GetOrdinal("OrderDate")),
                        orderTime          = r.IsDBNull(r.GetOrdinal("OrderTime"))        ? null : r.GetValue(r.GetOrdinal("OrderTime"))?.ToString(),
                        deliveryDate       = r.IsDBNull(r.GetOrdinal("DeliveryDate"))     ? null : r.GetDateTime(r.GetOrdinal("DeliveryDate")).ToString("yyyy-MM-dd"),
                        updateDeliveryDate = r.IsDBNull(r.GetOrdinal("Update_DeliveryDate")) ? null : r.GetDateTime(r.GetOrdinal("Update_DeliveryDate")).ToString("yyyy-MM-dd"),
                        orderAmount        = r.IsDBNull(r.GetOrdinal("OrderAmount")) ? 0.0 : Convert.ToDouble(r.GetValue(r.GetOrdinal("OrderAmount"))),
                        paidAmount         = r.IsDBNull(r.GetOrdinal("PaidAmount"))  ? 0.0 : Convert.ToDouble(r.GetValue(r.GetOrdinal("PaidAmount"))),
                        discount           = r.IsDBNull(r.GetOrdinal("Discount"))    ? 0.0 : Convert.ToDouble(r.GetValue(r.GetOrdinal("Discount"))),
                        dueAmount          = r.IsDBNull(r.GetOrdinal("DueAmount"))   ? 0.0 : Convert.ToDouble(r.GetValue(r.GetOrdinal("DueAmount"))),
                        customerId         = r.GetInt32(r.GetOrdinal("CustomerID")),
                        customerNumber     = r.IsDBNull(r.GetOrdinal("CustomerNumber")) ? 0 : r.GetInt32(r.GetOrdinal("CustomerNumber")),
                        customerName       = r.IsDBNull(r.GetOrdinal("CustomerName"))   ? "" : r.GetString(r.GetOrdinal("CustomerName")),
                        phone              = r.IsDBNull(r.GetOrdinal("Phone"))           ? "" : r.GetString(r.GetOrdinal("Phone")),
                        address            = r.IsDBNull(r.GetOrdinal("Address"))         ? "" : r.GetString(r.GetOrdinal("Address")),
                        institutionName    = r.IsDBNull(r.GetOrdinal("InstitutionName")) ? "" : r.GetString(r.GetOrdinal("InstitutionName")),
                        institutionPhone   = r.IsDBNull(r.GetOrdinal("InstitutionPhone"))? "" : r.GetString(r.GetOrdinal("InstitutionPhone")),
                        institutionAddress = r.IsDBNull(r.GetOrdinal("InstitutionAddress")) ? "" : r.GetString(r.GetOrdinal("InstitutionAddress")),
                        dialogTitle        = r.IsDBNull(r.GetOrdinal("DialogTitle"))      ? "" : r.GetString(r.GetOrdinal("DialogTitle")),
                        poweredByInfo      = r.IsDBNull(r.GetOrdinal("PoweredByInfo"))    ? "" : r.GetString(r.GetOrdinal("PoweredByInfo"))
                    };
                }

                // 2. Order items (dress + payment rows)
                var itemsQuery = @"
                    SELECT
                        Dress.Dress_Name     AS dressName,
                        OL.DressQuantity     AS dressQuantity,
                        OP.Details           AS details,
                        OP.Unit              AS unit,
                        OP.UnitPrice         AS unitPrice,
                        OP.Amount            AS amount
                    FROM OrderList OL
                    INNER JOIN Dress         ON OL.DressID         = Dress.DressID
                    INNER JOIN Order_Payment OP ON OL.OrderListID  = OP.OrderListID
                    WHERE OL.OrderID = @OrderID AND OL.InstitutionID = @InstitutionID";

                var orderItems = new List<object>();
                using (var cmd = new Microsoft.Data.SqlClient.SqlCommand(itemsQuery, connection))
                {
                    cmd.Parameters.AddWithValue("@OrderID", orderId);
                    cmd.Parameters.AddWithValue("@InstitutionID", institutionId);

                    using var reader = await cmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        orderItems.Add(new
                        {
                            dressName = reader.IsDBNull(reader.GetOrdinal("dressName")) ? "" : reader.GetString(reader.GetOrdinal("dressName")),
                            dressQuantity = reader.IsDBNull(reader.GetOrdinal("dressQuantity")) ? 0 : reader.GetInt32(reader.GetOrdinal("dressQuantity")),
                            details = reader.IsDBNull(reader.GetOrdinal("details")) ? "" : reader.GetString(reader.GetOrdinal("details")),
                            unit = reader.IsDBNull(reader.GetOrdinal("unit")) ? 0.0 : Convert.ToDouble(reader.GetValue(reader.GetOrdinal("unit"))),
                            unitPrice = reader.IsDBNull(reader.GetOrdinal("unitPrice")) ? 0.0 : Convert.ToDouble(reader.GetValue(reader.GetOrdinal("unitPrice"))),
                            amount = reader.IsDBNull(reader.GetOrdinal("amount")) ? 0.0 : reader.GetDouble(reader.GetOrdinal("amount"))
                        });
                    }
                }

                // 3. Measurements per OrderList item
                var measQuery = @"
                    SELECT
                        OL.OrderListID,
                        OL.OrderList_SN              AS orderListSN,
                        Dress.Dress_Name             AS dressName,
                        OL.DressQuantity             AS dressQuantity,
                        OL.Details                   AS orderDetails,
                        MT.Measurement_GroupID       AS groupID,
                        MT.MeasurementTypeID,
                        MT.MeasurementType           AS measureType,
                        OM.Measurement               AS measureValue,
                        ISNULL(MT.Measurement_Group_SerialNo, 99999) AS groupSerial
                    FROM OrderList OL
                    INNER JOIN Dress             ON OL.DressID              = Dress.DressID
                    LEFT  JOIN Ordered_Measurement OM ON OL.OrderListID    = OM.OrderListID
                    LEFT  JOIN Measurement_Type MT    ON OM.MeasurementTypeID = MT.MeasurementTypeID
                    WHERE OL.OrderID = @OrderID AND OL.InstitutionID = @InstitutionID
                    ORDER BY OL.OrderList_SN, groupSerial, MT.Measurement_Group_SerialNo";

                // 4. Styles per OrderList item
                var styleQuery = @"
                    SELECT
                        ODS.OrderListID,
                        DS.Dress_Style_Name         AS styleName,
                        ODS.DressStyleMesurement    AS styleMeasurement,
                        DSC.Dress_Style_Category_Name AS categoryName,
                        ISNULL(DSC.CategorySerial, 99999) AS categorySerial,
                        ISNULL(DS.StyleSerial, 99999)      AS styleSerial
                    FROM Ordered_Dress_Style ODS
                    INNER JOIN Dress_Style DS      ON ODS.Dress_StyleID          = DS.Dress_StyleID
                    INNER JOIN Dress_Style_Category DSC ON DS.Dress_Style_CategoryID = DSC.Dress_Style_CategoryID
                    INNER JOIN OrderList OL        ON ODS.OrderListID             = OL.OrderListID
                    WHERE OL.OrderID = @OrderID AND OL.InstitutionID = @InstitutionID
                    ORDER BY OL.OrderList_SN, categorySerial, styleSerial";

                // Build measurement groups per OrderListID
                var measByList  = new Dictionary<int, (string dressName, int dressQty, int sn, string details, List<object> items)>();
                using (var cmd = new Microsoft.Data.SqlClient.SqlCommand(measQuery, connection))
                {
                    cmd.Parameters.AddWithValue("@OrderID", orderId);
                    cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                    using var r = await cmd.ExecuteReaderAsync();
                    while (await r.ReadAsync())
                    {
                        var olId      = r.GetInt32(r.GetOrdinal("OrderListID"));
                        var dressName = r.IsDBNull(r.GetOrdinal("dressName")) ? "" : r.GetString(r.GetOrdinal("dressName"));
                        var qty       = r.IsDBNull(r.GetOrdinal("dressQuantity")) ? 0 : r.GetInt32(r.GetOrdinal("dressQuantity"));
                        var sn        = r.IsDBNull(r.GetOrdinal("orderListSN")) ? 0 : r.GetInt32(r.GetOrdinal("orderListSN"));
                        var details   = r.IsDBNull(r.GetOrdinal("orderDetails")) ? "" : r.GetString(r.GetOrdinal("orderDetails"));

                        if (!measByList.ContainsKey(olId))
                            measByList[olId] = (dressName, qty, sn, details, new List<object>());

                        // Only add measurement row if there's a value
                        if (!r.IsDBNull(r.GetOrdinal("MeasurementTypeID")))
                        {
                            measByList[olId].items.Add(new
                            {
                                groupID           = r.IsDBNull(r.GetOrdinal("groupID"))      ? 0  : r.GetInt32(r.GetOrdinal("groupID")),
                                measurementTypeID = r.GetInt32(r.GetOrdinal("MeasurementTypeID")),
                                type              = r.IsDBNull(r.GetOrdinal("measureType"))  ? "" : r.GetString(r.GetOrdinal("measureType")),
                                value             = r.IsDBNull(r.GetOrdinal("measureValue")) ? "" : r.GetString(r.GetOrdinal("measureValue"))
                            });
                        }
                    }
                }

                // Build styles per OrderListID
                var stylesByList = new Dictionary<int, List<object>>();
                using (var cmd = new Microsoft.Data.SqlClient.SqlCommand(styleQuery, connection))
                {
                    cmd.Parameters.AddWithValue("@OrderID", orderId);
                    cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                    using var r = await cmd.ExecuteReaderAsync();
                    while (await r.ReadAsync())
                    {
                        var olId = r.GetInt32(r.GetOrdinal("OrderListID"));
                        if (!stylesByList.ContainsKey(olId))
                            stylesByList[olId] = new List<object>();

                        stylesByList[olId].Add(new
                        {
                            name         = r.IsDBNull(r.GetOrdinal("styleName"))        ? "" : r.GetString(r.GetOrdinal("styleName")),
                            measurement  = r.IsDBNull(r.GetOrdinal("styleMeasurement")) ? "" : r.GetString(r.GetOrdinal("styleMeasurement")),
                            categoryName = r.IsDBNull(r.GetOrdinal("categoryName"))     ? "" : r.GetString(r.GetOrdinal("categoryName"))
                        });
                    }
                }

                // Assemble measurements array
                var measurements = measByList
                    .OrderBy(kv => kv.Value.sn)
                    .Select(kv => (object)new
                    {
                        orderListId          = kv.Key,
                        orderListSerialNumber = kv.Value.sn,
                        dressName            = kv.Value.dressName,
                        dressQuantity        = kv.Value.dressQty,
                        orderDetails         = kv.Value.details,
                        measurements         = kv.Value.items,
                        styles               = stylesByList.ContainsKey(kv.Key) ? stylesByList[kv.Key] : new List<object>()
                    })
                    .ToList();

                // 5. Previous due: sum of DueAmount for other Due/Partial orders of the same customer
                double previousDue = 0;
                if (header is not null)
                {
                    // Extract customerId from the header object via dynamic access
                    var headerDict = header as dynamic;
                    int custId = 0;
                    // Use the connection to query directly with orderId to get customerId
                    using (var cmd = new Microsoft.Data.SqlClient.SqlCommand(
                        @"SELECT ISNULL(SUM(o2.DueAmount), 0)
                          FROM [Order] o2
                          WHERE o2.CustomerID = (SELECT CustomerID FROM [Order] WHERE OrderID = @OrderID)
                            AND o2.InstitutionID = @InstitutionID
                            AND o2.OrderID <> @OrderID
                            AND o2.PaymentStatus IN ('Due', 'Partial')",
                        connection))
                    {
                        cmd.Parameters.AddWithValue("@OrderID", orderId);
                        cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                        var result = await cmd.ExecuteScalarAsync();
                        previousDue = result == null || result == DBNull.Value ? 0 : Convert.ToDouble(result);
                    }
                }

                return Ok(new
                {
                    success = true,
                    data    = new { header, orderItems, measurements, previousDue }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving money receipt details for order {OrderId}", orderId);
                return StatusCode(500, new { success = false, message = "An error occurred: " + ex.Message });
            }
        }

        /// <summary>
        /// Get measurements for an order list item
        /// </summary>
        [HttpGet("{orderId}/order-list/{orderListId}/measurements")]
        public async Task<ActionResult> GetOrderListMeasurements(int orderId, int orderListId, [FromQuery] int institutionId)
        {
            try
            {
                if (institutionId <= 0)
                    return BadRequest(new { success = false, message = "Invalid institution ID" });

                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new Microsoft.Data.SqlClient.SqlConnection(connectionString);
                await connection.OpenAsync();

                var query = @"
                    SELECT 
                        OM.MeasurementTypeID,
                        MT.MeasurementType,
                        OM.Measurement
                    FROM Ordered_Measurement OM
                    INNER JOIN Measurement_Type MT ON OM.MeasurementTypeID = MT.MeasurementTypeID
                    WHERE OM.OrderListID = @OrderListID AND OM.InstitutionID = @InstitutionID";

                var measurements = new List<object>();
                using var cmd = new Microsoft.Data.SqlClient.SqlCommand(query, connection);
                cmd.Parameters.AddWithValue("@OrderListID", orderListId);
                cmd.Parameters.AddWithValue("@InstitutionID", institutionId);

                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    measurements.Add(new
                    {
                        measurementTypeID = reader.GetInt32(reader.GetOrdinal("MeasurementTypeID")),
                        measurementType = reader.IsDBNull(reader.GetOrdinal("MeasurementType")) ? "" : reader.GetString(reader.GetOrdinal("MeasurementType")),
                        measurement = reader.IsDBNull(reader.GetOrdinal("Measurement")) ? "" : reader.GetString(reader.GetOrdinal("Measurement"))
                    });
                }

                return Ok(new { success = true, data = measurements });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving measurements for order list item {OrderListId}", orderListId);
                return StatusCode(500, new { success = false, message = "An error occurred while retrieving measurements" });
            }
        }

        /// <summary>
        /// Get styles for an order list item
        /// </summary>
        [HttpGet("{orderId}/order-list/{orderListId}/styles")]
        public async Task<ActionResult> GetOrderListStyles(int orderId, int orderListId, [FromQuery] int institutionId)
        {
            try
            {
                if (institutionId <= 0)
                    return BadRequest(new { success = false, message = "Invalid institution ID" });

                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new Microsoft.Data.SqlClient.SqlConnection(connectionString);
                await connection.OpenAsync();

                var query = @"
                    SELECT 
                        ODS.Dress_StyleID AS DressStyleId,
                        DS.Dress_Style_Name AS DressStyleName,
                        ODS.DressStyleMesurement AS DressStyleMeasurement
                    FROM Ordered_Dress_Style ODS
                    INNER JOIN Dress_Style DS ON ODS.Dress_StyleID = DS.Dress_StyleID
                    WHERE ODS.OrderListID = @OrderListID AND ODS.InstitutionID = @InstitutionID";

                var styles = new List<object>();
                using var cmd = new Microsoft.Data.SqlClient.SqlCommand(query, connection);
                cmd.Parameters.AddWithValue("@OrderListID", orderListId);
                cmd.Parameters.AddWithValue("@InstitutionID", institutionId);

                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    styles.Add(new
                    {
                        dressStyleId = reader.GetInt32(reader.GetOrdinal("DressStyleId")),
                        dressStyleName = reader.IsDBNull(reader.GetOrdinal("DressStyleName")) ? "" : reader.GetString(reader.GetOrdinal("DressStyleName")),
                        dressStyleMeasurement = reader.IsDBNull(reader.GetOrdinal("DressStyleMeasurement")) ? "" : reader.GetString(reader.GetOrdinal("DressStyleMeasurement"))
                    });
                }

                return Ok(new { success = true, data = styles });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving styles for order list item {OrderListId}", orderListId);
                return StatusCode(500, new { success = false, message = "An error occurred while retrieving styles" });
            }
        }

        /// <summary>
        /// Delete an order (only if no payment recorded)
        /// </summary>
        [HttpDelete("{orderId}/delete")]
        public async Task<ActionResult> DeleteOrder(int orderId, [FromQuery] int institutionId)
        {
            try
            {
                if (institutionId <= 0)
                    return BadRequest(new { success = false, message = "Invalid institution ID" });

                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new Microsoft.Data.SqlClient.SqlConnection(connectionString);
                await connection.OpenAsync();

                // Check paid amount
                using (var checkCmd = new Microsoft.Data.SqlClient.SqlCommand(
                    "SELECT ISNULL(PaidAmount,0) FROM [Order] WHERE OrderID = @OrderID AND InstitutionID = @InstitutionID",
                    connection))
                {
                    checkCmd.Parameters.AddWithValue("@OrderID", orderId);
                    checkCmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                    var paid = await checkCmd.ExecuteScalarAsync();
                    if (paid == null)
                        return NotFound(new { success = false, message = "Order not found" });

                    if (Convert.ToDouble(paid) > 0)
                        return BadRequest(new { success = false, message = "Cannot delete order with paid amount" });
                }

                using var transaction = connection.BeginTransaction();
                try
                {
                    // Delete dependent records
                    foreach (var sql in new[]
                    {
                        "DELETE OM FROM Ordered_Measurement OM INNER JOIN OrderList OL ON OM.OrderListID = OL.OrderListID WHERE OL.OrderID = @OrderID",
                        "DELETE ODS FROM Ordered_Dress_Style ODS INNER JOIN OrderList OL ON ODS.OrderListID = OL.OrderListID WHERE OL.OrderID = @OrderID",
                        "DELETE OP FROM Order_Payment OP WHERE OP.OrderID = @OrderID",
                        "DELETE FROM OrderList WHERE OrderID = @OrderID",
                        "DELETE FROM [Order] WHERE OrderID = @OrderID AND InstitutionID = @InstitutionID"
                    })
                    {
                        using var cmd = new Microsoft.Data.SqlClient.SqlCommand(sql, connection, transaction);
                        cmd.Parameters.AddWithValue("@OrderID", orderId);
                        if (sql.Contains("@InstitutionID"))
                            cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                        await cmd.ExecuteNonQueryAsync();
                    }

                    transaction.Commit();
                    return Ok(new { success = true, message = "Order deleted successfully" });
                }
                catch (Exception ex)
                {
                    transaction.Rollback();
                    _logger.LogError(ex, "Transaction failed when deleting order {OrderId}", orderId);
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting order {OrderId}", orderId);
                return StatusCode(500, new { success = false, message = "An error occurred while deleting order: " + ex.Message });
            }
        }

        /// <summary>Get next order serial number for the institution</summary>
        [HttpGet("next-number")]
        public async Task<ActionResult> GetNextOrderNumber([FromQuery] int institutionId)
        {
            try
            {
                if (institutionId <= 0)
                    return BadRequest(new { success = false, message = "Invalid institution ID" });

                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new Microsoft.Data.SqlClient.SqlConnection(connectionString);
                await connection.OpenAsync();

                using var cmd = new Microsoft.Data.SqlClient.SqlCommand(
                    "DECLARE @n int; EXEC @n = [dbo].[Sp_GetUpdatedOrderNo] @InstitutionID; SELECT @n AS OrderNo",
                    connection);
                cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                var result = await cmd.ExecuteScalarAsync();
                return Ok(new { success = true, data = Convert.ToInt32(result) });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting next order number for institution {InstitutionId}", institutionId);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>Get discount limit percentage for the institution</summary>
        [HttpGet("discount-limit")]
        public async Task<ActionResult> GetDiscountLimit([FromQuery] int institutionId)
        {
            try
            {
                if (institutionId <= 0)
                    return BadRequest(new { success = false, message = "Invalid institution ID" });

                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new Microsoft.Data.SqlClient.SqlConnection(connectionString);
                await connection.OpenAsync();

                using var cmd = new Microsoft.Data.SqlClient.SqlCommand(
                    "SELECT ISNULL(Discount_Limit, 0) FROM Institution WHERE InstitutionID = @InstitutionID",
                    connection);
                cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                var result = await cmd.ExecuteScalarAsync();
                return Ok(new { success = true, data = Convert.ToInt32(result ?? 0) });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting discount limit for institution {InstitutionId}", institutionId);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>Submit a quick order (insert order + order list + payment)</summary>
        [HttpPost("quick-order")]
        public async Task<ActionResult> PostQuickOrder([FromBody] QuickOrderRequest model)
        {
            if (model == null || model.InstitutionId <= 0 || model.CustomerId <= 0)
                return BadRequest(new { success = false, message = "Invalid request" });

            var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
            using var connection = new Microsoft.Data.SqlClient.SqlConnection(connectionString);
            await connection.OpenAsync();
            using var transaction = connection.BeginTransaction();

            try
            {
                // ── 1. Insert Order ──────────────────────────────────────────
                int orderId;
                var orderSql = string.IsNullOrWhiteSpace(model.OrderSn)
                    ? @"DECLARE @n int; EXEC @n = [dbo].[Sp_GetUpdatedOrderNo] @InstitutionID;
                        INSERT INTO [Order] (CustomerID,RegistrationID,InstitutionID,Cloth_For_ID,OrderDate,OrderSerialNumber,DeliveryDate)
                        VALUES (@CustomerID,@RegistrationID,@InstitutionID,@ClothForId,GETDATE(),@n,@DeliveryDate);
                        SELECT CAST(SCOPE_IDENTITY() AS INT);"
                    : @"INSERT INTO [Order] (CustomerID,RegistrationID,InstitutionID,Cloth_For_ID,OrderDate,OrderSerialNumber,DeliveryDate)
                        VALUES (@CustomerID,@RegistrationID,@InstitutionID,@ClothForId,GETDATE(),@orderNo,@DeliveryDate);
                        SELECT CAST(SCOPE_IDENTITY() AS INT);";

                using (var cmd = new Microsoft.Data.SqlClient.SqlCommand(orderSql, connection, transaction))
                {
                    cmd.Parameters.AddWithValue("@InstitutionID", model.InstitutionId);
                    cmd.Parameters.AddWithValue("@RegistrationID", model.RegistrationId);
                    cmd.Parameters.AddWithValue("@ClothForId", model.ClothForId);
                    cmd.Parameters.AddWithValue("@CustomerID", model.CustomerId);
                    cmd.Parameters.AddWithValue("@DeliveryDate", (object?)model.DeliveryDate ?? DBNull.Value);
                    if (!string.IsNullOrWhiteSpace(model.OrderSn))
                        cmd.Parameters.AddWithValue("@orderNo", model.OrderSn);
                    orderId = Convert.ToInt32(await cmd.ExecuteScalarAsync());
                }

                // ── 2. Insert OrderList items via SP_Order_Place ────────────
                foreach (var item in model.OrderList ?? new List<QuickOrderItem>())
                {
                    using var cmd = new Microsoft.Data.SqlClient.SqlCommand("SP_Order_Place", connection, transaction);
                    cmd.CommandType = System.Data.CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@InstitutionID",   model.InstitutionId);
                    cmd.Parameters.AddWithValue("@RegistrationID",  model.RegistrationId);
                    cmd.Parameters.AddWithValue("@Cloth_For_ID",    model.ClothForId);
                    cmd.Parameters.AddWithValue("@CustomerID",      model.CustomerId);
                    cmd.Parameters.AddWithValue("@OrderID",         orderId);
                    cmd.Parameters.AddWithValue("@DressID",         item.DressId);
                    cmd.Parameters.AddWithValue("@List_Measurement", item.ListMeasurement ?? "[]");
                    cmd.Parameters.AddWithValue("@List_Style",       item.ListStyle ?? "[]");
                    cmd.Parameters.AddWithValue("@List_payment",     item.ListPayment ?? "[]");
                    cmd.Parameters.AddWithValue("@DressQuantity",    item.DressQuantity);
                    cmd.Parameters.AddWithValue("@Details",          item.Details ?? "");
                    await cmd.ExecuteNonQueryAsync();
                }

                // ── 3. Insert Payment record ───────────────────────────────
                if (model.PaidAmount > 0)
                {
                    using var cmd = new Microsoft.Data.SqlClient.SqlCommand(
                        @"INSERT INTO Payment_Record(OrderID,CustomerID,RegistrationID,InstitutionID,Amount,Payment_TimeStatus,AccountID)
                          VALUES(@OrderID,@CustomerID,@RegistrationID,@InstitutionID,@Amount,'Advance',@AccountID)",
                        connection, transaction);
                    cmd.Parameters.AddWithValue("@OrderID",         orderId);
                    cmd.Parameters.AddWithValue("@CustomerID",      model.CustomerId);
                    cmd.Parameters.AddWithValue("@RegistrationID",  model.RegistrationId);
                    cmd.Parameters.AddWithValue("@InstitutionID",   model.InstitutionId);
                    cmd.Parameters.AddWithValue("@Amount",          model.PaidAmount);
                    cmd.Parameters.AddWithValue("@AccountID",       model.AccountId);
                    await cmd.ExecuteNonQueryAsync();
                }

                // ── 4. Update Discount ────────────────────────────────────
                if (model.Discount > 0)
                {
                    using var cmd = new Microsoft.Data.SqlClient.SqlCommand(
                        "UPDATE [Order] SET Discount = @Discount WHERE OrderID = @OrderID",
                        connection, transaction);
                    cmd.Parameters.AddWithValue("@Discount", model.Discount);
                    cmd.Parameters.AddWithValue("@OrderID",  orderId);
                    await cmd.ExecuteNonQueryAsync();
                }

                transaction.Commit();
                _logger.LogInformation("Quick order created: OrderID={id}, InstitutionID={inst}", orderId, model.InstitutionId);
                return Ok(new { success = true, data = new { orderId } });
            }
            catch (Exception ex)
            {
                transaction.Rollback();
                _logger.LogError(ex, "Error creating quick order for institution {InstitutionId}", model.InstitutionId);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

    }

    // ── Request models ──────────────────────────────────────────────────────
    public class QuickOrderRequest
    {
        public string?  OrderSn        { get; set; }
        public int      ClothForId     { get; set; }
        public int      CustomerId     { get; set; }
        public int      InstitutionId  { get; set; }
        public int      RegistrationId { get; set; }
        public double   OrderAmount    { get; set; }
        public double   Discount       { get; set; }
        public double   PaidAmount     { get; set; }
        public int      AccountId      { get; set; }
        public DateTime? DeliveryDate  { get; set; }
        public List<QuickOrderItem>? OrderList { get; set; }
    }

    public class QuickOrderItem
    {
        public int    DressId         { get; set; }
        public int    DressQuantity   { get; set; }
        public string? Details        { get; set; }
        public string? ListMeasurement { get; set; }
        public string? ListStyle       { get; set; }
        public string? ListPayment     { get; set; }
    }

    public class FinishOrderRequest
    {
        public int      OrderId        { get; set; }
        public int      InstitutionId  { get; set; }
        public int      RegistrationId { get; set; }
        public string?  DeliveryDate   { get; set; }
        public double   Discount       { get; set; }
        public double   PaidAmount     { get; set; }
        public int?     AccountId      { get; set; }
    }
}
