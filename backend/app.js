const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Strict Rate Limiter (10 requests per 1 second window)
// Perfect for blocking high-velocity bursts while allowing sequential test suites.
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

app.use(generalLimiter);

// Import Routes
const eventRoutes = require('./routes/events');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const collabRoutes = require('./routes/collab');

// Apply strict rate limiting to targeted endpoints specifically
app.use('/api/auth/login', strictLimiter);
app.use('/api/users/profile', strictLimiter);
app.use('/api/events/:eventId/register', strictLimiter);
app.use('/api/events', (req, res, next) => {
  if (req.method === 'GET' && req.path === '/') {
    return strictLimiter(req, res, next);
  }
  next();
});

// Mount Routes
app.use('/api/events', eventRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/collab', collabRoutes);

module.exports = app;

