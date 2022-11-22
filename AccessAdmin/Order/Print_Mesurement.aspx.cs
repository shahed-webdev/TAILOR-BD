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

namespace TailorBD.AccessAdmin.Order
{
    public partial class Print_Mesurement : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(Request.QueryString["OrderID"]))
            {
                Response.Redirect("OrdrList.aspx");
            }

            if (!this.IsPostBack)
            {
                if (OrderGridViewWithName.Rows.Count == 1)
                {
                    All_And_Part_DropDownList.Visible = false;
                }
                else
                {
                    for (int i = 0; i <= OrderGridViewWithName.Rows.Count; i++)
                    {
                        if (i == 0)
                        {
                            All_And_Part_DropDownList.Items.Insert(i, new ListItem("সব মাপ একসাথে প্রিন্ট করুন", i.ToString()));
                        }
                        else
                        {
                            All_And_Part_DropDownList.Items.Insert(i, new ListItem(i.ToString() + " টি করে মাপ প্রিন্ট করুন", i.ToString()));
                        }
                    }

                    OrderGridViewWithName.AllowPaging = true;
                    OrderGridViewWithName.PageSize = 1;

                    All_And_Part_DropDownList.SelectedIndex = 1;
                }
            }
        }
        protected void All_And_Part_DropDownList_SelectedIndexChanged(object sender, EventArgs e)
        {
            if (All_And_Part_DropDownList.SelectedIndex == 0)
            {
                OrderGridViewWithName.AllowPaging = false;
            }
            else
            {
                OrderGridViewWithName.AllowPaging = true;
                OrderGridViewWithName.PageSize = All_And_Part_DropDownList.SelectedIndex;
            }    
        }

        protected void A4PLinkButton_Click(object sender, EventArgs e)
        {
            Response.Redirect("Print_A4_Mesurement.aspx?OrderID=" + Request.QueryString["OrderID"]);
        }


        [WebMethod]
        public static bool Measurement_Name()
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand("SELECT Print_Measurement_Name FROM Institution WHERE (InstitutionID = @InstitutionID)", con);
            cmd.Parameters.AddWithValue("@InstitutionID",HttpContext.Current.Request.Cookies["InstitutionID"].Value);
            con.Open();
            bool Print_Measurement_Name =Convert.ToBoolean(cmd.ExecuteScalar());
            con.Close();

          return Print_Measurement_Name;
        }

        [WebMethod]
        public static bool ShopName()
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand("SELECT Print_ShopName FROM Institution WHERE (InstitutionID = @InstitutionID)", con);
            cmd.Parameters.AddWithValue("@InstitutionID", HttpContext.Current.Request.Cookies["InstitutionID"].Value);
            con.Open();
            bool Print_ShopName = Convert.ToBoolean(cmd.ExecuteScalar());
            con.Close();

            return Print_ShopName;
        }

        [WebMethod]
        public static bool Customer_Name()
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand("SELECT Print_Customer_Name FROM Institution WHERE (InstitutionID = @InstitutionID)", con);
            cmd.Parameters.AddWithValue("@InstitutionID", HttpContext.Current.Request.Cookies["InstitutionID"].Value);
            con.Open();
            bool Print_Customer_Name = Convert.ToBoolean(cmd.ExecuteScalar());
            con.Close();

            return Print_Customer_Name;
        }
        
        
        [WebMethod]
        public static bool Customer_Address()
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand("SELECT Print_Customer_Address FROM Institution WHERE (InstitutionID = @InstitutionID)", con);
            cmd.Parameters.AddWithValue("@InstitutionID", HttpContext.Current.Request.Cookies["InstitutionID"].Value);
            con.Open();
            bool Print_Customer_Address = Convert.ToBoolean(cmd.ExecuteScalar());
            con.Close();

            return Print_Customer_Address;
        }

        [WebMethod]
        public static bool MasterCopy()
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand("SELECT Print_MasterCopy FROM Institution WHERE (InstitutionID = @InstitutionID)", con);
            cmd.Parameters.AddWithValue("@InstitutionID", HttpContext.Current.Request.Cookies["InstitutionID"].Value);
            con.Open();
            bool Print_MasterCopy = Convert.ToBoolean(cmd.ExecuteScalar());
            con.Close();

            return Print_MasterCopy;
        }

        [WebMethod]
        public static bool WorkerCopy()
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand("SELECT Print_WorkmanCopy FROM Institution WHERE (InstitutionID = @InstitutionID)", con);
            cmd.Parameters.AddWithValue("@InstitutionID", HttpContext.Current.Request.Cookies["InstitutionID"].Value);
            con.Open();
            bool Print_WorkmanCopy = Convert.ToBoolean(cmd.ExecuteScalar());
            con.Close();

            return Print_WorkmanCopy;
        }

        [WebMethod]
        public static bool ShopCopy()
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand("SELECT Print_ShopCopy FROM Institution WHERE (InstitutionID = @InstitutionID)", con);
            cmd.Parameters.AddWithValue("@InstitutionID", HttpContext.Current.Request.Cookies["InstitutionID"].Value);
            con.Open();
            bool Print_ShopCopy = Convert.ToBoolean(cmd.ExecuteScalar());
            con.Close();

            return Print_ShopCopy;
        }

        [WebMethod]
        public static double TopSpace()
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString);
            SqlCommand cmd = new SqlCommand("SELECT Print_TopSpace FROM Institution WHERE (InstitutionID = @InstitutionID)", con);
            cmd.Parameters.AddWithValue("@InstitutionID", HttpContext.Current.Request.Cookies["InstitutionID"].Value);
            con.Open();
            double Print_TopSpace = Convert.ToDouble(cmd.ExecuteScalar());
            con.Close();

            return Print_TopSpace;
        }

        [WebMethod]
        [ScriptMethod]
        public static void UpdatePrint(int OrderID)
        {
            string constr = ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString;
            using (SqlConnection con = new SqlConnection(constr))
            {
                using (SqlCommand cmd = new SqlCommand("UPDATE [Order] SET Is_Print += 1 WHERE (OrderID = @OrderID) AND (InstitutionID = @InstitutionID)"))
                {
                    cmd.CommandType = CommandType.Text;
                    cmd.Parameters.AddWithValue("@InstitutionID", HttpContext.Current.Request.Cookies["InstitutionID"].Value);
                    cmd.Parameters.AddWithValue("@OrderID", OrderID);
                    cmd.Connection = con;
                    con.Open();
                    cmd.ExecuteNonQuery();
                    con.Close();
                }
            }
        }


        protected void PrintSettingFormView_ItemUpdated(object sender, FormViewUpdatedEventArgs e)
        {
            Response.Redirect(Request.Url.AbsoluteUri);
        }
    }
}