import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles, tracks } from "@/db/schema";
import { eq, not } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile] = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { trackId } = await req.json();
  if (!trackId) return NextResponse.json({ error: "Missing trackId" }, { status: 400 });

  await db
    .update(tracks)
    .set({ isPublished: not(tracks.isPublished) })
    .where(eq(tracks.id, trackId));

  return NextResponse.json({ success: true });
}
