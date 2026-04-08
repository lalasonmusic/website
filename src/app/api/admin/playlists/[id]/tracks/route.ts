import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles, playlistTracks } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const [profile] = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, user.id)).limit(1);
  return profile?.role === "admin" ? user : null;
}

// Add a track to a playlist
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: playlistId } = await params;
  const { trackId } = await req.json();

  if (!trackId) return NextResponse.json({ error: "Missing trackId" }, { status: 400 });

  // Find the next position
  const [maxPos] = await db
    .select({ max: sql<number>`COALESCE(MAX(${playlistTracks.position}), -1)` })
    .from(playlistTracks)
    .where(eq(playlistTracks.playlistId, playlistId));

  const nextPosition = (maxPos?.max ?? -1) + 1;

  try {
    await db.insert(playlistTracks).values({
      playlistId,
      trackId,
      position: nextPosition,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Track already in playlist" }, { status: 409 });
  }
}

// Remove a track from a playlist
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: playlistId } = await params;
  const { trackId } = await req.json();

  if (!trackId) return NextResponse.json({ error: "Missing trackId" }, { status: 400 });

  await db
    .delete(playlistTracks)
    .where(and(eq(playlistTracks.playlistId, playlistId), eq(playlistTracks.trackId, trackId)));

  return NextResponse.json({ success: true });
}
