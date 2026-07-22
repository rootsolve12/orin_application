/**
 * Orin E2E Framework - Winston Logger Utility
 * Provides structured, leveled logging with file and console transports.
 */
'use strict';

const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logsDir = path.join(__dirname, '..', 'reports', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const { combine, timestamp, printf, colorize, align } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : '';
  return `[${ts}] [${level.toUpperCase().padEnd(5)}] ${message}${metaStr}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // Console — colorized
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'HH:mm:ss' }),
        align(),
        printf(({ level, message, timestamp: ts }) => `${ts} ${level}: ${message}`)
      ),
    }),
    // File — all logs
    new winston.transports.File({
      filename: path.join(logsDir, 'e2e-all.log'),
      maxsize: 5_242_880, // 5MB
      maxFiles: 5,
    }),
    // File — errors only
    new winston.transports.File({
      filename: path.join(logsDir, 'e2e-errors.log'),
      level: 'error',
      maxsize: 5_242_880,
      maxFiles: 3,
    }),
  ],
});

/**
 * Convenience wrappers for common log actions
 */
logger.step = (msg) => logger.info(`  ► STEP: ${msg}`);
logger.pass = (msg) => logger.info(`  ✅ PASS: ${msg}`);
logger.fail = (msg) => logger.error(`  ❌ FAIL: ${msg}`);
logger.warn = (msg) => logger.warn(`  ⚠️  WARN: ${msg}`);
logger.testStart = (name) => logger.info(`\n${'─'.repeat(70)}\n🧪 TEST: ${name}\n${'─'.repeat(70)}`);
logger.suiteStart = (name) => logger.info(`\n${'═'.repeat(70)}\n📋 SUITE: ${name}\n${'═'.repeat(70)}`);

module.exports = logger;
