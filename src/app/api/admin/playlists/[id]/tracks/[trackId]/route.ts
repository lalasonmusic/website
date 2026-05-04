import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles, playlistTracks } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  return profile?.role === "admin" ? user : null;
}

// PATCH a track within a playlist (currently only updates is_demo).
// When is_demo=true, atomically resets is_demo on all other tracks in the
// same playlist before setting it on the target — guarantees max 1 demo per
// playlist (also enforced at the DB level via the partial unique index).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; trackId: string }> },
) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: playlistId, trackId } = await params;
  const body = await req.json();

  if (typeof body.isDemo !== "boolean") {
    return NextResponse.json({ error: "isDemo (boolean) required" }, { status: 400 });
  }
  const isDemo: boolean = body.isDemo;

  await db.transaction(async (tx) => {
    if (isDemo) {
      // Clear any existing demo on other tracks in this playlist first
      await tx
        .update(playlistTracks)
        .set({ isDemo: false })
        .where(
          and(
            eq(playlistTracks.playlistId, playlistId),
            ne(playlistTracks.trackId, trackId),
          ),
        );
    }
    await tx
      .update(playlistTracks)
      .set({ isDemo })
      .where(
        and(
          eq(playlistTracks.playlistId, playlistId),
          eq(playlistTracks.trackId, trackId),
        ),
      );
  });

  return NextResponse.json({ success: true });
}
