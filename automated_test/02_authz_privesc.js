/**
 * 02_authz_privesc.js — AuthZ / privilege escalation tests
 * Calls organizer/admin-restricted endpoints with the participant token.
 * 2xx = finding (lower-privilege user can perform privileged action).
 */
'use strict';
const http = require('http');
const cfg  = require('./00_config');
const { record, delay } = require('./lib_runner');

// Endpoints that should require ORGANIZER or ADMIN role
const ORGANIZER_ONLY = [
  { method: 'POST', path: '/api/events',                body: { title: 'PrivEsc Event', status: 'Published' } },
  { method: 'GET',  path: '/api/events/organizer/stats'                             },
  { method: 'POST', path: '/api/events/e1/advance'                                  },
  { method: 'GET',  path: '/api/events/e1/submissions'                              },
  { method: 'POST', path: '/api/events/e1/submissions/sub_fake/evaluate',
    body: { rubricScores:{codeQuality:10}, feedback:'hack', isShortlisted:true }    },
];

// Endpoints that should require ownership (e.g., only the user themselves)
const OWNERSHIP_REQUIRED = [
  { method: 'GET',  path: '/api/events/user/OTHER_USER_ID/registrations' },
  { method: 'GET',  path: '/api/collab/team/user/OTHER_USER_ID'          },
  { method: 'GET',  path: '/api/collab/messages/OTHER_USER_ID'           },
];

module.exports = async function runAuthzPrivesc() {
  const results = [];

  // Test participant token against organizer-only endpoints
  for (const ep of ORGANIZER_ONLY) {
    await delay(cfg.DELAY_MS);
    const token = cfg.TOKENS.participant;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await req(ep.method, ep.path, headers, ep.body || null);
    const finding = res.status >= 200 && res.status < 300;
    results.push(record({
      endpoint:        ep.path,
      method:          ep.method,
      role:            'participant_vs_organizer',
      status:          res.status,
      expected_status: 403,
      finding,
      severity:        finding ? 'CRITICAL' : 'OK',
      response_time_ms: res.ms,
      test_category:   'authz_privesc',
      note:            finding
        ? `⚠ Participant token can perform organizer action — RBAC not enforced`
        : `✓ Correctly rejected with ${res.status}`
    }));
  }

  // Test cross-user data access (IDOR via ownership check)
  for (const ep of OWNERSHIP_REQUIRED) {
    await delay(cfg.DELAY_MS);
    const token = cfg.TOKENS.participant;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await req(ep.method, ep.path, headers, null);
    const finding = res.status >= 200 && res.status < 300;
    results.push(record({
      endpoint:        ep.path,
      method:          ep.method,
      role:            'participant_cross_user',
      status:          res.status,
      expected_status: 403,
      finding,
      severity:        finding ? 'HIGH' : 'OK',
      response_time_ms: res.ms,
      test_category:   'authz_privesc',
      note:            finding
        ? `⚠ Can access another user's data without ownership check`
        : `✓ Correctly rejected with ${res.status}`
    }));
  }

  return results;
};

function req(method, urlPath, headers, body) {
  return new Promise(resolve => {
    const url  = new URL(cfg.BASE_URL + urlPath);
    const opts = {
      hostname: url.hostname, port: url.port || 80,
      path: url.pathname + url.search, method,
      headers, timeout: cfg.TIMEOUT_MS
    };
    const bodyStr = body ? JSON.stringify(body) : null;
    if (bodyStr) opts.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    const t0 = Date.now();
    const r = http.request(opts, resp => {
      let d = '';
      resp.on('data', c => d += c);
      resp.on('end', () => resolve({ status: resp.statusCode, body: d, ms: Date.now() - t0 }));
    });
    r.on('error', e => resolve({ status: 0, body: e.message, ms: Date.now() - t0 }));
    r.on('timeout', () => { r.destroy(); resolve({ status: 0, body: 'TIMEOUT', ms: cfg.TIMEOUT_MS }); });
    if (bodyStr) r.write(bodyStr);
    r.end();
  });
}
