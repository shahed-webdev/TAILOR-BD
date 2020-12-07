using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Dress.Mesurement_Delete
{
    public partial class Measurement_Serialized : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        protected void PrevPageLinkButton_Click(object sender, EventArgs e)
        {
            Response.Redirect("Delete_Measurement_Type.aspx?dressid=" + Request.QueryString["dressid"] + "&For=" + Request.QueryString["For"]);
        }
    }
}