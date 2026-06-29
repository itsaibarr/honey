/**
 * Apply Drizzle migrations to the Postgres in DATABASE_URL (production / Neon).
 * Run: DATABASE_URL=postgresql://... npm run db:migrate
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");

  const sql = postgres(url, { max: 1, prepare: false });
  const db = drizzle(sql);
  await migrate(db, { migrationsFolder: "lib/db/migrations" });
  await sql.end();
  console.log("✓ migrations applied");
}

main().catch((err) => {
  console.error("✗ migration failed:", err);
  process.exit(1);
});
