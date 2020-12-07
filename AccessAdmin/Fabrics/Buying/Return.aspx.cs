using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Fabrics.Buying
{
    public partial class Return : System.Web.UI.Page
    {
        SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ToString());
        protected void Page_Load(object sender, EventArgs e)
        {
            if (!this.IsPostBack)
            {
                DataTable ChargeTeble = new DataTable();
                ChargeTeble.Columns.AddRange(new DataColumn[6] { new DataColumn("FabricID"), new DataColumn("Selling_UP"), new DataColumn("FabricCode"), new DataColumn("UnitPrice"), new DataColumn("Quantity"), new DataColumn("TotalPrice") });
                ViewState["ChargeTeble"] = ChargeTeble;
            }
        }
        protected void FindReceiptNoButton_Click(object sender, EventArgs e)
        {
            SelectedAccount();
            ReturnDateTextBox.Text = DateTime.Today.ToString("dd MMMM yyyy");
        }
        /*Add To Cart Button*/
        protected void FabricDropDownList_DataBound(object sender, EventArgs e)
        {
            FabricDropDownList.Items.Insert(0, new ListItem("[ Select Fabric ]", "0"));
            foreach (GridViewRow row in BuyingListGridView.Rows)
            {
                string FabricID = BuyingListGridView.DataKeys[row.DataItemIndex]["FabricID"].ToString();
                FabricDropDownList.Items.Remove(FabricDropDownList.Items.FindByValue(FabricID));
            }
        }
        protected void BindGrid()
        {
            ChargeGridView.DataSource = ViewState["ChargeTeble"] as DataTable;
            ChargeGridView.DataBind();

            FabricDropDownList.DataBind();
            foreach (GridViewRow row in ChargeGridView.Rows)
            {
                Label FabricIDLabel = row.FindControl("FabricIDLabel") as Label;
                FabricDropDownList.Items.Remove(FabricDropDownList.Items.FindByValue(FabricIDLabel.Text));
            }
        }
        protected void RowDelete(object sender, EventArgs e)
        {
            GridViewRow row = (sender as LinkButton).NamingContainer as GridViewRow;
            DataTable ChargeTeble = ViewState["ChargeTeble"] as DataTable;

            ChargeTeble.Rows.RemoveAt(row.RowIndex);
            ViewState["ChargeTeble"] = ChargeTeble;
            this.BindGrid();
        }
        protected void AddToCartButton_Click(object sender, EventArgs e)
        {
            if (FabricDropDownList.SelectedIndex > 0)
            {
                double BuyingUnitPrice = (Convert.ToDouble(TotalPriceTextBox.Text) / Convert.ToDouble(TotalQuantityTextBox.Text));
                if (CSPCheckBox.Checked)
                {
                    if (!string.IsNullOrEmpty(ChangeUPriceTextBox.Text))
                    {
                        if (Convert.ToDouble(ChangeUPriceTextBox.Text) > 0)
                        {
                            bool Teble_row_Check = true;
                            foreach (GridViewRow row in BuyingListGridView.Rows)
                            {
                                string FabricID = BuyingListGridView.DataKeys[row.DataItemIndex]["FabricID"].ToString();

                                if (FabricDropDownList.SelectedValue == FabricID)
                                {
                                    Label StockLabel = row.FindControl("StockLabel") as Label;
                                    Label BuyingQuantityLabel = row.FindControl("BuyingQuantityLabel") as Label;

                                    double Quntity = Convert.ToDouble(TotalQuantityTextBox.Text);
                                    double Pre_Quntity = Convert.ToDouble(BuyingQuantityLabel.Text);
                                    double Stock = Convert.ToDouble(StockLabel.Text);
                                    double Remain = Pre_Quntity - Stock;


                                    if (Remain > 0 && Remain > Quntity)
                                    {
                                        Teble_row_Check = false;
                                    }
                                }
                            }


                            if (Teble_row_Check)
                            {
                                DataTable ChargeTeble = ViewState["ChargeTeble"] as DataTable;
                                ChargeTeble.Rows.Add(FabricDropDownList.SelectedValue, ChangeUPriceTextBox.Text, FabricDropDownList.SelectedItem.Text, BuyingUnitPrice.ToString(), TotalQuantityTextBox.Text, TotalPriceTextBox.Text);
                                ViewState["ChargeTeble"] = ChargeTeble;
                                this.BindGrid();

                                TotalQuantityTextBox.Text = string.Empty;
                                TotalPriceTextBox.Text = string.Empty;
                                ChangeUPriceTextBox.Text = string.Empty;
                                CSPCheckBox.Checked = false;
                            }
                        }
                        else
                        {
                            ScriptManager.RegisterStartupScript(this, GetType(), "showalert", "alert('Selling Unit Price Must be Greater than 0');", true);
                        }
                    }
                    else
                    {
                        ScriptManager.RegisterStartupScript(this, GetType(), "showalert", "alert('Enter Selling Unit Price');", true);
                    }
                }
                else
                {
                    bool Teble_row_Check = true;
                    foreach (GridViewRow row in BuyingListGridView.Rows)
                    {

                        string FabricID = BuyingListGridView.DataKeys[row.DataItemIndex]["FabricID"].ToString();


                        if (FabricDropDownList.SelectedValue == FabricID)
                        {
                            Label StockLabel = row.FindControl("StockLabel") as Label;
                            Label BuyingQuantityLabel = row.FindControl("BuyingQuantityLabel") as Label;

                            double Quntity = Convert.ToDouble(TotalQuantityTextBox.Text);
                            double Pre_Quntity = Convert.ToDouble(BuyingQuantityLabel.Text);
                            double Stock = Convert.ToDouble(StockLabel.Text);
                            double Remain = Pre_Quntity - Stock;

                            if (Remain > 0 && Remain > Quntity)
                            {
                                Teble_row_Check = false;
                            }
                        }
                    }

                    if (Teble_row_Check)
                    {
                        Label SellingUnitPLabel = ((Label)QntFormView.FindControl("SellingUnitPLabel"));
                        DataTable ChargeTeble = ViewState["ChargeTeble"] as DataTable;
                        ChargeTeble.Rows.Add(FabricDropDownList.SelectedValue, SellingUnitPLabel.Text, FabricDropDownList.SelectedItem.Text, BuyingUnitPrice.ToString(), TotalQuantityTextBox.Text, TotalPriceTextBox.Text);
                        ViewState["ChargeTeble"] = ChargeTeble;
                        this.BindGrid();

                        TotalQuantityTextBox.Text = string.Empty;
                        TotalPriceTextBox.Text = string.Empty;
                    }
                }
            }
        }

        /*Keep in Cart Button*/
        protected void ReturnListButton_Click(object sender, EventArgs e)
        {
            foreach (GridViewRow row in BuyingListGridView.Rows)
            {
                bool Teble_row_Check = true;
                string FabricID = BuyingListGridView.DataKeys[row.DataItemIndex]["FabricID"].ToString();

                foreach (GridViewRow Teble_row in ChargeGridView.Rows)
                {
                    Label FabricIDLabel = Teble_row.FindControl("FabricIDLabel") as Label;
                    if (FabricIDLabel.Text == FabricID)
                    {
                        Teble_row_Check = false;
                    }
                }

                if (Teble_row_Check)
                {
                    Label BuyingQuantityLabel = row.FindControl("BuyingQuantityLabel") as Label;
                    TextBox BuyingQuantityTextBox = row.FindControl("BuyingQuantityTextBox") as TextBox;

                    if (!string.IsNullOrEmpty(BuyingQuantityTextBox.Text))
                    {
                        double Quntity = Convert.ToDouble(BuyingQuantityTextBox.Text);
                        double Pre_Quntity = Convert.ToDouble(BuyingQuantityLabel.Text);
                        if (Pre_Quntity >= Quntity && Quntity != 0)
                        {
                            Label FabricCodeLabel = row.FindControl("FabricCodeLabel") as Label;
                            Label BuyingUPLabel = row.FindControl("BuyingUPLabel") as Label;
                            Label SellingUPLabel = row.FindControl("SellingUPLabel") as Label;

                            Label StockLabel = row.FindControl("StockLabel") as Label;
                            double UnitPrice = Convert.ToDouble(BuyingUPLabel.Text);

                            double Stock = Convert.ToDouble(StockLabel.Text);
                            double Return_Quantity = Pre_Quntity - Quntity;

                            if (Return_Quantity <= Stock && Return_Quantity >= 0)
                            {
                                DataTable ChargeTeble = ViewState["ChargeTeble"] as DataTable;
                                ChargeTeble.Rows.Add(FabricID, SellingUPLabel.Text, FabricCodeLabel.Text, BuyingUPLabel.Text, BuyingQuantityTextBox.Text, (UnitPrice * Quntity));
                                ViewState["ChargeTeble"] = ChargeTeble;
                                this.BindGrid();
                            }
                        }
                    }
                }
            }
        }
        protected void BuyingListGridView_RowDataBound(object sender, GridViewRowEventArgs e)
        {
            if (e.Row.RowType == DataControlRowType.DataRow)
            {
                Label StockLabel = e.Row.FindControl("StockLabel") as Label;
                Label BuyingQuantityLabel = e.Row.FindControl("BuyingQuantityLabel") as Label;
                TextBox BuyingQuantityTextBox = e.Row.FindControl("BuyingQuantityTextBox") as TextBox;

                double Quntity = Convert.ToDouble(BuyingQuantityTextBox.Text);
                double Pre_Quntity = Convert.ToDouble(BuyingQuantityLabel.Text);
                double Stock = Convert.ToDouble(StockLabel.Text);
                double Return_Quantity = Pre_Quntity - Quntity;
                if (Stock == 0)
                {
                    e.Row.Enabled = false;
                    BuyingQuantityTextBox.Text = Pre_Quntity.ToString();
                }
                if (Return_Quantity > Stock)
                {
                    BuyingQuantityTextBox.Text = (Return_Quantity - Stock).ToString();
                }
            }
        }

        /*Replacement Button*/
        protected void SelectedAccount()
        {
            SqlCommand AccountCmd = new SqlCommand("Select AccountID from Account where InstitutionID = @InstitutionID AND Default_Status = 'True' AND AccountBalance <> 0", con);
            AccountCmd.Parameters.AddWithValue("@InstitutionID", Request.Cookies["InstitutionID"].Value);
            con.Open();
            object AccountID = AccountCmd.ExecuteScalar();
            con.Close();

            if (AccountID != null)
                AccountDropDownList.SelectedValue = AccountID.ToString();
        }
        protected void AccountDropDownList_DataBound(object sender, EventArgs e)
        {
            AccountDropDownList.Items.Insert(0, new ListItem("Without Account", ""));
        }
        protected void ReplacementButton_Click(object sender, EventArgs e)
        {
            //try
            //{
                bool Stock_Check = true;
                foreach (GridViewRow row in BuyingListGridView.Rows)
                {
                    string FabricID = BuyingListGridView.DataKeys[row.DataItemIndex]["FabricID"].ToString();
                    Label StockLabel = row.FindControl("StockLabel") as Label;
                    Label BuyingQuantityLabel = row.FindControl("BuyingQuantityLabel") as Label;
                    TextBox BuyingQuantityTextBox = row.FindControl("BuyingQuantityTextBox") as TextBox;

                    if (!string.IsNullOrEmpty(BuyingQuantityTextBox.Text))
                    {
                        double Quntity = Convert.ToDouble(BuyingQuantityTextBox.Text);
                        double Pre_Quntity = Convert.ToDouble(BuyingQuantityLabel.Text);
                        double Stock = Convert.ToDouble(StockLabel.Text);
                        double Return_Quantity = Pre_Quntity - Quntity;

                        if (Return_Quantity > Stock && Return_Quantity < 0)
                        {
                            Stock_Check = false;
                        }
                        else
                        {
                            foreach (GridViewRow Teble_row in ChargeGridView.Rows)
                            {
                                Label FabricIDLabel = Teble_row.FindControl("FabricIDLabel") as Label;

                                if (FabricID == FabricIDLabel.Text)
                                {

                                }
                            }
                        }
                    }
                    else
                    {
                        Stock_Check = false;
                    }
                }
                if (Stock_Check)
                {
                    string IDs = "";
                    foreach (GridViewRow Teble_row in ChargeGridView.Rows)
                    {
                        Label FabricIDLabel = Teble_row.FindControl("FabricIDLabel") as Label;
                        Label QntLabel = Teble_row.FindControl("QntLabel") as Label;
                        Label TotalPriceLabel = Teble_row.FindControl("TotalPriceLabel") as Label;

                        Buying_Return_QuantitySQL.InsertParameters["FabricID"].DefaultValue = FabricIDLabel.Text;
                        Buying_Return_QuantitySQL.InsertParameters["FabricBuyingID"].DefaultValue = BuyingFormView.DataKey["FabricBuyingID"].ToString();
                        Buying_Return_QuantitySQL.InsertParameters["Change_Quantity"].DefaultValue = QntLabel.Text;
                        Buying_Return_QuantitySQL.InsertParameters["BuyingPrice"].DefaultValue = TotalPriceLabel.Text;
                        Buying_Return_QuantitySQL.Insert();
                        IDs += FabricIDLabel.Text + ", ";
                    }

                    Return_PriceSQL.InsertParameters["IDs"].DefaultValue = IDs;
                    Return_PriceSQL.InsertParameters["FabricBuyingID"].DefaultValue = BuyingFormView.DataKey["FabricBuyingID"].ToString();
                    Return_PriceSQL.Insert();

                    Response.Redirect("Print_Invoice.aspx?FabricBuyingID=" + BuyingFormView.DataKey["FabricBuyingID"].ToString());

                }
            //}
            //catch { ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('Account Balance Not enough to return')", true); }
        }

        protected void BuyingListGridView_DataBound(object sender, EventArgs e)
        {
            FabricDropDownList.DataBind();
        }

  

    }
}