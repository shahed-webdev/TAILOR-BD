<%@ Page Title="পাইকার যুক্ত করুন" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Add_Supplier.aspx.cs" Inherits="TailorBD.AccessAdmin.Fabrics.Add_Supplier" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <h3>সাপ্লায়ার বা পাইকার যুক্ত করুন</h3>
   <table>
      <tr>
         <td>কোম্পানীর নাম</td>
         <td>
            <asp:TextBox ID="CompanyNameTextBox" runat="server" CssClass="textbox" Width="220px"></asp:TextBox>
         </td>
      </tr>
      <tr>
         <td>সাপ্লায়ার নাম</td>
         <td>
            <asp:TextBox ID="SupplierNameTextBox" runat="server" CssClass="textbox" Width="220px"></asp:TextBox>
            <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="SupplierNameTextBox" CssClass="EroorSummer" ErrorMessage="Enter Name" ValidationGroup="S"></asp:RequiredFieldValidator>
         </td>
      </tr>
      <tr>
         <td>মোবাইল <asp:RegularExpressionValidator ID="RegularExpressionValidator1" runat="server" ControlToValidate="SupplierPhoneTextBox" CssClass="EroorSummer" ErrorMessage="সঠিক নয়" ValidationExpression="(88)?((011)|(015)|(016)|(017)|(018)|(019)|(013)|(014))\d{8,8}" ValidationGroup="S"></asp:RegularExpressionValidator>
                    </td>
         <td>
            <asp:TextBox ID="SupplierPhoneTextBox" runat="server"  CssClass="textbox" Width="220px" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false"></asp:TextBox>
         </td>
      </tr>
      <tr>
         <td>ঠিকানা</td>
         <td>
            <asp:TextBox ID="SupplierAddressTextBox" runat="server" CssClass="textbox" Width="220px"></asp:TextBox>
         </td>
      </tr>
      <tr>
         <td>&nbsp;</td>
         <td>&nbsp;</td>
      </tr>
      <tr>
         <td>&nbsp;</td>
         <td>
            <asp:Button ID="SubmitButton" runat="server" CssClass="ContinueButton" OnClick="SubmitButton_Click" Text="যুক্ত করুন" ValidationGroup="S" />
         </td>
      </tr>
   </table>
   <asp:GridView ID="SupplierGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="FabricsSupplierID" DataSourceID="SupplierSQL">
      <Columns>
         <asp:TemplateField>
            <ItemTemplate>
               <asp:LinkButton ID="LinkButton" runat="server" Text="Details" CommandArgument='<%#Eval("FabricsSupplierID") %>' OnCommand="LinkButton_Command"/>
            </ItemTemplate>
         </asp:TemplateField>
         <asp:BoundField DataField="SupplierCompanyName" HeaderText="কোম্পানী" SortExpression="SupplierCompanyName" />
         <asp:BoundField DataField="SupplierName" HeaderText="সাপ্লায়ার" SortExpression="SupplierName" />
         <asp:BoundField DataField="SupplierPhone" HeaderText="মোবাইল" SortExpression="SupplierPhone" />
         <asp:BoundField DataField="SupplierAddress" HeaderText="ঠিকানা" SortExpression="SupplierAddress" />
         <asp:CommandField ShowEditButton="True"></asp:CommandField>
         <asp:TemplateField ShowHeader="False">
            <ItemTemplate>
               <asp:LinkButton ID="LinkButton1" OnClientClick="return confirm('Are You Sure Want To Delete?')" runat="server" CausesValidation="False" CommandName="Delete" Text="Delete"></asp:LinkButton>
            </ItemTemplate>
         </asp:TemplateField>
      </Columns>
   </asp:GridView>
   <asp:SqlDataSource ID="SupplierSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" DeleteCommand="DELETE FROM [Fabrics_Supplier] WHERE [FabricsSupplierID] = @FabricsSupplierID" InsertCommand="INSERT INTO Fabrics_Supplier(InstitutionID, RegistrationID, SupplierName, SupplierPhone, SupplierAddress, SupplierCompanyName) VALUES (@InstitutionID, @RegistrationID, @SupplierName, @SupplierPhone, @SupplierAddress, @SupplierCompanyName)" SelectCommand="SELECT * FROM Fabrics_Supplier WHERE (InstitutionID = @InstitutionID)" UpdateCommand="UPDATE Fabrics_Supplier SET SupplierName = @SupplierName, SupplierPhone = @SupplierPhone, SupplierAddress = @SupplierAddress, SupplierCompanyName = @SupplierCompanyName WHERE (FabricsSupplierID = @FabricsSupplierID)">
      <DeleteParameters>
         <asp:Parameter Name="FabricsSupplierID" Type="Int32" />
      </DeleteParameters>
      <InsertParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
         <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
         <asp:ControlParameter ControlID="CompanyNameTextBox" Name="SupplierCompanyName" PropertyName="Text" Type="String" />
         <asp:ControlParameter ControlID="SupplierNameTextBox" Name="SupplierName" PropertyName="Text" Type="String" />
         <asp:ControlParameter ControlID="SupplierPhoneTextBox" Name="SupplierPhone" PropertyName="Text" Type="String" />
         <asp:ControlParameter ControlID="SupplierAddressTextBox" Name="SupplierAddress" PropertyName="Text" Type="String" />
      </InsertParameters>
      <SelectParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
      </SelectParameters>
      <UpdateParameters>
         <asp:Parameter Name="FabricsSupplierID" Type="Int32" />
         <asp:Parameter Name="SupplierName" Type="String" />
         <asp:Parameter Name="SupplierPhone" Type="String" />
         <asp:Parameter Name="SupplierAddress" Type="String" />
         <asp:Parameter Name="SupplierCompanyName" Type="String" />
      </UpdateParameters>
   </asp:SqlDataSource>


<script>
   function isNumberKey(a) { a = a.which ? a.which : event.keyCode; return 46 != a && 31 < a && (48 > a || 57 < a) ? !1 : !0 };
</script>
</asp:Content>
