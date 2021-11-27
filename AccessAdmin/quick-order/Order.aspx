<%@ Page Title="Quick Order" Language="C#" MasterPageFile="~/QuickOrder.Master" AutoEventWireup="true" CodeBehind="Order.aspx.cs" Inherits="TailorBD.AccessAdmin.quick_order.Order" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    
        <div class="form-inline mb-3">
            <div class="form-group">
                <asp:DropDownList ID="DressDropDownList" runat="server" AutoPostBack="True" CssClass="form-control" DataSourceID="DressSQL" DataTextField="Dress_Name" DataValueField="DressID" AppendDataBoundItems="True" OnSelectedIndexChanged="DressDropDownList_SelectedIndexChanged">
                    <asp:ListItem Value="0">পোশাক নির্বাচন করুন</asp:ListItem>
                </asp:DropDownList>
                <asp:SqlDataSource ID="DressSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT DressID, Dress_Name, Cloth_For_ID, RegistrationID, InstitutionID, Description, Date, Image, DressSerial FROM Dress WHERE  (InstitutionID = @InstitutionID) ORDER BY ISNULL(DressSerial, 99999)">
                    <SelectParameters>
                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                    </SelectParameters>
                </asp:SqlDataSource>
            </div>
        </div>

        <div id="Section">
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
                                        <asp:QueryStringParameter Name="CustomerID" QueryStringField="CustomerID" DefaultValue="0" />
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
                                        <asp:QueryStringParameter Name="CustomerID" QueryStringField="CustomerID" DefaultValue="0" />
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
                    <asp:QueryStringParameter Name="CustomerID" QueryStringField="CustomerID" DefaultValue="0" />
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
                        <asp:DropDownList ID="DressPriceDDList" runat="server" CssClass="form-control" DataSourceID="DressPriceSQL" DataTextField="Price_For" DataValueField="Price">
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

</asp:Content>


