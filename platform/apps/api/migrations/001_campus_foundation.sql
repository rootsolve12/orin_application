-- Additive foundation; legacy controllers are not switched to this schema yet.
BEGIN;
CREATE SCHEMA campus;
CREATE TABLE campus.colleges (
 id uuid PRIMARY KEY, name text NOT NULL, city text NOT NULL,
 country_code char(2) NOT NULL DEFAULT 'IN', timezone text NOT NULL DEFAULT 'Asia/Kolkata',
 status text NOT NULL CHECK (status IN ('pending','active','suspended'))
);
CREATE TABLE campus.accounts (
 id uuid PRIMARY KEY, email text NOT NULL UNIQUE CHECK (email = lower(email)),
 password_hash text NOT NULL, email_verified boolean NOT NULL DEFAULT false,
 full_name text NOT NULL, college_id uuid REFERENCES campus.colleges,
 verification_status text NOT NULL DEFAULT 'none' CHECK (verification_status IN ('none','pending','verified','rejected')),
 year integer, branch text, degree_level text, created_at timestamptz NOT NULL DEFAULT now(),
 CHECK (verification_status <> 'verified' OR college_id IS NOT NULL)
);
CREATE TABLE campus.role_grants (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES campus.accounts,
 role text NOT NULL CHECK (role IN ('organizer','college_admin','platform_admin')),
 college_id uuid REFERENCES campus.colleges, status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
 granted_by uuid NOT NULL REFERENCES campus.accounts, granted_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((role = 'platform_admin' AND college_id IS NULL) OR (role <> 'platform_admin' AND college_id IS NOT NULL))
);
CREATE UNIQUE INDEX active_grant ON campus.role_grants(user_id, role, college_id) NULLS NOT DISTINCT WHERE status='active';
CREATE TABLE campus.events (
 id uuid PRIMARY KEY, college_id uuid NOT NULL REFERENCES campus.colleges,
 organizer_id uuid NOT NULL REFERENCES campus.accounts, title text NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
 description text NOT NULL DEFAULT '', genre text NOT NULL, venue text NOT NULL,
 visibility text NOT NULL CHECK (visibility IN ('college_only','partner','public')),
 eligibility jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(eligibility) = 'object'),
 status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','ongoing','completed','cancelled')),
 capacity integer NOT NULL CHECK (capacity > 0),
 registration_deadline timestamptz NOT NULL, starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
 version integer NOT NULL DEFAULT 1, updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK (registration_deadline <= starts_at AND starts_at < ends_at)
);
CREATE INDEX event_feed ON campus.events(college_id, status, starts_at);
CREATE TABLE campus.event_audiences (
 event_id uuid NOT NULL REFERENCES campus.events, college_id uuid NOT NULL REFERENCES campus.colleges,
 PRIMARY KEY(event_id,college_id)
);
CREATE TABLE campus.registrations (
 id uuid PRIMARY KEY, event_id uuid NOT NULL REFERENCES campus.events, user_id uuid NOT NULL REFERENCES campus.accounts,
 status text NOT NULL CHECK (status IN ('registered','waitlisted','cancelled','checked_in')),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(event_id,user_id)
);
CREATE INDEX registration_capacity ON campus.registrations(event_id,status);
CREATE TABLE campus.outbox (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES campus.accounts,
 kind text NOT NULL, payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 delivered_at timestamptz, attempts integer NOT NULL DEFAULT 0
);
-- Only the private API gets a DB login. No client/database credentials in web/mobile bundles.
REVOKE ALL ON SCHEMA campus FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA campus FROM PUBLIC;
COMMIT;
