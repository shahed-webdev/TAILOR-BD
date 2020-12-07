using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Delivery
{
    public partial class Delivery : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }


        protected void CustomerOrderdDressSQL_Selected(object sender, SqlDataSourceStatusEventArgs e)
        {
            TotalLabel.Text = "সর্বমোট: " + e.AffectedRows + " টি অর্ডার পাওয়া গেছে";
        }

        protected void CustomerOrderdDressGridView_RowDataBound(object sender, GridViewRowEventArgs e)
        {
            if (e.Row.RowType == DataControlRowType.DataRow)
            {
                if (CustomerOrderdDressGridView.DataKeys[e.Row.DataItemIndex % CustomerOrderdDressGridView.PageSize]["DeliveryStatus"].ToString() == "PartlyDelivered")
                {
                    e.Row.CssClass = "P_Complete";

                }

                DateTime OrderDate = Convert.ToDateTime(CustomerOrderdDressGridView.DataKeys[e.Row.DataItemIndex % CustomerOrderdDressGridView.PageSize]["DeliveryDate"].ToString());
                if (OrderDate == DateTime.Today)
                {
                    e.Row.CssClass = "Today";
                }
            }

        }

        protected void OrderNoLinkButton_Command(object sender, CommandEventArgs e)
        {
            NameOrderListSQL.SelectParameters["OrderID"].DefaultValue = e.CommandArgument.ToString();
            Mpe.Show();
        }

        protected void SMSButton_Click(object sender, EventArgs e)
        {
            try
            {
                bool Msg = false;

                #region Completed Work
                foreach (GridViewRow row in CustomerOrderdDressGridView.Rows)
                {
                    CheckBox SMSCheckBox = (CheckBox)row.FindControl("SMSCheckBox");

                    string OrderListSMS = "";
                    if (SMSCheckBox.Checked)
                    {
                        #region Order List GridView
                        GridView OrderListGridView = (GridView)row.FindControl("OrderListGridView");

                        foreach (GridViewRow ListRow in OrderListGridView.Rows)
                        {
                            Label ReadyDressLabel = (Label)ListRow.FindControl("ReadyDressLabel");
                            OrderListSMS += ReadyDressLabel.Text + " p. " + OrderListGridView.DataKeys[ListRow.DataItemIndex]["Dress_Name"].ToString() + ", ";
                        }
                        #endregion

                        if (SMSCheckBox.Checked)
                        {
                            SMS_Class SMS = new SMS_Class();

                            int SMS_Count = 0;
                            string PhoneNo = "";
                            string Masking = "";
                            string TextSMS = "Dear Sir, ";
                            int SMSBalance = Convert.ToInt32(CustomerOrderdDressGridView.DataKeys[0]["SMS_Balance"]);

                            PhoneNo = CustomerOrderdDressGridView.DataKeys[row.DataItemIndex % CustomerOrderdDressGridView.PageSize]["Phone"].ToString();
                            Masking = CustomerOrderdDressGridView.DataKeys[row.DataItemIndex % CustomerOrderdDressGridView.PageSize]["Masking"].ToString();

                            TextSMS += " Your Dress " + OrderListSMS.TrimEnd(',') + " is Ready to Deliver. Order No. " + CustomerOrderdDressGridView.DataKeys[row.DataItemIndex % CustomerOrderdDressGridView.PageSize]["OrderSerialNumber"].ToString();
                            TextSMS += ". " + CustomerOrderdDressGridView.DataKeys[row.DataItemIndex % CustomerOrderdDressGridView.PageSize]["InstitutionName"].ToString();

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
                                        Guid SMS_Send_ID = SMS.SMS_Send(PhoneNo, TextSMS, Masking, "Ready For Delivery");

                                        SMS_OtherInfoSQL.InsertParameters["SMS_Send_ID"].DefaultValue = SMS_Send_ID.ToString();
                                        SMS_OtherInfoSQL.InsertParameters["CustomerID"].DefaultValue = CustomerOrderdDressGridView.DataKeys[row.DataItemIndex % CustomerOrderdDressGridView.PageSize]["CustomerID"].ToString();
                                        SMS_OtherInfoSQL.Insert();
                                        Msg = true;
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
                            #endregion
                        }
                    }
                }
                #endregion

                if (Msg)
                    ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('SMS Sent Successfully!!')", true);
            }
            catch (SqlException ex)
            {
                ErrorLabel.Text = ex.Message;
            }
        }
    }
}