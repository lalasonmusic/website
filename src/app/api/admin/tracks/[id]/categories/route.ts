import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles, trackCategories } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const [profile] = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (profile?.role !== "admin") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };

  return { userId: user.id };
}

// PUT /api/admin/tracks/:id/categories
// Body: { categoryIds: string[] }
// Replaces the track's categories with the given set.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id: trackId } = await params;
  const { categoryIds } = (await req.json()) as { categoryIds: string[] };

  if (!Array.isArray(categoryIds)) {
    return NextResponse.json({ error: "categoryIds must be an array" }, { status: 400 });
  }

  // Clear existing categories, then insert the new set
  await db.delete(trackCategories).where(eq(trackCategories.trackId, trackId));

  if (categoryIds.length > 0) {
    await db.insert(trackCategories).values(
      categoryIds.map((categoryId) => ({ trackId, categoryId }))
    ).onConflictDoNothing();
  }

  return NextResponse.json({ success: true });
}
