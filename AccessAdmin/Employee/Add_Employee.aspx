<%@ Page Title="কর্মচারী তালিকা" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Add_Employee.aspx.cs" Inherits="TailorBD.AccessAdmin.Employee.Add_Employee" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.2/css/bootstrap.min.css" />
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <h3>কর্মচারী তালিকা</h3>
    <div class="mb-3">
        <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#exampleModal">কর্মচারী যুক্ত করুন</button>
    </div>

    <div class="table-responsive">
        <asp:GridView ID="EmployeeGridView" CssClass="table table-bordered table-sm" runat="server" AutoGenerateColumns="False" DataKeyNames="EmployeeID" DataSourceID="EmployeeSQL">
            <Columns>
                <asp:TemplateField HeaderText="নাম" SortExpression="EID">
                    <ItemTemplate>
                        <a href="Details.aspx?EmployeeID=<%#Eval("EmployeeID") %>">
                            <%# Eval("EID") %>.
                            <%# Eval("Name") %>
                            </a>
                    </ItemTemplate>
                    <EditItemTemplate>
                        <asp:TextBox ID="EnameTextBox" runat="server" Text='<%#Bind("Name") %>'></asp:TextBox>
                    </EditItemTemplate>
                </asp:TemplateField>
                <asp:BoundField DataField="Phone" HeaderText="ফোন" SortExpression="Phone" />
                <asp:BoundField DataField="Designation" HeaderText="পদবী" SortExpression="Designation" />
                <asp:BoundField DataField="Balance" HeaderText="ব্যালেন্স" ReadOnly="true" SortExpression="Balance" DataFormatString="{0:N}" />
                <asp:CommandField ShowEditButton="True">
                    <ItemStyle Width="50px" />
                </asp:CommandField>
                <asp:CommandField ShowDeleteButton="True">
                    <ItemStyle Width="50px" />
                </asp:CommandField>
            </Columns>
            <HeaderStyle CssClass="bg-info text-white" />
        </asp:GridView>
    </div>
    <asp:SqlDataSource ID="EmployeeSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" DeleteCommand="DELETE FROM [Employee] WHERE [EmployeeID] = @EmployeeID" InsertCommand="INSERT INTO [Employee] ([InstitutionID], [RegistrationID], [EID], [Name], [Phone], [Designation]) VALUES (@InstitutionID, @RegistrationID, [dbo].[Employee_EID](@InstitutionID), @Name, @Phone, @Designation)" SelectCommand="SELECT EmployeeID, EID, Name, Phone, Designation, Photo, Balance, Date FROM Employee WHERE (InstitutionID = @InstitutionID)" UpdateCommand="UPDATE Employee SET Name = @Name, Phone = @Phone, Designation = @Designation WHERE (EmployeeID = @EmployeeID)">
        <DeleteParameters>
            <asp:Parameter Name="EmployeeID" Type="Int32" />
        </DeleteParameters>
        <InsertParameters>
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
            <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
            <asp:ControlParameter ControlID="NameTextBox" Name="Name" PropertyName="Text" Type="String" />
            <asp:ControlParameter ControlID="PhoneTextBox" Name="Phone" PropertyName="Text" Type="String" />
            <asp:ControlParameter ControlID="DesignationTextBox" Name="Designation" PropertyName="Text" Type="String" />
        </InsertParameters>
        <SelectParameters>
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
        </SelectParameters>
        <UpdateParameters>
            <asp:Parameter Name="Name" Type="String" />
            <asp:Parameter Name="Phone" Type="String" />
            <asp:Parameter Name="Designation" Type="String" />
            <asp:Parameter Name="EmployeeID" Type="Int32" />
        </UpdateParameters>
    </asp:SqlDataSource>

    <!-- Modal -->
    <div class="modal fade" id="exampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header bg-success">
                    <h5 class="modal-title text-white" id="exampleModalLabel">কর্মচারী যুক্ত করুন</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>
                            নাম
                            <asp:RequiredFieldValidator ControlToValidate="NameTextBox" ValidationGroup="A" ID="RequiredFieldValidator1" runat="server" CssClass="EroorStar" ErrorMessage="Required"></asp:RequiredFieldValidator></label>
                        <asp:TextBox ID="NameTextBox" CssClass="form-control" runat="server"></asp:TextBox>
                    </div>
                    <div class="form-group">
                        <label>
                            ফোন
                            <asp:RequiredFieldValidator ControlToValidate="PhoneTextBox" ValidationGroup="A" ID="RequiredFieldValidator2" runat="server" CssClass="EroorStar" ErrorMessage="Required"></asp:RequiredFieldValidator></label>
                        <asp:TextBox ID="PhoneTextBox" CssClass="form-control" runat="server"></asp:TextBox>
                    </div>
                    <div class="form-group">
                        <label>পদবী</label>
                        <asp:TextBox ID="DesignationTextBox" CssClass="form-control" runat="server"></asp:TextBox>
                    </div>
                    <asp:Button ID="AddEmployeeButton" ValidationGroup="A" CssClass="btn btn-success" runat="server" OnClick="AddEmployeeButton_Click" Text="যুক্ত করুন" />

                </div>
            </div>
        </div>
    </div>


    <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.2/js/bootstrap.min.js"></script>
</asp:Content>
