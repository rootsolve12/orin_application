/**
 * Orin E2E Framework - Screenshot Utility
 * Captures screenshots on test failures and saves them with timestamped filenames.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const config = require('../config/framework.config');
const logger = require('./logger');

class ScreenshotHelper {
  constructor(driver) {
    this.driver = driver;
    this.screenshotsDir = config.reports.screenshotsDir;
    this._ensureDir();
  }

  _ensureDir() {
    if (!fs.existsSync(this.screenshotsDir)) {
      fs.mkdirSync(this.screenshotsDir, { recursive: true });
    }
  }

  /**
   * Take a screenshot and save it to the screenshots directory.
   * @param {string} testName - The test name (used as filename prefix)
   * @param {string} [label=''] - Optional label (e.g., 'failure', 'baseline')
   * @returns {Promise<string>} Absolute path to the saved screenshot
   */
  async capture(testName, label = '') {
    const safeName = testName
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .substring(0, 80);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const labelPart = label ? `_${label}` : '';
    const filename = `${safeName}${labelPart}_${timestamp}.png`;
    const filepath = path.join(this.screenshotsDir, filename);

    try {
      const base64Data = await this.driver.takeScreenshot();
      fs.writeFileSync(filepath, base64Data, 'base64');
      logger.info(`📸 Screenshot saved: ${filename}`);
      return filepath;
    } catch (err) {
      logger.error(`Failed to capture screenshot: ${err.message}`);
      return null;
    }
  }

  /**
   * Capture a failure screenshot with a 'FAIL' label.
   * @param {string} testName
   * @returns {Promise<string|null>}
   */
  async captureFailure(testName) {
    return this.capture(testName, 'FAIL');
  }

  /**
   * Get list of all screenshots taken in this session.
   * @returns {string[]} Array of filenames
   */
  list() {
    return fs.existsSync(this.screenshotsDir)
      ? fs.readdirSync(this.screenshotsDir).filter(f => f.endsWith('.png'))
      : [];
  }
}

module.exports = ScreenshotHelper;
