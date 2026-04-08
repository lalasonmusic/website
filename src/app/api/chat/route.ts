import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabase/admin";
import faqData from "@/data/faq.json";

const anthropic = new Anthropic();

type FAQEntry = {
  id: number;
  category: string;
  question: string;
  answer: string;
  escalate: boolean;
};

const faq = (faqData as { faq: FAQEntry[] }).faq;

// Build a concise FAQ context for the system prompt
const faqContext = faq
  .map((f) => `[${f.id}] ${f.category} - Q: ${f.question}\n   R: ${f.answer}${f.escalate ? " [ESCALATE]" : ""}`)
  .join("\n\n");

const SYSTEM_PROMPT = `Tu es l'assistant virtuel de Lalason, une plateforme de musique libre de droits pour créateurs de contenu et professionnels.

Tu dois répondre aux questions en te basant UNIQUEMENT sur la FAQ ci-dessous.

RÈGLES STRICTES (à respecter absolument):

1. **NE JAMAIS donner l'email contact@lalason.com ni aucune adresse email dans tes réponses.**
2. **NE JAMAIS dire "envoyez-nous un email", "contactez-nous par email", "écrivez-nous à contact@..."** — utilise toujours l'escalade à la place.
3. Réponds de manière concise (2-4 phrases max) et chaleureuse.
4. Utilise exactement les informations de la FAQ, ne les invente pas.
5. Réponds dans la langue de l'utilisateur (français ou anglais).
6. Ne mentionne JAMAIS que tu es Claude ou une IA d'Anthropic. Tu es "l'assistant Lalason".

QUAND ESCALADER (commencer ta réponse par "ESCALATE:"):

- Si la question n'est pas couverte par la FAQ
- Si la FAQ indique [ESCALATE] pour cette question
- Si l'utilisateur demande explicitement à parler à un humain / à l'équipe
- Si l'utilisateur a une demande spécifique (devis, partenariat, usage particulier, problème technique non couvert)
- Si l'utilisateur demande comment contacter l'équipe/support

FORMAT D'ESCALADE (obligatoire):
Réponds uniquement par: "ESCALATE: Je transmets votre demande à notre équipe. Remplissez le formulaire ci-dessous et nous vous répondrons rapidement."

Ne donne JAMAIS d'email ni de numéro de téléphone. Le formulaire d'escalade est automatique.

FAQ LALASON:
${faqContext}`;

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId, history } = await req.json();

    if (!message || !sessionId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Build conversation history for Claude
    const messages: { role: "user" | "assistant"; content: string }[] = [];
    if (Array.isArray(history)) {
      for (const h of history.slice(-6)) {
        if (h.role === "user" || h.role === "assistant") {
          messages.push({ role: h.role, content: h.content });
        }
      }
    }
    messages.push({ role: "user", content: message });

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages,
    });

    const botAnswer = response.content[0].type === "text" ? response.content[0].text : "";
    const needsEscalation = botAnswer.includes("ESCALATE:");
    const cleanAnswer = botAnswer.replace(/^ESCALATE:\s*/, "").replace("ESCALATE:", "").trim();

    // Geolocation from Vercel headers
    const country = req.headers.get("x-vercel-ip-country") ?? null;
    const city = req.headers.get("x-vercel-ip-city") ? decodeURIComponent(req.headers.get("x-vercel-ip-city")!) : null;
    const page = req.headers.get("referer") ?? null;

    // Log the message
    try {
      await supabaseAdmin.from("chat_messages").insert({
        session_id: sessionId,
        user_question: message,
        bot_answer: cleanAnswer,
        escalated: false,
        status: needsEscalation ? "needs_info" : "resolved",
        page,
        country,
        city,
      });
    } catch (err) {
      console.error("[chat] log error:", err);
    }

    return NextResponse.json({
      answer: cleanAnswer,
      needsEscalation,
    });
  } catch (err) {
    console.error("[chat] error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
