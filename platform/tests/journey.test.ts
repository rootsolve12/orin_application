import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { createApp } from "../apps/api/src/app.ts";
import { migrate } from "../apps/api/src/migrate.ts";
import { hashPassword } from "../apps/api/src/security.ts";
import { randomUUID } from "node:crypto";
import { OrinClient } from "../packages/contracts/src/index.ts";
import type { Database, Connection } from "../apps/api/src/db.ts";
export async function testDatabase() {
  const pg = new PGlite();
  let tail = Promise.resolve();
  const query = async (sql: string, values?: any[]) => {
    if (!values?.length && sql.includes(";")) {
      const results = await pg.exec(sql);
      return results.at(-1) || { rows: [] };
    }
    return pg.query(sql, values);
  };
  const db: Database = {
    query: query as any,
    async connect() {
      const before = tail;
      let unlock!: () => void;
      tail = new Promise<void>((r) => {
        unlock = r;
      });
      await before;
      return { query: query as any, release: unlock } as Connection;
    },
  };
  await migrate(db);
  return { db, pg };
}
test("campus journey against embedded PostgreSQL: signup through attendance, awards and session revocation", async () => {
  const { db, pg } = await testDatabase();
  const server = createApp(db, { rateLimits: false }).listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  async function req(
    path: string,
    method = "GET",
    body?: unknown,
    session?: string,
  ) {
    const r = await fetch(base + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(session ? { Authorization: `Bearer ${session}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: r.status, body: r.status === 204 ? null : await r.json() };
  }
  try {
    const password = "Long pilot password 123!";
    const admin = randomUUID(),
      college = randomUUID();
    await db.query(
      "INSERT INTO campus.colleges(id,name,city,status) VALUES($1,'Pilot College','Chennai','active')",
      [college],
    );
    await db.query(
      "INSERT INTO campus.accounts(id,email,password_hash,full_name,email_verified,college_id,verification_status) VALUES($1,'admin@pilot.test',$2,'College Admin',true,$3,'verified')",
      [admin, await hashPassword(password), college],
    );
    await db.query(
      "INSERT INTO campus.role_grants(id,user_id,role,college_id,granted_by) VALUES($1,$2,'college_admin',$3,$2)",
      [randomUUID(), admin, college],
    );
    const adminSession = (
      await req("/v1/auth/login", "POST", {
        email: "admin@pilot.test",
        password,
      })
    ).body.token;
    async function signup(email: string, name: string) {
      assert.equal(
        (
          await req("/v1/auth/signup", "POST", {
            email,
            password,
            full_name: name,
          })
        ).status,
        202,
      );
      const a = (
        await db.query(
          "SELECT id,password_hash FROM campus.accounts WHERE email=$1",
          [email],
        )
      ).rows[0];
      assert.ok(!a.password_hash.includes(password));
      const mail = (
        await db.query(
          "SELECT payload FROM campus.outbox WHERE user_id=$1 AND kind='email.challenge'",
          [a.id],
        )
      ).rows[0].payload;
      assert.equal(
        (await req("/v1/auth/verify-email", "POST", { token: mail.token }))
          .status,
        200,
      );
      assert.equal(
        (await req("/v1/auth/verify-email", "POST", { token: mail.token }))
          .status,
        400,
      );
      const login = await req("/v1/auth/login", "POST", { email, password });
      assert.equal(login.status, 200);
      return { id: a.id, session: login.body.token };
    }
    const host = await signup("host@pilot.test", "Host"),
      student = await signup("student@pilot.test", "Student"),
      second = await signup("second@pilot.test", "Second"),
      outsider = await signup("outsider@pilot.test", "Outsider");
    for (const user of [host, student, second]) {
      assert.equal(
        (
          await req(
            "/v1/reviews",
            "POST",
            {
              kind: "college",
              college_id: college,
              evidence: "Roster reference independently verified",
            },
            user.session,
          )
        ).status,
        201,
      );
      const queue = await req("/v1/reviews", "GET", undefined, adminSession);
      const review = queue.body.find((r: any) => r.user_id === user.id);
      assert.equal(
        (
          await req(
            `/v1/reviews/${review.id}/decision`,
            "POST",
            { approve: true },
            adminSession,
          )
        ).status,
        200,
      );
    }
    assert.equal(
      (
        await req(
          "/v1/me",
          "PATCH",
          {
            full_name: "Student",
            year: 2,
            branch: "CSE",
            degree_level: "UG",
            college_id: college,
          },
          outsider.session,
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await req(
          "/v1/reviews",
          "POST",
          {
            kind: "organizer",
            college_id: college,
            evidence: "Faculty approved club organizer",
          },
          host.session,
        )
      ).status,
      201,
    );
    const review = (
      await req("/v1/reviews", "GET", undefined, adminSession)
    ).body.find((r: any) => r.kind === "organizer");
    assert.equal(
      (
        await req(
          `/v1/reviews/${review.id}/decision`,
          "POST",
          { approve: true },
          adminSession,
        )
      ).status,
      200,
    );
    const payload = {
      title: "Campus Innovation Day",
      genre: "Hackathon",
      venue: "Main auditorium",
      description: "Build a local prototype",
      capacity: 1,
      visibility: "college_only",
      registration_deadline: "2030-01-01T00:00:00Z",
      starts_at: "2030-01-02T00:00:00Z",
      ends_at: "2030-01-03T00:00:00Z",
    };
    assert.equal(
      (await req("/v1/events", "POST", payload, student.session)).status,
      403,
    );
    const created = await req("/v1/events", "POST", payload, host.session);
    assert.equal(created.status, 201);
    const id = created.body.id;
    assert.equal((await req(`/v1/events/${id}`)).status, 404);
    assert.equal(
      (
        await req(
          `/v1/events/${id}/status`,
          "POST",
          { status: "published", version: 1 },
          host.session,
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await req(
          `/v1/events/${id}/status`,
          "POST",
          { status: "ongoing", version: 1 },
          host.session,
        )
      ).status,
      409,
    );
    assert.equal(
      (await req("/v1/events", "GET", undefined, outsider.session)).body.items
        .length,
      0,
    );
    assert.equal(
      (await req(`/v1/events/${id}/register`, "POST", {}, outsider.session))
        .status,
      403,
    );
    assert.equal(
      (
        await req(
          `/v1/events/${id}/participants`,
          "GET",
          undefined,
          student.session,
        )
      ).status,
      403,
    );
    const first = await req(
      `/v1/events/${id}/register`,
      "POST",
      {},
      student.session,
    );
    assert.equal(first.body.status, "registered");
    assert.equal(
      (await req(`/v1/events/${id}/register`, "POST", {}, student.session)).body
        .id,
      first.body.id,
    );
    const wait = await req(
      `/v1/events/${id}/register`,
      "POST",
      {},
      second.session,
    );
    assert.equal(wait.body.status, "waitlisted");
    assert.equal(
      (
        await req(
          `/v1/events/${id}/cancel-registration`,
          "POST",
          {},
          student.session,
        )
      ).status,
      200,
    );
    assert.equal(
      (await req("/v1/registrations", "GET", undefined, second.session)).body[0]
        .status,
      "registered",
    );
    assert.equal(
      (
        await req(
          `/v1/events/${id}/updates`,
          "POST",
          { body: "Doors open at 9 AM" },
          host.session,
        )
      ).status,
      201,
    );
    assert.equal(
      (
        await req(
          `/v1/events/${id}/status`,
          "POST",
          { status: "ongoing", version: 2 },
          host.session,
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await req(
          `/v1/events/${id}/check-in`,
          "POST",
          { qr_token: wait.body.qr_token },
          host.session,
        )
      ).body.status,
      "checked_in",
    );
    assert.equal(
      (
        await req(
          `/v1/events/${id}/check-in`,
          "POST",
          { qr_token: wait.body.qr_token },
          host.session,
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await req(
          `/v1/events/${id}/status`,
          "POST",
          { status: "completed", version: 3 },
          host.session,
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await req(
          `/v1/events/${id}/results`,
          "POST",
          { awards: [{ registration_id: first.body.id, award: "Winner" }] },
          host.session,
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await req(
          `/v1/events/${id}/results`,
          "POST",
          { awards: [{ registration_id: wait.body.id, award: "First place" }] },
          host.session,
        )
      ).status,
      200,
    );
    const certs = (
      await req("/v1/certificates", "GET", undefined, second.session)
    ).body;
    assert.equal(certs.length, 1);
    assert.equal(certs[0].award, "First place");
    assert.equal(
      (await req(`/v1/certificates/${certs[0].code}`)).body.full_name,
      "Second",
    );
    assert.equal(
      (
        await req(
          `/v1/certificates/${certs[0].code}/revoke`,
          "POST",
          {},
          host.session,
        )
      ).status,
      200,
    );
    assert.ok((await req(`/v1/certificates/${certs[0].code}`)).body.revoked_at);
    // Reset tokens are single-use and invalidate every existing login session.
    assert.equal(
      (
        await req("/v1/auth/request-reset", "POST", {
          email: "student@pilot.test",
        })
      ).status,
      202,
    );
    const reset = (
      await db.query(
        "SELECT payload FROM campus.outbox WHERE user_id=$1 AND payload->>'purpose'='reset'",
        [student.id],
      )
    ).rows[0].payload.token;
    const newPassword = "Different strong password 456!";
    assert.equal(
      (
        await req("/v1/auth/reset-password", "POST", {
          token: reset,
          password: newPassword,
        })
      ).status,
      200,
    );
    assert.equal(
      (await req("/v1/me", "GET", undefined, student.session)).status,
      401,
    );
    assert.equal(
      (
        await req("/v1/auth/reset-password", "POST", {
          token: reset,
          password: newPassword,
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await req("/v1/auth/login", "POST", {
          email: "student@pilot.test",
          password,
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await req("/v1/auth/login", "POST", {
          email: "student@pilot.test",
          password: newPassword,
        })
      ).status,
      200,
    );
    // Partner access is an explicit event allowlist, never a user-supplied college claim.
    const partner = randomUUID();
    await db.query(
      "INSERT INTO campus.colleges(id,name,city,status) VALUES($1,'Partner University','Chennai','active')",
      [partner],
    );
    await db.query(
      "UPDATE campus.accounts SET college_id=$1,verification_status='verified' WHERE id=$2",
      [partner, outsider.id],
    );
    const partnerEvent = (
      await req(
        "/v1/events",
        "POST",
        {
          ...payload,
          title: "Partner event",
          visibility: "partner",
          allowed_colleges: [partner],
        },
        host.session,
      )
    ).body;
    assert.equal(
      (
        await req(
          `/v1/events/${partnerEvent.id}/status`,
          "POST",
          { status: "published", version: 1 },
          host.session,
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await req(
          `/v1/events/${partnerEvent.id}`,
          "GET",
          undefined,
          outsider.session,
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await req(
          `/v1/events/${partnerEvent.id}/register`,
          "POST",
          {},
          outsider.session,
        )
      ).body.status,
      "registered",
    );
    const edit = await req(
      `/v1/events/${partnerEvent.id}`,
      "PATCH",
      {
        ...payload,
        title: "Changed venue",
        visibility: "partner",
        allowed_colleges: [partner],
        venue: "New venue",
        version: 2,
      },
      host.session,
    );
    assert.equal(edit.status, 200);
    assert.equal(
      (
        await req(
          `/v1/events/${partnerEvent.id}`,
          "PATCH",
          { ...payload, version: 2 },
          host.session,
        )
      ).status,
      409,
    );
    // A result validation error rolls back certificate insertion for every recipient.
    assert.equal(
      Number(
        (await db.query("SELECT count(*) AS n FROM campus.certificates"))
          .rows[0].n,
      ),
      1,
    );
    const sharedClient = new OrinClient(base, outsider.session);
    assert.equal(
      await sharedClient.request("/v1/auth/logout", "POST"),
      undefined,
    );
    await db.query(
      "UPDATE campus.role_grants SET status='revoked' WHERE user_id=$1",
      [host.id],
    );
    assert.equal(
      (await req("/v1/events", "POST", payload, host.session)).status,
      403,
    );
    assert.equal(
      (await req("/v1/auth/logout", "POST", {}, second.session)).status,
      204,
    );
    assert.equal(
      (await req("/v1/me", "GET", undefined, second.session)).status,
      401,
    );
  } finally {
    await new Promise<void>((r, j) => server.close((e) => (e ? j(e) : r())));
    await pg.close();
  }
});
