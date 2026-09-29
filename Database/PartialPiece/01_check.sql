/* ============================================================================
   PartialPiece 01_check.sql  —  READ-ONLY pre-check (changes nothing)
   Run in SSMS against the TailorBD database before 02_add_column.sql.
   ============================================================================ */
SET NOCOUNT ON;
PRINT '--- 1. FactoryIssue table and the new column ---';
SELECT DB_NAME() AS [Database],
       CASE WHEN OBJECT_ID('dbo.FactoryIssue', 'U') IS NULL THEN 'MISSING (run Create_Cutting_Factory_Issue_Tables.sql first)' ELSE 'ok' END AS FactoryIssueTable,
       CASE WHEN COL_LENGTH('dbo.FactoryIssue', 'CompletedQuantity') IS NULL THEN 'not yet added (02_add_column.sql will add it)' ELSE 'already exists' END AS CompletedQuantityColumn,
       CASE WHEN COL_LENGTH('dbo.FactoryIssue', 'EarnedAmount') IS NULL THEN 'MISSING (run Add_Dress_Costs_Worker_Balance.sql first)' ELSE 'ok' END AS EarnedAmountColumn;

IF OBJECT_ID('dbo.FactoryIssue', 'U') IS NOT NULL
BEGIN
    PRINT '--- 2. Assignments by status (02 will set CompletedQuantity = Quantity for the Completed ones) ---';
    SELECT Status, COUNT(*) AS Assignments, SUM(Quantity) AS Pieces,
           SUM(CASE WHEN Quantity > 1 THEN 1 ELSE 0 END) AS WithMoreThanOnePiece
    FROM dbo.FactoryIssue GROUP BY Status ORDER BY Status;

    PRINT '--- 3. Rows that would break the new check (Quantity < 0) — expected: 0 ---';
    SELECT COUNT(*) AS BadQuantityRows FROM dbo.FactoryIssue WHERE Quantity < 0;

    PRINT '--- 4. Constraints already present with the names 02 uses — expected: none before the first run ---';
    SELECT name, type_desc FROM sys.objects
    WHERE name IN ('DF_FactoryIssue_CompletedQty', 'CK_FactoryIssue_CompletedQty');
END
