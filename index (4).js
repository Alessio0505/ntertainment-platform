const {app}=require('@azure/functions');
const crypto=require('crypto');
const {getPool,sql}=require('../shared/db');
const {corsHeaders}=require('../shared/auth');
function codeHash(code){return crypto.createHash('sha256').update(String(code).trim().toUpperCase()).digest('hex')}
function passwordHash(password){const salt=crypto.randomBytes(16),hash=crypto.scryptSync(password,salt,64);return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`}
app.http('TNTActivate',{methods:['POST','OPTIONS'],authLevel:'anonymous',handler:async(req,ctx)=>{
 if(req.method==='OPTIONS')return{status:204,headers:corsHeaders()};
 try{
  const b=await req.json(),email=String(b.email||'').trim().toLowerCase(),code=String(b.code||'').trim(),password=String(b.password||'');
  if(!email||!code||!password)return{status:400,headers:corsHeaders(),jsonBody:{error:'E-mailadres, activatiecode en nieuw wachtwoord zijn verplicht.'}};
  if(password.length<8)return{status:400,headers:corsHeaders(),jsonBody:{error:'Het wachtwoord moet minimaal 8 tekens bevatten.'}};
  const pool=await getPool();
  const r=await pool.request().input('Email',sql.NVarChar(255),email).input('CodeHash',sql.NVarChar(128),codeHash(code)).query(`SELECT UserId,Role,IsActive,MustSetPassword FROM dbo.Users WHERE LOWER(Email)=@Email AND ActivationCodeHash=@CodeHash`);
  if(!r.recordset.length)return{status:400,headers:corsHeaders(),jsonBody:{error:'E-mailadres of activatiecode is niet correct.'}};
  const u=r.recordset[0];
  if(!['TNTEvaluator','Admin'].includes(u.Role))return{status:403,headers:corsHeaders(),jsonBody:{error:'Dit account is niet geactiveerd voor TNT.'}};
  await pool.request().input('UserId',sql.Int,u.UserId).input('PasswordHash',sql.NVarChar(255),passwordHash(password)).query(`UPDATE dbo.Users SET PasswordHash=@PasswordHash,IsActive=1,MustSetPassword=0,ActivationCodeHash=NULL WHERE UserId=@UserId`);
  return{status:200,headers:corsHeaders(),jsonBody:{success:true,message:'Account geactiveerd. Je kunt nu aanmelden.'}};
 }catch(e){ctx.error(e);return{status:500,headers:corsHeaders(),jsonBody:{error:'Activeren is mislukt.'}}}
}});
