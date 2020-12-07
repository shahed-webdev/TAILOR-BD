<%@ Page Title="খরচ যুক্ত করুন" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Add_Expanse.aspx.cs" Inherits="TailorBD.AccessAdmin.Accounts.Add_Expanse" %>

<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="asp" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">

   <link href="CSS/Expanse.css" rel="stylesheet" />
   <link href="../../JS/DatePicker/jquery.datepick.css" rel="stylesheet" />
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <asp:ToolkitScriptManager ID="ToolkitScriptManager1" runat="server" />
   <h3>খরচ যুক্ত করুন</h3>
   <asp:UpdatePanel ID="UpdatePanel1" runat="server">
      <ContentTemplate>
         <table>
            <tr>
               <td>
                  <div class="Search_Date">কোন তারিখ থেকে</div>
               </td>
               <td>
                  <div class="Search_Date">
                     কোন তারিখ পর্যন্ত
                  </div>

               </td>
               <td>
                  <asp:LinkButton ID="CategoryLinkButton" runat="server" OnClientClick="return CategoryPopup()">নতুন খরচের ধরণ যুক্ত করুন</asp:LinkButton>
               </td>
               <td>&nbsp;</td>

            </tr>
            <tr>
               <td>
                  <div class="Search_Date">
                     <asp:TextBox ID="FormDateTextBox" runat="server" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" placeholder="কোন তারিখ থেকে" CssClass="Datetime"></asp:TextBox>
                  </div>
               </td>
               <td>
                  <div class="Search_Date">
                     <asp:TextBox ID="ToDateTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" placeholder="কোন তারিখ পর্যন্ত" CssClass="Datetime"></asp:TextBox>
                  </div>
               </td>
               <td>
                  <asp:DropDownList ID="FindCategoryDropDownList" runat="server" AppendDataBoundItems="True" CssClass="dropdown" DataSourceID="CategorySQL" DataTextField="CategoryName" DataValueField="ExpanseCategoryID">
                     <asp:ListItem Value="0">[ সকল খরচের ধরণ ]</asp:ListItem>
                  </asp:DropDownList>
               </td>
               <td>
                  <asp:Button ID="FindButton" runat="server" CssClass="SearchButton" OnClick="FindButton_Click" />
               </td>
            </tr>
            <tr>
               <td colspan="4">
                  <asp:LinkButton ID="AddExpanseLinkButton" runat="server" OnClientClick="return AddPopup()">খরচ যুক্ত করুন</asp:LinkButton>
                  <asp:SqlDataSource ID="CategorySQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT CategoryName, ExpanseCategoryID FROM Expanse_Category WHERE (InstitutionID = @InstitutionID)">
                     <SelectParameters>
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                     </SelectParameters>
                  </asp:SqlDataSource>
               </td>
            </tr>
         </table>
         <asp:Label ID="ExpnseLabel" runat="server" Font-Bold="True" Font-Size="Large" ForeColor="#33CC33"></asp:Label>
         <asp:SqlDataSource ID="ViewExpanseSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
            SelectCommand="SELECT ISNULL(SUM(ExpanseAmount), 0) AS TotalExp FROM Expanse WHERE (InstitutionID = @InstitutionID) AND ((ExpanseCategoryID = @ExpanseCategoryID ) or ( @ExpanseCategoryID = 0))  AND ((ExpanseDate BETWEEN @Fdate AND @TDate) OR ((@Fdate = '1-1-1760') AND (@TDate = '1-1-1760')))">
            <SelectParameters>
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
               <asp:ControlParameter ControlID="FindCategoryDropDownList" Name="ExpanseCategoryID" PropertyName="SelectedValue" />
               <asp:ControlParameter ControlID="FormDateTextBox" Name="Fdate" PropertyName="Text" DefaultValue="1-1-1760" />
               <asp:ControlParameter ControlID="ToDateTextBox" Name="TDate" PropertyName="Text" DefaultValue="1-1-1760" />
            </SelectParameters>
         </asp:SqlDataSource>
         <asp:GridView ID="ExpanseGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="ExpanseID" DataSourceID="ExpanseSQL" AllowPaging="True" PageSize="150">
            <Columns>
               <asp:TemplateField HeaderText="খরচের ধরণ" SortExpression="CategoryName">
                  <EditItemTemplate>
                     <asp:Label ID="Label1" runat="server" Text='<%# Bind("CategoryName") %>'></asp:Label>
                  </EditItemTemplate>
                  <ItemTemplate>
                     <asp:Label ID="Label1" runat="server" Text='<%# Bind("CategoryName") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:BoundField DataField="ExpanseFor" HeaderText="কি বাবদ বিস্তারিত" SortExpression="ExpanseFor" />
               <asp:TemplateField HeaderText="টাকা" SortExpression="ExpanseAmount">
                  <EditItemTemplate>
                     <asp:TextBox ID="ExpTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" Text='<%# Bind("ExpanseAmount") %>'></asp:TextBox>
                  </EditItemTemplate>
                  <ItemTemplate>
                     <asp:Label ID="Label2" runat="server" Text='<%# Bind("ExpanseAmount") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:BoundField DataField="ExpanseDate" DataFormatString="{0:d MMM yyyy}" HeaderText="তারিখ" SortExpression="ExpanseDate" ReadOnly="True" />
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
         <asp:SqlDataSource ID="ExpanseSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" DeleteCommand="set context_info @RegistrationID
