using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Web.Services;
using System.Web.UI;
using System.Web.UI.WebControls;
using TailorBD.AccessAdmin.quick_order.ViewModels;

namespace TailorBD.AccessAdmin.quick_order
{
    public partial class FabricSelling : Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        //post order
        [WebMethod]
        public static ResponseModel<int> PostOrder(FabricSellingModel model)
        {
            try
            {
                var institutionId = Convert.ToInt32(HttpContext.Current.Request.Cookies["InstitutionID"]?.Value);
                var registrationId = Convert.ToInt32(HttpContext.Current.Request.Cookies["RegistrationID"]?.Value);
                var fabricsSellingId = 0;
                
                //Insert order List
                using (var con = new SqlConnection())
                {
                    con.ConnectionString = ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString;
                    using (var cmd = new SqlCommand())
                    {
                        cmd.CommandText = @"SP_Fabrics_Sell";
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Connection = con;

                        cmd.Parameters.AddWithValue("@InstitutionID", institutionId);
                        cmd.Parameters.AddWithValue("@RegistrationID", registrationId);

                        cmd.Parameters.AddWithValue("@AccountID", model.AccountID);
                        cmd.Parameters.AddWithValue("@CustomerID", (object)model.CustomerID ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@SellingPaidAmount", model.SellingPaidAmount);
                        cmd.Parameters.AddWithValue("@SellingDiscountAmount", model.SellingDiscountAmount);
                        cmd.Parameters.AddWithValue("@FabricList", model.FabricList);

                        con.Open();
                        fabricsSellingId = Convert.ToInt32(cmd.ExecuteScalar());
                        con.Close();
                    }
                }

                return new ResponseModel<int>(true, "Success", fabricsSellingId);
            }
            catch (Exception e)
            {
                return new ResponseModel<int>(false, e.Message);
            }
        }
    }
}