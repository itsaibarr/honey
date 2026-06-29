import type { Letter } from "@/lib/db/schema";
import { civilDayDiff, civilParts } from "@/lib/time";

export type FlightStatus = "in_flight" | "landed_unread" | "read";

type StatusInput = Pick<Letter, "arriveAt" | "readAt" | "deletedAt">;

/** Derive a letter's flight status. Deleted letters are treated as gone. */
export function statusOf(letter: StatusInput, now: Date): FlightStatus {
  const landed = letter.arriveAt.getTime() <= now.getTime();
  if (!landed) return "in_flight";
  return letter.readAt ? "read" : "landed_unread";
}

export interface Categorized {
  /** Still flying — never expose bodies for these. Soonest arrival first. */
  inFlight: Letter[];
  /** Landed but not yet opened — these trigger the arrival ceremony. */
  landedUnread: Letter[];
  /** Read keepsake mailbox, newest arrival first. */
  mailbox: Letter[];
}

/** Split a recipient's letters into the three pipeline buckets. */
export function categorize(letters: Letter[], now: Date): Categorized {
  const live = letters.filter((l) => !l.deletedAt);
  const inFlight: Letter[] = [];
  const landedUnread: Letter[] = [];
  const mailbox: Letter[] = [];

  for (const l of live) {
    const status = statusOf(l, now);
    if (status === "in_flight") inFlight.push(l);
    else if (status === "landed_unread") landedUnread.push(l);
    else mailbox.push(l);
  }

  inFlight.sort((a, b) => a.arriveAt.getTime() - b.arriveAt.getTime());
  landedUnread.sort((a, b) => a.arriveAt.getTime() - b.arriveAt.getTime());
  mailbox.sort((a, b) => b.arriveAt.getTime() - a.arriveAt.getTime());

  return { inFlight, landedUnread, mailbox };
}

function partOfDayRu(hour: number): string {
  if (hour < 12) return "утром";
  if (hour < 18) return "днём";
  return "вечером";
}

function pluralHours(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "час";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "часа";
  return "часов";
}

/** "3 июля" — ru combined day+month yields the genitive form correctly. */
function ruDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone,
    day: "numeric",
    month: "long",
  }).format(date);
}

/**
 * Anticipation-building Russian label for an in-flight pigeon, e.g.
 * "прилетит завтра утром". Computed in the recipient's timezone.
 */
export function etaLabel(arriveAt: Date, now: Date, timeZone: string): string {
  if (arriveAt.getTime() <= now.getTime()) return "прилетел";

  const days = civilDayDiff(now, arriveAt, timeZone);
  const part = partOfDayRu(civilParts(arriveAt, timeZone).hour);

  if (days <= 0) {
    const hours = (arriveAt.getTime() - now.getTime()) / 3_600_000;
    if (hours < 1) return "прилетит совсем скоро";
    if (hours < 6) {
      const h = Math.round(hours);
      return `прилетит через ${h} ${pluralHours(h)}`;
    }
    return `прилетит сегодня ${part}`;
  }
  if (days === 1) return `прилетит завтра ${part}`;
  return `прилетит ${ruDate(arriveAt, timeZone)} ${part}`;
}
