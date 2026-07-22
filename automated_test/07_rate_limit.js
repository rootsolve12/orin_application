/**
 * 07_rate_limit.js — Rate limiting verification
 * Sends a bounded burst of 30 requests to sensitive endpoints.
 * Confirms a rate-limit response (429) appears within the burst.
 * No 429 ever = FINDING (no rate limiting).
 */
'use strict';
const http = require('http');
const cfg  = require('./00_config');
const { record } = require('./lib_runner');

const BURST_COUNT = 30;

const PROBE_ENDPOINTS = [
  { method: 'POST', path: '/api/auth/login',
    body: { email: 'brute@test.com', password: 'wrongpass' },
    note: 'Login endpoint — critical to rate-limit (brute force risk)' },
  { method: 'GET',  path: '/api/events',
    body: null,
    note: 'Public listing endpoint — should have basic rate limiting' },
  { method: 'GET',  path: '/api/users/profile',
    body: null,
    note: 'Profile endpoint — rate limiting prevents enumeration' },
  { method: 'POST', path: '/api/events/e1/register',
    body: { userId: 'spammer', autoFilledProfile: {
      name:'S', institution:'X', department:'Y',
      academicYear:'1', skills:[], resumeUrl:'', links:{}
    }},
    note: 'Registration endpoint — rate limiting prevents spam registrations' },
];

module.exports = async function runRateLimit() {
  const results = [];

  for (const ep of PROBE_ENDPOINTS) {
    const statusCodes = [];
    const times       = [];

    // Fire BURST_COUNT requests as fast as possible (no delay between them)
    const promises = [];
    for (let i = 0; i < BURST_COUNT; i++) {
      promises.push(req(ep.method, ep.path, { 'Content-Type': 'application/json' }, ep.body));
    }
    const responses = await Promise.all(promises);
    responses.forEach(r => { statusCodes.push(r.status); times.push(r.ms); });

    const got429   = statusCodes.includes(429);
    const got503   = statusCodes.includes(503);
    const limited  = got429 || got503;
    const finding  = !limited;

    // Summary stats
    const avgMs = Math.round(times.reduce((a,b)=>a+b,0) / times.length);
    const statusSummary = [...new Set(statusCodes)].sort().join(', ');

    results.push(record({
      endpoint:         ep.path,
      method:           ep.method,
      role:             'burst_30',
      status:           got429 ? 429 : statusCodes[0],
      expected_status:  429,
      finding,
      severity:         finding
        ? (ep.path.includes('login') ? 'HIGH' : 'MEDIUM')
        : 'OK',
      response_time_ms: avgMs,
      test_category:    'rate_limiting',
      note:             finding
        ? `⚠ No 429/503 after ${BURST_COUNT} requests — rate limiting ABSENT. ` +
          `Statuses seen: [${statusSummary}] — ${ep.note}`
        : `✓ Rate limit detected after ${BURST_COUNT} req burst (saw ${got429?429:503}). ${ep.note}`
    }));

    // Small pause between endpoint bursts to avoid cascading test pollution
    await new Promise(r => setTimeout(r, 500));
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
