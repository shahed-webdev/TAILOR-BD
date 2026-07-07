using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace TailorBD.API.Services
{
    public class NovocomSmsOptions
    {
        public string ApiUrl    { get; set; } = "https://sms.novocom-bd.com/api/v2/SendSMS";
        public string ApiKey    { get; set; } = "";
        public string ClientId  { get; set; } = "";
        public string SenderId  { get; set; } = "";
    }

    public class SmsSendResult
    {
        public bool   Success      { get; set; }
        public string Response     { get; set; } = "";
        public string? ErrorMessage { get; set; }
    }

    public interface INovocomSmsService
    {
        Task<SmsSendResult> SendAsync(string phone, string message, string senderId);
        int  CalculateSmsCount(string text);
        bool IsValidBdNumber(string number);
        string NormalizePhone(string number);
    }

    public class NovocomSmsService : INovocomSmsService
    {
        private readonly NovocomSmsOptions _opt;
        private readonly IHttpClientFactory  _httpFactory;
        private readonly ILogger<NovocomSmsService> _log;

        public NovocomSmsService(
            NovocomSmsOptions opt,
            IHttpClientFactory httpFactory,
            ILogger<NovocomSmsService> log)
        {
            _opt         = opt;
            _httpFactory = httpFactory;
            _log         = log;
        }

        public async Task<SmsSendResult> SendAsync(string phone, string message, string senderId)
        {
            if (string.IsNullOrWhiteSpace(_opt.ApiKey) || string.IsNullOrWhiteSpace(_opt.ClientId))
            {
                const string msg = "Novocom SMS credentials are not configured (ApiKey / ClientId).";
                _log.LogError(msg);
                return new SmsSendResult { Success = false, ErrorMessage = msg };
            }

            var resolvedSenderId = !string.IsNullOrWhiteSpace(senderId)
                ? senderId.Trim()
                : _opt.SenderId.Trim();

            if (string.IsNullOrWhiteSpace(resolvedSenderId))
            {
                const string msg = "SMS SenderId is required (appsettings NovocomSms:SenderId or institution Masking).";
                _log.LogWarning(msg);
                return new SmsSendResult { Success = false, ErrorMessage = msg };
            }

            var mobile = NormalizePhone(phone);
            if (string.IsNullOrEmpty(mobile))
            {
                const string msg = "Invalid Bangladesh mobile number.";
                return new SmsSendResult { Success = false, ErrorMessage = msg };
            }

            bool isUnicode = IsUnicode(message);
            var payload = new
            {
                ApiKey                    = _opt.ApiKey,
                ClientId                  = _opt.ClientId,
                SenderId                  = resolvedSenderId,
                Message                   = message,
                MobileNumbers             = mobile,
                Is_Unicode                = isUnicode,
                Is_Flash                  = false,
                IsRegisteredForDelivery   = true,
                DataCoding                = isUnicode ? "8" : "0"
            };

            try
            {
                var client = _httpFactory.CreateClient("NovocomSms");
                var json   = JsonSerializer.Serialize(payload);
                var resp   = await client.PostAsync(
                    "",
                    new StringContent(json, Encoding.UTF8, "application/json"));

                var body = await resp.Content.ReadAsStringAsync();
                _log.LogDebug("[NovocomSms] Send response: {Body}", body);

                if (!resp.IsSuccessStatusCode)
                {
                    _log.LogWarning("[NovocomSms] HTTP {Status}: {Body}", (int)resp.StatusCode, body);
                    return new SmsSendResult
                    {
                        Success      = false,
                        Response     = body,
                        ErrorMessage = $"HTTP {(int)resp.StatusCode}"
                    };
                }

                var parsed = JsonSerializer.Deserialize<NovocomApiResponse>(body,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                var ok = parsed?.ErrorCode == 0;
                if (!ok)
                {
                    _log.LogWarning("[NovocomSms] Send failed. ErrorCode={Code}, Description={Desc}",
                        parsed?.ErrorCode, parsed?.ErrorDescription);
                }

                return new SmsSendResult
                {
                    Success      = ok,
                    Response     = body,
                    ErrorMessage = ok ? null : (parsed?.ErrorDescription ?? "SMS send failed")
                };
            }
            catch (Exception ex)
            {
                _log.LogError(ex, "[NovocomSms] Exception while sending SMS to {Phone}", phone);
                return new SmsSendResult { Success = false, ErrorMessage = ex.Message };
            }
        }

        public int CalculateSmsCount(string text)
        {
            if (string.IsNullOrEmpty(text)) return 1;
            int perSms = IsUnicode(text) ? 70 : 160;
            return Math.Max(1, (int)Math.Ceiling((double)text.Length / perSms));
        }

        public bool IsValidBdNumber(string number)
        {
            if (string.IsNullOrWhiteSpace(number)) return false;
            var digits = new string(number.Where(char.IsDigit).ToArray());
            return digits.Length >= 10;
        }

        public string NormalizePhone(string number)
        {
            var digits = new string(number.Where(char.IsDigit).ToArray());
            if (digits.Length == 0) return "";

            if (digits.StartsWith("880") && digits.Length == 13)
                return digits;

            if (digits.StartsWith("88") && digits.Length == 13)
                return digits;

            if (digits.StartsWith("0") && digits.Length == 11)
                return "88" + digits;

            if (digits.Length == 10 && digits.StartsWith('1'))
                return "880" + digits;

            if (digits.Length == 11 && digits.StartsWith("01"))
                return "88" + digits;

            return digits.StartsWith("880") ? digits : "";
        }

        private static bool IsUnicode(string text) => text.Any(c => c > 0xFF);

        private sealed class NovocomApiResponse
        {
            [JsonPropertyName("ErrorCode")]
            public int ErrorCode { get; set; }

            [JsonPropertyName("ErrorDescription")]
            public string? ErrorDescription { get; set; }
        }
    }
}
