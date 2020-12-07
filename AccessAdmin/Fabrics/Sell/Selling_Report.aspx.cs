using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Fabrics.Sell
{
    public partial class Selling_Report : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (!this.IsPostBack)
            {
                DateTime date = DateTime.Now;
                var firstDayOfMonth = new DateTime(date.Year, date.Month, 1);

                FromDateTextBox.Text = firstDayOfMonth.ToString("d MMM yyyy");
                ToDateTextBox.Text = DateTime.Now.ToString("d MMM yyyy");
            }
        }
    }
}