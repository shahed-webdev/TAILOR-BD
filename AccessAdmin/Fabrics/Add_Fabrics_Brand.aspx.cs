using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Fabrics
{
    public partial class Add_Fabrics_Brand : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        protected void Fabrics_BrandSQL_Inserted(object sender, SqlDataSourceStatusEventArgs e)
        {
            ErrorLabel.Text = e.Command.Parameters["@ERROR"].Value.ToString();
            Fabrics_BrandGridView.DataBind();
        }

        protected void AddButton_Click(object sender, EventArgs e)
        {
            Fabrics_BrandSQL.Insert();
            Fabrics_BrandTextBox.Text = string.Empty;
        }
    }
}