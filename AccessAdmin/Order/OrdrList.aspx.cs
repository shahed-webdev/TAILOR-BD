using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Order
{
    public partial class OrdrList : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }


        protected void CustomerOrderdDressSQL_Selected(object sender, SqlDataSourceStatusEventArgs e)
        {
            TotalLabel.Text = "সর্বমোট অর্ডার: " + " " + e.AffectedRows + " টি";
        }

        protected void CustomerOrderdDressGridView_RowDataBound(object sender, GridViewRowEventArgs e)
        {
            if (e.Row.RowType == DataControlRowType.DataRow)
            {
                DateTime OrderDate = Convert.ToDateTime(CustomerOrderdDressGridView.DataKeys[e.Row.DataItemIndex % CustomerOrderdDressGridView.PageSize]["OrderDate"].ToString());

                if (OrderDate == DateTime.Today)
                {
                    e.Row.CssClass = "Today";
                }
            }
            
        }
    }
}