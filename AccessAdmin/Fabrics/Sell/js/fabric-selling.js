
//set local store
function getStore() {
    const store = localStorage.getItem("fabric-data");
    return store ? JSON.parse(store) : {};
}


//api helpers methods
const helpers = {
    baseUrl: 'Fabrics_Selling.aspx',
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
        customer = { customerId: '', isLoading: false, isNewCustomer: true, data: {} }
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
        order,


        //customer
        customer,

        //find customer de bounce 
        customerTimerId: null,
        findCustomer(evt) {
            //reset if change text
            this.customer.customerId = 0;
            this.customer.isNewCustomer = true;

            //save to local store
            this.saveData();

            $(`#${evt.target.id}`).typeahead({
                minLength: 1,
                displayText: item => {
                    return `${item.CustomerName}, ${item.Phone}`;
                },
                afterSelect: function(item) {
                    this.$element[0].value = item.CustomerName;
                },
                source: (request, result) => {
                    this.customer.isLoading = true;
                    clearTimeout(this.customerTimerId);

                    this.customerTimerId = setTimeout(() => {
                            $.ajax({
                                url: `${helpers.baseUrl}/FindCustomer?prefix=${JSON.stringify(request)}`,
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
                    this.customer.customerId = +item.CustomerID;
                    this.customer.isNewCustomer = false;

                    //save to local store
                    this.saveData();
                    return item;
                }
            });
        },

        //add new
        async addNewCustomer() {
            const { Phone, CustomerName, Address, Description, Cloth_For_ID = 1 } = this.customer.data;
            const model = { Phone, CustomerName, Address, Description, Cloth_For_ID }

            try {
                const response = await fetch(`${helpers.baseUrl}/AddNewCustomer`,
                    {
                        method: "POST",
                        headers: helpers.header.headers,
                        body: JSON.stringify({ model })
                    });

                const result = await response.json();

                $.notify(result.d.Message, { position: "to center", className: result.d.IsSuccess ? "success" : "error" });

                if (result.d.IsSuccess) {
                    this.customer.data = result.d.Data;
                    this.customer.customerId = result.d.Data.CustomerID;
                    this.customer.isNewCustomer = false;
                    $("#addCustomerModal").modal("hide");

                    //save to local store
                    this.saveData();
                }
            } catch (e) {
                console.log("customer added error");
                $.notify(e.message, { position: "to center", className: 'error' });
            }
        },


        //find fabrics
        fabricsPayment: { StockFabricQuantity: 0 },

        //de bounce 
        //fabricTimerId: null,
        //findFabrics(evt) {
        //    $(`#${evt.target.id}`).typeahead({
        //        minLength: 1,
        //        displayText: item => {
        //            return `${item.FabricCode}, ${item.FabricsName}`;
        //        },
        //        afterSelect: function(item) {
        //            this.$element[0].value = item.FabricCode;
        //        },
        //        source: (request, result) => {
        //            clearTimeout(this.fabricTimerId);

        //            this.fabricTimerId = setTimeout(() => {
        //                    $.ajax({
        //                        url: `${helpers.baseUrl}/FindFabrics?prefix=${JSON.stringify(request)}`,
        //                        contentType: "application/json; charset=utf-8",
        //                        success: response => result(response.d),
        //                        error: err => console.log(err)
        //                    });
        //                },
        //                500)
        //        },
        //        updater: item => {
        //            const fabricsPayment = {
        //                FabricId: item.FabricId,
        //                FabricsName: item.FabricsName,
        //                FabricCode: item.FabricCode,
        //                UnitPrice: item.SellingUnitPrice,
        //                StockFabricQuantity: item.StockFabricQuantity
        //            }

        //            this.fabricsPayment.StockFabricQuantity = item.StockFabricQuantity
        //            this.addFabric(fabricsPayment);

        //            return item;
        //        }
        //    });
        //},

        //submit fabrics
        async submitFabric(evt) {
            const response = await fetch(`${helpers.baseUrl}/GetFabric?code=${JSON.stringify(evt.target.findFabrics.value)}`, helpers.header);
            const result = await response.json();

            if (!result.d.length) return $.notify(`Fabric not found`, { position: "to center" });

            const item = result.d[0];
            const fabricsPayment = {
                FabricId: item.FabricId,
                FabricsName: item.FabricsName,
                FabricCode: item.FabricCode,
                UnitPrice: item.SellingUnitPrice,
                StockFabricQuantity: item.StockFabricQuantity
            }

            this.addFabric(fabricsPayment);
            evt.target.findFabrics.value = "";
        },

        //add fabric to list
        addFabric(fabricsPayment) {
            const { FabricId, UnitPrice, FabricCode, FabricsName, StockFabricQuantity } = fabricsPayment;

            if (StockFabricQuantity < 1) return $.notify(`Fabric not in stock`, { position: "to center" });

            //check payment added or not
            const isAdded = this.order.some(item => item.FabricCode === FabricCode);

            if (isAdded) return $.notify(`${FabricCode} already added`, { position: "to center" });

            this.order.push({ FabricId, FabricCode, FabricsName, UnitPrice, Quantity: 1, StockFabricQuantity });

            //save to local store
            this.saveData();

            $.notify(`${FabricCode} added successfully`, { position: "to center", className: "success" });

            //reset form
            this.fabricsPayment = { StockFabricQuantity: 0 };

            return true;
        },


        //remove fabric
        removeFabric(id) {
            this.order = this.order.filter(item => item.FabricId !== id);

            //save to local store
            this.saveData();
        },

        //get account
        paymentMethod: [],
        async getAccount() {
            const response = await fetch(`${helpers.baseUrl}/AccountDlls`, helpers.header);
            const result = await response.json();
            this.paymentMethod = result.d;
        },



        //*** SUBMIT ORDER **//
        orderPayment: { PaidAmount: 0, Discount: 0, AccountId: 0 },

        //calculate order total amount
        orderTotalAmount: 0,
        calculateTotal() {
            if (!this.order.length) return 0;

            const total = this.order.map(item => item.Quantity * item.UnitPrice).reduce((prev, current) => prev + current)
            this.orderTotalAmount = total;

            return total || 0;
        },

        //submit
        isSubmit: false,
        async submitOrder(evt) {
            const { Discount, PaidAmount, AccountId } = this.orderPayment;
            const due = (this.orderTotalAmount - Discount) - PaidAmount;
            const { customerId } = this.customer;

            if (due) {
                if (!customerId) {
                    $("#addCustomerModal").modal("show");
                    return $.notify(`Add customer to selling due`, { position: "to center" });
                }
            }

            if (!this.order.length)
                return $.notify(`No Fabric Added`, { position: "to center" });

            const fabricList = this.order.map(item => {
                return {
                    FabricID: item.FabricId,
                    SellingQuantity: item.Quantity,
                    SellingUnitPrice: item.UnitPrice
                }
            });

            const defaultAccount = this.paymentMethod.filter(item => item.IsDefault)[0];

            const model = {
                CustomerID: customerId,
                SellingDiscountAmount: Discount,
                SellingPaidAmount: PaidAmount,
                AccountID: AccountId ? AccountId : defaultAccount ? defaultAccount.AccountId : 0,
                FabricList: JSON.stringify(fabricList)
            }

            try {
                this.isSubmit = true;
                const response = await fetch(`${helpers.baseUrl}/PostOrder`,
                    {
                        method: "POST",
                        headers: helpers.header.headers,
                        body: JSON.stringify({ model })
                    });

                const result = await response.json();
                if (!result.d.Data) return $.notify(`Fabric Not Added`, { position: "to center" });

                localStorage.removeItem("fabric-data")
                location.href = `Print_Invoice.aspx?FabricsSellingID=${result.d.Data}`;
            } catch (e) {
                $.notify(e.message, { position: "to center" });
                this.isSubmit = false;
            }
        }
    }
}

