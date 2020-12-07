<%@ Page Title="" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Print_A4_Mesurement.aspx.cs" Inherits="TailorBD.AccessAdmin.Order.Print_A4_Mesurement" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <link href="CSS/A4_Print.css" rel="stylesheet" />
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <a class="print" onclick="window.print()" title="Print This Page"></a>
   <asp:GridView ID="MwithPicGridView" runat="server" AutoGenerateColumns="False" DataKeyNames="OrderListID" DataSourceID="NameOrderListSQL" ShowHeader="False" GridLines="None" BackColor="White" BorderColor="White" BorderStyle="None" AllowPaging="True" PageSize="1" Width="100%">
      <Columns>
         <asp:TemplateField>
            <ItemTemplate>
               <div class="NameLogo">
                  <div class="Sample">Sample</div>
                  <div class="LogoName">
                     <img alt="No Logo" src="../../Handler/TailorInfo.ashx?Img=<%#Eval("InstitutionID") %>" style="height: 80px" /><br />
                     <asp:Label ID="insLabel" runat="server" Text='<%# Bind("InstitutionName") %>' />
                  </div>
                  <div class="OnoDDate">
                     <div class="ODBack">
                        Order No.<br />
                        <asp:Label ID="OrderSerialNumberLabel" runat="server" Text='<%# Bind("OrderSerialNumber") %>' />(<asp:Label ID="OrderList_SNLabel" runat="server" Text='<%# Bind("OrderList_SN") %>' />)
                     </div>
                     <div class="ODBack">
                        Delivery Date<br />
                        <asp:Label ID="DeliveryDateLabel" runat="server" Text='<%# Bind("DeliveryDate","{0:d MMM yy}") %>' />
                     </div>
                  </div>
               </div>
               <asp:HiddenField ID="OrderListIDHiddenField" runat="server" Value='<%# Bind("OrderListID") %>' />
               <div class="Info">
                  <ul>
                     <li>(<asp:Label ID="CNLabel" runat="server" Text='<%# Eval("CustomerNumber") %>' Font-Bold="True" />)
                        <asp:Label ID="CustomerNameLabel" runat="server" Text='<%# Eval("CustomerName") %>' Font-Bold="True" />
                     </li>
                     <li>Mobile:
                        <asp:Label ID="PhoneLabel" runat="server" Text='<%# Eval("Phone") %>' />
                     </li>
                     <li>Order Date:
                        <asp:Label ID="Label1" runat="server" Text='<%# Bind("OrderDate","{0:d MMM yy}") %>' /></li>
               </div>

               <div class="Mwraper">
                  <div class="M">
                     <div class="C_Info">
                        <asp:Label ID="DNLabel" runat="server" Text='<%# Bind("Dress_Name") %>' />
                        <div style="float: right;">
                           <asp:Label ID="DressQuantityLabel" runat="server" Text='<%# Bind("DressQuantity") %>' />
                           Piece</div>
                     </div>
                     <asp:DataList ID="MeasurementDataList" runat="server" DataSourceID="OrderedMeasurmentSQL" Width="100%">
                        <ItemTemplate>
                           <table style="width: 100%">
                              <tr>
                                 <td class="LMesure">
                                    <asp:Label ID="MeasurementTypeLabel" runat="server" Text='<%# Eval("MeasurementType") %>' /></td>
                                 <td class="RMesure">
                                    <asp:Label ID="MeasurementLabel" runat="server" Text='<%# Eval("Measurement") %>' /></td>
                              </tr>
                           </table>
                        </ItemTemplate>
                     </asp:DataList>
                     <asp:SqlDataSource ID="OrderedMeasurmentSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                        SelectCommand="SELECT  Measurement_Type.MeasurementType ,Ordered_Measurement.Measurement FROM  Ordered_Measurement INNER JOIN
 Measurement_Type ON Ordered_Measurement.MeasurementTypeID = Measurement_Type.MeasurementTypeID
