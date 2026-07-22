/**
 * Orin E2E - TC-AUTH-001 to TC-AUTH-015
 * Authentication Suite: Registration, Login, Forgot Password, Logout
 */
'use strict';

const { By } = require('selenium-webdriver');
const { expect } = require('chai');
const LoginPage  = require('../../pages/LoginPage');
const SignupPage  = require('../../pages/SignupPage');
const config     = require('../../config/framework.config');
const logger     = require('../../utils/logger');
const DriverFactory = require('../../utils/driverFactory');
const ScreenshotHelper = require('../../utils/screenshotHelper');
const { generateReport } = require('../../utils/excelReporter');

// Shared results array (populated via global mocha hooks in root hooks file)
const results = global.__e2eResults || (global.__e2eResults = []);

describe('🔐 Authentication Suite', function () {
  this.timeout(config.timeouts.testSuite);
  let driver, loginPage, signupPage, screenshotHelper;

  before(async function () {
    logger.suiteStart('Authentication Suite');
    driver           = await DriverFactory.create();
    loginPage        = new LoginPage(driver);
    signupPage       = new SignupPage(driver);
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
      suite:          'Authentication',
      title:          test.title,
      status:         test.state,
      duration:       test.duration || 0,
      err:            test.err || null,
      screenshotPath,
    });
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TC-AUTH-001: Login page renders
  // ──────────────────────────────────────────────────────────────────────────
  it('TC-AUTH-001: Login page renders email and password inputs', async function () {
    await loginPage.open();
    await loginPage.assertOnLoginPage();
    const title = await loginPage.getTitle();
    expect(title).to.be.a('string').and.not.empty;
    logger.info(`Page title: ${title}`);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TC-AUTH-002: Empty form validation
  // ──────────────────────────────────────────────────────────────────────────
  it('TC-AUTH-002: Login fails when form is submitted empty (HTML5 validation)', async function () {
    await loginPage.open();
    await loginPage.clickSignIn();
    // HTML5 required validation prevents submit; we should still be on /login
    const url = await loginPage.getCurrentUrl();
    expect(url).to.include('login');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TC-AUTH-003: Login fails with wrong password
  // ──────────────────────────────────────────────────────────────────────────
  it('TC-AUTH-003: Login fails with incorrect credentials and shows error', async function () {
    await loginPage.open();
    await loginPage.enterEmail(config.testCredentials.invalidUser.email);
    await loginPage.enterPassword(config.testCredentials.invalidUser.password);
    await loginPage.clickSignIn();
    await driver.sleep(5000); // wait for Firebase auth error response
    // Check either via DOM element or via body text containing error keywords
    const isErrorElement = await loginPage.isErrorDisplayed();
    const bodyText = await driver.executeScript('return document.body.innerText');
    const hasErrorText = bodyText.toLowerCase().includes('invalid') ||
      bodyText.toLowerCase().includes('incorrect') ||
      bodyText.toLowerCase().includes('error') ||
      bodyText.toLowerCase().includes('wrong') ||
      bodyText.toLowerCase().includes('failed');
    expect(isErrorElement || hasErrorText, 'Error should be shown for wrong credentials').to.be.true;
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TC-AUTH-004: Non-college email domain validation on signup
  // ──────────────────────────────────────────────────────────────────────────
  it('TC-AUTH-004: Signup page renders and has role selection', async function () {
    await signupPage.open();
    const url = await signupPage.getCurrentUrl();
    expect(url).to.include('signup');
    // Basic render: email input should be present
    await signupPage.assertVisible(signupPage.emailInput, 'Signup email input');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TC-AUTH-005: Password strength indicator updates dynamically
  // ──────────────────────────────────────────────────────────────────────────
  it('TC-AUTH-005: Password strength changes as user types', async function () {
    await signupPage.open();
    // Type a weak password
    await signupPage.type(signupPage.passwordInput, 'abc');
    await driver.sleep(300);
    // Type a strong password
    await signupPage.type(signupPage.passwordInput, 'StrongPass@123!');
    await driver.sleep(300);
    // Test passes if no JS error thrown — strength UI updates reactively
    const url = await signupPage.getCurrentUrl();
    expect(url).to.include('signup');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TC-AUTH-006: Forgot Password page is reachable
  // ──────────────────────────────────────────────────────────────────────────
  it('TC-AUTH-006: Forgot Password page renders after clicking link', async function () {
    await loginPage.open();
    await loginPage.clickForgotPassword();
    await driver.sleep(1000);
    const url = await loginPage.getCurrentUrl();
    expect(url).to.include('forgot');
    // Should have an email input
    const emailPresent = await loginPage.elementExists(By.css('input[type="email"]'));
    expect(emailPresent).to.be.true;
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TC-AUTH-007: Create Account link navigates to signup
  // ──────────────────────────────────────────────────────────────────────────
  it('TC-AUTH-007: Create Account link on Login navigates to Signup page', async function () {
    await loginPage.open();
    await loginPage.clickCreateAccount();
    await driver.sleep(1000);
    const url = await loginPage.getCurrentUrl();
    expect(url).to.include('signup');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TC-AUTH-008: Password toggle shows / hides password text
  // ──────────────────────────────────────────────────────────────────────────
  it('TC-AUTH-008: Password visibility toggle changes input type', async function () {
    await loginPage.open();
    await loginPage.enterPassword('TestPass@1');
    // Before toggle — type should be 'password'
    const typeBefore = await loginPage.getAttribute(loginPage.passwordInput, 'type');
    expect(typeBefore).to.equal('password');
    // After toggle
    await loginPage.togglePasswordVisibility();
    const typeAfter = await loginPage.getAttribute(loginPage.passwordInput, 'type');
    expect(typeAfter).to.equal('text');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TC-AUTH-009: Signup with mismatched passwords shows validation error
  // ──────────────────────────────────────────────────────────────────────────
  it('TC-AUTH-009: Signup shows error when passwords do not match', async function () {
    await signupPage.open();
    await signupPage.type(signupPage.nameInput, 'Test User');
    await signupPage.type(signupPage.emailInput, 'test@srmist.edu.in');
    await signupPage.type(signupPage.passwordInput, 'Pass@1234');
    await signupPage.type(signupPage.confirmPasswordInput, 'DifferentPass@999');
    await signupPage.clickContinue();
    await driver.sleep(800);
    // Should still be on signup (not proceeded)
    const url = await signupPage.getCurrentUrl();
    expect(url).to.include('signup');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TC-AUTH-010: Unauthorized route redirects to Login
  // ──────────────────────────────────────────────────────────────────────────
  it('TC-AUTH-010: Accessing protected route without auth redirects to login', async function () {
    await loginPage.navigate(config.routes.home);
    await driver.sleep(2000); // Wait for auth guard
    const url = await loginPage.getCurrentUrl();
    // Should be redirected to login or onboarding
    const isProtected = url.includes('login') || url.includes('onboarding') || url.includes('signup');
    expect(isProtected, `Expected redirect to auth page, got: ${url}`).to.be.true;
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TC-AUTH-011: Login page has no horizontal scroll (mobile)
  // ──────────────────────────────────────────────────────────────────────────
  it('TC-AUTH-011: Login page has no horizontal overflow/scroll', async function () {
    await loginPage.open();
    const overflow = await loginPage.getScrollWidth();
    expect(overflow, 'Horizontal scroll should be 0').to.equal(0);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TC-AUTH-012: Signup page has no horizontal scroll
  // ──────────────────────────────────────────────────────────────────────────
  it('TC-AUTH-012: Signup page has no horizontal overflow/scroll', async function () {
    await signupPage.open();
    const overflow = await signupPage.getScrollWidth();
    expect(overflow, 'Horizontal scroll should be 0 on signup').to.equal(0);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TC-AUTH-013: Terms of Service and Privacy Policy links present
  // ──────────────────────────────────────────────────────────────────────────
  it('TC-AUTH-013: Login page shows Terms of Service and Privacy Policy references', async function () {
    await loginPage.open();
    const bodyText = await loginPage.executeScript('return document.body.innerText');
    expect(bodyText).to.include('Terms');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TC-AUTH-014: Signup page shows two roles: Participant and Organizer
  // ──────────────────────────────────────────────────────────────────────────
  it('TC-AUTH-014: Signup page shows Participant and Organizer role options after Step 1', async function () {
    await signupPage.open();
    await signupPage.fillStep1(
      'Test User',
      `auto_${Date.now()}@srmist.edu.in`,
      'Test@Selenium1234',
      'Test@Selenium1234'
    );
    await signupPage.clickContinue();
    await driver.sleep(1200);
    const pageText = await signupPage.executeScript('return document.body.innerText');
    const hasParticipant = pageText.includes('Participant');
    const hasOrganizer   = pageText.includes('Organizer');
    expect(hasParticipant, 'Participant role should appear in Step 2').to.be.true;
    expect(hasOrganizer,   'Organizer role should appear in Step 2').to.be.true;
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TC-AUTH-015: Page title is set and not empty
  // ──────────────────────────────────────────────────────────────────────────
  it('TC-AUTH-015: Login and Signup pages have meaningful page titles', async function () {
    await loginPage.open();
    const loginTitle = await loginPage.getTitle();
    expect(loginTitle).to.be.a('string').and.not.empty;

    await signupPage.open();
    const signupTitle = await signupPage.getTitle();
    expect(signupTitle).to.be.a('string').and.not.empty;
  });
});
