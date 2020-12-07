<%@ Page Title="" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="CustomerDetails.aspx.cs" Inherits="TailorBD.AccessAdmin.Customer.CustomerDetails" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <link href="../CSS/CustomerDetails.css" rel="stylesheet" />
   <link href="../../JS/jq_Profile/css/Profile_jquery-ui-1.8.23.custom.css" rel="stylesheet" />
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <asp:ScriptManager ID="ScriptManager1" runat="server"></asp:ScriptManager>
   <h3>কাস্টমারের বিস্তারিত বিবরণ</h3>
   <asp:FormView ID="CustomerInfoFormView" runat="server" DataSourceID="CustomerDetailsSQL" DataKeyNames="CustomerID" Width="100%">
      <ItemTemplate>
         <div class="Personal_Info">
            <div class="Profile_Image">
               <img alt="No Image" src="../../Handler/Customer.ashx?Img=<%# Eval("CustomerID") %>" class="P_Image" />
            </div>
            <div class="Info">
               <ul>
                  <li>
                     <strong>(<asp:Label ID="CustomerNumberLabel" runat="server" Text='<%# Bind("CustomerNumber") %>' />)
                        <asp:Label ID="NameLabel" runat="server" Text='<%# Bind("CustomerName") %>' />
                     </strong>
                  </li>
                  <li>মোবাইল:
                    <asp:Label ID="Label3" runat="server" Text='<%# Bind("Phone") %>' /></li>

                  <li>ঠিকানা:
                    <asp:Label ID="AddressLabel" runat="server" Text='<%# Bind("Address") %>' /></li>
               </ul>
            </div>

         </div>
      </ItemTemplate>
   </asp:FormView>

   <asp:SqlDataSource ID="CustomerDetailsSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
      SelectCommand="SELECT CustomerID, RegistrationID, InstitutionID, Cloth_For_ID, CustomerNumber, CustomerName, Phone, Address, Image, Date FROM Customer WHERE (CustomerID = @CustomerID) AND (InstitutionID = @InstitutionID)">
      <SelectParameters>
         <asp:QueryStringParameter Name="CustomerID" QueryStringField="CustomerID" Type="Int32" />
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
      </SelectParameters>
   </asp:SqlDataSource>



   <div class="BasicInfo">
      <a href="Add_Customer_Mesurement.aspx">নতুন কাস্টমার যুক্ত করুন</a> | 
          <a href="CustomerList.aspx">কাস্টমার লিস্ট পেইজে যান</a>
      <div id="main">
         <ul>
            <li class="Tab"><a href="#CustomerMeasurment">কাস্টমারের মাপ</a></li>

            <%if (DueGridView.Rows.Count > 0)
              { %>
            <li><a href="#Due">বাকি টাকা সংগ্রহ করুন</a></li>
            <%} %>
            <%if (TailorPRecordGridView.Rows.Count > 0)
              { %>
            <li><a href="#TailorPRecord">পেইড রেকর্ড</a></li>
            <%} %>
            <li class="Hide"><a href="#FabricDue">কাপড় বাবদ বাকি</a></li>

            <%if (CustomerOrderdDressGridView.Rows.Count > 0)
              { %>
            <li><a href="#CustomerOrderdDress">সদ্য অর্ডার কৃত পোষাক </a></li>
            <%} %>
            <%if (CustomerOrderdDressGridViewOld.Rows.Count > 0)
              { %>
            <li><a href="#CustomerOrderdDressOld">এ যাবত যত পোষাক বানিয়েছে</a> </li>
            <%} %>
         </ul>

         <div id="CustomerMeasurment">
            <asp:UpdatePanel ID="UpdatePanel2" runat="server">
               <ContentTemplate>
                  <div class="SelectDress">
                     <asp:DropDownList ID="DressDropDownList" runat="server" AutoPostBack="True" CssClass="DDL" DataSourceID="DressSQL" DataTextField="Dress_Name" DataValueField="DressID" AppendDataBoundItems="True" OnSelectedIndexChanged="DressDropDownList_SelectedIndexChanged" OnDataBound="DressDropDownList_DataBound">
                        <asp:ListItem Value="0">মাপ যুক্ত করার জন্য পোষাক নির্বাচন করুন</asp:ListItem>
                     </asp:DropDownList>
                     <asp:SqlDataSource ID="DressSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT DressID, Dress_Name, Cloth_For_ID, RegistrationID, InstitutionID, Description, Date, Image,DressSerial FROM Dress WHERE (Cloth_For_ID = @Cloth_For_ID) AND (InstitutionID = @InstitutionID) ORDER BY ISNULL(DressSerial, 99999)">
                        <SelectParameters>
                           <asp:QueryStringParameter Name="Cloth_For_ID" QueryStringField="Cloth_For_ID" />
                           <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                        </SelectParameters>
                     </asp:SqlDataSource>
                  </div>

                  <div class="Mesure_Style">
                     <%if (MeasurementGroupDataList.Items.Count > 0)
                       {%>
                     <div class="Mesure" id="MesasurmentType">
                        <asp:DataList ID="MeasurementGroupDataList" runat="server" DataSourceID="MoreSQL" RepeatDirection="Horizontal" ShowFooter="False">
                           <FooterTemplate>
                              <h3>মাপ যুক্ত করা হয়নি <a href="../Dress/Dress_Add.aspx">(মাপ যুক্ত করতে এখানে ক্লিক করুন)</a></h3>
                           </FooterTemplate>
                           <ItemTemplate>
                              <asp:HiddenField ID="Measurement_GroupIDHiddenField" runat="server" Value='<%# Eval("Measurement_GroupID") %>' />
                              <asp:DataList ID="MesasurmentTypeDataList" runat="server" DataKeyField="MeasurementTypeID" DataSourceID="MeasurementTypeSQL" RepeatLayout="Flow" ShowFooter="False">
                                 <ItemTemplate>
                                    <div class="DetailsHead">
                                       <asp:Label ID="MeasurementTypeLabel" runat="server" Text='<%# Bind("MeasurementType") %>'></asp:Label>
                                       <asp:TextBox ID="MeasurmentTextBox" runat="server" CssClass="textbox" Text='<%# Bind("Measurement") %>'></asp:TextBox>
                                    </div>
                                 </ItemTemplate>
                              </asp:DataList>
                              <asp:SqlDataSource ID="MeasurementTypeSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Measurement_Type.MeasurementTypeID, Measurement_Type.MeasurementType, Customer_M.Measurement, Measurement_Type.Measurement_Group_SerialNo FROM Measurement_Type LEFT OUTER JOIN (SELECT Measurement, MeasurementTypeID FROM Customer_Measurement WHERE (CustomerID = @CustomerID)) AS Customer_M ON Measurement_Type.MeasurementTypeID = Customer_M.MeasurementTypeID WHERE (Measurement_Type.Measurement_GroupID = @Measurement_GroupID) ORDER BY ISNULL(Measurement_Type.Measurement_Group_SerialNo, 99999)">
                                 <SelectParameters>
                                    <asp:QueryStringParameter Name="CustomerID" QueryStringField="CustomerID" />
                                    <asp:ControlParameter ControlID="Measurement_GroupIDHiddenField" Name="Measurement_GroupID" PropertyName="Value" />
                                 </SelectParameters>
                              </asp:SqlDataSource>
                              <br />
                           </ItemTemplate>
                        </asp:DataList>
                        <asp:SqlDataSource ID="MoreSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT DISTINCT Measurement_GroupID, ISNULL(Ascending, 99999) AS Ascending
FROM            Measurement_Type
WHERE        (InstitutionID = @InstitutionID) AND (DressID = @DressID)
ORDER BY Ascending">
                           <SelectParameters>
                              <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                              <asp:ControlParameter ControlID="DressDropDownList" Name="DressID" PropertyName="SelectedValue" />
                           </SelectParameters>
                        </asp:SqlDataSource>

                        <asp:SqlDataSource ID="CustomerMeasurmentSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand=" IF(@Measurement &lt;&gt; '')
BEGIN
IF NOT EXISTS ( SELECT  * FROM Customer_Measurement WHERE (InstitutionID = @InstitutionID) AND (CustomerID = @CustomerID) AND (MeasurementTypeID = @MeasurementTypeID))
 BEGIN
INSERT INTO [Customer_Measurement] ([RegistrationID], [InstitutionID], [CustomerID], [MeasurementTypeID], [Measurement]) VALUES (@RegistrationID, @InstitutionID, @CustomerID, @MeasurementTypeID, @Measurement)
END
ELSE
 BEGIN
UPDATE Customer_Measurement SET Measurement =@Measurement  WHERE (MeasurementTypeID = @MeasurementTypeID) AND (CustomerID = @CustomerID)
END
END
ELSE
BEGIN
DELETE FROM Customer_Measurement   WHERE (MeasurementTypeID = @MeasurementTypeID) AND (CustomerID = @CustomerID)
END"
                           SelectCommand="SELECT * FROM [Customer_Measurement]">
                           <InsertParameters>
                              <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                              <asp:QueryStringParameter Name="CustomerID" QueryStringField="CustomerID" Type="Int32" />
                              <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                              <asp:Parameter Name="MeasurementTypeID" Type="Int32" />
                              <asp:Parameter Name="Measurement" Type="String" />
                           </InsertParameters>
                        </asp:SqlDataSource>

                     </div>

                     <%if (StyleGridView.Rows.Count > 0)
                       {%>
                     <div class="Mesure">
                        <asp:GridView ID="StyleGridView" runat="server" AutoGenerateColumns="False" CssClass="DGrid" DataSourceID="Dress_Style_Name_SQL" Width="100%" BackColor="#FAFAFA">
                           <Columns>
                              <asp:TemplateField HeaderText="পছন্দের স্টাইলগুলো বেছে নিন">
                                 <ItemTemplate>
                                    <asp:Label ID="IdLabel" runat="server" Text='<%# Bind("Dress_Style_CategoryID") %>' Visible="False"></asp:Label>
                                    <b>
                                       <asp:Label ID="Label2" runat="server" Text='<%# Bind("Dress_Style_Category_Name") %>'></asp:Label><br />
                                    </b>

                                    <asp:DataList ID="StylDataList" runat="server" DataKeyField="Dress_StyleID" DataSourceID="StyleSQL" RepeatDirection="Horizontal" RepeatLayout="Flow"
                                       OnItemDataBound="StylDataList_ItemDataBound" Width="100%">
                                       <ItemTemplate>
                                          <asp:Panel CssClass="Style_Input" runat="server" ID="AddClass">
                                             <img alt="" src="../../Handler/Style_Name.ashx?Img='<%# Eval("Dress_StyleID") %>'" class="StyleImg" /><br />
                                             <asp:CheckBox ID="StyleCheckBox" runat="server" Checked='<%# Eval("IsCheck") %>' Text='<%# Eval("Dress_Style_Name") %>' /><br />
                                             <asp:TextBox ID="StyleMesureTextBox" runat="server" CssClass="StyleTextBox" Text='<%# Eval("DressStyleMesurement") %>' />
                                          </asp:Panel>
                                       </ItemTemplate>
                                    </asp:DataList>


                                    <asp:SqlDataSource ID="StyleSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Dress_Style.Dress_StyleID, Dress_Style.Dress_Style_Name, Customer_DS.DressStyleMesurement, CAST(CASE WHEN Customer_DS.Dress_StyleID IS NULL THEN 0 ELSE 1 END AS BIT) AS IsCheck FROM Dress_Style LEFT OUTER JOIN (SELECT DressStyleMesurement, Dress_StyleID FROM Customer_Dress_Style WHERE (CustomerID = @CustomerID)) AS Customer_DS ON Dress_Style.Dress_StyleID = Customer_DS.Dress_StyleID WHERE (Dress_Style.Dress_Style_CategoryID = @Dress_Style_CategoryID)  ORDER BY ISNULL(Dress_Style.StyleSerial, 99999)">
                                       <SelectParameters>
                                          <asp:QueryStringParameter Name="CustomerID" QueryStringField="CustomerID" />
                                          <asp:ControlParameter ControlID="IdLabel" Name="Dress_Style_CategoryID" PropertyName="Text" />
                                       </SelectParameters>
                                    </asp:SqlDataSource>
                                 </ItemTemplate>
                              </asp:TemplateField>
                           </Columns>
                           <HeaderStyle Font-Size="Large" />
                        </asp:GridView>
                     </div>
                     <%}%>

                     <div class="Mesure">
                        পোষাক সম্পর্কে বিস্তারিত বিবরণ<br />
                        <asp:TextBox ID="DetailsTextBox" runat="server" CssClass="textbox" Height="119px" TextMode="MultiLine" Width="216px"></asp:TextBox>
                     </div>

                     <asp:SqlDataSource ID="Customer_DressSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="if not exists(SELECT * FROM Customer_Dress WHERE (CustomerID = @CustomerID) AND (DressID = @DressID) AND (InstitutionID = @InstitutionID))
BEGIN
INSERT INTO [Customer_Dress] ([RegistrationID], [InstitutionID], [CustomerID], [DressID], [CDDetails]) VALUES (@RegistrationID, @InstitutionID, @CustomerID, @DressID, @CDDetails)
END
ELSE
BEGIN
UPDATE [Customer_Dress] SET [CDDetails] = @CDDetails WHERE (CustomerID = @CustomerID) AND (DressID = @DressID) AND (InstitutionID = @InstitutionID)
END"
                        SelectCommand="SELECT CDDetails FROM Customer_Dress WHERE (CustomerID = @CustomerID) AND (DressID = @DressID) AND (InstitutionID = @InstitutionID)">
                        <InsertParameters>
                           <asp:QueryStringParameter Name="CustomerID" QueryStringField="CustomerID" Type="Int32" />
                           <asp:ControlParameter ControlID="DressDropDownList" Name="DressID" PropertyName="SelectedValue" Type="Int32" />
                           <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                           <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                           <asp:ControlParameter ControlID="DetailsTextBox" Name="CDDetails" PropertyName="Text" Type="String" />
                        </InsertParameters>
                        <SelectParameters>
                           <asp:QueryStringParameter Name="CustomerID" QueryStringField="CustomerID" />
                           <asp:ControlParameter ControlID="DressDropDownList" Name="DressID" PropertyName="SelectedValue" />
                           <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                        </SelectParameters>
                     </asp:SqlDataSource>
                     <asp:SqlDataSource ID="Dress_Style_Name_SQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" DeleteCommand="DELETE FROM [Dress_Style] WHERE [Dress_StyleID] = @Dress_StyleID" SelectCommand="SELECT DISTINCT Dress_Style_Category.Dress_Style_Category_Name, ISNULL(Dress_Style_Category.CategorySerial, 99999) AS SN,Dress_Style.Dress_Style_CategoryID FROM Dress_Style INNER JOIN Dress_Style_Category ON Dress_Style.Dress_Style_CategoryID = Dress_Style_Category.Dress_Style_CategoryID WHERE (Dress_Style.DressID = @DressID) Order By SN">
                        <DeleteParameters>
                           <asp:Parameter Name="Dress_StyleID" Type="Int32" />
                        </DeleteParameters>
                        <SelectParameters>
                           <asp:ControlParameter ControlID="DressDropDownList" Name="DressID" PropertyName="SelectedValue" />
                        </SelectParameters>
                     </asp:SqlDataSource>
                     <asp:SqlDataSource ID="Customer_Dress_StyleSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                        InsertCommand="IF(@Checked='True')
BEGIN
 IF NOT EXISTS ( SELECT  * FROM [Customer_Dress_Style]  WHERE (InstitutionID = @InstitutionID) AND (CustomerID = @CustomerID) AND (Dress_StyleID = @Dress_StyleID))
BEGIN
INSERT INTO [Customer_Dress_Style] ([RegistrationID], [InstitutionID], [CustomerID], [Dress_StyleID], [DressStyleMesurement]) VALUES (@RegistrationID, @InstitutionID, @CustomerID, @Dress_StyleID, @DressStyleMesurement)
END
ELSE
BEGIN
UPDATE  Customer_Dress_Style SET  DressStyleMesurement = @DressStyleMesurement WHERE (Dress_StyleID = @Dress_StyleID) AND (CustomerID = @CustomerID) AND (InstitutionID = @InstitutionID)
END
END
ELSE
BEGIN
DELETE FROM Customer_Dress_Style WHERE (Dress_StyleID = @Dress_StyleID) AND (CustomerID = @CustomerID) AND (InstitutionID = @InstitutionID)
END"
                        SelectCommand="SELECT * FROM [Customer_Dress_Style]">
                        <InsertParameters>
                           <asp:Parameter Name="Checked" />
                           <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                           <asp:QueryStringParameter Name="CustomerID" QueryStringField="CustomerID" Type="Int32" />
                           <asp:Parameter Name="Dress_StyleID" Type="Int32" />
                           <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                           <asp:Parameter Name="DressStyleMesurement" Type="String" />
                        </InsertParameters>
                     </asp:SqlDataSource>


                     <asp:Button ID="SubmitButton" runat="server" Text="মাপ যুক্ত অথবা পরিবর্তন করুন" OnClick="SubmitButton_Click" CssClass="ContinueButton" />
                     <asp:Button ID="PrintButton" runat="server" Text="মাপ প্রিন্ট করুন" CssClass="ContinueButton" OnClick="PrintButton_Click" />
                     <%}%>
                  </div>

               </ContentTemplate>
            </asp:UpdatePanel>
         </div>

         <div id="Due">
            <asp:UpdatePanel ID="UpdatePanel3" runat="server">
               <ContentTemplate>

                  <asp:GridView ID="DueGridView" runat="server" AutoGenerateColumns="False" DataKeyNames="OrderID,DeliveryStatus" DataSourceID="DueAmountSQL" CssClass="mGrid" AllowPaging="True" PageSize="20" ShowFooter="True">
                     <Columns>
                        <asp:TemplateField HeaderText="অর্ডার নং " SortExpression="OrderSerialNumber">
                           <ItemTemplate>
                              <asp:Label ID="Label1" runat="server" Font-Bold="True" Text='<%# Bind("OrderSerialNumber") %>'></asp:Label>
                           </ItemTemplate>
                        </asp:TemplateField>
                        <asp:BoundField DataField="OrderDate" HeaderText="অর্ডার" SortExpression="OrderDate" DataFormatString="{0:d MMM yy}" />
                        <asp:BoundField DataField="DeliveryDate" HeaderText="ডেলিভারী" SortExpression="DeliveryDate" DataFormatString="{0:d MMM yy}" />
                        <asp:BoundField DataField="Details" HeaderText="পোষাকের বিবরণ" SortExpression="Details"></asp:BoundField>
                        <asp:TemplateField HeaderText="মোট টাকা" SortExpression="OrderAmount">
                           <FooterTemplate>
                              <asp:Label ID="OrderAmtGTotalLabel" runat="server"></asp:Label>
                           </FooterTemplate>
                           <ItemTemplate>
                              <asp:Label ID="OrderAmountLabel" runat="server" Text='<%# Bind("OrderAmount") %>'></asp:Label>
                           </ItemTemplate>
                        </asp:TemplateField>
                        <asp:TemplateField HeaderText="নগদ পেইড" SortExpression="PaidAmount">
                           <FooterTemplate>
                              <asp:Label ID="PaidGTotalLabel" runat="server"></asp:Label>
                           </FooterTemplate>
                           <ItemTemplate>
                              <asp:Label ID="PaidAmountLabel" runat="server" Text='<%# Bind("PaidAmount") %>'></asp:Label>
                           </ItemTemplate>
                        </asp:TemplateField>
                        <asp:TemplateField HeaderText="বাকি" SortExpression="DueAmount">
                           <FooterTemplate>
                              <asp:Label ID="DueGrandTotalLabel" runat="server"></asp:Label>
                           </FooterTemplate>
                           <ItemTemplate>
                              <asp:Label ID="TailorDueAmount" runat="server" Text='<%# Bind("DueAmount") %>'></asp:Label>
                              /-<br />
                              <asp:TextBox ID="DueTextBox" runat="server" CssClass="textbox" placeholder="Input Pay Amount" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false"></asp:TextBox>
                              <asp:RegularExpressionValidator ID="RegularExpressionValidator3" runat="server" ControlToValidate="DueTextBox" CssClass="EroorSummer" ErrorMessage="*" ValidationExpression="^\d+$" ValidationGroup="A"></asp:RegularExpressionValidator>
                           </ItemTemplate>
                        </asp:TemplateField>
                        <asp:TemplateField HeaderText="ডিসকাউন্ট" SortExpression="Discount">
                           <ItemTemplate>
                              <asp:Label ID="DiscountLabel1" runat="server" Text='<%# Bind("Discount") %>'></asp:Label>
                              /-<br />
                              <asp:TextBox ID="DiscountTextBox" runat="server" CssClass="textbox" placeholder="Input Discount" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false"></asp:TextBox>
                              <asp:RegularExpressionValidator ID="RegularExpressionValidator2" runat="server" ControlToValidate="DiscountTextBox" CssClass="EroorSummer" ErrorMessage="*" ValidationExpression="^\d+$" ValidationGroup="A"></asp:RegularExpressionValidator>
                           </ItemTemplate>
                        </asp:TemplateField>
                        <asp:BoundField DataField="DeliveryStatus" HeaderText="ডেলিভারির অবস্থা" SortExpression="DeliveryStatus" />
                     </Columns>
                     <FooterStyle CssClass="GridFooter" />
                     <PagerStyle CssClass="pgr" />
                  </asp:GridView>
                  <asp:SqlDataSource ID="DueAmountSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                     SelectCommand="SELECT [Order].OrderID, [Order].CustomerID, [Order].RegistrationID, [Order].InstitutionID, [Order].Cloth_For_ID, [Order].OrderDate, [Order].DeliveryDate, [Order].OrderAmount, [Order].PaidAmount, [Order].Discount, [Order].DueAmount, [Order].OrderSerialNumber, [Order].PaymentStatus, [Order].DeliveryStatus, Customer.CustomerNumber, Customer.CustomerName, Customer.Phone, Customer.Address, STUFF((SELECT '; ' + Dress.Dress_Name + ' ' + CAST(OrderList.DressQuantity AS NVARCHAR(50)) + ' Piece ' FROM OrderList INNER JOIN Dress ON OrderList.DressID = Dress.DressID WHERE (OrderList.OrderID = [Order].OrderID) FOR XML PATH('')), 1, 1, '') AS Details FROM [Order] INNER JOIN Customer ON [Order].CustomerID = Customer.CustomerID WHERE ([Order].InstitutionID = @InstitutionID) AND ([Order].CustomerID = @CustomerID) AND ([Order].PaymentStatus = 'Due')">
                     <SelectParameters>
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                        <asp:QueryStringParameter Name="CustomerID" QueryStringField="CustomerID" />
                     </SelectParameters>
                  </asp:SqlDataSource>

                  <asp:SqlDataSource ID="UpdateInsertSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                     InsertCommand="INSERT INTO Payment_Record(OrderID, CustomerID, RegistrationID, InstitutionID, Amount, Payment_TimeStatus, AccountID) 
