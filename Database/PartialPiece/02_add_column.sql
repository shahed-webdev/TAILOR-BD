/* ============================================================================
   PartialPiece 02_add_column.sql  —  adds FactoryIssue.CompletedQuantity
   Idempotent: safe to run more than once. Run 01_check.sql first, 03_verify.sql after.
   - CompletedQuantity INT NOT NULL, default 0 (constraint DF_FactoryIssue_CompletedQty)
   - check 0 <= CompletedQuantity <= Quantity (constraint CK_FactoryIssue_CompletedQty)
   - backfill: assignments already Completed get CompletedQuantity = Quantity
   The app detects the column by itself (no restart needed); before this script runs,
   "সেলাই সম্পন্ন" works the old way (whole assignment at once, no partial pieces).
   ============================================================================ */
SET NOCOUNT ON;
SET XACT_ABORT ON;
IF OBJECT_ID('dbo.FactoryIssue', 'U') IS NULL
BEGIN
    RAISERROR('dbo.FactoryIssue does not exist — run Create_Cutting_Factory_Issue_Tables.sql first.', 16, 1);
    RETURN;
END
GO
BEGIN TRANSACTION;
IF COL_LENGTH('dbo.FactoryIssue', 'CompletedQuantity') IS NULL
BEGIN
    ALTER TABLE dbo.FactoryIssue
        ADD CompletedQuantity INT NOT NULL CONSTRAINT DF_FactoryIssue_CompletedQty DEFAULT (0);
    PRINT 'FactoryIssue.CompletedQuantity added';
END
ELSE PRINT 'FactoryIssue.CompletedQuantity already exists';
COMMIT;
GO
SET XACT_ABORT ON;
BEGIN TRANSACTION;
-- backfill (also repairs rows completed by an older app build after the column was added)
UPDATE dbo.FactoryIssue
SET CompletedQuantity = Quantity
WHERE Status = N'Completed' AND CompletedQuantity <> Quantity;
PRINT CONCAT('Backfilled Completed assignments: ', @@ROWCOUNT);

IF OBJECT_ID('dbo.CK_FactoryIssue_CompletedQty', 'C') IS NULL
BEGIN
    ALTER TABLE dbo.FactoryIssue WITH CHECK
        ADD CONSTRAINT CK_FactoryIssue_CompletedQty CHECK (CompletedQuantity >= 0 AND CompletedQuantity <= Quantity);
    PRINT 'CK_FactoryIssue_CompletedQty added';
END
ELSE PRINT 'CK_FactoryIssue_CompletedQty already exists';
COMMIT;
GO
