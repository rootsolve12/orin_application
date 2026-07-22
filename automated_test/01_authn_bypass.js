/**
 * 01_authn_bypass.js  — AuthN bypass tests
 * Sends requests to every protected endpoint with:
 *   (a) no token
 *   (b) a malformed token
 *   (c) an expired/fake token
 * A 2xx response with no/bad auth = FINDING.
 */
'use strict';
const http    = require('http');
const cfg     = require('./00_config');
const { record, delay } = require('./lib_runner');

// All endpoints that *should* require authentication
const PROTECTED = [
  { method: 'GET',  path: '/api/users/profile'                                     },
  { method: 'POST', path: '/api/users/profile',         body: { name: 'hacked' }   },
  { method: 'POST', path: '/api/events',                body: { title: 'evil evt' } },
  { method: 'GET',  path: '/api/events/organizer/stats'                             },
  { method: 'POST', path: '/api/events/e1/advance'                                  },
  { method: 'POST', path: '/api/events/e1/register',
    body: { userId: 'attacker', autoFilledProfile: { name:'a', institution:'b',
            department:'c', academicYear:'1', skills:[], resumeUrl:'', links:{} } } },
  { method: 'GET',  path: '/api/events/user/user_123/registrations'                 },
  { method: 'POST', path: '/api/events/e1/submit-assessment', body: { userId:'a', score:100 } },
  { method: 'POST', path: '/api/events/e1/submit-project',
    body: { userId: 'a', links: [], isFinalLock: false }                            },
  { method: 'GET',  path: '/api/events/e1/submissions'                              },
  { method: 'POST', path: '/api/events/e1/submissions/sub_fake/evaluate',
    body: { rubricScores:{}, feedback:'hack', isShortlisted:false }                 },
  { method: 'POST', path: '/api/collab/team/create',    body: { name:'t', leaderId:'x' } },
  { method: 'POST', path: '/api/collab/team/join',      body: { inviteCode:'AAA', userId:'x' } },
  { method: 'GET',  path: '/api/collab/team/user/user_123'                          },
  { method: 'GET',  path: '/api/collab/messages/user_123'                           },
  { method: 'POST', path: '/api/collab/messages/send',  body: { sender:'a', receiver:'b', content:'x' } },
];

const VARIANTS = [
  { label: 'no_token',      header: null },
  { label: 'malformed',     header: 'Bearer not.a.jwt' },
  { label: 'expired_fake',  header: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdHRhY2tlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTAwMH0.BADSIG' }
];

module.exports = async function runAuthnBypass() {
  const results = [];
  for (const ep of PROTECTED) {
    for (const v of VARIANTS) {
      await delay(cfg.DELAY_MS);
      const headers = { 'Content-Type': 'application/json' };
      if (v.header) headers['Authorization'] = v.header;
      const res = await req(ep.method, ep.path, headers, ep.body || null);
      const finding = res.status >= 200 && res.status < 300;
      results.push(record({
        endpoint:       ep.path,
        method:         ep.method,
        role:           v.label,
        status:         res.status,
        expected_status: 401,
        finding:        finding,
        severity:       finding ? 'CRITICAL' : 'OK',
        response_time_ms: res.ms,
        test_category:  'authn_bypass',
        note:           finding
          ? `⚠ Endpoint returned ${res.status} with ${v.label} — authentication NOT enforced`
          : `✓ Correctly rejected with ${res.status}`
      }));
    }
  }
  return results;
};

function req(method, urlPath, headers, body) {
  return new Promise(resolve => {
    const url   = new URL(cfg.BASE_URL + urlPath);
    const opts  = {
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
