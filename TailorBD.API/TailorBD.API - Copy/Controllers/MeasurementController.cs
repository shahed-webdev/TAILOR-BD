using Microsoft.AspNetCore.Mvc;
using Dapper;
using TailorBD.API.Data;
using System.Data.SqlClient;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MeasurementController : ControllerBase
    {
        private readonly TailorBdContext _context;

        public MeasurementController(TailorBdContext context)
        {
            _context = context;
        }

        // GET: api/Measurement/dress/{dressId}
        [HttpGet("dress/{dressId}")]
        public IActionResult GetMeasurementGroups(int dressId, [FromQuery] int institutionId, [FromQuery] int clothForId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                
                var query = @"
                    SELECT 
                        MeasurementTypeID,
                        DressID,
                        MeasurementType,
                        Ascending
                    FROM Measurement_Type
                    WHERE MeasurementTypeID IN (
                        SELECT DISTINCT Measurement_GroupID 
                        FROM Measurement_Type 
                        WHERE Cloth_For_ID = @ClothForId 
                        AND InstitutionID = @InstitutionId 
                        AND DressID = @DressId
                    )
                    ORDER BY ISNULL(Ascending, 99999)";

                var groups = connection.Query<dynamic>(query, new 
                { 
                    DressId = dressId, 
                    InstitutionId = institutionId,
                    ClothForId = clothForId
                });

                return Ok(new
                {
                    success = true,
                    data = groups
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        // GET: api/Measurement/group/{groupId}/types
        [HttpGet("group/{groupId}/types")]
        public IActionResult GetMeasurementTypes(int groupId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                
                var query = @"
                    SELECT 
                        MeasurementTypeID,
                        MeasurementType,
                        Measurement_Group_SerialNo as SerialNo
                    FROM Measurement_Type
                    WHERE Measurement_GroupID = @GroupId
                    ORDER BY ISNULL(Measurement_Group_SerialNo, 99999)";

                var types = connection.Query<dynamic>(query, new { GroupId = groupId });

                return Ok(new
                {
                    success = true,
                    data = types
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        // POST: api/Measurement/group
        [HttpPost("group")]
        public IActionResult AddMeasurementGroup([FromBody] MeasurementGroupModel model)
        {
            try
            {
                using var connection = _context.CreateConnection();
                
                var insertQuery = @"
                    INSERT INTO Measurement_Type
                    (Cloth_For_ID, InstitutionID, MeasurementType, Date, DressID, Ascending, RegistrationID)
                    VALUES 
                    (@ClothForId, @InstitutionId, @MeasurementType, GETDATE(), @DressId, @Ascending, @RegistrationId);
                    
                    DECLARE @Id INT = SCOPE_IDENTITY();
                    UPDATE Measurement_Type SET Measurement_GroupID = @Id WHERE MeasurementTypeID = @Id;
                    SELECT @Id;";

                var id = connection.QuerySingle<int>(insertQuery, model);

                return Ok(new
                {
                    success = true,
                    message = "মাপের গ্রুপ সফলভাবে যুক্ত হয়েছে",
                    data = new { MeasurementTypeId = id }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        // POST: api/Measurement/type
        [HttpPost("type")]
        public IActionResult AddMeasurementType([FromBody] MeasurementTypeModel model)
        {
            try
            {
                using var connection = _context.CreateConnection();
                
                var insertQuery = @"
                    INSERT INTO Measurement_Type
                    (Cloth_For_ID, InstitutionID, MeasurementType, Date, DressID, Measurement_GroupID, Measurement_Group_SerialNo, RegistrationID)
                    VALUES 
                    (@ClothForId, @InstitutionId, @MeasurementType, GETDATE(), @DressId, @MeasurementGroupId, @SerialNo, @RegistrationId);
                    SELECT CAST(SCOPE_IDENTITY() as int)";

                var id = connection.QuerySingle<int>(insertQuery, model);

                return Ok(new
                {
                    success = true,
                    message = "মাপ সফলভাবে যুক্ত হয়েছে",
                    data = new { MeasurementTypeId = id }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        // PUT: api/Measurement/group/{id}
        [HttpPut("group/{id}")]
        public IActionResult UpdateMeasurementGroup(int id, [FromBody] MeasurementGroupModel model)
        {
            try
            {
                using var connection = _context.CreateConnection();
                
                var updateQuery = @"
                    UPDATE Measurement_Type 
                    SET MeasurementType = @MeasurementType,
                        Ascending = @Ascending
                    WHERE MeasurementTypeID = @Id
                    AND InstitutionID = @InstitutionId";

                model.Id = id;
                connection.Execute(updateQuery, model);

                return Ok(new
                {
                    success = true,
                    message = "মাপের গ্রুপ সফলভাবে আপডেট হয়েছে"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        // PUT: api/Measurement/type/{id}
        [HttpPut("type/{id}")]
        public IActionResult UpdateMeasurementType(int id, [FromBody] MeasurementTypeModel model)
        {
            try
            {
                using var connection = _context.CreateConnection();
                
                var updateQuery = @"
                    UPDATE Measurement_Type 
                    SET MeasurementType = @MeasurementType,
                        Measurement_Group_SerialNo = @SerialNo
                    WHERE MeasurementTypeID = @Id
                    AND InstitutionID = @InstitutionId";

                model.Id = id;
                connection.Execute(updateQuery, model);

                return Ok(new
                {
                    success = true,
                    message = "মাপ সফলভাবে আপডেট হয়েছে"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        // DELETE: api/Measurement/group/{id}
        [HttpDelete("group/{id}")]
        public IActionResult DeleteMeasurementGroup(int id, [FromQuery] int institutionId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                
                var deleteQuery = @"
                    DELETE FROM Measurement_Type 
                    WHERE MeasurementTypeID = @Id;
                    
                    UPDATE Measurement_Type 
                    SET Measurement_GroupID = MeasurementTypeID 
                    WHERE Measurement_GroupID = @Id";

                connection.Execute(deleteQuery, new { Id = id });

                return Ok(new
                {
                    success = true,
                    message = "মাপের গ্রুপ সফলভাবে ডিলিট হয়েছে"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        // DELETE: api/Measurement/type/{id}
        [HttpDelete("type/{id}")]
        public IActionResult DeleteMeasurementType(int id)
        {
            try
            {
                using var connection = _context.CreateConnection();
                
                var deleteQuery = "DELETE FROM Measurement_Type WHERE MeasurementTypeID = @Id";
                connection.Execute(deleteQuery, new { Id = id });

                return Ok(new
                {
                    success = true,
                    message = "মাপ সফলভাবে ডিলিট হয়েছে"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        // PUT: api/Measurement/update-serials
        [HttpPut("update-serials")]
        public IActionResult UpdateSerials([FromBody] List<SerialUpdateModel> serials)
        {
            try
            {
                using var connection = _context.CreateConnection();
                
                foreach (var item in serials)
                {
                    var updateQuery = @"
                        UPDATE Measurement_Type 
                        SET Ascending = @Ascending
                        WHERE MeasurementTypeID = @Id
                        AND InstitutionID = @InstitutionId";
                    
                    connection.Execute(updateQuery, item);
                }

                return Ok(new
                {
                    success = true,
                    message = "সিরিয়াল সফলভাবে আপডেট হয়েছে"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        // GET: api/Measurement/dress-measurements-styles
        [HttpGet("dress-measurements-styles")]
        public IActionResult GetDressMeasurementsAndStyles(
            [FromQuery] int dressId, 
            [FromQuery] int customerId, 
            [FromQuery] int institutionId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                
                // Get order details
                var detailsQuery = @"
                    SELECT CDDetails 
                    FROM Customer_Dress 
                    WHERE CustomerID = @CustomerId 
                    AND DressID = @DressId 
                    AND InstitutionID = @InstitutionId";
                
                var orderDetails = connection.QueryFirstOrDefault<string>(detailsQuery, 
                    new { CustomerId = customerId, DressId = dressId, InstitutionId = institutionId }) ?? "";

                // Get measurement groups
                var measurementGroupsQuery = @"
                    SELECT DISTINCT 
                        Measurement_GroupID as MeasurementGroupId, 
                        ISNULL(Ascending, 99999) AS Ascending 
                    FROM Measurement_Type 
                    WHERE InstitutionID = @InstitutionId 
                    AND DressID = @DressId 
                    ORDER BY Ascending";
                
                var groups = connection.Query<dynamic>(measurementGroupsQuery, 
                    new { InstitutionId = institutionId, DressId = dressId }).ToList();

                // Get measurements for each group
                var measurementGroups = new List<object>();
                foreach (var group in groups)
                {
                    var measurementsQuery = @"
                        SELECT 
                            mt.MeasurementTypeID, 
                            mt.MeasurementType, 
                            ISNULL(cm.Measurement, '') as Measurement, 
                            mt.Measurement_Group_SerialNo 
                        FROM Measurement_Type mt
                        LEFT OUTER JOIN (
                            SELECT Measurement, MeasurementTypeID 
                            FROM Customer_Measurement 
                            WHERE CustomerID = @CustomerId
                        ) AS cm ON mt.MeasurementTypeID = cm.MeasurementTypeID 
                        WHERE mt.Measurement_GroupID = @GroupId 
                        ORDER BY ISNULL(mt.Measurement_Group_SerialNo, 99999)";
                    
                    var measurements = connection.Query<dynamic>(measurementsQuery, 
                        new { GroupId = (int)group.MeasurementGroupId, CustomerId = customerId }).ToList();
                    
                    measurementGroups.Add(new
                    {
                        MeasurementGroupId = group.MeasurementGroupId,
                        Measurements = measurements
                    });
                }

                // Get style categories
                var styleCategoriesQuery = @"
                    SELECT DISTINCT 
                        dsc.Dress_Style_Category_Name as DressStyleCategoryName, 
                        ds.Dress_Style_CategoryID as DressStyleCategoryId, 
                        ISNULL(dsc.CategorySerial, 99999) AS SN 
                    FROM Dress_Style ds
                    INNER JOIN Dress_Style_Category dsc 
                        ON ds.Dress_Style_CategoryID = dsc.Dress_Style_CategoryID 
                    WHERE ds.DressID = @DressId 
                    ORDER BY SN";
                
                var categories = connection.Query<dynamic>(styleCategoriesQuery, 
                    new { DressId = dressId }).ToList();

                // Get styles for each category
                var styleGroups = new List<object>();
                foreach (var category in categories)
                {
                    var stylesQuery = @"
                        SELECT 
                            ds.Dress_StyleID as DressStyleId, 
                            ds.Dress_Style_Name as DressStyleName, 
                            ISNULL(cds.DressStyleMesurement, '') as DressStyleMesurement, 
                            CAST(CASE WHEN cds.Dress_StyleID IS NULL THEN 0 ELSE 1 END AS BIT) AS IsCheck 
                        FROM Dress_Style ds
                        LEFT OUTER JOIN (
                            SELECT DressStyleMesurement, Dress_StyleID 
                            FROM Customer_Dress_Style 
                            WHERE CustomerID = @CustomerId
                        ) AS cds ON ds.Dress_StyleID = cds.Dress_StyleID 
                        WHERE ds.Dress_Style_CategoryID = @CategoryId 
                        ORDER BY ISNULL(ds.StyleSerial, 99999)";
                    
                    var styles = connection.Query<dynamic>(stylesQuery, 
                        new { CategoryId = (int)category.DressStyleCategoryId, CustomerId = customerId }).ToList();
                    
                    styleGroups.Add(new
                    {
                        DressStyleCategoryId = category.DressStyleCategoryId,
                        DressStyleCategoryName = category.DressStyleCategoryName,
                        Styles = styles
                    });
                }

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        orderDetails = orderDetails,
                        measurementGroups = measurementGroups,
                        styleGroups = styleGroups
                    }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        /// <summary>
        /// Get list of dress IDs that have measurements for a specific customer
        /// </summary>
        [HttpGet("customer-dresses-with-measurements")]
        public IActionResult GetCustomerDressesWithMeasurements(int customerId, int institutionId)
        {
            try
            {
                using var connection = _context.CreateConnection();

                var query = @"
                    SELECT DISTINCT ol.DressID
                    FROM OrderList ol
                    INNER JOIN Ordered_Measurement om ON ol.OrderListID = om.OrderListID
                    WHERE ol.CustomerID = @CustomerID 
                    AND ol.InstitutionID = @InstitutionID
                    AND om.Measurement IS NOT NULL
                    AND om.Measurement != ''
                    ORDER BY ol.DressID";

                var dressIds = connection.Query<int>(query, new 
                { 
                    CustomerID = customerId, 
                    InstitutionID = institutionId 
                }).ToList();

                return Ok(new
                {
                    success = true,
                    data = dressIds
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to get dresses with measurements: " + ex.Message
                });
            }
        }
    }

    public class MeasurementGroupModel
    {
        public int? Id { get; set; }
        public int ClothForId { get; set; }
        public int InstitutionId { get; set; }
        public int RegistrationId { get; set; }
        public int DressId { get; set; }
        public string MeasurementType { get; set; }
        public int? Ascending { get; set; }
    }

    public class MeasurementTypeModel
    {
        public int? Id { get; set; }
        public int ClothForId { get; set; }
        public int InstitutionId { get; set; }
        public int RegistrationId { get; set; }
        public int DressId { get; set; }
        public int MeasurementGroupId { get; set; }
        public string MeasurementType { get; set; }
        public int? SerialNo { get; set; }
    }

    public class SerialUpdateModel
    {
        public int Id { get; set; }
        public int InstitutionId { get; set; }
        public int Ascending { get; set; }
    }
}
