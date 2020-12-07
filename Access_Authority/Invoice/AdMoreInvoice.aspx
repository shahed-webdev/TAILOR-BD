<%@ Page Title="" Language="C#" MasterPageFile="~/Design.Master" AutoEventWireup="true" CodeBehind="AdMoreInvoice.aspx.cs" Inherits="TailorBD.Access_Authority.Invoice.AdMoreInvoice" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <h3>Invoice </h3>
   <asp:GridView ID="MinInvoiceGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" SelectedRowStyle-CssClass="Selected" DataKeyNames="InvoiceID" DataSourceID="InvoiceSQL">
      <Columns>
         <asp:BoundField DataField="Invoice_For" HeaderText="Invoice For" SortExpression="Invoice_For" />
         <asp:BoundField DataField="IssuDate" DataFormatString="{0:d MMM yy}" HeaderText="Issu Date" SortExpression="IssuDate" />
         <asp:BoundField DataField="EndDate" DataFormatString="{0:d MMM yy}" HeaderText="End Date" SortExpression="EndDate" />
         <asp:BoundField DataField="TotalAmount" HeaderText="Total Amount" SortExpression="TotalAmount" />
         <asp:BoundField DataField="Discount" HeaderText="Discount" SortExpression="Discount" />
         <asp:BoundField DataField="PaidAmount" HeaderText="Paid" SortExpression="PaidAmount" />
         <asp:TemplateField HeaderText="Due">
            <ItemTemplate>
               <asp:Label ID="DueLabel" runat="server" Text='<%# Bind("Due") %>'></asp:Label><br />
            </ItemTemplate>
         </asp:TemplateField>

         <asp:HyperLinkField DataNavigateUrlFields="InstitutionID,InvoiceID"
            DataNavigateUrlFormatString="Print_Invoice.aspx?InstitutionID={0}&InvoiceID={1}"
            HeaderText="Print" Text="Print" />
      </Columns>
      <SelectedRowStyle CssClass="Selected" />
   </asp:GridView>

   <asp:SqlDataSource ID="InvoiceSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="INSERT INTO Invoice_Payment_Record(InvoiceID, InstitutionID, RegistrationID, Amount, PaidDate, Collected_By, Payment_Method) VALUES (@InvoiceID, @InstitutionID, @RegistrationID, @Amount, @PaidDate,@Collected_By,@Payment_Method)" SelectCommand="SELECT InvoiceID, RegistrationID, InstitutionID, IssuDate, EndDate, Invoice_For, TotalAmount, Discount, PaymentStatus, CreateDate, PaidAmount, Due, Invoice_Count, Invoice_SN FROM Invoice WHERE (InvoiceID = @InvoiceID)" DeleteCommand="DELETE FROM Invoice WHERE (InvoiceID = @InvoiceID)">
      <DeleteParameters>
         <asp:QueryStringParameter Name="InvoiceID" QueryStringField="InvoiceID" />
      </DeleteParameters>
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
         <asp:QueryStringParameter Name="InvoiceID" QueryStringField="InvoiceID" />
      </SelectParameters>
   </asp:SqlDataSource>

   <br />
   <%if (PaidRecordGridView.Rows.Count > 0)
     { %>
   <p>Paid Record(s)</p>
   <%} %>
   <asp:GridView ID="PaidRecordGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="InvoicePaymentRecordID" DataSourceID="PaidRecordSQL" OnRowDeleted="PaidRecordGridView_RowDeleted">
      <Columns>
         <asp:CommandField ShowDeleteButton="True" />
         <asp:BoundField DataField="Collected_By" HeaderText="Collected_By" SortExpression="Collected_By" />
         <asp:BoundField DataField="Payment_Method" HeaderText="Payment_Method" SortExpression="Payment_Method" />
         <asp:BoundField DataField="PaidDate" DataFormatString="{0: d MMM yyyy}" HeaderText="Paid Date" SortExpression="PaidDate" />
         <asp:BoundField DataField="Amount" HeaderText="Amount" SortExpression="Amount" />
      </Columns>
   </asp:GridView>
   <asp:SqlDataSource ID="PaidRecordSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT InvoicePaymentRecordID, InvoiceID, RegistrationID, InstitutionID, Amount, PaidDate, Collected_By, Payment_Method FROM Invoice_Payment_Record WHERE (InvoiceID = @InvoiceID)" DeleteCommand="DELETE FROM Invoice_Payment_Record WHERE (InvoicePaymentRecordID = @InvoicePaymentRecordID)">
      <DeleteParameters>
         <asp:Parameter Name="InvoicePaymentRecordID" />
      </DeleteParameters>
      <SelectParameters>
         <asp:QueryStringParameter Name="InvoiceID" QueryStringField="InvoiceID" Type="Int32" />
      </SelectParameters>
   </asp:SqlDataSource>
   <br />
   <h3>Invoice Line </h3>
   <table>
      <tr>
         <td>Description:</td>
         <td>
            <asp:TextBox ID="DescriptionTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
            <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="DescriptionTextBox" CssClass="EroorStar" ErrorMessage="*" ValidationGroup="1"></asp:RequiredFieldValidator>
         </td>
      </tr>
      <tr>
         <td>Amount:</td>
         <td>
            <asp:TextBox ID="AmountTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
            <asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="AmountTextBox" CssClass="EroorStar" ErrorMessage="*" ValidationGroup="1"></asp:RequiredFieldValidator>
         </td>
      </tr>
      <tr>
         <td>&nbsp;</td>
         <td>&nbsp;</td>
      </tr>
      <tr>
         <td>&nbsp;</td>
         <td>&nbsp;</td>
      </tr>
      <tr>
         <td>&nbsp;</td>
         <td>&nbsp;</td>
      </tr>
   </table>

   <asp:GridView ID="InvoiceGridView" runat="server" CssClass="mGrid" DataSourceID="InvoiceLineSQL" AutoGenerateColumns="False" DataKeyNames="InvoiceLineID" OnRowDeleted="InvoiceGridView_RowDeleted">
      <Columns>
         <asp:CommandField ShowDeleteButton="True" />
         <asp:BoundField DataField="Details" HeaderText="Details" SortExpression="Details" />
         <asp:BoundField DataField="Amount" HeaderText="Amount" SortExpression="Amount" />
      </Columns>
   </asp:GridView>
   <br />
   <asp:Button ID="SubmitButton" runat="server" CssClass="ContinueButton" Text="Add Invoice" OnClick="SubmitButton_Click" ValidationGroup="1" />


   <asp:Label ID="ErrorLabel" runat="server" CssClass="EroorText"></asp:Label>


   <asp:SqlDataSource ID="InvoiceLineSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="INSERT INTO [Invoice_Line] ([InvoiceID], [RegistrationID], [InstitutionID], [Details], [Amount]) VALUES (@InvoiceID, @RegistrationID, (SELECT InstitutionID From Invoice Where InvoiceID=@InvoiceID ), @Details, @Amount)
"
      SelectCommand="SELECT InvoiceLineID, InvoiceID, RegistrationID, InstitutionID, Details, Amount FROM Invoice_Line WHERE (InvoiceID = @InvoiceID)" DeleteCommand="DELETE FROM Invoice_Line WHERE (InvoiceLineID = @InvoiceLineID)">
      <DeleteParameters>
         <asp:Parameter Name="InvoiceLineID" />
      </DeleteParameters>
      <InsertParameters>
         <asp:QueryStringParameter Name="InvoiceID" QueryStringField="InvoiceID" />
         <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
         <asp:ControlParameter ControlID="DescriptionTextBox" Name="Details" PropertyName="Text" Type="String" />
         <asp:ControlParameter ControlID="AmountTextBox" Name="Amount" PropertyName="Text" Type="Double" />
      </InsertParameters>
      <SelectParameters>
         <asp:QueryStringParameter Name="InvoiceID" QueryStringField="InvoiceID" />
      </SelectParameters>
   </asp:SqlDataSource>
</asp:Content>
