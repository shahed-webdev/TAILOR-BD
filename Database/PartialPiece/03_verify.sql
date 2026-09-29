/* ============================================================================
   PartialPiece 03_verify.sql  —  READ-ONLY, run after 02_add_column.sql
   Every "Expected" line should match.
   ============================================================================ */
SET NOCOUNT ON;
SELECT 'Column exists'                  AS [Check], CASE WHEN COL_LENGTH('dbo.FactoryIssue', 'CompletedQuantity') IS NOT NULL THEN 'OK' ELSE 'FAIL' END AS Result, 'OK' AS Expected
UNION ALL
SELECT 'Column NOT NULL INT',
       CASE WHEN EXISTS (SELECT 1 FROM sys.columns c JOIN sys.types t ON t.user_type_id = c.user_type_id
                         WHERE c.object_id = OBJECT_ID('dbo.FactoryIssue') AND c.name = 'CompletedQuantity' AND t.name = 'int' AND c.is_nullable = 0)
            THEN 'OK' ELSE 'FAIL' END, 'OK'
UNION ALL
SELECT 'Default DF_FactoryIssue_CompletedQty = 0',
       CASE WHEN EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_FactoryIssue_CompletedQty'
                         AND parent_object_id = OBJECT_ID('dbo.FactoryIssue') AND REPLACE(REPLACE(definition, '(', ''), ')', '') = '0')
            THEN 'OK' ELSE 'FAIL' END, 'OK'
UNION ALL
SELECT 'Check CK_FactoryIssue_CompletedQty (trusted)',
       CASE WHEN EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_FactoryIssue_CompletedQty'
                         AND parent_object_id = OBJECT_ID('dbo.FactoryIssue') AND is_not_trusted = 0 AND is_disabled = 0)
            THEN 'OK' ELSE 'FAIL' END, 'OK';
GO
IF COL_LENGTH('dbo.FactoryIssue', 'CompletedQuantity') IS NOT NULL
    EXEC(N'
    SELECT ''Completed rows with CompletedQuantity <> Quantity (re-run 02 if > 0)'' AS [Check], COUNT(*) AS Result, 0 AS Expected
    FROM dbo.FactoryIssue WHERE Status = N''Completed'' AND CompletedQuantity <> Quantity
    UNION ALL
    SELECT ''Assigned rows partly submitted (information)'', COUNT(*), NULL
    FROM dbo.FactoryIssue WHERE Status = N''Assigned'' AND CompletedQuantity > 0;');
