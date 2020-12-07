using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.Access_Authority
{
    public partial class M_Report_Details : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(Request.QueryString["In_ID"]))
            {
                Response.Redirect("AddMarketingReport.aspx");
            }
        }

        protected void SubmitButton_Click(object sender, EventArgs e)
        {
            FollowUpSQL.Insert();

            CommunicationbyTextBox.Text = "";
            Communication_Date_TextBox.Text = "";
            FollowUpDetailsTextBox.Text = "";
            FollowUpRecordGridView.DataBind();
        }
    }
}