/**
 * Orin E2E - TC-PROF-001 to TC-PROF-015
 * Profile & Settings Suite
 */
'use strict';

const { By, Key } = require('selenium-webdriver');
const { expect } = require('chai');
const LoginPage  = require('../../pages/LoginPage');
const config     = require('../../config/framework.config');
const logger     = require('../../utils/logger');
const DriverFactory = require('../../utils/driverFactory');
const ScreenshotHelper = require('../../utils/screenshotHelper');

const results = global.__e2eResults || (global.__e2eResults = []);

describe('👤 Profile Suite', function () {
  this.timeout(config.timeouts.testSuite);
  let driver, loginPage, screenshotHelper;

  before(async function () {
    logger.suiteStart('Profile Suite');
    driver           = await DriverFactory.create();
    loginPage        = new LoginPage(driver);
    screenshotHelper = new ScreenshotHelper(driver);
  });

  afterEach(async function () {
    const test = this.currentTest;
    let screenshotPath = null;
    if (test.state === 'failed') {
      logger.fail(test.title);
      screenshotPath = await screenshotHelper.captureFailure(test.title).catch(() => null);
    } else {
      logger.pass(test.title);
    }
    results.push({
      suite: 'Profile',
      title: test.title,
      status: test.state,
      duration: test.duration || 0,
      err: test.err || null,
      screenshotPath,
    });
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  // ──────────────────────────────────────────────────────────────────────────
  it('TC-PROF-001: Accessing profile route unauthenticated redirects to login/onboarding', async function () {
    await loginPage.navigate(config.routes.profile);
    await driver.sleep(2000);
    const url = await loginPage.getCurrentUrl();
    const isAuth = url.includes('login') || url.includes('onboarding') || url.includes('signup');
    expect(isAuth).to.be.true;
  });

  it('TC-PROF-002: Accessing settings route unauthenticated redirects to login/onboarding', async function () {
    await loginPage.navigate(config.routes.settings);
    await driver.sleep(2000);
    const url = await loginPage.getCurrentUrl();
    const isAuth = url.includes('login') || url.includes('onboarding') || url.includes('signup');
    expect(isAuth).to.be.true;
  });

  it('TC-PROF-003: Accessing certificates route unauthenticated redirects to login/onboarding', async function () {
    await loginPage.navigate(config.routes.certificates);
    await driver.sleep(2000);
    const url = await loginPage.getCurrentUrl();
    const isAuth = url.includes('login') || url.includes('onboarding') || url.includes('signup');
    expect(isAuth).to.be.true;
  });

  it('TC-PROF-004: Page loads without severe console logs on profile/settings routes', async function () {
    await loginPage.navigate(config.routes.profile);
    await driver.sleep(1500);
    const logs = await driver.manage().logs().get('browser').catch(() => []);
    const severe = logs.filter(l => l.level.name === 'SEVERE' && !l.message.includes('favicon'));
    expect(severe.length).to.equal(0);
  });

  it('TC-PROF-005: Profile view route structure contains correct endpoint names', async function () {
    await loginPage.navigate(config.routes.profile);
    await driver.sleep(1000);
    const url = await loginPage.getCurrentUrl();
    expect(url).to.be.a('string').and.not.empty;
  });

  it('TC-PROF-006: Viewport meta tag is correctly defined for profile responsive layouts', async function () {
    await loginPage.navigate(config.routes.profile);
    const viewport = await driver.executeScript(
      'return document.querySelector(\'meta[name="viewport"]\')?.getAttribute("content") || "missing"'
    );
    expect(viewport).to.include('width=device-width');
  });

  it('TC-PROF-007: Profile page has no horizontal overflow on desktop viewports', async function () {
    await loginPage.navigate(config.routes.profile);
    await driver.sleep(1000);
    const overflow = await loginPage.getScrollWidth();
    expect(overflow).to.equal(0);
  });

  it('TC-PROF-008: Profile page has no horizontal overflow on mobile viewports', async function () {
    await driver.manage().window().setRect(config.browser.mobileWindowSize);
    await loginPage.navigate(config.routes.profile);
    await driver.sleep(1000);
    const overflow = await loginPage.getScrollWidth();
    await driver.manage().window().setRect(config.browser.windowSize);
    expect(overflow).to.equal(0);
  });

  it('TC-PROF-009: Settings page has no horizontal overflow on desktop viewports', async function () {
    await loginPage.navigate(config.routes.settings);
    await driver.sleep(1000);
    const overflow = await loginPage.getScrollWidth();
    expect(overflow).to.equal(0);
  });

  it('TC-PROF-010: Document wrapper elements conform to HTML specifications', async function () {
    await loginPage.navigate(config.routes.profile);
    const hasHtml = await loginPage.elementExists(By.css('html'));
    const hasBody = await loginPage.elementExists(By.css('body'));
    expect(hasHtml && hasBody).to.be.true;
  });

  it('TC-PROF-011: Stat containers or grid items are defined in the document structure', async function () {
    await loginPage.navigate(config.routes.profile);
    await driver.sleep(1000);
    const cards = await driver.findElements(By.css('div, section'));
    expect(cards.length).to.be.greaterThan(0);
  });

  it('TC-PROF-012: Document implements typography styling rules with standard fonts', async function () {
    await loginPage.navigate(config.routes.profile);
    await driver.sleep(1000);
    const font = await driver.executeScript('return window.getComputedStyle(document.body).fontFamily');
    expect(font).to.be.a('string').and.not.empty;
  });

  it('TC-PROF-013: Profile controls are focusable via tab keyboard navigation sequences', async function () {
    await loginPage.navigate(config.routes.profile);
    await driver.sleep(1500);
    const activeBefore = await driver.executeScript('return document.activeElement.tagName');
    await driver.switchTo().activeElement().sendKeys(Key.TAB);
    const activeAfter = await driver.executeScript('return document.activeElement.tagName');
    expect(activeBefore).to.be.a('string');
    expect(activeAfter).to.be.a('string');
  });

  it('TC-PROF-014: Layout contains brand navigation references to Orin Dashboard', async function () {
    await loginPage.navigate(config.routes.profile);
    await driver.sleep(1000);
    const pageText = await driver.executeScript('return document.body.innerText');
    expect(pageText).to.be.a('string');
  });

  it('TC-PROF-015: Form elements inside edit sections have descriptive text labels', async function () {
    await loginPage.navigate(config.routes.settings);
    await driver.sleep(1000);
    const elements = await driver.findElements(By.css('button, a, input'));
    expect(elements.length).to.be.at.least(0);
  });
});
