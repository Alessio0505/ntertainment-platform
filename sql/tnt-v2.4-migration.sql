/* Ntertainment TNT V2.4
   Hard rule: one evaluator can have only one evaluation per dancer per TNT period. */
SET XACT_ABORT ON;

IF EXISTS (
    SELECT 1
    FROM dbo.TNTEvaluations
    GROUP BY EvaluatorUserId, DancerId, PeriodId
    HAVING COUNT(*) > 1
)
BEGIN
    THROW 51000, 'Dubbele evaluaties gevonden. Los deze eerst op voordat de V2.4 unique index wordt aangemaakt.', 1;
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID('dbo.TNTEvaluations')
      AND name = 'UX_TNTEvaluations_Evaluator_Dancer_Period'
)
BEGIN
    CREATE UNIQUE INDEX UX_TNTEvaluations_Evaluator_Dancer_Period
    ON dbo.TNTEvaluations(EvaluatorUserId, DancerId, PeriodId);
END;

SELECT name, is_unique
FROM sys.indexes
WHERE object_id = OBJECT_ID('dbo.TNTEvaluations')
  AND name = 'UX_TNTEvaluations_Evaluator_Dancer_Period';
