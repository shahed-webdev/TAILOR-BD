using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Fabrics
{
    public partial class Add_Mesurement_Unit : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        protected void AddButton_Click(object sender, EventArgs e)
        {

            Mesurement_UnitSQL.Insert();
            Mesurement_UnitTextBox.Text = string.Empty;
        }

        protected void Mesurement_UnitSQL_Inserted(object sender, SqlDataSourceStatusEventArgs e)
        {
            ErrorLabel.Text = e.Command.Parameters["@ERROR"].Value.ToString();
            Mesurement_UnitGridView.DataBind();
        }
    }
}