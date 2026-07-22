/**
 * Orin E2E Framework - Test Helpers
 * Shared hooks, result tracking, and screenshot-on-failure wiring.
 */
'use strict';

const DriverFactory    = require('../utils/driverFactory');
const ScreenshotHelper = require('../utils/screenshotHelper');
const logger           = require('../utils/logger');

/**
 * Creates a standardised Mocha before/after lifecycle for a suite.
 * Usage: inside describe(), call setupSuite(ctx, 'SuiteName')
 *
 * @param {Object}  ctx          - Mocha context object (pass `this` from describe callback)
 * @param {string}  suiteName    - Human-readable suite name
 * @param {Array}   results      - Shared results array across all suites
 * @param {Object}  [opts]       - { browser, mobile }
 */
function setupSuite(ctx, suiteName, results, opts = {}) {
  let driver;
  let screenshotHelper;

  ctx.timeout(300_000); // 5 minutes per suite

  before(async function () {
    logger.suiteStart(suiteName);
    driver          = await DriverFactory.create(opts.browser, opts.mobile || false);
    screenshotHelper = new ScreenshotHelper(driver);
    ctx.driver          = driver;
    ctx.screenshotHelper = screenshotHelper;
  });

  afterEach(async function () {
    const test = this.currentTest;
    let screenshotPath = null;

    if (test.state === 'failed') {
      logger.fail(`${test.title}`);
      try {
        screenshotPath = await screenshotHelper.captureFailure(test.title);
      } catch {
        // swallow screenshot errors
      }
    } else {
      logger.pass(`${test.title}`);
    }

    results.push({
      suite:          suiteName,
      title:          test.title,
      status:         test.state,
      duration:       test.duration || 0,
      err:            test.err     || null,
      screenshotPath: screenshotPath,
    });
  });

  after(async function () {
    if (driver) {
      await driver.quit();
      logger.info(`Browser closed after suite: ${suiteName}`);
    }
  });

  return {
    get driver()          { return ctx.driver; },
    get screenshotHelper(){ return ctx.screenshotHelper; },
  };
}

module.exports = { setupSuite };
