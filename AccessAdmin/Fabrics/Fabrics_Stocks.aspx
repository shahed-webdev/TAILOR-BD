<%@ Page Title="স্টক রিপোর্ট" Language="C#" MasterPageFile="~/Basic.Master" EnableEventValidation="false" AutoEventWireup="true" CodeBehind="Fabrics_Stocks.aspx.cs" Inherits="TailorBD.AccessAdmin.Fabrics.Fabrics_Stocks" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
    <style>
        .textmode { padding: 8px; font-size: 15px; }
    </style>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">

    <asp:FormView ID="StockPriceFormView" runat="server" DataSourceID="Stock_PriceSQL" Width="100%">
        <ItemTemplate>
            <h3>Stock Report (Remaining Stock Price:
         <asp:Label ID="Stock_PriceLabel" runat="server" Text='<%# Bind("Stock_Price") %>' />)
            </h3>
        </ItemTemplate>
    </asp:FormView>
    <asp:SqlDataSource ID="Stock_PriceSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT        ROUND(SUM(ISNULL(StockFabricQuantity, 0) * ISNULL(CurrentBuyingUnitPrice, 0)), 2) AS Stock_Price
FROM            Fabrics
WHERE        (InstitutionID = @InstitutionID)">
        <SelectParameters>
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
        </SelectParameters>
    </asp:SqlDataSource>

    <table>
        <tr>
            <td>
                <asp:TextBox ID="FindTextBox" placeholder="Code, Name" runat="server" CssClass="textbox" Width="200px"></asp:TextBox>
            </td>
            <td>
                <asp:Button ID="FindButton" runat="server" CssClass="ContinueButton" Text="Find" />
            </td>
        </tr>
        <tr>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
        </tr>
    </table>

    <%if (MatchGridView.Rows.Count > 0)
    { %>
    <asp:GridView ID="MatchGridView" DataSourceID="MatchSQL" runat="server" AutoGenerateColumns="False" BackColor="White" BorderColor="#E7E7FF" BorderStyle="None" BorderWidth="1px" CellPadding="3" DataKeyNames="FabricID" GridLines="Horizontal" Width="100%">
        <AlternatingRowStyle BackColor="#F7F7F7" />
        <Columns>
            <asp:HyperLinkField DataNavigateUrlFields="FabricID"
                DataNavigateUrlFormatString="Fabric_Details.aspx?FabricID={0}" DataTextField="Fabric_SN" HeaderText="S.N" />
            <asp:BoundField DataField="FabricCode" HeaderText="Code" SortExpression="FabricCode" />
            <asp:BoundField DataField="FabricsName" HeaderText="Name" SortExpression="FabricsName" />
            <asp:BoundField DataField="SellingUnitPrice" HeaderText="Selling Unit Price" SortExpression="SellingUnitPrice" />
            <asp:BoundField DataField="CurrentBuyingUnitPrice" HeaderText="Current Buying Unit Price" SortExpression="CurrentBuyingUnitPrice" />
            <asp:BoundField DataField="TotalSellingQuantity" HeaderText="Selling Quantity" SortExpression="TotalSellingQuantity" />
            <asp:BoundField DataField="TotalBuyingQuantity" HeaderText="Buying Quantity" SortExpression="TotalBuyingQuantity" />
            <asp:BoundField DataField="TotalDamageQuantity" HeaderText="Damage Quantity" SortExpression="TotalDamageQuantity" />
            <asp:BoundField DataField="SupplierTotalReturnQuantity" HeaderText="Supplier Return" SortExpression="SupplierTotalReturnQuantity" />
            <asp:BoundField DataField="CustomerTotalReturnQuantity" HeaderText="Customer Return" SortExpression="CustomerTotalReturnQuantity" />
            <asp:BoundField DataField="StockFabricQuantity" HeaderText="Stock" ReadOnly="True" SortExpression="StockFabricQuantity" />
            <asp:BoundField DataField="UnitName" HeaderText="Unit" SortExpression="UnitName" />
        </Columns>
        <FooterStyle BackColor="#B5C7DE" ForeColor="#4A3C8C" />
        <HeaderStyle BackColor="#4A3C8C" Font-Bold="True" ForeColor="#F7F7F7" />
        <PagerStyle BackColor="#E7E7FF" ForeColor="#4A3C8C" HorizontalAlign="Right" />
        <RowStyle BackColor="#E7E7FF" ForeColor="#4A3C8C" HorizontalAlign="Center" />
        <SelectedRowStyle BackColor="#738A9C" Font-Bold="True" ForeColor="#F7F7F7" />
        <SortedAscendingCellStyle BackColor="#F4F4FD" />
        <SortedAscendingHeaderStyle BackColor="#5A4C9D" />
        <SortedDescendingCellStyle BackColor="#D8D8F0" />
        <SortedDescendingHeaderStyle BackColor="#3E3277" />
    </asp:GridView>
    <asp:SqlDataSource ID="MatchSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Fabrics.FabricID, Fabrics.Fabric_SN, Fabrics.FabricCode, Fabrics.FabricsName, Fabrics.SellingUnitPrice, Fabrics.StockFabricQuantity, Fabrics.TotalSellingQuantity, Fabrics.TotalBuyingQuantity, Fabrics.TotalDamageQuantity, Fabrics.SupplierTotalReturnQuantity, Fabrics.FabricStockStatus, Fabrics.CustomerReturnQuantity_Add_To_Stock, Fabrics.CustomerTotalReturnQuantity, Fabrics_Mesurement_Unit.UnitName, Fabrics.CurrentBuyingUnitPrice FROM Fabrics INNER JOIN Fabrics_Mesurement_Unit ON Fabrics.FabricMesurementUnitID = Fabrics_Mesurement_Unit.FabricMesurementUnitID WHERE (Fabrics.InstitutionID = @InstitutionID) AND (Fabrics.FabricCode = @FabricCode)">
        <SelectParameters>
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
            <asp:ControlParameter ControlID="FindTextBox" Name="FabricCode" PropertyName="Text" />
        </SelectParameters>
    </asp:SqlDataSource>
    <br />
    <%} %>


    <asp:GridView ID="StockGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="FabricID" DataSourceID="StockSQL" AllowPaging="True" AllowSorting="True" PageSize="50">
        <Columns>
            <asp:HyperLinkField DataNavigateUrlFields="FabricID"
                DataNavigateUrlFormatString="Fabric_Details.aspx?FabricID={0}" DataTextField="Fabric_SN" HeaderText="S.N" />
            <asp:BoundField DataField="FabricCode" HeaderText="Code" SortExpression="FabricCode" />
            <asp:BoundField DataField="FabricsName" HeaderText="Name" SortExpression="FabricsName" />
            <asp:BoundField DataField="SellingUnitPrice" HeaderText="Selling Unit Price" SortExpression="SellingUnitPrice" />
            <asp:BoundField DataField="CurrentBuyingUnitPrice" HeaderText="Current Buying Unit Price" SortExpression="CurrentBuyingUnitPrice" />
            <asp:BoundField DataField="TotalSellingQuantity" HeaderText="Selling Quantity" SortExpression="TotalSellingQuantity" />
            <asp:BoundField DataField="TotalBuyingQuantity" HeaderText="Buying Quantity" SortExpression="TotalBuyingQuantity" />
            <asp:BoundField DataField="TotalDamageQuantity" HeaderText="Damage Quantity" SortExpression="TotalDamageQuantity" />
            <asp:BoundField DataField="SupplierTotalReturnQuantity" HeaderText="Return to Supplier" SortExpression="SupplierTotalReturnQuantity" />
            <asp:BoundField DataField="CustomerReturnQuantity_Add_To_Stock" HeaderText="Return By Customer" SortExpression="CustomerReturnQuantity_Add_To_Stock" />
            <asp:BoundField DataField="StockFabricQuantity" HeaderText="Stock" ReadOnly="True" SortExpression="StockFabricQuantity">
                <ItemStyle Font-Bold="True" />
            </asp:BoundField>
            <asp:BoundField DataField="UnitName" HeaderText="Unit" SortExpression="UnitName" />
        </Columns>
        <EmptyDataTemplate>
            No Stocks
        </EmptyDataTemplate>
        <PagerStyle CssClass="pgr" />
    </asp:GridView>
    <br />
    <asp:Button ID="btnExport" runat="server" CssClass="ContinueButton" OnClick="ExportToExcel" Text="Export To Excel" />
    <asp:SqlDataSource ID="StockSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Fabrics.FabricID, Fabrics.Fabric_SN, Fabrics.FabricCode, Fabrics.FabricsName, Fabrics.SellingUnitPrice, Fabrics.StockFabricQuantity, Fabrics.TotalSellingQuantity, Fabrics.TotalBuyingQuantity, Fabrics.TotalDamageQuantity, Fabrics.SupplierTotalReturnQuantity, Fabrics.FabricStockStatus, Fabrics.CustomerReturnQuantity_Add_To_Stock, Fabrics.CustomerTotalReturnQuantity, Fabrics_Mesurement_Unit.UnitName, Fabrics.CurrentBuyingUnitPrice FROM Fabrics INNER JOIN Fabrics_Mesurement_Unit ON Fabrics.FabricMesurementUnitID = Fabrics_Mesurement_Unit.FabricMesurementUnitID WHERE (Fabrics.InstitutionID = @InstitutionID) ORDER BY Fabrics.StockFabricQuantity DESC"
        FilterExpression="FabricCode LIKE '{0}%' OR FabricsName LIKE '{0}%'" CancelSelectOnNullParameter="False">
        <FilterParameters>
            <asp:ControlParameter ControlID="FindTextBox" Name="Find" PropertyName="Text" />
        </FilterParameters>
        <SelectParameters>
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
        </SelectParameters>
    </asp:SqlDataSource>
</asp:Content>
