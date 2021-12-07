<%@ Page Title="ডেলিভারী কৃত পোশাক" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Delivered_Works.aspx.cs" Inherits="TailorBD.AccessAdmin.Delivery.Delivered_Works" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <link href="CSS/IncompleteWork.css" rel="stylesheet" />
   <link href="../../JS/DatePicker/jquery.datepick.css" rel="stylesheet" />
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <asp:ScriptManager ID="ScriptManager1" runat="server"></asp:ScriptManager>
   <h3>যে সকল অর্ডার ডেলিভারি দিয়েছেন</h3>

   <asp:UpdatePanel ID="UpdatePanel1" runat="server">
      <ContentTemplate>

         <asp:RadioButtonList ID="FindRadioButtonList" runat="server" RepeatDirection="Horizontal" RepeatLayout="Flow" CssClass="RadioB">
            <asp:ListItem Selected="True">Order No. And Mobile No.</asp:ListItem>
            <asp:ListItem>Delivery Date</asp:ListItem>
         </asp:RadioButtonList>
         <div class="Search_Number">
            <table>
               <tr>
                  <td>
                     <asp:RegularExpressionValidator ID="RegularExpressionValidator4" runat="server" ControlToValidate="MobileNoTextBox" CssClass="EroorSummer" ErrorMessage="শুধু ইংরেজী নাম্বার লেখা যাবে" ValidationExpression="^\d+$" ValidationGroup="1"></asp:RegularExpressionValidator>
                  </td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
               </tr>
               <tr>
                  <td>মোবাইল নাম্বার</td>
                  <td>কাস্টমারের নাম</td>
                  <td>&nbsp;</td>
               </tr>
               <tr>
                  <td>
                     <asp:TextBox ID="MobileNoTextBox" runat="server" CssClass="textbox" placeholder="মোবাইল নাম্বার" Width="200px"></asp:TextBox>
                  </td>
                  <td>
                     <asp:TextBox ID="SearchNameTextBox" runat="server" CssClass="textbox" placeholder="কাস্টমারের নাম" Width="200px"></asp:TextBox>
                  </td>
                  <td>&nbsp;</td>
               </tr>
               <tr>
                  <td>অর্ডার নাম্বার (এক বা একাধিক)</td>
                  <td>ঠিকানা</td>
                  <td>&nbsp;</td>
               </tr>
               <tr>
                  <td>
                     <asp:TextBox ID="OrderNoTextBox" placeholder="উদাহরণস্বরূপ: অর্ডার নাম্বার 10,20,30" runat="server" CssClass="textbox" Height="72px" TextMode="MultiLine" Width="200px"></asp:TextBox>
                  </td>
                  <td>
                     <asp:TextBox ID="AddressTextBox" runat="server" CssClass="textbox" Height="72px" placeholder="ঠিকানা" TextMode="MultiLine" Width="200px"></asp:TextBox>
                  </td>
                  <td style="vertical-align: bottom">
                     <asp:Button ID="FindButton" runat="server" CssClass="SearchButton" />
                  </td>
               </tr>
               <tr>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td style="vertical-align: bottom">&nbsp;</td>
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
                     <asp:TextBox ID="FormDateTextBox" runat="server" CssClass="Datetime" placeholder="কোন তারিখ থেকে" Width="130px"></asp:TextBox>
                  </td>
                  <td>
                     <asp:TextBox ID="ToDateTextBox" runat="server" CssClass="Datetime" placeholder="কোন তারিখ পর্যন্ত" Width="130px"></asp:TextBox>
                  </td>
                  <td>
                     <asp:Button ID="FindButton2" runat="server" CssClass="SearchButton" />
                  </td>
               </tr>
               <tr>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
               </tr>
            </table>
         </div>

         <table style="font-size: 14px; font-weight: bold">
            <tr>
               <td>
                  <label class="Date"></label>
                  <asp:Label ID="TotalLabel" runat="server"></asp:Label>
               </td>
               <td>
                  <asp:FormView ID="DueFormView" runat="server" DataSourceID="DeliverdDueSQL">
                     <ItemTemplate>
                        (মোট বাকি: 
                        <asp:Label ID="Total_DueLabel" runat="server" Text='<%# Bind("Total_Due","{0:0.00}") %>' />
                        টাকা)

                     </ItemTemplate>
                  </asp:FormView>
                  <asp:SqlDataSource ID="DeliverdDueSQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT ISNULL(SUM(DueAmount),0) as Total_Due from (SELECT DISTINCT [Order].DueAmount
