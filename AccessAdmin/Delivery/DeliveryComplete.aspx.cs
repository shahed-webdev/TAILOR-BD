using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Delivery
{
    public partial class DeliveryComplete : System.Web.UI.Page
    {
        SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ToString());
        protected void Page_Load(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(Request.QueryString["OrderID"]))
            {
                Response.Redirect("Delivery.aspx");
            }
            if (!this.IsPostBack)
            {
                SelectedAccount();
            }
        }

        protected void SubmtButton_Click(object sender, EventArgs e)
        {
            try
            {
                if (PaidAmounTextBox.Text != string.Empty)
                {
                    if (PaidAmounTextBox.Text != "0")
                    {
                        PaymentRecordSQL.Insert();
                    }
                }

                foreach (GridViewRow row in OrderDetailsGridView.Rows)
                {
                    TextBox ReadyForDeliveryTextBox = (TextBox)row.FindControl("ReadyForDeliveryTextBox");
                    if (!string.IsNullOrEmpty(ReadyForDeliveryTextBox.Text))
                    {
                        Order_Delivery_DateSQL.InsertParameters["OrderListID"].DefaultValue = OrderDetailsGridView.DataKeys[row.DataItemIndex]["OrderListID"].ToString();
                        Order_Delivery_DateSQL.InsertParameters["DQuantity"].DefaultValue = ReadyForDeliveryTextBox.Text;
                        Order_Delivery_DateSQL.Insert();
                    }
                }

                OrderDiscountUpdetSQL.Update();
                Response.Redirect("~/AccessAdmin/Order/OrderDetailsForCustomer.aspx?" + "OrderID=" + Request.QueryString["OrderID"]);
            }
            catch (SqlException ex)
            {
                MsgLabel.Text = ex.Message;
            }
        }

        protected void AccountDropDownList_DataBound(object sender, EventArgs e)
        {
            AccountDropDownList.Items.Insert(0, new ListItem("Without Account", ""));
        }

        protected void SelectedAccount()
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
}