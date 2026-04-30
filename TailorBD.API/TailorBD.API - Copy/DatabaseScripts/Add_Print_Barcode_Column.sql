-- Add Print_Barcode column to Institution table for measurement print settings
-- This allows users to control whether order number barcode should be shown on measurement print

-- Check if column already exists
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Institution' 
               AND COLUMN_NAME = 'Print_Barcode')
BEGIN
    ALTER TABLE Institution 
    ADD Print_Barcode BIT NULL DEFAULT 0
    
    PRINT 'Print_Barcode column added successfully to Institution table'
END
ELSE
BEGIN
    PRINT 'Print_Barcode column already exists in Institution table'
END
GO
