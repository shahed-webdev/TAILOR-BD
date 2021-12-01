using System;
using System.Collections.Generic;

namespace TailorBD.AccessAdmin.quick_order.ViewModels
{
    public class OrderPostModel
    {
        public OrderPostModel()
        {
            OrderList = new List<OrderListModel>();
        }
        public string OrderSn { get; set; }
        public int ClothForId { get; set; }
        public int CustomerId { get; set; }

        public int AccountId { get; set; }
        public DateTime? DeliveryDate { get; set; }
        public double PaidAmount { get; set; }
        public double Discount { get; set; }

        public List<OrderListModel> OrderList { get; set; }
    }

    public class OrderListModel
    {
        public int DressId { get; set; }
        public string ListMeasurement { get; set; }
        public string ListStyle { get; set; }
        public string ListPayment { get; set; }
        public int DressQuantity { get; set; }
        public string Details { get; set; }
    }


}