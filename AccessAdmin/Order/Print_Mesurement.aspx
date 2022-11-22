<%@ Page Title="" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Print_Mesurement.aspx.cs" Inherits="TailorBD.AccessAdmin.Order.Print_Mesurement" %>

<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="asp" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
    <link href="CSS/Print_Mesurement.css?v=1.0.0" rel="stylesheet" />
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <asp:ToolkitScriptManager ID="ToolkitScriptManager1" runat="server" />
    <h3>Print Mesurement</h3>

    <asp:LinkButton ID="A4PLinkButton" runat="server" OnClick="A4PLinkButton_Click">A4 Size Mesurement Print</asp:LinkButton>

    <table class="No_Print">
        <tr>
            <td>
                <asp:DropDownList ID="All_And_Part_DropDownList" runat="server" AutoPostBack="True" CssClass="dropdown" OnSelectedIndexChanged="All_And_Part_DropDownList_SelectedIndexChanged">
                </asp:DropDownList>
                <asp:LinkButton ID="SettingLB" CssClass="Setting" Text="মাপ প্রিন্ট সেটিং" runat="server" OnClientClick="return AddPopup()" />
            </td>
        </tr>
    </table>

    <div class="PrintMesure">
        <asp:GridView ID="OrderGridViewWithName" runat="server" AutoGenerateColumns="False" DataKeyNames="OrderListID" DataSourceID="NameOrderListSQL" ShowHeader="False" GridLines="None" BackColor="White" BorderColor="White" BorderStyle="None" BorderWidth="1px" CellPadding="1">
            <Columns>
                <asp:TemplateField>
                    <ItemTemplate>
                        <asp:HiddenField ID="OrderListIDHiddenField" runat="server" Value='<%# Bind("OrderListID") %>' />
                        <asp:HiddenField ID="OrderID_HF" runat="server" Value='<%# Eval("OrderID") %>' />

                        <table style="display: none" class="Table_style MasterCopy">
                            <caption>
                                <div class="InsName" style="display: none">
                                    <asp:Label ID="INLabel" runat="server" Text='<%# Bind("InstitutionName") %>' />
                                </div>
                                .......................... কপি
                            </caption>
                            <tr>
                                <td>
                                    <asp:Label ID="Label3" runat="server" Text='<%# Bind("Dress_Name") %>'></asp:Label><br />
                                    <asp:TextBox ID="TextBox1" CssClass="Drs_TB" runat="server" Text='<%# Bind("DressQuantity", "{0} P.") %>' Font-Size="14" />

                                </td>
                                <td>অর্ডার নং:<br />
                                    <b class="O_Size">
                                        <asp:Label ID="OrSLabel" runat="server" Text='<%# Bind("OrderSerialNumber") %>' />(<asp:Label ID="Label8" runat="server" Text='<%# Bind("OrderList_SN") %>' />)</b>
                                </td>
                                <td>অর্ডা:<asp:Label ID="Label9" runat="server" Text='<%# Bind("OrderDate","{0:d-MM-yy}") %>' />
                                    <br />
                                    ডেলি:<asp:Label ID="Label14" runat="server" Text='<%# Bind("DeliveryDate","{0:d-MM-yy}") %>' />
                                </td>
                            </tr>
                        </table>

                        <table style="display: none" class="Table_style WorkerCopy">
                            <caption>
                                <div style="display: none" class="InsName">
                                    <asp:Label ID="Label7" runat="server" Text='<%# Bind("InstitutionName") %>' />
                                </div>
                                কারিগর কপি
                            </caption>
                            <tr>
                                <td>
                                    <asp:Label ID="Label1" runat="server" Text='<%# Bind("Dress_Name") %>'></asp:Label><br />
                                    <asp:TextBox ID="DQTextBox" CssClass="Drs_TB" runat="server" Text='<%# Bind("DressQuantity", "{0} P.") %>' Font-Size="14" /></td>
                                <td>অর্ডার নং:<br />
                                    <b class="O_Size">
                                        <asp:Label ID="OrderSerialNumberLabel" runat="server" Text='<%# Bind("OrderSerialNumber") %>' />(<asp:Label ID="OrderList_SNLabel" runat="server" Text='<%# Bind("OrderList_SN") %>' />)</b>
                                </td>
                                <td>অর্ডা:<asp:Label ID="Label11" runat="server" Text='<%# Bind("OrderDate","{0:d-MM-yy}") %>' />
                                    <br />
                                    ডেলি:<asp:Label ID="Label13" runat="server" Text='<%# Bind("DeliveryDate","{0:d-MM-yy}") %>' />
                                </td>
                            </tr>
                        </table>

                        <table style="display: none; margin-bottom: 5px;" class="Table_style ShopCopy">
                            <caption>
                                <div style="display: none" class="InsName">
                                    <asp:Label ID="Label10" runat="server" Text='<%# Bind("InstitutionName") %>' />
                                </div>
                                দোকান কপি
                            </caption>
                            <tr>
                                <td>
                                    <asp:Label ID="Label2" runat="server" Text='<%# Bind("Dress_Name") %>'></asp:Label><br />
                                    <asp:TextBox ID="SDQTextBox" CssClass="Drs_TB" runat="server" Text='<%# Bind("DressQuantity", "{0} P.") %>' Font-Size="14" />
                                </td>
                                <td>অর্ডার নং:<br />
                                    <b class="O_Size">
                                        <asp:Label ID="Label4" runat="server" Text='<%# Bind("OrderSerialNumber") %>' />(<asp:Label ID="Label5" runat="server" Text='<%# Bind("OrderList_SN") %>' />)</b>
                                </td>
                                <td>অর্ডা:<asp:Label ID="Label6" runat="server" Text='<%# Bind("OrderDate","{0:d-MM-yy}") %>' />
                                    <br />
                                    ডেলি:<asp:Label ID="Label12" runat="server" Text='<%# Bind("DeliveryDate","{0:d-MM-yy}") %>' />
                                </td>
                            </tr>
                        </table>

                        <div style="display: none" class="customer-name">
                            <%# Eval("CustomerName") %>
                        </div>
                        <div style="display: none" class="customer-address">
                             <%# Eval("Phone") %>, <%# Eval("Address") %>
                        </div>

                        <div class="MesureMentSt">
                            <asp:DataList ID="MeasurementDataList" runat="server" DataSourceID="OrderedMeasurmentSQL" RepeatDirection="Horizontal" RepeatColumns="10" Width="100%">
                                <ItemTemplate>
                                    <asp:HiddenField ID="Measurement_GroupIDHiddenField" runat="server" Value='<%# Eval("Measurement_GroupID") %>' />
                                    <asp:DataList ID="DataList" runat="server" DataSourceID="M_SQL" Width="100%">
                                        <ItemTemplate>
                                            <asp:Label ID="MeasurementTypeLabel" runat="server" Text='<%# Eval("MeasurementType") %>' CssClass="M_Size M_Type" Style="display: none" />
                                            <asp:Label ID="MeasurementLabel" runat="server" Text='<%# Eval("Measurement") %>' CssClass="M_Size Block" />
                                        </ItemTemplate>
                                        <SeparatorTemplate>
                                            <hr />
                                        </SeparatorTemplate>
                                    </asp:DataList>
                                    <asp:SqlDataSource ID="M_SQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                                        SelectCommand="SELECT Measurement_Type.MeasurementType, Ordered_Measurement.Measurement FROM Ordered_Measurement INNER JOIN Measurement_Type ON Ordered_Measurement.MeasurementTypeID = Measurement_Type.MeasurementTypeID
