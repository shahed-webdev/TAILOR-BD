using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Dress
{
    public partial class AdMoreMeasurement : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(Request.QueryString["Measurement_GroupID"]) || string.IsNullOrEmpty(Request.QueryString["DressID"]))
            {
                Response.Redirect("Measurement_Type_Add.aspx");
            }
        }

        protected void AddButton_Click(object sender, EventArgs e)
        {
            MeasurementTypeSQL.Insert();

            AscendingTextBox.Text = string.Empty;
            MeasurementTypeTextBox.Text = string.Empty;
            ScriptManager.RegisterStartupScript(this, GetType(), "Msg", "Success();", true);
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

        protected void SubmitButton_Click(object sender, EventArgs e)
        {
            OldMeasurementSQL.Update();
            OldMeasurmentDropDownList.DataBind();
            MeasurementTYPEGridView.DataBind();
        }

        protected void MeasurementTYPEGridView_RowDeleted(object sender, GridViewDeletedEventArgs e)
        {
            OldMeasurmentDropDownList.DataBind();
        }

        protected void PrevPageLinkButton_Click(object sender, EventArgs e)
        {
            Response.Redirect("Measurement_Type_Add.aspx?dressid=" + Request.QueryString["dressid"] + "&For=" + Request.QueryString["For"]);
        }


    }
}