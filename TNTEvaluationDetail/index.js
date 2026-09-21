const { app } = require('@azure/functions');
const { getPool, sql } = require('../shared/db');
const { corsHeaders, requireTntUser } = require('../shared/auth');
app.http('TNTEvaluationDetail',{methods:['GET','OPTIONS'],authLevel:'anonymous',handler:async(req,ctx)=>{
 if(req.method==='OPTIONS') return {status:204,headers:corsHeaders()};
 try{
  requireTntUser(req); const dancerId=+req.query.get('dancerId'), periodId=+req.query.get('periodId'); if(!dancerId||!periodId) throw Object.assign(new Error('dancerId en periodId zijn verplicht.'),{status:400});
  const pool=await getPool();
  const head=await pool.request().input('DancerId',sql.Int,dancerId).input('PeriodId',sql.Int,periodId).query(`SELECT d.DancerId,d.FirstName,d.LastName,t.Name TeamName,p.Name PeriodName,p.SchoolYear FROM dbo.TNTDancers d JOIN dbo.TNTTeams t ON t.TeamId=d.TeamId CROSS JOIN dbo.TNTEvaluationPeriods p WHERE d.DancerId=@DancerId AND p.PeriodId=@PeriodId`);
  const scores=await pool.request().input('DancerId',sql.Int,dancerId).input('PeriodId',sql.Int,periodId).query(`SELECT c.CriterionId,c.Name,c.SortOrder,CAST(AVG(CAST(s.Score AS decimal(5,2))) AS decimal(5,2)) AverageScore FROM dbo.TNTCriteria c LEFT JOIN dbo.TNTEvaluationScores s ON s.CriterionId=c.CriterionId LEFT JOIN dbo.TNTEvaluations e ON e.EvaluationId=s.EvaluationId AND e.DancerId=@DancerId AND e.PeriodId=@PeriodId WHERE c.IsActive=1 GROUP BY c.CriterionId,c.Name,c.SortOrder ORDER BY c.SortOrder`);
  const feedback=await pool.request().input('DancerId',sql.Int,dancerId).input('PeriodId',sql.Int,periodId).query(`SELECT e.Feedback,u.FirstName,u.LastName FROM dbo.TNTEvaluations e JOIN dbo.Users u ON u.UserId=e.EvaluatorUserId WHERE e.DancerId=@DancerId AND e.PeriodId=@PeriodId AND NULLIF(LTRIM(RTRIM(e.Feedback)),'') IS NOT NULL ORDER BY e.UpdatedAt`);
  return {status:200,headers:corsHeaders(),jsonBody:{...head.recordset[0],scores:scores.recordset,feedback:feedback.recordset}};
 }catch(e){ctx.error(e);return {status:e.status||500,headers:corsHeaders(),jsonBody:{error:e.message||'Detail fout.'}}}
}});
