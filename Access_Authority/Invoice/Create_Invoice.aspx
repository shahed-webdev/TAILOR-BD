<%@ Page Title="" Language="C#" MasterPageFile="~/Design.Master" AutoEventWireup="true" CodeBehind="Create_Invoice.aspx.cs" Inherits="TailorBD.AccessAdmin.WebForm1" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
    <script src="../../JS/requiered/jquery.js"></script>
    <script src="../../JS/requiered/quicksearch.js"></script>
    <script src="../../JS/jq_Profile/jquery-ui-1.8.23.custom.min.js"></script>

    <script src="../../JS/DatePicker/jquery.datepick.js"></script>
    <link href="../../JS/DatePicker/jquery.datepick.css" rel="stylesheet" />

    <script type="text/javascript">

        $(function () {
            $('.Datetime').datepick();

            $('.ContinueButton').click(function () {

                if ($('.Datetime').val() == "") {
                    alert('তারিখ দিন');
                    return false;
                }
                else
                    return true;

            });
        });
    </script>

</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <h3>টেইলর লিস্ট </h3>

    <asp:Label ID="TotalLabel" runat="server"></asp:Label>
    <asp:GridView ID="TailorListGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataSourceID="TailorSQL" DataKeyNames="InstitutionID">
        <Columns>
            <asp:TemplateField ShowHeader="False" HeaderText="Select">
                <ItemTemplate>
                    <asp:CheckBox ID="TailorCheckBox" runat="server" Text="." ForeColor="White" />
                </ItemTemplate>
            </asp:TemplateField>
            <asp:BoundField DataField="InstitutionName" HeaderText="Tailor Name" SortExpression="InstitutionName" />
            <asp:BoundField DataField="City" HeaderText="City" SortExpression="City" />
            <asp:BoundField DataField="Phone" HeaderText="Phone" SortExpression="Phone" />
            <asp:BoundField DataField="Renew_Amount" HeaderText="Renew Amount" SortExpression="Renew_Amount" />
            <asp:BoundField DataField="Expire_Date" HeaderText="Expire Date" SortExpression="Expire_Date" DataFormatString="{0:MMMM d, yyyy}" />
        </Columns>
        <EmptyDataTemplate>
            No Customer
        </EmptyDataTemplate>
        <SelectedRowStyle BackColor="#CCCCCC" />
    </asp:GridView>
    <asp:SqlDataSource ID="TailorSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT [InstitutionName], [Signing_Money], [Expire_Date], [City], [Date], [Phone], [Renew_Amount], [TotalCustomer], [Address], [State], [InstitutionID] FROM [Institution]"></asp:SqlDataSource>
   
     <h3>Invoice </h3>
    <table>
        <tr>
            <td>Invoice For:</td>
            <td>
                <asp:TextBox ID="InvoiceDetailsTextBox" runat="server" CssClass="Textbox" Height="50px" TextMode="MultiLine"></asp:TextBox>
            </td>
        </tr>
        <tr>
            <td>Issu Date:</td>
            <td>
                <asp:TextBox ID="IssuDateTextBox" runat="server" CssClass="Datetime"></asp:TextBox>
            </td>
        </tr>
        <tr>
            <td>End Date:</td>
            <td>
                <asp:TextBox ID="EndDateTextBox" runat="server" CssClass="Datetime"></asp:TextBox>
            </td>
        </tr>
        <tr>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
        </tr>
    </table>

    <h3>Invoice Line </h3>
    <table>
        <tr>
            <td>Description:</td>
            <td>
                <asp:TextBox ID="InvoiceForTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
            </td>
        </tr>
        <tr>
            <td>Amount:</td>
            <td>
                <asp:TextBox ID="AmountTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
            </td>
        </tr>
        <tr>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
        </tr>
        <tr>
            <td>&nbsp;</td>
            <td>
                <asp:Button ID="AdchartButton" runat="server" OnClick="AdchartButton_Click" Text="Add To Invoice list" CssClass="ContinueButton" />
            </td>
        </tr>
        <tr>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
        </tr>
    </table>

    <asp:GridView ID="InvoiceGridView" runat="server" CssClass="mGrid" OnRowEditing="OnRowEditing" AutoGenerateColumns="False">
        <Columns>
            <asp:BoundField DataField="Details" HeaderText="Details" />
            <asp:BoundField DataField="Amount" HeaderText="Amount" />
            <asp:TemplateField ShowHeader="False" HeaderText="ইডিট করুন">
                <EditItemTemplate>
                    <asp:LinkButton ID="UpdateLinkButton" runat="server" ToolTip="আপডেট করুন" CausesValidation="True" CommandName="Update" Text="" CssClass="Updete" OnClick="OnUpdate"></asp:LinkButton>
                    &nbsp;
                    <asp:LinkButton ID="CancelLinkButton" runat="server" ToolTip="কেন্সেল করুন" CausesValidation="False" CommandName="Cancel" Text="" CssClass="Cancel" OnClick="OnCancel"></asp:LinkButton>
                </EditItemTemplate>
                <ItemTemplate>
                    <asp:LinkButton ID="EditLinkButton" runat="server" ToolTip="ইডিট করুন" CausesValidation="False" CommandName="Edit" Text="" CssClass="Edit"></asp:LinkButton>
                </ItemTemplate>
            </asp:TemplateField>
            <asp:TemplateField ShowHeader="False">
                <ItemTemplate>
                    <asp:LinkButton ID="DeleteLinkButton" runat="server" CausesValidation="False" CommandName="Delete" OnClick="RowDelete" Text="Delete"></asp:LinkButton>
                </ItemTemplate>
            </asp:TemplateField>
        </Columns>
    </asp:GridView>

    <%if(InvoiceGridView.Rows.Count>0) {%>
    <table>
        <tr>
            <td>Discount:</td>
            <td>&nbsp;</td>
        </tr>
        <tr>
            <td>
                <asp:TextBox ID="DiscountTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
            </td>
            <td>

                <asp:Button ID="SubmitButton" runat="server" CssClass="ContinueButton" Text="Assign Invoice" OnClick="SubmitButton_Click" />
            </td>
        </tr>
    </table>
    <%} %>

    <asp:SqlDataSource ID="invoiceSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="INSERT INTO Invoice(RegistrationID, InstitutionID, IssuDate, EndDate, Invoice_For, Discount, PaymentStatus, CreateDate) VALUES (@RegistrationID, @InstitutionID, @IssuDate, @EndDate, @Invoice_For, @Discount, @PaymentStatus, GETDATE())
