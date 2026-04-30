using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DeliveryController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<DeliveryController> _logger;

        public DeliveryController(IConfiguration configuration, ILogger<DeliveryController> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Get incomplete work orders
        /// </summary>
        [HttpGet("incomplete-works")]
        public async Task<ActionResult> GetIncompleteWorks(
            [FromQuery] int institutionId,
            [FromQuery] string? phone = null,
            [FromQuery] string? orderSerialNumbers = null,
            [FromQuery] string? customerName = null,
            [FromQuery] string? address = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25)
        {
            try
            {
                if (institutionId <= 0)
                    return BadRequest(new { success = false, message = "Invalid institution ID" });

                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                var query = @"
                    SELECT 
                        [Order].OrderID, 
                        [Order].OrderSerialNumber,
                        [Order].OrderDate,
                        [Order].DeliveryDate,
                        [Order].WorkStatus,
                        [Order].OrderAmount,
                        [Order].StoreDatails,
                        [Order].Details,
                        Customer.CustomerID,
                        Customer.CustomerNumber,
                        Customer.CustomerName,
                        Customer.Phone,
                        Customer.Address,
                        SMS.Masking,
                        SMS.SMS_Balance,
                        Institution.InstitutionName,
                        STUFF((
                            SELECT '|' + D.Dress_Name + '~' + CAST(OL2.DressQuantity AS NVARCHAR(10)) + '~' + CAST(OL2.Pending_Work AS NVARCHAR(10))
                            FROM OrderList OL2
                            INNER JOIN Dress D ON OL2.DressID = D.DressID
                            WHERE OL2.OrderID = [Order].OrderID
                            ORDER BY OL2.OrderList_SN
                            FOR XML PATH('')
                        ), 1, 1, '') AS DressItems
                    FROM [Order]
                    INNER JOIN Customer ON [Order].CustomerID = Customer.CustomerID
                    INNER JOIN SMS ON Customer.InstitutionID = SMS.InstitutionID
                    INNER JOIN Institution ON [Order].InstitutionID = Institution.InstitutionID
                    WHERE ([Order].InstitutionID = @InstitutionID) 
                    AND ([Order].DeliveryStatus IN (N'Pending', N'PartlyDelivered'))
                    AND ([Order].WorkStatus IN (N'incomplete', N'PartlyCompleted'))
                    AND (Customer.Phone LIKE '%' + @Phone + '%')
                    AND (CAST([OrderSerialNumber] AS NVARCHAR(50)) IN (SELECT id FROM dbo.In_Function_Parameter(@OrderSerialNumber)) OR @OrderSerialNumber = '0')
                    AND ([Order].DeliveryDate BETWEEN ISNULL(@StartDate, '1-1-1760') AND ISNULL(@EndDate, '1-1-3760'))
                    AND (ISNULL(Customer.CustomerName, '') LIKE '%' + @CustomerName + '%')
                    AND (ISNULL(Customer.Address, '') LIKE '%' + @Address + '%')
                    ORDER BY 
                        (CASE WHEN [Order].DeliveryDate = CAST(GETDATE() AS DATE) THEN 0 ELSE 1 END),
                        ISNULL([Order].DeliveryDate, '1-1-3000')
                    OFFSET @Offset ROWS
                    FETCH NEXT @PageSize ROWs ONLY";

                var countQuery = @"
                    SELECT COUNT(*)
                    FROM [Order]
                    INNER JOIN Customer ON [Order].CustomerID = Customer.CustomerID
                    WHERE ([Order].InstitutionID = @InstitutionID) 
                    AND ([Order].DeliveryStatus IN (N'Pending', N'PartlyDelivered'))
                    AND ([Order].WorkStatus IN (N'incomplete', N'PartlyCompleted'))
                    AND (Customer.Phone LIKE '%' + @Phone + '%')
                    AND (CAST([OrderSerialNumber] AS NVARCHAR(50)) IN (SELECT id FROM dbo.In_Function_Parameter(@OrderSerialNumber)) OR @OrderSerialNumber = '0')
                    AND ([Order].DeliveryDate BETWEEN ISNULL(@StartDate, '1-1-1760') AND ISNULL(@EndDate, '1-1-3760'))
                    AND (ISNULL(Customer.CustomerName, '') LIKE '%' + @CustomerName + '%')
                    AND (ISNULL(Customer.Address, '') LIKE '%' + @Address + '%')";

                // Get total count
                int totalCount = 0;
                using (var countCmd = new SqlCommand(countQuery, connection))
                {
                    countCmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                    countCmd.Parameters.AddWithValue("@Phone", phone ?? "");
                    countCmd.Parameters.AddWithValue("@OrderSerialNumber", orderSerialNumbers ?? "0");
                    countCmd.Parameters.AddWithValue("@StartDate", startDate.HasValue ? (object)startDate.Value : DBNull.Value);
                    countCmd.Parameters.AddWithValue("@EndDate", endDate.HasValue ? (object)endDate.Value : DBNull.Value);
                    countCmd.Parameters.AddWithValue("@CustomerName", customerName ?? "");
                    countCmd.Parameters.AddWithValue("@Address", address ?? "");

                    totalCount = (int)await countCmd.ExecuteScalarAsync();
                }

                // Get paginated results
                var orders = new List<dynamic>();
                using (var cmd = new SqlCommand(query, connection))
                {
                    cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                    cmd.Parameters.AddWithValue("@Phone", phone ?? "");
                    cmd.Parameters.AddWithValue("@OrderSerialNumber", orderSerialNumbers ?? "0");
                    cmd.Parameters.AddWithValue("@StartDate", startDate.HasValue ? (object)startDate.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("@EndDate", endDate.HasValue ? (object)endDate.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("@CustomerName", customerName ?? "");
                    cmd.Parameters.AddWithValue("@Address", address ?? "");
                    cmd.Parameters.AddWithValue("@Offset", (page - 1) * pageSize);
                    cmd.Parameters.AddWithValue("@PageSize", pageSize);

                    using var reader = await cmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        DateTime? deliveryDate = null;
                        if (!reader.IsDBNull(reader.GetOrdinal("DeliveryDate")))
                        {
                            deliveryDate = reader.GetDateTime(reader.GetOrdinal("DeliveryDate"));
                        }

                        var isToday = deliveryDate.HasValue && deliveryDate.Value.Date == DateTime.Today;
                        var isOverdue = deliveryDate.HasValue && deliveryDate.Value.Date < DateTime.Today;
                        var isPartlyCompleted = reader.GetString(reader.GetOrdinal("WorkStatus")) == "PartlyCompleted";

                        orders.Add(new
                        {
                            orderId = reader.GetInt32(reader.GetOrdinal("OrderID")),
                            orderSerialNumber = Convert.ToInt32(reader.GetValue(reader.GetOrdinal("OrderSerialNumber"))),
                            orderDate = reader.GetDateTime(reader.GetOrdinal("OrderDate")),
                            deliveryDate = deliveryDate,
                            workStatus = reader.GetString(reader.GetOrdinal("WorkStatus")),
                            orderAmount = reader.IsDBNull(reader.GetOrdinal("OrderAmount")) ? 0.0 : reader.GetDouble(reader.GetOrdinal("OrderAmount")),
                            storeDetails = reader.IsDBNull(reader.GetOrdinal("StoreDatails")) ? "" : reader.GetString(reader.GetOrdinal("StoreDatails")),
                            details = reader.IsDBNull(reader.GetOrdinal("Details")) ? "" : reader.GetString(reader.GetOrdinal("Details")),
                            customerId = reader.GetInt32(reader.GetOrdinal("CustomerID")),
                            customerNumber = reader.IsDBNull(reader.GetOrdinal("CustomerNumber")) ? "" : reader.GetValue(reader.GetOrdinal("CustomerNumber")).ToString(),
                            customerName = reader.GetString(reader.GetOrdinal("CustomerName")),
                            phone = reader.IsDBNull(reader.GetOrdinal("Phone")) ? "" : reader.GetString(reader.GetOrdinal("Phone")),
                            address = reader.IsDBNull(reader.GetOrdinal("Address")) ? "" : reader.GetString(reader.GetOrdinal("Address")),
                            masking = reader.IsDBNull(reader.GetOrdinal("Masking")) ? "" : reader.GetString(reader.GetOrdinal("Masking")),
                            smsBalance = reader.IsDBNull(reader.GetOrdinal("SMS_Balance")) ? 0 : Convert.ToInt32(reader.GetValue(reader.GetOrdinal("SMS_Balance"))),
                            institutionName = reader.IsDBNull(reader.GetOrdinal("InstitutionName")) ? "" : reader.GetString(reader.GetOrdinal("InstitutionName")),
                            isToday = isToday,
                            isOverdue = isOverdue,
                            isPartlyCompleted = isPartlyCompleted,
                            dressItems = ParseDressItems(reader.IsDBNull(reader.GetOrdinal("DressItems")) ? "" : reader.GetString(reader.GetOrdinal("DressItems")))
                        });
                    }
                }

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        totalCount = totalCount,
                        orders = orders
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting incomplete works");
                return StatusCode(500, new { success = false, message = "Error loading incomplete works: " + ex.Message });
            }
        }

        /// <summary>
        /// Get order list items with pending work
        /// </summary>
        [HttpGet("incomplete-works/{orderId}/order-list")]
        public async Task<ActionResult> GetIncompleteOrderList([FromRoute] int orderId, [FromQuery] int institutionId)
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                var query = @"
                    SELECT 
                        OrderList.OrderListID,
                        OrderList.OrderList_SN,
                        Dress.Dress_Name,
                        OrderList.DressQuantity,
                        OrderList.Pending_Work
                    FROM OrderList
                    INNER JOIN Dress ON OrderList.DressID = Dress.DressID
                    WHERE (OrderList.OrderID = @OrderID) 
                    AND (OrderList.Pending_Work <> 0)
                    ORDER BY OrderList.OrderList_SN";

                var orderListItems = new List<dynamic>();
                using (var cmd = new SqlCommand(query, connection))
                {
                    cmd.Parameters.AddWithValue("@OrderID", orderId);

                    using var reader = await cmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        orderListItems.Add(new
                        {
                            orderListId = reader.GetInt32(reader.GetOrdinal("OrderListID")),
                            orderListSN = reader.IsDBNull(reader.GetOrdinal("OrderList_SN")) ? 0 : Convert.ToInt32(reader.GetValue(reader.GetOrdinal("OrderList_SN"))),
                            dressName = reader.GetString(reader.GetOrdinal("Dress_Name")),
                            dressQuantity = reader.GetInt32(reader.GetOrdinal("DressQuantity")),
                            pendingWork = reader.GetInt32(reader.GetOrdinal("Pending_Work"))
                        });
                    }
                }

                return Ok(new { success = true, data = orderListItems });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting incomplete order list for order {OrderId}", orderId);
                return StatusCode(500, new { success = false, message = "Error loading order list: " + ex.Message });
            }
        }

        /// <summary>
        /// Complete work for orders
        /// </summary>
        [HttpPost("complete-work")]
        public async Task<ActionResult> CompleteWork([FromBody] CompleteWorkModel model)
        {
            try
            {
                if (model.InstitutionId <= 0 || model.RegistrationId <= 0)
                    return BadRequest(new { success = false, message = "Invalid institution or registration ID" });

                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                using var transaction = connection.BeginTransaction();

                try
                {
                    foreach (var order in model.Orders)
                    {
                        if (order.OrderListItems == null || order.OrderListItems.Count == 0)
                            continue;

                        // Update order details
                        using (var cmd = new SqlCommand(
                            "UPDATE [Order] SET StoreDatails = @StoreDatails, Details = @Details WHERE (OrderID = @OrderID)",
                            connection, transaction))
                        {
                            cmd.Parameters.AddWithValue("@OrderID", order.OrderId);
                            cmd.Parameters.AddWithValue("@StoreDatails", order.StoreDetails ?? "");
                            cmd.Parameters.AddWithValue("@Details", order.Details ?? "");
                            await cmd.ExecuteNonQueryAsync();
                        }

                        // Insert work complete records
                        foreach (var orderListItem in order.OrderListItems)
                        {
                            if (orderListItem.CompletedQuantity <= 0)
                                continue;

                            using (var cmd = new SqlCommand(
                                "INSERT INTO Order_WorkComplete_Date(InstitutionID, RegistrationID, OrderID, OrderListID, WCQuantity) " +
                                "VALUES (@InstitutionID, @RegistrationID, @OrderID, @OrderListID, @WCQuantity)",
                                connection, transaction))
                            {
                                cmd.Parameters.AddWithValue("@InstitutionID", model.InstitutionId);
                                cmd.Parameters.AddWithValue("@RegistrationID", model.RegistrationId);
                                cmd.Parameters.AddWithValue("@OrderID", order.OrderId);
                                cmd.Parameters.AddWithValue("@OrderListID", orderListItem.OrderListId);
                                cmd.Parameters.AddWithValue("@WCQuantity", orderListItem.CompletedQuantity);
                                await cmd.ExecuteNonQueryAsync();
                            }
                        }
                    }

                    transaction.Commit();

                    // Send SMS after transaction commit
                    var smsErrors = new List<string>();
                    foreach (var order in model.Orders)
                    {
                        if (!order.SendSMS || order.OrderListItems == null || order.OrderListItems.Count == 0)
                            continue;

                        try
                        {
                            await SendCompletedWorkSmsAsync(connection, model.InstitutionId, order);
                        }
                        catch (Exception smsEx)
                        {
                            _logger.LogWarning(smsEx, "SMS sending failed for order {OrderId}", order.OrderId);
                            smsErrors.Add($"অর্ডার {order.OrderId}: {smsEx.Message}");
                        }
                    }

                    var message = "অর্ডারের কাজ সফলভাবে সম্পূর্ণ হয়েছে";
                    if (smsErrors.Count > 0)
                        message += $". SMS পাঠাতে সমস্যা: {string.Join("; ", smsErrors)}";

                    return Ok(new { success = true, message });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in transaction");
                    transaction.Rollback();
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error completing work");
                return StatusCode(500, new { success = false, message = "Error completing work: " + ex.Message });
            }
        }

        /// <summary>
        /// Send SMS after completing work. Uses custom template if exists, otherwise default message.
        /// Default: "প্রিয় গ্রাহক, আপনার অর্ডারকৃত {items} তৈরি হয়েছে। অর্ডার নং {SN}। {InstitutionName}"
        /// </summary>
        private async Task SendCompletedWorkSmsAsync(SqlConnection connection, int institutionId, OrderCompleteModel order)
        {
            // Get order info: phone, masking, smsBalance, orderSerialNumber, institutionName, customerId
            string phone = "", masking = "", institutionName = "";
            int smsBalance = 0, orderSerialNumber = 0, customerId = 0;

            using (var cmd = new SqlCommand(
                @"SELECT Customer.Phone, SMS.Masking, SMS.SMS_Balance, [Order].OrderSerialNumber,
                         Institution.InstitutionName, Customer.CustomerID
                  FROM [Order]
                  INNER JOIN Customer ON [Order].CustomerID = Customer.CustomerID
                  INNER JOIN SMS ON [Order].InstitutionID = SMS.InstitutionID
                  INNER JOIN Institution ON [Order].InstitutionID = Institution.InstitutionID
                  WHERE [Order].OrderID = @OrderID AND [Order].InstitutionID = @InstitutionID",
                connection))
            {
                cmd.Parameters.AddWithValue("@OrderID", order.OrderId);
                cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                using var reader = await cmd.ExecuteReaderAsync();
                if (!await reader.ReadAsync()) return;
                phone = reader.IsDBNull(0) ? "" : reader.GetString(0);
                masking = reader.IsDBNull(1) ? "" : reader.GetString(1);
                smsBalance = reader.IsDBNull(2) ? 0 : Convert.ToInt32(reader.GetValue(2));
                orderSerialNumber = reader.IsDBNull(3) ? 0 : Convert.ToInt32(reader.GetValue(3));
                institutionName = reader.IsDBNull(4) ? "" : reader.GetString(4);
                customerId = reader.IsDBNull(5) ? 0 : reader.GetInt32(5);
            }

            if (string.IsNullOrEmpty(phone)) return;

            // Validate phone
            var digits = new string(phone.Where(char.IsDigit).ToArray());
            if (digits.Length < 10) return;

            // Build order list text for SMS (e.g. "২ টি শার্ট, ১ টি প্যান্ট")
            string orderListSms = "";
            if (!string.IsNullOrEmpty(order.SmsOrderListText))
            {
                orderListSms = order.SmsOrderListText;
            }
            else
            {
                // Build from order list items
                var dressParts = new List<string>();
                foreach (var item in order.OrderListItems)
                {
                    if (item.CompletedQuantity <= 0) continue;
                    using var cmd = new SqlCommand(
                        "SELECT Dress.Dress_Name FROM OrderList INNER JOIN Dress ON OrderList.DressID = Dress.DressID WHERE OrderList.OrderListID = @ID",
                        connection);
                    cmd.Parameters.AddWithValue("@ID", item.OrderListId);
                    var dressName = await cmd.ExecuteScalarAsync() as string ?? "";
                    if (!string.IsNullOrEmpty(dressName))
                        dressParts.Add($"{item.CompletedQuantity} টি {dressName}");
                }
                orderListSms = string.Join(", ", dressParts);
            }

            // Build SMS text: use custom template if provided, else check DB template, else default
            string textSms;

            if (!string.IsNullOrWhiteSpace(order.CustomSmsMessage))
            {
                textSms = order.CustomSmsMessage;
            }
            else
            {
                // Check if institution has a template for "CompletedWork"
                string? templateText = null;
                using (var cmd = new SqlCommand(
                    "SELECT TOP 1 TemplateText FROM SMS_Template WHERE InstitutionID = @IID AND TemplateFor = 'CompletedWork' ORDER BY SMS_TemplateID",
                    connection))
                {
                    cmd.Parameters.AddWithValue("@IID", institutionId);
                    templateText = await cmd.ExecuteScalarAsync() as string;
                }

                if (!string.IsNullOrWhiteSpace(templateText))
                {
                    // Replace placeholders: {items}, {orderNo}, {institutionName}
                    textSms = templateText
                        .Replace("{items}", orderListSms)
                        .Replace("{orderNo}", orderSerialNumber.ToString())
                        .Replace("{institutionName}", institutionName);
                }
                else
                {
                    // Default message (same as old system)
                    textSms = $"প্রিয় গ্রাহক, আপনার অর্ডারকৃত {orderListSms} তৈরি হয়েছে। অর্ডার নং {orderSerialNumber}। {institutionName}";
                }
            }

            // Count SMS
            bool isUnicode = textSms.Any(c => c > 0xFF);
            int perSms = isUnicode ? 70 : 160;
            int smsCount = Math.Max(1, (int)Math.Ceiling((double)textSms.Length / perSms));

            if (smsBalance < smsCount)
            {
                _logger.LogWarning("Insufficient SMS balance for order {OrderId}. Balance: {Balance}, Required: {Count}", order.OrderId, smsBalance, smsCount);
                return;
            }

            // Send SMS via GreenWeb
            using var http = new System.Net.Http.HttpClient();
            var content = new System.Net.Http.FormUrlEncodedContent(new Dictionary<string, string>
            {
                { "token",   "90282141541680536514c64f44771ad21951c8b207c2dcf341b0" },
                { "to",      phone },
                { "message", textSms }
            });
            var res = await http.PostAsync("https://api.greenweb.com.bd/api.php?json", content);
            var body = await res.Content.ReadAsStringAsync();

            bool sent = false;
            try
            {
                using var doc = System.Text.Json.JsonDocument.Parse(body);
                var status = doc.RootElement[0].GetProperty("status").GetString();
                sent = status == "SENT";
            }
            catch { sent = false; }

            if (sent)
            {
                var smsSendId = Guid.NewGuid();
                using (var cmd = new SqlCommand(
                    "INSERT INTO SMS_Send_Record (SMS_Send_ID, PhoneNumber, TextSMS, TextCount, SMSCount, PurposeOfSMS, Status, Date, SMS_Response) " +
                    "VALUES (@ID, @Phone, @Text, @TextLen, @SmsCount, 'Completed Work', 'Sent', GETDATE(), @Response)",
                    connection))
                {
                    cmd.Parameters.AddWithValue("@ID", smsSendId);
                    cmd.Parameters.AddWithValue("@Phone", phone);
                    cmd.Parameters.AddWithValue("@Text", textSms);
                    cmd.Parameters.AddWithValue("@TextLen", (float)textSms.Length);
                    cmd.Parameters.AddWithValue("@SmsCount", (float)smsCount);
                    cmd.Parameters.AddWithValue("@Response", body);
                    await cmd.ExecuteNonQueryAsync();
                }

                if (customerId > 0)
                {
                    using var cmd = new SqlCommand(
                        "INSERT INTO SMS_OtherInfo (SMS_Send_ID, InstitutionID, CustomerID) VALUES (@ID, @IID, @CID)",
                        connection);
                    cmd.Parameters.AddWithValue("@ID", smsSendId);
                    cmd.Parameters.AddWithValue("@IID", institutionId);
                    cmd.Parameters.AddWithValue("@CID", customerId);
                    await cmd.ExecuteNonQueryAsync();
                }
            }
        }

        /// <summary>
        /// Get search suggestions for customer fields
        /// </summary>
        [HttpGet("search-suggestions")]
        public async Task<IActionResult> GetSearchSuggestions([FromQuery] string field, [FromQuery] string term, [FromQuery] int institutionId)
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                string query = "";
                switch (field.ToLower())
                {
                    case "phone":
                        query = @"SELECT DISTINCT TOP 10 Phone 
                                 FROM Customer 
                                 WHERE InstitutionID = @InstitutionID 
                                 AND Phone LIKE '%' + @Term + '%'
                                 ORDER BY Phone";
                        break;

                    case "customername":
                        query = @"SELECT DISTINCT TOP 10 CustomerName 
                                 FROM Customer 
                                 WHERE InstitutionID = @InstitutionID 
                                 AND CustomerName LIKE '%' + @Term + '%'
                                 ORDER BY CustomerName";
                        break;

                    case "address":
                        query = @"SELECT DISTINCT TOP 10 Address 
                                 FROM Customer 
                                 WHERE InstitutionID = @InstitutionID 
                                 AND Address IS NOT NULL 
                                 AND Address LIKE '%' + @Term + '%'
                                 ORDER BY Address";
                        break;

                    case "orderno":
                    case "orderserialnumber":
                        query = @"SELECT DISTINCT TOP 10 CAST(OrderSerialNumber AS NVARCHAR(50)) AS OrderSerialNumber
                                 FROM [Order]
                                 WHERE InstitutionID = @InstitutionID
                                 AND CAST(OrderSerialNumber AS NVARCHAR(50)) LIKE '%' + @Term + '%'
                                 ORDER BY OrderSerialNumber";
                        break;

                    default:
                        return BadRequest(new { success = false, message = "Invalid field" });
                }

                var suggestions = new List<string>();
                using (var cmd = new SqlCommand(query, connection))
                {
                    cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                    cmd.Parameters.AddWithValue("@Term", term ?? "");

                    using var reader = await cmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        var value = reader.GetString(0);
                        if (!string.IsNullOrEmpty(value))
                        {
                            suggestions.Add(value);
                        }
                    }
                }

                return Ok(new { success = true, data = suggestions });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching search suggestions");
                return StatusCode(500, new { success = false, message = "Failed to fetch suggestions", error = ex.Message });
            }
        }

        /// <summary>
        /// Get ready-to-deliver orders (work completed)
        /// </summary>
        [HttpGet("ready-orders")]
        public async Task<ActionResult> GetReadyOrders(
            [FromQuery] int institutionId,
            [FromQuery] string? phone = null,
            [FromQuery] string? orderSerialNumbers = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25)
        {
            try
            {
                if (institutionId <= 0)
                    return BadRequest(new { success = false, message = "Invalid institution ID" });

                _logger.LogInformation("Getting ready orders for institution {InstitutionId}, phone={Phone}, orders={OrderNumbers}", 
                    institutionId, phone, orderSerialNumbers);

                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                var query = @"
                    SELECT 
                        [Order].OrderID, 
                        [Order].OrderSerialNumber,
                        [Order].OrderDate,
                        [Order].DeliveryDate,
                        [Order].OrderAmount,
                        [Order].PaidAmount,
                        [Order].DueAmount,
                        [Order].StoreDatails,
                        [Order].Details,
                        Customer.CustomerID,
                        Customer.CustomerName,
                        Customer.Phone,
                        Customer.Address,
                        SMS.Masking,
                        SMS.SMS_Balance,
                        Institution.InstitutionName,
                        CASE 
                            WHEN EXISTS (SELECT 1 FROM OrderList WHERE OrderID = [Order].OrderID AND Pending_Work <> 0) 
                            THEN N'PartlyCompleted'
                            ELSE N'completed'
                        END AS WorkStatus
                    FROM [Order]
                    INNER JOIN Customer ON [Order].CustomerID = Customer.CustomerID
                    INNER JOIN SMS ON [Order].InstitutionID = SMS.InstitutionID
                    INNER JOIN Institution ON [Order].InstitutionID = Institution.InstitutionID
                    WHERE ([Order].InstitutionID = @InstitutionID) 
                    AND ([Order].DeliveryStatus IN (N'Pending', N'PartlyDelivered'))
                    AND (
                        ([Order].WorkStatus IN (N'completed', N'PartlyCompleted'))
                        OR
                        (NOT EXISTS (SELECT 1 FROM OrderList WHERE OrderID = [Order].OrderID AND Pending_Work <> 0))
                    )
                    AND (Customer.Phone LIKE '%' + @Phone + '%')
                    AND (CAST([OrderSerialNumber] AS NVARCHAR(50)) IN (SELECT id FROM dbo.In_Function_Parameter(@OrderSerialNumber)) OR @OrderSerialNumber = '0')
                    AND ([Order].DeliveryDate BETWEEN ISNULL(@StartDate, '1-1-1760') AND ISNULL(@EndDate, '1-1-3760'))
                    ORDER BY [Order].DeliveryDate
                    OFFSET @Offset ROWS
                    FETCH NEXT @PageSize ROWS ONLY";

                var orders = new List<ReadyOrderModel>();
                using (var cmd = new SqlCommand(query, connection))
                {
                    cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                    cmd.Parameters.AddWithValue("@Phone", phone ?? "");
                    cmd.Parameters.AddWithValue("@OrderSerialNumber", orderSerialNumbers ?? "0");
                    cmd.Parameters.AddWithValue("@StartDate", startDate.HasValue ? (object)startDate.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("@EndDate", endDate.HasValue ? (object)endDate.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("@Offset", (page - 1) * pageSize);
                    cmd.Parameters.AddWithValue("@PageSize", pageSize);

                    using var reader = await cmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        orders.Add(new ReadyOrderModel
                        {
                            OrderId = reader.GetInt32(reader.GetOrdinal("OrderID")),
                            OrderSerialNumber = Convert.ToInt32(reader.GetValue(reader.GetOrdinal("OrderSerialNumber"))),
                            OrderDate = reader.GetDateTime(reader.GetOrdinal("OrderDate")),
                            DeliveryDate = reader.IsDBNull(reader.GetOrdinal("DeliveryDate")) ? null : reader.GetDateTime(reader.GetOrdinal("DeliveryDate")),
                            WorkStatus = reader.GetString(reader.GetOrdinal("WorkStatus")),
                            OrderAmount = reader.IsDBNull(reader.GetOrdinal("OrderAmount")) ? 0.0 : reader.GetDouble(reader.GetOrdinal("OrderAmount")),
                            PaidAmount = reader.IsDBNull(reader.GetOrdinal("PaidAmount")) ? 0.0 : reader.GetDouble(reader.GetOrdinal("PaidAmount")),
                            DueAmount = reader.IsDBNull(reader.GetOrdinal("DueAmount")) ? 0.0 : reader.GetDouble(reader.GetOrdinal("DueAmount")),
                            StoreDetails = reader.IsDBNull(reader.GetOrdinal("StoreDatails")) ? "" : reader.GetString(reader.GetOrdinal("StoreDatails")),
                            Details = reader.IsDBNull(reader.GetOrdinal("Details")) ? "" : reader.GetString(reader.GetOrdinal("Details")),
                            CustomerId = reader.GetInt32(reader.GetOrdinal("CustomerID")),
                            CustomerName = reader.GetString(reader.GetOrdinal("CustomerName")),
                            Phone = reader.IsDBNull(reader.GetOrdinal("Phone")) ? "" : reader.GetString(reader.GetOrdinal("Phone")),
                            Address = reader.IsDBNull(reader.GetOrdinal("Address")) ? "" : reader.GetString(reader.GetOrdinal("Address")),
                            Masking = reader.IsDBNull(reader.GetOrdinal("Masking")) ? "" : reader.GetString(reader.GetOrdinal("Masking")),
                            SmsBalance = reader.IsDBNull(reader.GetOrdinal("SMS_Balance")) ? 0 : Convert.ToInt32(reader.GetValue(reader.GetOrdinal("SMS_Balance"))),
                            InstitutionName = reader.IsDBNull(reader.GetOrdinal("InstitutionName")) ? "" : reader.GetString(reader.GetOrdinal("InstitutionName")),
                            DressDetails = ""
                        });
                    }
                }

                // Get dress details for each order
                foreach (var order in orders)
                    order.DressDetails = await GetOrderDressDetailsBanglaAsync(connection, order.OrderId);

                _logger.LogInformation("Found {Count} ready orders", orders.Count);
                return Ok(new { success = true, data = new { orders = orders } });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting ready orders");
                return StatusCode(500, new { success = false, message = "Error loading ready orders: " + ex.Message });
            }
        }

        /// <summary>
        /// Send SMS for ready-to-deliver orders (Ready For Delivery).
        /// Default: "Dear Sir, Your Dress {items} is Ready to Deliver. Order No. {orderNo}. {institutionName}"
        /// Template: TemplateFor = 'ReadyForDelivery', Placeholders: {items}, {orderNo}, {institutionName}
        /// </summary>
        [HttpPost("send-ready-sms")]
        public async Task<ActionResult> SendReadySms([FromBody] SendReadySmsModel model)
        {
            try
            {
                if (model.InstitutionId <= 0 || model.Orders == null || model.Orders.Count == 0)
                    return BadRequest(new { success = false, message = "Invalid parameters" });

                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                var smsErrors = new List<string>();
                int sentCount = 0;

                foreach (var order in model.Orders)
                {
                    try
                    {
                        bool sent = await SendReadyForDeliverySmsAsync(connection, model.InstitutionId, order);
                        if (sent) sentCount++;
                    }
                    catch (Exception smsEx)
                    {
                        _logger.LogWarning(smsEx, "SMS sending failed for order {OrderId}", order.OrderId);
                        smsErrors.Add($"অর্ডার {order.OrderSerialNumber}: {smsEx.Message}");
                    }
                }

                var message = sentCount > 0
                    ? $"{sentCount} টি অর্ডারে SMS সফলভাবে পাঠানো হয়েছে"
                    : "SMS পাঠানো হয়নি";

                if (smsErrors.Count > 0)
                    message += $". সমস্যা: {string.Join("; ", smsErrors)}";

                return Ok(new { success = true, message, sentCount });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending ready SMS");
                return StatusCode(500, new { success = false, message = "Error sending SMS: " + ex.Message });
            }
        }

        /// <summary>
        /// Send "Ready For Delivery" SMS. Returns true if sent.
        /// Uses SMS_Template 'ReadyForDelivery' if exists, else default English message (same as old Delivery.aspx).
        /// </summary>
        private async Task<bool> SendReadyForDeliverySmsAsync(SqlConnection connection, int institutionId, ReadySmsOrderItem order)
        {
            // Get order info from DB
            string phone = order.Phone, masking = order.Masking, institutionName = order.InstitutionName;
            int smsBalance = 0, orderSerialNumber = order.OrderSerialNumber, customerId = 0;

            using (var cmd = new SqlCommand(
                @"SELECT Customer.Phone, SMS.Masking, SMS.SMS_Balance, [Order].OrderSerialNumber,
                         Institution.InstitutionName, Customer.CustomerID
                  FROM [Order]
                  INNER JOIN Customer ON [Order].CustomerID = Customer.CustomerID
                  INNER JOIN SMS ON [Order].InstitutionID = SMS.InstitutionID
                  INNER JOIN Institution ON [Order].InstitutionID = Institution.InstitutionID
                  WHERE [Order].OrderID = @OrderID AND [Order].InstitutionID = @InstitutionID",
                connection))
            {
                cmd.Parameters.AddWithValue("@OrderID", order.OrderId);
                cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                using var reader = await cmd.ExecuteReaderAsync();
                if (!await reader.ReadAsync()) return false;
                if (!reader.IsDBNull(0)) phone = reader.GetString(0);
                if (!reader.IsDBNull(1)) masking = reader.GetString(1);
                smsBalance = reader.IsDBNull(2) ? 0 : Convert.ToInt32(reader.GetValue(2));
                orderSerialNumber = reader.IsDBNull(3) ? 0 : Convert.ToInt32(reader.GetValue(3));
                if (!reader.IsDBNull(4)) institutionName = reader.GetString(4);
                customerId = reader.IsDBNull(5) ? 0 : reader.GetInt32(5);
            }

            if (string.IsNullOrEmpty(phone)) return false;
            var digits = new string(phone.Where(char.IsDigit).ToArray());
            if (digits.Length < 10) return false;

            // Build dress items text in C# (avoid FOR XML PATH Unicode bug)
            var dressParts = new List<string>();
            using (var cmd = new SqlCommand(
                @"SELECT D.Dress_Name, OL.ReadyForDeliveryQuantity
                  FROM OrderList OL
                  INNER JOIN Dress D ON OL.DressID = D.DressID
                  WHERE OL.OrderID = @OrderID AND OL.ReadyForDeliveryQuantity <> 0
                  ORDER BY OL.OrderList_SN",
                connection))
            {
                cmd.Parameters.AddWithValue("@OrderID", order.OrderId);
                using var dr = await cmd.ExecuteReaderAsync();
                while (await dr.ReadAsync())
                {
                    var dressName = dr.GetString(0);
                    var qty = dr.GetInt32(1);
                    dressParts.Add($"{qty} p. {dressName}");
                }
            }

            // Fallback: use DressQuantity if ReadyForDeliveryQuantity all zero
            if (dressParts.Count == 0)
            {
                using var cmd = new SqlCommand(
                    @"SELECT D.Dress_Name, OL.DressQuantity
                      FROM OrderList OL
                      INNER JOIN Dress D ON OL.DressID = D.DressID
                      WHERE OL.OrderID = @OrderID
                      ORDER BY OL.OrderList_SN",
                    connection);
                cmd.Parameters.AddWithValue("@OrderID", order.OrderId);
                using var dr = await cmd.ExecuteReaderAsync();
                while (await dr.ReadAsync())
                    dressParts.Add($"{dr.GetInt32(1)} p. {dr.GetString(0)}");
            }

            string orderListSms = string.Join(", ", dressParts);

            // Check DB template for 'ReadyForDelivery'
            string? templateText = null;
            using (var cmd = new SqlCommand(
                "SELECT TOP 1 TemplateText FROM SMS_Template WHERE InstitutionID = @IID AND TemplateFor = 'ReadyForDelivery' ORDER BY SMS_TemplateID",
                connection))
            {
                cmd.Parameters.AddWithValue("@IID", institutionId);
                templateText = await cmd.ExecuteScalarAsync() as string;
            }

            string textSms;
            if (!string.IsNullOrWhiteSpace(templateText))
            {
                textSms = templateText
                    .Replace("{items}", orderListSms)
                    .Replace("{orderNo}", orderSerialNumber.ToString())
                    .Replace("{institutionName}", institutionName);
            }
            else
            {
                // Default message — same as old Delivery.aspx
                textSms = $"Dear Sir, Your Dress {orderListSms} is Ready to Deliver. Order No. {orderSerialNumber}. {institutionName}";
            }

            // Count SMS
            bool isUnicode = textSms.Any(c => c > 0xFF);
            int perSms = isUnicode ? 70 : 160;
            int smsCount = Math.Max(1, (int)Math.Ceiling((double)textSms.Length / perSms));

            if (smsBalance < smsCount)
            {
                _logger.LogWarning("Insufficient SMS balance for order {OrderId}. Balance: {Balance}, Required: {Count}", order.OrderId, smsBalance, smsCount);
                return false;
            }

            // Send SMS via GreenWeb
            using var http = new System.Net.Http.HttpClient();
            var content = new System.Net.Http.FormUrlEncodedContent(new Dictionary<string, string>
            {
                { "token",   "90282141541680536514c64f44771ad21951c8b207c2dcf341b0" },
                { "to",      phone },
                { "message", textSms }
            });
            var res = await http.PostAsync("https://api.greenweb.com.bd/api.php?json", content);
            var body = await res.Content.ReadAsStringAsync();

            bool sent = false;
            try
            {
                using var doc = System.Text.Json.JsonDocument.Parse(body);
                var status = doc.RootElement[0].GetProperty("status").GetString();
                sent = status == "SENT";
            }
            catch { sent = false; }

            if (sent)
            {
                var smsSendId = Guid.NewGuid();
                using (var cmd = new SqlCommand(
                    "INSERT INTO SMS_Send_Record (SMS_Send_ID, PhoneNumber, TextSMS, TextCount, SMSCount, PurposeOfSMS, Status, Date, SMS_Response) " +
                    "VALUES (@ID, @Phone, @Text, @TextLen, @SmsCount, 'Ready For Delivery', 'Sent', GETDATE(), @Response)",
                    connection))
                {
                    cmd.Parameters.AddWithValue("@ID", smsSendId);
                    cmd.Parameters.AddWithValue("@Phone", phone);
                    cmd.Parameters.AddWithValue("@Text", textSms);
                    cmd.Parameters.AddWithValue("@TextLen", (float)textSms.Length);
                    cmd.Parameters.AddWithValue("@SmsCount", (float)smsCount);
                    cmd.Parameters.AddWithValue("@Response", body);
                    await cmd.ExecuteNonQueryAsync();
                }

                if (customerId > 0)
                {
                    using var cmd = new SqlCommand(
                        "INSERT INTO SMS_OtherInfo (SMS_Send_ID, InstitutionID, CustomerID) VALUES (@ID, @IID, @CID)",
                        connection);
                    cmd.Parameters.AddWithValue("@ID", smsSendId);
                    cmd.Parameters.AddWithValue("@IID", institutionId);
                    cmd.Parameters.AddWithValue("@CID", customerId);
                    await cmd.ExecuteNonQueryAsync();
                }
            }

            return sent;
        }

        /// <summary>
        /// Get orders for delete page (all statuses)
        /// </summary>
        [HttpGet("orders-for-delete")]
        public async Task<ActionResult> GetOrdersForDelete(
            [FromQuery] int institutionId,
            [FromQuery] string? phone = null,
            [FromQuery] string? orderSerialNumber = null,
            [FromQuery] string? customerName = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 30)
        {
            try
            {
                if (institutionId <= 0)
                    return BadRequest(new { success = false, message = "Invalid institution ID" });

                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                var query = @"
                    SELECT 
                        [Order].OrderID,
                        [Order].OrderSerialNumber,
                        [Order].OrderDate,
                        [Order].DeliveryDate,
                        [Order].OrderAmount,
                        [Order].PaidAmount,
                        [Order].Discount,
                        [Order].DueAmount,
                        [Order].DeliveryStatus,
                        [Order].WorkStatus,
                        Customer.CustomerNumber,
                        Customer.CustomerName,
                        Customer.Phone,
                        Customer.Address,
                        STUFF((SELECT '; ' + D.Dress_Name + ' ' + CAST(OL.DressQuantity AS NVARCHAR(50)) + ' Piece '
                               FROM OrderList OL
                               INNER JOIN Dress D ON OL.DressID = D.DressID
                               WHERE OL.OrderID = [Order].OrderID
                               FOR XML PATH('')), 1, 1, '') AS Details
                    FROM [Order]
                    INNER JOIN Customer ON [Order].CustomerID = Customer.CustomerID
                    WHERE ([Order].InstitutionID = @InstitutionID)
                    AND (Customer.Phone LIKE '%' + @Phone + '%')
                    AND (CAST([Order].OrderSerialNumber AS NVARCHAR(50)) LIKE '%' + @OrderSerialNumber + '%' OR @OrderSerialNumber = '')
                    AND (ISNULL(Customer.CustomerName, '') LIKE '%' + @CustomerName + '%')
                    ORDER BY [Order].OrderDate DESC
                    OFFSET @Offset ROWS
                    FETCH NEXT @PageSize ROWS ONLY";

                var countQuery = @"
                    SELECT COUNT(*)
                    FROM [Order]
                    INNER JOIN Customer ON [Order].CustomerID = Customer.CustomerID
                    WHERE ([Order].InstitutionID = @InstitutionID)
                    AND (Customer.Phone LIKE '%' + @Phone + '%')
                    AND (CAST([Order].OrderSerialNumber AS NVARCHAR(50)) LIKE '%' + @OrderSerialNumber + '%' OR @OrderSerialNumber = '')
                    AND (ISNULL(Customer.CustomerName, '') LIKE '%' + @CustomerName + '%')";

                int totalCount = 0;
                using (var countCmd = new SqlCommand(countQuery, connection))
                {
                    countCmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                    countCmd.Parameters.AddWithValue("@Phone", phone ?? "");
                    countCmd.Parameters.AddWithValue("@OrderSerialNumber", orderSerialNumber ?? "");
                    countCmd.Parameters.AddWithValue("@CustomerName", customerName ?? "");
                    totalCount = (int)await countCmd.ExecuteScalarAsync();
                }

                var orders = new List<dynamic>();
                using (var cmd = new SqlCommand(query, connection))
                {
                    cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                    cmd.Parameters.AddWithValue("@Phone", phone ?? "");
                    cmd.Parameters.AddWithValue("@OrderSerialNumber", orderSerialNumber ?? "");
                    cmd.Parameters.AddWithValue("@CustomerName", customerName ?? "");
                    cmd.Parameters.AddWithValue("@Offset", (page - 1) * pageSize);
                    cmd.Parameters.AddWithValue("@PageSize", pageSize);

                    using var reader = await cmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        orders.Add(new
                        {
                            orderId = reader.GetInt32(reader.GetOrdinal("OrderID")),
                            orderSerialNumber = Convert.ToInt32(reader.GetValue(reader.GetOrdinal("OrderSerialNumber"))),
                            orderDate = reader.GetDateTime(reader.GetOrdinal("OrderDate")),
                            deliveryDate = reader.IsDBNull(reader.GetOrdinal("DeliveryDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("DeliveryDate")),
                            orderAmount = reader.IsDBNull(reader.GetOrdinal("OrderAmount")) ? 0.0 : reader.GetDouble(reader.GetOrdinal("OrderAmount")),
                            paidAmount = reader.IsDBNull(reader.GetOrdinal("PaidAmount")) ? 0.0 : reader.GetDouble(reader.GetOrdinal("PaidAmount")),
                            discount = reader.IsDBNull(reader.GetOrdinal("Discount")) ? 0.0 : reader.GetDouble(reader.GetOrdinal("Discount")),
                            dueAmount = reader.IsDBNull(reader.GetOrdinal("DueAmount")) ? 0.0 : reader.GetDouble(reader.GetOrdinal("DueAmount")),
                            deliveryStatus = reader.IsDBNull(reader.GetOrdinal("DeliveryStatus")) ? "" : reader.GetString(reader.GetOrdinal("DeliveryStatus")),
                            workStatus = reader.IsDBNull(reader.GetOrdinal("WorkStatus")) ? "" : reader.GetString(reader.GetOrdinal("WorkStatus")),
                            customerNumber = reader.IsDBNull(reader.GetOrdinal("CustomerNumber")) ? "" : reader.GetValue(reader.GetOrdinal("CustomerNumber")).ToString(),
                            customerName = reader.GetString(reader.GetOrdinal("CustomerName")),
                            phone = reader.IsDBNull(reader.GetOrdinal("Phone")) ? "" : reader.GetString(reader.GetOrdinal("Phone")),
                            address = reader.IsDBNull(reader.GetOrdinal("Address")) ? "" : reader.GetString(reader.GetOrdinal("Address")),
                            details = reader.IsDBNull(reader.GetOrdinal("Details")) ? "" : reader.GetString(reader.GetOrdinal("Details"))
                        });
                    }
                }

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        orders = orders,
                        totalCount = totalCount,
                        totalPages = (int)Math.Ceiling((double)totalCount / pageSize),
                        currentPage = page
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting orders for delete");
                return StatusCode(500, new { success = false, message = "Error loading orders: " + ex.Message });
            }
        }

        /// <summary>
        /// Permanently delete orders and all related data
        /// </summary>
        [HttpPost("delete-orders")]
        public async Task<ActionResult> DeleteOrders([FromBody] DeleteOrdersModel model)
        {
            try
            {
                if (model.InstitutionId <= 0 || model.OrderIds == null || model.OrderIds.Count == 0)
                    return BadRequest(new { success = false, message = "Invalid parameters" });

                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                using var transaction = connection.BeginTransaction();
                try
                {
                    int deletedCount = 0;
                    foreach (var orderId in model.OrderIds)
                    {
                        using (var checkCmd = new SqlCommand(
                            "SELECT COUNT(*) FROM [Order] WHERE OrderID = @OrderID AND InstitutionID = @InstitutionID",
                            connection, transaction))
                        {
                            checkCmd.Parameters.AddWithValue("@OrderID", orderId);
                            checkCmd.Parameters.AddWithValue("@InstitutionID", model.InstitutionId);
                            var count = (int)await checkCmd.ExecuteScalarAsync();
                            if (count == 0) continue;
                        }

                        using (var cmd = new SqlCommand("DELETE FROM Payment_Record WHERE OrderID = @OrderID", connection, transaction))
                        { cmd.Parameters.AddWithValue("@OrderID", orderId); await cmd.ExecuteNonQueryAsync(); }

                        using (var cmd = new SqlCommand(
                            "DELETE FROM Ordered_Measurement FROM Ordered_Measurement INNER JOIN OrderList ON Ordered_Measurement.OrderListID = OrderList.OrderListID WHERE OrderList.OrderID = @OrderID",
                            connection, transaction))
                        { cmd.Parameters.AddWithValue("@OrderID", orderId); await cmd.ExecuteNonQueryAsync(); }

                        using (var cmd = new SqlCommand("DELETE FROM Ordered_Dress_Style WHERE OrderID = @OrderID", connection, transaction))
                        { cmd.Parameters.AddWithValue("@OrderID", orderId); await cmd.ExecuteNonQueryAsync(); }

                        using (var cmd = new SqlCommand("UPDATE [Order] SET Discount = 0, PaidAmount = 0 WHERE OrderID = @OrderID", connection, transaction))
                        { cmd.Parameters.AddWithValue("@OrderID", orderId); await cmd.ExecuteNonQueryAsync(); }

                        using (var cmd = new SqlCommand("DELETE FROM Order_Payment WHERE OrderID = @OrderID", connection, transaction))
                        { cmd.Parameters.AddWithValue("@OrderID", orderId); await cmd.ExecuteNonQueryAsync(); }

                        using (var cmd = new SqlCommand("DELETE FROM Order_WorkComplete_Date WHERE OrderID = @OrderID", connection, transaction))
                        { cmd.Parameters.AddWithValue("@OrderID", orderId); await cmd.ExecuteNonQueryAsync(); }

                        using (var cmd = new SqlCommand("DELETE FROM Order_Delivery_Date WHERE OrderID = @OrderID", connection, transaction))
                        { cmd.Parameters.AddWithValue("@OrderID", orderId); await cmd.ExecuteNonQueryAsync(); }

                        using (var cmd = new SqlCommand("DELETE FROM OrderList WHERE OrderID = @OrderID", connection, transaction))
                        { cmd.Parameters.AddWithValue("@OrderID", orderId); await cmd.ExecuteNonQueryAsync(); }

                        using (var cmd = new SqlCommand("DELETE FROM [Order] WHERE OrderID = @OrderID", connection, transaction))
                        { cmd.Parameters.AddWithValue("@OrderID", orderId); await cmd.ExecuteNonQueryAsync(); }

                        deletedCount++;
                    }

                    transaction.Commit();
                    _logger.LogInformation("Deleted {Count} orders for institution {InstitutionId}", deletedCount, model.InstitutionId);
                    return Ok(new { success = true, message = $"{deletedCount} টি অর্ডার স্থায়ীভাবে ডিলেট হয়েছে", deletedCount });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in delete transaction");
                    transaction.Rollback();
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting orders");
                return StatusCode(500, new { success = false, message = "Error deleting orders: " + ex.Message });
            }
        }

        /// <summary>
        /// Parse dress items string: "DressName~Total~Pending|DressName~Total~Pending"
        /// </summary>
        private static List<object> ParseDressItems(string raw)
        {
            var result = new List<object>();
            if (string.IsNullOrEmpty(raw)) return result;
            foreach (var part in raw.Split('|', StringSplitOptions.RemoveEmptyEntries))
            {
                var fields = part.Split('~');
                if (fields.Length >= 3)
                {
                    result.Add(new
                    {
                        dressName   = fields[0],
                        total       = int.TryParse(fields[1], out int t) ? t : 0,
                        pendingWork = int.TryParse(fields[2], out int p) ? p : 0
                    });
                }
            }
            return result;
        }

        /// <summary>
        /// Get dress details for an order in Bangla format
        /// </summary>
        private async Task<string> GetOrderDressDetailsBanglaAsync(SqlConnection parentConnection, int orderId)
        {
            var dressDetailsList = new List<string>();
            var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            var query = @"
                SELECT Dress.Dress_Name, OrderList.DressQuantity, OrderList.Pending_Work
                FROM OrderList 
                INNER JOIN Dress ON OrderList.DressID = Dress.DressID 
                WHERE OrderList.OrderID = @OrderID 
                ORDER BY OrderList.OrderList_SN";

            using (var cmd = new SqlCommand(query, connection))
            {
                cmd.Parameters.AddWithValue("@OrderID", orderId);
                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    var dressName = reader.GetString(0);
                    var quantity  = reader.GetInt32(1);
                    var pending   = reader.GetInt32(2);
                    string status;
                    if (pending == 0)
                        status = " টি (সম্পূর্ণ)";
                    else if (pending == quantity)
                        status = " টি (অর্ধসম্পূর্ণ)";
                    else
                        status = $" টি (আংশিক: {quantity - pending}/{quantity})";
                    dressDetailsList.Add($"{dressName} {quantity}{status}");
                }
            }
            return string.Join("; ", dressDetailsList);
        }

        /// <summary>
        /// Deliver an order
        /// </summary>
        [HttpPost("deliver-order")]
        public async Task<ActionResult> DeliverOrder([FromBody] DeliverOrderModel model)
        {
            try
            {
                if (model.OrderId <= 0 || model.InstitutionId <= 0 || model.RegistrationId <= 0)
                    return BadRequest(new { success = false, message = "Invalid parameters" });

                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                var query = @"UPDATE [Order] SET DeliveryStatus = N'Delivered', Update_DeliveryDate = GETDATE() 
                              WHERE OrderID = @OrderID AND InstitutionID = @InstitutionID";

                using var cmd = new SqlCommand(query, connection);
                cmd.Parameters.AddWithValue("@OrderID", model.OrderId);
                cmd.Parameters.AddWithValue("@InstitutionID", model.InstitutionId);
                var rows = await cmd.ExecuteNonQueryAsync();
                if (rows > 0)
                    return Ok(new { success = true, message = "অর্ডার সফলভাবে ডেলিভার করা হয়েছে" });
                else
                    return NotFound(new { success = false, message = "Order not found" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error delivering order");
                return StatusCode(500, new { success = false, message = "Error delivering order: " + ex.Message });
            }
        }

        /// <summary>
        /// Get delivered orders
        /// </summary>
        [HttpGet("delivered-orders")]
        public async Task<ActionResult> GetDeliveredOrders(
            [FromQuery] int institutionId,
            [FromQuery] string? phone = null,
            [FromQuery] string? orderSerialNumbers = null,
            [FromQuery] string? customerName = null,
            [FromQuery] string? address = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] bool dueOnly = false,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25)
        {
            try
            {
                if (institutionId <= 0)
                    return BadRequest(new { success = false, message = "Invalid institution ID" });

                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                var dueOnlyFilter = dueOnly ? " AND ([Order].DueAmount > 0)" : "";

                var baseWhere = $@"
                    FROM Customer INNER JOIN [Order] ON Customer.CustomerID = [Order].CustomerID 
                    INNER JOIN Order_Delivery_Date ON [Order].OrderID = Order_Delivery_Date.OrderID 
                    WHERE ([Order].InstitutionID = @InstitutionID) 
                    AND ([Order].DeliveryStatus = N'Delivered')
                    AND (Customer.Phone LIKE '%' + @Phone + '%')
                    AND (CAST([Order].OrderSerialNumber AS NVARCHAR(50)) IN (SELECT id FROM dbo.In_Function_Parameter(@OrderSerialNumber)) OR @OrderSerialNumber = '0')
                    AND (Order_Delivery_Date.DeliveryInsertDate BETWEEN ISNULL(@StartDate, '1-1-1760') AND ISNULL(@EndDate, '1-1-3760'))
                    AND (ISNULL(Customer.CustomerName, '') LIKE '%' + @CustomerName + '%')
                    AND (ISNULL(Customer.Address, '') LIKE '%' + @Address + '%')
                    {dueOnlyFilter}";

                int totalCount = 0;
                using (var countCmd = new SqlCommand($"SELECT COUNT(DISTINCT [Order].OrderID) {baseWhere}", connection))
                {
                    countCmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                    countCmd.Parameters.AddWithValue("@Phone", phone ?? "");
                    countCmd.Parameters.AddWithValue("@OrderSerialNumber", orderSerialNumbers ?? "0");
                    countCmd.Parameters.AddWithValue("@StartDate", startDate.HasValue ? (object)startDate.Value : DBNull.Value);
                    countCmd.Parameters.AddWithValue("@EndDate", endDate.HasValue ? (object)endDate.Value.AddDays(1).AddSeconds(-1) : DBNull.Value);
                    countCmd.Parameters.AddWithValue("@CustomerName", customerName ?? "");
                    countCmd.Parameters.AddWithValue("@Address", address ?? "");
                    totalCount = (int)await countCmd.ExecuteScalarAsync();
                }

                dynamic? stats = null;
                using (var statsCmd = new SqlCommand($@"SELECT COUNT(DISTINCT [Order].OrderID) as TotalOrders, ISNULL(SUM(DISTINCT [Order].DueAmount), 0) as TotalDue {baseWhere}", connection))
                {
                    statsCmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                    statsCmd.Parameters.AddWithValue("@Phone", phone ?? "");
                    statsCmd.Parameters.AddWithValue("@OrderSerialNumber", orderSerialNumbers ?? "0");
                    statsCmd.Parameters.AddWithValue("@StartDate", startDate.HasValue ? (object)startDate.Value : DBNull.Value);
                    statsCmd.Parameters.AddWithValue("@EndDate", endDate.HasValue ? (object)endDate.Value.AddDays(1).AddSeconds(-1) : DBNull.Value);
                    statsCmd.Parameters.AddWithValue("@CustomerName", customerName ?? "");
                    statsCmd.Parameters.AddWithValue("@Address", address ?? "");
                    using var r = await statsCmd.ExecuteReaderAsync();
                    if (await r.ReadAsync())
                        stats = new { totalOrders = r.GetInt32(0), totalDue = r.IsDBNull(1) ? 0.0 : r.GetDouble(1) };
                }

                // Dress details built in C# to avoid FOR XML PATH Unicode (??) bug
                var query = $@"
                    SELECT DISTINCT 
                        Order_Delivery_Date.OrderID,
                        [Order].Details AS OrderDetails,
                        [Order].OrderSerialNumber, 
                        Customer.CustomerNumber, 
                        Customer.CustomerName, 
                        Customer.Phone, 
                        Customer.Address, 
                        [Order].OrderDate, 
                        Order_Delivery_Date.DeliveryInsertDate,   
                        [Order].DeliveryDate, 
                        [Order].DueAmount
                    {baseWhere}
                    ORDER BY Order_Delivery_Date.DeliveryInsertDate, [Order].OrderSerialNumber
                    OFFSET @Offset ROWS
                    FETCH NEXT @PageSize ROWS ONLY";

                var orders = new List<dynamic>();
                using (var cmd = new SqlCommand(query, connection))
                {
                    cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                    cmd.Parameters.AddWithValue("@Phone", phone ?? "");
                    cmd.Parameters.AddWithValue("@OrderSerialNumber", orderSerialNumbers ?? "0");
                    cmd.Parameters.AddWithValue("@StartDate", startDate.HasValue ? (object)startDate.Value : DBNull.Value);
                    cmd.Parameters.AddWithValue("@EndDate", endDate.HasValue ? (object)endDate.Value.AddDays(1).AddSeconds(-1) : DBNull.Value);
                    cmd.Parameters.AddWithValue("@CustomerName", customerName ?? "");
                    cmd.Parameters.AddWithValue("@Address", address ?? "");
                    cmd.Parameters.AddWithValue("@Offset", (page - 1) * pageSize);
                    cmd.Parameters.AddWithValue("@PageSize", pageSize);

                    using var reader = await cmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        orders.Add(new
                        {
                            orderId              = reader.GetInt32(reader.GetOrdinal("OrderID")),
                            orderSerialNumber    = Convert.ToInt32(reader.GetValue(reader.GetOrdinal("OrderSerialNumber"))),
                            customerNumber       = reader.IsDBNull(reader.GetOrdinal("CustomerNumber")) ? "" : reader.GetValue(reader.GetOrdinal("CustomerNumber")).ToString(),
                            customerName         = reader.GetString(reader.GetOrdinal("CustomerName")),
                            phone                = reader.IsDBNull(reader.GetOrdinal("Phone")) ? "" : reader.GetString(reader.GetOrdinal("Phone")),
                            address              = reader.IsDBNull(reader.GetOrdinal("Address")) ? "" : reader.GetString(reader.GetOrdinal("Address")),
                            orderDate            = reader.GetDateTime(reader.GetOrdinal("OrderDate")),
                            deliveryDate         = reader.IsDBNull(reader.GetOrdinal("DeliveryDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("DeliveryDate")),
                            deliveryInsertDate   = reader.IsDBNull(reader.GetOrdinal("DeliveryInsertDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("DeliveryInsertDate")),
                            dueAmount            = reader.IsDBNull(reader.GetOrdinal("DueAmount")) ? 0.0 : reader.GetDouble(reader.GetOrdinal("DueAmount")),
                            dressDetails         = "",
                            orderDetails         = reader.IsDBNull(reader.GetOrdinal("OrderDetails")) ? "" : reader.GetString(reader.GetOrdinal("OrderDetails"))
                        });
                    }
                }

                return Ok(new { success = true, data = new { totalCount, stats, orders } });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting delivered orders");
                return StatusCode(500, new { success = false, message = "Error loading delivered orders: " + ex.Message });
            }
        }

        /// <summary>
        /// Test endpoint to check if ready orders exist
        /// </summary>
        [HttpGet("ready-orders-count")]
        public async Task<ActionResult> GetReadyOrdersCount([FromQuery] int institutionId)
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();
                using var cmd = new SqlCommand(@"
                    SELECT COUNT(*) FROM [Order]
                    INNER JOIN Customer ON [Order].CustomerID = Customer.CustomerID
                    WHERE ([Order].InstitutionID = @InstitutionID) 
                    AND ([Order].DeliveryStatus IN (N'Pending', N'PartlyDelivered'))
                    AND (([Order].WorkStatus IN (N'completed', N'PartlyCompleted'))
                         OR (NOT EXISTS (SELECT 1 FROM OrderList WHERE OrderID = [Order].OrderID AND Pending_Work <> 0)))", connection);
                cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                var count = (int)await cmd.ExecuteScalarAsync();
                return Ok(new { success = true, count, message = $"Found {count} ready orders" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error counting ready orders");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Change delivery date for selected orders
        /// </summary>
        [HttpPost("change-delivery-date")]
        public async Task<ActionResult> ChangeDeliveryDate([FromBody] ChangeDeliveryDateModel model)
        {
            try
            {
                if (model.InstitutionId <= 0 || model.Orders == null || model.Orders.Count == 0)
                    return BadRequest(new { success = false, message = "Invalid parameters" });

                if (string.IsNullOrEmpty(model.NewDeliveryDate))
                    return BadRequest(new { success = false, message = "New delivery date is required" });

                if (!DateTime.TryParse(model.NewDeliveryDate, out DateTime newDate))
                    return BadRequest(new { success = false, message = "Invalid date format" });

                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                int updatedCount = 0;
                foreach (var order in model.Orders)
                {
                    using var cmd = new SqlCommand(
                        "UPDATE [Order] SET DeliveryDate = @DeliveryDate WHERE OrderID = @OrderID AND InstitutionID = @InstitutionID",
                        connection);
                    cmd.Parameters.AddWithValue("@DeliveryDate", newDate);
                    cmd.Parameters.AddWithValue("@OrderID", order.OrderId);
                    cmd.Parameters.AddWithValue("@InstitutionID", model.InstitutionId);
                    updatedCount += await cmd.ExecuteNonQueryAsync();
                }

                var smsErrors = new List<string>();
                foreach (var order in model.Orders)
                {
                    if (!order.SendSms) continue;
                    try { await SendDeliveryDateChangeSmsAsync(connection, model.InstitutionId, order, newDate); }
                    catch (Exception smsEx)
                    {
                        _logger.LogWarning(smsEx, "SMS sending failed for order {OrderId}", order.OrderId);
                        smsErrors.Add($"অর্ডার {order.OrderId}: {smsEx.Message}");
                    }
                }

                var message = $"{updatedCount} টি অর্ডারের ডেলিভারির তারিখ সফলভাবে পরিবর্তন হয়েছে";
                if (smsErrors.Count > 0)
                    message += $". SMS পাঠাতে সমস্যা: {string.Join("; ", smsErrors)}";

                return Ok(new { success = true, message, updatedCount });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing delivery date");
                return StatusCode(500, new { success = false, message = "Error changing delivery date: " + ex.Message });
            }
        }

        private async Task SendDeliveryDateChangeSmsAsync(SqlConnection connection, int institutionId, ChangeDeliveryOrderItem order, DateTime newDate)
        {
            string phone = order.Phone, masking = order.Masking, institutionName = order.InstitutionName;
            int smsBalance = 0, orderSerialNumber = 0, customerId = 0;

            using (var cmd = new SqlCommand(
                @"SELECT Customer.Phone, SMS.Masking, SMS.SMS_Balance, [Order].OrderSerialNumber,
                         Institution.InstitutionName, Customer.CustomerID
                  FROM [Order]
                  INNER JOIN Customer ON [Order].CustomerID = Customer.CustomerID
                  INNER JOIN SMS ON [Order].InstitutionID = SMS.InstitutionID
                  INNER JOIN Institution ON [Order].InstitutionID = Institution.InstitutionID
                  WHERE [Order].OrderID = @OrderID AND [Order].InstitutionID = @InstitutionID", connection))
            {
                cmd.Parameters.AddWithValue("@OrderID", order.OrderId);
                cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                using var reader = await cmd.ExecuteReaderAsync();
                if (!await reader.ReadAsync()) return;
                if (!reader.IsDBNull(0)) phone = reader.GetString(0);
                if (!reader.IsDBNull(1)) masking = reader.GetString(1);
                smsBalance = reader.IsDBNull(2) ? 0 : Convert.ToInt32(reader.GetValue(2));
                orderSerialNumber = reader.IsDBNull(3) ? 0 : Convert.ToInt32(reader.GetValue(3));
                if (!reader.IsDBNull(4)) institutionName = reader.GetString(4);
                customerId = reader.IsDBNull(5) ? 0 : reader.GetInt32(5);
            }

            if (string.IsNullOrEmpty(phone)) return;
            if (new string(phone.Where(char.IsDigit).ToArray()).Length < 10) return;

            var dressParts = new List<string>();
            using (var cmd = new SqlCommand(
                @"SELECT D.Dress_Name, OL.Pending_Work FROM OrderList OL
                  INNER JOIN Dress D ON OL.DressID = D.DressID
                  WHERE OL.OrderID = @OrderID AND OL.Pending_Work <> 0
                  ORDER BY OL.OrderList_SN", connection))
            {
                cmd.Parameters.AddWithValue("@OrderID", order.OrderId);
                using var dr = await cmd.ExecuteReaderAsync();
                while (await dr.ReadAsync())
                    dressParts.Add($"{dr.GetInt32(1)} টি {dr.GetString(0)}");
            }
            string orderListSms = string.Join(", ", dressParts);
            string newDateStr = newDate.ToString("dd/MM/yyyy");

            string? templateText = null;
            using (var cmd = new SqlCommand(
                "SELECT TOP 1 TemplateText FROM SMS_Template WHERE InstitutionID = @IID AND TemplateFor = 'DeliveryDateChange' ORDER BY SMS_TemplateID", connection))
            {
                cmd.Parameters.AddWithValue("@IID", institutionId);
                templateText = await cmd.ExecuteScalarAsync() as string;
            }

            string textSms = !string.IsNullOrWhiteSpace(templateText)
                ? templateText.Replace("{items}", orderListSms).Replace("{newDate}", newDateStr).Replace("{orderNo}", orderSerialNumber.ToString()).Replace("{institutionName}", institutionName)
                : $"সম্মানিত গ্রাহক, আপনার অর্ডার কৃত {orderListSms} এর ডেলিভারির তারিখ পরিবর্তন হয়েছে। নতুন তারিখ: {newDateStr}, অর্ডার নং :{orderSerialNumber}, ধন্যবাদ। {institutionName}";

            bool isUnicode = textSms.Any(c => c > 0xFF);
            int smsCount = Math.Max(1, (int)Math.Ceiling((double)textSms.Length / (isUnicode ? 70 : 160)));
            if (smsBalance < smsCount) return;

            using var http = new System.Net.Http.HttpClient();
            var res = await http.PostAsync("https://api.greenweb.com.bd/api.php?json",
                new System.Net.Http.FormUrlEncodedContent(new Dictionary<string, string>
                {
                    { "token", "90282141541680536514c64f44771ad21951c8b207c2dcf341b0" },
                    { "to", phone }, { "message", textSms }
                }));
            var body = await res.Content.ReadAsStringAsync();

            bool sent = false;
            try { using var doc = System.Text.Json.JsonDocument.Parse(body); sent = doc.RootElement[0].GetProperty("status").GetString() == "SENT"; }
            catch { sent = false; }

            if (sent)
            {
                var id = Guid.NewGuid();
                using (var cmd = new SqlCommand("INSERT INTO SMS_Send_Record (SMS_Send_ID, PhoneNumber, TextSMS, TextCount, SMSCount, PurposeOfSMS, Status, Date, SMS_Response) VALUES (@ID, @Phone, @Text, @TextLen, @SmsCount, 'Delivery Date Change', 'Sent', GETDATE(), @Response)", connection))
                {
                    cmd.Parameters.AddWithValue("@ID", id); cmd.Parameters.AddWithValue("@Phone", phone);
                    cmd.Parameters.AddWithValue("@Text", textSms); cmd.Parameters.AddWithValue("@TextLen", (float)textSms.Length);
                    cmd.Parameters.AddWithValue("@SmsCount", (float)smsCount); cmd.Parameters.AddWithValue("@Response", body);
                    await cmd.ExecuteNonQueryAsync();
                }
                if (customerId > 0)
                {
                    using var cmd = new SqlCommand("INSERT INTO SMS_OtherInfo (SMS_Send_ID, InstitutionID, CustomerID) VALUES (@ID, @IID, @CID)", connection);
                    cmd.Parameters.AddWithValue("@ID", id); cmd.Parameters.AddWithValue("@IID", institutionId); cmd.Parameters.AddWithValue("@CID", customerId);
                    await cmd.ExecuteNonQueryAsync();
                }
            }
        }

        // ── Model classes ────────────────────────────────────────────────────────

        public class CompleteWorkModel
        {
            public int InstitutionId { get; set; }
            public int RegistrationId { get; set; }
            public List<OrderCompleteModel> Orders { get; set; } = new();
        }

        public class OrderCompleteModel
        {
            public int OrderId { get; set; }
            public string? StoreDetails { get; set; }
            public string? Details { get; set; }
            public bool SendSMS { get; set; }
            public string? CustomSmsMessage { get; set; }
            public string? SmsOrderListText { get; set; }
            public List<OrderListCompleteModel> OrderListItems { get; set; } = new();
        }

        public class OrderListCompleteModel
        {
            public int OrderListId { get; set; }
            public int CompletedQuantity { get; set; }
        }

        public class DeliverOrderModel
        {
            public int OrderId { get; set; }
            public int InstitutionId { get; set; }
            public int RegistrationId { get; set; }
        }

        public class ReadyOrderModel
        {
            public int OrderId { get; set; }
            public int OrderSerialNumber { get; set; }
            public DateTime OrderDate { get; set; }
            public DateTime? DeliveryDate { get; set; }
            public string WorkStatus { get; set; } = string.Empty;
            public double OrderAmount { get; set; }
            public double PaidAmount { get; set; }
            public double DueAmount { get; set; }
            public string StoreDetails { get; set; } = string.Empty;
            public string Details { get; set; } = string.Empty;
            public int CustomerId { get; set; }
            public string CustomerName { get; set; } = string.Empty;
            public string Phone { get; set; } = string.Empty;
            public string Address { get; set; } = string.Empty;
            public string Masking { get; set; } = string.Empty;
            public int SmsBalance { get; set; }
            public string InstitutionName { get; set; } = string.Empty;
            public string DressDetails { get; set; } = string.Empty;
        }

        public class SendReadySmsModel
        {
            public int InstitutionId { get; set; }
            public int RegistrationId { get; set; }
            public List<ReadySmsOrderItem> Orders { get; set; } = new();
        }

        public class ReadySmsOrderItem
        {
            public int OrderId { get; set; }
            public int OrderSerialNumber { get; set; }
            public string Phone { get; set; } = string.Empty;
            public string InstitutionName { get; set; } = string.Empty;
            public string Masking { get; set; } = string.Empty;
        }

        public class ChangeDeliveryDateModel
        {
            public int InstitutionId { get; set; }
            public int RegistrationId { get; set; }
            public string NewDeliveryDate { get; set; } = string.Empty;
            public List<ChangeDeliveryOrderItem> Orders { get; set; } = new();
        }

        public class ChangeDeliveryOrderItem
        {
            public int OrderId { get; set; }
            public bool SendSms { get; set; }
            public string Phone { get; set; } = string.Empty;
            public string CustomerName { get; set; } = string.Empty;
            public string InstitutionName { get; set; } = string.Empty;
            public string Masking { get; set; } = string.Empty;
        }

        public class DeleteOrdersModel
        {
            public int InstitutionId { get; set; }
            public int RegistrationId { get; set; }
            public List<int> OrderIds { get; set; } = new();
        }
    }
}