FROM Customer INNER JOIN [Order] ON Customer.CustomerID = [Order].CustomerID INNER JOIN
 Order_Delivery_Date  ON [Order].OrderID = Order_Delivery_Date.OrderID WHERE 
([Order].InstitutionID = @InstitutionID) AND 
([Order].DeliveryStatus = N'Delivered') AND
([Order].WorkStatus = N'Completed') AND 
(Customer.Phone Like '%' + ISNULL(@Phone,'%') + '%')  AND
([OrderSerialNumber] IN(Select id from dbo.In_Function_Parameter(@OrderSerialNumber)) OR @OrderSerialNumber = '0')AND 
(Order_Delivery_Date.DeliveryInsertDate BETWEEN ISNULL(@Fdate,'1-1-1000') AND ISNULL(@TDate,'1-1-3000')) AND
(ISNULL(Customer.CustomerName,'') Like '%' + ISNULL(@CustomerName,'%') + '%') AND
(ISNULL(Customer.Address,'') Like '%' + ISNULL(@Address,'%')+ '%')) as Due_Tabel">
                     <SelectParameters>
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                        <asp:ControlParameter ControlID="MobileNoTextBox" Name="Phone" PropertyName="Text" />
                        <asp:ControlParameter ControlID="OrderNoTextBox" DefaultValue="0" Name="OrderSerialNumber" PropertyName="Text" />
                        <asp:ControlParameter ControlID="FormDateTextBox" Name="Fdate" PropertyName="Text" />
                        <asp:ControlParameter ControlID="ToDateTextBox" Name="TDate" PropertyName="Text" />
                        <asp:ControlParameter ControlID="SearchNameTextBox" Name="CustomerName" PropertyName="Text" />
                        <asp:ControlParameter ControlID="AddressTextBox" Name="Address" PropertyName="Text" />
                     </SelectParameters>
                  </asp:SqlDataSource>
               </td>
            </tr>
         </table>
         <asp:GridView ID="CustomerOrderdDressGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="OrderID" DataSourceID="CustomerOrderdDressSQL" AllowPaging="True" PageSize="15" AllowSorting="True">
            <Columns>
               <asp:TemplateField>
                  <ItemTemplate>
                     <asp:HyperLink ID="PrintHyperLink" runat="server" NavigateUrl='<%# Eval("OrderID", "../Order/OrderDetailsForCustomer.aspx?OrderID={0}") %>' CssClass="Cmd_Print" />
                  </ItemTemplate>
                  <HeaderStyle CssClass="NoPrint" />
                  <ItemStyle CssClass="NoPrint" />
               </asp:TemplateField>
               <asp:TemplateField HeaderText="অর্ডার নং " SortExpression="OrderSerialNumber">
                  <ItemTemplate>
                     <asp:Label ID="Label1" runat="server" Font-Bold="True" Text='<%# Bind("OrderSerialNumber") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>

               <asp:TemplateField HeaderText="নাম" SortExpression="CustomerName">
                  <ItemTemplate>
                     (<asp:Label ID="Label1" runat="server" Text='<%# Bind("CustomerNumber") %>'></asp:Label>)
                  <asp:Label ID="Label2" runat="server" Text='<%# Bind("CustomerName") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:BoundField DataField="Phone" HeaderText="মোবাইল" SortExpression="Phone" />
               <asp:BoundField DataField="Address" HeaderText="ঠিকানা" SortExpression="Address" />
               <asp:BoundField DataField="Details" HeaderText="পোষাকের বিবরণ" SortExpression="Details" />
               <asp:BoundField DataField="OrderDate" HeaderText="অর্ডারের তারিখ" SortExpression="OrderDate" DataFormatString="{0:d MMM yyyy}" />
               <asp:BoundField DataField="DeliveryDate" HeaderText="ডেলিভারী তারিখ" SortExpression="DeliveryDate" DataFormatString="{0:d MMM yyyy}" />
               <asp:BoundField DataField="DeliveryInsertDate" HeaderText="ডেলিভারী" SortExpression="DeliveryInsertDate" DataFormatString="{0:d MMM yyyy}" />
                <asp:TemplateField HeaderText="বাকি টাকা" SortExpression="DueAmount">
                  <ItemTemplate>
                     <asp:Label ID="Label3" runat="server" Text='<%# Bind("DueAmount","{0:0.00}") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>
                <asp:BoundField DataField="OrderDetils" HeaderText="বিস্তারিত" SortExpression="OrderDetils"/>
            </Columns>
            <EmptyDataTemplate>
               Empty
            </EmptyDataTemplate>
            <PagerSettings FirstPageText="First" LastPageText="Last" Mode="NumericFirstLast" NextPageText="Next" />
            <PagerStyle CssClass="pgr " />
         </asp:GridView>
         <asp:SqlDataSource ID="CustomerOrderdDressSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
            SelectCommand="SELECT DISTINCT Order_Delivery_Date.OrderID,[Order].Details AS OrderDetils, [Order].OrderSerialNumber, Customer.CustomerNumber, Customer.CustomerName, Customer.Phone, Customer.Address, [Order].OrderDate, Order_Delivery_Date.DeliveryInsertDate,   [Order].DeliveryDate, [Order].DueAmount,
 STUFF((SELECT '; ' + D.Dress_Name + ' ' + CAST(ODD.DQuantity AS NVARCHAR(50)) + ' Piece ' FROM OrderList as OL INNER JOIN Dress AS D ON OL.DressID = D.DressID INNER JOIN Order_Delivery_Date AS ODD ON OL.OrderListID = ODD.OrderListID WHERE (ODD.OrderID = Order_Delivery_Date.OrderID) AND (ODD.DeliveryInsertDate = Order_Delivery_Date.DeliveryInsertDate)  FOR XML PATH('')), 1, 1, '') AS Details
