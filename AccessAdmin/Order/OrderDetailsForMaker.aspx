<%@ Page Title="" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="OrderDetailsForMaker.aspx.cs" Inherits="TailorBD.AccessAdmin.Order.OrderDetailsForMaker" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
    <link href="CSS/DressAndMeasurements.css" rel="stylesheet" />
    <style type="text/css">
        .mGrid .Footer td { border: none; }
        .ODImg { height: 60px; width: 70px; }

        @media (max-width:499px) /* Mobile */ {
            .ODImg { height: 40px; width: 45px; }

            .DGrid th { font-size: 12px; font-weight: normal; padding-bottom: 0; }

            .DGrid td { font-size: 13px; padding: 3px 0; }
        }
    </style>
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <asp:ScriptManager ID="ScriptManager1" runat="server"></asp:ScriptManager>
     <asp:FormView ID="OrderNumberDataList" runat="server" DataSourceID="OrderNumberSQL">
        <ItemTemplate>
            <h3>অর্ডারকৃত পোষাকের মাপ পরিবর্তন করুন (অর্ডার নং:
            <asp:Label ID="OrderSirialNumberLabel" runat="server" Text='<%# Eval("OrderSerialNumber") %>' />)
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
                        <li>
                           (<asp:Label ID="CustomerNumberLabel" runat="server" Text='<%# Eval("CustomerNumber") %>' Font-Bold="True" />) <asp:Label ID="CustomerNameLabel" runat="server" Text='<%# Eval("CustomerName") %>' Font-Bold="True" />
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

            <a href="OrdrList.aspx">পূর্বের পেইজে যান</a>
            <asp:GridView ID="OrderListGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="OrderListID,DressID,CustomerID" DataSourceID="OrderListSQL" OnSelectedIndexChanged="OrderListGridView_SelectedIndexChanged" BackColor="#FAFAFA">
                <Columns>
                    <asp:TemplateField ShowHeader="False" HeaderText="সিলেক্ট করুন">
                        <ItemTemplate>
                            <asp:LinkButton ID="SelectLinkButton" runat="server" CausesValidation="False" CommandName="Select" CssClass="Select"></asp:LinkButton>
                        </ItemTemplate>
                    </asp:TemplateField>
                    <asp:TemplateField ConvertEmptyStringToNull="False" SortExpression="Image">
                        <ItemTemplate>
                            <img alt="" src="../../Handler/DressHandler.ashx?Img=<%#Eval("DressID") %>" class="ODImg" />
                        </ItemTemplate>
                    </asp:TemplateField>
                    <asp:BoundField DataField="Dress_Name" HeaderText="পোষাকের নাম" SortExpression="Dress_Name" />
                    <asp:BoundField DataField="DressQuantity" HeaderText="কয়টি পোষাক" SortExpression="DressQuantity" />
                    <asp:BoundField DataField="OrderListAmount" HeaderText="টাকার পরিমান" SortExpression="OrderListAmount" />
                    <asp:TemplateField ShowHeader="False">
                        <ItemTemplate>
                            <asp:LinkButton ID="DeleteLinkButton" runat="server" CausesValidation="False" OnClientClick="return confirm('Are You Sure Want To Delete?')" CommandName="Delete" CssClass="Delete"></asp:LinkButton>
                        </ItemTemplate>
                    </asp:TemplateField>
                </Columns>
                <EmptyDataTemplate>
                    No Data
                </EmptyDataTemplate>
                <SelectedRowStyle CssClass="Row_Selected" />
            </asp:GridView>
            <br />

            <asp:SqlDataSource ID="OrderListSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT OrderList.OrderListID, OrderList.CustomerID, OrderList.RegistrationID, OrderList.Cloth_For_ID, OrderList.OrderID, OrderList.DressID, OrderList.DressQuantity, OrderList.OrderListAmount, OrderList.Details, Dress.Dress_Name, Dress.Image, OrderList.InstitutionID FROM OrderList INNER JOIN Dress ON OrderList.DressID = Dress.DressID WHERE (OrderList.OrderID = @OrderID) AND (OrderList.InstitutionID = @InstitutionID)" DeleteCommand="if exists(SELECT  * FROM [Order] INNER JOIN OrderList ON [Order].OrderID = OrderList.OrderID  WHERE   (OrderList.OrderListID = @OrderListID) And ([Order].OrderAmount -(ISNULL(OrderList.OrderListAmount,0) + [Order].Discount + [Order].PaidAmount) &gt;= 0))
