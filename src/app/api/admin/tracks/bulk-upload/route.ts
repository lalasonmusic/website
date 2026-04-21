import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { db } from "@/db";
import { profiles, tracks, artists, trackCategories, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import ffmpegPath from "ffmpeg-static";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";
import ffmpeg from "fluent-ffmpeg";
import { writeFileSync, readFileSync, unlinkSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

ffmpeg.setFfmpegPath(ffmpegPath as string);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const anthropic = new Anthropic();

// Generous timeout — bulk processing can take a while
export const maxDuration = 300; // seconds (5 min) — adjust per Vercel plan

// Probe the duration of an audio buffer in seconds (rounded). Returns null on failure.
async function probeDurationSeconds(buffer: Buffer, slug: string, ext: "mp3" | "wav"): Promise<number | null> {
  const tmpDir = join(tmpdir(), "lalason-probe");
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });
  const tmpFile = join(tmpDir, `${slug}-${Date.now()}-probe.${ext}`);
  try {
    writeFileSync(tmpFile, buffer);
    const duration = await new Promise<number>((resolve, reject) => {
      ffmpeg.ffprobe(tmpFile, (err, data) => {
        if (err) return reject(err);
        const d = data.format?.duration;
        if (typeof d !== "number") return reject(new Error("No duration in ffprobe output"));
        resolve(Math.round(d));
      });
    });
    return duration;
  } catch (err) {
    console.error("[bulk-upload] probeDuration error:", err);
    return null;
  } finally {
    try { unlinkSync(tmpFile); } catch {}
  }
}

async function convertMp3ToWav(mp3Buffer: Buffer, slug: string): Promise<Buffer | null> {
  const tmpDir = join(tmpdir(), "lalason-bulk");
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

  const tmpMp3 = join(tmpDir, `${slug}-${Date.now()}.mp3`);
  const tmpWav = join(tmpDir, `${slug}-${Date.now()}.wav`);

  try {
    writeFileSync(tmpMp3, mp3Buffer);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(tmpMp3)
        .toFormat("wav")
        .audioCodec("pcm_s16le")
        .audioFrequency(44100)
        .audioChannels(2)
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err))
        .save(tmpWav);
    });

    return readFileSync(tmpWav);
  } catch (err) {
    console.error("[bulk-upload] WAV convert error:", err);
    return null;
  } finally {
    try { unlinkSync(tmpMp3); } catch {}
    try { unlinkSync(tmpWav); } catch {}
  }
}

async function convertWavToMp3(wavBuffer: Buffer, slug: string): Promise<Buffer | null> {
  const tmpDir = join(tmpdir(), "lalason-bulk");
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

  const tmpWav = join(tmpDir, `${slug}-${Date.now()}.wav`);
  const tmpMp3 = join(tmpDir, `${slug}-${Date.now()}.mp3`);

  try {
    writeFileSync(tmpWav, wavBuffer);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(tmpWav)
        .toFormat("mp3")
        .audioCodec("libmp3lame")
        .audioBitrate("320k")
        .audioFrequency(44100)
        .audioChannels(2)
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err))
        .save(tmpMp3);
    });

    return readFileSync(tmpMp3);
  } catch (err) {
    console.error("[bulk-upload] MP3 convert error:", err);
    return null;
  } finally {
    try { unlinkSync(tmpWav); } catch {}
    try { unlinkSync(tmpMp3); } catch {}
  }
}

function parseFilename(filename: string): { artist: string; title: string } | null {
  const clean = filename.replace(/\.(mp3|wav)$/i, "").trim();
  const sep = clean.indexOf(" - ");
  if (sep === -1) return null;
  return {
    artist: clean.substring(0, sep).trim(),
    title: clean.substring(sep + 3).trim(),
  };
}

