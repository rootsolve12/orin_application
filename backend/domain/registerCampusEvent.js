'use strict';
const { randomUUID } = require('node:crypto');
const { registrationFailure } = require('./campusPolicy');
class RegistrationError extends Error {
  constructor(code, status) { super(code); this.code = code; this.status = status; }
}
// pool follows node-postgres Pool interface. userId comes ONLY from authenticated session.
// Every seat-changing writer (cancel, promote, check-in) must lock the event first.
async function registerCampusEvent(pool, userId, eventId) {
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    const result = await db.query('SELECT * FROM campus.events WHERE id=$1 FOR UPDATE', [eventId]);
    const row = result.rows[0];
    if (!row) throw new RegistrationError('event_not_found', 404);
    const account = (await db.query('SELECT * FROM campus.accounts WHERE id=$1', [userId])).rows[0];
    const audience = await db.query('SELECT college_id FROM campus.event_audiences WHERE event_id=$1', [eventId]);
    const now = (await db.query('SELECT clock_timestamp() AS now')).rows[0].now;
    const actor = account && { id: account.id, emailVerified: account.email_verified,
      verificationStatus: account.verification_status, collegeId: account.college_id,
      year: account.year, branch: account.branch, degreeLevel: account.degree_level };
    const event = { status: row.status, collegeId: row.college_id, visibility: row.visibility,
      eligibility: row.eligibility, registrationDeadline: new Date(row.registration_deadline).toISOString() };
    const failure = registrationFailure(actor, event, audience.rows.map(a => a.college_id), new Date(now).getTime());
    if (failure) throw new RegistrationError(failure, 403);
    const existing = (await db.query('SELECT * FROM campus.registrations WHERE event_id=$1 AND user_id=$2', [eventId,userId])).rows[0];
    if (existing) {
      if (existing.status === 'cancelled') throw new RegistrationError('registration_cancelled', 409);
      await db.query('COMMIT');
      return existing; // Repeated mobile/web requests have one durable outcome.
    }
    const count = (await db.query("SELECT count(*)::integer AS taken FROM campus.registrations WHERE event_id=$1 AND status IN ('registered','checked_in')", [eventId])).rows[0].taken;
    const status = count >= row.capacity ? 'waitlisted' : 'registered';
    const registration = (await db.query('INSERT INTO campus.registrations(id,event_id,user_id,status) VALUES($1,$2,$3,$4) RETURNING *', [randomUUID(),eventId,userId,status])).rows[0];
    await db.query('INSERT INTO campus.outbox(id,user_id,kind,payload) VALUES($1,$2,$3,$4::jsonb)',
      [randomUUID(),userId,'registration.created',JSON.stringify({registrationId:registration.id,eventId,status})]);
    await db.query('COMMIT');
    return registration;
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  } finally { db.release(); }
}
module.exports = { registerCampusEvent, RegistrationError };
