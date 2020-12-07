<%@ Page Title="" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Add_More_Dress_In_Order.aspx.cs" Inherits="TailorBD.AccessAdmin.Order.Add_More_Dress_In_Order" %>

<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="asp" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <link href="CSS/DressAndMeasurements.css" rel="stylesheet" />
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <asp:ToolkitScriptManager ID="ToolkitScriptManager1" runat="server" />

   <asp:FormView ID="OrderNumberDataList" runat="server" DataSourceID="OrderNumberSQL">
      <ItemTemplate>
         <h3>(অর্ডার নং:
            <asp:Label ID="OrderSirialNumberLabel" runat="server" Text='<%# Eval("OrderSerialNumber") %>' />) এই অর্ডারে আরো পোষাক যুক্ত করুন
         </h3>
      </ItemTemplate>
   </asp:FormView>

   <asp:SqlDataSource ID="OrderNumberSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT OrderSerialNumber, InstitutionID FROM [Order] WHERE (OrderID = @OrderID) AND (InstitutionID = @InstitutionID)">
      <SelectParameters>
         <asp:QueryStringParameter Name="OrderID" QueryStringField="OrderID" />
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
      </SelectParameters>
   </asp:SqlDataSource>

   <asp:FormView ID="CustomerFormView" runat="server" DataKeyNames="CustomerID" DataSourceID="CustomerSQL" Width="100%">
      <ItemTemplate>
         <div class="Personal_Info">
            <div class="Profile_Image">
               <img alt="No Image" src="../../Handler/Customer.ashx?Img=<%# Eval("CustomerID") %>" class="P_Image" />
            </div>

            <div class="Info">
               <ul>
                  <li>(<asp:Label ID="CNLabel" runat="server" Text='<%# Eval("CustomerNumber") %>' Font-Bold="True" />)
                     <asp:Label ID="CustomerNameLabel" runat="server" Text='<%# Eval("CustomerName") %>' Font-Bold="True" />
                  </li>
                  <li>মোবাইল:
                            <asp:Label ID="PhoneLabel" runat="server" Text='<%# Eval("Phone") %>' />

                  </li>
                  <li>ঠিকানা:
                            <asp:Label ID="AddressLabel" runat="server" Text='<%# Eval("Address") %>' />
                  </li>
               </ul>
            </div>
         </div>
      </ItemTemplate>
   </asp:FormView>

   <asp:SqlDataSource ID="CustomerSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
      SelectCommand="SELECT Customer.RegistrationID, Customer.InstitutionID, Customer.Cloth_For_ID, Customer.CustomerNumber, Customer.CustomerName, Customer.Phone, Customer.Address, Customer.Image, Customer.Date, Customer.CustomerID FROM Customer INNER JOIN [Order] ON Customer.CustomerID = [Order].CustomerID WHERE (Customer.InstitutionID = @InstitutionID) AND ([Order].OrderID = @OrderID)">
      <SelectParameters>
         <asp:CookieParameter CookieName="InstitutionID" DefaultValue="" Name="InstitutionID" />
         <asp:QueryStringParameter Name="OrderID" QueryStringField="OrderID" />
      </SelectParameters>
   </asp:SqlDataSource>

   <asp:UpdatePanel ID="UpdatePanel1" runat="server">
      <ContentTemplate>

         <div class="SelectDress">
            <b>অর্ডার কৃত পোষাক </b>
            <asp:GridView ID="OrderListGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="OrderListID,DressID,CustomerID" DataSourceID="ChartOrderListSQL" OnRowDeleted="OrderListGridView_RowDeleted">
               <Columns>
                  <asp:TemplateField ConvertEmptyStringToNull="False" SortExpression="Image">
                     <ItemTemplate>
                        <img alt="" src="../../Handler/DressHandler.ashx?Img=<%#Eval("DressID") %>" style="height: 50px; width: 50px;" />
                     </ItemTemplate>
                     <ItemStyle Width="70px" />
                  </asp:TemplateField>
                  <asp:BoundField DataField="Dress_Name" HeaderText="পোষাকের নাম" SortExpression="Dress_Name" />
                  <asp:BoundField DataField="DressQuantity" HeaderText="কয়টি পোষাক" SortExpression="DressQuantity" />
                  <asp:BoundField DataField="OrderListAmount" HeaderText="টাকার পরিমান" SortExpression="OrderListAmount" />
                  <asp:TemplateField HeaderText="ডিলিট করুন">
                     <ItemTemplate>
                        <asp:LinkButton ID="DeleteLinkButton" runat="server" CausesValidation="False" CommandName="Delete" CssClass="Delete"
                           OnClientClick="return confirm('আপনি কি এই অর্ডার টি একেবারে মুছে ফেলতে চান ?')"></asp:LinkButton>
                     </ItemTemplate>
                  </asp:TemplateField>
               </Columns>
               <EmptyDataTemplate>
                  No Data
               </EmptyDataTemplate>
            </asp:GridView>
            <asp:SqlDataSource ID="ChartOrderListSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT OrderList.OrderListID, OrderList.CustomerID, OrderList.RegistrationID, OrderList.Cloth_For_ID, OrderList.OrderID, OrderList.DressID, OrderList.DressQuantity, OrderList.OrderListAmount, OrderList.Details, Dress.Dress_Name, Dress.Image, OrderList.InstitutionID FROM OrderList INNER JOIN Dress ON OrderList.DressID = Dress.DressID WHERE (OrderList.OrderID = @OrderID) AND (OrderList.InstitutionID = @InstitutionID)" DeleteCommand="IF EXISTS(SELECT * FROM [Order] INNER JOIN OrderList ON [Order].OrderID = OrderList.OrderID WHERE (OrderList.OrderListID = @OrderListID) And ([Order].OrderAmount -(OrderList.OrderListAmount + [Order].Discount + [Order].PaidAmount) &gt;= 0))
