
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
    return {
        isPageLoading: false,
        apiData: {customerId: 0, clothForId: 0 },

        //order list data
        orderNumber: null,
        selectedIndex: null,
        order: [], //[{OrderDetails:'', dress: {}, measurements:[], styles:[], payments:[] }],

        //get order number
        async getOrderNumber() {
            const response = await fetch(`${helpers.baseUrl}/GetOrderNumber`, helpers.header);
            const result = await response.json();

            this.dressNames.isLoading = false;
            this.orderNumber = result.d;
            console.log(result.d)
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
        },

        //remove Dress from cart
        removeDress(dressId) {
            const confirmDelete = confirm("Are you confirm to remove dress from list?");
            if (confirmDelete) {
                this.order = this.order.filter(item => item.dress.dressId !== dressId);
                this.selectedIndex = null;
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
        async onOpenPaymentModal(dressId,index) {
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
        dressPayment: { For:'', Quantity:'', Unit_Price:'', FabricID:'' },

        //add payment
        addPayment(index) {
            const { For, Unit_Price, Quantity } = this.dressPayment;
            const orderPayment = this.order[index];
            orderPayment.payments = orderPayment.payments || [];

            //check payment added or not
            const isAdded = orderPayment.payments.some(item => item.For.toLocaleLowerCase() === For.toLocaleLowerCase());

            if (isAdded) {
                $.notify(`${For} already added`, { position: "to center" });
                return;
            }

            orderPayment.payments.push({ For, Unit_Price, Quantity: Quantity ? Quantity: orderPayment.quantity});

            //reset form
            this.dressPayment = { For: '', Quantity: '', Unit_Price: '', FabricID: '' };

            $.notify(`${For} added successfully`, { position: "to center", className: "success" });
        },


        //remove payment
        removePayment(paymentFor, index) {
            const orderPayment = this.order[index]
            orderPayment.payments = orderPayment.payments.filter(item => item.For !== paymentFor);
        },


        //customer
        customer: { isLoading: false,isNewCustomer: true,data: {}},

        //find
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
                console.log(response)
            })

            $("#addCustomerModal").modal("hide");
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
