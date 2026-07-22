/**
 * Orin E2E Framework - Explore / Home Dashboard Page Object
 */
'use strict';

const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');
const config = require('../config/framework.config');
const logger = require('../utils/logger');

class ExplorePage extends BasePage {
  constructor(driver) {
    super(driver);
    // ─── Search ───────────────────────────────────────────────────────────
    this.searchInput      = By.css('input[placeholder*="Search"], input[type="search"]');
    this.searchResults    = By.css('[class*="eventCard"], [class*="event-card"], [class*="card"]');

    // ─── Category Chips ───────────────────────────────────────────────────
    this.categoryChips    = By.css('[class*="chip"], [class*="filter-tag"], [class*="category"]');
    this.chipsContainer   = By.css('[class*="chips-container"], [class*="filter-row"], [class*="swipe"]');

    // ─── Event Cards ──────────────────────────────────────────────────────
    this.eventCards       = By.css('[class*="eventCard"], [class*="event-card"], [class*="EventCard"]');
    this.eventCardTitle   = By.css('[class*="title"], [class*="name"], h3, h4');
    this.emptyState       = By.css('[class*="empty"], [class*="no-result"], [class*="noData"]');

    // ─── AI Assistant ─────────────────────────────────────────────────────
    this.aiAssistantToggle = By.xpath('//*[contains(text(),"AI") or contains(text(),"Assistant") or contains(text(),"Discover")]');
    this.aiAssistantPanel  = By.css('[class*="ai-panel"], [class*="assistant"], [class*="AIAssistant"]');

    // ─── Sort / Filter ────────────────────────────────────────────────────
    this.sortDropdown     = By.css('[class*="sort"], select, [aria-label*="sort"]');
    this.filterButton     = By.css('[class*="filter"], button[aria-label*="filter"]');
  }

  /** Open the Explore page */
  async open() {
    logger.step('Opening Explore page');
    await this.navigate(config.routes.explore);
    await this.waitForPageReady();
  }

  /** Search for an event */
  async search(query) {
    logger.step(`Searching for: "${query}"`);
    await this.type(this.searchInput, query);
    await this.sleep(800); // debounce
  }

  /** Clear the search input */
  async clearSearch() {
    const { Key } = require('selenium-webdriver');
    await this.pressKey(this.searchInput, Key.CONTROL + 'a');
    await this.pressKey(this.searchInput, Key.DELETE);
    await this.sleep(500);
  }

  /** Get number of visible event cards */
  async getEventCardCount() {
    const cards = await this.findElements(this.eventCards);
    return cards.length;
  }

  /** Get list of event card titles */
  async getEventCardTitles() {
    const cards = await this.findElements(this.eventCards);
    const titles = [];
    for (const card of cards) {
      try {
        const titleEl = await card.findElement(By.css('h3, h4, [class*="title"]'));
        titles.push(await titleEl.getText());
      } catch {
        // ignore cards without title
      }
    }
    return titles;
  }

  /** Click on an event card at given index */
  async clickEventCard(index = 0) {
    const cards = await this.findElements(this.eventCards);
    if (cards.length === 0) throw new Error('No event cards found on Explore page');
    await cards[Math.min(index, cards.length - 1)].click();
  }

  /** Click a category chip by label */
  async clickCategoryChip(label) {
    logger.step(`Clicking category chip: ${label}`);
    const chip = await this.findElement(
      By.xpath(`//*[contains(text(),"${label}") and (contains(@class,"chip") or contains(@class,"tag") or contains(@class,"filter"))]`)
    );
    await chip.click();
    await this.sleep(500);
  }

  /** Check if empty state is shown */
  async isEmptyStateVisible() {
    return this.elementExists(this.emptyState);
  }

  /** Check if the search input is sticky (stays at top when scrolled) */
  async isSearchInputSticky() {
    return this.isInViewport(this.searchInput);
  }
}

module.exports = ExplorePage;
