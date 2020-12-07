using System;
using System.Configuration;
using System.Data.SqlClient;
using System.Web.Security;
using System.Web.UI;

namespace TailorBD
{
    public partial class Login : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (!Page.IsPostBack)
            {
                try
                {
                    if (Request.QueryString["Invalid"] != null)
                        InvalidErrorLabel.Text = Request.QueryString["Invalid"].ToString();
                }
                catch { }
            }


            if (User.Identity.IsAuthenticated) //Is user loged in, user not able to run login page redirect to profile page
            {
                Response.Redirect("~/Profile_Redirect.aspx");
            }
        }


        protected void CustomerLogin_LoginError(object sender, EventArgs e)
        {
            MembershipUser usrInfo = Membership.GetUser(CustomerLogin.UserName);
            if (usrInfo != null)
            {
                if (usrInfo.IsLockedOut)
                {
                    CustomerLogin.FailureText = " আপনারর একাউন্ট টি লক হয়ে গেছে কারন আপনি অনেক বার ভূল ইউজার আইডি পাসওর্য়াড দিয়েছেন । আপনার একাউন্ট টি আনলক করার জন্য অনুগ্রহ করে কর্তৃপক্ষের সাথে যোগাযোগ করুন.";
                }
                else if (!usrInfo.IsApproved)
                {
                    CustomerLogin.FailureText = "আপনারর একাউন্ট টি এখনো অনুমোদিত হয়নি. আপনারর একাউন্ট টি যতক্ষন অনুমোদিত না হবে ততক্ষন আপনি লগইন করতে পারবেন না.";
                }
            }
            else
            {
                CustomerLogin.FailureText = "আপনার ইউজার আইডি অথবা পাসওর্য়াড সঠিক হয়নি";
            }
        }

        protected void CustomerLogin_LoggedIn(object sender, EventArgs e)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ToString());
            if (Roles.IsUserInRole(CustomerLogin.UserName, "Authority"))//for Authority
            {
                SqlCommand RegistrationIDcmd = new SqlCommand("select RegistrationID from Registration where UserName =  @UserName", con);
                RegistrationIDcmd.Parameters.AddWithValue("@UserName", CustomerLogin.UserName);

                con.Open();
                Response.Cookies["RegistrationID"].Value = RegistrationIDcmd.ExecuteScalar().ToString();
                con.Close();
            }
            else//For Others
            {
                SqlCommand InstitutionID_cmd = new SqlCommand("select InstitutionID from Registration where UserName = @UserName", con);
                InstitutionID_cmd.Parameters.AddWithValue("@UserName", CustomerLogin.UserName);

                con.Open();
                string InstitutionID = InstitutionID_cmd.ExecuteScalar().ToString();
                con.Close();

                SqlCommand InstitutionName_cmd = new SqlCommand("select InstitutionName from Institution where InstitutionID = @InstitutionID", con);
                InstitutionName_cmd.Parameters.AddWithValue("@InstitutionID", InstitutionID);

                SqlCommand RegistrationIDcmd = new SqlCommand("select RegistrationID from Registration where UserName =  @UserName", con);
                RegistrationIDcmd.Parameters.AddWithValue("@UserName", CustomerLogin.UserName);

                con.Open();
                Response.Cookies["InstitutionID"].Value = InstitutionID;
                Response.Cookies["Institution_Name"].Value = InstitutionName_cmd.ExecuteScalar().ToString();

                string RegistrationID = Response.Cookies["RegistrationID"].Value = RegistrationIDcmd.ExecuteScalar().ToString();
                con.Close();
            }
        }
    }
}