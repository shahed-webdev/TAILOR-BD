const order = (function () {
    //find customer
    $("#find-customer").typeahead({
        minLength: 1,
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