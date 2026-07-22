/**
 * 05_token_tampering.js — JWT tampering tests
 * Takes the valid token, decodes it, flips claims (role, sub), and
 * re-encodes WITHOUT re-signing. Server must reject with 401/403.
 * 2xx = CRITICAL (no signature verification).
 */
'use strict';
const http = require('http');
const cfg  = require('./00_config');
const { record, delay } = require('./lib_runner');

// Build a tampered JWT: decode header+payload, flip claims, keep ORIGINAL sig
// (so signature is invalid for the new payload)
function tamperJwt(originalToken, payloadOverrides) {
  // If token doesn't look like a JWT, craft one from scratch with bad sig
  const parts = (originalToken || '').split('.');
  let header, payload;
  try {
    header  = JSON.parse(Buffer.from(parts[0] || '', 'base64url').toString());
    payload = JSON.parse(Buffer.from(parts[1] || '', 'base64url').toString());
  } catch {
    header  = { alg: 'HS256', typ: 'JWT' };
    payload = { sub: 'user_123', role: 'participant', iat: Math.floor(Date.now()/1000) };
  }
  const newPayload = { ...payload, ...payloadOverrides };
  const h = Buffer.from(JSON.stringify(header)).toString('base64url');
  const p = Buffer.from(JSON.stringify(newPayload)).toString('base64url');
  const origSig = parts[2] || 'BADSIGNATURE';
  return `${h}.${p}.${origSig}`; // invalid signature
}

// Craft a totally fake JWT signed with "none" alg attack
function noneAlgJwt(payloadOverrides) {
  const header  = { alg: 'none', typ: 'JWT' };
  const payload = { sub: 'attacker', role: 'admin', iat: Math.floor(Date.now()/1000), ...payloadOverrides };
  const h = Buffer.from(JSON.stringify(header)).toString('base64url');
  const p = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${h}.${p}.`; // empty signature
}

const baseToken = cfg.TOKENS.participant || 'mock-jwt-token-123';

const TAMPER_VARIANTS = [
  {
    label:   'flip_role_to_admin_bad_sig',
    token:   tamperJwt(baseToken, { role: 'admin', sub: 'attacker' }),
    note:    'Role claim flipped to admin, original signature retained (invalid)'
  },
  {
    label:   'flip_sub_to_other_user_bad_sig',
    token:   tamperJwt(baseToken, { sub: 'other_user_999' }),
    note:    'sub claim changed to different user without re-signing'
  },
  {
    label:   'none_alg_admin',
    token:   noneAlgJwt({ role: 'admin' }),
    note:    '"alg:none" attack — unsigned token claiming admin role'
  },
  {
    label:   'none_alg_organizer',
    token:   noneAlgJwt({ role: 'organizer', sub: 'fake_org' }),
    note:    '"alg:none" attack — unsigned token claiming organizer role'
  },
  {
    label:   'expired_claim',
    token:   tamperJwt(baseToken, { exp: 1000, iat: 900 }),
    note:    'exp set to past timestamp (1000 = year 1970) — server should reject'
  },
  {
    label:   'wrong_issuer',
    token:   tamperJwt(baseToken, { iss: 'evil.com', aud: 'attacker' }),
    note:    'iss/aud claims replaced — server should validate issuer'
  }
];

// Probe a sensitive protected endpoint with each tampered token
const PROBE_ENDPOINT = { method: 'GET', path: '/api/users/profile' };
const PROBE_ORGANIZER = { method: 'GET', path: '/api/events/organizer/stats' };

module.exports = async function runTokenTampering() {
  const results = [];
  for (const v of TAMPER_VARIANTS) {
    for (const ep of [PROBE_ENDPOINT, PROBE_ORGANIZER]) {
      await delay(cfg.DELAY_MS);
      const headers = {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${v.token}`
      };
      const res = await req(ep.method, ep.path, headers, null);
      const finding = res.status >= 200 && res.status < 300;
      results.push(record({
        endpoint:         ep.path,
        method:           ep.method,
        role:             v.label,
        status:           res.status,
        expected_status:  401,
        finding,
        severity:         finding ? 'CRITICAL' : 'OK',
        response_time_ms: res.ms,
        test_category:    'token_tampering',
        note:             v.note + (finding
          ? ' — ⚠ SERVER ACCEPTED TAMPERED TOKEN'
          : ` — ✓ rejected with ${res.status}`)
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