DELETE FROM [Expanse] WHERE [ExpanseID] = @ExpanseID"
            InsertCommand="INSERT INTO Expanse(RegistrationID, InstitutionID, ExpanseCategoryID, ExpanseAmount, ExpanseFor, AccountID) VALUES (@RegistrationID, @InstitutionID, @ExpanseCategoryID, @ExpanseAmount, @ExpanseFor, @AccountID)" SelectCommand="SELECT Expanse.ExpanseDate, Expanse_Category.CategoryName, Expanse.ExpanseFor, Expanse.ExpanseAmount, Expanse.ExpanseID,Expanse.Expense_Payment_Method FROM Expanse INNER JOIN Expanse_Category ON Expanse.ExpanseCategoryID = Expanse_Category.ExpanseCategoryID WHERE (Expanse.InstitutionID = @InstitutionID) AND ((Expanse.ExpanseCategoryID = @ExpanseCategoryID ) or ( @ExpanseCategoryID = 0)) AND((Expanse.ExpanseDate BETWEEN @Fdate AND @TDate) OR ((@Fdate = '1-1-1760') AND (@TDate = '1-1-1760'))) ORDER BY Expanse.ExpanseID DESC" UpdateCommand="set context_info @RegistrationID
UPDATE Expanse SET ExpanseAmount = @ExpanseAmount, ExpanseFor = @ExpanseFor WHERE (ExpanseID = @ExpanseID)">
            <DeleteParameters>
               <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
               <asp:Parameter Name="ExpanseID" Type="Int32" />
            </DeleteParameters>
            <InsertParameters>
               <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
               <asp:ControlParameter ControlID="CategoryDropDownList" Name="ExpanseCategoryID" PropertyName="SelectedValue" Type="Int32" />
               <asp:ControlParameter ControlID="AccountDropDownList" Name="AccountID" PropertyName="SelectedValue" />
               <asp:ControlParameter ControlID="AmountTextBox" Name="ExpanseAmount" PropertyName="Text" Type="Double" />
               <asp:ControlParameter ControlID="ExpaneForTextBox" Name="ExpanseFor" PropertyName="Text" Type="String" />
            </InsertParameters>
            <SelectParameters>
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
               <asp:ControlParameter ControlID="FindCategoryDropDownList" Name="ExpanseCategoryID" PropertyName="SelectedValue" />
               <asp:ControlParameter ControlID="FormDateTextBox" DefaultValue="1-1-1760" Name="Fdate" PropertyName="Text" />
               <asp:ControlParameter ControlID="ToDateTextBox" DefaultValue="1-1-1760" Name="TDate" PropertyName="Text" />
            </SelectParameters>
            <UpdateParameters>
               <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
               <asp:Parameter Name="ExpanseAmount" Type="Double" />
               <asp:Parameter Name="ExpanseFor" Type="String" />
               <asp:Parameter Name="ExpanseID" Type="Int32" />
            </UpdateParameters>
         </asp:SqlDataSource>
      </ContentTemplate>
   </asp:UpdatePanel>

   <div id="CategoryPopup" runat="server" style="display: none" class="modalPopup">
      <div id="GrpHeader" class="Htitle">
         <b>খরচের ধরণ যুক্ত করুন</b>
         <div id="Close" class="PopClose"></div>
      </div>
      <asp:UpdatePanel ID="upnlUsers" runat="server">
         <ContentTemplate>
            <div class="Pop_Contain">
               <table>
                  <tr>
                     <td>খরচের ধরণ
                <asp:RequiredFieldValidator ID="RequiredFieldValidator4" runat="server" ControlToValidate="CategoryNameTextBox" CssClass="EroorSummer" ErrorMessage="খরচের ধরণ দিন" ValidationGroup="CI"></asp:RequiredFieldValidator>
                     </td>
                     <td>&nbsp;</td>
                  </tr>
                  <tr>
                     <td>
                        <asp:TextBox ID="CategoryNameTextBox" runat="server" CssClass="textbox"></asp:TextBox>
                     </td>
                     <td>
                        <asp:Button ID="NewCategoryButton" runat="server" CssClass="ContinueButton" Text="যুক্ত করুন" OnClick="NewCategoryButton_Click" ValidationGroup="CI" />
                     </td>
                  </tr>
                  <tr>
                     <td colspan="2">
                        <asp:LinkButton ID="AddExpanseLinkButton2" runat="server" OnClientClick="return AddPopup()">খরচ যুক্ত করুন</asp:LinkButton>
                     </td>
                  </tr>
               </table>
               <asp:GridView ID="CategoryNameGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="ExpanseCategoryID" DataSourceID="CategoryNameSQL" OnRowDeleted="CategoryNameGridView_RowDeleted" AllowPaging="True">
                  <Columns>
                     <asp:BoundField DataField="CategoryName" HeaderText="খরচের ধরণ" SortExpression="CategoryName" />
                     <asp:TemplateField ShowHeader="False">
                        <EditItemTemplate>
                           <asp:LinkButton ID="UpdateLinkButton" runat="server" CausesValidation="True" CommandName="Update" CssClass="Updete"></asp:LinkButton>
                           &nbsp;<asp:LinkButton ID="CancelLinkButton" runat="server" CausesValidation="False" CommandName="Cancel" CssClass="Cancel"></asp:LinkButton>
                        </EditItemTemplate>
                        <ItemTemplate>
                           <asp:LinkButton ID="EditLinkButton" runat="server" CausesValidation="False" CommandName="Edit" CssClass="Edit"></asp:LinkButton>
                        </ItemTemplate>
                        <ItemStyle Width="40px" />
                     </asp:TemplateField>
                     <asp:TemplateField ShowHeader="False">
                        <ItemTemplate>
                           <asp:LinkButton ID="DeleteLinkButton" runat="server" CausesValidation="False" CssClass="Delete" OnClientClick="return confirm('Are You Sure Want To Delete?')" CommandName="Delete"></asp:LinkButton>
                        </ItemTemplate>
                        <ItemStyle Width="40px" />
                     </asp:TemplateField>
                  </Columns>
                  <EmptyDataTemplate>
                     কোন রেকর্ড নেই
                  </EmptyDataTemplate>
                  <PagerStyle CssClass="pgr" />
               </asp:GridView>

               <asp:SqlDataSource ID="CategoryNameSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" DeleteCommand=" IF NOT EXISTS ( SELECT  * FROM Expanse WHERE (InstitutionID = @InstitutionID) AND (ExpanseCategoryID= @ExpanseCategoryID))
