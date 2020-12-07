using System;

namespace TailorBD.AccessAdmin.Employee
{
    public partial class Details : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(Request.QueryString["EmployeeID"]))
            {
                Response.Redirect("Add_Employee.aspx");
            }
        }

        protected void AddWork_Button_Click(object sender, EventArgs e)
        {
            AddWorkSQL.Insert();
            WorkForTextBox.Text = "";
            WorkDateTextBox.Text = "";
            WorkAmountTextBox.Text = "";
            DetailsFormView.DataBind();
        }

        protected void Return_Button_Click(object sender, EventArgs e)
        {
            ReturnSQL.Insert();
            ReturnForTextBox.Text = "";
            ReturnDateTextBox.Text = "";
            ReturnAmountTextBox.Text = "";
            DetailsFormView.DataBind();
        }

        protected void AddLoan_Button_Click(object sender, EventArgs e)
        {
            LoanSQL.Insert();
            LoanAmountTextBox.Text = "";
            LoanForTextBox.Text = "";
            LoanDateTextBox.Text = "";
            DetailsFormView.DataBind();
        }
    }
}