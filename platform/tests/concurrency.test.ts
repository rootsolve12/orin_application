import { test } from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { randomUUID } from "node:crypto";
import { createApp } from "../apps/api/src/app.ts";
import { migrate } from "../apps/api/src/migrate.ts";
import { token, digest } from "../apps/api/src/security.ts";
// Never point this test at an application database. CI provisions a dedicated DB.
test(
  "networked PostgreSQL serializes simultaneous last-seat requests",
  { skip: !process.env.TEST_DATABASE_URL },
  async () => {
    const url = process.env.TEST_DATABASE_URL!;
    if (!new URL(url).pathname.endsWith("_test"))
      throw new Error("Test database name must end in _test");
    const pool = new pg.Pool({ connectionString: url, max: 15 });
    await migrate(pool);
    const college = randomUUID(),
      event = randomUUID();
    const sessions: string[] = [],
      users: string[] = [];
    let server: ReturnType<ReturnType<typeof createApp>["listen"]> | undefined;
    try {
      await pool.query(
        "INSERT INTO campus.colleges(id,name,city,status) VALUES($1,'Concurrency Test','Test City','active')",
        [college],
      );
      for (let i = 0; i < 20; i++) {
        const id = randomUUID(),
          secret = token();
        users.push(id);
        sessions.push(secret);
        await pool.query(
          "INSERT INTO campus.accounts(id,email,password_hash,full_name,email_verified,college_id,verification_status) VALUES($1,$2,'not-a-login-hash','Concurrent student',true,$3,'verified')",
          [id, `${id}@test.invalid`, college],
        );
        await pool.query(
          "INSERT INTO campus.sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",
          [digest(secret), id],
        );
      }
      await pool.query(
        "INSERT INTO campus.events(id,college_id,organizer_id,title,genre,venue,visibility,status,capacity,registration_deadline,starts_at,ends_at) VALUES($1,$2,$3,'Concurrency test','Test','Test room','college_only','published',3,'2090-01-01','2090-01-02','2090-01-03')",
        [event, college, users[0]],
      );
      server = createApp(pool, { rateLimits: false }).listen(0, "127.0.0.1");
      await new Promise<void>((r) => server!.once("listening", r));
      const base = `http://127.0.0.1:${(server.address() as any).port}`;
      const replies = await Promise.all(
        sessions.flatMap((secret) =>
          [0, 1].map(async () => {
            const result = await fetch(`${base}/v1/events/${event}/register`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${secret}`,
                "Content-Type": "application/json",
              },
              body: "{}",
            });
            assert.equal(result.status, 201);
            return result.json();
          }),
        ),
      );
      assert.equal(new Set(replies.map((r) => r.id)).size, 20);
      const counts = (
        await pool.query(
          "SELECT status,count(*)::integer AS n FROM campus.registrations WHERE event_id=$1 GROUP BY status",
          [event],
        )
      ).rows;
      assert.equal(counts.find((r) => r.status === "registered").n, 3);
      assert.equal(counts.find((r) => r.status === "waitlisted").n, 17);
    } finally {
      if (server)
        await new Promise<void>((r, j) =>
          server!.close((e) => (e ? j(e) : r())),
        );
      await pool.query(
        "DELETE FROM campus.notifications WHERE user_id=ANY($1::uuid[])",
        [users],
      );
      await pool.query("DELETE FROM campus.registrations WHERE event_id=$1", [
        event,
      ]);
      await pool.query("DELETE FROM campus.events WHERE id=$1", [event]);
      await pool.query("DELETE FROM campus.accounts WHERE id=ANY($1::uuid[])", [
        users,
      ]);
      await pool.query("DELETE FROM campus.colleges WHERE id=$1", [college]);
      await pool.end();
    }
  },
);
