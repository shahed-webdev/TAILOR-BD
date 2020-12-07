<%@ Page Title="ফোন কন্টাক্ট লিস্ট" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Others_SMS.aspx.cs" Inherits="TailorBD.AccessAdmin.SMS.Others_SMS" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="asp" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <link href="CSS/Print.css" rel="stylesheet" />
   <style>
      .modalPopup { width: auto; }
      .modalPopup .Pop_Contain { padding: 20px 17px 20px 25px; }
      .PopClose { background: url("Css/Ico/btn-close.png") no-repeat scroll -1px -1px; float: right; padding: 8px 9px; cursor: pointer; }
      .PopClose:hover { opacity: 0.6; }
      .Counter_St { color: #00009b; font-size: 15px; font-weight: bold; }
   </style>

</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
      <asp:ToolkitScriptManager ID="ToolkitScriptManager1" runat="server" />
   <asp:UpdatePanel ID="UpdatePanel1" runat="server">
      <ContentTemplate>
         <h3>
            <asp:FormView ID="SMSFormView" runat="server" DataKeyNames="SMSID" DataSourceID="SMSSQL">
               <ItemTemplate>
                  Saved Contact List (Remaining SMS:
                   <asp:Label ID="CountLabel" runat="server" Text='<%# Bind("SMS_Balance") %>' />)
               </ItemTemplate>
            </asp:FormView>
            <asp:SqlDataSource ID="SMSSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM SMS WHERE (InstitutionID = @InstitutionID)" ProviderName="<%$ ConnectionStrings:TailorBDConnectionString.ProviderName %>">
               <SelectParameters>
                  <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
               </SelectParameters>
            </asp:SqlDataSource>
         </h3>

         <table>
            <tr class="NoPrint">
               <td>
                  <asp:LinkButton ID="AddnewLinkButton" runat="server" OnClientClick="return CategoryPopup()">Add New Group</asp:LinkButton>
                  <asp:RequiredFieldValidator ID="RequiredFieldValidator7" runat="server" ControlToValidate="SelectGroupDropDownList" CssClass="EroorSummer" ErrorMessage="Select Group" InitialValue="0" ValidationGroup="SN">*</asp:RequiredFieldValidator>
               </td>
               <td>Name OR Mobile No.</td>
            </tr>
            <tr>
               <td>
                  <asp:DropDownList ID="SelectGroupDropDownList" runat="server" CssClass="dropdown" DataSourceID="AddGroupSQL" DataTextField="GroupName" DataValueField="SMS_GroupID" AutoPostBack="True" OnDataBound="SelectGroupDropDownList_DataBound">
                  </asp:DropDownList>
                  &nbsp;</td>
               <td class="NoPrint">
                  <asp:TextBox ID="SearchTextBox" runat="server" CssClass="textbox"></asp:TextBox>
                  <asp:Button ID="SearchButton" runat="server" Text="Search" CssClass="ContinueButton" />
               </td>
            </tr>
            <tr class="NoPrint">
               <td>&nbsp;</td>
               <td>&nbsp;</td>
            </tr>
            <tr class="NoPrint">
               <td>
                  <asp:LinkButton ID="PhoneNoLinkButton3" runat="server" OnClientClick="return AddPopup()">Add  New Mobile Number</asp:LinkButton>
               </td>
               <td>&nbsp;</td>
            </tr>
            <tr>
               <td>
                  <asp:Label ID="IteamCountLabel" runat="server" Font-Bold="True" Font-Size="13px" ForeColor="Black"></asp:Label>
               </td>
               <td>&nbsp;</td>
            </tr>
         </table>
         <asp:GridView ID="ContactListGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="SMS_NumberID" DataSourceID="Group_Phone_NumberSQL" AllowPaging="True" PageSize="100" AllowSorting="True">
            <Columns>
               <asp:TemplateField>
                  <HeaderTemplate>
                     <asp:CheckBox ID="SelectAllCheckBox" runat="server" Text="SMS" />
                  </HeaderTemplate>
                  <ItemTemplate>
                     <asp:CheckBox ID="SelectCheckBox" runat="server" Text=" " />
                  </ItemTemplate>
                  <HeaderStyle CssClass="HideCB" />
                  <ItemStyle Width="30px" CssClass="HideCB " />
               </asp:TemplateField>
               <asp:BoundField DataField="GroupName" HeaderText="Group" ReadOnly="True" SortExpression="GroupName" />
               <asp:BoundField DataField="Name" HeaderText="Name" SortExpression="Name" />
               <asp:TemplateField HeaderText="Mobile No." SortExpression="MobileNo">
                  <EditItemTemplate>
                     <asp:TextBox ID="UMobieTextBox" runat="server" Text='<%# Bind("MobileNo") %>'></asp:TextBox>
                     <asp:RegularExpressionValidator ID="RV" runat="server" ControlToValidate="UMobieTextBox" CssClass="EroorStar" ErrorMessage="Invalid!" ValidationExpression="(88)?((011)|(015)|(016)|(017)|(018)|(019)|(013)|(014))\d{8,8}" ValidationGroup="UP" />
                  </EditItemTemplate>
                  <ItemTemplate>
                     <asp:Label ID="MobileNoLabel" runat="server" Text='<%# Bind("MobileNo") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:BoundField DataField="Address" HeaderText="Address" SortExpression="Address" />
               <asp:BoundField DataField="Add_Date" HeaderText="Add Date" SortExpression="Add_Date" DataFormatString="{0:d MMM yyyy}" ReadOnly="True" />
               <asp:TemplateField ShowHeader="False">
                  <EditItemTemplate>
                     <asp:LinkButton ID="LinkButton1" ValidationGroup="UP" runat="server" CausesValidation="True" CommandName="Update" Text="Update"></asp:LinkButton>
                     &nbsp;<asp:LinkButton ID="LinkButton2" runat="server" CausesValidation="False" CommandName="Cancel" Text="Cancel"></asp:LinkButton>
                  </EditItemTemplate>
                  <ItemTemplate>
                     <asp:LinkButton ID="LinkButton1" runat="server" CausesValidation="False" CommandName="Edit" Text="Edit"></asp:LinkButton>
                  </ItemTemplate>
                  <HeaderStyle CssClass="HideCB" />
                  <ItemStyle Width="85px" CssClass="HideCB " />
               </asp:TemplateField>
               <asp:TemplateField ShowHeader="False">
                  <ItemTemplate>
                     <asp:LinkButton ID="DeletLinkButton" OnClientClick="return confirm('Are you sure want to delete?')" runat="server" CausesValidation="False" CommandName="Delete" Text="Delete"></asp:LinkButton>
                  </ItemTemplate>
                  <HeaderStyle CssClass="HideCB" />
                  <ItemStyle Width="30px" CssClass="HideCB " />
               </asp:TemplateField>
            </Columns>
            <EmptyDataTemplate>
               Empty Data
            </EmptyDataTemplate>
            <PagerStyle CssClass="pgr" />
         </asp:GridView>
         <asp:SqlDataSource ID="Group_Phone_NumberSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
            DeleteCommand="DELETE FROM [SMS_Group_Phone_Number] WHERE [SMS_NumberID] = @SMS_NumberID"
            InsertCommand="INSERT INTO SMS_Group_Phone_Number(InstitutionID, RegistrationID, SMS_GroupID, Name, MobileNo, Address) VALUES (@InstitutionID, @RegistrationID, @SMS_GroupID, @Name, @MobileNo, @Address)"
            SelectCommand="SELECT SMS_Group_Phone_Number.SMS_NumberID, SMS_Group_Phone_Number.SMS_GroupID, ISNULL(SMS_Group_Phone_Number.Name, '') AS Name, SMS_Group_Phone_Number.MobileNo, SMS_Group_Phone_Number.Add_Date, SMS_Group_Phone_Number.Address, SMS_Group_Name.GroupName FROM SMS_Group_Phone_Number INNER JOIN SMS_Group_Name ON SMS_Group_Phone_Number.SMS_GroupID = SMS_Group_Name.SMS_GroupID WHERE (SMS_Group_Phone_Number.InstitutionID = @InstitutionID) AND (SMS_Group_Phone_Number.SMS_GroupID = @SMS_GroupID OR @SMS_GroupID = 0) ORDER BY SMS_Group_Phone_Number.SMS_GroupID"
            UpdateCommand="UPDATE SMS_Group_Phone_Number SET Name =@Name, MobileNo =@MobileNo, Address =@Address WHERE (SMS_NumberID = @SMS_NumberID)"
            OnSelected="Group_Phone_NumberSQL_Selected"
            FilterExpression="MobileNo like '%{0}%' or Name like '%{0}%'" ProviderName="<%$ ConnectionStrings:TailorBDConnectionString.ProviderName %>">
            <DeleteParameters>
               <asp:Parameter Name="SMS_NumberID" Type="Int32" />
            </DeleteParameters>
            <FilterParameters>
               <asp:ControlParameter ControlID="SearchTextBox" Name="Mobile" PropertyName="Text" DefaultValue="%" />

            </FilterParameters>
            <InsertParameters>
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
               <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" />
               <asp:ControlParameter ControlID="GroupNameDropDownList" Name="SMS_GroupID" PropertyName="SelectedValue" Type="Int32" />
               <asp:ControlParameter ControlID="PersonNameTextBox" Name="Name" PropertyName="Text" Type="String" />
               <asp:ControlParameter ControlID="MobileNumberTextBox" Name="MobileNo" PropertyName="Text" />
               <asp:ControlParameter ControlID="AddressTextBox" Name="Address" PropertyName="Text" />
            </InsertParameters>
            <SelectParameters>
               <asp:ControlParameter ControlID="SelectGroupDropDownList" Name="SMS_GroupID" PropertyName="SelectedValue" />
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
            </SelectParameters>
            <UpdateParameters>
               <asp:Parameter Name="Name" Type="String" />
               <asp:ControlParameter ControlID="ContactListGridView" Name="MobileNo" PropertyName="SelectedDataKey[1]" Type="String" />
               <asp:Parameter Name="Address" Type="String" />
               <asp:Parameter Name="SMS_NumberID" Type="Int32" />
            </UpdateParameters>
         </asp:SqlDataSource>
         <%if (ContactListGridView.Rows.Count > 0)
           {%>
         <table class="NoPrint">
            <tr>
               <td>&nbsp;</td>
            </tr>
            <tr>
               <td>Text Message
                  <asp:RequiredFieldValidator ID="RequiredFieldValidator5" runat="server" ControlToValidate="SMSTextBox" CssClass="EroorSummer" ErrorMessage="Write SMS" ValidationGroup="SN"></asp:RequiredFieldValidator>
               </td>
            </tr>
            <tr>
               <td>
                  <asp:TextBox ID="SMSTextBox" runat="server" Height="107px" TextMode="MultiLine" Width="291px" CssClass="textbox"></asp:TextBox>
                  <div id="sms-counter" class="Counter_St">
                     Length: <span class="length"></span>/ <span class="per_message"></span>.  Count: <span class="messages"></span>SMS
                  </div>
               </td>
            </tr>
            <tr>
               <td>
                  <asp:CustomValidator ID="CV" runat="server" ClientValidationFunction="Validate" ErrorMessage="You do not select any contact from contact list." ForeColor="Red" ValidationGroup="SN"></asp:CustomValidator>
               </td>
            </tr>
            <tr>
               <td>
                  <asp:Button ID="SendSMSButton" runat="server" CssClass="ContinueButton" Text="Send" ValidationGroup="SN" OnClick="SendSMSButton_Click" />
                  <input type="button" value="Print this page" onclick="window.print()" class="ContinueButton">
                  <asp:Label ID="ErrorLabel" runat="server" CssClass="EroorSummer"></asp:Label>
                 
                   <asp:SqlDataSource ID="SMS_OtherInfoSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="INSERT INTO SMS_OtherInfo(InstitutionID, CustomerID, SMS_Send_ID) VALUES (@InstitutionID, @CustomerID, @SMS_Send_ID)" SelectCommand="SELECT * FROM [SMS_OtherInfo]" ProviderName="<%$ ConnectionStrings:TailorBDConnectionString.ProviderName %>">
                     <InsertParameters>
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                        <asp:Parameter Name="SMS_Send_ID" />
                        <asp:Parameter Name="CustomerID" />
                     </InsertParameters>
                  </asp:SqlDataSource>
                  </td>
            </tr>
         </table>
         <%} %>
      </ContentTemplate>
   </asp:UpdatePanel>

   <!--Add Group-->
   <div id="GroupAddPopup" runat="server" style="display: none;" class="modalPopup">
      <div id="GrpHeader" class="Htitle">
         <b>Create New Group</b>
         <div id="GClose" class="PopClose"></div>
      </div>
      <asp:UpdatePanel ID="upnlUsers" runat="server">
         <ContentTemplate>
            <div class="Pop_Contain">
               <table>
                  <tr>
                     <td>Group Name
                        <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="GroupName" CssClass="EroorStar" ErrorMessage="*" ValidationGroup="G"></asp:RequiredFieldValidator>
                     </td>
                  </tr>
                  <tr>
                     <td>
                        <asp:TextBox ID="GroupName" runat="server" CssClass="textbox" Width="200px" /></td>
                  </tr>
                  <tr>
                     <td>
                        <asp:LinkButton ID="PhoneNoLinkButton2" runat="server" OnClientClick="return AddPopup()">Add Mobile Number</asp:LinkButton>
                     </td>
                  </tr>
                  <tr>
                     <td>
                        <asp:Button ID="SaveButton" runat="server" Text="Save Group" CssClass="ContinueButton" OnClick="SaveButton_Click" ValidationGroup="G" />
                        <asp:Button ID="CancelButton" runat="server" Text="Cancel" OnClientClick="javascript:$find('mpeUserBehavior').hide();return false;" CssClass="ContinueButton" />
                        <asp:SqlDataSource ID="AddGroupSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" DeleteCommand="DELETE FROM [SMS_Group_Name] WHERE [SMS_GroupID] = @SMS_GroupID" InsertCommand="INSERT INTO SMS_Group_Name(InstitutionID, RegistrationID, GroupName) VALUES (@InstitutionID, @RegistrationID, @GroupName)" SelectCommand="SELECT GroupName, SMS_GroupID FROM SMS_Group_Name WHERE (InstitutionID = @InstitutionID)" UpdateCommand="UPDATE SMS_Group_Name SET GroupName = @GroupName WHERE (SMS_GroupID = @SMS_GroupID)" ProviderName="<%$ ConnectionStrings:TailorBDConnectionString.ProviderName %>">
                           <DeleteParameters>
                              <asp:Parameter Name="SMS_GroupID" Type="Int32" />
                           </DeleteParameters>
                           <InsertParameters>
                              <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                              <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" />
                              <asp:ControlParameter ControlID="GroupName" Name="GroupName" PropertyName="Text" Type="String" />
                           </InsertParameters>
                           <SelectParameters>
                              <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                           </SelectParameters>
                           <UpdateParameters>
                              <asp:Parameter Name="GroupName" Type="String" />
                              <asp:Parameter Name="SMS_GroupID" Type="Int32" />
                           </UpdateParameters>
                        </asp:SqlDataSource>
                        <br />
                        <br />
                        <asp:GridView ID="GroupGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="SMS_GroupID" DataSourceID="AddGroupSQL" AllowPaging="True">
                           <Columns>
                              <asp:BoundField DataField="GroupName" HeaderText="Group Name" SortExpression="GroupName" />
                              <asp:CommandField ShowEditButton="True" />
                              <asp:CommandField ShowDeleteButton="True" />
                           </Columns>
                           <PagerStyle CssClass="pgr" />
                        </asp:GridView>
                     </td>
                  </tr>
               </table>
            </div>
         </ContentTemplate>
      </asp:UpdatePanel>
      <asp:HiddenField ID="Tar_Con" runat="server" Value="0" />
      <asp:ModalPopupExtender ID="CMpe" runat="server"
         TargetControlID="Tar_Con"
         PopupControlID="GroupAddPopup"
         BehaviorID="mpeUserBehavior"
         CancelControlID="GClose"
         BackgroundCssClass="modalBackground"
         PopupDragHandleControlID="GrpHeader" />
   </div>

   <!--Add Number-->
   <div id="NumberPopup" runat="server" style="display: none;" class="modalPopup">
      <div id="NbrHeader" class="Htitle">
         <b>Add To Contact List</b>
         <div id="NClose" class="PopClose"></div>
      </div>
      <asp:UpdatePanel ID="UpdatePanel2" runat="server">
         <ContentTemplate>
            <div class="Pop_Contain">
               <table>
                  <tr>
                     <td>Group Name
                        <asp:LinkButton ID="AddnewLinkButton2" runat="server" OnClientClick="return CategoryPopup()">Add New</asp:LinkButton>
                     </td>
                  </tr>
                  <tr>
                     <td>
                        <asp:DropDownList ID="GroupNameDropDownList" runat="server" CssClass="dropdown" DataSourceID="AddGroupSQL" DataTextField="GroupName" DataValueField="SMS_GroupID" OnDataBound="GroupNameDropDownList_DataBound">
                           <asp:ListItem Value="0">[ SELECT ]</asp:ListItem>
                        </asp:DropDownList>
                        <asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="GroupNameDropDownList" CssClass="EroorStar" ErrorMessage="*" InitialValue="0" ValidationGroup="N"></asp:RequiredFieldValidator>
                     </td>
                  </tr>
                  <tr>
                     <td>Person Name</td>
                  </tr>
                  <tr>
                     <td>
                        <asp:TextBox ID="PersonNameTextBox" runat="server" CssClass="textbox" Width="189px"></asp:TextBox>
                        <asp:RequiredFieldValidator ID="RequiredFieldValidator6" runat="server" ControlToValidate="PersonNameTextBox" CssClass="EroorStar" ErrorMessage="*" ValidationGroup="N"></asp:RequiredFieldValidator>
                     </td>
                  </tr>
                  <tr>
                     <td>Mobile Number
                        <asp:RegularExpressionValidator ID="RegularExpressionValidator1" runat="server" ControlToValidate="MobileNumberTextBox" CssClass="EroorSummer" ErrorMessage="Invalid !" ValidationExpression="(88)?((011)|(015)|(016)|(017)|(018)|(019)|(013)|(014))\d{8,8}" ValidationGroup="N"></asp:RegularExpressionValidator>
                     </td>
                  </tr>
                  <tr>
                     <td>
                        <asp:TextBox ID="MobileNumberTextBox" runat="server" CssClass="textbox" Width="189px"></asp:TextBox>
                        <asp:RequiredFieldValidator ID="RequiredFieldValidator4" runat="server" ControlToValidate="MobileNumberTextBox" CssClass="EroorStar" ErrorMessage="*" ValidationGroup="N"></asp:RequiredFieldValidator>
                     </td>
                  </tr>
                  <tr>
                     <td>Address</td>
                  </tr>
                  <tr>
                     <td>
                        <asp:TextBox ID="AddressTextBox" runat="server" CssClass="textbox" TextMode="MultiLine" Width="189px"></asp:TextBox>
                     </td>
                  </tr>
                  <tr>
                     <td>
                        <asp:Label ID="MsgLabel" runat="server" ForeColor="#339933"></asp:Label>
                     </td>
                  </tr>
                  <tr>
                     <td>
                        <asp:Button ID="AddButton" runat="server" CssClass="ContinueButton" OnClick="AddButton_Click" Text="Add To List" ValidationGroup="N" />
                        <asp:Button ID="NCancelButton" runat="server" Text="Cancel" OnClientClick="javascript:$find('CancelToAdd').hide();return false;" CssClass="ContinueButton" />

                     </td>
                  </tr>
               </table>
            </div>
         </ContentTemplate>
      </asp:UpdatePanel>
      <asp:HiddenField ID="NHF" runat="server" Value="0" />
      <asp:ModalPopupExtender ID="AddMpe" runat="server"
         TargetControlID="NHF"
         PopupControlID="NumberPopup"
         BehaviorID="CancelToAdd"
         CancelControlID="NClose"
         BackgroundCssClass="modalBackground"
         PopupDragHandleControlID="NbrHeader" />
   </div>


   <script src="../../JS/SMSCount/sms_counter.min.js"></script>
   <script>
      $("[id*=SelectGroupDropDownList]").change(function () {
         $("[id*=SearchTextBox]").val('')
      });

      $('[id*=SMSTextBox]').countSms('#sms-counter');

      Sys.WebForms.PageRequestManager.getInstance().add_endRequest(function (e, f) {
         $('[id*=SMSTextBox]').countSms('#sms-counter');

         $('.textbox').focus(function () {
            $("[id*=MsgLabel]").text("");
         });


         $("[id*=SelectGroupDropDownList]").change(function () {
            $("[id*=SearchTextBox]").val('')
         });
      });



      $("[id*=SelectAllCheckBox]").live("click", function () {
         var a = $(this), b = $(this).closest("table");
         $("input[type=checkbox]", b).each(function () {
            a.is(":checked") ? ($(this).attr("checked", "checked"), $("td", $(this).closest("tr")).addClass("selected")) : ($(this).removeAttr("checked"), $("td", $(this).closest("tr")).removeClass("selected"));
         });
      });
      $("[id*=SelectCheckBox]").live("click", function () {
         var a = $(this).closest("table"), b = $("[id*=chkHeader]", a);
         $(this).is(":checked") ? ($("td", $(this).closest("tr")).addClass("selected"), $("[id*=chkRow]", a).length == $("[id*=chkRow]:checked", a).length && b.attr("checked", "checked")) : ($("td", $(this).closest("tr")).removeClass("selected"), b.removeAttr("checked"));
      });

      function Validate(d, c) {
         for (var b = document.getElementById("<%=ContactListGridView.ClientID %>").getElementsByTagName("input"), a = 0; a < b.length; a++) {
            if ("checkbox" == b[a].type && b[a].checked) {
               c.IsValid = !0;
               return;
            }
         }
         c.IsValid = !1;
      };
      /*---Modal popup---*/
      function CategoryPopup() { $find("mpeUserBehavior").show(); $find("CancelToAdd").hide(); return !1 }
      function AddPopup() { $find("CancelToAdd").show(); $find("mpeUserBehavior").hide(); return !1 };
   </script>

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
