<%@ Page Title="" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Measurement_Serialized.aspx.cs" Inherits="TailorBD.AccessAdmin.Dress.Mesurement_Delete.Measurement_Serialized" %>

<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="asp" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <asp:ToolkitScriptManager ID="ToolkitScriptManager1" runat="server" />
   <h3>পুরাতন মাপগুলো সিরিয়াল করুন</h3>

   <asp:LinkButton ID="PrevPageLinkButton" runat="server" OnClick="PrevPageLinkButton_Click">পূর্বের পেইজে যান</asp:LinkButton>
   <asp:GridView ID="MeasurementTYPEGridView" runat="server" AutoGenerateColumns="False" DataKeyNames="MeasurementTypeID" DataSourceID="MeasurementTypeSQL" CssClass="mGrid">
      <Columns>
         <asp:TemplateField HeaderText="মাপের ধরণের নাম" SortExpression="MeasurementType">
            <ItemTemplate>
               <asp:Label ID="Label1" runat="server" Text='<%# Bind("MeasurementType") %>'></asp:Label>
            </ItemTemplate>
         </asp:TemplateField>
         <asp:BoundField DataField="Measurement_Group_SerialNo" HeaderText="সিরিয়াল" SortExpression="Measurement_Group_SerialNo" />
         <asp:TemplateField ShowHeader="False" HeaderText="মুছে ফেলুন">
            <ItemTemplate>
               <asp:LinkButton ID="DeleteImageButton" runat="server" ToolTip="ডিলিট করুন" CausesValidation="False" CommandName="Delete" OnClientClick="return confirm('আপনি কি গ্রুপ থেকে মুছে ফেলতে চান ?')" CssClass="Delete"></asp:LinkButton>
            </ItemTemplate>
            <ItemStyle Width="70px" />
         </asp:TemplateField>
      </Columns>
      <EmptyDataTemplate>
         Empty
      </EmptyDataTemplate>
   </asp:GridView>
   <asp:SqlDataSource ID="MeasurementTypeSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
      SelectCommand="SELECT MeasurementTypeID, Measurement_GroupID, MeasurementType, Measurement_Group_SerialNo FROM Measurement_Type WHERE (InstitutionID = @InstitutionID) AND (Measurement_GroupID = @Measurement_GroupID) ORDER BY ISNULL(Measurement_Group_SerialNo, 99999)"
       DeleteCommand="DELETE FROM Customer_Measurement WHERE (MeasurementTypeID = @MeasurementTypeID)
DELETE FROM Ordered_Measurement WHERE (MeasurementTypeID = @MeasurementTypeID)
DELETE FROM Measurement_Type WHERE (MeasurementTypeID = @MeasurementTypeID)">
      <DeleteParameters>
         <asp:Parameter Name="MeasurementTypeID" />
      </DeleteParameters>
      <SelectParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
         <asp:QueryStringParameter Name="Measurement_GroupID" QueryStringField="Measurement_GroupID" />
      </SelectParameters>
   </asp:SqlDataSource>

   <script type="text/javascript">
      function AddPopup() { $find("AddMpe").show(); return !1 };

      function Success() {
         var e = $('#ErMsg');
         e.text("মাপ সফলভাবে যুক্ত হয়েছে");
         e.fadeIn();
         e.queue(function () { setTimeout(function () { e.dequeue(); }, 3000); });
         e.fadeOut('slow');
      }
   </script>
</asp:Content>
