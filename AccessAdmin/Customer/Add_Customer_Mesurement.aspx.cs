using System;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Drawing;
using System.IO;
using System.Web.Services;

namespace TailorBD.AccessAdmin.Customer
{
    public partial class Add_Customer_Mesurement : System.Web.UI.Page
    {
        SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ToString());
        protected void Page_Load(object sender, EventArgs e)
        {
            if (!this.IsPostBack)
            {
                SqlCommand TotalCustomercmd = new SqlCommand("SELECT [dbo].[CustomeSerialNumber](@InstitutionID)", con);
                TotalCustomercmd.Parameters.AddWithValue("@InstitutionID", Request.Cookies["InstitutionID"].Value);
                con.Open();
                CustomerIDLabel.Text = TotalCustomercmd.ExecuteScalar().ToString();
                con.Close();
            }
        }

        protected void AddButton_Click(object sender, EventArgs e)
        {
            SqlCommand Customer_cmd = new SqlCommand("select * from Customer where InstitutionID = @InstitutionID AND CustomerName = @CustomerName AND Phone = @Phone", con);
            Customer_cmd.Parameters.AddWithValue("@InstitutionID", Request.Cookies["InstitutionID"].Value);
            Customer_cmd.Parameters.AddWithValue("@CustomerName", CustomerNameTextBox.Text.Trim());
            Customer_cmd.Parameters.AddWithValue("@Phone", MobaileTextBox.Text.Trim());

            con.Open();
            object Is_Customer = Customer_cmd.ExecuteScalar();
            con.Close();

            if (Is_Customer == null)
            {
                IsCustomerLabel.Text = "";
                CustomerSQL.Insert();
                InstitutionSQL.Update();

                SqlCommand CustomerIDcmd = new SqlCommand("select IDENT_CURRENT('Customer')", con);

                con.Open();
                string Customerid = CustomerIDcmd.ExecuteScalar().ToString();
                con.Close();

                #region Customer Image

                if (PhotoFileUpload.PostedFile != null && PhotoFileUpload.PostedFile.FileName != "")
                {
                    string strExtension = System.IO.Path.GetExtension(PhotoFileUpload.FileName);
                    if ((strExtension.ToUpper() == ".JPG") | (strExtension.ToUpper() == ".GIF") | (strExtension.ToUpper() == ".PNG"))
                    {
                        // Resize Image Before Uploading to DataBase
                        System.Drawing.Image imageToBeResized = System.Drawing.Image.FromStream(PhotoFileUpload.PostedFile.InputStream);
                        int imageHeight = imageToBeResized.Height;
                        int imageWidth = imageToBeResized.Width;

                        int maxHeight = 300;
                        int maxWidth = 120;

                        imageHeight = (imageHeight * maxWidth) / imageWidth;
                        imageWidth = maxWidth;

                        if (imageHeight > maxHeight)
                        {
                            imageWidth = (imageWidth * maxHeight) / imageHeight;
                            imageHeight = maxHeight;
                        }

                        Bitmap bitmap = new Bitmap(imageToBeResized, imageWidth, imageHeight);
                        System.IO.MemoryStream stream = new MemoryStream();
                        bitmap.Save(stream, System.Drawing.Imaging.ImageFormat.Jpeg);
                        stream.Position = 0;
                        byte[] image = new byte[stream.Length + 1];
                        stream.Read(image, 0, image.Length);


                        // Create SQL Command
                        SqlCommand cmd = new SqlCommand();
                        cmd.CommandText = "UPDATE Customer SET Image = @Image Where InstitutionID = @InstitutionID and CustomerID = @CustomerID";
                        cmd.Parameters.AddWithValue("@InstitutionID", Request.Cookies["InstitutionID"].Value);
                        cmd.Parameters.AddWithValue("@CustomerID", Customerid);
                        cmd.CommandType = CommandType.Text;
                        cmd.Connection = con;

                        SqlParameter UploadedImage = new SqlParameter("@Image", SqlDbType.Image, image.Length);

                        UploadedImage.Value = image;
                        cmd.Parameters.Add(UploadedImage);

                        con.Open();
                        cmd.ExecuteNonQuery();
                        con.Close();

                    }
                }
                #endregion Customer Image

                Response.Redirect("CustomerDetails.aspx?CustomerID=" + Customerid + "&Cloth_For_ID=" + GenderDropDownList.SelectedValue);
            }
            else
            {
                IsCustomerLabel.Text = CustomerNameTextBox.Text.Trim() + ". মোবাইল: " + MobaileTextBox.Text.Trim() + " পূর্বে নিবন্ধিত, পুনরায় নিবন্ধন করা যাবে না";
            }

        }

        [WebMethod]
        public static string CheckMobileNo(string MobileNo, string ID)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ToString());
            string retval = "";
            SqlCommand cmd = new SqlCommand("select top(3) CustomerID from Customer where InstitutionID = @InstitutionID AND Phone = @Phone", con);
            cmd.Parameters.AddWithValue("@InstitutionID", ID.Trim());
            cmd.Parameters.AddWithValue("@Phone", MobileNo.Trim());

            con.Open();
            object dr = cmd.ExecuteScalar();
            con.Close();

            if (dr != null)
            {
                retval = dr.ToString();
            }
            else
            {
                retval = "false";
            }

            return retval;
        }

        [WebMethod]
        public static string Check_Name_Mobile(string Name, string Mobile, string ID)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ToString());
            string retval = "";
            SqlCommand cmd = new SqlCommand("select Top(3) * from Customer where InstitutionID = @InstitutionID AND CustomerName = @CustomerName AND Phone = @Phone", con);
            cmd.Parameters.AddWithValue("@InstitutionID", ID);
            cmd.Parameters.AddWithValue("@CustomerName", Name.Trim());
            cmd.Parameters.AddWithValue("@Phone", Mobile.Trim());

            con.Open();
            object dr = cmd.ExecuteScalar();
            con.Close();

            if (dr != null)
            {
                retval = dr.ToString();
            }
            else
            {
                retval = "false";
            }

            return retval;
        }
    }
}