<%@ Page Title="" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Style_ Design_Add.aspx.cs" Inherits="TailorBD.AccessAdmin.Dress.Style__Design_Add" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
    <link href="CSS/Dress.css" rel="stylesheet" />
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <h3>'<asp:Label ID="StyleNameLabel" runat="server" Text=""></asp:Label>' ডিজাইন যুক্ত করুন </h3>

    <table>
        <tr>
            <td>ডিজাইন বা স্টাইলের নাম<asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="Style_NameTextBox" CssClass="EroorSummer" ErrorMessage="খালি রাখা যাবেনা" ValidationGroup="1" ForeColor="Red"></asp:RequiredFieldValidator>
            </td>
        </tr>
        <tr>
            <td>
                <asp:TextBox ID="Style_NameTextBox" runat="server" CssClass="textbox"></asp:TextBox>
            </td>
        </tr>
        <tr>
            <td>ডিজাইন সিরিয়াল<asp:RegularExpressionValidator ID="RegularExpressionValidator2" runat="server" ControlToValidate="SerialNoTextBox" CssClass="EroorSummer" ErrorMessage="শুধু ইংরেজী নাম্বার লেখা যাবে" ValidationExpression="^\d+$" ValidationGroup="1"></asp:RegularExpressionValidator>
            </td>
        </tr>
        <tr>
            <td>
                <asp:TextBox ID="SerialNoTextBox" runat="server" CssClass="textbox"></asp:TextBox>
            </td>
        </tr>
        <tr>
            <td>ডিজাইন বা স্টাইলের ছবি</td>
        </tr>
        <tr>
            <td>
                <asp:FileUpload ID="ImageFileUpload" runat="server" />
            </td>
        </tr>
        <tr>
            <td>&nbsp;</td>
        </tr>
        <tr>
            <td>
                <asp:Button ID="AddButton" runat="server" CssClass="ContinueButton" Text="স্টাইল যুক্ত করুন " OnClick="AddButton_Click" ValidationGroup="1" />
            </td>
        </tr>
        <tr>
            <td>
                <asp:SqlDataSource ID="Dress_Style_Name_SQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" DeleteCommand="DELETE FROM [Dress_Style] WHERE [Dress_StyleID] = @Dress_StyleID AND (InstitutionID = @InstitutionID)" InsertCommand="INSERT INTO Dress_Style(Dress_Style_CategoryID, RegistrationID, InstitutionID, DressID, Dress_Style_Name, StyleSerial) VALUES (@Dress_Style_CategoryID, @RegistrationID, @InstitutionID, @DressID, @Dress_Style_Name, @StyleSerial)" SelectCommand="SELECT Dress_StyleID, Dress_Style_CategoryID, RegistrationID, InstitutionID, DressID, Dress_Style_Name, Dress_Style_Image, Dress_Style_Description, StyleSerial FROM Dress_Style WHERE (Dress_Style_CategoryID = @Dress_Style_CategoryID) AND (InstitutionID = @InstitutionID) ORDER BY ISNULL(StyleSerial, 99999)" UpdateCommand="UPDATE Dress_Style SET Dress_Style_Name = @Dress_Style_Name WHERE (Dress_StyleID = @Dress_StyleID) AND (InstitutionID = @InstitutionID)">
                    <DeleteParameters>
                        <asp:Parameter Name="Dress_StyleID" Type="Int32" />
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                    </DeleteParameters>
                    <InsertParameters>
                        <asp:QueryStringParameter Name="Dress_Style_CategoryID" QueryStringField="catagoryid" Type="Int32" />
                        <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                        <asp:CookieParameter CookieName="InstitutionID" DefaultValue="0" Name="InstitutionID" Type="Int32" />
                        <asp:QueryStringParameter DefaultValue="" Name="DressID" QueryStringField="dressid" Type="Int32" />
                        <asp:ControlParameter ControlID="Style_NameTextBox" Name="Dress_Style_Name" PropertyName="Text" Type="String" />
                        <asp:ControlParameter ControlID="SerialNoTextBox" Name="StyleSerial" PropertyName="Text" />
                    </InsertParameters>
                    <SelectParameters>
                        <asp:QueryStringParameter Name="Dress_Style_CategoryID" QueryStringField="catagoryid" />
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                    </SelectParameters>
                    <UpdateParameters>
                        <asp:Parameter Name="Dress_Style_Name" />
                        <asp:Parameter Name="Dress_StyleID" Type="Int32" />
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                    </UpdateParameters>
                </asp:SqlDataSource>
            </td>
        </tr>
    </table>

    <asp:LinkButton ID="BackLinkButton" runat="server" OnClick="BackLinkButton_Click">পূর্বের পেইজে যান</asp:LinkButton>
    <asp:GridView ID="StyleGridView" runat="server" AutoGenerateColumns="False" DataKeyNames="Dress_StyleID" DataSourceID="Dress_Style_Name_SQL" CssClass="mGrid" OnRowUpdating="StyleGridView_RowUpdating" OnRowDeleted="StyleGridView_RowDeleted">
        <Columns>
            <asp:TemplateField ShowHeader="False" HeaderText="ইডিট করুন">
                <EditItemTemplate>
                    <asp:LinkButton ID="UpdateLinkButton" runat="server" ToolTip="আপডেট করুন" CausesValidation="True" CommandName="Update" Text="" CssClass="Updete" ValidationGroup="U"></asp:LinkButton>
                    &nbsp;

                                <asp:LinkButton ID="CancelLinkButton" runat="server" ToolTip="কেন্সেল করুন" CausesValidation="False" CommandName="Cancel" Text="" CssClass="Cancel"></asp:LinkButton>
                </EditItemTemplate>
                <ItemTemplate>

                    <asp:LinkButton ID="EditLinkButton" runat="server" ToolTip="ইডিট করুন" CausesValidation="False" CommandName="Edit" Text="" CssClass="Edit"></asp:LinkButton>
                </ItemTemplate>
                <ItemStyle Width="70px" />
            </asp:TemplateField>
            <asp:TemplateField HeaderText="স্টাইলের নাম " SortExpression="Dress_Style_Name">
                <EditItemTemplate>
                    <asp:TextBox ID="UpdtStyleTextBox" runat="server" Text='<%# Bind("Dress_Style_Name") %>'></asp:TextBox>
                    <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="UpdtStyleTextBox" CssClass="EroorStar" ErrorMessage="*" SetFocusOnError="True" ValidationGroup="U"></asp:RequiredFieldValidator>
                </EditItemTemplate>
                <ItemTemplate>
                    <asp:Label ID="Label1" runat="server" Text='<%# Bind("Dress_Style_Name") %>'></asp:Label>
                </ItemTemplate>
            </asp:TemplateField>
            <asp:TemplateField HeaderText="স্টাইলের ছবি" SortExpression="Dress_Style_Image">
                <EditItemTemplate>
                    <asp:FileUpload ID="StyleFileUpload" runat="server" />
                </EditItemTemplate>
                <ItemTemplate>
                    <img alt="" src="../../Handler/Style_Name.ashx?Img=<%#Eval("Dress_StyleID") %>" class="Img" />
                </ItemTemplate>
            </asp:TemplateField>

             <asp:TemplateField HeaderText="সিরিয়াল" SortExpression="StyleSerial">
                <ItemTemplate>
                    <asp:RegularExpressionValidator ID="RegularExpressionValidator1" runat="server" ControlToValidate="StyleSerialTextBox" CssClass="EroorStar" ErrorMessage="শুধু ইংরেজী নাম্বার লেখা যাবে।" ValidationExpression="^\d+$" ValidationGroup="1"></asp:RegularExpressionValidator>
                    <br />
                    <asp:TextBox ID="StyleSerialTextBox" Width="60" runat="server" CssClass="textbox" Text='<%# Bind("StyleSerial") %>'></asp:TextBox>
                </ItemTemplate>
                <ItemStyle VerticalAlign="Bottom" Width="60px" />
            </asp:TemplateField>

            <asp:TemplateField ShowHeader="False" HeaderText="ডিলিট করুন">
                <ItemTemplate>
                    <asp:LinkButton ID="DeleteImageButton" runat="server" ToolTip="ডিলিট করুন" CausesValidation="False" CommandName="Delete" OnClientClick="return confirm('আপনি কি ডিলেট করতে চান ?')" CssClass="Delete"></asp:LinkButton>
                </ItemTemplate>
                <ItemStyle Width="50px" />
            </asp:TemplateField>
        </Columns>
        <EmptyDataTemplate>
            No Style Added
        </EmptyDataTemplate>
    </asp:GridView>
    <asp:SqlDataSource ID="UpdateSerialSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
        SelectCommand="SELECT * FROM [Dress_Style] WHERE ([InstitutionID] = @InstitutionID)" UpdateCommand="UPDATE Dress_Style SET StyleSerial = @StyleSerial WHERE (InstitutionID = @InstitutionID) AND (Dress_StyleID = @Dress_StyleID)">
        <SelectParameters>
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
        </SelectParameters>
        <UpdateParameters>
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
            <asp:Parameter Name="StyleSerial" />
            <asp:Parameter Name="Dress_StyleID" />
        </UpdateParameters>
    </asp:SqlDataSource>
    <br />
    <%if (StyleGridView.Rows.Count > 0)
       {%> <asp:Button ID="UpdateSerialButton" runat="server" OnClick="UpdateSerialButton_Click" Text="সিরিয়ালগুলো আপডেট করুন" CssClass="ContinueButton" /><%} %>
    <br />
</asp:Content>
