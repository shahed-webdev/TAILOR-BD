using Contracts;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Linq;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.SMS
{
    public partial class Send_SMS : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
          
        }

        protected void SendSMSButton_Click(object sender, EventArgs e)
        {
            SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ToString());
            SMS_Class SMS = new SMS_Class();

            string Msg = SMSTextTextBox.Text;
            bool ValidSMS = true;
            int TotalSMS = 0;
            string PhoneNo = "";
            string Masking = "";
            bool SentMgsConfirm = false;
            int SentMsgCont = 0;

            int SMSBalance = Convert.ToInt32(CustomerListGridView.DataKeys[0]["SMS_Balance"]);

            #region Send SMS to selected Customers
            if (SMSRadioButtonList.SelectedIndex == 0)
            {
                foreach (GridViewRow Row in CustomerListGridView.Rows)
                {
                    CheckBox SMSCheckBox = Row.FindControl("SMSCheckBox") as CheckBox;

                    if (SMSCheckBox.Checked)
                    {
                        PhoneNo = CustomerListGridView.DataKeys[Row.DataItemIndex % CustomerListGridView.PageSize]["Phone"].ToString();
                        Masking = CustomerListGridView.DataKeys[Row.DataItemIndex % CustomerListGridView.PageSize]["Masking"].ToString();

                        Get_Validation IsValid = SMS.SMS_Validation(PhoneNo, Masking, SMSTextTextBox.Text);

                        if (IsValid.Validation)
                        {
                            TotalSMS += SMS.SMS_Conut(SMSTextTextBox.Text);
                        }
                        else
                        {
                            ErrorLabel.Text = IsValid.Message;
                            Row.BackColor = System.Drawing.Color.Red;
                            ValidSMS = false;
                        }
                    }
                }

                if (ValidSMS)
                {
                    if (SMSBalance >= TotalSMS)
                    {
                        if (SMS.SMS_GetBalance() >= TotalSMS)
                        {
                            foreach (GridViewRow Row in CustomerListGridView.Rows)
                            {
                                CheckBox SMSCheckBox = Row.FindControl("SMSCheckBox") as CheckBox;

                                if (SMSCheckBox.Checked)
                                {
                                    PhoneNo = CustomerListGridView.DataKeys[Row.DataItemIndex % CustomerListGridView.PageSize]["Phone"].ToString();
                                    Masking = CustomerListGridView.DataKeys[Row.DataItemIndex % CustomerListGridView.PageSize]["Masking"].ToString();

                                    Guid SMS_Send_ID = SMS.SMS_Send(PhoneNo, SMSTextTextBox.Text, Masking, "Send SMS");

                                    SMS_OtherInfoSQL.InsertParameters["SMS_Send_ID"].DefaultValue = SMS_Send_ID.ToString();
                                    SMS_OtherInfoSQL.InsertParameters["CustomerID"].DefaultValue = CustomerListGridView.DataKeys[Row.DataItemIndex % CustomerListGridView.PageSize]["CustomerID"].ToString();
                                    SMS_OtherInfoSQL.Insert();
                                    SentMsgCont++;
                                    SentMgsConfirm = true;
                                }
                            }

                            SMSTextTextBox.Text = "";
                            if (SentMgsConfirm)
                            {
                                SMSTextTextBox.Text = string.Empty;
                                ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('You Have Successfully Sent " + SentMsgCont.ToString() + " SMS.')", true);
                            }
                            CustomerListGridView.DataBind();
                        }
                        else
                        {
                            ErrorLabel.Text = "SMS Service Updating. Try again later or contact to authority";
                        }
                    }
                    else
                    {
                        ErrorLabel.Text = "আপনার যথেষ্ট এসএমএস ব্যালেন্স নেই, আপনার বর্তমান ব্যালেন্স " + SMSBalance;
                    }
                }
            }
            #endregion

            #region Send SMS to All Customers

            if (SMSRadioButtonList.SelectedIndex == 1)
            {
                con.Open();
                SqlCommand SMScommand = new SqlCommand("SELECT MIN(CustomerID) AS CustomerID, Phone FROM Customer WHERE (InstitutionID = @InstitutionID)  GROUP BY Phone", con);
                SMScommand.Parameters.AddWithValue("@InstitutionID", Request.Cookies["InstitutionID"].Value);
                SqlDataReader SMSDR;

                SMSDR = SMScommand.ExecuteReader();

                while (SMSDR.Read())
                {
                    PhoneNo = SMSDR["Phone"].ToString();
                    Get_Validation IsValid = SMS.SMS_Validation(PhoneNo, Masking, Msg);

                    if (IsValid.Validation)
                    {
                        TotalSMS += SMS.SMS_Conut(Msg);
                    }
                }
                con.Close();


                if (SMSBalance >= TotalSMS)
                {
                    if (SMS.SMS_GetBalance() >= TotalSMS)
                    {

                        con.Open();
                        SMSDR = SMScommand.ExecuteReader();

                        while (SMSDR.Read())
                        {
                            PhoneNo = SMSDR["Phone"].ToString();
                            Get_Validation IsValid = SMS.SMS_Validation(PhoneNo, Masking, Msg);

                            if (IsValid.Validation)
                            {
                                Guid SMS_Send_ID = SMS.SMS_Send(PhoneNo, Msg, Masking, "Send SMS");

                                SMS_OtherInfoSQL.InsertParameters["SMS_Send_ID"].DefaultValue = SMS_Send_ID.ToString();
                                SMS_OtherInfoSQL.InsertParameters["CustomerID"].DefaultValue = SMSDR["CustomerID"].ToString();

                                SMS_OtherInfoSQL.Insert();
                                SentMsgCont++;
                                SentMgsConfirm = true;
                            }
                        }
                        con.Close();
                        if (SentMgsConfirm)
                        {
                            SMSTextTextBox.Text = string.Empty;
                            ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('You Have Successfully Sent " + SentMsgCont.ToString() + " SMS.')", true);
                        }
                    }
                    else
                    {
                        ErrorLabel.Text = "SMS Service Updating. Try again later or contact to authority";
                    }
                }
                else
                {
                    ErrorLabel.Text = "You don't have sufficient (" + TotalSMS + ") SMS balance, Your Current Balance is " + SMSBalance;
                }
            }

            #endregion
        }


        protected void CustomerListSQL_Selected(object sender, SqlDataSourceStatusEventArgs e)
        {
            TotalLabel.Text = "সর্বমোট : " + e.AffectedRows + " জন কাস্টমার পাওয়া গেছে";
        }
    }
}