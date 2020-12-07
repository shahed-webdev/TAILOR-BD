<%@ Page Title="কাপড়ের ক্যাটাগরী যুক্ত করুন" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Add_Fabrics_Category.aspx.cs" Inherits="TailorBD.AccessAdmin.Fabrics.Add_Fabrics_Category" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <h3>কাপড়ের ক্যাটাগরী যুক্ত করুন</h3>
   <table>
      <tr>
         <td colspan="2">কাপড়ের ক্যাটাগরীর নাম
            <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="Fabrics_CategoryTextBox" CssClass="EroorSummer" ErrorMessage="দিন" ValidationGroup="1"></asp:RequiredFieldValidator>
         </td>
      </tr>
      <tr>
         <td>
            <asp:TextBox ID="Fabrics_CategoryTextBox" runat="server" CssClass="textbox" Width="180px"></asp:TextBox>
         </td>
         <td>
            <asp:Button ID="AddButton" runat="server" CssClass="ContinueButton" Text="যুক্ত করুন" OnClick="AddButton_Click" ValidationGroup="1" />
         </td>
      </tr>
      <tr>
         <td>
            <asp:Label ID="ErrorLabel" runat="server" CssClass="EroorSummer"></asp:Label>
         </td>
         <td>
            &nbsp;</td>
      </tr>
   </table>
   <asp:GridView ID="Fabrics_CategoryGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="FabricsCategoryID" DataSourceID="Fabrics_CategorySQL">
      <Columns>
         <asp:BoundField DataField="FabricsCategoryName" HeaderText="কাপড়ের ক্যাটাগরীর নাম" SortExpression="FabricsCategoryName" />
         <asp:CommandField ShowEditButton="True" />
         <asp:TemplateField ShowHeader="False">
            <ItemTemplate>
               <asp:LinkButton ID="LinkButton1" runat="server" CausesValidation="False" OnClientClick="return confirm('Are You Sure Want To Delete?')" CommandName="Delete" Text="Delete"></asp:LinkButton>
            </ItemTemplate>
         </asp:TemplateField>
      </Columns>
   </asp:GridView>

   <asp:SqlDataSource ID="Fabrics_CategorySQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
       DeleteCommand="DELETE FROM [Fabrics_Category] WHERE [FabricsCategoryID] = @FabricsCategoryID" 
      InsertCommand="IF NOT EXISTS (SELECT * FROM [Fabrics_Category] WHERE FabricsCategoryName = @FabricsCategoryName AND InstitutionID = @InstitutionID)
INSERT INTO [Fabrics_Category] ([InstitutionID], [RegistrationID], [FabricsCategoryName]) VALUES (@InstitutionID, @RegistrationID, @FabricsCategoryName)
ELSE
SET @ERROR = @FabricsCategoryName + ' Already Exists'"
       SelectCommand="SELECT * FROM [Fabrics_Category] WHERE ([InstitutionID] = @InstitutionID)" 
      UpdateCommand="UPDATE [Fabrics_Category] SET [FabricsCategoryName] = @FabricsCategoryName WHERE [FabricsCategoryID] = @FabricsCategoryID"
       OnInserted="Fabrics_CategorySQL_Inserted">
      <DeleteParameters>
         <asp:Parameter Name="FabricsCategoryID" Type="Int32" />
      </DeleteParameters>
      <InsertParameters>
         <asp:ControlParameter ControlID="Fabrics_CategoryTextBox" Name="FabricsCategoryName" PropertyName="Text" Type="String" />
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
         <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
         <asp:Parameter Name="ERROR" Size="128" Direction="Output"/>
      </InsertParameters>
      <SelectParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
      </SelectParameters>
      <UpdateParameters>
         <asp:Parameter Name="FabricsCategoryName" Type="String" />
         <asp:Parameter Name="FabricsCategoryID" Type="Int32" />
      </UpdateParameters>
   </asp:SqlDataSource>
</asp:Content>
