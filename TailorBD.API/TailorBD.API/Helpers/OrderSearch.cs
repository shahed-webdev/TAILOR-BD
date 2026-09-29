namespace TailorBD.API.Helpers
{
    /// <summary>Parses the "Order #" search box of the cutting / factory assigned lists.</summary>
    public static class OrderSearch
    {
        /// <summary>
        /// null  = no filter (empty box);
        /// n > 0 = exact OrderSerialNumber;
        /// -1    = something was typed that is not an order number (matches nothing).
        /// Accepts "#123", " 123 " and Bengali digits ("১২৩").
        /// </summary>
        public static int? ParseSerial(string? text)
        {
            if (string.IsNullOrWhiteSpace(text)) return null;
            var chars = new System.Text.StringBuilder();
            foreach (var ch in text.Trim().TrimStart('#').Trim())
            {
                if (ch >= '\u09E6' && ch <= '\u09EF') chars.Append((char)('0' + (ch - '\u09E6')));
                else chars.Append(ch);
            }
            return int.TryParse(chars.ToString(), System.Globalization.NumberStyles.None,
                                System.Globalization.CultureInfo.InvariantCulture, out var n) && n > 0 ? n : -1;
        }

        /// <summary>
        /// Search box of the "not yet issued" lists (cutting / factory eligible dresses):
        /// an order number (same forms as <see cref="ParseSerial"/>) matches that order EXACTLY;
        /// plain text without digits keeps the old customer-name / dress-name search;
        /// anything else with digits (phone numbers, "24a3", "0") is invalid and matches nothing.
        /// </summary>
        public static PendingSearch ParsePending(string? text)
        {
            var sn = ParseSerial(text);
            if (sn == null || text!.Trim().TrimStart('#').Trim().Length == 0) return new PendingSearch(null, null, false);
            if (sn > 0) return new PendingSearch(sn, null, false);
            var t = text.Trim();
            foreach (var ch in t) if (char.IsDigit(ch)) return new PendingSearch(null, null, true);   // incl. ০-৯
            return new PendingSearch(null, "%" + t + "%", false);
        }
    }

    /// <summary>Parsed pending-list search: exactly one of OrderSn / NameLike / Invalid (or none = full list).</summary>
    public sealed record PendingSearch(int? OrderSn, string? NameLike, bool Invalid)
    {
        public string Mode => Invalid ? "invalid" : OrderSn.HasValue ? "order" : NameLike != null ? "name" : "all";
    }
}
