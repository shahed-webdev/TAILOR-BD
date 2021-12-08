
//set local store
function getStore() {
    const store = localStorage.getItem("fabric-data");
    return store ? JSON.parse(store) : {};
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
    const {
        order = [],
        customer = { customerId: 0, isLoading: false, isNewCustomer: true, data: {} }
    } = getStore();

    return {
        //save to local store
        saveData() {
            const data = {
                orderNumber: this.orderNumber,
                order: this.order,
                customer: this.customer
            };
            localStorage.setItem("fabric-data", JSON.stringify(data));
        },

        isPageLoading: false,
        selectedIndex: null,
        order: order, //[{OrderDetails: '', dress: {}, measurements:[], styles:[], payments:[] }],



        //customer
        customer: customer,

        //find customer de bounce 
        customerTimerId: null,
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
                    clearTimeout(this.customerTimerId);

                    this.customerTimerId = setTimeout(() => {
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
                        700)
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
            const model = { Phone, CustomerName, Address, Cloth_For_ID }

            try {
                const response = await fetch(`${helpers.baseUrl}/AddNewCustomer`,
                    {
                        method: "POST",
                        headers: helpers.header.headers,
                        body: JSON.stringify({ model })
                    });

                const result = await response.json();

                $.notify(result.d.Message,
                    { position: "to center", className: result.d.IsSuccess ? "success" : "error" });

                if (result.d.IsSuccess) {
                    this.customer.data = result.d.Data;
                    this.apiData.customerId = result.d.Data.CustomerID;

                    //save to local store
                    this.saveData();
                }
            } catch (e) {
                console.log("customer added error");
                $.notify(e.message, { position: "to center", className: 'error' });
            }
        },

   

        //find fabrics
        fabricsPayment: {
            FabricId: '',
            FabricsName: '',
            FabricCode: '',
            Quantity: '',
            UnitPrice: '',
            StockFabricQuantity: 0
        },

        //de bounce 
        fabricTimerId: null,
        findFabrics(evt) {
            this.fabricsPayment.FabricId = "";

            $(`#${evt.target.id}`).typeahead({
                minLength: 1,
                hint: true,
                displayText: item => {
                    return `${item.FabricCode}, ${item.FabricsName}`;
                },
                afterSelect: function(item) {
                    this.$element[0].value = item.FabricCode;
                },
                source: (request, result) => {
                    clearTimeout(this.fabricTimerId);

                    this.fabricTimerId = setTimeout(() => {
                            $.ajax({
                                url: `Order.aspx/FindFabrics?prefix=${JSON.stringify(request)}`,
                                contentType: "application/json; charset=utf-8",
                                success: response => result(response.d),
                                error: err => console.log(err)
                            });
                        },
                        700)
                },
                updater: item => {
                    this.fabricsPayment = {
                        FabricId: item.FabricId,
                        FabricsName: item.FabricsName,
                        FabricCode: item.FabricCode,
                        UnitPrice: item.SellingUnitPrice,
                        StockFabricQuantity: item.StockFabricQuantity
                    }

                    this.addFabric();

                    return item;
                }
            });
        },

        //add fabrics
        addFabric() {
            const { FabricId, UnitPrice, FabricCode, FabricsName, StockFabricQuantity } = this.fabricsPayment;

            if (!FabricId) return $.notify(`Add fabric`, { position: "to center" });

            if (StockFabricQuantity < 1) return $.notify(`Fabric not in stock`, { position: "to center" });

            //check payment added or not
            const isAdded = this.order.some(item => item.FabricCode === FabricCode);

            if (isAdded) return $.notify(`${FabricCode} already added`, { position: "to center" });

            this.order.push({ FabricId, FabricCode, FabricsName, UnitPrice, Quantity: 1, StockFabricQuantity });

            //save to local store
            this.saveData();
            console.log(this.order)
            $.notify(`${FabricCode} added successfully`, { position: "to center", className: "success" });

            //reset form
            this.fabricsPayment = { FabricCode: '', FabricsName:'', Quantity: 0, UnitPrice: 0, FabricId: '', StockFabricQuantity: 0 };
        },


        //get account
        paymentMethod: [],
        async getAccount() {
            const response = await fetch(`${helpers.baseUrl}/AccountDlls`, helpers.header);
            const result = await response.json();
            this.paymentMethod = result.d;
        },



        //*** SUBMIT ORDER **//
        orderPayment: { OrderAmount: 0, Discount: 0, PaidAmount: 0, AccountId: 0, DeliveryDate: '' },

        //calculate order total amount
        orderTotalAmount: 0,
        calculateTotal() {
            const isPayment = this.order.filter(item => item.payments && item.payments).map(item => item.payments).flat(1);
            if (!isPayment.length) return 0;

            const total = isPayment.map(item => item.Quantity * item.Unit_Price).reduce((prev, current) => prev + current)
            this.orderTotalAmount = total;

            return total || 0;
        },

        //submit
        isSubmit: false,
        async submitOrder(evt) {
            if (!this.apiData.customerId) {
                $("#addCustomerModal").modal("show");
                return $.notify(`Customer Not Added`, { position: "to center" });
            }

            if (!this.order.length)
                return $.notify(`No Dress Added`, { position: "to center" });

            //create new model
            const OrderList = this.order.map(item => {
                return {
                    DressId: item.dress.dressId,
                    DressQuantity: item.quantity,
                    Details: item.orderDetails,
                    ListMeasurement: item.measurements.map(g => g.Measurements),
                    ListStyle: item.styles.map(s => s.Styles),
                    ListPayment: item.payments ? JSON.stringify(item.payments) : "[]"
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
            const { Discount, PaidAmount, AccountId } = this.orderPayment;
            const defaultAccount = this.paymentMethod.filter(item => item.IsDefault)[0];

            const model = {
                OrderSn: this.orderNumber || '',
                ClothForId: Cloth_For_ID,
                CustomerId: CustomerID,
                OrderAmount: this.calculateTotal(),
                Discount,
                PaidAmount,
                AccountId: AccountId || defaultAccount ? defaultAccount.AccountId : 0,
                DeliveryDate: evt.target.DeliveryDate.value,
                OrderList // [ DressId, DressQuantity, Details, ListMeasurement[], ListStyle[], ListPayment[] ]
            }

            try {
                this.isSubmit = true;
                const response = await fetch(`${helpers.baseUrl}/PostOrder`, {
                    method: "POST",
                    headers: helpers.header.headers,
                    body: JSON.stringify({ model })
                });

                const result = await response.json();
                localStorage.removeItem("order-data")

                location.href = `../Order/OrderDetailsForCustomer.aspx?OrderID=${result.d}`;
            } catch (e) {
                $.notify(e.message, { position: "to center" });
                this.isSubmit = false;
            }
        }
    }
}

