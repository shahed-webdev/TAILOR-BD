namespace TailorBD.API.Helpers
{
    /// <summary>
    /// The shop menu pages the Authority can switch off per shop (Authority panel -> "Shop Page Access").
    /// Storage is a DENY list (table ShopPageBlock): a shop with no rows has every page, and pages added
    /// to the app later are allowed automatically. Keys are the page paths used in the sidebar
    /// (components/sidebar.html), e.g. "/cutting-issue.html".
    /// </summary>
    public static class ShopPageCatalog
    {
        public sealed record Page(string Key, string Bn, string En);
        public sealed record Section(string Key, string Bn, string En, IReadOnlyList<Page> Pages);

        private static Page P(string key, string bn, string en) => new(key, bn, en);

        /// <summary>Same sections, order and Bengali labels as the shop sidebar.</summary>
        public static readonly IReadOnlyList<Section> Sections = new List<Section>
        {
            new("quick", "কুইক অর্ডার", "Quick Order", new[]
            {
                P("/quick-order.html", "কুইক অর্ডার", "Quick Order"),
            }),
            new("basic", "বেসিক সেটিং", "Basic Setting", new[]
            {
                P("/tailor-info.html",       "প্রতিষ্ঠানের তথ্য",              "Tailor Shop Info"),
                P("/dress-add.html",         "পোষাক ও মাপ যুক্ত করুন",        "Add Dress & Measurement"),
                P("/print-settings.html",    "মাপ প্রিন্ট সেটিং",              "Map Print Setting"),
                P("/sub-admin.html",         "সাব এডমিন তৈরী করুন",            "SignUp Sub Admin"),
                P("/access-management.html", "সাব-অ্যাডমিন প্রবেশাধিকার নিয়ন্ত্রণ", "Sub Admin Page Access"),
            }),
            new("order", "অর্ডার", "Order", new[]
            {
                P("/new-order.html",            "নতুন অর্ডার",                  "New Order"),
                P("/order-list.html",           "অর্ডার তালিকা",                "Order List"),
                P("/cutting-issue.html",        "কাটিং ইস্যু",                  "Cutting Issue"),
                P("/worker-payments.html",      "কর্মী পেমেন্ট",                 "Worker Payments"),
                P("/factory-issue.html",        "কারখানা ইস্যু",                 "Factory Issue"),
                P("/incomplete-works.html",     "অর্ডারের কাজ সম্পূর্ণ করুন",      "Complete Order Works"),
                P("/change-delivery-date.html", "ডেলিভারি তারিখ পরিবর্তন করুন",   "Change Delivery Date"),
                P("/delete-order.html",         "স্থায়ীভাবে অর্ডার ডিলেট করুন",    "Permanently Delete Order"),
            }),
            new("delivery", "ডেলিভারি", "Delivery", new[]
            {
                P("/delivery-give.html",      "ডেলিভারি দিন",      "Delivery Give"),
                P("/delivered-orders.html",   "ডেলিভারিকৃত অর্ডার", "Delivered Orders"),
                P("/delivery-day.html",       "ডেলিভারির তারিখ",    "Delivery Day"),
                P("/delivery-cut-dress.html", "ডেলিভারিকৃত পোশাক",  "Delivery Cut Dress"),
            }),
            new("customer", "কাস্টমার", "Customer", new[]
            {
                P("/add-customer.html",  "কাস্টমার যুক্ত করুন", "Add New Customer"),
                P("/customer-list.html", "কাস্টমারের তালিকা",  "Customer List"),
            }),
            new("item-basic", "আইটেম ব্যবস্থাপনা › বেসিক সেটিং", "Item Management › Basic Setting", new[]
            {
                P("/item-measurement-unit.html", "মেজারমেন্ট ইউনিট",    "Measurement Unit"),
                P("/item-brand.html",            "ব্র্যান্ড যুক্ত করুন",  "Add Brand"),
                P("/item-category.html",         "ক্যাটাগরি",            "Category"),
                P("/item-add.html",              "আইটেম যুক্ত করুন",     "Add Item"),
            }),
            new("item-purchase", "আইটেম ব্যবস্থাপনা › আইটেম ক্রয়", "Item Management › Item Purchase", new[]
            {
                P("/item-purchase.html",        "আইটেম ক্রয় করুন", "Purchase Item"),
                P("/item-purchase-record.html", "রেকর্ড দেখুন",    "View Records"),
                P("/item-purchase-return.html", "ফেরত দিন",       "Return"),
                P("/item-purchase-report.html", "রিপোর্ট",         "Report"),
            }),
            new("item-sales", "আইটেম ব্যবস্থাপনা › আইটেম বিক্রি", "Item Management › Item Sales", new[]
            {
                P("/item-stock-report.html", "স্টক রিপোর্ট",       "Stock Report"),
                P("/item-sell.html",         "আইটেম বিক্রি করুন",  "Sell Item"),
                P("/item-sell-record.html",  "রেকর্ড দেখুন",       "View Records"),
                P("/item-sell-return.html",  "ফেরত দিন",          "Return"),
                P("/item-sell-report.html",  "রিপোর্ট",            "Report"),
            }),
            new("item-other", "আইটেম ব্যবস্থাপনা › অন্যান্য", "Item Management › Others", new[]
            {
                P("/item-supplier-add.html", "সাপ্লায়ার", "Supplier"),
                P("/item-damage-add.html",   "ড্যামেজ",   "Damage"),
            }),
            new("accounts-report", "হিসাব-নিকাশ › রিপোর্ট", "Accounts › Reports", new[]
            {
                P("/order-delivery-report.html", "অর্ডার ও ডেলিভারি রিপোর্ট", "Order & Delivery Report"),
                P("/income-expense-report.html", "আয় ও ব্যয়ের রিপোর্ট",      "Income & Expense Report"),
                P("/income-expense-net.html",    "ইনকাম এক্সপেন্স নেট",      "Income Expense Net"),
                P("/account-log.html",           "একাউন্ট লগ",              "Account Log"),
                P("/income-due-expense.html",    "জমা, বাকি ও খরচ দেখুন",    "Income, Due & Expense"),
                P("/transaction-log.html",       "লেনদেন লগ",               "Transaction Log"),
            }),
            new("accounts", "হিসাব-নিকাশ", "Accounts", new[]
            {
                P("/add-expense.html",        "খরচ যুক্ত করুন",       "Add Expense"),
                P("/add-other-income.html",   "অন্যান্য আয় যোগ করুন", "Add Other Income"),
                P("/account-management.html", "একাউন্ট ম্যানেজমেন্ট",  "Account Management"),
                P("/employee.html",           "কর্মচারীর হিসাব",      "Employee Accounts"),
            }),
            new("message", "মেসেজ", "Message", new[]
            {
                P("/sms.html",          "এসএমএস পাঠান",      "Send SMS"),
                P("/sms-history.html",  "এসএমএস ইতিহাস",     "SMS History"),
                P("/contact-list.html", "ফোন কন্টাক্ট লিস্ট", "Phone contact list"),
                P("/sms-recharge.html", "রিচার্জ",           "Recharge"),
                P("/sms-settings.html", "SMS সেটিংস",        "SMS Settings"),
            }),
        };

        /// <summary>Never blockable: dashboards, login, access-denied page, invoices (a blocked shop must still be able to pay).</summary>
        public static readonly IReadOnlySet<string> AlwaysAllowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "/dashboard.html", "/sub-admin-dashboard.html", "/sub-admin-profile.html",
            "/login.html", "/index.html", "/access-denied.html",
            "/due-invoice.html", "/paid-invoice.html", "/payment-result.html",
        };

        /// <summary>Old / alternative URLs of a menu page (same list as AccessController + app-components.js).</summary>
        public static readonly IReadOnlyDictionary<string, string> Aliases = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["/ordrlist.html"]                    = "/order-list.html",
            ["/incompleteworks.html"]             = "/incomplete-works.html",
            ["/add-customer-mesurement.html"]     = "/add-customer.html",
            ["/damage-report.html"]               = "/item-damage-add.html",
            ["/item-damage.html"]                 = "/item-damage-add.html",
            ["/mesurement-printing-setting.html"] = "/print-settings.html",
            ["/map-print-setting.html"]           = "/print-settings.html",
            ["/delivered-works.html"]             = "/delivery-cut-dress.html",
        };

        private static readonly string[] OrderEntry = { "/order-list.html", "/new-order.html", "/quick-order.html" };
        private static readonly string[] CustomerEntry = { "/customer-list.html", "/add-customer.html", "/new-order.html", "/order-list.html" };

        /// <summary>
        /// Pages that are not in the menu but opened from other pages (row actions, print pages).
        /// Such a page is blocked only when EVERY page that opens it is blocked, so a shop that
        /// keeps e.g. Order List can still edit orders.
        /// </summary>
        public static readonly IReadOnlyDictionary<string, string[]> Dependents = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
        {
            ["/order-edit.html"]      = OrderEntry,
            ["/update-order.html"]    = OrderEntry,
            ["/add-more-dress.html"]  = OrderEntry,
            ["/finish-order.html"]    = OrderEntry,
            ["/money-receipt.html"]   = OrderEntry.Concat(new[] { "/delivery-give.html", "/delivered-orders.html", "/delivery-cut-dress.html" }).ToArray(),
            ["/dress-measurements.html"] = CustomerEntry.Concat(new[] { "/quick-order.html" }).ToArray(),
            ["/customer-details.html"]   = CustomerEntry,
            ["/customer-measurement-print.html"] = CustomerEntry,
            ["/order-measurements.html"] = new[] { "/incomplete-works.html" },
            ["/item-sell-invoice.html"]  = new[] { "/item-sell.html", "/item-sell-record.html", "/item-sell-return.html" },
            ["/dress-style-add.html"]    = new[] { "/dress-add.html" },
            ["/style-design-add.html"]   = new[] { "/dress-add.html" },
        };

        /// <summary>Every page key the Authority can tick / untick.</summary>
        public static readonly IReadOnlySet<string> BlockableKeys =
            new HashSet<string>(Sections.SelectMany(s => s.Pages).Select(p => p.Key), StringComparer.OrdinalIgnoreCase);

        /// <summary>"/Cutting-Issue" , "cutting-issue.html?x=1" -> "/cutting-issue.html".</summary>
        public static string Normalize(string? path)
        {
            var p = (path ?? string.Empty).Trim();
            int cut = p.IndexOfAny(new[] { '?', '#' });
            if (cut >= 0) p = p.Substring(0, cut);
            p = "/" + p.TrimStart('~').TrimStart('/').TrimEnd('/');
            p = p.ToLowerInvariant();
            if (p != "/" && !System.IO.Path.HasExtension(p)) p += ".html";
            return p;
        }

        /// <summary>True for any page this feature can block (menu page, alias or dependent page).</summary>
        public static bool IsControlled(string? path)
        {
            var n = Normalize(path);
            return BlockableKeys.Contains(n) || Aliases.ContainsKey(n) || Dependents.ContainsKey(n);
        }

        /// <summary>
        /// Stored (blocked) keys -> every page URL that must be refused: the blocked menu pages,
        /// their old alias URLs, and dependent pages whose opening pages are all blocked.
        /// </summary>
        public static HashSet<string> Effective(IEnumerable<string> blockedKeys)
        {
            var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var k in blockedKeys)
            {
                var n = Normalize(k);
                if (BlockableKeys.Contains(n) && !AlwaysAllowed.Contains(n)) set.Add(n);
            }
            if (set.Count == 0) return set;
            foreach (var d in Dependents)
                if (d.Value.All(parent => set.Contains(parent))) set.Add(d.Key);
            foreach (var a in Aliases)
                if (set.Contains(a.Value)) set.Add(a.Key);
            return set;
        }
    }
}
