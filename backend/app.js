const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const { requestLogger } = require('./middleware/logger');

dotenv.config();

// Fail fast if critical environment variables are missing
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Server cannot start.');
  process.exit(1);
}

const app = express();

// ==========================================
// SECURITY HEADERS (helmet)
// ==========================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
}));

// Remove X-Powered-By header
app.disable('x-powered-by');

// ==========================================
// CORS — Restricted Origins
// ==========================================
const allowedOrigins = [
  'https://orinacad.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5000'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for development; restrict in production
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours preflight cache
}));

// ==========================================
// BODY PARSING with Size Limits
// ==========================================
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// ==========================================
// COMPRESSION
// ==========================================
app.use(compression());

// ==========================================
// REQUEST LOGGING
// ==========================================
app.use(requestLogger);

// ==========================================
// RATE LIMITING
// ==========================================

// Strict Rate Limiter (10 requests per 1 second window)
const strictLimiter = rateLimit({
  windowMs: 1000, 
  max: 10, 
  message: { success: false, message: 'Too many requests' },
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
});

// General Rate Limiter (1000 requests per 15 minutes)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP Rate Limiter (5 requests per 1 minute)
const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many OTP requests. Try again in 1 minute.' },
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
});

// Creation Rate Limiter (20 requests per 1 minute)
const creationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many requests. Slow down.' },
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// ==========================================
// IMPORT ROUTES
// ==========================================
const eventRoutes = require('./routes/events');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const collabRoutes = require('./routes/collab');

// ==========================================
// APPLY SPECIFIC RATE LIMITERS
// ==========================================
app.use('/api/auth/login', strictLimiter);
app.use('/api/auth/send-otp', otpLimiter);
app.use('/api/users/profile', strictLimiter);
app.use('/api/events/:eventId/register', strictLimiter);
app.use('/api/collab/messages/send', creationLimiter);
app.use('/api/collab/team/create', creationLimiter);
app.use('/api/events', (req, res, next) => {
  if (req.method === 'GET' && req.path === '/') {
    return strictLimiter(req, res, next);
  }
  if (req.method === 'POST' && req.path === '/') {
    return creationLimiter(req, res, next);
  }
  next();
});

// ==========================================
// NO-CACHE HEADERS for Sensitive Endpoints
// ==========================================
app.use('/api/users', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  next();
});
app.use('/api/auth', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  next();
});

// ==========================================
// MOUNT ROUTES
// ==========================================
app.use('/api/events', eventRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/collab', collabRoutes);

// ==========================================
// PRIVACY POLICY ENDPOINT
// ==========================================
app.get('/privacy', (req, res) => {
  res.json({
    success: true,
    data: {
      title: 'Orin Privacy Policy',
      lastUpdated: '2026-07-24',
      sections: [
        { heading: 'Data Collection', content: 'We collect minimal personal information required for platform functionality.' },
        { heading: 'Data Usage', content: 'Your data is used solely for platform operations and event management.' },
        { heading: 'Data Retention', content: 'Data is retained for 2 years after last activity unless deletion is requested.' },
        { heading: 'Data Export', content: 'Users can export their data via GET /api/users/export.' },
        { heading: 'Data Deletion', content: 'Users can request data deletion via DELETE /api/users/profile.' },
        { heading: 'Contact', content: 'Email team.orin.support@gmail.com for privacy inquiries.' }
      ]
    }
  });
});

// ==========================================
// HEALTH CHECK
// ==========================================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==========================================
// 404 HANDLER
// ==========================================
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
  // Log the error internally but never expose stack traces
  console.error(`[ERROR] ${req.method} ${req.originalUrl}: ${err.message}`);
  
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'An internal error occurred'
      : err.message || 'An internal error occurred'
  });
});

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
  process.exit(1);
});

module.exports = app;
