<%@ Page Title="" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Supplier_Details.aspx.cs" Inherits="TailorBD.AccessAdmin.Fabrics.Supplier.Supplier_Details" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
    <style>
        .SupplierDetails { height: 60px; }
            .SupplierDetails ul { padding: 0; margin: 0; }
            .SupplierDetails li { list-style: none; float: left; font-size: 15px; border: 1px solid #ddd; margin: 8px 8px 0 0; padding: 8px 10px; }
        .RowColor { background-color: #ff0000; }
    </style>
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <asp:ScriptManager ID="ScriptManager1" runat="server"></asp:ScriptManager>
    <h3>Supplier Details</h3>
    <a href="Add_Supplier.aspx"><< Back To Supplier List</a>

    <asp:FormView ID="SupplierFormView" runat="server" DataSourceID="SupplierSQL">
        <ItemTemplate>
            <div class="SupplierDetails">
                <ul>
                    <li>
                        <asp:Label ID="SupplierCompanyNameLabel" runat="server" Text='<%# Bind("SupplierCompanyName") %>' /></li>
                    <li>Supplier:
         <asp:Label ID="SupplierNameLabel" runat="server" Text='<%# Bind("SupplierName") %>' />
                    </li>
                    <li>Phone:
         <asp:Label ID="SupplierPhoneLabel" runat="server" Text='<%# Bind("SupplierPhone") %>' />
                    </li>
                    <li>Address:
         <asp:Label ID="SupplierAddressLabel" runat="server" Text='<%# Bind("SupplierAddress") %>' />
                    </li>
                </ul>
            </div>
        </ItemTemplate>
    </asp:FormView>

    <asp:SqlDataSource ID="SupplierSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT [SupplierName], [SupplierPhone], [SupplierAddress], [SupplierCompanyName] FROM [Fabrics_Supplier] WHERE (([InstitutionID] = @InstitutionID) AND ([FabricsSupplierID] = @FabricsSupplierID))">
        <SelectParameters>
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
            <asp:Parameter Name="FabricsSupplierID" Type="Int32" />
        </SelectParameters>
    </asp:SqlDataSource>


    <asp:UpdatePanel ID="UpdatePanel1" runat="server">
        <ContentTemplate>
            <asp:GridView ID="DUeGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="FabricBuyingID,BuyingDueAmount" DataSourceID="Due_PaidSQL" ShowFooter="True">
                <Columns>
                    <asp:BoundField DataField="Buying_SN" HeaderText="Receipt No" SortExpression="Buying_SN" />
                    <asp:BoundField DataField="BuyingTotalPrice" HeaderText="Total Price" SortExpression="BuyingTotalPrice" />
                    <asp:BoundField DataField="BuyingDiscountAmount" HeaderText="Discount" SortExpression="BuyingDiscountAmount" />
                    <asp:BoundField DataField="BuyingReturnAmount" HeaderText="Return Amount" SortExpression="BuyingReturnAmount" />
                    <asp:BoundField DataField="BuyingPaidAmount" HeaderText="Paid" SortExpression="BuyingPaidAmount" />
                    <asp:TemplateField HeaderText="Due" SortExpression="BuyingDueAmount">
                        <FooterTemplate>
                            <label id="G_total"></label>
                        </FooterTemplate>
                        <ItemTemplate>
                            <asp:Label ID="DueAmountLabel" runat="server" Text='<%# Bind("BuyingDueAmount") %>'></asp:Label>
                            Tk<br />
                            <asp:TextBox ID="DuePaidTextBox" runat="server" placeholder="Enter Paid Amount" CssClass="textbox" Width="150px" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false"></asp:TextBox>
                        </ItemTemplate>
                    </asp:TemplateField>
                    <asp:BoundField DataField="BillNo" HeaderText="Bill No" SortExpression="BillNo" />
                    <asp:BoundField DataField="BuyingDate" DataFormatString="{0:d MMM yyyy}" HeaderText="Date" SortExpression="BuyingDate" />
                </Columns>
            </asp:GridView>
            <asp:SqlDataSource ID="Due_PaidSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT FabricBuyingID, Buying_SN, BuyingTotalPrice, BuyingDiscountAmount, BuyingPaidAmount, BuyingReturnAmount, BuyingDueAmount, BillNo, BuyingDate 
FROM Fabrics_Buying WHERE(FabricsSupplierID = @FabricsSupplierID) AND (BuyingPaymentStatus = 'Due') AND (InstitutionID = @InstitutionID)">
                <SelectParameters>
                    <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                    <asp:Parameter Name="FabricsSupplierID" />
                </SelectParameters>
            </asp:SqlDataSource>
            <br />
            <table class="Hide">
                <tr>
                    <%System.Data.DataView DetailsDV = new System.Data.DataView();
                        DetailsDV = (System.Data.DataView)AccountSQL.Select(DataSourceSelectArguments.Empty);
                        if (DetailsDV.Count > 0)
                        {%>
                    <td>
                        <asp:DropDownList ID="AccountDropDownList" runat="server" CssClass="dropdown" DataSourceID="AccountSQL" DataTextField="AccountName" DataValueField="AccountID" OnDataBound="AccountDropDownList_DataBound">
                        </asp:DropDownList>

                        <asp:SqlDataSource ID="AccountSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT AccountID,AccountName  FROM Account WHERE (InstitutionID = @InstitutionID)">
                            <SelectParameters>
                                <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                            </SelectParameters>
                        </asp:SqlDataSource>
                    </td>
                    <%} %>
                    <td>
                        <asp:Button ID="PaidDueAmountButton" runat="server" Text="Pay" OnClick="PaidDueAmountButton_Click" CssClass="ContinueButton" /></td>
                </tr>
            </table>

            <asp:SqlDataSource ID="Buying_PaymentRecordSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                InsertCommand="INSERT INTO [Fabrics_Buying_PaymentRecord] ([InstitutionID], [FabricBuyingID], [RegistrationID], [FabricsSupplierID], [BuyingPaidAmount], [AccountID], [Payment_Situation]) VALUES (@InstitutionID, @FabricBuyingID, @RegistrationID, @FabricsSupplierID, @BuyingPaidAmount, @AccountID, @Payment_Situation)"
                SelectCommand="SELECT * FROM [Fabrics_Buying_PaymentRecord]">
                <InsertParameters>
                    <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                    <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                    <asp:Parameter Name="Payment_Situation" Type="String" DefaultValue="Supplier Due Paid" />
                    <asp:ControlParameter ControlID="AccountDropDownList" DefaultValue="" Name="AccountID" PropertyName="SelectedValue" Type="Int32" />
                    <asp:Parameter Name="FabricsSupplierID" Type="Int32" />
                    <asp:Parameter Name="FabricBuyingID" Type="Int32" />
                    <asp:Parameter Name="BuyingPaidAmount" DefaultValue="" Type="Double" />
                </InsertParameters>
            </asp:SqlDataSource>
        </ContentTemplate>
    </asp:UpdatePanel>
    <script>
        function isNumberKey(a) { a = a.which ? a.which : event.keyCode; return 46 != a && 31 < a && (48 > a || 57 < a) ? !1 : !0 };

        //Disable the submit button after clicking
        $("form").submit(function () {
            $("[id*=PaidDueAmountButton]").attr("disabled", true);
            setTimeout(function () {
                $("[id*=PaidDueAmountButton]").prop('disabled', false);
            }, 2000); // 2 seconds
        })

        $(function () {
            //GridView is empty
            if (!$('[id*=DUeGridView] tr').length) {
                $(".Hide").hide();
            }
            var grandTotal = 0;
            $("[id*=DueAmountLabel]").each(function () {
                grandTotal = grandTotal + parseFloat($(this).html());
            });
            $("#G_total").html("Total: "+grandTotal.toString()+" Tk");
        });


        Sys.WebForms.PageRequestManager.getInstance().add_endRequest(function (a, b) {
            //GridView is empty
            if (!$('[id*=DUeGridView] tr').length) {
                $(".Hide").hide();
            }

            var grandTotal = 0;
            $("[id*=DueAmountLabel]").each(function () {
                grandTotal = grandTotal + parseFloat($(this).html());
            });
            $("#G_total").html("Total: " + grandTotal.toString() + " Tk");
        });
    </script>
</asp:Content>
