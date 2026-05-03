using Microsoft.AspNetCore.Mvc;
using System.Data.SqlClient;
using System.Data;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MeasurementsController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public MeasurementsController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpGet("dress-details")]
        public IActionResult GetDressMeasurementsStyles(
            [FromQuery] int dressId, 
            [FromQuery] int customerId, 
            [FromQuery] int institutionId,
            [FromQuery] int? orderListId = null)
        {
            try
            {
                var result = new
                {
                    OrderDetails = "",
                    MeasurementGroups = new List<object>(),
                    Styles = new List<object>()
                };

                var connectionString = _configuration.GetConnectionString("TailorBDConnectionString");

                using (var conn = new SqlConnection(connectionString))
                {
                    conn.Open();

                    // Get dress details
                    using (var cmd = new SqlCommand())
                    {
                        cmd.CommandText = "SELECT CDDetails FROM Customer_Dress WHERE (CustomerID = @CustomerID) AND (DressID = @DressID) AND (InstitutionID = @InstitutionID)";
                        cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                        cmd.Parameters.AddWithValue("@DressID", dressId);
                        cmd.Parameters.AddWithValue("@CustomerID", customerId);
                        cmd.Connection = conn;

                        var orderDetails = cmd.ExecuteScalar();
                        result = new
                        {
                            OrderDetails = orderDetails?.ToString() ?? "",
                            MeasurementGroups = new List<object>(),
                            Styles = new List<object>()
                        };
                    }

                    // Get measurement groups
                    using (var cmd = new SqlCommand())
                    {
                        cmd.CommandText = @"SELECT MT.Measurement_GroupID, 
                                          MIN(ISNULL(MT.Ascending, 99999)) AS Ascending,
                                          (SELECT TOP 1 MeasurementType FROM Measurement_Type 
                                           WHERE MeasurementTypeID = MT.Measurement_GroupID) AS GroupName
                                          FROM Measurement_Type MT
                                          WHERE (MT.InstitutionID = @InstitutionID) AND (MT.DressID = @DressID) 
                                          GROUP BY MT.Measurement_GroupID
                                          ORDER BY Ascending";
                        cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                        cmd.Parameters.AddWithValue("@DressID", dressId);
                        cmd.Connection = conn;

                        var measurementGroups = new List<object>();

                        using (var sdr = cmd.ExecuteReader())
                        {
                            while (sdr.Read())
                            {
                                var measurementGroupId = Convert.ToInt32(sdr["Measurement_GroupID"]);
                                var groupName = sdr["GroupName"]?.ToString() ?? $"Measurement Group {measurementGroupId}";
                                var measurements = new List<object>();

                                using (var measurementCmd = new SqlCommand())
                                {
                                    // FIXED: If orderListId is provided, prefer Ordered_Measurement but fallback to Customer_Measurement
                                    string measurementQuery;
                                    if (orderListId.HasValue && orderListId.Value > 0)
                                    {
                                        measurementQuery = @"
                                            SELECT Measurement_Type.MeasurementTypeID, 
                                                   Measurement_Type.MeasurementType, 
                                                   COALESCE(OrderList_M.Measurement, Customer_M.Measurement, '') AS Measurement, 
                                                   Measurement_Type.Measurement_Group_SerialNo 
                                            FROM Measurement_Type 
                                            LEFT OUTER JOIN (
                                                SELECT Measurement, MeasurementTypeID 
                                                    FROM Ordered_Measurement 
                                                    WHERE OrderListID = @OrderListID AND InstitutionID = @InstitutionID
                                                ) AS OrderList_M 
                                                ON Measurement_Type.MeasurementTypeID = OrderList_M.MeasurementTypeID 
                                                LEFT OUTER JOIN (
                                                    SELECT Measurement, MeasurementTypeID 
                                                    FROM Customer_Measurement 
                                                    WHERE CustomerID = @CustomerID AND InstitutionID = @InstitutionID
                                                ) AS Customer_M
                                            ON Measurement_Type.MeasurementTypeID = Customer_M.MeasurementTypeID 
                                            WHERE (Measurement_Type.Measurement_GroupID = @Measurement_GroupID) 
                                            ORDER BY ISNULL(Measurement_Type.Measurement_Group_SerialNo, 99999)";
                                        
                                        measurementCmd.Parameters.AddWithValue("@OrderListID", orderListId.Value);
                                        measurementCmd.Parameters.AddWithValue("@CustomerID", customerId);
                                        measurementCmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                                    }
                                    else
                                    {
                                        measurementQuery = @"
                                            SELECT Measurement_Type.MeasurementTypeID, 
                                                   Measurement_Type.MeasurementType, 
                                                   Customer_M.Measurement, 
                                                   Measurement_Type.Measurement_Group_SerialNo 
                                            FROM Measurement_Type 
                                            LEFT OUTER JOIN (
                                                SELECT Measurement, MeasurementTypeID 
                                                FROM Customer_Measurement 
                                                WHERE CustomerID = @CustomerID AND InstitutionID = @InstitutionID
                                            ) AS Customer_M 
                                            ON Measurement_Type.MeasurementTypeID = Customer_M.MeasurementTypeID 
                                            WHERE (Measurement_Type.Measurement_GroupID = @Measurement_GroupID) 
                                            ORDER BY ISNULL(Measurement_Type.Measurement_Group_SerialNo, 99999)";

                                        measurementCmd.Parameters.AddWithValue("@CustomerID", customerId);
                                        measurementCmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                                    }
                                    
                                    measurementCmd.CommandText = measurementQuery;
                                    measurementCmd.Parameters.AddWithValue("@Measurement_GroupID", measurementGroupId);
                                    measurementCmd.Connection = conn;

                                    using (var measurementDr = measurementCmd.ExecuteReader())
                                    {
                                        while (measurementDr.Read())
                                        {
                                            measurements.Add(new
                                            {
                                                measurementTypeID = Convert.ToInt32(measurementDr["MeasurementTypeID"]),
                                                measurementTypeName = measurementDr["MeasurementType"].ToString(),
                                                measurement = measurementDr["Measurement"]?.ToString() ?? ""
                                            });
                                        }
                                    }
                                }

                                measurementGroups.Add(new
                                {
                                    groupName = groupName,
                                    measurements = measurements
                                });
                            }
                        }

                        result = new
                        {
                            OrderDetails = result.OrderDetails,
                            MeasurementGroups = measurementGroups,
                            Styles = new List<object>()
                        };
                    }

                    // Get styles
                    using (var cmd = new SqlCommand())
                    {
                        cmd.CommandText = "SELECT DISTINCT Dress_Style_Category.Dress_Style_Category_Name, Dress_Style.Dress_Style_CategoryID, ISNULL(Dress_Style_Category.CategorySerial, 99999) AS SN FROM Dress_Style INNER JOIN Dress_Style_Category ON Dress_Style.Dress_Style_CategoryID = Dress_Style_Category.Dress_Style_CategoryID WHERE (Dress_Style.DressID = @DressID) ORDER BY SN";
                        cmd.Parameters.AddWithValue("@DressID", dressId);
                        cmd.Connection = conn;

                        var styleGroups = new List<object>();

                        using (var sdr = cmd.ExecuteReader())
                        {
                            while (sdr.Read())
                            {
                                var styleGroupId = Convert.ToInt32(sdr["Dress_Style_CategoryID"]);
                                var styleGroupName = sdr["Dress_Style_Category_Name"].ToString();
                                var styles = new List<object>();

                                using (var styleCmd = new SqlCommand())
                                {
                                    // FIXED: If orderListId is provided, prefer Ordered_Dress_Style but fallback to Customer_Dress_Style
                                    string styleQuery;
                                    if (orderListId.HasValue && orderListId.Value > 0)
                                    {
                                        styleQuery = @"
                                            SELECT Dress_Style.Dress_StyleID, 
                                                   Dress_Style.Dress_Style_Name, 
                                                   COALESCE(OrderList_DS.DressStyleMesurement, Customer_DS.DressStyleMesurement, '') AS DressStyleMesurement, 
                                                   CAST(CASE 
                                                        WHEN OrderList_DS.Dress_StyleID IS NOT NULL THEN 1 
                                                        WHEN Customer_DS.Dress_StyleID IS NOT NULL THEN 1 
                                                        ELSE 0 
                                                   END AS BIT) AS IsCheck 
                                            FROM Dress_Style 
                                            LEFT OUTER JOIN (
                                                SELECT DressStyleMesurement, Dress_StyleID 
                                                FROM Ordered_Dress_Style 
                                                WHERE OrderListID = @OrderListID
                                            ) AS OrderList_DS 
                                            ON Dress_Style.Dress_StyleID = OrderList_DS.Dress_StyleID 
                                            LEFT OUTER JOIN (
                                                SELECT DressStyleMesurement, Dress_StyleID 
                                                FROM Customer_Dress_Style 
                                                WHERE CustomerID = @CustomerID
                                            ) AS Customer_DS 
                                            ON Dress_Style.Dress_StyleID = Customer_DS.Dress_StyleID 
                                            WHERE (Dress_Style.Dress_Style_CategoryID = @Dress_Style_CategoryID) 
                                            ORDER BY ISNULL(Dress_Style.StyleSerial, 99999)";
                                        
                                        styleCmd.Parameters.AddWithValue("@OrderListID", orderListId.Value);
                                        styleCmd.Parameters.AddWithValue("@CustomerID", customerId);
                                    }
                                    else
                                    {
                                        styleQuery = @"
                                            SELECT Dress_Style.Dress_StyleID, 
                                                   Dress_Style.Dress_Style_Name, 
                                                   Customer_DS.DressStyleMesurement, 
                                                   CAST(CASE WHEN Customer_DS.Dress_StyleID IS NULL THEN 0 ELSE 1 END AS BIT) AS IsCheck 
                                            FROM Dress_Style 
                                            LEFT OUTER JOIN (
                                                SELECT DressStyleMesurement, Dress_StyleID 
                                                FROM Customer_Dress_Style 
                                                WHERE CustomerID = @CustomerID
                                            ) AS Customer_DS 
                                            ON Dress_Style.Dress_StyleID = Customer_DS.Dress_StyleID 
                                            WHERE (Dress_Style.Dress_Style_CategoryID = @Dress_Style_CategoryID) 
                                            ORDER BY ISNULL(Dress_Style.StyleSerial, 99999)";
                                        
                                        styleCmd.Parameters.AddWithValue("@CustomerID", customerId);
                                    }
                                    
                                    styleCmd.CommandText = styleQuery;
                                    styleCmd.Parameters.AddWithValue("@Dress_Style_CategoryID", styleGroupId);
                                    styleCmd.Connection = conn;

                                    using (var styleDr = styleCmd.ExecuteReader())
                                    {
                                        while (styleDr.Read())
                                        {
                                            styles.Add(new
                                            {
                                                dressStyleId = Convert.ToInt32(styleDr["Dress_StyleID"]),
                                                dressStyleName = styleDr["Dress_Style_Name"].ToString(),
                                                dressStyleMeasurement = styleDr["DressStyleMesurement"]?.ToString() ?? "",
                                                isCheck = Convert.ToBoolean(styleDr["IsCheck"])
                                            });
                                        }
                                    }
                                }

                                styleGroups.Add(new
                                {
                                    groupName = styleGroupName,
                                    styles = styles
                                });
                            }
                        }

                        result = new
                        {
                            OrderDetails = result.OrderDetails,
                            MeasurementGroups = result.MeasurementGroups,
                            Styles = styleGroups
                        };
                    }

                    conn.Close();
                }

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        orderDetails = result.OrderDetails,
                        measurements = result.MeasurementGroups,
                        styles = result.Styles
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error loading dress details: " + ex.Message
                });
            }
        }
    }
}
