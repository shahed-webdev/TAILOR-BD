using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace TailorBD.AccessAdmin.quick_order.ViewModels
{
    public class FabricSellingModel
    {
        public int? CustomerID { get; set; }
        public int RegistrationID { get; set; }
        public int InstitutionID { get; set; }
        public int AccountID { get; set; }
        public double SellingDiscountAmount { get; set; }
        public double SellingPaidAmount { get; set; }
        public string FabricList { get; set; } //[{ FabricID, SellingQuantity, SellingUnitPrice }]

    }
}