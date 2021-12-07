using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Web;
using System.Web.Services;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Fabrics.Sell
{
    public partial class Fabrics_Selling : System.Web.UI.Page
    {
        private readonly SqlConnection _con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ToString());

        protected void Page_Load(object sender, EventArgs e)
        {
            var chargeTable = new DataTable();
            if (IsPostBack) return;

            chargeTable.Columns.AddRange(new DataColumn[5]
            {
                new DataColumn("FabricID"), new DataColumn("FabricCode"), new DataColumn("UnitPrice"),
                new DataColumn("Quantity"), new DataColumn("TotalPrice")
            });

            ViewState["ChargeTeble"] = chargeTable;

            var totalCustomer = new SqlCommand("SELECT [dbo].[CustomeSerialNumber](@InstitutionID)", _con);
            totalCustomer.Parameters.AddWithValue("@InstitutionID", Request.Cookies["InstitutionID"]?.Value);

            _con.Open();
            CustomerIDLabel.Text = totalCustomer.ExecuteScalar().ToString();
            _con.Close();
        }

        protected void AccountDropDownList_DataBound(object sender, EventArgs e)
        {
            AccountDropDownList.Items.Insert(0, new ListItem("Without Account", ""));
        }

        /*Add To Cart Button*/
        protected void BindGrid()
        {
            ChargeGridView.DataSource = ViewState["ChargeTeble"] as DataTable;
            ChargeGridView.DataBind();

            //FabricDropDownList.DataBind();
            //foreach (GridViewRow row in ChargeGridView.Rows)
            //{
            //    Label FabricIDLabel = row.FindControl("FabricIDLabel") as Label;
            //    FabricDropDownList.Items.Remove(FabricDropDownList.Items.FindByValue(FabricIDLabel.Text));
            //}
        }
      
        protected void RowDelete(object sender, EventArgs e)
        {
            GridViewRow row = (sender as LinkButton)?.NamingContainer as GridViewRow;

            if (ViewState["ChargeTeble"] is DataTable chargeTable)
            {
                if (row != null) chargeTable.Rows.RemoveAt(row.RowIndex);
                ViewState["ChargeTeble"] = chargeTable;
            }

            BindGrid();
        }
   
        protected void AddToCartButton_Click(object sender, EventArgs e)
        {
            if (FabricIDHF.Value != string.Empty)
            {
                CheckBalanceLabel.Text = "";

                double unitPrice = 0;
                unitPrice = Convert.ToDouble(CSPCheckBox.Checked ? ChangeUPriceTextBox.Text : UPHF.Value);

                var quantity = Convert.ToDouble(QuantityTextBox.Text);

                if (ViewState["ChargeTeble"] is DataTable chargeTable)
                {
                    chargeTable.Rows.Add(FabricIDHF.Value, Fabric_CodeTextBox.Text, unitPrice, QuantityTextBox.Text, unitPrice * quantity);
                    ViewState["ChargeTeble"] = chargeTable;
                }

                BindGrid();

                FabricIDHF.Value = "";
                Fabric_CodeTextBox.Text = string.Empty;
                UPHF.Value = "";
                QuantityTextBox.Text = string.Empty;

                SelectedAccount();
                CSPCheckBox.Checked = false;
            }
            else
            {
                Fabric_CodeTextBox.Text = string.Empty;
                QuantityTextBox.Text = string.Empty;
            }
        }

        /*Submit Button*/
        protected void SelectedAccount()
        {
            var accountCmd = new SqlCommand("Select AccountID from Account where InstitutionID = @InstitutionID AND Default_Status = 'True' AND AccountBalance <> 0", _con);
            accountCmd.Parameters.AddWithValue("@InstitutionID", Request.Cookies["InstitutionID"]?.Value);
            
            _con.Open();
            var accountId = accountCmd.ExecuteScalar();
            _con.Close();

            if (accountId != null)
                AccountDropDownList.SelectedValue = accountId.ToString();
        }

        protected void Fabric_SellingSQL_Inserted(object sender, SqlDataSourceStatusEventArgs e)
        {
            ViewState["FabricsSellingID"] = e.Command.Parameters["@FabricsSellingID"].Value.ToString();
        }

        protected void SubmitButton_Click(object sender, EventArgs e)
        {
            var allCheck = true;

            foreach (GridViewRow row in ChargeGridView.Rows)
            {
                if (ChargeGridView.Rows.Count <= 0) continue;

                var sellingQuantity = row.FindControl("QntLabel") as Label;
                var fabricIdLabel = row.FindControl("FabricIDLabel") as Label;

                using (var cmd = new SqlCommand())
                {
                    cmd.CommandText =
                        "SELECT FabricID FROM Fabrics WHERE (InstitutionID = @InstitutionID) AND (StockFabricQuantity >= @SellingQuantity) AND (FabricID = @FabricID)";
                    cmd.Parameters.AddWithValue("@FabricID", fabricIdLabel.Text);
                    cmd.Parameters.AddWithValue("@InstitutionID", Request.Cookies["InstitutionID"].Value);
                    cmd.Parameters.AddWithValue("@SellingQuantity", sellingQuantity.Text);

                    cmd.Connection = _con;

                    _con.Open();
                    var checkStock = cmd.ExecuteScalar();
                    _con.Close();

                    if (checkStock != null) continue;

                    allCheck = false;
                    row.BackColor = System.Drawing.Color.Red;
                }
            }

            if (!allCheck) return;


            CheckBalanceLabel.Text = "";
            Fabric_SellingSQL.Insert();

            foreach (GridViewRow row in ChargeGridView.Rows)
            {
                if (ChargeGridView.Rows.Count <= 0) continue;

                var fabricIdLabel = row.FindControl("FabricIDLabel") as Label;
                var sellingQuantity = row.FindControl("QntLabel") as Label;
                var sellingUpLabel = row.FindControl("Selling_UPLabel") as Label;

                Fabric_Selling_ListSQl.InsertParameters["FabricsSellingID"].DefaultValue = ViewState["FabricsSellingID"].ToString();
                Fabric_Selling_ListSQl.InsertParameters["FabricID"].DefaultValue = fabricIdLabel.Text;
                Fabric_Selling_ListSQl.InsertParameters["SellingQuantity"].DefaultValue = sellingQuantity.Text;
                Fabric_Selling_ListSQl.InsertParameters["SellingUnitPrice"].DefaultValue = sellingUpLabel.Text;
                Fabric_Selling_ListSQl.Insert();
            }

            Fabric_SellingSQL.UpdateParameters["FabricsSellingID"].DefaultValue = ViewState["FabricsSellingID"].ToString();
            Fabric_SellingSQL.Update();

            Selling_PaymentRecord.InsertParameters["SellingPaidAmount"].DefaultValue = SubTotalHF.Value;
            Selling_PaymentRecord.InsertParameters["FabricsSellingID"].DefaultValue = ViewState["FabricsSellingID"].ToString();
            Selling_PaymentRecord.Insert();
            AccountDropDownList.DataBind();

            if (ViewState["FabricsSellingID"].ToString() != "")
                Response.Redirect("Print_Invoice.aspx?FabricsSellingID=" + ViewState["FabricsSellingID"].ToString());

        }

        /*New Customer Button*/
        protected void CustomerSQL_Inserted(object sender, SqlDataSourceStatusEventArgs e)
        {
            ViewState["CustomerID"] = e.Command.Parameters["@CustomerID"].Value.ToString();
        }

        protected void NewCustomerButton_Click(object sender, EventArgs e)
        {
            try
            {
                var allCheck = true;

                foreach (GridViewRow row in ChargeGridView.Rows)
                {
                    if (ChargeGridView.Rows.Count <= 0) continue;

                    var sellingQuantity = row.FindControl("QntLabel") as Label;
                    var fabricIdLabel = row.FindControl("FabricIDLabel") as Label;
                    using (var cmd = new SqlCommand())
                    {
                        cmd.CommandText =
                            "SELECT FabricID FROM Fabrics WHERE (InstitutionID = @InstitutionID) AND (StockFabricQuantity > @SellingQuantity) AND (FabricID = @FabricID)";
                        cmd.Parameters.AddWithValue("@FabricID", fabricIdLabel.Text);
                        cmd.Parameters.AddWithValue("@InstitutionID", Request.Cookies["InstitutionID"].Value);
                        cmd.Parameters.AddWithValue("@SellingQuantity", sellingQuantity.Text);

                        cmd.Connection = _con;

                        _con.Open();
                        var checkStock = cmd.ExecuteScalar();
                        _con.Close();

                        if (checkStock != null) continue;

                        allCheck = false;
                        row.BackColor = System.Drawing.Color.Red;
                    }
                }

                if (!allCheck) return;

                CustomerSQL.Insert();
                InstitutionSQL.Update();

                Fabric_SellingSQL.InsertParameters["CustomerID"].DefaultValue = ViewState["CustomerID"].ToString();
                Fabric_SellingSQL.Insert();

                foreach (GridViewRow row in ChargeGridView.Rows)
                {
                    if (ChargeGridView.Rows.Count <= 0) continue;

                    var fabricIdLabel = row.FindControl("FabricIDLabel") as Label;
                    var sellingQuantity = row.FindControl("QntLabel") as Label;
                    var sellingUpLabel = row.FindControl("Selling_UPLabel") as Label;

                    Fabric_Selling_ListSQl.InsertParameters["FabricsSellingID"].DefaultValue = ViewState["FabricsSellingID"].ToString();
                    Fabric_Selling_ListSQl.InsertParameters["FabricID"].DefaultValue = fabricIdLabel.Text;
                    Fabric_Selling_ListSQl.InsertParameters["SellingQuantity"].DefaultValue = sellingQuantity.Text;
                    Fabric_Selling_ListSQl.InsertParameters["SellingUnitPrice"].DefaultValue = sellingUpLabel.Text;
                    Fabric_Selling_ListSQl.Insert();
                }

                Fabric_SellingSQL.UpdateParameters["FabricsSellingID"].DefaultValue = ViewState["FabricsSellingID"].ToString();
                Fabric_SellingSQL.Update();

                Selling_PaymentRecord.InsertParameters["SellingPaidAmount"].DefaultValue = CustomerTA_TextBox.Text;
                Selling_PaymentRecord.InsertParameters["FabricsSellingID"].DefaultValue = ViewState["FabricsSellingID"].ToString();
                Selling_PaymentRecord.Insert();


                if (ViewState["FabricsSellingID"].ToString() != "")
                {
                    Response.Redirect("Print_Invoice.aspx?FabricsSellingID=" + ViewState["FabricsSellingID"].ToString());
                }
            }
            catch
            {
                CustomerErlbl1.Text = "system error";
            }
        }


        /*Old Customer Button*/
        protected void OldCustomerButton_Click(object sender, EventArgs e)
        {
            try
            {
                var allCheck = true;

                foreach (GridViewRow row in ChargeGridView.Rows)
                {
                    if (ChargeGridView.Rows.Count <= 0) continue;

                    var sellingQuantity = row.FindControl("QntLabel") as Label;
                    var fabricIdLabel = row.FindControl("FabricIDLabel") as Label;

                    using (var cmd = new SqlCommand())
                    {
                        cmd.CommandText =
                            "SELECT FabricID FROM Fabrics WHERE (InstitutionID = @InstitutionID) AND (StockFabricQuantity > @SellingQuantity) AND (FabricID = @FabricID)";
                        cmd.Parameters.AddWithValue("@FabricID", fabricIdLabel.Text);
                        cmd.Parameters.AddWithValue("@InstitutionID", Request.Cookies["InstitutionID"].Value);
                        cmd.Parameters.AddWithValue("@SellingQuantity", sellingQuantity.Text);

                        cmd.Connection = _con;

                        _con.Open();
                        var checkStock = cmd.ExecuteScalar();
                        _con.Close();

                        if (checkStock != null) continue;

                        allCheck = false;
                        row.BackColor = System.Drawing.Color.Red;
                    }
                }

                if (!allCheck) return;

                if (Customer_ID_HF.Value.Trim() != "")
                {
                    Fabric_SellingSQL.InsertParameters["CustomerID"].DefaultValue = Customer_ID_HF.Value;
                    Fabric_SellingSQL.Insert();
                    CustomerErlbl2.Text = "";

                    foreach (GridViewRow row in ChargeGridView.Rows)
                    {
                        if (ChargeGridView.Rows.Count <= 0) continue;

                        var fabricIdLabel = row.FindControl("FabricIDLabel") as Label;
                        var sellingQuantity = row.FindControl("QntLabel") as Label;
                        var sellingUpLabel = row.FindControl("Selling_UPLabel") as Label;

                        Fabric_Selling_ListSQl.InsertParameters["FabricsSellingID"].DefaultValue =
                            ViewState["FabricsSellingID"].ToString();
                        Fabric_Selling_ListSQl.InsertParameters["FabricID"].DefaultValue = fabricIdLabel?.Text;
                        Fabric_Selling_ListSQl.InsertParameters["SellingQuantity"].DefaultValue = sellingQuantity?.Text;
                        Fabric_Selling_ListSQl.InsertParameters["SellingUnitPrice"].DefaultValue = sellingUpLabel?.Text;
                        Fabric_Selling_ListSQl.Insert();
                    }

                    Fabric_SellingSQL.UpdateParameters["FabricsSellingID"].DefaultValue = ViewState["FabricsSellingID"].ToString();
                    Fabric_SellingSQL.Update();

                    Selling_PaymentRecord.InsertParameters["SellingPaidAmount"].DefaultValue = Old_CustomerAmtTextBox.Text;
                    Selling_PaymentRecord.InsertParameters["FabricsSellingID"].DefaultValue = ViewState["FabricsSellingID"].ToString();
                    Selling_PaymentRecord.Insert();

                    if (ViewState["FabricsSellingID"].ToString() != "")
                    {
                        Response.Redirect("Print_Invoice.aspx?FabricsSellingID=" + ViewState["FabricsSellingID"].ToString());
                    }
                }
            }
            catch
            {
                CustomerErlbl2.Text = "system error";
            }
        }

        [WebMethod]
        public static string[] Fabric_Code(string prefix)
        {
            var institutionId = HttpContext.Current.Request.Cookies["InstitutionID"];
            var customers = new List<string>();
            
            using (var conn = new SqlConnection())
            {
                conn.ConnectionString = ConfigurationManager.ConnectionStrings["TailorbdConnectionString"].ConnectionString;
                using (var cmd = new SqlCommand())
                {
                    cmd.CommandText = "SELECT top(3) Fabrics.FabricCode, Fabrics.FabricsName, Fabrics.SellingUnitPrice, Fabrics.StockFabricQuantity, Fabrics_Mesurement_Unit.UnitName, Fabrics.FabricID, Fabrics.InstitutionID FROM  Fabrics INNER JOIN Fabrics_Mesurement_Unit ON Fabrics.FabricMesurementUnitID = Fabrics_Mesurement_Unit.FabricMesurementUnitID WHERE (Fabrics.InstitutionID = @InstitutionID) AND (Fabrics.StockFabricQuantity <> 0) AND Fabrics.FabricCode like @FabricCode + '%'";
                    cmd.Parameters.AddWithValue("@FabricCode", prefix);
                    cmd.Parameters.AddWithValue("@InstitutionID", institutionId?.Value);
                    cmd.Connection = conn;
                    conn.Open();
                   
                    using (var sdr = cmd.ExecuteReader())
                    {
                        while (sdr.Read())
                        {
                            customers.Add($"{sdr["FabricCode"]}||{sdr["FabricsName"]}||{Convert.ToString(sdr["SellingUnitPrice"])}||{Convert.ToString(sdr["StockFabricQuantity"])}||{sdr["UnitName"]}||{Convert.ToString(sdr["FabricID"])}");
                        }
                    }
                    conn.Close();
                }
            }
            return customers.ToArray();
        }

        [WebMethod]
        public static string[] Get_Customer(string prefix)
        {
            var institutionId = HttpContext.Current.Request.Cookies["InstitutionID"];
            var customers = new List<string>();
           
            using (var conn = new SqlConnection())
            {
                conn.ConnectionString = ConfigurationManager.ConnectionStrings["TailorbdConnectionString"].ConnectionString;
                using (var cmd = new SqlCommand())
                {
                    cmd.CommandText = "SELECT top(3) Phone, CustomerName, CustomerNumber, CustomerID FROM Customer WHERE InstitutionID = @InstitutionID AND Phone like @Phone + '%'";
                    cmd.Parameters.AddWithValue("@Phone", prefix);
                    cmd.Parameters.AddWithValue("@InstitutionID", institutionId.Value);
                    cmd.Connection = conn;
                    
                    conn.Open();
                    using (var sdr = cmd.ExecuteReader())
                    {
                        while (sdr.Read())
                        {
                            customers.Add($"{sdr["Phone"]}||{sdr["CustomerName"]}||{Convert.ToString(sdr["CustomerNumber"])}||{Convert.ToString(sdr["CustomerID"])}");
                        }
                    }
                    conn.Close();
                }
            }
            return customers.ToArray();
        }
    }
}