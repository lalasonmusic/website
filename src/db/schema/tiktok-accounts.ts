import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles";

export const tiktokAccountStatusEnum = pgEnum("tiktok_account_status", [
  "pending",
  "processed",
]);

export const tiktokAccounts = pgTable("tiktok_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  accountUrl: text("account_url").notNull(),
  status: tiktokAccountStatusEnum("status").notNull().default("pending"),
  submittedAt: timestamp("submitted_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});

export type TiktokAccount = typeof tiktokAccounts.$inferSelect;
export type NewTiktokAccount = typeof tiktokAccounts.$inferInsert;
