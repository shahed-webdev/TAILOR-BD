<%@ Page Title="Quick Order" Language="C#" MasterPageFile="~/QuickOrder.Master" AutoEventWireup="true" CodeBehind="oldOrder.aspx.cs" Inherits="TailorBD.AccessAdmin.quick_order.Order" %>

<asp:Content ContentPlaceHolderID="head" runat="server">
    <style>
        .loading-overlay { z-index: 999; position: fixed; bottom: 0; top: 0; left: 0; right: 0; background-color: rgba(0,0,0,.1); display: flex; justify-content: center; align-items: center; }
    </style>
    <script src="js/quick-order.js"></script>
</asp:Content>

<asp:Content ContentPlaceHolderID="BasicForm" runat="server">
    <div class="col mb-5" x-data="initData()">
        <h3 class="mb-1 font-weight-bold">Quick Order</h3>

        <div class="row align-items-end">
            <div class="col col-sm-6">
                <select @change="onChangeDressDropdown" x-init="getDress()" :disabled="dressNames.isLoading" id="dress-dropdown" class="form-control" required>
                    <option value="">[ SELECT DRESS ]</option>
                    <template x-for="dress in dressNames.data" :key="dress.DressId">
                       <option :class="dress.IsMeasurementAvailable && 'red-text'" :value="dress.DressId" x-text="dress.DressName"></option>
                    </template>
                </select>
            </div>

            <div class="col-sm-6 text-right">
                <button type="button" data-toggle="modal" data-target="#addCustomerModal" class="btn btn-sm btn-teal">
                    <i class="fas fa-user-plus"></i>
                    Customer
                </button>
                <div>
                    <span x-text="customer.data.CustomerName" class="badge badge-pill badge-default"></span>
                    <span x-text="customer.data.Phone" class="badge badge-pill badge-default"></span>
                </div>
            </div>
        </div>

        <!--loading-->
        <div x-show="mesurementsStyles.isLoading" class="loading-overlay">
           <svg xmlns:svg="http://www.w3.org/2000/svg"
	         xmlns="http://www.w3.org/2000/svg" 
	         xmlns:xlink="http://www.w3.org/1999/xlink"
	         version="1.0" width="64px" height="64px"
	         viewBox="0 0 128 128" xml:space="preserve">
	        <path fill="#777" d="M64.4 16a49 49 0 0 0-50 48 51 51 0 0 0 50 52.2 53 53 0 0 0 54-52c-.7-48-45-55.7-45-55.7s45.3 3.8 49 55.6c.8 32-24.8 59.5-58 60.2-33 .8-61.4-25.7-62-60C1.3 29.8 28.8.6 64.3 0c0 0 8.5 0 8.7 8.4 0 8-8.6 7.6-8.6 7.6z">
		        <animateTransform attributeName="transform" type="rotate" from="0 64 64" to="360 64 64" dur="2600ms" repeatCount="indefinite"></animateTransform>
	        </path>
          </svg>
        </div>

        <!--mesurement-->
        <div class="row mt-3" id="mesurements">
           <template x-for="group in mesurementsStyles.data.MeasurementGroups" :key="group.MeasurementGroupId">
             <div class="col-sm-4 col-lg-3 mb-4">
                <div class="card px-3 pt-3 h-100">
                  <template x-for="mesure in group.Measurements" :key="mesure.MeasurementTypeID">
                    <div class="mb-2">
                        <div class="md-form md-outline my-0">
                            <label :class="mesure.Measurement && 'active'" :for="mesure.MeasurementTypeID" x-text="mesure.MeasurementType"></label>
                            <input :id="mesure.MeasurementTypeID" type="text" class="form-control" x-model="mesure.Measurement" autocomplete="off">
                        </div>
                    </div>
                  </template>
                </div>
            </div>
          </template>
        </div>

        <!--Accordion wrapper-->
        <div class="row accordion" id="dress-styles" role="tablist" aria-multiselectable="true">
              <template x-for="styleGroup in mesurementsStyles.data.StyleGroups" :key="styleGroup.DressStyleCategoryId">
                  <div class="col-sm-6 col-lg-4 mb-4">
                    <div class="card">
                       <div class="card-header bg-white" role="tab">
                          <a :href="'#tab' + styleGroup.DressStyleCategoryId" class="collapsed black-text" data-toggle="collapse" data-parent="#dress-styles" aria-expanded="false">
                             <p x-text="styleGroup.DressStyleCategoryName" class="mb-0"></p>
                          </a>
                       </div>

                       <div :id="'tab' + styleGroup.DressStyleCategoryId" class="collapse" role="tabpanel" data-parent="#dress-styles">
                        <div class="card-body">
                           <template x-for="style in styleGroup.Styles" :key="style.DressStyleId">
                               <div class="mb-3">    
                                 <div class="custom-control custom-checkbox mb-1">
                                    <input @change="style.DressStyleMesurement = style.IsCheck ? style.DressStyleMesurement : ''" :id="style.DressStyleId" x-model="style.IsCheck" type="checkbox" class="custom-control-input">
                                    <label class="custom-control-label" x-text="style.DressStyleName" :for="style.DressStyleId"></label>
                                 </div>
                                <input type="text" class="form-control" :disabled="!style.IsCheck" x-model="style.DressStyleMesurement" autocomplete="off">
                              </div>
                           </template>
                       </div>
                       </div>
                    </div>
                  </div>
              </template>
        </div>

        <button type="button" @click="()=> console.log(mesurementsStyles.data)">click</button>
   

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
                            <label for="customerName">Gender</label>
                            <select x-model="customer.data.Cloth_For_ID" class="form-control" required>
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
    </div>
</asp:Content>


