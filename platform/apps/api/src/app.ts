import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { type Database, type Queryable, transaction } from "./db.ts";
import { digest, token, hashPassword, verifyPassword } from "./security.ts";
import type {
  Actor,
  CampusEvent,
} from "../../../packages/contracts/src/index.ts";
class Failure extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const uuid = z.uuid();
const credentials = z.object({
  email: z
    .email()
    .max(254)
    .transform((s) => s.toLowerCase()),
  password: z.string().min(12).max(128),
});
const eventInput = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().max(10000).default(""),
    genre: z.string().min(1).max(80),
    venue: z.string().min(1).max(300),
    visibility: z.enum(["public", "partner", "college_only"]),
    capacity: z.number().int().positive().max(100000),
    registration_deadline: z.iso.datetime(),
    starts_at: z.iso.datetime(),
    ends_at: z.iso.datetime(),
    eligibility: z
      .object({
        years: z.array(z.number().int().min(1).max(10)).optional(),
        branches: z.array(z.string().max(80)).optional(),
        degreeLevels: z.array(z.string().max(80)).optional(),
      })
      .default({}),
    allowed_colleges: z.array(uuid).max(100).default([]),
  })
  .refine(
    (e) => e.registration_deadline <= e.starts_at && e.starts_at < e.ends_at,
    "Dates must be in registration/start/end order",
  );
const profileColumns =
  "id,full_name,email,email_verified,college_id,verification_status,year,branch,degree_level";
