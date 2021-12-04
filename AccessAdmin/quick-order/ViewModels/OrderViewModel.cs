using System;
using System.Collections.Generic;

namespace TailorBD.AccessAdmin.quick_order.ViewModels
{
    public class OrderViewModel
    {
        public OrderViewModel()
        {
            OrderList = new List<OrderListViewModel>();
        }
        public int OrderId { get; set; }
        public string OrderSn { get; set; }
        public int ClothForId { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; }
        public string Phone { get; set; }
        public DateTime? DeliveryDate { get; set; }
        public double PaidAmount { get; set; }
        public double Discount { get; set; }
        public double OrderAmount { get; set; }
        public List<OrderListViewModel> OrderList { get; set; }
    }

    public class OrderListViewModel
    {
        public OrderListViewModel()
        {
            Measurements = new List<MeasurementsGroupModel>();
            Styles = new List<StyleGroupModel>();
            Payments = new List<OrderPaymentViewModel>();
        }

        public int OrderListId { get; set; }
        public int DressId { get; set; }
        public List<MeasurementsGroupModel> Measurements { get; set; }
        public List<StyleGroupModel> Styles { get; set; }
        public List<OrderPaymentViewModel> Payments { get; set; }
        public double DressQuantity { get; set; }
        public string Details { get; set; }
    }

    public class OrderPaymentViewModel
    {
        public int OrderPaymentId { get; set; }
        public int? FabricId { get; set; }
        public string For { get; set; }
        public double Quantity { get; set; }
        public double UnitPrice { get; set; }
        public double Amount { get; set; }
    }
}