import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { db } from "@/db";
import { profiles, tracks, artists, trackCategories, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import { writeFileSync, readFileSync, unlinkSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

ffmpeg.setFfmpegPath(ffmpegPath as string);

const anthropic = new Anthropic();

// Generous timeout — bulk processing can take a while
export const maxDuration = 300; // seconds (5 min) — adjust per Vercel plan

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

function parseFilename(filename: string): { artist: string; title: string } | null {
  const clean = filename.replace(/\.mp3$/i, "").trim();
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
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const [profile] = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (profile?.role !== "admin") return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });

  const { items } = (await req.json()) as { items: FinalizeItem[] };
  if (!Array.isArray(items) || items.length === 0) {
    return new Response(JSON.stringify({ error: "No items" }), { status: 400 });
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
            // Download MP3 from audio-full (already uploaded by client)
            const { data: mp3Blob, error: dlErr } = await supabaseAdmin.storage
              .from("audio-full")
              .download(item.path);

            if (dlErr || !mp3Blob) {
              results.push({ filename: item.filename, status: "error", error: `MP3 introuvable: ${dlErr?.message ?? "unknown"}` });
              send({ type: "file-done", index: i, filename: item.filename, status: "error", error: "MP3 introuvable" });
              continue;
            }

            const buffer = Buffer.from(await mp3Blob.arrayBuffer());

            // Upload preview (same MP3 to preview bucket — true preview clip is a future improvement)
            const { error: prevErr } = await supabaseAdmin.storage
              .from("audio-previews")
              .upload(item.path, buffer, { contentType: "audio/mpeg", upsert: true });

            const previewUrl = !prevErr
              ? supabaseAdmin.storage.from("audio-previews").getPublicUrl(item.path).data.publicUrl
              : null;

            // Convert to WAV (best-effort)
            try {
              const wavBuffer = await convertMp3ToWav(buffer, item.slug);
              if (wavBuffer) {
                const wavFileName = `${item.slug}.wav`;
                await supabaseAdmin.storage
                  .from("audio-full")
                  .upload(wavFileName, wavBuffer, { contentType: "audio/wav", upsert: true });
              }
            } catch (err) {
              console.error("[bulk-upload] WAV upload error:", err);
            }

            // Insert track row
            const [newTrack] = await db
              .insert(tracks)
              .values({
                slug: item.slug,
                title: parsed.title,
                artistId,
                fileFullPath: item.path,
                filePreviewPath: previewUrl,
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
