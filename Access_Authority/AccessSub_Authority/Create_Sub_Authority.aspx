<%@ Page Title="" Language="C#" MasterPageFile="~/Design.Master" AutoEventWireup="true" CodeBehind="Create_Sub_Authority.aspx.cs" Inherits="TailorBD.AccessSub_Authority.Create_Sub_Authority" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
        <style>
       .mGrid { text-align: left; }
       .mGrid th { padding: 4px 13px; text-align: left;}
    </style>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <h3>নতুন সাব-অথরিটি এর জন্য রেজিস্ট্রেশন</h3>
<div class="SubAdmin">
    <asp:CreateUserWizard ID="SubAdminCreateUserWizard" runat="server" OnCreatedUser="SubAdminCreateUserWizard_CreatedUser" LoginCreatedUser="False" DuplicateUserNameErrorMessage="This username already exists please choose another." InvalidPasswordErrorMessage="Password length minimum: {0}.">
         <WizardSteps>
             <asp:CreateUserWizardStep ID="CreateUserWizardStep1" runat="server">
                 <ContentTemplate>
                     <table>
                         <tr>
                             <td align="right" class="LabelText">
                                 সাব-অথরিটি এর নাম</td>
                             <td>
                                 <asp:TextBox ID="NameTextBox" runat="server" CssClass="textbox" placeholder="Input First Name" Width="277px"></asp:TextBox>
                             </td>
                             <td>
                                 <asp:RequiredFieldValidator ID="FnameRequired" runat="server" ControlToValidate="NameTextBox" CssClass="EroorStar" ErrorMessage="Security answer is required." ForeColor="Red" ToolTip="Security answer is required." ValidationGroup="CreateUserWizard1">*</asp:RequiredFieldValidator>
                             </td>
                         </tr>
                         <tr>
                             <td align="right" class="LabelText">পদবী</td>
                             <td>
                                 <asp:TextBox ID="DesignationTextBox" runat="server" CssClass="textbox" Width="277px" placeholder="Input Designation"></asp:TextBox>
                             </td>
                             <td>
                                 <asp:RequiredFieldValidator ID="DesignationRequired" runat="server" ControlToValidate="DesignationTextBox" CssClass="EroorStar" ErrorMessage="Security answer is required." ForeColor="Red" ToolTip="Security answer is required." ValidationGroup="CreateUserWizard1">*</asp:RequiredFieldValidator>
                             </td>
                         </tr>
                         <tr>
                             <td align="right" class="LabelText">
                                লগইন ইউজার নাম
                             </td>
                             <td>
                                 <asp:TextBox ID="UserName" runat="server" CssClass="textbox" placeholder="Input User Name" tooltipText="UserName must be minimum of 6 characters or digites, first 1 must be letter, Only use (- _ ) after 5 digites" Width="277px"></asp:TextBox>
                             </td>
                             <td style="color: Red;">
                                 <asp:RequiredFieldValidator ID="UsernameRequired" runat="server" ControlToValidate="UserName" CssClass="EroorStar" ErrorMessage="Security answer is required." ForeColor="Red" ToolTip="Security answer is required." ValidationGroup="CreateUserWizard1">*</asp:RequiredFieldValidator>
                                 <asp:Literal ID="ErrorMessage" runat="server" EnableViewState="False"></asp:Literal>
                             </td>
                         </tr>
                         <tr>
                             <td align="right" class="LabelText">
                            লগইন পাসওয়ার্ড
                             </td>
                             <td>
                                 <asp:TextBox ID="Password" runat="server" placeholder="Input Password" TextMode="Password" CssClass="textbox" Width="277px"></asp:TextBox>
                             </td>
                             <td>
                                 <asp:RequiredFieldValidator ID="PasswordRequired" runat="server"
                                     ControlToValidate="Password"
                                     ErrorMessage="Enter Password" ToolTip="Password is required."
                                     ValidationGroup="CreateUserWizard1" ForeColor="Red" Font-Names="Tahoma" Font-Size="8pt">*</asp:RequiredFieldValidator>
                             </td>
                         </tr>
                         <tr>
                             <td align="right" class="LabelText">
                              
                                পাসওয়ার্ড নিশ্চিত করুন
                             </td>
                             <td>
                                 <asp:TextBox ID="ConfirmPassword" runat="server" placeholder="Password Again" 
                                     TextMode="Password" CssClass="textbox" Width="277px"></asp:TextBox>
                             </td>
                             <td>
                                 <asp:RequiredFieldValidator ID="ConfirmPasswordRequired" runat="server"
                                     ControlToValidate="ConfirmPassword"
                                     ErrorMessage="Confirm Password"
                                     ToolTip="Confirm Password is required."
                                     ValidationGroup="CreateUserWizard1" ForeColor="Red" Font-Names="Tahoma" Font-Size="8pt">*</asp:RequiredFieldValidator>
                             </td>
                         </tr>
                         <tr>
                             <td align="right" class="LabelText">
                               ই-মেইল
                             </td>
                             <td>
                                 <asp:TextBox ID="Email" runat="server" placeholder="Write@mail.com" CssClass="textbox" Width="277px"></asp:TextBox>
                             </td>
                             <td>
                                 <asp:RequiredFieldValidator ID="EmailRequired" runat="server"
                                     ControlToValidate="Email" ErrorMessage="E-mail is required."
                                     ToolTip="E-mail is required." ValidationGroup="CreateUserWizard1"
                                     ForeColor="Red">*</asp:RequiredFieldValidator>
                                 <asp:RegularExpressionValidator ID="RegularExpressionValidator2" runat="server" ControlToValidate="Email" ErrorMessage="Email not valid" Font-Names="Tahoma" Font-Size="8pt" ForeColor="Red" ValidationExpression="\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*"></asp:RegularExpressionValidator>
                             </td>
                         </tr>
                         <tr>
                             <td align="right" class="LabelText">
                                নিরাপত্তা প্রশ্ন
                             </td>
                             <td>
                                 <asp:DropDownList ID="Question" runat="server" CssClass="dropdown" ValidationGroup="CreateUserWizard1" Width="277px" EnableViewState="False">
                                     <asp:ListItem>Select your security question</asp:ListItem>
                                     <asp:ListItem>What is the first name of your favorite uncle?</asp:ListItem>
                                     <asp:ListItem>What is your oldest child&#39;s nick name?</asp:ListItem>
                                     <asp:ListItem>What is the first name of your oldest nephew?</asp:ListItem>
                                     <asp:ListItem>What is the first name of your aunt?</asp:ListItem>
                                     <asp:ListItem>Where did you spend your honeymoon?</asp:ListItem>
                                     <asp:ListItem>What is your favorite game?</asp:ListItem>
                                     <asp:ListItem>what is your favorite food?</asp:ListItem>
                                     <asp:ListItem>What was your favorite sport in high school?</asp:ListItem>
                                     <asp:ListItem>In what city were you born?</asp:ListItem>
                                     <asp:ListItem>What is the country of your ultimate dream vacation?</asp:ListItem>
                                     <asp:ListItem>What is the title and author of your favorite book?</asp:ListItem>
                                     <asp:ListItem>What is your favorite TV program?</asp:ListItem>
                                 </asp:DropDownList>
                             </td>
                             <td>
                                 <asp:RequiredFieldValidator ID="QuestionRequired" runat="server"
                                     ControlToValidate="Question"
                                     ErrorMessage="Security question is required."
                                     ToolTip="Security question is required."
                                     ValidationGroup="CreateUserWizard1" ForeColor="Red" InitialValue="Select your security question">*</asp:RequiredFieldValidator>
                             </td>
                         </tr>
                         <tr>
                             <td align="right" class="LabelText">               
                            নিরাপত্তা উত্তর
                             </td>
                             <td>
                                 <asp:TextBox ID="Answer" runat="server" placeholder="Answer the Question" CssClass="textbox" Width="277px"></asp:TextBox>
                             </td>
                             <td>
                                 <asp:RequiredFieldValidator ID="AnswerRequired" runat="server"
                                     ControlToValidate="Answer"
                                     ErrorMessage="Security answer is required."
                                     ToolTip="Security answer is required." ValidationGroup="CreateUserWizard1"
                                     ForeColor="Red">*</asp:RequiredFieldValidator>
                             </td>
                         </tr>
                         <tr>
                             <td colspan="2" align="right">
                                 <asp:CompareValidator ID="PasswordCompare" runat="server"
                                     ControlToCompare="Password" ControlToValidate="ConfirmPassword"
                                     Display="Dynamic"
                                     ErrorMessage="The Password and Confirmation Password must match."
                                     ValidationGroup="CreateUserWizard1" ForeColor="Red"></asp:CompareValidator>
                             </td>
                             <td align="center">&nbsp;</td>
                         </tr>
                         <tr>
                             <td colspan="2" align="right">
                                 &nbsp;</td>
                             <td align="center" style="color: Red;"></td>
                         </tr>
                         <tr>
                             <td colspan="2" align="right">
                                 <asp:Button ID="StepNextButton" runat="server"
                                     CommandName="MoveNext" Text="Save &amp; Continue"
                                     ValidationGroup="CreateUserWizard1" CssClass="ContinueButton" />

                             </td>
                             <td align="center" style="color: Red;">&nbsp;</td>
                         </tr>
                     </table>

                     <asp:SqlDataSource ID="RegistrationSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="INSERT INTO Registration(InstitutionID, UserName, Validation, Category, CreateDate, Name, Designation, Email) VALUES (@InstitutionID, @UserName, 'Valid', N'Sub-Admin', GETDATE(), @Name, @Designation, @Email)" SelectCommand="SELECT * FROM [Registration]">
                         <InsertParameters>
                             <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                             <asp:ControlParameter ControlID="UserName" Name="UserName" PropertyName="Text" Type="String" />
                             <asp:ControlParameter ControlID="NameTextBox" Name="Name" PropertyName="Text" Type="String" />
                             <asp:ControlParameter ControlID="DesignationTextBox" Name="Designation" PropertyName="Text" Type="String" />
                             <asp:ControlParameter ControlID="Email" Name="Email" PropertyName="Text" Type="String" />
                         </InsertParameters>
                     </asp:SqlDataSource>

                 </ContentTemplate>
                 <CustomNavigationTemplate>
                  
                 </CustomNavigationTemplate>
             </asp:CreateUserWizardStep>

             <asp:WizardStep ID="AssignWork" runat="server" Title="Assign Work Responsibility">
            <p>সাব-অ্যাডমিন এর জন্য কাজের দায়িত্বসমূহ ধার্য করুন</p>

                 <asp:GridView ID="LinkGridView" runat="server" AutoGenerateColumns="False" DataKeyNames="LinkID,Location" DataSourceID="LinkPageSQL" OnDataBound="LinkGridView_DataBound"
                     PagerStyle-CssClass="pgr" CssClass="mGrid">
                     <AlternatingRowStyle CssClass="alt" />
                     <Columns>
                         <asp:BoundField DataField="Category" HeaderText="ক্যাটাগরি লিংক" SortExpression="Category" />
                         <asp:BoundField DataField="SubCategory" HeaderText="সাব ক্যাটাগরি লিংক" SortExpression="SubCategory" />

                        <asp:TemplateField>
                           <HeaderTemplate>
                              <asp:CheckBox ID="AllCheckBox" runat="server" Text="পৃষ্ঠার শিরোনাম (এক্সেস এর জন্য পেজ নির্বাচন করুন)" />
                           </HeaderTemplate>
                           <ItemTemplate>
                              <asp:CheckBox ID="LinkCheckBox" runat="server" Text='<%#Bind("PageTitle") %>' />
                           </ItemTemplate>
                        </asp:TemplateField>
                     </Columns>

