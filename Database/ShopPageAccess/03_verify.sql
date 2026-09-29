/* Shop Page Access - 03_verify.sql  (READ-ONLY) - run after 02_create.sql */
SET NOCOUNT ON;

IF OBJECT_ID(N'dbo.ShopPageBlock', N'U') IS NULL
BEGIN
    PRINT 'FAIL: dbo.ShopPageBlock does not exist. Run 02_create.sql.';
    RETURN;
END

SELECT c.column_id, c.name AS ColumnName, TYPE_NAME(c.user_type_id) AS DataType, c.max_length, c.is_nullable, c.is_identity
FROM sys.columns c WHERE c.object_id = OBJECT_ID(N'dbo.ShopPageBlock') ORDER BY c.column_id;

SELECT kc.name AS ConstraintName, kc.type_desc
FROM sys.key_constraints kc WHERE kc.parent_object_id = OBJECT_ID(N'dbo.ShopPageBlock');

SELECT CASE WHEN COUNT(*) = 5 THEN 'OK: 5 columns' ELSE 'FAIL: expected 5 columns' END AS ColumnCheck
FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.ShopPageBlock');
SELECT CASE WHEN EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'UQ_ShopPageBlock') THEN 'OK: UQ_ShopPageBlock' ELSE 'FAIL: UQ_ShopPageBlock missing' END AS UniqueCheck;

EXEC (N'SELECT b.InstitutionID, i.InstitutionName, COUNT(*) AS BlockedPages, MAX(b.BlockedDate) AS LastChange
        FROM dbo.ShopPageBlock b LEFT JOIN dbo.Institution i ON i.InstitutionID = b.InstitutionID
        GROUP BY b.InstitutionID, i.InstitutionName ORDER BY b.InstitutionID;');
