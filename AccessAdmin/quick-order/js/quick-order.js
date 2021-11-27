
//get form data as object
const serializeForm = function (form) {
    const obj = {};
    const formData = new FormData(form);
    for (let key of formData.keys()) {
        obj[key] = formData.get(key);
    }
    return obj;
};


const order = (function () {
    //find customer
    $(document).on("paste, input", ".find-customer", function () {
        $(this).typeahead({
            minLength: 2,
            displayText: function (item) {
                return `${item.CustomerName}, ${item.Phone}`;
            },
            afterSelect: function (item) {
                this.$element[0].value = item.CustomerName
            },
            source: function (request, result) {
                $.ajax({
                    url: `Order.aspx/FindCustomer?prefix=${JSON.stringify(request)}`,
                    contentType: "application/json; charset=utf-8",
                    success: response => result(response.d),
                    error: err => console.log(err)
                });
            },
            updater: function (item) {
                return item;
            }
        })
    })

    //add customer
    const addCustomerForm = document.getElementById("addCustomerForm");
    addCustomerForm.addEventListener("submit", function (evt) {
        evt.preventDefault();

        const model = serializeForm(this);
        console.log(model)
    })

    //dress name dropdown
    const dressDropdown = document.getElementById("dress-dropdown");

    //get dress from api
    function getDress(customerId=0, clothForId=0) {
        $.ajax({
            type:'GET',
            url: `Order.aspx/DressDlls?customerId=${customerId}&clothForId=${clothForId}`,
            contentType: "application/json; charset=utf-8",
            success: response=> {
                const list = response.d || [];
                const fragment = document.createDocumentFragment();

                if (list.length) {
                    list.forEach(item => fragment.appendChild(createOption(item.DressId, item.DressName)))

                    dressDropdown.appendChild(fragment)
                }
            },
            error: err => console.log(err)
        });
    }

    //create options
    function createOption(value, label) {
        const option = document.createElement("option");
        option.value = value;
        option.text = label;

        return option;
    }

    getDress();

    //on change dress dropdown
    dressDropdown.addEventListener("change", function (evt) {
        console.log(evt.target.value)
    })
})(document);