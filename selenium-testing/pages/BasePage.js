/**
 * Orin E2E Framework - Base Page Object
 * All page objects inherit from this class for shared driver utilities,
 * explicit waits, JS helpers, and navigation methods.
 */
'use strict';

const { By, until, Key } = require('selenium-webdriver');
const config = require('../config/framework.config');
const logger = require('../utils/logger');

class BasePage {
  /**
   * @param {import('selenium-webdriver').WebDriver} driver
   */
  constructor(driver) {
    this.driver = driver;
    this.timeout = config.timeouts.elementWait;
    this.baseUrl = config.baseUrl;
  }

  // ─── Navigation ─────────────────────────────────────────────────────────────

  /** Navigate to a full URL */
  async goto(url) {
    logger.step(`Navigate to: ${url}`);
    await this.driver.get(url);
  }

  /** Navigate to a route relative to baseUrl */
  async navigate(route) {
    return this.goto(`${this.baseUrl}${route}`);
  }

  /** Get current page URL */
  async getCurrentUrl() {
    return this.driver.getCurrentUrl();
  }

  /** Get page title */
  async getTitle() {
    return this.driver.getTitle();
  }

  // ─── Element Finders ────────────────────────────────────────────────────────

  /** Wait for element to be located and visible */
  async findElement(locator) {
    await this.driver.wait(until.elementLocated(locator), this.timeout);
    const el = await this.driver.findElement(locator);
    await this.driver.wait(until.elementIsVisible(el), this.timeout);
    return el;
  }

  /** Find multiple elements (no wait) */
  async findElements(locator) {
    return this.driver.findElements(locator);
  }

  /** Check if an element exists in DOM */
  async elementExists(locator) {
    const els = await this.driver.findElements(locator);
    return els.length > 0;
  }

  /** Wait for element to be located in DOM (not necessarily visible) */
  async waitForElement(locator, timeout = this.timeout) {
    return this.driver.wait(until.elementLocated(locator), timeout);
  }

  /** Wait for element to be INVISIBLE or removed */
  async waitForElementHidden(locator, timeout = this.timeout) {
    try {
      const el = await this.driver.findElement(locator);
      await this.driver.wait(until.elementIsNotVisible(el), timeout);
    } catch {
      // Element not found — already gone
    }
  }

  /** Wait for URL to contain a substring */
  async waitForUrl(urlFragment, timeout = this.timeout) {
    await this.driver.wait(until.urlContains(urlFragment), timeout);
  }

  /** Wait for page title to contain text */
  async waitForTitle(titleFragment, timeout = this.timeout) {
    await this.driver.wait(until.titleContains(titleFragment), timeout);
  }

  // ─── Interactions ───────────────────────────────────────────────────────────

  /** Click an element found by locator */
  async click(locator) {
    const el = await this.findElement(locator);
    await el.click();
  }

  /** Clear field and type text */
  async type(locator, text) {
    const el = await this.findElement(locator);
    await el.clear();
    await el.sendKeys(text);
  }

  /** Type text without clearing (append mode) */
  async appendType(locator, text) {
    const el = await this.findElement(locator);
    await el.sendKeys(text);
  }

  /** Get text content of an element */
  async getText(locator) {
    const el = await this.findElement(locator);
    return el.getText();
  }

  /** Get attribute value of an element */
  async getAttribute(locator, attr) {
    const el = await this.findElement(locator);
    return el.getAttribute(attr);
  }

  /** Press keyboard key */
  async pressKey(locator, key) {
    const el = await this.findElement(locator);
    await el.sendKeys(key);
  }

  // ─── JavaScript Utilities ───────────────────────────────────────────────────

  /** Execute arbitrary JS in browser context */
  async executeScript(script, ...args) {
    return this.driver.executeScript(script, ...args);
  }

  /** Scroll element into view */
  async scrollIntoView(locator) {
    const el = await this.findElement(locator);
    await this.executeScript('arguments[0].scrollIntoView({ block: "center" });', el);
    return el;
  }

  /** Scroll to top of page */
  async scrollToTop() {
    await this.executeScript('window.scrollTo(0, 0);');
  }

  /** Scroll to bottom of page */
  async scrollToBottom() {
    await this.executeScript('window.scrollTo(0, document.body.scrollHeight);');
  }

  /** Check if element is in viewport */
  async isInViewport(locator) {
    const el = await this.findElement(locator);
    return this.executeScript(`
      const rect = arguments[0].getBoundingClientRect();
      return rect.top >= 0 && rect.left >= 0 &&
             rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;
    `, el);
  }

  /** Get page's max horizontal scroll width to detect overflow */
  async getScrollWidth() {
    return this.executeScript('return document.documentElement.scrollWidth - document.documentElement.clientWidth;');
  }

  // ─── Wait Helpers ──────────────────────────────────────────────────────────

  /** Hard wait — use sparingly */
  async sleep(ms) {
    await this.driver.sleep(ms);
  }

  /** Wait for React/JS to settle (polls DOM stability) */
  async waitForPageReady(timeout = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const state = await this.executeScript('return document.readyState');
      if (state === 'complete') return;
      await this.sleep(100);
    }
  }

  // ─── Form Helpers ──────────────────────────────────────────────────────────

  /** Fill a form field by CSS selector */
  async fillField(cssSelector, value) {
    await this.type(By.css(cssSelector), value);
  }

  /** Submit a form by clicking a submit button */
  async submitForm(submitButtonLocator) {
    await this.click(submitButtonLocator);
  }

  // ─── Assertion Helpers ─────────────────────────────────────────────────────

  /** Assert that current URL contains a substring */
  async assertUrlContains(fragment) {
    const url = await this.getCurrentUrl();
    if (!url.includes(fragment)) {
      throw new Error(`Expected URL to contain "${fragment}", got: "${url}"`);
    }
  }

  /** Assert element is visible */
  async assertVisible(locator, errorMsg) {
    try {
      const el = await this.findElement(locator);
      const visible = await el.isDisplayed();
      if (!visible) throw new Error(`Element not visible: ${errorMsg || locator}`);
    } catch (e) {
      throw new Error(`Element not found or not visible: ${errorMsg || e.message}`);
    }
  }

  /** Assert element text equals expected */
  async assertText(locator, expected) {
    const actual = await this.getText(locator);
    if (actual.trim() !== expected.trim()) {
      throw new Error(`Expected text "${expected}", got "${actual}"`);
    }
  }

  /** Assert element text contains substring */
  async assertTextContains(locator, substring) {
    const actual = await this.getText(locator);
    if (!actual.includes(substring)) {
      throw new Error(`Expected text to contain "${substring}", got "${actual}"`);
    }
  }
}

module.exports = BasePage;
