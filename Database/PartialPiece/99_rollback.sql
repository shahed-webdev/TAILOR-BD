/* ============================================================================
   PartialPiece 99_rollback.sql  —  removes FactoryIssue.CompletedQuantity again
   SAFETY: refuses to run while any assignment is PARTLY submitted (Status 'Assigned' with
   CompletedQuantity > 0). Without the column the app would treat such a row as not started,
   and the next "সেলাই সম্পন্ন" would pay the artisan for ALL its pieces again. Finish those
   assignments first (the list is printed), then run this again.
   Deploy the previous app build (or restart the app) after running this; the app re-checks
   the column every 30 seconds.
   ============================================================================ */
SET NOCOUNT ON;
SET XACT_ABORT ON;
IF COL_LENGTH('dbo.FactoryIssue', 'CompletedQuantity') IS NULL
BEGIN
    PRINT 'Nothing to do: FactoryIssue.CompletedQuantity does not exist.';
    RETURN;
END
DECLARE @partial INT;
EXEC sp_executesql N'SELECT @c = COUNT(*) FROM dbo.FactoryIssue WHERE Status = N''Assigned'' AND CompletedQuantity > 0', N'@c INT OUTPUT', @c = @partial OUTPUT;
IF @partial > 0
BEGIN
    EXEC(N'SELECT FactoryIssueID, InstitutionID, OrderID, OrderListID, ArtisanID, Quantity, CompletedQuantity, EarnedAmount
           FROM dbo.FactoryIssue WHERE Status = N''Assigned'' AND CompletedQuantity > 0 ORDER BY InstitutionID, FactoryIssueID;');
    RAISERROR('Rollback stopped: %d assignment(s) are partly submitted (listed above). Finish them first.', 16, 1, @partial);
    RETURN;
END
BEGIN TRANSACTION;
IF OBJECT_ID('dbo.CK_FactoryIssue_CompletedQty', 'C') IS NOT NULL
    ALTER TABLE dbo.FactoryIssue DROP CONSTRAINT CK_FactoryIssue_CompletedQty;
IF OBJECT_ID('dbo.DF_FactoryIssue_CompletedQty', 'D') IS NOT NULL
    ALTER TABLE dbo.FactoryIssue DROP CONSTRAINT DF_FactoryIssue_CompletedQty;
ALTER TABLE dbo.FactoryIssue DROP COLUMN CompletedQuantity;
COMMIT;
PRINT 'FactoryIssue.CompletedQuantity removed.';
