<%@ Page Title="প্রতিষ্ঠানের তথ্য" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="TailorInfo.aspx.cs" Inherits="TailorBD.AccessAdmin.TailorInfo" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <style>
      .mGrid { text-align: left; }
         .mGrid td { font-size: 14px; padding: 6px 0 6px 10px; }
   </style>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <asp:ScriptManager ID="ScriptManager1" runat="server"></asp:ScriptManager>
   <h3>আপনার প্রতিষ্ঠানের তথ্য</h3>
   <asp:FormView ID="PImgFormView" runat="server" DataKeyNames="RegistrationID" DataSourceID="ImgSQL">
      <ItemTemplate>
         <img alt="No Logo" src="../Handler/TailorInfo.ashx?Img=<%#Eval("InstitutionID") %>" style="height: 60px" />
      </ItemTemplate>
   </asp:FormView>
   <asp:SqlDataSource ID="ImgSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
      SelectCommand="SELECT * FROM Registration WHERE (RegistrationID = @RegistrationID)">
      <SelectParameters>
         <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
      </SelectParameters>
   </asp:SqlDataSource>

   <asp:DetailsView ID="AdminInfoDetailsView" runat="server" AutoGenerateRows="False" DataKeyNames="InstitutionID" DataSourceID="TailorInfoSQL" CssClass="mGrid" OnItemUpdated="AdminInfoDetailsView_ItemUpdated">
      <AlternatingRowStyle CssClass="alt" />
      <RowStyle CssClass="RowStyle" />
      <Fields>
         <asp:BoundField DataField="InstitutionName" HeaderText="প্রতিষ্ঠানের নাম" SortExpression="InstitutionName" />
         <asp:BoundField DataField="Dialog_Title" HeaderText="ডায়লগ" SortExpression="Dialog_Title" />
         <asp:BoundField DataField="Established" HeaderText="স্থাপিত" SortExpression="Established" />
         <asp:BoundField DataField="Staff" HeaderText="স্টাফ" SortExpression="Staff" />
         <asp:BoundField DataField="Address" HeaderText="ঠিকানা" SortExpression="Address" />
         <asp:BoundField DataField="City" HeaderText="সিটি" SortExpression="City" />
         <asp:BoundField DataField="State" HeaderText="স্ট্যাট" SortExpression="State" />
         <asp:BoundField DataField="LocalArea" HeaderText="লোকাল এরিয়া" SortExpression="LocalArea" />
         <asp:BoundField DataField="PostalCode" HeaderText="পোস্টকোড" SortExpression="PostalCode" />
         <asp:BoundField DataField="Phone" HeaderText="ফোন" SortExpression="Phone" />
         <asp:BoundField DataField="Email" HeaderText="ই-মেইল" SortExpression="Email" />
         <asp:BoundField DataField="Website" HeaderText="ওয়েব সাইট" SortExpression="Website" />
         <asp:TemplateField>
            <EditItemTemplate>
               Update Logo
                            <asp:FileUpload ID="ImageFileUpload" runat="server" />
            </EditItemTemplate>
         </asp:TemplateField>
         <asp:CommandField ShowEditButton="True" EditText="পরিবর্তন করতে ক্লিক করুন" />
      </Fields>
   </asp:DetailsView>
   <asp:SqlDataSource ID="TailorInfoSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
      SelectCommand="SELECT * FROM [Institution] WHERE ([InstitutionID] = @InstitutionID)"
      UpdateCommand="UPDATE Institution SET InstitutionName = @InstitutionName, Dialog_Title = @Dialog_Title ,Established = @Established, Staff = @Staff, Address = @Address, City = @City, State = @State, LocalArea = @LocalArea, PostalCode = @PostalCode, Phone = @Phone, Email = @Email, Website = @Website WHERE (InstitutionID = @InstitutionID)">

      <SelectParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
      </SelectParameters>
      <UpdateParameters>
         <asp:Parameter Name="InstitutionName" />
         <asp:Parameter Name="Dialog_Title" />
         <asp:Parameter Name="Established" />
         <asp:Parameter Name="Staff" />
         <asp:Parameter Name="Address" />
         <asp:Parameter Name="City" />
         <asp:Parameter Name="State" />
         <asp:Parameter Name="LocalArea" />
         <asp:Parameter Name="PostalCode" />
         <asp:Parameter Name="Phone" />
         <asp:Parameter Name="Email" />
         <asp:Parameter Name="Website" />
         <asp:Parameter Name="InstitutionID" />
      </UpdateParameters>
   </asp:SqlDataSource>


</asp:Content>
