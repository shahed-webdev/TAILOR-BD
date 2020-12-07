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

namespace TailorBD.AccessSub_Admin
{
    public partial class Sub_Admin_Profile : System.Web.UI.Page
    {
        protected void AdminFormView_ItemUpdated(object sender, FormViewUpdatedEventArgs e)
        {
            try
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

            catch (HttpException ex)
            {
                ErrorLabel.Text=ex.Message;
            }
        }

        protected void ChangePassword1_ChangedPassword(object sender, EventArgs e)
        {
            LIUSQL.UpdateParameters["Password"].DefaultValue = ChangePassword1.NewPassword;
            LIUSQL.Update();
        }

        protected void InvoiceGridView_RowDataBound(object sender, GridViewRowEventArgs e)
        {
            if (e.Row.Cells[8].Text == "Due")
            {
                e.Row.CssClass = "Due";
            }
            else
            {
                e.Row.CssClass = "Paid";
            }
        }
    }
}