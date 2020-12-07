<%@ Page Title="অর্ডার দিন" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Order.aspx.cs" Inherits="TailorBD.AccessAdmin.Customer.Order" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <link href="../../JS/jq_Profile/css/Profile_jquery-ui-1.8.23.custom.css" rel="stylesheet" />
   <link href="CSS/Order_List.css" rel="stylesheet" />
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <asp:ScriptManager ID="ScriptManager1" runat="server"></asp:ScriptManager>

   <div id="main">
      <ul>
         <li><a href="#NewCustomer">নতুন কাস্টমার
         </a></li>
         <li><a href="#OldCustomer">পুরাতন কাস্টমার
         </a></li>
      </ul>

      <div id="NewCustomer">
         <table>
            <tr style="display:none;">
               <td>কাস্টমার নং :<asp:Label ID="CustomerIDLabel" runat="server" Font-Bold="True"></asp:Label>
               </td>
            </tr>
            <tr>
               <td>জেন্ডার নির্ধরণ করুন</td>
            </tr>
            <tr>
               <td>
                  <asp:DropDownList ID="GenderDropDownList" runat="server" DataSourceID="Measurement_ForSQL" DataTextField="Cloth_For" DataValueField="Cloth_For_ID" CssClass="dropdown">
                  </asp:DropDownList>
                  <asp:SqlDataSource ID="Measurement_ForSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM [Cloth_For]"></asp:SqlDataSource>
               </td>
            </tr>
            <tr>
               <td>কাস্টমারের নাম
                        <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="CustomerNameTextBox" CssClass="EroorSummer" ErrorMessage="দিন" ValidationGroup="1"></asp:RequiredFieldValidator>
               </td>
            </tr>
            <tr>
               <td>
                  <asp:TextBox ID="CustomerNameTextBox" runat="server" CssClass="textbox Name Check"></asp:TextBox>
               </td>
            </tr>
            <tr>
               <td>মোবাইল নাম্বার
                        <asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="MobaileTextBox" CssClass="EroorSummer" ErrorMessage="দিন" ValidationGroup="1"></asp:RequiredFieldValidator>
               </td>
            </tr>
            <tr>
               <td class="Lnk">
                  <asp:TextBox ID="MobaileTextBox" onkeypress="return isNumberKey(event)" runat="server" CssClass="textbox Mobile Check"></asp:TextBox>
                  <asp:Label ID="lbl" runat="server" Font-Bold="True" Font-Size="13px" ForeColor="#1A488A" />
               </td>
            </tr>
            <tr>
               <td>ঠিকানা</td>
            </tr>
            <tr>
               <td>
                  <asp:TextBox ID="AdressTextBox" runat="server" CssClass="textbox" TextMode="MultiLine"></asp:TextBox>
               </td>
            </tr>
            <tr>
               <td>ছবি নির্বাচন করুন</td>
            </tr>
            <tr>
               <td>
                  <asp:FileUpload ID="PhotoFileUpload" runat="server" />
               </td>
            </tr>
            <tr>
               <td>
            <asp:Label ID="IsCustomerLabel" runat="server" CssClass="EroorSummer"></asp:Label>
               </td>
            </tr>
            <tr>
               <td>
                  <asp:Button ID="AddButton" runat="server" CssClass="ContinueButton" OnClick="AddButton_Click" Text="পরবর্তী ধাপ" ValidationGroup="1" />
               </td>
            </tr>
         </table>
         <asp:SqlDataSource ID="InstitutionSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM [Institution]" UpdateCommand="UPDATE Institution SET TotalCustomer = @TotalCustomer WHERE (InstitutionID = @InstitutionID)">
            <UpdateParameters>
               <asp:ControlParameter ControlID="CustomerIDLabel" Name="TotalCustomer" PropertyName="Text" Type="Int32" />
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
            </UpdateParameters>
         </asp:SqlDataSource>
         <asp:SqlDataSource ID="CustomerSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
            DeleteCommand="DELETE FROM [Customer] WHERE [CustomerID] = @CustomerID"
            InsertCommand="INSERT INTO Customer (RegistrationID, InstitutionID, Cloth_For_ID, CustomerName, Phone, Address, Date, CustomerNumber) VALUES (@RegistrationID,@InstitutionID,@Cloth_For_ID,@CustomerName,@Phone,@Address, GETDATE(),(SELECT [dbo].[CustomeSerialNumber](@InstitutionID)))" SelectCommand="SELECT CustomerID, RegistrationID, InstitutionID, Cloth_For_ID, CustomerName, Phone, Address, Date, CustomerNumber FROM Customer WHERE (InstitutionID = @InstitutionID) ORDER BY CustomerID DESC" UpdateCommand="UPDATE [Customer] SET [RegistrationID] = @RegistrationID, [InstitutionID] = @InstitutionID, [Cloth_For_ID] = @Cloth_For_ID, [CustomerName] = @CustomerName, [Phone] = @Phone, [Address] = @Address, [Date] = @Date WHERE [CustomerID] = @CustomerID">
            <DeleteParameters>
               <asp:Parameter Name="CustomerID" Type="Int32" />
            </DeleteParameters>
            <InsertParameters>
               <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
               <asp:ControlParameter ControlID="GenderDropDownList" Name="Cloth_For_ID" PropertyName="SelectedValue" Type="Int32" />
               <asp:ControlParameter ControlID="CustomerNameTextBox" Name="CustomerName" PropertyName="Text" Type="String" />
               <asp:ControlParameter ControlID="MobaileTextBox" Name="Phone" PropertyName="Text" Type="String" />
               <asp:ControlParameter ControlID="AdressTextBox" Name="Address" PropertyName="Text" Type="String" />
            </InsertParameters>
            <SelectParameters>
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
            </SelectParameters>
            <UpdateParameters>
               <asp:Parameter Name="RegistrationID" Type="Int32" />
               <asp:Parameter Name="InstitutionID" Type="Int32" />
               <asp:Parameter Name="Cloth_For_ID" Type="Int32" />
               <asp:Parameter Name="CustomerName" Type="String" />
               <asp:Parameter Name="Phone" Type="String" />
               <asp:Parameter Name="Address" Type="String" />
               <asp:Parameter DbType="Date" Name="Date" />
               <asp:Parameter Name="CustomerID" Type="Int32" />
            </UpdateParameters>
         </asp:SqlDataSource>
      </div>

      <div id="OldCustomer">
         <asp:UpdatePanel ID="UpdatePanel2" runat="server">
            <ContentTemplate>
               <table>
                  <tr>
                     <td>কাস্টমার নং</td>
                     <td>কাস্টমারের নাম</td>
                     <td>মোবাইল নাম্বার</td>
                     <td>&nbsp;</td>
                  </tr>
                  <tr>
                     <td>
                        <asp:TextBox ID="CustomerNoTextBox" placeholder="কাস্টমার নং" runat="server" CssClass="textbox" Width="72px"></asp:TextBox>
                     </td>
                     <td>
                        <asp:TextBox ID="SearchNameTextBox" runat="server" CssClass="textbox Name" placeholder="কাস্টমারের নাম"></asp:TextBox>
                     </td>
                     <td>
                        <asp:TextBox ID="MobileNoTextBox" onkeypress="return isNumberKey(event)" runat="server" placeholder="মোবাইল নাম্বার" CssClass="textbox Mobile"></asp:TextBox>
                     </td>
                     <td>
                        <asp:Button ID="FindButton" runat="server" CssClass="SearchButton" ValidationGroup="10" />
                     </td>
                  </tr>
                  <tr>
                     <td colspan="4">
                        <asp:RegularExpressionValidator ID="RegularExpressionValidator2" runat="server" ControlToValidate="CustomerNoTextBox" CssClass="EroorSummer" ErrorMessage="শুধু ইংরেজী নাম্বার লেখা যাবে" ValidationExpression="^\d+$" ValidationGroup="10"></asp:RegularExpressionValidator>
                        &nbsp;<asp:RegularExpressionValidator ID="RegularExpressionValidator3" runat="server" ControlToValidate="MobileNoTextBox" CssClass="EroorSummer" ErrorMessage="শুধু ইংরেজী নাম্বার লেখা যাবে" ValidationExpression="^\d+$" ValidationGroup="10"></asp:RegularExpressionValidator>
                     </td>
                  </tr>
               </table>

              <%-- <asp:Label ID="TotalLabel" runat="server"></asp:Label>--%>
               <asp:GridView ID="CustomerListGridView" AllowSorting="true" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="CustomerID" DataSourceID="CustomerListSQL" AllowPaging="True">
                  <Columns>
                     <asp:HyperLinkField DataNavigateUrlFields="CustomerID,Cloth_For_ID"
                        DataNavigateUrlFormatString="Dressandmeasurements.aspx?CustomerID={0}&Cloth_For_ID={1}"
                        HeaderText="অর্ডার দিন" ControlStyle-CssClass="AddMoreDress">
                        <ControlStyle CssClass="AddMoreDress" />
                        <ItemStyle Width="80px" />
                     </asp:HyperLinkField>
                     <asp:BoundField DataField="CustomerNumber" HeaderText="কাস্টমার নং" />
                     <asp:TemplateField HeaderText="নাম">
                        <ItemTemplate>
                           <asp:Label ID="Label2" runat="server" Text='<%# Bind("CustomerName") %>' />
                        </ItemTemplate>
                     </asp:TemplateField>
                     <asp:BoundField DataField="Phone" HeaderText="মোবাইল" />
                     <asp:BoundField DataField="Address" HeaderText="ঠিকানা" />
                     <asp:BoundField DataField="TotalOrder" HeaderText="মোট অর্ডার" />
                     <asp:BoundField DataField="Last_Order_Date" HeaderText="সর্বশেষ অর্ডার" DataFormatString="{0:d MMM yyyy}" />
                     <asp:BoundField DataField="Date" HeaderText="নিবন্ধনের তারিখ" DataFormatString="{0:d MMM yyyy}" />
                  </Columns>
                  <EmptyDataTemplate>
                     Empty
                  </EmptyDataTemplate>
                  <PagerSettings FirstPageText="Fast" LastPageText="Last" Mode="NumericFirstLast" NextPageText="Next" PreviousPageText="Prev" />
                  <PagerStyle CssClass="pgr" />
               </asp:GridView>
               <asp:SqlDataSource ID="CustomerListSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT top(100) *,
