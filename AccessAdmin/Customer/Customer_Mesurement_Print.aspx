<%@ Page Title="" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Customer_Mesurement_Print.aspx.cs" Inherits="TailorBD.AccessAdmin.Customer.Customer_Mesurement_Print" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
    <link href="Css/Print_Customer_Mesurement.css" rel="stylesheet" />
    <link href="../../JS/jq_Profile/css/Profile_jquery-ui-1.8.23.custom.css" rel="stylesheet" />
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <asp:ScriptManager ID="ScriptManager1" runat="server"></asp:ScriptManager>
    <div id="main">
        <ul>
            <li><a href="#MeasurementWithoutName">নাম ছাড়া মাপ</a></li>
            <li><a href="#MeasurementWithName">নাম সহ মাপ</a></li>
        </ul>
        <asp:UpdatePanel ID="UpdatePanel3" runat="server">
            <ContentTemplate>
                <table class="No_Print">
                    <tr>
                        <td>বর্তমান ফন্ট সাইজ</td>
                    </tr>
                    <tr>
                        <td>
                            <asp:DropDownList ID="FontSizeDropDownList" runat="server" CssClass="dropdown" Width="80px" Height="23px">
                                <asp:ListItem>11</asp:ListItem>
                                <asp:ListItem>12</asp:ListItem>
                                <asp:ListItem>13</asp:ListItem>
                                <asp:ListItem>14</asp:ListItem>
                                <asp:ListItem>16</asp:ListItem>
                                <asp:ListItem>18</asp:ListItem>
                                <asp:ListItem>19</asp:ListItem>
                                <asp:ListItem>20</asp:ListItem>
                            </asp:DropDownList>
                            <asp:SqlDataSource ID="FontSizeSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Print_Font_Size FROM Institution WHERE (InstitutionID = @InstitutionID)" UpdateCommand="UPDATE Institution SET Print_Font_Size = @Print_Font_Size WHERE (InstitutionID = @InstitutionID)">
                                <SelectParameters>
                                    <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                                </SelectParameters>
                                <UpdateParameters>
                                    <asp:ControlParameter ControlID="FontSizeDropDownList" Name="Print_Font_Size" PropertyName="SelectedValue" />
                                    <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                                </UpdateParameters>
                            </asp:SqlDataSource>
                            <asp:Button ID="SaveFontButton" runat="server" OnClick="SaveFontButton_Click" CssClass="SaveFont" ToolTip="সব সময়ের জন্য ফন্ট সাইজ সংরক্ষণ করুন" />
                        </td>
                    </tr>
                </table>
            </ContentTemplate>
        </asp:UpdatePanel>

        <div id="MeasurementWithName">
            <asp:UpdatePanel ID="UpdatePanel1" runat="server">
                <ContentTemplate>
                    <div class="PrintMesure">
                        <asp:GridView ID="OrderGridViewWithName" runat="server" AutoGenerateColumns="False" DataSourceID="NameOrderListSQL" ShowHeader="False" GridLines="None" BackColor="White" BorderColor="White" BorderStyle="None" BorderWidth="1px" CellPadding="1" CssClass="PrintGrid">
                            <Columns>
                                <asp:TemplateField>
                                    <ItemTemplate>
                                        <h3><%#Request.Cookies["Institution_Name"].Value %></h3>
                                        <table class="Table_style">
                                            <tr>
                                                <td>C.No:
                                       <asp:Label ID="CNLabel" runat="server" Text='<%# Bind("CustomerNumber") %>' Font-Bold="True"></asp:Label></td>
                                                <td>
                                                    <asp:Label ID="DNLabel" runat="server" Text='<%# Bind("Dress_Name") %>' /><br />
                                                </td>
                                            </tr>
                                        </table>
                                        <div class="CuName">
                                            <asp:Label ID="CusNLabel" runat="server" Text='<%# Bind("CustomerName") %>' />
                                        </div>
                                        <asp:DataList ID="MeasurementDataList" runat="server" DataSourceID="OrderedMeasurmentSQL" RepeatDirection="Horizontal">
                                            <ItemTemplate>
                                                <asp:Label ID="MeasurementLabel" runat="server" Text='<%# Eval("Measurement") %>' CssClass="M_Size" />
                                                , 
                                            </ItemTemplate>
                                        </asp:DataList>
                                        <asp:SqlDataSource ID="OrderedMeasurmentSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                                            SelectCommand="SELECT  STUFF((SELECT ' '+'(' + Measurement_Type.MeasurementType + '=' + Customer_Measurement.Measurement+')'
FROM Customer_Measurement INNER JOIN Measurement_Type ON Customer_Measurement.MeasurementTypeID = Measurement_Type.MeasurementTypeID
WHERE(Customer_Measurement.CustomerID = @CustomerID)  AND (Measurement_Type.DressID = @DressID) ORDER BY CASE WHEN Measurement_Type.Ascending IS NULL THEN 9999 ELSE Measurement_Type.Ascending END FOR XML PATH('')), 1, 1, '') AS Measurement">
                                            <SelectParameters>
                                                <asp:QueryStringParameter Name="CustomerID" QueryStringField="CustomerID" />
                                                <asp:QueryStringParameter Name="DressID" QueryStringField="DressID" />
                                            </SelectParameters>
                                        </asp:SqlDataSource>

                                        <asp:DataList ID="StyleDataList" runat="server" DataSourceID="StyleSQL" RepeatDirection="Horizontal">
                                            <ItemTemplate>
                                                <asp:Label ID="StyleLabel" runat="server" Text='<%# Eval("Style") %>' CssClass="M_Size" />
                                            </ItemTemplate>
                                        </asp:DataList>

                                        <asp:Label ID="DetailsLabel" Font-Italic="true" runat="server" Text='<%# Bind("CDDetails") %>' CssClass="M_Size"></asp:Label>

                                        <asp:SqlDataSource ID="StyleSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                                            SelectCommand="SELECT  STUFF((SELECT ' ' + T.S FROM(SELECT DISTINCT ISNULL(Dress_Style_Category.CategorySerial, 99999) as NUB , Dress_Style_Category.Dress_Style_Category_Name +'('+

( SELECT  STUFF((SELECT ',' + Dress_Style.Dress_Style_Name +ISNULL ( ' = '+Customer_Dress_Style.DressStyleMesurement+' ','') FROM Customer_Dress_Style INNER JOIN
Dress_Style ON Customer_Dress_Style.Dress_StyleID = Dress_Style.Dress_StyleID 
WHERE (Customer_Dress_Style.CustomerID = @CustomerID) AND (Dress_Style.DressID = @DressID) and (Dress_Style.Dress_Style_CategoryID = DS.Dress_Style_CategoryID) ORDER BY ISNULL(Dress_Style.StyleSerial, 99999)  FOR XML PATH('')), 1, 1, '')) + ')' AS S

FROM Customer_Dress_Style as ODS INNER JOIN 
Dress_Style as DS ON ODS.Dress_StyleID = DS.Dress_StyleID INNER JOIN
Dress_Style_Category ON DS.Dress_Style_CategoryID = Dress_Style_Category.Dress_Style_CategoryID
WHERE (ODS.CustomerID = @CustomerID)) AS T ORDER BY T.NUB  FOR XML PATH('')), 1, 1, '') AS Style">
                                            <SelectParameters>
                                                <asp:QueryStringParameter Name="CustomerID" QueryStringField="CustomerID" />
                                                <asp:QueryStringParameter Name="DressID" QueryStringField="DressID" />
                                            </SelectParameters>
                                        </asp:SqlDataSource>
                                    </ItemTemplate>
                                </asp:TemplateField>
                            </Columns>
                        </asp:GridView>
                    </div>
                </ContentTemplate>
            </asp:UpdatePanel>
        </div>

        <div id="MeasurementWithoutName">
            <asp:UpdatePanel ID="UpdatePanel2" runat="server">
                <ContentTemplate>

                    <div class="PrintMesure">
                        <asp:GridView ID="OrderGridView" runat="server" AutoGenerateColumns="False" DataSourceID="NameOrderListSQL" ShowHeader="False" GridLines="None" BackColor="White" BorderColor="#CCCCCC" BorderStyle="None" BorderWidth="1px" CellPadding="1" CssClass="PrintGrid" PageSize="1">
                            <Columns>
                                <asp:TemplateField>
                                    <ItemTemplate>
                                        <h3><%#Request.Cookies["Institution_Name"].Value %></h3>
                                        <table class="Table_style">
                                            <tr>
                                                <td>C.No:
                                       <asp:Label ID="CNLabel" runat="server" Text='<%# Bind("CustomerNumber") %>' Font-Bold="True"></asp:Label></td>
                                                <td>
                                                    <asp:Label ID="Label1" runat="server" Text='<%# Bind("Dress_Name") %>'></asp:Label><br />
                                                </td>
                                            </tr>
                                        </table>
                                        <div class="CuName">
                                            <asp:Label ID="CusNLabel" runat="server" Text='<%# Bind("CustomerName") %>' />
                                        </div>
                                        <div class="MesureMentSt">
                                            <asp:DataList ID="MeasurementDataList" runat="server" DataSourceID="OrderedMeasurmentSQL" RepeatDirection="Horizontal" RepeatColumns="10">
                                                <ItemTemplate>
                                                    <asp:HiddenField ID="Measurement_GroupIDHiddenField" runat="server" Value='<%# Eval("Measurement_GroupID") %>' />
                                                    <asp:DataList ID="DataList" runat="server" DataSourceID="M_SQL">
                                                        <ItemTemplate>
                                                            <asp:Label ID="MeasurementLabel" runat="server" Text='<%# Eval("Measurement") %>' CssClass="M_Size" />
                                                        </ItemTemplate>
                                                        <SeparatorTemplate>
                                                            <hr />
                                                        </SeparatorTemplate>
                                                    </asp:DataList>
                                                    </div>
                                            <asp:SqlDataSource ID="M_SQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT        Measurement_Type.MeasurementType, Customer_Measurement.Measurement
