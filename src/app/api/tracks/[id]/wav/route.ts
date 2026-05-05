import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { db } from "@/db";
import { tracks, subscriptions, downloads } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { convertMp3ToWav } from "@/lib/audio/transcode";

// WAV transcoding can take ~5-15s for a 3-min track on a cold lambda.
export const maxDuration = 60;

/**
 * On-demand WAV download for active subscribers.
 *
 * Storage strategy: instead of pre-storing a WAV next to every MP3 (which
 * was using ~7.5 GB of Supabase storage for ~333 tracks), we transcode the
 * MP3 to WAV at request time. The result has the same audible quality as
 * the source MP3 (re-encoding lossy → lossless can't recover detail), but
 * stays the standard interchange format expected by some pro audio tools.
 *
 * Auth: same gating as /signed-url?format=wav — active subscription only.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [sub] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, "active")))
    .limit(1);
  if (!sub) {
    return NextResponse.json({ error: "Subscription required" }, { status: 403 });
  }

  // Locate the source MP3
  const [track] = await db
    .select({
      slug: tracks.slug,
      title: tracks.title,
      fileFullPath: tracks.fileFullPath,
    })
    .from(tracks)
    .where(and(eq(tracks.id, id), eq(tracks.isPublished, true)))
    .limit(1);
  if (!track?.fileFullPath) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  // Download MP3 from private bucket
  const { data: mp3Blob, error: dlErr } = await supabaseAdmin.storage
    .from("audio-full")
    .download(track.fileFullPath);
  if (dlErr || !mp3Blob) {
    console.error("[wav] download mp3 error:", dlErr);
    return NextResponse.json({ error: "Source unavailable" }, { status: 500 });
  }

  const mp3Buffer = Buffer.from(await mp3Blob.arrayBuffer());
  const wavBuffer = await convertMp3ToWav(mp3Buffer, track.slug);
  if (!wavBuffer) {
    return NextResponse.json({ error: "Transcoding failed" }, { status: 500 });
  }

  // Log the download (mirrors signed-url contract for format-set callers)
  try {
    await db.insert(downloads).values({ userId: user.id, trackId: id });
  } catch {}

  return new Response(new Uint8Array(wavBuffer), {
    headers: {
      "Content-Type": "audio/wav",
      "Content-Length": String(wavBuffer.length),
      "Content-Disposition": `attachment; filename="${track.slug}.wav"`,
      "Cache-Control": "private, no-store",
    },
  });
}
