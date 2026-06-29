/**
 * One-time dev setup: create/refresh the recipient (Amira) and print the two
 * secret links. Writes AUTHOR_TOKEN (+ a dev copy of her token) to .env.local.
 *
 * Run: npm run db:setup   (then restart the dev server to load AUTHOR_TOKEN)
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { eq } from "drizzle-orm";
import { getDb } from "../lib/db";
import { recipients } from "../lib/db/schema";
import { generateToken, hashToken } from "../lib/auth";

function upsertEnv(file: string, kv: Record<string, string>) {
  const lines = existsSync(file)
    ? readFileSync(file, "utf8").split("\n").filter((l) => l.trim() !== "")
    : [];
  for (const [k, v] of Object.entries(kv)) {
    const idx = lines.findIndex((l) => l.startsWith(k + "="));
    const line = `${k}=${v}`;
    if (idx >= 0) lines[idx] = line;
    else lines.push(line);
  }
  writeFileSync(file, lines.join("\n") + "\n");
}

async function main() {
  const db = await getDb();
  const authorToken = generateToken();
  const recipientToken = generateToken();

  const name = process.env.RECIPIENT_NAME || "Амира";
  const timezone = process.env.RECIPIENT_TZ || "Asia/Almaty";
  const email = process.env.RECIPIENT_EMAIL || null;
  const base = process.env.APP_BASE_URL || "http://localhost:3100";

  // Upsert the single recipient, preserving any existing letters.
  const values = { name, timezone, email, tokenHash: hashToken(recipientToken) };
  const existing = await db.select().from(recipients).limit(1);
  if (existing[0]) {
    await db.update(recipients).set(values).where(eq(recipients.id, existing[0].id));
  } else {
    await db.insert(recipients).values(values);
  }

  const recipientUrl = `${base}/m/${recipientToken}`;

  if (process.env.DATABASE_URL) {
    // Production: don't touch local env — emit tokens for the deploy to capture.
    console.log(`\n✓ ${name} created in production DB\n`);
    console.log(`AUTHOR_TOKEN=${authorToken}`);
    console.log(`RECIPIENT_TOKEN=${recipientToken}`);
    console.log(`RECIPIENT_PATH=/m/${recipientToken}`);
    console.log(`LOFT_PATH=/loft/${authorToken}`);
  } else {
    upsertEnv(".env.local", {
      AUTHOR_TOKEN: authorToken,
      DEV_RECIPIENT_TOKEN: recipientToken,
      RECIPIENT_URL: recipientUrl,
    });
    console.log("\n✓ Setup complete\n");
    console.log(`  Author (Loft):     ${base}/loft/${authorToken}`);
    console.log(`  Recipient (${name}): ${recipientUrl}`);
    console.log(`  Email:             ${email ?? "(none set)"}`);
    console.log("\n  Saved to .env.local. Restart the server to load new env.\n");
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("✗ setup failed:", err);
  process.exit(1);
});
