using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Xml;

namespace TailorBD.Access_Authority.Access_Manage
{
    public partial class Admin_Access_Manage : System.Web.UI.Page
    {
        SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ToString());
        protected void Page_Load(object sender, EventArgs e)
        {

        }
        protected void UserListDropDownList_SelectedIndexChanged(object sender, EventArgs e)
        {
            con.Open();
            LinkGridView.DataBind();
            foreach (GridViewRow row in LinkGridView.Rows)
            {
                CheckBox LinkCheckBox = (CheckBox)row.FindControl("LinkCheckBox");

                SqlCommand LinkCmd = new SqlCommand("select LinkID from Link_Users where UserName = @UserName and LinkID = @LinkID", con);
                LinkCmd.Parameters.AddWithValue("@UserName", UserListDropDownList.SelectedValue);
                LinkCmd.Parameters.AddWithValue("@LinkID", LinkGridView.DataKeys[row.DataItemIndex].Value.ToString());

                object CheckPages = LinkCmd.ExecuteScalar();

                if (CheckPages != null)
                {
                    LinkCheckBox.Checked = true;
                }
            }
            con.Close();

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

        protected void UpdateButton_Click(object sender, EventArgs e)
        {
            SqlCommand RegIDCmd = new SqlCommand("select RegistrationID from Registration where UserName = @UserName", con);
            RegIDCmd.Parameters.AddWithValue("@UserName", UserListDropDownList.SelectedValue);

            con.Open();
            string RegistrationID = RegIDCmd.ExecuteScalar().ToString();
            con.Close();

            foreach (GridViewRow row in LinkGridView.Rows)
            {
                CheckBox LinkCheckBox = (CheckBox)row.FindControl("LinkCheckBox");

                if (LinkCheckBox.Checked)
                {
                    UpdateLinkSQL.InsertParameters["LinkID"].DefaultValue = LinkGridView.DataKeys[row.DataItemIndex]["LinkID"].ToString();
                    UpdateLinkSQL.InsertParameters["RegistrationID"].DefaultValue = RegistrationID;
                    UpdateLinkSQL.Insert();

                    AddUser(LinkGridView.DataKeys[row.DataItemIndex]["Location"].ToString(), UserListDropDownList.SelectedValue);
                }
                else
                {
                    UpdateLinkSQL.DeleteParameters["LinkID"].DefaultValue = LinkGridView.DataKeys[row.DataItemIndex]["LinkID"].ToString();
                    UpdateLinkSQL.Delete();

                    RemoveUser(LinkGridView.DataKeys[row.DataItemIndex]["Location"].ToString(), UserListDropDownList.SelectedValue);
                }
            }
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

        private void RemoveUser(string Pagepath, string users)
        {
            string path = Server.MapPath("~/Web.Config");
            XmlDocument doc = new XmlDocument();
            doc.Load(path);
            XmlNode node;
            XmlNodeList list;

            list = doc.DocumentElement.SelectNodes(string.Format("location[@path='{0}']", Pagepath));

            if (list.Count != 0)
            {
                node = list[0];
                list = node.SelectNodes(string.Format("system.web/authorization/allow[@users='{0}']", users));
                if (list.Count != 0)
                {
                    node = list[0];
                    node.ParentNode.RemoveChild(node);
                    doc.Save(path);
                }
            }
        }
    }
}
