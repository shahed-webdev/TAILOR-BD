using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Order
{
    public partial class Delete_Order : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        protected void ConfirmDeleteButton_Click(object sender, EventArgs e)
        {
            try
            {
                foreach (GridViewRow Row in OrderListGridView.Rows)
                {
                    CheckBox DeleteCheckBox = OrderListGridView.Rows[Row.DataItemIndex % OrderListGridView.PageSize].FindControl("DeleteCheckBox") as CheckBox;
                    if (DeleteCheckBox.Checked)
                    {
                        CustomerOrderdDressSQL.DeleteParameters["OrderID"].DefaultValue = OrderListGridView.DataKeys[Row.DataItemIndex % OrderListGridView.PageSize]["OrderID"].ToString();
                        CustomerOrderdDressSQL.Delete();
                    }

                }

                ScriptManager.RegisterStartupScript(this, GetType(), "Msg", "Success();", true);
            }
            catch
            {
                ScriptManager.RegisterStartupScript(this, GetType(), "Msg", "Error();", true);
            }
        }

        protected void OrderListGridView_RowDataBound(object sender, GridViewRowEventArgs e)
        {
            if (e.Row.RowType == DataControlRowType.DataRow)
            {
                if (OrderListGridView.DataKeys[e.Row.RowIndex]["DeliveryStatus"].ToString() == "Pending")
                {
                    e.Row.CssClass = "Pending";
                }

                if (OrderListGridView.DataKeys[e.Row.RowIndex]["DeliveryStatus"].ToString() == "PartlyDelivered")
                {
                    e.Row.CssClass = "PartlyDelivered";
                }
                if (OrderListGridView.DataKeys[e.Row.RowIndex]["DeliveryStatus"].ToString() == "Delivered")
                {
                    e.Row.CssClass = "Delivered";
                }
            }
        }
    }
}