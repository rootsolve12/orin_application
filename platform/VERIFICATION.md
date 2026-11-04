# Verification record

Verified during development:

- TypeScript check across API, contracts, web and React Native.
- Embedded PostgreSQL integration journey over real HTTP and real SQL.
- Vite production website build.
- PostgreSQL 17 concurrency test in GitHub Actions: 40 simultaneous requests, 20 unique registrations, exactly three confirmed seats and 17 waitlisted. Run: https://github.com/rootsolve12/orin_application/actions/runs/41895615001 .
- Deterministic regression for password reset committing between credential verification and session creation.
- Android and iOS native JavaScript/Hermes bundle exports.

Not verified:

- APK/AAB/IPA compilation, signing, device camera and secure-store behavior.
- Multiple API-process contention and database crash recovery. The verified networked PostgreSQL test uses one API process with a 15-connection pool.
- Production SMTP delivery (worker provided; local Mailpit setup documented).
- Browser visual layout: Chromium could not start because this host disallows the socket it requires.

The existing 11 backend foundation unit tests are separate from the new integration journey and remain available under `../backend/test`.
