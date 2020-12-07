<%@ Page Title="ফেব্রিক্স এর বিবরণ" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Add_Fabrics.aspx.cs" Inherits="TailorBD.AccessAdmin.Fabrics.Add_Fabrics" %>

<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="asp" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
    <style>
        .textbox { width: 194px; }
        .Img { height: 65px; width: 75px; }
        .EroorSummer { display: inline-block; }
    </style>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <asp:ToolkitScriptManager ID="TSM" runat="server" />

    <h3>ফেব্রিক্স এর বিবরণ</h3>
    <a onclick="AddPopup();">নতুন ফেব্রিক্স যুক্ত করুন</a>
    <table>
        <tr>
            <td>
                <asp:TextBox ID="FindTextBox" placeholder="নাম, কোড" runat="server" CssClass="textbox"></asp:TextBox>
            </td>
            <td>
                <asp:Button ID="FindButton" runat="server" Text="Find" CssClass="ContinueButton" />
            </td>
        </tr>
    </table>
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">
        <ContentTemplate>

            <asp:GridView ID="FabricGridView" AllowSorting="True" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="FabricID" DataSourceID="FabricSQL" AllowPaging="True" OnRowUpdating="FabricGridView_RowUpdating" PageSize="50">
                <Columns>
                    <asp:BoundField DataField="Fabric_SN" HeaderText="সিরিয়াল নং" SortExpression="Fabric_SN" ReadOnly="True" />
                    <asp:BoundField DataField="FabricCode" HeaderText="কোড" SortExpression="FabricCode" ReadOnly="True" />
                    <asp:TemplateField HeaderText="নাম" SortExpression="FabricsName">
                        <EditItemTemplate>
                            <asp:TextBox ID="TextBox1" runat="server" Text='<%# Bind("FabricsName") %>' CssClass="textbox"></asp:TextBox>
                        </EditItemTemplate>
                        <ItemTemplate>
                            <asp:Label ID="Label1" runat="server" Text='<%# Bind("FabricsName") %>'></asp:Label>
                        </ItemTemplate>
                    </asp:TemplateField>

                    <asp:TemplateField HeaderText="কালার" SortExpression="FabricsColor">
                        <EditItemTemplate>
                            <asp:TextBox ID="TextBox3" runat="server" Text='<%# Bind("FabricsColor") %>' CssClass="textbox"></asp:TextBox>
                        </EditItemTemplate>
                        <ItemTemplate>
                            <asp:Label ID="Label3" runat="server" Text='<%# Bind("FabricsColor") %>'></asp:Label>
                        </ItemTemplate>
                    </asp:TemplateField>
                    <asp:TemplateField HeaderText="স্টাইল" SortExpression="FabricsStyle">
                        <EditItemTemplate>
                            <asp:TextBox ID="TextBox4" runat="server" Text='<%# Bind("FabricsStyle") %>' CssClass="textbox"></asp:TextBox>
                        </EditItemTemplate>
                        <ItemTemplate>
                            <asp:Label ID="Label4" runat="server" Text='<%# Bind("FabricsStyle") %>'></asp:Label>
                        </ItemTemplate>
                    </asp:TemplateField>
                    <asp:TemplateField HeaderText="প্রতি ইউনিট ক্রয় মূল্য" SortExpression="CurrentBuyingUnitPrice">
                        <EditItemTemplate>
                            <asp:TextBox ID="TextBox6" runat="server" Text='<%# Bind("CurrentBuyingUnitPrice") %>' onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" CssClass="textbox"></asp:TextBox>
                        </EditItemTemplate>
                        <ItemTemplate>
                            <asp:Label ID="Label6" runat="server" Text='<%# Bind("CurrentBuyingUnitPrice") %>'></asp:Label>
                        </ItemTemplate>
                    </asp:TemplateField>
                    <asp:TemplateField HeaderText="প্রতি ইউনিট বিক্রয় মূল্য" SortExpression="SellingUnitPrice">
                        <EditItemTemplate>
                            <asp:TextBox ID="TextBox7" runat="server" Text='<%# Bind("SellingUnitPrice") %>' onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" CssClass="textbox"></asp:TextBox>
                        </EditItemTemplate>
                        <ItemTemplate>
                            <asp:Label ID="Label7" runat="server" Text='<%# Bind("SellingUnitPrice") %>'></asp:Label>
                        </ItemTemplate>
                    </asp:TemplateField>
                    <asp:TemplateField HeaderText="বিস্তারিত" SortExpression="FabricDetails">
                        <EditItemTemplate>
                            <asp:TextBox ID="TextBox5" runat="server" Text='<%# Bind("FabricDetails") %>' CssClass="textbox"></asp:TextBox>
                        </EditItemTemplate>
                        <ItemTemplate>
                            <asp:Label ID="Label5" runat="server" Text='<%# Bind("FabricDetails") %>'></asp:Label>
                        </ItemTemplate>
                    </asp:TemplateField>
                    <asp:TemplateField HeaderText="স্টক" SortExpression="StockFabricQuantity">
                        <ItemTemplate>
                            <%#Eval("StockFabricQuantity") %>
                        </ItemTemplate>
                        <EditItemTemplate>
                            <asp:Label ID="StockLabel" runat="server" Text='<%#Eval("StockFabricQuantity") %>'></asp:Label>
                            <asp:TextBox ID="Stock_TextBox" placeholder="Stock Adjustment" runat="server" autocomplete="off" CssClass="textbox"></asp:TextBox>
                        </EditItemTemplate>
                    </asp:TemplateField>
                    <asp:CommandField ShowEditButton="True" />
                    <asp:TemplateField ShowHeader="False">
                        <ItemTemplate>
                            <asp:LinkButton ID="LinkButton1" OnClientClick="return confirm('Are You Sure Want To Delete?')" runat="server" CausesValidation="False" CommandName="Delete" Text="Delete"></asp:LinkButton>
                        </ItemTemplate>
                    </asp:TemplateField>
                </Columns>
                <PagerStyle CssClass="pgr" />
            </asp:GridView>
            <asp:SqlDataSource ID="FabricSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" DeleteCommand="IF NOT EXIST(SELECT TOP(1) * FROM Fabrics_Buying_List WHERE [FabricID] = @FabricID)
