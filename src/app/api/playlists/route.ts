import { NextResponse } from "next/server";
import { db } from "@/db";
import { playlists, playlistTracks, tracks, artists } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  // Fetch all published playlists with their tracks
  const allPlaylists = await db
    .select()
    .from(playlists)
    .where(eq(playlists.isPublished, true))
    .orderBy(asc(playlists.displayOrder));

  // For each playlist, fetch tracks
  const result = await Promise.all(
    allPlaylists.map(async (playlist) => {
      const playlistTrackRows = await db
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
        trackCount: playlistTrackRows.length,
        tracks: playlistTrackRows.map((t) => ({
          id: t.id,
          slug: t.slug,
          title: t.title,
          artistName: t.artistName,
          durationSeconds: t.durationSeconds,
          coverUrl: t.coverUrl,
          previewPath: t.previewPath,
          fullPath: t.fullPath,
        })),
      };
    })
  );

  return NextResponse.json({ playlists: result });
}