VALUES (@OrderID, @CustomerID, @RegistrationID, @InstitutionID,  @Amount,@Payment_TimeStatus, @AccountID)"
                     SelectCommand="SELECT * FROM [Payment_Record]" UpdateCommand="UPDATE [Order] SET Discount = @Discount WHERE (OrderID = @OrderID)">
                     <InsertParameters>
                        <asp:Parameter Name="OrderID" Type="Int32" />
                        <asp:Parameter Name="Amount" Type="Double" />
                        <asp:QueryStringParameter Name="CustomerID" QueryStringField="CustomerID" Type="Int32" />
                        <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                        <asp:ControlParameter ControlID="AccountDropDownList" Name="AccountID" PropertyName="SelectedValue" />
                        <asp:Parameter Name="Payment_TimeStatus" />
                     </InsertParameters>
                     <UpdateParameters>
                        <asp:Parameter Name="Discount" />
                        <asp:Parameter Name="OrderID" Type="Int32" />
                     </UpdateParameters>
                  </asp:SqlDataSource>

                  <br />
                  <%if (DueGridView.Rows.Count > 0)
                    {%>
                  <table>
                     <tr>
                        <%System.Data.DataView DetailsDV = new System.Data.DataView();
                          DetailsDV = (System.Data.DataView)AccountSQL.Select(DataSourceSelectArguments.Empty);
                          if (DetailsDV.Count > 0)
                          {%>
                        <td>
                           <asp:DropDownList ID="AccountDropDownList" runat="server" CssClass="dropdown" DataSourceID="AccountSQL" DataTextField="AccountName" DataValueField="AccountID" OnDataBound="AccountDropDownList_DataBound">
                           </asp:DropDownList>

                           <asp:SqlDataSource ID="AccountSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT AccountID,AccountName  FROM Account WHERE (InstitutionID = @InstitutionID)">
                              <SelectParameters>
                                 <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                              </SelectParameters>
                           </asp:SqlDataSource>
                        </td>
                        <%} %>

                        <td>
                           <asp:Button ID="PaidButton" runat="server" CssClass="ContinueButton" OnClick="PaidButton_Click" Text="বাকি টাকা সংগ্রহ করুন" />
                        </td>
                     </tr>
                  </table>
                  <%} %>
               </ContentTemplate>
            </asp:UpdatePanel>
         </div>

         <div id="TailorPRecord">
            <asp:UpdatePanel ID="UpdatePanel6" runat="server">
               <ContentTemplate>
                  <asp:GridView ID="TailorPRecordGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataSourceID="TailorPRecordSQL">
                     <Columns>
                        <asp:BoundField DataField="OrderSerialNumber" HeaderText="Order No." SortExpression="OrderSerialNumber" />
                        <asp:BoundField DataField="Amount" HeaderText="Amount" SortExpression="Amount" />
                        <asp:BoundField DataField="Account" HeaderText="Account" SortExpression="Account" />
                        <asp:BoundField DataField="Payment_TimeStatus" HeaderText="P. Status" SortExpression="Payment_TimeStatus" />
                        <asp:BoundField DataField="OrderPaid_Date" DataFormatString="{0:d MMM yyyy}" HeaderText="Paid Date" SortExpression="OrderPaid_Date" />
                     </Columns>
                  </asp:GridView>
                  <asp:SqlDataSource ID="TailorPRecordSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT  [Order].OrderSerialNumber, Payment_Record.OrderID, Payment_Record.CustomerID, Payment_Record.Amount, ISNULL(Account.AccountName, 'Without Accont') AS Account,  Payment_Record.Payment_TimeStatus, Payment_Record.OrderPaid_Date FROM  Payment_Record INNER JOIN [Order] ON Payment_Record.OrderID = [Order].OrderID LEFT OUTER JOIN Account ON Payment_Record.AccountID = Account.AccountID WHERE (Payment_Record.InstitutionID = @InstitutionID) AND (Payment_Record.CustomerID = @CustomerID)">
                     <SelectParameters>
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                        <asp:QueryStringParameter Name="CustomerID" QueryStringField="CustomerID" />
                     </SelectParameters>
                  </asp:SqlDataSource>
               </ContentTemplate>
            </asp:UpdatePanel>
         </div>

         <div id="FabricDue">
            <asp:UpdatePanel ID="UpdatePanel5" runat="server">
               <ContentTemplate> 
                  <asp:GridView ID="FabricDueGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataSourceID="FabricsDueSQL" DataKeyNames="FabricsSellingID">
                     <Columns>
                        <asp:BoundField DataField="Selling_SN" HeaderText="SN" SortExpression="Selling_SN" />
                        <asp:BoundField DataField="SellingTotalPrice" HeaderText="Total Price" SortExpression="SellingTotalPrice" />
                        <asp:TemplateField HeaderText="Discount" SortExpression="SellingDiscountAmount">
                           <ItemTemplate>
                                <asp:Label ID="Fab_Discount_Label" runat="server" Text='<%# Bind("SellingDiscountAmount") %>'></asp:Label>
                              Tk.<br />
                             <asp:TextBox CssClass="textbox" ID="SellingDiscountTextBox" runat="server" Text='<%# Bind("SellingDiscountAmount") %>' onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false"></asp:TextBox>
                           </ItemTemplate>
                        </asp:TemplateField>
                        <asp:BoundField DataField="SellingPaidAmount" HeaderText="Paid" SortExpression="SellingPaidAmount" />
                        <asp:TemplateField HeaderText="Due" SortExpression="SellingDueAmount">
                           <ItemTemplate>
                              <asp:Label ID="FabricDueLabel" runat="server" Text='<%# Bind("SellingDueAmount") %>'></asp:Label>
                              Tk.<br />
                              <asp:TextBox ID="FabricsDueTextBox" runat="server" CssClass="textbox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false"></asp:TextBox>
                           </ItemTemplate>
                        </asp:TemplateField>
                        <asp:BoundField DataField="SellingDate" DataFormatString="{0:d MMM yyyy}" HeaderText="Selling Date" SortExpression="SellingDate" />
                     </Columns>
                  </asp:GridView>
                  <asp:SqlDataSource ID="FabricsDueSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Selling_SN, SellingTotalPrice, SellingPaidAmount, SellingDueAmount, SellingDate, SellingDiscountAmount, FabricsSellingID FROM Fabrics_Selling WHERE (InstitutionID = @InstitutionID) AND (CustomerID = @CustomerID) AND (SellingPaymentStatus = 'Due')" UpdateCommand="UPDATE Fabrics_Selling SET SellingDiscountAmount = @SellingDiscountAmount WHERE (FabricsSellingID = @FabricsSellingID)">
                     <SelectParameters>
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                        <asp:QueryStringParameter Name="CustomerID" QueryStringField="CustomerID" Type="Int32" />
                     </SelectParameters>
                     <UpdateParameters>
                        <asp:Parameter Name="SellingDiscountAmount" />
                        <asp:Parameter Name="FabricsSellingID" />
                     </UpdateParameters>
                  </asp:SqlDataSource>
                  <br />
                  <table class="Hide">
                     <tr>
                        <%System.Data.DataView FDetailsDV = new System.Data.DataView();
                          FDetailsDV = (System.Data.DataView)FabricsAccountSQL.Select(DataSourceSelectArguments.Empty);
                          if (FDetailsDV.Count > 0)
                          {%>
                        <td>
                           <asp:DropDownList ID="FabricsAccountDropDownList" runat="server" CssClass="dropdown" DataSourceID="FabricsAccountSQL" DataTextField="AccountName" DataValueField="AccountID" OnDataBound="FabricsAccountDropDownList_DataBound">
                           </asp:DropDownList>

                           <asp:SqlDataSource ID="FabricsAccountSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT AccountID,AccountName  FROM Account WHERE (InstitutionID = @InstitutionID)">
                              <SelectParameters>
                                 <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                              </SelectParameters>
                           </asp:SqlDataSource>
                        </td>
                        <%} %>
                        <td>
                           <asp:Button ID="FabricsPaidButton" runat="server" CssClass="ContinueButton" Text="Pay" OnClick="FabricsPaidButton_Click" />
                           <asp:SqlDataSource ID="SellingPRecordSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="INSERT INTO [Fabrics_Selling_PaymentRecord] ([FabricsSellingID], [RegistrationID], [InstitutionID], [AccountID], [SellingPaidAmount], [Payment_Situation], [SellingPaid_Date], [InsertDate]) VALUES (@FabricsSellingID, @RegistrationID, @InstitutionID, @AccountID, @SellingPaidAmount, @Payment_Situation, Getdate(), Getdate())" SelectCommand="SELECT * FROM [Fabrics_Selling_PaymentRecord]">
                              <InsertParameters>
                                 <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                                 <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                                 <asp:ControlParameter ControlID="FabricsAccountDropDownList" Name="AccountID" PropertyName="SelectedValue" Type="Int32" />
                                 <asp:Parameter DefaultValue="FabricsDuePaid" Name="Payment_Situation" Type="String" />
                                 <asp:Parameter DefaultValue="" Name="FabricsSellingID" Type="Int32" />
                                 <asp:Parameter Name="SellingPaidAmount" Type="Double" />
                              </InsertParameters>
                           </asp:SqlDataSource>
                        </td>
                     </tr>
                  </table>
              </ContentTemplate>
            </asp:UpdatePanel>
         </div>

         <div id="CustomerOrderdDress">
            <asp:UpdatePanel ID="UpdatePanel1" runat="server">
               <ContentTemplate>
                  <asp:GridView ID="CustomerOrderdDressGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="OrderID" DataSourceID="CustomerOrderdDressSQL" AllowSorting="True" AllowPaging="True">
                     <Columns>
                        <asp:TemplateField HeaderText="অর্ডার নং " SortExpression="OrderSerialNumber">
                           <ItemTemplate>
                              <asp:Label ID="Label1" runat="server" Font-Bold="True" Text='<%# Bind("OrderSerialNumber") %>'></asp:Label>
                           </ItemTemplate>
                        </asp:TemplateField>
                        <asp:BoundField DataField="OrderDate" HeaderText="অর্ডারের তারিখ" SortExpression="OrderDate" DataFormatString="{0:MMMM d, yyyy}" />
                        <asp:BoundField DataField="DeliveryDate" HeaderText="ডেলিভারী তারিখ" SortExpression="DeliveryDate" DataFormatString="{0:MMMM d, yyyy}" />
                        <asp:BoundField DataField="Details" HeaderText="পোষাকের বিবরণ" SortExpression="Details" />
                        <asp:BoundField DataField="OrderAmount" HeaderText="মোট টাকা" SortExpression="OrderAmount" />
                        <asp:BoundField DataField="Discount" HeaderText="ডিসকাউন্ট" SortExpression="Discount" />
                        <asp:BoundField DataField="PaidAmount" HeaderText="নগদ পেইড" SortExpression="PaidAmount" />
                        <asp:BoundField DataField="DueAmount" HeaderText="বাকি" ReadOnly="True" SortExpression="DueAmount" />
                        <asp:BoundField DataField="DeliveryStatus" HeaderText="ডেলিভারির অবস্থা" SortExpression="DeliveryStatus" />
                     </Columns>
                     <PagerStyle CssClass="pgr" />
                  </asp:GridView>
                  <asp:SqlDataSource ID="CustomerOrderdDressSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT [Order].OrderID, [Order].CustomerID, [Order].RegistrationID, [Order].InstitutionID, [Order].Cloth_For_ID, [Order].OrderDate, [Order].DeliveryDate, [Order].OrderAmount, [Order].PaidAmount, [Order].Discount, [Order].DueAmount, [Order].OrderSerialNumber, [Order].PaymentStatus, [Order].DeliveryStatus, Customer.CustomerNumber, Customer.CustomerName, Customer.Phone, Customer.Address, STUFF((SELECT '; ' + Dress.Dress_Name + ' ' + CAST(OrderList.DressQuantity AS NVARCHAR(50)) + ' Piece ' FROM OrderList INNER JOIN Dress ON OrderList.DressID = Dress.DressID WHERE (OrderList.OrderID = [Order].OrderID) FOR XML PATH('')), 1, 1, '') AS Details FROM [Order] INNER JOIN Customer ON [Order].CustomerID = Customer.CustomerID WHERE ([Order].InstitutionID = @InstitutionID) AND ([Order].CustomerID = @CustomerID) AND ([Order].DeliveryStatus = @DeliveryStatus)">
                     <SelectParameters>
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                        <asp:QueryStringParameter Name="CustomerID" QueryStringField="CustomerID" />
                        <asp:Parameter DefaultValue="Pending" Name="DeliveryStatus" />
                     </SelectParameters>
                  </asp:SqlDataSource>

               </ContentTemplate>
            </asp:UpdatePanel>
         </div>

         <div id="CustomerOrderdDressOld">
            <asp:UpdatePanel ID="UpdatePanel4" runat="server">
               <ContentTemplate>
                  <asp:GridView ID="CustomerOrderdDressGridViewOld" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="OrderID" DataSourceID="DelivaredSQL" AllowSorting="True" AllowPaging="True">
                     <Columns>
                        <asp:TemplateField HeaderText="অর্ডার নং " SortExpression="OrderSerialNumber">
                           <ItemTemplate>
                              <asp:Label ID="Label1" runat="server" Font-Bold="True" Text='<%# Bind("OrderSerialNumber") %>'></asp:Label>
                           </ItemTemplate>
                        </asp:TemplateField>
                        <asp:BoundField DataField="OrderDate" HeaderText="অর্ডারের তারিখ" SortExpression="OrderDate" DataFormatString="{0:MMMM d, yyyy}" />
                        <asp:BoundField DataField="DeliveryDate" HeaderText="ডেলিভারী তারিখ" SortExpression="DeliveryDate" DataFormatString="{0:MMMM d, yyyy}" />
                        <asp:BoundField DataField="Details" HeaderText="পোষাকের বিবরণ" SortExpression="Details" />
                        <asp:BoundField DataField="OrderAmount" HeaderText="মোট টাকা" SortExpression="OrderAmount" />
                        <asp:BoundField DataField="Discount" HeaderText="ডিসকাউন্ট" SortExpression="Discount" />
                        <asp:BoundField DataField="PaidAmount" HeaderText="নগদ পেইড" SortExpression="PaidAmount" />
                        <asp:BoundField DataField="DueAmount" HeaderText="বাকি" ReadOnly="True" SortExpression="DueAmount" />
                        <asp:BoundField DataField="DeliveryStatus" HeaderText="ডেলিভারির অবস্থা" SortExpression="DeliveryStatus" />
                     </Columns>
                     <PagerStyle CssClass="pgr" />
                  </asp:GridView>
                  <asp:SqlDataSource ID="DelivaredSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT [Order].OrderID, [Order].CustomerID, [Order].RegistrationID, [Order].InstitutionID, [Order].Cloth_For_ID, [Order].OrderDate, [Order].DeliveryDate, [Order].OrderAmount, [Order].PaidAmount, [Order].Discount, [Order].DueAmount, [Order].OrderSerialNumber, [Order].PaymentStatus, [Order].DeliveryStatus, Customer.CustomerNumber, Customer.CustomerName, Customer.Phone, Customer.Address, STUFF((SELECT '; ' + Dress.Dress_Name + ' ' + CAST(OrderList.DressQuantity AS NVARCHAR(50)) + ' Piece ' FROM OrderList INNER JOIN Dress ON OrderList.DressID = Dress.DressID WHERE (OrderList.OrderID = [Order].OrderID) FOR XML PATH('')), 1, 1, '') AS Details FROM [Order] INNER JOIN Customer ON [Order].CustomerID = Customer.CustomerID WHERE ([Order].InstitutionID = @InstitutionID) AND ([Order].CustomerID = @CustomerID) AND ([Order].DeliveryStatus = @DeliveryStatus)">
                     <SelectParameters>
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                        <asp:QueryStringParameter Name="CustomerID" QueryStringField="CustomerID" />
                        <asp:Parameter DefaultValue="Delivered" Name="DeliveryStatus" />
                     </SelectParameters>
                  </asp:SqlDataSource>

               </ContentTemplate>
            </asp:UpdatePanel>
         </div>
      </div>
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
      $(function () {
         $("#main").tabs();
         ($("[id*=DressDropDownList] option").size() == 1) ? ($('.DDL').hide(), $('.Tab').hide()) : ($('.DDL').show(), $('.Tab').show());

         //Total Amount Grand Total
         var OrdAmtTotal = 0;
         $("[id*=OrderAmountLabel]").each(function () { OrdAmtTotal = OrdAmtTotal + parseFloat($(this).text()) });
         $("[id*=OrderAmtGTotalLabel]").text(OrdAmtTotal + " /-");

         //Due Grand Total
         var DueTotal = 0;
         $("[id*=TailorDueAmount]").each(function () { DueTotal = DueTotal + parseFloat($(this).text()) });
         $("[id*=DueGrandTotalLabel]").text(DueTotal + " /-");

         //Paid Grand Total
         var PaidTotal = 0;
         $("[id*=PaidAmountLabel]").each(function () { PaidTotal = PaidTotal + parseFloat($(this).text()) });
         $("[id*=PaidGTotalLabel]").text(PaidTotal + " /-");
      });

      //FabricDue GridView is empty
      if (!$('[id*=FabricDueGridView] tr').length) {
         $(".Hide").hide();
      }


      //for Update Pannel
      Sys.WebForms.PageRequestManager.getInstance().add_endRequest(function (a, b) {
         $('input[type="checkbox"]').change(function () { 1 === $(this).closest(".Style_Input").removeClass("Color").find('input[type="checkbox"]:checked').length && $(this).closest(".Style_Input").addClass("Color"); 0 === $(this).closest(".Color").addClass("Style_Input").find('input[type="checkbox"]:checked').length && $(this).closest(".Style_Input").removeClass("Color") })

         //Total Amount Grand Total
         var OrdAmtTotal = 0;
         $("[id*=OrderAmountLabel]").each(function () { OrdAmtTotal = OrdAmtTotal + parseFloat($(this).text()) });
         $("[id*=OrderAmtGTotalLabel]").text(OrdAmtTotal + " /-");

         //Due Grand Total
         var DueTotal = 0;
         $("[id*=TailorDueAmount]").each(function () { DueTotal = DueTotal + parseFloat($(this).text()) });
         $("[id*=DueGrandTotalLabel]").text(DueTotal + " /-");

         //Paid Grand Total
         var PaidTotal = 0;
         $("[id*=PaidAmountLabel]").each(function () { PaidTotal = PaidTotal + parseFloat($(this).text()) });
         $("[id*=PaidGTotalLabel]").text(PaidTotal + " /-");

         //FabricDue GridView is empty
         if (!$('[id*=FabricDueGridView] tr').length) {
            $(".Hide").hide();
         }
      })


      function isNumberKey(a) { a = a.which ? a.which : event.keyCode; return 46 != a && 31 < a && (48 > a || 57 < a) ? !1 : !0 };
   </script>
</asp:Content>
