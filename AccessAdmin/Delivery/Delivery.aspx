<%@ Page Title="ডেলিভারী দিন" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Delivery.aspx.cs" Inherits="TailorBD.AccessAdmin.Delivery.Delivery" %>

<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="asp" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <link href="CSS/IncompleteWork.css" rel="stylesheet" />
   <link href="../../JS/jq_Profile/css/Profile_jquery-ui-1.8.23.custom.css" rel="stylesheet" />
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <asp:ToolkitScriptManager ID="ToolkitScriptManager1" runat="server" />
  <%-- <asp:UpdatePanel ID="UpdatePanel2" runat="server">
      <ContentTemplate>--%>
         <h3>যে অর্ডারগুলোর ডেলিভারী দেওয়া যাবে</h3>

         <table class="NoPrint">
            <tr>
               <td>অর্ডার নাম্বার</td>
               <td>কাস্টমারের নাম</td>
               <td>মোবাইল নাম্বার</td>
               <td>&nbsp;</td>
            </tr>
            <tr>
               <td>
                  <asp:TextBox ID="OrderNoTextBox" placeholder="অর্ডার নাম্বার" runat="server" CssClass="textbox"></asp:TextBox>
               </td>
               <td>
                  <asp:TextBox ID="SearchNameTextBox" runat="server" CssClass="textbox" placeholder="কাস্টমারের নাম" Width="200px"></asp:TextBox>
               </td>
               <td>
                  <asp:TextBox ID="MobileNoTextBox" runat="server" placeholder="মোবাইল নাম্বার" CssClass="textbox"></asp:TextBox>
               </td>
               <td>
                  <asp:Button ID="FindButton" runat="server" CssClass="SearchButton" ValidationGroup="1" Width="50px" />
               </td>
            </tr>
            <tr>
               <td colspan="4">
                  <asp:RegularExpressionValidator ID="RegularExpressionValidator2" runat="server" ControlToValidate="OrderNoTextBox" CssClass="EroorSummer" ErrorMessage="শুধু ইংরেজী নাম্বার লেখা যাবে" ValidationExpression="^\d+$" ValidationGroup="1"></asp:RegularExpressionValidator>
                  &nbsp;<asp:RegularExpressionValidator ID="RegularExpressionValidator3" runat="server" ControlToValidate="MobileNoTextBox" CssClass="EroorSummer" ErrorMessage="শুধু ইংরেজী নাম্বার লেখা যাবে" ValidationExpression="^\d+$" ValidationGroup="1"></asp:RegularExpressionValidator>
               </td>
            </tr>
         </table>
         <asp:Label ID="TotalLabel" runat="server"></asp:Label>
         <asp:GridView ID="CustomerOrderdDressGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="OrderID,DeliveryStatus,DeliveryDate,Masking,SMS_Balance,Phone,InstitutionName,CustomerID,OrderSerialNumber" DataSourceID="CustomerOrderdDressSQL" AllowPaging="True" PageSize="20" OnRowDataBound="CustomerOrderdDressGridView_RowDataBound">
            <Columns>
               <asp:TemplateField HeaderText="SMS">
                  <HeaderTemplate>
                     <asp:CheckBox ID="AllCheckBox" runat="server" Text="SMS" />
                  </HeaderTemplate>
                  <ItemTemplate>
                     <asp:CheckBox ID="SMSCheckBox" runat="server" Text=" " />
                  </ItemTemplate>
                  <ItemStyle Width="50px" />
               </asp:TemplateField>
               <asp:TemplateField>
                  <ItemTemplate>
                     <asp:HyperLink ID="PrintHyperLink" runat="server" NavigateUrl='<%# Eval("OrderID", "../Order/OrderDetailsForCustomer.aspx?OrderID={0}") %>' CssClass="Cmd_Print" />
                  </ItemTemplate>
                  <HeaderStyle CssClass="NoPrint" />
                  <ItemStyle CssClass="NoPrint" />
               </asp:TemplateField>
               <asp:TemplateField HeaderText="অর্ডার নং" SortExpression="OrderSerialNumber">
                  <ItemTemplate>
                     <asp:LinkButton ID="OrderNoLinkButton" ForeColor="#003399" Font-Underline="true" CssClass="ViewMesure" ToolTip="মাপ ও স্টাইল দেখুন" runat="server" Text='<%# Bind("OrderSerialNumber") %>' CommandArgument='<%# Bind("OrderID") %>' OnCommand="OrderNoLinkButton_Command" />
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:TemplateField HeaderText="নাম" SortExpression="CustomerName">
                  <ItemTemplate>
                     (<asp:Label ID="Label2" runat="server" Text='<%# Bind("CustomerNumber") %>'></asp:Label>)
                           <asp:Label ID="Label1" runat="server" Text='<%# Bind("CustomerName") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:BoundField DataField="Phone" HeaderText="মোবাইল" SortExpression="Phone" />
               <asp:TemplateField HeaderText="অর্ডার লিস্ট নং - পোষাক - পরিমান" SortExpression="Details">
                  <ItemTemplate>
                     <asp:HiddenField ID="OrderIDHiddenField" runat="server" Value='<%# Eval("OrderID") %>' />
                     <asp:GridView ID="OrderListGridView" runat="server" AutoGenerateColumns="False" DataKeyNames="OrderListID,Dress_Name" DataSourceID="OrderListSQL" CssClass="mGrid">
                        <Columns>
                           <asp:BoundField DataField="OrderList_SN" HeaderText="লিস্ট নং" SortExpression="OrderList_SN"></asp:BoundField>
                           <asp:BoundField DataField="Dress_Name" HeaderText="পোষাক" SortExpression="Dress_Name" />
                           <asp:BoundField DataField="DressQuantity" HeaderText="মোট" SortExpression="DressQuantity" />
                           <asp:TemplateField HeaderText="রেডি" SortExpression="ReadyForDeliveryQuantity">
                              <ItemTemplate>
                                 <asp:Label ID="ReadyDressLabel" runat="server" Text='<%# Bind("ReadyForDeliveryQuantity") %>'></asp:Label>
                              </ItemTemplate>
                              <ItemStyle Font-Bold="True" />
                           </asp:TemplateField>
                           <asp:BoundField DataField="DeliveryQuantity" HeaderText="ডেলিভারী হয়েছে" SortExpression="DeliveryQuantity" />
                        </Columns>
                     </asp:GridView>
                     <asp:SqlDataSource ID="OrderListSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT OrderList.OrderListID, OrderList.OrderList_SN, Dress.Dress_Name, OrderList.DressQuantity, OrderList.ReadyForDeliveryQuantity, OrderList.DeliveryQuantity FROM OrderList INNER JOIN Dress ON OrderList.DressID = Dress.DressID WHERE (OrderList.OrderID = @OrderID) AND (OrderList.ReadyForDeliveryQuantity &lt;&gt; 0) ORDER BY OrderList.OrderList_SN">
                        <SelectParameters>
                           <asp:ControlParameter ControlID="OrderIDHiddenField" Name="OrderID" PropertyName="Value" Type="Int32" />
                        </SelectParameters>
                     </asp:SqlDataSource>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:BoundField DataField="DeliveryDate" HeaderText="ডেলিভারী তারিখ" SortExpression="DeliveryDate" DataFormatString="{0:d MMM yyyy}"/>
               <asp:BoundField DataField="OrderAmount" HeaderText="মোট টাকা" SortExpression="OrderAmount" />
               <asp:BoundField DataField="PaidAmount" HeaderText="নগদ পেইড" SortExpression="PaidAmount" />
               <asp:BoundField DataField="DueAmount" HeaderText="বাকি" ReadOnly="True" SortExpression="DueAmount"/>
               <asp:BoundField DataField="StoreDatails" HeaderText="যেখানে রেখেছিলেন" SortExpression="StoreDatails"/>
               <asp:TemplateField HeaderText="ডেলিভারী" SortExpression="DeliveryStatus">
                  <ItemTemplate>
                     <a class="Delivery_Ic" href="DeliveryComplete.aspx?OrderID=<%#Eval("OrderID") %>"></a>
                  </ItemTemplate>
                  <HeaderStyle CssClass="NoPrint" />
                  <ItemStyle CssClass="NoPrint" />
               </asp:TemplateField>
            </Columns>
            <EmptyDataTemplate>
               কোন রেকর্ড নেই
            </EmptyDataTemplate>
            <PagerStyle CssClass="pgr" />
         </asp:GridView>
         <asp:SqlDataSource ID="CustomerOrderdDressSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
            SelectCommand="SELECT Odr.OrderID, Odr.CustomerID, Odr.RegistrationID, Odr.InstitutionID, Odr.Cloth_For_ID, Odr.OrderDate, Odr.DeliveryDate, Odr.OrderAmount, Odr.PaidAmount, Odr.Discount, Odr.DueAmount, Odr.OrderSerialNumber, Odr.PaymentStatus, Odr.DeliveryStatus, Odr.WorkStatus, Customer.CustomerNumber, Customer.CustomerName, Customer.Phone, Customer.Address, Odr.StoreDatails, SMS.SMS_Balance, SMS.Masking, Institution.InstitutionName FROM [Order] AS Odr INNER JOIN Customer ON Odr.CustomerID = Customer.CustomerID INNER JOIN SMS ON Customer.InstitutionID = SMS.InstitutionID INNER JOIN Institution ON Odr.InstitutionID = Institution.InstitutionID WHERE (Odr.InstitutionID = @InstitutionID) AND (Odr.DeliveryStatus IN (N'Pending', N'PartlyDelivered')) AND (Odr.WorkStatus IN (N'Completed', N'PartlyCompleted')) AND (Customer.Phone LIKE '%' + @Phone + '%') AND ((SELECT COUNT(*) AS Expr1 FROM OrderList WHERE (OrderID = Odr.OrderID) AND (ReadyForDeliveryQuantity &lt;&gt; 0)) &lt;&gt; 0) AND (Odr.OrderSerialNumber = @OrderSerialNumber) AND (ISNULL(Customer.CustomerName, N'') LIKE '%' + @CustomerName + '%') OR (Odr.InstitutionID = @InstitutionID) AND (Odr.DeliveryStatus IN (N'Pending', N'PartlyDelivered')) AND (Odr.WorkStatus IN (N'Completed', N'PartlyCompleted')) AND (Customer.Phone LIKE '%' + @Phone + '%') AND (ISNULL(Customer.CustomerName, N'') LIKE '%' + @CustomerName + '%') AND ((SELECT COUNT(*) AS Expr1 FROM OrderList AS OrderList_1 WHERE (OrderID = Odr.OrderID) AND (ReadyForDeliveryQuantity &lt;&gt; 0)) &lt;&gt; 0) AND (@OrderSerialNumber = 0) ORDER BY (CASE WHEN Odr.DeliveryDate = CAST(getdate() AS date) THEN 0 ELSE 1 END), ISNULL(Odr.DeliveryDate, N'1-1-3000')"
            OnSelected="CustomerOrderdDressSQL_Selected">
            <SelectParameters>
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
               <asp:ControlParameter ControlID="MobileNoTextBox" Name="Phone" PropertyName="Text" DefaultValue="%" />
               <asp:ControlParameter ControlID="OrderNoTextBox" Name="OrderSerialNumber" PropertyName="Text" DefaultValue="0" />
               <asp:ControlParameter ControlID="SearchNameTextBox" DefaultValue="%" Name="CustomerName" PropertyName="Text" />
            </SelectParameters>
         </asp:SqlDataSource>
         <br />

         <asp:CustomValidator ID="CV" runat="server" ClientValidationFunction="Validate" ErrorMessage="আপনি কোন অর্ডার সিলেক্ট করেন নি।" ForeColor="Red" ValidationGroup="A"></asp:CustomValidator>
         <br />
         <asp:Button ID="SMSButton" runat="server" CssClass="ContinueButton" OnClick="SMSButton_Click" Text="Send SMS" ValidationGroup="A" />
         <asp:Label ID="ErrorLabel" runat="server" CssClass="EroorSummer"></asp:Label>
         <asp:SqlDataSource ID="SMS_OtherInfoSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="INSERT INTO [SMS_OtherInfo] ([SMS_Send_ID], [InstitutionID], [CustomerID]) VALUES (@SMS_Send_ID, @InstitutionID, @CustomerID)" SelectCommand="SELECT * FROM [SMS_OtherInfo]">
            <InsertParameters>
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
               <asp:Parameter DbType="Guid" Name="SMS_Send_ID" />
               <asp:Parameter Name="CustomerID" Type="Int32" />
            </InsertParameters>
         </asp:SqlDataSource>
   <%--   </ContentTemplate>
   </asp:UpdatePanel>--%>

   <div id="ShowMesurePopup" runat="server" style="display: none;" class="modalPopup">
      <div id="Header" class="Htitle">
         <b>অর্ডারের মাপ ও স্টাইল</b>
         <div id="Close" class="PopClose"></div>
      </div>
      <div class="Pop_Contain">
         <div id="main">
            <ul>
               <li><a href="#MeasurementWithoutName">নাম ছাড়া মাপ</a></li>
               <li><a href="#MeasurementWithName">নাম সহ মাপ</a></li>
            </ul>
            <div id="MeasurementWithoutName">
               <asp:UpdatePanel ID="UpdatePanel1" runat="server">
                  <ContentTemplate>
                     <asp:GridView ID="OrderGridView" runat="server" AutoGenerateColumns="False" DataKeyNames="OrderListID" DataSourceID="NameOrderListSQL" ShowHeader="False" GridLines="None" BackColor="White" BorderColor="#CCCCCC" BorderStyle="None" BorderWidth="1px" CellPadding="1" CssClass="PrintGrid" PageSize="1">
                        <Columns>
                           <asp:TemplateField>
                              <ItemTemplate>
                                 <asp:HiddenField ID="OrderListIDHiddenField" runat="server" Value='<%# Bind("OrderListID") %>' />
                                 <table class="Table_style">
                                    <tr>
                                       <td>
                                          <asp:Label ID="Label1" runat="server" Text='<%# Bind("Dress_Name") %>'></asp:Label><br />
                                          <b>
                                             <asp:Label ID="DressQuantityLabel" runat="server" Text='<%# Bind("DressQuantity") %>' />
                                             P.</b>  </td>
                                       <td>অর্ডার নং:<br />
                                          <b class="O_Size">
                                             <asp:Label ID="OrderSerialNumberLabel" runat="server" Text='<%# Bind("OrderSerialNumber") %>' />(<asp:Label ID="OrderList_SNLabel" runat="server" Text='<%# Bind("OrderList_SN") %>' />)</b>
                                       </td>

                                       <td>ডেলিভারী:
                                                    <br />
                                          <b>
                                             <asp:Label ID="DeliveryDateLabel" runat="server" Text='<%# Bind("DeliveryDate","{0:d MMM yyyy}") %>' />
                                          </b></td>
                                    </tr>
                                 </table>

                                 <div class="MesureMentSt">
                                    <asp:DataList ID="MeasurementDataList" runat="server" DataSourceID="OrderedMeasurmentSQL" RepeatDirection="Horizontal" RepeatColumns="10">
                                       <ItemTemplate>
                                          <asp:HiddenField ID="Measurement_GroupIDHiddenField" runat="server" Value='<%# Eval("Measurement_GroupID") %>' />
                                          <asp:DataList ID="DataList" runat="server" DataSourceID="M_SQL">
                                             <ItemTemplate>
                                                <asp:Label ID="MeasurementLabel" runat="server" Text='<%# Eval("Measurement") %>' CssClass="M_Size" />
                                             </ItemTemplate>
                                             <SeparatorTemplate>
                                                <hr />
                                             </SeparatorTemplate>
                                          </asp:DataList>
                                          </div>
                                            <asp:SqlDataSource ID="M_SQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT        Measurement_Type.MeasurementType, Ordered_Measurement.Measurement
