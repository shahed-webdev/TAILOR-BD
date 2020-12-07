<%@ Page Title="" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Add_Dress.aspx.cs" Inherits="TailorBD.AccessAdmin.Dress.Mesurement_Delete.Add_Dress" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="asp" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <link href="../CSS/Dress.css" rel="stylesheet" />
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <asp:ToolkitScriptManager ID="ToolkitScriptManager1" runat="server" />
   <h3>পোষাক</h3>

   <asp:GridView ID="DressGridView" runat="server" AutoGenerateColumns="False" DataKeyNames="DressID" DataSourceID="DressSQL" CssClass="mGrid">
      <Columns>
         <asp:TemplateField HeaderText="পোষাকের নাম" SortExpression="Dress_Name">
            <ItemTemplate>
               <asp:Label ID="Label2" runat="server" Text='<%#Eval("Dress_Name") %>'></asp:Label>
            </ItemTemplate>
         </asp:TemplateField>
         <asp:TemplateField HeaderText="ছবি" SortExpression="Image">
            <ItemTemplate>
               <img alt="No Image" src="../../../Handler/DressHandler.ashx?Img=<%#Eval("DressID") %>" class="Img" />
            </ItemTemplate>
         </asp:TemplateField>
         <asp:TemplateField HeaderText="মাপ যুক্ত করুন">
            <ItemTemplate>
               <a title="মাপযুক্ত করুন!" href="Delete_Measurement_Type.aspx?dressid=<%#Eval("DressID") %>&For=<%#Eval("Cloth_For_ID")%>" class="Mesurment"></a>
            </ItemTemplate>
         </asp:TemplateField>
         <asp:TemplateField HeaderText="সিরিয়াল" SortExpression="DressSerial">
            <ItemTemplate>
               <asp:Label ID="Label1" runat="server" Text='<%#Eval("DressSerial") %>'></asp:Label>
            </ItemTemplate>
            <ItemStyle VerticalAlign="Bottom" Width="60px" />
         </asp:TemplateField>
      </Columns>
   </asp:GridView>

   <asp:SqlDataSource ID="DressSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT DressID, Dress_Name, Cloth_For_ID, RegistrationID, InstitutionID, Description, Date, Image, DressSerial FROM Dress WHERE (InstitutionID = @InstitutionID) ORDER BY ISNULL(DressSerial, 99999)">
      <SelectParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
      </SelectParameters>
   </asp:SqlDataSource>

   

   <asp:UpdateProgress ID="UpdateProgress" runat="server">
      <ProgressTemplate>
         <div id="progress_BG"></div>
         <div id="progress">
            <img alt="Loading..." src="../../../CSS/Image/gif-load.gif" />
            <br />
            <b>Loading...</b>
         </div>
      </ProgressTemplate>
   </asp:UpdateProgress>
</asp:Content>
