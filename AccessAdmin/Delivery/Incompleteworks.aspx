<%@ Page Title="অর্ডারের কাজ সম্পূন্ন করুন" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Incompleteworks.aspx.cs" Inherits="TailorBD.AccessAdmin.Delivery.Incompleteworks" %>

<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="asp" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <link href="CSS/IncompleteWork.css" rel="stylesheet" />
   <link href="../../JS/DatePicker/jquery.datepick.css" rel="stylesheet" />
   <link href="../../JS/jq_Profile/css/Profile_jquery-ui-1.8.23.custom.css" rel="stylesheet" />
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <asp:ToolkitScriptManager ID="ToolkitScriptManager1" runat="server" />
   <asp:SqlDataSource ID="SMSBalanceSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM [SMS] WHERE ([InstitutionID] = @InstitutionID)">
      <SelectParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
      </SelectParameters>
   </asp:SqlDataSource>
   <asp:FormView ID="SMSBalanceFormView" runat="server" DataKeyNames="SMSID" DataSourceID="SMSBalanceSQL" Width="100%">
      <ItemTemplate>
         <h3>যে সকল অর্ডারের কাজ শেষ হয়েছে টিক দিয়ে সম্পূন্ন করুন (অবশিষ্ট এসএমএস: 
         <asp:Label ID="SMS_BalanceLabel" runat="server" Text='<%# Bind("SMS_Balance") %>' />)</h3>
      </ItemTemplate>
   </asp:FormView>


   <asp:UpdatePanel ID="UpdatePanel1" runat="server">
      <ContentTemplate>
         <asp:RadioButtonList ID="FindRadioButtonList" runat="server" RepeatDirection="Horizontal" RepeatLayout="Flow" CssClass="RadioB">
            <asp:ListItem Selected="True">Order No. And Mobile No.</asp:ListItem>
            <asp:ListItem>Delivery Date</asp:ListItem>
         </asp:RadioButtonList>
         <div class="Search_Number">
            <table>
               <tr>
                  <td>
                     <asp:RegularExpressionValidator ID="RegularExpressionValidator4" runat="server" ControlToValidate="MobileNoTextBox" CssClass="EroorSummer" ErrorMessage="শুধু ইংরেজী নাম্বার লেখা যাবে" ValidationExpression="^\d+$" ValidationGroup="1"></asp:RegularExpressionValidator>
                  </td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
               </tr>
               <tr>
                  <td>মোবাইল নাম্বার</td>
                  <td>কাস্টমারের নাম</td>
                  <td>&nbsp;</td>
               </tr>
               <tr>
                  <td>
                     <asp:TextBox ID="MobileNoTextBox" runat="server" CssClass="textbox" placeholder="মোবাইল নাম্বার" Width="200px"></asp:TextBox>
                  </td>
                  <td>
                     <asp:TextBox ID="SearchNameTextBox" runat="server" CssClass="textbox" placeholder="কাস্টমারের নাম" Width="200px"></asp:TextBox>
                  </td>
                  <td>&nbsp;</td>
               </tr>
               <tr>
                  <td>অর্ডার নাম্বার (এক বা একাধিক)</td>
                  <td>ঠিকানা</td>
                  <td>&nbsp;</td>
               </tr>
               <tr>
                  <td>
                     <asp:TextBox ID="OrderNoTextBox" placeholder="উদাহরণস্বরূপ: অর্ডার নাম্বার 10,20,30" runat="server" CssClass="textbox" Height="72px" TextMode="MultiLine" Width="200px"></asp:TextBox>
                  </td>
                  <td>
                     <asp:TextBox ID="AddressTextBox" runat="server" CssClass="textbox" Height="72px" placeholder="ঠিকানা" TextMode="MultiLine" Width="200px"></asp:TextBox>
                  </td>
                  <td style="vertical-align: bottom">
                     <asp:Button ID="FindButton" runat="server" CssClass="SearchButton" />
                  </td>
               </tr>
               <tr>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td style="vertical-align: bottom">&nbsp;</td>
               </tr>
            </table>
         </div>

         <div class="Search_Date">
            <table>
               <tr>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
               </tr>
               <tr>
                  <td>কোন তারিখ থেকে</td>
                  <td>কোন তারিখ পর্যন্ত</td>
                  <td>&nbsp;</td>
               </tr>
               <tr>
                  <td>
                     <asp:TextBox ID="EFormDateTextBox" runat="server" CssClass="Datetime" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" placeholder="কোন তারিখ থেকে" Width="130px"></asp:TextBox>
                  </td>
                  <td>
                     <asp:TextBox ID="EToDateTextBox" runat="server" CssClass="Datetime" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" placeholder="কোন তারিখ পর্যন্ত" Width="130px"></asp:TextBox>
                  </td>
                  <td>
                     <asp:Button ID="FindButton2" runat="server" CssClass="SearchButton" />
                  </td>
               </tr>
               <tr>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
               </tr>
            </table>
         </div>

         <asp:Label ID="TotalLabel" runat="server"></asp:Label>
         <div style="float:right">
            <div class="Today Indicator">Today's Date Delivery</div>
            <div class="Over_Today Indicator">Date Over Delivery</div>
         </div>
         <asp:GridView ID="CustomerOrderdDressGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="OrderID,Masking,SMS_Balance,Phone,CustomerName,InstitutionName,CustomerID,WorkStatus,DeliveryDate,OrderSerialNumber" DataSourceID="CustomerOrderdDressSQL" AllowPaging="True" PageSize="25" OnRowDataBound="CustomerOrderdDressGridView_RowDataBound">
            <Columns>
               <asp:TemplateField SortExpression="DeliveryStatus">
                  <HeaderTemplate>
                     <asp:CheckBox ID="AllCheckBox" runat="server" Text=" " />
                  </HeaderTemplate>
                  <ItemTemplate>
                     <asp:CheckBox ID="CompleteCheckBox" runat="server" Text=" " />
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:TemplateField HeaderText="অর্ডার নং " SortExpression="OrderSerialNumber">
                  <ItemTemplate>
                     <asp:LinkButton ID="OrderNoLinkButton" CssClass="ViewMesure" ToolTip="মাপ ও স্টাইল দেখুন" runat="server" Text='<%# Bind("OrderSerialNumber") %>' CommandArgument='<%# Bind("OrderID") %>' OnCommand="OrderNoLinkButton_Command" />
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:TemplateField HeaderText="নাম" SortExpression="CustomerName">
                  <ItemTemplate>
                     (<asp:Label ID="Label1" runat="server" Text='<%# Bind("CustomerNumber") %>'></asp:Label>)
                          <asp:Label ID="Label2" runat="server" Text='<%# Bind("CustomerName") %>'></asp:Label>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:BoundField DataField="Phone" HeaderText="মোবাইল" SortExpression="Phone" />
               <asp:BoundField DataField="Address" HeaderText="ঠিকানা" SortExpression="Address" />
               <asp:TemplateField HeaderText="অর্ডার লিস্ট নং - পোষাক - পরিমান" SortExpression="Details">
                  <ItemTemplate>
                     <asp:HiddenField ID="OrderIDHiddenField" runat="server" Value='<%# Eval("OrderID") %>' />
                     <asp:GridView ID="OrderListGridView" runat="server" AutoGenerateColumns="False" DataKeyNames="OrderListID,Dress_Name" DataSourceID="OrderListSQL" CssClass="mGrid">
                        <Columns>
                           <asp:TemplateField HeaderText="লিস্ট নং" SortExpression="OrderList_SN">
                              <ItemTemplate>
                                 <asp:CheckBox ID="OrderListCheckBox" runat="server" Text='<%# Bind("OrderList_SN") %>' />
                              </ItemTemplate>
                           </asp:TemplateField>
                           <asp:BoundField DataField="Dress_Name" HeaderText="পোষাক" SortExpression="Dress_Name"></asp:BoundField>
                           <asp:BoundField DataField="DressQuantity" HeaderText="মোট" SortExpression="DressQuantity"></asp:BoundField>
                           <asp:TemplateField HeaderText="অসম্পূর্ণ" SortExpression="Pending_Work">
                              <ItemTemplate>
                                 <asp:HiddenField ID="PendingWork_HF" runat="server" Value='<%# Eval("Pending_Work") %>' />
                                 <asp:TextBox Width="50px" ID="PendingWorkTextBox" runat="server" Text='<%# Bind("Pending_Work") %>' onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" CssClass="textbox" />
                              </ItemTemplate>
                           </asp:TemplateField>
                        </Columns>
                     </asp:GridView>
                     <asp:SqlDataSource ID="OrderListSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT OrderList.OrderListID, OrderList.OrderList_SN, Dress.Dress_Name,OrderList.DressQuantity, OrderList.Pending_Work FROM OrderList INNER JOIN Dress ON OrderList.DressID = Dress.DressID WHERE (OrderList.OrderID = @OrderID) AND (OrderList.Pending_Work &lt;&gt; 0) ORDER BY OrderList.OrderList_SN">
                        <SelectParameters>
                           <asp:ControlParameter ControlID="OrderIDHiddenField" Name="OrderID" PropertyName="Value" Type="Int32" />
                        </SelectParameters>
                     </asp:SqlDataSource>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:BoundField DataField="OrderDate" HeaderText="অর্ডারের তারিখ" SortExpression="OrderDate" DataFormatString="{0:d MMM yyyy}" />
               <asp:BoundField DataField="DeliveryDate" HeaderText="ডেলিভারী তারিখ" SortExpression="DeliveryDate" DataFormatString="{0:d MMM yyyy}" />
               <asp:BoundField DataField="OrderAmount" HeaderText="মোট টাকা" SortExpression="OrderAmount" />
               <asp:TemplateField HeaderText="কোথায় রাখবেন">
                  <ItemTemplate>
                     <asp:TextBox ID="StoreDetailsTextBox" runat="server" CssClass="textbox"></asp:TextBox>
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:TemplateField HeaderText="SMS">
                  <ItemTemplate>
                     <asp:CheckBox ID="SMSCheckBox" runat="server" Text=" " />
                  </ItemTemplate>
               </asp:TemplateField>
               <asp:TemplateField>
                  <ItemTemplate>
                     <asp:HyperLink ID="PrintHyperLink" runat="server" NavigateUrl='<%# Eval("OrderID", "../Order/Print_Mesurement.aspx?OrderID={0}") %>' CssClass="Cmd_Print"></asp:HyperLink>
                  </ItemTemplate>
               </asp:TemplateField>
            </Columns>
            <EmptyDataTemplate>
               Empty
            </EmptyDataTemplate>
            <PagerStyle CssClass="pgr " />
         </asp:GridView>
         <asp:SqlDataSource ID="CustomerOrderdDressSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
            SelectCommand="SELECT [Order].OrderID, [Order].WorkStatus,[Order].CustomerID, [Order].RegistrationID, [Order].InstitutionID, [Order].Cloth_For_ID, [Order].OrderDate, [Order].DeliveryDate, [Order].OrderAmount, [Order].PaidAmount, [Order].Discount, [Order].DueAmount, [Order].OrderSerialNumber, [Order].PaymentStatus, [Order].DeliveryStatus, Customer.CustomerNumber, Customer.CustomerName, Customer.Phone, Customer.Address, SMS.Masking, SMS.SMS_Balance, Institution.InstitutionName FROM [Order] INNER JOIN Customer ON [Order].CustomerID = Customer.CustomerID INNER JOIN SMS ON Customer.InstitutionID = SMS.InstitutionID INNER JOIN Institution ON [Order].InstitutionID = Institution.InstitutionID WHERE ([Order].InstitutionID = @InstitutionID) AND ([Order].DeliveryStatus IN( N'Pending',N'PartlyDelivered')) AND ([Order].WorkStatus in( N'incomplete',N'PartlyCompleted')) AND (Customer.Phone Like '%' + @Phone + '%')  AND  (CAST([OrderSerialNumber] AS NVARCHAR(50)) IN(Select id from dbo.In_Function_Parameter(@OrderSerialNumber)) OR @OrderSerialNumber = '0')
 AND ([Order].DeliveryDate BETWEEN ISNULL(@Fdate,'1-1-1760') AND ISNULL(@TDate, '1-1-3760')) AND (ISNULL(Customer.CustomerName,'') Like '%' + @CustomerName + '%') AND (ISNULL(Customer.Address,'') Like '%' + @Address+ '%') order by (Case When [Order].DeliveryDate = cast(getdate() as date) Then 0 Else 1 End),ISNULL([Order].DeliveryDate,'1-1-3000')"
            UpdateCommand="UPDATE [Order] SET StoreDatails = @StoreDatails WHERE (OrderID = @OrderID)" OnSelected="CustomerOrderdDressSQL_Selected" CancelSelectOnNullParameter="False">
            <SelectParameters>
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
               <asp:ControlParameter ControlID="MobileNoTextBox" DefaultValue="%" Name="Phone" PropertyName="Text" />
               <asp:ControlParameter ControlID="OrderNoTextBox" DefaultValue="0" Name="OrderSerialNumber" PropertyName="Text" Type="String" />
               <asp:ControlParameter ControlID="EFormDateTextBox" DefaultValue="" Name="Fdate" PropertyName="Text" />
               <asp:ControlParameter ControlID="EToDateTextBox" DefaultValue="" Name="TDate" PropertyName="Text" />
               <asp:ControlParameter ControlID="SearchNameTextBox" DefaultValue="%" Name="CustomerName" PropertyName="Text" />
               <asp:ControlParameter ControlID="AddressTextBox" DefaultValue="%" Name="Address" PropertyName="Text" />
            </SelectParameters>
            <UpdateParameters>
               <asp:Parameter Name="StoreDatails" />
               <asp:Parameter Name="OrderID" />
            </UpdateParameters>
         </asp:SqlDataSource>

         <asp:SqlDataSource ID="Order_WorkComplete_DateSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="INSERT INTO Order_WorkComplete_Date(InstitutionID, RegistrationID, OrderID, OrderListID, WCQuantity) VALUES (@InstitutionID, @RegistrationID, @OrderID, @OrderListID, @WCQuantity)" SelectCommand="SELECT * FROM [Order_WorkComplete_Date]">
            <InsertParameters>
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
               <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
               <asp:Parameter Name="OrderID" Type="Int32" />
               <asp:Parameter Name="OrderListID" Type="Int32" />
               <asp:Parameter Name="WCQuantity" />
            </InsertParameters>
         </asp:SqlDataSource>

         <asp:CustomValidator ID="CV" runat="server" ClientValidationFunction="Validate" ErrorMessage="আপনি কোন অর্ডার সিলেক্ট করেন নি।" ForeColor="Red" ValidationGroup="A"></asp:CustomValidator>
         <br />
         <asp:Button ID="CompleteButton" runat="server" CssClass="ContinueButton" Text="কাজ সম্পূর্ণ করুন" OnClick="CompleteButton_Click" ValidationGroup="A" />
         <asp:SqlDataSource ID="SMS_OtherInfoSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="INSERT INTO [SMS_OtherInfo] ([SMS_Send_ID], [InstitutionID], [CustomerID]) VALUES (@SMS_Send_ID, @InstitutionID, @CustomerID)" SelectCommand="SELECT * FROM [SMS_OtherInfo]">
            <InsertParameters>
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
               <asp:Parameter Name="SMS_Send_ID" DbType="Guid" />
               <asp:Parameter Name="CustomerID" Type="Int32" />
            </InsertParameters>
         </asp:SqlDataSource>
         <asp:Label ID="ErrorLabel" runat="server" CssClass="EroorStar"></asp:Label>
      </ContentTemplate>
   </asp:UpdatePanel>

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
               <asp:UpdatePanel ID="UpdatePanel2" runat="server">
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
   <script src="../../JS/DatePicker/jquery.datepick.js"></script>
   <script type="text/javascript">
      /*--Select All Checkbox-----*/
      $("[id*=AllCheckBox]").live("click", function () {
         var a = $(this), b = $(this).closest("table"); $("input[type=checkbox]", b).each(function ()
         { a.is(":checked") ? ($(this).attr("checked", "checked"), $("td", $(this).closest("tr")).addClass("selected")) : ($(this).removeAttr("checked"), $("td", $(this).closest("tr")).removeClass("selected")) })
      });

      $("[id*=CompleteCheckBox]").live("click", function () {
         var a = $(this).closest("table"), b = $("[id*=chkHeader]", a);
         $(this).is(":checked") ? ($("td", $(this).closest("tr")).addClass("selected"), $("[id*=chkRow]", a).length == $("[id*=chkRow]:checked", a).length && b.attr("checked", "checked")) : ($("td", $(this).closest("tr")).removeClass("selected"), b.removeAttr("checked"))

         $(this).is(":checked") ? $(this).closest("tr").find("input").prop("checked", !0) : $(this).closest("tr").find("input").prop("checked", !1);
      });

      $("[id*=PendingWorkTextBox]").keyup(function () {
         var a, b;
         a = parseFloat($("[id*=PendingWork_HF]").val());
         b = parseFloat($("[id*=PendingWorkTextBox]").val());

         a < b ? ($("[id*=CompleteButton]").prop("disabled", !0).removeClass("ContinueButton"), alert("পোষাকের পরিমান বেশী দিয়েছেন")) :
         ($("[id*=CompleteButton]").prop("disabled", !1).addClass("ContinueButton"));
      });


      /*--select at least one Checkbox Students GridView-----*/
      function Validate(d, c) { for (var b = document.getElementById("<%=CustomerOrderdDressGridView.ClientID %>").getElementsByTagName("input"), a = 0; a < b.length; a++) if ("checkbox" == b[a].type && b[a].checked) { c.IsValid = !0; return } c.IsValid = !1 };


      $(function () {
         $(".Datetime").datepick();
         $('#main').tabs();

         if ($("input:radio:checked").val() == "Order No. And Mobile No.") {
            $('.Search_Date').hide();
         }
         else { $('.Search_Number').hide(); }
      });

      $('input[type="radio"]').change(function () {
         if (this.value == "Order No. And Mobile No.") {
            $('.Search_Number').stop(true, true).show(500);
            $('.Search_Date').stop(true, true).hide(500);
            $('.Datetime').val(null);
         }

         if (this.value == "Delivery Date") {
            $('.Search_Number').stop(true, true).hide(500);
            $('.Search_Date').stop(true, true).show(500);

            $("[id*=MobileNoTextBox]").val(null);
            $("[id*=SearchNameTextBox]").val(null);
            $("[id*=OrderNoTextBox]").val(null);
            $("[id*=AddressTextBox]").val(null);
         }
      });

      Sys.WebForms.PageRequestManager.getInstance().add_endRequest(function (a, b) {
         $(".Datetime").datepick();

         if ($("input:radio:checked").val() == "Order No. And Mobile No.") {
            $('.Search_Date').hide();
         }
         else { $('.Search_Number').hide(); }

         $('input[type="radio"]').change(function () {
            if (this.value == "Order No. And Mobile No.") {
               $('.Search_Number').stop(true, true).show(500);
               $('.Search_Date').stop(true, true).hide(500);
               $('.Datetime').val(null);
            }

            if (this.value == "Delivery Date") {
               $('.Search_Number').stop(true, true).hide(500);
               $('.Search_Date').stop(true, true).show(500);
               $("[id*=MobileNoTextBox]").val(null);
               $("[id*=SearchNameTextBox]").val(null);
               $("[id*=OrderNoTextBox]").val(null);
               $("[id*=AddressTextBox]").val(null);
            }
         });

         /**Empty Text**/
         $("[id*=OrderNoTextBox]").focus(function () { $("[id*=MobileNoTextBox]").val(""); $("[id*=SearchNameTextBox]").val(""); $("[id*=AddressTextBox]").val("") }); $("[id*=MobileNoTextBox]").focus(function () { $("[id*=OrderNoTextBox]").val(""); $("[id*=SearchNameTextBox]").val(""); $("[id*=AddressTextBox]").val("") }); $("[id*=SearchNameTextBox]").focus(function () { $("[id*=OrderNoTextBox]").val(""); $("[id*=MobileNoTextBox]").val("") }); $("[id*=AddressTextBox]").focus(function () { $("[id*=OrderNoTextBox]").val(""); $("[id*=MobileNoTextBox]").val("") });
         function setHeight() {
            var totHeight = $(window).height();
            $('.Pop_Contain').css({ 'max-height': totHeight - 200 + 'px' });
         }
         setHeight();
         $(window).on('resize', function () { setHeight(); });
      })

      /**Empty Text**/
      $("[id*=OrderNoTextBox]").focus(function () { $("[id*=MobileNoTextBox]").val(""); $("[id*=SearchNameTextBox]").val(""); $("[id*=AddressTextBox]").val("") }); $("[id*=MobileNoTextBox]").focus(function () { $("[id*=OrderNoTextBox]").val(""); $("[id*=SearchNameTextBox]").val(""); $("[id*=AddressTextBox]").val("") }); $("[id*=SearchNameTextBox]").focus(function () { $("[id*=OrderNoTextBox]").val(""); $("[id*=MobileNoTextBox]").val("") }); $("[id*=AddressTextBox]").focus(function () { $("[id*=OrderNoTextBox]").val(""); $("[id*=MobileNoTextBox]").val("") });
      /**Submit form on Enter key**/
      $(".textbox").keyup(function (a) { 13 == a.keyCode && $("[id*=FindButton]").click() });
      /**Submit Number Only**/
      function isNumberKey(a) { a = a.which ? a.which : event.keyCode; return 46 != a && 31 < a && (48 > a || 57 < a) ? !1 : !0 };
   </script>
</asp:Content>
