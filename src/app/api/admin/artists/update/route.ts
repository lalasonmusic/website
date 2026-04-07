import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles, artists } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile] = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { artistId, bioFr, bioEn, photoUrl } = await req.json();
  if (!artistId) return NextResponse.json({ error: "Missing artistId" }, { status: 400 });

  const updateData: Record<string, string | null> = {};
  if (bioFr !== undefined) updateData.bioFr = bioFr;
  if (bioEn !== undefined) updateData.bioEn = bioEn;
  if (photoUrl !== undefined) updateData.photoUrl = photoUrl;

  await db.update(artists).set(updateData).where(eq(artists.id, artistId));

  return NextResponse.json({ success: true });
}
