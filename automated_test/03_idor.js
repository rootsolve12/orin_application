/**
 * 03_idor.js — Insecure Direct Object Reference tests
 * Varies ID parameters (userId, eventId, submissionId) to reach another
 * principal's objects. The server uses hardcoded 'user_123' so we probe
 * as an "other" user trying to read/write user_123's data.
 */
'use strict';
const http = require('http');
const cfg  = require('./00_config');
const { record, delay } = require('./lib_runner');

// Known object IDs seeded in the in-memory DB
const KNOWN_USER_ID       = 'user_123';
const KNOWN_EVENT_IDS     = ['e1', 'e2', 'e3', 'e4'];
const ATTACKER_USER_ID    = 'attacker_999';

const IDOR_TESTS = [
  // User profile — server ignores token and serves user_123 always
  {
    label: 'read_other_user_profile_no_param',
    method: 'GET', path: '/api/users/profile',
    note: 'Profile endpoint ignores identity — always returns hardcoded user_123'
  },
  // User registrations via URL param — no ownership check
  {
    label: 'read_other_user_registrations',
    method: 'GET', path: `/api/events/user/${KNOWN_USER_ID}/registrations`,
    note: `Can enumerate registrations for ${KNOWN_USER_ID} by URL param`
  },
  // Register for event injecting a different userId in the body
  {
    label: 'register_as_another_user',
    method: 'POST', path: '/api/events/e2/register',
    body: {
      userId: KNOWN_USER_ID,  // <— attacker impersonates another user
      autoFilledProfile: {
        name: 'Attacker', institution: 'Evil Corp', department: 'Hax',
        academicYear: '1st', skills: [], resumeUrl: '', links: {}
      }
    },
    note: 'userId in body not validated against auth token — IDOR via body param'
  },
  // Team lookup by userId URL param
  {
    label: 'read_other_user_team',
    method: 'GET', path: `/api/collab/team/user/${KNOWN_USER_ID}`,
    note: 'Team lookup by userId URL param — no ownership check'
  },
  // Messages lookup by userId URL param
  {
    label: 'read_other_user_messages',
    method: 'GET', path: `/api/collab/messages/${KNOWN_USER_ID}`,
    note: 'Message inbox accessible to any caller knowing the userId'
  },
  // Submit assessment on behalf of another user
  {
    label: 'submit_assessment_as_another_user',
    method: 'POST', path: '/api/events/e1/submit-assessment',
    body: { userId: KNOWN_USER_ID, score: 100 },
    note: 'userId in body — attacker can forge assessment score for any user'
  },
  // Organizer stats — leaks org-level data with no auth
  {
    label: 'read_organizer_stats_no_auth',
    method: 'GET', path: '/api/events/organizer/stats?userId=attacker',
    note: 'Organizer dashboard stats accessible to any caller'
  },
  // Event submissions — leak all submissions for any event
  ...KNOWN_EVENT_IDS.map(id => ({
    label: `read_submissions_event_${id}`,
    method: 'GET', path: `/api/events/${id}/submissions`,
    note: `All submissions for event ${id} accessible without auth or ownership`
  }))
];

module.exports = async function runIdor() {
  const results = [];
  for (const t of IDOR_TESTS) {
    await delay(cfg.DELAY_MS);
    // Deliberately use NO token (or attacker token) to prove no ownership check
    const headers = { 'Content-Type': 'application/json' };
    // Use attacker token to simulate logged-in-but-wrong-user scenario
    if (cfg.TOKENS.participant) headers['Authorization'] = `Bearer ATTACKER_FAKE_TOKEN`;
    const res = await req(t.method, t.path, headers, t.body || null);
    const finding = res.status >= 200 && res.status < 300;
    results.push(record({
      endpoint:         t.path,
      method:           t.method,
      role:             'attacker_no_ownership',
      status:           res.status,
      expected_status:  403,
      finding,
      severity:         finding ? 'HIGH' : 'OK',
      response_time_ms: res.ms,
      test_category:    'idor',
      note:             t.note + (finding ? ' — ⚠ CONFIRMED ACCESSIBLE' : ' — ✓ blocked')
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
