/**
 * Orin E2E Framework - Login Page Object
 * Encapsulates all interactions with /login
 */
'use strict';

const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');
const config = require('../config/framework.config');
const logger = require('../utils/logger');

class LoginPage extends BasePage {
  constructor(driver) {
    super(driver);
    // ─── Locators ────────────────────────────────────────────────────────────
    this.emailInput       = By.css('input[type="email"]');
    this.passwordInput    = By.css('input[placeholder="••••••••"]');
    this.submitButton     = By.css('button[type="submit"]');
    this.googleButton     = By.xpath('//button[contains(., "Continue with Google")]');
    this.errorAlert       = By.xpath('//*[contains(@style,"FFEBEE") or contains(@style,"red") or contains(@style,"#DC3545") or contains(@style,"DC3545") or contains(@style,"255, 235, 238") or contains(@style,"220, 53, 69") or contains(@class,"error") or contains(@class,"alert") or contains(text(),"⚠️")]');
    this.forgotPasswordLink = By.css('a[href="/forgot-password"]');
    this.createAccountLink  = By.css('a[href="/signup"]');
    this.togglePasswordBtn  = By.css('form button[type="button"], input[type="password"] ~ button');
  }

  /** Open the Login page */
  async open() {
    logger.step('Opening Login page');
    await this.navigate(config.routes.login);
    await this.waitForElement(this.emailInput);
  }

  /** Fill email field */
  async enterEmail(email) {
    logger.step(`Enter email: ${email}`);
    await this.type(this.emailInput, email);
  }

  /** Fill password field */
  async enterPassword(password) {
    logger.step('Enter password: [REDACTED]');
    await this.type(this.passwordInput, password);
  }

  /** Click the Sign In button */
  async clickSignIn() {
    logger.step('Clicking Sign In button');
    await this.click(this.submitButton);
  }

  /** Full login flow */
  async login(email, password) {
    await this.open();
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.clickSignIn();
  }

  /** Login with valid credentials from config */
  async loginAsValidUser() {
    const { email, password } = config.testCredentials.validUser;
    await this.login(email, password);
  }

  /** Get the error message text */
  async getErrorMessage() {
    try {
      return await this.getText(this.errorAlert);
    } catch {
      return null;
    }
  }

  /** Check if error alert is shown */
  async isErrorDisplayed() {
    return this.elementExists(this.errorAlert);
  }

  /** Click 'Forgot Password?' link */
  async clickForgotPassword() {
    logger.step('Clicking Forgot Password link');
    await this.click(this.forgotPasswordLink);
  }

  /** Click 'Create Account' link */
  async clickCreateAccount() {
    logger.step('Clicking Create Account link');
    await this.click(this.createAccountLink);
  }

  /** Toggle password visibility */
  async togglePasswordVisibility() {
    await this.click(this.togglePasswordBtn);
  }

  /** Assert that we are on the login page */
  async assertOnLoginPage() {
    await this.assertVisible(this.emailInput, 'Email input should be visible on Login page');
    await this.assertVisible(this.submitButton, 'Sign In button should be visible on Login page');
  }

  /** Wait for successful login redirect (away from /login) */
  async waitForLoginSuccess(timeout = 10000) {
    await this.driver.wait(async () => {
      const url = await this.getCurrentUrl();
      return !url.includes('/login');
    }, timeout, 'Expected to be redirected away from /login after successful login');
  }
}

module.exports = LoginPage;
