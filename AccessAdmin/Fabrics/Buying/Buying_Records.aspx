<%@ Page Title="ক্রয়ের রেকর্ড" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Buying_Records.aspx.cs" Inherits="TailorBD.AccessAdmin.Fabrics.Buying.Buying_Records" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <h3>ক্রয়ের রেকর্ড</h3>
   <asp:GridView ID="BuyingRecordGridView" runat="server" AutoGenerateColumns="False" DataKeyNames="FabricBuyingID" DataSourceID="BuyingRecordSQL" CssClass="mGrid" AllowPaging="True" AllowSorting="True">
      <Columns>
         <asp:HyperLinkField DataNavigateUrlFields="FabricBuyingID" 
          DataNavigateUrlFormatString="Print_Invoice.aspx?FabricBuyingID={0}" DataTextField="Buying_SN" SortExpression="Buying_SN" HeaderText="রিসিপট নং"/>
         <asp:BoundField DataField="BuyingTotalPrice" HeaderText="মোট টাকা" SortExpression="BuyingTotalPrice" />
         <asp:BoundField DataField="BuyingDiscountAmount" HeaderText="ডিসকাউন্ট" SortExpression="BuyingDiscountAmount" />
         <asp:BoundField DataField="BuyingDiscountPercentage" HeaderText="% হিসাবে ডিসকাউন্ট" ReadOnly="True" SortExpression="BuyingDiscountPercentage" />
         <asp:BoundField DataField="BuyingPaidAmount" HeaderText="পেইড" SortExpression="BuyingPaidAmount" />
         <asp:BoundField DataField="BuyingDueAmount" HeaderText="বাকি" ReadOnly="True" SortExpression="BuyingDueAmount" />
         <asp:BoundField DataField="BillNo" HeaderText="বিল নং" SortExpression="BillNo" />
         <asp:BoundField DataField="BuyingDate" HeaderText="ক্রয়ের তারিখ" SortExpression="BuyingDate" DataFormatString="{0:d MMM yyyy}" />
      </Columns>
      <PagerStyle CssClass="pgr" />
   </asp:GridView>
   <asp:SqlDataSource ID="BuyingRecordSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT FabricBuyingID, InstitutionID, RegistrationID, FabricsSupplierID, Buying_SN, BuyingTotalPrice, BuyingDiscountAmount, BuyingDiscountPercentage, BuyingPaidAmount - BuyingReturnAmount AS BuyingPaidAmount, BuyingReturnAmount, BuyingDueAmount, BuyingPaymentStatus, BillNo, BuyingDate, InsertDate, Buying_ReturnStatus FROM Fabrics_Buying WHERE (InstitutionID = @InstitutionID)  ORDER BY Buying_SN DESC">
      <SelectParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
      </SelectParameters>
   </asp:SqlDataSource>
</asp:Content>
