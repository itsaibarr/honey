import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { letters } from "@/lib/db/schema";
import { getRecipientByToken } from "@/lib/auth";
import { categorize, etaLabel } from "@/lib/letters";
import MailboxClient from "./MailboxClient";

export const dynamic = "force-dynamic";

export default async function MailboxPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const rec = await getRecipientByToken(token);

  // Gentle, no-data-leak state for a wrong link.
  if (!rec) {
    return (
      <main className="relative z-10 flex min-h-dvh flex-col items-center justify-center gap-3 px-8 text-center">
        <div className="text-5xl">🕊️</div>
        <p className="font-serif text-xl text-cream">
          Хм, эта ссылка не открывается.
        </p>
        <p className="font-serif text-sm italic text-cream/70">
          Попроси прислать новую — голубь подождёт.
        </p>
      </main>
    );
  }

  const db = await getDb();
  const rows = await db
    .select()
    .from(letters)
    .where(eq(letters.recipientId, rec.id));
  const now = new Date();
  const { inFlight, landedUnread, mailbox } = categorize(rows, now);

  const view = {
    name: rec.name,
    // in-flight letters NEVER include the body — server withholds it
    inFlight: inFlight.map((l) => ({
      id: l.id,
      eta: etaLabel(l.arriveAt, now, rec.timezone),
    })),
    landedUnread: landedUnread.map((l) => ({
      id: l.id,
      body: l.body,
      senderName: l.senderName,
    })),
    mailbox: mailbox.map((l) => ({
      id: l.id,
      body: l.body,
      senderName: l.senderName,
    })),
  };

  return <MailboxClient token={token} view={view} />;
}
