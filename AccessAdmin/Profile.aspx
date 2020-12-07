<%@ Page Title="" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Profile.aspx.cs" Inherits="TailorBD.AccessAdmin.Profile" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <link href="CSS/Profile.css" rel="stylesheet" />
   <link href="../../JS/jq_Profile/css/Profile_jquery-ui-1.8.23.custom.css" rel="stylesheet" />
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <asp:ScriptManager ID="ScriptManager1" runat="server"></asp:ScriptManager>
   <h3>পরিচালকের প্রোফাইল </h3>

   <asp:FormView ID="AdminFormView" runat="server" DataKeyNames="RegistrationID" DataSourceID="AdminInfoSQL" OnItemUpdated="AdminFormView_ItemUpdated" Width="100%">
      <ItemTemplate>
         <div class="Personal_Info">
            <div class="Profile_Image">
               <img alt="No Image" src="../Handler/AuthorityHandler.ashx?Img=<%#Eval("RegistrationID") %>" class="P_Image" /><br />
               <div class="Edit_Bnt">
                  <asp:LinkButton ID="EditButton" runat="server" CausesValidation="False" CommandName="Edit" Text="পরিবর্তন করতে ক্লিক করুন" />
               </div>
            </div>
            <div class="Info">
               <ul>
                  <li>
                     <strong>
                        <asp:Label ID="NameLabel" runat="server" Text='<%# Bind("Name") %>' /></strong>
                  </li>
                  <li>
                     <b>
                        <asp:Label ID="DesignationLabel" runat="server" Text='<%# Bind("Designation") %>' /></b>
                  </li>
                  <li>পিতা: 
                            <asp:Label ID="FatherNameLabel" runat="server" Text='<%# Bind("FatherName") %>' /></li>


                  <li>মোবাইল:
                            <asp:Label ID="PhoneLabel1" runat="server" Text='<%# Bind("Phone") %>' /></li>
                  <li>ইমেইল: 
                            <asp:Label ID="EmailLabel" runat="server" Text='<%# Bind("Email") %>' /></li>
                  <li>ঠিকানা: 
                            <asp:Label ID="AddressLabel" runat="server" Text='<%# Bind("Address") %>' /></li>
               </ul>
            </div>
         </div>
      </ItemTemplate>

      <EditItemTemplate>
         <table>
            <tr>
               <td>নাম:</td>
               <td>
                  <asp:TextBox ID="NameTextBox" runat="server" CssClass="textbox" Text='<%# Bind("Name") %>' />
               </td>
            </tr>
            <tr>
               <td>পিতা:</td>
               <td>
                  <asp:TextBox ID="FatherNameTextBox" runat="server" CssClass="textbox" Text='<%# Bind("FatherName") %>' />
               </td>
            </tr>
            <tr>
               <td>জেন্ডার:</td>
               <td>
                  <asp:TextBox ID="GenderTextBox" runat="server" CssClass="textbox" Text='<%# Bind("Gender") %>' />
               </td>
            </tr>
            <tr>
               <td>পজিশন:</td>
               <td>
                  <asp:TextBox ID="DesignationTextBox" runat="server" CssClass="textbox" Text='<%# Bind("Designation") %>' />
               </td>
            </tr>
            <tr>
               <td>সিটি:</td>
               <td>
                  <asp:TextBox ID="CityTextBox" runat="server" CssClass="textbox" Text='<%# Bind("City") %>' />
               </td>
            </tr>
            <tr>
               <td>পোস্ট কোড:</td>
               <td>
                  <asp:TextBox ID="PostalCodeTextBox" runat="server" CssClass="textbox" Text='<%# Bind("PostalCode") %>' />
               </td>
            </tr>
            <tr>
               <td>মোবাইল:</td>
               <td>
                  <asp:TextBox ID="PhoneTextBox" runat="server" CssClass="textbox" Text='<%# Bind("Phone") %>' />
               </td>
            </tr>
            <tr>
               <td>ইমেইল:</td>
               <td>
                  <asp:TextBox ID="EmailTextBox" runat="server" CssClass="textbox" Text='<%# Bind("Email") %>' />
               </td>
            </tr>
            <tr>
               <td>ঠিকানা:</td>
               <td>
                  <asp:TextBox ID="AddressTextBox" runat="server" CssClass="textbox" Text='<%# Bind("Address") %>' TextMode="MultiLine" />
               </td>
            </tr>
            <tr>
               <td>আপনার ছবি:</td>
               <td>
                  <img alt="No Image" src="../Handler/AuthorityHandler.ashx?Img=<%#Eval("RegistrationID") %>" class="Updt_Image" /><br />
                  <asp:FileUpload ID="ImageFileUpload" runat="server" />
               </td>
            </tr>
            <tr>
               <td>&nbsp;</td>
               <td>&nbsp;</td>
            </tr>
            <tr>
               <td>&nbsp;</td>
               <td>
                  <asp:LinkButton ID="UpdateButton" runat="server" CausesValidation="True" CommandName="Update" Text="Update" />
                  &nbsp;<asp:LinkButton ID="UpdateCancelButton" runat="server" CausesValidation="False" CommandName="Cancel" Text="Cancel" />
               </td>
            </tr>
         </table>
      </EditItemTemplate>
   </asp:FormView>
   <asp:SqlDataSource ID="AdminInfoSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
      SelectCommand="SELECT * FROM Registration WHERE (RegistrationID = @RegistrationID)"
      UpdateCommand="UPDATE Registration SET Name = @Name, FatherName = @FatherName, Gender = @Gender, Designation = @Designation, Address = @Address, City = @City, PostalCode = @PostalCode, Phone = @Phone, Email = @Email WHERE (RegistrationID = @RegistrationID)">
      <SelectParameters>
         <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
      </SelectParameters>
      <UpdateParameters>
         <asp:Parameter Name="Name" Type="String" />
         <asp:Parameter Name="FatherName" Type="String" />
         <asp:Parameter Name="Gender" Type="String" />
         <asp:Parameter Name="Designation" Type="String" />
         <asp:Parameter Name="Address" Type="String" />
         <asp:Parameter Name="City" Type="String" />
         <asp:Parameter Name="PostalCode" Type="String" />
         <asp:Parameter Name="Phone" Type="String" />
         <asp:Parameter Name="Email" Type="String" />
         <asp:Parameter Name="RegistrationID" Type="Int32" />
      </UpdateParameters>
   </asp:SqlDataSource>

   <div class="BasicInfo">
      <div id="main">
         <ul>
            <li><a href="#Invoice">ইনভয়েস</a></li>
            <li><a href="#PChange">পাসওয়ার্ড পরিবর্তন</a></li>
            <li><a href="#SMSBalance">এসএমএস ব্যালেন্স</a></li>
         </ul>

         <div id="Invoice">
            <h3>ইনভয়েস লিস্ট</h3>
            <asp:GridView ID="InvoiceGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="InvoiceID" DataSourceID="InvoiceSQL" ShowFooter="True">
               <Columns>
                  <asp:TemplateField>
                     <ItemTemplate>
                        <asp:LinkButton ID="SlLinkButton" runat="server" CausesValidation="False" CommandName="Select" CssClass="Select" />
                     </ItemTemplate>
                  </asp:TemplateField>
                  <asp:BoundField DataField="IssuDate" HeaderText="ইস্যু তারিখ" SortExpression="IssuDate" DataFormatString="{0:d MMM yyyy}" />
                  <asp:BoundField DataField="EndDate" HeaderText="শেষ হওয়ার তারিখ" SortExpression="EndDate" DataFormatString="{0:d MMM yyyy}" />
                  <asp:BoundField DataField="TotalAmount" HeaderText="মোট টাকা" SortExpression="TotalAmount" />
                  <asp:BoundField DataField="Discount" HeaderText="ডিসকাউন্ট" SortExpression="Discount" />
                  <asp:BoundField DataField="PaidAmount" HeaderText="জমা" SortExpression="PaidAmount" />
                  <asp:TemplateField HeaderText="বাকি" SortExpression="Due">
                     <ItemTemplate>
                        <asp:Label ID="DueLabel" runat="server" Text='<%# Bind("Due") %>'></asp:Label>
                     </ItemTemplate>
                     <FooterTemplate>
                        <label id="Tota_Due"></label>
                     </FooterTemplate>
                  </asp:TemplateField>
                  <asp:BoundField DataField="CreateDate" HeaderText="নিবন্ধন তারিখ" SortExpression="CreateDate" DataFormatString="{0:d MMM yyyy}" />
                  <asp:TemplateField HeaderText="বিস্তারিত" SortExpression="Invoice_For">
                     <ItemTemplate>
                        <asp:HiddenField ID="InvoiceIDHiddenField" runat="server" Value='<%# Bind("InvoiceID") %>' />
                        <asp:HiddenField ID="InstitutionIDHiddenField" runat="server" Value='<%# Bind("InstitutionID") %>' />
                        <asp:DataList ID="DataList1" runat="server" DataKeyField="InvoiceLineID" DataSourceID="InvoiceLineSQL">
                           <ItemTemplate>
                              <asp:Label ID="AmountLabel" runat="server" Text='<%# Eval("Amount") %>' />
                              Tk. 
                                        <asp:Label ID="DetailsLabel" runat="server" Text='<%# Eval("Details") %>' />
                           </ItemTemplate>
                        </asp:DataList>
                        <asp:SqlDataSource ID="InvoiceLineSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                           SelectCommand="SELECT * FROM [Invoice_Line] WHERE ([InvoiceID] = @InvoiceID)">
                           <SelectParameters>
                              <asp:ControlParameter ControlID="InvoiceIDHiddenField" Name="InvoiceID" PropertyName="Value" Type="Int32" />
                           </SelectParameters>
                        </asp:SqlDataSource>
                     </ItemTemplate>
                  </asp:TemplateField>
                  <asp:BoundField DataField="PaymentStatus" HeaderText="লেনদেনের অবস্থা" SortExpression="PaymentStatus" />
                  <asp:HyperLinkField DataNavigateUrlFields="InvoiceID"
                     DataNavigateUrlFormatString="Invoice/Print_Invoice.aspx?InvoiceID={0}" ControlStyle-CssClass="Cmd_Print">
                     <ControlStyle CssClass="Cmd_Print" />
                  </asp:HyperLinkField>
               </Columns>
               <EmptyDataTemplate>
                  No Due Invoice
               </EmptyDataTemplate>
               <SelectedRowStyle BackColor="#99CC00" />
            </asp:GridView>
            <asp:SqlDataSource ID="InvoiceSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM [Invoice] WHERE ([InstitutionID] = @InstitutionID) AND (PaymentStatus = 'Due')">
               <SelectParameters>
                  <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
               </SelectParameters>
            </asp:SqlDataSource>
            <%if (PaidRecordGridView.Rows.Count > 0)
              { %>
            <p>টাকা পরিশোধ রেকর্ড</p>
            <%} %>
            <asp:GridView ID="PaidRecordGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="InvoicePaymentRecordID" DataSourceID="PaidRecordSQL">
               <Columns>
                  <asp:BoundField DataField="Amount" HeaderText="মোট টাকা" SortExpression="Amount" />
                  <asp:BoundField DataField="PaidDate" DataFormatString="{0: d MMM yyyy}" HeaderText="জমা তারিখ" SortExpression="PaidDate" />
               </Columns>
            </asp:GridView>
            <asp:SqlDataSource ID="PaidRecordSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT InvoicePaymentRecordID, InvoiceID, RegistrationID, InstitutionID, Amount, PaidDate FROM Invoice_Payment_Record WHERE (InvoiceID = @InvoiceID) AND (InstitutionID = @InstitutionID)">
               <SelectParameters>
                  <asp:ControlParameter ControlID="InvoiceGridView" Name="InvoiceID" PropertyName="SelectedValue" Type="Int32" />
                  <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
               </SelectParameters>
            </asp:SqlDataSource>
         </div>

         <div id="PChange">
            <asp:UpdatePanel ID="UpdatePanel1" runat="server">
               <ContentTemplate>
                  <asp:ChangePassword ID="ChangePassword1" runat="server" ChangePasswordFailureText="Password incorrect or New Password invalid." OnChangedPassword="ChangePassword1_ChangedPassword">
                     <ChangePasswordTemplate>
                        <table style="border-collapse: collapse;">
                           <tr>
                              <td>
                                 <table>
                                    <tr>
                                       <td>
                                          <asp:Label ID="CurrentPasswordLabel" runat="server" AssociatedControlID="CurrentPassword">পুরাতন পাসওয়ার্ড:</asp:Label>
                                       </td>
                                    </tr>
                                    <tr>
                                       <td>
                                          <asp:TextBox ID="CurrentPassword" runat="server" CssClass="textbox" TextMode="Password" Width="150px"></asp:TextBox>
                                          <asp:RequiredFieldValidator ID="CurrentPasswordRequired" runat="server" ControlToValidate="CurrentPassword" CssClass="EroorStar" ErrorMessage="Password is required." ToolTip="Password is required." ValidationGroup="ChangePassword1">*</asp:RequiredFieldValidator>
                                       </td>
                                    </tr>
                                    <tr>
                                       <td>
                                          <asp:Label ID="NewPasswordLabel" runat="server" AssociatedControlID="NewPassword">নতুন পাসওয়ার্ড:</asp:Label>
                                       </td>
                                    </tr>
                                    <tr>
                                       <td>
                                          <asp:TextBox ID="NewPassword" runat="server" CssClass="textbox" TextMode="Password" Width="150px"></asp:TextBox>
                                          <asp:RequiredFieldValidator ID="NewPasswordRequired" runat="server" ControlToValidate="NewPassword" CssClass="EroorStar" ErrorMessage="New Password is required." ToolTip="New Password is required." ValidationGroup="ChangePassword1">*</asp:RequiredFieldValidator>
                                       </td>
                                    </tr>
                                    <tr>
                                       <td>
                                          <asp:Label ID="ConfirmNewPasswordLabel" runat="server" AssociatedControlID="ConfirmNewPassword">নতুন পাসওয়ার্ড পুনরায়:</asp:Label>
                                       </td>
                                    </tr>
                                    <tr>
                                       <td>
                                          <asp:TextBox ID="ConfirmNewPassword" runat="server" CssClass="textbox" TextMode="Password" Width="150px"></asp:TextBox>
                                          <asp:RequiredFieldValidator ID="ConfirmNewPasswordRequired" runat="server" ControlToValidate="ConfirmNewPassword" CssClass="EroorStar" ErrorMessage="Confirm New Password is required." ToolTip="Confirm New Password is required." ValidationGroup="ChangePassword1">*</asp:RequiredFieldValidator>
                                       </td>
                                    </tr>
                                    <tr>
                                       <td align="center">
                                          <asp:CompareValidator ID="NewPasswordCompare" runat="server" ControlToCompare="NewPassword" ControlToValidate="ConfirmNewPassword" CssClass="EroorSummer" Display="Dynamic" ErrorMessage="নতুন পাসওয়ার্ড উভয় টেক্সটবক্সে মিলে নি।" ValidationGroup="ChangePassword1"></asp:CompareValidator>
                                       </td>
                                    </tr>
                                    <tr>
                                       <td align="center" style="color: Red;">
                                          <asp:Literal ID="FailureText" runat="server" EnableViewState="False"></asp:Literal>
                                       </td>
                                    </tr>
                                    <tr>
                                       <td>
                                          <asp:Button ID="ChangePasswordPushButton" runat="server" CommandName="ChangePassword" CssClass="ContinueButton" Text="পরিবর্তন করুন" ValidationGroup="ChangePassword1" />
                                          <asp:Button ID="CancelPushButton" runat="server" CausesValidation="False" CommandName="Cancel" CssClass="ContinueButton" Text="বাতিল করুন" />
                                       </td>
                                    </tr>
                                 </table>
                              </td>
                           </tr>
                        </table>
                     </ChangePasswordTemplate>
                     <SuccessTemplate>
                        <table>
                           <tr>
                              <td>
                                 <table>
                                    <tr>
                                       <td align="center" colspan="2">সফল ভাবে</td>
                                    </tr>
                                    <tr>
                                       <td>আপনার পাসওয়ার্ড পরিবর্তন হয়েছে !</td>
                                    </tr>
                                    <tr>
                                       <td align="right" colspan="2">
                                          <asp:Button ID="ContinuePushButton" runat="server" CausesValidation="False" CommandName="Continue" CssClass="ContinueButton" PostBackUrl="~/Profile_Redirect.aspx" Text="Continue" />
                                       </td>
                                    </tr>
                                 </table>
                              </td>
                           </tr>
                        </table>
                     </SuccessTemplate>
                  </asp:ChangePassword>
                  <asp:SqlDataSource ID="LIUSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT LIUID, RegistrationID, InstitutionID, UserName, Category, Password, PasswordAnswer FROM LIU WHERE (InstitutionID = @InstitutionID)" UpdateCommand="UPDATE LIU SET Password = @Password WHERE (RegistrationID = @RegistrationID)">
                     <SelectParameters>
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                     </SelectParameters>
                     <UpdateParameters>
                        <asp:Parameter Name="Password" Type="String" />
                        <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                     </UpdateParameters>
                  </asp:SqlDataSource>
               </ContentTemplate>
            </asp:UpdatePanel>
         </div>
         <div id="SMSBalance">
            <asp:GridView ID="SMSBalanceGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="SMSID" DataSourceID="SMSBalanceSQL">
               <Columns>
                  <asp:BoundField DataField="SMS_Balance" HeaderText="আপনার SMS ব্যালেন্স" SortExpression="SMS_Balance" />
                  <asp:BoundField DataField="Masking" HeaderText="মাস্কিং (যে নাম থেকে SMS যাবে)" SortExpression="Masking" />
               </Columns>
            </asp:GridView>
            <asp:SqlDataSource ID="SMSBalanceSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM [SMS] WHERE ([InstitutionID] = @InstitutionID)">
               <SelectParameters>
                  <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
               </SelectParameters>
            </asp:SqlDataSource>
         </div>
      </div>
   </div>

   <asp:UpdateProgress ID="UpdateProgress" runat="server">
      <ProgressTemplate>
         <div id="progress_BG"></div>
         <div id="progress">
            <img src="../CSS/Image/gif-load.gif" alt="Loading..." />
            <br />
            <b>Loading...</b>
         </div>
      </ProgressTemplate>
   </asp:UpdateProgress>

   <script src="../../JS/jq_Profile/jquery-ui-1.8.23.custom.min.js"></script>
   <script type="text/javascript">
      $(function () {
         $('#main').tabs();

         var grandTotal = 0;
         $("[id*=DueLabel]").each(function () { grandTotal = grandTotal + parseFloat($(this).text()) });
         $("#Tota_Due").text("Total "+grandTotal+" /-");
      });
   </script>
</asp:Content>
