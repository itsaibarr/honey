import { defineConfig } from "drizzle-kit";

/**
 * Migrations are generated from the schema offline (no DB connection needed for
 * `drizzle-kit generate`), then applied to PGlite in dev (auto, see lib/db) and
 * to Neon in prod at deploy time.
 */
export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
});
