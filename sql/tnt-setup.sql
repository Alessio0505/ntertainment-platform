/* Ntertainment TNT Evaluation module - run once in Azure SQL */
IF OBJECT_ID('dbo.TNTTeams') IS NULL CREATE TABLE dbo.TNTTeams(TeamId int IDENTITY PRIMARY KEY,Name nvarchar(100) NOT NULL UNIQUE,SortOrder int NOT NULL DEFAULT 0,IsActive bit NOT NULL DEFAULT 1);
IF OBJECT_ID('dbo.TNTDancers') IS NULL CREATE TABLE dbo.TNTDancers(DancerId int IDENTITY PRIMARY KEY,TeamId int NOT NULL REFERENCES dbo.TNTTeams(TeamId),FirstName nvarchar(100) NOT NULL,LastName nvarchar(100) NOT NULL,IsActive bit NOT NULL DEFAULT 1);
IF OBJECT_ID('dbo.TNTEvaluationPeriods') IS NULL CREATE TABLE dbo.TNTEvaluationPeriods(PeriodId int IDENTITY PRIMARY KEY,Code nvarchar(30) NOT NULL UNIQUE,Name nvarchar(100) NOT NULL,SchoolYear nvarchar(20) NOT NULL,SortOrder int NOT NULL,IsActive bit NOT NULL DEFAULT 1);
IF OBJECT_ID('dbo.TNTCriteria') IS NULL CREATE TABLE dbo.TNTCriteria(CriterionId int IDENTITY PRIMARY KEY,Code nvarchar(40) NOT NULL UNIQUE,Name nvarchar(100) NOT NULL,Description nvarchar(600) NULL,SortOrder int NOT NULL,IsActive bit NOT NULL DEFAULT 1);
IF OBJECT_ID('dbo.TNTEvaluations') IS NULL CREATE TABLE dbo.TNTEvaluations(EvaluationId int IDENTITY PRIMARY KEY,PeriodId int NOT NULL REFERENCES dbo.TNTEvaluationPeriods(PeriodId),DancerId int NOT NULL REFERENCES dbo.TNTDancers(DancerId),EvaluatorUserId int NOT NULL REFERENCES dbo.Users(UserId),Feedback nvarchar(max) NULL,CreatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),UpdatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),CONSTRAINT UQ_TNTEvaluation UNIQUE(PeriodId,DancerId,EvaluatorUserId));
IF OBJECT_ID('dbo.TNTEvaluationScores') IS NULL CREATE TABLE dbo.TNTEvaluationScores(EvaluationId int NOT NULL REFERENCES dbo.TNTEvaluations(EvaluationId) ON DELETE CASCADE,CriterionId int NOT NULL REFERENCES dbo.TNTCriteria(CriterionId),Score tinyint NOT NULL CHECK(Score BETWEEN 1 AND 10),CONSTRAINT PK_TNTEvaluationScores PRIMARY KEY(EvaluationId,CriterionId));

IF NOT EXISTS(SELECT 1 FROM dbo.TNTTeams) INSERT dbo.TNTTeams(Name,SortOrder) VALUES ('Showgroep',1),('N-Tense',2),('N-Unit',3),('N-Spire',4),('N-Joy',5);
IF NOT EXISTS(SELECT 1 FROM dbo.TNTEvaluationPeriods) INSERT dbo.TNTEvaluationPeriods(Code,Name,SchoolYear,SortOrder) VALUES ('TNT1-2627','TNT 1 - Mid jaar','2026-2027',1),('TNT2-2627','TNT 2 - Eind jaar','2026-2027',2);
IF NOT EXISTS(SELECT 1 FROM dbo.TNTCriteria) INSERT dbo.TNTCriteria(Code,Name,Description,SortOrder) VALUES
('technical','Technische vaardigheid','Basispassen en technieken (foundations); lichaamscontrole, balans en precisie; muzikaliteit',1),
('performance','Performance & expressie','Emotie en verhaal; podiumpresence, uitstraling en energie; creativiteit en interpretatie van muziek',2),
('physical','Fysieke aspecten','Uithoudingsvermogen; energieconsistentie; lichaamshouding en kracht',3),
('discipline','Discipline & inzet','Aanwezigheid en betrokkenheid; voorbereiding; teamwork; houding; inzet tijdens lessen',4),
('growth','Groei & leerhouding','Verbetering; feedback toepassen; zelfreflectie; initiatief; stressbestendigheid; mindset',5),
('rolemodel','Rolmodel','Een voorbeeldfiguur; delen van de passie',6),
('sync','Synchronisatie','Synchrone bewegingen; gezamenlijke energie en uitstraling',7),
('formation','Formatie & Spacing','Duidelijke patronen en vloeiende wissels; gebruik van het podium',8),
('choreo','Choreografie','Variatie en complexiteit; overgangen; dynamiek en contrast',9),
('teamspirit','Teamspirit','Samenwerking en cohesie; elkaar versterken',10),
('originality','Originaliteit & creativiteit','Eigen stijl en herkenbare identiteit; freestyle',11);

