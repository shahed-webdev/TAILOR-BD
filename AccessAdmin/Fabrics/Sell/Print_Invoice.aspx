<%@ Page Title="" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Print_Invoice.aspx.cs" Inherits="TailorBD.AccessAdmin.Fabrics.Sell.Print_Invoice" %>

<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="asp" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
    <link href="../CSS/Receipt_Print.css" rel="stylesheet" />
    <style type="text/css">
        .auto-style1 { width: 100%; }
    </style>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <asp:ToolkitScriptManager ID="ToolkitScriptManager1" runat="server" />
    
    <asp:FormView ID="SellFormView" runat="server" DataKeyNames="FabricsSellingID" DataSourceID="SellSQL" Width="100%">
        <ItemTemplate>
            <a href="Fabrics_Selling.aspx" class="NoPrint"><< বিক্রি করুন</a>
            <a href="Selling_Records.aspx" class="NoPrint"><< বিক্রির রেকর্ড দেখুন</a>

            <asp:HiddenField ID="ShopName_HF" runat="server" Value='<%# Bind("Fab_M_Receipt_ShopName") %>' />
            <asp:HiddenField ID="M_Recept_Margin" runat="server" Value='<%# Bind("Fab_M_Receipt_TopSpace") %>' />

            <div id="Margin_Top">
                <div class="InsName" style="display: none">
                    <asp:Label ID="INLabel" runat="server" Text='<%# Bind("InstitutionName") %>' />
                </div>
                <div class="RNo">
                    <table>
                        <tr>
                            <td>
                                <asp:Label ID="NameLabel" runat="server" Text='<%# Eval("CustomerName") %>' />
                                <asp:Label ID="PhoneLabel" runat="server" Text='<%# Eval("Phone"," ({0})") %>' />
                                <asp:HiddenField ID="PhoneHf" Value='<%# Eval("Phone") %>' runat="server" />
                            </td>
                        </tr>
                    </table>

                    <table>
                        <tr>
                            <td>Receipt No:
                                <asp:Label ID="Selling_SNLabel" runat="server" Text='<%# Bind("Selling_SN") %>' />
                            </td>
                        </tr>
                        <tr>
                            <td>&nbsp;Selling Date:
                                <asp:Label ID="SellingDateLabel" runat="server" Text='<%# Bind("SellingDate","{0:d MMM yy}") %>' />
                            </td>
                        </tr>
                        <tr>
                            <td>&nbsp;</td>
                        </tr>
                    </table>
                </div>

                <asp:GridView ID="BuyingListGridView" runat="server" AutoGenerateColumns="False" CssClass="PrintGrid" DataSourceID="Fabric_Selling_ListSQL">
                    <Columns>
                        <asp:BoundField DataField="FabricCode" HeaderText="Code" SortExpression="FabricCode" />
                        <asp:BoundField DataField="FabricsName" HeaderText="Fabric" SortExpression="FabricsName" />
                        <asp:BoundField DataField="SellingQuantity" HeaderText="Quantity" SortExpression="SellingQuantity" />
                        <asp:BoundField DataField="SellingUnitPrice" HeaderText="Unit Price" SortExpression="SellingUnitPrice" />
                        <asp:BoundField DataField="SellingPrice" HeaderText="Total" SortExpression="SellingPrice" />
                    </Columns>
                    <HeaderStyle BackColor="#686868" BorderColor="#DDDDDD" />
                </asp:GridView>

                <table class="Total">
                    <tr>
                        <td>&nbsp;</td>
                    </tr>
                    <tr>
                        <td>Total:
                     <asp:Label ID="PriceLabel" runat="server" Text='<%# Bind("SellingTotalPrice") %>' />
                            /- </td>
                    </tr>
                    <tr class="Enabled_DC" style="display: none">
                        <td>Discount: 
                   (<asp:Label ID="DiscountPercentageLabel" runat="server" Text='<%# Bind("SellingDiscountPercentage") %>' />%)
                  <asp:Label ID="DiscountAmoutLabel" runat="server" Text='<%# Bind("SellingDiscountAmount") %>' />
                            /-
                        </td>
                    </tr>
                    <tr>
                        <td>Paid: 
                  <asp:Label ID="PaidLabel" runat="server" Text='<%# Bind("SellingPaidAmount") %>' />
                            /-
                        </td>
                    </tr>
                    <tr>
                        <td>Due: 
                  <asp:Label ID="DueLabel" runat="server" Text='<%# Bind("SellingDueAmount") %>' />
                            /-
                        </td>
                    </tr>
                </table>
            </div>
        </ItemTemplate>
    </asp:FormView>
    <asp:SqlDataSource ID="SellSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Fabrics_Selling.Selling_SN, Fabrics_Selling.SellingTotalPrice, Fabrics_Selling.SellingDiscountAmount, Fabrics_Selling.SellingDiscountPercentage, Fabrics_Selling.SellingPaidAmount - Fabrics_Selling.SellingReturnAmount AS SellingPaidAmount, Fabrics_Selling.SellingDueAmount, Fabrics_Selling.SellingDate, Institution.Fab_M_Receipt_ShopName, Institution.Fab_M_Receipt_TopSpace, Fabrics_Selling.FabricsSellingID, Institution.InstitutionName, Customer.CustomerName, Customer.Phone FROM Fabrics_Selling INNER JOIN Institution ON Fabrics_Selling.InstitutionID = Institution.InstitutionID LEFT OUTER JOIN Customer ON Fabrics_Selling.CustomerID = Customer.CustomerID WHERE (Fabrics_Selling.FabricsSellingID = @FabricsSellingID)">
        <SelectParameters>
            <asp:QueryStringParameter Name="FabricsSellingID" QueryStringField="FabricsSellingID" Type="Int32" />
        </SelectParameters>
    </asp:SqlDataSource>

    <asp:SqlDataSource ID="Fabric_Selling_ListSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Fabrics_Selling_List.SellingQuantity, Fabrics_Selling_List.SellingPrice, Fabrics.FabricsName, Fabrics_Selling_List.SellingUnitPrice, Fabrics.FabricCode FROM Fabrics_Selling_List INNER JOIN Fabrics ON Fabrics_Selling_List.FabricID = Fabrics.FabricID WHERE (Fabrics_Selling_List.FabricsSellingID = @FabricsSellingID)">
        <SelectParameters>
            <asp:QueryStringParameter Name="FabricsSellingID" QueryStringField="FabricsSellingID" />
        </SelectParameters>
    </asp:SqlDataSource>

    <asp:SqlDataSource ID="SMS_OtherInfoSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="INSERT INTO [SMS_OtherInfo] ([SMS_Send_ID], [InstitutionID], [CustomerID]) VALUES (@SMS_Send_ID, @InstitutionID, @CustomerID)" SelectCommand="SELECT * FROM [SMS_OtherInfo]">
        <InsertParameters>
            <asp:Parameter Name="SMS_Send_ID" DbType="Guid" />
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
            <asp:Parameter Name="CustomerID" Type="Int32" />
        </InsertParameters>
    </asp:SqlDataSource>
    <asp:Label ID="ErroLabel" runat="server" CssClass="EroorStar"></asp:Label>

    <div id="Receipt_Con" runat="server" style="display: none;" class="modalPopup">
        <div id="MHeader" class="Htitle">
            <b>মানি রিসিট প্রিন্ট সেটিং</b>
            <div id="MClose" class="PopClose"></div>
        </div>
        <asp:UpdatePanel ID="UpdatePanel1" runat="server">
            <ContentTemplate>
                <div class="Pop_Contain">
                    <b>প্রিন্ট এর জন্য নির্বাচন করুন</b>
                    <hr />
                    <asp:FormView ID="Money_Receipt_FormView" DefaultMode="Edit" runat="server" DataSourceID="Print_MoneyReceiptSQL" DataKeyNames="InstitutionID" OnItemUpdated="Money_Receipt_FormView_ItemUpdated">
                        <EditItemTemplate>
                            <table class="Print_Set">
                                <tr>
                                    <td>Shop Name</td>
                                    <td>
                                        <asp:CheckBox ID="M_Receipt_ShopNameCheckBox" runat="server" Checked='<%# Bind("Fab_M_Receipt_ShopName") %>' Text=" " />
                                    </td>
                                </tr>
                                <tr>
                                    <td>Top Space</td>
                                    <td>
                                        <asp:TextBox ID="M_Receipt_TopSpaceTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" Width="50px" CssClass="textbox" runat="server" Text='<%# Bind("Fab_M_Receipt_TopSpace") %>' />
                                        px
                              <asp:RegularExpressionValidator ID="Rex2" ControlToValidate="M_Receipt_TopSpaceTextBox" ValidationGroup="V" runat="server" ErrorMessage="0 থেকে 200 এর মধ্যে লিখুন" ValidationExpression="^([0-9]|[0-9][0-9]|[01][0-9][0-9]|20[0-0])$" CssClass="EroorSummer" />
                                    </td>
                                </tr>
                                <tr>
                                    <td>&nbsp;</td>
                                    <td>&nbsp;</td>
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
                    <asp:SqlDataSource ID="Print_MoneyReceiptSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT InstitutionID, Fab_M_Receipt_ShopName,Fab_M_Receipt_TopSpace FROM Institution WHERE (InstitutionID = @InstitutionID)" UpdateCommand="UPDATE Institution SET Fab_M_Receipt_ShopName = @Fab_M_Receipt_ShopName, Fab_M_Receipt_TopSpace = @Fab_M_Receipt_TopSpace WHERE (InstitutionID = @InstitutionID)">
                        <SelectParameters>
                            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                        </SelectParameters>
                        <UpdateParameters>
                            <asp:Parameter Name="Fab_M_Receipt_ShopName" />
                            <asp:Parameter Name="Fab_M_Receipt_TopSpace" />
                            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                        </UpdateParameters>
                    </asp:SqlDataSource>
                </div>
            </ContentTemplate>
        </asp:UpdatePanel>
        <asp:HiddenField ID="MHiddenField" runat="server" Value="0" />
        <asp:ModalPopupExtender ID="R_MPE" runat="server"
            TargetControlID="MHiddenField"
            PopupControlID="Receipt_Con"
            CancelControlID="MClose"
            BehaviorID="M_Receipt"
            BackgroundCssClass="modalBackground"
            PopupDragHandleControlID="MHeader" />
    </div>

    <asp:TextBox ID="PhoneTextBox" placeholder="Mobile Number" CssClass="textbox" runat="server"></asp:TextBox>

    <asp:Button ID="SMSButton" ValidationGroup="1" runat="server" Text="Send SMS" OnClick="SMSButton_Click" CssClass="ContinueButton NoPrint" />
    <asp:RegularExpressionValidator ID="RegularExpressionValidator1" runat="server" ControlToValidate="PhoneTextBox" CssClass="EroorSummer" ErrorMessage="Invalid" ValidationExpression="(88)?((011)|(015)|(016)|(017)|(018)|(019)|(013)|(014))\d{8,8}" ValidationGroup="1"></asp:RegularExpressionValidator>

    <asp:LinkButton ID="M_ReceiptLinkButton" CssClass="Setting" Text="মানি রিসিট প্রিন্ট সেটিং" runat="server" OnClientClick="return M_Receipt()" />
     <button type="submit" onclick="window.print()" class="print" />

    <script>
        if ($("[id*=DiscountAmoutLabel]").text() != "0") {
            $(".Enabled_DC").show();
        }
        function M_Receipt() { $find("M_Receipt").show(); return !1 };

        /*Money Receipt*/
        $(function () {
            $("#Margin_Top").css("margin-top", $("[id*=M_Recept_Margin]").val() + "px");

            if ($("[id*=ShopName_HF]").val() == "True") {
                $(".InsName").show();
            }

        });
    </script>
</asp:Content>
