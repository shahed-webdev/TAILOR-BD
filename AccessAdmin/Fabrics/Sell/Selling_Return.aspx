<%@ Page Title="ফেরত দিন" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Selling_Return.aspx.cs" Inherits="TailorBD.AccessAdmin.Fabrics.Sell.Return" %>

<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="asp" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <link href="../../../JS/DatePicker/jquery.datepick.css" rel="stylesheet" />
   <style>
      .textbox, .Datetime { width: 194px; }
      .Total { font-size: 15px; font-weight: bold; text-align: right; }
      .Amnt { color: #265496; font-weight: bold; font-size: 14px; }
      .KC { float: right; margin-top: 10px; }
   </style>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <asp:ToolkitScriptManager ID="TSM" runat="server" />
   <h3>বিক্রয়কৃত কাপড় পরির্বতন/ফেরত</h3>
   <asp:UpdatePanel ID="UpdatePanel2" runat="server">
      <ContentTemplate>

         <table>
            <tr>
               <td>রিসিপট নং.<asp:RequiredFieldValidator ID="RequiredFieldValidator53" runat="server" ControlToValidate="ReceiptNoTextBox" CssClass="EroorSummer" ErrorMessage="Required" ValidationGroup="1"></asp:RequiredFieldValidator>
               </td>
               <td>&nbsp;</td>
            </tr>
            <tr>
               <td>
                  <asp:TextBox ID="ReceiptNoTextBox" runat="server" CssClass="textbox"></asp:TextBox>
               </td>
               <td>
                  <asp:Button ID="FindReceiptNoButton" runat="server" CssClass="ContinueButton" Text="Find" OnClick="FindReceiptNoButton_Click" />
               </td>
            </tr>
         </table>

         <asp:FormView ID="SellFormView" runat="server" DataKeyNames="FabricsSellingID" DataSourceID="SellSQL">
            <ItemTemplate>
               <asp:Label ID="SellingIDLabel" runat="server" Text='<%# Bind("FabricsSellingID") %>' Visible="False"></asp:Label>


               <asp:FormView ID="CustomerFormView" runat="server" DataKeyNames="CustomerID" DataSourceID="InfCustomerSQL">
                  <ItemTemplate>
                     <br />
                     <asp:Label ID="NameLabel" runat="server" Text='<%# Bind("CustomerName") %>' />
                     <asp:Label ID="PhoneLabel" runat="server" Text='<%# Bind("Phone") %>' />
                     <asp:Label ID="AddressLabel" runat="server" Text='<%# Bind("Address") %>' />
                  </ItemTemplate>
               </asp:FormView>
               <asp:SqlDataSource ID="InfCustomerSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM [Customer] WHERE ([CustomerID] = (SELECT  CustomerID FROM  Fabrics_Selling WHERE  (FabricsSellingID = @FabricsSellingID)))">
                  <SelectParameters>
                     <asp:ControlParameter ControlID="SellingIDLabel" Name="FabricsSellingID" PropertyName="Text" />
                  </SelectParameters>
               </asp:SqlDataSource>

               <br />

               <table class="Total">
                  <tr>
                     <td>বিক্রয়ের তারিখ:
                  <asp:Label ID="SellingDateLabel" runat="server" Text='<%# Bind("SellingDate","{0:d MMM yy}") %>' />
                     </td>
                  </tr>
                  <tr>
                     <td>মোট মূল্য: 
                  <asp:Label ID="PriceLabel" runat="server" Text='<%# Bind("SellingTotalPrice") %>' />
                        টাকা.
                     </td>
                  </tr>
                  <tr>
                     <td>ছাড়: 
                   (<asp:Label ID="DiscountPercentageLabel" runat="server" Text='<%# Bind("SellingDiscountPercentage") %>' />%)
                  <asp:Label ID="DiscountAmoutLabel" runat="server" Text='<%# Bind("SellingDiscountAmount") %>' />
                        টাকা.
                     </td>
                  </tr>

                  <tr>
                     <td>নগত: 
                  <asp:Label ID="PaidLabel" runat="server" Text='<%# Bind("SellingPaidAmount") %>' />
                        টাকা.
                     </td>
                  </tr>
                  <tr>
                     <td>বাকি: 
                  <asp:Label ID="DueLabel" runat="server" Text='<%# Bind("SellingDueAmount") %>' />
                        টাকা.
                     </td>
                  </tr>
               </table>
            </ItemTemplate>
         </asp:FormView>

         <asp:SqlDataSource ID="SellSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Selling_SN, SellingTotalPrice, SellingDiscountAmount, SellingDiscountPercentage, SellingPaidAmount - SellingReturnAmount AS SellingPaidAmount, SellingDueAmount, SellingDate, FabricsSellingID, SellingReturnAmount FROM Fabrics_Selling WHERE (InstitutionID = @InstitutionID) AND (Selling_SN = @Selling_SN)">
            <SelectParameters>
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
               <asp:ControlParameter ControlID="ReceiptNoTextBox" Name="Selling_SN" PropertyName="Text" />
            </SelectParameters>
         </asp:SqlDataSource>

         <asp:SqlDataSource ID="Fabric_Selling_ListSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Fabrics_Selling_List.SellingQuantity, Fabrics_Selling_List.SellingPrice, Fabrics.FabricsName, Fabrics_Selling_List.SellingUnitPrice, Fabrics.FabricCode, Fabrics_Selling.Selling_SN, Fabrics_Selling_List.FabricID FROM Fabrics_Selling_List INNER JOIN Fabrics ON Fabrics_Selling_List.FabricID = Fabrics.FabricID INNER JOIN Fabrics_Selling ON Fabrics_Selling_List.FabricsSellingID = Fabrics_Selling.FabricsSellingID WHERE (Fabrics_Selling.Selling_SN = @Selling_SN) AND (Fabrics_Selling_List.InstitutionID = @InstitutionID)">
            <SelectParameters>
               <asp:ControlParameter ControlID="ReceiptNoTextBox" Name="Selling_SN" PropertyName="Text" />
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
            </SelectParameters>
         </asp:SqlDataSource>
         <h4 class="Hide">বিক্রয় কৃত কাপড় এর লিস্ট</h4>
         <asp:GridView ID="SellingListGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataSourceID="Fabric_Selling_ListSQL" DataKeyNames="FabricID">
            <Columns>
               <asp:TemplateField HeaderText="ফ্যাব্রিক্স কোড">
                  <ItemTemplate>
                     <asp:Label ID="FabricCodeLabel" runat="server" Text='<%# Bind("FabricCode") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>

               <asp:BoundField DataField="FabricsName" HeaderText="কাপড়ের নাম" />

               <asp:TemplateField HeaderText="বিক্রির পরিমান">
                  <ItemTemplate>
                     <asp:Label ID="SelQuantityLabel" runat="server" Text='<%# Bind("SellingQuantity") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:TemplateField HeaderText="রাখার পরিমান">
                  <ItemTemplate>
                     <asp:TextBox ID="SellQuantityTextBox" runat="server" Text="0" CssClass="textbox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false"></asp:TextBox>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:TemplateField HeaderText="ইউনিট মূল্য" SortExpression="SellingUnitPrice">
                  <ItemTemplate>
                     <asp:Label ID="SellingUPLabel" runat="server" Text='<%# Bind("SellingUnitPrice") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:BoundField DataField="SellingPrice" HeaderText="মোট মূল্য" SortExpression="SellingPrice" />
            </Columns>
         </asp:GridView>

         <div class="KC">
            <asp:Button ID="ReturnListButton" runat="server" CssClass="ContinueButton" OnClick="ReturnListButton_Click" Text="যে গুলো রেখেছেন তার লিস্ট তৈরী করুন" />
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
               <asp:TemplateField HeaderText="ফ্যাব্রিক্স কোড">
                  <ItemTemplate>
                     <asp:Label ID="FabricCodeLabel" runat="server" Text='<%# Bind("FabricCode") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:TemplateField HeaderText="কাপড়ের পরিমান">
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
                        টাকা.
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


         <table class="Hide">
            <tr>
               <td class="Discount_Hide">&nbsp;</td>
               <td class="Discount_Hide">&nbsp;</td>
            </tr>
            <tr>
               <td class="Discount_Hide">মোট ডিসকাউন্ট</td>
               <td class="Discount_Hide">
                  <asp:TextBox ID="DiscountAmoutTextBox" runat="server" autocomplete="off" CssClass="textbox" onDrop="blur();return false;" onkeypress="return isNumberKey(event)" onpaste="return false"></asp:TextBox>
               </td>
            </tr>
            <tr>
               <td class="Discount_Hide">ডিসকাউন্ট %</td>
               <td class="Discount_Hide">
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
               <td>ফিরতের তারিখ</td>
               <td>
                  <asp:TextBox ID="ReturnDateTextBox" runat="server" CssClass="Datetime" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false"></asp:TextBox>
                  <asp:RequiredFieldValidator ID="RequiredFieldValidator57" runat="server" ControlToValidate="ReturnDateTextBox" CssClass="EroorSummer" ErrorMessage="Required" ValidationGroup="S"></asp:RequiredFieldValidator>
               </td>
            </tr>
            <tr>
               <td>স্টকে যুক্ত করতে চান ?</td>
               <td>
                  <asp:RadioButtonList ID="AddtoStockRadioButtonList" runat="server" RepeatDirection="Horizontal">
                     <asp:ListItem Selected="True">Yes</asp:ListItem>
                     <asp:ListItem>No</asp:ListItem>
                  </asp:RadioButtonList>
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
                  <asp:Button ID="ReplacementButton" runat="server" CssClass="ContinueButton" Text="Submit" ValidationGroup="S" OnClick="ReplacementButton_Click" />
               </td>
            </tr>
            <tr>
               <td>&nbsp;</td>
               <td>

                  <asp:SqlDataSource ID="Selling_Return_QuantitySQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="SP_Fabrics_Selling_Return_Quantity" SelectCommand="SELECT * FROM [Fabrics_Selling_Return_Quantity]" InsertCommandType="StoredProcedure">
                     <InsertParameters>
                        <asp:Parameter Name="FabricID" Type="Int32" />
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                        <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                        <asp:Parameter Name="FabricsSellingID" Type="Int32" />
                        <asp:ControlParameter ControlID="ReturnDateTextBox" DbType="Date" Name="ReturnDate" PropertyName="Text" />
                        <asp:Parameter Name="Change_Quantity" Type="Double" />
                        <asp:Parameter Name="SellingUnitPrice" Type="Double" />
                        <asp:ControlParameter ControlID="AddtoStockRadioButtonList" Name="Add_To_Stock" PropertyName="SelectedValue" Type="String" />
                     </InsertParameters>
                  </asp:SqlDataSource>

                  <asp:SqlDataSource ID="Return_PriceSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="SP_Fabrics_Selling_Return_Price" InsertCommandType="StoredProcedure" SelectCommand="SELECT FROM Fabrics_Selling_Return_Price">
                     <InsertParameters>
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                        <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                        <asp:Parameter Name="FabricsSellingID" Type="Int32" />
                        <asp:ControlParameter ControlID="ReturnDateTextBox" Name="Return_Date" PropertyName="Text" DbType="Date" />
                        <asp:ControlParameter ControlID="DiscountAmoutTextBox" Name="SellingDiscountAmount" PropertyName="Text" Type="Double" />
                        <asp:ControlParameter ControlID="AccountDropDownList" Name="AccountID" PropertyName="SelectedValue" Type="Int32" />
                        <asp:ControlParameter ControlID="ReturnDateTextBox" DbType="Date" Name="ReturnDate" PropertyName="Text" />
                        <asp:ControlParameter ControlID="AddtoStockRadioButtonList" Name="Add_To_Stock" PropertyName="SelectedValue" Type="String" />
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
                        <asp:SqlDataSource ID="FabricSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT FabricID, FabricCode, StockFabricQuantity FROM Fabrics WHERE (InstitutionID = @InstitutionID) AND (StockFabricQuantity &lt;&gt; 0)">
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
                                 (<asp:Label ID="Quantity_Label" runat="server" Text='<%# Eval("StockFabricQuantity") %>' />
                                 <asp:Label ID="Label1" runat="server" Text='<%# Eval("UnitName") %>' />)
                          ইউনিট মূল্য:
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
                        <asp:TextBox ID="NewQuantityTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" CssClass="textbox"></asp:TextBox>
                        <asp:Label ID="StookErLabel" runat="server" ForeColor="#009933"></asp:Label>
                        <asp:RegularExpressionValidator ID="FRex3" runat="server" ControlToValidate="NewQuantityTextBox" CssClass="EroorStar" ErrorMessage="0 Not Allowed" SetFocusOnError="True" ValidationExpression="^0*[1-9][0-9]*(\.[0-9]+)?|0+\.[0-9]*[1-9][0-9]*$" ValidationGroup="1">*</asp:RegularExpressionValidator>
                        <asp:RequiredFieldValidator ID="RequiredFieldValidator51" runat="server" ControlToValidate="NewQuantityTextBox" CssClass="EroorSummer" ErrorMessage="Input Quantity" ValidationGroup="1">*</asp:RequiredFieldValidator>
                     </td>
                  </tr>
                  <tr>
                     <td>&nbsp;</td>
                     <td>
                        <asp:Label ID="OutLabel" runat="server" CssClass="Amnt"></asp:Label>
                     </td>
                  </tr>
                  <tr>
                     <td>&nbsp;</td>
                     <td>
                        <asp:Button ID="AddToCartButton" runat="server" CssClass="ContinueButton" Text="নতুন ক্রয় করুন" OnClick="AddToCartButton_Click" ValidationGroup="1" />
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
      //Disable the submit button after clicking
      $("form").submit(function () {
         $(".ContinueButton").attr("disabled", true);
         setTimeout(function () {
            $(".ContinueButton").prop('disabled', false);
         }, 2000); // 2 seconds
         return true;
      })


      Sys.WebForms.PageRequestManager.getInstance().add_endRequest(function (a, b) {
         $(".Datetime").datepick();

         //Selling Gridview is empty
         if (!$('[id*=SellingListGridView] tr').length) {
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


         //Fabrics DropDownList
         $("[id*=FabricDropDownList]").change(function (e) {
            $("[id*=NewQuantityTextBox]").val("");
         });

         //Quantity TextBox
         $("[id*=NewQuantityTextBox]").live('keyup', function () {
            var UPrice = parseFloat($("[id*=SellingUnitPLabel]").text());
            var Qntity = parseFloat($("[id*=NewQuantityTextBox]").val());
            var StookQunt = parseFloat($("[id*=Quantity_Label]").text());

            var total = parseFloat(UPrice * Qntity);

            if (!isNaN(total)) {
               $("[id*=OutLabel]").text("Total Price: " + total.toFixed(3) + " Tk");

               "" == ($("[id*=NewQuantityTextBox]").val()) && (Qntity = 0);
               StookQunt >= Qntity ? ($("[id*=AddToCartButton]").prop("disabled", !1).addClass("ContinueButton"), $("[id*=StookErLabel]").text("Remaining Stook " + (StookQunt - Qntity))) : ($("[id*=AddToCartButton]").prop("disabled", !0).removeClass("ContinueButton"), $("[id*=StookErLabel]").text("Stock Fabric Quantity " + StookQunt + ". You Don't Sell " + Qntity));
            }
            else {
               $("[id*=StookErLabel]").text("");
               $("[id*=NewQuantityTextBox]").val("");
               $("[id*=OutLabel]").text("");
            }
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
                  $("[id*=ReturnAmountLbl]").text("(ফেরত দিতে হবে: " + Return.toFixed(3) + " টাকা)");
               }
               else {
                  $("[id*=ReturnAmountLbl]").text("(পূর্বে দেওয়া " + S_Paid + " &  বর্তমান বাকিt " + Math.abs(Return.toFixed(3)) + " টাকা)");
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
                  $("[id*=ReturnAmountLbl]").text("(ফেরত দিতে হবে: " + Return.toFixed(3) + " টাকা)");
               }
               else {
                  $("[id*=ReturnAmountLbl]").text("(পূর্বে দেওয়া " + S_Paid + " &  বর্তমান বাকি " + Math.abs(Return.toFixed(3)) + " টাকা)");
               }
            }
         });

       

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
               $("[id*=ReturnAmountLbl]").text("(ফেরত দিতে হবে: " + Return.toFixed(3) + " টাকা)");
            }
            else {
               $("[id*=ReturnAmountLbl]").text("(পূর্বে দেওয়া " + S_Paid + " &  বর্তমান বাকি " + Math.abs(Return.toFixed(3)) + " টাকা)");
            }
         }
      });


      //Selling Gridview is empty
      if (!$('[id*=SellingListGridView] tr').length) {
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

      function isNumberKey(a) { a = a.which ? a.which : event.keyCode; return 46 != a && 31 < a && (48 > a || 57 < a) ? !1 : !0 };

      function Popup() {
         $find("MPE").show();
      }
   </script>
</asp:Content>
