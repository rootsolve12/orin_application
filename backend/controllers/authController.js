const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../services/emailService');
const { isValidEmail, sanitize } = require('../middleware/validate');
const { logSecurityEvent, EVENT_TYPES } = require('../middleware/logger');

// ==========================================
// Simulated User Database with hashed passwords
// In production, use a real database with bcrypt-hashed passwords.
// ==========================================
const usersDb = {
  'user_001': {
    id: 'user_001',
    email: 'hitesh@srmist.edu.in',
    // Simulated hash for password "TestPass123!" (in production use bcrypt)
    passwordHash: 'simulated_bcrypt_hash_TestPass123!',
    role: 'participant',
    name: 'Hitesh B'
  },
  'user_002': {
    id: 'user_002',
    email: 'organizer@srmist.edu.in',
    passwordHash: 'simulated_bcrypt_hash_OrgPass456!',
    role: 'organizer',
    name: 'Organizer User'
  },
  'user_003': {
    id: 'user_003',
    email: 'admin@srmist.edu.in',
    passwordHash: 'simulated_bcrypt_hash_AdminPass789!',
    role: 'admin',
    name: 'Admin User'
  }
};

// OTP storage (for tracking and preventing replay)
const otpStore = new Map(); // email -> { otp, expiresAt, attempts }

// Token blacklist for logout/revocation
const tokenBlacklist = new Set();

/**
 * Simulate password verification.
 * In production, use bcrypt.compare(password, user.passwordHash).
 */
const verifyPassword = (password, hash) => {
  // Simulated: extract the expected password from the mock hash format
  const expected = hash.replace('simulated_bcrypt_hash_', '');
  return password === expected;
};

/**
 * Find user by email in the simulated database.
 */
const findUserByEmail = (email) => {
  return Object.values(usersDb).find(u => u.email === email.toLowerCase());
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  // Input presence validation
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  // Type validation
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ success: false, message: 'Email and password must be strings' });
  }

  // Length validation
  if (email.length > 254 || password.length > 128) {
    return res.status(400).json({ success: false, message: 'Input too long' });
  }

  // Email format validation
  if (!isValidEmail(email)) {
    logSecurityEvent(EVENT_TYPES.LOGIN_FAILURE, {
      ip: req.ip,
      message: 'Invalid email format',
      severity: 'LOW'
    });
    return res.status(400).json({ success: false, message: 'Invalid email format' });
  }

  // Look up user in database (role comes from DB, NOT from email content)
  const user = findUserByEmail(email);

  if (!user) {
    logSecurityEvent(EVENT_TYPES.LOGIN_FAILURE, {
      ip: req.ip,
      message: 'User not found',
      severity: 'MEDIUM'
    });
    // Generic message to prevent user enumeration
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // Verify password against hashed password in database
  if (!verifyPassword(password, user.passwordHash)) {
    logSecurityEvent(EVENT_TYPES.LOGIN_FAILURE, {
      ip: req.ip,
      userId: user.id,
      message: 'Incorrect password',
      severity: 'MEDIUM'
    });
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // Generate unique JWT with user ID from database
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h', algorithm: 'HS256' }
  );

  logSecurityEvent(EVENT_TYPES.LOGIN_SUCCESS, {
    ip: req.ip,
    userId: user.id,
    message: `Successful login as ${user.role}`,
    severity: 'INFO'
  });

  res.json({
    success: true,
    token,
    user: { id: user.id, name: sanitize(user.name), email: user.email, role: user.role }
  });
};

exports.sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, message: 'Valid email required' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email format' });
  }

  // Generate OTP server-side (don't trust client-provided OTP)
  const otp = crypto.randomInt(100000, 999999).toString();

  // Store OTP with expiry for replay prevention
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    attempts: 0
  });

  // Clean up expired OTPs
  for (const [key, val] of otpStore.entries()) {
    if (val.expiresAt < Date.now()) otpStore.delete(key);
  }

  const success = await emailService.sendOtpVerification(email, otp);
  if (success) {
    // Generic response to prevent email enumeration
    res.json({ success: true, message: 'If the email is registered, an OTP has been sent.' });
  } else {
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

exports.verifyOtp = (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP required' });
  }

  const stored = otpStore.get(email);
  if (!stored) {
    return res.status(400).json({ success: false, message: 'No OTP requested for this email' });
  }

  // Check expiry
  if (stored.expiresAt < Date.now()) {
    otpStore.delete(email);
    return res.status(400).json({ success: false, message: 'OTP has expired' });
  }

  // Check attempts (brute force protection)
  stored.attempts += 1;
  if (stored.attempts > 5) {
    otpStore.delete(email);
    return res.status(429).json({ success: false, message: 'Too many attempts. Request a new OTP.' });
  }

  if (stored.otp !== otp) {
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }

  // OTP verified — remove from store (prevent replay)
  otpStore.delete(email);
  res.json({ success: true, message: 'Email verified successfully' });
};

exports.logout = (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    tokenBlacklist.add(token);
    logSecurityEvent(EVENT_TYPES.LOGIN_SUCCESS, {
      ip: req.ip,
      userId: req.user?.id,
      message: 'User logged out, token revoked',
      severity: 'INFO'
    });
  }
  res.json({ success: true, message: 'Logged out successfully' });
};

exports.refreshToken = (req, res) => {
  // Issue a new token with the same claims but fresh expiry
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const token = jwt.sign(
    { id: req.user.id, email: req.user.email, role: req.user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h', algorithm: 'HS256' }
  );

  res.json({ success: true, token });
};

// Export for testing
exports._tokenBlacklist = tokenBlacklist;
exports._usersDb = usersDb;
