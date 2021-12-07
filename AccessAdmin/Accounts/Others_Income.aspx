<%@ Page Title="অন্যান্য আয়" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Others_Income.aspx.cs" Inherits="TailorBD.AccessAdmin.Accounts.Others_Income" %>

<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="asp" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <link href="CSS/Expanse.css" rel="stylesheet" />
   <link href="../../JS/DatePicker/jquery.datepick.css" rel="stylesheet" />
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <asp:ToolkitScriptManager ID="TSM" runat="server" />
   <h3>অন্যান্য আয় যুক্ত করুন</h3>
   <asp:UpdatePanel ID="UpdatePanel1" runat="server">
      <ContentTemplate>
         <table>
            <tr>
               <td>&nbsp;<asp:LinkButton ID="AddnewLinkButton" runat="server" OnClientClick="return CategoryPopup()">নতুন আয়ের ধরণ যুক্ত করুন</asp:LinkButton>
               </td>
               <td>কোন তারিখ থেকে</td>
               <td>কোন তারিখ পর্যন্ত</td>
               <td>&nbsp;</td>
            </tr>
            <tr>
               <td>
                  <asp:DropDownList ID="FindCategoryDropDownList" runat="server" AppendDataBoundItems="True" CssClass="dropdown" DataSourceID="CategorySQL" DataTextField="Extra_Income_CategoryName" DataValueField="Extra_IncomeCategoryID">
                     <asp:ListItem Value="0">[আয়ের ধরণ নির্বাচন করুন ]</asp:ListItem>
                  </asp:DropDownList>
               </td>
               <td>
                  <asp:TextBox ID="FormDateTextBox" runat="server" CssClass="Datetime" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" placeholder="কোন তারিখ থেকে" Width="130px"></asp:TextBox>
               </td>
               <td>
                  <asp:TextBox ID="ToDateTextBox" runat="server" CssClass="Datetime" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" placeholder="কোন তারিখ পর্যন্ত" Width="130px"></asp:TextBox>
               </td>
               <td>
                  <asp:Button ID="FindButton" runat="server" CssClass="SearchButton" OnClick="FindButton_Click" />
               </td>
            </tr>
            <tr>
               <td>
                  <asp:LinkButton ID="AddIncomeLinkButton4" runat="server" OnClientClick="return AddPopup()">আয় যুক্ত করুন</asp:LinkButton>
               </td>
               <td>&nbsp;</td>
               <td>&nbsp;</td>
               <td>&nbsp;</td>
            </tr>
         </table>

         <asp:Label ID="AmountLabel" runat="server" Font-Bold="True" Font-Size="Large" ForeColor="#33CC33"></asp:Label>

         <asp:SqlDataSource ID="ViewIncomeSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" 
            SelectCommand="SELECT ISNULL(SUM(Extra_IncomeAmount), 0) AS Amount FROM [Extra_Income] WHERE (InstitutionID = @InstitutionID) AND ((Extra_IncomeCategoryID = @Extra_IncomeCategoryID) or ( @Extra_IncomeCategoryID = 0))  AND ((Extra_IncomeDate BETWEEN @Fdate AND @TDate) OR ((@Fdate = '1-1-1760') AND (@TDate = '1-1-1760')))">
            <SelectParameters>
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
               <asp:ControlParameter ControlID="FindCategoryDropDownList" Name="Extra_IncomeCategoryID" PropertyName="SelectedValue" />
               <asp:ControlParameter ControlID="FormDateTextBox" DefaultValue="1-1-1760" Name="Fdate" PropertyName="Text" />
               <asp:ControlParameter ControlID="ToDateTextBox" DefaultValue="1-1-1760" Name="TDate" PropertyName="Text" />
            </SelectParameters>
         </asp:SqlDataSource>

         <asp:GridView ID="ExtraIncomeGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="Extra_IncomeID" DataSourceID="ExtraIncomeSQL" AllowPaging="True" PageSize="20" AllowSorting="True">
            <Columns>
               <asp:BoundField DataField="Extra_Income_CategoryName" HeaderText="আয়ের ধরণ" ReadOnly="True" SortExpression="Extra_Income_CategoryName" />
               <asp:BoundField DataField="Extra_IncomeFor" HeaderText="কি বাবদ" SortExpression="Extra_IncomeFor" />
               <asp:TemplateField HeaderText="আয়ের পরিমান" SortExpression="Extra_IncomeAmount">
                  <EditItemTemplate>
                     <asp:TextBox ID="TextBox1" runat="server" Text='<%# Bind("Extra_IncomeAmount") %>'></asp:TextBox>
                  </EditItemTemplate>
                  <ItemTemplate>
                     <asp:Label ID="Label1" runat="server" Text='<%# Bind("Extra_IncomeAmount") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:BoundField DataField="Extra_IncomeDate" HeaderText="তারিখ" SortExpression="Extra_IncomeDate" ReadOnly="True" DataFormatString="{0:d MMM yyyy}" />
              <asp:TemplateField>
                  <EditItemTemplate>
                     <asp:LinkButton ID="UpdateLinkButton" runat="server" CausesValidation="True" CommandName="Update" CssClass="Updete"></asp:LinkButton>
                     &nbsp;<asp:LinkButton ID="CancelLinkButton" runat="server" CausesValidation="False" CommandName="Cancel" CssClass="Cancel"></asp:LinkButton>
                  </EditItemTemplate>
                  <ItemTemplate>
                     <asp:LinkButton ID="EditLinkButton" runat="server" CausesValidation="False" CommandName="Edit" CssClass="Edit"></asp:LinkButton>
                  </ItemTemplate>
                   <HeaderStyle CssClass="No_Print" />
                  <ItemStyle Width="70px" CssClass="No_Print" />
               </asp:TemplateField>
               <asp:TemplateField>
                  <ItemTemplate>
                     <asp:LinkButton ID="DeleteLinkButton" runat="server" CausesValidation="False" OnClientClick="return confirm('Are You Sure Want To Delete?')" CommandName="Delete" CssClass="Delete"></asp:LinkButton>
                  </ItemTemplate>
                   <HeaderStyle CssClass="No_Print" />
                  <ItemStyle Width="40px" CssClass="No_Print" />
               </asp:TemplateField>
            </Columns>
            <EmptyDataTemplate>
               কোন রেকর্ড নেই
            </EmptyDataTemplate>
            <PagerStyle CssClass="pgr" />
         </asp:GridView>
         <asp:SqlDataSource ID="ExtraIncomeSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" 
            DeleteCommand="set context_info @RegistrationID
