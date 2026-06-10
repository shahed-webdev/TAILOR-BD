-- Add Is_Print column to [Order] table for tracking measurement print count
-- Mirrors the legacy ASPX project behaviour: Is_Print is incremented by 1 each time
-- the measurement card is printed from the money-receipt page.

IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Order' AND COLUMN_NAME = 'Is_Print'
)
BEGIN
    ALTER TABLE [Order]
    ADD Is_Print INT NOT NULL DEFAULT 0

    PRINT 'Is_Print column added to [Order] table'
END
ELSE
BEGIN
    PRINT 'Is_Print column already exists in [Order] table'
END
GO
