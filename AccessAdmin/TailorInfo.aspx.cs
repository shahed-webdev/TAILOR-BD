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
    public partial class TailorInfo : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        protected void AdminInfoDetailsView_ItemUpdated(object sender, DetailsViewUpdatedEventArgs e)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ToString());
            FileUpload StudentImageFileUpload = (FileUpload)AdminInfoDetailsView.FindControl("ImageFileUpload");

            if (StudentImageFileUpload.PostedFile != null && StudentImageFileUpload.PostedFile.FileName != "")
            {

                string strExtension = System.IO.Path.GetExtension(StudentImageFileUpload.FileName);
                if ((strExtension.ToUpper() == ".JPG") | (strExtension.ToUpper() == ".GIF") | (strExtension.ToUpper() == ".PNG"))
                {
                    // Resize Image Before Uploading to DataBase
                    System.Drawing.Image imageToBeResized = System.Drawing.Image.FromStream(StudentImageFileUpload.PostedFile.InputStream);
                    int imageHeight = imageToBeResized.Height;
                    int imageWidth = imageToBeResized.Width;

                    int maxHeight = 200;
                    int maxWidth = 200;

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
                    cmd.CommandText = "UPDATE Institution SET InstitutionLogo = @InstitutionLogo Where InstitutionID = @InstitutionID";


                    cmd.Parameters.AddWithValue("@InstitutionID", Request.Cookies["InstitutionID"].Value);
                    cmd.CommandType = CommandType.Text;
                    cmd.Connection = con;

                    SqlParameter UploadedImage = new SqlParameter("@InstitutionLogo", SqlDbType.Image, image.Length);

                    UploadedImage.Value = image;
                    cmd.Parameters.Add(UploadedImage);

                    con.Open();
                    cmd.ExecuteNonQuery();
                    con.Close();

                }
            }

        }
    }
}