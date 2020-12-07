<%@ Page Title="সকল গ্রাহকদের তালিকা" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="CustomerList.aspx.cs" Inherits="TailorBD.AccessAdmin.Customer.CustomerList" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <link href="Css/CustomerList.css?v=1.1" rel="stylesheet" />
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <asp:ScriptManager ID="ScriptManager1" runat="server"></asp:ScriptManager>
   <asp:UpdatePanel ID="UpdatePanel2" runat="server">
      <ContentTemplate>

         <h3>সকল গ্রাহকদের তালিকা</h3>
         <table>
            <tr>
               <td>কাস্টমার নং</td>
               <td>কাস্টমারের নাম</td>
               <td>মোবাইল নাম্বার</td>
               <td>&nbsp;</td>
            </tr>
            <tr>
               <td>
                  <asp:TextBox ID="CustomerNoTextBox" placeholder="কাস্টমার নং" runat="server" CssClass="textbox" Width="70px"></asp:TextBox>
               </td>
               <td>
                  <asp:TextBox ID="SearchNameTextBox" runat="server" CssClass="textbox" placeholder="কাস্টমারের নাম"></asp:TextBox>
               </td>
               <td>
                  <asp:TextBox ID="MobileNoTextBox" runat="server" placeholder="মোবাইল নাম্বার" CssClass="textbox"></asp:TextBox>
               </td>
               <td>
                  <asp:Button ID="FindButton" runat="server" CssClass="SearchButton" ValidationGroup="1" />
               </td>
            </tr>
            <tr>
               <td colspan="4">
                  <asp:RegularExpressionValidator ID="RegularExpressionValidator2" runat="server" ControlToValidate="CustomerNoTextBox" CssClass="EroorSummer" ErrorMessage="শুধু ইংরেজী নাম্বার লেখা যাবে" ValidationExpression="^\d+$" ValidationGroup="1"></asp:RegularExpressionValidator>
                  &nbsp;<asp:RegularExpressionValidator ID="RegularExpressionValidator3" runat="server" ControlToValidate="MobileNoTextBox" CssClass="EroorSummer" ErrorMessage="শুধু ইংরেজী নাম্বার লেখা যাবে" ValidationExpression="^\d+$" ValidationGroup="1"></asp:RegularExpressionValidator>
               </td>
            </tr>
         </table>
         <asp:Label ID="TotalLabel" runat="server" CssClass="CountCustomer"></asp:Label>
          <asp:FormView ID="GTFormView" runat="server" DataSourceID="TotalSQL">
              <ItemTemplate>
                  <label class="TotalDue">মোট বাকি: ৳<%# Eval("Total_Due","{0:N}") %></label>
              </ItemTemplate>
          </asp:FormView>

          <asp:SqlDataSource ID="TotalSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT  SUM(Customer_Due) AS Total_Due FROM  Customer WHERE  (InstitutionID = @InstitutionID)">
              <SelectParameters>
                  <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
              </SelectParameters>
          </asp:SqlDataSource>

         <asp:GridView ID="CustomerListGridView" runat="server" AutoGenerateColumns="False" AllowPaging="true" PageSize="100" AllowSorting="true" CssClass="mGrid" DataKeyNames="CustomerID" DataSourceID="CustomerListSQL" OnRowDeleted="CustomerListGridView_RowDeleted">
            <Columns>
               <asp:HyperLinkField
                  DataNavigateUrlFields="CustomerID,Cloth_For_ID"
                  DataNavigateUrlFormatString="CustomerDetails.aspx?CustomerID={0}&Cloth_For_ID={1}"
                  HeaderText="বিস্তারিত" ControlStyle-CssClass="Details">
                  <ControlStyle CssClass="Details" />
                  <ItemStyle Width="60px" />
               </asp:HyperLinkField>
               <asp:HyperLinkField DataNavigateUrlFields="CustomerID,Cloth_For_ID"
                  DataNavigateUrlFormatString="../Order/Dressandmeasurements.aspx?CustomerID={0}&Cloth_For_ID={1}"
                  HeaderText="অর্ডার দিন" ControlStyle-CssClass="AddMoreDress">
                  <ControlStyle CssClass="AddMoreDress" />
                  <ItemStyle Width="80px" />
               </asp:HyperLinkField>
                <asp:BoundField DataField="CustomerNumber" HeaderText="কাস্টমার নং" SortExpression="CustomerNumber" ReadOnly="True" />
               <asp:TemplateField HeaderText="নাম" SortExpression="CustomerName">
                  <EditItemTemplate>
                     <asp:TextBox ID="CustomerNameTextBox" runat="server" CssClass="textbox" Text='<%# Bind("CustomerName") %>'></asp:TextBox>
                     <asp:RequiredFieldValidator ID="NMrf" runat="server" ControlToValidate="CustomerNameTextBox" CssClass="EroorSummer" ErrorMessage="*" ValidationGroup="Ed"></asp:RequiredFieldValidator>
                  </EditItemTemplate>
                  <ItemTemplate>
                     <asp:Label ID="Label2" runat="server" Text='<%# Bind("CustomerName") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:TemplateField HeaderText="মোবাইল" SortExpression="Phone">
                  <EditItemTemplate>
                     <asp:TextBox ID="PhoneTextBox" onkeypress="return isNumberKey(event)" runat="server" CssClass="textbox" Text='<%# Bind("Phone") %>'></asp:TextBox>
                     <asp:RequiredFieldValidator ID="Mbrf" runat="server" ControlToValidate="PhoneTextBox" CssClass="EroorSummer" ErrorMessage="*" ValidationGroup="Ed"></asp:RequiredFieldValidator>
                     <asp:RegularExpressionValidator ID="Rexv" runat="server" ControlToValidate="PhoneTextBox" CssClass="EroorSummer" ErrorMessage="*" ValidationExpression="(88)?((011)|(015)|(016)|(017)|(018)|(019)|(013)|(014))\d{8,8}" ValidationGroup="Ed"></asp:RegularExpressionValidator>
                  </EditItemTemplate>
                  <ItemTemplate>
                     <asp:Label ID="Label1" runat="server" Text='<%# Bind("Phone") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:TemplateField HeaderText="ঠিকানা" SortExpression="Address">
                  <EditItemTemplate>
                     <asp:TextBox ID="AddressTextBox" CssClass="textbox" TextMode="MultiLine" runat="server" Text='<%# Bind("Address") %>'></asp:TextBox>
                  </EditItemTemplate>
                  <ItemTemplate>
                     <asp:Label ID="Label3" runat="server" Text='<%# Bind("Address") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>
                  <asp:BoundField DataField="Customer_Due" HeaderText="বাকি টাকা" SortExpression="Customer_Due"/>
               <asp:BoundField DataField="Date" HeaderText="নিবন্ধনের তারিখ" SortExpression="Date" ReadOnly="True" DataFormatString="{0:d MMM yyyy}" />
               <asp:TemplateField ShowHeader="False" HeaderText="ইডিট করুন">
                  <EditItemTemplate>
                     <asp:LinkButton ID="UpdateLinkButton" runat="server" ToolTip="আপডেট করুন" ValidationGroup="Ed" CausesValidation="True" CommandName="Update" Text="" CssClass="Updete"></asp:LinkButton>
                     &nbsp; <asp:LinkButton ID="CancelLinkButton" runat="server" ToolTip="কেন্সেল করুন" CausesValidation="False" CommandName="Cancel" Text="" CssClass="Cancel"></asp:LinkButton>
                  </EditItemTemplate>
                  <ItemTemplate>

                     <asp:LinkButton ID="EditLinkButton" runat="server" ToolTip="ইডিট করুন" CausesValidation="False" CommandName="Edit" Text="" CssClass="Edit"></asp:LinkButton>
                  </ItemTemplate>
                  <ItemStyle Width="100px" />
               </asp:TemplateField>

               <asp:TemplateField ShowHeader="False">
                  <ItemTemplate>
                     <asp:LinkButton ID="DeleteImageButton" runat="server" ToolTip="ডিলিট করুন" CausesValidation="False" CommandName="Delete" OnClientClick="return confirm('আপনি কি ডিলেট করতে চান ?')" CssClass="Delete"></asp:LinkButton>

                  </ItemTemplate>
                  <ItemStyle Width="40px" />
               </asp:TemplateField>
            </Columns>
            <EmptyDataTemplate>
               কোন রেকর্ড নেই
            </EmptyDataTemplate>
            <PagerSettings FirstPageText="First" LastPageText="Last" NextPageText="Next" PreviousPageText="Prev." />
            <PagerStyle CssClass="pgr" />
         </asp:GridView>
         <asp:SqlDataSource ID="CustomerListSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
            SelectCommand="SELECT Customer_Due, CustomerID, RegistrationID, InstitutionID, Cloth_For_ID, CustomerNumber, CustomerName, Phone, Address, Image, Date  FROM Customer WHERE (InstitutionID = @InstitutionID) AND (Phone LIKE '%' + @Phone + '%') AND (CustomerNumber = @CustomerNumber OR @CustomerNumber = 0) AND (ISNULL(CustomerName, N'') LIKE '%' + @CustomerName + '%') ORDER BY Date DESC"
            OnSelected="CustomerListSQL_Selected"
            DeleteCommand="DELETE FROM Customer WHERE (CustomerID = @CustomerID)"
            UpdateCommand="UPDATE Customer SET CustomerName = @CustomerName, Phone = @Phone, Address = @Address WHERE (CustomerID = @CustomerID)">

            <DeleteParameters>
               <asp:Parameter Name="CustomerID" />
            </DeleteParameters>
            <SelectParameters>
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
               <asp:ControlParameter ControlID="MobileNoTextBox" Name="Phone" PropertyName="Text" DefaultValue="%" />
               <asp:ControlParameter ControlID="CustomerNoTextBox" Name="CustomerNumber" PropertyName="Text" DefaultValue="0" />
               <asp:ControlParameter ControlID="SearchNameTextBox" DefaultValue="%" Name="CustomerName" PropertyName="Text" />
            </SelectParameters>
            <UpdateParameters>
               <asp:Parameter Name="CustomerName" />
               <asp:Parameter Name="Phone" />
               <asp:Parameter Name="Address" />
               <asp:Parameter Name="CustomerID" />
            </UpdateParameters>
         </asp:SqlDataSource>
      </ContentTemplate>
   </asp:UpdatePanel>


   <asp:UpdateProgress ID="UpdateProgress" runat="server">
      <ProgressTemplate>
         <div id="progress_BG"></div>
         <div id="progress">
            <img src="../../CSS/Image/gif-load.gif" alt="Loading..." />
            <br />
            <b>Loading...</b>
         </div>
      </ProgressTemplate>
   </asp:UpdateProgress>


   <script type="text/javascript">
      /**Empty Text**/
      $("[id*=CustomerNoTextBox]").focus(function () {
         $("[id*=SearchNameTextBox]").val("")
         $("[id*=MobileNoTextBox]").val("")
      });
      $("[id*=MobileNoTextBox]").focus(function () {
         $("[id*=CustomerNoTextBox]").val("")
         $("[id*=SearchNameTextBox]").val("")
      });
      $("[id*=SearchNameTextBox]").focus(function () {
         $("[id*=CustomerNoTextBox]").val("")
         $("[id*=MobileNoTextBox]").val("")
      });

      Sys.WebForms.PageRequestManager.getInstance().add_endRequest(function (a, b) {
         $("[id*=CustomerNoTextBox]").focus(function () {
            $("[id*=SearchNameTextBox]").val("")
            $("[id*=MobileNoTextBox]").val("")
         });
         $("[id*=MobileNoTextBox]").focus(function () {
            $("[id*=CustomerNoTextBox]").val("")
            $("[id*=SearchNameTextBox]").val("")
         });
         $("[id*=SearchNameTextBox]").focus(function () {
            $("[id*=CustomerNoTextBox]").val("")
            $("[id*=MobileNoTextBox]").val("")
         });
      })
      function isNumberKey(a) { a = a.which ? a.which : event.keyCode; return 46 != a && 31 < a && (48 > a || 57 < a) ? !1 : !0 };
   </script>
</asp:Content>
