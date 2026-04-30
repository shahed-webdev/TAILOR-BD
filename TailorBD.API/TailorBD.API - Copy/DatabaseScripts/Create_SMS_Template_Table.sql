-- Create SMS_Template table for storing SMS templates
-- Used in sms-settings.html for CompletedWork and Other type templates

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES 
               WHERE TABLE_NAME = 'SMS_Template')
BEGIN
    CREATE TABLE SMS_Template (
        SMS_TemplateID  INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
        InstitutionID   INT           NOT NULL,
        RegistrationID  INT           NOT NULL,
        TemplateName    NVARCHAR(200) NOT NULL,
        TemplateText    NVARCHAR(MAX) NOT NULL,
        TemplateFor     NVARCHAR(100) NOT NULL DEFAULT 'CompletedWork',
        Created_Date    DATETIME      NOT NULL DEFAULT GETDATE()
    )

    PRINT 'SMS_Template table created successfully'
END
ELSE
BEGIN
    PRINT 'SMS_Template table already exists'
END
GO
