
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

        apiData: {
            customerId: 0,
            clothForId: 0
        },

        //order list data
        selectedIndex: null,
        order: [], //[{OrderDetails:'', dress: {}, measurements:[], styles:[], payments:[] }],

        //get dress dropdown
        dressNames: { isLoading: true,data: [] },

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

        //payments
        dressPayment : { paymentFor: '', amount: '' },

        //modal
        onOpenPaymentModal(index) {
            this.selectedIndex = index;
            $("#addPaymentModal").modal("show");
        },

        //add payment to cart
        addPayment(index) {
            const { paymentFor, amount } = this.dressPayment;
            const orderPayment = this.order[index];
            orderPayment.payments = orderPayment.payments || [];

            //check payment added or not
            const isAdded = orderPayment.payments.some(item => item.paymentFor.toLocaleLowerCase() === paymentFor.toLocaleLowerCase());

            if (isAdded) {
                $.notify(`${paymentFor} already added`, { position: "to center" }, "error");
                return;
            }

            orderPayment.payments.push({
                paymentFor,
                amount,
                paymentDressQuantity: orderPayment.quantity
            });

            //reset form
            this.dressPayment = { paymentFor: '', amount: '' };

            console.log(this.order)
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
        }
    }
}
