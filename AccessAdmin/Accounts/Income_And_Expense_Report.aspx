<%@ Page Title="Accounts Report" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Income_And_Expense_Report.aspx.cs" Inherits="TailorBD.AccessAdmin.Accounts.Imcome_And_Expense_Report" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
    <link href="../../JS/DatePicker/jquery.datepick.css" rel="stylesheet" />
    <link href="CSS/Income_Expense_Report.css?v=4" rel="stylesheet" />
    <link href="../../JS/jq_Profile/css/Profile_jquery-ui-1.8.23.custom.css" rel="stylesheet" />
    <style>
        .mGrid td table td { border: none; padding-right: 3px; text-align: left; }
    </style>
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <h3 class="P_H">Accounts Report:
      <label class="Date"></label>
    </h3>

    <table class="NoPrint">
        <tr>
            <td>
                <asp:TextBox ID="FromDateTextBox" runat="server" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" placeholder="কোন তারিখ থেকে" CssClass="Datetime"></asp:TextBox>
            </td>
            <td>
                <asp:TextBox ID="ToDateTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" placeholder="কোন তারিখ পর্যন্ত" CssClass="Datetime"></asp:TextBox>
            </td>
            <td>
                <asp:Button ID="FindButton" runat="server" CssClass="SearchButton" OnClick="FindButton_Click" />
            </td>
        </tr>
        <tr>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
        </tr>
    </table>

    <div id="main">
        <ul>
            <li><a href="#Summery">Summary</a></li>
            <li><a href="#Details">Details</a></li>
        </ul>

        <div id="Summery">
            <fieldset style="padding-bottom: 8px">
                <legend>Account</legend>
                <asp:DataList ID="In_Ex_DataList" runat="server" DataKeyField="AccountID" DataSourceID="In_ExSQL" RepeatDirection="Horizontal" Width="100%" RepeatColumns="2">
                    <ItemStyle VerticalAlign="Top" />
                    <ItemTemplate>
                        <div class="Account-sec">
                            <asp:HiddenField ID="AccountID_HF" runat="server" Value='<%# Eval("AccountID") %>' />
                            <div class="AcName">
                                <asp:Label ID="AccountNameLabel" runat="server" Text='<%# Eval("AccountName") %>' />
                                <div class="A_value">
                                    পূর্বের টাকা:
                           <asp:Label ID="Balance_BeforeLabel" runat="server" Text='<%# Eval("Balance_Before","{0:0.##}") %>' />
                                </div>
                                <div class="clear"></div>
                            </div>

                            <asp:DataList ID="InDetailsDataList" runat="server" DataSourceID="InDetailsSQL" Width="100%">
                                <ItemTemplate>
                                    <div class="row">
                                        <div class="A_Title">
                                            <asp:Label ID="CategoryLabel" runat="server" Text='<%# Eval("Category") %>' />
                                        </div>
                                        <div class="A_value">
                                            <asp:Label ID="IN_AmountLabel" runat="server" Text='<%# Eval("IN_Amount") %>' />
                                        </div>
                                        <div class="clear"></div>
                                    </div>
                                </ItemTemplate>
                            </asp:DataList>
                            <asp:SqlDataSource ID="InDetailsSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand=" Select A_A.Category, ISNULL(A_A.Add_AMOUNT,0) - ISNULL(S_A.Subtraction_AMOUNT,0)  AS IN_Amount From (SELECT   Category,SUM(Amount) AS Add_AMOUNT
FROM            Account_Log 
WHERE        (InstitutionID = @InstitutionID) AND (AccountID = @AccountID) AND (In_Ex_type = 'In')and Add_Subtraction = 'Add' and
Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')
GROUP BY   Category) as A_A 
FULL OUTER JOIN
(SELECT       Category,  SUM(Amount) AS Subtraction_AMOUNT
FROM            Account_Log
WHERE        (InstitutionID = @InstitutionID) AND (AccountID = @AccountID) AND (In_Ex_type = 'In')and Add_Subtraction = 'Subtraction' and
Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')
GROUP BY Category) AS S_A ON A_A.Category = S_A.Category where ISNULL(A_A.Add_AMOUNT,0) - ISNULL(S_A.Subtraction_AMOUNT,0) &lt;&gt; 0">
                                <SelectParameters>
                                    <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                                    <asp:ControlParameter ControlID="AccountID_HF" Name="AccountID" PropertyName="Value" />
                                    <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                                    <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
                                </SelectParameters>
                            </asp:SqlDataSource>

                            <div class="row Total_Balance">
                                <div class="A_Title">Total Income</div>
                                <div class="A_value">
                                    <asp:Label ID="Total_InLabel" runat="server" Text='<%# Eval("Total_In") %>' />
                                </div>
                            </div>

                            <asp:DataList ID="Ex_DetailsDataList" runat="server" DataSourceID="Ex_DetailsSQL" Width="100%">
                                <ItemTemplate>
                                    <div class="row">
                                        <div class="A_Title">
                                            <asp:Label ID="CategoryLabel" runat="server" Text='<%# Eval("Category") %>' />
                                        </div>
                                        <div class="A_value">
                                            <asp:Label ID="EX_AmountLabel" runat="server" Text='<%# Eval("EX_Amount") %>' />
                                        </div>
                                        <div class="clear"></div>
                                    </div>
                                </ItemTemplate>
                            </asp:DataList>
                            <asp:SqlDataSource ID="Ex_DetailsSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="Select S_A.Category,  ISNULL(S_A.Subtraction_AMOUNT,0)- ISNULL(A_A.Add_AMOUNT,0)  AS EX_Amount From (SELECT   Category,SUM(Amount) AS Add_AMOUNT
FROM            Account_Log 
WHERE        (InstitutionID = @InstitutionID) AND (AccountID = @AccountID) AND (In_Ex_type = 'Ex')and Add_Subtraction = 'Add' and
Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')
GROUP BY   Category) as A_A 
FULL OUTER JOIN
(SELECT       Category,  SUM(Amount) AS Subtraction_AMOUNT
FROM            Account_Log
WHERE        (InstitutionID = @InstitutionID) AND (AccountID = @AccountID) AND (In_Ex_type = 'Ex')and Add_Subtraction = 'Subtraction' and
Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')
GROUP BY Category) AS S_A ON A_A.Category = S_A.Category where ISNULL(S_A.Subtraction_AMOUNT,0)- ISNULL(A_A.Add_AMOUNT,0) &lt;&gt; 0">
                                <SelectParameters>
                                    <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                                    <asp:ControlParameter ControlID="AccountID_HF" Name="AccountID" PropertyName="Value" />
                                    <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                                    <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
                                </SelectParameters>
                            </asp:SqlDataSource>

                            <div class="row Total_Balance">
                                <div class="A_Title">Total Expense</div>
                                <div class="A_value">
                                    <asp:Label ID="Total_ExLabel" runat="server" Text='<%# Eval("Total_Ex") %>' />
                                </div>
                            </div>


                            <div class="row Balance_After">
                                সর্বশেষ টাকা:
                        <asp:Label ID="Label3" runat="server" Text='<%# Eval("Balance_After","{0:0.##}") %>' />
                            </div>
                        </div>
                    </ItemTemplate>
                </asp:DataList>
                <asp:SqlDataSource ID="In_ExSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * from (Select AccountID,AccountName, AccountBalance,ISNULL((SELECT SUM(Amount) FROM  Account_Log WHERE  (InstitutionID = @InstitutionID) AND (AccountID = Account.AccountID) AND (In_Ex_type = 'In')and Add_Subtraction = 'Add' and Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')),0) 
