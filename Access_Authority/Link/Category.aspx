<%@ Page Title="" Language="C#" MasterPageFile="~/Design.Master" AutoEventWireup="true" CodeBehind="Category.aspx.cs" Inherits="TailorBD.AccessAdmin.Page_Link.Category" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
  
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <h3>Insert/Edit/Delete Link category</h3>
    <table>
        <tr>
            <td>Ascending</td>
            <td>Category<asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="CategoryTextBox" CssClass="EroorStar" ErrorMessage="*" ValidationGroup="1"></asp:RequiredFieldValidator>
            </td>
        </tr>
        <tr>
            <td>
                <asp:TextBox ID="AscendingTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
            </td>
            <td>
                <asp:TextBox ID="CategoryTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
            </td>
        </tr>
        <tr>
            <td>
                &nbsp;</td>
            <td>
                &nbsp;</td>
        </tr>
        <tr>
            <td>
                <asp:Button ID="SubmitButton" runat="server" Text="Submit" OnClick="SubmitButton_Click" CssClass="ContinueButton" ValidationGroup="1" />
            </td>
            <td>
                &nbsp;</td>
        </tr>
        <tr>
            <td>
                &nbsp;</td>
            <td>
                &nbsp;</td>
        </tr>
    </table>
    <asp:GridView ID="CategoryGridView" runat="server" AutoGenerateColumns="False" DataKeyNames="LinkCategoryID" DataSourceID="CategorySQL" CssClass="mGrid">
        <Columns>
            <asp:CommandField ShowDeleteButton="True" ShowEditButton="True" />
            <asp:BoundField DataField="Ascending" HeaderText="Ascending" SortExpression="Ascending" />
            <asp:BoundField DataField="Category" HeaderText="Category" SortExpression="Category" />
            <asp:HyperLinkField DataNavigateUrlFields="LinkCategoryID" DataNavigateUrlFormatString="Sub_Category.aspx?Category={0}"  DataTextField="Category" HeaderText="Select Category to Set URL"/>
        </Columns>
    </asp:GridView>
    <asp:SqlDataSource ID="CategorySQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" DeleteCommand="DELETE FROM [Link_Category] WHERE [LinkCategoryID] = @LinkCategoryID" InsertCommand="INSERT INTO [Link_Category] ([Ascending], [Category]) VALUES (@Ascending, @Category)" SelectCommand="SELECT LinkCategoryID, Category, Ascending FROM Link_Category ORDER BY Ascending" UpdateCommand="UPDATE [Link_Category] SET [Ascending] = @Ascending, [Category] = @Category WHERE [LinkCategoryID] = @LinkCategoryID">
        <DeleteParameters>
            <asp:Parameter Name="LinkCategoryID" Type="Int32" />
        </DeleteParameters>
        <InsertParameters>
            <asp:ControlParameter ControlID="AscendingTextBox" Name="Ascending" PropertyName="Text" Type="Int32" />
            <asp:ControlParameter ControlID="CategoryTextBox" Name="Category" PropertyName="Text" Type="String" />
        </InsertParameters>
        <UpdateParameters>
            <asp:Parameter Name="Ascending" Type="Int32" />
            <asp:Parameter Name="Category" Type="String" />
            <asp:Parameter Name="LinkCategoryID" Type="Int32" />
        </UpdateParameters>
    </asp:SqlDataSource>



</asp:Content>
