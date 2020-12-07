<%@ Page Title="" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="DeliveryComplete.aspx.cs" Inherits="TailorBD.AccessAdmin.Delivery.DeliveryComplete" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
    <link href="../CSS/DeliveryComplete.css" rel="stylesheet" />
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <h3>ডেলিভারী সম্পূন্ন করুন</h3>

    <asp:FormView ID="CustomerFormView" runat="server" DataSourceID="OrderSerialSQL" DataKeyNames="CustomerID" Width="100%">
        <ItemTemplate>
            <div class="Personal_Info">

                <div class="Profile_Image">
                    <img alt="No Image" src="../../Handler/Customer.ashx?Img=<%# Eval("CustomerID") %>" class="P_Image" />
                </div>

                <div class="Info">
                    <ul>
                        <li>অর্ডার নং:
                         <asp:Label ID="OrderSerialNumberLabel" runat="server" Text='<%# Eval("OrderSerialNumber") %>' Font-Bold="true" />
                        </li>
                        <li>(<asp:Label ID="CustomerNumberLabel" runat="server" Text='<%# Eval("CustomerNumber") %>' Font-Bold="true" />)
                           <asp:Label ID="CustomerNameLabel" runat="server" Text='<%# Eval("CustomerName") %>' />
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
    <asp:SqlDataSource ID="OrderSerialSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT [Order].OrderSerialNumber, Customer.* FROM [Order] INNER JOIN Customer ON [Order].CustomerID = Customer.CustomerID WHERE ([Order].OrderID = @OrderID)">
        <SelectParameters>
            <asp:QueryStringParameter Name="OrderID" QueryStringField="OrderID" Type="Int32" />
        </SelectParameters>
    </asp:SqlDataSource>

    <asp:GridView ID="OrderDetailsGridView" runat="server" AutoGenerateColumns="False" DataKeyNames="OrderListID" DataSourceID="OrderDetailsSQL" CssClass="mGrid">
        <Columns>
            <asp:BoundField DataField="OrderList_SN" HeaderText="অর্ডার লিস্ট নং" SortExpression="OrderList_SN" />
            <asp:BoundField DataField="Dress_Name" HeaderText="পোষাক" SortExpression="Dress_Name" />
            <asp:TemplateField HeaderText="টাকা" SortExpression="OrderListAmount">
              <ItemTemplate>
                <asp:HiddenField ID="OrderListIDHiddenField" runat="server" Value='<%# Eval("OrderListID") %>'/>
                <asp:GridView ID="AmountDetailsGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataSourceID="AmountDetailsSQL" ShowHeader="False">
                  <Columns>
                    <asp:BoundField DataField="Details" HeaderText="Details" SortExpression="Details" />
                    <asp:BoundField DataField="Amount" HeaderText="Amount" SortExpression="Amount" />
                  </Columns>
                </asp:GridView>
                <asp:SqlDataSource ID="AmountDetailsSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Amount, Details FROM Order_Payment WHERE (OrderListID = @OrderListID)">
                  <SelectParameters>
                    <asp:ControlParameter ControlID="OrderListIDHiddenField" Name="OrderListID" PropertyName="Value" />
                  </SelectParameters>
                </asp:SqlDataSource>
              </ItemTemplate>
            </asp:TemplateField>
            <asp:BoundField DataField="DressQuantity" HeaderText="মোট পোষাক" SortExpression="DressQuantity" />
            <asp:TemplateField HeaderText="রেডি পোষাক" SortExpression="ReadyForDeliveryQuantity">
              <ItemTemplate>
                <asp:TextBox ID="ReadyForDeliveryTextBox" runat="server" Text='<%# Bind("ReadyForDeliveryQuantity") %>' CssClass="textbox" Width="50px"></asp:TextBox>
              </ItemTemplate>
            </asp:TemplateField>
            <asp:BoundField DataField="DeliveryQuantity" HeaderText="পূর্বে  ডেলিভারী হয়েছে" SortExpression="DeliveryQuantity" />
        </Columns>
    </asp:GridView>
    <asp:SqlDataSource ID="OrderDetailsSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT OrderList.OrderListID, OrderList.OrderList_SN, Dress.Dress_Name, OrderList.OrderListAmount, OrderList.DressQuantity, OrderList.ReadyForDeliveryQuantity, OrderList.DeliveryQuantity FROM OrderList INNER JOIN Dress ON OrderList.DressID = Dress.DressID WHERE (OrderList.OrderID = @OrderID) AND (OrderList.InstitutionID = @InstitutionID) AND (OrderList.ReadyForDeliveryQuantity &lt;&gt; 0)">
        <SelectParameters>
            <asp:QueryStringParameter Name="OrderID" QueryStringField="OrderID" Type="Int32" />
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
        </SelectParameters>
    </asp:SqlDataSource>
    <asp:FormView ID="TotalFormView" runat="server" DataSourceID="TotalPaybleSQL" DataKeyNames="OrderID" Width="100%" CssClass="Hide">
        <ItemTemplate>
            <asp:HiddenField ID="Discount_HF" Value='<%# Eval("Discount") %>' runat="server" />
              <asp:HiddenField ID="DueAmountLabel" runat="server" Value='<%# Eval("DueAmount") %>'/>
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

    <table class="Hide">
        <tr>
            <td class="Title_R">ডিসকাউন্ট: </td>
            <td>
                <asp:TextBox ID="DiscountTextBox" runat="server" CssClass="textbox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false"></asp:TextBox>
                <label id="Max_Discount" class="EroorSummer"></label>
            </td>
        </tr>
        <tr>
            <td class="Title_R">বাকি:</td>
            <td style="text-align: right">
                <asp:TextBox ID="PaidAmounTextBox" runat="server" CssClass="textbox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false"></asp:TextBox>


                <asp:Label ID="MsgLabel" runat="server" CssClass="Amount_Msg"></asp:Label>

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
            <td>&nbsp;</td>
            <td>&nbsp;</td>
        </tr>

        <tr>
            <td>&nbsp;</td>
            <td>
                <asp:Button ID="SubmtButton" runat="server" OnClick="SubmtButton_Click" Text="ডেলিভারী সম্পূন্ন" ValidationGroup="1" CssClass="ContinueButton" />
            </td>
        </tr>
    </table>

    <asp:SqlDataSource ID="TotalPaybleSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT [Order].OrderAmount, [Order].OrderID, [Order].PaidAmount, [Order].DueAmount, [Order].Discount,Institution.Discount_Limit, (Institution.Discount_Limit * [Order].OrderAmount / 100) AS Limit_Amount FROM [Order] INNER JOIN Institution ON [Order].InstitutionID = Institution.InstitutionID WHERE ([Order].OrderID = @OrderID) AND ([Order].InstitutionID = @InstitutionID)">
        <SelectParameters>
            <asp:QueryStringParameter Name="OrderID" QueryStringField="OrderID" Type="Int32" />
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
        </SelectParameters>
    </asp:SqlDataSource>
    <asp:SqlDataSource ID="PaymentRecordSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" 
        SelectCommand="SELECT * FROM [Payment_Record]" 
        InsertCommand="INSERT INTO Payment_Record(OrderID, Amount, InstitutionID, RegistrationID, CustomerID,Payment_TimeStatus,AccountID) VALUES (@OrderID, @Amount, @InstitutionID, @RegistrationID, (SELECT CustomerID FROM [Order] WHERE (OrderID = @OrderID)),'Delivery',@AccountID)">
        <InsertParameters>
            <asp:QueryStringParameter Name="OrderID" QueryStringField="OrderID" />
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
            <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" />
            <asp:ControlParameter ControlID="PaidAmounTextBox" Name="Amount" PropertyName="Text" />
            <asp:ControlParameter ControlID="AccountDropDownList" Name="AccountID" PropertyName="SelectedValue" />
        </InsertParameters>
    </asp:SqlDataSource>
    <asp:SqlDataSource ID="OrderDiscountUpdetSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM [Order]" UpdateCommand="UPDATE [Order] SET Discount = @Discount WHERE (OrderID = @OrderID) AND (InstitutionID = @InstitutionID)">
        <UpdateParameters>
            <asp:ControlParameter ControlID="DiscountTextBox" DefaultValue="0" Name="Discount" PropertyName="Text" />
            <asp:QueryStringParameter Name="OrderID" QueryStringField="OrderID" Type="Int32" />
            <asp:CookieParameter CookieName="InstitutionID" DefaultValue="" Name="InstitutionID" />
        </UpdateParameters>
    </asp:SqlDataSource>

    <asp:SqlDataSource ID="Order_Delivery_DateSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM OrderList" InsertCommand="INSERT INTO Order_Delivery_Date(InstitutionID, RegistrationID, OrderID, OrderListID, DQuantity) VALUES (@InstitutionID, @RegistrationID, @OrderID, @OrderListID, @DQuantity)">
       <InsertParameters>
          <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
          <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" />
          <asp:QueryStringParameter Name="OrderID" QueryStringField="OrderID" />
          <asp:Parameter Name="OrderListID" />
          <asp:Parameter Name="DQuantity" />
       </InsertParameters>
    </asp:SqlDataSource>

    <script>
        function noBack() { window.history.forward() } noBack(); window.onload = noBack; window.onpageshow = function (a) { a.persisted && noBack() }; window.onunload = function () { void 0 };
        function isNumberKey(a) { a = a.which ? a.which : event.keyCode; return 46 != a && 31 < a && (48 > a || 57 < a) ? !1 : !0 };
        $(document).ready(function () { $("[id*=MsgLabel]").text("বাকি থাকছে 0.00 টাকা"); $("[id*=DiscountTextBox]").val($("[id*=Discount_HF]").val()); $("[id*=PaidAmounTextBox]").val($("[id*=DueAmountLabel]").val()) });

        $("[id*=DiscountTextBox]").keyup(function () {
            var b, a, c, d;
            a = parseFloat($("[id*=DueAmountLabel]").val());
            b = parseFloat($("[id*=DiscountTextBox]").val());
            d = parseFloat($("[id*=Discount_HF]").val());


            "" == $("[id*=DiscountTextBox]").val() && (b = 0); "" == $("[id*=PaidAmounTextBox]").val() && ($("[id*=PaidAmounTextBox]").val("0"));
            c = a + d - b;
            $("[id*=PaidAmounTextBox]").val(c);

            (a + d) < b ? ($("[id*=PaidAmounTextBox]").val(a), $("[id*=SubmtButton]").prop("disabled", !0).removeClass("ContinueButton"), $("[id*=DiscountTextBox]").css("border-color", "red"), $("[id*=MsgLabel]").text("মোট বাকি " + (a + d) + " টাকা। আপনি ডিসকাউন্ট দিয়েছেন " + b + " টাকা")) : ($("[id*=SubmtButton]").prop("disabled", !1).addClass("ContinueButton"),
            $("[id*=DiscountTextBox]").css("border-color", "#b6b6b6"), $("[id*=PaidAmounTextBox]").css("border-color", "#b6b6b6"), $("[id*=MsgLabel]").text("বাকি থাকছে 0.00 টাকা"));

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
            d = parseFloat($("[id*=Discount_HF]").val());

            "" == $("[id*=DiscountTextBox]").val() && (a = 0); "" == $("[id*=PaidAmounTextBox]").val() && (c = 0);
            (b + d) < (a + c) ? ($("[id*=SubmtButton]").prop("disabled", !0).removeClass("ContinueButton"), $("[id*=PaidAmounTextBox]").css("border-color", "red"), $("[id*=MsgLabel]").text("মোট বাকি " + (b + d - a) + " টাকা। আপনি দিয়েছেন " + (c) + " টাকা")) : ($("[id*=SubmtButton]").prop("disabled", !1).addClass("ContinueButton"), $("[id*=PaidAmounTextBox]").css("border-color", "#b6b6b6"), $("[id*=MsgLabel]").text("বাকি থাকছে " + ((b + d) - (a + c)) + " টাকা"));
        });

        //Buying Gridview is empty
        if (!$('[id*=OrderDetailsGridView] tr').length) {
           $(".Hide").hide();
           $(".ContinueButton").hide();
           
        }
        else {
           $(".Hide").show();
           $(".ContinueButton").show();
        }
    </script>
</asp:Content>
