const { app } = require('@azure/functions');
const { getPool } = require('../shared/db');
const { corsHeaders, requireTntUser } = require('../shared/auth');
app.http('TNTBootstrap',{methods:['GET','OPTIONS'],authLevel:'anonymous',handler:async(req,ctx)=>{
  if(req.method==='OPTIONS') return {status:204,headers:corsHeaders()};
  try{
    const user=requireTntUser(req); const pool=await getPool();
    const [teams,dancers,periods,criteria]=await Promise.all([
      pool.request().query(`SELECT TeamId,Name FROM dbo.TNTTeams WHERE IsActive=1 ORDER BY SortOrder,Name`),
      pool.request().query(`SELECT DancerId,TeamId,FirstName,LastName FROM dbo.TNTDancers WHERE IsActive=1 ORDER BY LastName,FirstName`),
      pool.request().query(`SELECT PeriodId,Code,Name,SchoolYear FROM dbo.TNTEvaluationPeriods WHERE IsActive=1 ORDER BY SortOrder`),
      pool.request().query(`SELECT CriterionId,Code,Name,Description,SortOrder FROM dbo.TNTCriteria WHERE IsActive=1 ORDER BY SortOrder`)
    ]);
    return {status:200,headers:corsHeaders(),jsonBody:{user,teams:teams.recordset,dancers:dancers.recordset,periods:periods.recordset,criteria:criteria.recordset}};
  }catch(e){ctx.error(e);return {status:e.status||500,headers:corsHeaders(),jsonBody:{error:e.message||'Fout'}}}
}});
