using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD
{
    public partial class Design : System.Web.UI.MasterPage
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }
        protected void LoginStatus1_LoggingOut(object sender, LoginCancelEventArgs e)
        {
            var myCookies = Request.Cookies.AllKeys;
            foreach (var cookie in myCookies)
            {
                Response.Cookies[cookie].Expires = DateTime.Now;
            }

            Session.RemoveAll();
        }
    }
}