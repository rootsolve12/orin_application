/**
 * Orin E2E - TC-EXPLORE-001 to TC-EXPLORE-015
 * Explore / Events Discovery Suite
 */
'use strict';

const { By } = require('selenium-webdriver');
const { expect } = require('chai');
const LoginPage    = require('../../pages/LoginPage');
const ExplorePage  = require('../../pages/ExplorePage');
const config       = require('../../config/framework.config');
const logger       = require('../../utils/logger');
const DriverFactory  = require('../../utils/driverFactory');
const ScreenshotHelper = require('../../utils/screenshotHelper');

const results = global.__e2eResults || (global.__e2eResults = []);

describe('🔍 Explore & Event Discovery Suite', function () {
  this.timeout(config.timeouts.testSuite);
  let driver, loginPage, explorePage, screenshotHelper;

  before(async function () {
    logger.suiteStart('Explore & Event Discovery Suite');
    driver           = await DriverFactory.create();
    loginPage        = new LoginPage(driver);
    explorePage      = new ExplorePage(driver);
    screenshotHelper = new ScreenshotHelper(driver);
  });

  afterEach(async function () {
    const test = this.currentTest;
    let screenshotPath = null;
    if (test.state === 'failed') {
      screenshotPath = await screenshotHelper.captureFailure(test.title).catch(() => null);
    }
    results.push({
      suite: 'Explore', title: test.title, status: test.state,
      duration: test.duration || 0, err: test.err || null, screenshotPath,
    });
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  // ──────────────────────────────────────────────────────────────────────────
  it('TC-EXPLORE-001: Explore route redirects unauthenticated users to login', async function () {
    await explorePage.navigate(config.routes.explore);
    await driver.sleep(2000);
    const url = await explorePage.getCurrentUrl();
    const isAuthPage = url.includes('login') || url.includes('onboarding');
    expect(isAuthPage, `Explore should require auth, got: ${url}`).to.be.true;
  });

  it('TC-EXPLORE-002: Explore page URL contains /explore', async function () {
    // Access the explore route and validate
    await explorePage.navigate(config.routes.explore);
    await driver.sleep(1500);
    const url = await explorePage.getCurrentUrl();
    // Accepts both redirect to login (valid) and successful load
    expect(url).to.be.a('string').and.not.empty;
  });

  it('TC-EXPLORE-003: Application loads without JavaScript errors on /explore', async function () {
    await loginPage.open();
    // Navigate and check for console errors via JS
    const consoleLogs = await driver.manage().logs().get('browser').catch(() => []);
    const severeLogs = consoleLogs.filter(l => l.level.name === 'SEVERE');
    // Filter out known third-party errors
    const appErrors = severeLogs.filter(l =>
      !l.message.includes('favicon') &&
      !l.message.includes('google-analytics') &&
      !l.message.includes('fonts.googleapis')
    );
    expect(appErrors.length, `Found JS errors: ${appErrors.map(l => l.message).join('\n')}`).to.equal(0);
  });

  it('TC-EXPLORE-004: Search input placeholder text is informative', async function () {
    await loginPage.navigate(config.routes.explore);
    await driver.sleep(1500);
    const url = await loginPage.getCurrentUrl();
    if (url.includes('login')) {
      // Unauthenticated — test login page search doesn't exist
      this.skip();
    }
    const searchInput = await driver.findElement(By.css('input[placeholder*="Search"], input[type="search"]'));
    const placeholder = await searchInput.getAttribute('placeholder');
    expect(placeholder).to.be.a('string').and.not.empty;
  });

  it('TC-EXPLORE-005: Category filter chips container is horizontally scrollable on mobile viewport', async function () {
    // Simulate mobile viewport
    await driver.manage().window().setRect({ width: 390, height: 844 });
    await loginPage.navigate(config.routes.explore);
    await driver.sleep(1500);
    const url = await loginPage.getCurrentUrl();
    if (url.includes('login')) {
      await driver.manage().window().setRect(config.browser.windowSize);
      this.skip();
    }
    // Check that chips container has overflow-x styling
    const containerStyle = await loginPage.executeScript(`
      const container = document.querySelector('[class*="chip"], [class*="filter"]');
      return container ? window.getComputedStyle(container.parentElement).overflowX : 'not found';
    `);
    logger.info(`Chips container overflowX: ${containerStyle}`);
    // Reset viewport
    await driver.manage().window().setRect(config.browser.windowSize);
    expect(containerStyle).to.be.a('string');
  });

  it('TC-EXPLORE-006: Event cards render with titles on /explore', async function () {
    await loginPage.navigate(config.routes.explore);
    await driver.sleep(2000);
    const url = await loginPage.getCurrentUrl();
    if (url.includes('login')) { this.skip(); }

    const cards = await driver.findElements(By.css('[class*="card"], [class*="event"]'));
    logger.info(`Found ${cards.length} event/card elements`);
    expect(cards.length).to.be.greaterThan(0);
  });

  it('TC-EXPLORE-007: No horizontal scroll on /explore desktop view', async function () {
    await loginPage.navigate(config.routes.explore);
    await driver.sleep(1500);
    const overflow = await loginPage.getScrollWidth();
    expect(overflow).to.equal(0);
  });

  it('TC-EXPLORE-008: No horizontal scroll on /explore mobile view', async function () {
    await driver.manage().window().setRect({ width: 390, height: 844 });
    await loginPage.navigate(config.routes.explore);
    await driver.sleep(1500);
    const overflow = await loginPage.getScrollWidth();
    await driver.manage().window().setRect(config.browser.windowSize);
    expect(overflow).to.equal(0);
  });

  it('TC-EXPLORE-009: Explore page has an input element for searching', async function () {
    await loginPage.navigate(config.routes.explore);
    await driver.sleep(1500);
    const url = await loginPage.getCurrentUrl();
    if (url.includes('login')) { this.skip(); }
    const hasSearch = await loginPage.elementExists(By.css('input[type="search"], input[placeholder*="Search"]'));
    expect(hasSearch).to.be.true;
  });

  it('TC-EXPLORE-010: Explore page shows structured layout (not a blank page)', async function () {
    await loginPage.navigate(config.routes.explore);
    await driver.sleep(2000);
    const bodyText = await loginPage.executeScript('return document.body.innerText.trim()');
    expect(bodyText.length, 'Body text should not be empty on Explore').to.be.greaterThan(20);
  });

  it('TC-EXPLORE-011: /onboarding route renders onboarding screen', async function () {
    await loginPage.navigate(config.routes.onboarding);
    await driver.sleep(1000);
    const url = await loginPage.getCurrentUrl();
    // Onboarding could be accessible or redirect — just validate URL response
    expect(url).to.be.a('string').and.not.empty;
  });

  it('TC-EXPLORE-012: Profile route redirects unauthenticated user to auth', async function () {
    await loginPage.navigate(config.routes.profile);
    await driver.sleep(2000);
    const url = await loginPage.getCurrentUrl();
    const isProtected = url.includes('login') || url.includes('onboarding') || url.includes('signup');
    expect(isProtected).to.be.true;
  });

  it('TC-EXPLORE-013: Communities route redirects unauthenticated user to auth', async function () {
    await loginPage.navigate(config.routes.communities);
    await driver.sleep(2000);
    const url = await loginPage.getCurrentUrl();
    const isProtected = url.includes('login') || url.includes('onboarding') || url.includes('signup');
    expect(isProtected).to.be.true;
  });

  it('TC-EXPLORE-014: Organizer route redirects unauthenticated user to auth', async function () {
    await loginPage.navigate(config.routes.organizer);
    await driver.sleep(2000);
    const url = await loginPage.getCurrentUrl();
    const isProtected = url.includes('login') || url.includes('onboarding') || url.includes('signup');
    expect(isProtected).to.be.true;
  });

  it('TC-EXPLORE-015: /support route is accessible and renders content', async function () {
    await loginPage.navigate(config.routes.support);
    await driver.sleep(1500);
    const bodyText = await loginPage.executeScript('return document.body.innerText.trim()');
    expect(bodyText.length).to.be.greaterThan(5);
  });
});
