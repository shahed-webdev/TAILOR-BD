using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Web.Script.Services;
using System.Web.Services;
using System.Web.UI;
using System.Web.UI.WebControls;
using TailorBD.AccessAdmin.quick_order.ViewModels;

namespace TailorBD.AccessAdmin.quick_order
{
    public partial class Order : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
           
        }

        //Get Order Number First
        [WebMethod]
        [ScriptMethod(UseHttpGet = true)]
        public static int GetOrderNumber()
        {
            var orderNumber = 0;
            using (var con = new SqlConnection())
            {
                con.ConnectionString = ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString;
                using (var cmd = new SqlCommand())
                {
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.CommandText = @"DECLARE @orderNo int;EXEC @orderNo = [dbo].[Sp_GetUpdatedOrderNo] @InstitutionID;select @orderNo";
                    cmd.Parameters.AddWithValue("@InstitutionID", HttpContext.Current.Request.Cookies["InstitutionID"]?.Value);
                    cmd.Connection = con;

                    con.Open();
                    orderNumber = (int)cmd.ExecuteScalar();
                    con.Close();
                }
            }
            return orderNumber;
        }

        //find customer autocomplete
        [WebMethod]
        [ScriptMethod(UseHttpGet = true)]
        public static List<CustomerViewModel> FindCustomer(string prefix)
        {
            var customers = new List<CustomerViewModel>();
            using (var conn = new SqlConnection())
            {
                conn.ConnectionString = ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString;
                using (var cmd = new SqlCommand())
                {
                    cmd.CommandText = "select Top(3) CustomerID,Cloth_For_ID, CustomerName, Phone, Address from Customer where InstitutionID = @InstitutionID AND (Phone like @prefex + '%') or (CustomerName like @prefex + '%')";
                    cmd.Parameters.AddWithValue("@prefex", prefix);
                    cmd.Parameters.AddWithValue("@InstitutionID", HttpContext.Current.Request.Cookies["InstitutionID"]?.Value);

                    cmd.Connection = conn;
                    conn.Open();
                    using (var sdr = cmd.ExecuteReader())
                    {
                        while (sdr.Read())
                        {
                            var dress = new CustomerViewModel
                            {
                                CustomerID = sdr["CustomerID"].ToString(),
                                Cloth_For_ID = sdr["Cloth_For_ID"].ToString(),
                                CustomerName = sdr["CustomerName"].ToString(),
                                Phone = sdr["Phone"].ToString(),
                                Address = sdr["Address"].ToString(),
                            };
                            customers.Add(dress);
                        }
                    }
                    conn.Close();
                }
            }
            return customers;
        }

        //add new customer
        [WebMethod]
        public static ResponseModel<CustomerViewModel> AddNewCustomer(CustomerViewModel model)
        {
            using (var con = new SqlConnection())
            {
                con.ConnectionString = ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString;

                //Check customer exist 
                using (var cmd = new SqlCommand())
                {
                    cmd.CommandText = "select * from Customer where InstitutionID = @InstitutionID AND CustomerName = @CustomerName AND Phone = @Phone";
                    cmd.Parameters.AddWithValue("@InstitutionID", HttpContext.Current.Request.Cookies["InstitutionID"]?.Value);
                    cmd.Parameters.AddWithValue("@CustomerName", model.CustomerName.Trim());
                    cmd.Parameters.AddWithValue("@Phone", model.Phone.Trim());

                    cmd.Connection = con;
                    
                    con.Open();
                    var isCustomer = cmd.ExecuteScalar();
                    con.Close();

                    if (isCustomer != null)
                    {
                        return new ResponseModel<CustomerViewModel>(false, model.CustomerName + ". মোবাইল: " + model.Phone + " পূর্বে নিবন্ধিত, পুনরায় নিবন্ধন করা যাবে না");
                    }
                }

                //insert customer and get customerId
                using (var cmd = new SqlCommand())
                {
                    cmd.CommandText = @"INSERT INTO Customer (RegistrationID, InstitutionID, Cloth_For_ID, CustomerName, Phone, Address, Date, CustomerNumber) VALUES (@RegistrationID,@InstitutionID,@Cloth_For_ID,@CustomerName,@Phone,@Address, GETDATE(),(SELECT [dbo].[CustomeSerialNumber](@InstitutionID))); select IDENT_CURRENT('Customer')";
                    cmd.Parameters.AddWithValue("@RegistrationID", HttpContext.Current.Request.Cookies["RegistrationID"]?.Value);
                    cmd.Parameters.AddWithValue("@InstitutionID", HttpContext.Current.Request.Cookies["InstitutionID"]?.Value);
                    cmd.Parameters.AddWithValue("@Cloth_For_ID", model.Cloth_For_ID);
                    cmd.Parameters.AddWithValue("@CustomerName", model.CustomerName.Trim());
                    cmd.Parameters.AddWithValue("@Phone", model.Phone.Trim());
                    cmd.Parameters.AddWithValue("@Address", model.Address.Trim());
                    cmd.Connection = con;

                    con.Open();
                    model.CustomerID = cmd.ExecuteScalar().ToString();
                    con.Close();

                }
                using (var cmd = new SqlCommand())
                {
                    cmd.CommandText = @"UPDATE Institution SET TotalCustomer = [dbo].[CustomeSerialNumber](@InstitutionID) WHERE(InstitutionID = @InstitutionID)";
                    cmd.Parameters.AddWithValue("@InstitutionID", HttpContext.Current.Request.Cookies["InstitutionID"]?.Value);
                    cmd.Connection = con;

                    con.Open();
                    cmd.ExecuteNonQuery();
                    con.Close();
                }
            }
            return new ResponseModel<CustomerViewModel>(true, "Customer added successfully", model);
        }

        //dress dropdown
        [WebMethod]
        [ScriptMethod(UseHttpGet = true)]
        public static List<DressDllViewModel> DressDlls(int customerId = 0, int clothForId = 0)
        {
            var dressList = new List<DressDllViewModel>();
            using (var conn = new SqlConnection())
            {
                conn.ConnectionString = ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString;
                using (var cmd = new SqlCommand())
                {
                    cmd.CommandText = "SELECT Dress.DressID,Dress.Dress_Name,CAST(IIF (CT.DressID is null, 0, 1) AS BIT) as IsMeasurementAvailable FROM Dress LEFT OUTER JOIN (SELECT DressID FROM Customer_Dress WHERE (InstitutionID = @InstitutionID) AND (CustomerID = @CustomerID)) AS CT ON Dress.DressID = CT.DressID WHERE (Dress.InstitutionID = @InstitutionID) AND (Dress.Cloth_For_ID = @Cloth_For_ID OR @Cloth_For_ID = 0) ORDER BY Dress.DressSerial";
                    cmd.Parameters.AddWithValue("@CustomerID", customerId);
                    cmd.Parameters.AddWithValue("@Cloth_For_ID", clothForId);
                    cmd.Parameters.AddWithValue("@InstitutionID", HttpContext.Current.Request.Cookies["InstitutionID"].Value);

                    cmd.Connection = conn;
                    conn.Open();
                    using (var sdr = cmd.ExecuteReader())
                    {
                        while (sdr.Read())
                        {
                            var dress = new DressDllViewModel
                            {
                                DressId =Convert.ToInt32(sdr["DressID"]),
                                DressName = sdr["Dress_Name"].ToString(), 
                                IsMeasurementAvailable = Convert.ToBoolean(sdr["IsMeasurementAvailable"])
                            };
                            dressList.Add(dress);
                        }
                    }
                    conn.Close();
                }
            }
            return dressList;
        }


        //get dress measurements styles
        [WebMethod]
        [ScriptMethod(UseHttpGet = true)]
        public static DressMeasurementStyleViewModel GetDressMeasurementsStyles(int dressId, int customerId = 0)
        {
            var dress = new DressMeasurementStyleViewModel();
            
            //dress details
            using (var conn = new SqlConnection())
            {
                conn.ConnectionString = ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString;
                using (var cmd = new SqlCommand())
                {
                    cmd.CommandText = "SELECT CDDetails FROM Customer_Dress WHERE (CustomerID = @CustomerID) AND (DressID = @DressID) AND (InstitutionID = @InstitutionID)";
                    cmd.Parameters.AddWithValue("@InstitutionID", HttpContext.Current.Request.Cookies["InstitutionID"].Value);
                    cmd.Parameters.AddWithValue("@DressID", dressId);
                    cmd.Parameters.AddWithValue("@CustomerID", customerId);

                    cmd.Connection = conn;

                    conn.Open();
                    var orderDetails = cmd.ExecuteScalar();
                    dress.OrderDetails = orderDetails == null ? "" : orderDetails.ToString();
                    conn.Close();
                }
            }
          
            //dress measurement
            using (var conn = new SqlConnection())
            {
                conn.ConnectionString = ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString;
                using (var cmd = new SqlCommand())
                {
                    cmd.CommandText = "SELECT DISTINCT Measurement_GroupID, ISNULL(Ascending, 99999) AS Ascending FROM Measurement_Type WHERE(InstitutionID = @InstitutionID) AND(DressID = @DressID) ORDER BY Ascending";
                    cmd.Parameters.AddWithValue("@InstitutionID", HttpContext.Current.Request.Cookies["InstitutionID"].Value);
                    cmd.Parameters.AddWithValue("@DressID", dressId);
                    
                    cmd.Connection = conn;
                    conn.Open();
                    using (var sdr = cmd.ExecuteReader())
                    {
                        while (sdr.Read())
                        {
                            var measurementsGroup = new MeasurementsGroupModel
                            {
                                 MeasurementGroupId= Convert.ToInt32(sdr["Measurement_GroupID"])
                            };

                            using (var measurementCmd = new SqlCommand())
                            {
                                measurementCmd.CommandText = "SELECT Measurement_Type.MeasurementTypeID, Measurement_Type.MeasurementType, Customer_M.Measurement, Measurement_Type.Measurement_Group_SerialNo FROM Measurement_Type LEFT OUTER JOIN (SELECT Measurement, MeasurementTypeID FROM Customer_Measurement WHERE (CustomerID = @CustomerID)) AS Customer_M ON Measurement_Type.MeasurementTypeID = Customer_M.MeasurementTypeID WHERE (Measurement_Type.Measurement_GroupID = @Measurement_GroupID) ORDER BY ISNULL(Measurement_Type.Measurement_Group_SerialNo, 99999)";
                                measurementCmd.Parameters.AddWithValue("@Measurement_GroupID", measurementsGroup.MeasurementGroupId);
                                measurementCmd.Parameters.AddWithValue("@CustomerID", customerId);
                                measurementCmd.Connection = conn;
                                
                                using (var measurementDr = measurementCmd.ExecuteReader())
                                {
                                    while (measurementDr.Read())
                                    {
                                        var measurement = new MeasurementsModel
                                        {
                                             MeasurementTypeID= Convert.ToInt32(measurementDr["MeasurementTypeID"]),
                                             MeasurementType = measurementDr["MeasurementType"].ToString(),
                                             Measurement = measurementDr["Measurement"].ToString()
                                        };
                                        measurementsGroup.Measurements.Add(measurement);
                                    }
                                }

                            }
                            dress.MeasurementGroups.Add(measurementsGroup);
                        }
                    }
                    conn.Close();
                }
            }
            
            //dress Style
            using (var conn = new SqlConnection())
            {
                conn.ConnectionString = ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString;
                using (var cmd = new SqlCommand())
                {
                    cmd.CommandText = "SELECT DISTINCT Dress_Style_Category.Dress_Style_Category_Name, Dress_Style.Dress_Style_CategoryID, ISNULL(Dress_Style_Category.CategorySerial, 99999) AS SN FROM Dress_Style INNER JOIN Dress_Style_Category ON Dress_Style.Dress_Style_CategoryID = Dress_Style_Category.Dress_Style_CategoryID WHERE (Dress_Style.DressID = @DressID) ORDER BY SN";
                    cmd.Parameters.AddWithValue("@DressID", dressId);
                   
                    cmd.Connection = conn;
                    conn.Open();
                    using (var sdr = cmd.ExecuteReader())
                    {
                        while (sdr.Read())
                        {
                            var styleGroup = new StyleGroupModel
                            { 
                                DressStyleCategoryId = Convert.ToInt32(sdr["Dress_Style_CategoryID"]), 
                                DressStyleCategoryName = sdr["Dress_Style_Category_Name"].ToString()
                            };

                            using (var styleCmd = new SqlCommand())
                            {
                                styleCmd.CommandText = "SELECT Dress_Style.Dress_StyleID, Dress_Style.Dress_Style_Name, Customer_DS.DressStyleMesurement, CAST(CASE WHEN Customer_DS.Dress_StyleID IS NULL THEN 0 ELSE 1 END AS BIT) AS IsCheck FROM Dress_Style LEFT OUTER JOIN (SELECT DressStyleMesurement, Dress_StyleID FROM Customer_Dress_Style WHERE (CustomerID = @CustomerID)) AS Customer_DS ON Dress_Style.Dress_StyleID = Customer_DS.Dress_StyleID WHERE (Dress_Style.Dress_Style_CategoryID = @Dress_Style_CategoryID) ORDER BY ISNULL(Dress_Style.StyleSerial, 99999)";
                                styleCmd.Parameters.AddWithValue("@Dress_Style_CategoryID", styleGroup.DressStyleCategoryId);
                                styleCmd.Parameters.AddWithValue("CustomerID", customerId);
                                styleCmd.Connection = conn;
                               
                                using (var styleDr = styleCmd.ExecuteReader())
                                {
                                    while (styleDr.Read())
                                    {
                                        var style = new StyleModel
                                        {
                                            DressStyleId = Convert.ToInt32(styleDr["Dress_StyleID"]),
                                            DressStyleName = styleDr["Dress_Style_Name"].ToString(),
                                            DressStyleMesurement = styleDr["DressStyleMesurement"].ToString(),
                                            IsCheck = Convert.ToBoolean( styleDr["IsCheck"])
                                        };
                                        styleGroup.Styles.Add(style);
                                    }
                                }
                            }
                            dress.StyleGroups.Add(styleGroup);                          
                        }
                    }
                    conn.Close();
                }
            }

            return dress;
        }
    }
}