import { db } from "@/db";
import { playlists, playlistTracks, tracks, artists } from "@/db/schema";
import { and, eq, asc, sql } from "drizzle-orm";

// Track filePreviewPath / coverUrl can be stored as either a bare filename
// (from bulk-upload) OR a full URL (from the admin create endpoint). Normalise
// here so consumers always get a playable URL. Mirrors the helper in
// src/lib/services/trackService.ts.
const PREVIEW_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/audio-previews`;
const COVERS_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/covers`;

function buildPreviewUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${PREVIEW_BASE}/${path}`;
}

function buildCoverUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${COVERS_BASE}/${path}`;
}

export type BoutiquePlaylistSummary = {
  id: string;
  slug: string;
  nameFr: string;
  nameEn: string;
  descriptionFr: string | null;
  descriptionEn: string | null;
  gradient: string;
  emoji: string | null;
  displayOrder: number;
  trackCount: number;
};

export type BoutiqueTrack = {
  id: string;
  slug: string;
  title: string;
  artistName: string;
  durationSeconds: number | null;
  coverUrl: string | null;
  previewPath: string | null;
  fullPath: string | null;
  position: number;
  isDemo: boolean;
};

export type BoutiquePlaylistDetail = BoutiquePlaylistSummary & {
  tracks: BoutiqueTrack[];
};

export async function getBoutiquePlaylists(): Promise<BoutiquePlaylistSummary[]> {
  const rows = await db
    .select({
      id: playlists.id,
      slug: playlists.slug,
      nameFr: playlists.nameFr,
      nameEn: playlists.nameEn,
      descriptionFr: playlists.descriptionFr,
      descriptionEn: playlists.descriptionEn,
      gradient: playlists.gradient,
      emoji: playlists.emoji,
      displayOrder: playlists.displayOrder,
      trackCount: sql<number>`COUNT(${playlistTracks.trackId})::int`,
    })
    .from(playlists)
    .leftJoin(playlistTracks, eq(playlists.id, playlistTracks.playlistId))
    .where(and(eq(playlists.audience, "boutique"), eq(playlists.isPublished, true)))
    .groupBy(playlists.id)
    .orderBy(asc(playlists.displayOrder));

  return rows;
}

export async function getBoutiquePlaylistBySlug(slug: string): Promise<BoutiquePlaylistDetail | null> {
  const [playlist] = await db
    .select()
    .from(playlists)
    .where(
      and(
        eq(playlists.slug, slug),
        eq(playlists.audience, "boutique"),
        eq(playlists.isPublished, true),
      ),
    )
    .limit(1);

  if (!playlist) return null;

  const trackRows = await db
    .select({
      id: tracks.id,
      slug: tracks.slug,
      title: tracks.title,
      artistName: artists.name,
      durationSeconds: tracks.durationSeconds,
      coverUrl: tracks.coverUrl,
      previewPath: tracks.filePreviewPath,
      fullPath: tracks.fileFullPath,
      position: playlistTracks.position,
      isDemo: playlistTracks.isDemo,
    })
    .from(playlistTracks)
    .innerJoin(tracks, eq(playlistTracks.trackId, tracks.id))
    .innerJoin(artists, eq(tracks.artistId, artists.id))
    .where(eq(playlistTracks.playlistId, playlist.id))
    .orderBy(asc(playlistTracks.position));

  // Hybrid demo logic: if at least one track has is_demo=true (admin-curated),
  // honour that. Otherwise fall back to "first track of the playlist is the
  // demo" so a freshly created playlist works out of the box without admin
  // having to explicitly mark a demo track.
  const hasExplicitDemo = trackRows.some((t) => t.isDemo);

  return {
    id: playlist.id,
    slug: playlist.slug,
    nameFr: playlist.nameFr,
    nameEn: playlist.nameEn,
    descriptionFr: playlist.descriptionFr,
    descriptionEn: playlist.descriptionEn,
    gradient: playlist.gradient,
    emoji: playlist.emoji,
    displayOrder: playlist.displayOrder,
    trackCount: trackRows.length,
    tracks: trackRows.map((t, i) => ({
      ...t,
      isDemo: hasExplicitDemo ? t.isDemo : i === 0,
      previewPath: buildPreviewUrl(t.previewPath),
      coverUrl: buildCoverUrl(t.coverUrl),
    })),
  };
}
