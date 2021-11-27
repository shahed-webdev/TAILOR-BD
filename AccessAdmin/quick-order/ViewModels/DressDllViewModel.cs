using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace TailorBD.AccessAdmin.quick_order.ViewModels
{
    public class DressDllViewModel
    {
        public int DressId { get; set; }
        public string DressName { get; set;}    
        public bool IsMeasurementAvailable { get; set;}
    }
}