using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Dress
{
    public partial class Add_Dress_Style_Category : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(Request.QueryString["dressid"]))
            {
                Response.Redirect("Dress_Add.aspx");
            }
        }

        protected void AssignButton_Click(object sender, EventArgs e)
        {
            Add_Style_Design_CatagorySQL.Insert();

            Style_Design_Catagory_NameTextBox.Text = string.Empty;
            SerialNoTextBox.Text = string.Empty;
        }

        protected void UpdateSerialButton_Click(object sender, EventArgs e)
        {
            bool msg = false;
            foreach (GridViewRow row in DSCGridView.Rows)
            {
                TextBox CategorySerialTextBox = row.FindControl("CategorySerialTextBox") as TextBox;

                if (!string.IsNullOrEmpty(CategorySerialTextBox.Text))
                {
                    UpdateSerialSQL.UpdateParameters["Dress_Style_CategoryID"].DefaultValue = DSCGridView.DataKeys[row.DataItemIndex]["Dress_Style_CategoryID"].ToString();
                    UpdateSerialSQL.UpdateParameters["CategorySerial"].DefaultValue = CategorySerialTextBox.Text;

                    UpdateSerialSQL.Update();
                    msg = true;
                }
            }
            if (msg)
            {
                DSCGridView.DataBind();
                ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('Successfully Updated !')", true);
            }
        }

        protected void DSCGridView_RowDeleted(object sender, GridViewDeletedEventArgs e)
        {
            if (e.Exception == null)
            {
                ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('আপনি এই ক্যাটাগরির টি সফল ভাবে ডিলেট করতে পেরেছেন !')", true);
            }
            else
            {
                ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('আপনি এই ক্যাটাগরির টি ডিলেট করতে পারবেন না !!, কারণ তা ব্যবহার হয়েছে !')", true);
                e.ExceptionHandled = true;
            }
        }


    }
}