using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Accounts
{
    public partial class Deposit_Withdraw : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(Request.QueryString["AccountID"]))
            {
                Response.Redirect("Add_Account.aspx");
            }
        }
        protected void DepositButton_Click(object sender, EventArgs e)
        {
            try
            {
                DELabel.Text = "";
                DepositSQL.Insert();
                ABFormView.DataBind();
                AccountIN_AmountTextBox.Text = string.Empty;
                IN_DetailsTextBox.Text = string.Empty;
            }
            catch { DELabel.Text = "Something Went Wrong!"; }
        }
        protected void WithdrawButton_Click(object sender, EventArgs e)
        {
            if(Account_Balance())
            {
                WELabel.Text = "";
                WithdrawSQL.Insert();
                ABFormView.DataBind();
                AccountOUT_AmountTextBox.Text = string.Empty;
                Out_DetailsTextBox.Text = string.Empty;
            }
            else { WELabel.Text = "Withdraw Amount Greater Than Current Balance"; }
        }

        private bool Account_Balance()
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ToString());
            SqlCommand AccountBalance_Cmd = new SqlCommand("Select AccountBalance from Account where InstitutionID = @InstitutionID AND AccountID = @AccountID", con);
            AccountBalance_Cmd.Parameters.AddWithValue("@InstitutionID", Request.Cookies["InstitutionID"].Value);
            AccountBalance_Cmd.Parameters.AddWithValue("@AccountID", Request.QueryString["AccountID"]);
            con.Open();
            object AccountBalance = AccountBalance_Cmd.ExecuteScalar();
            con.Close();

            if (AccountBalance != null)
            {
                double Paid_Amount = Convert.ToDouble(AccountOUT_AmountTextBox.Text.Trim());
                double Balance = Convert.ToDouble(AccountBalance);

                if (Paid_Amount > Balance)
                {
                    return false;
                }
                else
                {
                    return true;
                }
            }
            else
            {
                return true;
            }
        }
    }
}