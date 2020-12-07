using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Accounts
{
    public partial class Add_Expanse : System.Web.UI.Page
    {
        SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ToString());
        protected void Page_Load(object sender, EventArgs e)
        {
            if (!this.IsPostBack)
            {
                ExpnseReorder();
                SelectedAccount();
            }
        }
        protected void SubmitButton_Click(object sender, EventArgs e)
        {
            if (Account_Balance())
            {
                CheckBalanceLabel.Text = "";
                ExpanseSQL.Insert();
                AmountTextBox.Text = string.Empty;
                ExpaneForTextBox.Text = string.Empty;

                ExpanseGridView.DataBind();
                ExpnseReorder();

                AccountDropDownList.DataBind();
                SelectedAccount();

                ScriptManager.RegisterStartupScript(this, GetType(), "Msg", "Success();", true);
            }
            else { CheckBalanceLabel.Text = "Expense Amount More Than Account Balance"; }
        }
        protected void NewCategoryButton_Click(object sender, EventArgs e)
        {
            CategoryNameSQL.Insert();
            CategoryNameTextBox.Text = string.Empty;
        }  
        protected void CategoryNameGridView_RowDeleted(object sender, GridViewDeletedEventArgs e)
        {
            if (e.Exception == null)
            {
                ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('সফল ভাবে ডিলেট করতে পেরেছেন !')", true);
            }
            else
            {
                ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('আপনি এটি ডিলেট করতে পারবেন না । কারণ তা ব্যবহার হয়েছে !')", true);
                e.ExceptionHandled = true;
            }
        }
        protected void FindButton_Click(object sender, EventArgs e)
        {
            ExpnseReorder();
        }
        protected void AccountDropDownList_DataBound(object sender, EventArgs e)
        {
            AccountDropDownList.Items.Insert(0, new ListItem("Without Account", ""));
        }      
        protected void ExpnseReorder()
        {
            DataView dv = (DataView)ViewExpanseSQL.Select(DataSourceSelectArguments.Empty);
            double reorderedProducts = (double)dv.Table.Rows[0][0];
            if (reorderedProducts > 0)
            {
                ExpnseLabel.Text = "সর্বমোট খরচ: " + reorderedProducts + " টাকা";
            }
            else
            {
                ExpnseLabel.Text = "কোন খরচ হয়নি.";
            }
        }
        protected void SelectedAccount()
        {
            SqlCommand AccountCmd = new SqlCommand("Select AccountID from Account where InstitutionID = @InstitutionID AND Default_Status = 'True' AND AccountBalance <> 0", con);
            AccountCmd.Parameters.AddWithValue("@InstitutionID", Request.Cookies["InstitutionID"].Value);
            con.Open();
            object AccountID = AccountCmd.ExecuteScalar();
            con.Close();

            if (AccountID != null)
                AccountDropDownList.SelectedValue = AccountID.ToString();
        }
        private bool Account_Balance()
        {
            SqlCommand AccountBalance_Cmd = new SqlCommand("Select AccountBalance from Account where InstitutionID = @InstitutionID AND AccountID = @AccountID", con);
            AccountBalance_Cmd.Parameters.AddWithValue("@InstitutionID", Request.Cookies["InstitutionID"].Value);
            AccountBalance_Cmd.Parameters.AddWithValue("@AccountID", AccountDropDownList.SelectedValue);
            con.Open();
            object AccountBalance = AccountBalance_Cmd.ExecuteScalar();
            con.Close();

            if (AccountBalance != null)
            {
                double Paid_Amount = Convert.ToDouble(AmountTextBox.Text.Trim());
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