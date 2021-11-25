using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Web.Services;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.quick_order
{
    public partial class Order : System.Web.UI.Page
    {
        SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ToString());
        protected void Page_Load(object sender, EventArgs e)
        {
           
        }
        protected void PrevDress()
        {
            foreach (ListItem myItem in DressDropDownList.Items)
            {
                SqlCommand CheckDress_cmd = new SqlCommand("SELECT Measurement_Type.DressID FROM Customer_Measurement INNER JOIN Measurement_Type ON Customer_Measurement.MeasurementTypeID = Measurement_Type.MeasurementTypeID WHERE (Measurement_Type.DressID = @DressID) AND (Customer_Measurement.CustomerID = @CustomerID)", con);
                CheckDress_cmd.Parameters.AddWithValue("@DressID", 1);
                CheckDress_cmd.Parameters.AddWithValue("@CustomerID", 1);
               
                con.Open();
                object Dress = CheckDress_cmd.ExecuteScalar();
                con.Close();

                if (Dress != null)
                {
                    myItem.Attributes.Add("class", "Dress");
                }
            }
        }

        //Dress
        protected void DressDropDownList_DataBound(object sender, EventArgs e)
        {
            PrevDress();
        }
        protected void DressDropDownList_SelectedIndexChanged(object sender, EventArgs e)
        {
         
            var DetailsDV = (DataView)Customer_DressSQL.Select(DataSourceSelectArguments.Empty);
            if (DetailsDV.Count > 0)
            {
                DetailsTextBox.Text = DetailsDV[0]["CDDetails"].ToString();
            }
            else
            {
                DetailsTextBox.Text = "";
            }

            PrevDress();
        }


        [WebMethod]
        public static string Set_Data(int Cloth_For_ID, int CustomerID, int DressID, string List_Measurement, string List_Style, string List_payment, int DressQuantity, string Details, string OrderID)
        {
            int InstitutionID = Convert.ToInt32(HttpContext.Current.Request.Cookies["InstitutionID"].Value);
            int RegistrationID = Convert.ToInt32(HttpContext.Current.Request.Cookies["RegistrationID"].Value);

            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString);

            con.Open();
            if (OrderID == "")
            {
                SqlCommand OrderID_cmd = new SqlCommand("INSERT INTO[Order] ([CustomerID], [RegistrationID], [InstitutionID], [Cloth_For_ID], [OrderDate],[OrderSerialNumber]) VALUES (@CustomerID, @RegistrationID, @InstitutionID, @Cloth_For_ID, getdate(),(Select[dbo].[checkLastSerialNumber](@InstitutionID))) Select scope_identity()", con);
                OrderID_cmd.Parameters.AddWithValue("@InstitutionID", InstitutionID);
                OrderID_cmd.Parameters.AddWithValue("@RegistrationID", RegistrationID);
                OrderID_cmd.Parameters.AddWithValue("@Cloth_For_ID", Cloth_For_ID);
                OrderID_cmd.Parameters.AddWithValue("@CustomerID", CustomerID);

                OrderID = OrderID_cmd.ExecuteScalar().ToString();
            }

            SqlCommand Order_Place_cmd = new SqlCommand("SP_Order_Place", con);
            Order_Place_cmd.CommandType = CommandType.StoredProcedure;

            Order_Place_cmd.Parameters.AddWithValue("@InstitutionID", InstitutionID);
            Order_Place_cmd.Parameters.AddWithValue("@RegistrationID", RegistrationID);
            Order_Place_cmd.Parameters.AddWithValue("@Cloth_For_ID", Cloth_For_ID);
            Order_Place_cmd.Parameters.AddWithValue("@CustomerID", CustomerID);
            Order_Place_cmd.Parameters.AddWithValue("@OrderID", Convert.ToInt32(OrderID));
            Order_Place_cmd.Parameters.AddWithValue("@DressID", DressID);

            Order_Place_cmd.Parameters.AddWithValue("@List_Measurement", List_Measurement);
            Order_Place_cmd.Parameters.AddWithValue("@List_Style", List_Style);
            Order_Place_cmd.Parameters.AddWithValue("@List_payment", List_payment);

            Order_Place_cmd.Parameters.AddWithValue("@DressQuantity", DressQuantity);
            Order_Place_cmd.Parameters.AddWithValue("@Details", Details);

            string OrderList = Order_Place_cmd.ExecuteScalar().ToString();
            con.Close();
            return OrderList;
        }

        protected void DressPriceDDList_DataBound(object sender, EventArgs e)
        {
            DressPriceDDList.Items.Insert(0, new ListItem("নির্ধারিত মূল্য নির্বাচন করুন", "0"));
        }

        //Autocomplete
        [WebMethod]
        public static string[] GetDetailst(string prefix)
        {
            List<string> Details = new List<string>();
            using (SqlConnection conn = new SqlConnection())
            {
                conn.ConnectionString = ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString;
                using (SqlCommand cmd = new SqlCommand())
                {
                    cmd.CommandText = "SELECT DISTINCT Top(10) Details FROM Order_Payment WHERE (InstitutionID = @InstitutionID) AND (Details IS NOT NULL) AND (Details LIKE @Details + '%') ORDER BY Details";
                    cmd.Parameters.AddWithValue("@Details", prefix);
                    cmd.Parameters.AddWithValue("@InstitutionID", HttpContext.Current.Request.Cookies["InstitutionID"].Value);

                    cmd.Connection = conn;
                    conn.Open();
                    using (SqlDataReader sdr = cmd.ExecuteReader())
                    {
                        while (sdr.Read())
                        {
                            Details.Add(string.Format("{0}",
                              sdr["Details"]));
                        }
                    }
                    conn.Close();
                }
            }
            return Details.ToArray();
        }

        [WebMethod]
        public static string[] GetStyle(string prefix)
        {
            List<string> Details = new List<string>();
            using (SqlConnection conn = new SqlConnection())
            {
                conn.ConnectionString = ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString;
                using (SqlCommand cmd = new SqlCommand())
                {
                    cmd.CommandText = "SELECT DISTINCT Top(10) DressStyleMesurement FROM Ordered_Dress_Style WHERE (InstitutionID = @InstitutionID) AND (DressStyleMesurement IS NOT NULL) AND (DressStyleMesurement like @DressStyleMesurement +'%') ORDER BY DressStyleMesurement";
                    cmd.Parameters.AddWithValue("@DressStyleMesurement", prefix);
                    cmd.Parameters.AddWithValue("@InstitutionID", HttpContext.Current.Request.Cookies["InstitutionID"].Value);

                    cmd.Connection = conn;
                    conn.Open();
                    using (SqlDataReader sdr = cmd.ExecuteReader())
                    {
                        while (sdr.Read())
                        {
                            Details.Add(string.Format("{0}",
                              sdr["DressStyleMesurement"]));
                        }
                    }
                    conn.Close();
                }
            }
            return Details.ToArray();
        }
    }
}