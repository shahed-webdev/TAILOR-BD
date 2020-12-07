using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Delivery
{
    public partial class Delivered_Works : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        protected void CustomerOrderdDressSQL_Selected(object sender, SqlDataSourceStatusEventArgs e)
        {
            TotalLabel.Text =  e.AffectedRows + " টি অর্ডার ডেলিভারি হয়েছে";
        }
    }
}