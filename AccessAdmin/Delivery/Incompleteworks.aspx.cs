using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Delivery
{
    public partial class Incompleteworks : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            
        }

        protected void CompleteButton_Click(object sender, EventArgs e)
        {
            try
            {
                bool Msg = false;
                string TextMsg = "";

                #region Complete Work
                foreach (GridViewRow row in CustomerOrderdDressGridView.Rows)
                {
                    CheckBox CompleteCheckBox = (CheckBox)row.FindControl("CompleteCheckBox");
                    TextBox StoreDetailsTextBox = (TextBox)row.FindControl("StoreDetailsTextBox");
                    CheckBox SMSCheckBox = (CheckBox)row.FindControl("SMSCheckBox");

                    string OrderListSMS = "";
                    if (CompleteCheckBox.Checked)
                    {
                        #region Order List GridView
                        GridView OrderListGridView = (GridView)row.FindControl("OrderListGridView");
                        bool IS_OrderList_Ckeck = false;
                        foreach (GridViewRow ListRow in OrderListGridView.Rows)
                        {
                            CheckBox OrderListCheckBox = (CheckBox)ListRow.FindControl("OrderListCheckBox");
                            TextBox PendingWorkTextBox = (TextBox)ListRow.FindControl("PendingWorkTextBox");
                            if (OrderListCheckBox.Checked)
                            {
                                if (string.IsNullOrEmpty(PendingWorkTextBox.Text))
                                {
                                    PendingWorkTextBox.Text = "0";
                                }
                                else
                                {
                                    OrderListSMS += PendingWorkTextBox.Text + " টি " + OrderListGridView.DataKeys[ListRow.DataItemIndex]["Dress_Name"].ToString() + ", ";
                                }

                                CustomerOrderdDressSQL.UpdateParameters["OrderID"].DefaultValue = CustomerOrderdDressGridView.DataKeys[row.DataItemIndex % CustomerOrderdDressGridView.PageSize]["OrderID"].ToString();
                                CustomerOrderdDressSQL.UpdateParameters["StoreDatails"].DefaultValue = StoreDetailsTextBox.Text;
                                CustomerOrderdDressSQL.Update();

                                Order_WorkComplete_DateSQL.InsertParameters["OrderID"].DefaultValue = CustomerOrderdDressGridView.DataKeys[row.DataItemIndex % CustomerOrderdDressGridView.PageSize]["OrderID"].ToString();
                                Order_WorkComplete_DateSQL.InsertParameters["WCQuantity"].DefaultValue = PendingWorkTextBox.Text;
                                Order_WorkComplete_DateSQL.InsertParameters["OrderListID"].DefaultValue = OrderListGridView.DataKeys[ListRow.DataItemIndex]["OrderListID"].ToString();
                                Order_WorkComplete_DateSQL.Insert();

                                TextMsg = "অর্ডারের কাজ সফলভাবে সম্পূর্ণ হয়েছে";
                                Msg = true;
                                IS_OrderList_Ckeck = true;
                            }
                        }
                        #endregion

                        if (SMSCheckBox.Checked)
                        {
                            if (IS_OrderList_Ckeck)
                            {
                                SMS_Class SMS = new SMS_Class();

                                int SMS_Count = 0;
                                string PhoneNo = "";
                                string Masking = "";
                                string TextSMS = "প্রিয় গ্রাহক, ";
                                int SMSBalance = Convert.ToInt32(CustomerOrderdDressGridView.DataKeys[0]["SMS_Balance"]);

                                PhoneNo = CustomerOrderdDressGridView.DataKeys[row.DataItemIndex % CustomerOrderdDressGridView.PageSize]["Phone"].ToString();
                                Masking = CustomerOrderdDressGridView.DataKeys[row.DataItemIndex % CustomerOrderdDressGridView.PageSize]["Masking"].ToString();

                                TextSMS += "আপনার অর্ডারকৃত " + OrderListSMS.TrimEnd(',') + " তৈরি হয়েছে। অর্ডার নং " + CustomerOrderdDressGridView.DataKeys[row.DataItemIndex % CustomerOrderdDressGridView.PageSize]["OrderSerialNumber"].ToString();
                                TextSMS += "। " + CustomerOrderdDressGridView.DataKeys[row.DataItemIndex % CustomerOrderdDressGridView.PageSize]["InstitutionName"].ToString();

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
                                            Guid SMS_Send_ID = SMS.SMS_Send(PhoneNo, TextSMS, Masking, "Completed Work");

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
                                #endregion
                            }
                        }
                    }
                }
                #endregion

                if (Msg)
                    ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('" + TextMsg + "')", true);
            }
            catch (SqlException ex)
            {
                ErrorLabel.Text = ex.Message;
            }
        }

        protected void CustomerOrderdDressSQL_Selected(object sender, SqlDataSourceStatusEventArgs e)
        {
            TotalLabel.Text = "সর্বমোট: " + e.AffectedRows + " টি অর্ডারের কাজ অসম্পুন্ন অবস্থায় আছে";
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

        protected void OrderNoLinkButton_Command(object sender, CommandEventArgs e)
        {
            NameOrderListSQL.SelectParameters["OrderID"].DefaultValue = e.CommandArgument.ToString();
            Mpe.Show();
        }
    }
}