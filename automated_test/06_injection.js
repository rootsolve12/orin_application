/**
 * 06_injection.js — SQLi / NoSQLi / template-injection detection probes
 * Detection only — flags anomalous status codes, error text, or timing.
 * Does NOT dump data. Probes string params in query and body.
 */
'use strict';
const http = require('http');
const cfg  = require('./00_config');
const { record, delay } = require('./lib_runner');

// Classic detection payloads — chosen to trigger errors, not extract data
const PAYLOADS = [
  { label: 'sqli_single_quote',        value: "'" },
  { label: 'sqli_or_1eq1',             value: "' OR '1'='1" },
  { label: 'sqli_comment',             value: "1; --" },
  { label: 'sqli_union_probe',         value: "1 UNION SELECT null--" },
  { label: 'nosqli_ne_operator',       value: { $ne: null } },
  { label: 'nosqli_regex',             value: { $regex: '.*' } },
  { label: 'nosqli_where',             value: { $where: '1==1' } },
  { label: 'template_injection_basic', value: '{{7*7}}' },
  { label: 'template_injection_erb',   value: '<%= 7*7 %>' },
  { label: 'ssti_python',              value: '${7*7}' },
  { label: 'null_byte',               value: '\x00' },
  { label: 'oversized_input',          value: 'A'.repeat(10000) },
];

// Probe targets: endpoint + param location (body field or query param)
const PROBE_TARGETS = [
  // Query params
  { method: 'GET',  path: '/api/events',       paramType: 'query',  paramKey: 'category'   },
  { method: 'GET',  path: '/api/events/organizer/stats', paramType: 'query', paramKey: 'userId' },
  // URL path segment (inject into event ID)
  { method: 'GET',  path: '/api/events/INJECT', paramType: 'path',   paramKey: 'id'         },
  { method: 'GET',  path: '/api/events/user/INJECT/registrations', paramType: 'path', paramKey: 'userId' },
  // Body fields
  { method: 'POST', path: '/api/auth/login',    paramType: 'body',   paramKey: 'email'      },
  { method: 'POST', path: '/api/auth/login',    paramType: 'body',   paramKey: 'password'   },
  { method: 'POST', path: '/api/collab/team/create', paramType: 'body', paramKey: 'name'    },
  { method: 'POST', path: '/api/collab/messages/send', paramType: 'body', paramKey: 'content' },
];

// Anomaly detection heuristics
function isAnomalous(res, baseline) {
  const errorKeywords = ['error', 'exception', 'stack', 'syntax', 'sql', 'mongo',
                         'eval', 'unexpected', 'query', 'database', 'db error'];
  const body = (res.body || '').toLowerCase();
  const hasErrorLeak = errorKeywords.some(k => body.includes(k));
  // Timing anomaly: >3× baseline or >3000ms absolute
  const timingAnomaly = res.ms > Math.max(baseline * 3, 3000);
  // Unexpected 5xx
  const serverError = res.status >= 500;
  return { hasErrorLeak, timingAnomaly, serverError, anomalous: hasErrorLeak || timingAnomaly || serverError };
}

module.exports = async function runInjection() {
  const results = [];

  // First, get baseline response times for each endpoint
  const baselines = {};
  for (const t of PROBE_TARGETS) {
    const res = await req(t.method, t.path.replace('INJECT', 'e1'), {
      'Content-Type': 'application/json'
    }, t.paramType === 'body' ? buildBody(t.paramKey, 'safe_value') : null);
    baselines[t.path + t.paramKey] = res.ms || 100;
    await delay(100);
  }

  for (const t of PROBE_TARGETS) {
    for (const p of PAYLOADS) {
      await delay(cfg.DELAY_MS);
      let urlPath = t.path;
      let body    = null;
      let qs      = '';

      if (t.paramType === 'path') {
        const injected = typeof p.value === 'object'
          ? encodeURIComponent(JSON.stringify(p.value))
          : encodeURIComponent(String(p.value));
        urlPath = t.path.replace('INJECT', injected);
      } else if (t.paramType === 'query') {
        const injected = typeof p.value === 'object'
          ? JSON.stringify(p.value)
          : String(p.value);
        qs = `?${t.paramKey}=${encodeURIComponent(injected)}`;
      } else if (t.paramType === 'body') {
        body = buildBody(t.paramKey, p.value);
      }

      const headers = { 'Content-Type': 'application/json' };
      const res = await req(t.method, urlPath + qs, headers, body);
      const baseline = baselines[t.path + t.paramKey] || 100;
      const { anomalous, hasErrorLeak, timingAnomaly, serverError } = isAnomalous(res, baseline);

      const noteDetails = [
        hasErrorLeak   ? 'error-text-in-response' : '',
        timingAnomaly  ? `timing-anomaly(${res.ms}ms vs ${baseline}ms baseline)` : '',
        serverError    ? `5xx-server-error` : ''
      ].filter(Boolean).join(', ');

      results.push(record({
        endpoint:         urlPath,
        method:           t.method,
        role:             `injection/${p.label}`,
        status:           res.status,
        expected_status:  400,
        finding:          anomalous,
        severity:         anomalous ? (serverError ? 'HIGH' : 'MEDIUM') : 'OK',
        response_time_ms: res.ms,
        test_category:    'injection_probe',
        note:             anomalous
          ? `⚠ Anomaly detected [${noteDetails}] with payload: ${p.label}`
          : `✓ No anomaly (${res.status}, ${res.ms}ms)`
      }));
    }
  }
  return results;
};

function buildBody(key, value) {
  const bodies = {
    email:    { email: value, password: 'testpass' },
    password: { email: 'test@test.com', password: value },
    name:     { name: value, leaderId: 'u1' },
    content:  { sender: 'u1', receiver: 'u2', content: value },
    userId:   { userId: value }
  };
  return bodies[key] || { [key]: value };
}

function req(method, urlPath, headers, body) {
  return new Promise(resolve => {
    let safePath = urlPath;
    try { safePath = new URL(cfg.BASE_URL + urlPath).pathname +
                     new URL(cfg.BASE_URL + urlPath).search; } catch {}
    const url  = new URL(cfg.BASE_URL + (safePath || urlPath));
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
