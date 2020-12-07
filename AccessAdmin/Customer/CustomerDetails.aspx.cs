using System;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Customer
{
    public partial class CustomerDetails : System.Web.UI.Page
    {
        SqlConnection con = new SqlConnection(ConfigurationManager.ConnectionStrings["TailorBDConnectionString"].ToString());
        protected void Page_Load(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(Request.QueryString["CustomerID"]) || string.IsNullOrEmpty(Request.QueryString["Cloth_For_ID"]))
            {
                Response.Redirect("CustomerList.aspx");
            }

            if (this.IsPostBack)
                PrevDress();


            if (!this.IsPostBack)
            {
                SqlCommand AccountCmd = new SqlCommand("Select AccountID from Account where InstitutionID = @InstitutionID AND Default_Status = 'True'", con);
                AccountCmd.Parameters.AddWithValue("@InstitutionID", Request.Cookies["InstitutionID"].Value);
                con.Open();
                object AccountID = AccountCmd.ExecuteScalar();
                con.Close();

                if (AccountID != null)
                    AccountDropDownList.SelectedValue = AccountID.ToString();
            }

        }

        protected void SubmitButton_Click(object sender, EventArgs e)
        {
            bool msg = false;

            foreach (DataListItem Item in MeasurementGroupDataList.Items)
            {
                DataList MesasurmentTypeDataList = (DataList)Item.FindControl("MesasurmentTypeDataList");
                foreach (DataListItem itm in MesasurmentTypeDataList.Items)
                {
                    TextBox MeasurmentTextBox = (TextBox)itm.FindControl("MeasurmentTextBox");
                    CustomerMeasurmentSQL.InsertParameters["MeasurementTypeID"].DefaultValue = MesasurmentTypeDataList.DataKeys[itm.ItemIndex].ToString();
                    CustomerMeasurmentSQL.InsertParameters["Measurement"].DefaultValue = MeasurmentTextBox.Text;
                    CustomerMeasurmentSQL.Insert();

                    msg = true;
                }

            }
            #region Add style

            foreach (GridViewRow row in StyleGridView.Rows)
            {
                DataList StylDataList = (DataList)row.FindControl("StylDataList");

                foreach (DataListItem itm in StylDataList.Items)
                {
                    CheckBox StyleCheckBox = (CheckBox)itm.FindControl("StyleCheckBox");
                    TextBox StyleMesureTextBox = (TextBox)itm.FindControl("StyleMesureTextBox");

                    Customer_Dress_StyleSQL.InsertParameters["Checked"].DefaultValue = StyleCheckBox.Checked.ToString();
                    Customer_Dress_StyleSQL.InsertParameters["Dress_StyleID"].DefaultValue = StylDataList.DataKeys[itm.ItemIndex].ToString();
                    Customer_Dress_StyleSQL.InsertParameters["DressStyleMesurement"].DefaultValue = StyleMesureTextBox.Text;
                    Customer_Dress_StyleSQL.Insert();
                }
            }

            Customer_DressSQL.Insert();
            #endregion

            if (msg)
            {
                ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('আপনি সফল ভাবে এই কাস্টমারের মাপ যুক্ত/পরিবর্তন করতে পেরেছেন !')", true);
            }
        }
        protected void DressDropDownList_SelectedIndexChanged(object sender, EventArgs e)
        {
            MeasurementGroupDataList.DataBind();


            if (MeasurementGroupDataList.Items.Count > 0)
            {
                MeasurementGroupDataList.ShowFooter = false;
            }
            else
            {
                MeasurementGroupDataList.ShowFooter = true;
            }

            DataView DetailsDV = new DataView();
            DetailsDV = (DataView)Customer_DressSQL.Select(DataSourceSelectArguments.Empty);
            if (DetailsDV.Count > 0)
            {
                DetailsTextBox.Text = DetailsDV[0]["CDDetails"].ToString();
            }
            else
            {
                DetailsTextBox.Text = "";
            }
            PrevDress();
        }
        protected void DressDropDownList_DataBound(object sender, EventArgs e)
        {
            PrevDress();
        }
        protected void StylDataList_ItemDataBound(object sender, DataListItemEventArgs e)
        {
            CheckBox StyleCheckBox = e.Item.FindControl("StyleCheckBox") as CheckBox;
            Panel AddClass = e.Item.FindControl("AddClass") as Panel;

            if (StyleCheckBox.Checked)
                AddClass.CssClass = "Color";
            else
                AddClass.CssClass = "Style_Input";

        }
        protected void PrintButton_Click(object sender, EventArgs e)
        {
            Response.Redirect("Customer_Mesurement_Print.aspx?" + "CustomerID=" + Request.QueryString["CustomerID"] + "&DressID=" + DressDropDownList.SelectedValue);
        }
        protected void PrevDress()
        {
            foreach (ListItem myItem in DressDropDownList.Items)
            {
                SqlCommand CheckDress_cmd = new SqlCommand("SELECT Measurement_Type.DressID FROM Customer_Measurement INNER JOIN Measurement_Type ON Customer_Measurement.MeasurementTypeID = Measurement_Type.MeasurementTypeID WHERE (Measurement_Type.DressID = @DressID) AND (Customer_Measurement.CustomerID = @CustomerID)", con);
                CheckDress_cmd.Parameters.AddWithValue("@DressID", myItem.Value.ToString());
                CheckDress_cmd.Parameters.AddWithValue("@CustomerID", Request.QueryString["CustomerID"]);
                con.Open();
                object Dress = CheckDress_cmd.ExecuteScalar();
                con.Close();

                if (Dress != null)
                {
                    myItem.Attributes.Add("class", "Dress");
                }
            }
        }

        protected void PaidButton_Click(object sender, EventArgs e)
        {
            bool check_amount = true;

            foreach (GridViewRow row in DueGridView.Rows)
            {
                Label TailorDueAmount = row.FindControl("TailorDueAmount") as Label;
                TextBox DueTextBox = row.FindControl("DueTextBox") as TextBox;
                TextBox DiscountTextBox = row.FindControl("DiscountTextBox") as TextBox;

                double Totaldue = 0;
                double due = 0;
                double discount = 0;

                Double.TryParse(TailorDueAmount.Text, out Totaldue);
                Double.TryParse(DueTextBox.Text, out due);
                Double.TryParse(DiscountTextBox.Text, out discount);

                if (!(Totaldue >= (due + discount)))
                {
                    check_amount = false;
                    row.CssClass = "RowColor";
                }
            }

            if (check_amount)
            {
                bool msg = false;
                foreach (GridViewRow row in DueGridView.Rows)
                {
                    Label TailorDueAmount = row.FindControl("TailorDueAmount") as Label;
                    TextBox DueTextBox = row.FindControl("DueTextBox") as TextBox;
                    TextBox DiscountTextBox = row.FindControl("DiscountTextBox") as TextBox;

                    double Totaldue = 0;
                    double due = 0;
                    double discount = 0;

                    Double.TryParse(TailorDueAmount.Text, out Totaldue);
                    Double.TryParse(DueTextBox.Text, out due);
                    Double.TryParse(DiscountTextBox.Text, out discount);

                    if (Totaldue >= (due + discount))
                    {
                        if (DiscountTextBox.Text != "")
                        {
                            UpdateInsertSQL.UpdateParameters["OrderID"].DefaultValue = DueGridView.DataKeys[row.DataItemIndex % DueGridView.PageSize]["OrderID"].ToString();
                            UpdateInsertSQL.UpdateParameters["Discount"].DefaultValue = DiscountTextBox.Text;
                            UpdateInsertSQL.Update();
                            msg = true;
                        }

                        if (DueTextBox.Text != "")
                        {
                            string Payment_TimeStatus = "";
                            if (DueGridView.DataKeys[row.DataItemIndex % DueGridView.PageSize]["DeliveryStatus"].ToString() == "Pending")
                                Payment_TimeStatus = "Re-Advance";

                            if (DueGridView.DataKeys[row.DataItemIndex % DueGridView.PageSize]["DeliveryStatus"].ToString() == "Delivered")
                                Payment_TimeStatus = "After Delivery";

                            if (DueGridView.DataKeys[row.DataItemIndex % DueGridView.PageSize]["DeliveryStatus"].ToString() == "PartlyDelivered")
                                Payment_TimeStatus = "Partly Delivered";

                            UpdateInsertSQL.InsertParameters["Payment_TimeStatus"].DefaultValue = Payment_TimeStatus;
                            UpdateInsertSQL.InsertParameters["OrderID"].DefaultValue = DueGridView.DataKeys[row.DataItemIndex % DueGridView.PageSize]["OrderID"].ToString();
                            UpdateInsertSQL.InsertParameters["Amount"].DefaultValue = DueTextBox.Text.Trim();
                            UpdateInsertSQL.Insert();
                            msg = true;
                        }
                    }
                    else
                    {
                        row.CssClass = "RowColor";
                    }
                }

                if (msg)
                {
                    DueGridView.DataBind();
                    CustomerOrderdDressGridView.DataBind();
                    TailorPRecordGridView.DataBind();
                    ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('Paid Successfully !')", true);
                }
            }
        }
        protected void AccountDropDownList_DataBound(object sender, EventArgs e)
        {
            AccountDropDownList.Items.Insert(0, new ListItem("Without Account", ""));
        }
        protected void FabricsAccountDropDownList_DataBound(object sender, EventArgs e)
        {
            FabricsAccountDropDownList.Items.Insert(0, new ListItem("Without Account", ""));
        }
        protected void FabricsPaidButton_Click(object sender, EventArgs e)
        {
            bool check_amount = true;
            foreach (GridViewRow row in FabricDueGridView.Rows)
            {
                Label FabricDueLabel = row.FindControl("FabricDueLabel") as Label;
                Label Fab_Discount_Label = row.FindControl("Fab_Discount_Label") as Label;

                TextBox DueTextBox = row.FindControl("FabricsDueTextBox") as TextBox;
                TextBox SellingDiscountTextBox = row.FindControl("SellingDiscountTextBox") as TextBox;

                double Totaldue = 0;
                double due = 0;

                double Pre_discount = 0;
                double discount = 0;

                Double.TryParse(FabricDueLabel.Text, out Totaldue);
                Double.TryParse(DueTextBox.Text, out due);

                if (!((Totaldue + Pre_discount) >= (due + discount)))
                {
                    check_amount = false;
                    row.CssClass = "RowColor";
                }
            }

            if (check_amount)
            {
                bool msg = false;
                foreach (GridViewRow row in FabricDueGridView.Rows)
                {
                    Label FabricDueLabel = row.FindControl("FabricDueLabel") as Label;
                    Label Fab_Discount_Label = row.FindControl("Fab_Discount_Label") as Label;

                    TextBox DueTextBox = row.FindControl("FabricsDueTextBox") as TextBox;
                    TextBox SellingDiscountTextBox = row.FindControl("SellingDiscountTextBox") as TextBox;

                    double Totaldue = 0;
                    double due = 0;

                    double Pre_discount = 0;
                    double discount = 0;


                    Double.TryParse(FabricDueLabel.Text, out Totaldue);
                    Double.TryParse(DueTextBox.Text, out due);

                    Double.TryParse(Fab_Discount_Label.Text, out Pre_discount);
                    Double.TryParse(SellingDiscountTextBox.Text, out discount);

                    if ((Totaldue + Pre_discount) >= (due + discount))
                    {
                        if ((Totaldue + Pre_discount) >= discount)
                        {
                            FabricsDueSQL.UpdateParameters["FabricsSellingID"].DefaultValue = FabricDueGridView.DataKeys[row.DataItemIndex % FabricDueGridView.PageSize]["FabricsSellingID"].ToString();
                            FabricsDueSQL.UpdateParameters["SellingDiscountAmount"].DefaultValue = SellingDiscountTextBox.Text;
                            FabricsDueSQL.Update();
                            msg = true;
                        }

                        if ((Totaldue + Pre_discount - discount) >= due)
                        {
                            if (DueTextBox.Text != "")
                            {
                                SellingPRecordSQL.InsertParameters["FabricsSellingID"].DefaultValue = FabricDueGridView.DataKeys[row.DataItemIndex % FabricDueGridView.PageSize]["FabricsSellingID"].ToString();
                                SellingPRecordSQL.InsertParameters["SellingPaidAmount"].DefaultValue = DueTextBox.Text;
                                SellingPRecordSQL.Insert();
                                msg = true;
                            }
                        }
                    }
                    else
                    {
                        row.CssClass = "RowColor";
                    }
                }

                if (msg)
                {
                    FabricDueGridView.DataBind();
                    ScriptManager.RegisterClientScriptBlock(this, this.GetType(), "alertMessage", "alert('Paid Successfully !')", true);
                }
            }
        }
    }
}