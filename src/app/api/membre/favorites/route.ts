import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { trackFavorites, subscriptions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

async function requireCreatorUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [sub] = await db
    .select({ planType: subscriptions.planType })
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, "active")))
    .limit(1);

  if (!sub) return null;
  if (sub.planType !== "creators_monthly" && sub.planType !== "creators_annual") return null;

  return user;
}

// GET — list all favorite track IDs (and creation dates) for the current user
export async function GET() {
  const user = await requireCreatorUser();
  if (!user) return NextResponse.json({ favorites: [] });

  const rows = await db
    .select({ trackId: trackFavorites.trackId, createdAt: trackFavorites.createdAt })
    .from(trackFavorites)
    .where(eq(trackFavorites.userId, user.id))
    .orderBy(desc(trackFavorites.createdAt));

  return NextResponse.json({ favorites: rows });
}

// POST — add a track to favorites
export async function POST(req: NextRequest) {
  const user = await requireCreatorUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { trackId } = await req.json();
  if (!trackId) {
    return NextResponse.json({ error: "Missing trackId" }, { status: 400 });
  }

  await db
    .insert(trackFavorites)
    .values({ userId: user.id, trackId })
    .onConflictDoNothing();

  return NextResponse.json({ success: true });
}

// DELETE — remove a track from favorites
export async function DELETE(req: NextRequest) {
  const user = await requireCreatorUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { trackId } = await req.json();
  if (!trackId) {
    return NextResponse.json({ error: "Missing trackId" }, { status: 400 });
  }

  await db
    .delete(trackFavorites)
    .where(and(eq(trackFavorites.userId, user.id), eq(trackFavorites.trackId, trackId)));

  return NextResponse.json({ success: true });
}
