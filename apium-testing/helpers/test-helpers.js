/**
 * Shared helper utilities for Orin E2E tests.
 *
 * Flutter renders its own UI tree, so standard Android selectors (resource-id,
 * text, etc.) are NOT available by default. The UiAutomator2 driver sees
 * Flutter's SurfaceView as a single element.
 *
 * Strategy:
 *   • Flutter integration-test style accessibility semantics can be used
 *     if the app sets `Semantics(label: ...)` or the widget's tooltip.
 *   • For Flutter apps on Android, the most reliable Appium approach is:
 *       1. Use `accessibility id` (maps to content-description / semantics label).
 *       2. Use UiAutomator `new UiSelector().text(...)` for visible text.
 *       3. Use XPath with text predicates.
 *       4. Use `appium-flutter-driver` or `appium-flutter-finder` for
 *          deeper widget-tree access (optional add-on).
 *
 * This helper file provides wrappers for all common interactions.
 */

const TIMEOUTS = {
  SHORT: 5000,
  MEDIUM: 10000,
  LONG: 20000,
  EXTRA_LONG: 30000,
};

// ──────────────────────────────────────────────────────────────────────────────
// Element Finders
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Find an element by its visible text using UiAutomator selector.
 * Works well with Flutter when Flutter's text widgets render accessibility nodes.
 */
async function findByText(text, timeout = TIMEOUTS.MEDIUM) {
  const selector = `new UiSelector().text("${text}")`;
  const el = await $(`android=` + selector);
  await el.waitForDisplayed({ timeout });
  return el;
}

/**
 * Find an element containing partial text.
 */
async function findByPartialText(text, timeout = TIMEOUTS.MEDIUM) {
  const selector = `new UiSelector().textContains("${text}")`;
  const el = await $(`android=` + selector);
  await el.waitForDisplayed({ timeout });
  return el;
}

/**
 * Find an element by its content-description (accessibility label in Flutter).
 */
async function findByAccessibilityId(id, timeout = TIMEOUTS.MEDIUM) {
  const el = await $(`~${id}`);
  await el.waitForDisplayed({ timeout });
  return el;
}

/**
 * Find an element by its Android resource-id.
 * Note: Flutter widgets don't have resource-ids by default, but Android
 * system elements (like permission dialogs) do.
 */
async function findByResourceId(id, timeout = TIMEOUTS.MEDIUM) {
  const el = await $(`android=new UiSelector().resourceId("${id}")`);
  await el.waitForDisplayed({ timeout });
  return el;
}

/**
 * Find an element by class name with text.
 */
async function findByClassAndText(className, text, timeout = TIMEOUTS.MEDIUM) {
  const selector = `new UiSelector().className("${className}").text("${text}")`;
  const el = await $(`android=` + selector);
  await el.waitForDisplayed({ timeout });
  return el;
}

/**
 * Find all elements matching visible text.
 */
async function findAllByText(text, timeout = TIMEOUTS.MEDIUM) {
  const selector = `new UiSelector().text("${text}")`;
  const elements = await $$(`android=` + selector);
  return elements;
}

// ──────────────────────────────────────────────────────────────────────────────
// Actions
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Tap on an element found by visible text.
 */
async function tapByText(text, timeout = TIMEOUTS.MEDIUM) {
  const el = await findByText(text, timeout);
  await el.click();
  return el;
}

/**
 * Tap on an element found by accessibility id.
 */
async function tapByAccessibilityId(id, timeout = TIMEOUTS.MEDIUM) {
  const el = await findByAccessibilityId(id, timeout);
  await el.click();
  return el;
}

/**
 * Type text into a field identified by its label/hint text.
 * Flutter TextFormField renders the label text as accessible text.
 */
async function typeInField(labelOrHint, value, timeout = TIMEOUTS.MEDIUM) {
  // Try to find the EditText by its hint or label
  let el;
  try {
    // Try finding by text first (label text)
    el = await $(`android=new UiSelector().text("${labelOrHint}")`);
    await el.waitForDisplayed({ timeout: 3000 });
    await el.click();
    // After clicking the label, the focused input should be ready
    // Find the active EditText
    const editTexts = await $$('android.widget.EditText');
    for (const et of editTexts) {
      if (await et.isFocused()) {
        el = et;
        break;
      }
    }
  } catch {
    // Fallback: look for EditText elements directly
    const editTexts = await $$('android.widget.EditText');
    for (const et of editTexts) {
      const text = await et.getText();
      if (text && text.includes(labelOrHint)) {
        el = et;
        break;
      }
    }
  }

  if (el) {
    await el.clearValue();
    await el.setValue(value);
  }
  return el;
}

/**
 * Type into the Nth EditText field (0-indexed).
 * Useful for Flutter where fields may not have unique identifiers.
 */
