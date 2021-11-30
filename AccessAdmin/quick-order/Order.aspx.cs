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


        //find customer autocomplete
        [WebMethod]
        [ScriptMethod(UseHttpGet = true)]
        public static List<CustomerViewModel> FindCustomer(string prefix)
        {
            List<CustomerViewModel> customers = new List<CustomerViewModel>();
            using (SqlConnection conn = new SqlConnection())
            {
                conn.ConnectionString = ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString;
                using (SqlCommand cmd = new SqlCommand())
                {
                    cmd.CommandText = "select Top(3) CustomerID,Cloth_For_ID, CustomerName, Phone, Address from Customer where InstitutionID = @InstitutionID AND (Phone like @prefex + '%') or (CustomerName like @prefex + '%')";
                    cmd.Parameters.AddWithValue("@prefex", prefix);
                    cmd.Parameters.AddWithValue("@InstitutionID", HttpContext.Current.Request.Cookies["InstitutionID"].Value);

                    cmd.Connection = conn;
                    conn.Open();
                    using (SqlDataReader sdr = cmd.ExecuteReader())
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
        public static CustomerViewModel AddNewCustomer(CustomerViewModel model)
        {
            
            return model;
        }


        //dress dropdown
        [WebMethod]
        [ScriptMethod(UseHttpGet = true)]
        public static List<DressDllViewModel> DressDlls(int customerId = 0, int clothForId = 0)
        {
            List<DressDllViewModel> dressList = new List<DressDllViewModel>();
            using (SqlConnection conn = new SqlConnection())
            {
                conn.ConnectionString = ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString;
                using (SqlCommand cmd = new SqlCommand())
                {
                    cmd.CommandText = "SELECT Dress.DressID,Dress.Dress_Name,CAST(IIF ( CT.DressID = 1, 1, 0 ) AS BIT) as IsMeasurementAvailable FROM Dress LEFT OUTER JOIN (SELECT DressID FROM Customer_Dress WHERE (InstitutionID = @InstitutionID) AND (CustomerID = @CustomerID)) AS CT ON Dress.DressID = CT.DressID WHERE (Dress.InstitutionID = @InstitutionID) AND (Dress.Cloth_For_ID = @Cloth_For_ID OR @Cloth_For_ID = 0) ORDER BY Dress.DressSerial";
                    cmd.Parameters.AddWithValue("@CustomerID", customerId);
                    cmd.Parameters.AddWithValue("@Cloth_For_ID", clothForId);
                    cmd.Parameters.AddWithValue("@InstitutionID", HttpContext.Current.Request.Cookies["InstitutionID"].Value);

                    cmd.Connection = conn;
                    conn.Open();
                    using (SqlDataReader sdr = cmd.ExecuteReader())
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
            DressMeasurementStyleViewModel dress = new DressMeasurementStyleViewModel();
            
            //dress details
            using (SqlConnection conn = new SqlConnection())
            {
                conn.ConnectionString = ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString;
                using (SqlCommand cmd = new SqlCommand())
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
            using (SqlConnection conn = new SqlConnection())
            {
                conn.ConnectionString = ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString;
                using (SqlCommand cmd = new SqlCommand())
                {
                    cmd.CommandText = "SELECT DISTINCT Measurement_GroupID, ISNULL(Ascending, 99999) AS Ascending FROM Measurement_Type WHERE(InstitutionID = @InstitutionID) AND(DressID = @DressID) ORDER BY Ascending";
                    cmd.Parameters.AddWithValue("@InstitutionID", HttpContext.Current.Request.Cookies["InstitutionID"].Value);
                    cmd.Parameters.AddWithValue("@DressID", dressId);
                    
                    cmd.Connection = conn;
                    conn.Open();
                    using (SqlDataReader sdr = cmd.ExecuteReader())
                    {
                        while (sdr.Read())
                        {
                            var measurementsGroup = new MeasurementsGroupModel
                            {
                                 MeasurementGroupId= Convert.ToInt32(sdr["Measurement_GroupID"])
                            };

                            using (SqlCommand measurementCmd = new SqlCommand())
                            {
                                measurementCmd.CommandText = "SELECT Measurement_Type.MeasurementTypeID, Measurement_Type.MeasurementType, Customer_M.Measurement, Measurement_Type.Measurement_Group_SerialNo FROM Measurement_Type LEFT OUTER JOIN (SELECT Measurement, MeasurementTypeID FROM Customer_Measurement WHERE (CustomerID = @CustomerID)) AS Customer_M ON Measurement_Type.MeasurementTypeID = Customer_M.MeasurementTypeID WHERE (Measurement_Type.Measurement_GroupID = @Measurement_GroupID) ORDER BY ISNULL(Measurement_Type.Measurement_Group_SerialNo, 99999)";
                                measurementCmd.Parameters.AddWithValue("@Measurement_GroupID", measurementsGroup.MeasurementGroupId);
                                measurementCmd.Parameters.AddWithValue("@CustomerID", customerId);
                                measurementCmd.Connection = conn;
                                
                                using (SqlDataReader measurementDr = measurementCmd.ExecuteReader())
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
            using (SqlConnection conn = new SqlConnection())
            {
                conn.ConnectionString = ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString;
                using (SqlCommand cmd = new SqlCommand())
                {
                    cmd.CommandText = "SELECT DISTINCT Dress_Style_Category.Dress_Style_Category_Name, Dress_Style.Dress_Style_CategoryID, ISNULL(Dress_Style_Category.CategorySerial, 99999) AS SN FROM Dress_Style INNER JOIN Dress_Style_Category ON Dress_Style.Dress_Style_CategoryID = Dress_Style_Category.Dress_Style_CategoryID WHERE (Dress_Style.DressID = @DressID) ORDER BY SN";
                    cmd.Parameters.AddWithValue("@DressID", dressId);
                   
                    cmd.Connection = conn;
                    conn.Open();
                    using (SqlDataReader sdr = cmd.ExecuteReader())
                    {
                        while (sdr.Read())
                        {
                            var styleGroup = new StyleGroupModel
                            { 
                                DressStyleCategoryId = Convert.ToInt32(sdr["Dress_Style_CategoryID"]), 
                                DressStyleCategoryName = sdr["Dress_Style_Category_Name"].ToString()
                            };

                            using (SqlCommand styleCmd = new SqlCommand())
                            {
                                styleCmd.CommandText = "SELECT Dress_Style.Dress_StyleID, Dress_Style.Dress_Style_Name, Customer_DS.DressStyleMesurement, CAST(CASE WHEN Customer_DS.Dress_StyleID IS NULL THEN 0 ELSE 1 END AS BIT) AS IsCheck FROM Dress_Style LEFT OUTER JOIN (SELECT DressStyleMesurement, Dress_StyleID FROM Customer_Dress_Style WHERE (CustomerID = @CustomerID)) AS Customer_DS ON Dress_Style.Dress_StyleID = Customer_DS.Dress_StyleID WHERE (Dress_Style.Dress_Style_CategoryID = @Dress_Style_CategoryID) ORDER BY ISNULL(Dress_Style.StyleSerial, 99999)";
                                styleCmd.Parameters.AddWithValue("@Dress_Style_CategoryID", styleGroup.DressStyleCategoryId);
                                styleCmd.Parameters.AddWithValue("CustomerID", customerId);
                                styleCmd.Connection = conn;
                               
                                using (SqlDataReader styleDr = styleCmd.ExecuteReader())
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