using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Web.Security;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD
{
    public partial class Profile_Redirect : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ToString());
            
            if (!User.Identity.IsAuthenticated)
            {
                Response.Redirect("~/Login.aspx?Invalid=Connection timeout");
            }
            if (Roles.IsUserInRole(User.Identity.Name, "Authority"))//-------------for Authority----------------------------------
            {
                Response.Redirect("~/Access_Authority/Profile.aspx");
            }
            else//-----------------for Others---------------------------------------
            {
                SqlCommand Institution_Validity = new SqlCommand("select Validation from Institution where InstitutionID = @InstitutionID", con);
                Institution_Validity.Parameters.AddWithValue("@InstitutionID", Request.Cookies["InstitutionID"].Value);

                con.Open();
                string Validation = Institution_Validity.ExecuteScalar().ToString();
                con.Close();


                if (Validation == "Valid") //Is School Invalid
                {

                    SqlCommand User_Validity = new SqlCommand("select Validation from Registration where UserName = @UserName", con);
                    User_Validity.Parameters.AddWithValue("@UserName", User.Identity.Name);

                    con.Open();
                    string User_Validation = User_Validity.ExecuteScalar().ToString();
                    con.Close();

                    if (User_Validation == "Valid")  //Is User Invalid
                    {
                        if (Roles.IsUserInRole(User.Identity.Name, "Full-Admin"))
                            Response.Redirect("~/AccessAdmin/Profile.aspx");

                        if (Roles.IsUserInRole(User.Identity.Name, "Admin"))
                            Response.Redirect("~/AccessAdmin/Profile.aspx");

                        if (Roles.IsUserInRole(User.Identity.Name, "Sub-Admin"))
                            Response.Redirect("~/AccessSub_Admin/Sub_Admin_Profile.aspx");
                    }
                    else
                    {
                        FormsAuthentication.SignOut();
                        Response.Redirect("~/Login.aspx?Invalid=User Locked by Admin");
                    }
                }
                else
                {
                    FormsAuthentication.SignOut();
                    Response.Redirect("~/Login.aspx?Invalid=Institution Locked by Authour");
                }
            }
        }
    }
}