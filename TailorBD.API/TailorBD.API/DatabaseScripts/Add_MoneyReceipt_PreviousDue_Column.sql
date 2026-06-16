-- Show/hide "Previous Due" (আগের বাকি) row on money receipt print

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_NAME = 'Institution'
               AND COLUMN_NAME = 'M_Receipt_PreviousDue')
BEGIN
    ALTER TABLE Institution
    ADD M_Receipt_PreviousDue BIT NULL DEFAULT 1

    PRINT 'M_Receipt_PreviousDue column added (default 1 = show previous due when available)'
END
ELSE
BEGIN
    PRINT 'M_Receipt_PreviousDue column already exists in Institution table'
END
GO
