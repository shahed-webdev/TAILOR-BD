<%@ Page Title="কাপড় ক্রয় করুন" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Fabric_Buying.aspx.cs" Inherits="TailorBD.AccessAdmin.Fabrics.Buying.Fabric_Buying" %>

<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="asp" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <link href="../../../JS/DatePicker/jquery.datepick.css" rel="stylesheet" />
   <link href="../../../JS/jq_Profile/css/Profile_jquery-ui-1.8.23.custom.css" rel="stylesheet" />
   <style>
      .Amnt { color: #265496; font-weight: bold; font-size: 14px;}
      .RTextbox { display: none; border: 1px solid #c4c4c4; width: 183px; font-size: 13px; padding: 5px; border-radius: 4px; box-shadow: 0px 0px 8px #d9d9d9; }
      .QPTextbox { border: 1px solid #c4c4c4; width: 183px; font-size: 13px; padding: 5px; border-radius: 4px; box-shadow: 0px 0px 8px #d9d9d9; }
      .textbox, .Datetime { width: 195px; }
      .AlnW { width: 145px; }
      .Amount_Msg { color: #316418; font-size: 13px; font-weight: bold; }
      .SPl { cursor: pointer; }
      .mGrid { width: auto; }
      .ui-autocomplete { background-color: #fff; cursor: default; max-height: 200px; overflow: auto; position: absolute; border: 1px solid #ddd; box-shadow: 2px 2px 5px #ebebeb; }
      .ui-menu-item { border-bottom: 1px solid #ddd; }
      .ui-menu-item:hover { border-bottom: 1px solid #ddd; }
   </style>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <asp:ToolkitScriptManager ID="TSM" runat="server" />
   <h3><asp:RadioButtonList ID="OldNewRadioButtonList" runat="server" RepeatDirection="Horizontal" OnSelectedIndexChanged="OldNewRadioButtonList_SelectedIndexChanged" AutoPostBack="True">
         <asp:ListItem Selected="True">নতুন কাপড় ক্রয় করুন</asp:ListItem>
         <asp:ListItem>পুরাতন কাপড় ক্রয় করুন</asp:ListItem>
      </asp:RadioButtonList></h3>

   <asp:Panel ID="NewPanel" runat="server">
      <table>
         <tr>
            <td>ইউনিট</td>
            <td>
               <asp:DropDownList ID="Mesurement_UnitDropDownList" runat="server" CssClass="dropdown" DataSourceID="Mesurement_UnitSQL" DataTextField="UnitName" DataValueField="FabricMesurementUnitID" OnDataBound="Mesurement_UnitDropDownList_DataBound">
               </asp:DropDownList>
               <asp:SqlDataSource ID="Mesurement_UnitSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM [Fabrics_Mesurement_Unit] WHERE ([InstitutionID] = @InstitutionID)">
                  <SelectParameters>
                     <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                  </SelectParameters>
               </asp:SqlDataSource>
               <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="Mesurement_UnitDropDownList" CssClass="EroorSummer" ErrorMessage="Select" InitialValue="0" ValidationGroup="1"></asp:RequiredFieldValidator>
            </td>
         </tr>
         <tr>
            <td>কাপড়ের ক্যাটাগরী</td>
            <td>
               <asp:DropDownList ID="FabricsCategoryDropDownList" runat="server" CssClass="dropdown" DataSourceID="FabricCategorySQL" DataTextField="FabricsCategoryName" DataValueField="FabricsCategoryID" OnDataBound="FabricsCategoryDropDownList_DataBound">
               </asp:DropDownList>
               <asp:SqlDataSource ID="FabricCategorySQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM [Fabrics_Category] WHERE ([InstitutionID] = @InstitutionID)">
                  <SelectParameters>
                     <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                  </SelectParameters>
               </asp:SqlDataSource>
            </td>
         </tr>
         <tr>
            <td>ব্র্যন্ড</td>
            <td>
               <asp:DropDownList ID="FabricsBrandDropDownList" runat="server" CssClass="dropdown" DataSourceID="BrandSQL" DataTextField="FabricsBrandName" DataValueField="FabricsBrandID" OnDataBound="FabricsBrandDropDownList_DataBound">
               </asp:DropDownList>
               <asp:SqlDataSource ID="BrandSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM [Fabrics_Brand] WHERE ([InstitutionID] = @InstitutionID)">
                  <SelectParameters>
                     <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                  </SelectParameters>
               </asp:SqlDataSource>
            </td>
         </tr>
         <tr>
            <td>কাপড়ের কোড</td>
            <td>
               <asp:TextBox ID="FabricCodeTextBox" placeholder="কাপড়ের কোড" runat="server" CssClass="textbox"></asp:TextBox>
               <asp:RequiredFieldValidator ID="RequiredFieldValidator56" runat="server" ControlToValidate="FabricCodeTextBox" CssClass="EroorSummer" ErrorMessage="Required" ValidationGroup="1"></asp:RequiredFieldValidator>
               <asp:Label ID="ErrorLabel" runat="server" CssClass="SuccessMessage"></asp:Label>
            </td>
         </tr>
         <tr>
            <td>কাপড়ের নাম</td>
            <td>
               <asp:TextBox ID="FabricsNameTextBox" placeholder="কাপড়ের নাম" runat="server" CssClass="textbox"></asp:TextBox>
               <asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="FabricsNameTextBox" CssClass="EroorSummer" ErrorMessage="Required" ValidationGroup="1"></asp:RequiredFieldValidator>
            </td>
         </tr>
         <tr>
            <td class="AlnW">প্রতি ইউনিটের বিক্রয় মূল্য</td>
            <td>
               <asp:TextBox ID="FabricSUPTextBox" placeholder="প্রতি ইউনিটের বিক্রয় মূল্য" runat="server" CssClass="textbox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false"></asp:TextBox>
               <asp:RequiredFieldValidator ID="RequiredFieldValidator4" runat="server" ControlToValidate="FabricSUPTextBox" CssClass="EroorSummer" ErrorMessage="Required" ValidationGroup="1"></asp:RequiredFieldValidator>
               <asp:SqlDataSource ID="InserFabricSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="IF NOT EXISTS (SELECT * FROM Fabrics WHERE FabricCode = @FabricCode AND InstitutionID = @InstitutionID)
BEGIN
INSERT INTO Fabrics(FabricMesurementUnitID, InstitutionID, RegistrationID, FabricsBrandID, FabricsCategoryID, Fabric_SN, FabricCode, FabricsName,  SellingUnitPrice,CurrentBuyingUnitPrice) VALUES (@FabricMesurementUnitID, @InstitutionID, @RegistrationID, @FabricsBrandID, @FabricsCategoryID, dbo.Fabric_SerialNumber(@InstitutionID), @FabricCode, @FabricsName, @SellingUnitPrice,ROUND(@CurrentBuyingUnitPrice, 2))
Select @FabricID = SCOPE_IDENTITY()
END
ELSE
BEGIN
SET @ERROR = @FabricCode + ' Fabrics Code Already Exists'
Select @FabricID =FabricID FROM Fabrics  WHERE (FabricCode = @FabricCode) AND (InstitutionID = @InstitutionID)
END"
                  OnInserted="InserFabricSQL_Inserted" SelectCommand="SELECT * FROM [Fabrics]" UpdateCommand="UPDATE Fabrics SET SellingUnitPrice =@SellingUnitPrice WHERE (FabricID = @FabricID)">
                  <InsertParameters>
                     <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                     <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                     <asp:ControlParameter ControlID="Mesurement_UnitDropDownList" Name="FabricMesurementUnitID" PropertyName="SelectedValue" Type="Int32" />
                     <asp:ControlParameter ControlID="FabricsCategoryDropDownList" Name="FabricsCategoryID" PropertyName="SelectedValue" Type="Int32" />
                     <asp:ControlParameter ControlID="FabricsBrandDropDownList" Name="FabricsBrandID" PropertyName="SelectedValue" Type="Int32" />
                     <asp:ControlParameter ControlID="FabricCodeTextBox" Name="FabricCode" PropertyName="Text" Type="String" />
                     <asp:ControlParameter ControlID="FabricsNameTextBox" Name="FabricsName" PropertyName="Text" Type="String" />
                     <asp:ControlParameter ControlID="FabricSUPTextBox" Name="SellingUnitPrice" PropertyName="Text" Type="Double" />
                     <asp:Parameter Name="CurrentBuyingUnitPrice" />
                     <asp:Parameter Direction="Output" Name="FabricID" Type="Int32" />
                     <asp:Parameter Direction="Output" Name="ERROR" Size="256" />
                  </InsertParameters>
                  <UpdateParameters>
                     <asp:Parameter Name="SellingUnitPrice" />
                     <asp:Parameter Name="FabricID" />
                  </UpdateParameters>
               </asp:SqlDataSource>
               <asp:RegularExpressionValidator ID="FRex2" runat="server" ControlToValidate="FabricSUPTextBox" CssClass="EroorStar" ErrorMessage="0 Not Allowed" SetFocusOnError="True" ValidationExpression="^0*[1-9][0-9]*(\.[0-9]+)?|0+\.[0-9]*[1-9][0-9]*$" ValidationGroup="1"></asp:RegularExpressionValidator>
            </td>
         </tr>
      </table>
   </asp:Panel>

   <asp:Panel ID="OldPanel" runat="server" Visible="false">
      <table>
         <tr>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
         </tr>

         <tr>
            <td>কাপড়ের কোড</td>
            <td>
               <asp:TextBox ID="OldFabric_CodeTextBox" runat="server" CssClass="textbox"></asp:TextBox>
               <asp:RequiredFieldValidator ID="RequiredFieldValidator55" runat="server" ControlToValidate="OldFabric_CodeTextBox" CssClass="EroorStar" ErrorMessage="Required" InitialValue="0" ValidationGroup="1"></asp:RequiredFieldValidator>

               <b class="Amnt">
                  <asp:Label ID="FabricsNameLabel" runat="server" />
                  <asp:Label ID="QuantityLabel" runat="server" />
                  <asp:Label ID="UNnameLabel" runat="server" />
                  <asp:Label ID="SellingUnitPLabel" runat="server" />

                  <asp:HiddenField ID="FabricIDHF" runat="server" />
                  <asp:HiddenField ID="SellingUP_HF" runat="server" />
               </b>
            </td>
         </tr>
         <tr>
            <td>&nbsp;</td>
            <td>
               <asp:CheckBox ID="CSPCheckBox" runat="server" Text="Change Selling Unit Price" />
            </td>
         </tr>
         <tr>
            <td class="AlnW">
               <br />
            </td>
            <td>
               <asp:TextBox ID="ChangeUPriceTextBox" runat="server" autocomplete="off" CssClass="RTextbox" Enabled="False" onDrop="blur();return false;" onkeypress="return isNumberKey(event)" onpaste="return false"></asp:TextBox>
               <asp:RequiredFieldValidator ID="CUPRV" runat="server" ControlToValidate="ChangeUPriceTextBox" CssClass="EroorSummer" ErrorMessage="Enter Price" ValidationGroup="1" Enabled="False"></asp:RequiredFieldValidator>
               &nbsp;<asp:RegularExpressionValidator ID="FRex" runat="server" ControlToValidate="ChangeUPriceTextBox" CssClass="EroorStar" ErrorMessage="0 Not Allowed" SetFocusOnError="True" ValidationExpression="^0*[1-9][0-9]*(\.[0-9]+)?|0+\.[0-9]*[1-9][0-9]*$" ValidationGroup="1"></asp:RegularExpressionValidator>
            </td>
         </tr>
      </table>
   </asp:Panel>

   <table>
      <tr>
         <td class="AlnW">পরিমান</td>
         <td>
            <asp:TextBox ID="QuantityTextBox" placeholder="পরিমান" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" CssClass="QPTextbox"></asp:TextBox>
            <asp:RequiredFieldValidator ID="RequiredFieldValidator51" runat="server" ControlToValidate="QuantityTextBox" CssClass="EroorSummer" ErrorMessage="Required" ValidationGroup="1"></asp:RequiredFieldValidator>
            <asp:RegularExpressionValidator ID="FRex3" runat="server" ControlToValidate="QuantityTextBox" CssClass="EroorStar" ErrorMessage="0 Not Allowed" SetFocusOnError="True" ValidationExpression="^0*[1-9][0-9]*(\.[0-9]+)?|0+\.[0-9]*[1-9][0-9]*$" ValidationGroup="1"></asp:RegularExpressionValidator>
         </td>
      </tr>
       <tr>
         <td>প্রতি ইউনিটের ক্রয় মূল্য</td>
         <td>
              <asp:TextBox ID="FabBuyingUnitPrice_TB" placeholder="প্রতি ইউনিটের ক্রয় মূল্য" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" CssClass="textbox"></asp:TextBox>
            <asp:Label ID="OutLabel" runat="server" CssClass="Amnt"></asp:Label>
         </td>
      </tr>
      <tr>
         <td>মোট মূল্য</td>
         <td>
            <asp:TextBox ID="QPriceTextBox" placeholder="মোট মূল্য" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" CssClass="QPTextbox"></asp:TextBox>
            <asp:RequiredFieldValidator ID="RequiredFieldValidator52" runat="server" ControlToValidate="QPriceTextBox" CssClass="EroorSummer" ErrorMessage="Required" ValidationGroup="1"></asp:RequiredFieldValidator>
            <asp:RegularExpressionValidator ID="FRex4" runat="server" ControlToValidate="QPriceTextBox" CssClass="EroorStar" ErrorMessage="0 Not Allowed" SetFocusOnError="True" ValidationExpression="^0*[1-9][0-9]*(\.[0-9]+)?|0+\.[0-9]*[1-9][0-9]*$" ValidationGroup="1"></asp:RegularExpressionValidator>
         </td>
      </tr>
      
      <tr>
         <td>&nbsp;</td>
         <td>
            <asp:Button ID="AddToCartButton" runat="server" CssClass="ContinueButton" Text="Add To Cart" OnClick="AddToCartButton_Click" ValidationGroup="1" />
            &nbsp;</td>
      </tr>
      <tr>
         <td>&nbsp;</td>
         <td>&nbsp;</td>
      </tr>
   </table>

   <asp:GridView ID="ChargeGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" ShowFooter="True">
      <Columns>
         <asp:TemplateField Visible="false">
            <ItemTemplate>
               <asp:Label ID="FabricIDLabel" runat="server" Text='<%# Bind("FabricID") %>'></asp:Label>
            </ItemTemplate>
         </asp:TemplateField>
         <asp:TemplateField HeaderText="কাপড়ের কোড">
            <ItemTemplate>
               <asp:Label ID="FabricCodeLabel" runat="server" Text='<%# Bind("FabricCode") %>'></asp:Label>
            </ItemTemplate>
         </asp:TemplateField>
         <asp:TemplateField HeaderText="প্রতি ইউনিটের বিক্রয় মূল্য">
            <ItemTemplate>
               <asp:Label ID="Selling_UPLabel" runat="server" Text='<%# Bind("Selling_UP") %>'></asp:Label>
            </ItemTemplate>
         </asp:TemplateField>
         <asp:TemplateField HeaderText="পরিমান">
            <ItemTemplate>
               <asp:Label ID="QntLabel" runat="server" Text='<%# Bind("Quantity") %>'></asp:Label>
            </ItemTemplate>
         </asp:TemplateField>
         <asp:TemplateField HeaderText="ইউনিট মূল্য">
            <ItemTemplate>
               <asp:Label ID="Buying_UPLabel" runat="server" Text='<%# Bind("UnitPrice") %>'></asp:Label>
            </ItemTemplate>
         </asp:TemplateField>
         <asp:TemplateField HeaderText="মোট মূল্য">
            <ItemTemplate>
               <asp:Label ID="TotalPriceLabel" runat="server" Text='<%# Bind("TotalPrice") %>'></asp:Label>
            </ItemTemplate>
            <FooterTemplate>
               <div class="Amnt">
                  সর্বমোট মূল্য:
                  <asp:Label ID="GrandTotal" runat="server"></asp:Label>
                  টাকা.
               </div>
            </FooterTemplate>
         </asp:TemplateField>

         <asp:TemplateField>
            <ItemTemplate>
               <asp:LinkButton ID="DeleteImageButton" runat="server" CausesValidation="False" CommandName="Delete" CssClass="Delete" OnClick="RowDelete" OnClientClick="return confirm('আপনি কি ডিলেট করতে চান ?')" ToolTip="ডিলিট করুন"></asp:LinkButton>
            </ItemTemplate>
            <ItemStyle Width="40px" />
         </asp:TemplateField>
      </Columns>
      <FooterStyle BackColor="#F4F4F4" />
   </asp:GridView>

   <%if (ChargeGridView.Rows.Count > 0)
     {%>
   <table>
      <tr>
         <td colspan="2"></td>
      </tr>
      <tr>
         <td>&nbsp;</td>
         <td>&nbsp;</td>
      </tr>
      <tr>
         <td>মোট ছাড়</td>
         <td>
            <asp:TextBox ID="DiscountAmoutTextBox" runat="server" autocomplete="off" CssClass="textbox" onDrop="blur();return false;" onkeypress="return isNumberKey(event)" onpaste="return false"></asp:TextBox>
         </td>
      </tr>
      <tr>
         <td>% হিসাবে ছাড়</td>
         <td>
            <asp:TextBox ID="DiscountPercentageTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" CssClass="textbox"></asp:TextBox>
            <asp:RegularExpressionValidator ID="RegularExpressionValidator1" runat="server" ControlToValidate="DiscountPercentageTextBox" CssClass="EroorSummer" ErrorMessage="Allow 0 - 100% Only" SetFocusOnError="True" ValidationExpression="^0*(([0-9]{1,2}){1}(\.[0-9]*)?|100)$" ValidationGroup="S"></asp:RegularExpressionValidator>
         </td>
      </tr>
      <tr>
         <td>&nbsp;</td>
         <td>
            <div class="Amnt">
               মোট:
                     <asp:Label ID="SubtotalLabel" runat="server"></asp:Label>
               টাকা.
               <asp:HiddenField ID="SubTotalHF" runat="server" />
            </div>
         </td>
      </tr>
      <tr>
         <td>বিল নং.</td>
         <td>
            <asp:TextBox ID="Bill_NoTextBox" runat="server" CssClass="textbox"></asp:TextBox>
         </td>
      </tr>
      <tr>
         <td>ক্রয়ের তারিখ</td>
         <td>
            <asp:TextBox ID="BuyingDateTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" CssClass="Datetime"></asp:TextBox>
            <asp:RequiredFieldValidator ID="RequiredFieldValidator54" runat="server" ControlToValidate="BuyingDateTextBox" CssClass="EroorSummer" ErrorMessage="Required" ValidationGroup="S"></asp:RequiredFieldValidator>
         </td>
      </tr>
      <%
        System.Data.DataView DetailsDV = new System.Data.DataView();
        DetailsDV = (System.Data.DataView)AccountSQL.Select(DataSourceSelectArguments.Empty);
        if (DetailsDV.Count > 0)
        {%>
      <tr>
         <td>একাউন্ট</td>
         <td>

            <asp:DropDownList ID="AccountDropDownList" runat="server" CssClass="dropdown" DataSourceID="AccountSQL" DataTextField="AccountName" DataValueField="AccountID" OnDataBound="AccountDropDownList_DataBound">
            </asp:DropDownList>

            <asp:SqlDataSource ID="AccountSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT AccountID,AccountName  +' ('+ CONVERT (VARCHAR(100), AccountBalance)+')' as AccountName  FROM Account WHERE (InstitutionID = @InstitutionID) AND (AccountBalance &lt;&gt; 0)">
               <SelectParameters>
                  <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
               </SelectParameters>
            </asp:SqlDataSource>

         </td>
      </tr>
      <%}%>
      <tr>
         <td>&nbsp;</td>
         <td>
            <asp:CheckBox ID="ChangeBuyingPCheckBox" runat="server" Checked="True" Text="Change Current Buying Price" />
         </td>
      </tr>
      <tr>
         <td>&nbsp;</td>
         <td>
            <asp:Label ID="CheckBalanceLabel" runat="server" CssClass="EroorSummer"></asp:Label>
         </td>
      </tr>
      <tr>
         <td>&nbsp;</td>
         <td>
            <asp:Button ID="SubmitButton" runat="server" CssClass="ContinueButton" OnClick="SubmitButton_Click" Text="Buy" ValidationGroup="S" />
         </td>
      </tr>
      <tr>
         <td>&nbsp;</td>
         <td>
            <a id="PopuuButton" onclick="Popup();" class="SPl">Buy With(Supplier) Due</a>
            <asp:SqlDataSource ID="Fabric_BuyingSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
               InsertCommand="INSERT INTO Fabrics_Buying (InstitutionID, RegistrationID, FabricsSupplierID, Buying_SN, BillNo,BuyingDate) VALUES (@InstitutionID, @RegistrationID, @FabricsSupplierID, [dbo].[Fabric_Buying_SerialNumber](@InstitutionID),@BillNo,ISNULL(@BuyingDate,Getdate())) SELECT @FabricBuyingID = Scope_identity()"
               SelectCommand="SELECT * FROM [Fabric_Buy]" OnInserted="Fabric_BuyingSQL_Inserted" UpdateCommand="UPDATE  Fabrics_Buying SET BuyingDiscountAmount = @BuyingDiscountAmount WHERE (FabricBuyingID = @FabricBuyingID)">
               <InsertParameters>
                  <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                  <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                  <asp:ControlParameter ControlID="BuyingDateTextBox" Name="BuyingDate" PropertyName="Text" />
                  <asp:ControlParameter ControlID="Bill_NoTextBox" Name="BillNo" PropertyName="Text" />
                  <asp:Parameter Name="FabricsSupplierID" />
                  <asp:Parameter Direction="Output" Name="FabricBuyingID" Type="Int32" />
               </InsertParameters>
               <UpdateParameters>
                  <asp:ControlParameter ControlID="DiscountAmoutTextBox" Name="BuyingDiscountAmount" PropertyName="Text" />
                  <asp:Parameter Name="FabricBuyingID" />
               </UpdateParameters>
            </asp:SqlDataSource>

            <asp:SqlDataSource ID="Fabric_Buying_ListSQl" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="INSERT INTO Fabrics_Buying_List(InstitutionID, RegistrationID, FabricBuyingID, FabricID, BuyingQuantity, BuyingPrice, FabricsSupplierID) VALUES (@InstitutionID, @RegistrationID, @FabricBuyingID, @FabricID, @BuyingQuantity, ROUND(@BuyingPrice, 2), @FabricsSupplierID)" SelectCommand="SELECT * FROM [Fabric_Buy_List]">
               <InsertParameters>
                  <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                  <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                  <asp:Parameter Name="FabricBuyingID" />
                  <asp:Parameter Name="FabricID" />
                  <asp:Parameter Name="FabricsSupplierID" />
                  <asp:Parameter Name="BuyingQuantity" />
                  <asp:Parameter Name="BuyingPrice" />
               </InsertParameters>
            </asp:SqlDataSource>
            <asp:SqlDataSource ID="Buying_PaymentRecord" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="declare @Total_DUE float
declare @Difference float
declare @Amount float

IF(isnull(@BuyingPaidAmount,0) &lt;&gt; 0)
BEGIN
 SELECT @Total_DUE = BuyingDueAmount FROM Fabrics_Buying WHERE (FabricBuyingID = @FabricBuyingID)
 SET @Difference  = (@Total_DUE - @BuyingPaidAmount)
  
  IF(ABS(@Difference)&gt;1)
   BEGIN
    SET @Amount = isnull(@BuyingPaidAmount,0) 
    END
  ELSE
    BEGIN
      SET @Amount = @Total_DUE 
    END

 INSERT INTO [Fabrics_Buying_PaymentRecord] ([FabricBuyingID], [RegistrationID], [InstitutionID], [FabricsSupplierID],[BuyingPaidAmount],[AccountID], [Payment_Situation], [BuyingPaid_Date], [InsertDate]) VALUES (@FabricBuyingID, @RegistrationID, @InstitutionID,@FabricsSupplierID, @Amount, @AccountID, @Payment_Situation, @BuyingPaid_Date, Getdate()) END"
               SelectCommand="SELECT * FROM Fabrics_Buying_PaymentRecord">
               <InsertParameters>
                  <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                  <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                  <asp:ControlParameter ControlID="AccountDropDownList" Name="AccountID" PropertyName="SelectedValue" Type="Int32" />
                  <asp:ControlParameter ControlID="BuyingDateTextBox" DbType="Date" DefaultValue="" Name="BuyingPaid_Date" PropertyName="Text" />
                  <asp:Parameter DefaultValue="Buying" Name="Payment_Situation" Type="String" />
                  <asp:Parameter DefaultValue="" Name="FabricsSupplierID" />
                  <asp:Parameter Name="FabricBuyingID" Type="Int32" />
                  <asp:Parameter Name="BuyingPaidAmount" Type="Double" />
               </InsertParameters>
            </asp:SqlDataSource>
            <asp:SqlDataSource ID="Fabric_CurrentBuyP_UpdateSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT FabricID FROM Fabrics" UpdateCommand="UPDATE Fabrics SET CurrentBuyingUnitPrice = ROUND(@CurrentBuyingUnitPrice, 2) WHERE (FabricID = @FabricID)">
               <UpdateParameters>
                  <asp:Parameter Name="CurrentBuyingUnitPrice" />
                  <asp:Parameter Name="FabricID" />
               </UpdateParameters>
            </asp:SqlDataSource>
         </td>
      </tr>
   </table>
   <%} %>



   <div id="AddPopup" runat="server" style="display: none;" class="modalPopup">
      <div id="Header" class="Htitle">
         <b>Supplier</b>
         <div id="Close" class="PopClose"></div>
      </div>

      <div class="Pop_Contain">
         <div id="main">
            <ul>
               <li><a href="#OldSupplier">পুরাতন সাপ্লায়ার</a></li>
               <li><a href="#NewSupplier">নতুন সাপ্লায়ার</a></li>
            </ul>

            <div id="OldSupplier">
               <asp:UpdatePanel ID="UpdatePanel2" runat="server" UpdateMode="Conditional">
                  <ContentTemplate>
                     <table style="width: 100%">
                        <tr>
                           <td>
                              <asp:RequiredFieldValidator ID="RequiredFieldValidator57" runat="server" ControlToValidate="SupplierDropDownList" CssClass="EroorSummer" ErrorMessage="Select Supplier" InitialValue="0" ValidationGroup="OldS"></asp:RequiredFieldValidator>
                           </td>
                        </tr>
                        <tr>
                           <td>
                              <asp:DropDownList ID="SupplierDropDownList" runat="server" AutoPostBack="True" CssClass="dropdown" DataSourceID="OldSupplierSQL" DataTextField="SupplierName" DataValueField="FabricsSupplierID" OnDataBound="SupplierDropDownList_DataBound">
                              </asp:DropDownList>
                              <asp:SqlDataSource ID="OldSupplierSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM Fabrics_Supplier WHERE (InstitutionID = @InstitutionID)">
                                 <SelectParameters>
                                    <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                                 </SelectParameters>
                              </asp:SqlDataSource>

                              <asp:FormView ID="SupplierFormView" runat="server" DataKeyNames="FabricsSupplierID" DataSourceID="InfoOldSupplierSQL">
                                 <ItemTemplate>
                                    <br />
                                    <b>
                                       <asp:Label ID="SupplierCompanyNameLabel" runat="server" Text='<%# Bind("SupplierCompanyName") %>' />
                                       <asp:Label ID="SupplierAddressLabel" runat="server" Text='<%# Bind("SupplierAddress") %>' /><br />

                                       <asp:Label ID="SupplierNameLabel" runat="server" Text='<%# Bind("SupplierName") %>' />
                                       <asp:Label ID="SupplierPhoneLabel" runat="server" Text='<%# Bind("SupplierPhone") %>' /><br />

                                       পূর্বের বাকি:
                                    <asp:Label ID="SupplierDueLabel" runat="server" Text='<%# Bind("SupplierDue","{0:n}") %>' />
                                       টাকা
                                    </b>
                                 </ItemTemplate>
                              </asp:FormView>
                              <asp:SqlDataSource ID="InfoOldSupplierSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM [Fabrics_Supplier] WHERE ([FabricsSupplierID] = @FabricsSupplierID)">
                                 <SelectParameters>
                                    <asp:ControlParameter ControlID="SupplierDropDownList" Name="FabricsSupplierID" PropertyName="SelectedValue" Type="Int32" />
                                 </SelectParameters>
                              </asp:SqlDataSource>
                           </td>
                        </tr>
                        <tr>
                           <td class="Amount_Msg">মোট:
                              <label id="OldS_TotalAmt"></label>
                              টাকা</td>
                        </tr>
                        <tr>
                           <td>
                              <asp:TextBox ID="Old_SupplierAmtTextBox" placeholder="Paid Amount" runat="server" autocomplete="off" CssClass="textbox" onDrop="blur();return false;" onkeypress="return isNumberKey(event)" onpaste="return false"></asp:TextBox>
                           </td>
                        </tr>
                        <tr>
                           <td>
                              <asp:Label ID="Old_SEMLabel" runat="server" CssClass="Amount_Msg"></asp:Label>
                           </td>
                        </tr>
                        <tr>
                           <td>
                              <asp:Button ID="OldSupplierButton" runat="server" CssClass="ContinueButton" Text="Submit" ValidationGroup="OldS" OnClick="OldSupplierButton_Click" />
                              <br />
                              <asp:Label ID="SupplierErlbl2" runat="server" CssClass="EroorSummer"></asp:Label>
                           </td>
                        </tr>
                     </table>
                  </ContentTemplate>
                  <Triggers>
                     <asp:AsyncPostBackTrigger ControlID="SupplierDropDownList" EventName="SelectedIndexChanged" />
                  </Triggers>
               </asp:UpdatePanel>
            </div>

            <div id="NewSupplier">
               <asp:UpdatePanel ID="UpdatePanel1" runat="server" UpdateMode="Conditional">
                  <ContentTemplate>
                     <table>
                        <tr>
                           <td>কোম্পানীর নাম</td>
                           <td>
                              <asp:TextBox ID="CompanyNameTextBox" runat="server" CssClass="textbox" Width="220px"></asp:TextBox>
                           </td>
                        </tr>
                        <tr>
                           <td>সাপলায়ারের নাম</td>
                           <td>
                              <asp:TextBox ID="SupplierNameTextBox" runat="server" CssClass="textbox" Width="220px"></asp:TextBox>
                              <asp:RequiredFieldValidator ID="RequiredFieldValidator3" runat="server" ControlToValidate="SupplierNameTextBox" CssClass="EroorSummer" ErrorMessage="Enter Name" ValidationGroup="AS">*</asp:RequiredFieldValidator>
                           </td>
                        </tr>
                        <tr>
                           <td>মোবাইল</td>
                           <td>
                              <asp:TextBox ID="SupplierPhoneTextBox" runat="server" CssClass="textbox" Width="220px"></asp:TextBox>
                              <asp:RegularExpressionValidator ID="RegularExpressionValidator3" runat="server" ControlToValidate="SupplierPhoneTextBox" CssClass="EroorSummer" ErrorMessage="মোবাইল নাম্বার সঠিক নয়" SetFocusOnError="True" ValidationExpression="(88)?((011)|(015)|(016)|(017)|(018)|(019)|(013)|(014))\d{8,8}" ValidationGroup="AS">*</asp:RegularExpressionValidator>
                           </td>
                        </tr>
                        <tr>
                           <td>ঠিকানা</td>
                           <td>
                              <asp:TextBox ID="SupplierAddressTextBox" runat="server" CssClass="textbox" Width="220px"></asp:TextBox>
                           </td>
                        </tr>
                        <tr>
                           <td></td>
                           <td class="Amount_Msg">মোট:
                              <label id="NS_TotalAmt"></label>
                              টাকা
                           </td>
                        </tr>
                        <tr>
                           <td>জমা</td>
                           <td>
                              <asp:TextBox ID="SupplierTA_TextBox" runat="server" autocomplete="off" CssClass="textbox" onDrop="blur();return false;" onkeypress="return isNumberKey(event)" onpaste="return false" Width="220px"></asp:TextBox>
                           </td>
                        </tr>
                        <tr>
                           <td>&nbsp;</td>
                           <td>
                              <asp:Label ID="SPaidErrLabel" runat="server" CssClass="Amount_Msg"></asp:Label>
                           </td>
                        </tr>
                        <tr>
                           <td>&nbsp;</td>
                           <td>
                              <asp:Button ID="NewSupplierButton" runat="server" CssClass="ContinueButton" OnClick="NewSupplierButton_Click" Text="Submit" ValidationGroup="AS" />
                              <br />
                              <asp:Label ID="SupplierErlbl" runat="server" CssClass="EroorSummer"></asp:Label>
                              <asp:SqlDataSource ID="InsertNewSupplierSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="INSERT INTO [Fabrics_Supplier] ([InstitutionID], [RegistrationID], [SupplierName], [SupplierPhone], [SupplierAddress], [SupplierCompanyName]) VALUES (@InstitutionID, @RegistrationID, @SupplierName, @SupplierPhone, @SupplierAddress, @SupplierCompanyName)
SELECT @FabricsSupplierID = Scope_identity()"
                                 SelectCommand="SELECT * FROM [Fabrics_Supplier]" OnInserted="InsertNewSupplierSQL_Inserted">
                                 <InsertParameters>
                                    <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                                    <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                                    <asp:ControlParameter ControlID="SupplierNameTextBox" Name="SupplierName" PropertyName="Text" Type="String" />
                                    <asp:ControlParameter ControlID="SupplierPhoneTextBox" Name="SupplierPhone" PropertyName="Text" Type="String" />
                                    <asp:ControlParameter ControlID="SupplierAddressTextBox" Name="SupplierAddress" PropertyName="Text" Type="String" />
                                    <asp:ControlParameter ControlID="CompanyNameTextBox" Name="SupplierCompanyName" PropertyName="Text" Type="String" />
                                    <asp:Parameter Name="FabricsSupplierID" Direction="Output" Size="256" />
                                 </InsertParameters>
                              </asp:SqlDataSource>
                           </td>
                        </tr>
                        <tr>
                           <td>&nbsp;</td>
                           <td>
                              <asp:ValidationSummary ID="ValidationSummary1" runat="server" CssClass="EroorSummer" DisplayMode="List" ValidationGroup="AS" />
                           </td>
                        </tr>
                     </table>
                  </ContentTemplate>
                  <Triggers>
                     <asp:AsyncPostBackTrigger ControlID="NewSupplierButton" EventName="Click" />
                  </Triggers>
               </asp:UpdatePanel>
            </div>
         </div>

      </div>

      <asp:HiddenField ID="IHiddenField" runat="server" Value="0" />
      <asp:ModalPopupExtender ID="MP" runat="server"
         TargetControlID="IHiddenField"
         PopupControlID="AddPopup"
         CancelControlID="Close"
         BehaviorID="MPE"
         BackgroundCssClass="modalBackground"
         PopupDragHandleControlID="Header" />
   </div>

   <asp:UpdateProgress ID="UpdateProgress" runat="server">
      <ProgressTemplate>
         <div id="progress_BG"></div>
         <div id="progress">
            <img alt="Loading..." src="../../../CSS/Image/gif-load.gif" />
            <br />
            <b>Loading...</b>
         </div>
      </ProgressTemplate>
   </asp:UpdateProgress>

   <script src="../../../JS/DatePicker/jquery.datepick.js"></script>
   <script src="../../../JS/jq_Profile/jquery-ui-1.8.23.custom.min.js"></script>
   <script>
      $(document).ready(function () {
         $('#main').tabs();
         $(".Datetime").datepick();


         //Autocomplete Fabric Code
         $("[id$=OldFabric_CodeTextBox]").autocomplete({
            source: function (request, response) {
               $.ajax({
                  url: '<%=ResolveUrl("Fabric_Buying.aspx/Fabric_Code") %>',
                  data: "{'prefix': '" + request.term + "'}",
                  dataType: "json",
                  type: "POST",
                  contentType: "application/json; charset=utf-8",

                  success: function (data) {
                     response($.map(data.d, function (item) {
                        return {
                           label: item.split('||')[0],
                           F_Name: item.split('||')[1],
                           SUPrice: item.split('||')[2],
                           S_Quantity: item.split('||')[3],
                           Unit_Name: item.split('||')[4],
                           FabricID: item.split('||')[5]
                        }
                     }))
                  },
                  error: function (response) {
                     alert(response.responseText);
                  },
                  failure: function (response) {
                     alert(response.responseText);
                  }
               });
            },
            select: function (e, i) {
               $("[id*=FabricsNameLabel]").text(i.item.F_Name);
               $("[id*=QuantityLabel]").text(" (" + i.item.S_Quantity);
               $("[id*=UNnameLabel]").text(i.item.Unit_Name + ") ");
               $("[id*=SellingUnitPLabel]").text("প্রতি ইউনিটের বিক্রয় মূল্য: " + i.item.SUPrice + " টাকা");

               $("[id*=FabricIDHF]").val(i.item.FabricID);
               $("[id*=SellingUP_HF]").val(i.item.SUPrice);

               $('.Amnt').show();
            },
            minLength: 1
         });

      });

      //Old New RadioButton List
      $("[id*=OldNewRadioButtonList]").live("change", function () {
         $("[id*=CSPCheckBox]").prop('checked', false);
         $(".QPTextbox").val("");
      });

      //Change Selling Price DropDownList
      $("[id*=CSPCheckBox]").live("click", function () {
         if ($(this).is(":checked")) {
            $("[id*=ChangeUPriceTextBox]").show('slow');
            ValidatorEnable($("[id*=CUPRV]")[0], true);
            $("[id*=ChangeUPriceTextBox]").prop('disabled', false);
         }
         else {
            $("[id*=ChangeUPriceTextBox]").hide('slow');
            $("[id*=ChangeUPriceTextBox]").prop('disabled', true).val("");
            ValidatorEnable($("[id*=CUPRV]")[0], false);
         }
      });

      //Fabric DropDownList
      $("[id*=FabricDropDownList]").live("change", function () {
         $("[id*=CSPCheckBox]").prop('checked', false);
         $(".QPTextbox").val("");
      });

      //Quantity And Total Price
      $(".QPTextbox").live('keyup', function () {
         var price = parseFloat($("[id*=QPriceTextBox]").val());
         var Qnt = parseFloat($("[id*=QuantityTextBox]").val());
         var total = parseFloat(price / Qnt);

         if (!isNaN(total) && total != "Infinity")
            $("[id*=FabBuyingUnitPrice_TB]").val(total.toFixed(2));
         else
            $("[id*=FabBuyingUnitPrice_TB]").val("");
       });

      //Buying Unit Price
      $("[id*=FabBuyingUnitPrice_TB]").live('keyup', function () {
          var Qnt = parseFloat($("[id*=QuantityTextBox]").val());
          var UnitPrice = parseFloat($(this).val());

         var total = parseFloat(Qnt*UnitPrice);

         if (!isNaN(total) && total != "Infinity")
            $("[id*=QPriceTextBox]").val(total.toFixed(2));
         else
            $("[id*=QPriceTextBox]").val("");
       });


      //Grand Total from Gridview Product TotalPrice
      var grandTotal = 0;
      $("[id*=TotalPriceLabel]").each(function () { grandTotal = grandTotal + parseFloat($(this).text()) });
      $("[id*=GrandTotal]").text(grandTotal.toFixed(2));

      $("[id*=SubtotalLabel]").text(grandTotal.toFixed(2));
      $("[id*=SubTotalHF]").val($("[id*=SubtotalLabel]").text());

      $("[id*=DiscountPercentageTextBox]").val(0);
      $("[id*=DiscountAmoutTextBox]").val(0);


      //Discount Amount
      $("[id*=DiscountAmoutTextBox]").live('keyup', function () {
         var TotalPrice = parseFloat($("[id*=GrandTotal]").text());
         var DiscountAmt = parseFloat($("[id*=DiscountAmoutTextBox]").val());
         var DParcenTotal = parseFloat((100 * DiscountAmt) / TotalPrice);

         if (!isNaN(DParcenTotal)) {
            $("[id*=DiscountPercentageTextBox]").val(DParcenTotal.toFixed(3));
            $("[id*=SubtotalLabel]").text((TotalPrice - DiscountAmt).toFixed(3));
            $("[id*=SubTotalHF]").val($("[id*=SubtotalLabel]").text());
         }
         else {
            $("[id*=DiscountPercentageTextBox]").val(0);
            $("[id*=SubtotalLabel]").text($("[id*=GrandTotal]").text());
         }
      });

      //Discount Percentage
      $("[id*=DiscountPercentageTextBox]").live('keyup', function () {
         var TotalPrice = parseFloat($("[id*=GrandTotal]").text());
         var DiscountPercn = parseFloat($("[id*=DiscountPercentageTextBox]").val());
         var DParcenTotal = parseFloat((TotalPrice * DiscountPercn) / 100);

         if (!isNaN(DParcenTotal)) {
            $("[id*=DiscountAmoutTextBox]").val(DParcenTotal.toFixed(2));
            $("[id*=SubtotalLabel]").text((TotalPrice - DParcenTotal).toFixed(2));
            $("[id*=SubTotalHF]").val($("[id*=SubtotalLabel]").text());
         }

         else {
            $("[id*=DiscountAmoutTextBox]").val(0);
            $("[id*=SubtotalLabel]").text($("[id*=GrandTotal]").text());
         }
      });

      //Supplier
      function Popup() {
         var PrevDue = parseFloat($("[id*=SubtotalLabel]").text());
         if (PrevDue > 0) {
            $("#NS_TotalAmt").text(PrevDue.toFixed(2));
            $("#OldS_TotalAmt").text(PrevDue.toFixed(2));

            $("[id*=SPaidErrLabel]").text("");
            $("[id*=Old_SEMLabel]").text("");

            $find("MPE").show();
         }
         else {
            alert('Invalid Amount');
         }
      };

      $("[id*=SupplierTA_TextBox]").live('keyup', function () {
         var SPrvDue = parseFloat($("[id*=SubtotalLabel]").text());
         var SPaid = parseFloat($("[id*=SupplierTA_TextBox]").val());

         "" == $("[id*=SupplierTA_TextBox]").val() && (SPaid = 0);
         SPrvDue < SPaid ? ($("[id*=NewSupplierButton]").prop("disabled", !0).removeClass("ContinueButton"), $("[id*=SPaidErrLabel]").text("মোট বাকি " + SPrvDue.toFixed(2) + " টাকা। আপনি দিয়েছেন " + SPaid.toFixed(2) + " টাকা")) : ($("[id*=NewSupplierButton]").prop("disabled", !1).addClass("ContinueButton"), $("[id*=SPaidErrLabel]").text("বাকি থাকছে " + (SPrvDue - SPaid).toFixed(2) + " টাকা"));
      });

      $("[id*=Old_SupplierAmtTextBox]").live('keyup', function () {
         var SPrvDue2 = parseFloat($("[id*=SubtotalLabel]").text());
         var SPaid2 = parseFloat($("[id*=Old_SupplierAmtTextBox]").val());

         "" == $("[id*=Old_SupplierAmtTextBox]").val() && (SPaid2 = 0);
         SPrvDue2 < SPaid2 ? ($("[id*=OldSupplierButton]").prop("disabled", !0).removeClass("ContinueButton"), $("[id*=Old_SEMLabel]").text("মোট বাকি " + SPrvDue2.toFixed(2) + " টাকা। আপনি দিয়েছেন " + SPaid2.toFixed(2) + " টাকা")) : ($("[id*=OldSupplierButton]").prop("disabled", !1).addClass("ContinueButton"), $("[id*=Old_SEMLabel]").text("বাকি থাকছে " + (SPrvDue2 - SPaid2).toFixed(2) + " টাকা"));

      });

      //Update pannel in Supplier Popup
      Sys.WebForms.PageRequestManager.getInstance().add_endRequest(function (a, b) {
         var PrevDue = parseFloat($("[id*=SubtotalLabel]").text());
         if (PrevDue > 0) {
            $("#NS_TotalAmt").text(PrevDue.toFixed(2));
            $("#OldS_TotalAmt").text(PrevDue.toFixed(2));
         }
      });

      function isNumberKey(a) { a = a.which ? a.which : event.keyCode; return 46 != a && 31 < a && (48 > a || 57 < a) ? !1 : !0 };
   </script>
</asp:Content>
