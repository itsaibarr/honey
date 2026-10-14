import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { recipients, letters } from "@/lib/db/schema";
import { verifyAuthorToken } from "@/lib/auth";
import { statusOf } from "@/lib/letters";
import { civilDateLocal } from "@/lib/time";
import LoftClient from "./LoftClient";

export const dynamic = "force-dynamic";

function nextDay(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + 1));
  return civilDateLocal(t, "UTC");
}

export default async function LoftPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!verifyAuthorToken(token)) notFound();

  const db = await getDb();
  const [rec] = await db.select().from(recipients).limit(1);
  const tz = rec?.timezone ?? process.env.RECIPIENT_TZ ?? "UTC";
  const recipientName = rec?.name ?? process.env.RECIPIENT_NAME ?? "Someone";
  const now = new Date();

  const rows = rec
    ? await db.select().from(letters).where(eq(letters.recipientId, rec.id))
    : [];

  const view = rows
    .filter((l) => !l.deletedAt)
    .sort((a, b) => a.arriveAt.getTime() - b.arriveAt.getTime())
    .map((l) => ({
      id: l.id,
      body: l.body,
      senderName: l.senderName,
      arriveDateLocal: civilDateLocal(l.arriveAt, tz),
      delivered: statusOf(l, now) !== "in_flight",
    }));

  return (
    <LoftClient
      token={token}
      recipientName={recipientName}
      suggestedDate={nextDay(civilDateLocal(now, tz))}
      letters={view}
    />
  );
}
