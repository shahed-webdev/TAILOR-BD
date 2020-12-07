<%@ Page Title="পোষাক ও মাপ যুক্ত করুন" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Dress_Add.aspx.cs" Inherits="TailorBD.AccessAdmin.Dress.Add_Dress" %>

<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="asp" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <link href="CSS/Dress.css" rel="stylesheet" />
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <asp:ToolkitScriptManager ID="ToolkitScriptManager1" runat="server" />
   <h3>পোষাক এর মাপ ও পোষাক এর নির্দিষ্ট চার্জ যুক্ত করুন</h3>
   <table>
      <tr>
         <td>
            <asp:LinkButton ID="AddDress" runat="server" Text="নতুন পোষাক যুক্ত করুন" OnClientClick="return DressPopup()" Font-Bold="True" Font-Size="14px" />

         </td>
      </tr>
   </table>

   <asp:GridView ID="DressGridView" runat="server" AutoGenerateColumns="False" DataKeyNames="DressID" DataSourceID="DressSQL" CssClass="mGrid" OnRowDeleted="DressGridView_RowDeleted" OnRowUpdating="DressGridView_RowUpdating">
      <Columns>
         <asp:TemplateField ShowHeader="False" HeaderText="ইডিট করুন">
            <EditItemTemplate>
               <asp:LinkButton ID="UpdateLinkButton" runat="server" ToolTip="আপডেট করুন" CausesValidation="True" CommandName="Update" Text="" CssClass="Updete" ValidationGroup="U"></asp:LinkButton>
               &nbsp;<asp:LinkButton ID="CancelLinkButton" runat="server" ToolTip="কেন্সেল করুন" CausesValidation="False" CommandName="Cancel" Text="" CssClass="Cancel"></asp:LinkButton>
            </EditItemTemplate>
            <ItemTemplate>
               <asp:LinkButton ID="EditLinkButton" runat="server" ToolTip="ইডিট করুন" CausesValidation="False" CommandName="Edit" Text="" CssClass="Edit"></asp:LinkButton>
            </ItemTemplate>
         </asp:TemplateField>
         <asp:TemplateField HeaderText="পোষাকের নাম" SortExpression="Dress_Name">
            <EditItemTemplate>
               <asp:TextBox ID="UpdateDressTextBox" runat="server" Text='<%# Bind("Dress_Name") %>'></asp:TextBox>
               <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="UpdateDressTextBox" CssClass="EroorStar" ErrorMessage="*" SetFocusOnError="True" ValidationGroup="U"></asp:RequiredFieldValidator>
            </EditItemTemplate>
            <ItemTemplate>
               <asp:LinkButton ID="AddPriceLB" runat="server" ToolTip="নির্দিষ্ট চার্জ যুক্ত করুন" CommandName="Select" Text='<%# Bind("Dress_Name") %>' CommandArgument='<%# Bind("Dress_Name") %>' OnCommand="AddPriceLB_Command" />
            </ItemTemplate>
         </asp:TemplateField>
         <asp:TemplateField HeaderText="ছবি" SortExpression="Image">
            <EditItemTemplate>
               <asp:FileUpload ID="DressFileUpload" runat="server" />
            </EditItemTemplate>
            <ItemTemplate>
               <img alt="No Image" src="../../Handler/DressHandler.ashx?Img=<%#Eval("DressID") %>" class="Img" />
            </ItemTemplate>
         </asp:TemplateField>
         <asp:TemplateField HeaderText="মাপ যুক্ত করুন">
            <ItemTemplate>
               <a title="মাপযুক্ত করুন!" href="Measurement_Type_Add.aspx?dressid=<%#Eval("DressID") %>&For=<%#Eval("Cloth_For_ID")%>" class="Mesurment"></a>
            </ItemTemplate>
         </asp:TemplateField>
         <asp:TemplateField HeaderText="স্টাইল যুক্ত করুন">
            <ItemTemplate>
               <a title="ডিজাইন যুক্ত করুন!" href="Dress_Style_Category_Add.aspx?dressid=<%#Eval("DressID")%>" class="Style"></a>
            </ItemTemplate>
         </asp:TemplateField>
         <asp:TemplateField HeaderText="সিরিয়াল" SortExpression="DressSerial">
            <ItemTemplate>
               <asp:RegularExpressionValidator ID="RegularExpressionValidator1" runat="server" ControlToValidate="DressSerialTextBox" CssClass="EroorStar" ErrorMessage="ইংরেজী নাম্বার লিখুন" ValidationExpression="^\d+$" ValidationGroup="1"></asp:RegularExpressionValidator>
               <br />
               <asp:TextBox ID="DressSerialTextBox" runat="server" CssClass="textbox" Text='<%# Bind("DressSerial") %>'></asp:TextBox>
            </ItemTemplate>
            <ItemStyle VerticalAlign="Bottom" Width="60px" />
         </asp:TemplateField>

         <asp:TemplateField ShowHeader="False" HeaderText="ডিলিট করুন">
            <ItemTemplate>
               <asp:LinkButton ID="DeleteImageButton" runat="server" ToolTip="ডিলিট করুন" CausesValidation="False" CommandName="Delete" OnClientClick="return confirm('আপনি কি ডিলেট করতে চান ?')" CssClass="Delete"></asp:LinkButton>
            </ItemTemplate>
         </asp:TemplateField>
      </Columns>
      <SelectedRowStyle CssClass="Selected" />
   </asp:GridView>

   <asp:SqlDataSource ID="DressSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" DeleteCommand="DELETE FROM [Dress] WHERE [DressID] = @DressID AND (InstitutionID = @InstitutionID)" InsertCommand="INSERT INTO Dress(Dress_Name, Cloth_For_ID, RegistrationID, InstitutionID, Date, DressSerial) VALUES (@Dress_Name, @Cloth_For_ID, @RegistrationID, @InstitutionID, GETDATE(), @DressSerial)" SelectCommand="SELECT DressID, Dress_Name, Cloth_For_ID, RegistrationID, InstitutionID, Description, Date, Image, DressSerial FROM Dress WHERE (InstitutionID = @InstitutionID) ORDER BY ISNULL(DressSerial, 99999)" UpdateCommand="UPDATE Dress SET Dress_Name = @Dress_Name WHERE (DressID = @DressID) AND (InstitutionID = @InstitutionID)">
      <DeleteParameters>
         <asp:Parameter Name="DressID" Type="Int32" />
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
      </DeleteParameters>
      <InsertParameters>
         <asp:ControlParameter ControlID="DressNameTextBox" Name="Dress_Name" PropertyName="Text" Type="String" />
         <asp:ControlParameter ControlID="DressForDropDownList" Name="Cloth_For_ID" PropertyName="SelectedValue" Type="Int32" />
         <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
         <asp:CookieParameter CookieName="InstitutionID" DefaultValue="0" Name="InstitutionID" Type="Int32" />
         <asp:ControlParameter ControlID="SerialNoTextBox" Name="DressSerial" PropertyName="Text" />
      </InsertParameters>
      <SelectParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
      </SelectParameters>
      <UpdateParameters>
         <asp:Parameter Name="Dress_Name" Type="String" />
         <asp:Parameter Name="DressID" Type="Int32" />
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
      </UpdateParameters>
   </asp:SqlDataSource>

   <asp:SqlDataSource ID="UpdateSerialSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM [Dress] WHERE ([InstitutionID] = @InstitutionID)" UpdateCommand="UPDATE Dress SET DressSerial = @DressSerial WHERE (InstitutionID = @InstitutionID) AND (DressID = @DressID)">
      <SelectParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
      </SelectParameters>
      <UpdateParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
         <asp:Parameter Name="DressID" />
         <asp:Parameter Name="DressSerial" Type="Int32" />
      </UpdateParameters>
   </asp:SqlDataSource>
   <br />
   <%if (DressGridView.Rows.Count > 0)
     {%><asp:Button ID="UpdateSerialButton" runat="server" OnClick="UpdateSerialButton_Click" Text="সিরিয়ালগুলো আপডেট করুন" CssClass="ContinueButton" /><%} %>


   <div id="AddDressPop" runat="server" style="display: none;" class="modalPopup">
      <div id="Header2" class="Htitle">
         <b>পোষাক যুক্ত করুন</b>
         <div id="Close2" class="PopClose"></div>
      </div>

      <div class="Pop_Contain">
         <table>
            <tr>
               <td>কার পোষাক</td>
            </tr>
            <tr>
               <td>
                  <asp:DropDownList ID="DressForDropDownList" runat="server" AutoPostBack="True" DataSourceID="Measurement_ForSQL" DataTextField="Cloth_For" DataValueField="Cloth_For_ID" CssClass="dropdown" Width="240px">
                  </asp:DropDownList>
                  <asp:SqlDataSource ID="Measurement_ForSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM [Cloth_For]"></asp:SqlDataSource>
               </td>
            </tr>
            <tr>
               <td>পোষাকের নাম
                <asp:RequiredFieldValidator ID="RV2" runat="server" ControlToValidate="DressNameTextBox" CssClass="EroorSummer" ErrorMessage="খালি রাখা যাবেনা" ValidationGroup="1" />
               </td>
            </tr>
            <tr>
               <td>
                  <asp:TextBox ID="DressNameTextBox" runat="server" CssClass="textbox"></asp:TextBox>
               </td>
            </tr>
            <tr>
               <td>সিরিয়াল
                <asp:RegularExpressionValidator ID="RexE" runat="server" ControlToValidate="SerialNoTextBox" CssClass="EroorSummer" ErrorMessage="ইংরেজী নাম্বার লিখুন" ValidationExpression="^\d+$" ValidationGroup="1" />
               </td>
            </tr>
            <tr>
               <td>
                  <asp:TextBox ID="SerialNoTextBox" runat="server" CssClass="textbox"></asp:TextBox>
               </td>
            </tr>
            <tr>
               <td>পোষাকের ছবি</td>
            </tr>
            <tr>
               <td>
                  <asp:FileUpload ID="ImageUpload" runat="server" />
               </td>
            </tr>
            <tr>
               <td>&nbsp;</td>
            </tr>
            <tr>
               <td>
                  <asp:Button ID="DressAddButton" runat="server" CssClass="ContinueButton" Text="পোষাক যুক্ত করুন" OnClick="DressAddButton_Click" ValidationGroup="1" />

               </td>
            </tr>
            <tr>
               <td>
                  <label id="ErMsg2" class="SuccessMessage"></label>
               </td>
            </tr>
         </table>
      </div>

      <asp:HiddenField ID="DressHF" runat="server" Value="0" />
      <asp:ModalPopupExtender ID="ModalPopupExtender1" runat="server"
         TargetControlID="DressHF"
         PopupControlID="AddDressPop"
         CancelControlID="Close2"
         BehaviorID="DressAdd"
         BackgroundCssClass="modalBackground"
         PopupDragHandleControlID="Header2" />
   </div>

   <div id="AddPopup" runat="server" style="display: none;" class="modalPopup">
      <div id="Header" class="Htitle">
         <b>"
            <asp:Label ID="DNLabel" runat="server" />
            " নির্দিষ্ট চার্জ যুক্ত করুন</b>
         <div id="Close" class="PopClose"></div>
      </div>
      <asp:UpdatePanel ID="UpdatePanel4" runat="server">
         <ContentTemplate>
            <div class="Pop_Contain">
               <table>
                  <tr>
                     <td>কি বাবদ
                <asp:RequiredFieldValidator ID="RequiredFieldValidator3" runat="server" ControlToValidate="PriceForTextBox" CssClass="EroorSummer" ErrorMessage="খালি রাখা যাবেনা" ValidationGroup="C"></asp:RequiredFieldValidator>
                     </td>
                  </tr>
                  <tr>
                     <td>
                        <asp:TextBox ID="PriceForTextBox" runat="server" CssClass="textbox"></asp:TextBox>
                     </td>
                  </tr>
                  <tr>
                     <td>কত টাকা
                        <asp:RequiredFieldValidator ID="RequiredFieldValidator4" runat="server" ControlToValidate="PriceTextBox" CssClass="EroorSummer" ErrorMessage="খালি রাখা যাবেনা" ValidationGroup="C"></asp:RequiredFieldValidator>
                     </td>
                  </tr>
                  <tr>
                     <td>
                        <asp:TextBox ID="PriceTextBox" runat="server" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" CssClass="textbox"></asp:TextBox>
                     </td>
                  </tr>
                  <tr>
                     <td></td>
                  </tr>
                  <tr>
                     <td>
                        <asp:Button ID="AddDressPriceButton" runat="server" CssClass="ContinueButton" Text="যুক্ত করুন" OnClick="AddDressPriceButton_Click" ValidationGroup="C" />


                        <asp:SqlDataSource ID="DressPriceSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                           InsertCommand="INSERT INTO [Dress_Price] ([RegistrationID], [InstitutionID], [DressID], [Price_For], [Price]) VALUES (@RegistrationID, @InstitutionID, @DressID, @Price_For, @Price)"
                           SelectCommand="SELECT Dress_Price.Dress_PriceID, Dress_Price.Price_For, Dress_Price.Price, Dress.Dress_Name FROM Dress_Price INNER JOIN Dress ON Dress_Price.DressID = Dress.DressID WHERE (Dress_Price.InstitutionID = @InstitutionID) AND (Dress_Price.DressID = @DressID)"
                           UpdateCommand="UPDATE Dress_Price SET Price_For = @Price_For, Price = @Price WHERE (Dress_PriceID = @Dress_PriceID)" DeleteCommand="DELETE FROM [Dress_Price] WHERE [Dress_PriceID] = @Dress_PriceID">
                           <DeleteParameters>
                              <asp:Parameter Name="Dress_PriceID" Type="Int32" />
                           </DeleteParameters>
                           <InsertParameters>
                              <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                              <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                              <asp:ControlParameter ControlID="PriceForTextBox" Name="Price_For" PropertyName="Text" Type="String" />
                              <asp:ControlParameter ControlID="PriceTextBox" Name="Price" PropertyName="Text" Type="Double" />
                              <asp:ControlParameter ControlID="DressGridView" Name="DressID" PropertyName="SelectedValue" Type="Int32" />
                           </InsertParameters>
                           <SelectParameters>
                              <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                              <asp:ControlParameter ControlID="DressGridView" Name="DressID" PropertyName="SelectedValue" />
                           </SelectParameters>
                           <UpdateParameters>
                              <asp:Parameter Name="Price_For" Type="String" />
                              <asp:Parameter Name="Price" Type="Double" />
                              <asp:Parameter Name="Dress_PriceID" Type="Int32" />
                           </UpdateParameters>
                        </asp:SqlDataSource>

                     </td>
                  </tr>
                  <tr>
                     <td>
                        <label id="ErMsg" class="SuccessMessage"></label>
                     </td>
                  </tr>
               </table>
               <asp:GridView ID="DPGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="Dress_PriceID" DataSourceID="DressPriceSQL">
                  <Columns>
                     <asp:BoundField DataField="Price_For" HeaderText="কি বাবদ" SortExpression="Price_For" />
                     <asp:TemplateField HeaderText="কত টাকা" SortExpression="Price">
                        <EditItemTemplate>
                           <asp:TextBox ID="EPTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" Text='<%# Bind("Price") %>'></asp:TextBox>
                        </EditItemTemplate>
                        <ItemTemplate>
                           <asp:Label ID="Label1" runat="server" Text='<%# Bind("Price") %>'></asp:Label>
                        </ItemTemplate>
                     </asp:TemplateField>
                     <asp:CommandField ShowEditButton="True" HeaderText="ইডিট " />
                     <asp:CommandField ShowDeleteButton="True" HeaderText="ডিলিট" />
                  </Columns>
               </asp:GridView>
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

   <asp:UpdateProgress ID="UpdateProgress" runat="server">
      <ProgressTemplate>
         <div id="progress_BG"></div>
         <div id="progress">
            <img alt="Loading..." src="../../CSS/Image/gif-load.gif" />
            <br />
            <b>Loading...</b>
         </div>
      </ProgressTemplate>
   </asp:UpdateProgress>

   <script>
      function Success() {
         var e = $('#ErMsg');
         e.text("চার্জ সফলভাবে যুক্ত হয়েছে");
         e.fadeIn();
         e.queue(function () { setTimeout(function () { e.dequeue(); }, 3000); });
         e.fadeOut('slow');
      }
      function isNumberKey(a) { a = a.which ? a.which : event.keyCode; return 46 != a && 31 < a && (48 > a || 57 < a) ? !1 : !0 };

      /*---Modal popup---*/
      function DressPopup() { $find("DressAdd").show(); return !1 }
      function Success2() {
         var e = $('#ErMsg2');
         e.text("পোষাক সফলভাবে যুক্ত হয়েছে");
         e.fadeIn();
         e.queue(function () { setTimeout(function () { e.dequeue(); }, 3000); });
         e.fadeOut('slow');
      }
   </script>
</asp:Content>
