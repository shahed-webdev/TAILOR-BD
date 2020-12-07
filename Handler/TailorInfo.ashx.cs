using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Web;

namespace TailorBD.Handler
{
    /// <summary>
    /// Summary description for TailorInfo
    /// </summary>
    public class TailorInfo : IHttpHandler
    {

        public void ProcessRequest(HttpContext context)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ToString());
            con.Open();
            SqlCommand cmd = new SqlCommand("select InstitutionLogo from Institution where InstitutionID =" + context.Request.QueryString["Img"] + "", con);
            SqlDataReader reader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (reader.Read())
            {
                if (reader.GetValue(0) != DBNull.Value)
                    context.Response.BinaryWrite((Byte[])reader.GetValue(0));
                else
                    context.Response.BinaryWrite(File.ReadAllBytes(context.Server.MapPath("~/CSS/Image/Default/Logo.png")));
            }
            else
                context.Response.BinaryWrite(File.ReadAllBytes(context.Server.MapPath("~/CSS/Image/Default/Logo.png")));

            reader.Close();
            context.Response.End();
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