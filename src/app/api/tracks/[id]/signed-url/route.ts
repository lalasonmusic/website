import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { db } from "@/db";
import { tracks, subscriptions, downloads, playlists, playlistTracks } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const SIGNED_URL_EXPIRY = 3600; // 1h

/**
 * Determines whether a track is a "public boutique demo" — i.e. should be
 * streamable in full to anonymous visitors on the Musique d'ambiance pages.
 *
 * Mirrors the hybrid logic in src/lib/playlists/queries.ts: a track is a demo
 * if it's explicitly marked as is_demo on a published boutique playlist, OR
 * if it's at position 0 of such a playlist that has NO explicit demo set.
 */
async function isPublicBoutiqueDemo(trackId: string): Promise<boolean> {
  const memberships = await db
    .select({
      playlistId: playlistTracks.playlistId,
      position: playlistTracks.position,
      isDemo: playlistTracks.isDemo,
    })
    .from(playlistTracks)
    .innerJoin(playlists, eq(playlists.id, playlistTracks.playlistId))
    .where(
      and(
        eq(playlistTracks.trackId, trackId),
        eq(playlists.audience, "boutique"),
        eq(playlists.isPublished, true),
      ),
    );

  if (memberships.length === 0) return false;
  if (memberships.some((m) => m.isDemo)) return true;

  // Fallback: track is at position 0 of a playlist that has no explicit demo
  for (const m of memberships) {
    if (m.position !== 0) continue;
    const allInPlaylist = await db
      .select({ isDemo: playlistTracks.isDemo })
      .from(playlistTracks)
      .where(eq(playlistTracks.playlistId, m.playlistId));
    if (!allInPlaylist.some((row) => row.isDemo)) return true;
  }

  return false;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const formatParam = req.nextUrl.searchParams.get("format");
  // If format is present in query, caller is downloading a file.
  // If absent, caller is streaming via the player — do NOT log a download.
  const isDownload = formatParam !== null;
  const format = formatParam === "wav" ? "wav" : "mp3";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Resolve subscription status (only relevant for authed users)
  let hasSubscription = false;
  if (user) {
    const [sub] = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, "active")))
      .limit(1);
    hasSubscription = !!sub;
  }

  // If the caller can't claim a subscription, the only way to get a signed
  // URL is for the track to be a public boutique demo (streaming-only, no
  // download logging). Block downloads in that case.
  let isBoutiqueDemoFallback = false;
  if (!hasSubscription) {
    if (isDownload) {
      return NextResponse.json({ error: "Subscription required" }, { status: 403 });
    }
    isBoutiqueDemoFallback = await isPublicBoutiqueDemo(id);
    if (!isBoutiqueDemoFallback) {
      return NextResponse.json(
        { error: user ? "Subscription required" : "Unauthorized" },
        { status: user ? 403 : 401 },
      );
    }
  }

  // Get the track's full file path
  const [track] = await db
    .select({ fileFullPath: tracks.fileFullPath })
    .from(tracks)
    .where(and(eq(tracks.id, id), eq(tracks.isPublished, true)))
    .limit(1);

  if (!track?.fileFullPath) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  // WAV downloads are now generated on-demand to keep storage usage low.
  // Hand the client a URL to the streaming transcode endpoint instead of
  // a Supabase signed URL — the client `await fetch(url)` flow works the
  // same way (relative URL → same origin → blob download).
  if (format === "wav") {
    // Download is logged inside /api/tracks/[id]/wav itself, no need here.
    return NextResponse.json({ url: `/api/tracks/${id}/wav`, format: "wav" });
  }

  const { data, error } = await supabaseAdmin.storage
    .from("audio-full")
    .createSignedUrl(track.fileFullPath, SIGNED_URL_EXPIRY);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Could not generate URL" }, { status: 500 });
  }

  // Log download only when caller is actually downloading (format param present).
  // `user` is always non-null here because the early-return above blocks anonymous
  // callers from passing a `format` query param.
  if (isDownload && user) {
    try {
      await db.insert(downloads).values({ userId: user.id, trackId: id });
    } catch {}
  }

  return NextResponse.json({ url: data.signedUrl, format });
}
