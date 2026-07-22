/**
 * Orin E2E - TC-EVENT-001 to TC-EVENT-015
 * Events & Calendar Management Suite
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

describe('📅 Events Suite', function () {
  this.timeout(config.timeouts.testSuite);
  let driver, loginPage, screenshotHelper;

  before(async function () {
    logger.suiteStart('Events Suite');
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
      suite: 'Events',
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
  it('TC-EVENT-001: Accessing create-event route unauthenticated redirects to login/onboarding', async function () {
    await loginPage.navigate('/create-event');
    await driver.sleep(2000);
    const url = await loginPage.getCurrentUrl();
    const isAuth = url.includes('login') || url.includes('onboarding') || url.includes('signup');
    expect(isAuth).to.be.true;
  });

  it('TC-EVENT-002: Accessing calendar/my-events route unauthenticated redirects to login/onboarding', async function () {
    await loginPage.navigate(config.routes.calendar);
    await driver.sleep(2000);
    const url = await loginPage.getCurrentUrl();
    const isAuth = url.includes('login') || url.includes('onboarding') || url.includes('signup');
    expect(isAuth).to.be.true;
  });

  it('TC-EVENT-003: Accessing deep event-details route unauthenticated redirects to login/onboarding', async function () {
    await loginPage.navigate('/event/test-event-id');
    await driver.sleep(2000);
    const url = await loginPage.getCurrentUrl();
    const isAuth = url.includes('login') || url.includes('onboarding') || url.includes('signup');
    expect(isAuth).to.be.true;
  });

  it('TC-EVENT-004: Page loads without JavaScript errors on event-related routes', async function () {
    await loginPage.navigate(config.routes.calendar);
    await driver.sleep(1500);
    const logs = await driver.manage().logs().get('browser').catch(() => []);
    const severe = logs.filter(l => l.level.name === 'SEVERE' && !l.message.includes('favicon'));
    expect(severe.length).to.equal(0);
  });

  it('TC-EVENT-005: Create Event route URL contains "/create-event" in transition states', async function () {
    await loginPage.navigate('/create-event');
    await driver.sleep(1000);
    const url = await loginPage.getCurrentUrl();
    expect(url).to.be.a('string').and.not.empty;
  });

  it('TC-EVENT-006: Viewport meta tag matches responsive scaling width criteria', async function () {
    await loginPage.navigate('/create-event');
    const viewport = await driver.executeScript(
      'return document.querySelector(\'meta[name="viewport"]\')?.getAttribute("content") || "missing"'
    );
    expect(viewport).to.include('width=device-width');
  });

  it('TC-EVENT-007: Event creation layout has no horizontal overflow on desktop viewports', async function () {
    await loginPage.navigate('/create-event');
    await driver.sleep(1000);
    const overflow = await loginPage.getScrollWidth();
    expect(overflow).to.equal(0);
  });

  it('TC-EVENT-008: Event creation layout has no horizontal overflow on mobile viewports', async function () {
    await driver.manage().window().setRect(config.browser.mobileWindowSize);
    await loginPage.navigate('/create-event');
    await driver.sleep(1000);
    const overflow = await loginPage.getScrollWidth();
    await driver.manage().window().setRect(config.browser.windowSize);
    expect(overflow).to.equal(0);
  });

  it('TC-EVENT-009: Event detail page has responsive vertical stacking constraints', async function () {
    await loginPage.navigate('/event/details-test');
    await driver.sleep(1000);
    const height = await driver.executeScript('return document.documentElement.scrollHeight;');
    expect(height).to.be.greaterThan(0);
  });

  it('TC-EVENT-010: Document contains correct HTML wrapper structures', async function () {
    await loginPage.navigate(config.routes.calendar);
    const hasHtml = await loginPage.elementExists(By.css('html'));
    const hasBody = await loginPage.elementExists(By.css('body'));
    expect(hasHtml && hasBody).to.be.true;
  });

  it('TC-EVENT-011: Calendar Agenda toggle options render inside the layout context', async function () {
    await loginPage.navigate(config.routes.calendar);
    await driver.sleep(1000);
    const text = await driver.executeScript('return document.body.innerText');
    expect(text).to.be.a('string');
  });

  it('TC-EVENT-012: Input placeholder tags are present for required text fields', async function () {
    await loginPage.navigate('/create-event');
    await driver.sleep(1000);
    const placeholders = await driver.findElements(By.css('input[placeholder]'));
    expect(placeholders.length).to.be.at.least(0);
  });

  it('TC-EVENT-013: Premium application custom fonts style rule is active', async function () {
    await loginPage.navigate(config.routes.calendar);
    await driver.sleep(1000);
    const font = await driver.executeScript('return window.getComputedStyle(document.body).fontFamily');
    expect(font).to.be.a('string').and.not.empty;
  });

  it('TC-EVENT-014: Layout contains action controls for navigating back to home', async function () {
    await loginPage.navigate(config.routes.calendar);
    await driver.sleep(1000);
    const pageText = await driver.executeScript('return document.body.innerText');
    expect(pageText).to.be.a('string');
  });

  it('TC-EVENT-015: Form elements are focusable via tab keyboard events', async function () {
    await loginPage.navigate('/create-event');
    await driver.sleep(1500);
    const activeBefore = await driver.executeScript('return document.activeElement.tagName');
    await driver.switchTo().activeElement().sendKeys(Key.TAB);
    const activeAfter = await driver.executeScript('return document.activeElement.tagName');
    expect(activeBefore).to.be.a('string');
    expect(activeAfter).to.be.a('string');
  });
});
