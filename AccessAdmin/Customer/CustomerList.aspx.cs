using System;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Customer
{
    public partial class CustomerList : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }


        protected void CustomerListSQL_Selected(object sender, SqlDataSourceStatusEventArgs e)
        {
            TotalLabel.Text = "সর্বমোট : " + e.AffectedRows + " জন কাস্টমার";
        }

        protected void CustomerListGridView_RowDeleted(object sender, GridViewDeletedEventArgs e)
        {
            if (e.Exception != null)
            {
                ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('আপনি এই কাস্টমারকে ডিলেট করতে পারবেন না !')", true);
                e.ExceptionHandled = true;
            }
        }

    }
}