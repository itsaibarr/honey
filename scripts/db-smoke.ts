/**
 * M1 smoke test: prove the data layer end-to-end.
 * Creates Amira + a daily-drip journey of 3 letters, reads them back, and
 * derives flight status (landed vs in-flight) the way the recipient view will.
 *
 * Run: npm run db:smoke
 */
import { getDb } from "../lib/db";
import { recipients, journeys, letters } from "../lib/db/schema";

function hoursFromNow(h: number): Date {
  return new Date(Date.now() + h * 60 * 60 * 1000);
}

async function main() {
  const db = await getDb();

  // idempotent: wipe prior smoke data (cascade clears journeys + letters)
  await db.delete(letters);
  await db.delete(journeys);
  await db.delete(recipients);

  const [amira] = await db
    .insert(recipients)
    .values({
      name: "Amira",
      email: null,
      timezone: "Asia/Almaty",
      tokenHash: "dev-smoke-recipient",
    })
    .returning();

  const [journey] = await db
    .insert(journeys)
    .values({
      recipientId: amira.id,
      title: "Дорога домой",
      startDate: "2026-06-30",
    })
    .returning();

  // daily drip: one already landed, two still in flight
  await db.insert(letters).values([
    {
      journeyId: journey.id,
      recipientId: amira.id,
      senderName: "твой голубь",
      body: "Первое письмо — уже прилетело. Доброе утро, любимая.",
      arriveAt: hoursFromNow(-2),
    },
    {
      journeyId: journey.id,
      recipientId: amira.id,
      senderName: "твой голубь",
      body: "Второе письмо — в пути, прилетит завтра утром.",
      arriveAt: hoursFromNow(22),
    },
    {
      journeyId: journey.id,
      recipientId: amira.id,
      senderName: "твой голубь",
      body: "Третье письмо — ещё летит.",
      arriveAt: hoursFromNow(46),
    },
  ]);

  const all = await db.select().from(letters);
  all.sort((a, b) => +a.arriveAt - +b.arriveAt);

  const now = Date.now();
  console.log(`\nMailbox for ${amira.name} (journey: ${journey.title}):\n`);
  for (const l of all) {
    const landed = +l.arriveAt <= now;
    const tag = landed ? "🛬 landed     " : "🕊️  in flight  ";
    console.log(`${tag} ${l.arriveAt.toISOString()}  ${l.body}`);
  }

  const landedCount = all.filter((l) => +l.arriveAt <= now).length;
  console.log(
    `\n✓ ${all.length} letters stored — ${landedCount} landed, ${
      all.length - landedCount
    } in flight\n`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("✗ smoke test failed:", err);
  process.exit(1);
});
