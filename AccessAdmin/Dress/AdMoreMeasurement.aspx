<%@ Page Title="" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="AdMoreMeasurement.aspx.cs" Inherits="TailorBD.AccessAdmin.Dress.AdMoreMeasurement" %>

<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="asp" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <asp:ToolkitScriptManager ID="ToolkitScriptManager1" runat="server" />
   <h3>পুরাতন মাপগুলো সিরিয়াল করুন</h3>

   <asp:UpdatePanel ID="UpdatePanel2" runat="server">
      <ContentTemplate>
         <table>
            <tr>
               <td colspan="2">পুরাতন মাপ নির্বাচন করুন|
                          <asp:LinkButton ID="AddMesureLinkButton" runat="server" OnClientClick="return AddPopup();">নতুন মাপ যুক্ত করুন</asp:LinkButton>
               </td>
            </tr>
            <tr>
               <td>
                  <asp:DropDownList ID="OldMeasurmentDropDownList" runat="server" CssClass="dropdown" DataSourceID="OldMeasurementSQL" DataTextField="MeasurementType" DataValueField="MeasurementTypeID">
                  </asp:DropDownList>
                  <asp:SqlDataSource ID="OldMeasurementSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT MeasurementTypeID, MeasurementType
FROM Measurement_Type AS ML WHERE (DressID = @DressID) AND (InstitutionID = @InstitutionID) AND (MeasurementTypeID &lt;&gt; Measurement_GroupID) AND (Measurement_GroupID &lt;&gt; @Measurement_GroupID) AND (MeasurementTypeID &lt;&gt; @Measurement_GroupID) OR
(((SELECT COUNT(Measurement_GroupID) AS MG_Count FROM Measurement_Type AS MG WHERE (DressID = @DressID) AND (InstitutionID = @InstitutionID)  AND (Measurement_GroupID = ML.Measurement_GroupID)) = 1) AND (MeasurementTypeID &lt;&gt; @Measurement_GroupID))
ORDER BY Ascending"
                     UpdateCommand="UPDATE Measurement_Type SET Measurement_GroupID = @Measurement_GroupID, Measurement_Group_SerialNo = '', Ascending = (SELECT Ascending FROM Measurement_Type AS MG WHERE (MeasurementTypeID = @Measurement_GroupID)) WHERE (MeasurementTypeID = @MeasurementTypeID)">
                     <SelectParameters>
                        <asp:QueryStringParameter Name="DressID" QueryStringField="DressID" />
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                        <asp:QueryStringParameter Name="Measurement_GroupID" QueryStringField="Measurement_GroupID" />
                     </SelectParameters>
                     <UpdateParameters>
                        <asp:QueryStringParameter Name="Measurement_GroupID" QueryStringField="Measurement_GroupID" />
                        <asp:ControlParameter ControlID="OldMeasurmentDropDownList" Name="MeasurementTypeID" PropertyName="SelectedValue" />
                     </UpdateParameters>
                  </asp:SqlDataSource>
               </td>
               <td>
                  <asp:Button ID="SubmitButton" runat="server" CssClass="ContinueButton" OnClick="SubmitButton_Click" Text="যুক্ত করুন" />
               </td>
            </tr>
         </table>
      </ContentTemplate>
   </asp:UpdatePanel>

   <asp:UpdatePanel ID="UpdatePanel1" runat="server">
      <ContentTemplate>
         <asp:LinkButton ID="PrevPageLinkButton" runat="server" OnClick="PrevPageLinkButton_Click">পূর্বের পেইজে যান</asp:LinkButton>
         <asp:GridView ID="MeasurementTYPEGridView" runat="server" AutoGenerateColumns="False" DataKeyNames="MeasurementTypeID" DataSourceID="MeasurementTypeSQL" CssClass="mGrid" OnRowDeleted="MeasurementTYPEGridView_RowDeleted">
            <Columns>
               <asp:TemplateField ShowHeader="False" HeaderText="ইডিট করুন">
                  <EditItemTemplate>
                     <asp:LinkButton ID="UpdateLinkButton" runat="server" ToolTip="আপডেট করুন" CausesValidation="True" CommandName="Update" Text="" CssClass="Updete" ValidationGroup="U"></asp:LinkButton>
                     &nbsp;

                                <asp:LinkButton ID="CancelLinkButton" runat="server" ToolTip="কেন্সেল করুন" CausesValidation="False" CommandName="Cancel" Text="" CssClass="Cancel"></asp:LinkButton>
                  </EditItemTemplate>
                  <ItemTemplate>

                     <asp:LinkButton ID="EditLinkButton" runat="server" ToolTip="ইডিট করুন" CausesValidation="False" CommandName="Edit" Text="" CssClass="Edit"></asp:LinkButton>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:TemplateField HeaderText="মাপের ধরণের নাম" SortExpression="MeasurementType">
                  <EditItemTemplate>
                     <asp:TextBox ID="UpdateMesureTextBox" runat="server" Text='<%# Bind("MeasurementType") %>'></asp:TextBox>
                     <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="UpdateMesureTextBox" CssClass="EroorStar" ErrorMessage="*" SetFocusOnError="True" ValidationGroup="U"></asp:RequiredFieldValidator>
                  </EditItemTemplate>
                  <ItemTemplate>
                     <asp:Label ID="Label1" runat="server" Text='<%# Bind("MeasurementType") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:TemplateField HeaderText="মাপের সিরিয়াল" SortExpression="Measurement_Group_SerialNo">
                  <ItemTemplate>
                     <asp:RegularExpressionValidator ID="RegularExpressionValidator1" runat="server" ControlToValidate="AscendingTextBox" CssClass="EroorStar" ErrorMessage="শুধু ইংরেজী নাম্বার লেখা যাবে।" ValidationExpression="^\d+$" ValidationGroup="1"></asp:RegularExpressionValidator>
                     <br />
                     <asp:TextBox ID="AscendingTextBox" Width="60" runat="server" CssClass="textbox" Text='<%# Bind("Measurement_Group_SerialNo") %>'></asp:TextBox>
                  </ItemTemplate>
                  <ItemStyle VerticalAlign="Bottom" Width="60px" />
               </asp:TemplateField>
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
         <asp:SqlDataSource ID="UpdtAsendingSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT MeasurementTypeID, InstitutionID, RegistrationID, Cloth_For_ID, DressID, MeasurementType, Description, Image, Date, Ascending FROM Measurement_Type" UpdateCommand="UPDATE Measurement_Type SET Measurement_Group_SerialNo = @Ascending WHERE (InstitutionID = @InstitutionID) AND (MeasurementTypeID = @MeasurementTypeID)">
            <UpdateParameters>
               <asp:Parameter Name="Ascending" />
               <asp:Parameter Name="MeasurementTypeID" Type="Int32" />
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
            </UpdateParameters>
         </asp:SqlDataSource>
         <br />
         <asp:Button ID="UpdateButton" runat="server" CssClass="ContinueButton" Text="মাপের সিরিয়ালগুলো আপডেট করুন" OnClick="UpdateButton_Click" />
      </ContentTemplate>
   </asp:UpdatePanel>

   <div id="AddPopup" runat="server" style="display: none;" class="modalPopup">
      <div id="Header" class="Htitle">
         <b>নতুন মাপ যুক্ত করুন</b>
         <div id="Close" class="PopClose"></div>
      </div>
      <asp:UpdatePanel ID="UpdatePanel4" runat="server">
         <ContentTemplate>
            <div class="Pop_Contain">
               <table>
                  <tr>
                     <td>মাপের নাম দিন
                <asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="MeasurementTypeTextBox" CssClass="EroorSummer" ErrorMessage="খালি রাখা যাবেনা" ValidationGroup="1"></asp:RequiredFieldValidator>
                     </td>
                  </tr>
                  <tr>
                     <td>
                        <asp:TextBox ID="MeasurementTypeTextBox" runat="server" CssClass="textbox" Width="245px"></asp:TextBox>
                     </td>
                  </tr>
                  <tr>
                     <td>মাপের সিরিয়াল
                <asp:RegularExpressionValidator ID="RegularExpressionValidator2" runat="server" ControlToValidate="AscendingTextBox" CssClass="EroorSummer" ErrorMessage="শুধু ইংরেজী নাম্বার লেখা যাবে" ValidationExpression="^\d+$" ValidationGroup="1"></asp:RegularExpressionValidator>
                     </td>
                  </tr>
                  <tr>
                     <td>
                        <asp:TextBox ID="AscendingTextBox" runat="server" CssClass="textbox" Width="245px"></asp:TextBox>
                     </td>
                  </tr>
                  <tr>
                     <td><label id="ErMsg" class="SuccessMessage"></label></td>
                  </tr>
                  <tr>
                     <td>
                        <asp:Button ID="AddButton" runat="server" CssClass="ContinueButton" Text="মাপ যুক্ত করুন" OnClick="AddButton_Click" ValidationGroup="1" />


                        <asp:SqlDataSource ID="MeasurementTypeSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                           InsertCommand="INSERT INTO Measurement_Type
                         (Cloth_For_ID, InstitutionID, MeasurementType, Date, DressID, Ascending, RegistrationID, Measurement_GroupID, Measurement_Group_SerialNo)
