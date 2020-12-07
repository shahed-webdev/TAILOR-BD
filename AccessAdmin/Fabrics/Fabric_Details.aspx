<%@ Page Title="" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Fabric_Details.aspx.cs" Inherits="TailorBD.AccessAdmin.Fabrics.Fabric_Details" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <style>
      .Info ul { margin: 0; padding: 0; }
         .Info ul li { background: #fff none repeat scroll 0 0; border: 1px solid #f2f2f2; color: #777; font-size: 15px; line-height: 33px; list-style: outside none none; margin: 9px 0 0; padding-left: 15px; }
   </style>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <a href="Fabrics_Stocks.aspx">Back</a>
   <asp:FormView ID="FabricFormView" runat="server" DataKeyNames="FabricID" DataSourceID="FabricSQL" Width="100%">
      <ItemTemplate>
         <div class="Info">
            <ul>
               <li>Fabric SN:
            <asp:Label ID="Fabric_SNLabel" runat="server" Text='<%# Bind("Fabric_SN") %>' /></li>
               
               <li>Fabric Code:
            <asp:Label ID="FabricCodeLabel" runat="server" Text='<%# Bind("FabricCode") %>' /></li>
       
               <li>Fabric Name:
            <asp:Label ID="FabricsNameLabel" runat="server" Text='<%# Bind("FabricsName") %>' /></li>
              
               <li>Selling Unit Price:
            <asp:Label ID="SellingUnitPriceLabel" runat="server" Text='<%# Bind("SellingUnitPrice") %>' /></li>
              
               <li>Stock Fabric Quantity:
            <asp:Label ID="StockFabricQuantityLabel" runat="server" Text='<%# Bind("StockFabricQuantity") %>' /></li>
              
               <li>Total Selling Quantity:
            <asp:Label ID="TotalSellingQuantityLabel" runat="server" Text='<%# Bind("TotalSellingQuantity") %>' /></li>
             
               <li>Total Buying Quantity:
            <asp:Label ID="TotalBuyingQuantityLabel" runat="server" Text='<%# Bind("TotalBuyingQuantity") %>' /></li>
              
               <li>Total Damage Quantity:
            <asp:Label ID="TotalDamageQuantityLabel" runat="server" Text='<%# Bind("TotalDamageQuantity") %>' /></li>
              
               <li>Supplier Total Return Quantity:
            <asp:Label ID="SupplierTotalReturnQuantityLabel" runat="server" Text='<%# Bind("SupplierTotalReturnQuantity") %>' /></li>
              
               <li>Customer Total Return Quantity:
            <asp:Label ID="CustomerTotalReturnQuantityLabel" runat="server" Text='<%# Bind("CustomerTotalReturnQuantity") %>' /></li>
               
               <li>Customer Return Quantity Add in Stock:
            <asp:Label ID="CustomerReturnQuantity_Add_To_StockLabel" runat="server" Text='<%# Bind("CustomerReturnQuantity_Add_To_Stock") %>' /></li>
              
               <li>Current Buying Unit Price:
            <asp:Label ID="CurrentBuyingUnitPriceLabel" runat="server" Text='<%# Bind("CurrentBuyingUnitPrice") %>' /></li>
            </ul>
         </div>
      </ItemTemplate>
   </asp:FormView>

   <asp:SqlDataSource ID="FabricSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM [Fabrics] WHERE ([FabricID] = @FabricID)">
      <SelectParameters>
         <asp:QueryStringParameter Name="FabricID" QueryStringField="FabricID" Type="Int32" />
      </SelectParameters>
   </asp:SqlDataSource>

   <p>Buying Details</p>
   <asp:GridView ID="BuyingDetailsGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataSourceID="BuyingDetailsSQL">
      <Columns>
         <asp:BoundField DataField="Buying_SN" HeaderText="SN" SortExpression="Buying_SN" />
         <asp:BoundField DataField="BuyingQuantity" HeaderText="Quantity" SortExpression="BuyingQuantity" />
         <asp:BoundField DataField="BuyingUnitPrice" HeaderText="Unit Price" ReadOnly="True" SortExpression="BuyingUnitPrice" />
         <asp:BoundField DataField="BuyingPrice" HeaderText="Buying Price" SortExpression="BuyingPrice" />
         <asp:BoundField DataField="BuyingDate" HeaderText="Date" SortExpression="BuyingDate" DataFormatString="{0:d MMM yyyy}" />
      </Columns>
   </asp:GridView>
   <asp:SqlDataSource ID="BuyingDetailsSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Fabrics_Buying_List.FabricBuyingID, Fabrics_Buying.Buying_SN, Fabrics_Buying_List.BuyingQuantity, Fabrics_Buying_List.BuyingUnitPrice, Fabrics_Buying_List.BuyingPrice, Fabrics_Buying.BuyingDate FROM Fabrics_Buying_List INNER JOIN Fabrics_Buying ON Fabrics_Buying_List.FabricBuyingID = Fabrics_Buying.FabricBuyingID WHERE (Fabrics_Buying_List.InstitutionID = @InstitutionID) AND (Fabrics_Buying_List.FabricID = @FabricID)">
      <SelectParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
         <asp:QueryStringParameter Name="FabricID" QueryStringField="FabricID" />
      </SelectParameters>
   </asp:SqlDataSource>

   <p>Selling Details</p>
   <asp:GridView ID="SellingDetailsGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataSourceID="SellingDetailsSQL">
      <Columns>
         <asp:BoundField DataField="Selling_SN" HeaderText="SN" SortExpression="Selling_SN" />
         <asp:BoundField DataField="SellingQuantity" HeaderText="Quantity" SortExpression="SellingQuantity" />
         <asp:BoundField DataField="SellingUnitPrice" HeaderText="Unit Price" SortExpression="SellingUnitPrice" />
         <asp:BoundField DataField="SellingPrice" HeaderText="Selling Price" ReadOnly="True" SortExpression="SellingPrice" />
         <asp:BoundField DataField="BuyingUnitPrice" HeaderText="Buying U.P" SortExpression="BuyingUnitPrice" />
         <asp:BoundField DataField="SellingDate" HeaderText="Date" SortExpression="SellingDate" DataFormatString="{0:d MMM yyyy}" />
      </Columns>
   </asp:GridView>
   <asp:SqlDataSource ID="SellingDetailsSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Fabrics_Selling.Selling_SN, Fabrics_Selling_List.SellingQuantity, Fabrics_Selling_List.SellingUnitPrice, Fabrics_Selling_List.SellingPrice, Fabrics_Selling_List.BuyingUnitPrice, Fabrics_Selling.SellingDate FROM Fabrics_Selling_List INNER JOIN Fabrics_Selling ON Fabrics_Selling_List.FabricsSellingID = Fabrics_Selling.FabricsSellingID WHERE (Fabrics_Selling_List.FabricID = @FabricID) AND (Fabrics_Selling_List.InstitutionID = @InstitutionID)">
      <SelectParameters>
         <asp:QueryStringParameter Name="FabricID" QueryStringField="FabricID" />
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
      </SelectParameters>
   </asp:SqlDataSource>
</asp:Content>
