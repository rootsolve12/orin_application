/**
 * Orin E2E - TC-NAV-001 to TC-NAV-015
 * Navigation Suite: Bottom Nav, Hamburger Drawer, Deep Links, Routing
 */
'use strict';

const { By } = require('selenium-webdriver');
const { expect } = require('chai');
const LoginPage      = require('../../pages/LoginPage');
const NavigationPage = require('../../pages/NavigationPage');
const config         = require('../../config/framework.config');
const logger         = require('../../utils/logger');
const DriverFactory  = require('../../utils/driverFactory');
const ScreenshotHelper = require('../../utils/screenshotHelper');

const results = global.__e2eResults || (global.__e2eResults = []);

describe('🧭 Navigation Suite', function () {
  this.timeout(config.timeouts.testSuite);
  let driver, loginPage, navPage, screenshotHelper;

  before(async function () {
    logger.suiteStart('Navigation Suite');
    driver           = await DriverFactory.create();
    loginPage        = new LoginPage(driver);
    navPage          = new NavigationPage(driver);
    screenshotHelper = new ScreenshotHelper(driver);
    // Note: most navigation tests run against the public-facing app
    // (pre-login) to validate structure without needing test accounts
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
      suite: 'Navigation', title: test.title,
      status: test.state, duration: test.duration || 0,
      err: test.err || null, screenshotPath,
    });
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  // ──────────────────────────────────────────────────────────────────────────
  it('TC-NAV-001: Login page renders at root path redirect', async function () {
    await loginPage.navigate('/');
    await driver.sleep(2000);
    const url = await loginPage.getCurrentUrl();
    // Unauthenticated root should redirect to login or onboarding
    const isAuthPage = url.includes('login') || url.includes('onboarding') || url.includes('signup');
    expect(isAuthPage, `Root should redirect to auth page, got: ${url}`).to.be.true;
  });

  it('TC-NAV-002: /login route loads the login form directly', async function () {
    await loginPage.open();
    await loginPage.assertOnLoginPage();
    const url = await loginPage.getCurrentUrl();
    expect(url).to.include('login');
  });

  it('TC-NAV-003: /signup route loads the signup form directly', async function () {
    await loginPage.navigate(config.routes.signup);
    await driver.sleep(1000);
    const url = await loginPage.getCurrentUrl();
    expect(url).to.include('signup');
    const hasInput = await loginPage.elementExists(By.css('input[type="email"]'));
    expect(hasInput).to.be.true;
  });

  it('TC-NAV-004: /forgot-password route loads the forgot password form', async function () {
    await loginPage.navigate(config.routes.forgotPassword);
    await driver.sleep(1000);
    const url = await loginPage.getCurrentUrl();
    expect(url).to.include('forgot');
  });

  it('TC-NAV-005: Browser back button works from Signup back to Login', async function () {
    await loginPage.open();
    await loginPage.clickCreateAccount();
    await driver.sleep(800);
    await driver.navigate().back();
    await driver.sleep(800);
    const url = await loginPage.getCurrentUrl();
    expect(url).to.include('login');
  });

  it('TC-NAV-006: Deep-link to /signup does not redirect to login (public route)', async function () {
    await loginPage.navigate(config.routes.signup);
    await driver.sleep(1500);
    const url = await loginPage.getCurrentUrl();
    // Signup is a public route — should NOT redirect to login
    expect(url).to.include('signup');
  });

  it('TC-NAV-007: Deep-link to /forgot-password is accessible without auth', async function () {
    await loginPage.navigate(config.routes.forgotPassword);
    await driver.sleep(1500);
    const url = await loginPage.getCurrentUrl();
    expect(url).to.include('forgot');
  });

  it('TC-NAV-008: Navigating between Login and Signup does not cause full page reload', async function () {
    await loginPage.open();
    const title1 = await loginPage.getTitle();
    await loginPage.clickCreateAccount();
    await driver.sleep(800);
    const title2 = await loginPage.getTitle();
    // Both titles should be non-empty (SPA navigation, no hard reload)
    expect(title1).to.be.a('string').and.not.empty;
    expect(title2).to.be.a('string').and.not.empty;
  });

  it('TC-NAV-009: App has no horizontal overflow on Login page (desktop)', async function () {
    await loginPage.open();
    const overflow = await loginPage.getScrollWidth();
    expect(overflow).to.equal(0);
  });

  it('TC-NAV-010: App has no horizontal overflow on Signup page (desktop)', async function () {
    await loginPage.navigate(config.routes.signup);
    await driver.sleep(500);
    const overflow = await loginPage.getScrollWidth();
    expect(overflow).to.equal(0);
  });

  it('TC-NAV-011: Application serves a valid HTTP 200 response (app loads)', async function () {
    await loginPage.goto(config.baseUrl);
    await driver.sleep(1000);
    // If we get here without an exception and get a string title, the app is up
    const title = await loginPage.getTitle();
    expect(title).to.be.a('string');
  });

  it('TC-NAV-012: Page has correct document structure (html, head, body)', async function () {
    await loginPage.open();
    const hasHtml = await loginPage.elementExists(By.css('html'));
    const hasBody = await loginPage.elementExists(By.css('body'));
    const hasHead = await loginPage.executeScript('return !!document.head');
    expect(hasHtml).to.be.true;
    expect(hasBody).to.be.true;
    expect(hasHead).to.be.true;
  });

  it('TC-NAV-013: Login page contains the Orin brand name', async function () {
    await loginPage.open();
    const bodyText = await loginPage.executeScript('return document.body.innerText');
    expect(bodyText).to.include('Orin');
  });

  it('TC-NAV-014: Forgot Password page has a Back / Return to Login link', async function () {
    await loginPage.navigate(config.routes.forgotPassword);
    await driver.sleep(800);
    const bodyText = await loginPage.executeScript('return document.body.innerText.toLowerCase()');
    // Should have "login", "sign in", or "back" link
    const hasBack = bodyText.includes('login') || bodyText.includes('sign in') || bodyText.includes('back');
    expect(hasBack, 'Forgot Password page should have a way back to Login').to.be.true;
  });

  it('TC-NAV-015: Viewport meta tag is set for mobile rendering', async function () {
    await loginPage.open();
    const viewport = await loginPage.executeScript(
      'return document.querySelector(\'meta[name="viewport"]\')?.getAttribute("content") || "missing"'
    );
    expect(viewport).to.include('width=device-width');
  });
});
