<%@ Page Title="ফেব্রিক্স ক্রয়ের বিবরণ" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Buying_Report.aspx.cs" Inherits="TailorBD.AccessAdmin.Fabrics.Buying.Buying_Report" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <link href="../../../JS/DatePicker/jquery.datepick.css" rel="stylesheet" />
   <link href="CSS/Report_Print.css" rel="stylesheet" />
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <h3>ফেব্রিক্স ক্রয়ের বিবরণ</h3>
   <asp:TextBox ID="FromDateTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" CssClass="Datetime" placeholder="From date" ToolTip="From Date"></asp:TextBox>
   <asp:TextBox ID="ToDateTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" CssClass="Datetime" placeholder="To date" ToolTip="To Date"></asp:TextBox>
   <asp:Button ID="ShowButton" runat="server" Text="Find By Date" CssClass="ContinueButton" />


   <asp:FormView ID="FormView1" runat="server" DataSourceID="FabricPaidSQL">
      <ItemTemplate>
         <div class="Amount_Date">
            <label class="Date"></label>
            সর্বমোট পেইড:
         <asp:Label ID="Paid_Amount_Specific_DatesLabel" runat="server" Text='<%# Bind("Paid_Amount_Specific_Dates") %>' />
            টাকা
         </div>
      </ItemTemplate>
   </asp:FormView>
   <asp:SqlDataSource ID="FabricPaidSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT SUM(BuyingPaidAmount) AS Paid_Amount_Specific_Dates FROM  Fabrics_Buying_PaymentRecord WHERE (InstitutionID = @InstitutionID) and BuyingPaid_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')" CancelSelectOnNullParameter="False">
      <SelectParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
         <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
         <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
      </SelectParameters>
   </asp:SqlDataSource>

   <div class="Title">
      <label class="Date"></label>
     ক্রয়ের বিবরণ
   </div>
   <asp:FormView ID="FormView2" runat="server" DataSourceID="BuyingPaidSQL">
      <ItemTemplate>
         <div class="HeadLine">
            পেইড:
         <asp:Label ID="Total_Paid_By_Buying_DateLabel" runat="server" Text='<%# Bind("Total_Paid_By_Buying_Date") %>' CssClass="Amount" />
             টাকা
         </div>
         <div class="HeadLine">
             বাকি:
         <asp:Label ID="Total_Due_By_Buying_DateLabel" runat="server" Text='<%# Bind("Total_Due_By_Buying_Date") %>' CssClass="Amount" />
             টাকা
         </div>
      </ItemTemplate>
   </asp:FormView>
   <asp:SqlDataSource ID="BuyingPaidSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT SUM(BuyingPaidAmount) AS Total_Paid_By_Buying_Date, SUM(BuyingDueAmount) AS Total_Due_By_Buying_Date FROM Fabrics_Buying
WHERE (InstitutionID = @InstitutionID) and BuyingDate between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')"
      CancelSelectOnNullParameter="False">
      <SelectParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
         <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
         <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
      </SelectParameters>
   </asp:SqlDataSource>

   <asp:DataList ID="DataList1" runat="server" DataKeyField="FabricID" DataSourceID="BuyingFabricDeSQL" RepeatDirection="Horizontal" RepeatColumns="4" Width="100%">
      <ItemTemplate>
         <div class="S_Details">
            <div class="Amount">
               <asp:Label ID="FabricCodeLabel" runat="server" Text='<%# Eval("FabricCode") %>' />
               (<asp:Label ID="FabricsNameLabel" runat="server" Text='<%# Eval("FabricsName") %>' />)
            </div>
            ক্রয়ের পরিমান:
         <asp:Label ID="Fabrics_Buying_QuantityLabel" runat="server" Text='<%# Eval("Fabrics_Buying_Quantity") %>' />
            (<asp:Label ID="UnitNameLabel" runat="server" Text='<%# Eval("UnitName") %>' />)
         </div>
      </ItemTemplate>
   </asp:DataList>
   <asp:SqlDataSource ID="BuyingFabricDeSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Fabrics.FabricID, Fabrics.FabricsName, Fabrics.FabricCode, SUM(Fabrics_Buying_List.BuyingQuantity) AS Fabrics_Buying_Quantity, Fabrics_Mesurement_Unit.UnitName
