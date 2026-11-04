// Operator-only CLI. No HTTP endpoint can bootstrap platform authority.
import { randomUUID } from "node:crypto";
import { postgres, transaction } from "./db.ts";
import { hashPassword } from "./security.ts";
const email = process.env.ADMIN_EMAIL?.toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (!email || !password || password.length < 16)
  throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (16+ characters)");
const db = postgres();
try {
  const hash = await hashPassword(password);
  await transaction(db, async (c) => {
    await c.query("LOCK TABLE campus.role_grants IN EXCLUSIVE MODE");
    if (
      (
        await c.query(
          "SELECT 1 FROM campus.role_grants WHERE role='platform_admin' AND status='active'",
        )
      ).rows.length
    )
      throw new Error("Platform admin already exists");
    const id = randomUUID();
    await c.query(
      "INSERT INTO campus.accounts(id,email,password_hash,full_name,email_verified) VALUES($1,$2,$3,$4,true)",
      [id, email, hash, "Platform administrator"],
    );
    await c.query(
      "INSERT INTO campus.role_grants(id,user_id,role,granted_by) VALUES($1,$2,'platform_admin',$2)",
      [randomUUID(), id],
    );
  });
  console.log("Platform administrator created");
} finally {
  await db.end();
}
