using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD
{
    public partial class Default : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        protected void SubmitButton_Click(object sender, EventArgs e)
        {
            Web_MsgSQL.Insert();
            ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('You Have Successfully Sent Message')", true);
        }
    }
}