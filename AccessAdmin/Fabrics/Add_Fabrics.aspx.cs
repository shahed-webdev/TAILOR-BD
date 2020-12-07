using System;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Drawing;
using System.IO;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Fabrics
{
    public partial class Add_Fabrics : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        protected void SubmitButton_Click(object sender, EventArgs e)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ToString());
            FabricSQL.Insert();

            if (ImageFileUpload.PostedFile != null && ImageFileUpload.PostedFile.FileName != "")
            {

                string strExtension = System.IO.Path.GetExtension(ImageFileUpload.FileName);
                if ((strExtension.ToUpper() == ".JPG") | (strExtension.ToUpper() == ".GIF") | (strExtension.ToUpper() == ".PNG"))
                {
                    // Resize Image Before Uploading to DataBase
                    System.Drawing.Image imageToBeResized = System.Drawing.Image.FromStream(ImageFileUpload.PostedFile.InputStream);
                    int imageHeight = imageToBeResized.Height;
                    int imageWidth = imageToBeResized.Width;

                    int maxHeight = 300;
                    int maxWidth = 300;

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
                    cmd.CommandText = "UPDATE Fabrics SET FabricImage = @Image Where InstitutionID = @InstitutionID and FabricID = (SELECT IDENT_CURRENT('Fabrics'))";
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

            ScriptManager.RegisterStartupScript(this, GetType(), "Msg", "Success();", true);
        }

        protected void Mesurement_UnitDropDownList_DataBound(object sender, EventArgs e)
        {
            Mesurement_UnitDropDownList.Items.Insert(0, new ListItem("[ SELECT ]", "0"));
        }

        protected void FabricsCategoryDropDownList_DataBound(object sender, EventArgs e)
        {
            FabricsCategoryDropDownList.Items.Insert(0, new ListItem("[ Category ]", "0"));
        }

        protected void FabricsBrandDropDownList_DataBound(object sender, EventArgs e)
        {
            FabricsBrandDropDownList.Items.Insert(0, new ListItem("[ Brand ]", "0"));
        }

        protected void FabricSQL_Inserted(object sender, SqlDataSourceStatusEventArgs e)
        {
            ErrorLabel.Text = e.Command.Parameters["@ERROR"].Value.ToString();
            FabricGridView.DataBind();
        }

        protected void FabricGridView_RowUpdating(object sender, GridViewUpdateEventArgs e)
        {
            GridViewRow row = FabricGridView.Rows[e.RowIndex];
            var stockTextbox = row.FindControl("Stock_TextBox") as TextBox;
            var StockLabel = row.FindControl("StockLabel") as Label;
            double stock;
            double adjustment;


            if (double.TryParse(StockLabel.Text, out stock) && double.TryParse(stockTextbox.Text, out adjustment))
            {
                if (stock + adjustment < 0)
                {
                    adjustment = 0;
                }
            }
            else
            {
                adjustment = 0;
            }

            FabricSQL.UpdateParameters["Stock_Adjustment"].DefaultValue = adjustment.ToString();

        }
    }
}