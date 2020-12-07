<%@ Page Title="" Language="C#" MasterPageFile="~/Design.Master" AutoEventWireup="true" CodeBehind="Sub_Category_Links.aspx.cs" Inherits="TailorBD.AccessAdmin.Page_Link.Sub_Category_Links" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <h3>Insert URL Under Category &amp; Sub-Category:</h3>
    <table>
        <tr>
            <td>Ascending</td>
            <td>PageTitle<asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="PageTitleTextBox" CssClass="EroorStar" ErrorMessage="*" ValidationGroup="1"></asp:RequiredFieldValidator>
            </td>
            <td>PageURL<asp:RequiredFieldValidator ID="RequiredFieldValidator4" runat="server" ControlToValidate="PageURLTextBox" CssClass="EroorStar" ErrorMessage="*" ValidationGroup="1"></asp:RequiredFieldValidator>
            </td>
            <td>
                <asp:CheckBox ID="CheckBox" runat="server" AutoPostBack="True" OnCheckedChanged="CheckBox_CheckedChanged" Text="Location Same as URL" />
                <asp:RequiredFieldValidator ID="RequiredFieldValidator3" runat="server" ControlToValidate="LocationTextBox" CssClass="EroorStar" ErrorMessage="*" ValidationGroup="1"></asp:RequiredFieldValidator>
            </td>
        </tr>
        <tr>
            <td>
                <asp:TextBox ID="LinkAsecendingTextBox" runat="server" CssClass="Textbox" Width="50px"></asp:TextBox>
            </td>
            <td>
                <asp:TextBox ID="PageTitleTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
            </td>
            <td>
                <asp:TextBox ID="PageURLTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
            </td>
            <td>
                <asp:TextBox ID="LocationTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
            </td>
        </tr>
        <tr>
            <td>
                &nbsp;</td>
            <td>
                &nbsp;</td>
            <td>
                &nbsp;</td>
            <td style="text-align: right">
                <asp:Button ID="Button1" runat="server" OnClick="SubmitButton_Click" Text="Submit" ValidationGroup="1" CssClass="Submit-Button" Height="22px" />
            </td>
        </tr>
        <tr>
            <td>
                &nbsp;</td>
            <td>
                &nbsp;</td>
            <td>
                &nbsp;</td>
            <td>
                                <br />
                <a href="Sub_Category.aspx?Category=<% =Request.QueryString["Category"] %>">Back to Sub-Category</a></td>
        </tr>
    </table>
    <asp:GridView ID="InsertedLinkGridView" runat="server" AutoGenerateColumns="False" DataKeyNames="LinkID,LinkCategoryID" DataSourceID="Link_PagesSQL" BackColor="White" BorderColor="#CCCCCC" BorderStyle="None" BorderWidth="1px" CellPadding="3" Width="100%" OnRowUpdating="InsertedLinkGridView_RowUpdating">
        <Columns>
            <asp:CommandField ShowDeleteButton="True" ShowEditButton="True" />
            <asp:BoundField DataField="Ascending" HeaderText="Ascending" SortExpression="Ascending" />
            <asp:BoundField DataField="PageTitle" HeaderText="PageTitle" SortExpression="PageTitle" />
            <asp:BoundField DataField="PageURL" HeaderText="PageURL" SortExpression="PageURL" />
            <asp:BoundField DataField="Location" HeaderText="Location" SortExpression="Location" />
            <asp:TemplateField>
                <EditItemTemplate>
                     <asp:DropDownList ID="CategotyDropDownList" runat="server" AutoPostBack="True" DataSourceID="CategorySQL" DataTextField="Category"
                        SelectedValue='<%#Bind("LinkCategoryID") %>' DataValueField="LinkCategoryID">
                    </asp:DropDownList>
                    <asp:DropDownList ID="SubCategoryDropDownList" runat="server" DataSourceID="SubCategorySQL" DataTextField="SubCategory" 
                        SelectedValue='<%#Bind("SubCategoryID") %>' DataValueField="SubCategoryID" OnDataBound="SubCategoryDropDownList_DataBound">
                    </asp:DropDownList>
                    <asp:SqlDataSource ID="SubCategorySQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM [Link_SubCategory] WHERE ([LinkCategoryID] = @LinkCategoryID)">
                        <SelectParameters>
                            <asp:ControlParameter ControlID="CategotyDropDownList" Name="LinkCategoryID" PropertyName="SelectedValue" />
                        </SelectParameters>
                    </asp:SqlDataSource>
                    <asp:SqlDataSource ID="CategorySQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM [Link_Category]"></asp:SqlDataSource>
                </EditItemTemplate>
                <ItemTemplate>
                    <asp:Label ID="Label1" runat="server" Text='<%# Bind("Category") %>'></asp:Label>
                    <asp:Label ID="Label2" runat="server" Text='<%# Bind("SubCategory") %>'></asp:Label>
                </ItemTemplate>
            </asp:TemplateField>
        </Columns>
        <FooterStyle BackColor="White" ForeColor="#000066" />
        <HeaderStyle BackColor="#006699" Font-Bold="True" ForeColor="White" />
        <PagerStyle BackColor="White" ForeColor="#000066" HorizontalAlign="Left" />
        <RowStyle ForeColor="#000066" />
        <SelectedRowStyle BackColor="#669999" Font-Bold="True" ForeColor="White" />
        <SortedAscendingCellStyle BackColor="#F1F1F1" />
        <SortedAscendingHeaderStyle BackColor="#007DBB" />
        <SortedDescendingCellStyle BackColor="#CAC9C9" />
        <SortedDescendingHeaderStyle BackColor="#00547E" />
    </asp:GridView>
    <asp:SqlDataSource ID="Link_PagesSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
        DeleteCommand="DELETE FROM [Link_Pages] WHERE [LinkID] = @LinkID