WHERE(Measurement_Type.Measurement_GroupID = @Measurement_GroupID) AND (Ordered_Measurement.OrderListID = @OrderListID) ORDER BY ISNULL(Measurement_Type.Measurement_Group_SerialNo, 9999)">
                                        <SelectParameters>
                                            <asp:ControlParameter ControlID="Measurement_GroupIDHiddenField" Name="Measurement_GroupID" PropertyName="Value" />
                                            <asp:ControlParameter ControlID="OrderListIDHiddenField" Name="OrderListID" PropertyName="Value" />
                                        </SelectParameters>
                                    </asp:SqlDataSource>
                                </ItemTemplate>
                            </asp:DataList>
                            <asp:SqlDataSource ID="OrderedMeasurmentSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                                SelectCommand="SELECT DISTINCT Measurement_Type.Measurement_GroupID,ISNULL(Measurement_Type.Ascending,9999) AS Ascending FROM Ordered_Measurement INNER JOIN
Measurement_Type ON Ordered_Measurement.MeasurementTypeID = Measurement_Type.MeasurementTypeID WHERE (Ordered_Measurement.OrderListID = @OrderListID) ORDER BY Ascending">
                                <SelectParameters>
                                    <asp:ControlParameter ControlID="OrderListIDHiddenField" Name="OrderListID" PropertyName="Value" />
                                </SelectParameters>
                            </asp:SqlDataSource>
                        </div>

                        <asp:DataList ID="StyleDataList" runat="server" DataSourceID="StyleSQL" RepeatDirection="Horizontal">
                            <ItemTemplate>
                                <asp:Label ID="StyleLabel" runat="server" Text='<%# Eval("Style") %>' CssClass="M_Size" />
                            </ItemTemplate>
                        </asp:DataList>

                        <asp:Label ID="DetailsLabel" Font-Italic="true" runat="server" Text='<%# Bind("Details") %>' CssClass="M_Size"></asp:Label>

                        <asp:SqlDataSource ID="StyleSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="IF EXISTS (SELECT Print_S_Category FROM Institution WHERE (InstitutionID = @InstitutionID) AND (Print_S_Category = 1))
