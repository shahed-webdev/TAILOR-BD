namespace TailorBD.API.Models
{
    public class UpdateOrderModel
    {
        public int OrderId { get; set; }
        public int InstitutionId { get; set; }
        public int RegistrationId { get; set; }
        public int CustomerId { get; set; }
        public int ClothForId { get; set; }
        public List<OrderListItemModel> OrderList { get; set; } = new();
        public List<int> DeletedOrderPaymentIds { get; set; } = new();
        public List<int> DeletedOrderListIds { get; set; } = new();
    }

    public class OrderListItemModel
    {
        public int DressId { get; set; }
        public int? OrderListId { get; set; }
        public int DressQuantity { get; set; }
        public string? Details { get; set; }
        public string? ListMeasurement { get; set; }
        public string? ListStyle { get; set; }
        public string? ListPayment { get; set; }
    }

    public class AddDressToOrderModel
    {
        public int? OrderID { get; set; }
        public int InstitutionID { get; set; }
        public int RegistrationID { get; set; }
        public int CustomerID { get; set; }
        public int Cloth_For_ID { get; set; }
        public int DressID { get; set; }
        public int DressQuantity { get; set; }
        public string? Details { get; set; }
        public string? List_Measurement { get; set; }
        public string? List_Style { get; set; }
        public string? List_Payment { get; set; }
    }

    public class MeasurementItem
    {
        public int id { get; set; }
        public string? value { get; set; }
    }

    public class StyleItem
    {
        public int id { get; set; }
        public string? value { get; set; }
    }

    public class PaymentItem
    {
        public string? For { get; set; }
        public double Quantity { get; set; }
        public double Unit_Price { get; set; }
        public int? FabricID { get; set; }
    }

    public class OrderListItemDto
    {
        public int orderListID { get; set; }
        public int dressID { get; set; }
        public string? dress_Name { get; set; }
        public int dressQuantity { get; set; }
        public string? details { get; set; }
        public int orderList_SN { get; set; }
    }

    public class QuickOrderModel
    {
        public string? OrderSn { get; set; }
        public int ClothForId { get; set; }
        public int CustomerId { get; set; }
        public int InstitutionId { get; set; }
        public int RegistrationId { get; set; }
        public double OrderAmount { get; set; }
        public double Discount { get; set; }
        public double PaidAmount { get; set; }
        public int AccountId { get; set; }
        public string? DeliveryDate { get; set; }
        public List<QuickOrderListItem> OrderList { get; set; } = new();
    }

    public class QuickOrderListItem
    {
        public int DressId { get; set; }
        public int DressQuantity { get; set; }
        public string? Details { get; set; }
        public string? ListMeasurement { get; set; }
        public string? ListStyle { get; set; }
        public string? ListPayment { get; set; }
    }

    public class FinishOrderModel
    {
        public int OrderId { get; set; }
        public int InstitutionId { get; set; }
        public int RegistrationId { get; set; }
        public string? DeliveryDate { get; set; }
        public double Discount { get; set; }
        public double PaidAmount { get; set; }
        public int? AccountId { get; set; }
    }
}
