import { describe, it, expect } from "vitest";
import type { Letter } from "@/lib/db/schema";
import { localTimeUtc } from "@/lib/time";
import { statusOf, categorize, etaLabel } from "./index";

const TZ = "Asia/Almaty"; // UTC+5, no DST

function mk(over: Partial<Letter>): Letter {
  return {
    id: over.id ?? crypto.randomUUID(),
    journeyId: over.journeyId ?? null,
    recipientId: over.recipientId ?? "r1",
    direction: over.direction ?? "to_her",
    senderName: over.senderName ?? "",
    body: over.body ?? "",
    departAt: over.departAt ?? new Date("2026-06-01T00:00:00Z"),
    arriveAt: over.arriveAt ?? new Date("2026-06-01T00:00:00Z"),
    readAt: over.readAt ?? null,
    createdAt: over.createdAt ?? new Date("2026-06-01T00:00:00Z"),
    updatedAt: over.updatedAt ?? new Date("2026-06-01T00:00:00Z"),
    deletedAt: over.deletedAt ?? null,
  };
}

describe("localTimeUtc", () => {
  it("converts 08:00 Almaty to 03:00 UTC", () => {
    expect(localTimeUtc("2026-07-01", 8, TZ).toISOString()).toBe(
      "2026-07-01T03:00:00.000Z",
    );
  });
});

describe("statusOf", () => {
  const now = new Date("2026-06-30T05:00:00Z");
  it("in_flight before arrival", () => {
    expect(statusOf(mk({ arriveAt: new Date("2026-07-01T03:00:00Z") }), now)).toBe(
      "in_flight",
    );
  });
  it("landed_unread after arrival, no readAt", () => {
    expect(statusOf(mk({ arriveAt: new Date("2026-06-29T03:00:00Z") }), now)).toBe(
      "landed_unread",
    );
  });
  it("read after arrival with readAt", () => {
    expect(
      statusOf(
        mk({
          arriveAt: new Date("2026-06-29T03:00:00Z"),
          readAt: new Date("2026-06-29T04:00:00Z"),
        }),
        now,
      ),
    ).toBe("read");
  });
});

describe("categorize", () => {
  const now = new Date("2026-06-30T05:00:00Z");
  const inflight = mk({ arriveAt: new Date("2026-07-02T03:00:00Z") });
  const inflightSooner = mk({ arriveAt: new Date("2026-07-01T03:00:00Z") });
  const landed = mk({ arriveAt: new Date("2026-06-29T03:00:00Z") });
  const read = mk({
    arriveAt: new Date("2026-06-28T03:00:00Z"),
    readAt: new Date("2026-06-28T05:00:00Z"),
  });
  const deleted = mk({
    arriveAt: new Date("2026-06-27T03:00:00Z"),
    deletedAt: new Date("2026-06-27T06:00:00Z"),
  });

  const c = categorize([inflight, inflightSooner, landed, read, deleted], now);

  it("buckets by status and excludes deleted", () => {
    expect(c.inFlight).toHaveLength(2);
    expect(c.landedUnread.map((l) => l.id)).toEqual([landed.id]);
    expect(c.mailbox.map((l) => l.id)).toEqual([read.id]);
  });
  it("orders in-flight soonest first", () => {
    expect(c.inFlight.map((l) => l.id)).toEqual([inflightSooner.id, inflight.id]);
  });
});

describe("etaLabel (ru)", () => {
  const now = new Date("2026-06-30T05:00:00Z"); // 10:00 Almaty

  it("within the hour", () => {
    expect(etaLabel(new Date("2026-06-30T05:30:00Z"), now, TZ)).toBe(
      "прилетит совсем скоро",
    );
  });
  it("in N hours (plural)", () => {
    expect(etaLabel(new Date("2026-06-30T08:00:00Z"), now, TZ)).toBe(
      "прилетит через 3 часа",
    );
  });
  it("tomorrow morning", () => {
    expect(etaLabel(localTimeUtc("2026-07-01", 8, TZ), now, TZ)).toBe(
      "прилетит завтра утром",
    );
  });
  it("a few days out → genitive date", () => {
    expect(etaLabel(localTimeUtc("2026-07-03", 8, TZ), now, TZ)).toBe(
      "прилетит 3 июля утром",
    );
  });
  it("beyond a week → genitive date", () => {
    expect(etaLabel(localTimeUtc("2026-07-10", 8, TZ), now, TZ)).toBe(
      "прилетит 10 июля утром",
    );
  });
  it("past arrivals", () => {
    expect(etaLabel(new Date("2026-06-29T03:00:00Z"), now, TZ)).toBe("прилетел");
  });
});
