using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Web;
using System.Web.Script.Services;
using System.Web.Services;
using System.Web.UI.WebControls;
using TailorBD.AccessAdmin.quick_order.ViewModels;

namespace TailorBD.AccessAdmin.Fabrics.Sell
{
    public partial class Fabrics_Selling : System.Web.UI.Page
    {

        protected void Page_Load(object sender, EventArgs e)
        {
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
                    cmd.CommandText = "select Top(3) CustomerID, Cloth_For_ID, CustomerName, Phone, Address, Description from Customer where InstitutionID = @InstitutionID AND ((Phone like @prefex + '%') or (CustomerName like @prefex + '%'))";
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
                                Description = sdr["Description"].ToString(),
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
                    cmd.CommandText = @"INSERT INTO Customer (RegistrationID, InstitutionID, Cloth_For_ID, CustomerName, Phone, Address,Description, Date, CustomerNumber) VALUES (@RegistrationID,@InstitutionID,@Cloth_For_ID,@CustomerName,@Phone,@Address,@Description, GETDATE(),(SELECT [dbo].[CustomeSerialNumber](@InstitutionID))); select IDENT_CURRENT('Customer')";
                    cmd.Parameters.AddWithValue("@RegistrationID", HttpContext.Current.Request.Cookies["RegistrationID"]?.Value);
                    cmd.Parameters.AddWithValue("@InstitutionID", HttpContext.Current.Request.Cookies["InstitutionID"]?.Value);
                    cmd.Parameters.AddWithValue("@Cloth_For_ID", model.Cloth_For_ID);
                    cmd.Parameters.AddWithValue("@CustomerName", model.CustomerName.Trim());
                    cmd.Parameters.AddWithValue("@Phone", model.Phone.Trim());
                    cmd.Parameters.AddWithValue("@Address", model.Address.Trim());
                    cmd.Parameters.AddWithValue("@Description", model.Description.Trim());
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


        //find fabrics autocomplete
        [WebMethod]
        [ScriptMethod(UseHttpGet = true)]
        public static List<FabricViewModel> FindFabrics(string prefix)
        {
            var fabrics = new List<FabricViewModel>();
            using (var conn = new SqlConnection())
            {
                conn.ConnectionString = ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString;
                using (var cmd = new SqlCommand())
                {
                    cmd.CommandText = @"SELECT top(3) Fabrics.FabricCode, Fabrics.FabricsName, Fabrics.SellingUnitPrice, Fabrics.StockFabricQuantity, Fabrics_Mesurement_Unit.UnitName, Fabrics.FabricID, Fabrics.InstitutionID FROM  Fabrics INNER JOIN Fabrics_Mesurement_Unit ON Fabrics.FabricMesurementUnitID = Fabrics_Mesurement_Unit.FabricMesurementUnitID WHERE (Fabrics.InstitutionID = @InstitutionID) AND (Fabrics.StockFabricQuantity <> 0) AND Fabrics.FabricCode like @FabricCode + '%'";
                    cmd.Parameters.AddWithValue("@InstitutionID", HttpContext.Current.Request.Cookies["InstitutionID"]?.Value);
                    cmd.Parameters.AddWithValue("@FabricCode", prefix);
                    cmd.Connection = conn;
                    conn.Open();
                    using (var sdr = cmd.ExecuteReader())
                    {
                        while (sdr.Read())
                        {
                            var fabric = new FabricViewModel
                            {
                                FabricId = Convert.ToInt32(sdr["FabricID"]),
                                FabricCode = sdr["FabricCode"].ToString(),
                                FabricsName = sdr["FabricsName"].ToString(),
                                SellingUnitPrice = Convert.ToDouble(sdr["SellingUnitPrice"]),
                                StockFabricQuantity = Convert.ToDouble(sdr["StockFabricQuantity"]),
                                UnitName = sdr["UnitName"].ToString()
                            };
                            fabrics.Add(fabric);
                        }
                    }
                    conn.Close();
                }
            }
            return fabrics;
        }


        //get fabrics by code
        [WebMethod]
        [ScriptMethod(UseHttpGet = true)]
        public static List<FabricViewModel> GetFabric(string code)
        {
            var fabrics = new List<FabricViewModel>();
            using (var conn = new SqlConnection())
            {
                conn.ConnectionString = ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString;
                using (var cmd = new SqlCommand())
                {
                    cmd.CommandText = @"SELECT Fabrics.FabricCode, Fabrics.FabricsName, Fabrics.SellingUnitPrice, Fabrics.StockFabricQuantity, Fabrics_Mesurement_Unit.UnitName, Fabrics.FabricID, Fabrics.InstitutionID FROM  Fabrics INNER JOIN Fabrics_Mesurement_Unit ON Fabrics.FabricMesurementUnitID = Fabrics_Mesurement_Unit.FabricMesurementUnitID WHERE (Fabrics.InstitutionID = @InstitutionID) AND (Fabrics.StockFabricQuantity <> 0) AND (Fabrics.FabricCode = @code)";
                    cmd.Parameters.AddWithValue("@InstitutionID", HttpContext.Current.Request.Cookies["InstitutionID"]?.Value);
                    cmd.Parameters.AddWithValue("@code", code);
                    cmd.Connection = conn;
                    
                    conn.Open();
                    using (var sdr = cmd.ExecuteReader())
                    {
                        while (sdr.Read())
                        {
                            var fabric = new FabricViewModel
                            {
                                FabricId = Convert.ToInt32(sdr["FabricID"]),
                                FabricCode = sdr["FabricCode"].ToString(),
                                FabricsName = sdr["FabricsName"].ToString(),
                                SellingUnitPrice = Convert.ToDouble(sdr["SellingUnitPrice"]),
                                StockFabricQuantity = Convert.ToDouble(sdr["StockFabricQuantity"]),
                                UnitName = sdr["UnitName"].ToString()
                            };
                            fabrics.Add(fabric);
                        }
                    }
                    conn.Close();
                }
            }
            return fabrics;
        }



        //Account dropdown
        [WebMethod]
        [ScriptMethod(UseHttpGet = true)]
        public static List<AccountDllModel> AccountDlls()
        {
            var accountList = new List<AccountDllModel>();
            using (var conn = new SqlConnection())
            {
                conn.ConnectionString = ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString;
                using (var cmd = new SqlCommand())
                {
                    cmd.CommandText = @"SELECT  AccountID, AccountName, Default_Status FROM Account WHERE (InstitutionID = @InstitutionID) ORDER BY AccountName";
                    cmd.Parameters.AddWithValue("@InstitutionID", HttpContext.Current.Request.Cookies["InstitutionID"]?.Value);

                    cmd.Connection = conn;
                    conn.Open();
                    using (var sdr = cmd.ExecuteReader())
                    {
                        while (sdr.Read())
                        {
                            var dressPrice = new AccountDllModel
                            {
                                AccountId = Convert.ToInt32(sdr["AccountID"]),
                                AccountName = sdr["AccountName"].ToString(),
                                IsDefault = Convert.ToBoolean(sdr["Default_Status"])
                            };
                            accountList.Add(dressPrice);
                        }
                    }
                    conn.Close();
                }
            }
            return accountList;
        }


        //post order
        [WebMethod]
        public static ResponseModel<int> PostOrder(FabricSellingModel model)
        {
            try
            {
                var institutionId = Convert.ToInt32(HttpContext.Current.Request.Cookies["InstitutionID"]?.Value);
                var registrationId = Convert.ToInt32(HttpContext.Current.Request.Cookies["RegistrationID"]?.Value);
                var fabricsSellingId = 0;

                //Insert order List
                using (var con = new SqlConnection())
                {
                    con.ConnectionString = ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString;
                    using (var cmd = new SqlCommand())
                    {
                        cmd.CommandText = @"SP_Fabrics_Sell";
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Connection = con;

                        cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                        cmd.Parameters.AddWithValue("@RegistrationID", registrationId);

                        cmd.Parameters.AddWithValue("@AccountID", model.AccountID);
                        cmd.Parameters.AddWithValue("@CustomerID", (object)model.CustomerID ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@SellingPaidAmount", model.SellingPaidAmount);
                        cmd.Parameters.AddWithValue("@SellingDiscountAmount", model.SellingDiscountAmount);
                        cmd.Parameters.AddWithValue("@FabricList", model.FabricList);

                        con.Open();
                        fabricsSellingId = Convert.ToInt32(cmd.ExecuteScalar());
                        con.Close();
                    }
                }

                return new ResponseModel<int>(true, "Success", fabricsSellingId);
            }
            catch (Exception e)
            {
                return new ResponseModel<int>(false, e.Message);
            }
        }
    }
}