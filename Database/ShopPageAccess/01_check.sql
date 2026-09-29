/* Shop Page Access - 01_check.sql  (READ-ONLY, safe to run any time)
   Shows whether dbo.ShopPageBlock exists and what is in it.
   Run order: 01_check.sql -> 02_create.sql -> 03_verify.sql   (99_rollback.sql = undo) */
SET NOCOUNT ON;

SELECT DB_NAME() AS [Database], @@SERVERNAME AS [Server], GETDATE() AS [CheckedAt];

IF OBJECT_ID(N'dbo.ShopPageBlock', N'U') IS NULL
BEGIN
    PRINT 'dbo.ShopPageBlock does NOT exist yet -> run 02_create.sql. (Until then every shop has every page.)';
    SELECT 'NOT CREATED' AS ShopPageBlock;
END
ELSE
BEGIN
    PRINT 'dbo.ShopPageBlock exists.';
    EXEC (N'SELECT COUNT(*) AS BlockedRows, COUNT(DISTINCT InstitutionID) AS ShopsWithBlockedPages FROM dbo.ShopPageBlock;');
END

/* Needed by the feature (must exist) */
SELECT t.name AS RequiredTable, CASE WHEN OBJECT_ID(N'dbo.' + t.name, N'U') IS NULL THEN 'MISSING' ELSE 'OK' END AS Status
FROM (VALUES (N'Institution'), (N'SubAuthorityPageAccess')) t(name);

SELECT COUNT(*) AS Institutions FROM dbo.Institution;
