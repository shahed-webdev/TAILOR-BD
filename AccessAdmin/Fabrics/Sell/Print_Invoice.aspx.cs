using System;
using System.Configuration;
using System.Data.SqlClient;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Fabrics.Sell
{
    public partial class Print_Invoice : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(Request.QueryString["FabricsSellingID"]))
                Response.Redirect("Fabrics_Selling.aspx");
        }
        protected void Money_Receipt_FormView_ItemUpdated(object sender, FormViewUpdatedEventArgs e)
        {
            Response.Redirect(Request.Url.AbsoluteUri);
        }

        protected void SMSButton_Click(object sender, EventArgs e)
        {

            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ToString());

            var Phone = SellFormView.FindControl("PhoneHf") as HiddenField;
            var Receipt = SellFormView.FindControl("Selling_SNLabel") as Label;
            var Price = SellFormView.FindControl("PriceLabel") as Label;
            var Paid = SellFormView.FindControl("PaidLabel") as Label;
            var Inme = SellFormView.FindControl("INLabel") as Label;

            string PhoneNumber = "";
            bool Is_SMS = false;
            if (PhoneTextBox.Text != "")
            {
                Is_SMS = true;
                PhoneNumber = PhoneTextBox.Text.Trim();
            }
            else
            {
                if (Phone.Value != "")
                {
                    Is_SMS = true;
                    PhoneNumber = Phone.Value;
                }
            }

            if (Is_SMS)
            {
                SMS_Class SMS = new SMS_Class();

                string Msg = "রিসিট নং: " + Receipt.Text + ". মোট: " + Price.Text + " টাকা. পেইড: " + Paid.Text + " টাকা. " + Inme.Text;
                int TotalSMS = SMS.SMS_Conut(Msg);
                int SMSBalance = 0;

                SqlCommand SMScommand = new SqlCommand("SELECT SMS_Balance FROM SMS WHERE (InstitutionID = @InstitutionID)", con);
                SMScommand.Parameters.AddWithValue("@InstitutionID", Request.Cookies["InstitutionID"].Value);

                con.Open();
                SMSBalance = Convert.ToInt32(SMScommand.ExecuteScalar());
                con.Close();

                if (SMSBalance >= TotalSMS)
                {
                    if (SMS.SMS_GetBalance() >= TotalSMS)
                    {
                        Guid SMS_Send_ID = SMS.SMS_Send(PhoneNumber, Msg, "", "Fabric Selling");

                        SMS_OtherInfoSQL.InsertParameters["SMS_Send_ID"].DefaultValue = SMS_Send_ID.ToString();
                        SMS_OtherInfoSQL.InsertParameters["CustomerID"].DefaultValue = "";
                        SMS_OtherInfoSQL.Insert();

                        Response.Redirect("Fabrics_Selling.aspx");
                    }
                    else
                    {
                        ErroLabel.Text = "SMS Service Updating. Try again later or contact to authority";
                    }
                }
                else
                {
                    ErroLabel.Text = "আপনার যথেষ্ট এসএমএস ব্যালেন্স নেই, আপনার বর্তমান ব্যালেন্স " + SMSBalance;
                }
            }
            else
            {
                ErroLabel.Text = "Enter Mobile Number";
            }
        }
    }

}