-
ISNULL((SELECT SUM(Amount) FROM Account_Log WHERE (InstitutionID = @InstitutionID) AND (AccountID = Account.AccountID) AND (In_Ex_type = 'In')and Add_Subtraction = 'Subtraction' and Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')),0) as Total_In,

ISNULL((SELECT SUM(Amount) FROM  Account_Log WHERE  (InstitutionID = @InstitutionID) AND (AccountID = Account.AccountID) AND (In_Ex_type = 'Ex')and Add_Subtraction = 'Subtraction' and Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')),0) 
-
ISNULL((SELECT SUM(Amount) FROM Account_Log WHERE (InstitutionID = @InstitutionID) AND (AccountID = Account.AccountID) AND (In_Ex_type = 'Ex')and Add_Subtraction = 'Add' and Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')),0) as Total_Ex,

(SELECT top(1) Balance_Before FROM Account_Log WHERE (InstitutionID = @InstitutionID) and (AccountID = Account.AccountID) and  
Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')
ORDER BY Insert_Date, Insert_Time) AS Balance_Before,

(SELECT top(1) Balance_After FROM Account_Log WHERE (InstitutionID = @InstitutionID) and (AccountID = Account.AccountID) and  
Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')
ORDER BY Insert_Date DESC, Insert_Time DESC) as Balance_After
FROM Account WHERE(InstitutionID = @InstitutionID)) as All_Account where ([Total_Ex] &lt;&gt; 0 or [Total_In] &lt;&gt; 0)">
                    <SelectParameters>
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                        <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                        <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
                    </SelectParameters>
                </asp:SqlDataSource>
            </fieldset>

            <fieldset class="F-set">
                <legend>Tailors</legend>
                <asp:FormView ID="DueReportFormView" runat="server" DataSourceID="DueReportSQL" Width="100%">
                    <ItemTemplate>
                        <div class="AcName">
                            <div class="A_value">
                                পূর্বের বাকী: 
                        <asp:Label ID="Pre_DueLabel" runat="server" Text='<%# Bind("Pre_Due","{0:0.##}") %>' />
                            </div>
                            <div class="clear"></div>
                        </div>



                        <div class="row Total_Balance">
                            <div class="A_Title">New Order Amount</div>
                            <div class="A_value">
                                <asp:Label ID="Total_New_Order_AmountLabel" runat="server" Text='<%# Bind("Total_New_Order_Amount") %>' />
                            </div>
                        </div>

                        <asp:DataList ID="PaymentReportDataList" runat="server" DataSourceID="PaymentReportSQL" Width="100%">
                            <ItemTemplate>
                                <div class="row">
                                    <div class="A_Title">
                                        <asp:Label ID="DetailsLabel" runat="server" Text='<%# Eval("Details") %>' />
                                    </div>
                                    <div class="A_value">
                                        <asp:Label ID="AmountLabel" runat="server" Text='<%# Eval("Amount") %>' />
                                    </div>
                                </div>
                            </ItemTemplate>
                        </asp:DataList>

                        <asp:SqlDataSource ID="PaymentReportSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT SUM(Amount) AS Amount, Payment_TimeStatus as Details FROM Payment_Record WHERE (InstitutionID = @InstitutionID)  and cast(Insert_Date as date) between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')
                   GROUP BY Payment_TimeStatus ORDER BY Details DESC ">
                            <SelectParameters>
                                <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                                <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                                <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
                            </SelectParameters>
                        </asp:SqlDataSource>

                        <div class="row">
                            <div class="A_Title">Discount</div>
                            <div class="A_value">
                                <asp:Label ID="DiscountLabel" runat="server" Text='<%# Bind("Discount") %>' />
                            </div>
                        </div>

                        <div class="row Balance_After">
                            সর্বশেষ বাকী:            
                        <asp:Label ID="Post_DueLabel" runat="server" Text='<%# Bind("Post_Due","{0:0.##}") %>' ForeColor="Black" Font-Bold="True" />
                        </div>
                    </ItemTemplate>
                </asp:FormView>
                <asp:SqlDataSource ID="DueReportSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT 
(SELECT TOP (1) TotalDue - Change_Amount FROM Order_Due_Record WHERE (InstitutionID = @InstitutionID) AND cast(Insert_Date as date)  between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000') ORDER BY Insert_Date) AS Pre_Due,
(SELECT  ISNULL(SUM(OrderAmount),0)  FROM  [Order] WHERE (InstitutionID =@InstitutionID) and cast(OrderDate as date) between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')) AS Total_New_Order_Amount,
(SELECT SUM(Change_Amount) FROM Order_Discount_Record WHERE (InstitutionID = @InstitutionID) and cast(Insert_Date as date) between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000'))AS Discount,
(SELECT TOP (1) TotalDue FROM Order_Due_Record WHERE (InstitutionID = @InstitutionID) AND cast(Insert_Date as date)  between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000') ORDER BY Insert_Date DESC) AS Post_Due">
                    <SelectParameters>
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                        <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                        <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
                    </SelectParameters>
                </asp:SqlDataSource>
            </fieldset>

            <fieldset class="F-set">
                <legend>Fabrics</legend>
                <asp:FormView ID="FabricSellingFormView" runat="server" DataSourceID="FabricSellingSQL" Width="100%">
                    <ItemTemplate>
                        <asp:FormView ID="StockPriceFormView" runat="server" DataSourceID="Stock_PriceSQL" Width="100%">
                            <ItemTemplate>
                                <div class="row AcName">
                                    <div class="A_Title">Current Stock Price</div>
                                    <div class="A_value">
                                        <asp:Label ID="Stock_PriceLabel" runat="server" Text='<%# Bind("Stock_Price") %>' />
                                    </div>
                                    <div class="clear"></div>
                                </div>
                            </ItemTemplate>
                        </asp:FormView>
                        <asp:SqlDataSource ID="Stock_PriceSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT        ROUND(SUM(ISNULL(StockFabricQuantity, 0) * ISNULL(CurrentBuyingUnitPrice, 0)), 2) AS Stock_Price
FROM            Fabrics
WHERE        (InstitutionID = @InstitutionID)">
                            <SelectParameters>
                                <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                            </SelectParameters>
                        </asp:SqlDataSource>

                        <div class="row">
                            <div class="A_Title">Buying Price</div>
                            <div class="A_value">
                                <asp:Label ID="Total_BuyingLabel" runat="server" Text='<%# Bind("Total_Buying") %>' />
                            </div>
                            <div class="clear"></div>
                        </div>
                        <div class="row">
                            <div class="A_Title">Selling Price</div>
                            <div class="A_value">
                                <asp:Label ID="Total_SellingLabel" runat="server" Text='<%# Bind("Total_Selling") %>' />
                            </div>
                            <div class="clear"></div>
                        </div>
                        <div class="row">
                            <div class="A_Title">Discount</div>
                            <div class="A_value">
                                <asp:Label ID="Total_DiscountLabel" runat="server" Text='<%# Bind("Total_Discount") %>' />
                            </div>
                            <div class="clear"></div>
                        </div>
                        <div class="row">
                            <div class="A_Title">Paid Amount</div>
                            <div class="A_value">
                                <asp:Label ID="Total_PaidLabel" runat="server" Text='<%# Bind("Total_Paid") %>' />
                            </div>
                            <div class="clear"></div>
                        </div>
                        <div class="row">
                            <div class="A_Title">Due Amount</div>
                            <div class="A_value">
                                <asp:Label ID="Total_DueLabel" runat="server" Text='<%# Bind("Total_Due") %>' />
                            </div>
                            <div class="clear"></div>
                        </div>
                        <div class="row Total_Balance">
                            <div class="A_Title">Net Amount</div>
                            <div class="A_value">
                                <asp:Label ID="NetLabel" runat="server" Text='<%# Bind("Net", "{0:0.##}") %>' />
                            </div>
                        </div>
                    </ItemTemplate>
                </asp:FormView>
                <asp:SqlDataSource ID="FabricSellingSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="Select *, Total_Selling-(Total_Buying + Total_Discount)  as Net 
from  (SELECT SUM( Fabrics_Selling_List.SellingPrice) AS Total_Selling, SUM(Fabrics_Selling_List.BuyingUnitPrice * Fabrics_Selling_List.SellingQuantity) AS Total_Buying FROM Fabrics_Selling_List INNER JOIN Fabrics_Selling ON Fabrics_Selling_List.FabricsSellingID = Fabrics_Selling.FabricsSellingID  WHERE (Fabrics_Selling_List.InstitutionID = @InstitutionID)and Fabrics_Selling.SellingDate between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')) as T
CROSS JOIN (SELECT SUM(SellingDueAmount) AS Total_Due, SUM(SellingPaidAmount) AS Total_Paid, SUM(SellingDiscountAmount) AS Total_Discount FROM  Fabrics_Selling WHERE (InstitutionID = @InstitutionID)and SellingDate between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')) as T2">
                    <SelectParameters>
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                        <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                        <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
                    </SelectParameters>
                </asp:SqlDataSource>
            </fieldset>
        </div>

        <div id="Details">
            <asp:FormView ID="NetFormView" runat="server" DataSourceID="NetSQL" Width="100%">
                <ItemTemplate>
                    <div class="Amt">
                        Total Income: 
               <asp:Label ID="Total_IncomeLabel" runat="server" Text='<%# Bind("Total_Income") %>' />
                        Tk.
                    </div>
                    <div class="Amt">
                        Total Expense: 
               <asp:Label ID="Total_ExpenseLabel" runat="server" Text='<%# Bind("Total_Expense") %>' />
                        Tk.
                    </div>
                </ItemTemplate>
            </asp:FormView>
            <asp:SqlDataSource ID="NetSQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT T.Total_Order+T.Extar_Income+T.Fabric_Selling AS Total_Income,T.Expense + T.Fabric_Buy AS Total_Expense , (T.Total_Order+T.Extar_Income+T.Fabric_Selling) -(T.Expense + T.Fabric_Buy) AS NET From (SELECT(SELECT ISNULL(SUM(Amount) ,0)
FROM            Payment_Record
WHERE        (InstitutionID = @InstitutionID) AND (OrderPaid_Date BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000'))) AS Total_Order ,
(SELECT         ISNULL(SUM(Extra_IncomeAmount),0) 
FROM            Extra_Income
WHERE        (InstitutionID = @InstitutionID) AND (Extra_IncomeDate BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000')))AS Extar_Income,
(SELECT        ISNULL(SUM(SellingPaidAmount),0)
FROM            Fabrics_Selling_PaymentRecord
WHERE        (InstitutionID = @InstitutionID) AND (SellingPaid_Date BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000'))) AS Fabric_Selling,
(SELECT         ISNULL(SUM(ExpanseAmount),0)
FROM            Expanse
WHERE        (InstitutionID = @InstitutionID) AND (ExpanseDate BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000'))) AS Expense,
(SELECT         ISNULL(SUM(BuyingPaidAmount),0) FROM            Fabrics_Buying_PaymentRecord
WHERE        (InstitutionID = @InstitutionID) AND (BuyingPaid_Date BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000')))AS Fabric_Buy) AS T">
                <SelectParameters>
                    <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                    <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                    <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
                </SelectParameters>
            </asp:SqlDataSource>

            <%if (Order_DeliveryGridView.Rows.Count > 0)
                { %>
            <h4>Tailoring Details</h4>
            <asp:GridView ID="Order_DeliveryGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataSourceID="Order_DeliverySQL" ShowFooter="True">
                <Columns>
                    <asp:BoundField DataField="OrderPaid_Date" HeaderText="Date" SortExpression="OrderPaid_Date" DataFormatString="{0:d MMM yyyy}" />
                    <asp:BoundField DataField="OrderSerialNumber" HeaderText="Order No." SortExpression="OrderSerialNumber" />
                    <asp:TemplateField HeaderText="Amount" SortExpression="Amount">
                        <ItemTemplate>
                            <asp:Label ID="TailoringAmtLabel" runat="server" Text='<%# Bind("Amount") %>'></asp:Label>
                        </ItemTemplate>
                        <FooterTemplate>
                            <label id="TailorGT"></label>
                        </FooterTemplate>
                    </asp:TemplateField>
                    <asp:BoundField DataField="Payment_TimeStatus" HeaderText="Status" SortExpression="Payment_TimeStatus" />
                </Columns>
                <EmptyDataTemplate>
                    No Records
                </EmptyDataTemplate>
                <FooterStyle CssClass="GridFooter" />
            </asp:GridView>
            <asp:SqlDataSource ID="Order_DeliverySQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Payment_Record.OrderPaid_Date, Payment_Record.Amount, Payment_Record.OrderID, [Order].OrderSerialNumber, Payment_Record.Payment_TimeStatus FROM [Order] INNER JOIN Payment_Record ON [Order].OrderID = Payment_Record.OrderID WHERE (Payment_Record.InstitutionID = @InstitutionID) AND (Payment_Record.OrderPaid_Date BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000')) ORDER BY Payment_Record.OrderPaid_Date, [Order].OrderSerialNumber" CancelSelectOnNullParameter="False">
                <SelectParameters>
                    <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                    <asp:ControlParameter ControlID="FromDateTextBox" DefaultValue="" Name="From_Date" PropertyName="Text" />
                    <asp:ControlParameter ControlID="ToDateTextBox" DefaultValue="" Name="To_Date" PropertyName="Text" />
                </SelectParameters>
            </asp:SqlDataSource>
            <%} %>

            <%if (ExtraIncomeGridView.Rows.Count > 0)
                {%>
            <h4>Extra Income Details</h4>
            <asp:GridView ID="ExtraIncomeGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataSourceID="ExtraIncomeSQL" ShowFooter="True">
                <Columns>
                    <asp:BoundField DataField="Extra_IncomeDate" DataFormatString="{0:d MMM yyyy}" HeaderText="Date" SortExpression="Extra_IncomeDate" />
                    <asp:TemplateField HeaderText="Amount" SortExpression="Extra_IncomeAmount">
                        <ItemTemplate>
                            <asp:Label ID="ExtraAmtLabel" runat="server" Text='<%# Bind("Extra_IncomeAmount") %>'></asp:Label>
                        </ItemTemplate>
                        <FooterTemplate>
                            <label id="ExtraInGT"></label>
                        </FooterTemplate>
                    </asp:TemplateField>
                    <asp:BoundField DataField="Extra_IncomeFor" HeaderText="Income For" SortExpression="Extra_IncomeFor" />
                </Columns>
                <FooterStyle CssClass="GridFooter" />
            </asp:GridView>
            <asp:SqlDataSource ID="ExtraIncomeSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT        Extra_IncomeDate, Extra_IncomeAmount, Extra_IncomeFor
FROM            Extra_Income
WHERE        (InstitutionID = @InstitutionID) AND (Extra_IncomeDate BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000'))">
                <SelectParameters>
                    <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                    <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                    <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
                </SelectParameters>
            </asp:SqlDataSource>
            <%} %>

            <%if (FabricBuyingGridView.Rows.Count > 0)
                {%>
            <h4>Fabrics Selling Details</h4>
            <asp:GridView ID="FabricBuyingGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataSourceID="FabricBuyingDetailsSQL" ShowFooter="True">
                <Columns>
                    <asp:BoundField DataField="SellingPaid_Date" DataFormatString="{0:d MMM yyyy}" HeaderText="Date" SortExpression="SellingPaid_Date" />
                    <asp:BoundField DataField="Selling_SN" HeaderText="Selling SN" SortExpression="Selling_SN" />
                    <asp:TemplateField HeaderText="Details">
                        <ItemTemplate>
                            <asp:HiddenField ID="FabricsSellingIDHF" runat="server" Value='<%# Eval("FabricsSellingID") %>' />
                            <asp:DataList ID="DataList1" runat="server" DataSourceID="SellingSQL" RepeatDirection="Horizontal" RepeatLayout="Flow" Width="100%">
                                <ItemTemplate>
                                    <asp:Label ID="FabricCodeLabel" runat="server" Text='<%# Eval("FabricCode") %>' Font-Bold="True" />:
                           (<asp:Label ID="SellingQuantityLabel" runat="server" Text='<%# Eval("SellingQuantity") %>' />)      
                                </ItemTemplate>
                            </asp:DataList>
                            <asp:SqlDataSource ID="SellingSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Fabrics.FabricCode, Fabrics_Selling_List.SellingQuantity FROM Fabrics_Selling_List INNER JOIN Fabrics ON Fabrics_Selling_List.FabricID = Fabrics.FabricID WHERE (Fabrics_Selling_List.FabricsSellingID = @FabricsSellingID)">
                                <SelectParameters>
                                    <asp:ControlParameter ControlID="FabricsSellingIDHF" Name="FabricsSellingID" PropertyName="Value" />
                                </SelectParameters>
                            </asp:SqlDataSource>
                        </ItemTemplate>
                    </asp:TemplateField>
                    <asp:TemplateField HeaderText="Amount" SortExpression="SellingPaidAmount">
                        <ItemTemplate>
                            <asp:Label ID="SellingAmtLabel" runat="server" Text='<%# Bind("SellingPaidAmount") %>'></asp:Label>
                        </ItemTemplate>
                        <FooterTemplate>
                            <label id="SellingGT"></label>
                        </FooterTemplate>
                    </asp:TemplateField>
                    <asp:BoundField DataField="Payment_Situation" HeaderText="Situation" SortExpression="Payment_Situation" />
                </Columns>
                <FooterStyle CssClass="GridFooter" />
            </asp:GridView>
            <asp:SqlDataSource ID="FabricBuyingDetailsSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Fabrics_Selling.FabricsSellingID,Fabrics_Selling_PaymentRecord.SellingPaid_Date, Fabrics_Selling.Selling_SN, Fabrics_Selling_PaymentRecord.SellingPaidAmount, Fabrics_Selling_PaymentRecord.Payment_Situation FROM Fabrics_Selling_PaymentRecord INNER JOIN Fabrics_Selling ON Fabrics_Selling_PaymentRecord.FabricsSellingID = Fabrics_Selling.FabricsSellingID
WHERE (Fabrics_Selling_PaymentRecord.InstitutionID = @InstitutionID)and Fabrics_Selling_PaymentRecord.SellingPaid_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')">
                <SelectParameters>
                    <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                    <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                    <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
                </SelectParameters>
            </asp:SqlDataSource>
            <%} %>

            <%if (ExpenseGridView.Rows.Count > 0)
                {%>
            <h4>Expense Details</h4>
            <asp:GridView ID="ExpenseGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataSourceID="ExpenseSQL" ShowFooter="True">
                <Columns>
                    <asp:BoundField DataField="ExpanseDate" DataFormatString="{0:d MMM yyyy}" HeaderText="Date" SortExpression="ExpanseDate" />
                    <asp:BoundField DataField="CategoryName" HeaderText="Category" SortExpression="CategoryName" />
                    <asp:TemplateField HeaderText="Amount" SortExpression="Amount">
                        <ItemTemplate>
                            <asp:Label ID="ExpenseAmtLabel" runat="server" Text='<%# Bind("Amount") %>'></asp:Label>
                        </ItemTemplate>
                        <FooterTemplate>
                            <label id="ExpenseGT"></label>
                        </FooterTemplate>
                    </asp:TemplateField>
                </Columns>
                <FooterStyle CssClass="GridFooter" />
            </asp:GridView>
            <asp:SqlDataSource ID="ExpenseSQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT SUM(Expanse.ExpanseAmount) AS Amount, Expanse_Category.CategoryName, Expanse.ExpanseDate FROM Expanse INNER JOIN Expanse_Category ON Expanse.ExpanseCategoryID = Expanse_Category.ExpanseCategoryID WHERE (Expanse.InstitutionID = @InstitutionID) AND (Expanse.ExpanseDate BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000')) GROUP BY Expanse_Category.CategoryName, Expanse.ExpanseDate ORDER BY Expanse.ExpanseDate">
                <SelectParameters>
                    <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                    <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                    <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
                </SelectParameters>
            </asp:SqlDataSource>
            <%} %>

            <%if (FabricSellingDetailsGridView.Rows.Count > 0)
                {%>
            <h4>Fabrics Buying Details</h4>
            <asp:GridView ID="FabricSellingDetailsGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataSourceID="FabricSellingDetailsSQL" ShowFooter="True">
                <Columns>
                    <asp:BoundField DataField="BuyingPaid_Date" DataFormatString="{0:d MMM yyyy}" HeaderText="Date" SortExpression="BuyingPaid_Date" />
                    <asp:BoundField DataField="Buying_SN" HeaderText="Buying SN" SortExpression="Buying_SN" />
                    <asp:TemplateField HeaderText="Amount" SortExpression="BuyingPaidAmount">
                        <ItemTemplate>
                            <asp:Label ID="BuyingAmtLabel" runat="server" Text='<%# Bind("BuyingPaidAmount") %>'></asp:Label>
                        </ItemTemplate>
                        <FooterTemplate>
                            <label id="BuyingGT"></label>
                        </FooterTemplate>
                    </asp:TemplateField>
                    <asp:BoundField DataField="Payment_Situation" HeaderText="Situation" SortExpression="Payment_Situation" />
                </Columns>
                <FooterStyle CssClass="GridFooter" />
            </asp:GridView>
            <asp:SqlDataSource ID="FabricSellingDetailsSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Fabrics_Buying_PaymentRecord.BuyingPaid_Date, Fabrics_Buying.Buying_SN, Fabrics_Buying_PaymentRecord.BuyingPaidAmount, Fabrics_Buying_PaymentRecord.Payment_Situation FROM Fabrics_Buying_PaymentRecord INNER JOIN Fabrics_Buying ON Fabrics_Buying_PaymentRecord.FabricBuyingID = Fabrics_Buying.FabricBuyingID
WHERE (Fabrics_Buying_PaymentRecord.InstitutionID = @InstitutionID)and Fabrics_Buying_PaymentRecord.BuyingPaid_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')">
                <SelectParameters>
                    <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                    <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                    <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
                </SelectParameters>
            </asp:SqlDataSource>
            <%} %>

            <div class="T_F">
                <fieldset class="F-set" style="float: left; width: 46%">
                    <legend>Tailors</legend>
                    <asp:FormView ID="FormView1" runat="server" DataSourceID="DueReportSQL" Width="100%">
                        <ItemTemplate>
                            <div class="AcName">
                                <div class="A_value">
                                    পূর্বের বাকী: 
                        <asp:Label ID="Pre_DueLabel" runat="server" Text='<%# Bind("Pre_Due","{0:0.##}") %>' />
                                </div>
                                <div class="clear"></div>
                            </div>



                            <div class="row Total_Balance">
                                <div class="A_Title">New Order Amount</div>
                                <div class="A_value">
                                    <asp:Label ID="Total_New_Order_AmountLabel" runat="server" Text='<%# Bind("Total_New_Order_Amount") %>' />
                                </div>
                            </div>

                            <asp:DataList ID="PaymentReportDataList" runat="server" DataSourceID="PaymentReportSQL" Width="100%">
                                <ItemTemplate>
                                    <div class="row">
                                        <div class="A_Title">
                                            <asp:Label ID="DetailsLabel" runat="server" Text='<%# Eval("Details") %>' />
                                        </div>
                                        <div class="A_value">
                                            <asp:Label ID="AmountLabel" runat="server" Text='<%# Eval("Amount") %>' />
                                        </div>
                                    </div>
                                </ItemTemplate>
                            </asp:DataList>

                            <asp:SqlDataSource ID="PaymentReportSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT SUM(Amount) AS Amount, Payment_TimeStatus as Details FROM Payment_Record WHERE (InstitutionID = @InstitutionID)  and cast(Insert_Date as date) between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')
                   GROUP BY Payment_TimeStatus ORDER BY Details DESC ">
                                <SelectParameters>
                                    <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                                    <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                                    <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
                                </SelectParameters>
                            </asp:SqlDataSource>

                            <div class="row">
                                <div class="A_Title">Discount</div>
                                <div class="A_value">
                                    <asp:Label ID="DiscountLabel" runat="server" Text='<%# Bind("Discount") %>' />
                                </div>
                            </div>

                            <div class="row Balance_After">
                                সর্বশেষ বাকী:            
                        <asp:Label ID="Post_DueLabel" runat="server" Text='<%# Bind("Post_Due","{0:0.##}") %>' ForeColor="Black" Font-Bold="True" />
                            </div>
                        </ItemTemplate>
                    </asp:FormView>
                </fieldset>

                <fieldset class="F-set" style="float: right; width: 46%">
                    <legend>Fabrics</legend>
                    <asp:FormView ID="FormView2" runat="server" DataSourceID="FabricSellingSQL" Width="100%">
                        <ItemTemplate>
                            <asp:FormView ID="StockPriceFormView" runat="server" DataSourceID="Stock_PriceSQL" Width="100%">
                                <ItemTemplate>
                                    <div class="row AcName">
                                        <div class="A_Title">Current Stock Price</div>
                                        <div class="A_value">
                                            <asp:Label ID="Stock_PriceLabel" runat="server" Text='<%# Bind("Stock_Price") %>' />
                                        </div>
                                        <div class="clear"></div>
                                    </div>
                                </ItemTemplate>
                            </asp:FormView>
                            <asp:SqlDataSource ID="Stock_PriceSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT        ROUND(SUM(ISNULL(StockFabricQuantity, 0) * ISNULL(CurrentBuyingUnitPrice, 0)), 2) AS Stock_Price
FROM            Fabrics
WHERE        (InstitutionID = @InstitutionID)">
                                <SelectParameters>
                                    <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                                </SelectParameters>
                            </asp:SqlDataSource>

                            <div class="row">
                                <div class="A_Title">Buying Price</div>
                                <div class="A_value">
                                    <asp:Label ID="Total_BuyingLabel" runat="server" Text='<%# Bind("Total_Buying") %>' />
                                </div>
                                <div class="clear"></div>
                            </div>
                            <div class="row">
                                <div class="A_Title">Selling Price</div>
                                <div class="A_value">
                                    <asp:Label ID="Total_SellingLabel" runat="server" Text='<%# Bind("Total_Selling") %>' />
                                </div>
                                <div class="clear"></div>
                            </div>
                            <div class="row">
                                <div class="A_Title">Discount</div>
                                <div class="A_value">
                                    <asp:Label ID="Total_DiscountLabel" runat="server" Text='<%# Bind("Total_Discount") %>' />
                                </div>
                                <div class="clear"></div>
                            </div>
                            <div class="row">
                                <div class="A_Title">Paid Amount</div>
                                <div class="A_value">
                                    <asp:Label ID="Total_PaidLabel" runat="server" Text='<%# Bind("Total_Paid") %>' />
                                </div>
                                <div class="clear"></div>
                            </div>
                            <div class="row">
                                <div class="A_Title">Due Amount</div>
                                <div class="A_value">
                                    <asp:Label ID="Total_DueLabel" runat="server" Text='<%# Bind("Total_Due") %>' />
                                </div>
                                <div class="clear"></div>
                            </div>
                            <div class="row Total_Balance">
                                <div class="A_Title">Net Amount</div>
                                <div class="A_value">
                                    <asp:Label ID="NetLabel" runat="server" Text='<%# Bind("Net", "{0:0.##}") %>' />
                                </div>
                            </div>
                        </ItemTemplate>
                    </asp:FormView>
                </fieldset>
                <div style="clear: both;"></div>
            </div>

            <asp:FormView ID="Acc_FormView" runat="server" DataSourceID="Acc_SQ" Width="50%">
                <ItemTemplate>
                    <div class="Account-sec" style="border: 1px solid #000; padding: 5px; border-radius: 3px;">
                        <h2 style="text-align: center; margin: 5px 0">All Account Details</h2>
                        <div class="AcName">
                            <div class="A_value">
                                পূর্বের টাকা:
                           <asp:Label ID="Balance_BeforeLabel" runat="server" Text='<%# Eval("Balance_Before","{0:0.##}") %>' />
                            </div>
                            <div class="clear"></div>
                        </div>

                        <asp:DataList ID="InDetailsDataList" runat="server" DataSourceID="InDetailsSQL" Width="100%">
                            <ItemTemplate>
                                <div class="row">
                                    <div class="A_Title">
                                        <asp:Label ID="CategoryLabel" runat="server" Text='<%# Eval("Category") %>' />
                                    </div>
                                    <div class="A_value">
                                        <asp:Label ID="IN_AmountLabel" runat="server" Text='<%# Eval("IN_Amount") %>' />
                                    </div>
                                    <div class="clear"></div>
                                </div>
                            </ItemTemplate>
                        </asp:DataList>
                        <asp:SqlDataSource ID="InDetailsSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand=" Select A_A.Category, ISNULL(A_A.Add_AMOUNT,0) - ISNULL(S_A.Subtraction_AMOUNT,0)  AS IN_Amount From (SELECT   Category,SUM(Amount) AS Add_AMOUNT
FROM            Account_Log 
WHERE        (InstitutionID = @InstitutionID) AND (AccountID is not null) AND (In_Ex_type = 'In')and Add_Subtraction = 'Add' and
Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')
GROUP BY   Category) as A_A 
FULL OUTER JOIN
(SELECT       Category,  SUM(Amount) AS Subtraction_AMOUNT
FROM            Account_Log
WHERE        (InstitutionID = @InstitutionID) AND (AccountID  is not null) AND (In_Ex_type = 'In')and Add_Subtraction = 'Subtraction' and
Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')
GROUP BY Category) AS S_A ON A_A.Category = S_A.Category where ISNULL(A_A.Add_AMOUNT,0) - ISNULL(S_A.Subtraction_AMOUNT,0) &lt;&gt; 0">
                            <SelectParameters>
                                <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                                <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                                <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
                            </SelectParameters>
                        </asp:SqlDataSource>

                        <div class="row Total_Balance">
                            <div class="A_Title">Total In</div>
                            <div class="A_value">
                                <asp:Label ID="Total_InLabel" runat="server" Text='<%# Eval("Total_In") %>' />
                            </div>
                        </div>

                        <asp:DataList ID="Ex_DetailsDataList" runat="server" DataSourceID="Ex_DetailsSQL" Width="100%">
                            <ItemTemplate>
                                <div class="row">
                                    <div class="A_Title">
                                        <asp:Label ID="CategoryLabel0" runat="server" Text='<%# Eval("Category") %>' />
                                    </div>
                                    <div class="A_value">
                                        <asp:Label ID="EX_AmountLabel" runat="server" Text='<%# Eval("EX_Amount") %>' />
                                    </div>
                                    <div class="clear"></div>
                                </div>
                            </ItemTemplate>
                        </asp:DataList>
                        <asp:SqlDataSource ID="Ex_DetailsSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="Select S_A.Category,  ISNULL(S_A.Subtraction_AMOUNT,0)- ISNULL(A_A.Add_AMOUNT,0)  AS EX_Amount From (SELECT   Category,SUM(Amount) AS Add_AMOUNT
FROM            Account_Log 
WHERE        (InstitutionID = @InstitutionID) AND (AccountID  is not null) AND (In_Ex_type = 'Ex')and Add_Subtraction = 'Add' and
Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')
GROUP BY   Category) as A_A 
FULL OUTER JOIN
(SELECT       Category,  SUM(Amount) AS Subtraction_AMOUNT
FROM            Account_Log
WHERE        (InstitutionID = @InstitutionID) AND (AccountID  is not null) AND (In_Ex_type = 'Ex')and Add_Subtraction = 'Subtraction' and
Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')
GROUP BY Category) AS S_A ON A_A.Category = S_A.Category where ISNULL(S_A.Subtraction_AMOUNT,0)- ISNULL(A_A.Add_AMOUNT,0) &lt;&gt; 0">
                            <SelectParameters>
                                <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                                <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                                <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
                            </SelectParameters>
                        </asp:SqlDataSource>

                        <div class="row Total_Balance">
                            <div class="A_Title">Total Out</div>
                            <div class="A_value">
                                <asp:Label ID="Total_ExLabel" runat="server" Text='<%# Eval("Total_Ex") %>' />
                            </div>
                        </div>

                        <div class="row Balance_After" style="border: none;">
                            সর্বশেষ টাকা:
                        <asp:Label ID="BalanceAfterLabel" runat="server" Text='<%# Eval("Balance_After","{0:0.##}") %>' />
                        </div>
                    </div>
                </ItemTemplate>
            </asp:FormView>
            <asp:SqlDataSource ID="Acc_SQ" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT sum(AccountBalance) as AccountBalance, sum(Total_In) as Total_In,sum(Total_Ex) as Total_Ex, sum(Balance_After) as Balance_After, sum(Balance_Before) as Balance_Before  from (Select AccountID,AccountName, AccountBalance,ISNULL((SELECT SUM(Amount) FROM  Account_Log WHERE  (InstitutionID = @InstitutionID) AND (AccountID = Account.AccountID) AND (In_Ex_type = 'In')and Add_Subtraction = 'Add' and Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')),0) 
-
ISNULL((SELECT SUM(Amount) FROM Account_Log WHERE (InstitutionID = @InstitutionID) AND (AccountID = Account.AccountID) AND (In_Ex_type = 'In')and Add_Subtraction = 'Subtraction' and Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')),0) as Total_In,

ISNULL((SELECT SUM(Amount) FROM  Account_Log WHERE  (InstitutionID = @InstitutionID) AND (AccountID = Account.AccountID) AND (In_Ex_type = 'Ex')and Add_Subtraction = 'Subtraction' and Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')),0) 
-
ISNULL((SELECT SUM(Amount) FROM Account_Log WHERE (InstitutionID = @InstitutionID) AND (AccountID = Account.AccountID) AND (In_Ex_type = 'Ex')and Add_Subtraction = 'Add' and Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')),0) as Total_Ex,

(SELECT top(1) Balance_Before FROM Account_Log WHERE (InstitutionID = @InstitutionID) and (AccountID = Account.AccountID) and  
Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')
ORDER BY Insert_Date, Insert_Time) AS Balance_Before,

(SELECT top(1) Balance_After FROM Account_Log WHERE (InstitutionID = @InstitutionID) and (AccountID = Account.AccountID) and  
Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')
ORDER BY Insert_Date DESC, Insert_Time DESC) as Balance_After
FROM Account WHERE(InstitutionID = @InstitutionID)) as All_Account where ([Total_Ex] &lt;&gt; 0 or [Total_In] &lt;&gt; 0)">
                <SelectParameters>
                    <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                    <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                    <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
                </SelectParameters>
            </asp:SqlDataSource>
        </div>
    </div>

    <br />
    <button type="button" class="print" onclick="window.print();"></button>

    <script src="../../JS/jq_Profile/jquery-ui-1.8.23.custom.min.js"></script>
    <script src="../../JS/DatePicker/jquery.datepick.js"></script>
    <script type="text/javascript">
        $(function () {
            var TailorGT = 0;
            $("[id*=TailoringAmtLabel]").each(function () { TailorGT = TailorGT + parseFloat($(this).text()) });
            $("#TailorGT").text("Total: " + TailorGT + " Tk");

            var ExtraInGT = 0;
            $("[id*=ExtraAmtLabel]").each(function () { ExtraInGT = ExtraInGT + parseFloat($(this).text()) });
            $("#ExtraInGT").text("Total: " + ExtraInGT + " Tk");

            var ExpenseGT = 0;
            $("[id*=ExpenseAmtLabel]").each(function () { ExpenseGT = ExpenseGT + parseFloat($(this).text()) });
            $("#ExpenseGT").text("Total: " + ExpenseGT + " Tk");

            var SellingGT = 0;
            $("[id*=SellingAmtLabel]").each(function () { SellingGT = SellingGT + parseFloat($(this).text()) });
            $("#SellingGT").text("Total: " + SellingGT + " Tk");

            var BuyingGT = 0;
            $("[id*=BuyingAmtLabel]").each(function () { BuyingGT = BuyingGT + parseFloat($(this).text()) });
            $("#BuyingGT").text("Total: " + BuyingGT + " Tk");
        });



        $(function () {
            $('.Datetime').datepick();
            $('#main').tabs();

            //get date in label
            var from = $("[id*=FromDateTextBox]").val();
            var To = $("[id*=ToDateTextBox]").val();

            var tt;
            var Brases1 = "";
            var Brases2 = "";
            var A = "";
            var B = "";
            var TODate = "";

            if (To == "" || from == "" || To == "" && from == "") {
                tt = "";
                A = "";
                B = "";
            }
            else {
                tt = " থেকে ";
                Brases1 = "(";
                Brases2 = ")";
            }

            if (To == "" && from == "") { Brases1 = ""; }

            if (To == from) {
                TODate = "";
                tt = "";
                var Brases1 = "";
                var Brases2 = "";
            }
            else { TODate = To; }

            if (from == "" && To != "") {
                B = " এর পূর্বের ";
            }

            if (To == "" && from != "") {
                A = " এর পরের ";
            }

            if (from != "" && To != "") {
                A = "";
                B = "";
            }

            $(".Date").text(Brases1 + from + tt + TODate + B + A + Brases2)
        });
    </script>
</asp:Content>
