using System.Data;
using Dapper;

namespace TailorBD.API.Helpers
{
    /// <summary>
    /// Piece-wise factory completion needs the column FactoryIssue.CompletedQuantity
    /// (Database\PartialPiece\02_add_column.sql). Until that script has been run the code works
    /// the old way: "সেলাই সম্পন্ন" completes the whole assignment at once, no partial pieces.
    /// The check is cheap (COL_LENGTH): while the column is missing it runs on every call, so
    /// running the script needs no app restart; once found it is re-checked every 30 s
    /// (so 99_rollback.sql is picked up too, see the rollback notes).
    /// </summary>
    public static class FactoryPieces
    {
        private static volatile bool _has;
        private static long _checkedAtTicks;

        public static bool HasCompletedQuantity(IDbConnection con, IDbTransaction? tx = null)
        {
            var now = DateTime.UtcNow.Ticks;
            if (_has && now - Interlocked.Read(ref _checkedAtTicks) < TimeSpan.TicksPerSecond * 30)
                return true;
            var len = con.ExecuteScalar<int?>("SELECT COL_LENGTH('dbo.FactoryIssue', 'CompletedQuantity')", transaction: tx);
            _has = len != null;
            Interlocked.Exchange(ref _checkedAtTicks, now);
            return _has;
        }

        /// <summary>
        /// SQL for "pieces done" of a FactoryIssue row (alias a). A Completed row always counts its whole
        /// Quantity (also rows completed by an older build after the column was added, CompletedQuantity 0).
        /// </summary>
        public static string DoneExpr(bool hasColumn, string a) => hasColumn
            ? $"(CASE WHEN {a}.Status = N'Completed' AND {a}.CompletedQuantity < {a}.Quantity THEN {a}.Quantity ELSE {a}.CompletedQuantity END)"
            : $"(CASE WHEN {a}.Status = N'Completed' THEN {a}.Quantity ELSE 0 END)";
    }
}
