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

namespace TailorBD.Access_Authority.Access_Manage
{
    public partial class Role_Access_Manage : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (!this.IsPostBack)
            {
                BindRolesToList();
            }
        }

        private void BindRolesToList()
        {
            // Get all of the roles
            string[] roles = Roles.GetAllRoles();

            RoleListDropDownList.DataSource = roles;
            RoleListDropDownList.DataBind();
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

        protected void RoleListDropDownList_SelectedIndexChanged(object sender, EventArgs e)
        {
            LinkGridView.DataBind();
            foreach (GridViewRow row in LinkGridView.Rows)
            {
                CheckBox LinkCheckBox = (CheckBox)row.FindControl("LinkCheckBox");

                LinkCheckBox.Checked = CheckRole(LinkGridView.DataKeys[row.DataItemIndex]["Location"].ToString(), RoleListDropDownList.SelectedValue);
            }
        }

        protected void UpdateButton_Click(object sender, EventArgs e)
        {
            foreach (GridViewRow row in LinkGridView.Rows)
            {
                CheckBox LinkCheckBox = (CheckBox)row.FindControl("LinkCheckBox");

                if (LinkCheckBox.Checked)
                {
                    AddRole(LinkGridView.DataKeys[row.DataItemIndex]["Location"].ToString(), RoleListDropDownList.SelectedValue);
                }
                else
                {
                    RemoveRole(LinkGridView.DataKeys[row.DataItemIndex]["Location"].ToString(), RoleListDropDownList.SelectedValue);
                }
            }
        }

        private void AddRole(string Pagepath, string Role)
        {
            string path = Server.MapPath("~/Web.Config");
            XmlDocument doc = new XmlDocument();
            doc.Load(path); XmlNodeList list;
            list = doc.DocumentElement.SelectNodes(string.Format("location[@path='{0}']", Pagepath));

            if (list.Count != 0)
            {
                XmlNode locationNode;
                locationNode = list[0];
                list = locationNode.SelectNodes(string.Format("system.web/authorization/allow[@roles='{0}']", Role));

                if (list.Count == 0)
                {
                    XmlNode AllowNode = doc.CreateNode(XmlNodeType.Element, "allow", null);
                    XmlAttribute attribute = doc.CreateAttribute("roles");
                    attribute.Value = Role;
                    AllowNode.Attributes.Append(attribute);
                    locationNode.SelectNodes("system.web/authorization")[0].InsertBefore(AllowNode, locationNode.SelectNodes("system.web/authorization/deny")[0]);
                    doc.Save(path);
                }
            }
        }

        private void RemoveRole(string Pagepath, string Role)
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
                list = node.SelectNodes(string.Format("system.web/authorization/allow[@roles='{0}']", Role));
                if (list.Count != 0)
                {
                    node = list[0];
                    node.ParentNode.RemoveChild(node);
                    doc.Save(path);
                }
            }
        }

        private bool CheckRole(string Pagepath, string Role)
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
                list = node.SelectNodes(string.Format("system.web/authorization/allow[@roles='{0}']", Role));
                if (list.Count != 0)
                {
                    return true;
                }
                else
                {
                    return false;
                }
            }
            else
            {
                return false;
            }
        }

    }
}