IF NOT EXISTS(SELECT 1 FROM dbo.TNTDancers)
BEGIN
DECLARE @Show int=(SELECT TeamId FROM dbo.TNTTeams WHERE Name='Showgroep'),@Tense int=(SELECT TeamId FROM dbo.TNTTeams WHERE Name='N-Tense'),@Unit int=(SELECT TeamId FROM dbo.TNTTeams WHERE Name='N-Unit'),@Spire int=(SELECT TeamId FROM dbo.TNTTeams WHERE Name='N-Spire'),@Joy int=(SELECT TeamId FROM dbo.TNTTeams WHERE Name='N-Joy');
INSERT dbo.TNTDancers(TeamId,FirstName,LastName) VALUES
(@Show,'Alissa','Paulussen'),(@Show,'Arrezina','Troiani'),(@Show,'Raihana','Bou’M Barek'),(@Show,'Daimy','Claeys'),(@Show,'Giada','Russotto'),(@Show,'Gioia','D’Angelo'),(@Show,'Lorena','Silvano'),(@Show,'Minne','Pouders'),(@Show,'Nayeli','Marques'),(@Show,'Sam','Mues'),(@Show,'Zoe','Berx'),
(@Tense,'Alissa','Paulussen'),(@Tense,'Amalia','Ben Abdelkader'),(@Tense,'Bente','Smeets'),(@Tense,'Delaya','Coppola'),(@Tense,'Elise','Willemen'),(@Tense,'Elysa','Isci'),(@Tense,'Esila','Dogan'),(@Tense,'Febe','Jacobs'),(@Tense,'Giada','Russotto'),(@Tense,'Gioia','D’Angelo'),(@Tense,'Juline','Meurs'),(@Tense,'Letizia','Santoro'),(@Tense,'Lorena','Silvano'),(@Tense,'Raihana','Bou’M Barek'),(@Tense,'Sophia','Natar'),
(@Unit,'Ea','Hermans'),(@Unit,'Farah','Amzil'),(@Unit,'Giada','Stabile'),(@Unit,'Gioia','Anello'),(@Unit,'Giulia','Anello'),(@Unit,'Lia','Colapinto'),(@Unit,'Maia','Rodriguez Van Bael'),(@Unit,'Meyra','Celik'),(@Unit,'Nell','Okoro'),(@Unit,'Nia','Truijen'),(@Unit,'Noélia','Freire'),
(@Spire,'Artemis','Dako'),(@Spire,'Chenoa','Segade-varela'),(@Spire,'Cléo','Kazilas'),(@Spire,'Fayah','Ben Cherif'),(@Spire,'Ikra','Demir'),(@Spire,'Jalyssa','Bergen'),(@Spire,'Maysa','Celik'),(@Spire,'Mia','Peeters'),(@Spire,'Olivia','Swijsen'),(@Spire,'Tess','Vanclooster'),
(@Joy,'Améline','Vleeschouwers'),(@Joy,'Chiara','Bisschop'),(@Joy,'Dikra','Oubram'),(@Joy,'Félien','Raemen'),(@Joy,'Hannah','Nijs'),(@Joy,'Jeanne','Peeters'),(@Joy,'Lio','Vermeulen'),(@Joy,'Nailya','Zaitov'),(@Joy,'Sharon','Obradovic'),(@Joy,'Soleil','Obradovic');
END;

/* Set the six evaluator accounts to TNTEvaluator after creating their Users records, e.g.:
UPDATE dbo.Users SET Role='TNTEvaluator' WHERE Email IN ('...');
*/
