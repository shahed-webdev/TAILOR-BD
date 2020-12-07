<%@ Page Title="" Language="C#" MasterPageFile="~/Design.Master" AutoEventWireup="true" CodeBehind="See_Marketing_Report.aspx.cs" Inherits="TailorBD.Access_Authority.See_Marketing_Report" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
    <link href="CSS/Print.css" rel="stylesheet" />

<style>
    
.Main_Design {
    width:95%;
}
   .Multextbox {}
</style>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <asp:ScriptManager ID="ScriptManager1" runat="server"></asp:ScriptManager>
       <asp:UpdatePanel ID="UpdatePanel2" runat="server">
     <ContentTemplate>
    <h3>গ্রাহকদের এসএমএস পাঠান</h3>

    <table>
        <tr>
            <td>Possibility</td>
            <td>&nbsp;</td>
            <td>Area</td>
        </tr>
        <tr>
            <td>
                <asp:DropDownList ID="PossibilityDropDownList" runat="server" CssClass="dropdown" AutoPostBack="True">
                    <asp:ListItem Value="%">[ SELECT ]</asp:ListItem>
                    <asp:ListItem>Very High</asp:ListItem>
                    <asp:ListItem>High</asp:ListItem>
                    <asp:ListItem>Average</asp:ListItem>
                    <asp:ListItem>Low</asp:ListItem>
                    <asp:ListItem>No</asp:ListItem>
                </asp:DropDownList>
            </td>
            <td>OR</td>
            <td>
                <asp:DropDownList ID="AreaDropDownList" runat="server" DataSourceID="AREA_SQL" DataTextField="Area" DataValueField="Area" AppendDataBoundItems="True" AutoPostBack="True" CssClass="dropdown">
                    <asp:ListItem Value="%">[ SELECT ]</asp:ListItem>
                </asp:DropDownList>
                <asp:SqlDataSource ID="AREA_SQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT DISTINCT Area FROM TBD.Marketing_Visited_Tailor"></asp:SqlDataSource>
            </td>
        </tr>
        <tr>
            <td colspan="3">
               
            </td>
        </tr>
    </table>


    <asp:GridView ID="CustomerListGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="Marketing_Visited_TailorID,Phone" DataSourceID="CustomerListSQL" PageSize="30">
        <Columns>
           <asp:TemplateField ShowHeader="False">
              
                <ItemTemplate>
                    <asp:CheckBox ID="SMSCheckBox" runat="server" Text=" " />
                </ItemTemplate>
                <ItemStyle Width="2%" />
                <HeaderTemplate>
                    <asp:CheckBox ID="AllCheckBox" runat="server" Text=" " />
                </HeaderTemplate>
            </asp:TemplateField>
       
            <asp:BoundField DataField="Institution_Name" HeaderText="Institution" SortExpression="Institution_Name" />
            <asp:BoundField DataField="ContactPerson_Name" HeaderText="Contact Person" SortExpression="ContactPerson_Name" />
            <asp:BoundField DataField="Phone" HeaderText="Phone" SortExpression="Phone" />
            <asp:BoundField DataField="Area" HeaderText="Area" SortExpression="Area" />
            <asp:BoundField DataField="Market_Name" HeaderText="Market Name" SortExpression="Market_Name" />
            <asp:BoundField DataField="City" HeaderText="City" SortExpression="City" />
            <asp:BoundField DataField="Possibility" HeaderText="Possibility" SortExpression="Possibility" />
            <asp:BoundField DataField="FeedBack" HeaderText="Feedback" SortExpression="FeedBack" />
            <asp:BoundField DataField="Status" HeaderText="Status" SortExpression="Status" />
             <asp:BoundField DataField="Visiting_Date" HeaderText="Visiting Date" SortExpression="Visiting_Date" DataFormatString="{0:d MMM yyy}" />
            <asp:HyperLinkField DataNavigateUrlFields="Marketing_Visited_TailorID" DataNavigateUrlFormatString="M_Report_Details.aspx?In_ID={0}" Text="Details" />  

        </Columns>

        <EmptyDataTemplate>
            No Customer
        </EmptyDataTemplate>
        <PagerStyle CssClass="pgr" />
    </asp:GridView>

    <table>
        <tr>
            <td>

                <asp:CustomValidator ID="CV" runat="server" ClientValidationFunction="Validate" ErrorMessage="আপনার গ্রাহক তালিকা থেকে কোন গ্রাহক নির্বাচন করেন নি." ForeColor="Red" ValidationGroup="1"></asp:CustomValidator>


            </td>
        </tr>
        <tr>
            <td>
                <b>বার্তা লিখুন</b>
                <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="SMSTextTextBox" ErrorMessage="বার্তা লিখুন" ValidationGroup="1" CssClass="EroorStar"></asp:RequiredFieldValidator>
            </td>
        </tr>
        <tr>
            <td>
                <asp:TextBox ID="SMSTextTextBox" runat="server" TextMode="MultiLine" CssClass="Multextbox" Height="96px" Width="300px"></asp:TextBox>
            </td>
        </tr>
        <tr>
            <td>
                <asp:Label ID="ErrorLabel" runat="server" CssClass="EroorStar"></asp:Label>
            </td>
        </tr>
        <tr>
            <td>
                <asp:Button ID="SendSMSButton" runat="server" CssClass="ContinueButton" OnClick="SendSMSButton_Click" Text="বার্তা পাঠান" ValidationGroup="1" />
            </td>
        </tr>
    </table>

    <asp:SqlDataSource ID="CustomerListSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
        SelectCommand="SELECT Marketing_Visited_TailorID, RegistrationID, Institution_Name, ContactPerson_Name, Phone, Area, Market_Name, Shop_No, City, Post_Code, FeedBack, Possibility, Status, Visited_By, Visiting_Date, Insert_Date, Deal_Price FROM TBD.Marketing_Visited_Tailor WHERE (Possibility LIKE  @Possibility) AND ((Area LIKE @Area) OR (@Area=''))">

        <SelectParameters>
            <asp:ControlParameter ControlID="PossibilityDropDownList" Name="Possibility" PropertyName="SelectedValue" />
            <asp:ControlParameter ControlID="AreaDropDownList" ConvertEmptyStringToNull="False" Name="Area" PropertyName="SelectedValue" />
        </SelectParameters>

    </asp:SqlDataSource>
    <asp:SqlDataSource ID="FollowUpSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" DeleteCommand="DELETE FROM [Marketing_Visited_Tailor_Communication] WHERE [Marketing_Visited_Tailor_CommunicationID] = @Marketing_Visited_Tailor_CommunicationID" InsertCommand="INSERT INTO TBD.Marketing_Visited_Tailor_Communication(Marketing_Visited_TailorID, RegistrationID, Communication_By, Communication_Mathod, FollowUpDetails, Communication_Date, Insert_Date) VALUES (@Marketing_Visited_TailorID, @RegistrationID, @Communication_By, @Communication_Mathod, @FollowUpDetails, GETDATE(), GETDATE())" SelectCommand="SELECT * FROM [Marketing_Visited_Tailor_Communication]" UpdateCommand="UPDATE [Marketing_Visited_Tailor_Communication] SET [Marketing_Visited_TailorID] = @Marketing_Visited_TailorID, [RegistrationID] = @RegistrationID, [Communication_By] = @Communication_By, [Communication_Mathod] = @Communication_Mathod, [FollowUpDetails] = @FollowUpDetails, [Communication_Date] = @Communication_Date, [Insert_Date] = @Insert_Date WHERE [Marketing_Visited_Tailor_CommunicationID] = @Marketing_Visited_Tailor_CommunicationID">
        <DeleteParameters>
            <asp:Parameter Name="Marketing_Visited_Tailor_CommunicationID" Type="Int32" />
        </DeleteParameters>
        <InsertParameters>
            <asp:Parameter Name="Marketing_Visited_TailorID" Type="Int32" />
            <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
            <asp:Parameter Name="Communication_By" Type="String" DefaultValue="Tailor BD SMS Panel" />
            <asp:Parameter Name="Communication_Mathod" Type="String" DefaultValue="" />
            <asp:Parameter Name="FollowUpDetails" Type="String" />
        </InsertParameters>
        <UpdateParameters>
            <asp:Parameter Name="Marketing_Visited_TailorID" Type="Int32" />
            <asp:Parameter Name="RegistrationID" Type="Int32" />
            <asp:Parameter Name="Communication_By" Type="String" />
            <asp:Parameter Name="Communication_Mathod" Type="String" />
            <asp:Parameter Name="FollowUpDetails" Type="String" />
            <asp:Parameter DbType="Date" Name="Communication_Date" />
            <asp:Parameter DbType="Date" Name="Insert_Date" />
            <asp:Parameter Name="Marketing_Visited_Tailor_CommunicationID" Type="Int32" />
        </UpdateParameters>
    </asp:SqlDataSource>
     </ContentTemplate>
           </asp:UpdatePanel>


     <asp:UpdateProgress ID="UpdateProgress" runat="server">
        <ProgressTemplate>
            <div id="progress_BG"></div>
            <div id="progress">
                <img src="../CSS/Image/gif-load.gif" alt="Loading..." />
                <br />
                <b>Loading...</b></div>
        </ProgressTemplate>
    </asp:UpdateProgress>

    <script type="text/javascript">
        $("[id*=AllCheckBox]").live("click", function () {
            var chkHeader = $(this);
            var grid = $(this).closest("table");
            $("input[type=checkbox]", grid).each(function () {
                if (chkHeader.is(":checked")) {
                    $(this).attr("checked", "checked");
                    $("td", $(this).closest("tr")).addClass("selected");
                } else {
                    $(this).removeAttr("checked");
                    $("td", $(this).closest("tr")).removeClass("selected");
                }
            });
        });

        //---------for Color change-----------------------------
        $("[id*=SMSCheckBox]").live("click", function () {
            var grid = $(this).closest("table");
            var chkHeader = $("[id*=chkHeader]", grid);
            if (!$(this).is(":checked")) {
                $("td", $(this).closest("tr")).removeClass("selected");
                chkHeader.removeAttr("checked");
            } else {
                $("td", $(this).closest("tr")).addClass("selected");
                if ($("[id*=chkRow]", grid).length == $("[id*=chkRow]:checked", grid).length) {
                    chkHeader.attr("checked", "checked");
                }
            }
        });


        /*--select at least one Checkbox Students GridView-----*/
        function Validate(sender, args) {
            var gridView = document.getElementById("<%=CustomerListGridView.ClientID %>");
            var checkBoxes = gridView.getElementsByTagName("input");
            for (var i = 0; i < checkBoxes.length; i++) {
                if (checkBoxes[i].type == "checkbox" && checkBoxes[i].checked) {
                    args.IsValid = true;
                    return;
                }
            }
            args.IsValid = false;
        }

        /**Empty Text**/
        $("[id*=CustomerNoTextBox]").focus(function () {
            $("[id*=MobileNoTextBox]").val('')
        });

        $("[id*=MobileNoTextBox]").focus(function () {
            $("[id*=CustomerNoTextBox]").val('')
        });


        $(document).ready(function () {
            Sys.WebForms.PageRequestManager.getInstance().add_endRequest(function (a, b) {
                /**Empty Text**/
                $("[id*=CustomerNoTextBox]").focus(function () {
                    $("[id*=MobileNoTextBox]").val('')
                });

                $("[id*=MobileNoTextBox]").focus(function () {
                    $("[id*=CustomerNoTextBox]").val('')
                });
            })
        });
    </script>
</asp:Content>
