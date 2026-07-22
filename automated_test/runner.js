/**
 * runner.js — DAST master orchestrator for Orin API
 *
 * Usage:
 *   node automated_test/runner.js
 *
 * Reads config from input.json, runs all 8 test categories,
 * writes automated_test/report.json, and prints a summary.
 */
'use strict';
const fs   = require('fs');
const path = require('path');
const http = require('http');

// ── Bootstrap ────────────────────────────────────────────────────────────────
const cfg = require('./00_config');

// ── Test modules ─────────────────────────────────────────────────────────────
const runAuthnBypass    = require('./01_authn_bypass');
const runAuthzPrivesc   = require('./02_authz_privesc');
const runIdor           = require('./03_idor');
const runRbacMatrix     = require('./04_rbac_matrix');
const runTokenTampering = require('./05_token_tampering');
const runInjection      = require('./06_injection');
const runRateLimit      = require('./07_rate_limit');
const runHardcodedCreds = require('./08_hardcoded_creds');

// ── Helpers ──────────────────────────────────────────────────────────────────
const SEV_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, OK: 4 };

function banner(msg) {
  console.log('\n' + '═'.repeat(60));
  console.log(`  ${msg}`);
  console.log('═'.repeat(60));
}

function statusIcon(r) {
  if (!r.finding) return '✓';
  if (r.severity === 'CRITICAL') return '✗✗';
  if (r.severity === 'HIGH')     return '✗';
  return '⚠';
}

async function checkServerAlive() {
  return new Promise(resolve => {
    const url  = new URL(cfg.BASE_URL + '/api/events');
    const opts = { hostname: url.hostname, port: url.port || 80, path: '/api/events',
                   method: 'GET', timeout: 5000 };
    const r = http.request(opts, resp => resolve(resp.statusCode < 500));
    r.on('error', () => resolve(false));
    r.on('timeout', () => { r.destroy(); resolve(false); });
    r.end();
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  banner('Orin API — DAST Runner');
  console.log(`  Base URL : ${cfg.BASE_URL}`);
  console.log(`  Started  : ${new Date().toISOString()}`);

  // Verify server is reachable
  const alive = await checkServerAlive();
  if (!alive) {
    console.error('\n❌  Cannot reach the API at ' + cfg.BASE_URL);
    console.error('   Start the backend first:  cd backend && node server.js');
    console.error('   Then re-run:  node automated_test/runner.js\n');
    process.exit(2);
  }
  console.log('  Server   : ✓ reachable\n');

  const allResults = [];
  const categories = [
    { name: '1 — AuthN Bypass',        fn: runAuthnBypass    },
    { name: '2 — AuthZ / PrivEsc',     fn: runAuthzPrivesc   },
    { name: '3 — IDOR',                fn: runIdor           },
    { name: '4 — RBAC Matrix',         fn: runRbacMatrix     },
    { name: '5 — Token Tampering',     fn: runTokenTampering },
    { name: '6 — Injection Probes',    fn: runInjection      },
    { name: '7 — Rate Limiting',       fn: runRateLimit      },
    { name: '8 — Hardcoded Creds',     fn: runHardcodedCreds },
  ];

  for (const cat of categories) {
    banner(`Category ${cat.name}`);
    try {
      const results = await cat.fn();
      allResults.push(...results);
      const findings = results.filter(r => r.finding);
      console.log(`  Tests run : ${results.length}`);
      console.log(`  Findings  : ${findings.length}`);
      findings.forEach(r => {
        console.log(`  ${statusIcon(r)} [${r.severity}] ${r.method} ${r.endpoint}`);
        console.log(`     ${r.note}`);
      });
      if (findings.length === 0) console.log('  ✓ No findings in this category');
    } catch (err) {
      console.error(`  ❌ Category errored: ${err.message}`);
    }
  }

  // ── Write report.json ──────────────────────────────────────────────────────
  const reportPath = path.join(__dirname, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify(allResults, null, 2), 'utf8');

  // ── Final summary ──────────────────────────────────────────────────────────
  banner('SUMMARY');
  const findings     = allResults.filter(r => r.finding);
  const bySeverity   = {};
  const byCategory   = {};
  findings.forEach(r => {
    bySeverity[r.severity]    = (bySeverity[r.severity]    || 0) + 1;
    byCategory[r.test_category] = (byCategory[r.test_category] || 0) + 1;
  });

  console.log(`  Total tests run : ${allResults.length}`);
  console.log(`  Total findings  : ${findings.length}`);
  console.log('\n  By Severity:');
  Object.entries(bySeverity)
    .sort((a,b) => (SEV_ORDER[a[0]]??99) - (SEV_ORDER[b[0]]??99))
    .forEach(([sev, cnt]) => console.log(`    ${sev.padEnd(10)}: ${cnt}`));

  console.log('\n  By Category:');
  Object.entries(byCategory).forEach(([cat, cnt]) =>
    console.log(`    ${cat.padEnd(25)}: ${cnt} finding(s)`));

  console.log('\n  Top issues to fix first:');
  findings
    .sort((a,b) => (SEV_ORDER[a.severity]??99) - (SEV_ORDER[b.severity]??99))
    .slice(0, 10)
    .forEach((r, i) => {
      console.log(`  ${i+1}. [${r.severity}] ${r.method} ${r.endpoint} (${r.test_category})`);
      console.log(`     ${r.note.slice(0, 120)}`);
    });

  console.log(`\n  Report written → ${reportPath}`);
  console.log(`  Finished   : ${new Date().toISOString()}\n`);
})();
