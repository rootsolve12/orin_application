/**
 * E2E Test Suite 1: Splash & Login Flow
 *
 * Tests:
 *   1. App launches and splash screen is displayed
 *   2. Splash transitions to login screen
 *   3. Login screen has required UI elements
 *   4. Form validation shows errors for empty fields
 *   5. Form validation shows errors for invalid email
 *   6. Login with invalid credentials shows error message
 *   7. Navigation to signup screen works
 *   8. Navigation back to login from signup works
 */

const {
  waitForText,
  isTextDisplayed,
  tapByText,
  typeInFieldByIndex,
  findByText,
  wait,
  waitForSplashToFinish,
  TIMEOUTS,
} = require('../helpers/test-helpers');

describe('Orin App — Splash & Login Flow', function () {
  // ────────────────────────────────────────────────────────────────────────
  // 1. App Launch & Splash Screen
  // ────────────────────────────────────────────────────────────────────────
  describe('App Launch', function () {
    it('should launch the app successfully', async function () {
      // The app should be installed and launched by Appium capabilities
      // Wait a moment for Flutter engine to boot
      await wait(3000);

      // Verify app is running — check for any known screen
      const splashOrLogin =
        (await isTextDisplayed('Orin')) ||
        (await isTextDisplayed('Welcome Back')) ||
        (await isTextDisplayed('Explore Events'));

      expect(splashOrLogin).to.be.true;
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 2. Splash → Login Transition
  // ────────────────────────────────────────────────────────────────────────
  describe('Splash to Login Transition', function () {
    it('should transition from splash to login screen', async function () {
      await waitForSplashToFinish(TIMEOUTS.EXTRA_LONG);
      const loginVisible = await isTextDisplayed('Welcome Back');
      // If user is already logged in, they'll be on feed — that's okay too
      const feedVisible = await isTextDisplayed('Explore Events');
      expect(loginVisible || feedVisible).to.be.true;
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 3. Login Screen UI Elements
  // ────────────────────────────────────────────────────────────────────────
  describe('Login Screen UI', function () {
    before(async function () {
      // Ensure we're on login screen
      const isOnLogin = await isTextDisplayed('Welcome Back');
      if (!isOnLogin) {
        this.skip(); // Skip if user is already authenticated
      }
    });

    it('should display the welcome title', async function () {
      await waitForText('Welcome Back');
    });

    it('should display the subtitle', async function () {
      await waitForText('Sign in to your account to continue');
    });

    it('should display the authentication tag', async function () {
      await waitForText('Authentication Required');
    });

    it('should display email input field', async function () {
      await waitForText('Email Address');
    });

    it('should display password input field', async function () {
      await waitForText('Password');
    });

    it('should display Sign In button', async function () {
      await waitForText('Sign In');
    });

    it('should display Google sign-in option', async function () {
      await waitForText('Continue with Google');
    });

    it('should display signup navigation link', async function () {
      const hasLink = await isTextDisplayed("Don't have an account? ");
      const hasCreate = await isTextDisplayed('Create one');
      expect(hasLink || hasCreate).to.be.true;
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 4. Login Form Validation — Empty Fields
  // ────────────────────────────────────────────────────────────────────────
  describe('Login Form Validation', function () {
    before(async function () {
      const isOnLogin = await isTextDisplayed('Welcome Back');
      if (!isOnLogin) this.skip();
    });

    it('should show validation error when submitting empty form', async function () {
      // Tap Sign In without entering anything
      await tapByText('Sign In');
      await wait(500);

      // Flutter form validation should show error text
      const emailError = await isTextDisplayed('Enter a valid email');
      const passwordError = await isTextDisplayed('Min 6 characters');
      expect(emailError || passwordError).to.be.true;
    });

    it('should show email validation error for invalid email', async function () {
      // Type invalid email
      await typeInFieldByIndex(0, 'notanemail');
      await tapByText('Sign In');
      await wait(500);

      const emailError = await isTextDisplayed('Enter a valid email');
      expect(emailError).to.be.true;
    });

    it('should show password validation error for short password', async function () {
      // Type valid email but short password
      await typeInFieldByIndex(0, 'test@example.com');
      await typeInFieldByIndex(1, '123');
      await tapByText('Sign In');
      await wait(500);

      const passwordError = await isTextDisplayed('Min 6 characters');
      expect(passwordError).to.be.true;
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 5. Login with Invalid Credentials
  // ────────────────────────────────────────────────────────────────────────
  describe('Login Error Handling', function () {
    before(async function () {
      const isOnLogin = await isTextDisplayed('Welcome Back');
      if (!isOnLogin) this.skip();
    });

    it('should show error for invalid credentials', async function () {
      await typeInFieldByIndex(0, 'fake@nonexistent.com');
      await typeInFieldByIndex(1, 'wrongpassword123');
      await tapByText('Sign In');

      // Wait for Firebase auth to return error
      await wait(3000);

      const errorMsg = await isTextDisplayed('Invalid credentials. Check and retry.');
      expect(errorMsg).to.be.true;
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // 6. Navigate to Signup
  // ────────────────────────────────────────────────────────────────────────
  describe('Navigation to Signup', function () {
    before(async function () {
      const isOnLogin = await isTextDisplayed('Welcome Back');
      if (!isOnLogin) this.skip();
    });

    it('should navigate to signup when tapping Create one', async function () {
      await tapByText('Create one');
      await wait(1000);

      const signupVisible = await waitForText('Join Orin', TIMEOUTS.MEDIUM);
      expect(signupVisible).to.be.true;
    });

    it('should navigate back to login when tapping Sign In link', async function () {
      const isOnSignup = await isTextDisplayed('Join Orin');
      if (!isOnSignup) this.skip();

      await tapByText('Sign In');
      await wait(1000);

      const loginVisible = await isTextDisplayed('Welcome Back');
      expect(loginVisible).to.be.true;
    });
  });
});
