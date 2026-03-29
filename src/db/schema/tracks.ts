import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { artists } from "./artists";
import { trackCategories } from "./track-categories";

export const tracks = pgTable("tracks", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artists.id),
  durationSeconds: integer("duration_seconds"),
  bpm: integer("bpm"),
  fileFullPath: text("file_full_path"),       // Supabase Storage — bucket prive
  filePreviewPath: text("file_preview_path"), // Supabase Storage — bucket public
  coverUrl: text("cover_url"),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const tracksRelations = relations(tracks, ({ one, many }) => ({
  artist: one(artists, {
    fields: [tracks.artistId],
    references: [artists.id],
  }),
  trackCategories: many(trackCategories),
}));

export type Track = typeof tracks.$inferSelect;
export type NewTrack = typeof tracks.$inferInsert;
