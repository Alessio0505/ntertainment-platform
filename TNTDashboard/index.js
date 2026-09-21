const { app } = require('@azure/functions');
const { getPool, sql } = require('../shared/db');
const { corsHeaders, requireTntUser } = require('../shared/auth');
app.http('TNTDashboard',{methods:['GET','OPTIONS'],authLevel:'anonymous',handler:async(req,ctx)=>{
 if(req.method==='OPTIONS') return {status:204,headers:corsHeaders()};
 try{
  requireTntUser(req); const periodId=+(req.query.get('periodId')||0); const teamId=+(req.query.get('teamId')||0); const pool=await getPool();
  const r=await pool.request().input('PeriodId',sql.Int,periodId||null).input('TeamId',sql.Int,teamId||null).query(`
   SELECT d.DancerId,d.FirstName,d.LastName,t.Name TeamName,p.Name PeriodName,
     COUNT(DISTINCT e.EvaluationId) EvaluatorCount,CAST(AVG(CAST(s.Score AS decimal(5,2))) AS decimal(5,2)) OverallScore
   FROM dbo.TNTDancers d JOIN dbo.TNTTeams t ON t.TeamId=d.TeamId
   CROSS JOIN dbo.TNTEvaluationPeriods p
   LEFT JOIN dbo.TNTEvaluations e ON e.DancerId=d.DancerId AND e.PeriodId=p.PeriodId
   LEFT JOIN dbo.TNTEvaluationScores s ON s.EvaluationId=e.EvaluationId
   WHERE d.IsActive=1 AND p.IsActive=1 AND (@PeriodId IS NULL OR p.PeriodId=@PeriodId) AND (@TeamId IS NULL OR t.TeamId=@TeamId)
   GROUP BY d.DancerId,d.FirstName,d.LastName,t.Name,p.Name,t.SortOrder
   ORDER BY t.SortOrder,d.LastName,d.FirstName`);
  return {status:200,headers:corsHeaders(),jsonBody:r.recordset};
 }catch(e){ctx.error(e);return {status:e.status||500,headers:corsHeaders(),jsonBody:{error:e.message||'Dashboard fout.'}}}
}});