SELECT      Cloth_For_ID,@InstitutionID,@MeasurementType, GETDATE(),DressID,Ascending,@RegistrationID,@MeasurementTypeID,@Measurement_Group_SerialNo FROM Measurement_Type WHERE MeasurementTypeID =@MeasurementTypeID"
                           SelectCommand="SELECT MeasurementTypeID, Measurement_GroupID, MeasurementType, Measurement_Group_SerialNo FROM Measurement_Type WHERE (InstitutionID = @InstitutionID) AND (Measurement_GroupID = @Measurement_GroupID) ORDER BY ISNULL(Measurement_Group_SerialNo, 99999)"
                           UpdateCommand="UPDATE Measurement_Type SET MeasurementType = @MeasurementType WHERE (MeasurementTypeID = @MeasurementTypeID) AND (InstitutionID = @InstitutionID)" DeleteCommand="UPDATE Measurement_Type SET Measurement_GroupID = @MeasurementTypeID, Measurement_Group_SerialNo = '' WHERE (MeasurementTypeID = @MeasurementTypeID)">
                           <DeleteParameters>
                              <asp:Parameter Name="MeasurementTypeID" />
                           </DeleteParameters>
                           <InsertParameters>
                              <asp:CookieParameter CookieName="InstitutionID" DefaultValue="" Name="InstitutionID" Type="Int32" />
                              <asp:ControlParameter ControlID="MeasurementTypeTextBox" Name="MeasurementType" PropertyName="Text" Type="String" DefaultValue="" />
                              <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" />
                              <asp:QueryStringParameter Name="MeasurementTypeID" QueryStringField="Measurement_GroupID" />
                              <asp:ControlParameter ControlID="AscendingTextBox" Name="Measurement_Group_SerialNo" PropertyName="Text" />
                           </InsertParameters>
                           <SelectParameters>
                              <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                              <asp:QueryStringParameter Name="Measurement_GroupID" QueryStringField="Measurement_GroupID" />
                           </SelectParameters>
                           <UpdateParameters>
                              <asp:Parameter Name="MeasurementType" Type="String" />
                              <asp:Parameter Name="MeasurementTypeID" Type="Int32" />
                              <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                           </UpdateParameters>
                        </asp:SqlDataSource>

                     </td>
                  </tr>
               </table>
            </div>
         </ContentTemplate>
      </asp:UpdatePanel>
      <asp:HiddenField ID="IHiddenField" runat="server" Value="0" />
      <asp:ModalPopupExtender ID="Mpe" runat="server"
         TargetControlID="IHiddenField"
         PopupControlID="AddPopup"
         CancelControlID="Close"
         BehaviorID="AddMpe"
         BackgroundCssClass="modalBackground"
         PopupDragHandleControlID="Header" />
   </div>

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
