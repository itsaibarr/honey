import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { recipients, type Recipient } from "@/lib/db/schema";

/** A long, URL-safe, unguessable secret-link token. */
export function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** The Loft is gated by a single AUTHOR_TOKEN env secret (you're the only author). */
export function verifyAuthorToken(token: string | undefined): boolean {
  const secret = process.env.AUTHOR_TOKEN;
  if (!secret || !token) return false;
  return safeEqualHex(hashToken(token), hashToken(secret));
}

/** Resolve a recipient secret-link token to its row (hash compare, never raw). */
export async function getRecipientByToken(
  token: string | undefined,
): Promise<Recipient | null> {
  if (!token) return null;
  const db = await getDb();
  const rows = await db
    .select()
    .from(recipients)
    .where(eq(recipients.tokenHash, hashToken(token)))
    .limit(1);
  return rows[0] ?? null;
}
