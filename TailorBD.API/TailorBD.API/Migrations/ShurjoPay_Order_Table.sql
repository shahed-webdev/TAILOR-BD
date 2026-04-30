-- ShurjoPay Online Payment Orders table
-- Run this once on the database

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME = 'ShurjoPay_Order'
)
BEGIN
    CREATE TABLE ShurjoPay_Order (
        Id              INT           IDENTITY(1,1) PRIMARY KEY,
        MerchantOrderId NVARCHAR(100) NOT NULL UNIQUE,
        SpOrderId       NVARCHAR(200) NULL,
        InstitutionID   INT           NOT NULL,
        InvoiceIds      NVARCHAR(500) NOT NULL,   -- comma-separated InvoiceIDs
        TotalAmount     FLOAT         NOT NULL,
        Status          NVARCHAR(50)  NOT NULL DEFAULT 'Pending',
        -- Pending | Paid | Failed | Cancelled
        PaymentMethod   NVARCHAR(100) NULL,
        TransactionId   NVARCHAR(200) NULL,
        SpResponse      NVARCHAR(MAX) NULL,
        CreatedAt       DATETIME      NOT NULL DEFAULT GETDATE(),
        UpdatedAt       DATETIME      NULL
    );

    PRINT 'ShurjoPay_Order table created.';
END
ELSE
    PRINT 'ShurjoPay_Order table already exists.';
