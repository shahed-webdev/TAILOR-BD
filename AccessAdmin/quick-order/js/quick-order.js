
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
        order: [], //[{OrderDetails:'', dress: {}, measurements:[], styles:[] }],

        //get dress dropdown
        dressNames: {
            isLoading: true,
            data: []
        },

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
                    $.notify("dress already added", { position: "to center" }, "error",);
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

        //customer
        customer: {
            isLoading: false,
            isNewCustomer: true,
            data: {}
        },

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

            const model = {
                Phone,
                CustomerName,
                Address,
                Cloth_For_ID
            }

            const response = await fetch(`${helpers.baseUrl}/AddNewCustomer`, {
                method: "POST",
                headers: helpers.header.headers,
                body: JSON.stringify({ model }),
            });

            const result = await response.json();

            console.log(result)
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















//get form data as object
//const serializeForm = function (form) {
//    const obj = {};
//    const formData = new FormData(form);
//    for (let key of formData.keys()) {
//        obj[key] = formData.get(key);
//    }
//    return obj;
//};


//const order = (function () {
    //find customer
    //$(document).on("paste, input", ".find-customer", function () {
    //    $(this).typeahead({
    //        minLength: 2,
    //        displayText: function (item) {
    //            return `${item.CustomerName}, ${item.Phone}`;
    //        },
    //        afterSelect: function (item) {
    //            this.$element[0].value = item.CustomerName
    //        },
    //        source: function (request, result) {
    //            $.ajax({
    //                url: `Order.aspx/FindCustomer?prefix=${JSON.stringify(request)}`,
    //                contentType: "application/json; charset=utf-8",
    //                success: response => result(response.d),
    //                error: err => console.log(err)
    //            });
    //        },
    //        updater: function (item) {
    //            return item;
    //        }
    //    })
//    })

//    //add customer
//    const addCustomerForm = document.getElementById("addCustomerForm");
//    addCustomerForm.addEventListener("submit", function (evt) {
//        evt.preventDefault();

//        const model = serializeForm(this);
//        console.log(model)
//    })

//    //dress name dropdown
//    const dressDropdown = document.getElementById("dress-dropdown");

//    //get dress from api
//    function getDress(customerId=0, clothForId=0) {
//        $.ajax({
//            type:'GET',
//            url: `Order.aspx/DressDlls?customerId=${customerId}&clothForId=${clothForId}`,
//            contentType: "application/json; charset=utf-8",
//            success: response=> {
//                const list = response.d || [];
//                const fragment = document.createDocumentFragment();

//                if (list.length) {
//                    list.forEach(item => fragment.appendChild(createOption(item.DressId, item.DressName)))

//                    dressDropdown.appendChild(fragment)
//                }
//            },
//            error: err => console.log(err)
//        });
//    }

//    //create options
//    function createOption(value, label) {
//        const option = document.createElement("option");
//        option.value = value;
//        option.text = label;

//        return option;
//    }

//    getDress();

//    //on change dress dropdown
//    dressDropdown.addEventListener("change", function (evt) {
//        if (!evt.target.value) return;

//        const customerId = 5042;
//        const dressId = +evt.target.value;

//        $.ajax({
//            type: 'GET',
//            url: `Order.aspx/GetDressMeasurementsStyles?dressId=${dressId}&customerId=${customerId}`,
//            contentType: "application/json; charset=utf-8",
//            success: response => {
//                renderMesurement(response.d.MeasurementGroups);
//                renderStyleCategory(response.d.StyleGroups);
//            },
//            error: err => console.log(err)
//        });
//    })

//    //render mesurement
//    const mesurements = document.getElementById("mesurements");
//    function renderMesurement(mesurementsGroup = []) {
//        const fragment = document.createDocumentFragment();

//        mesurementsGroup.forEach(item => {
//            const div = document.createElement("div");
//            div.className = "col-sm-4 col-lg-3 mb-4";
//            div.innerHTML = `<div class="card px-3 pt-2 h-100">${renderNameAndInput(item.Measurements)}</div>`;

//            fragment.appendChild(div);
//        });

//        mesurements.innerHTML = "";
//        mesurements.append(fragment);
//    }

//    //render mesurement name and input
//    function renderNameAndInput(measurementsData=[]) {
//        let html = '';
//        measurementsData.forEach(item => {
//            const active = item.Measurement ? "active" : "";

//            html += `<div class="mb-2">    
//                <div class="md-form md-outline my-1">
//                   <label class="${active}" for="${item.MeasurementTypeID}">${item.MeasurementType}</label>
//                  <input id="${item.MeasurementTypeID}" type="text" class="form-control" value="${item.Measurement}" autocomplete="off">
//                </div>
//              </div>`
//        })

//        return html;
//    }


//    //render styles
//    const dressStyles = document.getElementById("dress-styles");
//    function renderStyleCategory(styleGroups = []) {
//        const fragment = document.createDocumentFragment();

//        styleGroups.forEach(item => {
//            const div = document.createElement("div");
//            div.className = "col-sm-6 col-lg-4 mb-4";
//            div.innerHTML = `
//              <div class="card">
//                <div class="card-header bg-white" role="tab">
//                    <a href="#tab${item.DressStyleCategoryId}" class="collapsed black-text" data-toggle="collapse" data-parent="#dress-styles" aria-expanded="false">
//                        <p class="mb-0">${item.DressStyleCategoryName}</p>
//                    </a>
//                </div>

//                <div id="tab${item.DressStyleCategoryId}" class="collapse" role="tabpanel" data-parent="#dress-styles">
//                    <div class="card-body">
//                        ${renderStyle(item.Styles)}
//                    </div>
//                </div>
//             </div>`;

//            fragment.appendChild(div);
//        });

//        dressStyles.innerHTML = "";
//        dressStyles.append(fragment);
//    }

//    //render mesurement name and input
//    function renderStyle(styles = []) {
//        let html = '';
//        styles.forEach(item => {
//            const checked = item.IsCheck ? "checked" : "";

//            html += `<div class="mb-3">    
//                <div class="custom-control custom-checkbox mb-1">
//                  <input type="checkbox" class="custom-control-input" id="${item.DressStyleId}" ${checked}>
//                  <label class="custom-control-label" for="${item.DressStyleId}">${item.DressStyleName}</label>
//                </div>
//                <input id="${item.DressStyleId}" type="text" class="form-control" value="${item.DressStyleMesurement}" autocomplete="off">
//              </div>`
//        })

//        return html;
//    }
//})(document);