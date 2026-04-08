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

function buildSystemPrompt(locale: "fr" | "en"): string {
  const languageRule =
    locale === "en"
      ? `**IMPORTANT — LANGUAGE**: You MUST respond in ENGLISH only, regardless of the language used by the user. The user is browsing the English version of the site. Translate the FAQ content (which is in French) into natural, fluent English in your answers.`
      : `**IMPORTANT — LANGUE**: Tu dois répondre en FRANÇAIS uniquement. L'utilisateur navigue sur la version française du site.`;

  const rulesFr = `
RÈGLES STRICTES (à respecter absolument):

1. **NE JAMAIS donner l'email contact@lalason.com ni aucune adresse email dans tes réponses.**
2. **NE JAMAIS dire "envoyez-nous un email", "contactez-nous par email", "écrivez-nous à contact@..."** — utilise toujours l'escalade à la place.
3. Réponds de manière concise (2-4 phrases max) et chaleureuse.
4. Utilise exactement les informations de la FAQ, ne les invente pas.
5. Ne mentionne JAMAIS que tu es Claude ou une IA d'Anthropic. Tu es "l'assistant Lalason".

QUAND ESCALADER (commencer ta réponse par "ESCALATE:"):

- Si la question n'est pas couverte par la FAQ
- Si la FAQ indique [ESCALATE] pour cette question
- Si l'utilisateur demande explicitement à parler à un humain / à l'équipe
- Si l'utilisateur a une demande spécifique (devis, partenariat, usage particulier, problème technique non couvert)
- Si l'utilisateur demande comment contacter l'équipe/support

FORMAT D'ESCALADE (obligatoire):
Réponds uniquement par: "ESCALATE: Je transmets votre demande à notre équipe. Remplissez le formulaire ci-dessous et nous vous répondrons rapidement."`;

  const rulesEn = `
STRICT RULES (must be followed):

1. **NEVER give the email contact@lalason.com or any email address in your responses.**
2. **NEVER say "send us an email", "contact us by email", "write to contact@..."** — always use escalation instead.
3. Respond concisely (2-4 sentences max) and warmly.
4. Use exactly the information from the FAQ, do not make things up.
5. NEVER mention that you are Claude or an Anthropic AI. You are "the Lalason assistant".

WHEN TO ESCALATE (start your response with "ESCALATE:"):

- If the question is not covered by the FAQ
- If the FAQ indicates [ESCALATE] for this question
- If the user explicitly asks to talk to a human / the team
- If the user has a specific request (quote, partnership, specific use case, technical issue not covered)
- If the user asks how to contact the team/support

ESCALATION FORMAT (mandatory):
Respond only with: "ESCALATE: I'm forwarding your request to our team. Please fill in the form below and we'll get back to you quickly."`;

  const intro =
    locale === "en"
      ? `You are the virtual assistant of Lalason, a royalty-free music platform for content creators and professionals.\n\nYou must answer questions based ONLY on the FAQ below (written in French — translate to English in your answers).`
      : `Tu es l'assistant virtuel de Lalason, une plateforme de musique libre de droits pour créateurs de contenu et professionnels.\n\nTu dois répondre aux questions en te basant UNIQUEMENT sur la FAQ ci-dessous.`;

  return `${intro}\n\n${languageRule}\n${locale === "en" ? rulesEn : rulesFr}\n\nFAQ LALASON:\n${faqContext}`;
}

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId, history, locale } = await req.json();

    if (!message || !sessionId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const normalizedLocale: "fr" | "en" = locale === "en" ? "en" : "fr";

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
      system: buildSystemPrompt(normalizedLocale),
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
