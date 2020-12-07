<%@ Page Title="" Language="C#" MasterPageFile="~/Design.Master" AutoEventWireup="true" CodeBehind="Institution_List.aspx.cs" Inherits="TailorBD.Access_Authority.Institution_List" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <h3>Institution List</h3>
    <asp:GridView ID="CustomerListGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="InstitutionID" DataSourceID="InstitutionListSQL">
        <Columns>
            <asp:CommandField ShowEditButton="True" />
            <asp:HyperLinkField DataNavigateUrlFields="InstitutionID" DataNavigateUrlFormatString="~/Access_Authority/Invoice/Pay_Invoice.aspx?InstitutionID={0}" DataTextField="InstitutionName" HeaderText="Select" />
            <asp:BoundField DataField="Validation" HeaderText="Validation" SortExpression="Validation" />
            <asp:BoundField DataField="UserName" HeaderText="UserName" SortExpression="UserName" />
            <asp:BoundField DataField="Password" HeaderText="Password" SortExpression="Password" />
            <asp:BoundField DataField="Phone" HeaderText="Phone" SortExpression="Phone" />
            <asp:BoundField DataField="Email" HeaderText="Email" SortExpression="Email" />
        </Columns>
    </asp:GridView>
    <asp:SqlDataSource ID="InstitutionListSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Institution.InstitutionID, Institution.InstitutionName, Institution.Phone, Institution.Email, LIU.UserName, LIU.Password, Institution.Address, Institution.Validation FROM Institution INNER JOIN LIU ON Institution.InstitutionID = LIU.InstitutionID" UpdateCommand="UPDATE Institution SET Phone =@Phone, Validation =@Validation, Signing_Money =@Signing_Money, Renew_Amount =@Renew_Amount, Expire_Date =@Expire_Date WHERE (InstitutionID = @InstitutionID)">
        <UpdateParameters>
            <asp:Parameter Name="Phone" />
            <asp:Parameter Name="Validation" />
            <asp:Parameter Name="Signing_Money" />
            <asp:Parameter Name="Renew_Amount" />
            <asp:Parameter Name="Expire_Date" />
            <asp:Parameter Name="InstitutionID" />
        </UpdateParameters>
    </asp:SqlDataSource>
</asp:Content>
