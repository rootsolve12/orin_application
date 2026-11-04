const { test } = require('node:test');
const assert = require('node:assert/strict');
const { registerCampusEvent } = require('../domain/registerCampusEvent');
function fixture({ full = false, existing = false, failOutbox = false } = {}) {
  const calls = [];
  const db = { release() { calls.push('RELEASE'); }, async query(sql, args) {
    calls.push(sql);
    if (sql.includes('FROM campus.events')) return { rows: [{ status:'published', college_id:'a', visibility:'college_only', eligibility:{}, registration_deadline:'2030-01-01', capacity:1 }] };
    if (sql.includes('FROM campus.accounts')) return { rows: [{id:'u',email_verified:true,college_id:'a',verification_status:'verified'}] };
    if (sql.includes('event_audiences')) return { rows: [] };
    if (sql.includes('clock_timestamp')) return {rows:[{now:'2026-01-01'}]};
    if (sql.includes('SELECT * FROM campus.registrations')) return {rows:existing ? [{id:'r',status:'registered'}]:[]};
    if (sql.includes('count(*)')) return {rows:[{taken:full ? 1:0}]};
    if (sql.includes('INSERT INTO campus.registrations')) return {rows:[{id:args[0],status:args[3]}]};
    if (failOutbox && sql.includes('INSERT INTO campus.outbox')) throw new Error('outbox unavailable');
    return {rows:[]};
  }};
  return {pool:{connect:async()=>db},calls};
}
test('registration locks event before capacity and commits outbox with seat', async()=>{
  const f=fixture(); const r=await registerCampusEvent(f.pool,'u','e');
  assert.equal(r.status,'registered');
  assert.match(f.calls[1],/FOR UPDATE/);
  assert.ok(f.calls.findIndex(s=>s.includes('outbox')) < f.calls.indexOf('COMMIT'));
  assert.equal(f.calls.at(-1),'RELEASE');
});
test('full event queues participant', async()=>{
  const f=fixture({full:true}); assert.equal((await registerCampusEvent(f.pool,'u','e')).status,'waitlisted');
});
test('retry returns existing record without another notification', async()=>{
  const f=fixture({existing:true}); assert.equal((await registerCampusEvent(f.pool,'u','e')).id,'r');
  assert.equal(f.calls.some(s=>s.startsWith('INSERT')),false);
});
test('notification insertion failure rolls back and releases connection', async()=>{
  const f=fixture({failOutbox:true}); await assert.rejects(registerCampusEvent(f.pool,'u','e'),/outbox unavailable/);
  assert.equal(f.calls.includes('COMMIT'),false); assert.deepEqual(f.calls.slice(-2),['ROLLBACK','RELEASE']);
});
