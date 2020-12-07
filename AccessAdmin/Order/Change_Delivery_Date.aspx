<%@ Page Title="ডেলিভারি তারিখ পরিবর্তন করুন" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Change_Delivery_Date.aspx.cs" Inherits="TailorBD.AccessAdmin.Order.Change_Delivery_Date" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <link href="../../JS/DatePicker/jquery.datepick.css" rel="stylesheet" />
   <style>
      .mGrid td .mGrid th { border: 1px solid #fff; background-color: #fff; padding: 0; color: #069263; font-size: 11px; }
      .mGrid th { font-size: 13px; padding: 6px 1px; }
      .mGrid .textbox { font-size: 12px; padding: 2px 4px; }
      .mGrid td table tr td { border: none; text-align: center; }
   </style>
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <asp:ScriptManager ID="ScriptManager1" runat="server"></asp:ScriptManager>
   <asp:UpdatePanel ID="UpdatePanel1" runat="server">
      <ContentTemplate>
         <h3>ডেলিভারি তারিখ পরিবর্তন করুন</h3>
         <asp:RadioButtonList ID="FindRadioButtonList" runat="server" RepeatDirection="Horizontal" RepeatLayout="Flow" CssClass="RadioB">
            <asp:ListItem Selected="True">Order No. And Mobile No.</asp:ListItem>
            <asp:ListItem>Delivery Date</asp:ListItem>
         </asp:RadioButtonList>

         <div class="Search_Number">
            <table>
               <tr>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
               </tr>
               <tr>
                  <td>মোবাইল নাম্বার</td>
                  <td>অর্ডার নাম্বার</td>
                  <td>&nbsp;</td>
               </tr>
               <tr>
                  <td>
                     <asp:TextBox ID="MobileNoTextBox" runat="server" CssClass="textbox" placeholder="মোবাইল নাম্বার"></asp:TextBox>
                  </td>
                  <td>
                     <asp:TextBox ID="OrderNoTextBox" runat="server" CssClass="textbox" placeholder="অর্ডার নাম্বার"></asp:TextBox>
                  </td>
                  <td>&nbsp;</td>
               </tr>
               <tr>
                  <td>কাস্টমারের নাম</td>
                  <td>ঠিকানা</td>
                  <td>&nbsp;</td>
               </tr>
               <tr>
                  <td>
                     <asp:TextBox ID="SearchNameTextBox" runat="server" CssClass="textbox" placeholder="কাস্টমারের নাম"></asp:TextBox>
                  </td>
                  <td>
                     <asp:TextBox ID="AddressTextBox" runat="server" CssClass="textbox" placeholder="ঠিকানা"></asp:TextBox>
                  </td>
                  <td>
                     <asp:Button ID="FindButton" runat="server" CssClass="SearchButton" ValidationGroup="1" />
                  </td>
               </tr>
               <tr>
                  <td colspan="3">
                     <asp:RegularExpressionValidator ID="RegularExpressionValidator2" runat="server" ControlToValidate="OrderNoTextBox" CssClass="EroorSummer" ErrorMessage="শুধু ইংরেজী নাম্বার লেখা যাবে" ValidationExpression="^\d+$" ValidationGroup="1"></asp:RegularExpressionValidator>
                     &nbsp;<asp:RegularExpressionValidator ID="RegularExpressionValidator3" runat="server" ControlToValidate="MobileNoTextBox" CssClass="EroorSummer" ErrorMessage="শুধু ইংরেজী নাম্বার লেখা যাবে" ValidationExpression="^\d+$" ValidationGroup="1"></asp:RegularExpressionValidator>
                  </td>
               </tr>
            </table>
         </div>

         <div class="Search_Date">
            <table>
               <tr>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
               </tr>
               <tr>
                  <td>কোন তারিখ থেকে</td>
                  <td>কোন তারিখ পর্যন্ত</td>
                  <td>&nbsp;</td>
               </tr>
               <tr>
                  <td>
                     <asp:TextBox ID="FromDateTextBox" placeholder="কোন তারিখ থেকে" runat="server" CssClass="Datetime" Width="130px" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false"></asp:TextBox>
                  </td>
                  <td>
                     <asp:TextBox ID="ToDateTextBox" runat="server" placeholder="কোন তারিখ পর্যন্ত" CssClass="Datetime" Width="130px" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false"></asp:TextBox>
                  </td>
                  <td>
                     <asp:Button ID="DateFindButton" runat="server" CssClass="SearchButton" ValidationGroup="1" />
                  </td>
               </tr>
               <tr>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
               </tr>
            </table>
         </div>

         <div style="float: right">
            <div class="Today Indicator">Today's Date Delivery</div>
            <div class="Over_Today Indicator">Date Over Delivery</div>
         </div>

         <asp:GridView ID="CustomerOrderdDressGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="OrderID,CustomerID,Phone,CustomerName,InstitutionName,Masking,SMS_Balance,WorkStatus,DeliveryDate" DataSourceID="CustomerOrderdDressSQL" AllowPaging="True" PageSize="25" OnRowDataBound="CustomerOrderdDressGridView_RowDataBound">
            <Columns>
               <asp:TemplateField>
                  <HeaderTemplate>
                     <asp:CheckBox ID="AllCheckBox" runat="server" Text=" " />
                  </HeaderTemplate>
                  <ItemTemplate>
                     <asp:CheckBox ID="CompleteCheckBox" runat="server" Text=" " />
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:TemplateField HeaderText="অর্ডার নং">
                  <ItemTemplate>
                     <asp:Label ID="OSLabel" runat="server" Text='<%# Bind("OrderSerialNumber") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:TemplateField HeaderText="নাম" SortExpression="CustomerName">
                  <ItemTemplate>
                     (<asp:Label ID="Label1" runat="server" Text='<%# Bind("CustomerNumber") %>'></asp:Label>)
                      <asp:Label ID="Label2" runat="server" Text='<%# Bind("CustomerName") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:BoundField DataField="Phone" HeaderText="মোবাইল" SortExpression="Phone" />
               <asp:BoundField DataField="OrderDate" HeaderText="অর্ডারের তারিখ" SortExpression="OrderDate" DataFormatString="{0:d MMM yyyy}" />
               <asp:BoundField DataField="DeliveryDate" HeaderText="ডেলিভারী তারিখ" SortExpression="DeliveryDate" DataFormatString="{0:d MMM yyyy}" />
               <asp:TemplateField HeaderText="অর্ডার লিস্ট নং - পোষাক - পরিমান">
                  <ItemTemplate>
                     <asp:HiddenField ID="OrderIDHiddenField" runat="server" Value='<%# Eval("OrderID") %>' />
                     <asp:GridView ID="OrderListGridView" runat="server" AutoGenerateColumns="False" DataKeyNames="OrderListID,Dress_Name" DataSourceID="OrderListSQL" CssClass="mGrid">
                        <Columns>
                           <asp:BoundField DataField="Dress_Name" HeaderText="পোষাক"></asp:BoundField>
                           <asp:BoundField DataField="DressQuantity" HeaderText="মোট"></asp:BoundField>
                           <asp:TemplateField HeaderText="অসম্পূর্ণ">
                              <ItemTemplate>
                                 <asp:Label ID="Pending_WorkLabel" runat="server" Text='<%# Bind("Pending_Work") %>'></asp:Label>
                              </ItemTemplate>
                           </asp:TemplateField>
                        </Columns>
                     </asp:GridView>
                     <asp:SqlDataSource ID="OrderListSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT OrderList.OrderListID, OrderList.OrderList_SN, Dress.Dress_Name,OrderList.DressQuantity, OrderList.Pending_Work FROM OrderList INNER JOIN Dress ON OrderList.DressID = Dress.DressID WHERE (OrderList.OrderID = @OrderID) AND (OrderList.Pending_Work &lt;&gt; 0) ORDER BY OrderList.OrderList_SN">
                        <SelectParameters>
                           <asp:ControlParameter ControlID="OrderIDHiddenField" Name="OrderID" PropertyName="Value" Type="Int32" />
                        </SelectParameters>
                     </asp:SqlDataSource>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:BoundField DataField="OrderAmount" HeaderText="মোট টাকা" SortExpression="OrderAmount" />
               <asp:TemplateField HeaderText="SMS">
                  <ItemTemplate>
                     <asp:CheckBox ID="SMSCheckBox" runat="server" Text=" " />
                  </ItemTemplate>
               </asp:TemplateField>
            </Columns>
            <EmptyDataTemplate>
               Empty
            </EmptyDataTemplate>
            <PagerStyle CssClass="pgr " />
         </asp:GridView>
         <asp:SqlDataSource ID="CustomerOrderdDressSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
            SelectCommand="SELECT [Order].OrderID, [Order].WorkStatus,[Order].CustomerID, [Order].RegistrationID, [Order].InstitutionID, [Order].Cloth_For_ID, [Order].OrderDate, [Order].DeliveryDate, [Order].OrderAmount, [Order].PaidAmount, [Order].Discount, [Order].DueAmount, [Order].OrderSerialNumber, [Order].PaymentStatus, [Order].DeliveryStatus, Customer.CustomerNumber, Customer.CustomerName, Customer.Phone, Customer.Address, SMS.Masking, SMS.SMS_Balance, Institution.InstitutionName FROM [Order] INNER JOIN Customer ON [Order].CustomerID = Customer.CustomerID INNER JOIN SMS ON Customer.InstitutionID = SMS.InstitutionID INNER JOIN Institution ON [Order].InstitutionID = Institution.InstitutionID WHERE ([Order].InstitutionID = @InstitutionID) AND ([Order].DeliveryStatus IN( N'Pending',N'PartlyDelivered')) AND ([Order].WorkStatus in( N'incomplete',N'PartlyCompleted')) AND (Customer.Phone Like '%' + @Phone + '%')  AND  (CAST([OrderSerialNumber] AS NVARCHAR(50)) IN(Select id from dbo.In_Function_Parameter(@OrderSerialNumber)) OR @OrderSerialNumber = '0')
 AND ([Order].DeliveryDate BETWEEN ISNULL(@Fdate,'1-1-1760') AND ISNULL(@TDate, '1-1-3760')) AND (ISNULL(Customer.CustomerName,'') Like '%' + @CustomerName + '%') AND (ISNULL(Customer.Address,'') Like '%' + @Address+ '%') order by (Case When [Order].DeliveryDate = cast(getdate() as date) Then 0 Else 1 End),ISNULL([Order].DeliveryDate,'1-1-3000')"
            UpdateCommand="UPDATE [Order] SET DeliveryDate = @DeliveryDate WHERE (OrderID = @OrderID)" CancelSelectOnNullParameter="False">
            <SelectParameters>
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
               <asp:ControlParameter ControlID="MobileNoTextBox" DefaultValue="%" Name="Phone" PropertyName="Text" />
               <asp:ControlParameter ControlID="OrderNoTextBox" DefaultValue="0" Name="OrderSerialNumber" PropertyName="Text" Type="String" />
               <asp:ControlParameter ControlID="FromDateTextBox" Name="Fdate" PropertyName="Text" />
               <asp:ControlParameter ControlID="ToDateTextBox" DefaultValue="" Name="TDate" PropertyName="Text" />
               <asp:ControlParameter ControlID="SearchNameTextBox" DefaultValue="%" Name="CustomerName" PropertyName="Text" />
               <asp:ControlParameter ControlID="AddressTextBox" DefaultValue="%" Name="Address" PropertyName="Text" />
            </SelectParameters>
            <UpdateParameters>
               <asp:ControlParameter ControlID="ChangedD_DateTextBox" Name="DeliveryDate" PropertyName="Text" />
               <asp:Parameter Name="OrderID" />
            </UpdateParameters>
         </asp:SqlDataSource>

         <asp:SqlDataSource ID="SMS_OtherInfoSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="INSERT INTO [SMS_OtherInfo] ([SMS_Send_ID], [InstitutionID], [CustomerID]) VALUES (@SMS_Send_ID, @InstitutionID, @CustomerID)" SelectCommand="SELECT * FROM [SMS_OtherInfo]">
            <InsertParameters>
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
               <asp:Parameter DbType="Guid" Name="SMS_Send_ID" />
               <asp:Parameter Name="CustomerID" Type="Int32" />
            </InsertParameters>
         </asp:SqlDataSource>

         <asp:CustomValidator ID="CV" runat="server" ClientValidationFunction="Validate" ErrorMessage="আপনি কোন অর্ডার সিলেক্ট করেন নি" ForeColor="Red" ValidationGroup="A"></asp:CustomValidator>
         <table class="Hide">
            <tr>
               <td colspan="2">পরিবর্তিত তারিখ
                  <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="ChangedD_DateTextBox" CssClass="EroorSummer" ErrorMessage="Required" ValidationGroup="A"></asp:RequiredFieldValidator>
               </td>
            </tr>
            <tr>
               <td>
                  <asp:TextBox ID="ChangedD_DateTextBox" runat="server" CssClass="Datetime" placeholder="তারিখ" Width="130px" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false"></asp:TextBox>
               </td>
               <td>
                  <asp:Button ID="ChangeDateButton" runat="server" CssClass="ContinueButton" OnClick="ChangeDateButton_Click" Text="তারিখ পরিবর্তন" ValidationGroup="A" />
                  <asp:Label ID="ErrorLabel" runat="server" CssClass="EroorSummer"></asp:Label>
               </td>
            </tr>
         </table>
      </ContentTemplate>
   </asp:UpdatePanel>

   <asp:UpdateProgress ID="UpdateProgress" runat="server">
      <ProgressTemplate>
         <div id="progress_BG"></div>
         <div id="progress">
            <img src="../../CSS/Image/gif-load.gif" alt="Loading..." />
            <br />
            <b>Loading...</b>
         </div>
      </ProgressTemplate>
   </asp:UpdateProgress>

   <script src="../../JS/DatePicker/jquery.datepick.js"></script>
   <script type="text/javascript">
      $(document).ready(function () {
         $(".Datetime").datepick();
         if ($("input:radio:checked").val() == "Order No. And Mobile No.") {
            $('.Search_Date').hide();
         }
         else { $('.Search_Number').hide(); }

         $('input[type="radio"]').change(function () {
            if (this.value == "Order No. And Mobile No.") {
               $('.Search_Number').stop(true, true).show(500);
               $('.Search_Date').stop(true, true).hide(500);
               $("[id*=FromDateTextBox]").val(null);
               $("[id*=ToDateTextBox]").val(null);
            }

            if (this.value == "Delivery Date") {
               $('.Search_Number').stop(true, true).hide(500);
               $('.Search_Date').stop(true, true).show(500);
               $('.textbox').val(null);
            }
         });

         //GridView is empty
         if (!$('[id*=CustomerOrderdDressGridView] tr').length) {
            $(".Hide").hide();
         }
      });

      /**Submit form on Enter key**/
      $(".textbox").keyup(function (a) { 13 == a.keyCode && $("[id*=FindButton]").click() });

      /**Empty Text**/
      $("[id*=OrderNoTextBox]").focus(function () { $("[id*=MobileNoTextBox]").val(""); $("[id*=SearchNameTextBox]").val(""); $("[id*=AddressTextBox]").val("") }); $("[id*=MobileNoTextBox]").focus(function () { $("[id*=OrderNoTextBox]").val(""); $("[id*=SearchNameTextBox]").val(""); $("[id*=AddressTextBox]").val("") }); $("[id*=SearchNameTextBox]").focus(function () { $("[id*=OrderNoTextBox]").val(""); $("[id*=MobileNoTextBox]").val("") }); $("[id*=AddressTextBox]").focus(function () { $("[id*=OrderNoTextBox]").val(""); $("[id*=MobileNoTextBox]").val("") });

      function isNumberKey(a) { a = a.which ? a.which : event.keyCode; return 46 != a && 31 < a && (48 > a || 57 < a) ? !1 : !0 };

      /*--Select All Checkbox-----*/
      $("[id*=AllCheckBox]").live("click", function () {
         var a = $(this), b = $(this).closest("table"); $("input[type=checkbox]", b).each(function ()
         { a.is(":checked") ? ($(this).attr("checked", "checked"), $("td", $(this).closest("tr")).addClass("selected")) : ($(this).removeAttr("checked"), $("td", $(this).closest("tr")).removeClass("selected")) })
      });

      $("[id*=CompleteCheckBox]").live("click", function () {
         var a = $(this).closest("table"), b = $("[id*=chkHeader]", a);
         $(this).is(":checked") ? ($("td", $(this).closest("tr")).addClass("selected"), $("[id*=chkRow]", a).length == $("[id*=chkRow]:checked", a).length && b.attr("checked", "checked")) : ($("td", $(this).closest("tr")).removeClass("selected"), b.removeAttr("checked"))

         $(this).is(":checked") ? $(this).closest("tr").find("input").prop("checked", !0) : $(this).closest("tr").find("input").prop("checked", !1);
      });

      /*--select at least one Checkbox Students GridView-----*/
      function Validate(d, c) { for (var b = document.getElementById("<%=CustomerOrderdDressGridView.ClientID %>").getElementsByTagName("input"), a = 0; a < b.length; a++) if ("checkbox" == b[a].type && b[a].checked) { c.IsValid = !0; return } c.IsValid = !1 };


      /**For Updatepanel**/
      Sys.WebForms.PageRequestManager.getInstance().add_endRequest(function (a, b) {
         $(".Datetime").datepick();

         if ($("input:radio:checked").val() == "Order No. And Mobile No.") {
            $('.Search_Date').hide();
         }
         else { $('.Search_Number').hide(); }

         $('input[type="radio"]').change(function () {
            if (this.value == "Order No. And Mobile No.") {
               $('.Search_Number').stop(true, true).show(500);
               $('.Search_Date').stop(true, true).hide(500);
               $("[id*=FromDateTextBox]").val(null);
               $("[id*=ToDateTextBox]").val(null);
            }

            if (this.value == "Delivery Date") {
               $('.Search_Number').stop(true, true).hide(500);
               $('.Search_Date').stop(true, true).show(500);
               $('.textbox').val(null);
            }
         });

         /**Empty Text**/
         $("[id*=OrderNoTextBox]").focus(function () { $("[id*=MobileNoTextBox]").val(""); $("[id*=SearchNameTextBox]").val(""); $("[id*=AddressTextBox]").val("") }); $("[id*=MobileNoTextBox]").focus(function () { $("[id*=OrderNoTextBox]").val(""); $("[id*=SearchNameTextBox]").val(""); $("[id*=AddressTextBox]").val("") }); $("[id*=SearchNameTextBox]").focus(function () { $("[id*=OrderNoTextBox]").val(""); $("[id*=MobileNoTextBox]").val("") }); $("[id*=AddressTextBox]").focus(function () { $("[id*=OrderNoTextBox]").val(""); $("[id*=MobileNoTextBox]").val("") });

         //GridView is empty
         if (!$('[id*=CustomerOrderdDressGridView] tr').length) {
            $(".Hide").hide();
         }
      })

   </script>
</asp:Content>
