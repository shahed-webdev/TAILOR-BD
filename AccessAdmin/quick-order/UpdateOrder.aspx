﻿<%@ Page Title="Update Order" Language="C#" MasterPageFile="~/QuickOrder.Master" AutoEventWireup="true" CodeBehind="UpdateOrder.aspx.cs" Inherits="TailorBD.AccessAdmin.quick_order.UpdateOrder" %>
<asp:Content ContentPlaceHolderID="head" runat="server">
    <style>
        .loading-overlay { z-index: 999; position: fixed; bottom: 0; top: 0; left: 0; right: 0; background-color: rgba(0,0,0,.1); display: flex; justify-content: center; align-items: center; }
        .btn-font { padding: .4rem 1rem; font-size: .9rem; margin: 0 }
        .table td { vertical-align: middle; }
        #addStyle .modal-dialog, #addMeasurement .modal-dialog { max-width: 80% }
    </style> 

    <script src="js/update-order.js?v=2.1.0"></script>
</asp:Content>

<asp:Content ContentPlaceHolderID="BasicForm" runat="server">
    <div x-init="getOrder()" class="col mb-5" x-data="initData()">
        <div class="mb-4 d-flex justify-content-between align-items-center">
          <h3 class="font-weight-bold">
            Update Order:
              <span x-show="!isPageLoading" class="gray-text">
                  <small>Order Number:</small>
                  <small x-text="orderNumber"></small>
              </span>
          </h3>
            <button @click="deleteOrder" :disabled="customer.PaidAmount > 0 || isDeleting" x-show="!isPageLoading" type="button" class="btn btn-danger">Delete Order</button>
        </div>

        <!--dress dropdown-->
        <div class="row align-items-center mb-4">
            <div class="col-sm-7 col-lg-9" x-data="{ dressId: 0 }">
               <form @submit.prevent="()=>addToListDress(dressId)">
                 <div class="d-flex flex-wrap">
                  <select x-model.number="dressId" :disabled="dressNames.isLoading" class="form-control w-auto" required>
                    <option value="">[ SELECT DRESS ]</option>
                    <template x-for="dress in dressNames.data" :key="dress.DressId">
                       <option :class="dress.IsMeasurementAvailable && 'text-success'" :value="dress.DressId" x-text="dress.DressName"></option>
                    </template>
                  </select>

                 <button class="btn btn-elegant btn-font ml-3" type="submit">Add Dress</button>        
               </div>
              </form>
            </div>
        </div>

        <!--customer info-->
        <div class="d-flex mb-3">
          <h5 x-text="customer.CustomerName" class="font-weight-bold"></h5>,
          <span x-text="customer.Phone" class="font-weight-bold ml-2"></span>
        </div>

        <form @submit.prevent="submitOrder">
           <!--dress list-->
            <div x-show="order.length" class="card card-body">
               <table class="table table-sm">
                <thead>
                <tr>
                <th style="width:30px" class="font-weight-bold">SN</th>
                <th class="font-weight-bold">Dress</th>
                <th style="width:100px" class="font-weight-bold text-center">Quantity</th>
                <th class="font-weight-bold text-center">Details</th>
                <th style="width:10px"></th>
             </tr>
            </thead>
                <tbody>
              <template x-for="(item, index) in order" :key="index">
                <tr>
                   <td x-text="index+1"></td>
                   <td>
                       <p class="font-weight-bold mb-1" x-text="item.dress.dressName"></p>
                      
                       <button type="button" class="btn btn-cyan btn-font py-1" @click="()=> onOpenMeasurementStyleModal(true,index)">Measurement</button>
                       <button type="button" class="btn btn-unique btn-font py-1 mx-2" @click="()=> onOpenMeasurementStyleModal(false,index)">Style</button>
                       <button :disabled="isPaymentClick" type="button" class="btn btn-success btn-font py-1" @click="()=> onOpenPaymentModal(item.dress.dressId,index)">Payment</button>
                   </td>
                   <td class="text-center">
                       <input x-model.number="item.quantity" class="form-control text-center" type="number" min="1" @wheel="(e)=> e.preventDefault()" required>
                   </td>
                   <td class="text-center">
                       <input x-model="item.orderDetails" type="text" class="form-control" placeholder="dress details">
                   </td>
                    <td>
                        <a class="red-text ml-2" @click="() => removeDress(item.dress.dressId, item.orderListId)"><i class="fas fa-times"></i></a>
                    </td>
                </tr>
          </template>
          </tbody>
              </table>
            </div>
       

            <!-- payment list-->
            <div class="mt-4">
             <template x-for="(item, index) in order" :key="index">
                <div>
                 <h4 x-show="item?.payments && item?.payments.length" x-text="item.dress.dressName"></h4>
                    <table x-show="item?.payments && item?.payments.length" class="table table-sm table-fixed">
                      <thead>
                        <tr>
                            <th class="font-weight-bold">Payment For</th>
                            <th style="width: 100px" class="text-center font-weight-bold">Unit</th>
                            <th class="font-weight-bold text-right">Unit Price</th>
                            <th class="font-weight-bold text-right">Line Total</th>
                            <th class="font-weight-bold text-center">Remove</th>
                        </tr>
                    </thead>
                      <tbody>
                        <template x-for="(payment, i) in item.payments" :key="i">
                            <tr>
                                <td>
                                    <p class="mb-0" x-text="payment.For"></p>
                                    <span x-show="payment.StockFabricQuantity" class="text-primary">
                                        Remaining Stock:
                                        <span x-text="payment.StockFabricQuantity - payment.Quantity"></span>
                                    </span>
                                </td>
                                <td class="text-center" x-text="payment.Quantity"></td>
                                <td class="text-right">
                                    ৳<span x-text="payment.UnitPrice"></span>
                                </td>
                                <td class="text-right">
                                    ৳<span x-text="payment.UnitPrice * payment.Quantity"></span>
                                </td>
                                <td class="text-center">
                                    <a class="red-text ml-2" @click="()=> removePayment(payment.For, payment.OrderPaymentId, index)"><i class="fas fa-times"></i></a>
                                </td>
                            </tr>
                        </template>
                    </tbody>
                   </table>
                </div>
             </template>
           </div>
             
           <template x-if="order.length">
               <div class="d-flex justify-content-end">
                <div>
                   <template x-if="calculateTotal() > 0">
                    <div class="text-right pr-3">
                       <p class="red-text font-weight-bold" x-show="(orderTotalAmount-customer.previousPaid) < 0">Order amount less than previous paid</p>
                       
                       <h5 class="font-weight-bold">Total: ৳<span x-text="orderTotalAmount"></span></h5> 
                       <h5 x-show="customer.Discount > 0">Discount: ৳<span x-text="customer.Discount"></span></h5>
                       <h5 x-show="customer.PaidAmount > 0">Prev.Paid: ৳<span x-text="customer.PaidAmount"></span></h5>
                       <h5 x-show="orderTotalAmount - customer.previousPaid > 0" class="red-text">Due Amount: ৳<span x-text="orderTotalAmount - (customer.PaidAmount+customer.Discount)"></span></h5>
                    </div>
                   </template>
                   <div class="text-right pr-3">
                       <button :disabled="isSubmit" type="submit" class="btn btn-cyan m-0 mt-3">
                           <span x-show="isSubmit">Updating...</span>
                           <span x-show="!isSubmit">Update Order</span>
                       </button>
                   </div>
                </div>
               </div>
           </template>
         </form>
      

        <!--measurement modal-->
        <div class="modal fade" id="addMeasurement" tabindex="-1" role="dialog">
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
                    <template x-for="group in selectedIndex !== null && order[selectedIndex].measurements" :key="group.MeasurementGroupId">
                        <div class="col-sm-4 col-lg-3 mb-4">
                        <div class="card px-3 pt-3 h-100">
                            <template x-for="measure in group.Measurements" :key="measure.MeasurementTypeID">
                            <div class="mb-2">
                                <div class="md-form md-outline my-0">
                                    <label :class="measure.Measurement && 'active'" :for="measure.MeasurementTypeID" x-text="measure.MeasurementType"></label>
                                    <input x-model="measure.Measurement" :id="measure.MeasurementTypeID" type="text" class="form-control" autocomplete="off">
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
        
    
        <!--payment modal-->
        <div class="modal fade" id="addPaymentModal" tabindex="-1" role="dialog">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                  <div class="modal-header text-center teal lighten-1 white-text">
                      <template x-if="savedDressPayment.length">
                          <select @change="(e) => onChangeSavedPayment(e, selectedIndex)" class="form-control w-auto mr-3">
                              <option value="">[ Select Saved Payment ]</option>
                              <template x-for="(item,i) in savedDressPayment" :key="i">
                                  <option :value="item.Price" x-text="item.PriceFor"></option>
                              </template>
                          </select>
                      </template>
                      <h4 class="modal-title">
                           <strong x-text="selectedIndex !== null && order[selectedIndex].dress.dressName"></strong>
                      </h4>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                    
                  <div class="modal-body mx-3">
                        <form @submit.prevent="() => addPayment(selectedIndex)">
                            <div class="form-group">
                                <label>Payment For</label>
                                <input type="text" x-model="dressPayment.For" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label>Amount</label>
                                <input  x-model.number="dressPayment.UnitPrice" type="number" min="0" step="0.01" class="form-control" autocomplete="off" required>
                            </div>
                            <div class="form-group">
                              <button type="submit" class="btn btn-teal w-100 m-0">Add Payment</button>
                          </div>
                        </form>
                        
                        <form @submit.prevent="() => addFabric(selectedIndex)">
                          <h5 class="font-weight-bold mt-4">Fabrics</h5>
                           <div class="mb-3">
                            <div class="form-group">
                                <label>Fabric Code</label>
                                <input @keyup="findFabrics" id="findFabrics" x-model="fabricsPayment.For" type="text" class="form-control" autocomplete="off" required>
                            </div>
                            <div class="form-group">
                                <label>Quantity <span x-show="fabricsPayment.StockFabricQuantity > 0" class="text-success">Stock: <span x-text="fabricsPayment.StockFabricQuantity"></span></span></label>
                                <input x-model.number="fabricsPayment.Quantity" type="number" min="1" :max="fabricsPayment.StockFabricQuantity" step="0.01" class="form-control" autocomplete="off" required>
                            </div>
                            <div class="form-group">
                                <button type="submit" :disabled="fabricsPayment.FabricID === ''" class="btn btn-cyan w-100 m-0">Add Fabric</button>
                            </div>
                         </div>
                        </form>
                    </div>
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
