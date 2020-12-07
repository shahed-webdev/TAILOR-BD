<%@ Page Title="" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Print_Invoice.aspx.cs" Inherits="TailorBD.AccessAdmin.Fabrics.Buying.Print_Invoice" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <link href="../CSS/Receipt_Print.css" rel="stylesheet" />
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <asp:FormView ID="BuyFormView" runat="server" DataKeyNames="FabricBuyingID" DataSourceID="BuySQL" Width="100%">
      <ItemTemplate>
         <a href="Fabric_Buying.aspx" class="NoPrint"><< ক্রয় করুন</a>
         <a href="Buying_Records.aspx" class="NoPrint"><< রেকর্ড দেখুন</a>
         <div class="RNo">
            Date:
            <asp:Label ID="BuyingDateLabel" runat="server" Text='<%# Bind("BuyingDate","{0:d MMM yy}") %>' />
            |
            R.No:
            <asp:Label ID="BuySNLabel" runat="server" Text='<%# Bind("Buying_SN") %>' /><br />
            <div class="Ena_BN" style="display: none">
               Bill No:
            <asp:Label ID="Bill_NoLabel" runat="server" Text='<%# Bind("BillNo") %>' />
            </div>

            <asp:FormView ID="SupplierFormView" runat="server" DataKeyNames="FabricsSupplierID" DataSourceID="InfoOldSupplierSQL" Width="100%">
               <ItemTemplate>
                  <asp:Label ID="SupplierCompanyNameLabel" runat="server" Text='<%# Bind("SupplierCompanyName") %>' /><br />
                  <asp:Label ID="SupplierNameLabel" runat="server" Text='<%# Bind("SupplierName") %>' />
               </ItemTemplate>
            </asp:FormView>
         </div>
         <asp:SqlDataSource ID="InfoOldSupplierSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM [Fabrics_Supplier] WHERE ([FabricsSupplierID] = (SELECT  FabricsSupplierID FROM  Fabrics_Buying WHERE  (FabricBuyingID = @FabricBuyingID)))">
            <SelectParameters>
               <asp:QueryStringParameter Name="FabricBuyingID" QueryStringField="FabricBuyingID" />
            </SelectParameters>
         </asp:SqlDataSource>
         <asp:GridView ID="BuyingListGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataSourceID="Fabric_Buy_ListSQL">
            <Columns>
               <asp:BoundField DataField="FabricCode" HeaderText="Code" SortExpression="FabricCode" />
               <asp:BoundField DataField="FabricsName" HeaderText="Fabric" SortExpression="FabricsName" />
               <asp:BoundField DataField="BuyingQuantity" HeaderText="Quantity" SortExpression="BuyingQuantity" />
               <asp:BoundField DataField="BuyingUnitPrice" HeaderText="U.Price" SortExpression="BuyingUnitPrice" />
               <asp:BoundField DataField="BuyingPrice" HeaderText="Total" SortExpression="BuyingPrice" />
            </Columns>
         </asp:GridView>

         <table class="Total">
            <tr>
               <td>Total: 
                  <asp:Label ID="BuyingPriceLabel" runat="server" Text='<%# Bind("BuyingTotalPrice") %>' />
                  /-
               </td>
            </tr>
            <tr class="Enabled_DC" style="display: none">
               <td>Discount: 
                   (<asp:Label ID="DiscountPercentageLabel" runat="server" Text='<%# Bind("BuyingDiscountPercentage") %>' />%)
                  <asp:Label ID="DiscountAmoutLabel" runat="server" Text='<%# Bind("BuyingDiscountAmount") %>' />
                  /-
               </td>
            </tr>

            <tr>
               <td>Paid: 
                  <asp:Label ID="PaidLabel" runat="server" Text='<%# Bind("BuyingPaidAmount") %>' />
                  /-
               </td>
            </tr>
            <tr>
               <td>Due: 
                  <asp:Label ID="DueLabel" runat="server" Text='<%# Bind("BuyingDueAmount") %>' />
                  /-
               </td>
            </tr>
         </table>
      </ItemTemplate>
   </asp:FormView>
   <asp:SqlDataSource ID="BuySQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT FabricBuyingID, InstitutionID, RegistrationID, FabricsSupplierID, Buying_SN, BuyingTotalPrice, BuyingDiscountAmount, BuyingDiscountPercentage, BuyingPaidAmount - BuyingReturnAmount AS BuyingPaidAmount, BuyingReturnAmount, BuyingDueAmount, BuyingPaymentStatus, BillNo, BuyingDate, InsertDate, Buying_ReturnStatus FROM Fabrics_Buying WHERE (FabricBuyingID = @FabricBuyingID)">
      <SelectParameters>
         <asp:QueryStringParameter Name="FabricBuyingID" QueryStringField="FabricBuyingID" Type="Int32" />
      </SelectParameters>
   </asp:SqlDataSource>

   <asp:SqlDataSource ID="Fabric_Buy_ListSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Fabrics_Buying_List.BuyingQuantity, Fabrics_Buying_List.BuyingPrice, Fabrics.FabricsName, Fabrics_Buying_List.BuyingUnitPrice, Fabrics.FabricCode FROM Fabrics_Buying_List INNER JOIN Fabrics ON Fabrics_Buying_List.FabricID = Fabrics.FabricID WHERE (Fabrics_Buying_List.FabricBuyingID = @FabricBuyingID)">
      <SelectParameters>
         <asp:QueryStringParameter Name="FabricBuyingID" QueryStringField="FabricBuyingID" />
      </SelectParameters>
   </asp:SqlDataSource>

   <button type="submit" onclick="window.print()" class="print" />

   <script>
      if ($("[id*=DiscountAmoutLabel]").text() != "0") {
         $(".Enabled_DC").show();
      }
      if ($("[id*=Bill_NoLabel]").text() != "") {
         $(".Ena_BN").show();
      }
   </script>
</asp:Content>
