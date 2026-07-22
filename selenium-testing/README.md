# 🟣 Orin E2E Selenium Automation Framework

> **Enterprise-grade, production-ready** end-to-end automation framework for the Orin React application.
> Built with **Selenium WebDriver**, **Mocha**, **Chai**, **Winston**, **Mochawesome**, and **ExcelJS**.

---

## 📁 Framework Architecture

```
selenium-testing/
├── config/
│   └── framework.config.js       # Central config (URLs, timeouts, credentials)
├── pages/                        # Page Object Model (POM)
│   ├── BasePage.js               # Shared utilities (waits, clicks, assertions)
│   ├── LoginPage.js              # /login interactions
│   ├── SignupPage.js             # /signup multi-step form
│   ├── NavigationPage.js         # Bottom nav, drawer, routing
│   └── ExplorePage.js            # Event discovery, search, chips
├── tests/
│   ├── auth/
│   │   └── auth.test.js          # TC-AUTH-001 to TC-AUTH-015 (15 tests)
│   ├── navigation/
│   │   └── navigation.test.js    # TC-NAV-001  to TC-NAV-015  (15 tests)
│   ├── explore/
│   │   └── explore.test.js       # TC-EXPLORE-001 to TC-EXPLORE-015 (15 tests)
│   └── ui/
│       └── ui.test.js            # TC-UI-001  to TC-UI-015   (15 tests)
├── utils/
│   ├── logger.js                 # Winston structured logger
│   ├── driverFactory.js          # Chrome / Edge / Firefox builder
│   ├── screenshotHelper.js       # Failure screenshot capture
│   ├── excelReporter.js          # Multi-sheet styled Excel report
│   └── testHelpers.js            # Shared Mocha lifecycle hooks
├── reports/                      # Generated at runtime (gitignored)
│   ├── *.xlsx                    # Excel reports
│   ├── html/                     # Mochawesome HTML report
│   ├── screenshots/              # Failure screenshots
│   └── logs/                     # Winston log files
├── rootHooks.js                  # Global before/after — report generation
└── package.json                  # All scripts and dependencies
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- Chrome, Edge, or Firefox installed
- Orin frontend running on `http://localhost:5173`

### Install
```bash
cd selenium-testing
npm install
```

### Run All Tests (headless, Chrome)
```bash
npm test
```

### Run by Suite
```bash
npm run test:auth        # Authentication tests only
npm run test:navigation  # Navigation tests only
npm run test:explore     # Explore & discovery tests
npm run test:ui          # UI behavior & form validation
```

### Run in Different Browsers
```bash
npm run test:chrome      # Chrome (default)
npm run test:edge        # Microsoft Edge
npm run test:firefox     # Firefox
```

### Run Headed (visible browser)
```bash
npm run test:headed
```

### Run for CI/CD
```bash
npm run test:ci
```

---

## 📊 Reports

After each run, reports are generated in `./reports/`:

| Report       | Location                              | Description                          |
|-------------|---------------------------------------|--------------------------------------|
| **Excel**   | `reports/Orin_E2E_Test_Report_*.xlsx` | Summary + details + failures sheets  |
| **HTML**    | `reports/html/orin-e2e-report.html`   | Mochawesome interactive report       |
| **Logs**    | `reports/logs/e2e-all.log`            | Winston structured log file          |
| **Screenshots** | `reports/screenshots/*.png`       | Failure screenshots (auto-captured)  |

---

## ⚙️ Configuration

Edit `config/framework.config.js` to change:

| Setting              | Default                        | Description                    |
|---------------------|--------------------------------|--------------------------------|
| `baseUrl`           | `http://localhost:5173`        | App URL (override: `APP_URL`)  |
| `browser.default`   | `chrome`                       | Browser (override: `BROWSER`)  |
| `browser.headless`  | `true`                         | Headless mode (override: `HEADLESS=false`) |
| `testCredentials`   | see config                     | Test user email/password       |
| `timeouts.*`        | see config                     | Wait/timeout values            |

### Environment Variables
```bash
APP_URL=http://localhost:5173
BROWSER=chrome          # chrome | edge | firefox
HEADLESS=false          # true | false
TEST_USER_EMAIL=user@srmist.edu.in
TEST_USER_PASSWORD=YourPass@123
```

---

## 🤖 GitHub Actions CI/CD

The workflow `.github/workflows/e2e-selenium.yml` automatically:

1. ✅ Triggers on push/PR to `main` or `develop`
2. 🏗️ Builds the React application
3. 🚀 Starts the Vite dev server
4. 🧪 Runs all 60 E2E tests in Chrome
5. 📊 Uploads HTML, Excel, screenshot, and log artifacts

### Required GitHub Secrets

Set these in **Settings → Secrets → Actions**:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
E2E_TEST_USER_EMAIL
E2E_TEST_USER_PASSWORD
```

---

## 🧪 Test Suites (60 Tests Total)

| Suite               | Tests | IDs                        | Description                            |
|--------------------|-------|----------------------------|----------------------------------------|
| 🔐 Authentication  | 15    | TC-AUTH-001 to TC-AUTH-015 | Login, signup, password, auth guards   |
| 🧭 Navigation      | 15    | TC-NAV-001 to TC-NAV-015   | Routes, deep links, back navigation    |
| 🔍 Explore         | 15    | TC-EXPLORE-001 to TC-EXPLORE-015 | Event discovery, search, overflow |
| 🎨 UI Behavior     | 15    | TC-UI-001 to TC-UI-015     | Form validation, labels, keyboard nav  |

---

## 🛠️ Adding New Tests

1. Create a new page object in `pages/YourPage.js` extending `BasePage`
2. Create a new test file in `tests/yourmodule/yourmodule.test.js`
3. Push to results array via the `afterEach` hook pattern
4. Run with `mocha --require rootHooks.js 'tests/yourmodule/**/*.test.js'`

---

*Generated by Antigravity Agent · Orin Automation Framework v2.0*
