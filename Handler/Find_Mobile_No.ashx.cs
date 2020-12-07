using System;
using System.Configuration;
using System.Data.SqlClient;
using System.Text;
using System.Web;

namespace TailorBD.Handler
{
    /// <summary>
    /// Summary description for Find_Mobile_No
    /// </summary>
    public class Find_Mobile_No : IHttpHandler
    {
        public void ProcessRequest(HttpContext context)
        {
            string prefixText = context.Request.QueryString["q"];
            string InstitutionID = context.Request.Cookies["InstitutionID"].Value;

            using (SqlConnection conn = new SqlConnection())
            {
                conn.ConnectionString = ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString;
                using (SqlCommand cmd = new SqlCommand())
                {
                    cmd.CommandText = "select Top(5) Phone from Customer where InstitutionID = @InstitutionID AND Phone  like @Phone + '%'";
                    cmd.Parameters.AddWithValue("@Phone", prefixText);
                    cmd.Parameters.AddWithValue("@InstitutionID", InstitutionID);

                    cmd.Connection = conn;
                    StringBuilder sb = new StringBuilder();
                    conn.Open();

                    using (SqlDataReader sdr = cmd.ExecuteReader())
                    {
                        while (sdr.Read())
                        {
                            sb.Append(sdr["Phone"]).Append(Environment.NewLine);
                        }
                    }
                    conn.Close();

                    if (!string.IsNullOrEmpty(sb.ToString()))
                    {
                        context.Response.Write(sb.ToString());
                    }
                    else
                    {
                        context.Response.Write(" ");
                    }
                }
            }
        }

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }
    }
}