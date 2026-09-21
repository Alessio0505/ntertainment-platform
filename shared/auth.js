const jwt = require('jsonwebtoken');

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
}

function requireTntUser(request, allowedRoles = ['Admin','TNTCoach','TNTEvaluator']) {
  const auth = request.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) {
    const e = new Error('Niet aangemeld.'); e.status = 401; throw e;
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) { const e = new Error('JWT_SECRET ontbreekt in Azure configuration.'); e.status = 500; throw e; }
  let user;
  try { user = jwt.verify(auth.slice(7), secret); }
  catch { const e = new Error('Sessie is ongeldig of verlopen.'); e.status = 401; throw e; }
  if (!allowedRoles.includes(user.role)) { const e = new Error('Geen toegang tot TNT Evaluaties.'); e.status = 403; throw e; }
  return user;
}

module.exports = { corsHeaders, requireTntUser };