BEGIN
DELETE FROM Ordered_Measurement  WHERE  OrderListID =@OrderListID
DELETE FROM  Ordered_Measurement WHERE  OrderListID =@OrderListID
DELETE FROM  Ordered_Dress_Style WHERE  OrderListID =@OrderListID
DELETE FROM  Order_Payment WHERE  OrderListID =@OrderListID
DELETE FROM  OrderList WHERE  OrderListID =@OrderListID
END
if not exists(SELECT * FROM OrderList  WHERE OrderID =@OrderID)
BEGIN
DELETE FROM [Order] WHERE OrderID =@OrderID
END">
                <DeleteParameters>
                    <asp:Parameter Name="OrderListID" />
                    <asp:QueryStringParameter Name="OrderID" QueryStringField="OrderID" />
                </DeleteParameters>
                <SelectParameters>
                    <asp:QueryStringParameter Name="OrderID" QueryStringField="OrderID" Type="Int32" />
                    <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                </SelectParameters>
            </asp:SqlDataSource>

            <div class="Mesure_Style">

                <%if (MeasurementGroupDataList.Items.Count > 0)
                  { %>
                <div class="Mesure" id="MesasurmentType">

                    <h3>এই পোষাকের মাপ পরিবর্তন করুন</h3>
                    <asp:DataList ID="MeasurementGroupDataList" runat="server" DataSourceID="MoreSQL" RepeatDirection="Horizontal" ShowFooter="False">
                        <FooterTemplate>
                            <h3>মাপ যুক্ত করা হয়নি <a href="../Dress/Dress_Add.aspx">(মাপ যুক্ত করতে এখানে ক্লিক করুন)</a></h3>
                        </FooterTemplate>
                        <ItemTemplate>
                            <asp:HiddenField ID="Measurement_GroupIDHiddenField" runat="server" Value='<%# Eval("Measurement_GroupID") %>' />
                            <asp:DataList ID="MesasurmentTypeDataList" runat="server" DataKeyField="MeasurementTypeID" DataSourceID="MeasurementTypeSQL" RepeatLayout="Flow" ShowFooter="False">
                                <ItemTemplate>
                                    <div class="DetailsHead">
                                        <asp:HiddenField ID="MTIDHiddenField" runat="server" Value='<%#Eval("MeasurementTypeID") %>' />
                                        <asp:Label ID="MeasurementTypeLabel" runat="server" Text='<%# Bind("MeasurementType") %>'></asp:Label>
                                        <asp:TextBox ID="MeasurmentTextBox" runat="server" CssClass="textbox" Text='<%# Bind("Measurement") %>'></asp:TextBox>
                                    </div>
                                </ItemTemplate>
                            </asp:DataList>
                            <asp:SqlDataSource ID="MeasurementTypeSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT        Measurement_Type.MeasurementTypeID, Measurement_Type.MeasurementType, OrderList_M.Measurement, Measurement_Type.Measurement_Group_SerialNo
FROM            Measurement_Type LEFT OUTER JOIN
                             (SELECT        Measurement, MeasurementTypeID
                               FROM            Ordered_Measurement
                               WHERE        (OrderListID = @OrderListID)) AS OrderList_M ON Measurement_Type.MeasurementTypeID = OrderList_M.MeasurementTypeID
WHERE        (Measurement_Type.Measurement_GroupID = @Measurement_GroupID)
ORDER BY ISNULL(Measurement_Type.Measurement_Group_SerialNo, 99999)">
                                <SelectParameters>
                                    <asp:ControlParameter ControlID="OrderListGridView" Name="OrderListID" PropertyName="SelectedDataKey[0]" />
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
                            <asp:ControlParameter ControlID="OrderListGridView" Name="DressID" PropertyName="SelectedDataKey[1]" />
                        </SelectParameters>
                    </asp:SqlDataSource>

                </div>

                <div class="Mesure">
                    <asp:GridView ID="StyleGridView" runat="server" AutoGenerateColumns="False" DataSourceID="Dress_Style_Name_SQL" CssClass="DGrid" BackColor="#FAFAFA">
                        <Columns>
                            <asp:TemplateField HeaderText="পছন্দের স্টাইলগুলো বেছেনিন।">
                                <ItemTemplate>
                                    <asp:Label ID="IdLabel" runat="server" Text='<%# Bind("Dress_Style_CategoryID") %>' Visible="False"></asp:Label>
                                    <b>
                                        <asp:Label ID="Label1" runat="server" Text='<%# Bind("Dress_Style_Category_Name") %>'></asp:Label>
                                    </b>

                                    <div class="Style_Reapet">
                                        <asp:DataList ID="StylDataList" runat="server" DataKeyField="Dress_StyleID" DataSourceID="StyleSQL" RepeatDirection="Horizontal" RepeatLayout="Flow" OnItemDataBound="StylDataList_ItemDataBound">
                                            <ItemTemplate>
                                                <asp:HiddenField ID="DSIDHiddenField" runat="server" Value='<%#Eval("Dress_StyleID") %>' />
                                                <asp:Panel CssClass="Style_Input" runat="server" ID="AddClass">
                                                    <img alt="" src="../../Handler/Style_Name.ashx?Img='<%# Eval("Dress_StyleID") %>'" class="StyleImg" /><br />
                                                    <asp:CheckBox ID="StyleCheckBox" Checked='<%# Eval("IsCheck") %>' runat="server" Text='<%# Eval("Dress_Style_Name") %>' /><br />
                                                    <asp:TextBox ID="StyleMesureTextBox" runat="server" Text='<%# Eval("DressStyleMesurement") %>' CssClass="StyleTextBox"></asp:TextBox>
                                                </asp:Panel>
                                            </ItemTemplate>
                                        </asp:DataList>
                                    </div>

                                    <asp:SqlDataSource ID="StyleSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT        Dress_Style.Dress_StyleID, Dress_Style.Dress_Style_Name, OrderList_DS.DressStyleMesurement, CAST(CASE WHEN OrderList_DS.Dress_StyleID IS NULL THEN 0 ELSE 1 END AS BIT) AS IsCheck
FROM            Dress_Style LEFT OUTER JOIN
                             (SELECT        DressStyleMesurement, Dress_StyleID
                               FROM            Ordered_Dress_Style
                               WHERE        (OrderListID = @OrderListID)) AS OrderList_DS ON Dress_Style.Dress_StyleID = OrderList_DS.Dress_StyleID
WHERE        (Dress_Style.Dress_Style_CategoryID = @Dress_Style_CategoryID)
ORDER BY ISNULL(Dress_Style.StyleSerial, 99999)">
                                        <SelectParameters>
                                            <asp:ControlParameter ControlID="IdLabel" Name="Dress_Style_CategoryID" PropertyName="Text" />
                                            <asp:ControlParameter ControlID="OrderListGridView" Name="OrderListID" PropertyName="SelectedDataKey[0]" />
                                        </SelectParameters>
                                    </asp:SqlDataSource>
                                </ItemTemplate>
                            </asp:TemplateField>
                        </Columns>
                        <HeaderStyle Font-Size="Large" />
                    </asp:GridView>
                    <asp:SqlDataSource ID="Dress_Style_Name_SQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                        DeleteCommand="DELETE FROM [Dress_Style] WHERE [Dress_StyleID] = @Dress_StyleID"
                        SelectCommand="SELECT DISTINCT Dress_Style_Category.Dress_Style_Category_Name, ISNULL(Dress_Style_Category.CategorySerial, 99999) AS SN,Dress_Style.Dress_Style_CategoryID FROM Dress_Style INNER JOIN Dress_Style_Category ON Dress_Style.Dress_Style_CategoryID = Dress_Style_Category.Dress_Style_CategoryID WHERE (Dress_Style.DressID = @DressID) Order By SN
">
                        <DeleteParameters>
                            <asp:Parameter Name="Dress_StyleID" Type="Int32" />
                        </DeleteParameters>
                        <SelectParameters>
                            <asp:ControlParameter ControlID="OrderListGridView" Name="DressID" PropertyName="SelectedDataKey[1]" DefaultValue="0" />
                        </SelectParameters>

                    </asp:SqlDataSource>

                </div>

                <div class="Mesure">
                    <table>
                        <tr>
                            <td>পোষাক সম্পর্কে বিস্তারিত বিবরণ</td>
                            <td>মোট পোষাক
                                <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="DressQuantityTextBox" CssClass="EroorSummer" ErrorMessage="লিখতে হবে" ValidationGroup="OR"></asp:RequiredFieldValidator>
                            </td>

                        </tr>
                        <tr>
                            <td>
                                <asp:TextBox ID="DetailsTextBox" runat="server" CssClass="textbox" Height="119px" TextMode="MultiLine" Width="216px"></asp:TextBox>
                            </td>
                            <td style="vertical-align: top">
                                <asp:TextBox ID="DressQuantityTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" CssClass="textbox" Width="50px"></asp:TextBox>
                                &nbsp;<asp:RegularExpressionValidator ID="RegularExpressionValidator2" runat="server" ControlToValidate="DressQuantityTextBox" CssClass="EroorSummer" ErrorMessage="শুধু নাম্বার লিখা যাবে" ValidationExpression="^\d+$" ValidationGroup="OR"></asp:RegularExpressionValidator>
                            </td>
                        </tr>
                    </table>

                </div>

                <asp:Button ID="UpdateButton" runat="server" CssClass="ContinueButton" OnClick="UpdateButton_Click" Text="মাপ পরিবর্তন করুন" ValidationGroup="OR" /><br />
                <br />

                <div class="Mesure">
                    <%if (PriceGridView.Rows.Count > 0)
                      {%>
                    <h3>এই পোষাকের খরচ</h3>
                    <%} %>
                    <asp:GridView ID="PriceGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="OrderPaymentID" DataSourceID="PriceSQL" ShowFooter="True" OnRowDeleted="PriceGridView_RowDeleted" BackColor="#FAFAFA">
                        <Columns>
                            <asp:TemplateField>
                                <EditItemTemplate>
                                    <asp:LinkButton ID="UpdateLinkButton" runat="server" CausesValidation="True" CommandName="Update" CssClass="Updete"></asp:LinkButton>
                                    &nbsp;<asp:LinkButton ID="CancelLinkButton" runat="server" CausesValidation="False" CommandName="Cancel" CssClass="Cancel"></asp:LinkButton>
                                </EditItemTemplate>
                                <FooterTemplate>
                                    <asp:FormView ID="InsertPaymntFormView" runat="server" DataKeyNames="OrderPaymentID" DataSourceID="PriceSQL">
                                        <InsertItemTemplate>
                                            <table>
                                                <tr>
                                                    <td>কি বাবদ:</td>
                                                    <td>
                                                        <asp:TextBox ID="DetailsTextBox" runat="server" Width="130px" CssClass="textbox" Text='<%#Bind("Details") %>' TextMode="MultiLine" />
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>কত টাকা:</td>
                                                    <td>
                                                        <asp:TextBox ID="AmountTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" CssClass="textbox" Width="130px" Text='<%#Bind("Amount") %>' />
                                                    </td>
                                                </tr>

                                                <tr>
                                                    <td colspan="2">

                                                        <asp:LinkButton ID="InsertButton" runat="server" CausesValidation="True" CommandName="Insert" Text="যুক্ত করুন" ValidationGroup="I" />
                                                        /
                                                        <asp:LinkButton ID="InsertCancelButton" runat="server" CausesValidation="False" CommandName="Cancel" Text="Cancel" />
                                                        <br />
                                                        <asp:RegularExpressionValidator ID="RegularExpressionValidator2" runat="server" ControlToValidate="AmountTextBox" CssClass="EroorSummer" ErrorMessage="শুধু নাম্বার লিখা যাবে" ValidationExpression="^\d+$" ValidationGroup="I"></asp:RegularExpressionValidator>
                                                        <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="AmountTextBox" CssClass="EroorSummer" ErrorMessage="Required" ValidationGroup="I"></asp:RequiredFieldValidator>

                                                    </td>
                                                </tr>
                                            </table>
                                        </InsertItemTemplate>
                                        <ItemTemplate>
                                            <asp:LinkButton ID="InsertButton" runat="server" CausesValidation="False" CommandName="New" Text="নতুন খরচ যুক্ত করুন" />
                                        </ItemTemplate>
                                    </asp:FormView>
                                </FooterTemplate>
                                <ItemTemplate>
                                    <asp:LinkButton ID="EditLinkButton" runat="server" CausesValidation="False" CommandName="Edit" CssClass="Edit"></asp:LinkButton>
                                </ItemTemplate>
                                <ItemStyle Width="200px" />
                            </asp:TemplateField>
                            <asp:TemplateField HeaderText="কি বাবদ" SortExpression="Details">
                               <EditItemTemplate>
                                  <asp:TextBox ID="TextBox2" CssClass="textbox" runat="server" Text='<%# Bind("Details") %>'></asp:TextBox>
                               </EditItemTemplate>
                               <ItemTemplate>
                                  <asp:Label ID="Label2" runat="server" Text='<%# Bind("Details") %>'></asp:Label>
                               </ItemTemplate>
                            </asp:TemplateField>
                            <asp:TemplateField HeaderText="কত টাকা" SortExpression="Amount">
                               <EditItemTemplate>
                                  <asp:TextBox ID="TextBox1" CssClass="textbox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" Text='<%# Bind("Amount") %>'></asp:TextBox>
                               </EditItemTemplate>
                               <ItemTemplate>
                                  <asp:Label ID="Label1" runat="server" Text='<%# Bind("Amount") %>'></asp:Label>
                               </ItemTemplate>
                            </asp:TemplateField>
                            <asp:TemplateField>
                                <ItemTemplate>
                                    <asp:LinkButton ID="DeleteLinkButton" runat="server" CausesValidation="False" CommandName="Delete" CssClass="Delete"></asp:LinkButton>
                                </ItemTemplate>
                                <ItemStyle Width="40px" />
                            </asp:TemplateField>
                        </Columns>
                        <FooterStyle CssClass="Footer" />
                    </asp:GridView>
                    <asp:SqlDataSource ID="PriceSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT OrderPaymentID, InstitutionID, RegistrationID, CustomerID, OrderListID, OrderID, Amount, Details, Date FROM Order_Payment WHERE (InstitutionID = @InstitutionID) AND (OrderListID = @OrderListID)" DeleteCommand="DELETE FROM Order_Payment WHERE (OrderPaymentID = @OrderPaymentID)" InsertCommand="INSERT INTO Order_Payment(InstitutionID, RegistrationID, CustomerID, OrderListID, OrderID, Amount, Details, Date) VALUES (@InstitutionID, @RegistrationID, @CustomerID, @OrderListID, @OrderID, @Amount, @Details, GETDATE())" UpdateCommand="UPDATE Order_Payment SET Amount = @Amount, Details = @Details WHERE (OrderPaymentID = @OrderPaymentID)">
                        <DeleteParameters>
                            <asp:Parameter Name="OrderPaymentID" />
                        </DeleteParameters>
                        <InsertParameters>
                            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                            <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" />
                            <asp:ControlParameter ControlID="OrderListGridView" Name="CustomerID" PropertyName="SelectedDataKey[2]" />
                            <asp:ControlParameter ControlID="OrderListGridView" Name="OrderListID" PropertyName="SelectedDataKey[0]" />
                            <asp:QueryStringParameter Name="OrderID" QueryStringField="OrderID" />
                            <asp:Parameter Name="Amount" />
                            <asp:Parameter Name="Details" />
                        </InsertParameters>
                        <SelectParameters>
                            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                            <asp:ControlParameter ControlID="OrderListGridView" Name="OrderListID" PropertyName="SelectedDataKey[0]" />
                        </SelectParameters>
                        <UpdateParameters>
                            <asp:Parameter Name="Amount" />
                            <asp:Parameter Name="Details" />
                            <asp:Parameter Name="OrderPaymentID" />
                        </UpdateParameters>
                    </asp:SqlDataSource>


                    <br />
                    <br />
                    <asp:Button ID="NextButton" runat="server" CssClass="ContinueButton" OnClick="NextButton_Click" Text=" মানি রিসিট" />
                </div>
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
END
   "
                    SelectCommand="SELECT * FROM [Customer_Measurement]">
                    <InsertParameters>
                        <asp:Parameter Name="Measurement" Type="String" />
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                        <asp:ControlParameter ControlID="OrderListGridView" Name="CustomerID" PropertyName="SelectedDataKey[2]" Type="Int32" />
                        <asp:Parameter Name="MeasurementTypeID" Type="Int32" />
                        <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                    </InsertParameters>
                </asp:SqlDataSource>

                <asp:SqlDataSource ID="Ordered_MeasurementSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM [Ordered_Measurement]" UpdateCommand="
IF(@Measurement &lt;&gt; '')
BEGIN
IF NOT EXISTS(SELECT * FROM [Ordered_Measurement] WHERE (MeasurementTypeID = @MeasurementTypeID) AND (OrderListID = @OrderListID))
BEGIN
INSERT INTO [Ordered_Measurement] ([CustomerID], [OrderListID], [RegistrationID], [InstitutionID], [MeasurementTypeID], [Measurement]) VALUES (@CustomerID, @OrderListID, @RegistrationID, @InstitutionID, @MeasurementTypeID, @Measurement)
END
ELSE
BEGIN
UPDATE Ordered_Measurement SET  Measurement = @Measurement WHERE  (OrderListID = @OrderListID) AND (MeasurementTypeID = @MeasurementTypeID)
END

END
ELSE
BEGIN
DELETE FROM Ordered_Measurement  WHERE  (OrderListID = @OrderListID) AND (MeasurementTypeID = @MeasurementTypeID)
END">
                    <UpdateParameters>
                        <asp:Parameter Name="Measurement" />
                        <asp:Parameter Name="MeasurementTypeID" />
                        <asp:ControlParameter ControlID="OrderListGridView" Name="OrderListID" PropertyName="SelectedDataKey[0]" />
                        <asp:ControlParameter ControlID="OrderListGridView" Name="CustomerID" PropertyName="SelectedDataKey[2]" />
                        <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" />
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                    </UpdateParameters>
                </asp:SqlDataSource>

                <asp:SqlDataSource ID="Ordered_Dress_StyleSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM [Ordered_Dress_Style]" UpdateCommand="IF(@Checked='True')
BEGIN
 IF NOT EXISTS ( SELECT  * FROM Ordered_Dress_Style  WHERE (OrderListID = @OrderListID) AND (Dress_StyleID = @Dress_StyleID))
BEGIN
INSERT INTO Ordered_Dress_Style(CustomerID, OrderID, Dress_StyleID, OrderListID, RegistrationID, InstitutionID, DressStyleMesurement) VALUES (@CustomerID, @OrderID, @Dress_StyleID, @OrderListID, @RegistrationID, @InstitutionID, @DressStyleMesurement)
END
ELSE
BEGIN
UPDATE  Ordered_Dress_Style  SET  DressStyleMesurement = @DressStyleMesurement  WHERE (OrderListID = @OrderListID) AND (Dress_StyleID = @Dress_StyleID)
END
END
ELSE
BEGIN
DELETE FROM Ordered_Dress_Style WHERE (OrderListID = @OrderListID) AND (Dress_StyleID = @Dress_StyleID)
END">
                    <UpdateParameters>
                        <asp:Parameter Name="Checked" />
                        <asp:Parameter Name="Dress_StyleID" />
                        <asp:Parameter Name="DressStyleMesurement" />
                        <asp:ControlParameter ControlID="OrderListGridView" Name="CustomerID" PropertyName="SelectedDataKey[2]" />
                        <asp:QueryStringParameter Name="OrderID" QueryStringField="OrderID" />
                        <asp:ControlParameter ControlID="OrderListGridView" Name="OrderListID" PropertyName="SelectedDataKey[0]" />
                        <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" />
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                    </UpdateParameters>
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
                        <asp:Parameter Name="Checked" />
                        <asp:Parameter Name="Dress_StyleID" Type="Int32" />
                        <asp:Parameter Name="DressStyleMesurement" Type="String" />
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                        <asp:ControlParameter ControlID="OrderListGridView" Name="CustomerID" PropertyName="SelectedDataKey[2]" Type="Int32" />
                        <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                    </InsertParameters>
                </asp:SqlDataSource>

                <asp:SqlDataSource ID="Customer_DressSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="IF NOT EXISTS(SELECT * FROM Customer_Dress WHERE (CustomerID = @CustomerID) AND (DressID = @DressID) AND (InstitutionID = @InstitutionID))
BEGIN
INSERT INTO [Customer_Dress] ([RegistrationID], [InstitutionID], [CustomerID], [DressID], [CDDetails]) VALUES (@RegistrationID, @InstitutionID, @CustomerID, @DressID, @CDDetails)
END
ELSE
BEGIN
UPDATE [Customer_Dress] SET [CDDetails] = @CDDetails WHERE (CustomerID = @CustomerID) AND (DressID = @DressID) AND (InstitutionID = @InstitutionID)
END"
                    SelectCommand="SELECT Details,DressQuantity FROM OrderList WHERE (OrderListID = @OrderListID)" UpdateCommand="UPDATE OrderList SET Details = @Details, DressQuantity = @DressQuantity WHERE (OrderListID = @OrderListID)">
                    <InsertParameters>
                        <asp:ControlParameter ControlID="OrderListGridView" Name="CustomerID" PropertyName="SelectedDataKey[2]" Type="Int32" />
                        <asp:ControlParameter ControlID="OrderListGridView" Name="DressID" PropertyName="SelectedDataKey[1]" Type="Int32" />
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                        <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                        <asp:ControlParameter ControlID="DetailsTextBox" Name="CDDetails" PropertyName="Text" Type="String" />
                    </InsertParameters>
                    <SelectParameters>
                        <asp:ControlParameter ControlID="OrderListGridView" Name="OrderListID" PropertyName="SelectedDataKey[0]" />
                    </SelectParameters>
                    <UpdateParameters>
                        <asp:ControlParameter ControlID="DetailsTextBox" Name="Details" PropertyName="Text" />
                        <asp:ControlParameter ControlID="DressQuantityTextBox" Name="DressQuantity" PropertyName="Text" />
                        <asp:ControlParameter ControlID="OrderListGridView" Name="OrderListID" PropertyName="SelectedDataKey[0]" />
                    </UpdateParameters>
                </asp:SqlDataSource>


            </div>
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


    <script>
       Sys.WebForms.PageRequestManager.getInstance().add_endRequest(function (a, b) {
          $('input[type="checkbox"]').change(function () {
             if ($(this).closest('.Style_Input').removeClass('Color').find('input[type="checkbox"]:checked').length === 1)
                $(this).closest('.Style_Input').addClass('Color');

             if ($(this).closest('.Color').addClass('Style_Input').find('input[type="checkbox"]:checked').length === 0)
                $(this).closest('.Style_Input').removeClass('Color');
          });
       });

        function isNumberKey(a) { a = a.which ? a.which : event.keyCode; return 46 != a && 31 < a && (48 > a || 57 < a) ? !1 : !0 };
        /***Disable Browser Back Button****/
        function noBack() {
            window.history.forward();
        }
        noBack();
        window.onload = noBack;
        window.onpageshow = function (evt) {
            if (evt.persisted) noBack();
        }
        window.onunload = function () { void (0)}
    </script>
</asp:Content>
