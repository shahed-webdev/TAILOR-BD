﻿

//set local store
function getStore() {
    const store = localStorage.getItem("order-data");
    return store ? JSON.parse(store) : null;
}


//api helpers methods
const helpers = {
    baseUrl: 'Order.aspx',
    header: {
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json'
        }
    }
}


//get dress from api
function initData() {
    const { apiData, orderNumber, order, customer } = getStore();
  
    return {
        //save to local store
        saveData() {
            const data = {
                apiData: this.apiData,
                orderNumber: this.orderNumber,
                order: this.order,
                customer: this.customer
            };
            localStorage.setItem("order-data", JSON.stringify(data));
        },

        isPageLoading: false,
        apiData: apiData.customerId ? apiData: { customerId: 0, clothForId: 0 },

        //order list data
        orderNumber: orderNumber || null,
        selectedIndex: null,
        order: order || [], //[{OrderDetails: '', dress: {}, measurements:[], styles:[], payments:[] }],

        //get order number
        async getOrderNumber() {
            const response = await fetch(`${helpers.baseUrl}/GetOrderNumber`, helpers.header);
            const result = await response.json();

            this.dressNames.isLoading = false;
            this.orderNumber = result.d;

            //save to local store
            this.saveData();
        },

        //get dress dropdown
        dressNames: { isLoading: true, data: [] },

        async getDress() {
            const { customerId, clothForId } = this.apiData;
            const response = await fetch(`${helpers.baseUrl}/DressDlls?customerId=${customerId}&clothForId=${clothForId}`, helpers.header);
            const result = await response.json();

            this.dressNames.isLoading = false;
            this.dressNames.data = result.d;
        },

        //add to cart dress
        async addToListDress(dressId) {
            //check dress was already added
            if (this.order.length) {
                const isAdded = this.order.some(item => item.dress.dressId === dressId);

                if (isAdded) {
                    $.notify("dress already added", { position: "to center" }, "error");
                    return;
                }
            }

            //get dress info from dress list
            const dress = this.dressNames.data.filter(item => item.DressId === dressId)[0];

            const response = await this.getMeasurementsStyles(dress.DressId);
            console.log(response)

            this.order.push({
                dress: {
                    dressId: dress.DressId,
                    dressName: dress.DressName
                },
                orderDetails: response.OrderDetails,
                quantity: 1,
                measurements: response.MeasurementGroups,
                styles: response.StyleGroups
            })

            //save to local store
            this.saveData();
        },

        //remove Dress from cart
        removeDress(dressId) {
            const confirmDelete = confirm("Are you confirm to remove dress from list?");
            if (confirmDelete) {
                this.order = this.order.filter(item => item.dress.dressId !== dressId);
                this.selectedIndex = null;

                //save to local store
                this.saveData();
            }
        },

        //measurement and style modal
        onOpenMeasurementStyleModal(isMeasurement, index) {
            const measure = isMeasurement ? 'show' : 'hide';
            const style = !isMeasurement ? 'show' : 'hide';

            this.selectedIndex = index;

            $("#addMeasurement").modal(measure);
            $("#addStyle").modal(style);
        },

        //get measurement and styles
        async getMeasurementsStyles(dressId) {
            const { customerId } = this.apiData;
            this.isPageLoading = true;

            try {
                const response = await fetch(`${helpers.baseUrl}/GetDressMeasurementsStyles?dressId=${dressId}&customerId=${customerId}`, helpers.header);
                const result = await response.json();
                this.isPageLoading = false;

                return result.d;

            } catch (error) {
                console.log(error)
                return null;
            }
        },

        //payments modal
        savedDressPayment: [],

        async onOpenPaymentModal(dressId, index) {
            try {
                this.isPageLoading = true;

                const response = await fetch(`${helpers.baseUrl}/DressPriceDlls?dressId=${dressId}`, helpers.header);
                const result = await response.json();
                this.isPageLoading = false;

                this.savedDressPayment = result.d;
                this.selectedIndex = index;
                $("#addPaymentModal").modal("show");

            } catch (error) {
                console.log(error)
                this.isPageLoading = false;
                return null;
            }

            
        },

        //on change saved payment
        onChangeSavedPayment(evt, index) {
            const selectElement = evt.target;

            const value = selectElement.value;
            const text = selectElement.options[selectElement.selectedIndex].text
            if (!value) return;

            this.dressPayment.For = text;
            this.dressPayment.Unit_Price = +value;
            this.addPayment(index);
        },

        //add dress payment
        dressPayment: { For: '', Unit_Price: '' },

        //add payment
        addPayment(index) {
            const { For, Unit_Price } = this.dressPayment;
            const orderPayment = this.order[index];
            orderPayment.payments = orderPayment.payments || [];

            //check payment added or not
            const isAdded = orderPayment.payments.some(item => item.For.toLocaleLowerCase() === For.toLocaleLowerCase());

            if (isAdded) {
                $.notify(`${For} already added`, { position: "to center" });
                return;
            }

            orderPayment.payments.push({ For, Unit_Price, Quantity: orderPayment.quantity});

            //save to local store
            this.saveData();

            //reset form
            this.dressPayment = { For: '', Unit_Price: '' };

            $.notify(`${For} added successfully`, { position: "to center", className: "success" });
        },


        //remove payment
        removePayment(paymentFor, index) {
            const orderPayment = this.order[index]
            orderPayment.payments = orderPayment.payments.filter(item => item.For !== paymentFor);
        },


        //customer
        customer: apiData.customerId ? customer : { isLoading: false, isNewCustomer: true, data: {}},

        //find customer
        findCustomer(evt) {
            //reset if change text
            this.apiData.customerId = 0;
            this.apiData.clothForId = 0;
            this.customer.isNewCustomer = true;


            $(`#${evt.target.id}`).typeahead({
                minLength: 1,
                displayText: item => {
                    return `${item.CustomerName}, ${item.Phone}`;
                },
                afterSelect: function (item) {
                    this.$element[0].value = item.CustomerName;
                },
                source: (request, result) => {
                    this.customer.isLoading = true;

                    $.ajax({
                        url: `Order.aspx/FindCustomer?prefix=${JSON.stringify(request)}`,
                        contentType: "application/json; charset=utf-8",
                        success: response => {
                            result(response.d);
                            this.customer.isLoading = false;
                        },
                        error: err => {
                            console.log(err);
                            this.customer.isLoading = false;
                        }
                    });
                },
                updater: item => {
                    //set customer info
                    this.customer.data = item;
                    this.apiData.customerId = +item.CustomerID;
                    this.apiData.clothForId = item.Cloth_For_ID;
                    this.customer.isNewCustomer = false;

                    this.getDress();
                    //save to local store
                    this.saveData();

                    return item;
                }
            })
        },
        
        //add new
        async addNewCustomer() {
            const { Phone, CustomerName, Address, Cloth_For_ID = 1 } = this.customer.data;
            const model = { Phone,CustomerName, Address, Cloth_For_ID }

            try {
                const response = await fetch(`${helpers.baseUrl}/AddNewCustomer`,
                    {
                        method: "POST",
                        headers: helpers.header.headers,
                        body: JSON.stringify({ model })
                    });

                const result = await response.json();
               
                $.notify(result.d.Message, { position: "to center", className: result.d.IsSuccess ? "success": "error" });

                if (result.d.IsSuccess) {
                    this.customer.data = result.d.Data;
                    this.apiData.customerId = result.d.Data.CustomerID;

                    //save to local store
                    this.saveData();
                }
            } catch (e) {
                console.log("customer added error");
                $.notify(e.message, { position: "to center", className:'error'});
            }
        },

        //set measurement
        setMeasurements() {
            this.getDress();

            if (!this.order.length) {
                $("#addCustomerModal").modal("hide");
                return;
            }

            this.order.forEach(async item => {
                const response = await this.getMeasurementsStyles(item.dress.dressId);

                item.orderDetails = response.OrderDetails;
                item.measurements = response.MeasurementGroups;
                item.styles = response.StyleGroups;
            });

            //save to local store
            this.saveData();

            $("#addCustomerModal").modal("hide");
        },

        //find fabrics
        fabricsPayment: { For: '', Quantity: '', Unit_Price: '', FabricID: '', StockFabricQuantity: 0, FabricsName:'' },
        findFabrics(evt) {
            this.fabricsPayment.FabricID = "";

            $(`#${evt.target.id}`).typeahead({
                minLength: 1,
                displayText: item => {
                    return `${item.FabricCode}, ${item.FabricsName}`;
                },
                afterSelect: function (item) {
                    this.$element[0].value = item.FabricCode;
                },
                source: (request, result) => {
                    $.ajax({
                        url: `Order.aspx/FindFabrics?prefix=${JSON.stringify(request)}`,
                        contentType: "application/json; charset=utf-8",
                        success: response => {
                            result(response.d);
                        },
                        error: err => {
                            console.log(err);
                        }
                    });
                },
                updater: item => {
                    this.fabricsPayment.For = item.FabricCode;
                    this.fabricsPayment.FabricID = item.FabricId;
                    this.fabricsPayment.Unit_Price = item.SellingUnitPrice;
                    this.fabricsPayment.StockFabricQuantity = item.StockFabricQuantity;
                    return item;
                }
            })
        },

        //add fabrics
        addFabric(index) {
            const { For, Unit_Price, Quantity, FabricID } = this.fabricsPayment;

            if (!FabricID) return $.notify(`Add fabric`, { position: "to center" });

            const orderPayment = this.order[index];
            orderPayment.payments = orderPayment.payments || [];

            //check payment added or not
            const isAdded = orderPayment.payments.some(item => item.For.toLocaleLowerCase() === For.toLocaleLowerCase());

            if (isAdded) return $.notify(`${For} already added`, { position: "to center" });
            

            orderPayment.payments.push({ For, Unit_Price, Quantity, FabricID });

            //save to local store
            this.saveData();

            $.notify(`${For} added successfully`, { position: "to center", className: "success" });

            //reset form
            this.fabricsPayment = { For: '', Quantity: '', Unit_Price: '', FabricID: '', StockFabricQuantity: 0 };
        },

        //*** SUBMIT ORDER **//
        async submitOrder() {
            if (!this.apiData.customerId) return $.notify(`Customer Not Added`, { position: "to center" });

            //create new model
            const OrderList = this.order.map(item => {
                return {
                    DressId: item.dress.dressId,
                    DressQuantity: item.quantity,
                    Details: item.orderDetails,
                    ListMeasurement: item.measurements.map(g => g.Measurements),
                    ListStyle: item.styles.map(s => s.Styles),
                    ListPayment: JSON.stringify(item.payments)
                }
            });

            //set flat array
            OrderList.forEach(item => {
                const measureMapped = item.ListMeasurement.flatMap(m => m);
                const styleMapped = item.ListStyle.flatMap(m => m);

                //measure
                item.ListMeasurement = JSON.stringify(measureMapped.reduce((measure, obj) => {
                        if (obj.Measurement)
                            measure.push({ id: obj.MeasurementTypeID, value: obj.Measurement });

                        return measure;
                    },
                    []));

                //style
                item.ListStyle = JSON.stringify(styleMapped.reduce((style, obj) => {
                        if (obj.IsCheck)
                            style.push({ id: obj.DressStyleId, value: obj.DressStyleMesurement });

                        return style;
                    },
                    []));
            });

            //customer info
            const { CustomerID, Cloth_For_ID } = this.customer.data;

            const model = {
                OrderSn: this.orderNumber || '',
                ClothForId: Cloth_For_ID,
                CustomerId: CustomerID,
                AccountId: 1,
                PaidAmount: 0,
                Discount: 0,
                OrderAmount: 100,
                OrderList // [ DressId, DressQuantity, Details, ListMeasurement[], ListStyle[], ListPayment[] ]
            }

            console.log(model)

            try {
                const response = await fetch(`${helpers.baseUrl}/PostOrder`,{
                    method: "POST",
                    headers: helpers.header.headers,
                    body: JSON.stringify({ model })
                });

                const result = await response.json();

               // $.notify(result.d.Message, { position: "to center", className: result.d.IsSuccess ? "success" : "error" });
                console.log(result.d)
                
             
            } catch (e) {
                $.notify(e.message, { position: "to center" });
            }
        }
    }
}
