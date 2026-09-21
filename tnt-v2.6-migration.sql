/* TNT V2.6 - dance years and admin management */
SET XACT_ABORT ON;
IF OBJECT_ID('dbo.TNTSchoolYears') IS NULL
BEGIN
 CREATE TABLE dbo.TNTSchoolYears(
  SchoolYearId int IDENTITY PRIMARY KEY,
  Name nvarchar(20) NOT NULL UNIQUE,
  IsActive bit NOT NULL DEFAULT 0,
  CreatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME()
 );
END;
IF NOT EXISTS(SELECT 1 FROM dbo.TNTSchoolYears WHERE Name='2026-2027')
 INSERT dbo.TNTSchoolYears(Name,IsActive) VALUES('2026-2027',1);
IF NOT EXISTS(SELECT 1 FROM dbo.TNTSchoolYears WHERE IsActive=1)
 UPDATE dbo.TNTSchoolYears SET IsActive=1 WHERE Name='2026-2027';
SELECT SchoolYearId,Name,IsActive FROM dbo.TNTSchoolYears ORDER BY Name DESC;
