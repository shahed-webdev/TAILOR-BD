using System.Data;
using System.Text;
using System.Text.RegularExpressions;
using Dapper;

namespace TailorBD.API.Services
{
    // ── Bulk add of cutting masters / artisans (কারিগর) from an Excel/CSV upload ──
    // The browser reads the file (SheetJS) and posts the rows; everything that decides
    // what gets saved (trim, phone normalisation, duplicate checks, insert) happens here.
    // Rows are inserted exactly like the one-by-one POST (same columns, IsActive = 1).
    public class WorkerBulkRow
    {
        public int RowNumber { get; set; }
        public string? Name { get; set; }
        public string? Phone { get; set; }
    }

    public class WorkerBulkRequest
    {
        public int InstitutionID { get; set; }
        public int RegistrationID { get; set; }
        public List<WorkerBulkRow>? Rows { get; set; }
    }

    public class WorkerBulkSkip
    {
        public int RowNumber { get; set; }
        public string Name { get; set; } = "";
        public string Phone { get; set; } = "";
        public string Reason { get; set; } = "";   // EMPTY_NAME, NAME_TOO_LONG, INVALID_PHONE, SCI_PHONE, DUP_EXISTING, DUP_NAME, DUP_IN_FILE
        public string? Detail { get; set; }         // existing worker's name / first row number in the file
    }

    public class WorkerBulkPlan
    {
        public List<(int RowNumber, string Name, string? Phone)> ToInsert { get; } = new();
        public List<WorkerBulkSkip> Skipped { get; } = new();
        public int BlankRows { get; set; }
    }

    public enum WorkerTable { CuttingMaster, Artisan }

    public static class WorkerBulkImport
    {
        public const int MaxRows = 1000;
        public const int MaxNameLength = 150;   // CuttingMaster.Name / Artisan.Name NVARCHAR(150)

        private static readonly Regex Spaces = new(@"\s+", RegexOptions.Compiled);
        private static readonly Regex Scientific = new(@"^[0-9]+(\.[0-9]+)?[eE][+]?[0-9]+$", RegexOptions.Compiled);
        private static readonly Regex TrailingZeroDecimal = new(@"^([0-9]+)\.0+$", RegexOptions.Compiled);

        /// <summary>Bengali digits (০-৯) to ASCII.</summary>
        public static string AsciiDigits(string s)
        {
            var sb = new StringBuilder(s.Length);
            foreach (var c in s)
                sb.Append(c >= '\u09E6' && c <= '\u09EF' ? (char)('0' + (c - '\u09E6')) : c);
            return sb.ToString();
        }

        /// <summary>
        /// Phone as stored for a new worker: local 11-digit mobile "01XXXXXXXXX".
        /// Uses the app's NormalizePhone (the SMS format 8801XXXXXXXXX), so 1712345678 (Excel dropped
        /// the 0), 01712345678, +880 1712-345678 and 8801712345678 all give 01712345678.
        /// Returns null for an empty phone; sets reason for a phone that cannot be used.
        /// </summary>
        public static string? ToLocalMobile(string? raw, Func<string, string> normalizePhone, out string? reason)
        {
            reason = null;
            var s = AsciiDigits((raw ?? "").Trim());
            if (s.Length == 0) return null;
            if (Scientific.IsMatch(s)) { reason = "SCI_PHONE"; return null; }   // 1.71235E+09: digits already lost
            var m = TrailingZeroDecimal.Match(s);
            if (m.Success) s = m.Groups[1].Value;                               // 1712345678.0
            var n = normalizePhone(s);
            if (n.Length == 13 && n.StartsWith("8801")) return "0" + n.Substring(3);
            reason = "INVALID_PHONE";
            return null;
        }

        /// <summary>Duplicate key of a phone already stored (stored as typed by the user).</summary>
        public static string? PhoneKey(string? stored, Func<string, string> normalizePhone)
        {
            var local = ToLocalMobile(stored, normalizePhone, out _);
            if (local != null) return local;
            var digits = new string(AsciiDigits(stored ?? "").Where(char.IsDigit).ToArray());
            return digits.Length > 0 ? digits : null;
        }

        private static string NameKey(string? name) => Spaces.Replace(name ?? "", " ").Trim().ToLowerInvariant();

