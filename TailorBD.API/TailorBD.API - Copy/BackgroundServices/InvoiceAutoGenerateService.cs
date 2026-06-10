using TailorBD.API.Services;

namespace TailorBD.API.BackgroundServices
{
    /// <summary>
    /// Runs once a day (at 00:05 AM) and auto-generates renewal invoices
    /// for all institutions whose Expire_Date has passed.
    ///
    /// SERVER RESTART HANDLING:
    /// If the server was down at 00:05 AM (e.g. restarted at 2 AM),
    /// the service will detect the missed run and execute immediately on startup.
    /// </summary>
    public class InvoiceAutoGenerateService : BackgroundService
    {
        private readonly IServiceProvider _services;
        private readonly ILogger<InvoiceAutoGenerateService> _logger;

        // Scheduled run time: 00:05 AM every day
        private static readonly TimeSpan _runAt = new(0, 5, 0);

        // Tracks last run date to prevent running twice on the same day
        private DateTime? _lastRunDate = null;

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

            // --- MISSED RUN RECOVERY ---
            // If the server restarted after the scheduled time today, run immediately.
            var now = DateTime.Now;
            if (now.TimeOfDay >= _runAt && (_lastRunDate == null || _lastRunDate.Value.Date < now.Date))
            {
                _logger.LogInformation(
                    "Missed scheduled run detected (server restart after {RunAt}). Running immediately.", _runAt);
                await RunAsync(stoppingToken);
            }

            while (!stoppingToken.IsCancellationRequested)
            {
                var delay = CalculateDelay();
                _logger.LogInformation("Next auto-generate scheduled in: {Delay}", delay);
                await Task.Delay(delay, stoppingToken);

                if (stoppingToken.IsCancellationRequested) break;

                // Safety guard: never run twice on the same day
                if (_lastRunDate.HasValue && _lastRunDate.Value.Date == DateTime.Today)
                {
                    _logger.LogWarning("Duplicate run prevented for {Date}", DateTime.Today);
                    continue;
                }

                await RunAsync(stoppingToken);
            }
        }

        private async Task RunAsync(CancellationToken ct)
        {
            _logger.LogInformation("Auto-invoice generation started at {Time}", DateTime.Now);
            try
            {
                using var scope = _services.CreateScope();
                var billing     = scope.ServiceProvider.GetRequiredService<IInvoiceBillingService>();
                var result      = await billing.AutoGenerateForAllDueInstitutionsAsync();

                _lastRunDate = DateTime.Today;

                _logger.LogInformation(
                    "Auto-invoice finished. Generated: {G}, Skipped: {S}, Errors: {E}",
                    result.Generated, result.Skipped, result.Errors);

                foreach (var err in result.ErrorDetails)
                    _logger.LogWarning("AutoInvoice error detail: {E}", err);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled error in InvoiceAutoGenerateService.RunAsync");
            }
        }

        /// <summary>
        /// Calculates how long to wait until the next 00:05 AM.
        /// </summary>
        private static TimeSpan CalculateDelay()
        {
            var now     = DateTime.Now;
            var nextRun = now.Date.Add(_runAt);
            if (nextRun <= now)
                nextRun = nextRun.AddDays(1);
            return nextRun - now;
        }
    }
}
