<%@ Page Title="Add Damaged Fabrics" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Damage_Fabrics.aspx.cs" Inherits="TailorBD.AccessAdmin.Fabrics.Damage.Damage_Fabrics" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <link href="../../../JS/DatePicker/jquery.datepick.css" rel="stylesheet" />
   <style>
      .textbox, .Datetime { width: 194px; }
   </style>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <h3>Add Damaged Fabrics</h3>

   <table>
      <tr>
         <td>Fabric</td>
         <td>
            <asp:DropDownList ID="FabricDropDownList" runat="server" AutoPostBack="True" CssClass="dropdown" DataSourceID="FabricSQL" DataTextField="FabricCode" DataValueField="FabricID" OnDataBound="FabricDropDownList_DataBound">
            </asp:DropDownList>
            <asp:SqlDataSource ID="FabricSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT FabricID, FabricCode, StockFabricQuantity FROM Fabrics WHERE (InstitutionID = @InstitutionID) AND (StockFabricQuantity &lt;&gt; 0)">
               <SelectParameters>
                  <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
               </SelectParameters>
            </asp:SqlDataSource>
         </td>
         <td>

            <asp:FormView ID="QntFormView" runat="server" DataSourceID="FabricDetailSQL">
               <ItemTemplate>
                  <b class="Amnt">
                     <asp:Label ID="FabricsNameLabel" runat="server" Text='<%# Eval("FabricsName") %>' />
                     (<asp:Label ID="QuantityLabel" runat="server" Text='<%# Eval("StockFabricQuantity") %>' />
                     <asp:Label ID="Label1" runat="server" Text='<%# Eval("UnitName") %>' />)
                           Selling Unit Price:
                           <asp:Label ID="SellingUnitPLabel" runat="server" Text='<%# Eval("SellingUnitPrice") %>' />
                  </b>
               </ItemTemplate>
            </asp:FormView>
            <asp:SqlDataSource ID="FabricDetailSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Fabrics.Fabric_SN, Fabrics.FabricCode, Fabrics.FabricsName, Fabrics.SellingUnitPrice, Fabrics_Mesurement_Unit.UnitName, Fabrics.StockFabricQuantity FROM Fabrics INNER JOIN Fabrics_Mesurement_Unit ON Fabrics.FabricMesurementUnitID = Fabrics_Mesurement_Unit.FabricMesurementUnitID WHERE (Fabrics.FabricID = @FabricID)">
               <SelectParameters>
                  <asp:ControlParameter ControlID="FabricDropDownList" Name="FabricID" PropertyName="SelectedValue" Type="Int32" />
               </SelectParameters>
            </asp:SqlDataSource>
            <asp:RequiredFieldValidator ID="RequiredFieldValidator55" runat="server" ControlToValidate="FabricDropDownList" CssClass="EroorSummer" ErrorMessage="Required" InitialValue="0" ValidationGroup="1"></asp:RequiredFieldValidator>
         </td>
      </tr>
      <tr>
         <td>Quantity </td>
         <td>
            <asp:TextBox ID="QuantityTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" CssClass="textbox"></asp:TextBox>
         </td>
         <td>
            <asp:RequiredFieldValidator ID="RequiredFieldValidator51" runat="server" ControlToValidate="QuantityTextBox" CssClass="EroorSummer" ErrorMessage="Required" ValidationGroup="1"></asp:RequiredFieldValidator>
            <asp:RegularExpressionValidator ID="FRex3" runat="server" ControlToValidate="QuantityTextBox" CssClass="EroorStar" ErrorMessage="0 Not Allowed" SetFocusOnError="True" ValidationExpression="^0*[1-9][0-9]*(\.[0-9]+)?|0+\.[0-9]*[1-9][0-9]*$" ValidationGroup="1"></asp:RegularExpressionValidator>
         </td>
      </tr>
      <tr>
         <td>Total Price</td>
         <td>
            <asp:TextBox ID="PriceTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" CssClass="textbox"></asp:TextBox>
         </td>
         <td>
            <asp:RequiredFieldValidator ID="RequiredFieldValidator52" runat="server" ControlToValidate="PriceTextBox" CssClass="EroorSummer" ErrorMessage="Required" ValidationGroup="1"></asp:RequiredFieldValidator>
            <asp:RegularExpressionValidator ID="FRex4" runat="server" ControlToValidate="PriceTextBox" CssClass="EroorStar" ErrorMessage="0 Not Allowed" SetFocusOnError="True" ValidationExpression="^0*[1-9][0-9]*(\.[0-9]+)?|0+\.[0-9]*[1-9][0-9]*$" ValidationGroup="1"></asp:RegularExpressionValidator>
         </td>
      </tr>
      <tr>
         <td>Date</td>
         <td>

            <asp:TextBox ID="DateTextBox" onkeypress="return isNumberKey(event)" autocomplete="off" onDrop="blur();return false;" onpaste="return false" runat="server" CssClass="Datetime"></asp:TextBox>

         </td>
         <td>&nbsp;</td>
      </tr>
      <tr>
         <td>&nbsp;</td>
         <td colspan="2">

            <asp:Label ID="StookErLabel" runat="server" ForeColor="#009933"></asp:Label>

         </td>
      </tr>
      <tr>
         <td>&nbsp;</td>
         <td>

            <asp:Button ID="DamageButton" runat="server" CssClass="ContinueButton" Text="Submit" ValidationGroup="1" OnClick="DamageButton_Click" />
            <asp:SqlDataSource ID="FabricsDamageSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" InsertCommand="INSERT INTO Fabrics_Damage(FabricID, InstitutionID, RegistrationID, DamageQuantity, DamageFabricsPrice, Damage_Date) VALUES (@FabricID, @InstitutionID, @RegistrationID, @DamageQuantity, @DamageFabricsPrice, ISNULL(@Damage_Date,getdate()))" SelectCommand="SELECT * FROM [Fabrics_Damage]">
               <InsertParameters>
                  <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                  <asp:CookieParameter CookieName="RegistrationID" Name="RegistrationID" Type="Int32" />
                  <asp:ControlParameter ControlID="FabricDropDownList" Name="FabricID" PropertyName="SelectedValue" Type="Int32" />
                  <asp:ControlParameter ControlID="QuantityTextBox" Name="DamageQuantity" PropertyName="Text" Type="Double" />
                  <asp:ControlParameter ControlID="PriceTextBox" Name="DamageFabricsPrice" PropertyName="Text" Type="Double" />
                  <asp:ControlParameter ControlID="DateTextBox" DbType="Date" Name="Damage_Date" PropertyName="Text" />
               </InsertParameters>
            </asp:SqlDataSource>

         </td>
         <td>&nbsp;</td>
      </tr>
   </table>

   <br />
   <b class="Hide">Damaged Records</b>
   <asp:GridView ID="DamageRecordGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataSourceID="DamageRecordSQL" AllowPaging="True">
      <Columns>
         <asp:BoundField DataField="FabricCode" HeaderText="Fabrics Code" SortExpression="FabricCode" />
         <asp:BoundField DataField="FabricsName" HeaderText="Fabrics Name" SortExpression="FabricsName" />
         <asp:BoundField DataField="DamageQuantity" HeaderText="Quantity" SortExpression="DamageQuantity" />
         <asp:BoundField DataField="DamageFabricsPrice" HeaderText="Price" SortExpression="DamageFabricsPrice" />
         <asp:BoundField DataField="Damage_Date" HeaderText="Date" SortExpression="Damage_Date" DataFormatString="{0:d MMM yyyy}" />
      </Columns>
      <PagerStyle CssClass="pgr" />
   </asp:GridView>
   <asp:SqlDataSource ID="DamageRecordSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Fabrics.FabricCode, Fabrics.FabricsName, Fabrics_Damage.Damage_Date, Fabrics_Damage.DamageFabricsPrice, Fabrics_Damage.DamageQuantity, Fabrics_Damage.InstitutionID FROM Fabrics INNER JOIN Fabrics_Damage ON Fabrics.FabricID = Fabrics_Damage.FabricID WHERE (Fabrics_Damage.InstitutionID = @InstitutionID)">
       <SelectParameters>
           <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
       </SelectParameters>
    </asp:SqlDataSource>

   <script src="../../../JS/DatePicker/jquery.datepick.js"></script>
   <script>
      $(document).ready(function () { $(".Datetime").datepick(); })
      function isNumberKey(a) { a = a.which ? a.which : event.keyCode; return 46 != a && 31 < a && (48 > a || 57 < a) ? !1 : !0 };

      //Quantity TextBox
      $("[id*=QuantityTextBox]").live('keyup', function () {
         var StookQunt = parseFloat($("[id*=QuantityLabel]").text());
         var ReturnQunt = parseFloat($("[id*=QuantityTextBox]").val());

         if (!isNaN(StookQunt) && !isNaN(ReturnQunt)) {
            "" == ($("[id*=QuantityTextBox]").val()) && (ReturnQunt = 0);
            StookQunt >= ReturnQunt ? ($("[id*=DamageButton]").prop("disabled", !1).addClass("ContinueButton"), $("[id*=StookErLabel]").text("Remaining Stook " + (StookQunt - ReturnQunt))) : ($("[id*=DamageButton]").prop("disabled", !0).removeClass("ContinueButton"), $("[id*=StookErLabel]").text("Stock Fabric Quantity " + StookQunt + ". You don't Input Damage " + ReturnQunt));
         }
         else {
            $("[id*=StookErLabel]").text("Select Fabric");
            $("[id*=QuantityTextBox]").val("");
         }
      });

      //Fabric DropDownList
      $("[id*=FabricDropDownList]").live("change", function () {
         $("[id*=QuantityTextBox]").val("");
      });

      //Damage Record GridView is empty
      if (!$('[id*=DamageRecordGridView] tr').length) {
         $(".Hide").hide();
      }
      else {
         $(".Hide").show();
      }
   </script>
</asp:Content>
