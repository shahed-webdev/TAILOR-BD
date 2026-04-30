using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin
{
    public partial class Profile : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (!IsPostBack)
            {
                LoadDueNotice();
            }
        }

        private void LoadDueNotice()
        {
            HttpCookie institutionCookie = Request.Cookies["InstitutionID"];
            if (institutionCookie == null || string.IsNullOrEmpty(institutionCookie.Value))
                return;

            if (!int.TryParse(institutionCookie.Value, out int institutionID))
                return;

            string connStr = ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ConnectionString;
            using (SqlConnection con = new SqlConnection(connStr))
            {
                string sql = "SELECT COUNT(*) AS DueCount, ISNULL(SUM(Due), 0) AS DueTotal FROM Invoice WHERE InstitutionID = @InstitutionID AND PaymentStatus = 'Due'";
                using (SqlCommand cmd = new SqlCommand(sql, con))
                {
                    cmd.Parameters.AddWithValue("@InstitutionID", institutionID);
                    con.Open();
                    using (SqlDataReader dr = cmd.ExecuteReader())
                    {
                        if (dr.Read())
                        {
                            int dueCount = dr.GetInt32(0);
                            decimal dueTotal = Convert.ToDecimal(dr[1]);

                            if (dueCount > 0)
                            {
                                hfDueCount.Value = dueCount.ToString();
                                hfDueTotal.Value = dueTotal.ToString("F2");

                                DueNoticePanel.Visible = true;
                                ltDueCount.Text = dueCount.ToString();
                                ltDueTotal.Text = dueTotal.ToString("N2");
                            }
                        }
                    }
                }
            }
        }


        protected void AdminFormView_ItemUpdated(object sender, FormViewUpdatedEventArgs e)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ToString());
            FileUpload StudentImageFileUpload = (FileUpload)AdminFormView.FindControl("ImageFileUpload");

            if (StudentImageFileUpload.PostedFile != null && StudentImageFileUpload.PostedFile.FileName != "")
            {

                string strExtension = System.IO.Path.GetExtension(StudentImageFileUpload.FileName);
                if ((strExtension.ToUpper() == ".JPG") | (strExtension.ToUpper() == ".GIF") | (strExtension.ToUpper() == ".PNG"))
                {
                    // Resize Image Before Uploading to DataBase
                    System.Drawing.Image imageToBeResized = System.Drawing.Image.FromStream(StudentImageFileUpload.PostedFile.InputStream);
                    int imageHeight = imageToBeResized.Height;
                    int imageWidth = imageToBeResized.Width;

                    int maxHeight = 300;
                    int maxWidth = 268;

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
                    cmd.CommandText = "UPDATE Registration SET Image = @Image Where RegistrationID = @RegistrationID";


                    cmd.Parameters.AddWithValue("@RegistrationID", Request.Cookies["RegistrationID"].Value);
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
        }

        protected void ChangePassword1_ChangedPassword(object sender, EventArgs e)
        {
            LIUSQL.UpdateParameters["Password"].DefaultValue = ChangePassword1.NewPassword;
            LIUSQL.Update();
        }
    }
}