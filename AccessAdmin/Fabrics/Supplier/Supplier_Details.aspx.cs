using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Fabrics.Supplier
{
    public partial class Supplier_Details : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(Request.QueryString["f_S_ids"]))
            {
                Response.Redirect("Add_Supplier.aspx");
            }

            if (!this.IsPostBack)
            {
                SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ToString());
                SqlCommand AccountCmd = new SqlCommand("Select AccountID from Account where InstitutionID = @InstitutionID AND Default_Status = 'True'", con);
                AccountCmd.Parameters.AddWithValue("@InstitutionID", Request.Cookies["InstitutionID"].Value);
                con.Open();
                object AccountID = AccountCmd.ExecuteScalar();
                con.Close();

                if (AccountID != null)
                    AccountDropDownList.SelectedValue = AccountID.ToString();

                try
                {
                    SupplierSQL.SelectParameters["FabricsSupplierID"].DefaultValue = Decrypt(HttpUtility.UrlDecode(Request.QueryString["f_S_ids"]));
                    Due_PaidSQL.SelectParameters["FabricsSupplierID"].DefaultValue = Decrypt(HttpUtility.UrlDecode(Request.QueryString["f_S_ids"]));
                }
                catch { Response.Redirect("Add_Supplier.aspx"); }

            }
        }
        protected void AccountDropDownList_DataBound(object sender, EventArgs e)
        {
            AccountDropDownList.Items.Insert(0, new ListItem("Without Account", ""));
        }
        protected void PaidDueAmountButton_Click(object sender, EventArgs e)
        {
            bool isPaid = false;
            foreach (GridViewRow row in DUeGridView.Rows)
            {
                TextBox DuePaidTextBox = (TextBox)row.FindControl("DuePaidTextBox");
                

                if (DuePaidTextBox.Text.Trim() != "" || DuePaidTextBox.Text.Trim() == "0")
                {
                    double Due = 0;
                    double Paid = 0;
                    Double.TryParse(DuePaidTextBox.Text, out Paid);
                    Double.TryParse(DUeGridView.DataKeys[row.DataItemIndex]["BuyingDueAmount"].ToString(), out Due);

                    if (Due >= Paid)
                    {
                        Buying_PaymentRecordSQL.InsertParameters["BuyingPaidAmount"].DefaultValue = DuePaidTextBox.Text.Trim();
                        Buying_PaymentRecordSQL.InsertParameters["FabricBuyingID"].DefaultValue = DUeGridView.DataKeys[row.DataItemIndex]["FabricBuyingID"].ToString();
                        Buying_PaymentRecordSQL.InsertParameters["FabricsSupplierID"].DefaultValue = Decrypt(HttpUtility.UrlDecode(Request.QueryString["f_S_ids"]));
                        Buying_PaymentRecordSQL.Insert();
                        isPaid = true;
                    }
                    else 
                    {
                        row.CssClass = "RowColor";
                    }
                }
            }

            if (isPaid)
            {
                DUeGridView.DataBind();
                ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('Successfully Paid!')", true);
            }
        }
        private string Decrypt(string cipherText)
        {
            string EncryptionKey = "MAKV2SPBNI99212";
            cipherText = cipherText.Replace(" ", "+");
            byte[] cipherBytes = Convert.FromBase64String(cipherText);
            using (Aes encryptor = Aes.Create())
            {
                Rfc2898DeriveBytes pdb = new Rfc2898DeriveBytes(EncryptionKey, new byte[] { 0x49, 0x76, 0x61, 0x6e, 0x20, 0x4d, 0x65, 0x64, 0x76, 0x65, 0x64, 0x65, 0x76 });
                encryptor.Key = pdb.GetBytes(32);
                encryptor.IV = pdb.GetBytes(16);
                using (MemoryStream ms = new MemoryStream())
                {
                    using (CryptoStream cs = new CryptoStream(ms, encryptor.CreateDecryptor(), CryptoStreamMode.Write))
                    {
                        cs.Write(cipherBytes, 0, cipherBytes.Length);
                        cs.Close();
                    }
                    cipherText = Encoding.Unicode.GetString(ms.ToArray());
                }
            }
            return cipherText;
        }
    }
}