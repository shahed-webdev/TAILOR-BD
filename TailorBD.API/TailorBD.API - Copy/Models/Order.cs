namespace TailorBD.API.Models
{
    public class Order
    {
        public Guid OrderID { get; set; }
        public int InstitutionID { get; set; }
        public int RegistrationID { get; set; }
        public int CustomerID { get; set; }
        public DateTime OrderDate { get; set; }
        public DateTime DeliveryDate { get; set; }
        public double TotalAmount { get; set; }
        public double PaidAmount { get; set; }
        public double DueAmount { get; set; }
        public string? OrderDetails { get; set; }
        public string? DeliveryStatus { get; set; }
    }

    public class OrderDto
    {
        public Guid OrderID { get; set; }
        public int CustomerID { get; set; }
        public string? CustomerName { get; set; }
        public string? CustomerPhone { get; set; }
        public DateTime OrderDate { get; set; }
        public DateTime DeliveryDate { get; set; }
        public double TotalAmount { get; set; }
        public double PaidAmount { get; set; }
        public double DueAmount { get; set; }
        public string? DeliveryStatus { get; set; }
    }

    public class OrderCreateDto
    {
        public int CustomerID { get; set; }
        public DateTime DeliveryDate { get; set; }
        public double TotalAmount { get; set; }
        public double PaidAmount { get; set; }
        public string? OrderDetails { get; set; }
    }
}
