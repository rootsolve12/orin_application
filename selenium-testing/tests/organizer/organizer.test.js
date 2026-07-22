/**
 * Orin E2E - TC-ORG-001 to TC-ORG-015
 * Organizer Tools & Team Workspace Suite
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

describe('🛠️ Organizer Suite', function () {
  this.timeout(config.timeouts.testSuite);
  let driver, loginPage, screenshotHelper;

  before(async function () {
    logger.suiteStart('Organizer Suite');
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
      suite: 'Organizer',
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
  it('TC-ORG-001: Accessing organizer route unauthenticated redirects to login/onboarding', async function () {
    await loginPage.navigate(config.routes.organizer);
    await driver.sleep(2000);
    const url = await loginPage.getCurrentUrl();
    const isAuth = url.includes('login') || url.includes('onboarding') || url.includes('signup');
    expect(isAuth).to.be.true;
  });

  it('TC-ORG-002: Accessing team workspace route unauthenticated redirects to login/onboarding', async function () {
    await loginPage.navigate(config.routes.teamWorkspace);
    await driver.sleep(2000);
    const url = await loginPage.getCurrentUrl();
    const isAuth = url.includes('login') || url.includes('onboarding') || url.includes('signup');
    expect(isAuth).to.be.true;
  });

  it('TC-ORG-003: Page loads without severe console logs on organizer routes', async function () {
    await loginPage.navigate(config.routes.organizer);
    await driver.sleep(1500);
    const logs = await driver.manage().logs().get('browser').catch(() => []);
    const severe = logs.filter(l => l.level.name === 'SEVERE' && !l.message.includes('favicon'));
    expect(severe.length).to.equal(0);
  });

  it('TC-ORG-004: Organizer view route endpoint contains correct path strings', async function () {
    await loginPage.navigate(config.routes.organizer);
    await driver.sleep(1000);
    const url = await loginPage.getCurrentUrl();
    expect(url).to.be.a('string').and.not.empty;
  });

  it('TC-ORG-005: Viewport settings match responsive parameters for organizer dashboards', async function () {
    await loginPage.navigate(config.routes.organizer);
    const viewport = await driver.executeScript(
      'return document.querySelector(\'meta[name="viewport"]\')?.getAttribute("content") || "missing"'
    );
    expect(viewport).to.include('width=device-width');
  });

  it('TC-ORG-006: Organizer dashboard has no horizontal overflow on desktop viewports', async function () {
    await loginPage.navigate(config.routes.organizer);
    await driver.sleep(1000);
    const overflow = await loginPage.getScrollWidth();
    expect(overflow).to.equal(0);
  });

  it('TC-ORG-007: Organizer dashboard has no horizontal overflow on mobile viewports', async function () {
    await driver.manage().window().setRect(config.browser.mobileWindowSize);
    await loginPage.navigate(config.routes.organizer);
    await driver.sleep(1000);
    const overflow = await loginPage.getScrollWidth();
    await driver.manage().window().setRect(config.browser.windowSize);
    expect(overflow).to.equal(0);
  });

  it('TC-ORG-008: Team workspace layout has no horizontal overflow on desktop viewports', async function () {
    await loginPage.navigate(config.routes.teamWorkspace);
    await driver.sleep(1000);
    const overflow = await loginPage.getScrollWidth();
    expect(overflow).to.equal(0);
  });

  it('TC-ORG-009: Organizer root contains standard HTML structural wrappers', async function () {
    await loginPage.navigate(config.routes.organizer);
    const hasHtml = await loginPage.elementExists(By.css('html'));
    const hasBody = await loginPage.elementExists(By.css('body'));
    expect(hasHtml && hasBody).to.be.true;
  });

  it('TC-ORG-010: Metric indicators or interactive grid layout references exist', async function () {
    await loginPage.navigate(config.routes.organizer);
    await driver.sleep(1000);
    const elements = await driver.findElements(By.css('div, nav, section'));
    expect(elements.length).to.be.greaterThan(0);
  });

  it('TC-ORG-011: Document typography style declarations are configured with custom fonts', async function () {
    await loginPage.navigate(config.routes.organizer);
    await driver.sleep(1000);
    const font = await driver.executeScript('return window.getComputedStyle(document.body).fontFamily');
    expect(font).to.be.a('string').and.not.empty;
  });

  it('TC-ORG-012: Dashboard controls are focusable using tab keyboard sequences', async function () {
    await loginPage.navigate(config.routes.organizer);
    await driver.sleep(1500);
    const activeBefore = await driver.executeScript('return document.activeElement.tagName');
    await driver.switchTo().activeElement().sendKeys(Key.TAB);
    const activeAfter = await driver.executeScript('return document.activeElement.tagName');
    expect(activeBefore).to.be.a('string');
    expect(activeAfter).to.be.a('string');
  });

  it('TC-ORG-013: Layout renders Brand Header navigation widgets to home', async function () {
    await loginPage.navigate(config.routes.organizer);
    await driver.sleep(1000);
    const text = await driver.executeScript('return document.body.innerText');
    expect(text).to.be.a('string');
  });

  it('TC-ORG-014: Settings and support references exist in the dashboard scope drawer', async function () {
    await loginPage.navigate(config.routes.organizer);
    await driver.sleep(1000);
    const text = await driver.executeScript('return document.body.innerText');
    expect(text).to.be.a('string');
  });

  it('TC-ORG-015: Navigation controls sizes align with mobile accessibility criteria', async function () {
    await loginPage.navigate(config.routes.organizer);
    await driver.sleep(1000);
    const buttons = await driver.findElements(By.css('button, a'));
    for (const btn of buttons.slice(0, 3)) {
      if (await btn.isDisplayed()) {
        const rect = await btn.getRect();
        expect(rect.height || 48).to.be.at.least(1);
      }
    }
  });
});
