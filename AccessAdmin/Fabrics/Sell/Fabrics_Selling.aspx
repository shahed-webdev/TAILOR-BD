<%@ Page Title="কাপড় বিক্রি করুন" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Fabrics_Selling.aspx.cs" Inherits="TailorBD.AccessAdmin.Fabrics.Sell.Fabrics_Selling" %>

<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="asp" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <link href="../../../JS/DatePicker/jquery.datepick.css" rel="stylesheet" />
   <link href="../../../JS/jq_Profile/css/Profile_jquery-ui-1.8.23.custom.css" rel="stylesheet" />
   <link href="CSS/Fabrics_Selling.css" rel="stylesheet" />
   <style>
      .RTextbox { display: none; border: 1px solid #c4c4c4; width: 183px; font-size: 13px; padding: 5px; border-radius: 4px; box-shadow: 0px 0px 8px #d9d9d9; }
   </style>
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <asp:ToolkitScriptManager ID="TSM" runat="server" />
   <h3>কাপড় বিক্রি করুন</h3>

   <table>
      <tr>
         <td>&nbsp;</td>
         <td>
            <asp:RequiredFieldValidator ID="Rfv" runat="server" ControlToValidate="Fabric_CodeTextBox" CssClass="EroorSummer" ErrorMessage="কাপড় নির্বাচন করুন" ValidationGroup="1"></asp:RequiredFieldValidator>
         </td>
         <td>&nbsp;</td>
      </tr>
      <tr>
         <td>কোড</td>
         <td>
            <asp:TextBox ID="Fabric_CodeTextBox" runat="server" CssClass="textbox"></asp:TextBox>
            <img class="Load" src="../CSS/Ico/Ajax_Loading.gif" style="width: 30px; display: none" />
         </td>
         <td>
            <b class="Amnt">
               <asp:Label ID="FabricsNameLabel" runat="server" />
               <asp:Label ID="QuantityLabel" runat="server" />
               <asp:Label ID="UNnameLabel" runat="server" />
               <asp:Label ID="SellingUnitPLabel" runat="server" />

               <asp:HiddenField ID="FabricIDHF" runat="server" />
               <asp:HiddenField ID="UPHF" runat="server" />
               <asp:HiddenField ID="QuntityHF" runat="server" />
            </b>
         </td>
      </tr>
      <tr>
         <td>পরিমান</td>
         <td>
            <asp:TextBox ID="QuantityTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" CssClass="textbox"></asp:TextBox>
         </td>
         <td>
            <asp:Label ID="StookErLabel" runat="server" ForeColor="#009933"></asp:Label>
            <asp:RequiredFieldValidator ID="RequiredFieldValidator51" runat="server" ControlToValidate="QuantityTextBox" CssClass="EroorSummer" ErrorMessage="পরিমান দিন" ValidationGroup="1"></asp:RequiredFieldValidator>
            <asp:RegularExpressionValidator ID="FRex3" runat="server" ControlToValidate="QuantityTextBox" CssClass="EroorSummer" ErrorMessage="Invalid Quantity" SetFocusOnError="True" ValidationExpression="^0*[1-9][0-9]*(\.[0-9]+)?|0+\.[0-9]*[1-9][0-9]*$" ValidationGroup="1"></asp:RegularExpressionValidator>
         </td>
      </tr>
      <tr>
         <td>&nbsp;</td>
         <td>
            <asp:CheckBox ID="CSPCheckBox" runat="server" Text="Change Selling Unit Price" /></td>
         <td>&nbsp;</td>
      </tr>
      <tr>
         <td>&nbsp;</td>
         <td colspan="2">
            <asp:TextBox ID="ChangeUPriceTextBox" runat="server" autocomplete="off" CssClass="RTextbox" Enabled="False" onDrop="blur();return false;" onkeypress="return isNumberKey(event)" onpaste="return false"></asp:TextBox>
            <asp:RequiredFieldValidator ID="CUPRV" runat="server" ControlToValidate="ChangeUPriceTextBox" CssClass="EroorSummer" ErrorMessage="Enter Price" ValidationGroup="1" Enabled="False"></asp:RequiredFieldValidator>
            &nbsp;<asp:RegularExpressionValidator ID="FRex" runat="server" ControlToValidate="ChangeUPriceTextBox" CssClass="EroorStar" ErrorMessage="0 Not Allowed" SetFocusOnError="True" ValidationExpression="^0*[1-9][0-9]*(\.[0-9]+)?|0+\.[0-9]*[1-9][0-9]*$" ValidationGroup="1"></asp:RegularExpressionValidator></td>
      </tr>
      <tr>
         <td>&nbsp;</td>
         <td colspan="2">
            <asp:Label ID="OutLabel" runat="server" CssClass="Amnt"></asp:Label></td>
      </tr>
      <tr>
         <td>&nbsp;</td>
         <td>
            <asp:Button ID="AddToCartButton" runat="server" CssClass="ContinueButton" Text="লিস্টে যুক্ত করুন" OnClick="AddToCartButton_Click" ValidationGroup="1" />
         </td>
         <td>&nbsp;</td>
      </tr>
      <tr>
         <td>&nbsp;</td>
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
         <asp:TemplateField HeaderText="পরিমান">
            <ItemTemplate>
               <asp:Label ID="QntLabel" runat="server" Text='<%# Bind("Quantity") %>'></asp:Label>
            </ItemTemplate>
         </asp:TemplateField>
         <asp:TemplateField HeaderText="ইউনিট মূল্য">
            <ItemTemplate>
               <asp:Label ID="Selling_UPLabel" runat="server" Text='<%# Bind("UnitPrice") %>'></asp:Label>
            </ItemTemplate>
         </asp:TemplateField>
         <asp:TemplateField HeaderText="মোট মূল্য">
            <ItemTemplate>
               <asp:Label ID="TotalPriceLabel" runat="server" Text='<%# Bind("TotalPrice") %>'></asp:Label>
            </ItemTemplate>
            <FooterTemplate>
               <div class="Amnt">
                  মোট মূল্য:
                  <asp:Label ID="GrandTotal" runat="server"></asp:Label>
                  /-
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
            <asp:RegularExpressionValidator ID="RegularExpressionValidator1" runat="server" ControlToValidate="DiscountPercentageTextBox" CssClass="EroorSummer" ErrorMessage="শুধু মাত্র  0 - 100% পর্যন্ত লিখা যাবে" SetFocusOnError="True" ValidationExpression="^0*(([0-9]{1,2}){1}(\.[0-9]*)?|100)$" ValidationGroup="S"></asp:RegularExpressionValidator>
         </td>
      </tr>
      <tr>
         <td>&nbsp;</td>
         <td>
            <div class="Subtotal_Amnt">
               মোট:
                     <asp:Label ID="SubtotalLabel" runat="server"></asp:Label>
               টাকা.
               <asp:HiddenField ID="SubTotalHF" runat="server" />
            </div>
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

            <asp:SqlDataSource ID="AccountSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT AccountID, AccountName  FROM Account WHERE (InstitutionID = @InstitutionID)">
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
            <asp:Label ID="CheckBalanceLabel" runat="server" CssClass="EroorSummer"></asp:Label>
         </td>
      </tr>
      <tr>
         <td>&nbsp;</td>
         <td>
            <asp:Button ID="SubmitButton" runat="server" CssClass="ContinueButton" OnClick="SubmitButton_Click" Text="নগত টাকায় বিক্রি করুন" ValidationGroup="S" />
         </td>
      </tr>
      <tr>
         <td>&nbsp;</td>
         <td>
            <a id="PopuuButton" onclick="Popup();" class="SPl">বাকিতে বিক্রি করতে এখানে ক্লিক করুন</a>
            <asp:SqlDataSource ID="Fabric_SellingSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
               InsertCommand="INSERT INTO Fabrics_Selling (InstitutionID, RegistrationID, CustomerID, Selling_SN) VALUES (@InstitutionID, @RegistrationID, @CustomerID, [dbo].[Fabrics_Selling_SerialNumber](@InstitutionID))
SELECT @FabricsSellingID = Scope_identity()"
               SelectCommand="SELECT * FROM [Fabrics_Selling]" OnInserted="Fabric_SellingSQL_Inserted" UpdateCommand="UPDATE Fabrics_Selling SET SellingDiscountAmount = @SellingDiscountAmount WHERE (FabricsSellingID = @FabricsSellingID)">
               <InsertParameters>
                  <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                  <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                  <asp:Parameter Name="CustomerID" />
                  <asp:Parameter Direction="Output" Name="FabricsSellingID" Type="Int32" />
               </InsertParameters>
               <UpdateParameters>
                  <asp:ControlParameter ControlID="DiscountAmoutTextBox" Name="SellingDiscountAmount" PropertyName="Text" />
                  <asp:Parameter Name="FabricsSellingID" />
               </UpdateParameters>
            </asp:SqlDataSource>
            <asp:SqlDataSource ID="Fabric_Selling_ListSQl" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="INSERT INTO Fabrics_Selling_List(InstitutionID, RegistrationID, FabricID, FabricsSellingID, SellingQuantity, SellingUnitPrice, BuyingUnitPrice) VALUES (@InstitutionID, @RegistrationID, @FabricID, @FabricsSellingID, @SellingQuantity, ROUND(@SellingUnitPrice, 2), dbo.Current_BuyingUnitPrice(@InstitutionID, @FabricID))" SelectCommand="SELECT * FROM [Fabrics_Selling_List]">
               <InsertParameters>
                  <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                  <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                  <asp:Parameter Name="FabricID" />
                  <asp:Parameter Name="FabricsSellingID" />
                  <asp:Parameter Name="SellingQuantity" />
                  <asp:Parameter Name="SellingUnitPrice" />
               </InsertParameters>
            </asp:SqlDataSource>
            <asp:SqlDataSource ID="Selling_PaymentRecord" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
               InsertCommand="declare @Total_DUE float
declare @Difference float
declare @Amount float

IF(isnull(@SellingPaidAmount,0) &lt;&gt; 0)
BEGIN
 SELECT @Total_DUE = SellingDueAmount FROM Fabrics_Selling WHERE (FabricsSellingID = @FabricsSellingID)
 SET @Difference  = (@Total_DUE - @SellingPaidAmount)
  
  IF(ABS(@Difference)&gt;1)
   BEGIN
    SET @Amount = isnull(@SellingPaidAmount,0) 
    END
  ELSE
    BEGIN
      SET @Amount = @Total_DUE 
    END

 INSERT INTO [Fabrics_Selling_PaymentRecord] (FabricsSellingID, RegistrationID, InstitutionID, SellingPaidAmount, AccountID, Payment_Situation)  VALUES (@FabricsSellingID, @RegistrationID, @InstitutionID, @Amount, @AccountID, @Payment_Situation)
END"
               SelectCommand="SELECT * FROM Fabrics_Selling_PaymentRecord">
               <InsertParameters>
                  <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                  <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                  <asp:ControlParameter ControlID="AccountDropDownList" Name="AccountID" PropertyName="SelectedValue" Type="Int32" />
                  <asp:Parameter DefaultValue="Selling" Name="Payment_Situation" Type="String" />
                  <asp:Parameter Name="SellingPaidAmount" Type="Double" />
                  <asp:Parameter DefaultValue="" Name="FabricsSellingID" />
               </InsertParameters>
            </asp:SqlDataSource>
         </td>
      </tr>
   </table>
    <%}%>

   <div id="AddPopup" runat="server" style="display: none;" class="modalPopup">
      <div id="Header" class="Htitle">
         <b>কাস্টমার</b>
         <div id="Close" class="PopClose"></div>
      </div>

      <div class="Pop_Contain">
         <div id="main">
            <ul>
               <li><a href="#OldCustomer">পুরাতন কাস্টমার</a></li>
               <li><a href="#NewCustomer">নতুন কাস্টমার</a></li>
            </ul>

            <div id="OldCustomer">
               <asp:UpdatePanel ID="UpdatePanel2" runat="server" UpdateMode="Conditional">
                  <ContentTemplate>
                     <table>
                        <tr>
                           <td>মোবাইল নাম্বার<asp:RequiredFieldValidator ID="RequiredFieldValidator52" runat="server" ControlToValidate="Fab_Cus_Phone" CssClass="EroorSummer" ErrorMessage="মোবাইল নাম্বার দিন" ValidationGroup="OldC">*</asp:RequiredFieldValidator>
                           </td>
                        </tr>
                        <tr>
                           <td>
                              <asp:TextBox ID="Fab_Cus_Phone" runat="server" CssClass="textbox"></asp:TextBox>
                              <img class="Load" src="../CSS/Ico/Ajax_Loading.gif" style="width: 30px; display: none" />
                              <br />
                              <b class="Cus_Info">
                                 <asp:Label ID="Cus_NameLabel" runat="server" />
                                 <br />
                                 <asp:Label ID="Cus_DueLabel" runat="server" />
                                 <asp:HiddenField ID="Customer_ID_HF" runat="server" />
                              </b></td>
                        </tr>
                        <tr>
                           <td>মোট টাকা</td>
                        </tr>
                        <tr>
                           <td>
                              <asp:TextBox ID="Old_CustomerAmtTextBox" runat="server" autocomplete="off" CssClass="textbox" onDrop="blur();return false;" onkeypress="return isNumberKey(event)" onpaste="return false"></asp:TextBox>
                           </td>
                        </tr>
                        <tr>
                           <td>
                              <asp:Label ID="Old_CusAmtLabel" runat="server" CssClass="Amount_Msg"></asp:Label>
                           </td>
                        </tr>
                        <tr>
                           <td>
                              <asp:Button ID="OldCustomerButton" runat="server" CssClass="ContinueButton" Text="Submit" ValidationGroup="OldC" OnClick="OldCustomerButton_Click" />
                              <br />
                              <asp:Label ID="CustomerErlbl2" runat="server" CssClass="EroorSummer"></asp:Label>
                           </td>
                        </tr>
                     </table>
                  </ContentTemplate>
               </asp:UpdatePanel>
            </div>

            <div id="NewCustomer">
               <table>
                  <tr>
                     <td>কাস্টমার নং ::<asp:Label ID="CustomerIDLabel" runat="server" Font-Bold="True"></asp:Label>
                     </td>
                  </tr>
                  <tr>
                     <td>জেন্ডার</td>
                  </tr>
                  <tr>
                     <td>
                        <asp:DropDownList ID="GenderDropDownList" runat="server" DataSourceID="Measurement_ForSQL" DataTextField="Cloth_For" DataValueField="Cloth_For_ID" CssClass="dropdown">
                        </asp:DropDownList>
                        <asp:SqlDataSource ID="Measurement_ForSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM [Cloth_For]"></asp:SqlDataSource>
                     </td>
                  </tr>
                  <tr>
                     <td>কাস্টমারের নাম
                        <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="CustomerNameTextBox" CssClass="EroorSummer" ErrorMessage="কাস্টমারের নাম দিন" ValidationGroup="NC">*</asp:RequiredFieldValidator>
                     </td>
                  </tr>
                  <tr>
                     <td>
                        <asp:TextBox ID="CustomerNameTextBox" runat="server" CssClass="textbox"></asp:TextBox>
                     </td>
                  </tr>
                  <tr>
                     <td>মোবাইল নাম্বার
                        <asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="MobaileTextBox" CssClass="EroorSummer" ErrorMessage="মোবাইল নাম্বার দিন" ValidationGroup="NC">*</asp:RequiredFieldValidator>
                     </td>
                  </tr>
                  <tr>
                     <td class="Lnk">
                        <asp:TextBox ID="MobaileTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" CssClass="textbox"></asp:TextBox>
                     </td>
                  </tr>
                  <tr>
                     <td>ঠিকানা</td>
                  </tr>
                  <tr>
                     <td>
                        <asp:TextBox ID="AdressTextBox" runat="server" CssClass="textbox" TextMode="MultiLine"></asp:TextBox>
                     </td>
                  </tr>
                  <tr>
                     <td>মোট টাকা</td>
                  </tr>
                  <tr>
                     <td>
                        <asp:TextBox ID="CustomerTA_TextBox" runat="server" CssClass="textbox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false"></asp:TextBox>
                     </td>
                  </tr>
                  <tr>
                     <td>
                        <asp:Label ID="New_CusAmtLabel" runat="server" CssClass="Amount_Msg"></asp:Label>
                     </td>
                  </tr>
                  <tr>
                     <td>
                        <asp:Button ID="NewCustomerButton" runat="server" CssClass="ContinueButton" OnClick="NewCustomerButton_Click" Text="Submit" ValidationGroup="NC" />
                        <br />
                        <asp:Label ID="CustomerErlbl1" runat="server" CssClass="EroorSummer"></asp:Label>
                        <asp:ValidationSummary ID="ValidationSummary1" runat="server" CssClass="EroorSummer" DisplayMode="List" ValidationGroup="NC" />
                     </td>
                  </tr>
               </table>
               <asp:SqlDataSource ID="InstitutionSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM [Institution]" UpdateCommand="UPDATE Institution SET TotalCustomer = @TotalCustomer WHERE (InstitutionID = @InstitutionID)">
                  <UpdateParameters>
                     <asp:ControlParameter ControlID="CustomerIDLabel" Name="TotalCustomer" PropertyName="Text" Type="Int32" />
                     <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                  </UpdateParameters>
               </asp:SqlDataSource>
               <asp:SqlDataSource ID="CustomerSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                  InsertCommand="INSERT INTO Customer (RegistrationID, InstitutionID, Cloth_For_ID, CustomerName, Phone, Address, Date, CustomerNumber) VALUES (@RegistrationID,@InstitutionID,@Cloth_For_ID,@CustomerName,@Phone,@Address, GETDATE(),(SELECT [dbo].[CustomeSerialNumber](@InstitutionID)))