DELETE FROM [Extra_Income] WHERE [Extra_IncomeID] = @Extra_IncomeID" 
            InsertCommand="INSERT INTO Extra_Income(InstitutionID, RegistrationID, Extra_IncomeCategoryID, Extra_IncomeAmount, Extra_IncomeFor, AccountID) VALUES (@InstitutionID, @RegistrationID, @Extra_IncomeCategoryID, @Extra_IncomeAmount, @Extra_IncomeFor,@AccountID)" 
            SelectCommand="SELECT Extra_Income.Extra_IncomeAmount, Extra_Income.Extra_IncomeFor, Extra_Income.Extra_IncomePayment_Method, Extra_Income.Extra_IncomeDate, Extra_IncomeCategory.Extra_Income_CategoryName, Extra_Income.Extra_IncomeID FROM Extra_Income INNER JOIN Extra_IncomeCategory ON Extra_Income.Extra_IncomeCategoryID = Extra_IncomeCategory.Extra_IncomeCategoryID WHERE (Extra_Income.InstitutionID = @InstitutionID) AND (Extra_Income.Extra_IncomeCategoryID = @Extra_IncomeCategoryID) AND (Extra_Income.Extra_IncomeDate BETWEEN @Fdate AND @TDate) OR (Extra_Income.InstitutionID = @InstitutionID) AND (Extra_Income.Extra_IncomeDate BETWEEN @Fdate AND @TDate) AND (@Extra_IncomeCategoryID = 0) OR (Extra_Income.InstitutionID = @InstitutionID) AND (Extra_Income.Extra_IncomeCategoryID = @Extra_IncomeCategoryID) AND (@Fdate = '1-1-1760') AND (@TDate = '1-1-1760') OR (Extra_Income.InstitutionID = @InstitutionID) AND (@Extra_IncomeCategoryID = 0) AND (@Fdate = '1-1-1760') AND (@TDate = '1-1-1760') ORDER BY Extra_Income.Extra_IncomeID DESC"
             UpdateCommand="set context_info @RegistrationID
