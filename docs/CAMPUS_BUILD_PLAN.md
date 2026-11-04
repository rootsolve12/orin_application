# Orin: local campus event platform

## Product decision
Launch with in-person events at one college and a small group of partner colleges in one region. “Offline events” means physical attendance; it does not mean the whole application operates without internet. Success is a trusted organizer completing an event from publication through attendance and verified results without separate spreadsheets.

## Current repository findings
React/Vite web client, Capacitor Android project, Firebase-backed AuthContext, Express API. The inspected authentication and event controllers use simulated credentials and in-memory collections. Organizer metrics include fixed numbers. These are prototype behaviors, not a durable production service. Keep the UI while migrating feature by feature; do not delete Firebase before existing identities and data have an export/mapping plan.

## Pilot features and acceptance gates
| Area | Pilot behavior | Acceptance gate |
|---|---|---|
| Identity | Personal email account, separate college verification, password reset, revocable sessions | College affiliation cannot be self-assigned; staff approval required for organizer access |
| Discovery | Own college, invited partner colleges, public events; genre/date/cost filters; saved events | Listing, detail, search, notifications and registration enforce identical audience rules |
| Organization | Approved host portal; drafts, preview, publish, schedules, venue, themes, eligibility, capacity, updates | Host cannot modify another host's event; college admin can moderate within own college |
| Participation | Solo registration, cancellation, FIFO waitlist, dashboard and event reminders | Concurrent last-seat requests never exceed capacity; duplicate requests create one registration |
| Teams | Invitations, acceptance, team size, leader transfer, roster lock | Reserve seats for accepted members atomically; define capacity as people, not teams |
| Attendance | Random QR pass, event-scoped scanner permissions, manual correction with audit reason | Duplicate scans cannot duplicate attendance; a screenshot is not identity proof |
| Recognition | Results draft/review/publication, attendance-based certificates, public verification, revocation | Registration alone never issues a participation certificate; corrected results version the record |
| Administration | College/domain onboarding, ID and organizer approval queues, abuse reports, audit log | Tenant isolation tests for every administrative endpoint |
| Paid events | Provider sandbox checkout, seat holds with expiry, webhook verification, receipts and refunds | Duplicate/out-of-order callbacks do not duplicate payment or seats; browser success is never proof of payment |
| Operations | Backups, tested restore, error tracking, delivery retry, exports, support | Restore rehearsal and real-device pilot before public launch |

Recruiter search and remote coding assessments are later modules. No arbitrary code execution in the event API. Recruiter visibility must require explicit student consent and field-limited access.

## Backend we own
Retain Express and introduce a versioned API with PostgreSQL as the source of truth. Use a modular monolith: identity, colleges, permissions, events, registration, attendance, results, payments, notifications. Keep business rules in services, storage access in repositories, and route handlers thin. Use standard password hashing and session libraries, not custom cryptography. Role grants stack and are loaded server-side so revocation does not wait for an old JWT to expire.

Use private S3-compatible object storage for documents/certificates and short-lived authorized downloads. A database outbox records notification work in the same transaction as registration; a worker retries delivery with unique deduplication keys. Add Redis only when shared rate limits, caching or worker throughput justify it. Self-hosting still requires email delivery and mobile push transports; avoiding Firebase as the database does not require building an email network or replacing OS push delivery.

Database migration 001 requires PostgreSQL 15+ for NULLS NOT DISTINCT. Run with a migration owner, then grant narrowly scoped permissions to a separate API database role. Clients never connect directly to PostgreSQL. Authorization is enforced in the API; the new schema does not yet implement RLS policies.

## Web, Android and iOS
Keep responsive React + Capacitor for the pilot, sharing one API and account. Capacitor renders the app in a native WebView and supports native plugins; it is not a native-widget implementation. Add an iOS target and verify it on macOS/Xcode. Reconsider React Native only after profiling demonstrates a concrete need.

Adapt layouts by viewport and capabilities: compact lists and bottom navigation on phones; tables and bulk operations on desktop; reduced images/animation for constrained devices. Handle camera permissions, safe areas, back navigation, accessibility and large text. Cache only necessary data, partition it by account, and clear it on logout. Sensitive audience changes must invalidate cached event details.

“Sync” is server consistency plus recovery: commit registration before confirming it, refetch on resume, use version numbers/ETags, persist a reconnect cursor, and treat push/SSE messages as hints to fetch authorized state. Show pending/error states clearly. Never silently replay payments. Offline QR scanning needs an explicit later reconciliation design because two disconnected scanners cannot guarantee global single use.

## Registration service delivered in this change
- campusPolicy.js: server-side visibility, role scope and registration eligibility.
- 001_campus_foundation.sql: independent accounts, colleges, grants, events, audiences, registrations and outbox.
- registerCampusEvent.js: parameterized database queries, per-event row lock, eligibility/deadline checks, repeat-request handling, capacity decision and transactional outbox.
- Tests run with `node --test backend/test/*.test.js` from repository root.

The service expects a node-postgres-compatible pool and an authenticated server-derived user ID. It is intentionally not mounted onto the legacy API: legacy user IDs are not UUIDs and the existing frontend still uses Firebase. The foundation currently handles free solo registrations only. All capacity-changing writers must acquire the same event lock. It has not been run against PostgreSQL in this workspace; database integration/concurrency validation is outstanding.

## Migration and build sequence
1. Provision development PostgreSQL; apply migration; add real authentication, verification and session revocation. Bootstrap a platform admin through a private operator command.
2. Map legacy Firebase UID to new UUID, export data, reconcile counts and test rollback. Keep identity mapping private. Inventory every frontend Firebase call before replacing it.
3. Mount `/api/v1` student and host routes using database-loaded permissions; integrate feed/detail/registration first. Keep legacy and new registrations isolated until cutover.
4. Add approvals, updates, cancellation/promotion, team lifecycle and QR attendance; results/certificates next. Publish a versioned OpenAPI contract shared across web/mobile.
5. Add payment sandbox and asynchronous notification delivery. Test webhook signatures, timeout/seat-release races and refunds against chosen provider documentation before live payments.
6. Pilot with one college, review failures with organizers, then onboard partner colleges. Add regions through college metadata, UTC storage and local timezone presentation.

## Recommendations
Start with user-selected genres plus eligibility, distance preference, upcoming dates and saved interests. Filter access and eligibility BEFORE ranking. Explain recommendations ("matches robotics; registration closes Friday"). Respect opt-out, quiet hours, rate caps and deduplication for alerts. Later collect consented impression/save/register/attendance outcomes and evaluate a trained model against the rules baseline. Never train only on clicks or allow a model to bypass campus visibility.

## Release blockers and meaningful validation
Unit policy tests are necessary but not sufficient. PostgreSQL integration tests must verify: simultaneous registrations against capacity one, retries across two API processes, rollback on outbox failure, restart persistence, scoped role revocation, cancelled-event rejection, waitlist fairness and deadlock handling. Mobile checks must cover interrupted network, expired sessions, slow devices, QR camera access and account switching. No production-readiness claim until these pass.

Technical references: https://www.postgresql.org/docs/current/explicit-locking.html and https://capacitorjs.com/docs . Payment provider selection remains open; no working gateway integration is claimed.