SELECT @CustomerID = Scope_identity()"
                  SelectCommand="SELECT * FROM Customer WHERE (InstitutionID = @InstitutionID)" OnInserted="CustomerSQL_Inserted">

                  <InsertParameters>
                     <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                     <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                     <asp:ControlParameter ControlID="GenderDropDownList" Name="Cloth_For_ID" PropertyName="SelectedValue" Type="Int32" />
                     <asp:ControlParameter ControlID="CustomerNameTextBox" Name="CustomerName" PropertyName="Text" Type="String" />
                     <asp:ControlParameter ControlID="MobaileTextBox" Name="Phone" PropertyName="Text" Type="String" />
                     <asp:ControlParameter ControlID="AdressTextBox" Name="Address" PropertyName="Text" Type="String" />
                     <asp:Parameter Direction="Output" Name="CustomerID" Type="Int32" />
                  </InsertParameters>
                  <SelectParameters>
                     <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                  </SelectParameters>

               </asp:SqlDataSource>
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

         var grandTotal = 0;
         $("[id*=TotalPriceLabel]").each(function () { grandTotal = grandTotal + parseFloat($(this).text()) });
         $("[id*=GrandTotal]").text(grandTotal.toFixed(2));

         $("[id*=SubtotalLabel]").text(grandTotal.toFixed(2));
         $("[id*=SubTotalHF]").val($("[id*=SubtotalLabel]").text());

         $("[id*=DiscountPercentageTextBox]").val(0);
         $("[id*=DiscountAmoutTextBox]").val(0);

         //Autocomplete Fabric Code
         $("[id$=Fabric_CodeTextBox]").autocomplete({
            source: function (request, response) {
               $.ajax({
                  url: '<%=ResolveUrl("Fabrics_Selling.aspx/Fabric_Code") %>',
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
               $("[id*=UPHF]").val(i.item.SUPrice);
               $("[id*=QuntityHF]").val(i.item.S_Quantity);
               $('.Amnt').show();
            },
            minLength: 1
         });

         //Customer Autocomplete 
         $("[id$=Fab_Cus_Phone]").autocomplete({
            source: function (request, response) {
               $.ajax({
                  url: '<%=ResolveUrl("Fabrics_Selling.aspx/Get_Customer") %>',
                  data: "{'prefix': '" + request.term + "'}",
                  dataType: "json",
                  type: "POST",
                  contentType: "application/json; charset=utf-8",

                  success: function (data) {
                     response($.map(data.d, function (item) {
                        return {
                           label: item.split('||')[0],
                           Cus_Name: item.split('||')[1],
                           Cus_Number: item.split('||')[2],
                           CustomerID: item.split('||')[3]
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
               $("[id*=Cus_NameLabel]").text("(" + i.item.Cus_Number + ") " + i.item.Cus_Name);
               //$("[id*=Cus_DueLabel]").text("Previous Due:");
               $("[id*=Customer_ID_HF]").val(i.item.CustomerID);
            },
            minLength: 1
         });
      });

      $(document).ajaxStart(function () {
         $('.Load').show();
         $('.Amnt').hide();
         ResetValue();
      }).ajaxStop(function () {
         $('.Load').hide();
      });

      //Reset all value
      function ResetValue() {
         $("[id$=FabricsNameLabel]").text("");
         $("[id$=QuantityLabel]").text("");
         $("[id$=UNnameLabel]").text("");
         $("[id$=SellingUnitPLabel]").text("");

         $("[id$=FabricIDHF]").val("");
         $("[id$=UPHF]").val("");
         $("[id$=QuntityHF]").val("");

         $("[id$=StookErLabel]").text("");
         $("[id$=QuantityTextBox]").val("");
         $("[id$=OutLabel]").text("");

         //Customer
         $("[id$=Cus_NameLabel]").text("");
         $("[id$=Cus_DueLabel]").text("");
         $("[id$=Customer_ID_HF]").val("");
      }

      //Quantity TextBox
      $("[id*=QuantityTextBox]").live('keyup', function () {
         var UPrice = parseFloat($("[id*=UPHF]").val());
         var Qntity = parseFloat($("[id*=QuantityTextBox]").val());
         var StookQunt = parseFloat($("[id*=QuntityHF]").val());

         var total = parseFloat(UPrice * Qntity);

         if (!isNaN(total)) {
            $("[id*=OutLabel]").text("Total Price: " + total.toFixed(2) + " Tk");

            "" == ($("[id*=QuantityTextBox]").val()) && (Qntity = 0);
            StookQunt >= Qntity ? ($("[id*=AddToCartButton]").prop("disabled", !1).addClass("ContinueButton"), $("[id*=StookErLabel]").text("Remaining Stook " + (StookQunt - Qntity))) : ($("[id*=StookErLabel]").text("Stock Fabric Quantity " + StookQunt + ". You Don't Sell " + Qntity), $("[id*=QuantityTextBox]").val(StookQunt));
         }
         else {
            $("[id*=StookErLabel]").text("");
            $("[id*=QuantityTextBox]").val("");
            $("[id*=OutLabel]").text("");
         }
      });

      //Discount Amount
      $("[id*=DiscountAmoutTextBox]").live('keyup', function () {
         var TotalPrice = parseFloat($("[id*=GrandTotal]").text());
         var DiscountAmt = parseFloat($("[id*=DiscountAmoutTextBox]").val());
         var DParcenTotal = parseFloat((100 * DiscountAmt) / TotalPrice);

         if (!isNaN(DParcenTotal)) {
            $("[id*=DiscountPercentageTextBox]").val(DParcenTotal.toFixed(2));
            $("[id*=SubtotalLabel]").text((TotalPrice - DiscountAmt).toFixed(2));
            $("[id*=SubTotalHF]").val($("[id*=SubtotalLabel]").text());
         }
         else {
            $("[id*=DiscountPercentageTextBox]").val(0);
            $("[id*=SubtotalLabel]").text($("[id*=GrandTotal]").text());
            $("[id*=SubTotalHF]").val($("[id*=SubtotalLabel]").text());
         }
      });

      //Discount Percentage
      $("[id*=DiscountPercentageTextBox]").live('keyup', function () {
         var TotalPrice = parseFloat($("[id*=GrandTotal]").text());
         var DiscountPercn = parseFloat($("[id*=DiscountPercentageTextBox]").val());
         var DParcenTotal = parseFloat((TotalPrice * DiscountPercn) / 100);

         if (!isNaN(DParcenTotal)) {
            $("[id*=DiscountAmoutTextBox]").val(DParcenTotal.toFixed(3));
            $("[id*=SubtotalLabel]").text((TotalPrice - DParcenTotal).toFixed(2));
            $("[id*=SubTotalHF]").val($("[id*=SubtotalLabel]").text());
         }
         else {
            $("[id*=DiscountAmoutTextBox]").val(0);
            $("[id*=SubtotalLabel]").text($("[id*=GrandTotal]").text());
            $("[id*=SubTotalHF]").val($("[id*=SubtotalLabel]").text());
         }
      });

      //Customer
      function Popup() {
         var PrevDue = parseFloat($("[id*=SubtotalLabel]").text());
         if (PrevDue > 0) {
            $("[id*=CustomerTA_TextBox]").val(PrevDue.toFixed(2));
            $("[id*=Old_CustomerAmtTextBox]").val(PrevDue.toFixed(2));
            $("[id*=New_CusAmtLabel]").text("");
            $("[id*=Old_CusAmtLabel]").text("");

            $find("MPE").show();
         }
         else {
            alert('Invalid Amount');
         }
      };

      $("[id*=CustomerTA_TextBox]").live('keyup', function () {
         var SPrvDue = parseFloat($("[id*=SubtotalLabel]").text());
         var SPaid = parseFloat($("[id*=CustomerTA_TextBox]").val());

         "" == $("[id*=CustomerTA_TextBox]").val() && (SPaid = 0);
         SPrvDue < SPaid ? ($("[id*=NewCustomerButton]").prop("disabled", !0).removeClass("ContinueButton"), $("[id*=New_CusAmtLabel]").text("মোট বাকি " + SPrvDue.toFixed(2) + " টাকা। আপনি দিয়েছেন " + SPaid.toFixed(2) + " টাকা")) : ($("[id*=NewCustomerButton]").prop("disabled", !1).addClass("ContinueButton"), $("[id*=New_CusAmtLabel]").text("বাকি থাকছে " + (SPrvDue - SPaid).toFixed(2) + " টাকা"));
      });

      $("[id*=Old_CustomerAmtTextBox]").live('keyup', function () {
         var SPrvDue2 = parseFloat($("[id*=SubtotalLabel]").text());
         var SPaid2 = parseFloat($("[id*=Old_CustomerAmtTextBox]").val());

         "" == $("[id*=Old_CustomerAmtTextBox]").val() && (SPaid2 = 0);
         SPrvDue2 < SPaid2 ? ($("[id*=OldCustomerButton]").prop("disabled", !0).removeClass("ContinueButton"), $("[id*=Old_CusAmtLabel]").text("মোট বাকি " + SPrvDue2.toFixed(2) + " টাকা। আপনি দিয়েছেন " + SPaid2.toFixed(2) + " টাকা")) : ($("[id*=OldCustomerButton]").prop("disabled", !1).addClass("ContinueButton"), $("[id*=Old_CusAmtLabel]").text("বাকি থাকছে " + (SPrvDue2 - SPaid2).toFixed(2) + " টাকা"));
      });

      function isNumberKey(a) { a = a.which ? a.which : event.keyCode; return 46 != a && 31 < a && (48 > a || 57 < a) ? !1 : !0 };


      //Change Selling Price
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


            var UPrice = parseFloat($("[id*=UPHF]").val());
            var Qntity = parseFloat($("[id*=QuantityTextBox]").val());

            var total = parseFloat(UPrice * Qntity);

            if (!isNaN(total)) {
               $("[id*=OutLabel]").text("Total Price: " + total.toFixed(2) + " Tk");
               $("[id*=AddToCartButton]").prop("disabled", !1).addClass("ContinueButton");
               $("[id*=StookErLabel]").text("");
            }
         }
      });

      //Change UPrice TextBox
      $("[id*=ChangeUPriceTextBox]").live('keyup', function () {
         var UPrice = parseFloat($("[id*=ChangeUPriceTextBox]").val());
         var Qntity = parseFloat($("[id*=QuantityTextBox]").val());

         var SellingUPrice = parseFloat($("[id*=UPHF]").val());

         var total = parseFloat(UPrice * Qntity);

         if (!isNaN(total)) {
            $("[id*=OutLabel]").text("Total Price: " + total.toFixed(2) + " Tk");

            UPrice >= SellingUPrice ? ($("[id*=AddToCartButton]").prop("disabled", !1).addClass("ContinueButton"), $("[id*=StookErLabel]").text("")) : ($("[id*=AddToCartButton]").prop("disabled", !0).removeClass("ContinueButton"), $("[id*=StookErLabel]").text("Bellow current unit price not allow"));
         }
      });
   </script>
</asp:Content>
