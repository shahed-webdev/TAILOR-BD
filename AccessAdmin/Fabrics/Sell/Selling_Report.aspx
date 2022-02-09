<%@ Page Title="ফেব্রিক্স বিক্রয় বিবরণ" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Selling_Report.aspx.cs" Inherits="TailorBD.AccessAdmin.Fabrics.Sell.Selling_Report" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <link href="../../../JS/DatePicker/jquery.datepick.css" rel="stylesheet" />
   <link href="CSS/Report_Print.css" rel="stylesheet" />
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <h3>ফেব্রিক্স বিক্রয় ও ফেরতের বিবরণ</h3>
   <asp:TextBox ID="FromDateTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" CssClass="Datetime" placeholder="From date" ToolTip="From Date"></asp:TextBox>
   <asp:TextBox ID="ToDateTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" CssClass="Datetime" placeholder="To date" ToolTip="To Date"></asp:TextBox>
   <asp:Button ID="ShowButton" runat="server" Text="Find By Date" CssClass="ContinueButton" />

   <asp:FormView ID="FormView1" runat="server" DataSourceID="TotalPaidSQL">
      <ItemTemplate>
      <div class="Amount_Date">
         <label class="Date"></label>
         মোট প্রাপ্ত টাকা:
         <asp:Label ID="Paid_Amount_Specific_DatesLabel" runat="server" Text='<%# Bind("Paid_Amount_Specific_Dates") %>' /> টাকা
         </div>
      </ItemTemplate>
   </asp:FormView>
   <asp:SqlDataSource ID="TotalPaidSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT SUM(SellingPaidAmount) AS Paid_Amount_Specific_Dates FROM  Fabrics_Selling_PaymentRecord
WHERE (InstitutionID = @InstitutionID) and SellingPaid_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')"
      CancelSelectOnNullParameter="False">
      <SelectParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
         <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
         <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
      </SelectParameters>
   </asp:SqlDataSource>

   <div class="Title">
      <label class="Date"></label>
      বিক্রয় বিবরণ</div>
   <asp:FormView ID="FormView2" runat="server" DataSourceID="SellingPaidSQL">
      <ItemTemplate>
         <div class="HeadLine">
            মোট পেইড:
         <asp:Label ID="Total_Paid_By_Selling_DateLabel" runat="server" Text='<%# Bind("Total_Paid_By_Selling_Date") %>' CssClass="Amount" />
           টাকা
         </div>
         <div class="HeadLine">
            মোট বাকি:
         <asp:Label ID="Total_Due_By_Selling_DateLabel" runat="server" Text='<%# Bind("Total_Due_By_Selling_Date") %>' CssClass="Amount" />
             টাকা
         </div>
      </ItemTemplate>
   </asp:FormView>
   <asp:SqlDataSource ID="SellingPaidSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT SUM(SellingPaidAmount) AS Total_Paid_By_Selling_Date, SUM(SellingDueAmount) AS Total_Due_By_Selling_Date FROM Fabrics_Selling
