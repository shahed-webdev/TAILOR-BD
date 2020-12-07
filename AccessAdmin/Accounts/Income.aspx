<%@ Page Title="জমা,বাকি ও খরচ দেখুন" Language="C#" MasterPageFile="~/Basic.Master" AutoEventWireup="true" CodeBehind="Income.aspx.cs" Inherits="TailorBD.AccessAdmin.Accounts.Income" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
    <link href="CSS/Income.css" rel="stylesheet" />
   <link href="../../JS/jq_Profile/css/Profile_jquery-ui-1.8.23.custom.css" rel="stylesheet" />
   <link href="../../JS/DatePicker/jquery.datepick.css" rel="stylesheet" />
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="body" runat="server">
    <asp:ScriptManager ID="ScriptManager1" runat="server"></asp:ScriptManager>
   
   <div id="main">
      <ul>
         <li><a href="#Paid">সর্বমোট প্রাপ্ত টাকা</a></li>
         <li><a href="#Due">সর্বমোট বাকি টাকা </a></li>
         <li><a href="#Expanse">সর্বমোট ব্যয় টাকা </a></li>
      </ul>

      <div id="Paid">
         <asp:UpdatePanel ID="UpdatePanel1" runat="server">
            <ContentTemplate>
               <table class="No_Print">
                  <tr>
                     <td>কোন তারিখ থেকে</td>
                     <td>কোন তারিখ পর্যন্ত</td>
                     <td>&nbsp;</td>
                  </tr>
                  <tr>
                     <td>
                        <asp:TextBox ID="PFormDateTextBox" runat="server" placeholder="কোন তারিখ থেকে" CssClass="Datetime"></asp:TextBox>
                     </td>
                     <td>
                        <asp:TextBox ID="PToDateTextBox" runat="server" placeholder="কোন তারিখ পর্যন্ত" CssClass="Datetime"></asp:TextBox>
                     </td>
                     <td>
                        <asp:Button ID="SubmitButton" runat="server" CssClass="SearchButton" OnClick="SubmitButton_Click" />
                     </td>
                  </tr>
                  <tr>
                     <td>&nbsp;</td>
                     <td>&nbsp;</td>
                     <td>&nbsp;</td>
                  </tr>
               </table>

               <label id="Paid_D" class="Amnt"></label> <asp:Label ID="PaidLabel" runat="server" CssClass="Amnt"></asp:Label>

               <asp:GridView ID="CustomerOrderdDressGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataSourceID="PaidSQL" AllowPaging="True" PageSize="30">
                  <Columns>
                     <asp:BoundField DataField="OrderSerialNumber" HeaderText="অর্ডার নং" SortExpression="OrderSerialNumber" />
                      <asp:TemplateField HeaderText="নাম" SortExpression="CustomerName">
                        <ItemTemplate>
                        (<asp:Label ID="Label1" runat="server" Text='<%# Bind("CustomerNumber") %>'></asp:Label>)
                         <asp:Label ID="Label2" runat="server" Text='<%# Bind("CustomerName") %>'></asp:Label>
                        </ItemTemplate>
                         <ItemStyle HorizontalAlign="Left" />
                     </asp:TemplateField>
                     <asp:BoundField DataField="Phone" HeaderText="মোবাইল" SortExpression="Phone" />
                     <asp:BoundField DataField="OrderDate" HeaderText="অর্ডার তারিখ" SortExpression="OrderDate" DataFormatString="{0:d MMM yyyy}" />
                     <asp:BoundField DataField="DeliveryDate" HeaderText="ডেলিঃ তারিখ" SortExpression="DeliveryDate" DataFormatString="{0:d MMM yyyy}" />
                     <asp:BoundField DataField="OrderAmount" HeaderText="মোট" SortExpression="OrderAmount" />
                     <asp:BoundField DataField="Pre_Paid" HeaderText="পূর্বের জমা" SortExpression="Pre_Paid" />
                     <asp:TemplateField HeaderText="জমা" SortExpression="Amount">
                        <ItemTemplate>
                           <asp:Label ID="Label1" runat="server" Text='<%# Bind("Amount") %>'></asp:Label>
                        </ItemTemplate>
                     </asp:TemplateField>
                     <asp:BoundField DataField="Discount" HeaderText="ছাড়" SortExpression="Discount" />
                     <asp:BoundField DataField="DueAmount" HeaderText="বাকি" SortExpression="DueAmount" />
                     <asp:BoundField DataField="Details" HeaderText="বিস্তারিত" SortExpression="Details" ReadOnly="True" />
                     <asp:BoundField DataField="OrderPaid_Date" DataFormatString="{0:d MMM yyy}" HeaderText="জমার তারিখ" SortExpression="OrderPaid_Date" />
                     <asp:BoundField DataField="Account" HeaderText="অ্যাকাউন্ট" SortExpression="Account" />
                  </Columns>
                  <EmptyDataTemplate>
                     কোন রেকর্ড নেই
                  </EmptyDataTemplate>
                  <PagerStyle CssClass="pgr" />
               </asp:GridView>
               <asp:SqlDataSource ID="PaidSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" 
                  SelectCommand="SELECT [Order].OrderDate, [Order].DeliveryDate, [Order].OrderAmount, [Order].Discount ,[Order].DueAmount,([Order].PaidAmount - Payment_Record.Amount) AS Pre_Paid , [Order].OrderSerialNumber, Customer.CustomerNumber, Customer.CustomerName, Customer.Phone, Customer.Address, STUFF((SELECT '; ' + Dress.Dress_Name + ' ' + CAST(OrderList.DressQuantity AS NVARCHAR(50)) + ' Piece ' FROM OrderList INNER JOIN Dress ON OrderList.DressID = Dress.DressID WHERE (OrderList.OrderID = [Order].OrderID) FOR XML PATH('')), 1, 1, '') AS Details, Payment_Record.OrderPaid_Date, Payment_Record.Amount,   ISNULL(Account.AccountName, 'Without Account') AS Account FROM [Order] INNER JOIN Customer ON [Order].CustomerID = Customer.CustomerID INNER JOIN Payment_Record ON [Order].OrderID = Payment_Record.OrderID LEFT OUTER JOIN Account ON Payment_Record.AccountID = Account.AccountID WHERE ([Order].InstitutionID = @InstitutionID) AND Payment_Record.OrderPaid_Date between ISNULL(@Fdate, '1-1-1000') and ISNULL(@Tdate,'1-1-3000')
 ORDER BY [Order].OrderSerialNumber" CancelSelectOnNullParameter="False">
                  <SelectParameters>
                     <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                     <asp:ControlParameter ControlID="PFormDateTextBox" Name="Fdate" PropertyName="Text" />
                     <asp:ControlParameter ControlID="PToDateTextBox" Name="Tdate" PropertyName="Text" />
                  </SelectParameters>
               </asp:SqlDataSource>
               <asp:SqlDataSource ID="ViewPaidSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                  SelectCommand="SELECT ISNULL(SUM(Amount), 0) AS Paid FROM Payment_Record WHERE (InstitutionID = @InstitutionID) AND OrderPaid_Date between ISNULL(@Fdate, '1-1-1000') and ISNULL(@TDate,'1-1-3000')" CancelSelectOnNullParameter="False">
                  <SelectParameters>
                     <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" DefaultValue="" />
                     <asp:ControlParameter ControlID="PFormDateTextBox" Name="Fdate" PropertyName="Text" DefaultValue="" />
                     <asp:ControlParameter ControlID="PToDateTextBox" Name="TDate" PropertyName="Text" DefaultValue="" />
                  </SelectParameters>
               </asp:SqlDataSource>
            </ContentTemplate>
         </asp:UpdatePanel>
      </div>

      <div id="Due">
         <asp:UpdatePanel ID="UpdatePanel2" runat="server">
            <ContentTemplate>
               <table class="No_Print">
                  <tr>
                     <td>কোন তারিখ থেকে</td>
                     <td>কোন তারিখ পর্যন্ত</td>
                     <td>&nbsp;</td>
                  </tr>
                  <tr>
                     <td>
                        <asp:TextBox ID="DFormDateTextBox" runat="server" placeholder="কোন তারিখ থেকে" CssClass="Datetime"></asp:TextBox>
                     </td>
                     <td>
                        <asp:TextBox ID="DToDateTextBox" runat="server" CssClass="Datetime" placeholder="কোন তারিখ পর্যন্ত"></asp:TextBox>
                     </td>
                     <td>
                        <asp:Button ID="DSubmitButton" runat="server" CssClass="SearchButton" OnClick="DSubmitButton_Click" />
                     </td>
                  </tr>
                  <tr>
                     <td>&nbsp;</td>
                     <td>&nbsp;</td>
                     <td>&nbsp;</td>
                  </tr>
               </table>

                <label id="Due_D" class="Amnt"></label>
               <asp:Label ID="DueLabel" runat="server" CssClass="Amnt"></asp:Label>

               <asp:GridView ID="DueGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataSourceID="DueSQL" PageSize="20" AllowPaging="True">
                  <Columns>
                     <asp:BoundField DataField="OrderSerialNumber" HeaderText="অর্ডার নং" SortExpression="OrderSerialNumber" />
                     <asp:TemplateField HeaderText="নাম" SortExpression="CustomerName">
                        <ItemTemplate>
                        (<asp:Label ID="Label1" runat="server" Text='<%# Bind("CustomerNumber") %>'></asp:Label>)
                         <asp:Label ID="Label2" runat="server" Text='<%# Bind("CustomerName") %>'></asp:Label>
                        </ItemTemplate>
                         <ItemStyle HorizontalAlign="Left" />
                     </asp:TemplateField>
                     <asp:BoundField DataField="Phone" HeaderText="মোবাইল" SortExpression="Phone" />
                     <asp:BoundField DataField="OrderDate" HeaderText="অর্ডার তারিখ" SortExpression="OrderDate" DataFormatString="{0:d MMM yyyy}" />
                     <asp:BoundField DataField="DeliveryDate" HeaderText="ডেলিঃ তারিখ" SortExpression="DeliveryDate" DataFormatString="{0:d MMM yyyy}" />
                     <asp:BoundField DataField="OrderAmount" HeaderText="মোট" SortExpression="OrderAmount" />
                     <asp:BoundField DataField="PaidAmount" HeaderText="জমা" SortExpression="PaidAmount" />
                     <asp:BoundField DataField="Discount" HeaderText="ছাড়" SortExpression="Discount" />
                     <asp:BoundField DataField="DueAmount" HeaderText="বাকি" ReadOnly="True" SortExpression="DueAmount" />
                     <asp:BoundField DataField="Details" HeaderText="বিস্তারিত" SortExpression="Details" ReadOnly="True" />
                  </Columns>
                  <EmptyDataTemplate>
                     কোন রেকর্ড নেই
                  </EmptyDataTemplate>
                  <PagerStyle CssClass="pgr" />
               </asp:GridView>
               <asp:SqlDataSource ID="DueSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT [Order].OrderDate, [Order].DeliveryDate, [Order].OrderAmount, [Order].PaidAmount, [Order].Discount, [Order].OrderSerialNumber, Customer.CustomerNumber, Customer.CustomerName, Customer.Phone, Customer.Address, STUFF((SELECT '; ' + Dress.Dress_Name + ' ' + CAST(OrderList.DressQuantity AS NVARCHAR(50)) + ' Piece '  FROM OrderList INNER JOIN Dress ON OrderList.DressID = Dress.DressID WHERE (OrderList.OrderID = [Order].OrderID) FOR XML PATH('')), 1, 1, '') AS Details, [Order].DueAmount FROM [Order] INNER JOIN Customer ON [Order].CustomerID = Customer.CustomerID WHERE ([Order].InstitutionID = @InstitutionID) AND ([Order].PaymentStatus = 'Due') AND [Order].OrderDate Between ISNULL(@FDate, '1-1-1000') and ISNULL(@TDate,'1-1-3000')" CancelSelectOnNullParameter="False">
                  <SelectParameters>
                     <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                     <asp:ControlParameter ControlID="DFormDateTextBox" Name="FDate" PropertyName="Text" />
                     <asp:ControlParameter ControlID="DToDateTextBox" Name="TDate" PropertyName="Text" />
                  </SelectParameters>
               </asp:SqlDataSource>
               <asp:SqlDataSource ID="ViewDueSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                  SelectCommand="SELECT ISNULL(SUM(DueAmount), 0) AS TotalDue FROM [Order] WHERE (InstitutionID = @InstitutionID) AND OrderDate between ISNULL(@FDate, '1-1-1000') AND ISNULL(@TDate,'1-1-3000')" CancelSelectOnNullParameter="False">
                  <SelectParameters>
                     <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" />
                     <asp:ControlParameter ControlID="DFormDateTextBox" Name="FDate" PropertyName="Text" DefaultValue="" />
                     <asp:ControlParameter ControlID="DToDateTextBox" Name="TDate" PropertyName="Text" DefaultValue="" />
                  </SelectParameters>
               </asp:SqlDataSource>
            </ContentTemplate>
         </asp:UpdatePanel>
      </div>

      <div id="Expanse">
         <asp:RadioButtonList ID="FindRadioButtonList" runat="server" RepeatDirection="Horizontal" RepeatLayout="Flow" CssClass="RadioB">
            <asp:ListItem Selected="True">All Date</asp:ListItem>
            <asp:ListItem>Spacific Date</asp:ListItem>
         </asp:RadioButtonList>
         <table class="No_Print">
            <tr>
               <td>
                  <div class="Search_Date">কোন তারিখ থেকে</div>
               </td>
               <td>
                  <div class="Search_Date">
                     কোন তারিখ পর্যন্ত
                  </div>

               </td>
               <td>&nbsp;</td>
               <td>&nbsp;</td>

            </tr>
            <tr>
               <td>
                  <div class="Search_Date">
                     <asp:TextBox ID="EFormDateTextBox" runat="server" placeholder="কোন তারিখ থেকে" CssClass="Datetime"></asp:TextBox>
                  </div>
               </td>
               <td>
                  <div class="Search_Date">
                     <asp:TextBox ID="EToDateTextBox" runat="server" placeholder="কোন তারিখ পর্যন্ত" CssClass="Datetime"></asp:TextBox>
                  </div>
               </td>
               <td>
                  <asp:DropDownList ID="CategoryDropDownList" runat="server" AppendDataBoundItems="True" CssClass="dropdown" DataSourceID="CategorySQL" DataTextField="CategoryName" DataValueField="ExpanseCategoryID">
                     <asp:ListItem Value="%">[ খরচের ধরণ ]</asp:ListItem>
                  </asp:DropDownList>
               </td>
               <td>
                  <asp:Button ID="ESubmitButton" runat="server" CssClass="SearchButton" OnClick="ESubmitButton_Click" />
               </td>
            </tr>
            <tr>
               <td colspan="4">&nbsp;</td>
            </tr>
         </table>

         <asp:SqlDataSource ID="CategorySQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>" SelectCommand="SELECT [CategoryName], [ExpanseCategoryID] FROM [Expanse_Category] WHERE ([InstitutionID] = @InstitutionID)">
            <SelectParameters>
               <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
            </SelectParameters>
         </asp:SqlDataSource>

         <asp:UpdatePanel ID="UpdatePanel3" runat="server">
            <ContentTemplate>
              <label id="Expn_D" class="Amnt"></label>
               <asp:Label ID="ExpnseLabel" runat="server" CssClass="Amnt"></asp:Label>
               <asp:GridView ID="ExpanseGridView" runat="server" AutoGenerateColumns="False" CssClass="mGrid" DataKeyNames="ExpanseID" DataSourceID="ExpanseSQL" AllowPaging="True" PageSize="20">
                  <Columns>
                     <asp:BoundField DataField="CategoryName" HeaderText="খরচের ধরণ" SortExpression="CategoryName" />
                     <asp:BoundField DataField="ExpanseFor" HeaderText="কি বাবদ খরচ" SortExpression="ExpanseFor" />
                     <asp:BoundField DataField="ExpanseAmount" HeaderText="কত টাকা খরচ" SortExpression="ExpanseAmount" />
                     <asp:BoundField DataField="ExpanseDate" DataFormatString="{0:d MMM yyyy}" HeaderText="খরচের তারিখ" SortExpression="ExpanseDate" />
                     <asp:BoundField DataField="Account" HeaderText="অ্যাকাউন্ট" SortExpression="Account" />
                  </Columns>
                  <EmptyDataTemplate>
                     কোন রেকর্ড নেই
                  </EmptyDataTemplate>
                  <PagerStyle CssClass="pgr" />
               </asp:GridView>
               <asp:SqlDataSource ID="ExpanseSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                  SelectCommand="SELECT Expanse.ExpanseID, Expanse.RegistrationID, Expanse.InstitutionID, Expanse.ExpanseCategoryID, Expanse.ExpanseAmount, Expanse.ExpanseFor, Expanse.ExpanseDate, Expanse_Category.CategoryName,  ISNULL(Account.AccountName, 'Without Account') AS Account FROM Expanse INNER JOIN Expanse_Category ON Expanse.ExpanseCategoryID = Expanse_Category.ExpanseCategoryID LEFT OUTER JOIN Account ON Expanse.AccountID = Account.AccountID WHERE (Expanse.InstitutionID = @InstitutionID) AND (Expanse.ExpanseCategoryID like @ExpanseCategoryID) AND (Expanse.ExpanseDate BETWEEN ISNULL(@Fdate, '1-1-1000') AND ISNULL(@Tdate,'1-1-3000')) " CancelSelectOnNullParameter="False">
                  <SelectParameters>
                     <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />

                     <asp:ControlParameter ControlID="CategoryDropDownList" Name="ExpanseCategoryID" PropertyName="SelectedValue" DefaultValue="" />

                     <asp:ControlParameter ControlID="EFormDateTextBox" DefaultValue="" Name="Fdate" PropertyName="Text" />
                     <asp:ControlParameter ControlID="EToDateTextBox" DefaultValue="" Name="Tdate" PropertyName="Text" />

                  </SelectParameters>
               </asp:SqlDataSource>
               <asp:SqlDataSource ID="ViewExpanseSQL" runat="server" ConnectionString="<%$ ConnectionStrings:TailorBDConnectionString %>"
                  SelectCommand="SELECT ISNULL(SUM(ExpanseAmount), 0) AS TotalExp FROM Expanse WHERE (InstitutionID = @InstitutionID) AND (ExpanseCategoryID Like @ExpanseCategoryID)  AND ExpanseDate Between ISNULL(@FDate, '1-1-1000') and ISNULL(@TDate,'1-1-3000')" CancelSelectOnNullParameter="False">
                  <SelectParameters>
                     <asp:CookieParameter CookieName="InstitutionID" Name="InstitutionID" Type="Int32" />
                     <asp:ControlParameter ControlID="CategoryDropDownList" Name="ExpanseCategoryID" PropertyName="SelectedValue" DefaultValue="" />
                     <asp:ControlParameter ControlID="EFormDateTextBox" Name="FDate" PropertyName="Text" />
                     <asp:ControlParameter ControlID="EToDateTextBox" Name="TDate" PropertyName="Text" />
                  </SelectParameters>
               </asp:SqlDataSource>
            </ContentTemplate>
            <Triggers>
               <asp:AsyncPostBackTrigger ControlID="ESubmitButton" EventName="Click" />
            </Triggers>
         </asp:UpdatePanel>
      </div>
   </div>

   <button type="button" class="print" onclick="window.print();"></button>
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


   <script src="../../JS/DatePicker/jquery.datepick.js"></script>
   <script src="../../JS/jq_Profile/jquery-ui-1.8.23.custom.min.js"></script>

   <script type="text/javascript">
      Sys.WebForms.PageRequestManager.getInstance().add_endRequest(function (a, b) {
         $(".Datetime").datepick();

         //Paid Date
         var from = $("[id*=PFormDateTextBox]").val();
         var To = $("[id*=PToDateTextBox]").val();

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

         $("#Paid_D").text(Brases1 + from + tt + TODate + B + A + Brases2)

         //Due Date
         var Dfrom = $("[id*=DFormDateTextBox]").val();
         var DTo = $("[id*=DToDateTextBox]").val();


         if (DTo == "" || Dfrom == "" || DTo == "" && Dfrom == "") {
            tt = "";
            A = "";
            B = "";
         }
         else {
            tt = " থেকে ";
            Brases1 = "(";
            Brases2 = ")";
         }

         if (DTo == "" && Dfrom == "") { Brases1 = ""; }

         if (DTo == Dfrom) {
            TODate = "";
            tt = "";
            var Brases1 = "";
            var Brases2 = "";
         }
         else { TODate = DTo; }

         if (Dfrom == "" && DTo != "") {
            B = " এর পূর্বের ";
         }

         if (DTo == "" && Dfrom != "") {
            A = " এর পরের ";
         }

         if (Dfrom != "" && DTo != "") {
            A = "";
            B = "";
         }

         $("#Due_D").text(Brases1 + Dfrom + tt + TODate + B + A + Brases2)


         //Expense Date
         var Efrom = $("[id*=EFormDateTextBox]").val();
         var ETo = $("[id*=EToDateTextBox]").val();


         if (ETo == "" || Efrom == "" || ETo == "" && Efrom == "") {
            tt = "";
            A = "";
            B = "";
         }
         else {
            tt = " থেকে ";
            Brases1 = "(";
            Brases2 = ")";
         }

         if (ETo == "" && Efrom == "") { Brases1 = ""; }

         if (ETo == Efrom) {
            TODate = "";
            tt = "";
            var Brases1 = "";
            var Brases2 = "";
         }
         else { TODate = ETo; }

         if (Efrom == "" && ETo != "") {
            B = " এর পূর্বের ";
         }

         if (ETo == "" && Efrom != "") {
            A = " এর পরের ";
         }

         if (Efrom != "" && ETo != "") {
            A = "";
            B = "";
         }

         $("#Expn_D").text(Brases1 + Efrom + tt + TODate + B + A + Brases2)
      })

      $(function () {
         $("#main").tabs(); $(".Datetime").datepick(); $(".Search_Date ").hide('slow'); $('input[type="radio"]').click(function () { "Spacific Date" == $(this).attr("value") ? $(".Search_Date").show('slow') : ($(".Search_Date").hide('slow'), $(".Datetime").val(null)) });
      });
   </script>
</asp:Content>
