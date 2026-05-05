import ffmpeg from "fluent-ffmpeg";
import { writeFileSync, readFileSync, unlinkSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

// Lazy ffmpeg/ffprobe init (mirrors bulk-upload pattern). Surfaces a
// JSON-friendly error if a platform-specific native binary is missing
// instead of crashing at module load.
let ffmpegReady: { ok: true } | { ok: false; error: string } | null = null;

async function ensureFfmpeg(): Promise<{ ok: true } | { ok: false; error: string }> {
  if (ffmpegReady) return ffmpegReady;
  try {
    const ffmpegMod = await import("ffmpeg-static");
    const ffprobeMod = await import("@ffprobe-installer/ffprobe");
    const ffmpegPath =
      (ffmpegMod as unknown as { default?: string }).default ?? (ffmpegMod as unknown as string);
    const ffprobePath =
      ffprobeMod.path ?? (ffprobeMod as unknown as { default?: { path: string } }).default?.path;
    if (!ffmpegPath) throw new Error("ffmpeg-static returned no path");
    if (!ffprobePath) throw new Error("ffprobe-installer returned no path");
    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfprobePath(ffprobePath);
    ffmpegReady = { ok: true };
  } catch (err) {
    ffmpegReady = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
  return ffmpegReady;
}

/**
 * Transcodes an MP3 buffer to a WAV buffer. Used for on-demand WAV
 * downloads — see /api/tracks/[id]/wav/route.ts. Returns null on failure.
 */
export async function convertMp3ToWav(mp3Buffer: Buffer, label: string): Promise<Buffer | null> {
  const ff = await ensureFfmpeg();
  if (!ff.ok) {
    console.error("[transcode] ffmpeg unavailable:", ff.error);
    return null;
  }

  const tmpDir = join(tmpdir(), "lalason-transcode");
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

  const stamp = Date.now();
  const tmpMp3 = join(tmpDir, `${label}-${stamp}.mp3`);
  const tmpWav = join(tmpDir, `${label}-${stamp}.wav`);

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
    console.error("[transcode] convertMp3ToWav error:", err);
    return null;
  } finally {
    try { unlinkSync(tmpMp3); } catch {}
    try { unlinkSync(tmpWav); } catch {}
  }
}
