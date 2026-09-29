using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Dapper;
using TailorBD.API.Data;
using TailorBD.API.Helpers;
using System.Data.SqlClient;

namespace TailorBD.API.Controllers
{
    [Authorize]
    [ShopScoped] // login required; InstitutionID always comes from the token
    [Route("api/[controller]")]
    [ApiController]
    public class MeasurementController : ControllerBase
    {
        private readonly TailorBdContext _context;

        private const string LatestOrderedMeasurementJoin = @"
            LEFT OUTER JOIN (
                SELECT MeasurementTypeID, Measurement
                FROM (
                    SELECT om.MeasurementTypeID, om.Measurement,
                           ROW_NUMBER() OVER (
                               PARTITION BY om.MeasurementTypeID
                               ORDER BY
                                   CASE WHEN ISNULL(LTRIM(RTRIM(om.Measurement)), '') <> '' THEN 0 ELSE 1 END,
                                   o.OrderDate DESC,
                                   ol.OrderListID DESC
                           ) AS rn
                    FROM Ordered_Measurement om
                    INNER JOIN OrderList ol ON om.OrderListID = ol.OrderListID
                    INNER JOIN [Order] o ON ol.OrderID = o.OrderID
                    WHERE om.CustomerID = @CustomerId
                      AND ol.InstitutionID = @InstitutionId
                      AND ol.DressID = @DressId
                ) ranked
                WHERE rn = 1
            ) AS latest_om ON mt.MeasurementTypeID = latest_om.MeasurementTypeID";

        public MeasurementController(TailorBdContext context)
        {
            _context = context;
        }

        private static bool DressBelongsToShop(System.Data.IDbConnection connection, int dressId, int institutionId)
            => connection.ExecuteScalar<int>(
                "SELECT COUNT(1) FROM Dress WHERE DressID = @D AND InstitutionID = @I",
                new { D = dressId, I = institutionId }) > 0;

        private static bool TypeBelongsToShop(System.Data.IDbConnection connection, int measurementTypeId, int institutionId)
            => connection.ExecuteScalar<int>(
                "SELECT COUNT(1) FROM Measurement_Type WHERE MeasurementTypeID = @T AND InstitutionID = @I",
                new { T = measurementTypeId, I = institutionId }) > 0;

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
        public IActionResult GetMeasurementTypes(int groupId, [FromQuery] int institutionId = 0)
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
                      AND MeasurementTypeID <> @GroupId
                      AND InstitutionID = @InstitutionId
                    ORDER BY ISNULL(Measurement_Group_SerialNo, 99999)";

                var types = connection.Query<dynamic>(query, new { GroupId = groupId, InstitutionId = institutionId });

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
                if (!DressBelongsToShop(connection, model.DressId, model.InstitutionId))
                    return NotFound(new { success = false, message = "পোষাক পাওয়া যায়নি" });
                
                var insertQuery = @"
                    INSERT INTO Measurement_Type
                    (Cloth_For_ID, InstitutionID, MeasurementType, Date, DressID, Ascending, RegistrationID)
                    VALUES 
                    (@ClothForId, @InstitutionId, @MeasurementType, GETDATE(), @DressId, @Ascending, @RegistrationId);

                    DECLARE @InsertedId INT = SCOPE_IDENTITY();
                    UPDATE Measurement_Type SET Measurement_GroupID = @InsertedId WHERE MeasurementTypeID = @InsertedId;
                    SELECT @InsertedId;";

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
                if (!DressBelongsToShop(connection, model.DressId, model.InstitutionId))
                    return NotFound(new { success = false, message = "পোষাক পাওয়া যায়নি" });
                if (!TypeBelongsToShop(connection, model.MeasurementGroupId, model.InstitutionId)) return NotFound(new { success = false, message = "মাপ পাওয়া যায়নি / Not found" });
                
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
                var n = connection.Execute(updateQuery, model);
                if (n == 0) return NotFound(new { success = false, message = "মাপ পাওয়া যায়নি / Not found" });

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
                var n = connection.Execute(updateQuery, model);
                if (n == 0) return NotFound(new { success = false, message = "মাপ পাওয়া যায়নি / Not found" });

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
                if (!TypeBelongsToShop(connection, id, institutionId)) return NotFound(new { success = false, message = "মাপ পাওয়া যায়নি / Not found" });
                connection.Open();
                using var transaction = connection.BeginTransaction();

