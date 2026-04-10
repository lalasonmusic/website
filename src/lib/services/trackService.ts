import { db } from "@/db";
import { tracks, artists, trackCategories, categories } from "@/db/schema";
import { eq, and, inArray, desc, sql } from "drizzle-orm";
import type { TrackWithDetails, TrackCategory } from "@/types/track";

const PREVIEW_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/audio-previews`;
const COVERS_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/covers`;

function buildPreviewUrl(path: string | null) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${PREVIEW_BASE}/${path}`;
}

function buildCoverUrl(path: string | null) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${COVERS_BASE}/${path}`;
}

type GetTracksParams = {
  page?: number;
  limit?: number;
  style?: string;
  theme?: string;
  mood?: string;
  search?: string;
  sort?: string;
};

async function enrichWithCategories(
  trackRows: Omit<TrackWithDetails, "categories">[]
): Promise<TrackWithDetails[]> {
  if (trackRows.length === 0) return [];

  const ids = trackRows.map((t) => t.id);
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

  return trackRows.map((t) => ({ ...t, categories: byTrackId[t.id] ?? [] }));
}

export const trackService = {
  async getPublished({ page = 1, limit = 20, style, theme, mood, search, sort }: GetTracksParams = {}): Promise<{
    tracks: TrackWithDetails[];
    total: number;
  }> {
    const offset = (page - 1) * limit;

    // Build category slug filters for subquery
    const activeFilters = [style, theme, mood].filter(Boolean) as string[];

    // Base condition: isPublished
    // If category filters: track must have ALL of them
    let baseQuery = db
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
        createdAt: tracks.createdAt,
      })
      .from(tracks)
      .innerJoin(artists, eq(artists.id, tracks.artistId))
      .where(eq(tracks.isPublished, true))
      .$dynamic();

    if (search) {
      baseQuery = baseQuery.where(
        and(
          eq(tracks.isPublished, true),
          sql`(${tracks.title} ILIKE ${"%" + search + "%"} OR ${artists.name} ILIKE ${"%" + search + "%"})`
        )
      );
    }

    if (activeFilters.length > 0) {
      for (const slug of activeFilters) {
        const subq = db
          .select({ id: trackCategories.trackId })
          .from(trackCategories)
          .innerJoin(categories, eq(categories.id, trackCategories.categoryId))
          .where(eq(categories.slug, slug));
        baseQuery = baseQuery.where(inArray(tracks.id, subq));
      }
    }

    // Default order: newest first. The `sort` param is no longer needed but kept for callsite compat.
    void sort;
    const [rows, countRows] = await Promise.all([
      baseQuery.orderBy(desc(tracks.createdAt)).limit(limit).offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(tracks)
        .where(eq(tracks.isPublished, true)),
    ]);

    const mapped = rows.map((r) => ({
      ...r,
      coverUrl: buildCoverUrl(r.coverUrl),
      previewPath: buildPreviewUrl(r.previewPath),
      createdAt: r.createdAt ? r.createdAt.toISOString() : null,
    }));

    const enriched = await enrichWithCategories(mapped);

    return {
      tracks: enriched,
      total: Number(countRows[0]?.count ?? 0),
    };
  },

  async getBySlug(slug: string): Promise<TrackWithDetails | null> {
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
        createdAt: tracks.createdAt,
      })
      .from(tracks)
      .innerJoin(artists, eq(artists.id, tracks.artistId))
      .where(and(eq(tracks.slug, slug), eq(tracks.isPublished, true)))
      .limit(1);

    if (!rows[0]) return null;

    const row = {
      ...rows[0],
      coverUrl: buildCoverUrl(rows[0].coverUrl),
      previewPath: buildPreviewUrl(rows[0].previewPath),
      createdAt: rows[0].createdAt ? rows[0].createdAt.toISOString() : null,
    };

    const [enriched] = await enrichWithCategories([row]);
    return enriched ?? null;
  },

  async getAllCategories() {
    return db.select().from(categories).orderBy(categories.type, categories.labelFr);
  },
};
