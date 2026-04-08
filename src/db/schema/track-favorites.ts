import { pgTable, uuid, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { profiles } from "./profiles";
import { tracks } from "./tracks";

export const trackFavorites = pgTable(
  "track_favorites",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    trackId: uuid("track_id")
      .notNull()
      .references(() => tracks.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.trackId] }),
  })
);

export type TrackFavorite = typeof trackFavorites.$inferSelect;
export type NewTrackFavorite = typeof trackFavorites.$inferInsert;
