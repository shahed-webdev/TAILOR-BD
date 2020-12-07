using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Fabrics
{
    public partial class Add_Fabrics_Category : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        protected void AddButton_Click(object sender, EventArgs e)
        {

            Fabrics_CategorySQL.Insert();
            Fabrics_CategoryTextBox.Text = string.Empty;
        }

        protected void Fabrics_CategorySQL_Inserted(object sender, SqlDataSourceStatusEventArgs e)
        {
            ErrorLabel.Text = e.Command.Parameters["@ERROR"].Value.ToString();
            Fabrics_CategoryGridView.DataBind();
        }

    }
}