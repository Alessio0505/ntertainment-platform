/* Ntertainment TNT V2 migration - safe to run once after tnt-setup.sql */
IF COL_LENGTH('dbo.TNTEvaluations','GrowthPlan') IS NULL
  ALTER TABLE dbo.TNTEvaluations ADD GrowthPlan nvarchar(max) NULL;
IF COL_LENGTH('dbo.TNTCriteria','Category') IS NULL
  ALTER TABLE dbo.TNTCriteria ADD Category nvarchar(20) NULL;
UPDATE dbo.TNTCriteria SET Category=CASE WHEN SortOrder<=6 THEN 'Individual' ELSE 'Team' END WHERE Category IS NULL OR Category='';
UPDATE dbo.Users SET Role='TNTEvaluator' WHERE Role='TNTCoach';
