<%@ Page Title="" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="MoneyReceipt.aspx.cs" Inherits="TailorBD.AccessAdmin.Order.MoneyReceipt" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
    <link href="CSS/FinishOrder.css" rel="stylesheet" />
    <link href="../../JS/DatePicker/jquery.datepick.css" rel="stylesheet" />
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <div id="RD">
        <h3>বিলের বিস্তারিত বিবরণ.
         <asp:LinkButton ID="AddMoreDressButton" runat="server" OnClick="AddMoreDressButton_Click">[এই অর্ডারে আরো পোষাক যুক্ত করুন >>]</asp:LinkButton></h3>
    </div>
    <asp:FormView ID="CustomerDetails" runat="server" DataSourceID="OrderSerialSQL" DataKeyNames="CustomerID" Width="100%">
        <ItemTemplate>
            <div class="Personal_Info">
                <div class="Profile_Image">
                    <img alt="No Image" src="../../Handler/Customer.ashx?Img=<%# Eval("CustomerID") %>" class="P_Image" />
                </div>
                <div class="Info">
                    <ul>
                        <li>(<asp:Label ID="CNLabel" runat="server" Text='<%# Eval("CustomerNumber") %>' Font-Bold="True" />)
                                <asp:Label ID="CustomerNameLabel" runat="server" Text='<%# Eval("CustomerName") %>' />
                        </li>

                        <li>অর্ডার নং:
                            <asp:Label ID="OrderSerialNumberLabel" runat="server" Text='<%# Eval("OrderSerialNumber") %>' Font-Bold="True" />
                        </li>


                        <li>মোবাইল:
                            <asp:Label ID="PhoneLabel" runat="server" Text='<%# Eval("Phone") %>' />
                        </li>

                        <li>ঠিকানা:
                            <asp:Label ID="AddressLabel" runat="server" Text='<%# Eval("Address") %>' />
                        </li>
                    </ul>
                </div>
            </div>
        </ItemTemplate>
    </asp:FormView>
    <asp:SqlDataSource ID="OrderSerialSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT [Order].OrderSerialNumber, Customer.CustomerID, Customer.RegistrationID, Customer.InstitutionID, Customer.Cloth_For_ID, Customer.CustomerNumber, Customer.CustomerName, Customer.Phone, Customer.Address, Customer.Image, Customer.Date FROM [Order] INNER JOIN Customer ON [Order].CustomerID = Customer.CustomerID WHERE ([Order].OrderID = @OrderID) AND (Customer.InstitutionID = @InstitutionID)">
        <SelectParameters>
            <asp:QueryStringParameter Name="OrderID" QueryStringField="OrderID" Type="Int32" />
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
        </SelectParameters>
    </asp:SqlDataSource>

    <asp:GridView ID="OrderDetailsGridView" runat="server" AutoGenerateColumns="False" DataSourceID="OrderDetailsSQL" CssClass="mGrid">
        <Columns>
            <asp:TemplateField HeaderText="Dress">
                <ItemTemplate>
                    (<asp:Label ID="Label2" runat="server" Text='<%# Bind("DressQuantity") %>' />)
               <asp:Label ID="Label1" runat="server" Text='<%# Bind("Dress_Name") %>' />
                </ItemTemplate>
            </asp:TemplateField>

            <asp:BoundField DataField="Details" HeaderText="Details" />
            <asp:BoundField DataField="Unit" HeaderText="Unit" />
            <asp:BoundField DataField="UnitPrice" HeaderText="Unit Price" />
            <asp:BoundField DataField="Amount" HeaderText="Total" />
        </Columns>
    </asp:GridView>
    <asp:SqlDataSource ID="OrderDetailsSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Dress.Dress_Name, OrderList.DressQuantity, Order_Payment.Unit, Order_Payment.UnitPrice, Order_Payment.Details, Order_Payment.Amount FROM OrderList INNER JOIN Dress ON OrderList.DressID = Dress.DressID LEFT OUTER JOIN Order_Payment ON OrderList.OrderListID = Order_Payment.OrderListID WHERE (Order_Payment.OrderID = @OrderID) AND (Order_Payment.InstitutionID = @InstitutionID)">
        <SelectParameters>
            <asp:QueryStringParameter Name="OrderID" QueryStringField="OrderID" Type="Int32" />
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
        </SelectParameters>
    </asp:SqlDataSource>

    <asp:FormView ID="TotalTkFormView" runat="server" DataSourceID="TotalPaybleSQL" DataKeyNames="OrderID" Width="100%">
        <ItemTemplate>
            <asp:HiddenField ID="DiscountLabel" runat="server" Value='<%# Eval("Discount") %>' />
            <asp:HiddenField ID="DueAmountLabel" runat="server" Value='<%# Eval("DueAmount") %>' />
            <asp:HiddenField ID="DeliveryDateHF" runat="server" Value='<%# Eval("DeliveryDate","{0:d MMMM yyyy}") %>' />
            <div class="Summry">
                <ul>
                    <li>সর্বমোট টাকা:
                <asp:Label ID="OrderAmountLabel" runat="server" Text='<%# Eval("OrderAmount") %>' />
                        /-</li>

                    <li>পূর্বে দেওয়া:
                <asp:Label ID="PaidAmountLabel" runat="server" Text='<%# Eval("PaidAmount") %>' />
                        /-</li>
                </ul>
            </div>
            <asp:HiddenField ID="Dis_Limit_HF" runat="server" Value='<%# Eval("Limit_Amount") %>'/>
            <asp:HiddenField ID="Discount_Limit" runat="server" Value='<%# Eval("Discount_Limit") %>'/>
        </ItemTemplate>
    </asp:FormView>

    <table>
        <tr>
            <td class="Title_R">ডিসকাউন্ট:</td>
            <td>
                <asp:TextBox ID="DiscountTextBox" runat="server" CssClass="textbox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false"></asp:TextBox>
                <label id="Max_Discount" class="EroorSummer"></label>
            </td>
        </tr>
        <tr>
            <td class="Title_R">অগ্রিম টাকা:</td>
            <td>
                <asp:TextBox ID="PaidAmounTextBox" runat="server" CssClass="textbox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false"></asp:TextBox>


                <asp:Label ID="MsgLabel" runat="server" CssClass="Amount_Msg"></asp:Label>

            </td>
        </tr>
        <tr>
            <td class="Title_R">ডেলিভারী তারিখ:</td>
            <td>
                <asp:TextBox ID="DelevaryDateTextBox" runat="server" CssClass="Datetime" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false"></asp:TextBox>
                <label id="EDate" style="color: red;" />
            </td>
        </tr>

        <%System.Data.DataView DetailsDV = new System.Data.DataView();
            DetailsDV = (System.Data.DataView)AccountSQL.Select(DataSourceSelectArguments.Empty);
            if (DetailsDV.Count > 0)
            {%>
        <tr>
            <td class="Title_R">অ্যাকাউন্ট</td>
            <td>
                <asp:DropDownList ID="AccountDropDownList" runat="server" CssClass="dropdown" DataSourceID="AccountSQL" DataTextField="AccountName" DataValueField="AccountID" OnDataBound="AccountDropDownList_DataBound" Width="156px">
                </asp:DropDownList>
                <asp:SqlDataSource ID="AccountSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT AccountID, AccountName  FROM Account WHERE (InstitutionID = @InstitutionID)">
                    <SelectParameters>
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                    </SelectParameters>
                </asp:SqlDataSource>
            </td>
        </tr>
        <%}%>

        <tr>
            <td colspan="2">


                <asp:Label ID="ErrorLabel" runat="server" CssClass="EroorSummer"></asp:Label>

            </td>
        </tr>
        <tr>
            <td>&nbsp;</td>
            <td>
                <asp:Button ID="SubmtButton" runat="server" OnClick="SubmtButton_Click" Text="পরবর্তী ধাপ" CssClass="ContinueButton" ValidationGroup="1" OnClientClick="return CheckDate();" />
            </td>
        </tr>
    </table>


    <asp:SqlDataSource ID="PaymentRecordSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
        InsertCommand="INSERT INTO [Payment_Record] ([OrderID], [CustomerID], [RegistrationID], [InstitutionID], [Amount], Payment_TimeStatus,AccountID) VALUES (@OrderID, (SELECT CustomerID FROM [Order] WHERE (OrderID = @OrderID)), @RegistrationID, @InstitutionID, @Amount,'Advance',@AccountID)" SelectCommand="SELECT * FROM [Payment_Record]">
        <InsertParameters>
            <asp:QueryStringParameter Name="OrderID" QueryStringField="OrderID" Type="Int32" />
            <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
            <asp:ControlParameter ControlID="AccountDropDownList" Name="AccountID" PropertyName="SelectedValue" />
            <asp:ControlParameter ControlID="PaidAmounTextBox" Name="Amount" PropertyName="Text" Type="Double" />
        </InsertParameters>
    </asp:SqlDataSource>
    <asp:SqlDataSource ID="OrderUpdetSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM [Order]" UpdateCommand="UPDATE [Order] SET DeliveryDate = @DeliveryDate, Discount = @Discount WHERE (OrderID = @OrderID)">
        <UpdateParameters>
            <asp:ControlParameter ControlID="DelevaryDateTextBox" DbType="Date" Name="DeliveryDate" PropertyName="Text" DefaultValue="" />
            <asp:ControlParameter ControlID="DiscountTextBox" Name="Discount" PropertyName="Text" Type="Double" DefaultValue="0" />
            <asp:QueryStringParameter Name="OrderID" QueryStringField="OrderID" Type="Int32" />
        </UpdateParameters>
    </asp:SqlDataSource>
    <asp:SqlDataSource ID="TotalPaybleSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT [Order].OrderAmount, [Order].OrderID, [Order].InstitutionID, [Order].DueAmount, [Order].PaidAmount, [Order].Discount, [Order].DeliveryDate,Institution.Discount_Limit, (Institution.Discount_Limit * [Order].OrderAmount / 100) AS Limit_Amount FROM [Order] INNER JOIN Institution ON [Order].InstitutionID = Institution.InstitutionID WHERE ([Order].OrderID = @OrderID) AND ([Order].InstitutionID = @InstitutionID)">
        <SelectParameters>
            <asp:QueryStringParameter Name="OrderID" QueryStringField="OrderID" Type="Int32" />
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
        </SelectParameters>
    </asp:SqlDataSource>


    <script src="../../JS/DatePicker/jquery.datepick.js"></script>
    <script type="text/javascript">
        $(function () {
            $(".Datetime").datepick();
            $("[id*=MsgLabel]").text("বাকি " + $("[id*=DueAmountLabel]").val() + " টাকা"); $("[id*=DiscountTextBox]").val($("[id*=DiscountLabel]").val()); $("[id*=DelevaryDateTextBox]").val($("[id*=DeliveryDateHF]").val());
        });

        /***Disable Browser Back Button****/
        function noBack() { window.history.forward() } noBack(); window.onload = noBack; window.onpageshow = function (a) { a.persisted && noBack() }; window.onunload = function () { void 0 };
        function isNumberKey(a) { a = a.which ? a.which : event.keyCode; return 46 != a && 31 < a && (48 > a || 57 < a) ? !1 : !0 };
        /***Delivery Date****/
        function CheckDate() { return "" == $("[id*=DelevaryDateTextBox]").val() ? ($('#EDate').text("ডেলিভারী তারিখ দিন"), !1) : !0 };
        $("[id*=DelevaryDateTextBox]").focus(function () { $("[id*=EDate").text("") });


        $("[id*=DiscountTextBox]").keyup(function () {
            var b, a, c, d, p;
            a = parseFloat($("[id*=DueAmountLabel]").val());
            b = parseFloat($("[id*=DiscountTextBox]").val());
            d = parseFloat($("[id*=DiscountLabel]").val());
            "" == $("[id*=DiscountTextBox]").val() && (b = 0); "" == $("[id*=PaidAmounTextBox]").val() && ($("[id*=PaidAmounTextBox]").val("0"));

            p = parseFloat($("[id*=PaidAmounTextBox]").val());

            c = (a + d) - (b + p);

            (a + d) < b ? ($("[id*=SubmtButton]").prop("disabled", !0).removeClass("ContinueButton"), $("[id*=DiscountTextBox]").css("border-color", "red"), $("[id*=MsgLabel]").text("মোট বাকি " + (a + d) + " টাকা। আপনি ডিসকাউন্ট দিয়েছেন " + b + " টাকা")) : ($("[id*=SubmtButton]").prop("disabled", !1).addClass("ContinueButton"),
            $("[id*=DiscountTextBox]").css("border-color", "#b6b6b6"), $("[id*=PaidAmounTextBox]").css("border-color", "#b6b6b6"), $("[id*=MsgLabel]").text("বাকি থাকছে " + c + " টাকা"));

            //Discount Limit
            var DisLimit = parseFloat($("[id*=Dis_Limit_HF]").val());
            if (DisLimit >= b) {
                $("[id*=SubmtButton]").prop("disabled", !1).addClass("ContinueButton");
                $("#Max_Discount").text("");
            }
            else {
                $("[id*=SubmtButton]").prop("disabled", !0).removeClass("ContinueButton");
                $("#Max_Discount").text("ডিসকাউন্ট লিমিট: (" + $("[id*=Discount_Limit]").val() + "%) " + DisLimit + " Tk.");
            }

        });

        $("[id*=PaidAmounTextBox]").keyup(function () {
            var a, b, c, d;
            b = parseFloat($("[id*=DueAmountLabel]").val());
            a = parseFloat($("[id*=DiscountTextBox]").val());
            c = parseFloat($("[id*=PaidAmounTextBox]").val());
            d = parseFloat($("[id*=DiscountLabel]").val());

            "" == $("[id*=DiscountTextBox]").val() && (a = 0); "" == $("[id*=PaidAmounTextBox]").val() && (c = 0);
            (b + d) < (a + c) ? ($("[id*=SubmtButton]").prop("disabled", !0).removeClass("ContinueButton"), $("[id*=PaidAmounTextBox]").css("border-color", "red"), $("[id*=MsgLabel]").text("মোট বাকি " + (b + d - a) + " টাকা। আপনি দিয়েছেন " + (c) + " টাকা")) : ($("[id*=SubmtButton]").prop("disabled", !1).addClass("ContinueButton"), $("[id*=PaidAmounTextBox]").css("border-color", "#b6b6b6"), $("[id*=MsgLabel]").text("বাকি থাকছে " + ((b + d) - (a + c)) + " টাকা"));
        });
    </script>
</asp:Content>
