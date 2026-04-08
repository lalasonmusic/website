import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { db } from "@/db";
import { profiles, tracks } from "@/db/schema";
import { eq } from "drizzle-orm";

const SIGNED_URL_EXPIRY = 3600;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [track] = await db
    .select({ fileFullPath: tracks.fileFullPath, filePreviewPath: tracks.filePreviewPath })
    .from(tracks)
    .where(eq(tracks.id, id))
    .limit(1);

  if (!track) return NextResponse.json({ error: "Track not found" }, { status: 404 });

  // Prefer the full version (admin needs to listen to whole track)
  if (track.fileFullPath) {
    const { data, error } = await supabaseAdmin.storage
      .from("audio-full")
      .createSignedUrl(track.fileFullPath, SIGNED_URL_EXPIRY);

    if (data?.signedUrl) {
      return NextResponse.json({ url: data.signedUrl });
    }
    if (error) console.error("[admin/audio-url]", error.message);
  }

  // Fallback to preview (public URL)
  if (track.filePreviewPath) {
    return NextResponse.json({ url: track.filePreviewPath });
  }

  return NextResponse.json({ error: "No audio file" }, { status: 404 });
}
