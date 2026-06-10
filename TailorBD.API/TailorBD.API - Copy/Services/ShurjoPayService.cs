using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace TailorBD.API.Services
{
    // ── ShurjoPay sandbox / live credentials ─────────────────────────────────
    public class ShurjoPayOptions
    {
        public string BaseUrl   { get; set; } = "https://engine.shurjopayment.com";
        public string Username  { get; set; } = "";
        public string Password  { get; set; } = "";
        public string MerchantId { get; set; } = "";
        public string ReturnUrl  { get; set; } = "";
        public string CancelUrl  { get; set; } = "";
        public string ClientIp   { get; set; } = "127.0.0.1";
    }

    // ── Token response from ShurjoPay ─────────────────────────────────────────
    public class SpTokenResponse
    {
        public string Token       { get; set; } = "";
        public string StoreId     { get; set; } = "";
        public string ExecuteUrl  { get; set; } = "";
        public int    TokenType   { get; set; }
        public string SpCode      { get; set; } = "";
        public string SpMessage   { get; set; } = "";
        public int    TokenCreateTime { get; set; }
        public int    ExpireTime  { get; set; }
    }

    // ── Checkout initiation result ────────────────────────────────────────────
    public class SpCheckoutResult
    {
        public bool   Success      { get; set; }
        public string CheckoutUrl  { get; set; } = "";
        public string OrderId      { get; set; } = "";
        public string Message      { get; set; } = "";
    }

    // ── Verify/callback response ──────────────────────────────────────────────
    public class SpVerifyResult
    {
        public bool   Success       { get; set; }
        public string SpOrderId     { get; set; } = "";
        public string SpTxnId       { get; set; } = "";
        public string PaymentStatus { get; set; } = "";   // Completed | Pending | Failed
        public double Amount        { get; set; }
        public string Currency      { get; set; } = "BDT";
        public string Message       { get; set; } = "";
        public string RawJson       { get; set; } = "";
    }

    public interface IShurjoPayService
    {
        Task<SpCheckoutResult> InitiatePaymentAsync(
            int    institutionId,
            string mergedInvoiceIds,
            double amount,
            string customerName,
            string customerEmail,
            string customerPhone,
            string customerAddress);

        Task<SpVerifyResult> VerifyPaymentAsync(string orderId);
    }

    public class ShurjoPayService : IShurjoPayService
    {
        private readonly ShurjoPayOptions    _opt;
        private readonly IHttpClientFactory  _httpFactory;
        private readonly ILogger<ShurjoPayService> _log;

        public ShurjoPayService(
            ShurjoPayOptions opt,
            IHttpClientFactory httpFactory,
            ILogger<ShurjoPayService> log)
        {
            _opt         = opt;
            _httpFactory = httpFactory;
            _log         = log;
        }

        // ── Step-1: get token ──────────────────────────────────────────────────
        private async Task<SpTokenResponse?> GetTokenAsync()
        {
            var client = _httpFactory.CreateClient("ShurjoPay");
            var body   = new { username = _opt.Username, password = _opt.Password };
            var json   = JsonSerializer.Serialize(body);
            var resp   = await client.PostAsync(
                "/api/get_token",
                new StringContent(json, Encoding.UTF8, "application/json"));

            var raw = await resp.Content.ReadAsStringAsync();
            _log.LogDebug("[ShurjoPay] GetToken response: {raw}", raw);

            if (!resp.IsSuccessStatusCode)
            {
                _log.LogWarning("[ShurjoPay] GetToken failed HTTP {code}: {body}", (int)resp.StatusCode, Truncate(raw));
                return null;
            }

            if (!TryParseJson(raw, out var doc))
            {
                _log.LogWarning("[ShurjoPay] GetToken returned non-JSON: {body}", Truncate(raw));
                return null;
            }

            using (doc)
            {
                var root = doc.RootElement;
                return new SpTokenResponse
                {
                    Token      = root.TryGetProperty("token",         out var t) ? GetStringValue(t) : "",
                    StoreId    = root.TryGetProperty("store_id",      out var s) ? GetStringValue(s) : "",
                    ExecuteUrl = root.TryGetProperty("execute_url",   out var e) ? GetStringValue(e) : "",
                    SpCode     = root.TryGetProperty("sp_code",       out var c) ? GetStringValue(c) : "",
                    SpMessage  = root.TryGetProperty("message",       out var m) ? GetStringValue(m) : "",
                };
            }
        }

        // ── Step-2: create checkout ────────────────────────────────────────────
        public async Task<SpCheckoutResult> InitiatePaymentAsync(
            int    institutionId,
            string mergedInvoiceIds,
            double amount,
            string customerName,
            string customerEmail,
            string customerPhone,
            string customerAddress)
        {
            try
            {
                var tokenResp = await GetTokenAsync();
                if (tokenResp == null || string.IsNullOrEmpty(tokenResp.Token))
                    return new SpCheckoutResult { Success = false, Message = "ShurjoPay token অর্জন করা সম্ভব হয়নি।" };

                var client  = _httpFactory.CreateClient("ShurjoPay");
                var orderId = $"ITG-{institutionId}-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";

                var payload = new
                {
                    prefix           = "ITG",
                    token            = tokenResp.Token,
                    return_url       = _opt.ReturnUrl,
                    cancel_url       = _opt.CancelUrl,
                    store_id         = tokenResp.StoreId,
                    amount           = amount,
                    order_id         = orderId,
                    currency         = "BDT",
                    customer_name    = customerName,
                    customer_email   = string.IsNullOrWhiteSpace(customerEmail) ? "noreply@tailorbd.com" : customerEmail,
                    customer_phone   = customerPhone,
                    customer_address = customerAddress,
                    customer_city    = "Dhaka",
                    customer_state   = "Dhaka",
                    customer_postcode = "1000",
                    customer_country = "Bangladesh",
                    client_ip        = string.IsNullOrWhiteSpace(_opt.ClientIp) ? "127.0.0.1" : _opt.ClientIp,
                    value1           = institutionId.ToString(),
                    value2           = mergedInvoiceIds,
                    value3           = "TailorBD Invoice",
                    value4           = ""
                };

                var json = JsonSerializer.Serialize(payload);
                client.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", tokenResp.Token);

                var executeUrl = string.IsNullOrEmpty(tokenResp.ExecuteUrl)
                    ? $"{_opt.BaseUrl}/api/secret-pay"
                    : tokenResp.ExecuteUrl;

                var resp = await client.PostAsync(
                    executeUrl,
                    new StringContent(json, Encoding.UTF8, "application/json"));

                var raw = await resp.Content.ReadAsStringAsync();
                _log.LogDebug("[ShurjoPay] SecretPay response: {raw}", raw);

                if (!resp.IsSuccessStatusCode)
                    return new SpCheckoutResult { Success = false, Message = $"ShurjoPay Error ({(int)resp.StatusCode}): {Truncate(raw)}" };

                if (!TryParseJson(raw, out var doc))
                    return new SpCheckoutResult { Success = false, Message = $"ShurjoPay অবৈধ response: {Truncate(raw)}" };

                using (doc)
                {
                    var root = doc.RootElement;

                    var checkoutUrl = root.TryGetProperty("checkout_url", out var cu) ? GetStringValue(cu) : "";
                    var spOrderId   = root.TryGetProperty("sp_order_id",  out var so) ? GetStringValue(so) : "";

                    if (string.IsNullOrEmpty(checkoutUrl))
                        return new SpCheckoutResult { Success = false, Message = "checkout_url পাওয়া যায়নি।" };

                    return new SpCheckoutResult
                    {
                        Success     = true,
                        CheckoutUrl = checkoutUrl,
                        OrderId     = spOrderId.Length > 0 ? spOrderId : orderId
                    };
                }
            }
            catch (Exception ex)
            {
                _log.LogError(ex, "[ShurjoPay] InitiatePayment error");
                return new SpCheckoutResult { Success = false, Message = ex.Message };
            }
        }

        // ── Step-3: verify payment ─────────────────────────────────────────────
        public async Task<SpVerifyResult> VerifyPaymentAsync(string orderId)
        {
            try
            {
                var tokenResp = await GetTokenAsync();
                if (tokenResp == null || string.IsNullOrEmpty(tokenResp.Token))
                    return new SpVerifyResult { Success = false, Message = "Token error" };

                var client = _httpFactory.CreateClient("ShurjoPay");
                client.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", tokenResp.Token);

                var body = new { order_id = orderId };
                var json = JsonSerializer.Serialize(body);
                var resp = await client.PostAsync(
                    "/api/verification",
                    new StringContent(json, Encoding.UTF8, "application/json"));

                var raw = await resp.Content.ReadAsStringAsync();
                _log.LogDebug("[ShurjoPay] Verify response: {raw}", raw);

                if (!TryParseJson(raw, out var doc))
                    return new SpVerifyResult { Success = false, Message = $"ShurjoPay অবৈধ verify response: {Truncate(raw)}" };

                using (doc)
                {

                // ShurjoPay returns array
                var elem = doc.RootElement.ValueKind == JsonValueKind.Array
                    ? doc.RootElement[0]
                    : doc.RootElement;

                var spStatus = elem.TryGetProperty("sp_message",  out var sm) ? GetStringValue(sm) : "";
                var txId     = elem.TryGetProperty("bank_trx_id", out var bt) ? GetStringValue(bt) : "";
                if (string.IsNullOrEmpty(txId))
                    txId = elem.TryGetProperty("id", out var id) ? GetStringValue(id) : "";

                var payStatus = elem.TryGetProperty("transaction_status", out var ts)
                    ? GetStringValue(ts)
                    : (elem.TryGetProperty("sp_code", out var sc) && (GetStringValue(sc) == "1000") ? "Completed" : "Failed");

                double amt = 0;
                if (elem.TryGetProperty("amount", out var amProp))
                    amt = amProp.ValueKind == JsonValueKind.Number ? amProp.GetDouble()
                        : double.TryParse(amProp.GetString(), out var da) ? da : 0;

                var isSuccess = payStatus == "Completed"
                    || payStatus == "Paid"
                    || spStatus  == "Paid Successfully"
                    || spStatus  == "Success";

                return new SpVerifyResult
                {
                    Success       = isSuccess,
                    SpOrderId     = orderId,
                    SpTxnId       = txId,
                    PaymentStatus = isSuccess ? "Completed" : payStatus,
                    Amount        = amt,
                    Message       = spStatus,
                    RawJson       = raw
                };
                }
            }
            catch (Exception ex)
            {
                _log.LogError(ex, "[ShurjoPay] Verify error");
                return new SpVerifyResult { Success = false, Message = ex.Message };
            }
        }

        // ── Safe helper: returns string regardless of JsonValueKind ────────────
        private static string GetStringValue(JsonElement el)
        {
            return el.ValueKind switch
            {
                JsonValueKind.String => el.GetString() ?? "",
                JsonValueKind.Number => el.GetRawText(),
                JsonValueKind.True   => "true",
                JsonValueKind.False  => "false",
                JsonValueKind.Null   => "",
                _                   => el.GetRawText()
            };
        }

        private static bool TryParseJson(string raw, out JsonDocument doc)
        {
            doc = null!;
            if (string.IsNullOrWhiteSpace(raw)) return false;
            try
            {
                doc = JsonDocument.Parse(raw);
                return true;
            }
            catch (JsonException)
            {
                return false;
            }
        }

        private static string Truncate(string s, int max = 200)
            => string.IsNullOrEmpty(s) ? "" : s.Length <= max ? s : s[..max] + "…";
    }
}
