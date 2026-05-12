const crypto = require('crypto');
const sessions = new Map();

function createToken(user) {
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, { id: user.id, role: user.role, name: user.full_name });
  return token;
}

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token || !sessions.has(token)) return res.status(401).json({ error: 'Unauthorized' });
  req.user = sessions.get(token);
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden for role' });
    next();
  };
}

module.exports = { createToken, requireAuth, requireRole };
