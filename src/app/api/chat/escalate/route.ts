import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, email, name, question } = await req.json();

    if (!sessionId || !email || !question) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const country = req.headers.get("x-vercel-ip-country") ?? null;
    const city = req.headers.get("x-vercel-ip-city") ? decodeURIComponent(req.headers.get("x-vercel-ip-city")!) : null;
    const page = req.headers.get("referer") ?? null;

    // Insert escalated message
    const { error } = await supabaseAdmin.from("chat_messages").insert({
      session_id: sessionId,
      user_question: question,
      bot_answer: null,
      escalated: true,
      customer_email: email,
      customer_name: name ?? null,
      status: "pending",
      page,
      country,
      city,
    });

    if (error) {
      console.error("[chat/escalate] error:", error.message);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[chat/escalate] error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
