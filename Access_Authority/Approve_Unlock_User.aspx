<%@ Page Title="" Language="C#" MasterPageFile="~/Design.Master" AutoEventWireup="true" CodeBehind="Approve_Unlock_User.aspx.cs" Inherits="TailorBD.AccessAdmin.Approve_Unlock_User" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
<style type="text/css">
    .Contain {
        height:auto;
    }
    .Contain a{
        text-decoration:none;
    }
</style>
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
<div class="Contain">
    <p>
        <asp:HyperLink ID="BackLink" runat="server"
            NavigateUrl="Manage_Users.aspx">&lt;&lt; Back to User List</asp:HyperLink>
    </p>
    <table>
        <tr>
            <td class="tdLabel">Username:</td>
            <td>
                <asp:Label runat="server" ID="UserNameLabel"></asp:Label></td>
        </tr>
        <tr>
            <td class="tdLabel">Approved:</td>
            <td>
                <asp:CheckBox ID="IsApproved" Text=" " runat="server" AutoPostBack="true"
                    OnCheckedChanged="IsApproved_CheckedChanged" />
            </td>
        </tr>
        <tr>
            <td class="tdLabel">Locked Out:</td>
            <td>
                <asp:Label runat="server" ID="LastLockoutDateLabel"></asp:Label>
                <br />
                <asp:Button runat="server" ID="UnlockUserButton" Text="Unlock User"
                    OnClick="UnlockUserButton_Click" />
            </td>
        </tr>
    </table>
    <p>
        <asp:Label ID="StatusMessage" CssClass="Important" runat="server"></asp:Label>
    </p>
</div>
</asp:Content>