BEGIN
DELETE FROM Ordered_Measurement  WHERE  OrderListID = @OrderListID
DELETE FROM  Ordered_Measurement WHERE  OrderListID = @OrderListID
DELETE FROM  Ordered_Dress_Style WHERE  OrderListID = @OrderListID
DELETE FROM  Order_Payment WHERE  OrderListID =@OrderListID
DELETE FROM  OrderList WHERE  OrderListID = @OrderListID
END
IF NOT EXISTS(SELECT * FROM OrderList WHERE OrderID = @OrderID)
BEGIN
DELETE FROM [Order] WHERE OrderID = @OrderID
END">
               <DeleteParameters>
                  <asp:QueryStringParameter Name="OrderID" QueryStringField="OrderID" />
                  <asp:Parameter Name="OrderListID" />
               </DeleteParameters>
               <SelectParameters>
                  <asp:QueryStringParameter Name="OrderID" QueryStringField="OrderID" Type="Int32" />
                  <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
               </SelectParameters>
            </asp:SqlDataSource>

            <asp:LinkButton ID="SkipButton" OnClick="SkipButton_Click" runat="server">পরবর্তী ধাপে যান >> </asp:LinkButton><br />
            <br />
            <asp:DropDownList ID="DressDropDownList" runat="server" AutoPostBack="True" CssClass="DDL" DataSourceID="DressSQL" DataTextField="Dress_Name" DataValueField="DressID" AppendDataBoundItems="True" OnSelectedIndexChanged="DressDropDownList_SelectedIndexChanged">
               <asp:ListItem Value="0">মাপ যুক্ত করার জন্য পোষাক নির্বাচন করুন</asp:ListItem>
            </asp:DropDownList>
            <asp:SqlDataSource ID="DressSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT DressID, Dress_Name, Cloth_For_ID, RegistrationID, InstitutionID, Description, Date, Image,DressSerial FROM Dress WHERE (Cloth_For_ID = (SELECT Cloth_For_ID FROM  [Order] WHERE (OrderID = @OrderID))) AND (InstitutionID = @InstitutionID) ORDER BY ISNULL(DressSerial, 99999)">
               <SelectParameters>
                  <asp:QueryStringParameter Name="OrderID" QueryStringField="OrderID" />
                  <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
               </SelectParameters>
            </asp:SqlDataSource>
         </div>

         <div class="Mesure_Style">
            <%if (MeasurementGroupDataList.Items.Count > 0)
              { %>
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
                           <asp:SessionParameter Name="CustomerID" SessionField="CustomerID" />
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

               <asp:SqlDataSource ID="OrderListSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                  InsertCommand="INSERT INTO [OrderList] ([CustomerID], [RegistrationID], [InstitutionID], [Cloth_For_ID], [OrderID], [DressID], [DressQuantity], [Details], [OrderList_SN]) VALUES
                                          (@CustomerID, @RegistrationID, @InstitutionID,(SELECT  Cloth_For_ID FROM [Order] WHERE (OrderID = @OrderID)), @OrderID, @DressID, @DressQuantity, @Details, (SELECT [dbo].[OrderList_SerialNumber](@OrderID)))

Select @OrderListID=scope_identity()"
                  SelectCommand="SELECT * FROM [OrderList]" OnInserted="OrderListSQL_Inserted">
                  <InsertParameters>
                     <asp:SessionParameter Name="CustomerID" SessionField="CustomerID" Type="Int32" />
                     <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                     <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                     <asp:ControlParameter ControlID="DressDropDownList" Name="DressID" PropertyName="SelectedValue" Type="Int32" />
                     <asp:ControlParameter ControlID="DressQuantitykTextBox" Name="DressQuantity" PropertyName="Text" Type="Int32" />
                     <asp:ControlParameter ControlID="DetailsTextBox" Name="Details" PropertyName="Text" Type="String" />
                     <asp:QueryStringParameter Name="OrderID" QueryStringField="OrderID" />
                     <asp:Parameter Name="OrderListID" Direction="Output" Type="Int32" />
                  </InsertParameters>
               </asp:SqlDataSource>
               <asp:SqlDataSource ID="Ordered_MeasurementSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="INSERT INTO [Ordered_Measurement] ([CustomerID], [OrderListID], [RegistrationID], [InstitutionID], [MeasurementTypeID], [Measurement]) VALUES                                                                (@CustomerID, @OrderListID, @RegistrationID, @InstitutionID, @MeasurementTypeID, @Measurement)" SelectCommand="SELECT * FROM [Ordered_Measurement]">
                  <InsertParameters>
                     <asp:SessionParameter Name="CustomerID" SessionField="CustomerID" Type="Int32" />
                     <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                     <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                     <asp:Parameter Name="OrderListID" Type="Int32" />
                     <asp:Parameter Name="MeasurementTypeID" Type="Int32" />
                     <asp:Parameter Name="Measurement" Type="String" />
                  </InsertParameters>
               </asp:SqlDataSource>
               <asp:SqlDataSource ID="Order_PaymentSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="INSERT INTO Order_Payment(CustomerID, OrderListID, OrderID, Amount, Details, RegistrationID, InstitutionID, Unit, UnitPrice) VALUES (@CustomerID, @OrderListID, @OrderID, @Amount, @Details, @RegistrationID, @InstitutionID, @Unit, @UnitPrice)" SelectCommand="SELECT * FROM [Order_Payment]">
                  <InsertParameters>
                     <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                     <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                     <asp:QueryStringParameter Name="OrderID" QueryStringField="OrderID" Type="Int32" />
                     <asp:SessionParameter Name="CustomerID" SessionField="CustomerID" Type="Int32" />
                     <asp:Parameter Name="OrderListID" Type="Int32" />
                     <asp:Parameter Name="Amount" Type="Double" />
                     <asp:Parameter Name="Details" Type="String" />
                     <asp:Parameter Name="Unit" />
                     <asp:Parameter Name="UnitPrice" />
                  </InsertParameters>
               </asp:SqlDataSource>

            </div>

            <%if (StyleGridView.Rows.Count > 0)
              {%>
            <div class="Mesure">
               <asp:CheckBox ID="AddStyleCheckBox" runat="server" Text="স্টাইল যুক্ত করুন" AutoPostBack="True" OnCheckedChanged="AddStyleCheckBox_CheckedChanged" Visible="false" />

               <asp:GridView ID="StyleGridView" runat="server" AutoGenerateColumns="False" DataSourceID="Dress_Style_Name_SQL" Visible="False" CssClass="DGrid" Width="100%" BackColor="#fafafa">
                  <Columns>
                     <asp:TemplateField HeaderText="পছন্দের স্টাইল গুলো বেছে নিন">
                        <ItemTemplate>
                           <asp:Label ID="IdLabel" runat="server" Text='<%# Bind("Dress_Style_CategoryID") %>' Visible="False"></asp:Label>
                           <b>
                              <asp:Label ID="Label1" runat="server" Text='<%# Bind("Dress_Style_Category_Name") %>'></asp:Label>
                           </b>


                           <asp:DataList ID="StylDataList" runat="server" DataKeyField="Dress_StyleID" DataSourceID="StyleSQL" RepeatLayout="Flow"
                              RepeatDirection="Horizontal" OnItemDataBound="StylDataList_ItemDataBound" Width="100%">
                              <ItemTemplate>
                                 <asp:Panel CssClass="Style_Input" runat="server" ID="AddClass">
                                    <img alt="" src="../../Handler/Style_Name.ashx?Img='<%# Eval("Dress_StyleID") %>'" class="StyleImg" /><br />
                                    <asp:CheckBox ID="StyleCheckBox" Checked='<%# Eval("IsCheck") %>' runat="server" Text='<%# Eval("Dress_Style_Name") %>' /><br />
                                    <asp:TextBox ID="StyleMesureTextBox" runat="server" Text='<%# Eval("DressStyleMesurement") %>' CssClass="StyleTextBox"></asp:TextBox>
                                 </asp:Panel>
                              </ItemTemplate>
                           </asp:DataList>


                           <asp:SqlDataSource ID="StyleSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Dress_Style.Dress_StyleID, Dress_Style.Dress_Style_Name, Customer_DS.DressStyleMesurement, CAST(CASE WHEN Customer_DS.Dress_StyleID IS NULL THEN 0 ELSE 1 END AS BIT) AS IsCheck FROM Dress_Style LEFT OUTER JOIN (SELECT DressStyleMesurement, Dress_StyleID FROM Customer_Dress_Style WHERE (CustomerID = @CustomerID)) AS Customer_DS ON Dress_Style.Dress_StyleID = Customer_DS.Dress_StyleID WHERE (Dress_Style.Dress_Style_CategoryID = @Dress_Style_CategoryID) ORDER BY ISNULL(Dress_Style.StyleSerial, 99999)">
                              <SelectParameters>
                                 <asp:SessionParameter Name="CustomerID" SessionField="CustomerID" />
                                 <asp:ControlParameter ControlID="IdLabel" Name="Dress_Style_CategoryID" PropertyName="Text" />
                              </SelectParameters>
                           </asp:SqlDataSource>
                        </ItemTemplate>
                     </asp:TemplateField>
                  </Columns>
                  <HeaderStyle Font-Size="Large" />
               </asp:GridView>
               <asp:SqlDataSource ID="Dress_Style_Name_SQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" DeleteCommand="DELETE FROM [Dress_Style] WHERE [Dress_StyleID] = @Dress_StyleID" SelectCommand="SELECT DISTINCT Dress_Style_Category.Dress_Style_Category_Name, Dress_Style.Dress_Style_CategoryID, ISNULL(Dress_Style_Category.CategorySerial, 99999) AS SN FROM Dress_Style INNER JOIN Dress_Style_Category ON Dress_Style.Dress_Style_CategoryID = Dress_Style_Category.Dress_Style_CategoryID WHERE (Dress_Style.DressID = @DressID) ORDER BY SN">
                  <DeleteParameters>
                     <asp:Parameter Name="Dress_StyleID" Type="Int32" />
                  </DeleteParameters>
                  <SelectParameters>
                     <asp:ControlParameter ControlID="DressDropDownList" Name="DressID" PropertyName="SelectedValue" />
                  </SelectParameters>
               </asp:SqlDataSource>


               <asp:SqlDataSource ID="Ordered_Dress_StyleSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="INSERT INTO Ordered_Dress_Style(CustomerID, OrderID, Dress_StyleID, OrderListID, RegistrationID, InstitutionID, DressStyleMesurement) VALUES (@CustomerID, @OrderID, @Dress_StyleID, @OrderListID, @RegistrationID, @InstitutionID, @DressStyleMesurement)" SelectCommand="SELECT * FROM [Ordered_Dress_Style]">
                  <InsertParameters>
                     <asp:Parameter Name="Dress_StyleID" Type="Int32" />
                     <asp:Parameter Name="DressStyleMesurement" />
                     <asp:Parameter Name="OrderListID" Type="Int32" />
                     <asp:QueryStringParameter Name="OrderID" QueryStringField="OrderID" />
                     <asp:SessionParameter Name="CustomerID" SessionField="CustomerID" Type="Int32" />
                     <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                     <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                  </InsertParameters>
               </asp:SqlDataSource>
               <asp:SqlDataSource ID="Customer_DressSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="if not exists(SELECT * FROM Customer_Dress WHERE (CustomerID = @CustomerID) AND (DressID = @DressID) AND (InstitutionID = @InstitutionID))
BEGIN
INSERT INTO [Customer_Dress] ([RegistrationID], [InstitutionID], [CustomerID], [DressID], [CDDetails]) VALUES (@RegistrationID, @InstitutionID, @CustomerID, @DressID, @CDDetails)
END
ELSE
BEGIN
UPDATE [Customer_Dress] SET [CDDetails] = @CDDetails WHERE (CustomerID = @CustomerID) AND (DressID = @DressID) AND (InstitutionID = @InstitutionID)
END"
                  SelectCommand="SELECT CDDetails FROM Customer_Dress WHERE (DressID = @DressID) AND (InstitutionID = @InstitutionID) AND (CustomerID = @CustomerID)">
                  <InsertParameters>
                     <asp:SessionParameter Name="CustomerID" SessionField="CustomerID" Type="Int32" />
                     <asp:ControlParameter ControlID="DressDropDownList" Name="DressID" PropertyName="SelectedValue" Type="Int32" />
                     <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                     <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                     <asp:ControlParameter ControlID="DetailsTextBox" Name="CDDetails" PropertyName="Text" Type="String" />
                  </InsertParameters>
                  <SelectParameters>
                     <asp:ControlParameter ControlID="DressDropDownList" Name="DressID" PropertyName="SelectedValue" />
                     <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                     <asp:SessionParameter Name="CustomerID" SessionField="CustomerID" />
                  </SelectParameters>
               </asp:SqlDataSource>
               <asp:SqlDataSource ID="Customer_Dress_StyleSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="
IF(@Checked='True')
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
                     <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                     <asp:SessionParameter Name="CustomerID" SessionField="CustomerID" Type="Int32" />
                     <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                     <asp:Parameter Name="Checked" />
                     <asp:Parameter Name="DressStyleMesurement" Type="String" />
                     <asp:Parameter Name="Dress_StyleID" Type="Int32" />
                  </InsertParameters>
               </asp:SqlDataSource>
            </div>
            <%} %>
            <div class="Mesure">
               <table>
                  <tr>
                     <td>পোশাক সম্পর্কে বিস্তারিত বিবরণ</td>
                  </tr>
                  <tr>
                     <td>
                        <asp:TextBox ID="DetailsTextBox" runat="server" CssClass="textbox" Height="119px" TextMode="MultiLine" Width="216px"></asp:TextBox>
                     </td>
                  </tr>
                  <tr>
                     <td>মোট পোশাক
                                <asp:RequiredFieldValidator ID="QntRV" runat="server" ControlToValidate="DressQuantitykTextBox" CssClass="EroorSummer" ErrorMessage="পোশাকের পরিমান দিন" ValidationGroup="OR" />
                     </td>
                  </tr>
                  <tr>
                     <td>
                        <asp:TextBox ID="DressQuantitykTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" CssClass="textbox"></asp:TextBox>
                        <asp:LinkButton ID="ChargeLB" CssClass="Add" runat="server" OnClick="ChargeLB_Click" ValidationGroup="OR">পরবর্তী ধাপ</asp:LinkButton>
                     </td>
                  </tr>

                  <tr>
                     <td>
                        <label id="Msg"></label>
                        <asp:RegularExpressionValidator ID="RegularExpressionValidator3" runat="server" ControlToValidate="DressQuantitykTextBox" CssClass="EroorSummer" ErrorMessage="শুধু নাম্বার লিখা যাবে" ValidationExpression="^\d+$" ValidationGroup="OR" />
                     </td>
                  </tr>

               </table>
            </div>
            <%} %>
         </div>

      </ContentTemplate>
   </asp:UpdatePanel>

   <div id="AddPopup" runat="server" style="display: none" class="modalPopup">
      <asp:UpdatePanel ID="UpdatePanel4" runat="server">
         <ContentTemplate>
            <div id="Header" class="Htitle">
               <b>"<asp:Label ID="DNLabel" runat="server" />" চার্জ যুক্ত করুন</b>
               <asp:Button ID="CanOrdButton" runat="server" OnClick="CancelLB_Click" CssClass="Cancel_Pop" />
            </div>


            <div class="Pop_Contain">
               <table>
                  <tr>
                     <td>পোশাক:</td>
                     <td>
                        <asp:RadioButtonList ID="QuantityRadioButtonList" runat="server" RepeatDirection="Horizontal" CssClass="RadioB">
                        </asp:RadioButtonList>
                     </td>
                  </tr>
               </table>

               <table id="InPrice">
                  <tr>
                     <td>কি বাবদ
                        <asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="PaymentforTextBox" CssClass="EroorSummer" ErrorMessage="লিখেন নি" ValidationGroup="CH"></asp:RequiredFieldValidator>
                     </td>
                     <td>কত টাকা
                        <asp:RequiredFieldValidator ID="RequiredFieldValidator3" runat="server" ControlToValidate="AmountTextBox" CssClass="EroorSummer" ErrorMessage="লিখেন নি" ValidationGroup="CH"></asp:RequiredFieldValidator>
                     </td>
                     <td>
                        <asp:RegularExpressionValidator ID="RegularExpressionValidator4" runat="server" ControlToValidate="AmountTextBox" CssClass="EroorSummer" ErrorMessage="ইংরেজী নাম্বার লিখুন" ValidationExpression="^[-+]?\d*\.?\d*$" ValidationGroup="CH"></asp:RegularExpressionValidator>
                     </td>
                  </tr>
                  <tr>
                     <td>
                        <asp:TextBox ID="PaymentforTextBox" runat="server" CssClass="textbox"></asp:TextBox>
                     </td>
                     <td>
                        <asp:TextBox ID="AmountTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" CssClass="textbox"></asp:TextBox>
                     </td>
                     <td>
                        <asp:Button ID="AdchartButton" runat="server" CssClass="ContinueButton" OnClick="AdchartButton_Click" Text="Add" ValidationGroup="CH" />
                        <asp:Button ID="AddDressPriceButton" runat="server" CssClass="ContinueButton" OnClick="AddDressPriceButton_Click" Text="Save &amp; Add" ValidationGroup="CH" />
                        <asp:SqlDataSource ID="InputFixedPSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" DeleteCommand="DELETE FROM [Dress_Price] WHERE [Dress_PriceID] = @Dress_PriceID" InsertCommand="IF NOT EXISTS(SELECT * FROM [Dress_Price] WHERE InstitutionID = @InstitutionID AND DressID = @DressID AND Price_For = @Price_For)
