using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.Access_Authority
{
    public partial class See_Marketing_Report : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        protected void SendSMSButton_Click(object sender, EventArgs e)
        {
            SMS_Class SMS = new SMS_Class();

            bool ValidSMS = true;
            int TotalSMS = 0;
            string PhoneNo = "";
            string Masking = "Tailor BD";

            int SMSBalance = Convert.ToInt32(CustomerListGridView.DataKeys[0]["SMS_Balance"]);

            foreach (GridViewRow Row in CustomerListGridView.Rows)
            {
                CheckBox SMSCheckBox = Row.FindControl("SMSCheckBox") as CheckBox;

                if (SMSCheckBox.Checked)
                {
                    PhoneNo = CustomerListGridView.DataKeys[Row.DataItemIndex % CustomerListGridView.PageSize]["Phone"].ToString();

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
                    if (SMS.SMS_GetBalance() >= TotalSMS)
                    {
                        foreach (GridViewRow Row in CustomerListGridView.Rows)
                        {
                            CheckBox SMSCheckBox = Row.FindControl("SMSCheckBox") as CheckBox;

                            if (SMSCheckBox.Checked)
                            {
                                PhoneNo = CustomerListGridView.DataKeys[Row.DataItemIndex % CustomerListGridView.PageSize]["Phone"].ToString();

                                Guid SMS_Send_ID = SMS.SMS_Send(PhoneNo, SMSTextTextBox.Text, Masking, "Send SMS");

                                FollowUpSQL.InsertParameters["Communication_Mathod"].DefaultValue = "By SMS";
                                FollowUpSQL.InsertParameters["FollowUpDetails"].DefaultValue = SMSTextTextBox.Text;

                                FollowUpSQL.InsertParameters["Marketing_Visited_TailorID"].DefaultValue = CustomerListGridView.DataKeys[Row.DataItemIndex % CustomerListGridView.PageSize]["Marketing_Visited_TailorID"].ToString();
                                FollowUpSQL.Insert();

                               
                            }
                        }

                        SMSTextTextBox.Text = "";
                        ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('আপনার এসএমএস সফলভাবে পাঠানো হয়েছে')", true);
                        CustomerListGridView.DataBind();
                    }
                    else
                    {
                        ErrorLabel.Text = "SMS Service Updating. Try again later or contact to authority";
                    }
            }

        }
    }
}