UPDATE Extra_Income SET Extra_IncomeAmount = @Extra_IncomeAmount, Extra_IncomeFor = @Extra_IncomeFor WHERE (Extra_IncomeID = @Extra_IncomeID)">
            <DeleteParameters>
               <asp:Parameter Name="Extra_IncomeID" Type="Int32" />
               <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
            </DeleteParameters>
            <InsertParameters>
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
               <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
               <asp:ControlParameter ControlID="CategoryDropDownList" Name="Extra_IncomeCategoryID" PropertyName="SelectedValue" Type="Int32" />
               <asp:ControlParameter ControlID="AccountDropDownList" Name="AccountID" PropertyName="SelectedValue" />
               <asp:ControlParameter ControlID="AmountTextBox" Name="Extra_IncomeAmount" PropertyName="Text" Type="Double" />
               <asp:ControlParameter ControlID="IncomeForTextBox" Name="Extra_IncomeFor" PropertyName="Text" Type="String" />
            </InsertParameters>
            <SelectParameters>
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
               <asp:ControlParameter ControlID="FindCategoryDropDownList" Name="Extra_IncomeCategoryID" PropertyName="SelectedValue" DefaultValue="" />
               <asp:ControlParameter ControlID="FormDateTextBox" DefaultValue="1-1-1760" Name="Fdate" PropertyName="Text" />
               <asp:ControlParameter ControlID="ToDateTextBox" DefaultValue="1-1-1760" Name="TDate" PropertyName="Text" />
            </SelectParameters>
            <UpdateParameters>
               <asp:Parameter Name="Extra_IncomeAmount" Type="Double" />
               <asp:Parameter Name="Extra_IncomeFor" Type="String" />
               <asp:Parameter Name="Extra_IncomeID" Type="Int32" />
               <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
            </UpdateParameters>
         </asp:SqlDataSource>
      </ContentTemplate>
   </asp:UpdatePanel>

   <div id="CategoryPopup" runat="server" style="display: none" class="modalPopup">
      <div id="GrpHeader" class="Htitle">
         <b>আয়ের ধরণ যুক্ত করুন</b>
         <div id="GClose" class="PopClose"></div>
      </div>
      <asp:UpdatePanel ID="upnlUsers" runat="server">
         <ContentTemplate>
            <div class="Pop_Contain">
               <table>
                  <tr>
                     <td>আয়ের ধরণ এর নাম <asp:RequiredFieldValidator ID="RequiredFieldValidator4" runat="server" ControlToValidate="NewCategoryNameTextBox" CssClass="EroorStar" ErrorMessage="*" ValidationGroup="G"></asp:RequiredFieldValidator>
                     </td>
                     <td>&nbsp;</td>
                  </tr>
                  <tr>
                     <td>
                        <asp:TextBox ID="NewCategoryNameTextBox" runat="server" CssClass="textbox" Width="200px" /></td>
                     <td>
                        <asp:Button ID="SaveButton" runat="server" CssClass="ContinueButton" OnClick="SaveButton_Click" Text="যুক্ত করুন" ValidationGroup="G" />
                     </td>
                  </tr>
                  <tr>
                     <td>
                     
                        <asp:SqlDataSource ID="NewCategorySQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" DeleteCommand="DELETE FROM [Extra_IncomeCategory] WHERE [Extra_IncomeCategoryID] = @Extra_IncomeCategoryID" InsertCommand=" IF NOT EXISTS ( SELECT  * FROM [Extra_IncomeCategory] WHERE (InstitutionID = @InstitutionID) AND ([Extra_Income_CategoryName]= @Extra_Income_CategoryName))

