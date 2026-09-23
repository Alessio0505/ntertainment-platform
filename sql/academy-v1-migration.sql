/* N-Academy v1 - central development layer */
IF OBJECT_ID('dbo.AcademyProfiles') IS NULL CREATE TABLE dbo.AcademyProfiles(
 ProfileId int IDENTITY PRIMARY KEY,UserId int NOT NULL UNIQUE REFERENCES dbo.Users(UserId),DancerId int NULL REFERENCES dbo.TNTDancers(DancerId),
 Role nvarchar(30) NOT NULL DEFAULT 'Dancer',Bio nvarchar(800) NULL,IsActive bit NOT NULL DEFAULT 1,CreatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('dbo.AcademyActivities') IS NULL CREATE TABLE dbo.AcademyActivities(
 ActivityId int IDENTITY PRIMARY KEY,Title nvarchar(200) NOT NULL,ActivityType nvarchar(40) NOT NULL,StartAt datetime2 NOT NULL,EndAt datetime2 NULL,
 Location nvarchar(200) NULL,SourceType nvarchar(40) NULL,SourceId int NULL,Notes nvarchar(1000) NULL,IsActive bit NOT NULL DEFAULT 1);
IF OBJECT_ID('dbo.AcademyActivityParticipants') IS NULL CREATE TABLE dbo.AcademyActivityParticipants(
 ActivityId int NOT NULL REFERENCES dbo.AcademyActivities(ActivityId) ON DELETE CASCADE,ProfileId int NOT NULL REFERENCES dbo.AcademyProfiles(ProfileId) ON DELETE CASCADE,
 AttendanceStatus nvarchar(30) NULL,Result nvarchar(300) NULL,PRIMARY KEY(ActivityId,ProfileId));
IF OBJECT_ID('dbo.AcademyGoals') IS NULL CREATE TABLE dbo.AcademyGoals(
 GoalId int IDENTITY PRIMARY KEY,ProfileId int NOT NULL REFERENCES dbo.AcademyProfiles(ProfileId),Title nvarchar(200) NOT NULL,Category nvarchar(60) NULL,
 Description nvarchar(1000) NULL,Status nvarchar(30) NOT NULL DEFAULT 'Nieuw',TargetDate date NULL,CreatedByUserId int NOT NULL REFERENCES dbo.Users(UserId),
 CreatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),UpdatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('dbo.AcademyCoachNotes') IS NULL CREATE TABLE dbo.AcademyCoachNotes(
 NoteId int IDENTITY PRIMARY KEY,ProfileId int NOT NULL REFERENCES dbo.AcademyProfiles(ProfileId),CoachUserId int NOT NULL REFERENCES dbo.Users(UserId),
 Note nvarchar(1500) NOT NULL,IsVisibleToDancer bit NOT NULL DEFAULT 1,CreatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME());