async function aiCategorize(
  tracksToTag: { title: string; artist: string }[],
  allCategories: { id: string; slug: string; labelFr: string; type: string }[]
): Promise<Map<number, string[]>> {
  const catList = allCategories
    .map((c) => `${c.slug} (${c.type}: ${c.labelFr})`)
    .join("\n");

  const trackList = tracksToTag
    .map((t, i) => `${i + 1}. "${t.title}" by ${t.artist}`)
    .join("\n");

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `You are a music categorization expert. For each track, pick the most relevant categories (1-2 per type: STYLE, THEME, MOOD). Return ONLY a JSON object mapping track number to array of category slugs.

Available categories:
${catList}

Tracks to categorize:
${trackList}

Return JSON like: {"1": ["slug1", "slug2"], "2": ["slug3", "slug4"]}
Only use slugs from the list above. Pick 3-5 categories per track.`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return new Map();

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, string[]>;
    const result = new Map<number, string[]>();
    for (const [key, slugs] of Object.entries(parsed)) {
      result.set(parseInt(key) - 1, slugs);
    }
    return result;
  } catch {
    return new Map();
  }
}

type FinalizeItem = { filename: string; slug: string; path: string };

export async function POST(req: NextRequest) {
  let items: FinalizeItem[];
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const [profile] = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, user.id)).limit(1);
    if (profile?.role !== "admin") return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });

    const body = (await req.json()) as { items: FinalizeItem[] };
    items = body.items;
    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "No items" }), { status: 400 });
    }
  } catch (err) {
    console.error("[bulk-upload] init error:", err);
    return new Response(
      JSON.stringify({ error: "Init failed", detail: err instanceof Error ? err.message : String(err) }),
      { status: 500 },
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      try {
        const [allArtists, allCategories] = await Promise.all([
          db.select({ id: artists.id, name: artists.name }).from(artists),
          db.select({ id: categories.id, slug: categories.slug, labelFr: categories.labelFr, type: categories.type }).from(categories),
        ]);

        const artistMap = new Map(allArtists.map((a) => [a.name.toLowerCase(), a.id]));
        const catSlugMap = new Map(allCategories.map((c) => [c.slug, c.id]));

        const results: { filename: string; status: string; error?: string }[] = [];
        const tracksForAi: { index: number; title: string; artist: string }[] = [];
        const createdTrackIds: { index: number; trackId: string }[] = [];

        send({ type: "start", total: items.length });

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          send({ type: "file-start", index: i, filename: item.filename });

          const parsed = parseFilename(item.filename);
          if (!parsed) {
            results.push({ filename: item.filename, status: "error", error: "Format invalide" });
            send({ type: "file-done", index: i, filename: item.filename, status: "error", error: "Format invalide" });
            continue;
          }

          // Find or create artist
          let artistId = artistMap.get(parsed.artist.toLowerCase());
          if (!artistId) {
            const artistSlug = parsed.artist
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "");

            const [newArtist] = await db
              .insert(artists)
              .values({ name: parsed.artist, slug: artistSlug })
              .onConflictDoNothing()
              .returning({ id: artists.id });

            if (newArtist) {
              artistId = newArtist.id;
              artistMap.set(parsed.artist.toLowerCase(), artistId);
            } else {
              const [existing] = await db.select({ id: artists.id }).from(artists).where(eq(artists.slug, artistSlug)).limit(1);
              artistId = existing?.id;
            }
          }

          if (!artistId) {
            results.push({ filename: item.filename, status: "error", error: "Artiste non trouvé" });
            send({ type: "file-done", index: i, filename: item.filename, status: "error", error: "Artiste non trouvé" });
            continue;
          }

          try {
            // Detect source format from uploaded path (.mp3 or .wav)
            const sourceExt: "mp3" | "wav" = item.path.toLowerCase().endsWith(".wav") ? "wav" : "mp3";
            const mp3Path = `${item.slug}.mp3`;
            const wavPath = `${item.slug}.wav`;

            // Download the source file (whatever the admin uploaded)
            const { data: sourceBlob, error: dlErr } = await supabaseAdmin.storage
              .from("audio-full")
              .download(item.path);

            if (dlErr || !sourceBlob) {
              results.push({ filename: item.filename, status: "error", error: `Fichier introuvable: ${dlErr?.message ?? "unknown"}` });
              send({ type: "file-done", index: i, filename: item.filename, status: "error", error: "Fichier introuvable" });
              continue;
            }

            const sourceBuffer = Buffer.from(await sourceBlob.arrayBuffer());

            // Probe duration from the source — failures are non-fatal
            const durationSeconds = await probeDurationSeconds(sourceBuffer, item.slug, sourceExt);

            // Ensure both MP3 and WAV are stored in audio-full
            let mp3Buffer: Buffer;
            if (sourceExt === "mp3") {
              mp3Buffer = sourceBuffer;
              // Convert MP3 → WAV (best-effort) and upload WAV
              try {
                const wavBuffer = await convertMp3ToWav(mp3Buffer, item.slug);
                if (wavBuffer) {
                  await supabaseAdmin.storage
                    .from("audio-full")
                    .upload(wavPath, wavBuffer, { contentType: "audio/wav", upsert: true });
                }
              } catch (err) {
                console.error("[bulk-upload] WAV upload error:", err);
              }
            } else {
              // WAV source → convert to MP3 and upload MP3 as canonical
              const converted = await convertWavToMp3(sourceBuffer, item.slug);
              if (!converted) {
                results.push({ filename: item.filename, status: "error", error: "Conversion WAV→MP3 échouée" });
                send({ type: "file-done", index: i, filename: item.filename, status: "error", error: "Conversion WAV→MP3 échouée" });
                continue;
              }
              mp3Buffer = converted;
              const { error: mp3UploadErr } = await supabaseAdmin.storage
                .from("audio-full")
                .upload(mp3Path, mp3Buffer, { contentType: "audio/mpeg", upsert: true });
              if (mp3UploadErr) {
                results.push({ filename: item.filename, status: "error", error: `MP3 upload: ${mp3UploadErr.message}` });
                send({ type: "file-done", index: i, filename: item.filename, status: "error", error: "MP3 upload failed" });
                continue;
              }
            }

            // Upload preview (MP3) to preview bucket — canonical MP3 filename
            const { error: prevErr } = await supabaseAdmin.storage
              .from("audio-previews")
              .upload(mp3Path, mp3Buffer, { contentType: "audio/mpeg", upsert: true });

            const previewPathForDb = !prevErr ? mp3Path : null;

            // Insert track row — fileFullPath is always canonical MP3
            const [newTrack] = await db
              .insert(tracks)
              .values({
                slug: item.slug,
                title: parsed.title,
                artistId,
                fileFullPath: mp3Path,
                filePreviewPath: previewPathForDb,
                durationSeconds,
                isPublished: true,
              })
              .onConflictDoNothing()
              .returning({ id: tracks.id });

            if (newTrack) {
              tracksForAi.push({ index: i, title: parsed.title, artist: parsed.artist });
              createdTrackIds.push({ index: i, trackId: newTrack.id });
              results.push({ filename: item.filename, status: "ok" });
              send({ type: "file-done", index: i, filename: item.filename, status: "ok" });
            } else {
              results.push({ filename: item.filename, status: "skipped", error: "Morceau déjà existant" });
              send({ type: "file-done", index: i, filename: item.filename, status: "skipped", error: "Morceau déjà existant" });
            }
          } catch (err) {
            results.push({ filename: item.filename, status: "error", error: String(err) });
            send({ type: "file-done", index: i, filename: item.filename, status: "error", error: String(err) });
          }
        }

        // AI categorization for all new tracks
        if (tracksForAi.length > 0) {
          send({ type: "ai-start", count: tracksForAi.length });
          try {
            const aiResults = await aiCategorize(tracksForAi, allCategories);

            for (const [aiIndex, slugs] of aiResults) {
              const trackEntry = createdTrackIds.find((t) => t.index === tracksForAi[aiIndex]?.index);
              if (!trackEntry) continue;

              const catIds = slugs
                .map((s) => catSlugMap.get(s))
                .filter((id): id is string => !!id);

              if (catIds.length > 0) {
                await db.insert(trackCategories).values(
                  catIds.map((catId) => ({
                    trackId: trackEntry.trackId,
                    categoryId: catId,
                  }))
                ).onConflictDoNothing();
              }
            }
            send({ type: "ai-done" });
          } catch (err) {
            console.error("[bulk-upload] AI categorization failed:", err);
            send({ type: "ai-done", error: String(err) });
          }
        }

        const okCount = results.filter((r) => r.status === "ok").length;
        const errorCount = results.filter((r) => r.status === "error").length;
        const skippedCount = results.filter((r) => r.status === "skipped").length;

        send({
          type: "complete",
          summary: { total: items.length, ok: okCount, errors: errorCount, skipped: skippedCount },
          results,
        });
      } catch (err) {
        send({ type: "fatal", error: String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
