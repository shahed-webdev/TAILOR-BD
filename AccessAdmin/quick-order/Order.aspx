<%@ Page Title="Quick Order" Language="C#" MasterPageFile="~/QuickOrder.Master" AutoEventWireup="true" CodeBehind="Order.aspx.cs" Inherits="TailorBD.AccessAdmin.quick_order.Order" %>

<asp:Content ContentPlaceHolderID="head" runat="server">
</asp:Content>
<asp:Content ContentPlaceHolderID="BasicForm" runat="server">
    <div class="col">
        <h3 class="mb-4 font-weight-bold">Quick Order</h3>

        <div class="row">
            <div class="col col-sm-4">
                <label>Find Customer</label>
                <input id="find-customer" type="text" placeholder="find by name, mobile number" class="form-control">
            </div>

             <div class="col col-sm-4">
                <label>Select Dress</label>
                <select id="dress-dropdown" class="form-control" required>
                    <option value="">[ SELECT ]</option>
                </select>
            </div>
        </div>
    </div>
    <script src="js/quick-order.js"></script>
</asp:Content>


