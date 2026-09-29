-- Cutting Issue + Factory Issue (optional production steps)
-- Safe to re-run. Does not change Complete Order Work / Delivery behaviour.

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'CuttingMaster')
BEGIN
    CREATE TABLE CuttingMaster (
        CuttingMasterID INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
        InstitutionID   INT           NOT NULL,
        RegistrationID  INT           NOT NULL,
        Name            NVARCHAR(150) NOT NULL,
        Phone           NVARCHAR(50)  NULL,
        IsActive        BIT           NOT NULL CONSTRAINT DF_CuttingMaster_IsActive DEFAULT (1),
        CreatedDate     DATETIME      NOT NULL CONSTRAINT DF_CuttingMaster_Created DEFAULT (GETDATE())
    );
    CREATE INDEX IX_CuttingMaster_Institution ON CuttingMaster(InstitutionID);
    PRINT 'CuttingMaster created';
END
ELSE PRINT 'CuttingMaster already exists';
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Artisan')
BEGIN
    CREATE TABLE Artisan (
        ArtisanID       INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
        InstitutionID   INT           NOT NULL,
        RegistrationID  INT           NOT NULL,
        Name            NVARCHAR(150) NOT NULL,
        Phone           NVARCHAR(50)  NULL,
        IsActive        BIT           NOT NULL CONSTRAINT DF_Artisan_IsActive DEFAULT (1),
        CreatedDate     DATETIME      NOT NULL CONSTRAINT DF_Artisan_Created DEFAULT (GETDATE())
    );
    CREATE INDEX IX_Artisan_Institution ON Artisan(InstitutionID);
    PRINT 'Artisan created';
END
ELSE PRINT 'Artisan already exists';
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'CuttingIssue')
BEGIN
    CREATE TABLE CuttingIssue (
        CuttingIssueID   INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
        InstitutionID    INT           NOT NULL,
        RegistrationID   INT           NOT NULL,
        OrderID          INT           NOT NULL,
        OrderListID      INT           NOT NULL,
        CuttingMasterID  INT           NOT NULL,
        Quantity         INT           NOT NULL CONSTRAINT DF_CuttingIssue_Qty DEFAULT (1),
        Status           NVARCHAR(20)  NOT NULL CONSTRAINT DF_CuttingIssue_Status DEFAULT (N'Assigned'),
        AssignedDate     DATETIME      NOT NULL CONSTRAINT DF_CuttingIssue_Assigned DEFAULT (GETDATE()),
        CompletedDate    DATETIME      NULL,
        Notes            NVARCHAR(500) NULL,
        CONSTRAINT FK_CuttingIssue_Master FOREIGN KEY (CuttingMasterID) REFERENCES CuttingMaster(CuttingMasterID)
    );
    CREATE UNIQUE INDEX UX_CuttingIssue_OrderList ON CuttingIssue(InstitutionID, OrderListID);
    CREATE INDEX IX_CuttingIssue_Master ON CuttingIssue(InstitutionID, CuttingMasterID, Status);
    PRINT 'CuttingIssue created';
END
ELSE PRINT 'CuttingIssue already exists';
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'FactoryIssue')
BEGIN
    CREATE TABLE FactoryIssue (
        FactoryIssueID   INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
        InstitutionID    INT           NOT NULL,
        RegistrationID   INT           NOT NULL,
        OrderID          INT           NOT NULL,
        OrderListID      INT           NOT NULL,
        ArtisanID        INT           NOT NULL,
        Quantity         INT           NOT NULL CONSTRAINT DF_FactoryIssue_Qty DEFAULT (1),
        Status           NVARCHAR(20)  NOT NULL CONSTRAINT DF_FactoryIssue_Status DEFAULT (N'Assigned'),
        AssignedDate     DATETIME      NOT NULL CONSTRAINT DF_FactoryIssue_Assigned DEFAULT (GETDATE()),
        CompletedDate    DATETIME      NULL,
        Notes            NVARCHAR(500) NULL,
        CONSTRAINT FK_FactoryIssue_Artisan FOREIGN KEY (ArtisanID) REFERENCES Artisan(ArtisanID)
    );
    CREATE UNIQUE INDEX UX_FactoryIssue_OrderList ON FactoryIssue(InstitutionID, OrderListID);
    CREATE INDEX IX_FactoryIssue_Artisan ON FactoryIssue(InstitutionID, ArtisanID, Status);
    PRINT 'FactoryIssue created';
END
ELSE PRINT 'FactoryIssue already exists';
GO
