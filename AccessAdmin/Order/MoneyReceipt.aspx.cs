using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Order
{
    public partial class MoneyReceipt : System.Web.UI.Page
    {
        SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ToString());
        protected void Page_Load(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(Request.QueryString["OrderID"]))
            {
                Response.Redirect("OrdrList.aspx");
            }

            if (!this.IsPostBack)
            {
                SqlCommand AccountCmd = new SqlCommand("Select AccountID from Account where InstitutionID = @InstitutionID AND Default_Status = 'True'", con);
                AccountCmd.Parameters.AddWithValue("@InstitutionID", Request.Cookies["InstitutionID"].Value);
                con.Open();
                object AccountID = AccountCmd.ExecuteScalar();
                con.Close();

                if (AccountID != null)
                    AccountDropDownList.SelectedValue = AccountID.ToString();
            }
        }

        protected void SubmtButton_Click(object sender, EventArgs e)
        {
            try
            {
                DateTime temp;
                if (!string.IsNullOrEmpty(DelevaryDateTextBox.Text) && DateTime.TryParse(DelevaryDateTextBox.Text, out temp))
                {   
                    OrderUpdetSQL.Update();
                    if (!string.IsNullOrEmpty(PaidAmounTextBox.Text))
                    {
                        if (PaidAmounTextBox.Text != "0")
                        {
                            PaymentRecordSQL.Insert();
                        }
                    }
  
                    Response.Redirect("~/AccessAdmin/Order/OrderDetailsForCustomer.aspx?" + "OrderID=" + Request.QueryString["OrderID"]);
                }
            }
            catch (SqlException ex)
            {
                ErrorLabel.Text = ex.Message;
            }
        }

        protected void AddMoreDressButton_Click(object sender, EventArgs e)
        {
            Response.Redirect("~/AccessAdmin/Order/Add_More_Dress_In_Order.aspx?" + "OrderID=" + Request.QueryString["OrderID"]);
        }

        protected void AccountDropDownList_DataBound(object sender, EventArgs e)
        {
            AccountDropDownList.Items.Insert(0, new ListItem("Without Account", ""));
        }
    }
}