using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Reports
{
    public partial class Order_Report : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        protected void ShowButton_Click(object sender, EventArgs e)
        {
            ReportViewer1.LocalReport.Refresh();
        }
    }
}