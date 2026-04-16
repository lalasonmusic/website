import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  const after = req.nextUrl.searchParams.get("after");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  // Fetch admin messages the visitor hasn't seen yet
  let query = supabaseAdmin
    .from("live_chat_messages")
    .select("id, sender, message, created_at")
    .eq("session_id", sessionId)
    .eq("sender", "admin")
    .order("created_at", { ascending: true });

  if (after) {
    query = query.gt("created_at", after);
  }

  const { data } = await query;

  // Takeover status
  const { data: session } = await supabaseAdmin
    .from("visitor_sessions")
    .select("admin_takeover")
    .eq("session_id", sessionId)
    .single();

  return NextResponse.json({
    messages: data ?? [],
    adminTakeover: session?.admin_takeover ?? false,
  });
}
