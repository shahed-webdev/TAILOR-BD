<%@ Page Title="অর্ডার ডিলেট করুন" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Delete_Order.aspx.cs" Inherits="TailorBD.AccessAdmin.Order.Delete_Order" %>

<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="asp" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <link href="CSS/Delete_Order.css" rel="stylesheet" />
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <asp:ToolkitScriptManager ID="ToolkitScriptManager1" runat="server" />
   <h3>স্থায়ীভাবে অর্ডার ডিলেট করুন</h3>
   <asp:UpdatePanel ID="UpdatePanel2" runat="server">
      <ContentTemplate>
         <table>
            <tr>
               <td>অর্ডার নাম্বার</td>
               <td>কাস্টমারের নাম</td>
               <td>মোবাইল নাম্বার</td>
               <td>&nbsp;</td>
            </tr>
            <tr>
               <td>
                  <asp:TextBox ID="OrderNoTextBox" onkeypress="return isNumberKey(event)" placeholder="অর্ডার নাম্বার" runat="server" CssClass="textbox"></asp:TextBox>
               </td>
               <td>
                  <asp:TextBox ID="SearchNameTextBox" runat="server" CssClass="textbox" placeholder="কাস্টমারের নাম" Width="200px"></asp:TextBox>
               </td>
               <td>
                  <asp:TextBox ID="MobileNoTextBox" onkeypress="return isNumberKey(event)" runat="server" placeholder="মোবাইল নাম্বার" CssClass="textbox"></asp:TextBox>
               </td>
               <td>
                  <asp:Button ID="FindButton" runat="server" CssClass="SearchButton" ValidationGroup="S" Width="50px" />
               </td>
            </tr>
            <tr>
               <td colspan="4">
                  <asp:RegularExpressionValidator ID="RegularExpressionValidator2" runat="server" ControlToValidate="OrderNoTextBox" CssClass="EroorSummer" ErrorMessage="শুধু ইংরেজী নাম্বার লেখা যাবে" ValidationExpression="^\d+$" ValidationGroup="S"></asp:RegularExpressionValidator>
                  &nbsp;<asp:RegularExpressionValidator ID="RegularExpressionValidator3" runat="server" ControlToValidate="MobileNoTextBox" CssClass="EroorSummer" ErrorMessage="শুধু ইংরেজী নাম্বার লেখা যাবে" ValidationExpression="^\d+$" ValidationGroup="S"></asp:RegularExpressionValidator>
               </td>
            </tr>
            <tr>
               <td colspan="4">
                  <label class="Pending">Pending</label>
                  <label class="PartlyDelivered">Partly Delivered</label>
                  <label class="Delivered">Delivered</label>
               </td>
            </tr>
         </table>

         <asp:GridView ID="OrderListGridView" runat="server" AutoGenerateColumns="False" DataKeyNames="OrderID,WorkStatus,DeliveryStatus" DataSourceID="CustomerOrderdDressSQL" CssClass="mGrid" AllowPaging="True" PageSize="30" OnRowDataBound="OrderListGridView_RowDataBound" AllowSorting="True">
            <Columns>
               <asp:TemplateField>
                  <HeaderTemplate>
                     <asp:CheckBox ID="AllCheckBox" runat="server" Text=" " />
                  </HeaderTemplate>
                  <ItemTemplate>
                     <asp:CheckBox ID="DeleteCheckBox" runat="server" Text=" " CssClass="delcheckbox" />
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:TemplateField HeaderText="অর্ডার নং " SortExpression="OrderSerialNumber">
                  <ItemTemplate>
                     <asp:Label ID="Label1" runat="server" Font-Bold="True" Text='<%# Bind("OrderSerialNumber") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:BoundField DataField="CustomerName" HeaderText="কাস্টমারের নাম" SortExpression="CustomerName" />
               <asp:BoundField DataField="Phone" HeaderText="মোবাইল" SortExpression="Phone" />
               <asp:BoundField DataField="Details" HeaderText="পোষাকের বিবরণ" SortExpression="Details" />
               <asp:BoundField DataField="OrderDate" HeaderText="অর্ডার" SortExpression="OrderDate" DataFormatString="{0:d MMM yyyy}" />
               <asp:BoundField DataField="DeliveryDate" HeaderText="ডেলিভারী" SortExpression="DeliveryDate" DataFormatString="{0:d MMM yyyy}" />
               <asp:BoundField DataField="OrderAmount" HeaderText="মোট টাকা" SortExpression="OrderAmount" />
               <asp:BoundField DataField="Discount" HeaderText="ছাড়" SortExpression="Discount" />
               <asp:BoundField DataField="PaidAmount" HeaderText="পেইড" SortExpression="PaidAmount" />
               <asp:BoundField DataField="DueAmount" HeaderText="বাকি" SortExpression="DueAmount" />
               <asp:BoundField DataField="DeliveryStatus" HeaderText="ডেলিভারির অবস্থা" SortExpression="DeliveryStatus" />
            </Columns>
            <EmptyDataTemplate>
               No Records
            </EmptyDataTemplate>
            <PagerStyle CssClass="pgr" />
         </asp:GridView>
         <asp:SqlDataSource ID="CustomerOrderdDressSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
            SelectCommand="SELECT [Order].OrderID, [Order].CustomerID, [Order].RegistrationID, [Order].InstitutionID, [Order].Cloth_For_ID, [Order].OrderDate, [Order].DeliveryDate, [Order].OrderAmount, [Order].PaidAmount, [Order].Discount, [Order].DueAmount, [Order].OrderSerialNumber, [Order].PaymentStatus, [Order].DeliveryStatus, Customer.CustomerNumber, Customer.CustomerName, Customer.Phone, Customer.Address, STUFF((SELECT '; ' + Dress.Dress_Name + ' ' + CAST(OrderList.DressQuantity AS NVARCHAR(50)) + ' Piece ' FROM OrderList INNER JOIN Dress ON OrderList.DressID = Dress.DressID WHERE (OrderList.OrderID = [Order].OrderID) FOR XML PATH('')), 1, 1, '') AS Details, [Order].WorkStatus FROM [Order] INNER JOIN Customer ON [Order].CustomerID = Customer.CustomerID WHERE ([Order].InstitutionID = @InstitutionID) AND (Customer.Phone LIKE '%' + @Phone + '%') AND ([Order].OrderSerialNumber = @OrderSerialNumber) AND (ISNULL(Customer.CustomerName, N'') LIKE '%' + @CustomerName + '%') OR ([Order].InstitutionID = @InstitutionID) AND (Customer.Phone LIKE '%' + @Phone + '%') AND (ISNULL(Customer.CustomerName, N'') LIKE '%' + @CustomerName + '%') AND (@OrderSerialNumber = 0) ORDER BY [Order].OrderDate DESC"
            DeleteCommand="set context_info @RegistrationID
