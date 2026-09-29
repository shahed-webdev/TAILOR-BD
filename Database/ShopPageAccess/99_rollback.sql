/* Shop Page Access - 99_rollback.sql  (UNDO: drops dbo.ShopPageBlock and every saved block)
   After this every shop has every page again. The app keeps working (missing table = full access). */
SET NOCOUNT ON;

IF OBJECT_ID(N'dbo.ShopPageBlock', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.ShopPageBlock;
    PRINT 'dbo.ShopPageBlock dropped.';
END
ELSE
    PRINT 'dbo.ShopPageBlock does not exist - nothing to do.';
