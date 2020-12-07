<%@ Page Title="" Language="C#" MasterPageFile="~/Design.Master" AutoEventWireup="true" CodeBehind="Login.aspx.cs" Inherits="TailorBD.Login" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
    <link href="CSS/Login.css" rel="stylesheet" />

</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <div class="Login_Mid">
        <asp:Login ID="CustomerLogin" runat="server" OnLoggedIn="CustomerLogin_LoggedIn" OnLoginError="CustomerLogin_LoginError" DestinationPageUrl="~/Profile_Redirect.aspx" FailureText="Your login attempt was not successful.">
            <LayoutTemplate>
                <span style="color: red;">
                    <asp:Literal ID="FailureText" runat="server" EnableViewState="False"></asp:Literal></span>
                <div class="Login_Area">
                    <table>
                        <tr>
                            <td class="Login_Label">User name
                                <asp:RequiredFieldValidator ID="UserNameRequired" runat="server" ControlToValidate="UserName" ErrorMessage="required." ForeColor="Red" ToolTip="User Name is required." ValidationGroup="Login1"></asp:RequiredFieldValidator>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <asp:TextBox ID="UserName" runat="server" CssClass="LoginTextBox"></asp:TextBox>
                            </td>
                        </tr>
                        <tr>
                            <td class="Login_Label">Password
                            <asp:RequiredFieldValidator ID="PasswordRequired" runat="server" ControlToValidate="Password" ErrorMessage="required." ForeColor="Red" ToolTip="Password is required." ValidationGroup="Login1"></asp:RequiredFieldValidator>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <asp:TextBox ID="Password" runat="server" CssClass="LoginTextBox" TextMode="Password"></asp:TextBox>
                            </td>
                        </tr>
                        <tr>
                            <td>&nbsp;</td>
                        </tr>
                        <tr>
                            <td style="text-align: right">
                                <asp:Button ID="LoginButton" runat="server" CommandName="Login" CssClass="Login_Button" Text="Log In" ValidationGroup="Login1" />
                            </td>
                        </tr>
                    </table>
                </div>
            </LayoutTemplate>
        </asp:Login>
        <asp:Label ID="InvalidErrorLabel" runat="server" CssClass="EroorText"></asp:Label>

    </div>
</asp:Content>