DELETE FROM Payment_Record WHERE (OrderID = @OrderID)
DELETE FROM Ordered_Measurement FROM Ordered_Measurement INNER JOIN  OrderList ON Ordered_Measurement.OrderListID = OrderList.OrderListID WHERE (OrderList.OrderID = @OrderID)
DELETE FROM Ordered_Dress_Style WHERE (OrderID = @OrderID)
UPDATE [Order] SET Discount = 0,PaidAmount = 0 WHERE (OrderID = @OrderID) 
DELETE FROM Order_Payment WHERE (OrderID = @OrderID)
DELETE FROM Order_WorkComplete_Date WHERE  (OrderID = @OrderID)
DELETE FROM Order_Delivery_Date WHERE  (OrderID = @OrderID)
DELETE FROM OrderList WHERE (OrderID = @OrderID)
DELETE FROM [Order] WHERE (OrderID = @OrderID)">
            <DeleteParameters>
               <asp:Parameter Name="OrderID" />
               <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
            </DeleteParameters>
            <SelectParameters>
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
               <asp:ControlParameter ControlID="MobileNoTextBox" DefaultValue="%" Name="Phone" PropertyName="Text" />
               <asp:ControlParameter ControlID="OrderNoTextBox" DefaultValue="0" Name="OrderSerialNumber" PropertyName="Text" />
               <asp:ControlParameter ControlID="SearchNameTextBox" DefaultValue="%" Name="CustomerName" PropertyName="Text" />
            </SelectParameters>
         </asp:SqlDataSource>

         <br />
         <%if (OrderListGridView.Rows.Count > 0)
           {%>

         <label class="SuccessMessage" id="DMLabel"></label>
         <br />
         <asp:Button ID="DeleteButton" runat="server" OnClientClick="return DeletePopup()" Text="ডিলেট করুন" ValidationGroup="D" />
         <%} %>
      </ContentTemplate>
   </asp:UpdatePanel>

   <div id="Popup" runat="server" style="display: none;" class="modalPopup">
      <div id="Header" class="Htitle">
         <b>ডিলেট কনফার্মেশন</b>
         <div id="Close" class="PopClose"></div>
      </div>
      <div class="Pop_Contain">
         <asp:UpdatePanel ID="UpdatePanel1" runat="server">
            <ContentTemplate>
               <asp:Label ID="MsgLabel" runat="server" />
               <asp:Button ID="ConfirmDeleteButton" runat="server" Text="হ্যাঁ" CssClass="ContinueButton" OnClick="ConfirmDeleteButton_Click" />
               <asp:Button ID="CancelButton" runat="server" Text="না" OnClientClick="javascript:$find('DMpe').hide();return false;" CssClass="ContinueButton" />
            </ContentTemplate>
         </asp:UpdatePanel>
      </div>

      <asp:HiddenField ID="Tar_Con" runat="server" Value="0" />
      <asp:ModalPopupExtender ID="MPE" runat="server"
         TargetControlID="Tar_Con"
         PopupControlID="Popup"
         CancelControlID="Close"
         BehaviorID="DMpe"
         BackgroundCssClass="modalBackground"
         PopupDragHandleControlID="Header" />

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
   <script type="text/javascript">
      //--Empty Text
      $("[id*=OrderNoTextBox]").focus(function () {
         $("[id*=SearchNameTextBox]").val("")
         $("[id*=MobileNoTextBox]").val("")
      });
      $("[id*=MobileNoTextBox]").focus(function () {
         $("[id*=OrderNoTextBox]").val("")
         $("[id*=SearchNameTextBox]").val("")
      });
      $("[id*=SearchNameTextBox]").focus(function () {
         $("[id*=OrderNoTextBox]").val("")
         $("[id*=MobileNoTextBox]").val("")
      });
      //--for Checkbox
      $("[id*=AllCheckBox]").live("click", function () { var a = $(this), b = $(this).closest("table"); $("input[type=checkbox]", b).each(function () { a.is(":checked") ? ($(this).attr("checked", "checked"), $("td", $(this).closest("tr")).addClass("selected")) : ($(this).removeAttr("checked"), $("td", $(this).closest("tr")).removeClass("selected")) }) });
      $("[id*=DeleteCheckBox]").live("click", function () { var a = $(this).closest("table"), b = $("[id*=chkHeader]", a); $(this).is(":checked") ? ($("td", $(this).closest("tr")).addClass("selected"), $("[id*=chkRow]", a).length == $("[id*=chkRow]:checked", a).length && b.attr("checked", "checked")) : ($("td", $(this).closest("tr")).removeClass("selected"), b.removeAttr("checked")) });

      function isNumberKey(a) { a = a.which ? a.which : event.keyCode; return 46 != a && 31 < a && (48 > a || 57 < a) ? !1 : !0 };

      //---Modal popup
      function DeletePopup() {
         $find("DMpe").show();
         $("[id*=MsgLabel]").removeClass("Success");
         $("[id*=MsgLabel]").addClass("Warning").text("আপনার নির্বাচিত অর্ডার সমূহ ডিলেট করলে, অর্ডার সমূহের সকল তথ্যাদি পুনরায় পাওয়া সম্ভব নয়। আপনি কি অর্ডার স্থায়ীভাবে ডিলেট করতে চান ?");
         $("[id*=ConfirmDeleteButton]").show();
         $("[id*=CancelButton]").show();
         return !1
      }

      function Success() {
         $("[id*=MsgLabel]").removeClass("Warning");
         $("[id*=MsgLabel]").addClass("Success").text("অর্ডার সফলভাবে ডিলেট হয়েছে !!");
         $("[id*=ConfirmDeleteButton]").hide();
         $("[id*=CancelButton]").hide();
      }

      function Error() {
         $("[id*=MsgLabel]").removeClass("Success");
         $("[id*=MsgLabel]").addClass("Warning").text("দুঃখিত!! আপনার নির্বাচিত অর্ডার ডিলেট করা সম্ভব হচ্ছেনা, অনুগ্রহ করে কর্তৃপক্ষের সাথে যোগাযোগ করুন");
         $("[id*=ConfirmDeleteButton]").hide();
         $("[id*=CancelButton]").hide();
      }
      
      $(document).ready(function () {
         //--Atlest One Checkedbox Cheked
         $("[id*=DeleteButton]").attr("disabled", "disabled");
         $("#DMLabel").text("অর্ডার ডিলেট করার জন্য অর্ডার তালিকা থেকে  অর্ডার নির্বাচন করুন");

         $(".delcheckbox").live("click", function () {
            if ($(".delcheckbox").find(":checked").length > 0) {
               $("#DMLabel").text("");
               $("[id*=DeleteButton]").removeAttr("disabled");
               $("[id*=DeleteButton]").addClass("ContinueButton");
            }
            else {
               $("[id*=DeleteButton]").attr("disabled", "disabled");
               $("[id*=DeleteButton]").removeClass("ContinueButton");
               $("#DMLabel").text("অর্ডার ডিলেট করার জন্য অর্ডার তালিকা থেকে অর্ডার নির্বাচন করুন");
            }
         });

         $("[id*=AllCheckBox]").live("click", function () {
            if ($(this).is(":checked")) {
               $("[id*=DeleteButton]").removeAttr("disabled");
               $("[id*=DeleteButton]").addClass("ContinueButton");
               $("#DMLabel").text("");
            }
            else {
               $("[id*=DeleteButton]").attr("disabled", "disabled");
               $("[id*=DeleteButton]").removeClass("ContinueButton");
               $("#DMLabel").text("অর্ডার ডিলেট করার জন্য অর্ডার তালিকা থেকে  অর্ডার নির্বাচন করুন");
            }
         });
      });

      //--For Updatepannel
      Sys.WebForms.PageRequestManager.getInstance().add_endRequest(function (a, b) {
         //--Empty Text
         $("[id*=OrderNoTextBox]").focus(function () {
            $("[id*=SearchNameTextBox]").val("")
            $("[id*=MobileNoTextBox]").val("")
         });
         $("[id*=MobileNoTextBox]").focus(function () {
            $("[id*=OrderNoTextBox]").val("")
            $("[id*=SearchNameTextBox]").val("")
         });
         $("[id*=SearchNameTextBox]").focus(function () {
            $("[id*=OrderNoTextBox]").val("")
            $("[id*=MobileNoTextBox]").val("")
         });

         $("[id*=DeleteButton]").attr("disabled", "disabled");
         $("#DMLabel").text("অর্ডার ডিলেট করার জন্য অর্ডার তালিকা থেকে অর্ডার নির্বাচন করুন");
      })
   </script>
</asp:Content>
