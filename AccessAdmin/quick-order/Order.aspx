﻿<%@ Page Title="Quick Order" Language="C#" MasterPageFile="~/QuickOrder.Master" AutoEventWireup="true" CodeBehind="Order.aspx.cs" Inherits="TailorBD.AccessAdmin.quick_order.Order" %>

<asp:Content ContentPlaceHolderID="head" runat="server">
</asp:Content>
<asp:Content ContentPlaceHolderID="BasicForm" runat="server">
    <div class="col mb-5">
        <h3 class="mb-1 font-weight-bold">Quick Order</h3>

        <div class="row align-items-end">
            <div class="col col-sm-6">
                <select id="dress-dropdown" class="form-control" required>
                    <option value="">[ SELECT DRESS ]</option>
                </select>
            </div>

            <div class="col-sm-6 text-right">
                <button type="button" data-toggle="modal" data-target="#addCustomerModal" class="btn btn-sm btn-teal">
                    <i class="fas fa-user-plus"></i>
                    Customer
                </button>
                <div>
                    <span class="badge badge-pill badge-default">md rahim</span>
                    <span class="badge badge-pill badge-default">0171124521</span>
                </div>
            </div>
        </div>

        <!--mesurement-->
        <div class="row mt-3" id="mesurements"></div>

        <!--Accordion wrapper-->
        <div class="row accordion" id="dress-styles" role="tablist" aria-multiselectable="true"></div>
    </div>


    <!--customer add modal-->
    <div class="modal fade" id="addCustomerModal" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header text-center teal lighten-1 white-text">
                    <h4 class="modal-title w-100 font-weight-bold">Add Customer</h4>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form id="addCustomerForm">
                    <div class="modal-body mx-3">
                        <div class="form-group">
                            <label for="phone">Mobile number</label>
                            <input type="text" id="phone" placeholder="find customer by phone" name="Phone" class="form-control find-customer" autocomplete="off" required>
                        </div>
                        <div class="form-group">
                            <label for="customerName">Customer name</label>
                            <input id="customerName" name="CustomerName" placeholder="find customer by name" type="text" class="form-control find-customer" autocomplete="off" required>
                        </div>
                        <div class="form-group">
                            <label for="address">Address</label>
                            <input type="text" id="address" name="Address" class="form-control">
                        </div>
                        <div class="form-group">
                            <label for="customerName">Gender</label>
                            <select name="Gender" class="form-control" required>
                                <option value="1">পুরুষ</option>
                                <option value="2">মহিলা</option>
                                <option value="3">বাচ্চা</option>
                            </select>
                        </div>
                        <div class="d-flex justify-content-center">
                            <button class="btn btn-teal">Add Customer <i class="fas fa-paper-plane-o ml-1"></i></button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="js/quick-order.js"></script>
</asp:Content>