DELETE FROM [Expanse_Category] WHERE [ExpanseCategoryID] = @ExpanseCategoryID"
                  InsertCommand=" IF NOT EXISTS ( SELECT  * FROM [Expanse_Category] WHERE (InstitutionID = @InstitutionID) AND (CategoryName= @CategoryName))
INSERT INTO [Expanse_Category] ([RegistrationID], [InstitutionID], [CategoryName]) VALUES (@RegistrationID, @InstitutionID, @CategoryName)"
                  SelectCommand="SELECT * FROM Expanse_Category WHERE (InstitutionID = @InstitutionID) ORDER BY ExpanseCategoryID DESC" UpdateCommand="UPDATE Expanse_Category SET CategoryName = @CategoryName WHERE (ExpanseCategoryID = @ExpanseCategoryID)">
                  <DeleteParameters>
                     <asp:Parameter Name="InstitutionID" />
                     <asp:Parameter Name="ExpanseCategoryID" Type="Int32" />
                  </DeleteParameters>
                  <InsertParameters>
                     <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                     <asp:ControlParameter ControlID="CategoryNameTextBox" Name="CategoryName" PropertyName="Text" Type="String" />
                     <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                  </InsertParameters>
                  <SelectParameters>
                     <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                  </SelectParameters>
                  <UpdateParameters>
                     <asp:Parameter Name="CategoryName" Type="String" />
                     <asp:Parameter Name="ExpanseCategoryID" Type="Int32" />
                  </UpdateParameters>
               </asp:SqlDataSource>

            </div>
         </ContentTemplate>
      </asp:UpdatePanel>
      <asp:HiddenField ID="Tar_Con" runat="server" Value="0" />
      <asp:ModalPopupExtender ID="MPE" runat="server"
         TargetControlID="Tar_Con"
         PopupControlID="CategoryPopup"
         BehaviorID="CMpe"
         CancelControlID="Close"
         BackgroundCssClass="modalBackground"
         PopupDragHandleControlID="GrpHeader" />
   </div>
   <div id="AddExpansePopup" runat="server" style="display: none;" class="modalPopup">
      <div id="IHeader" class="Htitle">
         <b>খরচ যুক্ত করুন</b>
         <div id="IClose" class="PopClose"></div>
      </div>
      <asp:UpdatePanel ID="UpdatePanel2" runat="server">
         <ContentTemplate>
            <div class="Pop_Contain">
               <table>
                  <tr>
                     <td>
                        <asp:LinkButton ID="AddnewLinkButton" runat="server" OnClientClick="return CategoryPopup()">নতুন খরচের ধরণ যুক্ত করুন</asp:LinkButton>
                        <asp:RequiredFieldValidator ID="RequiredFieldValidator5" runat="server" ControlToValidate="CategoryDropDownList" CssClass="EroorSummer" ErrorMessage="খরচের ধরণ সিলেক্ট করুন" InitialValue="0" ValidationGroup="1">*</asp:RequiredFieldValidator>
                     </td>
                  </tr>
                  <tr>
                     <td>
                        <asp:DropDownList ID="CategoryDropDownList" runat="server" CssClass="dropdown" DataSourceID="CategorySQL" DataTextField="CategoryName" DataValueField="ExpanseCategoryID" AppendDataBoundItems="True">
                           <asp:ListItem Value="0">[খরচের ধরণ নির্বাচন করুন ]</asp:ListItem>
                        </asp:DropDownList>
                     </td>
                  </tr>
                  <tr>
                     <td>খরচের পরিমান<asp:RequiredFieldValidator ID="RequiredFieldValidator6" runat="server" ControlToValidate="AmountTextBox" CssClass="EroorSummer" ErrorMessage="খরচের পরিমান দিন" ValidationGroup="1">*</asp:RequiredFieldValidator>
                        <asp:RegularExpressionValidator ID="RegularExpressionValidator2" runat="server" ControlToValidate="AmountTextBox" CssClass="EroorSummer" ErrorMessage="টাকা ইংরেজি সংখ্যা লিখুন" ValidationExpression="^\d+$" ValidationGroup="1">*</asp:RegularExpressionValidator>
                     </td>
                  </tr>
                  <tr>
                     <td>
                        <asp:TextBox ID="AmountTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" CssClass="textbox" placeholder="খরচের পরিমান"></asp:TextBox>
                     </td>
                  </tr>
                  <tr>
                     <td>কি বাবদ</td>
                  </tr>
                  <tr>
                     <td>
                        <asp:TextBox ID="ExpaneForTextBox" runat="server" CssClass="textbox" placeholder="কি বাবদ বিস্তারিত বিবরণ"></asp:TextBox>
                     </td>
                  </tr>
                  <%
                     System.Data.DataView DetailsDV = new System.Data.DataView();
                     DetailsDV = (System.Data.DataView)AccountSQL.Select(DataSourceSelectArguments.Empty);
                     if (DetailsDV.Count > 0)
                     {%>
                  <tr>
                     <td>অ্যাকাউন্ট
                     </td>
                  </tr>
                  <tr>
                     <td>

                        <asp:DropDownList ID="AccountDropDownList" runat="server" CssClass="dropdown" DataSourceID="AccountSQL" DataTextField="AccountName" DataValueField="AccountID" OnDataBound="AccountDropDownList_DataBound">
                        </asp:DropDownList>

                        <asp:SqlDataSource ID="AccountSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT AccountID,AccountName  +' ('+ CONVERT (VARCHAR(100), AccountBalance)+')' as AccountName  FROM Account WHERE (InstitutionID = @InstitutionID AND AccountBalance &lt;&gt; 0)">
                           <SelectParameters>
                              <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                           </SelectParameters>
                        </asp:SqlDataSource>

                     </td>
                  </tr>
                  <%}%>
                  <tr>
                     <td>
                        <label id="ErMsg" class="SuccessMessage"></label>
                        <asp:Label ID="CheckBalanceLabel" runat="server" CssClass="EroorStar"></asp:Label>
                     </td>
                  </tr>
                  <tr>
                     <td>

                        <asp:Button ID="SubmitButton" runat="server" CssClass="ContinueButton" Text="খরচ যুক্ত করুন" OnClick="SubmitButton_Click" ValidationGroup="1" />
                        <asp:ValidationSummary ID="ValidationSummary1" runat="server" CssClass="EroorSummer" DisplayMode="List" ShowMessageBox="True" ValidationGroup="1" />
                     </td>
                  </tr>
               </table>
            </div>
         </ContentTemplate>
      </asp:UpdatePanel>
      <asp:HiddenField ID="IHiddenField" runat="server" Value="0" />
      <asp:ModalPopupExtender ID="IMpe" runat="server"
         TargetControlID="IHiddenField"
         PopupControlID="AddExpansePopup"
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
      });

      function setHeight() {
         var totHeight = $(window).height();
         $('.Pop_Contain').css({ 'max-height': totHeight - 200 + 'px' });
      }

      $(window).on('resize', function () { setHeight(); });
      setHeight();
      
      //Disable the submit button after clicking
      $("form").submit(function () {
         $("[id*=SubmitButton]").attr("disabled", true);
         setTimeout(function () {
            $("[id*=SubmitButton]").prop('disabled', false);
         }, 2000); // 2 seconds
         return true;
      })

      //For Update Pannel
      Sys.WebForms.PageRequestManager.getInstance().add_endRequest(function (a, b) {
         $(".Datetime").datepick();

         function setHeight() {
            var totHeight = $(window).height();
            $('.Pop_Contain').css({ 'max-height': totHeight - 200 + 'px' });
         }
         setHeight();
         $(window).on('resize', function () { setHeight(); });
      });

         function Success() {
            var e = $('#ErMsg');
            e.text("খরচ সফলভাবে যুক্ত হয়েছে");
            e.fadeIn();
            e.queue(function () { setTimeout(function () { e.dequeue(); }, 3000); });
            e.fadeOut('slow');
         }
         function isNumberKey(a) { a = a.which ? a.which : event.keyCode; return 46 != a && 31 < a && (48 > a || 57 < a) ? !1 : !0 };

         /*---Modal popup---*/
         function CategoryPopup() { $find("CMpe").show(); $find("AddMpe").hide(); return !1 }
         function AddPopup() { $find("AddMpe").show(); $find("CMpe").hide(); return !1 };
   </script>

</asp:Content>
