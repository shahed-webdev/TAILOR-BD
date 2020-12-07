<%@ Page Title="কাপড়ের মাপ যুক্ত করুন" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Add_Mesurement_Unit.aspx.cs" Inherits="TailorBD.AccessAdmin.Fabrics.Add_Mesurement_Unit" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <h3>কাপড়ের মাপ/ইউটের নাম যুক্ত করুন</h3>
   <table>
      <tr>
         <td colspan="2">ইউনিটের নাম
            <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="Mesurement_UnitTextBox" CssClass="EroorSummer" ErrorMessage="Enter Unit Name" ValidationGroup="1"></asp:RequiredFieldValidator>
         </td>
      </tr>
      <tr>
         <td>
            <asp:TextBox ID="Mesurement_UnitTextBox" runat="server" CssClass="textbox"></asp:TextBox>
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
   <asp:GridView ID="Mesurement_UnitGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="FabricMesurementUnitID" DataSourceID="Mesurement_UnitSQL">
      <Columns>
         <asp:BoundField DataField="UnitName" HeaderText="ইউনিটের নাম" SortExpression="UnitName" />
         <asp:CommandField ShowEditButton="True" />
         <asp:TemplateField ShowHeader="False">
            <ItemTemplate>
               <asp:LinkButton ID="LinkButton1" runat="server" CausesValidation="False" OnClientClick="return confirm('Are You Sure Want To Delete?')" CommandName="Delete" Text="Delete"></asp:LinkButton>
            </ItemTemplate>
         </asp:TemplateField>
      </Columns>
   </asp:GridView>
   <asp:SqlDataSource ID="Mesurement_UnitSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" DeleteCommand="DELETE FROM [Fabrics_Mesurement_Unit] WHERE [FabricMesurementUnitID] = @FabricMesurementUnitID" InsertCommand="IF NOT EXISTS (SELECT * FROM [Fabrics_Mesurement_Unit] WHERE UnitName = @UnitName AND InstitutionID = @InstitutionID)
INSERT INTO [Fabrics_Mesurement_Unit] ([InstitutionID], [RegistrationID], [UnitName]) VALUES (@InstitutionID, @RegistrationID, @UnitName)
ELSE
SET @ERROR = @UnitName + ' Already Exists'" SelectCommand="SELECT * FROM [Fabrics_Mesurement_Unit] WHERE ([InstitutionID] = @InstitutionID)" UpdateCommand="UPDATE [Fabrics_Mesurement_Unit] SET [UnitName] = @UnitName WHERE [FabricMesurementUnitID] = @FabricMesurementUnitID" OnInserted="Mesurement_UnitSQL_Inserted">
      <DeleteParameters>
         <asp:Parameter Name="FabricMesurementUnitID" Type="Int32" />
      </DeleteParameters>
      <InsertParameters>
         <asp:ControlParameter ControlID="Mesurement_UnitTextBox" Name="UnitName" PropertyName="Text" Type="String" />
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
         <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
         <asp:Parameter Name="ERROR" Size="128" Direction="Output"/>
      </InsertParameters>
      <SelectParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
      </SelectParameters>
      <UpdateParameters>
         <asp:Parameter Name="UnitName" Type="String" />
         <asp:Parameter Name="FabricMesurementUnitID" Type="Int32" />
      </UpdateParameters>
   </asp:SqlDataSource>
</asp:Content>
