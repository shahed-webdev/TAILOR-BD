using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Web.Security;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Xml;

namespace TailorBD.AccessSub_Authority
{
    public partial class Create_Sub_Authority : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        protected void SubAdminCreateUserWizard_CreatedUser(object sender, EventArgs e)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ToString());

            Roles.AddUserToRole(SubAdminCreateUserWizard.UserName, "Sub-Admin");
            SqlDataSource RegistrationSQL = (SqlDataSource)SubAdminCreateUserWizard.CreateUserStep.ContentTemplateContainer.FindControl("RegistrationSQL");
            RegistrationSQL.Insert();

            con.Open();
            SqlCommand RegistrationID_Cmd = new SqlCommand("Select IDENT_CURRENT('Registration')", con);
            string RegistrationID = RegistrationID_Cmd.ExecuteScalar().ToString();
            con.Close();

            LITSQl.InsertParameters["RegistrationID"].DefaultValue = RegistrationID;
            LITSQl.InsertParameters["UserName"].DefaultValue = SubAdminCreateUserWizard.UserName;
            LITSQl.InsertParameters["Password"].DefaultValue = SubAdminCreateUserWizard.Password;
            LITSQl.InsertParameters["PasswordAnswer"].DefaultValue = SubAdminCreateUserWizard.Answer;
            LITSQl.Insert();

            ViewState["RegistrationID"] = RegistrationID;
            SubAdminCreateUserWizard.ActiveStepIndex = 1;
        }

        protected void LinkAssignButton_Click(object sender, EventArgs e)
        {
            foreach (GridViewRow row in LinkGridView.Rows)
            {
                CheckBox LinkCheckbox = row.FindControl("LinkCheckBox") as CheckBox;
                if (LinkCheckbox.Checked)
                {
                    AddUser(LinkGridView.DataKeys[row.DataItemIndex]["Location"].ToString(), SubAdminCreateUserWizard.UserName);

                    Link_UsersSQL.InsertParameters["UserName"].DefaultValue = SubAdminCreateUserWizard.UserName;
                    Link_UsersSQL.InsertParameters["RegistrationID"].DefaultValue = ViewState["RegistrationID"].ToString();
                    Link_UsersSQL.InsertParameters["LinkID"].DefaultValue = LinkGridView.DataKeys[row.DataItemIndex]["LinkID"].ToString();

                    Link_UsersSQL.Insert();
                }

            }
            SubAdminCreateUserWizard.ActiveStepIndex = 2;
        }
        private void AddUser(string Pagepath, string users)
        {
            string path = Server.MapPath("~/Web.Config");
            XmlDocument doc = new XmlDocument();
            doc.Load(path); XmlNodeList list;
            list = doc.DocumentElement.SelectNodes(string.Format("location[@path='{0}']", Pagepath));

            if (list.Count != 0)
            {
                XmlNode locationNode;
                locationNode = list[0];
                list = locationNode.SelectNodes(string.Format("system.web/authorization/allow[@users='{0}']", users));

                if (list.Count == 0)
                {
                    XmlNode AllowNode = doc.CreateNode(XmlNodeType.Element, "allow", null);
                    XmlAttribute attribute = doc.CreateAttribute("users");
                    attribute.Value = users;
                    AllowNode.Attributes.Append(attribute);
                    locationNode.SelectNodes("system.web/authorization")[0].InsertBefore(AllowNode, locationNode.SelectNodes("system.web/authorization/deny")[0]);
                    doc.Save(path);
                }
            }
        }

        protected void LinkGridView_DataBound(object sender, EventArgs e)
        {
            int RowSpan = 2;
            for (int i = LinkGridView.Rows.Count - 2; i >= 0; i--)
            {
                GridViewRow currRow = LinkGridView.Rows[i];
                GridViewRow prevRow = LinkGridView.Rows[i + 1];

                if (currRow.Cells[0].Text == prevRow.Cells[0].Text && currRow.Cells[1].Text == prevRow.Cells[1].Text)
                {
                    currRow.Cells[0].RowSpan = RowSpan;
                    prevRow.Cells[0].Visible = false;

                    currRow.Cells[1].RowSpan = RowSpan;
                    prevRow.Cells[1].Visible = false;
                    RowSpan += 1;
                }
                else
                    RowSpan = 2;

            }
        }
    }
}