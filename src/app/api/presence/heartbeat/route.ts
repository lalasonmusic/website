import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { sessionId, page } = await req.json();
  if (!sessionId || !page) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Geolocation from Vercel headers
  const country = req.headers.get("x-vercel-ip-country") ?? null;
  const city = req.headers.get("x-vercel-ip-city") ? decodeURIComponent(req.headers.get("x-vercel-ip-city")!) : null;
  const region = req.headers.get("x-vercel-ip-country-region") ?? null;

  // Check if user is logged in
  let userId: string | null = null;
  let email: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      email = user.email ?? null;
    }
  } catch {}

  // Upsert visitor session
  const { error } = await supabaseAdmin
    .from("visitor_sessions")
    .upsert(
      {
        session_id: sessionId,
        user_id: userId,
        email,
        page,
        country,
        city,
        region,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "session_id" }
    );

  if (error) {
    console.error("[presence] upsert error:", error.message);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
