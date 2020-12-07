using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Order
{
    public partial class Change_Delivery_Date : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        protected void ChangeDateButton_Click(object sender, EventArgs e)
        {
            bool Is_Changed = false;
            foreach (GridViewRow row in CustomerOrderdDressGridView.Rows)
            {
                CheckBox CompleteCheckBox = (CheckBox)row.FindControl("CompleteCheckBox");
                CheckBox SMSCheckBox = (CheckBox)row.FindControl("SMSCheckBox");

                if (CompleteCheckBox.Checked)
                {
                    if (ChangedD_DateTextBox.Text != "")
                    {
                        CustomerOrderdDressSQL.UpdateParameters["OrderID"].DefaultValue = CustomerOrderdDressGridView.DataKeys[row.DataItemIndex % CustomerOrderdDressGridView.PageSize]["OrderID"].ToString();
                        CustomerOrderdDressSQL.Update();
                        Is_Changed = true;
                    }

                    #region SMS

                    if (SMSCheckBox.Checked)
                    {
                        string OrderListSMS = "";
                        GridView OrderListGridView = (GridView)row.FindControl("OrderListGridView");
                        foreach (GridViewRow ListRow in OrderListGridView.Rows)
                        {
                            Label Pending_WorkLabel = (Label)ListRow.FindControl("Pending_WorkLabel");
                            OrderListSMS += Pending_WorkLabel.Text + " টি " + OrderListGridView.DataKeys[ListRow.DataItemIndex]["Dress_Name"].ToString() + ",";
                        }

                        SMS_Class SMS = new SMS_Class();

                        int SMS_Count = 0;
                        string PhoneNo = "";
                        string Masking = "";
                        string TextSMS = "সম্মানিত গ্রাহক";
                        int SMSBalance = Convert.ToInt32(CustomerOrderdDressGridView.DataKeys[0]["SMS_Balance"]);

                        PhoneNo = CustomerOrderdDressGridView.DataKeys[row.DataItemIndex % CustomerOrderdDressGridView.PageSize]["Phone"].ToString();
                        Masking = CustomerOrderdDressGridView.DataKeys[row.DataItemIndex % CustomerOrderdDressGridView.PageSize]["Masking"].ToString();

                        TextSMS += " আপনার অর্ডার কৃত " + OrderListSMS.TrimEnd(',') + " এর ডেলিভারির তারিখ পরিবর্তন হয়েছে। পরিবর্তিত তারিখ " + ChangedD_DateTextBox.Text.Trim() + ". আপনার বিশ্বস্ত: " + CustomerOrderdDressGridView.DataKeys[row.DataItemIndex % CustomerOrderdDressGridView.PageSize]["InstitutionName"].ToString();

                        #region Is_All_SMS_Valid

                        Get_Validation IsValid = SMS.SMS_Validation(PhoneNo, Masking, TextSMS);
                        if (IsValid.Validation)
                        {
                            SMS_Count = SMS.SMS_Conut(TextSMS);

                            #region Send_SMS
                            if (SMSBalance >= SMS_Count)
                            {
                                if (SMS.SMS_GetBalance() >= SMS_Count)
                                {
                                    Guid SMS_Send_ID = SMS.SMS_Send(PhoneNo, TextSMS, Masking, "Delivery Date Change");

                                    SMS_OtherInfoSQL.InsertParameters["SMS_Send_ID"].DefaultValue = SMS_Send_ID.ToString();
                                    SMS_OtherInfoSQL.InsertParameters["CustomerID"].DefaultValue = CustomerOrderdDressGridView.DataKeys[row.DataItemIndex % CustomerOrderdDressGridView.PageSize]["CustomerID"].ToString();
                                    SMS_OtherInfoSQL.Insert();

                                }
                                else
                                {
                                    ErrorLabel.Text = "SMS Service Updating. Try again later or contact to authourity";
                                }
                            }
                            else
                            {
                                ErrorLabel.Text = "You don't have suficient SMS balance, Your Current Balance is " + SMSBalance;
                            }
                            #endregion
                        }
                        else
                        {
                            ErrorLabel.Text = IsValid.Message;
                            row.BackColor = System.Drawing.Color.Red;
                        }
                        #endregion Send SMS
                    }
                    #endregion SMS
                }
            }

            if (Is_Changed)
            { ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('ডেলিভারির তারিখ সফলভাবে পরিবর্তন হয়েছে')", true); }
        }

        protected void CustomerOrderdDressGridView_RowDataBound(object sender, GridViewRowEventArgs e)
        {
            if (e.Row.RowType == DataControlRowType.DataRow)
            {
                if (CustomerOrderdDressGridView.DataKeys[e.Row.DataItemIndex % CustomerOrderdDressGridView.PageSize]["WorkStatus"].ToString() == "PartlyCompleted")
                {
                    e.Row.CssClass = "P_Complete";

                }

                DateTime OrderDate = Convert.ToDateTime(CustomerOrderdDressGridView.DataKeys[e.Row.DataItemIndex % CustomerOrderdDressGridView.PageSize]["DeliveryDate"].ToString());
                if (OrderDate == DateTime.Today)
                {
                    e.Row.CssClass = "Today";
                }

                if (OrderDate < DateTime.Today)
                {
                    e.Row.CssClass = "Over_Today";
                }
            }
        }
    }
}