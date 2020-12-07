<%@ Page Title="ফেরত দিন" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Return.aspx.cs" Inherits="TailorBD.AccessAdmin.Fabrics.Buying.Return" %>

<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="asp" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <link href="../../../JS/DatePicker/jquery.datepick.css" rel="stylesheet" />
   <style>
      .textbox, .Datetime { width: 194px; }
      .Total { font-size: 15px; font-weight: bold; text-align: right; }
      .Amnt { color: #265496; font-weight: bold; font-size: 14px; }
      .QPTextbox { border: 1px solid #c4c4c4; width: 183px; font-size: 13px; padding: 5px; border-radius: 4px; box-shadow: 0px 0px 8px #d9d9d9; }
      .RTextbox { display: none; border: 1px solid #c4c4c4; width: 183px; font-size: 13px; padding: 5px; border-radius: 4px; box-shadow: 0px 0px 8px #d9d9d9; }
      .KC { float: right; margin-top: 10px; }
   </style>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <asp:ToolkitScriptManager ID="TSM" runat="server" />
   <h3>ফেরত দেওয়ার জন্য রিসিপট নাম্বার দিন</h3>
   <asp:UpdatePanel ID="UpdatePanel2" runat="server">
      <ContentTemplate>
         <table>
            <tr>
               <td>Receipt No<asp:RequiredFieldValidator ID="RequiredFieldValidator53" runat="server" ControlToValidate="ReceiptNoTextBox" CssClass="EroorSummer" ErrorMessage="Required" ValidationGroup="F"></asp:RequiredFieldValidator>
               </td>
               <td>&nbsp;</td>
            </tr>
            <tr>
               <td>
                  <asp:TextBox ID="ReceiptNoTextBox" runat="server" CssClass="textbox"></asp:TextBox>
               </td>
               <td>
                  <asp:Button ID="FindReceiptNoButton" runat="server" CssClass="ContinueButton" Text="Find" ValidationGroup="F" OnClick="FindReceiptNoButton_Click" />
               </td>
            </tr>
         </table>

         <asp:FormView ID="BuyingFormView" runat="server" DataKeyNames="FabricBuyingID" DataSourceID="BuyingSQL">
            <ItemTemplate>
               <asp:Label ID="BuyingIDLabel" runat="server" Text='<%# Bind("FabricBuyingID") %>' Visible="False"></asp:Label>
               <asp:FormView ID="CustomerFormView" runat="server" DataKeyNames="FabricsSupplierID" DataSourceID="InfCustomerSQL">
                  <ItemTemplate>
                     <br />
                     <asp:Label ID="NameLabel" runat="server" Text='<%# Bind("SupplierName") %>' />
                     <asp:Label ID="PhoneLabel" runat="server" Text='<%# Bind("SupplierPhone") %>' />
                     <asp:Label ID="AddressLabel" runat="server" Text='<%# Bind("SupplierAddress") %>' />
                  </ItemTemplate>
               </asp:FormView>
               <asp:SqlDataSource ID="InfCustomerSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT SupplierName, SupplierPhone, SupplierAddress, FabricsSupplierID FROM Fabrics_Supplier WHERE (FabricsSupplierID = (SELECT FabricsSupplierID FROM Fabrics_Buying WHERE (FabricBuyingID = @FabricBuyingID)))">
                  <SelectParameters>
                     <asp:ControlParameter ControlID="BuyingIDLabel" Name="FabricBuyingID" PropertyName="Text" />
                  </SelectParameters>
               </asp:SqlDataSource>

               <br />

               <table class="Total">
                  <tr>
                     <td>ক্রয়ের তারিখ:
                  <asp:Label ID="SellingDateLabel" runat="server" Text='<%# Bind("BuyingDate","{0:d MMM yy}") %>' />
                     </td>
                  </tr>
                  <tr>
                     <td>মোট মূল্য: 
                  <asp:Label ID="PriceLabel" runat="server" Text='<%# Bind("BuyingTotalPrice") %>' />
                        টাকা.
                     </td>
                  </tr>
                  <tr>
                     <td>মোট ছাড়: 
                   (<asp:Label ID="DiscountPercentageLabel" runat="server" Text='<%# Bind("BuyingDiscountPercentage") %>' />%)
                  <asp:Label ID="DiscountAmoutLabel" runat="server" Text='<%# Bind("BuyingDiscountAmount") %>' />
                        টাকা.
                     </td>
                  </tr>

                  <tr>
                     <td>নগত: 
                  <asp:Label ID="PaidLabel" runat="server" Text='<%# Bind("BuyingPaidAmount") %>' />
                        টাকা.
                     </td>
                  </tr>
                  <tr>
                     <td>বাকি: 
                  <asp:Label ID="DueLabel" runat="server" Text='<%# Bind("BuyingDueAmount") %>' />
                        টাকা.
                     </td>
                  </tr>
               </table>
            </ItemTemplate>
         </asp:FormView>

         <asp:SqlDataSource ID="BuyingSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Buying_SN, BuyingTotalPrice, BuyingDiscountAmount, BuyingDiscountPercentage, BuyingPaidAmount - BuyingReturnAmount AS BuyingPaidAmount, BuyingDate, FabricBuyingID, BuyingDueAmount FROM Fabrics_Buying WHERE (InstitutionID = @InstitutionID) AND (Buying_SN = @Buying_SN)">
            <SelectParameters>
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
               <asp:ControlParameter ControlID="ReceiptNoTextBox" Name="Buying_SN" PropertyName="Text" />
            </SelectParameters>
         </asp:SqlDataSource>

         <asp:SqlDataSource ID="Fabric_Buying_ListSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Fabrics.FabricsName, Fabrics.FabricCode, Fabrics_Buying_List.BuyingQuantity, Fabrics_Buying_List.BuyingPrice, Fabrics_Buying_List.BuyingUnitPrice, Fabrics_Buying.Buying_SN, Fabrics_Buying_List.FabricID, Fabrics.SellingUnitPrice, Fabrics_Buying_List.FabricBuyingListID, Fabrics.StockFabricQuantity, Fabrics_Buying.InstitutionID FROM Fabrics INNER JOIN Fabrics_Buying_List ON Fabrics.FabricID = Fabrics_Buying_List.FabricID INNER JOIN Fabrics_Buying ON Fabrics_Buying_List.FabricBuyingID = Fabrics_Buying.FabricBuyingID WHERE (Fabrics_Buying.Buying_SN = @Buying_SN) AND (Fabrics_Buying.InstitutionID = @InstitutionID)">
            <SelectParameters>
               <asp:ControlParameter ControlID="ReceiptNoTextBox" Name="Buying_SN" PropertyName="Text" />
                <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
            </SelectParameters>
         </asp:SqlDataSource>

         <h4 class="Hide">পূর্বের ক্রয়কৃত কাপড়ের তালিকা</h4>
         <asp:GridView ID="BuyingListGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataSourceID="Fabric_Buying_ListSQL" DataKeyNames="FabricID" OnRowDataBound="BuyingListGridView_RowDataBound" OnDataBound="BuyingListGridView_DataBound">
            <Columns>
               <asp:TemplateField HeaderText="Fabric Code">
                  <ItemTemplate>
                     <asp:Label ID="FabricCodeLabel" runat="server" Text='<%# Bind("FabricCode") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:BoundField DataField="FabricsName" HeaderText="Fabrics Name" />
               <asp:TemplateField HeaderText="Selling Unit Price">
                  <ItemTemplate>
                     <asp:Label ID="SellingUPLabel" runat="server" Text='<%# Bind("SellingUnitPrice") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:TemplateField HeaderText="Buying Quantity">
                  <ItemTemplate>
                     <asp:Label ID="BuyingQuantityLabel" runat="server" Text='<%# Bind("BuyingQuantity") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:TemplateField HeaderText="Keep Quantity">
                  <ItemTemplate>
                     <asp:TextBox ID="BuyingQuantityTextBox" runat="server" Text="0" CssClass="textbox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" />
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:TemplateField HeaderText="Stock" SortExpression="StockFabricQuantity">
                  <ItemTemplate>
                     <asp:Label ID="StockLabel" runat="server" Text='<%# Bind("StockFabricQuantity") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:TemplateField HeaderText="Buying UP">
                  <ItemTemplate>
                     <asp:Label ID="BuyingUPLabel" runat="server" Text='<%# Bind("BuyingUnitPrice") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:BoundField DataField="BuyingPrice" HeaderText="Price" />
            </Columns>
         </asp:GridView>

         <div class="KC">
            <asp:Button ID="ReturnListButton" runat="server" CssClass="ContinueButton" OnClick="ReturnListButton_Click" Text="Keep in cart" />
            <a onclick="Popup();">Buy New Fabrics</a>
         </div>

         <h4 class="Discount_Hide">Newly Added Fabrics</h4>
         <asp:GridView ID="ChargeGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" ShowFooter="True">
            <Columns>
               <asp:TemplateField Visible="false">
                  <ItemTemplate>
                     <asp:Label ID="FabricIDLabel" runat="server" Text='<%# Bind("FabricID") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:TemplateField HeaderText="Fabric Code">
                  <ItemTemplate>
                     <asp:Label ID="ListFabricCodeLabel" runat="server" Text='<%# Bind("FabricCode") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:TemplateField HeaderText="Selling Unit Price">
                  <ItemTemplate>
                     <asp:Label ID="Selling_UPLabel" runat="server" Text='<%# Bind("Selling_UP") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:TemplateField HeaderText="Quantity">
                  <ItemTemplate>
                     <asp:Label ID="QntLabel" runat="server" Text='<%# Bind("Quantity") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:TemplateField HeaderText="Unit Price">
                  <ItemTemplate>
                     <asp:Label ID="Buying_UPLabel" runat="server" Text='<%# Bind("UnitPrice") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:TemplateField HeaderText="Price">
                  <ItemTemplate>
                     <asp:Label ID="TotalPriceLabel" runat="server" Text='<%# Bind("TotalPrice") %>'></asp:Label>
                  </ItemTemplate>
                  <FooterTemplate>
                     <div class="Amnt">
                        সর্বমোট:
                  <asp:Label ID="GrandTotal" runat="server"></asp:Label>
                        Tk.
                     </div>
                  </FooterTemplate>
               </asp:TemplateField>

               <asp:TemplateField>
                  <ItemTemplate>
                     <asp:LinkButton ID="DeleteImageButton" runat="server" CausesValidation="False" CommandName="Delete" CssClass="Delete" OnClick="RowDelete" ToolTip="ডিলিট করুন"></asp:LinkButton>
                  </ItemTemplate>
                  <ItemStyle Width="40px" />
               </asp:TemplateField>
            </Columns>
            <FooterStyle BackColor="#F4F4F4" />
         </asp:GridView>

         <br />
         <table>
            <tr>
               <td class="Discount_Hide">&nbsp;</td>
               <td class="Discount_Hide">&nbsp;</td>
            </tr>
            <tr>
               <td class="Discount_Hide">মোট ছাড়</td>
               <td class="Discount_Hide">
                  <asp:TextBox ID="DiscountAmoutTextBox" runat="server" autocomplete="off" CssClass="textbox" onDrop="blur();return false;" onkeypress="return isNumberKey(event)" onpaste="return false"></asp:TextBox>
               </td>
            </tr>
            <tr>
               <td class="Discount_Hide">% হিসাবে ছাড়</td>
               <td class="Discount_Hide">
                  <asp:TextBox ID="DiscountPercentageTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" CssClass="textbox"></asp:TextBox>
                  <asp:RegularExpressionValidator ID="RegularExpressionValidator1" runat="server" ControlToValidate="DiscountPercentageTextBox" CssClass="EroorSummer" ErrorMessage="Allow 0 - 100% Only" SetFocusOnError="True" ValidationExpression="^0*(([0-9]{1,2}){1}(\.[0-9]*)?|100)$" ValidationGroup="S"></asp:RegularExpressionValidator>
               </td>
            </tr>
            <tr>
               <td class="Hide">&nbsp;</td>
               <td class="Hide">
                  <div class="Amnt">
                     মোট:
               <asp:Label ID="SubtotalLabel" runat="server"></asp:Label>
                     টাকা.
                <asp:Label ID="ReturnAmountLbl" runat="server" Font-Bold="False" Font-Size="9pt" ForeColor="#FF6600"></asp:Label>
                  </div>
               </td>
            </tr>
            <%
               System.Data.DataView DetailsDV = new System.Data.DataView();
               DetailsDV = (System.Data.DataView)AccountSQL.Select(DataSourceSelectArguments.Empty);
               if (DetailsDV.Count > 0)
               {%>
            <tr>
               <td class="Hide">একাউন্ট</td>
               <td class="Hide">

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
               <td class="Hide">ফিরতের তারিখ</td>
               <td class="Hide">
                  <asp:TextBox ID="ReturnDateTextBox" runat="server" CssClass="Datetime"></asp:TextBox>
                  <asp:RequiredFieldValidator ID="RequiredFieldValidator57" runat="server" ControlToValidate="ReturnDateTextBox" CssClass="EroorSummer" ErrorMessage="Required" ValidationGroup="S"></asp:RequiredFieldValidator>
               </td>
            </tr>
            <tr>
               <td class="Hide">&nbsp;</td>
               <td class="Hide">
                  <asp:Label ID="CheckBalanceLabel" runat="server" CssClass="EroorSummer"></asp:Label>
               </td>
            </tr>
            <tr>
               <td class="Hide">&nbsp;</td>
               <td class="Hide">
                  <asp:Button ID="ReplacementButton" runat="server" CssClass="ContinueButton" Text="Replace Fabrics" ValidationGroup="S" OnClick="ReplacementButton_Click" />
               </td>
            </tr>
            <tr>
               <td class="Hide">&nbsp;</td>
               <td class="Hide">

                  <asp:SqlDataSource ID="Buying_Return_QuantitySQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="SP_Fabrics_Buying_Return_Quantity" SelectCommand="SELECT * FROM [Fabrics_Buying_Return_Quantity]" InsertCommandType="StoredProcedure">
                     <InsertParameters>
                        <asp:Parameter Name="FabricID" Type="Int32" />
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                        <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                        <asp:ControlParameter ControlID="ReturnDateTextBox" DbType="Date" Name="ReturnDate" PropertyName="Text" />
                        <asp:Parameter Name="FabricBuyingID" Type="Int32" />
                        <asp:Parameter Name="Change_Quantity" Type="Double" />
                        <asp:Parameter Name="BuyingPrice" Type="Double" />
                     </InsertParameters>
                  </asp:SqlDataSource>

                  <asp:SqlDataSource ID="Return_PriceSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="SP_Fabrics_Buying_Return_Price" InsertCommandType="StoredProcedure" SelectCommand="SELECT FROM Fabrics_Buying_Return_Price">
                     <InsertParameters>
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                        <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                        <asp:ControlParameter ControlID="AccountDropDownList" Name="AccountID" PropertyName="SelectedValue" Type="Int32" />
                        <asp:ControlParameter ControlID="DiscountAmoutTextBox" Name="BuyingDiscountAmount" PropertyName="Text" Type="Double" />
                        <asp:ControlParameter ControlID="ReturnDateTextBox" DbType="Date" Name="Return_Date" PropertyName="Text" />
                        <asp:ControlParameter ControlID="ReturnDateTextBox" DbType="Date" Name="ReturnDate" PropertyName="Text" />
                        <asp:Parameter Name="FabricBuyingID" Type="Int32" />
                        <asp:Parameter Name="IDs" Type="String" />
                     </InsertParameters>
                  </asp:SqlDataSource>

               </td>
            </tr>
         </table>
      </ContentTemplate>
   </asp:UpdatePanel>

   <div id="AddPopup" runat="server" style="display: none;" class="modalPopup">
      <div id="Header" class="Htitle">
         <b>আরো কাপড় যুক্ত করুন</b>
         <div id="Close" class="PopClose"></div>
      </div>

      <div class="Pop_Contain">
         <asp:UpdatePanel ID="UpdatePanel1" runat="server">
            <ContentTemplate>
               <table>
                  <tr>
                     <td>কাপড়</td>
                     <td>
                        <asp:DropDownList ID="FabricDropDownList" runat="server" AutoPostBack="True" CssClass="dropdown" DataSourceID="FabricSQL" DataTextField="FabricCode" DataValueField="FabricID" OnDataBound="FabricDropDownList_DataBound">
                        </asp:DropDownList>
                        <asp:SqlDataSource ID="FabricSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT FabricID, FabricCode, StockFabricQuantity FROM Fabrics WHERE (InstitutionID = @InstitutionID) ">
                           <SelectParameters>
                              <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                           </SelectParameters>
                        </asp:SqlDataSource>

                        <asp:RequiredFieldValidator ID="RequiredFieldValidator55" runat="server" ControlToValidate="FabricDropDownList" CssClass="EroorStar" ErrorMessage="Select Fabrics" InitialValue="0" ValidationGroup="1">*</asp:RequiredFieldValidator>
                     </td>
                  </tr>

                  <tr>
                     <td>&nbsp;</td>
                     <td>
                        <asp:FormView ID="QntFormView" runat="server" DataSourceID="FabricDetailSQL">
                           <ItemTemplate>
                              <b class="Amnt">
                                 <asp:Label ID="FabricsNameLabel" runat="server" Text='<%# Eval("FabricsName") %>' />
                                 (<asp:Label ID="CrQuantityLabel" runat="server" Text='<%# Eval("StockFabricQuantity") %>' />
                                 <asp:Label ID="Label1" runat="server" Text='<%# Eval("UnitName") %>' />)
                           Selling Unit Price:
                           <asp:Label ID="SellingUnitPLabel" runat="server" Text='<%# Eval("SellingUnitPrice") %>' />
                              </b>
                           </ItemTemplate>
                        </asp:FormView>
                        <asp:SqlDataSource ID="FabricDetailSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Fabrics.Fabric_SN, Fabrics.FabricCode, Fabrics.FabricsName, Fabrics.SellingUnitPrice, Fabrics_Mesurement_Unit.UnitName, Fabrics.StockFabricQuantity FROM Fabrics INNER JOIN Fabrics_Mesurement_Unit ON Fabrics.FabricMesurementUnitID = Fabrics_Mesurement_Unit.FabricMesurementUnitID WHERE (Fabrics.FabricID = @FabricID)">
                           <SelectParameters>
                              <asp:ControlParameter ControlID="FabricDropDownList" Name="FabricID" PropertyName="SelectedValue" Type="Int32" />
                           </SelectParameters>
                        </asp:SqlDataSource>

                     </td>
                  </tr>

                  <tr>
                     <td>পরিমান</td>
                     <td>
                        <asp:TextBox ID="TotalQuantityTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" CssClass="QPTextbox"></asp:TextBox>
                        <asp:RequiredFieldValidator ID="RequiredFieldValidator56" runat="server" ControlToValidate="TotalQuantityTextBox" CssClass="EroorSummer" ErrorMessage="Input Quantity" ValidationGroup="1">*</asp:RequiredFieldValidator>
                        <asp:RegularExpressionValidator ID="FRex5" runat="server" ControlToValidate="TotalQuantityTextBox" CssClass="EroorStar" ErrorMessage="0 Not Allowed" SetFocusOnError="True" ValidationExpression="^0*[1-9][0-9]*(\.[0-9]+)?|0+\.[0-9]*[1-9][0-9]*$" ValidationGroup="1">*</asp:RegularExpressionValidator>
                     </td>
                  </tr>
                  <tr>
                     <td>মোট মূল্য</td>
                     <td>
                        <asp:TextBox ID="TotalPriceTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" CssClass="QPTextbox"></asp:TextBox>
                        <asp:RequiredFieldValidator ID="RequiredFieldValidator52" runat="server" ControlToValidate="TotalPriceTextBox" CssClass="EroorSummer" ErrorMessage="Input Price" ValidationGroup="1">*</asp:RequiredFieldValidator>
                        <asp:RegularExpressionValidator ID="FRex4" runat="server" ControlToValidate="TotalPriceTextBox" CssClass="EroorStar" ErrorMessage="0 Not Allowed" SetFocusOnError="True" ValidationExpression="^0*[1-9][0-9]*(\.[0-9]+)?|0+\.[0-9]*[1-9][0-9]*$" ValidationGroup="1">*</asp:RegularExpressionValidator>
                     </td>
                  </tr>
                  <tr>
                     <td>&nbsp;</td>
                     <td>
                        <asp:CheckBox ID="CSPCheckBox" runat="server" Text="Change Selling Unit Price" />
                     </td>
                  </tr>
                  <tr>
                     <td>&nbsp;</td>
                     <td>
                        <asp:TextBox ID="ChangeUPriceTextBox" runat="server" autocomplete="off" CssClass="RTextbox" Enabled="False" onDrop="blur();return false;" onkeypress="return isNumberKey(event)" onpaste="return false"></asp:TextBox>
                        <asp:RequiredFieldValidator ID="CUPRV" runat="server" ControlToValidate="ChangeUPriceTextBox" CssClass="EroorSummer" ErrorMessage="Enter Price" ValidationGroup="1" Enabled="False">*</asp:RequiredFieldValidator>
                        <asp:RegularExpressionValidator ID="FRex" runat="server" ControlToValidate="ChangeUPriceTextBox" CssClass="EroorStar" ErrorMessage="0 Not Allowed" SetFocusOnError="True" ValidationExpression="^0*[1-9][0-9]*(\.[0-9]+)?|0+\.[0-9]*[1-9][0-9]*$" ValidationGroup="1">*</asp:RegularExpressionValidator>
                     </td>
                  </tr>
                  <tr>
                     <td>&nbsp;</td>
                     <td>
                        <asp:Button ID="AddToCartButton" runat="server" CssClass="ContinueButton" Text="Add To Cart" OnClick="AddToCartButton_Click" ValidationGroup="1" />
                        <br />
                        <asp:Label ID="OutLabel" runat="server" CssClass="Amnt"></asp:Label>
                     </td>
                  </tr>
                  <tr>
                     <td>&nbsp;</td>
                     <td>
                        <asp:ValidationSummary ID="ValidationSummary1" runat="server" CssClass="EroorSummer" DisplayMode="List" ValidationGroup="1" />
                     </td>
                  </tr>
               </table>
            </ContentTemplate>
         </asp:UpdatePanel>
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

   <script src="../../../JS/DatePicker/jquery.datepick.js"></script>
   <script>

      //Buying Gridview is empty
      if (!$('[id*=BuyingListGridView] tr').length) {
         $(".Hide").hide();
         $(".KC").hide();
      }
      else {
         $(".Hide").show();
         $(".KC").show();
      }

      //Charge Gridview is empty
      if (!$('[id*=ChargeGridView] tr').length) {
         $(".Discount_Hide").hide();
      }
      else {
         $(".Discount_Hide").show();
      }

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

         $("[id*=TotalQuantityTextBox]").val("");
         $("[id*=TotalPriceTextBox]").val("");

      });

      //Total Price
      $(".QPTextbox").live('keyup', function () {
         var price = parseFloat($("[id*=TotalPriceTextBox]").val());
         var Qnt = parseFloat($("[id*=TotalQuantityTextBox]").val());
         var total = parseFloat(price / Qnt);

         if (!isNaN(total) && total != "Infinity")
            $("[id*=OutLabel]").text("Buying Unit Price: " + total.toFixed(3) + " Tk");
         else
            $("[id*=OutLabel]").text("");
      });

      //Discount Amount
      $("[id*=DiscountAmoutTextBox]").live('keyup', function () {
         var TotalPrice = parseFloat($("[id*=GrandTotal]").text());
         var DiscountAmt = parseFloat($("[id*=DiscountAmoutTextBox]").val());
         var DParcenTotal = parseFloat((100 * DiscountAmt) / TotalPrice);

         if (!isNaN(DParcenTotal)) {
            $("[id*=DiscountPercentageTextBox]").val(DParcenTotal.toFixed(3));
            $("[id*=SubtotalLabel]").text((TotalPrice - DiscountAmt).toFixed(3));
         }
         else {
            $("[id*=DiscountPercentageTextBox]").val(0);
            $("[id*=SubtotalLabel]").text($("[id*=GrandTotal]").text());
         }

         //Return Amount
         var S_Paid = parseFloat($("[id*=PaidLabel]").text());
         var F_Price = parseFloat($("[id*=SubtotalLabel]").text());
         var Return = parseFloat(S_Paid - F_Price);

         if (!isNaN(Return)) {
            if (Return > 0) {
               $("[id*=ReturnAmountLbl]").text("(সাপ্লায়ারের কাছে পাওনা : " + Return.toFixed(3) + " টাকা)");
            }
            else {
               $("[id*=ReturnAmountLbl]").text("(পূর্বে দেওয়া " + S_Paid + " টাকা বর্তমান বাকি " + Math.abs(Return.toFixed(3)) + "  টাকা)");
            }
         }
      });

      //Discount Percentage
      $("[id*=DiscountPercentageTextBox]").live('keyup', function () {
         var TotalPrice = parseFloat($("[id*=GrandTotal]").text());
         var DiscountPercn = parseFloat($("[id*=DiscountPercentageTextBox]").val());
         var DParcenTotal = parseFloat((TotalPrice * DiscountPercn) / 100);

         if (!isNaN(DParcenTotal)) {
            $("[id*=DiscountAmoutTextBox]").val(DParcenTotal.toFixed(3));
            $("[id*=SubtotalLabel]").text((TotalPrice - DParcenTotal).toFixed(3));
         }

         else {
            $("[id*=DiscountAmoutTextBox]").val(0);
            $("[id*=SubtotalLabel]").text($("[id*=GrandTotal]").text());
         }

         //Return Amount
         var S_Paid = parseFloat($("[id*=PaidLabel]").text());
         var F_Price = parseFloat($("[id*=SubtotalLabel]").text());
         var Return = parseFloat(S_Paid - F_Price);

         if (!isNaN(Return)) {
            if (Return > 0) {
               $("[id*=ReturnAmountLbl]").text("(সাপ্লায়ারের কাছে পাওনা " + Return.toFixed(3) + " টাকা)");
            }
            else {
               $("[id*=ReturnAmountLbl]").text("(পূর্বে দেওয়া " + S_Paid + " টাকা বর্তমান বাকি  " + Math.abs(Return.toFixed(3)) + " টাকা)");
            }
         }
      });

      Sys.WebForms.PageRequestManager.getInstance().add_endRequest(function (a, b) {
         $(".Datetime").datepick();

         //Buying Gridview is empty
         if (!$('[id*=BuyingListGridView] tr').length) {
            $(".Hide").hide();
            $(".KC").hide();
         }
         else {
            $(".Hide").show();
            $(".KC").show();
         }

         //Charge Gridview is empty
         if (!$('[id*=ChargeGridView] tr').length) {
            $(".Discount_Hide").hide();
         }
         else {
            $(".Discount_Hide").show();
         }
         
         var grandTotal = 0;
         $("[id*=TotalPriceLabel]").each(function () { grandTotal = grandTotal + parseFloat($(this).text()) });
         $("[id*=GrandTotal]").text(grandTotal.toFixed(3));

         $("[id*=SubtotalLabel]").text(grandTotal.toFixed(3));

         $("[id*=DiscountPercentageTextBox]").val(0);
         $("[id*=DiscountAmoutTextBox]").val(0);

         //Return Amount
         var S_Paid = parseFloat($("[id*=PaidLabel]").text());
         var F_Price = parseFloat($("[id*=SubtotalLabel]").text());
         var Return = parseFloat(S_Paid - F_Price);

         if (!isNaN(Return)) {
            if (Return > 0) {
               $("[id*=ReturnAmountLbl]").text("(সাপ্লায়ারের কাছে পাওনা " + Return.toFixed(3) + " টাকা)");
            }
            else {
               $("[id*=ReturnAmountLbl]").text("(পূর্বে দেওয়া " + S_Paid + " টাকা, বর্তমান বাকি " + Math.abs(Return.toFixed(3)) + " টাকা)");
            }
         }
      });

      function Popup() {$find("MPE").show()}

      function isNumberKey(a) { a = a.which ? a.which : event.keyCode; return 46 != a && 31 < a && (48 > a || 57 < a) ? !1 : !0 };
   </script>
</asp:Content>
