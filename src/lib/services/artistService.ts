import { db } from "@/db";
import { artists, tracks } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const artistService = {
  async getAll() {
    return db.select().from(artists).orderBy(artists.name);
  },

  async getBySlug(slug: string) {
    const [artist] = await db
      .select()
      .from(artists)
      .where(eq(artists.slug, slug))
      .limit(1);
    return artist ?? null;
  },

  async getPublishedTracks(artistId: string) {
    return db
      .select({
        id: tracks.id,
        slug: tracks.slug,
        title: tracks.title,
        durationSeconds: tracks.durationSeconds,
        bpm: tracks.bpm,
      })
      .from(tracks)
      .where(and(eq(tracks.artistId, artistId), eq(tracks.isPublished, true)))
      .orderBy(tracks.title);
  },
};
