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

// Update playlist
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of ["slug", "nameFr", "nameEn", "descriptionFr", "descriptionEn", "gradient", "emoji", "isPublished", "displayOrder"]) {
    if (body[key] !== undefined) updateData[key] = body[key];
  }

  await db.update(playlists).set(updateData).where(eq(playlists.id, id));
  return NextResponse.json({ success: true });
}

// Delete playlist
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await db.delete(playlists).where(eq(playlists.id, id));
  return NextResponse.json({ success: true });
}
