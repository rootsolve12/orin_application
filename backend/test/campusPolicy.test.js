const { test } = require('node:test');
const assert = require('node:assert/strict');
const p = require('../domain/campusPolicy');
const actor = { id: 'u1', emailVerified: true, collegeId: 'a', verificationStatus: 'verified', year: 2, roles: [] };
const event = { collegeId: 'a', organizerId: 'host', visibility: 'college_only', status: 'published', registrationDeadline: '2030-01-01T00:00:00Z' };
test('college boundary applies equally to listing and registration', () => {
  const outsider = { ...actor, collegeId: 'b' };
  assert.equal(p.canView(outsider, event), false);
  assert.equal(p.registrationFailure(outsider, event), 'audience_restricted');
  assert.equal(p.registrationFailure(actor, event), null);
});
test('unverified college claims do not grant access', () => {
  assert.equal(p.canView({ ...actor, verificationStatus: 'pending' }, event), false);
});
test('partner audience requires explicit allowlist; proximity is insufficient', () => {
  const e = { ...event, visibility: 'partner', collegeId: 'b' };
  assert.equal(p.canView(actor, e), false);
  assert.equal(p.canView(actor, e, ['a']), true);
});
test('drafts are private even when public is selected', () => {
  assert.equal(p.canView(null, { ...event, status: 'draft', visibility: 'public' }), false);
});
test('role grants are scoped, active, and ownership constrained', () => {
  const host = { ...actor, id: 'host', roles: [{ role: 'organizer', collegeId: 'a', status: 'active' }] };
  assert.equal(p.canManage(host, event), true);
  assert.equal(p.canManage(host, { ...event, collegeId: 'b' }), false);
  assert.equal(p.canManage(host, { ...event, organizerId: 'other' }), false);
  assert.equal(p.canManage({ ...host, roles: [{ role: 'organizer', collegeId: 'a', status: 'revoked' }] }, event), false);
});
test('deadline, cancelled event and missing eligibility fail closed', () => {
  assert.equal(p.registrationFailure(actor, event, [], Date.parse(event.registrationDeadline)), 'registration_closed');
  assert.equal(p.registrationFailure(actor, { ...event, status: 'cancelled' }), 'registration_unavailable');
  assert.equal(p.registrationFailure(actor, { ...event, eligibility: { branches: ['CSE'] } }), 'ineligible');
});
test('guest public discovery does not grant registration', () => {
  assert.equal(p.canView(null, { ...event, visibility: 'public' }), true);
  assert.equal(p.registrationFailure(null, event), 'verified_account_required');
});
