# Verification record

Verified during development:

- TypeScript check across API, contracts, web and React Native.
- Embedded PostgreSQL integration journey over real HTTP and real SQL.
- Vite production website build.
- Android and iOS native JavaScript/Hermes bundle exports.

Not verified:

- APK/AAB/IPA compilation, signing, device camera and secure-store behavior.
- Networked PostgreSQL concurrency: test and CI PostgreSQL service added; local run skipped without TEST_DATABASE_URL. Crash recovery remains untested.
- Production SMTP delivery (worker provided; local Mailpit setup documented).
- Browser visual layout: Chromium could not start because this host disallows the socket it requires.

The existing 11 backend foundation unit tests are separate from the new integration journey and remain available under `../backend/test`.
