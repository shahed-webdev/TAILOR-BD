<%@ Page Title="Quick Order" Language="C#" MasterPageFile="~/QuickOrder.Master" AutoEventWireup="true" CodeBehind="Order.aspx.cs" Inherits="TailorBD.AccessAdmin.quick_order.Order" %>

<asp:Content ContentPlaceHolderID="head" runat="server">
    <style>
        .loading-overlay { z-index: 999; position: fixed; bottom: 0; top: 0; left: 0; right: 0; background-color: rgba(0,0,0,.1); display: flex; justify-content: center; align-items: center; }
        .btn-font { padding: .4rem 1rem; font-size: .9rem; margin: 0 }
        .table td { vertical-align: middle; }
         #addStyle .modal-dialog, #addMesurement .modal-dialog{max-width:80%}
     </style>   
    <script src="js/quick-order.js"></script>
</asp:Content>

<asp:Content ContentPlaceHolderID="BasicForm" runat="server">
    <div class="col mb-5" x-data="initData()">
        <h3 class="mb-3 font-weight-bold">Quick Order</h3>

        <div class="row align-items-center mb-4">
            <div class="col-sm-7 col-lg-9" x-data="{ dressId: 0 }">
               <form @submit.prevent="()=>addToListDress(dressId)">
                 <div class="d-flex flex-wrap">
                  <select x-init="getDress()" x-model.number="dressId" :disabled="dressNames.isLoading" class="form-control w-auto" required>
                    <option value="">[ SELECT DRESS ]</option>
                    <template x-for="dress in dressNames.data" :key="dress.DressId">
                       <option :class="dress.IsMeasurementAvailable && 'text-success'" :value="dress.DressId" x-text="dress.DressName"></option>
                    </template>
                  </select>

                 <button class="btn btn-elegant btn-font ml-3" type="submit">Add Dress</button>        
               </div>
              </form>
            </div>

            <div class="col-sm-5 col-lg-3 text-right">
                <button type="button" data-toggle="modal" data-target="#addCustomerModal" class="btn btn-font btn-teal">
                    <i class="fas fa-user-plus"></i>
                    Customer
                </button>
            </div>
        </div>

        <!--customer info-->
        <template x-if="apiData.customerId">
          <div class="d-flex">
            <h5 x-text="customer.data.CustomerName" class="font-weight-bold"></h5>
            <span x-text="customer.data.Phone" class="font-weight-bold ml-2"></span>
          </div>
        </template>
         

        <!--dress list-->
        <div x-show="order.length" class="card card-body">
          <table class="table">
            <thead>
                <tr>
                <th class="font-weight-bold">SN</th>
                <th class="font-weight-bold">Dress Name</th>
                <th style="width:150px" class="font-weight-bold text-center">Quantity</th>
                <th class="font-weight-bold text-center">Add Mesurement</th>
                <th class="font-weight-bold text-center">Add Style</th>
                <th class="font-weight-bold text-center">Remove</th>
             </tr>
            </thead>
            <tbody>
              <template x-for="(item, index) in order" :key="index">
                <tr>
                   <td x-text="index+1"></td>
                   <td x-text="item.dress.dressName"></td>
                   <td class="text-center">
                       <input class="form-control text-center" type="number" min="1" x-model.number="item.quantity" @wheel="(e)=> e.preventDefault()">
                   </td>
                   <td class="text-center">
                       <a class="blue-text" @click="()=> onOpenMesurementStyleModal(true,index)">Mesurement</a>
                   </td>
                   <td class="text-center">
                       <a class="blue-text" @click="()=> onOpenMesurementStyleModal(false,index)">Style</a>
                   </td>
                   <td class="text-center">
                       <a class="red-text" @click="()=>removeDress(item.dress.dressId)"><i class="fas fa-trash"></i></a>
                   </td>
               </tr>
          </template>
          </tbody>
        </table>
       </div>


        <!--mesurement modal-->
        <div class="modal fade" id="addMesurement" tabindex="-1" role="dialog">
          <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header text-center">
                    <h5 x-text="selectedIndex !== null && order[selectedIndex].dress.dressName" class="modal-title w-100 font-weight-bold"></h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>           
                <div class="modal-body mx-3">
                   <div class="row mt-3">
                    <template x-for="group in selectedIndex !== null && order[selectedIndex].mesurements" :key="group.MeasurementGroupId">
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
                </div>          
            </div>
          </div>
        </div> 


        <!--style modal-->
        <div class="modal fade" id="addStyle" tabindex="-1" role="dialog">
          <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header text-center">
                    <h5 x-text="selectedIndex !== null && order[selectedIndex].dress.dressName" class="modal-title w-100 font-weight-bold"></h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>           
                <div class="modal-body mx-3">
                   <div class="row accordion" id="dress-styles" role="tablist" aria-multiselectable="true">
                    <template x-for="styleGroup in selectedIndex !== null && order[selectedIndex].styles" :key="styleGroup.DressStyleCategoryId">
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
                </div>          
            </div>
          </div>
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
                            <label for="customerName">Gender</label>
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
                                <button @click="setMesurements" type="button" :disabled="customer.isLoading" class="btn btn-success">Set Mesurements</button>
                                <button data-dismiss="modal" type="button" :disabled="customer.isLoading" class="btn btn-outline-success">Not Set</button>
                              </div>
                            </template>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div> 
        
        
        <!--loading-->
        <div x-show="isPageLoading" class="loading-overlay">
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
  </div>  
</asp:Content>


