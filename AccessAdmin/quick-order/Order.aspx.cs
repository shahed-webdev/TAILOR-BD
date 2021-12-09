using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Web;
using System.Web.Script.Services;
using System.Web.Services;
using TailorBD.AccessAdmin.quick_order.ViewModels;

namespace TailorBD.AccessAdmin.quick_order
{
    public partial class Order : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        //get order number first
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
                    cmd.CommandText = @"DECLARE @orderNo int;EXEC @orderNo = [dbo].[Sp_GetUpdatedOrderNo] @InstitutionID;select @orderNo";
                    cmd.Parameters.AddWithValue("@InstitutionID", HttpContext.Current.Request.Cookies["InstitutionID"]?.Value);
                    cmd.Connection = con;

                    con.Open();
                    orderNumber = Convert.ToInt32(cmd.ExecuteScalar());
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
                    cmd.CommandText = "select Top(3) CustomerID,Cloth_For_ID, CustomerName, Phone, Address from Customer where InstitutionID = @InstitutionID AND ((Phone like @prefex + '%') or (CustomerName like @prefex + '%'))";
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
                                DressId = Convert.ToInt32(sdr["DressID"]),
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
                                MeasurementGroupId = Convert.ToInt32(sdr["Measurement_GroupID"])
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
                                            MeasurementTypeID = Convert.ToInt32(measurementDr["MeasurementTypeID"]),
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
                                            IsCheck = Convert.ToBoolean(styleDr["IsCheck"])
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


        //post order
        [WebMethod]
        public static int PostOrder(OrderPostModel model)
        {
            var institutionId = Convert.ToInt32(HttpContext.Current.Request.Cookies["InstitutionID"]?.Value);
            var registrationId = Convert.ToInt32(HttpContext.Current.Request.Cookies["RegistrationID"]?.Value);
            var orderId = 0;

            // Insert order
            using (var con = new SqlConnection())
            {
                con.ConnectionString = ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString;
                using (var cmd = new SqlCommand())
                {
                    if (string.IsNullOrEmpty(model.OrderSn))
                    {
                        cmd.CommandText = @"DECLARE @orderNo int;EXEC @orderNo = [dbo].[Sp_GetUpdatedOrderNo] @InstitutionID;INSERT INTO[Order] ([CustomerID], [RegistrationID], [InstitutionID], [Cloth_For_ID], [OrderDate],[OrderSerialNumber],[DeliveryDate]) VALUES (@CustomerID, @RegistrationID, @InstitutionID, @Cloth_For_ID, getdate(),@orderNo, @DeliveryDate); Select scope_identity()";
                    }
                    else
                    {
                        cmd.CommandText = @"INSERT INTO[Order] ([CustomerID], [RegistrationID], [InstitutionID], [Cloth_For_ID], [OrderDate],[OrderSerialNumber],[DeliveryDate]) VALUES (@CustomerID, @RegistrationID, @InstitutionID, @Cloth_For_ID, getdate(),@orderNo, @DeliveryDate); Select scope_identity()";
                        cmd.Parameters.AddWithValue("@orderNo", model.OrderSn);
                    }

                    cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                    cmd.Parameters.AddWithValue("@RegistrationID", registrationId);
                    cmd.Parameters.AddWithValue("@Cloth_For_ID", model.ClothForId);
                    cmd.Parameters.AddWithValue("@CustomerID", model.CustomerId);
                    cmd.Parameters.AddWithValue("@DeliveryDate", (object)model.DeliveryDate ?? DBNull.Value);
                    cmd.Connection = con;
                    con.Open();
                    orderId = Convert.ToInt32(cmd.ExecuteScalar());
                    con.Close();
                }
            }

            //Insert order List
            using (var con = new SqlConnection())
            {
                con.ConnectionString = ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString;
                using (var cmd = new SqlCommand())
                {
                    cmd.CommandText = @"SP_Order_Place";
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Connection = con;
                    con.Open();

                    foreach (var list in model.OrderList)
                    {
                        cmd.Parameters.Clear();

                        cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                        cmd.Parameters.AddWithValue("@RegistrationID", registrationId);
                        cmd.Parameters.AddWithValue("@Cloth_For_ID", model.ClothForId);
                        cmd.Parameters.AddWithValue("@CustomerID", model.CustomerId);
                        cmd.Parameters.AddWithValue("@OrderID", orderId);
                        cmd.Parameters.AddWithValue("@DressID", list.DressId);

                        cmd.Parameters.AddWithValue("@List_Measurement", list.ListMeasurement);
                        cmd.Parameters.AddWithValue("@List_Style", list.ListStyle);
                        cmd.Parameters.AddWithValue("@List_payment", list.ListPayment);

                        cmd.Parameters.AddWithValue("@DressQuantity", list.DressQuantity);
                        cmd.Parameters.AddWithValue("@Details", list.Details);

                        cmd.ExecuteNonQuery();
                    }
                    con.Close();
                }
            }

            // Insert order payment
            if (model.PaidAmount > 0)
            {
                using (var con = new SqlConnection())
                {
                    con.ConnectionString = ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString;
                    using (var cmd = new SqlCommand())
                    {
                        cmd.CommandText = @"INSERT INTO Payment_Record(OrderID, CustomerID, RegistrationID, InstitutionID, Amount, Payment_TimeStatus, AccountID)VALUES(@OrderID,@CustomerID,@RegistrationID,@InstitutionID,@Amount, 'Advance',@AccountID)";
                        cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                        cmd.Parameters.AddWithValue("@RegistrationID", registrationId);
                        cmd.Parameters.AddWithValue("@OrderID", orderId);
                        cmd.Parameters.AddWithValue("@CustomerID", model.CustomerId);
                        cmd.Parameters.AddWithValue("@Amount", model.PaidAmount);
                        cmd.Parameters.AddWithValue("@AccountID", model.AccountId);
                        cmd.Connection = con;
                        con.Open();
                        cmd.ExecuteNonQuery();
                        con.Close();
                    }
                }
            }

            // update order discount amount
            if (model.Discount > 0)
            {
                using (var con = new SqlConnection())
                {
                    con.ConnectionString = ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString;
                    using (var cmd = new SqlCommand())
                    {
                        cmd.CommandText = @"UPDATE [Order] SET  Discount = @Discount WHERE (OrderID = @OrderID)";
                        cmd.Parameters.AddWithValue("@OrderID", orderId);
                        cmd.Parameters.AddWithValue("@Discount", model.Discount);

                        cmd.Connection = con;
                        con.Open();
                        cmd.ExecuteNonQuery();
                        con.Close();
                    }
                }
            }

            return orderId;
        }


