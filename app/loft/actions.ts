"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, type Database } from "@/lib/db";
import { recipients, journeys, letters } from "@/lib/db/schema";
import { verifyAuthorToken } from "@/lib/auth";
import { localTimeUtc } from "@/lib/time";

const MORNING_HOUR = 8; // letters land at 08:00 her time

function assertAuthor(token: string) {
  if (!verifyAuthorToken(token)) throw new Error("unauthorized");
}

async function resolveRecipientAndJourney(db: Database) {
  const [rec] = await db.select().from(recipients).limit(1);
  if (!rec) throw new Error("no recipient configured — run `npm run db:setup`");

  let [journey] = await db
    .select()
    .from(journeys)
    .where(eq(journeys.recipientId, rec.id))
    .limit(1);
  if (!journey) {
    [journey] = await db
      .insert(journeys)
      .values({
        recipientId: rec.id,
        title: "Письма голубями",
        startDate: new Date().toISOString().slice(0, 10),
      })
      .returning();
  }
  return { rec, journey };
}

type LetterInput = {
  body: string;
  senderName: string;
  arriveDate: string; // YYYY-MM-DD in her timezone
};

export async function createLetter(token: string, input: LetterInput) {
  assertAuthor(token);
  const db = await getDb();
  const { rec, journey } = await resolveRecipientAndJourney(db);
  const arriveAt = localTimeUtc(input.arriveDate, MORNING_HOUR, rec.timezone);

  await db.insert(letters).values({
    journeyId: journey.id,
    recipientId: rec.id,
    senderName: input.senderName.trim() || "твой голубь",
    body: input.body.trim(),
    arriveAt,
  });
  revalidatePath(`/loft/${token}`);
}

export async function updateLetter(
  token: string,
  input: LetterInput & { id: string },
) {
  assertAuthor(token);
  const db = await getDb();
  const { rec } = await resolveRecipientAndJourney(db);

  const [existing] = await db
    .select()
    .from(letters)
    .where(eq(letters.id, input.id))
    .limit(1);
  if (!existing) throw new Error("letter not found");
  if (existing.arriveAt.getTime() <= Date.now())
    throw new Error("already delivered — cannot edit");

  await db
    .update(letters)
    .set({
      body: input.body.trim(),
      senderName: input.senderName.trim() || "твой голубь",
      arriveAt: localTimeUtc(input.arriveDate, MORNING_HOUR, rec.timezone),
      updatedAt: new Date(),
    })
    .where(eq(letters.id, input.id));
  revalidatePath(`/loft/${token}`);
}

export async function deleteLetter(token: string, id: string) {
  assertAuthor(token);
  const db = await getDb();
  const [existing] = await db
    .select()
    .from(letters)
    .where(eq(letters.id, id))
    .limit(1);
  if (!existing) return;
  if (existing.arriveAt.getTime() <= Date.now())
    throw new Error("already delivered — cannot delete");

  await db.delete(letters).where(eq(letters.id, id));
  revalidatePath(`/loft/${token}`);
}
