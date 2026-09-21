const sql = require('mssql');
let pool;
async function getPool(){
  if (pool && pool.connected) return pool;
  pool = await sql.connect({
    server: process.env.SQL_SERVER,
    database: process.env.SQL_DATABASE,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    options:{ encrypt:true, trustServerCertificate:false }
  });
  return pool;
}
module.exports = { sql, getPool };
