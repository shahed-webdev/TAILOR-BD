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

namespace TailorBD.AccessAdmin.Dress
{
    public partial class Style__Design_Add : System.Web.UI.Page
    {
        SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ToString());
        protected void Page_Load(object sender, EventArgs e)
        {
            if (!string.IsNullOrEmpty(Request.QueryString["CName"]))
            {
                if (!Page.IsPostBack)
                {
                    StyleNameLabel.Text = Request.QueryString["CName"];
                }
            }
            else
                Response.Redirect("Dress_Style_Category_Add.aspx");
        }

        protected void AddButton_Click(object sender, EventArgs e)
        {
            Dress_Style_Name_SQL.Insert();
            Style_NameTextBox.Text = string.Empty;
            SerialNoTextBox.Text = string.Empty;


            string strExtension = System.IO.Path.GetExtension(ImageFileUpload.FileName);
            if ((strExtension.ToUpper() == ".JPG") | (strExtension.ToUpper() == ".GIF") | (strExtension.ToUpper() == ".PNG"))
            {
                // Resize Image Before Uploading to DataBase
                System.Drawing.Image imageToBeResized = System.Drawing.Image.FromStream(ImageFileUpload.PostedFile.InputStream);
                int imageHeight = imageToBeResized.Height;
                int imageWidth = imageToBeResized.Width;

                int maxHeight = 300;
                int maxWidth = 150;

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
                cmd.CommandText = "UPDATE Dress_Style SET Dress_Style_Image = @Image Where  InstitutionID = @InstitutionID and Dress_StyleID = IDENT_CURRENT('Dress_Style')";
                cmd.Parameters.AddWithValue("@InstitutionID", Request.Cookies["InstitutionID"].Value);
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
        

        protected void BackLinkButton_Click(object sender, EventArgs e)
        {
            Response.Redirect("~/AccessAdmin/Dress/Dress_Style_Category_Add.aspx?" + "dressid=" + Request.QueryString["dressid"]);
        }

        protected void StyleGridView_RowUpdating(object sender, GridViewUpdateEventArgs e)
        {
            FileUpload DressFileUpload = (FileUpload)StyleGridView.Rows[e.RowIndex].FindControl("StyleFileUpload");

            if (DressFileUpload.PostedFile != null && DressFileUpload.PostedFile.FileName != "")
            {

                string strExtension = System.IO.Path.GetExtension(DressFileUpload.FileName);
                if ((strExtension.ToUpper() == ".JPG") | (strExtension.ToUpper() == ".GIF") | (strExtension.ToUpper() == ".PNG"))
                {
                    // Resize Image Before Uploading to DataBase
                    System.Drawing.Image imageToBeResized = System.Drawing.Image.FromStream(DressFileUpload.PostedFile.InputStream);
                    int imageHeight = imageToBeResized.Height;
                    int imageWidth = imageToBeResized.Width;

                    int maxHeight = 300;
                    int maxWidth = 150;

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
                    cmd.CommandText = "UPDATE Dress_Style SET Dress_Style_Image = @Image Where Dress_StyleID = @Dress_StyleID";
                    cmd.Parameters.AddWithValue("@Dress_StyleID", StyleGridView.DataKeys[e.RowIndex].Value);
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

        protected void StyleGridView_RowDeleted(object sender, GridViewDeletedEventArgs e)
        {
            if (e.Exception == null)
            {
                ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('আপনি স্টাইল টি সফল ভাবে ডিলেট করতে পেরেছেন !')", true);
            }
            else
            {
                ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('আপনি এই স্টাইল টি ডিলেট করতে পারবেন না । কারণ তা ব্যবহার হয়েছে !')", true);
                e.ExceptionHandled = true;
            }
        }

        protected void UpdateSerialButton_Click(object sender, EventArgs e)
        {
            bool msg = false;
            foreach (GridViewRow row in StyleGridView.Rows)
            {
                TextBox StyleSerialTextBox = row.FindControl("StyleSerialTextBox") as TextBox;

                if (!string.IsNullOrEmpty(StyleSerialTextBox.Text))
                {
                    UpdateSerialSQL.UpdateParameters["Dress_StyleID"].DefaultValue = StyleGridView.DataKeys[row.DataItemIndex]["Dress_StyleID"].ToString();
                    UpdateSerialSQL.UpdateParameters["StyleSerial"].DefaultValue = StyleSerialTextBox.Text;

                    UpdateSerialSQL.Update();
                    msg = true;
                }
            }
            if (msg)
            {
                StyleGridView.DataBind();
                ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('Successfully Updated !')", true);
            }
        }



    }
}