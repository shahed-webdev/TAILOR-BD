/* ============================================================================
   PartialPiece 05_catchup_OPTIONAL.sql  —  OPTIONAL, WRITES DATA. NOT part of the upgrade.
   Only if you decide to: records the pieces of the lines listed by 04_report_old_orders.sql as
   work-complete, the same way /incomplete-works "কাজ সম্পূর্ণ করুন" does (one
   Order_WorkComplete_Date row per line; the existing triggers update OrderList / [Order]).
   No SMS is sent. Orders whose every line is then done become Completed (delivery list).
   Default is a DRY RUN (@DryRun = 1): it only lists what it would write and rolls back.
   Set @DryRun = 0 to really write. Take a backup first.
   ============================================================================ */
SET NOCOUNT ON;
SET XACT_ABORT ON;
DECLARE @DryRun BIT = 1;             -- 1 = list only, 0 = write
DECLARE @InstitutionID INT = NULL;   -- NULL = all shops, or one shop

DECLARE @Lines TABLE (RowNo INT IDENTITY PRIMARY KEY, InstitutionID INT, RegistrationID INT, OrderID INT, OrderListID INT, Qty INT, OrderNo INT);
INSERT @Lines (InstitutionID, RegistrationID, OrderID, OrderListID, Qty, OrderNo)
-- one row per dress line (a line can have several Completed assignments).
-- Pieces = factory pieces marked done but not yet recorded (SUM of Completed assignment pieces - WorkCompleteQuantity),
-- never more than the line's open pieces. Lines already recorded by the new per-piece code give 0 and are skipped.
SELECT F.InstitutionID, F.RegistrationID, OL.OrderID, OL.OrderListID,
       CASE WHEN F.Pieces - ISNULL(OL.WorkCompleteQuantity, 0) < OL.DressQuantity - ISNULL(OL.WorkCompleteQuantity, 0)
            THEN F.Pieces - ISNULL(OL.WorkCompleteQuantity, 0)
            ELSE OL.DressQuantity - ISNULL(OL.WorkCompleteQuantity, 0) END,
       O.OrderSerialNumber
FROM (SELECT FI.InstitutionID, FI.OrderListID, MAX(FI.RegistrationID) AS RegistrationID, SUM(FI.Quantity) AS Pieces
      FROM dbo.FactoryIssue FI
      WHERE FI.Status = N'Completed' AND (@InstitutionID IS NULL OR FI.InstitutionID = @InstitutionID)
      GROUP BY FI.InstitutionID, FI.OrderListID) F
JOIN dbo.OrderList OL ON OL.OrderListID = F.OrderListID AND OL.InstitutionID = F.InstitutionID
JOIN dbo.[Order] O ON O.OrderID = OL.OrderID
WHERE OL.DressQuantity - ISNULL(OL.WorkCompleteQuantity, 0) > 0
  AND F.Pieces > ISNULL(OL.WorkCompleteQuantity, 0)
  AND O.WorkStatus IN (N'incomplete', N'PartlyCompleted')
  AND O.DeliveryStatus IN (N'Pending', N'PartlyDelivered')
ORDER BY OL.OrderID, OL.OrderListID;

SELECT OrderNo, OrderID, OrderListID, Qty AS PiecesToRecord FROM @Lines ORDER BY RowNo;

BEGIN TRANSACTION;
DECLARE @i INT = 1, @n INT = (SELECT COUNT(*) FROM @Lines);
DECLARE @inst INT, @reg INT, @oid INT, @olid INT, @qty INT;
WHILE @i <= @n
BEGIN
    SELECT @inst = InstitutionID, @reg = RegistrationID, @oid = OrderID, @olid = OrderListID, @qty = Qty FROM @Lines WHERE RowNo = @i;
    UPDATE dbo.[Order] SET StoreDatails = ISNULL(StoreDatails, N''), Details = ISNULL(Details, N'') WHERE OrderID = @oid AND InstitutionID = @inst;
    UPDATE dbo.OrderList SET WorkCompleteQuantity = 0 WHERE OrderListID = @olid AND WorkCompleteQuantity IS NULL;
    -- one row per statement: the table's triggers are single-row
    INSERT INTO dbo.Order_WorkComplete_Date (InstitutionID, RegistrationID, OrderID, OrderListID, WCQuantity)
    VALUES (@inst, @reg, @oid, @olid, @qty);
    SET @i += 1;
END
IF @DryRun = 1
BEGIN
    ROLLBACK;
    PRINT CONCAT('DRY RUN: ', @n, ' line(s) would be recorded. Nothing was written. Set @DryRun = 0 to write.');
END
ELSE
BEGIN
    COMMIT;
    PRINT CONCAT(@n, ' line(s) recorded as work-complete.');
END
