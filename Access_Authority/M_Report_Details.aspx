<%@ Page Title="" Language="C#" MasterPageFile="~/Design.Master" AutoEventWireup="true" CodeBehind="M_Report_Details.aspx.cs" Inherits="TailorBD.Access_Authority.M_Report_Details" %>
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
    <style>
    
.Main_Design {
    width:95%;
}
</style>
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <a class="a" href="AddMarketingReport.aspx"><<<< Back to List</a><br /><br />
    <asp:GridView ID="DetailsGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="Marketing_Visited_TailorID" DataSourceID="DetaislSQL">
        <Columns>
            <asp:CommandField ShowEditButton="True" />
            <asp:BoundField DataField="Institution_Name" HeaderText="Institution_Name" SortExpression="Institution_Name" />
            <asp:BoundField DataField="ContactPerson_Name" HeaderText="ContactPerson_Name" SortExpression="ContactPerson_Name" />
            <asp:BoundField DataField="Phone" HeaderText="Phone" SortExpression="Phone" />
            <asp:BoundField DataField="City" HeaderText="City" SortExpression="City" />
            <asp:BoundField DataField="Area" HeaderText="Area" SortExpression="Area" />
            <asp:BoundField DataField="Market_Name" HeaderText="Market_Name" SortExpression="Market_Name" />
            <asp:BoundField DataField="Visited_By" HeaderText="Visited_By" SortExpression="Visited_By" />
            <asp:BoundField DataField="FeedBack" HeaderText="FeedBack" SortExpression="FeedBack" />
            <asp:BoundField DataField="Possibility" HeaderText="Possibility" SortExpression="Possibility" />
            <asp:BoundField DataField="Status" HeaderText="Status" SortExpression="Status" />
            <asp:BoundField DataField="Visiting_Date" DataFormatString="{0:d MMM yyy}" HeaderText="Visiting_Date" SortExpression="Visiting_Date" />
        </Columns>
    </asp:GridView>
    <asp:SqlDataSource ID="DetaislSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Marketing_Visited_TailorID, RegistrationID, Institution_Name, ContactPerson_Name, City,Area, Post_Code, Market_Name, Shop_No, Visited_By, Phone, FeedBack, Possibility, Status, Visiting_Date, Insert_Date FROM TBD.Marketing_Visited_Tailor WHERE (Marketing_Visited_TailorID = @Marketing_Visited_TailorID)" UpdateCommand="UPDATE TBD.Marketing_Visited_Tailor SET Status = @Status, Possibility = @Possibility WHERE (Marketing_Visited_TailorID = @Marketing_Visited_TailorID)">
        <SelectParameters>
            <asp:QueryStringParameter Name="Marketing_Visited_TailorID" QueryStringField="In_ID" />
        </SelectParameters>
        <UpdateParameters>
            <asp:Parameter Name="Status" Type="String" />
            <asp:Parameter Name="Possibility" />
            <asp:Parameter Name="Marketing_Visited_TailorID" Type="Int32" />
        </UpdateParameters>
    </asp:SqlDataSource>
    <h3>Follow Up History</h3>
    <asp:GridView ID="FollowUpRecordGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="Marketing_Visited_Tailor_CommunicationID" DataSourceID="FollowUpSQL">
        <Columns>
            <asp:CommandField ShowEditButton="True" />
            <asp:BoundField DataField="Communication_By" HeaderText="Communication_By" SortExpression="Communication_By" />
            <asp:BoundField DataField="Communication_Mathod" HeaderText="Communication_Mathod" SortExpression="Communication_Mathod" />
            <asp:BoundField DataField="FollowUpDetails" HeaderText="FollowUpDetails" SortExpression="FollowUpDetails" />
            <asp:BoundField DataField="Communication_Date" DataFormatString="{0:d MMM yyy}" HeaderText="Communication_Date" SortExpression="Communication_Date" />
            <asp:BoundField DataField="Insert_Date" DataFormatString="{0:d MMM yyy}" HeaderText="Insert_Date" SortExpression="Insert_Date" />
        </Columns>
    </asp:GridView>
    <br />
    <table>
        <tr>
            <td>Communication By</td>
            <td>
                <asp:TextBox ID="CommunicationbyTextBox" runat="server" CssClass="Textbox"></asp:TextBox>
            </td>
            <td>&nbsp;</td>
        </tr>
        <tr>
            <td>Communication Mathod</td>
            <td>
                <asp:DropDownList ID="Communication_mathodDropDownList" runat="server" CssClass="dropdown">
                    <asp:ListItem>By Phone</asp:ListItem>
                    <asp:ListItem>By Visiting</asp:ListItem>
                    <asp:ListItem>By SMS</asp:ListItem>
                    <asp:ListItem>By Meeting</asp:ListItem>
                    <asp:ListItem>Others</asp:ListItem>
                </asp:DropDownList>
            </td>
            <td>&nbsp;</td>
        </tr>
        <tr>
            <td>Follow Up Details</td>
            <td>
                <asp:TextBox ID="FollowUpDetailsTextBox" runat="server" CssClass="Textbox" Height="50px" TextMode="MultiLine"></asp:TextBox>
            </td>
            <td>&nbsp;</td>
        </tr>
        <tr>
            <td>Communication Date</td>
            <td>
                <asp:TextBox ID="Communication_Date_TextBox" runat="server" CssClass="Datetime"></asp:TextBox>
            </td>
            <td>&nbsp;</td>
        </tr>
        <tr>
            <td>&nbsp;</td>
            <td>
                &nbsp;</td>
            <td>&nbsp;</td>
        </tr>
        <tr>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
        </tr>
        <tr>
            <td>
                <asp:SqlDataSource ID="FollowUpSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" DeleteCommand="DELETE FROM [Marketing_Visited_Tailor_Communication] WHERE [Marketing_Visited_Tailor_CommunicationID] = @Marketing_Visited_Tailor_CommunicationID" InsertCommand="INSERT INTO TBD.Marketing_Visited_Tailor_Communication(Marketing_Visited_TailorID, RegistrationID, Communication_By, Communication_Mathod, FollowUpDetails, Communication_Date, Insert_Date) VALUES (@Marketing_Visited_TailorID, @RegistrationID, @Communication_By, @Communication_Mathod, @FollowUpDetails, @Communication_Date, GETDATE())" SelectCommand="SELECT Marketing_Visited_Tailor_CommunicationID, Marketing_Visited_TailorID, RegistrationID, Communication_By, Communication_Mathod, FollowUpDetails, Communication_Date, Insert_Date FROM TBD.Marketing_Visited_Tailor_Communication WHERE (Marketing_Visited_TailorID = @Marketing_Visited_TailorID)" UpdateCommand="UPDATE TBD.Marketing_Visited_Tailor_Communication SET Communication_By = @Communication_By, Communication_Mathod = @Communication_Mathod, FollowUpDetails = @FollowUpDetails, Communication_Date = @Communication_Date, Insert_Date = @Insert_Date WHERE (Marketing_Visited_Tailor_CommunicationID = @Marketing_Visited_Tailor_CommunicationID)">
                    <DeleteParameters>
                        <asp:Parameter Name="Marketing_Visited_Tailor_CommunicationID" Type="Int32" />
                    </DeleteParameters>
                    <InsertParameters>
                        <asp:QueryStringParameter Name="Marketing_Visited_TailorID" QueryStringField="In_ID" Type="Int32" />
                        <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                        <asp:ControlParameter ControlID="CommunicationbyTextBox" Name="Communication_By" PropertyName="Text" Type="String" />
                        <asp:ControlParameter ControlID="Communication_mathodDropDownList" Name="Communication_Mathod" PropertyName="SelectedValue" Type="String" />
                        <asp:ControlParameter ControlID="FollowUpDetailsTextBox" Name="FollowUpDetails" PropertyName="Text" Type="String" />
                        <asp:ControlParameter ControlID="Communication_Date_TextBox" DbType="Date" Name="Communication_Date" PropertyName="Text" />
                        <asp:Parameter DbType="Date" Name="Insert_Date" />
                    </InsertParameters>
                    <SelectParameters>
                        <asp:QueryStringParameter Name="Marketing_Visited_TailorID" QueryStringField="In_ID" />
                    </SelectParameters>
                    <UpdateParameters>
                        <asp:Parameter Name="Communication_By" Type="String" />
                        <asp:Parameter Name="Communication_Mathod" Type="String" />
                        <asp:Parameter Name="FollowUpDetails" Type="String" />
                        <asp:Parameter DbType="Date" Name="Communication_Date" />
                        <asp:Parameter DbType="Date" Name="Insert_Date" />
                        <asp:Parameter Name="Marketing_Visited_Tailor_CommunicationID" Type="Int32" />
                    </UpdateParameters>
                </asp:SqlDataSource>
            </td>
            <td>
                <asp:Button ID="SubmitButton" runat="server" CssClass="ContinueButton" Text="Submit" OnClick="SubmitButton_Click" />
            </td>
            <td>&nbsp;</td>
        </tr>
    </table>
</asp:Content>
