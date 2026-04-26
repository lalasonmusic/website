import { db } from "@/db";
import { playlists, playlistTracks, tracks, artists } from "@/db/schema";
import { and, eq, asc, sql } from "drizzle-orm";

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
    tracks: trackRows,
  };
}
