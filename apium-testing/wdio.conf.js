/**
 * WebdriverIO + Appium Configuration for Orin Application E2E Tests
 *
 * Prerequisites:
 *   1. Appium server running:  npx appium
 *   2. Appium UiAutomator2 driver installed:  npx appium driver install uiautomator2
 *   3. Android emulator running or device connected
 *   4. Orin APK built:  flutter build apk --debug
 */

const path = require('path');

exports.config = {
  // ====================
  // Runner Configuration
  // ====================
  runner: 'local',
  port: 4723,

  // ============
  // Specs
  // ============
  specs: ['./tests/**/*.test.js'],
  exclude: [],

  // ============
  // Capabilities
  // ============
  maxInstances: 1,
  capabilities: [
    {
      'appium:platformName': 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': 'Android Emulator',
      'appium:app': path.resolve(
        __dirname,
        '../build/app/outputs/flutter-apk/app-debug.apk'
      ),
      'appium:appPackage': 'com.example.orin_application',
      'appium:appActivity': '.MainActivity',
      'appium:newCommandTimeout': 240,
      'appium:autoGrantPermissions': true,
      'appium:noReset': false,
      'appium:fullReset': false,
      'appium:uiautomator2ServerInstallTimeout': 60000,
      'appium:adbExecTimeout': 60000,
      'appium:ignoreHiddenApiPolicyError': true,
    },
  ],

  // ===================
  // Test Configuration
  // ===================
  logLevel: 'info',
  bail: 0,
  waitforTimeout: 15000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  // Framework
  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 120000,
  },

  // Reporter
  reporters: ['spec'],

  // =====
  // Hooks
  // =====
  beforeSession: function () {
    // Ensure clean state before each test session
  },

  before: function () {
    // Add custom commands or global setup
  },

  afterTest: async function (test, context, { error }) {
    if (error) {
      // Take screenshot on failure for debugging
      const timestamp = Date.now();
      const screenshotDir = path.resolve(__dirname, 'screenshots');
      const fs = require('fs');
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }
      await browser.saveScreenshot(
        path.join(screenshotDir, `FAIL_${test.title.replace(/\s+/g, '_')}_${timestamp}.png`)
      );
    }
  },
};
