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
    /// Summary description for Style_Name
    /// </summary>
    public class Style_Name : IHttpHandler
    {

        public void ProcessRequest(HttpContext context)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ToString());
            con.Open();
            SqlCommand cmd = new SqlCommand("select Dress_Style_Image from Dress_Style where Dress_StyleID =" + context.Request.QueryString["Img"] + "", con);
            SqlDataReader reader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (reader.Read())
            {
                if (reader.GetValue(0) != DBNull.Value)
                {
                    if (((Byte[])reader.GetValue(0)).Length != 0)
                    {
                        context.Response.BinaryWrite((Byte[])reader.GetValue(0));
                    }
                    else
                    {
                        context.Response.BinaryWrite(File.ReadAllBytes(context.Server.MapPath("~/CSS/Image/Default/Style.png")));
                    }
                }
                else
                    context.Response.BinaryWrite(File.ReadAllBytes(context.Server.MapPath("~/CSS/Image/Default/Style.png")));
            }
            else
                context.Response.BinaryWrite(File.ReadAllBytes(context.Server.MapPath("~/CSS/Image/Default/Style.png")));

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