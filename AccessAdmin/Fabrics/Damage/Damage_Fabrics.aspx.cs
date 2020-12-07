using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Fabrics.Damage
{
    public partial class Damage_Fabrics : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }
        protected void FabricDropDownList_DataBound(object sender, EventArgs e)
        {
            FabricDropDownList.Items.Insert(0, new ListItem("[ Fabrics ]", "0"));
        }
        protected void DamageButton_Click(object sender, EventArgs e)
        {
            FabricsDamageSQL.Insert();
            DamageRecordGridView.DataBind();

            FabricDropDownList.SelectedIndex = 0;
            QuantityTextBox.Text = string.Empty;
            PriceTextBox.Text = string.Empty;
            DateTextBox.Text = string.Empty;
        }
    }
}