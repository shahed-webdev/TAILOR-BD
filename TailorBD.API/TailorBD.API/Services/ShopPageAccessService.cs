using System.Data.SqlClient;
using Dapper;
using Microsoft.Extensions.Caching.Memory;
using TailorBD.API.Data;
using TailorBD.API.Helpers;

namespace TailorBD.API.Services
{
    /// <summary>
    /// Reads / writes the per-shop page DENY list (table dbo.ShopPageBlock, one row per blocked page).
    /// No rows = full access. Results are cached for a short time per shop and the cache is cleared
    /// when the Authority saves. If the table has not been created yet (Database\ShopPageAccess\02_create.sql
    /// not run) every shop simply has full access.
    /// </summary>
    public sealed class ShopPageAccessService
    {
        private const string CachePrefix = "shop_page_block_";
        private static readonly TimeSpan CacheFor = TimeSpan.FromSeconds(60);

        private readonly TailorBdContext _db;
        private readonly IMemoryCache _cache;
        private readonly ILogger<ShopPageAccessService> _log;

        public ShopPageAccessService(TailorBdContext db, IMemoryCache cache, ILogger<ShopPageAccessService> log)
        {
            _db = db;
            _cache = cache;
            _log = log;
        }

        /// <summary>Blocked menu page keys stored for the shop (only keys that still exist in the catalog).</summary>
        public async Task<IReadOnlyList<string>> GetBlockedAsync(int institutionId)
        {
            if (institutionId <= 0) return Array.Empty<string>();
            if (_cache.TryGetValue(CachePrefix + institutionId, out IReadOnlyList<string>? cached) && cached != null)
                return cached;
            try
            {
                using var con = _db.CreateConnection();
                var rows = (await con.QueryAsync<string>(
                    "SELECT PageKey FROM dbo.ShopPageBlock WHERE InstitutionID = @I", new { I = institutionId })).ToList();
                return Remember(institutionId, rows);
            }
            catch (SqlException ex) when (ex.Number == 208) // table not created yet => full access
            {
                return Remember(institutionId, new List<string>());
            }
            catch (Exception ex)
            {
                _log.LogError(ex, "Could not read ShopPageBlock for institution {Institution}", institutionId);
                return Array.Empty<string>(); // not cached: try again next request
            }
        }

        /// <summary>Same as GetBlockedAsync for synchronous callers (AccessController).</summary>
        public IReadOnlyList<string> GetBlocked(int institutionId)
        {
            if (institutionId <= 0) return Array.Empty<string>();
            if (_cache.TryGetValue(CachePrefix + institutionId, out IReadOnlyList<string>? cached) && cached != null)
                return cached;
            try
            {
                using var con = _db.CreateConnection();
                var rows = con.Query<string>(
                    "SELECT PageKey FROM dbo.ShopPageBlock WHERE InstitutionID = @I", new { I = institutionId }).ToList();
                return Remember(institutionId, rows);
            }
            catch (SqlException ex) when (ex.Number == 208)
            {
                return Remember(institutionId, new List<string>());
            }
            catch (Exception ex)
            {
                _log.LogError(ex, "Could not read ShopPageBlock for institution {Institution}", institutionId);
                return Array.Empty<string>();
            }
        }

        /// <summary>Every page URL refused for the shop (blocked pages + aliases + dependent pages).</summary>
        public async Task<HashSet<string>> GetEffectiveBlockedAsync(int institutionId)
            => ShopPageCatalog.Effective(await GetBlockedAsync(institutionId));

        public HashSet<string> GetEffectiveBlocked(int institutionId)
            => ShopPageCatalog.Effective(GetBlocked(institutionId));

        /// <summary>True when every one of the given pages is blocked for the shop (API groups used by several pages).</summary>
        public async Task<bool> AllBlockedAsync(int institutionId, IReadOnlyCollection<string> pages)
        {
            if (pages.Count == 0) return false;
            var blocked = await GetEffectiveBlockedAsync(institutionId);
            return blocked.Count > 0 && pages.All(p => blocked.Contains(ShopPageCatalog.Normalize(p)));
        }

        public async Task<bool> TableExistsAsync()
        {
            using var con = _db.CreateConnection();
            return await con.ExecuteScalarAsync<int>("SELECT CASE WHEN OBJECT_ID('dbo.ShopPageBlock', 'U') IS NULL THEN 0 ELSE 1 END") == 1;
        }

        /// <summary>Replaces the shop's deny list (keys must be catalog keys; caller validates).</summary>
        public async Task SaveAsync(int institutionId, IReadOnlyCollection<string> blockedKeys, int changedBy)
        {
            using var con = _db.CreateConnection();
            con.Open();
            using var tx = con.BeginTransaction();
            await con.ExecuteAsync("DELETE FROM dbo.ShopPageBlock WHERE InstitutionID = @I", new { I = institutionId }, tx);
            foreach (var key in blockedKeys)
            {
                await con.ExecuteAsync(
                    "INSERT INTO dbo.ShopPageBlock (InstitutionID, PageKey, BlockedBy) VALUES (@I, @K, @B)",
                    new { I = institutionId, K = key, B = changedBy > 0 ? changedBy : (int?)null }, tx);
            }
            tx.Commit();
            Invalidate(institutionId);
        }

        public void Invalidate(int institutionId) => _cache.Remove(CachePrefix + institutionId);

        private IReadOnlyList<string> Remember(int institutionId, List<string> rows)
        {
            IReadOnlyList<string> list = rows
                .Select(ShopPageCatalog.Normalize)
                .Where(k => ShopPageCatalog.BlockableKeys.Contains(k))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
            _cache.Set(CachePrefix + institutionId, list, CacheFor);
            return list;
        }
    }
}
