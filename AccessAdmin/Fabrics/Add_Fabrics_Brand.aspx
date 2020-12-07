<%@ Page Title="কাপড়ের ব্র্যান্ড যুক্ত করুন" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Add_Fabrics_Brand.aspx.cs" Inherits="TailorBD.AccessAdmin.Fabrics.Add_Fabrics_Brand" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <h3>কাপড়ের ব্র্যান্ড যুক্ত করুন</h3>
   <table>
      <tr>
         <td colspan="2">কাপড়ের ব্র্যান্ডের নাম
            <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="Fabrics_BrandTextBox" CssClass="EroorSummer" ErrorMessage="Enter Brand Name" ValidationGroup="1"></asp:RequiredFieldValidator>
         </td>
      </tr>
      <tr>
         <td>
            <asp:TextBox ID="Fabrics_BrandTextBox" runat="server" CssClass="textbox" Width="200px"></asp:TextBox>
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
   <asp:GridView ID="Fabrics_BrandGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="FabricsBrandID" DataSourceID="Fabrics_BrandSQL">
      <Columns>
         <asp:BoundField DataField="FabricsBrandName" HeaderText="কাপড়ের ব্র্যান্ডের নাম" SortExpression="FabricsBrandName" />
         <asp:CommandField ShowEditButton="True" />
         <asp:TemplateField ShowHeader="False">
            <ItemTemplate>
               <asp:LinkButton ID="LinkButton1" runat="server" CausesValidation="False" OnClientClick="return confirm('Are You Sure Want To Delete?')" CommandName="Delete" Text="Delete"></asp:LinkButton>
            </ItemTemplate>
         </asp:TemplateField>
      </Columns>
   </asp:GridView>
   <asp:SqlDataSource ID="Fabrics_BrandSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" DeleteCommand="DELETE FROM [Fabrics_Brand] WHERE [FabricsBrandID] = @FabricsBrandID" InsertCommand="IF NOT EXISTS (SELECT * FROM [Fabrics_Brand] WHERE FabricsBrandName = @FabricsBrandName AND InstitutionID = @InstitutionID)
INSERT INTO [Fabrics_Brand] ([InstitutionID], [RegistrationID], [FabricsBrandName]) VALUES (@InstitutionID, @RegistrationID, @FabricsBrandName)
ELSE
SET @ERROR = @FabricsBrandName + ' Already Exists'" SelectCommand="SELECT * FROM [Fabrics_Brand] WHERE ([InstitutionID] = @InstitutionID)" UpdateCommand="UPDATE [Fabrics_Brand] SET [FabricsBrandName] = @FabricsBrandName WHERE [FabricsBrandID] = @FabricsBrandID" OnInserted="Fabrics_BrandSQL_Inserted">
      <DeleteParameters>
         <asp:Parameter Name="FabricsBrandID" Type="Int32" />
      </DeleteParameters>
      <InsertParameters>
         <asp:ControlParameter ControlID="Fabrics_BrandTextBox" Name="FabricsBrandName" PropertyName="Text" Type="String" />
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
         <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
         <asp:Parameter Name="ERROR" Size="128" Direction="Output"/>
      </InsertParameters>
      <SelectParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
      </SelectParameters>
      <UpdateParameters>
         <asp:Parameter Name="FabricsBrandName" Type="String" />
         <asp:Parameter Name="FabricsBrandID" Type="Int32" />
      </UpdateParameters>
   </asp:SqlDataSource>
</asp:Content>