WHERE (Ordered_Measurement.OrderListID = @OrderListID)
ORDER BY   ISNULL(Measurement_Type.Ascending ,9999)">
                        <SelectParameters>
                           <asp:ControlParameter ControlID="OrderListIDHiddenField" Name="OrderListID" PropertyName="Value" />
                        </SelectParameters>
                     </asp:SqlDataSource>

                     <div class="DressImg">
                        <img src="../../Handler/DressHandler.ashx?Img=<%#Eval("DressID") %>" />
                     </div>
                  </div>
                  <div class="S">
                     <asp:DataList ID="StyleDataList" runat="server" DataSourceID="StyleSQL" RepeatDirection="Horizontal" RepeatLayout="Flow" CssClass="Style_datalist">
                        <ItemTemplate>
                           <asp:HiddenField ID="DSCidHiddenField" runat="server" Value='<%# Bind("Dress_Style_CategoryID") %>' />
                           <div class="StyleSprt">
                              <asp:Label ID="Dress_Style_Category_NameLabel" runat="server" Text='<%# Eval("Dress_Style_Category_Name") %>' CssClass="SCategory" />
                              <asp:DataList ID="OrderStyleDataList" runat="server" DataKeyField="Dress_StyleID" DataSourceID="OrderStyleSQL" RepeatDirection="Horizontal">
                                 <ItemTemplate>
                                    <div class="Style_Sprt">
                                       <img alt="" src="../../Handler/Style_Name.ashx?Img='<%# Eval("Dress_StyleID") %>'" class="StyleImg" /><br />
                                       <asp:Label ID="Dress_Style_NameLabel" runat="server" Text='<%# Eval("Dress_Style_Name") %>' />
                                       <asp:Label ID="DressSeMLabel" runat="server" Text='<%# Eval("DressStyleMesurement") %>' />
                                    </div>
                                 </ItemTemplate>
                              </asp:DataList>
                           </div>
                           <asp:SqlDataSource ID="OrderStyleSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT  Dress_Style.Dress_StyleID, Dress_Style.Dress_Style_Name, Ordered_Dress_Style.DressStyleMesurement FROM Ordered_Dress_Style INNER JOIN Dress_Style ON Ordered_Dress_Style.Dress_StyleID = Dress_Style.Dress_StyleID
WHERE (Ordered_Dress_Style.OrderListID = @OrderListID) AND (Dress_Style.Dress_Style_CategoryID = @CategoryID)
ORDER BY ISNULL(Dress_Style.StyleSerial, 99999)">
                              <SelectParameters>
                                 <asp:ControlParameter ControlID="OrderListIDHiddenField" Name="OrderListID" PropertyName="Value" />
                                 <asp:ControlParameter ControlID="DSCidHiddenField" Name="CategoryID" PropertyName="Value" />
                              </SelectParameters>
                           </asp:SqlDataSource>
                        </ItemTemplate>
                     </asp:DataList>
                     <asp:SqlDataSource ID="StyleSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                        SelectCommand="SELECT DISTINCT Dress_Style.Dress_Style_CategoryID, Dress_Style_Category.Dress_Style_Category_Name, ISNULL(Dress_Style_Category.CategorySerial, 99999) AS CategorySN
FROM  Ordered_Dress_Style INNER JOIN Dress_Style ON Ordered_Dress_Style.Dress_StyleID = Dress_Style.Dress_StyleID INNER JOIN Dress_Style_Category ON Dress_Style.Dress_Style_CategoryID=Dress_Style_Category.Dress_Style_CategoryID WHERE (Ordered_Dress_Style.OrderListID = @OrderListID) ORDER BY CategorySN">
                        <SelectParameters>
                           <asp:ControlParameter ControlID="OrderListIDHiddenField" Name="OrderListID" PropertyName="Value" />
                        </SelectParameters>
                     </asp:SqlDataSource>
                     <div class="Style_Details">
                        <asp:Label ID="DetailsLabel" Font-Italic="true" runat="server" Text='<%# Bind("Details") %>' />
                     </div>
                  </div>
               </div>
            </ItemTemplate>
         </asp:TemplateField>
      </Columns>
      <PagerStyle CssClass="pgr" />
   </asp:GridView>
   <asp:SqlDataSource ID="NameOrderListSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
      SelectCommand="SELECT OrderList.OrderListID, Dress.Dress_Name, OrderList.DressQuantity, OrderList.OrderListAmount, OrderList.Details, [Order].OrderDate, [Order].DeliveryDate, [Order].OrderSerialNumber, [Order].OrderAmount, OrderList.OrderList_SN, Customer.CustomerNumber, Customer.CustomerName, Customer.Phone, Dress.DressID, Institution.InstitutionID, Institution.InstitutionName FROM OrderList INNER JOIN Dress ON OrderList.DressID = Dress.DressID INNER JOIN [Order] ON OrderList.OrderID = [Order].OrderID INNER JOIN Customer ON OrderList.CustomerID = Customer.CustomerID AND [Order].CustomerID = Customer.CustomerID INNER JOIN Institution ON [Order].InstitutionID = Institution.InstitutionID WHERE (OrderList.OrderID = @OrderID) AND (OrderList.InstitutionID = @InstitutionID)">
      <SelectParameters>
         <asp:QueryStringParameter Name="OrderID" QueryStringField="OrderID" Type="Int32" />
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
      </SelectParameters>
   </asp:SqlDataSource>
</asp:Content>