DELETE FROM [Fabrics] WHERE [FabricID] = @FabricID"
                InsertCommand="IF NOT EXISTS (SELECT * FROM Fabrics WHERE FabricCode = @FabricCode AND InstitutionID = @InstitutionID)
INSERT INTO Fabrics(FabricMesurementUnitID, InstitutionID, RegistrationID, FabricsBrandID, FabricsCategoryID, Fabric_SN, FabricCode, FabricsName, FabricsColor, FabricsStyle,FabricDetails, SellingUnitPrice) VALUES (@FabricMesurementUnitID, @InstitutionID, @RegistrationID, @FabricsBrandID, @FabricsCategoryID, dbo.Fabric_SerialNumber(@InstitutionID), @FabricCode, @FabricsName, @FabricsColor, @FabricsStyle, @FabricDetails, @SellingUnitPrice)
ELSE
SET @ERROR = @FabricCode + ' Fabrics Code Already Exists'"
                SelectCommand="SELECT FabricID,Stock_Adjustment, FabricMesurementUnitID, InstitutionID, RegistrationID, FabricsBrandID, FabricsCategoryID, Fabric_SN, FabricCode, FabricsName, FabricsColor, FabricsStyle, FabricImage, FabricDetails, SellingUnitPrice, StockFabricQuantity, TotalSellingQuantity, TotalBuyingQuantity, TotalDamageQuantity, SupplierTotalReturnQuantity, CustomerTotalReturnQuantity, CustomerReturnQuantity_Add_To_Stock, FabricStockStatus, InputDate, CurrentBuyingUnitPrice FROM Fabrics WHERE (InstitutionID = @InstitutionID) ORDER BY FabricID DESC" UpdateCommand="UPDATE Fabrics SET FabricsName = @FabricsName, FabricsColor = @FabricsColor, FabricsStyle = @FabricsStyle, FabricDetails = @FabricDetails, SellingUnitPrice = @SellingUnitPrice, CurrentBuyingUnitPrice = @CurrentBuyingUnitPrice, Stock_Adjustment = Stock_Adjustment +@Stock_Adjustment WHERE (FabricID = @FabricID)" OnInserted="FabricSQL_Inserted"
                FilterExpression="FabricCode like '{0}%' or FabricsName like '{0}%'">
                <DeleteParameters>
                    <asp:Parameter Name="FabricID" Type="Int32" />
                </DeleteParameters>
                <FilterParameters>
                    <asp:ControlParameter ControlID="FindTextBox" Name="Find" PropertyName="Text" />
                </FilterParameters>
                <InsertParameters>
                    <asp:ControlParameter ControlID="FabricCodeTextBox" Name="FabricCode" PropertyName="Text" Type="String" />
                    <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                    <asp:ControlParameter ControlID="Mesurement_UnitDropDownList" Name="FabricMesurementUnitID" PropertyName="SelectedValue" Type="Int32" />
                    <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                    <asp:ControlParameter ControlID="FabricsBrandDropDownList" Name="FabricsBrandID" PropertyName="SelectedValue" Type="Int32" />
                    <asp:ControlParameter ControlID="FabricsCategoryDropDownList" Name="FabricsCategoryID" PropertyName="SelectedValue" Type="Int32" />
                    <asp:ControlParameter ControlID="FabricsNameTextBox" Name="FabricsName" PropertyName="Text" Type="String" />
                    <asp:ControlParameter ControlID="FabricsColorTextBox" Name="FabricsColor" PropertyName="Text" Type="String" />
                    <asp:ControlParameter ControlID="FabricsStyleTextBox" Name="FabricsStyle" PropertyName="Text" Type="String" />
                    <asp:ControlParameter ControlID="FabricDetailsTextBox" Name="FabricDetails" PropertyName="Text" Type="String" />
                    <asp:ControlParameter ControlID="SellingUnitPriceTextBox" Name="SellingUnitPrice" PropertyName="Text" Type="Double" />
                    <asp:Parameter Name="ERROR" />
                </InsertParameters>
                <SelectParameters>
                    <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                </SelectParameters>
                <UpdateParameters>
                    <asp:Parameter Name="FabricsName" Type="String" />
                    <asp:Parameter Name="FabricsColor" Type="String" />
                    <asp:Parameter Name="FabricsStyle" Type="String" />
                    <asp:Parameter Name="FabricDetails" Type="String" />
                    <asp:Parameter Name="SellingUnitPrice" Type="Double" />
                    <asp:Parameter Name="CurrentBuyingUnitPrice" />
                    <asp:Parameter Name="Stock_Adjustment" />
                    <asp:Parameter Name="FabricID" Type="Int32" />
                </UpdateParameters>
            </asp:SqlDataSource>

        </ContentTemplate>
    </asp:UpdatePanel>

    <div id="AddPopup" runat="server" style="display: none;" class="modalPopup">
        <div id="IHeader" class="Htitle">
            <b>কাপড় যুক্ত করুন</b>
            <div id="IClose" class="PopClose"></div>
        </div>
        <asp:UpdatePanel ID="UpdatePanel2" runat="server">
            <ContentTemplate>
                <div class="Pop_Contain">
                    <table>
                        <tr>
                            <td>মাপের ধরণ</td>
                            <td>
                                <asp:DropDownList ID="Mesurement_UnitDropDownList" runat="server" CssClass="dropdown" DataSourceID="Mesurement_UnitSQL" DataTextField="UnitName" DataValueField="FabricMesurementUnitID" OnDataBound="Mesurement_UnitDropDownList_DataBound">
                                </asp:DropDownList>
                                <asp:SqlDataSource ID="Mesurement_UnitSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM [Fabrics_Mesurement_Unit] WHERE ([InstitutionID] = @InstitutionID)">
                                    <SelectParameters>
                                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                                    </SelectParameters>
                                </asp:SqlDataSource>
                                <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="Mesurement_UnitDropDownList" CssClass="EroorSummer" ErrorMessage="Select Mesurement" InitialValue="0" ValidationGroup="1">*</asp:RequiredFieldValidator>
                            </td>
                        </tr>
                        <tr>
                            <td>কাপড়ের ক্যাটাগরী</td>
                            <td>
                                <asp:DropDownList ID="FabricsCategoryDropDownList" runat="server" CssClass="dropdown" DataSourceID="FabricCategorySQL" DataTextField="FabricsCategoryName" DataValueField="FabricsCategoryID" OnDataBound="FabricsCategoryDropDownList_DataBound">
                                </asp:DropDownList>
                                <asp:SqlDataSource ID="FabricCategorySQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM [Fabrics_Category] WHERE ([InstitutionID] = @InstitutionID)">
                                    <SelectParameters>
                                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                                    </SelectParameters>
                                </asp:SqlDataSource>
                            </td>
                        </tr>
                        <tr>
                            <td>ব্র্যান্ড</td>
                            <td>
                                <asp:DropDownList ID="FabricsBrandDropDownList" runat="server" CssClass="dropdown" DataSourceID="BrandSQL" DataTextField="FabricsBrandName" DataValueField="FabricsBrandID" OnDataBound="FabricsBrandDropDownList_DataBound">
                                </asp:DropDownList>
                                <asp:SqlDataSource ID="BrandSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT * FROM [Fabrics_Brand] WHERE ([InstitutionID] = @InstitutionID)">
                                    <SelectParameters>
                                        <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                                    </SelectParameters>
                                </asp:SqlDataSource>
                            </td>
                        </tr>
                        <tr>
                            <td>কাপড়ের কোড</td>
                            <td>
                                <asp:TextBox ID="FabricCodeTextBox" runat="server" CssClass="textbox"></asp:TextBox>
                                <asp:RequiredFieldValidator ID="RequiredFieldValidator3" runat="server" ControlToValidate="FabricsColorTextBox" CssClass="EroorSummer" ErrorMessage="কাপড়ের নাম দিন" ValidationGroup="1">*</asp:RequiredFieldValidator>
                                <asp:Label ID="ErrorLabel" runat="server" CssClass="EroorSummer"></asp:Label>
                            </td>
                        </tr>
                        <tr>
                            <td>কাপড়ের নাম</td>
                            <td>
                                <asp:TextBox ID="FabricsNameTextBox" runat="server" CssClass="textbox"></asp:TextBox>
                                <asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="FabricsNameTextBox" CssClass="EroorSummer" ErrorMessage="কাপড়ের নাম দিন" ValidationGroup="1">*</asp:RequiredFieldValidator>
                            </td>
                        </tr>
                        <tr>
                            <td>কাপড়ের কালার</td>
                            <td>
                                <asp:TextBox ID="FabricsColorTextBox" runat="server" CssClass="textbox"></asp:TextBox>
                            </td>
                        </tr>
                        <tr>
                            <td>কাপড়ের স্টাইল</td>
                            <td>
                                <asp:TextBox ID="FabricsStyleTextBox" runat="server" CssClass="textbox"></asp:TextBox>
                            </td>
                        </tr>
                        <tr>
                            <td>প্রতি ইউনিটের বিক্রয় মূল্য</td>
                            <td>
                                <asp:TextBox ID="SellingUnitPriceTextBox" runat="server" CssClass="textbox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false"></asp:TextBox>

                                <asp:RequiredFieldValidator ID="Rf" runat="server" ControlToValidate="SellingUnitPriceTextBox" CssClass="EroorSummer" ErrorMessage="বিক্রয় মূল্য দিন" ValidationGroup="1">*</asp:RequiredFieldValidator>
                            </td>
                        </tr>
                        <tr>
                            <td>কাপড় সম্পর্কে বিস্তারিত</td>
                            <td>
                                <asp:TextBox ID="FabricDetailsTextBox" runat="server" CssClass="textbox"></asp:TextBox>
                            </td>
                        </tr>
                        <tr>
                            <td>কাপড়ের ছবি</td>
                            <td>
                                <asp:FileUpload ID="ImageFileUpload" runat="server" accept=".png,.jpg,.jpeg" />
                            </td>
                        </tr>
                        <tr>
                            <td>&nbsp;</td>
                            <td>
                                <asp:RegularExpressionValidator ID="ReEx" ValidationExpression="([a-zA-Z0-9\s_\\.\-:])+(.png|.jpg|.jpeg)$" ControlToValidate="ImageFileUpload" runat="server" ForeColor="Red" ErrorMessage="কেবল JPG অথবা PNG দেওয়া যাবে" Display="Dynamic" ValidationGroup="1" />
                            </td>
                        </tr>
                        <tr>
                            <td>&nbsp;</td>
                            <td>
                                <asp:Button ID="SubmitButton" runat="server" CssClass="ContinueButton" OnClick="SubmitButton_Click" Text="যুক্ত করুন" ValidationGroup="1" />
                                <br />
                                <label id="ErMsg" class="SuccessMessage"></label>
                                <asp:ValidationSummary ID="ValidationSummary1" runat="server" CssClass="EroorSummer" ValidationGroup="1" />
                            </td>
                        </tr>
                    </table>
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


    <asp:UpdateProgress ID="UpdateProgress" runat="server">
        <ProgressTemplate>
            <div id="progress_BG"></div>
            <div id="progress">
                <img src="../../CSS/Image/gif-load.gif" alt="Loading..." />
                <br />
                <b>Loading...</b>
            </div>
        </ProgressTemplate>
    </asp:UpdateProgress>

    <script>
        function isNumberKey(a) { a = a.which ? a.which : event.keyCode; return 46 != a && 31 < a && (48 > a || 57 < a) ? !1 : !0 };
        function AddPopup() { $find("AddMpe").show(); return !1 };

        function Success() {
            var e = $('#ErMsg');
            e.text("নতুন ফেব্রিক্স সফলভাবে যুক্ত হয়েছে");
            e.fadeIn();
            e.queue(function () { setTimeout(function () { e.dequeue(); }, 3000); });
            e.fadeOut('slow');
        }
    </script>
</asp:Content>
