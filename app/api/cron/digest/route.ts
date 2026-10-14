import { NextResponse } from "next/server";
import { and, isNull, lte } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { letters, recipients } from "@/lib/db/schema";
import { sendDigest } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Daily nudge: if any pigeons have landed and are still unread, send one gentle
 * digest email. Runs once a day (Vercel Hobby cron limit); the in-app reveal
 * never depends on this, so it's purely a best-effort nudge.
 */
export async function GET(request: Request) {
  // Vercel Cron attaches `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (request.headers.get("authorization") !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const db = await getDb();
  const waiting = await db
    .select({ id: letters.id })
    .from(letters)
    .where(
      and(
        lte(letters.arriveAt, new Date()),
        isNull(letters.readAt),
        isNull(letters.deletedAt),
      ),
    );
  const count = waiting.length;

  if (count === 0) return NextResponse.json({ count: 0, sent: false });

  // Prefer the recipients.email column written by db:setup; fall back to env.
  const [rec] = await db.select().from(recipients).limit(1);
  const email = rec?.email ?? process.env.RECIPIENT_EMAIL;
  const link = process.env.RECIPIENT_URL || process.env.APP_BASE_URL || "";
  if (!email) {
    return NextResponse.json({ count, sent: false, reason: "no recipient email" });
  }

  const res = await sendDigest({ email, count, link });
  return NextResponse.json({ count, sent: res.ok, error: res.error });
}
