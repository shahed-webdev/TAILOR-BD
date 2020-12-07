using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Accounts
{
    public partial class Imcome_And_Expense_Report : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (!Page.IsPostBack)
            {
                FromDateTextBox.Text = DateTime.Today.ToString("d MMMM yyyy");
                ToDateTextBox.Text = DateTime.Today.ToString("d MMMM yyyy");
            }
        }

        protected void FindButton_Click(object sender, EventArgs e)
        {
            if (FromDateTextBox.Text == ToDateTextBox.Text)
            {
                Order_DeliveryGridView.Columns[0].Visible = false;
                ExtraIncomeGridView.Columns[0].Visible = false;
                FabricBuyingGridView.Columns[0].Visible = false;
                ExpenseGridView.Columns[0].Visible = false;
                FabricSellingDetailsGridView.Columns[0].Visible = false;
            }
            else
            {
                Order_DeliveryGridView.Columns[0].Visible = true;
                ExtraIncomeGridView.Columns[0].Visible = true;
                FabricBuyingGridView.Columns[0].Visible = true;
                ExpenseGridView.Columns[0].Visible = true;
                FabricSellingDetailsGridView.Columns[0].Visible = true;
            }
        }
    }
}