import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { db } from "@/db";
import { profiles, tracks, artists, trackCategories, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

// Parse "Artist - Title.mp3" → { artist, title }
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

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile] = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];

  if (files.length === 0) {
    return NextResponse.json({ error: "No files" }, { status: 400 });
  }

  // Get all artists and categories
  const [allArtists, allCategories] = await Promise.all([
    db.select({ id: artists.id, name: artists.name }).from(artists),
    db.select({ id: categories.id, slug: categories.slug, labelFr: categories.labelFr, type: categories.type }).from(categories),
  ]);

  const artistMap = new Map(allArtists.map((a) => [a.name.toLowerCase(), a.id]));
  const catSlugMap = new Map(allCategories.map((c) => [c.slug, c.id]));

  const results: { filename: string; status: string; error?: string }[] = [];
  const tracksForAi: { index: number; title: string; artist: string }[] = [];
  const createdTrackIds: { index: number; trackId: string }[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const parsed = parseFilename(file.name);

    if (!parsed) {
      results.push({ filename: file.name, status: "error", error: "Format invalide. Utilisez: Artiste - Titre.mp3" });
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
        // Artist slug conflict — fetch existing
        const [existing] = await db.select({ id: artists.id }).from(artists).where(eq(artists.slug, artistSlug)).limit(1);
        artistId = existing?.id;
      }
    }

    if (!artistId) {
      results.push({ filename: file.name, status: "error", error: "Artiste non trouvé" });
      continue;
    }

    const slug = generateSlug(parsed.artist, parsed.title);
    const fileName = `${slug}.mp3`;

    // Upload to storage
    try {
      const buffer = Buffer.from(await file.arrayBuffer());

      await supabaseAdmin.storage
        .from("audio-full")
        .upload(fileName, buffer, { contentType: "audio/mpeg", upsert: true });

      const { error: prevErr } = await supabaseAdmin.storage
        .from("audio-previews")
        .upload(fileName, buffer, { contentType: "audio/mpeg", upsert: true });

      const previewUrl = !prevErr
        ? supabaseAdmin.storage.from("audio-previews").getPublicUrl(fileName).data.publicUrl
        : null;

      // Insert track
      const [newTrack] = await db
        .insert(tracks)
        .values({
          slug,
          title: parsed.title,
          artistId,
          fileFullPath: fileName,
          filePreviewPath: previewUrl,
          isPublished: false,
        })
        .onConflictDoNothing()
        .returning({ id: tracks.id });

      if (newTrack) {
        tracksForAi.push({ index: i, title: parsed.title, artist: parsed.artist });
        createdTrackIds.push({ index: i, trackId: newTrack.id });
        results.push({ filename: file.name, status: "ok" });
      } else {
        results.push({ filename: file.name, status: "skipped", error: "Morceau déjà existant" });
      }
    } catch (err) {
      results.push({ filename: file.name, status: "error", error: String(err) });
    }
  }

  // AI categorization for all new tracks
  if (tracksForAi.length > 0) {
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
    } catch (err) {
      console.error("[bulk-upload] AI categorization failed:", err);
    }
  }

  const okCount = results.filter((r) => r.status === "ok").length;
  const errorCount = results.filter((r) => r.status === "error").length;
  const skippedCount = results.filter((r) => r.status === "skipped").length;

  return NextResponse.json({
    summary: { total: files.length, ok: okCount, errors: errorCount, skipped: skippedCount },
    results,
  });
}