FROM Customer INNER JOIN [Order] ON Customer.CustomerID = [Order].CustomerID INNER JOIN
 Order_Delivery_Date  ON [Order].OrderID = Order_Delivery_Date.OrderID WHERE 
([Order].InstitutionID = @InstitutionID) AND 
([Order].DeliveryStatus = N'Delivered') AND
([Order].WorkStatus = N'Completed') AND 
(Customer.Phone Like '%' + ISNULL(@Phone,'%') + '%')  AND
([OrderSerialNumber] IN(Select id from dbo.In_Function_Parameter(@OrderSerialNumber)) OR @OrderSerialNumber = '0')AND 
(Order_Delivery_Date.DeliveryInsertDate BETWEEN ISNULL(@Fdate,'1-1-1000') AND ISNULL(@TDate,'1-1-3000')) AND
(ISNULL(Customer.CustomerName,'') Like '%' + ISNULL(@CustomerName,'%') + '%') AND
(ISNULL(Customer.Address,'') Like '%' + ISNULL(@Address,'%')+ '%')
ORDER BY Order_Delivery_Date.DeliveryInsertDate, [Order].OrderSerialNumber"
            UpdateCommand="UPDATE [Order] SET WorkStatus = @WorkStatus, StoreDatails = @StoreDatails WHERE (OrderID = @OrderID)" OnSelected="CustomerOrderdDressSQL_Selected" CancelSelectOnNullParameter="False">
            <SelectParameters>
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
               <asp:ControlParameter ControlID="MobileNoTextBox" DefaultValue="" Name="Phone" PropertyName="Text" />
               <asp:ControlParameter ControlID="OrderNoTextBox" DefaultValue="0" Name="OrderSerialNumber" PropertyName="Text" Type="String" />
               <asp:ControlParameter ControlID="FormDateTextBox" DefaultValue="" Name="Fdate" PropertyName="Text" />
               <asp:ControlParameter ControlID="ToDateTextBox" DefaultValue="" Name="TDate" PropertyName="Text" />
               <asp:ControlParameter ControlID="SearchNameTextBox" DefaultValue="" Name="CustomerName" PropertyName="Text" />
               <asp:ControlParameter ControlID="AddressTextBox" DefaultValue="" Name="Address" PropertyName="Text" />
            </SelectParameters>
            <UpdateParameters>
               <asp:Parameter Name="WorkStatus" />
               <asp:Parameter Name="StoreDatails" />
               <asp:Parameter Name="OrderID" />
            </UpdateParameters>
         </asp:SqlDataSource>

      </ContentTemplate>
   </asp:UpdatePanel>


   <script src="../../JS/DatePicker/jquery.datepick.js"></script>
   <script type="text/javascript">
      $(function () {
         $(".Datetime").datepick();

         if ($("input:radio:checked").val() == "Order No. And Mobile No.") {
            $('.Search_Date').hide();
         }
         else { $('.Search_Number').hide(); }

         //get date in label
         var from = $("[id*=FormDateTextBox]").val();
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
            B = " এর পূর্বের ";
         }

         if (To == "" && from != "") {
            A = " এর পরের ";
         }

         if (from != "" && To != "") {
            A = "";
            B = "";
         }

         $(".Date").text(Brases1 + from + tt + TODate + B + A + Brases2)
      });

      $('input[type="radio"]').change(function () {
         if (this.value == "Order No. And Mobile No.") {
            $('.Search_Number').stop(true, true).show(500);
            $('.Search_Date').stop(true, true).hide(500);
            $('.Datetime').val(null);
         }

         if (this.value == "Delivery Date") {
            $('.Search_Number').stop(true, true).hide(500);
            $('.Search_Date').stop(true, true).show(500);
            $('.textbox').val(null);
         }
      });

      /**Empty Text**/
      $("[id*=OrderNoTextBox]").focus(function () { $("[id*=MobileNoTextBox]").val(""); $("[id*=SearchNameTextBox]").val(""); $("[id*=AddressTextBox]").val("") }); $("[id*=MobileNoTextBox]").focus(function () { $("[id*=OrderNoTextBox]").val(""); $("[id*=SearchNameTextBox]").val(""); $("[id*=AddressTextBox]").val("") }); $("[id*=SearchNameTextBox]").focus(function () { $("[id*=OrderNoTextBox]").val(""); $("[id*=MobileNoTextBox]").val("") }); $("[id*=AddressTextBox]").focus(function () { $("[id*=OrderNoTextBox]").val(""); $("[id*=MobileNoTextBox]").val("") });

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
               $('.Datetime').val(null);
            }

            if (this.value == "Delivery Date") {
               $('.Search_Number').stop(true, true).hide(500);
               $('.Search_Date').stop(true, true).show(500);
               $('.textbox').val(null);

            }
         });

         /**Empty Text**/
         $("[id*=OrderNoTextBox]").focus(function () { $("[id*=MobileNoTextBox]").val(""); $("[id*=SearchNameTextBox]").val(""); $("[id*=AddressTextBox]").val("") }); $("[id*=MobileNoTextBox]").focus(function () { $("[id*=OrderNoTextBox]").val(""); $("[id*=SearchNameTextBox]").val(""); $("[id*=AddressTextBox]").val("") }); $("[id*=SearchNameTextBox]").focus(function () { $("[id*=OrderNoTextBox]").val(""); $("[id*=MobileNoTextBox]").val("") }); $("[id*=AddressTextBox]").focus(function () { $("[id*=OrderNoTextBox]").val(""); $("[id*=MobileNoTextBox]").val("") });

         $(function () {
            //get date in label
            var from = $("[id*=FormDateTextBox]").val();
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

      /**Submit form on Enter key**/
      $(".textbox").keyup(function (a) { 13 == a.keyCode && $("[id*=FindButton]").click() });
   </script>



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
</asp:Content>
