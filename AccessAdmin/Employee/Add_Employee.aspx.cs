using System;

namespace TailorBD.AccessAdmin.Employee
{
    public partial class Add_Employee : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        protected void AddEmployeeButton_Click(object sender, EventArgs e)
        {
            EmployeeSQL.Insert();
            NameTextBox.Text = "";
            PhoneTextBox.Text = "";
            DesignationTextBox.Text = "";
        }
    }
}