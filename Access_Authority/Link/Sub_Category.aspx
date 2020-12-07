<%@ Page Title="" Language="C#" MasterPageFile="~/Design.Master" AutoEventWireup="true" CodeBehind="Sub_Category.aspx.cs" Inherits="TailorBD.AccessAdmin.Page_Link.Sub_Category" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <table>
        <tr>
            <td colspan="2">
                <asp:DataList ID="CatagoryDataList" runat="server" DataSourceID="CatagoryNameSQL">
                    <ItemTemplate>
                        <h3>Create Sub Category For:
                      
                        <asp:Label ID="CategoryLabel" runat="server" Text='<%# Eval("Category") %>' />
                        </h3>

                    </ItemTemplate>
                </asp:DataList>
                <asp:SqlDataSource ID="CatagoryNameSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT [Category] FROM [Link_Category] WHERE ([LinkCategoryID] = @LinkCategoryID)">
                    <SelectParameters>
                        <asp:QueryStringParameter Name="LinkCategoryID" QueryStringField="Category" Type="Int32" />
                    </SelectParameters>
                </asp:SqlDataSource>
            </td>
        </tr>
        <tr>
            <td>Ascending</td>
            <td>Sub-Category<asp:RequiredFieldValidator ID="RequiredFieldValidator5" runat="server" ControlToValidate="SubCategoryTextBox" CssClass="EroorStar" ErrorMessage="*" ValidationGroup="2"></asp:RequiredFieldValidator>
            </td>
        </tr>
        <tr>
            <td>
                <asp:TextBox ID="AscendingTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
            </td>
            <td>
                <asp:TextBox ID="SubCategoryTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
            </td>
        </tr>
        <tr>
            <td>&nbsp;</td>
            <td style="text-align: right">
                <asp:Button ID="SubmitButton" runat="server" Text="Submit" OnClick="SubmitButton_Click" CssClass="ContinueButton" ValidationGroup="2" />
                <br />
                <a href="Category.aspx">Back to Category</a>
            </td>
        </tr>
    </table>
    <asp:GridView ID="SubCategoryGridView" runat="server" AutoGenerateColumns="False" DataKeyNames="LinkCategoryID,SubCategoryID" DataSourceID="SubCategorySQL" CssClass="mGrid">
        <Columns>
            <asp:CommandField ShowEditButton="True" />
            <asp:CommandField ShowDeleteButton="True" />
            <asp:BoundField DataField="Ascending" HeaderText="Ascending" SortExpression="Ascending" />
            <asp:BoundField DataField="SubCategory" HeaderText="Sub Category" SortExpression="SubCategory" />
            <asp:HyperLinkField DataNavigateUrlFields="LinkCategoryID,SubCategoryID"
                DataNavigateUrlFormatString="Sub_Category_Links.aspx?Category={0}&Sub_Category={1}" DataTextField="SubCategory" HeaderText="Select Sub-Category to Set URL" />
        </Columns>
        <EmptyDataTemplate>
            No Sub-Category Created
        </EmptyDataTemplate>
    </asp:GridView>
    <asp:SqlDataSource ID="SubCategorySQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" DeleteCommand="DELETE FROM [Link_SubCategory] WHERE [SubCategoryID] = @SubCategoryID" InsertCommand="INSERT INTO [Link_SubCategory] ([LinkCategoryID], [Ascending], [SubCategory]) VALUES (@LinkCategoryID, @Ascending, @SubCategory)" SelectCommand="SELECT SubCategoryID, LinkCategoryID, Ascending, SubCategory FROM Link_SubCategory WHERE (LinkCategoryID = @LinkCategoryID) ORDER BY Ascending" UpdateCommand="UPDATE [Link_SubCategory] SET [LinkCategoryID] = @LinkCategoryID, [Ascending] = @Ascending, [SubCategory] = @SubCategory WHERE [SubCategoryID] = @SubCategoryID">
        <DeleteParameters>
            <asp:Parameter Name="SubCategoryID" Type="Int32" />
        </DeleteParameters>
        <InsertParameters>
            <asp:QueryStringParameter Name="LinkCategoryID" QueryStringField="Category" Type="Int32" />
            <asp:ControlParameter ControlID="AscendingTextBox" Name="Ascending" PropertyName="Text" Type="Int32" />
            <asp:ControlParameter ControlID="SubCategoryTextBox" Name="SubCategory" PropertyName="Text" Type="String" />
        </InsertParameters>
        <SelectParameters>
            <asp:QueryStringParameter Name="LinkCategoryID" QueryStringField="Category" />
        </SelectParameters>
        <UpdateParameters>
            <asp:Parameter Name="LinkCategoryID" Type="Int32" />
            <asp:Parameter Name="Ascending" Type="Int32" />
            <asp:Parameter Name="SubCategory" Type="String" />
            <asp:Parameter Name="SubCategoryID" Type="Int32" />
        </UpdateParameters>
    </asp:SqlDataSource>

    <br />
    <br />
    <br />

    <h3>Insert URL Under Category:</h3>
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
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td style="text-align: right">
                <asp:Button ID="UrlButton" runat="server" OnClick="UrlButton_Click" Text="Submit" ValidationGroup="1" CssClass="ContinueButton" Height="22px" />
            </td>
        </tr>
        <tr>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
        </tr>
    </table>
    <asp:GridView ID="InsertedLinkGridView" runat="server" AutoGenerateColumns="False" DataKeyNames="LinkID" DataSourceID="Link_PagesSQL" Width="100%" OnRowUpdating="InsertedLinkGridView_RowUpdating" CssClass="mGrid">
        <Columns>
            <asp:CommandField ShowDeleteButton="True" ShowEditButton="True" />
            <asp:BoundField DataField="Ascending" HeaderText="Ascending" SortExpression="Ascending" />
            <asp:BoundField DataField="PageURL" HeaderText="Page URL" SortExpression="PageURL" />
            <asp:BoundField DataField="PageTitle" HeaderText="Page Title" SortExpression="PageTitle" />
            <asp:BoundField DataField="Location" HeaderText="Location" SortExpression="Location" />
            <asp:TemplateField HeaderText="Category" SortExpression="Category">
                <EditItemTemplate>
                    <asp:DropDownList ID="CategotyDropDownList" runat="server" AutoPostBack="True" DataSourceID="CategorySQL" DataTextField="Category"
                        SelectedValue='<%#Bind("LinkCategoryID") %>' DataValueField="LinkCategoryID">
                    </asp:DropDownList>
                    <asp:DropDownList ID="SubCategoryDropDownList" runat="server" DataSourceID="SubCategorySQL" DataTextField="SubCategory"
                        DataValueField="SubCategoryID" OnDataBound="SubCategoryDropDownList_DataBound">
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
                </ItemTemplate>
            </asp:TemplateField>
        </Columns>
    </asp:GridView>
    <asp:SqlDataSource ID="Link_PagesSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
        DeleteCommand="DELETE FROM [Link_Pages] WHERE [LinkID] = @LinkID
DELETE FROM Link_Users WHERE (LinkID = @LinkID)"
        InsertCommand="INSERT INTO Link_Pages(LinkCategoryID, Ascending, PageURL, PageTitle, Location) VALUES (@LinkCategoryID, @Ascending, @PageURL, @PageTitle, @Location)"
        SelectCommand="SELECT Link_Pages.LinkID, Link_Pages.LinkCategoryID, Link_Pages.Ascending, Link_Pages.PageURL, Link_Pages.PageTitle, Link_Pages.Location, Link_Category.Category, Link_Pages.SubCategoryID FROM Link_Pages LEFT OUTER JOIN Link_Category ON Link_Pages.LinkCategoryID = Link_Category.LinkCategoryID WHERE (Link_Pages.LinkCategoryID = @LinkCategoryID) AND (Link_Pages.SubCategoryID IS NULL) ORDER BY Link_Pages.Ascending"
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
        </InsertParameters>
        <SelectParameters>
            <asp:QueryStringParameter Name="LinkCategoryID" QueryStringField="Category" />
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
     <br />
    <br />
</asp:Content>
