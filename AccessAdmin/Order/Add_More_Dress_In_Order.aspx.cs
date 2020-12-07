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
    public partial class Add_More_Dress_In_Order : System.Web.UI.Page
    {
        SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ToString());
        protected void Page_Load(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(Request.QueryString["OrderID"]))
            {
                Response.Redirect("OrdrList.aspx");
            }

            if (!this.IsPostBack)
            {
                DataTable ChargeTeble = new DataTable();
                ChargeTeble.Columns.AddRange(new DataColumn[4] { new DataColumn("PriceFor"), new DataColumn("Quantity"), new DataColumn("UnitPrice"), new DataColumn("TotalAmount") });
                ViewState["ChargeTeble"] = ChargeTeble;

                SqlCommand OrderIDcmd = new SqlCommand("SELECT CustomerID FROM [Order] WHERE (OrderID = @OrderID)", con);
                OrderIDcmd.Parameters.AddWithValue("@OrderID", Request.QueryString["OrderID"].ToString());

                con.Open();
                Session["CustomerID"] = OrderIDcmd.ExecuteScalar().ToString();
                con.Close();
            }
        }

        protected void DressDropDownList_SelectedIndexChanged(object sender, EventArgs e)
        {
            Clear_TempTable();

            AddStyleCheckBox.Visible = true;

            StyleGridView.DataBind();
            MeasurementGroupDataList.DataBind();


            if (MeasurementGroupDataList.Items.Count > 0)
            {
                MeasurementGroupDataList.ShowFooter = false;
            }
            else
            {
                MeasurementGroupDataList.ShowFooter = true;
            }

            DataView DetailsDV = new DataView();
            DetailsDV = (DataView)Customer_DressSQL.Select(DataSourceSelectArguments.Empty);
            if (DetailsDV.Count > 0)
            {
                DetailsTextBox.Text = DetailsDV[0]["CDDetails"].ToString();
            }
            else
                DetailsTextBox.Text = "";

            AddStyleCheckBox.Checked = true;

            StyleGridView.Visible = AddStyleCheckBox.Checked;
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
        protected void AddStyleCheckBox_CheckedChanged(object sender, EventArgs e)
        {
            StyleGridView.Visible = AddStyleCheckBox.Checked;
        }


        //Charge Temp Table
        protected void AdchartButton_Click(object sender, EventArgs e)
        {
            double DressQuantity = Convert.ToDouble(QuantityRadioButtonList.SelectedValue);
            double UnitPrice = Convert.ToDouble(AmountTextBox.Text);

            double Amount = (UnitPrice * DressQuantity);
            DataTable ChargeTeble = ViewState["ChargeTeble"] as DataTable;

            ChargeTeble.Rows.Add(PaymentforTextBox.Text, DressQuantity, UnitPrice, Amount);

            ViewState["ChargeTeble"] = ChargeTeble;

            this.BindGrid();

            PaymentforTextBox.Text = string.Empty;
            AmountTextBox.Text = string.Empty;

        }
        protected void BindGrid()
        {
            ChargeGridView.DataSource = ViewState["ChargeTeble"] as DataTable;
            ChargeGridView.DataBind();
        }
        protected void RowDelete(object sender, EventArgs e)
        {
            GridViewRow row = (sender as LinkButton).NamingContainer as GridViewRow;
            DataTable ChargeTeble = ViewState["ChargeTeble"] as DataTable;

            ChargeTeble.Rows.RemoveAt(row.RowIndex);
            ViewState["ChargeTeble"] = ChargeTeble;
            this.BindGrid();
        }
        protected void OnCancel(object sender, EventArgs e)
        {
            ChargeGridView.EditIndex = -1;
            this.BindGrid();
        }
        private void Clear_All()
        {
            DressQuantitykTextBox.Text = "";
            DetailsTextBox.Text = "";

            DressDropDownList.SelectedIndex = -1;
            AddStyleCheckBox.Checked = false;
            PaymentforTextBox.Text = "";
            AmountTextBox.Text = "";
            AddStyleCheckBox.Visible = false;

            DataTable ChargeTeble = ViewState["ChargeTeble"] as DataTable;
            ChargeTeble.Rows.Clear();
            ViewState["ChargeTeble"] = ChargeTeble;
            this.BindGrid();
        }
        private void Clear_TempTable()
        {
            DressQuantitykTextBox.Text = "";
            DetailsTextBox.Text = "";

            PaymentforTextBox.Text = "";
            AmountTextBox.Text = "";

            DataTable ChargeTeble = ViewState["ChargeTeble"] as DataTable;
            ChargeTeble.Rows.Clear();
            ViewState["ChargeTeble"] = ChargeTeble;
            this.BindGrid();
        }

        //Add Charge panel
        protected void ChargeLB_Click(object sender, EventArgs e)
        {
            QuantityRadioButtonList.Items.Clear();
            DNLabel.Text = DressDropDownList.SelectedItem.Text;
            int DressQunt = Convert.ToInt32(DressQuantitykTextBox.Text);
            for (int i = 1; i <= DressQunt; i++)
            {
                QuantityRadioButtonList.Items.Add(new ListItem(i.ToString(), i.ToString()));
            }
            QuantityRadioButtonList.Items.FindByValue(DressQunt.ToString()).Selected = true;
            Mpe.Show();

        }
        protected void CancelLB_Click(object sender, EventArgs e)
        {
            Clear_TempTable();
            Mpe.Hide();
            DressPriceDDList.DataBind();
        }
        protected void AddDressPriceButton_Click(object sender, EventArgs e)
        {
            InputFixedPSQL.Insert();
            DressPriceDDList.DataBind();

            double DressQuantity = Convert.ToDouble(QuantityRadioButtonList.SelectedValue);
            double UnitPrice = Convert.ToDouble(AmountTextBox.Text);

            double Amount = (UnitPrice * DressQuantity);
            DataTable ChargeTeble = ViewState["ChargeTeble"] as DataTable;

            ChargeTeble.Rows.Add(PaymentforTextBox.Text, DressQuantity, UnitPrice, Amount);
            ViewState["ChargeTeble"] = ChargeTeble;
            this.BindGrid();

            PaymentforTextBox.Text = string.Empty;
            AmountTextBox.Text = string.Empty;
        }
        protected void DressPriceDDList_DataBound(object sender, EventArgs e)
        {
            DressPriceDDList.Items.Insert(0, new ListItem("নির্ধারিত মূল্য নির্বাচন করুন", "0"));
        }
        protected void DressPriceDDList_SelectedIndexChanged(object sender, EventArgs e)
        {
            double DressQuantity = Convert.ToDouble(QuantityRadioButtonList.SelectedValue);
            double Amount = Convert.ToDouble(DressPriceDDList.SelectedValue);

            double TotalPrice = (DressQuantity * Amount);
            DataTable ChargeTeble = ViewState["ChargeTeble"] as DataTable;

            ChargeTeble.Rows.Add(DressPriceDDList.SelectedItem.Text, DressQuantity, Amount, TotalPrice);
            ViewState["ChargeTeble"] = ChargeTeble;
            this.BindGrid();

            DressPriceDDList.SelectedIndex = 0;
        }

        //Submit Order
        protected void OrderListSQL_Inserted(object sender, SqlDataSourceStatusEventArgs e)
        {
            ViewState["OrderListID"] = e.Command.Parameters["@OrderListID"].Value.ToString();
        }
        protected void InsertNowButton_Click(object sender, EventArgs e)
        {
            OrderListSQL.Insert();
            foreach (DataListItem Item in MeasurementGroupDataList.Items)
            {
                DataList MesasurmentTypeDataList = (DataList)Item.FindControl("MesasurmentTypeDataList");

                foreach (DataListItem itm in MesasurmentTypeDataList.Items)
                {
                    TextBox MeasurmentTextBox = (TextBox)itm.FindControl("MeasurmentTextBox");

                    if (MeasurmentTextBox.Text != string.Empty)
                    {
                        CustomerMeasurmentSQL.InsertParameters["MeasurementTypeID"].DefaultValue = MesasurmentTypeDataList.DataKeys[itm.ItemIndex].ToString();
                        CustomerMeasurmentSQL.InsertParameters["Measurement"].DefaultValue = MeasurmentTextBox.Text;
                        CustomerMeasurmentSQL.Insert();

                        Ordered_MeasurementSQL.InsertParameters["MeasurementTypeID"].DefaultValue = MesasurmentTypeDataList.DataKeys[itm.ItemIndex].ToString();
                        Ordered_MeasurementSQL.InsertParameters["Measurement"].DefaultValue = MeasurmentTextBox.Text;
                        Ordered_MeasurementSQL.InsertParameters["OrderListID"].DefaultValue = ViewState["OrderListID"].ToString();
                        Ordered_MeasurementSQL.Insert();

                    }
                }
            }

            #region Add style
            if (AddStyleCheckBox.Checked)
            {
                foreach (GridViewRow row in StyleGridView.Rows)
                {
                    DataList StylDataList = (DataList)row.FindControl("StylDataList");

                    foreach (DataListItem itm in StylDataList.Items)
                    {

                        CheckBox StyleCheckBox = (CheckBox)itm.FindControl("StyleCheckBox");
                        TextBox StyleMesureTextBox = (TextBox)itm.FindControl("StyleMesureTextBox");

                        if (StyleCheckBox.Checked)
                        {
                            Ordered_Dress_StyleSQL.InsertParameters["Dress_StyleID"].DefaultValue = StylDataList.DataKeys[itm.ItemIndex].ToString();
                            Ordered_Dress_StyleSQL.InsertParameters["OrderListID"].DefaultValue = ViewState["OrderListID"].ToString();
                            Ordered_Dress_StyleSQL.InsertParameters["DressStyleMesurement"].DefaultValue = StyleMesureTextBox.Text;
                            Ordered_Dress_StyleSQL.Insert();
                        }

                        Customer_Dress_StyleSQL.InsertParameters["Checked"].DefaultValue = StyleCheckBox.Checked.ToString();
                        Customer_Dress_StyleSQL.InsertParameters["Dress_StyleID"].DefaultValue = StylDataList.DataKeys[itm.ItemIndex].ToString();
                        Customer_Dress_StyleSQL.InsertParameters["DressStyleMesurement"].DefaultValue = StyleMesureTextBox.Text;
                        Customer_Dress_StyleSQL.Insert();

                    }
                }
            }

            Customer_DressSQL.Insert();
            #endregion


            #region Add to Charge
            foreach (GridViewRow row in ChargeGridView.Rows)
            {

                if (ChargeGridView.Rows.Count > 0)
                {
                    Label ChargeFor = row.FindControl("CFLabel") as Label;
                    Label QuantityLabel = row.FindControl("QuantityLabel") as Label;
                    Label UnitPriceLabel = row.FindControl("UnitPriceLabel") as Label;
                    Label TotalAmountLabel = row.FindControl("TotalAmountLabel") as Label;

                    Order_PaymentSQL.InsertParameters["Details"].DefaultValue = ChargeFor.Text;
                    Order_PaymentSQL.InsertParameters["Amount"].DefaultValue = TotalAmountLabel.Text;
                    Order_PaymentSQL.InsertParameters["OrderListID"].DefaultValue = ViewState["OrderListID"].ToString();
                    Order_PaymentSQL.InsertParameters["Unit"].DefaultValue = QuantityLabel.Text;
                    Order_PaymentSQL.InsertParameters["UnitPrice"].DefaultValue = UnitPriceLabel.Text;
                    Order_PaymentSQL.Insert();
                }
            }

            Clear_All();
            #endregion

            OrderListGridView.DataBind();
            Mpe.Hide();
        }
        protected void SkipButton_Click(object sender, EventArgs e)
        {
            Response.Redirect("~/AccessAdmin/Order/MoneyReceipt.aspx?" + "OrderID=" + Request.QueryString["OrderID"].ToString());
        }
        protected void OrderListGridView_RowDeleted(object sender, GridViewDeletedEventArgs e)
        {
            if (OrderListGridView.Rows.Count == 1)
            {
                Response.Redirect("OrdrList.aspx");
            }

        }

    }
}