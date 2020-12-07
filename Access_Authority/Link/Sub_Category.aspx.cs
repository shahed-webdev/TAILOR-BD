﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Page_Link
{
    public partial class Sub_Category : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (!Page.IsPostBack)
            {
                string Category = Request.QueryString["Category"];
                if (string.IsNullOrEmpty(Category))
                    Response.Redirect("Category.aspx");
            }
        }

        protected void SubmitButton_Click(object sender, EventArgs e)
        {
            SubCategorySQL.Insert();
        }

        protected void CheckBox_CheckedChanged(object sender, EventArgs e)
        {
            if (!string.IsNullOrEmpty(PageURLTextBox.Text))
                LocationTextBox.Text = PageURLTextBox.Text.TrimStart().Remove(0, 2);

            if (!CheckBox.Checked)
                LocationTextBox.Text = string.Empty;
        }

        protected void UrlButton_Click(object sender, EventArgs e)
        {
            Link_PagesSQL.Insert();
        }

        protected void SubCategoryDropDownList_DataBound(object sender, EventArgs e)
        {
            GridViewRow GV = ((DropDownList)sender).Parent.Parent as GridViewRow;

            DropDownList SubCategoryDropDownList = (DropDownList)GV.FindControl("SubCategoryDropDownList");
            SubCategoryDropDownList.Items.Insert(0, new ListItem("[No Sub Category]", ""));
        }

        protected void InsertedLinkGridView_RowUpdating(object sender, GridViewUpdateEventArgs e)
        {
            Link_PagesSQL.UpdateParameters["LinkCategoryID"].DefaultValue = (InsertedLinkGridView.Rows[e.RowIndex].FindControl("CategotyDropDownList") as DropDownList).SelectedValue;
            Link_PagesSQL.UpdateParameters["SubCategoryID"].DefaultValue = (InsertedLinkGridView.Rows[e.RowIndex].FindControl("SubCategoryDropDownList") as DropDownList).SelectedValue;
        }
    }
}