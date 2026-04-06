import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { tracks, subscriptions, downloads } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const SIGNED_URL_EXPIRY = 3600; // 1h

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const format = req.nextUrl.searchParams.get("format") === "wav" ? "wav" : "mp3";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify active subscription
  const [sub] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, "active")))
    .limit(1);

  if (!sub) {
    return NextResponse.json({ error: "Subscription required" }, { status: 403 });
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

  // Derive WAV path from MP3 path (same filename, different extension)
  const filePath = format === "wav"
    ? track.fileFullPath.replace(/\.mp3$/i, ".wav")
    : track.fileFullPath;

  const { data, error } = await supabase.storage
    .from("audio-full")
    .createSignedUrl(filePath, SIGNED_URL_EXPIRY);

  if (error || !data?.signedUrl) {
    // If WAV not found, fall back to MP3
    if (format === "wav") {
      const fallback = await supabase.storage
        .from("audio-full")
        .createSignedUrl(track.fileFullPath, SIGNED_URL_EXPIRY);

      if (fallback.data?.signedUrl) {
        try {
          await db.insert(downloads).values({ userId: user.id, trackId: id });
        } catch {}
        return NextResponse.json({ url: fallback.data.signedUrl, format: "mp3" });
      }
    }
    return NextResponse.json({ error: "Could not generate URL" }, { status: 500 });
  }

  // Log download
  try {
    await db.insert(downloads).values({ userId: user.id, trackId: id });
  } catch {}

  return NextResponse.json({ url: data.signedUrl, format });
}