        //Get Discount limit %
        [WebMethod]
        [ScriptMethod(UseHttpGet = true)]
        public static int GetDiscountLimitPercentage()
        {
            var discountLimitPercentage = 0;
            using (var con = new SqlConnection())
            {
                con.ConnectionString = ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString;
                using (var cmd = new SqlCommand())
                {
                    cmd.CommandText = @"SELECT Discount_Limit FROM Institution WHERE (InstitutionID = @InstitutionID)";
                    cmd.Parameters.AddWithValue("@InstitutionID", HttpContext.Current.Request.Cookies["InstitutionID"]?.Value);
                    cmd.Connection = con;

                    con.Open();
                    discountLimitPercentage = Convert.ToInt32(cmd.ExecuteScalar());
                    con.Close();
                }
            }
            return discountLimitPercentage;
        }

        //dress price dropdown
        [WebMethod]
        [ScriptMethod(UseHttpGet = true)]
        public static List<DressPriceDllModel> DressPriceDlls(int dressId)
        {
            var dressList = new List<DressPriceDllModel>();
            using (var conn = new SqlConnection())
            {
                conn.ConnectionString = ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString;
                using (var cmd = new SqlCommand())
                {
                    cmd.CommandText = @"SELECT Price_For, Price FROM Dress_Price WHERE (InstitutionID = @InstitutionID) AND (DressID = @DressID) ORDER BY Price_For";
                    cmd.Parameters.AddWithValue("@DressID", dressId);
                    cmd.Parameters.AddWithValue("@InstitutionID", HttpContext.Current.Request.Cookies["InstitutionID"]?.Value);

                    cmd.Connection = conn;
                    conn.Open();
                    using (var sdr = cmd.ExecuteReader())
                    {
                        while (sdr.Read())
                        {
                            var dressPrice = new DressPriceDllModel
                            {
                                Price = Convert.ToDouble(sdr["Price"]),
                                PriceFor = sdr["Price_For"].ToString()
                            };
                            dressList.Add(dressPrice);
                        }
                    }
                    conn.Close();
                }
            }
            return dressList;
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


        //Get Order Details
        [WebMethod]
        [ScriptMethod(UseHttpGet = true)]
        public static OrderViewModel GetOrderDetails(int orderId)
        {
            var order = new OrderViewModel();

            //dress details
            using (var conn = new SqlConnection())
            {
                conn.ConnectionString = ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString;
                using (var cmd = new SqlCommand())
                {
                    cmd.CommandText = @"SELECT [Order].OrderID, [Order].OrderSerialNumber, [Order].Cloth_For_ID, [Order].CustomerID, Customer.CustomerName, Customer.Phone, [Order].DeliveryDate, [Order].OrderAmount, [Order].PaidAmount, [Order].Discount FROM  [Order] INNER JOIN Customer ON [Order].CustomerID = Customer.CustomerID WHERE ([Order].OrderID = @OrderID) AND ([Order].InstitutionID = @InstitutionID)";
                    cmd.Parameters.AddWithValue("@InstitutionID", HttpContext.Current.Request.Cookies["InstitutionID"]?.Value);
                    cmd.Parameters.AddWithValue("@OrderID", orderId);

                    cmd.Connection = conn;

                    conn.Open();
                    using (var orderDr = cmd.ExecuteReader())
                    {
                        while (orderDr.Read())
                        {
                            order.OrderId = Convert.ToInt32(orderDr["OrderID"]);
                            order.OrderSn = orderDr["OrderSerialNumber"].ToString();
                            order.ClothForId = Convert.ToInt32(orderDr["Cloth_For_ID"]);
                            order.CustomerId = Convert.ToInt32(orderDr["CustomerID"]);
                            order.CustomerName = orderDr["CustomerName"].ToString();
                            order.Phone = orderDr["Phone"].ToString();
                            order.DeliveryDate = orderDr["DeliveryDate"] as DateTime?;
                            order.OrderAmount = Convert.ToDouble(orderDr["OrderAmount"]);
                            order.PaidAmount = Convert.ToDouble(orderDr["PaidAmount"]);
                            order.Discount = Convert.ToDouble(orderDr["Discount"]);
                        }
                    }
                    conn.Close();
                }
            }

            //dress measurement
            using (var conn = new SqlConnection())
            {
                conn.ConnectionString = ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString;
                using (var listCmd = new SqlCommand())
                {
                    listCmd.CommandText = @"SELECT  OrderList.OrderListID, OrderList.DressID, OrderList.DressQuantity, OrderList.Details, Dress.Dress_Name FROM  OrderList INNER JOIN Dress ON OrderList.DressID = Dress.DressID WHERE (OrderList.OrderID = @OrderID)";
                    listCmd.Parameters.AddWithValue("@OrderID", orderId);

                    listCmd.Connection = conn;
                    conn.Open();
                    using (var listSdr = listCmd.ExecuteReader())
                    {
                        while (listSdr.Read())
                        {
                            var orderList = new OrderListViewModel
                            {
                                OrderListId = Convert.ToInt32(listSdr["OrderListID"]),
                                DressId = Convert.ToInt32(listSdr["DressID"]),
                                DressName = listSdr["Dress_Name"].ToString(),
                                DressQuantity = Convert.ToDouble(listSdr["DressQuantity"]),
                                Details = listSdr["Details"].ToString()
                            };

                            //dress Measurement
                            using (var cmd = new SqlCommand())
                            {
                                cmd.CommandText = "SELECT DISTINCT Measurement_GroupID, ISNULL(Ascending, 99999) AS Ascending FROM Measurement_Type WHERE(InstitutionID = @InstitutionID) AND(DressID = @DressID) ORDER BY Ascending";
                                cmd.Parameters.AddWithValue("@InstitutionID", HttpContext.Current.Request.Cookies["InstitutionID"]?.Value);
                                cmd.Parameters.AddWithValue("@DressID", orderList.DressId);

                                cmd.Connection = conn;

                                using (var sdr = cmd.ExecuteReader())
                                {
                                    while (sdr.Read())
                                    {
                                        var measurementsGroup = new MeasurementsGroupModel
                                        {
                                            MeasurementGroupId = Convert.ToInt32(sdr["Measurement_GroupID"])
                                        };

                                        using (var measurementCmd = new SqlCommand())
                                        {
                                            measurementCmd.CommandText = @"SELECT Measurement_Type.MeasurementTypeID, Measurement_Type.MeasurementType, OrderList_M.Measurement, Measurement_Type.Measurement_Group_SerialNo FROM  Measurement_Type LEFT OUTER JOIN  (SELECT  Measurement, MeasurementTypeID FROM Ordered_Measurement WHERE (OrderListID = @OrderListID)) AS OrderList_M ON Measurement_Type.MeasurementTypeID = OrderList_M.MeasurementTypeID WHERE (Measurement_Type.Measurement_GroupID = @Measurement_GroupID) ORDER BY ISNULL(Measurement_Type.Measurement_Group_SerialNo, 99999)";
                                            measurementCmd.Parameters.AddWithValue("@Measurement_GroupID", measurementsGroup.MeasurementGroupId);
                                            measurementCmd.Parameters.AddWithValue("@OrderListID", orderList.OrderListId);
                                            measurementCmd.Connection = conn;

                                            using (var measurementDr = measurementCmd.ExecuteReader())
                                            {
                                                while (measurementDr.Read())
                                                {
                                                    var measurement = new MeasurementsModel
                                                    {
                                                        MeasurementTypeID = Convert.ToInt32(measurementDr["MeasurementTypeID"]),
                                                        MeasurementType = measurementDr["MeasurementType"].ToString(),
                                                        Measurement = measurementDr["Measurement"].ToString()
                                                    };
                                                    measurementsGroup.Measurements.Add(measurement);
                                                }
                                            }

                                        }
                                        orderList.Measurements.Add(measurementsGroup);
                                    }
                                }

                            }


                            //dress Style
                            using (var cmd = new SqlCommand())
                            {
                                cmd.CommandText = "SELECT DISTINCT Dress_Style_Category.Dress_Style_Category_Name, Dress_Style.Dress_Style_CategoryID, ISNULL(Dress_Style_Category.CategorySerial, 99999) AS SN FROM Dress_Style INNER JOIN Dress_Style_Category ON Dress_Style.Dress_Style_CategoryID = Dress_Style_Category.Dress_Style_CategoryID WHERE (Dress_Style.DressID = @DressID) ORDER BY SN";
                                cmd.Parameters.AddWithValue("@DressID", orderList.DressId);

                                cmd.Connection = conn;

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
                                            styleCmd.CommandText = @"SELECT  Dress_Style.Dress_StyleID, Dress_Style.Dress_Style_Name, OrderList_DS.DressStyleMesurement, CAST(CASE WHEN OrderList_DS.Dress_StyleID IS NULL THEN 0 ELSE 1 END AS BIT) AS IsCheck FROM Dress_Style LEFT OUTER JOIN (SELECT DressStyleMesurement, Dress_StyleID FROM Ordered_Dress_Style WHERE (OrderListID = @OrderListID)) AS OrderList_DS ON Dress_Style.Dress_StyleID = OrderList_DS.Dress_StyleID WHERE (Dress_Style.Dress_Style_CategoryID = @Dress_Style_CategoryID) ORDER BY ISNULL(Dress_Style.StyleSerial, 99999)";
                                            styleCmd.Parameters.AddWithValue("@Dress_Style_CategoryID", styleGroup.DressStyleCategoryId);
                                            styleCmd.Parameters.AddWithValue("@OrderListID", orderList.OrderListId);
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
                                                        IsCheck = Convert.ToBoolean(styleDr["IsCheck"])
                                                    };
                                                    styleGroup.Styles.Add(style);
                                                }
                                            }
                                        }
                                        orderList.Styles.Add(styleGroup);
                                    }
                                }
                            }

