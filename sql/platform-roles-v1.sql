/* Platform capabilities v1: additive; legacy Users.Role remains for compatibility */
IF OBJECT_ID('dbo.PlatformRoles') IS NULL CREATE TABLE dbo.PlatformRoles(RoleCode nvarchar(40) PRIMARY KEY,Name nvarchar(100) NOT NULL,SortOrder int NOT NULL DEFAULT 0);
IF OBJECT_ID('dbo.UserPlatformRoles') IS NULL CREATE TABLE dbo.UserPlatformRoles(UserId int NOT NULL REFERENCES dbo.Users(UserId) ON DELETE CASCADE,RoleCode nvarchar(40) NOT NULL REFERENCES dbo.PlatformRoles(RoleCode),CONSTRAINT PK_UserPlatformRoles PRIMARY KEY(UserId,RoleCode));
MERGE dbo.PlatformRoles AS t USING (VALUES
('Admin','Admin',1),('Teacher','Docent',2),('AcademyCoach','Academy Coach',3),('TNTEvaluator','TNT Evaluator',4),('Dancer','Lid / Danser',5),('Parent','Ouder',6)
) s(RoleCode,Name,SortOrder) ON t.RoleCode=s.RoleCode WHEN NOT MATCHED THEN INSERT(RoleCode,Name,SortOrder) VALUES(s.RoleCode,s.Name,s.SortOrder);
INSERT dbo.UserPlatformRoles(UserId,RoleCode)
SELECT u.UserId,CASE WHEN u.Role='Member' THEN 'Dancer' WHEN u.Role='Coach' THEN 'AcademyCoach' ELSE u.Role END FROM dbo.Users u
WHERE (u.Role IN ('Admin','Teacher','Coach','TNTEvaluator','Dancer','Member','Parent'))
AND NOT EXISTS(SELECT 1 FROM dbo.UserPlatformRoles r WHERE r.UserId=u.UserId AND r.RoleCode=CASE WHEN u.Role='Member' THEN 'Dancer' WHEN u.Role='Coach' THEN 'AcademyCoach' ELSE u.Role END);
