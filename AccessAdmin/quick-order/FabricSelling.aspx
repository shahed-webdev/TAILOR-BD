<%@ Page Title="Selling Fabric" Language="C#" MasterPageFile="~/QuickOrder.Master" AutoEventWireup="true" CodeBehind="FabricSelling.aspx.cs" Inherits="TailorBD.AccessAdmin.quick_order.FabricSelling" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
    <script src="js/fabric-selling.js"></script>
</asp:Content>

<asp:Content ID="Content3" ContentPlaceHolderID="BasicForm" runat="server">
    <div class="col mb-5" x-data="initData()">
        <h3 class="mb-4 font-weight-bold">Fabric Selling</h3>
        
        <!--add fabric-->
        <div class="row align-items-center mb-4">
            <div class="col-sm-7 col-lg-9" x-data="{ dressId: 0 }">
                <form @submit.prevent="() => addFabric(selectedIndex)">
                    <div class="mb-3">
                        <div class="form-group">
                            <label>
                                Fabric Code
                                <span x-show="fabricsPayment.StockFabricQuantity>0" class="text-success">Stock: <span x-text="fabricsPayment.StockFabricQuantity"></span></span>
                            </label>
                            <input @keyup="findFabrics" id="findFabrics" x-model="fabricsPayment.For" type="text" class="form-control" autocomplete="off" required>
                        </div>
                    </div>
                </form>
            </div>

            <div class="col-sm-5 col-lg-3 text-right">
                <button type="button" data-toggle="modal" data-target="#addCustomerModal" class="btn btn-font btn-elegant">
                    <i class="fas fa-user-plus"></i>
                    Customer
                </button>
            </div>
        </div>

        <!--customer info-->
        <template x-if="customer.customerId">
          <div class="d-flex mb-2">
            <h5 x-text="customer.data.CustomerName" class="font-weight-bold"></h5>
            <span x-text="customer.data.Phone" class="font-weight-bold ml-2"></span>
          </div>
        </template>
       



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
                            <input @keyup="findCustomer" type="text" id="phone" placeholder="find customer by phone" x-model="customer.data.Phone" class="form-control" autocomplete="off" required>
                        </div>
                        <div class="form-group">
                            <label for="customerName">Customer name</label>
                            <input @keyup="findCustomer" id="customerName" x-model="customer.data.CustomerName" placeholder="find customer by name" type="text" class="form-control" autocomplete="off" required>
                        </div>
                        <div class="form-group">
                            <label for="address">Address</label>
                            <input type="text" id="address" x-model="customer.data.Address" class="form-control">
                        </div>
                        <div class="form-group">
                            <label>Gender</label>
                            <select x-model="customer.data.Cloth_For_ID" class="form-control" required>
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
                              <div>
                                <button @click="setMeasurements" type="button" :disabled="customer.isLoading" class="btn btn-success">Set Measurements</button>
                                <button data-dismiss="modal" type="button" :disabled="customer.isLoading" class="btn btn-outline-success">Not Set</button>
                              </div>
                            </template>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
    </div>
</asp:Content>
