<%@ Page Title="Order And Delivery Report" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Order_And_Delivery_Report_By_Date.aspx.cs" Inherits="TailorBD.AccessAdmin.Reports.Order_And_Delivery_Report_By_Date" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <link href="../../JS/DatePicker/jquery.datepick.css" rel="stylesheet" />
   <link href="../../JS/jq_Profile/css/Profile_jquery-ui-1.8.23.custom.css" rel="stylesheet" />
   <link href="CSS/Report_Print.css" rel="stylesheet" />
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <h3>Order And Delivery Report (By Default Show Today's Report)</h3>
   <asp:TextBox ID="FromDateTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" CssClass="Datetime" placeholder="From date" ToolTip="From Date"></asp:TextBox>
   <asp:TextBox ID="ToDateTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" CssClass="Datetime" placeholder="To date" ToolTip="To Date"></asp:TextBox>
   <asp:Button ID="ShowButton" runat="server" Text="Find By Date" CssClass="ContinueButton" />

   <div id="main">
      <ul>
          <li><a href="#Order_Delivery">Order Delivered Details</a></li>
         <li><a href="#Order">Order Summary</a></li>
         <li><a href="#Delivery">Delivered Summary</a></li>
      </ul>


       <div id="Order_Delivery">
           <asp:GridView ID="Order_Delivery_GridView" runat="server" AllowPaging="True" AutoGenerateColumns="False" CssClass="mGrid" DataSourceID="Order_DeliverySQL" PageSize="100">
               <Columns>
                   <asp:BoundField DataField="OrderDate" DataFormatString="{0:d MMM yyyy}" HeaderText="অর্ডার তারিখ" SortExpression="OrderDate" />
                   <asp:BoundField DataField="OrderSerialNumber" HeaderText="অর্ডার নং" SortExpression="OrderSerialNumber" />
                   <asp:BoundField DataField="CustomerName" HeaderText="নাম" SortExpression="CustomerName" />
                   <asp:BoundField DataField="Phone" HeaderText="মোবাইল" SortExpression="Phone" />
                   <asp:BoundField DataField="Details" HeaderText="অর্ডারের বিবরণ" ReadOnly="True" SortExpression="Details" />
                   <asp:BoundField DataField="OrderAmount" HeaderText="মোট টাকা" SortExpression="OrderAmount" />
                   <asp:BoundField DataField="Discount" HeaderText="ছাড়" SortExpression="Discount" />
                   <asp:BoundField DataField="PaidAmount" HeaderText="পরিশোধ" SortExpression="PaidAmount" />
                   <asp:BoundField DataField="DueAmount" HeaderText="বাকি" ReadOnly="True" SortExpression="DueAmount" />
                   <asp:BoundField DataField="Update_DeliveryDate" DataFormatString="{0:d MMM yyyy}" HeaderText="ডেলিভারী তারিখ" SortExpression="Update_DeliveryDate" />
               </Columns>
               <PagerStyle CssClass="pgr" />
           </asp:GridView>
           <asp:SqlDataSource ID="Order_DeliverySQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT DISTINCT [Order].OrderDate, [Order].OrderSerialNumber, Customer.Phone, Customer.CustomerName, [Order].OrderAmount, [Order].Discount, [Order].PaidAmount, [Order].DueAmount, [Order].DeliveryDate, [Order].Update_DeliveryDate,  [Order].DeliveryStatus, STUFF((SELECT '; ' + D.Dress_Name + ' ' + CAST(OL.DressQuantity AS NVARCHAR(50)) + ' Piece ' FROM OrderList AS OL INNER JOIN  Dress AS D ON OL.DressID = D.DressID WHERE (OL.OrderID = [Order].OrderID)   FOR XML PATH('')), 1, 1, '') AS Details FROM  Customer INNER JOIN[Order] ON Customer.CustomerID = [Order].CustomerID WHERE ([Order].InstitutionID = @InstitutionID) AND ([Order].OrderDate BETWEEN ISNULL(@Fdate, N'1-1-1000') AND ISNULL(@TDate, N'1-1-3000')) ORDER BY [Order].OrderDate, [Order].OrderSerialNumber">
               <SelectParameters>
                   <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                   <asp:ControlParameter ControlID="FromDateTextBox" Name="Fdate" PropertyName="Text" />
                   <asp:ControlParameter ControlID="ToDateTextBox" Name="TDate" PropertyName="Text" />
               </SelectParameters>
           </asp:SqlDataSource>
       </div>

      <div id="Order">
         <div class="Order">
            <div class="Title">
               <label class="Date"></label>
               অর্ডারের বিবরণ
            </div>
            <asp:FormView ID="TDFormView" runat="server" DataSourceID="OrderDressQuantitySQL">
               <ItemTemplate>
                  <div class="DSummery">
                     সর্বমোট অর্ডার
                     <asp:Label ID="New_OrderLabel" runat="server" Text='<%# Bind("New_Order") %>' CssClass="Amount" />
                     টি
                  </div>
                  <div class="DSummery">
                     সর্বমোট পোষাক
                     <asp:Label ID="Total_DressLabel" runat="server" Text='<%# Bind("Total_Dress") %>' CssClass="Amount" />
                     টি
                  </div>
               </ItemTemplate>
            </asp:FormView>
            <asp:SqlDataSource ID="OrderDressQuantitySQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="select * from (SELECT COUNT(*) AS New_Order
FROM [Order] WHERE (InstitutionID =@InstitutionID) and OrderDate between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')) as Order_Table,
(SELECT  ISNULL(SUM(OrderList.DressQuantity),0) AS Total_Dress   FROM  [Order] INNER JOIN OrderList ON [Order].OrderID = OrderList.OrderID INNER JOIN Dress ON OrderList.DressID = Dress.DressID
WHERE ([Order].InstitutionID =@InstitutionID) and [Order].OrderDate between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')) as Dress_Table">
               <SelectParameters>
                  <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                  <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                  <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
               </SelectParameters>
            </asp:SqlDataSource>

            <asp:DataList ID="DressQuantityDataList" runat="server" DataSourceID="DressQuantitySQL" RepeatColumns="4" RepeatDirection="Horizontal" Width="100%">
               <ItemTemplate>
                  <div class="Dress_Details">
                     <asp:Label ID="Dress_NameLabel" runat="server" Text='<%# Eval("Dress_Name") %>' />
                     <asp:Label ID="Number_Of_DressLabel" runat="server" Text='<%# Eval("Number_Of_Dress") %>' CssClass="Amount" />
                     টি
                  </div>
               </ItemTemplate>
            </asp:DataList>
            <asp:SqlDataSource ID="DressQuantitySQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Dress.Dress_Name, SUM(OrderList.DressQuantity) AS Number_Of_Dress FROM  [Order] INNER JOIN OrderList ON [Order].OrderID = OrderList.OrderID INNER JOIN  Dress ON OrderList.DressID = Dress.DressID
WHERE ([Order].InstitutionID =@InstitutionID) and [Order].OrderDate between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')
GROUP BY Dress.Dress_Name  order by Number_Of_Dress desc">
               <SelectParameters>
                  <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                  <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                  <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
               </SelectParameters>
            </asp:SqlDataSource>
         </div>

         <div class="Order">
            <div class="Title">
               <label class="Date"></label>
               অর্ডারের পেমেন্ট
            </div>
            <asp:FormView ID="OAFormView" runat="server" DataSourceID="OrderPaidDueSQL" Width="100%">
               <ItemTemplate>
                  <div class="DSummery">
                     <div>সর্বমোট</div>
                     <asp:Label ID="Total_AmountLabel" runat="server" Text='<%# Bind("Total_Amount","{0:n}") %>' CssClass="Amount" />
                     টাকা
                  </div>

                  <div class="DSummery">
                     <div>নগত</div>
                     <asp:Label ID="Total_PaidLabel" runat="server" Text='<%# Bind("Total_Paid","{0:n}") %>' CssClass="Amount" />
                     টাকা
                  </div>

                  <div class="DSummery">
                     <div>ছাড়</div>
                     <asp:Label ID="Total_DiscountLabel" runat="server" Text='<%# Bind("Total_Discount","{0:n}") %>' CssClass="Amount" />
                     টাকা
                  </div>

                  <div class="DSummery">
                     <div>বাকি</div>
                     <asp:Label ID="Total_DueLabel" runat="server" Text='<%# Bind("Total_Due","{0:n}") %>' CssClass="Amount" />
                     টাকা
                  </div>
               </ItemTemplate>
            </asp:FormView>
            <asp:SqlDataSource ID="OrderPaidDueSQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="select * from (SELECT  ISNULL(SUM(OrderAmount),0) AS Total_Amount,ISNULL(SUM(Discount),0) AS Total_Discount, ISNULL(SUM(PaidAmount),0) AS Total_Paid,  ISNULL(SUM(DueAmount),0) AS Total_Due
FROM [Order] WHERE (InstitutionID =@InstitutionID) and OrderDate between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')) as Amount_Table">
               <SelectParameters>
                  <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                  <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                  <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
               </SelectParameters>
            </asp:SqlDataSource>
         </div>

         <div class="Order">
            <div class="Title">
               <label class="Date"></label>
               কাস্টমারের বিবরণ
            </div>
            <asp:FormView ID="CDFormView" runat="server" DataSourceID="CustomerOrderSQL" Width="100%">
               <ItemTemplate>
                  <div class="DSummery">
                     নতুন কাস্টমার অর্ডার দিয়েছে
                     <asp:Label ID="OrderBy_New_CustomerLabel" runat="server" Text='<%# Bind("OrderBy_New_Customer") %>' CssClass="Amount" />
                     জন 
                  </div>
                  <div class="DSummery">
                     পুরাতন কাস্টমার অর্ডার দিয়েছে
                     <asp:Label ID="OrderBy_Old_CustomerLabel" runat="server" Text='<%# Bind("OrderBy_Old_Customer") %>' CssClass="Amount" />
                     জন  
                  </div>
               </ItemTemplate>
            </asp:FormView>
            <asp:SqlDataSource ID="CustomerOrderSQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" ProviderName="<%$ ConnectionStrings:TailorBDConnectionString.ProviderName %>" SelectCommand="select * from 
(SELECT COUNT(*) AS OrderBy_New_Customer FROM Customer WHERE CustomerID in(SELECT distinct Customer.CustomerID FROM Customer INNER JOIN  [Order] ON Customer.CustomerID = [Order].CustomerID WHERE ([Order].InstitutionID =@InstitutionID) and [Order].OrderDate between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')) 
and Customer.Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')) as New_Customer_Table
,(SELECT COUNT(*) AS OrderBy_Old_Customer FROM Customer WHERE CustomerID in(SELECT distinct Customer.CustomerID FROM Customer INNER JOIN  [Order] ON Customer.CustomerID = [Order].CustomerID WHERE ([Order].InstitutionID =@InstitutionID) and [Order].OrderDate between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')) 
and Customer.Date not between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')) as Old_Customer_Table">
               <SelectParameters>
                  <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                  <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                  <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
               </SelectParameters>
            </asp:SqlDataSource>
         </div>
      </div>

      <div id="Delivery">
         <div class="Order">
            <div class="Title">
               <label class="Date"></label>
               যে সকল পোষাক ডেলিভারী দিতে হবে
            </div>
            <asp:FormView ID="DDFormView" runat="server" DataSourceID="DressDelivery_TargetSQL" Width="100%">
               <ItemTemplate>
                  <div class="DSummery">
                     ডেলিভারী দিতে হবে:
                     <asp:Label ID="Dress_HaveTo_DeliveryLabel" runat="server" Text='<%# Bind("Dress_HaveTo_Delivery") %>' CssClass="Amount" />
                     <br />
                     <asp:Label ID="Complete_DressLabel" runat="server" Text='<%# Bind("Complete_Dress") %>' CssClass="Complete" />
                     <asp:Label ID="Incomplete_DressLabel" runat="server" Text='<%# Bind("Incomplete_Dress") %>' CssClass="InComplete" />
                  </div>
               </ItemTemplate>
            </asp:FormView>
            <asp:SqlDataSource ID="DressDelivery_TargetSQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT ISNULL(SUM(OrderList.Pending_Delivery),0) AS Dress_HaveTo_Delivery,ISNULL(SUM(OrderList.ReadyForDeliveryQuantity),0) AS Complete_Dress ,ISNULL(SUM(OrderList.Pending_Work),0) AS Incomplete_Dress FROM  [Order] INNER JOIN OrderList ON [Order].OrderID = OrderList.OrderID INNER JOIN Dress ON OrderList.DressID = Dress.DressID 
WHERE ([Order].InstitutionID =@InstitutionID) and [Order].DeliveryDate between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')">
               <SelectParameters>
                  <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                  <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                  <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
               </SelectParameters>
            </asp:SqlDataSource>

            <asp:DataList ID="DeliveryDDetailsDataList" runat="server" DataSourceID="Delivery_DressDetailsSQL" RepeatDirection="Horizontal" RepeatColumns="4" Width="100%">
               <ItemTemplate>
                  <div class="Dress_Details">
                     <asp:Label ID="Dress_NameLabel" runat="server" Text='<%# Eval("Dress_Name") %>' />
                     <asp:Label ID="Number_Of_DressLabel" runat="server" Text='<%# Eval("Pending_Dress_For_Delivery") %>' CssClass="Amount" />
                     <br />
                     <asp:Label ID="Complete_DressLabel" runat="server" Text='<%# Eval("Complete_Dress") %>' CssClass="Complete" />
                     <asp:Label ID="IncompleteLabel" runat="server" Text='<%# Eval("Incomplete") %>' CssClass="InComplete" />
                  </div>
               </ItemTemplate>
            </asp:DataList>
            <asp:SqlDataSource ID="Delivery_DressDetailsSQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Dress.Dress_Name,SUM(Pending_Delivery) AS Pending_Dress_For_Delivery ,SUM(OrderList.ReadyForDeliveryQuantity) AS Complete_Dress,SUM(OrderList.Pending_Work) AS Incomplete  FROM  [Order] INNER JOIN
OrderList ON [Order].OrderID = OrderList.OrderID INNER JOIN Dress ON OrderList.DressID = Dress.DressID WHERE([Order].InstitutionID =@InstitutionID) and (Order_DeliveryStatus &lt;&gt;  N'Delivered') and [Order].DeliveryDate between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')
GROUP BY Dress.Dress_Name order by Pending_Dress_For_Delivery  desc">
               <SelectParameters>
                  <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                  <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                  <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
               </SelectParameters>
            </asp:SqlDataSource>
         </div>
         <div class="Order">
            <div class="Title">
               <label class="Date"></label>
               যে সকল পোষাক ডেলিভারী দেওয়া হয়েছে
            
            </div>
            <asp:FormView ID="DeliveredPaidFormView" runat="server" DataSourceID="DeliveredPaid_SQL">
               <ItemTemplate>
                  <div class="DSummery">
                     ডেলিভারী দেওয়া হয়েছে
                    <asp:Label ID="Dress_DeliveredLabel" runat="server" Text='<%# Bind("Dress_Delivered") %>' CssClass="Amount" />
                     টি
                   <br />
                     মোট প্রাপ্ত
                     <asp:Label ID="RADLabel" runat="server" Text='<%# Bind("Received_Amount_When_Delivered","{0:n}") %>' CssClass="Amount" />
                     টাকা
                  </div>
               </ItemTemplate>
            </asp:FormView>
            <asp:SqlDataSource ID="DeliveredPaid_SQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="Select (SELECT ISNULL(SUM(DQuantity),0) FROM Order_Delivery_Date WHERE  (InstitutionID = @InstitutionID)  and DeliveryInsertDate between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')) AS Dress_Delivered,
(SELECT  ISNULL(SUM(Amount),0)  FROM Payment_Record WHERE (Payment_TimeStatus = N'Delivery') and  (InstitutionID = @InstitutionID)  and OrderPaid_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')) AS Received_Amount_When_Delivered
">
               <SelectParameters>
                  <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                  <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                  <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
               </SelectParameters>
            </asp:SqlDataSource>

            <asp:DataList ID="DeliveredDDDataList" runat="server" DataSourceID="DeliveredDDSQL" RepeatColumns="4" RepeatDirection="Horizontal" Width="100%">
               <ItemTemplate>
                  <div class="Dress_Details">
                     <asp:Label ID="Dress_NameLabel" runat="server" Text='<%# Eval("Dress_Name") %>' />

                     <asp:Label ID="Dress_DeliveredLabel" runat="server" Text='<%# Eval("Dress_Delivered") %>' CssClass="Amount" />
                     টি
                  </div>
               </ItemTemplate>
            </asp:DataList>
            <asp:SqlDataSource ID="DeliveredDDSQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT  Dress.Dress_Name,  SUM(Order_Delivery_Date.DQuantity) AS Dress_Delivered
FROM Order_Delivery_Date INNER JOIN OrderList ON Order_Delivery_Date.OrderListID = OrderList.OrderListID INNER JOIN Dress ON OrderList.DressID = Dress.DressID
WHERE (Order_Delivery_Date.InstitutionID = @InstitutionID) and Order_Delivery_Date.DeliveryInsertDate between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')
GROUP BY Dress.Dress_Name order by Dress_Delivered desc">
               <SelectParameters>
                  <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                  <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                  <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
               </SelectParameters>
            </asp:SqlDataSource>
         </div>
      </div>
   </div>

   <p>Provided by tailorbd.com © 2015-2016</p>

   <script src="../../JS/DatePicker/jquery.datepick.js"></script>
   <script src="../../JS/jq_Profile/jquery-ui-1.8.23.custom.min.js"></script>
   <script type="text/javascript">
      $(function () {
         $('#main').tabs();
         $(".Datetime").datepick();

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
      function isNumberKey(a) { a = a.which ? a.which : event.keyCode; return 46 != a && 31 < a && (48 > a || 57 < a) ? !1 : !0 };
   </script>
</asp:Content>
