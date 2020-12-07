using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Web.Security;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin
{
    public partial class SignUp_Institution : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }
        protected void InstitutionCW_CreatedUser(object sender, EventArgs e)
        {
            string[] UserName = { InstitutionCW.UserName };
            string[] role = { "Admin" };
            Roles.AddUsersToRoles(UserName, role);
            ViewState["Password"] = InstitutionCW.Password;
            ViewState["PasswordAnswer"] = InstitutionCW.Answer;
        }

        protected void SubmitButton_Click(object sender, EventArgs e)
        {
            InstitutionInfoSQL.InsertParameters["UserName"].DefaultValue = InstitutionCW.UserName;
            RegistrationSQL.InsertParameters["UserName"].DefaultValue = InstitutionCW.UserName;
            InstitutionInfoSQL.Insert();

            RegistrationSQL.Insert();
            InvoiceSQL.Insert();

            InvoiceLineSQL.InsertParameters["Details"].DefaultValue = "Signing Money";
            InvoiceLineSQL.InsertParameters["Amount"].DefaultValue = Signing_MoneyTextBox.Text.Trim();
            InvoiceLineSQL.Insert();

            InvoiceLineSQL.InsertParameters["Details"].DefaultValue = PackageDropDownList.SelectedItem.Text;
            InvoiceLineSQL.InsertParameters["Amount"].DefaultValue = Renew_AmountTextBox.Text.Trim();
            InvoiceLineSQL.Insert();

            LIUSQL.InsertParameters["UserName"].DefaultValue = InstitutionCW.UserName;
            LIUSQL.InsertParameters["Password"].DefaultValue = ViewState["Password"].ToString();
            LIUSQL.InsertParameters["PasswordAnswer"].DefaultValue = ViewState["PasswordAnswer"].ToString();
            LIUSQL.Insert();

            SMSSQL.Insert();

            InstitutionCW.ActiveStepIndex = 2;
        }
    }
}