FROM Fabrics_Buying_List INNER JOIN Fabrics_Buying ON Fabrics_Buying_List.FabricBuyingID = Fabrics_Buying.FabricBuyingID INNER JOIN
Fabrics ON Fabrics_Buying_List.FabricID = Fabrics.FabricID INNER JOIN Fabrics_Mesurement_Unit ON Fabrics.FabricMesurementUnitID = Fabrics_Mesurement_Unit.FabricMesurementUnitID
WHERE (Fabrics_Buying_List.InstitutionID = @InstitutionID) AND (Fabrics_Buying.BuyingDate BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000'))
GROUP BY Fabrics.FabricCode, Fabrics_Mesurement_Unit.UnitName, Fabrics.FabricsName, Fabrics.FabricID ORDER BY SUM(Fabrics_Buying_List.BuyingQuantity) DESC"
      CancelSelectOnNullParameter="False">
      <SelectParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
         <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
         <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
      </SelectParameters>
   </asp:SqlDataSource>

   <div class="Title">
      <label class="Date"></label>
      ফেরতের বিবরণ
   </div>
   <asp:FormView ID="FormView3" runat="server" DataSourceID="ReturnPaidSQL">
      <ItemTemplate>
         <div class="HeadLine">
            মোট ফেরত:
         <asp:Label ID="Return_Amount_Specific_DatesLabel" runat="server" Text='<%# Bind("Return_Amount_Specific_Dates") %>' />
             টাকা
         </div>
      </ItemTemplate>
   </asp:FormView>
   <asp:SqlDataSource ID="ReturnPaidSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT SUM(BuyingReturnPrice) AS Return_Amount_Specific_Dates FROM Fabrics_Buying_Return_Price
WHERE (InstitutionID = @InstitutionID) and Return_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')"
      CancelSelectOnNullParameter="False">
      <SelectParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
         <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
         <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
      </SelectParameters>
   </asp:SqlDataSource>

   <asp:DataList ID="DataList2" runat="server" DataKeyField="FabricID" DataSourceID="ReturnDetailsSQL" RepeatDirection="Horizontal" Width="100%">
      <ItemTemplate>
         <div class="S_Details">
            <div class="Amount">
          <asp:Label ID="FabricCodeLabel" runat="server" Text='<%# Eval("FabricCode") %>' />
         (<asp:Label ID="FabricsNameLabel" runat="server" Text='<%# Eval("FabricsName") %>' />)
          </div>
        ফেরত:
         <asp:Label ID="Fabrics_Return_QuantityLabel" runat="server" Text='<%# Eval("Fabrics_Return_Quantity") %>' />
         (<asp:Label ID="UnitNameLabel" runat="server" Text='<%# Eval("UnitName") %>' />)
       </div>
      </ItemTemplate>
   </asp:DataList>
   <asp:SqlDataSource ID="ReturnDetailsSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Fabrics.FabricID, Fabrics.FabricsName, Fabrics.FabricCode, SUM(Fabrics_Buying_Return_Quantity.ReturnBuyingQuantity) AS Fabrics_Return_Quantity, Fabrics_Mesurement_Unit.UnitName
FROM Fabrics_Buying_Return_Quantity INNER JOIN Fabrics ON Fabrics_Buying_Return_Quantity.FabricID = Fabrics.FabricID INNER JOIN
Fabrics_Mesurement_Unit ON Fabrics.FabricMesurementUnitID = Fabrics_Mesurement_Unit.FabricMesurementUnitID
WHERE (Fabrics_Buying_Return_Quantity.InstitutionID = @InstitutionID) AND (Fabrics_Buying_Return_Quantity.ReturnDate BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000'))
GROUP BY Fabrics.FabricCode, Fabrics_Mesurement_Unit.UnitName, Fabrics.FabricsName, Fabrics.FabricID ORDER BY Fabrics_Return_Quantity DESC"
      CancelSelectOnNullParameter="False">
      <SelectParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
         <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
         <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
      </SelectParameters>
   </asp:SqlDataSource>

   <div class="Title">
      <label class="Date"></label>
      সাপ্লাইয়ারের বিবরণ
   </div>
   <asp:GridView ID="SupplierListGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="FabricsSupplierID" DataSourceID="SupplierListSQL">
      <Columns>
         <asp:TemplateField HeaderText="Supplier" SortExpression="SupplierName">
            <ItemTemplate>
               <asp:LinkButton ID="LinkButton1" runat="server" CommandName="Select" Text='<%# Bind("SupplierName") %>' />
            </ItemTemplate>
         </asp:TemplateField>
         <asp:BoundField DataField="SupplierPhone" HeaderText="Phone" SortExpression="SupplierPhone" />
         <asp:BoundField DataField="SupplierTotalAmount" HeaderText="Total Amount" SortExpression="SupplierTotalAmount" />
         <asp:BoundField DataField="TotalReturnFabricsPrice" HeaderText="Return Price" SortExpression="TotalReturnFabricsPrice" />
         <asp:BoundField DataField="SupplierTotalDiscount" HeaderText="Discount" SortExpression="SupplierTotalDiscount" />
         <asp:BoundField DataField="SupplierPaid" HeaderText="Paid" SortExpression="SupplierPaid" />
         <asp:BoundField DataField="SupplierDue" HeaderText="Due" ReadOnly="True" SortExpression="SupplierDue" />
      </Columns>
      <SelectedRowStyle CssClass="Selected" />
   </asp:GridView>
   <asp:SqlDataSource ID="SupplierListSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT FabricsSupplierID, SupplierName, SupplierPhone, SupplierTotalAmount, TotalReturnFabricsPrice, SupplierTotalDiscount, SupplierPaid, SupplierDue
FROM Fabrics_Supplier WHERE (InstitutionID = @InstitutionID)"
      CancelSelectOnNullParameter="False">
      <SelectParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
         <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
         <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
      </SelectParameters>
   </asp:SqlDataSource>


   <asp:DataList ID="DataList4" runat="server" DataSourceID="SupDetailstSQL" RepeatDirection="Horizontal" RepeatColumns="3" Width="100%">
      <ItemTemplate>
         <div class="S_Details">
           
         <asp:Label ID="FabricCodeLabel" runat="server" Text='<%# Bind("FabricCode") %>' />
         (<asp:Label ID="FabricsNameLabel" runat="server" Text='<%# Bind("FabricsName") %>' />)
         <div class="Amount">  
         ক্রয়:
         <asp:Label ID="SupplyingQuantityLabel" runat="server" Text='<%# Bind("SupplyingQuantity") %>' />
         (<asp:Label ID="Label1" runat="server" Text='<%# Bind("UnitName") %>' />)
         |
         ফেরত:
         <asp:Label ID="SupplierReturnQuantityLabel" runat="server" Text='<%# Bind("SupplierReturnQuantity") %>' />
         (<asp:Label ID="UnitNameLabel" runat="server" Text='<%# Bind("UnitName") %>' />)
         </div>
      </ItemTemplate>
   </asp:DataList>

   <asp:SqlDataSource ID="SupDetailstSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Fabrics.FabricID, Fabrics_Supplying_List.FabricsSupplierID, Fabrics.FabricsName, Fabrics.FabricCode, Fabrics_Supplying_List.SupplyingQuantity, Fabrics_Supplying_List.SupplierReturnQuantity, Fabrics_Mesurement_Unit.UnitName
FROM Fabrics_Supplying_List INNER JOIN Fabrics ON Fabrics_Supplying_List.FabricID = Fabrics.FabricID INNER JOIN Fabrics_Mesurement_Unit ON Fabrics.FabricMesurementUnitID = Fabrics_Mesurement_Unit.FabricMesurementUnitID
WHERE (Fabrics_Supplying_List.InstitutionID = @InstitutionID) AND (Fabrics_Supplying_List.FabricsSupplierID = @FabricsSupplierID) ORDER BY Fabrics_Supplying_List.SupplyingQuantity DESC"
      CancelSelectOnNullParameter="False">
      <SelectParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
         <asp:ControlParameter ControlID="SupplierListGridView" Name="FabricsSupplierID" PropertyName="SelectedValue" />
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
