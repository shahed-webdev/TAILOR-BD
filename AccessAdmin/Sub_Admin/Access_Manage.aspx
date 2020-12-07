<%@ Page Title="সাব-অ্যাডমিন এর প্রবেশাধিকার" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Access_Manage.aspx.cs" Inherits="TailorBD.AccessAdmin.Sub_Admin.Access_Manage" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <style>
      .mGrid { text-align: left; width: 80%; }
      .mGrid th { text-align: left; padding: 4px; }
   </style>

</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <h3>	সাব-অ্যাডমিন এর প্রবেশাধিকার নিয়ন্ত্রণ করুন</h3>

   <table>
      <tr>
         <td></td>
      </tr>
      <tr>
         <td>
            <asp:DropDownList ID="UserListDropDownList" runat="server" DataSourceID="UserListSQL" DataTextField="Name" DataValueField="UserName" AppendDataBoundItems="True" AutoPostBack="True" CssClass="dropdown" OnSelectedIndexChanged="UserListDropDownList_SelectedIndexChanged" Width="300px">
               <asp:ListItem Value="0">[ সাব-অ্যাডমিন নির্বাচন করুন ]</asp:ListItem>
            </asp:DropDownList>

            <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="UserListDropDownList" CssClass="EroorSummer" ErrorMessage="Select Sub-Admin" InitialValue="0" ValidationGroup="A"></asp:RequiredFieldValidator>
            <asp:SqlDataSource ID="UserListSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT ISNULL(Name + ' (' + UserName + ')', UserName) AS Name, UserName FROM Registration WHERE (Category = @Category) AND (Validation = @Validation) AND (InstitutionID = @InstitutionID) AND (RegistrationID &lt;&gt; @RegistrationID)">
               <SelectParameters>
                  <asp:Parameter DefaultValue="Sub-Admin" Name="Category" />
                  <asp:Parameter DefaultValue="Valid" Name="Validation" />
                  <asp:CookieParameter CookieName="InstitutionID" DefaultValue="" Name="InstitutionID" />
                  <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" />
               </SelectParameters>
            </asp:SqlDataSource>
         </td>
      </tr>
      <tr>
         <td>&nbsp;</td>
      </tr>
   </table>
   আরো পেজ যোগ করুন অথবা সাব-অ্যাডমিন থেকে এক্সেস পেজ মুছে ফেলুন
   <asp:GridView runat="server" AutoGenerateColumns="False" DataKeyNames="LinkID,Location" DataSourceID="LinkPageSQL" ID="LinkGridView" OnDataBound="LinkGridView_DataBound"
      PagerStyle-CssClass="pgr" CssClass="mGrid">
      <AlternatingRowStyle CssClass="alt" />
      <Columns>
         <asp:BoundField DataField="Category" HeaderText="ক্যাটাগরি লিংক" SortExpression="Category"></asp:BoundField>
         <asp:BoundField DataField="SubCategory" HeaderText="সাব ক্যাটাগরি লিংক" SortExpression="SubCategory"></asp:BoundField>
         <asp:TemplateField>
            <HeaderTemplate>
               <asp:CheckBox ID="AllCheckBox" runat="server" Text="পৃষ্ঠার শিরোনাম (এক্সেস এর জন্য পেজ নির্বাচন করুন)" />
            </HeaderTemplate>
            <ItemTemplate>
               <asp:CheckBox ID="LinkCheckBox" runat="server" Text='<%#Bind("PageTitle") %>' />
            </ItemTemplate>
            <HeaderStyle HorizontalAlign="Left" />
         </asp:TemplateField>
      </Columns>

      <PagerStyle CssClass="pgr"></PagerStyle>
   </asp:GridView>

   <asp:SqlDataSource runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Link_Pages.LinkID, Link_Pages.LinkCategoryID, Link_Pages.SubCategoryID, Link_Pages.PageURL, Link_Pages.PageTitle, Link_Pages.Location, Link_SubCategory.SubCategory, Link_Category.Category FROM Link_Pages INNER JOIN Link_Users ON Link_Pages.LinkID = Link_Users.LinkID LEFT OUTER JOIN Link_SubCategory ON Link_Pages.SubCategoryID = Link_SubCategory.SubCategoryID LEFT OUTER JOIN Link_Category ON Link_Pages.LinkCategoryID = Link_Category.LinkCategoryID WHERE (Link_Users.InstitutionID = @InstitutionID) AND (Link_Users.RegistrationID = @RegistrationID) ORDER BY Link_Category.Ascending, Link_SubCategory.Ascending" ID="LinkPageSQL">
      <SelectParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
         <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" />
      </SelectParameters>
   </asp:SqlDataSource>

   <br />

   <asp:Button ID="UpdateButton" runat="server" CssClass="ContinueButton" OnClick="UpdateButton_Click" Text="Update" ValidationGroup="A" />
   <asp:ValidationSummary ID="ValidationSummary1" runat="server" ShowMessageBox="True" ValidationGroup="A" CssClass="EroorSummer" DisplayMode="List" />
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
   <script>
      $("[id*=AllCheckBox]").live("click", function () {
         var a = $(this), b = $(this).closest("table");
         $("input[type=checkbox]", b).each(function () {
            a.is(":checked") ? ($(this).attr("checked", "checked"), $("td", $(this).closest("tr")).addClass("selected")) : ($(this).removeAttr("checked"), $("td", $(this).closest("tr")).removeClass("selected"));
         });
      });

      $("[id*=LinkCheckBox]").live("click", function () {
         var a = $(this).closest("table"), b = $("[id*=chkHeader]", a);
         $(this).is(":checked") ? ($("td", $(this).closest("tr")).addClass("selected"), $("[id*=chkRow]", a).length == $("[id*=chkRow]:checked", a).length && b.attr("checked", "checked")) : ($("td", $(this).closest("tr")).removeClass("selected"), b.removeAttr("checked"));
      });
   </script>
</asp:Content>
