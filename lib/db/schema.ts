import {
  pgTable,
  pgEnum,
  uuid,
  text,
  date,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Direction is stored from day one so reply-pigeons (her -> you, v1.1) need no
 * migration. MVP only ever writes "to_her".
 */
export const letterDirection = pgEnum("letter_direction", ["to_her", "to_you"]);

/** A single person who receives pigeons. MVP has exactly one row (RECIPIENT_NAME). */
export const recipients = pgTable("recipients", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  // recipient's local timezone — "morning" deliveries are anchored to this
  timezone: text("timezone").notNull().default("UTC"),
  // sha-256 of the recipient's unguessable secret-link token (never store the raw token)
  tokenHash: text("token_hash").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** A trip: one daily-drip sequence of letters. */
export const journeys = pgTable("journeys", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipientId: uuid("recipient_id")
    .notNull()
    .references(() => recipients.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  startDate: date("start_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** A letter carried by a pigeon. Flight status is derived from arriveAt/readAt. */
export const letters = pgTable("letters", {
  id: uuid("id").defaultRandom().primaryKey(),
  journeyId: uuid("journey_id").references(() => journeys.id, {
    onDelete: "set null",
  }),
  recipientId: uuid("recipient_id")
    .notNull()
    .references(() => recipients.id, { onDelete: "cascade" }),
  direction: letterDirection("direction").notNull().default("to_her"),
  senderName: text("sender_name").notNull().default(""),
  body: text("body").notNull().default(""),
  departAt: timestamp("depart_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  arriveAt: timestamp("arrive_at", { withTimezone: true }).notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export type Recipient = typeof recipients.$inferSelect;
export type Journey = typeof journeys.$inferSelect;
export type Letter = typeof letters.$inferSelect;
export type NewLetter = typeof letters.$inferInsert;