<PagerStyle CssClass="pgr"></PagerStyle>
                 </asp:GridView>
                 <asp:SqlDataSource ID="LinkPageSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Link_Pages.LinkID, Link_Pages.LinkCategoryID, Link_Pages.SubCategoryID, Link_Pages.PageURL, Link_Pages.PageTitle, Link_Pages.Location, Link_SubCategory.SubCategory, Link_Category.Category, Link_Users.InstitutionID, Link_Users.RegistrationID FROM Link_Pages INNER JOIN Link_Users ON Link_Pages.LinkID = Link_Users.LinkID LEFT OUTER JOIN Link_SubCategory ON Link_Pages.SubCategoryID = Link_SubCategory.SubCategoryID LEFT OUTER JOIN Link_Category ON Link_Pages.LinkCategoryID = Link_Category.LinkCategoryID WHERE (Link_Users.InstitutionID = @InstitutionID) AND (Link_Users.RegistrationID = @RegistrationID)">
                    <SelectParameters>
                       <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                       <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" />
                    </SelectParameters>
                </asp:SqlDataSource>
                 <asp:SqlDataSource ID="Link_UsersSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="INSERT INTO [Link_Users] ([InstitutionID], [RegistrationID], [LinkID], [UserName]) VALUES (@InstitutionID, @RegistrationID, @LinkID, @UserName)" SelectCommand="SELECT * FROM [Link_Users]">
                     <InsertParameters>
                         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                         <asp:Parameter Name="RegistrationID" Type="Int32" />
                         <asp:Parameter Name="LinkID" Type="Int32" />
                         <asp:Parameter Name="UserName" Type="String" />
                     </InsertParameters>
                 </asp:SqlDataSource>
                 <br />
                 <asp:Button ID="LinkAssignButton" runat="server" OnClick="LinkAssignButton_Click" Text="Submit" CssClass="ContinueButton" ToolTip="Submit" />
             </asp:WizardStep>

             <asp:CompleteWizardStep ID="CompleteWizardStep1" runat="server">
                 <ContentTemplate>
                     <table>
                         <tr>
                             <td align="center" class="LabelText">অভিনন্দন!</td>
                         </tr>
                         <tr>
                             <td class="LabelText">সাব-অ্যাডমিন অ্যাকাউন্ট সফলভাবে তৈরি করা হয়েছে.</td>
                         </tr>
                         <tr>
                             <td align="right">
                                 <asp:Button ID="ContinueButton" runat="server" CausesValidation="False"
                                     CommandName="Continue" Text="Continue" ValidationGroup="CreateUserWizard1" CssClass="ContinueButton" PostBackUrl="~/Profile_Redirect.aspx" />
                             </td>
                         </tr>
                     </table>
                 </ContentTemplate>
             </asp:CompleteWizardStep>
         </WizardSteps>

         <FinishNavigationTemplate>
             <asp:Button ID="FinishPreviousButton" runat="server" CausesValidation="False" Visible="false" CommandName="MovePrevious" Text="Previous" />
             <asp:Button ID="FinishButton" runat="server" CommandName="MoveComplete" Visible="false" Text="Finish" />
         </FinishNavigationTemplate>
     </asp:CreateUserWizard>

    <asp:SqlDataSource ID="LITSQl" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="INSERT INTO LIU(InstitutionID, RegistrationID, UserName, Category, Password, PasswordAnswer) VALUES (@InstitutionID, @RegistrationID, @UserName, @Category, @Password, @PasswordAnswer)" SelectCommand="SELECT * FROM LIU">
        <InsertParameters>
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
            <asp:Parameter DefaultValue="Sub-Admin" Name="Category" Type="String" />
            <asp:Parameter DefaultValue="" Name="RegistrationID" Type="Int32" />
            <asp:Parameter Name="UserName" Type="String" />
            <asp:Parameter Name="Password" Type="String" />
            <asp:Parameter Name="PasswordAnswer" Type="String" />
        </InsertParameters>
    </asp:SqlDataSource>
</div>
   <script>
      $("[id*=AllCheckBox]").live("click", function () {
         var a = $(this), b = $(this).closest("table");
         $("input[type=checkbox]", b).each(function () {
            a.is(":checked") ? ($(this).attr("checked", "checked"), $("td", $(this).closest("tr")).addClass("selected")) : ($(this).removeAttr("checked"), $("td", $(this).closest("tr")).removeClass("selected"));
         });
      });

      $("[id*=LinkCheckBox]").live("click", function () {
         var a = $(this).closest("table"), b = $("[id*=chkHeader]", a);
         $(this).is(":checked") ? ($("td", $(this).closest("tr")).addClass("selected"), $("[id*=chkRow]", a).length == $("[id*=chkRow]:checked", a).length && b.attr("checked", "checked")) : ($("td", $(this).closest("tr")).removeClass("selected"), b.removeAttr("checked"));
      });
      
   </script>
</asp:Content>
