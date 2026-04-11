/**
 * Backfill duration_seconds on tracks that are missing it.
 * Downloads each MP3 from Supabase Storage and probes its duration with ffprobe.
 *
 * Usage:
 *   npx tsx scripts/backfill-track-durations.ts         # dry run
 *   npx tsx scripts/backfill-track-durations.ts --apply # actually write
 */
import { loadEnvConfig } from "@next/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, or, isNull } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";
import { tracks, artists } from "../src/db/schema";
import ffmpegPath from "ffmpeg-static";
import ffprobePath from "@ffprobe-installer/ffprobe";
import ffmpeg from "fluent-ffmpeg";
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

loadEnvConfig(process.cwd());

ffmpeg.setFfmpegPath(ffmpegPath as unknown as string);
ffmpeg.setFfprobePath(ffprobePath.path);

const APPLY = process.argv.includes("--apply");

const pg = postgres(process.env.DATABASE_URL!);
const db = drizzle(pg);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function probeDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err);
      const duration = data.format?.duration;
      if (typeof duration !== "number") return reject(new Error("No duration in ffprobe output"));
      resolve(Math.round(duration));
    });
  });
}

(async () => {
  console.log(`\n${APPLY ? "APPLY mode — will write to DB." : "DRY RUN — no DB writes."}\n`);

  const rows = await db
    .select({
      id: tracks.id,
      title: tracks.title,
      artistName: artists.name,
      fileFullPath: tracks.fileFullPath,
    })
    .from(tracks)
    .innerJoin(artists, eq(tracks.artistId, artists.id))
    .where(
      and(
        eq(tracks.isPublished, true),
        or(isNull(tracks.durationSeconds), eq(tracks.durationSeconds, 0))
      )
    );

  console.log(`Found ${rows.length} tracks without duration.\n`);

  const tmpDir = join(tmpdir(), "lalason-backfill");
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

  let ok = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i++) {
    const track = rows[i];
    const progress = `[${i + 1}/${rows.length}]`;

    if (!track.fileFullPath) {
      console.log(`${progress} ⚠️  ${track.artistName} - ${track.title} — no fileFullPath, skipping`);
      failed++;
      continue;
    }

    const tmpPath = join(tmpDir, `${track.id}.mp3`);

    try {
      // Download from Supabase Storage
      const { data: blob, error: dlErr } = await supabase.storage
        .from("audio-full")
        .download(track.fileFullPath);
      if (dlErr || !blob) {
        console.log(`${progress} ❌ ${track.artistName} - ${track.title} — download failed: ${dlErr?.message}`);
        failed++;
        continue;
      }

      const buffer = Buffer.from(await blob.arrayBuffer());
      writeFileSync(tmpPath, buffer);

      // Probe duration
      const duration = await probeDuration(tmpPath);

      console.log(`${progress} ✓  ${track.artistName} - ${track.title} — ${duration}s`);

      // Update DB
      if (APPLY) {
        await db.update(tracks).set({ durationSeconds: duration }).where(eq(tracks.id, track.id));
      }

      ok++;
    } catch (err) {
      console.log(`${progress} ❌ ${track.artistName} - ${track.title} — ${String(err)}`);
      failed++;
    } finally {
      try { unlinkSync(tmpPath); } catch {}
    }
  }

  console.log(`\nDone. ok=${ok} failed=${failed}`);
  if (!APPLY) console.log("Re-run with --apply to actually update the DB.");

  await pg.end();
})();
