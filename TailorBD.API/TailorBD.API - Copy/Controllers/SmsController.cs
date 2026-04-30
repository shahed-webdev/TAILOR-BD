using Microsoft.AspNetCore.Mvc;
using TailorBD.API.Data;
using Dapper;
using System.Text;
using System.Text.Json;

namespace TailorBD.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SmsController : ControllerBase
    {
        private readonly TailorBdContext _context;
        private const string GreenWebHost = "https://api.greenweb.com.bd/";
        private const string GreenWebApiKey = "90282141541680536514c64f44771ad21951c8b207c2dcf341b0";

        public SmsController(TailorBdContext context) => _context = context;

        // ── SMS balance & masking ─────────────────────────────────────────────
        [HttpGet("info")]
        public IActionResult GetInfo(int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var info = con.QueryFirstOrDefault(
                    "SELECT SMS_Balance, Masking FROM SMS WHERE InstitutionID=@IID",
                    new { IID = institutionId });

                return Ok(new
                {
                    success    = true,
                    smsBalance = (int)(info?.SMS_Balance ?? 0),
                    masking    = (string?)(info?.Masking) ?? ""
                });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ── Customer list ────────────────────────────────────────────────────
        [HttpGet("customers")]
        public IActionResult GetCustomers(int institutionId, string? phone = null,
            int? customerNumber = null, int page = 1, int pageSize = 500)
        {
            try
            {
                using var con = _context.CreateConnection();
                var p = new { IID = institutionId, Phone = phone, CustNo = customerNumber,
                               Offset = (page - 1) * pageSize, PageSize = pageSize };

                var total = con.ExecuteScalar<int>(@"
                    SELECT COUNT(*) FROM Customer
                    WHERE InstitutionID=@IID
                      AND (@Phone IS NULL OR Phone LIKE '%' + @Phone + '%')
                      AND (@CustNo IS NULL OR CustomerNumber=@CustNo)", p);

                var data = con.Query(@"
                    SELECT c.CustomerID, c.CustomerNumber, c.CustomerName, c.Phone, c.Address
                    FROM Customer c
                    WHERE c.InstitutionID=@IID
                      AND (@Phone IS NULL OR c.Phone LIKE '%' + @Phone + '%')
                      AND (@CustNo IS NULL OR c.CustomerNumber=@CustNo)
                    ORDER BY c.CustomerNumber
                    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY", p);

                return Ok(new { success = true, total, page, pageSize,
                    totalPages = (int)Math.Ceiling((double)total / pageSize), data });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ── Send SMS ─────────────────────────────────────────────────────────
        [HttpPost("send")]
        public async Task<IActionResult> Send([FromBody] SmsSendModel m)
        {
            try
            {
                using var con = _context.CreateConnection();

                var smsInfo = con.QueryFirstOrDefault(
                    "SELECT SMS_Balance, Masking FROM SMS WHERE InstitutionID=@IID",
                    new { IID = m.InstitutionID });
                if (smsInfo == null)
                    return BadRequest(new { success = false, message = "SMS তথ্য পাওয়া যায়নি" });

                int dbBalance = smsInfo.SMS_Balance;
                int totalSmsCount = m.PhoneNumbers.Count * TotalSmsCount(m.Message);

                if (dbBalance < totalSmsCount)
                    return BadRequest(new { success = false, message = $"অপর্যাপ্ত ব্যালেন্স। প্রয়োজন: {totalSmsCount}, আপনার ব্যালেন্স: {dbBalance}" });

                int sentCount = 0;
                for (int i = 0; i < m.PhoneNumbers.Count; i++)
                {
                    var phone = m.PhoneNumbers[i];
                    var customerId = i < m.CustomerIds.Count ? m.CustomerIds[i] : 0;

                    if (!IsValidBdNumber(phone)) continue;

                    var (ok, response) = await SendSmsGreenWeb(phone, m.Message);
                    if (ok)
                    {
                        var smsSendId = Guid.NewGuid();
                        con.Execute(@"
                            INSERT INTO SMS_Send_Record
                                (SMS_Send_ID, PhoneNumber, TextSMS, TextCount, SMSCount, PurposeOfSMS, Status, Date, SMS_Response)
                            VALUES (@ID, @Phone, @Text, @TextLen, @SmsCount, 'Send SMS', 'Sent', GETDATE(), @Response)",
                            new { ID = smsSendId, Phone = phone, Text = m.Message,
                                  TextLen = (float)m.Message.Length, SmsCount = (float)TotalSmsCount(m.Message), Response = response });

                        if (customerId > 0)
                            con.Execute(@"INSERT INTO SMS_OtherInfo (SMS_Send_ID, InstitutionID, CustomerID)
                                          VALUES (@ID, @IID, @CID)",
                                new { ID = smsSendId, IID = m.InstitutionID, CID = customerId });

                        sentCount++;
                    }
                }

                return Ok(new { success = true, sentCount, message = $"{sentCount} টি এসএমএস সফলভাবে পাঠানো হয়েছে।" });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ── SMS history ───────────────────────────────────────────────────────────
        [HttpGet("history")]
        public IActionResult GetHistory(int institutionId, int page = 1, int pageSize = 50,
            string? mobile = null, string? customerName = null,
            string? fromDate = null, string? toDate = null)
        {
            try
            {
                using var con = _context.CreateConnection();
                var offset = (page - 1) * pageSize;

                var p = new
                {
                    IID      = institutionId,
                    Mobile   = string.IsNullOrWhiteSpace(mobile)       ? null : "%" + mobile.Trim() + "%",
                    CustName = string.IsNullOrWhiteSpace(customerName) ? null : "%" + customerName.Trim() + "%",
                    From     = string.IsNullOrWhiteSpace(fromDate)     ? (DateTime?)null : DateTime.Parse(fromDate),
                    To       = string.IsNullOrWhiteSpace(toDate)       ? (DateTime?)null : DateTime.Parse(toDate).AddDays(1).AddSeconds(-1),
                    Offset   = offset,
                    PageSize = pageSize
                };

                const string where = @"
                    FROM SMS_Send_Record r
                    INNER JOIN SMS_OtherInfo o ON r.SMS_Send_ID = o.SMS_Send_ID
                    LEFT  JOIN Customer c ON o.CustomerID = c.CustomerID
                    WHERE o.InstitutionID = @IID
                      AND (@Mobile   IS NULL OR r.PhoneNumber   LIKE @Mobile)
                      AND (@CustName IS NULL OR c.CustomerName  LIKE @CustName)
                      AND (@From     IS NULL OR r.Date         >= @From)
                      AND (@To       IS NULL OR r.Date         <= @To)";

                var total = con.ExecuteScalar<int>("SELECT COUNT(*) " + where, p);

                var data = con.Query(@"
                    SELECT r.SMS_Send_ID,
                           r.PhoneNumber, r.TextSMS, r.SMSCount, r.Status,
                           CONVERT(varchar(19), r.Date, 120) AS SentDate,
                           c.CustomerName, c.CustomerNumber
                    " + where + @"
                    ORDER BY r.Date DESC
                    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY", p);

                return Ok(new
                {
                    success = true, total, page, pageSize,
                    totalPages = (int)Math.Ceiling((double)total / pageSize),
                    data
                });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ══ CONTACT LIST ENDPOINTS ══════════════════════════════════════════════

        // ── Groups ───────────────────────────────────────────────────────────────
        [HttpGet("groups")]
        public IActionResult GetGroups(int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                var data = con.Query(
                    @"SELECT g.SMS_GroupID, g.GroupName,
                             COUNT(n.SMS_NumberID) AS ContactCount
                      FROM SMS_Group_Name g
                      LEFT JOIN SMS_Group_Phone_Number n ON g.SMS_GroupID = n.SMS_GroupID
                      WHERE g.InstitutionID = @IID
                      GROUP BY g.SMS_GroupID, g.GroupName
                      ORDER BY g.GroupName",
                    new { IID = institutionId });
                return Ok(new { success = true, data });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpPost("groups")]
        public IActionResult AddGroup([FromBody] GroupModel m)
        {
            try
            {
                using var con = _context.CreateConnection();
                var id = con.ExecuteScalar<int>(
                    @"INSERT INTO SMS_Group_Name (InstitutionID, RegistrationID, GroupName)
                      VALUES (@IID, @RID, @Name);
                      SELECT SCOPE_IDENTITY();",
                    new { IID = m.InstitutionId, RID = m.RegistrationId, Name = m.GroupName.Trim() });
                return Ok(new { success = true, smsGroupId = id, message = "গ্রুপ তৈরি হয়েছে" });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpPut("groups/{id}")]
        public IActionResult UpdateGroup(int id, [FromBody] GroupModel m)
        {
            try
            {
                using var con = _context.CreateConnection();
                con.Execute(
                    "UPDATE SMS_Group_Name SET GroupName=@Name WHERE SMS_GroupID=@ID AND InstitutionID=@IID",
                    new { Name = m.GroupName.Trim(), ID = id, IID = m.InstitutionId });
                return Ok(new { success = true, message = "গ্রুপ আপডেট হয়েছে" });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpDelete("groups/{id}")]
        public IActionResult DeleteGroup(int id, int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                con.Execute("DELETE FROM SMS_Group_Phone_Number WHERE SMS_GroupID=@ID", new { ID = id });
                con.Execute("DELETE FROM SMS_Group_Name WHERE SMS_GroupID=@ID AND InstitutionID=@IID",
                    new { ID = id, IID = institutionId });
                return Ok(new { success = true, message = "গ্রুপ মুছে গেছে" });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ── Contacts ──────────────────────────────────────────────────────────────
        [HttpGet("contacts")]
        public IActionResult GetContacts(int institutionId, int groupId = 0,
            string? search = null, int page = 1, int pageSize = 100)
        {
            try
            {
                using var con = _context.CreateConnection();
                var p = new
                {
                    IID      = institutionId,
                    GID      = groupId,
                    Search   = string.IsNullOrWhiteSpace(search) ? null : "%" + search.Trim() + "%",
                    Offset   = (page - 1) * pageSize,
                    PageSize = pageSize
                };

                const string where = @"
                    FROM SMS_Group_Phone_Number n
                    INNER JOIN SMS_Group_Name g ON n.SMS_GroupID = g.SMS_GroupID
                    WHERE n.InstitutionID = @IID
                      AND (@GID  = 0 OR n.SMS_GroupID = @GID)
                      AND (@Search IS NULL OR n.Name LIKE @Search OR n.MobileNo LIKE @Search)";

                var total = con.ExecuteScalar<int>("SELECT COUNT(*) " + where, p);
                var data  = con.Query(@"
                    SELECT n.SMS_NumberID, n.SMS_GroupID, g.GroupName,
                           n.Name, n.MobileNo, n.Address,
                           CONVERT(varchar(11), n.Add_Date, 106) AS AddDate
                    " + where + @"
                    ORDER BY n.SMS_GroupID, n.Name
                    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY", p);

                return Ok(new { success = true, total, page, pageSize,
                    totalPages = (int)Math.Ceiling((double)total / pageSize), data });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpPost("contacts")]
        public IActionResult AddContact([FromBody] ContactModel m)
        {
            try
            {
                using var con = _context.CreateConnection();
                var id = con.ExecuteScalar<int>(
                    @"INSERT INTO SMS_Group_Phone_Number
                        (InstitutionID, RegistrationID, SMS_GroupID, Name, MobileNo, Address)
                      VALUES (@IID, @RID, @GID, @Name, @Mobile, @Address);
                      SELECT SCOPE_IDENTITY();",
                    new { IID = m.InstitutionId, RID = m.RegistrationId, GID = m.GroupId,
                          Name = m.Name?.Trim(), Mobile = m.MobileNo?.Trim(), Address = m.Address?.Trim() });
                return Ok(new { success = true, smsNumberId = id, message = "কন্টাক্ট যোগ হয়েছে" });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpPut("contacts/{id}")]
        public IActionResult UpdateContact(int id, [FromBody] ContactModel m)
        {
            try
            {
                using var con = _context.CreateConnection();
                con.Execute(
                    @"UPDATE SMS_Group_Phone_Number
                      SET Name=@Name, MobileNo=@Mobile, Address=@Address, SMS_GroupID=@GID
                      WHERE SMS_NumberID=@ID",
                    new { Name = m.Name?.Trim(), Mobile = m.MobileNo?.Trim(),
                          Address = m.Address?.Trim(), GID = m.GroupId, ID = id });
                return Ok(new { success = true, message = "কন্টাক্ট আপডেট হয়েছে" });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpDelete("contacts/{id}")]
        public IActionResult DeleteContact(int id)
        {
            try
            {
                using var con = _context.CreateConnection();
                con.Execute("DELETE FROM SMS_Group_Phone_Number WHERE SMS_NumberID=@ID", new { ID = id });
                return Ok(new { success = true, message = "কন্টাক্ট মুছে গেছে" });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ── Send SMS to contacts ──────────────────────────────────────────────────
        [HttpPost("contacts/send")]
        public async Task<IActionResult> SendToContacts([FromBody] ContactSmsModel m)
        {
            try
            {
                using var con = _context.CreateConnection();
                var smsInfo = con.QueryFirstOrDefault(
                    "SELECT SMS_Balance FROM SMS WHERE InstitutionID=@IID", new { IID = m.InstitutionId });
                if (smsInfo == null)
                    return BadRequest(new { success = false, message = "SMS তথ্য পাওয়া যায়নি" });

                int totalNeeded = m.ContactIds.Count * TotalSmsCount(m.Message);
                if ((int)smsInfo.SMS_Balance < totalNeeded)
                    return BadRequest(new { success = false,
                        message = $"অপর্যাপ্ত ব্যালেন্স। প্রয়োজন: {totalNeeded}, ব্যালেন্স: {smsInfo.SMS_Balance}" });

                var phones = con.Query<dynamic>(
                    "SELECT SMS_NumberID, MobileNo FROM SMS_Group_Phone_Number WHERE SMS_NumberID IN @IDs",
                    new { IDs = m.ContactIds });

                int sentCount = 0;
                foreach (var c in phones)
                {
                    string phone = c.MobileNo;
                    if (!IsValidBdNumber(phone)) continue;
                    var (ok, response) = await SendSmsGreenWeb(phone, m.Message);
                    if (ok)
                    {
                        var smsSendId = Guid.NewGuid();
                        con.Execute(@"
                            INSERT INTO SMS_Send_Record
                                (SMS_Send_ID,PhoneNumber,TextSMS,TextCount,SMSCount,PurposeOfSMS,Status,Date,SMS_Response)
                            VALUES (@ID,@Phone,@Text,@TextLen,@SmsCount,'Others SMS','Sent',GETDATE(),@Response)",
                            new { ID = smsSendId, Phone = phone, Text = m.Message,
                                  TextLen = (float)m.Message.Length,
                                  SmsCount = (float)TotalSmsCount(m.Message), Response = response });
                        con.Execute(
                            "INSERT INTO SMS_OtherInfo (SMS_Send_ID,InstitutionID,CustomerID) VALUES (@ID,@IID,NULL)",
                            new { ID = smsSendId, IID = m.InstitutionId });
                        sentCount++;
                    }
                }
                return Ok(new { success = true, sentCount,
                    message = $"{sentCount} টি এসএমএস সফলভাবে পাঠানো হয়েছে।" });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ══ SMS TEMPLATE ENDPOINTS ══════════════════════════════════════════════

        [HttpGet("templates")]
        public IActionResult GetTemplates(int institutionId, string? templateFor = null)
        {
            try
            {
                using var con = _context.CreateConnection();
                var data = con.Query(
                    @"SELECT SMS_TemplateID, TemplateName, TemplateText, TemplateFor
                      FROM SMS_Template
                      WHERE InstitutionID = @IID
                        AND (@TemplateFor IS NULL OR TemplateFor = @TemplateFor)
                      ORDER BY TemplateName",
                    new { IID = institutionId, TemplateFor = templateFor });
                return Ok(new { success = true, data });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpPost("templates")]
        public IActionResult AddTemplate([FromBody] SmsTemplateModel m)
        {
            try
            {
                using var con = _context.CreateConnection();
                var id = con.ExecuteScalar<int>(
                    @"INSERT INTO SMS_Template (InstitutionID, RegistrationID, TemplateName, TemplateText, TemplateFor)
                      VALUES (@IID, @RID, @Name, @Text, @For);
                      SELECT SCOPE_IDENTITY();",
                    new { IID = m.InstitutionId, RID = m.RegistrationId, Name = m.TemplateName.Trim(), Text = m.TemplateText.Trim(), For = m.TemplateFor });
                return Ok(new { success = true, smsTemplateId = id, message = "টেমপ্লেট তৈরি হয়েছে" });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpPut("templates/{id}")]
        public IActionResult UpdateTemplate(int id, [FromBody] SmsTemplateModel m)
        {
            try
            {
                using var con = _context.CreateConnection();
                con.Execute(
                    @"UPDATE SMS_Template SET TemplateName=@Name, TemplateText=@Text, TemplateFor=@For
                      WHERE SMS_TemplateID=@ID AND InstitutionID=@IID",
                    new { Name = m.TemplateName.Trim(), Text = m.TemplateText.Trim(), For = m.TemplateFor, ID = id, IID = m.InstitutionId });
                return Ok(new { success = true, message = "টেমপ্লেট আপডেট হয়েছে" });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        [HttpDelete("templates/{id}")]
        public IActionResult DeleteTemplate(int id, int institutionId)
        {
            try
            {
                using var con = _context.CreateConnection();
                con.Execute("DELETE FROM SMS_Template WHERE SMS_TemplateID=@ID AND InstitutionID=@IID",
                    new { ID = id, IID = institutionId });
                return Ok(new { success = true, message = "টেমপ্লেট মুছে গেছে" });
            }
            catch (Exception ex) { return BadRequest(new { success = false, message = ex.Message }); }
        }

        // ── GreenWeb helpers ─────────────────────────────────────────────────
        private static async Task<(bool ok, string response)> SendSmsGreenWeb(string number, string message)
        {
            using var http = new HttpClient();
            var content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                { "token",   GreenWebApiKey },
                { "to",      number         },
                { "message", message        }
            });
            var res = await http.PostAsync($"{GreenWebHost}api.php?json", content);
            var body = await res.Content.ReadAsStringAsync();
            try
            {
                using var doc = JsonDocument.Parse(body);
                var status = doc.RootElement[0].GetProperty("status").GetString();
                return (status == "SENT", body);
            }
            catch { return (false, body); }
        }

        private static bool IsValidBdNumber(string number)
        {
            if (string.IsNullOrWhiteSpace(number)) return false;
            var digits = new string(number.Where(char.IsDigit).ToArray());
            return digits.Length >= 10;
        }

        private static int TotalSmsCount(string text)
        {
            if (string.IsNullOrEmpty(text)) return 1;
            bool isUnicode = text.Any(c => c > 0xFF);
            int perSms = isUnicode ? 70 : 160;
            return Math.Max(1, (int)Math.Ceiling((double)text.Length / perSms));
        }
    }

    public class SmsSendModel
    {
        public int InstitutionID { get; set; }
        public int RegistrationID { get; set; }
        public string Message { get; set; } = "";
        public List<string> PhoneNumbers { get; set; } = new();
        public List<int> CustomerIds { get; set; } = new();
    }

    // ────────────────────────────────────────────────────────────────────────────
    public class GroupModel
    {
        public int InstitutionId { get; set; }
        public int RegistrationId { get; set; }
        public string GroupName { get; set; } = "";
    }

    public class ContactModel
    {
        public int InstitutionId { get; set; }
        public int RegistrationId { get; set; }
        public int GroupId { get; set; }
        public string? Name { get; set; }
        public string? MobileNo { get; set; }
        public string? Address { get; set; }
    }

    public class ContactSmsModel
    {
        public int InstitutionId { get; set; }
        public string Message { get; set; } = "";
        public List<int> ContactIds { get; set; } = new();
    }

    // ── SMS Template model ────────────────────────────────────────────────────
    public class SmsTemplateModel
    {
        public int InstitutionId { get; set; }
        public int RegistrationId { get; set; }
        public string TemplateName { get; set; } = "";
        public string TemplateText { get; set; } = "";
        public string TemplateFor { get; set; } = "";
    }
}
