# Orin — Appium E2E Tests

Automated end-to-end tests for the **Orin** Flutter Android application using [Appium](https://appium.io/) + [WebdriverIO](https://webdriver.io/) + Mocha.

## 📁 Folder Structure

```
apium-testing/
├── wdio.conf.js                   # WebdriverIO + Appium configuration
├── helpers/
│   └── test-helpers.js            # Shared utilities, finders, actions, test data
├── tests/
│   ├── 01-splash-login.test.js    # Splash screen & login flow
│   ├── 02-signup.test.js          # Account creation flow
│   ├── 03-onboarding.test.js      # Role selection & profile setup
│   ├── 04-event-feed.test.js      # Event feed, search & categories
│   ├── 05-event-creation.test.js  # 5-step event creation wizard
│   ├── 06-event-detail.test.js    # Event detail & registration
│   └── 07-navigation.test.js      # Bottom navigation transitions
├── screenshots/                   # Auto-captured on test failure
├── package.json
└── README.md
```

## 🧰 Prerequisites

1. **Node.js** v18+ installed
2. **Java JDK** 11+ (for Appium / UiAutomator2)
3. **Android SDK** with platform-tools and an emulator or connected device
4. **Flutter** APK built:
   ```bash
   cd ..  # orin_application root
   flutter build apk --debug
   ```
5. **ANDROID_HOME** / **JAVA_HOME** environment variables set

## 🚀 Setup

```bash
# 1. Install dependencies (already done if you ran npm install)
npm install

# 2. Install the Appium UiAutomator2 driver
npm run appium:install-driver

# 3. Start Appium server (in a separate terminal)
npm run appium

# 4. Start your Android emulator or connect a physical device
#    Verify with: adb devices
```

## ▶️ Running Tests

```bash
# Run ALL test suites
npm test

# Run individual suites
npm run test:login        # Splash & Login flow
npm run test:signup       # Account creation
npm run test:onboarding   # Role selection & Profile setup
npm run test:feed         # Event feed screen
npm run test:creation     # 5-step event creation wizard
npm run test:detail       # Event detail & registration
npm run test:nav          # Bottom navigation
```

## 🧪 Test Suites Overview

### 1. Splash & Login (`01-splash-login.test.js`)
- App launches and splash screen appears
- Splash transitions to login
- Login screen UI elements present
- Form validation (empty fields, invalid email, short password)
- Invalid credentials error message
- Navigation to signup and back

### 2. Signup (`02-signup.test.js`)
- Signup screen UI elements (name, email, password, institution)
- Form validation for all required fields
- Email format and password length checks
- Successful account creation → redirect to role selection

### 3. Onboarding (`03-onboarding.test.js`)
- Role selection screen (Participant vs Organizer)
- Role card selection and confirmation
- Profile setup fields (department, year, roll number)
- Interest tag toggling
- Complete setup → redirect to event feed

### 4. Event Feed (`04-event-feed.test.js`)
- Feed screen title and subtitle
- Search bar functionality
- Category tab filtering
- Event list or empty state
- FAB for event creation

### 5. Event Creation (`05-event-creation.test.js`)
- Step 1: Basic Info (title, category, mode, venue)
- Step 2: Description (description, eligibility, prizes)
- Step 3: Schedule (dates & deadlines)
- Step 4: Registration Settings (capacity, approval, participation mode)
- Step 5: Tags (toggle suggested tags)
- Step navigation (NEXT/Back)

### 6. Event Detail (`06-event-detail.test.js`)
- Navigate to event detail from feed
- Event info display (title, organizer, description)
- Info pills (mode, venue, participation)
- Registration progress bar
- Register/Apply button action
- Back navigation to feed

### 7. Bottom Navigation (`07-navigation.test.js`)
- Tab switching between Feed, Registrations, Profile
- Each screen renders correct content
- Navigation state is maintained

## 📝 Notes

### Flutter + Appium
Flutter renders its own UI tree, so standard Android selectors (`resource-id`, etc.) are limited. These tests use:
- **UiAutomator text selectors** — matching visible text rendered by Flutter
- **Accessibility ID** — matching `content-description` from Flutter's Semantics
- **Index-based EditText selection** — for form fields without unique IDs

### Test Data
Test credentials and event data are configured in `helpers/test-helpers.js` under `TEST_DATA`. Update these values to match your Firebase setup.

### Screenshots on Failure
Failed tests automatically capture screenshots to the `screenshots/` directory for debugging.

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| `Could not create session` | Ensure Appium server is running: `npm run appium` |
| `No emulator found` | Start an emulator: `emulator -avd <name>` or connect a device |
| `App not found` | Build the APK first: `flutter build apk --debug` |
| `UiAutomator2 driver not installed` | Run: `npm run appium:install-driver` |
| `Element not found` | Flutter may render text differently; check with `adb shell uiautomator dump` |