Select @InvoiceID=scope_identity()" SelectCommand="SELECT * FROM [Invoice]">
        <InsertParameters>
            <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
            <asp:ControlParameter ControlID="IssuDateTextBox" DbType="Date" Name="IssuDate" PropertyName="Text" />
            <asp:ControlParameter ControlID="EndDateTextBox" DbType="Date" Name="EndDate" PropertyName="Text" />
            <asp:ControlParameter ControlID="InvoiceDetailsTextBox" Name="Invoice_For" PropertyName="Text" />
            <asp:ControlParameter ControlID="DiscountTextBox" Name="Discount" PropertyName="Text" Type="Double" DefaultValue="0" />
            <asp:Parameter DefaultValue="Due" Name="PaymentStatus" Type="String" />
            <asp:Parameter Name="InstitutionID" Type="Int32" DefaultValue="" />
            <asp:Parameter Name="InvoiceID" />
        </InsertParameters>
    </asp:SqlDataSource>
    <asp:SqlDataSource ID="InvoiceLineSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="INSERT INTO [Invoice_Line] ([InvoiceID], [RegistrationID], [InstitutionID], [Details], [Amount]) VALUES ((select IDENT_CURRENT( 'Invoice' )), @RegistrationID, @InstitutionID, @Details, @Amount)" SelectCommand="SELECT * FROM [Invoice_Line]">
         <InsertParameters>
             <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
             <asp:Parameter Name="InstitutionID" Type="Int32" />
             <asp:Parameter Name="Details" Type="String" />
             <asp:Parameter Name="Amount" Type="Double" />
         </InsertParameters>
    </asp:SqlDataSource>
     
</asp:Content>
