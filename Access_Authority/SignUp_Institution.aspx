<%@ Page Title="" Language="C#" MasterPageFile="~/Design.Master" AutoEventWireup="true" CodeBehind="SignUp_Institution.aspx.cs" Inherits="TailorBD.AccessAdmin.SignUp_Institution" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <h3>Sign Up for Institution</h3>

    <asp:CreateUserWizard ID="InstitutionCW" runat="server" DisableCreatedUser="True" LoginCreatedUser="False" OnCreatedUser="InstitutionCW_CreatedUser">
        <WizardSteps>
            <asp:CreateUserWizardStep ID="CreateUserWizardStep1" runat="server">
                <ContentTemplate>
                    <table>
                        <tr>
                            <td align="right">
                                <asp:Label ID="UserNameLabel" runat="server" AssociatedControlID="UserName">User Name:</asp:Label>
                            </td>
                            <td>
                                <asp:TextBox ID="UserName" runat="server" CssClass="Textbox"></asp:TextBox>
                                <asp:RequiredFieldValidator ID="UserNameRequired" runat="server" ControlToValidate="UserName" CssClass="EroorStar" ErrorMessage="User Name is required." ToolTip="User Name is required." ValidationGroup="InstitutionCW">!</asp:RequiredFieldValidator>
                            </td>
                        </tr>
                        <tr>
                            <td align="right">
                                <asp:Label ID="PasswordLabel" runat="server" AssociatedControlID="Password">Password:</asp:Label>
                            </td>
                            <td>
                                <asp:TextBox ID="Password" runat="server" CssClass="Textbox" TextMode="Password"></asp:TextBox>
                                <asp:RequiredFieldValidator ID="PasswordRequired" runat="server" ControlToValidate="Password" CssClass="EroorStar" ErrorMessage="Password is required." ToolTip="Password is required." ValidationGroup="InstitutionCW">!</asp:RequiredFieldValidator>
                            </td>
                        </tr>
                        <tr>
                            <td align="right">
                                <asp:Label ID="ConfirmPasswordLabel" runat="server" AssociatedControlID="ConfirmPassword">Confirm Password:</asp:Label>
                            </td>
                            <td>
                                <asp:TextBox ID="ConfirmPassword" runat="server" CssClass="Textbox" TextMode="Password"></asp:TextBox>
                                <asp:RequiredFieldValidator ID="ConfirmPasswordRequired" runat="server" ControlToValidate="ConfirmPassword" CssClass="EroorStar" ErrorMessage="Confirm Password is required." ToolTip="Confirm Password is required." ValidationGroup="InstitutionCW">!</asp:RequiredFieldValidator>
                            </td>
                        </tr>
                        <tr>
                            <td align="right">
                                <asp:Label ID="EmailLabel" runat="server" AssociatedControlID="Email">E-mail:</asp:Label>
                            </td>
                            <td>
                                <asp:TextBox ID="Email" runat="server" CssClass="Textbox"></asp:TextBox>
                                <asp:RequiredFieldValidator ID="EmailRequired" runat="server" ControlToValidate="Email" CssClass="EroorStar" ErrorMessage="E-mail is required." ToolTip="E-mail is required." ValidationGroup="InstitutionCW">!</asp:RequiredFieldValidator>
                            </td>
                        </tr>
                        <tr>
                            <td align="right">
                                <asp:Label ID="QuestionLabel" runat="server" AssociatedControlID="Question">Security Question:</asp:Label>
                            </td>
                            <td>
                                <asp:TextBox ID="Question" runat="server" CssClass="Textbox"></asp:TextBox>
                                <asp:RequiredFieldValidator ID="QuestionRequired" runat="server" ControlToValidate="Question" CssClass="EroorStar" ErrorMessage="Security question is required." ToolTip="Security question is required." ValidationGroup="InstitutionCW">!</asp:RequiredFieldValidator>
                            </td>
                        </tr>
                        <tr>
                            <td align="right">
                                <asp:Label ID="AnswerLabel" runat="server" AssociatedControlID="Answer">Security Answer:</asp:Label>
                            </td>
                            <td>
                                <asp:TextBox ID="Answer" runat="server" CssClass="Textbox"></asp:TextBox>
                                <asp:RequiredFieldValidator ID="AnswerRequired" runat="server" ControlToValidate="Answer" CssClass="EroorStar" ErrorMessage="Security answer is required." ToolTip="Security answer is required." ValidationGroup="InstitutionCW">!</asp:RequiredFieldValidator>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" colspan="2">
                                <asp:CompareValidator ID="PasswordCompare" runat="server" ControlToCompare="Password" ControlToValidate="ConfirmPassword" CssClass="EroorStar" Display="Dynamic" ErrorMessage="The Password and Confirmation Password must match." ValidationGroup="InstitutionCW"></asp:CompareValidator>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" colspan="2" style="color:Red;">
                                <asp:Literal ID="ErrorMessage" runat="server" EnableViewState="False"></asp:Literal>
                            </td>
                        </tr>
                    </table>
                </ContentTemplate>
                <CustomNavigationTemplate>
                    <table border="0" cellspacing="5" style="width:100%;height:100%;">
                        <tr align="right">
                            <td align="right" colspan="0">
                                <asp:Button ID="StepNextButton" runat="server" CommandName="MoveNext" CssClass="ContinueButton" Text="Create User" ValidationGroup="InstitutionCW" />
                            </td>
                        </tr>
                    </table>
                </CustomNavigationTemplate>
            </asp:CreateUserWizardStep>

            <asp:WizardStep ID="InstitutionInfo" runat="server" Title="Institution Info">

                <table>
                    <tr>
                        <td>Name</td>
                        <td>
                            <asp:TextBox ID="InsNameTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
                            <asp:RequiredFieldValidator ID="Required" runat="server" ControlToValidate="InsNameTextBox" CssClass="EroorStar" ValidationGroup="S">!</asp:RequiredFieldValidator>
                        </td>
                    </tr>
                    <tr>
                        <td>Dialog Title</td>
                        <td>
                            <asp:TextBox ID="Dialog_TitleTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
                        </td>
                    </tr>
                    <tr>
                        <td>Established</td>
                        <td>
                            <asp:TextBox ID="EstablishedTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
                            <asp:RequiredFieldValidator ID="Required0" runat="server" ControlToValidate="EstablishedTextBox" CssClass="EroorStar" ValidationGroup="S">!</asp:RequiredFieldValidator>
                        </td>
                    </tr>
                    <tr>
                        <td>Staff</td>
                        <td>
                            <asp:TextBox ID="StaffTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
                        </td>
                    </tr>
                    <tr>
                        <td>Phone </td>
                        <td>
                            <asp:TextBox ID="PhoneTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
                            <asp:RequiredFieldValidator ID="Required1" runat="server" ControlToValidate="PhoneTextBox" CssClass="EroorStar" ValidationGroup="S">!</asp:RequiredFieldValidator>
                        </td>
                    </tr>
                    <tr>
                        <td>Email</td>
                        <td>
                            <asp:TextBox ID="EmailTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
                        </td>
                    </tr>
                    <tr>
                        <td>Website</td>
                        <td>
                            <asp:TextBox ID="WebsiteTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            Address</td>
                        <td>
                            <asp:TextBox ID="AddressTextBox" runat="server" CssClass="Textbox" TextMode="MultiLine"></asp:TextBox>
                            <asp:RequiredFieldValidator ID="Required2" runat="server" ControlToValidate="AddressTextBox" CssClass="EroorStar" ValidationGroup="S">!</asp:RequiredFieldValidator>
                        </td>
                    </tr>
                    <tr>
                        <td>Signing Money</td>
                        <td>
                            <asp:TextBox ID="Signing_MoneyTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
                            <asp:RequiredFieldValidator ID="Required4" runat="server" ControlToValidate="Signing_MoneyTextBox" CssClass="EroorStar" ValidationGroup="S">!</asp:RequiredFieldValidator>
                        </td>
                    </tr>
                    <tr>
                        <td>Renew Amount</td>
                        <td>
                            <asp:TextBox ID="Renew_AmountTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
                            <asp:RequiredFieldValidator ID="Required5" runat="server" ControlToValidate="Renew_AmountTextBox" CssClass="EroorStar" ValidationGroup="S">!</asp:RequiredFieldValidator>
                        </td>
                    </tr>
                    <tr>
                        <td>Package</td>
                        <td>
                            <asp:DropDownList ID="PackageDropDownList" runat="server" DataSourceID="PackageSQL" DataTextField="PackageName" DataValueField="PackageID" CssClass="dropdown">
                            </asp:DropDownList>
                            <asp:SqlDataSource ID="PackageSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT [PackageID], [PackageName] FROM [Package]"></asp:SqlDataSource>
                        </td>
                    </tr>
                    <tr>
                        <td>Masking</td>
                        <td>
                            <asp:TextBox ID="MaskingTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
                            <asp:RequiredFieldValidator ID="Required3" runat="server" ControlToValidate="MaskingTextBox" CssClass="EroorStar" ValidationGroup="S">!</asp:RequiredFieldValidator>
                            <asp:RegularExpressionValidator ID="RegularExpressionValidator1" runat="server" ErrorMessage="Invalid Masking Name" ValidationExpression="^[A-Za-z0-9. ]{3,11}$" ControlToValidate="MaskingTextBox" CssClass="EroorStar" ValidationGroup="S"></asp:RegularExpressionValidator>
                        </td>
                    </tr>
                    <tr>
                        <td>Logo</td>
                        <td>
                            <asp:FileUpload ID="LogoUpload" runat="server" />
                        </td>
                    </tr>
                    <tr>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                    </tr>
                    <tr>
                        <td>&nbsp;</td>
                        <td>
                            <asp:Button ID="SubmitButton" runat="server" CssClass="ContinueButton" Text="Submit" OnClick="SubmitButton_Click" ValidationGroup="S" />
     
                            <asp:SqlDataSource ID="InstitutionInfoSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="INSERT INTO [Institution] ([InstitutionName],[Dialog_Title], [PackageID], [Established], [Staff], [Address],  [Phone], [Email], [Website], [UserName], [Validation], [Signing_Money], [Renew_Amount], [Expire_Date], [InstitutionLogo], [Date]) VALUES (@InstitutionName, @Dialog_Title, @PackageID, @Established, @Staff, @Address, @Phone, @Email, @Website, @UserName, @Validation, @Signing_Money, @Renew_Amount,(SELECT DATEADD(MONTH,(SELECT Interval FROM Package WHERE (PackageID = @PackageID)),Getdate())),@InstitutionLogo,GetDate())" SelectCommand="SELECT * FROM [Institution]">
                                <InsertParameters>
                                    <asp:ControlParameter ControlID="InsNameTextBox" Name="InstitutionName" PropertyName="Text" Type="String" />
                                    <asp:ControlParameter ControlID="Dialog_TitleTextBox" Name="Dialog_Title" PropertyName="Text" />
                                    <asp:ControlParameter ControlID="PackageDropDownList" Name="PackageID" PropertyName="SelectedValue" Type="Int32" />
                                    <asp:ControlParameter ControlID="EstablishedTextBox" Name="Established" PropertyName="Text" Type="String" />
                                    <asp:ControlParameter ControlID="StaffTextBox" Name="Staff" PropertyName="Text" Type="String" />
                                    <asp:ControlParameter ControlID="AddressTextBox" Name="Address" PropertyName="Text" Type="String" />
                                    <asp:ControlParameter ControlID="PhoneTextBox" Name="Phone" PropertyName="Text" Type="String" />
                                    <asp:ControlParameter ControlID="EmailTextBox" Name="Email" PropertyName="Text" Type="String" />
                                    <asp:ControlParameter ControlID="WebsiteTextBox" Name="Website" PropertyName="Text" Type="String" />
                                    <asp:Parameter Name="UserName" Type="String" />
                                    <asp:Parameter Name="Validation" DefaultValue="Valid" Type="String" />
                                    <asp:ControlParameter ControlID="Signing_MoneyTextBox" DefaultValue="" Name="Signing_Money" PropertyName="Text" Type="Double" />
                                    <asp:ControlParameter ControlID="Renew_AmountTextBox" Name="Renew_Amount" PropertyName="Text" Type="Double" />
                                    <asp:ControlParameter ControlID="LogoUpload" Name="InstitutionLogo" PropertyName="FileBytes" />
                                </InsertParameters>
                            </asp:SqlDataSource>
                            <asp:SqlDataSource ID="RegistrationSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="INSERT INTO Registration(InstitutionID, UserName, Validation, Category, CreateDate) VALUES ((Select IDENT_CURRENT('Institution')), @UserName, 'Valid', 'Admin', GETDATE())" SelectCommand="SELECT * FROM [Registration]">
                                <InsertParameters>
                                    <asp:Parameter DefaultValue="" Name="UserName" Type="String" />
                                </InsertParameters>
                            </asp:SqlDataSource>
                            <asp:SqlDataSource ID="LIUSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="INSERT INTO [LIU] ([RegistrationID], [InstitutionID], [UserName], [Category], [Password], [PasswordAnswer]) VALUES ((SELECT IDENT_CURRENT( 'Registration' )),(SELECT IDENT_CURRENT( 'Institution' )), @UserName, @Category, @Password, @PasswordAnswer)" SelectCommand="SELECT * FROM [LIU]">
                               <InsertParameters>
                                  <asp:Parameter DefaultValue="Admin" Name="Category" Type="String" />
                                  <asp:Parameter Name="UserName" Type="String" />
                                  <asp:Parameter DefaultValue="" Name="Password" Type="String" />
                                  <asp:Parameter Name="PasswordAnswer" Type="String" />
                               </InsertParameters>
                            </asp:SqlDataSource>
                            <asp:SqlDataSource ID="InvoiceSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="INSERT INTO [Invoice] ([InstitutionID],[RegistrationID],[IssuDate], [EndDate], [Invoice_For], [Discount], [PaymentStatus], [CreateDate]) VALUES ((select IDENT_CURRENT( 'Institution' )),@RegistrationID,Getdate(), (select DATEADD(MONTH,(select Interval from Package Where PackageID=@PackageID),Getdate())), @Invoice_For, @Discount, @PaymentStatus, getdate())" SelectCommand="SELECT * FROM [Invoice]">
                                <InsertParameters>
                                    <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" />
                                    <asp:ControlParameter ControlID="PackageDropDownList" Name="PackageID" PropertyName="SelectedValue" />
                                    <asp:Parameter Name="Discount" DefaultValue="0" Type="Double" />
                                    <asp:Parameter DefaultValue="Due" Name="PaymentStatus" Type="String" />
                                    <asp:Parameter DefaultValue="Signing Money And  Renew Amount" Name="Invoice_For" />
                                </InsertParameters>
                            </asp:SqlDataSource>
                            <asp:SqlDataSource ID="InvoiceLineSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="INSERT INTO [Invoice_Line] ([InstitutionID],[RegistrationID],[InvoiceID], [Details], [Amount]) VALUES ((select IDENT_CURRENT( 'Institution' )),@RegistrationID,(select IDENT_CURRENT( 'Invoice' )), @Details, @Amount)" SelectCommand="SELECT * FROM [Invoice_Line]">
                                <InsertParameters>
                                    <asp:Parameter Name="RegistrationID" />
                                    <asp:Parameter Name="Details" Type="String" />
                                    <asp:Parameter Name="Amount" Type="Double" />
                                </InsertParameters>
                            </asp:SqlDataSource>
                            <asp:SqlDataSource ID="SMSSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="INSERT INTO [SMS] ([SMS_Balance], [InstitutionID], [Masking], [Date]) VALUES (@SMS_Balance, (select IDENT_CURRENT( 'Institution' )), @Masking, Getdate())" SelectCommand="SELECT * FROM [SMS]">
                                <InsertParameters>
                                    <asp:Parameter DefaultValue="10" Name="SMS_Balance" Type="Int32" />
                                    <asp:ControlParameter ControlID="MaskingTextBox" Name="Masking" PropertyName="Text" Type="String" />
                                </InsertParameters>
                            </asp:SqlDataSource>
                        </td>
                    </tr>
                </table>

            </asp:WizardStep>

            <asp:CompleteWizardStep ID="CompleteWizardStep1" runat="server">
                <ContentTemplate>
                    <table>
                        <tr>
                            <td align="center">Congratulation!</td>
                        </tr>
                        <tr>
                            <td>Your account has been successfully created.</td>
                        </tr>
                        <tr>
                            <td align="right">
                                <asp:Button ID="ContinueButton" runat="server" CausesValidation="False" CommandName="Continue" CssClass="ContinueButton" Text="Continue" ValidationGroup="InstitutionCW" PostBackUrl="~/Access_Authority/Profile.aspx" />
                            </td>
                        </tr>
                    </table>
                </ContentTemplate>
            </asp:CompleteWizardStep>
        </WizardSteps>
        <FinishNavigationTemplate>
            <asp:Button ID="FinishPreviousButton" runat="server" CausesValidation="False" CommandName="MovePrevious" Text="Previous"  Visible="false"/>
            <asp:Button ID="FinishButton" runat="server" CommandName="MoveComplete" Text="Finish" Visible="false"/>
        </FinishNavigationTemplate>
    </asp:CreateUserWizard>
    </asp:Content>
