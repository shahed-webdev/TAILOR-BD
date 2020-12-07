<%@ Page Title="Damage Report" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Damage_Report.aspx.cs" Inherits="TailorBD.AccessAdmin.Fabrics.Damage.Damage_Report" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <link href="../../../JS/DatePicker/jquery.datepick.css" rel="stylesheet" />
   <link href="Css/Report_Print.css" rel="stylesheet" />
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <h3>Damage Report</h3>
   <asp:TextBox ID="FromDateTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" CssClass="Datetime" placeholder="From date" ToolTip="From Date"></asp:TextBox>
   <asp:TextBox ID="ToDateTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" CssClass="Datetime" placeholder="To date" ToolTip="To Date"></asp:TextBox>
   <asp:Button ID="ShowButton" runat="server" Text="Find By Date" CssClass="ContinueButton" />

   <div class="Title">
      <label class="Date"></label>
      Damage
   </div>
   <asp:FormView ID="FormView4" runat="server" DataSourceID="DamageAmountSQL">
      <ItemTemplate>
         <div class="HeadLine">
            Damage Amount:
         <asp:Label ID="Damage_Amount_Specific_DatesLabel" runat="server" Text='<%# Bind("Damage_Amount_Specific_Dates") %>' CssClass="Amount" />
            Tk
         </div>
      </ItemTemplate>
   </asp:FormView>
   <asp:SqlDataSource ID="DamageAmountSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT SUM(DamageFabricsPrice) AS Damage_Amount_Specific_Dates FROM Fabrics_Damage
WHERE  (InstitutionID = @InstitutionID) and Damage_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')"
      CancelSelectOnNullParameter="False">
      <SelectParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
         <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
         <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
      </SelectParameters>
   </asp:SqlDataSource>

   <asp:DataList ID="DataList3" runat="server" DataKeyField="FabricID" DataSourceID="DamageDetailsSQL" RepeatDirection="Horizontal" Width="100%">
      <ItemTemplate>
         <div class="S_Details">
            <div class="Amount">
               <asp:Label ID="FabricCodeLabel" runat="server" Text='<%# Eval("FabricCode") %>' />
               (<asp:Label ID="FabricsNameLabel" runat="server" Text='<%# Eval("FabricsName") %>' />)
            </div>

            <asp:Label ID="Fabrics_Damage_QuantityLabel" runat="server" Text='<%# Eval("Fabrics_Damage_Quantity") %>' />
            (<asp:Label ID="UnitNameLabel" runat="server" Text='<%# Eval("UnitName") %>' />) Damage |

          Price:
         <asp:Label ID="Damage_PriceLabel" runat="server" Text='<%# Eval("Damage_Price") %>' />
            Tk
         </div>
      </ItemTemplate>
   </asp:DataList>
   <asp:SqlDataSource ID="DamageDetailsSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Fabrics.FabricID, Fabrics.FabricsName, Fabrics.FabricCode, SUM(Fabrics_Damage.DamageQuantity) AS Fabrics_Damage_Quantity, SUM(Fabrics_Damage.DamageFabricsPrice) AS Damage_Price,Fabrics_Mesurement_Unit.UnitName
FROM Fabrics_Damage INNER JOIN Fabrics ON Fabrics_Damage.FabricID = Fabrics.FabricID INNER JOIN Fabrics_Mesurement_Unit ON Fabrics.FabricMesurementUnitID = Fabrics_Mesurement_Unit.FabricMesurementUnitID
WHERE(Fabrics_Damage.InstitutionID = @InstitutionID) AND (Fabrics_Damage.Damage_Date BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000'))
GROUP BY Fabrics.FabricCode, Fabrics_Mesurement_Unit.UnitName, Fabrics.FabricsName, Fabrics.FabricID ORDER BY Fabrics_Damage_Quantity DESC"
      CancelSelectOnNullParameter="False">
      <SelectParameters>
         <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
         <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
         <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
      </SelectParameters>
   </asp:SqlDataSource>

   <script src="../../../JS/DatePicker/jquery.datepick.js"></script>
   <script type="text/javascript">
      $(function () {
         $(".Datetime").datepick();

         //get date in label
         var from = $("[id*=FromDateTextBox]").val();
         var To = $("[id*=ToDateTextBox]").val();

         var tt;
         var Brases1 = "";
         var Brases2 = "";
         var A = "";
         var B = "";
         var TODate = "";

         if (To == "" || from == "" || To == "" && from == "") {
            tt = "";
            A = "";
            B = "";
         }
         else {
            tt = " থেকে ";
            Brases1 = "(";
            Brases2 = ")";
         }

         if (To == "" && from == "") { Brases1 = ""; }

         if (To == from) {
            TODate = "";
            tt = "";
            var Brases1 = "";
            var Brases2 = "";
         }
         else { TODate = To; }

         if (from == "" && To != "") {
            B = " এর পূর্বের ";
         }

         if (To == "" && from != "") {
            A = " এর পরের ";
         }

         if (from != "" && To != "") {
            A = "";
            B = "";
         }


         $(".Date").text(Brases1 + from + tt + TODate + B + A + Brases2)
      });
      function isNumberKey(a) { a = a.which ? a.which : event.keyCode; return 46 != a && 31 < a && (48 > a || 57 < a) ? !1 : !0 };
   </script>
</asp:Content>
