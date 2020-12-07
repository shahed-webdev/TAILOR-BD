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
    public partial class Others_Income : System.Web.UI.Page
    {
        SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ToString());
        protected void Page_Load(object sender, EventArgs e)
        {
            if (!Page.IsPostBack)
            {
                Amount();

                SqlCommand AccountCmd = new SqlCommand("Select AccountID from Account where InstitutionID = @InstitutionID AND Default_Status = 'True'", con);
                AccountCmd.Parameters.AddWithValue("@InstitutionID", Request.Cookies["InstitutionID"].Value);
                con.Open();
                object AccountID = AccountCmd.ExecuteScalar();
                con.Close();

                if (AccountID != null)
                    AccountDropDownList.SelectedValue = AccountID.ToString();
            }
            
        }

        protected void SaveButton_Click(object sender, EventArgs e)
        {
            NewCategorySQL.Insert();
            NewCategoryNameTextBox.Text = string.Empty;
            AllCategory.DataBind();
            CategoryDropDownList.DataBind();
        }

        protected void SubmitButton_Click(object sender, EventArgs e)
        {
            ExtraIncomeSQL.Insert();
            ExtraIncomeGridView.DataBind();
            Amount();
            AmountTextBox.Text = string.Empty;
            IncomeForTextBox.Text = string.Empty;

            ScriptManager.RegisterStartupScript(this, GetType(), "Msg", "Success();", true);
        }

        protected void Amount()
        {
            DataView dv = (DataView)ViewIncomeSQL.Select(DataSourceSelectArguments.Empty);
            double reorderedProducts = (double)dv.Table.Rows[0][0];
            if (reorderedProducts > 0)
            {
                AmountLabel.Text = "সর্বমোট : " + reorderedProducts + " টাকা";
            }
            else
            {
                AmountLabel.Text = "কোন আয় যুক্ত হয়নি";
            }
        }

        protected void FindButton_Click(object sender, EventArgs e)
        {
            Amount();
            ExtraIncomeGridView.DataBind();
        }

        protected void CategoryDropDownList_DataBound(object sender, EventArgs e)
        {
            CategoryDropDownList.Items.Insert(0, new ListItem("[আয়ের ধরণ নির্বাচন করুন ]", "0"));
        }

        protected void AccountDropDownList_DataBound(object sender, EventArgs e)
        {
            AccountDropDownList.Items.Insert(0, new ListItem("Without Account", ""));
        }
       
    }
}