<%@ Page Title="" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Dress_Style_Category_Add.aspx.cs" Inherits="TailorBD.AccessAdmin.Dress.Add_Dress_Style_Category" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
    <link href="CSS/Dress.css" rel="stylesheet" />
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">

    <table>
        <tr>
            <td>
                <asp:FormView ID="DressImg" runat="server" DataKeyNames="DressID" DataSourceID="DressSQL">
                    <ItemTemplate>
                        <h3>
                           '<asp:Label ID="Dress_NameLabel" runat="server" Text='<%# Eval("Dress_Name") %>' />' ডিজাইন যুক্ত করুন
                        </h3>

                        <a href="Dress_Add.aspx">
                            <img alt="" src="../../Handler/DressHandler.ashx?Img=<%#Eval("DressID") %>" class="Img" />
                        </a>
                    </ItemTemplate>
                </asp:FormView>
                <asp:SqlDataSource ID="DressSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT [Dress_Name], [Image], [DressID] FROM [Dress] WHERE ([DressID] = @DressID)">
                    <SelectParameters>
                        <asp:QueryStringParameter Name="DressID" QueryStringField="dressid" Type="Int32" />
                    </SelectParameters>
                </asp:SqlDataSource>
            </td>
        </tr>
        <tr>
            <td>স্টাইল বা ডিজাইনের ক্যাটাগরির নাম দিন</td>
        </tr>
        <tr>
            <td>&nbsp;<asp:TextBox ID="Style_Design_Catagory_NameTextBox" runat="server" CssClass="textbox"></asp:TextBox>
                &nbsp;<asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="Style_Design_Catagory_NameTextBox" CssClass="EroorStar" ErrorMessage="খালি রাখা যাবেনা" ValidationGroup="1"></asp:RequiredFieldValidator>
            </td>
        </tr>
        <tr>
            <td>ক্যাটাগরির সিরিয়াল</td>
        </tr>
        <tr>
            <td>
                <asp:TextBox ID="SerialNoTextBox" runat="server" CssClass="textbox"></asp:TextBox>
                <asp:RegularExpressionValidator ID="RegularExpressionValidator1" runat="server" ControlToValidate="SerialNoTextBox" CssClass="EroorSummer" ErrorMessage="শুধু ইংরেজী নাম্বার লেখা যাবে" ValidationExpression="^\d+$" ValidationGroup="1"></asp:RegularExpressionValidator>
            </td>
        </tr>
        <tr>
            <td>
                <asp:SqlDataSource ID="Add_Style_Design_CatagorySQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                     DeleteCommand="DELETE FROM [Dress_Style_Category] WHERE [Dress_Style_CategoryID] = @Dress_Style_CategoryID AND (Dress_Style_Category.InstitutionID = @InstitutionID)" 
                    InsertCommand="INSERT INTO Dress_Style_Category(RegistrationID, InstitutionID, DressID, Dress_Style_Category_Name, CategorySerial, Date) VALUES (@RegistrationID, @InstitutionID, @DressID, @Dress_Style_Category_Name, @CategorySerial, GETDATE())" SelectCommand="SELECT Dress_Style_Category.Dress_Style_CategoryID, Dress_Style_Category.RegistrationID, Dress_Style_Category.InstitutionID, Dress_Style_Category.DressID, Dress_Style_Category.Dress_Style_Category_Name, Dress_Style_Category.Date, Dress.Dress_Name, Dress.Image, Dress_Style_Category.CategorySerial FROM Dress_Style_Category INNER JOIN Dress ON Dress_Style_Category.DressID = Dress.DressID WHERE (Dress_Style_Category.DressID = @DressID) AND (Dress_Style_Category.InstitutionID = @InstitutionID) ORDER BY ISNULL(CategorySerial, 99999)" UpdateCommand="UPDATE Dress_Style_Category SET Dress_Style_Category_Name = @Dress_Style_Category_Name WHERE (Dress_Style_CategoryID = @Dress_Style_CategoryID) AND (InstitutionID = @InstitutionID)">
                    <DeleteParameters>
                        <asp:Parameter Name="Dress_Style_CategoryID" Type="Int32" />
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                    </DeleteParameters>
                    <InsertParameters>
                        <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                        <asp:CookieParameter CookieName="InstitutionID" DefaultValue="0" Name="InstitutionID" Type="Int32" />
                        <asp:QueryStringParameter DefaultValue="" Name="DressID" QueryStringField="dressid" Type="Int32" />
                        <asp:ControlParameter ControlID="Style_Design_Catagory_NameTextBox" Name="Dress_Style_Category_Name" PropertyName="Text" Type="String" />
                        <asp:ControlParameter ControlID="SerialNoTextBox" Name="CategorySerial" PropertyName="Text" />
                    </InsertParameters>
                    <SelectParameters>
                        <asp:QueryStringParameter Name="DressID" QueryStringField="dressid" />
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                    </SelectParameters>
                    <UpdateParameters>
                        <asp:Parameter Name="Dress_Style_Category_Name" Type="String" />
                        <asp:Parameter Name="Dress_Style_CategoryID" Type="Int32" />
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                    </UpdateParameters>
                </asp:SqlDataSource>

                <asp:Button ID="AssignButton" runat="server" CssClass="ContinueButton" OnClick="AssignButton_Click" Text="ক্যাটাগরি যুক্ত করুন" ValidationGroup="1" /><br />
                <br />

            </td>
        </tr>
    </table>
    <a href="Dress_Add.aspx">পূর্বের পেইজে যান</a>

    <asp:GridView ID="DSCGridView" runat="server" AutoGenerateColumns="False" DataKeyNames="Dress_Style_CategoryID" DataSourceID="Add_Style_Design_CatagorySQL" CssClass="mGrid" OnRowDeleted="DSCGridView_RowDeleted">
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
                <ItemStyle Width="100px" />
            </asp:TemplateField>
            <asp:TemplateField HeaderText="স্টাইল বা ডিজাইনের ক্যাটাগরির নাম" SortExpression="Dress_Style_Category_Name">
                <EditItemTemplate>
                    <asp:TextBox ID="UpdateCategoryTextBox" runat="server" Text='<%# Bind("Dress_Style_Category_Name") %>'></asp:TextBox>
                    <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="UpdateCategoryTextBox" CssClass="EroorStar" ErrorMessage="*" SetFocusOnError="True" ValidationGroup="U"></asp:RequiredFieldValidator>
                </EditItemTemplate>
                <ItemTemplate>
                    <asp:Label ID="Label1" runat="server" Text='<%# Bind("Dress_Style_Category_Name") %>'></asp:Label>
                </ItemTemplate>
            </asp:TemplateField>
            <asp:TemplateField ConvertEmptyStringToNull="False" HeaderText="ডিজাইন যুক্ত করুন" SortExpression="Date">
                <ItemTemplate>
                    <a title="ডিজাইন যুক্ত করুন!" href="Style_ Design_Add.aspx?dressid=<%#Eval("DressID") %>&catagoryid=<%#Eval("Dress_Style_CategoryID") %>&CName=<%#Eval("Dress_Style_Category_Name") %>" class="Style"></a>
                </ItemTemplate>
            </asp:TemplateField>
            <asp:TemplateField HeaderText="সিরিয়াল" SortExpression="CategorySerial">
                <ItemTemplate>
                    <asp:RegularExpressionValidator ID="RegularExpressionValidator1" runat="server" ControlToValidate="CategorySerialTextBox" CssClass="EroorStar" ErrorMessage="শুধু ইংরেজী নাম্বার লেখা যাবে।" ValidationExpression="^\d+$" ValidationGroup="1"></asp:RegularExpressionValidator>
                    <br />
                    <asp:TextBox ID="CategorySerialTextBox" Width="60" runat="server" CssClass="textbox" Text='<%# Bind("CategorySerial") %>'></asp:TextBox>
                </ItemTemplate>
                <ItemStyle VerticalAlign="Bottom" Width="60px" />
            </asp:TemplateField>
            <asp:TemplateField ShowHeader="False" HeaderText="ডিলিট করুন">
                <ItemTemplate>
                    <asp:LinkButton ID="DeleteImageButton" runat="server" ToolTip="ডিলিট করুন" CausesValidation="False" CommandName="Delete" OnClientClick="return confirm('আপনি কি ডিলেট করতে চান ?')" CssClass="Delete"></asp:LinkButton>
                </ItemTemplate>
            </asp:TemplateField>
        </Columns>
    </asp:GridView>
    <br />
    <%if (DSCGridView.Rows.Count > 0)
       {%>
    <asp:Button ID="UpdateSerialButton" runat="server" OnClick="UpdateSerialButton_Click" Text="সিরিয়ালগুলো আপডেট করুন" CssClass="ContinueButton" /><%} %>
    <asp:SqlDataSource ID="UpdateSerialSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Dress_Style_Category.* FROM Dress_Style_Category WHERE (InstitutionID = @InstitutionID)" UpdateCommand="UPDATE Dress_Style_Category SET CategorySerial = @CategorySerial WHERE (InstitutionID = @InstitutionID) AND (Dress_Style_CategoryID = @Dress_Style_CategoryID)">
        <SelectParameters>
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
        </SelectParameters>
        <UpdateParameters>
            <asp:Parameter Name="CategorySerial" />
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
            <asp:Parameter Name="Dress_Style_CategoryID" />
        </UpdateParameters>
    </asp:SqlDataSource>
    </asp:Content>
