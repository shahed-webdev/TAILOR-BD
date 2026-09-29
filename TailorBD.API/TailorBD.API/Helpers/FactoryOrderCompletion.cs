using System.Data;
using Dapper;

namespace TailorBD.API.Helpers
{
    /// <summary>
    /// "সেলাই সম্পন্ন" on the factory-issue page → order work completion, piece by piece.
    ///
    /// Each time pieces of a factory assignment are submitted, the same number of pieces
    /// (at most what the dress line still needs) is recorded as work-complete for that line with
    /// exactly the statements DeliveryController.CompleteWork (/incomplete-works "কাজ সম্পূর্ণ করুন")
    /// uses, SMS off: [Order] StoreDatails/Details kept as they are (NULL -> ''), WorkCompleteQuantity
    /// NULL -> 0, then one Order_WorkComplete_Date row. That table's existing triggers raise
    /// OrderList.WorkCompleteQuantity and set [Order].Update_WorkDate / WorkStatus
    /// (PartlyCompleted, or Completed when every line is done), which is what moves the order to
    /// the delivery list and, when complete, out of /incomplete-works.
    /// No SMS is sent and nothing is written to the SMS tables here.
    /// </summary>
    public static class FactoryOrderCompletion
    {
        public sealed class Progress
        {
            public int OrderId { get; set; }
            public int OrderSerialNumber { get; set; }
            public int Total { get; set; }
            public int Done { get; set; }
            public string WorkStatus { get; set; } = "";
            public bool CompletedNow { get; set; }
        }

        /// <summary>
        /// Serialises factory completions per order: call first in the transaction, before touching
        /// FactoryIssue rows (ascending OrderID, so two bulk requests cannot deadlock).
        /// Returns OrderID -> WorkStatus before the change.
        /// </summary>
        public static Dictionary<int, string> LockOrders(IDbConnection con, IDbTransaction tx, int institutionId, IEnumerable<int> orderIds)
        {
            var before = new Dictionary<int, string>();
            foreach (var id in orderIds.Where(i => i > 0).Distinct().OrderBy(i => i))
                before[id] = con.ExecuteScalar<string?>(
                    "SELECT ISNULL(WorkStatus, N'') FROM [Order] WITH (UPDLOCK, ROWLOCK) WHERE OrderID = @OrderID AND InstitutionID = @InstitutionID",
                    new { OrderID = id, InstitutionID = institutionId }, tx) ?? "";
            return before;
        }

        /// <summary>
        /// Record <paramref name="pieces"/> pieces of one dress line as work-complete (capped at what the
        /// line still needs). Returns the quantity written (0 if the line was already complete).
        /// <paramref name="orderTouched"/> tracks orders whose [Order] row got the CompleteWork update.
        /// </summary>
        public static int RecordPieces(IDbConnection con, IDbTransaction tx, int institutionId, int registrationId,
                                       int orderId, int orderListId, int pieces, HashSet<int> orderTouched)
        {
            if (pieces <= 0) return 0;
            var remaining = con.ExecuteScalar<int?>(@"
                SELECT ISNULL(DressQuantity, 0) - ISNULL(WorkCompleteQuantity, 0)
                FROM OrderList
                WHERE OrderListID = @OrderListID AND OrderID = @OrderID AND InstitutionID = @InstitutionID",
                new { OrderListID = orderListId, OrderID = orderId, InstitutionID = institutionId }, tx) ?? 0;
            var wc = Math.Min(pieces, remaining);
            if (wc <= 0) return 0;

            // ---- same statements as DeliveryController.CompleteWork, SMS off ----
            if (orderTouched.Add(orderId))
                con.Execute(
                    "UPDATE [Order] SET StoreDatails = ISNULL(StoreDatails, N''), Details = ISNULL(Details, N'') WHERE (OrderID = @OrderID) AND InstitutionID = @InstitutionID",
                    new { OrderID = orderId, InstitutionID = institutionId }, tx);
            // Trigger uses += on WorkCompleteQuantity; NULL breaks the update.
            con.Execute(
                "UPDATE OrderList SET WorkCompleteQuantity = 0 WHERE OrderListID = @OrderListID AND WorkCompleteQuantity IS NULL",
                new { OrderListID = orderListId }, tx);
            // one row per statement: the table's triggers are single-row
            con.Execute(
                "INSERT INTO Order_WorkComplete_Date(InstitutionID, RegistrationID, OrderID, OrderListID, WCQuantity) " +
                "VALUES (@InstitutionID, @RegistrationID, @OrderID, @OrderListID, @WCQuantity)",
                new { InstitutionID = institutionId, RegistrationID = registrationId, OrderID = orderId, OrderListID = orderListId, WCQuantity = wc }, tx);
            return wc;
        }

        /// <summary>Dress lines of the order: total / done (nothing left to sew), and WorkStatus now.</summary>
        public static Progress GetProgress(IDbConnection con, IDbTransaction tx, int institutionId, int orderId, string workStatusBefore)
        {
            var p = con.QueryFirstOrDefault<Progress>(@"
                SELECT O.OrderID AS OrderId, ISNULL(O.OrderSerialNumber, 0) AS OrderSerialNumber, ISNULL(O.WorkStatus, N'') AS WorkStatus,
                       (SELECT COUNT(1) FROM OrderList X WHERE X.OrderID = O.OrderID AND X.InstitutionID = O.InstitutionID) AS Total,
                       (SELECT COUNT(1) FROM OrderList X WHERE X.OrderID = O.OrderID AND X.InstitutionID = O.InstitutionID
                                AND ISNULL(X.DressQuantity, 0) - ISNULL(X.WorkCompleteQuantity, 0) <= 0) AS Done
                FROM [Order] O
                WHERE O.OrderID = @OrderID AND O.InstitutionID = @InstitutionID",
                new { OrderID = orderId, InstitutionID = institutionId }, tx) ?? new Progress { OrderId = orderId };
            p.CompletedNow = string.Equals(p.WorkStatus, "Completed", StringComparison.OrdinalIgnoreCase)
                          && !string.Equals(workStatusBefore, "Completed", StringComparison.OrdinalIgnoreCase);
            return p;
        }
    }
}
