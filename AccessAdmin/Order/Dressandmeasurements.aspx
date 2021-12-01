<%@ Page Title="" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Dressandmeasurements.aspx.cs" Inherits="TailorBD.AccessAdmin.Order.Dressandmeasurements" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
    <!--start CSS -->
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" />

    <!--[if lt IE 9]>
     <script src="https://oss.maxcdn.com/libs/html5shiv/3.7.0/html5shiv.js"></script>
   <![endif]-->
    <style>
        #User .badge { padding: 0.5em .4em; }
        #User p { margin-bottom: .5rem; }
        .Mesurement-bg { height: 100%; border: 1px solid #dbdbdb; }
            .Mesurement-bg span { font-size: 14px; }
        #Section .form-control { font-size: 14px; }
        .box img { height: 50px; width: 50px; }
        .ItemDelete { cursor: pointer; color: #ff6a00; }
        .Dress { background-color: #ff9400; color: #fff; border-top: 1px solid #fff; font-weight: bold; }
        #Next { color: #ff6a00; }
    </style>
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <div class="container-fluid">
        <div class="row">
            <div class="col-lg-12">
                <asp:FormView ID="CustomerDataList" runat="server" DataKeyNames="CustomerID" DataSourceID="CustomerSQL" Width="100%">
                    <ItemTemplate>
                        <asp:HiddenField ID="Cloth_For_IDHF" runat="server" Value='<%# Eval("Cloth_For_ID") %>' />
                        <asp:HiddenField ID="CustomerIDHF" runat="server" Value='<%# Eval("CustomerID") %>' />
                        <div class="row">
                            <div class="col-sm-12 col-md-5 col-lg-6" id="User">
                                <div class="card bg-light mb-2 p-2">
                                    <div class="media">
                                        <div class="media-body ml-2 text-center">
                                            <img class="media-object img-thumbnail" src="/Handler/Customer.ashx?Img=<%# Eval("CustomerID") %>" style="width: 54px; height: 54px">
                                            <h5 class="media-heading"><%# Eval("CustomerName") %></h5>
                                            <p>
                                                <span class="badge badge-warning">অর্ডার নং: <%# Eval("Order_No") %></span>
                                                <span class="badge badge-secondary">কাস্টমার নং: <%# Eval("CustomerNumber") %></span>
                                                <span class="badge badge-success">মোবাইল: <%# Eval("Phone") %></span>
                                            </p>
                                            <span class="badge badge-info"><%# Eval("Address") %></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-sm-12 col-md-7 col-lg-6 Ordercart">
                                <div class="card bg-light mb-2 p-2">
                                    <h6>অর্ডার কৃত পোশাক</h6>
                                    <div style="max-height: 90px; overflow: auto;">
                                        <table style="visibility: hidden;" class="mGrid Ordercart">
                                            <thead>
                                                <tr>
                                                    <th>অর্ডার নং</th>
                                                    <th>পোশাক</th>
                                                    <th>মোট পোশাক</th>
                                                    <th>মোট	 টাকা</th>
                                                </tr>
                                            </thead>
                                            <tbody id="OrdertBody"></tbody>
                                        </table>
                                    </div>

                                    <a id="Next">পরবর্তী ধাপে যান >></a>
                                </div>
                            </div>
                        </div>
                    </ItemTemplate>
                </asp:FormView>
                <asp:SqlDataSource ID="CustomerSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Customer.CustomerID, Customer.RegistrationID, Customer.InstitutionID, Customer.Cloth_For_ID, Customer.CustomerNumber, Customer.CustomerName, Customer.Phone, Customer.Address, Customer.Image, Customer.Date, Institution.TotalOrder + 1 AS Order_No FROM Customer INNER JOIN Institution ON Customer.InstitutionID = Institution.InstitutionID WHERE (Customer.CustomerID = @CustomerID) AND (Customer.InstitutionID = @InstitutionID)">
                    <SelectParameters>
                        <asp:QueryStringParameter Name="CustomerID" QueryStringField="CustomerID" Type="Int32" />
                        <asp:CookieParameter CookieName="InstitutionID" DefaultValue="" Name="InstitutionID" />
                    </SelectParameters>
                </asp:SqlDataSource>

                <div class="form-inline mb-3">
                    <div class="form-group">
                        <asp:DropDownList ID="DressDropDownList" runat="server" AutoPostBack="True" CssClass="form-control" DataSourceID="DressSQL" DataTextField="Dress_Name" DataValueField="DressID" AppendDataBoundItems="True" OnSelectedIndexChanged="DressDropDownList_SelectedIndexChanged" OnDataBound="DressDropDownList_DataBound">
                            <asp:ListItem Value="0">মাপ যুক্ত করার জন্য পোশাক নির্বাচন করুন</asp:ListItem>
                        </asp:DropDownList>
                        <asp:SqlDataSource ID="DressSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT DressID, Dress_Name, Cloth_For_ID, RegistrationID, InstitutionID, Description, Date, Image, DressSerial FROM Dress WHERE (Cloth_For_ID = @Cloth_For_ID) AND (InstitutionID = @InstitutionID) ORDER BY ISNULL(DressSerial, 99999)">
                            <SelectParameters>
                                <asp:QueryStringParameter Name="Cloth_For_ID" QueryStringField="Cloth_For_ID" />
                                <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                            </SelectParameters>
                        </asp:SqlDataSource>
                    </div>
                </div>

                <div id="Section" style="display: none;">
                    <div class="row">
                        <asp:Repeater ID="Measurement" runat="server" DataSourceID="MoreSQL">
                            <ItemTemplate>
                                <div class="col-sm-4 col-md-3 col-lg-2 mb-4">
                                    <div class="p-2 pb-3 bg-light Mesurement-bg">
                                        <asp:HiddenField ID="Measurement_GroupIDHiddenField" runat="server" Value='<%# Eval("Measurement_GroupID") %>' />
                                        <asp:Repeater ID="MesasurmentTypeDataList" runat="server" DataSourceID="MeasurementTypeSQL">
                                            <ItemTemplate>
                                                <span><%#Eval("MeasurementType") %></span>
                                                <input type="text" id='<%#Eval("MeasurementTypeID") %>' class="Measurement form-control" value='<%# Eval("Measurement") %>'>
                                            </ItemTemplate>
                                        </asp:Repeater>
                                        <asp:SqlDataSource ID="MeasurementTypeSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Measurement_Type.MeasurementTypeID, Measurement_Type.MeasurementType, Customer_M.Measurement, Measurement_Type.Measurement_Group_SerialNo FROM Measurement_Type LEFT OUTER JOIN (SELECT Measurement, MeasurementTypeID FROM Customer_Measurement WHERE (CustomerID = @CustomerID)) AS Customer_M ON Measurement_Type.MeasurementTypeID = Customer_M.MeasurementTypeID WHERE (Measurement_Type.Measurement_GroupID = @Measurement_GroupID) ORDER BY ISNULL(Measurement_Type.Measurement_Group_SerialNo, 99999)">
                                            <SelectParameters>
                                                <asp:QueryStringParameter Name="CustomerID" QueryStringField="CustomerID" />
                                                <asp:ControlParameter ControlID="Measurement_GroupIDHiddenField" Name="Measurement_GroupID" PropertyName="Value" />
                                            </SelectParameters>
                                        </asp:SqlDataSource>
                                    </div>
                                </div>
                            </ItemTemplate>
                        </asp:Repeater>
                        <asp:SqlDataSource ID="MoreSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT DISTINCT Measurement_GroupID, ISNULL(Ascending, 99999) AS Ascending
FROM Measurement_Type WHERE (InstitutionID = @InstitutionID) AND (DressID = @DressID) ORDER BY Ascending">
                            <SelectParameters>
                                <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                                <asp:ControlParameter ControlID="DressDropDownList" Name="DressID" PropertyName="SelectedValue" />
                            </SelectParameters>
                        </asp:SqlDataSource>
                    </div>

                    <asp:Repeater ID="CategoryRepeater" runat="server" DataSourceID="Dress_Style_Name_SQL">
                        <ItemTemplate>
                            <div class="card mb-4 border-secondary">
                                <asp:Label ID="IdLabel" runat="server" Text='<%# Bind("Dress_Style_CategoryID") %>' Visible="False"></asp:Label>
                                <div class="card-header bg-secondary">
                                    <b style="color: #fff"><%#Eval("Dress_Style_Category_Name") %></b>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <asp:Repeater ID="StyleRepeater" runat="server" DataSourceID="StyleSQL">
                                            <ItemTemplate>
                                                <div class="box col-md-4 col-lg-3 mb-4">
                                                    <div class="p-2 pb-3 text-center" style="border: 1px solid #ddd">
                                                        <img alt="" src="/Handler/Style_Name.ashx?Img='<%# Eval("Dress_StyleID") %>'" class="StyleImg" /><br />

                                                        <input type="checkbox" class="Ck_Design" id="<%# Eval("Dress_StyleID") %>" <%# Convert.ToBoolean(Eval("IsCheck")) ? "checked" : "" %> />
                                                        <label for="<%# Eval("Dress_StyleID") %>"><%# Eval("Dress_Style_Name") %></label>

                                                        <input type="text" class="Ck_Design form-control" value='<%#Eval("DressStyleMesurement") %>' />
                                                    </div>
                                                </div>
                                            </ItemTemplate>
                                        </asp:Repeater>
                                        <asp:SqlDataSource ID="StyleSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Dress_Style.Dress_StyleID, Dress_Style.Dress_Style_Name, Customer_DS.DressStyleMesurement, CAST(CASE WHEN Customer_DS.Dress_StyleID IS NULL THEN 0 ELSE 1 END AS BIT) AS IsCheck FROM Dress_Style LEFT OUTER JOIN (SELECT DressStyleMesurement, Dress_StyleID FROM Customer_Dress_Style WHERE (CustomerID = @CustomerID)) AS Customer_DS ON Dress_Style.Dress_StyleID = Customer_DS.Dress_StyleID WHERE (Dress_Style.Dress_Style_CategoryID = @Dress_Style_CategoryID) ORDER BY ISNULL(Dress_Style.StyleSerial, 99999)">
                                            <SelectParameters>
                                                <asp:QueryStringParameter Name="CustomerID" QueryStringField="CustomerID" />
                                                <asp:ControlParameter ControlID="IdLabel" Name="Dress_Style_CategoryID" PropertyName="Text" />
                                            </SelectParameters>
                                        </asp:SqlDataSource>
                                    </div>
                                </div>
                            </div>
                        </ItemTemplate>
                    </asp:Repeater>
                    <asp:SqlDataSource ID="Dress_Style_Name_SQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT DISTINCT Dress_Style_Category.Dress_Style_Category_Name, Dress_Style.Dress_Style_CategoryID, ISNULL(Dress_Style_Category.CategorySerial, 99999) AS SN FROM Dress_Style INNER JOIN Dress_Style_Category ON Dress_Style.Dress_Style_CategoryID = Dress_Style_Category.Dress_Style_CategoryID WHERE (Dress_Style.DressID = @DressID) ORDER BY SN">
                        <SelectParameters>
                            <asp:ControlParameter ControlID="DressDropDownList" Name="DressID" PropertyName="SelectedValue" />
                        </SelectParameters>
                    </asp:SqlDataSource>
                    <asp:SqlDataSource ID="Customer_DressSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                        SelectCommand="SELECT CDDetails FROM Customer_Dress WHERE (CustomerID = @CustomerID) AND (DressID = @DressID) AND (InstitutionID = @InstitutionID)">
                        <SelectParameters>
                            <asp:QueryStringParameter Name="CustomerID" QueryStringField="CustomerID" />
                            <asp:ControlParameter ControlID="DressDropDownList" Name="DressID" PropertyName="SelectedValue" />
                            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                        </SelectParameters>
                    </asp:SqlDataSource>

                    <div class="form-group">
                        <label>বিস্তারিত বিবরণ</label>
                        <asp:TextBox ID="DetailsTextBox" runat="server" CssClass="form-control" placeholder="পোশাক সম্পর্কে বিস্তারিত বিবরণ" TextMode="MultiLine"></asp:TextBox>
                    </div>
                    <div class="form-group">
                        <label>মোট পোশাক</label>
                        <input id="QuantityText" type="text" placeholder="মোট পোশাক" class="form-control" onkeypress="return isNumberKey(event)" autocomplete="off" />
                    </div>

                    <div class="card border-warning">
                        <div class="card-header bg-warning">খরচ যুক্ত করুন</div>
                        <div class="card-body">
                            <div class="form-row">
                                <div class="col-auto mb-3">
                                    <input id="ForText" type="text" placeholder="কি বাবদ" class="form-control" />
                                </div>
                                <div class="col-auto mb-3">
                                    <input id="Unit_Price_Text" type="text" placeholder="কত টাকা" class="form-control" onkeypress="return isNumberKey(event)" autocomplete="off" />
                                </div>
                                <div class="col-auto mb-3">
                                    <input id="CartButton" type="button" value="যুক্ত করুন" onclick="addToCart()" class="btn btn-danger" />
                                </div>
                                <div class="col-auto mb-3">
                                    <asp:DropDownList ID="DressPriceDDList" runat="server" CssClass="form-control" DataSourceID="DressPriceSQL" DataTextField="Price_For" DataValueField="Price" OnDataBound="DressPriceDDList_DataBound">
                                    </asp:DropDownList>
                                    <asp:SqlDataSource ID="DressPriceSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM [Dress_Price] WHERE (([InstitutionID] = @InstitutionID) AND ([DressID] = @DressID))">
                                        <SelectParameters>
                                            <asp:CookieParameter CookieName="InstitutionID" DefaultValue="1006" Name="InstitutionID" />
                                            <asp:ControlParameter ControlID="DressDropDownList" DefaultValue="" Name="DressID" PropertyName="SelectedValue" />
                                        </SelectParameters>
                                    </asp:SqlDataSource>
                                </div>
                            </div>

                            <div class="cart">
                                <table style="visibility: hidden;" class="mGrid cart mb-3">
                                    <thead>
                                        <tr>
                                            <th>কি বাবত</th>
                                            <th>প্রতি পিস</th>
                                            <th>মোট পোশাক</th>
                                            <th>মোট	</th>
                                            <th>ডিলিট</th>
                                        </tr>
                                    </thead>
                                    <tbody id="cartBody"></tbody>
                                </table>

                                <input id="OrderButton" type="button" value="অর্ডার এড করুন" onclick="data()" class="btn btn-primary" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!--Jquery-->
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js"></script>
    <!--Autocomplete-->
    <script type="text/javascript" src="https://cdn.rawgit.com/bassjobsen/Bootstrap-3-Typeahead/master/bootstrap3-typeahead.min.js"></script>

    <script>
        $(function () {
            var fewSeconds = 5;
            $('#OrderButton').click(function () {
                var btn = $(this);
                btn.prop('disabled', true).val("Please Wait...");
                setTimeout(function () {
                    btn.prop('disabled', false);
                }, fewSeconds * 1000);
            });


            $('#ForText').typeahead({
                hint: true,
                highlight: true,
                minLength: 1,
                source: function (request, response) {
                    $.ajax({
                        url: '<%=ResolveUrl("Dressandmeasurements.aspx/GetDetailst") %>',
                        data: "{ 'prefix': '" + request + "'}",
                        dataType: "json",
                        type: "POST",
                        contentType: "application/json; charset=utf-8",
                        success: function (data) {
                            items = [];
                            map = {};
                            $.each(data.d, function (i, item) {
                                var label = item.split('|')[0];

                                map[label] = { label: label };
                                items.push(label);
                            });
                            response(items);
                            $(".dropdown-menu").css("height", "auto");
                        },
                        error: function (response) {
                            alert(response.responseText);
                        },
                        failure: function (response) {
                            alert(response.responseText);
                        }
                    });
                }, updater: function (item) {
                    return item;
                }
            });


            //Style
            $('.Ck_Design').typeahead({
                hint: true,
                highlight: true,
                minLength: 1,
                source: function (request, response) {
                    $.ajax({
                        url: '<%=ResolveUrl("Dressandmeasurements.aspx/GetStyle") %>',
                        data: "{ 'prefix': '" + request + "'}",
                        dataType: "json",
                        type: "POST",
                        contentType: "application/json; charset=utf-8",
                        success: function (data) {
                            items = [];
                            map = {};
                            $.each(data.d, function (i, item) {
                                var label = item.split('|')[0];

                                map[label] = { label: label };
                                items.push(label);
                            });
                            response(items);
                            $(".dropdown-menu").css("height", "auto");
                        },
                        error: function (response) {
                            alert(response.responseText);
                        },
                        failure: function (response) {
                            alert(response.responseText);
                        }
                    });
                }, updater: function (item) {
                    return item;
                }
            });
        })
    </script>

    <script>
        var cart = [];
        var Order = [];

        $(document).ready(function () {
            if ($("[id*=DressDropDownList] option:selected").val() > 0) {
                $("#Section").show();
            }

            //If Fixted Price Is Empty
            ($('[id*=DressPriceDDList] option').length > 1) ? $('[id*=DressPriceDDList]').show() : $('[id*=DressPriceDDList]').hide();


            if (localStorage.cart) {
                cart = JSON.parse(localStorage.cart);
            }
            showCart();

            if (localStorage.OrderCart) {
                Order = JSON.parse(localStorage.OrderCart);
            }
            showOrder();
        });

        function addToCart() {
            var ForText = $("#ForText").val().trim();
            var QuantityText = $("#QuantityText").val().trim();
            var Unit_Price_Text = $("#Unit_Price_Text").val().trim();

            // if Name is already present
            for (var i in cart) {
                if (cart[i].For == ForText) { return; }
            }
            // create JavaScript Object
            if (ForText != '' && QuantityText != '' && Unit_Price_Text != '') {
                var item = { For: ForText, Quantity: QuantityText, Unit_Price: Unit_Price_Text };
                cart.push(item);
                saveCart();
                showCart();

                $("#ForText").val("");
                $("#Unit_Price_Text").val("");
            }
            else { alert("মোট পোশাক, কি বাবদ, কত টাকা দেওয়া নেই"); }
        }

        $("[id*=DressPriceDDList]").change(function () {
            if ($(this).val() > '0') {
                var ForText = $("[id*=DressPriceDDList] option:selected").text();
                var QuantityText = $("#QuantityText").val();
                var Unit_Price_Text = $("[id*=DressPriceDDList] option:selected").val();

                if (QuantityText !== '') {
                    // if Name is already present
                    for (var i in cart) {
                        if (cart[i].For == ForText) { return; }
                    }
                    // create JavaScript Object
                    var item = { For: ForText, Quantity: QuantityText, Unit_Price: Unit_Price_Text };
                    cart.push(item);
                    saveCart();
                    showCart();
                }
                else {
                    alert("মোট পোশাক দেওয়া নেই");
                    $("[id*=DressPriceDDList]")[0].selectedIndex = 0;

                }
            }
        });

        function saveCart() {
            if (window.localStorage) {
                localStorage.cart = JSON.stringify(cart);
            }
        }

        //Delete
        $(document).on("click", ".ItemDelete", function () {
            var index = $(this).closest("tr").index();

            cart.splice(index, 1);
            showCart();
            saveCart();
        });

        //Quantity change
        $(document).on("input", ".LineQuentity", function () {
            var qunt = $(this).val();
            var index = $(this).closest("tr").index();

            cart[index].Quantity = qunt;

            showCart();
            saveCart();
        });

        function getTotalPrice() {
            var total = 0;
            $.each(cart, function () {
                total += this.Quantity * this.Unit_Price;
            });
            $("#GrandTotal").text(total);
        }

        function showCart() {
            if (cart.length == 0) {
                $(".cart").css("visibility", "hidden");
                return;
            }

            $(".cart").css("visibility", "visible");

            var cartTable = $("#cartBody");
            cartTable.empty();

            $.each(cart, function () {
                var total = this.Quantity * this.Unit_Price;
                cartTable.append(
                  '<tr>' +
                  '<td>' + this.For + '</td>' +
                  '<td>৳' + this.Unit_Price + '</td>' +
                  '<td style="width:100px;"><input onkeypress="return isNumberKey(event)" class="LineQuentity form-control" type="number" max="500" min="1" value="' + this.Quantity + '"/></td>' +
                  '<td>৳' + total + '</td>' +
                  '<td class="text-center" style="width:20px;"><b class="ItemDelete">Delete</b></td>' +
                  '</tr>'
                );
            });

            cartTable.append(
              '<tr>' +
              '<td></td>' +
              '<td></td>' +
              '<td></td>' +
              '<td>৳<strong id="GrandTotal"></strong></td>' +
              '<td></td>' +
              '</tr>'
            );

            getTotalPrice();
        }

        //Order Cart
        function SaveOrder() {
            if (window.localStorage) {
                localStorage.OrderCart = JSON.stringify(Order);
            }
        }

        function showOrder() {
            if (Order.length == 0) {
                $(".Ordercart").css("visibility", "hidden");
                return;
            }

            $(".Ordercart").css("visibility", "visible");

            var OrderTable = $("#OrdertBody");
            OrderTable.empty();

            $.each(Order, function () {
                OrderTable.append(
                  '<tr>' +
                  '<td>' + this.OrderSerialNumber + '</td>' +
                  '<td>' + this.Dress_Name + '</td>' +
                  '<td>' + this.DressQuantity + '</td>' +
                  '<td>' + this.OrderListAmount + '</td>' +
                  '</tr>'
                );
            });
        }

        //set and get Get mesurement and style data on submit
        function data() {
            if ($("#QuantityText").val() == "") {
                alert("মোট পোশাক দেওয়া নেই");
                return;
            }

            var Item1, All_Item1 = [];
            $('.Measurement').each(function () {
                var Mmnt = $(this).val();
                if (Mmnt != null && Mmnt != '') {
                    Item1 = { id: $(this).attr('id'), value: Mmnt};
                    All_Item1.push(Item1);
                }
            });
            localStorage.All_Measurement = JSON.stringify(All_Item1);

            //style
            var Item, All_Item = [];
            $('.Ck_Design').each(function () {
                if ($(this).is(':checked')) {
                    Item = { id: $(this).attr('id'), value: $(this).closest("div.box").find("input[type=text]").val().trim() };
                    All_Item.push(Item);
                }
            });
            localStorage.All_Style = JSON.stringify(All_Item);

            //Get data from local storage
            var All_Measurement = localStorage.All_Measurement;
            var All_Style = localStorage.All_Style;
            var Payment = localStorage.cart;

            var Cloth_For_ID = $("[id*=Cloth_For_IDHF]").val();
            var CustomerID = $("[id*=CustomerIDHF]").val();
            var DressID = $("[id*=DressDropDownList] option:selected").val();
            var DressQuantity = $("#QuantityText").val().trim();
            var Details = $("[id*=DetailsTextBox]").val().trim();

            var OrderID = "";
            if (localStorage.OrderCart) {
                OrderID = Order[0].OrderID;
            }

            $.ajax({
                type: "Post",
                url: "Dressandmeasurements.aspx/Set_Data",
                data: JSON.stringify({ Cloth_For_ID: Cloth_For_ID, CustomerID: CustomerID, DressID: DressID, List_Measurement: All_Measurement, List_Style: All_Style, List_payment: Payment, DressQuantity: DressQuantity, Details: Details, OrderID: OrderID }),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (response) {
                    localStorage.removeItem("All_Measurement");
                    localStorage.removeItem("All_Style");
                    localStorage.removeItem("cart");

                    //Add Order in local
                    var obj = JSON.parse(response.d);
                    Order.push(obj);

                    SaveOrder();
                    showOrder();

                    //Hide After submit
                    $("#Section").hide();
                    $("[id*=DressDropDownList]")[0].selectedIndex = 0;
                },
                error: function (err) {
                    alert(err)
                }
            });
        }

        //Next
        $('#Next').on('click', function () {
            var oid = Order[0].OrderID;

            localStorage.removeItem("All_Measurement");
            localStorage.removeItem("All_Style");
            localStorage.removeItem("cart");
            localStorage.removeItem("OrderCart");

            window.location.href = 'FinishOrder.aspx?OrderID=' + oid;
        });



        /***Disable Browser Back Button****/
        function noBack() {
            window.history.forward();
        }
        noBack();
        window.onload = noBack;
        window.onpageshow = function (evt) {
            if (evt.persisted) noBack();
        }
        window.onunload = function () { void (0); }

        function isNumberKey(a) { a = a.which ? a.which : event.keyCode; return 46 != a && 31 < a && (48 > a || 57 < a) ? !1 : !0 };
    </script>
</asp:Content>
