namespace TailorBD.API.Models
{
    public class Customer
    {
        public int CustomerID { get; set; }
        public int RegistrationID { get; set; }
        public int InstitutionID { get; set; }
        public int? Cloth_For_ID { get; set; }
        public string CustomerNumber { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public byte[]? Image { get; set; }
        public DateTime Date { get; set; }
    }

    public class CustomerDto
    {
        public int CustomerID { get; set; }
        public string CustomerNumber { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public DateTime Date { get; set; }
        public int? Cloth_For_ID { get; set; }
        public int TotalOrders { get; set; }
        public DateTime? Last_Order_Date { get; set; }
    }
}
