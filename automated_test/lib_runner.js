/**
 * lib_runner.js — shared utilities for all DAST test modules
 */
'use strict';

/**
 * Build a single result record.
 * @param {object} fields
 */
function record(fields) {
  return {
    endpoint:         fields.endpoint        || '',
    method:           fields.method          || '',
    role:             fields.role            || '',
    status:           fields.status          ?? null,
    expected_status:  fields.expected_status ?? null,
    finding:          !!fields.finding,
    severity:         fields.severity        || 'OK',
    response_time_ms: fields.response_time_ms ?? 0,
    test_category:    fields.test_category   || '',
    note:             fields.note            || '',
    timestamp:        new Date().toISOString()
  };
}

/**
 * Sleep for `ms` milliseconds.
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { record, delay };
