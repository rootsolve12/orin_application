import pg from "pg";
export interface Queryable {
  query<T = any>(
    sql: string,
    values?: any[],
  ): Promise<{ rows: T[]; rowCount?: number | null }>;
}
export interface Database extends Queryable {
  connect(): Promise<Connection>;
}
export interface Connection extends Queryable {
  release(): void;
}
export function postgres(): pg.Pool {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  return new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
}
export async function transaction<T>(
  db: Database,
  fn: (c: Connection) => Promise<T>,
): Promise<T> {
  const c = await db.connect();
  try {
    await c.query("BEGIN");
    const result = await fn(c);
    await c.query("COMMIT");
    return result;
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
