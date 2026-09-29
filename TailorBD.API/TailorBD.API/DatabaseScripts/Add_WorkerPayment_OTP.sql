-- OTP for worker payments
IF COL_LENGTH('WorkerPayment', 'OtpCode') IS NULL
BEGIN
    ALTER TABLE WorkerPayment ADD OtpCode NVARCHAR(10) NULL;
    PRINT 'WorkerPayment.OtpCode added';
END
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'WorkerPaymentOtp')
BEGIN
    CREATE TABLE WorkerPaymentOtp (
        WorkerPaymentOtpID INT NOT NULL IDENTITY(1,1) PRIMARY KEY,
        InstitutionID INT NOT NULL,
        WorkerType NVARCHAR(20) NOT NULL,
        WorkerID INT NOT NULL,
        OtpCode NVARCHAR(10) NOT NULL,
        Amount DECIMAL(18,2) NOT NULL,
        Phone NVARCHAR(50) NULL,
        ExpiresAt DATETIME NOT NULL,
        CreatedDate DATETIME NOT NULL CONSTRAINT DF_WorkerPaymentOtp_Created DEFAULT (GETDATE())
    );
    CREATE INDEX IX_WorkerPaymentOtp_Lookup ON WorkerPaymentOtp(InstitutionID, WorkerType, WorkerID, ExpiresAt);
    PRINT 'WorkerPaymentOtp created';
END
GO