                connection.Execute(
                    "DELETE FROM Customer_Measurement WHERE MeasurementTypeID = @Id AND InstitutionID = @InstitutionId",
                    new { Id = id, InstitutionId = institutionId },
                    transaction);

                connection.Execute(
                    "DELETE FROM Measurement_Type WHERE MeasurementTypeID = @Id AND InstitutionID = @InstitutionId",
                    new { Id = id, InstitutionId = institutionId },
                    transaction);

                connection.Execute(
                    @"UPDATE Measurement_Type
                      SET Measurement_GroupID = MeasurementTypeID,
                          Measurement_Group_SerialNo = NULL
                      WHERE Measurement_GroupID = @Id
                        AND InstitutionID = @InstitutionId
                        AND MeasurementTypeID <> @Id",
                    new { Id = id, InstitutionId = institutionId },
                    transaction);

                transaction.Commit();

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
        // Removes type from its group and promotes it to a main category (old project behaviour).
        [HttpDelete("type/{id}")]
        public IActionResult DeleteMeasurementType(int id, [FromQuery] int institutionId)
        {
            try
            {
                using var connection = _context.CreateConnection();

                var rows = connection.Execute(
                    @"UPDATE Measurement_Type
                      SET Measurement_GroupID = MeasurementTypeID,
                          Measurement_Group_SerialNo = NULL
                      WHERE MeasurementTypeID = @Id
                        AND InstitutionID = @InstitutionId
                        AND MeasurementTypeID <> Measurement_GroupID",
                    new { Id = id, InstitutionId = institutionId });

                if (rows == 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "মাপটি গ্রুপ থেকে বাদ দেওয়া যায়নি"
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "মাপ গ্রুপ থেকে বাদ দিয়ে মূল ক্যাটাগরি করা হয়েছে"
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

        // DELETE: api/Measurement/type/{id}/permanent?institutionId=
        [HttpDelete("type/{id}/permanent")]
        public IActionResult DeleteMeasurementTypePermanent(int id, [FromQuery] int institutionId)
        {
            try
            {
                using var connection = _context.CreateConnection();
                connection.Open();
                using var transaction = connection.BeginTransaction();

                connection.Execute(
                    "DELETE FROM Customer_Measurement WHERE MeasurementTypeID = @Id AND InstitutionID = @InstitutionId",
                    new { Id = id, InstitutionId = institutionId },
                    transaction);

                connection.Execute(
                    "DELETE FROM Ordered_Measurement WHERE MeasurementTypeID = @Id AND InstitutionID = @InstitutionId",
                    new { Id = id, InstitutionId = institutionId },
                    transaction);

                connection.Execute(
                    @"UPDATE Measurement_Type
                      SET Measurement_GroupID = MeasurementTypeID,
                          Measurement_Group_SerialNo = NULL
                      WHERE Measurement_GroupID = @Id
                        AND InstitutionID = @InstitutionId
                        AND MeasurementTypeID <> @Id",
                    new { Id = id, InstitutionId = institutionId },
                    transaction);

                var rows = connection.Execute(
                    "DELETE FROM Measurement_Type WHERE MeasurementTypeID = @Id AND InstitutionID = @InstitutionId",
                    new { Id = id, InstitutionId = institutionId },
                    transaction);

                transaction.Commit();

                if (rows == 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "মাপটি ডিলিট করা যায়নি"
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "মাপ স্থায়ীভাবে ডিলিট হয়েছে"
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

        // GET: api/Measurement/group/{groupId}/assignable?dressId=&institutionId=
        [HttpGet("group/{groupId}/assignable")]
        public IActionResult GetAssignableTypes(int groupId, [FromQuery] int dressId, [FromQuery] int institutionId)
        {
            try
            {
                using var connection = _context.CreateConnection();

                var query = @"
                    SELECT DISTINCT
                        ML.MeasurementTypeID,
                        ML.MeasurementType,
                        ISNULL(ML.Ascending, 99999) AS Ascending
                    FROM Measurement_Type ML
                    WHERE ML.DressID = @DressId
                      AND ML.InstitutionID = @InstitutionId
                      AND ML.MeasurementTypeID <> @GroupId
                      AND (
                          ML.Measurement_GroupID IS NULL
                          OR (
                              ML.MeasurementTypeID <> ML.Measurement_GroupID
                              AND ML.Measurement_GroupID <> @GroupId
                          )
                          OR (
                              (
                                  SELECT COUNT(*)
                                  FROM Measurement_Type MG
                                  WHERE MG.DressID = @DressId
                                    AND MG.InstitutionID = @InstitutionId
                                    AND MG.Measurement_GroupID = ML.Measurement_GroupID
                              ) = 1
                          )
                          OR (
                              ML.MeasurementTypeID = ML.Measurement_GroupID
                              AND NOT EXISTS (
                                  SELECT 1
                                  FROM Measurement_Type child
                                  WHERE child.DressID = @DressId
                                    AND child.InstitutionID = @InstitutionId
                                    AND child.Measurement_GroupID = ML.MeasurementTypeID
                                    AND child.MeasurementTypeID <> ML.MeasurementTypeID
                              )
                          )
                      )
                    ORDER BY Ascending, ML.MeasurementType";

                var types = connection.Query<dynamic>(query, new
                {
                    GroupId = groupId,
                    DressId = dressId,
                    InstitutionId = institutionId
                });

                return Ok(new { success = true, data = types });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // GET: api/Measurement/unlinked?dressId=&institutionId=
        [HttpGet("unlinked")]
        public IActionResult GetUnlinkedTypes([FromQuery] int dressId, [FromQuery] int institutionId)
        {
            try
            {
                using var connection = _context.CreateConnection();

                var query = @"
                    SELECT MeasurementTypeID, MeasurementType
                    FROM Measurement_Type
                    WHERE DressID = @DressId
                      AND InstitutionID = @InstitutionId
                      AND Measurement_GroupID IS NULL
                    ORDER BY MeasurementType";

                var types = connection.Query<dynamic>(query, new { DressId = dressId, InstitutionId = institutionId });

                return Ok(new { success = true, data = types });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // PUT: api/Measurement/type/{id}/assign-group
        [HttpPut("type/{id}/assign-group")]
        public IActionResult AssignTypeToGroup(int id, [FromBody] AssignGroupModel model)
        {
            try
            {
                using var connection = _context.CreateConnection();
                if (!TypeBelongsToShop(connection, id, model.InstitutionId)
                    || !TypeBelongsToShop(connection, model.GroupId, model.InstitutionId)) return NotFound(new { success = false, message = "মাপ পাওয়া যায়নি / Not found" });

                var updateQuery = @"
                    UPDATE Measurement_Type
                    SET Measurement_GroupID = @GroupId,
                        Measurement_Group_SerialNo = NULL,
                        Ascending = (
                            SELECT Ascending
                            FROM Measurement_Type
                            WHERE MeasurementTypeID = @GroupId
                              AND InstitutionID = @InstitutionId
                        )
                    WHERE MeasurementTypeID = @Id
                      AND InstitutionID = @InstitutionId
                      AND MeasurementTypeID <> @GroupId";

                connection.Execute(updateQuery, new { Id = id, GroupId = model.GroupId, InstitutionId = model.InstitutionId });

                return Ok(new { success = true, message = "মাপ গ্রুপে যুক্ত হয়েছে" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
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
                if (!DressBelongsToShop(connection, dressId, institutionId))
                    return NotFound(new { success = false, message = "পোষাক পাওয়া যায়নি" });
                
                // Get order details
                var detailsQuery = @"
                    SELECT CDDetails 
                    FROM Customer_Dress 
                    WHERE CustomerID = @CustomerId 
                    AND DressID = @DressId 
                    AND InstitutionID = @InstitutionId";
                
                var orderDetails = connection.QueryFirstOrDefault<string>(detailsQuery, 
                    new { CustomerId = customerId, DressId = dressId, InstitutionId = institutionId }) ?? "";

                // Get measurement groups (exclude NULL — orphans handled separately)
                var measurementGroupsQuery = @"
                    SELECT 
                        Measurement_GroupID as MeasurementGroupId, 
                        MIN(ISNULL(Ascending, 99999)) AS Ascending 
                    FROM Measurement_Type 
                    WHERE InstitutionID = @InstitutionId 
                    AND DressID = @DressId 
                    AND Measurement_GroupID IS NOT NULL
                    GROUP BY Measurement_GroupID
                    ORDER BY Ascending";
                
                var groups = connection.Query<dynamic>(measurementGroupsQuery, 
                    new { InstitutionId = institutionId, DressId = dressId }).ToList();

                const string measurementsQuery = @"
                        SELECT 
                            mt.MeasurementTypeID, 
                            mt.MeasurementType, 
                            COALESCE(NULLIF(LTRIM(RTRIM(latest_om.Measurement)), ''), NULLIF(LTRIM(RTRIM(cm.Measurement)), ''), '') as Measurement, 
                            mt.Measurement_Group_SerialNo 
                        FROM Measurement_Type mt
                        " + LatestOrderedMeasurementJoin + @"
                        LEFT OUTER JOIN (
                            SELECT Measurement, MeasurementTypeID 
                            FROM Customer_Measurement 
                            WHERE CustomerID = @CustomerId AND InstitutionID = @InstitutionId
                        ) AS cm ON mt.MeasurementTypeID = cm.MeasurementTypeID 
                        WHERE mt.Measurement_GroupID = @GroupId 
                        ORDER BY ISNULL(mt.Measurement_Group_SerialNo, 99999)";

                // Get measurements for each group
                var measurementGroups = new List<object>();
                foreach (var group in groups)
                {
                    if (group.MeasurementGroupId == null) continue;

                    var measurements = connection.Query<dynamic>(measurementsQuery, 
                        new { GroupId = (int)group.MeasurementGroupId, CustomerId = customerId, InstitutionId = institutionId, DressId = dressId }).ToList();
                    
                    measurementGroups.Add(new
                    {
                        MeasurementGroupId = group.MeasurementGroupId,
                        Measurements = measurements
                    });
                }

                // Orphan measurements (NULL group) — show individually so page never crashes
                var orphanMeasurementsQuery = @"
                        SELECT 
                            mt.MeasurementTypeID, 
                            mt.MeasurementType, 
                            COALESCE(NULLIF(LTRIM(RTRIM(latest_om.Measurement)), ''), NULLIF(LTRIM(RTRIM(cm.Measurement)), ''), '') as Measurement, 
                            mt.Measurement_Group_SerialNo 
                        FROM Measurement_Type mt
                        " + LatestOrderedMeasurementJoin + @"
                        LEFT OUTER JOIN (
                            SELECT Measurement, MeasurementTypeID 
                            FROM Customer_Measurement 
                            WHERE CustomerID = @CustomerId AND InstitutionID = @InstitutionId
                        ) AS cm ON mt.MeasurementTypeID = cm.MeasurementTypeID 
                        WHERE mt.InstitutionID = @InstitutionId 
                        AND mt.DressID = @DressId 
                        AND mt.Measurement_GroupID IS NULL
                        ORDER BY ISNULL(mt.Ascending, 99999), mt.MeasurementTypeID";

                var orphanMeasurements = connection.Query<dynamic>(orphanMeasurementsQuery,
                    new { InstitutionId = institutionId, DressId = dressId, CustomerId = customerId }).ToList();

                foreach (var orphan in orphanMeasurements)
                {
                    measurementGroups.Add(new
                    {
                        MeasurementGroupId = orphan.MeasurementTypeID,
                        Measurements = new[] { orphan }
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

                // Get styles — same source as customer-details (/api/customer-page/dress-styles)
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
                        LEFT JOIN Customer_Dress_Style cds 
                            ON ds.Dress_StyleID = cds.Dress_StyleID AND cds.CustomerID = @CustomerId
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
        // login required like the rest of this controller (order-edit now sends the token)
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

    public class AssignGroupModel
    {
        public int GroupId { get; set; }
        public int InstitutionId { get; set; }
    }
}
