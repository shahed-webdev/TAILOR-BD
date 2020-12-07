using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace TailorBD.AccessAdmin.Accounts
{
    public partial class Income : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (!this.IsPostBack)
            {
                PaidReorder();
                DueReorder();
                ExpnseReorder();
            }
        }
        protected void SubmitButton_Click(object sender, EventArgs e)
        {
            PaidReorder();
        }
        protected void DSubmitButton_Click(object sender, EventArgs e)
        {
            DueReorder();
        }
        protected void ESubmitButton_Click(object sender, EventArgs e)
        {
            ExpnseReorder();
        }

        protected void PaidReorder()
        {
            DataView dv = (DataView)ViewPaidSQL.Select(DataSourceSelectArguments.Empty);
            double reorderedProducts = (double)dv.Table.Rows[0][0];
            if (reorderedProducts > 0)
            {
                PaidLabel.Text = "সর্বমোট প্রাপ্ত : " + reorderedProducts + " টাকা";
            }
            else
            {
                PaidLabel.Text = "কোন টাকা পাইনি";
            }
        }
        protected void DueReorder()
        {
            DataView dv = (DataView)ViewDueSQL.Select(DataSourceSelectArguments.Empty);
            double reorderedProducts = (double)dv.Table.Rows[0][0];
            if (reorderedProducts > 0)
            {
                DueLabel.Text = "সর্বমোট বাকি : " + reorderedProducts + " টাকা";
            }
            else
            {
                DueLabel.Text = "কোন বাকি নেই";
            }
        }
        protected void ExpnseReorder()
        {
            DataView dv = (DataView)ViewExpanseSQL.Select(DataSourceSelectArguments.Empty);
            double reorderedProducts = (double)dv.Table.Rows[0][0];
            if (reorderedProducts > 0)
            {
                ExpnseLabel.Text = "সর্বমোট খরচ: " + reorderedProducts + " টাকা";
            }
            else
            {
                ExpnseLabel.Text = "কোন খরচ হয়নি";
            }
        }
    }
}