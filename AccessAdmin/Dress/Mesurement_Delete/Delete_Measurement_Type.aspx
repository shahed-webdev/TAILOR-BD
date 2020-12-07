<%@ Page Title="" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Delete_Measurement_Type.aspx.cs" Inherits="TailorBD.AccessAdmin.Dress.Mesurement_Delete.Delete_Measurement_Type" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <link href="CSS/Dress.css" rel="stylesheet" />
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <asp:ScriptManager ID="ScriptManager1" runat="server"></asp:ScriptManager>
   <asp:FormView ID="DressImg" runat="server" DataKeyNames="DressID" DataSourceID="DressSQL">
      <ItemTemplate>
         <h3>'<asp:Label ID="Dress_NameLabel" runat="server" Text='<%# Eval("Dress_Name") %>' />'  মাপের ধরণ যুক্ত করুন
         </h3>
      </ItemTemplate>
   </asp:FormView>
   <asp:SqlDataSource ID="DressSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT [Dress_Name], [Image], [DressID] FROM [Dress] WHERE ([DressID] = @DressID)">
      <SelectParameters>
         <asp:QueryStringParameter Name="DressID" QueryStringField="dressid" Type="Int32" />
      </SelectParameters>
   </asp:SqlDataSource>

   <asp:UpdatePanel ID="UpdatePanel1" runat="server">
      <ContentTemplate>
         <a href="Add_Dress.aspx">পূর্বের পেইজে যান</a>
         <asp:GridView ID="MeasurementTYPEGridView" runat="server" AutoGenerateColumns="False" DataKeyNames="MeasurementTypeID" DataSourceID="MeasurementTypeSQL" CssClass="mGrid">
            <Columns>
               <asp:TemplateField HeaderText="মাপের ধরণের নাম" SortExpression="MeasurementType">
                  <ItemTemplate>
                     <a href="Measurement_Serialized.aspx?Measurement_GroupID=<%# Eval("MeasurementTypeID")%>&DressID=<%# Eval("DressID")%>&For=<%#Request.QueryString["For"]%>"><b><%#Eval("MeasurementType") %></b> - (এর নিচে যে মাপ গুলো, তা যুক্ত করুন)</a>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:TemplateField HeaderText="সিরিয়াল" SortExpression="Ascending">
                  <ItemTemplate>
                     <asp:Label ID="Label1" runat="server" Text='<%# Bind("Ascending") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:TemplateField ShowHeader="False" HeaderText="ডিলিট করুন">
                  <ItemTemplate>
                     <asp:LinkButton ID="DeleteImageButton" runat="server" ToolTip="ডিলিট করুন" CausesValidation="False" CommandName="Delete" OnClientClick="return confirm('আপনি কি ডিলেট করতে চান ?')" CssClass="Delete"></asp:LinkButton>
                  </ItemTemplate>
                  <ItemStyle Width="70px" />
               </asp:TemplateField>
            </Columns>
            <EmptyDataTemplate>
               Empty
            </EmptyDataTemplate>
         </asp:GridView>

         <asp:SqlDataSource ID="MeasurementTypeSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" DeleteCommand="DELETE FROM Customer_Measurement WHERE (MeasurementTypeID = @MeasurementTypeID)
DELETE FROM Ordered_Measurement WHERE (MeasurementTypeID = @MeasurementTypeID)
UPDATE   Measurement_Type  SET Measurement_GroupID = MeasurementTypeID WHERE  (Measurement_GroupID = @MeasurementTypeID)
DELETE FROM Measurement_Type WHERE (MeasurementTypeID = @MeasurementTypeID)" SelectCommand="SELECT MeasurementTypeID, DressID, MeasurementType, Ascending FROM Measurement_Type WHERE (MeasurementTypeID IN (SELECT DISTINCT Measurement_GroupID FROM Measurement_Type AS M_Group WHERE (Cloth_For_ID = @Cloth_For_ID) AND (InstitutionID = @InstitutionID) AND (DressID = @DressID))) ORDER BY Ascending">
            <DeleteParameters>
               <asp:Parameter Name="MeasurementTypeID" />
            </DeleteParameters>
            <SelectParameters>
               <asp:QueryStringParameter Name="Cloth_For_ID" QueryStringField="For" Type="Int32" />
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
               <asp:QueryStringParameter Name="DressID" QueryStringField="dressid" />
            </SelectParameters>
         </asp:SqlDataSource>
      </ContentTemplate>
   </asp:UpdatePanel>


   <asp:UpdateProgress ID="UpdateProgress" runat="server">
      <ProgressTemplate>
         <div id="progress_BG"></div>
         <div id="progress">
            <img src="../../../CSS/Image/gif-load.gif" alt="Loading..." />
            <br />
            <b>Loading...</b>
         </div>
      </ProgressTemplate>
   </asp:UpdateProgress>
</asp:Content>
