import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

function parseFilename(filename: string): { artist: string; title: string } | null {
  const clean = filename.replace(/\.mp3$/i, "").trim();
  const sep = clean.indexOf(" - ");
  if (sep === -1) return null;
  return {
    artist: clean.substring(0, sep).trim(),
    title: clean.substring(sep + 3).trim(),
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
      uploads.push({ filename, error: "Format invalide. Utilisez: Artiste - Titre.mp3" });
      continue;
    }

    const slug = generateSlug(parsed.artist, parsed.title);
    const path = `${slug}.mp3`;

    // Remove existing file first so signed URL upload doesn't 409 (createSignedUploadUrl
    // doesn't support upsert; we emulate it by deleting any prior copy).
    await supabaseAdmin.storage.from("audio-full").remove([path]);

    const { data, error } = await supabaseAdmin.storage
      .from("audio-full")
      .createSignedUploadUrl(path);

    if (error || !data) {
      uploads.push({ filename, error: error?.message ?? "Échec création URL signée" });
      continue;
    }

    uploads.push({ filename, slug, path: data.path, token: data.token });
  }

  return NextResponse.json({ uploads });
}
