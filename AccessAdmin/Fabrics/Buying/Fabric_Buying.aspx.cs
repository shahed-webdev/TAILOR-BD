using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Web;
using System.Web.Services;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Fabrics.Buying
{
    public partial class Fabric_Buying : System.Web.UI.Page
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
        protected void OldNewRadioButtonList_SelectedIndexChanged(object sender, EventArgs e)
        {
            if (OldNewRadioButtonList.SelectedIndex == 0)
            {
                NewPanel.Visible = true;
                OldPanel.Visible = false;
            }
            if (OldNewRadioButtonList.SelectedIndex == 1)
            {
                NewPanel.Visible = false;
                OldPanel.Visible = true;
            }
        }
        protected void AccountDropDownList_DataBound(object sender, EventArgs e)
        {
            AccountDropDownList.Items.Insert(0, new ListItem("Without Account", ""));
        }

        /*Add new Fabric*/
        protected void Mesurement_UnitDropDownList_DataBound(object sender, EventArgs e)
        {
            Mesurement_UnitDropDownList.Items.Insert(0, new ListItem("[ SELECT ]", "0"));
        }
        protected void FabricsCategoryDropDownList_DataBound(object sender, EventArgs e)
        {
            FabricsCategoryDropDownList.Items.Insert(0, new ListItem("[ Category ]", "0"));
        }
        protected void FabricsBrandDropDownList_DataBound(object sender, EventArgs e)
        {
            FabricsBrandDropDownList.Items.Insert(0, new ListItem("[ Brand ]", "0"));
        }
        protected void InserFabricSQL_Inserted(object sender, SqlDataSourceStatusEventArgs e)
        {
            ErrorLabel.Text = e.Command.Parameters["@ERROR"].Value.ToString();
            ViewState["FabricID"] = e.Command.Parameters["@FabricID"].Value.ToString();
        }

        /*Add To Cart Button*/

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
            ErrorLabel.Text = "";
        }
        protected void AddToCartButton_Click(object sender, EventArgs e)
        {
            CheckBalanceLabel.Text = "";
            ErrorLabel.Text = "";
            if (OldNewRadioButtonList.SelectedIndex == 0)
            {

                double BuyingUnitPrice = (Convert.ToDouble(QPriceTextBox.Text) / Convert.ToDouble(QuantityTextBox.Text));

                InserFabricSQL.InsertParameters["CurrentBuyingUnitPrice"].DefaultValue = BuyingUnitPrice.ToString();
                InserFabricSQL.Insert();

                bool FabricID_Check = true;

                foreach (GridViewRow row in ChargeGridView.Rows)
                {
                    Label FabricIDLabel = row.FindControl("FabricIDLabel") as Label;
                    if (ViewState["FabricID"].ToString() == FabricIDLabel.Text)
                    {
                        FabricID_Check = false;
                    }
                }

                if (FabricID_Check)
                {
                    DataTable ChargeTeble = ViewState["ChargeTeble"] as DataTable;
                    ChargeTeble.Rows.Add(ViewState["FabricID"], FabricSUPTextBox.Text, FabricCodeTextBox.Text, BuyingUnitPrice.ToString(), QuantityTextBox.Text, QPriceTextBox.Text);
                    ViewState["ChargeTeble"] = ChargeTeble;
                    this.BindGrid();
                }
                else
                {
                    ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('This Fabric Already Added')", true);
                }

                //FabricCodeTextBox.Text = string.Empty;
                QuantityTextBox.Text = string.Empty;
                QPriceTextBox.Text = string.Empty;
                FabricSUPTextBox.Text = string.Empty;
                FabBuyingUnitPrice_TB.Text = string.Empty;
            }

            if (OldNewRadioButtonList.SelectedIndex == 1)
            {
                if (FabricIDHF.Value != "")
                {
                    double BuyingUnitPrice = (Convert.ToDouble(QPriceTextBox.Text) / Convert.ToDouble(QuantityTextBox.Text));
                    if (CSPCheckBox.Checked)
                    {
                        if (!string.IsNullOrEmpty(ChangeUPriceTextBox.Text))
                        {
                            if (Convert.ToDouble(ChangeUPriceTextBox.Text) > 0)
                            {
                                bool Added_Check = true;
                                foreach (GridViewRow row in ChargeGridView.Rows)
                                {
                                    Label FabricIDLabel = row.FindControl("FabricIDLabel") as Label;

                                    if (FabricIDLabel.Text == FabricIDHF.Value)
                                    {
                                        Added_Check = false;
                                    }
                                }

                                if (Added_Check)
                                {
                                    DataTable ChargeTeble = ViewState["ChargeTeble"] as DataTable;
                                    ChargeTeble.Rows.Add(FabricIDHF.Value, ChangeUPriceTextBox.Text, OldFabric_CodeTextBox.Text, BuyingUnitPrice.ToString(), QuantityTextBox.Text, QPriceTextBox.Text);
                                    ViewState["ChargeTeble"] = ChargeTeble;
                                    this.BindGrid();

                                    QuantityTextBox.Text = string.Empty;
                                    QPriceTextBox.Text = string.Empty;
                                    ChangeUPriceTextBox.Text = string.Empty;
                                    CSPCheckBox.Checked = false;
                                    OldFabric_CodeTextBox.Text = string.Empty;
                                    FabricIDHF.Value = "";

                                }
                                else
                                {
                                    FabricIDHF.Value = "";
                                    ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('This Fabric Already Added')", true);
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
                        bool Added_Check = true;
                        foreach (GridViewRow row in ChargeGridView.Rows)
                        {
                            Label FabricIDLabel = row.FindControl("FabricIDLabel") as Label;

                            if (FabricIDLabel.Text == FabricIDHF.Value)
                            {
                                Added_Check = false;
                            }
                        }

                        if (Added_Check)
                        {
                            DataTable ChargeTeble = ViewState["ChargeTeble"] as DataTable;
                            ChargeTeble.Rows.Add(FabricIDHF.Value, SellingUP_HF.Value, OldFabric_CodeTextBox.Text, BuyingUnitPrice.ToString(), QuantityTextBox.Text, QPriceTextBox.Text);
                            ViewState["ChargeTeble"] = ChargeTeble;
                            this.BindGrid();

                            QuantityTextBox.Text = string.Empty;
                            QPriceTextBox.Text = string.Empty;
                            OldFabric_CodeTextBox.Text = string.Empty;
                            FabricIDHF.Value = "";
                        }

                        else
                        {
                            FabricIDHF.Value = "";
                            ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('This Fabric Already Added')", true);
                        }
                    }
                }
                else
                {
                    QuantityTextBox.Text = string.Empty;
                    QPriceTextBox.Text = string.Empty;
                    OldFabric_CodeTextBox.Text = string.Empty;
                }

                SelectedAccount();
                BuyingDateTextBox.Text = DateTime.Today.ToString("dd MMMM yyyy");
            }
        }

        /*Submition Button*/
        protected void Fabric_BuyingSQL_Inserted(object sender, SqlDataSourceStatusEventArgs e)
        {
            ViewState["FabricBuyingID"] = e.Command.Parameters["@FabricBuyingID"].Value.ToString();
        }
        protected void SubmitButton_Click(object sender, EventArgs e)
        {
            if (Account_Balance(SubTotalHF.Value))
            {
                CheckBalanceLabel.Text = "";
                Fabric_BuyingSQL.Insert();

                foreach (GridViewRow row in ChargeGridView.Rows)
                {
                    if (ChargeGridView.Rows.Count > 0)
                    {
                        Label FabricIDLabel = row.FindControl("FabricIDLabel") as Label;
                        Label BuyingQuantity = row.FindControl("QntLabel") as Label;
                        Label Selling_UPLabel = row.FindControl("Selling_UPLabel") as Label;
                        Label TotalPriceLabel = row.FindControl("TotalPriceLabel") as Label;

                        Fabric_Buying_ListSQl.InsertParameters["FabricBuyingID"].DefaultValue = ViewState["FabricBuyingID"].ToString();
                        Fabric_Buying_ListSQl.InsertParameters["FabricID"].DefaultValue = FabricIDLabel.Text;
                        Fabric_Buying_ListSQl.InsertParameters["BuyingQuantity"].DefaultValue = BuyingQuantity.Text;
                        Fabric_Buying_ListSQl.InsertParameters["BuyingPrice"].DefaultValue = TotalPriceLabel.Text;
                        Fabric_Buying_ListSQl.Insert();

                        if (ChangeBuyingPCheckBox.Checked)
                        {
                            double BuyingUnitPrice = (Convert.ToDouble(TotalPriceLabel.Text) / Convert.ToDouble(BuyingQuantity.Text));
                            Fabric_CurrentBuyP_UpdateSQL.UpdateParameters["CurrentBuyingUnitPrice"].DefaultValue = BuyingUnitPrice.ToString();
                            Fabric_CurrentBuyP_UpdateSQL.UpdateParameters["FabricID"].DefaultValue = FabricIDLabel.Text;
                            Fabric_CurrentBuyP_UpdateSQL.Update();
                        }
                        InserFabricSQL.UpdateParameters["SellingUnitPrice"].DefaultValue = Selling_UPLabel.Text;
                        InserFabricSQL.UpdateParameters["FabricID"].DefaultValue = FabricIDLabel.Text;
                        InserFabricSQL.Update();
                    }
                }

                Fabric_BuyingSQL.UpdateParameters["FabricBuyingID"].DefaultValue = ViewState["FabricBuyingID"].ToString();
                Fabric_BuyingSQL.Update();

                Buying_PaymentRecord.InsertParameters["BuyingPaidAmount"].DefaultValue = SubTotalHF.Value;
                Buying_PaymentRecord.InsertParameters["FabricBuyingID"].DefaultValue = ViewState["FabricBuyingID"].ToString();
                Buying_PaymentRecord.Insert();
                AccountDropDownList.DataBind();

                if (ViewState["FabricBuyingID"].ToString() != "")
                    Response.Redirect("Print_Invoice.aspx?FabricBuyingID=" + ViewState["FabricBuyingID"].ToString());
            }
            else
            {
                CheckBalanceLabel.Text = "Buying Amount More Than Account Balance";
            }
        }

        /*New Supplier Button*/
        protected void InsertNewSupplierSQL_Inserted(object sender, SqlDataSourceStatusEventArgs e)
        {
            ViewState["FabricsSupplierID"] = e.Command.Parameters["@FabricsSupplierID"].Value.ToString();
        }
        protected void NewSupplierButton_Click(object sender, EventArgs e)
        {
            if (Account_Balance(SupplierTA_TextBox.Text))
            {
                InsertNewSupplierSQL.Insert();

                CompanyNameTextBox.Text = string.Empty;
                SupplierNameTextBox.Text = string.Empty;
                SupplierPhoneTextBox.Text = string.Empty;
                SupplierAddressTextBox.Text = string.Empty;
                SupplierErlbl.Text = "";
                Fabric_BuyingSQL.InsertParameters["FabricsSupplierID"].DefaultValue = ViewState["FabricsSupplierID"].ToString();
                Fabric_BuyingSQL.Insert();

                foreach (GridViewRow row in ChargeGridView.Rows)
                {
                    if (ChargeGridView.Rows.Count > 0)
                    {
                        Label FabricIDLabel = row.FindControl("FabricIDLabel") as Label;
                        Label BuyingQuantity = row.FindControl("QntLabel") as Label;
                        Label Selling_UPLabel = row.FindControl("Selling_UPLabel") as Label;
                        Label TotalPriceLabel = row.FindControl("TotalPriceLabel") as Label;

                        Fabric_Buying_ListSQl.InsertParameters["FabricBuyingID"].DefaultValue = ViewState["FabricBuyingID"].ToString();
                        Fabric_Buying_ListSQl.InsertParameters["FabricID"].DefaultValue = FabricIDLabel.Text;
                        Fabric_Buying_ListSQl.InsertParameters["BuyingQuantity"].DefaultValue = BuyingQuantity.Text;
                        Fabric_Buying_ListSQl.InsertParameters["BuyingPrice"].DefaultValue = TotalPriceLabel.Text;
                        Fabric_Buying_ListSQl.InsertParameters["FabricsSupplierID"].DefaultValue = ViewState["FabricsSupplierID"].ToString();
                        Fabric_Buying_ListSQl.Insert();


                        InserFabricSQL.UpdateParameters["SellingUnitPrice"].DefaultValue = Selling_UPLabel.Text;
                        InserFabricSQL.UpdateParameters["FabricID"].DefaultValue = FabricIDLabel.Text;
                        InserFabricSQL.Update();
                    }
                }
                Fabric_BuyingSQL.UpdateParameters["FabricBuyingID"].DefaultValue = ViewState["FabricBuyingID"].ToString();
                Fabric_BuyingSQL.Update();

                Buying_PaymentRecord.InsertParameters["BuyingPaidAmount"].DefaultValue = SupplierTA_TextBox.Text;
                Buying_PaymentRecord.InsertParameters["FabricBuyingID"].DefaultValue = ViewState["FabricBuyingID"].ToString();
                Buying_PaymentRecord.InsertParameters["FabricsSupplierID"].DefaultValue = ViewState["FabricsSupplierID"].ToString();
                Buying_PaymentRecord.Insert();


                if (ViewState["FabricBuyingID"].ToString() != "")
                    Response.Redirect("Print_Invoice.aspx?FabricBuyingID=" + ViewState["FabricBuyingID"].ToString());
            }
            else
            { SupplierErlbl.Text = "Buying Amount More Than Account Balance"; }
        }

        /*Old Supplier Button*/
        protected void SupplierDropDownList_DataBound(object sender, EventArgs e)
        {
            SupplierDropDownList.Items.Insert(0, new ListItem("[ SELECT SUPPLIER ]", "0"));
        }
        protected void OldSupplierButton_Click(object sender, EventArgs e)
        {
            if (Account_Balance(Old_SupplierAmtTextBox.Text))
            {
                Fabric_BuyingSQL.InsertParameters["FabricsSupplierID"].DefaultValue = SupplierDropDownList.SelectedValue;
                Fabric_BuyingSQL.Insert();
                SupplierErlbl2.Text = "";
                foreach (GridViewRow row in ChargeGridView.Rows)
                {
                    if (ChargeGridView.Rows.Count > 0)
                    {
                        Label FabricIDLabel = row.FindControl("FabricIDLabel") as Label;
                        Label BuyingQuantity = row.FindControl("QntLabel") as Label;
                        Label Selling_UPLabel = row.FindControl("Selling_UPLabel") as Label;
                        Label TotalPriceLabel = row.FindControl("TotalPriceLabel") as Label;

                        Fabric_Buying_ListSQl.InsertParameters["FabricBuyingID"].DefaultValue = ViewState["FabricBuyingID"].ToString();
                        Fabric_Buying_ListSQl.InsertParameters["FabricID"].DefaultValue = FabricIDLabel.Text;
                        Fabric_Buying_ListSQl.InsertParameters["BuyingQuantity"].DefaultValue = BuyingQuantity.Text;
                        Fabric_Buying_ListSQl.InsertParameters["BuyingPrice"].DefaultValue = TotalPriceLabel.Text;
                        Fabric_Buying_ListSQl.InsertParameters["FabricsSupplierID"].DefaultValue = SupplierDropDownList.SelectedValue;
                        Fabric_Buying_ListSQl.Insert();

                        InserFabricSQL.UpdateParameters["SellingUnitPrice"].DefaultValue = Selling_UPLabel.Text;
                        InserFabricSQL.UpdateParameters["FabricID"].DefaultValue = FabricIDLabel.Text;
                        InserFabricSQL.Update();
                    }
                }
                Fabric_BuyingSQL.UpdateParameters["FabricBuyingID"].DefaultValue = ViewState["FabricBuyingID"].ToString();
                Fabric_BuyingSQL.Update();

                Buying_PaymentRecord.InsertParameters["BuyingPaidAmount"].DefaultValue = Old_SupplierAmtTextBox.Text;
                Buying_PaymentRecord.InsertParameters["FabricBuyingID"].DefaultValue = ViewState["FabricBuyingID"].ToString();
                Buying_PaymentRecord.InsertParameters["FabricsSupplierID"].DefaultValue = SupplierDropDownList.SelectedValue;
                Buying_PaymentRecord.Insert();

                if (ViewState["FabricBuyingID"].ToString() != "")
                    Response.Redirect("Print_Invoice.aspx?FabricBuyingID=" + ViewState["FabricBuyingID"].ToString());
            }
            else
            { SupplierErlbl2.Text = "Buying Amount More Than Account Balance"; }
        }

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
        private bool Account_Balance(string Paid)
        {
            SqlCommand AccountBalance_Cmd = new SqlCommand("Select AccountBalance from Account where InstitutionID = @InstitutionID AND AccountID = @AccountID", con);
            AccountBalance_Cmd.Parameters.AddWithValue("@InstitutionID", Request.Cookies["InstitutionID"].Value);
            AccountBalance_Cmd.Parameters.AddWithValue("@AccountID", AccountDropDownList.SelectedValue);
            con.Open();
            object AccountBalance = AccountBalance_Cmd.ExecuteScalar();
            con.Close();

            if (AccountBalance != null)
            {
                double Paid_Amount = Convert.ToDouble(Paid.Trim());
                double Balance = Convert.ToDouble(AccountBalance);

                if (Paid_Amount > Balance)
                {
                    return false;
                }
                else
                {
                    return true;
                }
            }
            else
            {
                return true;
            }
        }

        [WebMethod]
        public static string[] Fabric_Code(string prefix)
        {
            HttpCookie InstitutionID = HttpContext.Current.Request.Cookies["InstitutionID"];
            List<string> customers = new List<string>();
            using (SqlConnection conn = new SqlConnection())
            {
                conn.ConnectionString = ConfigurationManager.ConnectionStrings["TailorbdConnectionString"].ConnectionString;
                using (SqlCommand cmd = new SqlCommand())
                {
                    cmd.CommandText = "SELECT Top(3) Fabrics.FabricCode, Fabrics.FabricsName, Fabrics.SellingUnitPrice, Fabrics.StockFabricQuantity, Fabrics_Mesurement_Unit.UnitName, Fabrics.FabricID, Fabrics.InstitutionID FROM  Fabrics INNER JOIN Fabrics_Mesurement_Unit ON Fabrics.FabricMesurementUnitID = Fabrics_Mesurement_Unit.FabricMesurementUnitID WHERE (Fabrics.InstitutionID = @InstitutionID) AND Fabrics.FabricCode like @FabricCode + '%'";
                    cmd.Parameters.AddWithValue("@FabricCode", prefix);
                    cmd.Parameters.AddWithValue("@InstitutionID", InstitutionID.Value);
                    cmd.Connection = conn;
                    conn.Open();
                    using (SqlDataReader sdr = cmd.ExecuteReader())
                    {
                        while (sdr.Read())
                        {
                            customers.Add(string.Format("{0}||{1}||{2}||{3}||{4}||{5}",
                              sdr["FabricCode"],
                              sdr["FabricsName"],
                              Convert.ToString(sdr["SellingUnitPrice"]),
                              Convert.ToString(sdr["StockFabricQuantity"]),
                              sdr["UnitName"],
                              Convert.ToString(sdr["FabricID"])
                              ));
                        }
                    }
                    conn.Close();
                }
            }
            return customers.ToArray();
        }
    }
}