FROM            Ordered_Measurement INNER JOIN
                         Measurement_Type ON Ordered_Measurement.MeasurementTypeID = Measurement_Type.MeasurementTypeID
WHERE        (Measurement_Type.Measurement_GroupID = @Measurement_GroupID) AND (Ordered_Measurement.OrderListID = @OrderListID)
ORDER BY ISNULL(Measurement_Type.Measurement_Group_SerialNo, 9999)">
                                               <SelectParameters>
                                                  <asp:ControlParameter ControlID="Measurement_GroupIDHiddenField" Name="Measurement_GroupID" PropertyName="Value" />
                                                  <asp:ControlParameter ControlID="OrderListIDHiddenField" Name="OrderListID" PropertyName="Value" />
                                               </SelectParameters>
                                            </asp:SqlDataSource>
                                       </ItemTemplate>
                                    </asp:DataList>
                                    <asp:SqlDataSource ID="OrderedMeasurmentSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                                       SelectCommand="SELECT DISTINCT Measurement_Type.Measurement_GroupID,ISNULL(Measurement_Type.Ascending,9999) AS Ascending
FROM            Ordered_Measurement INNER JOIN
                         Measurement_Type ON Ordered_Measurement.MeasurementTypeID = Measurement_Type.MeasurementTypeID
