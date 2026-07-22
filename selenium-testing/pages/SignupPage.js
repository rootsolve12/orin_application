/**
 * Orin E2E Framework - Signup Page Object
 * Encapsulates all interactions with /signup (multi-step form)
 */
'use strict';

const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');
const config = require('../config/framework.config');
const logger = require('../utils/logger');

class SignupPage extends BasePage {
  constructor(driver) {
    super(driver);
    // ─── Step 1 Locators ───────────────────────────────────────────────────
    this.nameInput            = By.css('input[type="text"]');
    this.emailInput           = By.css('input[type="email"]');
    this.passwordInput        = By.css('input[id="password"], input[placeholder*="Password"], input[type="password"]');
    this.confirmPasswordInput = By.xpath('(//input[@type="password"])[2]');
    this.continueButton       = By.xpath('//button[contains(., "Continue") or contains(., "Next")]');
    this.googleSignupButton   = By.xpath('//button[contains(., "Continue with Google")]');

    // ─── Step 2 Locators (Role Selection) ─────────────────────────────────
    this.participantRole  = By.xpath('//*[contains(., "Participant") and (@role="button" or contains(@class,"role") or contains(@class,"card"))]');
    this.organizerRole    = By.xpath('//*[contains(., "Organizer") and (@role="button" or contains(@class,"role") or contains(@class,"card"))]');
    this.createAccountBtn = By.xpath('//button[contains(., "Create Account") or contains(., "Get Started") or contains(., "Sign Up")]');

    // ─── Validation / Error ────────────────────────────────────────────────
    this.errorMessage     = By.xpath('//*[contains(@style,"FFEBEE") or contains(@class,"error") or contains(@style,"DC3545") or contains(@style,"255, 235, 238") or contains(@style,"220, 53, 69") or contains(text(),"⚠️")]');
    this.loginLink        = By.css('a[href="/login"]');

    // ─── Password strength indicators ─────────────────────────────────────
    this.strengthBar      = By.css('[class*="strength"], [style*="background"][style*="FF"]');
  }

  /** Open the signup page */
  async open() {
    logger.step('Opening Signup page');
    await this.navigate(config.routes.signup);
    await this.waitForElement(this.emailInput);
  }

  /** Fill Step 1 credentials form */
  async fillStep1(name, email, password, confirmPassword) {
    logger.step('Filling Step 1: credentials');
    await this.type(this.nameInput, name);
    await this.type(this.emailInput, email);
    await this.type(this.passwordInput, password);
    await this.type(this.confirmPasswordInput, confirmPassword || password);
  }

  /** Click Continue to go to Step 2 */
  async clickContinue() {
    logger.step('Clicking Continue / Next');
    await this.click(this.continueButton);
  }

  /** Select a role card on Step 2 */
  async selectRole(role = 'participant') {
    logger.step(`Selecting role: ${role}`);
    const locator = role === 'organizer' ? this.organizerRole : this.participantRole;
    await this.click(locator);
  }

  /** Click Create Account to finalize signup */
  async clickCreateAccount() {
    logger.step('Clicking Create Account');
    await this.click(this.createAccountBtn);
  }

  /** Full signup flow (Step 1 → Step 2 → Submit) */
  async signup(name, email, password, role = 'participant') {
    await this.open();
    await this.fillStep1(name, email, password, password);
    await this.clickContinue();
    await this.sleep(500);
    await this.selectRole(role);
    await this.clickCreateAccount();
  }

  /** Get displayed error message */
  async getErrorMessage() {
    try {
      return await this.getText(this.errorMessage);
    } catch {
      return null;
    }
  }

  /** Check if an error is displayed */
  async isErrorDisplayed() {
    return this.elementExists(this.errorMessage);
  }

  /** Click 'Sign In' link from signup page */
  async clickLoginLink() {
    await this.click(this.loginLink);
  }
}

module.exports = SignupPage;
