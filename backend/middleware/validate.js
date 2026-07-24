// middleware/validate.js — Input Validation & Sanitization Utilities
const crypto = require('crypto');

/**
 * Sanitize a string by removing HTML tags and trimming whitespace.
 * Prevents XSS when user-supplied values are stored or rendered.
 */
const sanitize = (value) => {
  if (typeof value !== 'string') return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
};

/**
 * HTML-encode a value for safe insertion into HTML email templates.
 */
const htmlEncode = (value) => {
  if (typeof value !== 'string') return String(value);
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

/**
 * Validate email format.
 */
const isValidEmail = (email) => {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

/**
 * Validate URL format (must be http or https).
 */
const isValidUrl = (url) => {
  if (typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

/**
 * Validate ISO 8601 date string.
 */
const isValidISODate = (dateStr) => {
  if (typeof dateStr !== 'string') return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
};

/**
 * Check if a URL is internal/loopback (SSRF prevention).
 */
const isInternalUrl = (url) => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.startsWith('172.') ||
      host === '169.254.169.254' ||
      host.endsWith('.internal');
  } catch {
    return true; // Invalid URLs are blocked
  }
};

/**
 * Generate a cryptographically secure random ID.
 */
const generateId = (prefix = '') => {
  return `${prefix}${crypto.randomUUID()}`;
};

/**
 * Generate a cryptographically secure invite code.
 */
const generateInviteCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

/**
 * Sanitize an object by sanitizing all string values (shallow).
 * Removes __proto__ and constructor to prevent prototype pollution.
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    // Prevent prototype pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    if (typeof value === 'string') {
      clean[key] = sanitize(value);
    } else if (Array.isArray(value)) {
      clean[key] = value.map(v => typeof v === 'string' ? sanitize(v) : v);
    } else {
      clean[key] = value;
    }
  }
  return clean;
};

/**
 * Validate that a value is a positive integer.
 */
const isPositiveInt = (val) => {
  return Number.isInteger(val) && val > 0;
};

/**
 * Validate score is within range.
 */
const isValidScore = (score) => {
  return typeof score === 'number' && score >= 0 && score <= 100;
};

module.exports = {
  sanitize,
  htmlEncode,
  isValidEmail,
  isValidUrl,
  isValidISODate,
  isInternalUrl,
  generateId,
  generateInviteCode,
  sanitizeObject,
  isPositiveInt,
  isValidScore
};
