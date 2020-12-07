using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.Access_Authority
{
    public partial class Pay_Invoice : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(Request.QueryString["InstitutionID"]))
            {
                Response.Redirect("~/Access_Authority/Institution_List.aspx");
            }
        }

        protected void PayButton_Click(object sender, EventArgs e)
        {
            bool check_amount = true;
            
            foreach (GridViewRow row in DueGridView.Rows)
            {
                Label DueLabel = row.FindControl("DueLabel") as Label;
                TextBox DueTextBox = row.FindControl("PayAmountTextBox") as TextBox;

                double Totaldue = 0;
                double due = 0;


                Double.TryParse(DueLabel.Text, out Totaldue);
                Double.TryParse(DueTextBox.Text, out due);

                if (Totaldue >= due)
                {
                    
                }
                else
                {
                    check_amount = false;
                    row.CssClass = "RowColor";
                }
            }

            if (check_amount)
            {
                foreach (GridViewRow row in DueGridView.Rows)
                {
                    Label DueLabel = row.FindControl("DueLabel") as Label;
                    TextBox DueTextBox = row.FindControl("PayAmountTextBox") as TextBox;
                    TextBox DateTextBox = row.FindControl("DateTextBox") as TextBox;
                    TextBox DiscountTextBox = row.FindControl("DiscountTextBox") as TextBox;

                    double Totaldue = 0;
                    double due = 0;

                    Double.TryParse(DueLabel.Text, out Totaldue);
                    Double.TryParse(DueTextBox.Text, out due);


                    if (Totaldue >= due)
                    {
                        if (DueTextBox.Text != "")
                        {
                            DueSQL.InsertParameters["InvoiceID"].DefaultValue = DueGridView.DataKeys[row.DataItemIndex]["InvoiceID"].ToString();
                            DueSQL.InsertParameters["Amount"].DefaultValue = DueTextBox.Text;
                            DueSQL.Insert();
                        }

                        if (DiscountTextBox.Text != "")
                        {
                            DueSQL.UpdateParameters["InvoiceID"].DefaultValue = DueGridView.DataKeys[row.DataItemIndex]["InvoiceID"].ToString();
                            DueSQL.UpdateParameters["Discount"].DefaultValue = DiscountTextBox.Text;
                            DueSQL.Update();
                        }

                    }
                    else
                    {
                        row.CssClass = "RowColor";
                    }

                }
                DueGridView.DataBind();
                PaidGridView.DataBind();
            }
        }

        protected void SubmitButton_Click(object sender, EventArgs e)
        {
            RechargeSQL.Insert();

            QuantityTextBox.Text = "";
            PriceTextBox.Text = "";
        }

    }
}