                            // price
                            using (var cmd = new SqlCommand())
                            {
                                cmd.CommandText = @"SELECT OrderPaymentID, FabricID, Details, UnitPrice, Unit, Amount FROM Order_Payment WHERE (OrderListID = @OrderListID)";
                                cmd.Parameters.AddWithValue("@OrderListID", orderList.OrderListId);
                                cmd.Connection = conn;

                                using (var dr = cmd.ExecuteReader())
                                {
                                    while (dr.Read())
                                    {
                                        var style = new OrderPaymentViewModel
                                        {
                                            OrderPaymentId = Convert.ToInt32(dr["OrderPaymentID"]),
                                            FabricId = dr["FabricID"] as int?,
                                            For = dr["Details"].ToString(),
                                            Quantity = dr["Unit"] as double?,
                                            UnitPrice = dr["UnitPrice"] as double?,
                                            Amount = dr["Amount"] as double?
                                        };
                                        orderList.Payments.Add(style);
                                    }
                                }
                            }

                            order.OrderList.Add(orderList);
                        }
                    }
                    conn.Close();
                }
            }
            return order;
        }


        //update order
        [WebMethod]
        public static int EditOrder(OrderEditModel model)
        {
            var institutionId = Convert.ToInt32(HttpContext.Current.Request.Cookies["InstitutionID"]?.Value);
            var registrationId = Convert.ToInt32(HttpContext.Current.Request.Cookies["RegistrationID"]?.Value);

            using (var con = new SqlConnection())
            {
                con.ConnectionString = ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString;
                con.Open();
                foreach (var list in model.OrderList)
                {
                    //Insert order List
                    if (list.OrderListId == null)
                    {
                        using (var cmd = new SqlCommand())
                        {
                            cmd.CommandText = @"SP_Order_Place";
                            cmd.CommandType = CommandType.StoredProcedure;
                            cmd.Connection = con;

                            cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                            cmd.Parameters.AddWithValue("@RegistrationID", registrationId);
                            cmd.Parameters.AddWithValue("@Cloth_For_ID", model.ClothForId);
                            cmd.Parameters.AddWithValue("@CustomerID", model.CustomerId);
                            cmd.Parameters.AddWithValue("@OrderID", model.OrderId);
                            cmd.Parameters.AddWithValue("@DressID", list.DressId);

                            cmd.Parameters.AddWithValue("@List_Measurement", list.ListMeasurement);
                            cmd.Parameters.AddWithValue("@List_Style", list.ListStyle);
                            cmd.Parameters.AddWithValue("@List_payment", list.ListPayment);

                            cmd.Parameters.AddWithValue("@DressQuantity", list.DressQuantity);
                            cmd.Parameters.AddWithValue("@Details", list.Details);

                            cmd.ExecuteNonQuery();
                        }
                    }
                    else
                    {
                        using (var cmd = new SqlCommand())
                        {
                            cmd.CommandText = @"SP_Order_Edit";
                            cmd.CommandType = CommandType.StoredProcedure;
                            cmd.Connection = con;

                            cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                            cmd.Parameters.AddWithValue("@RegistrationID", registrationId);
                            cmd.Parameters.AddWithValue("@Cloth_For_ID", model.ClothForId);
                            cmd.Parameters.AddWithValue("@CustomerID", model.CustomerId);
                            cmd.Parameters.AddWithValue("@OrderID", model.OrderId);
                            cmd.Parameters.AddWithValue("@OrderListID", list.OrderListId);
                            cmd.Parameters.AddWithValue("@DressID", list.DressId);

                            cmd.Parameters.AddWithValue("@List_Measurement", list.ListMeasurement);
                            cmd.Parameters.AddWithValue("@List_Style", list.ListStyle);
                            cmd.Parameters.AddWithValue("@List_payment", list.ListPayment);

                            cmd.Parameters.AddWithValue("@DressQuantity", list.DressQuantity);
                            cmd.Parameters.AddWithValue("@Details", list.Details);

                            cmd.ExecuteNonQuery();
                        }
                    }
                }


                using (var cmd = new SqlCommand())
                {
                    cmd.CommandText = @"SP_OrderList_Delete";
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Connection = con;
                    cmd.Parameters.AddWithValue("@OrderID", model.OrderId);
                    cmd.Parameters.AddWithValue("@OrderListIDs", model.DeletedOrderListIds);
                    cmd.Parameters.AddWithValue("@paymentIds", model.DeletedOrderPaymentIds);

                    cmd.ExecuteNonQuery();
                }
                con.Close();
            }

            return model.OrderId;
        }


        //DeleteOrder
        [WebMethod]
        public static ResponseModel DeleteOrder(int orderId)
        {
            try
            {
                using (var con = new SqlConnection())
                {
                    con.ConnectionString = ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString;
                    con.Open();
                    using (var cmd = new SqlCommand())
                    {
                        cmd.CommandText = @"SP_Order_Delete";
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Connection = con;
                        cmd.Parameters.AddWithValue("@OrderID", orderId);
                        cmd.ExecuteNonQuery();
                    }
                    con.Close();
                }

                return new ResponseModel(true, "Success");
            }
            catch (Exception ex)
            {
                return new ResponseModel(false, ex.Message);
            }
        }
    }
}