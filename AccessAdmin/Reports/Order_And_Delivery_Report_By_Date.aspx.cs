using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Reports
{
    public partial class Order_And_Delivery_Report_By_Date : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (!this.IsPostBack)
            {
                FromDateTextBox.Text = DateTime.Today.ToString("d MMMM yyyy");
                ToDateTextBox.Text = DateTime.Today.ToString("d MMMM yyyy");
            }
        }
    }
}