DELETE FROM Link_Users WHERE (LinkID = @LinkID)"
        InsertCommand="INSERT INTO Link_Pages(LinkCategoryID, Ascending, PageURL, PageTitle, Location, SubCategoryID) VALUES (@LinkCategoryID, @Ascending, @PageURL, @PageTitle, @Location, @SubCategoryID)" 
        SelectCommand="SELECT Link_Pages.LinkID, Link_Pages.LinkCategoryID, Link_Pages.Ascending, Link_Pages.PageURL, Link_Pages.PageTitle, Link_Pages.Location, Link_Category.Category, Link_SubCategory.SubCategory, Link_SubCategory.SubCategoryID FROM Link_Pages INNER JOIN Link_SubCategory ON Link_Pages.SubCategoryID = Link_SubCategory.SubCategoryID LEFT OUTER JOIN Link_Category ON Link_Pages.LinkCategoryID = Link_Category.LinkCategoryID WHERE (Link_Pages.LinkCategoryID = @LinkCategoryID) AND (Link_Pages.SubCategoryID = @SubCategoryID) ORDER BY Link_Pages.Ascending" 
        UpdateCommand="UPDATE Link_Pages SET Ascending = @Ascending, PageURL = @PageURL, PageTitle = @PageTitle, Location = @Location, LinkCategoryID = @LinkCategoryID, SubCategoryID = @SubCategoryID WHERE (LinkID = @LinkID)">
        <DeleteParameters>
            <asp:Parameter Name="LinkID" Type="Int32" />
        </DeleteParameters>
        <InsertParameters>
            <asp:QueryStringParameter Name="LinkCategoryID" QueryStringField="Category" Type="Int32" />
            <asp:ControlParameter ControlID="LinkAsecendingTextBox" Name="Ascending" PropertyName="Text" Type="Int32" />
            <asp:ControlParameter ControlID="PageURLTextBox" Name="PageURL" PropertyName="Text" Type="String" />
            <asp:ControlParameter ControlID="PageTitleTextBox" Name="PageTitle" PropertyName="Text" Type="String" />
            <asp:ControlParameter ControlID="LocationTextBox" Name="Location" PropertyName="Text" Type="String" />
            <asp:QueryStringParameter Name="SubCategoryID" QueryStringField="Sub_Category" />
        </InsertParameters>
        <SelectParameters>
            <asp:QueryStringParameter Name="LinkCategoryID" QueryStringField="Category" />
            <asp:QueryStringParameter Name="SubCategoryID" QueryStringField="Sub_Category" />
        </SelectParameters>
        <UpdateParameters>
            <asp:Parameter Name="Ascending" Type="Int32" />
            <asp:Parameter Name="PageURL" Type="String" />
            <asp:Parameter Name="PageTitle" Type="String" />
            <asp:Parameter Name="Location" Type="String" />
            <asp:Parameter Name="LinkCategoryID" />
            <asp:Parameter Name="SubCategoryID" />
            <asp:Parameter Name="LinkID" Type="Int32" />
        </UpdateParameters>
    </asp:SqlDataSource>
</asp:Content>
