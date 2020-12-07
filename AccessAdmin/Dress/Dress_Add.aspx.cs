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
    public partial class Add_Dress : System.Web.UI.Page
    {
        SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ToString());
        protected void Page_Load(object sender, EventArgs e)
        {

        }
        protected void DressAddButton_Click(object sender, EventArgs e)
        {
            DressSQL.Insert();

            DressNameTextBox.Text = "";
            SerialNoTextBox.Text = "";

            if (ImageUpload.PostedFile != null && ImageUpload.PostedFile.FileName != "")
            {
                string strExtension = System.IO.Path.GetExtension(ImageUpload.FileName);
                if ((strExtension.ToUpper() == ".JPG") | (strExtension.ToUpper() == ".GIF") | (strExtension.ToUpper() == ".PNG"))
                {
                    // Resize Image Before Uploading to DataBase
                    System.Drawing.Image imageToBeResized = System.Drawing.Image.FromStream(ImageUpload.PostedFile.InputStream);
                    int imageHeight = imageToBeResized.Height;
                    int imageWidth = imageToBeResized.Width;

                    int maxHeight = 400;
                    int maxWidth = 400;

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
                    cmd.CommandText = "UPDATE Dress SET Image = @Image Where InstitutionID = @InstitutionID and DressID = IDENT_CURRENT('Dress')";
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

            ScriptManager.RegisterStartupScript(this, GetType(), "Msg", "Success2();", true);
        }
        protected void DressGridView_RowUpdating(object sender, GridViewUpdateEventArgs e)
        {
            FileUpload DressFileUpload = (FileUpload)DressGridView.Rows[e.RowIndex].FindControl("DressFileUpload");
            
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
                    cmd.CommandText = "UPDATE Dress SET Image = @Image Where DressID = @DressID";
                    cmd.Parameters.AddWithValue("@DressID", DressGridView.DataKeys[e.RowIndex].Value);
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
        protected void DressGridView_RowDeleted(object sender, GridViewDeletedEventArgs e)
        {
            if (e.Exception != null)
            {
                ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('আপনি এই পোষাক টি ডিলেট করতে পারবেন না !! কারণ তা ব্যবহার হয়েছে !')", true);
                e.ExceptionHandled = true;
            }
        }
        protected void UpdateSerialButton_Click(object sender, EventArgs e)
        {
            bool msg = false;
            foreach (GridViewRow row in DressGridView.Rows)
            {
                TextBox DressSerialTextBox = row.FindControl("DressSerialTextBox") as TextBox;

                if (!string.IsNullOrEmpty(DressSerialTextBox.Text))
                {
                    UpdateSerialSQL.UpdateParameters["DressID"].DefaultValue = DressGridView.DataKeys[row.DataItemIndex]["DressID"].ToString();
                    UpdateSerialSQL.UpdateParameters["DressSerial"].DefaultValue = DressSerialTextBox.Text;

                    UpdateSerialSQL.Update();
                    msg = true;
                }
            }
            if (msg)
            {
                DressGridView.DataBind();
                ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('Successfully Updated !')", true);
            }
        }
 
        protected void AddPriceLB_Command(object sender, CommandEventArgs e)
        {
            DNLabel.Text = e.CommandArgument.ToString();
            Mpe.Show();
        }
        protected void AddDressPriceButton_Click(object sender, EventArgs e)
        {
            DressPriceSQL.Insert();
            PriceForTextBox.Text = "";
            PriceTextBox.Text = "";
            ScriptManager.RegisterStartupScript(this, GetType(), "Msg", "Success();", true);
        }

    }
}