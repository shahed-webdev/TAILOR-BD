<%@ Page Title="" Language="C#" MasterPageFile="~/Design.Master" AutoEventWireup="true" CodeBehind="Pay_Invoice.aspx.cs" Inherits="TailorBD.Access_Authority.Pay_Invoice" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
    <link href="../CSS/Institution_Pay_Invoice.css" rel="stylesheet" />
    <script src="../../JS/requiered/jquery.js"></script>
    <link href="../../JS/jq_Profile/css/Profile_jquery-ui-1.8.23.custom.css" rel="stylesheet" />
    <script src="../../JS/jq_Profile/jquery-ui-1.8.23.custom.min.js"></script>

    <script src="../../JS/DatePicker/jquery.datepick.js"></script>
    <link href="../../JS/DatePicker/jquery.datepick.css" rel="stylesheet" />


    <script type="text/javascript">
        $(function () {
            $('#main').tabs();
            $('.Datetime').datepick();
        });
    </script>

    <style type="text/css">
        .EroorSummer { color: red; font-size: 10pt; font-family: Tahoma; }
    </style>

</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <asp:ScriptManager ID="ScriptManager1" runat="server"></asp:ScriptManager>
    <a href="../Institution_List.aspx"><< Back To List</a>
    <h3>Institution Details </h3>

    <asp:FormView ID="AdminFormView" runat="server" DataKeyNames="InstitutionID" DataSourceID="InstitutionSQL" Width="100%">
        <ItemTemplate>
            <div class="Personal_Info">
                <div class="Profile_Image">
                    <img alt="No Image" src="../../Handler/TailorInfo.ashx?Img=<%#Eval("InstitutionID") %>" class="P_Image" /><br />
                </div>
                <div class="Info">
                    <ul>
                        <li>
                            <strong>
                                <asp:Label ID="NameLabel" runat="server" Text='<%# Bind("InstitutionName") %>' /></strong>
                        </li>
                        <li>মোবাইল:
                            <asp:Label ID="PhoneLabel1" runat="server" Text='<%# Bind("Phone") %>' /></li>
                        <li>ইমেইল: 
                            <asp:Label ID="EmailLabel" runat="server" Text='<%# Bind("Email") %>' /></li>
                        <li>ঠিকানা: 
                            <asp:Label ID="AddressLabel" runat="server" Text='<%# Bind("Address") %>' /></li>
                    </ul>
                </div>
            </div>
        </ItemTemplate>
    </asp:FormView>

    <asp:SqlDataSource ID="InstitutionSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
        SelectCommand="SELECT * FROM Institution WHERE (InstitutionID = @InstitutionID)">
        <SelectParameters>
            <asp:QueryStringParameter Name="InstitutionID" QueryStringField="InstitutionID" />
        </SelectParameters>

    </asp:SqlDataSource>


    <div class="BasicInfo">
        <div id="main">
            <ul>
                <li><a href="#DueInvoice">Due Invoice</a></li>
                <li><a href="#InvoicePaid">Paid Invoice</a></li>
                <li><a href="#SMSRecharge">SMS Recharge</a></li>
                <li><a href="#DeleteOrderPayment">Delete Order Payment</a></li>
                <li><a href="#FabricReceipt">Delete Fabric Receipt</a></li>
            </ul>

            <div id="DueInvoice">
                <asp:GridView ID="DueGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" SelectedRowStyle-CssClass="Selected" DataKeyNames="InvoiceID" DataSourceID="DueSQL">
                    <Columns>

                        <asp:HyperLinkField DataNavigateUrlFields="InvoiceID"
                            DataNavigateUrlFormatString="AdMoreInvoice.aspx?InvoiceID={0}"
                            HeaderText="Ad More Invoice" Text="Ad More Invoice" />

                        <asp:CommandField ShowSelectButton="True" />
                        <asp:BoundField DataField="Invoice_For" HeaderText="Invoice For" SortExpression="Invoice_For" />
                        <asp:BoundField DataField="IssuDate" DataFormatString="{0:d MMM yy}" HeaderText="Issu Date" SortExpression="IssuDate" />
                        <asp:BoundField DataField="EndDate" DataFormatString="{0:d MMM yy}" HeaderText="End Date" SortExpression="EndDate" />
                        <asp:BoundField DataField="TotalAmount" HeaderText="Total Amount" SortExpression="TotalAmount" />
                        <asp:TemplateField HeaderText="Discount" SortExpression="Discount">
                            <ItemTemplate>
                                Previous
                                         <asp:Label ID="Label1" runat="server" Text='<%# Bind("Discount") %>'></asp:Label>
                                <br />
                                <asp:TextBox ID="DiscountTextBox" runat="server" CssClass="textbox" placeholder="Enter Discount Amount"></asp:TextBox>

                            </ItemTemplate>
                        </asp:TemplateField>
                        <asp:BoundField DataField="PaidAmount" HeaderText="Paid" SortExpression="PaidAmount" />
                        <asp:TemplateField HeaderText="Due">
                            <ItemTemplate>
                                <asp:Label ID="DueLabel" runat="server" Text='<%# Bind("Due") %>'></asp:Label><br />
                                <asp:TextBox ID="PayAmountTextBox" runat="server" CssClass="textbox" placeholder="Enter Pay Amount"></asp:TextBox>
                                <asp:RegularExpressionValidator ID="RegularExpressionValidator3" runat="server" ControlToValidate="PayAmountTextBox" CssClass="EroorSummer" ErrorMessage="*" ValidationExpression="^\d+$" ValidationGroup="A"></asp:RegularExpressionValidator>
                            </ItemTemplate>
                        </asp:TemplateField>

                        <asp:HyperLinkField DataNavigateUrlFields="InstitutionID,InvoiceID"
                            DataNavigateUrlFormatString="Print_Invoice.aspx?InstitutionID={0}&InvoiceID={1}"
                            HeaderText="Print" Text="Print" />
                    </Columns>
                    <SelectedRowStyle CssClass="Selected" />
                </asp:GridView>

                <asp:SqlDataSource ID="DueSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="INSERT INTO Invoice_Payment_Record(InvoiceID, InstitutionID, RegistrationID, Amount, PaidDate, Collected_By, Payment_Method) VALUES (@InvoiceID, @InstitutionID, @RegistrationID, @Amount, @PaidDate,@Collected_By,@Payment_Method)" SelectCommand="SELECT * FROM [Invoice] WHERE (([InstitutionID] = @InstitutionID) AND ([PaymentStatus] = @PaymentStatus))" UpdateCommand="UPDATE Invoice SET Discount =@Discount  WHERE (InvoiceID = @InvoiceID)">
                    <InsertParameters>
                        <asp:Parameter Name="InvoiceID" />
                        <asp:QueryStringParameter Name="InstitutionID" QueryStringField="InstitutionID" />
                        <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" />
                        <asp:Parameter Name="Amount" />
                        <asp:ControlParameter ControlID="PidDateTextBox" Name="PaidDate" PropertyName="Text" />
                        <asp:ControlParameter ControlID="CollectedByTextBox" Name="Collected_By" PropertyName="Text" />
                        <asp:ControlParameter ControlID="PayByDropDownList" Name="Payment_Method" PropertyName="SelectedValue" />
                    </InsertParameters>
                    <SelectParameters>
                        <asp:QueryStringParameter Name="InstitutionID" QueryStringField="InstitutionID" Type="Int32" />
                        <asp:Parameter DefaultValue="Due" Name="PaymentStatus" Type="String" />
                    </SelectParameters>
                    <UpdateParameters>
                        <asp:Parameter Name="InvoiceID" />
                        <asp:Parameter Name="Discount" />
                    </UpdateParameters>
                </asp:SqlDataSource>

                <%if (PaidRecordGridView.Rows.Count > 0)
                    { %>
                <p>Paid Record(s)</p>
                <%} %>
                <asp:GridView ID="PaidRecordGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="InvoicePaymentRecordID" DataSourceID="PaidRecordSQL">
                    <Columns>
                        <asp:BoundField DataField="Amount" HeaderText="Amount" SortExpression="Amount" />
                        <asp:BoundField DataField="PaidDate" DataFormatString="{0: d MMM yyyy}" HeaderText="Paid Date" SortExpression="PaidDate" />
                        <asp:BoundField DataField="Collected_By" HeaderText="Collected By" SortExpression="Collected_By" />
                        <asp:BoundField DataField="Payment_Method" HeaderText="Payment_Method" SortExpression="Payment_Method" />
                    </Columns>
                </asp:GridView>
                <asp:SqlDataSource ID="PaidRecordSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT InvoicePaymentRecordID, InvoiceID, RegistrationID, InstitutionID, Amount, PaidDate, Collected_By, Payment_Method FROM Invoice_Payment_Record WHERE (InvoiceID = @InvoiceID)">
                    <SelectParameters>
                        <asp:ControlParameter ControlID="DueGridView" Name="InvoiceID" PropertyName="SelectedValue" Type="Int32" />
                    </SelectParameters>
                </asp:SqlDataSource>
                <br />
                Payment Method<br />
                <asp:DropDownList ID="PayByDropDownList" runat="server" CssClass="dropdown">
                    <asp:ListItem Value="0">Select</asp:ListItem>
                    <asp:ListItem>Cash</asp:ListItem>
                    <asp:ListItem>Bkash</asp:ListItem>
                    <asp:ListItem>Visa Card</asp:ListItem>
                    <asp:ListItem>Bank Account</asp:ListItem>
                </asp:DropDownList>
                <asp:RequiredFieldValidator ID="RequiredFieldValidator4" runat="server" ControlToValidate="PayByDropDownList" CssClass="EroorStar" ErrorMessage="*" InitialValue="0" ValidationGroup="A"></asp:RequiredFieldValidator>
                <br />
                <br />
                Paid Date<br />
                <asp:TextBox ID="PidDateTextBox" runat="server" CssClass="Datetime"></asp:TextBox>
                <asp:RequiredFieldValidator ID="RequiredFieldValidator5" runat="server" ControlToValidate="PidDateTextBox" CssClass="EroorStar" ErrorMessage="*" InitialValue="0" ValidationGroup="A"></asp:RequiredFieldValidator>
                <br />
                <br />
                Collected By<br />
                <asp:TextBox ID="CollectedByTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
                <br />
                <br />
                <asp:Button ID="PayButton" runat="server" CssClass="ContinueButton" OnClick="PayButton_Click" Text="Pay" ValidationGroup="A" />
                <br />
            </div>
            <div id="InvoicePaid">
                <asp:GridView ID="PaidGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="InvoiceID" DataSourceID="PaidInvoiceSQL">
                    <Columns>
                        <asp:HyperLinkField DataNavigateUrlFields="InvoiceID"
                            DataNavigateUrlFormatString="AdMoreInvoice.aspx?InvoiceID={0}"
                            HeaderText="Ad More Invoice" Text="Ad More Invoice" />
                        <asp:BoundField DataField="Invoice_For" HeaderText="Invoice_For" SortExpression="Invoice_For" />
                        <asp:BoundField DataField="TotalAmount" HeaderText="TotalAmount" SortExpression="TotalAmount" />
                        <asp:BoundField DataField="IssuDate" DataFormatString="{0:d MMM yy}" HeaderText="Issu Date" SortExpression="IssuDate" />
                        <asp:BoundField DataField="EndDate" DataFormatString="{0:d MMM yy}" HeaderText="End Date" SortExpression="EndDate" />
                        <asp:BoundField DataField="Discount" HeaderText="Discount" SortExpression="Discount" />
                        <asp:BoundField DataField="PaidAmount" HeaderText="Paid" SortExpression="PaidAmount" />
                        <asp:HyperLinkField DataNavigateUrlFields="InstitutionID,InvoiceID"
                            DataNavigateUrlFormatString="Print_Invoice.aspx?InstitutionID={0}&InvoiceID={1}"
                            HeaderText="Print" Text="Print" />
                    </Columns>
                    <EmptyDataTemplate>
                        No Invoice Paid Record(s)
                    </EmptyDataTemplate>
                </asp:GridView>

                <asp:SqlDataSource ID="PaidInvoiceSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                    SelectCommand="SELECT * FROM [Invoice] WHERE (([InstitutionID] = @InstitutionID) AND ([PaymentStatus] = @PaymentStatus))">
                    <SelectParameters>
                        <asp:QueryStringParameter Name="InstitutionID" QueryStringField="InstitutionID" Type="Int32" />
                        <asp:Parameter DefaultValue="Paid" Name="PaymentStatus" Type="String" />
                    </SelectParameters>
                </asp:SqlDataSource>

            </div>
            <div id="SMSRecharge">
                <asp:UpdatePanel ID="UpdatePanel2" runat="server">
                    <ContentTemplate>
                        <table>
                            <tr>
                                <td>Recharge Quantity<asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="QuantityTextBox" CssClass="EroorStar" ErrorMessage="*" ValidationGroup="R"></asp:RequiredFieldValidator>
                                </td>
                                <td>Price(per SMS)<asp:RequiredFieldValidator ID="RequiredFieldValidator3" runat="server" ControlToValidate="PriceTextBox" CssClass="EroorStar" ErrorMessage="*" ValidationGroup="R"></asp:RequiredFieldValidator>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <asp:TextBox ID="QuantityTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
                                </td>
                                <td>
                                    <asp:TextBox ID="PriceTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
                                </td>
                            </tr>
                            <tr>
                                <td>&nbsp;</td>
                                <td>&nbsp;</td>
                            </tr>
                            <tr>
                                <td>
                                    <asp:Button ID="SubmitButton" runat="server" Text="Submit" CssClass="ContinueButton" OnClick="SubmitButton_Click" ValidationGroup="R" />
                                </td>
                                <td>&nbsp;</td>
                            </tr>
                            <tr>
                                <td>&nbsp;</td>
                                <td>&nbsp;</td>
                            </tr>
                        </table>

                        <asp:GridView ID="SMSGridView" runat="server" AutoGenerateColumns="False" DataKeyNames="SMS_Recharge_RecordID" DataSourceID="RechargeSQL" CssClass="mGrid">
                            <Columns>
                                <asp:BoundField DataField="RechargeSMS" HeaderText="Recharge SMS" SortExpression="RechargeSMS" />
                                <asp:BoundField DataField="PerSMS_Price" HeaderText="Unit Price" SortExpression="PerSMS_Price" />
                                <asp:BoundField DataField="Total_Price" HeaderText="Total Price" ReadOnly="True" SortExpression="Total_Price" />
                                <asp:BoundField DataField="Date" HeaderText="Date" SortExpression="Date" DataFormatString="{0:d MMM yyyy}" />
                                <asp:CommandField ShowEditButton="True" />
                                <asp:CommandField ShowDeleteButton="True" />
                            </Columns>
                            <EmptyDataTemplate>
                                Empty
                            </EmptyDataTemplate>
                        </asp:GridView>
                        <asp:SqlDataSource ID="RechargeSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" DeleteCommand="DELETE FROM [SMS_Recharge_Record] WHERE [SMS_Recharge_RecordID] = @SMS_Recharge_RecordID" InsertCommand="INSERT INTO SMS_Recharge_Record(InstitutionID, RechargeSMS, PerSMS_Price, Date) VALUES (@InstitutionID, @RechargeSMS, @PerSMS_Price, GETDATE())" SelectCommand="SELECT SMS_Recharge_RecordID, InstitutionID, RechargeSMS, PerSMS_Price, Date, Total_Price FROM SMS_Recharge_Record WHERE (InstitutionID = @InstitutionID)" UpdateCommand="UPDATE SMS_Recharge_Record SET RechargeSMS = @RechargeSMS, PerSMS_Price = @PerSMS_Price WHERE (SMS_Recharge_RecordID = @SMS_Recharge_RecordID)">
                            <DeleteParameters>
                                <asp:Parameter Name="SMS_Recharge_RecordID" Type="Int32" />
                            </DeleteParameters>
                            <InsertParameters>
                                <asp:QueryStringParameter Name="InstitutionID" QueryStringField="InstitutionID" Type="Int32" />
                                <asp:ControlParameter ControlID="QuantityTextBox" Name="RechargeSMS" PropertyName="Text" Type="Int32" />
                                <asp:ControlParameter ControlID="PriceTextBox" Name="PerSMS_Price" PropertyName="Text" Type="Double" />
                            </InsertParameters>
                            <SelectParameters>
                                <asp:QueryStringParameter Name="InstitutionID" QueryStringField="InstitutionID" />
                            </SelectParameters>
                            <UpdateParameters>
                                <asp:Parameter Name="RechargeSMS" Type="Int32" />
                                <asp:Parameter Name="PerSMS_Price" Type="Double" />
                                <asp:Parameter Name="SMS_Recharge_RecordID" Type="Int32" />
                            </UpdateParameters>
                        </asp:SqlDataSource>
                    </ContentTemplate>
                </asp:UpdatePanel>
            </div>
            <div id="DeleteOrderPayment">
                <asp:UpdatePanel ID="UpdatePanel1" runat="server">
                    <ContentTemplate>
                        <table>
                            <tr>
                                <td>
                                    <asp:TextBox ID="OrderNumberTextBox" runat="server" placeholder="Order Number" CssClass="Textbox" />
                                </td>
                                <td>
                                    <asp:Button ID="FindButton" runat="server" Text="Find" CssClass="ContinueButton" />
                                </td>
                            </tr>
                        </table>

                        <asp:GridView ID="OrderPaymentGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="PaymentRecordID" DataSourceID="OrderPaymentSQL">
                            <Columns>
                                <asp:CommandField ShowDeleteButton="True" />
                                <asp:BoundField DataField="PaymentRecordID" HeaderText="PaymentRecordID" InsertVisible="False" ReadOnly="True" SortExpression="PaymentRecordID" />
                                <asp:BoundField DataField="OrderID" HeaderText="OrderID" SortExpression="OrderID" />
                                <asp:BoundField DataField="AccountID" HeaderText="AccountID" SortExpression="AccountID" />
                                <asp:BoundField DataField="CustomerID" HeaderText="CustomerID" SortExpression="CustomerID" />
                                <asp:BoundField DataField="OrderSerialNumber" HeaderText="OrderSN" SortExpression="OrderSerialNumber" />
                                <asp:BoundField DataField="CustomerNumber" HeaderText="CustomerSN" SortExpression="CustomerNumber" />
                                <asp:BoundField DataField="CustomerName" HeaderText="Cus Name" SortExpression="CustomerName" />
                                <asp:BoundField DataField="Amount" HeaderText="Amount" SortExpression="Amount" />
                                <asp:BoundField DataField="Payment_TimeStatus" HeaderText="TimeStatus" SortExpression="Payment_TimeStatus" />
                                <asp:BoundField DataField="Phone" HeaderText="Phone" SortExpression="Phone" />
                                <asp:BoundField DataField="AccountName" HeaderText="Account" SortExpression="AccountName" />
                                <asp:BoundField DataField="OrderPaid_Date" HeaderText="Paid Date" SortExpression="OrderPaid_Date" DataFormatString="{0:d MMM yyyy}" />
                                <asp:BoundField DataField="Insert_Date" HeaderText="Insert Date" SortExpression="Insert_Date" DataFormatString="{0:d MMM yyyy}" />
                            </Columns>
                        </asp:GridView>
                        <asp:SqlDataSource ID="OrderPaymentSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Payment_Record.PaymentRecordID, [Order].InstitutionID, [Order].OrderSerialNumber, Customer.CustomerNumber, Customer.CustomerName, Payment_Record.Amount, Payment_Record.Payment_Method, Payment_Record.Payment_TimeStatus, Customer.Phone, Account.AccountName, Payment_Record.OrderPaid_Date, Payment_Record.Insert_Date, Payment_Record.OrderID, Payment_Record.CustomerID, Payment_Record.AccountID FROM [Order] INNER JOIN Payment_Record ON [Order].OrderID = Payment_Record.OrderID INNER JOIN Account ON Payment_Record.AccountID = Account.AccountID INNER JOIN Customer ON Payment_Record.CustomerID = Customer.CustomerID WHERE ([Order].OrderSerialNumber = @OrderSerialNumber) AND ([Order].InstitutionID = @InstitutionID)" DeleteCommand="DELETE FROM Payment_Record WHERE (PaymentRecordID = @PaymentRecordID)">
                            <DeleteParameters>
                                <asp:Parameter Name="PaymentRecordID" />
                            </DeleteParameters>
                            <SelectParameters>
                                <asp:ControlParameter ControlID="OrderNumberTextBox" Name="OrderSerialNumber" PropertyName="Text" />
                                <asp:QueryStringParameter Name="InstitutionID" QueryStringField="InstitutionID" />
                            </SelectParameters>
                        </asp:SqlDataSource>
                    </ContentTemplate>
                </asp:UpdatePanel>
            </div>
            <div id="FabricReceipt">
                <asp:UpdatePanel ID="UpdatePanel3" runat="server">
                    <ContentTemplate>  
                        <table>
                            <tr>
                                <td>
                                    <asp:TextBox ID="Fabrics_Receipt_TextBox" runat="server" placeholder="Fabrics_Receipt No" CssClass="Textbox" /></td>
                                <td>
                                    <asp:Button ID="Fabrics_Delete_Button" runat="server" Text="Find" CssClass="ContinueButton" />
                                </td>
                            </tr>
                        </table>
                        <asp:GridView ID="OrderPaymentGridView0" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataSourceID="FabricsReceiptSQL">
                            <Columns>
                                <asp:BoundField DataField="Selling_SN" HeaderText="Selling_SN" SortExpression="Selling_SN" />
                                <asp:BoundField DataField="CustomerName" HeaderText="CustomerName" SortExpression="CustomerName" />
                                <asp:BoundField DataField="FabricSellingPaymentRecordID" HeaderText="FabricSellingPaymentRecordID" SortExpression="FabricSellingPaymentRecordID" InsertVisible="False" ReadOnly="True" />
                                <asp:BoundField DataField="SellingPaidAmount" HeaderText="SellingPaidAmount" SortExpression="SellingPaidAmount" />
                                <asp:BoundField DataField="Payment_Situation" HeaderText="Payment_Situation" SortExpression="Payment_Situation" />
                                <asp:BoundField DataField="SellingPaid_Date" HeaderText="SellingPaid_Date" SortExpression="SellingPaid_Date" />
                                <asp:BoundField DataField="FabricsSellingID" HeaderText="FabricsSellingID" SortExpression="FabricsSellingID" InsertVisible="False" ReadOnly="True" />
                                <asp:BoundField DataField="AccountName" HeaderText="AccountName" SortExpression="AccountName" />
                                <asp:BoundField DataField="RegistrationID" HeaderText="RegistrationID" SortExpression="RegistrationID" />
                                <asp:BoundField DataField="AccountID" HeaderText="AccountID" SortExpression="AccountID" />
                                <asp:BoundField DataField="CustomerNumber" HeaderText="CustomerNumber" SortExpression="CustomerNumber" />
                                <asp:CommandField ShowDeleteButton="True" />
                            </Columns>
                        </asp:GridView>
                        <asp:SqlDataSource ID="FabricsReceiptSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" DeleteCommand="DELETE FROM [Fabrics_Selling_PaymentRecord] WHERE [FabricSellingPaymentRecordID] = @FabricSellingPaymentRecordID" SelectCommand="SELECT Fabrics_Selling_PaymentRecord.FabricSellingPaymentRecordID, Fabrics_Selling_PaymentRecord.SellingPaidAmount, Fabrics_Selling_PaymentRecord.Payment_Situation, Fabrics_Selling_PaymentRecord.SellingPaid_Date, Fabrics_Selling.Selling_SN, Fabrics_Selling.FabricsSellingID, Account.AccountName, Fabrics_Selling_PaymentRecord.RegistrationID, Fabrics_Selling_PaymentRecord.AccountID, Customer.CustomerNumber, Customer.CustomerName, Customer.Phone, Customer.Address, Fabrics_Selling_PaymentRecord.InsertDate FROM Fabrics_Selling_PaymentRecord INNER JOIN Fabrics_Selling ON Fabrics_Selling_PaymentRecord.FabricsSellingID = Fabrics_Selling.FabricsSellingID INNER JOIN Customer ON Fabrics_Selling.CustomerID = Customer.CustomerID LEFT OUTER JOIN Account ON Fabrics_Selling_PaymentRecord.AccountID = Account.AccountID WHERE (Fabrics_Selling.InstitutionID = @InstitutionID) AND (Fabrics_Selling.Selling_SN = @Selling_SN)">
                            <DeleteParameters>
                                <asp:Parameter Name="FabricSellingPaymentRecordID" Type="Int32" />
                            </DeleteParameters>
                            <SelectParameters>
                                <asp:QueryStringParameter Name="InstitutionID" QueryStringField="InstitutionID" />
                                <asp:ControlParameter ControlID="Fabrics_Receipt_TextBox" Name="Selling_SN" PropertyName="Text" />
                            </SelectParameters>
                        </asp:SqlDataSource>
                  </ContentTemplate>
                </asp:UpdatePanel>
            </div>
        </div>
    </div>

</asp:Content>
