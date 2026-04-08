import { notFound } from "next/navigation";
import { db } from "@/db";
import { playlists, playlistTracks, tracks, artists } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import PlaylistEditor from "@/components/admin/PlaylistEditor";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditPlaylistPage({ params }: Props) {
  const { id } = await params;

  const [playlist] = await db.select().from(playlists).where(eq(playlists.id, id)).limit(1);
  if (!playlist) notFound();

  const playlistTrackRows = await db
    .select({
      id: tracks.id,
      title: tracks.title,
      artistName: artists.name,
    })
    .from(playlistTracks)
    .innerJoin(tracks, eq(playlistTracks.trackId, tracks.id))
    .innerJoin(artists, eq(tracks.artistId, artists.id))
    .where(eq(playlistTracks.playlistId, id))
    .orderBy(asc(playlistTracks.position));

  const allTracks = await db
    .select({
      id: tracks.id,
      title: tracks.title,
      artistName: artists.name,
    })
    .from(tracks)
    .innerJoin(artists, eq(tracks.artistId, artists.id))
    .where(eq(tracks.isPublished, true))
    .orderBy(asc(tracks.title));

  return (
    <PlaylistEditor
      playlist={playlist}
      playlistTracks={playlistTrackRows}
      allTracks={allTracks}
    />
  );
}
