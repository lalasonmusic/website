import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  if (profile?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId)
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

  // Bot conversation history (Q&A pairs → individual messages)
  const { data: botRows } = await supabaseAdmin
    .from("chat_messages")
    .select("user_question, bot_answer, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  // Live chat messages
  const { data: liveRows } = await supabaseAdmin
    .from("live_chat_messages")
    .select("sender, message, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  // Merge into unified timeline
  type Msg = { sender: string; message: string; created_at: string };
  const timeline: Msg[] = [];

  for (const m of botRows ?? []) {
    if (m.user_question) {
      timeline.push({ sender: "visitor", message: m.user_question, created_at: m.created_at });
    }
    if (m.bot_answer) {
      timeline.push({ sender: "bot", message: m.bot_answer, created_at: m.created_at });
    }
  }

  for (const m of liveRows ?? []) {
    timeline.push({ sender: m.sender, message: m.message, created_at: m.created_at });
  }

  timeline.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // Takeover status
  const { data: session } = await supabaseAdmin
    .from("visitor_sessions")
    .select("admin_takeover")
    .eq("session_id", sessionId)
    .single();

  return NextResponse.json({
    messages: timeline,
    adminTakeover: session?.admin_takeover ?? false,
  });
}
