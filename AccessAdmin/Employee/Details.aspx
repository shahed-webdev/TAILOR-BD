<%@ Page Title="বিস্তারিত" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Details.aspx.cs" Inherits="TailorBD.AccessAdmin.Employee.Details" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.2/css/bootstrap.min.css" />
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-datepicker/1.3.0/css/datepicker.css" rel="stylesheet" type="text/css" />

    <style>
        .box { background-color: #ddd; text-align: center; padding: 15px 5px; margin-bottom: 15px; }
        .box h5 { margin: 0; }
        .box p { margin: 0; }
    </style>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <a href="Add_Employee.aspx"><< Back</a>

    <asp:FormView ID="DetailsFormView" runat="server" DataSourceID="DetailsSQL" Width="100%">
        <ItemTemplate>
            <h3>[<%# Eval("EID") %>]<%# Eval("Name") %><small><%# Eval("Phone") %></small><span class="badge badge-primary ml-2">ব্যালেন্স: <%# Eval("Balance","{0:N}") %> টাকা</span>
            </h3>
        </ItemTemplate>
    </asp:FormView>
    <asp:SqlDataSource ID="DetailsSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Name, Phone, Balance, EID FROM Employee WHERE (EmployeeID = @EmployeeID) AND (InstitutionID = @InstitutionID)">
        <SelectParameters>
            <asp:QueryStringParameter Name="EmployeeID" QueryStringField="EmployeeID" />
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
        </SelectParameters>
    </asp:SqlDataSource>

    <div class="mb-3">
        <button data-toggle="modal" data-target="#AddWork" type="button" class="btn btn-primary">পারিশ্রমিক যুক্ত করুন</button>
        <button data-toggle="modal" data-target="#Employee_Loan" type="button" class="btn btn-success">খরচ/ঋণ প্রদান</button>
        <button data-toggle="modal" data-target="#Employee_Return" type="button" class="btn btn-info">ঋণ ফেরত</button>
    </div>

    <div class="form-inline mb-3">
        <div class="form-group">
            <asp:TextBox ID="FromTextBox" placeholder="From date" CssClass="form-control datepicker" runat="server"></asp:TextBox>
        </div>
        <div class="form-group">
            <asp:TextBox ID="ToTextBox" placeholder="To date" CssClass="form-control datepicker mx-2" runat="server"></asp:TextBox>
        </div>
        <div class="form-group">
            <asp:Button ID="FindButton" runat="server" Text="Find" CssClass="btn btn-info" />
        </div>
    </div>

    <asp:FormView ID="Total_FormView" runat="server" DataSourceID="TotalSQL" Width="100%">
        <ItemTemplate>
            <div class="row">
                <div class="col">
                    <div class="box">
                        <h5><%# Eval("Total_Work") %></h5>
                        <p>পারিশ্রমিক</p>
                    </div>
                </div>
                <div class="col">
                    <div class="box">
                        <h5><%# Eval("Total_Loan") %></h5>
                        <p>খরচ/ঋণ</p>
                    </div>
                </div>
                <div class="col">
                    <div class="box">
                        <h5><%# Eval("Total_Return") %></h5>
                        <p>ঋণ ফেরত</p>
                    </div>
                </div>
            </div>
        </ItemTemplate>
    </asp:FormView>

    <asp:SqlDataSource ID="TotalSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT (SELECT ISNULL(SUM(WorkAmount),0) FROM Employee_Work WHERE (InstitutionID = @InstitutionID) AND (EmployeeID = @EmployeeID)  AND WorkDate between ISNULL(@S_date,'01-01-1000') and ISNULL(@E_date,'01-01-3000')) as Total_Work, (SELECT ISNULL(SUM(LoanAmount),0) FROM Employee_Loan WHERE (InstitutionID = @InstitutionID) AND (EmployeeID = @EmployeeID) AND LoanDate between ISNULL(@S_date,'01-01-1000') and ISNULL(@E_date,'01-01-3000'))as Total_Loan, (SELECT ISNULL(SUM(ReturnAmount),0) FROM Employee_Return WHERE (InstitutionID = @InstitutionID) AND (EmployeeID = @EmployeeID)  AND ReturnDate between ISNULL(@S_date,'01-01-1000') and ISNULL(@E_date,'01-01-3000'))as Total_Return" CancelSelectOnNullParameter="False">
        <SelectParameters>
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
            <asp:QueryStringParameter Name="EmployeeID" QueryStringField="EmployeeID" />
            <asp:ControlParameter ControlID="FromTextBox" Name="S_date" PropertyName="Text" />
            <asp:ControlParameter ControlID="ToTextBox" Name="E_date" PropertyName="Text" />
        </SelectParameters>
    </asp:SqlDataSource>

    <%if (WorkGridView.Rows.Count > 0)
        {%>
    <h5>কাজের বিবরণ</h5>
    <asp:GridView ID="WorkGridView" CssClass="table table-bordered table-sm" runat="server" AutoGenerateColumns="False" DataKeyNames="EmployeeWorkID" DataSourceID="AddWorkSQL">
        <Columns>
            <asp:BoundField DataField="WorkFor" HeaderText="কাজের ধরণ" SortExpression="WorkFor" />
            <asp:BoundField DataField="WorkAmount" HeaderText="টাকা" SortExpression="WorkAmount" />
            <asp:BoundField DataField="WorkDate" DataFormatString="{0:d MMM yyyy}" HeaderText="তারিখ" SortExpression="WorkDate" />
            <asp:CommandField ShowDeleteButton="True">
                <ItemStyle Width="50px" />
            </asp:CommandField>
        </Columns>
        <EmptyDataTemplate>
            No record
        </EmptyDataTemplate>
        <HeaderStyle CssClass="bg-info text-white" />
    </asp:GridView>
    <asp:SqlDataSource ID="AddWorkSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" DeleteCommand="DELETE FROM [Employee_Work] WHERE [EmployeeWorkID] = @EmployeeWorkID"
        InsertCommand="INSERT INTO Employee_Work(EmployeeID, InstitutionID, RegistrationID, WorkFor, WorkAmount, WorkDate) VALUES (@EmployeeID, @InstitutionID, @RegistrationID, @WorkFor, @WorkAmount, @WorkDate)"
        SelectCommand="SELECT EmployeeWorkID, EmployeeID, InstitutionID, RegistrationID, WorkFor, WorkAmount, WorkDate, Insert_Date FROM Employee_Work WHERE (InstitutionID = @InstitutionID) AND (EmployeeID = @EmployeeID)"
        UpdateCommand="UPDATE Employee_Work SET WorkFor = @WorkFor, WorkAmount = @WorkAmount WHERE (EmployeeWorkID = @EmployeeWorkID)"
        FilterExpression="WorkDate >= '#{0}#' AND WorkDate <= '#{1}#'">
        <FilterParameters>
            <asp:ControlParameter ControlID="FromTextBox" Name="FInd" />
            <asp:ControlParameter ControlID="ToTextBox" Name="To" />
        </FilterParameters>
        <DeleteParameters>
            <asp:Parameter Name="EmployeeWorkID" Type="Int32" />
        </DeleteParameters>
        <InsertParameters>
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
            <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
            <asp:QueryStringParameter Name="EmployeeID" QueryStringField="EmployeeID" Type="Int32" />
            <asp:ControlParameter ControlID="WorkForTextBox" Name="WorkFor" PropertyName="Text" Type="String" />
            <asp:ControlParameter ControlID="WorkAmountTextBox" Name="WorkAmount" PropertyName="Text" Type="Double" />
            <asp:ControlParameter ControlID="WorkDateTextBox" DbType="Date" Name="WorkDate" PropertyName="Text" />
        </InsertParameters>
        <SelectParameters>
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
            <asp:QueryStringParameter Name="EmployeeID" QueryStringField="EmployeeID" />
        </SelectParameters>
        <UpdateParameters>
            <asp:Parameter Name="WorkFor" Type="String" />
            <asp:Parameter Name="WorkAmount" Type="Double" />
            <asp:Parameter Name="EmployeeWorkID" Type="Int32" />
        </UpdateParameters>
    </asp:SqlDataSource>
    <%} %>

    <%if (LoanGridView.Rows.Count > 0)
        {%>
    <h5>খরচ ও ঋণের বিবরণ</h5>
    <asp:GridView ID="LoanGridView" CssClass="table table-bordered table-sm" runat="server" AutoGenerateColumns="False" DataKeyNames="EmployeeLoanID" DataSourceID="LoanSQL">
        <Columns>
            <asp:BoundField DataField="LoanFor" HeaderText="পাওনা টাকা/ঋণ" SortExpression="LoanFor" />
            <asp:BoundField DataField="LoanAmount" HeaderText="টাকা" SortExpression="LoanAmount" />
            <asp:BoundField DataField="LoanDate" DataFormatString="{0:d MMM yyyy}" HeaderText="তারিখ" SortExpression="LoanDate" />
            <asp:CommandField ShowDeleteButton="True">
                <ItemStyle Width="50px" />
            </asp:CommandField>
        </Columns>
        <EmptyDataTemplate>
            No record
        </EmptyDataTemplate>
        <HeaderStyle CssClass="bg-info text-white" />
    </asp:GridView>
    <asp:SqlDataSource ID="LoanSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
        DeleteCommand="DELETE FROM [Employee_Loan] WHERE [EmployeeLoanID] = @EmployeeLoanID"
        InsertCommand="INSERT INTO Employee_Loan(EmployeeID, InstitutionID, RegistrationID, LoanFor, LoanAmount, LoanDate) VALUES (@EmployeeID, @InstitutionID, @RegistrationID, @LoanFor, @LoanAmount, @LoanDate)"
        SelectCommand="SELECT EmployeeLoanID, EmployeeID, InstitutionID, RegistrationID, LoanFor, LoanAmount, LoanDate, Insert_Date FROM Employee_Loan WHERE (InstitutionID = @InstitutionID) AND (EmployeeID = @EmployeeID)" UpdateCommand="UPDATE Employee_Loan SET LoanFor = @LoanFor, LoanAmount = @LoanAmount WHERE (EmployeeLoanID = @EmployeeLoanID)"
        FilterExpression="LoanDate >= '#{0}#' AND LoanDate <= '#{1}#'">
        <FilterParameters>
            <asp:ControlParameter ControlID="FromTextBox" Name="FInd" />
            <asp:ControlParameter ControlID="ToTextBox" Name="To" />
        </FilterParameters>
        <DeleteParameters>
            <asp:Parameter Name="EmployeeLoanID" Type="Int32" />
        </DeleteParameters>
        <InsertParameters>
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
            <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
            <asp:QueryStringParameter Name="EmployeeID" QueryStringField="EmployeeID" Type="Int32" />
            <asp:ControlParameter ControlID="LoanForTextBox" Name="LoanFor" PropertyName="Text" Type="String" />
            <asp:ControlParameter ControlID="LoanAmountTextBox" Name="LoanAmount" PropertyName="Text" Type="Double" />
            <asp:ControlParameter ControlID="LoanDateTextBox" DbType="Date" Name="LoanDate" PropertyName="Text" />
        </InsertParameters>
        <SelectParameters>
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
            <asp:QueryStringParameter Name="EmployeeID" QueryStringField="EmployeeID" />
        </SelectParameters>
        <UpdateParameters>
            <asp:Parameter Name="LoanFor" Type="String" />
            <asp:Parameter Name="LoanAmount" Type="Double" />
            <asp:Parameter Name="EmployeeLoanID" Type="Int32" />
        </UpdateParameters>
    </asp:SqlDataSource>
    <%} %>

    <%if (ReturnGridView.Rows.Count > 0)
        {%>
    <h5>ফেরতের বিবরণ</h5>
    <asp:GridView ID="ReturnGridView" CssClass="table table-bordered table-sm" runat="server" AutoGenerateColumns="False" DataKeyNames="EmployeeReturnID" DataSourceID="ReturnSQL">
        <Columns>
            <asp:BoundField DataField="ReturnFor" HeaderText="ফেরত" SortExpression="ReturnFor" />
            <asp:BoundField DataField="ReturnAmount" HeaderText="টাকা" SortExpression="ReturnAmount" />
            <asp:BoundField DataField="ReturnDate" DataFormatString="{0:d MMM yyyy}" HeaderText="তারিখ" SortExpression="ReturnDate" />
            <asp:CommandField ShowDeleteButton="True">
                <ItemStyle Width="50px" />
            </asp:CommandField>
        </Columns>
        <EmptyDataTemplate>
            No record
        </EmptyDataTemplate>
        <HeaderStyle CssClass="bg-info text-white" />
    </asp:GridView>
    <asp:SqlDataSource ID="ReturnSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" DeleteCommand="DELETE FROM [Employee_Return] WHERE [EmployeeReturnID] = @EmployeeReturnID" InsertCommand="INSERT INTO Employee_Return(EmployeeID, InstitutionID, RegistrationID, ReturnFor, ReturnAmount, ReturnDate) VALUES (@EmployeeID, @InstitutionID, @RegistrationID, @ReturnFor, @ReturnAmount, @ReturnDate)" SelectCommand="SELECT EmployeeReturnID, EmployeeID, InstitutionID, RegistrationID, ReturnFor, ReturnAmount, ReturnDate, Insert_Date FROM Employee_Return WHERE (InstitutionID = @InstitutionID) AND (EmployeeID = @EmployeeID)" UpdateCommand="UPDATE Employee_Return SET ReturnFor = @ReturnFor, ReturnAmount = @ReturnAmount WHERE (EmployeeReturnID = @EmployeeReturnID)"
        FilterExpression="ReturnDate >= '#{0}#' AND ReturnDate <= '#{1}#'">
        <FilterParameters>
            <asp:ControlParameter ControlID="FromTextBox" Name="FInd" />
            <asp:ControlParameter ControlID="ToTextBox" Name="To" />
        </FilterParameters>
        <DeleteParameters>
            <asp:Parameter Name="EmployeeReturnID" Type="Int32" />
        </DeleteParameters>
        <InsertParameters>
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
            <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
            <asp:QueryStringParameter Name="EmployeeID" QueryStringField="EmployeeID" Type="Int32" />
            <asp:ControlParameter ControlID="ReturnForTextBox" Name="ReturnFor" PropertyName="Text" Type="String" />
            <asp:ControlParameter ControlID="ReturnAmountTextBox" Name="ReturnAmount" PropertyName="Text" Type="Double" />
            <asp:ControlParameter ControlID="ReturnDateTextBox" DbType="Date" Name="ReturnDate" PropertyName="Text" />
        </InsertParameters>
        <SelectParameters>
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
            <asp:QueryStringParameter Name="EmployeeID" QueryStringField="EmployeeID" />
        </SelectParameters>
        <UpdateParameters>
            <asp:Parameter Name="ReturnFor" Type="String" />
            <asp:Parameter Name="ReturnAmount" Type="Double" />
            <asp:Parameter Name="EmployeeReturnID" Type="Int32" />
        </UpdateParameters>
    </asp:SqlDataSource>
    <%} %>

    <!--AddWork Modal -->
    <div class="modal fade" id="AddWork" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header bg-success">
                    <h5 class="modal-title text-white">পারিশ্রমিক যুক্ত করুন</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>
                            কাজের নাম
                            <asp:RequiredFieldValidator ControlToValidate="WorkForTextBox" ValidationGroup="A" ID="RequiredFieldValidator1" runat="server" CssClass="EroorStar" ErrorMessage="Required"></asp:RequiredFieldValidator></label>
                        <asp:TextBox ID="WorkForTextBox" CssClass="form-control" runat="server"></asp:TextBox>
                    </div>
                    <div class="form-group">
                        <label>
                            টাকা
                            <asp:RequiredFieldValidator ControlToValidate="WorkAmountTextBox" ValidationGroup="A" ID="RequiredFieldValidator2" runat="server" CssClass="EroorStar" ErrorMessage="Required"></asp:RequiredFieldValidator></label>
                        <asp:TextBox ID="WorkAmountTextBox" CssClass="form-control" runat="server"></asp:TextBox>
                    </div>
                    <div class="form-group">
                        <label>
                            তারিখ
                            <asp:RequiredFieldValidator ControlToValidate="WorkDateTextBox" ValidationGroup="A" ID="RequiredFieldValidator3" runat="server" CssClass="EroorStar" ErrorMessage="Required"></asp:RequiredFieldValidator></label>
                        <asp:TextBox ID="WorkDateTextBox" CssClass="form-control datepicker" runat="server"></asp:TextBox>
                    </div>
                    <div class="form-group">
                        <asp:Button ID="AddWork_Button" OnClick="AddWork_Button_Click" CssClass="btn btn-primary" runat="server" Text="যুক্ত করুন" ValidationGroup="A" />
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!--Employee_Loan Modal -->
    <div class="modal fade" id="Employee_Loan" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header bg-success">
                    <h5 class="modal-title text-white">খরচ/ঋণ প্রদান</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>
                            পাওনা টাকা বা ঋণের বিবরণ
                            <asp:RequiredFieldValidator ControlToValidate="LoanForTextBox" ValidationGroup="B" ID="RequiredFieldValidator4" runat="server" CssClass="EroorStar" ErrorMessage="Required"></asp:RequiredFieldValidator></label>
                        <asp:TextBox ID="LoanForTextBox" CssClass="form-control" runat="server"></asp:TextBox>
                    </div>
                    <div class="form-group">
                        <label>
                            টাকা
                            <asp:RequiredFieldValidator ControlToValidate="LoanAmountTextBox" ValidationGroup="B" ID="RequiredFieldValidator5" runat="server" CssClass="EroorStar" ErrorMessage="Required"></asp:RequiredFieldValidator></label>
                        <asp:TextBox ID="LoanAmountTextBox" CssClass="form-control" runat="server"></asp:TextBox>
                    </div>
                    <div class="form-group">
                        <label>
                            তারিখ
                            <asp:RequiredFieldValidator ControlToValidate="LoanDateTextBox" ValidationGroup="B" ID="RequiredFieldValidator6" runat="server" CssClass="EroorStar" ErrorMessage="Required"></asp:RequiredFieldValidator></label>
                        <asp:TextBox ID="LoanDateTextBox" CssClass="form-control datepicker" runat="server"></asp:TextBox>
                    </div>
                    <div class="form-group">
                        <asp:Button ID="AddLoan_Button" CssClass="btn btn-primary" runat="server" Text="যুক্ত করুন" OnClick="AddLoan_Button_Click" ValidationGroup="B" />
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!--Employee_Return Modal -->
    <div class="modal fade" id="Employee_Return" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header bg-success">
                    <h5 class="modal-title text-white">ঋণ ফেরত</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>
                            ফেরতের বর্ণনা
                            <asp:RequiredFieldValidator ControlToValidate="ReturnForTextBox" ValidationGroup="C" ID="RequiredFieldValidator7" runat="server" CssClass="EroorStar" ErrorMessage="Required"></asp:RequiredFieldValidator></label>
                        <asp:TextBox ID="ReturnForTextBox" CssClass="form-control" runat="server"></asp:TextBox>
                    </div>
                    <div class="form-group">
                        <label>
                            টাকা
                            <asp:RequiredFieldValidator ControlToValidate="ReturnAmountTextBox" ValidationGroup="C" ID="RequiredFieldValidator8" runat="server" CssClass="EroorStar" ErrorMessage="Required"></asp:RequiredFieldValidator></label>
                        <asp:TextBox ID="ReturnAmountTextBox" CssClass="form-control" runat="server"></asp:TextBox>
                    </div>
                    <div class="form-group">
                        <label>
                            তারিখ
                            <asp:RequiredFieldValidator ControlToValidate="ReturnDateTextBox" ValidationGroup="C" ID="RequiredFieldValidator9" runat="server" CssClass="EroorStar" ErrorMessage="Required"></asp:RequiredFieldValidator></label>
                        <asp:TextBox ID="ReturnDateTextBox" CssClass="form-control datepicker" runat="server"></asp:TextBox>
                    </div>
                    <div class="form-group">
                        <asp:Button ID="Return_Button" CssClass="btn btn-primary" runat="server" Text="যুক্ত করুন" OnClick="Return_Button_Click" ValidationGroup="C" />
                    </div>
                </div>
            </div>
        </div>
    </div>


    <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.2/js/bootstrap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-datepicker/1.3.0/js/bootstrap-datepicker.js"></script>

    <script>
        $(function () {
            $(".datepicker").datepicker({
                autoclose: true,
                todayHighlight: true,
                format: 'dd-M-yyyy'
            });
        });
    </script>
</asp:Content>
