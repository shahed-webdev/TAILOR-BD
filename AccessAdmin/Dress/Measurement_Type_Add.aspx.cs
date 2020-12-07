using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Dress
{
    public partial class Measurement_Type : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(Request.QueryString["dressid"]) || string.IsNullOrEmpty(Request.QueryString["For"]))
            {
                Response.Redirect("Dress_Add.aspx");
            }
        }

        protected void AddButton_Click(object sender, EventArgs e)
        {
            MeasurementTypeSQL.Insert();

            AscendingTextBox.Text = string.Empty;
            MeasurementTypeTextBox.Text = string.Empty;
        }

        protected void UpdateButton_Click(object sender, EventArgs e)
        {
            bool msg = false;
            foreach (GridViewRow row in MeasurementTYPEGridView.Rows)
            {
                TextBox AscendingTextBox = row.FindControl("AscendingTextBox") as TextBox;

                if (!string.IsNullOrEmpty(AscendingTextBox.Text))
                {
                    UpdtAsendingSQL.UpdateParameters["MeasurementTypeID"].DefaultValue = MeasurementTYPEGridView.DataKeys[row.DataItemIndex]["MeasurementTypeID"].ToString();
                    UpdtAsendingSQL.UpdateParameters["InstitutionID"].DefaultValue = Request.Cookies["InstitutionID"].Value;
                    UpdtAsendingSQL.UpdateParameters["Ascending"].DefaultValue = AscendingTextBox.Text;

                    UpdtAsendingSQL.Update();
                    msg = true;
                }
            }

            if (msg)
            {
                MeasurementTYPEGridView.DataBind();
                ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('Successfully Updated !')", true);
            }
        }

        protected void MeasurementTYPEGridView_RowDeleted(object sender, GridViewDeletedEventArgs e)
        {
            if (e.Exception == null)
            {

                ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('আপনি মাপের ধরণ টি সফল ভাবে ডিলেট করতে পেরেছেন !')", true);
            }
            else
            {
                ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('আপনি এই মাপের ধরণ টি ডিলেট করতে পারবেন না । কারণ তা ব্যবহার হয়েছে !')", true);
                e.ExceptionHandled = true;
            }
        }

    }
}
    