BEGIN
SELECT  STUFF((SELECT ' ' + T.S FROM(SELECT DISTINCT ISNULL(Dress_Style_Category.CategorySerial, 99999) as NUB , Dress_Style_Category.Dress_Style_Category_Name +'('+ (SELECT  STUFF((SELECT ',' + Dress_Style.Dress_Style_Name +ISNULL ( ' = '+Ordered_Dress_Style.DressStyleMesurement+' ','') FROM Ordered_Dress_Style INNER JOIN Dress_Style ON Ordered_Dress_Style.Dress_StyleID = Dress_Style.Dress_StyleID 
WHERE (Ordered_Dress_Style.OrderListID = @OrderListID) and (Dress_Style.Dress_Style_CategoryID = DS.Dress_Style_CategoryID) ORDER BY ISNULL(Dress_Style.StyleSerial, 99999)  FOR XML PATH('')), 1, 1, '')) + ')' AS S FROM Ordered_Dress_Style as ODS INNER JOIN 
Dress_Style as DS ON ODS.Dress_StyleID = DS.Dress_StyleID INNER JOIN Dress_Style_Category ON DS.Dress_Style_CategoryID = Dress_Style_Category.Dress_Style_CategoryID
WHERE (ODS.OrderListID = @OrderListID)) AS T ORDER BY T.NUB  FOR XML PATH('')), 1, 1, '') AS Style
END
ELSE
BEGIN
SELECT  STUFF((SELECT ' ' + T.S FROM(SELECT DISTINCT ISNULL(Dress_Style_Category.CategorySerial, 99999) as NUB ,'('+
(SELECT  STUFF((SELECT ',' + Dress_Style.Dress_Style_Name +ISNULL ( ' = '+Ordered_Dress_Style.DressStyleMesurement+' ','') FROM Ordered_Dress_Style INNER JOIN
Dress_Style ON Ordered_Dress_Style.Dress_StyleID = Dress_Style.Dress_StyleID 
WHERE (Ordered_Dress_Style.OrderListID = @OrderListID) and (Dress_Style.Dress_Style_CategoryID = DS.Dress_Style_CategoryID) ORDER BY ISNULL(Dress_Style.StyleSerial, 99999)  FOR XML PATH('')), 1, 1, '')) + ')' AS S

FROM Ordered_Dress_Style as ODS INNER JOIN Dress_Style as DS ON ODS.Dress_StyleID = DS.Dress_StyleID INNER JOIN Dress_Style_Category ON DS.Dress_Style_CategoryID = Dress_Style_Category.Dress_Style_CategoryID
WHERE (ODS.OrderListID = @OrderListID)) AS T ORDER BY T.NUB  FOR XML PATH('')), 1, 1, '') AS Style END">
                            <SelectParameters>
                                <asp:ControlParameter ControlID="OrderListIDHiddenField" Name="OrderListID" PropertyName="Value" />
                                <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                            </SelectParameters>
                        </asp:SqlDataSource>
                    </ItemTemplate>
                    <ItemStyle CssClass="pgridstyle" />
                </asp:TemplateField>
            </Columns>
            <PagerStyle CssClass="pgr" />
        </asp:GridView>
    </div>

    <asp:SqlDataSource ID="NameOrderListSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
        SelectCommand="SELECT OrderList.OrderListID, Dress.Dress_Name, OrderList.DressQuantity, OrderList.OrderListAmount, OrderList.Details,[Order].OrderID, [Order].OrderDate, [Order].DeliveryDate, [Order].OrderSerialNumber, [Order].OrderAmount, OrderList.OrderList_SN, Customer.CustomerNumber, Customer.CustomerName,Customer.Address, Customer.Phone, Institution.InstitutionName FROM OrderList INNER JOIN Dress ON OrderList.DressID = Dress.DressID INNER JOIN [Order] ON OrderList.OrderID = [Order].OrderID INNER JOIN Customer ON OrderList.CustomerID = Customer.CustomerID AND [Order].CustomerID = Customer.CustomerID INNER JOIN Institution ON OrderList.InstitutionID = Institution.InstitutionID WHERE (OrderList.OrderID = @OrderID) AND (OrderList.InstitutionID = @InstitutionID)">
        <SelectParameters>
            <asp:QueryStringParameter Name="OrderID" QueryStringField="OrderID" Type="Int32" />
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
        </SelectParameters>
    </asp:SqlDataSource>

    <br />
    <asp:CheckBox ID="Noborder_CheckBox" ClientIDMode="Static" CssClass="No_Print" runat="server" Text="Hide Border" /><br />
    <input id="PrintButton" type="button" value="" class="print" onclick="PrintPage();" />
    <br />
    <a class="No_Print" href="Order.aspx">নতুন অর্ডার দিন</a>

    <div id="AddPopup" runat="server" style="display: none;" class="modalPopup">
        <div id="IHeader" class="Htitle">
            <b>মাপ প্রিন্ট সেটিং</b>
            <div id="IClose" class="PopClose"></div>
        </div>
        <asp:UpdatePanel ID="UpdatePanel2" runat="server">
            <ContentTemplate>
                <div class="Pop_Contain">
                    <b>প্রিন্ট এর জন্য নির্বাচন করুন</b>
                    <hr />
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
                                    <td>কাস্টমারের ঠিকানা</td>
                                    <td>
                                        <asp:CheckBox ID="Print_Customer_AddressCheckBox" runat="server" Checked='<%# Bind("Print_Customer_Address") %>' Text=" " />
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
                    <asp:SqlDataSource ID="Print_settingSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT InstitutionID, Print_Customer_Name,Print_Customer_Address, Print_MasterCopy, Print_WorkmanCopy, Print_ShopCopy, Print_TopSpace, Print_S_Category, Print_Measurement_Name, Print_ShopName, Print_Font_Size FROM Institution WHERE (InstitutionID = @InstitutionID)" UpdateCommand="UPDATE Institution SET Print_Font_Size = @Print_Font_Size, Print_ShopName = @Print_ShopName, Print_Customer_Name = @Print_Customer_Name,Print_Customer_Address=@Print_Customer_Address, Print_MasterCopy = @Print_MasterCopy, Print_WorkmanCopy = @Print_WorkmanCopy, Print_ShopCopy = @Print_ShopCopy, Print_TopSpace = @Print_TopSpace, Print_S_Category = @Print_S_Category, Print_Measurement_Name = @Print_Measurement_Name WHERE (InstitutionID = @InstitutionID)">
                        <SelectParameters>
                            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                        </SelectParameters>
                        <UpdateParameters>
                            <asp:Parameter Name="Print_Font_Size" />
                            <asp:Parameter Name="Print_ShopName" />
                            <asp:Parameter Name="Print_Customer_Name" />
                            <asp:Parameter Name="Print_Customer_Address" />
                            <asp:Parameter Name="Print_MasterCopy" />
                            <asp:Parameter Name="Print_WorkmanCopy" />
                            <asp:Parameter Name="Print_ShopCopy" />
                            <asp:Parameter Name="Print_TopSpace" />
                            <asp:Parameter Name="Print_S_Category" />
                            <asp:Parameter Name="Print_Measurement_Name" />
                            <asp:Parameter Name="InstitutionID" />
                        </UpdateParameters>
                    </asp:SqlDataSource>
                </div>
            </ContentTemplate>
        </asp:UpdatePanel>

        <asp:HiddenField ID="IHiddenField" runat="server" Value="0" />
        <asp:ModalPopupExtender ID="IMpe" runat="server"
            TargetControlID="IHiddenField"
            PopupControlID="AddPopup"
            CancelControlID="IClose"
            BehaviorID="AddMpe"
            BackgroundCssClass="modalBackground"
            PopupDragHandleControlID="IHeader" />
    </div>

    <script src="../../JS/jq_Profile/jquery-ui-1.8.23.custom.min.js"></script>

    <script type="text/javascript">
        //Hide Mesurement Bordre
        $('#Noborder_CheckBox').on('change', function (e) {
            if ($(this).prop('checked')) {
                $('.MesureMentSt tr td table').css('border', 'none');
            } else {
                $('.MesureMentSt tr td table').css('border', '1px solid #666');
            };
        });

        function AddPopup() { $find("AddMpe").show(); return !1 };

        var pageUrl = '<%=ResolveUrl("Print_Mesurement.aspx")%>'

        /**Print count**/
        $(function () {
            $("#PrintButton").bind("click", function () {
                var OrderID = $("[id*=OrderID_HF]").val();;
                $.ajax({
                    type: "POST",
                    url: pageUrl + '/UpdatePrint',
                    data: '{OrderID: ' + OrderID + '}',
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    success: function (response) { }
                });
                return false;
            });
        });

        function PrintPage() { window.print() }

        $(function () {
            $(".MesureMentSt table tr td:empty").css("display", "none"); //Hide empty td
            $(".M_Size").css("font-size", $("[id*=FontSizeDropDownList]").val() + "px"); //Assign Saved Font Size

            //margin-top
            $.ajax({
                type: "POST",
                url: pageUrl + '/TopSpace',
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (response) {
                    $(".PrintMesure").css("margin-top", response.d + "px");
                },
                failure: function (response) {
                    alert(response.d);
                }
            })

            //Measurement_Name
            $.ajax({
                type: "POST",
                url: pageUrl + '/Measurement_Name',
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (response) {
                    if (response.d) {
                        $(".M_Type").show();
                    }
                },
                failure: function (response) {
                    alert(response.d);
                }
            })

            //ShopName
            $.ajax({
                type: "POST",
                url: pageUrl + '/ShopName',
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (response) {
                    if (response.d) {
                        $(".InsName").show();
                    }
                },
                failure: function (response) {
                    alert(response.d);
                }
            })

            //Customer Name
            $.ajax({
                type: "POST",
                url: pageUrl + '/Customer_Name',
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (response) {
                    if (response.d) {
                        $(".customer-name").show();
                    }
                },
                failure: function (response) {
                    alert(response.d);
                }
            })

            //Customer address
            $.ajax({
                type: "POST",
                url: pageUrl + '/Customer_Address',
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (response) {
                    if (response.d) {
                        $(".customer-address").show();
                    }
                },
                failure: function (response) {
                    alert(response.d);
                }
            })

            //MasterCopy
            $.ajax({
                type: "POST",
                url: pageUrl + '/MasterCopy',
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (response) {
                    if (response.d) {
                        $(".MasterCopy").show();
                    }
                },
                failure: function (response) {
                    alert(response.d);
                }
            })

            //WorkerCopy
            $.ajax({
                type: "POST",
                url: pageUrl + '/WorkerCopy',
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (response) {
                    if (response.d) {
                        $(".WorkerCopy").show();
                    }
                },
                failure: function (response) {
                    alert(response.d);
                }
            })

            //ShopCopy
            $.ajax({
                type: "POST",
                url: pageUrl + '/ShopCopy',
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (response) {
                    if (response.d) {
                        $(".ShopCopy").show();
                    }
                },
                failure: function (response) {
                    alert(response.d);
                }
            })
        });

        $("[id*=FontSizeDropDownList]").change(function () {
            $(".M_Size").css("font-size", $(this).val() + "px")
        });

    </script>
</asp:Content>
