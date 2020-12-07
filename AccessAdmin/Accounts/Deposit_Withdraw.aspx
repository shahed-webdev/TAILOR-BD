<%@ Page Title="Account" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Deposit_Withdraw.aspx.cs" Inherits="TailorBD.AccessAdmin.Accounts.Deposit_Withdraw" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <link href="../../JS/jq_Profile/css/Profile_jquery-ui-1.8.23.custom.css" rel="stylesheet" />
   <link href="../../JS/DatePicker/jquery.datepick.css" rel="stylesheet" />
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <asp:ScriptManager ID="ScriptManager1" runat="server"></asp:ScriptManager>
   <asp:UpdatePanel ID="UpdatePanel3" runat="server">
      <ContentTemplate>
         <asp:FormView ID="ABFormView" runat="server" DataSourceID="ABSQL" Width="100%">
            <ItemTemplate>
               <h3>
                  <asp:Label ID="AccountNameLabel" runat="server" Text='<%# Bind("AccountName") %>' />
                  (<asp:Label ID="AccountBalanceLabel" runat="server" Text='<%# Bind("AccountBalance") %>' />
                  Tk)</h3>
            </ItemTemplate>
         </asp:FormView>
         <asp:SqlDataSource ID="ABSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT [AccountName], [AccountBalance] FROM [Account] WHERE (([InstitutionID] = @InstitutionID) AND ([AccountID] = @AccountID))">
            <SelectParameters>
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
               <asp:QueryStringParameter Name="AccountID" QueryStringField="AccountID" Type="Int32" />
            </SelectParameters>
         </asp:SqlDataSource>
         <a href="Add_Account.aspx"><< Back To Account</a>
      </ContentTemplate>
   </asp:UpdatePanel>
   <div id="main">
      <ul>
         <li><a href="#Deposit">Deposit</a></li>
         <li><a href="#Withdraw">Withdraw</a></li>
      </ul>

      <div id="Deposit">
         <asp:UpdatePanel ID="UpdatePanel1" runat="server">
            <ContentTemplate>
               <table>
                  <tr>
                     <td>Deposit Amount</td>
                  </tr>
                  <tr>
                     <td>
                        <asp:TextBox ID="AccountIN_AmountTextBox" runat="server" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" CssClass="textbox"></asp:TextBox>
                        <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="AccountIN_AmountTextBox" CssClass="EroorSummer" ErrorMessage="Required" ValidationGroup="D"></asp:RequiredFieldValidator>
                     </td>
                  </tr>
                  <tr>
                     <td>Details</td>
                  </tr>
                  <tr>
                     <td>
                        <asp:TextBox ID="IN_DetailsTextBox" runat="server" CssClass="textbox"></asp:TextBox>
                     </td>
                  </tr>
                  <tr>
                     <td>
                        <asp:SqlDataSource ID="DepositSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                           InsertCommand="INSERT INTO [AccountIN_Record] ([AccountID], [InstitutionID], [RegistrationID], [AccountIN_Amount], [IN_Details]) VALUES (@AccountID, @InstitutionID, @RegistrationID, @AccountIN_Amount, @IN_Details)"
                           SelectCommand="SELECT * FROM AccountIN_Record WHERE (InstitutionID = @InstitutionID) AND (AccountID = @AccountID)">

                           <InsertParameters>
                              <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                              <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                              <asp:QueryStringParameter Name="AccountID" QueryStringField="AccountID" Type="Int32" />
                              <asp:ControlParameter ControlID="AccountIN_AmountTextBox" Name="AccountIN_Amount" PropertyName="Text" Type="Double" />
                              <asp:ControlParameter ControlID="IN_DetailsTextBox" Name="IN_Details" PropertyName="Text" Type="String" />
                           </InsertParameters>
                           <SelectParameters>
                              <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                              <asp:QueryStringParameter Name="AccountID" QueryStringField="AccountID" />
                           </SelectParameters>
                        </asp:SqlDataSource>
                     </td>
                  </tr>
                  <tr>
                     <td>
                        <asp:Button ID="DepositButton" runat="server" Text="Deposit" CssClass="ContinueButton" OnClick="DepositButton_Click" ValidationGroup="D" />
                     </td>
                  </tr>
                  <tr>
                     <td>
                        <asp:Label ID="DELabel" runat="server" CssClass="EroorSummer"></asp:Label>
                     </td>
                  </tr>
               </table>
               <asp:GridView ID="DepositGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="AccountIN_ID" DataSourceID="DepositSQL">
                  <Columns>
                     <asp:BoundField DataField="AccountIN_Amount" HeaderText="Deposit Amount" SortExpression="AccountIN_Amount" />
                     <asp:BoundField DataField="AccountIN_Date" HeaderText="Deposit Date" SortExpression="AccountIN_Date" DataFormatString="{0:d MMM yyyy}" />
                     <asp:BoundField DataField="IN_Details" HeaderText="Details" SortExpression="IN_Details" />
                  </Columns>
               </asp:GridView>
            </ContentTemplate>
         </asp:UpdatePanel>
      </div>
      <div id="Withdraw">
         <asp:UpdatePanel ID="UpdatePanel2" runat="server">
            <ContentTemplate>
               <table>
                  <tr>
                     <td>Withdraw Amount</td>
                  </tr>
                  <tr>
                     <td>
                        <asp:TextBox ID="AccountOUT_AmountTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" CssClass="textbox"></asp:TextBox>
                        <asp:RequiredFieldValidator ID="RequiredFieldValidator3" runat="server" ControlToValidate="AccountOUT_AmountTextBox" CssClass="EroorSummer" ErrorMessage="Required" ValidationGroup="W"></asp:RequiredFieldValidator>
                     </td>
                  </tr>
                  <tr>
                     <td>Details</td>
                  </tr>
                  <tr>
                     <td>
                        <asp:TextBox ID="Out_DetailsTextBox" runat="server" CssClass="textbox"></asp:TextBox>
                     </td>
                  </tr>
                  <tr>
                     <td>
                        <asp:Label ID="WELabel" runat="server" CssClass="EroorSummer"></asp:Label>
                     </td>
                  </tr>
                  <tr>
                     <td>
                        <asp:SqlDataSource ID="WithdrawSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                           InsertCommand="INSERT INTO AccountOUT_Record(AccountID, InstitutionID, RegistrationID, AccountOUT_Amount, Out_Details) VALUES (@AccountID, @InstitutionID, @RegistrationID, @AccountOUT_Amount, @Out_Details)"
                           SelectCommand="SELECT * FROM AccountOUT_Record WHERE (InstitutionID = @InstitutionID) AND (AccountID = @AccountID)">
                           <InsertParameters>
                              <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                              <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                              <asp:QueryStringParameter Name="AccountID" QueryStringField="AccountID" Type="Int32" />
                              <asp:ControlParameter ControlID="AccountOUT_AmountTextBox" Name="AccountOUT_Amount" PropertyName="Text" Type="Double" />
                              <asp:ControlParameter ControlID="Out_DetailsTextBox" Name="Out_Details" PropertyName="Text" Type="String" />
                           </InsertParameters>
                           <SelectParameters>
                              <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                              <asp:QueryStringParameter Name="AccountID" QueryStringField="AccountID" />
                           </SelectParameters>
                        </asp:SqlDataSource>
                        <asp:Button ID="WithdrawButton" runat="server" Text="Withdraw" CssClass="ContinueButton" OnClick="WithdrawButton_Click" ValidationGroup="W" />
                     </td>
                  </tr>
                  <tr>
                     <td>&nbsp;</td>
                  </tr>
               </table>
               <asp:GridView ID="WithdrawGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="AccountOUT_ID" DataSourceID="WithdrawSQL">
                  <Columns>
                     <asp:BoundField DataField="AccountOUT_Amount" HeaderText="Withdraw Amount" SortExpression="AccountOUT_Amount" />
                     <asp:BoundField DataField="AccountOUT_Date" HeaderText="Withdraw Date" SortExpression="AccountOUT_Date" DataFormatString="{0:d MMM yyyy}" />
                     <asp:BoundField DataField="Out_Details" HeaderText="Details" SortExpression="Out_Details" />
                  </Columns>
               </asp:GridView>
            </ContentTemplate>
         </asp:UpdatePanel>
      </div>
   </div>



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
   <script src="../../JS/jq_Profile/jquery-ui-1.8.23.custom.min.js"></script>
   <script type="text/javascript">
      $(function () {
         $('#main').tabs();
      });
      function isNumberKey(a) { a = a.which ? a.which : event.keyCode; return 46 != a && 31 < a && (48 > a || 57 < a) ? !1 : !0 };
   </script>
</asp:Content>
