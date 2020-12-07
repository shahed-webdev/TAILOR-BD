using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Fabrics.Sell
{
    public partial class Return : System.Web.UI.Page
    {
        SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ToString());
        protected void Page_Load(object sender, EventArgs e)
        {
            if (!this.IsPostBack)
            {
                DataTable ChargeTeble = new DataTable();
                ChargeTeble.Columns.AddRange(new DataColumn[5] { new DataColumn("FabricID"), new DataColumn("FabricCode"), new DataColumn("UnitPrice"), new DataColumn("Quantity"), new DataColumn("TotalPrice") });
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

        }
        protected void BindGrid()
        {
            ChargeGridView.DataSource = ViewState["ChargeTeble"] as DataTable;
            ChargeGridView.DataBind();

            FabricDropDownList.DataBind();
            NewQuantityTextBox.Text = string.Empty;

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
                Label SellingUnitPLabel = ((Label)QntFormView.FindControl("SellingUnitPLabel"));
                double UnitPrice = Convert.ToDouble(SellingUnitPLabel.Text);
                double Quntity = Convert.ToDouble(NewQuantityTextBox.Text);

                DataTable ChargeTeble = ViewState["ChargeTeble"] as DataTable;
                ChargeTeble.Rows.Add(FabricDropDownList.SelectedValue, FabricDropDownList.SelectedItem.Text, SellingUnitPLabel.Text, NewQuantityTextBox.Text, (UnitPrice * Quntity));
                ViewState["ChargeTeble"] = ChargeTeble;
                this.BindGrid();
            }
        }

        /*Keep in Cart Button*/
        protected void ReturnListButton_Click(object sender, EventArgs e)
        {

            foreach (GridViewRow row in SellingListGridView.Rows)
            {
                bool Teble_row_Check = true;
                string FabricID = SellingListGridView.DataKeys[row.DataItemIndex]["FabricID"].ToString();

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
                    Label SelQuantityLabel = row.FindControl("SelQuantityLabel") as Label;
                    TextBox SellQuantityTextBox = row.FindControl("SellQuantityTextBox") as TextBox;

                    if (!string.IsNullOrEmpty(SellQuantityTextBox.Text))
                    {
                        double Quntity = Convert.ToDouble(SellQuantityTextBox.Text);
                        double Pre_Quntity = Convert.ToDouble(SelQuantityLabel.Text);
                        if (Pre_Quntity >= Quntity && Quntity != 0)
                        {
                            Label FabricCodeLabel = row.FindControl("FabricCodeLabel") as Label;
                            Label SellingUPLabel = row.FindControl("SellingUPLabel") as Label;
                            double UnitPrice = Convert.ToDouble(SellingUPLabel.Text);

                            DataTable ChargeTeble = ViewState["ChargeTeble"] as DataTable;
                            ChargeTeble.Rows.Add(FabricID, FabricCodeLabel.Text, SellingUPLabel.Text, SellQuantityTextBox.Text, (UnitPrice * Quntity));
                            ViewState["ChargeTeble"] = ChargeTeble;
                            this.BindGrid();
                            row.BackColor = System.Drawing.Color.Gray;
                        }
                        else { row.BackColor = System.Drawing.Color.Red; }
                    }
                    else { row.BackColor = System.Drawing.Color.Red; }
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
            try
            {
                string IDs = "";
                foreach (GridViewRow Teble_row in ChargeGridView.Rows)
                {
                    Label FabricIDLabel = Teble_row.FindControl("FabricIDLabel") as Label;
                    Label QntLabel = Teble_row.FindControl("QntLabel") as Label;
                    Label Selling_UPLabel = Teble_row.FindControl("Selling_UPLabel") as Label;

                    Selling_Return_QuantitySQL.InsertParameters["FabricID"].DefaultValue = FabricIDLabel.Text;
                    Selling_Return_QuantitySQL.InsertParameters["FabricsSellingID"].DefaultValue = SellFormView.DataKey["FabricsSellingID"].ToString();
                    Selling_Return_QuantitySQL.InsertParameters["Change_Quantity"].DefaultValue = QntLabel.Text;
                    Selling_Return_QuantitySQL.InsertParameters["SellingUnitPrice"].DefaultValue = Selling_UPLabel.Text;
                    Selling_Return_QuantitySQL.Insert();
                    IDs += FabricIDLabel.Text + ", ";
                }

                Return_PriceSQL.InsertParameters["IDs"].DefaultValue = IDs;
                Return_PriceSQL.InsertParameters["FabricsSellingID"].DefaultValue = SellFormView.DataKey["FabricsSellingID"].ToString();
                Return_PriceSQL.Insert();


                Response.Redirect("Print_Invoice.aspx?FabricsSellingID=" + SellFormView.DataKey["FabricsSellingID"].ToString());
            }
            catch { ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('Account Balance Not enough to return')", true); }
        }
    }
}