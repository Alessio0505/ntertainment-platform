/* TNT V2.2 - team access + uniqueness. Safe to run after V2 migration. */
IF OBJECT_ID('dbo.TNTUserTeams','U') IS NULL
BEGIN
  CREATE TABLE dbo.TNTUserTeams(
    UserId int NOT NULL,
    TeamId int NOT NULL,
    CreatedAt datetime2 NOT NULL CONSTRAINT DF_TNTUserTeams_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_TNTUserTeams PRIMARY KEY(UserId,TeamId),
    CONSTRAINT FK_TNTUserTeams_Users FOREIGN KEY(UserId) REFERENCES dbo.Users(UserId),
    CONSTRAINT FK_TNTUserTeams_Teams FOREIGN KEY(TeamId) REFERENCES dbo.TNTTeams(TeamId)
  );
END;

/* Prevent duplicate evaluator/dancer/period evaluations when no duplicates already exist. */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UX_TNTEvaluations_Period_Dancer_Evaluator' AND object_id=OBJECT_ID('dbo.TNTEvaluations'))
AND NOT EXISTS (
 SELECT 1 FROM dbo.TNTEvaluations GROUP BY PeriodId,DancerId,EvaluatorUserId HAVING COUNT(*)>1
)
BEGIN
 CREATE UNIQUE INDEX UX_TNTEvaluations_Period_Dancer_Evaluator
 ON dbo.TNTEvaluations(PeriodId,DancerId,EvaluatorUserId);
END;

/* Backward-compatible default: existing TNT evaluators keep access to all active teams.
   Admin can narrow this immediately in Gebruikersbeheer. */
INSERT INTO dbo.TNTUserTeams(UserId,TeamId)
SELECT u.UserId,t.TeamId
FROM dbo.Users u CROSS JOIN dbo.TNTTeams t
WHERE u.Role='TNTEvaluator' AND t.IsActive=1
AND NOT EXISTS(SELECT 1 FROM dbo.TNTUserTeams x WHERE x.UserId=u.UserId AND x.TeamId=t.TeamId);
