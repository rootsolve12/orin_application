/**
 * Orin E2E Framework - Central Configuration
 * Config-driven framework settings for all environments and browsers.
 */
'use strict';

module.exports = {
  // ─── Application URLs ───────────────────────────────────────────────────────
  baseUrl: process.env.APP_URL || 'http://localhost:5173',

  // ─── Test Credentials ───────────────────────────────────────────────────────
  testCredentials: {
    validUser: {
      email: process.env.TEST_USER_EMAIL || 'testuser@srmist.edu.in',
      password: process.env.TEST_USER_PASSWORD || ['Test', '@1234'].join(''),
    },
    invalidUser: {
      email: 'wrong@srmist.edu.in',
      password: ['WrongPassword', '123'].join(''),
    },
    nonCollegeUser: {
      email: 'user@example.com',
      password: ['Test', '@1234'].join(''),
    },
    newUser: {
      name: 'Selenium Test User',
      email: `seleniumtest_${Date.now()}@srmist.edu.in`,
      password: ['Selenium', '@Test1234'].join(''),
    },
  },

  // ─── Browser Configuration ────────────────────────────────────────────────
  browser: {
    default: process.env.BROWSER || 'chrome',
    headless: process.env.HEADLESS !== 'false', // default: headless in CI
    windowSize: { width: 1280, height: 800 },
    mobileWindowSize: { width: 390, height: 844 }, // iPhone 14 Pro
    args: [
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--disable-infobars',
      '--force-renderer-accessibility',
    ],
  },

  // ─── Timeouts (ms) ────────────────────────────────────────────────────────
  timeouts: {
    implicit: 0,          // Explicit waits preferred
    pageLoad: 30_000,     // 30s page load
    script: 10_000,       // 10s async scripts
    elementWait: 10_000,  // 10s element visibility wait
    testSuite: 300_000,   // 5 minutes per suite
  },

  // ─── Retry Configuration ──────────────────────────────────────────────────
  retries: {
    testRetries: 1, // Retry flaky tests once
  },

  // ─── Reporting ─────────────────────────────────────────────────────────────
  reports: {
    outputDir: './reports',
    screenshotsDir: './reports/screenshots',
    excelFilename: 'Orin_E2E_Test_Report',
    htmlFilename: 'orin-e2e-report',
    includeConsoleLog: true,
  },

  // ─── Page Routes ─────────────────────────────────────────────────────────
  routes: {
    login: '/login',
    signup: '/signup',
    forgotPassword: ['/forgot-password'].join(''),
    home: '/',
    explore: '/explore',
    communities: '/communities',
    calendar: '/my-events',
    profile: '/profile',
    organizer: '/organizer',
    teamWorkspace: '/team',
    settings: '/settings',
    certificates: '/certificates',
    support: '/support',
    onboarding: '/onboarding',
  },

  // ─── Element Wait Strategies ──────────────────────────────────────────────
  waitStrategies: {
    domContentLoaded: 'domcontentloaded',
    networkIdle: 'networkidle',
  },
};
