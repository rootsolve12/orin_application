/**
 * Orin E2E Framework - Navigation / App Layout Page Object
 * Covers Bottom Navigation, Hamburger Drawer, and route switching.
 */
'use strict';

const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');
const logger = require('../utils/logger');

class NavigationPage extends BasePage {
  constructor(driver) {
    super(driver);
    // ─── Bottom Navigation Bar ────────────────────────────────────────────
    this.bottomNav          = By.css('nav[class*="bottom"], [class*="bottom-nav"], [class*="bottomNav"]');
    this.homeTab            = By.xpath('//nav//*[contains(text(),"Home") or contains(@aria-label,"Home")]');
    this.exploreTab         = By.xpath('//nav//*[contains(text(),"Explore") or contains(@aria-label,"Explore")]');
    this.communityTab       = By.xpath('//nav//*[contains(text(),"Community") or contains(@aria-label,"Community")]');
    this.calendarTab        = By.xpath('//nav//*[contains(text(),"Calendar") or contains(text(),"Events")]');
    this.profileTab         = By.xpath('//nav//*[contains(text(),"Profile") or contains(@aria-label,"Profile")]');

    // ─── Hamburger / Sidebar ──────────────────────────────────────────────
    this.hamburgerBtn       = By.css('[aria-label*="menu"], button[class*="hamburger"], button[class*="menu"]');
    this.drawer             = By.css('[class*="drawer"], [class*="sidebar"], [class*="Drawer"]');
    this.drawerOverlay      = By.css('[class*="overlay"], [class*="backdrop"]');

    // ─── Drawer Menu Items ────────────────────────────────────────────────
    this.teamWorkspaceLink  = By.xpath('//a[contains(@href,"/team")] | //*[contains(text(),"Team Workspace")]');
    this.organizerToolsLink = By.xpath('//a[contains(@href,"/organizer")] | //*[contains(text(),"Organizer Tools")]');
    this.certificatesLink   = By.xpath('//a[contains(@href,"/certificates")] | //*[contains(text(),"Certificate")]');
    this.myRegistrationsLink= By.xpath('//a[contains(@href,"/my-events")] | //*[contains(text(),"Registrations")]');
    this.settingsLink       = By.xpath('//a[contains(@href,"/settings")] | //*[contains(text(),"Settings")]');
    this.supportLink        = By.xpath('//a[contains(@href,"/support")] | //*[contains(text(),"Support")]');
    this.logoLink           = By.xpath('//*[contains(text(),"Orin") and (self::a or ancestor::a)]');
  }

  /** Click a bottom nav tab by name */
  async clickTab(tabName) {
    logger.step(`Clicking bottom nav tab: ${tabName}`);
    const locatorMap = {
      home:      this.homeTab,
      explore:   this.exploreTab,
      community: this.communityTab,
      calendar:  this.calendarTab,
      profile:   this.profileTab,
    };
    const locator = locatorMap[tabName.toLowerCase()];
    if (!locator) throw new Error(`Unknown tab: ${tabName}`);
    await this.click(locator);
  }

  /** Open the hamburger drawer */
  async openDrawer() {
    logger.step('Opening hamburger drawer');
    await this.click(this.hamburgerBtn);
    await this.waitForElement(this.drawer);
  }

  /** Close drawer by clicking the overlay */
  async closeDrawer() {
    logger.step('Closing drawer (overlay click)');
    try {
      await this.click(this.drawerOverlay);
    } catch {
      // May not have overlay — press Escape as fallback
      const { Key } = require('selenium-webdriver');
      await this.driver.actions().sendKeys(Key.ESCAPE).perform();
    }
  }

  /** Navigate via drawer to a menu item */
  async navigateViaDrawer(menuItem) {
    await this.openDrawer();
    logger.step(`Clicking drawer item: ${menuItem}`);
    const locatorMap = {
      'team workspace':  this.teamWorkspaceLink,
      'organizer tools': this.organizerToolsLink,
      'certificates':    this.certificatesLink,
      'my registrations':this.myRegistrationsLink,
      'settings':        this.settingsLink,
      'support':         this.supportLink,
    };
    const key = menuItem.toLowerCase();
    const locator = locatorMap[key];
    if (!locator) throw new Error(`Unknown drawer item: ${menuItem}`);
    await this.click(locator);
  }

  /** Click Orin logo to go home */
  async clickLogo() {
    logger.step('Clicking Orin logo');
    await this.click(this.logoLink);
  }

  /** Check that the bottom nav bar is rendered */
  async isBottomNavVisible() {
    return this.elementExists(this.bottomNav);
  }

  /** Check if the active tab highlights a specific tab */
  async getActiveTab() {
    try {
      const activeEl = await this.driver.findElement(
        By.css('nav a[class*="active"], nav button[class*="active"], nav [aria-current="page"]')
      );
      return activeEl.getText();
    } catch {
      return null;
    }
  }
}

module.exports = NavigationPage;
