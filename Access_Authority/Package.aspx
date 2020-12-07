<%@ Page Title="" Language="C#" MasterPageFile="~/Design.Master" AutoEventWireup="true" CodeBehind="Package.aspx.cs" Inherits="TailorBD.AccessAdmin.Package" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <h3>Create Packages</h3>
    <table>
        <tr>
            <td>Package Name</td>
            <td>
                <asp:TextBox ID="PackageNameTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
                <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="PackageNameTextBox" CssClass="EroorStar" ErrorMessage="*" ValidationGroup="1"></asp:RequiredFieldValidator>
            </td>
        </tr>
        <tr>
            <td>Details</td>
            <td>
                <asp:TextBox ID="DetailsTextBox" runat="server" CssClass="Textbox" TextMode="MultiLine"></asp:TextBox>
                <asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="DetailsTextBox" CssClass="EroorStar" ErrorMessage="*" ValidationGroup="1"></asp:RequiredFieldValidator>
            </td>
        </tr>
        <tr>
            <td>Interval</td>
            <td>
                <asp:TextBox ID="IntervalTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
                <asp:RequiredFieldValidator ID="RequiredFieldValidator3" runat="server" ControlToValidate="IntervalTextBox" CssClass="EroorStar" ErrorMessage="*" ValidationGroup="1"></asp:RequiredFieldValidator>
            </td>
        </tr>
        <tr>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
        </tr>
        <tr>
            <td>&nbsp;</td>
            <td>
                <asp:Button ID="AddButton" runat="server" CssClass="ContinueButton" Text="Add Package" OnClick="AddButton_Click" ValidationGroup="1" />

            </td>
        </tr>
        <tr>
            <td colspan="2">&nbsp;</td>
            </tr>
        <tr>
            <td colspan="2">
                <asp:SqlDataSource ID="PackageSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" DeleteCommand="DELETE FROM [Package] WHERE [PackageID] = @PackageID" InsertCommand="INSERT INTO [Package] ([PackageName], [Details], [Interval]) VALUES (@PackageName, @Details, @Interval)" SelectCommand="SELECT * FROM [Package]" UpdateCommand="UPDATE [Package] SET [PackageName] = @PackageName, [Details] = @Details, [Interval] = @Interval WHERE [PackageID] = @PackageID">
                    <DeleteParameters>
                        <asp:Parameter Name="PackageID" Type="Int32" />
                    </DeleteParameters>
                    <InsertParameters>
                        <asp:ControlParameter ControlID="PackageNameTextBox" Name="PackageName" PropertyName="Text" Type="String" />
                        <asp:ControlParameter ControlID="DetailsTextBox" Name="Details" PropertyName="Text" Type="String" />
                        <asp:ControlParameter ControlID="IntervalTextBox" Name="Interval" PropertyName="Text" Type="String" />
                    </InsertParameters>
                    <UpdateParameters>
                        <asp:Parameter Name="PackageName" Type="String" />
                        <asp:Parameter Name="Details" Type="String" />
                        <asp:Parameter Name="Interval" Type="String" />
                        <asp:Parameter Name="PackageID" Type="Int32" />
                    </UpdateParameters>
                </asp:SqlDataSource>
                <asp:GridView ID="GridView1" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="PackageID" DataSourceID="PackageSQL">
                    <Columns>
                        <asp:CommandField ShowDeleteButton="True" ShowEditButton="True" />
                        <asp:BoundField DataField="PackageName" HeaderText="Package Name" SortExpression="PackageName" />
                        <asp:BoundField DataField="Interval" HeaderText="Interval" SortExpression="Interval" />
                        <asp:BoundField DataField="Details" HeaderText="Details" SortExpression="Details" />
                    </Columns>
                </asp:GridView>
            </td>
        </tr>
        <tr>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
        </tr>
    </table>

</asp:Content>
