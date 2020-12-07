<%@ Page Title="" Language="C#" MasterPageFile="~/Design.Master" AutoEventWireup="true" CodeBehind="Print_Invoice.aspx.cs" Inherits="TailorBD.Access_Authority.Invoice.Print_Invoice" %>
<%@ Register assembly="Microsoft.ReportViewer.WebForms, Version=11.0.0.0, Culture=neutral, PublicKeyToken=89845dcd8080cc91" namespace="Microsoft.Reporting.WebForms" tagprefix="rsweb" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <link href="../../AccessAdmin/Invoice/Print.css" rel="stylesheet" />
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <asp:ScriptManager ID="ScriptManager1" runat="server"></asp:ScriptManager>
    <rsweb:ReportViewer ID="ReportViewer1" runat="server" Font-Names="Verdana" ShowPrintButton="true" Font-Size="8pt" WaitMessageFont-Names="Verdana" WaitMessageFont-Size="14pt" AsyncRendering="False" SizeToReportContent="True" SplitterBackColor="White">
        <LocalReport ReportPath="Access_Authority\Invoice\Report_Invoice.rdlc">
            <DataSources>
                <rsweb:ReportDataSource DataSourceId="ObjectDataSource1" Name="Invoice_DS" />
            </DataSources>
        </LocalReport>
    </rsweb:ReportViewer>

    <asp:ObjectDataSource ID="ObjectDataSource1" runat="server" OldValuesParameterFormatString="original_{0}" SelectMethod="GetData" TypeName="TailorBD.Access_Authority.Invoice.Invoice_DataSetTableAdapters.InvoiceTableAdapter">
        <SelectParameters>
            <asp:QueryStringParameter Name="InstitutionID" QueryStringField="InstitutionID" Type="Int32" />
            <asp:QueryStringParameter DefaultValue="" Name="InvoiceID" QueryStringField="InvoiceID" Type="Int32" />
        </SelectParameters>
    </asp:ObjectDataSource>

     <br /><input id="btnPrint" type="button" value="Print" onclick="window.print();" class="ContinueButton" />
    </asp:Content>
