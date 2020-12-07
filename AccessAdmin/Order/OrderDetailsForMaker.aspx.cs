using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Order
{
    public partial class OrderDetailsForMaker : System.Web.UI.Page
    {
        SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ToString());
        protected void Page_Load(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(Request.QueryString["OrderID"]))
            {
                Response.Redirect("OrdrList.aspx");
            }
        }

        protected void OrderListGridView_SelectedIndexChanged(object sender, EventArgs e)
        {
            
            DataView DetailsDV = new DataView();
            DetailsDV = (DataView)Customer_DressSQL.Select(DataSourceSelectArguments.Empty);
            if (DetailsDV.Count > 0)
            {
                DetailsTextBox.Text = DetailsDV[0]["Details"].ToString();
                DressQuantityTextBox.Text = DetailsDV[0]["DressQuantity"].ToString();
            }
            else
            {
                DetailsTextBox.Text = "";
                DressQuantityTextBox.Text = "";
            }
        }

        protected void UpdateButton_Click(object sender, EventArgs e)
        {
            bool msg = false;
            #region Add Mesasurment
            foreach (DataListItem G_Item in MeasurementGroupDataList.Items)
            {
                DataList MesasurmentTypeDataList = (DataList)G_Item.FindControl("MesasurmentTypeDataList");

                foreach (DataListItem Item in MesasurmentTypeDataList.Items)
                {
                    TextBox MeasurmentTextBox = Item.FindControl("MeasurmentTextBox") as TextBox;
                    HiddenField MTIDHiddenField = Item.FindControl("MTIDHiddenField") as HiddenField;

                    CustomerMeasurmentSQL.InsertParameters["MeasurementTypeID"].DefaultValue = MTIDHiddenField.Value;
                    CustomerMeasurmentSQL.InsertParameters["Measurement"].DefaultValue = MeasurmentTextBox.Text;
                    CustomerMeasurmentSQL.Insert();

                    Ordered_MeasurementSQL.UpdateParameters["Measurement"].DefaultValue = MeasurmentTextBox.Text;
                    Ordered_MeasurementSQL.UpdateParameters["MeasurementTypeID"].DefaultValue = MTIDHiddenField.Value;
                    Ordered_MeasurementSQL.Update();
                    msg = true;
                }
            }
            #endregion

            #region Add style
            foreach (GridViewRow row in StyleGridView.Rows)
            {
                DataList StylDataList = (DataList)row.FindControl("StylDataList");

                foreach (DataListItem itm in StylDataList.Items)
                {
                    CheckBox StyleCheckBox = (CheckBox)itm.FindControl("StyleCheckBox");
                    TextBox StyleMesureTextBox = (TextBox)itm.FindControl("StyleMesureTextBox");
                    HiddenField DSIDHiddenField = itm.FindControl("DSIDHiddenField") as HiddenField;

                    Ordered_Dress_StyleSQL.UpdateParameters["Checked"].DefaultValue = StyleCheckBox.Checked.ToString();
                    Ordered_Dress_StyleSQL.UpdateParameters["Dress_StyleID"].DefaultValue = DSIDHiddenField.Value;
                    Ordered_Dress_StyleSQL.UpdateParameters["DressStyleMesurement"].DefaultValue = StyleMesureTextBox.Text;
                    Ordered_Dress_StyleSQL.Update();

                    Customer_Dress_StyleSQL.InsertParameters["Checked"].DefaultValue = StyleCheckBox.Checked.ToString();
                    Customer_Dress_StyleSQL.InsertParameters["Dress_StyleID"].DefaultValue = DSIDHiddenField.Value;
                    Customer_Dress_StyleSQL.InsertParameters["DressStyleMesurement"].DefaultValue = StyleMesureTextBox.Text;
                    Customer_Dress_StyleSQL.Insert();
                    msg = true;
                }
            }

            Customer_DressSQL.Insert();
            Customer_DressSQL.Update();

            #endregion

            if (msg)
            {
                ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('Successfully Changed')", true);
                StyleGridView.DataBind();
            }
        }

        protected void NextButton_Click(object sender, EventArgs e)
        {
            Response.Redirect("~/AccessAdmin/Order/MoneyReceipt.aspx?" + "OrderID=" + Request.QueryString["OrderID"]);
        }

        protected void PriceGridView_RowDeleted(object sender, GridViewDeletedEventArgs e)
        {
            if (e.Exception == null)
            {

                ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('Successfully Deleted')", true);
            }
            else
            {
                ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('Iteam not delete. already used ')", true);   
                e.ExceptionHandled = true;
            }
        }

        protected void StylDataList_ItemDataBound(object sender, DataListItemEventArgs e)
        {
            CheckBox StyleCheckBox = e.Item.FindControl("StyleCheckBox") as CheckBox;
            Panel AddClass = e.Item.FindControl("AddClass") as Panel;

            if (StyleCheckBox.Checked)
                AddClass.CssClass = "Color";
            else
                AddClass.CssClass = "Style_Input";
        }

    }
}