/**
 * Orin E2E Framework - Global Mocha Root Hooks (Mocha 8+ API)
 * Uses the `mochaHooks` export to integrate with Mocha's Root Hooks Plugin.
 * Run with: mocha --require rootHooks.js ...
 */
'use strict';

const { generateReport } = require('./utils/excelReporter');
const config = require('./config/framework.config');
const logger = require('./utils/logger');

// Initialise shared results array at module load time
global.__e2eResults = global.__e2eResults || [];

exports.mochaHooks = {
  beforeAll() {
    logger.info('═══════════════════════════════════════════════════════════════════════');
    logger.info('  🟣  ORIN E2E AUTOMATION FRAMEWORK — TEST RUN STARTED               ');
    logger.info('═══════════════════════════════════════════════════════════════════════');
    logger.info(`  Base URL : ${config.baseUrl}`);
    logger.info(`  Browser  : ${config.browser.default}`);
    logger.info(`  Headless : ${config.browser.headless}`);
    logger.info('═══════════════════════════════════════════════════════════════════════\n');
  },

  async afterAll() {
    const results = global.__e2eResults || [];

    logger.info('\n═══════════════════════════════════════════════════════════════════════');
    logger.info('  📊  ALL SUITES COMPLETE — GENERATING REPORTS                       ');
    logger.info('═══════════════════════════════════════════════════════════════════════');

    const passed  = results.filter(r => r.status === 'passed').length;
    const failed  = results.filter(r => r.status === 'failed').length;
    const total   = results.length;
    const rate    = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';

    logger.info(`  Total: ${total} | ✅ Passed: ${passed} | ❌ Failed: ${failed} | 📈 Rate: ${rate}%`);

    try {
      await generateReport(results, {
        browser: config.browser.default,
        environment: process.env.NODE_ENV || 'local',
        baseUrl: config.baseUrl,
      });
    } catch (err) {
      logger.error(`Failed to generate Excel report: ${err.message}`);
    }

    logger.info('\n  Reports saved to: ./reports/');
    logger.info('═══════════════════════════════════════════════════════════════════════\n');
  },
};
