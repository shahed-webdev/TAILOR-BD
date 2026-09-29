-- Dress cutting/sewing costs + worker balance + payments
-- Safe to re-run.

IF COL_LENGTH('Dress', 'CuttingCost') IS NULL
BEGIN
    ALTER TABLE Dress ADD CuttingCost DECIMAL(18,2) NOT NULL CONSTRAINT DF_Dress_CuttingCost DEFAULT (0);
    PRINT 'Dress.CuttingCost added';
END
ELSE PRINT 'Dress.CuttingCost exists';
GO

IF COL_LENGTH('Dress', 'SewingCost') IS NULL
BEGIN
    ALTER TABLE Dress ADD SewingCost DECIMAL(18,2) NOT NULL CONSTRAINT DF_Dress_SewingCost DEFAULT (0);
    PRINT 'Dress.SewingCost added';
END
ELSE PRINT 'Dress.SewingCost exists';
GO

IF COL_LENGTH('CuttingMaster', 'Balance') IS NULL
BEGIN
    ALTER TABLE CuttingMaster ADD Balance DECIMAL(18,2) NOT NULL CONSTRAINT DF_CuttingMaster_Balance DEFAULT (0);
    PRINT 'CuttingMaster.Balance added';
END
ELSE PRINT 'CuttingMaster.Balance exists';
GO

IF COL_LENGTH('Artisan', 'Balance') IS NULL
BEGIN
    ALTER TABLE Artisan ADD Balance DECIMAL(18,2) NOT NULL CONSTRAINT DF_Artisan_Balance DEFAULT (0);
    PRINT 'Artisan.Balance added';
END
ELSE PRINT 'Artisan.Balance exists';
GO

IF COL_LENGTH('CuttingIssue', 'EarnedAmount') IS NULL
BEGIN
    ALTER TABLE CuttingIssue ADD EarnedAmount DECIMAL(18,2) NULL;
    PRINT 'CuttingIssue.EarnedAmount added';
END
ELSE PRINT 'CuttingIssue.EarnedAmount exists';
GO

IF COL_LENGTH('FactoryIssue', 'EarnedAmount') IS NULL
BEGIN
    ALTER TABLE FactoryIssue ADD EarnedAmount DECIMAL(18,2) NULL;
    PRINT 'FactoryIssue.EarnedAmount added';
END
ELSE PRINT 'FactoryIssue.EarnedAmount exists';
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'WorkerPayment')
BEGIN
    CREATE TABLE WorkerPayment (
        WorkerPaymentID  INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
        InstitutionID    INT            NOT NULL,
        RegistrationID   INT            NOT NULL,
        WorkerType       NVARCHAR(20)   NOT NULL, -- CuttingMaster | Artisan
        WorkerID         INT            NOT NULL,
        Amount           DECIMAL(18,2)  NOT NULL,
        PaymentDate      DATETIME       NOT NULL CONSTRAINT DF_WorkerPayment_Date DEFAULT (GETDATE()),
        Notes            NVARCHAR(500)  NULL,
        CreatedDate      DATETIME       NOT NULL CONSTRAINT DF_WorkerPayment_Created DEFAULT (GETDATE())
    );
    CREATE INDEX IX_WorkerPayment_Worker ON WorkerPayment(InstitutionID, WorkerType, WorkerID, PaymentDate DESC);
    PRINT 'WorkerPayment created';
END
ELSE PRINT 'WorkerPayment already exists';
GO
