// middleware/logger.js — Security Event Logging Service
const fs = require('fs');
const path = require('path');

// Security event types
const EVENT_TYPES = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  INVALID_TOKEN: 'INVALID_TOKEN',
  RATE_LIMIT_HIT: 'RATE_LIMIT_HIT',
  IDOR_ATTEMPT: 'IDOR_ATTEMPT',
  FORBIDDEN_ACCESS: 'FORBIDDEN_ACCESS',
  ADMIN_ACTION: 'ADMIN_ACTION',
  ROLE_CHANGE: 'ROLE_CHANGE',
  REGISTRATION: 'REGISTRATION',
  DATA_EXPORT: 'DATA_EXPORT',
  ACCOUNT_DELETE: 'ACCOUNT_DELETE'
};

// In-memory audit log (also written to console in structured format)
const auditLog = [];

/**
 * Log a security event with structured data.
 */
const logSecurityEvent = (eventType, details = {}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    eventType,
    ip: details.ip || 'unknown',
    userId: details.userId || 'anonymous',
    resource: details.resource || '',
    message: details.message || '',
    severity: details.severity || 'INFO'
  };

  auditLog.push(entry);

  // Structured JSON log output (production-ready for log aggregators)
  const logLevel = entry.severity === 'CRITICAL' ? 'ERROR' :
                   entry.severity === 'HIGH' ? 'WARN' : 'INFO';
  
  console[logLevel === 'ERROR' ? 'error' : logLevel === 'WARN' ? 'warn' : 'log'](
    JSON.stringify({ level: logLevel, ...entry })
  );
};

/**
 * Get all audit log entries (for admin review).
 */
const getAuditLog = () => [...auditLog];

/**
 * Express middleware to log all requests.
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 400) {
      logSecurityEvent('HTTP_ERROR', {
        ip: req.ip,
        userId: req.user?.id || 'anonymous',
        resource: `${req.method} ${req.originalUrl}`,
        message: `${res.statusCode} in ${duration}ms`,
        severity: res.statusCode >= 500 ? 'HIGH' : 'LOW'
      });
    }
  });
  next();
};

module.exports = {
  EVENT_TYPES,
  logSecurityEvent,
  getAuditLog,
  requestLogger
};
