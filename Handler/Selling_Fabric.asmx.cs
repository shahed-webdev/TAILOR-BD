using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Web.Services;

namespace TailorBD.Handler
{
    /// <summary>
    /// Summary description for Selling_Fabric
    /// </summary>
    [WebService(Namespace = "http://tempuri.org/")]
    [WebServiceBinding(ConformsTo = WsiProfiles.BasicProfile1_1)]
    [System.ComponentModel.ToolboxItem(false)]
    [System.Web.Script.Services.ScriptService]
    public class Selling_Fabric : System.Web.Services.WebService
    {
        [WebMethod]
        public static string[] GetCustomers(string prefix)
        {
            //HttpCookie InstitutionID = HttpContext.Current.Request.Cookies["InstitutionID"];
            List<string> customers = new List<string>();
            using (SqlConnection conn = new SqlConnection())
            {
                conn.ConnectionString = ConfigurationManager.ConnectionStrings["TailorbdConnectionString"].ConnectionString;
                using (SqlCommand cmd = new SqlCommand())
                {
                    cmd.CommandText = "SELECT Fabrics.FabricCode, Fabrics.FabricsName, Fabrics.SellingUnitPrice, Fabrics.StockFabricQuantity, Fabrics_Mesurement_Unit.UnitName, Fabrics.FabricID, Fabrics.InstitutionID FROM  Fabrics INNER JOIN Fabrics_Mesurement_Unit ON Fabrics.FabricMesurementUnitID = Fabrics_Mesurement_Unit.FabricMesurementUnitID WHERE (Fabrics.InstitutionID = @InstitutionID) AND (Fabrics.StockFabricQuantity <> 0) AND Fabrics.FabricCode like @FabricCode + '%'";
                    cmd.Parameters.AddWithValue("@FabricCode", prefix);
                    cmd.Parameters.AddWithValue("@InstitutionID", "1007");
                    cmd.Connection = conn;
                    conn.Open();
                    using (SqlDataReader sdr = cmd.ExecuteReader())
                    {
                        while (sdr.Read())
                        {
                            customers.Add(string.Format("{0}||{1}||{2}||{3}||{4}||{5}",
                              sdr["FabricCode"],
                              sdr["FabricsName"],
                              Convert.ToString(sdr["SellingUnitPrice"]),
                              Convert.ToString(sdr["StockFabricQuantity"]),
                              sdr["UnitName"],
                              Convert.ToString(sdr["FabricID"])
                              ));
                        }
                    }
                    conn.Close();
                }
            }
            return customers.ToArray();
        }
    }
}
