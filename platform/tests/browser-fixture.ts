// Local-only browser QA fixture. Never used by production entry points.
import { PGlite } from "@electric-sql/pglite";
import { createApp } from "../apps/api/src/app.ts";
import { migrate } from "../apps/api/src/migrate.ts";
import { hashPassword } from "../apps/api/src/security.ts";
import { randomUUID } from "node:crypto";
import type { Database } from "../apps/api/src/db.ts";
const pg = new PGlite();
const query = async (sql: string, values?: any[]) => {
  if (!values?.length && sql.includes(";"))
    return (await pg.exec(sql)).at(-1) || { rows: [] };
  return pg.query(sql, values);
};
const db: Database = {
  query: query as any,
  async connect() {
    return { query: query as any, release() {} };
  },
};
await migrate(db);
const college = randomUUID(),
  user = randomUUID(),
  event = randomUUID();
await query(
  "INSERT INTO campus.colleges(id,name,city,status) VALUES($1,'Pilot College','Chennai','active')",
  [college],
);
await query(
  "INSERT INTO campus.accounts(id,email,password_hash,full_name,email_verified,college_id,verification_status) VALUES($1,'qa@pilot.test',$2,'QA Student',true,$3,'verified')",
  [user, await hashPassword("Browser QA password 123!"), college],
);
await query(
  "INSERT INTO campus.events(id,college_id,organizer_id,title,description,genre,venue,visibility,status,capacity,registration_deadline,starts_at,ends_at) VALUES($1,$2,$3,'Campus Innovation Day','Meet students building practical ideas for the local community. Bring curiosity and leave with a working prototype.','Hackathon','Innovation Centre','public','published',100,'2030-01-01','2030-01-02','2030-01-03')",
  [event, college, user],
);
createApp(db, { rateLimits: false }).listen(4100, "127.0.0.1", () =>
  console.log("Browser fixture ready"),
);
