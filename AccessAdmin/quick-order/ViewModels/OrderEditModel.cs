using System.Collections.Generic;

namespace TailorBD.AccessAdmin.quick_order.ViewModels
{
    public class OrderEditModel
    {
        public OrderEditModel()
        {
            OrderList = new List<OrderListEditModel>();
        }
        public int OrderId { get; set; }
        public int ClothForId { get; set; }
        public int CustomerId { get; set; }
        public List<OrderListEditModel> OrderList { get; set; }
        public string DeletedOrderPaymentIds { get; set; } //[{ OrderPaymentID: 1 }]
        public string DeletedOrderListIds { get; set; } //[{ OrderListID: 1 }]
    }

    public class OrderListEditModel
    {
        public int DressId { get; set; }
        public int? OrderListId { get; set; }
        public string ListMeasurement { get; set; }
        public string ListStyle { get; set; }
        public string ListPayment { get; set; }
        public int DressQuantity { get; set; }
        public string Details { get; set; }
    }
}