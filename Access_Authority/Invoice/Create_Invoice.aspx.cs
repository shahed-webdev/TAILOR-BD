using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin
{
    public partial class WebForm1 : System.Web.UI.Page
    {
     
        protected void Page_Load(object sender, EventArgs e)
        {

            if (!this.IsPostBack)
            {
                DataTable InvoiceTeble = new DataTable();
                InvoiceTeble.Columns.AddRange(new DataColumn[2] { new DataColumn("Amount"), new DataColumn("Details") });

                ViewState["InvoiceTeble"] = InvoiceTeble;
                ViewState["Invoice"] = "0";


                ViewState["Show_Skip"] = "No";
            }
        }
        protected void BindGrid()
        {
            InvoiceGridView.DataSource = ViewState["InvoiceTeble"] as DataTable;
            InvoiceGridView.DataBind();
        }

        protected void OnRowEditing(object sender, GridViewEditEventArgs e)
        {
            InvoiceGridView.EditIndex = e.NewEditIndex;
            this.BindGrid();
        }
        protected void RowDelete(object sender, EventArgs e)
        {
            GridViewRow row = (sender as LinkButton).NamingContainer as GridViewRow;
            DataTable InvoiceTeble = ViewState["InvoiceTeble"] as DataTable;

            InvoiceTeble.Rows.RemoveAt(row.RowIndex);
            ViewState["InvoiceTeble"] = InvoiceTeble;
            this.BindGrid();
        }

        protected void OnUpdate(object sender, EventArgs e)
        {
            GridViewRow row = (sender as LinkButton).NamingContainer as GridViewRow;

            string Details = (row.Cells[0].Controls[0] as TextBox).Text;
            string Amount = (row.Cells[1].Controls[0] as TextBox).Text;

            DataTable InvoiceTeble = ViewState["InvoiceTeble"] as DataTable;
            InvoiceTeble.Rows[row.RowIndex]["Amount"] = Amount;
            InvoiceTeble.Rows[row.RowIndex]["Details"] = Details;

            ViewState["InvoiceTeble"] = InvoiceTeble;
            InvoiceGridView.EditIndex = -1;
            this.BindGrid();
        }

        protected void OnCancel(object sender, EventArgs e)
        {
            InvoiceGridView.EditIndex = -1;
            this.BindGrid();
        }

        protected void AdchartButton_Click(object sender, EventArgs e)
        {
            DataTable InvoiceTeble = ViewState["InvoiceTeble"] as DataTable;
            InvoiceTeble.Rows.Add(AmountTextBox.Text, InvoiceForTextBox.Text);
            ViewState["InvoiceTeble"] = InvoiceTeble;

            this.BindGrid();

            AmountTextBox.Text = string.Empty;
            InvoiceForTextBox.Text = string.Empty;

        }

        protected void SubmitButton_Click(object sender, EventArgs e)
        {
            foreach (GridViewRow row in TailorListGridView.Rows)
            {
                CheckBox TailorCheckBox = (CheckBox)row.FindControl("TailorCheckBox");

                if (TailorCheckBox.Checked)
                {
                    invoiceSQL.InsertParameters["InstitutionID"].DefaultValue = TailorListGridView.DataKeys[row.DataItemIndex]["InstitutionID"].ToString();
                    invoiceSQL.Insert();

                    foreach (GridViewRow row1 in InvoiceGridView.Rows)
                    {
                        string Details = row1.Cells[0].Text;
                        string Amount = row1.Cells[1].Text;

                        InvoiceLineSQL.InsertParameters["InstitutionID"].DefaultValue = TailorListGridView.DataKeys[row.DataItemIndex]["InstitutionID"].ToString();
                        InvoiceLineSQL.InsertParameters["Details"].DefaultValue = Details;
                        InvoiceLineSQL.InsertParameters["Amount"].DefaultValue = Amount;
                        InvoiceLineSQL.Insert();
                    }
                }
            }

            InvoiceDetailsTextBox.Text = string.Empty;
            IssuDateTextBox.Text = string.Empty;
            EndDateTextBox.Text = string.Empty;
            DiscountTextBox.Text = string.Empty;

            ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('Invoice Created Successfully!')", true);
        }
    }

}