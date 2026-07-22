/**
 * Orin E2E Framework - Driver Factory
 * Creates and configures Selenium WebDriver instances for Chrome, Edge, Firefox.
 */
'use strict';

const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const edge = require('selenium-webdriver/edge');
const firefox = require('selenium-webdriver/firefox');
const config = require('../config/framework.config');
const logger = require('./logger');

class DriverFactory {
  /**
   * Build a configured WebDriver instance.
   * @param {string} browserName - 'chrome' | 'edge' | 'firefox'
   * @param {boolean} [mobile=false] - Emulate mobile viewport
   * @returns {Promise<WebDriver>}
   */
  static async create(browserName = config.browser.default, mobile = false) {
    const browser = browserName.toLowerCase();
    logger.info(`Launching browser: ${browser} | headless: ${config.browser.headless} | mobile: ${mobile}`);

    let driver;

    switch (browser) {
      case 'chrome': {
        const opts = new chrome.Options();
        const args = [...config.browser.args];
        if (config.browser.headless) args.push('--headless=new');
        args.forEach(a => opts.addArguments(a));

        if (mobile) {
          opts.setMobileEmulation({
            deviceMetrics: {
              width: config.browser.mobileWindowSize.width,
              height: config.browser.mobileWindowSize.height,
              pixelRatio: 3,
            },
            userAgent:
              'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
          });
        }

        driver = await new Builder()
          .forBrowser('chrome')
          .setChromeOptions(opts)
          .build();
        break;
      }

      case 'edge': {
        const opts = new edge.Options();
        const args = [...config.browser.args];
        if (config.browser.headless) args.push('--headless=new');
        args.forEach(a => opts.addArguments(a));

        driver = await new Builder()
          .forBrowser('MicrosoftEdge')
          .setEdgeOptions(opts)
          .build();
        break;
      }

      case 'firefox': {
        const opts = new firefox.Options();
        if (config.browser.headless) opts.addArguments('-headless');

        driver = await new Builder()
          .forBrowser('firefox')
          .setFirefoxOptions(opts)
          .build();
        break;
      }

      default:
        throw new Error(`Unsupported browser: ${browser}. Use 'chrome', 'edge', or 'firefox'.`);
    }

    // Set window size for non-mobile
    if (!mobile) {
      await driver.manage().window().setRect(config.browser.windowSize);
    }

    // Set timeouts
    await driver.manage().setTimeouts({
      implicit: config.timeouts.implicit,
      pageLoad: config.timeouts.pageLoad,
      script: config.timeouts.script,
    });

    return driver;
  }
}

module.exports = DriverFactory;
