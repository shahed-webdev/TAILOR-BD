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
        SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ToString());
        protected void Page_Load(object sender, EventArgs e)
        {
            if (!this.IsPostBack)
            {
                DataTable ChargeTeble = new DataTable();
                ChargeTeble.Columns.AddRange(new DataColumn[5] { new DataColumn("FabricID"), new DataColumn("FabricCode"), new DataColumn("UnitPrice"), new DataColumn("Quantity"), new DataColumn("TotalPrice") });
                ViewState["ChargeTeble"] = ChargeTeble;

                SqlCommand TotalCustomercmd = new SqlCommand("SELECT [dbo].[CustomeSerialNumber](@InstitutionID)", con);
                TotalCustomercmd.Parameters.AddWithValue("@InstitutionID", Request.Cookies["InstitutionID"].Value);

                con.Open();
                CustomerIDLabel.Text = TotalCustomercmd.ExecuteScalar().ToString();
                con.Close();
            }

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
            GridViewRow row = (sender as LinkButton).NamingContainer as GridViewRow;
            DataTable ChargeTeble = ViewState["ChargeTeble"] as DataTable;

            ChargeTeble.Rows.RemoveAt(row.RowIndex);
            ViewState["ChargeTeble"] = ChargeTeble;
            this.BindGrid();
        }
        protected void AddToCartButton_Click(object sender, EventArgs e)
        {
            if (FabricIDHF.Value != string.Empty)
            {
                CheckBalanceLabel.Text = "";

                double UnitPrice = 0;
                if (CSPCheckBox.Checked)
                {
                    UnitPrice = Convert.ToDouble(ChangeUPriceTextBox.Text);
                }
                else
                {
                    UnitPrice = Convert.ToDouble(UPHF.Value);
                }

                double Quntity = Convert.ToDouble(QuantityTextBox.Text);

                DataTable ChargeTeble = ViewState["ChargeTeble"] as DataTable;
                ChargeTeble.Rows.Add(FabricIDHF.Value, Fabric_CodeTextBox.Text, UnitPrice, QuantityTextBox.Text, (UnitPrice * Quntity));
                ViewState["ChargeTeble"] = ChargeTeble;
                this.BindGrid();

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

        /*Submition Button*/
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
        protected void Fabric_SellingSQL_Inserted(object sender, SqlDataSourceStatusEventArgs e)
        {
            ViewState["FabricsSellingID"] = e.Command.Parameters["@FabricsSellingID"].Value.ToString();
        }
        protected void SubmitButton_Click(object sender, EventArgs e)
        {
            bool All_Check = true;

            foreach (GridViewRow row in ChargeGridView.Rows)
            {
                if (ChargeGridView.Rows.Count > 0)
                {
                    Label SellingQuantity = row.FindControl("QntLabel") as Label;
                    Label FabricIDLabel = row.FindControl("FabricIDLabel") as Label;
                    using (SqlCommand cmd = new SqlCommand())
                    {
                        cmd.CommandText = "SELECT FabricID FROM Fabrics WHERE (InstitutionID = @InstitutionID) AND (StockFabricQuantity >= @SellingQuantity) AND (FabricID = @FabricID)";
                        cmd.Parameters.AddWithValue("@FabricID", FabricIDLabel.Text);
                        cmd.Parameters.AddWithValue("@InstitutionID", Request.Cookies["InstitutionID"].Value);
                        cmd.Parameters.AddWithValue("@SellingQuantity", SellingQuantity.Text);

                        cmd.Connection = con;
                        con.Open();
                        object Check_Stock = cmd.ExecuteScalar();
                        con.Close();

                        if (Check_Stock == null)
                        {
                            All_Check = false;
                            row.BackColor = System.Drawing.Color.Red;
                        }
                    }
                }
            }

            if (All_Check)
            {
                CheckBalanceLabel.Text = "";
                Fabric_SellingSQL.Insert();

                foreach (GridViewRow row in ChargeGridView.Rows)
                {
                    if (ChargeGridView.Rows.Count > 0)
                    {
                        Label FabricIDLabel = row.FindControl("FabricIDLabel") as Label;
                        Label SellingQuantity = row.FindControl("QntLabel") as Label;
                        Label Selling_UPLabel = row.FindControl("Selling_UPLabel") as Label;

                        Fabric_Selling_ListSQl.InsertParameters["FabricsSellingID"].DefaultValue = ViewState["FabricsSellingID"].ToString();
                        Fabric_Selling_ListSQl.InsertParameters["FabricID"].DefaultValue = FabricIDLabel.Text;
                        Fabric_Selling_ListSQl.InsertParameters["SellingQuantity"].DefaultValue = SellingQuantity.Text;
                        Fabric_Selling_ListSQl.InsertParameters["SellingUnitPrice"].DefaultValue = Selling_UPLabel.Text;
                        Fabric_Selling_ListSQl.Insert();
                    }
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
                bool All_Check = true;

                foreach (GridViewRow row in ChargeGridView.Rows)
                {
                    if (ChargeGridView.Rows.Count > 0)
                    {
                        Label SellingQuantity = row.FindControl("QntLabel") as Label;
                        Label FabricIDLabel = row.FindControl("FabricIDLabel") as Label;
                        using (SqlCommand cmd = new SqlCommand())
                        {
                            cmd.CommandText = "SELECT FabricID FROM Fabrics WHERE (InstitutionID = @InstitutionID) AND (StockFabricQuantity > @SellingQuantity) AND (FabricID = @FabricID)";
                            cmd.Parameters.AddWithValue("@FabricID", FabricIDLabel.Text);
                            cmd.Parameters.AddWithValue("@InstitutionID", Request.Cookies["InstitutionID"].Value);
                            cmd.Parameters.AddWithValue("@SellingQuantity", SellingQuantity.Text);

                            cmd.Connection = con;
                            con.Open();
                            object Check_Stock = cmd.ExecuteScalar();
                            con.Close();

                            if (Check_Stock == null)
                            {
                                All_Check = false;
                                row.BackColor = System.Drawing.Color.Red;
                            }
                        }
                    }
                }

                if (All_Check)
                {
                    CustomerSQL.Insert();
                    InstitutionSQL.Update();

                    Fabric_SellingSQL.InsertParameters["CustomerID"].DefaultValue = ViewState["CustomerID"].ToString();
                    Fabric_SellingSQL.Insert();

                    foreach (GridViewRow row in ChargeGridView.Rows)
                    {
                        if (ChargeGridView.Rows.Count > 0)
                        {
                            Label FabricIDLabel = row.FindControl("FabricIDLabel") as Label;
                            Label SellingQuantity = row.FindControl("QntLabel") as Label;
                            Label Selling_UPLabel = row.FindControl("Selling_UPLabel") as Label;

                            Fabric_Selling_ListSQl.InsertParameters["FabricsSellingID"].DefaultValue = ViewState["FabricsSellingID"].ToString();
                            Fabric_Selling_ListSQl.InsertParameters["FabricID"].DefaultValue = FabricIDLabel.Text;
                            Fabric_Selling_ListSQl.InsertParameters["SellingQuantity"].DefaultValue = SellingQuantity.Text;
                            Fabric_Selling_ListSQl.InsertParameters["SellingUnitPrice"].DefaultValue = Selling_UPLabel.Text;
                            Fabric_Selling_ListSQl.Insert();
                        }
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
            }
            catch { CustomerErlbl1.Text = "system error"; }
        }


        /*Old Customer Button*/
        protected void OldCustomerButton_Click(object sender, EventArgs e)
        {
            try
            {
                bool All_Check = true;

                foreach (GridViewRow row in ChargeGridView.Rows)
                {
                    if (ChargeGridView.Rows.Count > 0)
                    {
                        Label SellingQuantity = row.FindControl("QntLabel") as Label;
                        Label FabricIDLabel = row.FindControl("FabricIDLabel") as Label;
                        using (SqlCommand cmd = new SqlCommand())
                        {
                            cmd.CommandText = "SELECT FabricID FROM Fabrics WHERE (InstitutionID = @InstitutionID) AND (StockFabricQuantity > @SellingQuantity) AND (FabricID = @FabricID)";
                            cmd.Parameters.AddWithValue("@FabricID", FabricIDLabel.Text);
                            cmd.Parameters.AddWithValue("@InstitutionID", Request.Cookies["InstitutionID"].Value);
                            cmd.Parameters.AddWithValue("@SellingQuantity", SellingQuantity.Text);

                            cmd.Connection = con;
                            con.Open();
                            object Check_Stock = cmd.ExecuteScalar();
                            con.Close();

                            if (Check_Stock == null)
                            {
                                All_Check = false;
                                row.BackColor = System.Drawing.Color.Red;
                            }
                        }
                    }
                }

                if (All_Check)
                {
                    if (Customer_ID_HF.Value.Trim() != "")
                    {
                        Fabric_SellingSQL.InsertParameters["CustomerID"].DefaultValue = Customer_ID_HF.Value;
                        Fabric_SellingSQL.Insert();
                        CustomerErlbl2.Text = "";

                        foreach (GridViewRow row in ChargeGridView.Rows)
                        {
                            if (ChargeGridView.Rows.Count > 0)
                            {
                                Label FabricIDLabel = row.FindControl("FabricIDLabel") as Label;
                                Label SellingQuantity = row.FindControl("QntLabel") as Label;
                                Label Selling_UPLabel = row.FindControl("Selling_UPLabel") as Label;

                                Fabric_Selling_ListSQl.InsertParameters["FabricsSellingID"].DefaultValue = ViewState["FabricsSellingID"].ToString();
                                Fabric_Selling_ListSQl.InsertParameters["FabricID"].DefaultValue = FabricIDLabel.Text;
                                Fabric_Selling_ListSQl.InsertParameters["SellingQuantity"].DefaultValue = SellingQuantity.Text;
                                Fabric_Selling_ListSQl.InsertParameters["SellingUnitPrice"].DefaultValue = Selling_UPLabel.Text;
                                Fabric_Selling_ListSQl.Insert();
                            }
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
            }
            catch { CustomerErlbl2.Text = "system error"; }
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
                    cmd.CommandText = "SELECT top(10) Fabrics.FabricCode, Fabrics.FabricsName, Fabrics.SellingUnitPrice, Fabrics.StockFabricQuantity, Fabrics_Mesurement_Unit.UnitName, Fabrics.FabricID, Fabrics.InstitutionID FROM  Fabrics INNER JOIN Fabrics_Mesurement_Unit ON Fabrics.FabricMesurementUnitID = Fabrics_Mesurement_Unit.FabricMesurementUnitID WHERE (Fabrics.InstitutionID = @InstitutionID) AND (Fabrics.StockFabricQuantity <> 0) AND Fabrics.FabricCode like @FabricCode + '%'";
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

        [WebMethod]
        public static string[] Get_Customer(string prefix)
        {
            HttpCookie InstitutionID = HttpContext.Current.Request.Cookies["InstitutionID"];
            List<string> customers = new List<string>();
            using (SqlConnection conn = new SqlConnection())
            {
                conn.ConnectionString = ConfigurationManager.ConnectionStrings["TailorbdConnectionString"].ConnectionString;
                using (SqlCommand cmd = new SqlCommand())
                {
                    cmd.CommandText = "SELECT top(3) Phone, CustomerName, CustomerNumber, CustomerID FROM Customer WHERE InstitutionID = @InstitutionID AND Phone like @Phone + '%'";
                    cmd.Parameters.AddWithValue("@Phone", prefix);
                    cmd.Parameters.AddWithValue("@InstitutionID", InstitutionID.Value);
                    cmd.Connection = conn;
                    conn.Open();
                    using (SqlDataReader sdr = cmd.ExecuteReader())
                    {
                        while (sdr.Read())
                        {
                            customers.Add(string.Format("{0}||{1}||{2}||{3}",
                              sdr["Phone"],
                              sdr["CustomerName"],
                              Convert.ToString(sdr["CustomerNumber"]),
                              Convert.ToString(sdr["CustomerID"])
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