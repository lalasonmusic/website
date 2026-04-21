import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { db } from "@/db";
import { profiles, tracks, artists, trackCategories } from "@/db/schema";
import { eq } from "drizzle-orm";
import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import { writeFileSync, readFileSync, unlinkSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

ffmpeg.setFfmpegPath(ffmpegPath as string);

async function convertBuffer(
  inputBuffer: Buffer,
  slug: string,
  from: "mp3" | "wav",
  to: "mp3" | "wav",
): Promise<Buffer | null> {
  const tmpDir = join(tmpdir(), "lalason-create");
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });
  const tmpIn = join(tmpDir, `${slug}-${Date.now()}.${from}`);
  const tmpOut = join(tmpDir, `${slug}-${Date.now()}.${to}`);
  try {
    writeFileSync(tmpIn, inputBuffer);
    await new Promise<void>((resolve, reject) => {
      const cmd = ffmpeg(tmpIn).toFormat(to).audioFrequency(44100).audioChannels(2);
      if (to === "wav") {
        cmd.audioCodec("pcm_s16le");
      } else {
        cmd.audioCodec("libmp3lame").audioBitrate("320k");
      }
      cmd
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err))
        .save(tmpOut);
    });
    return readFileSync(tmpOut);
  } catch (err) {
    console.error(`[create] convert ${from}->${to} error:`, err);
    return null;
  } finally {
    try { unlinkSync(tmpIn); } catch {}
    try { unlinkSync(tmpOut); } catch {}
  }
}

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

  // Upload audio file — accept MP3 or WAV, always store both
  if (audioFile) {
    const inputName = audioFile.name.toLowerCase();
    const sourceExt: "mp3" | "wav" = inputName.endsWith(".wav") ? "wav" : "mp3";

    const mp3FileName = `${slug}.mp3`;
    const wavFileName = `${slug}.wav`;

    const sourceBuffer = Buffer.from(await audioFile.arrayBuffer());

    let mp3Buffer: Buffer;
    let wavBuffer: Buffer | null;

    if (sourceExt === "mp3") {
      mp3Buffer = sourceBuffer;
      wavBuffer = await convertBuffer(mp3Buffer, slug, "mp3", "wav");
    } else {
      const converted = await convertBuffer(sourceBuffer, slug, "wav", "mp3");
      if (!converted) {
        return NextResponse.json({ error: "Conversion WAV→MP3 échouée" }, { status: 500 });
      }
      mp3Buffer = converted;
      wavBuffer = sourceBuffer;
    }

    // Upload MP3 (canonical)
    const { error: mp3Err } = await supabaseAdmin.storage
      .from("audio-full")
      .upload(mp3FileName, mp3Buffer, { contentType: "audio/mpeg", upsert: true });
    if (mp3Err) {
      return NextResponse.json({ error: `Upload MP3 failed: ${mp3Err.message}` }, { status: 500 });
    }
    fileFullPath = mp3FileName;

    // Upload WAV (best-effort)
    if (wavBuffer) {
      await supabaseAdmin.storage
        .from("audio-full")
        .upload(wavFileName, wavBuffer, { contentType: "audio/wav", upsert: true });
    }

    // Upload preview (public bucket) — MP3
    const { error: prevErr } = await supabaseAdmin.storage
      .from("audio-previews")
      .upload(mp3FileName, mp3Buffer, { contentType: "audio/mpeg", upsert: true });

    if (!prevErr) {
      const { data: pubUrl } = supabaseAdmin.storage.from("audio-previews").getPublicUrl(mp3FileName);
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
