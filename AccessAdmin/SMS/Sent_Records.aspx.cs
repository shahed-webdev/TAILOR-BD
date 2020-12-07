using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.SMS
{
    public partial class Sent_Records : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (!Page.IsPostBack)
            {
                DataView dv = (DataView)SendRecordSQL.Select(DataSourceSelectArguments.Empty);
                TotalSMSLabel.Text = "Total Sent: " + dv.Count.ToString();
            }
        }

        protected void FindButton_Click(object sender, EventArgs e)
        {
            DataView dv = (DataView)SendRecordSQL.Select(DataSourceSelectArguments.Empty);
            TotalSMSLabel.Text = "Total Sent: " + dv.Count.ToString();
        } 
    }
}