FROM  Customer_Measurement INNER JOIN
                         Measurement_Type ON Customer_Measurement.MeasurementTypeID = Measurement_Type.MeasurementTypeID
WHERE        (Measurement_Type.Measurement_GroupID = @Measurement_GroupID) AND (Customer_Measurement.CustomerID = @CustomerID) AND (Measurement_Type.DressID = @DressID)
ORDER BY ISNULL(Measurement_Type.Measurement_Group_SerialNo, 9999)">
                                                <SelectParameters>
                                                    <asp:ControlParameter ControlID="Measurement_GroupIDHiddenField" Name="Measurement_GroupID" PropertyName="Value" />
                                                    <asp:QueryStringParameter Name="CustomerID" QueryStringField="CustomerID" />
                                                    <asp:QueryStringParameter Name="DressID" QueryStringField="DressID" />
                                                </SelectParameters>
                                            </asp:SqlDataSource>
                                                </ItemTemplate>
                                            </asp:DataList>
                                            <asp:SqlDataSource ID="OrderedMeasurmentSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                                                SelectCommand="SELECT DISTINCT Measurement_Type.Measurement_GroupID,ISNULL(Measurement_Type.Ascending,9999) AS Ascending
FROM Customer_Measurement INNER JOIN
                         Measurement_Type ON Customer_Measurement.MeasurementTypeID = Measurement_Type.MeasurementTypeID
