import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tracks } from "./tracks";

export const playlistAudienceEnum = pgEnum("playlist_audience", [
  "creator",
  "boutique",
]);

export const playlists = pgTable("playlists", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  nameFr: text("name_fr").notNull(),
  nameEn: text("name_en").notNull(),
  descriptionFr: text("description_fr"),
  descriptionEn: text("description_en"),
  gradient: text("gradient").notNull().default("linear-gradient(135deg, #1b3a4b 0%, #0f2533 100%)"),
  emoji: text("emoji"),
  isPublished: boolean("is_published").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  audience: playlistAudienceEnum("audience").notNull().default("creator"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const playlistTracks = pgTable(
  "playlist_tracks",
  {
    playlistId: uuid("playlist_id")
      .notNull()
      .references(() => playlists.id, { onDelete: "cascade" }),
    trackId: uuid("track_id")
      .notNull()
      .references(() => tracks.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    isDemo: boolean("is_demo").notNull().default(false),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.playlistId, table.trackId] }),
    uniqueIndex("playlist_tracks_one_demo_per_playlist")
      .on(table.playlistId)
      .where(sql`${table.isDemo} = true`),
  ]
);

export type Playlist = typeof playlists.$inferSelect;
export type NewPlaylist = typeof playlists.$inferInsert;
export type PlaylistTrack = typeof playlistTracks.$inferSelect;
export type PlaylistAudience = (typeof playlistAudienceEnum.enumValues)[number];
