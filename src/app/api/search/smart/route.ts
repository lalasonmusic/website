import { NextRequest, NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const CATEGORIES = {
  styles: ["funk-jazz", "chill-out", "cinematique", "world", "electronique", "lofi", "hip-hop-urban", "pop-rock"],
  moods: ["dramatique", "heureux", "calme", "triste", "energique", "suspens", "romantique"],
  themes: ["sport", "publicite", "film", "meditation", "jeu-video", "documentaire", "tutoriel", "vlog", "voyage-nature"],
};

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI search not configured" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const query = body?.query?.trim();
  if (!query || query.length < 3) {
    return NextResponse.json({ error: "Query too short" }, { status: 400 });
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 150,
        messages: [
          {
            role: "user",
            content: `You are a music search assistant for a royalty-free music library. A user is searching for music. Interpret their query and map it to the most relevant categories.

User query: "${query}"

Available categories:
- Styles: ${CATEGORIES.styles.join(", ")}
- Moods: ${CATEGORIES.moods.join(", ")}
- Themes: ${CATEGORIES.themes.join(", ")}

Also extract any keywords that could match track titles or artist names.

Respond ONLY with valid JSON:
{"styles":["..."],"moods":["..."],"themes":["..."],"keywords":["..."]}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({ styles: [], moods: [], themes: [], keywords: [query] });
    }

    const data = await res.json();
    const text = data.content?.[0]?.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return NextResponse.json({
        styles: (parsed.styles ?? []).filter((s: string) => CATEGORIES.styles.includes(s)),
        moods: (parsed.moods ?? []).filter((m: string) => CATEGORIES.moods.includes(m)),
        themes: (parsed.themes ?? []).filter((t: string) => CATEGORIES.themes.includes(t)),
        keywords: parsed.keywords ?? [],
      });
    }
  } catch {}

  // Fallback: return the query as keyword
  return NextResponse.json({ styles: [], moods: [], themes: [], keywords: [query] });
}