INSERT INTO [Dress_Price] ([RegistrationID], [InstitutionID], [DressID], [Price_For], [Price]) VALUES (@RegistrationID, @InstitutionID, @DressID, @Price_For, @Price)"
                           SelectCommand="SELECT * FROM Dress_Price">
                           <InsertParameters>
                              <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                              <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                              <asp:ControlParameter ControlID="PaymentforTextBox" Name="Price_For" PropertyName="Text" Type="String" />
                              <asp:ControlParameter ControlID="AmountTextBox" Name="Price" PropertyName="Text" Type="Double" />
                              <asp:ControlParameter ControlID="DressDropDownList" Name="DressID" PropertyName="SelectedValue" Type="Int32" />
                           </InsertParameters>
                        </asp:SqlDataSource>
                     </td>
                  </tr>

                  <tr>
                     <td colspan="2">
                        <asp:DropDownList ID="DressPriceDDList" runat="server" AutoPostBack="True" CssClass="dropdown" DataSourceID="DressPriceSQL" DataTextField="Price_For" DataValueField="Price" OnDataBound="DressPriceDDList_DataBound" OnSelectedIndexChanged="DressPriceDDList_SelectedIndexChanged">
                        </asp:DropDownList>
                        <asp:SqlDataSource ID="DressPriceSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM [Dress_Price] WHERE (([InstitutionID] = @InstitutionID) AND ([DressID] = @DressID))">
                           <SelectParameters>
                              <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                              <asp:ControlParameter ControlID="DressDropDownList" Name="DressID" PropertyName="SelectedValue" Type="Int32" />
                           </SelectParameters>
                        </asp:SqlDataSource>
                     </td>
                     <td>&nbsp;</td>
                  </tr>
               </table>
               <asp:GridView ID="ChargeGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid">
                  <Columns>
                     <asp:TemplateField HeaderText="কি বাবত">
                        <ItemTemplate>
                           <asp:Label ID="CFLabel" runat="server" Text='<%# Bind("PriceFor") %>'></asp:Label>
                        </ItemTemplate>
                        <ItemStyle VerticalAlign="Top" Width="150px" />
                     </asp:TemplateField>
                     <asp:TemplateField HeaderText="মোট পোশাক">
                        <ItemTemplate>
                           <asp:Label ID="QuantityLabel" runat="server" Text='<%# Bind("Quantity") %>'></asp:Label>
                        </ItemTemplate>
                     </asp:TemplateField>
                     <asp:TemplateField HeaderText="প্রতি পিস">
                        <ItemTemplate>
                           <asp:Label ID="UnitPriceLabel" runat="server" Text='<%# Bind("UnitPrice") %>'></asp:Label>
                        </ItemTemplate>
                     </asp:TemplateField>
                     <asp:TemplateField HeaderText="মোট">
                        <ItemTemplate>
                           <asp:Label ID="TotalAmountLabel" runat="server" Text='<%# Bind("TotalAmount") %>'></asp:Label>
                        </ItemTemplate>
                     </asp:TemplateField>
                     <asp:TemplateField>
                        <ItemTemplate>
                           <asp:LinkButton ID="DeleteImageButton" runat="server" ToolTip="ডিলিট করুন" CausesValidation="False" CommandName="Delete" OnClientClick="return confirm('আপনি কি ডিলেট করতে চান ?')" CssClass="Delete" OnClick="RowDelete"></asp:LinkButton>
                        </ItemTemplate>
                        <ItemStyle Width="40px" />
                     </asp:TemplateField>
                  </Columns>
               </asp:GridView>

               <%if (ChargeGridView.Rows.Count > 0)
                 { %>
               <br />
               <asp:Button ID="InsertNowButton" runat="server" Text="অর্ডার এড করুন" OnClick="InsertNowButton_Click" CssClass="ContinueButton" ValidationGroup="OR" />
               <%} %>

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
                     <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                     <asp:SessionParameter Name="CustomerID" SessionField="CustomerID" Type="Int32" />
                     <asp:Parameter Name="MeasurementTypeID" Type="Int32" />
                     <asp:Parameter Name="Measurement" Type="String" />
                  </InsertParameters>
               </asp:SqlDataSource>
            </div>
         </ContentTemplate>
      </asp:UpdatePanel>

      <asp:HiddenField ID="IHiddenField" runat="server" Value="0" />
      <asp:ModalPopupExtender ID="Mpe" runat="server"
         TargetControlID="IHiddenField"
         PopupControlID="AddPopup"
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



   <script>
      Sys.WebForms.PageRequestManager.getInstance().add_endRequest(function (a, b) {
         $('input[type="checkbox"]').change(function () {
            if ($(this).closest('.Style_Input').removeClass('Color').find('input[type="checkbox"]:checked').length === 1)
               $(this).closest('.Style_Input').addClass('Color');

            if ($(this).closest('.Color').addClass('Style_Input').find('input[type="checkbox"]:checked').length === 0)
               $(this).closest('.Style_Input').removeClass('Color');
         });

         //If Fixted Price Is Empty
         ($('[id*=DressPriceDDList] option').length > 1) ? $('[id*=DressPriceDDList]').show() : $('[id*=DressPriceDDList]').hide();
      });


      //Disable the submit button after clicking
      $("form").submit(function () {
         $(".ContinueButton").attr("disabled", true);
         setTimeout(function () {
            $(".ContinueButton").prop('disabled', false);
         }, 2000); // 2 seconds
         return true;
      })

      /***Disable Browser Back Button****/
      function noBack() {
         window.history.forward();
      }
      noBack();
      window.onload = noBack;
      window.onpageshow = function (evt) {
         if (evt.persisted) noBack();
      }
      window.onunload = function () { void (0); }

      function isNumberKey(a) { a = a.which ? a.which : event.keyCode; return 46 != a && 31 < a && (48 > a || 57 < a) ? !1 : !0 };
   </script>
</asp:Content>