(SELECT COUNT(*) FROM [Order] WHERE (CustomerID = Customer.CustomerID)) AS TotalOrder, 
(SELECT MAX(OrderDate) FROM [Order] WHERE (CustomerID = Customer.CustomerID)) AS Last_Order_Date 
 FROM Customer WHERE (InstitutionID = @InstitutionID) AND (Phone LIKE '%' + @Phone + '%') AND (CustomerNumber = @CustomerNumber OR @CustomerNumber = 0) AND (ISNULL(CustomerName, N'') LIKE '%' + @CustomerName + '%') ORDER BY TotalOrder DESC"
                  OnSelected="CustomerListSQL_Selected">
                  <SelectParameters>
                     <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                     <asp:ControlParameter ControlID="MobileNoTextBox" DefaultValue="%" Name="Phone" PropertyName="Text" />
                     <asp:ControlParameter ControlID="CustomerNoTextBox" DefaultValue="0" Name="CustomerNumber" PropertyName="Text" />
                     <asp:ControlParameter ControlID="SearchNameTextBox" DefaultValue="%" Name="CustomerName" PropertyName="Text" />
                  </SelectParameters>
               </asp:SqlDataSource>
            </ContentTemplate>
         </asp:UpdatePanel>
      </div>
   </div>


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

   <script src="../../JS/jq_Profile/jquery-ui-1.8.23.custom.min.js"></script>
   <script src="../../JS/Autocomplete/jquery.autocomplete.js"></script>

   <script type="text/javascript">
      $(document).ready(function () {
         $('#main').tabs();
         $(".Mobile").autocomplete("../../Handler/Find_Mobile_No.ashx");
         $(".Name").autocomplete("../../Handler/Find_Customer_name.ashx");

          //Empty all local storage
         localStorage.removeItem("All_Measurement");
         localStorage.removeItem("All_Style");
         localStorage.removeItem("cart");
         localStorage.removeItem("OrderCart");
      });


      var InsID =<%=Request.Cookies["InstitutionID"].Value%>
          $("[id*=MobaileTextBox]").on('keyup keypress blur focus select drop', function () {
             $.ajax({
                type: "POST",
                url: "Order.aspx/CheckMobileNo",
                contentType: "application/json; charset=utf-8",
                data: '{"MobileNo":"' + $("#<%=MobaileTextBox.ClientID%>")[0].value + '","ID":"' + InsID + '"}',
                dataType: "json",
                success: OnSuccess,
                failure: function (response) {
                   alert(response);
                }
             });
          });

          function OnSuccess(response) {
             var msg = $("#<%=lbl.ClientID%>")[0];
             if (response.d != "false") {
                msg.innerHTML = "নাম্বারটি ইতিমধ্যে নিবন্ধিত। <a href='Dressandmeasurements.aspx?CustomerID=" + response.d + "&Cloth_For_ID=" + <%=GenderDropDownList.SelectedValue%> +"'>অর্ডার দিন>></a>";
         }
         else {
            msg.innerHTML = "";
         }
      }

      //Check Name And Mobaile Number
      $(".Check").on('keyup keypress blur focus select drop', function () {
         $.ajax({
            type: "POST",
            url: "Order.aspx/Check_Name_Mobile",
            contentType: "application/json; charset=utf-8",
            data: '{"Mobile":"' + $("#<%=MobaileTextBox.ClientID%>")[0].value + '","ID":"' + InsID + '","Name":"' + $("#<%=CustomerNameTextBox.ClientID%>")[0].value + '"}',
            dataType: "json",
            success: OnSuccess2,
            failure: function (response) { alert(response) }
         });
      });

      function OnSuccess2(response) {
         var msg = $("#<%=IsCustomerLabel.ClientID%>")[0];
         if (response.d != "false") {
            msg.innerHTML = $("#<%=CustomerNameTextBox.ClientID%>")[0].value + " মোবাইল: " + $("#<%=MobaileTextBox.ClientID%>")[0].value + " পূর্বে নিবন্ধিত, পুনরায় নিবন্ধন করা যাবে না";
            $("[id*=AddButton]").prop("disabled", !0).removeClass("ContinueButton");
         }
         else {
            msg.innerHTML = "";
            $("[id*=AddButton]").prop("disabled", !1).addClass("ContinueButton");
         }
      }


      Sys.WebForms.PageRequestManager.getInstance().add_endRequest(function (a, b) {
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
         /**Submit form on Enter key**/
         $(".textbox").keyup(function (a) { 13 == a.keyCode && $("[id*=FindButton]").click() });


         $(".Mobile").autocomplete("../../Handler/Find_Mobile_No.ashx");
         $(".Name").autocomplete("../../Handler/Find_Customer_name.ashx");
      })

      /**Submit form on Enter key**/
      $(".textbox").keyup(function (a) { 13 == a.keyCode && $("[id*=FindButton]").click() });
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

      function noBack() { window.history.forward() } noBack(); window.onload = noBack; window.onpageshow = function (a) { a.persisted && noBack() }; window.onunload = function () { void 0 };
      function isNumberKey(a) { a = a.which ? a.which : event.keyCode; return 46 != a && 31 < a && (48 > a || 57 < a) ? !1 : !0 };
   </script>
</asp:Content>
