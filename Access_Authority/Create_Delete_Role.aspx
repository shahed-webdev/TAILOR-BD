<%@ Page Title="" Language="C#" MasterPageFile="~/Design.Master" AutoEventWireup="true" CodeBehind="Create_Delete_Role.aspx.cs" Inherits="TailorBD.AccessAdmin.Create_Delete_Role" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
    <link href="CSS/Create_Delete_Role.css" rel="stylesheet" />
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <div id="Role">
     <h3>Manage Roles</h3>
 
        <table>
            <tr>
                <td>Create a New Role:
                    <asp:RequiredFieldValidator ID="RoleNameReqField" runat="server" ControlToValidate="RoleName"
                        ErrorMessage="You must enter a role name." CssClass="EroorStar" ValidationGroup="A" />
                </td>
            </tr>
            <tr>
                <td>
                    <asp:TextBox ID="RoleName" runat="server" CssClass="Textbox"></asp:TextBox>
                </td>
            </tr>
            <tr>
                <td>&nbsp;</td>
            </tr>
            <tr>
                <td>


                    <asp:Button ID="CreateRoleButton" runat="server" Text="Create Role" OnClick="CreateRoleButton_Click" CssClass="ContinueButton" ValidationGroup="A" />

                </td>
            </tr>
        </table>
   
        <asp:GridView ID="RoleList" runat="server" AutoGenerateColumns="False" onrowdeleting="RoleList_RowDeleting" Width="600px" CssClass="mGrid">
            <Columns>
                <asp:TemplateField HeaderText="Delete Role" ShowHeader="False">
                    <ItemTemplate>
                        <asp:LinkButton ID="LinkButton1" runat="server" OnClientClick="return confirm('Are you sure you want to delete?')" CausesValidation="False" CommandName="Delete" Text="Delete"></asp:LinkButton>
                    </ItemTemplate>
                </asp:TemplateField>
                <asp:TemplateField HeaderText="Role">
                    <ItemTemplate>
                        <asp:Label runat="server" ID="RoleNameLabel" Text='<%# Container.DataItem %>' />
                    </ItemTemplate>
                </asp:TemplateField>
            </Columns>
        </asp:GridView>
</div>
</asp:Content>
