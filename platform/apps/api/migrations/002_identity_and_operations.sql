BEGIN;
CREATE TABLE campus.sessions (
 token_hash text PRIMARY KEY,user_id uuid NOT NULL REFERENCES campus.accounts ON DELETE CASCADE,
 expires_at timestamptz NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user ON campus.sessions(user_id);
CREATE TABLE campus.email_challenges (
 token_hash text PRIMARY KEY,user_id uuid NOT NULL REFERENCES campus.accounts ON DELETE CASCADE,
 purpose text NOT NULL CHECK(purpose IN ('verify','reset')),
 expires_at timestamptz NOT NULL
);
CREATE TABLE campus.reviews (
 id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES campus.accounts,college_id uuid NOT NULL REFERENCES campus.colleges,
 kind text NOT NULL CHECK(kind IN ('college','organizer')),evidence text NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 reviewed_by uuid REFERENCES campus.accounts,reason text,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX one_pending_review ON campus.reviews(user_id,kind) WHERE status='pending';
ALTER TABLE campus.registrations ADD COLUMN qr_token text UNIQUE;
CREATE TABLE campus.updates (
 id uuid PRIMARY KEY,event_id uuid NOT NULL REFERENCES campus.events,author_id uuid NOT NULL REFERENCES campus.accounts,
 body text NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE campus.notifications (
 id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES campus.accounts,kind text NOT NULL,
 payload jsonb NOT NULL,read_at timestamptz,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user ON campus.notifications(user_id,created_at);
CREATE TABLE campus.certificates (
 code text PRIMARY KEY,registration_id uuid NOT NULL UNIQUE REFERENCES campus.registrations,
 award text NOT NULL,issued_by uuid NOT NULL REFERENCES campus.accounts,
 issued_at timestamptz NOT NULL DEFAULT now(),revoked_at timestamptz
);
CREATE TABLE campus.audit_log (
 id uuid PRIMARY KEY,actor_id uuid NOT NULL REFERENCES campus.accounts,action text NOT NULL,
 resource_id uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;
