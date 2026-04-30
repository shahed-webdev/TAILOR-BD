using System.Text.Json.Serialization;

namespace TailorBD.API.Models
{
    public class InstitutionDto
    {
        public int InstitutionID { get; set; }
        public string InstitutionName { get; set; } = string.Empty;
        [JsonPropertyName("dialog_Title")]
        public string? Dialog_Title { get; set; }
        public int? PackageID { get; set; }
        public string? Established { get; set; }
        public string? Staff { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? LocalArea { get; set; }
        public string? PostalCode { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Website { get; set; }
        public string? UserName { get; set; }
        public string? Validation { get; set; }
        [JsonPropertyName("signing_Money")]
        public double? Signing_Money { get; set; }
        [JsonPropertyName("renew_Amount")]
        public double? Renew_Amount { get; set; }
        [JsonPropertyName("expire_Date")]
        public DateTime? Expire_Date { get; set; }
        public byte[]? InstitutionLogo { get; set; }
        public DateTime? Date { get; set; }
        public int? TotalOrder { get; set; }
        public int? TotalCustomer { get; set; }
    }

    public class UpdateInstitutionRequest
    {
        public string InstitutionName { get; set; } = string.Empty;
        [JsonPropertyName("dialog_Title")]
        public string? Dialog_Title { get; set; }
        public string? Established { get; set; }
        public string? Staff { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? LocalArea { get; set; }
        public string? PostalCode { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Website { get; set; }
    }
}
