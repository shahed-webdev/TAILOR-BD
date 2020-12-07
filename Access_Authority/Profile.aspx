<%@ Page Title="" Language="C#" MasterPageFile="~/Design.Master" AutoEventWireup="true" CodeBehind="Profile.aspx.cs" Inherits="TailorBD.Access_Authority.Profile" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
    <link href="CSS/Profile.css" rel="stylesheet" />
    <script>
        $(document).ready(function () {
            $('#Click').click(function () {
                $("#Show").show(500);
                $("#Click").hide();
            });
        });
    </script>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <div class="Contain">
        <asp:ScriptManager ID="ScriptManager1" runat="server"></asp:ScriptManager>
        

        <div class="Profile_Image">
            <asp:FormView ID="PImgFormView" runat="server" DataKeyNames="RegistrationID" DataSourceID="ImgSQL">
                <ItemTemplate>
                    <img alt="No Image" src="../Handler/AuthorityHandler.ashx?Img=<%#Eval("RegistrationID") %>" class="P_Image" />

                    <div class="Name">
                        <asp:Label ID="Label1" runat="server" Text='<%# Bind("Name") %>'></asp:Label>

                        <br />
                        <asp:Label ID="Label5" runat="server" Text='<%# Bind("Designation") %>'></asp:Label>
                    </div>
                </ItemTemplate>
            </asp:FormView>
            <asp:SqlDataSource ID="ImgSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                SelectCommand="SELECT * FROM Registration WHERE (RegistrationID = @RegistrationID)">
                <SelectParameters>
                    <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                </SelectParameters>
            </asp:SqlDataSource>

        </div>

        <div class="Update_Info">

            <asp:FormView ID="AdminFormView" runat="server" DataKeyNames="RegistrationID" DataSourceID="AdminInfoSQL" OnItemUpdated="AdminFormView_ItemUpdated">
                <EditItemTemplate>
                    <table>
                        <tr>
                            <td>Name:</td>
                            <td>
                                <asp:TextBox ID="NameTextBox" runat="server" CssClass="textbox" Text='<%# Bind("Name") %>' />
                            </td>
                        </tr>
                        <tr>
                            <td>Father&#39;s Name:</td>
                            <td>
                                <asp:TextBox ID="FatherNameTextBox" runat="server" CssClass="textbox" Text='<%# Bind("FatherName") %>' />
                            </td>
                        </tr>
                        <tr>
                            <td>Gender:</td>
                            <td>
                                <asp:TextBox ID="GenderTextBox" runat="server" CssClass="textbox" Text='<%# Bind("Gender") %>' />
                            </td>
                        </tr>
                        <tr>
                            <td>Designation:</td>
                            <td>
                                <asp:TextBox ID="DesignationTextBox" runat="server" CssClass="textbox" Text='<%# Bind("Designation") %>' />
                            </td>
                        </tr>
                        <tr>
                            <td>City:</td>
                            <td>
                                <asp:TextBox ID="CityTextBox" runat="server" CssClass="textbox" Text='<%# Bind("City") %>' />
                            </td>
                        </tr>
                        <tr>
                            <td>Postal Code:</td>
                            <td>
                                <asp:TextBox ID="PostalCodeTextBox" runat="server" CssClass="textbox" Text='<%# Bind("PostalCode") %>' />
                            </td>
                        </tr>
                        <tr>
                            <td>Phone:</td>
                            <td>
                                <asp:TextBox ID="PhoneTextBox" runat="server" CssClass="textbox" Text='<%# Bind("Phone") %>' />
                            </td>
                        </tr>
                        <tr>
                            <td>Email:</td>
                            <td>
                                <asp:TextBox ID="EmailTextBox" runat="server" CssClass="textbox" Text='<%# Bind("Email") %>' />
                            </td>
                        </tr>
                        <tr>
                            <td>Address:</td>
                            <td>
                                <asp:TextBox ID="AddressTextBox" runat="server" CssClass="textbox" Text='<%# Bind("Address") %>' TextMode="MultiLine" />
                            </td>
                        </tr>
                        <tr>
                            <td>Image:</td>
                            <td>
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
                                <asp:LinkButton ID="UpdateButton" runat="server" CausesValidation="True" CommandName="Update" CssClass="Edit_Bnt" Text="Update" />
                                &nbsp;<asp:LinkButton ID="UpdateCancelButton" runat="server" CausesValidation="False" CommandName="Cancel" CssClass="Edit_Bnt" Text="Cancel" />
                            </td>
                        </tr>
                    </table>
                </EditItemTemplate>

                <ItemTemplate>
                    <div class="Info_Border">
                        <div class="Admin_Name">
                            <asp:Label ID="NameLabel" runat="server" Text='<%# Bind("Name") %>' />
                        </div>

                        <div class="Admin_F_Name">
                            Father's Name:
                        <asp:Label ID="FatherNameLabel" runat="server" Text='<%# Bind("FatherName") %>' />
                        </div>

                        <div class="Heading">General information</div>

                        <div class="Designation">Designation</div>
                        <asp:Label ID="DesignationLabel" runat="server" Text='<%# Bind("Designation") %>' CssClass="Data" />


                        <div class="Heading">Contact Information</div>

                        <div class="Mobile">Mobile</div>
                        <asp:Label ID="PhoneLabel" runat="server" Text='<%# Bind("Phone") %>' CssClass="Data" />


                        <div class="Email">Email</div>
                        <asp:Label ID="EmailLabel" runat="server" Text='<%# Bind("Email") %>' CssClass="Data" />


                        <div class="Address">Address</div>
                        <asp:Label ID="AddressLabel" runat="server" Text='<%# Bind("Address") %>' CssClass="Data" />

                        <div class="Edit_Bnt">
                            <asp:LinkButton ID="EditButton" runat="server" CausesValidation="False" CommandName="Edit" Text="Edit" />
                        </div>

                    </div>
                </ItemTemplate>
            </asp:FormView>

            <asp:SqlDataSource ID="AdminInfoSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                SelectCommand="SELECT * FROM Registration WHERE (RegistrationID = @RegistrationID)"
                UpdateCommand="UPDATE Registration SET Name = @Name, FatherName = @FatherName, Gender = @Gender, Designation = @Designation, Address = @Address, City = @City, PostalCode = @PostalCode, Phone = @Phone, Email = @Email, DateofBirth = @DateofBirth WHERE (RegistrationID = @RegistrationID)">
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
                    <asp:Parameter Name="DateofBirth" />
                    <asp:Parameter Name="RegistrationID" Type="Int32" />
                </UpdateParameters>
            </asp:SqlDataSource>
        </div>
        <div class="Link">
             <h4>Basic</h4>
            <ul>
                <li><a href="Package.aspx">Create Package</a></li>
                <li><a href="SignUp_Institution.aspx">SignUp Institution</a></li>
                <li><a href="Invoice/Create_Invoice.aspx">Create Invoice</a></li>
                 <li><a href="Institution_List.aspx">Institution Details</a></li>
            </ul>

             <h4>User Management</h4>
            <ul>
                <li><a href="Approve_Unlock_User.aspx">Approve/Unlock User</a></li>
                <li><a href="Create_Delete_Role.aspx">Create/Delete Role</a></li>
                <li><a href="Manage_Roles.aspx">Manage Roles</a></li>
                <li><a href="Manage_Users.aspx">Manage Users</a></li>
            </ul>
                         <h4>Sub Authority</h4>
            <ul>
               <li><a href="AccessSub_Authority/Create_Sub_Authority.aspx">Create Sub Authority</a></li>

            </ul>
            <h4>Page Link</h4>
            <ul>
                <li><a href="Link/Category.aspx">Category</a></li>
                <li><a href="Link/Sub_Category_Links.aspx">Sub Category Links</a></li>

                <li><a href="Access_Manage/Admin_Access_Manage.aspx">Admin Access Manage</a></li>
                <li><a href="Access_Manage/Role_Access_Manage.aspx">Role Access Manage</a></li>
            </ul>
             <h4>Marketing Report</h4>
            <ul>
                <li><a href="AddMarketingReport.aspx">Add Marketing Reports</a></li>
                <li><a href="See_Marketing_Report.aspx"> Search Marketing Report</a></li>
            </ul>
        </div>

        <input type="button" value="Change Your Password" class="PassWordChange" id="Click" />
        <div class="ChangePassword" id="Show">
            <asp:UpdatePanel ID="UpdatePanel1" runat="server">
                <ContentTemplate>
                    <asp:ChangePassword ID="ChangePassword1" runat="server" ChangePasswordFailureText="Password incorrect or New Password invalid.">
                        <ChangePasswordTemplate>
                            <table style="border-collapse: collapse;">
                                <tr>
                                    <td>
                                        <table>
                                            <tr>
                                                <td>
                                                    <asp:Label ID="CurrentPasswordLabel" runat="server" AssociatedControlID="CurrentPassword">Old Password:</asp:Label>
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
                                                    <asp:Label ID="NewPasswordLabel" runat="server" AssociatedControlID="NewPassword">New Password:</asp:Label>
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
                                                    <asp:Label ID="ConfirmNewPasswordLabel" runat="server" AssociatedControlID="ConfirmNewPassword">Confirm New Password:</asp:Label>
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
                                                    <asp:CompareValidator ID="NewPasswordCompare" runat="server" ControlToCompare="NewPassword" ControlToValidate="ConfirmNewPassword" CssClass="EroorSummer" Display="Dynamic" ErrorMessage="The Confirm New Password must match the New Password entry." ValidationGroup="ChangePassword1"></asp:CompareValidator>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center" style="color: Red;">
                                                    <asp:Literal ID="FailureText" runat="server" EnableViewState="False"></asp:Literal>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <asp:Button ID="ChangePasswordPushButton" runat="server" CommandName="ChangePassword" CssClass="ContinueButton" Text="Change" ValidationGroup="ChangePassword1" />
                                                    <asp:Button ID="CancelPushButton" runat="server" CausesValidation="False" CommandName="Cancel" CssClass="ContinueButton" Text="Cancel" />
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </ChangePasswordTemplate>
                        <SuccessTemplate>
                            <table cellpadding="1" cellspacing="0" style="border-collapse: collapse;">
                                <tr>
                                    <td>
                                        <table cellpadding="0">
                                            <tr>
                                                <td align="center" colspan="2">Change Password Complete</td>
                                            </tr>
                                            <tr>
                                                <td>Your password has been changed!</td>
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
                </ContentTemplate>
            </asp:UpdatePanel>


        </div>

    </div>
</asp:Content>
