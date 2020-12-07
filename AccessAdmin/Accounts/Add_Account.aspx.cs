using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Accounts
{
    public partial class Add_Account : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        protected void AddAccountButton_Click(object sender, EventArgs e)
        {
            AccountNameSQL.Insert();
            AccountNameGridView.DataBind();
            ErrLabel.Text = string.Empty;
        }

        protected void DStatusCheckBox_CheckedChanged(object sender, EventArgs e)
        {
            int selRowIndex = ((GridViewRow)(((CheckBox)sender).Parent.Parent)).RowIndex;

            DefaultAccountSQL.UpdateParameters["AccountID"].DefaultValue = AccountNameGridView.DataKeys[selRowIndex % AccountNameGridView.PageSize]["AccountID"].ToString();
            DefaultAccountSQL.Update();
            AccountNameGridView.DataBind();
        }

        protected void AccountNameSQL_Inserted(object sender, SqlDataSourceStatusEventArgs e)
        {
            ErrLabel.Text = e.Command.Parameters["@ERROR"].Value.ToString();
        }
    }
}