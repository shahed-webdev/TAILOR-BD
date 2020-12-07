<%@ Page Title="বিক্রির রেকর্ড" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Selling_Records.aspx.cs" Inherits="TailorBD.AccessAdmin.Fabrics.Sell.Selling_Records" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <h3>বিক্রির রেকর্ড</h3>
   <asp:GridView ID="SellingRecordGridView" runat="server" AutoGenerateColumns="False" DataKeyNames="FabricsSellingID" DataSourceID="SellingRecordSQL" CssClass="mGrid" AllowPaging="True" AllowSorting="True">
      <Columns>
         <asp:HyperLinkField DataNavigateUrlFields="FabricsSellingID" 
          DataNavigateUrlFormatString="Print_Invoice.aspx?FabricsSellingID={0}" DataTextField="Selling_SN" SortExpression="Selling_SN" HeaderText="Receipt No."/>
         <asp:BoundField DataField="SellingTotalPrice" HeaderText="মোট মূল্য" SortExpression="SellingTotalPrice" />
         <asp:BoundField DataField="SellingDiscountAmount" HeaderText="মোট ছাড়" SortExpression="SellingDiscountAmount" />
         <asp:BoundField DataField="SellingDiscountPercentage" HeaderText="% হিসাবে ছাড়" ReadOnly="True" SortExpression="SellingDiscountPercentage" />
         <asp:BoundField DataField="SellingPaidAmount" HeaderText="নগত" SortExpression="SellingPaidAmount" />
         <asp:BoundField DataField="SellingDueAmount" HeaderText="বাকি" ReadOnly="True" SortExpression="SellingDueAmount" />
         <asp:BoundField DataField="SellingDate" HeaderText="বিক্রির তারিখ" SortExpression="SellingDate" DataFormatString="{0:d MMM yyyy}" />
      </Columns>
      <PagerStyle CssClass="pgr" />
   </asp:GridView>
   <asp:SqlDataSource ID="SellingRecordSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT FabricsSellingID, InstitutionID, RegistrationID, OrderID, CustomerID, Selling_SN, SellingTotalPrice, SellingDiscountAmount, SellingDiscountPercentage, SellingPaidAmount - SellingReturnAmount AS SellingPaidAmount, SellingDueAmount, SellingPaymentStatus, SellingDate, InsertDate, SellingReturnAmount, Selling_ReturnStatus FROM Fabrics_Selling WHERE (InstitutionID = @InstitutionID) ORDER BY Selling_SN DESC">
      <SelectParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
      </SelectParameters>
   </asp:SqlDataSource>
</asp:Content>
