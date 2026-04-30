using Microsoft.AspNetCore.Mvc;
using System.Text.Json.Serialization;
using TailorBD.API.Models;

namespace TailorBD.API.Controllers
{
    [Route("api/orders")]
    [ApiController]
    public class OrdersWriteController : ControllerBase
    {
        private readonly ILogger<OrdersWriteController> _logger;
        private readonly IConfiguration _configuration;

        private static readonly System.Text.Json.JsonSerializerOptions StyleJsonOptions = new()
        {
            NumberHandling = JsonNumberHandling.AllowReadingFromString
        };

        public OrdersWriteController(ILogger<OrdersWriteController> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        /// <summary>
        /// Update order (from edit page)
        /// </summary>
        [HttpPut("{orderId}/update")]
        public async Task<ActionResult> UpdateOrderFromEdit(int orderId, [FromBody] UpdateOrderModel model)
        {
            try
            {
                _logger.LogInformation("Updating order {OrderId}", orderId);

                if (orderId != model.OrderId)
                    return BadRequest(new { success = false, message = "Order ID mismatch" });

                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new Microsoft.Data.SqlClient.SqlConnection(connectionString);
                await connection.OpenAsync();
                using var transaction = connection.BeginTransaction();

                try
                {
                    if (model.DeletedOrderPaymentIds != null && model.DeletedOrderPaymentIds.Count > 0)
                    {
                        foreach (var paymentId in model.DeletedOrderPaymentIds)
                        {
                            using var cmd = new Microsoft.Data.SqlClient.SqlCommand(
                                "DELETE FROM Order_Payment WHERE OrderPaymentID = @OrderPaymentID",
                                connection, transaction);
                            cmd.Parameters.AddWithValue("@OrderPaymentID", paymentId);
                            await cmd.ExecuteNonQueryAsync();
                        }
                    }

                    foreach (var orderListItem in model.OrderList)
                    {
                        if (orderListItem.OrderListId.HasValue)
                        {
                            var olId = orderListItem.OrderListId.Value;

                            using (var cmd = new Microsoft.Data.SqlClient.SqlCommand(
                                "UPDATE OrderList SET DressQuantity = @DressQuantity, Details = @Details WHERE OrderListID = @OrderListID",
                                connection, transaction))
                            {
                                cmd.Parameters.AddWithValue("@DressQuantity", orderListItem.DressQuantity);
                                cmd.Parameters.AddWithValue("@Details", orderListItem.Details ?? "");
                                cmd.Parameters.AddWithValue("@OrderListID", olId);
                                await cmd.ExecuteNonQueryAsync();
                            }

                            using (var cmd = new Microsoft.Data.SqlClient.SqlCommand(
                                "DELETE FROM Ordered_Measurement WHERE OrderListID = @OrderListID", connection, transaction))
                            {
                                cmd.Parameters.AddWithValue("@OrderListID", olId);
                                await cmd.ExecuteNonQueryAsync();
                            }

                            try
                            {
                                var measurements = System.Text.Json.JsonSerializer.Deserialize<List<MeasurementItem>>(orderListItem.ListMeasurement ?? "[]");
                                if (measurements != null)
                                {
                                    foreach (var m in measurements)
                                    {
                                        if (!string.IsNullOrWhiteSpace(m.value))
                                        {
                                            using var mCmd = new Microsoft.Data.SqlClient.SqlCommand(
                                                "INSERT INTO Ordered_Measurement (CustomerID, OrderListID, RegistrationID, InstitutionID, MeasurementTypeID, Measurement) " +
                                                "VALUES (@CustomerID, @OrderListID, @RegistrationID, @InstitutionID, @MeasurementTypeID, @Measurement)",
                                                connection, transaction);
                                            mCmd.Parameters.AddWithValue("@CustomerID", model.CustomerId);
                                            mCmd.Parameters.AddWithValue("@OrderListID", olId);
                                            mCmd.Parameters.AddWithValue("@RegistrationID", model.RegistrationId);
                                            mCmd.Parameters.AddWithValue("@InstitutionID", model.InstitutionId);
                                            mCmd.Parameters.AddWithValue("@MeasurementTypeID", m.id);
                                            mCmd.Parameters.AddWithValue("@Measurement", m.value);
                                            await mCmd.ExecuteNonQueryAsync();
                                        }
                                    }
                                }
                            }
                            catch (Exception ex) { _logger.LogWarning(ex, "Error parsing measurements"); }

                            using (var cmd = new Microsoft.Data.SqlClient.SqlCommand(
                                "DELETE FROM Ordered_Dress_Style WHERE OrderListID = @OrderListID", connection, transaction))
                            {
                                cmd.Parameters.AddWithValue("@OrderListID", olId);
                                await cmd.ExecuteNonQueryAsync();
                            }

                            try
                            {
                                var styles = System.Text.Json.JsonSerializer.Deserialize<List<StyleItem>>(orderListItem.ListStyle ?? "[]", StyleJsonOptions);
                                if (styles != null)
                                {
                                    foreach (var s in styles)
                                    {
                                        if (s.id > 0)
                                        {
                                            using var sCmd = new Microsoft.Data.SqlClient.SqlCommand(
                                                "INSERT INTO Ordered_Dress_Style (CustomerID, OrderID, Dress_StyleID, OrderListID, RegistrationID, InstitutionID, DressStyleMesurement) " +
                                                "VALUES (@CustomerID, @OrderID, @Dress_StyleID, @OrderListID, @RegistrationID, @InstitutionID, @DressStyleMesurement)",
                                                connection, transaction);
                                            sCmd.Parameters.AddWithValue("@CustomerID", model.CustomerId);
                                            sCmd.Parameters.AddWithValue("@OrderID", orderId);
                                            sCmd.Parameters.AddWithValue("@Dress_StyleID", s.id);
                                            sCmd.Parameters.AddWithValue("@OrderListID", olId);
                                            sCmd.Parameters.AddWithValue("@RegistrationID", model.RegistrationId);
                                            sCmd.Parameters.AddWithValue("@InstitutionID", model.InstitutionId);
                                            sCmd.Parameters.AddWithValue("@DressStyleMesurement", s.value ?? "");
                                            await sCmd.ExecuteNonQueryAsync();
                                        }
                                    }
                                }
                            }
                            catch (Exception ex) { _logger.LogWarning(ex, "Error parsing styles"); }

                            try
                            {
                                var payments = System.Text.Json.JsonSerializer.Deserialize<List<PaymentItem>>(orderListItem.ListPayment ?? "[]");
                                if (payments != null)
                                {
                                    foreach (var p in payments)
                                    {
                                        var totalAmount = p.Unit_Price * p.Quantity;
                                        using var pCmd = new Microsoft.Data.SqlClient.SqlCommand(
                                            "INSERT INTO Order_Payment (CustomerID, OrderListID, OrderID, Amount, Details, RegistrationID, InstitutionID, Unit, UnitPrice) " +
                                            "VALUES (@CustomerID, @OrderListID, @OrderID, @Amount, @Details, @RegistrationID, @InstitutionID, @Unit, @UnitPrice)",
                                            connection, transaction);
                                        pCmd.Parameters.AddWithValue("@CustomerID", model.CustomerId);
                                        pCmd.Parameters.AddWithValue("@OrderListID", olId);
                                        pCmd.Parameters.AddWithValue("@OrderID", model.OrderId);
                                        pCmd.Parameters.AddWithValue("@Amount", totalAmount);
                                        pCmd.Parameters.AddWithValue("@Details", p.For ?? "");
                                        pCmd.Parameters.AddWithValue("@Unit", p.Quantity);
                                        pCmd.Parameters.AddWithValue("@UnitPrice", p.Unit_Price);
                                        pCmd.Parameters.AddWithValue("@RegistrationID", model.RegistrationId);
                                        pCmd.Parameters.AddWithValue("@InstitutionID", model.InstitutionId);
                                        await pCmd.ExecuteNonQueryAsync();
                                    }
                                }
                            }
                            catch (Exception ex) { _logger.LogWarning(ex, "Error parsing payments"); }

                            try
                            {
                                using var cdCmd = new Microsoft.Data.SqlClient.SqlCommand(@"
                                    IF EXISTS (SELECT 1 FROM Customer_Dress WHERE CustomerID = @CustomerID AND DressID = @DressID AND InstitutionID = @InstitutionID)
                                        UPDATE Customer_Dress SET CDDetails = @CDDetails WHERE CustomerID = @CustomerID AND DressID = @DressID AND InstitutionID = @InstitutionID
                                    ELSE
                                        INSERT INTO Customer_Dress (RegistrationID, InstitutionID, CustomerID, DressID, CDDetails) VALUES (@RegistrationID, @InstitutionID, @CustomerID, @DressID, @CDDetails)",
                                    connection, transaction);
                                cdCmd.Parameters.AddWithValue("@RegistrationID", model.RegistrationId);
                                cdCmd.Parameters.AddWithValue("@InstitutionID", model.InstitutionId);
                                cdCmd.Parameters.AddWithValue("@CustomerID", model.CustomerId);
                                cdCmd.Parameters.AddWithValue("@DressID", orderListItem.DressId);
                                cdCmd.Parameters.AddWithValue("@CDDetails", orderListItem.Details ?? "");
                                await cdCmd.ExecuteNonQueryAsync();
                            }
                            catch (Exception ex) { _logger.LogWarning(ex, "Error updating customer dress details"); }
                        }
                        else
                        {
                            using var spCmd = new Microsoft.Data.SqlClient.SqlCommand("SP_Order_Place", connection, transaction);
                            spCmd.CommandType = System.Data.CommandType.StoredProcedure;
                            spCmd.Parameters.AddWithValue("@InstitutionID", model.InstitutionId);
                            spCmd.Parameters.AddWithValue("@RegistrationID", model.RegistrationId);
                            spCmd.Parameters.AddWithValue("@Cloth_For_ID", model.ClothForId);
                            spCmd.Parameters.AddWithValue("@CustomerID", model.CustomerId);
                            spCmd.Parameters.AddWithValue("@OrderID", model.OrderId);
                            spCmd.Parameters.AddWithValue("@DressID", orderListItem.DressId);
                            spCmd.Parameters.AddWithValue("@List_Measurement", orderListItem.ListMeasurement ?? "[]");
                            spCmd.Parameters.AddWithValue("@List_Style", orderListItem.ListStyle ?? "[]");
                            spCmd.Parameters.AddWithValue("@List_payment", orderListItem.ListPayment ?? "[]");
                            spCmd.Parameters.AddWithValue("@DressQuantity", orderListItem.DressQuantity);
                            spCmd.Parameters.AddWithValue("@Details", orderListItem.Details ?? "");
                            await spCmd.ExecuteNonQueryAsync();
                        }
                    }

                    if (model.DeletedOrderListIds != null && model.DeletedOrderListIds.Count > 0)
                    {
                        foreach (var olId in model.DeletedOrderListIds)
                        {
                            foreach (var deleteQuery in new[]
                            {
                                "DELETE FROM Ordered_Measurement WHERE OrderListID = @OlId",
                                "DELETE FROM Ordered_Dress_Style WHERE OrderListID = @OlId",
                                "DELETE FROM Order_Payment WHERE OrderListID = @OlId",
                                "DELETE FROM OrderList WHERE OrderListID = @OlId"
                            })
                            {
                                using var cmd = new Microsoft.Data.SqlClient.SqlCommand(deleteQuery, connection, transaction);
                                cmd.Parameters.AddWithValue("@OlId", olId);
                                await cmd.ExecuteNonQueryAsync();
                            }
                        }

                        using var countCmd = new Microsoft.Data.SqlClient.SqlCommand(
                            "SELECT COUNT(*) FROM OrderList WHERE OrderID = @OrderID", connection, transaction);
                        countCmd.Parameters.AddWithValue("@OrderID", model.OrderId);
                        var itemCount = Convert.ToInt32(await countCmd.ExecuteScalarAsync());
                        if (itemCount == 0)
                        {
                            using var delCmd = new Microsoft.Data.SqlClient.SqlCommand(
                                "DELETE FROM [Order] WHERE OrderID = @OrderID", connection, transaction);
                            delCmd.Parameters.AddWithValue("@OrderID", model.OrderId);
                            await delCmd.ExecuteNonQueryAsync();
                        }
                    }

                    transaction.Commit();
                    return Ok(new { success = true, message = "Order updated successfully" });
                }
                catch (Exception ex)
                {
                    transaction.Rollback();
                    _logger.LogError(ex, "Error in transaction for order {OrderId}", orderId);
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating order {OrderId}", orderId);
                return StatusCode(500, new { success = false, message = "An error occurred while updating order: " + ex.Message });
            }
        }

        /// <summary>
        /// Add dress to order
        /// </summary>
        [HttpPost("add-dress")]
        public async Task<ActionResult> AddDressToOrder([FromBody] AddDressToOrderModel model)
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new Microsoft.Data.SqlClient.SqlConnection(connectionString);
                await connection.OpenAsync();

                int orderId = model.OrderID ?? 0;

                if (orderId == 0)
                {
                    var createOrderQuery = @"
                        DECLARE @orderNo int;
                        EXEC @orderNo = [dbo].[Sp_GetUpdatedOrderNo] @InstitutionID;
                        INSERT INTO [Order] ([CustomerID],[RegistrationID],[InstitutionID],[Cloth_For_ID],[OrderDate],[OrderSerialNumber])
                        VALUES (@CustomerID,@RegistrationID,@InstitutionID,@Cloth_For_ID,GETDATE(),@orderNo);
                        SELECT CAST(SCOPE_IDENTITY() as int)";

                    using var cmd = new Microsoft.Data.SqlClient.SqlCommand(createOrderQuery, connection);
                    cmd.Parameters.AddWithValue("@InstitutionID", model.InstitutionID);
                    cmd.Parameters.AddWithValue("@RegistrationID", model.RegistrationID);
                    cmd.Parameters.AddWithValue("@Cloth_For_ID", model.Cloth_For_ID);
                    cmd.Parameters.AddWithValue("@CustomerID", model.CustomerID);
                    orderId = Convert.ToInt32(await cmd.ExecuteScalarAsync());
                }

                using (var checkCmd = new Microsoft.Data.SqlClient.SqlCommand(
                    "SELECT COUNT(*) FROM OrderList WHERE OrderID=@OrderID AND DressID=@DressID AND InstitutionID=@InstitutionID", connection))
                {
                    checkCmd.Parameters.AddWithValue("@OrderID", orderId);
                    checkCmd.Parameters.AddWithValue("@DressID", model.DressID);
                    checkCmd.Parameters.AddWithValue("@InstitutionID", model.InstitutionID);
                    if (Convert.ToInt32(await checkCmd.ExecuteScalarAsync()) > 0)
                        return BadRequest(new { success = false, message = "এই পোশাকটি ইতোমধ্যেই এই অর্ডারে যুক্ত করা হয়েছে।" });
                }

                int orderListSN = 1;
                using (var serialCmd = new Microsoft.Data.SqlClient.SqlCommand("SELECT [dbo].[OrderList_SerialNumber](@OrderID)", connection))
                {
                    serialCmd.Parameters.AddWithValue("@OrderID", orderId);
                    orderListSN = Convert.ToInt32(await serialCmd.ExecuteScalarAsync());
                }

                int orderListId;
                using (var olCmd = new Microsoft.Data.SqlClient.SqlCommand(@"
                    INSERT INTO [OrderList] ([CustomerID],[RegistrationID],[InstitutionID],[Cloth_For_ID],[OrderID],[DressID],[DressQuantity],[Details],[OrderList_SN])
                    VALUES (@CustomerID,@RegistrationID,@InstitutionID,@Cloth_For_ID,@OrderID,@DressID,@DressQuantity,@Details,@OrderList_SN);
                    SELECT CAST(SCOPE_IDENTITY() as int)", connection))
                {
                    olCmd.Parameters.AddWithValue("@CustomerID", model.CustomerID);
                    olCmd.Parameters.AddWithValue("@RegistrationID", model.RegistrationID);
                    olCmd.Parameters.AddWithValue("@InstitutionID", model.InstitutionID);
                    olCmd.Parameters.AddWithValue("@Cloth_For_ID", model.Cloth_For_ID);
                    olCmd.Parameters.AddWithValue("@OrderID", orderId);
                    olCmd.Parameters.AddWithValue("@DressID", model.DressID);
                    olCmd.Parameters.AddWithValue("@DressQuantity", model.DressQuantity);
                    olCmd.Parameters.AddWithValue("@Details", model.Details ?? "");
                    olCmd.Parameters.AddWithValue("@OrderList_SN", orderListSN);
                    orderListId = Convert.ToInt32(await olCmd.ExecuteScalarAsync());
                }

                try
                {
                    var measurements = System.Text.Json.JsonSerializer.Deserialize<List<MeasurementItem>>(model.List_Measurement ?? "[]");
                    if (measurements != null)
                    {
                        foreach (var m in measurements)
                        {
                            if (!string.IsNullOrWhiteSpace(m.value))
                            {
                                using var mCmd = new Microsoft.Data.SqlClient.SqlCommand(
                                    "INSERT INTO Ordered_Measurement (CustomerID, OrderListID, RegistrationID, InstitutionID, MeasurementTypeID, Measurement) " +
                                    "VALUES (@CustomerID, @OrderListID, @RegistrationID, @InstitutionID, @MeasurementTypeID, @Measurement)",
                                    connection);
                                mCmd.Parameters.AddWithValue("@CustomerID", model.CustomerID);
                                mCmd.Parameters.AddWithValue("@OrderListID", orderListId);
                                mCmd.Parameters.AddWithValue("@RegistrationID", model.RegistrationID);
                                mCmd.Parameters.AddWithValue("@InstitutionID", model.InstitutionID);
                                mCmd.Parameters.AddWithValue("@MeasurementTypeID", m.id);
                                mCmd.Parameters.AddWithValue("@Measurement", m.value);
                                await mCmd.ExecuteNonQueryAsync();
                            }
                        }
                    }
                }
                catch (Exception ex) { _logger.LogWarning(ex, "Error parsing measurements"); }

                try
                {
                    var styles = System.Text.Json.JsonSerializer.Deserialize<List<StyleItem>>(model.List_Style ?? "[]", StyleJsonOptions);
                    if (styles != null)
                    {
                        foreach (var s in styles)
                        {
                            if (s.id > 0)
                            {
                                using var sCmd = new Microsoft.Data.SqlClient.SqlCommand(
                                    "INSERT INTO Ordered_Dress_Style (CustomerID, OrderID, Dress_StyleID, OrderListID, RegistrationID, InstitutionID, DressStyleMesurement) " +
                                    "VALUES (@CustomerID, @OrderID, @Dress_StyleID, @OrderListID, @RegistrationID, @InstitutionID, @DressStyleMesurement)",
                                    connection);
                                sCmd.Parameters.AddWithValue("@CustomerID", model.CustomerID);
                                sCmd.Parameters.AddWithValue("@OrderID", orderId);
                                sCmd.Parameters.AddWithValue("@Dress_StyleID", s.id);
                                sCmd.Parameters.AddWithValue("@OrderListID", orderListId);
                                sCmd.Parameters.AddWithValue("@RegistrationID", model.RegistrationID);
                                sCmd.Parameters.AddWithValue("@InstitutionID", model.InstitutionID);
                                sCmd.Parameters.AddWithValue("@DressStyleMesurement", s.value ?? "");
                                await sCmd.ExecuteNonQueryAsync();
                            }
                        }
                    }
                }
                catch (Exception ex) { _logger.LogWarning(ex, "Error parsing styles"); }

                try
                {
                    var payments = System.Text.Json.JsonSerializer.Deserialize<List<PaymentItem>>(model.List_Payment ?? "[]");
                    if (payments != null)
                    {
                        foreach (var p in payments)
                        {
                            var totalAmount = p.Unit_Price * p.Quantity;
                            using var pCmd = new Microsoft.Data.SqlClient.SqlCommand(
                                "INSERT INTO Order_Payment (CustomerID, OrderListID, OrderID, Amount, Details, RegistrationID, InstitutionID, Unit, UnitPrice) " +
                                "VALUES (@CustomerID, @OrderListID, @OrderID, @Amount, @Details, @RegistrationID, @InstitutionID, @Unit, @UnitPrice)",
                                connection);
                            pCmd.Parameters.AddWithValue("@CustomerID", model.CustomerID);
                            pCmd.Parameters.AddWithValue("@OrderListID", orderListId);
                            pCmd.Parameters.AddWithValue("@OrderID", orderId);
                            pCmd.Parameters.AddWithValue("@Amount", totalAmount);
                            pCmd.Parameters.AddWithValue("@Details", p.For ?? "");
                            pCmd.Parameters.AddWithValue("@Unit", p.Quantity);
                            pCmd.Parameters.AddWithValue("@UnitPrice", p.Unit_Price);
                            pCmd.Parameters.AddWithValue("@RegistrationID", model.RegistrationID);
                            pCmd.Parameters.AddWithValue("@InstitutionID", model.InstitutionID);
                            await pCmd.ExecuteNonQueryAsync();
                        }
                    }
                }
                catch (Exception ex) { _logger.LogWarning(ex, "Error parsing payments"); }

                try
                {
                    using var cdCmd = new Microsoft.Data.SqlClient.SqlCommand(@"
                        IF EXISTS (SELECT 1 FROM Customer_Dress WHERE CustomerID = @CustomerID AND DressID = @DressID AND InstitutionID = @InstitutionID)
                            UPDATE Customer_Dress SET CDDetails = @CDDetails WHERE CustomerID = @CustomerID AND DressID = @DressID AND InstitutionID = @InstitutionID
                        ELSE
                            INSERT INTO Customer_Dress (RegistrationID, InstitutionID, CustomerID, DressID, CDDetails) VALUES (@RegistrationID, @InstitutionID, @CustomerID, @DressID, @CDDetails)",
                    connection);
                    cdCmd.Parameters.AddWithValue("@RegistrationID", model.RegistrationID);
                    cdCmd.Parameters.AddWithValue("@InstitutionID", model.InstitutionID);
                    cdCmd.Parameters.AddWithValue("@CustomerID", model.CustomerID);
                    cdCmd.Parameters.AddWithValue("@DressID", model.DressID);
                    cdCmd.Parameters.AddWithValue("@CDDetails", model.Details ?? "");
                    await cdCmd.ExecuteNonQueryAsync();
                }
                catch (Exception ex) { _logger.LogWarning(ex, "Error updating customer dress details"); }

                return Ok(new { success = true, message = "Dress added to order successfully", data = new { orderID = orderId, orderListID = orderListId } });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding dress to order");
                return StatusCode(500, new { success = false, message = "An error occurred while adding dress to order" });
            }
        }

        /// <summary>
        /// Finish order - save delivery date, discount and payment
        /// </summary>
        [HttpPost("finish-order")]
        public async Task<ActionResult> FinishOrder([FromBody] FinishOrderModel model)
        {
            try
            {
                if (model.OrderId <= 0)
                    return BadRequest(new { success = false, message = "Invalid order ID" });

                if (string.IsNullOrWhiteSpace(model.DeliveryDate))
                    return BadRequest(new { success = false, message = "Delivery date is required" });

                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new Microsoft.Data.SqlClient.SqlConnection(connectionString);
                await connection.OpenAsync();
                using var transaction = connection.BeginTransaction();

                try
                {
                    // Update order delivery date, delivery status and discount
                    using (var cmd = new Microsoft.Data.SqlClient.SqlCommand(
                        @"UPDATE [Order] 
                          SET DeliveryDate        = @DeliveryDate,
                              DeliveryStatus      = N'Delivered',
                              Update_DeliveryDate = GETDATE(),
                              Discount = Discount + @NewDiscount
                          WHERE OrderID = @OrderID AND InstitutionID = @InstitutionID",
                        connection, transaction))
                    {
                        cmd.Parameters.AddWithValue("@DeliveryDate", model.DeliveryDate);
                        cmd.Parameters.AddWithValue("@NewDiscount", model.Discount);
                        cmd.Parameters.AddWithValue("@OrderID", model.OrderId);
                        cmd.Parameters.AddWithValue("@InstitutionID", model.InstitutionId);
                        await cmd.ExecuteNonQueryAsync();
                    }

                    // Insert payment record if paid amount > 0
                    if (model.PaidAmount > 0)
                    {
                        using var payCmd = new Microsoft.Data.SqlClient.SqlCommand(
                            @"INSERT INTO Payment_Record (OrderID, CustomerID, RegistrationID, InstitutionID, Amount, Payment_TimeStatus, AccountID)
                              VALUES (@OrderID,
                                      (SELECT CustomerID FROM [Order] WHERE OrderID = @OrderID),
                                      @RegistrationID, @InstitutionID, @Amount, 'Advance', @AccountID)",
                            connection, transaction);
                        payCmd.Parameters.AddWithValue("@OrderID", model.OrderId);
                        payCmd.Parameters.AddWithValue("@RegistrationID", model.RegistrationId);
                        payCmd.Parameters.AddWithValue("@InstitutionID", model.InstitutionId);
                        payCmd.Parameters.AddWithValue("@Amount", model.PaidAmount);
                        payCmd.Parameters.AddWithValue("@AccountID", (object?)model.AccountId ?? DBNull.Value);
                        await payCmd.ExecuteNonQueryAsync();
                    }

                    transaction.Commit();
                    return Ok(new { success = true, message = "Order finished successfully" });
                }
                catch (Exception ex)
                {
                    transaction.Rollback();
                    _logger.LogError(ex, "Transaction failed for finish order {OrderId}", model.OrderId);
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error finishing order {OrderId}", model?.OrderId);
                return StatusCode(500, new { success = false, message = "An error occurred: " + ex.Message });
            }
        }

        /// <summary>
        /// Increment measurement print count for an order
        /// </summary>
        [HttpPost("{orderId}/increment-measurement-print")]
        public async Task<ActionResult> IncrementMeasurementPrint(int orderId, [FromQuery] int institutionId)
        {
            try
            {
                if (orderId <= 0)
                    return BadRequest(new { success = false, message = "Invalid order ID" });

                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new Microsoft.Data.SqlClient.SqlConnection(connectionString);
                await connection.OpenAsync();

                using var cmd = new Microsoft.Data.SqlClient.SqlCommand(
                    @"UPDATE [Order] 
                      SET Is_Print = ISNULL(Is_Print, 0) + 1 
                      WHERE OrderID = @OrderID AND InstitutionID = @InstitutionID",
                    connection);
                cmd.Parameters.AddWithValue("@OrderID", orderId);
                cmd.Parameters.AddWithValue("@InstitutionID", institutionId > 0 ? institutionId : (object)DBNull.Value);
                await cmd.ExecuteNonQueryAsync();

                return Ok(new { success = true, message = "Print count updated" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error incrementing print count for order {OrderId}", orderId);
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }
    }
}
