import type { PgliteDatabase } from "drizzle-orm/pglite";
import * as schema from "./schema";

/**
 * One Drizzle type for the whole app. Dev uses PGlite, prod uses postgres.js
 * (Neon) — both speak the same Postgres dialect, so the query API is identical.
 */
export type Database = PgliteDatabase<typeof schema>;

let _dbPromise: Promise<Database> | null = null;

async function createDatabase(): Promise<Database> {
  const url = process.env.DATABASE_URL;

  // Production: a real Postgres connection string (Neon) -> postgres.js driver.
  if (url) {
    const { default: postgres } = await import("postgres");
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const client = postgres(url, { prepare: false });
    return drizzle(client, { schema }) as unknown as Database;
  }

  // Local dev: embedded PGlite, file-backed, auto-migrated on first use so the
  // database is always in sync with the schema with zero setup.
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const { mkdirSync } = await import("node:fs");
  mkdirSync(".data", { recursive: true }); // PGlite's own mkdir isn't recursive
  const client = new PGlite(".data/honey");
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: "lib/db/migrations" });
  return db;
}

/** Lazily create and cache the database connection for this runtime. */
export function getDb(): Promise<Database> {
  if (!_dbPromise) _dbPromise = createDatabase();
  return _dbPromise;
}
