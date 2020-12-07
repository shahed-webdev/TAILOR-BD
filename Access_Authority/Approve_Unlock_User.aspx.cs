using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Security;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin
{
    public partial class Approve_Unlock_User : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (!Page.IsPostBack)
            {
                // If querystring value is missing, send the user to ManageUsers.aspx
                string userName = Request.QueryString["user"];
                if (string.IsNullOrEmpty(userName))
                    Response.Redirect("~/Access_Authority/Manage_Users.aspx");


                // Get information about this user
                MembershipUser usr = Membership.GetUser(userName);
                if (usr == null)
                    Response.Redirect("~/Access_Authority/Manage_Users.aspx");

                UserNameLabel.Text = usr.UserName;
                IsApproved.Checked = usr.IsApproved;

                if (usr.LastLockoutDate.Year < 2000)
                    LastLockoutDateLabel.Text = string.Empty;
                else
                    LastLockoutDateLabel.Text = usr.LastLockoutDate.ToShortDateString();

                UnlockUserButton.Enabled = usr.IsLockedOut;
            }
        }

        protected void IsApproved_CheckedChanged(object sender, EventArgs e)
        {
            // Toggle the user's approved status
            string userName = Request.QueryString["user"];
            MembershipUser usr = Membership.GetUser(userName);
            usr.IsApproved = IsApproved.Checked;
            Membership.UpdateUser(usr);

            StatusMessage.Text = "The user's approved status has been updated.";
        }

        protected void UnlockUserButton_Click(object sender, EventArgs e)
        {
            // Unlock the user account
            string userName = Request.QueryString["user"];
            MembershipUser usr = Membership.GetUser(userName);
            usr.UnlockUser();

            UnlockUserButton.Enabled = false;
            StatusMessage.Text = "The user account has been unlocked.";
        }
    }
}