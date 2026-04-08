import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles";

export const facebookAccountStatusEnum = pgEnum("facebook_account_status", [
  "pending",
  "processed",
]);

export const facebookAccounts = pgTable("facebook_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  accountUrl: text("account_url").notNull(),
  status: facebookAccountStatusEnum("status").notNull().default("pending"),
  submittedAt: timestamp("submitted_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});

export type FacebookAccount = typeof facebookAccounts.$inferSelect;
export type NewFacebookAccount = typeof facebookAccounts.$inferInsert;
