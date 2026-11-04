# Orin platform

A self-hosted campus event application with a dedicated React/TypeScript website, a separate React Native/TypeScript mobile application, and a Node/Express/PostgreSQL API. Mobile renders native components. It does not load the website in a WebView. Expo provides open-source native development tooling and modules; EAS cloud builds and hosted backends are not required.

This directory is the new implementation. The older `../frontend` and `../backend` applications remain intact for migration. They are **not** connected to this database. Do not run their simulated authentication for real accounts.

## Run locally

Requires Node 22.13+ (Node 24 recommended), npm and Docker Compose or an existing PostgreSQL 15+ server.

```sh
cd platform
npm ci
cp .env.example .env
```

Edit `.env`: set a long local database password and the same password in `DATABASE_URL`. Start the development database and local email inbox:

```sh
docker compose up -d
npm run migrate -w @orin/api
```

Set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` of at least 16 characters in `.env`, then bootstrap the first platform administrator:

```sh
npm run bootstrap -w @orin/api
```

The bootstrap command refuses to create another platform administrator. Remove `ADMIN_PASSWORD` from `.env` afterwards. It is not required at runtime.

Run these in separate terminals:

```sh
npm run dev:api
npm run worker -w @orin/api
npm run dev:web
```

Website: `http://localhost:5174`. Local email inbox: `http://localhost:8025`. The mail worker sends verification/reset tokens there. The account screen accepts these tokens. Mailpit is a local testing inbox, not production email delivery.

For the first college: sign in as the platform administrator, add the college in Account, have a second person sign up and verify their email, obtain their account reference from Account, then grant them college-admin access. College admins review college affiliations and organizer requests. A reviewer cannot approve their own request. Platform admins can review any college; organizers cannot approve requests.

The seed/bootstrap process creates no default password and no demo accounts. `tests/browser-fixture.ts` is a separate loopback-only QA fixture with synthetic records; never use it as the production server.

## Native mobile development

```sh
npm run dev:mobile
```

Android emulator default API address is `http://10.0.2.2:4100`; iOS simulator defaults to `http://127.0.0.1:4100`. For a physical device, configure `EXPO_PUBLIC_API_URL` in `apps/mobile/.env` to an API address reachable by that device. Use HTTPS for a deployed environment. Device sessions are stored with `expo-secure-store`; access/role checks always happen on the server. The app refetches on resume and offers explicit refresh. Background push and automatic reconnect streaming are not implemented.

For local native builds, install Android Studio/JDK/SDK for Android or Xcode on macOS for iOS, then run:

```sh
npm run android -w @orin/mobile
npm run ios -w @orin/mobile
```

These commands generate native projects and build locally. Store distribution additionally needs signing, developer accounts, store metadata and review. No APK, AAB or IPA is included in this change.

## Implemented vs outstanding

| Area          | Working implementation                                                                                    | Outstanding before full launch                                                       |
| ------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Accounts      | Password hashing, email verification, reset, DB sessions, logout/revoke                                   | Institutional SSO, MFA, distributed abuse limits                                     |
| College trust | Independent manual affiliation review, scoped approval queues and organizer grants                        | College-email domain OTP, secure ID uploads, richer review status UI                 |
| Events        | Draft/publish/lifecycle, scoped discovery, search, eligibility, API editing with optimistic version check | Rich edit screens, attachments, calendar export, saved events, date/cost UI filters  |
| Registration  | Free solo registration, idempotent retries, capacity checks, FIFO waitlist promotion                      | Team invitations/registration, reliable reminders, paid events                       |
| Attendance    | QR passes on web/native, native camera scan, manual-token fallback, idempotent check-in                   | Physical-device camera QA, delegated volunteer access, offline reconciliation        |
| Results       | Attendance-based recognition, named awards, public verification, revocation                               | Downloadable PDF certificates, correction/reissue flow, polished result forms        |
| Updates       | Host announcements, event status and in-app notifications                                                 | Push delivery, background jobs/reminders, cross-device streaming                     |
| Admin         | College creation/grants API, web onboarding forms, scoped queues                                          | Native admin-onboarding parity, reports/moderation, export tools, role management UI |
| Data          | PostgreSQL schema and tracked transactional migrations                                                    | Legacy Firebase import/cutover, object storage, backup/restore rehearsal             |
| Payments      | No payments accepted                                                                                      | Choose provider, sandbox checkout, signed webhooks, seat holds, refunds              |

The core student journey and host operations are present on both clients; this is not yet full feature parity or a finished global platform. No recommendation model or remote assessment engine is included.

## Verification

```sh
npm run typecheck
npm test
npm run build:web
cd apps/mobile
npx expo export --platform android --output-dir /tmp/orin-android-export --max-workers 1
npx expo export --platform ios --output-dir /tmp/orin-ios-export --max-workers 1
```

The integration test uses PGlite, an embedded PostgreSQL engine, to execute the actual SQL schema, constraints, API endpoints and rollback paths. It tests verification replay, reviews, private-event isolation, registration retries, last-seat waitlisting, cancellation promotion, announcements, check-in replay, award eligibility, certificate verification/revocation, password reset, partner access, optimistic edits, role revocation and logout. Its connection adapter serializes transactions. **It does not prove multi-process lock contention on a networked PostgreSQL server.** A separate concurrency test runs when `TEST_DATABASE_URL` names a dedicated database ending in `_test`. The platform CI workflow provisions PostgreSQL 17 and sends 40 parallel registration requests into a three-seat event. This networked test is skipped locally when no test database is configured; CI results must be checked before a public pilot.

TypeScript checks and native JavaScript bundle exports do not replace Android/iOS compilation and real-device testing. Browser visual QA in the build workspace was blocked by the host's socket restriction; the production web bundle was built successfully, but no visual pass is claimed.

## Deployment boundaries

Use a private database network, a dedicated non-owner API role, HTTPS reverse proxy, authenticated TLS SMTP, explicit web origin, process supervision and tested encrypted backups. `compose.yaml` is development infrastructure only. The API default rate limiter is process-local and must be replaced by a shared store before multiple replicas. Event feed filtering currently occurs in the API after reading events; move visibility/search/pagination into indexed SQL before large deployments. Notifications are delivered by polling/refetch; avoid calling this instant cross-device sync.

Apply migrations with a database owner. Grant the runtime role USAGE on `campus` plus only the necessary table privileges; never ship database credentials to either client. Student identity fields, college authority and role grants are not accepted from editable profile input. Paid events must remain disabled until the verified payment lifecycle exists. Email outbox payloads contain short-lived verification/reset tokens until delivery, then are redacted; restrict database/backups accordingly. QR passes are bearer proofs of registration, not proof of the holder's identity.

Owning this application does not remove dependencies: PostgreSQL and third-party open-source packages have their own licenses. Production email, OS push, payment processing and app-store distribution have external operational requirements. No Firebase, Supabase, Capacitor or WebView runtime is used by this new application.
