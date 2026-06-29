"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { letters } from "@/lib/db/schema";
import { getRecipientByToken } from "@/lib/auth";

/** Mark a landed letter as read. Scoped to the recipient who owns the token. */
export async function markRead(token: string, letterId: string) {
  const rec = await getRecipientByToken(token);
  if (!rec) throw new Error("unauthorized");

  const db = await getDb();
  const [l] = await db
    .select()
    .from(letters)
    .where(eq(letters.id, letterId))
    .limit(1);

  if (!l || l.recipientId !== rec.id) throw new Error("not found");
  if (l.arriveAt.getTime() > Date.now()) throw new Error("not landed yet");

  if (!l.readAt) {
    await db
      .update(letters)
      .set({ readAt: new Date() })
      .where(eq(letters.id, letterId));
  }
  revalidatePath(`/m/${token}`);
}
