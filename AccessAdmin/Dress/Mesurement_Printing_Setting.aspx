<%@ Page Title="প্রিন্ট কপি সেটিং" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Mesurement_Printing_Setting.aspx.cs" Inherits="TailorBD.AccessAdmin.Dress.Mesurement_Printing_Setting" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
    <style type="text/css">
        .Print_Set tr { line-height: 25px; }
    </style>
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <h3>প্রিন্ট কপি সেটিং (প্রিন্ট এর জন্য নির্বাচন করুন)</h3>

    <asp:FormView ID="PrintSettingFormView" DefaultMode="Edit" runat="server" DataSourceID="Print_settingSQL" DataKeyNames="InstitutionID" OnItemUpdated="PrintSettingFormView_ItemUpdated">
        <EditItemTemplate>
            <table class="Print_Set">
                <tr>
                    <td>দোকানের নাম</td>
                    <td>
                        <asp:CheckBox ID="Print_ShopNameCheckBox" runat="server" Checked='<%# Bind("Print_ShopName") %>' Text=" " />
                    </td>
                </tr>
                <tr>
                    <td>অতিরিক্ত(......)কপি</td>
                    <td>
                        <asp:CheckBox ID="Print_MasterCopyCheckBox" runat="server" Checked='<%# Bind("Print_MasterCopy") %>' Text=" " />
                    </td>
                </tr>
                <tr>
                    <td>কারিগর কপি</td>
                    <td>
                        <asp:CheckBox ID="Print_WorkmanCopyCheckBox" runat="server" Checked='<%# Bind("Print_WorkmanCopy") %>' Text=" " />
                    </td>
                </tr>
                <tr>
                    <td>দোকান কপি</td>
                    <td>
                        <asp:CheckBox ID="Print_ShopCopyCheckBox" runat="server" Checked='<%# Bind("Print_ShopCopy") %>' Text=" " />
                    </td>
                </tr>
                <tr>
                    <td>কাস্টমারের নাম</td>
                    <td>
                        <asp:CheckBox ID="Print_Customer_NameCheckBox" runat="server" Checked='<%# Bind("Print_Customer_Name") %>' Text=" " />
                    </td>
                </tr>
                <tr>
                    <td>নাম সহ মাপ</td>
                    <td>
                        <asp:CheckBox ID="Print_Measurement_NameCheckBox" runat="server" Checked='<%# Bind("Print_Measurement_Name") %>' Text=" " />
                    </td>
                </tr>
                <tr>
                    <td>ক্যাটাগরির নাম সহ স্টাইল</td>
                    <td>
                        <asp:CheckBox ID="Print_S_CategoryCheckBox" runat="server" Checked='<%# Bind("Print_S_Category") %>' Text=" " />
                    </td>
                </tr>
                <tr>
                    <td>উপরের স্পেস</td>
                    <td>
                        <asp:TextBox ID="Print_TopSpaceTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" Width="50px" CssClass="textbox" runat="server" Text='<%# Bind("Print_TopSpace") %>' />
                        px
                  <asp:RegularExpressionValidator ID="Rex" ControlToValidate="Print_TopSpaceTextBox" ValidationGroup="V" runat="server" ErrorMessage="0 থেকে 200 এর মধ্যে লিখুন" ValidationExpression="^([0-9]|[0-9][0-9]|[01][0-9][0-9]|20[0-0])$" CssClass="EroorSummer" />
                    </td>
                </tr>
                <tr>
                    <td>মাপের ফন্ট সাইজ</td>
                    <td>
                        <asp:DropDownList ID="FontSizeDropDownList" runat="server" CssClass="dropdown" Width="66px" Height="23px" SelectedValue='<%#Bind("Print_Font_Size") %>'>
                            <asp:ListItem Value="11">11 PX</asp:ListItem>
                            <asp:ListItem Value="12">12 PX</asp:ListItem>
                            <asp:ListItem Value="13">13 PX</asp:ListItem>
                            <asp:ListItem Value="14">14 PX</asp:ListItem>
                            <asp:ListItem Value="16">16 PX</asp:ListItem>
                            <asp:ListItem Value="18">18 PX</asp:ListItem>
                            <asp:ListItem Value="19">19 PX</asp:ListItem>
                            <asp:ListItem Value="20">20 PX</asp:ListItem>
                        </asp:DropDownList>
                    </td>
                </tr>
                <tr>
                    <td>ডিসকাউন্ট লিমিট</td>
                    <td>
                        <asp:TextBox ID="Discount_LimitTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" Width="50px" CssClass="textbox" runat="server" Text='<%# Bind("Discount_Limit") %>' />%
                    </td>
                </tr>
                <tr>
                    <td>&nbsp;</td>
                    <td>
                        <asp:LinkButton ID="UpdateButton" ToolTip="Save Setting" runat="server" CausesValidation="True" CommandName="Update" CssClass="Save_Button" ValidationGroup="V" />
                    </td>
                </tr>
            </table>
        </EditItemTemplate>
    </asp:FormView>
    <asp:SqlDataSource ID="Print_settingSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT InstitutionID, Print_Customer_Name, Print_MasterCopy, Print_WorkmanCopy, Print_ShopCopy, Print_TopSpace, Print_S_Category, Print_Measurement_Name, Print_ShopName, Print_Font_Size,Discount_Limit FROM Institution WHERE (InstitutionID = @InstitutionID)" UpdateCommand="UPDATE Institution SET Print_Font_Size = @Print_Font_Size, Print_ShopName = @Print_ShopName, Print_Customer_Name = @Print_Customer_Name, Print_MasterCopy = @Print_MasterCopy, Print_WorkmanCopy = @Print_WorkmanCopy, Print_ShopCopy = @Print_ShopCopy, Print_TopSpace = @Print_TopSpace, Print_S_Category = @Print_S_Category, Print_Measurement_Name = @Print_Measurement_Name, Discount_Limit = @Discount_Limit WHERE (InstitutionID = @InstitutionID)">
        <SelectParameters>
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
        </SelectParameters>
        <UpdateParameters>
            <asp:Parameter Name="Print_Font_Size" />
            <asp:Parameter Name="Print_ShopName" />
            <asp:Parameter Name="Print_Customer_Name" />
            <asp:Parameter Name="Print_MasterCopy" />
            <asp:Parameter Name="Print_WorkmanCopy" />
            <asp:Parameter Name="Print_ShopCopy" />
            <asp:Parameter Name="Print_TopSpace" />
            <asp:Parameter Name="Print_S_Category" />
            <asp:Parameter Name="Print_Measurement_Name" />
            <asp:Parameter Name="InstitutionID" />
            <asp:Parameter Name="Discount_Limit" />
        </UpdateParameters>
    </asp:SqlDataSource>

    <br />
    <br />
    <a href="../Order/Order.aspx">নতুন অর্ডার দিন</a>
    <script>
        function isNumberKey(a) { a = a.which ? a.which : event.keyCode; return 46 != a && 31 < a && (48 > a || 57 < a) ? !1 : !0 };
    </script>
</asp:Content>
