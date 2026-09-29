/* Shop Page Access - 02_create.sql  (creates one new table; safe to run again)
   dbo.ShopPageBlock = pages the Authority switched OFF for a shop (DENY list).
   No rows for a shop = the shop has every page. New shops and new pages need no rows. */
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID(N'dbo.ShopPageBlock', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ShopPageBlock
    (
        ID            INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ShopPageBlock PRIMARY KEY,
        InstitutionID INT               NOT NULL,
        PageKey       NVARCHAR(100)     NOT NULL,   -- e.g. '/cutting-issue.html'
        BlockedBy     INT               NULL,       -- RegistrationID of the Authority who switched it off
        BlockedDate   DATETIME          NOT NULL CONSTRAINT DF_ShopPageBlock_BlockedDate DEFAULT (GETDATE()),
        CONSTRAINT UQ_ShopPageBlock UNIQUE (InstitutionID, PageKey)
    );
    PRINT 'dbo.ShopPageBlock created.';
END
ELSE
    PRINT 'dbo.ShopPageBlock already exists - nothing to do.';
