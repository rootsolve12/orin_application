import nodemailer from "nodemailer";
import { postgres, transaction, type Database } from "./db.ts";
// Email delivery is at-least-once: an SMTP success followed by DB failure can retry
// the same message. A stable Message-ID helps providers deduplicate it.
export async function deliverBatch(
  db: Database,
  send: (payload: any, id: string) => Promise<void>,
) {
  return transaction(db, async (c) => {
    const jobs = (
      await c.query(
        "SELECT * FROM campus.outbox WHERE kind='email.challenge' AND delivered_at IS NULL AND attempts<8 ORDER BY created_at LIMIT 10 FOR UPDATE SKIP LOCKED",
      )
    ).rows;
    for (const job of jobs) {
      try {
        await send(job.payload, job.id);
        await c.query(
          "UPDATE campus.outbox SET delivered_at=now(),payload=$2::jsonb WHERE id=$1",
          [job.id, JSON.stringify({ redacted: true })],
        );
      } catch {
        await c.query(
          "UPDATE campus.outbox SET attempts=attempts+1 WHERE id=$1",
          [job.id],
        );
      }
    }
    return jobs.length;
  });
}
if (process.env.SMTP_HOST) {
  const smtp = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_PORT === "465",
    requireTLS: process.env.NODE_ENV === "production",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
  const db = postgres();
  let stopped = false;
  process.on("SIGTERM", () => {
    stopped = true;
  });
  process.on("SIGINT", () => {
    stopped = true;
  });
  while (!stopped) {
    await deliverBatch(db, async (payload, id) => {
      await smtp.sendMail({
        from: process.env.MAIL_FROM,
        to: payload.email,
        subject:
          payload.purpose === "verify"
            ? "Verify your Orin account"
            : "Reset your Orin password",
        messageId: `<${id}@orin.local>`,
        text: `Open the Account screen in Orin and paste this ${payload.purpose === "verify" ? "verification" : "password reset"} token:\n\n${payload.token}\n\nIt expires in 30 minutes. If you did not request this, ignore this email.`,
      });
    });
    await new Promise((r) => setTimeout(r, 5000));
  }
  await db.end();
} else if (process.argv[1]?.endsWith("mail-worker.ts"))
  throw new Error("Configure SMTP_HOST before starting the mail worker");
