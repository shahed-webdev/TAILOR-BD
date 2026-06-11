-- Add Print_Style_Font_Size column for separate style text font size on measurement print
-- Run on production SQL Server (SSMS / sqlcmd) against Tailorbd database

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_NAME = 'Institution'
               AND COLUMN_NAME = 'Print_Style_Font_Size')
BEGIN
    ALTER TABLE Institution
    ADD Print_Style_Font_Size INT NULL CONSTRAINT DF_Institution_Print_Style_Font_Size DEFAULT 0;

    PRINT 'Print_Style_Font_Size column added successfully to Institution table';
END
ELSE
BEGIN
    PRINT 'Print_Style_Font_Size column already exists in Institution table';
END
GO

-- Set default style font size for existing shops (14px, or match measurement font if set)
UPDATE Institution
SET Print_Style_Font_Size = CASE
        WHEN ISNULL(Print_Font_Size, 0) > 0 THEN Print_Font_Size
        ELSE 14
    END
WHERE ISNULL(Print_Style_Font_Size, 0) = 0;

PRINT 'Print_Style_Font_Size default values updated';
GO

-- Verify
SELECT TOP 10 InstitutionID, InstitutionName, Print_Font_Size, Print_Style_Font_Size
FROM Institution
ORDER BY InstitutionID;
GO