WHERE        (Ordered_Measurement.OrderListID = @OrderListID)
ORDER BY Ascending">
                                       <SelectParameters>
                                          <asp:ControlParameter ControlID="OrderListIDHiddenField" Name="OrderListID" PropertyName="Value" />
                                       </SelectParameters>
                                    </asp:SqlDataSource>
                                    <asp:DataList ID="StyleDataList" runat="server" DataSourceID="StyleSQL" RepeatDirection="Horizontal">
                                       <ItemTemplate>
                                          <asp:Label ID="StyleLabel" runat="server" Text='<%# Eval("Style") %>' CssClass="M_Size" />
                                       </ItemTemplate>
                                    </asp:DataList>


                                    <asp:Label ID="DetailsLabel" Font-Italic="true" runat="server" Text='<%# Bind("Details") %>' CssClass="M_Size"></asp:Label>

                                    <asp:SqlDataSource ID="StyleSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                                       SelectCommand="SELECT  STUFF((SELECT ' ' + T.S FROM(SELECT DISTINCT ISNULL(Dress_Style_Category.CategorySerial, 99999) as NUB ,'('+

( SELECT  STUFF((SELECT ',' + Dress_Style.Dress_Style_Name +ISNULL ( ' = '+Ordered_Dress_Style.DressStyleMesurement+' ','') FROM Ordered_Dress_Style INNER JOIN
Dress_Style ON Ordered_Dress_Style.Dress_StyleID = Dress_Style.Dress_StyleID 
WHERE (Ordered_Dress_Style.OrderListID = @OrderListID) and (Dress_Style.Dress_Style_CategoryID = DS.Dress_Style_CategoryID) ORDER BY ISNULL(Dress_Style.StyleSerial, 99999)  FOR XML PATH('')), 1, 1, '')) + ')' AS S

FROM Ordered_Dress_Style as ODS INNER JOIN 
Dress_Style as DS ON ODS.Dress_StyleID = DS.Dress_StyleID INNER JOIN
Dress_Style_Category ON DS.Dress_Style_CategoryID = Dress_Style_Category.Dress_Style_CategoryID
WHERE (ODS.OrderListID = @OrderListID)) AS T ORDER BY T.NUB  FOR XML PATH('')), 1, 1, '') AS Style">
                                       <SelectParameters>
                                          <asp:ControlParameter ControlID="OrderListIDHiddenField" Name="OrderListID" PropertyName="Value" />
                                       </SelectParameters>
                                    </asp:SqlDataSource>
                              </ItemTemplate>
                              <ItemStyle CssClass="pgridstyle" />
                           </asp:TemplateField>
                        </Columns>
                        <PagerStyle CssClass="pgr" />
                     </asp:GridView>
                  </ContentTemplate>
               </asp:UpdatePanel>
            </div>
            <div id="MeasurementWithName">
               <asp:UpdatePanel ID="UpdatePanel3" runat="server">
                  <ContentTemplate>
                     <asp:GridView ID="OrderGridViewWithName" runat="server" AutoGenerateColumns="False" DataKeyNames="OrderListID" DataSourceID="NameOrderListSQL" ShowHeader="False" GridLines="None" BackColor="White" BorderColor="White" BorderStyle="None" BorderWidth="1px" CellPadding="1" CssClass="PrintGrid">
                        <Columns>
                           <asp:TemplateField>
                              <ItemTemplate>
                                 <asp:HiddenField ID="OrderListIDHiddenField" runat="server" Value='<%# Bind("OrderListID") %>' />

                                 <table class="Table_style">
                                    <tr>
                                       <td>
                                          <asp:Label ID="DNLabel" runat="server" Text='<%# Bind("Dress_Name") %>' /><br />
                                          <b>
                                             <asp:Label ID="DressQuantityLabel" runat="server" Text='<%# Bind("DressQuantity") %>' />
                                             P.</b></td>
                                       <td style="text-align: center">অর্ডার নং<br />
                                          <b class="O_Size">
                                             <asp:Label ID="OrderSerialNumberLabel" runat="server" Text='<%# Bind("OrderSerialNumber") %>' />
                                             (<asp:Label ID="OrderList_SNLabel" runat="server" Text='<%# Bind("OrderList_SN") %>' />)</b> </td>
                                       <td>ডেলিভারী<br />
                                          <b>
                                             <asp:Label ID="DeliveryDateLabel" runat="server" Text='<%# Bind("DeliveryDate","{0:d MMM yyyy}") %>' />
                                          </b></td>
                                    </tr>
                                 </table>

                                 <asp:DataList ID="MeasurementDataList" runat="server" DataSourceID="OrderedMeasurmentSQL" RepeatDirection="Horizontal">
                                    <ItemTemplate>
                                       <asp:Label ID="MeasurementLabel" runat="server" Text='<%# Eval("Measurement") %>' CssClass="M_Size" />
                                       , 
                                    </ItemTemplate>
                                 </asp:DataList>
                                 <asp:SqlDataSource ID="OrderedMeasurmentSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                                    SelectCommand="SELECT  STUFF((SELECT ' '+'(' + Measurement_Type.MeasurementType + '=' + Ordered_Measurement.Measurement+')'
FROM            Ordered_Measurement INNER JOIN
                         Measurement_Type ON Ordered_Measurement.MeasurementTypeID = Measurement_Type.MeasurementTypeID
WHERE        (Ordered_Measurement.OrderListID = @OrderListID)
ORDER BY CASE WHEN Measurement_Type.Ascending IS NULL THEN 9999 ELSE Measurement_Type.Ascending END FOR XML PATH('')), 1, 1, '') AS Measurement">
                                    <SelectParameters>
                                       <asp:ControlParameter ControlID="OrderListIDHiddenField" Name="OrderListID" PropertyName="Value" />
                                    </SelectParameters>
                                 </asp:SqlDataSource>

                                 <asp:DataList ID="StyleDataList" runat="server" DataSourceID="StyleSQL" RepeatDirection="Horizontal">
                                    <ItemTemplate>
                                       <asp:Label ID="StyleLabel" runat="server" Text='<%# Eval("Style") %>' CssClass="M_Size" />
                                    </ItemTemplate>
                                 </asp:DataList>

                                 <asp:Label ID="DetailsLabel" Font-Italic="true" runat="server" Text='<%# Bind("Details") %>' CssClass="M_Size"></asp:Label>

                                 <asp:SqlDataSource ID="StyleSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                                    SelectCommand="SELECT  STUFF((SELECT ' ' + T.S FROM(SELECT DISTINCT ISNULL(Dress_Style_Category.CategorySerial, 99999) as NUB , Dress_Style_Category.Dress_Style_Category_Name +'('+

( SELECT  STUFF((SELECT ',' + Dress_Style.Dress_Style_Name +ISNULL ( ' = '+Ordered_Dress_Style.DressStyleMesurement+' ','') FROM Ordered_Dress_Style INNER JOIN
Dress_Style ON Ordered_Dress_Style.Dress_StyleID = Dress_Style.Dress_StyleID 
WHERE (Ordered_Dress_Style.OrderListID = @OrderListID) and (Dress_Style.Dress_Style_CategoryID = DS.Dress_Style_CategoryID) ORDER BY ISNULL(Dress_Style.StyleSerial, 99999)  FOR XML PATH('')), 1, 1, '')) + ')' AS S

FROM Ordered_Dress_Style as ODS INNER JOIN 
Dress_Style as DS ON ODS.Dress_StyleID = DS.Dress_StyleID INNER JOIN
Dress_Style_Category ON DS.Dress_Style_CategoryID = Dress_Style_Category.Dress_Style_CategoryID
WHERE (ODS.OrderListID = @OrderListID)) AS T ORDER BY T.NUB  FOR XML PATH('')), 1, 1, '') AS Style">
                                    <SelectParameters>
                                       <asp:ControlParameter ControlID="OrderListIDHiddenField" Name="OrderListID" PropertyName="Value" />
                                    </SelectParameters>
                                 </asp:SqlDataSource>
                              </ItemTemplate>
                              <ItemStyle CssClass="pgridstyle" />
                           </asp:TemplateField>
                        </Columns>
                        <PagerStyle CssClass="pgr" />
                     </asp:GridView>

                     <asp:SqlDataSource ID="NameOrderListSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                        SelectCommand="SELECT OrderList.OrderListID, Dress.Dress_Name, OrderList.DressQuantity, OrderList.OrderListAmount, OrderList.Details, [Order].OrderDate, [Order].DeliveryDate, [Order].OrderSerialNumber, [Order].OrderAmount, OrderList.OrderList_SN, Customer.CustomerNumber, Customer.CustomerName, Customer.Phone FROM OrderList INNER JOIN Dress ON OrderList.DressID = Dress.DressID INNER JOIN [Order] ON OrderList.OrderID = [Order].OrderID INNER JOIN Customer ON OrderList.CustomerID = Customer.CustomerID AND [Order].CustomerID = Customer.CustomerID WHERE (OrderList.OrderID = @OrderID) AND (OrderList.InstitutionID = @InstitutionID)">
                        <SelectParameters>
                           <asp:Parameter Name="OrderID" Type="Int32" />
                           <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                        </SelectParameters>
                     </asp:SqlDataSource>
                  </ContentTemplate>
               </asp:UpdatePanel>
            </div>
         </div>
      </div>
      <asp:HiddenField ID="IHiddenField" runat="server" Value="0" />
      <asp:ModalPopupExtender ID="Mpe" runat="server"
         TargetControlID="IHiddenField"
         PopupControlID="ShowMesurePopup"
         CancelControlID="Close"
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

   <script src="../../JS/jq_Profile/jquery-ui-1.8.23.custom.min.js"></script>
   <script type="text/javascript">
      /*--Select at least one Checkbox Students GridView-----*/
      function Validate(d, c) { for (var b = document.getElementById("<%=CustomerOrderdDressGridView.ClientID %>").getElementsByTagName("input"), a = 0; a < b.length; a++) if ("checkbox" == b[a].type && b[a].checked) { c.IsValid = !0; return } c.IsValid = !1 };

      //--for Checkbox
      $("[id*=AllCheckBox]").live("click", function () { var a = $(this), b = $(this).closest("table"); $("input[type=checkbox]", b).each(function () { a.is(":checked") ? ($(this).attr("checked", "checked"), $("td", $(this).closest("tr")).addClass("selected")) : ($(this).removeAttr("checked"), $("td", $(this).closest("tr")).removeClass("selected")) }) });
      $("[id*=SMSCheckBox]").live("click", function () { var a = $(this).closest("table"), b = $("[id*=chkHeader]", a); $(this).is(":checked") ? ($("td", $(this).closest("tr")).addClass("selected"), $("[id*=chkRow]", a).length == $("[id*=chkRow]:checked", a).length && b.attr("checked", "checked")) : ($("td", $(this).closest("tr")).removeClass("selected"), b.removeAttr("checked")) });


      /**Empty Text**/
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

      $(document).ready(function () {
         $(function () { $('#main').tabs(); });
      });

      Sys.WebForms.PageRequestManager.getInstance().add_endRequest(function (a, b) {
         /**Empty Text**/
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

         function setHeight() {
            var totHeight = $(window).height();
            $('.Pop_Contain').css({ 'max-height': totHeight - 200 + 'px' });
         }
         setHeight();
         $(window).on('resize', function () { setHeight(); });
      })
   </script>
</asp:Content>
