
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
        apiData: {
            customerId: 0,
            dressId:0,
            clothForId: 0
        },

        // dress dropsown
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

        onChangeDressDropdown(evt) {
            this.apiData.dressId = +evt.target.value || 0;
            this.getMesurementsStyles();
        },

        // mesurements
        mesurementsStyles: {
            isLoading: false,
            data: []
        },
        async getMesurementsStyles() {
            this.mesurementsStyles.isLoading = true;
            const { customerId, dressId } = this.apiData;

            const response = await fetch(`${helpers.baseUrl}/GetDressMeasurementsStyles?dressId=${dressId}&customerId=${customerId}`, helpers.header);
            const result = await response.json();

            this.mesurementsStyles.isLoading = false;
            this.mesurementsStyles.data = result.d;
        },

        //customer
        customer: {
            isLoading: false,
            mesurementFound:false,
            data: {}
        },

        findCustomer(evt) {
            $(`#${evt.target.id}`).typeahead({
                minLength: 1,
                displayText: item => {
                    return `${item.CustomerName}, ${item.Phone}`;
                },
                afterSelect: function(item) {
                    this.$element[0].value = item.CustomerName;
                },
                source: (request, result) => {
                    $.ajax({
                        url: `Order.aspx/FindCustomer?prefix=${JSON.stringify(request)}`,
                        contentType: "application/json; charset=utf-8",
                        success: response => result(response.d),
                        error: err => console.log(err)
                    });
                },
                updater: item => {
                    this.customer.data = item;

                    //set customer id and call for dress data
                    this.apiData.customerId = +item.CustomerID;
                    this.getMesurementsStyles();

                    return item;
                }
            })
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