/**
 * Orin E2E Framework - Legacy Test Entry (kept for backwards compatibility)
 * This file is superseded by the modular suite files in tests/auth/, tests/navigation/,
 * tests/explore/, tests/ui/ — please use those instead.
 *
 * Run all suites: npm run test
 * Run auth only:  npm run test:auth
 */
'use strict';

// This file is intentionally left minimal.
// All tests have been moved to the modular test suites.
// See: tests/auth/auth.test.js, tests/navigation/navigation.test.js,
//      tests/explore/explore.test.js, tests/ui/ui.test.js
describe('Orin E2E Framework — Index', function () {
  it('Framework loads correctly', function () {
    // This verifies the framework configuration is importable
    const config = require('../config/framework.config');
    const assert = require('assert');
    assert.ok(config.baseUrl, 'Base URL must be defined');
    assert.ok(config.routes.login, 'Login route must be defined');
  });
});
