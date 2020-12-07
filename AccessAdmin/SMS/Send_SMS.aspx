<%@ Page Title="এসএমএস পাঠান" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Send_SMS.aspx.cs" Inherits="TailorBD.AccessAdmin.SMS.Send_SMS" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <script src="../../JS/requiered/quicksearch.js"></script>
   <link href="Css/SMS.css" rel="stylesheet" />
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <asp:ScriptManager ID="ScriptManager1" runat="server"></asp:ScriptManager>
   <asp:UpdatePanel ID="UpdatePanel2" runat="server">

      <ContentTemplate>

      </ContentTemplate>
   </asp:UpdatePanel>
         <h3>
            <asp:FormView ID="SMSBalanceFormView" runat="server" DataKeyNames="SMSID" DataSourceID="SMSBalanceSQL">
               <ItemTemplate>
                  গ্রাহকদের এসএমএস পাঠান (অবশিষ্ট এসএমএস: 
                    <b>
                       <asp:Label ID="SMS_BalanceLabel" runat="server" Text='<%# Bind("SMS_Balance") %>' />)</b>
               </ItemTemplate>
            </asp:FormView>
         </h3>

         <asp:SqlDataSource ID="SMSBalanceSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM [SMS] WHERE ([InstitutionID] = @InstitutionID)">
            <SelectParameters>
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
            </SelectParameters>
         </asp:SqlDataSource>

         <asp:Label ID="TotalLabel" runat="server" CssClass="CountCustomer"></asp:Label>
         <br />

         <asp:RadioButtonList ID="SMSRadioButtonList" runat="server" RepeatDirection="Horizontal" RepeatLayout="Flow" CssClass="RadioB">
            <asp:ListItem Selected="True">নির্বাচিত গ্রাহকদের এসএমএস পাঠান</asp:ListItem>
            <asp:ListItem>সকল গ্রাহকদের এসএমএস পাঠান</asp:ListItem>
         </asp:RadioButtonList>
         <div class="SelectedCustomer">
            <table>
               <tr>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
               </tr>
               <tr>
                  <td>কাস্টমার নাম্বার</td>
                  <td>&nbsp;</td>
                  <td>মোবাইল নাম্বার</td>
                  <td>&nbsp;</td>
               </tr>
               <tr>
                  <td>
                     <asp:TextBox ID="CustomerNoTextBox" onkeypress="return isNumberKey(event)" placeholder="কাস্টমার নাম্বার" runat="server" CssClass="textbox"></asp:TextBox>
                  </td>
                  <td>অথবা</td>
                  <td>
                     <asp:TextBox ID="MobileNoTextBox" onkeypress="return isNumberKey(event)" runat="server" placeholder="মোবাইল নাম্বার" CssClass="textbox"></asp:TextBox>
                  </td>
                  <td>
                     <asp:Button ID="FindButton" runat="server" CssClass="SearchButton" ValidationGroup="F" />
                  </td>
               </tr>
               <tr>
                  <td colspan="4">
                     <asp:RegularExpressionValidator ID="RegularExpressionValidator2" runat="server" ControlToValidate="CustomerNoTextBox" CssClass="EroorSummer" ErrorMessage="শুধু ইংরেজী নাম্বার লেখা যাবে" ValidationExpression="^\d+$" ValidationGroup="F"></asp:RegularExpressionValidator>
                     &nbsp;<asp:RegularExpressionValidator ID="RegularExpressionValidator3" runat="server" ControlToValidate="MobileNoTextBox" CssClass="EroorSummer" ErrorMessage="শুধু ইংরেজী নাম্বার লেখা যাবে" ValidationExpression="^\d+$" ValidationGroup="F"></asp:RegularExpressionValidator>
                  </td>
               </tr>
            </table>

            <asp:GridView ID="CustomerListGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="CustomerID,Masking,SMS_Balance,Phone" DataSourceID="CustomerListSQL" AllowPaging="True" PageSize="30" AllowSorting="True">
               <Columns>

                  <asp:TemplateField ShowHeader="False">
                     <ItemTemplate>
                        <asp:CheckBox ID="SMSCheckBox" runat="server" Text=" " />
                     </ItemTemplate>
                     <ItemStyle Width="2%" />
                     <HeaderTemplate>
                        <asp:CheckBox ID="AllCheckBox" runat="server" Text=" " />
                     </HeaderTemplate>
                  </asp:TemplateField>
                  <asp:BoundField DataField="CustomerNumber" HeaderText="কাস্টমার নং" SortExpression="CustomerNumber" ReadOnly="True" />
                  <asp:BoundField DataField="CustomerName" HeaderText="নাম" SortExpression="CustomerName" />
                  <asp:BoundField DataField="Phone" HeaderText="মোবাইল" SortExpression="Phone" />
                  <asp:BoundField DataField="Address" HeaderText="ঠিকানা" SortExpression="Address" />
                  <asp:BoundField DataField="Date" HeaderText="নিবন্ধনের তারিখ" SortExpression="Date" DataFormatString="{0:d MMM yyyy}" />

               </Columns>
               <EmptyDataTemplate>
                  No Customer
               </EmptyDataTemplate>
               <PagerStyle CssClass="pgr" />
            </asp:GridView>
         </div>

         <table class="Hide">
            <tr>
               <td>&nbsp;</td>
            </tr>
            <tr>
               <td>
                  <b>বার্তা লিখুন</b>
                  <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="SMSTextTextBox" ErrorMessage="বার্তা লিখুন" ValidationGroup="1" CssClass="EroorStar"></asp:RequiredFieldValidator>
               </td>
            </tr>
            <tr>
               <td>
                  <asp:TextBox ID="SMSTextTextBox" runat="server" TextMode="MultiLine" CssClass="Multextbox" Width="300px"></asp:TextBox>
                  <div id="sms-counter" class="Counter_St">
                     Length: <span class="length"></span>/ <span class="per_message"></span>.  Count: <span class="messages"></span> SMS
                  </div>
               </td>
            </tr>
            <tr>
               <td>
                  <asp:Label ID="ErrorLabel" runat="server" CssClass="EroorSummer"></asp:Label>
               </td>
            </tr>
            <tr>
               <td>
                  <asp:Button ID="SendSMSButton" runat="server" CssClass="ContinueButton" OnClick="SendSMSButton_Click" Text="বার্তা পাঠান" ValidationGroup="1" />
               </td>
            </tr>
         </table>

         <asp:SqlDataSource ID="CustomerListSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
            SelectCommand="SELECT Customer.CustomerID, Customer.RegistrationID, Customer.InstitutionID, Customer.Cloth_For_ID, Customer.CustomerNumber, Customer.CustomerName, Customer.Phone, Customer.Address, Customer.Image, Customer.Date, SMS.Masking, SMS.SMS_Balance FROM Customer INNER JOIN SMS ON Customer.InstitutionID = SMS.InstitutionID WHERE (Customer.InstitutionID = @InstitutionID) AND (Phone Like '%' + @Phone + '%') AND ([CustomerNumber] = @CustomerNumber OR @CustomerNumber = 0) " OnSelected="CustomerListSQL_Selected">

            <SelectParameters>
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
               <asp:ControlParameter ControlID="MobileNoTextBox" DefaultValue="%" Name="Phone" PropertyName="Text" />
               <asp:ControlParameter ControlID="CustomerNoTextBox" DefaultValue="0" Name="CustomerNumber" PropertyName="Text" />
            </SelectParameters>
         </asp:SqlDataSource>
         <asp:SqlDataSource ID="SMS_OtherInfoSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="INSERT INTO [SMS_OtherInfo] ([SMS_Send_ID], [InstitutionID], [CustomerID]) VALUES (@SMS_Send_ID, @InstitutionID, @CustomerID)" SelectCommand="SELECT * FROM [SMS_OtherInfo]">
            <InsertParameters>
               <asp:Parameter Name="SMS_Send_ID" DbType="Guid" />
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
               <asp:Parameter Name="CustomerID" Type="Int32" />
            </InsertParameters>
         </asp:SqlDataSource>



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

   <script src="../../JS/SMSCount/sms_counter.min.js"></script>
   <script type="text/javascript">
      $("[id*=AllCheckBox]").live("click", function () {
         var chkHeader = $(this);
         var grid = $(this).closest("table");
         $("input[type=checkbox]", grid).each(function () {
            if (chkHeader.is(":checked")) {
               $(this).attr("checked", "checked");
               $("td", $(this).closest("tr")).addClass("selected");
            } else {
               $(this).removeAttr("checked");
               $("td", $(this).closest("tr")).removeClass("selected");
            }
         });
      });

      //for Color change
      $("[id*=SMSCheckBox]").live("click", function () {
         var grid = $(this).closest("table");
         var chkHeader = $("[id*=chkHeader]", grid);
         if (!$(this).is(":checked")) {
            $("td", $(this).closest("tr")).removeClass("selected");
            chkHeader.removeAttr("checked");
         } else {
            $("td", $(this).closest("tr")).addClass("selected");
            if ($("[id*=chkRow]", grid).length == $("[id*=chkRow]:checked", grid).length) {
               chkHeader.attr("checked", "checked");
            }
         }
      });

      //Empty Text
      $("[id*=CustomerNoTextBox]").focus(function () {
         $("[id*=MobileNoTextBox]").val('')
      });

      $("[id*=MobileNoTextBox]").focus(function () {
         $("[id*=CustomerNoTextBox]").val('')
      });

      $(document).ready(function () {
         if ($("input:radio:checked").val() == "সকল গ্রাহকদের এসএমএস পাঠান") {
            $('.SelectedCustomer').hide();
         }

         //GridView is empty
         if (!$('[id*=CustomerListGridView] tr').length) {
            $(".Hide").hide();
         }
      });

      $('input[type="radio"]').change(function () {
         if (this.value == "সকল গ্রাহকদের এসএমএস পাঠান") {
            $('.SelectedCustomer').stop(true, true).hide(500);
         }
         else {
            $('.SelectedCustomer').stop(true, true).show(500);
         }
      });

      $('[id*=SMSTextTextBox]').countSms('#sms-counter');

      Sys.WebForms.PageRequestManager.getInstance().add_endRequest(function (a, b) {
         $('[id*=SMSTextTextBox').countSms('#sms-counter');

         /**Empty Text**/
         $("[id*=CustomerNoTextBox]").focus(function () {
            $("[id*=MobileNoTextBox]").val('')
         });

         $("[id*=MobileNoTextBox]").focus(function () {
            $("[id*=CustomerNoTextBox]").val('')
         });

         if ($("input:radio:checked").val() == "সকল গ্রাহকদের এসএমএস পাঠান") {
            $('.SelectedCustomer').hide();
         }

         $('input[type="radio"]').change(function () {
            if (this.value == "সকল গ্রাহকদের এসএমএস পাঠান") {
               $('.SelectedCustomer').stop(true, true).hide(500);
            }
            else {
               $('.SelectedCustomer').stop(true, true).show(500);
            }
         });

         //GridView is empty
         if (!$('[id*=CustomerListGridView] tr').length) {
            $(".Hide").hide();
         }
      })

      function isNumberKey(a) { a = a.which ? a.which : event.keyCode; return 46 != a && 31 < a && (48 > a || 57 < a) ? !1 : !0 };

   </script>
</asp:Content>