        /// <summary>Pure validation: what would be inserted and what is skipped (no database).</summary>
        public static WorkerBulkPlan Plan(IEnumerable<WorkerBulkRow> rows,
                                          IEnumerable<(string? Name, string? Phone)> existing,
                                          Func<string, string> normalizePhone)
        {
            var plan = new WorkerBulkPlan();
            var existingByPhone = new Dictionary<string, string>();
            var existingByName = new Dictionary<string, string>();
            foreach (var e in existing)
            {
                var key = PhoneKey(e.Phone, normalizePhone);
                if (key != null && !existingByPhone.ContainsKey(key)) existingByPhone[key] = e.Name ?? "";
                var nk = NameKey(e.Name);
                if (nk.Length > 0 && !existingByName.ContainsKey(nk)) existingByName[nk] = e.Name ?? "";
            }
            var seenInFile = new Dictionary<string, int>();          // phone -> first row
            var seenNameNoPhone = new Dictionary<string, int>();     // name (rows without phone) -> first row

            int index = 0;
            foreach (var r in rows)
            {
                index++;
                int rowNo = r.RowNumber > 0 ? r.RowNumber : index + 1;   // + header row
                var name = Spaces.Replace(r.Name ?? "", " ").Trim();
                var phoneRaw = Spaces.Replace(r.Phone ?? "", " ").Trim();

                if (name.Length == 0 && phoneRaw.Length == 0) { plan.BlankRows++; continue; }

                WorkerBulkSkip Skip(string reason, string? detail = null) =>
                    new() { RowNumber = rowNo, Name = name, Phone = phoneRaw, Reason = reason, Detail = detail };

                if (name.Length == 0) { plan.Skipped.Add(Skip("EMPTY_NAME")); continue; }
                if (name.Length > MaxNameLength) { plan.Skipped.Add(Skip("NAME_TOO_LONG")); continue; }

                var phone = ToLocalMobile(phoneRaw, normalizePhone, out var phoneReason);
                if (phoneReason != null) { plan.Skipped.Add(Skip(phoneReason)); continue; }

                if (phone != null)
                {
                    if (existingByPhone.TryGetValue(phone, out var existingName))
                    { plan.Skipped.Add(Skip("DUP_EXISTING", existingName)); continue; }
                    if (seenInFile.TryGetValue(phone, out var firstRow))
                    { plan.Skipped.Add(Skip("DUP_IN_FILE", firstRow.ToString())); continue; }
                    seenInFile[phone] = rowNo;
                }
                else
                {
                    // no phone to compare: a re-uploaded file must not add the same person twice
                    var nk = NameKey(name);
                    if (existingByName.TryGetValue(nk, out var existingName))
                    { plan.Skipped.Add(Skip("DUP_NAME", existingName)); continue; }
                    if (seenNameNoPhone.TryGetValue(nk, out var firstRow))
                    { plan.Skipped.Add(Skip("DUP_IN_FILE", firstRow.ToString())); continue; }
                    seenNameNoPhone[nk] = rowNo;
                }
                plan.ToInsert.Add((rowNo, name, phone));
            }
            return plan;
        }

        /// <summary>Validates and inserts in ONE transaction (all valid rows or none).</summary>
        public static object Import(IDbConnection con, WorkerTable table, WorkerBulkRequest req, Func<string, string> normalizePhone)
        {
            // table name comes from the enum only, never from the request
            var tableName = table == WorkerTable.CuttingMaster ? "CuttingMaster" : "Artisan";
            var rows = req.Rows ?? new List<WorkerBulkRow>();

            if (con.State != ConnectionState.Open) con.Open();
            using var tx = con.BeginTransaction();

            // UPDLOCK+HOLDLOCK: two uploads for the same shop at the same time cannot both add the same phone
            var existing = con.Query<(string? Name, string? Phone)>(
                $"SELECT Name, Phone FROM {tableName} WITH (UPDLOCK, HOLDLOCK) WHERE InstitutionID=@InstitutionID",
                new { req.InstitutionID }, tx).ToList();

            var plan = Plan(rows, existing, normalizePhone);

            if (plan.ToInsert.Count > 0)
            {
                con.Execute($@"
                    INSERT INTO {tableName} (InstitutionID, RegistrationID, Name, Phone, IsActive)
                    VALUES (@InstitutionID, @RegistrationID, @Name, @Phone, 1);",
                    plan.ToInsert.Select(x => new { req.InstitutionID, req.RegistrationID, x.Name, x.Phone }), tx);
            }
            tx.Commit();

            return new
            {
                success = true,
                added = plan.ToInsert.Count,
                skippedCount = plan.Skipped.Count,
                blankRows = plan.BlankRows,
                skipped = plan.Skipped.Select(s => new { rowNumber = s.RowNumber, name = s.Name, phone = s.Phone, reason = s.Reason, detail = s.Detail })
            };
        }
    }
}
