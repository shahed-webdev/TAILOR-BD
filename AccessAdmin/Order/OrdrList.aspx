<%@ Page Title="অর্ডার ‍লিস্ট" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="OrdrList.aspx.cs" Inherits="TailorBD.AccessAdmin.Order.OrdrList" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <link href="../../JS/DatePicker/jquery.datepick.css" rel="stylesheet" />
   <link href="CSS/Order_List.css" rel="stylesheet" />
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <asp:ScriptManager ID="ScriptManager1" runat="server"></asp:ScriptManager>
   <asp:UpdatePanel ID="UpdatePanel1" runat="server">
      <ContentTemplate>
         <h3>সকল কাস্টমারের অর্ডার ‍লিস্ট</h3>
         <asp:RadioButtonList ID="FindRadioButtonList" runat="server" RepeatDirection="Horizontal" RepeatLayout="Flow" CssClass="RadioB">
            <asp:ListItem Selected="True">Order No. And Mobile No.</asp:ListItem>
            <asp:ListItem>Order Date</asp:ListItem>
         </asp:RadioButtonList>

         <div class="Search_Number">
            <table>
               <tr>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
               </tr>
               <tr>
                  <td>মোবাইল নাম্বার</td>
                  <td>অর্ডার নাম্বার</td>
                  <td>&nbsp;</td>
               </tr>
               <tr>
                  <td>
                     <asp:TextBox ID="MobileNoTextBox" runat="server" CssClass="textbox" placeholder="মোবাইল নাম্বার"></asp:TextBox>
                  </td>
                  <td>
                     <asp:TextBox ID="OrderNoTextBox" runat="server" CssClass="textbox" placeholder="অর্ডার নাম্বার"></asp:TextBox>
                  </td>
                  <td>&nbsp;</td>
               </tr>
               <tr>
                  <td>কাস্টমারের নাম</td>
                  <td>ঠিকানা</td>
                  <td>&nbsp;</td>
               </tr>
               <tr>
                  <td>
                     <asp:TextBox ID="SearchNameTextBox" runat="server" CssClass="textbox" placeholder="কাস্টমারের নাম"></asp:TextBox>
                  </td>
                  <td>
                     <asp:TextBox ID="AddressTextBox" runat="server" CssClass="textbox" placeholder="ঠিকানা"></asp:TextBox>
                  </td>
                  <td>
                     <asp:Button ID="FindButton" runat="server" CssClass="SearchButton" ValidationGroup="1" />
                  </td>
               </tr>
               <tr>
                  <td colspan="3">
                     <asp:RegularExpressionValidator ID="RegularExpressionValidator2" runat="server" ControlToValidate="OrderNoTextBox" CssClass="EroorSummer" ErrorMessage="শুধু ইংরেজী নাম্বার লেখা যাবে" ValidationExpression="^\d+$" ValidationGroup="1"></asp:RegularExpressionValidator>
                     &nbsp;<asp:RegularExpressionValidator ID="RegularExpressionValidator3" runat="server" ControlToValidate="MobileNoTextBox" CssClass="EroorSummer" ErrorMessage="শুধু ইংরেজী নাম্বার লেখা যাবে" ValidationExpression="^\d+$" ValidationGroup="1"></asp:RegularExpressionValidator>
                  </td>
               </tr>
            </table>
         </div>

         <div class="Search_Date">
            <table>
               <tr>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
               </tr>
               <tr>
                  <td>কোন তারিখ থেকে</td>
                  <td>কোন তারিখ পর্যন্ত</td>
                  <td>&nbsp;</td>
               </tr>
               <tr>
                  <td>
                     <asp:TextBox ID="FromDateTextBox" placeholder="কোন তারিখ থেকে" runat="server" CssClass="Datetime" Width="130px"></asp:TextBox>
                  </td>
                  <td>
                     <asp:TextBox ID="ToDateTextBox" runat="server" placeholder="কোন তারিখ পর্যন্ত" CssClass="Datetime" Width="130px"></asp:TextBox>
                  </td>
                  <td>
                     <asp:Button ID="DateFindButton" runat="server" CssClass="SearchButton" ValidationGroup="1" />
                  </td>
               </tr>
               <tr>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
               </tr>
            </table>
         </div>
         <b>
            <label class="Date"></label>
            <asp:Label ID="TotalLabel" runat="server"></asp:Label>
         </b>

         <div style="float: right" class="NoPrint">
            <div class="Today Indicator">Today's Order(s)</div>
         </div>
         <asp:GridView ID="CustomerOrderdDressGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="OrderID,CustomerID,OrderDate" DataSourceID="CustomerOrderdDressSQL" AllowPaging="True" PageSize="25" OnRowDataBound="CustomerOrderdDressGridView_RowDataBound">
            <Columns>
               <asp:TemplateField>
                  <ItemTemplate>
                     <asp:HyperLink ID="PrintHyperLink" runat="server" NavigateUrl='<%# Eval("OrderID", "Print_Mesurement.aspx?OrderID={0}") %>' CssClass="Cmd_Print" />
                     <asp:Label ID="Label4" runat="server" Text='<%#Bind("Is_Print") %>'></asp:Label>
                  </ItemTemplate>
                  <HeaderStyle CssClass="NoPrint" />
                  <ItemStyle CssClass="NoPrint" />
               </asp:TemplateField>
               <asp:TemplateField HeaderText="অর্ডার নং " SortExpression="OrderSerialNumber">
                  <ItemTemplate>
                     <asp:Label ID="Label1" runat="server" Font-Bold="True" Text='<%# Bind("OrderSerialNumber") %>' />
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:TemplateField HeaderText="নাম" SortExpression="CustomerName">
                  <ItemTemplate>
                     (<asp:Label ID="Label2" runat="server" Text='<%# Bind("CustomerNumber") %>' />)
                     <asp:Label ID="Label3" runat="server" Text='<%# Bind("CustomerName") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:BoundField DataField="Phone" HeaderText="মোবাইল" SortExpression="Phone" />
               <asp:BoundField DataField="Address" HeaderText="ঠিকানা" SortExpression="Address" />
               <asp:BoundField DataField="Details" HeaderText="পোষাকের বিবরণ" SortExpression="Details" />
               <asp:BoundField DataField="OrderDate" HeaderText="অর্ডার" SortExpression="OrderDate" DataFormatString="{0:d MMM yyyy}" />
               <asp:TemplateField HeaderText="ডেলিভারী" SortExpression="DeliveryDate">
                  <ItemTemplate>
                     <asp:Label ID="DeliveryDateLabel" runat="server" Text='<%# Bind("DeliveryDate" ,"{0:d MMM yyyy}") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>

               <asp:HyperLinkField DataNavigateUrlFields="OrderID"
                  DataNavigateUrlFormatString="Add_More_Dress_In_Order.aspx?OrderID={0}"
                  HeaderText="পোষাক যুক্ত করুন">
                  <ControlStyle CssClass="AddMoreDress" />
                  <HeaderStyle CssClass="NoPrint" />
                  <ItemStyle CssClass="NoPrint" />
               </asp:HyperLinkField>

               <asp:TemplateField HeaderText="মাপ">
                  <ItemTemplate>
                     <a class="CH_Mesure" href="OrderDetailsForMaker.aspx?OrderID=<%#Eval("OrderID") %>"></a>
                  </ItemTemplate>
                  <HeaderStyle CssClass="NoPrint" />
                  <ItemStyle CssClass="NoPrint" />
               </asp:TemplateField>
               <asp:TemplateField HeaderText="মানি রিসিট">
                  <ItemTemplate>
                     <a class="M_Receipt" href="MoneyReceipt.aspx?OrderID=<%#Eval("OrderID") %>"></a>
                  </ItemTemplate>
                  <HeaderStyle CssClass="NoPrint" />
                  <ItemStyle CssClass="NoPrint" />
               </asp:TemplateField>
            </Columns>
            <EmptyDataTemplate>
               No Order List Found!
            </EmptyDataTemplate>
            <PagerStyle CssClass="pgr" />
         </asp:GridView>
         <asp:SqlDataSource ID="CustomerOrderdDressSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
            SelectCommand="SELECT [Order].OrderID, [Order].CustomerID, [Order].RegistrationID, [Order].Is_Print,[Order].InstitutionID, [Order].Cloth_For_ID, [Order].OrderDate, [Order].DeliveryDate,[Order].OrderAmount, [Order].PaidAmount, [Order].Discount, [Order].DueAmount, [Order].OrderSerialNumber, [Order].PaymentStatus, [Order].DeliveryStatus, [Order].WorkStatus,Customer.CustomerNumber, Customer.CustomerName, Customer.Phone, Customer.Address,
