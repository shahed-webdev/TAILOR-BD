using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Customer
{
    public partial class Customer_Mesurement_Print : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(Request.QueryString["CustomerID"]) || string.IsNullOrEmpty(Request.QueryString["DressID"]))
            {
                Response.Redirect("CustomerList.aspx");
            }
            if (!this.IsPostBack)
            {
                DataView dv = (DataView)FontSizeSQL.Select(DataSourceSelectArguments.Empty);
                FontSizeDropDownList.SelectedValue = dv.Table.Rows[0]["Print_Font_Size"].ToString();
            }
        }

        protected void SaveFontButton_Click(object sender, EventArgs e)
        {
            FontSizeSQL.Update();
            FontSizeDropDownList.DataBind();
            ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('font size saved successfully!')", true);

        }
    }
}