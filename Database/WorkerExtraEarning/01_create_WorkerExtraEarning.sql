/* =============================================================================================
   01_create_WorkerExtraEarning.sql        (idempotent - safe to run again)
   "অন্যান্য পাওনা" (other payments / additional earnings) of artisans (কারিগর) and cutting masters:
   extra design (এক্সট্রা ডিজাইন), alteration (অলটার), other (অন্যান্য).

   * Each row adds its Amount to the worker's Balance (Artisan.Balance / CuttingMaster.Balance) -
     the API does that in the same transaction as the insert / edit / delete; this script changes no balance.
   * The work ledger (api/WorkerLedger) lists these rows next to the sewing / cutting earnings and
     matches payments to them oldest-first (FIFO), so they appear on the payment token until paid.
   * Until this script has been run the app works as before (the other-payment tab says the table is missing).

   Run order: local test DB (DESKTOP-3UN61QI) first, then live.  Rollback: 99_rollback_WorkerExtraEarning.sql
   ============================================================================================= */
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID(N'dbo.WorkerExtraEarning', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WorkerExtraEarning (
        WorkerExtraEarningID INT            NOT NULL IDENTITY(1,1)
                                            CONSTRAINT PK_WorkerExtraEarning PRIMARY KEY,
        InstitutionID        INT            NOT NULL,
        RegistrationID       INT            NOT NULL,              -- user who added it
        WorkerType           NVARCHAR(20)   NOT NULL,              -- Artisan | CuttingMaster
        WorkerID             INT            NOT NULL,              -- ArtisanID / CuttingMasterID
        EarningType          NVARCHAR(20)   NOT NULL,              -- ExtraDesign | Alter | Other
        Amount               DECIMAL(18,2)  NOT NULL,
        EarningDate          DATETIME       NOT NULL CONSTRAINT DF_WorkerExtraEarning_Date DEFAULT (GETDATE()),
        OrderID              INT            NULL,                  -- optional order reference (same shop)
        DressRef             NVARCHAR(200)  NULL,                  -- optional dress / item reference (free text)
        Notes                NVARCHAR(500)  NULL,
        CreatedDate          DATETIME       NOT NULL CONSTRAINT DF_WorkerExtraEarning_Created DEFAULT (GETDATE()),
        UpdatedDate          DATETIME       NULL,
        UpdatedBy            INT            NULL,
        CONSTRAINT CK_WorkerExtraEarning_Amount     CHECK (Amount > 0),
        CONSTRAINT CK_WorkerExtraEarning_WorkerType CHECK (WorkerType IN (N'Artisan', N'CuttingMaster')),
        CONSTRAINT CK_WorkerExtraEarning_Type       CHECK (EarningType IN (N'ExtraDesign', N'Alter', N'Other'))
    );
    PRINT 'WorkerExtraEarning created';
END
ELSE PRINT 'WorkerExtraEarning already exists';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_WorkerExtraEarning_Worker' AND object_id = OBJECT_ID(N'dbo.WorkerExtraEarning'))
BEGIN
    CREATE INDEX IX_WorkerExtraEarning_Worker
        ON dbo.WorkerExtraEarning (InstitutionID, WorkerType, WorkerID, EarningDate)
        INCLUDE (Amount, EarningType, OrderID);
    PRINT 'IX_WorkerExtraEarning_Worker created';
END
ELSE PRINT 'IX_WorkerExtraEarning_Worker already exists';
GO

/* check */
SELECT OBJECT_ID(N'dbo.WorkerExtraEarning') AS TableObjectId,
       (SELECT COUNT(*) FROM dbo.WorkerExtraEarning) AS Rows;
GO
