-- Add Print_ServedBy column to Institution table for measurement print settings
-- Controls whether "Served by" line appears above customer info on measurement print

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_NAME = 'Institution'
               AND COLUMN_NAME = 'Print_ServedBy')
BEGIN
    ALTER TABLE Institution
    ADD Print_ServedBy BIT NULL DEFAULT 0

    PRINT 'Print_ServedBy column added successfully to Institution table'
END
ELSE
BEGIN
    PRINT 'Print_ServedBy column already exists in Institution table'
END
GO
