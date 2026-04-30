-- Add M_Receipt_Barcode column to Institution table for money receipt barcode settings
-- This allows users to control whether order number barcode should be shown on money receipt

-- Check if column already exists
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Institution' 
               AND COLUMN_NAME = 'M_Receipt_Barcode')
BEGIN
    ALTER TABLE Institution 
    ADD M_Receipt_Barcode BIT NULL DEFAULT 1
    
    PRINT 'M_Receipt_Barcode column added successfully to Institution table with default value 1 (show barcode)'
END
ELSE
BEGIN
    PRINT 'M_Receipt_Barcode column already exists in Institution table'
END
GO
