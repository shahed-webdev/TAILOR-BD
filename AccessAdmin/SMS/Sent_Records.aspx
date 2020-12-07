<%@ Page Title="এসএমএস রেকর্ড" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Sent_Records.aspx.cs" Inherits="TailorBD.AccessAdmin.SMS.Sent_Records" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <link href="Css/SMS.css" rel="stylesheet" />
   <link href="../../JS/DatePicker/jquery.datepick.css" rel="stylesheet" />
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">

   <asp:SqlDataSource ID="SMSBalanceSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM [SMS] WHERE ([InstitutionID] = @InstitutionID)">
      <SelectParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
      </SelectParameters>
   </asp:SqlDataSource>
   <asp:FormView ID="SMSBalanceFormView" runat="server" DataKeyNames="SMSID" DataSourceID="SMSBalanceSQL">
      <ItemTemplate>
         <h3>প্রেরিত এসএমএস রেকর্ড (অবশিষ্ট এসএমএস:
            <asp:Label ID="SMS_BalanceLabel" runat="server" Text='<%# Bind("SMS_Balance") %>' />)</h3>
      </ItemTemplate>
   </asp:FormView>
   <table class="NoPrint">
      <tr>
         <td>From Date</td>
         <td>To Date</td>
         <td>Mobile No. or Purpose Of SMS</td>
         <td>&nbsp;</td>
      </tr>
      <tr>
         <td>
            <asp:TextBox ID="FromDateTextBox" runat="server" CssClass="Datetime" Width="120px" placeholder="From Date" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false"></asp:TextBox>
         </td>
         <td>
            <asp:TextBox ID="ToDateTextBox" runat="server" CssClass="Datetime" Width="120px" placeholder="To Date" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false"></asp:TextBox>
         </td>
         <td>
            <asp:TextBox ID="Phone_Purpose_TextBox" placeholder="Mobile No. or Purpose Of SMS" runat="server" CssClass="textbox" Width="200px"></asp:TextBox>
         </td>
         <td>
            <asp:Button ID="FindButton" runat="server" CssClass="ContinueButton" Text="Find" ValidationGroup="1" OnClick="FindButton_Click" />
         </td>
      </tr>
   </table>
   <div class="SCount">
      <label class="Date"></label>
      <asp:Label ID="TotalSMSLabel" runat="server"></asp:Label>
   </div>

   <asp:GridView ID="SMSRecordsGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="SMS_Send_ID" DataSourceID="SendRecordSQL" AllowPaging="True" PageSize="30">
      <Columns>
         <asp:BoundField DataField="PhoneNumber" HeaderText="Phone Number" SortExpression="PhoneNumber" />
         <asp:BoundField DataField="TextSMS" HeaderText="Text SMS" SortExpression="TextSMS" />
         <asp:BoundField DataField="SMSCount" HeaderText="SMS Count" SortExpression="SMSCount" />
         <asp:BoundField DataField="PurposeOfSMS" HeaderText="Purpose" SortExpression="PurposeOfSMS" />
         <asp:BoundField DataField="Status" HeaderText="Status" SortExpression="Status" />
         <asp:BoundField DataField="Date" HeaderText="Date" SortExpression="Date" DataFormatString="{0:d MMM yyyy (h:mm tt)}" />

      </Columns>
      <EmptyDataTemplate>
         <span id="result_box" class="short_text" lang="bn"><span class="hps">কোন রেকর্ড নেই</span></span>
      </EmptyDataTemplate>
      <PagerStyle CssClass="pgr" />
   </asp:GridView>
   <asp:SqlDataSource ID="SendRecordSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT SMS_Send_Record.SMS_Send_ID, SMS_Send_Record.PhoneNumber, SMS_Send_Record.TextSMS, SMS_Send_Record.TextCount, SMS_Send_Record.SMSCount, SMS_Send_Record.PurposeOfSMS, SMS_Send_Record.Status, SMS_Send_Record.Date, SMS_Send_Record.SMS_Response, SMS_OtherInfo.InstitutionID FROM SMS_Send_Record INNER JOIN SMS_OtherInfo ON SMS_Send_Record.SMS_Send_ID = SMS_OtherInfo.SMS_Send_ID WHERE (SMS_OtherInfo.InstitutionID = @InstitutionID) AND  (CAST(SMS_Send_Record.Date AS DATE) BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000'))ORDER BY SMS_Send_Record.Date DESC"
      CancelSelectOnNullParameter="False" FilterExpression="PhoneNumber LIKE '{0}%'or PurposeOfSMS LIKE '{0}%'">
      <FilterParameters>
         <asp:ControlParameter ControlID="Phone_Purpose_TextBox" Name="Find" PropertyName="Text" />
      </FilterParameters>
      <SelectParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
         <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
         <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
      </SelectParameters>
   </asp:SqlDataSource>

   <script src="../../JS/DatePicker/jquery.datepick.js"></script>
   <script>
      $(function () {
         $(".Datetime").datepick();

         //get date in label
         var from = $("[id*=FromDateTextBox]").val();
         var To = $("[id*=ToDateTextBox]").val();

         var tt;
         var Brases1 = "";
         var Brases2 = "";
         var A = "";
         var B = "";
         var TODate = "";

         if (To == "" || from == "" || To == "" && from == "") {
            tt = "";
            A = "";
            B = "";
         }
         else {
            tt = " To ";
            Brases1 = "(";
            Brases2 = ")";
         }

         if (To == "" && from == "") { Brases1 = ""; }

         if (To == from) {
            TODate = "";
            tt = "";
            var Brases1 = "";
            var Brases2 = "";
         }
         else { TODate = To; }

         if (from == "" && To != "") {
            B = " Before ";
         }

         if (To == "" && from != "") {
            A = " After ";
         }

         if (from != "" && To != "") {
            A = "";
            B = "";
         }

         $(".Date").text(Brases1 + B + A + from + tt + TODate + Brases2);
      });

   </script>
</asp:Content>