async function typeInFieldByIndex(index, value, timeout = TIMEOUTS.MEDIUM) {
  const editTexts = await $$('android.widget.EditText');
  if (editTexts.length > index) {
    const el = editTexts[index];
    await el.waitForDisplayed({ timeout });
    await el.click();
    await el.clearValue();
    await el.setValue(value);
    return el;
  }
  throw new Error(`EditText at index ${index} not found. Found ${editTexts.length} fields.`);
}

/**
 * Scroll down on the screen to find an element.
 */
async function scrollDownToText(text, maxScrolls = 5) {
  for (let i = 0; i < maxScrolls; i++) {
    try {
      const el = await $(`android=new UiSelector().text("${text}")`);
      if (await el.isDisplayed()) return el;
    } catch {
      // Element not found yet, scroll
    }

    // Perform a scroll action
    const { width, height } = await browser.getWindowSize();
    await browser.touchAction([
      { action: 'press', x: Math.floor(width / 2), y: Math.floor(height * 0.7) },
      { action: 'wait', ms: 300 },
      { action: 'moveTo', x: Math.floor(width / 2), y: Math.floor(height * 0.3) },
      'release',
    ]);

    await browser.pause(500);
  }
  throw new Error(`Could not find text "${text}" after ${maxScrolls} scrolls`);
}

/**
 * Scroll up on the screen.
 */
async function scrollUp() {
  const { width, height } = await browser.getWindowSize();
  await browser.touchAction([
    { action: 'press', x: Math.floor(width / 2), y: Math.floor(height * 0.3) },
    { action: 'wait', ms: 300 },
    { action: 'moveTo', x: Math.floor(width / 2), y: Math.floor(height * 0.7) },
    'release',
  ]);
  await browser.pause(500);
}

// ──────────────────────────────────────────────────────────────────────────────
// Assertions & Waiters
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Wait for a text to be visible on screen.
 */
async function waitForText(text, timeout = TIMEOUTS.MEDIUM) {
  const el = await $(`android=new UiSelector().text("${text}")`);
  await el.waitForDisplayed({ timeout });
  return true;
}

/**
 * Check if text is displayed on the current screen.
 */
async function isTextDisplayed(text, timeout = TIMEOUTS.SHORT) {
  try {
    const el = await $(`android=new UiSelector().text("${text}")`);
    return await el.isDisplayed();
  } catch {
    return false;
  }
}

/**
 * Wait for splash screen to pass (Orin app starts at /splash).
 */
async function waitForSplashToFinish(timeout = TIMEOUTS.EXTRA_LONG) {
  // The splash screen transitions to login. Wait for login screen elements.
  try {
    await waitForText('Welcome Back', timeout);
  } catch {
    // May already be past login if user is already authenticated
    // Check for other known screens
    const isOnFeed = await isTextDisplayed('Explore Events');
    const isOnRole = await isTextDisplayed('Choose Your Path');
    const isOnSignup = await isTextDisplayed('Join Orin');
    if (!isOnFeed && !isOnRole && !isOnSignup) {
      throw new Error('Splash screen did not transition to a known screen');
    }
  }
}

/**
 * Navigate back (Android back button).
 */
async function pressBack() {
  await browser.pressKeyCode(4); // KEYCODE_BACK
}

/**
 * Pause for a specified duration (use sparingly).
 */
async function wait(ms) {
  await browser.pause(ms);
}

// ──────────────────────────────────────────────────────────────────────────────
// Test Data
// ──────────────────────────────────────────────────────────────────────────────

const TEST_DATA = {
  // Test user credentials (create these in Firebase beforehand or via signup test)
  validUser: {
    email: 'orin.test.user@example.com',
    password: ['TestPass123', '!'].join(''),
    firstName: 'Test',
    lastName: 'User',
    institution: 'Test University',
  },
  newUser: {
    email: `orin.e2e.${Date.now()}@example.com`,
    password: ['E2eTest456', '!'].join(''),
    firstName: 'E2E',
    lastName: 'Tester',
    institution: 'QA University',
  },
  event: {
    title: `E2E Test Event ${Date.now()}`,
    description:
      'This is an automated E2E test event created by the Appium test suite. It tests the full event creation workflow.',
    venue: 'Virtual Auditorium',
    prize: '₹10,000 + Swag Kit',
    eligibility: 'All students welcome. No prior experience required.',
  },
  profile: {
    department: 'Computer Science',
    rollNumber: 'CS2024001',
    year: '2nd',
    linkedin: 'https://linkedin.com/in/testuser',
  },
};

module.exports = {
  TIMEOUTS,
  findByText,
  findByPartialText,
  findByAccessibilityId,
  findByResourceId,
  findByClassAndText,
  findAllByText,
  tapByText,
  tapByAccessibilityId,
  typeInField,
  typeInFieldByIndex,
  scrollDownToText,
  scrollUp,
  waitForText,
  isTextDisplayed,
  waitForSplashToFinish,
  pressBack,
  wait,
  TEST_DATA,
};
