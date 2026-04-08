import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles, playlists } from "@/db/schema";
import { eq } from "drizzle-orm";

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const [profile] = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, user.id)).limit(1);
  return profile?.role === "admin" ? user : null;
}

// Create new playlist
export async function POST(req: NextRequest) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { slug, nameFr, nameEn, descriptionFr, descriptionEn, gradient, emoji, isPublished, displayOrder } = body;

  if (!slug || !nameFr || !nameEn) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const [created] = await db
      .insert(playlists)
      .values({
        slug,
        nameFr,
        nameEn,
        descriptionFr: descriptionFr ?? null,
        descriptionEn: descriptionEn ?? null,
        gradient: gradient ?? "linear-gradient(135deg, #1b3a4b 0%, #0f2533 100%)",
        emoji: emoji ?? null,
        isPublished: isPublished ?? true,
        displayOrder: displayOrder ?? 0,
      })
      .returning();

    return NextResponse.json({ playlist: created });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
