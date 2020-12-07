<%@ Page Title="" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Order_Report.aspx.cs" Inherits="TailorBD.AccessAdmin.Reports.Order_Report" %>
<%@ Register assembly="Microsoft.ReportViewer.WebForms, Version=11.0.0.0, Culture=neutral, PublicKeyToken=89845dcd8080cc91" namespace="Microsoft.Reporting.WebForms" tagprefix="rsweb" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <script src="../../JS/DatePicker/jquery.datepick.js"></script>
   <link href="../../JS/DatePicker/jquery.datepick.css" rel="stylesheet" />
   <style>
      #ctl00_body_ReportViewer1_ctl05 { display:none}
   </style>
   <script>
      $(document).ready(function () {
         $(".Datetime").datepick();
      });
   </script>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <asp:ScriptManager ID="ScriptManager1" runat="server">
   </asp:ScriptManager>
   <asp:TextBox ID="FromDateTextBox" runat="server" CssClass="Datetime"></asp:TextBox>
   <asp:TextBox ID="ToDateTextBox" runat="server" CssClass="Datetime"></asp:TextBox>
   <asp:Button ID="ShowButton" runat="server" OnClick="ShowButton_Click" Text="Show" />
   <rsweb:ReportViewer ID="ReportViewer1" runat="server" Font-Names="Verdana" Font-Size="8pt" WaitMessageFont-Names="Verdana" WaitMessageFont-Size="14pt" AsyncRendering="False" SizeToReportContent="True" SplitterBackColor="White">
      <LocalReport ReportPath="AccessAdmin\Reports\OrderReport.rdlc">
         <DataSources>
            <rsweb:ReportDataSource DataSourceId="ObjectDataSource1" Name="DressDataSet" />
         </DataSources>
      </LocalReport>
   </rsweb:ReportViewer>
   <asp:ObjectDataSource ID="ObjectDataSource1" runat="server" OldValuesParameterFormatString="original_{0}" SelectMethod="GetData" TypeName="TailorBD.AccessAdmin.Reports.Order_DataSetTableAdapters.DressTableAdapter">
      <SelectParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
         <asp:ControlParameter ControlID="FromDateTextBox" DefaultValue="" Name="From_OrderDate" PropertyName="Text" Type="String" />
         <asp:ControlParameter ControlID="ToDateTextBox" DefaultValue="" Name="To_OrderDate" PropertyName="Text" Type="String" />
      </SelectParameters>
   </asp:ObjectDataSource>
</asp:Content>