WHERE        (Customer_Measurement.CustomerID = @CustomerID) AND (Measurement_Type.DressID = @DressID)
ORDER BY Ascending">
                                                <SelectParameters>
                                                    <asp:QueryStringParameter Name="CustomerID" QueryStringField="CustomerID" />
                                                    <asp:QueryStringParameter Name="DressID" QueryStringField="DressID" />
                                                </SelectParameters>
                                            </asp:SqlDataSource>
                                            <asp:DataList ID="StyleDataList" runat="server" DataSourceID="StyleSQL" RepeatDirection="Horizontal">
                                                <ItemTemplate>
                                                    <asp:Label ID="StyleLabel" runat="server" Text='<%# Eval("Style") %>' CssClass="M_Size" />
                                                </ItemTemplate>
                                            </asp:DataList>


                                            <asp:Label ID="DetailsLabel" Font-Italic="true" runat="server" Text='<%# Bind("CDDetails") %>' CssClass="M_Size"></asp:Label>

                                            <asp:SqlDataSource ID="StyleSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                                                SelectCommand="SELECT  STUFF((SELECT ' ' + T.S FROM(SELECT DISTINCT ISNULL(Dress_Style_Category.CategorySerial, 99999) as NUB ,'('+

( SELECT  STUFF((SELECT ',' + Dress_Style.Dress_Style_Name +ISNULL ( ' = '+Customer_Dress_Style.DressStyleMesurement+' ','') FROM Customer_Dress_Style INNER JOIN
Dress_Style ON Customer_Dress_Style.Dress_StyleID = Dress_Style.Dress_StyleID 
WHERE (Customer_Dress_Style.CustomerID = @CustomerID) AND (Dress_Style.DressID = @DressID)  and (Dress_Style.Dress_Style_CategoryID = DS.Dress_Style_CategoryID) ORDER BY ISNULL(Dress_Style.StyleSerial, 99999)  FOR XML PATH('')), 1, 1, '')) + ')' AS S

FROM Customer_Dress_Style as ODS INNER JOIN 
Dress_Style as DS ON ODS.Dress_StyleID = DS.Dress_StyleID INNER JOIN
Dress_Style_Category ON DS.Dress_Style_CategoryID = Dress_Style_Category.Dress_Style_CategoryID
WHERE (ODS.CustomerID = @CustomerID)) AS T ORDER BY T.NUB  FOR XML PATH('')), 1, 1, '') AS Style">
                                                <SelectParameters>
                                                    <asp:QueryStringParameter Name="CustomerID" QueryStringField="CustomerID" />
                                                    <asp:QueryStringParameter Name="DressID" QueryStringField="DressID" />
                                                </SelectParameters>
                                            </asp:SqlDataSource>
                                    </ItemTemplate>
                                </asp:TemplateField>
                            </Columns>
                        </asp:GridView>
                    </div>

                </ContentTemplate>
            </asp:UpdatePanel>
        </div>

        <asp:SqlDataSource ID="NameOrderListSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
            SelectCommand="SELECT Dress.Dress_Name, Customer.CustomerNumber, Customer.CustomerName, Customer.Phone, Customer_Dress.CDDetails FROM Dress INNER JOIN Customer_Dress ON Dress.DressID = Customer_Dress.DressID INNER JOIN Customer ON Customer_Dress.CustomerID = Customer.CustomerID WHERE (Customer_Dress.InstitutionID = @InstitutionID) AND (Customer_Dress.CustomerID = @CustomerID) AND (Customer_Dress.DressID = @DressID)">
            <SelectParameters>
                <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                <asp:QueryStringParameter Name="CustomerID" QueryStringField="CustomerID" />
                <asp:QueryStringParameter Name="DressID" QueryStringField="DressID" />
            </SelectParameters>
        </asp:SqlDataSource>
        <br />
        <input id="btnPrint" type="button" value="" onclick="window.print()" class="print" />
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

    <script src="../../JS/jq_Profile/jquery-ui-1.8.23.custom.min.js"></script>
    <script type="text/javascript">
        $(function () { $('#main').tabs() });

        function PrintPage() { window.print() }

        $("[id*=FontSizeDropDownList]").change(function () { $(".M_Size").css("font-size", $(this).val() + "px") });
        $(".M_Size").css("font-size", $("[id*=FontSizeDropDownList]").val() + "px");

        Sys.WebForms.PageRequestManager.getInstance().add_endRequest(function (a, b) {
            $(".M_Size").css("font-size", $("[id*=FontSizeDropDownList]").val() + "px");
            $("[id*=FontSizeDropDownList]").change(function () { $(".M_Size").css("font-size", $(this).val() + "px") });
        })
    </script>

    <asp:UpdateProgress ID="UpdateProgress1" runat="server">
        <ProgressTemplate>
            <div id="progress_BG"></div>
            <div id="progress">
                <img alt="Loading..." src="../../CSS/Image/gif-load.gif" />
                <br />
                <b>Loading...</b>
            </div>
        </ProgressTemplate>
    </asp:UpdateProgress>
</asp:Content>