async function actorFor(db: Queryable, id: string): Promise<Actor> {
  const a = (
    await db.query(
      `SELECT ${profileColumns} FROM campus.accounts WHERE id=$1`,
      [id],
    )
  ).rows[0];
  if (!a) throw new Failure(401, "Session unavailable");
  a.roles = (
    await db.query(
      "SELECT role,college_id FROM campus.role_grants WHERE user_id=$1 AND status='active'",
      [id],
    )
  ).rows;
  return a;
}
function role(a: Actor, name: string, college?: string) {
  return a.roles.some(
    (r) =>
      r.role === "platform_admin" ||
      (r.role === name && r.college_id === college),
  );
}
function manages(a: Actor, e: CampusEvent) {
  return (
    role(a, "college_admin", e.college_id) ||
    (e.organizer_id === a.id && role(a, "organizer", e.college_id))
  );
}
async function visible(db: Queryable, a: Actor | null, e: CampusEvent) {
  if (a && manages(a, e)) return true;
  if (e.status === "draft") return false;
  if (e.visibility === "public") return true;
  if (!a || a.verification_status !== "verified" || !a.college_id) return false;
  if (a.college_id === e.college_id) return true;
  return (
    e.visibility === "partner" &&
    (
      await db.query(
        "SELECT 1 FROM campus.event_audiences WHERE event_id=$1 AND college_id=$2",
        [e.id, a.college_id],
      )
    ).rows.length > 0
  );
}
async function eventFor(
  db: Queryable,
  id: string,
  lock = false,
): Promise<CampusEvent> {
  uuid.parse(id);
  const e = (
    await db.query(
      `SELECT * FROM campus.events WHERE id=$1${lock ? " FOR UPDATE" : ""}`,
      [id],
    )
  ).rows[0];
  if (!e) throw new Failure(404, "Event unavailable");
  return e;
}
async function audit(db: Queryable, a: Actor, action: string, id: string) {
  await db.query(
    "INSERT INTO campus.audit_log(id,actor_id,action,resource_id) VALUES($1,$2,$3,$4)",
    [randomUUID(), a.id, action, id],
  );
}
async function notify(
  db: Queryable,
  user: string,
  kind: string,
  payload: unknown,
) {
  await db.query(
    "INSERT INTO campus.notifications(id,user_id,kind,payload) VALUES($1,$2,$3,$4::jsonb)",
    [randomUUID(), user, kind, JSON.stringify(payload)],
  );
}
async function emailChallenge(
  db: Queryable,
  id: string,
  email: string,
  purpose: "verify" | "reset",
) {
  const secret = token();
  await db.query(
    "DELETE FROM campus.email_challenges WHERE user_id=$1 AND purpose=$2",
    [id, purpose],
  );
  await db.query(
    "INSERT INTO campus.email_challenges(token_hash,user_id,purpose,expires_at) VALUES($1,$2,$3,now()+interval '30 minutes')",
    [digest(secret), id, purpose],
  );
  await db.query(
    "INSERT INTO campus.outbox(id,user_id,kind,payload) VALUES($1,$2,$3,$4::jsonb)",
    [
      randomUUID(),
      id,
      "email.challenge",
      JSON.stringify({ email, purpose, token: secret }),
    ],
  );
}
export function createApp(
  db: Database,
  options: { rateLimits?: boolean; webOrigin?: string } = {},
) {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  const webOrigin = options.webOrigin || "http://localhost:5174";
  app.use((req, res, next) => {
    if (req.headers.origin === webOrigin) {
      res.set("Access-Control-Allow-Origin", webOrigin);
      res.set("Vary", "Origin");
      res.set("Access-Control-Allow-Headers", "Authorization,Content-Type");
      res.set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    }
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    res.set("Cache-Control", "no-store");
    next();
  });
  app.use(express.json({ limit: "100kb" }));
  if (options.rateLimits !== false) {
    app.use("/v1", rateLimit({ windowMs: 60000, limit: 150 }));
    app.use("/v1/auth", rateLimit({ windowMs: 15 * 60000, limit: 20 }));
  }
  // Express 5 forwards rejected async handlers to the error middleware.
  app.use(async (req: Request & { actor?: Actor | null }, _res, next) => {
    req.actor = null;
    const header = req.headers.authorization;
    if (header) {
      const match = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(header);
      if (!match) throw new Failure(401, "Invalid session");
      const s = (
        await db.query(
          "SELECT user_id FROM campus.sessions WHERE token_hash=$1 AND expires_at>now()",
          [digest(match[1])],
        )
      ).rows[0];
      if (!s) throw new Failure(401, "Session expired");
      req.actor = await actorFor(db, s.user_id);
    }
    next();
  });
  const actor = (req: Request): Actor => {
    const a = (req as Request & { actor?: Actor }).actor;
    if (!a) throw new Failure(401, "Sign in required");
    return a;
  };
  const maybe = (req: Request) =>
    (req as Request & { actor?: Actor }).actor || null;
  app.get("/health", async (_req, res) => {
    await db.query("SELECT 1");
    res.json({ status: "ok" });
  });
  app.post("/v1/auth/signup", async (req, res) => {
    const data = credentials
      .extend({ full_name: z.string().trim().min(2).max(120) })
      .parse(req.body);
    const password = await hashPassword(data.password);
    await transaction(db, async (c) => {
      const id = randomUUID();
      const inserted = await c.query(
        "INSERT INTO campus.accounts(id,email,password_hash,full_name) VALUES($1,$2,$3,$4) ON CONFLICT(email) DO NOTHING RETURNING id",
        [id, data.email, password, data.full_name],
      );
      if (inserted.rows.length)
        await emailChallenge(c, id, data.email, "verify");
    });
    res
      .status(202)
      .json({
        message:
          "If this address can be registered, a verification email will arrive.",
      });
  });
  app.post("/v1/auth/login", async (req, res) => {
    const data = credentials.parse(req.body);
    const a = (
      await db.query(
        "SELECT id,password_hash FROM campus.accounts WHERE email=$1",
        [data.email],
      )
    ).rows[0];
    // Perform the same KDF for nonexistent users to reduce account enumeration timing.
    const dummy = "scrypt$00000000000000000000000000000000$" + "0".repeat(128);
    const valid = await verifyPassword(
      data.password,
      a?.password_hash || dummy,
    );
    if (!a || !valid) throw new Failure(401, "Invalid credentials");
    const secret = token();
    await db.query(
      "INSERT INTO campus.sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '7 days')",
      [digest(secret), a.id],
    );
    res.json({ token: secret, actor: await actorFor(db, a.id) });
  });
  app.post("/v1/auth/logout", async (req, res) => {
    actor(req);
    await db.query("DELETE FROM campus.sessions WHERE token_hash=$1", [
      digest(req.headers.authorization!.slice(7)),
    ]);
    res.sendStatus(204);
  });
  app.post("/v1/auth/logout-all", async (req, res) => {
    const a = actor(req);
    await db.query("DELETE FROM campus.sessions WHERE user_id=$1", [a.id]);
    res.sendStatus(204);
  });
  app.post("/v1/auth/request-reset", async (req, res) => {
    const { email } = z
      .object({ email: z.email().transform((s) => s.toLowerCase()) })
      .parse(req.body);
    await transaction(db, async (c) => {
      const a = (
        await c.query("SELECT id FROM campus.accounts WHERE email=$1", [email])
      ).rows[0];
      if (a) await emailChallenge(c, a.id, email, "reset");
    });
    res
      .status(202)
      .json({ message: "If this account exists, instructions will arrive." });
  });
  app.post("/v1/auth/resend-verification", async (req, res) => {
    const a = actor(req);
    await transaction(db, async (c) => {
      await c.query("SELECT id FROM campus.accounts WHERE id=$1 FOR UPDATE", [
        a.id,
      ]);
      if (!a.email_verified) await emailChallenge(c, a.id, a.email, "verify");
    });
    res.status(202).json({ message: "Verification requested" });
  });
  app.post("/v1/auth/verify-email", async (req, res) => {
    const data = z.object({ token: z.string().length(43) }).parse(req.body);
    await transaction(db, async (c) => {
      const t = (
        await c.query(
          "DELETE FROM campus.email_challenges WHERE token_hash=$1 AND purpose='verify' AND expires_at>now() RETURNING user_id",
          [digest(data.token)],
        )
      ).rows[0];
      if (!t) throw new Failure(400, "Link expired or already used");
      await c.query(
        "UPDATE campus.accounts SET email_verified=true WHERE id=$1",
        [t.user_id],
      );
    });
    res.json({ message: "Email verified" });
  });
  app.post("/v1/auth/reset-password", async (req, res) => {
    const data = z
      .object({
        token: z.string().length(43),
        password: z.string().min(12).max(128),
      })
      .parse(req.body);
    const hash = await hashPassword(data.password);
    await transaction(db, async (c) => {
      const t = (
        await c.query(
          "DELETE FROM campus.email_challenges WHERE token_hash=$1 AND purpose='reset' AND expires_at>now() RETURNING user_id",
          [digest(data.token)],
        )
      ).rows[0];
      if (!t) throw new Failure(400, "Link expired or already used");
      await c.query("UPDATE campus.accounts SET password_hash=$1 WHERE id=$2", [
        hash,
        t.user_id,
      ]);
      await c.query("DELETE FROM campus.sessions WHERE user_id=$1", [
        t.user_id,
      ]);
    });
    res.json({ message: "Password updated; sign in again" });
  });
  app.get("/v1/me", async (req, res) =>
    res.json(await actorFor(db, actor(req).id)),
  );
  app.patch("/v1/me", async (req, res) => {
    const a = actor(req);
    const data = z
      .object({
        full_name: z.string().trim().min(2).max(120),
        year: z.number().int().min(1).max(10).nullable(),
        branch: z.string().max(80).nullable(),
        degree_level: z.string().max(80).nullable(),
      })
      .strict()
      .parse(req.body);
    await db.query(
      "UPDATE campus.accounts SET full_name=$1,year=$2,branch=$3,degree_level=$4 WHERE id=$5",
      [data.full_name, data.year, data.branch, data.degree_level, a.id],
    );
    res.json(await actorFor(db, a.id));
  });
  app.get("/v1/colleges", async (_req, res) =>
    res.json(
      (
        await db.query(
          "SELECT id,name,city FROM campus.colleges WHERE status='active' ORDER BY name",
        )
      ).rows,
    ),
  );
  app.post("/v1/colleges", async (req, res) => {
    const a = actor(req);
    if (!role(a, "platform_admin"))
      throw new Failure(403, "Platform admin required");
    const d = z
      .object({
        name: z.string().min(2).max(200),
        city: z.string().min(2).max(100),
      })
      .parse(req.body);
    const id = randomUUID();
    await db.query(
      "INSERT INTO campus.colleges(id,name,city,status) VALUES($1,$2,$3,'active')",
      [id, d.name, d.city],
    );
    res.status(201).json({ id });
  });
  app.post("/v1/reviews", async (req, res) => {
    const a = actor(req);
    if (!a.email_verified) throw new Failure(403, "Verify your email first");
    const d = z
      .object({
        kind: z.enum(["college", "organizer"]),
        college_id: uuid,
        evidence: z.string().trim().min(10).max(2000),
      })
      .parse(req.body);
    if (
      d.kind === "organizer" &&
      (a.verification_status !== "verified" || a.college_id !== d.college_id)
    )
      throw new Failure(403, "Verified college affiliation required");
    if (d.kind === "college" && a.verification_status === "verified")
      throw new Failure(409, "Ask support to change an existing affiliation");
    const college = (
      await db.query(
        "SELECT id FROM campus.colleges WHERE id=$1 AND status='active'",
        [d.college_id],
      )
    ).rows[0];
    if (!college) throw new Failure(400, "College unavailable");
    await db.query(
      "INSERT INTO campus.reviews(id,user_id,college_id,kind,evidence) VALUES($1,$2,$3,$4,$5)",
      [randomUUID(), a.id, d.college_id, d.kind, d.evidence],
    );
    res.status(201).json({ message: "Request sent for review" });
  });
  app.get("/v1/reviews", async (req, res) => {
    const a = actor(req);
    const rows = (
      await db.query(
        "SELECT r.*,a.full_name,a.email FROM campus.reviews r JOIN campus.accounts a ON a.id=r.user_id WHERE r.status='pending' ORDER BY r.created_at",
      )
    ).rows;
    res.json(rows.filter((r) => role(a, "college_admin", r.college_id)));
  });
  app.post("/v1/reviews/:id/decision", async (req, res) => {
    const a = actor(req);
    const id = uuid.parse(req.params.id);
    const d = z
      .object({
        approve: z.boolean(),
        reason: z.string().max(1000).default(""),
      })
      .parse(req.body);
    await transaction(db, async (c) => {
      const r = (
        await c.query("SELECT * FROM campus.reviews WHERE id=$1 FOR UPDATE", [
          id,
        ])
      ).rows[0];
      if (!r || !role(a, "college_admin", r.college_id))
        throw new Failure(404, "Request unavailable");
      if (r.user_id === a.id)
        throw new Failure(
          403,
          "Another administrator must review your request",
        );
      if (r.status !== "pending")
        throw new Failure(409, "Request already reviewed");
      if (d.approve && r.kind === "college")
        await c.query(
          "UPDATE campus.accounts SET college_id=$1,verification_status='verified' WHERE id=$2",
          [r.college_id, r.user_id],
        );
      if (d.approve && r.kind === "organizer") {
        const target = await actorFor(c, r.user_id);
        if (
          target.verification_status !== "verified" ||
          target.college_id !== r.college_id
        )
          throw new Failure(409, "College affiliation changed");
        await c.query(
          "INSERT INTO campus.role_grants(id,user_id,role,college_id,granted_by) VALUES($1,$2,'organizer',$3,$4) ON CONFLICT DO NOTHING",
          [randomUUID(), r.user_id, r.college_id, a.id],
        );
      }
      await c.query(
        "UPDATE campus.reviews SET status=$1,reviewed_by=$2,reason=$3 WHERE id=$4",
        [d.approve ? "approved" : "rejected", a.id, d.reason, id],
      );
      await notify(c, r.user_id, "review.decided", {
        kind: r.kind,
        approved: d.approve,
        reason: d.reason,
      });
      await audit(c, a, "review.decided", id);
    });
    res.json({ message: "Review saved" });
  });
  app.post("/v1/admin/grants", async (req, res) => {
    const a = actor(req);
    if (!role(a, "platform_admin"))
      throw new Failure(403, "Platform admin required");
    const d = z
      .object({
        user_id: uuid,
        college_id: uuid,
        role: z.enum(["organizer", "college_admin"]),
      })
      .parse(req.body);
    const target = await actorFor(db, d.user_id);
    if (!target.email_verified)
      throw new Failure(400, "Target email must be verified");
    await transaction(db, async (c) => {
      await c.query(
        "INSERT INTO campus.role_grants(id,user_id,role,college_id,granted_by) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING",
        [randomUUID(), d.user_id, d.role, d.college_id, a.id],
      );
      await audit(c, a, "role.granted", d.user_id);
    });
    res.json({ message: "Role granted" });
  });
  app.get("/v1/events", async (req, res) => {
    const a = maybe(req);
    const q = z
      .object({
        search: z.string().max(100).optional(),
        genre: z.string().max(80).optional(),
        scope: z.enum(["all", "mine", "college", "partner"]).default("all"),
        page: z.coerce.number().int().min(1).max(1000).default(1),
      })
      .parse(req.query);
    const rows = (
      await db.query("SELECT * FROM campus.events ORDER BY starts_at,id")
    ).rows as CampusEvent[];
    const allowed = [];
    for (const e of rows) {
      if (!(await visible(db, a, e))) continue;
      if (q.scope === "mine" && (!a || !manages(a, e))) continue;
      if (
        q.scope === "college" &&
        (!a ||
          a.verification_status !== "verified" ||
          a.college_id !== e.college_id)
      )
        continue;
      if (q.scope === "partner" && e.visibility !== "partner") continue;
      if (
        q.search &&
        !`${e.title} ${e.description}`
          .toLowerCase()
          .includes(q.search.toLowerCase())
      )
        continue;
      if (q.genre && e.genre !== q.genre) continue;
      allowed.push(e);
    }
    res.json({
      items: allowed.slice((q.page - 1) * 30, q.page * 30),
      total: allowed.length,
      page: q.page,
    });
  });
  app.get("/v1/events/:id", async (req, res) => {
    const e = await eventFor(db, String(req.params.id));
    if (!(await visible(db, maybe(req), e)))
      throw new Failure(404, "Event unavailable");
    res.json(e);
  });
  app.post("/v1/events", async (req, res) => {
    const a = actor(req);
    if (
      !a.email_verified ||
      !a.college_id ||
      (!role(a, "organizer", a.college_id) &&
        !role(a, "college_admin", a.college_id))
    )
      throw new Failure(403, "Approved college organizer required");
    const d = eventInput.parse(req.body);
    const id = randomUUID();
    await transaction(db, async (c) => {
      await c.query(
        "INSERT INTO campus.events(id,college_id,organizer_id,title,description,genre,venue,visibility,capacity,registration_deadline,starts_at,ends_at,eligibility) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb)",
        [
          id,
          a.college_id,
          a.id,
          d.title,
          d.description,
          d.genre,
          d.venue,
          d.visibility,
          d.capacity,
          d.registration_deadline,
          d.starts_at,
          d.ends_at,
          JSON.stringify(d.eligibility),
        ],
      );
      for (const college of d.allowed_colleges)
        await c.query("INSERT INTO campus.event_audiences VALUES($1,$2)", [
          id,
          college,
        ]);
      await audit(c, a, "event.created", id);
    });
    res.status(201).json(await eventFor(db, id));
  });
  app.patch("/v1/events/:id", async (req, res) => {
    const a = actor(req);
    const d = eventInput
      .safeExtend({ version: z.number().int().positive() })
      .parse(req.body);
    await transaction(db, async (c) => {
      const e = await eventFor(c, String(req.params.id), true);
      if (!manages(a, e)) throw new Failure(403, "Event manager required");
      if (!["draft", "published"].includes(e.status))
        throw new Failure(409, "Event details are locked");
      if (e.version !== d.version)
        throw new Failure(409, "Event changed; refresh before editing");
      const used = Number(
        (
          await c.query(
            "SELECT count(*) AS n FROM campus.registrations WHERE event_id=$1 AND status IN ('registered','checked_in')",
            [e.id],
          )
        ).rows[0].n,
      );
      if (d.capacity < used)
        throw new Failure(
          409,
          "Capacity cannot be below confirmed registrations",
        );
      if (used > 0 && d.visibility !== e.visibility)
        throw new Failure(409, "Audience cannot change after registration");
      if (used > 0) {
        const current = (
          await c.query(
            "SELECT college_id FROM campus.event_audiences WHERE event_id=$1 ORDER BY college_id",
            [e.id],
          )
        ).rows.map((r) => r.college_id);
        if (
          JSON.stringify(current) !==
          JSON.stringify([...d.allowed_colleges].sort())
        )
          throw new Failure(
            409,
            "Invited colleges cannot change after registration",
          );
      }
      await c.query(
        "UPDATE campus.events SET title=$1,description=$2,genre=$3,venue=$4,visibility=$5,capacity=$6,registration_deadline=$7,starts_at=$8,ends_at=$9,eligibility=$10::jsonb,version=version+1,updated_at=now() WHERE id=$11",
        [
          d.title,
          d.description,
          d.genre,
          d.venue,
          d.visibility,
          d.capacity,
          d.registration_deadline,
          d.starts_at,
          d.ends_at,
          JSON.stringify(d.eligibility),
          e.id,
        ],
      );
      await c.query("DELETE FROM campus.event_audiences WHERE event_id=$1", [
        e.id,
      ]);
      for (const college of d.allowed_colleges)
        await c.query("INSERT INTO campus.event_audiences VALUES($1,$2)", [
          e.id,
          college,
        ]);
      const users = (
        await c.query(
          "SELECT user_id FROM campus.registrations WHERE event_id=$1 AND status<>'cancelled'",
          [e.id],
        )
      ).rows;
      for (const user of users)
        await notify(c, user.user_id, "event.details_changed", {
          eventId: e.id,
        });
      await audit(c, a, "event.edited", e.id);
    });
    res.json(await eventFor(db, String(req.params.id)));
  });
  app.delete("/v1/admin/grants/:id", async (req, res) => {
    const a = actor(req);
    const id = uuid.parse(req.params.id);
    await transaction(db, async (c) => {
      const grant = (
        await c.query(
          "SELECT * FROM campus.role_grants WHERE id=$1 FOR UPDATE",
          [id],
        )
      ).rows[0];
      if (
        !grant ||
        !(
          role(a, "platform_admin") ||
          (grant.role === "organizer" &&
            role(a, "college_admin", grant.college_id))
        )
      )
        throw new Failure(404, "Grant unavailable");
      if (grant.role === "platform_admin")
        throw new Failure(
          409,
          "Platform administrator changes require operator review",
        );
      await c.query(
        "UPDATE campus.role_grants SET status='revoked' WHERE id=$1",
        [id],
      );
      await audit(c, a, "role.revoked", grant.user_id);
    });
    res.sendStatus(204);
  });
  app.post("/v1/events/:id/status", async (req, res) => {
    const a = actor(req);
    const d = z
      .object({
        status: z.enum(["published", "ongoing", "completed", "cancelled"]),
        version: z.number().int().positive(),
      })
      .parse(req.body);
    await transaction(db, async (c) => {
      const e = await eventFor(c, String(req.params.id), true);
      if (!manages(a, e)) throw new Failure(403, "Event manager required");
      if (e.version !== d.version)
        throw new Failure(409, "Event changed; refresh before saving");
      const transitions: Record<string, string[]> = {
        draft: ["published", "cancelled"],
        published: ["ongoing", "cancelled"],
        ongoing: ["completed", "cancelled"],
        completed: [],
        cancelled: [],
      };
      if (!transitions[e.status].includes(d.status))
        throw new Failure(409, "Invalid event transition");
      await c.query(
        "UPDATE campus.events SET status=$1,version=version+1,updated_at=now() WHERE id=$2",
        [d.status, e.id],
      );
      const regs = (
        await c.query(
          "SELECT user_id FROM campus.registrations WHERE event_id=$1 AND status<>'cancelled'",
          [e.id],
        )
      ).rows;
      for (const r of regs)
        await notify(c, r.user_id, "event.status", {
          eventId: e.id,
          status: d.status,
        });
      await audit(c, a, "event." + d.status, e.id);
    });
    res.json({ message: "Event updated" });
  });
  app.post("/v1/events/:id/register", async (req, res) => {
    const a = actor(req);
    if (!a.email_verified) throw new Failure(403, "Verify your email first");
    const result = await transaction(db, async (c) => {
      const e = await eventFor(c, String(req.params.id), true);
      if (!(await visible(c, a, e)) || e.status !== "published")
        throw new Failure(403, "Registration unavailable");
      const now = (await c.query("SELECT clock_timestamp() AS now")).rows[0]
        .now;
      if (new Date(now) >= new Date(e.registration_deadline))
        throw new Failure(409, "Registration closed");
      for (const [key, value] of [
        ["years", a.year],
        ["branches", a.branch],
        ["degreeLevels", a.degree_level],
      ] as const) {
        const allowed = e.eligibility[key] as unknown[] | undefined;
        if (allowed && !allowed.includes(value))
          throw new Failure(403, "Eligibility requirements not met");
      }
      const existing = (
        await c.query(
          "SELECT * FROM campus.registrations WHERE event_id=$1 AND user_id=$2",
          [e.id, a.id],
        )
      ).rows[0];
      if (existing && existing.status !== "cancelled") return existing;
      const taken = Number(
        (
          await c.query(
            "SELECT count(*) AS n FROM campus.registrations WHERE event_id=$1 AND status IN ('registered','checked_in')",
            [e.id],
          )
        ).rows[0].n,
      );
      const status = taken >= e.capacity ? "waitlisted" : "registered";
      let r;
      if (existing)
        r = (
          await c.query(
            "UPDATE campus.registrations SET status=$1,created_at=now(),qr_token=$2 WHERE id=$3 RETURNING *",
            [status, token(), existing.id],
          )
        ).rows[0];
      else
        r = (
          await c.query(
            "INSERT INTO campus.registrations(id,event_id,user_id,status,qr_token) VALUES($1,$2,$3,$4,$5) RETURNING *",
            [randomUUID(), e.id, a.id, status, token()],
          )
        ).rows[0];
      await notify(c, a.id, "registration." + status, { eventId: e.id });
      return r;
    });
    res.status(201).json(result);
  });
  app.post("/v1/events/:id/cancel-registration", async (req, res) => {
    const a = actor(req);
    await transaction(db, async (c) => {
      const e = await eventFor(c, String(req.params.id), true);
      if (!["published", "draft"].includes(e.status))
        throw new Failure(409, "Cancellation closed");
      const r = (
        await c.query(
          "SELECT * FROM campus.registrations WHERE event_id=$1 AND user_id=$2",
          [e.id, a.id],
        )
      ).rows[0];
      if (!r || r.status === "cancelled") return;
      if (r.status === "checked_in")
        throw new Failure(409, "Attendance already recorded");
      await c.query(
        "UPDATE campus.registrations SET status='cancelled',qr_token=NULL WHERE id=$1",
        [r.id],
      );
      if (r.status === "registered") {
        const next = (
          await c.query(
            "SELECT id,user_id FROM campus.registrations WHERE event_id=$1 AND status='waitlisted' ORDER BY created_at,id LIMIT 1",
            [e.id],
          )
        ).rows[0];
        if (next) {
          await c.query(
            "UPDATE campus.registrations SET status='registered' WHERE id=$1",
            [next.id],
          );
          await notify(c, next.user_id, "waitlist.promoted", { eventId: e.id });
        }
      }
      await notify(c, a.id, "registration.cancelled", { eventId: e.id });
    });
    res.json({ message: "Registration cancelled" });
  });
  app.get("/v1/registrations", async (req, res) => {
    const a = actor(req);
    res.json(
      (
        await db.query(
          "SELECT r.*,e.title,e.starts_at,e.venue FROM campus.registrations r JOIN campus.events e ON e.id=r.event_id WHERE r.user_id=$1 ORDER BY r.created_at DESC",
          [a.id],
        )
      ).rows,
    );
  });
  app.get("/v1/events/:id/participants", async (req, res) => {
    const a = actor(req);
    const e = await eventFor(db, String(req.params.id));
    if (!manages(a, e)) throw new Failure(403, "Event manager required");
    res.json(
      (
        await db.query(
          "SELECT r.id,r.user_id,r.status,r.created_at,a.full_name,a.email FROM campus.registrations r JOIN campus.accounts a ON a.id=r.user_id WHERE r.event_id=$1 ORDER BY r.created_at",
          [e.id],
        )
      ).rows,
    );
  });
  app.post("/v1/events/:id/check-in", async (req, res) => {
    const a = actor(req);
    const d = z.object({ qr_token: z.string().length(43) }).parse(req.body);
    const r = await transaction(db, async (c) => {
      const e = await eventFor(c, String(req.params.id), true);
      if (!manages(a, e)) throw new Failure(403, "Event manager required");
      if (e.status !== "ongoing")
        throw new Failure(409, "Event must be ongoing");
      const r = (
        await c.query(
          "SELECT * FROM campus.registrations WHERE event_id=$1 AND qr_token=$2",
          [e.id, d.qr_token],
        )
      ).rows[0];
      if (!r || !["registered", "checked_in"].includes(r.status))
        throw new Failure(404, "Pass unavailable");
      await c.query(
        "UPDATE campus.registrations SET status='checked_in' WHERE id=$1",
        [r.id],
      );
      await audit(c, a, "attendance.checked_in", r.id);
      return { ...r, status: "checked_in" };
    });
    res.json(r);
  });
  app.get("/v1/events/:id/updates", async (req, res) => {
    const e = await eventFor(db, String(req.params.id));
    if (!(await visible(db, maybe(req), e)))
      throw new Failure(404, "Event unavailable");
    res.json(
      (
        await db.query(
          "SELECT * FROM campus.updates WHERE event_id=$1 ORDER BY created_at DESC",
          [e.id],
        )
      ).rows,
    );
  });
  app.post("/v1/events/:id/updates", async (req, res) => {
    const a = actor(req);
    const d = z
      .object({ body: z.string().trim().min(1).max(4000) })
      .parse(req.body);
    await transaction(db, async (c) => {
      const e = await eventFor(c, String(req.params.id), true);
      if (!manages(a, e)) throw new Failure(403, "Event manager required");
      if (["completed", "cancelled"].includes(e.status))
        throw new Failure(409, "Event closed");
      await c.query(
        "INSERT INTO campus.updates(id,event_id,author_id,body) VALUES($1,$2,$3,$4)",
        [randomUUID(), e.id, a.id, d.body],
      );
      const regs = (
        await c.query(
          "SELECT user_id FROM campus.registrations WHERE event_id=$1 AND status<>'cancelled'",
          [e.id],
        )
      ).rows;
      for (const r of regs)
        await notify(c, r.user_id, "event.update", {
          eventId: e.id,
          body: d.body,
        });
    });
    res.status(201).json({ message: "Update posted" });
  });
  app.post("/v1/events/:id/results", async (req, res) => {
    const a = actor(req);
    const d = z
      .object({
        awards: z
          .array(
            z.object({
              registration_id: uuid,
              award: z.string().trim().min(1).max(100),
            }),
          )
          .max(1000),
      })
      .parse(req.body);
    if (
      new Set(d.awards.map((x) => x.registration_id)).size !== d.awards.length
    )
      throw new Failure(400, "Duplicate award recipient");
    await transaction(db, async (c) => {
      const e = await eventFor(c, String(req.params.id), true);
      if (!manages(a, e)) throw new Failure(403, "Event manager required");
      if (e.status !== "completed")
        throw new Failure(409, "Complete event first");
      const regs = (
        await c.query(
          "SELECT * FROM campus.registrations WHERE event_id=$1 AND status='checked_in'",
          [e.id],
        )
      ).rows;
      for (const award of d.awards)
        if (!regs.some((r) => r.id === award.registration_id))
          throw new Failure(
            400,
            "Award recipient must have attended this event",
          );
      for (const r of regs) {
        const award =
          d.awards.find((x) => x.registration_id === r.id)?.award ||
          "Participation";
        const code = token();
        const added = await c.query(
          "INSERT INTO campus.certificates(code,registration_id,award,issued_by) VALUES($1,$2,$3,$4) ON CONFLICT(registration_id) DO NOTHING RETURNING code",
          [code, r.id, award, a.id],
        );
        if (added.rows.length)
          await notify(c, r.user_id, "certificate.issued", {
            code,
            eventId: e.id,
          });
      }
      await audit(c, a, "results.published", e.id);
    });
    res.json({ message: "Recognition issued to checked-in participants" });
  });
  app.get("/v1/certificates", async (req, res) => {
    const a = actor(req);
    res.json(
      (
        await db.query(
          "SELECT c.code,c.award,c.issued_at,c.revoked_at,e.title,a.full_name FROM campus.certificates c JOIN campus.registrations r ON r.id=c.registration_id JOIN campus.events e ON e.id=r.event_id JOIN campus.accounts a ON a.id=r.user_id WHERE r.user_id=$1",
          [a.id],
        )
      ).rows,
    );
  });
  app.get("/v1/certificates/:code", async (req, res) => {
    const code = z.string().length(43).parse(req.params.code);
    const cert = (
      await db.query(
        "SELECT c.code,c.award,c.issued_at,c.revoked_at,e.title,a.full_name FROM campus.certificates c JOIN campus.registrations r ON r.id=c.registration_id JOIN campus.events e ON e.id=r.event_id JOIN campus.accounts a ON a.id=r.user_id WHERE c.code=$1",
        [code],
      )
    ).rows[0];
    if (!cert) throw new Failure(404, "Certificate unavailable");
    res.json(cert);
  });
  app.post("/v1/certificates/:code/revoke", async (req, res) => {
    const a = actor(req);
    const code = z.string().length(43).parse(req.params.code);
    const row = (
      await db.query(
        "SELECT e.* FROM campus.certificates c JOIN campus.registrations r ON r.id=c.registration_id JOIN campus.events e ON e.id=r.event_id WHERE c.code=$1",
        [code],
      )
    ).rows[0];
    if (!row || !manages(a, row))
      throw new Failure(404, "Certificate unavailable");
    await transaction(db, async (c) => {
      await c.query(
        "UPDATE campus.certificates SET revoked_at=now() WHERE code=$1",
        [code],
      );
      await audit(c, a, "certificate.revoked", row.id);
    });
    res.json({ message: "Certificate revoked" });
  });
  app.get("/v1/notifications", async (req, res) =>
    res.json(
      (
        await db.query(
          "SELECT * FROM campus.notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100",
          [actor(req).id],
        )
      ).rows,
    ),
  );
  app.post("/v1/notifications/:id/read", async (req, res) => {
    await db.query(
      "UPDATE campus.notifications SET read_at=now() WHERE id=$1 AND user_id=$2",
      [uuid.parse(req.params.id), actor(req).id],
    );
    res.sendStatus(204);
  });
  app.use((_req, res) => {
    res.status(404).json({ error: "Endpoint unavailable" });
  });
  app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({
          error: "Invalid request",
          details: error.issues.map((i) => ({
            path: i.path,
            message: i.message,
          })),
        });
      return;
    }
    if (error.code === "23505") {
      res.status(409).json({ error: "A matching record already exists" });
      return;
    }
    if (error.code === "23503") {
      res.status(400).json({ error: "Referenced record unavailable" });
      return;
    }
    const status =
      error instanceof Failure
        ? error.status
        : 400 === error.status
          ? 400
          : 500;
    if (status === 500)
      console.error("Request failed:", error.code || error.name);
    res
      .status(status)
      .json({
        error: status === 500 ? "Internal server error" : error.message,
      });
  });
  return app;
}
