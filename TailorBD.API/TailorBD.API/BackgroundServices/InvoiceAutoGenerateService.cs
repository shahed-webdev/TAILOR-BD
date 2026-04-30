using TailorBD.API.Services;

namespace TailorBD.API.BackgroundServices
{
    /// <summary>
    /// Runs once a day (at 00:05 AM) and auto-generates renewal invoices
    /// for all institutions whose Expire_Date has passed.
    /// </summary>
    public class InvoiceAutoGenerateService : BackgroundService
    {
        private readonly IServiceProvider _services;
        private readonly ILogger<InvoiceAutoGenerateService> _logger;

        // Run at 00:05 every day
        private static readonly TimeSpan _runAt = new(0, 5, 0);

        public InvoiceAutoGenerateService(
            IServiceProvider services,
            ILogger<InvoiceAutoGenerateService> logger)
        {
            _services = services;
            _logger   = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("InvoiceAutoGenerateService started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                var delay = CalculateDelay();
                _logger.LogInformation("Next auto-generate run in: {Delay}", delay);
                await Task.Delay(delay, stoppingToken);

                if (stoppingToken.IsCancellationRequested) break;

                await RunAsync(stoppingToken);
            }
        }

        private async Task RunAsync(CancellationToken ct)
        {
            _logger.LogInformation("Auto-invoice generation triggered at {Time}", DateTime.Now);
            try
            {
                using var scope  = _services.CreateScope();
                var billing      = scope.ServiceProvider.GetRequiredService<IInvoiceBillingService>();
                var result       = await billing.AutoGenerateForAllDueInstitutionsAsync();

                _logger.LogInformation(
                    "Auto-invoice done — Generated: {G}, Skipped: {S}, Errors: {E}",
                    result.Generated, result.Skipped, result.Errors);

                foreach (var err in result.ErrorDetails)
                    _logger.LogWarning("AutoInvoice error: {E}", err);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled error in InvoiceAutoGenerateService");
            }
        }

        private static TimeSpan CalculateDelay()
        {
            var now     = DateTime.Now;
            var nextRun = now.Date.Add(_runAt);
            if (nextRun <= now)
                nextRun = nextRun.AddDays(1); // already past today's run-time
            return nextRun - now;
        }
    }
}
