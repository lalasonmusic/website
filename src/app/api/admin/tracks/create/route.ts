import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { db } from "@/db";
import { profiles, tracks, artists, trackCategories } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile] = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const title = formData.get("title") as string;
  const artistId = formData.get("artistId") as string;
  const bpm = formData.get("bpm") ? parseInt(formData.get("bpm") as string) : null;
  const categoryIds = formData.getAll("categoryIds") as string[];
  const audioFile = formData.get("audio") as File | null;

  if (!title || !artistId) {
    return NextResponse.json({ error: "Title and artist required" }, { status: 400 });
  }

  // Get artist name for file path
  const [artist] = await db.select({ name: artists.name }).from(artists).where(eq(artists.id, artistId)).limit(1);
  if (!artist) return NextResponse.json({ error: "Artist not found" }, { status: 404 });

  // Generate slug
  const slug = `${artist.name}-${title}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  let fileFullPath: string | null = null;
  let filePreviewPath: string | null = null;
  const durationSeconds: number | null = null;

  // Upload audio file
  if (audioFile) {
    const fileName = `${slug}.mp3`;

    // Upload to audio-full (private bucket)
    const fullBuffer = Buffer.from(await audioFile.arrayBuffer());
    const { error: fullErr } = await supabaseAdmin.storage
      .from("audio-full")
      .upload(fileName, fullBuffer, { contentType: "audio/mpeg", upsert: true });

    if (fullErr) {
      return NextResponse.json({ error: `Upload failed: ${fullErr.message}` }, { status: 500 });
    }
    fileFullPath = fileName;

    // Also upload to audio-previews (public bucket) — same file for now
    const { error: prevErr } = await supabaseAdmin.storage
      .from("audio-previews")
      .upload(fileName, fullBuffer, { contentType: "audio/mpeg", upsert: true });

    if (!prevErr) {
      const { data: pubUrl } = supabaseAdmin.storage.from("audio-previews").getPublicUrl(fileName);
      filePreviewPath = pubUrl.publicUrl;
    }
  }

  // Insert track
  const [newTrack] = await db
    .insert(tracks)
    .values({
      slug,
      title,
      artistId,
      bpm,
      durationSeconds,
      fileFullPath,
      filePreviewPath,
      isPublished: false,
    })
    .returning({ id: tracks.id });

  // Link categories
  if (categoryIds.length > 0 && newTrack) {
    await db.insert(trackCategories).values(
      categoryIds.map((catId) => ({
        trackId: newTrack.id,
        categoryId: catId,
      }))
    );
  }

  return NextResponse.json({ success: true, trackId: newTrack.id });
}
