import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { postgres, transaction, type Database } from "./db.ts";
export async function migrate(db: Database) {
  await db.query(
    "CREATE TABLE IF NOT EXISTS public.orin_migrations(name text PRIMARY KEY,applied_at timestamptz DEFAULT now())",
  );
  const directory = new URL("../migrations/", import.meta.url);
  await transaction(db, async (c) => {
    await c.query("LOCK TABLE public.orin_migrations IN EXCLUSIVE MODE");
    for (const name of (await readdir(directory))
      .filter((n) => n.endsWith(".sql"))
      .sort()) {
      if (
        (
          await c.query(
            "SELECT name FROM public.orin_migrations WHERE name=$1",
            [name],
          )
        ).rows.length
      )
        continue;
      const sql = (await readFile(new URL(name, directory), "utf8")).replace(
        /^BEGIN;\s*|COMMIT;\s*$/gm,
        "",
      );
      await c.query(sql);
      await c.query("INSERT INTO public.orin_migrations(name) VALUES($1)", [
        name,
      ]);
    }
  });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const db = postgres();
  try {
    await migrate(db);
    console.log("Migrations applied");
  } finally {
    await db.end();
  }
}