INSERT INTO [Extra_IncomeCategory] ([InstitutionID], [RegistrationID], [Extra_Income_CategoryName]) VALUES (@InstitutionID, @RegistrationID, @Extra_Income_CategoryName)"
                           SelectCommand="SELECT * FROM [Extra_IncomeCategory] WHERE ([InstitutionID] = @InstitutionID)" UpdateCommand="UPDATE Extra_IncomeCategory SET Extra_Income_CategoryName = @Extra_Income_CategoryName WHERE (Extra_IncomeCategoryID = @Extra_IncomeCategoryID)">
                           <DeleteParameters>
                              <asp:Parameter Name="Extra_IncomeCategoryID" Type="Int32" />
                           </DeleteParameters>
                           <InsertParameters>
                              <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                              <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                              <asp:ControlParameter ControlID="NewCategoryNameTextBox" Name="Extra_Income_CategoryName" PropertyName="Text" Type="String" />
                           </InsertParameters>
                           <SelectParameters>
                              <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                           </SelectParameters>
                           <UpdateParameters>
                              <asp:Parameter Name="Extra_Income_CategoryName" Type="String" />
                              <asp:Parameter Name="Extra_IncomeCategoryID" Type="Int32" />
                           </UpdateParameters>
                        </asp:SqlDataSource>
                     </td>
                     <td>&nbsp;</td>
                  </tr>
               </table>
               <asp:LinkButton ID="AddIncomeLinkButton3" runat="server" OnClientClick="return AddPopup()">আয় যুক্ত করুন</asp:LinkButton>
               <asp:GridView ID="AllCategory" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="Extra_IncomeCategoryID" DataSourceID="NewCategorySQL" AllowPaging="True">
                  <Columns>
                     <asp:BoundField DataField="Extra_Income_CategoryName" HeaderText="আয়ের ধরণ" SortExpression="Extra_Income_CategoryName" />
                      <asp:TemplateField>
                  <EditItemTemplate>
                     <asp:LinkButton ID="UpdateLinkButton" runat="server" CausesValidation="True" CommandName="Update" CssClass="Updete"></asp:LinkButton>
                     &nbsp;<asp:LinkButton ID="CancelLinkButton" runat="server" CausesValidation="False" CommandName="Cancel" CssClass="Cancel"></asp:LinkButton>
                  </EditItemTemplate>
                  <ItemTemplate>
                     <asp:LinkButton ID="EditLinkButton" runat="server" CausesValidation="False" CommandName="Edit" CssClass="Edit"></asp:LinkButton>
                  </ItemTemplate>
                   <HeaderStyle CssClass="No_Print" />
                  <ItemStyle Width="40px" CssClass="No_Print" />
               </asp:TemplateField>
               <asp:TemplateField>
                  <ItemTemplate>
                     <asp:LinkButton ID="DeleteLinkButton" runat="server" CausesValidation="False" OnClientClick="return confirm('Are You Sure Want To Delete?')" CommandName="Delete" CssClass="Delete"></asp:LinkButton>
                  </ItemTemplate>
                   <HeaderStyle CssClass="No_Print" />
                  <ItemStyle Width="40px" CssClass="No_Print" />
               </asp:TemplateField>
                  </Columns>
               </asp:GridView>
            </div>
         </ContentTemplate>
      </asp:UpdatePanel>
      <asp:HiddenField ID="Tar_Con" runat="server" Value="0" />
      <asp:ModalPopupExtender ID="MPE" runat="server"
         TargetControlID="Tar_Con"
         PopupControlID="CategoryPopup"
         CancelControlID="GClose"
         BehaviorID="CMpe"
         BackgroundCssClass="modalBackground"
         PopupDragHandleControlID="GrpHeader" />
   </div>

   <div id="AddIncomePopup" runat="server" style="display: none;" class="modalPopup">
      <div id="IHeader" class="Htitle">
         <b>আয় যুক্ত করুন</b>
         <div id="IClose" class="PopClose"></div>
      </div>
      <asp:UpdatePanel ID="UpdatePanel2" runat="server">
         <ContentTemplate>
            <div class="Pop_Contain">
               <table>
                  <tr>
                     <td>
                        <asp:LinkButton ID="AddnewLinkButton2" runat="server" OnClientClick="return CategoryPopup()">নতুন আয়ের ধরণ যুক্ত করুন</asp:LinkButton>
                  <asp:RequiredFieldValidator ID="RequiredFieldValidator6" runat="server" ControlToValidate="CategoryDropDownList" CssClass="EroorSummer" ErrorMessage="আয়ের ধরণ সিলেক্ট করুন" InitialValue="0" ValidationGroup="1">*</asp:RequiredFieldValidator>
                     </td>
                  </tr>
                  <tr>
                     <td>
                        <asp:DropDownList ID="CategoryDropDownList" runat="server" CssClass="dropdown" DataSourceID="CategorySQL" DataTextField="Extra_Income_CategoryName" DataValueField="Extra_IncomeCategoryID" OnDataBound="CategoryDropDownList_DataBound">
                        </asp:DropDownList>
                        <asp:SqlDataSource ID="CategorySQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM [Extra_IncomeCategory] WHERE ([InstitutionID] = @InstitutionID)">
                           <SelectParameters>
                              <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                           </SelectParameters>
                        </asp:SqlDataSource>
                     </td>
                  </tr>
                  <tr>
                     <td>মোট টাকা
                  <asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="AmountTextBox" CssClass="EroorSummer" ErrorMessage="মোট টাকা দিন" ValidationGroup="1">*</asp:RequiredFieldValidator>
                        &nbsp;<asp:RegularExpressionValidator ID="RegularExpressionValidator3" runat="server" ControlToValidate="AmountTextBox" CssClass="EroorSummer" ErrorMessage="মোট টাকা ইংরেজি সংখ্যা লিখুন" ValidationExpression="^\d+$" ValidationGroup="1">*</asp:RegularExpressionValidator>
                     </td>
                  </tr>
                  <tr>
                     <td>
                        <asp:TextBox ID="AmountTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" CssClass="textbox" placeholder="আয়ের পরিমান"></asp:TextBox>
                     </td>
                  </tr>
                  <tr>
                     <td>কি বাবদ
                        </td>
                  </tr>
                  <tr>
                     <td>
                        <asp:TextBox ID="IncomeForTextBox" runat="server" CssClass="textbox" placeholder="কি বাবদ"></asp:TextBox>
                     </td>
                  </tr>
                  <%System.Data.DataView DetailsDV = new System.Data.DataView();
                  DetailsDV = (System.Data.DataView)AccountSQL.Select(DataSourceSelectArguments.Empty);
                  if (DetailsDV.Count > 0){%>
                  <tr>
                     <td>
                        অ্যাকাউন্ট
                     </td>
                  </tr>
                  <tr>
                     <td>
                       
                        <asp:DropDownList ID="AccountDropDownList" runat="server" CssClass="dropdown" DataSourceID="AccountSQL" DataTextField="AccountName" DataValueField="AccountID" OnDataBound="AccountDropDownList_DataBound">
                        </asp:DropDownList>
                        
                        <asp:SqlDataSource ID="AccountSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT AccountID,AccountName  FROM Account WHERE (InstitutionID = @InstitutionID)">
                           <SelectParameters>
                              <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                           </SelectParameters>
                        </asp:SqlDataSource>
                        
                     </td>
                  </tr>
                  <%}%>
                  <tr>
                     <td><label id="ErMsg" class="SuccessMessage"></label></td>
                  </tr>
                  <tr>
                     <td>

                        <asp:Button ID="SubmitButton" runat="server" CssClass="ContinueButton" Text="আয় যুক্ত করুন" OnClick="SubmitButton_Click" ValidationGroup="1" />
                     </td>
                  </tr>
                  <tr>
                     <td>
                        <asp:ValidationSummary ID="ValidationSummary1" runat="server" ShowMessageBox="True" ValidationGroup="1" CssClass="EroorSummer" DisplayMode="List" />
                     </td>
                  </tr>
               </table>
            </div>
         </ContentTemplate>
      </asp:UpdatePanel>
      <asp:HiddenField ID="IHiddenField" runat="server" Value="0" />
      <asp:ModalPopupExtender ID="IMpe" runat="server"
         TargetControlID="IHiddenField"
         PopupControlID="AddIncomePopup"
         CancelControlID="IClose"
         BehaviorID="AddMpe"
         BackgroundCssClass="modalBackground"
         PopupDragHandleControlID="IHeader" />
   </div>

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
   <script src="../../JS/DatePicker/jquery.datepick.js"></script>
   <script type="text/javascript">
      $(function () {
         $('.Datetime').datepick();

         function setHeight() {
            var totHeight = $(window).height();
            $('.Pop_Contain').css({ 'max-height': totHeight - 200 + 'px' });
         }

         $(window).on('resize', function () { setHeight(); });
         setHeight();

      });

      Sys.WebForms.PageRequestManager.getInstance().add_endRequest(EndRequestHandler);
      function EndRequestHandler(sender, args) {
         $(".Datetime").datepick();

         function setHeight() {
            var totHeight = $(window).height();
            $('.Pop_Contain').css({ 'max-height': totHeight - 200 + 'px' });
         }

         $(window).on('resize', function () { setHeight(); });
         setHeight();
      }

      function isNumberKey(a) { a = a.which ? a.which : event.keyCode; return 46 != a && 31 < a && (48 > a || 57 < a) ? !1 : !0 };

      function Success() {
         var e = $('#ErMsg');
         e.text("আয় সফলভাবে যুক্ত হয়েছে");
         e.fadeIn();
         e.queue(function () {setTimeout(function () {e.dequeue();}, 3000);});
         e.fadeOut('slow');
      }

      /*---Modal popup---*/
      function CategoryPopup() { $find("CMpe").show(); $find("AddMpe").hide(); return !1 }
      function AddPopup() { $find("AddMpe").show(); $find("CMpe").hide(); return !1 };


      //Disable the submit button after clicking
      $("form").submit(function () {
         $(".ContinueButton").attr("disabled", true);
         setTimeout(function () {
            $(".ContinueButton").prop('disabled', false);
         }, 2000); // 2 seconds
         return true;
      })
   </script>
</asp:Content>
