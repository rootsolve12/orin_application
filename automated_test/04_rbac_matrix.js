/**
 * 04_rbac_matrix.js — Full RBAC matrix
 * Every role token × every role-restricted endpoint.
 * Records actual vs expected HTTP status.
 */
'use strict';
const http = require('http');
const cfg  = require('./00_config');
const { record, delay } = require('./lib_runner');

// Full endpoint list with expected access per role
// access: 'public' | 'any_auth' | 'organizer' | 'participant'
const ENDPOINTS = [
  // ── Auth ──────────────────────────────────────────────────────────────────
  { method: 'POST', path: '/api/auth/login',
    body: { email: 'x@x.com', password: 'x' },
    access: 'public', expectedPublic: 200, expectedParticipant: 200, expectedOrganizer: 200 },

  // ── Events (public reads) ────────────────────────────────────────────────
  { method: 'GET',  path: '/api/events',
    access: 'public', expectedPublic: 200, expectedParticipant: 200, expectedOrganizer: 200 },
  { method: 'GET',  path: '/api/events/e1',
    access: 'public', expectedPublic: 200, expectedParticipant: 200, expectedOrganizer: 200 },

  // ── Events (participant) ─────────────────────────────────────────────────
  { method: 'POST', path: '/api/events/e2/register',
    body: { userId: 'p1', autoFilledProfile: { name:'P', institution:'U', department:'CS',
            academicYear:'1', skills:[], resumeUrl:'', links:{} } },
    access: 'any_auth', expectedPublic: 401, expectedParticipant: 200, expectedOrganizer: 200 },
  { method: 'GET',  path: '/api/events/user/user_123/registrations',
    access: 'any_auth', expectedPublic: 401, expectedParticipant: 200, expectedOrganizer: 200 },
  { method: 'POST', path: '/api/events/e1/submit-assessment',
    body: { userId: 'p1', score: 80 },
    access: 'any_auth', expectedPublic: 401, expectedParticipant: 200, expectedOrganizer: 200 },
  { method: 'POST', path: '/api/events/e1/submit-project',
    body: { userId: 'p1', links: [], isFinalLock: false },
    access: 'any_auth', expectedPublic: 401, expectedParticipant: 200, expectedOrganizer: 200 },

  // ── Events (organizer-only) ───────────────────────────────────────────────
  { method: 'POST', path: '/api/events',
    body: { title: 'RBAC Test Event', status: 'Draft' },
    access: 'organizer', expectedPublic: 401, expectedParticipant: 403, expectedOrganizer: 200 },
  { method: 'GET',  path: '/api/events/organizer/stats',
    access: 'organizer', expectedPublic: 401, expectedParticipant: 403, expectedOrganizer: 200 },
  { method: 'POST', path: '/api/events/e1/advance',
    access: 'organizer', expectedPublic: 401, expectedParticipant: 403, expectedOrganizer: 200 },
  { method: 'GET',  path: '/api/events/e1/submissions',
    access: 'organizer', expectedPublic: 401, expectedParticipant: 403, expectedOrganizer: 200 },
  { method: 'POST', path: '/api/events/e1/submissions/sub_x/evaluate',
    body: { rubricScores:{}, feedback:'', isShortlisted:false },
    access: 'organizer', expectedPublic: 401, expectedParticipant: 403, expectedOrganizer: 200 },

  // ── Users ─────────────────────────────────────────────────────────────────
  { method: 'GET',  path: '/api/users/profile',
    access: 'any_auth', expectedPublic: 401, expectedParticipant: 200, expectedOrganizer: 200 },
  { method: 'POST', path: '/api/users/profile', body: { name: 'Test' },
    access: 'any_auth', expectedPublic: 401, expectedParticipant: 200, expectedOrganizer: 200 },

  // ── Collab ────────────────────────────────────────────────────────────────
  { method: 'POST', path: '/api/collab/team/create', body: { name: 'T', leaderId: 'u1' },
    access: 'any_auth', expectedPublic: 401, expectedParticipant: 200, expectedOrganizer: 200 },
  { method: 'POST', path: '/api/collab/team/join', body: { inviteCode: 'ZZZZZZ', userId: 'u1' },
    access: 'any_auth', expectedPublic: 401, expectedParticipant: [200,404], expectedOrganizer: [200,404] },
  { method: 'GET',  path: '/api/collab/team/user/user_123',
    access: 'any_auth', expectedPublic: 401, expectedParticipant: 200, expectedOrganizer: 200 },
  { method: 'GET',  path: '/api/collab/messages/user_123',
    access: 'any_auth', expectedPublic: 401, expectedParticipant: 200, expectedOrganizer: 200 },
  { method: 'POST', path: '/api/collab/messages/send',
    body: { sender:'u1', receiver:'u2', content:'test' },
    access: 'any_auth', expectedPublic: 401, expectedParticipant: 200, expectedOrganizer: 200 },
];

const ROLES = [
  { name: 'public',      token: null },
  { name: 'participant', token: cfg.TOKENS.participant },
  { name: 'organizer',   token: cfg.TOKENS.organizer   },
];

function expectedFor(ep, roleName) {
  const v = ep[`expected${roleName.charAt(0).toUpperCase()+roleName.slice(1)}`];
  return Array.isArray(v) ? v : [v];
}

module.exports = async function runRbacMatrix() {
  const results = [];
  for (const ep of ENDPOINTS) {
    for (const role of ROLES) {
      await delay(cfg.DELAY_MS);
      const headers = { 'Content-Type': 'application/json' };
      if (role.token) headers['Authorization'] = `Bearer ${role.token}`;
      const res = await req(ep.method, ep.path, headers, ep.body || null);
      const expectedSet = expectedFor(ep, role.name);
      const finding = !expectedSet.includes(res.status);
      results.push(record({
        endpoint:         ep.path,
        method:           ep.method,
        role:             role.name,
        status:           res.status,
        expected_status:  expectedSet[0],
        finding,
        severity:         finding
          ? (role.name === 'public' && res.status < 300 ? 'CRITICAL'
              : role.name === 'participant' && res.status < 300 ? 'HIGH' : 'MEDIUM')
          : 'OK',
        response_time_ms: res.ms,
        test_category:    'rbac_matrix',
        note:             finding
          ? `⚠ Expected ${expectedSet.join('/')} got ${res.status} [access=${ep.access}]`
          : `✓ ${res.status} as expected`
      }));
    }
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
