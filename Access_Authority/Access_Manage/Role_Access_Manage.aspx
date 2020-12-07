<%@ Page Title="" Language="C#" MasterPageFile="~/Design.Master" AutoEventWireup="true" CodeBehind="Role_Access_Manage.aspx.cs" Inherits="TailorBD.Access_Authority.Access_Manage.Role_Access_Manage" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <style>
        .mGrid {
            text-align: left;
            width: 80%;
        }
           .mGrid th {
               text-align: left;
               padding: 4px;
           }
    </style>
<script>
    $("[id*=AllCheckBox]").live("click", function () {
        var chkHeader = $(this);
        var grid = $(this).closest("table");
        $("input[type=checkbox]", grid).each(function () {
            if (chkHeader.is(":checked")) {
                $(this).attr("checked", "checked");
                $("td", $(this).closest("tr")).addClass("selected");
            } else {
                $(this).removeAttr("checked");
                $("td", $(this).closest("tr")).removeClass("selected");
            }
        });
    });

    //---------for Color change-----------------------------
    $("[id*=LinkCheckBox]").live("click", function () {
        var grid = $(this).closest("table");
        var chkHeader = $("[id*=chkHeader]", grid);
        if (!$(this).is(":checked")) {
            $("td", $(this).closest("tr")).removeClass("selected");
            chkHeader.removeAttr("checked");
        } else {
            $("td", $(this).closest("tr")).addClass("selected");
            if ($("[id*=chkRow]", grid).length == $("[id*=chkRow]:checked", grid).length) {
                chkHeader.attr("checked", "checked");
            }
        }
    });
</script>
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <h3>Manage Role</h3>
   
    <table>
        <tr>
            <td></td>
        </tr>
        <tr>
            <td>
                <asp:DropDownList ID="RoleListDropDownList" runat="server" CssClass="dropdown" Width="300px" AppendDataBoundItems="True" AutoPostBack="True" OnSelectedIndexChanged="RoleListDropDownList_SelectedIndexChanged">
                    <asp:ListItem Value="0">[ Select Role ]</asp:ListItem>
                </asp:DropDownList>

            </td>
        </tr>
        <tr>
            <td>&nbsp;</td>
        </tr>
    </table>


    <asp:GridView runat="server" AutoGenerateColumns="False" DataKeyNames="LinkID,Location" DataSourceID="LinkPageSQL" ID="LinkGridView" OnDataBound="LinkGridView_DataBound" 
        PagerStyle-CssClass="pgr" CssClass="mGrid">
         <AlternatingRowStyle CssClass="alt" />
        <Columns>
            <asp:BoundField DataField="Category" HeaderText="Category" SortExpression="Category"></asp:BoundField>
            <asp:BoundField DataField="SubCategory" HeaderText="Sub Category" SortExpression="SubCategory"></asp:BoundField>
            <asp:TemplateField>
                  <HeaderTemplate>
                    <asp:CheckBox ID="AllCheckBox" runat="server" Text="Page Title (Allow Selected Pages)" />
                </HeaderTemplate>
                <ItemTemplate>
                    <asp:CheckBox ID="LinkCheckBox" runat="server" Text='<%#Bind("PageTitle") %>' />
                </ItemTemplate>
            </asp:TemplateField>
        </Columns>

<PagerStyle CssClass="pgr"></PagerStyle>
    </asp:GridView>

    <asp:SqlDataSource runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Link_Pages.LinkID, Link_Pages.LinkCategoryID, Link_Pages.SubCategoryID, Link_Pages.PageURL, Link_Pages.PageTitle, Link_Pages.Location, Link_SubCategory.SubCategory, Link_Category.Category FROM Link_Pages LEFT OUTER JOIN Link_SubCategory ON Link_Pages.SubCategoryID = Link_SubCategory.SubCategoryID LEFT OUTER JOIN Link_Category ON Link_Pages.LinkCategoryID = Link_Category.LinkCategoryID ORDER BY Link_Category.Ascending, Link_SubCategory.Ascending" ID="LinkPageSQL"></asp:SqlDataSource>


    <br />


    <asp:Button ID="UpdateButton" runat="server" CssClass="ContinueButton" OnClick="UpdateButton_Click" Text="Update" ValidationGroup="A"/>
    <asp:ValidationSummary ID="ValidationSummary1" runat="server" ShowMessageBox="True" ValidationGroup="A" />
    <asp:SqlDataSource ID="UpdateLinkSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
     DeleteCommand="DELETE FROM Link_Users WHERE (LinkID = @LinkID) AND (UserName = @UserName)" InsertCommand="IF NOT EXISTS (SELECT * FROM  [Link_Users] WHERE  LinkID=@LinkID and UserName=@UserName)
     INSERT INTO [Link_Users] ([InstitutionID], [RegistrationID], [LinkID], [UserName]) VALUES ((Select InstitutionID From Registration where  RegistrationID=@RegistrationID), @RegistrationID, @LinkID, @UserName)"
     SelectCommand="SELECT * FROM [Link_Users]">
        <DeleteParameters>
            <asp:Parameter Name="LinkID" />
            <asp:ControlParameter ControlID="UserListDropDownList" Name="UserName" PropertyName="SelectedValue" />
        </DeleteParameters>
        <InsertParameters>
            <asp:Parameter Name="LinkID" Type="Int32" />
            <asp:ControlParameter ControlID="UserListDropDownList" Name="UserName" PropertyName="SelectedValue" Type="String" />
            <asp:Parameter Name="RegistrationID" Type="Int32" />
        </InsertParameters>
    </asp:SqlDataSource>

</asp:Content>
