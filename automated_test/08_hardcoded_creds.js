/**
 * 08_hardcoded_creds.js — Static codebase scan for committed secrets
 * Runs ENTIRELY from static analysis (no network requests).
 * Scans all JS/JSON/YAML/config files for patterns that indicate
 * hardcoded credentials, API keys, tokens, or private keys.
 */
'use strict';
const fs   = require('fs');
const path = require('path');
const { record } = require('./lib_runner');

const ROOT = path.resolve(__dirname, '..');

// Files / dirs to skip
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.idea',
  'automated_test', 'public'  // don't scan ourselves or compiled public assets
]);

// Pattern definitions: [label, regex, severity, note]
const PATTERNS = [
  // Hardcoded passwords / pass literals
  ['hardcoded_password_string',
    /pass(?:word)?\s*[=:]\s*['"`](?!process\.env)[^'"`\s]{3,}['"`]/gi,
    'HIGH', 'Literal password value assigned in source code'],

  // Gmail / SMTP credentials
  ['gmail_address_literal',
    /['"`][a-z0-9._%+\-]+@gmail\.com['"`]/gi,
    'MEDIUM', 'Hardcoded Gmail address found (potential credential)'],
  ['mock_app_password',
    /mock[_\-]?app[_\-]?password/gi,
    'HIGH', 'Mock app password string found — may be a placeholder masking a real secret'],

  // Firebase Web API Keys (AIza prefix, 39 chars)
  ['firebase_web_api_key',
    /AIza[0-9A-Za-z_\-]{35}/g,
    'HIGH', 'Firebase Web API key committed to repository — should be restricted in Firebase console'],

  // Generic API key patterns
  ['generic_api_key_assignment',
    /api[_\-]?key\s*[=:]\s*['"`][A-Za-z0-9_\-]{16,}['"`]/gi,
    'HIGH', 'Generic API key value committed in source'],

  // Private key headers (PEM)
  ['pem_private_key_header',
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    'CRITICAL', 'PEM private key block found in source file'],

  // JWT secrets in config
  ['jwt_secret_literal',
    /jwt[_\-]?secret\s*[=:]\s*['"`][^'"`\s]{8,}['"`]/gi,
    'CRITICAL', 'Hardcoded JWT secret — token forgery possible if leaked'],

  // Google OAuth client IDs / secrets
  ['google_oauth_client',
    /[0-9]{12}-[a-z0-9]{32}\.apps\.googleusercontent\.com/g,
    'MEDIUM', 'Google OAuth Client ID committed — verify it is intentionally public'],

  // Token/secret variable assignments with literal values
  ['token_literal_assignment',
    /(?:auth|bearer|access)[_\-]?token\s*[=:]\s*['"`][A-Za-z0-9_\-\.]{10,}['"`]/gi,
    'HIGH', 'Hardcoded auth/access token found in source'],

  // Database connection strings
  ['db_connection_string',
    /(?:mongodb|mysql|postgres|redis):\/\/[^'"`\s]{10,}/gi,
    'CRITICAL', 'Database connection string with credentials committed'],

  // Nodemailer / SMTP config with literals
  ['nodemailer_auth_literal',
    /auth\s*:\s*\{[^}]*(?:user|pass)\s*:\s*(?:process\.env\.[A-Z_]+\s*\|\|\s*)?['"`][^'"`\s]{4,}['"`]/gs,
    'HIGH', 'Nodemailer auth config contains fallback literal credential'],
];

function walkDir(dir, fileList = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return fileList; }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkDir(full, fileList);
    else if (/\.(js|jsx|ts|tsx|json|yaml|yml|env|config|md)$/i.test(e.name)) {
      fileList.push(full);
    }
  }
  return fileList;
}

module.exports = async function runHardcodedCreds() {
  const results = [];
  const files   = walkDir(ROOT);
  const ts      = new Date().toISOString();

  for (const filePath of files) {
    let content;
    try { content = fs.readFileSync(filePath, 'utf8'); } catch { continue; }
    const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');

    for (const [label, regex, severity, note] of PATTERNS) {
      regex.lastIndex = 0;
      let m;
      while ((m = regex.exec(content)) !== null) {
        // Redact the actual matched value — show only label
        const snippet = m[0].length > 80 ? m[0].slice(0, 77) + '...' : m[0];
        // Compute line number
        const lineNo = content.slice(0, m.index).split('\n').length;

        results.push(record({
          endpoint:         `FILE:${rel}:${lineNo}`,
          method:           'STATIC_SCAN',
          role:             'n/a',
          status:           0,
          expected_status:  0,
          finding:          true,
          severity,
          response_time_ms: 0,
          test_category:    'hardcoded_creds',
          note:             `${note} — pattern [${label}] matched at line ${lineNo}: "${snippet.replace(/\n/g,' ')}"`
        }));
        regex.lastIndex = m.index + 1; // avoid infinite loop on zero-width matches
      }
    }
  }

  if (results.length === 0) {
    results.push(record({
      endpoint: 'CODEBASE_SCAN', method: 'STATIC_SCAN', role: 'n/a',
      status: 0, expected_status: 0, finding: false, severity: 'OK',
      response_time_ms: 0, test_category: 'hardcoded_creds',
      note: '✓ No hardcoded secret patterns detected in scanned files'
    }));
  }

  return results;
};
