using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.Access_Authority.Invoice
{
    public partial class AdMoreInvoice : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }



        protected void SubmitButton_Click(object sender, EventArgs e)
        {            
             InvoiceLineSQL.Insert();
             InvoiceLineSQL.DataBind();
             MinInvoiceGridView.DataBind();
             DescriptionTextBox.Text = "";
             AmountTextBox.Text = "";

             ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('Invoice Created Successfully!')", true);
        }

        protected void InvoiceGridView_RowDeleted(object sender, GridViewDeletedEventArgs e)
        {
            if (e.Exception != null)
            {
                 ErrorLabel.Text = e.Exception.Message;
                e.ExceptionHandled = true;
            }
            else 
            { 
           
                MinInvoiceGridView.DataBind();
                InvoiceGridView.DataBind();
                if (InvoiceGridView.Rows.Count == 0)
                {
                    InvoiceSQL.Delete();
                    Response.Redirect("~/Access_Authority/Invoice/Pay_Invoice.aspx");
                }
                

            }
        }

        protected void PaidRecordGridView_RowDeleted(object sender, GridViewDeletedEventArgs e)
        {
            MinInvoiceGridView.DataBind();
        }
    }
}