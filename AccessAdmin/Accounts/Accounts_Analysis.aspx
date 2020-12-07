<%@ Page Title="Accounts Summery" Language="C#" MasterPageFile="~/Basic.Master" EnableEventValidation="false" AutoEventWireup="true" CodeBehind="Accounts_Analysis.aspx.cs" Inherits="TailorBD.AccessAdmin.Accounts.Accounts_Analysis" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
   <meta http-equiv="content-type" content="application/xhtml+xml; charset=UTF-8" />
   <link href="../../JS/DatePicker/jquery.datepick.css" rel="stylesheet" />
   <link href="CSS/Accounts_Summery.css" rel="stylesheet" />
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
   <h3>Accounts Summery (By Default Show Today's Report)</h3>

   <asp:TextBox ID="FromDateTextBox" runat="server" CssClass="Datetime"></asp:TextBox>
   <asp:TextBox ID="ToDateTextBox" runat="server" CssClass="Datetime"></asp:TextBox>
   <asp:Button ID="FindButton" runat="server" Text="Find" CssClass="ContinueButton" />

   <div id="Expo_Log" class="ACC_Log" runat="server">
      <div class="Expo_Name">
         <asp:HiddenField ID="GetDateHF" runat="server" />
         <asp:Label ID="Insti_NameLabel" runat="server"></asp:Label><br />
         <asp:Label ID="DateLabel" runat="server"></asp:Label>
      </div>

      <div class="In Title" id="Export_IN">
         <asp:FormView ID="Total_IN_FormView" runat="server" DataSourceID="Total_Cash_IN_SQL">
            <ItemTemplate>
               <label class="Date"></label>
               Total Cash In: 
               <asp:Label ID="Total_INLabel" runat="server" Text='<%# Bind("Total_IN") %>' />
               /-
            </ItemTemplate>
         </asp:FormView>
         <asp:SqlDataSource ID="Total_Cash_IN_SQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT ISNULL(SUM(Amount),0) AS Total_IN FROM Account_Log WHERE  (InstitutionID = @InstitutionID) AND Add_Subtraction ='Add' AND Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')">
            <SelectParameters>
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
               <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
               <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
            </SelectParameters>
         </asp:SqlDataSource>
      </div>

      <asp:DataList ID="IN_CategoryDataList" runat="server" DataSourceID="IN_CategorySQL" Width="100%" RepeatDirection="Horizontal" RepeatLayout="Flow">
         <ItemTemplate>
            <div class="A_Name Sub_In">
               <asp:Label ID="CategoryLabel" runat="server" Text='<%# Eval("Category") %>' />
               (<asp:Label ID="TotalLabel" runat="server" Text='<%# Eval("Total","{0:n}") %>' />
               Tk)
            </div>
            <asp:GridView ID="InLogGridView" runat="server" AutoGenerateColumns="False" DataSourceID="In_SituationSQL" Width="100%" CssClass="mGrid">
               <Columns>
                  <asp:BoundField DataField="Log_SN" HeaderText="SN" SortExpression="Log_SN" />
                  <asp:BoundField DataField="Situation" HeaderText="Situation" SortExpression="Situation" />
                  <asp:BoundField DataField="Amount" HeaderText="Amount" SortExpression="Amount" />
                  <asp:BoundField DataField="Details" HeaderText="Details" SortExpression="Details" />
                  <asp:BoundField DataField="UserName" HeaderText="User Name" SortExpression="UserName">
                     <HeaderStyle Width="85px" />
                  </asp:BoundField>
                  <asp:BoundField DataField="Insert_Date" HeaderText="Date" SortExpression="Insert_Date" DataFormatString="{0:d MMM yyyy}" />
                  <asp:BoundField DataField="Insert_Time" HeaderText="Time" SortExpression="Insert_Time" />
               </Columns>
            </asp:GridView>
            <asp:SqlDataSource ID="In_SituationSQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Account_Log.Log_SN, Account_Log.Situation, Account_Log.Amount, Account_Log.Details, Registration.UserName, Account_Log.Insert_Date, CONVERT(varchar(15),Account_Log.Insert_Time,100) AS Insert_Time FROM Account_Log LEFT OUTER JOIN Registration ON Account_Log.RegistrationID = Registration.RegistrationID WHERE (Account_Log.InstitutionID = @InstitutionID) AND (Account_Log.Category = @Category) AND (Account_Log.Add_Subtraction = N'Add') AND (Account_Log.In_Ex_type =N'In') AND  (Account_Log.Insert_Date BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000'))">
               <SelectParameters>
                  <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                  <asp:ControlParameter ControlID="CategoryLabel" Name="Category" PropertyName="Text" />
                  <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                  <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
               </SelectParameters>
            </asp:SqlDataSource>
         </ItemTemplate>
      </asp:DataList>
      <asp:SqlDataSource ID="IN_CategorySQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT  Category, ISNULL(SUM(Amount),0) AS Total FROM Account_Log 
WHERE (InstitutionID = @InstitutionID) AND (Add_Subtraction = N'Add')  AND (In_Ex_type =N'In') AND (Insert_Date BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000')) 
GROUP BY Category ORDER BY Category">
         <SelectParameters>
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
            <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
            <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
         </SelectParameters>
      </asp:SqlDataSource>

      <asp:FormView ID="IN_Deleted_FormView" runat="server" DataSourceID="In_Deleted_Amount_SQL">
         <ItemTemplate>
            <div class="Adjsmnt In_Adjs">
               Cash In By Adjustment :
               <asp:Label ID="Amount_In_By_deleteLabel" runat="server" Text='<%# Bind("Amount_In_By_delete") %>' />
               Tk
            </div>
         </ItemTemplate>
      </asp:FormView>
      <asp:SqlDataSource ID="In_Deleted_Amount_SQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT ISNULL(SUM(Amount),0) AS Amount_In_By_delete FROM Account_Log
WHERE (InstitutionID = @InstitutionID) AND (Add_Subtraction = N'Add') AND (In_Ex_type =N'Ex') AND (Insert_Date BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000'))">
         <SelectParameters>
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
            <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
            <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
         </SelectParameters>
      </asp:SqlDataSource>

      <asp:DataList ID="IN_DeletedDataList" runat="server" DataSourceID="IN_Deleted_CategorySQL" Width="100%" RepeatDirection="Horizontal" RepeatLayout="Flow">
         <ItemTemplate>
            <div class="A_Name Sub_In">
               <asp:Label ID="CategoryLabel" runat="server" Text='<%# Eval("Category") %>' />
               (<asp:Label ID="TotalLabel" runat="server" Text='<%# Eval("Total","{0:n}") %>' />
               Tk)
            </div>

            <asp:GridView ID="InLogGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataSourceID="IN_Deleted_SituationSQL" Width="100%">
               <Columns>
                  <asp:BoundField DataField="Log_SN" HeaderText="SN" SortExpression="Log_SN" />
                  <asp:BoundField DataField="Situation" HeaderText="Situation" SortExpression="Situation" />
                  <asp:BoundField DataField="Amount" HeaderText="Amount" SortExpression="Amount" />
                  <asp:BoundField DataField="Details" HeaderText="Details" SortExpression="Details" />
                  <asp:BoundField DataField="UserName" HeaderText="User Name" SortExpression="UserName">
                     <HeaderStyle Width="85px" />
                  </asp:BoundField>
                  <asp:BoundField DataField="Insert_Date" DataFormatString="{0:d MMM yyyy}" HeaderText="Date" SortExpression="Insert_Date" />
                  <asp:BoundField DataField="Insert_Time" HeaderText="Time" SortExpression="Insert_Time" />
               </Columns>
            </asp:GridView>
            <asp:SqlDataSource ID="IN_Deleted_SituationSQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Account_Log.Log_SN, Account_Log.Situation, Account_Log.Amount, Account_Log.Details, Registration.UserName, Account_Log.Insert_Date, CONVERT(varchar(15),Account_Log.Insert_Time,100) AS Insert_Time FROM Account_Log LEFT OUTER JOIN
Registration ON Account_Log.RegistrationID = Registration.RegistrationID WHERE (Account_Log.InstitutionID = @InstitutionID) AND (Account_Log.Category = @Category) AND (Account_Log.Add_Subtraction = N'Add')
AND (Account_Log.In_Ex_type =N'Ex') AND (Account_Log.Insert_Date BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000'))">
               <SelectParameters>
                  <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                  <asp:ControlParameter ControlID="CategoryLabel" Name="Category" PropertyName="Text" />
                  <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                  <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
               </SelectParameters>
            </asp:SqlDataSource>
         </ItemTemplate>
      </asp:DataList>
      <asp:SqlDataSource ID="IN_Deleted_CategorySQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT  Category, ISNULL(SUM(Amount),0) AS Total FROM Account_Log WHERE (InstitutionID = @InstitutionID) AND (Add_Subtraction = N'Add')  AND (In_Ex_type =N'Ex') AND (Insert_Date BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000')) 
GROUP BY Category ORDER BY Category">
         <SelectParameters>
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
            <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
            <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
         </SelectParameters>
      </asp:SqlDataSource>

      <div class="Out Title" id="Export_OUT">
         <asp:FormView ID="Cash_Out_FormView" runat="server" DataSourceID="Total_Cash_Out_SQL">
            <ItemTemplate>
               <label class="Date"></label>
               Total Cash Out: 
               <asp:Label ID="Total_OutLabel" runat="server" Text='<%# Bind("Total_Out") %>' />
               /-
            </ItemTemplate>
         </asp:FormView>
         <asp:SqlDataSource ID="Total_Cash_Out_SQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT ISNULL(SUM(Amount),0) AS Total_Out FROM Account_Log WHERE (InstitutionID = @InstitutionID) AND Add_Subtraction ='Subtraction' AND Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')">
            <SelectParameters>
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
               <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
               <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
            </SelectParameters>
         </asp:SqlDataSource>
      </div>

      <asp:DataList ID="OCDataList" runat="server" DataSourceID="Out_CategorySQL" Width="100%" RepeatDirection="Horizontal" RepeatLayout="Flow">
         <ItemTemplate>
            <div class="A_Name Sub_Out ">
               <asp:Label ID="CategoryLabel" runat="server" Text='<%# Eval("Category") %>' />
               (<asp:Label ID="TotalLabel" runat="server" Text='<%# Eval("Total","{0:n}") %>' />
               Tk)
            </div>
            <asp:GridView ID="InLogGridView" runat="server" AutoGenerateColumns="False" CssClass="Out_Grid" DataSourceID="Out_Situation_SQL" Width="100%">
               <Columns>
                  <asp:BoundField DataField="Log_SN" HeaderText="SN" SortExpression="Log_SN" />
                  <asp:BoundField DataField="Situation" HeaderText="Situation" SortExpression="Situation" />
                  <asp:BoundField DataField="Amount" HeaderText="Amount" SortExpression="Amount" />
                  <asp:BoundField DataField="Details" HeaderText="Details" SortExpression="Details" />
                  <asp:BoundField DataField="UserName" HeaderText="User Name" SortExpression="UserName">
                     <HeaderStyle Width="85px" />
                  </asp:BoundField>
                  <asp:BoundField DataField="Insert_Date" DataFormatString="{0:d MMM yyyy}" HeaderText="Date" SortExpression="Insert_Date" />
                  <asp:BoundField DataField="Insert_Time" HeaderText="Time" SortExpression="Insert_Time" />
               </Columns>
            </asp:GridView>
            <asp:SqlDataSource ID="Out_Situation_SQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Account_Log.Log_SN, Account_Log.Situation, Account_Log.Amount, Account_Log.Details, Registration.UserName, Account_Log.Insert_Date, CONVERT(varchar(15),Account_Log.Insert_Time,100) AS Insert_Time FROM Account_Log LEFT OUTER JOIN
Registration ON Account_Log.RegistrationID = Registration.RegistrationID WHERE (Account_Log.InstitutionID = @InstitutionID) AND (Account_Log.Category = @Category) AND (Account_Log.Add_Subtraction = N'Subtraction')
AND (Account_Log.In_Ex_type =N'Ex') AND (Account_Log.Insert_Date BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000'))">
               <SelectParameters>
                  <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                  <asp:ControlParameter ControlID="CategoryLabel" Name="Category" PropertyName="Text" />
                  <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                  <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
               </SelectParameters>
            </asp:SqlDataSource>
         </ItemTemplate>
      </asp:DataList>
      <asp:SqlDataSource ID="Out_CategorySQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT  Category, SUM(Amount) AS Total FROM Account_Log WHERE (InstitutionID = @InstitutionID) AND (Add_Subtraction = N'Subtraction')  AND (In_Ex_type =N'Ex') AND (Insert_Date BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000')) 
GROUP BY Category ORDER BY Category">
         <SelectParameters>
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
            <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
            <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
         </SelectParameters>
      </asp:SqlDataSource>

      <asp:FormView ID="DAFormView" runat="server" DataSourceID="Out_Deleted_Amount_SQL">
         <ItemTemplate>
            <div class="Adjsmnt Out_Adjs">
               Cash Out By Adjustment:
               <asp:Label ID="Amount_Out_By_deleteLabel" runat="server" Text='<%# Bind("Amount_Out_By_delete","{0:n}") %>' />
               Tk
            </div>
         </ItemTemplate>
      </asp:FormView>
      <asp:SqlDataSource ID="Out_Deleted_Amount_SQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT SUM(Amount) AS Amount_Out_By_delete FROM Account_Log WHERE (InstitutionID = @InstitutionID) AND (Add_Subtraction = N'Subtraction') AND (In_Ex_type = N'In') AND (Insert_Date BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000'))">
         <SelectParameters>
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
            <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
            <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
         </SelectParameters>
      </asp:SqlDataSource>

      <asp:DataList ID="DOCDataList" runat="server" DataSourceID="Out_Deleted_CategorySQL" Width="100%" RepeatDirection="Horizontal" RepeatLayout="Flow">
         <ItemTemplate>
            <div class="A_Name Sub_Out ">
               <asp:Label ID="CategoryLabel" runat="server" Text='<%# Eval("Category") %>' />
               (<asp:Label ID="TotalLabel" runat="server" Text='<%# Eval("Total","{0:n}") %>' />)
            </div>
            <asp:GridView ID="InLogGridView" runat="server" AutoGenerateColumns="False" CssClass="Out_Grid" DataSourceID="Out_SituationSQL" Width="100%">
               <Columns>
                  <asp:BoundField DataField="Log_SN" HeaderText="SN" SortExpression="Log_SN" />
                  <asp:BoundField DataField="Situation" HeaderText="Situation" SortExpression="Situation" />
                  <asp:BoundField DataField="Amount" HeaderText="Amount" SortExpression="Amount" />
                  <asp:BoundField DataField="Details" HeaderText="Details" SortExpression="Details" />
                  <asp:BoundField DataField="UserName" HeaderText="User Name" SortExpression="UserName">
                     <HeaderStyle Width="85px" />
                  </asp:BoundField>
                  <asp:BoundField DataField="Insert_Date" HeaderText="Date" SortExpression="Insert_Date" DataFormatString="{0:d MMM yyyy}" />
                  <asp:BoundField DataField="Insert_Time" HeaderText="Time" ReadOnly="True" SortExpression="Insert_Time" />
               </Columns>
            </asp:GridView>
            <asp:SqlDataSource ID="Out_SituationSQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT Account_Log.Log_SN, Account_Log.Situation, Account_Log.Amount, Account_Log.Details, Registration.UserName, Account_Log.Insert_Date, CONVERT(varchar(15),Account_Log.Insert_Time,100) AS Insert_Time FROM Account_Log  LEFT OUTER JOIN
Registration ON Account_Log.RegistrationID = Registration.RegistrationID WHERE (Account_Log.InstitutionID = @InstitutionID) AND (Account_Log.Category = @Category) AND (Account_Log.Add_Subtraction = N'Subtraction')
AND (Account_Log.In_Ex_type =N'In') AND (Account_Log.Insert_Date BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000'))">
               <SelectParameters>
                  <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                  <asp:ControlParameter ControlID="CategoryLabel" Name="Category" PropertyName="Text" />
                  <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
                  <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
               </SelectParameters>
            </asp:SqlDataSource>
         </ItemTemplate>
      </asp:DataList>
      <asp:SqlDataSource ID="Out_Deleted_CategorySQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT  Category, ISNULL(SUM(Amount),0) AS Total FROM Account_Log WHERE (InstitutionID = @InstitutionID) AND (Add_Subtraction = N'Subtraction')  AND (In_Ex_type =N'In') AND (Insert_Date BETWEEN ISNULL(@From_Date, '1-1-1000') AND ISNULL(@To_Date, '1-1-3000')) 
GROUP BY Category order by Category">
         <SelectParameters>
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
            <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
            <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
         </SelectParameters>
      </asp:SqlDataSource>

      <asp:FormView ID="TotalNetFormView" runat="server" DataSourceID="TotalNetSQL" Width="100%">
         <ItemTemplate>
            <div class="Net_Amt">
               Net Amount:
         <asp:Label ID="NetLabel" runat="server" Text='<%# Bind("Net","{0:n}") %>' />
               /-
            </div>
         </ItemTemplate>
      </asp:FormView>
      <asp:SqlDataSource ID="TotalNetSQL" runat="server" CancelSelectOnNullParameter="False" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT 
(ISNULL((SELECT SUM(Amount) FROM Account_Log WHERE  (InstitutionID = @InstitutionID) AND Add_Subtraction ='Add' 
AND Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')),0) -
ISNULL((SELECT SUM(Amount) FROM Account_Log WHERE (InstitutionID = @InstitutionID) AND Add_Subtraction ='Subtraction' 
AND Insert_Date between ISNULL(@From_Date, '1-1-1000') and ISNULL(@To_Date,'1-1-3000')),0)) AS Net">
         <SelectParameters>
            <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
            <asp:ControlParameter ControlID="FromDateTextBox" Name="From_Date" PropertyName="Text" />
            <asp:ControlParameter ControlID="ToDateTextBox" Name="To_Date" PropertyName="Text" />
         </SelectParameters>
      </asp:SqlDataSource>

      <p>Provided by tailorbd.com © 2015-2017 </p>
   </div>
   <asp:Button ID="ExportButton" runat="server" OnClick="In_Export_Button_Click" Text="Export To Word" CssClass="ContinueButton" />

   <script src="../../JS/DatePicker/jquery.datepick.js"></script>
   <script type="text/javascript">
      $(function () {
         $(".Datetime").datepick();

         if ($('[id*=IN_DeletedDataList] tr').length) {
            $(".In_Adjs").show();
         }
         if ($('[id*=DOCDataList] tr').length) {
            $(".Out_Adjs").show();
         }


         //get date in label
         var from = $("[id*=FromDateTextBox]").val();
         var To = $("[id*=ToDateTextBox]").val();

         $("#txtDate").val();

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
            tt = " To ";
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
            B = " Before ";
         }

         if (To == "" && from != "") {
            A = " After ";
         }

         if (from != "" && To != "") {
            A = "";
            B = "";
         }

         $(".Date").text(Brases1 + from + tt + TODate + B + A + Brases2);

         var DT = Brases1 + from + tt + TODate + B + A + Brases2;
         $('[id*=GetDateHF]').val(DT);
      });
      function isNumberKey(a) { a = a.which ? a.which : event.keyCode; return 46 != a && 31 < a && (48 > a || 57 < a) ? !1 : !0 };
   </script>
</asp:Content>
