/* Ntertainment TNT V2.3 - account activation support */
IF COL_LENGTH('dbo.Users','MustSetPassword') IS NULL
BEGIN
    ALTER TABLE dbo.Users ADD MustSetPassword bit NOT NULL CONSTRAINT DF_Users_MustSetPassword DEFAULT(0);
END;

IF COL_LENGTH('dbo.Users','ActivationCodeHash') IS NULL
BEGIN
    ALTER TABLE dbo.Users ADD ActivationCodeHash nvarchar(128) NULL;
END;

SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME='Users' AND COLUMN_NAME IN ('MustSetPassword','ActivationCodeHash');
