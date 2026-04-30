namespace TailorBD.API.Models
{
    public class Dress
    {
        public int DressID { get; set; }
        public int InstitutionID { get; set; }
        public int RegistrationID { get; set; }
        public string DressName { get; set; } = string.Empty;
        public double? Price { get; set; }
        public byte[]? DressImage { get; set; }
    }

    public class DressDto
    {
        public int DressID { get; set; }
        public string DressName { get; set; } = string.Empty;
        public int? ClothForID { get; set; }
        public int? DressSerial { get; set; }
        public double? Price { get; set; }
        public bool IsMeasurementAvailable { get; set; }
    }
}
