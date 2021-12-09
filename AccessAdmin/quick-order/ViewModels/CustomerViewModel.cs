using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace TailorBD.AccessAdmin.quick_order.ViewModels
{
    public class CustomerViewModel
    {
        public string CustomerID { get; set; }
        public string Cloth_For_ID { get; set; }
        public string CustomerName { get; set;}    
        public string Phone { get; set;}
        public string Address { get; set; }
        public string Description { get; set; }
    }
}