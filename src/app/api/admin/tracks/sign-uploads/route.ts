import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

const ACCEPTED_EXT = /\.(mp3|wav)$/i;

function parseFilename(filename: string): { artist: string; title: string; ext: "mp3" | "wav" } | null {
  const match = filename.match(/\.(mp3|wav)$/i);
  if (!match) return null;
  const ext = match[1].toLowerCase() as "mp3" | "wav";
  const clean = filename.replace(ACCEPTED_EXT, "").trim();
  const sep = clean.indexOf(" - ");
  if (sep === -1) return null;
  return {
    artist: clean.substring(0, sep).trim(),
    title: clean.substring(sep + 3).trim(),
    ext,
  };
}

function generateSlug(artist: string, title: string): string {
  return `${artist}-${title}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type SignedUpload = {
  filename: string;
  slug?: string;
  path?: string;
  token?: string;
  ext?: "mp3" | "wav";
  error?: string;
};

export async function POST(req: NextRequest) {
  // Auth: admin only
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { filenames } = (await req.json()) as { filenames: string[] };
  if (!Array.isArray(filenames) || filenames.length === 0) {
    return NextResponse.json({ error: "No filenames" }, { status: 400 });
  }

  const uploads: SignedUpload[] = [];

  for (const filename of filenames) {
    const parsed = parseFilename(filename);
    if (!parsed) {
      uploads.push({ filename, error: "Format invalide. Utilisez: Artiste - Titre.mp3 ou .wav" });
      continue;
    }

    const slug = generateSlug(parsed.artist, parsed.title);
    const path = `${slug}.${parsed.ext}`;

    // Remove any existing files (both mp3 and wav) to avoid stale versions and 409 conflicts.
    // createSignedUploadUrl doesn't support upsert, so we clear both companions.
    await supabaseAdmin.storage.from("audio-full").remove([`${slug}.mp3`, `${slug}.wav`]);

    const { data, error } = await supabaseAdmin.storage
      .from("audio-full")
      .createSignedUploadUrl(path);

    if (error || !data) {
      uploads.push({ filename, error: error?.message ?? "Échec création URL signée" });
      continue;
    }

    uploads.push({ filename, slug, path: data.path, token: data.token, ext: parsed.ext });
  }

  return NextResponse.json({ uploads });
}
