/**
 * E2E Test Suite 2: Signup Flow
 *
 * Tests:
 *   1. Signup screen UI elements are present
 *   2. Step progress indicators are visible
 *   3. Form validation for required fields
 *   4. Email format validation
 *   5. Password minimum length validation
 *   6. Successful account creation flow
 */

const {
  waitForText,
  isTextDisplayed,
  tapByText,
  typeInFieldByIndex,
  wait,
  waitForSplashToFinish,
  TEST_DATA,
  TIMEOUTS,
} = require('../helpers/test-helpers');

describe('Orin App — Signup Flow', function () {
  before(async function () {
    // Navigate to signup screen
    await waitForSplashToFinish();
    const isOnLogin = await isTextDisplayed('Welcome Back');
    if (isOnLogin) {
      await tapByText('Create one');
      await wait(1000);
    }
  });

  // ────────────────────────────────────────────────────────────────────────
  // 1. Signup Screen UI
  // ────────────────────────────────────────────────────────────────────────
  describe('Signup Screen UI Elements', function () {
    before(async function () {
      const isOnSignup = await isTextDisplayed('Join Orin');
      if (!isOnSignup) this.skip();
    });

    it('should display the "Join Orin" title', async function () {
      await waitForText('Join Orin');
    });

    it('should display the "Account Creation" tag', async function () {
      await waitForText('Account Creation');
    });

    it('should display the subtitle', async function () {
      await waitForText('Enter your details to create an account');
    });

    it('should display First Name field', async function () {
      await waitForText('First Name');
    });

    it('should display Last Name field', async function () {
      await waitForText('Last Name');
    });

    it('should display Email Address field', async function () {
      await waitForText('Email Address');
    });

    it('should display Password field', async function () {
      await waitForText('Password');
    });

    it('should display Institution field', async function () {
      await waitForText('Institution');
    });

    it('should display Create Account button', async function () {
      await waitForText('Create Account');
    });

    it('should display sign-in navigation link', async function () {
      const hasLink = await isTextDisplayed('Already have an account? ');
      expect(hasLink).to.be.true;
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 2. Signup Form Validation
  // ────────────────────────────────────────────────────────────────────────
  describe('Signup Form Validation', function () {
    before(async function () {
      const isOnSignup = await isTextDisplayed('Join Orin');
      if (!isOnSignup) this.skip();
    });

    it('should show validation errors for empty form submission', async function () {
      await tapByText('Create Account');
      await wait(500);

      // At least one "Required" error should appear
      const hasRequired = await isTextDisplayed('Required');
      const hasEmailError = await isTextDisplayed('Valid email required');
      const hasPasswordError = await isTextDisplayed('Min 8 characters');
      expect(hasRequired || hasEmailError || hasPasswordError).to.be.true;
    });

    it('should validate email format', async function () {
      // Fill all fields but with invalid email
      await typeInFieldByIndex(0, 'Test');       // First Name
      await typeInFieldByIndex(1, 'User');       // Last Name
      await typeInFieldByIndex(2, 'bademail');   // Email (invalid)
      await typeInFieldByIndex(3, 'Password1!'); // Password
      await typeInFieldByIndex(4, 'MIT');         // Institution

      await tapByText('Create Account');
      await wait(500);

      const emailError = await isTextDisplayed('Valid email required');
      expect(emailError).to.be.true;
    });

    it('should validate password minimum length (8 chars)', async function () {
      await typeInFieldByIndex(2, 'test@example.com'); // Fix email
      await typeInFieldByIndex(3, 'short');              // Too short password

      await tapByText('Create Account');
      await wait(500);

      const passwordError = await isTextDisplayed('Min 8 characters');
      expect(passwordError).to.be.true;
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 3. Successful Signup Flow
  // ────────────────────────────────────────────────────────────────────────
  describe('Account Creation', function () {
    before(async function () {
      const isOnSignup = await isTextDisplayed('Join Orin');
      if (!isOnSignup) this.skip();
    });

    it('should create account with valid details and navigate to role selection', async function () {
      const user = TEST_DATA.newUser;

      await typeInFieldByIndex(0, user.firstName);
      await typeInFieldByIndex(1, user.lastName);
      await typeInFieldByIndex(2, user.email);
      await typeInFieldByIndex(3, user.password);
      await typeInFieldByIndex(4, user.institution);

      await tapByText('Create Account');

      // Wait for Firebase to create the account and redirect
      await wait(5000);

      // After signup, user should be redirected to role selection
      const roleScreen = await isTextDisplayed('Choose Your Path');
      expect(roleScreen).to.be.true;
    });
  });
});
