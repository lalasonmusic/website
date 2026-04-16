import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
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

  const { sessionId, message } = await req.json();
  if (!sessionId || !message?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("live_chat_messages")
    .insert({ session_id: sessionId, sender: "admin", message: message.trim() })
    .select()
    .single();

  if (error) {
    console.error("[admin/chat/send]", error);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }

  // Auto-activate takeover when admin sends first message
  await supabaseAdmin
    .from("visitor_sessions")
    .update({ admin_takeover: true })
    .eq("session_id", sessionId);

  return NextResponse.json({ message: data });
}
