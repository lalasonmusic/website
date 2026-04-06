import { db } from "@/db";
import { artists, tracks, trackCategories, categories } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import type { TrackWithDetails, TrackCategory } from "@/types/track";

const PREVIEW_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/audio-previews`;
const COVERS_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/covers`;

function buildPreviewUrl(path: string | null) {
  return path ? `${PREVIEW_BASE}/${path}` : null;
}

function buildCoverUrl(path: string | null) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${COVERS_BASE}/${path}`;
}

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

  async getPublishedTracks(artistId: string): Promise<TrackWithDetails[]> {
    const rows = await db
      .select({
        id: tracks.id,
        slug: tracks.slug,
        title: tracks.title,
        artistName: artists.name,
        durationSeconds: tracks.durationSeconds,
        bpm: tracks.bpm,
        coverUrl: tracks.coverUrl,
        previewPath: tracks.filePreviewPath,
        fullPath: tracks.fileFullPath,
      })
      .from(tracks)
      .innerJoin(artists, eq(artists.id, tracks.artistId))
      .where(and(eq(tracks.artistId, artistId), eq(tracks.isPublished, true)))
      .orderBy(tracks.title);

    if (rows.length === 0) return [];

    const mapped = rows.map((r) => ({
      ...r,
      coverUrl: buildCoverUrl(r.coverUrl),
      previewPath: buildPreviewUrl(r.previewPath),
    }));

    // Enrich with categories
    const ids = mapped.map((t) => t.id);
    const catRows = await db
      .select({
        trackId: trackCategories.trackId,
        slug: categories.slug,
        labelFr: categories.labelFr,
        labelEn: categories.labelEn,
        type: categories.type,
      })
      .from(trackCategories)
      .innerJoin(categories, eq(categories.id, trackCategories.categoryId))
      .where(inArray(trackCategories.trackId, ids));

    const byTrackId = catRows.reduce<Record<string, TrackCategory[]>>((acc, row) => {
      if (!acc[row.trackId]) acc[row.trackId] = [];
      acc[row.trackId].push({ slug: row.slug, labelFr: row.labelFr, labelEn: row.labelEn, type: row.type });
      return acc;
    }, {});

    return mapped.map((t) => ({ ...t, categories: byTrackId[t.id] ?? [] }));
  },
};
