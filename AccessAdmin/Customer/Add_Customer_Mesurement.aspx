<%@ Page Title="নতুন কাস্টমার যুক্ত করুন" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Add_Customer_Mesurement.aspx.cs" Inherits="TailorBD.AccessAdmin.Customer.Add_Customer_Mesurement" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <style>
      .textbox { width: 192px; }
      .Lnk { font-weight: normal; color: #0094ff; }

      @media screen and (max-width: 979px) /* Tablet &Mobile*/ {
         .dropdown { width: 94%; }
         .Datetime, .textbox { width: 90%; }
      }
   </style>
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <h3>নতুন কাস্টমার ও তার মাপ যুক্ত করুন</h3>
   <table>
      <tr>
         <td>কাস্টমার নং:
                        <asp:Label ID="CustomerIDLabel" runat="server" Font-Bold="True"></asp:Label>
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
            <asp:TextBox ID="CustomerNameTextBox" runat="server" CssClass="textbox Check"></asp:TextBox>
         </td>
      </tr>
      <tr>
         <td>মোবাইল নাম্বার
                <asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="MobaileTextBox" CssClass="EroorSummer" ErrorMessage="দিন" ValidationGroup="1"></asp:RequiredFieldValidator>
         </td>
      </tr>
      <tr>
         <td>
            <asp:TextBox ID="MobaileTextBox" onkeypress="return isNumberKey(event)" runat="server" CssClass="textbox Check"></asp:TextBox>
            <asp:Label ID="lbl" runat="server" Font-Bold="True" Font-Size="13px" ForeColor="#1A488A" />
         </td>
      </tr>
      <tr>
         <td>ঠিকানা 
         </td>
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
            <asp:SqlDataSource ID="InstitutionSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM [Institution]" UpdateCommand="UPDATE Institution SET TotalCustomer = @TotalCustomer WHERE (InstitutionID = @InstitutionID)">
               <UpdateParameters>
                  <asp:ControlParameter ControlID="CustomerIDLabel" Name="TotalCustomer" PropertyName="Text" Type="Int32" />
                  <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
               </UpdateParameters>
            </asp:SqlDataSource>
         </td>
      </tr>
   </table>

   <script src="../../JS/Autocomplete/jquery.autocomplete.js"></script>
   <script type="text/javascript">
      $(document).ready(function () {
         $("[id*=MobaileTextBox]").autocomplete("../../Handler/Find_Mobile_No.ashx");
         $("[id*=CustomerNameTextBox]").autocomplete("../../Handler/Find_Customer_name.ashx");
      });

      //Check Mobaile Number
      var InsID =<%=Request.Cookies["InstitutionID"].Value%>
        $("[id*=MobaileTextBox]").on('keyup keypress blur focus select drop', function (e) {
           $.ajax({
              type: "POST",
              url: "Add_Customer_Mesurement.aspx/CheckMobileNo",
              contentType: "application/json; charset=utf-8",
              data: '{"MobileNo":"' + $("#<%=MobaileTextBox.ClientID%>")[0].value + '","ID":"' + InsID + '"}',
                dataType: "json",
                success: OnSuccess,
                failure: function (response) { alert(response) }
            });
        });

          function OnSuccess(response) {
             var msg = $("#<%=lbl.ClientID%>")[0];
          if (response.d != "false") {
             msg.innerHTML = "নাম্বারটি ইতিমধ্যে নিবন্ধিত। <a class='Lnk' href='CustomerDetails.aspx?CustomerID=" + response.d + "&Cloth_For_ID=" + <%=GenderDropDownList.SelectedValue%> +"'>বিস্তারিত দেখুন >></a>";
          }
          else { msg.innerHTML = ""; }
       }


       //Check Name And Mobaile Number
       $(".Check").on('keyup keypress blur focus select drop', function (e) {
          $.ajax({
             type: "POST",
             url: "Add_Customer_Mesurement.aspx/Check_Name_Mobile",
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

       function isNumberKey(a) { a = a.which ? a.which : event.keyCode; return 46 != a && 31 < a && (48 > a || 57 < a) ? !1 : !0 };
   </script>
</asp:Content>