STUFF((SELECT '; ' + Dress.Dress_Name + ' ' + CAST(OrderList.DressQuantity AS NVARCHAR(50)) + ' Piece ' FROM OrderList INNER JOIN Dress ON OrderList.DressID = Dress.DressID WHERE (OrderList.OrderID = [Order].OrderID) FOR XML PATH('')), 1, 1, '') AS Details FROM [Order] INNER JOIN Customer ON [Order].CustomerID = Customer.CustomerID WHERE ([Order].InstitutionID = @InstitutionID) AND ([Order].DeliveryStatus IN( N'Pending',N'PartlyDelivered')) AND ([Order].WorkStatus IN( N'incomplete',N'PartlyCompleted')) AND (Customer.Phone Like @Phone + '%') AND ([OrderSerialNumber] Like  @OrderSerialNumber) AND([Order].OrderDate BETWEEN ISNULL(@Fdate,'1-1-1760') AND ISNULL(@TDate,'1-1-3760')) AND (ISNULL(Customer.CustomerName,'') Like @CustomerName + '%') AND (ISNULL(Customer.Address,'') Like @Address+ '%') Order By [Order].OrderSerialNumber  desc"
            OnSelected="CustomerOrderdDressSQL_Selected" CancelSelectOnNullParameter="False">
            <SelectParameters>
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
               <asp:ControlParameter ControlID="MobileNoTextBox" DefaultValue="%" Name="Phone" PropertyName="Text" />
               <asp:ControlParameter ControlID="OrderNoTextBox" DefaultValue="%" Name="OrderSerialNumber" PropertyName="Text" />
               <asp:ControlParameter ControlID="FromDateTextBox" DefaultValue="" Name="Fdate" PropertyName="Text" />
               <asp:ControlParameter ControlID="ToDateTextBox" DefaultValue="" Name="TDate" PropertyName="Text" />
               <asp:ControlParameter ControlID="SearchNameTextBox" DefaultValue="%" Name="CustomerName" PropertyName="Text" />
               <asp:ControlParameter ControlID="AddressTextBox" DefaultValue="%" Name="Address" PropertyName="Text" />
            </SelectParameters>
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

   <script src="../../JS/DatePicker/jquery.datepick.js"></script>
   <script type="text/javascript">
      $(function () {
         $(".Datetime").datepick()

         if ($("input:radio:checked").val() == "Order No. And Mobile No.") {
            $('.Search_Date').hide();
         }
         else { $('.Search_Number').hide(); }

      });

      /**Submit form on Enter key**/
      $(".textbox").keyup(function (a) { 13 == a.keyCode && $("[id*=FindButton]").click() });

      $('input[type="radio"]').change(function () {
         if (this.value == "Order No. And Mobile No.") {
            $('.Search_Number').stop(true, true).show(500);
            $('.Search_Date').stop(true, true).hide(500);
            $("[id*=FromDateTextBox]").val(null);
            $("[id*=ToDateTextBox]").val(null);
         }

         if (this.value == "Order Date") {
            $('.Search_Number').stop(true, true).hide(500);
            $('.Search_Date').stop(true, true).show(500);
            $('.textbox').val(null);
         }
      });


      /**Empty Text**/
      $("[id*=OrderNoTextBox]").focus(function () { $("[id*=MobileNoTextBox]").val(""); $("[id*=SearchNameTextBox]").val(""); $("[id*=AddressTextBox]").val("") }); $("[id*=MobileNoTextBox]").focus(function () { $("[id*=OrderNoTextBox]").val(""); $("[id*=SearchNameTextBox]").val(""); $("[id*=AddressTextBox]").val("") }); $("[id*=SearchNameTextBox]").focus(function () { $("[id*=OrderNoTextBox]").val(""); $("[id*=MobileNoTextBox]").val("") }); $("[id*=AddressTextBox]").focus(function () { $("[id*=OrderNoTextBox]").val(""); $("[id*=MobileNoTextBox]").val("") });

      /**For Updatepanel**/
      Sys.WebForms.PageRequestManager.getInstance().add_endRequest(function (a, b) {
         $(".Datetime").datepick();

         if ($("input:radio:checked").val() == "Order No. And Mobile No.") {
            $('.Search_Date').hide();
         }
         else { $('.Search_Number').hide(); }

         $('input[type="radio"]').change(function () {
            if (this.value == "Order No. And Mobile No.") {
               $('.Search_Number').stop(true, true).show(500);
               $('.Search_Date').stop(true, true).hide(500);
               $("[id*=FromDateTextBox]").val(null);
               $("[id*=ToDateTextBox]").val(null);
            }

            if (this.value == "Order Date") {
               $('.Search_Number').stop(true, true).hide(500);
               $('.Search_Date').stop(true, true).show(500);
               $('.textbox').val(null);
            }
         });

         /**Empty Text**/
         $("[id*=OrderNoTextBox]").focus(function () { $("[id*=MobileNoTextBox]").val(""); $("[id*=SearchNameTextBox]").val(""); $("[id*=AddressTextBox]").val("") }); $("[id*=MobileNoTextBox]").focus(function () { $("[id*=OrderNoTextBox]").val(""); $("[id*=SearchNameTextBox]").val(""); $("[id*=AddressTextBox]").val("") }); $("[id*=SearchNameTextBox]").focus(function () { $("[id*=OrderNoTextBox]").val(""); $("[id*=MobileNoTextBox]").val("") }); $("[id*=AddressTextBox]").focus(function () { $("[id*=OrderNoTextBox]").val(""); $("[id*=MobileNoTextBox]").val("") });

         $(function () {
            //get date in label
            var from = $("[id*=FromDateTextBox]").val();
            var To = $("[id*=ToDateTextBox]").val();

            var tt;
            var Brases1 = "";
            var Brases2 = "";
            var A = "";
            var B = "";
            var TODate = "";

            if (To == "" || from == "" || To == "" && from == "") {
               tt = "";
               A = "";
               B = "";
            }
            else {
               tt = " থেকে ";
               Brases1 = "(";
               Brases2 = ")";
            }

            if (To == "" && from == "") { Brases1 = ""; }

            if (To == from) {
               TODate = "";
               tt = "";
               var Brases1 = "";
               var Brases2 = "";
            }
            else { TODate = To; }

            if (from == "" && To != "") {
               B = " এর পূর্বে ";
            }

            if (To == "" && from != "") {
               A = " এর পরে ";
            }

            if (from != "" && To != "") {
               A = "";
               B = "";
            }

            $(".Date").text(Brases1 + from + tt + TODate + B + A + Brases2)
         });
      })

      function isNumberKey(a) { a = a.which ? a.which : event.keyCode; return 46 != a && 31 < a && (48 > a || 57 < a) ? !1 : !0 };
   </script>
</asp:Content>
