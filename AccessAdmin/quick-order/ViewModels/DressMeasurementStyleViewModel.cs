using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace TailorBD.AccessAdmin.quick_order.ViewModels
{
    public class DressMeasurementStyleViewModel
    {
        public DressMeasurementStyleViewModel()
        {
            MeasurementGroups = new List<MeasurementsGroupModel>();
            StyleGroups = new List<StyleGroupModel>();
        }
        public string OrderDetails { get; set; }
        public List<MeasurementsGroupModel> MeasurementGroups { get; set; }
        public List <StyleGroupModel> StyleGroups { get; set; }
    }

    public class MeasurementsGroupModel
    {
        public int MeasurementGroupId { get; set; }
        public List<MeasurementsModel> Measurements { get; set; }
    }
    public class MeasurementsModel
    {
        public int MeasurementTypeID { get; set; }
        public string MeasurementType { get; set; }
        public string Measurement { get; set; }
    }

    public class StyleGroupModel
    {
        public int DressStyleCategoryId { get; set; }
        public string DressStyleCategoryName { get; set; }
        public List<StyleModel> Styles { get; set; }
    }
    public class StyleModel
    {
        public int DressStyleId { get; set; }
        public string DressStyleName { get; set; }
        public string DressStyleMesurement { get; set; }
        public bool IsCheck { get; set; }
    }
}