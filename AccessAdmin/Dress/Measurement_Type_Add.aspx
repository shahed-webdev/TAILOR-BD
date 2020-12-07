<%@ Page Title="" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Measurement_Type_Add.aspx.cs" Inherits="TailorBD.AccessAdmin.Dress.Measurement_Type" %>

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
         <table>
            <tr>
               <td>মাপের নাম দিন
                <asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="MeasurementTypeTextBox" CssClass="EroorStar" ErrorMessage="খালি রাখা যাবেনা" ValidationGroup="1"></asp:RequiredFieldValidator>
               </td>
            </tr>
            <tr>
               <td>
                  <asp:TextBox ID="MeasurementTypeTextBox" runat="server" CssClass="textbox"></asp:TextBox>
               </td>
            </tr>
            <tr>
               <td>মাপের সিরিয়াল
                <asp:RegularExpressionValidator ID="RegularExpressionValidator2" runat="server" ControlToValidate="AscendingTextBox" CssClass="EroorSummer" ErrorMessage="শুধু ইংরেজী নাম্বার লেখা যাবে" ValidationExpression="^\d+$" ValidationGroup="1"></asp:RegularExpressionValidator>
               </td>
            </tr>
            <tr>
               <td>
                  <asp:TextBox ID="AscendingTextBox" runat="server" CssClass="textbox"></asp:TextBox>
               </td>
            </tr>
            <tr>
               <td>&nbsp;</td>
            </tr>
            <tr>
               <td>
                  <asp:Button ID="AddButton" runat="server" CssClass="ContinueButton" Text="মাপ যুক্ত করুন" OnClick="AddButton_Click" ValidationGroup="1" />


                  <asp:SqlDataSource ID="MeasurementTypeSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                     InsertCommand="INSERT INTO Measurement_Type(Cloth_For_ID, InstitutionID, MeasurementType, Date, DressID, Ascending, RegistrationID) VALUES (@Cloth_For_ID, @InstitutionID, @MeasurementType, GETDATE(), @DressID, @Ascending, @RegistrationID)
Update Measurement_Type set Measurement_GroupID = scope_identity() Where MeasurementTypeID =scope_identity()"
                     SelectCommand="SELECT MeasurementTypeID, DressID, MeasurementType, Ascending FROM Measurement_Type WHERE (MeasurementTypeID IN (SELECT DISTINCT Measurement_GroupID FROM Measurement_Type AS M_Group WHERE (Cloth_For_ID = @Cloth_For_ID) AND (InstitutionID = @InstitutionID) AND (DressID = @DressID))) ORDER BY Ascending"
                     UpdateCommand="UPDATE Measurement_Type SET MeasurementType = @MeasurementType WHERE (MeasurementTypeID = @MeasurementTypeID) AND (InstitutionID = @InstitutionID)" DeleteCommand="DELETE FROM Measurement_Type WHERE (MeasurementTypeID = @MeasurementTypeID)

UPDATE  Measurement_Type SET Measurement_GroupID = MeasurementTypeID WHERE ( Measurement_GroupID = @MeasurementTypeID)">
                     <DeleteParameters>
                        <asp:Parameter Name="MeasurementTypeID" />
                     </DeleteParameters>
                     <InsertParameters>
                        <asp:QueryStringParameter Name="Cloth_For_ID" QueryStringField="For" Type="Int32" />
                        <asp:CookieParameter CookieName="InstitutionID" DefaultValue="" Name="InstitutionID" Type="Int32" />
                        <asp:ControlParameter ControlID="MeasurementTypeTextBox" Name="MeasurementType" PropertyName="Text" Type="String" DefaultValue="" />
                        <asp:QueryStringParameter Name="DressID" QueryStringField="dressid" />
                        <asp:ControlParameter ControlID="AscendingTextBox" Name="Ascending" PropertyName="Text" />
                        <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" />
                     </InsertParameters>
                     <SelectParameters>
                        <asp:QueryStringParameter Name="Cloth_For_ID" QueryStringField="For" Type="Int32" />
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                        <asp:QueryStringParameter Name="DressID" QueryStringField="dressid" />
                     </SelectParameters>
                     <UpdateParameters>
                        <asp:Parameter Name="MeasurementType" Type="String" />
                        <asp:Parameter Name="MeasurementTypeID" Type="Int32" />
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                     </UpdateParameters>
                  </asp:SqlDataSource>

               </td>
            </tr>
            <tr>
               <td>&nbsp;</td>
            </tr>
         </table>
         <a href="Dress_Add.aspx">পূর্বের পেইজে যান</a>
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
                     <a href="AdMoreMeasurement.aspx?Measurement_GroupID=<%# Eval("MeasurementTypeID")%>&DressID=<%# Eval("DressID")%>&For=<%#Request.QueryString["For"]%>"><b><%#Eval("MeasurementType") %></b> - (এর নিচে যে মাপ গুলো, তা যুক্ত করুন)</a>
                  </ItemTemplate>
               </asp:TemplateField>

               <asp:TemplateField HeaderText="মাপের সিরিয়াল" SortExpression="Ascending">
                  <ItemTemplate>
                     <asp:RegularExpressionValidator ID="RegularExpressionValidator1" runat="server" ControlToValidate="AscendingTextBox" CssClass="EroorStar" ErrorMessage="শুধু ইংরেজী নাম্বার লেখা যাবে।" ValidationExpression="^\d+$" ValidationGroup="1"></asp:RegularExpressionValidator>
                     <br />
                     <asp:TextBox ID="AscendingTextBox" Width="60" runat="server" CssClass="textbox" Text='<%# Bind("Ascending") %>'></asp:TextBox>
                  </ItemTemplate>
                  <ItemStyle VerticalAlign="Bottom" Width="60px" />
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

         <br />
         <asp:SqlDataSource ID="UpdtAsendingSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT MeasurementTypeID, InstitutionID, RegistrationID, Cloth_For_ID, DressID, MeasurementType, Description, Image, Date, Ascending FROM Measurement_Type" UpdateCommand="UPDATE Measurement_Type SET Ascending = @Ascending WHERE (InstitutionID = @InstitutionID) AND (Measurement_GroupID = @MeasurementTypeID)">
            <UpdateParameters>
               <asp:Parameter Name="Ascending" />
               <asp:Parameter Name="MeasurementTypeID" Type="Int32" />
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
            </UpdateParameters>
         </asp:SqlDataSource>

         <%if (MeasurementTYPEGridView.Rows.Count > 0)
           {%>
         <asp:Button ID="UpdateButton" runat="server" CssClass="ContinueButton" Text="মাপের সিরিয়ালগুলো আপডেট করুন" OnClick="UpdateButton_Click" /><%} %>
         <br />
      </ContentTemplate>
   </asp:UpdatePanel>


   <asp:UpdateProgress ID="UpdateProgress" runat="server">
      <ProgressTemplate>
         <div id="progress_BG"></div>
         <div id="progress">
            <img src="../../CSS/Image/gif-load.gif" alt="Loading..." />
            <br />
            <b>Loading...</b>
         </div>
      </ProgressTemplate>
   </asp:UpdateProgress>
</asp:Content>
