<%@ Page Title="Account Repport" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Accounts_Report.aspx.cs" Inherits="TailorBD.AccessAdmin.Accounts.Accounts_Report" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
    <link href="../../JS/DatePicker/jquery.datepick.css" rel="stylesheet" />
    <link href="../../JS/jq_Profile/css/Profile_jquery-ui-1.8.23.custom.css" rel="stylesheet" />
    <link href="CSS/Accounts_Summery.css" rel="stylesheet" />
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <h3>Account Repport (By Default Show Today's Report)</h3>

    <asp:TextBox ID="FromDateTextBox" runat="server" CssClass="Datetime"></asp:TextBox>
    <asp:TextBox ID="ToDateTextBox" runat="server" CssClass="Datetime"></asp:TextBox>
    <asp:Button ID="FindButton" runat="server" Text="Find" CssClass="ContinueButton" />
    <div id="main">
        <ul>
            <li><a href="#Selected">Selected Account</a></li>
            <li><a href="#All">All Account</a></li>
        </ul>

        <div id="Selected">
            <div class="Print_Header">"<label id="AccName"></label>" " Details</div>
            <div class="NoPrint">
                <asp:DropDownList ID="AccountDropDownList" runat="server" CssClass="dropdown" DataSourceID="Account_SQL" DataTextField="AccountName" DataValueField="AccountID" OnDataBound="AccountDropDownList_DataBound" AutoPostBack="True">
                </asp:DropDownList>
                <asp:SqlDataSource ID="Account_SQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT AccountID, AccountName, InstitutionID FROM Account WHERE (InstitutionID = @InstitutionID)">
                    <SelectParameters>
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                    </SelectParameters>
                </asp:SqlDataSource>
            </div>
            <asp:FormView ID="AccountFV" runat="server" DataSourceID="Account_Report_SQL" Width="100%">
                <ItemTemplate>
                    <div class="Ac_Details">
                        <div class="Title2">
                            <label class="Date"></label>
                            <asp:Label ID="AccountNameLabel" runat="server" Text='<%# Eval("AccountName") %>' />
                            (<asp:Label ID="AccountBalanceLabel" runat="server" Text='<%# Eval("AccountBalance","{0:n}") %>' />
                            Tk)
                        </div>

                        <div class="Summery">
                            Account Start:
         <asp:Label ID="Start_AccountLabel" runat="server" Text='<%# Eval("Start_Account","{0:n}") %>' />
                            Tk
            <br />
                            Account Close:
         <asp:Label ID="Close_AccountLabel" runat="server" Text='<%# Eval("Close_Account","{0:n}") %>' />
                            Tk
                        </div>

                        <div class="Summery">
                            Cash In:
         <asp:Label ID="AddLabel" runat="server" Text='<%# Eval("Add","{0:n}") %>' />
                            Tk
         <br />
                            Cash Out:
         <asp:Label ID="SubtractionLabel" runat="server" Text='<%# Eval("Subtraction","{0:n}") %>' />
                            Tk
                        </div>
                        <div class="Summery">
                            Net Amount:
               <asp:Label ID="NetLabel" runat="server" Text='<%# Eval("Net","{0:n}") %>' />
                            Tk
                        </div>
                    </div>
                </ItemTemplate>
            </asp:FormView>
            <asp:SqlDataSource ID="Account_Report_SQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT AccountID, AccountName, AccountBalance, ISNULL((SELECT Balance_Before AS Start_Account FROM Account_Log WHERE (AccountID = Account.AccountID) AND (InstitutionID = @InstitutionID) AND (Insert_Date = ISNULL(@From_Date, (SELECT MIN(Insert_Date) AS a FROM Account_Log AS Account_Log_11 WHERE (AccountID = Account.AccountID) AND (InstitutionID = @InstitutionID)))) AND (Insert_Time = (SELECT MIN(Insert_Time) AS a FROM Account_Log AS Account_Log_10 WHERE (AccountID = Account.AccountID) AND (InstitutionID = @InstitutionID) AND (Insert_Date = ISNULL(@From_Date, (SELECT MIN(Insert_Date) AS a FROM Account_Log AS Account_Log_9 WHERE (AccountID = Account.AccountID) AND (InstitutionID = @InstitutionID))))))), 0) AS Start_Account, ISNULL((SELECT Balance_After AS Close_Account FROM Account_Log AS Account_Log_8 WHERE (AccountID = Account.AccountID) AND (InstitutionID = @InstitutionID) AND (Insert_Date = ISNULL(@To_Date, (SELECT MAX(Insert_Date) AS a FROM Account_Log AS Account_Log_7 WHERE (AccountID = Account.AccountID) AND (InstitutionID = @InstitutionID)))) AND (Insert_Time = (SELECT MAX(Insert_Time) AS a FROM Account_Log AS Account_Log_6 WHERE (AccountID = Account.AccountID) AND (InstitutionID = @InstitutionID) AND (Insert_Date = ISNULL(@To_Date, (SELECT MAX(Insert_Date) AS a FROM Account_Log AS Account_Log_5 WHERE (AccountID = Account.AccountID) AND (InstitutionID = @InstitutionID))))))), 0) AS Close_Account, ISNULL((SELECT SUM(Amount) AS Expr1 FROM Account_Log AS Account_Log_4 WHERE (AccountID = Account.AccountID) AND (InstitutionID = @InstitutionID) AND (Add_Subtraction = 'Add') AND (Insert_Date BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000'))), 0) AS [Add], ISNULL((SELECT SUM(Amount) AS Expr1 FROM Account_Log AS Account_Log_3 WHERE (AccountID = Account.AccountID) AND (InstitutionID = @InstitutionID) AND (Add_Subtraction = 'Subtraction') AND (Insert_Date BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000'))), 0) AS Subtraction, ISNULL((SELECT SUM(Amount) AS Expr1 FROM Account_Log AS Account_Log_2 WHERE (AccountID = Account.AccountID) AND (InstitutionID = @InstitutionID) AND (Add_Subtraction = 'Add') AND (Insert_Date BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000'))), 0) - ISNULL((SELECT SUM(Amount) AS Expr1 FROM Account_Log AS Account_Log_1 WHERE (AccountID = Account.AccountID) AND (InstitutionID = @InstitutionID) AND (Add_Subtraction = 'Subtraction') AND (Insert_Date BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000'))), 0) AS Net FROM Account WHERE (InstitutionID = @InstitutionID) AND (AccountID = @AccountID)">
                <SelectParameters>
                    <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                    <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                    <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
                    <asp:ControlParameter ControlID="AccountDropDownList" Name="AccountID" PropertyName="SelectedValue" />
                </SelectParameters>
            </asp:SqlDataSource>

            <div class="In Title">
                <asp:FormView ID="Total_IN_FormView" runat="server" DataSourceID="Total_Cash_IN_SQL">
                    <ItemTemplate>
                        <label class="Date"></label>
                        Total Cash In: 
               <asp:Label ID="Total_INLabel" runat="server" Text='<%# Bind("Total_IN") %>' />
                        /-
                    </ItemTemplate>
                </asp:FormView>
                <asp:SqlDataSource ID="Total_Cash_IN_SQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT ISNULL(SUM(Amount),0) AS Total_IN FROM Account_Log WHERE (ISNULL(AccountID,0) =@AccountID) AND (InstitutionID = @InstitutionID) AND Add_Subtraction ='Add' 
 AND Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')">
                    <SelectParameters>
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                        <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                        <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
                        <asp:ControlParameter ControlID="AccountDropDownList" Name="AccountID" PropertyName="SelectedValue" />
                    </SelectParameters>
                </asp:SqlDataSource>
            </div>
            <asp:DataList ID="IN_CategoryDataList" runat="server" DataSourceID="IN_CategorySQL" Width="100%" RepeatDirection="Horizontal" RepeatLayout="Flow">
                <ItemTemplate>
                    <div class="A_Name Sub_In">
                        <asp:Label ID="CategoryLabel" runat="server" Text='<%# Eval("Category") %>' />
                        (<asp:Label ID="TotalLabel" runat="server" Text='<%# Eval("Total","{0:n}") %>' />
                        Tk)
                    </div>
                    <asp:GridView ID="InLogGridView" runat="server" AutoGenerateColumns="False" DataSourceID="In_SituationSQL" Width="100%" CssClass="mGrid">
                        <Columns>
                            <asp:BoundField DataField="Log_SN" HeaderText="SN" SortExpression="Log_SN" />
                            <asp:BoundField DataField="Situation" HeaderText="Situation" SortExpression="Situation" />
                            <asp:BoundField DataField="Amount" HeaderText="Amount" SortExpression="Amount" />
                            <asp:BoundField DataField="Details" HeaderText="Details" SortExpression="Details" />
                            <asp:BoundField DataField="UserName" HeaderText="User Name" SortExpression="UserName">
                                <HeaderStyle Width="85px" />
                            </asp:BoundField>
                            <asp:BoundField DataField="Insert_Date" HeaderText="Date" SortExpression="Insert_Date" DataFormatString="{0:d MMM yyyy}" />
                            <asp:BoundField DataField="Insert_Time" HeaderText="Time" SortExpression="Insert_Time" />
                        </Columns>
                    </asp:GridView>
                    <asp:SqlDataSource ID="In_SituationSQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Account_Log.Log_SN, Account_Log.Situation, Account_Log.Amount, Account_Log.Details, Registration.UserName, Account_Log.Insert_Date, CONVERT(varchar(15),Account_Log.Insert_Time,100) AS Insert_Time FROM Account_Log LEFT OUTER JOIN
                   Registration ON Account_Log.RegistrationID = Registration.RegistrationID WHERE (ISNULL(Account_Log.AccountID,0) =@AccountID) AND (Account_Log.InstitutionID = @InstitutionID) AND (Account_Log.Category = @Category) AND (Account_Log.Add_Subtraction = N'Add') AND (Account_Log.Situation NOT IN (N'Deleted', N'Updated')) AND 
                   (Account_Log.Insert_Date BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000'))">
                        <SelectParameters>
                            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                            <asp:ControlParameter ControlID="CategoryLabel" Name="Category" PropertyName="Text" />
                            <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                            <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
                            <asp:ControlParameter ControlID="AccountDropDownList" Name="AccountID" PropertyName="SelectedValue" />
                        </SelectParameters>
                    </asp:SqlDataSource>
                </ItemTemplate>
            </asp:DataList>
            <asp:SqlDataSource ID="IN_CategorySQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT  Category, ISNULL(SUM(Amount),0) AS Total FROM Account_Log 
WHERE (ISNULL(AccountID,0) =@AccountID) AND (InstitutionID = @InstitutionID) AND (Add_Subtraction = N'Add') AND (In_Ex_type = N'In')  AND (Insert_Date BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000')) 
GROUP BY Category ORDER BY Category">
                <SelectParameters>
                    <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                    <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                    <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
                    <asp:ControlParameter ControlID="AccountDropDownList" Name="AccountID" PropertyName="SelectedValue" />
                </SelectParameters>
            </asp:SqlDataSource>

            <asp:FormView ID="IN_Deleted_FormView" runat="server" DataSourceID="In_Deleted_Amount_SQL">
                <ItemTemplate>
                    <div class="Adjsmnt In_Adjs">
                        Cash In By Adjustment :
               <asp:Label ID="Amount_In_By_deleteLabel" runat="server" Text='<%# Bind("Amount_In_By_delete") %>' />
                        Tk
                    </div>
                </ItemTemplate>
            </asp:FormView>
            <asp:SqlDataSource ID="In_Deleted_Amount_SQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT ISNULL(SUM(Amount),0) AS Amount_In_By_delete FROM Account_Log
WHERE (ISNULL(AccountID,0) =@AccountID) AND (InstitutionID = @InstitutionID) AND (Add_Subtraction = N'Add') AND (In_Ex_type = N'Ex') AND (Insert_Date BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000'))">
                <SelectParameters>
                    <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                    <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                    <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
                    <asp:ControlParameter ControlID="AccountDropDownList" Name="AccountID" PropertyName="SelectedValue" />
                </SelectParameters>
            </asp:SqlDataSource>

            <asp:DataList ID="IN_DeletedDataList" runat="server" DataSourceID="IN_Deleted_CategorySQL" Width="100%" RepeatDirection="Horizontal" RepeatLayout="Flow">
                <ItemTemplate>
                    <div class="A_Name Sub_In">
                        <asp:Label ID="CategoryLabel" runat="server" Text='<%# Eval("Category") %>' />
                        (<asp:Label ID="TotalLabel" runat="server" Text='<%# Eval("Total","{0:n}") %>' />
                        Tk)
                    </div>

                    <asp:GridView ID="InLogGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataSourceID="IN_Deleted_SituationSQL" Width="100%">
                        <Columns>
                            <asp:BoundField DataField="Log_SN" HeaderText="SN" SortExpression="Log_SN" />
                            <asp:BoundField DataField="Situation" HeaderText="Situation" SortExpression="Situation" />
                            <asp:BoundField DataField="Amount" HeaderText="Amount" SortExpression="Amount" />
                            <asp:BoundField DataField="Details" HeaderText="Details" SortExpression="Details" />
                            <asp:BoundField DataField="UserName" HeaderText="User Name" SortExpression="UserName">
                                <HeaderStyle Width="85px" />
                            </asp:BoundField>
                            <asp:BoundField DataField="Insert_Date" DataFormatString="{0:d MMM yyyy}" HeaderText="Date" SortExpression="Insert_Date" />
                            <asp:BoundField DataField="Insert_Time" HeaderText="Time" SortExpression="Insert_Time" />
                        </Columns>
                    </asp:GridView>
                    <asp:SqlDataSource ID="IN_Deleted_SituationSQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Account_Log.Log_SN, Account_Log.Situation, Account_Log.Amount, Account_Log.Details, Registration.UserName, Account_Log.Insert_Date, CONVERT(varchar(15),Account_Log.Insert_Time,100) AS Insert_Time FROM Account_Log  LEFT OUTER JOIN
Registration ON Account_Log.RegistrationID = Registration.RegistrationID WHERE (ISNULL(Account_Log.AccountID,0) =@AccountID) AND  (Account_Log.InstitutionID = @InstitutionID) AND (Account_Log.Category = @Category) AND (Account_Log.Add_Subtraction = N'Add')
AND (Account_Log.In_Ex_type =N'Ex') AND (Account_Log.Insert_Date BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000'))">
                        <SelectParameters>
                            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                            <asp:ControlParameter ControlID="CategoryLabel" Name="Category" PropertyName="Text" />
                            <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                            <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
                            <asp:ControlParameter ControlID="AccountDropDownList" Name="AccountID" PropertyName="SelectedValue" />
                        </SelectParameters>
                    </asp:SqlDataSource>
                </ItemTemplate>
            </asp:DataList>
            <asp:SqlDataSource ID="IN_Deleted_CategorySQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT  Category, ISNULL(SUM(Amount),0) AS Total FROM Account_Log WHERE (ISNULL(AccountID,0) =@AccountID) AND (InstitutionID = @InstitutionID) AND (Add_Subtraction = N'Add')  AND (In_Ex_type = N'Ex')  AND (Insert_Date BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000')) 
GROUP BY Category ORDER BY Category">
                <SelectParameters>
                    <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                    <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                    <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
                    <asp:ControlParameter ControlID="AccountDropDownList" Name="AccountID" PropertyName="SelectedValue" />
                </SelectParameters>
            </asp:SqlDataSource>

            <div class="Out Title">
                <asp:FormView ID="Cash_Out_FormView" runat="server" DataSourceID="Total_Cash_Out_SQL">
                    <ItemTemplate>
                        <label class="Date"></label>
                        Total Cash Out: 
               <asp:Label ID="Total_OutLabel" runat="server" Text='<%# Bind("Total_Out") %>' />
                        /-
                    </ItemTemplate>
                </asp:FormView>
                <asp:SqlDataSource ID="Total_Cash_Out_SQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT ISNULL(SUM(Amount),0) AS Total_Out FROM Account_Log WHERE (ISNULL(AccountID,0) =@AccountID) AND (InstitutionID = @InstitutionID) AND Add_Subtraction ='Subtraction' AND Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')">
                    <SelectParameters>
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                        <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                        <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
                        <asp:ControlParameter ControlID="AccountDropDownList" Name="AccountID" PropertyName="SelectedValue" />
                    </SelectParameters>
                </asp:SqlDataSource>
            </div>
            <asp:DataList ID="OCDataList" runat="server" DataSourceID="Out_CategorySQL" Width="100%" RepeatDirection="Horizontal" RepeatLayout="Flow">
                <ItemTemplate>
                    <div class="A_Name Sub_Out ">
                        <asp:Label ID="CategoryLabel" runat="server" Text='<%# Eval("Category") %>' />
                        (<asp:Label ID="TotalLabel" runat="server" Text='<%# Eval("Total","{0:n}") %>' />
                        Tk)
                    </div>
                    <asp:GridView ID="InLogGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid Out_Grid" DataSourceID="Out_Situation_SQL" Width="100%">
                        <Columns>
                            <asp:BoundField DataField="Log_SN" HeaderText="SN" SortExpression="Log_SN" />
                            <asp:BoundField DataField="Situation" HeaderText="Situation" SortExpression="Situation" />
                            <asp:BoundField DataField="Amount" HeaderText="Amount" SortExpression="Amount" />
                            <asp:BoundField DataField="Details" HeaderText="Details" SortExpression="Details" />
                            <asp:BoundField DataField="UserName" HeaderText="User Name" SortExpression="UserName">
                                <HeaderStyle Width="85px" />
                            </asp:BoundField>
                            <asp:BoundField DataField="Insert_Date" DataFormatString="{0:d MMM yyyy}" HeaderText="Date" SortExpression="Insert_Date" />
                            <asp:BoundField DataField="Insert_Time" HeaderText="Time" SortExpression="Insert_Time" />
                        </Columns>
                    </asp:GridView>
                    <asp:SqlDataSource ID="Out_Situation_SQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Account_Log.Log_SN, Account_Log.Situation, Account_Log.Amount, Account_Log.Details, Registration.UserName, Account_Log.Insert_Date, CONVERT(varchar(15),Account_Log.Insert_Time,100) AS Insert_Time FROM Account_Log LEFT OUTER JOIN
Registration ON Account_Log.RegistrationID = Registration.RegistrationID WHERE (ISNULL(Account_Log.AccountID,0) =@AccountID) AND  (Account_Log.InstitutionID = @InstitutionID) AND (Account_Log.Category = @Category) AND (Account_Log.Add_Subtraction = N'Subtraction')
AND (Account_Log.Situation NOT IN (N'Deleted', N'Updated')) AND (Account_Log.Insert_Date BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000'))">
                        <SelectParameters>
                            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                            <asp:ControlParameter ControlID="CategoryLabel" Name="Category" PropertyName="Text" />
                            <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                            <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
                            <asp:ControlParameter ControlID="AccountDropDownList" Name="AccountID" PropertyName="SelectedValue" />
                        </SelectParameters>
                    </asp:SqlDataSource>
                </ItemTemplate>
            </asp:DataList>
            <asp:SqlDataSource ID="Out_CategorySQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT  Category, SUM(Amount) AS Total FROM Account_Log WHERE (ISNULL(AccountID,0)=@AccountID) AND (InstitutionID = @InstitutionID) AND (Add_Subtraction = N'Subtraction') AND (In_Ex_type = N'Ex')  AND (Insert_Date BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000')) 
GROUP BY Category ORDER BY Category">
                <SelectParameters>
                    <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                    <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                    <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
                    <asp:ControlParameter ControlID="AccountDropDownList" Name="AccountID" PropertyName="SelectedValue" />
                </SelectParameters>
            </asp:SqlDataSource>

            <asp:FormView ID="DAFormView" runat="server" DataSourceID="Out_Deleted_Amount_SQL">
                <ItemTemplate>
                    <div class="Adjsmnt Out_Adjs">
                        Cash Out By Adjustment:
               <asp:Label ID="Amount_Out_By_deleteLabel" runat="server" Text='<%# Bind("Amount_Out_By_delete","{0:n}") %>' />
                        Tk
                    </div>
                </ItemTemplate>
            </asp:FormView>
            <asp:SqlDataSource ID="Out_Deleted_Amount_SQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT SUM(Amount) AS Amount_Out_By_delete FROM Account_Log WHERE (ISNULL(AccountID,0) =@AccountID) AND (InstitutionID = @InstitutionID) AND (Add_Subtraction = N'Subtraction') AND (In_Ex_type =N'In') AND (Insert_Date BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000'))">
                <SelectParameters>
                    <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                    <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                    <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
                    <asp:ControlParameter ControlID="AccountDropDownList" Name="AccountID" PropertyName="SelectedValue" />
                </SelectParameters>
            </asp:SqlDataSource>

            <asp:DataList ID="DOCDataList" runat="server" DataSourceID="Out_Deleted_CategorySQL" Width="100%" RepeatDirection="Horizontal" RepeatLayout="Flow">
                <ItemTemplate>
                    <div class="A_Name Sub_Out ">
                        <asp:Label ID="CategoryLabel" runat="server" Text='<%# Eval("Category") %>' />
                        (<asp:Label ID="TotalLabel" runat="server" Text='<%# Eval("Total","{0:n}") %>' />)
                    </div>
                    <asp:GridView ID="InLogGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid Out_Grid" DataSourceID="Out_SituationSQL" Width="100%">
                        <Columns>
                            <asp:BoundField DataField="Log_SN" HeaderText="SN" SortExpression="Log_SN" />
                            <asp:BoundField DataField="Situation" HeaderText="Situation" SortExpression="Situation" />
                            <asp:BoundField DataField="Amount" HeaderText="Amount" SortExpression="Amount" />
                            <asp:BoundField DataField="Details" HeaderText="Details" SortExpression="Details" />
                            <asp:BoundField DataField="UserName" HeaderText="User Name" SortExpression="UserName">
                                <HeaderStyle Width="85px" />
                            </asp:BoundField>
                            <asp:BoundField DataField="Insert_Date" HeaderText="Date" SortExpression="Insert_Date" DataFormatString="{0:d MMM yyyy}" />
                            <asp:BoundField DataField="Insert_Time" HeaderText="Time" ReadOnly="True" SortExpression="Insert_Time" />
                        </Columns>
                    </asp:GridView>
                    <asp:SqlDataSource ID="Out_SituationSQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Account_Log.Log_SN, Account_Log.Situation, Account_Log.Amount, Account_Log.Details, Registration.UserName, Account_Log.Insert_Date, CONVERT(varchar(15),Account_Log.Insert_Time,100) AS Insert_Time FROM Account_Log LEFT OUTER JOIN
Registration ON Account_Log.RegistrationID = Registration.RegistrationID WHERE  (ISNULL(Account_Log.AccountID,0) =@AccountID) AND (Account_Log.InstitutionID = @InstitutionID) AND (Account_Log.Category = @Category) AND (Account_Log.Add_Subtraction = N'Subtraction')
AND (Account_Log.In_Ex_type =N'In')  AND (Account_Log.Insert_Date BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000'))">
                        <SelectParameters>
                            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                            <asp:ControlParameter ControlID="CategoryLabel" Name="Category" PropertyName="Text" />
                            <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                            <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
                            <asp:ControlParameter ControlID="AccountDropDownList" Name="AccountID" PropertyName="SelectedValue" />
                        </SelectParameters>
                    </asp:SqlDataSource>
                </ItemTemplate>
            </asp:DataList>
            <asp:SqlDataSource ID="Out_Deleted_CategorySQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT  Category, ISNULL(SUM(Amount),0) AS Total FROM Account_Log WHERE (ISNULL(AccountID,0) =@AccountID) AND (InstitutionID = @InstitutionID) AND (Add_Subtraction = N'Subtraction')  AND (In_Ex_type = N'In')  AND (Insert_Date BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000')) 
GROUP BY Category order by Category">
                <SelectParameters>
                    <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                    <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                    <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
                    <asp:ControlParameter ControlID="AccountDropDownList" Name="AccountID" PropertyName="SelectedValue" />
                </SelectParameters>
            </asp:SqlDataSource>
        </div>

        <div id="All">
            <div class="Print_Header">All Account Details</div>
            <asp:FormView ID="WithoutAccountFV" runat="server" DataSourceID="WithOut_Accout_InOutSQL" Width="100%">
                <ItemTemplate>
                    <div class="Title2">
                        <label class="Date"></label>
                        Without Account
                    </div>
                    <div class="Summery">
                        Cash In:
         <asp:Label ID="AddLabel" runat="server" Text='<%# Bind("Add","{0:n}") %>' />
                        Tk
                    </div>
                    <div class="Summery">
                        Cash Out:
         <asp:Label ID="SubtractionLabel" runat="server" Text='<%# Bind("Subtraction","{0:n}") %>' />
                        Tk
                    </div>
                    <div class="Summery">
                        Net Amount:
         <asp:Label ID="NetLabel" runat="server" Text='<%# Bind("Net","{0:n}") %>' />
                        Tk
                    </div>
                </ItemTemplate>
            </asp:FormView>
            <asp:SqlDataSource ID="WithOut_Accout_InOutSQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT 
ISNULL((SELECT SUM(Amount) FROM Account_Log WHERE (AccountID IS NULL) AND (InstitutionID = @InstitutionID) AND Add_Subtraction ='Add' 
AND Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')),0) AS [Add],
ISNULL((SELECT SUM(Amount) FROM Account_Log WHERE (AccountID IS NULL) AND (InstitutionID = @InstitutionID) AND Add_Subtraction ='Subtraction' 
AND Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')),0) AS Subtraction,
(ISNULL((SELECT SUM(Amount) FROM Account_Log WHERE (AccountID IS NULL) AND  (InstitutionID = @InstitutionID) AND Add_Subtraction ='Add' 
AND Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')),0) -
ISNULL((SELECT SUM(Amount) FROM Account_Log WHERE (AccountID IS NULL) AND (InstitutionID = @InstitutionID) AND Add_Subtraction ='Subtraction' 
AND Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')),0)) AS Net">
                <SelectParameters>
                    <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                    <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                    <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
                </SelectParameters>
            </asp:SqlDataSource>

            <asp:FormView ID="AccountFormView" runat="server" DataSourceID="With_Accout_Add_SubtractionSQL" Width="100%">
                <ItemTemplate>
                    <div class="Title2">
                        <label class="Date"></label>
                        With All Account
                    </div>
                    <div class="Summery">
                        Cash In:
         <asp:Label ID="AddLabel" runat="server" Text='<%# Bind("Add","{0:n}") %>' />
                        Tk
                    </div>
                    <div class="Summery">
                        Cash Out:
         <asp:Label ID="SubtractionLabel" runat="server" Text='<%# Bind("Subtraction","{0:n}") %>' />
                        Tk
                    </div>
                    <div class="Summery">
                        Net Amount:
         <asp:Label ID="NetLabel" runat="server" Text='<%# Bind("Net","{0:n}") %>' />
                        Tk
                    </div>
                </ItemTemplate>
            </asp:FormView>
            <asp:SqlDataSource ID="With_Accout_Add_SubtractionSQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT 
ISNULL((SELECT SUM(Amount) FROM Account_Log WHERE (AccountID IS NOT NULL) AND (InstitutionID = @InstitutionID) AND Add_Subtraction ='Add' 
AND Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')),0) AS [Add],
ISNULL((SELECT SUM(Amount) FROM Account_Log WHERE (AccountID IS NOT NULL) AND (InstitutionID = @InstitutionID) AND Add_Subtraction ='Subtraction' 
AND Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')),0) AS Subtraction,
(ISNULL((SELECT SUM(Amount) FROM Account_Log WHERE (AccountID IS NOT NULL) AND  (InstitutionID = @InstitutionID) AND Add_Subtraction ='Add' 
AND Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')),0) -
ISNULL((SELECT SUM(Amount) FROM Account_Log WHERE (AccountID IS NOT NULL) AND (InstitutionID = @InstitutionID) AND Add_Subtraction ='Subtraction' 
AND Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')),0)) AS Net">
                <SelectParameters>
                    <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                    <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                    <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
                </SelectParameters>
            </asp:SqlDataSource>

            <asp:DataList ID="AccountDataList" runat="server" DataKeyField="AccountID" DataSourceID="All_Account_Report_SQL" RepeatColumns="3" RepeatDirection="Horizontal">
                <ItemTemplate>
                    <div class="Account">
                        <div class="A_Name2">
                            <asp:Label ID="AccountNameLabel" runat="server" Text='<%# Eval("AccountName") %>' />
                        </div>

                        Account Start:
         <asp:Label ID="Start_AccountLabel" runat="server" Text='<%# Eval("Start_Account","{0:n}") %>' />
                        Tk
            <br />
                        Account Close:
         <asp:Label ID="Close_AccountLabel" runat="server" Text='<%# Eval("Close_Account","{0:n}") %>' />
                        Tk
             <br />
                        Cash In:
         <asp:Label ID="AddLabel" runat="server" Text='<%# Eval("Add","{0:n}") %>' />
                        Tk
           <br />
                        Cash Out:
         <asp:Label ID="SubtractionLabel" runat="server" Text='<%# Eval("Subtraction","{0:n}") %>' />
                        Tk
            <br />
                        <div class="Amount">
                            Net Amount:
         <asp:Label ID="NetLabel" runat="server" Text='<%# Eval("Net","{0:n}") %>' />
                            Tk
                        </div>
                    </div>
                </ItemTemplate>
            </asp:DataList>
            <asp:SqlDataSource ID="All_Account_Report_SQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * from (SELECT  AccountID, AccountName, AccountBalance,
ISNULL((SELECT Balance_Before AS Start_Account FROM Account_Log WHERE (AccountID = Account.AccountID) AND (InstitutionID = @InstitutionID) 
AND Insert_Date = ISNULL(@From_Date, (SELECT MIN(Insert_Date) as a  FROM Account_Log WHERE (AccountID = Account.AccountID) AND (InstitutionID = @InstitutionID))) 
AND Insert_Time =(SELECT MIN(Insert_Time) as a  FROM Account_Log WHERE (AccountID = Account.AccountID) AND (InstitutionID = @InstitutionID) and Insert_Date = ISNULL(@From_Date, (SELECT MIN(Insert_Date) as a  FROM Account_Log WHERE (AccountID = Account.AccountID) AND (InstitutionID = @InstitutionID))))),0) as Start_Account,
ISNULL((SELECT Balance_After AS Close_Account FROM Account_Log WHERE (AccountID = Account.AccountID) AND (InstitutionID = @InstitutionID)
AND Insert_Date = ISNULL(@To_Date, (SELECT Max(Insert_Date) as a  FROM Account_Log WHERE (AccountID = Account.AccountID) AND (InstitutionID = @InstitutionID))) 
AND Insert_Time =(SELECT Max(Insert_Time) as a  FROM Account_Log WHERE (AccountID = Account.AccountID) AND (InstitutionID = @InstitutionID) and Insert_Date = ISNULL(@To_Date, (SELECT Max(Insert_Date) as a  FROM Account_Log WHERE (AccountID = Account.AccountID) AND (InstitutionID = @InstitutionID))))),0) as Close_Account,
ISNULL((SELECT SUM(Amount) FROM Account_Log WHERE (AccountID = Account.AccountID) AND (InstitutionID = @InstitutionID) AND Add_Subtraction ='Add' 
AND Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')),0) AS [Add],
ISNULL((SELECT SUM(Amount) FROM Account_Log WHERE (AccountID = Account.AccountID) AND (InstitutionID = @InstitutionID) AND Add_Subtraction ='Subtraction' 
AND Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')),0) AS Subtraction,
(ISNULL((SELECT SUM(Amount) FROM Account_Log WHERE (AccountID = Account.AccountID) AND (InstitutionID = @InstitutionID) AND Add_Subtraction ='Add' 
AND Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')),0)-
ISNULL((SELECT SUM(Amount) FROM Account_Log WHERE (AccountID = Account.AccountID) AND (InstitutionID = @InstitutionID) AND Add_Subtraction ='Subtraction' 
AND Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')),0))AS Net
FROM Account WHERE(InstitutionID = @InstitutionID)) as All_Account where ([Add] &lt;&gt; 0 or Subtraction &lt;&gt; 0)">
                <SelectParameters>
                    <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                    <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                    <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
                </SelectParameters>
            </asp:SqlDataSource>
        </div>
    </div>

    <p>Provided by tailorbd.com © 2015-2016</p>

    <script src="../../JS/DatePicker/jquery.datepick.js"></script>
    <script src="../../JS/jq_Profile/jquery-ui-1.8.23.custom.min.js"></script>
    <script type="text/javascript">
        $(function () {
            $(".Datetime").datepick();
            $('#main').tabs();

            if ($('[id*=IN_DeletedDataList] tr').length) {
                $(".In_Adjs").show();
            }
            if ($('[id*=DOCDataList] tr').length) {
                $(".Out_Adjs").show();
            }

            $("#AccName").text($("[id*=AccountDropDownList] option:selected").text());

            //Set date in label
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
        function isNumberKey(a) { a = a.which ? a.which : event.keyCode; return 46 != a && 31 < a && (48 > a || 57 < a) ? !1 : !0 };
    </script>
</asp:Content>
