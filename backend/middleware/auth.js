const jwt = require('jsonwebtoken');
const { logSecurityEvent, EVENT_TYPES } = require('./logger');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logSecurityEvent(EVENT_TYPES.INVALID_TOKEN, {
      ip: req.ip,
      resource: `${req.method} ${req.originalUrl}`,
      message: 'Missing or malformed Authorization header',
      severity: 'LOW'
    });
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  if (!token || token.trim() === '') {
    logSecurityEvent(EVENT_TYPES.INVALID_TOKEN, {
      ip: req.ip,
      resource: `${req.method} ${req.originalUrl}`,
      message: 'Empty token string',
      severity: 'LOW'
    });
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    // No fallback secret — JWT_SECRET must be set (enforced in app.js)
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'] // Explicitly restrict algorithms to prevent alg:none attacks
    });
    req.user = decoded;
    next();
  } catch (err) {
    logSecurityEvent(EVENT_TYPES.INVALID_TOKEN, {
      ip: req.ip,
      resource: `${req.method} ${req.originalUrl}`,
      message: `JWT verification failed: ${err.message}`,
      severity: 'MEDIUM'
    });
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      logSecurityEvent(EVENT_TYPES.FORBIDDEN_ACCESS, {
        ip: req.ip,
        userId: req.user?.id || 'unknown',
        resource: `${req.method} ${req.originalUrl}`,
        message: `Role '${req.user?.role}' not in required roles: ${roles.join(', ')}`,
        severity: 'HIGH'
      });
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  requireRole
};
