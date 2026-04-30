using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace TailorBD.API.Controllers
{
    [Route("api/customer-page")]
    [ApiController]
    public class CustomerPageController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<CustomerPageController> _logger;

        public CustomerPageController(IConfiguration configuration, ILogger<CustomerPageController> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Get next customer serial number
        /// </summary>
        [HttpGet("next-customer-number")]
        public async Task<ActionResult> GetNextCustomerNumber([FromQuery] int institutionId)
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                using var cmd = new SqlCommand("SELECT [dbo].[CustomeSerialNumber](@InstitutionID)", connection);
                cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                var result = await cmd.ExecuteScalarAsync();

                return Ok(new { success = true, data = Convert.ToInt32(result) });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting next customer number");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get all cloth-for (gender) options
        /// </summary>
        [HttpGet("cloth-for-list")]
        public async Task<ActionResult> GetClothForList()
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                var list = new List<object>();
                using var cmd = new SqlCommand("SELECT Cloth_For_ID, Cloth_For FROM Cloth_For", connection);
                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    list.Add(new
                    {
                        clothForId = reader.GetInt32(0),
                        clothFor = reader.GetString(1)
                    });
                }

                return Ok(new { success = true, data = list });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cloth-for list");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Check if mobile number already registered
        /// </summary>
        [HttpGet("check-mobile")]
        public async Task<ActionResult> CheckMobile([FromQuery] int institutionId, [FromQuery] string phone)
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                using var cmd = new SqlCommand(
                    "SELECT TOP 1 CustomerID, CustomerName, Cloth_For_ID FROM Customer WHERE InstitutionID = @InstitutionID AND Phone = @Phone",
                    connection);
                cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                cmd.Parameters.AddWithValue("@Phone", phone ?? "");

                using var reader = await cmd.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    return Ok(new
                    {
                        success = true,
                        exists = true,
                        customerId = reader.GetInt32(0),
                        customerName = reader.GetString(1),
                        clothForId = reader.GetInt32(2)
                    });
                }

                return Ok(new { success = true, exists = false });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking mobile");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Check if name + mobile already registered
        /// </summary>
        [HttpGet("check-name-mobile")]
        public async Task<ActionResult> CheckNameMobile([FromQuery] int institutionId, [FromQuery] string name, [FromQuery] string phone)
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                using var cmd = new SqlCommand(
                    "SELECT TOP 1 CustomerID FROM Customer WHERE InstitutionID = @InstitutionID AND CustomerName = @CustomerName AND Phone = @Phone",
                    connection);
                cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                cmd.Parameters.AddWithValue("@CustomerName", name ?? "");
                cmd.Parameters.AddWithValue("@Phone", phone ?? "");

                var result = await cmd.ExecuteScalarAsync();
                return Ok(new { success = true, exists = result != null });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking name+mobile");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Add new customer
        /// </summary>
        [HttpPost("add-customer")]
        public async Task<ActionResult> AddCustomer([FromBody] AddCustomerModel model)
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                // Check duplicate
                using (var checkCmd = new SqlCommand(
                    "SELECT TOP 1 CustomerID FROM Customer WHERE InstitutionID = @InstitutionID AND CustomerName = @CustomerName AND Phone = @Phone",
                    connection))
                {
                    checkCmd.Parameters.AddWithValue("@InstitutionID", model.InstitutionId);
                    checkCmd.Parameters.AddWithValue("@CustomerName", model.CustomerName ?? "");
                    checkCmd.Parameters.AddWithValue("@Phone", model.Phone ?? "");
                    var exists = await checkCmd.ExecuteScalarAsync();
                    if (exists != null)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = $"{model.CustomerName}. মোবাইল: {model.Phone} পূর্বে নিবন্ধিত, পুনরায় নিবন্ধন করা যাবে না"
                        });
                    }
                }

                // Insert customer
                var insertQuery = @"
                    INSERT INTO Customer (RegistrationID, InstitutionID, Cloth_For_ID, CustomerName, Phone, Address, Date, CustomerNumber)
                    VALUES (@RegistrationID, @InstitutionID, @Cloth_For_ID, @CustomerName, @Phone, @Address, GETDATE(),
                            (SELECT [dbo].[CustomeSerialNumber](@InstitutionID)));
                    SELECT CAST(SCOPE_IDENTITY() AS INT);";

                int customerId;
                using (var insertCmd = new SqlCommand(insertQuery, connection))
                {
                    insertCmd.Parameters.AddWithValue("@RegistrationID", model.RegistrationId);
                    insertCmd.Parameters.AddWithValue("@InstitutionID", model.InstitutionId);
                    insertCmd.Parameters.AddWithValue("@Cloth_For_ID", model.ClothForId);
                    insertCmd.Parameters.AddWithValue("@CustomerName", model.CustomerName ?? "");
                    insertCmd.Parameters.AddWithValue("@Phone", model.Phone ?? "");
                    insertCmd.Parameters.AddWithValue("@Address", model.Address ?? "");
                    customerId = Convert.ToInt32(await insertCmd.ExecuteScalarAsync());
                }

                // Update institution total customer
                using (var updateCmd = new SqlCommand(
                    "UPDATE Institution SET TotalCustomer = (SELECT COUNT(*) FROM Customer WHERE InstitutionID = @InstitutionID) WHERE InstitutionID = @InstitutionID",
                    connection))
                {
                    updateCmd.Parameters.AddWithValue("@InstitutionID", model.InstitutionId);
                    await updateCmd.ExecuteNonQueryAsync();
                }

                return Ok(new
                {
                    success = true,
                    message = "কাস্টমার সফলভাবে যুক্ত হয়েছে",
                    data = new { customerId = customerId, clothForId = model.ClothForId }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding customer");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get customer details
        /// </summary>
        [HttpGet("customer-details")]
        public async Task<ActionResult> GetCustomerDetails([FromQuery] int customerId, [FromQuery] int institutionId)
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                // Customer info
                object customerInfo = null;
                using (var cmd = new SqlCommand(
                    "SELECT CustomerID, CustomerNumber, CustomerName, Phone, Address, Cloth_For_ID FROM Customer WHERE CustomerID = @CustomerID AND InstitutionID = @InstitutionID",
                    connection))
                {
                    cmd.Parameters.AddWithValue("@CustomerID", customerId);
                    cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                    using var reader = await cmd.ExecuteReaderAsync();
                    if (await reader.ReadAsync())
                    {
                        customerInfo = new
                        {
                            customerId = reader.GetInt32(0),
                            customerNumber = reader.IsDBNull(1) ? "" : reader.GetValue(1).ToString(),
                            customerName = reader.GetString(2),
                            phone = reader.IsDBNull(3) ? "" : reader.GetString(3),
                            address = reader.IsDBNull(4) ? "" : reader.GetString(4),
                            clothForId = reader.GetInt32(5)
                        };
                    }
                }

                if (customerInfo == null)
                    return NotFound(new { success = false, message = "Customer not found" });

                return Ok(new { success = true, data = customerInfo });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customer details");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get dresses by clothForId for measurement tab
        /// </summary>
        [HttpGet("dresses-by-gender")]
        public async Task<ActionResult> GetDressesByGender([FromQuery] int institutionId, [FromQuery] int clothForId, [FromQuery] int customerId = 0)
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                var list = new List<object>();
                using var cmd = new SqlCommand(
                    @"SELECT D.DressID, D.Dress_Name,
                        CASE WHEN EXISTS (
                            SELECT 1 FROM Customer_Measurement CM
                            INNER JOIN Measurement_Type MT ON CM.MeasurementTypeID = MT.MeasurementTypeID
                            WHERE CM.CustomerID = @CustomerID AND MT.DressID = D.DressID
                        ) THEN 1 ELSE 0 END AS HasMeasurement
                      FROM Dress D
                      WHERE D.Cloth_For_ID = @ClothForId AND D.InstitutionID = @InstitutionID
                      ORDER BY ISNULL(D.DressSerial, 99999)",
                    connection);
                cmd.Parameters.AddWithValue("@ClothForId", clothForId);
                cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                cmd.Parameters.AddWithValue("@CustomerID", customerId);
                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    list.Add(new
                    {
                        dressId = reader.GetInt32(0),
                        dressName = reader.GetString(1),
                        hasMeasurement = reader.GetInt32(2) == 1
                    });
                }

                return Ok(new { success = true, data = list });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting dresses by gender");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get measurement types with customer's existing measurements for a dress
        /// </summary>
        [HttpGet("measurement-types")]
        public async Task<ActionResult> GetMeasurementTypes([FromQuery] int institutionId, [FromQuery] int dressId, [FromQuery] int customerId)
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                // Get measurement groups
                var groups = new List<dynamic>();
                using (var cmd = new SqlCommand(
                    @"SELECT DISTINCT MT.Measurement_GroupID, ISNULL(MG.MeasurementType, 'মাপ') AS GroupName, ISNULL(MG.Ascending, 99999) AS Ascending
                      FROM Measurement_Type MT
                      LEFT JOIN Measurement_Type MG ON MT.Measurement_GroupID = MG.MeasurementTypeID
                      WHERE MT.InstitutionID = @InstitutionID AND MT.DressID = @DressID
                      ORDER BY Ascending",
                    connection))
                {
                    cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                    cmd.Parameters.AddWithValue("@DressID", dressId);
                    using var reader = await cmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        groups.Add(new
                        {
                            groupId = reader.GetInt32(0),
                            groupName = reader.GetString(1)
                        });
                    }
                }

                // Get measurement types with existing values per group
                var result = new List<object>();
                foreach (var group in groups)
                {
                    var types = new List<object>();
                    using var cmd = new SqlCommand(
                        @"SELECT MT.MeasurementTypeID, MT.MeasurementType, ISNULL(CM.Measurement, '') AS Measurement
                          FROM Measurement_Type MT
                          LEFT JOIN Customer_Measurement CM ON MT.MeasurementTypeID = CM.MeasurementTypeID AND CM.CustomerID = @CustomerID
                          WHERE MT.Measurement_GroupID = @GroupID AND MT.InstitutionID = @InstitutionID
                          ORDER BY ISNULL(MT.Measurement_Group_SerialNo, 99999)",
                        connection);
                    cmd.Parameters.AddWithValue("@CustomerID", customerId);
                    cmd.Parameters.AddWithValue("@GroupID", group.groupId);
                    cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                    using var reader = await cmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        types.Add(new
                        {
                            measurementTypeId = reader.GetInt32(0),
                            measurementType = reader.GetString(1),
                            measurement = reader.GetString(2)
                        });
                    }

                    result.Add(new { groupId = group.groupId, groupName = group.groupName, types = types });
                }

                // Get dress details note
                string cdDetails = "";
                using (var cmd = new SqlCommand(
                    "SELECT CDDetails FROM Customer_Dress WHERE CustomerID = @CustomerID AND DressID = @DressID AND InstitutionID = @InstitutionID",
                    connection))
                {
                    cmd.Parameters.AddWithValue("@CustomerID", customerId);
                    cmd.Parameters.AddWithValue("@DressID", dressId);
                    cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                    var val = await cmd.ExecuteScalarAsync();
                    cdDetails = val?.ToString() ?? "";
                }

                // Check if this dress has existing measurements
                bool hasMeasurements = result.Any(g => ((dynamic)g).types.Count > 0);

                return Ok(new { success = true, data = new { groups = result, cdDetails = cdDetails, hasMeasurements = hasMeasurements } });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting measurement types");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get style categories and styles for a dress
        /// </summary>
        [HttpGet("dress-styles")]
        public async Task<ActionResult> GetDressStyles([FromQuery] int institutionId, [FromQuery] int dressId, [FromQuery] int customerId)
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                // Get style categories
                var categories = new List<dynamic>();
                using (var cmd = new SqlCommand(
                    @"SELECT DISTINCT DSC.Dress_Style_CategoryID, DSC.Dress_Style_Category_Name, ISNULL(DSC.CategorySerial, 99999) AS SN
                      FROM Dress_Style DS
                      INNER JOIN Dress_Style_Category DSC ON DS.Dress_Style_CategoryID = DSC.Dress_Style_CategoryID
                      WHERE DS.DressID = @DressID
                      ORDER BY SN",
                    connection))
                {
                    cmd.Parameters.AddWithValue("@DressID", dressId);
                    using var reader = await cmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        categories.Add(new
                        {
                            categoryId = reader.GetInt32(0),
                            categoryName = reader.GetString(1)
                        });
                    }
                }

                var result = new List<object>();
                foreach (var cat in categories)
                {
                    var styles = new List<object>();
                    using var cmd = new SqlCommand(
                        @"SELECT DS.Dress_StyleID, DS.Dress_Style_Name, 
                                 ISNULL(CDS.DressStyleMesurement, '') AS DressStyleMesurement,
                                 CASE WHEN CDS.Dress_StyleID IS NULL THEN 0 ELSE 1 END AS IsCheck
                          FROM Dress_Style DS
                          LEFT JOIN Customer_Dress_Style CDS ON DS.Dress_StyleID = CDS.Dress_StyleID AND CDS.CustomerID = @CustomerID
                          WHERE DS.Dress_Style_CategoryID = @CategoryID
                          ORDER BY ISNULL(DS.StyleSerial, 99999)",
                        connection);
                    cmd.Parameters.AddWithValue("@CustomerID", customerId);
                    cmd.Parameters.AddWithValue("@CategoryID", cat.categoryId);
                    using var reader = await cmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        styles.Add(new
                        {
                            styleId = reader.GetInt32(0),
                            styleName = reader.GetString(1),
                            styleMeasurement = reader.GetString(2),
                            isChecked = reader.GetInt32(3) == 1
                        });
                    }

                    result.Add(new { categoryId = cat.categoryId, categoryName = cat.categoryName, styles = styles });
                }

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting dress styles");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Save customer measurements and styles
        /// </summary>
        [HttpPost("save-measurements")]
        public async Task<ActionResult> SaveMeasurements([FromBody] SaveMeasurementsModel model)
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();
                using var transaction = connection.BeginTransaction();

                try
                {
                    // Save measurements
                    foreach (var m in model.Measurements)
                    {
                        if (!string.IsNullOrWhiteSpace(m.Measurement))
                        {
                            using var cmd = new SqlCommand(@"
                                IF NOT EXISTS (SELECT 1 FROM Customer_Measurement WHERE InstitutionID=@InstitutionID AND CustomerID=@CustomerID AND MeasurementTypeID=@MeasurementTypeID)
                                    INSERT INTO Customer_Measurement (RegistrationID, InstitutionID, CustomerID, MeasurementTypeID, Measurement) VALUES (@RegistrationID, @InstitutionID, @CustomerID, @MeasurementTypeID, @Measurement)
                                ELSE
                                    UPDATE Customer_Measurement SET Measurement=@Measurement WHERE MeasurementTypeID=@MeasurementTypeID AND CustomerID=@CustomerID",
                                connection, transaction);
                            cmd.Parameters.AddWithValue("@InstitutionID", model.InstitutionId);
                            cmd.Parameters.AddWithValue("@CustomerID", model.CustomerId);
                            cmd.Parameters.AddWithValue("@RegistrationID", model.RegistrationId);
                            cmd.Parameters.AddWithValue("@MeasurementTypeID", m.MeasurementTypeId);
                            cmd.Parameters.AddWithValue("@Measurement", m.Measurement);
                            await cmd.ExecuteNonQueryAsync();
                        }
                        else
                        {
                            using var cmd = new SqlCommand(
                                "DELETE FROM Customer_Measurement WHERE MeasurementTypeID=@MeasurementTypeID AND CustomerID=@CustomerID",
                                connection, transaction);
                            cmd.Parameters.AddWithValue("@MeasurementTypeID", m.MeasurementTypeId);
                            cmd.Parameters.AddWithValue("@CustomerID", model.CustomerId);
                            await cmd.ExecuteNonQueryAsync();
                        }
                    }

                    // Save styles
                    foreach (var s in model.Styles)
                    {
                        if (s.IsChecked)
                        {
                            using var cmd = new SqlCommand(@"
                                IF NOT EXISTS (SELECT 1 FROM Customer_Dress_Style WHERE InstitutionID=@InstitutionID AND CustomerID=@CustomerID AND Dress_StyleID=@Dress_StyleID)
                                    INSERT INTO Customer_Dress_Style (RegistrationID, InstitutionID, CustomerID, Dress_StyleID, DressStyleMesurement) VALUES (@RegistrationID, @InstitutionID, @CustomerID, @Dress_StyleID, @DressStyleMesurement)
                                ELSE
                                    UPDATE Customer_Dress_Style SET DressStyleMesurement=@DressStyleMesurement WHERE Dress_StyleID=@Dress_StyleID AND CustomerID=@CustomerID AND InstitutionID=@InstitutionID",
                                connection, transaction);
                            cmd.Parameters.AddWithValue("@InstitutionID", model.InstitutionId);
                            cmd.Parameters.AddWithValue("@CustomerID", model.CustomerId);
                            cmd.Parameters.AddWithValue("@RegistrationID", model.RegistrationId);
                            cmd.Parameters.AddWithValue("@Dress_StyleID", s.StyleId);
                            cmd.Parameters.AddWithValue("@DressStyleMesurement", s.StyleMeasurement ?? "");
                            await cmd.ExecuteNonQueryAsync();
                        }
                        else
                        {
                            using var cmd = new SqlCommand(
                                "DELETE FROM Customer_Dress_Style WHERE Dress_StyleID=@Dress_StyleID AND CustomerID=@CustomerID AND InstitutionID=@InstitutionID",
                                connection, transaction);
                            cmd.Parameters.AddWithValue("@Dress_StyleID", s.StyleId);
                            cmd.Parameters.AddWithValue("@CustomerID", model.CustomerId);
                            cmd.Parameters.AddWithValue("@InstitutionID", model.InstitutionId);
                            await cmd.ExecuteNonQueryAsync();
                        }
                    }

                    // Save/update Customer_Dress details
                    using (var cmd = new SqlCommand(@"
                        IF NOT EXISTS (SELECT 1 FROM Customer_Dress WHERE CustomerID=@CustomerID AND DressID=@DressID AND InstitutionID=@InstitutionID)
                            INSERT INTO Customer_Dress (RegistrationID, InstitutionID, CustomerID, DressID, CDDetails) VALUES (@RegistrationID, @InstitutionID, @CustomerID, @DressID, @CDDetails)
                        ELSE
                            UPDATE Customer_Dress SET CDDetails=@CDDetails WHERE CustomerID=@CustomerID AND DressID=@DressID AND InstitutionID=@InstitutionID",
                        connection, transaction))
                    {
                        cmd.Parameters.AddWithValue("@CustomerID", model.CustomerId);
                        cmd.Parameters.AddWithValue("@DressID", model.DressId);
                        cmd.Parameters.AddWithValue("@InstitutionID", model.InstitutionId);
                        cmd.Parameters.AddWithValue("@RegistrationID", model.RegistrationId);
                        cmd.Parameters.AddWithValue("@CDDetails", model.CdDetails ?? "");
                        await cmd.ExecuteNonQueryAsync();
                    }

                    transaction.Commit();
                    return Ok(new { success = true, message = "আপনি সফল ভাবে এই কাস্টমারের মাপ যুক্ত/পরিবর্তন করতে পেরেছেন!" });
                }
                catch (Exception)
                {
                    transaction.Rollback();
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving measurements");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get customer due orders
        /// </summary>
        [HttpGet("due-orders")]
        public async Task<ActionResult> GetDueOrders([FromQuery] int customerId, [FromQuery] int institutionId)
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                var orders = new List<object>();
                using var cmd = new SqlCommand(@"
                    SELECT [Order].OrderID, [Order].OrderSerialNumber, [Order].OrderDate, [Order].DeliveryDate,
                           [Order].OrderAmount, [Order].PaidAmount, [Order].Discount, [Order].DueAmount, [Order].DeliveryStatus,
                           STUFF((SELECT '; ' + D.Dress_Name + ' ' + CAST(OL.DressQuantity AS NVARCHAR(50)) + ' Piece '
                                  FROM OrderList OL INNER JOIN Dress D ON OL.DressID = D.DressID
                                  WHERE OL.OrderID = [Order].OrderID FOR XML PATH('')), 1, 1, '') AS Details
                    FROM [Order]
                    INNER JOIN Customer ON [Order].CustomerID = Customer.CustomerID
                    WHERE [Order].InstitutionID = @InstitutionID AND [Order].CustomerID = @CustomerID AND [Order].PaymentStatus = 'Due'
                    ORDER BY [Order].OrderDate DESC", connection);
                cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                cmd.Parameters.AddWithValue("@CustomerID", customerId);
                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    orders.Add(new
                    {
                        orderId = reader.GetInt32(0),
                        orderSerialNumber = Convert.ToInt32(reader.GetValue(1)),
                        orderDate = reader.GetDateTime(2),
                        deliveryDate = reader.IsDBNull(3) ? (DateTime?)null : reader.GetDateTime(3),
                        orderAmount = reader.IsDBNull(4) ? 0.0 : reader.GetDouble(4),
                        paidAmount = reader.IsDBNull(5) ? 0.0 : reader.GetDouble(5),
                        discount = reader.IsDBNull(6) ? 0.0 : reader.GetDouble(6),
                        dueAmount = reader.IsDBNull(7) ? 0.0 : reader.GetDouble(7),
                        deliveryStatus = reader.IsDBNull(8) ? "" : reader.GetString(8),
                        details = reader.IsDBNull(9) ? "" : reader.GetString(9)
                    });
                }

                return Ok(new { success = true, data = orders });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting due orders");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Collect due payment
        /// </summary>
        [HttpPost("collect-due")]
        public async Task<ActionResult> CollectDue([FromBody] CollectDueModel model)
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();
                using var transaction = connection.BeginTransaction();

                try
                {
                    foreach (var item in model.Payments)
                    {
                        // Update Order: only PaidAmount and Discount — DueAmount & PaymentStatus are computed columns
                        using (var updateOrderCmd = new SqlCommand(@"
                            UPDATE [Order]
                            SET PaidAmount = PaidAmount + @PaidAmount,
                                Discount   = Discount   + @DiscountAmount
                            WHERE OrderID = @OrderID",
                            connection, transaction))
                        {
                            updateOrderCmd.Parameters.AddWithValue("@PaidAmount", item.PaidAmount);
                            updateOrderCmd.Parameters.AddWithValue("@DiscountAmount", item.DiscountAmount);
                            updateOrderCmd.Parameters.AddWithValue("@OrderID", item.OrderId);
                            await updateOrderCmd.ExecuteNonQueryAsync();
                        }

                        if (item.PaidAmount > 0)
                        {
                            string paymentStatus = item.DeliveryStatus == "Delivered" ? "After Delivery"
                                : item.DeliveryStatus == "PartlyDelivered" ? "Partly Delivered"
                                : "Re-Advance";

                            using var payCmd = new SqlCommand(@"
                                INSERT INTO Payment_Record(OrderID, CustomerID, RegistrationID, InstitutionID, Amount, Payment_TimeStatus, AccountID)
                                VALUES(@OrderID, @CustomerID, @RegistrationID, @InstitutionID, @Amount, @Payment_TimeStatus, @AccountID)",
                                connection, transaction);
                            payCmd.Parameters.AddWithValue("@OrderID", item.OrderId);
                            payCmd.Parameters.AddWithValue("@CustomerID", model.CustomerId);
                            payCmd.Parameters.AddWithValue("@RegistrationID", model.RegistrationId);
                            payCmd.Parameters.AddWithValue("@InstitutionID", model.InstitutionId);
                            payCmd.Parameters.AddWithValue("@Amount", item.PaidAmount);
                            payCmd.Parameters.AddWithValue("@Payment_TimeStatus", paymentStatus);
                            payCmd.Parameters.AddWithValue("@AccountID", item.AccountId.HasValue ? (object)item.AccountId.Value : DBNull.Value);
                            await payCmd.ExecuteNonQueryAsync();
                        }
                    }

                    // Update Customer_Due = SUM of all due orders for this customer
                    // DueAmount is computed: OrderAmount - PaidAmount - Discount
                    using (var updateCustomerCmd = new SqlCommand(@"
                        UPDATE Customer
                        SET Customer_Due = ISNULL((
                            SELECT SUM(DueAmount) FROM [Order]
                            WHERE CustomerID = @CustomerID AND InstitutionID = @InstitutionID AND DueAmount > 0
                        ), 0)
                        WHERE CustomerID = @CustomerID AND InstitutionID = @InstitutionID",
                        connection, transaction))
                    {
                        updateCustomerCmd.Parameters.AddWithValue("@CustomerID", model.CustomerId);
                        updateCustomerCmd.Parameters.AddWithValue("@InstitutionID", model.InstitutionId);
                        await updateCustomerCmd.ExecuteNonQueryAsync();
                    }

                    transaction.Commit();
                    return Ok(new { success = true, message = "বাকি টাকা সফলভাবে সংগ্রহ হয়েছে" });
                }
                catch
                {
                    transaction.Rollback();
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error collecting due");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get customer pending + delivered orders
        /// </summary>
        [HttpGet("customer-orders")]
        public async Task<ActionResult> GetCustomerOrders([FromQuery] int customerId, [FromQuery] int institutionId, [FromQuery] string status = "Pending")
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                var orders = new List<object>();
                using var cmd = new SqlCommand(@"
                    SELECT [Order].OrderID, [Order].OrderSerialNumber, [Order].OrderDate, [Order].DeliveryDate,
                           [Order].OrderAmount, [Order].PaidAmount, [Order].Discount, [Order].DueAmount, [Order].DeliveryStatus,
                           STUFF((SELECT '; ' + D.Dress_Name + ' ' + CAST(OL.DressQuantity AS NVARCHAR(50)) + ' Piece '
                                  FROM OrderList OL INNER JOIN Dress D ON OL.DressID = D.DressID
                                  WHERE OL.OrderID = [Order].OrderID FOR XML PATH('')), 1, 1, '') AS Details
                    FROM [Order]
                    INNER JOIN Customer ON [Order].CustomerID = Customer.CustomerID
                    WHERE [Order].InstitutionID = @InstitutionID AND [Order].CustomerID = @CustomerID AND [Order].DeliveryStatus = @DeliveryStatus
                    ORDER BY [Order].OrderDate DESC", connection);
                cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                cmd.Parameters.AddWithValue("@CustomerID", customerId);
                cmd.Parameters.AddWithValue("@DeliveryStatus", status);
                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    orders.Add(new
                    {
                        orderId = reader.GetInt32(0),
                        orderSerialNumber = Convert.ToInt32(reader.GetValue(1)),
                        orderDate = reader.GetDateTime(2),
                        deliveryDate = reader.IsDBNull(3) ? (DateTime?)null : reader.GetDateTime(3),
                        orderAmount = reader.IsDBNull(4) ? 0.0 : reader.GetDouble(4),
                        paidAmount = reader.IsDBNull(5) ? 0.0 : reader.GetDouble(5),
                        discount = reader.IsDBNull(6) ? 0.0 : reader.GetDouble(6),
                        dueAmount = reader.IsDBNull(7) ? 0.0 : reader.GetDouble(7),
                        deliveryStatus = reader.IsDBNull(8) ? "" : reader.GetString(8),
                        details = reader.IsDBNull(9) ? "" : reader.GetString(9)
                    });
                }

                return Ok(new { success = true, data = orders });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customer orders");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get payment records for customer
        /// </summary>
        [HttpGet("payment-records")]
        public async Task<ActionResult> GetPaymentRecords([FromQuery] int customerId, [FromQuery] int institutionId)
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                var records = new List<object>();
                using var cmd = new SqlCommand(@"
                    SELECT [Order].OrderSerialNumber, PR.Amount,
                           ISNULL(A.AccountName, 'Without Account') AS Account,
                           PR.Payment_TimeStatus, PR.OrderPaid_Date
                    FROM Payment_Record PR
                    INNER JOIN [Order] ON PR.OrderID = [Order].OrderID
                    LEFT JOIN Account A ON PR.AccountID = A.AccountID
                    WHERE PR.InstitutionID = @InstitutionID AND PR.CustomerID = @CustomerID
                    ORDER BY PR.OrderPaid_Date DESC", connection);
                cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                cmd.Parameters.AddWithValue("@CustomerID", customerId);
                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    records.Add(new
                    {
                        orderSerialNumber = Convert.ToInt32(reader.GetValue(0)),
                        amount = reader.IsDBNull(1) ? 0.0 : reader.GetDouble(1),
                        account = reader.GetString(2),
                        paymentStatus = reader.GetString(3),
                        paidDate = reader.IsDBNull(4) ? (DateTime?)null : reader.GetDateTime(4)
                    });
                }

                return Ok(new { success = true, data = records });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting payment records");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get accounts list
        /// </summary>
        [HttpGet("accounts")]
        public async Task<ActionResult> GetAccounts([FromQuery] int institutionId)
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                var list = new List<object>();
                using var cmd = new SqlCommand(
                    "SELECT AccountID, AccountName, ISNULL(Default_Status,'') AS Default_Status FROM Account WHERE InstitutionID = @InstitutionID ORDER BY CASE WHEN Default_Status = 'True' THEN 0 ELSE 1 END",
                    connection);
                cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    var defaultStatusRaw = reader.GetValue(2);
                    bool isDefault = false;
                    if (defaultStatusRaw != DBNull.Value)
                    {
                        var dsStr = defaultStatusRaw.ToString();
                        isDefault = dsStr == "True" || dsStr == "1";
                    }

                    list.Add(new
                    {
                        accountId = reader.GetInt32(0),
                        accountName = reader.GetString(1),
                        isDefault
                    });
                }

                return Ok(new { success = true, data = list });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting accounts");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get customer list with search and pagination
        /// </summary>
        [HttpGet("customer-list")]
        public async Task<ActionResult> GetCustomerList(
            [FromQuery] int institutionId,
            [FromQuery] string customerNo = "",
            [FromQuery] string customerName = "",
            [FromQuery] string phone = "",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                int custNo = 0;
                int.TryParse(customerNo, out custNo);

                var countQuery = @"
                    SELECT COUNT(*) FROM Customer
                    WHERE InstitutionID = @InstitutionID
                      AND (Phone LIKE '%' + @Phone + '%')
                      AND (CustomerNumber = @CustomerNumber OR @CustomerNumber = 0)
                      AND (ISNULL(CustomerName, N'') LIKE '%' + @CustomerName + '%')";

                int totalCount = 0;
                using (var countCmd = new SqlCommand(countQuery, connection))
                {
                    countCmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                    countCmd.Parameters.AddWithValue("@Phone", phone ?? "");
                    countCmd.Parameters.AddWithValue("@CustomerNumber", custNo);
                    countCmd.Parameters.AddWithValue("@CustomerName", customerName ?? "");
                    totalCount = Convert.ToInt32(await countCmd.ExecuteScalarAsync());
                }

                // Total due — calculated live from [Order] table
                double totalDue = 0;
                using (var dueCmd = new SqlCommand(
                    @"SELECT ISNULL(SUM(o.DueAmount), 0)
                      FROM [Order] o
                      INNER JOIN Customer c ON o.CustomerID = c.CustomerID
                      WHERE c.InstitutionID = @InstitutionID AND o.DueAmount > 0",
                    connection))
                {
                    dueCmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                    totalDue = Convert.ToDouble(await dueCmd.ExecuteScalarAsync());
                }

                var dataQuery = @"
                    SELECT c.CustomerID, c.Cloth_For_ID, c.CustomerNumber, c.CustomerName, c.Phone, c.Address,
                           c.Description,
                           ISNULL((SELECT SUM(o.DueAmount) FROM [Order] o
                                   WHERE o.CustomerID = c.CustomerID AND o.DueAmount > 0), 0) AS Customer_Due,
                           c.Date
                    FROM Customer c
                    WHERE c.InstitutionID = @InstitutionID
                      AND (c.Phone LIKE '%' + @Phone + '%')
                      AND (c.CustomerNumber = @CustomerNumber OR @CustomerNumber = 0)
                      AND (ISNULL(c.CustomerName, N'') LIKE '%' + @CustomerName + '%')
                    ORDER BY c.Date DESC
                    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

                var customers = new List<object>();
                using (var cmd = new SqlCommand(dataQuery, connection))
                {
                    cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                    cmd.Parameters.AddWithValue("@Phone", phone ?? "");
                    cmd.Parameters.AddWithValue("@CustomerNumber", custNo);
                    cmd.Parameters.AddWithValue("@CustomerName", customerName ?? "");
                    cmd.Parameters.AddWithValue("@Offset", (page - 1) * pageSize);
                    cmd.Parameters.AddWithValue("@PageSize", pageSize);

                    using var reader = await cmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        customers.Add(new
                        {
                            customerId = reader.GetInt32(0),
                            clothForId = reader.GetInt32(1),
                            customerNumber = reader.IsDBNull(2) ? 0 : Convert.ToInt32(reader.GetValue(2)),
                            customerName = reader.IsDBNull(3) ? "" : reader.GetString(3),
                            phone = reader.IsDBNull(4) ? "" : reader.GetString(4),
                            address = reader.IsDBNull(5) ? "" : reader.GetString(5),
                            description = reader.IsDBNull(6) ? "" : reader.GetString(6),
                            customerDue = Convert.ToDouble(reader.GetValue(7)),
                            date = reader.IsDBNull(8) ? (DateTime?)null : reader.GetDateTime(8)
                        });
                    }
                }

                int totalPages = (int)Math.Ceiling((double)totalCount / pageSize);
                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        customers,
                        totalCount,
                        totalDue,
                        currentPage = page,
                        totalPages
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customer list");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Update customer info
        /// </summary>
        [HttpPut("update-customer")]
        public async Task<ActionResult> UpdateCustomerInfo([FromBody] UpdateCustomerModel model)
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                using var cmd = new SqlCommand(
                    "UPDATE Customer SET CustomerName=@CustomerName, Phone=@Phone, Address=@Address, Description=@Description WHERE CustomerID=@CustomerID AND InstitutionID=@InstitutionID",
                    connection);
                cmd.Parameters.AddWithValue("@CustomerName", model.CustomerName ?? "");
                cmd.Parameters.AddWithValue("@Phone", model.Phone ?? "");
                cmd.Parameters.AddWithValue("@Address", model.Address ?? "");
                cmd.Parameters.AddWithValue("@Description", model.Description ?? "");
                cmd.Parameters.AddWithValue("@CustomerID", model.CustomerId);
                cmd.Parameters.AddWithValue("@InstitutionID", model.InstitutionId);
                await cmd.ExecuteNonQueryAsync();

                return Ok(new { success = true, message = "কাস্টমার তথ্য আপডেট হয়েছে" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating customer");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Delete customer
        /// </summary>
        [HttpDelete("delete-customer/{customerId}")]
        public async Task<ActionResult> DeleteCustomer(int customerId, [FromQuery] int institutionId)
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");
                using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync();

                // Check if customer has orders
                using (var checkCmd = new SqlCommand(
                    "SELECT COUNT(*) FROM [Order] WHERE CustomerID=@CustomerID AND InstitutionID=@InstitutionID",
                    connection))
                {
                    checkCmd.Parameters.AddWithValue("@CustomerID", customerId);
                    checkCmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                    int orderCount = Convert.ToInt32(await checkCmd.ExecuteScalarAsync());
                    if (orderCount > 0)
                        return BadRequest(new { success = false, message = "আপনি এই কাস্টমারকে ডিলেট করতে পারবেন না! কাস্টমারের অর্ডার রয়েছে।" });
                }

                using var cmd = new SqlCommand(
                    "DELETE FROM Customer WHERE CustomerID=@CustomerID AND InstitutionID=@InstitutionID",
                    connection);
                cmd.Parameters.AddWithValue("@CustomerID", customerId);
                cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                await cmd.ExecuteNonQueryAsync();

                return Ok(new { success = true, message = "কাস্টমার ডিলেট হয়েছে" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting customer");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // Model classes
        public class AddCustomerModel
        {
            public int InstitutionId { get; set; }
            public int RegistrationId { get; set; }
            public int ClothForId { get; set; }
            public string CustomerName { get; set; } = "";
            public string Phone { get; set; } = "";
            public string Address { get; set; } = "";
        }

        public class SaveMeasurementsModel
        {
            public int InstitutionId { get; set; }
            public int RegistrationId { get; set; }
            public int CustomerId { get; set; }
            public int DressId { get; set; }
            public string CdDetails { get; set; } = "";
            public List<MeasurementItem> Measurements { get; set; } = new();
            public List<StyleItem> Styles { get; set; } = new();
        }

        public class MeasurementItem
        {
            public int MeasurementTypeId { get; set; }
            public string Measurement { get; set; } = "";
        }

        public class StyleItem
        {
            public int StyleId { get; set; }
            public bool IsChecked { get; set; }
            public string StyleMeasurement { get; set; } = "";
        }

        public class CollectDueModel
        {
            public int InstitutionId { get; set; }
            public int RegistrationId { get; set; }
            public int CustomerId { get; set; }
            public List<DuePaymentItem> Payments { get; set; } = new();
        }

        public class DuePaymentItem
        {
            public int OrderId { get; set; }
            public double PaidAmount { get; set; }
            public double DiscountAmount { get; set; }
            public string DeliveryStatus { get; set; } = "";
            public int? AccountId { get; set; }
        }

        public class UpdateCustomerModel
        {
            public int CustomerId { get; set; }
            public int InstitutionId { get; set; }
            public string CustomerName { get; set; } = "";
            public string Phone { get; set; } = "";
            public string Address { get; set; } = "";
            public string Description { get; set; } = "";
        }
    }
}
