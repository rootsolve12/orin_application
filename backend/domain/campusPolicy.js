'use strict';
// Inputs must be loaded server-side. Never construct actor from request body/JWT roles.
function hasRole(actor, role, collegeId) {
  return !!actor && (actor.roles || []).some(g => g.status === 'active' &&
    (g.role === 'platform_admin' || (g.role === role && g.collegeId === collegeId)));
}
function verifiedCollege(actor) {
  return actor?.verificationStatus === 'verified' ? actor.collegeId : null;
}
function canManage(actor, event) {
  return hasRole(actor, 'college_admin', event.collegeId) ||
    (actor?.id === event.organizerId && hasRole(actor, 'organizer', event.collegeId));
}
function audienceAllows(actor, event, allowedColleges = []) {
  const college = verifiedCollege(actor);
  return event.visibility === 'public' || (!!college &&
    (college === event.collegeId ||
      (event.visibility === 'partner' && allowedColleges.includes(college))));
}
function canView(actor, event, allowedColleges = []) {
  return canManage(actor, event) ||
    (['published', 'ongoing', 'completed', 'cancelled'].includes(event.status) &&
      audienceAllows(actor, event, allowedColleges));
}
function registrationFailure(actor, event, allowedColleges = [], now = Date.now()) {
  if (!actor?.id || !actor.emailVerified) return 'verified_account_required';
  if (event.status !== 'published') return 'registration_unavailable';
  const deadline = Date.parse(event.registrationDeadline);
  if (!Number.isFinite(deadline) || now >= deadline) return 'registration_closed';
  if (!audienceAllows(actor, event, allowedColleges)) return 'audience_restricted';
  for (const [rule, field] of [['years', 'year'], ['branches', 'branch'], ['degreeLevels', 'degreeLevel']]) {
    const values = event.eligibility?.[rule];
    if (values && (!Array.isArray(values) || !values.includes(actor[field]))) return 'ineligible';
  }
  return null;
}
module.exports = { hasRole, verifiedCollege, canManage, audienceAllows, canView, registrationFailure };
