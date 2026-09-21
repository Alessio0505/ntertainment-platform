const {app}=require('@azure/functions');
const crypto=require('crypto');
const {getPool,sql}=require('../shared/db');
const {corsHeaders,requireTntUser}=require('../shared/auth');
function makeCode(){return crypto.randomBytes(5).toString('hex').toUpperCase()}
function codeHash(code){return crypto.createHash('sha256').update(code).digest('hex')}
function placeholderPassword(){const salt=crypto.randomBytes(16),hash=crypto.scryptSync(crypto.randomBytes(32).toString('hex'),salt,64);return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`}
async function setTeams(tx,userId,role,teamIds){await new sql.Request(tx).input('UserId',sql.Int,userId).query(`DELETE FROM dbo.TNTUserTeams WHERE UserId=@UserId`);if(role==='TNTEvaluator')for(const teamId of teamIds)await new sql.Request(tx).input('UserId',sql.Int,userId).input('TeamId',sql.Int,teamId).query(`INSERT INTO dbo.TNTUserTeams(UserId,TeamId) SELECT @UserId,@TeamId WHERE EXISTS(SELECT 1 FROM dbo.TNTTeams WHERE TeamId=@TeamId AND IsActive=1)`)}
app.http('TNTUsers',{methods:['GET','POST','PUT','OPTIONS'],authLevel:'anonymous',handler:async(req,ctx)=>{
 if(req.method==='OPTIONS')return{status:204,headers:corsHeaders()};
 try{
  const admin=requireTntUser(req,['Admin']),pool=await getPool();
  if(req.method==='GET'){
   const r=await pool.request().query(`SELECT u.UserId,u.FirstName,u.LastName,u.Email,u.Role,u.IsActive,COALESCE(u.MustSetPassword,0) MustSetPassword,ut.TeamId FROM dbo.Users u LEFT JOIN dbo.TNTUserTeams ut ON ut.UserId=u.UserId ORDER BY u.LastName,u.FirstName,u.Email,ut.TeamId`);
   const m=new Map();for(const x of r.recordset){if(!m.has(x.UserId))m.set(x.UserId,{UserId:x.UserId,FirstName:x.FirstName,LastName:x.LastName,Email:x.Email,Role:x.Role,IsActive:x.IsActive,MustSetPassword:x.MustSetPassword,TeamIds:[]});if(x.TeamId)m.get(x.UserId).TeamIds.push(x.TeamId)}return{status:200,headers:corsHeaders(),jsonBody:[...m.values()]}
  }
  const b=await req.json(),roles=['Parent','TNTEvaluator','Admin'],teamIds=[...new Set((b.teamIds||[]).map(Number).filter(Number.isInteger))];
  if(req.method==='POST'){
   const firstName=String(b.firstName||'').trim(),lastName=String(b.lastName||'').trim(),email=String(b.email||'').trim().toLowerCase(),role=b.role||'TNTEvaluator';
   if(!firstName||!lastName||!email||!roles.includes(role))return{status:400,headers:corsHeaders(),jsonBody:{error:'Naam, e-mailadres en geldige rol zijn verplicht.'}};
   if(role==='TNTEvaluator'&&!teamIds.length)return{status:400,headers:corsHeaders(),jsonBody:{error:'Kies minstens één team voor een TNT Evaluator.'}};
   const exists=await pool.request().input('Email',sql.NVarChar(255),email).query(`SELECT UserId FROM dbo.Users WHERE LOWER(Email)=@Email`);if(exists.recordset.length)return{status:409,headers:corsHeaders(),jsonBody:{error:'Dit e-mailadres bestaat al. Gebruik de bestaande gebruiker of genereer een nieuwe activatiecode.'}};
   const code=makeCode(),tx=new sql.Transaction(pool);await tx.begin();try{
    const ur=await new sql.Request(tx).input('Email',sql.NVarChar(255),email).input('FirstName',sql.NVarChar(100),firstName).input('LastName',sql.NVarChar(100),lastName).input('Role',sql.NVarChar(30),role).input('PasswordHash',sql.NVarChar(255),placeholderPassword()).input('CodeHash',sql.NVarChar(128),codeHash(code)).query(`INSERT dbo.Users(Email,FirstName,LastName,Role,IsActive,PasswordHash,MustSetPassword,ActivationCodeHash) OUTPUT inserted.UserId VALUES(@Email,@FirstName,@LastName,@Role,1,@PasswordHash,1,@CodeHash)`);
    const userId=ur.recordset[0].UserId;await setTeams(tx,userId,role,teamIds);await tx.commit();return{status:201,headers:corsHeaders(),jsonBody:{success:true,userId,activationCode:code}}
   }catch(e){await tx.rollback();throw e}
  }
  if(!b.userId)return{status:400,headers:corsHeaders(),jsonBody:{error:'Ongeldige gebruiker.'}};
  if(b.action==='resetCode'){
   const code=makeCode();await pool.request().input('UserId',sql.Int,+b.userId).input('CodeHash',sql.NVarChar(128),codeHash(code)).input('PasswordHash',sql.NVarChar(255),placeholderPassword()).query(`UPDATE dbo.Users SET ActivationCodeHash=@CodeHash,MustSetPassword=1,IsActive=1,PasswordHash=@PasswordHash WHERE UserId=@UserId AND Role IN ('TNTEvaluator','Admin')`);return{status:200,headers:corsHeaders(),jsonBody:{success:true,activationCode:code}}
  }
  if(!roles.includes(b.role))return{status:400,headers:corsHeaders(),jsonBody:{error:'Ongeldige rol.'}};
  if(+b.userId===+admin.userId&&b.role!=='Admin')return{status:400,headers:corsHeaders(),jsonBody:{error:'Je kunt je eigen Admin-rol hier niet verwijderen.'}};
  if(b.role==='TNTEvaluator'&&!teamIds.length)return{status:400,headers:corsHeaders(),jsonBody:{error:'Kies minstens één team voor een TNT Evaluator.'}};
  const tx=new sql.Transaction(pool);await tx.begin();try{const target=await new sql.Request(tx).input('UserId',sql.Int,+b.userId).query(`SELECT Role,IsActive FROM dbo.Users WHERE UserId=@UserId`);if(!target.recordset.length){await tx.rollback();return{status:404,headers:corsHeaders(),jsonBody:{error:'Gebruiker niet gevonden.'}}}const isActive=target.recordset[0].Role==='TNTEvaluator'?(b.isActive!==false):true;await new sql.Request(tx).input('UserId',sql.Int,+b.userId).input('Role',sql.NVarChar(30),b.role).input('IsActive',sql.Bit,isActive).input('FirstName',sql.NVarChar(100),String(b.firstName||'').trim()).input('LastName',sql.NVarChar(100),String(b.lastName||'').trim()).input('Email',sql.NVarChar(255),String(b.email||'').trim().toLowerCase()).query(`UPDATE dbo.Users SET Role=@Role,IsActive=@IsActive,FirstName=@FirstName,LastName=@LastName,Email=@Email WHERE UserId=@UserId`);await setTeams(tx,+b.userId,b.role,teamIds);await tx.commit();return{status:200,headers:corsHeaders(),jsonBody:{success:true,isActive}}}catch(e){await tx.rollback();throw e}
 }catch(e){ctx.error(e);return{status:e.status||500,headers:corsHeaders(),jsonBody:{error:e.message||'Gebruikersbeheer fout.'}}}
}});
