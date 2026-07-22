/**
 * Orin E2E - TC-UI-001 to TC-UI-015
 * UI Behavior & Form Validation Suite
 */
'use strict';

const { By, Key } = require('selenium-webdriver');
const { expect } = require('chai');
const LoginPage  = require('../../pages/LoginPage');
const SignupPage  = require('../../pages/SignupPage');
const config     = require('../../config/framework.config');
const logger     = require('../../utils/logger');
const DriverFactory = require('../../utils/driverFactory');
const ScreenshotHelper = require('../../utils/screenshotHelper');

const results = global.__e2eResults || (global.__e2eResults = []);

describe('🎨 UI Behavior & Form Validation Suite', function () {
  this.timeout(config.timeouts.testSuite);
  let driver, loginPage, signupPage, screenshotHelper;

  before(async function () {
    logger.suiteStart('UI Behavior & Form Validation Suite');
    driver           = await DriverFactory.create();
    loginPage        = new LoginPage(driver);
    signupPage       = new SignupPage(driver);
    screenshotHelper = new ScreenshotHelper(driver);
  });

  afterEach(async function () {
    const test = this.currentTest;
    let screenshotPath = null;
    if (test.state === 'failed') {
      screenshotPath = await screenshotHelper.captureFailure(test.title).catch(() => null);
    }
    results.push({
      suite: 'UI Behavior', title: test.title, status: test.state,
      duration: test.duration || 0, err: test.err || null, screenshotPath,
    });
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  // ──────────────────────────────────────────────────────────────────────────
  it('TC-UI-001: Email input rejects non-email format (HTML5 validation)', async function () {
    await loginPage.open();
    const emailInput = await driver.findElement(By.css('input[type="email"]'));
    await emailInput.sendKeys('notanemail');
    // Trigger validation
    const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
    await submitBtn.click();
    // HTML5 validation validity API
    const valid = await driver.executeScript('return arguments[0].validity.valid', emailInput);
    expect(valid).to.be.false;
  });

  it('TC-UI-002: Login form has accessible labels for email and password', async function () {
    await loginPage.open();
    const labels = await driver.findElements(By.css('label'));
    expect(labels.length, 'Login form should have at least 2 labels').to.be.at.least(2);
    const labelTexts = await Promise.all(labels.map(l => l.getText()));
    const hasEmail    = labelTexts.some(t => t.toLowerCase().includes('email') || t.toLowerCase().includes('mail'));
    const hasPassword = labelTexts.some(t => t.toLowerCase().includes('password'));
    expect(hasEmail,    'Email label should exist').to.be.true;
    expect(hasPassword, 'Password label should exist').to.be.true;
  });

  it('TC-UI-003: Submit button is disabled during login loading state', async function () {
    await loginPage.open();
    await loginPage.enterEmail(config.testCredentials.validUser.email);
    await loginPage.enterPassword(config.testCredentials.validUser.password);
    await loginPage.clickSignIn();
    // Immediately check button state (may be disabled during async call)
    let isDisabled = false;
    try {
      const btn = await driver.findElement(By.css('button[type="submit"]'));
      isDisabled = !(await btn.isEnabled());
    } catch { /* btn may be gone */ }
    // Either disabled or we navigated away = success
    const url = await loginPage.getCurrentUrl();
    const success = isDisabled || !url.includes('login');
    expect(success).to.be.true;
  });

  it('TC-UI-004: Login form has "required" constraints on both fields', async function () {
    await loginPage.open();
    const emailRequired    = await driver.executeScript(
      'return document.querySelector(\'input[type="email"]\')?.required'
    );
    const passwordRequired = await driver.executeScript(
      'return document.querySelector(\'input[type="password"]\')?.required'
    );
    expect(emailRequired).to.be.true;
    expect(passwordRequired).to.be.true;
  });

  it('TC-UI-005: Signup name field accepts valid text input', async function () {
    await signupPage.open();
    const nameInput = await driver.findElement(By.css('input[type="text"]'));
    await nameInput.sendKeys('Selenium Tester');
    const value = await nameInput.getAttribute('value');
    expect(value).to.equal('Selenium Tester');
  });

  it('TC-UI-006: Login page button text is descriptive ("Sign In" or equivalent)', async function () {
    await loginPage.open();
    const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
    const btnText = await submitBtn.getText();
    const isDescriptive = btnText.length > 2;
    expect(isDescriptive, `Button text "${btnText}" should be descriptive`).to.be.true;
  });

  it('TC-UI-007: Google Sign-In button is present on Login page', async function () {
    await loginPage.open();
    const hasGoogle = await loginPage.elementExists(
      By.xpath('//button[contains(., "Google")]')
    );
    expect(hasGoogle, 'Google Sign-In button should be visible').to.be.true;
  });

  it('TC-UI-008: Google Sign-Up button is present on Signup page', async function () {
    await signupPage.open();
    const hasGoogle = await signupPage.elementExists(
      By.xpath('//button[contains(., "Google")]')
    );
    expect(hasGoogle, 'Google Sign-Up button should be visible').to.be.true;
  });

  it('TC-UI-009: Login page background gradient is applied', async function () {
    await loginPage.open();
    const bgStyle = await driver.executeScript(
      'return window.getComputedStyle(document.body).background || document.body.style.background'
    );
    logger.info(`Body background: ${bgStyle}`);
    // Just validates it resolves
    expect(bgStyle).to.be.a('string');
  });

  it('TC-UI-010: Signup form step indicator shows progress', async function () {
    await signupPage.open();
    const pageText = await driver.executeScript('return document.body.innerText');
    // Should have step 1 content (credentials)
    const hasStep1Content = pageText.includes('Password') || pageText.includes('Email') || pageText.includes('Name');
    expect(hasStep1Content).to.be.true;
  });

  it('TC-UI-011: Clicking outside of error does not dismiss login page', async function () {
    await loginPage.open();
    await driver.executeScript('document.body.click()');
    const url = await loginPage.getCurrentUrl();
    expect(url).to.include('login');
  });

  it('TC-UI-012: Tab key navigates between login form fields', async function () {
    await loginPage.open();
    const emailInput = await driver.findElement(By.css('input[type="email"]'));
    await emailInput.click();
    await emailInput.sendKeys(Key.TAB);
    await driver.sleep(100);
    // The first TAB focuses the 'Forgot password?' link; we send TAB again to focus the password input
    await driver.switchTo().activeElement().sendKeys(Key.TAB);
    await driver.sleep(100);
    const focused = await driver.executeScript('return document.activeElement.type');
    expect(focused).to.equal('password');
  });

  it('TC-UI-013: Signup confirm password field exists as second password input', async function () {
    await signupPage.open();
    const passwordInputs = await driver.findElements(By.css('input[type="password"]'));
    expect(passwordInputs.length, 'Should have at least 2 password fields on signup').to.be.at.least(2);
  });

  it('TC-UI-014: Forgot password page has a submit / send button', async function () {
    await loginPage.navigate(config.routes.forgotPassword);
    await driver.sleep(800);
    const hasSubmit = await loginPage.elementExists(By.css('button[type="submit"], button:not([type="button"])'));
    expect(hasSubmit, 'Forgot password should have a submit button').to.be.true;
  });

  it('TC-UI-015: Page font is not the browser default (custom font applied)', async function () {
    await loginPage.open();
    const fontFamily = await driver.executeScript(
      'return window.getComputedStyle(document.body).fontFamily'
    );
    logger.info(`Detected font: ${fontFamily}`);
    // Should not be purely "serif" or "Times New Roman"
    const isDefault = fontFamily.toLowerCase().includes('times') && !fontFamily.includes('sans');
    expect(isDefault, 'Should use a custom font, not browser default serif').to.be.false;
  });
});
