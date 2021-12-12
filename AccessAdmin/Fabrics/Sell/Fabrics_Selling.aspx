<%@ Page Title="কাপড় বিক্রি করুন" Language="C#" MasterPageFile="~/QuickOrder.Master" AutoEventWireup="true" CodeBehind="Fabrics_Selling.aspx.cs" Inherits="TailorBD.AccessAdmin.Fabrics.Sell.Fabrics_Selling" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
    <script src="js/fabric-selling.js?v=2.1.0"></script>

    <style>
        .stock-position {
            position: absolute;
            position: absolute;
            top: 0;
            right: 15px;
            background-color: #fff;
            color: #000;
            font-size: .8rem;
            padding: 0 2px;
        }
    </style>
</asp:Content>

<asp:Content ID="Content3" ContentPlaceHolderID="BasicForm" runat="server">
    <div class="col mb-5" x-data="initData()">
        <h3 class="mb-4 font-weight-bold">Fabric Selling</h3>
        
        <!--add fabric-->
        <div class="row align-items-center mb-4">
            <div class="col-sm-4 col-lg-5">
                <form @submit.prevent="submitFabric">
                    <div x-init="$refs.input.focus()" class="form-group">
                        <label>Fabric Code
                            <span x-show="fabricsPayment.StockFabricQuantity>0" class="text-success">Stock: <span x-text="fabricsPayment.StockFabricQuantity.toFixed(2)"></span></span>
                        </label>
                        <input placeholder="type code and press enter" x-ref="input" id="findFabrics" placeholder="Find fabric by code" type="text" class="form-control" autocomplete="off" required>
                    </div>
                </form> 
            </div>
        </div>


        <form @submit.prevent="submitOrder">
            <div x-show="order.length" class="row">
                <div class="col-lg-8 col-xl-9 mb-3">
                    <div class="card card-body">
                        <table class="table table-sm">
                            <thead>
                            <tr>
                                <th class="font-weight-bold text-center">SN</th>
                                <th class="font-weight-bold">Fabric</th>
                                <th class="font-weight-bold text-center">Quantity</th>
                                <th class="font-weight-bold text-center">Unit Price</th>
                                <th class="font-weight-bold text-right">Line Total</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            <template x-for="(item, index) in order" :key="index">
                                <tr>
                                    <td class="text-center" x-text="index+1"></td><td>
                                        <p x-text="item.FabricCode" class="font-weight-bold mb-1"></p>
                                        <small x-text="item.FabricsName"></small>
                                    </td>
                                    <td class="text-center position-relative">
                                        <input @input="calculateTotal" @change="saveData" x-model.number="item.Quantity" class="form-control text-center" type="number" min="0.01" :max="item.StockFabricQuantity" step="0.01" @wheel="(e)=> e.preventDefault()" required>
                                        <span class="stock-position">
                                            stock: <span x-text="item.StockFabricQuantity - item.Quantity"></span>
                                        </span>
                                    </td>
                                    <td class="text-center">
                                        <input @input="calculateTotal" @change="saveData" x-model.number="item.UnitPrice" class="form-control text-center" type="number" min="0.01" step="0.01" @wheel="(e)=> e.preventDefault()" required>
                                    </td>
                                    <td class="text-right">
                                        ৳<span x-text="item.UnitPrice * item.Quantity"></span>
                                    </td>
                                    <td class="text-center">
                                        <a class="red-text ml-2" @click="()=>removeFabric(item.FabricId)"><i class="fas fa-times"></i></a>
                                    </td>
                                </tr>
                            </template>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="col-lg-4 col-xl-3">
                    <template x-if="calculateTotal() > 0">
                      <div class="card card-body">
                        <div class="text-right">
                            <h5 class="font-weight-bold">
                                Total: ৳<span x-text="orderTotalAmount"></span>
                            </h5>

                            <div class="form-group">
                                <label>Discount Amount</label>
                                <input x-model.number="orderPayment.Discount" min="0" :max="orderTotalAmount" type="number" step="0.01" class="form-control text-right">
                            </div>
                            <div class="form-group">
                                <label>Paid Amount</label>
                                <input x-model.number="orderPayment.PaidAmount" type="number" step="0.01" min="0" :max="orderTotalAmount - orderPayment.Discount" class="form-control text-right">
                            </div>
                            <div>
                                <p class="font-weight-bold red-text">Due Amount: ৳<strong x-text="(orderTotalAmount - orderPayment.Discount) - orderPayment.PaidAmount"></strong></p>
                            </div>
                            <div class="form-group">
                                <label>Payment Method</label>
                                <select x-init="getAccount()" x-model.number="orderPayment.AccountId" class="form-control">
                                    <option value="">[ SELECT ]</option>
                                    <template x-for="account in paymentMethod" :key="account.AccountId">
                                        <option :selected="account.IsDefault" :value="account.AccountId" x-text="account.AccountName"></option>
                                    </template>
                                </select>
                            </div>
                        </div>
                          <a data-toggle="modal" data-target="#addCustomerModal" class="text-primary">
                              <i class="fas fa-user-plus"></i>
                              Customer
                          </a>
                          <!--customer info-->
                          <template x-if="customer.customerId">
                              <div class="my-2">
                                  <span x-text="customer.data.CustomerName"></span>,
                                  <span x-text="customer.data.Phone"></span>
                              </div>
                          </template>

                        <button :disabled="isSubmit" type="submit" class="btn btn-teal mt-3 w-100">
                            <span x-show="isSubmit">Submitting...</span>
                            <span x-show="!isSubmit">Submit</span>
                        </button>
                    </div>
                    </template>
                </div>
            </div>
        </form>


        <!--customer modal-->
        <div class="modal fade" id="addCustomerModal" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header text-center teal lighten-1 white-text">
                    <h4 class="modal-title w-100 font-weight-bold">Add Customer</h4>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form @submit.prevent="addNewCustomer">
                    <div class="modal-body mx-3">
                        <div class="form-group">
                            <label for="phone">Mobile number</label>
                            <input @keyup="findCustomer" type="text" id="phone" placeholder="Find customer by phone" x-model="customer.data.Phone" class="form-control" autocomplete="off" required>
                        </div>
                        <div class="form-group">
                            <label for="customerName">Customer name</label>
                            <input @keyup="findCustomer" id="customerName" x-model="customer.data.CustomerName" placeholder="Find customer by name" type="text" class="form-control" autocomplete="off" required>
                        </div>
                        <div class="form-group">
                            <label for="address">Address</label>
                            <input type="text" id="address" x-model="customer.data.Address" class="form-control">
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <input type="text" x-model="customer.data.Description" class="form-control">
                        </div>
                        <div class="form-group">
                            <label>Gender</label>
                            <select x-model="customer.data.ClothForId" class="form-control" required>
                                <option value="1">পুরুষ</option>
                                <option value="2">মহিলা</option>
                                <option value="3">বাচ্চা</option>
                            </select>
                        </div>

                        <div class="d-flex justify-content-center">
                            <template x-if="customer.isNewCustomer">
                               <button type="submit" :disabled="customer.isLoading" class="btn btn-teal">Add Customer <i class="fa fa-paper-plane ml-1"></i></button>
                            </template>
                            <template x-if="!customer.isNewCustomer">
                                <button data-dismiss="modal" type="button" class="btn btn-outline-danger">Close</button>
                            </template>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
    </div>
</asp:Content>

