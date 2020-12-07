<%@ Page Title="" Language="C#" MasterPageFile="~/Design.Master" AutoEventWireup="true" CodeBehind="AddMarketingReport.aspx.cs" Inherits="TailorBD.Access_Authority.AddMarketingReport" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
        <link href="../../JS/DatePicker/jquery.datepick.css" rel="stylesheet" />
    <script src="../../JS/DatePicker/jquery.datepick.js"></script>
 
        <script type="text/javascript">
            $(function () {
                $('.Datetime').datepick();
            });
	</script>
<style>
    
.Main_Design {
    width: 90%;
}
</style>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <h3>Insert Marketing Report </h3>
    <table>
        
        <tr>
            <td>Institution Name</td>
            <td>Contact Person</td>
            <td>City</td>
        </tr>
        <tr>
            <td>
                <asp:TextBox ID="InstitutionNameTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
                <asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="InstitutionNameTextBox" ErrorMessage="*" ForeColor="Red" ValidationGroup="1"></asp:RequiredFieldValidator>
            </td>
            <td>
                <asp:TextBox ID="ContactPersonTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
                <asp:RequiredFieldValidator ID="RequiredFieldValidator3" runat="server" ControlToValidate="ContactPersonTextBox" ErrorMessage="*" ForeColor="Red" ValidationGroup="1"></asp:RequiredFieldValidator>
            </td>
            <td>
                <asp:TextBox ID="CityTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
                <asp:RequiredFieldValidator ID="RequiredFieldValidator4" runat="server" ControlToValidate="CityTextBox" ErrorMessage="*" ForeColor="Red" ValidationGroup="1"></asp:RequiredFieldValidator>
            </td>
        </tr>
        <tr>
            <td>
                Post Code</td>
            <td>
                Local Area</td>
            <td>
                Market Name</td>
        </tr>
        <tr>
            <td >
                <asp:TextBox ID="PostCodeTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
            </td>
            <td >
                <asp:TextBox ID="LocalAreaTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
                <asp:RequiredFieldValidator ID="RequiredFieldValidator5" runat="server" ControlToValidate="LocalAreaTextBox" ErrorMessage="*" ForeColor="Red" ValidationGroup="1"></asp:RequiredFieldValidator>
            </td>
            <td >
                <asp:TextBox ID="MarketNameTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
                <asp:RequiredFieldValidator ID="RequiredFieldValidator6" runat="server" ControlToValidate="MarketNameTextBox" ErrorMessage="*" ForeColor="Red" ValidationGroup="1"></asp:RequiredFieldValidator>
            </td>
        </tr>
        <tr>
            <td>
                Shop No</td>
            <td>
                Visited By</td>
            <td>
                Phone</td>
        </tr>
        <tr>
            <td>
                <asp:TextBox ID="ShopNoTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
                <asp:RequiredFieldValidator ID="RequiredFieldValidator7" runat="server" ControlToValidate="ShopNoTextBox" ErrorMessage="*" ForeColor="Red" ValidationGroup="1"></asp:RequiredFieldValidator>
            </td>
            <td>
                <asp:TextBox ID="VisitedByTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
            </td>
            <td>
                <asp:TextBox ID="PhoneTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
                <asp:RequiredFieldValidator ID="RequiredFieldValidator8" runat="server" ControlToValidate="PhoneTextBox" ErrorMessage="*" ForeColor="Red" ValidationGroup="1"></asp:RequiredFieldValidator>
            </td>
        </tr>
        <tr>
            <td>
                Feedback</td>
            <td>
                Possibility</td>
            <td>
                Visited Date</td>
        </tr>
        <tr>
            <td>
                <asp:TextBox ID="FeedbackTextBox" runat="server" CssClass="Textbox" TextMode="MultiLine"></asp:TextBox>
            </td>
            <td style="vertical-align: top">
                <asp:DropDownList ID="PossibilityDropDownList" runat="server" CssClass="dropdown">
                    <asp:ListItem Value="0">[ SELECT ]</asp:ListItem>
                    <asp:ListItem>Very High</asp:ListItem>
                    <asp:ListItem>High</asp:ListItem>
                    <asp:ListItem>Average</asp:ListItem>
                    <asp:ListItem>Low</asp:ListItem>
                    <asp:ListItem>No</asp:ListItem>
                </asp:DropDownList>
                <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="PossibilityDropDownList" ErrorMessage="*" ForeColor="Red" InitialValue="0" ValidationGroup="1"></asp:RequiredFieldValidator>
            </td>
            <td style="vertical-align: top">
                <asp:TextBox ID="VisitingDateTextBox" runat="server" CssClass="Datetime"></asp:TextBox>
                <asp:RequiredFieldValidator ID="RequiredFieldValidator9" runat="server" ControlToValidate="VisitingDateTextBox" ErrorMessage="*" ForeColor="Red" ValidationGroup="1"></asp:RequiredFieldValidator>
            </td>
        </tr>
        <tr>
            <td>
                Deal Price</td>
            <td>
                &nbsp;</td>
            <td>
                &nbsp;</td>
        </tr>
        <tr>
            <td>
                <asp:TextBox ID="DealPriceTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
            </td>
            <td>
                &nbsp;</td>
            <td>
                <asp:SqlDataSource ID="M_ReportSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" DeleteCommand="DELETE FROM TBD.[Marketing_Visited_Tailor] WHERE [Marketing_Visited_TailorID] = @Marketing_Visited_TailorID" InsertCommand="INSERT INTO TBD.Marketing_Visited_Tailor(RegistrationID, Institution_Name, ContactPerson_Name, City, Area, Post_Code, Market_Name, Shop_No, Visited_By, Phone, FeedBack, Possibility, Status, Visiting_Date, Insert_Date, Deal_Price) VALUES (@RegistrationID, @Institution_Name, @ContactPerson_Name, @City, @Area, @Post_Code, @Market_Name, @Shop_No, @Visited_By, @Phone, @FeedBack, @Possibility, @Status, @Visiting_Date, GETDATE(), @Deal_Price)" SelectCommand="SELECT Marketing_Visited_TailorID, RegistrationID, Institution_Name, ContactPerson_Name, City, Area, Post_Code, Market_Name, Shop_No, Visited_By, Phone, FeedBack, Possibility, Status, Visiting_Date, Insert_Date, Area AS Expr1, Deal_Price FROM TBD.Marketing_Visited_Tailor ORDER BY Marketing_Visited_TailorID DESC" UpdateCommand="UPDATE TBD.Marketing_Visited_Tailor SET Institution_Name = @Institution_Name, ContactPerson_Name = @ContactPerson_Name, City = @City,Area = @Area, Post_Code = @Post_Code, Market_Name = @Market_Name, Shop_No = @Shop_No, Visited_By = @Visited_By, Phone = @Phone, FeedBack = @FeedBack, Possibility = @Possibility, Status = @Status WHERE (Marketing_Visited_TailorID = @Marketing_Visited_TailorID)">
                    <DeleteParameters>
                        <asp:Parameter Name="Marketing_Visited_TailorID" Type="Int32" />
                    </DeleteParameters>
                    <InsertParameters>
                        <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                        <asp:ControlParameter ControlID="InstitutionNameTextBox" Name="Institution_Name" PropertyName="Text" Type="String" />
                        <asp:ControlParameter ControlID="ContactPersonTextBox" Name="ContactPerson_Name" PropertyName="Text" Type="String" />
                        <asp:ControlParameter ControlID="CityTextBox" Name="City" PropertyName="Text" Type="String" />
                        <asp:ControlParameter ControlID="LocalAreaTextBox" Name="Area" PropertyName="Text" />
                        <asp:ControlParameter ControlID="PostCodeTextBox" Name="Post_Code" PropertyName="Text" Type="String" />
                        <asp:ControlParameter ControlID="MarketNameTextBox" Name="Market_Name" PropertyName="Text" Type="String" />
                        <asp:ControlParameter ControlID="ShopNoTextBox" Name="Shop_No" PropertyName="Text" Type="String" />
                        <asp:ControlParameter ControlID="VisitedByTextBox" Name="Visited_By" PropertyName="Text" Type="String" />
                        <asp:ControlParameter ControlID="PhoneTextBox" Name="Phone" PropertyName="Text" Type="String" />
                        <asp:ControlParameter ControlID="FeedbackTextBox" Name="FeedBack" PropertyName="Text" Type="String" />
                        <asp:ControlParameter ControlID="PossibilityDropDownList" Name="Possibility" PropertyName="SelectedValue" Type="String" />
                        <asp:Parameter DefaultValue="Expected Client" Name="Status" Type="String" />
                        <asp:ControlParameter ControlID="VisitingDateTextBox" DbType="Date" DefaultValue="" Name="Visiting_Date" PropertyName="Text" />
                        <asp:ControlParameter ControlID="DealPriceTextBox" Name="Deal_Price" PropertyName="Text" />
                    </InsertParameters>
                    <UpdateParameters>
                        <asp:Parameter Name="Institution_Name" Type="String" />
                        <asp:Parameter Name="ContactPerson_Name" Type="String" />
                        <asp:Parameter Name="City" Type="String" />
                        <asp:Parameter Name="Area" />
                        <asp:Parameter Name="Post_Code" Type="String" />
                        <asp:Parameter Name="Market_Name" Type="String" />
                        <asp:Parameter Name="Shop_No" Type="String" />
                        <asp:Parameter Name="Visited_By" Type="String" />
                        <asp:Parameter Name="Phone" Type="String" />
                        <asp:Parameter Name="FeedBack" Type="String" />
                        <asp:Parameter Name="Possibility" Type="String" />
                        <asp:Parameter Name="Status" Type="String" />
                        <asp:Parameter Name="Marketing_Visited_TailorID" Type="Int32" />
                    </UpdateParameters>
                </asp:SqlDataSource>
                <asp:Button ID="SubmitButton" runat="server" CssClass="ContinueButton" Text="Submit" OnClick="SubmitButton_Click" ValidationGroup="1" />
            </td>
        </tr>
        <tr>
            <td></td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
        </tr>
    </table>
    <h3>Visited Institution List</h3>
    <a href="See_Marketing_Report.aspx">Filter Customer Report</a>
    <asp:GridView ID="M_ReportGridView" runat="server" DataSourceID="M_ReportSQL" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="Marketing_Visited_TailorID" AllowPaging="True" AllowSorting="True" PageSize="15">
        <Columns>
            <asp:CommandField ShowDeleteButton="True" ShowEditButton="True" />
            <asp:BoundField DataField="Institution_Name" HeaderText="Institution" SortExpression="Institution_Name" />
            <asp:BoundField DataField="ContactPerson_Name" HeaderText="Contacted Person" SortExpression="ContactPerson_Name" />
            <asp:BoundField DataField="City" HeaderText="City" SortExpression="City" />
            <asp:BoundField DataField="Area" HeaderText="Area" SortExpression="Area" />
            <asp:BoundField DataField="Post_Code" HeaderText="Post Code" SortExpression="Post_Code" />
            <asp:BoundField DataField="Market_Name" HeaderText="Market" SortExpression="Market_Name" />
            <asp:BoundField DataField="Shop_No" HeaderText="Shop No" SortExpression="Shop_No" />
            <asp:BoundField DataField="Visited_By" HeaderText="Visited By" SortExpression="Visited_By" />
            <asp:BoundField DataField="Phone" HeaderText="Phone" SortExpression="Phone" />
            <asp:BoundField DataField="FeedBack" HeaderText="Feed Back" SortExpression="FeedBack" />
            <asp:BoundField DataField="Possibility" HeaderText="Possibility" SortExpression="Possibility" />
            <asp:BoundField DataField="Status" HeaderText="Status" SortExpression="Status" />
            <asp:BoundField DataField="Visiting_Date" DataFormatString="{0:dd/MM/yy}" HeaderText="Visited Date" SortExpression="Visiting_Date" />
            <asp:BoundField DataField="Deal_Price" HeaderText="Deal Price" SortExpression="Deal_Price" />
            <asp:HyperLinkField DataNavigateUrlFields="Marketing_Visited_TailorID" DataNavigateUrlFormatString="M_Report_Details.aspx?In_ID={0}" Text="Details" />     
        </Columns>
    </asp:GridView>
    <br />
</asp:Content>
