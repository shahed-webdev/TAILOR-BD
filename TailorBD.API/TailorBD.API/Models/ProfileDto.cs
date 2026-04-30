namespace TailorBD.API.Models
{
    public class ProfileDto
    {
        public int RegistrationID { get; set; }
        public int InstitutionID { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Validation { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public DateTime CreateDate { get; set; }
        public string? Name { get; set; }
        public string? FatherName { get; set; }
        public string? Gender { get; set; }
        public string? Designation { get; set; }
        public DateTime? DateofBirth { get; set; }
        public string? NationalID { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? PostalCode { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public byte[]? Image { get; set; }
    }

    public class UpdateProfileRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? FatherName { get; set; }
        public string? Gender { get; set; }
        public string? Designation { get; set; }
        public DateTime? DateofBirth { get; set; }
        public string? NationalID { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? PostalCode { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public int InstitutionID { get; set; }
    }
}