WHERE (InstitutionID = @InstitutionID) and SellingDate between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')"
      CancelSelectOnNullParameter="False">
      <SelectParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
         <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
         <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
      </SelectParameters>
   </asp:SqlDataSource>

   <asp:DataList ID="DataList1" runat="server" DataKeyField="FabricID" DataSourceID="SellingDetailsSQL" RepeatDirection="Horizontal" RepeatColumns="4" Width="100%">
      <ItemTemplate>
         <div class="S_Details">
            <div class="Amount">
               <asp:Label ID="FabricCodeLabel" runat="server" Text='<%# Eval("FabricCode") %>' />
               (<asp:Label ID="FabricsNameLabel" runat="server" Text='<%# Eval("FabricsName") %>' />)
            </div>

            <asp:Label ID="Fabrics_Selling_QuantityLabel" runat="server" Text='<%# Eval("Fabrics_Selling_Quantity") %>' />
            (<asp:Label ID="UnitNameLabel" runat="server" Text='<%# Eval("UnitName") %>' />)
         </div>
      </ItemTemplate>
   </asp:DataList>
   <asp:SqlDataSource ID="SellingDetailsSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT TT.FabricID, Fabrics.FabricsName, Fabrics.FabricCode, Fabrics_Mesurement_Unit.UnitName, TT.Fabrics_Selling_Quantity FROM Fabrics_Mesurement_Unit INNER JOIN Fabrics ON Fabrics_Mesurement_Unit.FabricMesurementUnitID = Fabrics.FabricMesurementUnitID INNER JOIN (SELECT FabricID, SUM(Fabrics_Selling_Quantity) AS Fabrics_Selling_Quantity FROM (SELECT FabricID, Unit AS Fabrics_Selling_Quantity, Date AS SellingDate FROM Order_Payment WHERE (NOT (FabricID IS NULL)) AND (InstitutionID = @InstitutionID) AND (Date BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000')) UNION ALL SELECT Fabrics_Selling_List.FabricID, Fabrics_Selling_List.SellingQuantity AS Fabrics_Selling_Quantity, Fabrics_Selling.SellingDate FROM Fabrics_Selling_List INNER JOIN Fabrics_Selling ON Fabrics_Selling_List.FabricsSellingID = Fabrics_Selling.FabricsSellingID WHERE (Fabrics_Selling_List.InstitutionID = @InstitutionID) AND (Fabrics_Selling.SellingDate BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000'))) AS T GROUP BY FabricID) AS TT ON Fabrics.FabricID = TT.FabricID ORDER BY TT.Fabrics_Selling_Quantity DESC"
      CancelSelectOnNullParameter="False">
      <SelectParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
         <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
         <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
      </SelectParameters>
   </asp:SqlDataSource>

   <div class="Title">
      <label class="Date"></label>
      ফেরতের বিবরণ</div>
   <asp:FormView ID="FormView3" runat="server" DataSourceID="ReturnAmountSQL">
      <ItemTemplate>
         <div class="HeadLine">
            মোট ফেরত:
          <asp:Label ID="Return_Amount_Specific_DatesLabel" runat="server" Text='<%# Bind("Return_Amount_Specific_Dates") %>' CssClass="Amount" /> টাকা
         </div>
      </ItemTemplate>
   </asp:FormView>
   <asp:SqlDataSource ID="ReturnAmountSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT SUM(SellingReturnPrice) AS Return_Amount_Specific_Dates FROM Fabrics_Selling_Return_Price
WHERE (InstitutionID = @InstitutionID) and ReturnDate between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')"
      CancelSelectOnNullParameter="False">
      <SelectParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
         <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
         <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
      </SelectParameters>
   </asp:SqlDataSource>

   <asp:DataList ID="DataList2" runat="server" DataKeyField="FabricID" DataSourceID="ReturnDetailsSQL" RepeatDirection="Horizontal" RepeatColumns="4" Width="100%">
      <ItemTemplate>
      <div class="S_Details">
          <div class="Amount">
         <asp:Label ID="FabricCodeLabel" runat="server" Text='<%# Eval("FabricCode") %>' />
         (<asp:Label ID="FabricsNameLabel" runat="server" Text='<%# Eval("FabricsName") %>' />)
          </div>
         Return:
         <asp:Label ID="Fabrics_Return_QuantityLabel" runat="server" Text='<%# Eval("Fabrics_Return_Quantity") %>' />
         (<asp:Label ID="UnitNameLabel" runat="server" Text='<%# Eval("UnitName") %>' />)
      </div>
      </ItemTemplate>

   </asp:DataList>
   <asp:SqlDataSource ID="ReturnDetailsSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Fabrics.FabricID, Fabrics.FabricsName, Fabrics.FabricCode, SUM(Fabrics_Selling_Return_Quantity.ReturnSellingQuantity) AS Fabrics_Return_Quantity, Fabrics_Mesurement_Unit.UnitName
FROM Fabrics_Selling_Return_Quantity INNER JOIN Fabrics ON Fabrics_Selling_Return_Quantity.FabricID = Fabrics.FabricID INNER JOIN
Fabrics_Mesurement_Unit ON Fabrics.FabricMesurementUnitID = Fabrics_Mesurement_Unit.FabricMesurementUnitID
WHERE (Fabrics_Selling_Return_Quantity.InstitutionID = @InstitutionID) AND (Fabrics_Selling_Return_Quantity.ReturnDate BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000'))
GROUP BY Fabrics.FabricCode, Fabrics_Mesurement_Unit.UnitName, Fabrics.FabricsName, Fabrics.FabricID ORDER BY Fabrics_Return_Quantity DESC"
      CancelSelectOnNullParameter="False">
      <SelectParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
         <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
         <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
      </SelectParameters>
   </asp:SqlDataSource>

   <script src="../../../JS/DatePicker/jquery.datepick.js"></script>
   <script type="text/javascript">
      $(function () {
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


         if (To != "" || from != "") {
            $(".Amount_Date").show();
         }
         else { $(".Amount_Date").hide(); }
      });
      function isNumberKey(a) { a = a.which ? a.which : event.keyCode; return 46 != a && 31 < a && (48 > a || 57 < a) ? !1 : !0 };
   </script>
</asp:Content>
